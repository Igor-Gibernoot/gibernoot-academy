// dual-grids
//
// A convex potential psi(xi) of two variables and its dual coordinates xi* = grad psi(xi), drawn as two
// planes side by side: the xi-plane and the xi*-plane. One point lives in both (drag it in either).
// Coordinate lines of xi are straight in the xi-plane and bent in the xi*-plane when psi is nonlinear;
// coordinate lines of xi* are the other way round. At the point the two bases are drawn:
//   e_i = d/d xi_i (tangent to the xi-lines) and e*^j = d/d xi*_j (tangent to the xi*-lines).
// Numbers: G = (g_ij) = Hessian of psi at xi, G* = Hessian of psi* at xi* (computed independently,
// by differentiating the inverse map), the product G G* (= I) and the inner products <e_i, e*^j>
// with <u, v> = u^T G v in xi-coordinates (= delta).
//
// Config (names are TeX; strings are markdown inline):
//   psi: 'quad' | 'negentropy' | 'neglog' | 'coupled'   or an array [psi1, psi2] of the first three
//        (psi = psi1(xi_1) + psi2(xi_2); 1/2 xi^2 | xi ln xi - xi | -ln xi, the logs live on xi > 0).
//        'softmax' = ln(1 + e^xi_1 + e^xi_2) (grid lines truly bent; xi* = probabilities on the triangle);
//        'coupled' = 1/2 xi^T A xi with A = cfg.A (default [[2,1],[1,1]], symmetric positive definite)
//   x: [xi_1, xi_2] start point;  fixed: true = not draggable
//   grid: 'both' (default) | 'xi' | 'dual' | false     xi-lines (purple) and/or xi*-lines (orange), in both planes
//   gridStep: [s_xi, s_xi*] spacing of the lines (defaults chosen per potential)
//   basis: false (default) | 'primal' | 'dual' | 'both'   arrows e_i (purple) / e*^j (orange) at the point
//   readout: false (default) | true | list of 'point', 'G', 'Gstar', 'product', 'inner'
//   panels: 'both' (default) | 'xi' | 'dual'
//   xRange: [[a,b],[a,b]] extents of the xi-plane;  dualRange: [[a,b],[a,b]] of the xi*-plane
//   presets: [{label, x:[x1,x2]}]  buttons;  reset: true
//   labels: { xi, xis, e, es, psi, reset }  TeX symbols for the coordinates and readouts
//
// Arrows are the true tangent vectors, multiplied in each plane by one common factor k so that the
// longest has a fixed fraction of the plane.
// el.dataset: x1, x2, s1, s2 (xi*), g11, g12, g22.

import { h } from '../dom.js';
import { mdInline, tex } from '../render.js';
import { s } from './plane.js';

const M = src => h('span', { html: mdInline(String(src)) });
const T = src => h('span', { html: tex(String(src)) });
const f2 = x => (Math.abs(x) < 0.005 ? 0 : x).toFixed(2);
const f3 = x => x.toFixed(3);

// one-variable potentials: value, derivative, second derivative, inverse of the derivative
const ONE = {
  quad: { f: x => 0.5 * x * x, d: x => x, dd: () => 1, inv: e => e, xr: [-3, 3], er: [-3, 3], lo: -3, step: [1, 1] },
  negentropy: { f: x => x * Math.log(x) - x, d: x => Math.log(x), dd: x => 1 / x, inv: e => Math.exp(e), xr: [0, 4], er: [-2.5, 1.5], lo: 0.08, step: [1, 1] },
  neglog: { f: x => -Math.log(x), d: x => -1 / x, dd: x => 1 / (x * x), inv: e => -1 / e, xr: [0, 4], er: [-5, 0], lo: 0.2, step: [1, 1] },
};

const VW = 140, VH = 128, X0 = 18, X1 = 134, Y0 = 6, Y1 = 108;
let clipCount = 0;

