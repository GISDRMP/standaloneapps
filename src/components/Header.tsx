import type { ChangeEvent } from 'react';
import {
  AccessTime,
  Air,
  Bolt,
  DeviceThermostat,
  RocketLaunch,
  UploadFile,
  WaterDrop,
  WbSunny,
} from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type {
  RiskLevel,
  ScenarioResults,
  VehicleType,
  WeatherSnapshot,
} from '../types';
import { riskColor } from '../utils/format';

interface HeaderProps {
  missions: string[];
  vehicles: VehicleType[];
  mission: string;
  vehicle: VehicleType;
  countdown: string;
  now: Date;
  weather: WeatherSnapshot;
  results: ScenarioResults;
  spreadsheetStatus: string;
  onMissionChange: (mission: string) => void;
  onVehicleChange: (vehicle: VehicleType) => void;
  onSpreadsheetUpload: (file: File) => void | Promise<void>;
}

const riskForLightning = (riskPercent: number): RiskLevel => {
  if (riskPercent >= 55) return 'critical';
  if (riskPercent >= 34) return 'high';
  if (riskPercent >= 18) return 'warning';
  return 'normal';
};

const missionStatusLabel = (risk: RiskLevel) => {
  if (risk === 'critical') return 'HOLD';
  if (risk === 'high') return 'ELEVATED';
  if (risk === 'warning') return 'WATCH';
  return 'NOMINAL';
};

export const Header = ({
  missions,
  vehicles,
  mission,
  vehicle,
  countdown,
  now,
  weather,
  results,
  spreadsheetStatus,
  onMissionChange,
  onVehicleChange,
  onSpreadsheetUpload,
}: HeaderProps) => {
  const localTime = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const missionRisk = results.overallRisk;
  const lightningRisk = riskForLightning(weather.lightningRiskPercent);
  const handleSpreadsheetChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void onSpreadsheetUpload(file);
    event.target.value = '';
  };

  return (
    <Box component="header" className="top-status-bar">
      <Stack className="brand-block" direction="row" spacing={1.2} alignItems="center">
        <Box className="launch-mark" aria-hidden="true">
          <RocketLaunch />
        </Box>
        <Box minWidth={0}>
          <Typography component="h1" variant="h1">
            Space Launch Complex
          </Typography>
          <Typography className="subtitle">Electrical Load Dashboard</Typography>
        </Box>
      </Stack>

      <Box className="top-cell mission-status-cell">
        <Typography variant="caption">Mission Status</Typography>
        <Stack direction="row" spacing={0.8} alignItems="center">
          <span
            className="status-dot"
            style={{ backgroundColor: riskColor(missionRisk) }}
          />
          <Typography className="top-status-value" sx={{ color: riskColor(missionRisk) }}>
            {missionStatusLabel(missionRisk)}
          </Typography>
        </Stack>
      </Box>

      <Box className="top-cell countdown-cell">
        <Typography variant="caption">Countdown</Typography>
        <Typography className="countdown-value">{countdown}</Typography>
        <Typography className="countdown-helper">HR&nbsp;&nbsp;&nbsp;&nbsp; MIN&nbsp;&nbsp;&nbsp;&nbsp; SEC</Typography>
      </Box>

      <Box className="top-cell time-cell">
        <Typography variant="caption">Current Time</Typography>
        <Typography>{now.toLocaleDateString()}</Typography>
        <Typography>{localTime}</Typography>
      </Box>

      <Box className="top-cell weather-cell">
        <Typography variant="caption">Weather</Typography>
        <Stack direction="row" spacing={1.25} alignItems="center" className="weather-metrics">
          <Stack direction="row" spacing={0.45} alignItems="center">
            <WbSunny className="weather-icon" />
            <Typography>{weather.temperatureF.toFixed(0)} F</Typography>
            <span>Temp</span>
          </Stack>
          <Stack direction="row" spacing={0.45} alignItems="center">
            <Air className="weather-icon" />
            <Typography>{weather.windMph.toFixed(0)} mph</Typography>
            <span>Wind</span>
          </Stack>
          <Stack direction="row" spacing={0.45} alignItems="center">
            <WaterDrop className="weather-icon" />
            <Typography>{weather.humidityPercent.toFixed(0)}%</Typography>
            <span>Humidity</span>
          </Stack>
          <Stack direction="row" spacing={0.45} alignItems="center">
            <Bolt className="weather-icon" sx={{ color: riskColor(lightningRisk) }} />
            <Typography>{weather.lightningRiskPercent.toFixed(0)}%</Typography>
            <span>Lightning Risk</span>
          </Stack>
          <DeviceThermostat className="weather-icon ghost" />
          <AccessTime className="weather-icon ghost" />
        </Stack>
        <Box className="spreadsheet-upload-cluster">
          <Button
            className="spreadsheet-upload-button"
            component="label"
            size="small"
            startIcon={<UploadFile />}
            variant="outlined"
          >
            Upload Spreadsheet
            <input
              hidden
              accept=".xlsx,.xls"
              type="file"
              onChange={handleSpreadsheetChange}
            />
          </Button>
          <Typography className="spreadsheet-upload-status">
            {spreadsheetStatus}
          </Typography>
        </Box>
      </Box>

      <Stack className="selector-bank" direction="row" spacing={1}>
        <FormControl size="small" className="header-select">
          <Typography variant="caption" color="text.secondary">
            Mission
          </Typography>
          <Select
            value={mission}
            inputProps={{ 'aria-label': 'Mission Selector' }}
            onChange={(event: SelectChangeEvent) => onMissionChange(event.target.value)}
          >
            {missions.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" className="header-select">
          <Typography variant="caption" color="text.secondary">
            Vehicle
          </Typography>
          <Select
            value={vehicle}
            inputProps={{ 'aria-label': 'Vehicle Selector' }}
            onChange={(event: SelectChangeEvent) =>
              onVehicleChange(event.target.value as VehicleType)
            }
          >
            {vehicles.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box
        className="header-risk-line"
        sx={{ background: `linear-gradient(90deg, transparent, ${riskColor(missionRisk)}, transparent)` }}
      />
    </Box>
  );
};
