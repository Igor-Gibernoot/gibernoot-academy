// policy-scorer
//
// 2-4 policies, K outcomes. For each policy pi the widget scores, in nats (Eq. 2.6 of the
// active-inference book; G is minimised, never negated):
//   risk      = KL[ Q(y|pi) || P(y|C) ]
//   ambiguity = E_Q(x|pi) H[P(y|x)]
//   G         = ambiguity + risk
//             = -(information gain) - (pragmatic value)
//   pragmatic value  = E_Q(y|pi) [ ln P(y|C) ]
//   information gain = E_Q(x,y|pi) KL[ Q(x|y,pi) || Q(x|pi) ]  = H[Q(y|pi)] - ambiguity
//   P(pi) = softmax(-gamma G)   (precision gamma over policies)
// The lowest-G policy is highlighted.
//
// Two modes:
//   qy mode:     policies: [{ name, qy: [..K], ambiguity }]  (ambiguity optional, default 0).
//                The second form needs states, so it is hidden (a note says so).
//   states mode: states: [names], likelihood: [[P(y_k|x_j)]_k for each state j] (rows sum to 1),
//                policies: [{ name, qx: [..] }]  (a policy may carry its own `likelihood`).
//                qy and ambiguity are computed; both forms are shown and agree.
//
//   outcomes: [labels]            K outcome labels (markdown inline)
//   C: [..K]                      P(y|C), normalised by the widget
//   editable: true                sliders: qy (qy mode) or qx (states mode), kept normalised
//   gamma: 1, gammaMax: 8         start and max of the precision slider
//   showRisk / showAmbiguity / showG / showPragmatic / showEpistemic / showProb / showGamma: false
//   showPrefs: false              hide the line "P(y|C): ..." (preferences)
//   unit: 'nats'
//   labels: { risk, ambiguity, g, pragmatic, epistemic, prob, gamma, lowest, reset, prefs, needsStates }
//   presets: [{ label, gamma, policies: [{qy|qx}] }]   (by policy order; any field optional)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const M = src => h('span', { html: mdInline(String(src)) });
const COLORS = ['var(--vec)', 'var(--covec)', 'var(--basis)', 'var(--ok, #2e9e6b)'];
const EPS = 1e-6;
const norm = a => { const s = a.reduce((x, y) => x + y, 0); return a.map(v => v / s); };
const plogp = p => (p > 1e-12 ? p * Math.log(p) : 0);
const ent = p => -p.reduce((a, v) => a + plogp(v), 0);

// exported for tests
export function scorePolicy(qy, C, amb, gamma = 1) {
  const risk = qy.reduce((a, q, k) => a + (q > 1e-12 ? q * (Math.log(q) - Math.log(C[k])) : 0), 0);
  const prag = qy.reduce((a, q, k) => a + q * Math.log(C[k]), 0);
  const info = ent(qy) - amb;
  return { risk, amb, G: risk + amb, prag, info, G2: -info - prag };
}

