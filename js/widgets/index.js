// Widget registry. Lessons reference a widget by name:
//   - type: widget
//     widget: basis-playground
//     config: { ... }
// Each widget lives in its own file (js/widgets/<name>.js, header = its config);
// shared plane/SVG helpers are in plane.js. A new widget: add its file and one
// line here ('name': ['file', 'exportName']), and document it in docs/widgets/<name>.md.
//
// Widgets load on demand (dynamic import) when a card needs one, so a file that fails to
// load (an ad blocker matching its name, a dropped request) breaks only that widget, never
// the whole app. Never add static imports of widget files here.
// FILE NAMES: ad blockers (EasyPrivacy, uBlock, the built-in ones in Arc and Dia) block URLs that look
// like trackers. Never name a widget file hit-counter, tracker, analytics, beacon, pageview, telemetry,
// metrics, stats, advert(s), ad(s), popup, sponsor or collect. `node tools/validate.mjs` rejects them.

const WIDGETS = {
  'basis-playground': ['basis-playground', 'basisPlayground'],
  'machine-playground': ['machine-playground', 'machinePlayground'],
  'map-builder': ['map-builder', 'mapBuilder'],
  'ball-probe': ['ball-probe', 'ballProbe'],
  'preimage-explorer': ['preimage-explorer', 'preimageExplorer'],
  'circle-charts': ['circle-charts', 'circleCharts'],
  'curve-velocity': ['curve-velocity', 'curveVelocity'],
  'chart-basis': ['chart-basis', 'chartBasis'],
  'parallel-transport': ['parallel-transport', 'parallelTransport'],
  'time-slices': ['time-slices', 'timeSlices'],
  'rotating-grid': ['rotating-grid', 'rotatingGrid'],
  'falling-cloud': ['falling-cloud', 'fallingCloud'],
  'light-cones': ['light-cones', 'lightCones'],
  'worldline-clock': ['worldline-clock', 'worldlineClock'],
  'observer-frame': ['observer-frame', 'observerFrame'],
  'now-lines': ['now-lines', 'nowLines'],
  'area-cell': ['area-cell', 'areaCell'],
  'torus': ['torus', 'torusFigure'],
  'sphere': ['sphere', 'sphereFigure'],
  'belief-mixer': ['belief-mixer', 'beliefMixer'],
  'sequence-sampler': ['sequence-sampler', 'sequenceSampler'],
  'frequency-grid': ['frequency-grid', 'frequencyGrid'],
  'curve-fit-lab': ['curve-fit-lab', 'curveFitLab'],
  'homeostat': ['homeostat', 'homeostat'],
  'bike-balance': ['bike-balance', 'bikeBalance'],
  'lever-balance': ['lever-balance', 'leverBalance'],
  'friction-stop': ['friction-stop', 'frictionStop'],
  'two-body-push': ['two-body-push', 'twoBodyPush'],
  'incline-block': ['incline-block', 'inclineBlock'],
  'polar-motion': ['polar-motion', 'polarMotion'],
  'newton-cannon': ['newton-cannon', 'newtonCannon'],
  'rocket-exhaust': ['rocket-exhaust', 'rocketExhaust'],
  'cm-toss': ['cm-toss', 'cmToss'],
  'ang-mom-area': ['ang-mom-area', 'angMomArea'],
  'drag-fall': ['drag-fall', 'dragFall'],
  'charge-field': ['charge-field', 'chargeField'],
  'projectile-drag': ['projectile-drag', 'projectileDrag'],
  'least-action-path': ['least-action-path', 'leastActionPath'],
  'phase-portrait': ['phase-portrait', 'phasePortrait'],
  'heat-layers': ['heat-layers', 'heatLayers'],
  'heat-pump-flow': ['heat-pump-flow', 'heatPumpFlow'],
  'boiling-curve': ['boiling-curve', 'boilingCurve'],
  'pin-tumbler': ['pin-tumbler', 'pinTumbler'],
  'diagonal-list': ['diagonal-list', 'diagonalList'],
  'elevator-counterweight': ['elevator-counterweight', 'elevatorCounterweight'],
  'crash-impulse': ['crash-impulse', 'crashImpulse'],
  'track-ride': ['track-ride', 'trackRide'],
  'work-path': ['work-path', 'workPath'],
  'potential-gradient': ['potential-gradient', 'potentialGradient'],
  'energy-diagram': ['energy-diagram', 'energyDiagram'],
  'curl-loop': ['curl-loop', 'curlLoop'],
  'oscillator-lab': ['oscillator-lab', 'oscillatorLab'],
  'phasor-wheel': ['phasor-wheel', 'phasorWheel'],
  'lissajous-lab': ['lissajous-lab', 'lissajousLab'],
  'flutter-lab': ['flutter-lab', 'flutterLab'],
  'arch-thrust': ['arch-thrust', 'archThrust'],
  'truss-frame': ['truss-frame', 'trussFrame'],
  'beam-section': ['beam-section', 'beamSection'],
  'free-energy-bound': ['free-energy-bound', 'freeEnergyBound'],
  'policy-scorer': ['policy-scorer', 'policyScorer'],
  'blanket-graph': ['blanket-graph', 'blanketGraph'],
  'blanket-sync': ['blanket-sync', 'blanketSync'],
  'factor-graph': ['factor-graph', 'factorGraph'],
  'pomdp-lab': ['pomdp-lab', 'pomdpLab'],
  'mean-field-vb': ['mean-field-vb', 'meanFieldVb'],
  'steady-state-walk': ['steady-state-walk', 'steadyStateWalk'],
  'gaussian-fit': ['gaussian-fit', 'gaussianFit'],
  'peb-regression': ['peb-regression', 'pebRegression'],
  'predictive-coding': ['predictive-coding', 'predictiveCoding'],
  'microcircuit': ['microcircuit', 'microcircuit'],
  'dirichlet-counts': ['dirichlet-counts', 'dirichletCounts'],
  'deep-levels': ['deep-levels', 'deepLevels'],
  'attractor-lab': ['attractor-lab', 'attractorLab'],
  'flow-lab': ['flow-lab', 'flowLab'],
  'coupled-agents': ['coupled-agents', 'coupledAgents'],
  'hybrid-saccade': ['hybrid-saccade', 'hybridSaccade'],
  'simplex-points': ['simplex-points', 'simplexPoints'],
  'gauss-charts': ['gauss-charts', 'gaussCharts'],
  'bregman-gap': ['bregman-gap', 'bregmanGap'],
  'dual-grids': ['dual-grids', 'dualGrids'],
  'alt-projections': ['alt-projections', 'altProjections'],
  'log-ruler': ['log-ruler', 'logRuler'],
  'odds-updater': ['odds-updater', 'oddsUpdater'],
  'decision-matrix': ['decision-matrix', 'decisionMatrix'],
  'peer-credence': ['peer-credence', 'peerCredence'],
  'drake-sliders': ['drake-sliders', 'drakeSliders'],
  'hit-counter': ['binomial-hits', 'hitCounter'],
  'chaos-sensitivity': ['chaos-sensitivity', 'chaosSensitivity'],
  'condition-chain': ['condition-chain', 'conditionChain'],
  'feedback-loop': ['feedback-loop', 'feedbackLoop'],
  'tradeoff-curve': ['tradeoff-curve', 'tradeoffCurve'],
  'cellular-automaton': ['cellular-automaton', 'cellularAutomaton'],
  'chsh-lab': ['chsh-lab', 'chshLab'],
  'scale-factor': ['scale-factor', 'scaleFactor'],
  'microstate-counter': ['microstate-counter', 'microstateCounter'],
  'integration-demo': ['integration-demo', 'integrationDemo'],
  'multiverse-counter': ['multiverse-counter', 'multiverseCounter'],
  'forgetting-curve': ['forgetting-curve', 'forgettingCurve'],
  'gott-interval': ['gott-interval', 'gottInterval'],
};


