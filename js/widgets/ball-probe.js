// ball-probe
//
// Is a set U open? The reader drags a point p and sets a radius r with the
// slider; the ball B_r(p) is drawn, and the part of it outside U turns red.
// The readout says whether the ball fits and the largest radius that does.
// With an ambient set N (an interval, or the circle S¹ for an arc), the ball
// is cut down to N (the inherited topology): the part outside N is faded and
// does not count, and the readout judges U both in N and in ℝ or ℝ².
//
// config:
//   dim: 1 | 2
//   set:      dim 1: { a: 0, b: 1, closed: [false, false] }   (a, b: null = ±∞)
//             dim 2: { shape: disc, center: [0, 0], radius: 2, closed: false }
//                  | { shape: halfplane, closed: false }       (y > 0)
//                  | { shape: arc, from: 0, to: 180, closed: [false, false] }
//                    (an arc of the unit circle, in degrees; the ambient is S¹)
//   ambient:  dim 1 only, an interval N ⊇ U (omit: U sits in ℝ)
//   name, ambientName: TeX letters, default \mathcal{U}, \mathcal{N}
//   view:     dim 1: [x0, x1]; dim 2: { x, y, w, h } (model units)
//   p:        dim 1: a number; dim 2: [x, y], or the angle in degrees for an arc
//   r:        initial radius; rMax: slider maximum (default 1)
//   snap:     grid for p (dim 1 default 0.05, dim 2 0.1, arc 5 degrees)
//   presets:  [{label, set, ambient, p, r}]

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { P, fmt, label, line, placeHandle, planeSvg, s } from './plane.js';

export const EPS = 1e-9;
const intervalTex = ({ a, b, closed = [false, false] }) =>
  `${closed[0] && a != null ? '[' : '('}${a == null ? '-\\infty' : fmt(a)}, ${b == null ? '\\infty' : fmt(b)}${closed[1] && b != null ? ']' : ')'}`;
const inInterval = ({ a, b, closed = [false, false] }, x) =>
  (a == null || x > a + EPS || (closed[0] && Math.abs(x - a) < EPS)) &&
  (b == null || x < b - EPS || (closed[1] && Math.abs(x - b) < EPS));
// Endpoints of U that are a real edge inside the ambient N (an endpoint shared
// with N, with the same bracket, is the edge of the whole space, not of U).
function edges1(U, N) {
  const cu = U.closed ?? [false, false], cn = N?.closed ?? [false, false];
  const out = [];
  if (U.a != null && !(N && N.a != null && Math.abs(N.a - U.a) < EPS && cn[0] === cu[0])) out.push(U.a);
  if (U.b != null && !(N && N.b != null && Math.abs(N.b - U.b) < EPS && cn[1] === cu[1])) out.push(U.b);
  return out;
}
const deg = Math.PI / 180;

