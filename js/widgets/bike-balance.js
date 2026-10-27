// bike-balance
//
// A bicycle seen from behind as an inverted pendulum with steering feedback.
// Lean angle phi (rad, positive = to the right) obeys the standard simplified
// bicycle model (rider's mass at height h, wheelbase l, forward speed v):
//
//   phi'' = (g/h) phi - (v^2 / (h l)) delta         (falling vs. wheels moving under you)
//   delta = clip( gain * (phi + tau * phi'), +-maxSteer )   (steer into the fall)
//
// delta is the steering angle (positive = right); the bike then follows a circle of radius
// R = l / tan(delta) and the sideways acceleration v^2/R moves the wheels under the mass.
// gain = 0 means hands off, steering locked straight. Fixed time step (dt = 0.005 s, semi-implicit
// Euler), fully deterministic. The bike falls when |phi| > 45 degrees.
//
//   speed: 1, gain: 0         start values (m/s, dimensionless)
//   duration: 8               seconds shown on the plot (fixed time axis)
//   nudge: true               show the "Nudge" button (a sideways push: phi' += nudgeSize)
//   nudgeSize: 0.8            rad/s added to the lean rate by one push
//   autoplay: true            start at once with a push at 0.5 s; false = wait for "Nudge"
//   sliders: ['speed','gain'] which sliders; speedRange: [0,10], gainRange: [0,4]
//   height: 1, wheelbase: 1, tau: 0.3, maxSteer: 0.6   (m, m, s, rad) model constants
//   show: { lean, wheel, plot, turnArc, readouts }   each false hides that part (default true)
//   readouts: ['lean','steer','speed','verdict']      which readouts, in order
//   presets: [{ label, speed, gain }]   sets the sliders and restarts
//   labels: { speed, gain, nudge, reset, lean, steer, verdict, balancing, upright, fell,
//             time, bike, turn, plot }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const G = 9.8, DT = 0.005, FALL = Math.PI / 4;

// Pure, deterministic simulation. events: [{t, w}] pushes. Returns {phi:[...], steer:[...], fell: time|null}.
export function simulate({ speed, gain, height = 1, wheelbase = 1, tau = 0.3, maxSteer = 0.6 }, events, duration, phi0 = 0) {
  const n = Math.round(duration / DT), phi = [phi0], steer = [0];
  let p = phi0, w = 0, fell = null;
  const ev = events.map(e => ({ ...e, k: Math.round(e.t / DT) }));
  for (let i = 1; i <= n; i++) {
    for (const e of ev) if (e.k === i) w += e.w;
    const d = Math.max(-maxSteer, Math.min(maxSteer, gain * (p + tau * w)));
    w += ((G / height) * p - (speed * speed / (height * wheelbase)) * d) * DT;
    p += w * DT;
    phi.push(p); steer.push(d);
    if (Math.abs(p) > FALL) { fell = i * DT; break; }
  }
  return { phi, steer, fell };
}

