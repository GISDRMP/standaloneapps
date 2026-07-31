import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import type { CountdownStage, ScenarioState, VehicleType } from '../types';
import { Panel } from './Panel';

interface ScenarioControlsProps {
  scenario: ScenarioState;
  vehicles: VehicleType[];
  stages: CountdownStage[];
  onChange: (patch: Partial<ScenarioState>) => void;
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

const SliderControl = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
}: SliderControlProps) => (
  <Box className="slider-control">
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography className="slider-value">
        {value}
        {unit}
      </Typography>
    </Stack>
    <Slider
      aria-label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      valueLabelDisplay="auto"
      onChange={(_, nextValue) => onChange(Number(nextValue))}
    />
  </Box>
);

export const ScenarioControls = ({
  scenario,
  vehicles,
  stages,
  onChange,
}: ScenarioControlsProps) => (
  <Panel
    title="Scenario Controls"
    eyebrow="What-if controls update every chart and feeder"
    action={<SettingsInputComponentIcon color="primary" />}
  >
    <Box className="controls-grid">
      <Box className="active-pad-control">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Number of Active Pads
          </Typography>
          <Typography className="slider-value">{scenario.activePads}</Typography>
        </Stack>
        <Box className="active-pad-segments" role="group" aria-label="Number of Active Pads">
          {[0, 1, 2, 3].map((activePads) => (
            <button
              key={activePads}
              type="button"
              className={scenario.activePads === activePads ? 'selected' : ''}
              onClick={() => onChange({ activePads })}
            >
              {activePads}
            </button>
          ))}
        </Box>
      </Box>
      <FormControl size="small" fullWidth>
        <Typography variant="caption" color="text.secondary">
          Rocket
        </Typography>
        <Select
          value={scenario.rocket}
          inputProps={{ 'aria-label': 'Rocket Selector' }}
          onChange={(event: SelectChangeEvent) =>
            onChange({ rocket: event.target.value as VehicleType })
          }
        >
          {vehicles.map((vehicle) => (
            <MenuItem key={vehicle} value={vehicle}>
              {vehicle}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <SliderControl
        label="Fueling Rate"
        value={scenario.fuelingRate}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(fuelingRate) => onChange({ fuelingRate })}
      />
      <SliderControl
        label="Cryogenic Loading"
        value={scenario.cryogenicLoading}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(cryogenicLoading) => onChange({ cryogenicLoading })}
      />
      <SliderControl
        label="Ambient Temperature"
        value={scenario.ambientTemperature}
        min={35}
        max={110}
        step={1}
        unit=" F"
        onChange={(ambientTemperature) => onChange({ ambientTemperature })}
      />
      <SliderControl
        label="Wind Speed"
        value={scenario.windSpeed}
        min={0}
        max={60}
        step={1}
        unit=" mph"
        onChange={(windSpeed) => onChange({ windSpeed })}
      />
      <FormControl size="small" fullWidth>
        <Typography variant="caption" color="text.secondary">
          Countdown Stage
        </Typography>
        <Select
          value={scenario.countdownStage}
          inputProps={{ 'aria-label': 'Countdown Stage Selector' }}
          onChange={(event: SelectChangeEvent) =>
            onChange({ countdownStage: event.target.value as CountdownStage })
          }
        >
          {stages.map((stage) => (
            <MenuItem key={stage} value={stage}>
              {stage}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <SliderControl
        label="Power Factor"
        value={scenario.powerFactor}
        min={0.8}
        max={1}
        step={0.01}
        onChange={(powerFactor) => onChange({ powerFactor })}
      />
    </Box>
  </Panel>
);
