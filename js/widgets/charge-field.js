// charge-field
//
// A point charge q of mass m in a uniform magnetic field B along +z (toward the viewer in the top view) and an optional uniform electric
// field E. Taylor 2.5 (Eq. 2.62-2.81):  m dv/dt = q (E + v x B),  B = (0, 0, B)
//   m dvx/dt = q Ex + q B vy,   m dvy/dt = q Ey - q B vx,   m dvz/dt = q Ez
// Cyclotron frequency omega = q B / m (Eq. 2.67, signed: q < 0 turns the other way); with E = 0 the transverse velocity turns clockwise at omega
// (seen from +z, q > 0), the speed is constant (the magnetic force does no work), the orbit has radius r = v_perp / |omega| = m v_perp / (|q| B)
// (Eq. 2.81) and period T = 2 pi / |omega|; vz is constant and the path is a helix. With E the transverse motion is that circle on top of the
// E x B drift u = (Ey, -Ex) / B (a cycloid-like path); an Ez along B only accelerates z uniformly.
// The path is integrated by RK4 (dt = 0.005) and checked against the closed forms (see docs/widgets/charge-field.md); `chargeFieldModel` is exported.
// Fully general: no course text is hard-coded; every word comes from the config.
//
//   q: 1, m: 1, B: 1                start values (charge, mass, field; q may be negative; B >= 0)
//   v0: 1, angle: 0, vz: 0          initial velocity: v0 = speed in the xy plane (transverse), angle = its direction (degrees from +x), vz = along B
//   E: 0, Eangle: 0, Ez: 0          electric field: E = magnitude in the xy plane, Eangle its direction (degrees), Ez = component along B
//   x0: 0, y0: 0, z0: 0             start position
//   tmax: 6                         time window (s); duration: 5000 (ms of one Play run); start: 'end' (full path shown) or 'play' (animate at once)
//   sliders: ['v0']                 any of q, m, B, v0, angle, vz, E, Eangle, Ez, t (order kept; t = time marker); default none
//   ranges: { q:[-3,3,0.5], m:[0.5,5,0.5], B:[0,3,0.1], v0:[0,3,0.1], angle:[0,360,5], vz:[-2,2,0.1], E:[0,3,0.1], Eangle:[0,360,5], Ez:[-2,2,0.1] }
//   views: ['top']                  panels drawn, stacked: 'top' = x-y plane seen from +z, 'side' = x-z plane (z up), '3d' = oblique view with z up
//                                   (and the floor shadow); [] = none
//   window: { x:[lo,hi], y:[lo,hi], z:[lo,hi] }   optional fixed world window (default: the box of the start path and every preset path, so curves never rescale)
//   scale: { v: .., f: .. }         optional reference speed and force that fill about 48 px of arrow (default: largest over the start and presets)
//   units: { length:'m', time:'s', mass:'kg', charge:'C', field:'T', efield:'V/m', speed:'m/s', energy:'J', force:'N', angle:'°' }  (empty strings allowed)
//   show: { particle, start, trace, ahead, velocity, force, eForce, net, drift, circle, center, radius, field, vacuum, axes, grid, shadow, labels,
//           readouts, replay }
//       defaults true except net, radius, vacuum, grid. particle = the moving dot; start = hollow dot at the start; trace = path up to the marker;
//       ahead = faint path still to come; velocity = arrow v; force = arrow q v x B; eForce = arrow q E (only when E or Ez is not 0); net = total force
//       arrow; drift = the E x B drift arrow u at the circle centre (only when E != 0 and B > 0); circle = dashed circle of radius r about the centre
//       (only when omega != 0); center = cross at the circle centre (the guiding centre); radius = line from centre to particle; field = dots (B toward
//       the viewer) or crosses (away) on the top view; vacuum = dashed straight line the particle would follow with no field at all (only v0, vz);
//       axes = axis lines and names; grid = grid lines on the top view; shadow = floor shadow of the path in the 3d view; labels = letters and panel
//       titles; readouts = the cells below; replay = the Play button. Arrows and the circle live on the top view only.
//   readouts: ['r','omega','period','speed','ke']   any of r, omega, period, speed, vperp, vz, ke, force, drift, time, x, y, z
//       r = orbit radius, omega = qB/m, period = 2 pi/|omega|, speed = |v| at the marker, vperp = transverse speed, vz, ke = m v^2/2, force = |q v x B|,
//       drift = |E|/B, time, x y z = position at the marker. Radius and period read as infinity when omega = 0.
//   presets: [{ label, q, m, B, v0, angle, vz, E, Eangle, Ez }]   buttons; only the fields given change
//   labels: { r, omega, period, speed, vperp, vz, ke, force, drift, time, x, y, z, q, m, B, v0, angle, E, Eangle, Ez, t, play, reset, topTitle, sideTitle,
//             threeTitle, fV, fF, fE, fNet, fU, bField, circle, center, start }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };
const DEG = Math.PI / 180;
let uid = 0;

