import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

interface PanelProps {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const Panel = ({
  title,
  eyebrow,
  action,
  children,
  className = '',
}: PanelProps) => (
  <Paper className={`command-panel ${className}`} elevation={0}>
    {(title || eyebrow || action) && (
      <Stack
        className="panel-header"
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <Box>
          {title && (
            <Typography component="h2" variant="h2">
              {title}
            </Typography>
          )}
          {eyebrow && (
            <Typography variant="caption" color="text.secondary">
              {eyebrow}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
    )}
    {children}
  </Paper>
);
