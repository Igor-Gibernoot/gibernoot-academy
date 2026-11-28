// lissajous-lab
//
// A two-dimensional oscillator  x = Ax cos(wx t - dx),  y = Ay cos(wy t - dy)  (Taylor 5.3 form). The dot moves on the xy plane and leaves a fading trail; the complete
// closed curve can be drawn faint under it. Two strips show x(t) and y(t) with projection lines from the dot. Plain SVG + HTML, every word from the config
// (no course text hard-coded). Reports nothing to the card.
// Phases: dx = phaseX (default 0), dy = dx + delta, so delta = dy - dx is the phase difference.
// Layout (fixed, so nothing jumps): the plane (x horizontal, y vertical) top left; the y(t) strip to its right (time runs right, value vertical, sharing the y axis);
// the x(t) strip below it (time runs down, value horizontal, sharing the x axis). The strips show the past: "now" is at the plane, older time farther away.
//
//   ax: 1   ay: 1   wx: 2   wy: 3   delta: 0   phaseX: 0      (phases in rad; w in rad per time unit)
//   extent: amplitude drawn at the plane's edge (default: largest amplitude range)
//   ranges: { ax: [0, 1.5, 0.05], ay: [0, 1.5, 0.05], wx: [1, 6, 1], wy: [1, 6, 1], delta: [-pi, pi, pi/36] }   (use a finer w step, e.g. 0.05, to reach open curves)
//   window: time shown in each strip (default two periods of the slower initial w)     trail: time length of the fading trail (default window)
//   curveTime: time span of the full curve when the ratio is not rational (default 10 windows)      timeScale: 1 (simulated time per real second)
//   autoplay: true      time: 0 (start time)      phaseUnit: 'rad' | 'deg'      units: { time: 's', w: 'rad/s' }
//   tolerance: 1e-4 (relative error under which wx/wy counts as rational, denominators up to 24)
//   show: { axes, axisLabels, trail, curve, dot, xStrip, yStrip, xProjection, yProjection, nowDot, labels, readouts, axSlider, aySlider, wxSlider, wySlider, deltaSlider,
//           timeSlider, play, presets }
//       defaults true except curve, timeSlider (false).
//       axes = the x and y axes (and the strip axes); axisLabels = their names; trail = fading path behind the dot; curve = the complete curve (one common period if the
//       ratio is rational, else curveTime); dot = the moving dot; xStrip / yStrip = the x(t) strip (below) and y(t) strip (right); xProjection = dashed line from the dot down
//       to the x strip, yProjection = from the dot right to the y strip; nowDot = dot at "now" on each strip; labels = text in the drawing.
//   readouts: any of ratio, delta, type, period, wx, wy, ax, ay, x, y, time (default [ratio, delta, type]).
//   presets: [{ label, ax, ay, wx, wy, delta }]   only the fields given change
//   labels: { x, y, time, ax, ay, wx, wy, delta, timeSlider, ratio, deltaRead, type, period, wxRead, wyRead, axRead, ayRead, xRead, yRead, timeRead, play, pause, reset,
//             line, circle, ellipse, closed, open, none }       (none = shown as the period of an open curve)
// Exported for script checks: ratioOf(wx, wy, tol) -> {p, q} | null (wx/wy = p/q in lowest terms), curveKind({ax, ay, wx, wy, delta, tol}) -> 'line' | 'circle' | 'ellipse' | 'closed' | 'open'.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };

export function ratioOf(wx, wy, tol = 1e-4) {
  if (!(wx > 0) || !(wy > 0)) return null;
  const r = wx / wy;
  for (let q = 1; q <= 24; q++) {
    const p = Math.round(r * q);
    if (p >= 1 && Math.abs(r - p / q) <= tol * r) { const g = (a, b) => (b ? g(b, a % b) : a), d = g(p, q); return { p: p / d, q: q / d }; }
  }
  return null;
}

