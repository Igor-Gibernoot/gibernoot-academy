// work-path
//
// A force field F(x, y) in the plane and two or three roads from A to B. A dot walks each road
// and the work W = integral of F . dr is accumulated along it (running readout, one bar per road),
// so the reader can compare roads between the same endpoints. Conservative fields (uniform, spring)
// give the same final W on every road; the swirl does not. Fully general: all wording from the config.
//
//   fields: [ { label, type, ... } ]          one or more fields; two or more give a row of switch buttons. (`field: {...}` = a single one)
//       type 'uniform': F = (fx, fy)                                   { fx: 0, fy: 1 }
//       type 'spring':  F = -k (r - c)                                 { k: 1, center: [0,0] }
//       type 'swirl':   F = k (-(y - cy), (x - cx))  (curl = 2k)       { k: 1, center: [0,0] }
//       type 'shear':   F = (k y, 0)  (curl = -k)                      { k: 1 }
//   A: [-1.2, -0.5], B: [1.2, 0.5]             the end points (world units)
//   view: [-1.6, 1.6, -1.1, 1.1]               [xmin, xmax, ymin, ymax]; the picture keeps this aspect
//   roads: [ { kind, label, color, ... } ]     2 or 3 roads, default straight + bent + arc
//       kind 'straight'
//       kind 'bent':    A -> via -> B (default via = corner (B.x, A.y))       { via: [x, y] }
//       kind 'arc':     circular arc with sagitta = bulge x chord (sign = side)  { bulge: 0.4 }
//       kind 'control': quadratic curve with a control point (draggable)       { control: [x, y] }
//       color: any CSS colour (default var(--vec), var(--covec), var(--basis))
//   strength: 1                                multiplies the field (slider 'strength')
//   sliders: ['strength']                      which sliders to show (default none)
//   ranges: { strength: [-2, 2, 0.1] }
//   units: { work: 'J', length: 'm', force: 'N' }
//   duration: 4000, autoplay: true             length of one walk (ms) and whether it starts on load
//   barMax: auto                               work at the end of the bar axis (auto from the field and roads)
//   decimals: 2                                digits shown in the work values
//   show: { field, roads, trail, markers, endLabels, dots, forceArrows, bars, handle, scrub, play, readouts, fieldButtons, labels }
//       all default true.  field = the grid of field arrows; roads = the faint full roads; trail = the thick part of each road
//       already walked; markers = the A and B points; endLabels = the letters A and B; dots = the walking dots;
//       forceArrows = the force arrow at each dot; bars = the bar chart (one bar per road); handle = the draggable control
//       point of 'control' roads; scrub = slider for the walked fraction; play = the play/replay button; readouts = the
//       readout cells; fieldButtons = the field switch row; labels = road names on bars and readouts, axis caption.
//   readouts: ['work','spread']                'work' = running work per road, 'final' = work over the whole road,
//                                              'spread' = largest minus smallest final work (zero = same on every road)
//   nField: [9, 6]                             columns and rows of the field-arrow grid
//   labels: { A, B, play, replay, reset, work, final, spread, roadN, same, differ, scrub, picture }
//   Exported pure model for script checks: fieldForce, roadPoints, workAlong.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- pure model -------------------------------------------------------------------------
export function fieldForce(f, x, y, k = 1) {
  const c = f.center ?? [0, 0], q = (f.k ?? 1) * k;
  switch (f.type) {
    case 'spring': return [-q * (x - c[0]), -q * (y - c[1])];
    case 'swirl': return [-q * (y - c[1]), q * (x - c[0])];
    case 'shear': return [q * y, 0];
    default: return [(f.fx ?? 0) * k, (f.fy ?? 0) * k];
  }
}

