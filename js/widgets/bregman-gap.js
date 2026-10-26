// bregman-gap
//
// A convex function psi(xi) of one variable with a draggable tangent point xi0 and a second draggable
// point xi. Draws the tangent line at xi0 and the vertical gap between the curve at xi and that line:
//   D[xi:xi0] = psi(xi) - psi(xi0) - psi'(xi0)(xi - xi0)       (the Bregman divergence, always >= 0)
// Optional: the gap in the other direction, the chord (secant), the slope as a number, and a second
// panel for the conjugate psi*(eta) = max_xi [eta xi - psi(xi)] with eta = psi'(xi0) (Legendre).
// Nothing is revealed unless the preset turns it on.
//
// Config (names are TeX; label strings are markdown inline):
//   psi: 'quad' | 'negentropy' | 'neglog' | 'quartic'
//        (1/2 xi^2 | xi ln xi - xi | -ln xi | xi^4/4 + xi^2/2); the two logs live on xi > 0
//   x0: tangent point, x: second point (defaults per psi);   fixX0, fixX: true = not draggable
//   xRange, yRange: plot extents of the xi panel;  min: lower clamp of dragged points (xi>0 cases)
//   showTangent (true), showGap (true), showChord (false)      the picture parts
//   showReverse: false      also the gap D[xi0:xi]: tangent at xi (dashed) and the gap above xi0
//   readout: false | 'forward' | 'both'   numbers D[xi:xi0] (and D[xi0:xi]); false = no numbers
//   showSlope: false        the triangle (run 1, rise psi'(xi0)) and the number psi'(xi0) in the readout
//   showConjugate: false | true   second panel: curve psi*(eta), the point eta0 = psi'(xi0), the tangent
//                           of psi* there (slope xi0); in the xi panel the tangent's intercept at xi = 0
//                           is -psi*(eta0). Numbers eta0 and -psi*(eta0) follow `readout` / `showSlope`.
//   etaRange, psiStarRange  extents of the conjugate panel
//   hide: ['tangent','gap','x']   hide those parts (picture without the answer)
//   presets: [{label, x0?, x?}]   buttons;  reset: true ("Reset" button)
//   labels: { xi, x0, psi, eta, reset }   TeX symbols
//
// el.dataset: x0, x, dfwd (D[x:x0]), drev (D[x0:x]), slope.

import { h } from '../dom.js';
import { mdInline, tex } from '../render.js';
import { s } from './plane.js';

const M = src => h('span', { html: mdInline(String(src)) });
const T = src => h('span', { html: tex(String(src)) });
const f2 = x => x.toFixed(2);
const f3 = x => x.toFixed(3);

const FUN = {
  quad: { f: x => 0.5 * x * x, d: x => x, star: e => 0.5 * e * e, dstar: e => e, x0: 1.5, x: -1, xr: [-3, 3], yr: [-3.5, 5], er: [-3, 3], sr: [-1, 5], min: -3 },
  negentropy: { f: x => (x > 0 ? x * Math.log(x) - x : 0), d: x => Math.log(x), star: e => Math.exp(e), dstar: e => Math.exp(e), x0: 1, x: 3, xr: [0, 4], yr: [-3.5, 2.5], er: [-2.5, 1.5], sr: [-1, 5], min: 0.05 },
  neglog: { f: x => -Math.log(x), d: x => -1 / x, star: e => -1 - Math.log(-e), dstar: e => -1 / e, x0: 1, x: 2.5, xr: [0, 4], yr: [-1.5, 3.5], er: [-7, 0], sr: [-3.5, 1.5], min: 0.15 },
  quartic: { f: x => x ** 4 / 4 + x * x / 2, d: x => x ** 3 + x, x0: 0.8, x: -1.3, xr: [-2, 2], yr: [-5, 6], er: [-6, 6], sr: [-1, 7], min: -2 },
};
// quartic conjugate by bisection on the increasing derivative xi^3 + xi
const quarticXi = e => { let a = -10, b = 10; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; (m ** 3 + m < e ? (a = m) : (b = m)); } return (a + b) / 2; };
FUN.quartic.dstar = quarticXi;
FUN.quartic.star = e => { const x = quarticXi(e); return e * x - FUN.quartic.f(x); };

const VW = 140, VH = 112, X0 = 20, X1 = 134, Y0 = 8, Y1 = 92;
let clipCount = 0;

