import { Box, Stack, TextField, Typography } from '@mui/material';
import type { BaseInputDefinition, BaseInputKey, BaseInputs, LaunchPad } from '../types';
import { LaunchPadSelector } from './LaunchPadSelector';
import { Panel } from './Panel';

interface SidebarProps {
  pads: LaunchPad[];
  selectedPadId: string;
  baseInputDefinitions: BaseInputDefinition[];
  baseInputs: BaseInputs;
  frequencyHz: number;
  voltageKv: number;
  onSelectPad: (padId: string) => void;
  onBaseInputChange: (key: BaseInputKey, value: number) => void;
}

export const Sidebar = ({
  pads,
  selectedPadId,
  baseInputDefinitions,
  baseInputs,
  onSelectPad,
  onBaseInputChange,
}: SidebarProps) => (
  <aside className="left-sidebar">
    <LaunchPadSelector
      pads={pads}
      selectedPadId={selectedPadId}
      onSelect={onSelectPad}
    />

    <Panel
      title="Base Electrical Inputs"
      action={
        <Typography variant="caption" className="panel-inline-note">
          Editable
        </Typography>
      }
      className="base-input-panel"
    >
      <Stack spacing={0.45} className="base-input-list">
        {baseInputDefinitions.map((input) => (
          <Box key={input.key} className="base-input-row">
            <Typography>{input.label}</Typography>
            <TextField
              className="base-input-field"
              size="small"
              type="number"
              value={baseInputs[input.key]}
              inputProps={{
                min: input.min,
                max: input.max,
                step: input.step,
                'aria-label': input.label,
              }}
              onChange={(event) =>
                onBaseInputChange(input.key, Number(event.target.value))
              }
            />
            <span>MW</span>
          </Box>
        ))}
        <Box className="input-summary">
          <span>Total base load</span>
          <strong>
            {Object.values(baseInputs)
              .reduce((sum, value) => sum + value, 0)
              .toFixed(2)}{' '}
            MW
          </strong>
        </Box>
      </Stack>
    </Panel>

  </aside>
);
