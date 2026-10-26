// Widget registry. Lessons reference a widget by name:
//   - type: widget
//     widget: basis-playground
//     config: { ... }
// Each widget lives in its own file (js/widgets/<name>.js, header = its config);
// shared plane/SVG helpers are in plane.js. A new widget: add its file and one
// line here, and document it in docs/LESSON_FORMAT.md.

import { basisPlayground } from './basis-playground.js';
import { machinePlayground } from './machine-playground.js';
import { mapBuilder } from './map-builder.js';
import { ballProbe } from './ball-probe.js';
import { preimageExplorer } from './preimage-explorer.js';
import { circleCharts } from './circle-charts.js';
import { curveVelocity } from './curve-velocity.js';
import { chartBasis } from './chart-basis.js';
import { parallelTransport } from './parallel-transport.js';
import { timeSlices } from './time-slices.js';
import { rotatingGrid } from './rotating-grid.js';
import { fallingCloud } from './falling-cloud.js';
import { lightCones } from './light-cones.js';
import { worldlineClock } from './worldline-clock.js';
import { observerFrame } from './observer-frame.js';
import { areaCell } from './area-cell.js';
import { torusFigure } from './torus.js';
import { sphereFigure } from './sphere.js';
import { beliefMixer } from './belief-mixer.js';
import { homeostat } from './homeostat.js';
import { freeEnergyBound } from './free-energy-bound.js';
import { policyScorer } from './policy-scorer.js';
import { blanketGraph } from './blanket-graph.js';
import { blanketSync } from './blanket-sync.js';
import { factorGraph } from './factor-graph.js';
import { pomdpLab } from './pomdp-lab.js';
import { meanFieldVb } from './mean-field-vb.js';
import { steadyStateWalk } from './steady-state-walk.js';
import { gaussianFit } from './gaussian-fit.js';
import { pebRegression } from './peb-regression.js';
import { predictiveCoding } from './predictive-coding.js';
import { microcircuit } from './microcircuit.js';
import { dirichletCounts } from './dirichlet-counts.js';
import { deepLevels } from './deep-levels.js';
import { attractorLab } from './attractor-lab.js';
import { flowLab } from './flow-lab.js';
import { coupledAgents } from './coupled-agents.js';
import { hybridSaccade } from './hybrid-saccade.js';
import { simplexPoints } from './simplex-points.js';
import { gaussCharts } from './gauss-charts.js';
import { bregmanGap } from './bregman-gap.js';
import { dualGrids } from './dual-grids.js';
import { altProjections } from './alt-projections.js';

const WIDGETS = {
  'basis-playground': basisPlayground,
  'machine-playground': machinePlayground,
  'map-builder': mapBuilder,
  'ball-probe': ballProbe,
  'preimage-explorer': preimageExplorer,
  'circle-charts': circleCharts,
  'curve-velocity': curveVelocity,
  'chart-basis': chartBasis,
  'parallel-transport': parallelTransport,
  'time-slices': timeSlices,
  'rotating-grid': rotatingGrid,
  'falling-cloud': fallingCloud,
  'light-cones': lightCones,
  'worldline-clock': worldlineClock,
  'observer-frame': observerFrame,
  'area-cell': areaCell,
  torus: torusFigure,
  sphere: sphereFigure,
  'belief-mixer': beliefMixer,
  homeostat,
  'free-energy-bound': freeEnergyBound,
  'policy-scorer': policyScorer,
  'blanket-graph': blanketGraph,
  'blanket-sync': blanketSync,
  'factor-graph': factorGraph,
  'pomdp-lab': pomdpLab,
  'mean-field-vb': meanFieldVb,
  'steady-state-walk': steadyStateWalk,
  'gaussian-fit': gaussianFit,
  'peb-regression': pebRegression,
  'predictive-coding': predictiveCoding,
  microcircuit,
  'dirichlet-counts': dirichletCounts,
  'deep-levels': deepLevels,
  'attractor-lab': attractorLab,
  'flow-lab': flowLab,
  'coupled-agents': coupledAgents,
  'hybrid-saccade': hybridSaccade,
  'simplex-points': simplexPoints,
  'gauss-charts': gaussCharts,
  'bregman-gap': bregmanGap,
  'dual-grids': dualGrids,
  'alt-projections': altProjections,
};

export function mountWidget(name, el, config) {
  const w = WIDGETS[name];
  if (!w) { el.textContent = `Unknown widget "${name}".`; return; }
  w(el, config);
}
