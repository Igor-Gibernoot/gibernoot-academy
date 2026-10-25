// mean-field-vb
//
// Mean-field variational Bayes on a joint over two discrete latent variables x1 (K1 values) and x2 (K2 values)
// for a fixed observation y (K <= 4). J[i][j] = p(y, x1=i, x2=j) (it sums to p(y)). Book signs, nothing flipped:
//   F[q] = sum q (ln q - ln p(y,x)) = KL[q || p(x|y)] - ln p(y)     (MINIMISED),   q(x1,x2) = q1(x1) q2(x2)
//   coordinate update (A.42):  ln q_i(x_i) = E_{q_{\i}}[ ln p(y,x) ] + const
// Each update minimises F over one factor with the other held fixed, so F never rises. The best factorised F
// cannot go below  -ln p(y) + (gap of the best product), and that gap is 0 only if the posterior is itself a product.
//
// Config (a preset overrides the same-named key):
//   joint: [[..K2] per x1]                   the table p(y,x1,x2), any positive scale, OR
//   marg1, marg2: [..], rho: 0.8, py: 0.2    base marginals (default uniform) and a correlation knob |rho|<1:
//                                            J_ij = py * a_i b_j (1 + rho u_i v_j) / norm, u,v = positions in [-1,1]
//   K: [K1, K2]  (when neither joint nor marginals are given)   q1: [..]  q2: [..]  start beliefs (default uniform)
//   names: [[x1 labels], [x2 labels]]   (KaTeX sources, used in headers and slider names)
//   rhoSlider: true      slider for rho (only with the marginal/rho form)
//   showMessages / showTrace / showSliders: true
//   labels: { joint, post, prod, update1, update2, sweep, reset, messages, hideMessages, rho, F, surprise, gap, best,
//             trace, traceKey, sum, result }
//   presets: [{ label, ...any config key above }]

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const M = src => h('span', { html: mdInline(String(src)) });
const TINY = 1e-300;
const lg = x => Math.log(Math.max(x, TINY));
const norm = a => { const s = a.reduce((x, y) => x + y, 0) || 1; return a.map(v => v / s); };
const softmax = v => { const m = Math.max(...v); return norm(v.map(x => Math.exp(x - m))); };
const fmt = (x, d = 3) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '−');
const uni = n => Array.from({ length: n }, () => 1 / n);

// ---- pure maths (exported for tests)
export function makeJoint({ marg1, marg2, rho = 0, py = 0.2, K = [2, 2] }) {
  const a = norm(marg1 ?? uni(K[0])), b = norm(marg2 ?? uni(K[1]));
  const pos = n => Array.from({ length: n }, (_, i) => (n > 1 ? (i - (n - 1) / 2) / ((n - 1) / 2) : 0));
  const u = pos(a.length), v = pos(b.length);
  const J = a.map((ai, i) => b.map((bj, j) => ai * bj * (1 + rho * u[i] * v[j])));
  const s = J.flat().reduce((x, y) => x + y, 0);
  return J.map(r => r.map(x => x / s * py));
}
export const evidence = J => J.flat().reduce((x, y) => x + y, 0);
export const posterior = J => { const z = evidence(J); return J.map(r => r.map(x => x / z)); };
export const surprise = J => -Math.log(evidence(J));
export function freeEnergy(J, q1, q2) {
  let F = 0;
  J.forEach((r, i) => r.forEach((x, j) => { const q = q1[i] * q2[j]; if (q > 0) F += q * (Math.log(q) - lg(x)); }));
  return F;
}
export const gapOf = (J, q1, q2) => freeEnergy(J, q1, q2) - surprise(J);          // = KL[q || p(x|y)]
export const msg1 = (J, q2) => J.map(r => r.reduce((a, x, j) => a + q2[j] * lg(x), 0));      // E_{q2}[ln p(y,x1=i,x2)]
export const msg2 = (J, q1) => J[0].map((_, j) => J.reduce((a, r, i) => a + q1[i] * lg(r[j]), 0));
export const update1 = (J, q2) => softmax(msg1(J, q2));
export const update2 = (J, q1) => softmax(msg2(J, q1));
// smallest gap reachable by a product q1 q2: many starts, coordinate sweeps (local optima are possible, so take the best)
export function bestGap(J) {
  const K1 = J.length, K2 = J[0].length, starts = [];
  let s = 12345; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let k = 0; k < 24; k++) starts.push(k === 0 ? [uni(K1), uni(K2)] : [norm(uni(K1).map(() => 0.05 + r())), norm(uni(K2).map(() => 0.05 + r()))]);
  for (let i = 0; i < K1; i++) for (let j = 0; j < K2; j++) starts.push([uni(K1).map((_, k) => (k === i ? 0.9 : 0.1 / (K1 - 1 || 1))), uni(K2).map((_, k) => (k === j ? 0.9 : 0.1 / (K2 - 1 || 1)))]);
  let best = Infinity;
  for (const [a0, b0] of starts) {
    let a = a0, b = b0;
    for (let it = 0; it < 300; it++) { a = update1(J, b); b = update2(J, a); }
    best = Math.min(best, gapOf(J, a, b));
  }
  return Math.max(0, best);
}

