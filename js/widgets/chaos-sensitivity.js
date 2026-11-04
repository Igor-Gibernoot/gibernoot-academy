// chaos-sensitivity
//
// Two nearby starting states under the same deterministic map, iterated N steps. Top plot: the
// two time series (state a in blue, state b in orange). Bottom plot: the gap |x_a - x_b| on a
// log scale against the step, with an optional threshold line. Sliders: start gap (log, down to
// 1e-12) and r (logistic map x -> r x (1-x)). Readout: the first step at which the gap exceeds the
// threshold. All arithmetic is IEEE double precision (about 16 digits), so a gap below ~1e-16
// cannot be represented; the doubling map x -> 2x mod 1 loses its last bit each step and falls
// to 0 after ~53 steps, an artefact of the computer, not of the map. Plain SVG + HTML; display
// only (reports nothing to the card).
//
//   map: "logistic"          "logistic" (x -> r x (1-x)) or "doubling" (x -> 2x mod 1, no r)
//   r: 3.9, rMin: 2.5, rMax: 4, rStep: 0.01     start r and slider range
//   x0: 0.2                  start state of a;  b starts at x0 + gap
//   gap: 1.0e-6              start gap (YAML numbers keep a dot);  gapMin: -12, gapMax: -1 (exponents of 10)
//   steps: 60                number of iterations N
//   threshold: 0.1           gap that counts as "diverged"
//   series: true             the two time series plot      gapPlot: true   the log-gap plot
//   thresholdLine: true      dashed threshold line in the gap plot
//   axisLabels: true         tick numbers and axis captions     legend: true   names of a and b
//   rSlider, gapSlider: true show each slider (a hidden one keeps its start value)
//   readout: true            or {first, final, gap, r} each true/false
//   reset: true              the Reset button
//   labels: {r, gap, series, gapPlot, a, b, threshold, step, first, final, gapRead, rRead, never, reset}
//   presets: [{label, r, gap, x0}]   buttons (omitted fields keep the current value)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return e;
};
const W = 480, X0 = 40, X1 = 468, PH = 130, FLOOR = -16;
const clampN = (v, a, b) => Math.min(b, Math.max(a, v));

function sci(t) {
  let e = Math.floor(t + 1e-9), m = 10 ** (t - e);
  if (+m.toFixed(1) >= 10) { m /= 10; e += 1; }
  const ms = m.toFixed(1);
  return [ms === '1.0' ? '10' : `${ms} × 10`, h('sup', {}, String(e))];
}
const sciNum = x => (x > 0 ? sci(Math.log10(x)) : ['0']);

