// chart-basis
//
// The plane ℝ² with one or two charts drawn as their coordinate lines (first
// chart solid, second dashed), a draggable point p (gold) and the chart-induced
// basis vectors (∂/∂𝒳ⁱ)_p in purple: the velocity at λ = 0 of the coordinate
// curve λ ↦ 𝒳⁻¹(𝒳(p) + λ eᵢ), i.e. column i of (D𝒳)⁻¹. A draggable velocity v
// (blue) at p is the velocity of γ(λ) = p + λ v; the readout gives its
// components (𝒳ⁱ∘γ)'(0) in each chart and the Jacobian (∂𝒴ⁱ/∂𝒳ʲ)_p (row i,
// column j), with "components in 𝒴 = Jacobian · components in 𝒳".
//
// config:
//   charts:    ['X', 'Y']       one or two of cartesian | polar | X | Y, or
//                               { chart: 'polar', name: '\\mathscr{Y}', steps: [0.5, 0.3927], cut: 'left' }
//                               (polar cut: 'right' = θ ∈ (0, 2π), default; 'left' = θ ∈ (−π, π))
//   p:         [1, 1]           the point (anywhere; outside a chart's domain that chart says so)
//   v:         [1, 2]           the velocity, in the standard components of ℝ²
//   basisOnly: false            hide v and the components
//   chain:     false            the law in numbers (components, or the basis
//                               law when basisOnly)
//   inverse:   false            also show the inverse Jacobian (∂𝒳ⁱ/∂𝒴ʲ)_p
//   jacobian:  true             false hides the Jacobian and the component law
//   dragP:     true             p draggable
//   snap:      0.25
//   lines:     8                at most this many coordinate lines on each side of p
//   view:      { x, y, w, h }   default: 5 × 5 centred on p
//   presets:   [{ label, charts, p, v }]
// Where the lines of one coordinate get closer than ~0.14 view units, only every
// 2nd (4th, …) line is drawn there, so lines thin out instead of crowding.

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { P, arrow, fmt, label, line, placeHandle, planeSvg, s } from './plane.js';

