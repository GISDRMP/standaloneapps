import type { RiskLevel } from '../types';
import { palette } from '../theme';

export const formatMw = (value: number, digits = 1) => `${value.toFixed(digits)} MW`;

export const formatPercent = (value: number, digits = 0) =>
  `${value.toFixed(digits)}%`;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export const riskColor = (risk: RiskLevel) => {
  switch (risk) {
    case 'normal':
      return palette.normal;
    case 'warning':
      return palette.warning;
    case 'high':
      return palette.high;
    case 'critical':
      return palette.critical;
    default:
      return palette.cyan;
  }
};

export const riskLabel = (risk: RiskLevel) => {
  switch (risk) {
    case 'normal':
      return 'Green';
    case 'warning':
      return 'Yellow';
    case 'high':
      return 'Orange';
    case 'critical':
      return 'Red';
    default:
      return 'Green';
  }
};
