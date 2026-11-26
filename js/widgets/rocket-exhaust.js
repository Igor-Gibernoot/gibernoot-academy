// rocket-exhaust
//
// A rocket of initial mass m0 burns fuel at a constant rate mdot = -dm/dt (kg/s) until only the dry mass mDry is left, ejecting
// the exhaust backwards. Positive direction = up (the rocket's motion). Two ways to state the exhaust speed vex (a positive number):
//   frame 'rocket': the exhaust leaves at vex relative to the rocket (the real situation):   m dv/dt = vex mdot - m g
//                   so  v = vex ln(m0/m) - g t   (Tsiolkovsky), with m = m0 - mdot t
//   frame 'ground': the exhaust leaves at vex relative to the ground (the frame trap):   m dv/dt = (v + vex) mdot - m g
//                   so  v = vex (m0/m - 1) when g = 0
// Momentum bookkeeping (ground frame): rocket p_r = m v; exhaust p_ex = sum of the momenta of the ejected packets (each packet
// leaves with ground velocity v - vex, or -vex; gravity acts on every packet); total P = p_r + p_ex. g = 0: P stays 0.
// With g > 0, P' = -m0 g. Thrust below weight at lift-off: the rocket stays on the pad (v = 0) until thrust exceeds weight; the
// momentum bookkeeping is then not meaningful (the pad pushes too). Integrated with RK4 (burn end falls on a step boundary).
// Fully general: no course text is hard-coded; every word comes from the config.
//
//   m0: 100, mDry: 20, vex: 2, mdot: 10, g: 0      start values (mass in units.mass, speed in units.speed, mdot in mass/s, g in speed/s)
//   frame: 'rocket'                                'rocket' or 'ground' (start frame of the exhaust speed)
//   coast: 0                                       extra time after burnout, as a fraction of the longest burn time (the rocket coasts)
//   tmax: (auto)                                   time window (s); default the longest burn over the slider ranges, times 1 + coast
//   sliders: ['vex','mdot','m0']                   any of m0, mDry, vex, mdot, g, in order; default none
//   ranges: { m0:[50,200,10], mDry:[10,100,5], vex:[0.5,4,0.5], mdot:[5,20,1], g:[0,5,0.5] }   [min, max, step]
//   frameToggle: false                             two buttons: exhaust speed relative to the rocket / to the ground
//   duration: 5000                                 animation time of one run (ms), whatever the real time
//   units: { mass: 'kg', speed: 'm/s', time: 's' }
//   show: { scene, packets, groundLine, thrustArrow, bars, vPlot, lnPlot, naive, formula, formulaLine, readouts, labels,
//           replay, timeSlider, grid, cursor }   all true except naive, grid, timeSlider, lnPlot, formulaLine (false)
//       scene = the vertical view (rocket and ejected packets); packets = the dots of exhaust; groundLine = the ground (drawn only
//       when g > 0); thrustArrow = arrow on the rocket; bars = the three momentum bars (rocket, exhaust, total); vPlot = v(t);
//       lnPlot = v against ln(m0/m); naive = dashed constant-mass line (m = m0, same thrust: v = mdot vex t / m0 - g t, a = F/m0);
//       formula = dashed curve vex ln(m0/m) (- g t in the v(t) plot); formulaLine = text line of the formula with its value;
//       readouts = the numbers; cursor = time marker and dots; labels = names on arrows, bars, curves, axes; grid = plot grid;
//       replay = the Play button; timeSlider = the time slider.
//   bars: ['rocket','exhaust','total']             which bars to draw (any subset, in order)
//   readouts: ['m','v','dv']                       any of t, m, ratio, lnratio, v, dv, a, thrust, pr, pex, P, y (values at the time marker)
//   presets: [{ label, m0, mDry, vex, mdot, g, frame }]   buttons; only the fields given change
//   labels: { rocket, exhaust, total, t, m, ratio, lnratio, v, dv, a, thrust, pr, pex, P, y, vex, mdot, m0, mDry, g, time, speed, lnaxis,
//             vCurve, formulaCurve, naiveCurve, formula, frameRocket, frameGround, play, reset, scene, thrustArrow, momentum }
//       'formula' is Markdown with math, default $\Delta v = v_{ex}\ln(m_0/m)$; the numeric value is appended to it.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };

// Pure model, exported for script checks. rows[i] at t = tmax i / steps.
export function rocketModel({ m0 = 100, mDry = 20, vex = 2, mdot = 10, g = 0, frame = 'rocket', tmax, coast = 0, steps = 600 } = {}) {
  mDry = Math.min(mDry, 0.98 * m0);
  const tb = (m0 - mDry) / mdot;
  tmax = tmax ?? tb * (1 + coast);
  const mass = t => m0 - mdot * Math.min(Math.max(t, 0), tb);
  // state [v, y, pex]
  const rates = (t, [v, y, pex], burning) => {
    const m = mass(t), mex = m0 - m;
    const u = frame === 'ground' ? v + vex : vex;
    const w = frame === 'ground' ? -vex : v - vex;
    let a = (burning ? mdot * u / m : 0) - g, dy = v;
    if (g > 0 && y <= 0 && v <= 0 && a <= 0) { a = 0; dy = 0; }    // still on the pad
    return [a, dy, (burning ? mdot * w : 0) - g * mex];
  };
  const rk = (t, S, dt) => {
    const add = (A, B, k) => A.map((x, i) => x + k * B[i]), b = t + dt / 2 < tb;   // burning during this step (steps never straddle tb)
    const k1 = rates(t, S, b), k2 = rates(t + dt / 2, add(S, k1, dt / 2), b), k3 = rates(t + dt / 2, add(S, k2, dt / 2), b), k4 = rates(t + dt, add(S, k3, dt), b);
    return S.map((x, i) => x + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  const rows = [], dtg = tmax / steps;
  let S = [0, 0, 0], t = 0;
  const push = () => {
    const m = mass(t), [v, y, pex] = S, pr = m * v;
    rows.push({ t, m, v, y, pr, pex, P: pr + pex, ratio: m0 / m, lnratio: Math.log(m0 / m),
      a: rates(t, S, t < tb - 1e-12)[0], thrust: t < tb - 1e-12 ? mdot * (frame === 'ground' ? v + vex : vex) : 0,
      dv: vex * Math.log(m0 / m), vNaive: mdot * vex / m0 * Math.min(t, tb) - g * t });
  };
  push();
  for (let i = 0; i < steps; i++) {
    const t1 = (i + 1) * dtg;
    if (t < tb - 1e-12 && t1 > tb + 1e-12) { S = rk(t, S, tb - t); t = tb; S = rk(t, S, t1 - t); }   // split at burnout
    else S = rk(t, S, t1 - t);
    t = t1; push();
  }
  const final = rows[rows.length - 1];
  const closed = tt => frame === 'ground' ? vex * (m0 / mass(tt) - 1) : vex * Math.log(m0 / mass(tt)) - g * tt;   // exact v (g = 0 for 'ground')
  return { m0, mDry, vex, mdot, g, frame, tb, tmax, mass, rows, final, closed };
}

export function rocketExhaust(el, cfg) {
  const Lb = { rocket: 'Rocket', exhaust: 'Exhaust', total: 'Total', t: 'Time', m: 'Mass m', ratio: 'm₀/m', lnratio: 'ln(m₀/m)', v: 'Speed v', dv: 'v_ex ln(m₀/m)', a: 'Acceleration',
    thrust: 'Thrust', pr: 'Rocket momentum', pex: 'Exhaust momentum', P: 'Total momentum', y: 'Height', vex: 'Exhaust speed v_ex', mdot: 'Burn rate', m0: 'Initial mass m₀', mDry: 'Final mass',
    g: 'Gravity g', time: 'time', speed: 'speed', lnaxis: 'ln(m₀/m)', vCurve: 'v', formulaCurve: 'formula', naiveCurve: 'm₀ a', formula: '$\\Delta v = v_{ex}\\ln(m_0/m)$',
    frameRocket: 'Exhaust speed relative to rocket', frameGround: 'Exhaust speed relative to ground', play: 'Play', reset: 'Reset', scene: 'Rocket ejecting exhaust',
    thrustArrow: 'thrust', momentum: 'momentum', ...(cfg.labels ?? {}) };
  const show = { scene: true, packets: true, groundLine: true, thrustArrow: true, bars: true, vPlot: true, lnPlot: false, naive: false, formula: true, formulaLine: false, readouts: true, labels: true,
    replay: true, timeSlider: false, grid: false, cursor: true, ...(cfg.show ?? {}) };
  const barKeys = cfg.bars ?? ['rocket', 'exhaust', 'total'];
  const reads = cfg.readouts ?? ['m', 'v', 'dv'];
  const U = { mass: 'kg', speed: 'm/s', time: 's', ...(cfg.units ?? {}) };
  const R = { m0: [50, 200, 10], mDry: [10, 100, 5], vex: [0.5, 4, 0.5], mdot: [5, 20, 1], g: [0, 5, 0.5], ...(cfg.ranges ?? {}) };
  const duration = cfg.duration ?? 5000, coast = cfg.coast ?? 0;
  const init = { m0: cfg.m0 ?? 100, mDry: cfg.mDry ?? 20, vex: cfg.vex ?? 2, mdot: cfg.mdot ?? 10, g: cfg.g ?? 0, frame: cfg.frame ?? 'rocket' };
  const st = { ...init };
  const sliderKeys = cfg.sliders ?? [];
  const presets = cfg.presets ?? [];

  // Fixed scales from every combination the controls can reach (corners of the slider ranges, start values, presets, both frames
  // when the frame toggle is on), so axes and the scene do not jump while a control moves.
  const cases = [init, ...presets.map(p => ({ ...init, ...p }))];
  let corners = [{ ...init }];
  for (const k of sliderKeys) corners = corners.flatMap(c => [R[k][0], R[k][1]].map(v => ({ ...c, [k]: v })));
  const all = [...cases, ...corners].flatMap(c => cfg.frameToggle ? [{ ...c, frame: 'rocket' }, { ...c, frame: 'ground' }] : [c]);
  const tbMax = Math.max(...all.map(c => (c.m0 - Math.min(c.mDry, 0.98 * c.m0)) / c.mdot));
  const tmax = cfg.tmax ?? tbMax * (1 + coast);
  const model = q => rocketModel({ ...q, tmax, steps: 400 });
  const ext = { vmin: 0, vmax: 1e-6, ymin: 0, ymax: 1e-6, pmax: 1e-6, lmax: 1e-6 };
  for (const c of all) {
    if (c.g > 0 && c.vex * c.mdot / c.m0 <= c.g) continue;       // never leaves the pad: contributes no scale
    const M = model(c), rows = M.rows;
    for (const r of rows) {
      ext.vmin = Math.min(ext.vmin, r.v, r.dv - c.g * r.t, show.naive ? r.vNaive : 0); ext.vmax = Math.max(ext.vmax, r.v, r.dv - c.g * r.t, show.naive ? r.vNaive : 0);
      ext.ymax = Math.max(ext.ymax, r.y); ext.ymin = Math.min(ext.ymin, r.y);
      ext.pmax = Math.max(ext.pmax, Math.abs(r.pr), Math.abs(r.pex), Math.abs(r.P)); ext.lmax = Math.max(ext.lmax, r.lnratio);
    }
    for (let i = 0; i < rows.length; i += 20) {             // lowest packet at the end of the window
      const e = rows[i], w = c.frame === 'ground' ? -c.vex : e.v - c.vex;
      const dt = rows[rows.length - 1].t - e.t;
      ext.ymin = Math.min(ext.ymin, c.g > 0 ? Math.max(0, e.y + w * dt - c.g * dt * dt / 2) : e.y + w * dt);
    }
  }
  const vlo = ext.vmin < -1e-9 ? ext.vmin * 1.05 : 0, vhi = ext.vmax * 1.05;

  // geometry (px)
  const W = 360, PL = 40, PR = 340, PH = 84, SH = 190;
  const sceneW = show.bars ? 150 : W;
  let y = show.scene || show.bars ? SH + 4 : 0;
  const yV = show.vPlot ? (y += 22) : 0; if (show.vPlot) y += PH + 20;
  const yL = show.lnPlot ? (y += 22) : 0; if (show.lnPlot) y += PH + 20;
  const H = Math.max(y + 4, 20);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.scene });
  let tNow = 0, raf = 0, t0 = 0;
  const col = { rocket: 'var(--vec)', exhaust: 'var(--covec)', total: 'var(--basis)' };
  const muted = 'var(--muted)';

  function plot(top, xmax, x0lab, curves, xlab, ylab, cursorX) {
    const pg = s('g'), yv = v => top + PH - (v - vlo) / (vhi - vlo) * PH, xT = x => PL + Math.min(Math.max(x / xmax, 0), 1) * (PR - PL);
    const ax = { stroke: 'var(--ink)', 'stroke-width': 1.2 };
    if (show.grid) for (let i = 1; i < 4; i++) pg.append(s('line', { x1: PL, x2: PR, y1: top + PH * i / 4, y2: top + PH * i / 4, stroke: 'var(--line, #ccc)', 'stroke-width': 0.7 }));
    pg.append(s('line', { x1: PL, y1: top, x2: PL, y2: top + PH, ...ax }), s('line', { x1: PL, y1: yv(0), x2: PR, y2: yv(0), ...ax }));
    const tick = (v, yy) => pg.append(s('text', { x: PL - 4, y: yy + 3, 'font-size': 9, 'text-anchor': 'end', fill: muted }, num(v, 1)));
    tick(vhi, top); tick(0, yv(0)); if (vlo < 0) tick(vlo, top + PH);
    if (show.labels) pg.append(s('text', { x: PL + 3, y: top - 5, 'font-size': 9.5, fill: muted }, ylab), s('text', { x: PR, y: top + PH + 12, 'font-size': 9.5, 'text-anchor': 'end', fill: muted }, xlab));
    for (const c of curves) {
      const d = c.pts.map(([x, v], i) => `${i ? 'L' : 'M'}${xT(x).toFixed(1)} ${yv(v).toFixed(1)}`).join(' ');
      pg.append(s('path', { d, fill: 'none', stroke: c.color, 'stroke-width': c.w ?? 2.4, 'stroke-dasharray': c.dash ?? '' }));
      if (show.labels && c.label) { const [lx, lv] = c.pts[Math.round(c.pts.length * 0.9)]; pg.append(s('text', { x: Math.min(xT(lx), PR - 2), y: Math.max(top + 9, Math.min(top + PH - 2, yv(lv) + (c.dy ?? -4))), 'font-size': 10, 'text-anchor': 'end', fill: c.color, 'font-weight': 650 }, c.label)); }
      if (show.cursor && c.cur) pg.append(s('circle', { cx: xT(c.cur[0]), cy: yv(c.cur[1]), r: 4, fill: c.color, stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
    }
    if (show.cursor) pg.append(s('line', { x1: xT(cursorX), x2: xT(cursorX), y1: top, y2: top + PH, stroke: muted, 'stroke-width': 1, 'stroke-dasharray': '3 3' }));
    return pg;
  }

  function arrow(g, x1, y1, x2, y2, color, txt, tx, ty, anchor) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); if (L < 2) return;
    const ux = dx / L, uy = dy / L;
    g.append(s('line', { x1, y1, x2: x2 - ux * 6, y2: y2 - uy * 6, stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }),
      s('polygon', { fill: color, points: `${x2},${y2} ${x2 - ux * 8 - uy * 4},${y2 - uy * 8 + ux * 4} ${x2 - ux * 8 + uy * 4},${y2 - uy * 8 - ux * 4}` }));
    if (show.labels && txt) g.append(s('text', { x: tx, y: ty, 'font-size': 10, 'text-anchor': anchor, fill: color, 'font-weight': 650 }, txt));
  }

  function paint() {
    const M = model(st), n = M.rows.length - 1, idx = Math.min(n, Math.round(tNow / tmax * n)), row = M.rows[idx];
    if (show.scene) {
      const g0 = s('g'), top = 14, bot = SH - 14, span = Math.max(ext.ymax - ext.ymin, 1e-6) * 1.08, pad = 0.02 * span;
      const Y = v => bot - (v - ext.ymin + pad) / span * (bot - top), cx = sceneW / 2;
      const showGround = show.groundLine && st.g > 0;
      if (showGround) g0.append(s('line', { x1: 14, x2: sceneW - 14, y1: Y(0), y2: Y(0), stroke: muted, 'stroke-width': 3 }));
      if (show.packets) {
        const N = 40, tbNow = M.tb;
        for (let k = 0; k < N; k++) {
          const te = tbNow * (k + 0.5) / N; if (te > row.t) break;
          const e = M.rows[Math.min(n, Math.round(te / tmax * n))], w = st.frame === 'ground' ? -st.vex : e.v - st.vex, dt = row.t - e.t;
          let py = e.y + w * dt - st.g * dt * dt / 2; if (st.g > 0) py = Math.max(py, 0);
          g0.append(s('circle', { cx: cx + ((k * 7) % 5 - 2) * 3.5, cy: Y(py), r: 2.6, fill: col.exhaust, opacity: 0.8 }));
        }
      }
      const ry = Y(row.y), rh = 14 + 22 * Math.cbrt(row.m / Math.max(st.m0, 1e-9));
      g0.append(s('polygon', { points: `${cx - 8},${ry} ${cx + 8},${ry} ${cx + 8},${ry - rh + 7} ${cx},${ry - rh} ${cx - 8},${ry - rh + 7}`, fill: col.rocket }));
      if (show.thrustArrow && row.thrust > 1e-9 && row.t < M.tb) {
        const k = 40 / Math.max(1e-9, ...all.map(c => c.mdot * (cfg.frameToggle ? c.vex * 3 : c.vex)));
        arrow(g0, cx, ry + 2, cx, ry + 2 + 6 + Math.min(row.thrust * k, 50), col.exhaust, Lb.thrustArrow, cx + 14, ry + 14, 'start');
      }
      svg.append(g0);
    }
    if (show.bars) {
      const bg = s('g'), x0 = show.scene ? sceneW + 8 : 20, bw = Math.min(40, (W - x0 - 10) / barKeys.length - 10), mid = SH / 2 + 4, half = SH / 2 - 26;
      bg.append(s('line', { x1: x0, x2: W - 6, y1: mid, y2: mid, stroke: 'var(--ink)', 'stroke-width': 1.2 }));
      const vals = { rocket: row.pr, exhaust: row.pex, total: row.P };
      barKeys.forEach((k, i) => {
        const v = vals[k], hgt = Math.max(-1, Math.min(1, v / ext.pmax)) * half, bx = x0 + 6 + i * (bw + 10);
        bg.append(s('rect', { x: bx, y: Math.min(mid, mid - hgt), width: bw, height: Math.max(Math.abs(hgt), 1.2), rx: 2, fill: col[k], opacity: k === 'total' ? 1 : 0.9 }));
        if (show.labels) bg.append(s('text', { x: bx + bw / 2, y: SH - 4, 'font-size': 9.5, 'text-anchor': 'middle', fill: col[k], 'font-weight': 650 }, Lb[k]));
      });
      if (show.labels) bg.append(s('text', { x: x0, y: 12, 'font-size': 9.5, fill: muted }, Lb.momentum));
      svg.append(bg);
    }
    if (show.vPlot) {
      const P = (f) => M.rows.map(r => [r.t, f(r)]), cv = (f) => [row.t, f(row)];
      const cs = [];
      if (show.naive) cs.push({ pts: P(r => r.vNaive), color: muted, dash: '2 4', label: Lb.naiveCurve, dy: 12, cur: cv(r => r.vNaive), w: 2 });
      if (show.formula) cs.push({ pts: P(r => r.dv - st.g * r.t), color: col.total, dash: '6 3', label: Lb.formulaCurve, dy: -5, w: 3.2 });
      cs.push({ pts: P(r => r.v), color: col.rocket, label: Lb.vCurve, dy: -4, cur: cv(r => r.v) });
      svg.append(plot(yV, tmax, '0', cs, `${Lb.time} (${U.time})`, `${Lb.speed} (${U.speed})`, row.t));
    }
    if (show.lnPlot) {
      const ok = M.rows.filter(r => r.t <= M.tb + 1e-9), P = (f) => ok.map(r => [r.lnratio, f(r)]), cv = (f) => [row.lnratio, f(row)];
      const cs = [];
      if (show.formula) cs.push({ pts: P(r => r.dv), color: col.total, dash: '6 3', label: Lb.formulaCurve, dy: -5, w: 3.2 });
      cs.push({ pts: P(r => r.v), color: col.rocket, label: Lb.vCurve, dy: 12, cur: cv(r => r.v) });
      svg.append(plot(yL, ext.lmax, '0', cs, Lb.lnaxis, `${Lb.speed} (${U.speed})`, row.lnratio));
    }
    const val = { t: row.t, m: row.m, ratio: row.ratio, lnratio: row.lnratio, v: row.v, dv: row.dv, a: row.a, thrust: row.thrust, pr: row.pr, pex: row.pex, P: row.P, y: row.y };
    const unit = { t: U.time, m: U.mass, v: U.speed, dv: U.speed, a: `${U.speed}/${U.time}`, thrust: `${U.mass} ${U.speed}/${U.time}`, pr: `${U.mass} ${U.speed}`, pex: `${U.mass} ${U.speed}`, P: `${U.mass} ${U.speed}`, y: '' };
    for (const k of reads) if (rd[k]) rd[k].textContent = `${num(val[k], 2)} ${unit[k] ?? ''}`.trim();
    if (formulaVal) formulaVal.textContent = ` = ${num(val.dv, 2)} ${U.speed}`;
    for (const [k, inp] of Object.entries(inps)) { inp.value = st[k]; vals[k].textContent = fmtSlider(k); }
    for (const [mode, b] of Object.entries(modeBtns)) b.setAttribute('aria-pressed', String(mode === st.frame));
    if (timeInp) timeInp.value = Math.round(tNow / tmax * 1000);
  }
  const fmtSlider = k => k === 'm0' || k === 'mDry' ? `${num(st[k], 0)} ${U.mass}` : k === 'vex' ? `${num(st.vex, 1)} ${U.speed}` : k === 'mdot' ? `${num(st.mdot, 1)} ${U.mass}/${U.time}` : `${num(st.g, 1)} ${U.speed}/${U.time}²`;

  // controls
  const rd = {}, inps = {}, vals = {}, modeBtns = {};
  let formulaEl = null, formulaVal = null, timeInp = null;
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const sliderEls = sliderKeys.map(k => {
    const [lo, hi, step] = R[k];
    const inp = inps[k] = h('input', { type: 'range', min: lo, max: hi, step, value: st[k], 'aria-label': Lb[k] });
    inp.addEventListener('input', () => { st[k] = +inp.value; play(); });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb[k])), inp, vals[k] = h('span', { class: 'fs-num' }));
  });
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const toggles = cfg.frameToggle ? [['rocket', Lb.frameRocket], ['ground', Lb.frameGround]].map(([mode, txt]) => modeBtns[mode] = btn(txt, () => { st.frame = mode; play(); })) : [];
  const apply = p => { for (const k of ['m0', 'mDry', 'vex', 'mdot', 'g', 'frame']) if (p[k] != null) st[k] = p[k]; play(); };
  const btns = h('div', { class: 'wbtns' }, show.replay ? btn(Lb.play, () => play()) : '', toggles,
    btn(Lb.reset, () => { Object.assign(st, init); play(); }), presets.map(pr => btn(pr.label, () => apply(pr))));
  if (show.formulaLine) formulaEl = h('div', { class: 'fs-reads', role: 'status' }, h('span', {}, mdInline(Lb.formula)), formulaVal = h('span', { class: 'fs-num' }));
  if (show.timeSlider) {
    timeInp = h('input', { type: 'range', min: 0, max: 1000, step: 1, value: 0, 'aria-label': Lb.time });
    timeInp.addEventListener('input', () => { cancelAnimationFrame(raf); tNow = +timeInp.value / 1000 * tmax; redraw(); });
  }
  el.append(h('div', { class: 'fs-fig' }, svg), formulaEl ?? '', show.readouts && reads.length ? readEl : '', timeInp ? h('div', { class: 'fs-sliders' }, h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, Lb.time), timeInp, h('span'))) : '',
    sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', btns);

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
