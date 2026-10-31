// multiverse-counter
//
// A growing sequence of M bubble universes of two types, A (small, many) and B (large, few), born one after
// another from left (early) to right (late). A cut-off slider chooses how much of the sequence is counted,
// and a RULE says how the counted part is measured; the fraction of type A depends on the rule:
//   count   the first K bubbles, each counts once
//   volume  bubbles, in birth order, until a total volume V is reached; each counts by its (final) volume
//   time    all bubbles born before time T; each counts by the volume it has reached at T
//           (a bubble of type X is full-size after tauX, volume ~ min(1, age/tauX)^3)
// Bubble area is proportional to the volume counted under the current rule. Reports nothing to the card.
// Config (all wording from the config; every drawn element has a switch):
//   M: 80                      number of bubbles
//   pA: 0.8                    chance that a bubble is of type A (seeded, repeatable)
//   volA: 1, volB: 8           full volume of a bubble of each type
//   tauA: 4, tauB: 25          growth time of each type (in bubble births), used by the time rule
//   seed: 1                    seeded random numbers; omit for true random
//   rules: [count, volume, time]   rules offered (subset, in this order); the first is the starting rule
//   rule: 'count'              starting rule (must be in rules)
//   cut: 0.5                   starting cut-off, 0 to 1 (share of the sequence)
//   interval: 80               ms between Grow ticks
//   show: { bubbles, excluded, axis, cutline, legend, rules, slider, grow, reset, fraction, counts, cut,
//           compare, trace, ruleNote }
//         defaults: bubbles, excluded, cutline, legend, rules, slider, fraction true; the rest false
//         (excluded = counted-out bubbles drawn faint; axis = birth-time arrow; counts = n_A and n_B;
//          cut = what the cut-off is, e.g. "K = 40 bubbles"; compare = fraction of A under every rule;
//          trace = plot of the fraction of A against the cut-off, current rule; ruleNote = one line
//          describing the current rule, from labels.note.<rule>)
//   labels: { A, B, count, volume, time, fraction, nA, nB, cut, cutCount, cutVolume, cutTime, compare, grow,
//             stop, reset, slider, traceX, traceY, axis, rules, note: {count, volume, time} }   (math allowed)
import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const BW = 480, BH = 150, TH = 120;

