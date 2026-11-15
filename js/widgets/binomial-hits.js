// hit-counter (file binomial-hits.js: ad blockers block any file named hit-counter.js)
//
// How many hits out of n trials count as evidence. Binomial bars for the hit count X out of
// n under chance (rate p0, or p0 = 1/k with k options to choose among) and under a claimed rate
// p1. A threshold t ("hits needed, fixed in advance") is a draggable dashed line (and an
// optional slider); bars at or above t are full, the rest faded. Readouts: false-positive rate
// P(X >= t | p0), power P(X >= t | p1) and, for an optional observed count x, the likelihood
// ratio P(X = x | p1) / P(X = x | p0). Tails are exact: pmf from log binomial coefficients,
// summed term by term. Plain SVG + HTML; all wording from the config; display only.
//
//   n: 10                    trials                    nMin: 1, nMax: 30   n slider range
//   k: 5                     options per trial; p0 = 1/k (omit k and give p0 for a direct rate)
//   kMin: 2, kMax: 10        k slider range
//   p0: 0.2                  chance rate when no k is given (slider 0.01 .. 0.99)
//   p1: 0.5                  claimed rate               p1Min: 0.01, p1Max: 1
//   t: 5                     threshold (hits needed), clamped to 1 .. n
//   x: null                  observed hits (number) shows the marker and the LR row
//   nSlider, kSlider, p0Slider, p1Slider, tSlider, xSlider: true   show each control
//                            (kSlider only with k, p0Slider only without; xSlider only with x)
//   locked: [names]          controls shown but disabled, e.g. [n, k]
//   chanceBars, claimBars: true   each bar set        shade: true   fade the bars below t
//   threshold: true          the dashed line          handle: true  its drag handle (off = fixed t)
//   tLabel: true             "t = 5" next to the line  observed: true  the x marker under the axis
//   axis: true, ticks: true, axisLabel: true, legend: true
//   readout: true            all rows; or {t, fp, power, lr} each true/false
//   reset: true              the Reset button
//   labels: {n, k, p0, p1, t, x, chance, claim, axis, tline, xmark, r_t, r_fp, r_power, r_lr, of, reset}
//   presets: [{label, n, k, p0, p1, t, x}]   buttons (omitted fields keep the current value)

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
const clampN = (v, a, b) => Math.min(b, Math.max(a, v));
const W = 480, X0 = 24, X1 = 464;

// exact binomial pmf for x = 0..n (log binomial coefficients, products in log space)
export function binomPmf(n, p) {
  const out = new Array(n + 1).fill(0);
  if (p <= 0) { out[0] = 1; return out; }
  if (p >= 1) { out[n] = 1; return out; }
  const lp = Math.log(p), lq = Math.log1p(-p);
  let lc = 0; // ln C(n, x)
  for (let x = 0; x <= n; x++) {
    if (x > 0) lc += Math.log(n - x + 1) - Math.log(x);
    out[x] = Math.exp(lc + x * lp + (n - x) * lq);
  }
  return out;
}
// P(X >= t), summed from the top (small terms first)
export const tail = (pmf, t) => { let s = 0; for (let x = pmf.length - 1; x >= Math.max(0, t); x--) s += pmf[x]; return Math.min(1, s); };

// "m × 10^e" nodes for small or large values
function sci(v) {
  let e = Math.floor(Math.log10(v)), m = v / 10 ** e;
  if (+m.toFixed(1) >= 10) { m /= 10; e += 1; }
  return [`${m.toFixed(1)} × 10`, h('sup', {}, String(e))];
}
function pctNodes(v) {
  if (v <= 0) return ['0'];
  if (v >= 1) return ['100%'];
  if (v < 1e-3) return sci(v);
  const P = v * 100;
  return [`${P >= 99.95 ? P.toFixed(2) : P >= 10 ? P.toFixed(1) : P >= 1 ? P.toFixed(2) : P.toFixed(3)}%`];
}
function lrNodes(v) {
  if (!isFinite(v)) return ['∞'];
  if (v <= 0) return ['0'];
  if (v >= 1e4 || v < 1e-2) return sci(v);
  return [v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)];
}

