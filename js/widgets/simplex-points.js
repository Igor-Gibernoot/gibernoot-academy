// simplex-points
//
// The probability simplex of three outcomes, drawn as an equilateral triangle. A point is a
// distribution p = (p1, p2, p3), p_i > 0, sum 1; its position is the barycentric combination
// of the vertices (vertex i = "outcome i has probability 1"). Up to three points, each fixed
// or draggable. Readouts per pair (all optional):
//   Euclidean distance   |p - q| = sqrt(sum_i (p_i - q_i)^2)       (in the p-space; the side of the
//                        triangle is sqrt(2))
//   D_KL[p:q] = sum_i p_i ln(p_i / q_i)  and  D_KL[q:p]            (nats, with bars)
//   midpoint m = (p + q)/2:  D_KL[p:m], D_KL[m:p], D_KL[q:m], D_KL[m:q]
//
// Config (names are TeX; outcome names are markdown inline):
//   outcomes: ['1','2','3']              vertex labels (bottom-left, bottom-right, top)
//   points: [{ name: 'p', tag, p: [p1,p2,p3], fixed: false, hue: 'vec'|'covec'|'basis'|'gold' }]
//                                        1 to 3 points; `tag` = text in the picture (default name)
//   showKL: true                         D_KL both ways, with bars, for every pair
//   showEuclid: false                    straight-line distance (bar), for every pair
//   showMidpoints: false                 midpoint marker and the four KL to it, for every pair
//   showComponents: true                 component readout of every point
//   pairs: [[0,1]]                       which pairs the readouts / segment / midpoint use
//                                        (default: all pairs of the points)
//   segment: false                       draw the straight segment of every pair (true, or a
//                                        list of pairs like pairs)
//   family: [{ type:'mixture', a:0, b:1 } | { type:'exponential', a:0, b:1 } |
//            { type:'curve', ps:[[..],..] }, name?, hue?]
//                                        curves in the simplex through points a and b (indices
//                                        into points): mixture = (1-t)p + t q, exponential =
//                                        p^(1-t) q^t / Z, t in [tMin, tMax] (clipped to the simplex)
//   tMin: -2, tMax: 3                    parameter range of the families
//   grid: true                           faint lines p_i = 0.1, 0.2, ...
//   ticks: false                         write 0.25 / 0.5 / 0.75 along the edges
//   snap: 0                              snap dragged components to a multiple (e.g. 0.05)
//   eps: 0.01                            smallest allowed component while dragging
//   barMax: 3                            nats at the full width of a KL bar
//   presets: [{ label, points: [[p1,p2,p3], ...] }]   buttons that move the points
//   reset: true                          a "Reset" button (only when some point is draggable)
//   labels: { components, euclid, kl, mid, reset }
//
// el.dataset: p (points joined by ' | ', components by ','), d (Euclid per pair), kl ("p:q" values
// per pair, forward then backward, joined by ','), klmid (per pair, four values).

import { h } from '../dom.js';
import { mdInline, tex } from '../render.js';
import { s } from './plane.js';

const M = src => h('span', { html: mdInline(String(src)) });
const T = src => h('span', { html: tex(String(src)) });
const HUES = { vec: 'var(--vec)', covec: 'var(--covec)', basis: 'var(--basis)', gold: 'var(--gold)' };
const DEF_HUES = ['vec', 'covec', 'basis'];
export const SIDE = 100, HGT = SIDE * Math.sqrt(3) / 2;
export const V = [[0, HGT], [SIDE, HGT], [SIDE / 2, 0]];           // svg coordinates of the vertices

export const toXY = p => [p[0] * V[0][0] + p[1] * V[1][0] + p[2] * V[2][0], p[0] * V[0][1] + p[1] * V[1][1] + p[2] * V[2][1]];
export function toP([x, y]) {
  const p3 = (HGT - y) / HGT;
  const p2 = (x - V[0][0] - p3 * (V[2][0] - V[0][0])) / SIDE;
  return [1 - p2 - p3, p2, p3];
}
export const norm = p => { const t = p.reduce((a, b) => a + b, 0) || 1; return p.map(x => x / t); };
export const kl = (p, q) => p.reduce((a, pi, i) => a + (pi > 0 ? pi * Math.log(pi / q[i]) : 0), 0);
const euclid = (p, q) => Math.hypot(...p.map((x, i) => x - q[i]));
const mid = (p, q) => p.map((x, i) => (x + q[i]) / 2);
const f2 = x => x.toFixed(2);
const f3 = x => x.toFixed(3);

