// feedback-loop
//
// A heated room with a thermostat: time plot of the room temperature, the setpoint,
// the outside temperature (heat leaks to it) and the heater on/off shading. Fixed time
// step, so the run is deterministic. All wording comes from the config.
//
// Physics (Euler, step dt):  T += dt * ( -leak * (T - outside) + power * heater )
//   mode: 'onoff'            heater on when sensed < setpoint - band/2, off when sensed >
//                            setpoint + band/2, unchanged in between (band 0 = plain on/off)
//   mode: 'open'             no sensing: the heater is fixed (config heater: 'on'|'off'; a
//                            button toggles it unless heaterButton: false)
//   setpoint: 21, outside: 5, temp0: 15   starting values (sliders change them live)
//   delay: 0                 sensor lag in minutes: the controller sees T from delay ago
//   band: 0                  hysteresis width (degrees)
//   leak: 0.04, power: 0.8   heat loss per minute per degree; heating in degrees per minute
//   dt: 0.5, duration: 120   time step and visible window, in minutes (the window scrolls)
//   range: [0, 30]           fixed temperature axis; unit: '°C'; decimals: 1
//   showSetpoint, showOutside, showHeater, showSensed   plot layers (showSensed defaults to
//                            true only when delay > 0; showHeater = shading; showSetpoint is
//                            ignored in open mode)
//   readouts: ['room','sensed','setpoint','error','heater']   rows, in order ([] = none;
//                            default: open mode room, outside, heater; onoff all five)
//   sliders: ['setpoint','outside']   which sliders (open mode default: ['outside']; [] = none)
//   setpointRange: [10, 30], outsideRange: [-5, 30]
//   legend: true             key under the plot
//   speed: true              speed button (x1, x2, x4); speedInit: 1
//   autoplay: false          start running on mount
//   presets: [{ label, setpoint, outside, heater, temp0, mode, delay, band }]  buttons that reset
//            the run with those values (any omitted key keeps the config value)
//   labels: { room, sensed, setpoint, outside, error, heater, on, off, time, run, pause, reset,
//             speed, slideSetpoint, slideOutside, heaterToggle }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const W = 480, H = 236, PX0 = 40, PX1 = 470, PY0 = 10, PY1 = 190;