// Pure model, exported for script checks. Position (x, y, z) and velocity from RK4 (at) and from the closed forms (exact).
export function chargeFieldModel({ q = 1, m = 1, B = 1, v0 = 1, angle = 0, vz = 0, E = 0, Eangle = 0, Ez = 0, x0 = 0, y0 = 0, z0 = 0, tmax = 6, dt = 0.005 } = {}) {
  const vx0 = v0 * Math.cos(angle * DEG), vy0 = v0 * Math.sin(angle * DEG), Ex = E * Math.cos(Eangle * DEG), Ey = E * Math.sin(Eangle * DEG);
  const omega = q * B / m, qm = q / m, hasW = Math.abs(omega) > 1e-12;
  const drift = B !== 0 && q !== 0 ? [Ey / B, -Ex / B] : null;     // u = E x B / B^2 (transverse); no meaning without B or q
  const ud = hasW ? drift : [0, 0];
  const w0 = hasW ? [vx0 - ud[0], vy0 - ud[1]] : null;
  const R = hasW ? Math.hypot(w0[0], w0[1]) / Math.abs(omega) : Infinity, T = hasW ? 2 * Math.PI / Math.abs(omega) : Infinity;
  const acc = (vx, vy) => [qm * (Ex + B * vy), qm * (Ey - B * vx), qm * Ez];
  const n = Math.ceil(tmax / dt), P = new Float64Array((n + 1) * 6);
  let S = [x0, y0, z0, vx0, vy0, vz]; P.set(S, 0);
  const f = u => { const a = acc(u[3], u[4]); return [u[3], u[4], u[5], a[0], a[1], a[2]]; };
  const add = (u, k, c) => u.map((z, i) => z + c * k[i]);
  for (let i = 0; i < n; i++) {
    const k1 = f(S), k2 = f(add(S, k1, dt / 2)), k3 = f(add(S, k2, dt / 2)), k4 = f(add(S, k3, dt));
    S = S.map((z, j) => z + dt / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); P.set(S, (i + 1) * 6);
  }
  const state = (t, g) => {
    const vxy = Math.hypot(g[3], g[4]), sp = Math.hypot(g[3], g[4], g[5]);
    return { t, x: g[0], y: g[1], z: g[2], vx: g[3], vy: g[4], vz: g[5], vperp: vxy, speed: sp, ke: 0.5 * m * sp * sp,
      F: [q * g[4] * B, -q * g[3] * B], Fe: [q * Ex, q * Ey, q * Ez] };
  };
  const at = t => {
    const fi = Math.max(0, Math.min(n, t / dt)), i = Math.min(n - 1, Math.floor(fi)), u = fi - i, g = [];
    for (let j = 0; j < 6; j++) g.push(P[i * 6 + j] + (P[(i + 1) * 6 + j] - P[i * 6 + j]) * u);
    return state(t, g);
  };
  // Closed forms: eta = vx + i vy = u + w0 e^(-i omega t), xi = x + i y = xi0 + u t + i w0 (e^(-i omega t) - 1) / omega (Eq. 2.71, 2.80 with a drift)
  const exact = t => {
    let g;
    if (hasW) {
      const c = Math.cos(omega * t), sn = Math.sin(omega * t), wr = w0[0] * c + w0[1] * sn, wi = w0[1] * c - w0[0] * sn;
      g = [x0 + ud[0] * t - (wi - w0[1]) / omega, y0 + ud[1] * t + (wr - w0[0]) / omega, 0, ud[0] + wr, ud[1] + wi, 0];
    } else g = [x0 + vx0 * t + 0.5 * qm * Ex * t * t * (q !== 0 && B === 0 ? 1 : 0), y0 + vy0 * t + 0.5 * qm * Ey * t * t * (q !== 0 && B === 0 ? 1 : 0), 0,
      vx0 + qm * Ex * t * (q !== 0 && B === 0 ? 1 : 0), vy0 + qm * Ey * t * (q !== 0 && B === 0 ? 1 : 0), 0];
    g[2] = z0 + vz * t + 0.5 * qm * Ez * t * t; g[5] = vz + qm * Ez * t;
    return state(t, g);
  };
  // Guiding centre (centre of the circle at time t), null when omega = 0.
  const center = t => hasW ? [x0 + w0[1] / omega + ud[0] * t, y0 - w0[0] / omega + ud[1] * t] : null;
  return { omega, R, T, drift, at, exact, center, Ex, Ey, Ez, vx0, vy0, vz };
}

