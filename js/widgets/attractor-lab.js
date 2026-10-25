// attractor-lab
//
// Movement as fulfilled proprioceptive predictions (Ch. 8, Eq. 8.1-8.5, Fig. 8.1).
// A limb with real position x (the generative PROCESS, has action u) and an agent whose
// MODEL (no u) pulls x toward the target v. Belief mu tracks x through the sensed data y = x.
//
//  mode 'first'  (Eq. 8.3 model, Eq. 8.4 process)      model: g = x, f = v - x     process: y = x, xdot = u
//      u = G (v - mu)                                   (G = actionGain, 1 = the book's u = v - mu)
//      mudot = (v - mu) + Pi_y (x - mu)                 (precision Pi_y relative to Pi_x = 1)
//      xdot = u.     In the (a,b) = (v-mu, v-x) variables the rates are -1 and -Pi_y (G = 1):
//      the approach is exp(-t min(1, Pi_y)): more sensory precision does NOT speed it up.
//  mode 'spring' (Eq. 8.5 model, Newton process)       model: x1dot = x2, x2dot = (kappa/m)(v - x1) - b x2
//      process: x1dot = x2, x2dot = u - c x2            (b = damping, c = friction; b = 0 is exactly Eq. 8.5)
//      u = (kappa/m)(v - mu1) - b mu2                   (the acceleration the model predicts)
//      mu1dot = mu2 + Pi_y e,  mu2dot = f2(mu) + (Pi_y^2/4) e,   e = x1 - mu1   (position-only data;
//      the gains put both poles of the belief error at -Pi_y/2)
//  Deterministic (no noise), RK4, dt = 0.002 s, horizon T.
//
// Config (every key can also sit in a preset; a preset overrides the config):
//   modes: ['first', 'spring']   mode buttons (one entry: no buttons)         mode: first one
//   v: 2, x0: 0                  target and start position
//   mu0: x0                      initial belief (default = x0: no sensory error ever, so Pi_y changes nothing;
//                                set mu0 != x0 or a push to see what precision does)
//   push: { t: 4, dx: -1 }       at time t the limb is pushed by dx (an external disturbance)                    range: [-1, 3] position axis
//   Pi: 1, PiRange: [0.1, 30]    sensory precision (log slider)
//   kappa: 4, m: 1               spring constant and mass (kappa/m = omega0^2)
//   damping: 0.8, friction: 0    b (model) and c (process)
//   actionGain: 1                G of the first-order mode
//   T: 8, speed: 1.5             horizon (s) and simulated seconds per real second
//   show: { v, x0, mu0, Pi, kappa, m, damping, friction } = true/false        which sliders (all true except
//                                mu0 and friction; mass/kappa/damping only in spring mode; actionGain never)
//   showPhase: true, showAction: true, autoplay: false
//   labels: { v, x0, Pi, kappa, m, damping, friction, play, pause, reset, position, action, phase,
//             x, mu, u, target, time, modeFirst, modeSpring, over, t90, settle, final, flow }
//   presets: [{ label, mode, ..any key above.. }]

import { h } from '../dom.js';
import { mdInline, tex } from '../render.js';

const M = s => h('span', { html: mdInline(String(s)) });
const T = s => h('span', { html: tex(String(s)) });
const DT = 0.002, REC = 5;
const f2 = (x, d = 2) => (Math.abs(x) < 5 * 10 ** -(d + 1) ? 0 : x).toFixed(d);

