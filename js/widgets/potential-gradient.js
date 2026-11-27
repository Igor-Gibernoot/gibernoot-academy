// potential-gradient
//
// A force field F in the plane drawn with its potential V (F = -grad V): contour lines and an optional colour
// map, a draggable point with the arrows F and grad V, a path test (two roads A -> B and a closed loop whose
// circulation, the integral of F . dr around it, is computed live) and a played trajectory with the bars T, V and
// T + V. Fields without a potential (swirl, shear) hide the contours and V and show that the tests fail.
// Fully general: all wording from the config. Sign convention: F = -grad V, W = integral F . dr = V(A) - V(B), T = m v^2 / 2.
//
//   fields: [ { label, type, ... } ]            one or more; two or more give switch buttons (`field: {...}` = a single one)
//       type 'spring':  F = -k (r - c),            V = k |r - c|^2 / 2            { k: 1, center: [0,0] }
//       type 'uniform': F = (fx, fy),             V = -(fx (x - cx) + fy (y - cy))   { fx: 0, fy: -1, center: [0,0] }
//       type 'gravity': uniform with F = (0, -g), V = g (y - cy)                 { g: 1, center: [0,0] }
//       type 'central': F = -k (r - c) / rho^3,   V = -k / rho,  rho^2 = |r - c|^2 + eps^2   { k: 1, eps: 0.15, center: [0,0] }
//       type 'swirl':   F = k (-(y - cy), x - cx), curl 2k, NO potential         { k: 1, center: [0,0] }
//       type 'shear':   F = (k y, 0), curl -k, NO potential                      { k: 1 }
//       optional per field: levels: [v1, v2, ...] explicit contour values (default `nLevels` evenly spaced)
//   A: [-1.2, -0.5], B: [1.2, 0.5]               end points of the roads (world units)
//   view: [-1.6, 1.6, -1.1, 1.1]                 [xmin, xmax, ymin, ymax]; the picture keeps this aspect
//   roads: [ {kind, label, color, ...} ]         two roads (kinds 'straight', 'bent' {via}, 'arc' {bulge}, 'control' {control}, as in work-path);
//                                                default straight + control. A 'control' road has a draggable handle.
//   loop: 'roads' | {kind:'circle', center, radius} | false     closed loop for the circulation: road 1 out and road 2 back (default),
//                                                or a counter-clockwise circle
//   point: [0.5, 0.4]                            the draggable probe point (also the start of the trajectory unless `start` is set)
//   start: [x, y]                                fixed trajectory start (the point then only probes)
//   v0: [vx, vy]                                 initial velocity (default [0, 0]); sliders 'speed' and 'angle' (degrees) override it
//   mass: 1, tmax: 6, dt: 0.004                  trajectory (RK4); it stops when it leaves the view
//   strength: 1                                  multiplies the field (slider 'strength')
//   sliders: []                                  'strength', 'speed', 'angle'      ranges: { strength: [-2, 2, 0.1], speed: [0, 3, 0.05], angle: [0, 360, 5] }
//   units: { V: 'J', work: 'J', length: 'm', force: 'N' }
//   duration: 4000, autoplay: false              length of one trajectory playback (ms); autoplay starts it on load
//   nLevels: 10, nField: [9, 6], decimals: 2, barMax: auto
//   show: { contours, colorMap, field, point, forceArrow, gradArrow, roads, markers, endLabels, loop, bars, energy, trajectory,
//           handle, scrub, play, readouts, fieldButtons, labels }
//       defaults: colorMap false and everything else true. contours/colorMap = V (hidden by themselves for fields without V);
//       field = grey grid arrows; point = the probe dot; forceArrow / gradArrow = F and grad V at the point; roads = the two roads;
//       markers / endLabels = A, B and their letters; loop = the closed loop; bars = the path-test bars (V(A) - V(B), each road, loop);
//       energy = the T, V, T + V bars; trajectory = the path and moving dot; handle = draggable control point of 'control' roads;
//       scrub = playback slider; play = launch button; readouts = the readout cells; fieldButtons = switch; labels = names and captions.
//   readouts: ['dV', 'work', 'loop']             'dV' = V(B) - V(A); 'work' = W per road; 'loop' = circulation; 'probe' = V and |F| at the
//                                                point; 'energy' = T, V, T + V at the current time of the trajectory
//   labels: { A, B, play, replay, scrub, strength, speed, angle, dV, minusDV, work, roadN, loop, probe, energy, T, V, E, noV, same, differ,
//             F, gradV, picture }
//   Exported pure model for script checks: potential, fieldForce, workAlong, closedWork, trajectory.