export function dualGrids(el, cfg) {
  const coupled = cfg.psi === 'coupled', soft = cfg.psi === 'softmax', joint = coupled || soft;
  const names = joint ? ['quad', 'quad'] : (Array.isArray(cfg.psi) ? cfg.psi : [cfg.psi ?? 'quad', cfg.psi ?? 'quad']);
  const F = names.map(n => ONE[n] ?? ONE.quad);
  const A = cfg.A ?? [[2, 1], [1, 1]];
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const Ainv = [[A[1][1] / det, -A[0][1] / det], [-A[1][0] / det, A[0][0] / det]];
  const L = { xi: '\\xi', xis: '\\xi^*', psi: '\\psi', reset: 'Reset', ...(cfg.labels ?? {}) };

  // maps
  const sm = x => { const a = Math.exp(x[0]), b = Math.exp(x[1]), z = 1 + a + b; return [a / z, b / z]; };
  const grad = x => (soft ? sm(x) : coupled ? [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]] : [F[0].d(x[0]), F[1].d(x[1])]);
  const inv = e => (soft ? [Math.log(e[0] / (1 - e[0] - e[1])), Math.log(e[1] / (1 - e[0] - e[1]))] : coupled ? [Ainv[0][0] * e[0] + Ainv[0][1] * e[1], Ainv[1][0] * e[0] + Ainv[1][1] * e[1]] : [F[0].inv(e[0]), F[1].inv(e[1])]);
  const hess = x => (soft ? (() => { const q = sm(x); return [[q[0] - q[0] * q[0], -q[0] * q[1]], [-q[0] * q[1], q[1] - q[1] * q[1]]]; })() : coupled ? A : [[F[0].dd(x[0]), 0], [0, F[1].dd(x[1])]]);
  // Hessian of psi* at e: Jacobian of the inverse map, by central differences (independent of G^-1)
  const hessStar = e => {
    const J = [[0, 0], [0, 0]];
    for (let j = 0; j < 2; j++) {
      const d = 1e-5 * Math.max(1, Math.abs(e[j])), a = [...e], b = [...e];
      a[j] += d; b[j] -= d;
      const ia = inv(a), ib = inv(b);
      for (let i = 0; i < 2; i++) J[i][j] = (ia[i] - ib[i]) / (2 * d);
    }
    return J;
  };

  // ranges and domain
  const xr = cfg.xRange ?? (soft ? [[-3, 3], [-3, 3]] : coupled ? [[-2, 2], [-2, 2]] : F.map(f => f.xr));
  const lo = xr.map((r, i) => Math.max(r[0], joint ? r[0] : F[i].lo));
  const hi = xr.map(r => r[1]);
  const er = cfg.dualRange ?? (soft ? [[0, 1], [0, 1]] : coupled
    ? [0, 1].map(i => { const m = Math.ceil((Math.abs(A[i][0]) + Math.abs(A[i][1])) * 2); return [-m, m]; })
    : F.map(f => f.er));
  const gridOpt = cfg.grid === undefined ? 'both' : cfg.grid;
  const showXi = gridOpt === 'both' || gridOpt === 'xi', showDual = gridOpt === 'both' || gridOpt === 'dual';
  const gstep = cfg.gridStep ?? (soft ? [1, 0.2] : coupled ? [1, 2] : [F[0].step[0], F[0].step[1]]);
  const basis = cfg.basis || false;
  const showPrim = basis === 'primal' || basis === 'both', showDualB = basis === 'dual' || basis === 'both';
  const ro = cfg.readout === true ? ['point', 'G', 'Gstar', 'product', 'inner'] : (Array.isArray(cfg.readout) ? cfg.readout : []);
  const panels = cfg.panels ?? 'both';

  const clampX = x => x.map((v, i) => Math.min(hi[i], Math.max(lo[i], v)));
  const start = clampX(cfg.x ?? (soft ? [0.3, -0.5] : coupled ? [0.6, 0.4] : [F[0].xr[0] < 0 ? 0.5 : 1.2, F[1].xr[0] < 0 ? -0.5 : 1.6]));
  let p = [...start];

  const txt = (x, y, str, cls, anchor = 'middle') => { const t = s('text', { x, y, class: cls, 'text-anchor': anchor, 'dominant-baseline': 'middle' }); t.textContent = str; return t; };
  const TXT = src => String(src).replace(/\\xi/g, 'ξ').replace(/\\psi/g, 'ψ').replace(/\^\*/g, '*').replace(/_1/g, '₁').replace(/_2/g, '₂').replace(/[$_`{}\\]/g, '');
  const stepOf = span => [0.5, 1, 2, 5].find(v => span / v <= 6) ?? 5;

  function panel(aria, rx, ry, xl, yl) {
    const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}`, role: 'img', class: 'dg-svg', 'aria-label': aria });
    const id = `dg-clip-${++clipCount}`;
    const cp = s('clipPath', { id }); cp.append(s('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0 }));
    svg.append(cp, s('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0, class: 'dg-box' }));
    const X = v => X0 + ((v - rx[0]) / (rx[1] - rx[0])) * (X1 - X0), Y = v => Y1 - ((v - ry[0]) / (ry[1] - ry[0])) * (Y1 - Y0);
    const gT = s('g'), gD = s('g', { 'clip-path': `url(#${id})` }), gP = s('g');
    svg.append(gT, gD, gP);
    const sx = stepOf(rx[1] - rx[0]), sy = stepOf(ry[1] - ry[0]);
    for (let v = Math.ceil(rx[0] / sx - 1e-9) * sx; v <= rx[1] + 1e-9; v += sx) gT.append(txt(X(v), Y1 + 7, String(+v.toFixed(2)), 'dg-tick'));
    for (let v = Math.ceil(ry[0] / sy - 1e-9) * sy; v <= ry[1] + 1e-9; v += sy) gT.append(txt(X0 - 3, Y(v), String(+v.toFixed(2)), 'dg-tick', 'end'));
    gT.append(txt((X0 + X1) / 2, VH - 6, TXT(xl), 'dg-ax'));
    const yt = txt(6, (Y0 + Y1) / 2, TXT(yl), 'dg-ax'); yt.setAttribute('transform', `rotate(-90 6 ${(Y0 + Y1) / 2})`); gT.append(yt);
    return { svg, X, Y, gD, gP, rx, ry, toData: (px, py) => [rx[0] + ((px - X0) / (X1 - X0)) * (rx[1] - rx[0]), ry[0] + ((Y1 - py) / (Y1 - Y0)) * (ry[1] - ry[0])] };
  }

  const PX = panel('The xi plane with the two coordinate grids', xr[0], xr[1], `${L.xi}_1`, `${L.xi}_2`);
  const PS = panel('The dual plane with the two coordinate grids', er[0], er[1], `${L.xis}_1`, `${L.xis}_2`);

  // polylines: lines of one coordinate, mapped into a plane (pts are data points of that plane)
  const pathOf = (P, pts) => {
    let d = '', pen = false;
    for (const q of pts) {
      if (!q || !isFinite(q[0]) || !isFinite(q[1]) || Math.abs(q[0]) > 1e3 || Math.abs(q[1]) > 1e3) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${P.X(q[0]).toFixed(1)},${P.Y(q[1]).toFixed(1)}`; pen = true;
    }
    return d;
  };
  const levels = (r, st) => { const out = []; for (let v = Math.ceil(r[0] / st - 1e-9) * st; v <= r[1] + 1e-9; v += st) out.push(+v.toFixed(6)); return out; };
  const N = 80;
  const path = (cls) => s('path', { class: cls });
  const hiXi = [path('dg-g xi hot'), path('dg-g xi hot')], hiDu = [path('dg-g du hot'), path('dg-g du hot')];
  function buildGrid() {
    if (showXi) for (let i = 0; i < 2; i++) for (const c of levels([lo[i], hi[i]], gstep[0])) {
      if (c < lo[i] - 1e-9) continue;
      const pts = []; for (let k = 0; k <= N; k++) { const t = lo[1 - i] + (hi[1 - i] - lo[1 - i]) * k / N; const x = i === 0 ? [c, t] : [t, c]; pts.push(x); }
      const dX = pathOf(PX, pts), dS = pathOf(PS, pts.map(grad));
      PX.gD.append(path('dg-g xi')); PS.gD.append(path('dg-g xi'));
      PX.gD.lastChild.setAttribute('d', dX); PS.gD.lastChild.setAttribute('d', dS);
    }
    if (showDual) for (let i = 0; i < 2; i++) for (const c of levels(er[i], gstep[1])) {
      const pts = []; for (let k = 0; k <= N; k++) { const t = er[1 - i][0] + (er[1 - i][1] - er[1 - i][0]) * k / N; pts.push(i === 0 ? [c, t] : [t, c]); }
      PS.gD.append(path('dg-g du')); PS.gD.lastChild.setAttribute('d', pathOf(PS, pts));
      PX.gD.append(path('dg-g du')); PX.gD.lastChild.setAttribute('d', pathOf(PX, pts.map(inv)));
    }
  }
  buildGrid();
  // highlighted lines through the point
  PX.gD.append(...hiXi.map(n => n.cloneNode()), ...hiDu.map(n => n.cloneNode()));
  const hX = [...PX.gD.querySelectorAll('.hot')];
  PS.gD.append(...hiXi.map(n => n.cloneNode()), ...hiDu.map(n => n.cloneNode()));
  const hS = [...PS.gD.querySelectorAll('.hot')];

  // arrows
  const arrow = (cls, name) => {
    const g = s('g', { class: 'dg-arrow ' + cls }), ln = s('line'), hd = s('polygon'), lb = txt(0, 0, name, 'dg-name ' + cls, 'middle');
    g.append(ln, hd); return { g, ln, hd, lb };
  };
  const arrs = {
    xE: [arrow('pr', 'e₁'), arrow('pr', 'e₂')], xD: [arrow('du', 'e*¹'), arrow('du', 'e*²')],
    sE: [arrow('pr', 'e₁'), arrow('pr', 'e₂')], sD: [arrow('du', 'e*¹'), arrow('du', 'e*²')],
  };
  const setArrow = (a, P, from, v, k) => {
    const x1 = P.X(from[0]), y1 = P.Y(from[1]), x2 = P.X(from[0] + k * v[0]), y2 = P.Y(from[1] + k * v[1]);
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, hl = Math.min(6, len * 0.5), hw = hl * 0.45;
    const bx = x2 - ux * hl, by = y2 - uy * hl;
    a.ln.setAttribute('x1', x1); a.ln.setAttribute('y1', y1); a.ln.setAttribute('x2', bx); a.ln.setAttribute('y2', by);
    a.hd.setAttribute('points', `${x2},${y2} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`);
    a.lb.setAttribute('x', x2 + ux * 7 - uy * 2); a.lb.setAttribute('y', y2 + uy * 7 + ux * 2);
  };
  const addArrows = (P, list, on) => { if (on) for (const a of list) P.gP.append(a.g, a.lb); };
  addArrows(PX, arrs.xE, showPrim); addArrows(PX, arrs.xD, showDualB);
  addArrows(PS, arrs.sE, showPrim); addArrows(PS, arrs.sD, showDualB);

  // draggable point
  const mkPt = P => {
    const g = s('g', { class: 'dg-pt' + (cfg.fixed ? ' fixed' : '') });
    const dot = s('circle', { r: 3.8, class: 'dg-dot' }), hit = s('circle', { r: 12, class: 'dg-hit' });
    g.append(dot, hit); P.gP.append(g); return { dot, hit };
  };
  const qX = mkPt(PX), qS = mkPt(PS);
  const drag = (pt, P, toX) => {
    if (cfg.fixed) return;
    pt.hit.addEventListener('pointerdown', e => {
      e.preventDefault(); pt.hit.setPointerCapture(e.pointerId);
      const move = ev => {
        const q = P.svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
        const m = q.matrixTransform(P.svg.getScreenCTM().inverse());
        const x = toX(P.toData(m.x, m.y));
        if (x.every(isFinite)) { p = clampX(x); draw(); }
      };
      const up = () => { for (const [n, f] of [['pointermove', move], ['pointerup', up], ['pointercancel', up]]) pt.hit.removeEventListener(n, f); };
      pt.hit.addEventListener('pointermove', move); pt.hit.addEventListener('pointerup', up); pt.hit.addEventListener('pointercancel', up);
    });
  };
  drag(qX, PX, d => d);
  drag(qS, PS, d => inv(d));

  const out = ro.length ? h('div', { class: 'fe-sec dg-read' }) : null;
  const btns = [];
  if (!cfg.fixed && cfg.reset !== false) btns.push(h('button', { class: 'btn ghost', type: 'button', onclick: () => { p = [...start]; draw(); } }, M(L.reset)));
  for (const pr of cfg.presets ?? []) btns.push(h('button', { class: 'btn ghost', type: 'button', onclick: () => { p = clampX(pr.x ?? p); draw(); } }, M(pr.label)));

  el.classList.add('dg-widget');
  if (panels === 'xi') PS.svg.style.display = 'none';
  if (panels === 'dual') PX.svg.style.display = 'none';
  el.append(h('div', { class: 'dg-panels' }, PX.svg, PS.svg), out ?? '', btns.length ? h('div', { class: 'wbtns' }, ...btns) : '');

  const pm = Mx => `\\begin{pmatrix}${f2(Mx[0][0])}&${f2(Mx[0][1])}\\\\${f2(Mx[1][0])}&${f2(Mx[1][1])}\\end{pmatrix}`;
  const place = (q, P, v) => { q.dot.setAttribute('cx', P.X(v[0])); q.dot.setAttribute('cy', P.Y(v[1])); q.hit.setAttribute('cx', P.X(v[0])); q.hit.setAttribute('cy', P.Y(v[1])); };
  const unit = [[1, 0], [0, 1]];

  function draw() {
    const xs = grad(p), G = hess(p), Gs = hessStar(xs);
    place(qX, PX, p); place(qS, PS, xs);
    // lines through the point
    const set = (nodes, P, pts) => nodes.forEach((n, i) => n.setAttribute('d', pathOf(P, pts[i])));
    const sample = (mk, r) => [0, 1].map(i => { const a = []; for (let k = 0; k <= N; k++) a.push(mk(i, r[1 - i][0] + (r[1 - i][1] - r[1 - i][0]) * k / N)); return a; });
    const xiLine = (i, t) => (i === 0 ? [p[0], t] : [t, p[1]]);       // xi_i = const, in xi coordinates
    const duLine = (i, t) => (i === 0 ? [xs[0], t] : [t, xs[1]]);     // xi*_i = const, in xi* coordinates
    const ptsXi = sample(xiLine, lo.map((v, i) => [v, hi[i]]));
    const ptsDu = sample(duLine, er);
    const hotXi = showXi, hotDu = showDual;
    hX.forEach((n, k) => { n.style.display = (k < 2 ? hotXi : hotDu) ? '' : 'none'; });
    hS.forEach((n, k) => { n.style.display = (k < 2 ? hotXi : hotDu) ? '' : 'none'; });
    set(hX.slice(0, 2), PX, ptsXi); set(hX.slice(2), PX, ptsDu.map(a => a.map(inv)));
    set(hS.slice(0, 2), PS, ptsXi.map(a => a.map(grad))); set(hS.slice(2), PS, ptsDu);
    // arrows
    const col = (Mx, j) => [Mx[0][j], Mx[1][j]];
    const kOf = (P, vs) => 0.15 * Math.min(P.rx[1] - P.rx[0], P.ry[1] - P.ry[0]) / Math.max(...vs.map(v => Math.hypot(v[0], v[1])));
    const kx = kOf(PX, [col(unit, 0), col(unit, 1), col(Gs, 0), col(Gs, 1)]);
    const ks = kOf(PS, [col(unit, 0), col(unit, 1), col(G, 0), col(G, 1)]);
    for (let i = 0; i < 2; i++) {
      setArrow(arrs.xE[i], PX, p, col(unit, i), kx); setArrow(arrs.xD[i], PX, p, col(Gs, i), kx);
      setArrow(arrs.sE[i], PS, xs, col(G, i), ks); setArrow(arrs.sD[i], PS, xs, col(unit, i), ks);
    }
    // numbers
    const GGs = [[0, 0], [0, 0]], inner = [[0, 0], [0, 0]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      for (let k = 0; k < 2; k++) GGs[i][j] += G[i][k] * Gs[k][j];
      // <e_i, e*^j> = e_i^T G e*^j, e*^j = column j of Gs, e_i = unit vector i
      let v = 0; for (let k = 0; k < 2; k++) v += G[i][k] * Gs[k][j];
      inner[i][j] = v;
    }
    if (out) {
      out.textContent = '';
      const rows = [];
      if (ro.includes('point')) rows.push(`${L.xi}=(${f2(p[0])},${f2(p[1])}),\\quad ${L.xis}=(${f2(xs[0])},${f2(xs[1])})`);
      if (ro.includes('G')) rows.push(`G=\\nabla^2${L.psi}=${pm(G)}`);
      if (ro.includes('Gstar')) rows.push(`G^*=\\nabla^2${L.psi}^*=${pm(Gs)}`);
      if (ro.includes('product')) rows.push(`G\\,G^*=${pm(GGs)}`);
      if (ro.includes('inner')) rows.push(`\\langle e_i,e^{*j}\\rangle=${pm(inner)}`);
      for (const r of rows) out.append(h('div', { class: 'dg-row' }, T(r)));
    }
    el.dataset.x1 = f3(p[0]); el.dataset.x2 = f3(p[1]); el.dataset.s1 = f3(xs[0]); el.dataset.s2 = f3(xs[1]);
    el.dataset.g11 = f3(G[0][0]); el.dataset.g12 = f3(G[0][1]); el.dataset.g22 = f3(G[1][1]);
  }
  draw();
}
