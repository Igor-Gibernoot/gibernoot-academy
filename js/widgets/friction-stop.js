// friction-stop
//
// A block or vehicle of mass m slides along a road with friction coefficient mu and initial speed v0.
// Sliding friction F = mu N (N = m g cos(slope)) brakes it with a constant deceleration
//   a = g (mu cos(slope) - sin(slope))        (slope in degrees, positive = downhill)
// so the stopping distance is d = v0^2 / (2 a) (flat road: d = v0^2 / (2 g mu), independent of the mass)
// and the kinetic energy 1/2 m v0^2 (plus the energy released by a downhill slope) becomes heat Q = F d.
// Fully general: no course text is hard-coded; every word comes from the config.
//
//   mu: 0.7, v0: 10, mass: 1000, slope: 0     start values (mu unitless, v0 in speedUnit, mass in massUnit, slope in degrees)
//   g: 9.8                                    gravity (m/s^2)
//   sliders: ['mu','v0','mass','slope']       which sliders to show, in order (default none)
//   ranges: { mu: [0.05,1.2,0.05], v0: [1,40,1], mass: [50,2000,10], slope: [-15,15,1] }   [min, max, step]
//   lockToggle: false                         true = two buttons, locked (kinetic mu) / rolling (mu_s = staticRatio * mu)
//   staticRatio: 1.2, locked: true            static-to-kinetic ratio, start state of the toggle
//   distanceMax: auto                         road length shown (m); auto from the start values and presets
//   speedMax: auto                            top of the speed axis; auto = 1.25 x the largest v0 of start and presets
//   duration: 2500                            animation time of one braking run (ms), whatever the real time
//   units: { speed: 'm/s', mass: 'kg', distance: 'm', energy: 'J', force: 'N' }
//   show: { forceArrows, speedPlot, energyBar, heat, potential, distanceMarker, grid, wheels, labels, pin, readouts, replay }
//       all default true except grid and pin (false). forceArrows = friction, normal and weight arrows on the vehicle;
//       speedPlot = speed against distance with the moving dot; energyBar = bar of kinetic energy (blue) turning into
//       heat (orange); heat = the heat part of that bar; potential = the grey part (energy stored uphill / the extra
//       energy released downhill is simply added to the bar); distanceMarker = dashed line at the stopping distance;
//       grid = grid lines on the plot and ticks on the road; wheels = the vehicle's wheels (rolling mode spins them);
//       labels = letters on the arrows and the axis names; pin = button that keeps the current speed curve as a grey
//       ghost for comparison; readouts = the readout cells; replay = the Brake button.
//   readouts: ['distance','time','energy','heat','decel','force']   default ['distance','time','energy','heat']
//   presets: [{ label, mu, v0, mass, slope, locked }]   buttons; only the fields given change
//   labels: { distance, time, energy, heat, decel, force, speed, ke, potential, friction, normal, weight,
//             locked, rolling, reset, brake, pin, unpin, noStop, speedAxis, distanceAxis, mu, v0, mass, slope, road }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => String(Number((+v).toFixed(d)));
const fmt = (v, unit) => { const a = Math.abs(v); return a >= 1e6 ? `${num(v / 1e6, 2)} M${unit}` : a >= 1e4 ? `${num(v / 1e3, 1)} k${unit}` : `${a >= 100 ? num(v, 0) : a >= 10 ? num(v, 1) : num(v, 2)} ${unit}`; };

// Pure model, exported for script checks.  slope in degrees (positive = downhill).
export function stopModel({ mu, v0, mass, slope = 0, g = 9.8 }) {
  const th = slope * Math.PI / 180, N = mass * g * Math.cos(th);
  const a = g * (mu * Math.cos(th) - Math.sin(th));
  const F = mu * N, E0 = 0.5 * mass * v0 * v0;
  const stops = a > 1e-9;
  const d = stops ? v0 * v0 / (2 * a) : Infinity, t = stops ? v0 / a : Infinity;
  return { a, N, F, E0, stops, d, t, Q: stops ? F * d : Infinity, th };
}

