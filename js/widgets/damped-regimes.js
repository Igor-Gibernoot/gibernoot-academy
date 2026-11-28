// damped-regimes
//
// The free damped oscillator in Taylor's notation (Taylor 5.4):  x'' + 2 beta x' + w0^2 x = 0,  beta = b/(2m),  w1 = sqrt(w0^2 - beta^2)  (underdamped, beta < w0),
// r = -beta +- sqrt(beta^2 - w0^2) (overdamped, beta > w0), x = (C1 + C2 t) e^{-beta t} (critical, beta = w0). A slider on the ratio beta/w0 moves through the three
// regimes. Plain SVG + HTML, every word from the config (no course text hard-coded). Reports nothing to the card.
// Taylor's "decay time" is 1/beta (the time in which the AMPLITUDE falls to 1/e); the energy falls to 1/e in 1/(2 beta) (readout `energyTime`). Q = w0/(2 beta).
// Numerics: x = e^{-beta t} (x0 C(t) + (v0 + beta x0) S(t)) with C = cos(s t) or cosh, S = sin(s t)/s or sinh/s, s^2 = |w0^2 - beta^2|; near s = 0 C and S use their
// power series (S -> t, C -> 1), so the critical limit has no 0/0. The two exponentials of the overdamped case (C1 e^{r1 t}, C2 e^{r2 t}) are drawn only when
// they are distinguishable (|ratio - 1| > tolerance); close to critical they are huge and cancel, so the plot is clipped.
//
//   w0: 1 (rad per time unit)   ratio: 0.2 (initial beta / w0)   x0: 1   v0: 0
//   window: time shown (default 8 pi / w0, four natural periods)    yMax: half-height of the plot (default: 1.12 x the largest |x| over every ratio for the initial x0, v0; larger starts are clipped)
//   tolerance: 0.005 (|ratio - 1| under which the motion counts as critical)
//   timeScale: 1 (simulated time per real second)    autoplay: true    holdTime: 1 (real seconds the finished curve stays before the sweep restarts)
//   ranges: { ratio: [0, 3, 0.05], x0: [-1.5, 1.5, 0.05], v0: [-3, 3, 0.05] }
//   units: { time: 's', w: 'rad/s', x: '' }
//   show: { axes, axisLabels, curve, futureCurve, dot, envelope, exponentials, phase, phaseAxes, phaseTrail, regime, legend, labels, readouts, ratioSlider, x0Slider,
//           v0Slider, timeSlider, play, presets }
//       defaults true except timeSlider (false).
//       axes = the x(t) axes; axisLabels = their names; curve = x(t) up to the sweep time; futureCurve = faint x(t) beyond it; dot = marker at "now" (also in the inset);
//       envelope = dashed +-A e^{-beta t} (underdamped only; A = amplitude of A e^{-beta t} cos(w1 t - delta)); exponentials = the two dashed terms C1 e^{r1 t},
//       C2 e^{r2 t} (overdamped only); phase = the (x, v/w0) inset; phaseAxes = its axes and labels; phaseTrail = path so far (off: only the marker);
//       regime = the regime name in the figure; legend = key to the drawn curves; labels = all other text in the drawing.
//   readouts: any of ratio, beta, w0, w1, decay, energyTime, period, q, crossings, regime, r1, r2, x, v, time (default [regime, beta, w1, decay, crossings]).
//       w1, period and the r's show the `none` label where they do not exist; decay shows `infinite` when beta = 0; crossings = zero crossings of x(t) in the window.
//   presets: [{ label, ratio, x0, v0 }]   only the fields given change
//   labels: { x, time, phaseX, phaseV, ratioSlider, x0Slider, v0Slider, timeSlider, ratioRead, beta, w0, w1, decay, energyTime, period, q, crossings, regime, r1, r2, xRead, vRead,
//             timeRead, play, pause, reset, under, critical, over, none, infinite, envelope, exp1, exp2, xCurve }
// Exported for script checks: damped({w0, beta, x0, v0}) -> { x(t), v(t), kind, ... }, regimeOf(ratio, tol), zeroCrossings(p, T).

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };

export const regimeOf = (ratio, tol = 0.005) => (Math.abs(ratio - 1) <= tol ? 'critical' : ratio < 1 ? 'under' : 'over');

