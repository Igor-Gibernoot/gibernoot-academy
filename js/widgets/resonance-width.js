// resonance-width
//
// Steady-state response of the driven damped oscillator in Taylor's notation (Taylor 5.6):  x'' + 2 beta x' + w0^2 x = f0 cos(w t),
// x = A cos(w t - delta),  A^2 = f0^2 / ((w0^2 - w^2)^2 + 4 beta^2 w^2).  The widget plots A^2 against the drive frequency w, with sliders on beta/w0 and w0.
// Peak (beta < w0/sqrt 2): w2 = sqrt(w0^2 - 2 beta^2), A^2_max = f0^2 / (4 beta^2 (w0^2 - beta^2)). Half-maximum points (exact, from u = w^2):
//   u = (w0^2 - 2 beta^2) +- sqrt((w0^2 - 2 beta^2)^2 - w0^4 + 2 Dmin),  Dmin = 4 beta^2 (w0^2 - beta^2);  the width is w+ - w-  (about 2 beta for small beta/w0).
// Lorentzian overlay (Taylor 5.6, near w0): f0^2 / (4 w0^2 ((w0 - w)^2 + beta^2)), height f0^2/(4 w0^2 beta^2), full width at half maximum exactly 2 beta.
// Plain SVG + HTML, every word from the config. Reports nothing to the card.
//
//   f0: 1 (drive amplitude per unit mass)   w0: 1 (initial natural frequency)   ratio: 0.1 (initial beta / w0)   w: initial marker frequency (default w0)
//   wMin: 0, wMax: ends of the w axis (default wMax: 1.3 x the largest w0 of the slider range, or 2 w0 when there is no w0 slider); wMin > 0 zooms in on the peak
//   yMax: A^2 at the top of the plot (default: auto, 1.12 x the current peak; with a number the scale is fixed and taller curves are clipped)
//   ranges: { ratio: [0.02, 0.6, 0.01], w0: [0.5, 1.5, 0.05], w: [wMin, wMax, (wMax - wMin)/400] }
//   units: { w: 'rad/s', a2: '' }
//   show: { axes, axisLabels, ticks, curve, w0Line, halfLine, bracket, lorentzian, marker, markerDrop, labels, readouts, ratioSlider, w0Slider, wSlider, drag, presets }
//       defaults true except wSlider, halfLine, bracket, lorentzian and marker (false: a card turns on what it discusses).
//       curve = the A^2(w) curve; w0Line = dashed vertical at w0; halfLine = dashed horizontal at A^2_max / 2; bracket = the FWHM bracket between the two half-maximum points (with drop lines
//       and its label); lorentzian = the dashed overlay; marker = dot on the curve at drive w; markerDrop = its dashed guides to the axes; ticks = numbers on the w axis;
//       axisLabels = axis names; labels = every other text in the drawing; drag = move the marker by dragging the figure (needs marker); wSlider = slider on w.
//   readouts: any of ratio, beta, w0, twoBeta, width, widthRatio, q, peak, wPeak, halfMax, lorentzPeak, w, a2, a (default [width, twoBeta, q, peak]).
//       width = w+ - w- between the half-maximum points (none when the curve has no lower half-maximum point); widthRatio = width / (2 beta); q = w0 / (2 beta); peak = A^2_max;
//       wPeak = w2 where the peak is (0 for beta >= w0/sqrt 2: no resonance peak, the curve falls from w = 0); a2, a = A^2 and A at the marker.
//   presets: [{ label, ratio, w0, w }]   only the fields given change
//   labels: { a2, w, w0, halfMax, width, lorentzian, curve, ratioSlider, w0Slider, wSlider, ratio, beta, w0Read, twoBeta, widthRead, widthRatio, q, peak, wPeak, halfMaxRead,
//             lorentzPeak, wRead, a2Read, aRead, none, reset }
// Exported for script checks: response({f0, w0, beta}) -> { a2(w), wPeak, peak, wLo, wHi, width, lorentz(w) }.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };
const sig = v => (v >= 100 ? num(v, 0) : v >= 10 ? num(v, 1) : v >= 1 ? num(v, 2) : num(v, 3));

