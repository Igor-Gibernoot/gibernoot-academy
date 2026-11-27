// energy-diagram
//
// One-dimensional motion in a potential V(x) (force F = -dV/dx, x'' = F/m): the curve V(x), a draggable horizontal line for the total energy E,
// the allowed region E >= V shaded, turning points (E = V), equilibria (V' = 0) marked stable (V'' > 0), unstable (V'' < 0) or flat (V'' = 0),
// a ball on the curve moved by RK4 (play / pause / reset), the bars T, V, E, the force arrow, an optional tangent line, period readouts and a
// small x(t) trace. Fully general: all wording from the config. Notation: V is the potential energy, E = T + V, T = m v^2 / 2.
//
//   potentials: [ { label, type, ... } ]   one or more; two or more give switch buttons (`potential: {...}` or a type name = a single one)
//       type 'well':   V = -V0 sech^2(x / w)            { V0: 1, w: 1 }     view [-3, 3, -1.3, 0.5],  E -0.4, x -1
//       type 'hill':   V = +V0 sech^2(x / w)            { V0: 1, w: 1 }     view [-3, 3, -0.4, 1.4],  E 0.5,  x -2.5
//       type 'double': V = V0 ((x / a)^2 - 1)^2         { V0: 1, a: 1 }     view [-2, 2, -0.2, 1.6],  E 0.5,  x -1
//       type 'spring': V = k x^2 / 2                    { k: 1 }            view [-3, 3, -0.3, 4.5],  E 2,    x -2
//       type 'lj':     V = 4 eps ((s / x)^12 - (s / x)^6), x > 0  { eps: 1, sigma: 1 }  view [0.85, 3, -1.3, 1.5], E -0.5, x 1.3
//       type 'slope':  V = g x  (F = -g, gravity-like)  { g: 1 }            view [-3, 3, -3, 3],      E 0.5,  x 0.4
//       type 'poly':   V = sum c_n x^n                  { coeffs: [c0, c1, ...] }  (give `view`)
//       per potential also: view, E, x (start), direction (+1 or -1), mass; any of them overrides the global config value
//   view: [xmin, xmax, Vmin, Vmax]               x range and energy axis range
//   E: initial total energy                      x: initial ball position (snapped to the allowed region)     direction: 1
//   mass: 1                                      speed: 1  (simulated time units per second of playback)       height: 190 (px of the plot)
//   sliders: []                                  'E', 'mass', 'speed'      ranges: { E: [Vmin, Vmax, step], mass: [0.25, 4, 0.05], speed: [0.2, 3, 0.1] }
//   readouts: []                                 any of 'x', 'V', 'T', 'E', 'F', 'slope', 'period', 'smallPeriod'
//   traceTime: 10                                window (time units) of the x(t) trace
//   units: { V: '', x: '', t: '', F: '' }
//   show: { curve, axes, zero, region, axisBand, line, handle, turning, turnLines, equilibria, eqLabels, ball, drag, forceArrow, tangent, bars,
//           trace, readouts, flag, play, reset, potentialButtons, labels }
//       defaults: tangent false, trace false, readouts (cells) true, everything else true.
//       curve = V(x);  axes = frame and axis names;  zero = the V = 0 line;  region = shading between the curve and the E line where E >= V;
//       axisBand = the allowed x range as a thick band on the bottom axis;  line = the E line;  handle = the knob (and drag zone) of the E line;
//       turning = dots at E = V;  turnLines = dashed vertical lines from them down to the axis;  equilibria = marks on the curve;
//       eqLabels = their words;  ball = the ball;  drag = the ball can be dragged along the allowed curve;  forceArrow = F = -dV/dx at the ball;
//       tangent = slope line at the ball;  bars = the T, V, E bars (`bars: ['T', 'V', 'E']` chooses rows);  trace = x(t) plot;
//       flag = message when the ball leaves the view;  play, reset = buttons;  potentialButtons = the switch;  labels = all text on the picture.
//   labels: { x, V, E, T, play, pause, replay, reset, stable, unstable, flat, left, noPeriod, slope, F, period, smallPeriod, trace, picture, mass, speed }
//   Exported pure model for script checks: makePotential, turningPoints, equilibria, rk4, periodOf.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sech2 = u => { const c = Math.cosh(u); return 1 / (c * c); };

