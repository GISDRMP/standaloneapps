import type { WorkBook } from 'xlsx';
import type {
  BaseInputDefinition,
  BaseInputs,
  CountdownStage,
  ElectricalEdge,
  FacilityAsset,
  LaunchPad,
  MockData,
  PowerSource,
  ScenarioState,
  VehicleType,
} from '../types';

interface WorkbookImportResult {
  data: MockData;
  baseInputs: BaseInputs;
  scenario: Partial<ScenarioState>;
  selectedMission?: string;
  selectedPadId?: string;
  summary: string;
}

type Row = Record<string, unknown>;
type XlsxModule = typeof import('xlsx');

const vehicleTypes: VehicleType[] = [
  'Falcon 9',
  'Falcon Heavy',
  'SLS',
  'Small Launcher',
];

const countdownStages: CountdownStage[] = [
  'Idle',
  'Fueling',
  'Terminal Countdown',
  'Engine Chill',
  'Ignition',
  'Launch',
];

const breakerStatuses: FacilityAsset['breakerStatus'][] = [
  'Closed',
  'Open',
  'Standby',
  'Locked Out',
];

const facilityTypes: FacilityAsset['type'][] = [
  'grid',
  'substation',
  'bus',
  'feeder',
  'pad',
  'facility',
];

const sourceModes: PowerSource['mode'][] = [
  'import',
  'standby',
  'charging',
  'generation',
];

const normalizeKey = (key: string) =>
  key
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const normalizedRow = (row: Row) =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeKey(key), value]),
  );

