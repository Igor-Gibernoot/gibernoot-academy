// free-energy-bound
//
// A hidden cause x with K values (2-4), one observation y. The prior P(x), the
// likelihood P(y|x) of the observed y and the start of Q are fixed by the
// config. Sliders set the approximate posterior Q(x) (kept normalised: moving
// one slider rescales the others). Bars show, in nats,
//   F        = sum_x Q(x) [ln Q(x) - ln P(x) - ln P(y|x)]   (variational free energy)
//   surprise = -ln P(y),  P(y) = sum_x P(x) P(y|x)
//   gap      = F - surprise = D_KL[Q(x) || P(x|y)] >= 0
// A tick on the F bar marks the surprise (F never falls below it).
// All wording and numbers come from the config.
//
//   causes: [{ name, prior, likelihood }]   2-4 causes; prior is normalised, likelihood in (0,1]
//   q: [..]                                 start Q (default uniform), normalised
//   observation: 'text'                     line naming the observed y (markdown inline)
//   showModel: false                        hide "prior / likelihood" under each slider
//   showF / showSurprise / showGap: false   hide that bar (and the tick on F)
//   showQ: false                            hide the Q sliders (bars only; presets still set Q)
//   exact: false                            hide the "Set Q = exact posterior" button
//   unit: 'nats'
//   labels: { observation, q, f, surprise, gap, exact, reset, prior, likelihood }
//   presets: [{ label, q: [..], prior: [..], likelihood: [..] }]  any field may be omitted
//                                           (q: 'exact' sets the exact posterior)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const M = src => h('span', { html: mdInline(String(src)) });

const COLORS = ['var(--vec)', 'var(--covec)', 'var(--basis)', 'var(--ok, #2e9e6b)'];
const EPS = 1e-3;
const norm = a => { const s = a.reduce((x, y) => x + y, 0); return a.map(v => v / s); };
const xlogx = q => (q > 1e-12 ? q * Math.log(q) : 0);

export function freeEnergyBound(el, cfg) {
  const causes = (cfg.causes ?? []).slice(0, 4), K = causes.length;
  const L = { observation: 'Observed', q: 'Your belief Q(x)', f: 'Free energy F', surprise: 'Surprise -ln P(y)',
    gap: 'Gap F - surprise', exact: 'Set Q = exact posterior', reset: 'Reset', prior: 'prior', likelihood: 'likelihood', ...(cfg.labels ?? {}) };
  const unit = cfg.unit ?? 'nats';
  const show = { f: cfg.showF !== false, s: cfg.showSurprise !== false, g: cfg.showGap !== false, q: cfg.showQ !== false, m: cfg.showModel !== false };
  const clampL = v => Math.max(EPS, Math.min(1, v));
  const init = () => ({
    prior: norm(causes.map(c => Math.max(EPS, c.prior ?? 1 / K))),
    lik: causes.map(c => clampL(c.likelihood ?? 0.5)),
    q: norm((cfg.q ?? causes.map(() => 1 / K)).map(v => Math.max(0, v))),
  });
  let st = init();
  const joint = () => st.prior.map((p, i) => p * st.lik[i]);
  const evidence = () => joint().reduce((a, b) => a + b, 0);
  const exact = () => norm(joint());
  // bar scale: the largest F reachable (Q piled on the worst cause) at the current model
  const worstF = () => Math.max(...joint().map(j => -Math.log(j)));

  const sliders = [], qvals = [], mods = [];
  const qBox = h('div', { class: 'fe-sec' }, h('div', { class: 'fe-title' }, M(L.q)));
  causes.forEach((c, i) => {
    const inp = h('input', { type: 'range', min: 0, max: 1, step: 0.01, 'aria-label': `${L.q}: ${c.name}`, style: `accent-color:${COLORS[i]}` });
    inp.addEventListener('input', () => setQ(i, +inp.value));
    const v = h('span', { class: 'fe-val' }), m = h('span', { class: 'fe-model' });
    sliders.push(inp); qvals.push(v); mods.push(m);
    qBox.append(h('div', { class: 'fe-qrow' },
      h('span', { class: 'fe-name', style: `color:${COLORS[i]}` }, M(c.name)), inp, v), show.m ? m : '');
  });
  function setQ(i, v) {
    const old = st.q[i], rest = 1 - old;
    st.q = st.q.map((x, j) => (j === i ? v : rest > 1e-9 ? x * (1 - v) / rest : (1 - v) / (K - 1)));
    draw();
  }

  const bars = {};
  const barRow = (key, label, color) => {
    const fill = h('span', { class: 'fe-fill', style: `background:${color}` });
    const tick = h('span', { class: 'fe-tick' });
    const val = h('span', { class: 'fe-val fe-bval' });
    bars[key] = { fill, val, tick };
    const row = h('div', { class: 'fe-brow' },
      h('div', { class: 'fe-blabel' }, h('span', {}, M(label)), val),
      h('span', { class: 'fe-bar' }, fill, key === 'f' ? tick : ''));
    return row;
  };
  const outBox = h('div', { class: 'fe-sec' },
    show.f ? barRow('f', L.f, 'var(--vec)') : '',
    show.s ? barRow('s', L.surprise, 'var(--covec)') : '',
    show.g ? barRow('g', L.gap, 'var(--basis)') : '');

  const set = fn => () => { fn(); draw(); };
  const btns = h('div', { class: 'wbtns' },
    cfg.exact === false ? '' : h('button', { class: 'btn ghost', type: 'button', onclick: set(() => { st.q = exact(); }) }, M(L.exact)),
    h('button', { class: 'btn ghost', type: 'button', onclick: set(() => { st = init(); }) }, L.reset),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: set(() => {
      if (pr.prior) st.prior = norm(pr.prior.slice(0, K).map(v => Math.max(EPS, v)));
      if (pr.likelihood) st.lik = pr.likelihood.slice(0, K).map(clampL);
      if (pr.q === 'exact') st.q = exact();
      else if (pr.q) st.q = norm(pr.q.slice(0, K).map(v => Math.max(0, v)));
    }) }, M(pr.label))));

  el.append(
    cfg.observation ? h('div', { class: 'fe-obs' }, h('b', {}, M(L.observation + ': ')), M(cfg.observation)) : '',
    show.q ? qBox : '', outBox, btns);

  function draw() {
    const j = joint(), pe = evidence(), surprise = -Math.log(pe);
    const F = st.q.reduce((a, q, i) => a + xlogx(q) - q * Math.log(j[i]), 0);
    const gap = Math.max(0, F - surprise), top = worstF() * 1.04;
    const fmt = x => `${x.toFixed(2)} ${unit}`;
    const w = x => `${Math.max(0, Math.min(100, (x / top) * 100))}%`;
    causes.forEach((c, i) => {
      sliders[i].value = st.q[i];
      qvals[i].textContent = `${Math.round(st.q[i] * 100)}%`;
      mods[i].textContent = `${L.prior} ${st.prior[i].toFixed(2)} · ${L.likelihood} ${st.lik[i].toFixed(2)}`;
    });
    if (bars.f) { bars.f.fill.style.width = w(F); bars.f.val.textContent = fmt(F);
      bars.f.tick.style.display = show.s ? '' : 'none'; bars.f.tick.style.left = w(surprise); }
    if (bars.s) { bars.s.fill.style.width = w(surprise); bars.s.val.textContent = fmt(surprise); }
    if (bars.g) { bars.g.fill.style.width = w(gap); bars.g.val.textContent = fmt(gap); }
  }
  draw();
}