export function meanFieldVb(el, cfg) {
  const L = { joint: 'Joint $p(y,x)$', post: 'Exact posterior $p(x\\mid y)$', prod: 'Product $q_1q_2$', update1: 'Update $q_1$', update2: 'Update $q_2$',
    sweep: 'Sweep', reset: 'Reset', messages: 'Show message terms', hideMessages: 'Hide message terms', rho: 'Correlation $\\rho$',
    F: '$F[q]$', surprise: '$-\\ln p(y)$', gap: 'gap $=D_{KL}[q\\,\\|\\,p(x\\mid y)]$', best: 'smallest gap of any product',
    trace: '$F$ after each update', term: 'terms', sum: 'sum', result: 'new $q$', traceKey: 'dashed line: $-\\ln p(y)$; dotted line: $-\\ln p(y)$ plus the smallest gap of any product', ...(cfg.labels ?? {}) };
  const presets = cfg.presets?.length ? cfg.presets : [{}];
  let gen = 0, spec, J, K1, K2, n1, n2, w1, w2, q1, q2, hist = [], best = 0, showMsg = false, nUpd = 0, last = null;
  const root = h('div', { class: 'mf-root' });
  el.append(root);
  const ui = {};

  function build() {
    spec = { ...cfg, ...presets[pi] };
    if (spec.joint) J = spec.joint.map(r => r.map(Number));
    else J = makeJoint({ marg1: spec.marg1, marg2: spec.marg2, rho: rho, py: spec.py ?? 0.2, K: spec.K ?? [spec.marg1?.length ?? 2, spec.marg2?.length ?? 2] });
    K1 = J.length; K2 = J[0].length;
    n1 = spec.names?.[0] ?? Array.from({ length: K1 }, (_, i) => String(i + 1));
    n2 = spec.names?.[1] ?? Array.from({ length: K2 }, (_, i) => String(i + 1));
    best = bestGap(J);
  }
  let pi = 0, rho = 0;
  function load(i) {
    pi = i; rho = presets[i].rho ?? cfg.rho ?? 0; build(); draw0();
  }
  function resetQ() {
    q1 = norm(spec.q1?.length === K1 ? spec.q1.slice() : uni(K1)); q2 = norm(spec.q2?.length === K2 ? spec.q2.slice() : uni(K2));
    w1 = q1.slice(); w2 = q2.slice(); hist = [freeEnergy(J, q1, q2)]; nUpd = 0; last = null; refresh();
  }

  function slider(i, k, name) {
    const g = gen;
    const inp = h('input', { type: 'range', min: 0, max: 1, step: 0.01, 'aria-label': `${i === 0 ? 'q1' : 'q2'} ${k + 1}` });
    const val = h('span', { class: 'fe-val' });
    inp.addEventListener('input', () => { if (g !== gen) return; (i === 0 ? w1 : w2)[k] = +inp.value; const w = i === 0 ? w1 : w2, q = norm(w); if (i === 0) q1 = q; else q2 = q;
      hist = [freeEnergy(J, q1, q2)]; nUpd = 0; last = null; refresh(); });
    return { inp, val, row: h('div', { class: 'fe-qrow mf-qrow' }, h('span', { class: 'fe-name' }, M(name)), inp, val) };
  }

  function heat(title, rowL, colL) {
    const cells = [];
    const tbl = h('div', { class: 'mf-grid', style: `grid-template-columns: 2.2em repeat(${colL.length}, minmax(0, 1fr))` });
    tbl.append(h('span'));
    colL.forEach(c => tbl.append(h('span', { class: 'mf-gh' }, M(c))));
    rowL.forEach(r => {
      tbl.append(h('span', { class: 'mf-gh mf-rh' }, M(r)));
      colL.forEach(() => { const c = h('span', { class: 'mf-cell' }); tbl.append(c); cells.push(c); });
    });
    return { el: h('div', { class: 'mf-gbox' }, h('div', { class: 'mf-gtitle' }, M(title)), tbl), cells,
      set(mat, color) { const mx = Math.max(...mat.flat(), 1e-12); cells.forEach((c, k) => { const x = mat[Math.floor(k / colL.length)][k % colL.length];
        c.textContent = fmt(x); c.style.background = `color-mix(in srgb, ${color} ${Math.round(Math.min(1, x / mx) * 85)}%, var(--surface))`; }); } };
  }

  function draw0() {
    root.textContent = ''; gen++;
    if (presets.length > 1) root.append(h('div', { class: 'wbtns mf-pre' }, ...presets.map((p, i) => h('button', { class: 'btn ' + (i === pi ? 'primary' : 'ghost'), type: 'button', onclick: () => load(i) }, M(p.label ?? String(i + 1))))));
    ui.gJ = heat(L.joint, n1, n2); ui.gP = heat(L.post, n1, n2); ui.gQ = heat(L.prod, n1, n2);
    root.append(h('div', { class: 'mf-grids' }, ui.gJ.el, ui.gP.el, ui.gQ.el));
    ui.s1 = n1.map((nm, k) => slider(0, k, `$q_1(${nm})$`)); ui.s2 = n2.map((nm, k) => slider(1, k, `$q_2(${nm})$`));
    if (spec.showSliders !== false) root.append(h('div', { class: 'mf-sliders' }, h('div', {}, ...ui.s1.map(s => s.row)), h('div', {}, ...ui.s2.map(s => s.row))));
    const btn = (label, fn, cls = 'ghost') => h('button', { class: 'btn ' + cls, type: 'button', onclick: fn }, M(label));
    ui.msgBtn = btn(L.messages, () => { showMsg = !showMsg; refresh(); });
    root.append(h('div', { class: 'wbtns mf-btns' }, btn(L.update1, () => doUpdate(1), 'primary'), btn(L.update2, () => doUpdate(2), 'primary'), btn(L.sweep, () => doUpdate(3), 'primary'),
      btn(L.reset, () => resetQ()), spec.showMessages === false ? '' : ui.msgBtn));
    if (spec.rhoSlider && !spec.joint) {
      ui.rho = h('input', { type: 'range', min: -0.95, max: 0.95, step: 0.05, 'aria-label': 'rho' }); ui.rhoVal = h('span', { class: 'fe-val' });
      const g = gen;
      ui.rho.addEventListener('input', () => { if (g !== gen) return; rho = +ui.rho.value; build(); ui.rho.value = rho; resetQ(); });
      root.append(h('div', { class: 'fe-qrow mf-rho' }, h('span', { class: 'fe-name' }, M(L.rho)), ui.rho, ui.rhoVal));
    }
    ui.read = h('div', { class: 'mf-read' });
    ui.msg = h('div', { class: 'mf-msg' });
    ui.trace = h('div', { class: 'mf-trace' });
    root.append(ui.read, ui.msg, spec.showTrace === false ? '' : ui.trace);
    resetQ();
  }

  function doUpdate(which) {
    const step = k => { if (k === 1) q1 = update1(J, q2); else q2 = update2(J, q1); w1 = q1.slice(); w2 = q2.slice(); nUpd++; hist.push(freeEnergy(J, q1, q2)); last = k; };
    if (which === 3) { step(1); step(2); } else step(which);
    refresh();
  }

  function traceSvg(sur) {
    const W = 240, Hh = 100, p = 10, n = Math.max(hist.length - 1, 6), floor = sur, ceil = Math.max(...hist, floor + 1e-6);
    const lo = floor - 0.05 * (ceil - floor), span = ceil - lo, X = i => p + (i / n) * (W - 2 * p), Y = y => p + (1 - (y - lo) / span) * (Hh - 2 * p);
    const pts = hist.map((y, i) => `${X(i).toFixed(1)},${Y(y).toFixed(1)}`).join(' ');
    const yb = Y(sur + best);
    return `<svg viewBox="0 0 ${W} ${Hh}" class="mf-svg" role="img" aria-label="trace"><line x1="${p}" y1="${Hh - p}" x2="${W - p}" y2="${Hh - p}" class="mf-axis"/>
<line x1="${p}" y1="${Y(sur).toFixed(1)}" x2="${W - p}" y2="${Y(sur).toFixed(1)}" class="mf-floor"/>
<line x1="${p}" y1="${yb.toFixed(1)}" x2="${W - p}" y2="${yb.toFixed(1)}" class="mf-best"/>
<polyline points="${pts}" class="mf-line"/>${hist.map((y, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="2.6" class="mf-dot"/>`).join('')}</svg>`;
  }

  function refresh() {
    const post = posterior(J), sur = surprise(J), F = hist[hist.length - 1], gap = F - sur;
    ui.gJ.set(J, '#6b7d8f'); ui.gP.set(post, '#2e9e6b'); ui.gQ.set(q1.map(a => q2.map(b => a * b)), '#c0504d');
    ui.s1.forEach((s, k) => { s.inp.value = w1[k]; s.val.textContent = fmt(q1[k], 2); });
    ui.s2.forEach((s, k) => { s.inp.value = w2[k]; s.val.textContent = fmt(q2[k], 2); });
    if (ui.rho) { ui.rho.value = rho; ui.rhoVal.textContent = fmt(rho, 2); }
    ui.msgBtn.textContent = ''; ui.msgBtn.append(M(showMsg ? L.hideMessages : L.messages));
    ui.read.textContent = '';
    const row = (name, val, cls = '') => h('div', { class: 'mf-ro ' + cls }, M(name), h('b', {}, `${val} nats`));
    ui.read.append(row(L.F, fmt(F)), row(L.surprise, fmt(sur)), row(L.gap, fmt(gap)), row(L.best, fmt(best), 'mf-bestrow'));
    ui.msg.textContent = '';
    if (showMsg) {
      const block = (_n, sy, ms, qn, names, other, oname) => {
        const t = h('table', { class: 'mf-tbl' });
        t.append(h('tr', {}, h('th', {}, M(`$${sy}$`)), ...other.map((_, j) => h('th', {}, M(`$q_${sy === 'x_1' ? 2 : 1}(${oname[j]})\\,\\ln p$`))), h('th', {}, M(L.sum)), h('th', {}, M(L.result))));
        ms.forEach((m, i) => {
          const cells = other.map((qo, j) => (sy === 'x_1' ? qo * lg(J[i][j]) : qo * lg(J[j][i])));
          t.append(h('tr', {}, h('td', {}, M(names[i])), ...cells.map(c => h('td', {}, fmt(c, 2))), h('td', {}, fmt(m, 2)), h('td', {}, fmt(qn[i], 3))));
        });
        return h('div', {}, h('div', { class: 'mf-sub' }, M(`$\\ln q_${sy === 'x_1' ? 1 : 2}(${sy})=\\mathbb E_{q_${sy === 'x_1' ? 2 : 1}}[\\ln p(y,x)]+\\text{const}$`)), t);
      };
      const m1 = msg1(J, q2), m2 = msg2(J, q1);
      ui.msg.append(block('Update', 'x_1', m1, softmax(m1), n1, q2, n2), block('Update', 'x_2', m2, softmax(m2), n2, q1, n1));
    }
    ui.trace.innerHTML = spec.showTrace === false ? '' : traceSvg(sur);
    if (spec.showTrace !== false) { ui.trace.prepend(h('div', { class: 'mf-sub' }, M(L.trace))); ui.trace.append(h('div', { class: 'mf-key' }, M(L.traceKey))); }
    el.dataset.F = F.toFixed(5); el.dataset.surprise = sur.toFixed(5); el.dataset.gap = gap.toFixed(5); el.dataset.best = best.toFixed(5);
    el.dataset.q1 = q1.map(x => x.toFixed(4)).join(','); el.dataset.q2 = q2.map(x => x.toFixed(4)).join(','); el.dataset.updates = nUpd;
    el.dataset.trace = hist.map(x => x.toFixed(5)).join(','); el.dataset.rho = String(rho);
  }
  load(0);
}