export function simplexPoints(el, cfg) {
  const outs = cfg.outcomes ?? ['1', '2', '3'];
  const pts0 = (cfg.points ?? [{ name: 'p', p: [0.6, 0.3, 0.1] }, { name: 'q', p: [0.2, 0.3, 0.5] }]).slice(0, 3);
  const N = pts0.length;
  const eps = cfg.eps ?? 0.01, snap = cfg.snap ?? 0, barMax = cfg.barMax ?? 3;
  const showKL = cfg.showKL !== false, showE = !!cfg.showEuclid, showMid = !!cfg.showMidpoints;
  const showComp = cfg.showComponents !== false;
  const allPairs = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) allPairs.push([i, j]);
  const pairs = (cfg.pairs ?? allPairs).filter(([i, j]) => i < N && j < N);
  const segPairs = cfg.segment === true ? pairs : (cfg.segment || []);
  const L = { components: 'Components', euclid: 'Straight-line distance', kl: 'KL divergence (nats)', mid: 'KL to the midpoint (nats)',
    reset: 'Reset', ...(cfg.labels ?? {}) };
  const hue = (o, k) => HUES[o.hue ?? DEF_HUES[k % 3]] ?? o.hue;
  const clampP = p => {
    let q = p.map(x => Math.max(eps, x));
    if (snap) q = q.map(x => Math.max(eps, Math.round(x / snap) * snap));
    return norm(q);
  };

  let pts = pts0.map(o => o.p.slice());
  const setPreset = ps => { pts = pts0.map((o, k) => (ps?.[k] ?? o.p).slice()); };

  // ---- SVG
  const svg = s('svg', { viewBox: `-14 -12 128 ${HGT + 28}`, role: 'img',
    'aria-label': 'Probability simplex of three outcomes with ' + pts0.map(o => o.name).join(', ') });
  const gGrid = s('g'), gFam = s('g'), gSeg = s('g'), gPts = s('g'), gLab = s('g');
  svg.append(gGrid, gFam, gSeg, gLab, gPts);
  svg.append(s('defs'));
  const tri = s('polygon', { points: V.map(v => v.join(',')).join(' '), class: 'sp-tri' });
  gGrid.append(tri);
  if (cfg.grid !== false) {
    for (let k = 1; k < 10; k++) {
      const t = k / 10;
      for (let i = 0; i < 3; i++) {
        const a = [0, 0, 0], b = [0, 0, 0];
        a[i] = t; b[i] = t;
        a[(i + 1) % 3] = 1 - t; b[(i + 2) % 3] = 1 - t;
        const [x1, y1] = toXY(a), [x2, y2] = toXY(b);
        gGrid.append(s('line', { x1, y1, x2, y2, class: 'sp-grid' }));
      }
    }
  }
  gGrid.append(s('polygon', { points: V.map(v => v.join(',')).join(' '), class: 'sp-edge' }));
  const txt = (x, y, str, cls, anchor = 'middle') => {
    const t = s('text', { x, y, class: cls, 'text-anchor': anchor, 'dominant-baseline': 'middle' });
    t.textContent = str; return t;
  };
  const vlab = [[-3, HGT + 7, 'end'], [SIDE + 3, HGT + 7, 'start'], [SIDE / 2, -6, 'middle']];
  outs.slice(0, 3).forEach((o, i) => {
    gLab.append(txt(vlab[i][0], vlab[i][1], `${String(o).replace(/[$*_`]/g, '')}`, 'sp-vlab', vlab[i][2]));
  });
  if (cfg.ticks) {
    for (const t of [0.25, 0.5, 0.75]) {
      const b = toXY([1 - t, t, 0]); gLab.append(txt(b[0], b[1] + 5, f2(t), 'sp-tick'));
      const l = toXY([1 - t, 0, t]); gLab.append(txt(l[0] - 6, l[1], f2(t), 'sp-tick'));
      const r = toXY([0, 1 - t, t]); gLab.append(txt(r[0] + 6, r[1], f2(t), 'sp-tick'));
    }
  }

  // families (static: depend on the point positions, redrawn)
  const fams = (cfg.family ?? []).filter(f => f.type === 'curve' || (f.a < N && f.b < N));
  const famPaths = fams.map((f, k) => {
    const path = s('path', { class: 'sp-fam', style: `stroke:${HUES[f.hue ?? 'gold'] ?? f.hue}` });
    gFam.append(path); return path;
  });
  const famPoints = (f) => {
    if (f.type === 'curve') return f.ps.map(norm);
    const p = pts[f.a], q = pts[f.b], out = [];
    const t0 = cfg.tMin ?? -2, t1 = cfg.tMax ?? 3, n = 240;
    for (let k = 0; k <= n; k++) {
      const t = t0 + (t1 - t0) * k / n;
      let r;
      if (f.type === 'exponential') r = norm(p.map((x, i) => Math.exp((1 - t) * Math.log(x) + t * Math.log(q[i]))));
      else r = p.map((x, i) => (1 - t) * x + t * q[i]);
      out.push(r);
    }
    return out;
  };
  const famD = f => {
    let d = '', pen = false;
    for (const r of famPoints(f)) {
      if (r.some(x => x < -1e-9 || !isFinite(x))) { pen = false; continue; }
      const [x, y] = toXY(r.map(x => Math.max(0, x)));
      d += `${pen ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`; pen = true;
    }
    return d;
  };

  const segs = segPairs.map(() => { const l = s('line', { class: 'sp-seg' }); gSeg.append(l); return l; });
  const midMarks = showMid ? pairs.map(() => { const c = s('circle', { r: 2.2, class: 'sp-mid' }); gSeg.append(c); return c; }) : [];

  const marks = pts0.map((o, k) => {
    const col = hue(o, k);
    const g = s('g', { class: 'sp-pt' + (o.fixed ? ' fixed' : ''), style: `--c:${col}` });
    const dot = s('circle', { r: 3.4, class: 'sp-dot' });
    const hit = s('circle', { r: 9, class: 'sp-hit', 'data-sp': k });
    const lab = txt(0, 0, o.tag ?? o.name, 'sp-name');
    g.append(dot, lab, hit);
    gPts.append(g);
    if (!o.fixed) drag(hit, k);
    return { g, dot, lab };
  });

  function drag(hit, k) {
    hit.addEventListener('pointerdown', e => {
      e.preventDefault();
      hit.setPointerCapture(e.pointerId);
      const move = ev => {
        const pt = svg.createSVGPoint();
        pt.x = ev.clientX; pt.y = ev.clientY;
        const m = pt.matrixTransform(svg.getScreenCTM().inverse());
        pts[k] = clampP(toP([m.x, m.y]));
        draw();
      };
      const up = () => { hit.removeEventListener('pointermove', move); hit.removeEventListener('pointerup', up); hit.removeEventListener('pointercancel', up); };
      hit.addEventListener('pointermove', move);
      hit.addEventListener('pointerup', up);
      hit.addEventListener('pointercancel', up);
    });
  }

  // ---- readouts
  const compRows = pts0.map((o, k) => {
    const v = h('span', { class: 'sp-vals' });
    const row = h('div', { class: 'sp-comp', style: `color:${hue(o, k)}` }, v);
    return { row, v };
  });
  const bar = (color) => {
    const fill = h('span', { class: 'fe-fill', style: `background:${color}` });
    return { fill, wrap: h('span', { class: 'fe-bar' }, fill) };
  };
  const pairBlocks = pairs.map(([i, j], idx) => {
    const a = pts0[i], b = pts0[j];
    const rows = [];
    const mk = (tag, name, color, scale) => {
      const val = h('span', { class: 'fe-val fe-bval' });
      const br = bar(color);
      const lab = h('div', { class: 'fe-blabel' }, h('span', {}, T(name)), val);
      rows.push(h('div', { class: 'fe-brow' }, lab, br.wrap));
      return { val, fill: br.fill, scale, tag };
    };
    const D = (x, y) => `D_{\\mathrm{KL}}[${x}:${y}]`;
    const e = showE ? mk('e', `\\lVert ${a.name}-${b.name}\\rVert`, 'var(--muted)', Math.SQRT2) : null;
    const k1 = showKL ? mk('f', D(a.name, b.name), hue(a, i), barMax) : null;
    const k2 = showKL ? mk('b', D(b.name, a.name), hue(b, j), barMax) : null;
    const mm = showMid ? [
      mk('m1', D(a.name, `m_{${a.name}${b.name}}`), hue(a, i), barMax),
      mk('m2', D(`m_{${a.name}${b.name}}`, a.name), hue(a, i), barMax),
      mk('m3', D(b.name, `m_{${a.name}${b.name}}`), hue(b, j), barMax),
      mk('m4', D(`m_{${a.name}${b.name}}`, b.name), hue(b, j), barMax)] : null;
    const head = [];
    const sec = [];
    if (e) sec.push(rows[0]);
    let n = e ? 1 : 0;
    const klRows = showKL ? [rows[n], rows[n + 1]] : [];
    n += showKL ? 2 : 0;
    const midRows = showMid ? rows.slice(n) : [];
    const box = h('div', { class: 'fe-sec sp-pair' },
      pairs.length > 1 ? h('div', { class: 'fe-title' }, T(`${a.name}\\ \\text{–}\\ ${b.name}`)) : '',
      e ? [h('div', { class: 'sp-sub' }, M(L.euclid)), rows[0]] : '',
      showKL ? [h('div', { class: 'sp-sub' }, M(L.kl)), ...klRows] : '',
      showMid ? [h('div', { class: 'sp-sub' }, M(L.mid)), ...midRows] : '');
    return { box, e, k1, k2, mm, i, j };
  });
  const compBox = showComp ? h('div', { class: 'fe-sec sp-comps' }, h('div', { class: 'sp-sub' }, M(L.components)), ...compRows.map(r => r.row)) : '';
  const anyDrag = pts0.some(o => !o.fixed);
  const btns = [];
  if (anyDrag && cfg.reset !== false) btns.push(h('button', { class: 'btn ghost', type: 'button', onclick: () => { setPreset(); draw(); } }, M(L.reset)));
  for (const pr of cfg.presets ?? []) btns.push(h('button', { class: 'btn ghost', type: 'button', onclick: () => { setPreset(pr.points); draw(); } }, M(pr.label)));

  el.classList.add('sp-widget');
  el.append(svg, compBox, ...pairBlocks.map(b => b.box), btns.length ? h('div', { class: 'wbtns' }, ...btns) : '');

  const setBar = (r, v) => {
    r.val.textContent = `${v.toFixed(3)}`;
    r.fill.style.width = `${Math.min(1, v / r.scale) * 100}%`;
  };

  function draw() {
    pts.forEach((p, k) => {
      const [x, y] = toXY(p);
      marks[k].dot.setAttribute('cx', x); marks[k].dot.setAttribute('cy', y);
      marks[k].g.querySelector('.sp-hit').setAttribute('cx', x); marks[k].g.querySelector('.sp-hit').setAttribute('cy', y);
      // name above-right of the dot, flipped near the right edge
      marks[k].lab.setAttribute('x', x + (x > SIDE * 0.75 ? -6 : 6)); marks[k].lab.setAttribute('y', y - 5);
      if (showComp) {
        compRows[k].v.textContent = '';
        compRows[k].v.append(T(`${pts0[k].name}=(${p.map(f2).join(',\\ ')})`));
      }
    });
    fams.forEach((f, k) => famPaths[k].setAttribute('d', famD(f)));
    segPairs.forEach(([i, j], k) => {
      const [x1, y1] = toXY(pts[i]), [x2, y2] = toXY(pts[j]);
      for (const [a, v] of [['x1', x1], ['y1', y1], ['x2', x2], ['y2', y2]]) segs[k].setAttribute(a, v);
    });
    pairs.forEach(([i, j], k) => {
      if (!showMid) return;
      const [x, y] = toXY(mid(pts[i], pts[j]));
      midMarks[k].setAttribute('cx', x); midMarks[k].setAttribute('cy', y);
    });
    const dd = [], kk = [], mk = [];
    pairBlocks.forEach(b => {
      const p = pts[b.i], q = pts[b.j], m = mid(p, q);
      if (b.e) setBar(b.e, euclid(p, q));
      if (b.k1) { setBar(b.k1, kl(p, q)); setBar(b.k2, kl(q, p)); }
      if (b.mm) { [kl(p, m), kl(m, p), kl(q, m), kl(m, q)].forEach((v, n) => setBar(b.mm[n], v)); }
      dd.push(f3(euclid(p, q)));
      kk.push(`${f3(kl(p, q))},${f3(kl(q, p))}`);
      mk.push([kl(p, m), kl(m, p), kl(q, m), kl(m, q)].map(f3).join(','));
    });
    el.dataset.p = pts.map(p => p.map(f3).join(',')).join(' | ');
    el.dataset.d = dd.join(' | ');
    el.dataset.kl = kk.join(' | ');
    el.dataset.klmid = mk.join(' | ');
  }
  draw();
}
