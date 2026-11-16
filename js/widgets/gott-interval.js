// gott-interval
//
// Gott's "Copernican duration" argument. A span of total length T (start at 0, true end at T) has
// a "now" marker at the fraction f of the span elapsed (f in (0,1)); t_past = f T. If now is a
// uniformly random moment of the span, then with confidence c the remaining time lies between
//   t_past (1-c)/(1+c)   and   t_past (1+c)/(1-c)      (c = 95%: 1/39 and 39 times t_past).
// The widget draws the timeline, the interval as a bar after "now", the true end marker and
// whether the interval covers the true future (true exactly when (1-c)/2 <= f <= (1+c)/2).
// A Monte Carlo panel draws N uniform observation moments and counts how often the interval
// covers the true future (approaches c). Plain SVG + HTML; display only; wording from the config.
//
//   span: 100            total length T of the span (any positive number)
//   unit: ""             short text after times (e.g. "years")
//   f: 0.3               start fraction elapsed, in (0,1)       c: 0.95   start confidence, in (0,1)
//   cMin: 0.5, cMax: 0.99   range of the confidence slider
//   draws: 1000, seed: 7    Monte Carlo draws per click, seed (reproducible)
//   timeline: true       the timeline SVG                  past: true        the elapsed part shaded
//   nowMarker: true      the "now" marker (draggable when fSlider is on or dragNow)
//   interval: true       the interval bar on the timeline  endMarker: true   the true-end marker
//   ticks: true          0 and T labels on the timeline    verdict: true     covered / missed text on the marker
//   dragNow: true        drag "now" on the timeline
//   fSlider: true        slider for f                      cSlider: false    slider for c (true to show)
//   readouts: true       all readout rows; each hideable:  tPast, lower, upper, factors, trueFuture, covered
//   monteCarlo: false    the Monte Carlo panel (true to show); inside: mcButton, mcCoverage, mcTally, mcBar
//   labels: {now, end, past, future, interval, tPast, lower, upper, factors, trueFuture, covered, yes, no,
//            f, c, mc, draw, coverage, tally, expected, reset}   (inline markdown/math ok)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return e;
};
const W = 480, X0 = 20, X1 = 460;
const clampN = (v, a, b) => Math.min(b, Math.max(a, v));
function mulberry(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// the factors of the interval for confidence c
export const gottLow = c => (1 - c) / (1 + c);
export const gottHigh = c => (1 + c) / (1 - c);
const num = x => (x >= 100 ? String(Math.round(x)) : String(+x.toPrecision(3)));
const pct = c => `${+(c * 100).toFixed(1)}%`;
function factor(x) {            // "1/39" when 1/x is near an integer, else a decimal
  if (x < 1) { const k = 1 / x; if (Math.abs(k - Math.round(k)) < 0.02) return `1/${Math.round(k)}`; }
  return String(+x.toPrecision(3));
}

export function gottInterval(el, cfg) {
  const L = { now: 'now', end: 'true end', past: 'elapsed', future: 'future', interval: 'interval', tPast: 'Elapsed time',
    lower: 'Future, at least', upper: 'Future, at most', factors: 'In multiples of the elapsed time', trueFuture: 'True future',
    covered: 'Interval covers the true future', yes: 'yes', no: 'no', f: 'Fraction elapsed', c: 'Confidence',
    mc: 'Random observation moments', draw: 'Draw', coverage: 'Share covered', tally: 'Covered', expected: 'Confidence', reset: 'Reset',
    ...(cfg.labels ?? {}) };
  const on = (k, d = true) => (cfg[k] === undefined ? d : cfg[k] !== false);
  const T = +(cfg.span ?? 100), unit = cfg.unit ? ` ${cfg.unit}` : '';
  const cMin = cfg.cMin ?? 0.5, cMax = cfg.cMax ?? 0.99;
  let f = clampN(+(cfg.f ?? 0.3), 0.01, 0.99), c = clampN(+(cfg.c ?? 0.95), 0.01, 0.995);
  const f0 = f, c0 = c;
  const xOf = t => X0 + (clampN(t, 0, T) / T) * (X1 - X0);

  // controls
  const ctl = h('div', { class: 'gi-ctl' });
  let fInp = null, cInp = null, fVal = null, cVal = null;
  if (on('fSlider')) {
    fInp = h('input', { type: 'range', min: 0.02, max: 0.98, step: 0.01, 'aria-label': 'fraction elapsed' });
    fInp.addEventListener('input', () => { f = +fInp.value; draw(); });
    fVal = h('span', { class: 'gi-val' });
    ctl.append(h('label', { class: 'gi-row' }, h('span', { class: 'gi-name', html: mdInline(L.f) }), fInp, fVal));
  }
  if (on('cSlider', false)) {
    cInp = h('input', { type: 'range', min: cMin, max: cMax, step: 0.005, 'aria-label': 'confidence' });
    cInp.addEventListener('input', () => { c = +cInp.value; draw(); });
    cVal = h('span', { class: 'gi-val' });
    ctl.append(h('label', { class: 'gi-row' }, h('span', { class: 'gi-name', html: mdInline(L.c) }), cInp, cVal));
  }

  // timeline
  const showTl = on('timeline');
  let svg = null, pastR, nowL, nowT, intR, intArrow, endL, endT, verT;
  if (showTl) {
    const showPast = on('past'), showNow = on('nowMarker'), showInt = on('interval'), showEnd = on('endMarker'), showTicks = on('ticks');
    const H = 96, AY = 60;
    svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'gi-svg', role: 'img', 'aria-label': 'Timeline with now marker and interval' });
    svg.append(sv('line', { x1: X0, x2: X1, y1: AY, y2: AY, class: 'gi-axis' }));
    if (showPast) { pastR = sv('rect', { x: X0, y: AY - 8, height: 16, rx: 2, class: 'gi-past' }); svg.append(pastR); }
    if (showInt) {
      intR = sv('rect', { y: AY - 8, height: 16, rx: 2, class: 'gi-int' });
      intArrow = sv('path', { class: 'gi-intarrow' });
      svg.append(intR, intArrow);
    }
    if (showTicks) {
      for (const [x, s] of [[X0, '0'], [X1, `${num(T)}${unit}`]]) {
        svg.append(sv('line', { x1: x, x2: x, y1: AY + 8, y2: AY + 14, class: 'gi-tick' }));
        svg.append(sv('text', { x, y: AY + 28, 'text-anchor': x === X0 ? 'start' : 'end', class: 'gi-tl' }, s));
      }
    }
    if (showEnd) {
      endL = sv('line', { x1: X1, x2: X1, y1: AY - 24, y2: AY + 8, class: 'gi-end' });
      endT = sv('text', { x: X1, y: AY - 29, 'text-anchor': 'end', class: 'gi-tl' }, L.end);
      svg.append(endL, endT);
      if (on('verdict')) { verT = sv('text', { x: X1, y: AY - 44, 'text-anchor': 'end', class: 'gi-verdict' }); svg.append(verT); }
    }
    if (showNow) {
      nowL = sv('line', { y1: AY - 24, y2: AY + 12, class: 'gi-now' });
      nowT = sv('text', { y: AY - 29, 'text-anchor': 'middle', class: 'gi-tl strong' }, L.now);
      svg.append(nowL, nowT);
      if (on('dragNow', true) || fInp) {
        svg.classList.add('drag');
        const move = ev => {
          const r = svg.getBoundingClientRect();
          const x = ((ev.clientX - r.left) / r.width) * W;
          f = clampN((x - X0) / (X1 - X0), 0.02, 0.98); draw();
        };
        svg.addEventListener('pointerdown', ev => { svg.setPointerCapture(ev.pointerId); move(ev); svg._d = true; });
        svg.addEventListener('pointermove', ev => { if (svg._d) move(ev); });
        const up = () => { svg._d = false; };
        svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
      }
    }
  }

  // readouts
  const rowDefs = [['tPast', L.tPast], ['lower', L.lower], ['upper', L.upper], ['factors', L.factors], ['trueFuture', L.trueFuture], ['covered', L.covered]];
  const rowEls = {};
  const out = h('div', { class: 'gi-out' });
  if (on('readouts')) for (const [k, lab] of rowDefs) {
    if (!on(k)) continue;
    rowEls[k] = h('span', { class: 'gi-ov' });
    out.append(h('div', { class: `gi-orow${k === 'covered' ? ' strong' : ''}` }, h('span', { html: mdInline(lab) }), rowEls[k]));
  }

  // Monte Carlo
  const showMc = on('monteCarlo', false);
  let mcBox = null, mcCov, mcTal, mcBarFill, mcBarMark, total = 0, hits = 0;
  const rnd = mulberry(cfg.seed ?? 7), N = Math.max(10, cfg.draws ?? 1000);
  if (showMc) {
    mcBox = h('div', { class: 'gi-mc' });
    if (on('mcButton')) {
      mcBox.append(h('div', { class: 'wbtns' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => {
          const lo = gottLow(c), hi = gottHigh(c);
          for (let i = 0; i < N; i++) { const u = rnd(); const r = (1 - u) / u; if (r >= lo && r <= hi) hits++; total++; }
          drawMc();
        } }, `${L.draw} ${N}`),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { total = 0; hits = 0; drawMc(); } }, L.reset)));
    }
    const rows = h('div', { class: 'gi-out' });
    if (on('mcCoverage')) { mcCov = h('span', { class: 'gi-ov' }); rows.append(h('div', { class: 'gi-orow strong' }, h('span', { html: mdInline(L.coverage) }), mcCov)); }
    if (on('mcTally')) { mcTal = h('span', { class: 'gi-ov' }); rows.append(h('div', { class: 'gi-orow' }, h('span', { html: mdInline(L.tally) }), mcTal)); }
    if (rows.children.length) mcBox.append(rows);
    if (on('mcBar')) {
      const b = sv('svg', { viewBox: `0 0 ${W} 40`, class: 'gi-svg', role: 'img', 'aria-label': 'Share covered against confidence' });
      b.append(sv('rect', { x: X0, y: 14, width: X1 - X0, height: 14, rx: 3, class: 'gi-barbg' }));
      mcBarFill = sv('rect', { x: X0, y: 14, height: 14, rx: 3, class: 'gi-barfill' });
      mcBarMark = sv('line', { y1: 8, y2: 34, class: 'gi-end' });
      b.append(mcBarFill, mcBarMark, sv('text', { x: X0, y: 38, class: 'gi-tl' }, '0%'), sv('text', { x: X1, y: 38, 'text-anchor': 'end', class: 'gi-tl' }, '100%'));
      mcBox.append(b);
    }
  }
  function drawMc() {
    if (!showMc) return;
    if (mcCov) mcCov.textContent = total ? pct(hits / total) : '–';
    if (mcTal) mcTal.textContent = `${hits} / ${total}`;
    if (mcBarFill) mcBarFill.setAttribute('width', Math.max(0, total ? (hits / total) * (X1 - X0) : 0));
    if (mcBarMark) { const x = X0 + c * (X1 - X0); mcBarMark.setAttribute('x1', x); mcBarMark.setAttribute('x2', x); }
  }

  if (ctl.children.length) el.append(ctl);
  if (svg) el.append(svg);
  if (out.children.length) el.append(out);
  if (mcBox) el.append(mcBox);

  function draw() {
    const tp = f * T, lo = gottLow(c), hi = gottHigh(c), future = T - tp;
    const covers = future >= tp * lo && future <= tp * hi;
    if (fInp) fInp.value = f;
    if (fVal) fVal.textContent = `${Math.round(f * 100)}%`;
    if (cInp) cInp.value = c;
    if (cVal) cVal.textContent = pct(c);
    if (svg) {
      const xn = xOf(tp);
      if (pastR) pastR.setAttribute('width', Math.max(0, xn - X0));
      if (nowL) { nowL.setAttribute('x1', xn); nowL.setAttribute('x2', xn); nowT.setAttribute('x', clampN(xn, 30, X1 - 30)); }
      if (intR) {
        const a = xOf(tp + tp * lo), bx = xOf(tp + tp * hi), clipped = tp + tp * hi > T;
        intR.setAttribute('x', a); intR.setAttribute('width', Math.max(1.5, bx - a));
        intR.setAttribute('class', `gi-int ${covers ? 'ok' : 'miss'}`);
        intArrow.setAttribute('d', clipped ? `M${X1 + 1} 52 L${X1 + 9} 60 L${X1 + 1} 68 Z` : '');
        intArrow.setAttribute('class', `gi-intarrow ${covers ? 'ok' : 'miss'}`);
      }
      if (endL) endL.setAttribute('class', `gi-end ${covers ? 'ok' : 'miss'}`);
      if (verT) { verT.textContent = covers ? `✓ ${L.yes}` : `✗ ${L.no}`; verT.setAttribute('class', `gi-verdict ${covers ? 'ok' : 'miss'}`); }
    }
    const set = (k, v) => { if (rowEls[k]) rowEls[k].textContent = v; };
    set('tPast', `${num(tp)}${unit}`);
    set('lower', `${num(tp * lo)}${unit}`);
    set('upper', `${num(tp * hi)}${unit}`);
    set('factors', `${factor(lo)} to ${factor(hi)}`);
    set('trueFuture', `${num(future)}${unit}`);
    set('covered', covers ? L.yes : L.no);
    if (rowEls.covered) rowEls.covered.className = `gi-ov ${covers ? 'ok' : 'miss'}`;
    drawMc();
  }
  draw();
}