export function feedbackLoop(el, cfg) {
  const [lo, hi] = cfg.range ?? [0, 30], unit = cfg.unit ?? '°C', dec = cfg.decimals ?? 1;
  const dur = cfg.duration ?? 120, dt = cfg.dt ?? 0.5, leak = cfg.leak ?? 0.04, power = cfg.power ?? 0.8;
  const L = { room: 'Room', sensed: 'Sensed', setpoint: 'Setpoint', outside: 'Outside', error: 'Error', heater: 'Heater', on: 'on', off: 'off',
    time: 'time (min)', run: 'Run', pause: 'Pause', reset: 'Reset', speed: 'Speed', slideSetpoint: 'Setpoint', slideOutside: 'Outside',
    heaterToggle: 'Heater', ...(cfg.labels ?? {}) };
  const baseMode = cfg.mode ?? 'onoff';
  const sRange = cfg.setpointRange ?? [10, 30], oRange = cfg.outsideRange ?? [-5, 30];
  const cap = Math.round(dur / dt) + 2;
  let p, S, hist, n, running, speed, timer;
  const params = o => ({ mode: o.mode ?? baseMode, delay: o.delay ?? cfg.delay ?? 0, band: o.band ?? cfg.band ?? 0 });
  function init(o = {}) {
    p = params(o);
    S = { T: o.temp0 ?? cfg.temp0 ?? 15, sp: o.setpoint ?? cfg.setpoint ?? 21, out: o.outside ?? cfg.outside ?? 5,
      heat: (o.heater ?? cfg.heater ?? 'off') === 'on' };
    hist = []; n = 0;
  }
  init();
  const open = () => p.mode === 'open';
  const showSens = () => (cfg.showSensed ?? p.delay > 0) && !open();
  const rows = () => cfg.readouts ?? (open() ? ['room', 'outside', 'heater'] : ['room', 'sensed', 'setpoint', 'error', 'heater']);
  const sliders = () => cfg.sliders ?? (open() ? ['outside'] : ['setpoint', 'outside']);
  const sensed = () => { const nd = Math.round(p.delay / dt); return hist.length ? hist[Math.max(0, hist.length - 1 - nd)].T : S.T; };

  function step() {
    const sens = sensed();
    if (!open()) {
      if (sens < S.sp - p.band / 2) S.heat = true;
      else if (sens > S.sp + p.band / 2) S.heat = false;
    }
    hist.push({ T: S.T, sp: S.sp, out: S.out, heat: S.heat });
    if (hist.length > cap + Math.round(p.delay / dt)) { hist.shift(); n++; }
    S.T += dt * (-leak * (S.T - S.out) + power * (S.heat ? 1 : 0));
  }
  // The sensed value of a sample = T from `delay` ago, recomputed at draw time from the history.
  const sensAt = i => { const nd = Math.round(p.delay / dt); return hist[Math.max(0, i - nd)].T; };

  // --- DOM
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fl-svg', role: 'img', 'aria-label': 'Room temperature over time' });
  const gBg = sv('g'), gData = sv('g');
  svg.append(gBg, gData);
  const yOf = v => PY1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo) * (PY1 - PY0);
  const tickEvery = (hi - lo) > 40 ? 10 : 5;
  for (let v = Math.ceil(lo / tickEvery) * tickEvery; v <= hi; v += tickEvery) {
    gBg.append(sv('line', { x1: PX0, x2: PX1, y1: yOf(v), y2: yOf(v), class: 'fl-grid' }));
    const t = sv('text', { x: PX0 - 5, y: yOf(v) + 4, class: 'fl-tl', 'text-anchor': 'end' }); t.textContent = v; gBg.append(t);
  }
  const unitT = sv('text', { x: 4, y: PY0 + 4, class: 'fl-tl' }); unitT.textContent = unit; gBg.append(unitT);
  const timeT = sv('text', { x: (PX0 + PX1) / 2, y: H - 6, class: 'fl-tl', 'text-anchor': 'middle' }); timeT.textContent = L.time; gBg.append(timeT);
  gBg.append(sv('line', { x1: PX0, x2: PX0, y1: PY0, y2: PY1, class: 'fl-axis' }), sv('line', { x1: PX0, x2: PX1, y1: PY1, y2: PY1, class: 'fl-axis' }));

  const legendItems = () => [
    ['room', L.room, true], ['sensed', L.sensed, showSens()], ['setpoint', L.setpoint, cfg.showSetpoint !== false && !open()],
    ['outside', L.outside, cfg.showOutside !== false], ['heater', `${L.heater} ${L.on}`, cfg.showHeater !== false]].filter(x => x[2]);
  const legend = cfg.legend === false ? null : h('div', { class: 'fl-legend' });
  const rd = h('div', { class: 'readout fl-read', role: 'status' });
  const rdCells = {};
  const cellFor = k => rdCells[k] ??= h('div', { class: 'fl-cell' });
  const mkSlider = (k, [a, b], label) => {
    const inp = h('input', { type: 'range', min: a, max: b, step: 0.5, 'aria-label': label });
    const val = h('span', { class: 'fl-sv' });
    inp.addEventListener('input', () => { S[k] = +inp.value; if (hist.length) hist[hist.length - 1][k] = S[k]; draw(); });
    return { inp, val, k, wrap: h('label', { class: 'fl-slide' }, h('span', { class: 'fl-sl' }, mdInline(label)), inp, val) };
  };
  const sl = [];
  for (const k of ['setpoint', 'outside']) if (sliders().includes(k)) {
    sl.push(mkSlider(k === 'setpoint' ? 'sp' : 'out', k === 'setpoint' ? sRange : oRange, k === 'setpoint' ? L.slideSetpoint : L.slideOutside));
  }
  const btnRun = h('button', { class: 'btn ghost', type: 'button', onclick: () => toggle() });
  const btnSpeed = cfg.speed === false ? null : h('button', { class: 'btn ghost', type: 'button', onclick: () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; draw(); } });
  const btnHeat = open() && cfg.heaterButton !== false ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { S.heat = !S.heat; draw(); } }) : null;
  const btnReset = h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); init(curPreset); fill(); draw(); } });
  let curPreset = {};
  const presetBtns = (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); curPreset = pr; init(pr); fill(); draw(); } }, mdInline(pr.label)));
  const btns = h('div', { class: 'wbtns' }, btnRun, btnReset, btnSpeed, btnHeat, ...presetBtns);
  el.classList.add('fl');
  el.append(svg, legend, rd, ...sl.map(s => s.wrap), btns);

  function fill() { speed = cfg.speedInit ?? 1; running = false; }
  function stop() { running = false; if (timer) { clearInterval(timer); timer = null; } }
  function toggle() {
    if (running) stop();
    else { running = true; timer = setInterval(() => { for (let i = 0; i < speed; i++) step(); draw(); }, 50); }
    draw();
  }

  const f = v => `${v.toFixed(dec)} ${unit}`;
  function draw() {
    gData.replaceChildren();
    const N = hist.length, tNow = (n + N) * dt, tMin = Math.max(0, tNow - dur), span = dur;
    const i0 = Math.max(0, N - Math.round(dur / dt) - 1);
    const xOf = t => PX0 + ((t - tMin) / span) * (PX1 - PX0);
    // time ticks
    for (let t = Math.ceil(tMin / 30) * 30; t <= tMin + span + 1e-9; t += 30) {
      const x = xOf(t); gData.append(sv('line', { x1: x, x2: x, y1: PY1, y2: PY1 + 4, class: 'fl-axis' }));
      const tx = sv('text', { x, y: PY1 + 16, class: 'fl-tl', 'text-anchor': 'middle' }); tx.textContent = t; gData.append(tx);
    }
    if (N > 0) {
      const xs = i => xOf((n + i) * dt);
      if (cfg.showHeater !== false) {
        for (let i = i0; i < N; i++) if (hist[i].heat) {
          let j = i; while (j + 1 < N && hist[j + 1].heat) j++;
          gData.append(sv('rect', { x: xs(i), y: PY0, width: Math.max(1, xs(j + 1) - xs(i)), height: PY1 - PY0, class: 'fl-heat' }));
          i = j;
        }
      }
      const path = (get, cls) => {
        let d = '';
        for (let i = i0; i < N; i++) d += `${i > i0 ? 'L' : 'M'}${xs(i).toFixed(1)} ${yOf(get(i)).toFixed(1)}`;
        gData.append(sv('path', { d, class: cls, fill: 'none' }));
      };
      if (cfg.showOutside !== false) path(i => hist[i].out, 'fl-out');
      if (cfg.showSetpoint !== false && !open()) path(i => hist[i].sp, 'fl-sp');
      if (showSens()) path(i => sensAt(i), 'fl-sens');
      path(i => hist[i].T, 'fl-room');
    }
    // current-value dot
    gData.append(sv('circle', { cx: xOf(tNow), cy: yOf(S.T), r: 4, class: 'fl-dot' }));

    if (legend) legend.replaceChildren(...legendItems().map(([k, t]) => h('span', { class: `fl-key ${k}` }, mdInline(t))));
    const sens = sensed(), cells = [];
    const val = { room: f(S.T), sensed: f(sens), setpoint: f(S.sp), outside: f(S.out), error: `${(S.sp - sens).toFixed(dec)} ${unit}`, heater: S.heat ? L.on : L.off };
    for (const k of rows()) { const c = cellFor(k); c.replaceChildren(h('span', { class: 'fl-lab' }, mdInline(L[k])), ': ', h('b', { class: k === 'heater' ? (S.heat ? 'fl-on' : 'fl-offc') : '' }, val[k])); cells.push(c); }
    rd.replaceChildren(...cells);
    rd.style.display = cells.length ? '' : 'none';
    for (const s of sl) { s.inp.value = S[s.k]; s.val.textContent = f(S[s.k]); }
    btnRun.textContent = running ? L.pause : L.run;
    if (btnSpeed) btnSpeed.textContent = `${L.speed} ×${speed}`;
    if (btnHeat) btnHeat.textContent = `${L.heaterToggle}: ${S.heat ? L.on : L.off}`;
    btnReset.textContent = L.reset;
  }
  fill();
  draw();
  if (cfg.autoplay) toggle();
}
