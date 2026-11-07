// boiling-curve
//
// Boiling (saturation) temperature of a fluid against pressure, from a data table given in the preset.  Plain SVG + HTML, every word and unit from the
// config (no course text hard-coded).  Two draggable markers sit on the curve: a low-pressure one (evaporator) and a high-pressure one (condenser); each
// shows the boiling temperature at its pressure.  Mode 'single' keeps only one marker (the 'low' one; e.g. water boiling at a given pressure).
// Interpolation: monotone cubic (Fritsch-Carlson) of ln p against 1/T (kelvin), the Antoine / Clausius-Clapeyron shape; it passes through every table
// row.  Exported `satModel(table)` gives { pOf(T), TOf(p), pMin, pMax, Tmin, Tmax } for script checks.
//
//   table: [[T, p], ...]                    rows of temperature (degrees) and saturation pressure (in units.p), increasing; at least 4 rows
//   units: { p: 'kPa', temp: '°C' }          pressure unit shown (the table must already be in it), temperature unit shown (the table must be in °C)
//   mode: 'pair' (default) | 'single'        two markers (low, high) or only the low one
//   low: 150, high: 700                      start pressures of the markers (units.p)
//   logP: true                               logarithmic pressure axis (false = linear)
//   pRange: [lo, hi]                         pressure axis limits (default: the table range); markers are kept inside the table range
//   TRange: [lo, hi]                         temperature axis limits (default: the table range, rounded to tens)
//   lines: { cold: 4, warm: 22 }             optional horizontal lines at fixed temperatures (degrees)
//   show: { curve, grid, axes, guides, markers, markerLabels, lineCold, lineWarm, lineLabels, lift, regions, readouts, sliders, handles, presets, reset }
//       default true except lift, regions, sliders (false) and lineCold / lineWarm (true, drawn only when `lines` gives the temperature);
//       curve = the boiling curve; grid = gridlines; axes = ticks, tick numbers and axis titles; guides = dashed lines from a marker to the two axes;
//       markers = the dots; markerLabels = the name and value next to each dot; lineCold / lineWarm = the two horizontal lines; lineLabels = their names;
//       lift = shaded band between the two boiling temperatures (pair mode) with its width; regions = the words `labels.liquid` and `labels.gas`
//       on the two sides of the curve; readouts = the readout cells; sliders = one pressure slider per marker; handles = drag the dots (mouse or touch);
//       presets = preset buttons; reset = reset button.
//   readouts: any of pLow, TLow, pHigh, THigh, ratio, lift, p, T   (default pLow, TLow, pHigh, THigh in pair mode; p, T in single mode)
//             p, T = the single marker's pressure and temperature
//   presets: [{ label, low, high }]
//   labels: { pLow, TLow, pHigh, THigh, ratio, lift, p, T, low, high, single, cold, warm, liquid, gas, xAxis, yAxis, sliderLow, sliderHigh, sliderSingle,
//             reset, aria }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const sig = (v, n = 3) => { if (!Number.isFinite(v)) return '–'; if (v === 0) return '0'; const p = Math.pow(10, n - 1 - Math.floor(Math.log10(Math.abs(v)))); return String(Math.round(v * p) / p); };
const K0 = 273.15;

// Pure model: monotone cubic through (x = 1000/T[K], y = ln p), T in degrees Celsius.
export function satModel(table) {
  const rows = table.map(([T, p]) => [1000 / (T + K0), Math.log(p)]).sort((a, b) => a[0] - b[0]);
  const n = rows.length, xs = rows.map(r => r[0]), ys = rows.map(r => r[1]);
  const d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], r = a * a + b * b;
    if (r > 9) { const t = 3 / Math.sqrt(r); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  const lnP = x => {
    let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const hh = xs[i + 1] - xs[i], t = (x - xs[i]) / hh, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * hh * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * hh * m[i + 1];
  };
  const Ts = table.map(r => r[0]), ps = table.map(r => r[1]);
  const Tmin = Math.min(...Ts), Tmax = Math.max(...Ts);
  const pOf = T => Math.exp(lnP(1000 / (T + K0)));
  const TOf = p => { let lo = Tmin, hi = Tmax; for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (pOf(mid) < p) lo = mid; else hi = mid; } return (lo + hi) / 2; };
  return { pOf, TOf, Tmin, Tmax, pMin: Math.min(...ps), pMax: Math.max(...ps) };
}