export function curveKind({ ax, ay, wx, wy, delta, tol = 1e-4 }) {
  const rt = ratioOf(wx, wy, tol);
  if (!rt) return 'open';
  if (ax < 1e-9 || ay < 1e-9) return 'line';
  if (rt.p === 1 && rt.q === 1) {
    if (Math.abs(Math.sin(delta)) < 1e-3) return 'line';
    return Math.abs(Math.cos(delta)) < 1e-3 && Math.abs(ax - ay) < 1e-9 ? 'circle' : 'ellipse';
  }
  return 'closed';
}

export function lissajousLab(el, cfg = {}) {
  const Lb = { x: 'x', y: 'y', time: 'time', ax: 'Amplitude Ax', ay: 'Amplitude Ay', wx: 'Frequency ωx', wy: 'Frequency ωy', delta: 'Phase difference δ', timeSlider: 'Time',
    ratio: 'ωx : ωy', deltaRead: 'δ', type: 'Curve', period: 'Period', wxRead: 'ωx', wyRead: 'ωy', axRead: 'Ax', ayRead: 'Ay', xRead: 'x', yRead: 'y', timeRead: 'Time',
    play: 'Play', pause: 'Pause', reset: 'Reset', line: 'line', circle: 'circle', ellipse: 'ellipse', closed: 'closed curve', open: 'open curve', none: '–', ...(cfg.labels ?? {}) };
  const U = { time: 's', w: 'rad/s', ...(cfg.units ?? {}) };
  const show = { axes: true, axisLabels: true, trail: true, curve: false, dot: true, xStrip: true, yStrip: true, xProjection: true, yProjection: true, nowDot: true, labels: true,
    readouts: true, axSlider: true, aySlider: true, wxSlider: true, wySlider: true, deltaSlider: true, timeSlider: false, play: true, presets: true, ...(cfg.show ?? {}) };
  const deg = cfg.phaseUnit === 'deg', PI = Math.PI, tol = cfg.tolerance ?? 1e-4;
  const R = { ax: [0, 1.5, 0.05], ay: [0, 1.5, 0.05], wx: [1, 6, 1], wy: [1, 6, 1], delta: [-PI, PI, PI / 36], ...(cfg.ranges ?? {}) };
  const init = { ax: cfg.ax ?? 1, ay: cfg.ay ?? 1, wx: cfg.wx ?? 2, wy: cfg.wy ?? 3, d: cfg.delta ?? 0, t: cfg.time ?? 0 };
  const st = { ...init }, dx0 = cfg.phaseX ?? 0;
  const win = cfg.window ?? 4 * PI / Math.min(init.wx, init.wy), trailT = cfg.trail ?? win, timeScale = cfg.timeScale ?? 1;
  let playing = cfg.autoplay !== false, raf = 0, last = 0;

  // ---- model
  const xAt = t => st.ax * Math.cos(st.wx * t - dx0), yAt = t => st.ay * Math.cos(st.wy * t - dx0 - st.d);
  const kind = () => curveKind({ ax: st.ax, ay: st.ay, wx: st.wx, wy: st.wy, delta: st.d, tol });
  const period = () => { const rt = ratioOf(st.wx, st.wy, tol); return rt ? 2 * PI * rt.q / st.wy : null; };

  // ---- geometry (px)
  const W = 360, Rmax = Math.max(cfg.extent ?? Math.max(R.ax[1], R.ay[1]), 0.1);
  const Rpx = 74, k = Rpx / Rmax;
  const cx = show.yStrip ? 92 : W / 2, cy = Rpx + 16, TR = show.xStrip ? 124 : 0, Hh = 2 * Rpx + 32 + TR;
  const sx0 = 186, sx1 = W - 8, ty0 = cy + Rpx + 14, ty1 = Hh - 8;
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fs-svg', role: 'img', 'aria-label': 'oscillator' });
  const P = (x, y) => [cx + x * k, cy - y * k];
  const pathOf = (t0, t1, n) => { let d = ''; for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n, [X, Y] = P(xAt(t), yAt(t)); d += (i ? ' L' : 'M') + X.toFixed(1) + ',' + Y.toFixed(1); } return d; };

  function paint() {
    const g = s('g'), t = st.t;
    const lab = (x, y, txt, o = {}) => show.labels && g.append(s('text', { x, y, 'font-size': 10, fill: 'var(--muted)', ...o }, txt));
    if (show.axes) {
      g.append(s('line', { x1: cx - Rpx - 4, y1: cy, x2: cx + Rpx + 4, y2: cy, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.7 }),
        s('line', { x1: cx, y1: cy - Rpx - 4, x2: cx, y2: cy + Rpx + 4, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.7 }));
      if (show.xStrip) g.append(s('line', { x1: cx, y1: ty0, x2: cx, y2: ty1, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.5 }));
      if (show.yStrip) g.append(s('line', { x1: sx0, y1: cy, x2: sx1, y2: cy, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.5 }));
    }
    if (show.axisLabels) {
      lab(cx + Rpx + 3, cy - 4, Lb.x, { 'text-anchor': 'end' });
      lab(cx + 4, cy - Rpx + 6, Lb.y);
      if (show.xStrip) lab(cx + 6, ty1 + 6, Lb.time);
      if (show.yStrip) lab(sx1, cy + 12, Lb.time, { 'text-anchor': 'end' });
    }
    // complete curve
    if (show.curve) {
      const T = period() ?? cfg.curveTime ?? 10 * win;
      g.append(s('path', { d: pathOf(0, T, 1200), fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1.4, opacity: 0.55, 'stroke-linejoin': 'round' }));
    }
    // fading trail
    if (show.trail) {
      const n = 48;
      for (let i = 0; i < n; i++) {
        const a = t - trailT * (i + 1) / n, b = t - trailT * i / n;
        g.append(s('path', { d: pathOf(a, b, 3), fill: 'none', stroke: 'var(--basis)', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: (1 - i / n).toFixed(2) }));
      }
    }
    const [mx, my] = P(xAt(t), yAt(t));
    // projections
    if (show.xProjection && show.dot) g.append(s('line', { x1: mx, y1: my, x2: mx, y2: show.xStrip ? ty0 : cy, stroke: 'var(--accent)', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }),
      s('circle', { cx: mx, cy, r: 3.2, fill: 'var(--accent)' }));
    if (show.yProjection && show.dot) g.append(s('line', { x1: mx, y1: my, x2: show.yStrip ? sx0 : cx, y2: my, stroke: 'var(--good)', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }),
      s('circle', { cx, cy: my, r: 3.2, fill: 'var(--good)' }));
    // strips: now at the plane, past away from it
    const N = 160, strip = (kindS, col) => {
      let d = '';
      for (let i = 0; i <= N; i++) {
        const sT = win * i / N, [X, Y] = kindS === 'x' ? [cx + xAt(t - sT) * k, ty0 + (ty1 - ty0) * sT / win] : [sx0 + (sx1 - sx0) * sT / win, cy - yAt(t - sT) * k];
        d += (i ? ' L' : 'M') + X.toFixed(1) + ',' + Y.toFixed(1);
      }
      g.append(s('path', { d, fill: 'none', stroke: col, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }));
      if (show.nowDot) g.append(kindS === 'x' ? s('circle', { cx: cx + xAt(t) * k, cy: ty0, r: 3.6, fill: col }) : s('circle', { cx: sx0, cy: cy - yAt(t) * k, r: 3.6, fill: col }));
    };
    if (show.xStrip) strip('x', 'var(--accent)');
    if (show.yStrip) strip('y', 'var(--good)');
    if (show.dot) g.append(s('circle', { cx: mx, cy: my, r: 4.5, fill: 'var(--ink)' }));
    svg.replaceChildren(g);
  }

  // ---- readouts and controls
  const reads = cfg.readouts ?? ['ratio', 'delta', 'type'];
  const rd = {};
  const names = { ratio: Lb.ratio, delta: Lb.deltaRead, type: Lb.type, period: Lb.period, wx: Lb.wxRead, wy: Lb.wyRead, ax: Lb.axRead, ay: Lb.ayRead, x: Lb.xRead, y: Lb.yRead, time: Lb.timeRead };
  const readEl = h('div', { class: 'fs-reads' }, reads.map(key => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[key] ?? key)), rd[key] = h('div', { class: 'fs-num', role: 'status' }))));
  const ph = v => (deg ? `${num(v * 180 / PI, 0)}°` : `${num(v, 2)} rad`);
  const slider = (label, min, max, step, get, set, fmt) => {
    const inp = h('input', { type: 'range', min, max, step, 'aria-label': label }), val = h('span', { class: 'fs-num' });
    inp.addEventListener('input', () => { set(+inp.value); update(); });
    const row = h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(label)), inp, val);
    return { row, sync: () => { inp.value = get(); val.textContent = fmt(get()); } };
  };
  const rows = [], syncs = [];
  const add = (flag, label, rng, get, set, fmt) => { if (!flag) return; const o = slider(label, rng[0], rng[1], rng[2], get, set, fmt); rows.push(o.row); syncs.push(o.sync); };
  add(show.axSlider, Lb.ax, R.ax, () => st.ax, v => { st.ax = v; }, v => num(v, 2));
  add(show.aySlider, Lb.ay, R.ay, () => st.ay, v => { st.ay = v; }, v => num(v, 2));
  add(show.wxSlider, Lb.wx, R.wx, () => st.wx, v => { st.wx = v; }, v => `${num(v, 2)} ${U.w}`);
  add(show.wySlider, Lb.wy, R.wy, () => st.wy, v => { st.wy = v; }, v => `${num(v, 2)} ${U.w}`);
  add(show.deltaSlider, Lb.delta, R.delta, () => st.d, v => { st.d = v; }, ph);
  add(show.timeSlider, Lb.timeSlider, [0, win * 2, win / 400], () => st.t, v => { st.t = v; playing = false; }, v => `${num(v, 2)} ${U.time}`);
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  let playBtn = null;
  const apply = pr => {
    if (pr.ax != null) st.ax = pr.ax;
    if (pr.ay != null) st.ay = pr.ay;
    if (pr.wx != null) st.wx = pr.wx;
    if (pr.wy != null) st.wy = pr.wy;
    if (pr.delta != null) st.d = pr.delta;
    update();
  };
  const presets = show.presets ? cfg.presets ?? [] : [];
  const btns = h('div', { class: 'wbtns' },
    show.play ? (playBtn = btn(Lb.pause, () => { playing = !playing; if (playing) loop(); update(); })) : '',
    show.play ? btn(Lb.reset, () => { Object.assign(st, init); update(); }) : '',
    presets.map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', rows.length ? h('div', { class: 'fs-sliders' }, rows) : '', btns);

  function update() {
    const rt = ratioOf(st.wx, st.wy, tol), T = period();
    const val = { ratio: rt ? `${rt.p} : ${rt.q}` : `${num(st.wx / st.wy, 3)} : 1`, delta: ph(st.d), type: Lb[kind()], period: T ? `${num(T, 2)} ${U.time}` : Lb.none,
      wx: `${num(st.wx, 2)} ${U.w}`, wy: `${num(st.wy, 2)} ${U.w}`, ax: num(st.ax, 2), ay: num(st.ay, 2), x: num(xAt(st.t), 2), y: num(yAt(st.t), 2), time: `${num(st.t, 2)} ${U.time}` };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    for (const f of syncs) f();
    if (playBtn) playBtn.textContent = playing ? Lb.pause : Lb.play;
    paint();
  }
  function loop() {
    cancelAnimationFrame(raf);
    const tick = now => {
      if (!el.isConnected || !playing) return;
      st.t += Math.min(0.05, (now - last) / 1000) * timeScale; last = now;
      update();
      raf = requestAnimationFrame(tick);
    };
    last = performance.now(); raf = requestAnimationFrame(tick);
  }
  update();
  if (playing) loop();
}