import { h } from '../dom.js';
import { mdInline } from '../render.js';
import { roadPoints } from './work-path.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
let clipCount = 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- pure model -------------------------------------------------------------------------
export function hasPotential(f) { return !['swirl', 'shear'].includes(f.type); }

export function fieldForce(f, x, y, k = 1) {
  const c = f.center ?? [0, 0], q = (f.k ?? 1) * k, dx = x - c[0], dy = y - c[1];
  switch (f.type) {
    case 'spring': return [-q * dx, -q * dy];
    case 'gravity': return [0, -(f.g ?? 1) * k];
    case 'central': { const r2 = dx * dx + dy * dy + (f.eps ?? 0.15) ** 2, r3 = r2 * Math.sqrt(r2); return [-q * dx / r3, -q * dy / r3]; }
    case 'swirl': return [-q * dy, q * dx];
    case 'shear': return [q * y, 0];
    default: return [(f.fx ?? 0) * k, (f.fy ?? 0) * k];
  }
}

// V with F = -grad V (null when the field has no potential).
export function potential(f, x, y, k = 1) {
  const c = f.center ?? [0, 0], q = (f.k ?? 1) * k, dx = x - c[0], dy = y - c[1];
  switch (f.type) {
    case 'spring': return 0.5 * q * (dx * dx + dy * dy);
    case 'gravity': return (f.g ?? 1) * k * dy;
    case 'central': return -q / Math.sqrt(dx * dx + dy * dy + (f.eps ?? 0.15) ** 2);
    case 'swirl': case 'shear': return null;
    default: return -((f.fx ?? 0) * k * dx + (f.fy ?? 0) * k * dy);
  }
}

// Work along a polyline (midpoint rule): cum[i] = work up to point i.
export function workAlong(f, pts, k = 1) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], F = fieldForce(f, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, k);
    cum.push(cum[i - 1] + F[0] * (b[0] - a[0]) + F[1] * (b[1] - a[1]));
  }
  return { cum, total: cum[cum.length - 1] };
}

// Circulation around the closed loop: road 1 out, road 2 back (or any closed polyline).
export function closedWork(f, loopPts, k = 1) { return workAlong(f, loopPts, k).total; }

// RK4 trajectory of mass m in the field; samples {t, x, y, vx, vy, T, V}. Stops when it leaves the view [x0, x1, y0, y1].
export function trajectory(f, start, v0, { m = 1, k = 1, tmax = 6, dt = 0.004, view = [-1e9, 1e9, -1e9, 1e9] } = {}) {
  const acc = (x, y) => { const F = fieldForce(f, x, y, k); return [F[0] / m, F[1] / m]; };
  let [x, y] = start, [vx, vy] = v0, t = 0;
  const out = [], push = () => { const V = potential(f, x, y, k); out.push({ t, x, y, vx, vy, T: 0.5 * m * (vx * vx + vy * vy), V }); };
  push();
  for (let i = 0; i < Math.round(tmax / dt); i++) {
    const a1 = acc(x, y), k1 = [vx, vy, a1[0], a1[1]];
    const a2 = acc(x + dt / 2 * k1[0], y + dt / 2 * k1[1]), k2 = [vx + dt / 2 * k1[2], vy + dt / 2 * k1[3], a2[0], a2[1]];
    const a3 = acc(x + dt / 2 * k2[0], y + dt / 2 * k2[1]), k3 = [vx + dt / 2 * k2[2], vy + dt / 2 * k2[3], a3[0], a3[1]];
    const a4 = acc(x + dt * k3[0], y + dt * k3[1]), k4 = [vx + dt * k3[2], vy + dt * k3[3], a4[0], a4[1]];
    x += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    vx += dt / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]); vy += dt / 6 * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]);
    t += dt;
    if (x < view[0] || x > view[1] || y < view[2] || y > view[3]) break;
    push();
  }
  return out;
}

