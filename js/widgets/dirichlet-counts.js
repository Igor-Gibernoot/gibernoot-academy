// dirichlet-counts
//
// Columns j of a likelihood matrix A kept as Dirichlet counts a_ij (rows = outcomes i), the
// expected likelihood, and the novelty of each cell (parameter information gain, Eq. B.31-B.34):
//   E[A_ij] = a_ij / a_0j,                a_0j = sum_i a_ij
//   W_ij    = D_KL[ Dir(a_.j + e_i) || Dir(a_.j) ]
//           = ln(a_0j / a_ij) + psi(a_ij + 1) - psi(a_0j + 1)           (exact)
//           ~ 1/(2 a_ij) - 1/(2 a_0j)                                     (from psi(x) ~ ln x - 1/(2x))
//   observing outcome o with belief s:  a <- a + o (x) s   (column j gains o s_j)
//   expected novelty of an option with belief s and predicted outcomes o = E[A] s:
//                           o . W s = sum_j s_j sum_i o_i W_ij
//
// Config (all text from the config; names are markdown inline, may contain $..$):
//   outcomes: [names]                 rows i
//   columns: [{ name, a: [counts per outcome], truth: [probabilities per outcome] }]
//        truth is only needed for sampling buttons (a seeded, deterministic stream)
//   editable: true                    a +1 and a -1 button in every cell
//   observe: true                     buttons "observe outcome i" with the belief s chosen below
//   beliefs: [{ label, s: [per column] }]   belief choices for the observe step
//                                     (default: one-hot per column, labelled by the column name)
//   sample: true                      per column a button that draws an outcome from truth and
//                                     adds it with a one-hot belief on that column
//   options: [{ name, s: [per column], o?: [per outcome] }]   "where to look": expected novelty
//                                     (o defaults to E[A] s)
//   visitNext: true                   button: pick the option with the largest expected novelty
//                                     (ties: first), sample its outcome from truth of the
//                                     column of largest s, add it with belief s; no preferences
//   showExpected / showNovelty / showApprox / showOptions: false   hide pieces
//   seed: 7, minCount: 0.05           rng seed; counts never go below minCount
//   labels: { counts, expected, novelty, approx, observe, belief, sample, visit, options,
//             reset, update, last }    ('sample' may use {name}; 'observe' may use {o})
//   presets: [{ label, columns: [{a}] }]     reset the counts

import { h } from '../dom.js';
import { mdInline, tex } from '../render.js';

const M = src => h('span', { html: mdInline(String(src)) });
const T = src => h('span', { html: tex(String(src)) });
const COLORS = ['var(--vec)', 'var(--covec)', 'var(--basis)', 'var(--ok, #2e9e6b)'];
const f2 = x => x.toFixed(2);
const fa = x => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(2));

// digamma: recurrence up to x >= 8, then the asymptotic series
export function psi(x) {
  let r = 0;
  while (x < 8) { r -= 1 / x; x += 1; }
  const i2 = 1 / (x * x);
  return r + Math.log(x) - 0.5 / x - i2 * (1 / 12 - i2 * (1 / 120 - i2 * (1 / 252 - i2 / 240)));
}
// novelty of one more observation of outcome i in a column of counts a (nats)
export function noveltyExact(a, i) {
  const a0 = a.reduce((x, y) => x + y, 0);
  return Math.log(a0 / a[i]) + psi(a[i] + 1) - psi(a0 + 1);
}
export function noveltyApprox(a, i) {
  const a0 = a.reduce((x, y) => x + y, 0);
  return 1 / (2 * a[i]) - 1 / (2 * a0);
}
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const draw1 = (p, u) => { let c = 0; for (let i = 0; i < p.length; i++) { c += p[i]; if (u < c) return i; } return p.length - 1; };

