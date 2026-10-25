// area-cell
//
// What √det g measures. Left: the chart's coordinates, with a square cell of
// side Δ centred at p (gold; p draggable, Δ on a slider). Right: the
// manifold, with the cell's true image (gold) and the parallelogram spanned
// by Δ ∂/∂α¹, Δ ∂/∂α² around p (purple), of area √det g(p) Δ². The readout
// compares true area / Δ² with √det g(p). Charts in AC_CHARTS (first
// coordinate across, second up); the sphere is drawn in orthographic
// projection, turned to face the cell.

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { P, arrow, label, line, placeHandle, planeSvg, s } from './plane.js';

const ac3 = x => (Math.abs(x) < 5e-4 ? '0' : String(Math.round(x * 1000) / 1000));
const acPar = x => (ac3(x).startsWith('-') ? `(${ac3(x)})` : ac3(x));
const acDot = (u, w) => u.reduce((t, x, i) => t + x * w[i], 0);
// real: the domain edges that are boundaries of the chart (0, 1 = min, max of
// the first coordinate; 2, 3 = of the second), drawn dashed
const AC_CHARTS = {
  cartesian: {
    c: ['x', 'y'], g: ['x', 'y'], ang: [false, false], dom: [[-2.5, 2.5], [-2.5, 2.5]], real: [], steps: [0.5, 0.5],
    rule: 'Euclidean plane, cartesian chart $(x, y)$.',
    X: q => q, D: () => [[1, 0], [0, 1]],
    exact: (p, d) => [d * d, `a square of side $\\Delta$: $\\Delta^2 = ${ac3(d * d)}$`],
  },
  polar: {
    c: ['r', '\\theta'], g: ['r', 'θ'], ang: [false, true], dom: [[0, 3.2], [-Math.PI, Math.PI]], real: [0, 2, 3], steps: [0.5, Math.PI / 8],
    rule: 'Euclidean plane, polar chart $(r, \\theta)$ with $r > 0$, $\\theta\\in(-\\pi, \\pi)$: the point $(r\\cos\\theta,\\ r\\sin\\theta)$.',
    X: ([r, t]) => [r * Math.cos(t), r * Math.sin(t)],
    D: ([r, t]) => [[Math.cos(t), Math.sin(t)], [-r * Math.sin(t), r * Math.cos(t)]],
    exact: ([r], d) => {
      const r1 = r - d / 2, r2 = r + d / 2, A = d * (r2 * r2 - r1 * r1) / 2;
      return [A, `a ring sector: $\\tfrac12\\Delta\\,(r_2^2 - r_1^2)$ $= \\tfrac12\\cdot${ac3(d)}\\cdot(${ac3(r2)}^2 - ${ac3(r1)}^2) = ${ac3(A)}$`];
    },
  },
  sphere: {
    c: ['\\vartheta', '\\varphi'], g: ['ϑ', 'φ'], ang: [true, true], dom: [[0, Math.PI], [-Math.PI, Math.PI]], real: [0, 1, 2, 3], steps: [Math.PI / 12, Math.PI / 12], sphere: true,
    rule: 'Unit sphere, chart $(\\vartheta, \\varphi)$ with $\\vartheta\\in(0, \\pi)$, $\\varphi\\in(-\\pi, \\pi)$: the point $(\\sin\\vartheta\\cos\\varphi,\\ \\sin\\vartheta\\sin\\varphi,\\ \\cos\\vartheta)$ of $\\mathbb{R}^3$.',
    X: ([t, f]) => [Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)],
    D: ([t, f]) => [[Math.cos(t) * Math.cos(f), Math.cos(t) * Math.sin(f), -Math.sin(t)], [-Math.sin(t) * Math.sin(f), Math.sin(t) * Math.cos(f), 0]],
    exact: ([t], d) => {
      const c1 = Math.cos(t - d / 2), c2 = Math.cos(t + d / 2), A = d * (c1 - c2);
      return [A, `a piece of the zone between two latitudes (Archimedes): $\\Delta\\,(\\cos\\vartheta_1 - \\cos\\vartheta_2)$ $= ${ac3(d)}\\cdot(${ac3(c1)} - ${acPar(c2)}) = ${ac3(A)}$`];
    },
  },
  sheared: {
    c: ['a', 'b'], g: ['a', 'b'], ang: [false, false], dom: [[-1.2, 1.2], [-1.2, 1.2]], real: [], steps: [0.25, 0.25],
    rule: 'Euclidean plane, sheared chart $(a, b)$: the point $(2a + b,\\ b)$.',
    X: ([a, b]) => [2 * a + b, b], D: () => [[2, 0], [1, 1]],
    exact: (p, d) => [2 * d * d, `a parallelogram with base $2\\Delta$ and height $\\Delta$: $2\\Delta^2 = ${ac3(2 * d * d)}$`],
  },
};

