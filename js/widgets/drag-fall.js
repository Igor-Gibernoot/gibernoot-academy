// drag-fall
//
// A body of mass m falls (or is thrown vertically) with weight m g and an air drag that opposes the velocity.
// Down is positive: v is the downward velocity (negative = moving up), y the distance fallen below the start (negative = above it).
// The drag magnitude follows Taylor's split f(v) = f_lin + f_quad, f_lin = b v, f_quad = c v^2, and always points against the velocity:
//   m dv/dt = m g - b v - c v |v|      (terms switched on by the law)
//   law 'none'    f = 0           v = v0 + g t, no terminal speed
//   law 'linear'  f = b v         v_t = m g / b,       v = v_t + (v0 - v_t) e^(-t/tau), tau = m / b
//   law 'quad'    f = c v^2       v_t = sqrt(m g / c), v = v_t tanh(g t / v_t + artanh(v0 / v_t)) for |v0| < v_t
//   law 'both'    f = b v + c v^2 v_t = (-b + sqrt(b^2 + 4 c m g)) / (2 c)
// The path is integrated by RK4 (dt = 0.002 s, matches the formulas above to better than 1e-6 relative; see docs/widgets/drag-fall.md).
// Fully general: no course text is hard-coded; every word comes from the config.
//
//   law: 'linear'                  start law (none, linear, quad, both)
//   laws: ['none','linear','quad'] buttons offered (subset/order of none, linear, quad, both); one entry = no switch
//   m: 1, b: 1, c: 0.1, v0: 0      start values (kg, kg/s, kg/m, m/s); g: 9.8
//   tmax: 6                        time window shown (s); duration: 4000 (ms of one run)
//   sliders: ['b','c','v0']        any of m, b, c, v0 (order kept); default none
//   ranges: { m:[0.1,5,0.1], b:[0,5,0.1], c:[0,1,0.01], v0:[-20,30,1] }   the extremes fix the plot axes
//   axes: { v:[lo,hi], y:[lo,hi] } optional fixed axes (default from the ranges, presets and g, so curves never rescale)
//   units: { force:'N', speed:'m/s', distance:'m', time:'s', mass:'kg', b:'kg/s', c:'kg/m' }
//   show: { scene, weight, drag, net, vPlot, yPlot, terminal, freefall, cursor, labels, grid, readouts, laws, replay }
//       all default true except net, freefall, grid. scene = the falling ball with its arrows; weight, drag, net = the three force arrows;
//       vPlot, yPlot = the plots of v(t) and y(t) (both false = no plots); terminal = dashed line at the terminal speed v_t on the v plot
//       (only for laws that have one); freefall = grey dashed curve of the drag-free fall on the plots; cursor = time marker and dots;
//       labels = letters on the arrows and the axis names; grid = plot grid; readouts = the cells below; laws = the law buttons; replay = Release.
//   readouts: ['speed','drag','terminal']   any of speed, drag, lin, quad, ratio, terminal, accel, y, time, tau
//       speed v, drag = f(v) of the current law, lin = b v, quad = c v^2 (always from b, c, as numbers), ratio = f_quad / f_lin = c v / b,
//       terminal = v_t of the current law, accel = dv/dt, y = distance fallen, time = t, tau = m / b. speed, drag, accel, y, time at the marker.
//   presets: [{ label, law, m, b, c, v0 }]   buttons; only the fields given change; a preset re-runs the fall
//   labels: { speed, drag, lin, quad, ratio, terminal, accel, y, time, tau, none, linear, quad, both, m, b, c, v0, release, reset, scene,
//             fWeight, fDrag, fNet, vAxis, yAxis, tAxis, vt, noTerminal }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };
const niceUp = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map(m => m * p).find(x => x >= v - 1e-9); };

