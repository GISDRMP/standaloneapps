import { motion } from 'framer-motion';
import { Box, Stack, Typography } from '@mui/material';
import type { LaunchPad } from '../types';
import { Panel } from './Panel';

interface LaunchPadSelectorProps {
  pads: LaunchPad[];
  selectedPadId: string;
  onSelect: (padId: string) => void;
}

export const LaunchPadSelector = ({
  pads,
  selectedPadId,
  onSelect,
}: LaunchPadSelectorProps) => (
  <Panel title="Launch Pads">
    <Stack spacing={0.55}>
      {pads.map((pad, index) => {
        const isSelected = pad.id === selectedPadId;
        const status = pad.id === 'lc-48' ? 'STANDBY' : 'ACTIVE';
        const operator =
          pad.id === 'lc-39a'
            ? 'SPACEX'
            : pad.id === 'lc-39b'
              ? 'NASA (EGS)'
              : 'NASA KSC MULTI-USER';

        return (
          <Box
            key={pad.id}
            component={motion.button}
            type="button"
            className={`pad-select-card ${isSelected ? 'selected' : ''}`}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.995 }}
            onClick={() => onSelect(pad.id)}
          >
            <Box className={`pad-thumbnail pad-${index + 1}`}>
              <span>{status}</span>
            </Box>
            <Box className="pad-row-main">
              <Typography className="pad-name">{pad.name}</Typography>
              <Box className="pad-row-detail">
                <span>Operator</span>
                <strong>{operator}</strong>
              </Box>
              <Box className="pad-row-detail">
                <span>Vehicles</span>
                <strong>{pad.vehicles.join(' / ')}</strong>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Stack>
  </Panel>
);