// Marching squares: segments of V = level on the grid vals[j][i] (node (i, j) at x = gx[i], y = gy[j]).
const CASES = [[], [[3, 0]], [[0, 1]], [[3, 1]], [[1, 2]], [[3, 0], [1, 2]], [[0, 2]], [[3, 2]], [[3, 2]], [[0, 2]], [[0, 1], [3, 2]], [[1, 2]], [[3, 1]], [[0, 1]], [[3, 0]], []];
function contourPath(vals, gx, gy, level, X, Y) {
  let d = '';
  const lerp = (a, b, va, vb) => a + (b - a) * ((level - va) / (vb - va));
  for (let j = 0; j < gy.length - 1; j++) for (let i = 0; i < gx.length - 1; i++) {
    const v0 = vals[j][i], v1 = vals[j][i + 1], v2 = vals[j + 1][i + 1], v3 = vals[j + 1][i];
    const idx = (v0 > level ? 1 : 0) | (v1 > level ? 2 : 0) | (v2 > level ? 4 : 0) | (v3 > level ? 8 : 0);
    const xa = gx[i], xb = gx[i + 1], ya = gy[j], yb = gy[j + 1];
    const pt = e => e === 0 ? [lerp(xa, xb, v0, v1), ya] : e === 1 ? [xb, lerp(ya, yb, v1, v2)] : e === 2 ? [lerp(xa, xb, v3, v2), yb] : [xa, lerp(ya, yb, v0, v3)];
    for (const [e1, e2] of CASES[idx]) { const p = pt(e1), q = pt(e2); d += `M${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}L${X(q[0]).toFixed(1)} ${Y(q[1]).toFixed(1)}`; }
  }
  return d;
}