function rng(seed) {
  let a = (seed | 0) + 0x6D2B79F5;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function multiverseCounter(el, cfg) {
  const L = { A: 'type A', B: 'type B', count: 'by count', volume: 'by volume', time: 'by time', fraction: 'fraction of type A',
    nA: 'bubbles A', nB: 'bubbles B', cut: 'cut-off', cutCount: 'first K bubbles, K =', cutVolume: 'total volume V =', cutTime: 'time T =',
    compare: 'fraction of A under each rule', grow: 'Grow', stop: 'Stop', reset: 'Reset', slider: 'Cut-off',
    traceX: 'cut-off (share of the sequence)', traceY: 'fraction of A', axis: 'birth time', rules: 'Counting rule',
    ...(cfg.labels ?? {}), note: { count: '', volume: '', time: '', ...(cfg.labels?.note ?? {}) } };
  const sh = { bubbles: true, excluded: true, axis: false, cutline: true, legend: true, rules: true, slider: true, grow: false,
    reset: false, fraction: true, counts: false, cut: false, compare: false, trace: false, ruleNote: false, ...(cfg.show ?? {}) };
  const ALL = ['count', 'volume', 'time'];
  const rules = (cfg.rules ?? ALL).filter(r => ALL.includes(r));
  if (!rules.length) rules.push('count');
  let rule = rules.includes(cfg.rule) ? cfg.rule : rules[0];
  const M = Math.max(5, Math.min(400, Math.round(cfg.M ?? 80)));
  const pA = cfg.pA ?? 0.8, volA = cfg.volA ?? 1, volB = cfg.volB ?? 8, tauA = cfg.tauA ?? 4, tauB = cfg.tauB ?? 25;
  const interval = cfg.interval ?? 80, cut0 = Math.max(0, Math.min(1, cfg.cut ?? 0.5));
  let u = cut0, timer = null;

  // the bubbles: type, full volume, vertical position
  const rand = cfg.seed == null ? Math.random : rng(cfg.seed);
  const isA = Array.from({ length: M }, () => rand() < pA);
  const vol = isA.map(a => (a ? volA : volB));
  const yPos = Array.from({ length: M }, () => rand());
  const cum = []; vol.reduce((s, v, i) => (cum[i] = s + v), 0);
  const totalV = cum[M - 1];
  const grow = (age, tau) => Math.pow(Math.max(0, Math.min(1, age / tau)), 3);

  // what the rule counts at cut-off x: { inc: number of bubbles included, w: weight of each, T }
  function measure(r, x) {
    let inc, T = null;
    if (r === 'count') inc = Math.max(1, Math.round(x * M));
    else if (r === 'volume') inc = Math.max(1, cum.filter(c => c <= x * totalV + 1e-9).length);
    else { T = Math.max(1, x * M); inc = Math.min(M, Math.max(1, Math.ceil(T))); }
    const w = vol.map((v, i) => (i >= inc ? 0 : r === 'time' ? v * grow(T - i, isA[i] ? tauA : tauB) : r === 'volume' ? v : 1));
    let sA = 0, sAll = 0, nA = 0;
    w.forEach((wi, i) => { sAll += wi; if (isA[i]) { sA += wi; if (i < inc) nA++; } });
    return { inc, T, w, frac: sAll > 0 ? sA / sAll : NaN, nA, nB: inc - nA, K: inc, V: r === 'volume' ? cum[inc - 1] : null };
  }
  const pct = f => (Number.isNaN(f) ? '–' : `${(f * 100).toFixed(f < 0.1 ? 1 : 0)}%`);
  const num = v => (v >= 100 ? v.toFixed(0) : v.toFixed(1)).replace(/\.0$/, '');

  // --- DOM ---
  el.classList.add('mv');
  const svg = (sh.bubbles || sh.axis || sh.cutline) ? sv('svg', { viewBox: `0 0 ${BW} ${BH}`, class: 'mv-svg', role: 'img', 'aria-label': 'Sequence of bubble universes of two types' }) : null;
  const legend = sh.legend ? h('div', { class: 'mv-legend' }, h('span', { class: 'mv-key mv-a' }), h('span', { html: mdInline(L.A) }), h('span', { class: 'mv-key mv-b' }), h('span', { html: mdInline(L.B) })) : null;
  const ruleBar = sh.rules && rules.length > 1 ? h('div', { class: 'wbtns mv-rules', role: 'group', 'aria-label': L.rules.replace(/\$/g, '') },
    ...rules.map(r => h('button', { class: 'btn ghost', type: 'button', 'data-rule': r, 'aria-pressed': String(r === rule), onclick: () => { rule = r; draw(); } }, h('span', { html: mdInline(L[r]) })))) : null;
  const slider = sh.slider ? h('input', { type: 'range', class: 'mv-slider', min: 0, max: 1000, step: 1, value: Math.round(u * 1000), 'aria-label': L.slider.replace(/\$/g, ''),
    oninput: ev => { u = ev.target.value / 1000; draw(); } }) : null;
  let growBtn = null, resetBtn = null;
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } if (growBtn) { growBtn.setAttribute('aria-pressed', 'false'); growBtn.firstChild.innerHTML = mdInline(L.grow); } };
  const btn = (label, fn, extra = {}) => h('button', { class: 'btn ghost', type: 'button', onclick: fn, ...extra }, h('span', { html: mdInline(label) }));
  if (sh.grow) growBtn = btn(L.grow, () => {
    if (timer) { stop(); return; }
    if (u >= 1) u = 0;
    growBtn.setAttribute('aria-pressed', 'true'); growBtn.firstChild.innerHTML = mdInline(L.stop);
    timer = setInterval(() => { if (!el.isConnected) { stop(); return; } u = Math.min(1, u + 1 / M); if (u >= 1) stop(); draw(); }, interval);
  }, { 'aria-pressed': 'false' });
  if (sh.reset) resetBtn = btn(L.reset, () => { stop(); u = cut0; draw(); });
  const bar = (growBtn || resetBtn) ? h('div', { class: 'wbtns mv-btns' }, growBtn, resetBtn) : null;
  const note = sh.ruleNote ? h('div', { class: 'mv-note' }) : null;
  const rd = h('div', { class: 'readout mv-read', role: 'status', 'aria-live': 'polite' });
  const tsvg = sh.trace ? sv('svg', { viewBox: `0 0 ${BW} ${TH}`, class: 'mv-trace', role: 'img', 'aria-label': `${L.traceY.replace(/\$/g, '')} vs ${L.traceX.replace(/\$/g, '')}` }) : null;
  el.append(...[svg, legend, ruleBar, slider, bar, note, rd, tsvg].filter(Boolean));

  // geometry of the bubble strip
  const px0 = 14, px1 = BW - 14, py0 = 18, py1 = BH - (sh.axis ? 22 : 8);
  const xOf = i => px0 + (i + 0.5) / M * (px1 - px0);
    let circles = [], cutLine = null;
  if (svg) {
    if (sh.axis) {
      svg.append(sv('line', { x1: px0, x2: px1, y1: BH - 12, y2: BH - 12, class: 'mv-axis' }), sv('path', { d: `M${px1 - 6} ${BH - 16} L${px1} ${BH - 12} L${px1 - 6} ${BH - 8}`, class: 'mv-axis mv-nofill' }));
      const t = sv('text', { x: BW / 2, y: BH - 1, class: 'mv-lab', 'text-anchor': 'middle' }); t.textContent = L.axis.replace(/\$/g, ''); svg.append(t);
    }
    if (sh.bubbles) for (let i = 0; i < M; i++) {
      const c = sv('circle', { cx: xOf(i).toFixed(1), cy: (py0 + 8 + yPos[i] * (py1 - py0 - 16)).toFixed(1), class: `mv-dot ${isA[i] ? 'mv-a' : 'mv-b'}` });
      circles.push(c); svg.append(c);
    }
    if (sh.cutline) { cutLine = sv('line', { y1: 4, y2: py1 + 4, class: 'mv-cut' }); svg.append(cutLine); }
  }

  function draw() {
    const m = measure(rule, u);
    if (ruleBar) ruleBar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.rule === rule)));
    if (slider) slider.value = Math.round(u * 1000);
    if (svg && sh.bubbles) {
      const vmax = Math.max(volA, volB), rMax = Math.min(13, (px1 - px0) / M * 2.4);
      circles.forEach((c, i) => {
        const inn = i < m.inc, counted = rule === 'time' && inn ? m.w[i] : vol[i];
        const r = rule === 'count' ? rMax * 0.45 : Math.max(1.5, rMax * Math.sqrt(counted / vmax));
        c.setAttribute('r', r.toFixed(2));
        c.classList.toggle('mv-out', !inn);
        c.style.display = inn || sh.excluded ? '' : 'none';
      });
    }
    if (cutLine) { const x = px0 + m.inc / M * (px1 - px0); cutLine.setAttribute('x1', x.toFixed(1)); cutLine.setAttribute('x2', x.toFixed(1)); }
    const row = (lab, val) => h('span', { class: 'ms-row' }, h('span', { class: 'ms-lbl', html: mdInline(lab) }), ' ', h('b', {}, val));
    const rows = [];
    if (sh.cut) rows.push(rule === 'count' ? row(L.cutCount, `${m.K}`) : rule === 'volume' ? row(L.cutVolume, num(m.V)) : row(L.cutTime, num(m.T)));
    if (sh.counts) rows.push(row(L.nA, `${m.nA}`), row(L.nB, `${m.nB}`));
    if (sh.fraction) rows.push(row(L.fraction, pct(m.frac)));
    if (sh.compare) rows.push(...rules.map(r => row(L[r], pct(measure(r, u).frac))));
    rd.replaceChildren(...rows); rd.style.display = rows.length ? '' : 'none';
    if (note) { note.innerHTML = mdInline(L.note[rule] ?? ''); note.style.display = L.note[rule] ? '' : 'none'; }
    if (tsvg) drawTrace();
  }

  function drawTrace() {
    tsvg.replaceChildren();
    const x0 = 34, x1 = BW - 12, y0 = 8, y1 = TH - 28, X = x => x0 + x * (x1 - x0), Y = f => y1 - f * (y1 - y0);
    tsvg.append(sv('line', { x1: x0, x2: x1, y1: y1, y2: y1, class: 'mv-axis' }), sv('line', { x1: x0, x2: x0, y1: y0, y2: y1, class: 'mv-axis' }));
    for (const f of [0, 0.5, 1]) { const t = sv('text', { x: x0 - 4, y: Y(f) + 4, class: 'mv-lab', 'text-anchor': 'end' }); t.textContent = `${f * 100}%`; tsvg.append(t); }
    const tx = sv('text', { x: (x0 + x1) / 2, y: TH - 4, class: 'mv-lab', 'text-anchor': 'middle' }); tx.textContent = L.traceX.replace(/\$/g, ''); tsvg.append(tx);
    const ty = sv('text', { x: x0 + 8, y: 12, class: 'mv-lab' }); ty.textContent = L.traceY.replace(/\$/g, ''); tsvg.append(ty);
    const n = 100;
    for (const r of rules) {
      const pts = [];
      for (let j = 1; j <= n; j++) { const f = measure(r, j / n).frac; if (!Number.isNaN(f)) pts.push(`${X(j / n).toFixed(1)},${Y(f).toFixed(1)}`); }
      tsvg.append(sv('polyline', { points: pts.join(' '), class: `mv-line${r === rule ? ' mv-cur' : ''}` }));
    }
    tsvg.append(sv('line', { x1: X(u), x2: X(u), y1: y0, y2: y1, class: 'mv-cut' }));
  }

  draw();
}
