import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import FactoryIcon from '@mui/icons-material/Factory';
import GridViewIcon from '@mui/icons-material/GridView';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import type { FacilityMetric, FeederMetric, RiskLevel, TelemetryPoint } from '../types';
import { formatMw, formatPercent, riskColor } from '../utils/format';
import { Panel } from './Panel';
import { TelemetryTrend } from './TelemetryTrend';

interface ElectricalDiagramProps {
  facilities: FacilityMetric[];
  feeders: FeederMetric[];
  currentDemand: number;
  frequencyHz: number;
  voltageKv: number;
  telemetry: TelemetryPoint[];
}

type NodeVariant = 'source' | 'substation' | 'feeder' | 'load' | 'utility';

interface SingleLineNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle?: string;
  value: string;
  risk: RiskLevel;
  variant: NodeVariant;
  facility?: FacilityMetric;
}

interface WirePath {
  id: string;
  d: string;
  risk: RiskLevel;
  className?: string;
}

const BOARD_WIDTH = 1080;
const BOARD_HEIGHT = 560;

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

const nodeStyle = (node: SingleLineNode): CSSProperties => ({
  left: pct(node.x, BOARD_WIDTH),
  top: pct(node.y, BOARD_HEIGHT),
  width: pct(node.width, BOARD_WIDTH),
  height: pct(node.height, BOARD_HEIGHT),
  '--node-color': riskColor(node.risk),
} as CSSProperties);

const wireStyle = (risk: RiskLevel): CSSProperties => ({
  '--wire-color': riskColor(risk),
} as CSSProperties);

const wireColor = (wire: WirePath) =>
  wire.className === 'bus-wire' ? '#31aaff' : riskColor(wire.risk);

const assetIcon = (variant: NodeVariant): ReactNode => {
  if (variant === 'source') return <GridViewIcon fontSize="small" />;
  if (variant === 'substation') return <ElectricalServicesIcon fontSize="small" />;
  if (variant === 'feeder') return <SettingsInputComponentIcon fontSize="small" />;
  if (variant === 'load') return <RocketLaunchIcon fontSize="small" />;
  return <FactoryIcon fontSize="small" />;
};

const detailRows = (facility: FacilityMetric) => [
  ['Current MW', formatMw(facility.currentMw)],
  ['Peak MW', formatMw(facility.peakMw)],
  ['Capacity', formatMw(facility.capacityMw)],
  ['Power Factor', facility.powerFactor.toFixed(2)],
  ['Voltage', `${facility.voltageKv.toFixed(facility.voltageKv >= 100 ? 0 : 2)} kV`],
  ['Breaker Status', facility.breakerStatus],
  ['Operator', facility.operator],
];

const nodeCenterX = (node: Pick<SingleLineNode, 'x' | 'width'>) =>
  node.x + node.width / 2;

const nodeTop = (node: Pick<SingleLineNode, 'y'>) => node.y;
const nodeBottom = (node: Pick<SingleLineNode, 'y' | 'height'>) =>
  node.y + node.height;

const connector = (
  id: string,
  startNode: SingleLineNode,
  endNode: SingleLineNode,
  risk: RiskLevel = 'normal',
): WirePath => {
  const x = nodeCenterX(startNode);
  const y1 = nodeBottom(startNode);
  const y2 = nodeTop(endNode);

  return {
    id,
    d: `M ${x} ${y1} L ${x} ${y2}`,
    risk,
  };
};

const getFeederRisk = (
  feederByTarget: Map<string, FeederMetric>,
  targetId: string,
) => feederByTarget.get(targetId)?.risk ?? 'normal';

const feederStatusLabel = (risk: RiskLevel) => {
  if (risk === 'critical') return 'Critical';
  if (risk === 'high') return 'High Load';
  if (risk === 'warning') return 'Watch';
  return 'Nominal';
};

