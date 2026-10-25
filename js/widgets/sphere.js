// `sphere` widget: the figures of the final exam. A rotatable 3D unit sphere
// (canvas, no library) with the angle chart (α1, α2) and the projection chart
// (β1, β2) drawn beside it. It only DISPLAYS: no component values, no labelled
// answers. Views are chosen by `view` (documented in docs/LESSON_FORMAT.md,
// `sphere`). Palette, frames and text helpers are shared with js/torus.js.

import { h } from '../dom.js';
import { mdInline } from '../render.js';
import { palette, css, mixc, arrowHead, haloText, frame } from './torus.js';

const PI = Math.PI, TAU = 2 * PI, R3 = Math.sqrt(3);

// ---------------------------------------------------------------- geometry
const Phi = (a1, a2) => [Math.sin(a1) * Math.cos(a2), Math.sin(a1) * Math.sin(a2), Math.cos(a1)];
const sweep = (f, a, b, n) => Array.from({ length: n + 1 }, (_, i) => f(a + (b - a) * i / n));
const meridian = (a2, a1s = 0, a1e = PI) => sweep(t => Phi(t, a2), a1s, a1e, Math.max(8, Math.round(60 * (a1e - a1s) / PI)));
const parallel = (a1, a2s = -PI, a2e = PI) => sweep(t => Phi(a1, t), a2s, a2e, Math.max(8, Math.round(96 * (a2e - a2s) / TAU)));
const GMER = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(k => k * PI / 6);      // meridians (the one at ±π is the cut)
const GPAR = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11].map(k => k * PI / 12);           // parallels (the equator is drawn apart)
const EPS = 0.07;                                                               // γ at α2 = +EPS, δ at α2 = -EPS (readability)
const gam = l => Phi(Math.asin(l), EPS), del = a => Phi(a, -EPS);
const LAM = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => k / 10), LAD = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => k * PI / 20);

// ------------------------------------------------------------------ camera
function camera(view, W, H, axes) {
  const ca = Math.cos(view.az), sa = Math.sin(view.az), ce = Math.cos(view.el), se = Math.sin(view.el);
  const S = Math.min(W, H) / 2 / (axes ? 1.5 : 1.1), cx = W / 2, cy = H / 2;
  return { S, cx, cy,
    proj: ([x, y, z]) => { const x1 = x * ca - y * sa, y1 = x * sa + y * ca; return [cx + S * x1, cy - S * (y1 * se + z * ce), y1 * ce - z * se]; } };
}

