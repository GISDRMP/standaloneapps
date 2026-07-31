import { CheckCircle, Error, WarningAmber } from '@mui/icons-material';
import { Box, Chip, Stack, Typography } from '@mui/material';
import type { AlertItem, RiskLevel } from '../types';
import { riskColor } from '../utils/format';
import { Panel } from './Panel';

interface AlertsPanelProps {
  alerts: AlertItem[];
}

const alertIcon = (risk: RiskLevel) => {
  if (risk === 'critical') return <Error fontSize="small" />;
  if (risk === 'high' || risk === 'warning') return <WarningAmber fontSize="small" />;
  return <CheckCircle fontSize="small" />;
};

export const AlertsPanel = ({ alerts }: AlertsPanelProps) => (
  <Panel title="Alert Panel" eyebrow="System alerts" className="alert-panel">
    <Stack spacing={0.25} className="alert-list">
      {alerts.map((alert) => {
        const color = riskColor(alert.risk);

        return (
          <Stack
            key={alert.id}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            className="alert-row"
          >
            <Stack
              className="alert-copy"
              direction="row"
              spacing={1}
              alignItems="flex-start"
              minWidth={0}
            >
              <Box sx={{ color }}>{alertIcon(alert.risk)}</Box>
              <Typography className="alert-label">{alert.label}</Typography>
            </Stack>
            <Chip
              className="alert-chip"
              size="small"
              label={alert.status}
              sx={{
                color,
                borderColor: `${color}88`,
                backgroundColor: `${color}14`,
              }}
              variant="outlined"
            />
          </Stack>
        );
      })}
    </Stack>
  </Panel>
);
