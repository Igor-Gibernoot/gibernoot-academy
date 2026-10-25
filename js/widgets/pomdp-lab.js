// pomdp-lab
//
// A small discrete-time model (POMDP): Ns hidden states, No outcomes, T time steps, 1-3 actions.
// Editable heat-grids for A (likelihood), B_u (transitions, one grid per action) and D (initial prior);
// every column is a probability vector: editing a cell rescales the rest of its column.
// Conventions (book): A[o][s] = P(o|s), B[u][s'][s] = P(s'|s,u), D = P(s_1), policy = one action per
// transition (T-1 actions), tau = 1..T. F and G are MINIMISED, nothing is sign-flipped:
//   F_pi,tau = s_tau . ( ln s_tau - ln A.o_tau - ln B s_{tau-1} ),   s_0 := D,   F_pi = sum_tau F_pi,tau
//   G_pi,tau = KL[ A s_tau || C ] + H . s_tau,  H_j = -sum_o A[o][j] ln A[o][j]
//   pi = softmax( -G - F )
// Mode 'generate': pick a policy; 'Sample' draws a (seeded) true state path and outcomes; 'Predict' shows the
//   forward beliefs s_tau = B s_{tau-1} and predicted outcomes A s_tau as bars, plus the ambiguity H.s per step.
// Mode 'infer': set the observed outcomes (one select per step; '-' = not observed), then run
//   v' = -grad_s F_pi, s = softmax(v) (Euler, step size dt; Play / Step / Reset). Shows the bars of s_tau moving,
//   the F_pi curve falling, the exact posterior (forward-backward) as ticks, and per policy F, G, pi.
//   The gradient is the exact gradient of the F above (including the term through s_{tau+1}), so F never rises
//   for small dt; the fixed point is the minimum of this F, close to but not identical with the exact posterior.
//
// Config (a preset overrides the same-named key):
//   states: [labels]   outcomes: [labels]   actions: [labels]
//   short: { states: [..], outcomes: [..] }   short names (bars, grid headers); default: first 3 characters
//   A: [[..Ns] per outcome]   B: { actionLabel: [[..Ns] per next state] }   D: [..Ns]   C: [..No] preferences (probabilities)
//   T: 3   policies: [[actionLabel, ...]]   gFrom: 2 (first step counted in G)
//   mode: 'generate' | 'infer'   modes: ['generate','infer']   policy: 0   obs: [outcome index or -1 per step]
//   editable: true   seed: 1   dt: 0.25   maxIter: 200
//   showA / showB / showD / showAmbiguity / showExact / showCurve / showPolicies: true
//   labels: { generate, infer, policy, sample, predict, play, pause, step, reset, stepSize, iter, observe, none, useSample,
//             predStates, predOutcomes, ambiguity, trueState, drawn, exact, curve, free, expected, post, grids, nothing }
//   presets: [{ label, ...any config key above }]

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const M = src => h('span', { html: mdInline(String(src)) });
const EPS = 1e-10;
const lg = x => Math.log(Math.max(x, EPS));
const norm = a => { const s = a.reduce((x, y) => x + y, 0) || 1; return a.map(v => v / s); };
const softmax = v => { const m = Math.max(...v); return norm(v.map(x => Math.exp(x - m))); };
const mv = (X, s) => X.map(r => r.reduce((a, x, j) => a + x * s[j], 0));                       // X s
const mtv = (X, s) => X[0].map((_, j) => X.reduce((a, r, i) => a + r[j] * s[i], 0));          // X^T s
const rng = seed => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const draw1 = (p, r) => { let u = r(), k = 0; for (; k < p.length - 1; k++) { u -= p[k]; if (u < 0) break; } return k; };
const fmt = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '−');

