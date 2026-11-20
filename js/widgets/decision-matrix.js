// decision-matrix
//
// A decision under uncertainty: 2 to 4 actions (rows) by 2 to 4 states (columns), a payoff in every
// cell, a probability for every state, the expected value (EV) of every row and the best row
// highlighted. Payoffs may be finite numbers or infinite ("inf", "+inf", "∞", "-inf"): a state with
// probability above 0 and payoff +inf makes the row's EV +inf; a state with probability 0 contributes
// 0 (the convention 0 x inf = 0, explained in a note); +inf together with -inf is undefined. Several
// rows with EV = +inf tie: the EV cannot rank them. Optional extra states ("many gods") can be
// shown or hidden with a button. Optional threshold readout: the smallest (or largest) probability
// of one state at which one row beats another, the other states keeping their mutual proportions.
// Plain HTML; all wording from the config; the widget only displays (it reports nothing to the card).
//
//   actions: ["A", "B"]          row labels (2 to 4; markdown inline ok)
//   states: ["S1", "S2"]         column labels (2 to 4)
//   payoffs: [[1, 2], [3, 4]]    rows x states; number, Infinity (.inf) or "inf", "+inf", "∞", "-inf"
//   probs: [0.5, 0.5]            start probabilities (weights) of the states, any positive scale
//   extraStates: [{label, prob, payoffs: [per row]}]   up to 2 more columns ("many gods")
//   extraToggle: false           true = a button shows/hides the extra columns (else always shown)
//   extraShown: false            start state of the toggle
//   probMode: "linear"           "log" = log sliders (powers of ten), bottom of the slider = exactly 0
//   probMin: -9                  log mode: lowest exponent above the 0 stop
//   payoffEdit: true             payoffs can be typed (false = fixed text)
//   infToggle: true              small ∞ button under each editable payoff
//   probSlider: true             the probability sliders (false = probabilities fixed at their start)
//   probRow: true                the row of probabilities under the column labels
//   ev: true                     the expected-value column
//   highlight: true              colour the best row(s)
//   rowLabels: true, colLabels: true     the row names, the column names
//   threshold: {state: 0, row: 0, versus: 1}   or true (those defaults): threshold readout
//   readout: true                the readout block; or {best, threshold, notes} each true/false
//   reset: true                  the Reset button
//   labels: {corner, prob_row, ev, p_slider, best, tie, none, thr_above, thr_below, thr_always,
//            thr_never, thr_pos, thr_lt1, thr_tie, note_inf, note_zero, note_undef, extra_on,
//            extra_off, reset, inf_btn}
//   presets: [{label, payoffs, prob, probs, gods}]   buttons (any field may be omitted;
//            prob = probability of state 1 in the 2-state view, probs = all weights, gods = show extras)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

// inline markdown as an element (mdInline returns an HTML string)
const M = src => h('span', { html: mdInline(src) });

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
const sup = n => String(n).split('').map(c => SUP[c] ?? c).join('');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function parseVal(v) {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').trim().toLowerCase().replace(/\s+/g, '').replace('−', '-').replace(',', '.');
  if (['inf', '+inf', '∞', '+∞', 'infinity', '+infinity'].includes(s)) return Infinity;
  if (['-inf', '-∞', '-infinity'].includes(s)) return -Infinity;
  if (s === '') return NaN;
  return Number(s);
}
function sci(x, digits) {
  let [m, e] = x.toExponential(digits).split('e');
  m = String(parseFloat(m)); e = Number(e);
  return `${m === '1' ? '' : m + '×'}10${sup(e)}`;
}
function fmtNum(x) {
  if (Number.isNaN(x)) return 'undefined';
  if (x === Infinity) return '∞';
  if (x === -Infinity) return '−∞';
  const a = Math.abs(x);
  let s;
  if (a !== 0 && (a >= 1e7 || a < 1e-4)) s = sci(a, 2);
  else s = String(parseFloat(a.toPrecision(6)));
  return (x < 0 ? '−' : '') + s;
}
function fmtP(p) {
  if (p <= 0) return '0';
  if (p >= 0.001) return `${parseFloat((p * 100).toPrecision(3))}%`;
  return sci(p, 2);
}
// sum of p * x over terms, with the convention 0 x inf = 0; +inf and -inf together are undefined
function sumTerms(terms) {
  let s = 0, pos = false, neg = false;
  for (const [p, x] of terms) {
    if (!(p > 0)) continue;
    if (x === Infinity) pos = true; else if (x === -Infinity) neg = true; else s += p * x;
  }
  if (pos && neg) return NaN;
  return pos ? Infinity : neg ? -Infinity : s;
}

