// scale-factor
//
// SCHEMATIC picture of the cosmic scale factor a(t) (a = 1 today, at t = 0) for a few ways the
// past could look. The curves are illustrative shapes, NOT solutions of Einstein's equations.
// A cursor on the curve (drag it, or arrow keys / Home / End when the plot is focused, or the
// slider) reads off a, the temperature T = T0 / a and the relative density rho / rho0 = a^-3
// (matter) or a^-4 (radiation).
// Models (time runs left to right, t in tRange):
//   bang      a -> 0 at a first moment t = bangTime (curve starts there)
//   bounce    a has a minimum aMin > 0 at t = bounceTime; the past continues beyond it
//   eternal   a -> 0 only asymptotically as t -> -infinity (a = exp(rate t)); no first moment
//   emergent  a -> emergentA > 0 as t -> -infinity (static-like past)
// Config (all wording from the config; every drawn element has a switch):
//   models: ['bang','bounce','eternal']   the selectable models, in order (also 'emergent')
//   model: 'bang'                         the model shown first
//   tRange: [-3, 1]  bangTime: -2.4  bounceTime: -1.8  aMin: 0.1  emergentA: 0.2  rate: 1
//   density: 'matter' | 'radiation'       rho ~ a^-3 or a^-4 (default matter)
//   T0: 2.725  tempUnit: 'K'              temperature today
//   breakdown: { a: 0.08 }                a below this: "equations break down" band (a-range)
//   unknown: { from, to }                 shaded vertical band of t (unknown physics); default none
//   show: { curve, cursor, today, axes, ticks, axisLabels, breakdown, unknown, ghosts,
//           selector, slider, guides, endMarks }   defaults: curve, cursor, today, axes, axisLabels,
//           selector, slider true; ticks, breakdown, unknown, ghosts, guides, endMarks false.
//           ghosts = the other models faintly; guides = dashed lines from cursor to the axes;
//           endMarks = open circle where a curve stops (bang) / "goes on" arrow (others)
//   cursor: t value at start (default 0)
//   readouts: ['a','T','rho']   rows in order ([] = none); also 't' and 'model'
//   labels: { t, a, today, breakdown, unknown, models:{bang,bounce,eternal,emergent},
//             rowA, rowT, rowRho, rowT0, rowModel, noStart, selector }
//   Reports nothing to the card.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const W = 480, H = 300, PX0 = 52, PX1 = 466, PY0 = 14, PY1 = 250;
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