export function response({ f0 = 1, w0 = 1, beta = 0.1 }) {
  const a2 = w => f0 * f0 / ((w0 * w0 - w * w) ** 2 + 4 * beta * beta * w * w);
  const b2 = beta * beta, resonant = w0 * w0 - 2 * b2 > 0;
  const wPeak = resonant ? Math.sqrt(w0 * w0 - 2 * b2) : 0;
  const peak = a2(wPeak);
  let wLo = null, wHi = null, width = null;
  if (resonant) {
    const m = w0 * w0 - 2 * b2;
    // half maximum: (w0^2 - w^2)^2 + 4 b2 w^2 = 2 Dmin, Dmin = f0^2 / peak; in u = w^2: u^2 - 2 m u + w0^4 - 2 Dmin = 0
    const D2 = 2 * f0 * f0 / peak, d = m * m - (w0 ** 4 - D2);
    if (d >= 0) {
      const uLo = m - Math.sqrt(d), uHi = m + Math.sqrt(d);
      if (uLo > 0) wLo = Math.sqrt(uLo);
      wHi = Math.sqrt(uHi);
      if (wLo != null) width = wHi - wLo;
    }
  }
  const lorentz = w => f0 * f0 / (4 * w0 * w0 * ((w0 - w) ** 2 + b2));
  return { a2, wPeak, peak, wLo, wHi, width, lorentz };
}

