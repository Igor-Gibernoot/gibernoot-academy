// steady-state-walk
//
// A 2D random walker  dx = f(x) dt + w sqrt(dt)  (Euler-Maruyama), w ~ N(0, 2 Gamma), Gamma = gamma * I,
// in a Gaussian steady state p(x) = N(center, cov), surprise  I(x) = -ln p(x).
// Drift modes (buttons):
//   restoring     f = -Gamma grad I                (steady state: the cloud stays on p)
//   circulating   f = -(Gamma - Q) grad I          Q antisymmetric (Q12 = q, Q21 = -q): still steady state p,
//                                                  the path also circles the contours (nonequilibrium steady state)
//   none          f = 0                            pure diffusion: spreads out, surprise grows
// `strength` (slider) scales the whole drift while the noise stays fixed: 1 is the exact steady state,
// below 1 the walker is under-restored and wanders to high surprise.
// Panels: the path (fading trail over contours of I at 1, 2, 3 standard deviations) and a trace of I along
// the path with its running average over the last `window` samples and the entropy H = E[I] of p.
// No maths text is hard-coded (labels are config).
//
//   center: [0,0], cov: [[2,0.8],[0.8,1.5]], start: [5,5], range: 6
//   gamma: 1, strength: 1, qCirc: 1 (max of the circulation slider is 2*qCirc... see qMax), dt: 0.05
//   modes: ['restoring','circulating','none'] (subset, first is the initial one)
//   seed: 4, prerun: 500 (steps computed before the first draw), every: 4 (steps per sample and per frame)
//   window: 300 (samples averaged), traceLen: 700 (samples kept), traceMax: 12 (top of the trace axis), trail: 400
//   autoplay: false, showStrength: true, showTrace: true
//   labels: { x1, x2 (KaTeX), restoring, circulating, none, play, pause, reset, noise, strength, circ,
//             surprise, now, avg, entropy, trace }
//   presets: [{ label, mode, strength, q, gamma }]

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const M = src => h('span', { html: mdInline(String(src)) });
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  kids.flat().forEach(c => c && e.append(c));
  return e;
};
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const fmt = v => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace('-', '−');
const f1 = v => (Math.abs(v) < 0.05 ? 0 : v).toFixed(1).replace('-', '−');

const S = 300, PAD = 16, TW = 420, TH = 130, TP = 22;

