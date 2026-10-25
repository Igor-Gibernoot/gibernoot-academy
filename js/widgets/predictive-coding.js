// predictive-coding
//
// Prediction errors, precision weighting and gradient descent on the free energy F (MINIMISED, never sign-flipped):
//   F = 1/2 sum_i Pi_i eps_i^2   (+ constants dropped),   mu-dot = -dF/dmu.
// Four modes (tabs; `mode` is the first shown, `modes` lists the tabs):
//  'static'    one level. Hidden cause v, belief mu; data y (slider); prior mean eta (slider); mapping g.
//              eps_y = y - g(mu),  eps_v = mu - eta,  F = (Pi_y eps_y^2 + Pi_v eps_v^2)/2.
//              Closed form when g(x) = a x:  mu* = (a Pi_y y + Pi_v eta)/(a^2 Pi_y + Pi_v)  (else a numerical minimum).
//  'hierarchy' two levels: eps_y = y - g(mu1), eps_x = mu1 - g2(mu2), eps_v = mu2 - eta; F = (Pi_y eps_y^2 + Pi_x eps_x^2 + Pi_v eps_v^2)/2.
//              The level-2 belief predicts the level-1 belief, which predicts the data. Minimum computed numerically.
//  'dynamic'   generalized coordinates mu~ = (mu, mu', mu'') of a hidden state x, tracking a moving signal
//              y(t) = offset + amp sin(omega t) whose derivatives are the data y~. Linear model y = G x, x-dot = fx x + fv v,
//              eps~_y = y~ - G mu~,  eps~_x = D mu~ - (fx mu~ + fv v~) with D the shift (D mu~)_i = mu_(i+1), v~ = (v, 0, 0),
//              eps_v = v - eta;  F = 1/2 (eps~_y.Pi~_y eps~_y + eps~_x.Pi~_x eps~_x + Pi_v eps_v^2),  Pi_(i) = Pi * decay^i.
//              Dynamics (real time): mu~-dot - D mu~ = -dF/dmu~, v-dot = -dF/dv. Buttons keep 1, 2 or 3 orders (fewer orders = lag).
//  'action'    the data is a limb angle y = y0 + dydu u, drawn as an arm. eta is the descending prediction (target). Perception:
//              mu-dot = -dF/dmu. 'Enable reflex' adds u-dot = -dF/du = -(dy/du) Pi_y eps_y, so the arm moves to fulfil the prediction.
//              When Pi_y is large against Pi_v the belief is dragged to the arm and nothing moves (attenuate the sensory precision).
// Precisions are log-scale sliders. Each error has a signed bar (eps) and a bar for its share 1/2 Pi eps^2 of F (scaled to the largest F since Reset).
//
// Config (a preset overrides the same-named key):
//   mode, modes: ['static','hierarchy','dynamic','action']   (default: [mode])
//   g, g2: 'identity' | 'gain' | 'tanh' | 'sin'  or { kind, gain }  (g = gain * base(x); static/hierarchy/action; dynamic uses G = g.gain)
//   f: { x: fx, v: fv } (dynamic)   eta: 0   y: data (static/hierarchy)   y0: arm start (action; dynamic: unused)   mu0: initial belief
//   Pi: { y, x, v }  (default 1)    PiRange: [0.01, 100]    range: [lo, hi] for y, eta, mu (default [-3, 3])
//   signal: { amp: 1, omega: 2, offset: 0 }   orders: 3   decay: 1   showX: true (dynamic: false drops the eps_x terms)
//   dydu: 1   reflex: false   speed: 1   autoplay: false   window: 8 (time shown in the trace)
//   show: { y: true, eta: true, Pi: true, closed: true }
//   labels: KaTeX sources (no $): y, mu, mu2, eta, Py, Px, Pv, ey, ex, ev, F; plain text: marks {y, mu, eta, pred, min},
//     buttons descend, pause, step, reset, play, reflex, reflexOn, orders ('Orders kept: {n}'), modeNames {static, hierarchy, dynamic, action},
//     other texts: closed, minimum, weight, lag, level1, level2, scene, trace, unit, rate
//   presets: [{ label, ...any config key above }]

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const M = src => h('span', { html: mdInline(String(src)) });
const tex = s => `$${String(s).replace(/^\$|\$$/g, '')}$`;
const fmt = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '−');
const fmtP = x => (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x >= 1 ? x.toFixed(2) : x.toFixed(3));
const esc = s => String(s).replace(/[&<]/g, c => (c === '&' ? '&amp;' : '&lt;'));
const plain = s => String(s).replace(/[$\\{}]/g, '');