export function chaosSensitivity(el, cfg) {
  const L = { r: 'r', gap: 'Start gap', series: 'State x', gapPlot: 'Gap |a − b|', a: 'a', b: 'b', threshold: 'threshold',
    step: 'step', first: 'Gap first exceeds the threshold at step', final: 'Gap at the last step', gapRead: 'Start gap',
    rRead: 'r', never: 'not within the steps shown', reset: 'Reset', ...(cfg.labels ?? {}) };
  const on = (k, d = true) => cfg[k] !== false && d;
  const dbl = cfg.map === 'doubling';
  const N = Math.max(5, Math.round(cfg.steps ?? 60)), thr = cfg.threshold ?? 0.1;
  const rMin = cfg.rMin ?? 2.5, rMax = cfg.rMax ?? 4, gMin = cfg.gapMin ?? -12, gMax = cfg.gapMax ?? -1;
  const ro = typeof cfg.readout === 'object' ? cfg.readout : (cfg.readout === false ? {} : { first: true, final: true, gap: true, r: true });
  const init = () => ({ r: clampN(cfg.r ?? 3.9, rMin, rMax), g: clampN(Math.log10(cfg.gap ?? 1e-6), gMin, gMax), x0: cfg.x0 ?? 0.2 });
  let st = init();
  const f = (x, r) => (dbl ? (2 * x) % 1 : r * x * (1 - x));

  const run = () => {
    const gap = 10 ** st.g, A = [st.x0], B = [st.x0 + gap];
    for (let i = 0; i < N; i++) { A.push(f(A[i], st.r)); B.push(f(B[i], st.r)); }
    const G = A.map((a, i) => Math.abs(a - B[i]));
    return { A, B, G, first: G.findIndex(g => g > thr) };
  };

  const rows = [];
  const slider = (key, title, min, max, step, fmt) => {
    const inp = h('input', { type: 'range', min, max, step, 'aria-label': title });
    const val = h('span', { class: 'cs-val' });
    inp.addEventListener('input', () => { st[key] = +inp.value; draw(); });
    rows.push({ inp, val, key, fmt });
    return h('label', { class: 'cs-row' }, h('span', { class: 'cs-name' }, mdInline(title)), inp, val);
  };
  const ctl = h('div', { class: 'cs-ctl' });
  if (on('rSlider') && !dbl) ctl.append(slider('r', L.r, rMin, rMax, cfg.rStep ?? 0.01, v => [v.toFixed(2)]));
  if (on('gapSlider')) ctl.append(slider('g', L.gap, gMin, gMax, 0.05, v => sci(v)));

  const xOf = i => X0 + (i / N) * (X1 - X0);
  const axLab = on('axisLabels');
  const plot = (title, yOf, ticks, withThr) => {
    const H = PH + (axLab ? 40 : 12);
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cs-svg', role: 'img', 'aria-label': title });
    svg.append(sv('rect', { x: X0, y: 6, width: X1 - X0, height: PH, class: 'cs-frame' }));
    for (const [v, lab] of ticks) {
      svg.append(sv('line', { x1: X0, x2: X1, y1: yOf(v), y2: yOf(v), class: 'cs-grid' }));
      if (axLab) svg.append(sv('text', { x: X0 - 5, y: yOf(v) + 4, 'text-anchor': 'end', class: 'cs-tl' }, lab));
    }
    if (axLab) {
      for (let i = 0; i <= N; i += N >= 60 ? 20 : 10 * Math.ceil(N / 40)) svg.append(sv('text', { x: xOf(i), y: PH + 20, 'text-anchor': 'middle', class: 'cs-tl' }, String(i)));
      svg.append(sv('text', { x: X1, y: PH + 33, 'text-anchor': 'end', class: 'cs-tl' }, L.step));
    }
    const thrLine = withThr ? sv('line', { x1: X0, x2: X1, y1: yOf(Math.log10(thr)), y2: yOf(Math.log10(thr)), class: 'cs-thr' }) : null;
    if (thrLine) svg.append(thrLine);
    return { svg, thrLine };
  };
  const yS = v => 6 + (1 - v) * PH;
  const yG = t => 6 + (clampN(t, FLOOR, 0) / FLOOR) * PH;
  const P = {}, lines = {};
  const wrap = [];
  if (on('series')) {
    const s = plot(L.series, yS, [[0, '0'], [0.5, '0.5'], [1, '1']], false);
    lines.a = sv('polyline', { class: 'cs-a', fill: 'none' }); lines.b = sv('polyline', { class: 'cs-b', fill: 'none' });
    s.svg.append(lines.a, lines.b);
    wrap.push(h('div', { class: 'cs-cap' }, mdInline(L.series)), s.svg);
  }
  if (on('gapPlot')) {
    const g = plot(L.gapPlot, yG, [0, -4, -8, -12, -16].map(t => [t, ['10', sv('tspan', { dy: -4, 'font-size': 9 }, String(t))]]), on('thresholdLine'));
    lines.g = sv('polyline', { class: 'cs-g', fill: 'none' });
    lines.m = sv('circle', { r: 4.5, class: 'cs-mark' });
    g.svg.append(lines.g, lines.m);
    wrap.push(h('div', { class: 'cs-cap' }, mdInline(L.gapPlot)), g.svg);
  }
  if (on('legend') && on('series')) {
    wrap.unshift(h('div', { class: 'cs-leg' }, h('span', { class: 'cs-key a' }, mdInline(L.a)), h('span', { class: 'cs-key b' }, mdInline(L.b)),
      on('thresholdLine') && on('gapPlot') ? h('span', { class: 'cs-key t' }, mdInline(`${L.threshold} ${thr}`)) : ''));
  }

  const out = h('div', { class: 'cs-out' }), ov = {};
  for (const [k, lab] of [['first', L.first], ['final', L.final], ['gap', L.gapRead], ['r', L.rRead]]) {
    if (!ro[k] || (k === 'r' && dbl)) continue;
    ov[k] = h('span', { class: 'cs-ov' });
    out.append(h('div', { class: `cs-orow ${k === 'first' ? 'strong' : ''}` }, h('span', {}, mdInline(lab)), ov[k]));
  }
  const btns = h('div', { class: 'wbtns' },
    ...(cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      if (pr.r != null) st.r = clampN(pr.r, rMin, rMax);
      if (pr.gap != null) st.g = clampN(Math.log10(pr.gap), gMin, gMax);
      if (pr.x0 != null) st.x0 = pr.x0;
      draw(); } }, mdInline(pr.label))),
    on('reset') ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, mdInline(L.reset)) : '');
  el.append(ctl, ...wrap);
  if (out.children.length) el.append(out);
  if (btns.children.length) el.append(btns);

  function draw() {
    const d = run();
    for (const r of rows) { r.inp.value = st[r.key]; r.val.replaceChildren(...r.fmt(+r.inp.value)); }
    const pts = arr => arr.map((v, i) => `${xOf(i).toFixed(1)},${yS(clampN(v, 0, 1)).toFixed(1)}`).join(' ');
    if (lines.a) { lines.a.setAttribute('points', pts(d.A)); lines.b.setAttribute('points', pts(d.B)); }
    if (lines.g) {
      lines.g.setAttribute('points', d.G.map((v, i) => `${xOf(i).toFixed(1)},${yG(v > 0 ? Math.log10(v) : FLOOR).toFixed(1)}`).join(' '));
      if (d.first >= 0) { lines.m.setAttribute('cx', xOf(d.first)); lines.m.setAttribute('cy', yG(Math.log10(d.G[d.first]))); lines.m.style.display = ''; }
      else lines.m.style.display = 'none';
    }
    ov.first?.replaceChildren(d.first >= 0 ? String(d.first) : L.never);
    ov.final?.replaceChildren(...sciNum(d.G[N]));
    ov.gap?.replaceChildren(...sci(st.g));
    ov.r?.replaceChildren(st.r.toFixed(2));
  }
  draw();
}