export function resonanceWidth(el, cfg = {}) {
  const Lb = { a2: 'A²', w: 'ω', w0: 'ω₀', halfMax: 'A²_max / 2', width: 'width', lorentzian: 'Lorentzian', curve: 'A²(ω)',
    ratioSlider: 'Damping ratio β/ω₀', w0Slider: 'Natural frequency ω₀', wSlider: 'Drive frequency ω',
    ratio: 'β/ω₀', beta: 'β', w0Read: 'ω₀', twoBeta: '2β', widthRead: 'Width (FWHM)', widthRatio: 'Width / 2β', q: 'Q = ω₀/(2β)', peak: 'Peak height A²_max',
    wPeak: 'Peak at ω₂', halfMaxRead: 'Half maximum', lorentzPeak: 'Lorentzian peak', wRead: 'ω', a2Read: 'A²', aRead: 'A', none: '–', reset: 'Reset',
    ...(cfg.labels ?? {}) };
  const U = { w: 'rad/s', a2: '', ...(cfg.units ?? {}) };
  const show = { axes: true, axisLabels: true, ticks: true, curve: true, w0Line: true, halfLine: false, bracket: false, lorentzian: false, marker: false, markerDrop: true, labels: true,
    readouts: true, ratioSlider: true, w0Slider: true, wSlider: false, drag: true, presets: true, ...(cfg.show ?? {}) };
  const f0 = cfg.f0 ?? 1;
  const R = { ratio: [0.02, 0.6, 0.01], w0: [0.5, 1.5, 0.05], ...(cfg.ranges ?? {}) };
  const wMin = cfg.wMin ?? 0, wMax = cfg.wMax ?? (show.w0Slider ? 1.3 * R.w0[1] : 2 * (cfg.w0 ?? 1)), span = wMax - wMin;
  R.w = cfg.ranges?.w ?? [wMin, wMax, span / 400];
  const init = { ratio: cfg.ratio ?? 0.1, w0: cfg.w0 ?? 1, w: cfg.w ?? null };
  const st = { ...init };
  const wv = () => st.w ?? st.w0;

  const model = () => response({ f0, w0: st.w0, beta: st.ratio * st.w0 });
  const yTop = m => cfg.yMax ?? Math.max(m.peak, m.a2(0)) * 1.12;

  const W = 360, L = 14, Rr = 348, T0 = 14, PH = 210, B0 = T0 + PH, Hh = B0 + 30, kx = (Rr - L) / span;
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fs-svg', role: 'img', 'aria-label': 'resonance curve', style: 'touch-action:none' });
  const clipId = 'rw' + Math.random().toString(36).slice(2, 8);
  const X = w => L + (w - wMin) * kx;

  function paint() {
    const m = model(), top = yTop(m), Y = v => B0 - Math.min(v, top * 1.02) / top * PH, g = s('g');
    const w = wv();
    const lab = (x, y, txt, o = {}) => show.labels && g.append(s('text', { x, y, 'font-size': 10, fill: 'var(--muted)', ...o }, txt));
    g.append(s('defs', {}, s('clipPath', { id: clipId }, s('rect', { x: L, y: T0 - 2, width: Rr - L + 2, height: PH + 2 }))));
    if (show.axes) g.append(s('line', { x1: L, y1: B0, x2: Rr, y2: B0, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.7 }),
      s('line', { x1: L, y1: T0, x2: L, y2: B0, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.7 }));
    if (show.axisLabels) { lab(Rr, B0 + 24, Lb.w, { 'text-anchor': 'end', 'font-size': 11 }); lab(L + 4, T0 + 9, Lb.a2, { 'font-size': 11 }); }
    if (show.ticks) { lab(X(st.w0), B0 + 12, Lb.w0, { 'text-anchor': 'middle' }); }
    const clipped = s('g', { 'clip-path': `url(#${clipId})` });
    g.append(clipped);
    const curve = f => { let d = ''; const n = 400; for (let i = 0; i <= n; i++) { const u = wMin + span * i / n; d += (i ? ' L' : 'M') + X(u).toFixed(1) + ',' + Y(f(u)).toFixed(1); } return d; };
    if (show.w0Line) g.append(s('line', { x1: X(st.w0), y1: T0, x2: X(st.w0), y2: B0, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: 0.7 }));
    if (show.lorentzian) clipped.append(s('path', { d: curve(m.lorentz), fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-dasharray': '5 3' }));
    if (show.curve) clipped.append(s('path', { d: curve(m.a2), fill: 'none', stroke: 'var(--basis)', 'stroke-width': 2.6, 'stroke-linejoin': 'round' }));
    const half = m.peak / 2;
    if (show.halfLine) {
      g.append(s('line', { x1: L, y1: Y(half), x2: Rr, y2: Y(half), stroke: 'var(--good)', 'stroke-width': 1.3, 'stroke-dasharray': '5 3' }));
      lab(Rr - 2, Y(half) - 4, Lb.halfMax, { 'text-anchor': 'end', fill: 'var(--good)' });
    }
    if (show.bracket && m.width != null) {
      const y = Y(half), a = X(m.wLo), b = X(m.wHi);
      g.append(s('line', { x1: a, y1: y, x2: a, y2: B0, stroke: 'var(--good)', 'stroke-width': 1, 'stroke-dasharray': '2 3' }),
        s('line', { x1: b, y1: y, x2: b, y2: B0, stroke: 'var(--good)', 'stroke-width': 1, 'stroke-dasharray': '2 3' }),
        s('line', { x1: a, y1: y, x2: b, y2: y, stroke: 'var(--good)', 'stroke-width': 2.4 }),
        s('line', { x1: a, y1: y - 5, x2: a, y2: y + 5, stroke: 'var(--good)', 'stroke-width': 2.4 }),
        s('line', { x1: b, y1: y - 5, x2: b, y2: y + 5, stroke: 'var(--good)', 'stroke-width': 2.4 }));
      lab(b + 6, y - 6, `${Lb.width} = ${num(m.width, 3)}`, { fill: 'var(--good)', 'font-size': 11 });
    }
    if (show.marker) {
      const x = X(w), y = Y(m.a2(w));
      if (show.markerDrop) g.append(s('line', { x1: x, y1: y, x2: x, y2: B0, stroke: 'var(--ink)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.6 }),
        s('line', { x1: L, y1: y, x2: x, y2: y, stroke: 'var(--ink)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.6 }));
      g.append(s('circle', { cx: x, cy: y, r: 5, fill: 'var(--ink)' }));
      lab(x, Math.max(T0 + 10, y - 9), Lb.w, { 'text-anchor': 'middle', fill: 'var(--ink)' });
    }
    svg.replaceChildren(g);
  }

  // ---- readouts and controls
  const reads = cfg.readouts ?? ['width', 'twoBeta', 'q', 'peak'];
  const rd = {};
  const names = { ratio: Lb.ratio, beta: Lb.beta, w0: Lb.w0Read, twoBeta: Lb.twoBeta, width: Lb.widthRead, widthRatio: Lb.widthRatio, q: Lb.q, peak: Lb.peak, wPeak: Lb.wPeak,
    halfMax: Lb.halfMaxRead, lorentzPeak: Lb.lorentzPeak, w: Lb.wRead, a2: Lb.a2Read, a: Lb.aRead };
  const readEl = h('div', { class: 'fs-reads' }, reads.map(key => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[key] ?? key)), rd[key] = h('div', { class: 'fs-num', role: 'status' }))));
  const slider = (label, min, max, step, get, set, fmt) => {
    const inp = h('input', { type: 'range', min, max, step, 'aria-label': label }), val = h('span', { class: 'fs-num' });
    inp.addEventListener('input', () => { set(+inp.value); update(); });
    const row = h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(label)), inp, val);
    return { row, sync: () => { inp.value = get(); val.textContent = fmt(get()); } };
  };
  const rows = [], syncs = [];
  const add = (flag, label, rng, get, set, fmt) => { if (!flag) return; const o = slider(label, rng[0], rng[1], rng[2], get, set, fmt); rows.push(o.row); syncs.push(o.sync); };
  add(show.ratioSlider, Lb.ratioSlider, R.ratio, () => st.ratio, v => { st.ratio = v; }, v => num(v, 2));
  add(show.w0Slider, Lb.w0Slider, R.w0, () => st.w0, v => { st.w0 = v; }, v => `${num(v, 2)} ${U.w}`.trim());
  add(show.wSlider, Lb.wSlider, R.w, wv, v => { st.w = v; }, v => `${num(v, 3)} ${U.w}`.trim());
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const apply = pr => { if (pr.ratio != null) st.ratio = pr.ratio; if (pr.w0 != null) st.w0 = pr.w0; if (pr.w != null) st.w = pr.w; update(); };
  const presets = show.presets ? cfg.presets ?? [] : [];
  const btns = presets.length ? h('div', { class: 'wbtns' }, presets.map(pr => btn(pr.label, () => apply(pr)))) : '';
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', rows.length ? h('div', { class: 'fs-sliders' }, rows) : '', btns);

  if (show.marker && show.drag) {
    const move = e => {
      const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W;
      st.w = Math.max(wMin, Math.min(wMax, wMin + (x - L) / kx)); update();
    };
    svg.addEventListener('pointerdown', e => { try { svg.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ } move(e); svg.onpointermove = move; });
    svg.addEventListener('pointerup', () => { svg.onpointermove = null; });
    svg.style.cursor = 'ew-resize';
  }

  function update() {
    const m = model(), beta = st.ratio * st.w0, w = wv(), a2 = m.a2(w);
    const wu = v => `${num(v, 3)} ${U.w}`.trim(), au = v => `${sig(v)} ${U.a2}`.trim();
    const val = { ratio: num(st.ratio, 2), beta: wu(beta), w0: wu(st.w0), twoBeta: wu(2 * beta), width: m.width != null ? wu(m.width) : Lb.none,
      widthRatio: m.width != null ? num(m.width / (2 * beta), 3) : Lb.none, q: num(st.w0 / (2 * beta), 2), peak: au(m.peak), wPeak: wu(m.wPeak), halfMax: au(m.peak / 2),
      lorentzPeak: au(m.lorentz(st.w0)), w: wu(w), a2: au(a2), a: sig(Math.sqrt(a2)) };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    for (const f of syncs) f();
    paint();
  }
  update();
}
