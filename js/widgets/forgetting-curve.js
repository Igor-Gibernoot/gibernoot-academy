// forgetting-curve
//
// A toy model of memory and spaced review. Retention fades as R = exp(-(t - t_last) / S),
// where t_last is the last review (or first study, t = 0) and S the stability in days.
// A review resets R to 1 and multiplies S by 1 + gain * (1 - R): a review made when the
// memory has faded a little strengthens it a lot, a review made right away (cramming) almost
// not at all. The reader toggles review days with chips, or picks a preset schedule.
// Config (all wording from the config; every drawn element has a switch):
//   days: 60                 length of the time axis (days)
//   s0: 2.5                  stability after the first study (days)
//   gain: 3.8                growth of stability per review, scaled by how much was forgotten
//   schedule: [1,3,7,16,35]  review days switched on at the start
//   chips: [1,3,7,16,35]     review days the reader can toggle ([] = no chips)
//   presets: [{ label, schedule }]   buttons that set the whole schedule
//   show: { noReview, markers, grid, ticks, axisLabels, threshold }  each default true except
//        threshold (a dashed line at `thresholdAt`, default 0.5, labelled labels.threshold)
//   readouts: ['end', 'reviews']   rows ([] = none): end = retention at the last day with and
//        without review; reviews = how many reviews the schedule uses
//   labels: { withReview, noReview, day, retention, end, reviews, threshold, chipsTitle }
//   Reports nothing to the card.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const W = 480, H = 260, X0 = 46, X1 = 470, Y0 = 30, Y1 = 222; // the band above Y0 holds the axis title

