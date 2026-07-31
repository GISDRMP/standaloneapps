import { Box, Chip, Stack, Typography } from '@mui/material';
import type { ScenarioResults as Results } from '../types';
import { formatMw, riskColor, riskLabel } from '../utils/format';
import { Panel } from './Panel';

interface ScenarioResultsProps {
  results: Results;
}

export const ScenarioResults = ({ results }: ScenarioResultsProps) => {
  const rows = [
    ['Current Demand', formatMw(results.currentDemand)],
    ['Peak Demand', formatMw(results.peakDemand)],
    ['Available Capacity', formatMw(results.availableCapacity)],
    [
      'Reserve Margin',
      `${results.reserveMarginMw.toFixed(1)} MW (${results.reserveMarginPercent.toFixed(0)}%)`,
    ],
    ['Estimated Energy Usage', `${results.estimatedEnergyUsage.toLocaleString()} MWh`],
    ['Peak Time', results.peakTime],
    ['Highest Loaded Feeder', results.highestLoadedFeeder],
    ['Highest Loaded Facility', results.highestLoadedFacility],
  ];
  const color = riskColor(results.overallRisk);

  return (
    <Panel
      title="Scenario Results"
      eyebrow="Automatically calculated"
      action={
        <Chip
          label={`Risk ${riskLabel(results.overallRisk)}`}
          size="small"
          sx={{
            color,
            borderColor: `${color}88`,
            backgroundColor: `${color}16`,
          }}
          variant="outlined"
        />
      }
    >
      <Stack spacing={0.2}>
        {rows.map(([label, value]) => (
          <Box className="result-row" key={label}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography className="result-value">{value}</Typography>
          </Box>
        ))}
      </Stack>
    </Panel>
  );
};