export const ElectricalDiagram = ({
  facilities,
  feeders,
  currentDemand,
  frequencyHz,
  voltageKv,
  telemetry,
}: ElectricalDiagramProps) => {
  const [selectedFacility, setSelectedFacility] = useState<FacilityMetric | null>(
    null,
  );

  const facilityById = useMemo(
    () => new Map(facilities.map((facility) => [facility.id, facility])),
    [facilities],
  );
  const feederByTarget = useMemo(
    () => new Map(feeders.map((feeder) => [feeder.target, feeder])),
    [feeders],
  );
  const feederWatch = useMemo(() => {
    const rankedFeeders = [...feeders].sort(
      (a, b) => b.loadingPercent - a.loadingPercent,
    );
    const highestFeeder = rankedFeeders[0];
    const averageLoading =
      feeders.length > 0
        ? feeders.reduce((sum, feeder) => sum + feeder.loadingPercent, 0) /
          feeders.length
        : 0;
    const elevatedFeeders = feeders.filter(
      (feeder) => feeder.risk === 'high' || feeder.risk === 'critical',
    ).length;

    return {
      averageLoading,
      elevatedFeeders,
      highestFeeder,
      rankedFeeders: rankedFeeders.slice(0, 3),
    };
  }, [feeders]);

  const nodes = useMemo<SingleLineNode[]>(() => {
    const facility = (id: string) => facilityById.get(id);
    const feederLoad = (id: string) =>
      `${feederByTarget.get(id)?.loadingPercent.toFixed(0) ?? '0'}%`;
    const feederRisk = (id: string) => getFeederRisk(feederByTarget, id);
    const loadValue = (id: string) => formatMw(facility(id)?.currentMw ?? 0);
    const makeNode = (node: SingleLineNode) => node;

    return [
      makeNode({
        id: 'utility-grid',
        x: 455,
        y: 8,
        width: 170,
        height: 64,
        title: 'Utility Grid',
        subtitle: 'Transmission',
        value: '138 kV',
        risk: facility('utility-grid')?.risk ?? 'normal',
        variant: 'source',
        facility: facility('utility-grid'),
      }),
      makeNode({
        id: 'main-substation',
        x: 415,
        y: 106,
        width: 250,
        height: 78,
        title: 'Main Substation',
        subtitle: '138 / 13.8 kV',
        value: '120 MVA',
        risk: facility('main-substation')?.risk ?? 'normal',
        variant: 'substation',
        facility: facility('main-substation'),
      }),
      makeNode({
        id: 'feeder-a',
        x: 35,
        y: 244,
        width: 130,
        height: 72,
        title: 'Feeder A',
        subtitle: '13.8 kV',
        value: feederLoad('launch-pad-39a'),
        risk: feederRisk('launch-pad-39a'),
        variant: 'feeder',
      }),
      makeNode({
        id: 'feeder-b',
        x: 211,
        y: 244,
        width: 130,
        height: 72,
        title: 'Feeder B',
        subtitle: '13.8 kV',
        value: feederLoad('launch-pad-39b'),
        risk: feederRisk('launch-pad-39b'),
        variant: 'feeder',
      }),
      makeNode({
        id: 'feeder-c',
        x: 387,
        y: 244,
        width: 130,
        height: 72,
        title: 'Feeder C',
        subtitle: '13.8 kV',
        value: feederLoad('lc-48-facility'),
        risk: feederRisk('lc-48-facility'),
        variant: 'feeder',
      }),
      makeNode({
        id: 'feeder-d',
        x: 563,
        y: 244,
        width: 130,
        height: 72,
        title: 'Feeder D',
        subtitle: '13.8 kV',
        value: feederLoad('cryogenic-plant'),
        risk: feederRisk('cryogenic-plant'),
        variant: 'feeder',
      }),
      makeNode({
        id: 'feeder-e',
        x: 739,
        y: 244,
        width: 130,
        height: 72,
        title: 'Feeder E',
        subtitle: '13.8 kV',
        value: feederLoad('vehicle-assembly-building'),
        risk: feederRisk('vehicle-assembly-building'),
        variant: 'feeder',
      }),
      makeNode({
        id: 'feeder-f',
        x: 915,
        y: 244,
        width: 130,
        height: 72,
        title: 'Feeder F',
        subtitle: '13.8 kV',
        value: feederLoad('fuel-farm'),
        risk: feederRisk('fuel-farm'),
        variant: 'feeder',
      }),
      makeNode({
        id: 'launch-pad-39a',
        x: 25,
        y: 342,
        width: 150,
        height: 86,
        title: 'LC-39A',
        subtitle: 'Launch Complex',
        value: loadValue('launch-pad-39a'),
        risk: facility('launch-pad-39a')?.risk ?? 'normal',
        variant: 'load',
        facility: facility('launch-pad-39a'),
      }),
      makeNode({
        id: 'launch-pad-39b',
        x: 201,
        y: 342,
        width: 150,
        height: 86,
        title: 'LC-39B',
        subtitle: 'Launch Complex',
        value: loadValue('launch-pad-39b'),
        risk: facility('launch-pad-39b')?.risk ?? 'normal',
        variant: 'load',
        facility: facility('launch-pad-39b'),
      }),
      makeNode({
        id: 'lc-48-facility',
        x: 377,
        y: 342,
        width: 150,
        height: 86,
        title: 'LC-48',
        subtitle: 'Launch Complex',
        value: loadValue('lc-48-facility'),
        risk: facility('lc-48-facility')?.risk ?? 'normal',
        variant: 'load',
        facility: facility('lc-48-facility'),
      }),
      makeNode({
        id: 'cryogenic-plant',
        x: 553,
        y: 342,
        width: 150,
        height: 86,
        title: 'Cryogenic Plant',
        value: loadValue('cryogenic-plant'),
        risk: facility('cryogenic-plant')?.risk ?? 'normal',
        variant: 'utility',
        facility: facility('cryogenic-plant'),
      }),
      makeNode({
        id: 'vehicle-assembly-building',
        x: 729,
        y: 342,
        width: 150,
        height: 86,
        title: 'Vehicle Assembly',
        value: loadValue('vehicle-assembly-building'),
        risk: facility('vehicle-assembly-building')?.risk ?? 'normal',
        variant: 'utility',
        facility: facility('vehicle-assembly-building'),
      }),
      makeNode({
        id: 'fuel-farm',
        x: 905,
        y: 342,
        width: 150,
        height: 86,
        title: 'Fuel Farm',
        value: loadValue('fuel-farm'),
        risk: facility('fuel-farm')?.risk ?? 'normal',
        variant: 'utility',
        facility: facility('fuel-farm'),
      }),
      makeNode({
        id: 'water-treatment-plant',
        x: 25,
        y: 476,
        width: 150,
        height: 72,
        title: 'Water Plant',
        value: loadValue('water-treatment-plant'),
        risk: facility('water-treatment-plant')?.risk ?? 'normal',
        variant: 'utility',
        facility: facility('water-treatment-plant'),
      }),
      makeNode({
        id: 'operations-center',
        x: 201,
        y: 476,
        width: 150,
        height: 72,
        title: 'Operations Center',
        value: loadValue('operations-center'),
        risk: facility('operations-center')?.risk ?? 'normal',
        variant: 'utility',
        facility: facility('operations-center'),
      }),
      makeNode({
        id: 'high-voltage-substation',
        x: 371,
        y: 476,
        width: 162,
        height: 72,
        title: 'High Voltage Substation',
        value: loadValue('high-voltage-substation'),
        risk: facility('high-voltage-substation')?.risk ?? 'normal',
        variant: 'substation',
        facility: facility('high-voltage-substation'),
      }),
      makeNode({
        id: 'switchyard',
        x: 553,
        y: 476,
        width: 150,
        height: 72,
        title: 'Switchyard',
        value: loadValue('switchyard'),
        risk: facility('switchyard')?.risk ?? 'normal',
        variant: 'substation',
        facility: facility('switchyard'),
      }),
      makeNode({
        id: 'communications',
        x: 729,
        y: 476,
        width: 150,
        height: 72,
        title: 'Communications',
        value: `${((facility('operations-center')?.currentMw ?? 0) * 0.35).toFixed(1)} MW`,
        risk: 'normal',
        variant: 'utility',
      }),
      makeNode({
        id: 'other-facilities',
        x: 905,
        y: 476,
        width: 150,
        height: 72,
        title: 'Other Facilities',
        value: `${Math.max(1.4, currentDemand * 0.04).toFixed(1)} MW`,
        risk: 'normal',
        variant: 'utility',
      }),
    ];
  }, [currentDemand, facilityById, feederByTarget]);

  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  const wires = useMemo<WirePath[]>(() => {
    const node = (id: string) => nodeById.get(id);
    const feederRisk = (id: string) => getFeederRisk(feederByTarget, id);
    const source = node('utility-grid');
    const substation = node('main-substation');
    const feederTargets = [
      ['feeder-a', 'launch-pad-39a'],
      ['feeder-b', 'launch-pad-39b'],
      ['feeder-c', 'lc-48-facility'],
      ['feeder-d', 'cryogenic-plant'],
      ['feeder-e', 'vehicle-assembly-building'],
      ['feeder-f', 'fuel-farm'],
    ] as const;
    const loadTargets = [
      ['launch-pad-39a', 'water-treatment-plant'],
      ['launch-pad-39b', 'operations-center'],
      ['lc-48-facility', 'high-voltage-substation'],
      ['cryogenic-plant', 'switchyard'],
      ['vehicle-assembly-building', 'communications'],
      ['fuel-farm', 'other-facilities'],
    ] as const;
    const nextWires: WirePath[] = [];

    if (source && substation) {
      nextWires.push(connector('utility-to-substation', source, substation));
      nextWires.push({
        id: 'main-to-bus',
        d: `M ${nodeCenterX(substation)} ${nodeBottom(substation)} L ${nodeCenterX(substation)} 218`,
        risk: 'normal',
      });
    }

    nextWires.push({
      id: 'bus-13-8',
      d: 'M 100 218 L 980 218',
      risk: 'normal',
      className: 'bus-wire',
    });

    feederTargets.forEach(([feederId, targetId]) => {
      const feederNode = node(feederId);
      const loadNode = node(targetId);
      if (!feederNode || !loadNode) return;

      const feederCenter = nodeCenterX(feederNode);
      const risk = feederRisk(targetId);
      nextWires.push({
        id: `bus-${feederId}`,
        d: `M ${feederCenter} 218 L ${feederCenter} ${nodeTop(feederNode)}`,
        risk,
      });
      nextWires.push(connector(`${feederId}-${targetId}`, feederNode, loadNode, risk));
    });

    loadTargets.forEach(([sourceId, targetId]) => {
      const sourceNode = node(sourceId);
      const targetNode = node(targetId);
      if (!sourceNode || !targetNode) return;
      nextWires.push(connector(`${sourceId}-${targetId}`, sourceNode, targetNode));
    });

    return nextWires;
  }, [feederByTarget, nodeById]);

  return (
    <Panel title="Electrical Single-Line Diagram" className="diagram-panel">
      <Box className="diagram-stage schematic-stage">
        <Box className="diagram-legend">
          <Typography className="legend-title">Legend</Typography>
          <span className="legend-line grid-line" /> 138 kV
          <span className="legend-line feeder-line" /> 13.8 kV
          <span className="legend-line low-line" /> 4.16 kV
          <span className="legend-dot normal-dot" /> Normal
          <span className="legend-dot high-dot" /> High Load
          <span className="legend-dot critical-dot" /> Critical
          <span className="legend-dot offline-dot" /> Offline
        </Box>

        <Box className="single-line-board" data-testid="single-line-board">
          <svg
            className="single-line-wiring"
            viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <filter id="single-line-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {wires.map((wire) => (
              <g key={wire.id} style={wireStyle(wire.risk)}>
                <path
                  data-testid="single-line-wire-glow"
                  className={`single-line-wire-glow ${wire.className ?? ''}`}
                  d={wire.d}
                  stroke={wireColor(wire)}
                />
                <path
                  data-testid="single-line-wire"
                  className={`single-line-wire ${wire.className ?? ''}`}
                  d={wire.d}
                  stroke={wireColor(wire)}
                />
              </g>
            ))}
          </svg>

          {nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              data-testid="single-line-node"
              className={`single-line-node ${node.variant} ${node.facility ? 'clickable' : ''}`}
              style={nodeStyle(node)}
              onClick={() => {
                if (node.facility) setSelectedFacility(node.facility);
              }}
              aria-label={node.facility ? `${node.title} electrical asset` : node.title}
            >
              <Stack direction="row" spacing={0.7} alignItems="center" justifyContent="center">
                <Box className="single-line-node-icon">{assetIcon(node.variant)}</Box>
                <Typography className="single-line-node-title">{node.title}</Typography>
              </Stack>
              {node.subtitle && (
                <Typography className="single-line-node-subtitle">{node.subtitle}</Typography>
              )}
              <Typography className="single-line-node-value">{node.value}</Typography>
            </button>
          ))}
        </Box>

        <Box className="diagram-readout-stack">
          <Box className="mini-trend-card">
            <TelemetryTrend
              title="System Frequency"
              value={frequencyHz}
              unit="Hz"
              data={telemetry}
              dataKey="frequencyHz"
              domain={[59.9, 60.04]}
              color="#39d353"
              compact
            />
          </Box>
          <Box className="mini-trend-card">
            <TelemetryTrend
              title="System Voltage Avg"
              value={voltageKv}
              unit="kV"
              data={telemetry}
              dataKey="voltageKv"
              domain={[13.05, 13.88]}
              color="#31d7ff"
              compact
            />
          </Box>
          <Box className="feeder-watch-card">
            <Box className="feeder-watch-header">
              <Typography className="feeder-watch-title">Feeder Watch</Typography>
              <Typography
                className="feeder-watch-status"
                sx={{
                  color: riskColor(feederWatch.highestFeeder?.risk ?? 'normal'),
                }}
              >
                {feederStatusLabel(feederWatch.highestFeeder?.risk ?? 'normal')}
              </Typography>
            </Box>

            <Box className="feeder-watch-kpi">
              <Typography className="feeder-watch-label">Highest Loaded</Typography>
              <Typography className="feeder-watch-value">
                {feederWatch.highestFeeder?.label ?? 'No feeder'}
              </Typography>
              <Typography className="feeder-watch-load">
                {feederWatch.highestFeeder
                  ? `${formatPercent(feederWatch.highestFeeder.loadingPercent)} / ${formatMw(
                      feederWatch.highestFeeder.currentMw,
                    )}`
                  : '0% / 0.0 MW'}
              </Typography>
            </Box>

            <Box className="feeder-watch-stats">
              <Box>
                <span>Average Load</span>
                <strong>{formatPercent(feederWatch.averageLoading)}</strong>
              </Box>
              <Box>
                <span>Hot Feeders</span>
                <strong>{feederWatch.elevatedFeeders}</strong>
              </Box>
            </Box>

            <Box className="feeder-watch-list">
              {feederWatch.rankedFeeders.map((feeder) => (
                <Box key={feeder.id} className="feeder-watch-row">
                  <Typography className="feeder-watch-name">{feeder.label}</Typography>
                  <Typography
                    className="feeder-watch-percent"
                    sx={{ color: riskColor(feeder.risk) }}
                  >
                    {formatPercent(feeder.loadingPercent)}
                  </Typography>
                  <Box className="feeder-watch-track">
                    <Box
                      className="feeder-watch-fill"
                      sx={{
                        width: `${Math.min(100, feeder.loadingPercent)}%`,
                        backgroundColor: riskColor(feeder.risk),
                        color: riskColor(feeder.risk),
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>

            <Typography className="feeder-watch-path">
              Path: utility grid / main substation / 13.8 kV bus
            </Typography>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={Boolean(selectedFacility)}
        onClose={() => setSelectedFacility(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: 'asset-dialog' }}
      >
        {selectedFacility && (
          <>
            <DialogTitle>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  className="asset-dialog-icon"
                  sx={{ color: riskColor(selectedFacility.risk) }}
                >
                  <ElectricalServicesIcon />
                </Box>
                <Box>
                  <Typography className="asset-dialog-title">
                    {selectedFacility.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Electrical asset detail
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack divider={<Divider flexItem />} spacing={1}>
                {detailRows(selectedFacility).map(([label, value]) => (
                  <Stack
                    key={label}
                    direction="row"
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography className="asset-detail-value">{value}</Typography>
                  </Stack>
                ))}
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Panel>
  );
};
