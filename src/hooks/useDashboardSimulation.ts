import { useMemo } from 'react';
import mockData from '../data/mockData.json';
import type {
  AlertItem,
  BaseInputs,
  CountdownStage,
  FacilityMetric,
  FeederMetric,
  MockData,
  RiskLevel,
  ScenarioResults,
  ScenarioState,
  SourceMetric,
  TelemetryPoint,
  TimelinePoint,
  VehicleType,
  WeatherSnapshot,
} from '../types';
import { clamp, round } from '../utils/format';

export const data = mockData as MockData;

const stageMultipliers: Record<CountdownStage, number> = {
  Idle: 0.32,
  Fueling: 0.68,
  'Terminal Countdown': 0.98,
  'Engine Chill': 1.14,
  Ignition: 1.34,
  Launch: 1.55,
};

const vehicleFactors: Record<VehicleType, number> = {
  'Falcon 9': 1,
  'Falcon Heavy': 1.34,
  SLS: 1.72,
  'Small Launcher': 0.62,
};

const getRiskByLoading = (loadingPercent: number): RiskLevel => {
  if (loadingPercent >= 94) return 'critical';
  if (loadingPercent >= 82) return 'high';
  if (loadingPercent >= 68) return 'warning';
  return 'normal';
};

const getRiskByReserve = (
  reservePercent: number,
  loadingPercent: number,
): RiskLevel => {
  if (reservePercent < 6 || loadingPercent >= 94) return 'critical';
  if (reservePercent < 15 || loadingPercent >= 82) return 'high';
  if (reservePercent < 26 || loadingPercent >= 68) return 'warning';
  return 'normal';
};

const facilityNameByPadId: Record<string, string> = {
  'lc-39a': 'launch-pad-39a',
  'lc-39b': 'launch-pad-39b',
  'lc-48': 'lc-48-facility',
};

const timelineLabels = [
  'T - 24 HR',
  'T - 21 HR',
  'T - 18 HR',
  'T - 15 HR',
  'T - 12 HR',
  'T - 9 HR',
  'T - 6 HR',
  'T - 3 HR',
  'T - 90 MIN',
  'T - 30 MIN',
  'T - 15 MIN',
  'T - 5 MIN',
  'LAUNCH',
];

const sourceToFacilityLoad = (facilityId: string, facilityLoads: Record<string, number>) => {
  if (facilityId === 'utility-grid') {
    return Object.values(facilityLoads).reduce((sum, value) => sum + value, 0);
  }
  if (
    facilityId === 'main-substation' ||
    facilityId === 'bus-13-8' ||
    facilityId === 'switchyard' ||
    facilityId === 'high-voltage-substation'
  ) {
    return Object.values(facilityLoads).reduce((sum, value) => sum + value, 0);
  }

  return facilityLoads[facilityId] ?? 0;
};

export const createDefaultBaseInputs = (sourceData: MockData) =>
  sourceData.baseInputs.reduce((acc, input) => {
    acc[input.key] = input.defaultMw;
    return acc;
  }, {} as BaseInputs);

export const defaultBaseInputs = createDefaultBaseInputs(data);

export const defaultScenario: ScenarioState = {
  activePads: 2,
  rocket: 'Falcon 9',
  fuelingRate: 50,
  cryogenicLoading: 60,
  ambientTemperature: 78,
  windSpeed: 14,
  countdownStage: 'Terminal Countdown',
  powerFactor: 0.95,
};

interface SimulationParams {
  data: MockData;
  baseInputs: BaseInputs;
  scenario: ScenarioState;
  selectedPadId: string;
}