// ---- pure maths (exported for tests)
const BASE = { identity: { f: x => x, d: () => 1 }, tanh: { f: Math.tanh, d: x => 1 - Math.tanh(x) ** 2 }, sin: { f: Math.sin, d: Math.cos } };
export function gmap(spec) {
  const s = typeof spec === 'string' ? { kind: spec } : (spec ?? {}), kind = s.kind ?? 'identity', a = s.gain ?? 1;
  const b = BASE[kind === 'gain' ? 'identity' : kind] ?? BASE.identity;
  return { kind, a, gm: Math.abs(a), linear: kind === 'identity' || kind === 'gain', f: x => a * b.f(x), d: x => a * b.d(x) };
}
// static / hierarchy / action model: { g, g2, hier, eta, Pi: [Py, Pv] or [Py, Px, Pv] }
export const sErr = (m, y, mu) => (m.hier ? [y - m.g.f(mu[0]), mu[0] - m.g2.f(mu[1]), mu[1] - m.eta] : [y - m.g.f(mu[0]), mu[0] - m.eta]);
export const sF = (m, y, mu) => 0.5 * sErr(m, y, mu).reduce((a, e, i) => a + m.Pi[i] * e * e, 0);
export function sGrad(m, y, mu) {
  const e = sErr(m, y, mu), P = m.Pi;
  if (!m.hier) return [-P[0] * m.g.d(mu[0]) * e[0] + P[1] * e[1]];
  return [-P[0] * m.g.d(mu[0]) * e[0] + P[1] * e[1], -P[1] * m.g2.d(mu[1]) * e[1] + P[2] * e[2]];
}
export const sLambda = (m, dydu = 0) => (m.hier ? m.Pi[0] * m.g.gm ** 2 + m.Pi[1] * (1 + m.g2.gm ** 2) + m.Pi[2] : m.Pi[0] * (m.g.gm ** 2 + dydu ** 2) + m.Pi[1]) + 1e-9;
export function sMin(m, y, mu0) {                       // Newton with finite-difference Jacobian and backtracking
  let mu = mu0.slice();
  for (let it = 0; it < 80; it++) {
    const g = sGrad(m, y, mu), n = Math.hypot(...g);
    if (n < 1e-11 * sLambda(m)) break;
    const eps = 1e-6, J = mu.map((_, j) => { const mp = mu.slice(); mp[j] += eps; const gp = sGrad(m, y, mp); return gp.map((x, i) => (x - g[i]) / eps); });   // J[j][i] = dg_i/dmu_j
    let d;
    if (mu.length === 1) d = [g[0] / (J[0][0] || 1e-9)];
    else { const a = J[0][0], b = J[1][0], c = J[0][1], dd = J[1][1], det = a * dd - b * c || 1e-12; d = [(dd * g[0] - b * g[1]) / det, (-c * g[0] + a * g[1]) / det]; }
    const F0 = sF(m, y, mu);
    let t = 1, nx = mu.map((x, i) => x - d[i]);
    if (!d.every(Number.isFinite) || sF(m, y, nx) > F0 + 1e-14) { d = g.map(x => x / sLambda(m)); t = 1; nx = mu.map((x, i) => x - d[i]); }
    for (let k = 0; k < 30 && sF(m, y, nx) > F0 + 1e-14; k++) { t /= 2; nx = mu.map((x, i) => x - t * d[i]); }
    mu = nx;
  }
  return mu;
}
export function closedForm(m, y) {                      // static, g(x) = a x
  const a = m.g.a, [Py, Pv] = m.Pi;
  return (a * Py * y + Pv * m.eta) / (a * a * Py + Pv);
}
// dynamic model: p = { G, fx, fv, K, eta, decay, Pi: { y, x, v } }; mu = [K], v scalar, yt = data derivatives [K]
const dP = (p, i) => ({ y: p.Pi.y * p.decay ** i, x: p.Pi.x * p.decay ** i });
export function dErr(p, mu, v, yt) {
  const ey = [], ex = [];
  for (let i = 0; i < p.K; i++) { ey.push(yt[i] - p.G * mu[i]); ex.push((mu[i + 1] ?? 0) - p.fx * mu[i] - (i === 0 ? p.fv * v : 0)); }
  return { ey, ex, ev: v - p.eta };
}
export function dF(p, mu, v, yt) {
  const e = dErr(p, mu, v, yt);
  let F = 0.5 * p.Pi.v * e.ev * e.ev;
  for (let i = 0; i < p.K; i++) F += 0.5 * (dP(p, i).y * e.ey[i] ** 2 + dP(p, i).x * e.ex[i] ** 2);
  return F;
}
export function dGrad(p, mu, v, yt) {
  const e = dErr(p, mu, v, yt), gmu = [];
  for (let i = 0; i < p.K; i++) gmu.push(-p.G * dP(p, i).y * e.ey[i] - p.fx * dP(p, i).x * e.ex[i] + (i > 0 ? dP(p, i - 1).x * e.ex[i - 1] : 0));
  return { gmu, gv: -p.fv * dP(p, 0).x * e.ex[0] + p.Pi.v * e.ev };
}
export function dStep(p, mu, v, yt, hh) {              // mu-dot = D mu - grad,  v-dot = -grad
  const g = dGrad(p, mu, v, yt);
  return { mu: mu.map((x, i) => x + hh * ((mu[i + 1] ?? 0) - g.gmu[i])), v: v - hh * g.gv };
}
export const signalAt = (s, t, K) => { const w = s.omega, A = s.amp; return [s.offset + A * Math.sin(w * t), A * w * Math.cos(w * t), -A * w * w * Math.sin(w * t)].slice(0, K); };
export const dLambda = p => (p.Pi.y * p.G * p.G + p.Pi.x * (2 + p.fx * p.fx + p.fv * p.fv) + p.Pi.v) * 1.5 + 1;

