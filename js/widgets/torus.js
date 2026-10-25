// `torus` widget: the figures of the partial exam. A rotatable 3D torus
// (canvas, painter's algorithm, no library) with the angle chart (θ,φ) and the
// projection chart (a,b) drawn beside it. It only DISPLAYS: no numeric
// component values, no labelled results. Presets are chosen by `view`
// (documented in docs/LESSON_FORMAT.md, `torus`).

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const PI = Math.PI, TAU = 2 * PI;

// ---------------------------------------------------------------- geometry
const Phi = (t, p) => [(2 + Math.cos(p)) * Math.cos(t), (2 + Math.cos(p)) * Math.sin(t), Math.sin(p)];
const nrm = (t, p) => [Math.cos(p) * Math.cos(t), Math.cos(p) * Math.sin(t), Math.sin(p)];
const dPhi = (t, p) => [[-(2 + Math.cos(p)) * Math.sin(t), (2 + Math.cos(p)) * Math.cos(t), 0],
  [-Math.sin(p) * Math.cos(t), -Math.sin(p) * Math.sin(t), Math.cos(p)]];
const unit = v => { const L = Math.hypot(...v) || 1; return v.map(x => x / L); };
const toY = (t, p) => [(2 + Math.cos(p)) * Math.cos(t), (2 + Math.cos(p)) * Math.sin(t)];
const P0 = [0, PI / 2];

// scalar fields (chart representatives on the angle chart), and the fields X = ∂θ, Y = ∂φ
const FN = {
  f: (t, p) => (2 + Math.cos(p)) * Math.cos(t),
  X: (t, p) => -(2 + Math.cos(p)) * Math.sin(t),
  Y: (t, p) => -Math.sin(p) * Math.cos(t),
};
FN.S = (t, p) => FN.X(t, p) + FN.Y(t, p);

const sweep = (f, a, b, n) => Array.from({ length: n + 1 }, (_, i) => f(a + (b - a) * i / n));
const meridian = (t, p0 = -PI, p1 = PI) => sweep(p => [t, p], p0, p1, Math.max(6, Math.round(72 * (p1 - p0) / TAU)));
const parallel = (p, t0 = -PI, t1 = PI) => sweep(t => [t, p], t0, t1, Math.max(6, Math.round(96 * (t1 - t0) / TAU)));
const MER = [-3, -2, -1, 0, 1, 2, 3].map(k => k * PI / 4);
const PAR = [-5, -3, -1, 1, 3, 5].map(k => k * PI / 6);

// level segments of F on [-π,π]² (marching squares): [[t1,p1],[t2,p2]] per level
function contours(F, levels, n = 90) {
  const V = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => F(-PI + TAU * i / n, -PI + TAU * j / n)));
  const out = [];
  for (const L of levels) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], pts = [];
    for (let k = 0; k < 4; k++) {
      const [a, b] = [c[k], c[(k + 1) % 4]], va = V[a[0]][a[1]], vb = V[b[0]][b[1]];
      if ((va - L) * (vb - L) < 0) {
        const u = (L - va) / (vb - va);
        pts.push([-PI + TAU * (a[0] + (b[0] - a[0]) * u) / n, -PI + TAU * (a[1] + (b[1] - a[1]) * u) / n]);
      }
    }
    for (let k = 0; k + 1 < pts.length; k += 2) out.push({ L, a: pts[k], b: pts[k + 1] });
  }
  return out;
}

// ----------------------------------------------------------------- palette
const probe = document.createElement('canvas').getContext('2d');
const toRGB = c => {
  probe.fillStyle = '#000'; probe.fillStyle = c;
  const v = probe.fillStyle;
  return v[0] === '#' ? [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16)) : (v.match(/[\d.]+/g) ?? [0, 0, 0]).slice(0, 3).map(Number);
};
export function palette() {
  const cs = getComputedStyle(document.documentElement), g = n => toRGB(cs.getPropertyValue(n).trim() || '#888');
  const surface = g('--surface'), dark = surface[0] + surface[1] + surface[2] < 384;
  return { dark, surface, ink: g('--ink'), muted: g('--muted'), line: g('--line'), vec: g('--vec'), basis: g('--basis'),
    gold: g('--gold'), good: g('--good'), font: getComputedStyle(document.body).fontFamily,
    pink: dark ? [242, 122, 174] : [214, 66, 124], base: dark ? [120, 124, 142] : [226, 227, 232],
    mid: dark ? [46, 47, 56] : [248, 248, 248], pos: dark ? [106, 168, 255] : [31, 104, 178], neg: dark ? [255, 140, 100] : [196, 52, 40] };
}
export const css = (c, a = 1) => `rgba(${c.map(Math.round).join(',')},${a})`;
export const mixc = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const cmap = (P, t) => { t = Math.max(-1, Math.min(1, t)); return mixc(P.mid, t >= 0 ? P.pos : P.neg, Math.abs(t) ** 0.8); };