export function dirichletCounts(el, cfg) {
  const outs = cfg.outcomes ?? ['1', '2'], K = outs.length;
  const cols0 = cfg.columns ?? [{ name: 'A', a: outs.map(() => 1) }], N = cols0.length;
  const minC = cfg.minCount ?? 0.05;
  const L = { counts: 'Counts', expected: 'Expected likelihood', novelty: 'Novelty', approx: 'approx.',
    observe: 'Observe {o}', belief: 'Belief over states', sample: 'Sample from {name}', visit: 'Visit next by novelty',
    options: 'Where to look: expected novelty', reset: 'Reset', update: 'a \\leftarrow a + o \\otimes s',
    last: 'Last', ...(cfg.labels ?? {}) };
  const show = { exp: cfg.showExpected !== false, nov: cfg.showNovelty !== false, apx: cfg.showApprox !== false,
    opt: cfg.showOptions !== false };
  const beliefs = cfg.beliefs ?? (N > 1 ? cols0.map((c, j) => ({ label: c.name, s: cols0.map((_, m) => (m === j ? 1 : 0)) })) : [{ label: cols0[0].name, s: [1] }]);
  const options = cfg.options ?? [];

  let a, bsel, rand, lastMsg;
  const init = (pc) => {
    a = cols0.map((c, j) => (pc?.[j]?.a ?? c.a).map(v => Math.max(minC, v)));
    bsel = 0; rand = rng(cfg.seed ?? 7); lastMsg = '';
  };
  init();

  const colSum = j => a[j].reduce((x, y) => x + y, 0);
  const expA = (i, j) => a[j][i] / colSum(j);
  const norm = v => { const s = v.reduce((x, y) => x + y, 0) || 1; return v.map(x => x / s); };
  function optionValue(op) {
    const s = norm(op.s);
    const o = op.o ? norm(op.o) : outs.map((_, i) => s.reduce((t, sj, j) => t + sj * expA(i, j), 0));
    let ex = 0, ap = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < K; i++) {
      ex += s[j] * o[i] * noveltyExact(a[j], i);
      ap += s[j] * o[i] * noveltyApprox(a[j], i);
    }
    return { ex, ap, o };
  }
  const add = (i, s) => { for (let j = 0; j < N; j++) a[j][i] += s[j]; };

  // ---- DOM
  const cells = [];   // cells[j][i] = { count, bar, bval, wtxt }
  const colCards = cols0.map((c, j) => {
    const rows = outs.map((o, i) => {
      const count = h('span', { class: 'dc-count' });
      const btns = [];
      if (cfg.editable) {
        btns.push(h('button', { class: 'btn ghost dc-btn', type: 'button', 'aria-label': `${c.name} ${o} +1`,
          onclick: () => { a[j][i] += 1; lastMsg = ''; draw(); } }, '+1'));
        btns.push(h('button', { class: 'btn ghost dc-btn', type: 'button', 'aria-label': `${c.name} ${o} -1`,
          onclick: () => { a[j][i] = Math.max(minC, a[j][i] - 1); lastMsg = ''; draw(); } }, '−1'));
      }
      const fill = h('span', { class: 'fe-fill', style: `background:${COLORS[j % 4]}` });
      const bval = h('span', { class: 'fe-val fe-bval' });
      const wtxt = h('span', { class: 'dc-w' });
      (cells[j] ??= [])[i] = { count, fill, bval, wtxt };
      return h('div', { class: 'dc-row' },
        h('div', { class: 'dc-head' }, h('span', { class: 'fe-name' }, M(o)), T(`a_{${i + 1}${N > 1 ? j + 1 : ''}}=`), count, ...btns),
        show.exp ? h('div', { class: 'dc-brow' }, h('span', { class: 'fe-bar' }, fill), bval) : '',
        show.nov ? wtxt : '');
    });
    const total = h('span', { class: 'dc-tot' });
    cells[j].total = total;
    return h('div', { class: 'fe-sec ps-card dc-col' },
      h('div', { class: 'fe-title', style: `color:${COLORS[j % 4]}` }, M(c.name), ' ', total), ...rows);
  });
  const colsWrap = h('div', { class: 'dc-cols' }, ...colCards);
  const legend = h('div', { class: 'fe-model dc-legend' },
    h('b', {}, M(L.counts)), ' · ',
    show.exp ? [T('\\mathbb{E}[A_{ij}]=a_{ij}/a_{0j}'), ' (', M(L.expected), ')'] : '',
    show.nov ? [' · ', T('W_{ij}'), ' (', M(L.novelty), ')'] : '');

  const ctrl = [];
  const lastLine = h('div', { class: 'fe-obs dc-last' });
  let beliefBtns = [];
  if (cfg.observe) {
    if (beliefs.length > 1) {
      beliefBtns = beliefs.map((b, k) => h('button', { class: 'btn ghost', type: 'button',
        onclick: () => { bsel = k; draw(); } }, M(b.label)));
      ctrl.push(h('div', { class: 'fe-obs' }, h('b', {}, M(L.belief + ': ')), T('s')), h('div', { class: 'wbtns' }, ...beliefBtns));
    }
    ctrl.push(h('div', { class: 'fe-obs' }, T(L.update)),
      h('div', { class: 'wbtns' }, outs.map((o, i) => h('button', { class: 'btn', type: 'button', onclick: () => {
        const s = beliefs[bsel].s; add(i, s);
        lastMsg = `${L.last}: ${o}`; draw();
      } }, M(L.observe.replace('{o}', o))))));
  }
  if (cfg.sample) {
    ctrl.push(h('div', { class: 'wbtns' }, cols0.map((c, j) => h('button', { class: 'btn', type: 'button', onclick: () => {
      const i = draw1(norm(c.truth ?? outs.map(() => 1)), rand());
      add(i, cols0.map((_, m) => (m === j ? 1 : 0)));
      lastMsg = `${L.last}: ${c.name} → ${outs[i]}`; draw();
    } }, M(L.sample.replace('{name}', c.name))))));
  }

  const optRows = options.map((op, k) => {
    const fill = h('span', { class: 'fe-fill', style: `background:${COLORS[k % 4]}` });
    const val = h('span', { class: 'fe-val fe-bval' });
    const badge = h('span', { class: 'ps-badge' }, '★');
    const card = h('div', { class: 'fe-brow dc-opt' },
      h('div', { class: 'fe-blabel' }, h('span', {}, M(op.name), ' ', badge), val), h('span', { class: 'fe-bar' }, fill));
    return { fill, val, badge, card };
  });
  const optBox = show.opt && options.length
    ? h('div', { class: 'fe-sec ps-prob' }, h('div', { class: 'fe-title' }, M(L.options)), ...optRows.map(r => r.card)) : '';
  if (cfg.visitNext && options.length) {
    ctrl.push(h('div', { class: 'wbtns' }, h('button', { class: 'btn', type: 'button', onclick: () => {
      const V = options.map(optionValue);
      let best = 0; V.forEach((v, k) => { if (v.ex > V[best].ex + 1e-12) best = k; });
      const s = norm(options[best].s);
      const j = s.indexOf(Math.max(...s));
      const i = draw1(norm(cols0[j].truth ?? outs.map(() => 1)), rand());
      add(i, s);
      lastMsg = `${L.last}: ${options[best].name} → ${outs[i]}`; draw();
    } }, M(L.visit))));
  }
  const presetBtns = (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button',
    onclick: () => { init(pr.columns); draw(); } }, M(pr.label)));
  const resetBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { init(); draw(); } }, L.reset);

  el.append(legend, colsWrap, optBox, ...ctrl, lastLine, h('div', { class: 'wbtns' }, resetBtn, ...presetBtns));

  function draw() {
    const topN = Math.max(1e-9, ...a.flatMap((col, j) => col.map((_, i) => noveltyExact(col, i))));
    a.forEach((col, j) => {
      const a0 = colSum(j);
      cells[j].total.textContent = '';
      cells[j].total.append(T(`a_{0${N > 1 ? j + 1 : ''}}=${fa(a0)}`));
      col.forEach((v, i) => {
        const c = cells[j][i], e = v / a0;
        c.count.textContent = fa(v);
        c.fill.style.width = `${e * 100}%`;
        c.bval.textContent = f2(e);
        const ex = noveltyExact(col, i), ap = noveltyApprox(col, i);
        c.wtxt.textContent = '';
        c.wtxt.append(T(`W=${ex.toFixed(3)}` + (show.apx ? `\\quad(\\approx ${ap.toFixed(3)})` : '')));
      });
    });
    beliefBtns.forEach((b, k) => b.classList.toggle('on', k === bsel));
    const V = options.map(optionValue);
    const top = Math.max(1e-9, ...V.map(v => v.ex)) * 1.04;
    let best = 0; V.forEach((v, k) => { if (v.ex > V[best].ex + 1e-12) best = k; });
    optRows.forEach((r, k) => {
      r.fill.style.width = `${(V[k].ex / top) * 100}%`;
      r.val.textContent = `${V[k].ex.toFixed(3)}` + (show.apx ? ` (≈ ${V[k].ap.toFixed(3)})` : '') + ' nats';
      r.badge.style.display = k === best ? '' : 'none';
      r.card.classList.toggle('ps-best', k === best);
    });
    lastLine.textContent = lastMsg;
    el.dataset.a = a.map(c => c.map(v => +v.toFixed(3)).join('/')).join(' | ');
    el.dataset.w = a.map(c => c.map((_, i) => noveltyExact(c, i).toFixed(4)).join('/')).join(' | ');
    el.dataset.wapprox = a.map(c => c.map((_, i) => noveltyApprox(c, i).toFixed(4)).join('/')).join(' | ');
    el.dataset.opts = V.map(v => v.ex.toFixed(4)).join(',');
  }
  draw();
}
