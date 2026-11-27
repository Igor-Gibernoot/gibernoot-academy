// curl-loop
//
// A small rectangle loop in a 2D force field. The work F . dr on each of the four edges (counter-clockwise: bottom left to right,
// right edge up, top right to left, left edge down), their sum (the circulation) and (dFy/dx - dFx/dy) x area, so that the two
// agree more and more as the loop shrinks. A draggable corner, sliders for width, height and overall size, a shrink animation.
// Fully general: all wording from the config. Convention: W = integral F . dr, curl components as in Cartesian (curl F)_z = dFy/dx - dFx/dy.
//
//   fields: [ { label, type, ... } ]            one or more; two or more give switch buttons (`field: {...}` = a single one)
//       type 'swirl':   F = k (-(y - cy), x - cx), curl 2k          { k: 1, center: [0,0] }
//       type 'shear':   F = (k y, 0), curl -k                       { k: 1 }
//       type 'spring':  F = -k (r - c), curl 0                      { k: 1, center: [0,0] }
//       type 'central': F = -k (r - c) / rho^3, rho^2 = |r - c|^2 + eps^2 (softened 1/r^2), curl 0   { k: 1, eps: 0.15, center: [0,0] }
//       type 'bend':    F = (0, k (x - cx)^2), curl 2k (x - cx), NOT constant: the loop's circulation / area only tends to it as the loop shrinks   { k: 1, center: [0,0] }
//       type 'push':    F = (fx, fy) steady push, curl 0 ('uniform' is the same)   { fx: 1, fy: 0 }
//   view: [-1.6, 1.6, -1.1, 1.1]                [xmin, xmax, ymin, ymax]
//   corner: [-0.4, -0.3]                        lower-left corner of the loop (draggable); size: { w: 1, h: 0.7 } (base width and height)
//   curlAt: 'corner'                            where the curl is evaluated: 'corner' (the draggable corner, as in the small-rectangle proof) or 'center'
//   scale: 1                                    overall size factor (slider 'size'; the shrink button animates it down to `minScale`)
//   strength: 1                                 multiplies the field (slider 'strength')
//   sliders: []                                 'width', 'height', 'size', 'strength'
//   ranges: { width: [0.05, 2, 0.05], height: [0.05, 2, 0.05], size: [0.02, 1, 0.01], strength: [-2, 2, 0.1] }
//   units: { work: 'J', length: 'm', force: 'N' }       duration: 3000 (ms of the shrink), minScale: 0.03
//   nField: [9, 6], decimals: 3
//   show: { field, loop, corner, edgeArrows, edgeLabels, bars, readouts, fieldButtons, shrink, labels }   all default true
//       field = grey grid arrows; loop = the rectangle (edges coloured); corner = the draggable handle; edgeArrows = direction arrows
//       on the edges; edgeLabels = the work of each edge written beside it; bars = bar chart of the edge works, circulation, curl x area;
//       readouts = the readout cells; shrink = the shrink button; labels = names and captions.
//   readouts: ['edges', 'circ', 'curl', 'curlArea', 'ratio']   also available: 'terms' (dFy/dx and dFx/dy), 'perArea' (circulation / area),
//                                                               'size' (width, height, area), 'edge:N' is not needed: 'edges' gives all four
//   bars: ['edges', 'circ', 'curlArea']         which bar rows to draw (any of these three groups)
//   labels: { bottom, right, top, left, circ, curl, curlArea, ratio, perArea, terms, size, width, height, scale, strength, shrink, reset, bothZero, picture, ... }
//   Exported pure model: fieldForce, curlOf, edgeWorks, partials.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- pure model -------------------------------------------------------------------------
export function fieldForce(f, x, y, k = 1) {
  const c = f.center ?? [0, 0], q = (f.k ?? 1) * k, dx = x - c[0], dy = y - c[1];
  switch (f.type) {
    case 'swirl': return [-q * dy, q * dx];
    case 'shear': return [q * y, 0];
    case 'spring': return [-q * dx, -q * dy];
    case 'bend': return [0, q * (x - c[0]) ** 2];
    case 'central': { const r2 = dx * dx + dy * dy + (f.eps ?? 0.15) ** 2, r3 = r2 * Math.sqrt(r2); return [-q * dx / r3, -q * dy / r3]; }
    default: return [(f.fx ?? 1) * k, (f.fy ?? 0) * k];       // push / uniform
  }
}