// Solution with Taylor's symbols. q = w0^2 - beta^2 (= w1^2 when positive, -(w2)^2 when negative).
export function damped({ w0 = 1, beta = 0.2, x0 = 1, v0 = 0, tol = 0.005 }) {
  const ratio = beta / w0, kind = regimeOf(ratio, tol), q = w0 * w0 - beta * beta, B = v0 + beta * x0;
  const cs = t => {
    const z = q * t * t;
    if (Math.abs(z) < 1e-3) return [1 - z / 2 + z * z / 24, t * (1 - z / 6 + z * z / 120)];   // series: no 0/0 at q = 0
    if (q > 0) { const a = Math.sqrt(q); return [Math.cos(a * t), Math.sin(a * t) / a]; }
    const a = Math.sqrt(-q); return [Math.cosh(a * t), Math.sinh(a * t) / a];
  };
  const x = t => { const [C, S] = cs(t); return Math.exp(-beta * t) * (x0 * C + B * S); };
  const v = t => { const [C, S] = cs(t); return -beta * x(t) + Math.exp(-beta * t) * (-x0 * q * S + B * C); };   // C' = -q S, S' = C
  const o = { x, v, kind, ratio, beta, w0, q };
  if (q > 0) {
    o.w1 = Math.sqrt(q);
    const B2 = B / o.w1;
    o.A = Math.hypot(x0, B2); o.delta = Math.atan2(B2, x0);   // x = A e^{-beta t} cos(w1 t - delta)
    o.period = 2 * Math.PI / o.w1;
  }
  if (q < 0) {
    const w2 = Math.sqrt(-q);
    o.r1 = -beta + w2; o.r2 = -beta - w2;
    o.C1 = (v0 - o.r2 * x0) / (o.r1 - o.r2); o.C2 = (o.r1 * x0 - v0) / (o.r1 - o.r2);
  }
  return o;
}

// number of zero crossings of x(t) for 0 < t <= T, from the closed forms (no sampling)
export function zeroCrossings(p, T) {
  const eps = 1e-9, m = damped(p);
  if (m.q > 0) {
    let n = 0;
    for (let k = -2; ; k++) { const t = (m.delta + Math.PI / 2 + k * Math.PI) / m.w1; if (t > T) break; if (t > eps) n++; }
    return n;
  }
  if (m.q < 0) {
    if (Math.abs(m.C1) < 1e-12 || Math.abs(m.C2) < 1e-12) return 0;
    const r = -m.C2 / m.C1; if (r <= 0) return 0;
    const t = Math.log(r) / (m.r1 - m.r2); return t > eps && t <= T ? 1 : 0;
  }
  const B = p.v0 + p.beta * p.x0, t = Math.abs(B) < 1e-12 ? -1 : -p.x0 / B;   // critical: (x0 + B t) e^{-beta t}
  return t > eps && t <= T ? 1 : 0;
}