export function bregmanGap(el, cfg) {
  const F = FUN[cfg.psi ?? 'quad'] ?? FUN.quad;
  const [xMin, xMax] = cfg.xRange ?? F.xr;
  const [yMin, yMax] = cfg.yRange ?? F.yr;
  const [eMin, eMax] = cfg.etaRange ?? F.er;
  const [sMin, sMax] = cfg.psiStarRange ?? F.sr;
  const lo = Math.max(xMin, cfg.min ?? F.min), hi = xMax;
  const hide = new Set(cfg.hide ?? []);
  const L = { xi: '\\xi', x0: '\\xi_0', psi: '\\psi', eta: '\\eta', reset: 'Reset', ...(cfg.labels ?? {}) };
  const clamp = v => Math.min(hi, Math.max(lo, v));
  const start = { x0: clamp(cfg.x0 ?? F.x0), x: clamp(cfg.x ?? F.x) };
  let p = { ...start };
  const showConj = !!cfg.showConjugate, showRev = !!cfg.showReverse;
  const ro = cfg.readout || false;

  const TXT = src => String(src).replace(/\\xi/g, 'ξ').replace(/\\eta/g, 'η').replace(/\\psi/g, 'ψ').replace(/_0/g, '₀').replace(/\^\*/g, '*').replace(/[$*_`{}\\]/g, m => (m === '*' ? '*' : ''));
  const txt = (x, y, str, cls, anchor = 'middle') => { const t = s('text', { x, y, class: cls, 'text-anchor': anchor, 'dominant-baseline': 'middle' }); t.textContent = str; return t; };
  const step = span => [0.5, 1, 2, 5].find(v => span / v <= 6) ?? 5;

  // ---- one panel: boxes, ticks, clip
  function panel(ax, ay, aria, [a0, a1], [b0, b1], xl, yl) {
    const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}`, role: 'img', class: 'bg-svg', 'aria-label': aria });
    const id = `bg-clip-${++clipCount}`;
    const cp = s('clipPath', { id }); cp.append(s('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0 }));
    svg.append(cp, s('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0, class: 'bg-box' }));
    const X = v => X0 + ((v - a0) / (a1 - a0)) * (X1 - X0), Y = v => Y1 - ((v - b0) / (b1 - b0)) * (Y1 - Y0);
    const gG = s('g'), gD = s('g', { 'clip-path': `url(#${id})` }), gP = s('g');
    svg.append(gG, gD, gP);
    const sx = step(a1 - a0), sy = step(b1 - b0);
    for (let v = Math.ceil(a0 / sx) * sx; v <= a1 + 1e-9; v += sx) { gG.append(s('line', { x1: X(v), x2: X(v), y1: Y0, y2: Y1, class: 'bg-grid' })); gG.append(txt(X(v), Y1 + 7, String(+v.toFixed(2)), 'bg-tick')); }
    for (let v = Math.ceil(b0 / sy) * sy; v <= b1 + 1e-9; v += sy) { gG.append(s('line', { x1: X0, x2: X1, y1: Y(v), y2: Y(v), class: 'bg-grid' })); gG.append(txt(X0 - 3, Y(v), String(+v.toFixed(2)), 'bg-tick', 'end')); }
    if (a0 < 0 && a1 > 0) gG.append(s('line', { x1: X(0), x2: X(0), y1: Y0, y2: Y1, class: 'bg-zero' }));
    if (b0 < 0 && b1 > 0) gG.append(s('line', { x1: X0, x2: X1, y1: Y(0), y2: Y(0), class: 'bg-zero' }));
    gG.append(txt((X0 + X1) / 2, VH - 4, TXT(xl), 'bg-ax'));
    const yt = txt(6, (Y0 + Y1) / 2, TXT(yl), 'bg-ax'); yt.setAttribute('transform', `rotate(-90 6 ${(Y0 + Y1) / 2})`); gG.append(yt);
    return { svg, X, Y, gD, gP, xFrom: px => a0 + ((px - X0) / (X1 - X0)) * (a1 - a0), clampY: v => Math.min(b1 + 40, Math.max(b0 - 40, v)) };
  }
  const curveD = (P, fn, a0, a1) => { let d = '', n = 160; for (let i = 0; i <= n; i++) { const x = a0 + (a1 - a0) * i / n; const y = fn(x); if (!isFinite(y)) continue; d += `${d ? 'L' : 'M'}${f2(P.X(x))},${f2(P.Y(P.clampY(y)))}`; } return d; };

  const A = panel(0, 0, 'Graph of a convex function with its tangent line', [xMin, xMax], [yMin, yMax], L.xi, L.psi + '(' + L.xi + ')');
  const cs = Math.max(lo, 1e-3);
  const aCurve = s('path', { class: 'bg-curve', d: curveD(A, F.f, F.min > 0 ? cs : xMin, xMax) });
  const aChord = s('line', { class: 'bg-chord' });
  const aTan = s('line', { class: 'bg-tan' });
  const aTanR = s('line', { class: 'bg-tan rev' });
  const aGapR = s('line', { class: 'bg-gap rev' });
  const aGap = s('line', { class: 'bg-gap' });
  const aRun = s('polyline', { class: 'bg-tri' });
  A.gD.append(aCurve, aChord, aTanR, aTan, aRun, aGapR, aGap);
  const icpt = s('circle', { r: 3, class: 'bg-icpt' }); const icl = txt(0, 0, '−' + TXT(L.psi) + '*(' + TXT(L.eta) + ')', 'bg-name tan', 'start');
  if (showConj && xMin <= 0 && xMax > 0) A.gP.append(icpt, icl);
  const mkPt = (name, cls, fixed) => {
    const g = s('g', { class: 'bg-pt ' + cls + (fixed ? ' fixed' : '') });
    const dot = s('circle', { r: 3.6, class: 'bg-dot' }), lab = txt(0, 0, TXT(name), 'bg-name', 'middle'), hit = s('circle', { r: 11, class: 'bg-hit' });
    g.append(dot, lab, hit); A.gP.append(g); return { g, dot, lab, hit };
  };
  const q0 = mkPt(L.x0, 'p0', cfg.fixX0), q1 = hide.has('x') ? null : mkPt(L.xi, 'p1', cfg.fixX);
  const drag = (pt, key) => {
    if (!pt) return;
    pt.hit.addEventListener('pointerdown', e => {
      e.preventDefault(); pt.hit.setPointerCapture(e.pointerId);
      const move = ev => { const q = A.svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY; const m = q.matrixTransform(A.svg.getScreenCTM().inverse()); p[key] = clamp(A.xFrom(m.x)); draw(); };
      const up = () => { for (const [n, f] of [['pointermove', move], ['pointerup', up], ['pointercancel', up]]) pt.hit.removeEventListener(n, f); };
      pt.hit.addEventListener('pointermove', move); pt.hit.addEventListener('pointerup', up); pt.hit.addEventListener('pointercancel', up);
    });
  };
  if (!cfg.fixX0) drag(q0, 'x0');
  if (!cfg.fixX) drag(q1, 'x');

  // ---- conjugate panel
  let B = null, bCurve, bTan, bP0, bP1, bl0;
  if (showConj) {
    B = panel(0, 0, 'Graph of the conjugate function', [eMin, eMax], [sMin, sMax], L.eta, L.psi + '^*(' + L.eta + ')');
    const eLo = F.dstar === FUN.neglog.dstar ? eMin : eMin;
    bCurve = s('path', { class: 'bg-curve conj', d: curveD(B, F.star, eLo, cfg.psi === 'neglog' ? -1e-3 : eMax) });
    bTan = s('line', { class: 'bg-tan' });
    B.gD.append(bCurve, bTan);
    bP0 = s('circle', { r: 3.6, class: 'bg-dot', style: '--c:var(--covec)' }); bP1 = s('circle', { r: 3, class: 'bg-dot open' });
    bl0 = txt(0, 0, TXT(L.eta) + '₀', 'bg-name tan');
    B.gP.append(bP0, bl0); if (q1) B.gP.append(bP1);
  }

  // ---- readout and buttons
  const out = (ro || cfg.showSlope) ? h('div', { class: 'fe-sec bg-read' }) : null;
  const btns = [];
  if ((!cfg.fixX0 || !cfg.fixX) && cfg.reset !== false) btns.push(h('button', { class: 'btn ghost', type: 'button', onclick: () => { p = { ...start }; draw(); } }, M(L.reset)));
  for (const pr of cfg.presets ?? []) btns.push(h('button', { class: 'btn ghost', type: 'button', onclick: () => { p = { x0: clamp(pr.x0 ?? p.x0), x: clamp(pr.x ?? p.x) }; draw(); } }, M(pr.label)));

  el.classList.add('bg-widget');
  el.append(h('div', { class: 'bg-panels' }, A.svg, B ? B.svg : ''), out ?? '', btns.length ? h('div', { class: 'wbtns' }, ...btns) : '');

  const D = (x, y) => F.f(x) - F.f(y) - F.d(y) * (x - y);       // D[x:y]
  const seg = (n, P, x1, y1, x2, y2) => { n.setAttribute('x1', P.X(x1)); n.setAttribute('y1', P.Y(P.clampY(y1))); n.setAttribute('x2', P.X(x2)); n.setAttribute('y2', P.Y(P.clampY(y2))); };
  const on = (n, v) => { n.style.display = v ? '' : 'none'; };
  const sg = v => (v < 0 ? '-' : '') + f2(Math.abs(v));

  function draw() {
    const { x0, x } = p, f0 = F.f(x0), d0 = F.d(x0), fx = F.f(x), dx = F.d(x);
    const tan = t => f0 + d0 * (t - x0), tanX = t => fx + dx * (t - x);
    const showTan = cfg.showTangent !== false && !hide.has('tangent');
    const showGap = cfg.showGap !== false && !hide.has('gap') && q1;
    on(aTan, showTan); seg(aTan, A, xMin, tan(xMin), xMax, tan(xMax));
    on(aTanR, showRev && q1); seg(aTanR, A, xMin, tanX(xMin), xMax, tanX(xMax));
    on(aGap, showGap); seg(aGap, A, x, tan(x), x, fx);
    on(aGapR, showRev && q1 && !hide.has('gap')); seg(aGapR, A, x0, tanX(x0), x0, f0);
    on(aChord, !!cfg.showChord && q1); seg(aChord, A, x0, f0, x, fx);
    const run = Math.min(1, hi - x0 > 0.3 ? 1 : -1);
    on(aRun, !!cfg.showSlope && showTan);
    aRun.setAttribute('points', [[x0, f0], [x0 + run, f0], [x0 + run, f0 + d0 * run]].map(([a, b]) => `${A.X(a)},${A.Y(A.clampY(b))}`).join(' '));
    const place = (pt, xv) => {
      const cx = A.X(xv), cy = A.Y(A.clampY(F.f(xv)));
      pt.dot.setAttribute('cx', cx); pt.dot.setAttribute('cy', cy); pt.hit.setAttribute('cx', cx); pt.hit.setAttribute('cy', cy);
      pt.lab.setAttribute('x', cx); pt.lab.setAttribute('y', cy + 9);
    };
    place(q0, x0); if (q1) place(q1, x);
    if (showConj) {
      const e0 = d0, ps0 = F.star(e0);
      const ix = A.X(0), iy = A.Y(A.clampY(tan(0)));
      icpt.setAttribute('cx', ix); icpt.setAttribute('cy', iy); icl.setAttribute('x', ix + 5); icl.setAttribute('y', iy - 6);
      on(bTan, showTan); seg(bTan, B, eMin, ps0 + x0 * (eMin - e0), eMax, ps0 + x0 * (eMax - e0));
      const cx = B.X(e0), cy = B.Y(B.clampY(ps0));
      bP0.setAttribute('cx', cx); bP0.setAttribute('cy', cy); bl0.setAttribute('x', cx + 5); bl0.setAttribute('y', cy + 9);
      if (q1) { bP1.setAttribute('cx', B.X(dx)); bP1.setAttribute('cy', B.Y(B.clampY(F.star(dx)))); }
    }
    if (out) {
      out.textContent = '';
      const rows = [];
      if (ro) rows.push(`D[${L.xi}:${L.x0}]=${f2(D(x, x0))}`);
      if (ro === 'both') rows.push(`D[${L.x0}:${L.xi}]=${f2(D(x0, x))}`);
      if (cfg.showSlope) rows.push(`${L.psi}'(${L.x0})=${sg(d0)}`);
      if (cfg.showSlope && showConj) rows.push(`-${L.psi}^*(${L.eta}_0)=${sg(-F.star(d0))}`);
      out.append(T(rows.join(',\\quad ')));
    }
    el.dataset.x0 = f3(x0); el.dataset.x = f3(x); el.dataset.dfwd = f3(D(x, x0)); el.dataset.drev = f3(D(x0, x)); el.dataset.slope = f3(d0);
  }
  draw();
}