export function ballProbe(el, cfg) {
  const dim = cfg.dim ?? 1;
  const U0 = cfg.set ?? (dim === 1 ? { a: 0, b: 1 } : { shape: 'disc', center: [0, 0], radius: 2 });
  const pair = dim === 2 && !!cfg.pair;
  const init = () => ({ U: U0, N: cfg.ambient ?? null, p: cfg.p ?? (dim === 1 ? 0.5 : [0, 0]), q: cfg.q ?? [2, 1], r: cfg.r ?? 0.3 });
  let st = init();
  const uName = cfg.name ?? '\\mathcal{U}', nName = cfg.ambientName ?? '\\mathcal{N}';
  const rMax = cfg.rMax ?? 1;
  const isArc = () => dim === 2 && st.U.shape === 'arc';
  const snapOf = () => cfg.snap ?? (dim === 1 ? 0.05 : isArc() ? 5 : 0.1);

  // svg coordinates = S · model coordinates, so labels keep a readable size
  let view, S;
  if (dim === 1) {
    const [x0, x1] = cfg.view ?? [-0.5, 1.5];
    S = 8 / (x1 - x0);
    view = { x: S * x0, y: -1.1, w: 8, h: 2.3 };
  } else {
    const v = cfg.view ?? (isArc() ? { x: -1.7, y: -1.5, w: 3.4, h: 3.1 } : { x: -3.5, y: -3, w: 7, h: 6 });
    S = 7 / v.w;
    view = { x: S * v.x, y: S * v.y, w: 7, h: S * v.h };
  }
  const M = (x, y) => [S * x, S * y];
  const { svg, layers } = dim === 1
    ? { svg: s('svg', { class: 'w-line1d', viewBox: `${view.x} ${-(view.y + view.h)} ${view.w} ${view.h}`, role: 'img', 'aria-label': 'Drag the point p along the line' }),
        layers: null }
    : planeSvg(view, 'Drag the point p', ['region', 'ball', 'marks', 'labels', 'handles']);
  const L = layers ?? ['axis', 'region', 'ball', 'marks', 'labels', 'handles']
    .reduce((o, k) => { o[k] = s('g'); svg.append(o[k]); return o; }, {});

  const dragPoint = (handle, key) => handle.addEventListener('pointerdown', e => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    const move = ev => {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      const m = pt.matrixTransform(svg.getScreenCTM().inverse());
      const x = m.x / S, y = -m.y / S, sn = snapOf();
      if (dim === 1) {
        let v = Math.round(x / sn) * sn;
        const lo = (view.x + 0.2) / S, hi = (view.x + view.w - 0.2) / S;
        st[key] = Math.max(lo, Math.min(hi, v));
      } else if (isArc()) {
        let a = Math.atan2(y, x) / deg;
        if (a < 0) a += 360;
        st[key] = (Math.round(a / sn) * sn) % 360;
      } else {
        const cl = (t, lo, hi) => Math.max(lo + 0.1, Math.min(hi - 0.1, Math.round(t / sn) * sn));
        st[key] = [cl(x, view.x / S, (view.x + view.w) / S), cl(y, view.y / S, (view.y + view.h) / S)];
      }
      draw();
    };
    const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); handle.removeEventListener('pointercancel', up); };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  });
  const handle = s('circle', { r: 0.2, class: 'w-handle vec', tabindex: 0, 'aria-label': 'the point p' });
  L.handles.append(handle);
  dragPoint(handle, 'p');
  // pair mode: a second point q, to separate p and q by disjoint balls
  const qHandle = pair ? s('circle', { r: 0.2, class: 'w-handle vec', tabindex: 0, 'aria-label': 'the point q' }) : null;
  if (pair) { L.handles.append(qHandle); dragPoint(qHandle, 'q'); }

  const slider = h('input', { type: 'range', min: 0.01, max: rMax, step: rMax / 100, 'aria-label': 'radius r' });
  slider.addEventListener('input', () => { st.r = +slider.value; draw(); });
  const readout = h('div', { class: 'readout' });
  const btns = h('div', { class: 'wbtns' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(p => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      st = { U: p.set ?? st.U, N: p.ambient !== undefined ? p.ambient : st.N, p: p.p ?? st.p, q: p.q ?? st.q, r: p.r ?? st.r }; draw();
    } }, p.label)));
  el.append(svg, h('label', { class: 'wslider' }, h('span', { html: tex('r') }), slider), readout, btns);

  const seg = (a, b, cls) => line(M(a, 0), M(b, 0), cls);
  const dot = (x, y, closed, cls) => {
    const [cx, cy] = P(...M(x, y));
    return s('circle', { cx, cy, r: 0.11, class: `w-end ${cls} ${closed ? 'closed' : ''}` });
  };
  const arcPath = (t0, t1, R = 1) => {
    const [x0, y0] = P(...M(R * Math.cos(t0), R * Math.sin(t0))), [x1, y1] = P(...M(R * Math.cos(t1), R * Math.sin(t1)));
    const big = t1 - t0 > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${S * R} ${S * R} 0 ${big} 0 ${x1} ${y1}`;
  };
  // Cut [lo, hi] at the cut points and classify each piece by its midpoint.
  const pieces = (lo, hi, cuts, classify) => {
    const xs = [lo, ...cuts.filter(c => c > lo + EPS && c < hi - EPS).sort((u, v) => u - v), hi];
    return xs.slice(1).map((x, k) => [xs[k], x, classify((xs[k] + x) / 2)]);
  };

  function status(where, fits, maxR) {
    const best = maxR === Infinity ? 'every radius fits.'
      : maxR < 1e-6 ? 'no radius fits: every ball around $p$ pokes out.'
      : `the largest radius that fits is $${fmt(maxR)}$.`;
    const cap = t => (where ? where + t : t[0].toUpperCase() + t.slice(1));
    return [
      h('div', { class: `wide ${fits ? 'ok' : 'warn'}`, html: mdInline(cap(fits ? 'the ball fits.' : `the ball pokes out of $${uName}$.`)) }),
      h('div', { class: 'wide', html: mdInline(cap(best)) }),
    ];
  }

  function draw() {
    for (const k of ['region', 'ball', 'marks', 'labels']) L[k].replaceChildren();
    const { U, N, r } = st;
    slider.value = r;
    const rows = [];
    if (dim === 1) draw1(U, N, r, rows); else if (pair) drawPair(r, rows); else if (isArc()) drawArc(U, r, rows); else draw2(U, r, rows);
    readout.replaceChildren(...rows);
  }

  function draw1(U, N, r, rows) {
    const p = st.p;
    const lo = view.x / S, hi = (view.x + view.w) / S;
    if (!L.axis.childElementCount) {
      L.axis.append(seg(lo, hi, 'w-axis'));
      for (let k = Math.ceil(lo); k <= hi; k++) {
        L.axis.append(line([S * k, -0.12], [S * k, 0.12], 'w-axis'));
        L.axis.append(label([S * k, -0.55], String(k), 'tick'));
      }
    }
    const clip = (a, d) => (a == null ? d : a);
    if (N) {
      L.region.append(seg(clip(N.a, lo), clip(N.b, hi), 'w-amb'));
      for (const [x, c] of [[N.a, N.closed?.[0]], [N.b, N.closed?.[1]]]) if (x != null) L.marks.append(dot(x, 0, c, 'amb'));
    }
    L.region.append(seg(clip(U.a, lo), clip(U.b, hi), 'w-region-line'));
    for (const [x, c] of [[U.a, U.closed?.[0]], [U.b, U.closed?.[1]]]) if (x != null) L.marks.append(dot(x, 0, c, 'reg'));

    const inN = x => !N || inInterval(N, x);
    // the ball, raised above the line
    const y = 0.5 / S;
    for (const [a, b, cls] of pieces(p - r, p + r, [U.a, U.b, N?.a, N?.b].filter(c => c != null),
      m => (!inN(m) ? 'ghost' : inInterval(U, m) ? '' : 'out'))) {
      L.ball.append(line(M(a, y), M(b, y), `w-ball-line ${cls}`));
    }
    L.marks.append(dot(p - r, y, false, 'ball'), dot(p + r, y, false, 'ball'));
    L.ball.append(line(M(p, 0), M(p, y), 'w-tick'));
    L.labels.append(label([S * p, 0.85], 'p', 'vec'));
    placeHandle(handle, M(p, 0));

    rows.push(h('div', { html: tex(`p = ${fmt(p)}`) }), h('div', { html: tex(`r = ${fmt(r)}`) }));
    rows.push(h('div', { class: 'wide', html: mdInline(`$${uName} = ${intervalTex(U)}$${N ? ` inside $${nName} = ${intervalTex(N)}$` : ''}`) }));
    if (N && !inInterval(N, p)) { rows.push(h('div', { class: 'wide' }, 'p is outside the space N: drag it back.')); return; }
    if (!inInterval(U, p)) { rows.push(h('div', { class: 'wide', html: mdInline(`$p \\notin ${uName}$: openness only asks about points of $${uName}$.`) })); return; }
    const maxIn = es => Math.min(Infinity, ...es.map(e => Math.abs(p - e)));
    if (N) {
      const mN = maxIn(edges1(U, N)), mR = maxIn(edges1(U, null));
      rows.push(...status(`In $${nName}$: `, r <= mN + EPS, mN), ...status('In $\\mathbb{R}$: ', r <= mR + EPS, mR));
    } else {
      const m = maxIn(edges1(U, null));
      rows.push(...status('', r <= m + EPS, m));
    }
  }

  function draw2(U, r, rows) {
    const p = st.p;
    let inU, maxR;
    if (U.shape === 'halfplane') {
      const top = (view.y + view.h) / S, l = view.x / S, w = view.w / S;
      const [x, yy] = P(...M(l, top));
      L.region.append(s('rect', { x, y: yy, width: S * w, height: S * top, class: 'w-region' }));
      L.region.append(line(M(l, 0), M(l + w, 0), `w-edge ${U.closed ? 'closed' : ''}`));
      inU = p[1] > EPS || (U.closed && Math.abs(p[1]) < EPS);
      maxR = p[1];
    } else {
      const c = U.center ?? [0, 0], R = U.radius ?? 2;
      const [cx, cy] = P(...M(...c));
      L.region.append(s('circle', { cx, cy, r: S * R, class: 'w-region' }));
      L.region.append(s('circle', { cx, cy, r: S * R, class: `w-edge ${U.closed ? 'closed' : ''}` }));
      const d = Math.hypot(p[0] - c[0], p[1] - c[1]);
      inU = d < R - EPS || (U.closed && Math.abs(d - R) < EPS);
      maxR = R - d;
    }
    const fits = inU && r <= maxR + EPS;
    const [bx, by] = P(...M(...p));
    L.ball.append(s('circle', { cx: bx, cy: by, r: S * r, class: `w-ball ${inU && !fits ? 'out' : ''}` }));
    L.labels.append(label([bx + 0.3, -by + 0.3], 'p', 'vec'));
    placeHandle(handle, M(...p));
    rows.push(h('div', { html: tex(`p = (${fmt(p[0])},\\ ${fmt(p[1])})`) }), h('div', { html: tex(`r = ${fmt(r)}`) }));
    if (!inU) { rows.push(h('div', { class: 'wide', html: mdInline(`$p \\notin ${uName}$: openness only asks about points of $${uName}$.`) })); return; }
    rows.push(...status('', fits, Math.max(0, maxR)));
  }

  // Hausdorff: two points, one radius; the balls turn red while they overlap.
  function drawPair(r, rows) {
    const { p, q } = st;
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    const apart = d > EPS && 2 * r <= d + EPS;
    for (const [c, name] of [[p, 'p'], [q, 'q']]) {
      const [bx, by] = P(...M(...c));
      L.ball.append(s('circle', { cx: bx, cy: by, r: S * r, class: `w-ball ${apart ? '' : 'out'}` }));
      L.labels.append(label([bx + 0.3, -by + 0.3], name, 'vec'));
    }
    placeHandle(handle, M(...p));
    placeHandle(qHandle, M(...q));
    rows.push(h('div', { html: tex(`\\lVert p - q\\rVert = ${fmt(d)}`) }), h('div', { html: tex(`r = ${fmt(r)}`) }));
    if (d < EPS) { rows.push(h('div', { class: 'wide', html: mdInline('$p = q$: there is nothing to separate. Drag $q$ away.') })); return; }
    rows.push(h('div', { class: `wide ${apart ? 'ok' : 'warn'}`, html: mdInline(apart
      ? '$B_r(p)\\cap B_r(q) = \\emptyset$: the balls separate $p$ and $q$.'
      : 'The balls overlap: they do not separate $p$ and $q$.') }),
    h('div', { class: 'wide', html: mdInline(`Disjoint exactly when $r\\le ${fmt(d / 2)}$, half the distance.`) }));
  }

  function drawArc(U, r, rows) {
    const t = st.p * deg, t0 = U.from * deg, t1 = U.to * deg, cl = U.closed ?? [false, false];
    const p = [Math.cos(t), Math.sin(t)];
    const [ox, oy] = P(0, 0);
    L.region.append(s('circle', { cx: ox, cy: oy, r: S, class: 'w-amb-ring' }));
    L.region.append(s('path', { d: arcPath(t0, t1), class: 'w-region-arc' }));
    L.marks.append(dot(Math.cos(t0), Math.sin(t0), cl[0], 'reg'), dot(Math.cos(t1), Math.sin(t1), cl[1], 'reg'));
    const a = ((st.p % 360) + 360) % 360;
    const inU = (a > U.from + EPS && a < U.to - EPS) || (cl[0] && Math.abs(a - U.from) < EPS) || (cl[1] && Math.abs(a - U.to) < EPS);
    // the ball in the plane (faded: only its trace on S¹ counts in S¹)
    const [bx, by] = P(...M(...p));
    L.ball.append(s('circle', { cx: bx, cy: by, r: S * r, class: 'w-ball ghost' }));
    // its trace on S¹: the points at chord distance < r, i.e. angle < α
    const al = r >= 2 ? Math.PI : 2 * Math.asin(r / 2);
    for (const [u, v, cls] of pieces(t - al, t + al, [t0, t1, t0 - 2 * Math.PI, t1 - 2 * Math.PI, t0 + 2 * Math.PI, t1 + 2 * Math.PI],
      m => { const mm = ((m / deg) % 360 + 360) % 360; return mm > U.from && mm < U.to ? '' : 'out'; })) {
      L.ball.append(s('path', { d: arcPath(u, v), class: `w-ball-arc ${cls}` }));
    }
    L.labels.append(label([bx * 1.28, -by * 1.28], 'p', 'vec'));
    placeHandle(handle, M(...p));
    rows.push(h('div', { html: tex(`p\\ \\text{at}\\ ${fmt(a)}^\\circ`) }), h('div', { html: tex(`r = ${fmt(r)}`) }));
    if (!inU) { rows.push(h('div', { class: 'wide', html: mdInline(`$p \\notin ${uName}$: openness only asks about points of $${uName}$.`) })); return; }
    const d = Math.min(a - U.from, U.to - a);
    const mS = 2 * Math.sin(Math.max(0, d) * deg / 2);
    rows.push(...status('In $S^1$: ', r <= mS + EPS, mS),
      h('div', { class: 'wide warn', html: mdInline('In $\\mathbb{R}^2$: every disc around $p$ contains points off the circle, so no radius fits.') }));
  }
  draw();
}
