// crash-impulse
//
// A moving mass is brought to rest by a wall, a bag or a crumpling front. The stopping takes a time t; the force changes with a chosen shape.
// Model (all from the config; no course text hard-coded):
//   impulse            J = m v0                    (area under the force-time curve, whatever the shape)
//   stop by time:      t = stop                    stop by distance: t = 2 d / v0  (average speed v0/2; true for the symmetric shapes below)
//   average force      F_avg = J / t = m v0 / t    average deceleration a_avg = v0 / t = v0^2 / (2 d)
//   peak force         F_peak = k F_avg, k = 1 for 'constant' (and its alias 'square'), k = 2 for 'triangle' (rises to the peak at t/2, then falls)
//   deceleration in g  a / g   (average and peak)
//
//   mass: 1200, v0: 15                 kg, m/s (speed just before the impact)
//   stopMode: 'time' | 'distance'      what the slider sets (`stop` = seconds or metres)
//   stop: 0.1                          start value of the stopping time (s) or crumple length (m)
//   shape: 'constant' | 'triangle' | 'square'
//   g: 9.8
//   dangerG: 30                        deceleration (in g) where the injury band starts (drawn only if show.dangerBand)
//   duration: 3200                     real ms of a replay (any stop time)
//   ranges: { time: [0.02, 1, 0.01], distance: [0.05, 2, 0.05] }   [min, max, step] of the stop slider
//   units: { mass:'kg', speed:'m/s', force:'N', time:'s', length:'m' }
//   show: { car, forcePlot, area, peakForce, gBar, dangerBand, stopSlider, shapeToggle, labels, readouts, replay }
//       defaults true except dangerBand (false).  car = the scene (mass, wall, crumpling body); forcePlot = force-against-time axes and curve;
//       area = shading under the curve (needs forcePlot); peakForce = the dashed peak line and its value on the plot;
//       gBar = bar of the deceleration in g (peak), with a marker for the average; dangerBand = the band beyond dangerG on the bar;
//       stopSlider = the slider; shapeToggle = buttons Constant / Triangle; labels = text drawn on the figure; readouts; replay = Run button.
//   readouts: ['impulse','peakForce','decel','time']   any of impulse, avgForce, peakForce, decel (average and peak, in g), time, distance
//   presets: [{ label, stop, stopMode, shape, mass, v0 }]   buttons; only the fields given change
//   labels: { impulse, avgForce, peakForce, decel, time, distance, stop, stopTime, stopDist, run, reset, constant, triangle, car, wall,
//             forceAxis, timeAxis, areaCaption, gAxis, danger, avg }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => String(Number((+v).toFixed(d)));
const sc = (a, unit) => { const x = Math.abs(a); return x >= 1e6 ? `${num(a / 1e6, 2)} M${unit}` : x >= 1e4 ? `${num(a / 1e3, 1)} k${unit}` : x >= 1e3 ? `${num(a / 1e3, 2)} k${unit}` : `${num(a, x >= 100 ? 0 : 1)} ${unit}`; };
const kOf = shape => (shape === 'triangle' ? 2 : 1);

// Pure model, exported for script checks.
export function crashModel({ mass = 1200, v0 = 15, stopMode = 'time', stop = 0.1, shape = 'constant', g = 9.8 }) {
  const J = mass * v0, t = stopMode === 'distance' ? 2 * stop / v0 : stop, d = v0 * t / 2;
  const Favg = J / t, Fpeak = kOf(shape) * Favg, aAvg = v0 / t;
  return { J, t, d, Favg, Fpeak, aAvg, aPeak: Fpeak / mass, gAvg: aAvg / g, gPeak: Fpeak / mass / g };
}
// force shape f(x)/F_avg for x = tau / t in [0,1]
const shapeF = (shape, x) => (shape === 'triangle' ? (x < 0.5 ? 4 * x : 4 * (1 - x)) : 1);
const shapeC = (shape, x) => (shape === 'triangle' ? (x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x)) : x);   // cumulative impulse fraction