export function dampedRegimes(el, cfg = {}) {
  const Lb = { x: 'x', time: 't', phaseX: 'x', phaseV: 'v/ω₀', ratioSlider: 'Damping ratio β/ω₀', x0Slider: 'Start position x₀', v0Slider: 'Start velocity v₀', timeSlider: 'Time',
    ratioRead: 'β/ω₀', beta: 'β', w0: 'ω₀', w1: 'ω₁', decay: 'Decay time 1/β', energyTime: 'Energy decay time 1/(2β)', period: 'Period 2π/ω₁', q: 'Q = ω₀/(2β)',
    crossings: 'Zero crossings', regime: 'Motion', r1: 'r₁', r2: 'r₂', xRead: 'x', vRead: 'v', timeRead: 'Time', play: 'Play', pause: 'Pause', reset: 'Reset',
    under: 'underdamped', critical: 'critical', over: 'overdamped', none: '–', infinite: '∞', envelope: '±A e^(−βt)', exp1: 'C₁ e^(r₁t)', exp2: 'C₂ e^(r₂t)', xCurve: 'x(t)',
    ...(cfg.labels ?? {}) };
  const U = { time: 's', w: 'rad/s', x: '', ...(cfg.units ?? {}) };
  const show = { axes: true, axisLabels: true, curve: true, futureCurve: true, dot: true, envelope: true, exponentials: true, phase: true, phaseAxes: true, phaseTrail: true,
    regime: true, legend: true, labels: true, readouts: true, ratioSlider: true, x0Slider: true, v0Slider: true, timeSlider: false, play: true, presets: true, ...(cfg.show ?? {}) };
  const PI = Math.PI, w0 = cfg.w0 ?? 1, tol = cfg.tolerance ?? 0.005, timeScale = cfg.timeScale ?? 1, hold = cfg.holdTime ?? 1;
  const R = { ratio: [0, 3, 0.05], x0: [-1.5, 1.5, 0.05], v0: [-3, 3, 0.05], ...(cfg.ranges ?? {}) };
  const init = { ratio: cfg.ratio ?? 0.2, x0: cfg.x0 ?? 1, v0: cfg.v0 ?? 0, t: 0 };
  const st = { ...init };
  const win = cfg.window ?? 8 * PI / w0;
  let playing = cfg.autoplay !== false, raf = 0, last = 0, held = 0;

  const model = () => damped({ w0, beta: st.ratio * w0, x0: st.x0, v0: st.v0, tol });
  const fmtT = v => `${num(v, 2)} ${U.time}`.trim();

  // fixed scales (so the axes never jump): the largest |x| and |v|/w0 over the ratio range for the initial x0, v0 (a later slider value past the edge is clipped)
  let ymax = cfg.yMax, vmax = 0;
  {
    const xs = [st.x0], vs = [st.v0];
    let mx = 0;
    for (const a of xs) for (const b of vs) for (let r = R.ratio[0]; r <= R.ratio[1] + 1e-9; r += 0.05) {
      const m = damped({ w0, beta: r * w0, x0: a, v0: b, tol });
      for (let i = 0; i <= 160; i++) { const t = win * i / 160; mx = Math.max(mx, Math.abs(m.x(t))); vmax = Math.max(vmax, Math.abs(m.v(t)) / w0); }
    }
    ymax = ymax ?? Math.max(mx * 1.12, 1e-6);
  }
  const E = Math.max(ymax, vmax * 1.05);    // phase inset half-extent (same scale on both axes)

  // ---- geometry (px)
  const W = 360, L = 34, Rr = 352, T0 = 12, PH = 150, cy = T0 + PH / 2, ky = (PH / 2) / ymax, kt = (Rr - L) / win;
  const PS = 124, py0 = T0 + PH + 28, Hh = show.phase ? py0 + PS + 10 : T0 + PH + 26;
  const pcx = 8 + PS / 2, pcy = py0 + PS / 2, kp = (PS / 2 - 2) / E;
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fs-svg', role: 'img', 'aria-label': 'damped oscillator' });
  const X = t => L + t * kt, Y = v => cy - v * ky, clampY = y => Math.max(T0 - 2, Math.min(T0 + PH + 2, y));
  const path = (f, t0, t1, n, clamp = false) => { let d = ''; for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n, y = Y(f(t)); d += (i ? ' L' : 'M') + X(t).toFixed(1) + ',' + (clamp ? clampY(y) : y).toFixed(1); } return d; };
  const clipId = 'dr' + Math.random().toString(36).slice(2, 8);

  function paint() {
    const m = model(), t = Math.min(st.t, win), g = s('g');
    const lab = (x, y, txt, o = {}) => show.labels && g.append(s('text', { x, y, 'font-size': 10, fill: 'var(--muted)', ...o }, txt));
    g.append(s('defs', {}, s('clipPath', { id: clipId }, s('rect', { x: L, y: T0, width: Rr - L, height: PH }))));
    if (show.axes) g.append(s('line', { x1: L, y1: cy, x2: Rr, y2: cy, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.7 }),
      s('line', { x1: L, y1: T0, x2: L, y2: T0 + PH, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.7 }));
    if (show.axisLabels) { lab(Rr, cy + 12, Lb.time, { 'text-anchor': 'end' }); lab(L + 4, T0 + 9, Lb.x); }
    const clipped = s('g', { 'clip-path': `url(#${clipId})` });
    g.append(clipped);
    if (show.envelope && m.kind === 'under') for (const sg of [1, -1]) clipped.append(s('path', { d: path(u => sg * m.A * Math.exp(-m.beta * u), 0, win, 80), fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1.3, 'stroke-dasharray': '4 3' }));
    if (show.exponentials && m.kind === 'over') {
      clipped.append(s('path', { d: path(u => m.C1 * Math.exp(m.r1 * u), 0, win, 120, true), fill: 'none', stroke: 'var(--accent)', 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }),
        s('path', { d: path(u => m.C2 * Math.exp(m.r2 * u), 0, win, 120, true), fill: 'none', stroke: 'var(--good)', 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }));
    }
    if (show.futureCurve && t < win) clipped.append(s('path', { d: path(m.x, t, win, 240), fill: 'none', stroke: 'var(--basis)', 'stroke-width': 1.6, opacity: 0.25 }));
    if (show.curve) clipped.append(s('path', { d: path(m.x, 0, t, Math.max(2, Math.round(240 * t / win))), fill: 'none', stroke: 'var(--basis)', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }));
    if (show.dot) g.append(s('circle', { cx: X(t), cy: Y(m.x(t)), r: 4.2, fill: 'var(--ink)' }));
    // legend + regime (right of the inset, or under the plot)
    if (show.regime) g.append(s('text', { x: show.phase ? 150 : L, y: show.phase ? py0 + 16 : T0 + PH + 20, 'font-size': 14, 'font-weight': 700, fill: 'var(--ink)' }, Lb[m.kind]));
    if (show.legend) {
      const items = [[Lb.xCurve, 'var(--basis)', '']];
      if (show.envelope && m.kind === 'under') items.push([Lb.envelope, 'var(--muted)', '4 3']);
      if (show.exponentials && m.kind === 'over') items.push([Lb.exp1, 'var(--accent)', '4 3'], [Lb.exp2, 'var(--good)', '4 3']);
      const x0 = show.phase ? 150 : 150, y0 = show.phase ? py0 + 36 : T0 + PH + 18;
      if (show.phase || !show.regime) items.forEach(([txt, col, dash], i) => {
        g.append(s('line', { x1: x0, y1: y0 + i * 15 - 3, x2: x0 + 22, y2: y0 + i * 15 - 3, stroke: col, 'stroke-width': 2, 'stroke-dasharray': dash }),
          s('text', { x: x0 + 28, y: y0 + i * 15, 'font-size': 10, fill: 'var(--muted)' }, txt));
      });
    }
    // phase inset
    if (show.phase) {
      const P = (xx, vv) => [pcx + xx * kp, pcy - (vv / w0) * kp];
      if (show.phaseAxes) {
        g.append(s('rect', { x: 8, y: py0, width: PS, height: PS, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 0.8, opacity: 0.5 }),
          s('line', { x1: 8, y1: pcy, x2: 8 + PS, y2: pcy, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.7 }),
          s('line', { x1: pcx, y1: py0, x2: pcx, y2: py0 + PS, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.7 }));
        lab(8 + PS - 3, pcy - 4, Lb.phaseX, { 'text-anchor': 'end' }); lab(pcx + 4, py0 + 10, Lb.phaseV);
      }
      const pts = f => { let d = ''; const n = 160; for (let i = 0; i <= n; i++) { const u = win * i / n, [a, b] = P(m.x(u), m.v(u)); d += (i ? ' L' : 'M') + a.toFixed(1) + ',' + b.toFixed(1); } return d; };
      if (show.futureCurve) g.append(s('path', { d: pts(), fill: 'none', stroke: 'var(--basis)', 'stroke-width': 1.2, opacity: 0.2 }));
      if (show.phaseTrail) {
        let d = ''; const n = Math.max(2, Math.round(160 * t / win));
        for (let i = 0; i <= n; i++) { const u = t * i / n, [a, b] = P(m.x(u), m.v(u)); d += (i ? ' L' : 'M') + a.toFixed(1) + ',' + b.toFixed(1); }
        g.append(s('path', { d, fill: 'none', stroke: 'var(--basis)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
      }
      if (show.dot) { const [a, b] = P(m.x(t), m.v(t)); g.append(s('circle', { cx: a, cy: b, r: 4, fill: 'var(--ink)' })); }
    }
    svg.replaceChildren(g);
  }

  // ---- readouts and controls
  const reads = cfg.readouts ?? ['regime', 'beta', 'w1', 'decay', 'crossings'];
  const rd = {};
  const names = { ratio: Lb.ratioRead, beta: Lb.beta, w0: Lb.w0, w1: Lb.w1, decay: Lb.decay, energyTime: Lb.energyTime, period: Lb.period, q: Lb.q, crossings: Lb.crossings,
    regime: Lb.regime, r1: Lb.r1, r2: Lb.r2, x: Lb.xRead, v: Lb.vRead, time: Lb.timeRead };
  const readEl = h('div', { class: 'fs-reads' }, reads.map(key => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[key] ?? key)), rd[key] = h('div', { class: 'fs-num', role: 'status' }))));
  const slider = (label, min, max, step, get, set, fmt) => {
    const inp = h('input', { type: 'range', min, max, step, 'aria-label': label }), val = h('span', { class: 'fs-num' });
    inp.addEventListener('input', () => { set(+inp.value); update(); });
    const row = h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(label)), inp, val);
    return { row, sync: () => { inp.value = get(); val.textContent = fmt(get()); } };
  };
  const rows = [], syncs = [];
  const add = (flag, label, rng, get, set, fmt) => { if (!flag) return; const o = slider(label, rng[0], rng[1], rng[2], get, set, fmt); rows.push(o.row); syncs.push(o.sync); };
  add(show.ratioSlider, Lb.ratioSlider, R.ratio, () => st.ratio, v => { st.ratio = v; }, v => num(v, 2));
  add(show.x0Slider, Lb.x0Slider, R.x0, () => st.x0, v => { st.x0 = v; }, v => `${num(v, 2)} ${U.x}`.trim());
  add(show.v0Slider, Lb.v0Slider, R.v0, () => st.v0, v => { st.v0 = v; }, v => `${num(v, 2)} ${U.x}${U.x ? '/' + U.time : ''}`.trim());
  add(show.timeSlider, Lb.timeSlider, [0, win, win / 400], () => Math.min(st.t, win), v => { st.t = v; playing = false; }, fmtT);
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  let playBtn = null;
  const apply = pr => { if (pr.ratio != null) st.ratio = pr.ratio; if (pr.x0 != null) st.x0 = pr.x0; if (pr.v0 != null) st.v0 = pr.v0; st.t = 0; held = 0; update(); };
  const presets = show.presets ? cfg.presets ?? [] : [];
  const btns = h('div', { class: 'wbtns' },
    show.play ? (playBtn = btn(Lb.pause, () => { playing = !playing; if (playing) { if (st.t >= win) st.t = 0; loop(); } update(); })) : '',
    show.play ? btn(Lb.reset, () => { Object.assign(st, init); held = 0; update(); }) : '',
    presets.map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', rows.length ? h('div', { class: 'fs-sliders' }, rows) : '', btns);

  function update() {
    const m = model(), t = Math.min(st.t, win), beta = m.beta;
    const val = { ratio: num(m.ratio, 2), beta: `${num(beta, 3)} ${U.w}`, w0: `${num(w0, 3)} ${U.w}`, w1: m.w1 != null ? `${num(m.w1, 3)} ${U.w}` : Lb.none,
      decay: beta > 1e-12 ? fmtT(1 / beta) : Lb.infinite, energyTime: beta > 1e-12 ? fmtT(1 / (2 * beta)) : Lb.infinite, period: m.period != null ? fmtT(m.period) : Lb.none,
      q: beta > 1e-12 ? num(w0 / (2 * beta), 2) : Lb.infinite, crossings: String(zeroCrossings({ w0, beta, x0: st.x0, v0: st.v0, tol }, win)), regime: Lb[m.kind],
      r1: m.r1 != null ? `${num(m.r1, 3)} ${U.w}` : m.kind === 'critical' ? `${num(-beta, 3)} ${U.w}` : Lb.none, r2: m.r2 != null ? `${num(m.r2, 3)} ${U.w}` : m.kind === 'critical' ? `${num(-beta, 3)} ${U.w}` : Lb.none,
      x: `${num(m.x(t), 3)} ${U.x}`.trim(), v: `${num(m.v(t), 3)} ${U.x}${U.x ? '/' + U.time : ''}`.trim(), time: fmtT(t) };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    for (const f of syncs) f();
    if (playBtn) playBtn.textContent = playing ? Lb.pause : Lb.play;
    paint();
  }
  function loop() {
    cancelAnimationFrame(raf);
    const tick = now => {
      if (!el.isConnected || !playing) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (st.t >= win) { held += dt; if (held >= hold) { st.t = 0; held = 0; } }
      else st.t = Math.min(win, st.t + dt * timeScale);
      update();
      raf = requestAnimationFrame(tick);
    };
    last = performance.now(); raf = requestAnimationFrame(tick);
  }
  update();
  if (playing) loop();
}
