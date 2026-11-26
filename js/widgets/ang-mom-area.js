// ang-mom-area
//
// A particle of mass m moves in the plane (y up) about a fixed origin O. Angular momentum about O: L_z = m (x v_y - y v_x) = (r x p)_z, positive counter-clockwise
// (out of the page); L = |L_z|. The radius vector sweeps area at the rate dA/dt = |r x v| / 2 = L / (2m). Torque about O: tau = (r x F)_z = x F_y - y F_x, and dL_z/dt = tau.
// Modes (set in the config or by a preset, key `mode`):
//   free     no force: straight line at constant velocity. Start (-xs, b), velocity (v, 0): b = impact parameter (signed distance of the line from O).
//   spring   central force F = -k r (ellipse centered on O). Start (r0, 0), velocity (0, v).
//   gravity  central force F = -k r-hat / r^2 (softened at r < eps). Start (r0, 0), velocity (0, v). Circular orbit needs v = sqrt(k / (m r0)).
//   push     free line plus a constant force F (strength F, direction ang, degrees) acting only for push.t0 <= t < push.t0 + push.dur: off-center, so tau = r x F != 0 while it acts.
// Model: RK4 with a fixed step (dt = 0.005) sampled once; areas by the polygon sum (1/2) sum (x_i y_(i+1) - x_(i+1) y_i), so dA/dt = L/2m is a check, not an input.
// Exported angMomModel(params) returns { at(t), area(ta, tb), tmax } for script checks. Fully general: every word comes from the config.
//
//   mode: 'free', m: 1, b: 0.8, r0: 2, v: 1, k: 1, F: 1, ang: 90       start values (see above); xs: 2.5 start distance back on the free line; eps: 0.05 softening
//   push: { t0: 1, dur: 1 }, tmax: 8, duration: 8000                    pulse window, time window (s) and the animation time of one run (ms)
//   wedge: { n: 5, dt: 1, t0: 0 }                                       n equal-time wedges of length dt from t0 (the swept-area wedges)
//   strobeDt: 0.5                                                       time between strobe dots (default: wedge.dt)
//   sliders: ['b','r0','v','k','F','ang']   any of those, in order; default none
//   ranges: { b:[-2,2,0.1], r0:[0.8,3,0.1], v:[0.2,3,0.1], k:[0.2,6,0.1], F:[0,4,0.1], ang:[0,360,15] }
//   view: half-width of the square window in length units (default: automatic from start values and presets, at most 12)
//   units: { length: 'm', time: 's', mass: 'kg' }
//   show: { axes, origin, fullPath, trail, particle, r, p, force, torque, lever, parallelogram, lmark, wedges, wedgeAreas, wedgeList, strobe, spokes, lplot,
//           labels, readouts, replay, timeSlider }
//       defaults true: axes, origin, fullPath, trail, particle, r, labels, readouts, replay; false: all others.
//       r = arrow from O to the particle; p = momentum arrow at the particle; force = F arrow (only while F is nonzero); torque = curved arrow around O (sense and
//       thickness follow tau, absent when tau = 0); lever = dashed lever arm from O to the line of the force; parallelogram = shaded parallelogram spanned by the
//       arrows r and p (its area is proportional to L); lmark = symbol at the top left, dot (L out of the page) or cross (into the page); wedges = equal-time wedges
//       swept by r (complete ones only); wedgeAreas = area printed in each wedge; wedgeList = row of the areas under the figure; strobe = dots at equal times;
//       spokes = lines from O to the strobe dots; lplot = small plot of L_z against time with a time marker.
//   readouts: ['t','L','dAdt','L2m']     any of t, r, speed, p, Lz, L, A, dAdt, L2m, tau (A = area swept since t = 0; dAdt = numerical derivative of A)
//   presets: [{ label, mode, b, r0, v, k, F, ang }]   buttons; only the fields given change
//   labels: { t, r, speed, p, Lz, L, A, dAdt, L2m, tau (readouts, markdown allowed), b, r0, v, k, F, ang, wedge, time, play, reset, scene, ar, ap, aF, aL, atau, ad }
//       (ar, ap, aF, aL, atau, ad = plain letters drawn on the arrows, the L symbol and the lever arm)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };

// Pure model, exported for script checks. RK4 on a fixed grid, then interpolation.
export function angMomModel({ mode = 'free', m = 1, b = 0.8, r0 = 2, v = 1, k = 1, F = 1, ang = 90, xs = 2.5, eps = 0.05, push = { t0: 1, dur: 1 }, tmax = 8, dt = 0.005 } = {}) {
  const pa = ang * Math.PI / 180, central = mode === 'spring' || mode === 'gravity';
  const force = (t, x, y) => {
    if (mode === 'spring') return [-k * x, -k * y];
    if (mode === 'gravity') { const d = Math.pow(x * x + y * y + eps * eps, 1.5); return [-k * x / d, -k * y / d]; }
    if (mode === 'push' && t >= push.t0 && t < push.t0 + push.dur) return [F * Math.cos(pa), F * Math.sin(pa)];
    return [0, 0];
  };
  const N = Math.ceil(tmax / dt) + 2;
  const X = new Float64Array(N), Y = new Float64Array(N), VX = new Float64Array(N), VY = new Float64Array(N), A = new Float64Array(N);
  let x = central ? r0 : -xs, y = central ? 0 : b, vx = central ? 0 : v, vy = central ? v : 0;
  const f = (t, x, y, vx, vy) => { const a = force(t, x, y); return [vx, vy, a[0] / m, a[1] / m]; };
  for (let i = 0; i < N; i++) {
    X[i] = x; Y[i] = y; VX[i] = vx; VY[i] = vy;
    if (i === N - 1) break;
    const t = i * dt;
    const k1 = f(t, x, y, vx, vy), k2 = f(t + dt / 2, x + dt / 2 * k1[0], y + dt / 2 * k1[1], vx + dt / 2 * k1[2], vy + dt / 2 * k1[3]);
    const k3 = f(t + dt / 2, x + dt / 2 * k2[0], y + dt / 2 * k2[1], vx + dt / 2 * k2[2], vy + dt / 2 * k2[3]);
    const k4 = f(t + dt, x + dt * k3[0], y + dt * k3[1], vx + dt * k3[2], vy + dt * k3[3]);
    const nx = x + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), ny = y + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    vx += dt / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]); vy += dt / 6 * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]);
    A[i + 1] = A[i] + 0.5 * (x * ny - nx * y); x = nx; y = ny;
  }
  const lerp = (arr, i, u) => arr[i] * (1 - u) + arr[i + 1] * u;
  const state = t => {
    t = Math.max(0, Math.min(tmax, t));
    const i = Math.min(N - 2, Math.floor(t / dt)), u = (t - i * dt) / dt;
    const px = lerp(X, i, u), py = lerp(Y, i, u), pvx = lerp(VX, i, u), pvy = lerp(VY, i, u);
    const a = force(t, px, py), Lz = m * (px * pvy - py * pvx);
    return { t, x: px, y: py, vx: pvx, vy: pvy, px: m * pvx, py: m * pvy, Fx: a[0], Fy: a[1], Lz, L: Math.abs(Lz), r: Math.hypot(px, py), speed: Math.hypot(pvx, pvy),
      tau: px * a[1] - py * a[0], A: A[i] + 0.5 * (X[i] * py - px * Y[i]) };
  };
  const at = t => { const q = state(t), hh = 0.05, lo = Math.max(0, q.t - hh), hi = Math.min(tmax, q.t + hh); q.dAdt = (state(hi).A - state(lo).A) / (hi - lo); q.L2m = q.L / (2 * m); return q; };
  const area = (ta, tb) => state(tb).A - state(ta).A;
  return { at, area, tmax, m };
}