// sc: { tint(a1,a2) -> [rgb, alpha] | null, dec: [...], axes: bool }
// dec: curve {pts, color, w, dash?, noHidden?} | dot {p, color, open?, r?} | ticks {fn, vals, color, len?}
//      label {p | scr:[x,y] (in units of the radius), text, off?, color, size?}
function render3d(ctx, W, H, view, sc, P) {
  const cam = camera(view, W, H, sc.axes), { proj, S, cx, cy } = cam;
  const baseCol = mixc(P.surface, P.base, 0.3);
  ctx.beginPath(); ctx.arc(cx, cy, S, 0, TAU); ctx.fillStyle = css(baseCol); ctx.fill();
  if (sc.tint) {
    const NA = 36, NB = 72;
    for (let i = 0; i < NA; i++) for (let j = 0; j < NB; j++) {
      const a0 = PI * i / NA, a1 = PI * (i + 1) / NA, b0 = -PI + TAU * j / NB, b1 = -PI + TAU * (j + 1) / NB;
      const t = sc.tint((a0 + a1) / 2, (b0 + b1) / 2);
      if (!t || proj(Phi((a0 + a1) / 2, (b0 + b1) / 2))[2] >= 0) continue;
      const col = css(mixc(baseCol, t[0], t[1]));
      ctx.beginPath();
      [Phi(a0, b0), Phi(a1, b0), Phi(a1, b1), Phi(a0, b1)].forEach((v, k) => { const [x, y] = proj(v); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.closePath(); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.fill(); ctx.stroke();
    }
  }
  const dec = sc.dec;
  const runs = (Q, vis, want) => {
    ctx.beginPath();
    for (let i = 0; i + 1 < Q.length; i++) if (vis[i] === want) {
      if (!(i > 0 && vis[i - 1] === want)) ctx.moveTo(Q[i][0], Q[i][1]);
      ctx.lineTo(Q[i + 1][0], Q[i + 1][1]);
    }
    ctx.stroke();
  };
  const prep = d => { const Q = d.pts.map(proj); return { Q, vis: Q.slice(1).map((q, i) => (Q[i][2] + q[2]) / 2 < 0) }; };
  const curves = dec.filter(d => d.k === 'curve').map(d => ({ d, ...prep(d) }));
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const { d, Q, vis } of curves) if (!d.noHidden) {          // hidden parts, dashed and faint
    ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = d.color; ctx.lineWidth = Math.max(1, d.w * 0.75); ctx.setLineDash([3, 4]); ctx.lineCap = 'butt';
    runs(Q, vis, false); ctx.restore();
  }
  for (const { d, Q, vis } of curves) {
    ctx.strokeStyle = d.color; ctx.lineWidth = d.w; ctx.setLineDash(d.dash ?? []); runs(Q, vis, true); ctx.setLineDash([]);
  }
  ctx.beginPath(); ctx.arc(cx, cy, S, 0, TAU); ctx.strokeStyle = css(P.ink); ctx.lineWidth = 2; ctx.stroke();
  for (const d of dec) {
    if (d.k === 'ticks') for (const v of d.vals) {
      const e = 1e-3, A = proj(d.fn(v)); if (A[2] >= 0) continue;
      const B = proj(d.fn(v - e)), C = proj(d.fn(v + e)), tx = C[0] - B[0], ty = C[1] - B[1], L = Math.hypot(tx, ty) || 1, l = d.len ?? 5;
      ctx.strokeStyle = d.color; ctx.lineWidth = 2.2; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(A[0] + l * ty / L, A[1] - l * tx / L); ctx.lineTo(A[0] - l * ty / L, A[1] + l * tx / L); ctx.stroke();
    } else if (d.k === 'dot') {
      const A = proj(d.p), vis = A[2] < 0;
      ctx.save(); ctx.globalAlpha = vis ? 1 : 0.4; ctx.beginPath(); ctx.arc(A[0], A[1], d.r ?? 5, 0, TAU);
      ctx.fillStyle = d.open ? css(P.surface) : d.color; ctx.fill(); ctx.strokeStyle = d.color; ctx.lineWidth = 2.2; ctx.stroke(); ctx.restore();
    }
  }
  if (sc.axes) for (const [e, name] of [[[1, 0, 0], 'a'], [[0, 1, 0], 'b'], [[0, 0, 1], 'c']]) {
    const A = proj([0, 0, 0]), B = proj(e.map(x => 1.38 * x)), L = proj(e.map(x => 1.52 * x));
    ctx.save(); ctx.globalAlpha = 0.85; arrowHead(ctx, A, B, css(P.muted), 1.2, 7); ctx.restore();
    ctx.font = `italic 14px ${P.font}`; ctx.fillStyle = css(P.muted); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, L[0], L[1]);
  }
  for (const d of dec) if (d.k === 'label') {
    let x, y;
    if (d.scr) { x = cx + S * d.scr[0]; y = cy - S * d.scr[1]; }
    else { const A = proj(d.p); if (A[2] >= 0) continue; [x, y] = A; }
    haloText(ctx, P, d.text, x + (d.off?.[0] ?? 0), y + (d.off?.[1] ?? 0), d.color, d.size ?? 16);
  }
}

