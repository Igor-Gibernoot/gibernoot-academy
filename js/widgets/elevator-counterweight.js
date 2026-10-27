// elevator-counterweight
//
// A traction elevator: a cabin (empty mass + load) and a counterweight hang on the two sides of a pulley (sheave) driven by a motor.
// Model (ideal): massless rope, frictionless pulley, no air drag, CONSTANT speed v, so every net force is zero.
//   cabin rope tension        T1 = (cabin + load) g
//   counterweight rope tension T2 = counterweight g
//   motor force on the rope at the cabin side (up positive)   F = T1 - T2 = (cabin + load - counterweight) g
//   motor power  P = F * (velocity of the cabin, up positive) = s F v   (s = +1 going up, -1 going down)
//   P > 0: the motor draws energy; P < 0: the motor brakes and regenerates (gives energy back).
//   trip of height `height` takes t = height / v; motor work W = P t = s F height (negative = energy returned).
// Fully general: no course text is hard-coded; every word comes from the config.
//
//   cabin: 500, load: 300, counterweight: 0, speed: 2, dir: 'up'    start values (kg, kg, kg, m/s, 'up' | 'down')
//   g: 9.8, height: 20                         gravity (m/s^2), height of the trip (m) used by the work readout and energy bar
//   ranges: { load: [0,800,10], counterweight: [0,1500,10], speed: [0.5,6,0.5] }   [min, max, step]
//   units: { mass: 'kg', speed: 'm/s', force: 'N' }
//   show: { cabin, counterweight, ropeTensions, motorForce, powerBar, energy, loadSlider, counterweightSlider, speedSlider,
//           directionToggle, shaft, labels, readouts, replay }
//       all default true. cabin / counterweight = the two boxes and their ropes (the counterweight is drawn only when its mass > 0);
//       ropeTensions = an arrow on each rope, length proportional to the tension, with its value; motorForce = an arrow beside the
//       pulley showing the force the motor exerts on the cabin side of the rope (up or down, with the value);
//       powerBar = bar centred on zero, orange to the right = motor draws power, green to the left = regenerating;
//       energy = bar of the motor's energy over the whole trip, same colours, filling as the run plays;
//       *Slider = the sliders; directionToggle = the Up / Down buttons; shaft = the two guide lines of the shaft;
//       labels = masses in the boxes and the bar captions; readouts = the readout cells; replay = the Run button.
//   readouts: ['tension','motorForce','power','work']   any of tension (cabin rope, and counterweight rope if shown), motorForce, power, work, time
//   presets: [{ label, load, counterweight, speed, dir, cabin }]   buttons; only the fields given change
//   labels: { tension, motorForce, power, work, time, load, counterweight, speed, cabin, up, down, run, reset, regen,
//             tensionCabin, tensionCw, force, motorDraws, motorRegen, energyAxis, cabinMass, cwMass }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => String(Number((+v).toFixed(d)));
const sc = (a, unit, k = 3) => { const x = Math.abs(a); return x >= 1e6 ? `${num(a / 1e6, 2)} M${unit}` : x >= 1e4 ? `${num(a / 1e3, 1)} k${unit}` : x >= 1e3 ? `${num(a / 1e3, 2)} k${unit}` : `${num(a, x >= 100 ? 0 : 1)} ${unit}`; };

// Pure model, exported for script checks.  dir: +1 up, -1 down.  F: motor force on the cabin side (up positive).
export function elevatorModel({ cabin = 500, load = 300, counterweight = 0, speed = 2, dir = 1, g = 9.8, height = 20 }) {
  const m = cabin + load, T1 = m * g, T2 = counterweight * g, F = T1 - T2, P = F * dir * speed, t = height / speed;
  return { m, T1, T2, F, P, t, W: P * t, regen: P < -1e-9 };
}