export function mountWidget(name, el, config) {
  const entry = WIDGETS[name];
  if (!entry) { el.textContent = `Unknown widget "${name}".`; return Promise.resolve(); }
  el.setAttribute('aria-busy', 'true');
  return import(`./${entry[0]}.js`).then(mod => {
    el.removeAttribute('aria-busy');
    mod[entry[1]](el, config);
    steadyReadouts(el);
  }).catch(err => {
    el.removeAttribute('aria-busy');
    console.error(`Widget "${name}" failed to load`, err);
    el.replaceChildren(Object.assign(document.createElement('p'), { className: 'warn', textContent: 'This figure could not load (a content blocker may have stopped it). Reload the page, or turn the blocker off for this site.' }));
  });
}

// Layout stability for every widget: a readout whose text changes height as the reader drags
// (fractions, longer messages, wrapping) would push everything below it, and a centred page,
// up and down. Each readout therefore keeps the tallest height it has had at the current width.
function steadyReadouts(el) {
  const peak = new WeakMap();
  let width = el.clientWidth;
  const fix = () => {
    if (el.clientWidth !== width) { width = el.clientWidth; for (const r of el.querySelectorAll('.readout')) { r.style.minHeight = ''; peak.delete(r); } }
    for (const r of el.querySelectorAll('.readout')) {
      if (!r.offsetParent) continue;
      r.style.minHeight = '';
      const hgt = Math.max(peak.get(r) ?? 0, r.offsetHeight);
      peak.set(r, hgt);
      r.style.minHeight = hgt + 'px';
    }
  };
  new MutationObserver(fix).observe(el, { childList: true, subtree: true });
  new ResizeObserver(fix).observe(el);
  fix();
}