export const TWO_PI = 2 * Math.PI;
const CB_CHARTS = {
  cartesian: { name: '\\mathscr{C}', coords: ['x', 'y'], glyphs: ['x', 'y'], rule: '(x, y) = (q_1, q_2)',
    map: q => [q[0], q[1]], inv: c => [c[0], c[1]], jac: () => [[1, 0], [0, 1]], steps: [0.5, 0.5] },
  polar: { name: '\\mathscr{P}', coords: ['r', '\\theta'], glyphs: ['r', 'θ'],
    inv: c => [c[0] * Math.cos(c[1]), c[0] * Math.sin(c[1])],
    jac: q => { const r2 = q[0] ** 2 + q[1] ** 2, r = Math.sqrt(r2); return [[q[0] / r, q[1] / r], [-q[1] / r2, q[0] / r2]]; },
    steps: [0.5, Math.PI / 8], polar: true },
  X: { name: '\\mathscr{X}', rule: '(2q_1, -q_2)',
    map: q => [2 * q[0], -q[1]], inv: c => [c[0] / 2, -c[1]], jac: () => [[2, 0], [0, -1]], steps: [1, 0.5] },
  Y: { name: '\\mathscr{Y}', rule: '(q_1, q_2e^{q_1})',
    map: q => [q[0], q[1] * Math.exp(q[0])], inv: c => [c[0], c[1] * Math.exp(-c[0])],
    jac: q => [[1, 0], [q[1] * Math.exp(q[0]), Math.exp(q[0])]], steps: [0.5, 1] },
};
// The polar chart with its cut: θ ∈ (t0, t0 + 2π), undefined on the closed half-line at angle t0.
function polarCut(cut) {
  const left = cut === 'left', t0 = left ? -Math.PI : 0;
  const ang = q => { const t = (((Math.atan2(q[1], q[0]) - t0) % TWO_PI) + TWO_PI) % TWO_PI; return t0 + t; };
  return { t0,
    map: q => [Math.hypot(...q), ang(q)],
    dom: q => Math.hypot(...q) > 1e-9 && Math.abs(ang(q) - t0) > 1e-9,
    rule: `(r, \\theta),\\ \\theta \\in ${left ? '(-\\pi, \\pi)' : '(0, 2\\pi)'}`,
    cutText: `$\\theta \\in ${left ? '(-\\pi, \\pi)' : '(0, 2\\pi)'}$ leaves out the half-line $q_2 = 0,\\ q_1 ${left ? '\\le' : '\\ge'} 0$ (the angle would jump there, and $r = 0$ has no angle)` };
}
// Unicode mathematical script capital for \mathscr{L} (for SVG labels).
const SCRIPT_HOLES = { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ' };
const scriptGlyph = name => {
  const m = /\\mathscr\{([A-Z])\}/.exec(name);
  if (!m) return name.replace(/\\/g, '');
  return SCRIPT_HOLES[m[1]] ?? String.fromCodePoint(0x1D49C + m[1].charCodeAt(0) - 65);
};
const inv2 = ([[a, b], [c, d]]) => { const D = a * d - b * c; return [[d / D, -b / D], [-c / D, a / D]]; };
const mul2 = (A, B) => A.map(r => [0, 1].map(j => r[0] * B[0][j] + r[1] * B[1][j]));
export const mulv = (A, v) => A.map(r => r[0] * v[0] + r[1] * v[1]);

// Label placement (chart-basis, parallel-transport): try spots in order of
// preference and keep the first that clears the arrows (segments) and the
// labels already placed (else the clearest one). Distances are measured in
// label-sized units (labels are wide and short).
const LW = 0.5, LH = 0.24;
const dSeg = (q, a, b) => {
  const A = [(a[0] - q[0]) / LW, (a[1] - q[1]) / LH], B = [(b[0] - q[0]) / LW, (b[1] - q[1]) / LH];
  const d = [B[0] - A[0], B[1] - A[1]], dd = d[0] ** 2 + d[1] ** 2;
  const t = dd ? Math.max(0, Math.min(1, -(A[0] * d[0] + A[1] * d[1]) / dd)) : 0;
  return Math.hypot(A[0] + t * d[0], A[1] + t * d[1]);
};
export function labelPlacer(view, layer) {
  return (items, segs) => {
    const placed = [];
    for (const it of items) {
      let best = null, bestS = -Infinity;
      for (const c of it.cands) {
        const inView = c[0] > view.x + 0.3 && c[0] < view.x + view.w - 0.3 && c[1] > view.y + 0.2 && c[1] < view.y + view.h - 0.2;
        const sc = Math.min(...segs.map(([a, b]) => dSeg(c, a, b)),
          ...placed.map(q => dSeg(c, q, q) / 2)) - (inView ? 0 : 5);
        if (sc >= 1.1) { best = c; break; }
        if (sc > bestS) { best = c; bestS = sc; }
      }
      placed.push(best);
      layer.append(label(best, it.text, it.cls));
    }
  };
}
// candidate spots around the tip of the arrow from p along e: beyond it, then beside it
export const tipCands = (p, e, sg) => {
  const Ln = Math.hypot(...e) || 1, u = [e[0] / Ln, e[1] / Ln], n = [-u[1], u[0]], tip = [p[0] + e[0], p[1] + e[1]];
  const at = (al, be) => [tip[0] + al * u[0] + be * n[0], tip[1] + al * u[1] + be * n[1]];
  const side = 0.22 + 0.25 * Math.abs(u[1]);
  return [at(0.3, sg * side), at(0.3, -sg * side), at(0.5 + 0.3 * Math.abs(u[0]), 0), at(-0.35, sg * 0.4), at(-0.35, -sg * 0.4),
    at(0.15, sg * (side + 0.45)), at(0.15, -sg * (side + 0.45)), at(0.9 + 0.3 * Math.abs(u[0]), 0)];
};

export function chartBasis(el, cfg) {
  const sn = cfg.snap ?? 0.25, basisOnly = !!cfg.basisOnly, chain = !!cfg.chain, showInv = !!cfg.inverse, showJac = cfg.jacobian !== false;
  const dragP = cfg.dragP ?? true, nmax = cfg.lines ?? 8;
  const mkChart = spec => {
    const o = typeof spec === 'string' ? { chart: spec } : spec;
    const base = CB_CHARTS[o.chart] ?? CB_CHARTS.X;
    const name = o.name ?? base.name;
    const g = scriptGlyph(name);
    return { dom: () => true, ...base, ...(base.polar ? polarCut(o.cut) : {}), name,
      coords: base.coords ?? [`${name}^1`, `${name}^2`],
      glyphs: base.glyphs ?? [`${g}¹`, `${g}²`],
      steps: o.steps ?? base.steps };
  };
  const init = () => ({
    charts: (cfg.charts ?? ['X', 'Y']).slice(0, 2).map(mkChart),
    p: [...(cfg.p ?? [1, 1])], v: [...(cfg.v ?? [1, 2])] });
  let st = init();
  const snap = t => (sn ? Math.round(t / sn) * sn : t);
  const p0 = cfg.p ?? [1, 1];
  const view = cfg.view ?? { x: p0[0] - 2.5, y: p0[1] - 2.5, w: 5, h: 5 };
  const minGap = 0.14 * Math.max(view.w, view.h) / 5;
  const { svg, layers: L } = planeSvg(view, 'Coordinate lines of the charts, the basis vectors at p and a velocity v',
    ['lines', 'arrows', 'marks', 'labels', 'handles']);
  const readout = h('div', { class: 'readout' });
  const btns = h('div', { class: 'wbtns' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      st = { charts: pr.charts ? pr.charts.slice(0, 2).map(mkChart) : st.charts,
        p: pr.p ? [...pr.p] : st.p, v: pr.v ? [...pr.v] : st.v };
      draw();
    } }, pr.label)));
  el.append(h('div', { class: 'cc-panels single' }, svg), readout, btns);

  const handle = (cls, aria, onMove) => {
    const c = s('circle', { r: 0.17, class: `w-handle ${cls}`, tabindex: 0, 'aria-label': aria });
    L.handles.append(c);
    c.addEventListener('pointerdown', e => {
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      const move = ev => {
        const q = svg.createSVGPoint();
        q.x = ev.clientX; q.y = ev.clientY;
        const m = q.matrixTransform(svg.getScreenCTM().inverse());
        const x = snap(Math.max(view.x + 0.2, Math.min(view.x + view.w - 0.2, m.x)));
        const y = snap(Math.max(view.y + 0.2, Math.min(view.y + view.h - 0.2, -m.y)));
        onMove([x, y]);
        draw();
      };
      const up = () => { c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up); };
      c.addEventListener('pointermove', move);
      c.addEventListener('pointerup', up);
      c.addEventListener('pointercancel', up);
    });
    return c;
  };
  const vh = basisOnly ? null : handle('vec', 'velocity v', q => {
    const v = [q[0] - st.p[0], q[1] - st.p[1]];
    if (Math.hypot(...v) >= 0.2) st.v = v;
  });
  const ph = dragP ? handle('gold', 'point p', q => { st.p = q; }) : null;

  const poly = (pts, cls) => s('polyline', { points: pts.map(q => P(...q).join(',')).join(' '), class: cls });
  // range of each chart coordinate over the view (sampled on a grid)
  function ranges(ch) {
    const lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
    for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) {
      const q = [view.x + view.w * i / 40, view.y + view.h * j / 40];
      if (!ch.dom(q)) continue;
      const c = ch.map(q);
      for (const k of [0, 1]) { lo[k] = Math.min(lo[k], c[k]); hi[k] = Math.max(hi[k], c[k]); }
    }
    if (ch.polar) { lo[0] = Math.max(lo[0], 0); if (Math.hypot(view.x + view.w / 2, view.y + view.h / 2) < Math.hypot(view.w, view.h)) { lo[1] = ch.t0; hi[1] = ch.t0 + TWO_PI; } }
    return { lo, hi };
  }
  // coordinate lines: coordinate k fixed at cp[k] + n·step, the other one runs.
  // Line n is drawn only where n is a multiple of m, the smallest power of 2
  // with m·(local spacing) ≥ minGap; the spacing of the lines of coordinate k
  // is step / |∇ coordinate k| (row k of the Jacobian of the chart).
  function coordLines(ch, idx, inDom) {
    const { lo, hi } = ranges(ch), out = [];
    const cp = inDom ? ch.map(st.p) : ch.polar ? [Math.hypot(...st.p), ch.t0] : ch.map(st.p);
    for (const k of [0, 1]) {
      const o = 1 - k, st_ = ch.steps[k];
      const nlo = Math.max(-nmax, Math.ceil((lo[k] - cp[k]) / st_)), nhi = Math.min(nmax, Math.floor((hi[k] - cp[k]) / st_));
      const a = ch.polar ? (o === 1 ? ch.t0 : Math.max(0, lo[0] - 0.1 * (hi[0] - lo[0]))) : lo[o] - 0.1 * (hi[o] - lo[o]);
      const b = ch.polar && o === 1 ? ch.t0 + TWO_PI : hi[o] + 0.1 * (hi[o] - lo[o]);
      for (let n = nlo; n <= nhi; n++) {
        const val = cp[k] + n * st_;
        if (ch.polar && k === 0 && val <= 1e-9) continue;
        if (ch.polar && k === 1 && (val < ch.t0 + 1e-9 || val > ch.t0 + TWO_PI - 1e-9)) continue;
        const cls = `cb-line c${idx + 1}${n === 0 && inDom ? ' main' : ''}`;
        let pts = [];
        for (let i = 0; i <= 200; i++) {
          const c = [0, 0];
          c[k] = val; c[o] = a + (b - a) * i / 200;
          const q = ch.inv(c), row = ch.jac(q)[k], gap = st_ / (Math.hypot(...row) || 1e-9);
          const m = gap >= minGap ? 1 : 2 ** Math.ceil(Math.log2(minGap / gap));
          if (n % m === 0 && Number.isFinite(q[0] + q[1])) pts.push(q);
          else { if (pts.length > 1) out.push(poly(pts, cls)); pts = []; }
        }
        if (pts.length > 1) out.push(poly(pts, cls));
      }
    }
    if (ch.polar) out.push(line([0, 0], [30 * Math.cos(ch.t0), 30 * Math.sin(ch.t0)], 'cb-cut'));
    return out;
  }

  const placeLabels = labelPlacer(view, L.labels);

  function draw() {
    for (const k of ['lines', 'arrows', 'marks', 'labels']) L[k].replaceChildren();
    const p = st.p, chs = st.charts, inD = chs.map(ch => ch.dom(p));
    chs.forEach((ch, idx) => L.lines.append(...coordLines(ch, idx, inD[idx])));
    // basis vectors: columns of (D𝒳)⁻¹ at p (only for charts whose domain contains p)
    const Ds = chs.map((ch, idx) => (inD[idx] ? ch.jac(p) : null)), Bs = Ds.map(D => D && inv2(D));
    const segs = [], items = [];
    if (!basisOnly) {
      const tip = [p[0] + st.v[0], p[1] + st.v[1]];
      L.arrows.append(arrow(p, tip, 'w-uvec'));
      segs.push([p, tip], [tip, tip]);
      items.push({ text: 'v', cls: 'vec', cands: tipCands(p, st.v, 1) });
      placeHandle(vh, tip);
    }
    chs.forEach((ch, idx) => {
      if (!Bs[idx]) return;
      for (const i of [0, 1]) {
        const e = [Bs[idx][0][i], Bs[idx][1][i]], tip = [p[0] + e[0], p[1] + e[1]];
        L.arrows.append(arrow(p, tip, `w-basis${idx ? ' cv-dash' : ''}`));
        segs.push([p, tip]);
        items.push({ text: `∂/∂${ch.glyphs[i]}`, cls: 'basis small', cands: tipCands(p, e, idx ? 1 : -1) });
      }
    });
    items.push({ text: 'p', cls: 'gold', cands: [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map(d => [p[0] + d[0], p[1] + d[1]]) });
    placeLabels(items, segs);
    const [px, py] = P(...p);
    L.marks.append(s('circle', { cx: px, cy: py, r: 0.11, class: 'cv-p' }));
    if (ph) placeHandle(ph, p);

    // readout
    const vec = a => `(${a.map(fmt).join(', ')})`;
    const comps = Ds.map(D => D && mulv(D, st.v));
    const rows = [h('div', { class: 'wide', html: mdInline(`$p = ${vec(p)}$${basisOnly ? '' : `, $v = ${vec(st.v)}$, the velocity of $\\gamma(\\lambda) = p + \\lambda\\, v$`}`) })];
    chs.forEach((ch, idx) => {
      const cell = [
        h('div', { class: 'cb-tag', html: mdInline(`$${ch.name}$, ${idx ? 'dashed' : 'solid'} lines`) }),
        h('div', { html: tex(`${ch.name}(q) = ${ch.rule}`) }),
      ];
      if (!inD[idx]) {
        cell.push(h('div', { class: 'cb-tag', html: mdInline(`$p$ is not in the domain of $${ch.name}$: ${ch.cutText ?? 'outside the chart'}. No basis, no components here.`) }));
      } else {
        cell.push(h('div', { html: tex(`${ch.name}(p) = ${vec(ch.map(p))}`) }));
        if (!basisOnly) for (const i of [0, 1])
          cell.push(h('div', { class: 'c-vec', html: tex(`(${ch.coords[i]}\\circ\\gamma)'(0) = ${fmt(comps[idx][i])}`) }));
      }
      rows.push(h('div', { class: 'cv-cell' }, ...cell));
    });
    if (chs.length === 2 && showJac && !(inD[0] && inD[1])) {
      rows.push(h('div', { class: 'wide cb-tag', html: mdInline('The Jacobian needs $p$ in the domains of both charts.') }));
    } else if (chs.length === 2 && showJac) {
      const [A, B] = chs;
      const J = mul2(Ds[1], Bs[0]);       // (∂𝒴ⁱ/∂𝒳ʲ)_p = D𝒴 · (D𝒳)⁻¹
      const mat = M => `\\begin{pmatrix} ${fmt(M[0][0])} & ${fmt(M[0][1])} \\\\ ${fmt(M[1][0])} & ${fmt(M[1][1])} \\end{pmatrix}`;
      const col = a => `\\begin{pmatrix} ${fmt(a[0])} \\\\ ${fmt(a[1])} \\end{pmatrix}`;
      const jac = [h('div', { html: tex(`\\Big(\\frac{\\partial ${B.name}^i}{\\partial ${A.name}^j}\\Big)_p = ${mat(J)}`) })];
      if (showInv) jac.push(h('div', { html: tex(`\\Big(\\frac{\\partial ${A.name}^i}{\\partial ${B.name}^j}\\Big)_p = ${mat(inv2(J))}`) }));
      rows.push(h('div', { class: 'wide cb-jac' }, ...jac));
      if (!basisOnly) {
        rows.push(h('div', { class: 'wide', html: mdInline(`Components in $${B.name}$ = Jacobian $\\cdot$ components in $${A.name}$${chain ? ':' : '.'}`) }));
        if (chain) rows.push(h('div', { class: 'wide', html: tex(`${col(comps[1])} = ${mat(J)} ${col(comps[0])}`) }));
      } else if (chain) {
        const bv = (ch, i) => `\\Big(\\frac{\\partial}{\\partial ${ch.coords[i]}}\\Big)_p`;
        const coef = (t, first) => (first ? fmt(t) : `${t < 0 ? '-' : '+'} ${fmt(Math.abs(t))}`);
        for (const i of [0, 1])
          rows.push(h('div', { html: tex(`\\begin{aligned} ${bv(A, i)} &= ${coef(J[0][i], true)}\\, ${bv(B, 0)} \\\\ &\\quad ${coef(J[1][i], false)}\\, ${bv(B, 1)} \\end{aligned}`) }));
      }
    }
    readout.replaceChildren(...rows);
  }
  draw();
}
