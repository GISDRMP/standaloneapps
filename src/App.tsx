import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import ElectricMeterIcon from '@mui/icons-material/ElectricMeter';
import EvStationIcon from '@mui/icons-material/EvStation';
import SpeedIcon from '@mui/icons-material/Speed';
import { AlertsPanel } from './components/AlertsPanel';
import { ElectricalDiagram } from './components/ElectricalDiagram';
import { GaugeCard } from './components/GaugeCard';
import { Header } from './components/Header';
import { Panel } from './components/Panel';
import { PowerSourcePanel } from './components/PowerSourcePanel';
import { ScenarioControls } from './components/ScenarioControls';
import { ScenarioResults } from './components/ScenarioResults';
import { Sidebar } from './components/Sidebar';
import { TelemetryTrend } from './components/TelemetryTrend';
import { TimelineChart } from './components/TimelineChart';
import { useClock } from './hooks/useClock';
import {
  data,
  createDefaultBaseInputs,
  defaultBaseInputs,
  defaultScenario,
  useDashboardSimulation,
} from './hooks/useDashboardSimulation';
import type {
  BaseInputKey,
  BaseInputs,
  CountdownStage,
  ScenarioState,
  VehicleType,
} from './types';
import { importDashboardWorkbook } from './utils/dashboardWorkbook';
import { clamp } from './utils/format';

const countdownStages: CountdownStage[] = [
  'Idle',
  'Fueling',
  'Terminal Countdown',
  'Engine Chill',
  'Ignition',
  'Launch',
];

const riskForReserve = (reservePercent: number) => {
  if (reservePercent < 6) return 'critical' as const;
  if (reservePercent < 15) return 'high' as const;
  if (reservePercent < 26) return 'warning' as const;
  return 'normal' as const;
};

const riskForLoading = (loadingPercent: number) => {
  if (loadingPercent >= 94) return 'critical' as const;
  if (loadingPercent >= 82) return 'high' as const;
  if (loadingPercent >= 68) return 'warning' as const;
  return 'normal' as const;
};

