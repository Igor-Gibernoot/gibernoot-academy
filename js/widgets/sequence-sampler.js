// sequence-sampler
//
// A seeded stream of observations from a hidden rule. Each observation is one
// of two outcomes: "usual" (A) or "other" (B). The reader presses "observe next"
// or "observe 10"; the rule stays hidden. The claim under test is "every
// observation is A": it stands until the first B appears.
//
//   rule: 'same' | 'change' | 'rate'   always A / A until step changeAt then B / B with probability p
//   changeAt: 30      (rule 'change') first step (1-based) that is B
//   p: 0.1            (rule 'rate') probability of B at each step
//   seed: 1           makes the stream repeatable
//   symbols: ['A','B']  the two outcomes (A, B)
//   claim: 'text'     the claim, shown next to the flag
//   labels: { next, ten, reset, tally, streak, standing, refuted, surprise, empty }
//   max: 200          stop after this many observations
//   show: { strip, tally, streak, flag, surprise }   each default true; every drawn element is hideable
//         strip = row of observations; tally = counts of A and B; streak = current run of A;
//         flag = the "claim still stands / refuted" line; surprise = the marker on the first B
//   presets: [{ label, rule, changeAt, p, seed }]   buttons that restart with another rule

import { h } from '../dom.js';
import { mdInline } from '../render.js';

function rng(seed) {
  let a = (seed | 0) + 0x6D2B79F5;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function sequenceSampler(el, cfg) {
  const L = { next: 'Observe next', ten: 'Observe 10', reset: 'Reset', tally: 'Tally', streak: 'Current run',
    standing: 'The claim still stands', refuted: 'The claim is refuted', surprise: 'Surprise!', empty: 'Nothing observed yet.',
    ...(cfg.labels ?? {}) };
  const S = { strip: true, tally: true, streak: true, flag: true, surprise: true, ...(cfg.show ?? {}) };
  const sym = cfg.symbols ?? ['A', 'B'];
  const max = cfg.max ?? 200;
  let rule, changeAt, p, obs, rand;
  const setRule = o => { rule = o.rule ?? cfg.rule ?? 'same'; changeAt = o.changeAt ?? cfg.changeAt ?? 30;
    p = o.p ?? cfg.p ?? 0.1; obs = []; rand = rng(o.seed ?? cfg.seed ?? 1); };
  setRule({});
  const step = () => {
    const i = obs.length + 1, r = rand();
    obs.push(rule === 'same' ? 0 : rule === 'change' ? (i >= changeAt ? 1 : 0) : (r < p ? 1 : 0));
  };
  const add = n => { for (let k = 0; k < n && obs.length < max; k++) step(); draw(); };

  const strip = S.strip ? h('div', { class: 'ss-strip', 'aria-live': 'polite' }) : null;
  const info = h('div', { class: 'ss-info' });
  const flag = S.flag ? h('div', { class: 'ss-flag' }) : null;
  const bNext = h('button', { class: 'btn', type: 'button', onclick: () => add(1) }, L.next);
  const bTen = h('button', { class: 'btn', type: 'button', onclick: () => add(10) }, L.ten);
  const btns = h('div', { class: 'wbtns' }, bNext, bTen,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { setRule({}); draw(); } }, L.reset),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => { setRule(pr); draw(); } }, pr.label)));
  el.append(...[strip, info, flag, btns].filter(Boolean));

  function draw() {
    const n = obs.length, nb = obs.reduce((a, b) => a + b, 0), na = n - nb;
    const first = obs.indexOf(1);
    let run = 0; for (let i = n - 1; i >= 0 && obs[i] === 0; i--) run++;
    if (strip) {
      strip.replaceChildren();
      if (!n) strip.append(h('span', { class: 'ss-empty' }, L.empty));
      obs.forEach((o, i) => {
        const c = h('span', { class: 'ss-cell' + (o ? ' ss-b' : ''), title: `${i + 1}` }, sym[o]);
        if (S.surprise && i === first) { c.classList.add('ss-first'); c.append(h('span', { class: 'ss-surp' }, mdInline(L.surprise))); }
        strip.append(c);
      });
      strip.scrollTop = strip.scrollHeight;
    }
    const rows = [];
    if (S.tally) rows.push(h('div', {}, h('b', {}, mdInline(L.tally) + ': '), `${sym[0]} ${na} · ${sym[1]} ${nb} · n = ${n}`));
    if (S.streak) rows.push(h('div', {}, h('b', {}, mdInline(L.streak) + ': '), `${run}`));
    info.replaceChildren(...rows);
    if (flag) {
      const dead = nb > 0;
      flag.className = 'ss-flag ' + (dead ? 'dead' : 'live');
      flag.replaceChildren(h('b', {}, (dead ? '✗ ' : '✓ ') + (dead ? L.refuted : L.standing)),
        cfg.claim ? h('span', {}, ' ', mdInline(cfg.claim)) : '');
    }
    const full = n >= max; bNext.disabled = full; bTen.disabled = full;
  }
  draw();
}
