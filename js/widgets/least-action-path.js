// least-action-path
//
// Mode 'path' (default): a particle moves from the fixed event (t0, y0) to the fixed event (t1, y1). The plot has time t
// horizontal and height y vertical. The reader drags n control points (vertically, at equally spaced times); the path is
// the curve through the endpoints and the points (smooth = polynomial through all of them, or straight pieces). Live action
//   S = integral of (T - V) dt,   T = 1/2 m (dy/dt)^2,   V = m g y + 1/2 k y^2   (g = 0 and k = 0: free particle)
// with its two parts, and the true path (solution of m y'' = -m g - k y) as a dashed curve with its own S.
//
// Mode 'fermat': light goes from A (medium 1, speed v1, above the boundary y = 0) to B (medium 2, speed v2, below).
// The reader drags the crossing point X along the boundary; live travel time, angles from the normal, Snell's quantities
// sin(theta)/v, and the minimum (the straight-in-each-medium path obeying Snell's law).
// General: no course text is hard-coded; every word comes from the config.
//
//   mode: 'path' | 'fermat'
//  -- path --
//   t0: 0, t1: 2, y0: 0, y1: 2                fixed endpoints (time and height)
//   yMin: -1, yMax: 4                          vertical range of the plot (fixed)
//   points: 1                                  number of draggable control points (1 to 5)
//   curve: 'smooth' | 'linear'                 polynomial through all points (default) or straight pieces
//   m: 1, g: 0, k: 0                           mass, gravity (V = m g y, y up), spring constant (V = k y^2 / 2)
//   start: [..]                                start heights of the control points (default: straight line, shifted by startOffset)
//   startOffset: 1                             shift of the default start (alternating sign for several points)
//   hideTrue: false                            true = true path and S_true hidden until the Reveal button is pressed
//   sliders: ['m','g','k']                     which sliders to show (default none)
//   ranges: { m: [0.5,3,0.5], g: [0,12,1], k: [0,8,0.5] }
//  -- fermat --
//   A: [0, 3], B: [6, -3]                      the two points (x, y): A above the boundary (y > 0), B below (y < 0)
//   xRange: [-1, 7]                            horizontal range of the picture and of the crossing point
//   v1: 1, v2: 0.67                            speeds in the upper and lower medium
//   x: auto                                    start position of the crossing point (default: 30% of the way from the best point)
//   hideTrue: false                            minimum and best crossing point hidden until the Reveal button
//   sliders: ['v1','v2']                       which sliders to show; ranges: { v1: [0.2,3,0.1], v2: [0.2,3,0.1] }
//  -- both --
//   units: { time: 's', distance: 'm', action: 'J s' }
//   show: { truePath, readouts, bar, labels, grid, points, snap, reveal, parts, angles, snell, timeCurve, media, reset }
//       path: truePath = dashed true path (and S_true), bar = action gauge with the true value marked, labels = axis names and
//       endpoint letters, grid, points = the drag handles shown as dots (the line still can be set by presets), snap = button
//       'snap to true path', reveal = the Reveal button (only with hideTrue), parts = readouts T and V integrals,
//       reset = Reset button. fermat: truePath = dashed best path and the minimum, angles = angle marks and readouts,
//       snell = readout sin/v of both media, timeCurve = small plot of time against crossing point (default false),
//       media = shaded media and their names. readouts = all readout cells. Defaults true except grid and timeCurve.
//   readouts: path ['S','Strue','diff','T','V'] default ['S','Strue']; fermat ['time','best','theta1','theta2','snell1','snell2']
//       default ['time','best']
//   presets: [{ label, ...fields }]   path fields: start, g, m, k, curve; fermat fields: x, v1, v2
//   labels: { S, Strue, diff, T, V, time, best, theta1, theta2, snell1, snell2, snap, reveal, hide, reset, t, y, start, end,
//             medium1, medium2, m, g, k, v1, v2, truePath, yours, figure }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const r = Number((+v).toFixed(d)); return String(Object.is(r, -0) ? 0 : r); };