export function arrowHead(ctx, [x1, y1], [x2, y2], color, w, head = 8) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - 0.42), y2 - head * Math.sin(a - 0.42));
  ctx.lineTo(x2 - head * Math.cos(a + 0.42), y2 - head * Math.sin(a + 0.42)); ctx.closePath(); ctx.fill();
}
export function haloText(ctx, P, text, x, y, color, size = 15) {
  ctx.font = `italic 600 ${size}px ${P.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = css(P.surface, 0.9); ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}

// ------------------------------------------------------------ 3D mesh/camera
const NT = 96, NP = 40;
const QUADS = [];
for (let i = 0; i < NT; i++) for (let j = 0; j < NP; j++) {
  const t0 = -PI + TAU * i / NT, t1 = -PI + TAU * (i + 1) / NT, p0 = -PI + TAU * j / NP, p1 = -PI + TAU * (j + 1) / NP;
  const tc = (t0 + t1) / 2, pc = (p0 + p1) / 2;
  QUADS.push({ tc, pc, c: Phi(tc, pc), n: nrm(tc, pc), v: [Phi(t0, p0), Phi(t1, p0), Phi(t1, p1), Phi(t0, p1)] });
}

function camera(view, W, H, top) {
  const ca = Math.cos(view.az), sa = Math.sin(view.az), ce = Math.cos(view.el), se = Math.sin(view.el);
  const S = Math.min(W / 6.5, (H - top) / (2 * (2.9 * Math.abs(se) + 1.05 * Math.abs(ce)) + 0.5)), cx = W / 2, cy = top + (H - top) / 2;
  return {
    proj: ([x, y, z]) => { const x1 = x * ca - y * sa, y1 = x * sa + y * ca; return [cx + S * x1, cy - S * (y1 * se + z * ce), y1 * ce - z * se]; },
    facing: ([x, y, z]) => (x * sa + y * ca) * ce - z * se, // < 0: the normal points at the viewer
  };
}

// scene3d: { paint(t,p) -> rgb|null, flat, tint(t,p)->[rgb,a]|null, dec: [...], plane: {...}|null }
function render3d(ctx, W, H, top, view, sc, P) {
  const cam = camera(view, W, H, top), items = [];
  for (const q of QUADS) {
    const dn = cam.facing(q.n);
    if (dn > 0.02) continue;
    const base = sc.paint ? sc.paint(q.tc, q.pc) : P.base;
    const tint = sc.tint?.(q.tc, q.pc);
    let col = tint ? mixc(base, tint[0], tint[1]) : base;
    const k = sc.flat ? 0.68 + 0.32 * -dn : 0.38 + 0.62 * -dn;
    col = col.map(x => x * k);
    items.push({ d: cam.proj(q.c)[2], f: () => {
      ctx.beginPath();
      q.v.forEach((v, i) => { const [x, y] = cam.proj(v); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.closePath(); ctx.fillStyle = css(col); ctx.strokeStyle = css(col); ctx.lineWidth = 0.7; ctx.fill(); ctx.stroke();
    } });
  }
  const labels = [];
  const piece = (a, b, color, w, on = true) => {
    const mt = (a[0] + b[0]) / 2, mp = (a[1] + b[1]) / 2;
    if (!on || cam.facing(nrm(mt, mp)) > 0.04) return;
    const A = cam.proj(Phi(...a)), B = cam.proj(Phi(...b));
    items.push({ d: (A[2] + B[2]) / 2 - 0.3, f: () => {
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    } });
  };
  for (const d of sc.dec) {
    if (d.k === 'curve') for (let i = 0; i + 1 < d.pts.length; i++) piece(d.pts[i], d.pts[i + 1], d.color, d.w, !d.dash || Math.floor(i / d.dash) % 2 === 0);
    else if (d.k === 'segs') for (const s of d.list) piece(s.a, s.b, d.color(s), d.w);
    else if (d.k === 'arrow' || d.k === 'dot') {
      const [t, p] = d.at, w0 = Phi(t, p);
      if (cam.facing(nrm(t, p)) > 0.04) continue;
      const A = cam.proj(w0);
      if (d.k === 'dot') items.push({ d: A[2] - 0.6, f: () => { ctx.fillStyle = css(P.ink); ctx.beginPath(); ctx.arc(A[0], A[1], d.r ?? 5, 0, TAU); ctx.fill(); } });
      else {
        const u = d.dir === 't' ? unit(dPhi(t, p)[0]) : d.dir === 'p' ? unit(dPhi(t, p)[1]) : d.dir;
        const B = cam.proj(w0.map((x, i) => x + d.len * u[i]));
        items.push({ d: A[2] - 0.6, f: () => arrowHead(ctx, A, B, d.color, d.w ?? 2.5, d.head ?? 9) });
      }
    } else if (d.k === 'label') {
      if (cam.facing(nrm(...d.at)) > 0.04) continue;
      const A = cam.proj(Phi(...d.at));
      labels.push(() => haloText(ctx, P, d.text, A[0] + d.off[0], A[1] + d.off[1], d.color, d.size ?? 15));
    }
  }
  items.sort((a, b) => b.d - a.d);
  const drawPlane = () => {
    if (!sc.plane) return;
    const pl = sc.plane, o = Phi(...pl.at), [e1, e2] = [unit(dPhi(...pl.at)[0]), unit(dPhi(...pl.at)[1])];
    const w = (s, t) => o.map((x, i) => x + s * e1[i] + t * e2[i]);
    const poly = [[-pl.hs, -pl.ht], [pl.hs, -pl.ht], [pl.hs, pl.ht], [-pl.hs, pl.ht]].map(([s, t]) => cam.proj(w(s, t)));
    ctx.beginPath(); poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    ctx.fillStyle = css(P.muted, 0.28); ctx.fill(); ctx.strokeStyle = css(P.muted, 0.8); ctx.lineWidth = 1; ctx.stroke();
    for (const ln of pl.lines) {
      const [A, B] = ln.ends.map(([s, t]) => cam.proj(w(s, t)));
      ctx.strokeStyle = css(P.ink); ctx.lineWidth = ln.w; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
  };
  if (view.el < 0) drawPlane();
  for (const it of items) it.f();
  if (view.el >= 0) drawPlane();
  // arrows/dots of the base point sit on top of the plane
  for (const d of sc.dec) if ((d.k === 'arrow' || d.k === 'dot') && sc.plane && d.top) {
    const A = cam.proj(Phi(...d.at));
    if (d.k === 'dot') { ctx.fillStyle = css(P.ink); ctx.beginPath(); ctx.arc(A[0], A[1], d.r ?? 5, 0, TAU); ctx.fill(); }
    else {
      const u = d.dir === 't' ? unit(dPhi(...d.at)[0]) : d.dir === 'p' ? unit(dPhi(...d.at)[1]) : d.dir;
      arrowHead(ctx, A, cam.proj(Phi(...d.at).map((x, i) => x + d.len * u[i])), d.color, d.w ?? 2.5, d.head ?? 9);
    }
  }
  for (const l of labels) l();
}

// ----------------------------------------------------------------- 2D panels
export function panelGeometry(W, bar) {
  const l = 30, r = 8, t = bar ? 42 : 8, b = 22, side = W - l - r;
  return { l, r, t, b, side, H: t + side + b };
}

// a panel's coordinate frame: D.px(x, y) maps chart coordinates to canvas pixels
export function frame(ctx, g, dom) {
  const [x0, x1, y0, y1] = dom;
  const px = (x, y) => [g.l + (x - x0) / (x1 - x0) * g.side, g.t + (y1 - y) / (y1 - y0) * g.side];
  const D = {
    ctx, g, dom, px, k: g.side / (x1 - x0),
    clip(f) { ctx.save(); ctx.beginPath(); ctx.rect(g.l, g.t, g.side, g.side); ctx.clip(); f(); ctx.restore(); },
    path(pts, color, w = 1.5, dash = null) {
      ctx.beginPath(); pts.forEach(([x, y], i) => { const [X, Y] = px(x, y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash ?? []); ctx.lineCap = 'round'; ctx.stroke(); ctx.setLineDash([]);
    },
    fillPoly(pts, color) { ctx.beginPath(); pts.forEach(([x, y], i) => { const [X, Y] = px(x, y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); },
    dot(x, y, P, r = 4.5) { const [X, Y] = px(x, y); ctx.fillStyle = css(P.ink); ctx.beginPath(); ctx.arc(X, Y, r, 0, TAU); ctx.fill(); },
    arrow(x, y, dx, dy, len, color, w = 2.2, head = 8) {
      const L = Math.hypot(dx, dy) || 1, [X, Y] = px(x, y);
      arrowHead(ctx, [X, Y], [X + len * dx / L, Y - len * dy / L], color, w, head);
    },
    // an arrow centred on its base point, for fields on a lattice
    field(x, y, dx, dy, len, color) {
      const L = Math.hypot(dx, dy) || 1, [X, Y] = px(x, y), ux = dx / L, uy = -dy / L;
      arrowHead(ctx, [X - ux * len / 2, Y - uy * len / 2], [X + ux * len / 2, Y + uy * len / 2], color, 1.3, 5);
    },
    ring(r, color, w, dash) {
      const [cx, cy] = px(0, 0); ctx.beginPath(); ctx.arc(cx, cy, r * D.k, 0, TAU);
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash ?? []); ctx.stroke(); ctx.setLineDash([]);
    },
    annulus(color) {
      const [cx, cy] = px(0, 0); ctx.beginPath(); ctx.arc(cx, cy, 3 * D.k, 0, TAU); ctx.arc(cx, cy, D.k, 0, TAU, true);
      ctx.fillStyle = color; ctx.fill('evenodd');
    },
    // colour image of F(x, y) where mask(x, y)
    heat(F, range, mask, P) {
      const N = 150, off = document.createElement('canvas'); off.width = off.height = N;
      const oc = off.getContext('2d'), im = oc.createImageData(N, N), [a0, a1, b0, b1] = dom;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = a0 + (a1 - a0) * (i + 0.5) / N, y = b1 - (b1 - b0) * (j + 0.5) / N, o = 4 * (j * N + i);
        if (!mask(x, y)) continue;
        const c = cmap(P, F(x, y) / range); im.data.set([c[0], c[1], c[2], 255], o);
      }
      oc.putImageData(im, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, g.l, g.t, g.side, g.side);
    },
  };
  return D;
}

function drawAxes(D, P, ticks, bar) {
  const { ctx, g, dom } = D, [x0, x1, y0, y1] = dom;
  ctx.font = `11px ${P.font}`; ctx.fillStyle = css(P.muted); ctx.textBaseline = 'middle';
  for (const v of ticks) {
    const [X, Y] = D.px(v, v);
    ctx.strokeStyle = css(P.line, 0.9); ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
    if (v > x0 && v < x1) { ctx.beginPath(); ctx.moveTo(X, g.t); ctx.lineTo(X, g.t + g.side); ctx.stroke(); }
    if (v > y0 && v < y1) { ctx.beginPath(); ctx.moveTo(g.l, Y); ctx.lineTo(g.l + g.side, Y); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.textAlign = 'center'; ctx.fillText(String(v).replace('-', '−'), X, g.t + g.side + 12);
    ctx.textAlign = 'right'; ctx.fillText(String(v).replace('-', '−'), g.l - 5, Y);
  }
  ctx.strokeStyle = css(P.ink, 0.7); ctx.lineWidth = 1; ctx.strokeRect(g.l, g.t, g.side, g.side);
  if (bar) {
    const bw = g.side * 0.8, bx = g.l + (g.side - bw) / 2, by = 8, bh = 10;
    for (let i = 0; i < bw; i++) { ctx.fillStyle = css(cmap(P, -1 + 2 * i / bw)); ctx.fillRect(bx + i, by, 1.5, bh); }
    ctx.strokeStyle = css(P.ink, 0.5); ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = css(P.muted); ctx.textAlign = 'center';
    for (const v of bar.ticks) { const X = bx + bw * (v / bar.range + 1) / 2; ctx.fillText(String(v).replace('-', '−'), X, by + bh + 10); }
  }
}

const SQ = [-PI, PI, -PI, PI], ANN = [-3.25, 3.25, -3.25, 3.25];
const TICKS = [-3, -2, -1, 0, 1, 2, 3];
const inAnn = (x, y) => { const r = Math.hypot(x, y); return r > 1 && r < 3; };
const notCut = (x, y) => !(Math.abs(y) < 0.025 && x < 0);

// chart curves, in the angle chart and in the projection chart (V: 0 < φ < π)
const gridX = (D, P, only) => {
  for (const t of MER) D.path(meridian(t, only ? 0 : -PI, only ? PI : PI), css(P.vec, 0.85), 1.3);
  for (const p of PAR) if (!only || p > 0) D.path(parallel(p), css(P.gold, 0.95), 1.3);
};
const gridY = (D, P) => {
  for (const t of MER) D.path(meridian(t, 0, PI).map(([a, b]) => toY(a, b)), css(P.vec, 0.85), 1.3);
  for (const p of PAR) if (p > 0) D.path(parallel(p).map(([a, b]) => toY(a, b)), css(P.gold, 0.95), 1.3);
};
const cutSeg = (D, P) => D.path([[-3, 0], [-1, 0]], css(P.ink), 3);

// panel recipes: { dom, ticks, bar?, cap, draw(D, P) }
const panelY = (cap, draw, bar) => ({ dom: ANN, ticks: TICKS, cap, draw, bar });
const panelX = (cap, draw, bar) => ({ dom: SQ, ticks: TICKS, cap, draw, bar });
const CAP_Y = '$(\\mathcal{V},\\mathscr{Y})$: $\\mathscr{Y}^1 = a$ across, $\\mathscr{Y}^2 = b$ up';
const CAP_X = '$(\\mathcal{U},\\mathscr{X})$: $\\mathscr{X}^1 = \\theta$ across, $\\mathscr{X}^2 = \\varphi$ up';
const VCOL = P => css(P.vec), WCOL = P => css(P.basis);

// ------------------------------------------------------------------- views
const VIEWS = {
  // Figure 1: the chart domain U
  domain: P => ({
    top: 0, aspect: 0.62,
    sc: { dec: [
      ...MER.map(t => ({ k: 'curve', pts: meridian(t), color: css(P.vec, 0.9), w: 1.4 })),
      ...PAR.map(p => ({ k: 'curve', pts: parallel(p), color: css(P.gold, 0.95), w: 1.4 })),
      { k: 'curve', pts: meridian(PI), color: css(P.good), w: 3 },
      { k: 'curve', pts: parallel(PI), color: css(P.good), w: 3 },
      { k: 'dot', at: P0 }, { k: 'label', at: P0, text: 'p₀', off: [14, -16], color: css(P.ink), size: 17 },
    ] },
    legend: 'Blue: meridians $\\theta = \\text{const}$. Yellow: parallels $\\varphi = \\text{const}$. Green: the circle $\\theta = \\pi$ and the inner equator $\\varphi = \\pi$, the part of the torus that $\\mathcal{U}$ leaves out. Drag to rotate.',
    panels: [],
  }),
  // Figure 2: V and the transition-map picture
  transition: P => ({
    top: 0, aspect: 0.62,
    sc: {
      tint: (t, p) => (p > 0 && p < PI ? [P.pink, 0.55] : null),
      dec: [
        ...MER.map(t => ({ k: 'curve', pts: meridian(t, 0, PI), color: css(P.vec, 0.9), w: 1.4 })),
        ...PAR.filter(p => p > 0).map(p => ({ k: 'curve', pts: parallel(p), color: css(P.gold, 0.95), w: 1.4 })),
        { k: 'curve', pts: parallel(0), color: css(P.ink), w: 2.4, dash: 3 },
        { k: 'curve', pts: parallel(PI), color: css(P.ink), w: 2.4, dash: 3 },
        { k: 'dot', at: P0 }, { k: 'label', at: P0, text: 'p₀', off: [14, -16], color: css(P.ink), size: 17 },
      ],
    },
    legend: 'Shaded: $\\mathcal{V} = \\{c > 0\\}$, bounded by the outer and inner equators (dashed), with the part of the grid that lies in it. Below, the images of $\\mathcal{U}\\cap\\mathcal{V}$ (shaded) and of the grid under $\\mathscr{Y}$ (left) and under $\\mathscr{X}$ (right). The thick segment on the left is the image of the circle $\\theta = \\pi$, which is not in $\\mathcal{U}$.',
    panels: [
      panelY(CAP_Y, (D, P) => {
        D.clip(() => { D.annulus(css(P.pink, 0.2)); gridY(D, P); });
        D.ring(1, css(P.ink), 1.3, [4, 3]); D.ring(3, css(P.ink), 1.3, [4, 3]); cutSeg(D, P); D.dot(2, 0, P);
      }),
      panelX(CAP_X, (D, P) => {
        D.fillPoly([[-PI, 0], [PI, 0], [PI, PI], [-PI, PI]], css(P.pink, 0.2));
        D.clip(() => gridX(D, P, false));
        D.path([[-PI, 0], [PI, 0]], css(P.ink), 1.3, [4, 3]); D.dot(0, PI / 2, P);
      }),
    ],
  }),
  // Figure 3: the curves γ, δ and their velocities at p0
  curves: P => ({
    top: 0, aspect: 0.62,
    sc: { flat: true, dec: [
      { k: 'curve', pts: sweep(l => [l, PI / 2], -PI, PI, 120), color: VCOL(P), w: 3 },
      { k: 'curve', pts: sweep(l => [0, l], -PI, PI, 72), color: WCOL(P), w: 3 },
      { k: 'arrow', at: P0, dir: 't', len: 0.9, color: VCOL(P), w: 3.2, head: 11 },
      { k: 'arrow', at: P0, dir: 'p', len: 0.9, color: WCOL(P), w: 3.2, head: 11 },
      { k: 'dot', at: P0 }, { k: 'label', at: P0, text: 'p₀', off: [16, -18], color: css(P.ink), size: 17 },
      { k: 'label', at: [-2.2, PI / 2], text: 'γ', off: [0, -16], color: VCOL(P), size: 18 },
      { k: 'label', at: [0, -2.2], text: 'δ', off: [-18, 6], color: WCOL(P), size: 18 },
    ] },
    legend: '$\\gamma$ (blue) and $\\delta$ (purple) and their velocities at $p_0$ (arrows, lengths not to scale), on the torus and in the two charts. The chart $\\mathscr{Y}$ only sees the part of $\\delta$ that lies in $\\mathcal{V}$. Drag to rotate.',
    panels: [
      panelY(CAP_Y, (D, P) => {
        D.ring(1, css(P.ink), 1.2, [4, 3]); D.ring(3, css(P.ink), 1.2, [4, 3]); cutSeg(D, P);
        D.path(sweep(l => [2 * Math.cos(l), 2 * Math.sin(l)], -PI, PI, 120), VCOL(P), 2.2);
        D.path([[1, 0], [3, 0]], WCOL(P), 2.2);
        D.arrow(2, 0, 0, 1, 42, VCOL(P), 2.6, 10); D.arrow(2, 0, -1, 0, 42, WCOL(P), 2.6, 10); D.dot(2, 0, P);
      }),
      panelX(CAP_X, (D, P) => {
        D.path([[-PI, 0], [PI, 0]], css(P.ink), 1.2, [4, 3]);
        D.path([[-PI, PI / 2], [PI, PI / 2]], VCOL(P), 2.2); D.path([[0, -PI], [0, PI]], WCOL(P), 2.2);
        D.arrow(0, PI / 2, 1, 0, 42, VCOL(P), 2.6, 10); D.arrow(0, PI / 2, 0, 1, 42, WCOL(P), 2.6, 10); D.dot(0, PI / 2, P);
      }),
    ],
  }),
  // Figure 4: the scalar field f = a, tangent plane and (df)_{p0}
  scalar: P => {
    const fe = (t, p) => FN.f(t, p), e = 1e-5;
    const c = [(fe(P0[0] + e, P0[1]) - fe(P0[0] - e, P0[1])) / (2 * e), (fe(P0[0], P0[1] + e) - fe(P0[0], P0[1] - e)) / (2 * e)];
    const cn = Math.hypot(...c), d = [-c[1] / cn, c[0] / cn];                  // direction of the level lines (chart basis)
    const stack = (s0, s1) => [-2, -1, 0, 1, 2].map(n => {
      const v0 = [n * c[0] / cn ** 2, n * c[1] / cn ** 2];
      return { n, ends: [s0, s1].map(s => [v0[0] + s * d[0], v0[1] + s * d[1]]) };
    });
    const [Tt, Tp] = dPhi(...P0), levels = sweep(i => i, -2.5, 2.5, 10), segs = contours(FN.f, levels);
    const darker = L => css(mixc(cmap(P, L / 3), [0, 0, 0], 0.3));
    return {
      top: 40, aspect: 0.7, bar: { range: 3, ticks: [-2, -1, 0, 1, 2] },
      sc: {
        flat: true, paint: (t, p) => cmap(P, FN.f(t, p) / 3),
        plane: { at: P0, hs: 1.25, ht: 2.3, lines: stack(-0.5, 0.5).map(l => ({
          w: l.n === 0 ? 3.4 : 1.6,
          ends: l.ends.map(([v1, v2]) => [v1 * Math.hypot(...Tt), v2 * Math.hypot(...Tp)]) })) },
        dec: [
          { k: 'segs', list: segs, color: s => darker(s.L), w: 1.2 },
          { k: 'curve', pts: sweep(l => [l, PI / 2], -PI, PI, 120), color: VCOL(P), w: 3 },
          { k: 'curve', pts: sweep(l => [0, l], -PI, PI, 72), color: WCOL(P), w: 3 },
          { k: 'arrow', at: P0, dir: 't', len: 0.9, color: VCOL(P), w: 3.2, head: 11, top: true },
          { k: 'arrow', at: P0, dir: 'p', len: 0.9, color: WCOL(P), w: 3.2, head: 11, top: true },
          { k: 'dot', at: P0, top: true }, { k: 'label', at: P0, text: 'p₀', off: [16, -18], color: css(P.ink), size: 17 },
          { k: 'label', at: [-2.2, PI / 2], text: 'γ', off: [0, -16], color: VCOL(P), size: 18 },
          { k: 'label', at: [0, -2.2], text: 'δ', off: [-18, 6], color: WCOL(P), size: 18 },
        ],
      },
      legend: 'The scalar field $f = a$: colour and level sets on the torus (top) and in the chart $(\\mathcal{U},\\mathscr{X})$ (below), with the curves $\\gamma$ (blue) and $\\delta$ (purple) of the previous question. At $p_0$: the tangent plane $T_{p_0}\\mathcal{M}$ (grey), the velocities of $\\gamma$ and $\\delta$, and the covector $(\\mathrm{d}f)_{p_0}$ drawn as its stack of level lines (black). Drag to rotate.',
      panels: [panelX(CAP_X, (D, P) => {
        D.clip(() => {
          for (const s of segs) D.path([s.a, s.b], darker(s.L), 1.2);
          D.path([[-PI, 0], [PI, 0]], css(P.ink), 1.2, [4, 3]);
          D.path([[-PI, PI / 2], [PI, PI / 2]], VCOL(P), 2.2); D.path([[0, -PI], [0, PI]], WCOL(P), 2.2);
          for (const l of stack(-0.5, 0.5)) D.path(l.ends.map(([v1, v2]) => [P0[0] + v1, P0[1] + v2]), css(P.ink), l.n === 0 ? 3 : 1.5);
        });
        D.arrow(0, PI / 2, 1, 0, 42, VCOL(P), 2.6, 10); D.arrow(0, PI / 2, 0, 1, 42, WCOL(P), 2.6, 10); D.dot(0, PI / 2, P);
      }, { range: 3, ticks: [-2, -1, 0, 1, 2] })],
    };
  },
  // Figure 5: the vector fields X = ∂θ and Y = ∂φ
  fields: P => {
    const pts = [];
    for (let i = 0; i < 14; i++) for (let j = 0; j < 8; j++) pts.push([-PI + (i + 0.5) * TAU / 14, -PI + (j + 0.5) * TAU / 8]);
    return {
      top: 0, aspect: 0.62,
      sc: { flat: true, dec: [
        ...pts.map(at => ({ k: 'arrow', at, dir: 't', len: 0.55, color: VCOL(P), w: 1.8, head: 6 })),
        ...pts.map(at => ({ k: 'arrow', at, dir: 'p', len: 0.55, color: WCOL(P), w: 1.8, head: 6 })),
      ] },
      legend: 'The vector fields $\\mathcal{X}$ (blue) and $\\mathcal{Y}$ (purple) on the torus; $\\mathcal{X}$ in the chart $(\\mathcal{V},\\mathscr{Y})$ and both fields in the chart $(\\mathcal{U},\\mathscr{X})$. Arrows are normalized: only their directions are meaningful. Drag to rotate.',
      panels: [
        panelY(CAP_Y, (D, P) => {
          D.ring(1, css(P.ink), 1.2, [4, 3]); D.ring(3, css(P.ink), 1.2, [4, 3]); cutSeg(D, P);
          for (const [r, n] of [[1.3, 9], [1.8, 13], [2.3, 17], [2.8, 21]]) for (let k = 0; k < n; k++) {
            const t = -PI + (k + 0.5) * TAU / n;
            D.field(r * Math.cos(t), r * Math.sin(t), -Math.sin(t), Math.cos(t), 17, VCOL(P));
          }
          D.dot(2, 0, P);
        }),
        panelX(CAP_X, (D, P) => {
          D.path([[-PI, 0], [PI, 0]], css(P.ink), 1.2, [4, 3]);
          for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
            const x = -PI + (i + 0.5) * TAU / 12, y = -PI + (j + 0.5) * TAU / 12;
            D.field(x, y, 1, 0, 16, VCOL(P)); D.field(x, y, 0, 1, 16, WCOL(P));
          }
          D.dot(0, PI / 2, P);
        }),
      ],
    };
  },
  // Figure 6: X⌊f⌉, Y⌊f⌉ and (X ⊕ Y)⌊f⌉ as colour maps
  actions: P => {
    const bar3 = { range: 3, ticks: [-2, -1, 0, 1, 2] }, bar1 = { range: 1, ticks: [-0.5, 0, 0.5] };
    const arrowsX = (D, dir) => {
      for (let i = 0; i < 13; i++) for (let j = 0; j < 12; j++) D.field(-PI + (i + 0.5) * TAU / 13, -PI + (j + 0.5) * TAU / 12, dir[0], dir[1], 14, css(P.ink, 0.85));
    };
    const heatX = (D, F, range) => { D.heat(F, range, () => true, P); D.path([[-PI, 0], [PI, 0]], css(P.ink), 1.2, [4, 3]); D.dot(0, PI / 2, P); };
    return {
      top: 0, aspect: 0, panelsOnly: true,
      legend: 'Colour maps of the scalar fields obtained by letting vector fields act on $f$, with the corresponding field on top: $\\mathcal{X}\\lfloor f\\rceil$ in $(\\mathcal{U},\\mathscr{X})$ and in $(\\mathcal{V},\\mathscr{Y})$, $(\\mathcal{X}\\oplus_\\Gamma\\mathcal{Y})\\lfloor f\\rceil$ and $\\mathcal{Y}\\lfloor f\\rceil$ in $(\\mathcal{U},\\mathscr{X})$. Blue: positive, orange: negative.',
      panels: [
        panelX('$\\mathcal{X}\\lfloor f\\rceil$ in $(\\mathcal{U},\\mathscr{X})$', (D, P) => { heatX(D, (t, p) => FN.X(t, p), 3); arrowsX(D, [1, 0]); }, bar3),
        panelY('$\\mathcal{X}\\lfloor f\\rceil$ in $(\\mathcal{V},\\mathscr{Y})$', (D, P) => {
          D.heat((a, b) => -b, 3, (a, b) => inAnn(a, b) && notCut(a, b), P);
          D.ring(1, css(P.ink), 1.2, [4, 3]); D.ring(3, css(P.ink), 1.2, [4, 3]); cutSeg(D, P);
          for (const [r, n] of [[1.3, 9], [1.8, 13], [2.3, 17], [2.8, 21]]) for (let k = 0; k < n; k++) {
            const t = -PI + (k + 0.5) * TAU / n;
            D.field(r * Math.cos(t), r * Math.sin(t), -Math.sin(t), Math.cos(t), 14, css(P.ink, 0.85));
          }
          D.dot(2, 0, P);
        }, bar3),
        panelX('$(\\mathcal{X}\\oplus_\\Gamma\\mathcal{Y})\\lfloor f\\rceil$ in $(\\mathcal{U},\\mathscr{X})$', (D, P) => { heatX(D, (t, p) => FN.S(t, p), 3); arrowsX(D, [1, 1]); }, bar3),
        panelX('$\\mathcal{Y}\\lfloor f\\rceil$ in $(\\mathcal{U},\\mathscr{X})$', (D, P) => { heatX(D, (t, p) => FN.Y(t, p), 1); arrowsX(D, [0, 1]); }, bar1),
      ],
    };
  },
};

// ------------------------------------------------------------------ widget
const TAB = { domain: 'Chart domain', transition: 'Domain V and transition', curves: 'Curves', scalar: 'The field f',
  fields: 'Vector fields', actions: 'Fields acting on f' };

// config: view: 'domain' | ... | [several views, shown as tabs]; rotate: false; az, el: first camera angles
export function torusFigure(el, cfg) {
  const names = [].concat(cfg.view ?? 'domain').filter(v => VIEWS[v]);
  if (!names.length) names.push('domain');
  const view0 = { az: cfg.az ?? -0.35, el: cfg.el ?? 0.72 };
  let name = names[0], view = { ...view0 }, P = palette(), spec, cv3, caps;
  const stage = h('div');
  const tabs = names.length > 1 ? h('div', { class: 'wbtns tor-tabs' }, names.map(n => h('button', { class: 'btn ghost', type: 'button', 'data-view': n,
    onclick: () => { name = n; build(); } }, (cfg.labels ?? {})[n] ?? TAB[n]))) : '';
  el.append(...[tabs, stage].filter(Boolean));

  const set = v => { view = { ...view, ...v }; view.el = Math.max(-1.35, Math.min(1.5, view.el)); draw3(); };
  function build() {
    P = palette(); spec = VIEWS[name](P);
    cv3 = spec.panelsOnly ? null : h('canvas', { class: 'tor-3d', tabindex: 0, role: 'img',
      'aria-label': 'The torus, seen in 3D. Drag to rotate; arrow keys also rotate.' });
    const panels = h('div', { class: 'tor-panels' + (spec.panelsOnly ? ' four' : '') });
    caps = spec.panels.map(p => ({ box: h('figure', { class: 'tor-fig' }), cv: h('canvas', { role: 'img', 'aria-label': 'A chart of the torus' }), p }));
    caps.forEach(c => c.box.append(c.cv, h('figcaption', { html: mdInline(c.p.cap) })));
    panels.append(...caps.map(c => c.box));
    const btns = cv3 && cfg.rotate !== false ? h('div', { class: 'wbtns' },
      h('button', { class: 'btn ghost', type: 'button', onclick: () => set(view0) }, 'Reset view'),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => set({ el: 1.5 }) }, 'From above'),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => set({ el: 0.2 }) }, 'From the side')) : '';
    stage.replaceChildren(...[cv3, spec.legend && h('div', { class: 'tor-legend', html: mdInline(spec.legend) }), panels, btns].filter(Boolean));
    for (const b of el.querySelectorAll('.tor-tabs .btn')) b.classList.toggle('on', b.dataset.view === name);
    if (cv3 && cfg.rotate !== false) rotation(cv3);
    draw3(); drawPanels();
  }

  const size = (cv, W, H) => {
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = `${H}px`;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    return ctx;
  };
  function draw3() {
    if (!cv3) return;
    const W = cv3.getBoundingClientRect().width; if (W < 10) return;
    const H = Math.round(Math.min(W * spec.aspect, 540)), ctx = size(cv3, W, H);
    render3d(ctx, W, H, spec.top, view, spec.sc, P);
    if (spec.bar) drawBar(ctx, W, spec.bar);
  }
  function drawBar(ctx, W, bar) {
    const bw = Math.min(W * 0.6, 320), bx = (W - bw) / 2, by = 8, bh = 10;
    for (let i = 0; i < bw; i++) { ctx.fillStyle = css(cmap(P, -1 + 2 * i / bw)); ctx.fillRect(bx + i, by, 1.5, bh); }
    ctx.strokeStyle = css(P.ink, 0.5); ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
    ctx.font = `11px ${P.font}`; ctx.fillStyle = css(P.muted); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const v of bar.ticks) ctx.fillText(String(v).replace('-', '−'), bx + bw * (v / bar.range + 1) / 2, by + bh + 11);
    ctx.font = `italic 13px ${P.font}`; ctx.fillStyle = css(P.ink); ctx.fillText('f', bx + bw + 14, by + bh / 2);
  }
  function drawPanels() {
    for (const { cv, p } of caps) {
      const W = cv.parentElement.getBoundingClientRect().width; if (W < 10) continue;
      const g = panelGeometry(W, p.bar), ctx = size(cv, W, g.H), D = frame(ctx, g, p.dom);
      p.draw(D, P); drawAxes(D, P, p.ticks, p.bar);
    }
  }
  const redraw = () => { P = palette(); spec = VIEWS[name](P); draw3(); drawPanels(); };

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
