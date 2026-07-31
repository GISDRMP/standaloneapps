import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { Box, Typography } from '@mui/material';
import type { TimelinePoint } from '../types';
import { Panel } from './Panel';

interface TimelineChartProps {
  data: TimelinePoint[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipContentProps) => {
  if (!active || !payload?.length) return null;

  return (
    <Box className="chart-tooltip">
      <Typography className="tooltip-label">{label}</Typography>
      <Box className="tooltip-grid">
        {payload.map((entry) => (
          <Typography
            key={entry.dataKey?.toString()}
            className="tooltip-row"
            component="div"
            variant="caption"
          >
            <span className="tooltip-name" style={{ color: entry.color }}>
              {entry.name}
            </span>
            <span className="tooltip-value">{Number(entry.value).toFixed(1)} MW</span>
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export const TimelineChart = ({ data }: TimelineChartProps) => (
  <Panel
    title="Live Timeline"
    eyebrow="Stacked area load profile, T-24 hours to launch"
    className="timeline-panel"
  >
    <Box className="timeline-chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="baseLoad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2f9cff" stopOpacity={0.86} />
              <stop offset="95%" stopColor="#2f9cff" stopOpacity={0.32} />
            </linearGradient>
            <linearGradient id="launchPadSystems" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#39d353" stopOpacity={0.82} />
              <stop offset="95%" stopColor="#39d353" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="vehicleSupport" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffb000" stopOpacity={0.86} />
              <stop offset="95%" stopColor="#ffb000" stopOpacity={0.32} />
            </linearGradient>
            <linearGradient id="cryogenicCooling" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#31d7ff" stopOpacity={0.82} />
              <stop offset="95%" stopColor="#31d7ff" stopOpacity={0.26} />
            </linearGradient>
            <linearGradient id="communications" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9b6dff" stopOpacity={0.78} />
              <stop offset="95%" stopColor="#9b6dff" stopOpacity={0.26} />
            </linearGradient>
            <linearGradient id="lighting" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffe66d" stopOpacity={0.72} />
              <stop offset="95%" stopColor="#ffe66d" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="hvac" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff6b4a" stopOpacity={0.72} />
              <stop offset="95%" stopColor="#ff6b4a" stopOpacity={0.25} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="rgba(120, 210, 255, 0.16)"
            strokeDasharray="3 8"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fill: '#8ea8bc', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, (dataMax: number) => Math.max(70, Math.ceil(dataMax * 1.08))]}
            tick={{ fill: '#8ea8bc', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            label={{
              value: 'MW',
              angle: -90,
              position: 'insideLeft',
              fill: '#8ea8bc',
              fontSize: 11,
            }}
          />
          <Tooltip
            allowEscapeViewBox={{ x: false, y: true }}
            content={(props) => <CustomTooltip {...props} />}
            offset={18}
            wrapperStyle={{
              zIndex: 80,
              pointerEvents: 'none',
              outline: 'none',
            }}
          />
          <Legend
            verticalAlign="top"
            height={18}
            iconSize={8}
            wrapperStyle={{ fontSize: 10, color: '#8ea8bc', lineHeight: '18px' }}
          />
          <Area
            type="monotone"
            dataKey="baseLoad"
            name="Base Load"
            stackId="load"
            stroke="#2f9cff"
            strokeWidth={1.7}
            fill="url(#baseLoad)"
            fillOpacity={0.96}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="launchPadSystems"
            name="Launch Pad Systems"
            stackId="load"
            stroke="#39d353"
            strokeWidth={1.7}
            fill="url(#launchPadSystems)"
            fillOpacity={0.94}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="vehicleSupport"
            name="Vehicle Support"
            stackId="load"
            stroke="#ffb000"
            strokeWidth={1.7}
            fill="url(#vehicleSupport)"
            fillOpacity={0.96}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="cryogenicCooling"
            name="Cryogenic Cooling"
            stackId="load"
            stroke="#31d7ff"
            strokeWidth={1.7}
            fill="url(#cryogenicCooling)"
            fillOpacity={0.94}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="communications"
            name="Communications"
            stackId="load"
            stroke="#9b6dff"
            strokeWidth={1.7}
            fill="url(#communications)"
            fillOpacity={0.9}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="lighting"
            name="Lighting"
            stackId="load"
            stroke="#ffe66d"
            strokeWidth={1.7}
            fill="url(#lighting)"
            fillOpacity={0.88}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="hvac"
            name="HVAC"
            stackId="load"
            stroke="#ff6b4a"
            strokeWidth={1.7}
            fill="url(#hvac)"
            fillOpacity={0.9}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="totalLoad"
            name="Total Load"
            stroke="#f5fbff"
            strokeWidth={3.2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  </Panel>
);