export function chargeField(el, cfg) {
  const Lb = { r: 'Radius r', omega: 'Cyclotron frequency ω', period: 'Period T', speed: 'Speed v', vperp: 'Transverse speed', vz: 'v_z', ke: 'Kinetic energy', force: '|q v × B|', drift: 'Drift speed E/B',
    time: 'Time', x: 'x', y: 'y', z: 'z', q: 'Charge q', m: 'Mass m', B: 'Field B', v0: 'Transverse speed v₀', angle: 'Direction of v₀', E: 'Electric field E', Eangle: 'Direction of E',
    Ez: 'E along B', t: 'Time', play: 'Play', reset: 'Reset', topTitle: 'Top view (x, y)', sideTitle: 'Side view (x, z)', threeTitle: 'Oblique view',
    fV: 'v', fF: 'qv×B', fE: 'qE', fNet: 'net', fU: 'u', bField: 'B', circle: 'r', center: '', start: '', ...(cfg.labels ?? {}) };
  const show = { particle: true, start: true, trace: true, ahead: true, velocity: true, force: true, eForce: true, net: false, drift: true, circle: true, center: true, radius: false, field: true,
    vacuum: false, axes: true, grid: false, shadow: true, labels: true, readouts: true, replay: true, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['r', 'omega', 'period', 'speed', 'ke'];
  const U = { length: 'm', time: 's', mass: 'kg', charge: 'C', field: 'T', efield: 'V/m', speed: 'm/s', energy: 'J', force: 'N', angle: '°', ...(cfg.units ?? {}) };
  const Rg = { q: [-3, 3, 0.5], m: [0.5, 5, 0.5], B: [0, 3, 0.1], v0: [0, 3, 0.1], angle: [0, 360, 5], vz: [-2, 2, 0.1], E: [0, 3, 0.1], Eangle: [0, 360, 5], Ez: [-2, 2, 0.1], ...(cfg.ranges ?? {}) };
  const tmax = cfg.tmax ?? 6, duration = cfg.duration ?? 5000;
  const init = { q: cfg.q ?? 1, m: cfg.m ?? 1, B: cfg.B ?? 1, v0: cfg.v0 ?? 1, angle: cfg.angle ?? 0, vz: cfg.vz ?? 0, E: cfg.E ?? 0, Eangle: cfg.Eangle ?? 0, Ez: cfg.Ez ?? 0 };
  const origin = { x0: cfg.x0 ?? 0, y0: cfg.y0 ?? 0, z0: cfg.z0 ?? 0 };
  const st = { ...init };
  const KEYS = Object.keys(init);
  const sliderKeys = cfg.sliders ?? [];
  const views = cfg.views ?? ['top'];
  const model = p => chargeFieldModel({ ...p, ...origin, tmax });
  const sFmt = { q: v => num(v, 1), m: v => num(v, 1), B: v => num(v, 2), v0: v => num(v, 2), angle: v => num(v, 0), vz: v => num(v, 2), E: v => num(v, 2), Eangle: v => num(v, 0), Ez: v => num(v, 2), t: v => num(v, 2) };
  const sUnit = { q: U.charge, m: U.mass, B: U.field, v0: U.speed, angle: U.angle, vz: U.speed, E: U.efield, Eangle: U.angle, Ez: U.efield, t: U.time };
  const withU = (v, u) => u ? `${v} ${u}` : v;

  // Fixed world window from the start state and the presets (never from the live state), so curves never rescale.
  const cases = [init, ...(cfg.presets ?? []).map(p => ({ ...init, ...p }))];
  const proj = {
    top: (x, y) => [x, y],
    side: (x, y, z) => [x, z],
    '3d': (x, y, z) => [x + 0.45 * y, z + 0.3 * y],
  };
  const win = cfg.window ?? {};
  const bbox = view => {
    let u0 = Infinity, u1 = -Infinity, v0_ = Infinity, v1 = -Infinity;
    const take = (x, y, z) => { const [u, v] = proj[view](x, y, z); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0_ = Math.min(v0_, v); v1 = Math.max(v1, v); };
    for (const c of cases) { const M = chargeFieldModel({ ...c, ...origin, tmax, dt: 0.02 }); for (let i = 0; i <= 120; i++) { const a = M.at(tmax * i / 120); take(a.x, a.y, a.z); } }
    take(origin.x0, origin.y0, origin.z0);
    if (win.x || win.y || win.z) {
      const X = win.x ?? [u0, u1], Y = win.y ?? [v0_, v1], Z = win.z ?? [v0_, v1];
      if (view === 'top') return [X[0], X[1], Y[0], Y[1]];
      if (view === 'side') return [X[0], X[1], Z[0], Z[1]];
      const pts = [[X[0], Y[0], Z[0]], [X[1], Y[0], Z[0]], [X[0], Y[1], Z[0]], [X[1], Y[1], Z[0]], [X[0], Y[0], Z[1]], [X[1], Y[1], Z[1]], [X[0], Y[1], Z[1]], [X[1], Y[0], Z[1]]].map(p => proj['3d'](...p));
      return [Math.min(...pts.map(p => p[0])), Math.max(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[1]))];
    }
    const pu = (u1 - u0) * 0.1 + 0.6, pv = (v1 - v0_) * 0.1 + 0.6;
    return [u0 - pu, u1 + pu, v0_ - pv, v1 + pv];
  };

  // geometry (px)
  const W = 360, PW = 330, PX = 15, heights = { top: 270, side: 190, '3d': 230 };
  const boxes = [];
  for (const v of views) { const hh = heights[v]; if (!hh) continue; boxes.push({ view: v, x0: PX, y0: 4, w: PW, h: hh, bb: bbox(v), id: `cf${++uid}`, svg: s('svg', { viewBox: `0 0 ${W} ${hh + 8}`, class: 'fs-svg', role: 'img', 'aria-label': v === 'top' ? Lb.topTitle : v === 'side' ? Lb.sideTitle : Lb.threeTitle }) }); }
  for (const b of boxes) {
    const [a0, a1, c0, c1] = b.bb, du = Math.max(a1 - a0, 1e-6), dv = Math.max(c1 - c0, 1e-6);
    b.S = Math.min((b.w - 8) / du, (b.h - 8) / dv);
    b.px = (u, v) => [b.x0 + b.w / 2 + (u - (a0 + a1) / 2) * b.S, b.y0 + b.h / 2 - (v - (c0 + c1) / 2) * b.S];
  }
  const col = { v: 'var(--vec)', f: 'var(--covec)', e: 'var(--basis)', net: 'var(--ink)', trace: 'var(--vec)' };

  // arrow scales: ~48 px for the largest speed and force over the start state and the presets
  let vRef = 1e-9, fRef = 1e-9;
  for (const c of cases) {
    const M = model(c), a = M.at(0), Ee = Math.hypot(c.q * M.Ex, c.q * M.Ey);
    vRef = Math.max(vRef, a.speed, M.drift ? Math.hypot(...M.drift) : 0); fRef = Math.max(fRef, Math.hypot(...a.F), Ee, Math.abs(c.q * M.Ez));
  }
  vRef = cfg.scale?.v ?? vRef; fRef = cfg.scale?.f ?? fRef;
  let tNow = cfg.start === 'play' ? 0 : tmax, raf = 0, t0 = 0;

  function arrow(g0, x1, y1, dx, dy, color, txt, lx = 0, ly = 0, w = 3) {
    const L0 = Math.hypot(dx, dy); if (L0 < 3) return;
    const k = Math.min(1, 90 / L0), ddx = dx * k, ddy = dy * k, L = L0 * k, ux = ddx / L, uy = ddy / L, x2 = x1 + ddx, y2 = y1 + ddy;
    g0.append(s('line', { x1, y1, x2: x2 - ux * 5, y2: y2 - uy * 5, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round' }),
      s('polygon', { fill: color, points: `${x2},${y2} ${x2 - ux * 8 - uy * 4},${y2 - uy * 8 + ux * 4} ${x2 - ux * 8 + uy * 4},${y2 - uy * 8 - ux * 4}` }));
    if (show.labels && txt) g0.append(s('text', { x: x2 + lx, y: y2 + ly, 'font-size': 10, 'text-anchor': lx < 0 ? 'end' : lx > 0 ? 'start' : 'middle', fill: color, 'font-weight': 650 }, txt));
  }
  const line = (a, b, o = {}) => s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...o });
  const txt = (x, y, t, o = {}) => s('text', { x, y, 'font-size': 9.5, fill: 'var(--muted)', ...o }, t);

  function pathD(b, M, ta, tb, n = 260) {
    const pts = []; for (let i = 0; i <= n; i++) { const a = M.at(ta + (tb - ta) * i / n), [px, py] = b.px(...proj[b.view](a.x, a.y, a.z)); pts.push(`${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`); }
    return pts.join(' ');
  }

  function paint() {
    const M = model(st), now = M.at(tNow), here = b => b.px(...proj[b.view](now.x, now.y, now.z));
    for (const b of boxes) {
      const g0 = s('g'), cp = s('clipPath', { id: b.id }, s('rect', { x: b.x0, y: b.y0, width: b.w, height: b.h })), body = s('g', { 'clip-path': `url(#${b.id})` });
      g0.append(cp, s('rect', { x: b.x0, y: b.y0, width: b.w, height: b.h, fill: 'none', stroke: 'var(--line, #ccc)', 'stroke-width': 1, rx: 4 }), body);
      const o = b.px(0, 0);
      if (b.view === 'top') {
        if (show.grid) { const [a0, a1, c0, c1] = b.bb; for (let u = Math.ceil(a0); u <= a1; u++) body.append(line(b.px(u, c0), b.px(u, c1), { stroke: 'var(--line, #ccc)', 'stroke-width': 0.5 })); for (let v = Math.ceil(c0); v <= c1; v++) body.append(line(b.px(a0, v), b.px(a1, v), { stroke: 'var(--line, #ccc)', 'stroke-width': 0.5 })); }
        if (show.field && st.B !== 0) {
          const sg = Math.sign(st.B) * (1); // B along +z: toward the viewer = dot
          for (let gx = b.x0 + 22; gx < b.x0 + b.w; gx += 44) for (let gy = b.y0 + 22; gy < b.y0 + b.h; gy += 44) {
            if (sg > 0) body.append(s('circle', { cx: gx, cy: gy, r: 2, fill: 'var(--muted)', opacity: 0.45 }));
            else body.append(line([gx - 2.5, gy - 2.5], [gx + 2.5, gy + 2.5], { stroke: 'var(--muted)', opacity: 0.45 }), line([gx - 2.5, gy + 2.5], [gx + 2.5, gy - 2.5], { stroke: 'var(--muted)', opacity: 0.45 }));
          }
          if (show.labels && Lb.bField) g0.append(txt(b.x0 + b.w - 6, b.y0 + 12, `${Lb.bField}${st.B > 0 ? ' ⊙' : ' ⊗'}`, { 'text-anchor': 'end' }));
        }
        if (show.axes) { body.append(line([b.x0, o[1]], [b.x0 + b.w, o[1]], { stroke: 'var(--ink)', 'stroke-width': 1, opacity: 0.5 }), line([o[0], b.y0], [o[0], b.y0 + b.h], { stroke: 'var(--ink)', 'stroke-width': 1, opacity: 0.5 }));
          if (show.labels) g0.append(txt(b.x0 + b.w - 5, Math.min(b.y0 + b.h - 4, Math.max(b.y0 + 10, o[1] - 4)), 'x', { 'text-anchor': 'end' }), txt(Math.min(b.x0 + b.w - 10, Math.max(b.x0 + 4, o[0] + 4)), b.y0 + 11, 'y')); }
      } else if (b.view === 'side') {
        if (show.axes) { body.append(line([b.x0, o[1]], [b.x0 + b.w, o[1]], { stroke: 'var(--ink)', 'stroke-width': 1, opacity: 0.5 }), line([o[0], b.y0], [o[0], b.y0 + b.h], { stroke: 'var(--ink)', 'stroke-width': 1, opacity: 0.5 }));
          if (show.labels) g0.append(txt(b.x0 + b.w - 5, Math.min(b.y0 + b.h - 4, Math.max(b.y0 + 10, o[1] - 4)), 'x', { 'text-anchor': 'end' }), txt(Math.min(b.x0 + b.w - 10, Math.max(b.x0 + 4, o[0] + 4)), b.y0 + 11, 'z')); }
      } else if (show.axes) {                                                         // 3d triad in the corner
        const c = [b.x0 + 26, b.y0 + b.h - 22], ux = proj['3d'](1, 0, 0), uy = proj['3d'](0, 1, 0), uz = proj['3d'](0, 0, 1);
        for (const [v, l] of [[ux, 'x'], [uy, 'y'], [uz, 'z']]) { const e = [c[0] + v[0] * 22, c[1] - v[1] * 22]; g0.append(line(c, e, { stroke: 'var(--ink)', 'stroke-width': 1.2, opacity: 0.7 })); if (show.labels) g0.append(txt(e[0] + (v[0] >= 0 ? 3 : -8), e[1] - 2, l)); }
      }
      if (show.labels) g0.append(txt(b.x0 + 6, b.y0 + 12, b.view === 'top' ? Lb.topTitle : b.view === 'side' ? Lb.sideTitle : Lb.threeTitle));
      if (b.view === '3d' && show.shadow) {                                          // floor shadow (z = 0 plane through the start height)
        const pts = []; for (let i = 0; i <= 200; i++) { const a = M.at(tNow * i / 200); pts.push(`${i ? 'L' : 'M'}${b.px(...proj['3d'](a.x, a.y, origin.z0)).map(v => v.toFixed(1)).join(' ')}`); }
        body.append(s('path', { d: pts.join(' '), fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1.2, 'stroke-dasharray': '2 3', opacity: 0.6 }));
      }
      if (show.vacuum) { const a = M.at(0), p1 = b.px(...proj[b.view](a.x, a.y, a.z)), p2 = b.px(...proj[b.view](a.x + M.vx0 * tmax, a.y + M.vy0 * tmax, a.z + M.vz * tmax));
        body.append(line(p1, p2, { stroke: 'var(--muted)', 'stroke-width': 1.5, 'stroke-dasharray': '6 4' })); }
      if (show.ahead && tNow < tmax) body.append(s('path', { d: pathD(b, M, tNow, tmax, 200), fill: 'none', stroke: col.trace, 'stroke-width': 1.5, opacity: 0.25 }));
      if (show.trace && tNow > 0) body.append(s('path', { d: pathD(b, M, 0, tNow), fill: 'none', stroke: col.trace, 'stroke-width': 2.5 }));
      if (show.start) { const p = b.px(...proj[b.view](origin.x0, origin.y0, origin.z0)); body.append(s('circle', { cx: p[0], cy: p[1], r: 4, fill: 'var(--bg, #fff)', stroke: col.trace, 'stroke-width': 1.5 })); }
      const C = M.center(tNow), p = here(b);
      if (b.view === 'top') {
        if (C && show.circle && isFinite(M.R)) body.append(s('circle', { cx: b.px(...C)[0], cy: b.px(...C)[1], r: M.R * b.S, fill: 'none', stroke: col.f, 'stroke-width': 1.3, 'stroke-dasharray': '5 4' }));
        if (C && show.radius) { const pc = b.px(...C); body.append(line(pc, p, { stroke: col.f, 'stroke-width': 1.5 })); if (show.labels && Lb.circle) g0.append(txt((pc[0] + p[0]) / 2 + 4, (pc[1] + p[1]) / 2 - 4, Lb.circle, { fill: col.f, 'font-weight': 650 })); }
        if (C && show.center) { const pc = b.px(...C); body.append(line([pc[0] - 4, pc[1]], [pc[0] + 4, pc[1]], { stroke: col.f, 'stroke-width': 1.8 }), line([pc[0], pc[1] - 4], [pc[0], pc[1] + 4], { stroke: col.f, 'stroke-width': 1.8 })); if (show.labels && Lb.center) g0.append(txt(pc[0] + 6, pc[1] - 5, Lb.center, { fill: col.f })); }
        if (show.drift && M.drift && Math.hypot(...M.drift) > 1e-9 && C) { const pc = b.px(...C), k = 48 / vRef; arrow(body, pc[0], pc[1], M.drift[0] * k, -M.drift[1] * k, col.e, Lb.fU, 0, -6, 2.5); }
        const kv = 48 / vRef, kf = 48 / fRef, Fm = now.F, Fe = now.Fe;
        if (show.velocity) arrow(body, p[0], p[1], now.vx * kv, -now.vy * kv, col.v, Lb.fV, 6, -4);
        if (show.force && Math.hypot(...Fm) > 1e-9) arrow(body, p[0], p[1], Fm[0] * kf, -Fm[1] * kf, col.f, Lb.fF, 6, 10);
        if (show.eForce && Math.hypot(Fe[0], Fe[1]) > 1e-9) arrow(body, p[0], p[1], Fe[0] * kf, -Fe[1] * kf, col.e, Lb.fE, 6, -4);
        if (show.net) { const nx = Fm[0] + Fe[0], ny = Fm[1] + Fe[1]; arrow(body, p[0], p[1], nx * kf, -ny * kf, col.net, Lb.fNet, -6, -6, 2); }
      }
      if (show.particle) body.append(s('circle', { cx: p[0], cy: p[1], r: 6, fill: col.v, opacity: 0.35, stroke: col.v, 'stroke-width': 2 }));
      b.svg.append(g0);
    }
    const dr = M.drift ? Math.hypot(...M.drift) : 0, fmag = Math.hypot(...now.F);
    const val = { r: isFinite(M.R) ? withU(num(M.R, 3), U.length) : '∞', omega: withU(num(M.omega, 3), U.time ? `${U.time}⁻¹` : ''), period: isFinite(M.T) ? withU(num(M.T, 3), U.time) : '∞',
      speed: withU(num(now.speed, 3), U.speed), vperp: withU(num(now.vperp, 3), U.speed), vz: withU(num(now.vz, 3), U.speed), ke: withU(num(now.ke, 3), U.energy), force: withU(num(fmag, 3), U.force),
      drift: M.drift ? withU(num(dr, 3), U.speed) : '–', time: withU(num(tNow, 2), U.time), x: withU(num(now.x, 2), U.length), y: withU(num(now.y, 2), U.length), z: withU(num(now.z, 2), U.length) };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    for (const [key, inp] of Object.entries(inps)) { const v = key === 't' ? tNow : st[key]; inp.value = v; vals[key].textContent = withU(sFmt[key](v), sUnit[key]); }
  }

  // controls
  const rd = {}, inps = {}, vals = {};
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const sliderEls = sliderKeys.map(k => {
    const [lo, hi, step] = k === 't' ? [0, tmax, tmax / 300] : Rg[k];
    const inp = inps[k] = h('input', { type: 'range', min: lo, max: hi, step, value: k === 't' ? tNow : st[k], 'aria-label': Lb[k] });
    inp.addEventListener('input', () => { if (k === 't') { cancelAnimationFrame(raf); tNow = +inp.value; } else st[k] = +inp.value; redraw(); });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb[k])), inp, vals[k] = h('span', { class: 'fs-num' }));
  });
  const btn = (t, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(t));
  const apply = p => { for (const k of KEYS) if (p[k] != null) st[k] = p[k]; redraw(); };
  const btns = h('div', { class: 'wbtns' }, show.replay ? btn(Lb.play, () => play()) : '', btn(Lb.reset, () => { cancelAnimationFrame(raf); Object.assign(st, init); tNow = cfg.start === 'play' ? 0 : tmax; redraw(); if (cfg.start === 'play') play(); }), (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, boxes.map(b => b.svg)), show.readouts && reads.length ? readEl : '', sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', btns);

  function redraw() { for (const b of boxes) b.svg.replaceChildren(); paint(); }
  function play() {
    cancelAnimationFrame(raf); tNow = 0; t0 = performance.now(); redraw();
    const tick = now => {
      if (!el.isConnected) return;
      tNow = Math.max(0, Math.min(tmax, (now - t0) / duration * tmax)); redraw();
      if (tNow < tmax) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  if (cfg.start === 'play') play(); else redraw();
}
