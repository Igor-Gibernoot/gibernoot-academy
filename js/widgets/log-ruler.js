// log-ruler
//
// A horizontal axis with one tick per power of ten (a logarithmic ruler). Items sit at
// their positions; items the reader must guess are placed by dragging. Plain SVG + HTML,
// all wording from the config. The widget only displays and probes: it reports nothing to
// the card (ask the graded question in a separate numeric/mcq card).
//
//   min, max: -10, 7           exponent range (ticks at 10^min ... 10^max)
//   unit: "m"                  unit label (axis end and readouts); '' = none
//   items: [{label, value, fixed}]   value = the true number in the unit (write 1.0e-10 or
//             "1e-10" in YAML); fixed: true (default) = drawn at its true place;
//             fixed: false = guessed: one chip per item, select it, then drag on the axis
//             (or use the slider / arrow keys). No guessable item = one free "my guess" marker.
//   reveal: false              true = every item drawn at its true place from the start
//                              (guess markers still work); false = guessable items are hidden
//                              until Check (Check shows the truth and the error in orders)
//   ticks: true, tickLabels: true   tick marks / their 10^n labels (labels thin out to fit)
//   readout: true              value of the current marker + nearest power of ten (+ results)
//   decadeCount: false         a bracket "x10 per step" under two neighbouring ticks
//   slider: true               a range input under the axis (keyboard / touch friendly)
//   snap: false                true = markers snap to whole powers of ten (step 1)
//   start: null                exponent where a free marker starts (default: middle, placed)
//   labels: { guess, check, reset, pick, nearest, notPlaced, truth, error, perStep, orders }
//
// Examples (YAML values must keep a dot: 1.0e-10):
//   {min: -10, max: 7, unit: m, reveal: false, items: [{label: atom, value: 1.0e-10, fixed: false}, ...]}

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return e;
};
const W = 480, H = 236, X0 = 24, X1 = 430, AX = 112;

// number as "m x 10^e" (nodes); 10^e when the mantissa is 1.0
function sci(x) {
  let e = Math.floor(Math.log10(x) + 1e-12), m = x / 10 ** e;
  if (+m.toFixed(1) >= 10) { m /= 10; e += 1; }
  const ms = m.toFixed(1);
  return [ms === '1.0' ? '10' : `${ms} × 10`, h('sup', {}, String(e))];
}
const num = v => (typeof v === 'string' ? Number(v) : v);