// ---------- pure model (exported for script checks) ----------
// Path through the knots (ts, ys): polynomial (smooth) or piecewise linear. Returns y(t).
export function makePath(ts, ys, curve = 'smooth') {
  const n = ts.length;
  if (curve === 'linear') return t => { let i = 0; while (i < n - 2 && t > ts[i + 1]) i++; const u = (t - ts[i]) / (ts[i + 1] - ts[i]); return ys[i] + u * (ys[i + 1] - ys[i]); };
  return t => { let sum = 0; for (let i = 0; i < n; i++) { let l = ys[i]; for (let j = 0; j < n; j++) if (j !== i) l *= (t - ts[j]) / (ts[i] - ts[j]); sum += l; } return sum; };
}
// Action of y(t) on [t0, t1]: S = integral of (1/2 m y'^2 - m g y - 1/2 k y^2) dt (Simpson, 800 intervals).
export function actionOf(y, { t0, t1, m = 1, g = 0, k = 0 }) {
  const N = 800, dt = (t1 - t0) / N, e = (t1 - t0) * 1e-5;
  let Tk = 0, Vp = 0;
  for (let i = 0; i <= N; i++) {
    const t = t0 + i * dt, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2;
    const a = Math.max(t0, t - e), b = Math.min(t1, t + e), v = (y(b) - y(a)) / (b - a), yy = y(t);
    Tk += w * 0.5 * m * v * v; Vp += w * (m * g * yy + 0.5 * k * yy * yy);
  }
  Tk *= dt / 3; Vp *= dt / 3;
  return { S: Tk - Vp, T: Tk, V: Vp };
}
// True path: m y'' = -m g - k y with y(t0) = y0, y(t1) = y1. Returns y(t) or null if it is not unique.
export function truePathOf({ t0, t1, y0, y1, m = 1, g = 0, k = 0 }) {
  const T = t1 - t0;
  if (k <= 1e-12) { const v0 = (y1 - y0) / T + g * T / 2; return t => { const u = t - t0; return y0 + v0 * u - 0.5 * g * u * u; }; }
  const w = Math.sqrt(k / m), ye = -m * g / k, sn = Math.sin(w * T);
  if (Math.abs(sn) < 1e-6) return null;
  const A = y0 - ye, B = ((y1 - ye) - A * Math.cos(w * T)) / sn;
  return t => ye + A * Math.cos(w * (t - t0)) + B * Math.sin(w * (t - t0));
}
// Light from A=(xa, ha>0) to B=(xb, hb<0) crossing y = 0 at x: travel time. best = Snell crossing point.
export function fermatTime({ A, B, v1, v2 }, x) { return Math.hypot(x - A[0], A[1]) / v1 + Math.hypot(B[0] - x, B[1]) / v2; }
export function fermatBest(c, lo, hi) {
  let a = Math.min(lo, c.A[0], c.B[0]), b = Math.max(hi, c.A[0], c.B[0]);
  const gr = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 80; i++) { const x1 = b - gr * (b - a), x2 = a + gr * (b - a); fermatTime(c, x1) < fermatTime(c, x2) ? b = x2 : a = x1; }
  return (a + b) / 2;
}

