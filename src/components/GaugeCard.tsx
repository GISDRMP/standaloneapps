import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import type { RiskLevel } from '../types';
import { formatPercent, riskColor } from '../utils/format';
import { Panel } from './Panel';

interface GaugeCardProps {
  title: string;
  value: number;
  max: number;
  unit: string;
  helper: string;
  risk: RiskLevel;
  icon?: ReactNode;
  displayValue?: string;
  percentOverride?: number;
}

const START_ANGLE = 220;
const END_ANGLE = 500;
const CENTER_X = 120;
const CENTER_Y = 98;
const RADIUS = 78;

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
};

const pointAtPercent = (percent: number, radius = RADIUS) =>
  polarToCartesian(
    CENTER_X,
    CENTER_Y,
    radius,
    START_ANGLE + (percent / 100) * (END_ANGLE - START_ANGLE),
  );

const bandPath = (startPercent: number, endPercent: number) =>
  describeArc(
    CENTER_X,
    CENTER_Y,
    RADIUS,
    START_ANGLE + (startPercent / 100) * (END_ANGLE - START_ANGLE),
    START_ANGLE + (endPercent / 100) * (END_ANGLE - START_ANGLE),
  );

export const GaugeCard = ({
  title,
  value,
  max,
  unit,
  helper,
  risk,
  icon,
  displayValue,
  percentOverride,
}: GaugeCardProps) => {
  const percent = Math.max(
    0,
    Math.min(100, percentOverride ?? (max > 0 ? (value / max) * 100 : 0)),
  );
  const color = riskColor(risk);
  const needle = pointAtPercent(percent, 58);
  const ticks = [0, 25, 50, 75, 100].map((tick) => ({
    value: tick,
    label: tick.toString(),
    point: pointAtPercent(tick, 58),
  }));

  return (
    <Panel className="gauge-panel">
      <Stack
        className="gauge-header"
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Typography className="gauge-title">{title}</Typography>
        {icon && (
          <Box className="gauge-icon" sx={{ color }}>
            {icon}
          </Box>
        )}
      </Stack>
      <Box className="gauge-dial">
        <svg className="gauge-svg" viewBox="0 0 240 164" role="img" aria-label={title}>
          <defs>
            <filter id={`gauge-glow-${title.replace(/\W/g, '')}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path className="gauge-track" d={describeArc(CENTER_X, CENTER_Y, RADIUS, START_ANGLE, END_ANGLE)} />
          <path className="gauge-band band-green" d={bandPath(0, 58)} />
          <path className="gauge-band band-yellow" d={bandPath(58, 78)} />
          <path className="gauge-band band-orange" d={bandPath(78, 90)} />
          <path className="gauge-band band-red" d={bandPath(90, 100)} />
          <path
            className="gauge-active-band"
            d={bandPath(0, percent)}
            stroke={color}
            filter={`url(#gauge-glow-${title.replace(/\W/g, '')})`}
          />
          {ticks.map((tick) => (
            <text
              key={tick.value}
              className="gauge-tick-label"
              x={tick.point.x}
              y={tick.point.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {tick.label}
            </text>
          ))}
          <line
            className="gauge-needle"
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={needle.x}
            y2={needle.y}
          />
          <circle className="gauge-hub" cx={CENTER_X} cy={CENTER_Y} r="5" />
        </svg>
        <Box className="gauge-core">
          <Typography className="gauge-value">
            {displayValue ?? value.toFixed(1)}
          </Typography>
          <Typography className="gauge-unit">{unit}</Typography>
        </Box>
      </Box>
      <Stack className="gauge-footer" direction="row" justifyContent="center" alignItems="center">
        <Typography className="gauge-percent" sx={{ color }}>
          {formatPercent(percent)}
        </Typography>
        <Typography className="gauge-helper">{helper}</Typography>
      </Stack>
    </Panel>
  );
};
