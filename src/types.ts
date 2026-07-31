export type RiskLevel = 'normal' | 'warning' | 'high' | 'critical';

export type VehicleType = 'Falcon 9' | 'Falcon Heavy' | 'SLS' | 'Small Launcher';

export type CountdownStage =
  | 'Idle'
  | 'Fueling'
  | 'Terminal Countdown'
  | 'Engine Chill'
  | 'Ignition'
  | 'Launch';

export type BaseInputKey =
  | 'facilityBaseLoad'
  | 'padIdleLoad'
  | 'cryogenicPlant'
  | 'vehicleAssemblyBuilding'
  | 'fuelFarm'
  | 'waterPlant'
  | 'communications'
  | 'lighting'
  | 'hvac'
  | 'miscellaneous';

export type BaseInputs = Record<BaseInputKey, number>;

export interface BaseInputDefinition {
  key: BaseInputKey;
  label: string;
  defaultMw: number;
  min: number;
  max: number;
  step: number;
}

export interface LaunchPad {
  id: string;
  name: string;
  operator: string;
  vehicles: VehicleType[];
  capacityMw: number;
  idleMw: number;
}

export interface FacilityAsset {
  id: string;
  label: string;
  type: 'grid' | 'substation' | 'bus' | 'feeder' | 'pad' | 'facility';
  operator: string;
  voltageKv: number;
  capacityMw: number;
  baseMw: number;
  peakMw: number;
  breakerStatus: 'Closed' | 'Open' | 'Standby' | 'Locked Out';
  position: {
    x: number;
    y: number;
  };
}

export interface ElectricalEdge {
  id: string;
  source: string;
  target: string;
  voltageKv: number;
  capacityMw: number;
  label: string;
}

export interface PowerSource {
  id: string;
  name: string;
  capacityMw: number;
  status: string;
  mode: 'import' | 'standby' | 'charging' | 'generation';
}

export interface MockData {
  missions: string[];
  vehicles: VehicleType[];
  launchPads: LaunchPad[];
  baseInputs: BaseInputDefinition[];
  facilities: FacilityAsset[];
  edges: ElectricalEdge[];
  powerSources: PowerSource[];
}

export interface ScenarioState {
  activePads: number;
  rocket: VehicleType;
  fuelingRate: number;
  cryogenicLoading: number;
  ambientTemperature: number;
  windSpeed: number;
  countdownStage: CountdownStage;
  powerFactor: number;
}

export interface TimelinePoint {
  time: string;
  baseLoad: number;
  launchPadSystems: number;
  vehicleSupport: number;
  cryogenicCooling: number;
  communications: number;
  lighting: number;
  hvac: number;
  totalLoad: number;
}

export interface TelemetryPoint {
  time: string;
  frequencyHz: number;
  voltageKv: number;
  loadingPercent: number;
}

export interface FacilityMetric extends FacilityAsset {
  currentMw: number;
  loadingPercent: number;
  powerFactor: number;
  risk: RiskLevel;
}

export interface FeederMetric {
  id: string;
  label: string;
  source: string;
  target: string;
  currentMw: number;
  capacityMw: number;
  loadingPercent: number;
  voltageKv: number;
  risk: RiskLevel;
}

export interface AlertItem {
  id: string;
  label: string;
  status: string;
  risk: RiskLevel;
}

export interface SourceMetric extends PowerSource {
  mw: number;
  percent: number;
  risk: RiskLevel;
}

export interface ScenarioResults {
  currentDemand: number;
  peakDemand: number;
  availableCapacity: number;
  reserveMarginMw: number;
  reserveMarginPercent: number;
  estimatedEnergyUsage: number;
  peakTime: string;
  highestLoadedFeeder: string;
  highestLoadedFacility: string;
  overallRisk: RiskLevel;
  substationLoadingPercent: number;
  frequencyHz: number;
  voltageKv: number;
  capacityMw: number;
}

export interface WeatherSnapshot {
  temperatureF: number;
  windMph: number;
  humidityPercent: number;
  lightningRiskPercent: number;
}
