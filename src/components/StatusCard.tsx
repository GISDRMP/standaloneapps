import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import type { RiskLevel } from '../types';
import { riskColor } from '../utils/format';

interface StatusCardProps {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  risk?: RiskLevel;
  className?: string;
}

export const StatusCard = ({
  label,
  value,
  helper,
  icon,
  risk = 'normal',
  className = '',
}: StatusCardProps) => (
  <Stack className={`status-card ${className}`} direction="row" spacing={1.2}>
    {icon && (
      <Box className="status-card-icon" sx={{ color: riskColor(risk) }}>
        {icon}
      </Box>
    )}
    <Box minWidth={0}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography className="status-card-value" sx={{ color: riskColor(risk) }}>
        {value}
      </Typography>
      {helper && (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      )}
    </Box>
  </Stack>
);
