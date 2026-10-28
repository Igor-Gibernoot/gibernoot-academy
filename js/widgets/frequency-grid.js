// frequency-grid
//
// Bayes by natural frequencies. A grid of N dots, each one case. Sliders set the
// base rate P(H), the sensitivity P(E|H) and the false-positive rate P(E|not H).
// Dots are coloured TP (H and E), FN (H, no E), FP (not H, E), TN (not H, no E).
// Counts are ROUNDED to whole dots, in this order (Math.round, halves up):
//   nH = round(N * prior);  TP = round(nH * sens);  FN = nH - TP;
//   FP = round((N - nH) * fpr);  TN = (N - nH) - FP.
// The posterior is computed from these rounded counts: P(H|E) = TP / (TP + FP)
// (shown as a dash when TP + FP = 0).
//
//   N: 1000                    number of dots
//   cols: auto                 dots per row (default about sqrt(1.6 N), 40 for 1000)
//   prior, sens, fpr           start values in [0, 1]
//   sliders: { prior|sens|fpr: { value, min, max, step, fixed, hidden } }
//        fixed: true  = value locked (slider disabled, still shown); hidden: true = no slider row
//        (value then comes from sliders.<key>.value or the config key)
//   labels: { prior, sens, fpr, tp, fn, fp, tn, posterior, reset, formula, none }
//        wording only; prior/sens/fpr name the sliders, tp..tn the four groups, posterior the readout
//   show: { grid, counts, posterior, bar, formula }   defaults true, true, true, false, false
//        grid = the dots; counts = the four counts with colour keys; posterior = the P(H|E) readout;
//        bar = bar of TP over TP+FP; formula = line "TP / (TP + FP) = a / b = x%" with the live numbers
//   reset: true                show a Reset button (default true)
//   presets: [{ label, prior, sens, fpr }]   buttons that set the values (fixed ones stay)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const KEYS = ['prior', 'sens', 'fpr'];
const pct = v => `${+(v * 100).toFixed(2)}%`;

export function frequencyGrid(el, cfg) {
  const L = { prior: 'Base rate', sens: 'Sensitivity', fpr: 'False-positive rate', tp: 'True positive', fn: 'False negative',
    fp: 'False positive', tn: 'True negative', posterior: 'Posterior', reset: 'Reset', none: '—',
    formula: 'Positives that are true', ...(cfg.labels ?? {}) };
  const S = { grid: true, counts: true, posterior: true, bar: false, formula: false, ...(cfg.show ?? {}) };
  const N = Math.max(1, Math.round(cfg.N ?? 1000));
  const cols = cfg.cols ?? Math.max(1, Math.round(Math.sqrt(N * 1.6)));
  const SL = cfg.sliders ?? {};
  const dflt = { prior: 0.01, sens: 0.9, fpr: 0.1 };
  const clamp = v => Math.max(0, Math.min(1, v));
  const base = k => clamp(SL[k]?.value ?? cfg[k] ?? dflt[k]);
  let st = Object.fromEntries(KEYS.map(k => [k, base(k)]));

  const vals = {}, inputs = {};
  const sliderBox = h('div', { class: 'fg-sec' });
  KEYS.forEach(k => {
    const o = SL[k] ?? {};
    if (o.hidden) return;
    const inp = h('input', { type: 'range', min: o.min ?? 0, max: o.max ?? 1, step: o.step ?? 0.01, 'aria-label': L[k] });
    if (o.fixed) inp.disabled = true;
    inp.addEventListener('input', () => { st[k] = clamp(+inp.value); draw(); });
    const v = h('span', { class: 'fg-val' });
    inputs[k] = inp; vals[k] = v;
    sliderBox.append(h('label', { class: 'fg-row' + (o.fixed ? ' fixed' : '') }, h('span', { class: 'fg-name' }, mdInline(L[k])), inp, v));
  });

  const dots = S.grid ? h('div', { class: 'fg-grid', style: `grid-template-columns:repeat(${cols},1fr)`, role: 'img' }) : null;
  const cells = [];
  if (dots) for (let i = 0; i < N; i++) { const c = h('span', { class: 'fg-dot tn' }); cells.push(c); dots.append(c); }
  const GROUPS = ['tp', 'fn', 'fp', 'tn'];
  const cnt = {};
  const counts = S.counts ? h('div', { class: 'fg-counts' }, GROUPS.map(g => {
    const n = h('b', {}); cnt[g] = n;
    return h('span', { class: 'fg-key' }, h('i', { class: 'fg-sw ' + g }), mdInline(L[g]) + ': ', n);
  })) : null;
  const post = S.posterior ? h('div', { class: 'fg-post' }) : null;
  const fill = h('span', { class: 'fg-fill' });
  const bar = S.bar ? h('div', { class: 'fg-bar', role: 'img' }, fill) : null;
  const formula = S.formula ? h('div', { class: 'fg-formula' }) : null;
  const useReset = cfg.reset ?? true, presets = cfg.presets ?? [];
  const btns = useReset || presets.length ? h('div', { class: 'wbtns' },
    useReset ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { KEYS.forEach(k => { st[k] = base(k); }); draw(); } }, L.reset) : '',
    presets.map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      KEYS.forEach(k => { if (pr[k] != null && !SL[k]?.fixed) st[k] = clamp(pr[k]); }); draw(); } }, pr.label))) : null;
  el.append(...[dots, counts, post, bar, formula, Object.keys(inputs).length ? sliderBox : null, btns].filter(Boolean));

  function draw() {
    KEYS.forEach(k => { if (SL[k]?.fixed) st[k] = base(k); });
    const nH = Math.round(N * st.prior), TP = Math.round(nH * st.sens), FN = nH - TP;
    const FP = Math.round((N - nH) * st.fpr), TN = N - nH - FP;
    const c = { tp: TP, fn: FN, fp: FP, tn: TN };
    KEYS.forEach(k => { if (inputs[k]) { inputs[k].value = st[k]; vals[k].textContent = pct(st[k]); } });
    if (dots) {
      let i = 0;
      for (const g of GROUPS) for (let j = 0; j < c[g]; j++) cells[i++].className = 'fg-dot ' + g;
      dots.setAttribute('aria-label', GROUPS.map(g => `${L[g]} ${c[g]}`).join(', '));
    }
    if (counts) GROUPS.forEach(g => { cnt[g].textContent = c[g]; });
    const pos = TP + FP, p = pos ? TP / pos : null, ptxt = p == null ? L.none : pct(p);
    if (post) post.replaceChildren(h('b', {}, mdInline(L.posterior) + ': '), ptxt);
    if (bar) { fill.style.width = (p == null ? 0 : p * 100) + '%'; bar.setAttribute('aria-label', `${L.posterior} ${ptxt}`); }
    if (formula) formula.replaceChildren(mdInline(L.formula) + ': ', h('b', {}, `${TP} / (${TP} + ${FP}) = ${TP} / ${pos} = ${ptxt}`));
  }
  draw();
}