// exported for tests: one RK4 step of the closed loop
export function derivs(mode, p, s, v) {
  if (mode === 'first') {
    const [x, , mu] = s, u = p.actionGain * (v - mu);
    return { d: [u, 0, (v - mu) + p.Pi * (x - mu), 0], u };
  }
  const [x1, x2, m1, m2] = s, w2 = p.kappa / p.m, f = w2 * (v - m1) - p.damping * m2, u = f, e = x1 - m1;
  return { d: [x2, u - p.friction * x2, m2 + p.Pi * e, f + 0.25 * p.Pi * p.Pi * e], u };
}
export function rk4(mode, p, s, v, dt) {
  const k1 = derivs(mode, p, s, v).d;
  const k2 = derivs(mode, p, s.map((x, i) => x + 0.5 * dt * k1[i]), v).d;
  const k3 = derivs(mode, p, s.map((x, i) => x + 0.5 * dt * k2[i]), v).d;
  const k4 = derivs(mode, p, s.map((x, i) => x + dt * k3[i]), v).d;
  return s.map((x, i) => x + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

export function attractorLab(el, cfg) {
  const presets = cfg.presets ?? [];
  const L = { v: 'v', x0: 'x_0', mu0: '\\mu_0', Pi: '\\Pi_y', kappa: '\\kappa', m: 'm', damping: 'b', friction: 'c',
    play: 'Play', pause: 'Pause', reset: 'Reset', position: 'Position against time (s)', action: 'Action $u$ against time (s)', phase: 'Phase portrait: $x$ across, velocity up',
    x: '$x$ (limb)', mu: '$\\mu$ (belief)', u: '$u$ (action)', target: '$v$ (target)', time: 't',
    modeFirst: 'First order', modeSpring: 'Spring', over: 'Overshoot', t90: 'Time to 90%', settle: 'Settled (5%)',
    final: 'x at the end', flow: 'model flow', ...(cfg.labels ?? {}) };
  const modes = cfg.modes ?? ['first', 'spring'];
  let P, mode, tcur, pushed, rec, S, running = false, raf = null, last = 0, pidx = -1, sp;
  const ui = {};

  const range = () => P.range ?? [-1, 3];
  const defaults = { v: 2, x0: 0, Pi: 1, PiRange: [0.1, 30], kappa: 4, m: 1, damping: 0.8, friction: 0, actionGain: 1, T: 8, speed: 1.5 };
  function load(i) {
    stop(); pidx = i;
    P = { ...defaults, ...cfg, ...(i >= 0 ? presets[i] : {}) };
    sp = { v: true, x0: true, mu0: false, Pi: true, kappa: true, m: true, damping: true, friction: false, ...(P.show ?? {}) };
    mode = modes.includes(P.mode) ? P.mode : modes[0];
    build(); precompute(); draw();
    if (P.autoplay) startFresh();
  }
  const init = () => [P.x0, 0, P.mu0 ?? P.x0, 0];
  function reset() { S = init(); tcur = 0; rec = []; pushed = false; record(); }
  function record() {
    const { u } = derivs(mode, P, S, P.v);
    rec.push({ t: tcur, x: S[0], x2: mode === 'first' ? u : S[1], m: S[2], m2: S[3], u, v: P.v });
  }
  function advance(sec) {
    const n = Math.max(1, Math.round(sec / DT));
    for (let k = 0; k < n && tcur < P.T - 1e-9; k++) {
      S = rk4(mode, P, S, P.v, DT); tcur += DT;
      if (P.push && !pushed && tcur >= P.push.t) { S = [S[0] + P.push.dx, ...S.slice(1)]; pushed = true; }
      if ((Math.round(tcur / DT)) % REC === 0) record();
    }
  }
  function precompute() { reset(); advance(P.T); running = false; }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; if (ui.run) ui.run.textContent = L.play; }
  function startFresh() { reset(); running = true; last = 0; ui.run.textContent = L.pause; raf = requestAnimationFrame(loop); }
  function loop(ts) {
    raf = null;
    if (!el.isConnected || !running) return;
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60; last = ts;
    advance(dt * P.speed); draw();
    if (tcur >= P.T - 1e-9) { stop(); draw(); return; }
    raf = requestAnimationFrame(loop);
  }
  // a slider moved: live parameter change while playing, otherwise recompute the whole run
  function changed() { if (running) { draw(); return; } precompute(); draw(); }

  function slider(key, label, min, max, step, isLog) {
    const out = h('span', { class: 'bs-val' });
    const inp = h('input', { type: 'range', min, max, step, 'aria-label': String(label).replace(/\\/g, '') });
    inp.addEventListener('input', () => { P[key] = isLog ? 10 ** +inp.value : +inp.value; changed(); });
    const row = h('div', { class: 'wslider' }, h('span', { class: 'bs-sl' }, T(label)), inp, out);
    ui.sl.push({ key, inp, out, isLog, row, only: key === 'kappa' || key === 'm' || key === 'damping' || key === 'friction' ? 'spring' : null });
    return row;
  }
  function build() {
    el.textContent = '';
    ui.sl = [];
    const btn = (txt, on, cls = 'ghost') => h('button', { class: `btn ${cls}`, type: 'button', onclick: on }, M(txt));
    ui.pre = presets.map((p, i) => btn(p.label ?? String(i + 1), () => load(i)));
    ui.modes = modes.map(md => btn(md === 'first' ? L.modeFirst : L.modeSpring, () => { stop(); mode = md; precompute(); draw(); }));
    ui.run = btn(L.play, () => { if (running) return stop(); if (tcur >= P.T - 1e-9 || tcur === 0) startFresh(); else { running = true; last = 0; ui.run.textContent = L.pause; raf = requestAnimationFrame(loop); } }, 'primary');
    const [lo, hi] = range(), Pr = P.PiRange;
    const rows = [];
    if (sp.v) rows.push(slider('v', L.v, lo, hi, 0.05));
    if (sp.x0) rows.push(slider('x0', L.x0, lo, hi, 0.05));
    if (sp.mu0) rows.push(slider('mu0', L.mu0, lo, hi, 0.05));
    if (sp.Pi) rows.push(slider('Pi', L.Pi, Math.log10(Pr[0]), Math.log10(Pr[1]), 0.02, true));
    if (sp.kappa) rows.push(slider('kappa', L.kappa, 0.5, 40, 0.5));
    if (sp.m) rows.push(slider('m', L.m, 0.5, 5, 0.1));
    if (sp.damping) rows.push(slider('damping', L.damping, 0, 8, 0.05));
    if (sp.friction) rows.push(slider('friction', L.friction, 0, 4, 0.05));
    ui.pos = h('div', { class: 'al-fig', role: 'img', 'aria-label': L.position });
    ui.act = h('div', { class: 'al-fig', role: 'img', 'aria-label': L.action });
    ui.ph = h('div', { class: 'al-fig', role: 'img', 'aria-label': L.phase });
    ui.read = h('div', { class: 'al-read' });
    ui.legend = h('div', { class: 'al-legend' });
    const figs = [h('div', {}, h('div', { class: 'al-cap' }, M(L.position)), ui.pos)];
    if (P.showAction !== false) figs.push(h('div', {}, h('div', { class: 'al-cap' }, M(L.action)), ui.act));
    if (P.showPhase !== false) figs.push(h('div', {}, h('div', { class: 'al-cap' }, M(L.phase)), ui.ph));
    el.append(
      presets.length ? h('div', { class: 'wbtns al-pre' }, ...ui.pre) : '',
      modes.length > 1 ? h('div', { class: 'wbtns al-modes' }, ...ui.modes) : '',
      ui.legend, h('div', { class: 'al-figs' }, ...figs), ui.read, h('div', { class: 'al-sl' }, ...rows),
      h('div', { class: 'wbtns' }, ui.run, btn(L.reset, () => { stop(); precompute(); draw(); })));
  }

  // ---- drawing
  const W = 320;
  function frame(H, xr, yr, xt, yt, ml = 34) {
    const mr = 8, mt = 8, mb = 20, pw = W - ml - mr, ph = H - mt - mb;
    const X = t => ml + (t - xr[0]) / (xr[1] - xr[0]) * pw, Y = y => mt + ph - (y - yr[0]) / (yr[1] - yr[0]) * ph;
    let g = `<rect x="${ml}" y="${mt}" width="${pw}" height="${ph}" class="al-box"/>`;
    xt.forEach(t => { g += `<line x1="${X(t)}" y1="${mt + ph}" x2="${X(t)}" y2="${mt + ph + 3}" class="al-ax"/><text x="${X(t)}" y="${H - 6}" class="al-t al-mid">${f2(t, Math.abs(t) < 10 && t % 1 ? 1 : 0)}</text>`; });
    yt.forEach(y => { g += `<line x1="${ml - 3}" y1="${Y(y)}" x2="${ml}" y2="${Y(y)}" class="al-ax"/><line x1="${ml}" y1="${Y(y)}" x2="${ml + pw}" y2="${Y(y)}" class="al-grid"/><text x="${ml - 5}" y="${Y(y) + 3.5}" class="al-t al-end">${f2(y, 1)}</text>`; });
    return { X, Y, g, ml, mt, pw, ph };
  }
  const path = (pts, cls) => (pts.length > 1 ? `<polyline points="${pts.map(p => p.map(q => q.toFixed(1)).join(',')).join(' ')}" class="${cls}"/>` : '');
  const ticks = (a, b, n) => { const s = (b - a) / n; return Array.from({ length: n + 1 }, (_, i) => a + i * s); };
  const nice = x => { const e = 10 ** Math.floor(Math.log10(x)), r = x / e; return ([1, 1.5, 2, 3, 4, 5, 8, 10].find(c => r <= c + 1e-9) ?? 10) * e; };

  function metrics() {
    const d = P.v - P.x0, a = Math.abs(d);
    if (a < 1e-9) return null;
    const sg = Math.sign(d), prog = rec.map(r => sg * (r.x - P.x0) / a);
    const peak = Math.max(...prog), over = Math.max(0, (peak - 1) * 100);
    const i90 = prog.findIndex(q => q >= 0.9), t90 = i90 < 0 ? null : rec[i90].t;
    let lastOut = -1; prog.forEach((q, i) => { if (Math.abs(q - 1) > 0.05) lastOut = i; });
    const settle = lastOut === prog.length - 1 ? null : lastOut < 0 ? 0 : rec[lastOut + 1].t;
    return { over, t90, settle, peak };
  }
  function draw() {
    if (!ui.pos) return;
    ui.modes.forEach((b, k) => { b.classList.toggle('primary', modes[k] === mode); b.classList.toggle('ghost', modes[k] !== mode); });
    ui.pre.forEach((b, k) => { b.classList.toggle('primary', k === pidx); b.classList.toggle('ghost', k !== pidx); });
    ui.sl.forEach(s => {
      s.row.style.display = s.only && s.only !== mode ? 'none' : '';
      const v = P[s.key] ?? P.x0; if (document.activeElement !== s.inp) s.inp.value = s.isLog ? Math.log10(v) : v;
      s.out.textContent = s.isLog ? (v < 10 ? v.toFixed(2) : v.toFixed(1)) : f2(v, s.key === 'm' || s.key === 'damping' || s.key === 'friction' ? 2 : 2);
    });
    const [lo, hi] = range(), cur = rec[rec.length - 1], Tt = P.T;
    // position
    {
      const fr = frame(150, [0, Tt], [lo, hi], ticks(0, Tt, 4), ticks(Math.ceil(lo), Math.floor(hi), Math.floor(hi) - Math.ceil(lo)));
      const pts = k => rec.map(r => [fr.X(r.t), fr.Y(k(r))]);
      let g = fr.g + path(rec.map(r => [fr.X(r.t), fr.Y(r.v)]), 'al-v');
      g += path(pts(r => r.m), 'al-mu') + path(pts(r => r.x), 'al-x');
      g += `<circle cx="${fr.X(cur.t)}" cy="${fr.Y(cur.x)}" r="4" class="al-dx"/>`;
      ui.pos.innerHTML = `<svg viewBox="0 0 ${W} 150" class="al-svg">${g}</svg>`;
    }
    // action
    if (P.showAction !== false) {
      const umax = Math.max(nice(Math.max(0.5, ...rec.map(r => Math.abs(r.u))) * 1.05), 0.5);
      const fr = frame(110, [0, Tt], [-umax, umax], ticks(0, Tt, 4), [-umax, 0, umax]);
      ui.act.innerHTML = `<svg viewBox="0 0 ${W} 110" class="al-svg">${fr.g}<line x1="${fr.ml}" y1="${fr.Y(0)}" x2="${fr.ml + fr.pw}" y2="${fr.Y(0)}" class="al-ax"/>`
        + path(rec.map(r => [fr.X(r.t), fr.Y(r.u)]), 'al-u') + `<circle cx="${fr.X(cur.t)}" cy="${fr.Y(cur.u)}" r="3.5" class="al-du"/></svg>`;
    }
    // phase portrait
    if (P.showPhase !== false) {
      const vmax = nice(Math.max(1, ...rec.map(r => Math.abs(r.x2)), Math.abs(P.v - P.x0)) * 1.1);
      const fr = frame(190, [lo, hi], [-vmax, vmax], ticks(Math.ceil(lo), Math.floor(hi), Math.floor(hi) - Math.ceil(lo)), [-vmax, 0, vmax]);
      let g = fr.g;
      // model flow
      const nx = 9, ny = 7;
      if (mode === 'first') {
        for (let i = 0; i <= nx; i++) {
          const x = lo + (hi - lo) * i / nx, dx = P.v - x, y = dx;
          if (Math.abs(y) > vmax) continue;
          g += arrowSvg(fr.X(x), fr.Y(y), fr.X(x + Math.sign(dx) * (hi - lo) / 12), fr.Y(y), 'al-flow');
        }
        g += `<line x1="${fr.X(lo)}" y1="${fr.Y(P.v - lo)}" x2="${fr.X(hi)}" y2="${fr.Y(P.v - hi)}" class="al-line"/>`;
      } else {
        const w2 = P.kappa / P.m;
        for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
          const x = lo + (hi - lo) * i / nx, y = -vmax + 2 * vmax * j / ny;
          const a = y, b = w2 * (P.v - x) - P.damping * y;
          const sx = (hi - lo) / 220, sy = 2 * vmax / 150, sc = 1 / Math.hypot(a / sx, b / sy) || 0;
          if (!isFinite(sc)) continue;
          const len = 10; // px
          const dxp = a / sx * sc * len / 1, dyp = b / sy * sc * len / 1;
          const px = fr.X(x), py = fr.Y(y);
          g += arrowSvg(px - dxp / 2, py + dyp / 2, px + dxp / 2, py - dyp / 2, 'al-flow');
        }
      }
      g += path(rec.map(r => [fr.X(r.x), fr.Y(r.x2)]), 'al-ph');
      g += `<circle cx="${fr.X(P.v)}" cy="${fr.Y(0)}" r="4.5" class="al-tgt"/><circle cx="${fr.X(cur.x)}" cy="${fr.Y(cur.x2)}" r="4" class="al-dx"/>`;
      g += `<text x="${fr.ml + 4}" y="${fr.mt + 10}" class="al-t">${mode === 'first' ? '&#7819; = u' : 'x&#8322; (velocity)'}</text>`;
      ui.ph.innerHTML = `<svg viewBox="0 0 ${W} 190" class="al-svg">${g}</svg>`;
    }
    ui.legend.innerHTML = '';
    ui.legend.append(
      h('span', { class: 'al-key al-kx' }, M(L.x)), h('span', { class: 'al-key al-km' }, M(L.mu)),
      h('span', { class: 'al-key al-kv' }, M(L.target)), h('span', { class: 'al-key al-ku' }, M(L.u)));
    const m = metrics();
    const fm = q => (q == null ? '–' : `${f2(q, 2)} s`);
    ui.read.innerHTML = m
      ? `${mdInline(`**${L.over}** ${f2(m.over, 1)}%`)} · ${mdInline(`**${L.t90}** ${fm(m.t90)}`)} · ${mdInline(`**${L.settle}** ${fm(m.settle)}`)} · ${mdInline(`**${L.final}** ${f2(rec[rec.length - 1].x, 3)}`)}`
        + (mode === 'spring' ? ` · ${tex(`\\kappa/m=${f2(P.kappa / P.m, 2)}`)}` : '')
      : mdInline(`**${L.final}** ${f2(rec[rec.length - 1].x, 3)}`);
    const mm = m ?? {};
    el.dataset.mode = mode; el.dataset.x = cur.x.toFixed(4); el.dataset.mu = cur.m.toFixed(4); el.dataset.u = cur.u.toFixed(4);
    el.dataset.t = tcur.toFixed(2); el.dataset.over = f2(mm.over ?? 0, 2); el.dataset.t90 = mm.t90 == null ? '' : mm.t90.toFixed(2);
    el.dataset.settle = mm.settle == null ? '' : mm.settle.toFixed(2); el.dataset.running = running ? '1' : '0';
    el.dataset.v = String(P.v); el.dataset.Pi = P.Pi.toFixed(3);
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const plain = s => String(s).replace(/\\[a-zA-Z]+/g, '').replace(/[{}$]/g, '');
  function arrowSvg(x1, y1, x2, y2, cls) {
    const a = Math.atan2(y2 - y1, x2 - x1), hl = 3.2, hw = 0.5;
    const p1 = [x2 - hl * Math.cos(a - hw), y2 - hl * Math.sin(a - hw)], p2 = [x2 - hl * Math.cos(a + hw), y2 - hl * Math.sin(a + hw)];
    return `<path d="M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}M${p1.map(q => q.toFixed(1))}L${x2.toFixed(1)},${y2.toFixed(1)}L${p2.map(q => q.toFixed(1))}" class="${cls}"/>`;
  }
  load(-1);
}
