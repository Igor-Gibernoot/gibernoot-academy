// phasor-wheel
//
// A rotating arrow z = A e^{i(w t + phi)} on the complex plane, with its real part (and optionally its imaginary part) projected onto a trace that unrolls in time.
// Optional second phasor: z = z1 + z2 (same w, added tip to tail), the resultant is again a rotating arrow, so a sum of two cosines is one cosine. Plain SVG + HTML,
// every word from the config (no course text hard-coded). Reports nothing to the card.
// Model:  zk = Ak e^{i(w t + phik)},  Re zk = Ak cos(w t + phik).   Sum: R e^{i delta} = A1 e^{i phi1} + A2 e^{i phi2}  =>  Re z = R cos(w t + delta).
// Layout (fixed, so nothing jumps): the plane (Re horizontal, Im vertical) top left; the Im trace to its right (time runs right, value vertical, sharing the Im axis);
// the Re trace below it (time runs down, value horizontal, sharing the Re axis). The trace shows the past: "now" is at the plane, older time farther away.
//
//   mode: 'single' | 'sum'     start mode (sum needs show.second)
//   amplitude: 1   omega: 2   phase: 0   amplitude2: 0.7   phase2: 1.2      (phases in rad; omega in rad per time unit)
//   extent: amplitude drawn at the plane's edge (default: largest amplitude range + largest second-amplitude range)
//   ranges: { amplitude: [0, 1.5, 0.05], omega: [0.5, 6, 0.1], phase: [-pi, pi, 0.05], amplitude2: [0, 1, 0.05], phase2: [-pi, pi, 0.05] }   (the plane's scale fits the largest sum of ranges)
//   window: time shown in each trace (default two periods of the initial omega)      timeScale: 1 (simulated time per real second)      autoplay: true      time: 0 (start time)
//   phaseUnit: 'rad' | 'deg' (readouts and sliders)      units: { time: 's', omega: 'rad/s' }
//   show: { axes, axisLabels, circle, arrow, tip, angle, projection, imProjection, trace, imTrace, componentTraces, nowDot, second, resultant, parallelogram, labels, readouts,
//           ampSlider, omegaSlider, phaseSlider, amp2Slider, phase2Slider, timeSlider, modeToggle, play, presets }
//       defaults true except imTrace, imProjection, componentTraces, parallelogram, timeSlider (false); amp2Slider/phase2Slider follow `second`.
//       axes = the Re and Im axes, axisLabels = their names and the time-axis names; circle = dotted circle of radius A; arrow = the rotating arrow(s); tip = dot at the tip;
//       angle = arc and label for the angle w t + phi; projection = drop line from the tip to the Re axis, joined to the Re trace; imProjection = same for Im;
//       trace = Re trace (below the plane); imTrace = Im trace (right of the plane); componentTraces = the two cosines faint in the trace(s) in sum mode; nowDot = dot at "now" on the trace;
//       second = the second phasor exists (sum mode available); resultant = the arrow z1 + z2 and the trace follows it; parallelogram = faint z2 then z1 path; labels = text in the drawing.
//   readouts: any of amp, phase, omega, period, re, im, time (default [amp, phase]); in sum mode amp and phase are the resultant's.
//   presets: [{ label, mode, amplitude, omega, phase, amplitude2, phase2 }]   only the fields given change
//   labels: { re, im, time, amplitude, omega, phase, amplitude2, phase2, timeSlider, amp, phaseRead, period, reRead, imRead, timeRead, angle, z1, z2, sum, single, sumMode, play, pause, reset }
// Exported for script checks: phasorSum({A1, phi1, A2, phi2}) -> {A, phi}.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };
const wrap = a => { a = ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a; };

export function phasorSum({ A1, phi1, A2, phi2 }) {
  const x = A1 * Math.cos(phi1) + A2 * Math.cos(phi2), y = A1 * Math.sin(phi1) + A2 * Math.sin(phi2);
  return { A: Math.hypot(x, y), phi: Math.atan2(y, x) };
}