export function angMomArea(el, cfg) {
  const Lb = { t: 'Time', r: 'Distance $r$', speed: 'Speed', p: 'Momentum $p$', Lz: '$L_z = (\\mathbf r\\times\\mathbf p)_z$', L: '$L = |\\mathbf r\\times\\mathbf p|$', A: 'Area swept',
    dAdt: '$dA/dt$', L2m: '$L/2m$', tau: 'Torque $\\tau$', b: 'Impact parameter b', r0: 'Start distance', v: 'Speed', k: 'Force strength', F: 'Push strength', ang: 'Push direction',
    wedge: 'Wedge areas', time: 'time', play: 'Play', reset: 'Reset', scene: 'Particle moving about a fixed origin', ar: 'r', ap: 'p', aF: 'F', aL: 'L', atau: 'τ', ad: 'd', ...(cfg.labels ?? {}) };
  const show = { axes: true, origin: true, fullPath: true, trail: true, particle: true, r: true, p: false, force: false, torque: false, lever: false, parallelogram: false, lmark: false,
    wedges: false, wedgeAreas: false, wedgeList: false, strobe: false, spokes: false, lplot: false, labels: true, readouts: true, replay: true, timeSlider: false, ...(cfg.show ?? {}) };
  const U = { length: 'm', time: 's', mass: 'kg', ...(cfg.units ?? {}) };
  const R0 = { b: [-2, 2, 0.1], r0: [0.8, 3, 0.1], v: [0.2, 3, 0.1], k: [0.2, 6, 0.1], F: [0, 4, 0.1], ang: [0, 360, 15], ...(cfg.ranges ?? {}) };
  const reads = cfg.readouts ?? ['t', 'L', 'dAdt', 'L2m'];
  const sliderKeys = cfg.sliders ?? [];
  const presets = cfg.presets ?? [];
  const wd = { n: 5, dt: 1, t0: 0, ...(cfg.wedge ?? {}) };
  const sdt = cfg.strobeDt ?? wd.dt;
  const tmax = cfg.tmax ?? 8, duration = cfg.duration ?? 8000;
  const init = { mode: cfg.mode ?? 'free', b: cfg.b ?? 0.8, r0: cfg.r0 ?? 2, v: cfg.v ?? 1, k: cfg.k ?? 1, F: cfg.F ?? 1, ang: cfg.ang ?? 90 };
  const st = { ...init };
  const build = q => angMomModel({ ...q, m: cfg.m ?? 1, xs: cfg.xs ?? 2.5, eps: cfg.eps ?? 0.05, push: cfg.push ?? { t0: 1, dur: 1 }, tmax });

  // Fixed view and arrow scales from the start values and the presets.
  // (start values and presets only: a slider pushed to its end may leave the window, which clips it.)
  const cases = [init, ...presets.map(p => ({ ...init, ...p }))];
  let ext = 1e-6, pMax = 1e-6, FMax = 1e-6, LMax = 1e-6, tauMax = 1e-6;
  for (const c of cases) {
    const M = build(c);
    for (let i = 0; i <= 120; i++) { const q = M.at(tmax * i / 120); ext = Math.max(ext, Math.abs(q.x), Math.abs(q.y)); pMax = Math.max(pMax, Math.hypot(q.px, q.py)); FMax = Math.max(FMax, Math.hypot(q.Fx, q.Fy));
      LMax = Math.max(LMax, q.L); tauMax = Math.max(tauMax, Math.abs(q.tau)); }
  }
  const half = cfg.view ?? Math.min(12, Math.ceil(ext * 1.1 * 2) / 2);

  const W = 360, SH = 300, mg = 10, cx0 = W / 2, cy0 = SH / 2;
  const sc = (Math.min(W, SH) / 2 - mg) / half;
  const X = x => cx0 + x * sc, Y = y => cy0 - y * sc;
  const pk = 55 / pMax, Fk = 45 / FMax;
  const svg = s('svg', { viewBox: `0 0 ${W} ${SH}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.scene });
  const col = { r: 'var(--ink)', p: 'var(--vec)', F: 'var(--covec)', tau: 'var(--basis)', path: 'var(--muted)', wedge: 'var(--basis)', L: 'var(--covec)' };
  const muted = 'var(--muted)';
  let tNow = 0, raf = 0, t0 = 0;

  function arrow(g0, x1, y1, x2, y2, color, txt, w = 3) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); if (L < 3) return;
    const ux = dx / L, uy = dy / L;
    g0.append(s('line', { x1, y1, x2: x2 - ux * 6, y2: y2 - uy * 6, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round' }),
      s('polygon', { fill: color, points: `${x2},${y2} ${x2 - ux * 8 - uy * 4},${y2 - uy * 8 + ux * 4} ${x2 - ux * 8 + uy * 4},${y2 - uy * 8 - ux * 4}` }));
    if (show.labels && txt) g0.append(s('text', { x: x2 + ux * 9 - 3, y: y2 + uy * 9 + 4, 'font-size': 11, fill: color, 'font-weight': 650 }, txt));
  }
  const pathD = (M, ta, tb, n) => Array.from({ length: n + 1 }, (_, i) => { const q = M.at(ta + (tb - ta) * i / n); return `${i ? 'L' : 'M'}${X(q.x).toFixed(1)} ${Y(q.y).toFixed(1)}`; }).join(' ');
  const wedgeTimes = () => Array.from({ length: wd.n }, (_, i) => [wd.t0 + i * wd.dt, wd.t0 + (i + 1) * wd.dt]).filter(([, b]) => b <= tmax + 1e-9);

  function paint() {
    const M = build(st), f = M.at(tNow), px = X(f.x), py = Y(f.y);
    if (show.axes) svg.append(s('line', { x1: 4, x2: W - 4, y1: cy0, y2: cy0, stroke: muted, 'stroke-width': 1, opacity: 0.45 }), s('line', { x1: cx0, x2: cx0, y1: 4, y2: SH - 4, stroke: muted, 'stroke-width': 1, opacity: 0.45 }));
    const wts = wedgeTimes();
    if (show.wedges) wts.forEach(([a, b], i) => {
      if (b > tNow + 1e-9) return;
      const n = Math.max(6, Math.round(30 * (b - a)));
      svg.append(s('path', { d: `M${cx0} ${cy0} L${pathD(M, a, b, n).slice(1)} Z`, fill: col.wedge, opacity: i % 2 ? 0.34 : 0.18, stroke: col.wedge, 'stroke-width': 1, 'stroke-opacity': 0.6 }));
    });
    if (show.fullPath) svg.append(s('path', { d: pathD(M, 0, tmax, 160), fill: 'none', stroke: col.path, 'stroke-width': 1.2, 'stroke-dasharray': '4 4', opacity: 0.6 }));
    if (show.trail && tNow > 0) svg.append(s('path', { d: pathD(M, 0, tNow, Math.max(2, Math.round(160 * tNow / tmax))), fill: 'none', stroke: col.r, 'stroke-width': 2, opacity: 0.85 }));
    if (show.strobe) for (let t = 0; t <= tNow + 1e-9; t += sdt) {
      const q = M.at(t);
      if (show.spokes) svg.append(s('line', { x1: cx0, y1: cy0, x2: X(q.x), y2: Y(q.y), stroke: muted, 'stroke-width': 1, opacity: 0.7 }));
      svg.append(s('circle', { cx: X(q.x), cy: Y(q.y), r: 3.2, fill: col.r, opacity: 0.8 }));
    }
    if (show.wedges && show.wedgeAreas) wts.forEach(([a, b]) => {
      if (b > tNow + 1e-9) return;
      const mid = M.at((a + b) / 2), q = M.at(a), q2 = M.at(b);
      const gx = (0 + mid.x + q.x + q2.x) / 4 * 0.9, gy = (0 + mid.y + q.y + q2.y) / 4 * 0.9;
      svg.append(s('text', { x: X(gx), y: Y(gy) + 3.5, 'font-size': 10, 'text-anchor': 'middle', fill: col.wedge, 'font-weight': 700, 'paint-order': 'stroke', stroke: 'var(--bg, #fff)', 'stroke-width': 3 }, num(Math.abs(M.area(a, b)), 2)));
    });
    if (show.lever && Math.hypot(f.Fx, f.Fy) > 1e-6) {
      const Fm = Math.hypot(f.Fx, f.Fy), ux = f.Fx / Fm, uy = f.Fy / Fm, tt = -(f.x * ux + f.y * uy), fx = f.x + tt * ux, fy = f.y + tt * uy;
      const g1 = s('g', { opacity: 0.9 });
      g1.append(s('line', { x1: px, y1: py, x2: X(fx), y2: Y(fy), stroke: col.F, 'stroke-width': 1.4, 'stroke-dasharray': '3 3' }), s('line', { x1: cx0, y1: cy0, x2: X(fx), y2: Y(fy), stroke: col.tau, 'stroke-width': 1.6, 'stroke-dasharray': '3 3' }));
      if (show.labels && Lb.ad && Math.hypot(fx, fy) * sc > 10) g1.append(s('text', { x: X(fx / 2) + 5, y: Y(fy / 2) - 4, 'font-size': 10.5, fill: col.tau, 'font-weight': 650 }, Lb.ad));
      svg.append(g1);
    }
    if (show.parallelogram) {
      const pxe = px + f.px * pk, pye = py - f.py * pk;
      svg.append(s('polygon', { points: `${cx0},${cy0} ${px},${py} ${pxe},${pye} ${cx0 + (pxe - px)},${cy0 + (pye - py)}`, fill: col.L, opacity: 0.18, stroke: col.L, 'stroke-width': 1, 'stroke-opacity': 0.6 }));
    }
    if (show.r) { const g2 = s('g'); arrow(g2, cx0, cy0, px, py, col.r, Lb.ar, 2.4); svg.append(g2); }
    if (show.origin) svg.append(s('circle', { cx: cx0, cy: cy0, r: 3.5, fill: col.r }));
    if (show.p) { const g3 = s('g'); arrow(g3, px, py, px + f.px * pk, py - f.py * pk, col.p, Lb.ap); svg.append(g3); }
    if (show.force && Math.hypot(f.Fx, f.Fy) > 1e-6) { const g4 = s('g'); arrow(g4, px, py, px + f.Fx * Fk, py - f.Fy * Fk, col.F, Lb.aF); svg.append(g4); }
    if (show.particle) svg.append(s('circle', { cx: px, cy: py, r: 6, fill: col.p, stroke: 'var(--bg, #fff)', 'stroke-width': 1.4 }));
    if (show.torque && Math.abs(f.tau) > 1e-3 * tauMax) {
      const rr = 20, ccw = f.tau > 0, a0 = ccw ? 190 : 350, a1 = ccw ? 340 : 200, w = 2 + 4 * Math.min(1, Math.abs(f.tau) / tauMax);
      const pt = a => [cx0 + rr * Math.cos(a * Math.PI / 180), cy0 - rr * Math.sin(a * Math.PI / 180)];
      const [sx, sy] = pt(a0), [ex, ey] = pt(a1), aE = a1 * Math.PI / 180;
      const ux = ccw ? -Math.sin(aE) : Math.sin(aE), uy = ccw ? -Math.cos(aE) : Math.cos(aE);   // tangent at the end, screen coordinates (y down)
      const g5 = s('g');
      g5.append(s('path', { d: `M${sx.toFixed(1)} ${sy.toFixed(1)} A${rr} ${rr} 0 0 ${ccw ? 0 : 1} ${ex.toFixed(1)} ${ey.toFixed(1)}`, fill: 'none', stroke: col.tau, 'stroke-width': w, 'stroke-linecap': 'round' }),
        s('polygon', { fill: col.tau, points: `${ex + ux * 8},${ey + uy * 8} ${ex - uy * 6},${ey + ux * 6} ${ex + uy * 6},${ey - ux * 6}` }));
      if (show.labels && Lb.atau) g5.append(s('text', { x: cx0 - rr - 12, y: cy0 - rr + 2, 'font-size': 11, fill: col.tau, 'font-weight': 650 }, Lb.atau));
      svg.append(g5);
    }
    if (show.lmark) {
      const g6 = s('g'), mx = 22, my = 22;
      g6.append(s('circle', { cx: mx, cy: my, r: 11, fill: 'none', stroke: col.L, 'stroke-width': 2 }));
      if (f.Lz > 1e-6 * LMax) g6.append(s('circle', { cx: mx, cy: my, r: 3, fill: col.L }));
      else if (f.Lz < -1e-6 * LMax) g6.append(s('line', { x1: mx - 6, y1: my - 6, x2: mx + 6, y2: my + 6, stroke: col.L, 'stroke-width': 2 }), s('line', { x1: mx - 6, y1: my + 6, x2: mx + 6, y2: my - 6, stroke: col.L, 'stroke-width': 2 }));
      if (show.labels && Lb.aL) g6.append(s('text', { x: mx + 17, y: my + 4, 'font-size': 12, fill: col.L, 'font-weight': 650 }, Lb.aL));
      svg.append(g6);
    }
    const val = { t: `${num(f.t, 2)} ${U.time}`, r: `${num(f.r, 2)} ${U.length}`, speed: `${num(f.speed, 2)} ${U.length}/${U.time}`, p: `${num(Math.hypot(f.px, f.py), 2)}`,
      Lz: num(f.Lz, 3), L: num(f.L, 3), A: num(Math.abs(f.A), 3), dAdt: num(Math.abs(f.dAdt), 3), L2m: num(f.L2m, 3), tau: num(f.tau, 3) };
    for (const k of reads) if (rd[k]) rd[k].textContent = val[k];
    if (wlist) wlist.textContent = wts.filter(([, b]) => b <= tNow + 1e-9).map(([a, b], i) => `${i + 1}: ${num(Math.abs(M.area(a, b)), 3)}`).join('   ') || '–';
    for (const [k, inp] of Object.entries(inps)) { inp.value = st[k]; vals[k].textContent = fmt(k); }
    if (timeInp) timeInp.value = Math.round(tNow / tmax * 1000);
    if (lplot) paintPlot(M);
  }
  const fmt = k => k === 'b' || k === 'r0' ? `${num(st[k], 1)} ${U.length}` : k === 'v' ? `${num(st.v, 1)} ${U.length}/${U.time}` : k === 'ang' ? `${num(st.ang, 0)}°` : num(st[k], 1);

  const rd = {}, inps = {}, vals = {};
  let timeInp = null, lplot = null, wlist = null;
  function paintPlot(M) {
    lplot.replaceChildren();
    const w = 360, hh = 80, l = 6, r = 6, tp = 8, bt = 8, Lm = LMax * 1.1;
    const PX = t => l + (w - l - r) * t / tmax, PY = z => hh - bt - (hh - tp - bt) * (z + Lm) / (2 * Lm);
    lplot.append(s('line', { x1: l, x2: w - r, y1: PY(0), y2: PY(0), stroke: muted, 'stroke-width': 1, opacity: 0.5 }));
    const n = 120, d = Array.from({ length: n + 1 }, (_, i) => { const t = tmax * i / n; return `${i ? 'L' : 'M'}${PX(t).toFixed(1)} ${PY(M.at(t).Lz).toFixed(1)}`; }).join(' ');
    lplot.append(s('path', { d, fill: 'none', stroke: col.L, 'stroke-width': 2, opacity: 0.8 }),
      s('line', { x1: PX(tNow), x2: PX(tNow), y1: tp, y2: hh - bt, stroke: col.r, 'stroke-width': 1.2, opacity: 0.6 }),
      s('circle', { cx: PX(tNow), cy: PY(M.at(tNow).Lz), r: 4, fill: col.L }),
      s('text', { x: l + 2, y: 12, 'font-size': 10.5, fill: col.L, 'font-weight': 650 }, 'L'));
  }
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const sliderEls = sliderKeys.map(k => {
    const [lo, hi, step] = R0[k];
    const inp = inps[k] = h('input', { type: 'range', min: lo, max: hi, step, value: st[k], 'aria-label': Lb[k] });
    inp.addEventListener('input', () => { st[k] = +inp.value; paintAll(); });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb[k])), inp, vals[k] = h('span', { class: 'fs-num' }));
  });
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const apply = p => { for (const k of Object.keys(init)) if (p[k] != null) st[k] = p[k]; play(); };
  const btns = h('div', { class: 'wbtns' }, show.replay ? btn(Lb.play, () => play()) : '', btn(Lb.reset, () => { Object.assign(st, init); play(); }), presets.map(pr => btn(pr.label, () => apply(pr))));
  if (show.timeSlider) {
    timeInp = h('input', { type: 'range', min: 0, max: 1000, step: 1, value: 0, 'aria-label': Lb.time });
    timeInp.addEventListener('input', () => { cancelAnimationFrame(raf); tNow = +timeInp.value / 1000 * tmax; paintAll(); });
  }
  if (show.lplot) lplot = s('svg', { viewBox: '0 0 360 80', class: 'fs-svg', role: 'img', 'aria-label': 'L over time' });
  if (show.wedgeList) wlist = h('div', { class: 'fs-num', role: 'status' });
  el.append(h('div', { class: 'fs-fig' }, svg), lplot ? h('div', { class: 'fs-fig' }, lplot) : '', show.readouts && reads.length ? readEl : '',
    wlist ? h('div', { class: 'fs-reads' }, h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb.wedge)), wlist)) : '',
    timeInp ? h('div', { class: 'fs-sliders' }, h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, Lb.time), timeInp, h('span'))) : '',
    sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', btns);

  function paintAll() { svg.replaceChildren(); paint(); }
  function play() {
    cancelAnimationFrame(raf); tNow = 0; t0 = performance.now(); paintAll();
    const tick = now => {
      if (!el.isConnected) return;
      tNow = Math.max(0, Math.min(tmax, (now - t0) / duration * tmax)); paintAll();
      if (tNow < tmax) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  play();
}
