// deep-levels
//
// Two-level discrete hierarchy (slow level 2 = "sentence", fast level 1 = "word" steps).
// One higher-level state k (a sentence) persists over T word steps; at step t it predicts the
// word w_t(k). Those predictions are the empirical prior D of the lower-level POMDP:
//   D_t(w | evidence before t) = sum_k Q(k | words before t) [w_t(k) = w]      (step 1: Q = prior)
// The evidence passes up: Q(k | words) ∝ P(k) prod_t P(word_t | k), with
//   P(word | k, t) = 1 - noise if word = w_t(k), else noise / (nWords - 1).
//
// Config (all text from the config; names are markdown inline, may contain $..$):
//   words: [names]                      the lower-level words (states of level 1)
//   sentences: [{ words: [names] }]     the higher-level states, one word per step (equal lengths)
//   prior: [numbers]                    prior over sentences (normalised; default uniform)
//   noise: 0                            probability mass spread over the wrong words (0 = hard evidence)
//   fastSteps: 3                        lower-level time steps drawn inside each word step
//   evidence: [word | null, ...]        initial evidence per step (default none)
//   presets: [{ label, evidence: [...] }]   buttons that set the evidence
//   labels: { slow, fast, step, sentences, prior, posterior, predicted, none, reset, next,
//             inconsistent, d1, done }   ('slow'/'fast' are bare KaTeX, e.g. \tau^{(2)})
import { h } from '../dom.js';
import { mdInline, tex } from '../render.js';

const M = src => h('span', { html: mdInline(String(src)) });
const T = src => h('span', { html: tex(String(src)) });
const COLORS = ['var(--vec)', 'var(--covec)', 'var(--basis)', 'var(--ok, #2e9e6b)'];
const f2 = x => x.toFixed(2);