// dFy/dx and dFx/dy by central differences (so any field type works), and the curl.
export function partials(f, x, y, k = 1, e = 1e-5) {
  const dFydx = (fieldForce(f, x + e, y, k)[1] - fieldForce(f, x - e, y, k)[1]) / (2 * e);
  const dFxdy = (fieldForce(f, x, y + e, k)[0] - fieldForce(f, x, y - e, k)[0]) / (2 * e);
  return { dFydx, dFxdy };
}
export function curlOf(f, x, y, k = 1) { const p = partials(f, x, y, k); return p.dFydx - p.dFxdy; }

// Work on the four edges of the rectangle with lower-left corner (x, y), width w, height ht, counter-clockwise (midpoint rule, n steps each).
export function edgeWorks(f, x, y, w, ht, k = 1, n = 200) {
  const seg = (ax, ay, bx, by) => {
    let t = 0;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, F = fieldForce(f, ax + (bx - ax) * u, ay + (by - ay) * u, k);
      t += F[0] * (bx - ax) / n + F[1] * (by - ay) / n;
    }
    return t;
  };
  const e = [seg(x, y, x + w, y), seg(x + w, y, x + w, y + ht), seg(x + w, y + ht, x, y + ht), seg(x, y + ht, x, y)];
  return { edges: e, circ: e[0] + e[1] + e[2] + e[3] };
}