// Pure model, exported for script checks. Down positive. Returns the terminal speed (null for 'none'), the drag force at v, and at(t).
export function dragFallModel({ law = 'linear', m = 1, b = 1, c = 0.1, g = 9.8, v0 = 0, tmax = 6, dt = 0.002 } = {}) {
  const lin = law === 'linear' || law === 'both' ? b : 0, quad = law === 'quad' || law === 'both' ? c : 0;
  const drag = v => lin * v + quad * v * Math.abs(v);
  const acc = v => g - drag(v) / m;
  let vt = null;
  if (law !== 'none') {
    if (quad > 0) vt = lin > 0 ? (-lin + Math.sqrt(lin * lin + 4 * quad * m * g)) / (2 * quad) : Math.sqrt(m * g / quad);
    else if (lin > 0) vt = m * g / lin;
  }
  const n = Math.ceil(tmax / dt), ys = new Float64Array(n + 1), vs = new Float64Array(n + 1);
  let y = 0, v = v0; ys[0] = y; vs[0] = v;
  for (let i = 0; i < n; i++) {
    const k1 = acc(v), k2 = acc(v + dt / 2 * k1), k3 = acc(v + dt / 2 * k2), k4 = acc(v + dt * k3);
    const w1 = v, w2 = v + dt / 2 * k1, w3 = v + dt / 2 * k2, w4 = v + dt * k3;
    y += dt / 6 * (w1 + 2 * w2 + 2 * w3 + w4); v += dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
    ys[i + 1] = y; vs[i + 1] = v;
  }
  const at = t => {
    const f = Math.max(0, Math.min(n, t / dt)), i = Math.min(n - 1, Math.floor(f)), u = f - i;
    const vv = vs[i] + (vs[i + 1] - vs[i]) * u;
    return { t, v: vv, y: ys[i] + (ys[i + 1] - ys[i]) * u, a: acc(vv), f: drag(vv) };
  };
  return { vt, drag, acc, at, tau: lin > 0 ? m / lin : null };
}