// Points of a road from A to B (n + 1 points, equal steps of the road's own parameter).
export function roadPoints(road, A, B, n = 400) {
  const pts = [], dx = B[0] - A[0], dy = B[1] - A[1], chord = Math.hypot(dx, dy) || 1;
  if (road.kind === 'bent') {
    const V = road.via ?? [B[0], A[1]], l1 = Math.hypot(V[0] - A[0], V[1] - A[1]), l2 = Math.hypot(B[0] - V[0], B[1] - V[1]);
    for (let i = 0; i <= n; i++) {
      const u = i / n * (l1 + l2);
      pts.push(u <= l1 ? [A[0] + (V[0] - A[0]) * (l1 ? u / l1 : 0), A[1] + (V[1] - A[1]) * (l1 ? u / l1 : 0)]
        : [V[0] + (B[0] - V[0]) * ((u - l1) / (l2 || 1)), V[1] + (B[1] - V[1]) * ((u - l1) / (l2 || 1))]);
    }
  } else if (road.kind === 'control') {
    const P = road.control ?? [(A[0] + B[0]) / 2 - dy * 0.4, (A[1] + B[1]) / 2 + dx * 0.4];
    for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; pts.push([a * A[0] + b * P[0] + c * B[0], a * A[1] + b * P[1] + c * B[1]]); }
  } else if (road.kind === 'arc' && Math.abs(road.bulge ?? 0.4) > 1e-6) {
    const bl = clamp(road.bulge ?? 0.4, -0.5, 0.5), sag = Math.abs(bl) * chord, sg = Math.sign(bl);
    const R = (chord * chord / 4 + sag * sag) / (2 * sag), nx = -dy / chord, ny = dx / chord;     // n = left of A -> B
    const C = [(A[0] + B[0]) / 2 + sg * nx * (sag - R), (A[1] + B[1]) / 2 + sg * ny * (sag - R)];
    const a0 = Math.atan2(A[1] - C[1], A[0] - C[0]), sweep = -sg * 2 * Math.asin(clamp(chord / (2 * R), -1, 1));
    for (let i = 0; i <= n; i++) { const a = a0 + sweep * i / n; pts.push([C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)]); }
    pts[0] = [...A]; pts[n] = [...B];
  } else {
    for (let i = 0; i <= n; i++) pts.push([A[0] + dx * i / n, A[1] + dy * i / n]);
  }
  return pts;
}