// ----------------------------------------------------------------- 2D panels
// geometry with room for a density plot above (top) or below (bottom) the chart
function geom(W, extra) {
  const l = 30, r = 8, side = W - l - r, eh = extra ? Math.round(side * 0.34) : 0, gap = extra ? 18 : 0;
  const t = 8 + (extra === 'top' ? eh + gap : 0), b = 22 + (extra === 'bottom' ? eh + gap : 0);
  return { l, r, t, b, side, eh, gap, H: t + side + b };
}
const txt = (ctx, P, s, x, y, color, align = 'center', size = 12, italic = true) => {
  ctx.font = `${italic ? 'italic ' : ''}${size}px ${P.font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
};
// box with labelled ticks: xt, yt = [[value, label, color?]]
function box(D, P, { xt = [], yt = [], xn, yn }) {
  const { ctx, g, dom } = D;
  ctx.strokeStyle = css(P.ink, 0.75); ctx.lineWidth = 1.2; ctx.strokeRect(g.l, g.t, g.side, g.side);
  for (const [v, s, c] of xt) { const X = D.px(v, dom[2])[0]; txt(ctx, P, s, X, g.t + g.side + 12, c ?? css(P.muted), 'center', 11, false); }
  for (const [v, s, c] of yt) { const Y = D.px(dom[0], v)[1]; txt(ctx, P, s, g.l - 5, Y, c ?? css(P.muted), 'right', 11, false); }
  if (xn) txt(ctx, P, xn, g.l + g.side - 5, g.t + g.side - 11, css(P.muted), 'right', 13);
  if (yn) txt(ctx, P, yn, g.l + 6, g.t + 11, css(P.muted), 'left', 13);
}
function cross(D, P, xn, yn) {                                                    // axes through the origin of a disk panel
  const { ctx } = D, e = 1.2;
  D.path([[-e, 0], [e, 0]], css(P.muted, 0.8), 1.1); D.path([[0, -e], [0, e]], css(P.muted, 0.8), 1.1);
  const [rx, ry] = D.px(e, 0), [tx, ty] = D.px(0, e);
  txt(ctx, P, xn, rx - 6, ry + 12, css(P.muted), 'right', 13); txt(ctx, P, yn, tx + 12, ty + 4, css(P.muted), 'left', 13);
}
const diskPts = (r, a = 0, b = TAU) => sweep(t => [r * Math.cos(t), r * Math.sin(t)], a, b, 90);
const SQ = (x1 = PI) => [0, x1, -PI, PI], DISK = [-1.2, 1.2, -1.2, 1.2];
const blue = (P, a = 0.6) => css(P.vec, a), orange = (P, a = 0.8) => css(P.gold, a), green = P => css(P.good), purple = P => css(P.basis);
const tint = P => css(P.gold, 0.2);

// grids in the two charts. X: α1 across (0..x1), α2 up. Y: unit disk.
const gridX = (D, P, x1 = PI, a = 0.55) => {
  for (const b of GMER) D.path([[0, b], [x1, b]], blue(P, a), 1);
  for (const p of GPAR) if (p <= x1) D.path([[p, -PI], [p, PI]], orange(P, a + 0.15), 1);
};
const gridY = (D, P, a = 0.55) => {
  for (const b of GMER.concat([PI])) D.path([[0, 0], [Math.cos(b), Math.sin(b)]], blue(P, a), 1);
  for (const p of GPAR) if (p < PI / 2) D.path(diskPts(Math.sin(p)), orange(P, a + 0.15), 1);
};
const rimY = (D, P) => D.path(diskPts(1), css(P.gold), 1.8, [5, 3]);
const mark = (D, P, x, y, color, len = 6) => { const [X, Y] = D.px(x, y), c = D.ctx; c.strokeStyle = color; c.lineWidth = 2.2; c.lineCap = 'butt'; c.beginPath(); c.moveTo(X, Y - len); c.lineTo(X, Y + len); c.stroke(); };
const CAP_X = '$(\\mathcal{U},\\mathscr{X})$: $\\alpha_1$ across, $\\alpha_2$ up';
const CAP_Y = '$(\\mathcal{V},\\mathscr{Y})$: $\\beta_1$ across, $\\beta_2$ up';

// ------------------------------------------------------------------- views
const grid3 = (P, a = 0.7) => [
  ...GMER.map(b => ({ k: 'curve', pts: meridian(b), color: css(P.vec, a), w: 1.1 })),
  ...GPAR.map(p => ({ k: 'curve', pts: parallel(p), color: css(P.gold, a + 0.15), w: 1.1 })),
];
const equator = (P, color, w, dash) => ({ k: 'curve', pts: parallel(PI / 2), color, w, dash });
const ticks3 = P => [
  { k: 'ticks', fn: gam, vals: LAM, color: css(P.vec) },
  { k: 'ticks', fn: del, vals: LAD, color: css(P.gold) },
];
const gd3 = P => [
  { k: 'curve', pts: sweep(a => del(a), 0, PI / 2, 60), color: css(P.gold), w: 3 },
  { k: 'curve', pts: sweep(l => gam(l), 0, 1, 80), color: css(P.vec), w: 3 },
  ...ticks3(P),
  { k: 'label', p: Phi(1.0, EPS), text: 'γ', off: [-17, 0], color: css(P.vec), size: 18 },
  { k: 'label', p: Phi(1.0, -EPS), text: 'δ', off: [17, 0], color: css(P.gold), size: 18 },
];

const VIEWS = {
  // Figure 1: the setting
  domain: P => ({
    az: -2.05, el: 0.45, axes: true,
    sc: { axes: true, tint: a => (a < PI / 2 ? [P.gold, 0.22] : null), dec: [
      ...grid3(P),
      equator(P, css(P.gold), 2, [6, 4]),
      { k: 'curve', pts: meridian(PI), color: css(P.good), w: 3.4 },
      { k: 'dot', p: [0, 0, 1], color: css(P.good), open: true, r: 5.5 }, { k: 'dot', p: [0, 0, -1], color: css(P.good), open: true, r: 5.5 },
      { k: 'label', p: [0, 0, 1], text: 'N', off: [12, -10], color: css(P.ink) }, { k: 'label', p: [0, 0, -1], text: 'S', off: [12, 10], color: css(P.ink) },
      { k: 'label', scr: [-0.95, 0.9], text: 'V', color: css(P.gold), size: 19 }, { k: 'label', scr: [0.95, -0.95], text: 'M', color: css(P.ink), size: 19 },
    ] },
    legend: 'The sphere $\\mathcal{M}$: meridians $\\alpha_2=\\text{const}$ (blue) and parallels $\\alpha_1=\\text{const}$ (orange); green: the half meridian $\\{b=0,\\,a\\le 0\\}$ and the two poles $N$, $S$, which $\\mathcal{U}$ leaves out (dashed where hidden); shaded: the northern hemisphere $\\mathcal{V}=\\{c>0\\}$, bounded by the equator (dashed). Below, the angle chart image $\\mathscr{X}(\\mathcal{U})$ with $\\mathscr{X}(\\mathcal{U}\\cap\\mathcal{V})$ shaded, and the projection chart image $\\mathscr{Y}(\\mathcal{V})$, the open unit disk. Drag to rotate.',
    panels: [
      { cap: CAP_X, dom: SQ(), draw: (D, P) => {
        D.fillPoly([[0, -PI], [PI / 2, -PI], [PI / 2, PI], [0, PI]], tint(P));
        D.clip(() => gridX(D, P));
        D.path([[PI / 2, -PI], [PI / 2, PI]], css(P.gold), 1.8, [5, 3]);
        box(D, P, { xt: [[PI / 2, 'π/2'], [PI, 'π']], yt: [[-PI, '−π'], [PI, 'π']], xn: 'α₁', yn: 'α₂' });
      } },
      { cap: CAP_Y, dom: DISK, draw: (D, P) => {
        D.fillPoly(diskPts(1), tint(P)); D.clip(() => gridY(D, P)); rimY(D, P); cross(D, P, 'β₁', 'β₂');
        D.path([[-1, 0], [0, 0]], green(P), 3.4);
        const [X, Y] = D.px(0, 0); D.ctx.beginPath(); D.ctx.arc(X, Y, 4.5, 0, TAU); D.ctx.fillStyle = css(P.surface); D.ctx.fill(); D.ctx.strokeStyle = green(P); D.ctx.lineWidth = 2.2; D.ctx.stroke();
      } },
    ],
  }),
  // Figure 2: γ, δ and σ
  curves: (P, cfg) => {
    const a0 = cfg.alpha0 ?? PI / 4;
    return {
      az: -1.9, el: 0.5,
      sc: { tint: a => (a < PI / 2 ? [P.gold, 0.22] : null), dec: [
        ...grid3(P, 0.5), equator(P, css(P.gold), 1.8, [6, 4]),
        { k: 'curve', pts: parallel(a0), color: css(P.basis), w: 3 },
        { k: 'label', p: Phi(a0, 0.9), text: 'σ', off: [14, -8], color: css(P.basis), size: 18 },
        ...gd3(P),
      ] },
      legend: 'The curves $\\gamma$ (blue, ticks at $\\lambda=0.1,\\dots,0.9$) and $\\delta$ (orange, ticks at $\\lambda=\\frac{\\pi}{20},\\dots,\\frac{9\\pi}{20}$) run along the same meridian $\\alpha_2=0$; they are drawn on two slightly separated copies of it only for readability. Purple: the parallel $\\sigma$ at $\\alpha_1=\\alpha_0$. Below, their images in $(\\mathcal{V},\\mathscr{Y})$ and in $(\\mathcal{U},\\mathscr{X})$ on $\\mathcal{U}\\cap\\mathcal{V}$. Drag to rotate.',
      panels: [
        { cap: CAP_Y, dom: DISK, draw: (D, P) => {
          D.fillPoly(diskPts(1), tint(P)); D.clip(() => gridY(D, P, 0.5)); rimY(D, P); cross(D, P, 'β₁', 'β₂');
          D.path(diskPts(Math.sin(a0)), purple(P), 3);
          D.path([[0, EPS], [1, EPS]], css(P.vec), 3); D.path([[0, -EPS], [1, -EPS]], css(P.gold), 3);
          for (const l of LAM) mark(D, P, l, EPS, css(P.vec)); for (const a of LAD) mark(D, P, Math.sin(a), -EPS, css(P.gold));
          txt(D.ctx, P, 'σ', ...D.px(-0.72 * Math.sin(a0), 0.72 * Math.sin(a0)), purple(P), 'center', 16);
        } },
        { cap: CAP_X, dom: SQ(PI / 2), draw: (D, P) => {
          D.fillPoly([[0, -PI], [PI / 2, -PI], [PI / 2, PI], [0, PI]], tint(P));
          D.clip(() => gridX(D, P, PI / 2, 0.5));
          D.path([[a0, -PI], [a0, PI]], purple(P), 3);
          D.path([[0, 0.45], [PI / 2, 0.45]], css(P.vec), 3); D.path([[0, -0.45], [PI / 2, -0.45]], css(P.gold), 3);
          for (const l of LAM) mark(D, P, Math.asin(l), 0.45, css(P.vec)); for (const a of LAD) mark(D, P, a, -0.45, css(P.gold));
          box(D, P, { xt: [[a0, 'α₀', purple(P)], [PI / 2, 'π/2']], yt: [[-PI, '−π'], [PI, 'π']], xn: 'α₁', yn: 'α₂' });
        } },
      ],
    };
  },
  // Figure 3: geodesics of the induced metric
  geodesics: (P, cfg) => {
    const ab = cfg.alpha1bar ?? PI / 4, GM = [-2 * PI / 3, -PI / 3, PI / 3, 2 * PI / 3];
    return {
      az: -1.9, el: 0.45,
      sc: { dec: [
        ...grid3(P, 0.45),
        ...GM.map(b => ({ k: 'curve', pts: meridian(b), color: css(P.good), w: 2.4 })),
        equator(P, css(P.good), 2.8),
        { k: 'curve', pts: parallel(ab), color: css(P.basis), w: 2.8, dash: [7, 4] },
        ...gd3(P),
      ] },
      legend: 'Green: some meridians $\\alpha_2=\\text{const}$ and the equator $\\alpha_1=\\frac{\\pi}{2}$. Purple, dashed: a parallel $\\alpha_1=\\bar\\alpha_1$. Blue and orange ticks: the parametrizations $\\gamma$ ($\\lambda=0.1,\\dots,0.9$) and $\\delta$ ($\\lambda=\\frac{\\pi}{20},\\dots,\\frac{9\\pi}{20}$) of the meridian $\\alpha_2=0$, drawn on two slightly separated copies of it. Below, the same curves in the chart $(\\mathcal{U},\\mathscr{X})$. Drag to rotate.',
      panels: [
        { cap: CAP_X, dom: SQ(), draw: (D, P) => {
          D.clip(() => {
            gridX(D, P, PI, 0.4);
            for (const b of GM) D.path([[0, b], [PI, b]], green(P), 2.4);
            D.path([[PI / 2, -PI], [PI / 2, PI]], green(P), 2.8);
            D.path([[ab, -PI], [ab, PI]], purple(P), 2.8, [7, 4]);
            D.path([[0, 0.3], [PI / 2, 0.3]], css(P.vec), 3); D.path([[0, -0.3], [PI / 2, -0.3]], css(P.gold), 3);
          });
          for (const l of LAM) mark(D, P, Math.asin(l), 0.3, css(P.vec)); for (const a of LAD) mark(D, P, a, -0.3, css(P.gold));
          box(D, P, { xt: [[ab, 'α₁', purple(P)], [PI / 2, 'π/2'], [PI, 'π']], yt: [[-PI, '−π'], [PI, 'π']], xn: 'α₁', yn: 'α₂' });
        } },
      ],
    };
  },
  // Figure 4: the region D (and, optionally, the two densities)
  region: (P, cfg) => {
    const dens = !!cfg.densities, a1 = PI / 6, a2 = PI / 3, sp = dens ? 'top' : null, sb = dens ? 'bottom' : null;
    const inD = (a, b) => a > a1 && a < a2 && Math.abs(b) < PI / 2;
    return {
      az: -1.35, el: 0.55, axes: true,
      sc: { axes: true, tint: (a, b) => (inD(a, b) ? [P.gold, 0.55] : null), dec: [
        ...grid3(P, 0.55),
        { k: 'curve', pts: [...parallel(a1, -PI / 2, PI / 2), ...meridian(PI / 2, a1, a2), ...parallel(a2, PI / 2, -PI / 2), ...meridian(-PI / 2, a2, a1)], color: css(P.gold), w: 2.6 },
        { k: 'label', p: Phi((a1 + a2) / 2, 0), text: 'D', off: [0, 0], color: css(P.ink), size: 19 },
      ] },
      legend: 'The region $\\mathcal{D}=\\{a>0,\\ \\tfrac12<c<\\tfrac{\\sqrt3}{2}\\}$ (shaded) on $\\mathcal{M}$, seen from above the side of the positive $a$-axis. Below, its image in the angle chart, a rectangle, and in the projection chart, a half annulus.' + (dens ? ' Above and below: the scalar densities of the two charts, with the part over $\\mathscr{X}(\\mathcal{D})$ and $\\mathscr{Y}(\\mathcal{D})$ shaded.' : '') + ' Drag to rotate.',
      panels: [
        { cap: CAP_X, dom: SQ(PI / 2), extra: sp, draw: (D, P) => {
          const { ctx, g } = D;
          D.fillPoly([[a1, -PI / 2], [a2, -PI / 2], [a2, PI / 2], [a1, PI / 2]], css(P.gold, 0.35));
          D.clip(() => gridX(D, P, PI / 2, 0.45));
          D.path([[a1, -PI / 2], [a2, -PI / 2], [a2, PI / 2], [a1, PI / 2], [a1, -PI / 2]], css(P.gold), 2.4);
          box(D, P, { xt: [[PI / 2, 'π/2'], ...(dens ? [[a1, 'π/6'], [a2, 'π/3']] : [])], yt: [[-PI, '−π'], [PI, 'π'], ...(dens ? [[-PI / 2, '−π/2'], [PI / 2, 'π/2']] : [])], xn: 'α₁', yn: 'α₂' });
          if (dens) {
            const base = g.t - g.gap, top = base - g.eh, f = t => base - (base - top) * 0.95 * Math.sin(t) / 1;
            const xs = t => D.px(t, 0)[0], pts = sweep(t => [xs(t), f(t)], 0, PI / 2, 60);
            ctx.beginPath(); ctx.moveTo(xs(a1), base); sweep(t => t, a1, a2, 24).forEach(t => ctx.lineTo(xs(t), f(t))); ctx.lineTo(xs(a2), base); ctx.closePath(); ctx.fillStyle = css(P.gold, 0.35); ctx.fill();
            ctx.save(); ctx.strokeStyle = css(P.gold, 0.8); ctx.lineWidth = 1; ctx.setLineDash([1.5, 3]);
            for (const t of [a1, a2]) { ctx.beginPath(); ctx.moveTo(xs(t), f(t)); ctx.lineTo(xs(t), D.px(t, PI / 2)[1]); ctx.stroke(); } ctx.restore();
            ctx.strokeStyle = css(P.muted); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(g.l, base); ctx.lineTo(g.l + g.side, base); ctx.stroke();
            ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.strokeStyle = css(P.vec); ctx.lineWidth = 2.4; ctx.stroke();
            txt(ctx, P, 'sin α₁', g.l + g.side * 0.55, top + 2, css(P.vec), 'left', 13);
          }
        } },
        { cap: CAP_Y, dom: DISK, extra: sb, draw: (D, P) => {
          const { ctx, g } = D, r1 = 0.5, r2 = R3 / 2;
          D.fillPoly(diskPts(1), css(P.gold, 0.1)); D.clip(() => gridY(D, P, 0.45));
          const half = [...diskPts(r2, -PI / 2, PI / 2), ...diskPts(r1, PI / 2, -PI / 2)];
          D.fillPoly(half, css(P.gold, 0.35)); D.path([...half, half[0]], css(P.gold), 2.4);
          D.path(diskPts(1), css(P.ink, 0.8), 1.3, [5, 3]); cross(D, P, 'β₁', 'β₂');
          if (dens) {
            const top = g.t + g.side + g.gap, base = top + g.eh, vmax = 4.4, f = v => base - (base - top) * v / vmax;
            const xs = b => D.px(b, 0)[0], w = b => 1 / Math.sqrt(1 - b * b);
            ctx.beginPath(); ctx.moveTo(xs(r1), base); sweep(b => b, r1, r2, 24).forEach(b => ctx.lineTo(xs(b), f(w(b)))); ctx.lineTo(xs(r2), base); ctx.closePath(); ctx.fillStyle = css(P.gold, 0.35); ctx.fill();
            ctx.save(); ctx.strokeStyle = css(P.gold, 0.8); ctx.lineWidth = 1; ctx.setLineDash([1.5, 3]);
            for (const b of [r1, r2]) { ctx.beginPath(); ctx.moveTo(xs(b), f(w(b))); ctx.lineTo(xs(b), D.px(b, 0)[1]); ctx.stroke(); }
            ctx.strokeStyle = css(P.muted, 0.8); ctx.beginPath(); ctx.moveTo(xs(1), top - 4); ctx.lineTo(xs(1), base); ctx.stroke(); ctx.restore();
            ctx.strokeStyle = css(P.muted); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(xs(0), base); ctx.lineTo(xs(1.2), base); ctx.stroke();
            ctx.beginPath(); sweep(b => b, 0, 0.972, 80).forEach((b, i) => (i ? ctx.lineTo(xs(b), f(w(b))) : ctx.moveTo(xs(b), f(w(b))))); ctx.strokeStyle = css(P.vec); ctx.lineWidth = 2.4; ctx.stroke();
            txt(ctx, P, '1', xs(1) + 4, base + 9, css(P.muted), 'left', 11, false); txt(ctx, P, 'β₁', xs(1.2), base + 9, css(P.muted), 'center', 12);
            txt(ctx, P, '1/√(1−β₁²)', g.l + 2, top + 8, css(P.vec), 'left', 13);
          }
        } },
      ],
    };
  },
};

// ------------------------------------------------------------------ widget
const TAB = { domain: 'Setting', curves: 'Curves', geodesics: 'Geodesics', region: 'Region' };

// config: view: 'domain' | 'curves' | 'geodesics' | 'region' | [several, as tabs]; labels; rotate: false; az, el;
//         alpha0 (curves), alpha1bar (geodesics), densities (region)
export function sphereFigure(el, cfg) {
  const names = [].concat(cfg.view ?? 'domain').filter(v => VIEWS[v]);
  if (!names.length) names.push('domain');
  let name = names[0], P = palette(), spec, view, cv3, caps;
  const stage = h('div');
  const tabs = names.length > 1 ? h('div', { class: 'wbtns tor-tabs' }, names.map(n => h('button', { class: 'btn ghost', type: 'button', 'data-view': n,
    onclick: () => { name = n; build(); } }, (cfg.labels ?? {})[n] ?? TAB[n]))) : '';
  el.append(...[tabs, stage].filter(Boolean));
  const view0 = () => ({ az: cfg.az ?? spec.az, el: cfg.el ?? spec.el });
  const set = v => { view = { ...view, ...v }; view.el = Math.max(-1.35, Math.min(1.5, view.el)); draw3(); };

  function build() {
    P = palette(); spec = VIEWS[name](P, cfg); view = view0();
    cv3 = h('canvas', { class: 'tor-3d', tabindex: 0, role: 'img', 'aria-label': 'The sphere, seen in 3D. Drag to rotate; arrow keys also rotate.' });
    const panels = h('div', { class: 'tor-panels' });
    caps = spec.panels.map(p => ({ box: h('figure', { class: 'tor-fig' }), cv: h('canvas', { role: 'img', 'aria-label': 'A chart of the sphere' }), p }));
    caps.forEach(c => c.box.append(c.cv, h('figcaption', { html: mdInline(c.p.cap) })));
    panels.append(...caps.map(c => c.box));
    const btns = cfg.rotate !== false ? h('div', { class: 'wbtns' },
      h('button', { class: 'btn ghost', type: 'button', onclick: () => set(view0()) }, 'Reset view'),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => set({ el: 1.5 }) }, 'From above'),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => set({ el: 0.1 }) }, 'From the side')) : '';
    stage.replaceChildren(...[cv3, h('div', { class: 'tor-legend', html: mdInline(spec.legend) }), panels, btns].filter(Boolean));
    for (const b of el.querySelectorAll('.tor-tabs .btn')) b.classList.toggle('on', b.dataset.view === name);
    if (cfg.rotate !== false) rotation(cv3);
    draw3(); drawPanels();
  }

  const size = (cv, W, H) => {
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = `${H}px`;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    return ctx;
  };
  function draw3() {
    const W = cv3.getBoundingClientRect().width; if (W < 10) return;
    const H = Math.round(Math.min(W * 0.95, 480)), ctx = size(cv3, W, H);
    render3d(ctx, W, H, view, spec.sc, P);
  }
  function drawPanels() {
    for (const { cv, p } of caps) {
      const W = cv.parentElement.getBoundingClientRect().width; if (W < 10) continue;
      const g = geom(W, p.extra), ctx = size(cv, W, g.H), D = frame(ctx, g, p.dom);
      p.draw(D, P);
    }
  }
  const redraw = () => { P = palette(); const v = view; spec = VIEWS[name](P, cfg); view = v; draw3(); drawPanels(); };

  // rotation: drag (mouse: both angles; touch: only horizontal, so the page still scrolls), arrow keys
  function rotation(cv) {
    let last = null;
    cv.addEventListener('pointerdown', e => { last = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => {
      if (!last) return;
      set({ az: view.az + (e.clientX - last[0]) * 0.012, el: e.pointerType === 'mouse' ? view.el + (e.clientY - last[1]) * 0.01 : view.el });
      last = [e.clientX, e.clientY];
    });
    for (const t of ['pointerup', 'pointercancel']) cv.addEventListener(t, () => { last = null; });
    cv.addEventListener('keydown', e => {
      const d = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, 0.08], ArrowDown: [0, -0.08] }[e.key];
      if (d) { e.preventDefault(); set({ az: view.az + d[0], el: view.el + d[1] }); }
    });
  }
  new ResizeObserver(redraw).observe(el);
  new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redraw);
  build();
}