const niceStep = (span, target) => { const raw = span / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag; };

export function boilingCurve(el, cfg) {
  const Lb = { pLow: 'Low pressure', TLow: 'Boils at', pHigh: 'High pressure', THigh: 'Boils at', ratio: 'Pressure ratio', lift: 'Temperature lift', p: 'Pressure', T: 'Boils at',
    low: 'low', high: 'high', single: '', cold: 'cold', warm: 'warm', liquid: 'liquid', gas: 'gas', xAxis: 'Pressure', yAxis: 'Boiling temperature',
    sliderLow: 'Low pressure', sliderHigh: 'High pressure', sliderSingle: 'Pressure', reset: 'Reset', aria: 'Boiling temperature against pressure', ...(cfg.labels ?? {}) };
  const show = { curve: true, grid: true, axes: true, guides: true, markers: true, markerLabels: true, lineCold: true, lineWarm: true, lineLabels: true, lift: false, regions: false,
    readouts: true, sliders: false, handles: true, presets: true, reset: true, ...(cfg.show ?? {}) };
  const U = { p: 'kPa', temp: '°C', ...(cfg.units ?? {}) };
  const single = cfg.mode === 'single';
  const M = satModel(cfg.table);
  const logP = cfg.logP !== false;
  const [pLo, pHi] = cfg.pRange ?? [M.pMin, M.pMax];
  const [TLo, THi] = cfg.TRange ?? [Math.floor(M.Tmin / 10) * 10, Math.ceil(M.Tmax / 10) * 10];
  const mLo = Math.max(pLo, M.pMin), mHi = Math.min(pHi, M.pMax);
  const clampP = p => Math.min(mHi, Math.max(mLo, p));
  const lines = cfg.lines ?? {};
  const reads = cfg.readouts ?? (single ? ['p', 'T'] : ['pLow', 'TLow', 'pHigh', 'THigh']);
  const init = { low: clampP(cfg.low ?? mLo * 1.5), high: clampP(cfg.high ?? mHi / 1.5) };
  const st = { ...init };

  // geometry (px)
  const W = 360, H = 250, L = show.axes ? 48 : 10, R = 14, T0 = 14, B = show.axes ? 38 : 10;
  const pw = W - L - R, ph = H - T0 - B;
  const fx = p => logP ? (Math.log(p) - Math.log(pLo)) / (Math.log(pHi) - Math.log(pLo)) : (p - pLo) / (pHi - pLo);
  const px = p => L + pw * fx(p), py = T => T0 + ph * (1 - (T - TLo) / (THi - TLo));
  const pAt = f => logP ? Math.exp(Math.log(pLo) + f * (Math.log(pHi) - Math.log(pLo))) : pLo + f * (pHi - pLo);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.aria, style: 'touch-action:pan-y' });

  const pTicks = () => {
    if (!logP) { const st2 = niceStep(pHi - pLo, 5), out = []; for (let v = Math.ceil(pLo / st2) * st2; v <= pHi + 1e-9; v += st2) out.push(v); return out; }
    const out = [];
    for (let e = Math.floor(Math.log10(pLo)); e <= Math.ceil(Math.log10(pHi)); e++) for (const k of [1, 2, 5]) { const v = k * Math.pow(10, e); if (v >= pLo * 0.999 && v <= pHi * 1.001) out.push(v); }
    return out;
  };
  const Tticks = () => { const st2 = niceStep(THi - TLo, 6), out = []; for (let v = Math.ceil(TLo / st2) * st2; v <= THi + 1e-9; v += st2) out.push(v); return out; };
  const text = (x, y, str, o = {}) => s('text', { x, y, 'font-size': 9.5, fill: 'var(--ink)', 'font-weight': 650, ...o }, str);

  function paint() {
    const g = s('g'), cur = [];
    const markers = single ? [['low', st.low]] : [['low', st.low], ['high', st.high]];
    const data = markers.map(([k, p]) => ({ k, p, T: M.TOf(p) }));
    g.append(s('rect', { x: L, y: T0, width: pw, height: ph, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.5 }));
    if (show.grid || show.axes) {
      for (const v of pTicks()) {
        if (show.grid) g.append(s('line', { x1: px(v), y1: T0, x2: px(v), y2: T0 + ph, stroke: 'var(--muted)', 'stroke-width': 0.6, opacity: 0.25 }));
        if (show.axes) g.append(text(px(v), T0 + ph + 12, sig(v, 2), { 'text-anchor': 'middle', 'font-size': 9 }));
      }
      for (const v of Tticks()) {
        if (show.grid) g.append(s('line', { x1: L, y1: py(v), x2: L + pw, y2: py(v), stroke: 'var(--muted)', 'stroke-width': 0.6, opacity: 0.25 }));
        if (show.axes) g.append(text(L - 5, py(v) + 3, sig(v, 3), { 'text-anchor': 'end', 'font-size': 9 }));
      }
    }
    if (show.axes) {
      g.append(text(L + pw / 2, H - 6, `${Lb.xAxis} (${U.p})`, { 'text-anchor': 'middle', fill: 'var(--muted)' }),
        text(10, T0 + ph / 2, `${Lb.yAxis} (${U.temp})`, { 'text-anchor': 'middle', fill: 'var(--muted)', transform: `rotate(-90 10 ${T0 + ph / 2})` }));
    }
    if (show.lift && !single) {
      const a = data[0].T, b = data[1].T, y1 = py(Math.max(a, b)), y2 = py(Math.min(a, b));
      g.append(s('rect', { x: L, y: y1, width: pw, height: Math.max(0, y2 - y1), fill: 'var(--basis)', opacity: 0.16 }));
      if (y2 - y1 > 14) g.append(text(L + pw - 4, (y1 + y2) / 2 + 3.5, `${Lb.lift}: ${sig(Math.abs(b - a))} ${U.temp}`, { 'text-anchor': 'end', 'font-weight': 700 }));
    }
    for (const [key, col, show1] of [['cold', 'var(--vec)', show.lineCold], ['warm', 'var(--covec)', show.lineWarm]]) {
      if (!show1 || lines[key] == null || lines[key] < TLo || lines[key] > THi) continue;
      const y = py(lines[key]);
      g.append(s('line', { x1: L, y1: y, x2: L + pw, y2: y, stroke: col, 'stroke-width': 1.8, 'stroke-dasharray': '6 3' }));
      if (show.lineLabels) g.append(text(key === 'cold' ? L + 4 : L + 4, y - 4, `${Lb[key]} ${sig(lines[key])} ${U.temp}`, { fill: 'var(--ink)', 'font-weight': 700 }));
    }
    if (show.regions) {
      g.append(text(L + pw * 0.2, T0 + ph * 0.12, Lb.gas, { 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)', 'font-weight': 700 }),
        text(L + pw * 0.8, T0 + ph * 0.9, Lb.liquid, { 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)', 'font-weight': 700 }));
    }
    if (show.curve) {
      const N = 120, pts = [];
      for (let i = 0; i <= N; i++) { const p = pAt(fx(M.pMin) + 0 + (fx(M.pMax) - fx(M.pMin)) * i / N); const pp = Math.min(M.pMax, Math.max(M.pMin, p)); pts.push(`${px(pp).toFixed(1)},${py(M.TOf(pp)).toFixed(1)}`); }
      g.append(s('polyline', { points: pts.join(' '), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.2, 'clip-path': 'url(#bc-clip)' }));
    }
    const cols = { low: 'var(--vec)', high: 'var(--covec)' };
    for (const d of data) {
      const x = px(d.p), y = py(d.T), col = single ? 'var(--basis)' : cols[d.k];
      if (show.guides) g.append(s('line', { x1: x, y1: y, x2: x, y2: T0 + ph, stroke: col, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }), s('line', { x1: L, y1: y, x2: x, y2: y, stroke: col, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }));
      if (show.markers) g.append(s('circle', { cx: x, cy: y, r: 7, fill: col, stroke: 'var(--ink)', 'stroke-width': 1.6, style: show.handles ? 'cursor:ew-resize' : '' }));
      if (show.markerLabels) {
        const name = single ? Lb.single : Lb[d.k], right = x < L + pw * 0.55, tx = right ? x + 11 : x - 11, an = right ? 'start' : 'end', ty = d.k === 'low' || single ? y + 17 : y - 9;
        if (name) g.append(text(tx, ty - 11, name, { 'text-anchor': an, fill: 'var(--muted)', 'font-size': 9 }));
        g.append(text(tx, ty, `${sig(d.p)} ${U.p}, ${sig(d.T)} ${U.temp}`, { 'text-anchor': an, 'font-weight': 700 }));
      }
    }
    svg.append(g);

    const lo = data[0], hi = data[1];
    const val = single ? { p: `${sig(lo.p)} ${U.p}`, T: `${sig(lo.T)} ${U.temp}` } : {
      pLow: `${sig(lo.p)} ${U.p}`, TLow: `${sig(lo.T)} ${U.temp}`, pHigh: `${sig(hi.p)} ${U.p}`, THigh: `${sig(hi.T)} ${U.temp}`,
      ratio: sig(hi.p / lo.p), lift: `${sig(hi.T - lo.T)} ${U.temp}` };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    for (const key of ['low', 'high']) if (inps[key]) { inps[key].value = fx(st[key]); vals[key].textContent = `${sig(st[key])} ${U.p}`; }
  }

  // controls
  const rd = {}, vals = {}, inps = {};
  const names = { pLow: Lb.pLow, TLow: Lb.TLow, pHigh: Lb.pHigh, THigh: Lb.THigh, ratio: Lb.ratio, lift: Lb.lift, p: Lb.p, T: Lb.T };
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const rows = [];
  const setMarker = (key, p) => {
    p = clampP(p); st[key] = p;
    if (!single) { if (key === 'low' && st.high < p) st.high = p; if (key === 'high' && st.low > p) st.low = p; }
  };
  const slider = (key, text2) => {
    const inp = inps[key] = h('input', { type: 'range', min: 0, max: 1, step: 0.001, value: 0, 'aria-label': text2 });
    inp.addEventListener('input', () => { setMarker(key, pAt(+inp.value)); redraw(); });
    rows.push(h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(text2)), inp, vals[key] = h('span', { class: 'fs-num' })));
  };
  if (show.sliders) { slider('low', single ? Lb.sliderSingle : Lb.sliderLow); if (!single) slider('high', Lb.sliderHigh); }
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const btns = h('div', { class: 'wbtns' }, show.presets ? (cfg.presets ?? []).map(pr => btn(pr.label, () => {
    if (pr.low != null) st.low = clampP(pr.low); if (pr.high != null) st.high = clampP(pr.high); if (!single && st.high < st.low) st.high = st.low; redraw();
  })) : '', show.reset ? btn(Lb.reset, () => { Object.assign(st, init); redraw(); }) : '');
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', rows.length ? h('div', { class: 'fs-sliders' }, rows) : '', btns);

  // drag a dot along the curve (touch and mouse): the pointer's x gives the pressure
  let drag = null;
  const svgPt = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  svg.addEventListener('pointerdown', e => {
    if (!show.handles || !show.markers) return;
    const [x, y] = svgPt(e), keys = single ? ['low'] : ['low', 'high'];
    let best = null, bd = 26;
    for (const k of keys) { const d = Math.hypot(px(st[k]) - x, py(M.TOf(st[k])) - y); if (d < bd) { bd = d; best = k; } }
    if (!best) return;
    drag = best; svg.setPointerCapture(e.pointerId); svg.style.touchAction = 'none'; e.preventDefault();
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const [x] = svgPt(e); setMarker(drag, pAt(Math.min(1, Math.max(0, (x - L) / pw)))); redraw();
  });
  const end = () => { drag = null; svg.style.touchAction = 'pan-y'; };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);

  const clip = s('clipPath', { id: 'bc-clip' }, s('rect', { x: L, y: T0, width: pw, height: ph }));
  function redraw() { svg.replaceChildren(s('defs', {}, clip)); paint(); }
  redraw();
}
