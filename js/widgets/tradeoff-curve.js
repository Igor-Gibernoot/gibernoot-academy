// tradeoff-curve
//
// One slider moves a design along a tradeoff between two quantities X (horizontal) and Y
// (vertical). The plot shows the curve of achievable pairs, a marker for the current design
// and, optionally, a "needs" region (requirements) so the reader sees whether a design exists.
// Each quantity is a function of the design parameter s:  q(s) = a * s^k + b  (a, k, b in config)
//   linear    k = 1                 e.g. weight = 2 s + 1
//   power     k = 2, 0.5, 3 ...     e.g. strength = 40 s^2
//   inverse   k = -1 (b = 0)        e.g. pulling force = 100 / s
// Config (all wording from the config; every drawn element has a switch):
//   param: { label, unit, range: [s0, s1], value, step, decimals }   the slider (design parameter)
//   x: { a, k, b, label, unit, range: [lo, hi], decimals }           horizontal quantity (same for y)
//   y: { ... }
//   needs: { xMin, xMax, yMin, yMax }   any subset; the requirement region is the rectangle they cut
//   show: { curve, marker, guides, needs, feasible, grid, ticks, axisLabels }   each default true
//        except feasible (green part of the curve that meets all needs) and guides (dashed lines
//        from the marker to the axes), both default false; ticks = tick numbers on the axes;
//        axisLabels = the x and y names with units
//   slider: true            the design slider (false: the design stays at param.value)
//   readouts: ['design','x','y','verdict']   rows in order ([] = none); also 'range' (the design
//        values that meet every need, or "none"); default ['x','y']
//   labels: { meets, misses, none, range, design, tooShortX, tooLongX, tooShortY, tooLongY }
//        verdict wording; tooShortX etc. name what fails ("{x} too low")
//   presets: [{ label, value }]   buttons that jump the slider to a design value
//   Reports nothing to the card.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const W = 480, H = 300, PX0 = 52, PX1 = 466, PY0 = 12, PY1 = 250;