const text = (row: Row, keys: string[], fallback = '') => {
  const normalized = normalizedRow(row);
  for (const key of keys) {
    const value = normalized[normalizeKey(key)];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return fallback;
};

const numberValue = (row: Row, keys: string[], fallback = 0) => {
  const raw = text(row, keys, '');
  if (raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const oneOf = <T extends string>(value: string, values: readonly T[], fallback: T) =>
  values.find((candidate) => candidate.toLowerCase() === value.toLowerCase()) ??
  fallback;

const listValue = (value: string) =>
  value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const rowsFromSheet = (
  workbook: WorkBook,
  sheetName: string,
  xlsx: XlsxModule,
) => {
  const actualName = workbook.SheetNames.find(
    (name) => normalizeKey(name) === normalizeKey(sheetName),
  );
  if (!actualName) return [];

  const sheet = workbook.Sheets[actualName];
  return xlsx.utils.sheet_to_json<Row>(sheet, {
    defval: '',
    raw: false,
  });
};

const parseMissions = (rows: Row[], fallback: string[]) => {
  const missions = rows.map((row) => text(row, ['mission'])).filter(Boolean);
  return missions.length ? missions : fallback;
};

const parseVehicles = (rows: Row[], fallback: VehicleType[]) => {
  const vehicles = rows
    .map((row) => oneOf(text(row, ['vehicle']), vehicleTypes, 'Falcon 9'))
    .filter((vehicle, index, array) => array.indexOf(vehicle) === index);
  return vehicles.length ? vehicles : fallback;
};

const parseLaunchPads = (rows: Row[], fallback: LaunchPad[]) => {
  const launchPads = rows
    .map((row) => {
      const id = text(row, ['id']);
      if (!id) return null;

      return {
        id,
        name: text(row, ['name'], id),
        operator: text(row, ['operator'], 'Unassigned'),
        vehicles: listValue(text(row, ['vehicles'])).map((vehicle) =>
          oneOf(vehicle, vehicleTypes, 'Falcon 9'),
        ),
        capacityMw: numberValue(row, ['capacityMw', 'capacity MW'], 0),
        idleMw: numberValue(row, ['idleMw', 'idle MW'], 0),
      } satisfies LaunchPad;
    })
    .filter((pad): pad is LaunchPad => Boolean(pad));

  return launchPads.length ? launchPads : fallback;
};

const parseBaseInputs = (
  rows: Row[],
  fallback: BaseInputDefinition[],
): BaseInputDefinition[] => {
  const allowedKeys = new Set(fallback.map((input) => input.key));
  const baseInputs = rows
    .map((row) => {
      const key = text(row, ['key']) as BaseInputDefinition['key'];
      if (!allowedKeys.has(key)) return null;

      return {
        key,
        label: text(
          row,
          ['label'],
          fallback.find((input) => input.key === key)?.label ?? key,
        ),
        defaultMw: numberValue(row, ['defaultMw', 'default MW'], 0),
        min: numberValue(row, ['min'], 0),
        max: numberValue(row, ['max'], 100),
        step: numberValue(row, ['step'], 0.1),
      } satisfies BaseInputDefinition;
    })
    .filter((input): input is BaseInputDefinition => Boolean(input));

  return baseInputs.length ? baseInputs : fallback;
};

const parseFacilities = (rows: Row[], fallback: FacilityAsset[]) => {
  const facilities = rows
    .map((row) => {
      const id = text(row, ['id']);
      if (!id) return null;

      return {
        id,
        label: text(row, ['label'], id),
        type: oneOf(text(row, ['type']), facilityTypes, 'facility'),
        operator: text(row, ['operator'], 'Unassigned'),
        voltageKv: numberValue(row, ['voltageKv', 'voltage kV'], 13.8),
        capacityMw: numberValue(row, ['capacityMw', 'capacity MW'], 1),
        baseMw: numberValue(row, ['baseMw', 'base MW'], 0),
        peakMw: numberValue(row, ['peakMw', 'peak MW'], 0),
        breakerStatus: oneOf(
          text(row, ['breakerStatus', 'breaker status']),
          breakerStatuses,
          'Closed',
        ),
        position: {
          x: numberValue(row, ['positionX', 'position x', 'x'], 0),
          y: numberValue(row, ['positionY', 'position y', 'y'], 0),
        },
      } satisfies FacilityAsset;
    })
    .filter((facility): facility is FacilityAsset => Boolean(facility));

  return facilities.length ? facilities : fallback;
};

const parseEdges = (rows: Row[], fallback: ElectricalEdge[]) => {
  const edges = rows
    .map((row) => {
      const id = text(row, ['id']);
      const source = text(row, ['source']);
      const target = text(row, ['target']);
      if (!id || !source || !target) return null;

      return {
        id,
        source,
        target,
        voltageKv: numberValue(row, ['voltageKv', 'voltage kV'], 13.8),
        capacityMw: numberValue(row, ['capacityMw', 'capacity MW'], 1),
        label: text(row, ['label'], id),
      } satisfies ElectricalEdge;
    })
    .filter((edge): edge is ElectricalEdge => Boolean(edge));

  return edges.length ? edges : fallback;
};

const parsePowerSources = (rows: Row[], fallback: PowerSource[]) => {
  const sources = rows
    .map((row) => {
      const id = text(row, ['id']);
      if (!id) return null;

      return {
        id,
        name: text(row, ['name'], id),
        capacityMw: numberValue(row, ['capacityMw', 'capacity MW'], 0),
        status: text(row, ['status'], 'Online'),
        mode: oneOf(text(row, ['mode']), sourceModes, 'generation'),
      } satisfies PowerSource;
    })
    .filter((source): source is PowerSource => Boolean(source));

  return sources.length ? sources : fallback;
};

const parseScenario = (rows: Row[]) => {
  const scenario: Partial<ScenarioState> = {};
  let selectedMission: string | undefined;
  let selectedPadId: string | undefined;

  rows.forEach((row) => {
    const key = normalizeKey(text(row, ['key', 'setting']));
    const value = text(row, ['value']);
    if (!key || !value) return;

    if (key === 'selectedmission') selectedMission = value;
    if (key === 'selectedpadid') selectedPadId = value;
    if (key === 'activepads') scenario.activePads = Number(value);
    if (key === 'rocket') scenario.rocket = oneOf(value, vehicleTypes, 'Falcon 9');
    if (key === 'fuelingrate') scenario.fuelingRate = Number(value);
    if (key === 'cryogenicloading') scenario.cryogenicLoading = Number(value);
    if (key === 'ambienttemperature') scenario.ambientTemperature = Number(value);
    if (key === 'windspeed') scenario.windSpeed = Number(value);
    if (key === 'countdownstage') {
      scenario.countdownStage = oneOf(value, countdownStages, 'Terminal Countdown');
    }
    if (key === 'powerfactor') scenario.powerFactor = Number(value);
  });

  return {
    scenario: Object.fromEntries(
      Object.entries(scenario).filter(([, value]) => Number.isFinite(value) || typeof value === 'string'),
    ) as Partial<ScenarioState>,
    selectedMission,
    selectedPadId,
  };
};

export const createBaseInputsFromDefinitions = (
  baseInputs: BaseInputDefinition[],
) =>
  baseInputs.reduce((acc, input) => {
    acc[input.key] = input.defaultMw;
    return acc;
  }, {} as BaseInputs);

export const importDashboardWorkbook = async (
  file: File,
  fallbackData: MockData,
): Promise<WorkbookImportResult> => {
  const xlsx = await import('xlsx');
  const workbook = xlsx.read(await file.arrayBuffer(), { type: 'array' });
  const baseInputs = parseBaseInputs(
    rowsFromSheet(workbook, 'BaseInputs', xlsx),
    fallbackData.baseInputs,
  );
  const nextData: MockData = {
    missions: parseMissions(
      rowsFromSheet(workbook, 'Missions', xlsx),
      fallbackData.missions,
    ),
    vehicles: parseVehicles(
      rowsFromSheet(workbook, 'Vehicles', xlsx),
      fallbackData.vehicles,
    ),
    launchPads: parseLaunchPads(
      rowsFromSheet(workbook, 'LaunchPads', xlsx),
      fallbackData.launchPads,
    ),
    baseInputs,
    facilities: parseFacilities(
      rowsFromSheet(workbook, 'Facilities', xlsx),
      fallbackData.facilities,
    ),
    edges: parseEdges(rowsFromSheet(workbook, 'Edges', xlsx), fallbackData.edges),
    powerSources: parsePowerSources(
      rowsFromSheet(workbook, 'PowerSources', xlsx),
      fallbackData.powerSources,
    ),
  };
  const parsedScenario = parseScenario(rowsFromSheet(workbook, 'Scenario', xlsx));

  return {
    data: nextData,
    baseInputs: createBaseInputsFromDefinitions(baseInputs),
    scenario: parsedScenario.scenario,
    selectedMission: parsedScenario.selectedMission,
    selectedPadId: parsedScenario.selectedPadId,
    summary: `${nextData.facilities.length} facilities, ${nextData.edges.length} feeders`,
  };
};