export function dragFall(el, cfg) {
  const Lb = { speed: 'Speed v', drag: 'Drag f', lin: 'Linear term', quad: 'Quadratic term', ratio: 'f_quad / f_lin', terminal: 'Terminal speed', accel: 'Acceleration', y: 'Distance fallen', time: 'Time', tau: 'm / b',
    none: 'No drag', linear: 'Linear', quad: 'Quadratic', both: 'Both', m: 'Mass m', b: 'b', c: 'c', v0: 'Initial speed v₀', release: 'Release', reset: 'Reset', scene: 'A falling body',
    fWeight: 'mg', fDrag: 'f', fNet: 'F', vAxis: 'v', yAxis: 'y', tAxis: 'time', vt: 'v_t', noTerminal: 'none', ...(cfg.labels ?? {}) };
  const show = { scene: true, weight: true, drag: true, net: false, vPlot: true, yPlot: true, terminal: true, freefall: false, cursor: true, labels: true, grid: false, readouts: true, laws: true, replay: true, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['speed', 'drag', 'terminal'];
  const U = { force: 'N', speed: 'm/s', distance: 'm', time: 's', mass: 'kg', b: 'kg/s', c: 'kg/m', ...(cfg.units ?? {}) };
  const R = { m: [0.1, 5, 0.1], b: [0, 5, 0.1], c: [0, 1, 0.01], v0: [-20, 30, 1], ...(cfg.ranges ?? {}) };
  const g = cfg.g ?? 9.8, tmax = cfg.tmax ?? 6, duration = cfg.duration ?? 4000;
  const laws = cfg.laws ?? ['none', 'linear', 'quad'];
  const init = { law: cfg.law ?? laws[0], m: cfg.m ?? 1, b: cfg.b ?? 1, c: cfg.c ?? 0.1, v0: cfg.v0 ?? 0 };
  const st = { ...init };
  const sliderKeys = cfg.sliders ?? [];
  const model = q => dragFallModel({ ...q, g, tmax });
  const sFmt = { m: v => num(v, 1), b: v => num(v, 2), c: v => num(v, 3), v0: v => num(v, 0) };

  // Fixed axes: free fall bounds every curve from above, the largest upward throw gives the lowest point.
  const cases = [init, ...(cfg.presets ?? []).map(p => ({ ...init, ...p }))];
  const v0hi = Math.max(...cases.map(q => q.v0), sliderKeys.includes('v0') ? R.v0[1] : 0, 0);
  const v0lo = Math.min(...cases.map(q => q.v0), sliderKeys.includes('v0') ? R.v0[0] : 0, 0);
  const ax = {
    v: cfg.axes?.v ?? [v0lo < 0 ? -niceUp(-v0lo) : 0, niceUp(Math.max(1, v0hi + g * tmax))],
    y: cfg.axes?.y ?? [v0lo < 0 ? -niceUp(v0lo * v0lo / (2 * g)) : 0, niceUp(Math.max(1, v0hi * tmax + 0.5 * g * tmax * tmax))],
  };

  // geometry (px)
  const plots = [['vPlot', 'v'], ['yPlot', 'y']].filter(([k]) => show[k]);
  const W = 360, PH = 90, PL = show.scene ? 168 : 40, PR = 346, SW = 136;
  const H = Math.max(show.scene ? 250 : 0, plots.length * (PH + 40) + 8);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.scene });
  let tNow = 0, raf = 0, t0 = 0;
  const col = { weight: 'var(--muted)', drag: 'var(--covec)', net: 'var(--vec)', v: 'var(--basis)', y: 'var(--vec)' };
  const xT = t => PL + t / tmax * (PR - PL);
  const lawName = l => Lb[l] ?? l;

  function arrow(g0, x1, y1, x2, y2, color, txt, dx = 0, dy = 0) {
    const ddx = x2 - x1, ddy = y2 - y1, L = Math.hypot(ddx, ddy); if (L < 3) return;
    const ux = ddx / L, uy = ddy / L;
    g0.append(s('line', { x1, y1, x2: x2 - ux * 5, y2: y2 - uy * 5, stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }),
      s('polygon', { fill: color, points: `${x2},${y2} ${x2 - ux * 8 - uy * 4},${y2 - uy * 8 + ux * 4} ${x2 - ux * 8 + uy * 4},${y2 - uy * 8 - ux * 4}` }));
    if (show.labels && txt) g0.append(s('text', { x: x2 + dx, y: y2 + dy, 'font-size': 10, 'text-anchor': dx < 0 ? 'end' : dx > 0 ? 'start' : 'middle', fill: color, 'font-weight': 650 }, txt));
  }

  function plotAxes(top, [lo, hi], ylab, unit) {
    const pg = s('g'), bot = top + PH, yy = v => bot - (v - lo) / (hi - lo) * PH;
    if (show.grid) for (const f of [0.25, 0.5, 0.75, 1]) pg.append(s('line', { x1: PL, x2: PR, y1: bot - f * PH, y2: bot - f * PH, stroke: 'var(--line, #ccc)', 'stroke-width': 0.7 }));
    pg.append(s('line', { x1: PL, y1: top, x2: PL, y2: bot, stroke: 'var(--ink)', 'stroke-width': 1.2 }), s('line', { x1: PL, y1: yy(0), x2: PR, y2: yy(0), stroke: 'var(--ink)', 'stroke-width': 1.2 }),
      s('text', { x: PL - 4, y: top + 4, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, num(hi, 1)),
      s('text', { x: PL - 4, y: yy(0) + 3, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, '0'),
      s('text', { x: PR, y: bot + 11, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, `${num(tmax, 1)} ${U.time}`));
    if (lo < 0) pg.append(s('text', { x: PL - 4, y: bot + 3, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, num(lo, 1)));
    if (show.labels) pg.append(s('text', { x: PL + 3, y: top - 5, 'font-size': 9.5, fill: 'var(--muted)' }, `${ylab} (${unit})`), s('text', { x: (PL + PR) / 2, y: bot + 22, 'font-size': 9.5, 'text-anchor': 'middle', fill: 'var(--muted)' }, `${Lb.tAxis} (${U.time})`));
    return [pg, yy];
  }

  function paint() {
    const M = model(st), now = M.at(tNow), free = show.freefall ? model({ ...st, law: 'none' }) : null, Wt = st.m * g;
    if (show.scene) {
      const g0 = s('g'), cx = 64, top = 58, bot = H - 40, [ylo, yhi] = ax.y;
      const yy = y => top + (Math.max(ylo, Math.min(yhi, y)) - ylo) / (yhi - ylo) * (bot - top);
      g0.append(s('line', { x1: cx, y1: top - 14, x2: cx, y2: bot + 14, stroke: 'var(--line, #ccc)', 'stroke-width': 1.5, 'stroke-dasharray': '3 4' }),
        s('line', { x1: cx - 34, y1: yy(0), x2: cx + 34, y2: yy(0), stroke: 'var(--muted)', 'stroke-width': 1 }));
      const by = yy(now.y), k = 50;                                    // m g is 50 px; the drag arrow is clamped to 110 px
      const len = f => Math.sign(f) * Math.min(110, Math.abs(f) / Wt * k);
      g0.append(s('circle', { cx, cy: by, r: 8, fill: 'var(--vec)', opacity: 0.25, stroke: 'var(--vec)', 'stroke-width': 1.8 }));
      if (show.weight) arrow(g0, cx + 12, by, cx + 12, by + k, col.weight, Lb.fWeight, 4, 12);
      if (show.drag) arrow(g0, cx - 12, by, cx - 12, by - len(now.f), col.drag, Lb.fDrag, -4, -4);
      if (show.net) arrow(g0, cx, by, cx, by + len(Wt - now.f), col.net, Lb.fNet, 0, 12);
      svg.append(g0);
    }
    let y = 0;
    for (const [, q] of plots) {
      const top = y + 18, [pg, yv] = plotAxes(top, ax[q], q === 'v' ? Lb.vAxis : Lb.yAxis, q === 'v' ? U.speed : U.distance), clamp = v => Math.max(top - 3, Math.min(top + PH + 3, v));
      const curve = (mod, color, dash) => {
        const pts = []; for (let i = 0; i <= 80; i++) { const t = tmax * i / 80; pts.push(`${i ? 'L' : 'M'}${xT(t).toFixed(1)} ${clamp(yv(mod.at(t)[q])).toFixed(1)}`); }
        pg.append(s('path', { d: pts.join(' '), fill: 'none', stroke: color, 'stroke-width': dash ? 1.8 : 2.5, ...(dash ? { 'stroke-dasharray': '5 4' } : {}) }));
      };
      if (free) curve(free, 'var(--muted)', true);
      if (q === 'v' && show.terminal && M.vt != null && M.vt <= ax.v[1]) {
        pg.append(s('line', { x1: PL, x2: PR, y1: yv(M.vt), y2: yv(M.vt), stroke: col.drag, 'stroke-width': 1.3, 'stroke-dasharray': '6 3' }));
        if (show.labels) pg.append(s('text', { x: PR, y: yv(M.vt) - 4, 'font-size': 9.5, 'text-anchor': 'end', fill: col.drag, 'font-weight': 650 }, `${Lb.vt} = ${num(M.vt, 1)}`));
      }
      curve(M, col[q], false);
      if (show.cursor) pg.append(s('line', { x1: xT(tNow), x2: xT(tNow), y1: top, y2: top + PH, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }),
        s('circle', { cx: xT(tNow), cy: clamp(yv(now[q])), r: 4.5, fill: col[q], stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
      svg.append(pg); y += PH + 40;
    }
    const linT = st.b * now.v, quadT = st.c * now.v * Math.abs(now.v);
    const val = { speed: `${num(now.v, 2)} ${U.speed}`, drag: `${num(now.f, 2)} ${U.force}`, lin: `${num(linT, 2)} ${U.force}`, quad: `${num(quadT, 2)} ${U.force}`,
      ratio: Math.abs(linT) < 1e-9 ? (Math.abs(quadT) < 1e-9 ? '–' : '∞') : num(quadT / linT, 2), terminal: M.vt == null ? Lb.noTerminal : `${num(M.vt, 2)} ${U.speed}`,
      accel: `${num(now.a, 2)} ${U.speed}/${U.time}`, y: `${num(now.y, 2)} ${U.distance}`, time: `${num(tNow, 2)} ${U.time}`, tau: st.b > 0 ? `${num(st.m / st.b, 2)} ${U.time}` : '∞' };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    for (const [key, inp] of Object.entries(inps)) { inp.value = st[key]; vals[key].textContent = `${sFmt[key](st[key])} ${key === 'm' ? U.mass : key === 'v0' ? U.speed : key === 'b' ? U.b : U.c}`; }
    for (const [l, bt] of Object.entries(lawBtn)) bt.classList.toggle('on', st.law === l);
  }

  // controls
  const rd = {}, inps = {}, vals = {}, lawBtn = {};
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const sliderEls = sliderKeys.map(k => {
    const [lo, hi, step] = R[k];
    const inp = inps[k] = h('input', { type: 'range', min: lo, max: hi, step, value: st[k], 'aria-label': Lb[k] });
    inp.addEventListener('input', () => { st[k] = +inp.value; play(); });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb[k])), inp, vals[k] = h('span', { class: 'fs-num' }));
  });
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const apply = p => { for (const k of ['law', 'm', 'b', 'c', 'v0']) if (p[k] != null) st[k] = p[k]; play(); };
  const lawEls = show.laws && laws.length > 1 ? h('div', { class: 'wbtns' }, laws.map(l => { const bt = lawBtn[l] = btn(lawName(l), () => { st.law = l; play(); }); return bt; })) : '';
  const btns = h('div', { class: 'wbtns' }, show.replay ? btn(Lb.release, () => play()) : '', btn(Lb.reset, () => { Object.assign(st, init); play(); }), (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), lawEls, show.readouts && reads.length ? readEl : '', sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', btns);

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