export function phasorWheel(el, cfg = {}) {
  const Lb = { re: 'Re', im: 'Im', time: 'time', amplitude: 'Amplitude A', omega: 'Angular frequency ω', phase: 'Phase φ', amplitude2: 'Second amplitude', phase2: 'Second phase',
    timeSlider: 'Time', amp: 'Amplitude', phaseRead: 'Phase', period: 'Period', reRead: 'Real part', imRead: 'Imaginary part', timeRead: 'Time', angle: 'ωt + φ',
    z1: 'z₁', z2: 'z₂', sum: 'z₁ + z₂', single: 'One phasor', sumMode: 'Add a second', play: 'Play', pause: 'Pause', reset: 'Reset', ...(cfg.labels ?? {}) };
  const U = { time: 's', omega: 'rad/s', ...(cfg.units ?? {}) };
  const show = { axes: true, axisLabels: true, circle: true, arrow: true, tip: true, angle: true, projection: true, imProjection: false, trace: true, imTrace: false, componentTraces: false,
    nowDot: true, second: true, resultant: true, parallelogram: false, labels: true, readouts: true, ampSlider: true, omegaSlider: true, phaseSlider: true, timeSlider: false,
    modeToggle: true, play: true, presets: true, ...(cfg.show ?? {}) };
  show.amp2Slider = cfg.show?.amp2Slider ?? show.second; show.phase2Slider = cfg.show?.phase2Slider ?? show.second;
  const deg = cfg.phaseUnit === 'deg', PI = Math.PI;
  const R = { amplitude: [0, 1.5, 0.05], omega: [0.5, 6, 0.1], phase: [-PI, PI, 0.05], amplitude2: [0, 1, 0.05], phase2: [-PI, PI, 0.05], ...(cfg.ranges ?? {}) };
  const init = { mode: show.second ? cfg.mode ?? 'single' : 'single', A1: cfg.amplitude ?? 1, w: cfg.omega ?? 2, p1: cfg.phase ?? 0, A2: cfg.amplitude2 ?? 0.7, p2: cfg.phase2 ?? 1.2, t: cfg.time ?? 0 };
  const st = { ...init };
  const win = cfg.window ?? 4 * PI / init.w, timeScale = cfg.timeScale ?? 1;
  let playing = cfg.autoplay !== false, raf = 0, last = 0;

  // ---- model
  const comps = () => (st.mode === 'sum' && show.second ? [[st.A1, st.p1], [st.A2, st.p2]] : [[st.A1, st.p1]]);
  const sum = () => (st.mode === 'sum' && show.second ? phasorSum({ A1: st.A1, phi1: st.p1, A2: st.A2, phi2: st.p2 }) : { A: st.A1, phi: wrap(st.p1) });
  const zAt = (t, A, p) => [A * Math.cos(st.w * t + p), A * Math.sin(st.w * t + p)];

  // ---- geometry (px)
  const W = 360, Rmax = Math.max(cfg.extent ?? R.amplitude[1] + (show.second ? R.amplitude2[1] : 0), 0.1);
  const Rpx = 74, k = Rpx / Rmax;                                // px per unit
  const wheelCx = show.imTrace ? 92 : W / 2, wheelCy = Rpx + 16, TR = show.trace ? 124 : 0, Hh = 2 * Rpx + 32 + TR;
  const imX0 = 186, imX1 = W - 8, reY0 = wheelCy + Rpx + 14, reY1 = Hh - 8;
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fs-svg', role: 'img', 'aria-label': 'phasor' });

  const arrow = (g, x0, y0, x1, y1, col, w = 2.5) => {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy); if (len < 2) return;
    const ux = dx / len, uy = dy / len, hs = Math.min(8, len * 0.5);
    g.append(s('line', { x1: x0, y1: y0, x2: x1 - ux * hs * 0.6, y2: y1 - uy * hs * 0.6, stroke: col, 'stroke-width': w }),
      s('path', { d: `M${x1},${y1} L${x1 - ux * hs - uy * hs * 0.5},${y1 - uy * hs + ux * hs * 0.5} L${x1 - ux * hs + uy * hs * 0.5},${y1 - uy * hs - ux * hs * 0.5} Z`, fill: col }));
  };

  function paint() {
    const g = s('g'), t = st.t, sm = sum(), cs = comps(), sumMode = cs.length === 2;
    const lab = (x, y, txt, o = {}) => show.labels && g.append(s('text', { x, y, 'font-size': 10, fill: 'var(--muted)', ...o }, txt));
    const px = ([x, y]) => [wheelCx + x * k, wheelCy - y * k];
    // axes
    if (show.axes) {
      g.append(s('line', { x1: wheelCx - Rpx - 4, y1: wheelCy, x2: wheelCx + Rpx + 4, y2: wheelCy, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.7 }),
        s('line', { x1: wheelCx, y1: wheelCy - Rpx - 4, x2: wheelCx, y2: wheelCy + Rpx + 4, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.7 }));
      if (show.trace) g.append(s('line', { x1: wheelCx, y1: reY0, x2: wheelCx, y2: reY1, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.5 }));
      if (show.imTrace) g.append(s('line', { x1: imX0, y1: wheelCy, x2: imX1, y2: wheelCy, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.5 }));
    }
    if (show.axisLabels) {
      lab(wheelCx + Rpx + 3, wheelCy - 4, Lb.re, { 'text-anchor': 'end' });
      lab(wheelCx + 4, wheelCy - Rpx + 6, Lb.im);
      if (show.trace) lab(wheelCx + 6, reY1 + 6, Lb.time, { 'text-anchor': 'start' });
      if (show.imTrace) lab(imX1, wheelCy + 12, Lb.time, { 'text-anchor': 'end' });
    }
    // circle of the main phasor
    if (show.circle) g.append(s('circle', { cx: wheelCx, cy: wheelCy, r: sm.A * k, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '2 4', opacity: 0.8 }));
    // tips
    const tipOf = i => { let x = 0, y = 0; for (let j = 0; j <= i; j++) { const z = zAt(t, cs[j][0], cs[j][1]); x += z[0]; y += z[1]; } return [x, y]; };
    const main = sumMode && show.resultant ? { A: sm.A, p: sm.phi } : { A: cs[0][0], p: cs[0][1] };
    const mz = zAt(t, main.A, main.p), [mx, my] = px(mz);
    if (show.angle && show.arrow) {
      const th = st.w * t + main.p, ra = Math.min(18, Math.max(8, main.A * k * 0.35));
      const n = 24, pts = []; const total = wrap(th) < 0 ? wrap(th) + 2 * PI : wrap(th);
      for (let i = 0; i <= n; i++) { const a = total * i / n; pts.push(`${wheelCx + ra * Math.cos(a)},${wheelCy - ra * Math.sin(a)}`); }
      g.append(s('path', { d: 'M' + pts.join(' L'), fill: 'none', stroke: 'var(--accent)', 'stroke-width': 1.4 }));
      lab(wheelCx + (ra + 3) * Math.cos(total / 2 + 0.01) + (Math.cos(total / 2) < 0 ? -4 : 2), wheelCy - (ra + 3) * Math.sin(total / 2) - 2, Lb.angle, { fill: 'var(--accent)', 'text-anchor': Math.cos(total / 2) < 0 ? 'end' : 'start' });
    }
    // projections and guides
    if (show.projection && show.arrow) {
      if (show.trace) g.append(s('line', { x1: mx, y1: my, x2: mx, y2: reY0, stroke: 'var(--accent)', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }));
      else g.append(s('line', { x1: mx, y1: my, x2: mx, y2: wheelCy, stroke: 'var(--accent)', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }));
      g.append(s('circle', { cx: mx, cy: wheelCy, r: 3.2, fill: 'var(--accent)' }));
    }
    if (show.imProjection && show.arrow) {
      if (show.imTrace) g.append(s('line', { x1: mx, y1: my, x2: imX0, y2: my, stroke: 'var(--good)', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }));
      else g.append(s('line', { x1: mx, y1: my, x2: wheelCx, y2: my, stroke: 'var(--good)', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }));
      g.append(s('circle', { cx: wheelCx, cy: my, r: 3.2, fill: 'var(--good)' }));
    }
    // traces: now at the plane, past away from it
    const N = 160, trace = (A, p, kind, col, wd, dash) => {
      let d = '';
      for (let i = 0; i <= N; i++) {
        const sT = win * i / N, z = zAt(t - sT, A, p);
        const [X, Y] = kind === 're' ? [wheelCx + z[0] * k, reY0 + (reY1 - reY0) * sT / win] : [imX0 + (imX1 - imX0) * sT / win, wheelCy - z[1] * k];
        d += (i ? ' L' : 'M') + X.toFixed(1) + ',' + Y.toFixed(1);
      }
      g.append(s('path', { d, fill: 'none', stroke: col, 'stroke-width': wd, 'stroke-linejoin': 'round', ...(dash ? { 'stroke-dasharray': dash } : {}) }));
    };
    for (const kind of ['re', 'im']) {
      if (kind === 're' ? !show.trace : !show.imTrace) continue;
      const col = kind === 're' ? 'var(--accent)' : 'var(--good)';
      if (sumMode && show.componentTraces) { trace(cs[0][0], cs[0][1], kind, 'var(--basis)', 1.2, '4 3'); trace(cs[1][0], cs[1][1], kind, 'var(--covec)', 1.2, '4 3'); }
      trace(main.A, main.p, kind, col, 2.2);
      if (show.nowDot) g.append(kind === 're' ? s('circle', { cx: wheelCx + mz[0] * k, cy: reY0, r: 3.6, fill: col }) : s('circle', { cx: imX0, cy: wheelCy - mz[1] * k, r: 3.6, fill: col }));
    }
    // arrows
    if (show.arrow) {
      if (sumMode && show.parallelogram) {
        const a = px(zAt(t, cs[1][0], cs[1][1])), b = px(tipOf(1));
        g.append(s('line', { x1: wheelCx, y1: wheelCy, x2: a[0], y2: a[1], stroke: 'var(--covec)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.6 }),
          s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: 'var(--basis)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.6 }));
      }
      if (sumMode) {
        const t1 = px(tipOf(0)), t2 = px(tipOf(1));
        arrow(g, wheelCx, wheelCy, t1[0], t1[1], 'var(--basis)', 2.2);
        arrow(g, t1[0], t1[1], t2[0], t2[1], 'var(--covec)', 2.2);
        if (show.resultant) arrow(g, wheelCx, wheelCy, t2[0], t2[1], 'var(--ink)', 3);
        if (show.labels) {
          lab((wheelCx + t1[0]) / 2 + 4, (wheelCy + t1[1]) / 2 - 4, Lb.z1, { fill: 'var(--basis)', 'font-weight': 700 });
          lab((t1[0] + t2[0]) / 2 + 4, (t1[1] + t2[1]) / 2 - 4, Lb.z2, { fill: 'var(--covec)', 'font-weight': 700 });
        }
      } else arrow(g, wheelCx, wheelCy, mx, my, 'var(--basis)', 3);
      if (show.tip) g.append(s('circle', { cx: mx, cy: my, r: 4, fill: sumMode && show.resultant ? 'var(--ink)' : 'var(--basis)' }));
    }
    svg.replaceChildren(g);
  }

  // ---- readouts and controls
  const reads = (cfg.readouts ?? ['amp', 'phase']);
  const rd = {};
  const names = { amp: Lb.amp, phase: Lb.phaseRead, omega: Lb.omega, period: Lb.period, re: Lb.reRead, im: Lb.imRead, time: Lb.timeRead };
  const readEl = h('div', { class: 'fs-reads' }, reads.map(key => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[key] ?? key)), rd[key] = h('div', { class: 'fs-num', role: 'status' }))));
  const ph = v => (deg ? `${num(v * 180 / PI, 0)}°` : `${num(v, 2)} rad`);
  const slider = (label, min, max, step, get, set, fmt) => {
    const inp = h('input', { type: 'range', min, max, step, 'aria-label': label }), val = h('span', { class: 'fs-num' });
    inp.addEventListener('input', () => { set(+inp.value); update(); });
    const row = h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(label)), inp, val);
    return { row, sync: () => { inp.value = get(); val.textContent = fmt(get()); } };
  };
  const rows = [], syncs = [], second = [];
  const add = (flag, label, rng, get, set, fmt, isSecond) => { if (!flag) return; const o = slider(label, rng[0], rng[1], rng[2], get, set, fmt); rows.push(o.row); syncs.push(o.sync); if (isSecond) second.push(o.row); };
  add(show.ampSlider, Lb.amplitude, R.amplitude, () => st.A1, v => { st.A1 = v; }, v => num(v, 2));
  add(show.omegaSlider, Lb.omega, R.omega, () => st.w, v => { st.w = v; }, v => `${num(v, 2)} ${U.omega}`);
  add(show.phaseSlider, Lb.phase, R.phase, () => st.p1, v => { st.p1 = v; }, ph);
  add(show.amp2Slider && show.second, Lb.amplitude2, R.amplitude2, () => st.A2, v => { st.A2 = v; }, v => num(v, 2), true);
  add(show.phase2Slider && show.second, Lb.phase2, R.phase2, () => st.p2, v => { st.p2 = v; }, ph, true);
  add(show.timeSlider, Lb.timeSlider, [0, win * 2, win / 400], () => st.t, v => { st.t = v; playing = false; }, v => `${num(v, 2)} ${U.time}`);
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  let playBtn = null, modeBtn = null;
  const apply = pr => {
    if (pr.mode != null && show.second) st.mode = pr.mode;
    if (pr.amplitude != null) st.A1 = pr.amplitude;
    if (pr.omega != null) st.w = pr.omega;
    if (pr.phase != null) st.p1 = pr.phase;
    if (pr.amplitude2 != null) st.A2 = pr.amplitude2;
    if (pr.phase2 != null) st.p2 = pr.phase2;
    update();
  };
  const presets = show.presets ? cfg.presets ?? [] : [];
  const btns = h('div', { class: 'wbtns' },
    show.second && show.modeToggle ? (modeBtn = btn(Lb.sumMode, () => { st.mode = st.mode === 'sum' ? 'single' : 'sum'; update(); })) : '',
    show.play ? (playBtn = btn(Lb.pause, () => { playing = !playing; if (playing) loop(); update(); })) : '',
    show.play ? btn(Lb.reset, () => { Object.assign(st, init); update(); }) : '',
    presets.map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', rows.length ? h('div', { class: 'fs-sliders' }, rows) : '', btns);

  function update() {
    const sm = sum(), z = zAt(st.t, sm.A, sm.phi);
    const val = { amp: num(sm.A, 2), phase: ph(sm.phi), omega: `${num(st.w, 2)} ${U.omega}`, period: `${num(2 * PI / st.w, 2)} ${U.time}`, re: num(z[0], 2), im: num(z[1], 2), time: `${num(st.t, 2)} ${U.time}` };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    for (const f of syncs) f();
    for (const r of second) r.style.display = st.mode === 'sum' ? '' : 'none';
    if (modeBtn) { modeBtn.textContent = st.mode === 'sum' ? Lb.single : Lb.sumMode; modeBtn.setAttribute('aria-pressed', st.mode === 'sum'); }
    if (playBtn) playBtn.textContent = playing ? Lb.pause : Lb.play;
    paint();
  }
  function loop() {
    cancelAnimationFrame(raf);
    const tick = now => {
      if (!el.isConnected || !playing) return;
      st.t += Math.min(0.05, (now - last) / 1000) * timeScale; last = now;
      update();
      raf = requestAnimationFrame(tick);
    };
    last = performance.now(); raf = requestAnimationFrame(tick);
  }
  update();
  if (playing) loop();
}
