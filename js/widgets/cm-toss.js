// cm-toss
//
// An extended body (2 or 3 point masses joined by light rods) is tossed under uniform gravity g (downwards, y up). The body spins at
// the constant rate omega about its center of mass (no torque about the CM in uniform gravity). The center of mass R follows the
// parabola of a single particle of mass M = sum m_i:  R(t) = R0 + V0 t - (g t²/2) ŷ.  Each particle i sits at  R + Rot(phi0 + omega t) r_i,
// with r_i its body-frame position relative to the CM, so its own path is wavy (a parabola plus a circle).
// Internal (rod) force on particle i:  F_i = -m_i omega² r_i(t)  (toward the CM); the sum over i is zero.
// Explosion (optional): at time tx the rods break and particle i gets an extra velocity  u_i = kick * r_i(tx)  (sum m_i u_i = 0),
// so afterwards every fragment is a projectile, yet the CM path is unchanged. The drawing stops when the CM lands (y = 0).
// Pure analytic model (no integration). Fully general: every word comes from the config.
//
//   masses: [1, 3]                  particle masses (units.mass); 2 or 3 entries
//   points: [[-1,0],[1,0]]          body-frame positions (units.length), one per mass (default: evenly spaced on a line, spacing 1.2)
//   rods: 'chain'                   'chain' (0-1, 1-2) or 'all' (every pair, e.g. a triangle) or 'none' (explosion body, no rods drawn)
//   v0: 7, theta: 55, omega: 4      launch speed of the CM, angle (degrees above horizontal), spin (rad/s, counter-clockwise)
//   phi0: 0                         initial orientation (degrees)
//   g: 9.8, y0: 0                   gravity and CM launch height (ground at y = 0)
//   explode: null                   { t: 0.5, kick: 1 }  rods break at t (kick = start value of the slider, 1/time)
//   sliders: []                     any of v0, theta, omega, m1, m2, m3, probe, kick
//   ranges: { v0:[2,10,0.5], theta:[20,80,5], omega:[0,12,0.5], m1:[0.5,5,0.5], m2:..., m3:..., probe:[0,1,0.01], kick:[0,2,0.1] }
//   probe: null                     0..1: a ring on the line from the first to the last particle, with its own path (the 'guess the CM' tool)
//   units: { mass:'kg', length:'m', speed:'m/s', time:'s' }
//   duration: 4000                  animation time of one run (ms)
//   show: { ground, body, cm, cmPath, paths, strobe, momentum, weight, internal, readouts, labels, replay, timeSlider, probePath }
//       defaults true: ground, body, cm, cmPath, paths, momentum, weight, readouts, labels, replay; false: strobe, internal,
//       timeSlider, probePath.   body = particles and rods; cm = the marked CM; cmPath = dashed full parabola of the CM;
//       paths = traces of the particles up to now (an exploded fragment keeps its own); strobe = faint copies of the body at equal times;
//       momentum = arrow P = M V at the CM; weight = arrow M g at the CM; internal = rod-force arrows on each particle (before explosion);
//       probePath = trace of the probe ring (when probe is set; the probe ring itself shows whenever probe is set).
//   readouts: ['t','R','V','P']     any of t, R, V, P, W, M, off, omega, vx, vy  (off = signed distance probe to CM along the rod)
//   presets: [{ label, ...any of v0, theta, omega, m1, m2, m3, probe, kick }]
//   labels: { t, R, V, P, W, M, off, omega, vx, vy, v0, theta, m1, m2, m3, probe, kick, time, play, reset, scene, cm, momentum,
//             weight, internal, probe }   (momentum/weight/internal are names drawn on the arrows; cm names the marked point)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };

// Pure model, exported for script checks.
export function tossModel({ masses = [1, 3], points, v0 = 7, theta = 55, omega = 4, phi0 = 0, g = 9.8, y0 = 0, explode = null, kick = 1 } = {}) {
  const n = masses.length;
  points = points ?? masses.map((_, i) => [(i - (n - 1) / 2) * 1.2, 0]);
  const M = masses.reduce((a, b) => a + b, 0);
  const cb = [0, 1].map(k => points.reduce((a, p, i) => a + masses[i] * p[k], 0) / M);    // CM in the body frame
  const rel = points.map(p => [p[0] - cb[0], p[1] - cb[1]]);
  const th = theta * Math.PI / 180, vx = v0 * Math.cos(th), vy = v0 * Math.sin(th);
  const tf = (vy + Math.sqrt(vy * vy + 2 * g * y0)) / g;
  const R = t => [vx * t, y0 + vy * t - g * t * t / 2], V = t => [vx, vy - g * t];
  const tx = explode ? Math.min(explode.t, tf) : Infinity;
  const rot = (t, r) => { const a = phi0 * Math.PI / 180 + omega * t, c = Math.cos(a), sn = Math.sin(a); return [c * r[0] - sn * r[1], sn * r[0] + c * r[1]]; };
  const rotV = (t, r) => { const q = rot(t, r); return [-omega * q[1], omega * q[0]]; };
  function part(i, t) {
    if (t <= tx) {
      const q = rot(t, rel[i]), w = rotV(t, rel[i]), c = R(t), vc = V(t);
      return { x: c[0] + q[0], y: c[1] + q[1], vx: vc[0] + w[0], vy: vc[1] + w[1], free: false };
    }
    const q = rot(tx, rel[i]), w = rotV(tx, rel[i]), c = R(tx), vc = V(tx), d = t - tx;
    const ux = vc[0] + w[0] + kick * q[0], uy = vc[1] + w[1] + kick * q[1];
    return { x: c[0] + q[0] + ux * d, y: c[1] + q[1] + uy * d - g * d * d / 2, vx: ux, vy: uy - g * d, free: true };
  }
  const at = t => ({ t, R: R(t), V: V(t), parts: masses.map((_, i) => part(i, t)), phi: phi0 * Math.PI / 180 + omega * t, broken: t > tx });
  return { masses, points, rel, cb, M, g, tf, tx, omega, at, rot, vx, vy };
}