export function frictionStop(el, cfg) {
  const Lb = { distance: 'Stopping distance', time: 'Stopping time', energy: 'Kinetic energy at start', heat: 'Heat produced', decel: 'Deceleration',
    force: 'Friction force', speed: 'Speed', ke: 'Kinetic energy', potential: 'Gravity', friction: 'F', normal: 'N', weight: 'mg',
    locked: 'Locked wheels', rolling: 'Rolling wheels', reset: 'Reset', brake: 'Brake', pin: 'Keep this curve', unpin: 'Clear kept curve', noStop: 'does not stop',
    speedAxis: 'speed', distanceAxis: 'distance', mu: 'Friction coefficient', v0: 'Initial speed', mass: 'Mass', slope: 'Slope', road: 'Vehicle braking on a road',
    ...(cfg.labels ?? {}) };
  const show = { forceArrows: true, speedPlot: true, energyBar: true, heat: true, potential: true, distanceMarker: true, grid: false, wheels: true, labels: true, pin: false, readouts: true, replay: true, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['distance', 'time', 'energy', 'heat'];
  const U = { speed: 'm/s', mass: 'kg', distance: 'm', energy: 'J', force: 'N', ...(cfg.units ?? {}) };
  const g = cfg.g ?? 9.8, staticRatio = cfg.staticRatio ?? 1.2, duration = cfg.duration ?? 2500;
  const R = { mu: [0.05, 1.2, 0.05], v0: [1, 40, 1], mass: [50, 2000, 10], slope: [-15, 15, 1], ...(cfg.ranges ?? {}) };
  const init = { mu: cfg.mu ?? 0.7, v0: cfg.v0 ?? 10, mass: cfg.mass ?? 1000, slope: cfg.slope ?? 0, locked: cfg.locked !== false };
  const st = { ...init };
  const sliderKeys = cfg.sliders ?? [];

  const muEff = q => q.mu * (cfg.lockToggle && !q.locked ? staticRatio : 1);
  const model = q => stopModel({ mu: muEff(q), v0: q.v0, mass: q.mass, slope: q.slope, g });
  const cases = [init, ...(cfg.presets ?? []).map(p => ({ ...init, ...p }))];
  const finite = cases.map(q => model(q).d).filter(Number.isFinite);
  const niceUp = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map(m => m * p).find(x => x >= v - 1e-9); };
  const xmax = cfg.distanceMax ?? Math.max(10, niceUp(1.15 * Math.max(0, ...finite)));
  const vmax = cfg.speedMax ?? niceUp(1.25 * Math.max(...cases.map(q => q.v0)));
  const maxSlope = Math.max(...cases.map(q => Math.abs(q.slope)), ...(sliderKeys.includes('slope') ? [Math.abs(R.slope[0]), Math.abs(R.slope[1])] : [0]));
  const Fref = 1.2 * R.mu[1] * R.mass[1] * g, Wref = 1.2 * R.mass[1] * g;

  // geometry (px)
  const W = 360, X0 = 24, LR = 312, RH = 86 + Math.round(LR * Math.sin(Math.min(maxSlope, 60) * Math.PI / 180)) + 8;
  const PT = RH + 22, PH = 96, PL = 40, PR = 340;
  const BY = show.speedPlot ? PT + PH + 38 : RH + 14, H = BY + (show.energyBar ? 38 : 0) + 4;
  const svg = s('svg', { viewBox: `0 0 ${W} ${show.energyBar ? H : BY}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.road });
  let ghost = null, u = 0, raf = 0, t0 = 0;

  const xOf = x => PL + Math.min(1, x / xmax) * (PR - PL), yOf = v => PT + PH - Math.min(1, v / vmax) * PH;
  const curve = (q, M) => {
    const top = Math.min(M.d, xmax), pts = [];
    for (let i = 0; i <= 80; i++) { const x = top * i / 80, v = Math.sqrt(Math.max(0, q.v0 * q.v0 - 2 * M.a * x)); pts.push(`${i ? 'L' : 'M'}${xOf(x).toFixed(1)} ${yOf(v).toFixed(1)}`); }
    return pts.join(' ');
  };
  // position and speed after fraction u of the (visible) braking run
  const runTime = M => M.stops ? Math.min(M.t, (st.v0 - Math.sqrt(Math.max(0, st.v0 * st.v0 - 2 * M.a * Math.min(M.d, xmax))) ) / M.a || M.t)
    : (M.a < -1e-9 ? (-st.v0 + Math.sqrt(st.v0 * st.v0 - 2 * M.a * xmax)) / -M.a : xmax / st.v0);
  const stateAt = (M, uu) => {
    const T = runTime(M), t = uu * T, sx = st.v0 * t - 0.5 * M.a * t * t;
    const x = Math.max(0, Math.min(sx, xmax)), v = Math.max(0, st.v0 - M.a * t);
    return { x, v };
  };

  function paint() {
    const M = model(st), { x, v } = stateAt(M, u), th = M.th, c = Math.cos(th), sn = Math.sin(th);
    const k = LR / xmax, drop = LR * sn, Y0 = 84 + (drop < 0 ? -drop : 0);
    const P = d => [X0 + d * k * c, Y0 + d * k * sn];
    const g0 = s('g');
    // road
    const [ex, ey] = P(xmax);
    g0.append(s('line', { x1: X0, y1: Y0, x2: ex, y2: ey, stroke: 'var(--muted)', 'stroke-width': 5, 'stroke-linecap': 'butt' }));
    if (show.grid) {
      const step = niceUp(xmax / 8);
      for (let d = 0; d <= xmax + 1e-9; d += step) { const [px, py] = P(d); g0.append(s('line', { x1: px, y1: py + 3, x2: px + 3 * -sn, y2: py + 3 + 3 * c, stroke: 'var(--ink)', 'stroke-width': 1 }), s('text', { x: px - 6 * sn, y: py + 14 + 4 * c, 'font-size': 8.5, 'text-anchor': 'middle', fill: 'var(--muted)' }, `${num(d, 1)}`)); }
    }
    if (show.distanceMarker && M.stops && M.d <= xmax) {
      const [mx, my] = P(M.d);
      g0.append(s('line', { x1: mx, y1: my - 66, x2: mx, y2: my + 8, stroke: 'var(--basis)', 'stroke-width': 2, 'stroke-dasharray': '4 3' }),
        s('text', { x: mx, y: my - 70, 'font-size': 10, 'text-anchor': 'middle', fill: 'var(--basis)', 'font-weight': 650 }, `${num(M.d, 1)} ${U.distance}`));
    } else if (show.distanceMarker && !M.stops) {
      g0.append(s('text', { x: W / 2, y: 14, 'font-size': 11, 'text-anchor': 'middle', fill: 'var(--basis)', 'font-weight': 650 }, Lb.noStop));
    }
    // vehicle
    const [vx, vy] = P(x), veh = s('g', { transform: `translate(${vx} ${vy}) rotate(${st.slope}) scale(1.5)` });
    veh.append(s('rect', { x: -15, y: -25, width: 30, height: 16, rx: 3, fill: 'var(--vec)', opacity: 0.9 }));
    if (show.wheels) {
      const rot = !cfg.lockToggle || !st.locked ? (x / 0.3) * 180 / Math.PI * 0.05 : 0;
      for (const wx of [-9, 9]) {
        veh.append(s('circle', { cx: wx, cy: -5, r: 5, fill: 'var(--bg, #fff)', stroke: 'var(--ink)', 'stroke-width': 1.5 }),
          s('line', { x1: wx - 5, y1: -5, x2: wx + 5, y2: -5, stroke: 'var(--ink)', 'stroke-width': 1.5, transform: `rotate(${rot} ${wx} -5)` }));
      }
    }
    if (show.forceArrows) {
      const arrow = (x1, y1, x2, y2, col, txt, tx, ty, anchor) => {
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
        veh.append(s('line', { x1, y1, x2: x2 - ux * 6, y2: y2 - uy * 6, stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }),
          s('polygon', { fill: col, points: `${x2},${y2} ${x2 - ux * 8 - uy * 4},${y2 - uy * 8 + ux * 4} ${x2 - ux * 8 + uy * 4},${y2 - uy * 8 - ux * 4}` }));
        if (show.labels) veh.append(s('text', { x: tx, y: ty, 'font-size': 10, 'text-anchor': anchor, fill: col, 'font-weight': 650 }, txt));
      };
      const fl = 8 + 30 * Math.min(1, M.F / Fref);
      if (v > 0.05) arrow(0, 2, -fl, 2, 'var(--covec)', Lb.friction, -fl - 3, 5, 'end');
      const nl = 8 + 26 * Math.min(1, M.N / Wref);
      arrow(0, -26, 0, -26 - nl, 'var(--basis)', Lb.normal, -5, -26 - nl + 4, 'end');
      const wl = 8 + 26 * Math.min(1, st.mass * g / Wref);
      arrowWeight(veh, wl);
    }
    g0.append(veh);
    svg.append(g0);
    // plot
    if (show.speedPlot) {
      const pg = s('g');
      if (show.grid) {
        for (let i = 1; i <= 4; i++) pg.append(s('line', { x1: PL, x2: PR, y1: PT + PH * i / 4, y2: PT + PH * i / 4, stroke: 'var(--line, #ccc)', 'stroke-width': 0.7 }));
        for (let i = 1; i <= 4; i++) pg.append(s('line', { y1: PT, y2: PT + PH, x1: PL + (PR - PL) * i / 4, x2: PL + (PR - PL) * i / 4, stroke: 'var(--line, #ccc)', 'stroke-width': 0.7 }));
      }
      pg.append(s('line', { x1: PL, y1: PT, x2: PL, y2: PT + PH, stroke: 'var(--ink)', 'stroke-width': 1.2 }), s('line', { x1: PL, y1: PT + PH, x2: PR, y2: PT + PH, stroke: 'var(--ink)', 'stroke-width': 1.2 }));
      pg.append(s('text', { x: PL - 4, y: PT + 4, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, num(vmax, 1)), s('text', { x: PL - 4, y: PT + PH + 3, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, '0'),
        s('text', { x: PR, y: PT + PH + 12, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, `${num(xmax, 1)} ${U.distance}`));
      if (show.labels) pg.append(s('text', { x: PL + 3, y: PT - 3, 'font-size': 9.5, fill: 'var(--muted)' }, `${Lb.speedAxis} (${U.speed})`), s('text', { x: (PL + PR) / 2, y: PT + PH + 24, 'font-size': 9.5, 'text-anchor': 'middle', fill: 'var(--muted)' }, `${Lb.distanceAxis} (${U.distance})`));
      if (ghost) pg.append(s('path', { d: curve(ghost.q, ghost.M), fill: 'none', stroke: 'var(--muted)', 'stroke-width': 2, 'stroke-dasharray': '5 3' }));
      pg.append(s('path', { d: curve(st, M), fill: 'none', stroke: 'var(--vec)', 'stroke-width': 2.5 }));
      if (show.distanceMarker && M.stops && M.d <= xmax) pg.append(s('line', { x1: xOf(M.d), x2: xOf(M.d), y1: PT, y2: PT + PH, stroke: 'var(--basis)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }));
      pg.append(s('circle', { cx: xOf(x), cy: yOf(v), r: 5, fill: 'var(--covec)', stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
      if (show.labels) pg.append(s('text', { x: Math.min(PR - 2, xOf(x) + 8), y: Math.max(PT + 10, yOf(v) - 8), 'font-size': 9.5, fill: 'var(--ink)' }, `${num(v, 1)} ${U.speed}`));
      svg.append(pg);
    }
    // energy bar
    if (show.energyBar) {
      const E0 = M.E0, th2 = M.th, heat = muEff(st) * st.mass * g * Math.cos(th2) * x, grav = st.mass * g * Math.sin(th2) * x;
      const ke = 0.5 * st.mass * v * v, stored = Math.max(0, -grav);
      const sMax = M.stops ? Math.min(M.d, xmax) : xmax, scale = E0 + Math.max(0, st.mass * g * Math.sin(th2) * sMax);
      const bx = 24, bw = W - 48, f = e => Math.max(0, e) / scale * bw;
      const bg = s('g');
      bg.append(s('rect', { x: bx, y: BY, width: bw, height: 16, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1 }));
      let cx = bx;
      const seg = (w, col, txt) => { if (w > 0.3) { bg.append(s('rect', { x: cx, y: BY, width: w, height: 16, fill: col })); if (txt && w > 44) bg.append(s('text', { x: cx + w / 2, y: BY + 11.5, 'font-size': 9.5, 'text-anchor': 'middle', fill: '#fff', 'font-weight': 650 }, txt)); } cx += w; };
      seg(f(ke), 'var(--vec)', `${fmt(ke, U.energy)}`);
      if (show.heat) seg(f(heat), 'var(--covec)', `${fmt(heat, U.energy)}`);
      if (show.potential && stored > 0) seg(f(stored), 'var(--muted)', `${fmt(stored, U.energy)}`);
      if (show.labels) {
        bg.append(s('text', { x: bx, y: BY + 29, 'font-size': 9.5, fill: 'var(--vec)', 'font-weight': 650 }, Lb.ke));
        if (show.heat) bg.append(s('text', { x: bx + bw, y: BY + 29, 'font-size': 9.5, 'text-anchor': 'end', fill: 'var(--covec)', 'font-weight': 650 }, Lb.heat));
      }
      svg.append(bg);
    }
    // readouts
    const val = {
      distance: M.stops ? `${num(M.d, 1)} ${U.distance}` : Lb.noStop, time: M.stops ? `${num(M.t, 1)} s` : '–',
      energy: `${fmt(M.E0, U.energy)}`, heat: M.stops ? `${fmt(M.Q, U.energy)}` : '–',
      decel: `${num(M.a, 2)} m/s²`, force: `${fmt(M.F, U.force)}`,
    };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    for (const [key, inp] of Object.entries(inps)) { inp.value = st[key]; vals[key].textContent = fmtSlider(key); }
    for (const [mode, b] of Object.entries(modeBtns)) b.setAttribute('aria-pressed', String((mode === 'locked') === st.locked));
    if (pinBtn) pinBtn.textContent = ghost ? Lb.unpin : Lb.pin;
  }
  function arrowWeight(veh, wl) {
    veh.append(s('line', { x1: 0, y1: -17, x2: 0, y2: -17 + wl - 6, stroke: 'var(--muted)', 'stroke-width': 3, 'stroke-linecap': 'round' }),
      s('polygon', { fill: 'var(--muted)', points: `0,${-17 + wl} -4,${-17 + wl - 8} 4,${-17 + wl - 8}` }));
    if (show.labels) veh.append(s('text', { x: 18, y: -9, 'font-size': 10, fill: 'var(--muted)', 'font-weight': 650 }, Lb.weight));
  }
  const fmtSlider = key => key === 'mu' ? num(st.mu, 2) : key === 'v0' ? `${num(st.v0, 1)} ${U.speed}` : key === 'mass' ? `${num(st.mass, 0)} ${U.mass}` : `${num(st.slope, 0)}°`;

  // controls
  const rd = {}, inps = {}, vals = {}, modeBtns = {};
  const names = { distance: Lb.distance, time: Lb.time, energy: Lb.energy, heat: Lb.heat, decel: Lb.decel, force: Lb.force };
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const sliderEls = sliderKeys.map(key => {
    const [lo, hi, step] = R[key];
    const inp = inps[key] = h('input', { type: 'range', min: lo, max: hi, step, value: st[key], 'aria-label': Lb[key] });
    inp.addEventListener('input', () => { st[key] = +inp.value; play(); });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb[key])), inp, vals[key] = h('span', { class: 'fs-num' }));
  });
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const pinBtn = show.pin ? btn(Lb.pin, () => { ghost = ghost ? null : { q: { ...st }, M: model(st) }; redraw(); }) : null;
  const toggles = cfg.lockToggle ? [['locked', Lb.locked], ['rolling', Lb.rolling]].map(([mode, txt]) => { const b = btn(txt, () => { st.locked = mode === 'locked'; play(); }); b.setAttribute('aria-pressed', 'true'); return modeBtns[mode] = b; }) : [];
  const apply = p => { for (const key of ['mu', 'v0', 'mass', 'slope', 'locked']) if (p[key] != null) st[key] = p[key]; play(); };
  const btns = h('div', { class: 'wbtns' }, show.replay ? btn(Lb.brake, () => play()) : '', toggles, pinBtn ?? '',
    btn(Lb.reset, () => { Object.assign(st, init); ghost = null; play(); }), (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', btns);

  function redraw() { svg.replaceChildren(); paint(); }
  function play() {
    cancelAnimationFrame(raf); u = 0; t0 = performance.now(); redraw();
    const tick = now => {
      if (!el.isConnected) return;
      u = Math.min(1, (now - t0) / duration); redraw();
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  play();
}
