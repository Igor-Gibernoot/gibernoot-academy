// incline-block
//
// A block of mass m is released from rest on a slope of angle theta (degrees) with static coefficient mu_s and kinetic coefficient mu_k.
// The weight m g splits into a part along the slope, m g sin(theta) (down the slope), and a part across it, m g cos(theta) (into the slope).
// The surface answers with the normal force N = m g cos(theta) (across, out of the slope) and friction (along, up the slope).
//   it slides only if tan(theta) > mu_s, i.e. the critical coefficient is mu_crit = tan(theta)
//   at rest:  friction = m g sin(theta) (static, it just balances the pull; it never exceeds mu_s N), net force 0
//   sliding:  friction = mu_k N,  a = g (sin(theta) - mu_k cos(theta)),  v = a t,  x = a t^2 / 2   (x = distance slid down the slope)
// If mu_k > mu_s is asked for, mu_k is raised or lowered so that mu_k <= mu_s always holds (kinetic friction is not larger than static).
// Fully general: no course text is hard-coded; every word comes from the config.
//
//   angle: 30, mus: 0.5, muk: 0.2, mass: 1     start values (angle in degrees, coefficients unitless, mass in massUnit)
//   g: 9.8                                     gravity (m/s^2)
//   tmax: 2                                    time window shown (s)
//   sliders: ['angle','mus','muk']             which sliders to show, in order (any of angle, mus, muk); default none
//   ranges: { angle: [0,60,1], mus: [0,1.2,0.05], muk: [0,1.2,0.05] }   [min, max, step]; the largest angle fixes the plot axes
//   length: 5                                  slope length drawn (m); a block that slides further stops at the foot of the drawing
//   duration: 3000                             animation time of one run (ms), whatever the real time
//   units: { force: 'N', accel: 'm/s²', speed: 'm/s', distance: 'm', mass: 'kg' }
//   show: { weight, normal, friction, net, along, across, aPlot, vPlot, xPlot, readouts, labels, replay, grid, cursor, arc }
//       all default true except grid. weight, normal, friction, net = the four force arrows; along and across = the two dashed components
//       of the weight (m g sin(theta) down the slope, m g cos(theta) into it); aPlot, vPlot, xPlot = the plots of a(t), v(t), x(t)
//       (all false = no plots); cursor = time marker and dots on the plots; arc = the angle arc at the foot of the slope;
//       labels = letters on the arrows and the axis names; grid = plot grid; readouts = the readout cells; replay = the Release button.
//   readouts: ['mucrit','state','a']           any of mucrit, state, a, v, x, friction, normal, net (a, v, x at the time marker); default mucrit, state, a
//   presets: [{ label, angle, mus, muk }]      buttons; only the fields given change
//   labels: { mucrit, state, slides, holds, a, v, x, friction, normal, net, weight, along, across, accel, speed, distance, time,
//             angle, mus, muk, release, reset, scene,  fFric, fNormal, fNet, fWeight, fAlong, fAcross }
//       (the first group names readouts, plots and sliders; the f... ones are the letters drawn on the arrows)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };
const niceUp = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map(m => m * p).find(x => x >= v - 1e-9); };

// Pure model, exported for script checks. angle in degrees. Forces are per unit weight too (fN = N/(m g) etc.).
export function inclineModel({ angle = 30, mus = 0.5, muk = 0.2, mass = 1, g = 9.8 } = {}) {
  const th = angle * Math.PI / 180, sn = Math.sin(th), cs = Math.cos(th), mukEff = Math.min(muk, mus);
  const mucrit = Math.tan(th), slides = mucrit > mus + 1e-12;
  const W = mass * g, along = W * sn, across = W * cs, N = across;
  const fric = slides ? mukEff * N : along;                 // static friction balances the pull exactly
  const a = slides ? g * (sn - mukEff * cs) : 0;
  const net = mass * a;
  const at = t => ({ t, a, v: a * t, x: 0.5 * a * t * t });
  return { th, mucrit, slides, W, along, across, N, fric, a, net, mukEff, at };
}