export function cmToss(el, cfg) {
  const Lb = { t: 'Time', R: 'CM position R', V: 'CM velocity V', P: 'Momentum P = MV', W: 'Weight Mg', M: 'Total mass M', off: 'Probe minus CM', omega: 'Spin',
    vx: 'V_x', vy: 'V_y', v0: 'Launch speed', theta: 'Launch angle', m1: 'Mass 1', m2: 'Mass 2', m3: 'Mass 3', probe: 'Probe position', kick: 'Explosion kick', time: 'time',
    play: 'Play', reset: 'Reset', scene: 'Tossed body and its center of mass', cm: 'CM', momentum: 'P', weight: 'Mg', internal: 'F', ...(cfg.labels ?? {}) };
  const show = { ground: true, body: true, cm: true, cmPath: true, paths: true, strobe: false, momentum: true, weight: true, internal: false, readouts: true, labels: true,
    replay: true, timeSlider: false, probePath: false, ...(cfg.show ?? {}) };
  const U = { mass: 'kg', length: 'm', speed: 'm/s', time: 's', ...(cfg.units ?? {}) };
  const R0 = { v0: [2, 10, 0.5], theta: [20, 80, 5], omega: [0, 12, 0.5], m1: [0.5, 5, 0.5], m2: [0.5, 5, 0.5], m3: [0.5, 5, 0.5], probe: [0, 1, 0.01], kick: [0, 2, 0.1], ...(cfg.ranges ?? {}) };
  const reads = cfg.readouts ?? ['t', 'R', 'V', 'P'];
  const sliderKeys = cfg.sliders ?? [];
  const presets = cfg.presets ?? [];
  const nP = (cfg.masses ?? [1, 3]).length;
  const init = { v0: cfg.v0 ?? 7, theta: cfg.theta ?? 55, omega: cfg.omega ?? 4, kick: cfg.explode?.kick ?? 1, probe: cfg.probe ?? 0.5,
    m1: (cfg.masses ?? [1, 3])[0], m2: (cfg.masses ?? [1, 3])[1], m3: (cfg.masses ?? [1, 3])[2] ?? 1 };
  const g = cfg.g ?? 9.8, y0 = cfg.y0 ?? 0, duration = cfg.duration ?? 4000;
  const hasProbe = cfg.probe != null || sliderKeys.includes('probe');
  const st = { ...init };
  const build = q => tossModel({ masses: [q.m1, q.m2, q.m3].slice(0, nP), points: cfg.points, v0: q.v0, theta: q.theta, omega: q.omega, phi0: cfg.phi0 ?? 0, g, y0,
    explode: cfg.explode ? { t: cfg.explode.t } : null, kick: q.kick });

  // Fixed view from every case the controls can reach.
  const mkCases = () => {
    let corners = [{ ...init }];
    for (const k of sliderKeys) if (k !== 'probe') corners = corners.flatMap(c => [R0[k][0], R0[k][1]].map(v => ({ ...c, [k]: v })));
    return [init, ...presets.map(p => ({ ...init, ...p })), ...corners];
  };
  let xmin = 0, xmax = 1e-6, ymin = 0, ymax = 1e-6, tmax = 1e-6, Pmax = 1e-6, Mmax = 1e-6, Fmax = 1e-6;
  for (const c of mkCases()) {
    const m = build(c); tmax = Math.max(tmax, m.tf); Pmax = Math.max(Pmax, m.M * Math.hypot(m.vx, m.vy)); Mmax = Math.max(Mmax, m.M);
    m.rel.forEach((r, i) => { Fmax = Math.max(Fmax, m.masses[i] * m.omega * m.omega * Math.hypot(r[0], r[1])); });
    for (let i = 0; i <= 60; i++) for (const p of m.at(m.tf * i / 60).parts) { xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x); ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y); }
  }
  if (cfg.tmax) tmax = cfg.tmax;

  const W = 360, SH = 220, mg = 14, topPad = show.momentum || show.weight ? 18 : 4;
  const sc = Math.min((W - 2 * mg) / (xmax - xmin), (SH - mg - topPad - 8) / (ymax - ymin));
  const X = x => mg + (x - xmin) * sc, Y = y => SH - mg - (y - ymin) * sc;
  const svg = s('svg', { viewBox: `0 0 ${W} ${SH}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.scene });
  const col = { body: 'var(--basis)', cm: 'var(--covec)', path: 'var(--muted)', P: 'var(--vec)', W: 'var(--covec)', F: 'var(--ink)', probe: 'var(--ink)' };
  const muted = 'var(--muted)';
  const partCols = ['var(--basis)', 'var(--vec)', 'var(--covec)'];
  let tNow = 0, raf = 0, t0 = 0, running = false;

  function arrow(g0, x1, y1, x2, y2, color, txt, tx, ty, anchor, w = 3) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); if (L < 3) return;
    const ux = dx / L, uy = dy / L;
    g0.append(s('line', { x1, y1, x2: x2 - ux * 6, y2: y2 - uy * 6, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round' }),
      s('polygon', { fill: color, points: `${x2},${y2} ${x2 - ux * 8 - uy * 4},${y2 - uy * 8 + ux * 4} ${x2 - ux * 8 + uy * 4},${y2 - uy * 8 - ux * 4}` }));
    if (show.labels && txt) g0.append(s('text', { x: tx, y: ty, 'font-size': 10.5, 'text-anchor': anchor, fill: color, 'font-weight': 650 }, txt));
  }
  const rodPairs = n => cfg.rods === 'none' ? [] : cfg.rods === 'all' ? [...Array(n).keys()].flatMap(i => [...Array(n).keys()].filter(j => j > i).map(j => [i, j])) : [...Array(n - 1).keys()].map(i => [i, i + 1]);
  const radius = m => 4 + 4.5 * Math.cbrt(m / Math.max(Mmax / nP, 1e-9)) * 0.7;

  function drawBody(g0, f, M, opacity = 1, strobe = false) {
    const ps = f.parts, rods = f.broken ? [] : rodPairs(ps.length);
    for (const [i, j] of rods) g0.append(s('line', { x1: X(ps[i].x), y1: Y(ps[i].y), x2: X(ps[j].x), y2: Y(ps[j].y), stroke: muted, 'stroke-width': strobe ? 1.5 : 3, 'stroke-linecap': 'round', opacity }));
    ps.forEach((p, i) => g0.append(s('circle', { cx: X(p.x), cy: Y(p.y), r: radius(M.masses[i]), fill: partCols[i % 3], opacity: strobe ? opacity : 0.95, stroke: 'var(--bg, #fff)', 'stroke-width': strobe ? 0 : 1.2 })));
  }

  function paint() {
    const M = build(st), tE = Math.min(tNow, M.tf), f = M.at(tE), Mt = M.M;
    const probeAt = (ff, q) => {   // probe ring on the line through the first and last particle (current positions; before explosion)
      const a = ff.parts[0], b = ff.parts[ff.parts.length - 1];
      return [a.x + (b.x - a.x) * q, a.y + (b.y - a.y) * q];
    };
    if (show.ground) svg.append(s('line', { x1: 6, x2: W - 6, y1: Y(0), y2: Y(0), stroke: muted, 'stroke-width': 3 }));
    const sg = s('g');
    const steps = 80;
    if (show.cmPath) {
      const d = Array.from({ length: steps + 1 }, (_, i) => { const r = M.at(M.tf * i / steps).R; return `${i ? 'L' : 'M'}${X(r[0]).toFixed(1)} ${Y(r[1]).toFixed(1)}`; }).join(' ');
      sg.append(s('path', { d, fill: 'none', stroke: col.cm, 'stroke-width': 1.6, 'stroke-dasharray': '5 4', opacity: 0.8 }));
    }
    if (show.strobe) for (let k = 1; k <= 8; k++) { const t = M.tf * k / 9; if (t < tE) drawBody(sg, M.at(t), M, 0.28, true); }
    if (show.paths) {
      const m = Math.max(2, Math.round(steps * tE / M.tf) + 1);
      f.parts.forEach((_, i) => {
        const d = Array.from({ length: m }, (_, k) => { const p = M.at(tE * k / (m - 1)).parts[i]; return `${k ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`; }).join(' ');
        sg.append(s('path', { d, fill: 'none', stroke: partCols[i % 3], 'stroke-width': 1.6, opacity: 0.75 }));
      });
    }
    if (hasProbe && show.probePath && st.probe != null) {
      const m = Math.max(2, Math.round(steps * tE / M.tf) + 1);
      const d = Array.from({ length: m }, (_, k) => { const p = probeAt(M.at(tE * k / (m - 1)), st.probe); return `${k ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`; }).join(' ');
      sg.append(s('path', { d, fill: 'none', stroke: col.probe, 'stroke-width': 2, opacity: 0.9 }));
    }
    svg.append(sg);
    if (show.body) drawBody(svg, f, M);
    const cx = X(f.R[0]), cy = Y(f.R[1]);
    if (hasProbe && !f.broken) {
      const p = probeAt(f, st.probe);
      svg.append(s('circle', { cx: X(p[0]), cy: Y(p[1]), r: 6.5, fill: 'none', stroke: col.probe, 'stroke-width': 2 }));
    }
    if (show.cm) {
      const c = s('g');
      c.append(s('line', { x1: cx - 6, x2: cx + 6, y1: cy, y2: cy, stroke: col.cm, 'stroke-width': 2.6 }), s('line', { x1: cx, x2: cx, y1: cy - 6, y2: cy + 6, stroke: col.cm, 'stroke-width': 2.6 }),
        s('circle', { cx, cy, r: 8.5, fill: 'none', stroke: col.cm, 'stroke-width': 1.6 }));
      if (show.labels && Lb.cm) c.append(s('text', { x: cx + 12, y: cy - 9, 'font-size': 10.5, fill: col.cm, 'font-weight': 650 }, Lb.cm));
      svg.append(c);
    }
    if (show.internal && !f.broken) {
      const g1 = s('g');
      f.parts.forEach((p, i) => {
        const dx = f.R[0] - p.x, dy = f.R[1] - p.y, d = Math.hypot(dx, dy) || 1, L = 38 * M.masses[i] * st.omega * st.omega * d / Fmax;
        arrow(g1, X(p.x), Y(p.y), X(p.x) + dx / d * L, Y(p.y) - dy / d * L, col.F, i === 0 ? Lb.internal : '', X(p.x) + dx / d * L + 5, Y(p.y) - dy / d * L - 4, 'start', 2.2);
      });
      svg.append(g1);
    }
    if (show.momentum || show.weight) {
      const ga = s('g');
      if (show.momentum) { const k = 46 / Pmax; arrow(ga, cx, cy, cx + Mt * f.V[0] * k, cy - Mt * f.V[1] * k, col.P, Lb.momentum, cx + Mt * f.V[0] * k + 6, cy - Mt * f.V[1] * k - 2, 'start'); }
      if (show.weight) { const k = 36 / (Mmax * g); arrow(ga, cx, cy, cx, cy + Mt * g * k, col.W, Lb.weight, cx + 6, cy + Mt * g * k + 4, 'start'); }
      svg.append(ga);
    }
    const lastP = f.parts[f.parts.length - 1], firstP = f.parts[0];
    const off = hasProbe ? (() => { const p = probeAt(f, st.probe); return Math.hypot(p[0] - f.R[0], p[1] - f.R[1]) * Math.sign((p[0] - f.R[0]) * (lastP.x - firstP.x) + (p[1] - f.R[1]) * (lastP.y - firstP.y) || 1); })() : 0;
    const val = { t: `${num(tE, 2)} ${U.time}`, R: `(${num(f.R[0], 1)}, ${num(f.R[1], 1)}) ${U.length}`, V: `(${num(f.V[0], 1)}, ${num(f.V[1], 1)}) ${U.speed}`,
      P: `(${num(Mt * f.V[0], 1)}, ${num(Mt * f.V[1], 1)}) ${U.mass} ${U.speed}`, W: `${num(Mt * g, 1)} ${U.mass} ${U.length}/${U.time}²`, M: `${num(Mt, 1)} ${U.mass}`,
      off: `${num(off, 2)} ${U.length}`, omega: `${num(st.omega, 1)} rad/${U.time}`, vx: `${num(f.V[0], 2)} ${U.speed}`, vy: `${num(f.V[1], 2)} ${U.speed}` };
    for (const k of reads) if (rd[k]) rd[k].textContent = val[k];
    for (const [k, inp] of Object.entries(inps)) { inp.value = st[k]; vals[k].textContent = fmt(k); }
    if (timeInp) timeInp.value = Math.round(tNow / tmax * 1000);
  }
  const fmt = k => k === 'v0' ? `${num(st.v0, 1)} ${U.speed}` : k === 'theta' ? `${num(st.theta, 0)}°` : k === 'omega' ? `${num(st.omega, 1)} rad/${U.time}` : k === 'probe' ? num(st.probe, 2)
    : k === 'kick' ? num(st.kick, 1) : `${num(st[k], 1)} ${U.mass}`;

  const rd = {}, inps = {}, vals = {};
  let timeInp = null;
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
    timeInp.addEventListener('input', () => { cancelAnimationFrame(raf); running = false; tNow = +timeInp.value / 1000 * tmax; paintAll(); });
  }
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', timeInp ? h('div', { class: 'fs-sliders' }, h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, Lb.time), timeInp, h('span'))) : '',
    sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', btns);

  function paintAll() { svg.replaceChildren(); paint(); }
  function play() {
    cancelAnimationFrame(raf); tNow = 0; t0 = performance.now(); running = true; paintAll();
    const tick = now => {
      if (!el.isConnected) return;
      tNow = Math.max(0, Math.min(tmax, (now - t0) / duration * tmax)); paintAll();
      if (tNow < tmax) raf = requestAnimationFrame(tick); else running = false;
    };
    raf = requestAnimationFrame(tick);
  }
  play();
}