export function scaleFactor(el, cfg) {
  const [t0, t1] = cfg.tRange ?? [-3, 1];
  const bangT = cfg.bangTime ?? t0 + 0.15 * (t1 - t0);
  const bounceT = cfg.bounceTime ?? t0 + 0.3 * (t1 - t0);
  const aMin = cfg.aMin ?? 0.1, aEm = cfg.emergentA ?? 0.2, rate = cfg.rate ?? 1;
  const models = (cfg.models ?? ['bang', 'bounce', 'eternal']).filter(m => ['bang', 'bounce', 'eternal', 'emergent'].includes(m));
  let model = models.includes(cfg.model) ? cfg.model : models[0];
  const exp = cfg.density === 'radiation' ? 4 : 3;
  const T0 = cfg.T0 ?? 2.725, tu = cfg.tempUnit ?? 'K';
  const sh = { curve: true, cursor: true, today: true, axes: true, axisLabels: true, selector: true, slider: true,
    ticks: false, breakdown: false, unknown: false, ghosts: false, guides: false, endMarks: false, ...(cfg.show ?? {}) };
  const L = { t: 'time', a: 'scale factor a', today: 'today', breakdown: 'equations break down', unknown: 'unknown physics',
    rowA: 'a', rowT: 'T', rowRho: exp === 3 ? 'ρ / ρ₀' : 'ρ / ρ₀', rowT0: 'T today', rowModel: 'model', rowTime: 'time',
    selector: 'Model', slider: 'time', ...(cfg.labels ?? {}), models: { bang: 'Big Bang', bounce: 'Bounce', eternal: 'Eternal past', emergent: 'Emergent', ...(cfg.labels?.models ?? {}) } };
  const rows = cfg.readouts ?? ['a', 'T', 'rho'];

  // a(t) for each model; null outside the model's domain
  const aOf = (m, t) => {
    if (m === 'bang') return t <= bangT ? null : Math.pow((t - bangT) / (0 - bangT), 0.62);
    if (m === 'bounce') { const u = Math.abs((t - bounceT) / (0 - bounceT)); return Math.sqrt(aMin * aMin + (1 - aMin * aMin) * (u * u)); }
    if (m === 'eternal') return Math.exp(rate * t);
    return aEm + (1 - aEm) * Math.exp(rate * t);
  };
  const lo = m => (m === 'bang' ? bangT + 0.004 * (t1 - t0) : t0);
  const aMax = Math.max(1.2, ...models.map(m => aOf(m, t1) ?? 0)) * 1.05;
  const xOf = t => PX0 + (t - t0) / (t1 - t0) * (PX1 - PX0);
  const yOf = a => PY1 - Math.min(a, aMax) / aMax * (PY1 - PY0);
  let t = Math.min(t1, Math.max(t0, cfg.cursor ?? 0));

  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sf-svg', role: 'img', tabindex: 0,
    'aria-label': 'Schematic scale factor against time. Arrow keys move the cursor.', style: 'touch-action: pan-y' });
  const gBg = sv('g'), gData = sv('g');
  svg.append(gBg, gData);
  const nice = (a, b) => { const r = b - a, p = Math.pow(10, Math.floor(Math.log10(r / 4))), m = r / 4 / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
  const ticks = (a, b) => { const st = nice(a, b), out = []; for (let v = Math.ceil(a / st - 1e-9) * st; v <= b + 1e-9; v += st) out.push(+v.toFixed(6)); return out; };
  if (sh.ticks) {
    for (const v of ticks(0, aMax)) { const x = sv('text', { x: PX0 - 6, y: yOf(v) + 4, class: 'sf-tl', 'text-anchor': 'end' }); x.textContent = v; gBg.append(x); }
    for (const v of ticks(t0, t1)) { const x = sv('text', { x: xOf(v), y: PY1 + 16, class: 'sf-tl', 'text-anchor': 'middle' }); x.textContent = v; gBg.append(x); }
  }
  if (sh.axes) gBg.append(sv('line', { x1: PX0, x2: PX0, y1: PY0, y2: PY1, class: 'sf-axis' }), sv('line', { x1: PX0, x2: PX1, y1: PY1, y2: PY1, class: 'sf-axis' }));
  if (sh.axisLabels) {
    const tx = sv('text', { x: (PX0 + PX1) / 2, y: H - 8, class: 'sf-al', 'text-anchor': 'middle' }); tx.textContent = L.t;
    const ty = sv('text', { x: 14, y: (PY0 + PY1) / 2, class: 'sf-al', 'text-anchor': 'middle', transform: `rotate(-90 14 ${(PY0 + PY1) / 2})` }); ty.textContent = L.a;
    gBg.append(tx, ty);
  }
  const txt = (x, y, s, cls, anchor = 'start') => { const e = sv('text', { x, y, class: cls, 'text-anchor': anchor }); e.textContent = s; return e; };
  if (sh.unknown && cfg.unknown) {
    const ua = cfg.unknown.from ?? t0, ub = cfg.unknown.to ?? bangT;
    const x1 = xOf(Math.max(t0, ua)), x2 = xOf(Math.min(t1, ub));
    if (x2 > x1) gBg.append(sv('rect', { x: x1, y: PY0, width: x2 - x1, height: PY1 - PY0, class: 'sf-unk' }), txt((x1 + x2) / 2, PY0 + 14, L.unknown, 'sf-bl', 'middle'));
  }
  if (sh.breakdown && cfg.breakdown) {
    const ya = yOf(cfg.breakdown.a ?? 0.08);
    gBg.append(sv('rect', { x: PX0, y: ya, width: PX1 - PX0, height: PY1 - ya, class: 'sf-brk' }), sv('line', { x1: PX0, x2: PX1, y1: ya, y2: ya, class: 'sf-brkline' }),
      txt(PX1 - 4, ya - 5, L.breakdown, 'sf-bl', 'end'));
  }
  if (sh.today) {
    gBg.append(sv('line', { x1: xOf(0), x2: xOf(0), y1: PY0, y2: PY1, class: 'sf-today' }), sv('circle', { cx: xOf(0), cy: yOf(1), r: 4, class: 'sf-todaydot' }),
      txt(xOf(0) - 6, PY0 + 12, L.today, 'sf-bl', 'end'));
  }

  const path = m => {
    let d = '', pen = false;
    for (let i = 0; i <= 200; i++) {
      const tt = lo(m) + (t1 - lo(m)) * i / 200, a = aOf(m, tt);
      if (a == null) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${xOf(tt).toFixed(1)} ${yOf(a).toFixed(1)}`; pen = true;
    }
    return d;
  };

  const rd = h('div', { class: 'readout sf-read', role: 'status' });
  const sel = (sh.selector && models.length > 1)
    ? h('div', { class: 'wbtns sf-sel', role: 'group', 'aria-label': L.selector }, ...models.map(m => h('button', { class: 'btn ghost', type: 'button', 'data-model': m, onclick: () => { model = m; clampT(); draw(); } }, mdInline(L.models[m]))))
    : null;
  const inp = h('input', { type: 'range', min: t0, max: t1, step: (t1 - t0) / 400, 'aria-label': L.slider });
  inp.addEventListener('input', () => { t = +inp.value; clampT(); draw(); });
  const slide = (sh.slider && sh.cursor) ? h('label', { class: 'sf-slide' }, h('span', { class: 'sf-sl' }, mdInline(L.slider)), inp) : null;
  el.classList.add('sf');
  el.append(...(sel ? [sel] : []), svg, rd, ...(slide ? [slide] : []));

  function clampT() { t = Math.min(t1, Math.max(lo(model), t)); }
  const fromEvent = ev => { const r = svg.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width * W; return t0 + (x - PX0) / (PX1 - PX0) * (t1 - t0); };
  let drag = false;
  if (sh.cursor) {
    svg.addEventListener('pointerdown', ev => { drag = true; svg.setPointerCapture?.(ev.pointerId); t = fromEvent(ev); clampT(); draw(); });
    svg.addEventListener('pointermove', ev => { if (drag) { t = fromEvent(ev); clampT(); draw(); } });
    const up = () => { drag = false; };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    svg.addEventListener('keydown', ev => {
      const st = (t1 - t0) / 100 * (ev.shiftKey ? 5 : 1);
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') t += st;
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') t -= st;
      else if (ev.key === 'Home') t = t0;
      else if (ev.key === 'End') t = t1;
      else return;
      ev.preventDefault(); clampT(); draw();
    });
  }

  const sci = v => {
    if (!isFinite(v)) return '∞';
    if (v >= 0.01 && v < 10000) return v.toPrecision(3).replace(/\.?0+$/, m => (m.includes('.') ? '' : m)).replace(/(\.\d*?)0+$/, '$1');
    const e = Math.floor(Math.log10(v)), mant = v / Math.pow(10, e);
    return `${mant.toFixed(2)}×10${String(e).split('').map(c => SUP[c]).join('')}`;
  };

  function draw() {
    gData.replaceChildren();
    if (sh.curve) {
      if (sh.ghosts) for (const m of models) if (m !== model) gData.append(sv('path', { d: path(m), class: 'sf-ghost', fill: 'none' }));
      gData.append(sv('path', { d: path(model), class: 'sf-curve', fill: 'none' }));
      if (sh.endMarks) {
        if (model === 'bang') gData.append(sv('circle', { cx: xOf(bangT), cy: yOf(0), r: 4.5, class: 'sf-open' }));
        else gData.append(txt(PX0 + 4, yOf(aOf(model, t0)) - 6, '◂', 'sf-bl'));
      }
    }
    const a = aOf(model, t);
    if (sh.cursor) {
      const mx = xOf(t), my = yOf(a);
      if (sh.guides) gData.append(sv('line', { x1: mx, y1: my, x2: mx, y2: PY1, class: 'sf-guide' }), sv('line', { x1: mx, y1: my, x2: PX0, y2: my, class: 'sf-guide' }));
      gData.append(sv('circle', { cx: mx, cy: my, r: 6.5, class: 'sf-dot' }));
    }
    const get = {
      a: [L.rowA, sci(a)], T: [L.rowT, `${sci(T0 / a)} ${tu}`.trim()], rho: [L.rowRho, sci(Math.pow(a, -exp))],
      t: [L.rowTime, t.toFixed(2)], model: [L.rowModel, L.models[model]],
    };
    const cells = [];
    for (const k of rows) {
      const g = get[k]; if (!g) continue;
      cells.push(h('div', { class: 'sf-cell' }, h('span', { class: 'sf-lab' }, mdInline(g[0])), ': ', h('b', {}, g[1])));
    }
    rd.replaceChildren(...cells);
    rd.style.display = cells.length ? '' : 'none';
    inp.min = lo(model); inp.value = t;
    if (sel) for (const b of sel.children) b.classList.toggle('on', b.dataset.model === model);
    svg.setAttribute('aria-valuetext', `a = ${sci(a)}`);
  }
  draw();
}
