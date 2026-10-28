// curve-fit-lab
//
// Underdetermination of theory by data. Draggable data points on a plane; least-squares polynomial
// fits of chosen degrees; residuals; a held-out x where the fits disagree; the simplest fit within tolerance.
// Fit: x is mapped to t in [-1,1], the basis is Chebyshev T_0..T_d, solved by QR with modified
// Gram-Schmidt (applied twice); dependent columns are dropped (coefficient 0), so duplicate x or
// degree >= number of points is safe (then the fit interpolates, effective degree = rank - 1).
//
//   points: [[x, y], ...]        data
//   xRange [0,10], yRange [-3,3] plane
//   degree: 2                    main fit (slider); degreeRange: [1, 8]
//   compare: [1, 3, 7]           extra degrees always drawn with the main one
//   tolerance: 0.3               "fits" means RMS residual <= tolerance; simplest = lowest degree in degreeRange that fits
//   holdout: 9                   x of the held-out marker (null = none)
//   noise: 0.3, seed: 1          sd of the "jitter" button and of added points
//   truth: [c0, c1, ...]         optional polynomial in x (ascending): new points are truth(x) + noise, else random in yRange
//   edit: true                   points draggable, tap empty plane adds, double-tap a point removes; false = fixed
//   lockX: false                 dragging moves y only
//   show: { points, curves, residuals, holdout, simplest, slider, tolerance, readout, legend, axes, buttons }
//        defaults true except residuals, simplest, tolerance (false)
//        points = dots; curves = every fitted curve (main + compare); residuals = vertical gaps from points to main fit;
//        holdout = dashed line, predicted values on each curve and their spread; simplest = thick highlight on the
//        simplest fitting curve plus its readout line; slider = degree slider; tolerance = tolerance slider;
//        readout = per-degree RMS lines; legend = colour keys; axes = x and y axis lines; buttons = add/remove/jitter/reset
//   labels: { degree, tolerance, rms, holdout, spread, simplest, none, add, remove, jitter, reset, nofit, curve, x, y }
//   presets: [{ label, points, degree, compare, tolerance, holdout }]

import { h } from '../dom.js';
import { mdInline } from '../render.js';
import { s } from './plane.js';

const W = 360, H = 250, M = { l: 30, r: 10, t: 10, b: 24 };
const COLS = ['var(--accent)', 'var(--covec)', 'var(--basis)', 'var(--good)', 'var(--bad)', 'var(--vec)'];

// Chebyshev design row for t in [-1,1]
const cheb = (t, d) => { const r = [1, t]; for (let k = 2; k <= d; k++) r[k] = 2 * t * r[k - 1] - r[k - 2]; return r.slice(0, d + 1); };

// Least squares via QR (MGS twice). Returns { coef (len d+1, Chebyshev in t), rank }.
export function lsq(ts, ys, d) {
  const n = ts.length, m = d + 1;
  const A = Array.from({ length: m }, () => new Array(n));
  ts.forEach((t, i) => cheb(t, d).forEach((v, k) => { A[k][i] = v; }));
  const Q = [], R = Array.from({ length: m }, () => new Array(m).fill(0)), keep = [];
  for (let k = 0; k < m; k++) {
    const v = A[k].slice(), n0 = Math.hypot(...v);
    for (let pass = 0; pass < 2; pass++) Q.forEach((q, j) => {
      let dot = 0; for (let i = 0; i < n; i++) dot += q[i] * v[i];
      R[keep[j]][k] += dot; for (let i = 0; i < n; i++) v[i] -= dot * q[i];
    });
    const nv = Math.hypot(...v);
    if (n0 === 0 || nv < 1e-9 * Math.max(1, n0)) continue;
    R[k][k] = nv; Q.push(v.map(x => x / nv)); keep.push(k);
  }
  const b = Q.map(q => q.reduce((a, x, i) => a + x * ys[i], 0));
  const coef = new Array(m).fill(0);
  for (let j = keep.length - 1; j >= 0; j--) {
    const k = keep[j]; let sum = b[j];
    for (let jj = j + 1; jj < keep.length; jj++) sum -= R[k][keep[jj]] * coef[keep[jj]];
    coef[k] = sum / R[k][k];
  }
  return { coef, rank: keep.length };
}