export function deepLevels(el, cfg) {
  const words = cfg.words ?? [], K = words.length;
  const sents = (cfg.sentences ?? []).map(s => s.words);
  const S = sents.length, Tn = sents[0]?.length ?? 0;
  const wi = sents.map(s => s.map(w => words.indexOf(w)));
  const p0 = (cfg.prior ?? sents.map(() => 1)).slice();
  const ps = p0.reduce((x, y) => x + y, 0);
  const prior = p0.map(x => x / ps);
  const noise = cfg.noise ?? 0, fast = cfg.fastSteps ?? 3;
  const L = { slow: '\\tau^{(2)}', fast: '\\tau^{(1)}', step: 'Word', sentences: 'Sentences (higher level)',
    prior: 'prior', posterior: 'posterior', predicted: 'Predicted word (lower-level prior D)', none: 'not read',
    reset: 'Reset', next: 'next', inconsistent: 'No sentence fits these words.', d1: 'D', done: 'all words read',
    ...(cfg.labels ?? {}) };
  let ev = Array.from({ length: Tn }, (_, t) => {
    const w = cfg.evidence?.[t]; const i = w == null ? -1 : words.indexOf(w); return i;
  });

  // ---- maths
  const lik = (w, k, t) => (wi[k][t] === w ? 1 - noise : (K > 1 ? noise / (K - 1) : 0));
  function posterior(upTo) {
    let q = prior.slice();
    for (let t = 0; t < upTo; t++) if (ev[t] >= 0) q = q.map((x, k) => x * lik(ev[t], k, t));
    const z = q.reduce((a, b) => a + b, 0);
    return z > 1e-12 ? q.map(x => x / z) : null;
  }
  // predicted word distribution at step t given evidence at steps < t
  function predict(t) {
    const q = posterior(t) ?? prior;
    const d = words.map(() => 0);
    q.forEach((qk, k) => { for (let w = 0; w < K; w++) d[w] += qk * lik(w, k, t); });
    return d;
  }
  const nextStep = () => { let last = -1; ev.forEach((e, t) => { if (e >= 0) last = t; }); return last + 1; };

  // ---- DOM
  const strip = [], sentRows = [];
  const cards = Array.from({ length: Tn }, (_, t) => {
    const bars = words.map((w, i) => {
      const fill = h('span', { class: 'fe-fill', style: `background:${COLORS[i % 4]}` });
      const val = h('span', { class: 'fe-val fe-bval' });
      return { fill, val, row: h('div', { class: 'dl-brow' }, h('span', { class: 'dl-w' }, M(w)), h('span', { class: 'fe-bar' }, fill), val) };
    });
    const btns = words.map((w, i) => h('button', { class: 'btn ghost dl-btn', type: 'button',
      onclick: () => { ev[t] = ev[t] === i ? -1 : i; draw(); } }, M(w)));
    const ticks = h('div', { class: 'dl-ticks' }, T(L.fast + '='),
      ...Array.from({ length: fast }, (_, j) => h('span', { class: 'dl-tick' }, String(j + 1))));
    const title = h('div', { class: 'fe-title' }, T(`${L.slow}=${t + 1}`), ' ', h('span', { class: 'dl-next ps-badge' }, M(L.next)));
    const read = h('div', { class: 'dl-read' });
    const card = h('div', { class: 'fe-sec ps-card dl-card' }, title, ticks, read,
      h('div', { class: 'wbtns' }, ...btns), ...bars.map(b => b.row));
    strip[t] = { card, bars, btns, read, nextBadge: title.querySelector('.dl-next') };
    return card;
  });
  const sentBars = sents.map((s, k) => {
    const pf = h('span', { class: 'dl-pfill' });
    const fill = h('span', { class: 'fe-fill', style: 'background:var(--accent)' });
    const val = h('span', { class: 'fe-val fe-bval' });
    const chips = s.map((w, t) => h('span', { class: 'dl-chip' }, M(w)));
    const row = h('div', { class: 'dl-srow' }, h('div', { class: 'dl-words' }, ...chips),
      h('div', { class: 'dl-sbar' }, h('span', { class: 'fe-bar' }, pf, fill), val));
    sentRows[k] = { fill, pf, val, chips, row };
    return row;
  });
  const msg = h('div', { class: 'fe-obs dl-msg' });
  const sentBox = h('div', { class: 'fe-sec ps-prob' },
    h('div', { class: 'fe-title' }, M(L.sentences), ' · ', T('P(k)'), ' ', M(L.prior), ' / ', T('Q(k)'), ' ', M(L.posterior)), ...sentBars, msg);
  const presetBtns = (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button',
    onclick: () => { ev = Array.from({ length: Tn }, (_, t) => (pr.evidence?.[t] == null ? -1 : words.indexOf(pr.evidence[t]))); draw(); } }, M(pr.label)));
  const resetBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { ev = ev.map(() => -1); draw(); } }, L.reset);
  el.append(h('div', { class: 'dl-cards' }, ...cards), sentBox, h('div', { class: 'wbtns' }, resetBtn, ...presetBtns));

  function draw() {
    const nx = nextStep();
    const q = posterior(Tn);
    for (let t = 0; t < Tn; t++) {
      const d = predict(t), c = strip[t];
      c.bars.forEach((b, i) => { b.fill.style.width = `${d[i] * 100}%`; b.val.textContent = f2(d[i]); });
      c.btns.forEach((b, i) => b.classList.toggle('on', ev[t] === i));
      c.read.textContent = ev[t] >= 0 ? '' : '';
      c.read.innerHTML = ev[t] >= 0 ? mdInline(words[ev[t]]) : `<span class="dl-none">${L.none}</span>`;
      c.nextBadge.style.display = t === nx ? '' : 'none';
      c.card.classList.toggle('dl-on', ev[t] >= 0);
    }
    sentRows.forEach((r, k) => {
      const v = q ? q[k] : prior[k];
      r.fill.style.width = `${v * 100}%`; r.pf.style.width = `${prior[k] * 100}%`;
      r.val.textContent = `${f2(prior[k])} → ${f2(v)}`;
      r.chips.forEach((c, t) => c.classList.toggle('dl-hit', ev[t] >= 0 && wi[k][t] === ev[t]));
      r.row.classList.toggle('dl-dead', !!q && q[k] < 1e-9);
    });
    msg.textContent = q ? '' : L.inconsistent;
    el.dataset.prior = prior.map(x => x.toFixed(4)).join(',');
    el.dataset.post = (q ?? prior).map(x => x.toFixed(4)).join(',');
    el.dataset.d = predict(0).map(x => x.toFixed(4)).join(',');
    el.dataset.next = nx < Tn ? predict(nx).map(x => x.toFixed(4)).join(',') : 'done';
  }
  draw();
}