function App() {
  const { now, countdown } = useClock();
  const [dashboardData, setDashboardData] = useState(data);
  const [selectedMission, setSelectedMission] = useState(data.missions[1]);
  const [selectedPadId, setSelectedPadId] = useState(data.launchPads[0].id);
  const [baseInputs, setBaseInputs] = useState<BaseInputs>(defaultBaseInputs);
  const [scenario, setScenario] = useState<ScenarioState>(defaultScenario);
  const [spreadsheetStatus, setSpreadsheetStatus] = useState(
    'Using mock workbook data',
  );
  const simulation = useDashboardSimulation({
    data: dashboardData,
    baseInputs,
    scenario,
    selectedPadId,
  });
  const { results } = simulation;

  const updateBaseInput = (key: BaseInputKey, value: number) => {
    const definition = dashboardData.baseInputs.find((input) => input.key === key);
    setBaseInputs((current) => ({
      ...current,
      [key]: definition ? clamp(value, definition.min, definition.max) : value,
    }));
  };

  const updateScenario = (patch: Partial<ScenarioState>) => {
    setScenario((current) => ({
      ...current,
      ...patch,
    }));
  };

  const updateVehicle = (vehicle: VehicleType) => {
    setScenario((current) => ({
      ...current,
      rocket: vehicle,
    }));
  };

  const handleSpreadsheetUpload = async (file: File) => {
    try {
      const imported = await importDashboardWorkbook(file, dashboardData);
      const nextScenario = {
        ...defaultScenario,
        ...scenario,
        ...imported.scenario,
      };
      const nextMission =
        imported.selectedMission && imported.data.missions.includes(imported.selectedMission)
          ? imported.selectedMission
          : imported.data.missions[0] ?? selectedMission;
      const nextPadId =
        imported.selectedPadId &&
        imported.data.launchPads.some((pad) => pad.id === imported.selectedPadId)
          ? imported.selectedPadId
          : imported.data.launchPads[0]?.id ?? selectedPadId;
      const nextRocket = imported.data.vehicles.includes(nextScenario.rocket)
        ? nextScenario.rocket
        : imported.data.vehicles[0] ?? defaultScenario.rocket;

      setDashboardData(imported.data);
      setBaseInputs(imported.baseInputs ?? createDefaultBaseInputs(imported.data));
      setScenario({
        ...nextScenario,
        rocket: nextRocket,
      });
      setSelectedMission(nextMission);
      setSelectedPadId(nextPadId);
      setSpreadsheetStatus(`Loaded ${file.name} - ${imported.summary}`);
    } catch (error) {
      setSpreadsheetStatus(
        error instanceof Error
          ? `Import failed: ${error.message}`
          : 'Import failed: invalid workbook',
      );
    }
  };

  return (
    <Box className="app-shell">
      <Header
        missions={dashboardData.missions}
        vehicles={dashboardData.vehicles}
        mission={selectedMission}
        vehicle={scenario.rocket}
        countdown={countdown}
        now={now}
        weather={simulation.weather}
        results={results}
        spreadsheetStatus={spreadsheetStatus}
        onMissionChange={setSelectedMission}
        onVehicleChange={updateVehicle}
        onSpreadsheetUpload={handleSpreadsheetUpload}
      />

      <Box component="main" className="dashboard-main">
        <Box className="primary-grid">
          <Sidebar
            pads={dashboardData.launchPads}
            selectedPadId={selectedPadId}
            baseInputDefinitions={dashboardData.baseInputs}
            baseInputs={baseInputs}
            frequencyHz={results.frequencyHz}
            voltageKv={results.voltageKv}
            onSelectPad={setSelectedPadId}
            onBaseInputChange={updateBaseInput}
          />

          <Stack className="center-command-stack" spacing={1.25}>
            <ElectricalDiagram
              facilities={simulation.facilities}
              feeders={simulation.feederMetrics}
              currentDemand={results.currentDemand}
              frequencyHz={results.frequencyHz}
              voltageKv={results.voltageKv}
              telemetry={simulation.telemetry}
            />
            <TimelineChart data={simulation.timeline} />
          </Stack>

          <aside className="right-metrics">
            <Box className="gauge-stack">
              <GaugeCard
                title="Current Electrical Demand"
                value={results.currentDemand}
                max={results.capacityMw}
                unit="MW"
                helper="Of capacity"
                risk={riskForLoading(results.substationLoadingPercent)}
                icon={<BoltIcon />}
              />
              <GaugeCard
                title="Available Capacity"
                value={results.availableCapacity}
                max={results.capacityMw}
                unit="MW"
                helper="Remaining"
                risk={riskForReserve((results.availableCapacity / results.capacityMw) * 100)}
                icon={<EvStationIcon />}
              />
              <GaugeCard
                title="Reserve Margin"
                value={Math.max(0, results.reserveMarginPercent)}
                max={100}
                unit="%"
                helper={results.reserveMarginPercent > 25 ? 'Excellent' : 'Constrained'}
                risk={riskForReserve(results.reserveMarginPercent)}
                icon={<ElectricMeterIcon />}
                displayValue={Math.max(0, results.reserveMarginPercent).toFixed(0)}
                percentOverride={Math.max(0, results.reserveMarginPercent)}
              />
            </Box>
            <Box className="telemetry-stack">
              <GaugeCard
                title="Substation Loading"
                value={results.substationLoadingPercent}
                max={100}
                unit="%"
                helper="Of rating"
                risk={riskForLoading(results.substationLoadingPercent)}
                icon={<SpeedIcon />}
                displayValue={results.substationLoadingPercent.toFixed(0)}
                percentOverride={results.substationLoadingPercent}
              />
              <Panel title="Frequency" className="mini-metric-panel telemetry-metric-panel">
                <TelemetryTrend
                  title="60-second bus trend"
                  value={results.frequencyHz}
                  unit="Hz"
                  data={simulation.telemetry}
                  dataKey="frequencyHz"
                  domain={[59.9, 60.04]}
                  color="#39d353"
                />
              </Panel>
              <Panel title="Voltage Avg" className="mini-metric-panel telemetry-metric-panel">
                <TelemetryTrend
                  title="13.8 kV bus trend"
                  value={results.voltageKv}
                  unit="kV"
                  data={simulation.telemetry}
                  dataKey="voltageKv"
                  domain={[13.05, 13.88]}
                  color="#31d7ff"
                />
              </Panel>
              <Panel title="Power Factor" className="mini-metric-panel">
                <Typography className="mini-metric-value">
                  {scenario.powerFactor.toFixed(2)}
                </Typography>
                <Typography color="text.secondary">Lagging</Typography>
              </Panel>
              <Panel title="System Status" className="mini-metric-panel">
                <Typography className="mini-metric-value status-normal">Normal</Typography>
              </Panel>
            </Box>
          </aside>
        </Box>

        <Box className="operations-grid">
          <PowerSourcePanel sources={simulation.sourceMetrics} />
          <ScenarioControls
            scenario={scenario}
            vehicles={dashboardData.vehicles}
            stages={countdownStages}
            onChange={updateScenario}
          />
          <Box className="operations-side-stack">
            <ScenarioResults results={results} />
            <AlertsPanel alerts={simulation.alerts} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
