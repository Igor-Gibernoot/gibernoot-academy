// drake-sliders
//
// A product of independent factors (the Drake equation N = R* fp ne fl fi fc L, but any list of
// factors works) with a log slider per factor, the live product N on a log bar with a marker
// at N = 1, optional pessimistic / optimistic buttons, and an optional distribution view: every
// factor gets a log-uniform range (low, high); a seeded Monte Carlo draws log10 N, a histogram
// shows it, and interval propagation gives the smallest and largest N from the ranges.
// Plain SVG + HTML; all wording from the config; display only (reports nothing to the card).
//
//   factors: [{name, min, max, start, unit, low, high}]   (default: seven Drake factors)
//        name   label (inline markdown/math ok)     min, max   slider range (positive numbers)
//        start  start value (default: geometric middle)   unit   short text after the value
//        low, high   the log-uniform range of the distribution view (default: min, max)
//   axisMin: -10, axisMax: 10      log10 N axis of the bar (value clipped at the ends)
//   draws: 20000, seed: 7, binWidth: 1   Monte Carlo draws, seed, histogram bin width (decades)
//   sliders: true          the sliders            factorValues: true   the value next to each name
//   names: true            factor names           bar: true            the log bar
//   ticks: true            decade labels on bar and histogram         marker1: true   the N = 1 line
//   nReadout: true         the N readout          presets: true        the preset buttons
//   reset: true            the Reset button
//   histogram: false       the Monte Carlo histogram (true to show)
//   interval: false        the min / max N readout from the ranges (true to show)
//   median: true, fraction: true   the median and P(N < 1) readouts (with histogram)
//   labels: {n, bar_axis, one, median, fraction, interval_min, interval_max, hist, reset}
//   presets: [{label, values: [one number per factor]}]   buttons (values clamp to the slider range)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return e;
};
const W = 480, X0 = 16, X1 = 464;
const lg = x => Math.log10(x);
const clampN = (v, a, b) => Math.min(b, Math.max(a, v));

const DEFAULTS = [
  { name: '$R_*$', min: 0.1, max: 100, unit: '/yr' },
  { name: '$f_p$', min: 0.01, max: 1 },
  { name: '$n_e$', min: 0.01, max: 10 },
  { name: '$f_l$', min: 1e-6, max: 1 },
  { name: '$f_i$', min: 1e-6, max: 1 },
  { name: '$f_c$', min: 1e-3, max: 1 },
  { name: '$L$', min: 10, max: 1e9, unit: 'yr' },
];