// ---- widget -----------------------------------------------------------------------------
export function curlLoop(el, cfg) {
  const Lb = { bottom: 'Bottom edge', right: 'Right edge', top: 'Top edge', left: 'Left edge', circ: 'Circulation', curl: 'Curl at the loop',
    curlArea: 'Curl × area', ratio: 'Circulation ÷ (curl × area)', perArea: 'Circulation ÷ area', terms: 'Partial derivatives', size: 'Loop size',
    width: 'Width', height: 'Height', scale: 'Size', strength: 'Field strength', shrink: 'Shrink the loop', reset: 'Reset size', bothZero: 'both are zero',
    dFydx: '∂Fy/∂x', dFxdy: '∂Fx/∂y', area: 'area', picture: 'Force field with a rectangular loop and the work on each edge', ...(cfg.labels ?? {}) };
  const barL = { bottom: Lb.bottom, right: Lb.right, top: Lb.top, left: Lb.left, circ: Lb.circ, curlArea: Lb.curlArea, ...(cfg.barLabels ?? {}) };
  const show = { field: true, loop: true, corner: true, edgeArrows: true, edgeLabels: true, bars: true, readouts: true, fieldButtons: true, shrink: true, labels: true, ...(cfg.show ?? {}) };
  const U = { work: 'J', length: 'm', force: 'N', ...(cfg.units ?? {}) };
  const reads = cfg.readouts ?? ['edges', 'circ', 'curl', 'curlArea', 'ratio'], barKeys = cfg.bars ?? ['edges', 'circ', 'curlArea'];
  const dec = cfg.decimals ?? 3;
  const [x0, x1, y0, y1] = cfg.view ?? [-1.6, 1.6, -1.1, 1.1];
  const fields = cfg.fields ?? (cfg.field ? [cfg.field] : [{ type: 'swirl', k: 1 }]);
  const R = { width: [0.05, 2, 0.05], height: [0.05, 2, 0.05], size: [0.02, 1, 0.01], strength: [-2, 2, 0.1], ...(cfg.ranges ?? {}) };
  const sliderKeys = cfg.sliders ?? [];
  const minScale = cfg.minScale ?? 0.03, duration = cfg.duration ?? 3000;
  const st = { fi: 0, k: cfg.strength ?? 1, w: cfg.size?.w ?? 1, h: cfg.size?.h ?? 0.7, sc: cfg.scale ?? 1, C: [...(cfg.corner ?? [-0.4, -0.3])], shrinking: false };
  const nF = cfg.nField ?? [9, 6];
  const f0 = () => fields[st.fi];
  const ecol = ['var(--basis)', 'var(--vec)', 'var(--covec)', 'var(--ink)'];
  const enames = [barL.bottom, barL.right, barL.top, barL.left];

  const W = 360, PX = 12, PW = W - 24, sc0 = PW / (x1 - x0), PH = Math.round((y1 - y0) * sc0), PY = 8, rowH = 22;
  const nBar = (barKeys.includes('edges') ? 4 : 0) + (barKeys.includes('circ') ? 1 : 0) + (barKeys.includes('curlArea') ? 1 : 0);
  const BY = PY + PH + 14, H = BY + (show.bars ? nBar * rowH : 0) + 4;
  const X = x => PX + (x - x0) * sc0, Y = y => PY + (y1 - y) * sc0;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.picture });

  const num = (v, d = dec) => { const t = (+v).toFixed(d); return (Math.abs(+t) < Math.pow(10, -d) ? (0).toFixed(d) : t).replace('-', '−'); };
  const dims = () => ({ w: st.w * st.sc, ht: st.h * st.sc });
  const fit = () => { const { w, ht } = dims(); st.C[0] = clamp(st.C[0], x0, x1 - w); st.C[1] = clamp(st.C[1], y0, y1 - ht); };

  let gridMax = 1;
  const gridMaxOf = f => { let m = 1e-9; for (let i = 0; i < nF[0]; i++) for (let j = 0; j < nF[1]; j++) m = Math.max(m, Math.hypot(...fieldForce(f, x0 + (i + 0.5) / nF[0] * (x1 - x0), y0 + (j + 0.5) / nF[1] * (y1 - y0), 1))); return m; };
  gridMax = gridMaxOf(f0());
  const arrowPath = (g, x, y, dx, dy, col, w, head) => {
    const L = Math.hypot(dx, dy); if (L < 1.5) return;
    const ux = dx / L, uy = dy / L, hd = Math.min(head, L * 0.6);
    g.append(s('line', { x1: x, y1: y, x2: x + dx - ux * hd * 0.6, y2: y + dy - uy * hd * 0.6, stroke: col, 'stroke-width': w, 'stroke-linecap': 'round' }),
      s('polygon', { fill: col, points: `${x + dx},${y + dy} ${x + dx - ux * hd - uy * hd * 0.5},${y + dy - uy * hd + ux * hd * 0.5} ${x + dx - ux * hd + uy * hd * 0.5},${y + dy - uy * hd - ux * hd * 0.5}` }));
  };

  function paint() {
    fit();
    const f = f0(), { w, ht } = dims(), [cx, cy] = st.C, area = w * ht;
    const { edges, circ } = edgeWorks(f, cx, cy, w, ht, st.k);
    const atC = cfg.curlAt === 'center', mx = atC ? cx + w / 2 : cx, my = atC ? cy + ht / 2 : cy, p = partials(f, mx, my, st.k), curl = p.dFydx - p.dFxdy, ca = curl * area;
    svg.replaceChildren();
    svg.append(s('rect', { x: PX, y: PY, width: PW, height: PH, fill: 'none', stroke: 'var(--line, #ccc)', 'stroke-width': 1 }));
    if (show.field) {
      const g = s('g'), cell = PW / nF[0], maxLen = Math.min(cell, PH / nF[1]) * 0.8;
      for (let i = 0; i < nF[0]; i++) for (let j = 0; j < nF[1]; j++) {
        const x = x0 + (i + 0.5) / nF[0] * (x1 - x0), y = y0 + (j + 0.5) / nF[1] * (y1 - y0), F = fieldForce(f, x, y, st.k), m = Math.hypot(...F) / gridMax;
        if (m < 1e-6) continue;
        const L = maxLen * Math.min(1, m), ux = F[0] / Math.hypot(...F), uy = F[1] / Math.hypot(...F);
        arrowPath(g, X(x) - ux * L / 2, Y(y) + uy * L / 2, ux * L, -uy * L, 'var(--muted)', 1.4, 4.5);
      }
      svg.append(g);
    }
    const P = [[cx, cy], [cx + w, cy], [cx + w, cy + ht], [cx, cy + ht], [cx, cy]];
    if (show.loop) {
      svg.append(s('rect', { x: X(cx), y: Y(cy + ht), width: Math.max(w * sc0, 1), height: Math.max(ht * sc0, 1), fill: 'var(--ink)', opacity: 0.06 }));
      for (let i = 0; i < 4; i++) {
        const a = P[i], b = P[i + 1];
        svg.append(s('line', { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), stroke: ecol[i], 'stroke-width': 3, 'stroke-linecap': 'round' }));
        if (show.edgeArrows) {
          const mxp = (X(a[0]) + X(b[0])) / 2, myp = (Y(a[1]) + Y(b[1])) / 2, L = Math.hypot(X(b[0]) - X(a[0]), Y(b[1]) - Y(a[1]));
          if (L > 18) { const ux = (X(b[0]) - X(a[0])) / L, uy = (Y(b[1]) - Y(a[1])) / L; arrowPath(svg, mxp - ux * 5, myp - uy * 5, ux * 10, uy * 10, ecol[i], 2.4, 7); }
        }
      }
    }
    if (show.edgeLabels && show.loop) {
      const lab = (txt, x, y, anchor, col) => svg.append(s('text', { x, y, 'font-size': 11, 'font-weight': 700, 'text-anchor': anchor, fill: col, stroke: 'var(--bg, #fff)', 'stroke-width': 3, 'paint-order': 'stroke', style: 'font-variant-numeric:tabular-nums' }, txt));
      const bx = X(cx + w / 2), by = Y(cy), tx = X(cx + w / 2), ty = Y(cy + ht), rx = X(cx + w), ly = Y(cy + ht / 2), lx = X(cx);
      const cl = v => clamp(v, PX + 22, W - PX - 22);
      lab(num(edges[0]), cl(bx), clamp(by + 14, PY + 10, PY + PH - 3), 'middle', ecol[0]);
      lab(num(edges[2]), cl(tx), clamp(ty - 6, PY + 10, PY + PH - 3), 'middle', ecol[2]);
      const roomR = rx + 8 + 44 < W - PX, roomL = lx - 8 - 44 > PX;
      lab(num(edges[1]), roomR ? rx + 8 : rx - 8, clamp(ly + 4, PY + 10, PY + PH - 3), roomR ? 'start' : 'end', ecol[1]);
      lab(num(edges[3]), roomL ? lx - 8 : lx + 8, clamp(ly + 4, PY + 10, PY + PH - 3), roomL ? 'end' : 'start', ecol[3]);
    }
    if (show.corner) {
      svg.append(s('circle', { cx: X(cx), cy: Y(cy), r: 7, fill: 'var(--bg, #fff)', stroke: 'var(--ink)', 'stroke-width': 2.5, style: 'pointer-events:none' }),
        s('circle', { cx: X(cx), cy: Y(cy), r: 20, fill: 'transparent', 'data-i': 'c', style: 'cursor:grab;touch-action:none' }));
    }
    if (show.bars && nBar) {
      const rows = [];
      if (barKeys.includes('edges')) edges.forEach((v, i) => rows.push({ label: enames[i], value: v, color: ecol[i] }));
      if (barKeys.includes('circ')) rows.push({ label: barL.circ, value: circ, color: 'var(--ink)' });
      if (barKeys.includes('curlArea')) rows.push({ label: barL.curlArea, value: ca, color: 'var(--muted)' });
      const top = cfg.barMax ?? Math.max(1e-12, ...rows.map(r => Math.abs(r.value))) * 1.15;
      const bx0 = PX + 78, bx1 = W - PX - 56, mid = (bx0 + bx1) / 2, half = (bx1 - bx0) / 2, g = s('g');
      g.append(s('line', { x1: mid, y1: BY - 4, x2: mid, y2: BY + rows.length * rowH - 2, stroke: 'var(--ink)', 'stroke-width': 1 }));
      rows.forEach((r, i) => {
        const y = BY + i * rowH, len = clamp(r.value / top, -1, 1) * half;
        if (show.labels) g.append(s('text', { x: PX, y: y + 12, 'font-size': 10.5, 'font-weight': 650, fill: r.color === 'var(--muted)' ? 'var(--ink)' : r.color }, r.label));
        g.append(s('rect', { x: Math.min(mid, mid + len), y: y + 1, width: Math.abs(len), height: 15, fill: r.color }),
          s('text', { x: W - PX, y: y + 12.5, 'font-size': 11, 'text-anchor': 'end', fill: 'var(--ink)', style: 'font-variant-numeric:tabular-nums' }, `${num(r.value)} ${U.work}`));
      });
      svg.append(g);
    }
    // readouts
    const set = (id, txt) => { if (rd[id]) rd[id].textContent = txt; };
    edges.forEach((v, i) => set(`e${i}`, `${num(v)} ${U.work}`));
    set('circ', `${num(circ)} ${U.work}`);
    set('curl', `${num(curl)}`);
    set('curlArea', `${num(ca)} ${U.work}`);
    set('perArea', `${num(circ / area)}`);
    set('terms', `${Lb.dFydx} = ${num(p.dFydx)},  ${Lb.dFxdy} = ${num(p.dFxdy)}`);
    set('size', `${num(w, 2)} × ${num(ht, 2)} ${U.length}, ${Lb.area} ${num(area)}`);
    const tiny = Math.abs(ca) < 1e-9 && Math.abs(circ) < Math.pow(10, -dec) / 2;
    set('ratio', Math.abs(ca) < 1e-9 ? (tiny ? Lb.bothZero : '—') : num(circ / ca));
    fieldBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === st.fi)));
    for (const [key, inp] of Object.entries(inps)) { const v = stOf(key); inp.value = v; vals[key].textContent = num(v, 2); }
  }
  const stOf = key => ({ width: st.w, height: st.h, size: st.sc, strength: st.k })[key];

  const rd = {}, inps = {}, vals = {};
  const cell = (label, id) => h('div', { class: 'fs-cell' }, show.labels ? h('div', { class: 'fs-lab' }, mdInline(label)) : '', rd[id] = h('div', { class: 'fs-num', role: 'status' }));
  const cells = [];
  for (const key of reads) {
    if (key === 'edges') enames.forEach((n, i) => cells.push(cell(n, `e${i}`)));
    else if (['circ', 'curl', 'curlArea', 'ratio', 'perArea', 'terms', 'size'].includes(key)) cells.push(cell(Lb[key], key));
  }
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const fieldBtns = fields.length > 1 ? fields.map((fd, i) => btn(fd.label ?? `${i + 1}`, () => { st.fi = i; stopShrink(); gridMax = gridMaxOf(f0()); paint(); })) : [];
  let raf = 0, shrinkBtn = null;
  function stopShrink() { st.shrinking = false; cancelAnimationFrame(raf); }
  function shrink() {
    stopShrink(); st.shrinking = true;
    const from = st.sc, t0 = performance.now();
    const tick = now => {
      if (!el.isConnected) return;
      const u = Math.min(1, (now - t0) / duration);
      st.sc = from * Math.pow(minScale / from, u);       // geometric: equal steps in log size
      paint();
      if (u < 1 && st.shrinking) raf = requestAnimationFrame(tick); else st.shrinking = false;
    };
    raf = requestAnimationFrame(tick);
  }
  shrinkBtn = show.shrink ? btn(Lb.shrink, () => shrink()) : null;
  const resetBtn = show.shrink ? btn(Lb.reset, () => { stopShrink(); st.sc = cfg.scale ?? 1; paint(); }) : null;
  const sliderEls = sliderKeys.map(key => {
    const [lo, hi, step] = R[key];
    const inp = inps[key] = h('input', { type: 'range', min: lo, max: hi, step, value: stOf(key), 'aria-label': Lb[key] ?? key });
    inp.addEventListener('input', () => {
      stopShrink(); const v = +inp.value;
      if (key === 'width') st.w = v; else if (key === 'height') st.h = v; else if (key === 'size') st.sc = v; else { st.k = v; }
      paint();
    });
    return h('label', { class: 'fs-slide stack' }, h('span', { class: 'fs-lab' }, mdInline(Lb[key] ?? key)), inp, vals[key] = h('span', { class: 'fs-num' }));
  });
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && cells.length ? h('div', { class: 'fs-reads' }, cells) : '',
    sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', h('div', { class: 'wbtns' }, shrinkBtn ?? '', resetBtn ?? '', show.fieldButtons ? fieldBtns : ''));

  let drag = false;
  const toWorld = ev => { const m = svg.getScreenCTM(); if (!m) return null; const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(m.inverse()); return [x0 + (q.x - PX) / sc0, y1 - (q.y - PY) / sc0]; };
  svg.addEventListener('pointerdown', ev => { if (ev.target?.getAttribute?.('data-i') == null) return; drag = true; stopShrink(); svg.setPointerCapture?.(ev.pointerId); ev.preventDefault(); });
  svg.addEventListener('pointermove', ev => { if (!drag) return; const w = toWorld(ev); if (!w) return; st.C = w; paint(); });
  const up = () => { drag = false; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('touchmove', ev => { if (drag) ev.preventDefault(); }, { passive: false });
  paint();
}