export function inclineBlock(el, cfg) {
  const Lb = { mucrit: 'Critical μ = tan θ', state: 'Block', slides: 'slides', holds: 'stays at rest', a: 'Acceleration', v: 'Speed', x: 'Distance slid', friction: 'Friction', normal: 'Normal force', net: 'Net force',
    accel: 'a', speed: 'v', distance: 'x', time: 'time', angle: 'Angle θ', mus: 'Static μ_s', muk: 'Kinetic μ_k', release: 'Release', reset: 'Reset', scene: 'Block on a slope',
    fFric: 'f', fNormal: 'N', fNet: 'F_net', fWeight: 'mg', fAlong: 'mg sin θ', fAcross: 'mg cos θ', ...(cfg.labels ?? {}) };
  const show = { weight: true, normal: true, friction: true, net: true, along: true, across: true, aPlot: true, vPlot: true, xPlot: true, readouts: true, labels: true, replay: true, grid: false, cursor: true, arc: true, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['mucrit', 'state', 'a'];
  const U = { force: 'N', accel: 'm/s²', speed: 'm/s', distance: 'm', mass: 'kg', ...(cfg.units ?? {}) };
  const R = { angle: [0, 60, 1], mus: [0, 1.2, 0.05], muk: [0, 1.2, 0.05], ...(cfg.ranges ?? {}) };
  const g = cfg.g ?? 9.8, tmax = cfg.tmax ?? 2, duration = cfg.duration ?? 3000, length = cfg.length ?? 5, mass = cfg.mass ?? 1;
  const init = { angle: cfg.angle ?? 30, mus: cfg.mus ?? 0.5, muk: cfg.muk ?? 0.2 };
  const st = { ...init };
  const sliderKeys = cfg.sliders ?? [];
  const model = q => inclineModel({ ...q, mass, g });

  // Fixed axes from the largest angle the controls can reach (kinetic friction 0 gives the largest a), so curves never rescale.
  const cases = [init, ...(cfg.presets ?? []).map(p => ({ ...init, ...p }))];
  const angMax = Math.min(89, Math.max(...cases.map(q => q.angle), ...(sliderKeys.includes('angle') ? [R.angle[1]] : [0])));
  const aMax = niceUp(Math.max(0.5, g * Math.sin(angMax * Math.PI / 180)));
  const vMax = niceUp(aMax * tmax), xMax = niceUp(0.5 * aMax * tmax * tmax);

  // geometry (px)
  const W = 360, X0 = 30, LR = 250, PL = 40, PR = 340, PH = 56;
  const rise = LR * Math.sin(angMax * Math.PI / 180), SH = Math.round(rise + 52);
  const plots = [['aPlot', 'a'], ['vPlot', 'v'], ['xPlot', 'x']].filter(([k]) => show[k]);
  const H = SH + plots.length * (PH + 40) + 4;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.scene });
  let tNow = 0, raf = 0, t0 = 0;

  const col = { weight: 'var(--muted)', normal: 'var(--basis)', friction: 'var(--covec)', net: 'var(--vec)' };
  const xT = t => PL + t / tmax * (PR - PL);

  function arrow(g0, x1, y1, x2, y2, color, txt, dash, dx = 0, dy = 0) {
    const ddx = x2 - x1, ddy = y2 - y1, L = Math.hypot(ddx, ddy); if (L < 3) return;
    const ux = ddx / L, uy = ddy / L, w = dash ? 2 : 3;
    g0.append(s('line', { x1, y1, x2: x2 - ux * 5, y2: y2 - uy * 5, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', ...(dash ? { 'stroke-dasharray': '4 3' } : {}) }),
      s('polygon', { fill: color, points: `${x2},${y2} ${x2 - ux * 8 - uy * 4},${y2 - uy * 8 + ux * 4} ${x2 - ux * 8 + uy * 4},${y2 - uy * 8 - ux * 4}` }));
    if (show.labels && txt) g0.append(s('text', { x: x2 + dx, y: y2 + dy, 'font-size': 10, 'text-anchor': dx < 0 ? 'end' : dx > 0 ? 'start' : 'middle', fill: color, 'font-weight': 650 }, txt));
  }

  function plotAxes(top, ymax, ylab, unit) {
    const pg = s('g'), bot = top + PH;
    if (show.grid) for (const f of [0.25, 0.5, 0.75, 1]) pg.append(s('line', { x1: PL, x2: PR, y1: bot - f * PH, y2: bot - f * PH, stroke: 'var(--line, #ccc)', 'stroke-width': 0.7 }));
    pg.append(s('line', { x1: PL, y1: top, x2: PL, y2: bot, stroke: 'var(--ink)', 'stroke-width': 1.2 }), s('line', { x1: PL, y1: bot, x2: PR, y2: bot, stroke: 'var(--ink)', 'stroke-width': 1.2 }),
      s('text', { x: PL - 4, y: top + 4, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, num(ymax, 1)), s('text', { x: PL - 4, y: bot + 3, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, '0'),
      s('text', { x: PR, y: bot + 11, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, `${num(tmax, 1)} s`));
    if (show.labels) pg.append(s('text', { x: PL + 3, y: top - 5, 'font-size': 9.5, fill: 'var(--muted)' }, `${ylab} (${unit})`), s('text', { x: (PL + PR) / 2, y: bot + 22, 'font-size': 9.5, 'text-anchor': 'middle', fill: 'var(--muted)' }, `${Lb.time} (s)`));
    return pg;
  }

  function paint() {
    const M = model(st), now = M.at(tNow), c = Math.cos(M.th), sn = Math.sin(M.th);
    const Y0 = SH - 22, P = d => [X0 + d * c, Y0 - d * sn], LRp = LR;
    const g0 = s('g');
    // slope: a filled triangle and its surface line
    const [ex, ey] = P(LRp);
    g0.append(s('polygon', { points: `${X0},${Y0} ${ex},${ey} ${ex},${Y0}`, fill: 'var(--line, #ccc)', opacity: 0.35 }),
      s('line', { x1: X0 - 8, y1: Y0, x2: W - 10, y2: Y0, stroke: 'var(--muted)', 'stroke-width': 2 }),
      s('line', { x1: X0, y1: Y0, x2: ex, y2: ey, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    if (show.arc && angMax > 0) {
      const r = 34, a1 = [X0 + r, Y0], a2 = [X0 + r * c, Y0 - r * sn];
      g0.append(s('path', { d: `M${a1[0]} ${a1[1]} A${r} ${r} 0 0 0 ${a2[0].toFixed(1)} ${a2[1].toFixed(1)}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.2 }));
      if (show.labels) g0.append(s('text', { x: X0 + r + 6, y: Y0 - 4, 'font-size': 10, fill: 'var(--ink)' }, `${num(st.angle, 0)}°`));
    }
    // block: starts 70% up the drawn slope, slides toward the foot
    const bw = 48, bh = 28, s0 = LRp * 0.72, slide = Math.min(now.x / length * LRp * 0.62, s0 - bw * 0.6);
    const [bx, by] = P(s0 - slide);
    const blk = s('g', { transform: `translate(${bx.toFixed(1)} ${by.toFixed(1)}) rotate(${-st.angle})` });
    blk.append(s('rect', { x: -bw / 2, y: -bh, width: bw, height: bh, rx: 2, fill: 'var(--vec)', opacity: 0.2, stroke: 'var(--vec)', 'stroke-width': 1.5 }));
    g0.append(blk);
    // arrows (screen coordinates; y points down). Unit vectors: down the slope dn, out of the slope nrm.
    const dn = [-c, sn], nrm = [-sn, -c], Cx = bx + nrm[0] * bh / 2, Cy = by + nrm[1] * bh / 2;
    const k = 80, f = v => v / M.W;               // length of m g on screen is 80 px
    const A = (px, py, vx, vy, len, color, txt, dash, dx, dy) => arrow(g0, px, py, px + vx * len * k, py + vy * len * k, color, txt, dash, dx, dy);
    if (show.along) A(Cx, Cy, dn[0], dn[1], f(M.along), col.weight, Lb.fAlong, true, -4, 12);
    if (show.across) A(Cx, Cy, -nrm[0], -nrm[1], f(M.across), col.weight, Lb.fAcross, true, 6, 10);
    if (show.weight) A(Cx, Cy, 0, 1, 1, col.weight, Lb.fWeight, false, 6, 10);
    if (show.normal) A(Cx, Cy, nrm[0], nrm[1], f(M.N), col.normal, Lb.fNormal, false, -5, -2);
    if (show.friction) A(bx + nrm[0] * 2, by + nrm[1] * 2 + 0, -dn[0], -dn[1], f(M.fric), col.friction, Lb.fFric, false, 4, -6);
    if (show.net) A(Cx + nrm[0] * (bh / 2 + 6), Cy + nrm[1] * (bh / 2 + 6), dn[0], dn[1], f(M.net), col.net, Lb.fNet, false, -4, -6);
    svg.append(g0);

    let y = SH;
    for (const [key, q] of plots) {
      const top = y + 16, ymax = q === 'a' ? aMax : q === 'v' ? vMax : xMax, unit = q === 'a' ? U.accel : q === 'v' ? U.speed : U.distance;
      const lab = q === 'a' ? Lb.accel : q === 'v' ? Lb.speed : Lb.distance, color = q === 'a' ? col.net : q === 'v' ? 'var(--basis)' : 'var(--vec)';
      const pg = plotAxes(top, ymax, lab, unit), yv = v => top + PH - Math.max(0, Math.min(1, v / ymax)) * PH;
      const pts = []; for (let i = 0; i <= 60; i++) pts.push(`${i ? 'L' : 'M'}${xT(tmax * i / 60).toFixed(1)} ${yv(M.at(tmax * i / 60)[q]).toFixed(1)}`);
      pg.append(s('path', { d: pts.join(' '), fill: 'none', stroke: color, 'stroke-width': 2.5 }));
      if (show.cursor) pg.append(s('line', { x1: xT(tNow), x2: xT(tNow), y1: top, y2: top + PH, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }),
        s('circle', { cx: xT(tNow), cy: yv(now[q]), r: 4.5, fill: color, stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
      svg.append(pg); y += PH + 40;
    }

    const val = { mucrit: num(M.mucrit, 2), state: M.slides ? Lb.slides : Lb.holds, a: `${num(now.a, 2)} ${U.accel}`, v: `${num(now.v, 2)} ${U.speed}`, x: `${num(now.x, 2)} ${U.distance}`,
      friction: `${num(M.fric, 2)} ${U.force}`, normal: `${num(M.N, 2)} ${U.force}`, net: `${num(M.net, 2)} ${U.force}` };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    for (const [key, inp] of Object.entries(inps)) { inp.value = st[key]; vals[key].textContent = key === 'angle' ? `${num(st.angle, 0)}°` : num(st[key], 2); }
  }

  // controls
  const rd = {}, inps = {}, vals = {};
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const sliderEls = sliderKeys.map(k => {
    const [lo, hi, step] = R[k];
    const inp = inps[k] = h('input', { type: 'range', min: lo, max: hi, step, value: st[k], 'aria-label': Lb[k] });
    inp.addEventListener('input', () => {
      st[k] = +inp.value;
      if (st.muk > st.mus) { if (k === 'mus') st.muk = st.mus; else st.mus = st.muk; }   // keep mu_k <= mu_s
      play();
    });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb[k])), inp, vals[k] = h('span', { class: 'fs-num' }));
  });
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const apply = p => { for (const k of ['angle', 'mus', 'muk']) if (p[k] != null) st[k] = p[k]; if (st.muk > st.mus) st.muk = st.mus; play(); };
  const btns = h('div', { class: 'wbtns' }, show.replay ? btn(Lb.release, () => play()) : '', btn(Lb.reset, () => { Object.assign(st, init); play(); }), (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', btns);

  function redraw() { svg.replaceChildren(); paint(); }
  function play() {
    cancelAnimationFrame(raf); tNow = 0; t0 = performance.now(); redraw();
    const tick = now => {
      if (!el.isConnected) return;
      tNow = Math.max(0, Math.min(tmax, (now - t0) / duration * tmax)); redraw();
      if (tNow < tmax) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  play();
}