export function forgettingCurve(el, cfg) {
  const days = cfg.days ?? 60, s0 = cfg.s0 ?? 2.5, gain = cfg.gain ?? 3.8;
  const sh = { noReview: true, markers: true, grid: true, ticks: true, axisLabels: true, threshold: false, ...(cfg.show ?? {}) };
  const L = { withReview: 'With review', noReview: 'No review', day: 'day', retention: 'remembered',
    end: 'On day {d}', reviews: 'Reviews', threshold: 'half forgotten', chipsTitle: 'Review on day:', ...(cfg.labels ?? {}) };
  const rows = cfg.readouts ?? ['end', 'reviews'];
  const chipDays = cfg.chips ?? [1, 3, 7, 16, 35];
  let plan = new Set(cfg.schedule ?? [1, 3, 7, 16, 35]);

  const xOf = t => X0 + t / days * (X1 - X0);
  const yOf = r => Y1 - r * (Y1 - Y0);

  // Retention curve sampled on a fine grid, with the review days as jumps.
  function curve(reviews) {
    const rv = [...reviews].filter(d => d > 0 && d < days).sort((a, b) => a - b);
    const pts = []; let last = 0, S = s0, k = 0;
    const N = 600;
    for (let i = 0; i <= N; i++) {
      const t = i / N * days;
      while (k < rv.length && rv[k] <= t) {
        const r = Math.exp(-(rv[k] - last) / S);
        pts.push([rv[k], r]);
        S *= 1 + gain * (1 - r); last = rv[k]; k++;
        pts.push([last, 1]);
      }
      pts.push([t, Math.exp(-(t - last) / S)]);
    }
    return pts;
  }
  const path = pts => pts.map(([t, r], i) => `${i ? 'L' : 'M'}${xOf(t).toFixed(1)},${yOf(r).toFixed(1)}`).join('');

  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Retention over time with and without review' });
  const grid = sv('g'), lines = sv('g'), marks = sv('g');
  svg.append(grid, lines, marks);
  if (sh.grid) for (const r of [0.25, 0.5, 0.75, 1]) grid.append(sv('line', { x1: X0, x2: X1, y1: yOf(r), y2: yOf(r), class: 'fgc-grid' }));
  grid.append(sv('line', { x1: X0, x2: X1, y1: Y1, y2: Y1, class: 'fgc-axis' }), sv('line', { x1: X0, x2: X0, y1: Y0, y2: Y1, class: 'fgc-axis' }));
  if (sh.ticks) {
    for (const r of [0, 0.5, 1]) { const t = sv('text', { x: X0 - 6, y: yOf(r) + 4, class: 'fgc-tick', 'text-anchor': 'end' }); t.textContent = `${r * 100}%`; grid.append(t); }
    const step = days > 40 ? 10 : 5;
    for (let d = 0; d <= days; d += step) { const t = sv('text', { x: xOf(d), y: Y1 + 15, class: 'fgc-tick', 'text-anchor': 'middle' }); t.textContent = d; grid.append(t); }
  }
  if (sh.axisLabels) {
    const t = sv('text', { x: X1, y: H - 4, class: 'fgc-tick', 'text-anchor': 'end' }); t.textContent = L.day; grid.append(t);
    const r = sv('text', { x: 4, y: 14, class: 'fgc-tick' }); r.textContent = L.retention; grid.append(r);
  }
  if (sh.threshold) {
    const y = yOf(cfg.thresholdAt ?? 0.5);
    grid.append(sv('line', { x1: X0, x2: X1, y1: y, y2: y, class: 'fgc-thresh' }));
    const t = sv('text', { x: X1 - 4, y: y - 5, class: 'fgc-tick', 'text-anchor': 'end' }); t.textContent = L.threshold; grid.append(t);
  }
  const noPath = sv('path', { class: 'fgc-none' }), yesPath = sv('path', { class: 'fgc-yes' });
  if (sh.noReview) lines.append(noPath);
  lines.append(yesPath);
  noPath.setAttribute('d', path(curve([])));

  const legend = h('div', { class: 'fgc-legend' },
    h('span', { class: 'fgc-key yes' }, L.withReview),
    sh.noReview ? h('span', { class: 'fgc-key none' }, L.noReview) : null);
  const readout = rows.length ? h('div', { class: 'readout' }) : null;
  const chipBox = chipDays.length ? h('div', { class: 'wbtns fgc-chips' }, h('span', { class: 'fgc-chip-title' }, L.chipsTitle),
    chipDays.map(d => h('button', { class: 'btn ghost fgc-chip', type: 'button', 'data-day': d, 'aria-pressed': 'false', onclick: () => { plan.has(d) ? plan.delete(d) : plan.add(d); draw(); } }, String(d)))) : null;
  const presetBox = cfg.presets?.length ? h('div', { class: 'wbtns' },
    cfg.presets.map(p => h('button', { class: 'btn ghost', type: 'button', html: mdInline(p.label), onclick: () => { plan = new Set(p.schedule ?? []); draw(); } }))) : null;

  el.append(svg, legend, chipBox, presetBox, readout);

  function draw() {
    const pts = curve(plan);
    yesPath.setAttribute('d', path(pts));
    marks.replaceChildren();
    if (sh.markers) for (const d of [...plan].filter(d => d > 0 && d < days)) {
      const before = pts.find(([t]) => t === d);
      marks.append(sv('line', { x1: xOf(d), x2: xOf(d), y1: yOf(before[1]), y2: yOf(1), class: 'fgc-jump' }),
        sv('circle', { cx: xOf(d), cy: yOf(1), r: 4, class: 'fgc-dot' }));
    }
    chipBox?.querySelectorAll('.fgc-chip').forEach(b => { const on = plan.has(+b.dataset.day); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    if (!readout) return;
    const end = pts[pts.length - 1][1], none = Math.exp(-days / s0);
    const pc = r => `${Math.round(r * 100)}%`;
    const parts = [];
    if (rows.includes('end')) parts.push(h('div', {}, `${L.end.replace('{d}', days)}: `, h('b', { class: 'fgc-yes-t' }, pc(end)), sh.noReview ? ` · ${L.noReview.toLowerCase()} ${pc(none)}` : ''));
    if (rows.includes('reviews')) parts.push(h('div', {}, `${L.reviews}: ${[...plan].filter(d => d > 0 && d < days).length}`));
    readout.replaceChildren(...parts);
  }
  draw();
}