// ---- pure maths (exported for tests). model = { A, B: {key: matrix}, D, T }, pol = [keys], obs = [index or -1]
const Bat = (m, pol, t) => m.B[pol[Math.min(t, pol.length - 1)]];   // transition from step t to t+1 (0-based)
const lik = (m, obs, t) => (obs[t] >= 0 ? m.A[obs[t]].slice() : m.A[0].map(() => 1));
export function forward(m, pol) {
  const s = [m.D.slice()];
  for (let t = 1; t < m.T; t++) s.push(mv(Bat(m, pol, t - 1), s[t - 1]));
  return s;
}
export function freeEnergy(m, pol, obs, s) {
  let F = 0;
  for (let t = 0; t < m.T; t++) {
    const prior = t === 0 ? m.D : mv(Bat(m, pol, t - 1), s[t - 1]), L = lik(m, obs, t);
    s[t].forEach((x, j) => { F += x * (lg(x) - lg(L[j]) - lg(prior[j])); });
  }
  return F;
}
export function gradient(m, pol, obs, s) {
  return s.map((st, t) => {
    const prior = t === 0 ? m.D : mv(Bat(m, pol, t - 1), s[t - 1]), L = lik(m, obs, t);
    let back = st.map(() => 0);
    if (t < m.T - 1) { const Bm = Bat(m, pol, t), p = mv(Bm, st); back = mtv(Bm, s[t + 1].map((x, i) => x / Math.max(p[i], EPS))); }
    return st.map((x, j) => lg(x) - lg(L[j]) - lg(prior[j]) - back[j]);
  });
}
export function step(m, pol, obs, v, dt) {
  const s = v.map(softmax), g = gradient(m, pol, obs, s);
  return v.map((vt, t) => vt.map((x, j) => x - dt * g[t][j]));
}
export function runInfer(m, pol, obs, dt = 0.25, maxIter = 400) {
  let v = Array.from({ length: m.T }, () => m.D.map(() => Math.log(1 / m.D.length))), F = freeEnergy(m, pol, obs, v.map(softmax));
  for (let i = 0; i < maxIter; i++) {
    v = step(m, pol, obs, v, dt);
    const F2 = freeEnergy(m, pol, obs, v.map(softmax));
    if (Math.abs(F2 - F) < 1e-12) { F = F2; break; }
    F = F2;
  }
  return { s: v.map(softmax), F };
}
export function exact(m, pol, obs) {         // forward-backward
  const T = m.T, al = [], be = Array(T);
  for (let t = 0; t < T; t++) { const L = lik(m, obs, t), pr = t === 0 ? m.D : mv(Bat(m, pol, t - 1), al[t - 1]); al.push(norm(pr.map((x, j) => x * L[j]))); }
  be[T - 1] = m.D.map(() => 1);
  for (let t = T - 2; t >= 0; t--) { const L = lik(m, obs, t + 1); be[t] = norm(mtv(Bat(m, pol, t), be[t + 1].map((b, j) => b * L[j]))); }
  return al.map((a, t) => norm(a.map((x, j) => x * be[t][j])));
}
export const entropies = A => A[0].map((_, j) => -A.reduce((a, r) => a + r[j] * Math.log(Math.max(r[j], EPS)), 0));
export function expectedFE(m, pol, s, C, gFrom = 1) {
  const H = entropies(m.A);
  let G = 0;
  for (let t = Math.max(0, gFrom - 1); t < m.T; t++) {
    const o = mv(m.A, s[t]);
    G += o.reduce((a, x, k) => a + (x > 1e-12 ? x * (Math.log(x) - lg(C[k])) : 0), 0) + s[t].reduce((a, x, j) => a + x * H[j], 0);
  }
  return G;
}
export const policyPosterior = (G, F) => softmax(G.map((g, i) => -g - F[i]));