export function policyScorer(el, cfg) {
  const outs = cfg.outcomes ?? [], K = outs.length;
  const pols = (cfg.policies ?? []).slice(0, 4), N = pols.length;
  const C = norm((cfg.C ?? outs.map(() => 1 / K)).map(v => Math.max(EPS, v)));
  const states = cfg.states && cfg.likelihood ? cfg.states : null;
  const L = { risk: 'Risk', ambiguity: 'Ambiguity', g: 'Expected free energy G', pragmatic: 'Pragmatic value',
    epistemic: 'Information gain', prob: 'Policy probability', gamma: 'Precision', lowest: 'lowest G',
    reset: 'Reset', prefs: 'Preferences', needsStates: 'The second form needs the states.', ...(cfg.labels ?? {}) };
  const unit = cfg.unit ?? 'nats';
  const show = { risk: cfg.showRisk !== false, amb: cfg.showAmbiguity !== false, g: cfg.showG !== false,
    prag: cfg.showPragmatic !== false, epi: cfg.showEpistemic !== false, prob: cfg.showProb !== false,
    gamma: cfg.showGamma !== false, prefs: cfg.showPrefs !== false };
  const likOf = p => (p.likelihood ?? cfg.likelihood).map(r => norm(r.map(v => Math.max(0, v))));

  const init = () => ({
    gamma: cfg.gamma ?? 1,
    p: pols.map(p => states
      ? { qx: norm((p.qx ?? states.map(() => 1)).map(v => Math.max(0, v))) }
      : { qy: norm((p.qy ?? outs.map(() => 1)).map(v => Math.max(0, v))) }),
  });
  let st = init();

  // per-policy quantities from the current state
  function calc(i) {
    const p = pols[i];
    if (!states) return scorePolicy(st.p[i].qy, C, p.ambiguity ?? 0);
    const A = likOf(p), qx = st.p[i].qx;
    const qy = outs.map((_, k) => qx.reduce((a, x, j) => a + x * A[j][k], 0));
    const amb = qx.reduce((a, x, j) => a + x * ent(A[j]), 0);
    // information gain computed directly as E KL[Q(x|y) || Q(x)] (independent of H[qy] - amb)
    let info = 0;
    outs.forEach((_, k) => qx.forEach((x, j) => {
      const joint = x * A[j][k];
      if (joint > 1e-12) info += joint * Math.log(A[j][k] / qy[k]);
    }));
    const s = scorePolicy(qy, C, amb);
    return { ...s, qy, info, G2: -info - s.prag };
  }

  const cards = [], sliders = [], svals = [];
  const barRows = [];
  const mkBar = (label, color) => {
    const fill = h('span', { class: 'fe-fill', style: `background:${color}` });
    const val = h('span', { class: 'fe-val fe-bval' });
    const row = h('div', { class: 'fe-brow' },
      h('div', { class: 'fe-blabel' }, h('span', {}, M(label)), val), h('span', { class: 'fe-bar' }, fill));
    return { row, fill, val };
  };
  const hasSecond = !!states;
  pols.forEach((p, i) => {
    const b = {};
    const rows = [];
    const add = (key, on, label, color) => { if (on) { b[key] = mkBar(label, color); rows.push(b[key].row); } };
    add('risk', show.risk, L.risk, 'var(--vec)');
    add('amb', show.amb, L.ambiguity, 'var(--covec)');
    add('g', show.g, L.g, 'var(--basis)');
    if (hasSecond) {
      add('epi', show.epi, L.epistemic, 'var(--ok, #2e9e6b)');
      add('prag', show.prag, L.pragmatic, 'var(--vec)');
    }
    const badge = h('span', { class: 'ps-badge' }, L.lowest);
    const sl = [];
    const body = [];
    if (cfg.editable) {
      const n = states ? states.length : K;
      for (let j = 0; j < n; j++) {
        const inp = h('input', { type: 'range', min: 0, max: 1, step: 0.01, style: `accent-color:${COLORS[i]}`,
          'aria-label': `${p.name}: ${states ? states[j] : outs[j]}` });
        inp.addEventListener('input', () => setSlider(i, j, +inp.value));
        const v = h('span', { class: 'fe-val' });
        sl.push([inp, v]);
        body.push(h('div', { class: 'fe-qrow' }, h('span', { class: 'fe-name' }, M(states ? states[j] : outs[j])), inp, v));
      }
    }
    sliders.push(sl.map(s => s[0])); svals.push(sl.map(s => s[1]));
    const qline = h('div', { class: 'ps-qline' });
    const card = h('div', { class: 'fe-sec ps-card' },
      h('div', { class: 'fe-title', style: `color:${COLORS[i]}` }, M(p.name), badge), qline, ...body, ...rows);
    cards.push({ card, badge, b, qline });
  });

  function setSlider(i, j, v) {
    const key = states ? 'qx' : 'qy', a = st.p[i][key], n = a.length, rest = 1 - a[j];
    st.p[i][key] = a.map((x, m) => (m === j ? v : rest > 1e-9 ? x * (1 - v) / rest : (1 - v) / (n - 1)));
    draw();
  }

  const prefs = show.prefs ? h('div', { class: 'fe-obs' }, h('b', {}, M(L.prefs + ': ')),
    M(outs.map((o, k) => `${o} ${C[k].toFixed(2)}`).join(' · '))) : '';

  const probBars = [];
  const probBox = h('div', { class: 'fe-sec ps-prob' });
  const gammaVal = h('span', { class: 'fe-val' });
  const gammaInp = h('input', { type: 'range', min: 0, max: cfg.gammaMax ?? 8, step: 0.1, 'aria-label': L.gamma });
  gammaInp.addEventListener('input', () => { st.gamma = +gammaInp.value; draw(); });
  if (show.prob) {
    probBox.append(h('div', { class: 'fe-title' }, M(L.prob)));
    if (show.gamma) probBox.append(h('div', { class: 'fe-qrow' }, h('span', { class: 'fe-name' }, M(L.gamma)), gammaInp, gammaVal));
    pols.forEach((p, i) => {
      const bar = mkBar(p.name, COLORS[i]); probBars.push(bar); probBox.append(bar.row);
    });
  }

  const set = fn => () => { fn(); draw(); };
  const btns = h('div', { class: 'wbtns' },
    h('button', { class: 'btn ghost', type: 'button', onclick: set(() => { st = init(); }) }, L.reset),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: set(() => {
      if (pr.gamma != null) st.gamma = pr.gamma;
      (pr.policies ?? []).forEach((q, i) => {
        if (!st.p[i]) return;
        if (states && q.qx) st.p[i].qx = norm(q.qx.map(v => Math.max(0, v)));
        if (!states && q.qy) st.p[i].qy = norm(q.qy.map(v => Math.max(0, v)));
      });
    }) }, M(pr.label))));

  el.append(prefs, ...cards.map(c => c.card), probBox,
    !hasSecond && (show.epi || show.prag) ? h('div', { class: 'fe-model ps-note' }, M(L.needsStates)) : '', btns);

  function draw() {
    const R = pols.map((_, i) => calc(i));
    const f = x => `${x.toFixed(2)} ${unit}`;
    const top = Math.max(0.05, ...R.flatMap(r => [r.risk, r.amb, r.G, r.info, -r.prag])) * 1.04;
    const w = x => `${Math.max(0, Math.min(100, (x / top) * 100))}%`;
    const best = R.reduce((m, r, i) => (r.G < R[m].G - 1e-12 ? i : m), 0);
    const pr = (() => { const e = R.map(r => Math.exp(-st.gamma * (r.G - R[best].G))); return norm(e); })();
    pols.forEach((p, i) => {
      const r = R[i], { b, badge, card, qline } = cards[i];
      const cur = states ? st.p[i].qx : st.p[i].qy;
      sliders[i].forEach((s, j) => { s.value = cur[j]; svals[i][j].textContent = `${Math.round(cur[j] * 100)}%`; });
      qline.textContent = '';
      qline.append(M(`Q(y|π): ` + outs.map((o, k) => `${o} ${(states ? r.qy : st.p[i].qy)[k].toFixed(2)}`).join(' · ')));
      const set1 = (key, x, txt) => { if (b[key]) { b[key].fill.style.width = w(x); b[key].val.textContent = txt ?? f(x); } };
      set1('risk', r.risk); set1('amb', r.amb); set1('g', r.G);
      set1('epi', r.info);
      set1('prag', -r.prag, `${r.prag.toFixed(2).replace('-', '−')} ${unit}`);
      if (b.g && hasSecond && b.epi && b.prag) b.g.val.textContent = `${f(r.G)} = −${r.info.toFixed(2)} + ${(-r.prag).toFixed(2)}`;
      badge.style.display = i === best ? '' : 'none';
      card.classList.toggle('ps-best', i === best);
    });
    gammaInp.value = st.gamma; gammaVal.textContent = `γ = ${(+st.gamma).toFixed(1)}`;
    probBars.forEach((bar, i) => { bar.fill.style.width = `${pr[i] * 100}%`; bar.val.textContent = `${(pr[i] * 100).toFixed(1)}%`; });
    el.dataset.g = R.map(r => r.G.toFixed(4)).join(',');
    el.dataset.g2 = R.map(r => r.G2.toFixed(4)).join(',');
  }
  draw();
}