export function areaCell(el, cfg) {
  const SN = cfg.snap ?? 0.05, RS = 3, dMin = cfg.dmin ?? 0.05, dMax = cfg.dmax ?? 1;
  const mv = { x: -3.45, y: -3.45, w: 6.9, h: 6.9 };
  const init = () => ({ chart: AC_CHARTS[cfg.chart] ? cfg.chart : 'polar', p: [...(cfg.p ?? [1.25, Math.PI / 4])], d: cfg.d ?? 0.5 });
  let st = init(), C, A, M, cs, hd;
  const panels = h('div', { class: 'cc-panels' });
  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', min: dMin, max: dMax, step: 0.01, 'aria-label': 'side Δ of the coordinate cell' });
  slider.addEventListener('input', () => { st.d = +slider.value; clampP(); draw(); });
  const dOut = h('span', { class: 'ac-gold' });
  const apply = next => { const c = st.chart; st = next; if (st.chart !== c) build(); clampP(); draw(); };
  const btns = h('div', { class: 'wbtns' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => apply(init()) }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => apply({
      chart: AC_CHARTS[pr.chart] ? pr.chart : st.chart, p: [...(pr.p ?? st.p)], d: pr.d ?? st.d }) }, pr.label)));
  el.append(panels, cfg.slider === false ? '' : h('label', { class: 'wslider' }, dOut, slider), readout, btns);

  // keep the whole cell inside the chart's domain
  const clampP = () => {
    st.d = Math.max(dMin, Math.min(dMax, st.d));
    const m = st.d / 2 + 0.02;
    st.p = st.p.map((v, i) => Math.max(C.dom[i][0] + m, Math.min(C.dom[i][1] - m, v)));
  };

  function build() {
    C = AC_CHARTS[st.chart];
    const [[a0, a1], [b0, b1]] = C.dom;
    const cv = { x: a0 - 0.65, y: b0 - 0.5, w: a1 - a0 + 1.15, h: b1 - b0 + 1 };
    let ms;
    ({ svg: cs, layers: A } = planeSvg(cv, `The chart's coordinates (${C.g.join(', ')}) with a square cell of side Δ around p`,
      ['dom', 'lat', 'cell', 'arrows', 'marks', 'labels', 'handles']));
    ({ svg: ms, layers: M } = planeSvg(mv, `The ${C.sphere ? 'unit sphere' : 'plane'} with the image of the cell and the parallelogram of the chart basis at p`,
      ['lat', 'cell', 'par', 'arrows', 'marks', 'labels']));
    A.grid.replaceChildren();
    if (C.sphere) M.grid.replaceChildren();
    hd = null;
    if (cfg.drag !== false) {
      hd = s('circle', { r: 0.2, class: 'w-handle gold', tabindex: 0, 'aria-label': 'centre p of the cell' });
      A.handles.append(hd);
      hd.addEventListener('pointerdown', e => {
        e.preventDefault();
        hd.setPointerCapture(e.pointerId);
        const move = ev => {
          const q = cs.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
          const m = q.matrixTransform(cs.getScreenCTM().inverse());
          st.p = [m.x, -m.y].map(v => (SN ? Math.round(v / SN) * SN : v));
          clampP(); draw();
        };
        const up = () => { hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); };
        hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
      });
    }
    panels.replaceChildren(cs, ms);
  }

  const pts = a => a.map(v => P(...v).join(',')).join(' ');
  const pl = (a, cls) => s('polyline', { points: pts(a), class: cls });
  const pg = (a, cls) => s('polygon', { points: pts(a), class: cls });
  const seg = (q0, q1, n) => Array.from({ length: n + 1 }, (_, k) => [q0[0] + (q1[0] - q0[0]) * k / n, q0[1] + (q1[1] - q0[1]) * k / n]);
  const add = (...vs) => vs.reduce((a, b) => a.map((x, i) => x + b[i]));
  const sc = (k, v) => v.map(x => k * x);
  const tickTxt = (i, v) => (C.ang[i] ? { '-2': '−π', '-1': '−π/2', 0: '0', 1: 'π/2', 2: 'π' }[Math.round(v / (Math.PI / 2))] : String(v).replace('-', '−'));

  function draw() {
    for (const k of ['dom', 'lat', 'cell', 'arrows', 'marks', 'labels']) A[k].replaceChildren();
    for (const k of ['lat', 'cell', 'par', 'arrows', 'marks', 'labels']) M[k].replaceChildren();
    const [[a0, a1], [b0, b1]] = C.dom, [p1, p2] = st.p, d = st.d, h2 = d / 2;
    slider.value = d; dOut.innerHTML = tex(`\\Delta = ${ac3(d)}`);

    // the manifold's drawing map: the plane as it is; the sphere seen from
    // the direction of the cell (elevation capped so a pole stays in sight)
    let proj = v => v, vis = () => true;
    if (C.sphere) {
      const az = p2, ev = Math.max(-1, Math.min(1, Math.PI / 2 - p1));
      const R = [-Math.sin(az), Math.cos(az), 0], U = [-Math.sin(ev) * Math.cos(az), -Math.sin(ev) * Math.sin(az), Math.cos(ev)];
      const V = [Math.cos(ev) * Math.cos(az), Math.cos(ev) * Math.sin(az), Math.sin(ev)];
      proj = v => [RS * acDot(v, R), RS * acDot(v, U)];
      vis = v => acDot(v, V) > -1e-9;
      M.lat.append(s('circle', { cx: 0, cy: 0, r: RS, class: 'ac-outline' }));
    }
    // a curve given by chart points, drawn where it is on the visible side
    const curve = (qs, cls) => {
      let run = [];
      const flush = () => { if (run.length > 1) M.lat.append(pl(run, cls)); run = []; };
      for (const q of qs) { const v = C.X(q); if (vis(v)) run.push(proj(v)); else flush(); }
      flush();
    };

    // chart panel: domain, its real boundary dashed, axes, ticks
    A.dom.append(pg([[a0, b0], [a1, b0], [a1, b1], [a0, b1]], 'ac-dom'));
    const edges = [[[a0, b0], [a0, b1]], [[a1, b0], [a1, b1]], [[a0, b0], [a1, b0]], [[a0, b1], [a1, b1]]];
    for (const k of C.real) { A.dom.append(line(...edges[k], 'ac-cut')); curve(seg(...edges[k], 72), 'ac-cut'); }
    if (b0 < 0 && b1 > 0) A.dom.append(line([a0, 0], [a1, 0], 'w-axis'));
    if (a0 < 0 && a1 > 0) A.dom.append(line([0, b0], [0, b1], 'w-axis'));
    for (const i of [0, 1]) {
      const [lo, hi] = C.dom[i], u = C.ang[i] ? Math.PI / 2 : 1;
      for (let k = Math.ceil(lo / u - 1e-9); k * u <= hi + 1e-9; k++)
        A.labels.append(label(i ? [a0 - 0.33, k * u] : [k * u, b0 - 0.25], tickTxt(i, k * u), 'tick'));
    }
    A.labels.append(label([a1 + 0.3, b0 - 0.25], C.g[0]), label([a0 - 0.33, b1 + 0.32], C.g[1]));
    // coordinate lines, the same ones in both panels
    for (const i of [0, 1]) {
      const [lo, hi] = C.dom[i], sp = C.steps[i];
      for (let k = Math.ceil((lo + 1e-9) / sp); k * sp < hi - 1e-9; k++) {
        const v = k * sp, e = i ? [[a0, v], [a1, v]] : [[v, b0], [v, b1]];
        A.lat.append(line(...e, 'w-lattice'));
        if (cfg.lattice !== false) curve(seg(...e, 72), 'w-lattice ac-lat');
      }
    }
    // the poles, labelled on the side away from the cell
    const poles = [];
    if (C.sphere) for (const [v, t] of [[[0, 0, 1], 'N'], [[0, 0, -1], 'S']]) if (vis(v)) {
      const q = proj(v), c = proj(C.X(st.p)), o = [q[0] - c[0], q[1] - c[1]], lo = Math.hypot(...o) || 1;
      const ql = Math.hypot(...q) > 0.3 ? [q[0] + 0.32 * q[0] / Math.hypot(...q), q[1] + 0.32 * q[1] / Math.hypot(...q)] : [q[0] + 0.3 * o[0] / lo, q[1] + 0.3 * o[1] / lo];
      M.marks.append(s('circle', { cx: q[0], cy: -q[1], r: 0.07, class: 'cv-dot' }));
      M.labels.append(label(ql, t, 'small'));
      poles.push(q, ql);
    }

    // the cell: a square in the chart, its true image on the manifold
    const sq = [[p1 - h2, p2 - h2], [p1 + h2, p2 - h2], [p1 + h2, p2 + h2], [p1 - h2, p2 + h2]];
    A.cell.append(pg(sq, 'ac-cell'));
    A.arrows.append(arrow(sq[0], sq[1], 'w-basis', 0.16), arrow(sq[0], sq[3], 'w-basis', 0.16));
    A.marks.append(s('circle', { cx: p1, cy: -p2, r: 0.06, class: 'cv-p' }));
    A.labels.append(label([p1 + h2 + 0.2, p2 + h2 + 0.2], 'p'));
    if (hd) placeHandle(hd, st.p);
    const bd = [0, 1, 2, 3].flatMap(k => seg(sq[k], sq[(k + 1) % 4], 24));
    M.cell.append(pg(bd.map(q => proj(C.X(q))), 'ac-cell'));
    // the parallelogram of Δ ∂/∂α¹, Δ ∂/∂α², centred at p
    const Xp = C.X(st.p), Dp = C.D(st.p), [u, w] = Dp.map(c => sc(d, c)), pc = proj(Xp);
    if (cfg.parallelogram !== false) {
      const c0 = add(Xp, sc(-0.5, u), sc(-0.5, w));
      const par = [c0, add(c0, u), add(c0, u, w), add(c0, w)].map(proj);
      M.par.append(pg(par, 'ac-par'));
      M.arrows.append(arrow(par[0], par[1], 'w-basis', 0.16), arrow(par[0], par[3], 'w-basis', 0.16));
      for (const [tip, i] of [[par[1], 0], [par[3], 1]]) {
        if (Math.hypot(tip[0] - par[0][0], tip[1] - par[0][1]) < 0.45) continue;
        const o = [tip[0] - pc[0], tip[1] - pc[1]], lo = Math.hypot(...o) || 1;
        const q = [tip[0] + 0.4 * o[0] / lo, tip[1] + 0.4 * o[1] / lo];
        if (poles.some(r => Math.hypot(q[0] - r[0], q[1] - r[1]) < 0.5)) continue;
        M.labels.append(label(q, `Δ∂${C.g[i]}`, 'small basis'));
      }
    }
    M.marks.append(s('circle', { cx: pc[0], cy: -pc[1], r: 0.07, class: 'cv-p' }));

    // readout
    const [c1, c2] = C.c, gn = (i, j) => `g_{${C.c[i]}${C.c[j]}}`, vec = v => `(${v.map(ac3).join(', ')})`;
    const g11 = acDot(Dp[0], Dp[0]), g12 = acDot(Dp[0], Dp[1]), g22 = acDot(Dp[1], Dp[1]);
    const det = g11 * g22 - g12 * g12, rt = Math.sqrt(det), Apar = rt * d * d;
    const [Aex, exTex] = C.exact(st.p, d), ratio = Aex / (d * d);
    const rows = [
      h('div', { class: 'wide', html: mdInline(C.rule) }),
      h('div', { class: 'wide ac-gold', html: mdInline(`Gold cell: $${c1}\\in[${c1}_1, ${c1}_2] = [${ac3(p1 - h2)}, ${ac3(p1 + h2)}]$, $${c2}\\in[${c2}_1, ${c2}_2] = [${ac3(p2 - h2)}, ${ac3(p2 + h2)}]$, side $\\Delta = ${ac3(d)}$ in both coordinates, centred at $p$, where $(${c1}, ${c2}) = (${ac3(p1)}, ${ac3(p2)})$. Coordinate area $\\Delta^2 = ${ac3(d * d)}$.`) }),
      h('div', { class: 'wide c-basis', html: mdInline(`At $p$: $(\\partial/\\partial ${c1})_p = ${vec(Dp[0])}$ and $(\\partial/\\partial ${c2})_p = ${vec(Dp[1])}$${C.sphere ? ', vectors of $\\mathbb{R}^3$ tangent to the sphere' : ''}.`) }),
      h('div', { class: 'wide', html: mdInline(`Metric at $p$ (dot products of these): $${gn(0, 0)} = ${ac3(g11)}$, $${gn(0, 1)} = ${ac3(g12)}$, $${gn(1, 1)} = ${ac3(g22)}$, so $\\det g = ${ac3(det)}$ and $\\sqrt{\\det g} = ${ac3(rt)}$.`) }),
    ];
    if (cfg.parallelogram !== false) {
      const naive = Math.abs(g12) > 1e-9 ? ` The product of the side lengths, $\\sqrt{${gn(0, 0)}${gn(1, 1)}}\\,\\Delta^2 = ${ac3(Math.sqrt(g11 * g22) * d * d)}$, is too big: the sides are not perpendicular.` : '';
      rows.push(h('div', { class: 'wide c-basis', html: mdInline(`Purple parallelogram, spanned by $\\Delta\\,\\partial/\\partial ${c1}$ and $\\Delta\\,\\partial/\\partial ${c2}$: area $\\sqrt{${gn(0, 0)}${gn(1, 1)} - ${gn(0, 1)}^2}\\;\\Delta^2$ $= \\sqrt{\\det g}\\;\\Delta^2 = ${ac3(rt)}\\cdot${ac3(d)}^2 = ${ac3(Apar)}$.${naive}`) }));
    }
    if (cfg.exact !== false) {
      rows.push(h('div', { class: 'wide ac-gold', html: mdInline(`The gold cell is ${exTex}.`) }));
      const same = Math.abs(ratio - rt) < 5e-4 * Math.max(1, rt);
      const tail = cfg.badge === false ? '.'
        : same ? ': **equal** (to three decimals).'
        : `: they differ by $${Math.round(Math.abs(ratio / rt - 1) * 1000) / 10 || 0.1}\\%$. Shrink $\\Delta$, and the ratio tends to $\\sqrt{\\det g}$ at $p$.`;
      rows.push(h('div', { class: `wide${same && cfg.badge !== false ? ' ok' : ''}`, html: mdInline(`True area $/\\,\\Delta^2 = ${ac3(ratio)}$ against $\\sqrt{\\det g} = ${ac3(rt)}$ at $p$${tail}`) }));
    }
    readout.replaceChildren(...rows);
  }
  build(); clampP(); draw();
}