// Work of the field along the polyline (midpoint rule): cum[i] = work from the start to point i, len[i] = arc length.
export function workAlong(f, pts, k = 1) {
  const cum = [0], len = [0];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], F = fieldForce(f, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, k);
    cum.push(cum[i - 1] + F[0] * (b[0] - a[0]) + F[1] * (b[1] - a[1]));
    len.push(len[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return { cum, len, total: cum[cum.length - 1], length: len[len.length - 1] };
}

// ---- widget -----------------------------------------------------------------------------
export function workPath(el, cfg) {
  const Lb = { A: 'A', B: 'B', play: 'Play', replay: 'Replay', reset: 'Reset', work: 'Work', final: 'Total work', spread: 'Largest difference',
    roadN: 'Road', same: 'same on every road', differ: 'depends on the road', scrub: 'Fraction of the road', picture: 'Force field and roads from A to B',
    strength: 'Field strength', ...(cfg.labels ?? {}) };
  const show = { field: true, roads: true, trail: true, markers: true, endLabels: true, dots: true, forceArrows: true, bars: true, handle: true,
    scrub: true, play: true, readouts: true, fieldButtons: true, labels: true, ...(cfg.show ?? {}) };
  const U = { work: 'J', length: 'm', force: 'N', ...(cfg.units ?? {}) };
  const reads = cfg.readouts ?? ['work', 'spread'], dec = cfg.decimals ?? 2;
  const A = cfg.A ?? [-1.2, -0.5], B = cfg.B ?? [1.2, 0.5];
  const [x0, x1, y0, y1] = cfg.view ?? [-1.6, 1.6, -1.1, 1.1];
  const fields = cfg.fields ?? (cfg.field ? [cfg.field] : [{ type: 'uniform', fx: 0, fy: 1 }]);
  const palette = ['var(--vec)', 'var(--covec)', 'var(--basis)'];
  const roads = (cfg.roads ?? [{ kind: 'straight' }, { kind: 'bent' }, { kind: 'arc', bulge: 0.4 }]).slice(0, 3)
    .map((r, i) => ({ ...r, label: r.label ?? `${Lb.roadN} ${i + 1}`, color: r.color ?? palette[i], control: r.control ? [...r.control] : undefined }));
  const R = { strength: [-2, 2, 0.1], ...(cfg.ranges ?? {}) };
  const sliderKeys = cfg.sliders ?? [];
  const st = { fi: 0, k: cfg.strength ?? 1, u: 0, playing: false };
  const nF = cfg.nField ?? [9, 6], duration = cfg.duration ?? 4000;
  const f0 = () => fields[st.fi];

  // geometry (px): the picture, then the bars
  const W = 360, PX = 12, PW = W - 24, sc = PW / (x1 - x0), PH = Math.round((y1 - y0) * sc), PY = 8;
  const rowH = 22, BY = PY + PH + 14, H = show.bars ? BY + roads.length * rowH + 6 : PY + PH + 6;
  const X = x => PX + (x - x0) * sc, Y = y => PY + (y1 - y) * sc;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.picture });

  // roads and work, rebuilt when the field, strength or a control point changes
  let data = [], ref = 1;
  const build = () => {
    data = roads.map(r => { const pts = roadPoints(r, A, B); return { pts, ...workAlong(f0(), pts, st.k) }; });
  };
  const refScale = () => {                      // bar scale at strength 1 of the start geometry, so the axis stays put under sliders
    const q = fields.map(f => Math.max(...roads.map(r => Math.abs(workAlong(f, roadPoints(r, A, B, 100), 1).total))));
    return Math.max(1e-9, ...q);
  };
  let gridMax = 1;
  const fieldMax = () => {
    let m = 1e-9;
    for (const f of fields) for (let i = 0; i < nF[0]; i++) for (let j = 0; j < nF[1]; j++) {
      const F = fieldForce(f, x0 + (i + 0.5) / nF[0] * (x1 - x0), y0 + (j + 0.5) / nF[1] * (y1 - y0), 1); m = Math.max(m, Math.hypot(...F));
    }
    for (const r of roads) for (const p of roadPoints(r, A, B, 20)) for (const f of fields) m = Math.max(m, Math.hypot(...fieldForce(f, p[0], p[1], 1)));
    return m;
  };
  ref = refScale(); gridMax = fieldMax();

  const num = v => { const t = (+v).toFixed(dec); return (Math.abs(+t) < Math.pow(10, -dec) ? (0).toFixed(dec) : t).replace('-', '−'); };
  const at = (d, u) => {                        // point, work so far and tangent at fraction u of the arc length
    const target = u * d.length; let i = 1;
    while (i < d.pts.length - 1 && d.len[i] < target) i++;
    const l0 = d.len[i - 1], l1 = d.len[i], t = l1 > l0 ? clamp((target - l0) / (l1 - l0), 0, 1) : 0, p = d.pts[i - 1], q = d.pts[i];
    return { x: p[0] + (q[0] - p[0]) * t, y: p[1] + (q[1] - p[1]) * t, w: d.cum[i - 1] + (d.cum[i] - d.cum[i - 1]) * t };
  };
  const arrowPath = (g, x, y, dx, dy, col, w, head) => {              // pixel arrow from (x, y) by (dx, dy)
    const L = Math.hypot(dx, dy); if (L < 1.5) return;
    const ux = dx / L, uy = dy / L, hd = Math.min(head, L * 0.6);
    g.append(s('line', { x1: x, y1: y, x2: x + dx - ux * hd * 0.6, y2: y + dy - uy * hd * 0.6, stroke: col, 'stroke-width': w, 'stroke-linecap': 'round' }),
      s('polygon', { fill: col, points: `${x + dx},${y + dy} ${x + dx - ux * hd - uy * hd * 0.5},${y + dy - uy * hd + ux * hd * 0.5} ${x + dx - ux * hd + uy * hd * 0.5},${y + dy - uy * hd - ux * hd * 0.5}` }));
  };
  const pathD = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join(' ');
  const finals = () => data.map(d => d.total);
  const spreadVal = () => { const f = finals(); return Math.max(...f) - Math.min(...f); };

  function paint() {
    svg.replaceChildren();
    svg.append(s('rect', { x: PX, y: PY, width: PW, height: PH, fill: 'none', stroke: 'var(--line, #ccc)', 'stroke-width': 1 }));
    if (show.field) {
      const g = s('g'), cell = PW / nF[0], maxLen = Math.min(cell, PH / nF[1]) * 0.8;
      for (let i = 0; i < nF[0]; i++) for (let j = 0; j < nF[1]; j++) {
        const x = x0 + (i + 0.5) / nF[0] * (x1 - x0), y = y0 + (j + 0.5) / nF[1] * (y1 - y0), F = fieldForce(f0(), x, y, st.k);
        const m = Math.hypot(...F) / gridMax; if (m < 1e-6) continue;
        const L = maxLen * Math.min(1, m), ux = F[0] / Math.hypot(...F), uy = F[1] / Math.hypot(...F);
        arrowPath(g, X(x) - ux * L / 2, Y(y) + uy * L / 2, ux * L, -uy * L, 'var(--muted)', 1.4, 4.5);
      }
      svg.append(g);
    }
    data.forEach((d, i) => {
      const r = roads[i];
      if (show.roads) svg.append(s('path', { d: pathD(d.pts), fill: 'none', stroke: r.color, 'stroke-width': 2, opacity: show.trail ? 0.3 : 0.9, 'stroke-linejoin': 'round' }));
      if (show.trail && st.u > 0) {
        const k = Math.max(1, d.len.findIndex(l => l >= st.u * d.length)), sub = d.pts.slice(0, k + 1);
        const e = at(d, st.u); sub.push([e.x, e.y]);
        svg.append(s('path', { d: pathD(sub), fill: 'none', stroke: r.color, 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      }
    });
    if (show.markers) {
      for (const [P, name] of [[A, Lb.A], [B, Lb.B]]) {
        svg.append(s('circle', { cx: X(P[0]), cy: Y(P[1]), r: 5, fill: 'var(--ink)', stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
        if (show.endLabels) svg.append(s('text', { x: X(P[0]) + (P === A ? -9 : 9), y: Y(P[1]) + (P === A ? 14 : -7), 'font-size': 12, 'font-weight': 700, 'text-anchor': P === A ? 'end' : 'start', fill: 'var(--ink)' }, name));
      }
    }
    if (show.dots || show.forceArrows) {
      data.forEach((d, i) => {
        const e = at(d, st.u), r = roads[i];
        if (show.forceArrows) {
          const F = fieldForce(f0(), e.x, e.y, st.k), m = Math.hypot(...F) / gridMax;
          if (m > 1e-6) { const L = 34 * Math.min(1.2, m); arrowPath(svg, X(e.x), Y(e.y), F[0] / Math.hypot(...F) * L, -F[1] / Math.hypot(...F) * L, 'var(--ink)', 2.4, 7); }
        }
        if (show.dots) svg.append(s('circle', { cx: X(e.x), cy: Y(e.y), r: 5.5, fill: r.color, stroke: 'var(--bg, #fff)', 'stroke-width': 1.8 }));
      });
    }
    if (show.handle) roads.forEach((r, i) => {
      if (r.kind !== 'control') return;
      const P = r.control ?? (r.control = [(A[0] + B[0]) / 2 - (B[1] - A[1]) * 0.4, (A[1] + B[1]) / 2 + (B[0] - A[0]) * 0.4]);
      svg.append(s('circle', { cx: X(P[0]), cy: Y(P[1]), r: 7, fill: 'var(--bg, #fff)', stroke: r.color, 'stroke-width': 2.5, 'data-i': i, style: 'cursor:grab;touch-action:none' }),
        s('circle', { cx: X(P[0]), cy: Y(P[1]), r: 20, fill: 'transparent', 'data-i': i, style: 'cursor:grab;touch-action:none' }));
    });
    if (show.bars) {
      const bx0 = PX + 70, bx1 = W - PX - 52, mid = (bx0 + bx1) / 2, half = (bx1 - bx0) / 2;
      const top = cfg.barMax ?? Math.max(ref * Math.max(Math.abs(st.k), 0.1) * 1.2, Math.max(...finals().map(Math.abs)) * 1.05);
      const g = s('g');
      g.append(s('line', { x1: mid, y1: BY - 4, x2: mid, y2: BY + roads.length * rowH - 2, stroke: 'var(--ink)', 'stroke-width': 1 }));
      data.forEach((d, i) => {
        const y = BY + i * rowH, w = at(d, st.u).w, len = clamp(w / top, -1, 1) * half, r = roads[i];
        if (show.labels) g.append(s('text', { x: PX, y: y + 12, 'font-size': 10.5, 'font-weight': 650, fill: r.color }, r.label));
        g.append(s('rect', { x: Math.min(mid, mid + len), y: y + 1, width: Math.abs(len), height: 15, fill: r.color }),
          s('text', { x: W - PX, y: y + 12.5, 'font-size': 11, 'text-anchor': 'end', fill: 'var(--ink)', style: 'font-variant-numeric:tabular-nums' }, `${num(w)} ${U.work}`));
      });
      svg.append(g);
    }
    // readouts and controls
    const f = finals();
    for (const key of reads) {
      if (key === 'work') data.forEach((d, i) => { if (rd[`w${i}`]) rd[`w${i}`].textContent = `${num(at(d, st.u).w)} ${U.work}`; });
      if (key === 'final') data.forEach((d, i) => { if (rd[`f${i}`]) rd[`f${i}`].textContent = `${num(f[i])} ${U.work}`; });
      if (key === 'spread' && rd.spread) rd.spread.textContent = `${num(spreadVal())} ${U.work}` + (show.labels ? ` (${spreadVal() < Math.pow(10, -dec) / 2 ? Lb.same : Lb.differ})` : '');
    }
    if (scrub) scrub.value = st.u;
    if (playBtn) playBtn.textContent = st.u >= 1 && !st.playing ? Lb.replay : Lb.play;
    fieldBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === st.fi)));
    for (const [key, inp] of Object.entries(inps)) { inp.value = st[key === 'strength' ? 'k' : key]; vals[key].textContent = num(st.k); }
  }

  // controls
  const rd = {}, inps = {}, vals = {};
  const cell = (label, id) => h('div', { class: 'fs-cell' }, show.labels ? h('div', { class: 'fs-lab' }, mdInline(label)) : '', rd[id] = h('div', { class: 'fs-num', role: 'status' }));
  const cells = [];
  for (const key of reads) {
    if (key === 'work') roads.forEach((r, i) => cells.push(cell(`${Lb.work}, ${r.label}`, `w${i}`)));
    if (key === 'final') roads.forEach((r, i) => cells.push(cell(`${Lb.final}, ${r.label}`, `f${i}`)));
    if (key === 'spread') cells.push(cell(Lb.spread, 'spread'));
  }
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const fieldBtns = fields.length > 1 ? fields.map((fd, i) => btn(fd.label ?? `${i + 1}`, () => { st.fi = i; build(); play(); })) : [];
  const playBtn = show.play ? btn(Lb.play, () => play()) : null;
  const scrub = show.scrub ? h('input', { type: 'range', min: 0, max: 1, step: 0.002, value: 0, 'aria-label': Lb.scrub }) : null;
  if (scrub) scrub.addEventListener('input', () => { stop(); st.u = +scrub.value; paint(); });
  const sliderEls = sliderKeys.map(key => {
    const [lo, hi, step] = R[key] ?? R.strength;
    const inp = inps[key] = h('input', { type: 'range', min: lo, max: hi, step, value: st.k, 'aria-label': Lb[key] ?? key });
    inp.addEventListener('input', () => { st.k = +inp.value; build(); paint(); });
    return h('label', { class: 'fs-slide stack' }, h('span', { class: 'fs-lab' }, mdInline(Lb[key] ?? key)), inp, vals[key] = h('span', { class: 'fs-num' }));
  });
  const rows = [];
  if (scrub) rows.push(h('label', { class: 'fs-slide stack' }, h('span', { class: 'fs-lab' }, mdInline(Lb.scrub)), scrub, h('span', { class: 'fs-num' })));
  const btns = h('div', { class: 'wbtns' }, playBtn ?? '', show.fieldButtons ? fieldBtns : '');
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && cells.length ? h('div', { class: 'fs-reads' }, cells) : '',
    sliderEls.length || rows.length ? h('div', { class: 'fs-sliders' }, rows, sliderEls) : '', btns);

  // animation
  let raf = 0, t0 = 0;
  function stop() { st.playing = false; cancelAnimationFrame(raf); }
  function play() {
    stop(); st.playing = true; st.u = 0; t0 = performance.now(); paint();
    const tick = now => {
      if (!el.isConnected) return;
      st.u = Math.min(1, (now - t0) / duration);
      if (st.u >= 1) st.playing = false;
      paint();
      if (st.playing) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  // dragging the control point (mouse and touch)
  let drag = -1;
  const toWorld = ev => { const m = svg.getScreenCTM(); if (!m) return null; const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(m.inverse()); return [x0 + (q.x - PX) / sc, y1 - (q.y - PY) / sc]; };
  svg.addEventListener('pointerdown', ev => {
    const i = ev.target?.getAttribute?.('data-i'); if (i == null || !show.handle) return;
    drag = +i; stop(); svg.setPointerCapture?.(ev.pointerId); ev.preventDefault();
  });
  svg.addEventListener('pointermove', ev => {
    if (drag < 0) return;
    const w = toWorld(ev); if (!w) return;
    roads[drag].control = [clamp(w[0], x0, x1), clamp(w[1], y0, y1)];
    st.u = 1; build(); paint();
  });
  const up = () => { drag = -1; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('touchmove', ev => { if (drag >= 0) ev.preventDefault(); }, { passive: false });

  build(); st.u = 0; paint();
  if (cfg.autoplay === false) { st.u = 1; paint(); } else play();
}