// ---- widget
const NS = 'http://www.w3.org/2000/svg';
export function predictiveCoding(el, cfg) {
  const L = { descend: 'Descend', pause: 'Pause', step: 'Step', reset: 'Reset', play: 'Play', reflex: 'Enable reflex', reflexOn: 'Reflex on', orders: 'Orders kept: {n}',
    y: 'y', mu: '\\mu', mu2: '\\mu_2', eta: '\\eta', Py: '\\Pi_y', Px: '\\Pi_x', Pv: '\\Pi_v', ey: '\\epsilon_y', ex: '\\epsilon_x', ev: '\\epsilon_v', F: 'F',
    closed: 'Precision-weighted compromise', minimum: 'Minimum of F (numerical)', weight: 'Pull toward the data', lag: 'Mean gap |data − prediction|',
    level1: 'Level 1', level2: 'Level 2', scene: 'Beliefs and data', trace: 'Data and prediction', unit: '', rate: 'Rate of action',
    ...(cfg.labels ?? {}), marks: { y: 'y', mu: 'μ', eta: 'η', pred: 'g(μ)', min: 'μ*', ...(cfg.labels?.marks ?? {}) },
    modeNames: { static: 'One level', hierarchy: 'Two levels', dynamic: 'Moving data', action: 'Action', ...(cfg.labels?.modeNames ?? {}) } };
  const presets = cfg.presets?.length ? cfg.presets : [{}];
  let pi = 0, sp, mode, modes, lo, hi, g1, g2, Pi, Pr, eta, y, S, Fscale = 1, running = false, raf = null, last = 0, K, reflexOn = false, fx = 0, fv = 0, G = 1, hist = [];
  const ui = {};
  const root = h('div', { class: 'pc-root' });
  el.append(root);

  const clampR = x => Math.max(lo, Math.min(hi, x));
  const model = () => (mode === 'hierarchy' ? { g: g1, g2, hier: true, eta, Pi: [Pi.y, Pi.x, Pi.v] } : { g: g1, hier: false, eta, Pi: [Pi.y, Pi.v] });
  const dparams = () => ({ G, fx, fv, K, eta, decay: sp.decay ?? 1, Pi: { y: Pi.y, x: sp.showX === false ? 0 : Pi.x, v: Pi.v } });
  const sig = () => ({ amp: 1, omega: 2, offset: 0, ...(sp.signal ?? {}) });
  const curY = () => (mode === 'dynamic' ? signalAt(sig(), S.t, 1)[0] : mode === 'action' ? (sp.y0 ?? 0) + (sp.dydu ?? 1) * S.u : y);

  function load(i) {
    stop(); pi = i;
    sp = { ...cfg, ...presets[i] };
    modes = sp.modes ?? [sp.mode ?? 'static'];
    mode = modes.includes(sp.mode) ? sp.mode : modes[0];
    [lo, hi] = sp.range ?? [-3, 3]; Pr = sp.PiRange ?? [0.01, 100];
    g1 = gmap(sp.g ?? 'identity'); g2 = gmap(sp.g2 ?? 'identity');
    Pi = { y: 1, x: 1, v: 1, ...(sp.Pi ?? {}) }; eta = sp.eta ?? 0; y = sp.y ?? 1;
    K = Math.max(1, Math.min(3, sp.orders ?? 3)); G = sp.g?.gain ?? 1; fx = sp.f?.x ?? 0; fv = sp.f?.v ?? 0;
    reflexOn = !!sp.reflex;
    build(); resetState(); draw();
    ui.pre.forEach((b, j) => { b.classList.toggle('primary', j === i); b.classList.toggle('ghost', j !== i); });
    if (sp.autoplay) start();
  }
  function resetState() {
    stop(); hist = [];
    S = { u: 0, t: 0, v: eta, mu: [], mu1: 0 };
    if (mode === 'dynamic') S.mu = Array.from({ length: 3 }, () => sp.mu0 ?? 0);
    else if (mode === 'hierarchy') S.mu = [sp.mu0 ?? g2.f(eta), eta];
    else S.mu = [sp.mu0 ?? (mode === 'action' ? sp.y0 ?? 0 : eta)];
    Fscale = 0; Fscale = Math.max(curF(), 1e-9);
  }
  function curF() {
    if (mode === 'dynamic') return dF(dparams(), S.mu.slice(0, K), S.v, signalAt(sig(), S.t, K));
    return sF(model(), curY(), S.mu);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; if (ui.run) ui.run.textContent = mode === 'dynamic' ? L.play : L.descend; }
  function start() { if (running) return; running = true; last = 0; if (ui.run) ui.run.textContent = L.pause; raf = requestAnimationFrame(loop); }
  function loop(ts) {
    raf = null;
    if (!el.isConnected) { running = false; return; }
    if (!running) return;
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60; last = ts;
    advance(dt); draw();
    if (running) raf = requestAnimationFrame(loop);
  }
  function advance(dt) {
    const sp0 = sp.speed ?? 1;
    if (mode === 'dynamic') {
      const p = dparams(), lam = dLambda(p), n = Math.min(400, Math.ceil(dt * sp0 * lam / 0.4)), hh = dt * sp0 / n;
      for (let k = 0; k < n; k++) {
        const yt = signalAt(sig(), S.t, K), r = dStep(p, S.mu.slice(0, K), S.v, yt, hh);
        r.mu.forEach((x, i) => { S.mu[i] = x; }); S.v = r.v; S.t += hh;
      }
      const yy = signalAt(sig(), S.t, 1)[0]; hist.push({ t: S.t, y: yy, p: G * S.mu[0] });
      const tw = sp.window ?? 8; while (hist.length && hist[0].t < S.t - tw) hist.shift();
      return;
    }
    const m = model(), dydu = sp.dydu ?? 1, lam = sLambda(m, mode === 'action' && reflexOn ? dydu : 0), hh = Math.min(0.4 / lam, 0.15 * sp0 / lam);
    const Yv = curY(), gr = sGrad(m, Yv, S.mu);
    S.mu = S.mu.map((x, i) => x - hh * gr[i]);
    if (mode === 'action' && reflexOn) S.u += -hh * dydu * m.Pi[0] * sErr(m, Yv, S.mu)[0];
    const g2n = Math.hypot(...sGrad(m, curY(), S.mu), mode === 'action' && reflexOn ? dydu * m.Pi[0] * sErr(m, curY(), S.mu)[0] : 0);
    if (g2n < 1e-4 * lam * Math.max(1, Math.abs(hi - lo)) * 1e-2) stop();
  }

  // ---- ui pieces
  const btn = (txt, on, cls = 'ghost') => h('button', { class: `btn ${cls}`, type: 'button', onclick: on }, M(txt));
  function slider(label, min, max, step, val, on, show, isLog = false) {
    const out = h('span', { class: 'bs-val' });
    const inp = h('input', { type: 'range', min, max, step, value: val, 'aria-label': plain(label) });
    inp.addEventListener('input', () => { on(+inp.value); draw(); });
    return { row: h('div', { class: 'wslider' }, h('span', { class: 'bs-sl pc-sl' }, M(tex(label))), inp, out), inp, out, show, isLog };
  }
  function build() {
    root.textContent = '';
    ui.pre = presets.length > 1 ? presets.map((p, i) => btn(p.label ?? String(i + 1), () => load(i))) : [];
    ui.tabs = modes.map(md => btn(L.modeNames[md] ?? md, () => { mode = md; resetState(); build2(); draw(); }));
    root.append(ui.pre.length ? h('div', { class: 'wbtns pc-pre' }, ...ui.pre) : '', modes.length > 1 ? h('div', { class: 'wbtns pc-tabs' }, ...ui.tabs) : '');
    ui.body = h('div', { class: 'pc-body' });
    root.append(ui.body);
    build2();
  }
  function build2() {
    ui.body.textContent = '';
    const sh = { y: true, eta: true, Pi: true, closed: true, ...(sp.show ?? {}) };
    ui.scene = h('div', { class: 'pc-scene', role: 'img', 'aria-label': L.scene });
    ui.errs = h('div', { class: 'pc-errs' });
    ui.read = h('div', { class: 'pc-read' });
    ui.closed = h('div', { class: 'pc-closed' });
    ui.run = btn(mode === 'dynamic' ? L.play : L.descend, () => { if (running) return stop(); if (mode !== 'dynamic' && stopped()) resetState(); start(); }, 'primary');
    const bt = [ui.run];
    if (mode !== 'dynamic') bt.push(btn(L.step, () => { stop(); advance(1 / 60); draw(); }));
    if (mode === 'action') { ui.reflex = btn(L.reflex, () => { reflexOn = !reflexOn; draw(); }); bt.push(ui.reflex); }
    bt.push(btn(L.reset, () => { resetState(); draw(); }));
    ui.ord = [];
    if (mode === 'dynamic') [1, 2, 3].forEach(n => { const b = btn(L.orders.replace('{n}', n), () => { const was = running; K = n; resetState(); draw(); if (was) start(); }); ui.ord.push(b); bt.push(b); });
    ui.sl = [];
    const wide = Math.abs(hi - lo);
    const add = s => { ui.sl.push(s); return s.row; };
    const rows = [];
    if (mode !== 'dynamic' && mode !== 'action' && sh.y) rows.push(add(slider(L.y, lo, hi, wide / 200, y, v => { y = v; }, () => y)));
    if (sh.eta) rows.push(add(slider(L.eta, lo, hi, wide / 200, eta, v => { eta = v; if (mode === 'dynamic') S.v = eta; }, () => eta)));
    const lg = (lab, key) => add(slider(lab, Math.log10(Pr[0]), Math.log10(Pr[1]), 0.02, Math.log10(Pi[key]), v => { Pi[key] = 10 ** v; }, () => Pi[key], true));
    if (sh.Pi) {
      rows.push(lg(L.Py, 'y'));
      if (mode === 'hierarchy' || (mode === 'dynamic' && sp.showX !== false)) rows.push(lg(L.Px, 'x'));
      rows.push(lg(L.Pv, 'v'));
    }
    ui.body.append(ui.scene, h('div', { class: 'wbtns' }, ...bt), ...rows, ui.errs, ui.read, sh.closed && mode !== 'dynamic' && mode !== 'action' ? ui.closed : '');
  }
  const stopped = () => {
    if (mode === 'dynamic') return false;
    const m = model(), gr = sGrad(m, curY(), S.mu); return Math.hypot(...gr) < 1e-6 * sLambda(m);
  };

  // ---- drawing
  const X = (v, W = 320, p = 22) => p + ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (W - 2 * p);
  function mark(x, yy, cls, txt, below, shape = 'c') {
    const t = `<text x="${x.toFixed(1)}" y="${(yy + (below ? 22 : -12)).toFixed(1)}" class="pc-t" text-anchor="middle">${esc(txt)}</text>`;
    const s = shape === 's' ? `<rect x="${(x - 5.5).toFixed(1)}" y="${yy - 5.5}" width="11" height="11" class="${cls}"/>`
      : shape === 'd' ? `<path d="M${x.toFixed(1)} ${yy - 7}l7 7l-7 7l-7 -7z" class="${cls}"/>`
      : shape === 'r' ? `<circle cx="${x.toFixed(1)}" cy="${yy}" r="6.5" class="${cls} pc-ring"/>`
      : `<circle cx="${x.toFixed(1)}" cy="${yy}" r="6" class="${cls}"/>`;
    return s + t;
  }
  function row(yy, items, pair) {
    let s = `<line x1="22" y1="${yy}" x2="298" y2="${yy}" class="pc-axis"/>`;
    [lo, (lo + hi) / 2, hi].forEach(v => { s += `<line x1="${X(v)}" y1="${yy - 3}" x2="${X(v)}" y2="${yy + 3}" class="pc-axis"/>`; });
    if (pair) s += `<line x1="${X(pair[0]).toFixed(1)}" y1="${yy}" x2="${X(pair[1]).toFixed(1)}" y2="${yy}" class="pc-err"/>`;
    return s + items.join('');
  }
  function sceneStatic() {
    const m = model(), mk = L.marks, mu = S.mu, mm = Number.isFinite(S.mus?.[0]) ? S.mus : null, rowsSvg = [];
    const Y = curY();
    if (mode === 'hierarchy') {
      rowsSvg.push(row(30, [mark(X(eta), 30, 'pc-prior', mk.eta, true, 'd'), mark(X(mu[1]), 30, 'pc-belief', 'μ₂', false)], [eta, mu[1]]));
      rowsSvg.push(row(84, [mark(X(g2.f(mu[1])), 84, 'pc-belief pc-ghost', 'g₂(μ₂)', true, 'r'), mark(X(mu[0]), 84, 'pc-belief', 'μ₁', false)], [g2.f(mu[1]), mu[0]]));
      rowsSvg.push(row(138, [mark(X(Y), 138, 'pc-data', mk.y, true, 's'), mark(X(g1.f(mu[0])), 138, 'pc-belief pc-ghost', 'g(μ₁)', false, 'r')], [Y, g1.f(mu[0])]));
    } else {
      const star = mm ? mark(X(mm[0]), 30, 'pc-min', mk.min, true, 'r') : '';
      rowsSvg.push(row(34, [mark(X(eta), 34, 'pc-prior', mk.eta, true, 'd'), mark(X(mu[0]), 34, 'pc-belief', mk.mu, false), star], [eta, mu[0]]));
      rowsSvg.push(row(96, [mark(X(Y), 96, 'pc-data', mk.y, true, 's'), mark(X(g1.f(mu[0])), 96, 'pc-belief pc-ghost', mk.pred, false, 'r')], [Y, g1.f(mu[0])]));
    }
    return `<svg viewBox="0 0 320 ${mode === 'hierarchy' ? 172 : 128}" class="pc-svg">${rowsSvg.join('')}</svg>`;
  }
  function sceneDynamic() {
    const W = 320, Hh = 130, tw = sp.window ?? 8, t1 = S.t, t0 = t1 - tw, sg = sig();
    const amp = Math.abs(sg.amp) + Math.abs(sg.offset) + 0.5, Yp = v => 65 - (v / amp) * 55, Xp = t => 10 + ((t - t0) / tw) * 300;
    const line = (key, cls) => `<polyline class="${cls}" points="${hist.map(q => `${Xp(q.t).toFixed(1)},${Yp(q[key]).toFixed(1)}`).join(' ')}"/>`;
    return `<svg viewBox="0 0 ${W} ${Hh}" class="pc-svg"><line x1="10" y1="${Yp(0)}" x2="310" y2="${Yp(0)}" class="pc-axis"/>${hist.length > 1 ? line('y', 'pc-lnd') + line('p', 'pc-lnb') : ''}`
      + `<text x="14" y="124" class="pc-t">${esc(L.marks.y)} (data)</text><text x="150" y="124" class="pc-t pc-tb">${esc(L.marks.pred)}</text></svg>`;
  }
  function sceneAction() {
    const Y = curY(), P = [50, 112], Ln = 88, pt = a => `${(P[0] + Ln * Math.cos(a * Math.PI / 180)).toFixed(1)},${(P[1] - Ln * Math.sin(a * Math.PI / 180)).toFixed(1)}`;
    const arm = (a, cls) => `<line x1="${P[0]}" y1="${P[1]}" x2="${pt(a).split(',')[0]}" y2="${pt(a).split(',')[1]}" class="${cls}"/>`;
    return `<svg viewBox="0 0 320 140" class="pc-svg">${arm(eta, 'pc-arm pc-armp')}${arm(g1.f(S.mu[0]), 'pc-arm pc-armb')}${arm(Y, 'pc-arm pc-armd')}<circle cx="${P[0]}" cy="${P[1]}" r="6" class="pc-pivot"/>`
      + `<text x="170" y="22" class="pc-t pc-tp">${esc(L.marks.eta)} = ${fmt(eta, 1)}${esc(L.unit)}</text><text x="170" y="38" class="pc-t pc-tb">${esc(L.marks.pred)} = ${fmt(g1.f(S.mu[0]), 1)}${esc(L.unit)}</text><text x="170" y="54" class="pc-t pc-td">${esc(L.marks.y)} = ${fmt(Y, 1)}${esc(L.unit)}</text></svg>`;
  }
  function errRows() {
    const rows = [];
    if (mode === 'dynamic') {
      const p = dparams(), yt = signalAt(sig(), S.t, K), e = dErr(p, S.mu.slice(0, K), S.v, yt);
      for (let i = 0; i < K; i++) rows.push([`${L.ey}^{(${i})}`, e.ey[i], dP(p, i).y]);
      if (sp.showX !== false) for (let i = 0; i < K; i++) rows.push([`${L.ex}^{(${i})}`, e.ex[i], dP(p, i).x]);
      rows.push([L.ev, e.ev, Pi.v]);
      return rows;
    }
    const m = model(), e = sErr(m, curY(), S.mu);
    const names = mode === 'hierarchy' ? [L.ey, L.ex, L.ev] : [L.ey, L.ev];
    return e.map((x, i) => [names[i], x, m.Pi[i]]);
  }
  function draw() {
    if (!ui.scene) return;
    ui.tabs.forEach((b, k) => { b.classList.toggle('primary', modes[k] === mode); b.classList.toggle('ghost', modes[k] !== mode); });
    // slider values
    ui.sl.forEach(s => { const v = s.show(); if (document.activeElement !== s.inp) s.inp.value = s.isLog ? Math.log10(v) : v; s.out.textContent = s.isLog ? fmtP(v) : fmt(v, 2); });
    const F = curF(); Fscale = Math.max(Fscale, F);
    // numerical minimum / closed form (static family)
    const m = mode === 'dynamic' ? null : model();
    S.mus = null;
    if (m && mode !== 'action') S.mus = sMin(m, curY(), S.mu.length === 1 ? [eta] : [g2.f(eta), eta]);
    if (m && mode === 'action') S.mus = sMin(m, curY(), [eta]);
    ui.scene.innerHTML = mode === 'dynamic' ? sceneDynamic() : mode === 'action' ? sceneAction() : sceneStatic();
    // error bars
    const er = errRows(), emax = (hi - lo) / 2, rowsHtml = er.map(([nm, e, P]) => {
      const c = 0.5 * P * e * e, w = Math.min(50, Math.abs(e) / emax * 50), share = Math.min(100, c / Fscale * 100);
      return `<div class="pc-erow"><span class="pc-en">${mdInline(tex(nm))}</span><span class="pc-etr"><span class="pc-ef" style="left:${e < 0 ? 50 - w : 50}%;width:${w}%"></span></span>`
        + `<span class="pc-ev">${fmt(e)}</span><span class="pc-sh"><span class="pc-sf" style="width:${share}%"></span></span><span class="pc-ec">${fmt(c)}</span></div>`;
    });
    ui.errs.innerHTML = rowsHtml.join('');
    ui.read.innerHTML = mdInline(`${tex(L.F)} = ${fmt(F, 3)} (${tex(`\\tfrac12\\sum \\Pi\\,\\epsilon^2`)})`
      + (mode === 'dynamic' ? ` · ${L.lag} = ${fmt(hist.length ? hist.reduce((a, q) => a + Math.abs(q.y - q.p), 0) / hist.length : 0, 3)}`
        : ` · ${tex(L.mu)} = ${fmt(S.mu[0], 3)}${mode === 'hierarchy' ? `, ${tex(L.mu2)} = ${fmt(S.mu[1], 3)}` : ''}`)
      + (mode === 'action' ? ` · ${L.rate} = ${reflexOn ? fmt(-((sp.dydu ?? 1) ** 2) * Pi.y * sErr(m, curY(), S.mu)[0], 3) : fmt(0, 3)}` : ''));
    if (ui.reflex) { ui.reflex.textContent = reflexOn ? L.reflexOn : L.reflex; ui.reflex.classList.toggle('primary', reflexOn); ui.reflex.classList.toggle('ghost', !reflexOn); }
    ui.ord.forEach((b, i) => { b.classList.toggle('primary', i + 1 === K); b.classList.toggle('ghost', i + 1 !== K); });
    if (m && mode !== 'action' && ui.closed) {
      const mus = S.mus;
      if (mode === 'static' && g1.linear) {
        const a = g1.a, one = a === 1;
        ui.closed.innerHTML = mdInline(`**${L.closed}** ` + tex(`${L.mu}^*=\\dfrac{${one ? '' : 'a\\,'}${L.Py}\\,${L.y}+${L.Pv}\\,${L.eta}}{${one ? '' : 'a^2\\,'}${L.Py}+${L.Pv}}=${fmt(closedForm(m, curY()), 3)}`)
          + ` · ${L.weight}: ${fmt(a * a * Pi.y / (a * a * Pi.y + Pi.v) * 100, 0)}%`);
      } else ui.closed.innerHTML = mdInline(`**${L.minimum}** ` + tex(`${L.mu}^*=${fmt(mus[0], 3)}${mode === 'hierarchy' ? `,\\ ${L.mu2}^*=${fmt(mus[1], 3)}` : ''}`));
    }
    el.dataset.mode = mode; el.dataset.F = F.toFixed(5); el.dataset.mu = S.mu.map(x => x.toFixed(4)).join(','); el.dataset.u = S.u.toFixed(4); el.dataset.t = S.t.toFixed(3);
    el.dataset.y = curY().toFixed(4); el.dataset.mustar = S.mus ? S.mus.map(x => x.toFixed(4)).join(',') : ''; el.dataset.K = K; el.dataset.running = running ? '1' : '0';
    el.dataset.lag = mode === 'dynamic' && hist.length ? (hist.reduce((a, q) => a + Math.abs(q.y - q.p), 0) / hist.length).toFixed(4) : '';
    el.dataset.reflex = reflexOn ? '1' : '0';
  }
  load(0);
}
