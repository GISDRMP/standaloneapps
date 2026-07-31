import { Box, Stack, Typography } from '@mui/material';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts';
import type { TelemetryPoint } from '../types';

type TelemetryKey = 'frequencyHz' | 'voltageKv';

interface TelemetryTrendProps {
  title: string;
  value: number;
  unit: string;
  data: TelemetryPoint[];
  dataKey: TelemetryKey;
  domain: [number, number];
  color: string;
  decimals?: number;
  compact?: boolean;
}

export const TelemetryTrend = ({
  title,
  value,
  unit,
  data,
  dataKey,
  domain,
  color,
  decimals = 2,
  compact = false,
}: TelemetryTrendProps) => (
  <Box className={`telemetry-trend ${compact ? 'compact' : ''}`}>
    <Stack
      className="telemetry-trend-header"
      direction="row"
      alignItems="baseline"
      justifyContent="space-between"
      spacing={1}
    >
      <Typography variant="caption">{title}</Typography>
      <Typography className="telemetry-trend-value" sx={{ color }}>
        {value.toFixed(decimals)} {unit}
      </Typography>
    </Stack>
    <Box className="telemetry-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid
            stroke="rgba(120, 210, 255, 0.12)"
            strokeDasharray="3 7"
            vertical={false}
          />
          <YAxis domain={domain} hide />
          {!compact && (
            <Tooltip
              contentStyle={{
                background: 'rgba(2, 10, 18, 0.94)',
                border: '1px solid rgba(70, 190, 255, 0.28)',
                borderRadius: 4,
                color: '#e6f4ff',
              }}
              formatter={(nextValue) => [
                `${Number(nextValue ?? 0).toFixed(decimals)} ${unit}`,
                title,
              ]}
              labelStyle={{ color: '#8ea8bc' }}
            />
          )}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={compact ? 1.7 : 2.2}
            dot={false}
            isAnimationActive={false}
            filter={`drop-shadow(0 0 ${compact ? 3 : 5}px ${color})`}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  </Box>
);