// ---- widget -----------------------------------------------------------------------------
export function potentialGradient(el, cfg) {
  const Lb = { A: 'A', B: 'B', play: 'Launch', replay: 'Replay', scrub: 'Time', strength: 'Field strength', speed: 'Launch speed', angle: 'Launch angle',
    dV: 'V(B) − V(A)', minusDV: 'V(A) − V(B)', work: 'Work', roadN: 'Road', loop: 'Circulation around the loop', probe: 'At the point', energy: 'Energy',
    T: 'T', V: 'V', E: 'T + V', noV: 'no potential', same: 'matches the work on every road', differ: 'the work depends on the road',
    F: 'F', gradV: '∇V', picture: 'Force field, potential contours, roads from A to B and a trajectory', ...(cfg.labels ?? {}) };
  const show = { contours: true, colorMap: false, field: true, point: true, forceArrow: true, gradArrow: true, roads: true, markers: true, endLabels: true,
    loop: true, bars: true, energy: true, trajectory: true, handle: true, scrub: true, play: true, readouts: true, fieldButtons: true, labels: true, ...(cfg.show ?? {}) };
  const U = { V: 'J', work: 'J', length: 'm', force: 'N', ...(cfg.units ?? {}) };
  const reads = cfg.readouts ?? ['dV', 'work', 'loop'], dec = cfg.decimals ?? 2;
  const A = cfg.A ?? [-1.2, -0.5], B = cfg.B ?? [1.2, 0.5];
  const [x0, x1, y0, y1] = cfg.view ?? [-1.6, 1.6, -1.1, 1.1];
  const fields = cfg.fields ?? (cfg.field ? [cfg.field] : [{ type: 'spring', k: 1 }]);
  const palette = ['var(--basis)', 'var(--vec)'];
  const roads = (cfg.roads ?? [{ kind: 'straight' }, { kind: 'control' }]).slice(0, 2)
    .map((r, i) => ({ ...r, label: r.label ?? `${Lb.roadN} ${i + 1}`, color: r.color ?? palette[i], control: r.control ? [...r.control] : undefined }));
  const R = { strength: [-2, 2, 0.1], speed: [0, 3, 0.05], angle: [0, 360, 5], ...(cfg.ranges ?? {}) };
  const sliderKeys = cfg.sliders ?? [];
  const v0c = cfg.v0 ?? [0, 0], sp0 = Math.hypot(...v0c), an0 = Math.round(Math.atan2(v0c[1], v0c[0]) * 180 / Math.PI + 360) % 360;
  const st = { fi: 0, k: cfg.strength ?? 1, speed: sp0, angle: an0, P: [...(cfg.point ?? [0.5, 0.4])], u: 0, playing: false };
  const nF = cfg.nField ?? [9, 6], nLev = cfg.nLevels ?? 10, duration = cfg.duration ?? 4000, mass = cfg.mass ?? 1;
  const f0 = () => fields[st.fi];
  const pot = (x, y) => potential(f0(), x, y, st.k);

  // geometry (px): picture, then path-test bars, then energy bars
  const W = 360, PX = 12, PW = W - 24, sc = PW / (x1 - x0), PH = Math.round((y1 - y0) * sc), PY = 8, rowH = 22;
  const loopOn = cfg.loop !== false, nPath = 1 + roads.length + (loopOn ? 1 : 0);
  const BY = PY + PH + 14, EY = BY + (show.bars ? nPath * rowH + 10 : 0), H = (show.energy ? EY + 3 * rowH : EY) + 4;
  const X = x => PX + (x - x0) * sc, Y = y => PY + (y1 - y) * sc;
  const clipId = `pg-clip-${++clipCount}`;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.picture });

  const loopPts = () => {
    if (cfg.loop && typeof cfg.loop === 'object') {
      const c = cfg.loop.center ?? [0, 0], r = cfg.loop.radius ?? 0.6, pts = [];
      for (let i = 0; i <= 400; i++) { const a = i / 400 * 2 * Math.PI; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); }
      return pts;
    }
    return [...paths[0], ...paths[1].slice().reverse()];
  };
  let paths = [], wk = [], circ = 0, traj = [], bg = null, vgrid = null;
  const build = () => {
    paths = roads.map(r => roadPoints(r, A, B, 400));
    wk = paths.map(p => workAlong(f0(), p, st.k).total);
    circ = loopOn ? closedWork(f0(), loopPts(), st.k) : 0;
    const ang = st.angle * Math.PI / 180;
    const vel = sliderKeys.includes('speed') || sliderKeys.includes('angle') ? [st.speed * Math.cos(ang), st.speed * Math.sin(ang)] : v0c;
    traj = show.trajectory || show.energy || reads.includes('energy')
      ? trajectory(f0(), cfg.start ?? st.P, vel, { m: mass, k: st.k, tmax: cfg.tmax ?? 6, dt: cfg.dt ?? 0.004, view: [x0, x1, y0, y1] }) : [];
  };
  const gridMaxOf = f => {                       // largest field arrow of this field on the grid at strength 1 (fixed under the strength slider)
    let m = 1e-9;
    for (let i = 0; i < nF[0]; i++) for (let j = 0; j < nF[1]; j++)
      m = Math.max(m, Math.hypot(...fieldForce(f, x0 + (i + 0.5) / nF[0] * (x1 - x0), y0 + (j + 0.5) / nF[1] * (y1 - y0), 1)));
    return m;
  };
  let gridMax = gridMaxOf(f0());

  const num = v => { const t = (+v).toFixed(dec); return (Math.abs(+t) < Math.pow(10, -dec) ? (0).toFixed(dec) : t).replace('-', '−'); };
  const arrowPath = (g, x, y, dx, dy, col, w, head, dash) => {
    const L = Math.hypot(dx, dy); if (L < 1.5) return;
    const ux = dx / L, uy = dy / L, hd = Math.min(head, L * 0.6);
    g.append(s('line', { x1: x, y1: y, x2: x + dx - ux * hd * 0.6, y2: y + dy - uy * hd * 0.6, stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', ...(dash ? { 'stroke-dasharray': dash } : {}) }),
      s('polygon', { fill: col, points: `${x + dx},${y + dy} ${x + dx - ux * hd - uy * hd * 0.5},${y + dy - uy * hd + ux * hd * 0.5} ${x + dx - ux * hd + uy * hd * 0.5},${y + dy - uy * hd - ux * hd * 0.5}` }));
  };
  const pathD = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join(' ');

  // static layer: colour map, contours, field arrows (rebuilt when the field or strength changes)
  function buildBg() {
    const g = s('g'), f = f0();
    if (hasPotential(f) && (show.contours || show.colorMap)) {
      const nx = 56, ny = Math.max(8, Math.round(nx * (y1 - y0) / (x1 - x0)));
      const gx = Array.from({ length: nx + 1 }, (_, i) => x0 + (x1 - x0) * i / nx), gy = Array.from({ length: ny + 1 }, (_, j) => y0 + (y1 - y0) * j / ny);
      const vals = gy.map(y => gx.map(x => pot(x, y)));
      const flat = vals.flat().sort((a, b) => a - b), lo = flat[Math.floor(0.02 * (flat.length - 1))], hi = flat[Math.floor(0.98 * (flat.length - 1))];
      if (show.colorMap && hi > lo) {
        const cmap = s('g'); g.append(cmap);
        const cw = (x1 - x0) / nx * sc, ch = (y1 - y0) / ny * sc;
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const v = (vals[j][i] + vals[j][i + 1] + vals[j + 1][i] + vals[j + 1][i + 1]) / 4, t = clamp((v - lo) / (hi - lo), 0, 1);
          cmap.append(s('rect', { x: (X(gx[i])).toFixed(1), y: (Y(gy[j + 1])).toFixed(1), width: (cw + 0.8).toFixed(1), height: (ch + 0.8).toFixed(1), fill: `hsl(${(215 - 190 * t).toFixed(0)} 70% 55%)`, 'shape-rendering': 'crispEdges' }));
        }
        cmap.setAttribute('opacity', 0.32);
      }
      if (show.contours && hi > lo) {
        const levels = f.levels ?? Array.from({ length: nLev }, (_, i) => lo + (hi - lo) * (i + 0.5) / nLev);
        let d = ''; for (const lv of levels) d += contourPath(vals, gx, gy, lv, X, Y);
        g.append(s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.1, opacity: 0.55 }));
      }
    }
    if (show.field) {
      const cell = PW / nF[0], maxLen = Math.min(cell, PH / nF[1]) * 0.8;
      for (let i = 0; i < nF[0]; i++) for (let j = 0; j < nF[1]; j++) {
        const x = x0 + (i + 0.5) / nF[0] * (x1 - x0), y = y0 + (j + 0.5) / nF[1] * (y1 - y0), F = fieldForce(f, x, y, st.k), m = Math.hypot(...F) / gridMax;
        if (m < 1e-6) continue;
        const L = maxLen * Math.min(1, m), ux = F[0] / Math.hypot(...F), uy = F[1] / Math.hypot(...F);
        arrowPath(g, X(x) - ux * L / 2, Y(y) + uy * L / 2, ux * L, -uy * L, 'var(--muted)', 1.4, 4.5);
      }
    }
    bg = g;
  }

  const sampleAt = u => { if (!traj.length) return null; const i = Math.round(clamp(u, 0, 1) * (traj.length - 1)); return traj[i]; };
  const trajMax = () => { let m = 1e-9; for (const q of traj) { m = Math.max(m, Math.abs(q.T), Math.abs(q.V ?? 0), Math.abs((q.V ?? 0) + q.T)); } return m; };
  let eMax = 1;

  function paint() {
    svg.replaceChildren();
    svg.append(s('rect', { x: PX, y: PY, width: PW, height: PH, fill: 'none', stroke: 'var(--line, #ccc)', 'stroke-width': 1 }));
    const clip = s('clipPath', { id: clipId }, s('rect', { x: PX, y: PY, width: PW, height: PH }));
    const pic = s('g', { 'clip-path': 'url(#pg-clip)' });
    svg.append(clip, pic);
    pic.append(bg);
    if (show.loop && loopOn) pic.append(s('path', { d: pathD(loopPts()), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.6, 'stroke-dasharray': '4 3', opacity: 0.7 }));
    if (show.roads) roads.forEach((r, i) => pic.append(s('path', { d: pathD(paths[i]), fill: 'none', stroke: r.color, 'stroke-width': 2.6, 'stroke-linejoin': 'round' })));
    const cur = sampleAt(st.u);
    if (show.trajectory && traj.length) {
      const k = Math.round(clamp(st.u, 0, 1) * (traj.length - 1)), sub = traj.slice(0, k + 1).map(q => [q.x, q.y]);
      if (sub.length > 1) pic.append(s('path', { d: pathD(sub), fill: 'none', stroke: 'var(--covec)', 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
      if (cur) pic.append(s('circle', { cx: X(cur.x), cy: Y(cur.y), r: 5, fill: 'var(--covec)', stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
    }
    if (show.markers) for (const [P, name] of [[A, Lb.A], [B, Lb.B]]) {
      pic.append(s('circle', { cx: X(P[0]), cy: Y(P[1]), r: 5, fill: 'var(--ink)', stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
      if (show.endLabels) pic.append(s('text', { x: X(P[0]) + (P === A ? -9 : 9), y: Y(P[1]) + (P === A ? 14 : -7), 'font-size': 12, 'font-weight': 700, 'text-anchor': P === A ? 'end' : 'start', fill: 'var(--ink)' }, name));
    }
    const P = st.P, F = fieldForce(f0(), P[0], P[1], st.k), mF = Math.hypot(...F);
    if (show.point) {
      if (mF > 1e-9) {
        const L = 40 * Math.min(1.2, mF / gridMax), ux = F[0] / mF, uy = F[1] / mF;
        if (show.forceArrow) arrowPath(pic, X(P[0]), Y(P[1]), ux * L, -uy * L, 'var(--vec)', 2.6, 7);
        if (show.gradArrow && hasPotential(f0())) arrowPath(pic, X(P[0]), Y(P[1]), -ux * L, uy * L, 'var(--covec)', 2.6, 7, '5 3');
      }
      pic.append(s('circle', { cx: X(P[0]), cy: Y(P[1]), r: 5.5, fill: 'var(--bg, #fff)', stroke: 'var(--ink)', 'stroke-width': 2 }));
      svg.append(s('circle', { cx: X(P[0]), cy: Y(P[1]), r: 20, fill: 'transparent', 'data-i': 'p', style: 'cursor:grab;touch-action:none' }));
    }
    if (show.handle) roads.forEach((r, i) => {
      if (r.kind !== 'control') return;
      const Q = r.control ?? (r.control = [(A[0] + B[0]) / 2 - (B[1] - A[1]) * 0.4, (A[1] + B[1]) / 2 + (B[0] - A[0]) * 0.4]);
      svg.append(s('circle', { cx: X(Q[0]), cy: Y(Q[1]), r: 7, fill: 'var(--bg, #fff)', stroke: r.color, 'stroke-width': 2.5, style: 'pointer-events:none' }),
        s('circle', { cx: X(Q[0]), cy: Y(Q[1]), r: 20, fill: 'transparent', 'data-i': i, style: 'cursor:grab;touch-action:none' }));
    });

    const hasV = hasPotential(f0());
    const barBlock = (y0b, rows, top) => {
      const bx0 = PX + 78, bx1 = W - PX - 56, mid = (bx0 + bx1) / 2, half = (bx1 - bx0) / 2, g = s('g');
      g.append(s('line', { x1: mid, y1: y0b - 4, x2: mid, y2: y0b + rows.length * rowH - 2, stroke: 'var(--ink)', 'stroke-width': 1 }));
      rows.forEach((r, i) => {
        const y = y0b + i * rowH;
        if (show.labels) g.append(s('text', { x: PX, y: y + 12, 'font-size': 10.5, 'font-weight': 650, fill: r.color }, r.label));
        if (r.value == null) { g.append(s('text', { x: mid + 4, y: y + 12.5, 'font-size': 10.5, fill: 'var(--muted)' }, Lb.noV)); return; }
        const len = clamp(r.value / top, -1, 1) * half;
        g.append(s('rect', { x: Math.min(mid, mid + len), y: y + 1, width: Math.abs(len), height: 15, fill: r.color }),
          s('text', { x: W - PX, y: y + 12.5, 'font-size': 11, 'text-anchor': 'end', fill: 'var(--ink)', style: 'font-variant-numeric:tabular-nums' }, `${num(r.value)} ${r.unit}`));
      });
      svg.append(g);
    };
    if (show.bars) {
      const rows = [{ label: Lb.minusDV, value: hasV ? pot(A[0], A[1]) - pot(B[0], B[1]) : null, color: 'var(--ink)', unit: U.work },
        ...roads.map((r, i) => ({ label: r.label, value: wk[i], color: r.color, unit: U.work }))];
      if (loopOn) rows.push({ label: Lb.loop.length > 16 ? 'Loop work' : Lb.loop, value: circ, color: 'var(--ink)', unit: U.work });
      const top = cfg.barMax ?? Math.max(1e-9, ...rows.map(r => Math.abs(r.value ?? 0))) * 1.15;
      barBlock(BY, rows, top);
    }
    if (show.energy) {
      const c = cur ?? { T: 0, V: null }, hv = c.V != null;
      barBlock(EY, [{ label: Lb.T, value: c.T, color: 'var(--vec)', unit: U.V }, { label: Lb.V, value: hv ? c.V : null, color: 'var(--covec)', unit: U.V },
        { label: Lb.E, value: hv ? c.T + c.V : null, color: 'var(--ink)', unit: U.V }], cfg.barMax ?? eMax * 1.1);
    }

    // readouts and controls
    if (rd.dV) rd.dV.textContent = hasV ? `${num(pot(B[0], B[1]) - pot(A[0], A[1]))} ${U.V}` : Lb.noV;
    roads.forEach((r, i) => { if (rd[`w${i}`]) rd[`w${i}`].textContent = `${num(wk[i])} ${U.work}` + (show.labels && hasV ? ` (${Math.abs(wk[i] - (pot(A[0], A[1]) - pot(B[0], B[1]))) < Math.pow(10, -dec) / 2 ? '=' : '≠'} ${Lb.minusDV})` : ''); });
    if (rd.loop) rd.loop.textContent = `${num(circ)} ${U.work}` + (show.labels ? ` (${Math.abs(circ) < Math.pow(10, -dec) / 2 ? Lb.same : Lb.differ})` : '');
    if (rd.probe) rd.probe.textContent = `${hasV ? `V = ${num(pot(P[0], P[1]))} ${U.V}, ` : ''}|F| = ${num(mF)} ${U.force}`;
    if (rd.energy) rd.energy.textContent = cur ? `T = ${num(cur.T)}${cur.V != null ? `, V = ${num(cur.V)}, T + V = ${num(cur.T + cur.V)}` : ''} ${U.V}` : '';
    if (scrub) scrub.value = st.u;
    if (playBtn) playBtn.textContent = st.u >= 1 && !st.playing ? Lb.replay : Lb.play;
    fieldBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === st.fi)));
    for (const [key, inp] of Object.entries(inps)) { inp.value = st[key === 'strength' ? 'k' : key]; vals[key].textContent = num(st[key === 'strength' ? 'k' : key]); }
  }
  function refresh(full) { if (full) gridMax = gridMaxOf(f0()); build(); eMax = trajMax(); if (full) buildBg(); paint(); }

  // controls
  const rd = {}, inps = {}, vals = {};
  const cell = (label, id) => h('div', { class: 'fs-cell' }, show.labels ? h('div', { class: 'fs-lab' }, mdInline(label)) : '', rd[id] = h('div', { class: 'fs-num', role: 'status' }));
  const cells = [];
  for (const key of reads) {
    if (key === 'dV') cells.push(cell(Lb.dV, 'dV'));
    if (key === 'work') roads.forEach((r, i) => cells.push(cell(`${Lb.work}, ${r.label}`, `w${i}`)));
    if (key === 'loop' && loopOn) cells.push(cell(Lb.loop, 'loop'));
    if (key === 'probe') cells.push(cell(Lb.probe, 'probe'));
    if (key === 'energy') cells.push(cell(Lb.energy, 'energy'));
  }
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const fieldBtns = fields.length > 1 ? fields.map((fd, i) => btn(fd.label ?? `${i + 1}`, () => { st.fi = i; stop(); st.u = 0; refresh(true); })) : [];
  const playBtn = show.play ? btn(Lb.play, () => play()) : null;
  const scrub = show.scrub ? h('input', { type: 'range', min: 0, max: 1, step: 0.002, value: 0, 'aria-label': Lb.scrub }) : null;
  if (scrub) scrub.addEventListener('input', () => { stop(); st.u = +scrub.value; paint(); });
  const sliderEls = sliderKeys.map(key => {
    const [lo, hi, step] = R[key];
    const inp = inps[key] = h('input', { type: 'range', min: lo, max: hi, step, value: st[key === 'strength' ? 'k' : key], 'aria-label': Lb[key] ?? key });
    inp.addEventListener('input', () => { st[key === 'strength' ? 'k' : key] = +inp.value; stop(); st.u = 0; refresh(key === 'strength'); });
    return h('label', { class: 'fs-slide stack' }, h('span', { class: 'fs-lab' }, mdInline(Lb[key] ?? key)), inp, vals[key] = h('span', { class: 'fs-num' }));
  });
  const rows = [];
  if (scrub) rows.push(h('label', { class: 'fs-slide stack' }, h('span', { class: 'fs-lab' }, mdInline(Lb.scrub)), scrub, h('span', { class: 'fs-num' })));
  const btns = h('div', { class: 'wbtns' }, playBtn ?? '', show.fieldButtons ? fieldBtns : '');
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && cells.length ? h('div', { class: 'fs-reads' }, cells) : '',
    sliderEls.length || rows.length ? h('div', { class: 'fs-sliders' }, rows, sliderEls) : '', btns);

  // playback of the trajectory
  let raf = 0, t0 = 0;
  function stop() { st.playing = false; cancelAnimationFrame(raf); }
  function play() {
    stop(); st.playing = true; st.u = 0; t0 = performance.now(); paint();
    const tick = now => {
      if (!el.isConnected) return;
      st.u = Math.min(1, (now - t0) / duration);
      if (st.u >= 1) st.playing = false;
      paint();
      if (st.playing) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  // dragging the point and the control points (mouse and touch)
  let drag = null;
  const toWorld = ev => { const m = svg.getScreenCTM(); if (!m) return null; const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(m.inverse()); return [x0 + (q.x - PX) / sc, y1 - (q.y - PY) / sc]; };
  svg.addEventListener('pointerdown', ev => {
    const i = ev.target?.getAttribute?.('data-i'); if (i == null) return;
    drag = i; stop(); svg.setPointerCapture?.(ev.pointerId); ev.preventDefault();
  });
  svg.addEventListener('pointermove', ev => {
    if (drag == null) return;
    const w = toWorld(ev); if (!w) return;
    const q = [clamp(w[0], x0, x1), clamp(w[1], y0, y1)];
    if (drag === 'p') { st.P = q; st.u = 0; } else roads[+drag].control = q;
    refresh(false);
  });
  const up = () => { drag = null; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('touchmove', ev => { if (drag != null) ev.preventDefault(); }, { passive: false });

  refresh(true);
  if (cfg.autoplay) play(); else { st.u = 0; paint(); }
}