export function bikeBalance(el, cfg) {
  const L = { speed: 'Speed', gain: 'Steer into the fall', nudge: 'Nudge', reset: 'Reset', lean: 'Lean', steer: 'Steering',
    verdict: 'Verdict', balancing: 'Balancing', upright: 'Stays upright', fell: 'Falls', time: 'time (s)', bike: 'Back view',
    turn: 'Seen from above', plot: 'Lean angle', ...(cfg.labels ?? {}) };
  const show = { lean: true, wheel: true, plot: true, turnArc: true, readouts: true, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['lean', 'steer', 'speed', 'verdict'];
  const sliders = cfg.sliders ?? ['speed', 'gain'];
  const T = cfg.duration ?? 8, nudgeSize = cfg.nudgeSize ?? 0.8, hasNudge = cfg.nudge !== false;
  const model = { height: cfg.height ?? 1, wheelbase: cfg.wheelbase ?? 1, tau: cfg.tau ?? 0.3, maxSteer: cfg.maxSteer ?? 0.6 };
  const [sLo, sHi] = cfg.speedRange ?? [0, 10], [gLo, gHi] = cfg.gainRange ?? [0, 4];
  const par = { speed: cfg.speed ?? 1, gain: cfg.gain ?? 0 };
  const NS = 'http://www.w3.org/2000/svg';
  const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
  const deg = r => r * 180 / Math.PI;

  let events = [], sim, t = 0, running = false, last = 0, raf = 0;
  const restart = auto => {
    events = auto ? [{ t: 0.5, w: nudgeSize }] : [];
    t = 0; running = auto; last = performance.now();
    sim = simulate({ ...par, ...model }, events, T); draw(); loop();
  };
  const resim = () => { sim = simulate({ ...par, ...model }, events, T); };

  // ---- parts
  const parts = [];
  // back view
  const sc = 70 / model.height, px = 100, py = 128;
  const bikeG = s('g'), rod = s('line', { x1: 0, y1: 0, x2: 0, y2: -sc * model.height, stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round' });
  const mass = s('circle', { cx: 0, cy: -sc * model.height, r: 9, fill: 'var(--covec)' });
  const wheel = s('ellipse', { cx: 0, cy: -34, rx: 4, ry: 34, fill: 'none', stroke: 'var(--vec)', 'stroke-width': 3 });
  const vert = s('line', { x1: px, y1: py, x2: px, y2: py - sc * model.height - 14, stroke: 'var(--muted)', 'stroke-dasharray': '4 4', 'stroke-width': 1.5 });
  const arc = s('path', { fill: 'none', stroke: 'var(--basis)', 'stroke-width': 2 });
  if (show.wheel) bikeG.append(wheel);
  if (show.lean) bikeG.append(rod, mass);
  const bikeSvg = s('svg', { viewBox: '0 0 200 150', class: 'bb-svg', role: 'img', 'aria-label': L.bike },
    s('line', { x1: 10, y1: py, x2: 190, y2: py, stroke: 'var(--muted)', 'stroke-width': 2 }),
    ...(show.lean ? [vert, arc] : []), bikeG);
  const fig = (svg, cap) => h('figure', { class: 'bb-fig' }, svg, h('figcaption', {}, mdInline(cap)));
  if (show.lean || show.wheel) parts.push(fig(bikeSvg, L.bike));

  // top view
  const ty = 112, tsc = 36 / model.wheelbase;
  const front = s('line', { stroke: 'var(--vec)', 'stroke-width': 4, 'stroke-linecap': 'round' });
  const circle = s('circle', { fill: 'none', stroke: 'var(--basis)', 'stroke-width': 2, 'stroke-dasharray': '5 4' });
  const straight = s('line', { x1: 100, y1: ty, x2: 100, y2: 0, stroke: 'var(--basis)', 'stroke-width': 2, 'stroke-dasharray': '5 4' });
  const topSvg = s('svg', { viewBox: '0 0 200 150', class: 'bb-svg', role: 'img', 'aria-label': L.turn }, circle, straight,
    s('line', { x1: 100, y1: ty, x2: 100, y2: ty - tsc * model.wheelbase, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    s('line', { x1: 94, y1: ty, x2: 106, y2: ty, stroke: 'var(--vec)', 'stroke-width': 4, 'stroke-linecap': 'round' }), front);
  if (show.turnArc) parts.push(fig(topSvg, L.turn));

  // plot
  const W = 320, H = 150, m = { l: 34, r: 8, t: 8, b: 22 };
  const X = tt => m.l + (tt / T) * (W - m.l - m.r), Y = a => m.t + (1 - (a + 45) / 90) * (H - m.t - m.b);
  const curve = s('polyline', { fill: 'none', stroke: 'var(--covec)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
  const dot = s('circle', { r: 4, fill: 'var(--covec)' });
  const txt = (x, y, str, anchor = 'end') => s('text', { x, y, 'text-anchor': anchor, 'font-size': 11, fill: 'var(--muted)' }, str);
  const plotSvg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'bb-svg bb-plot', role: 'img', 'aria-label': L.plot },
    s('rect', { x: m.l, y: Y(45), width: W - m.l - m.r, height: Y(-45) - Y(45), fill: 'none', stroke: 'var(--line)' }),
    s('line', { x1: m.l, y1: Y(0), x2: W - m.r, y2: Y(0), stroke: 'var(--muted)', 'stroke-width': 1 }),
    s('line', { x1: m.l, y1: Y(45), x2: W - m.r, y2: Y(45), stroke: 'var(--bad)', 'stroke-dasharray': '4 3' }),
    s('line', { x1: m.l, y1: Y(-45), x2: W - m.r, y2: Y(-45), stroke: 'var(--bad)', 'stroke-dasharray': '4 3' }),
    txt(m.l - 4, Y(45) + 4, '45°'), txt(m.l - 4, Y(0) + 4, '0°'), txt(m.l - 4, Y(-45) + 4, '−45°'),
    txt(X(0), H - 8, '0', 'middle'), txt(X(T), H - 8, String(T), 'middle'), txt((X(0) + X(T)) / 2, H - 8, L.time, 'middle'),
    curve, dot);
  if (show.plot) parts.push(fig(plotSvg, L.plot));

  // readouts
  const rd = {};
  const names = { lean: L.lean, steer: L.steer, speed: L.speed, verdict: L.verdict };
  const readEl = h('div', { class: 'bb-reads' }, reads.map(k => h('div', { class: 'bb-cell' },
    h('div', { class: 'bb-lab' }, mdInline(names[k] ?? k)), rd[k] = h('div', { class: 'bb-num', role: k === 'verdict' ? 'status' : null }))));

  // controls
  const ctl = {};
  const mkSlider = (k, label, lo, hi, step) => {
    const inp = h('input', { type: 'range', min: lo, max: hi, step, value: par[k], 'aria-label': label });
    const val = h('span', { class: 'bb-num' });
    const sync = () => { val.textContent = k === 'speed' ? `${(+par.speed).toFixed(1)} m/s` : (+par.gain).toFixed(1); };
    inp.addEventListener('input', () => { par[k] = +inp.value; sync(); restart(cfg.autoplay !== false); });
    ctl[k] = { inp, sync }; sync();
    return h('label', { class: 'bb-slide' }, h('span', { class: 'bb-lab' }, mdInline(label)), inp, val);
  };
  const sl = [];
  if (sliders.includes('speed')) sl.push(mkSlider('speed', L.speed, sLo, sHi, 0.5));
  if (sliders.includes('gain')) sl.push(mkSlider('gain', L.gain, gLo, gHi, 0.1));
  const btn = (txt2, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt2));
  const push = () => {
    if (!running || t >= T || sim.fell != null) { restart(false); events = [{ t: 0.3, w: nudgeSize }]; resim(); running = true; last = performance.now(); loop(); return; }
    events.push({ t: Math.round(t / DT) * DT, w: nudgeSize }); resim();
  };
  const setPar = (k, v) => { if (v == null) return; par[k] = v; if (ctl[k]) { ctl[k].inp.value = v; ctl[k].sync(); } };
  const btns = h('div', { class: 'wbtns' },
    hasNudge ? btn(L.nudge, push) : '',
    btn(L.reset, () => restart(cfg.autoplay !== false)),
    (cfg.presets ?? []).map(pr => btn(pr.label, () => { setPar('speed', pr.speed); setPar('gain', pr.gain); restart(true); })));

  el.append(h('div', { class: 'bb-figs' }, parts), show.readouts && reads.length ? readEl : '', sl.length ? h('div', { class: 'bb-sliders' }, sl) : '', btns);

  function draw() {
    const i = Math.min(sim.phi.length - 1, Math.round(t / DT));
    const p = sim.phi[i], d = sim.steer[i];
    bikeG.setAttribute('transform', `translate(${px} ${py}) rotate(${deg(p)})`);
    const r = 36, a = p;
    arc.setAttribute('d', Math.abs(a) < 0.01 ? '' : `M ${px} ${py - r} A ${r} ${r} 0 0 ${a > 0 ? 1 : 0} ${px + r * Math.sin(a)} ${py - r * Math.cos(a)}`);
    // top view: front wheel turned by d, circle of radius l / tan(d) centred beside the rear contact point
    const fx = 100, fy = ty - tsc * model.wheelbase, c = Math.cos(d), sn = Math.sin(d);
    front.setAttribute('x1', fx - 6 * c); front.setAttribute('y1', fy + 6 * sn); front.setAttribute('x2', fx + 6 * c); front.setAttribute('y2', fy - 6 * sn);
    const small = Math.abs(d) < 0.004;
    straight.style.display = small ? '' : 'none'; circle.style.display = small ? 'none' : '';
    if (!small) { const R = tsc * model.wheelbase / Math.tan(d); circle.setAttribute('cx', 100 + R); circle.setAttribute('cy', ty); circle.setAttribute('r', Math.abs(R)); }
    // plot
    const pts = []; const step = Math.max(1, Math.round(0.02 / DT));
    for (let k = 0; k <= i; k += step) pts.push(`${X(k * DT).toFixed(1)},${Y(deg(sim.phi[k])).toFixed(1)}`);
    pts.push(`${X(i * DT).toFixed(1)},${Y(deg(p)).toFixed(1)}`);
    curve.setAttribute('points', pts.join(' '));
    dot.setAttribute('cx', X(i * DT)); dot.setAttribute('cy', Y(deg(p)));
    const fell = sim.fell != null && t >= sim.fell;
    const done = t >= T && !fell;
    if (rd.lean) rd.lean.textContent = `${deg(p).toFixed(1)}°`;
    if (rd.steer) rd.steer.textContent = `${deg(d).toFixed(1)}°`;
    if (rd.speed) rd.speed.textContent = `${(+par.speed).toFixed(1)} m/s`;
    if (rd.verdict) {
      rd.verdict.textContent = fell ? `${L.fell} (${sim.fell.toFixed(1)} s)` : done ? L.upright : L.balancing;
      rd.verdict.className = `bb-num ${fell ? 'bad' : done ? 'ok' : ''}`;
    }
  }
  function loop() {
    cancelAnimationFrame(raf);
    const tick = now => {
      if (!el.isConnected && raf) return;
      t = Math.min(T, t + (now - last) / 1000); last = now;
      if (sim.fell != null) t = Math.min(t, sim.fell);
      draw();
      if (running && t < T && !(sim.fell != null && t >= sim.fell)) raf = requestAnimationFrame(tick); else running = false;
    };
    if (running) raf = requestAnimationFrame(tick);
  }
  restart(cfg.autoplay !== false);
}