// ---- widget
const short = a => (a ?? []).map(String);
export function pomdpLab(el, cfg) {
  const L = { generate: 'Generate', infer: 'Infer', policy: 'Policy', sample: 'Sample a trajectory', predict: 'Predict', play: 'Play', pause: 'Pause', step: 'Step',
    reset: 'Reset', stepSize: 'Step size', iter: 'iteration', observe: 'Observed outcome at each step', none: '–', useSample: 'Use the sampled outcomes',
    predStates: 'Predicted states', predOutcomes: 'Predicted outcomes', ambiguity: 'Ambiguity', trueState: 'True state', drawn: 'Outcome drawn',
    exact: 'exact posterior', curve: 'Free energy', free: 'F', expected: 'G', post: 'Policy probability', grids: 'Model (each column sums to 1)',
    nothing: 'Press Sample.', ...(cfg.labels ?? {}) };
  const presets = cfg.presets?.length ? cfg.presets : [{}];
  let pi = 0, spec, m, names, snames, onames, anames, polKeys, polIdx = 0, mode = 'generate', obs = [], v = [], hist = [], iter = 0, dt = 0.25, maxIter = 200;
  let sample = null, nSample = 0, predicted = false, bAct = 0, timer = null, fixed = false;
  const deep = x => JSON.parse(JSON.stringify(x));
  const uid = Math.random().toString(36).slice(2, 7);

  const root = h('div', { class: 'pl-root' });
  el.append(root);
  const ui = {};

  function load(i) {
    stop(); pi = i;
    spec = { ...cfg, ...presets[i] };
    names = spec.states ?? []; onames = spec.outcomes ?? []; anames = spec.actions ?? Object.keys(spec.B);
    snames = short(spec.short?.states ?? names.map(x => String(x).replace(/[$\\{}]/g, '').slice(0, 3)));
    const on = short(spec.short?.outcomes ?? onames.map(x => String(x).replace(/[$\\{}]/g, '').slice(0, 3)));
    ui.on = on;
    m = { A: deep(spec.A), B: deep(spec.B), D: deep(spec.D), T: spec.T ?? 3 };
    m.A = m.A.map(r => r.slice()); // rows = outcomes
    for (const mat of [m.A, ...Object.values(m.B)]) normCols(mat);
    m.D = norm(m.D);
    const C = (spec.C ?? onames.map(() => 1)).map(x => Math.max(EPS, x)); m.C = norm(C);
    polKeys = (spec.policies ?? anames.map(a => Array(m.T - 1).fill(a))).map(p => p.slice());
    polIdx = Math.min(spec.policy ?? 0, polKeys.length - 1);
    mode = (spec.modes ?? ['generate', 'infer']).includes(spec.mode) ? spec.mode : (spec.modes ?? ['generate', 'infer'])[0];
    dt = spec.dt ?? 0.25; maxIter = spec.maxIter ?? 200;
    obs = Array.from({ length: m.T }, (_, t) => (spec.obs?.[t] ?? -1));
    sample = null; nSample = 0; predicted = false; bAct = 0;
    build(); resetInfer(); draw();
    ui.pre.forEach((b, j) => { b.classList.toggle('primary', j === i); b.classList.toggle('ghost', j !== i); });
  }
  function normCols(mat) { for (let j = 0; j < mat[0].length; j++) { const c = norm(mat.map(r => Math.max(0, r[j]))); mat.forEach((r, i) => { r[j] = c[i]; }); } }
  const polName = p => p.map(k => k).join(' → ');
  const model = () => ({ ...m });
  function resetInfer() { stop(); iter = 0; fixed = false; v = Array.from({ length: m.T }, () => m.D.map(() => Math.log(1 / m.D.length))); hist = [freeEnergy(m, polKeys[polIdx], obs, v.map(softmax))]; }
  function stop() { if (timer) { clearInterval(timer); timer = null; } if (ui.play) ui.play.textContent = L.play; }
  function doStep() {
    if (iter >= maxIter) return stop();
    v = step(m, polKeys[polIdx], obs, v, dt); iter++;
    const F = freeEnergy(m, polKeys[polIdx], obs, v.map(softmax));
    fixed = Math.abs(F - hist[hist.length - 1]) < 1e-9;
    hist.push(F); draw();
    if (fixed) stop();
  }

  // ---- building blocks
  function bars(vals, labels, color, ticks, tall) {
    const box = h('div', { class: 'pl-bars' + (tall ? ' pl-tall' : '') });
    const cols = vals.map((_, j) => {
      const fill = h('span', { class: 'pl-fill', style: `background:${color}` });
      const tick = h('span', { class: 'pl-tick' });
      const val = h('span', { class: 'pl-bval' });
      if (vals.length > 4) val.style.display = 'none';
      const col = h('div', { class: 'pl-col', title: String(labels[j] ?? '').replace(/[$\\{}]/g, '') }, val, h('span', { class: 'pl-track' }, fill, tick), h('span', { class: 'pl-bname' }, M(labels[j] ?? '')));
      box.append(col);
      return { fill, tick, val };
    });
    return { box, set(p, tk) { cols.forEach((c, j) => { c.fill.style.height = `${Math.max(0, Math.min(1, p[j])) * 100}%`; c.val.textContent = fmt(p[j]);
      c.tick.style.display = tk ? '' : 'none'; if (tk) c.tick.style.bottom = `${Math.max(0, Math.min(1, tk[j])) * 100}%`; }); } };
  }
  function grid(title, rowL, colL, mat, onEdit) {
    const cells = [], cap = h('div', { class: 'pl-gtitle' }, M(title));
    const tbl = h('div', { class: 'pl-grid', style: `grid-template-columns: 2.4em repeat(${colL.length}, minmax(0, 1fr))` });
    tbl.append(h('span'));
    colL.forEach(c => tbl.append(h('span', { class: 'pl-gh' }, M(c))));
    rowL.forEach((rl, i) => {
      tbl.append(h('span', { class: 'pl-gh pl-rh' }, M(rl)));
      colL.forEach((_, j) => {
        const inp = h('input', { type: 'text', inputmode: 'decimal', class: 'pl-cell', 'aria-label': `${title} ${i + 1},${j + 1}`, disabled: spec.editable === false ? true : null });
        inp.addEventListener('change', () => {
          const x = Math.max(0, Math.min(1, parseFloat(String(inp.value).replace(',', '.')) || 0)), rest = 1 - mat[i][j], n = rowL.length;
          mat.forEach((r, k) => { if (k === i) r[j] = x; else r[j] = rest > 1e-9 ? r[j] * (1 - x) / rest : (n > 1 ? (1 - x) / (n - 1) : 0); });
          onEdit(); refreshAll();
        });
        tbl.append(inp); cells.push({ inp, i, j });
      });
    });
    return { el: h('div', { class: 'pl-gbox' }, cap, tbl), refresh() { cells.forEach(({ inp, i, j }) => { const x = mat[i][j]; inp.value = String(+x.toFixed(2));
      inp.style.background = `color-mix(in srgb, var(--ok, #2e9e6b) ${Math.round(x * 85)}%, var(--surface))`; }); } };
  }

  let gridList = [];
  function build() {
    root.textContent = ''; gridList = [];
    const modes = spec.modes ?? ['generate', 'infer'];
    ui.pre = presets.length > 1 ? presets.map((p, i) => h('button', { class: 'btn ghost', type: 'button', onclick: () => load(i) }, M(p.label ?? String(i + 1)))) : [];
    ui.tabs = modes.map(md => h('button', { class: 'btn ghost', type: 'button', onclick: () => { mode = md; stop(); draw(); } }, L[md]));
    root.append(ui.pre.length ? h('div', { class: 'wbtns pl-pre' }, ...ui.pre) : '', modes.length > 1 ? h('div', { class: 'wbtns pl-tabs' }, ...ui.tabs) : '');

    // model grids
    const gridRow = h('div', { class: 'pl-grids' });
    if (spec.showA !== false) { const g = grid('$\\mathbf{A}$', ui.on, snames, m.A, () => {}); gridList.push(g); gridRow.append(g.el); }
    if (spec.showB !== false) {
      const Bg = anames.map(a => grid(`$\\mathbf{B}_{\\text{${a}}}$`, snames, snames, m.B[a], () => {}));
      ui.Bg = Bg; gridList.push(...Bg);
      ui.bbtn = anames.map((a, k) => h('button', { class: 'btn ghost', type: 'button', onclick: () => { bAct = k; ui.showB(); } }, M(a)));
      gridRow.append(h('div', { class: 'pl-bsel' }, h('div', { class: 'wbtns pl-bbtns' }, ...ui.bbtn), ...Bg.map(g => g.el)));
    }
    if (spec.showD !== false) { ui.dmat = m.D.map(x => [x]); const g = grid('$\\mathbf{D}$', snames, ['\u00b7'], ui.dmat, () => { m.D = ui.dmat.map(r => r[0]); }); gridList.push(g); g.el.classList.add('pl-dbox'); gridRow.append(g.el); }
    ui.showB = () => { ui.Bg?.forEach((g, k) => { g.el.style.display = k === bAct ? '' : 'none'; }); ui.bbtn?.forEach((b, k) => { b.classList.toggle('primary', k === bAct); b.classList.toggle('ghost', k !== bAct); }); };
    if (gridRow.children.length) root.append(h('div', { class: 'pl-sub' }, M(L.grids)), gridRow);

    // policy buttons
    ui.pbtn = polKeys.map((p, i) => h('button', { class: 'btn ghost', type: 'button', onclick: () => { polIdx = i; predicted = false; sample = null; resetInfer(); draw(); } }, M(polName(p))));
    root.append(h('div', { class: 'pl-sub' }, M(L.policy)), h('div', { class: 'wbtns pl-pol' }, ...ui.pbtn));

    // generate panel
    ui.sampleBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => { const r = rng((spec.seed ?? 1) * 7919 + nSample++ * 104729), pol = polKeys[polIdx], path = [], outs = [];
      let s = draw1(m.D, r);
      for (let t = 0; t < m.T; t++) { path.push(s); outs.push(draw1(m.A.map(row => row[s]), r)); if (t < m.T - 1) s = draw1(Bat(m, pol, t).map(row => row[s]), r); }
      sample = { path, outs }; draw(); } }, L.sample);
    ui.predBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { predicted = !predicted; draw(); } }, L.predict);
    ui.pathBox = h('div', { class: 'pl-path' });
    ui.fwdBox = h('div', { class: 'pl-steps' });
    ui.fwd = Array.from({ length: m.T }, (_, t) => {
      const sb = bars(m.D, snames, 'var(--ok, #2e9e6b)', null), ob = bars(onames, ui.on, '#1f8a9e', null), amb = h('div', { class: 'pl-amb' });
      ui.fwdBox.append(h('div', { class: 'pl-step' }, h('div', { class: 'pl-sh' }, `${L.step_ === 'step' ? 'τ' : ''} ${t + 1}`), sb.box, ob.box, amb));
      return { sb, ob, amb };
    });
    ui.gen = h('div', { class: 'pl-gen' }, h('div', { class: 'wbtns' }, ui.sampleBtn, ui.predBtn), ui.pathBox, ui.fwdBox);
    if (spec.showAmbiguity === false) ui.fwd.forEach(f => { f.amb.style.display = 'none'; });

    // infer panel
    ui.sel = Array.from({ length: m.T }, (_, t) => {
      const s = h('select', { class: 'pl-sel', 'aria-label': `${L.observe} ${t + 1}` }, h('option', { value: -1 }, L.none), ...onames.map((o, k) => h('option', { value: k }, String(o).replace(/[$\\{}]/g, ''))));
      s.addEventListener('change', () => { obs[t] = +s.value; resetInfer(); draw(); });
      return s;
    });
    ui.ibars = Array.from({ length: m.T }, () => bars(m.D, snames, 'var(--ok, #2e9e6b)', m.D, true));
    ui.istep = h('div', { class: 'pl-steps' }, ...ui.ibars.map((b, t) => h('div', { class: 'pl-step' }, h('div', { class: 'pl-sh' }, `τ ${t + 1}`), ui.sel[t], b.box)));
    ui.play = h('button', { class: 'btn primary', type: 'button', onclick: () => { if (timer) return stop(); if (fixed || iter >= maxIter) resetInfer();
      ui.play.textContent = L.pause; timer = setInterval(() => { if (!el.isConnected) return stop(); doStep(); }, 90); } }, L.play);
    ui.stepBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); doStep(); } }, L.step);
    ui.resetBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { resetInfer(); draw(); } }, L.reset);
    ui.useBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { if (sample) { obs = sample.outs.slice(); resetInfer(); draw(); } } }, L.useSample);
    ui.dtInp = h('input', { type: 'range', min: 0.05, max: 0.8, step: 0.05, 'aria-label': L.stepSize });
    ui.dtInp.addEventListener('input', () => { dt = +ui.dtInp.value; draw(); });
    ui.dtVal = h('span', { class: 'fe-val' });
    ui.curve = h('div', { class: 'pl-curve' });
    ui.read = h('div', { class: 'pl-read' });
    ui.polBox = h('div', { class: 'pl-polbox' });
    ui.prow = polKeys.map(p => {
      const mk = (c) => { const fill = h('span', { class: 'fe-fill', style: `background:${c}` }), val = h('span', { class: 'fe-val fe-bval' }); return { fill, val, row: h('div', { class: 'fe-brow pl-prow' }, h('div', { class: 'fe-blabel' }, h('span'), val), h('span', { class: 'fe-bar' }, fill)) }; };
      const f = mk('#c0504d'), g = mk('#1f8a9e'), pr = mk('var(--ok, #2e9e6b)');
      [[f, L.free], [g, L.expected], [pr, L.post]].forEach(([x, t]) => x.row.firstChild.firstChild.append(M(t)));
      return { f, g, pr, card: h('div', { class: 'fe-sec pl-pcard' }, h('div', { class: 'fe-title' }, M(polName(p))), f.row, g.row, pr.row) };
    });
    ui.prow.forEach(r => ui.polBox.append(r.card));
    ui.inf = h('div', { class: 'pl-inf' },
      h('div', { class: 'pl-sub' }, M(L.observe)), ui.istep,
      h('div', { class: 'wbtns' }, ui.play, ui.stepBtn, ui.resetBtn, ui.useBtn),
      h('div', { class: 'fe-qrow pl-dtrow' }, h('span', { class: 'fe-name' }, M(L.stepSize)), ui.dtInp, ui.dtVal),
      ui.read, spec.showCurve !== false ? ui.curve : '',
      spec.showPolicies !== false ? h('div', {}, h('div', { class: 'pl-sub' }, M(`${L.free}, ${L.expected}, ${L.post}`)), ui.polBox) : '');
    root.append(ui.gen, ui.inf);
    ui.showB();
  }

  function refreshAll() {
    // keep D grid in sync, then invalidate inference and sample
    stop(); sample = null; resetInfer(); draw();
  }

  function curveSvg() {
    const W = 220, Hh = 80, p = 8, ys = hist, lo = Math.min(...ys), hi = Math.max(...ys), span = Math.max(hi - lo, 1e-9), n = Math.max(ys.length - 1, 20);
    const pts = ys.map((y, i) => `${(p + (i / n) * (W - 2 * p)).toFixed(1)},${(p + (1 - (y - lo) / span) * (Hh - 2 * p)).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${W} ${Hh}" class="pl-csvg" role="img" aria-label="${L.curve}"><line x1="${p}" y1="${Hh - p}" x2="${W - p}" y2="${Hh - p}" class="pl-axis"/><line x1="${p}" y1="${p}" x2="${p}" y2="${Hh - p}" class="pl-axis"/><polyline points="${pts}" class="pl-cline"/></svg>`;
  }

  function draw() {
    const pol = polKeys[polIdx], modes = spec.modes ?? ['generate', 'infer'];
    ui.tabs.forEach((b, k) => { b.classList.toggle('primary', modes[k] === mode); b.classList.toggle('ghost', modes[k] !== mode); });
    ui.pbtn.forEach((b, i) => { b.classList.toggle('primary', i === polIdx); b.classList.toggle('ghost', i !== polIdx); });
    ui.gen.style.display = mode === 'generate' ? '' : 'none';
    ui.inf.style.display = mode === 'infer' ? '' : 'none';
    ui.predBtn.classList.toggle('primary', predicted); ui.predBtn.classList.toggle('ghost', !predicted);
    gridList.forEach(g => g.refresh());
    const H = entropies(m.A), fw = forward(m, pol);
    // generate
    ui.pathBox.textContent = '';
    ui.pathBox.append(sample ? h('div', {}, M(`${L.trueState}: ` + sample.path.map(j => names[j]).join(' → ')), h('br'), M(`${L.drawn}: ` + sample.outs.map(k => onames[k]).join(' → '))) : h('div', { class: 'pl-muted' }, M(L.nothing)));
    ui.fwd.forEach((f, t) => {
      const vis = predicted;
      f.sb.box.style.display = f.ob.box.style.display = vis ? '' : 'none';
      f.amb.style.display = vis && spec.showAmbiguity !== false ? '' : 'none';
      if (vis) { f.sb.set(fw[t]); f.ob.set(mv(m.A, fw[t])); f.amb.textContent = ''; f.amb.append(M(`${L.ambiguity} $\\mathbf H\\cdot\\mathbf s$ = ${fmt(H.reduce((a, x, j) => a + x * fw[t][j], 0))}`)); }
      f.sb.box.classList.toggle('pl-on', vis);
    });
    const hl = ui.fwdBox.querySelectorAll('.pl-sh');
    hl.forEach((e, t) => { e.textContent = `τ ${t + 1}` + (sample ? ` · ${names[sample.path[t]]} → ${onames[sample.outs[t]]}`.replace(/[$\\{}]/g, '') : ''); });
    // labels of predicted bars (outcomes get their own legend)
    // infer
    ui.sel.forEach((s, t) => { s.value = String(obs[t]); });
    ui.useBtn.style.display = sample ? '' : 'none';
    ui.dtInp.value = dt; ui.dtVal.textContent = `${fmt(dt)}`;
    const s = v.map(softmax), ex = spec.showExact === false ? null : exact(m, pol, obs);
    ui.ibars.forEach((b, t) => b.set(s[t], ex ? ex[t] : null));
    const F = hist[hist.length - 1];
    ui.read.textContent = '';
    ui.read.append(M(`${L.iter} ${iter} · $F_\\pi$ = ${fmt(F, 3)} nats${fixed ? ' · converged' : ''}` + (ex ? ` · ticks = ${L.exact} (max gap ${fmt(Math.max(...s.flatMap((x, t) => x.map((y, j) => Math.abs(y - ex[t][j])))))})` : '')));
    ui.curve.innerHTML = curveSvg();
    // policies (converged inference of each)
    const res = polKeys.map(p => runInfer(m, p, obs, Math.min(dt, 0.4), 400));
    const Gs = polKeys.map((p, i) => expectedFE(m, p, res[i].s, m.C, spec.gFrom ?? 2));
    const Fs = res.map(r => r.F), pp = policyPosterior(Gs, Fs), top = Math.max(0.05, ...Fs.map(Math.abs), ...Gs.map(Math.abs)) * 1.05;
    ui.prow.forEach((r, i) => {
      r.f.fill.style.width = `${Math.min(100, Math.abs(Fs[i]) / top * 100)}%`; r.f.val.textContent = `${fmt(Fs[i])} nats`;
      r.g.fill.style.width = `${Math.min(100, Math.abs(Gs[i]) / top * 100)}%`; r.g.val.textContent = `${fmt(Gs[i])} nats`;
      r.pr.fill.style.width = `${pp[i] * 100}%`; r.pr.val.textContent = `${fmt(pp[i] * 100, 1)}%`;
      r.card.classList.toggle('ps-best', pp[i] === Math.max(...pp));
    });
    el.dataset.mode = mode; el.dataset.policy = polKeys[polIdx].join(','); el.dataset.iter = iter; el.dataset.F = F.toFixed(4);
    el.dataset.s = JSON.stringify(s.map(x => x.map(y => +y.toFixed(3)))); el.dataset.exact = JSON.stringify((ex ?? []).map(x => x.map(y => +y.toFixed(3))));
    el.dataset.pi = pp.map(x => x.toFixed(4)).join(','); el.dataset.g = Gs.map(x => x.toFixed(4)).join(','); el.dataset.fs = Fs.map(x => x.toFixed(4)).join(',');
    el.dataset.path = sample ? sample.path.join(',') : ''; el.dataset.outs = sample ? sample.outs.join(',') : '';
  }
  load(0);
}
