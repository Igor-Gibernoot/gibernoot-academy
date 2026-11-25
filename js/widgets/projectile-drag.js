// projectile-drag
//
// A projectile in the (x, y) plane, y up, launched from the origin with speed v0 at angle theta above the horizontal.
// Weight m g down, drag opposite to the velocity, Taylor's split f(v) = f_lin + f_quad, f_lin = b v, f_quad = c v^2 (Taylor 2.1-2.3):
//   m dv/dt = m g_vec - (b + c |v|) v      (terms switched on by the law)
//   law 'none'    vacuum parabola, R_0 = 2 v_x0 v_y0 / g (Eq. 2.38)
//   law 'linear'  f = b v: x(t) = v_x0 tau (1 - e^(-t/tau)), y(t) = (v_y0 + v_ter) tau (1 - e^(-t/tau)) - v_ter t   (Eq. 2.36, y up),
//                 tau = m / b, v_ter = m g / b, vertical asymptote x = v_x0 tau (Eq. 2.37)
//   law 'quad'    f = c v^2;  law 'both'  f = b v + c v^2
// The path is integrated by RK4 (dt = 0.002 s). For the linear law the closed forms are exported (projectileLinearExact) and
// can be drawn on top of the path as a check. No course text is hard-coded; every word comes from the config.
//
//   law: 'linear'                   start law (none, linear, quad, both)
//   laws: ['none','linear']         buttons offered; one entry = no switch
//   v0: 20, theta: 45, m: 1, b: 1, c: 0.1, g: 9.8     start values (m/s, degrees, kg, kg/s, kg/m, m/s^2)
//   sliders: ['v0','theta']         any of v0, theta, m, b, c (order kept)
//   ranges: { v0:[1,40,1], theta:[5,85,1], m:[0.1,5,0.1], b:[0,5,0.05], c:[0,1,0.01] }
//   axes: { x:[0,X], y:[0,Y] }      fixed view (default from the largest vacuum range and peak over the sliders and presets)
//   dotEvery: 0.5                   time between dots (s)
//   duration: 4000                  ms of one replay of the flight
//   units: { force, speed, distance, time, mass, b, c, angle }
//   show: { path, vacuum, closed, dots, ball, weight, drag, velocity, range, asymptote, ground, labels, grid, readouts, laws, replay, timeSlider }
//       default true: path, ball, ground, labels, readouts, laws, replay; default false: vacuum (dashed parabola), closed (linear closed
//       form drawn as a thin dashed curve, linear law), dots, weight, drag, velocity (arrows at the ball), range (markers at R and R_0),
//       asymptote (vertical line x = v_x0 tau, linear law), grid, timeSlider (slider for the time of the ball).
//   readouts: ['range','time']      any of range, vacRange, ratio, time, peak, tau, asymptote, speed, terminal, now
//       range R, vacRange R_0, ratio R/R_0, time = flight time, peak = highest point, tau = m/b, asymptote = v_x0 tau, speed = v at the
//       marker, terminal = v_ter = m g / b (linear) or the vertical terminal speed of the law, now = t at the marker.
//   presets: [{ label, law, v0, theta, m, b, c }]   buttons; only the fields given change
//   labels: { range, vacRange, ratio, time, peak, tau, asymptote, speed, terminal, now, none, linear, quad, both, v0, theta, m, b, c,
//             release, reset, scene, fWeight, fDrag, fVel, rMark, r0Mark, asymLab, xAxis, yAxis }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };
const niceUp = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map(m => m * p).find(x => x >= v - 1e-9); };

// Closed forms of the linear law (Taylor Eq. 2.36, y up).
export function projectileLinearExact({ v0, theta, m = 1, b = 1, g = 9.8 }, t) {
  const th = theta * Math.PI / 180, vx0 = v0 * Math.cos(th), vy0 = v0 * Math.sin(th), tau = m / b, vter = m * g / b, e = Math.exp(-t / tau);
  return { x: vx0 * tau * (1 - e), y: (vy0 + vter) * tau * (1 - e) - vter * t, vx: vx0 * e, vy: (vy0 + vter) * e - vter, tau, vter, asym: vx0 * tau };
}