export function hitCounter(el, cfg) {
  const L = { n: 'Trials n', k: 'Options k', p0: 'Chance rate p₀', p1: 'Claimed rate p₁', t: 'Hits needed t', x: 'Observed hits x',
    chance: 'chance', claim: 'claimed', axis: 'hits X', tline: 't', xmark: 'x',
    r_t: 'Hits needed', r_fp: 'False positive P(X ≥ t | chance)', r_power: 'Power P(X ≥ t | claim)',
    r_lr: 'Likelihood ratio at x', of: 'of', reset: 'Reset', ...(cfg.labels ?? {}) };
  const on = k => cfg[k] !== false;
  const useK = cfg.k != null || (cfg.p0 == null);
  const nMin = cfg.nMin ?? 1, nMax = cfg.nMax ?? 30, kMin = cfg.kMin ?? 2, kMax = cfg.kMax ?? 10;
  const p1Min = cfg.p1Min ?? 0.01, p1Max = cfg.p1Max ?? 1;
  const hasX = cfg.x != null;
  const locked = new Set(cfg.locked ?? []);
  const ro = typeof cfg.readout === 'object' ? cfg.readout : (cfg.readout === false ? {} : { t: true, fp: true, power: true, lr: true });
  const init = () => {
    const n = clampN(Math.round(num(cfg.n ?? 10)), nMin, nMax);
    return { n, k: clampN(Math.round(num(cfg.k ?? 5)), kMin, kMax), p0: clampN(num(cfg.p0 ?? 0.2), 0.01, 0.99),
      p1: clampN(num(cfg.p1 ?? 0.5), p1Min, p1Max), t: clampN(Math.round(num(cfg.t ?? Math.ceil(n / 2))), 1, n),
      x: hasX ? clampN(Math.round(num(cfg.x)), 0, n) : null };
  };
  let st = init();
  const p0 = () => (useK ? 1 / st.k : st.p0);
  const fix = () => { st.t = clampN(st.t, 1, st.n); if (st.x != null) st.x = clampN(st.x, 0, st.n); };

  // controls
  const rows = [];
  const fmt2 = v => [(+v).toFixed(2)];
  const slider = (key, title, min, max, step, fmt) => {
    const inp = h('input', { type: 'range', min, max, step, 'aria-label': title });
    if (locked.has(key)) inp.disabled = true;
    const val = h('span', { class: 'hc-val' });
    inp.addEventListener('input', () => { st[key] = +inp.value; fix(); draw(); });
    rows.push({ inp, val, key, fmt, max: () => (key === 't' ? st.n : key === 'x' ? st.n : max), min: () => (key === 't' ? 1 : min) });
    return h('label', { class: 'hc-row' }, h('span', { class: 'hc-name' }, mdInline(title)), inp, val);
  };
  const ctl = h('div', { class: 'hc-ctl' });
  if (on('nSlider')) ctl.append(slider('n', L.n, nMin, nMax, 1, v => [String(v)]));
  if (useK && on('kSlider')) ctl.append(slider('k', L.k, kMin, kMax, 1, v => [`${v} (p₀ = ${(1 / v).toFixed(2)})`]));
  if (!useK && on('p0Slider')) ctl.append(slider('p0', L.p0, 0.01, 0.99, 0.01, fmt2));
  if (on('p1Slider')) ctl.append(slider('p1', L.p1, p1Min, p1Max, 0.01, fmt2));
  if (on('tSlider')) ctl.append(slider('t', L.t, 1, nMax, 1, v => [String(v)]));
  if (hasX && on('xSlider')) ctl.append(slider('x', L.x, 0, nMax, 1, v => [String(v)]));

  // plot
  const showLeg = on('legend'), showAxis = on('axis'), showTicks = on('ticks'), showAxL = on('axisLabel');
  const showC = on('chanceBars'), showP = on('claimBars'), shade = on('shade');
  const showT = on('threshold'), showH = showT && on('handle') && !locked.has('t'), showTL = showT && on('tLabel');
  const showObs = hasX && on('observed');
  const TOP = showLeg ? 34 : 14, AXY = 176, H = AXY + (showTicks ? 18 : 4) + (showAxL ? 18 : 0) + (showObs ? 14 : 0);
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'hc-svg', role: 'img', 'aria-label': 'Binomial hit counts' });
  if (showLeg) {
    let lx = X0;
    for (const [col, lab, ok] of [['var(--covec)', L.chance, showC], ['var(--vec)', L.claim, showP]]) {
      if (!ok) continue;
      svg.append(sv('rect', { x: lx, y: 8, width: 12, height: 12, rx: 2, fill: col }));
      const tx = sv('text', { x: lx + 17, y: 18.5, class: 'hc-leg' }, lab);
      svg.append(tx); lx += 34 + 8 * String(lab).length;
    }
  }
  const bars = sv('g'), ticksG = sv('g'), obsG = sv('g');
  svg.append(bars);
  if (showAxis) svg.append(sv('line', { x1: X0, x2: X1, y1: AXY, y2: AXY, class: 'hc-axis' }));
  svg.append(ticksG, obsG);
  const axY = AXY + (showTicks ? 18 : 4) + (showObs ? 14 : 0) + 13;
  if (showAxL) svg.append(sv('text', { x: (X0 + X1) / 2, y: axY, 'text-anchor': 'middle', class: 'hc-tl' }, L.axis));
  let tLine = null, tText = null, tHd = null;
  if (showT) {
    tLine = sv('line', { y1: TOP - 4, y2: AXY, class: 'hc-t' });
    svg.append(tLine);
    if (showTL) { tText = sv('text', { y: TOP + 8, class: 'hc-tt' }); svg.append(tText); }
    if (showH) {
      tHd = sv('circle', { r: 9, cy: (TOP + AXY) / 2, class: 'w-handle hc-handle', tabindex: 0, 'aria-label': L.t });
      svg.append(tHd);
    }
  }
  const slot = () => (X1 - X0) / (st.n + 1);
  const cx = x => X0 + (x + 0.5) * slot();
  if (tHd) {
    let drag = false;
    const setFrom = e => {
      const m = svg.getScreenCTM(); if (!m) return;
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const sx = pt.matrixTransform(m.inverse()).x;
      st.t = clampN(Math.round((sx - X0) / slot()), 1, st.n); draw();
    };
    tHd.addEventListener('pointerdown', e => { e.preventDefault(); drag = true; try { tHd.setPointerCapture(e.pointerId); } catch {} });
    const mv = e => { if (drag) setFrom(e); };
    tHd.addEventListener('pointermove', mv); window.addEventListener('pointermove', mv);
    const up = () => { drag = false; };
    tHd.addEventListener('pointerup', up); tHd.addEventListener('pointercancel', up); window.addEventListener('pointerup', up);
    tHd.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
      if (d) { e.preventDefault(); st.t = clampN(st.t + d, 1, st.n); draw(); }
    });
  }

  // readout
  const out = h('div', { class: 'hc-out' });
  const outVals = {};
  for (const [k, lab] of [['t', L.r_t], ['fp', L.r_fp], ['power', L.r_power], ['lr', L.r_lr]]) {
    if (!ro[k] || (k === 'lr' && !hasX)) continue;
    outVals[k] = h('span', { class: 'hc-ov' });
    out.append(h('div', { class: 'hc-orow' }, h('span', {}, mdInline(lab)), outVals[k]));
  }

  const btns = h('div', { class: 'wbtns' },
    ...(cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      if (pr.n != null) st.n = clampN(Math.round(pr.n), nMin, nMax);
      if (pr.k != null) st.k = clampN(Math.round(pr.k), kMin, kMax);
      if (pr.p0 != null) st.p0 = clampN(num(pr.p0), 0.01, 0.99);
      if (pr.p1 != null) st.p1 = clampN(num(pr.p1), p1Min, p1Max);
      if (pr.t != null) st.t = Math.round(pr.t);
      if (pr.x != null && hasX) st.x = Math.round(pr.x);
      fix(); draw(); } }, pr.label)),
    on('reset') ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, L.reset) : '');
  el.append(ctl, svg);
  if (out.children.length) el.append(out);
  if (btns.children.length) el.append(btns);

  function draw() {
    for (const r of rows) { r.inp.max = r.max(); r.inp.min = r.min(); r.inp.value = st[r.key]; r.val.replaceChildren(...r.fmt(+r.inp.value)); }
    const n = st.n, f0 = binomPmf(n, p0()), f1 = binomPmf(n, st.p1);
    const yMax = Math.max(1e-9, ...(showC ? f0 : []), ...(showP ? f1 : []));
    const sl = slot(), bw = Math.min(18, sl * (showC && showP ? 0.4 : 0.7)), hgt = v => (v / yMax) * (AXY - TOP - 4);
    bars.replaceChildren();
    for (let x = 0; x <= n; x++) {
      const op = shade && x < st.t ? 0.3 : 1;
      const sets = [[showC, f0, 'var(--covec)'], [showP, f1, 'var(--vec)']].filter(s => s[0]);
      sets.forEach(([, f, col], i) => {
        const off = sets.length === 2 ? (i === 0 ? -bw - 1 : 1) : -bw / 2;
        const hh = hgt(f[x]);
        bars.append(sv('rect', { x: cx(x) + off, y: AXY - hh, width: bw, height: Math.max(0, hh), fill: col, 'fill-opacity': op }));
      });
    }
    ticksG.replaceChildren();
    if (showTicks) {
      const every = Math.max(1, Math.ceil(20 / sl));
      for (let x = 0; x <= n; x++) if (x % every === 0) ticksG.append(sv('text', { x: cx(x), y: AXY + 14, 'text-anchor': 'middle', class: 'hc-tl' }, String(x)));
    }
    obsG.replaceChildren();
    if (showObs) {
      const ox = cx(st.x), oy = AXY + (showTicks ? 18 : 4);
      obsG.append(sv('path', { d: `M${ox} ${oy - 2} l-6 10 h12 z`, class: 'hc-obs' }),
        sv('text', { x: ox + 9, y: oy + 8, class: 'hc-tl' }, `${L.xmark} = ${st.x}`));
    }
    if (tLine) {
      const tx = X0 + st.t * sl;
      tLine.setAttribute('x1', tx); tLine.setAttribute('x2', tx);
      if (tText) {
        const right = tx < X1 - 60;
        tText.setAttribute('x', right ? tx + 6 : tx - 6); tText.setAttribute('text-anchor', right ? 'start' : 'end');
        tText.textContent = `${L.tline} = ${st.t}`;
      }
      if (tHd) tHd.setAttribute('cx', tx);
    }
    const put = (k, nodes) => outVals[k]?.replaceChildren(...nodes);
    put('t', [`${st.t} ${L.of} ${n}`]);
    put('fp', pctNodes(tail(f0, st.t)));
    put('power', pctNodes(tail(f1, st.t)));
    if (st.x != null) put('lr', lrNodes(f1[st.x] / f0[st.x]));
  }
  draw();
}