// ---- pure model -------------------------------------------------------------------------
const DEFAULTS = {
  well: { view: [-3, 3, -1.3, 0.5], E: -0.4, x: -1 },
  hill: { view: [-3, 3, -0.4, 1.4], E: 0.5, x: -2.5 },
  double: { view: [-2, 2, -0.2, 1.6], E: 0.5, x: -1 },
  spring: { view: [-3, 3, -0.3, 4.5], E: 2, x: -2 },
  lj: { view: [0.85, 3, -1.3, 1.5], E: -0.5, x: 1.3 },
  slope: { view: [-3, 3, -3, 3], E: 0.5, x: 0.4 },
  poly: { view: [-2, 2, -1, 3], E: 1, x: -1 },
};

// V, V' and V'' as functions of x for a spec { type, ... }.
export function makePotential(sp) {
  const type = sp.type ?? 'spring';
  switch (type) {
    case 'well': case 'hill': {
      const A = (type === 'well' ? -1 : 1) * (sp.V0 ?? 1), w = sp.w ?? 1;
      const t = u => Math.tanh(u);
      return { V: x => A * sech2(x / w), dV: x => -2 * A / w * sech2(x / w) * t(x / w), d2V: x => (2 * A / (w * w)) * sech2(x / w) * (3 * t(x / w) ** 2 - 1) };
    }
    case 'double': {
      const V0 = sp.V0 ?? 1, a = sp.a ?? 1;
      return { V: x => V0 * ((x / a) ** 2 - 1) ** 2, dV: x => 4 * V0 * x / (a * a) * ((x / a) ** 2 - 1), d2V: x => 4 * V0 / (a * a) * (3 * (x / a) ** 2 - 1) };
    }
    case 'lj': {
      const e = sp.eps ?? 1, sg = sp.sigma ?? 1;
      return { V: x => 4 * e * ((sg / x) ** 12 - (sg / x) ** 6), dV: x => 4 * e * (-12 * sg ** 12 / x ** 13 + 6 * sg ** 6 / x ** 7), d2V: x => 4 * e * (156 * sg ** 12 / x ** 14 - 42 * sg ** 6 / x ** 8) };
    }
    case 'slope': { const g = sp.g ?? 1; return { V: x => g * x, dV: () => g, d2V: () => 0 }; }
    case 'poly': {
      const c = sp.coeffs ?? [0, 0, 0.5], ev = (cs, x) => cs.reduceRight((a, b) => a * x + b, 0), d1 = c.slice(1).map((v, i) => v * (i + 1)), d2 = d1.slice(1).map((v, i) => v * (i + 1));
      return { V: x => ev(c, x), dV: x => ev(d1, x), d2V: x => ev(d2, x) };
    }
    default: { const k = sp.k ?? 1; return { V: x => 0.5 * k * x * x, dV: x => k * x, d2V: () => k }; }
  }
}