// Pure model, exported for script checks. at(t) gives x, y, vx, vy, drag; the flight ends when y returns to 0.
export function projectileDragModel({ law = 'linear', v0 = 20, theta = 45, m = 1, b = 1, c = 0.1, g = 9.8, dt = 0.002, tcap = 120 } = {}) {
  const lin = law === 'linear' || law === 'both' ? b : 0, quad = law === 'quad' || law === 'both' ? c : 0;
  const th = theta * Math.PI / 180, vx0 = v0 * Math.cos(th), vy0 = v0 * Math.sin(th);
  const k = v => lin + quad * Math.hypot(v[2], v[3]);                       // drag = k * speed vector
  const f = u => { const kk = k(u) / m; return [u[2], u[3], -kk * u[2], -g - kk * u[3]]; };
  const step = (u, hh) => {
    const add = (a, d, w) => a.map((x, i) => x + w * d[i]);
    const k1 = f(u), k2 = f(add(u, k1, hh / 2)), k3 = f(add(u, k2, hh / 2)), k4 = f(add(u, k3, hh));
    return u.map((x, i) => x + hh / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  const states = [[0, 0, vx0, vy0]];
  let u = states[0], T = null;
  for (let i = 0; i < tcap / dt; i++) {
    const nx = step(u, dt);
    if (i > 0 && nx[1] < 0) {                                              // landing: bisect the last step
      let lo = 0, hi = dt; for (let j = 0; j < 60; j++) { const mid = (lo + hi) / 2; step(u, mid)[1] >= 0 ? lo = mid : hi = mid; }
      T = i * dt + (lo + hi) / 2; break;
    }
    if (i === 0 && nx[1] < 0) { T = 0; break; }
    states.push(nx); u = nx;
  }
  const tEnd = T ?? states.length * dt;
  const at = t => {
    const tt = Math.max(0, Math.min(tEnd, t)), i = Math.min(states.length - 1, Math.floor(tt / dt + 1e-12)), w = tt - i * dt;
    const q = w > 1e-15 ? step(states[i], w) : states[i], kk = k(q);
    return { t: tt, x: q[0], y: q[1], vx: q[2], vy: q[3], fx: -kk * q[2], fy: -kk * q[3], v: Math.hypot(q[2], q[3]) };
  };
  let peak = 0; for (const q of states) if (q[1] > peak) peak = q[1];
  const vt = law === 'none' ? null : quad > 0 ? (lin > 0 ? (-lin + Math.sqrt(lin * lin + 4 * quad * m * g)) / (2 * quad) : Math.sqrt(m * g / quad)) : lin > 0 ? m * g / lin : null;
  const R = T == null ? NaN : at(T).x, R0 = 2 * vx0 * vy0 / g;
  return { at, T: tEnd, landed: T != null, R, R0, peak, vt, tau: lin > 0 ? m / lin : null, asym: lin > 0 ? vx0 * m / lin : null, vx0, vy0 };
}

export function projectileDrag(el, cfg) {
  const Lb = { range: 'Range R', vacRange: 'Vacuum range R₀', ratio: 'R / R₀', time: 'Flight time', peak: 'Peak height', tau: 'm / b', asymptote: 'Asymptote', speed: 'Speed', terminal: 'Terminal speed', now: 'Time',
    none: 'No drag', linear: 'Linear', quad: 'Quadratic', both: 'Both', v0: 'Launch speed v₀', theta: 'Angle θ', m: 'Mass m', b: 'b', c: 'c', release: 'Launch', reset: 'Reset', scene: 'A projectile',
    fWeight: 'mg', fDrag: 'f', fVel: 'v', rMark: 'R', r0Mark: 'R₀', asymLab: 'x = v_x0 τ', xAxis: 'x', yAxis: 'y', ...(cfg.labels ?? {}) };
  const show = { path: true, vacuum: false, closed: false, dots: false, ball: true, weight: false, drag: false, velocity: false, range: false, asymptote: false, ground: true, labels: true, grid: false, readouts: true, laws: true, replay: true, timeSlider: false, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['range', 'time'];
  const U = { force: 'N', speed: 'm/s', distance: 'm', time: 's', mass: 'kg', b: 'kg/s', c: 'kg/m', angle: '°', ...(cfg.units ?? {}) };
  const R = { v0: [1, 40, 1], theta: [5, 85, 1], m: [0.1, 5, 0.1], b: [0, 5, 0.05], c: [0, 1, 0.01], ...(cfg.ranges ?? {}) };
  const g = cfg.g ?? 9.8, duration = cfg.duration ?? 4000, dotEvery = cfg.dotEvery ?? 0.5;
  const laws = cfg.laws ?? ['none', 'linear'];
  const init = { law: cfg.law ?? laws[0], v0: cfg.v0 ?? 20, theta: cfg.theta ?? 45, m: cfg.m ?? 1, b: cfg.b ?? 1, c: cfg.c ?? 0.1 };
  const st = { ...init };
  const sliderKeys = cfg.sliders ?? [];
  const model = q => projectileDragModel({ ...q, g });
  const sFmt = { v0: v => num(v, 0), theta: v => num(v, 0), m: v => num(v, 1), b: v => num(v, 2), c: v => num(v, 3) };
  const sUnit = { v0: U.speed, theta: U.angle, m: U.mass, b: U.b, c: U.c };

  // Fixed view from the vacuum extremes over the start values, presets and slider limits (drag only shrinks the path).
  const cases = [init, ...(cfg.presets ?? []).map(p => ({ ...init, ...p }))];
  const vmax = Math.max(...cases.map(q => q.v0), sliderKeys.includes('v0') ? R.v0[1] : 0);
  const thSet = [...cases.map(q => q.theta), ...(sliderKeys.includes('theta') ? R.theta : [])];
  const sinMax = Math.max(...thSet.map(t => Math.sin(t * Math.PI / 180))), sin2Max = Math.max(...thSet.map(t => Math.sin(2 * t * Math.PI / 180)), 0);
  const ax = { x: cfg.axes?.x ?? [0, niceUp(Math.max(1, vmax * vmax * sin2Max / g * 1.08))], y: cfg.axes?.y ?? [0, niceUp(Math.max(1, vmax * vmax * sinMax * sinMax / (2 * g) * 1.15))] };

  // geometry (px): equal scale on both axes
  const W = 360, PL = 34, PR = 346, PW = PR - PL, X = ax.x[1] - ax.x[0], Y = ax.y[1] - ax.y[0];
  const sc = Math.min(PW / X, 230 / Y), PH = Y * sc, top = 16, gY = top + PH, H = top + PH + 34 + (show.labels ? 8 : 0);
  const px = x => PL + (x - ax.x[0]) * sc, py = y => gY - (y - ax.y[0]) * sc;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.scene });
  let tNow = 0, raf = 0, t0 = 0, held = false;
  const col = { weight: 'var(--muted)', drag: 'var(--covec)', vel: 'var(--vec)', path: 'var(--vec)', vac: 'var(--muted)', closed: 'var(--basis)' };
  const lawName = l => Lb[l] ?? l;

  function arrow(g0, x1, y1, x2, y2, color, txt, dx = 0, dy = 0) {
    const ddx = x2 - x1, ddy = y2 - y1, L = Math.hypot(ddx, ddy); if (L < 3) return;
    const ux = ddx / L, uy = ddy / L;
    g0.append(s('line', { x1, y1, x2: x2 - ux * 5, y2: y2 - uy * 5, stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
      s('polygon', { fill: color, points: `${x2},${y2} ${x2 - ux * 8 - uy * 4},${y2 - uy * 8 + ux * 4} ${x2 - ux * 8 + uy * 4},${y2 - uy * 8 - ux * 4}` }));
    if (show.labels && txt) g0.append(s('text', { x: x2 + dx, y: y2 + dy, 'font-size': 10, 'text-anchor': dx < 0 ? 'end' : dx > 0 ? 'start' : 'middle', fill: color, 'font-weight': 650 }, txt));
  }
  const curve = (g0, fn, T, color, w, dash) => {
    const pts = []; const n = 120;
    for (let i = 0; i <= n; i++) { const q = fn(T * i / n); if (!isFinite(q.x) || !isFinite(q.y)) continue; pts.push(`${pts.length ? 'L' : 'M'}${Math.max(-50, Math.min(W + 50, px(q.x))).toFixed(1)} ${Math.max(top - 40, Math.min(gY + 40, py(q.y))).toFixed(1)}`); }
    g0.append(s('path', { d: pts.join(' '), fill: 'none', stroke: color, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) }));
  };

  let cache = null, cacheKey = '';
  const getM = () => { const key = JSON.stringify(st); if (key !== cacheKey) { cache = { M: model(st), V: model({ ...st, law: 'none' }) }; cacheKey = key; } return cache; };

  function paint() {
    const { M, V } = getM(), now = M.at(tNow), Wt = st.m * g, g0 = s('g');
    if (show.grid) { for (let i = 1; i <= 4; i++) g0.append(s('line', { x1: PL, x2: PR, y1: gY - PH * i / 4, y2: gY - PH * i / 4, stroke: 'var(--line, #ccc)', 'stroke-width': 0.7 })); }
    if (show.ground) g0.append(s('line', { x1: PL, y1: gY, x2: PR, y2: gY, stroke: 'var(--ink)', 'stroke-width': 1.4 }), s('line', { x1: PL, y1: top - 4, x2: PL, y2: gY, stroke: 'var(--ink)', 'stroke-width': 1.2 }),
      s('text', { x: PL - 4, y: gY + 3, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, '0'), s('text', { x: PL - 4, y: top + 4, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, num(ax.y[1], 1)),
      s('text', { x: PR, y: gY + 11, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, `${num(ax.x[1], 1)} ${U.distance}`));
    if (show.labels) g0.append(s('text', { x: PL + 3, y: top - 5, 'font-size': 9.5, fill: 'var(--muted)' }, `${Lb.yAxis} (${U.distance})`), s('text', { x: (PL + PR) / 2, y: gY + 23, 'font-size': 9.5, 'text-anchor': 'middle', fill: 'var(--muted)' }, `${Lb.xAxis} (${U.distance})`));
    if (show.asymptote && M.asym != null && M.asym <= ax.x[1]) {
      g0.append(s('line', { x1: px(M.asym), x2: px(M.asym), y1: top - 4, y2: gY, stroke: col.drag, 'stroke-width': 1.3, 'stroke-dasharray': '6 3' }));
      if (show.labels) g0.append(s('text', { x: px(M.asym) + 3, y: top + 8, 'font-size': 9.5, 'text-anchor': 'start', fill: col.drag, 'font-weight': 650 }, `${Lb.asymLab} = ${num(M.asym, 1)}`));
    }
    if (show.vacuum && st.law !== 'none') curve(g0, V.at, V.T, col.vac, 1.8, '5 4');
    if (show.closed && st.law === 'linear' && st.b > 0) {
      const ex = t => projectileLinearExact(st, t); curve(g0, ex, M.T, col.closed, 1.4, '2 3');
    }
    if (show.path) curve(g0, M.at, M.T, col.path, 2.5);
    if (show.dots) for (let t = dotEvery; t <= M.T + 1e-9; t += dotEvery) { const q = M.at(t); g0.append(s('circle', { cx: px(q.x), cy: py(q.y), r: 2.8, fill: col.path, stroke: 'var(--bg, #fff)', 'stroke-width': 1 })); }
    if (show.range) {
      if (M.landed) { g0.append(s('line', { x1: px(M.R), x2: px(M.R), y1: gY - 7, y2: gY + 7, stroke: col.path, 'stroke-width': 2.5 }));
        if (show.labels) g0.append(s('text', { x: px(M.R), y: gY - 10, 'font-size': 10, 'text-anchor': 'middle', fill: col.path, 'font-weight': 650 }, Lb.rMark)); }
      if (st.law !== 'none') { g0.append(s('line', { x1: px(M.R0), x2: px(M.R0), y1: gY - 7, y2: gY + 7, stroke: col.vac, 'stroke-width': 2.5 }));
        if (show.labels) g0.append(s('text', { x: px(M.R0), y: gY - 10, 'font-size': 10, 'text-anchor': 'middle', fill: col.vac, 'font-weight': 650 }, Lb.r0Mark)); }
    }
    if (show.ball) {
      const bx = px(now.x), by = py(now.y), kW = 40;
      const clampLen = (fx, fy, k, cap) => { const L = Math.hypot(fx, fy) * k; if (L < 1e-9) return [0, 0]; const r = Math.min(cap, L) / L; return [fx * k * r, fy * k * r]; };
      if (show.weight) arrow(g0, bx, by, bx, by + kW, col.weight, Lb.fWeight, 4, 10);
      if (show.drag) { const [dx, dy] = clampLen(now.fx, now.fy, kW / Wt, 90); arrow(g0, bx, by, bx + dx, by - dy, col.drag, Lb.fDrag, dx < 0 ? -4 : 4, -4); }
      if (show.velocity) { const [dx, dy] = clampLen(now.vx, now.vy, 2.2, 80); arrow(g0, bx, by, bx + dx, by - dy, col.vel, Lb.fVel, 4, -4); }
      g0.append(s('circle', { cx: bx, cy: by, r: 5.5, fill: 'var(--vec)', opacity: 0.35, stroke: 'var(--vec)', 'stroke-width': 1.8 }));
    }
    svg.append(g0);
    const val = { range: M.landed ? `${num(M.R, 2)} ${U.distance}` : '–', vacRange: `${num(M.R0, 2)} ${U.distance}`, ratio: M.landed && M.R0 > 0 ? num(M.R / M.R0, 3) : '–', time: `${num(M.T, 2)} ${U.time}`,
      peak: `${num(M.peak, 2)} ${U.distance}`, tau: st.b > 0 ? `${num(st.m / st.b, 2)} ${U.time}` : '∞', asymptote: M.asym == null ? '–' : `${num(M.asym, 2)} ${U.distance}`,
      speed: `${num(now.v, 2)} ${U.speed}`, terminal: M.vt == null ? '–' : `${num(M.vt, 2)} ${U.speed}`, now: `${num(tNow, 2)} ${U.time}` };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    for (const [key, inp] of Object.entries(inps)) { inp.value = st[key]; vals[key].textContent = `${sFmt[key](st[key])} ${sUnit[key]}`; }
    if (tSlide) { tSlide.max = M.T; tSlide.value = tNow; }
    for (const [l, bt] of Object.entries(lawBtn)) bt.classList.toggle('on', st.law === l);
  }

  // controls
  const rd = {}, inps = {}, vals = {}, lawBtn = {};
  let tSlide = null;
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const sliderEls = sliderKeys.map(k => {
    const [lo, hi, step] = R[k];
    const inp = inps[k] = h('input', { type: 'range', min: lo, max: hi, step, value: st[k], 'aria-label': Lb[k] });
    inp.addEventListener('input', () => { st[k] = +inp.value; play(); });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb[k])), inp, vals[k] = h('span', { class: 'fs-num' }));
  });
  if (show.timeSlider) {
    tSlide = h('input', { type: 'range', min: 0, max: 1, step: 0.01, value: 0, 'aria-label': Lb.now });
    tSlide.addEventListener('input', () => { cancelAnimationFrame(raf); held = true; tNow = +tSlide.value; redraw(); });
    sliderEls.push(h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb.now)), tSlide, h('span', { class: 'fs-num' })));
  }
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const apply = p => { for (const k of ['law', 'v0', 'theta', 'm', 'b', 'c']) if (p[k] != null) st[k] = p[k]; play(); };
  const lawEls = show.laws && laws.length > 1 ? h('div', { class: 'wbtns' }, laws.map(l => lawBtn[l] = btn(lawName(l), () => { st.law = l; play(); }))) : '';
  const btns = h('div', { class: 'wbtns' }, show.replay ? btn(Lb.release, () => play()) : '', btn(Lb.reset, () => { Object.assign(st, init); play(); }), (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), lawEls, show.readouts && reads.length ? readEl : '', sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', btns);

  function redraw() { svg.replaceChildren(); paint(); }
  function play() {
    cancelAnimationFrame(raf); held = false; tNow = 0; t0 = performance.now(); redraw();
    const T = getM().M.T;
    const tick = now => {
      if (!el.isConnected || held) return;
      tNow = Math.max(0, Math.min(T, (now - t0) / duration * T)); redraw();
      if (tNow < T) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  play();
}