export const useDashboardSimulation = ({
  data: sourceData,
  baseInputs,
  scenario,
  selectedPadId,
}: SimulationParams) =>
  useMemo(() => {
    const vehicleFactor = vehicleFactors[scenario.rocket];
    const stageFactor = stageMultipliers[scenario.countdownStage];
    const activePadUnits = Math.max(0.22, scenario.activePads * 0.5);
    const activePadFactor = activePadUnits;
    const fuelingFactor = scenario.fuelingRate / 100;
    const cryogenicFactor = scenario.cryogenicLoading / 100;
    const temperatureLoad =
      Math.max(0, scenario.ambientTemperature - 72) * 0.08 +
      Math.max(0, 62 - scenario.ambientTemperature) * 0.05;
    const windLoad = scenario.windSpeed * 0.024;

    const baseOperations =
      baseInputs.facilityBaseLoad +
      baseInputs.communications +
      baseInputs.lighting +
      baseInputs.hvac +
      baseInputs.miscellaneous +
      temperatureLoad +
      windLoad;

    const padIdleLoad = baseInputs.padIdleLoad * activePadFactor;
    const vehicleSupport =
      activePadUnits *
      vehicleFactor *
      stageFactor *
      (3.2 + fuelingFactor * 8.4);
    const launchPadSystems =
      padIdleLoad +
      activePadUnits *
        vehicleFactor *
        (fuelingFactor * 4.2 + stageFactor * 5.8);
    const cryogenicCooling =
      baseInputs.cryogenicPlant * (0.58 + cryogenicFactor * 1.26) +
      activePadUnits * vehicleFactor * cryogenicFactor * stageFactor * 3.5;
    const waterSystems =
      baseInputs.waterPlant *
      (0.78 + Math.max(0.2, stageFactor) * 0.34 + fuelingFactor * 0.18);
    const fuelSystems = baseInputs.fuelFarm * (0.9 + fuelingFactor * 1.35);
    const vabLoad =
      baseInputs.vehicleAssemblyBuilding *
      (0.82 + vehicleFactor * 0.18 + stageFactor * 0.12);

    const capacityMw =
      sourceData.facilities.find((facility) => facility.id === 'main-substation')
        ?.capacityMw ??
      sourceData.powerSources.find((source) => source.id === 'utility-grid')
        ?.capacityMw ??
      80;
    const currentDemand = round(
      baseOperations +
        launchPadSystems +
        vehicleSupport +
        cryogenicCooling +
        waterSystems +
        fuelSystems +
        vabLoad,
      1,
    );

    const peakMultiplier = 1.08 + stageFactor * 0.13 + vehicleFactor * 0.035;
    let peakDemand = round(currentDemand * peakMultiplier, 1);
    const availableCapacity = round(Math.max(0, capacityMw - currentDemand), 1);
    let reserveMarginMw = round(capacityMw - peakDemand, 1);
    let reserveMarginPercent = round((reserveMarginMw / capacityMw) * 100, 0);
    const substationLoadingPercent = round((currentDemand / capacityMw) * 100, 0);
    const voltageDrop = clamp(substationLoadingPercent - 45, 0, 55) * 0.012;
    const voltageKv = round(clamp(13.82 - voltageDrop, 13.08, 13.86), 2);
    const frequencyHz = round(
      clamp(
        60.02 -
          clamp(substationLoadingPercent - 58, 0, 45) * 0.001 -
          Math.max(0, scenario.windSpeed - 28) * 0.0009,
        59.91,
        60.03,
      ),
      2,
    );

    const selectedFacilityId = facilityNameByPadId[selectedPadId];
    const secondaryPadShare = scenario.activePads >= 2 ? 0.34 : 0.12;
    const tertiaryPadShare = scenario.activePads >= 3 ? 0.24 : 0.06;
    const selectedPadLoad =
      baseInputs.padIdleLoad +
      launchPadSystems * 0.42 +
      vehicleSupport * 0.34;

    const facilityLoads: Record<string, number> = {
      'launch-pad-39a':
        selectedFacilityId === 'launch-pad-39a'
          ? selectedPadLoad
          : baseInputs.padIdleLoad * secondaryPadShare + launchPadSystems * 0.12,
      'launch-pad-39b':
        selectedFacilityId === 'launch-pad-39b'
          ? selectedPadLoad * (scenario.rocket === 'SLS' ? 1.1 : 0.92)
          : baseInputs.padIdleLoad * secondaryPadShare + launchPadSystems * 0.15,
      'lc-48-facility':
        selectedFacilityId === 'lc-48-facility'
          ? selectedPadLoad * 0.7
          : baseInputs.padIdleLoad * tertiaryPadShare + launchPadSystems * 0.05,
      'vehicle-assembly-building': vabLoad,
      'fuel-farm': fuelSystems,
      'cryogenic-plant': cryogenicCooling,
      'water-treatment-plant': waterSystems,
      'operations-center':
        baseInputs.communications +
        baseInputs.miscellaneous * 0.55 +
        stageFactor * 1.2,
    };

    const facilities: FacilityMetric[] = sourceData.facilities.map((facility) => {
      const currentMw = round(sourceToFacilityLoad(facility.id, facilityLoads), 1);
      const loadingPercent = round((currentMw / facility.capacityMw) * 100, 0);

      return {
        ...facility,
        currentMw,
        loadingPercent,
        peakMw: round(Math.max(facility.peakMw, currentMw * 1.16), 1),
        powerFactor: scenario.powerFactor,
        voltageKv:
          facility.type === 'grid' || facility.id === 'high-voltage-substation'
            ? 138
            : voltageKv,
        risk: getRiskByLoading(loadingPercent),
      };
    });

    const feederMetrics: FeederMetric[] = sourceData.edges.map((edge) => {
      const targetLoad = sourceToFacilityLoad(edge.target, facilityLoads);
      const sourceLoad = sourceToFacilityLoad(edge.source, facilityLoads);
      const currentMw =
        edge.target === 'main-substation' ||
        edge.target === 'bus-13-8' ||
        edge.target === 'switchyard'
          ? Math.max(targetLoad, sourceLoad)
          : targetLoad;
      const loadingPercent = round((currentMw / edge.capacityMw) * 100, 0);

      return {
        ...edge,
        currentMw: round(currentMw, 1),
        loadingPercent,
        risk: getRiskByLoading(loadingPercent),
      };
    });

    const timeline: TimelinePoint[] = timelineLabels.map((label, index) => {
      const progress = index / (timelineLabels.length - 1);
      const launchCurve = progress ** 2.35;
      const terminalRamp = Math.max(0, progress - 0.58) ** 1.45 * 1.6;
      const lateSurge = Math.max(0, progress - 0.82) ** 1.15 * 3;
      const stageRamp = 0.48 + launchCurve * stageFactor * 1.28 + terminalRamp + lateSurge;
      const baseLoad = round(baseOperations * (0.82 + progress * 0.12), 1);
      const launchPads = round(
        baseInputs.padIdleLoad * activePadFactor +
          activePadUnits * vehicleFactor * stageRamp * 8.8,
        1,
      );
      const vehicleLoad = round(
        activePadUnits *
          vehicleFactor *
          (1.8 + fuelingFactor * 4.4 + launchCurve * 10.8 + lateSurge * 1.2),
        1,
      );
      const cryoLoad = round(
        baseInputs.cryogenicPlant *
          (0.5 + cryogenicFactor * progress ** 1.35 * 1.95 + lateSurge * 0.08),
        1,
      );
      const communications = round(
        baseInputs.communications * (0.92 + progress * 0.18),
        1,
      );
      const lighting = round(baseInputs.lighting * (1.1 + progress * 0.48), 1);
      const hvac = round(
        baseInputs.hvac * (0.88 + progress * 0.16) + temperatureLoad,
        1,
      );
      const totalLoad = round(
        baseLoad +
          launchPads +
          vehicleLoad +
          cryoLoad +
          communications +
          lighting +
          hvac,
        1,
      );

      return {
        time: label,
        baseLoad,
        launchPadSystems: launchPads,
        vehicleSupport: vehicleLoad,
        cryogenicCooling: cryoLoad,
        communications,
        lighting,
        hvac,
        totalLoad,
      };
    });

    const peakTimelinePoint = timeline.reduce((peak, point) =>
      point.totalLoad > peak.totalLoad ? point : peak,
    );
    peakDemand = round(Math.max(peakDemand, peakTimelinePoint.totalLoad), 1);
    reserveMarginMw = round(capacityMw - peakDemand, 1);
    reserveMarginPercent = round((reserveMarginMw / capacityMw) * 100, 0);
    const telemetry: TelemetryPoint[] = timeline.map((point, index) => {
      const progress = index / (timeline.length - 1);
      const loadingPercent = clamp((point.totalLoad / capacityMw) * 100, 0, 120);
      const frequencyRipple =
        Math.sin(index * 0.92 + fuelingFactor * 1.7) * 0.006 +
        Math.cos(index * 0.41 + cryogenicFactor) * 0.003;
      const voltageRipple =
        Math.sin(index * 0.72 + stageFactor) * 0.025 -
        Math.cos(index * 0.34 + vehicleFactor) * 0.018;
      const frequencyAtPoint = round(
        clamp(
          60.025 -
            clamp(loadingPercent - 52, 0, 60) * 0.00115 -
            Math.max(0, scenario.windSpeed - 24) * 0.0008 +
            frequencyRipple,
          59.9,
          60.04,
        ),
        3,
      );
      const voltageAtPoint = round(
        clamp(
          13.86 -
            clamp(loadingPercent - 40, 0, 70) * 0.011 -
            progress * stageFactor * 0.04 +
            voltageRipple,
          13.05,
          13.88,
        ),
        2,
      );

      return {
        time: point.time,
        frequencyHz: index === timeline.length - 1 ? frequencyHz : frequencyAtPoint,
        voltageKv: index === timeline.length - 1 ? voltageKv : voltageAtPoint,
        loadingPercent: round(loadingPercent, 0),
      };
    });
    const averageDemand =
      timeline.reduce((sum, point) => sum + point.totalLoad, 0) / timeline.length;
    const estimatedEnergyUsage = round(averageDemand * 24, 0);
    const highestLoadedFeeder = feederMetrics.reduce((highest, feeder) =>
      feeder.loadingPercent > highest.loadingPercent ? feeder : highest,
    );
    const highestLoadedFacility = facilities
      .filter((facility) => facility.type === 'pad' || facility.type === 'facility')
      .reduce((highest, facility) =>
        facility.loadingPercent > highest.loadingPercent ? facility : highest,
      );
    const overallRisk = getRiskByReserve(
      reserveMarginPercent,
      substationLoadingPercent,
    );

    const weather: WeatherSnapshot = {
      temperatureF: scenario.ambientTemperature,
      windMph: scenario.windSpeed,
      humidityPercent: round(
        clamp(52 + (scenario.ambientTemperature - 72) * 0.5 - scenario.windSpeed * 0.18, 38, 88),
        0,
      ),
      lightningRiskPercent: round(
        clamp(8 + Math.max(0, scenario.windSpeed - 18) * 1.25 + Math.max(0, scenario.ambientTemperature - 86) * 0.8, 3, 72),
        0,
      ),
    };

    const sourceMetrics: SourceMetric[] = sourceData.powerSources.map((source) => {
      const mw =
        source.id === 'utility-grid'
          ? currentDemand * 0.515
          : source.id === 'backup-diesel'
            ? Math.min(source.capacityMw, 15)
            : source.id === 'battery-storage'
              ? Math.min(source.capacityMw, 3)
              : source.id === 'solar'
                ? Math.min(source.capacityMw, 2)
                : Math.min(source.capacityMw, 0.7);
      const percent = Math.abs(round((mw / currentDemand) * 100, 0));

      return {
        ...source,
        mw: round(mw, 1),
        percent: clamp(percent, 0, 100),
        risk: getRiskByLoading(percent),
      };
    });

    const transformerLoading = Math.max(
      52,
      round(substationLoadingPercent * 0.94 + stageFactor * 8, 0),
    );
    const selectedFeeder =
      feederMetrics.find((feeder) => feeder.target === selectedFacilityId) ??
      highestLoadedFeeder;
    const alerts: AlertItem[] = [
      {
        id: 'grid-stable',
        label: 'Grid Stable',
        status: substationLoadingPercent > 92 ? 'Critical' : 'Normal',
        risk: substationLoadingPercent > 92 ? 'critical' : 'normal',
      },
      {
        id: 'selected-feeder',
        label: `${selectedFeeder.label} High Load`,
        status: `${selectedFeeder.loadingPercent}%`,
        risk: selectedFeeder.risk,
      },
      {
        id: 'transformer-2',
        label: `Transformer 2 at ${transformerLoading}%`,
        status: transformerLoading >= 90 ? 'Critical' : transformerLoading >= 80 ? 'High' : 'Normal',
        risk: getRiskByLoading(transformerLoading),
      },
      {
        id: 'backup-generator',
        label: 'Backup Generator Ready',
        status: 'Ready',
        risk: 'normal',
      },
      {
        id: 'battery',
        label: 'Battery Charging',
        status: availableCapacity < 10 ? 'Hold' : 'Charging',
        risk: availableCapacity < 10 ? 'warning' : 'normal',
      },
      {
        id: 'frequency',
        label: 'Frequency Stable',
        status: `${frequencyHz.toFixed(2)} Hz`,
        risk: frequencyHz < 59.95 ? 'warning' : 'normal',
      },
      {
        id: 'voltage',
        label: voltageKv < 13.35 ? 'Voltage Warning' : 'Voltage Stable',
        status: `${voltageKv.toFixed(2)} kV`,
        risk: voltageKv < 13.35 ? 'warning' : 'normal',
      },
    ];

    const results: ScenarioResults = {
      currentDemand,
      peakDemand: Math.max(peakDemand, peakTimelinePoint.totalLoad),
      availableCapacity,
      reserveMarginMw,
      reserveMarginPercent,
      estimatedEnergyUsage,
      peakTime: peakTimelinePoint.time,
      highestLoadedFeeder: highestLoadedFeeder.label,
      highestLoadedFacility: highestLoadedFacility.label,
      overallRisk,
      substationLoadingPercent,
      frequencyHz,
      voltageKv,
      capacityMw,
    };

    return {
      alerts,
      facilities,
      feederMetrics,
      results,
      sourceMetrics,
      telemetry,
      timeline,
      weather,
    };
  }, [baseInputs, scenario, selectedPadId, sourceData]);