export function crashImpulse(el, cfg) {
  const Lb = { impulse: 'Impulse', avgForce: 'Average force', peakForce: 'Peak force', decel: 'Deceleration', time: 'Stopping time', distance: 'Stopping distance',
    stop: cfg.stopMode === 'distance' ? 'Crumple length' : 'Stopping time', run: 'Run', reset: 'Reset', constant: 'Constant', triangle: 'Triangle',
    car: 'car', wall: '', forceAxis: 'force', timeAxis: 'time', areaCaption: 'area = impulse', gAxis: 'deceleration', danger: 'danger', avg: 'average', ...(cfg.labels ?? {}) };
  const show = { car: true, forcePlot: true, area: true, peakForce: true, gBar: true, dangerBand: false, stopSlider: true, shapeToggle: true, labels: true, readouts: true,
    replay: true, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['impulse', 'peakForce', 'decel', 'time'];
  const U = { mass: 'kg', speed: 'm/s', force: 'N', time: 's', length: 'm', ...(cfg.units ?? {}) };
  const g = cfg.g ?? 9.8, dangerG = cfg.dangerG ?? 30, duration = cfg.duration ?? 3200;
  const R = { time: [0.02, 1, 0.01], distance: [0.05, 2, 0.05], ...(cfg.ranges ?? {}) };
  const init = { mass: cfg.mass ?? 1200, v0: cfg.v0 ?? 15, stopMode: cfg.stopMode === 'distance' ? 'distance' : 'time', stop: cfg.stop ?? 0.1, shape: cfg.shape === 'triangle' ? 'triangle' : 'constant' };
  const st = { ...init };
  const norm = q => ({ ...q, shape: q.shape === 'triangle' ? 'triangle' : 'constant' });
  const model = q => crashModel({ ...norm(q), g });
  const cases = [init, ...(cfg.presets ?? []).map(p => ({ ...init, ...p }))];
  const rng = q => R[q.stopMode];
  // fixed scales so the plot does not rescale while the slider moves: shortest reachable stop sets the force axis, longest sets the time axis
  const tOf = (q, stop) => crashModel({ ...q, stop }).t;
  const tMin = Math.min(...cases.map(q => tOf(q, rng(q)[0])), ...cases.map(q => tOf(q, q.stop)));
  const tMax = Math.max(...cases.map(q => tOf(q, rng(q)[1])), ...cases.map(q => tOf(q, q.stop)));
  const JMax = Math.max(...cases.map(q => q.mass * q.v0));
  const Fmax = 2 * JMax / tMin, gMax = Math.max(dangerG * 1.6, ...cases.map(q => model({ ...q, stop: q.stop }).gPeak));

  // geometry (px)
  const W = 360, SY = 96;                                      // scene height
  const PX0 = 54, PX1 = 336;                                   // plot box x-range
  const topPlot = show.car ? SY + 14 : 12;
  const PA = topPlot, PB = topPlot + 130;
  const BARY = (show.forcePlot ? PB + 42 : show.car ? SY + 22 : 14);
  const Hh = show.gBar ? BARY + 52 : show.forcePlot ? PB + 36 : SY;
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.car });
  let u = 0, raf = 0, t0 = 0;

  function paint() {
    const q = norm(st), M = model(st);
    const g0 = s('g');
    // --- scene: u in [0, 0.35] approach, then the stop plays over [0.35, 1]
    if (show.car) {
      const wallX = 300, floor = SY - 10, L = 96, H = 34;
      const ph = u < 0.35 ? 0 : (u - 0.35) / 0.65;                 // fraction x of the stop elapsed
      let pen = 0;                                                  // penetration fraction of the total stopping distance
      if (ph > 0) { let acc = 0; const n = 60; for (let i = 0; i < n * ph; i++) acc += 1 - shapeC(q.shape, (i + 0.5) / n); pen = (acc / n) * 2; }
      const pxPerM = Math.min(60, 0.45 * L / Math.max(M.d, 1e-6));
      const crumple = Math.min(0.45 * L, pen * M.d * pxPerM);
      const approach = u < 0.35 ? (1 - u / 0.35) * 150 : 0;         // car is far away at u = 0
      const front = wallX - approach, rear = front - L + crumple;
      g0.append(s('line', { x1: 8, y1: floor, x2: W - 8, y2: floor, stroke: 'var(--muted)', 'stroke-width': 2 }),
        s('rect', { x: wallX, y: floor - 56, width: 12, height: 56, fill: 'var(--muted)' }));
      g0.append(s('rect', { x: rear, y: floor - H - 5, width: front - rear, height: H, rx: 4, fill: 'none', stroke: 'var(--vec)', 'stroke-width': 3 }),
        s('circle', { cx: rear + 18, cy: floor - 3, r: 6, fill: 'var(--ink)' }), s('circle', { cx: front - 18, cy: floor - 3, r: 6, fill: 'var(--ink)' }));
      if (show.labels) g0.append(s('text', { x: (rear + front) / 2, y: floor - H / 2 - 1, 'font-size': 10.5, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 650 }, `${num(st.mass, 0)} ${U.mass}`),
        s('text', { x: 10, y: 16, 'font-size': 10, fill: 'var(--muted)' }, `v = ${num(ph > 0 ? st.v0 * (1 - shapeC(q.shape, ph)) : st.v0, 1)} ${U.speed}`),
        Lb.wall ? s('text', { x: wallX + 6, y: floor - 62, 'font-size': 9.5, 'text-anchor': 'middle', fill: 'var(--muted)' }, Lb.wall) : '');
    }
    // --- force-time plot (x axis fixed 0..tMax, y axis fixed 0..Fmax)
    if (show.forcePlot) {
      const X = t => PX0 + (t / tMax) * (PX1 - PX0), Y = f => PB - (f / Fmax) * (PB - PA - 4);
      g0.append(s('line', { x1: PX0, y1: PB, x2: PX1, y2: PB, stroke: 'var(--ink)', 'stroke-width': 1.5 }), s('line', { x1: PX0, y1: PA, x2: PX0, y2: PB, stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      const n = 80, pts = [];
      for (let i = 0; i <= n; i++) { const x = i / n; pts.push([X(x * M.t), Y(shapeF(q.shape, x) * M.Favg)]); }
      const curve = `M${PX0},${PB} ` + pts.map(p => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      // played part (up to the cursor) and the full curve
      const upto = u < 0.35 ? 0 : (u - 0.35) / 0.65;
      if (show.area) {
        const k = Math.round(n * upto), part = pts.slice(0, k + 1);
        if (part.length > 1) g0.append(s('path', { d: `M${PX0},${PB} ` + part.map(p => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${part[part.length - 1][0].toFixed(1)},${PB} Z`, fill: 'var(--vec)', opacity: 0.35 }));
      }
      g0.append(s('path', { d: curve + ` L${X(M.t).toFixed(1)},${PB} Z`, fill: 'none', stroke: 'var(--covec)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
      if (show.peakForce) {
        g0.append(s('line', { x1: PX0, y1: Y(M.Fpeak), x2: PX1, y2: Y(M.Fpeak), stroke: 'var(--covec)', 'stroke-width': 1, 'stroke-dasharray': '4 3' }));
        if (show.labels) g0.append(s('text', { x: PX1, y: Math.max(PA + 9, Y(M.Fpeak) - 4), 'font-size': 9.5, 'text-anchor': 'end', fill: 'var(--covec)', 'font-weight': 650 }, sc(M.Fpeak, U.force)));
      }
      if (show.labels) {
        g0.append(s('text', { x: PX0 + 4, y: PA + 8, 'font-size': 9.5, fill: 'var(--muted)' }, Lb.forceAxis),
          s('text', { x: PX1, y: PB + 12, 'font-size': 9.5, 'text-anchor': 'end', fill: 'var(--muted)' }, `${Lb.timeAxis} (${num(tMax, 2)} ${U.time})`),
          s('text', { x: X(M.t), y: PB + 12, 'font-size': 9.5, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 650 }, `${num(M.t, 3)} ${U.time}`));
        if (show.area && M.t / tMax > 0.12) g0.append(s('text', { x: X(M.t / 2), y: PB - 8, 'font-size': 9.5, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 650 }, `${Lb.areaCaption} ${sc(M.J, U.force + '·' + U.time)}`));
      }
      if (upto > 0 && upto < 1) g0.append(s('line', { x1: X(M.t * upto), y1: PB, x2: X(M.t * upto), y2: PA + 4, stroke: 'var(--ink)', 'stroke-width': 1, opacity: 0.6 }));
    }
    // --- deceleration bar in g (peak), average marked
    if (show.gBar) {
      const bx = 24, bw = W - 48, by = BARY, X = a => bx + Math.min(1, a / gMax) * bw;
      if (show.dangerBand) {
        g0.append(s('rect', { x: X(dangerG), y: by - 3, width: bx + bw - X(dangerG), height: 22, fill: 'var(--bad)', opacity: 0.25 }));
        if (show.labels) g0.append(s('text', { x: bx + bw, y: by + 32, 'font-size': 9.5, 'text-anchor': 'end', fill: 'var(--bad)', 'font-weight': 650 }, `${Lb.danger} > ${num(dangerG, 0)} g`));
      }
      g0.append(s('rect', { x: bx, y: by, width: bw, height: 16, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1 }),
        s('rect', { x: bx, y: by, width: Math.max(1, X(M.gPeak) - bx), height: 16, fill: 'var(--covec)', opacity: 0.85 }));
      if (M.gAvg !== M.gPeak) g0.append(s('line', { x1: X(M.gAvg), y1: by - 3, x2: X(M.gAvg), y2: by + 19, stroke: 'var(--ink)', 'stroke-width': 2 }));
      if (show.labels) {
        const wide = X(M.gPeak) - bx > 70;
        g0.append(s('text', { x: wide ? X(M.gPeak) - 4 : X(M.gPeak) + 4, y: by + 12, 'font-size': 9.5, 'text-anchor': wide ? 'end' : 'start', fill: wide ? '#fff' : 'var(--ink)', 'font-weight': 650 }, `${num(M.gPeak, 1)} g`),
          s('text', { x: bx, y: by + 32, 'font-size': 9.5, fill: 'var(--muted)' }, `${Lb.gAxis}${M.gAvg !== M.gPeak ? ` (| = ${Lb.avg} ${num(M.gAvg, 1)} g)` : ''}`));
      }
    }
    svg.append(g0);
    // readouts, slider, buttons
    const val = {
      impulse: sc(M.J, `${U.force}·${U.time}`), avgForce: sc(M.Favg, U.force), peakForce: sc(M.Fpeak, U.force),
      decel: M.gAvg !== M.gPeak ? `${num(M.gAvg, 1)} g ${Lb.avg}, ${num(M.gPeak, 1)} g` : `${num(M.gPeak, 1)} g`, time: `${num(M.t, 3)} ${U.time}`, distance: `${num(M.d, 2)} ${U.length}`,
    };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    if (inp) { const [lo, hi, step] = R[st.stopMode]; inp.min = lo; inp.max = hi; inp.step = step; inp.value = st.stop; stopVal.textContent = st.stopMode === 'distance' ? `${num(st.stop, 2)} ${U.length}` : `${num(st.stop, 2)} ${U.time}`; }
    for (const [k, b] of Object.entries(shapeBtns)) b.setAttribute('aria-pressed', String(k === q.shape));
  }

  // controls
  const rd = {}, shapeBtns = {};
  const names = { impulse: Lb.impulse, avgForce: Lb.avgForce, peakForce: Lb.peakForce, decel: Lb.decel, time: Lb.time, distance: Lb.distance };
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  let inp = null, stopVal = null;
  let sliderEl = '';
  if (show.stopSlider) {
    inp = h('input', { type: 'range', min: R[st.stopMode][0], max: R[st.stopMode][1], step: R[st.stopMode][2], value: st.stop, 'aria-label': Lb.stop });
    inp.addEventListener('input', () => { st.stop = +inp.value; play(); });
    sliderEl = h('div', { class: 'fs-sliders' }, h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb.stop)), inp, stopVal = h('span', { class: 'fs-num' })));
  }
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const shapes = show.shapeToggle ? ['constant', 'triangle'].map(k => { const b = btn(Lb[k], () => { st.shape = k; play(); }); b.setAttribute('aria-pressed', 'true'); return shapeBtns[k] = b; }) : [];
  const apply = pr => { for (const key of ['mass', 'v0', 'stopMode', 'stop', 'shape']) if (pr[key] != null) st[key] = pr[key]; play(); };
  const btns = h('div', { class: 'wbtns' }, show.replay ? btn(Lb.run, () => play()) : '', shapes, btn(Lb.reset, () => { Object.assign(st, init); play(); }), (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', sliderEl, btns);

  function redraw() { svg.replaceChildren(); paint(); }
  function play() {
    cancelAnimationFrame(raf); u = 0; t0 = performance.now(); redraw();
    const tick = now => {
      if (!el.isConnected) return;
      u = Math.min(1, (now - t0) / duration); redraw();
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  play();
}