export function leastActionPath(el, cfg) {
  const mode = cfg.mode === 'fermat' ? 'fermat' : 'path';
  const show = { truePath: true, readouts: true, bar: true, labels: true, grid: false, points: true, snap: false, reveal: true, parts: true, angles: true, snell: true, timeCurve: false, media: true, reset: true, ...(cfg.show ?? {}) };
  const U = { time: 's', distance: 'm', action: 'J s', ...(cfg.units ?? {}) };
  const sliderKeys = cfg.sliders ?? [];
  const hideTrue = !!cfg.hideTrue;
  let revealed = !hideTrue;
  const trueVisible = () => show.truePath && revealed;
  const svg = s('svg', { viewBox: '0 0 360 236', class: 'fs-svg', role: 'img', 'aria-label': cfg.labels?.figure ?? (mode === 'fermat' ? 'Light path across a boundary' : 'Path between two events') });
  svg.style.touchAction = 'none';
  const rd = {}, inps = {}, vals = {};
  let model;

  const dragH = (c, onMove) => {
    c.classList.add('w-handle'); c.style.cursor = 'grab';
    c.addEventListener('pointerdown', e => {
      e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
      const move = ev => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const ctm = svg.getScreenCTM(); if (ctm) { const m = pt.matrixTransform(ctm.inverse()); onMove(m.x, m.y); } };
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); c.removeEventListener('pointermove', move); };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); c.addEventListener('pointermove', move);
    });
  };
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const slider = (key, lo, hi, step, label, fmtv) => {
    const inp = inps[key] = h('input', { type: 'range', min: lo, max: hi, step, 'aria-label': label });
    inp.addEventListener('input', () => { model.set(key, +inp.value); model.redraw(); });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(label)), inp, vals[key] = h('span', { class: 'fs-num' }));
  };

  // =============== PATH MODE ===============
  function pathMode() {
    const Lb = { S: 'Action S', Strue: 'Action of the true path', diff: 'S minus S of the true path', T: 'Integral of kinetic energy', V: 'Integral of potential energy',
      snap: 'Snap to true path', reveal: 'Show true path', hide: 'Hide true path', reset: 'Reset', t: 'time t', y: 'height y', start: 'start', end: 'end',
      m: 'Mass m', g: 'Gravity g', k: 'Spring k', truePath: 'true path', yours: 'your path', ...(cfg.labels ?? {}) };
    const c = { t0: cfg.t0 ?? 0, t1: cfg.t1 ?? 2, y0: cfg.y0 ?? 0, y1: cfg.y1 ?? 2 };
    const yMin = cfg.yMin ?? -1, yMax = cfg.yMax ?? 4, n = Math.max(1, Math.min(5, cfg.points ?? 1));
    const R = { m: [0.5, 3, 0.5], g: [0, 12, 1], k: [0, 8, 0.5], ...(cfg.ranges ?? {}) };
    const st = { m: cfg.m ?? 1, g: cfg.g ?? 0, k: cfg.k ?? 0, curve: cfg.curve === 'linear' ? 'linear' : 'smooth' };
    const ts = Array.from({ length: n }, (_, i) => c.t0 + (c.t1 - c.t0) * (i + 1) / (n + 1));
    const lin = t => c.y0 + (c.y1 - c.y0) * (t - c.t0) / (c.t1 - c.t0);
    const off = cfg.startOffset ?? 1;
    const initYs = Array.from({ length: n }, (_, i) => cfg.start?.[i] ?? lin(ts[i]) + (i % 2 ? -off : off));
    const ys = initYs.slice();
    const clampY = v => Math.max(yMin, Math.min(yMax, v));
    const PL = 40, PR = 346, PT = 14, PH = 150, PB = PT + PH;
    const xOf = t => PL + (t - c.t0) / (c.t1 - c.t0) * (PR - PL), yOf = y => PB - (y - yMin) / (yMax - yMin) * PH;
    const tOf = px => c.t0 + (px - PL) / (PR - PL) * (c.t1 - c.t0), yFrom = py => yMin + (PB - py) / PH * (yMax - yMin);
    const knotsT = [c.t0, ...ts, c.t1];
    const userPath = () => makePath(knotsT, [c.y0, ...ys, c.y1], st.curve);
    const pars = () => ({ t0: c.t0, t1: c.t1, m: st.m, g: st.g, k: st.k });
    const trueP = () => truePathOf({ ...c, m: st.m, g: st.g, k: st.k });
    const curveD = f => { const N = 120, p = []; for (let i = 0; i <= N; i++) { const t = c.t0 + (c.t1 - c.t0) * i / N; p.push(`${i ? 'L' : 'M'}${xOf(t).toFixed(1)} ${Math.max(PT - 6, Math.min(PB + 6, yOf(f(t)))).toFixed(1)}`); } return p.join(' '); };
    // action gauge scale: from the true action (or 0) to the largest action among extreme control points
    const corners = () => {
      let hi = -Infinity, lo = Infinity; const kk = Math.min(n, 4);
      for (let mask = 0; mask < (1 << kk); mask++) { const yy = ys.map((_, i) => i < kk ? ((mask >> i) & 1 ? yMax : yMin) : ys[i]); const a = actionOf(makePath(knotsT, [c.y0, ...yy, c.y1], st.curve), pars()).S; hi = Math.max(hi, a); lo = Math.min(lo, a); }
      return [lo, hi];
    };
    const BY = PB + 40;
    function paint() {
      const f = userPath(), A = actionOf(f, pars()), tp = trueP(), At = tp ? actionOf(tp, pars()) : null;
      const g0 = s('g');
      if (show.grid) {
        for (let i = 0; i <= 4; i++) { g0.append(s('line', { x1: PL, x2: PR, y1: PT + PH * i / 4, y2: PT + PH * i / 4, stroke: 'var(--line, #ccc)', 'stroke-width': 0.7 }), s('line', { y1: PT, y2: PB, x1: PL + (PR - PL) * i / 4, x2: PL + (PR - PL) * i / 4, stroke: 'var(--line, #ccc)', 'stroke-width': 0.7 })); }
      }
      g0.append(s('line', { x1: PL, y1: PT, x2: PL, y2: PB, stroke: 'var(--ink)', 'stroke-width': 1.2 }), s('line', { x1: PL, y1: PB, x2: PR, y2: PB, stroke: 'var(--ink)', 'stroke-width': 1.2 }));
      if (show.labels) g0.append(s('text', { x: PL + 4, y: PT + 8, 'font-size': 9.5, fill: 'var(--muted)' }, Lb.y), s('text', { x: PR, y: PB + 13, 'font-size': 9.5, 'text-anchor': 'end', fill: 'var(--muted)' }, Lb.t),
        s('text', { x: xOf(c.t0) + 6, y: yOf(c.y0) + 18, 'font-size': 10, fill: 'var(--ink)', 'font-weight': 650 }, Lb.start),
        s('text', { x: xOf(c.t1) - 6, y: yOf(c.y1) + 18, 'font-size': 10, 'text-anchor': 'end', fill: 'var(--ink)', 'font-weight': 650 }, Lb.end));
      if (tp && trueVisible()) g0.append(s('path', { d: curveD(tp), fill: 'none', stroke: 'var(--basis)', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }));
      g0.append(s('path', { d: curveD(f), fill: 'none', stroke: 'var(--vec)', 'stroke-width': 3 }));
      for (const [tt, yy] of [[c.t0, c.y0], [c.t1, c.y1]]) g0.append(s('circle', { cx: xOf(tt), cy: yOf(yy), r: 5.5, fill: 'var(--ink)', stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
      svg.append(g0);
      if (show.points) ys.forEach((yy, i) => {
        const cir = s('circle', { cx: xOf(ts[i]), cy: yOf(yy), r: 8, fill: 'var(--covec)', stroke: 'var(--bg, #fff)', 'stroke-width': 2 });
        dragH(cir, (_px, py) => { ys[i] = clampY(yFrom(py)); redraw(); });
        svg.append(cir);
      });
      if (show.bar) {
        const [lo0, hi0] = corners(), ref = At ? At.S : lo0, lo = Math.min(lo0, ref, A.S), hi = Math.max(hi0, A.S, ref + 1e-9), span = (hi - lo) || 1;
        const bx = 24, bw = 312, xs = v => bx + Math.max(0, Math.min(1, (v - lo) / span)) * bw;
        const bg = s('g');
        bg.append(s('rect', { x: bx, y: BY, width: bw, height: 14, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1 }),
          s('rect', { x: bx, y: BY, width: xs(A.S) - bx, height: 14, fill: 'var(--vec)', opacity: 0.85 }));
        if (At && trueVisible()) bg.append(s('line', { x1: xs(At.S), x2: xs(At.S), y1: BY - 4, y2: BY + 18, stroke: 'var(--basis)', 'stroke-width': 2.5 }));
        if (show.labels) bg.append(s('text', { x: bx, y: BY + 28, 'font-size': 9.5, fill: 'var(--vec)', 'font-weight': 650 }, `S = ${num(A.S, 2)} ${U.action}`),
          ...(At && trueVisible() ? [s('text', { x: bx + bw, y: BY + 28, 'font-size': 9.5, 'text-anchor': 'end', fill: 'var(--basis)', 'font-weight': 650 }, `${Lb.truePath}: ${num(At.S, 2)}`)] : []));
        svg.append(bg);
      }
      const val = { S: `${num(A.S, 2)} ${U.action}`, Strue: At && trueVisible() ? `${num(At.S, 2)} ${U.action}` : '–', T: `${num(A.T, 2)} ${U.action}`, V: `${num(A.V, 2)} ${U.action}`,
        diff: At && trueVisible() ? `${A.S - At.S >= 0 ? '+' : ''}${num(A.S - At.S, 2)} ${U.action}` : '–' };
      for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
      for (const [key, inp] of Object.entries(inps)) { inp.value = st[key]; vals[key].textContent = num(st[key], 1); }
      if (revBtn) revBtn.textContent = revealed ? Lb.hide : Lb.reveal;
    }
    const reads = cfg.readouts ?? ['S', 'Strue'];
    const names = { S: Lb.S, Strue: Lb.Strue, diff: Lb.diff, T: Lb.T, V: Lb.V };
    const redraw = () => { svg.replaceChildren(); paint(); };
    const revBtn = hideTrue && show.reveal ? btn(Lb.reveal, () => { revealed = !revealed; redraw(); }) : null;
    const snapBtn = show.snap ? btn(Lb.snap, () => { const tp = trueP(); if (tp) { ys.forEach((_, i) => { ys[i] = clampY(tp(ts[i])); }); redraw(); } }) : null;
    const apply = p => {
      for (const key of ['g', 'm', 'k', 'curve']) if (p[key] != null) st[key] = p[key];
      if (p.start) p.start.forEach((v, i) => { if (i < n) ys[i] = clampY(v); });
      redraw();
    };
    model = { set: (k, v) => { st[k] = v; }, redraw };
    const sliderEls = sliderKeys.filter(k => R[k]).map(k => slider(k, ...R[k], Lb[k]));
    const cells = reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' })));
    const btns = h('div', { class: 'wbtns' }, revBtn ?? '', snapBtn ?? '', show.reset ? btn(Lb.reset, () => { ys.splice(0, n, ...initYs); revealed = !hideTrue; redraw(); }) : '', (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
    el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? h('div', { class: 'fs-reads' }, cells) : '', sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', btns);
    redraw();
  }

  // =============== FERMAT MODE ===============
  function fermatMode() {
    const Lb = { time: 'Travel time', best: 'Shortest time', theta1: 'Angle in medium 1', theta2: 'Angle in medium 2', snell1: 'sin(angle) / speed, medium 1', snell2: 'sin(angle) / speed, medium 2',
      reveal: 'Show the minimum', hide: 'Hide the minimum', reset: 'Reset', medium1: 'medium 1', medium2: 'medium 2', v1: 'Speed in medium 1', v2: 'Speed in medium 2',
      truePath: 'shortest time', ...(cfg.labels ?? {}) };
    const A = cfg.A ?? [0, 3], B = cfg.B ?? [6, -3], [xlo, xhi] = cfg.xRange ?? [-1, 7];
    const R = { v1: [0.2, 3, 0.1], v2: [0.2, 3, 0.1], ...(cfg.ranges ?? {}) };
    const st = { v1: cfg.v1 ?? 1, v2: cfg.v2 ?? 0.67 };
    const PL = 20, PR = 340, PT = 14, PH = 168, PB = PT + PH;
    const ylo = Math.min(B[1], -1) - 0.6, yhi = Math.max(A[1], 1) + 0.6;
    const sx = Math.min((PR - PL) / (xhi - xlo), PH / (yhi - ylo)), sy = sx, ox = PL + ((PR - PL) - (xhi - xlo) * sx) / 2, X = x => ox + (x - xlo) * sx, Y = y => PT + (yhi - y) * sy;
    const cfgOf = () => ({ A, B, v1: st.v1, v2: st.v2 });
    const bestX = () => fermatBest(cfgOf(), xlo, xhi);
    let x = Math.max(xlo, Math.min(xhi, cfg.x ?? (A[0] + B[0]) / 2 - 1.5));
    const initX = x;
    const sinOf = (dx, dy) => Math.abs(dx) / Math.hypot(dx, dy);
    const arrowhead = (p, q, col) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; return s('polygon', { fill: col, points: `${mx + ux * 6},${my + uy * 6} ${mx - ux * 4 - uy * 4},${my - uy * 4 + ux * 4} ${mx - ux * 4 + uy * 4},${my - uy * 4 - ux * 4}` }); };
    const ray = (xc, col, w, dash) => {
      const g = s('g'), pa = [X(A[0]), Y(A[1])], px = [X(xc), Y(0)], pb = [X(B[0]), Y(B[1])];
      g.append(s('polyline', { points: `${pa} ${px} ${pb}`, fill: 'none', stroke: col, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) }), arrowhead(pa, px, col), arrowhead(px, pb, col));
      return g;
    };
    function paint() {
      const c = cfgOf(), tm = fermatTime(c, x), xb = bestX(), tb = fermatTime(c, xb), g0 = s('g');
      if (show.media) g0.append(s('rect', { x: PL, y: Y(0), width: PR - PL, height: Y(ylo) - Y(0), fill: 'var(--vec)', opacity: 0.16 }),
        s('rect', { x: PL, y: Y(yhi), width: PR - PL, height: Y(0) - Y(yhi), fill: 'var(--muted)', opacity: 0.06 }));
      if (show.grid) for (let gx = Math.ceil(xlo); gx <= xhi; gx++) g0.append(s('line', { x1: X(gx), x2: X(gx), y1: PT, y2: PB, stroke: 'var(--line, #ccc)', 'stroke-width': 0.6 }));
      g0.append(s('line', { x1: PL, y1: Y(0), x2: PR, y2: Y(0), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      if (show.media && show.labels) g0.append(s('text', { x: PR - 4, y: Y(0) - 5, 'font-size': 10, 'text-anchor': 'end', fill: 'var(--muted)' }, `${Lb.medium1}  v = ${num(st.v1, 2)}`), s('text', { x: PR - 4, y: Y(0) + 13, 'font-size': 10, 'text-anchor': 'end', fill: 'var(--muted)' }, `${Lb.medium2}  v = ${num(st.v2, 2)}`));
      if (show.angles) {
        const x0 = X(x), y0 = Y(0), r = 28;
        g0.append(s('line', { x1: x0, x2: x0, y1: y0 - 48, y2: y0 + 48, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }));
        const mark = (px, py, dir) => {
          const dx = px - x0, dy = (py - y0) * -dir, L = Math.hypot(dx, dy) || 1, ex = x0 + r * dx / L, ey = y0 + r * (py - y0) / L;
          if (Math.abs(dx) < 0.5) return;
          g0.append(s('path', { d: `M${x0} ${y0 - dir * r} A${r} ${r} 0 0 ${(dx > 0) === (dir > 0) ? 1 : 0} ${ex} ${ey}`, fill: 'none', stroke: 'var(--covec)', 'stroke-width': 1.6 }));
        };
        mark(X(A[0]), Y(A[1]), 1); mark(X(B[0]), Y(B[1]), -1);
      }
      if (trueVisible()) g0.append(ray(xb, 'var(--basis)', 2.5, '6 4'));
      g0.append(ray(x, 'var(--vec)', 3));
      for (const [p, nm] of [[A, 'A'], [B, 'B']]) { g0.append(s('circle', { cx: X(p[0]), cy: Y(p[1]), r: 5.5, fill: 'var(--ink)', stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 })); if (show.labels) g0.append(s('text', { x: X(p[0]) + (p[0] < (xlo + xhi) / 2 ? -14 : 9), y: Y(p[1]) + (p[1] > 0 ? -7 : 15), 'font-size': 11, fill: 'var(--ink)', 'font-weight': 650 }, nm)); }
      svg.append(g0);
      const cir = s('circle', { cx: X(x), cy: Y(0), r: 8, fill: 'var(--covec)', stroke: 'var(--bg, #fff)', 'stroke-width': 2 });
      if (show.points) { dragH(cir, px => { x = Math.max(xlo, Math.min(xhi, xlo + (px - ox) / sx)); redraw(); }); svg.append(cir); }
      if (show.timeCurve) {
        const CT = PB + 14, CH = 38, xs = [], N = 60; for (let i = 0; i <= N; i++) { const xx = xlo + (xhi - xlo) * i / N; xs.push([xx, fermatTime(c, xx)]); }
        const tmin = tb, tmax = Math.max(...xs.map(p => p[1])), ty = tt => CT + CH - (tt - tmin) / ((tmax - tmin) || 1) * CH;
        const cg = s('g');
        cg.append(s('line', { x1: PL, x2: PR, y1: CT + CH, y2: CT + CH, stroke: 'var(--muted)', 'stroke-width': 0.8 }),
          s('path', { d: xs.map(([xx, tt], i) => `${i ? 'L' : 'M'}${X(xx).toFixed(1)} ${ty(tt).toFixed(1)}`).join(' '), fill: 'none', stroke: 'var(--vec)', 'stroke-width': 1.8 }),
          s('circle', { cx: X(x), cy: ty(tm), r: 4, fill: 'var(--covec)' }));
        svg.append(cg);
      }
      const th1d = Math.atan2(Math.abs(x - A[0]), A[1]) * 180 / Math.PI, th2d = Math.atan2(Math.abs(B[0] - x), -B[1]) * 180 / Math.PI;
      const s1 = sinOf(x - A[0], A[1]) / st.v1, s2 = sinOf(B[0] - x, B[1]) / st.v2, bestShown = trueVisible();
      const val = { time: `${num(tm, 3)} ${U.time}`, best: bestShown ? `${num(tb, 3)} ${U.time} at x = ${num(xb, 2)}` : '–',
        theta1: `${num(th1d, 1)}°`, theta2: `${num(th2d, 1)}°`, snell1: num(s1, 3), snell2: num(s2, 3) };
      for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
      for (const [key, inp] of Object.entries(inps)) { inp.value = st[key]; vals[key].textContent = num(st[key], 2); }
      if (revBtn) revBtn.textContent = revealed ? Lb.hide : Lb.reveal;
    }
    const reads = cfg.readouts ?? ['time', 'best'];
    const names = { time: Lb.time, best: Lb.best, theta1: Lb.theta1, theta2: Lb.theta2, snell1: Lb.snell1, snell2: Lb.snell2 };
    const redraw = () => { svg.replaceChildren(); paint(); };
    const revBtn = hideTrue && show.reveal ? btn(Lb.reveal, () => { revealed = !revealed; redraw(); }) : null;
    const snapBtn = show.snap ? btn(cfg.labels?.snap ?? 'Go to the best point', () => { x = bestX(); redraw(); }) : null;
    model = { set: (k, v) => { st[k] = v; }, redraw };
    const sliderEls = sliderKeys.filter(k => R[k]).map(k => slider(k, ...R[k], Lb[k]));
    const cells = reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' })));
    const apply = p => { for (const key of ['v1', 'v2']) if (p[key] != null) st[key] = p[key]; if (p.x != null) x = Math.max(xlo, Math.min(xhi, p.x)); redraw(); };
    const btns = h('div', { class: 'wbtns' }, revBtn ?? '', snapBtn ?? '', show.reset ? btn(Lb.reset, () => { x = initX; revealed = !hideTrue; redraw(); }) : '', (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
    el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? h('div', { class: 'fs-reads' }, cells) : '', sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', btns);
    redraw();
  }
  mode === 'fermat' ? fermatMode() : pathMode();
}