export function decisionMatrix(el, cfg) {
  const L = {
    corner: '', prob_row: 'Probability', ev: 'Expected value', p_slider: 'P({state})', best: 'Best row',
    tie: 'tie: the expected values are equal, so they cannot rank these rows',
    none: 'no row has a defined expected value',
    thr_above: '**{row}** beats **{vs}** when P({state}) > {p}',
    thr_below: '**{row}** beats **{vs}** when P({state}) < {p}',
    thr_always: '**{row}** beats **{vs}** at every probability of {state}',
    thr_never: '**{row}** never beats **{vs}**, whatever the probability of {state}',
    thr_pos: '**{row}** beats **{vs}** at every probability of {state} above 0',
    thr_lt1: '**{row}** beats **{vs}** at every probability of {state} below 1',
    thr_tie: '**{row}** and **{vs}** tie at every probability of {state}',
    note_inf: 'A payoff of ∞ with probability above 0 makes the expected value ∞, however small the probability. Rows with expected value ∞ tie, so the expected value cannot rank them.',
    note_zero: 'A state with probability 0 adds 0 to the expected value, even when its payoff is ∞: the product 0 × ∞ is counted as 0 here. This is a convention; a tiny positive probability gives ∞ instead.',
    note_undef: 'A row that holds both +∞ and −∞ at states with positive probability has no defined expected value.',
    extra_on: 'Add the extra states', extra_off: 'Remove the extra states', reset: 'Reset', inf_btn: '∞',
    ...(cfg.labels ?? {}),
  };
  const on = (k, d = true) => (cfg[k] === undefined ? d : cfg[k] !== false);
  const actions = (cfg.actions ?? ['Action A', 'Action B']).slice(0, 4);
  const baseStates = (cfg.states ?? ['State 1', 'State 2']).slice(0, 4);
  const extras = (cfg.extraStates ?? []).slice(0, 2);
  const R = actions.length, NB = baseStates.length, NC = NB + extras.length;
  const names = [...baseStates, ...extras.map((x, i) => x.label ?? `Extra ${i + 1}`)];
  const logMode = cfg.probMode === 'log';
  const pMin = cfg.probMin ?? -9;
  const edit = on('payoffEdit'), infBtn = on('infToggle');
  const thrCfg = cfg.threshold ? { state: 0, row: 0, versus: 1, ...(cfg.threshold === true ? {} : cfg.threshold) } : null;
  const ro = typeof cfg.readout === 'object' ? cfg.readout : (cfg.readout === false ? {} : { best: true, threshold: true, notes: true });

  const initPay = () => actions.map((_, r) => names.map((_, c) => {
    const raw = c < NB ? cfg.payoffs?.[r]?.[c] : extras[c - NB].payoffs?.[r];
    const v = parseVal(raw ?? 0);
    return Number.isNaN(v) ? 0 : v;
  }));
  const initW = () => names.map((_, c) => {
    const v = c < NB ? num(cfg.probs?.[c], 1 / NB) : num(extras[c - NB].prob, 0.1);
    return Math.max(0, v);
  });
  function num(v, d) { const x = Number(v); return Number.isFinite(x) ? x : d; }
  let pay = initPay(), w = initW();
  if (NB === 2 && !cfg.probs) w[0] = w[1] = 0.5;
  let showExtra = extras.length > 0 && (!on('extraToggle', false) || cfg.extraShown === true);
  // normalise the two base weights so the 2-state slider holds w0 + w1 = 1
  const norm2 = () => { if (NB === 2) { const s = w[0] + w[1]; if (s > 0) { w[0] /= s; w[1] /= s; } } };
  norm2();
  const w0 = w.slice(), pay0 = pay.map(r => r.slice());
  const fin = pay.map(r => r.map(x => (Number.isFinite(x) ? x : 1)));
  const nVis = () => (showExtra ? NC : NB);
  const twoView = () => nVis() === 2;

  // ----- table -----
  const table = h('table', { class: 'dm-table' });
  if (on('colLabels')) {
    table.append(h('thead', {}, h('tr', {},
      on('rowLabels') ? h('th', { class: 'dm-corner' }, M(L.corner)) : null,
      ...names.map((n, c) => h('th', { class: `dm-col ${c >= NB ? 'dm-x' : ''}` }, M(n))),
      on('ev') ? h('th', { class: 'dm-evh' }, M(L.ev)) : null)));
  }
  const tb = h('tbody');
  const pCells = [];
  if (on('probRow')) {
    const tr = h('tr', { class: 'dm-prow' }, on('rowLabels') ? h('th', {}, M(L.prob_row)) : null);
    names.forEach((_, c) => { const td = h('td', { class: c >= NB ? 'dm-x' : '' }); pCells.push(td); tr.append(td); });
    if (on('ev')) tr.append(h('td'));
    tb.append(tr);
  }
  const inps = [], btns = [], evCells = [], trs = [];
  actions.forEach((a, r) => {
    inps.push([]); btns.push([]);
    const tr = h('tr', { class: 'dm-row' }, on('rowLabels') ? h('th', { class: 'dm-rl' }, M(a)) : null);
    names.forEach((n, c) => {
      const td = h('td', { class: `dm-cell ${c >= NB ? 'dm-x' : ''}` });
      if (edit) {
        const inp = h('input', { type: 'text', inputmode: 'text', autocomplete: 'off', class: 'dm-in', 'aria-label': `${actions[r]}, ${n}` });
        inp.addEventListener('input', () => { const v = parseVal(inp.value); if (!Number.isNaN(v)) { pay[r][c] = v; if (Number.isFinite(v)) fin[r][c] = v; draw(r, c); } });
        inp.addEventListener('change', () => draw());
        inps[r][c] = inp; td.append(inp);
        if (infBtn) {
          const b = h('button', { type: 'button', class: 'dm-inf', 'aria-label': `${L.inf_btn}: ${actions[r]}, ${n}`, 'aria-pressed': 'false' }, L.inf_btn);
          b.addEventListener('click', () => { pay[r][c] = Number.isFinite(pay[r][c]) || Number.isNaN(pay[r][c]) ? Infinity : fin[r][c]; draw(); });
          btns[r][c] = b; td.append(b);
        }
      } else td.dataset.fixed = '1';
      tr.append(td);
    });
    const evc = h('td', { class: 'dm-ev' });
    evCells.push(evc);
    if (on('ev')) tr.append(evc);
    trs.push(tr); tb.append(tr);
  });
  table.append(tb);
  const fixedCells = (r, c) => trs[r].querySelectorAll('td.dm-cell')[c];

  // ----- probability sliders -----
  const ctl = h('div', { class: 'dm-ctl' });
  const sliders = [];
  const slMin = logMode ? pMin - 1 : 0;
  const slStep = logMode ? 0.05 : 0.01;
  const toSl = x => (logMode ? (x <= 0 ? slMin : clamp(Math.log10(x), pMin, 0)) : clamp(x, 0, 1));
  const fromSl = v => (logMode ? (v <= slMin + 1e-9 ? 0 : 10 ** v) : v);
  if (on('probSlider')) {
    names.forEach((n, c) => {
      const inp = h('input', { type: 'range', min: slMin, max: logMode ? 0 : 1, step: slStep, 'aria-label': `P(${n})` });
      const val = h('span', { class: 'dm-val' });
      const name = h('span', { class: 'dm-name' });
      inp.addEventListener('input', () => {
        const x = fromSl(+inp.value);
        if (twoView()) { w[0] = x; w[1] = 1 - x; } else w[c] = x;
        draw();
      });
      const row = h('label', { class: 'dm-srow' }, name, inp, val);
      sliders.push({ c, inp, val, name, row });
      ctl.append(row);
    });
  }
  const toggle = extras.length && on('extraToggle', false)
    ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { showExtra = !showExtra; if (!showExtra) norm2(); draw(); } }) : null;

  // ----- readout -----
  const out = h('div', { class: 'dm-out' });
  const outBest = h('div', { class: 'dm-line strong' });
  const outThr = h('div', { class: 'dm-line' });
  const outNotes = h('div', { class: 'dm-notes' });
  if (ro.best) out.append(outBest);
  if (ro.threshold && thrCfg) out.append(outThr);
  if (ro.notes) out.append(outNotes);

  const presetBtns = (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
    if (pr.payoffs) pr.payoffs.forEach((row, r) => row.forEach((v, c) => { const x = parseVal(v); if (!Number.isNaN(x) && r < R && c < NC) { pay[r][c] = x; if (Number.isFinite(x)) fin[r][c] = x; } }));
    if (pr.probs) pr.probs.forEach((v, c) => { if (c < NC) w[c] = Math.max(0, num(v, 0)); });
    if (pr.prob != null) { const p = clamp(num(pr.prob, 0.5), 0, 1); w[0] = p; w[1] = 1 - p; }
    if (pr.gods != null && extras.length) showExtra = !!pr.gods;
    if (!showExtra) norm2();
    draw(); } }, pr.label));
  const resetBtn = on('reset') ? h('button', { class: 'btn ghost', type: 'button', onclick: () => {
    pay = pay0.map(r => r.slice()); w = w0.slice(); showExtra = extras.length > 0 && (!on('extraToggle', false) || cfg.extraShown === true); draw(); } }, L.reset) : null;
  const bar = h('div', { class: 'wbtns' }, toggle, ...presetBtns, resetBtn);

  el.append(h('div', { class: 'dm-wrap' }, table));
  if (sliders.length) el.append(ctl);
  if (out.children.length) el.append(out);
  if (bar.children.length) el.append(bar);

  // ----- computation -----
  const probs = () => {
    const n = nVis();
    let s = 0; for (let c = 0; c < n; c++) s += w[c];
    return names.map((_, c) => (c >= n ? 0 : s > 0 ? w[c] / s : 1 / n));
  };
  const evRow = (r, p) => sumTerms(names.map((_, c) => [p[c], pay[r][c]]));

  function threshold(p) {
    const n = nVis(), s = thrCfg.state, r = thrCfg.row, v = thrCfg.versus;
    if (s >= n || r >= R || v >= R || r === v) return '';
    let rest = 0; for (let c = 0; c < n; c++) if (c !== s) rest += p[c];
    const cond = row => sumTerms(names.slice(0, n).map((_, c) => [c === s ? 0 : (rest > 0 ? p[c] / rest : 1 / (n - 1)), pay[row][c]]));
    const A = [pay[r][s], cond(r)], B = [pay[v][s], cond(v)];
    const at = (t, X) => sumTerms([[t, X[0]], [1 - t, X[1]]]);
    const wins = t => at(t, A) > at(t, B);
    const fill = (tpl, pv) => tpl.replace('{row}', actions[r]).replace('{vs}', actions[v]).replace('{state}', names[s]).replace('{p}', pv ?? '');
    if ([...A, ...B].every(Number.isFinite)) {
      const da = A[0] - B[0], db = A[1] - B[1], slope = da - db;
      if (Math.abs(slope) < 1e-12 * (Math.abs(da) + Math.abs(db) + 1)) return fill(db > 0 ? L.thr_always : db < 0 ? L.thr_never : L.thr_tie);
      const ps = -db / slope;
      if (ps <= 0 || ps >= 1) return fill(wins(0.5) ? L.thr_always : L.thr_never);
      return fill(slope > 0 ? L.thr_above : L.thr_below, fmtP(ps));
    }
    const w0_ = wins(0), wm = wins(0.5), w1 = wins(1);
    if (!wm) return fill(L.thr_never);
    if (w0_ && w1) return fill(L.thr_always);
    if (w1 && !w0_) return fill(L.thr_pos);
    if (w0_ && !w1) return fill(L.thr_lt1);
    return fill(L.thr_always);
  }

  function draw(skipR, skipC) {
    const n = nVis(), two = twoView(), p = probs();
    // extra columns
    el.querySelectorAll('.dm-x').forEach(e => { e.hidden = !showExtra; });
    if (toggle) toggle.textContent = showExtra ? L.extra_off : L.extra_on;
    // payoffs
    for (let r = 0; r < R; r++) for (let c = 0; c < NC; c++) {
      const x = pay[r][c], inp = inps[r]?.[c];
      if (inp) {
        if (!(r === skipR && c === skipC) && document.activeElement !== inp) inp.value = Number.isFinite(x) ? String(parseFloat(x.toPrecision(10))) : fmtNum(x);
        inp.classList.toggle('dm-infv', !Number.isFinite(x));
        if (btns[r][c]) btns[r][c].setAttribute('aria-pressed', String(x === Infinity));
      } else fixedCells(r, c).textContent = fmtNum(x);
    }
    // probabilities
    pCells.forEach((td, c) => { td.textContent = c < n ? fmtP(p[c]) : ''; });
    for (const sl of sliders) {
      const { c, inp, val, name, row } = sl;
      row.hidden = two ? c !== 0 : c >= n;
      const x = two ? w[0] : w[c];
      inp.value = toSl(x);
      name.replaceChildren(M(L.p_slider.replace('{state}', names[c])));
      val.textContent = fmtP(two ? w[0] : p[c]);
    }
    // EV and best
    const evs = actions.map((_, r) => evRow(r, p));
    const valid = evs.filter(e => !Number.isNaN(e));
    const top = valid.length ? Math.max(...valid) : null;
    const tol = top === null || !Number.isFinite(top) ? 0 : 1e-9 * Math.max(1, Math.abs(top));
    const best = evs.map(e => top !== null && !Number.isNaN(e) && (e === top || Math.abs(e - top) <= tol));
    evs.forEach((e, r) => {
      evCells[r].textContent = fmtNum(e);
      trs[r].classList.toggle('dm-best', on('highlight') && best[r]);
    });
    // readout
    const bi = best.map((b, i) => (b ? i : -1)).filter(i => i >= 0);
    if (ro.best) {
      if (!bi.length) outBest.replaceChildren(M(L.none));
      else outBest.replaceChildren(M(`${L.best}: ${bi.map(i => `**${actions[i]}**`).join(', ')}` + (bi.length > 1 ? ` (${L.tie})` : '')));
    }
    if (ro.threshold && thrCfg) outThr.replaceChildren(M(threshold(p)));
    if (ro.notes) {
      const notes = [];
      let posP = false, zeroInf = false;
      for (let r = 0; r < R; r++) for (let c = 0; c < n; c++) {
        if (pay[r][c] === Infinity && p[c] > 0) posP = true;
        if (!Number.isFinite(pay[r][c]) && !(p[c] > 0)) zeroInf = true;
      }
      if (posP) notes.push(L.note_inf);
      if (zeroInf) notes.push(L.note_zero);
      if (evs.some(Number.isNaN)) notes.push(L.note_undef);
      outNotes.replaceChildren(...notes.map(t => h('p', { class: 'dm-note' }, M(t))));
    }
  }
  draw();
}