function bisect(f, a, b, n = 60) { let fa = f(a); for (let i = 0; i < n; i++) { const m = (a + b) / 2, fm = f(m); if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }

// Turning points: x in [x0, x1] with V(x) = E (sign changes of E - V, plus touching points at an extremum of V).
export function turningPoints(P, E, x0, x1, n = 800) {
  const out = [], g = x => E - P.V(x), xs = Array.from({ length: n + 1 }, (_, i) => x0 + (x1 - x0) * i / n);
  for (let i = 0; i < n; i++) {
    const a = g(xs[i]), b = g(xs[i + 1]);
    if (a === 0 && (i === 0 || g(xs[i - 1]) !== 0)) out.push(xs[i]);
    else if ((a < 0 && b > 0) || (a > 0 && b < 0)) out.push(bisect(g, xs[i], xs[i + 1]));
  }
  if (g(xs[n]) === 0) out.push(xs[n]);
  const eqs = equilibria(P, x0, x1, n), dx = (x1 - x0) / n;
  for (const q of eqs) {                                       // a pair of roots hidden inside one grid cell around an extremum (E very close to V there)
    const i = Math.min(n - 1, Math.max(0, Math.floor((q.x - x0) / dx))), gq = g(q.x);
    if (gq !== 0 && g(xs[i]) * gq < 0 && g(xs[i + 1]) * gq < 0) out.push(bisect(g, xs[i], q.x), bisect(g, q.x, xs[i + 1]));
  }
  for (const q of eqs) if (Math.abs(g(q.x)) < 1e-9 * (1 + Math.abs(E)) && !out.some(t => Math.abs(t - q.x) < 1e-6)) out.push(q.x);
  return out.sort((a, b) => a - b);
}

// Equilibria: V'(x) = 0 in [x0, x1], each { x, kind: 'stable' | 'unstable' | 'flat' } from the sign of V''.
export function equilibria(P, x0, x1, n = 800) {
  const out = [], xs = Array.from({ length: n + 1 }, (_, i) => x0 + (x1 - x0) * i / n), d = xs.map(x => P.dV(x));
  const scale = Math.max(1e-12, ...d.map(Math.abs)), tol = 1e-6 * scale, cl = x => { const v = P.d2V(x), w = Math.max(1e-9, 1e-7 * scale / ((x1 - x0) / n)); return v > w ? 'stable' : v < -w ? 'unstable' : 'flat'; };
  for (let i = 0; i < n; i++) {
    if (d[i] === 0) out.push({ x: xs[i], kind: cl(xs[i]) });
    else if ((d[i] < 0) !== (d[i + 1] < 0) && d[i + 1] !== 0) { const x = bisect(P.dV, xs[i], xs[i + 1]); out.push({ x, kind: cl(x) }); }
    else if (i > 0 && Math.abs(d[i]) < tol && Math.abs(d[i]) <= Math.abs(d[i - 1]) && Math.abs(d[i]) <= Math.abs(d[i + 1]) && (d[i - 1] < 0) === (d[i + 1] < 0)) out.push({ x: xs[i], kind: 'flat' });
  }
  if (d[n] === 0) out.push({ x: xs[n], kind: cl(xs[n]) });
  return out;
}

// One RK4 step of x' = v, v' = -V'(x)/m.
export function rk4(P, m, x, v, dt) {
  const a = z => -P.dV(z) / m;
  const k1x = v, k1v = a(x), k2x = v + dt / 2 * k1v, k2v = a(x + dt / 2 * k1x), k3x = v + dt / 2 * k2v, k3v = a(x + dt / 2 * k2x), k4x = v + dt * k3v, k4v = a(x + dt * k3x);
  return [x + dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x), v + dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v)];
}

// Period of the bounded motion between the turning points xa < xb (from the energy E): twice the time from xa to xb (RK4, dt 0.002).
// Returns Infinity when it takes longer than tcap, and the small-oscillation period when xa and xb coincide.
export function periodOf(P, m, xa, xb, { dt = 0.002, tcap = 400 } = {}) {
  if (xb - xa < 1e-7) { const k = P.d2V(xa); return k > 0 ? 2 * Math.PI * Math.sqrt(m / k) : Infinity; }
  let x = xa, v = 0, t = 0;
  for (let i = 0; i < tcap / dt; i++) {
    const vp = v, [nx, nv] = rk4(P, m, x, v, dt);
    x = nx; v = nv; t += dt;
    if (i > 0 && vp > 0 && v <= 0) return 2 * (t - dt + dt * vp / (vp - v));
    if (x > xb + 1e-3 * (xb - xa) + 1e-6 && v > 0 && x > xb) return Infinity;      // numerical escape through the right edge
  }
  return Infinity;
}