function rng(seed) { let a = (seed * 2654435761) >>> 0 || 1; return () => { a ^= a << 13; a >>>= 0; a ^= a >>> 17; a ^= a << 5; a >>>= 0; return a / 4294967296; }; }

export function curveFitLab(el, cfg) {
  const L = { degree: 'Degree', tolerance: 'Tolerance', rms: 'RMS gap', holdout: 'At the held-out x', spread: 'Spread of predictions',
    simplest: 'Simplest curve that fits', none: 'none', add: 'Add point', remove: 'Remove point', jitter: 'Jitter', reset: 'Reset',
    nofit: 'no fit within tolerance', curve: 'degree', x: 'x', y: 'y', ...(cfg.labels ?? {}) };
  const S = { points: true, curves: true, residuals: false, holdout: true, simplest: false, slider: true, tolerance: false,
    readout: true, legend: true, axes: true, buttons: true, ...(cfg.show ?? {}) };
  const [x0, x1] = cfg.xRange ?? [0, 10], [y0, y1] = cfg.yRange ?? [-3, 3];
  const [dmin, dmax] = cfg.degreeRange ?? [1, 8];
  const edit = cfg.edit ?? true, lockX = !!cfg.lockX, noise = cfg.noise ?? 0.3;
  const clampD = d => Math.max(dmin, Math.min(dmax, Math.round(d)));
  const init = () => ({ pts: (cfg.points ?? []).map(p => [...p]), degree: clampD(cfg.degree ?? 2), compare: [...(cfg.compare ?? [])].map(clampD),
    tol: cfg.tolerance ?? 0.3, hold: cfg.holdout ?? null, seed: cfg.seed ?? 1 });
  let st = init(), rand = rng(st.seed);
  const base = JSON.stringify(cfg.points ?? []);

  const px = x => M.l + (x - x0) / (x1 - x0) * (W - M.l - M.r);
  const py = y => H - M.b - (y - y0) / (y1 - y0) * (H - M.t - M.b);
  const ix = p => x0 + (p - M.l) / (W - M.l - M.r) * (x1 - x0);
  const iy = p => y0 + (H - M.b - p) / (H - M.t - M.b) * (y1 - y0);

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Data points and polynomial fits', class: 'cf-svg' });
  const clipId = 'cf-clip-' + Math.random().toString(36).slice(2, 8);
  const clip = s('clipPath', { id: clipId }); clip.append(s('rect', { x: M.l, y: M.t, width: W - M.l - M.r, height: H - M.t - M.b }));
  const gAxes = s('g'), gHold = s('g'), gRes = s('g', { 'clip-path': `url(#${clipId})` }), gCur = s('g', { 'clip-path': `url(#${clipId})` }), gPts = s('g');
  svg.append(clip, s('rect', { x: M.l, y: M.t, width: W - M.l - M.r, height: H - M.t - M.b, class: 'cf-bg' }), gAxes, gHold, gRes, gCur, gPts);
  if (S.axes) {
    gAxes.append(s('line', { x1: M.l, y1: H - M.b, x2: W - M.r, y2: H - M.b, class: 'cf-axis' }), s('line', { x1: M.l, y1: M.t, x2: M.l, y2: H - M.b, class: 'cf-axis' }));
    const xl = s('text', { x: W - M.r, y: H - 6, class: 'cf-tick', 'text-anchor': 'end' }); xl.textContent = L.x;
    const yl = s('text', { x: M.l + 4, y: M.t + 9, class: 'cf-tick' }); yl.textContent = L.y;
    gAxes.append(xl, yl);
  }

  const slider = S.slider ? h('input', { type: 'range', min: dmin, max: dmax, step: 1, 'aria-label': L.degree }) : null;
  const sval = h('span', { class: 'fg-val' });
  const tolIn = S.tolerance ? h('input', { type: 'range', min: 0.01, max: 1.5, step: 0.01, 'aria-label': L.tolerance }) : null;
  const tval = h('span', { class: 'fg-val' });
  const row = (name, inp, v) => h('label', { class: 'fg-row' }, h('span', { class: 'fg-name' }, mdInline(name)), inp, v);
  const legend = S.legend ? h('div', { class: 'fg-counts cf-legend' }) : null;
  const read = S.readout ? h('div', { class: 'readout cf-read' }) : null;
  const btn = (t, f) => h('button', { class: 'btn ghost', type: 'button', onclick: f }, t);
  const presets = cfg.presets ?? [];
  const btns = S.buttons || presets.length ? h('div', { class: 'wbtns' },
    S.buttons ? [
      btn(L.add, () => { addPoint(); }), btn(L.remove, () => { st.pts.pop(); draw(); }),
      btn(L.jitter, () => { st.pts.forEach(p => { p[1] = clampY(p[1] + gauss() * noise); }); draw(); }),
      btn(L.reset, () => { st = init(); st.pts = JSON.parse(base); rand = rng(st.seed); draw(); })] : '',
    presets.map(pr => btn(pr.label, () => {
      if (pr.points) st.pts = pr.points.map(p => [...p]);
      if (pr.degree != null) st.degree = clampD(pr.degree);
      if (pr.compare) st.compare = pr.compare.map(clampD);
      if (pr.tolerance != null) st.tol = pr.tolerance;
      if ('holdout' in pr) st.hold = pr.holdout;
      draw(); }))) : null;
  el.append(...[svg, legend, S.slider ? row(L.degree, slider, sval) : null, S.tolerance ? row(L.tolerance, tolIn, tval) : null, read, btns].filter(Boolean));

  const clampY = y => Math.max(y0 + 0.05 * (y1 - y0), Math.min(y1 - 0.05 * (y1 - y0), y));
  const clampX = x => Math.max(x0, Math.min(x1, x));
  const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
  function addPoint(x, y) {
    if (x == null) {
      const xs = [x0, ...st.pts.map(p => p[0]).sort((a, b) => a - b), x1];
      let gi = 0; for (let i = 1; i < xs.length - 1; i++) if (xs[i + 1] - xs[i] > xs[gi + 1] - xs[gi]) gi = i;
      x = (xs[gi] + xs[gi + 1]) / 2;
    }
    if (y == null) y = cfg.truth ? cfg.truth.reduce((a, c, k) => a + c * x ** k, 0) + gauss() * noise : y0 + rand() * (y1 - y0);
    st.pts.push([x, clampY(y)]); draw();
  }

  // one fit: returns { f(x), rms, d, eff }
  function fit(d) {
    const n = st.pts.length;
    if (!n) return { f: () => 0, rms: 0, d, eff: -1 };
    const ts = st.pts.map(p => 2 * (p[0] - x0) / (x1 - x0) - 1), ys = st.pts.map(p => p[1]);
    const { coef, rank } = lsq(ts, ys, d);
    const f = x => { const r = cheb(2 * (x - x0) / (x1 - x0) - 1, d); return r.reduce((a, v, k) => a + v * coef[k], 0); };
    const rms = Math.sqrt(st.pts.reduce((a, p) => a + (f(p[0]) - p[1]) ** 2, 0) / n);
    return { f, rms, d, eff: rank - 1 };
  }

  function draw() {
    const degs = [...new Set([st.degree, ...st.compare])].sort((a, b) => a - b);
    const cache = {}; const get = d => (cache[d] ??= fit(d));
    let simp = null;
    for (let d = dmin; d <= dmax; d++) if (st.pts.length && get(d).rms <= st.tol + 1e-9) { simp = d; break; }
    if (slider) slider.value = st.degree;
    sval.textContent = st.degree;
    if (tolIn) { tolIn.value = st.tol; tval.textContent = st.tol.toFixed(2); }
    const colorOf = d => (d === st.degree ? COLS[0] : COLS[(1 + degs.filter(e => e !== st.degree).indexOf(d)) % COLS.length]);
    gCur.replaceChildren(); gRes.replaceChildren(); gHold.replaceChildren(); gPts.replaceChildren();
    const path = d => {
      const f = get(d).f; let dd = '';
      for (let i = 0; i <= 160; i++) { const x = x0 + (x1 - x0) * i / 160; dd += (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(f(x)).toFixed(1); }
      return dd;
    };
    if (S.simplest && simp != null) gCur.append(s('path', { d: path(simp), class: 'cf-curve simplest' }));
    if (S.curves) for (const d of degs) gCur.append(s('path', { d: path(d), class: 'cf-curve' + (d === st.degree ? ' main' : ''), style: `stroke:${colorOf(d)}` }));
    if (S.residuals) { const f = get(st.degree).f; st.pts.forEach(p => gRes.append(s('line', { x1: px(p[0]), x2: px(p[0]), y1: py(p[1]), y2: py(f(p[0])), class: 'cf-res' }))); }
    const preds = [];
    if (S.holdout && st.hold != null) {
      gHold.append(s('line', { x1: px(st.hold), x2: px(st.hold), y1: M.t, y2: H - M.b, class: 'cf-hold' }));
      const shown = S.curves ? degs : [];
      shown.forEach(d => { const y = get(d).f(st.hold); preds.push([d, y]);
        gCur.append(s('circle', { cx: px(st.hold), cy: Math.max(M.t, Math.min(H - M.b, py(y))), r: 4, class: 'cf-pred', style: `fill:${colorOf(d)}` })); });
      if (S.simplest && simp != null && !degs.includes(simp)) preds.push([simp, get(simp).f(st.hold)]);
    }
    if (S.points) st.pts.forEach((p, i) => {
      const c = s('circle', { cx: px(p[0]), cy: py(p[1]), r: 6, class: 'cf-pt' + (edit ? ' drag' : '') });
      if (edit) {
        c.addEventListener('pointerdown', e => {
          e.preventDefault(); e.stopPropagation(); c.setPointerCapture(e.pointerId);
          const move = ev => { const r = svg.getBoundingClientRect(); const k = W / r.width;
            const nx = clampX(ix((ev.clientX - r.left) * k)), ny = clampY(iy((ev.clientY - r.top) * k));
            st.pts[i] = [lockX ? st.pts[i][0] : nx, ny]; draw(); };
          const up = () => { c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up); };
          c.addEventListener('pointermove', move); c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
        });
        c.addEventListener('dblclick', e => { e.stopPropagation(); st.pts.splice(i, 1); draw(); });
      }
      gPts.append(c);
    });
    if (legend) legend.replaceChildren(...degs.map(d => h('span', { class: 'fg-key' }, h('i', { class: 'fg-sw', style: `background:${colorOf(d)}` }), `${L.curve} ${d}`)),
      ...(S.simplest ? [h('span', { class: 'fg-key' }, h('i', { class: 'fg-sw cf-simp' }), mdInline(L.simplest))] : []));
    if (read) {
      const lines = [];
      if (S.curves) degs.forEach(d => { const e = get(d); lines.push(h('div', {}, h('b', {}, `${L.curve} ${d}`), `: ${L.rms} ${e.rms.toFixed(2)}` + (e.eff >= 0 && e.eff < d ? ` (${L.curve} ${e.eff})` : ''))); });
      if (S.holdout && st.hold != null && preds.length) {
        const ys = preds.map(p => p[1]);
        lines.push(h('div', {}, h('b', {}, mdInline(L.holdout) + ': '), preds.map(p => `${L.curve} ${p[0]} → ${p[1].toFixed(1)}`).join(' · ')));
        lines.push(h('div', {}, h('b', {}, mdInline(L.spread) + ': '), (Math.max(...ys) - Math.min(...ys)).toFixed(1)));
      }
      if (S.simplest) lines.push(h('div', {}, h('b', {}, mdInline(L.simplest) + ': '), simp == null ? L.nofit : `${L.curve} ${simp}`));
      read.replaceChildren(...lines);
    }
    el.dataset.degree = st.degree; el.dataset.n = st.pts.length; el.dataset.simplest = simp ?? '';
    el.dataset.rms = get(st.degree).rms.toFixed(3);
    if (st.hold != null) { const v = degs.map(d => get(d).f(st.hold)); el.dataset.holdSpread = v.length ? (Math.max(...v) - Math.min(...v)).toFixed(2) : ''; }
    svg.setAttribute('aria-label', `${st.pts.length} data points; fits of degree ${degs.join(', ')}`);
  }
  if (edit) svg.addEventListener('click', e => {
    if (e.target.classList.contains('cf-pt')) return;
    const r = svg.getBoundingClientRect(), k = W / r.width, x = ix((e.clientX - r.left) * k), y = iy((e.clientY - r.top) * k);
    if (x < x0 || x > x1 || y < y0 || y > y1) return;
    st.pts.push([x, clampY(y)]); draw();
  });
  if (slider) slider.addEventListener('input', () => { st.degree = +slider.value; draw(); });
  if (tolIn) tolIn.addEventListener('input', () => { st.tol = +tolIn.value; draw(); });
  draw();
}
