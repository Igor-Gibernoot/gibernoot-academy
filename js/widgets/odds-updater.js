// odds-updater
//
// Bayes in odds form: posterior odds = prior odds x likelihood ratio. Sliders on log scales
// for the prior and the likelihood ratio (LR); optionally the LR comes from n independent
// witnesses that each report falsely with chance q: LR = pEM / q^n. A log-odds bar draws
// prior, LR and posterior as segments on one axis (0 = even odds = 50%), and a readout shows
// the posterior odds and probability. Plain SVG + HTML; all wording from the config; the
// widget only displays (it reports nothing to the card).
//
//   prior: 1.0e-6            start prior probability (odds ~ probability when small)
//   lr: 1000                 start likelihood ratio (ignored in witnesses mode)
//   witnesses: false         true = LR = pEM / q^n from the n and q controls
//   n: 1, q: 1.0e-3          start witnesses and false-report chance (witnesses mode)
//   pEM: 1                   chance a witness reports if it happened (P(E|M)), fixed
//   priorMin: -9, priorMax: 0     prior-odds slider range, exponents of 10 (0 = even odds)
//   lrMax: 12                LR slider range 10^0 .. 10^lrMax
//   nMax: 10, qMin: -9, qMax: -0.3   witnesses slider ranges (q slider: exponents of 10)
//   axisMin: -10, axisMax: 12  bar axis range (log10 odds); longer segments are clipped
//   priorSlider, lrSlider, nSlider, qSlider: true   show each control (lrSlider is off in
//                            witnesses mode; nSlider/qSlider only exist in witnesses mode)
//   bar: true                the log-odds bar         ticks: true   decade ticks and labels
//   rowLabels: true          names of the bar rows    marker50: true   the even-odds line
//   readout: true            the readout block; or {prior, lr, odds, prob} each true/false
//   reset: true              the Reset button
//   labels: {prior, lr, n, q, bar_prior, bar_lr, bar_post, r_prior, r_lr, r_odds, r_prob,
//            even, reset, witnesses}
//   presets: [{label, prior, lr | n, q}]   buttons (any field may be omitted)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return e;
};
const num = v => (typeof v === 'string' ? Number(v) : v);
const W = 480, X0 = 16, X1 = 464;

// x = 10^t as nodes: "m x 10^e" or "10^e" when the mantissa is 1.0 (t is the log10)
function sciT(t) {
  let e = Math.floor(t + 1e-9), m = 10 ** (t - e);
  if (+m.toFixed(1) >= 10) { m /= 10; e += 1; }
  const ms = m.toFixed(1);
  if (e === 0) return [ms === '1.0' ? '1' : ms];
  return [ms === '1.0' ? '10' : `${ms} × 10`, h('sup', {}, String(e))];
}