export function elevatorCounterweight(el, cfg) {
  const Lb = { tension: 'Rope tension', motorForce: 'Motor force', power: 'Motor power', work: 'Motor energy for the trip', time: 'Trip time',
    load: 'Load', counterweight: 'Counterweight', speed: 'Speed', cabin: 'Cabin', up: 'Going up', down: 'Going down', run: 'Run', reset: 'Reset',
    draws: 'draws', regen: 'regenerating', tensionCabin: 'cabin', tensionCw: 'counterweight', force: 'F', motorDraws: 'motor draws', motorRegen: 'regenerates',
    energyAxis: 'energy', cabinMass: 'cabin', cwMass: 'counterweight', ...(cfg.labels ?? {}) };
  const show = { cabin: true, counterweight: true, ropeTensions: true, motorForce: true, powerBar: true, energy: true, loadSlider: true, counterweightSlider: true,
    speedSlider: true, directionToggle: true, shaft: true, labels: true, readouts: true, replay: true, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['tension', 'motorForce', 'power', 'work'];
  const U = { mass: 'kg', speed: 'm/s', force: 'N', ...(cfg.units ?? {}) };
  const g = cfg.g ?? 9.8, height = cfg.height ?? 20, duration = cfg.duration ?? 3500;
  const R = { load: [0, 800, 10], counterweight: [0, 1500, 10], speed: [0.5, 6, 0.5], ...(cfg.ranges ?? {}) };
  const init = { cabin: cfg.cabin ?? 500, load: cfg.load ?? 300, counterweight: cfg.counterweight ?? 0, speed: cfg.speed ?? 2, dir: cfg.dir === 'down' ? 'down' : 'up' };
  const st = { ...init };
  const model = q => elevatorModel({ ...q, dir: q.dir === 'up' ? 1 : -1, g, height });
  const cases = [init, ...(cfg.presets ?? []).map(p => ({ ...init, ...p }))];

  // scales fixed by the largest values reachable, so bars do not rescale while a slider moves
  const mMax = Math.max(...cases.map(q => q.cabin + q.load), init.cabin + R.load[1]);
  const cwMax = Math.max(...cases.map(q => q.counterweight), R.counterweight[1]);
  const vMax = Math.max(...cases.map(q => q.speed), R.speed[1]);
  const Fmax = Math.max(mMax, cwMax, 1) * g, loadMax = Math.max(R.load[1], ...cases.map(q => q.load), 1);
  const Pmax = Fmax * vMax, Emax = Fmax * height;

  // geometry (px)
  const W = 360, PX = 180, PY = 54, PR = 45, XL = PX - PR, XR = PX + PR, TOP = 112, BOT = 300, CH = 62, CW = 84;
  const BARY = BOT + 30, EY = BARY + (show.powerBar ? 50 : 0);
  const Hh = (show.energy ? EY + 50 : show.powerBar ? BARY + 46 : BOT + 12);
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.cabin });
  let u = 0, raf = 0, t0 = 0;

  const arrowV = (g0, x, y, len, up, col, txt, tx, anchor) => {   // vertical arrow from (x,y), length len, pointing up or down
    if (len < 1) return;
    const y2 = up ? y - len : y + len, d = up ? 1 : -1;
    g0.append(s('line', { x1: x, y1: y, x2: x, y2: y2 + d * 7, stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }),
      s('polygon', { fill: col, points: `${x},${y2} ${x - 4.5},${y2 + d * 9} ${x + 4.5},${y2 + d * 9}` }));
    if (txt && show.labels) g0.append(s('text', { x: tx, y: (y + y2) / 2 + 3, 'font-size': 9.5, 'text-anchor': anchor, fill: col, 'font-weight': 650 }, txt));
  };

  function paint() {
    const M = model(st), up = st.dir === 'up', p = up ? u : 1 - u;     // p = fraction of the height reached by the cabin
    const g0 = s('g');
    const hasCw = show.counterweight && st.counterweight > 0, hasCab = show.cabin;
    if (show.shaft) {
      g0.append(s('line', { x1: XL - 52, y1: TOP - 8, x2: XL - 52, y2: BOT, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '2 4' }),
        s('line', { x1: XR + 52, y1: TOP - 8, x2: XR + 52, y2: BOT, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '2 4' }),
        s('line', { x1: XL - 56, y1: BOT, x2: XR + 56, y2: BOT, stroke: 'var(--muted)', 'stroke-width': 3 }));
    }
    // pulley
    const rot = (p + (up ? 0 : 0)) * height * 40;
    g0.append(s('circle', { cx: PX, cy: PY, r: PR, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 }), s('circle', { cx: PX, cy: PY, r: 4, fill: 'var(--ink)' }));
    for (let k = 0; k < 3; k++) { const a = (rot + k * 60) * Math.PI / 180; g0.append(s('line', { x1: PX - PR * 0.9 * Math.cos(a), y1: PY - PR * 0.9 * Math.sin(a), x2: PX + PR * 0.9 * Math.cos(a), y2: PY + PR * 0.9 * Math.sin(a), stroke: 'var(--muted)', 'stroke-width': 1.5 })); }
    // cabin
    const cabY = TOP + (1 - p) * (BOT - CH - TOP);
    if (hasCab) {
      g0.append(s('line', { x1: XL, y1: PY, x2: XL, y2: cabY, stroke: 'var(--ink)', 'stroke-width': 2 }));
      g0.append(s('rect', { x: XL - CW / 2, y: cabY, width: CW, height: CH, rx: 3, fill: 'none', stroke: 'var(--vec)', 'stroke-width': 3 }));
      const lh = (CH - 6) * Math.min(1, st.load / loadMax);
      if (lh > 0.5) g0.append(s('rect', { x: XL - CW / 2 + 3, y: cabY + CH - 3 - lh, width: CW - 6, height: lh, fill: 'var(--vec)', opacity: 0.55 }));
      if (show.labels) g0.append(s('text', { x: XL, y: cabY + CH / 2 + 4, 'font-size': 10.5, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 650 }, `${num(M.m, 0)} ${U.mass}`));
    }
    // counterweight
    const cwH = 22 + 44 * Math.min(1, st.counterweight / Math.max(cwMax, 1)), cwW = 40, cwY = TOP + p * (BOT - cwH - TOP);
    if (hasCw) {
      g0.append(s('line', { x1: XR, y1: PY, x2: XR, y2: cwY, stroke: 'var(--ink)', 'stroke-width': 2 }));
      g0.append(s('rect', { x: XR - cwW / 2, y: cwY, width: cwW, height: cwH, rx: 2, fill: 'var(--basis)', opacity: 0.8 }));
      if (show.labels) g0.append(s('text', { x: XR, y: cwY + cwH / 2 + 4, 'font-size': 10, 'text-anchor': 'middle', fill: '#fff', 'font-weight': 650 }, `${num(st.counterweight, 0)}`));
    }
    // tension arrows (on the ropes, above the boxes); length proportional to the tension
    if (show.ropeTensions) {
      if (hasCab) arrowV(g0, XL, cabY, 8 + 36 * M.T1 / Fmax, true, 'var(--covec)', sc(M.T1, U.force), XL - 6, 'end');
      if (hasCw) arrowV(g0, XR, cwY, 8 + 36 * M.T2 / Fmax, true, 'var(--basis)', sc(M.T2, U.force), XR + 6, 'start');
    }
    // motor force: arrow beside the pulley on the cabin side
    if (show.motorForce) {
      const x = 28, len = 6 + 30 * Math.min(1, Math.abs(M.F) / Fmax);
      if (Math.abs(M.F) > 1e-6) arrowV(g0, x, PY + (M.F > 0 ? len / 2 : -len / 2), len, M.F > 0, 'var(--good)', '', 0, 'start');
      if (show.labels) g0.append(s('text', { x: 28, y: PY - 24, 'font-size': 10, 'text-anchor': 'middle', fill: 'var(--good)', 'font-weight': 650 }, Lb.force),
        s('text', { x: 28, y: PY + 36, 'font-size': 9.5, 'text-anchor': 'middle', fill: 'var(--good)', 'font-weight': 650 }, sc(Math.abs(M.F), U.force)));
    }
    svg.append(g0);
    // bars centred on zero: orange right = draws, green left = regenerates
    const bar = (y, val, vmax, capL, capR, valTxt) => {
      const bx = 24, bw = W - 48, mid = bx + bw / 2, w = Math.min(1, Math.abs(val) / vmax) * bw / 2, bg = s('g');
      bg.append(s('rect', { x: bx, y, width: bw, height: 16, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1 }));
      if (w > 0.3) bg.append(s('rect', { x: val >= 0 ? mid : mid - w, y, width: w, height: 16, fill: val >= 0 ? 'var(--covec)' : 'var(--good)' }));
      bg.append(s('line', { x1: mid, y1: y - 3, x2: mid, y2: y + 19, stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      bg.append(s('text', { x: mid + (val >= 0 ? 4 : -4), y: y + 11.5, 'font-size': 9.5, 'text-anchor': val >= 0 ? 'start' : 'end', fill: w > 44 ? '#fff' : 'var(--ink)', 'font-weight': 650 },
        w > 44 ? valTxt : ''));
      if (w <= 44) bg.append(s('text', { x: val >= 0 ? mid + w + 4 : mid - w - 4, y: y + 11.5, 'font-size': 9.5, 'text-anchor': val >= 0 ? 'start' : 'end', fill: 'var(--ink)', 'font-weight': 650 }, valTxt));
      if (show.labels) bg.append(s('text', { x: bx, y: y + 29, 'font-size': 9.5, fill: 'var(--good)', 'font-weight': 650 }, capL), s('text', { x: bx + bw, y: y + 29, 'font-size': 9.5, 'text-anchor': 'end', fill: 'var(--covec)', 'font-weight': 650 }, capR));
      svg.append(bg);
    };
    if (show.powerBar) bar(BARY, M.P, Pmax, `← ${Lb.motorRegen}`, `${Lb.motorDraws} →`, sc(M.P, 'W'));
    if (show.energy) bar(EY, M.W * u, Emax, `← ${Lb.motorRegen}`, `${Lb.energyAxis} (${num(height, 0)} m) →`, sc(M.W * u, 'J'));
    // readouts
    const state = M.P < -1e-9 ? ` (${Lb.regen})` : '';
    const val = {
      tension: show.counterweight && st.counterweight > 0 ? `${Lb.tensionCabin} ${sc(M.T1, U.force)}, ${Lb.tensionCw} ${sc(M.T2, U.force)}` : sc(M.T1, U.force),
      motorForce: `${sc(Math.abs(M.F), U.force)} ${M.F > 1e-9 ? '↑' : M.F < -1e-9 ? '↓' : ''}`,
      power: `${sc(M.P, 'W')}${state}`, work: `${sc(M.W, 'J')}${state}`, time: `${num(M.t, 1)} s`,
    };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    for (const [key, inp] of Object.entries(inps)) { inp.value = st[key]; vals[key].textContent = key === 'speed' ? `${num(st.speed, 1)} ${U.speed}` : `${num(st[key], 0)} ${U.mass}`; }
    for (const [d, b] of Object.entries(dirBtns)) b.setAttribute('aria-pressed', String(d === st.dir));
  }

  // controls
  const rd = {}, inps = {}, vals = {}, dirBtns = {};
  const names = { tension: Lb.tension, motorForce: Lb.motorForce, power: Lb.power, work: Lb.work, time: Lb.time };
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const sliderKeys = [show.loadSlider && 'load', show.counterweightSlider && 'counterweight', show.speedSlider && 'speed'].filter(Boolean);
  const sliderEls = sliderKeys.map(key => {
    const [lo, hi, step] = R[key];
    const inp = inps[key] = h('input', { type: 'range', min: lo, max: hi, step, value: st[key], 'aria-label': Lb[key] });
    inp.addEventListener('input', () => { st[key] = +inp.value; play(); });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb[key])), inp, vals[key] = h('span', { class: 'fs-num' }));
  });
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const dirs = show.directionToggle ? ['up', 'down'].map(d => { const b = btn(Lb[d], () => { st.dir = d; play(); }); b.setAttribute('aria-pressed', 'true'); return dirBtns[d] = b; }) : [];
  const apply = pr => { for (const key of ['cabin', 'load', 'counterweight', 'speed', 'dir']) if (pr[key] != null) st[key] = pr[key]; play(); };
  const btns = h('div', { class: 'wbtns' }, show.replay ? btn(Lb.run, () => play()) : '', dirs,
    btn(Lb.reset, () => { Object.assign(st, init); play(); }), (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
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