// 10^t as nodes: "m x 10^e" or "10^e"
function sciT(t) {
  let e = Math.floor(t + 1e-9), m = 10 ** (t - e);
  if (+m.toFixed(1) >= 10) { m /= 10; e += 1; }
  const ms = m.toFixed(1);
  if (e === 0) return [ms === '1.0' ? '1' : ms];
  return [ms === '1.0' ? '10' : `${ms} × 10`, h('sup', {}, String(e))];
}
// a plain number when it is of moderate size, else scientific
function fmtT(t) {
  const x = 10 ** t;
  if (x >= 0.01 && x < 10000) return [String(+x.toPrecision(2))];
  return sciT(t);
}
function mulberry(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function drakeSliders(el, cfg) {
  const L = { n: 'N', bar_axis: 'log N', one: 'N = 1', median: 'Median N', fraction: 'Share of draws with $N<1$',
    interval_min: 'Smallest N', interval_max: 'Largest N', hist: 'Draws', reset: 'Reset', ...(cfg.labels ?? {}) };
  const on = (k, d = true) => (cfg[k] === undefined ? d : cfg[k] !== false);
  const facs = (cfg.factors ?? DEFAULTS).map((f, i) => {
    const d = DEFAULTS[i] ?? {};
    const min = lg(+(f.min ?? d.min ?? 0.1)), max = lg(+(f.max ?? d.max ?? 10));
    return { name: f.name ?? d.name ?? `x${i + 1}`, unit: f.unit ?? d.unit ?? '', min, max,
      start: f.start != null ? lg(+f.start) : (min + max) / 2,
      low: lg(+(f.low ?? f.min ?? d.min ?? 0.1)), high: lg(+(f.high ?? f.max ?? d.max ?? 10)) };
  });
  const aMin = cfg.axisMin ?? -10, aMax = cfg.axisMax ?? 10;
  const init = () => facs.map(f => clampN(f.start, f.min, f.max));
  let st = init();

  // sliders and per-factor values
  const showSl = on('sliders'), showVals = on('factorValues'), showNames = on('names');
  const rows = [];
  const ctl = h('div', { class: 'dk-ctl' });
  facs.forEach((f, i) => {
    if (!showSl && !showVals) return;
    const parts = [];
    if (showNames) parts.push(h('span', { class: 'dk-name', html: mdInline(f.name) }));
    let inp = null;
    if (showSl) {
      inp = h('input', { type: 'range', min: f.min, max: f.max, step: 0.02, 'aria-label': String(f.name).replace(/[$\\{}]/g, '') });
      inp.addEventListener('input', () => { st[i] = +inp.value; draw(); });
      parts.push(inp);
    }
    let val = null;
    if (showVals) { val = h('span', { class: 'dk-val' }); parts.push(val); }
    rows.push({ inp, val, i });
    ctl.append(h('label', { class: `dk-row${showSl ? '' : ' nosl'}${showNames ? '' : ' nonm'}` }, ...parts));
  });

  // log bar
  const showBar = on('bar'), showTicks = on('ticks'), show1 = on('marker1');
  const xOf = t => X0 + ((clampN(t, aMin, aMax) - aMin) / (aMax - aMin)) * (X1 - X0);
  let barRect = null, barDot = null;
  const tickLabels = (svg, y, lo, hi, xf) => {
    const every = Math.max(1, Math.ceil(34 / ((X1 - X0) / (hi - lo))));
    for (let e = Math.ceil(lo); e <= hi; e++) {
      const x = xf(e);
      svg.append(sv('line', { x1: x, x2: x, y1: y - 4, y2: y + 4, class: 'dk-tick' }));
      if (e % every === 0) svg.append(sv('text', { x, y: y + 19, 'text-anchor': 'middle', class: 'dk-tl' }, '10', sv('tspan', { dy: -5, 'font-size': 10 }, String(e))));
    }
  };
  let barEl = null;
  if (showBar) {
    const AXY = 52, H = showTicks ? 76 : 62;
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'dk-svg', role: 'img', 'aria-label': 'Log bar of N' });
    svg.append(sv('line', { x1: X0, x2: X1, y1: AXY, y2: AXY, class: 'dk-axis' }));
    barRect = sv('rect', { y: 24, height: 16, rx: 3, class: 'dk-seg' });
    svg.append(barRect);
    if (showTicks) tickLabels(svg, AXY, aMin, aMax, xOf);
    if (show1) svg.append(sv('line', { x1: xOf(0), x2: xOf(0), y1: 16, y2: AXY, class: 'dk-one' }), sv('text', { x: xOf(0), y: 11, 'text-anchor': 'middle', class: 'dk-tl' }, L.one));
    barEl = svg;
  }

  // readout of N
  const nOut = on('nReadout') ? h('div', { class: 'dk-orow strong' }, h('span', { html: mdInline(L.n) }), h('span', { class: 'dk-ov' })) : null;

  // distribution view
  const showHist = on('histogram', false), showInt = on('interval', false);
  let histEl = null, histOut = null, intOut = null;
  if (showHist || showInt) {
    const lo = facs.reduce((s, f) => s + f.low, 0), hi = facs.reduce((s, f) => s + f.high, 0);
    if (showInt) {
      intOut = h('div', { class: 'dk-out' },
        ...[['interval_min', lo], ['interval_max', hi]].map(([k, t]) => h('div', { class: 'dk-orow' }, h('span', { html: mdInline(L[k]) }), h('span', { class: 'dk-ov' }, ...sciT(t)))));
    }
    if (showHist) {
      const draws = Math.max(100, cfg.draws ?? 20000), rnd = mulberry(cfg.seed ?? 7);
      const ts = new Array(draws);
      for (let k = 0; k < draws; k++) { let t = 0; for (const f of facs) t += f.low + (f.high - f.low) * rnd(); ts[k] = t; }
      ts.sort((a, b) => a - b);
      const med = (ts[(draws >> 1) - 1] + ts[draws >> 1]) / 2;
      const frac = ts.filter(t => t < 0).length / draws;
      const bw = cfg.binWidth ?? 1;
      const hMin = Math.floor(Math.min(lo, 0) / bw) * bw, hMax = Math.ceil(Math.max(hi, 0) / bw) * bw;
      const nb = Math.max(1, Math.round((hMax - hMin) / bw)), cnt = new Array(nb).fill(0);
      for (const t of ts) cnt[Math.min(nb - 1, Math.floor((t - hMin) / bw))]++;
      const top = Math.max(...cnt) || 1;
      const xH = t => X0 + ((t - hMin) / (hMax - hMin)) * (X1 - X0);
      const AXY = 108, H = showTicks ? 134 : 118;
      const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'dk-svg', role: 'img', 'aria-label': L.hist });
      cnt.forEach((c, b) => {
        const hh = (c / top) * 84, x0 = xH(hMin + b * bw), x1 = xH(hMin + (b + 1) * bw);
        svg.append(sv('rect', { x: x0 + 0.5, y: AXY - hh, width: Math.max(1, x1 - x0 - 1), height: hh, class: `dk-bin${hMin + (b + 1) * bw <= 0 ? ' below' : ''}` }));
      });
      svg.append(sv('line', { x1: X0, x2: X1, y1: AXY, y2: AXY, class: 'dk-axis' }));
      if (showTicks) tickLabels(svg, AXY, hMin, hMax, xH);
      if (show1) svg.append(sv('line', { x1: xH(0), x2: xH(0), y1: 14, y2: AXY, class: 'dk-one' }), sv('text', { x: xH(0), y: 10, 'text-anchor': 'middle', class: 'dk-tl' }, L.one));
      histEl = svg;
      const o = [];
      if (on('median')) o.push(h('div', { class: 'dk-orow' }, h('span', { html: mdInline(L.median) }), h('span', { class: 'dk-ov' }, ...sciT(med))));
      if (on('fraction')) o.push(h('div', { class: 'dk-orow' }, h('span', { html: mdInline(L.fraction) }), h('span', { class: 'dk-ov' }, `${frac >= 0.995 && frac < 1 ? '>99' : frac <= 0.005 && frac > 0 ? '<1' : Math.round(frac * 100)}%`)));
      if (o.length) histOut = h('div', { class: 'dk-out' }, ...o);
    }
  }

  const presets = on('presets') ? (cfg.presets ?? []) : [];
  const btns = h('div', { class: 'wbtns' },
    ...presets.map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      (pr.values ?? []).forEach((v, i) => { if (facs[i] && v != null) st[i] = clampN(lg(+v), facs[i].min, facs[i].max); });
      draw(); } }, pr.label)),
    on('reset') && (showSl || presets.length) ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, L.reset) : '');

  if (ctl.children.length) el.append(ctl);
  if (nOut) el.append(h('div', { class: 'dk-out' }, nOut));
  if (barEl) el.append(barEl);
  if (btns.children.length) el.append(btns);
  if (histEl) el.append(histEl);
  if (histOut) el.append(histOut);
  if (intOut) el.append(intOut);

  function draw() {
    for (const r of rows) {
      if (r.inp) r.inp.value = st[r.i];
      if (r.val) r.val.replaceChildren(...fmtT(st[r.i]), facs[r.i].unit ? h('span', { class: 'dk-unit' }, ` ${facs[r.i].unit}`) : '');
    }
    const t = st.reduce((s, v) => s + v, 0);
    if (nOut) nOut.lastChild.replaceChildren(...sciT(t));
    if (barRect) {
      const x = xOf(t);
      barRect.setAttribute('x', X0); barRect.setAttribute('width', Math.max(2, x - X0));
      barRect.setAttribute('class', `dk-seg${t >= 0 ? ' above' : ''}`);
    }
  }
  draw();
}