export function steadyStateWalk(el, cfg) {
  const base = { center: [0, 0], cov: [[2, 0.8], [0.8, 1.5]], start: [5, 5], range: 6, gamma: 1, strength: 1, qCirc: 1, dt: 0.05,
    seed: 4, prerun: 500, every: 4, window: 300, traceLen: 700, traceMax: 12, trail: 400 };
  const P = { ...base };
  for (const k of Object.keys(base)) if (cfg[k] != null) P[k] = cfg[k];
  const L = { x1: 'x_1', x2: 'x_2', restoring: 'Restoring', circulating: 'Restoring + circulating', none: 'No drift', play: 'Play', pause: 'Pause',
    reset: 'Restart', noise: 'New noise', strength: 'restoring strength', circ: 'circulation', surprise: 'Surprise', now: 'now', avg: 'average over the last samples',
    entropy: 'average under the steady state', trace: 'surprise along the path', ...(cfg.labels ?? {}) };
  const tex = s => `$${String(s).replace(/^\$|\$$/g, '')}$`;
  const modes = (cfg.modes ?? ['restoring', 'circulating', 'none']).filter(m => ['restoring', 'circulating', 'none'].includes(m));
  let mode = cfg.mode && modes.includes(cfg.mode) ? cfg.mode : modes[0];
  let k = P.strength, q = P.qCirc, gam = P.gamma, seed = P.seed;
  const [[a, b], [, d]] = P.cov, det = a * d - b * b;
  const inv = [[d / det, -b / det], [-b / det, a / det]];
  const lnNorm = Math.log(2 * Math.PI * Math.sqrt(det));
  const H = lnNorm + 1;                       // entropy of the 2D Gaussian = E[I]
  const surprise = p => { const u = p[0] - P.center[0], v = p[1] - P.center[1]; return 0.5 * (u * (inv[0][0] * u + inv[0][1] * v) + v * (inv[1][0] * u + inv[1][1] * v)) + lnNorm; };
  const R = P.range, X = v => PAD + ((v + R) / (2 * R)) * S, Y = v => PAD + (1 - (v + R) / (2 * R)) * S;

  let rnd, pos, path, hist, playing = !!cfg.autoplay, raf = 0, alive = true;
  function restart() {
    rnd = rng(seed); pos = [...P.start]; path = [[...pos]]; hist = [surprise(pos)];
    for (let i = 0; i < P.prerun; i++) step();
  }
  function step() {
    const g1 = inv[0][0] * (pos[0] - P.center[0]) + inv[0][1] * (pos[1] - P.center[1]);
    const g2 = inv[1][0] * (pos[0] - P.center[0]) + inv[1][1] * (pos[1] - P.center[1]);
    const qq = mode === 'circulating' ? q : 0, kk = mode === 'none' ? 0 : k;
    const f1_ = -kk * (gam * g1 - qq * g2), f2_ = -kk * (gam * g2 + qq * g1);
    const s = Math.sqrt(2 * gam * P.dt);
    pos = [pos[0] + f1_ * P.dt + s * gauss(rnd), pos[1] + f2_ * P.dt + s * gauss(rnd)];
    path.push([...pos]); if (path.length > P.trail * P.every) path.shift();
    if (path.length % P.every === 0) { hist.push(surprise(pos)); if (hist.length > P.traceLen) hist.shift(); }
  }

  // contours: Mahalanobis radius r -> ellipse from eigen-decomposition of cov
  const tr = (a + d) / 2, df = Math.sqrt(((a - d) / 2) ** 2 + b * b), l1 = tr + df, l2 = tr - df;
  const ang = 0.5 * Math.atan2(2 * b, a - d);
  const ell = r => {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = (2 * Math.PI * i) / 60, u = r * Math.sqrt(l1) * Math.cos(t), v = r * Math.sqrt(l2) * Math.sin(t);
      pts.push(`${i ? 'L' : 'M'}${X(P.center[0] + u * Math.cos(ang) - v * Math.sin(ang)).toFixed(1)},${Y(P.center[1] + u * Math.sin(ang) + v * Math.cos(ang)).toFixed(1)}`);
    }
    return pts.join('');
  };
  const W = S + 2 * PAD;
  const svg = sv('svg', { viewBox: `0 0 ${W} ${W}`, class: 'sw-svg', role: 'img', 'aria-label': 'random walk over contours of surprise' });
  const clip = sv('clipPath', { id: `swc${Math.random().toString(36).slice(2, 8)}` }, sv('rect', { x: PAD, y: PAD, width: S, height: S }));
  const trail = sv('g', { 'clip-path': `url(#${clip.id})` }), dot = sv('circle', { r: 5.5, class: 'sw-dot' });
  const ax = (x1, y1, x2, y2) => sv('line', { x1, y1, x2, y2, class: 'sw-axis' });
  svg.append(sv('rect', { x: PAD, y: PAD, width: S, height: S, class: 'sw-frame' }), ax(X(-R), Y(0), X(R), Y(0)), ax(X(0), Y(R), X(0), Y(-R)),
    ...[1, 2, 3].map(r => sv('path', { d: ell(r), class: 'sw-cont', 'stroke-opacity': 1 - 0.22 * (r - 1) })),
    sv('circle', { cx: X(P.center[0]), cy: Y(P.center[1]), r: 2.5, class: 'sw-cen' }),
    clip, sv('circle', { cx: X(P.start[0]), cy: Y(P.start[1]), r: 4, class: 'sw-start' }), trail, dot);
  const lab = (txt, left, top) => h('div', { class: 'bs-lab', style: `left:${left}%;top:${top}%` }, M(tex(txt)));
  const stage = h('div', { class: 'bs-stage' }, svg, lab(L.x1, 96, 57), lab(L.x2, 56, 2));

  const showTrace = cfg.showTrace !== false;
  const tsvg = sv('svg', { viewBox: `0 0 ${TW} ${TH}`, class: 'sw-trace', role: 'img', 'aria-label': 'surprise along the path' });
  const tg = sv('g');
  const TY = v => TH - TP + 6 - (Math.min(Math.max(v, 0), P.traceMax) / P.traceMax) * (TH - TP - 4);
  tsvg.append(sv('rect', { x: 0, y: 0, width: TW, height: TH, class: 'sw-frame' }), tg);
  const tlab = h('div', { class: 'sw-tlab' }, M(L.trace));

  const sl = (label, min, max, step, val, on) => {
    const out = h('span', { class: 'bs-val' });
    const inp = h('input', { type: 'range', min, max, step, value: val, 'aria-label': label });
    inp.addEventListener('input', () => { on(+inp.value); draw(); });
    return { row: h('div', { class: 'wslider' }, h('span', { class: 'bs-sl' }, M(label)), inp, out), inp, out };
  };
  const kS = sl(L.strength, 0, 1.5, 0.05, k, v => { k = v; });
  const qS = sl(L.circ, 0, 2, 0.05, q, v => { q = v; });
  const modeBtns = modes.map(m => h('button', { class: 'btn ghost', type: 'button', onclick: () => { mode = m; restart(); draw(); } }, M(L[m])));
  const playBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => { playing = !playing; if (playing) loop(); draw(); } });
  const resetBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { restart(); draw(); } }, L.reset);
  const noiseBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { seed += 1; restart(); draw(); } }, L.noise);
  const presetBtns = (cfg.presets ?? []).map(p => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
    if (p.mode && modes.includes(p.mode)) mode = p.mode;
    if (p.strength != null) { k = p.strength; kS.inp.value = k; }
    if (p.q != null) { q = p.q; qS.inp.value = q; }
    if (p.gamma != null) gam = p.gamma;
    restart(); draw();
  } }, M(p.label)));
  const read = h('div', { class: 'bg-read bs-read' });
  el.append(stage, h('div', { class: 'wbtns' }, ...modeBtns), cfg.showStrength === false ? '' : kS.row, modes.includes('circulating') ? qS.row : '',
    h('div', { class: 'wbtns' }, playBtn, resetBtn, noiseBtn, ...presetBtns), showTrace ? h('div', { class: 'sw-tw' }, tlab, tsvg) : '', read);

  function draw() {
    // trail: 5 chunks fading in
    trail.textContent = '';
    const n = path.length, nc = 5, per = Math.ceil(n / nc);
    for (let c = 0; c < nc; c++) {
      const seg = path.slice(Math.max(0, c * per - 1), (c + 1) * per);
      if (seg.length < 2) continue;
      trail.append(sv('polyline', { points: seg.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' '),
        class: 'sw-line', 'stroke-opacity': (0.12 + 0.88 * (c + 1) / nc).toFixed(2) }));
    }
    dot.setAttribute('cx', X(pos[0]).toFixed(1)); dot.setAttribute('cy', Y(pos[1]).toFixed(1));
    dot.style.display = Math.abs(pos[0]) > R || Math.abs(pos[1]) > R ? 'none' : '';
    const w = Math.min(P.window, hist.length), recent = hist.slice(-w), avg = recent.reduce((s, v) => s + v, 0) / w, now = hist[hist.length - 1];
    if (showTrace) {
      tg.textContent = '';
      const span = Math.max(hist.length, 150), TX = i => 4 + (i / (span - 1)) * (TW - 8), off = 0;
      tg.append(sv('line', { x1: 4, x2: TW - 4, y1: TY(H), y2: TY(H), class: 'sw-H' }),
        sv('polyline', { points: hist.map((v, i) => `${TX(i + off).toFixed(1)},${TY(v).toFixed(1)}`).join(' '), class: 'sw-tline' }),
        sv('line', { x1: TX(hist.length - w), x2: TX(hist.length - 1), y1: TY(avg), y2: TY(avg), class: 'sw-avg' }));
    }
    kS.out.textContent = fmt(k); qS.out.textContent = fmt(q);
    qS.row.style.display = mode === 'circulating' ? '' : 'none'; kS.row.style.display = mode === 'none' || cfg.showStrength === false ? 'none' : '';
    modeBtns.forEach((bt, i) => bt.classList.toggle('on', modes[i] === mode));
    playBtn.textContent = playing ? L.pause : L.play;
    read.textContent = '';
    read.append(h('div', {}, h('b', {}, M(`${L.surprise}, ${L.now}: `)), M(`$${f1(now)}$`)),
      h('div', {}, h('b', {}, M(`${L.surprise}, ${L.avg}: `)), M(`$${f1(avg)}$`)),
      h('div', {}, h('b', {}, M(`${L.surprise}, ${L.entropy}: `)), M(`$${f1(H)}$`)));
    el.dataset.avg = f1(avg); el.dataset.now = f1(now); el.dataset.H = f1(H); el.dataset.mode = mode;
  }
  function loop() {
    cancelAnimationFrame(raf);
    const tick = () => {
      if (!alive || !playing) return;
      if (!el.isConnected) { alive = false; return; }
      for (let i = 0; i < P.every; i++) step();
      draw(); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  restart(); draw();
  if (playing) loop();
}