export function logRuler(el, cfg) {
  const lo = cfg.min ?? -10, hi = cfg.max ?? 7, unit = cfg.unit ?? '';
  const L = { guess: 'My guess', check: 'Check', reset: 'Reset', pick: 'Item to place', nearest: 'Nearest power of ten',
    notPlaced: 'Not placed yet: drag on the axis', truth: 'true value', error: 'off by', perStep: '× 10', orders: 'orders of magnitude',
    ...(cfg.labels ?? {}) };
  const showTicks = cfg.ticks !== false, showTL = cfg.tickLabels !== false, showRead = cfg.readout !== false;
  const items = (cfg.items ?? []).map(it => ({ label: it.label, value: num(it.value), fixed: it.fixed !== false }));
  const reveal = cfg.reveal === true;
  const guessed = items.filter(i => !i.fixed);
  const free = guessed.length === 0;
  const step = cfg.snap ? 1 : 0.05;
  const span = hi - lo;
  const xOf = e => X0 + ((e - lo) / span) * (X1 - X0);
  const eOf = x => Math.min(hi, Math.max(lo, lo + ((x - X0) / (X1 - X0)) * span));
  const lg = v => Math.log10(v);

  // guess state: one entry per guessable item (or one free marker)
  const marks = free ? [{ label: L.guess, e: null }] : guessed.map(i => ({ item: i, label: i.label, e: null }));
  if (free && cfg.start != null) marks[0].e = cfg.start;
  let cur = 0, checked = false;
  const snapE = e => (cfg.snap ? Math.round(e) : Math.round(e / step) * step);

  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lr-svg', role: 'img', 'aria-label': 'Logarithmic ruler' });
  const gStatic = sv('g'), gItems = sv('g'), gGuess = sv('g');
  svg.append(gStatic, gItems, gGuess);

  // static axis (independent of the data)
  gStatic.append(sv('line', { x1: X0, x2: X1, y1: AX, y2: AX, class: 'lr-axis' }));
  const every = Math.max(1, Math.ceil(44 / ((X1 - X0) / span)));
  for (let e = lo; e <= hi; e++) {
    const x = xOf(e);
    if (showTicks) gStatic.append(sv('line', { x1: x, x2: x, y1: AX - 5, y2: AX + 5, class: 'lr-tick' }));
    if (showTL && (e - lo) % every === 0) gStatic.append(sv('text', { x, y: AX + 36, class: 'lr-tl', 'text-anchor': 'middle' }, '10', sv('tspan', { dy: -5, 'font-size': 10 }, e), sv('tspan', { dy: 5 }, '')));
  }
  if (unit) gStatic.append(sv('text', { x: X1 + 10, y: AX + 4, class: 'lr-unit', 'text-anchor': 'start' }, `(${unit})`));
  if (cfg.decadeCount) {
    const a = xOf(lo + Math.floor(span / 2)), b = xOf(lo + Math.floor(span / 2) + 1), y = H - 16;
    gStatic.append(sv('path', { d: `M${a} ${y - 6} V${y} H${b} V${y - 6}`, class: 'lr-brace', fill: 'none' }),
      sv('text', { x: (a + b) / 2, y: y + 13, class: 'lr-tl', 'text-anchor': 'middle' }, L.perStep));
  }

  const labelAt = (x, y, text, cls) => {
    const w = text.length * 6.6, anchor = x - w / 2 < 2 ? 'start' : x + w / 2 > W - 2 ? 'end' : 'middle';
    return sv('text', { x: anchor === 'start' ? Math.max(x - 4, 2) : anchor === 'end' ? Math.min(x + 4, W - 2) : x, y, class: cls, 'text-anchor': anchor }, text);
  };
  const lanes = [20, 42, 64, 86].slice(0, 4);
  function drawItems() {
    gItems.replaceChildren();
    let k = 0;
    const put = (it, cls) => {
      const x = xOf(Math.min(hi, Math.max(lo, lg(it.value)))), y = lanes[k++ % 4];
      gItems.append(sv('line', { x1: x, x2: x, y1: y + 4, y2: AX, class: `lr-lead ${cls}` }), sv('circle', { cx: x, cy: AX, r: 5, class: `lr-dot ${cls}` }), labelAt(x, y, it.label, `lr-lab ${cls}`));
    };
    for (const it of items) if (it.fixed) put(it, 'fixed');
    for (const it of guessed) if (reveal || checked) put(it, 'truth');
  }
  function drawGuess() {
    gGuess.replaceChildren();
    marks.forEach((m, i) => {
      if (m.e == null) return;
      const x = xOf(m.e), sel = i === cur && !checked, y = 166 + (i % 2) * 18;
      if (checked && m.item) gGuess.append(sv('line', { x1: x, x2: xOf(Math.min(hi, Math.max(lo, lg(m.item.value)))), y1: AX, y2: AX, class: 'lr-gap' }));
      gGuess.append(sv('path', { d: `M${x} ${AX + 3} l-8 14 h16 z`, class: `lr-tri${sel ? ' sel' : ''}` }));
      if (!free || cfg.showGuessLabel !== false) gGuess.append(labelAt(x, y + 24, m.label, `lr-lab guess${sel ? ' sel' : ''}`));
    });
  }

  const chips = free ? null : h('div', { class: 'lr-chips', role: 'group', 'aria-label': L.pick },
    marks.map((m, i) => h('button', { type: 'button', class: 'lr-chip', onclick: () => { if (checked) return; cur = i; draw(); } }, mdInline(m.label))));
  const slider = cfg.slider === false ? null : h('input', { type: 'range', class: 'lr-slider', min: lo, max: hi, step, value: (lo + hi) / 2, 'aria-label': L.guess });
  const read = showRead ? h('div', { class: 'readout lr-read', role: 'status' }) : null;
  const btnCheck = free || reveal ? null : h('button', { class: 'btn ghost', type: 'button', onclick: () => { checked = true; draw(); } }, mdInline(L.check));
  const btnReset = h('button', { class: 'btn ghost', type: 'button', onclick: () => { checked = false; cur = 0; marks.forEach(m => { m.e = free && cfg.start != null ? cfg.start : null; }); draw(); } }, mdInline(L.reset));
  const btns = h('div', { class: 'wbtns' }, btnCheck, btnReset);
  el.append(...[chips, svg, slider, read, btns].filter(Boolean));
  el.classList.add('lr');

  const setE = e => { if (checked) return; marks[cur].e = snapE(e); draw(); };
  let drag = false;
  const fromEvent = ev => { const r = svg.getBoundingClientRect(); return eOf(X0 + ((ev.clientX - r.left) / r.width * W - X0)); };
  svg.addEventListener('pointerdown', ev => { if (checked) return; drag = true; svg.setPointerCapture?.(ev.pointerId); setE(fromEvent(ev)); });
  svg.addEventListener('pointermove', ev => { if (drag) setE(fromEvent(ev)); });
  const up = () => { drag = false; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  slider?.addEventListener('input', () => setE(+slider.value));

  function draw() {
    drawItems(); drawGuess();
    chips?.querySelectorAll('.lr-chip').forEach((c, i) => {
      c.classList.toggle('sel', i === cur); c.classList.toggle('done', marks[i].e != null); c.setAttribute('aria-pressed', i === cur);
    });
    if (slider) { slider.disabled = checked; if (marks[cur].e != null) slider.value = marks[cur].e; }
    if (btnCheck) btnCheck.disabled = checked || marks.some(m => m.e == null);
    if (!read) return;
    const m = marks[cur], rows = [];
    const unitTxt = unit ? ` ${unit}` : '';
    if (!checked) {
      if (m.e == null) rows.push(h('div', { class: 'wide' }, L.notPlaced));
      else {
        rows.push(h('div', {}, free ? L.guess : m.label, ': ', ...sci(10 ** m.e), unitTxt),
          h('div', {}, L.nearest, ': ', '10', h('sup', {}, String(Math.round(m.e))), unitTxt));
      }
    } else {
      for (const mk of marks) {
        const t = mk.item.value, err = Math.abs(mk.e - lg(t));
        rows.push(h('div', { class: 'wide' }, h('b', {}, mk.label), ': ', ...sci(10 ** mk.e), unitTxt, ' → ', L.truth, ' ', ...sci(t), unitTxt,
          '; ', L.error, ' ', err.toFixed(1), ' ', L.orders));
      }
    }
    read.replaceChildren(...rows);
  }
  draw();
}