export function oddsUpdater(el, cfg) {
  const L = { prior: 'Prior odds', lr: 'Likelihood ratio', n: 'Witnesses n', q: 'False-report chance q',
    bar_prior: 'prior', bar_lr: 'evidence', bar_post: 'posterior',
    r_prior: 'Prior odds', r_lr: 'Likelihood ratio', r_odds: 'Posterior odds', r_prob: 'Posterior probability',
    even: '50%', reset: 'Reset', ...(cfg.labels ?? {}) };
  const wit = cfg.witnesses === true;
  const on = (k, d = true) => cfg[k] !== false && d;
  const pM = Math.min(1, Math.max(0, num(cfg.pEM ?? 1))) || 1;
  const pMin = cfg.priorMin ?? -9, pMax = cfg.priorMax ?? 0, lrMax = cfg.lrMax ?? 12;
  const nMax = cfg.nMax ?? 10, qMin = cfg.qMin ?? -9, qMax = cfg.qMax ?? -0.3;
  const aMin = cfg.axisMin ?? -10, aMax = cfg.axisMax ?? 12;
  const ro = typeof cfg.readout === 'object' ? cfg.readout : (cfg.readout === false ? {} : { prior: true, lr: true, odds: true, prob: true });
  const clampN = (v, a, b) => Math.min(b, Math.max(a, v));
  const lg = x => Math.log10(x);
  const startP = () => { const p = num(cfg.prior ?? 1e-6); return lg(p / (1 - p)); };
  const init = () => ({ p: clampN(startP(), pMin, pMax), l: clampN(lg(num(cfg.lr ?? 1000)), 0, lrMax),
    n: clampN(Math.round(cfg.n ?? 1), 1, nMax), q: clampN(lg(num(cfg.q ?? 1e-3)), qMin, qMax) });
  let st = init();
  const lrLog = () => (wit ? lg(pM) - st.n * st.q : st.l);

  const rows = [];
  const slider = (key, title, min, max, step, fmt) => {
    const inp = h('input', { type: 'range', min, max, step, 'aria-label': title });
    const val = h('span', { class: 'ou-val' });
    inp.addEventListener('input', () => { st[key] = +inp.value; draw(); });
    rows.push({ inp, val, key, fmt });
    return h('label', { class: 'ou-row' }, h('span', { class: 'ou-name' }, mdInline(title)), inp, val);
  };
  const ctl = h('div', { class: 'ou-ctl' });
  if (on('priorSlider')) ctl.append(slider('p', L.prior, pMin, pMax, 0.05, v => sciT(v)));
  if (wit) {
    if (on('nSlider')) ctl.append(slider('n', L.n, 1, nMax, 1, v => [String(v)]));
    if (on('qSlider')) ctl.append(slider('q', L.q, qMin, qMax, 0.05, v => sciT(v)));
  } else if (on('lrSlider')) ctl.append(slider('l', L.lr, 0, lrMax, 0.05, v => sciT(v)));

  // bar
  const showBar = on('bar'), showTicks = on('ticks'), showRow = on('rowLabels'), show50 = on('marker50');
  const ROW = [34, 68, 102], BH = 16, AXY = 130, H = showTicks ? 150 : 128;
  const xOf = t => X0 + ((clampN(t, aMin, aMax) - aMin) / (aMax - aMin)) * (X1 - X0);
  let barEl = null, segs = {};
  if (showBar) {
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'ou-svg', role: 'img', 'aria-label': 'Log-odds bar' });
    svg.append(sv('line', { x1: X0, x2: X1, y1: AXY, y2: AXY, class: 'ou-axis' }));
    if (showTicks) {
      const every = Math.max(1, Math.ceil(36 / ((X1 - X0) / (aMax - aMin))));
      for (let e = Math.ceil(aMin); e <= aMax; e++) {
        const x = xOf(e);
        svg.append(sv('line', { x1: x, x2: x, y1: AXY - 4, y2: AXY + 4, class: 'ou-tick' }));
        if (e % every === 0) svg.append(sv('text', { x, y: AXY + 19, 'text-anchor': 'middle', class: 'ou-tl' }, '10', sv('tspan', { dy: -5, 'font-size': 10 }, String(e))));
      }
    }
    if (show50) {
      svg.append(sv('line', { x1: xOf(0), x2: xOf(0), y1: 14, y2: AXY, class: 'ou-50' }), sv('text', { x: xOf(0), y: 10, 'text-anchor': 'middle', class: 'ou-tl' }, L.even));
    }
    [['prior', 'var(--vec)', L.bar_prior], ['lr', 'var(--covec)', L.bar_lr], ['post', 'var(--basis)', L.bar_post]].forEach(([k, col, lab], i) => {
      if (showRow) svg.append(sv('text', { x: X0, y: ROW[i] - 4, class: 'ou-rl', fill: col }, lab));
      segs[k] = sv('rect', { y: ROW[i], height: BH, rx: 3, fill: col, class: 'ou-seg' });
      svg.append(segs[k]);
    });
    barEl = svg;
  }

  // readout
  const out = h('div', { class: 'ou-out' });
  const outVals = {};
  for (const [k, lab] of [['prior', L.r_prior], ['lr', L.r_lr], ['odds', L.r_odds], ['prob', L.r_prob]]) {
    if (!ro[k]) continue;
    outVals[k] = h('span', { class: 'ou-ov' });
    out.append(h('div', { class: `ou-orow ${k === 'prob' ? 'strong' : ''}` }, h('span', {}, mdInline(lab)), outVals[k]));
  }

  const btns = h('div', { class: 'wbtns' },
    ...(cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      if (pr.prior != null) { const p = num(pr.prior); st.p = clampN(lg(p / (1 - p)), pMin, pMax); }
      if (pr.lr != null) st.l = clampN(lg(num(pr.lr)), 0, lrMax);
      if (pr.n != null) st.n = clampN(Math.round(pr.n), 1, nMax);
      if (pr.q != null) st.q = clampN(lg(num(pr.q)), qMin, qMax);
      draw(); } }, pr.label)),
    on('reset') ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, L.reset) : '');
  el.append(ctl);
  if (barEl) el.append(barEl);
  if (out.children.length) el.append(out);
  if (btns.children.length) el.append(btns);

  function prob(t) {
    if (t < -4) return ['≈ ', ...sciT(t)];
    if (t > 4) return ['1 − ', ...sciT(-t)];
    const P = 1 / (1 + 10 ** -t) * 100;
    return [`${P >= 10 ? P.toFixed(1) : P.toPrecision(2)}%`];
  }
  function draw() {
    const l = lrLog(), t = st.p + l;
    for (const r of rows) { r.inp.value = st[r.key]; r.val.replaceChildren(...r.fmt(+r.inp.value)); }
    if (segs.prior) {
      const set = (k, a, b) => { const x0 = xOf(Math.min(a, b)), x1 = xOf(Math.max(a, b)); segs[k].setAttribute('x', x0); segs[k].setAttribute('width', Math.max(2, x1 - x0)); };
      set('prior', 0, st.p); set('lr', st.p, t); set('post', 0, t);
    }
    const put = (k, nodes) => outVals[k]?.replaceChildren(...nodes);
    put('prior', sciT(st.p)); put('lr', sciT(l)); put('odds', sciT(t)); put('prob', prob(t));
  }
  draw();
}