export function tradeoffCurve(el, cfg) {
  const P = { label: 'Design', unit: '', range: [1, 10], step: 0.1, decimals: 1, ...(cfg.param ?? {}) };
  const Q = (c) => ({ a: 1, k: 1, b: 0, label: '', unit: '', decimals: 1, ...c });
  const X = Q(cfg.x ?? {}), Y = Q(cfg.y ?? {});
  const [s0, s1] = P.range;
  const val = (q, s) => q.a * Math.pow(s, q.k) + q.b;
  // axis ranges default to the extent of the curve, padded
  const ext = q => { let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 100; i++) { const v = val(q, s0 + (s1 - s0) * i / 100); lo = Math.min(lo, v); hi = Math.max(hi, v); } return [Math.min(0, lo), hi * 1.08]; };
  const xr = X.range ?? ext(X), yr = Y.range ?? ext(Y);
  const needs = cfg.needs ?? {};
  const sh = { curve: true, marker: true, needs: true, grid: true, ticks: true, axisLabels: true, feasible: false, guides: false, ...(cfg.show ?? {}) };
  const L = { meets: 'Meets every need', misses: 'Misses', none: 'none', range: 'Designs that work', design: P.label,
    tooShortX: `${X.label} too low`, tooLongX: `${X.label} too high`, tooShortY: `${Y.label} too low`, tooLongY: `${Y.label} too high`, ...(cfg.labels ?? {}) };
  const rows = cfg.readouts ?? ['x', 'y'];
  let s = Math.min(s1, Math.max(s0, P.value ?? (s0 + s1) / 2));

  const xOf = v => PX0 + (v - xr[0]) / (xr[1] - xr[0]) * (PX1 - PX0);
  const yOf = v => PY1 - (v - yr[0]) / (yr[1] - yr[0]) * (PY1 - PY0);
  const cx = v => Math.min(xr[1], Math.max(xr[0], v)), cy = v => Math.min(yr[1], Math.max(yr[0], v));
  const f = (v, d) => v.toFixed(d);
  const fmt = (q, v) => `${f(v, q.decimals)} ${q.unit}`.trim();
  const fails = (xv, yv) => {
    const out = [];
    if (needs.xMin != null && xv < needs.xMin) out.push(L.tooShortX);
    if (needs.xMax != null && xv > needs.xMax) out.push(L.tooLongX);
    if (needs.yMin != null && yv < needs.yMin) out.push(L.tooShortY);
    if (needs.yMax != null && yv > needs.yMax) out.push(L.tooLongY);
    return out;
  };
  const ok = t => { const m = fails(val(X, t), val(Y, t)); return m.length === 0; };
  const workRange = () => {
    const N = 400, good = []; for (let i = 0; i <= N; i++) { const t = s0 + (s1 - s0) * i / N; if (ok(t)) good.push(t); }
    if (!good.length) return L.none;
    const d = P.decimals, a = good[0], b = good[good.length - 1];
    return `${f(a, d)} to ${f(b, d)} ${P.unit}`.trim();
  };

  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'tc-svg', role: 'img', 'aria-label': 'Tradeoff between two quantities' });
  const gBg = sv('g'), gData = sv('g');
  svg.append(gBg, gData);
  const nice = (lo, hi) => { const r = hi - lo, p = Math.pow(10, Math.floor(Math.log10(r / 4))); const m = r / 4 / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
  const ticks = (lo, hi) => { const st = nice(lo, hi), out = []; for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) out.push(+v.toFixed(6)); return out; };
  if (sh.grid || sh.ticks) {
    for (const v of ticks(...yr)) {
      if (sh.grid) gBg.append(sv('line', { x1: PX0, x2: PX1, y1: yOf(v), y2: yOf(v), class: 'tc-grid' }));
      if (sh.ticks) { const t = sv('text', { x: PX0 - 6, y: yOf(v) + 4, class: 'tc-tl', 'text-anchor': 'end' }); t.textContent = v; gBg.append(t); }
    }
    for (const v of ticks(...xr)) {
      if (sh.grid) gBg.append(sv('line', { x1: xOf(v), x2: xOf(v), y1: PY0, y2: PY1, class: 'tc-grid' }));
      if (sh.ticks) { const t = sv('text', { x: xOf(v), y: PY1 + 16, class: 'tc-tl', 'text-anchor': 'middle' }); t.textContent = v; gBg.append(t); }
    }
  }
  gBg.append(sv('line', { x1: PX0, x2: PX0, y1: PY0, y2: PY1, class: 'tc-axis' }), sv('line', { x1: PX0, x2: PX1, y1: PY1, y2: PY1, class: 'tc-axis' }));
  if (sh.axisLabels) {
    const tx = sv('text', { x: (PX0 + PX1) / 2, y: H - 8, class: 'tc-al', 'text-anchor': 'middle' }); tx.textContent = `${X.label}${X.unit ? ` (${X.unit})` : ''}`;
    const ty = sv('text', { x: 14, y: (PY0 + PY1) / 2, class: 'tc-al', 'text-anchor': 'middle', transform: `rotate(-90 14 ${(PY0 + PY1) / 2})` }); ty.textContent = `${Y.label}${Y.unit ? ` (${Y.unit})` : ''}`;
    gBg.append(tx, ty);
  }

  const rd = h('div', { class: 'readout tc-read', role: 'status' });
  const inp = h('input', { type: 'range', min: s0, max: s1, step: P.step, 'aria-label': P.label });
  const sval = h('span', { class: 'tc-sv' });
  inp.addEventListener('input', () => { s = +inp.value; draw(); });
  const slide = cfg.slider === false ? null : h('label', { class: 'tc-slide' }, h('span', { class: 'tc-sl' }, mdInline(P.label)), inp, sval);
  const btns = (cfg.presets ?? []).length ? h('div', { class: 'wbtns' }, ...cfg.presets.map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => { s = Math.min(s1, Math.max(s0, pr.value)); draw(); } }, mdInline(pr.label)))) : null;
  el.classList.add('tc');
  el.append(svg, rd, ...(slide ? [slide] : []), ...(btns ? [btns] : []));

  function draw() {
    gData.replaceChildren();
    const xv = val(X, s), yv = val(Y, s);
    if (sh.needs && ['xMin', 'xMax', 'yMin', 'yMax'].some(k => needs[k] != null)) {
      const xa = needs.xMin ?? xr[0], xb = needs.xMax ?? xr[1], ya = needs.yMin ?? yr[0], yb = needs.yMax ?? yr[1];
      const x1 = xOf(cx(xa)), x2 = xOf(cx(xb)), y1 = yOf(cy(yb)), y2 = yOf(cy(ya));
      if (x2 > x1 && y2 > y1) gData.append(sv('rect', { x: x1, y: y1, width: x2 - x1, height: y2 - y1, class: 'tc-need' }));
      const edge = (a, b, c, d) => gData.append(sv('line', { x1: a, y1: b, x2: c, y2: d, class: 'tc-needline' }));
      if (needs.xMin != null) edge(xOf(cx(needs.xMin)), PY0, xOf(cx(needs.xMin)), PY1);
      if (needs.xMax != null) edge(xOf(cx(needs.xMax)), PY0, xOf(cx(needs.xMax)), PY1);
      if (needs.yMin != null) edge(PX0, yOf(cy(needs.yMin)), PX1, yOf(cy(needs.yMin)));
      if (needs.yMax != null) edge(PX0, yOf(cy(needs.yMax)), PX1, yOf(cy(needs.yMax)));
    }
    if (sh.curve) {
      const N = 160, seg = (pred, cls) => {
        let d = '', pen = false;
        for (let i = 0; i <= N; i++) {
          const t = s0 + (s1 - s0) * i / N;
          if (!pred(t)) { pen = false; continue; }
          d += `${pen ? 'L' : 'M'}${xOf(cx(val(X, t))).toFixed(1)} ${yOf(cy(val(Y, t))).toFixed(1)}`; pen = true;
        }
        if (d) gData.append(sv('path', { d, class: cls, fill: 'none' }));
      };
      seg(() => true, 'tc-curve');
      if (sh.feasible) seg(ok, 'tc-good');
    }
    if (sh.marker) {
      const mx = xOf(cx(xv)), my = yOf(cy(yv));
      if (sh.guides) {
        gData.append(sv('line', { x1: mx, y1: my, x2: mx, y2: PY1, class: 'tc-guide' }), sv('line', { x1: mx, y1: my, x2: PX0, y2: my, class: 'tc-guide' }));
      }
      gData.append(sv('circle', { cx: mx, cy: my, r: 6, class: `tc-dot${fails(xv, yv).length ? '' : ' tc-dotok'}` }));
    }
    const cells = [], d = P.decimals;
    const get = {
      design: [L.design, `${f(s, d)} ${P.unit}`.trim()], x: [X.label, fmt(X, xv)], y: [Y.label, fmt(Y, yv)],
      range: [L.range, workRange()],
      verdict: ['', (() => { const m = fails(xv, yv); return m.length ? `${L.misses}: ${m.join(', ')}` : L.meets; })()],
    };
    for (const k of rows) {
      const g = get[k]; if (!g) continue;
      const c = h('div', { class: 'tc-cell' });
      if (k === 'verdict') c.append(h('b', { class: fails(xv, yv).length ? 'tc-bad' : 'tc-ok' }, g[1]));
      else c.append(h('span', { class: 'tc-lab' }, mdInline(g[0])), ': ', h('b', {}, g[1]));
      cells.push(c);
    }
    rd.replaceChildren(...cells);
    rd.style.display = cells.length ? '' : 'none';
    inp.value = s; sval.textContent = `${f(s, d)} ${P.unit}`.trim();
  }
  draw();
}
