// flutter-lab
//
// One torsional (twist) mode of a bridge deck in a steady wind: a LINEAR MODEL of self-excited flutter, contrasted with forced resonance. Plain SVG + HTML, every word and unit
// from the config (no course text hard-coded). Parts: the deck cross-section (twists, wind arrows, hanger cables), the effective-damping line against wind speed (critical speed
// marked), the time trace of the twist angle (limit lines).
// Model (time in natural periods, 1/w0; theta = twist angle in degrees; U = wind speed in `units.speed`; Uc = critical speed):
//   theta'' + 2 z_eff theta' + theta = D cos(t)             (forced push at exactly the natural frequency; D = 0 in flutter mode)
//   flutter mode:  z_eff = z_s - k U = z_s (1 - U/Uc),  k = z_s/Uc      (structural damping minus an aerodynamic term growing linearly with U; no push, only the initial kick)
//   forced mode:   z_eff = z_s (fixed, positive),  D = forceStatic * U/Uc  (push proportional to wind; steady amplitude D/(2 z_s) at resonance)
//   z_eff < 0  => amplitude grows like exp(-z_eff w0 t) = exp(2 pi |z_eff|) per period.  `limit` (degrees): reaching it marks the deck as failed and freezes the motion (the model
//   has no nonlinear saturation). RK4, state [theta, theta', phase].
//   Honest labelling: a one-parameter linear caricature of the aerodynamic term (real flutter derivatives depend on reduced velocity U/(f B) and on the section shape).
//
//   mode: 'flutter' | 'forced'      wind (start speed, in units.speed) 0, ucrit: 35, windMax: 2 ucrit, structural damping `damping` (z_s) 0.04, f0 0.2 (Hz), initial: 0.5 (deg kick), limit: 15 (deg), forceStatic: 0.1 (deg per Uc)
//   animPeriod 1.0 (real s per natural period), window 14 (periods in the trace), drawGain 1 (drawn angle = drawGain x angle), units {speed, freq, time, angle}, autoplay true
//   ranges: { wind, damping, ucrit }
//   show: { deck, cables, wind, damping, marker, ucritMark, trace, limitLines, labels, readouts, flag, windSlider, dampingSlider, ucritSlider, modeToggle, play, presets }
//       defaults true except ucritSlider (false). deck = the cross-section (and its rest line); cables = the two hangers; wind = the wind arrows; damping = the z_eff-against-U plot;
//       marker = the dot at the current wind; ucritMark = the vertical line / label at Uc; trace = twist-time plot; limitLines = dashed +/- limit in the trace and a tint of the deck at the limit.
//   readouts: any of  wind, ucrit, natural, period, damping, growth, angle, mode   default [wind, damping, growth, angle]
//   presets: [{ label, mode, wind, damping, ucrit }]  (only given fields; restarts the motion)
//   labels: wind, ucrit, natural, period, damping, growth, angle, mode, flutter, forced, windSlider, dampingSlider, ucritSlider, play, pause, restart, reset, dampPlot, trace, time,
//           perPeriod, failed, growing, decaying, steady, degrees, limit, modeFlutter, modeForced
//   Exported for script checks: effDamping(p), growthFactor(zeta), forcedAmplitude(D, zeta), simulate(p, periods, S0).

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 1) => String(Number((+v).toFixed(d)));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- pure model (exported for script checks) ----------
// p = { mode, U, Uc, zs, forceStatic }
export function effDamping(p) { return p.mode === 'forced' ? p.zs : p.zs * (1 - p.U / p.Uc); }
export function growthFactor(zeta) { return Math.exp(-2 * Math.PI * zeta / Math.sqrt(Math.max(1 - zeta * zeta, 1e-9))); }   // amplitude ratio after one period (exact for the linear ODE)
export function forcedAmplitude(D, zeta) { return D / (2 * zeta); }
export function drive(p) { return p.mode === 'forced' ? p.forceStatic * p.U / p.Uc : 0; }
export function step(S, p, dt) {   // one RK4 step; S = [theta, theta', phase]
  const z = effDamping(p), D = drive(p);
  const f = ([x, v, ph]) => [v, D * Math.cos(ph) - 2 * z * v - x, 1];
  const add = (a, b, k) => a.map((v, i) => v + b[i] * k);
  const k1 = f(S), k2 = f(add(S, k1, dt / 2)), k3 = f(add(S, k2, dt / 2)), k4 = f(add(S, k3, dt));
  return S.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
export function simulate(p, periods, S = [0, 0, 0]) {
  const T = periods * 2 * Math.PI, n = Math.ceil(T / 0.02);
  for (let i = 0; i < n; i++) S = step(S, p, T / n);
  return S;
}

// ---------- widget ----------
export function flutterLab(el, cfg) {
  const Lb = { wind: 'Wind speed', ucrit: 'Critical speed', natural: 'Natural frequency', period: 'Period', damping: 'Effective damping', growth: 'Amplitude change', angle: 'Twist amplitude',
    mode: 'Model', flutter: 'Self-excited (flutter)', forced: 'Forced resonance', windSlider: 'Wind speed', dampingSlider: 'Structural damping', ucritSlider: 'Critical speed',
    play: 'Play', pause: 'Pause', restart: 'Restart', reset: 'Reset', dampPlot: 'effective damping against wind speed', trace: 'twist against time', time: 'time',
    perPeriod: 'per period', failed: 'limit reached', growing: 'growing', decaying: 'decaying', steady: 'steady', degrees: 'deg', limit: 'limit', modeFlutter: 'flutter', modeForced: 'forced',
    ...(cfg.labels ?? {}) };
  const U = { speed: 'm/s', freq: 'Hz', time: 's', angle: '°', ...(cfg.units ?? {}) };
  const show = { deck: true, cables: true, wind: true, damping: true, marker: true, ucritMark: true, trace: true, limitLines: true, labels: true, readouts: true, flag: true,
    windSlider: true, dampingSlider: true, ucritSlider: false, modeToggle: true, play: true, presets: true, ...(cfg.show ?? {}) };
  const init = { mode: cfg.mode ?? 'flutter', U: cfg.wind ?? 0, Uc: cfg.ucrit ?? 35, zs: cfg.damping ?? 0.04 };
  const st = { ...init };
  const f0 = cfg.f0 ?? 0.2, limit = cfg.limit ?? 15, kick = cfg.initial ?? 0.5, forceStatic = cfg.forceStatic ?? 0.1;
  const animPeriod = cfg.animPeriod ?? 1.0, win = cfg.window ?? 14, drawGain = cfg.drawGain ?? 1;
  const R = { wind: [0, (cfg.windMax ?? 2 * init.Uc), init.Uc / 70], damping: [0.005, 0.1, 0.005], ucrit: [init.Uc / 2, init.Uc * 2, init.Uc / 20], ...(cfg.ranges ?? {}) };
  const windMax = () => Math.max(R.wind[1], st.Uc * 1.2);

  const params = () => ({ mode: st.mode, U: st.U, Uc: st.Uc, zs: st.zs, forceStatic });

  const W = 360, DH = show.deck ? 138 : 0, PH = show.damping ? 118 : 0, TR = show.trace ? 104 : 0, Hh = DH + PH + TR + 6;
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fs-svg', role: 'img', 'aria-label': 'bridge deck twist' });
  let S = [kick, 0, 0], hist = [], tNow = 0, failed = false;
  const restart = () => { S = [kick, 0, 0]; hist = []; tNow = 0; failed = false; };

  const lab = (g0, x, y, txt, o = {}) => show.labels && g0.append(s('text', { x, y, 'font-size': 9.5, fill: 'var(--muted)', ...o }, txt));
  const arrowR = (g0, x0, y, len, col) => {
    g0.append(s('line', { x1: x0, y1: y, x2: x0 + len - 4, y2: y, stroke: col, 'stroke-width': 2.2 }), s('path', { d: `M${x0 + len},${y} L${x0 + len - 7},${y - 3.5} L${x0 + len - 7},${y + 3.5} Z`, fill: col }));
  };

  function paintDeck(g0, q) {
    const cx = 215, cy = 78, hw = 66, th = 7, ang = clamp(q.theta, -90, 90) * drawGain;
    const atLimit = failed && show.limitLines;
    g0.append(s('line', { x1: cx - hw - 12, y1: cy, x2: cx + hw + 12, y2: cy, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.7 }));
    const rot = (x, y) => { const a = ang * Math.PI / 180; return [cx + x * Math.cos(a) + y * Math.sin(a), cy - x * Math.sin(a) + y * Math.cos(a)]; };   // positive angle = right edge up
    if (show.cables) for (const sx of [-1, 1]) { const [ex, ey] = rot(sx * hw, -th / 2); g0.append(s('line', { x1: cx + sx * hw * 0.92, y1: 10, x2: ex, y2: ey, stroke: 'var(--muted)', 'stroke-width': 1.4 }), s('circle', { cx: cx + sx * hw * 0.92, cy: 10, r: 2.5, fill: 'var(--muted)' })); }
    g0.append(s('g', { transform: `translate(${cx} ${cy}) rotate(${-ang})` },
      s('rect', { x: -hw, y: -th / 2, width: 2 * hw, height: th, rx: 2, fill: atLimit ? 'var(--bad)' : 'var(--basis)', opacity: 0.9, stroke: 'var(--ink)', 'stroke-width': 1.5 }),
      s('circle', { cx: 0, cy: 0, r: 2.2, fill: 'var(--ink)' })));
    if (show.wind) {
      const n = clamp(Math.round(q.U / st.Uc * 3), 0, 6);
      for (let i = 0; i < 3; i++) if (q.U > 0.02 * st.Uc) arrowR(g0, 14, cy - 18 + i * 18, 14 + 40 * clamp(q.U / windMax(), 0, 1) * (n ? 1 : 0.5) + 6, 'var(--covec)');
      lab(g0, 14, cy + 44, `${num(q.U, 0)} ${U.speed}`, { fill: 'var(--covec)', 'font-weight': 650 });
    }
    lab(g0, cx + hw + 14, cy - 4, `${num(q.theta, 1)}${U.angle}`, { 'text-anchor': 'start', 'font-weight': 650 });
    if (atLimit) lab(g0, cx, DH - 6, Lb.failed, { 'text-anchor': 'middle', fill: 'var(--bad)', 'font-weight': 700 });
  }

  const CX0 = 38, CX1 = W - 14;
  function paintDamp(g0, oy, q) {
    const y0 = oy + 12, y1 = oy + PH - 20, ym = (y0 + y1) / 2, Um = windMax(), X = u => CX0 + (u / Um) * (CX1 - CX0), zmax = st.zs * 1.25 || 0.05, Y = z => ym - clamp(z / zmax, -1, 1) * (y1 - y0) / 2;
    const flat = st.mode === 'forced', zAt = u => (flat ? st.zs : st.zs * (1 - u / st.Uc));
    g0.append(s('line', { x1: CX0, y1: ym, x2: CX1, y2: ym, stroke: 'var(--muted)', 'stroke-width': 1 }), s('line', { x1: CX0, y1: y0, x2: CX0, y2: y1, stroke: 'var(--muted)', 'stroke-width': 1 }));
    if (!flat) g0.append(s('rect', { x: X(st.Uc), y: ym, width: CX1 - X(st.Uc), height: y1 - ym, fill: 'var(--bad)', opacity: 0.1 }));
    if (show.ucritMark && !flat) { g0.append(s('line', { x1: X(st.Uc), y1: y0, x2: X(st.Uc), y2: y1, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '1.5 3' })); lab(g0, X(st.Uc), y1 + 11, `${Lb.ucrit} ${num(st.Uc, 0)} ${U.speed}`, { 'text-anchor': 'middle' }); }
    g0.append(s('path', { d: `M${X(0)},${Y(zAt(0))} L${X(Um)},${Y(zAt(Um))}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.2 }));
    if (show.marker) { const mx = X(clamp(st.U, 0, Um)); g0.append(s('line', { x1: mx, y1: y0, x2: mx, y2: y1, stroke: 'var(--bad)', 'stroke-width': 1.2, opacity: 0.7 }), s('circle', { cx: mx, cy: Y(q.zeta), r: 5, fill: 'var(--bad)', stroke: 'var(--ink)', 'stroke-width': 1 })); }
    lab(g0, CX0 + 3, y0 + 2, `${Lb.dampPlot} (${U.speed})`); lab(g0, CX0 - 4, ym + 3, '0', { 'text-anchor': 'end' });
  }

  function paintTrace(g0, oy, q) {
    const y0 = oy + 12, y1 = oy + TR - 8, ym = (y0 + y1) / 2, ylim = limit * 1.15, tx = CX0, tw = CX1 - CX0, tStart = tNow - win;
    const Yp = v => ym - clamp(v / ylim, -1, 1) * (y1 - y0) / 2, Xp = t => tx + (t - tStart) / win * tw;
    g0.append(s('line', { x1: CX0, y1: ym, x2: CX1, y2: ym, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.6 }));
    if (show.limitLines) for (const sg of [-1, 1]) g0.append(s('line', { x1: CX0, y1: Yp(sg * limit), x2: CX1, y2: Yp(sg * limit), stroke: 'var(--bad)', 'stroke-width': 1, 'stroke-dasharray': '4 3', opacity: 0.8 }));
    let d = ''; for (const r of hist) { if (r[0] < tStart) continue; d += `${d ? 'L' : 'M'}${Xp(r[0]).toFixed(1)},${Yp(r[1]).toFixed(1)} `; }
    if (d) g0.append(s('path', { d, fill: 'none', stroke: 'var(--basis)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    lab(g0, CX0 + 2, y0 - 2, `${Lb.trace} (${U.angle})`); lab(g0, CX1, y1 + 10, `${Lb.time}: ${num(win / f0, 0)} ${U.time}`, { 'text-anchor': 'end' });
    if (show.limitLines) lab(g0, CX1, Yp(limit) - 2, `${Lb.limit} ${num(limit, 0)}${U.angle}`, { 'text-anchor': 'end', fill: 'var(--bad)' });
  }

  // ---- readouts / controls
  const reads = cfg.readouts ?? ['wind', 'damping', 'growth', 'angle'];
  const rd = {};
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const flagEl = show.flag ? h('div', { class: 'fs-lab', role: 'status', style: 'min-height:1.3em' }) : null;
  const sliders = [], sync = [];
  const add = (flag, label, rng, get, set, fmt) => {
    if (!flag) return;
    const inp = h('input', { type: 'range', min: rng[0], max: rng[1], step: rng[2], 'aria-label': label }), val = h('span', { class: 'fs-num' });
    inp.addEventListener('input', () => { set(+inp.value); update(); });
    sliders.push(h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(label)), inp, val));
    sync.push(() => { inp.value = get(); val.textContent = fmt(get()); });
  };
  add(show.windSlider, Lb.windSlider, R.wind, () => st.U, v => { st.U = v; }, v => `${num(v, 0)} ${U.speed}`);
  add(show.dampingSlider, Lb.dampingSlider, R.damping, () => st.zs, v => { st.zs = v; }, v => num(v, 3));
  add(show.ucritSlider, Lb.ucritSlider, R.ucrit, () => st.Uc, v => { st.Uc = v; }, v => `${num(v, 0)} ${U.speed}`);
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  let playing = cfg.autoplay !== false, playBtn = null, flBtn = null, foBtn = null;
  const presets = show.presets ? cfg.presets ?? [] : [];
  const apply = pr => {
    if (pr.mode != null) st.mode = pr.mode;
    if (pr.wind != null) st.U = pr.wind;
    if (pr.damping != null) st.zs = pr.damping;
    if (pr.ucrit != null) st.Uc = pr.ucrit;
    restart(); update();
  };
  const toggles = [];
  if (show.modeToggle) toggles.push(flBtn = btn(Lb.modeFlutter, () => { st.mode = 'flutter'; restart(); update(); }), foBtn = btn(Lb.modeForced, () => { st.mode = 'forced'; restart(); update(); }));
  const btns = h('div', { class: 'wbtns' }, ...toggles,
    show.play ? (playBtn = btn(Lb.pause, () => { playing = !playing; if (playing) loop(); update(); })) : '',
    show.play ? btn(Lb.restart, () => { restart(); update(); }) : '',
    show.play ? btn(Lb.reset, () => { Object.assign(st, init); restart(); update(); }) : '',
    presets.map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', flagEl ?? '', sliders.length ? h('div', { class: 'fs-sliders' }, sliders) : '', btns);

  function current() {
    const p = params(), zeta = effDamping(p), n = hist.length;
    let amp = Math.abs(S[0]);
    for (let i = Math.max(0, n - 60); i < n; i++) amp = Math.max(amp, Math.abs(hist[i][1]));   // about one period of samples
    return { p, zeta, theta: S[0], amp, U: st.U };
  }
  function paint() {
    const q = current(), g0 = s('g');
    if (show.deck) paintDeck(g0, q);
    if (show.damping) paintDamp(g0, DH, q);
    if (show.trace) paintTrace(g0, DH + PH, q);
    svg.replaceChildren(g0);
  }
  function update() {
    const q = current(), z = q.zeta, g = growthFactor(z);
    const val = { wind: `${num(st.U, 0)} ${U.speed}`, ucrit: `${num(st.Uc, 0)} ${U.speed}`, natural: `${num(f0, 2)} ${U.freq}`, period: `${num(1 / f0, 1)} ${U.time}`,
      damping: num(z, 3), growth: st.mode === 'forced' ? Lb.steady : `×${num(g, 2)} ${Lb.perPeriod}`, angle: `${num(q.amp, 1)}${U.angle}`, mode: st.mode === 'forced' ? Lb.forced : Lb.flutter };
    for (const k of reads) if (rd[k]) rd[k].textContent = val[k] ?? '';
    for (const f of sync) f();
    if (playBtn) playBtn.textContent = playing ? Lb.pause : Lb.play;
    if (flBtn) { flBtn.setAttribute('aria-pressed', st.mode === 'flutter'); foBtn.setAttribute('aria-pressed', st.mode === 'forced'); flBtn.style.fontWeight = st.mode === 'flutter' ? 700 : ''; foBtn.style.fontWeight = st.mode === 'forced' ? 700 : ''; }
    if (flagEl) flagEl.textContent = failed ? Lb.failed : (st.mode === 'forced' ? '' : z < -1e-9 ? Lb.growing : z > 1e-9 ? Lb.decaying : Lb.steady);
    paint();
  }

  let raf = 0, last = 0;
  function loop() {
    cancelAnimationFrame(raf);
    const tick = now => {
      if (!el.isConnected || !playing) return;
      const dtP = Math.min(0.05, (now - last) / 1000) / animPeriod; last = now;
      if (!failed) {
        const p = params(), T = dtP * 2 * Math.PI, n = Math.max(1, Math.ceil(T / 0.03));
        for (let i = 0; i < n; i++) S = step(S, p, T / n);
        tNow += dtP; hist.push([tNow, S[0]]);
        if (Math.abs(S[0]) >= limit) { failed = true; S[0] = clamp(S[0], -limit, limit); hist[hist.length - 1][1] = S[0]; update(); }
        while (hist.length > win * 60 + 60 || (hist.length && hist[0][0] < tNow - win - 0.5)) hist.shift();
      }
      if (!failed && Math.floor(tNow * 8) !== Math.floor((tNow - dtP) * 8)) update(); else paint();
      raf = requestAnimationFrame(tick);
    };
    last = performance.now(); raf = requestAnimationFrame(tick);
  }

  update();
  if (playing) loop();
}