// ---- widget -----------------------------------------------------------------------------
export function energyDiagram(el, cfg) {
  const Lb = { x: 'x', V: 'V', E: 'E', T: 'T', play: 'Play', pause: 'Pause', replay: 'Replay', reset: 'Reset', stable: 'stable', unstable: 'unstable', flat: 'V″ = 0',
    left: 'The ball has left the picture', noPeriod: 'no period', slope: 'dV/dx', F: 'F', period: 'Period', smallPeriod: 'Small-oscillation period', trace: 'x against time',
    mass: 'Mass m', speed: 'Playback speed', picture: 'Potential energy curve with the total energy line, the allowed region, turning points, equilibria and a ball', ...(cfg.labels ?? {}) };
  const show = { curve: true, axes: true, zero: true, region: true, axisBand: true, line: true, handle: true, turning: true, turnLines: true, equilibria: true, eqLabels: true,
    ball: true, drag: true, forceArrow: true, tangent: false, bars: true, trace: false, readouts: true, flag: true, play: true, reset: true, potentialButtons: true, labels: true, ...(cfg.show ?? {}) };
  const U = { V: '', x: '', t: '', F: '', ...(cfg.units ?? {}) };
  const specs = (cfg.potentials ?? [cfg.potential ?? { type: 'spring' }]).map(p => (typeof p === 'string' ? { type: p } : p));
  const reads = cfg.readouts ?? [], barRows = cfg.bars ?? ['T', 'V', 'E'], dec = cfg.decimals ?? 2;
  const sliderKeys = cfg.sliders ?? [], traceTime = cfg.traceTime ?? 10, rate = () => st.speed;
  const st = { pi: 0, E: 0, x: 0, v: 0, dir: 1, m: 1, t: 0, speed: cfg.speed ?? 1, playing: false, out: false, hist: [] };
  const opt = (k, d) => specs[st.pi][k] ?? cfg[k] ?? DEFAULTS[specs[st.pi].type ?? 'spring']?.[k] ?? d;
  let P = null, view = [0, 1, 0, 1];
  const R = () => ({ E: [view[2], view[3], (view[3] - view[2]) / 200], mass: [0.25, 4, 0.05], speed: [0.2, 3, 0.1], ...(cfg.ranges ?? {}) });

  // geometry (px)
  const W = 360, PXl = 34, PXr = 12, PW = W - PXl - PXr, PY = 8, PH = cfg.height ?? 190, rowH = 21;
  const BY = PY + PH + 22, TY = BY + (show.bars ? barRows.length * rowH + 8 : 0), TH = 74, H = TY + (show.trace ? TH + 22 : 0) + 4;
  const X = x => PXl + (x - view[0]) / (view[1] - view[0]) * PW, Y = v => PY + (view[3] - v) / (view[3] - view[2]) * PH;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.picture });

  // model state helpers
  const grid = () => { const n = 600; return Array.from({ length: n + 1 }, (_, i) => view[0] + (view[1] - view[0]) * i / n); };
  let Emin = 0, geo = null;
  const speedFor = (x, E) => Math.sqrt(Math.max(0, 2 * (E - P.V(x)) / st.m));
  const nearestAllowed = (x, E) => { let best = null; for (const g of grid()) if (P.V(g) <= E + 1e-12 && (best == null || Math.abs(g - x) < Math.abs(best - x))) best = g; return best ?? x; };
  const setEnergy = E => {
    st.E = clamp(E, Emin, view[3]);
    if (P.V(st.x) > st.E) st.x = nearestAllowed(st.x, st.E);
    st.v = st.dir * speedFor(st.x, st.E);
    st.out = false; st.t = 0; st.hist = []; recompute();
  };
  function loadPotential(i) {
    st.pi = i; const sp = specs[i];
    P = makePotential(sp); view = opt('view'); st.m = opt('mass', 1); st.dir = opt('direction', 1) >= 0 ? 1 : -1;
    Emin = Math.min(...grid().map(P.V));
    st.E = clamp(opt('E', (view[2] + view[3]) / 2), Emin, view[3]);
    st.x = nearestAllowed(opt('x', 0), st.E);
    st.v = st.dir * speedFor(st.x, st.E); st.t = 0; st.hist = []; st.out = false; st.x0 = st.x; st.dir0 = st.dir;
    fMax = Math.max(1e-9, ...grid().map(x => Math.abs(P.dV(x)))); vAbsMax = Math.max(Math.abs(view[2]), Math.abs(view[3]));
    recompute();
  }
  let fMax = 1, vAbsMax = 1;
  function recompute() {
    const n = 300, pts = Array.from({ length: n + 1 }, (_, i) => view[0] + (view[1] - view[0]) * i / n);
    const curve = pts.map((x, i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(clamp(P.V(x), view[2] - 5 * (view[3] - view[2]), view[3] + 5 * (view[3] - view[2]))).toFixed(1)}`).join('');
    const eq = equilibria(P, view[0], view[1]), tp = turningPoints(P, st.E, view[0], view[1]);
    // allowed regions: intervals between consecutive boundaries (view edges and turning points) where V <= E, touching ones merged
    const bd = [view[0], ...tp, view[1]], regions = [];
    for (let i = 0; i < bd.length - 1; i++) {
      if (bd[i + 1] - bd[i] < 1e-12) continue;
      if (P.V((bd[i] + bd[i + 1]) / 2) <= st.E + 1e-12) { const last = regions[regions.length - 1]; if (last && Math.abs(last[1] - bd[i]) < 1e-9) last[1] = bd[i + 1]; else regions.push([bd[i], bd[i + 1]]); }
    }
    geo = { curve, eq, tp, regions, period: null, small: null };
    if (reads.includes('period') || reads.includes('smallPeriod')) {
      const comp = regions.find(([p, q]) => st.x >= p - 1e-6 && st.x <= q + 1e-6);
      if (comp) {
        const bounded = comp[0] > view[0] + 1e-9 && comp[1] < view[1] - 1e-9;
        if (reads.includes('period')) geo.period = bounded ? periodOf(P, st.m, comp[0], comp[1]) : null;
        const st1 = eq.filter(q => q.kind === 'stable' && q.x >= comp[0] - 1e-6 && q.x <= comp[1] + 1e-6).sort((p, q) => Math.abs(p.x - st.x) - Math.abs(q.x - st.x))[0];
        geo.small = st1 ? 2 * Math.PI * Math.sqrt(st.m / P.d2V(st1.x)) : null;
      }
    }
  }

  const num = v => { const t = (+v).toFixed(dec); return (Math.abs(+t) < Math.pow(10, -dec) ? (0).toFixed(dec) : t).replace('-', '−'); };
  const withU = (v, u) => `${num(v)}${u ? ' ' + u : ''}`;
  const arrowPath = (g, x, y, dx, dy, col, w, head) => {
    const L = Math.hypot(dx, dy); if (L < 1.5) return;
    const ux = dx / L, uy = dy / L, hd = Math.min(head, L * 0.6);
    g.append(s('line', { x1: x, y1: y, x2: x + dx - ux * hd * 0.6, y2: y + dy - uy * hd * 0.6, stroke: col, 'stroke-width': w, 'stroke-linecap': 'round' }),
      s('polygon', { fill: col, points: `${x + dx},${y + dy} ${x + dx - ux * hd - uy * hd * 0.5},${y + dy - uy * hd + ux * hd * 0.5} ${x + dx - ux * hd + uy * hd * 0.5},${y + dy - uy * hd - ux * hd * 0.5}` }));
  };
  const txt = (x, y, t, o = {}) => s('text', { x, y, 'font-size': 11, fill: 'var(--ink)', ...o }, t);

  function paint() {
    svg.replaceChildren();
    const clipId = `ed-clip-${uid}`;
    svg.append(s('clipPath', { id: clipId }, s('rect', { x: PXl, y: PY, width: PW, height: PH })));
    const pic = s('g', { 'clip-path': `url(#${clipId})` });
    const yE = Y(st.E), yB = PY + PH;
    if (show.axes) {
      svg.append(s('rect', { x: PXl, y: PY, width: PW, height: PH, fill: 'none', stroke: 'var(--line, #ccc)', 'stroke-width': 1 }));
      if (show.labels) svg.append(txt(PXl + PW, yB + 13, Lb.x, { 'text-anchor': 'end', 'font-style': 'italic' }), txt(PXl - 6, PY + 11, Lb.V, { 'text-anchor': 'end', 'font-style': 'italic' }));
    }
    svg.append(pic);
    if (show.zero && view[2] < 0 && view[3] > 0) pic.append(s('line', { x1: PXl, x2: PXl + PW, y1: Y(0), y2: Y(0), stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '2 4' }));
    if (show.region) for (const [p, q] of geo.regions) {
      const n = Math.max(2, Math.round((q - p) / (view[1] - view[0]) * 240)); let d = `M${X(p).toFixed(1)} ${yE.toFixed(1)}`;
      for (let i = 0; i <= n; i++) { const x = p + (q - p) * i / n; d += `L${X(x).toFixed(1)} ${clamp(Y(P.V(x)), yE, yB + 400).toFixed(1)}`; }
      pic.append(s('path', { d: d + 'Z', fill: 'var(--vec)', opacity: 0.2 }));
    }
    if (show.line) pic.append(s('line', { x1: PXl, x2: PXl + PW, y1: yE, y2: yE, stroke: 'var(--basis)', 'stroke-width': 2.2 }));
    if (show.curve) pic.append(s('path', { d: geo.curve, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }));
    if (show.axisBand) for (const [p, q] of geo.regions) pic.append(s('line', { x1: X(p), x2: X(q), y1: yB - 2, y2: yB - 2, stroke: 'var(--good)', 'stroke-width': 4, 'stroke-linecap': 'butt' }));
    if (show.turning) for (const t of geo.tp) {
      if (show.turnLines) pic.append(s('line', { x1: X(t), x2: X(t), y1: yE, y2: yB, stroke: 'var(--covec)', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }));
      pic.append(s('circle', { cx: X(t), cy: yE, r: 4.5, fill: 'var(--covec)', stroke: 'var(--bg, #fff)', 'stroke-width': 1.3 }));
    }
    if (show.equilibria) for (const q of geo.eq) {
      const cx = X(q.x), cy = Y(P.V(q.x)), col = q.kind === 'stable' ? 'var(--good)' : q.kind === 'unstable' ? 'var(--bad)' : 'var(--muted)';
      pic.append(q.kind === 'stable' ? s('circle', { cx, cy, r: 5.5, fill: col, stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 })
        : q.kind === 'unstable' ? s('circle', { cx, cy, r: 5.5, fill: 'var(--bg, #fff)', stroke: col, 'stroke-width': 2.5 })
          : s('rect', { x: cx - 5, y: cy - 5, width: 10, height: 10, fill: 'var(--bg, #fff)', stroke: col, 'stroke-width': 2.2, transform: `rotate(45 ${cx} ${cy})` }));
      if (show.labels && show.eqLabels) {
        const below = q.kind === 'stable' || (q.kind === 'flat' && P.d2V(q.x) >= 0), w = Lb[q.kind];
        pic.append(txt(clamp(cx, PXl + 28, PXl + PW - 28), below ? cy + 19 : cy - 11, w, { 'text-anchor': 'middle', fill: col, 'font-weight': 650, 'font-size': 10.5 }));
      }
    }
    if (show.tangent || show.forceArrow || show.ball) {
      const bx = X(st.x), by = Y(P.V(st.x));
      if (show.tangent) {
        const m = -P.dV(st.x) * (PH / (view[3] - view[2])) / (PW / (view[1] - view[0])), L = 46 / Math.sqrt(1 + m * m);
        pic.append(s('line', { x1: bx - L, y1: by - m * L, x2: bx + L, y2: by + m * L, stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-dasharray': '5 3', opacity: 0.8 }));
      }
      const F = -P.dV(st.x);
      if (show.forceArrow && Math.abs(F) > 1e-9 * fMax) arrowPath(pic, bx, by - 13, Math.sign(F) * 44 * Math.min(1.15, Math.abs(F) / fMax), 0, 'var(--covec)', 3, 8);
      if (show.ball) {
        pic.append(s('circle', { cx: bx, cy: by - 0, r: 6.5, fill: 'var(--vec)', stroke: 'var(--bg, #fff)', 'stroke-width': 1.8 }));
      }
    }
    if (show.handle && show.line) svg.append(s('circle', { cx: PXl + PW - 12, cy: yE, r: 6.5, fill: 'var(--bg, #fff)', stroke: 'var(--basis)', 'stroke-width': 2.6, style: 'pointer-events:none' }),
      s('line', { x1: PXl, x2: PXl + PW, y1: yE, y2: yE, stroke: 'transparent', 'stroke-width': 24, 'data-i': 'E', style: 'cursor:ns-resize;touch-action:none' }));
    if (show.labels && show.line) svg.append(txt(PXl + 3, yE - 4, Lb.E, { fill: 'var(--basis)', 'font-weight': 700, 'font-style': 'italic' }));
    if (show.ball && show.drag) svg.append(s('circle', { cx: X(st.x), cy: Y(P.V(st.x)), r: 20, fill: 'transparent', 'data-i': 'b', style: 'cursor:grab;touch-action:none' }));

    // bars T, V, E (T = m v^2 / 2 from the integrated motion)
    const Tn = 0.5 * st.m * st.v * st.v, Vn = P.V(st.x);
    if (show.bars) {
      const bx0 = PXl + 24, bx1 = W - PXr - 56, mid = bx0 + (bx1 - bx0) * (view[2] < 0 ? 0.5 : 0), half = view[2] < 0 ? (bx1 - bx0) / 2 : bx1 - bx0, g = s('g');
      g.append(s('line', { x1: mid, y1: BY - 4, x2: mid, y2: BY + barRows.length * rowH - 3, stroke: 'var(--ink)', 'stroke-width': 1 }));
      const spec = { T: [Tn, 'var(--vec)'], V: [Vn, 'var(--muted)'], E: [Tn + Vn, 'var(--basis)'] };
      barRows.forEach((k, i) => {
        const [val, col] = spec[k], y = BY + i * rowH, len = clamp(val / vAbsMax, -1, 1) * half;
        if (show.labels) g.append(txt(PXl - 26, y + 12, Lb[k], { 'font-weight': 700, 'font-style': 'italic', fill: col === 'var(--muted)' ? 'var(--ink)' : col, 'font-size': 12 }));
        g.append(s('rect', { x: Math.min(mid, mid + len), y: y + 1, width: Math.abs(len), height: 15, fill: col }),
          s('text', { x: W - PXr, y: y + 12.5, 'font-size': 11, 'text-anchor': 'end', fill: 'var(--ink)', style: 'font-variant-numeric:tabular-nums' }, withU(val, U.V)));
      });
      svg.append(g);
    }
    // x(t) trace
    if (show.trace) {
      const t1 = Math.max(traceTime, st.t), t0 = t1 - traceTime, TX = t => PXl + (t - t0) / traceTime * PW, TYf = x => TY + (view[1] - x) / (view[1] - view[0]) * TH;
      svg.append(s('rect', { x: PXl, y: TY, width: PW, height: TH, fill: 'none', stroke: 'var(--line, #ccc)', 'stroke-width': 1 }));
      const pts = st.hist.filter(q => q[0] >= t0);
      if (pts.length > 1) svg.append(s('path', { d: pts.map((q, i) => `${i ? 'L' : 'M'}${TX(q[0]).toFixed(1)} ${TYf(q[1]).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--vec)', 'stroke-width': 2 }));
      if (show.labels) svg.append(txt(PXl + PW, TY + TH + 13, 't', { 'text-anchor': 'end', 'font-style': 'italic' }), txt(PXl - 6, TY + 11, Lb.x, { 'text-anchor': 'end', 'font-style': 'italic' }));
    }

    // readouts and controls
    const set = (k, v) => { if (rd[k]) rd[k].textContent = v; };
    set('x', withU(st.x, U.x)); set('V', withU(Vn, U.V)); set('T', withU(Tn, U.V)); set('E', withU(Tn + Vn, U.V)); set('F', withU(-P.dV(st.x), U.F)); set('slope', num(P.dV(st.x)));
    set('period', geo.period == null || !isFinite(geo.period) ? Lb.noPeriod : withU(geo.period, U.t)); set('smallPeriod', geo.small == null ? Lb.noPeriod : withU(geo.small, U.t));
    if (flagEl) { flagEl.textContent = st.out ? Lb.left : ''; flagEl.style.minHeight = '1.3em'; flagEl.style.color = st.out ? 'var(--bad)' : ''; }
    if (playBtn) playBtn.textContent = st.playing ? Lb.pause : st.out ? Lb.replay : Lb.play;
    pBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === st.pi)));
    for (const [k, inp] of Object.entries(inps)) { const v = k === 'E' ? st.E : k === 'mass' ? st.m : st.speed; inp.value = v; vals[k].textContent = num(v); }
  }

  // controls
  const uid = Math.random().toString(36).slice(2, 8);
  const rd = {}, inps = {}, vals = {};
  const cellLab = { x: Lb.x, V: Lb.V, T: Lb.T, E: Lb.E, F: Lb.F, slope: Lb.slope, period: Lb.period, smallPeriod: Lb.smallPeriod };
  const cells = reads.map(k => h('div', { class: 'fs-cell' }, show.labels ? h('div', { class: 'fs-lab' }, mdInline(cellLab[k] ?? k)) : '', rd[k] = h('div', { class: 'fs-num', role: 'status' })));
  const btn = (t, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(t));
  const pBtns = specs.length > 1 ? specs.map((sp, i) => btn(sp.label ?? `${i + 1}`, () => { stop(); loadPotential(i); refreshSliders(); paint(); })) : [];
  const playBtn = show.play ? btn(Lb.play, () => (st.playing ? (stop(), paint()) : play())) : null;
  const resetBtn = show.reset ? btn(Lb.reset, () => { stop(); st.x = st.x0; st.dir = st.dir0; st.v = st.dir * speedFor(st.x, st.E); st.t = 0; st.hist = []; st.out = false; paint(); }) : null;
  const flagEl = show.flag ? h('div', { class: 'fs-lab', role: 'status' }) : null;
  const sliderEls = sliderKeys.map(key => {
    const [lo, hi, step] = R()[key], inp = inps[key] = h('input', { type: 'range', min: lo, max: hi, step, value: 0, 'aria-label': Lb[key === 'E' ? 'E' : key] ?? key });
    inp.addEventListener('input', () => {
      if (key === 'E') { setEnergy(+inp.value); } else if (key === 'mass') { st.m = +inp.value; st.v = st.dir * speedFor(st.x, st.E); st.t = 0; st.hist = []; recompute(); } else st.speed = +inp.value;
      paint();
    });
    return h('label', { class: 'fs-slide stack' }, h('span', { class: 'fs-lab' }, mdInline(key === 'E' ? Lb.E : Lb[key] ?? key)), inp, vals[key] = h('span', { class: 'fs-num' }));
  });
  function refreshSliders() { for (const [k, inp] of Object.entries(inps)) { const [lo, hi, step] = R()[k]; inp.min = lo; inp.max = hi; inp.step = step; } }
  el.append(h('div', { class: 'fs-fig' }, svg), flagEl ?? '', show.readouts && cells.length ? h('div', { class: 'fs-reads' }, cells) : '',
    sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', h('div', { class: 'wbtns' }, playBtn ?? '', resetBtn ?? '', show.potentialButtons ? pBtns : ''));

  // playback (RK4, substeps of at most 0.002 time units)
  let raf = 0, last = 0;
  function stop() { st.playing = false; cancelAnimationFrame(raf); }
  function advance(dtSim) {
    const n = Math.max(1, Math.ceil(dtSim / 0.002)), dt = dtSim / n;
    for (let i = 0; i < n; i++) {
      [st.x, st.v] = rk4(P, st.m, st.x, st.v, dt); st.t += dt;
      if (st.x < view[0] || st.x > view[1]) { st.x = clamp(st.x, view[0], view[1]); st.out = true; st.playing = false; break; }
      if (st.v !== 0) st.dir = st.v > 0 ? 1 : -1;
    }
    st.hist.push([st.t, st.x]); if (st.hist.length > 6000) st.hist.splice(0, 1000);
  }
  function play() {
    if (st.out) { st.x = st.x0; st.dir = st.dir0; st.v = st.dir * speedFor(st.x, st.E); st.t = 0; st.hist = []; st.out = false; }
    stop(); st.playing = true; last = performance.now(); if (!st.hist.length) st.hist.push([st.t, st.x]);
    const tick = now => {
      if (!el.isConnected) return;
      advance(Math.min(0.05, (now - last) / 1000) * rate()); last = now; paint();
      if (st.playing) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick); paint();
  }

  // dragging the E line and the ball
  let drag = null;
  const toWorld = ev => { const m = svg.getScreenCTM(); if (!m) return null; const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(m.inverse()); return [view[0] + (q.x - PXl) / PW * (view[1] - view[0]), view[3] - (q.y - PY) / PH * (view[3] - view[2])]; };
  svg.addEventListener('pointerdown', ev => { const i = ev.target?.getAttribute?.('data-i'); if (i == null) return; drag = i; stop(); svg.setPointerCapture?.(ev.pointerId); ev.preventDefault(); });
  svg.addEventListener('pointermove', ev => {
    if (drag == null) return; const w = toWorld(ev); if (!w) return;
    if (drag === 'E') setEnergy(w[1]);
    else { const x = clamp(w[0], view[0], view[1]); if (P.V(x) <= st.E + 1e-12) { st.x = x; st.v = st.dir * speedFor(x, st.E); st.t = 0; st.hist = []; st.out = false; } }
    paint();
  });
  const up = () => { drag = null; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('touchmove', ev => { if (drag != null) ev.preventDefault(); }, { passive: false });

  loadPotential(0); refreshSliders(); paint();
  if (cfg.autoplay) play();
}
