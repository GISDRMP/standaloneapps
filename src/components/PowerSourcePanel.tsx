import { Box, LinearProgress, Typography } from '@mui/material';
import type { SourceMetric } from '../types';
import { formatMw, formatPercent, riskColor } from '../utils/format';
import { Panel } from './Panel';

interface PowerSourcePanelProps {
  sources: SourceMetric[];
}

export const PowerSourcePanel = ({ sources }: PowerSourcePanelProps) => (
  <Panel title="Power Sources" className="power-table-panel">
    <Box className="source-list" role="list">
      {sources.map((source) => {
        const color = riskColor(source.risk);

        return (
          <Box key={source.id} className="source-row-compact" role="listitem">
            <Box className="source-row-top">
              <Typography className="source-name">{source.name}</Typography>
              <Typography className="source-status" sx={{ color }}>
                {source.status}
              </Typography>
            </Box>
            <Box className="source-output">
              <LinearProgress
                variant="determinate"
                value={source.percent}
                className="source-progress"
                sx={{
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}`,
                  },
                }}
              />
              <Typography className="source-mw">{formatMw(source.mw)}</Typography>
              <Typography className="source-percent">
                {formatPercent(source.percent)}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  </Panel>
);
