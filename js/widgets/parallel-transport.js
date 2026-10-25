// parallel-transport
//
// The plane with a curve γ (preset), a slider for λ (and Play), and a vector
// 𝒵 parallelly transported along γ from its start γ(λ₀) under a chosen
// connection: ∇ᴱ keeps the cartesian components constant, ∇ᴾ the polar ones
// (only on the polar chart's domain 𝒱 = plane minus the half-line b = 0,
// a ≤ 0, θ ∈ (−π, π): the transport stops where γ leaves 𝒱). Drawn: the curve,
// the start vector (faded, its tip draggable), a faded trail, the current 𝒵
// (blue), the velocity v_γ and the acceleration a_γ = ∇_{v_γ} v_γ (ink, a
// dashed), optionally the polar basis ∂y₁, ∂y₂ (purple). Readout: components
// of 𝒵, v_γ, a_γ in 𝒳 (cartesian) and 𝒴 (polar); the transport equation
// ż^k + Γ^k_{ji} z^j γ̇^i = 0 in numbers in the chart where Γ ≠ 0; a badge
// "autoparallel?" checked along the whole curve.
// Also ∇ᵂ (frame e₁ = radial, e₂ = angular unit vectors declared parallel, on the
// plane minus the origin: 𝒵 keeps its e₁/e₂ components, i.e. rotates with the
// polar angle of γ) and ∇^κ ((Γ^κ_𝒳)¹₂₂ = κa, all others 0: ż¹ = −κ a z² ḃ,
// ż² = 0, integrated along γ). Curve 'rectangle' is a closed counterclockwise
// loop; for it the readout gives Δz after the loop next to the prediction
// −Riem¹₂₁₂ z² × area. `compareE` draws the ∇ᴱ copy of 𝒵 (dashed) and the angle
// between them; `torsion` shows 𝚃¹₁₂, 𝚃²₁₂ at γ(λ).
//
// config:
//   curve:       'circle' | 'vertical' | 'radial' | 'radial-squared', or
//                { type: 'circle', r0: 2 } | { type: 'vertical', x0: 1, range: [-2.5, 2.5] }
//                | { type: 'radial', theta0: 0.785 }   (range: [λ₀, λ_end] for any type)
//                | { type: 'rectangle', x0: 1, x1: 2, b0: 0, b1: 1 }   (λ ∈ [0, 4], one side per unit)
//   connection:  'E' | 'P' | 'W' | 'kappa'
//   connections: ['E', 'P']     buttons offered (one entry: no buttons)
//   kappa: 1, compareE: false, torsion: false, holonomy: true (closed curves)
//   z0:          [1, 0]         start vector, cartesian components
//   lambda:      λ₀             initial slider value
//   showVelocity: true, showAcceleration: true, showBasis: false, trail: true,
//   residual: true, badge: true, dragZ: true, snap: 0.25, view: { x, y, w, h }
//   presets:     [{ label, curve, connection, z0, lambda }]
// Curves may carry exact derivatives d (velocity) and dd (second derivative).

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { P, arrow, combo, fmt, label, line, placeHandle, planeSvg, s } from './plane.js';
import { TWO_PI, labelPlacer, mulv, tipCands } from './chart-basis.js';

const PT_CURVES = {
  circle: o => { const r0 = o.r0 ?? 2, R = fmt(r0); return { range: [0, TWO_PI], f: l => [r0 * Math.cos(l), r0 * Math.sin(l)],
    md: `$\\delta_{r_0}(\\lambda) = (r_0\\cos\\lambda,\\ r_0\\sin\\lambda)$ with $r_0 = ${R}$` }; },
  vertical: o => { const x0 = o.x0 ?? 1, X = fmt(x0); return { range: [-2.5, 2.5], f: l => [x0, l],
    md: `$\\gamma_{x_0}(\\lambda) = (x_0, \\lambda)$ with $x_0 = ${X}$` }; },
  radial: o => { const t = o.theta0 ?? Math.PI / 4, c = Math.cos(t), sn = Math.sin(t);
    return { range: [0.5, 3], f: l => [l * c, l * sn], md: `$\\gamma(\\lambda) = \\lambda\\,(${fmt(c)}, ${fmt(sn)})$` }; },
  'radial-squared': o => { const t = o.theta0 ?? Math.PI / 4, c = Math.cos(t), sn = Math.sin(t);
    return { range: [0.7, 1.75], f: l => [l * l * c, l * l * sn], md: `$\\gamma(\\lambda) = \\lambda^2\\,(${fmt(c)}, ${fmt(sn)})$` }; },
  // counterclockwise from (x0, b0): bottom, right (up), top, left (down); side k for λ ∈ [k, k+1]
  rectangle: o => { const x0 = o.x0 ?? 1, x1 = o.x1 ?? 2, b0 = o.b0 ?? 0, b1 = o.b1 ?? 1;
    const C = [[x0, b0], [x1, b0], [x1, b1], [x0, b1], [x0, b0]];
    const side = l => Math.max(0, Math.min(3, Math.floor(l)));
    return { range: [0, 4], closed: true, area: (x1 - x0) * (b1 - b0),
      f: l => { const k = side(l), u = l - k; return [0, 1].map(i => C[k][i] + u * (C[k + 1][i] - C[k][i])); },
      d: l => { const k = side(l); return [0, 1].map(i => C[k + 1][i] - C[k][i]); },
      dd: () => [0, 0],
      md: `$\\gamma$: the rectangle $[${fmt(x0)}, ${fmt(x1)}] \\times [${fmt(b0)}, ${fmt(b1)}]$, counterclockwise from $(${fmt(x0)}, ${fmt(b0)})$, one side per unit of $\\lambda$` }; },
};
// polar chart 𝒴 = (r, atan2(b, a)) on 𝒱 (θ ∈ (−π, π)); its Jacobian D𝒴 and inverse (columns ∂y₁, ∂y₂)
const ptJ = ([a, b]) => { const r2 = a * a + b * b, r = Math.sqrt(r2); return [[a / r, b / r], [-b / r2, a / r2]]; };
const ptJi = ([a, b]) => { const r = Math.hypot(a, b); return [[a / r, -b], [b / r, a]]; };
const ptInV = ([a, b]) => Math.hypot(a, b) > 1e-9 && !(Math.abs(b) < 1e-9 && a <= 0);
const ptPol = ([a, b]) => [Math.hypot(a, b), Math.atan2(b, a)];
const ptD1 = (F, l, e = 1e-4) => { const A = F(l + e), B = F(l - e); return [0, 1].map(k => (A[k] - B[k]) / (2 * e)); };
const ptD2 = (F, l, e = 1e-3) => { const A = F(l + e), M = F(l), B = F(l - e); return [0, 1].map(k => (A[k] - 2 * M[k] + B[k]) / (e * e)); };
// polar representative near λ = l, with θ unwrapped around its value at l (for finite differences)
const ptPolNear = (f, l) => { const t0 = ptPol(f(l))[1];
  return x => { const [r, t] = ptPol(f(x)); return [r, t + TWO_PI * Math.round((t0 - t) / TWO_PI)]; }; };
const ptRot = (t, [x, y]) => [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)];
// Γ^k_{ji} z^j w^i in the cartesian chart 𝒳 (w = direction), for ∇ᵂ and ∇^κ (Γᴱ_𝒳 = 0)
const ptGx = (conn, [a, b], z, w, kap) => {
  if (conn === 'kappa') return [kap * a * z[1] * w[1], 0];
  if (conn === 'W') { const r2 = a * a + b * b, s2 = (b * w[0] - a * w[1]) / r2; return [-z[1] * s2, z[0] * s2]; }
  return [0, 0];
};

export function parallelTransport(el, cfg) {
  const sn = cfg.snap ?? 0.25;
  const conns = cfg.connections ?? ['E', 'P'];
  const NAB = { E: '\\nabla^{\\mathrm{E}}', P: '\\nabla^{\\mathrm{P}}', W: '\\nabla^{\\mathrm{W}}', kappa: '\\nabla^{\\kappa}' };
  const CONN_WORD = { E: 'cartesian', P: 'polar', W: 'frame', kappa: 'curved' };
  const kap = cfg.kappa ?? 1;
  const vel = (cv, l) => (cv.d ? cv.d(l) : ptD1(cv.f, l));
  const acc2 = (cv, l) => (cv.dd ? cv.dd(l) : ptD2(cv.f, l));
  const mkCurve = spec => {
    const o = typeof spec === 'string' ? { type: spec } : (spec ?? {});
    const c = (PT_CURVES[o.type] ?? PT_CURVES.circle)(o);
    if (o.range) c.range = [...o.range];
    return c;
  };
  const init = () => ({ cv: mkCurve(cfg.curve ?? 'circle'), conn: cfg.connection ?? conns[0], z0: [...(cfg.z0 ?? [1, 0])], l: null });
  let st = init();
  st.l = cfg.lambda ?? st.cv.range[0];

  // default view: the curve (and the origin) with a margin, square
  const fitView = cv => {
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    for (let i = 0; i <= 100; i++) { const l = cv.range[0] + (cv.range[1] - cv.range[0]) * i / 100, q = cv.f(l), v = vel(cv, l);
      for (const w of [q, [q[0] + v[0], q[1] + v[1]]]) {
        x0 = Math.min(x0, w[0]); x1 = Math.max(x1, w[0]); y0 = Math.min(y0, w[1]); y1 = Math.max(y1, w[1]); } }
    const w = Math.max(x1 - x0, y1 - y0) + 2.4, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return { x: cx - w / 2, y: cy - w / 2, w, h: w };
  };
  const view = cfg.view ?? fitView(st.cv);
  const { svg, layers: L } = planeSvg(view, 'A curve in the plane and a vector parallelly transported along it',
    ['curve', 'arrows', 'marks', 'labels', 'handles']);
  const placeLabels = labelPlacer(view, L.labels);
  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', 'aria-label': 'curve parameter lambda' });
  slider.addEventListener('input', () => { stop(); st.l = +slider.value; draw(); });
  const lamOut = h('span', { class: 'pt-lam' });
  let anim = null;
  const playBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => play() }, 'Play');
  const connBtns = conns.length > 1 ? conns.map(k => h('button', { class: 'btn ghost', type: 'button', 'data-conn': k,
    html: mdInline(`$${NAB[k]}$ ${CONN_WORD[k]}`), onclick: () => { st.conn = k; draw(); } })) : [];
  const btns = h('div', { class: 'wbtns' },
    playBtn,
    connBtns,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); st = init(); st.l = cfg.lambda ?? st.cv.range[0]; draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      stop();
      const cv = pr.curve ? mkCurve(pr.curve) : st.cv;
      st = { cv, conn: pr.connection ?? st.conn, z0: pr.z0 ? [...pr.z0] : st.z0, l: pr.lambda ?? cv.range[0] };
      draw();
    } }, pr.label)));
  el.append(h('div', { class: 'cc-panels single' }, svg), h('label', { class: 'wslider' }, lamOut, slider), readout, btns);

  function stop() { if (anim) cancelAnimationFrame(anim); anim = null; playBtn.textContent = 'Play'; }
  function play() {
    if (anim) return stop();
    const [a, b] = st.cv.range;
    if (st.l >= b - 1e-9) st.l = a;
    const l0 = st.l, dur = 5000 * (b - l0) / (b - a);
    let t0 = null;
    const step = t => {
      if (!el.isConnected) return stop();
      if (t0 === null) t0 = t;
      const u = Math.min(1, (t - t0) / dur);
      st.l = l0 + (b - l0) * u; draw();
      if (u < 1) anim = requestAnimationFrame(step); else stop();
    };
    playBtn.textContent = 'Pause';
    anim = requestAnimationFrame(step);
  }

  // drag the tip of the start vector
  const zh = cfg.dragZ === false ? null : s('circle', { r: 0.17, class: 'w-handle vec', tabindex: 0, 'aria-label': 'start vector' });
  if (zh) {
    L.handles.append(zh);
    zh.addEventListener('pointerdown', e => {
      e.preventDefault(); stop();
      zh.setPointerCapture(e.pointerId);
      const move = ev => {
        const q = svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
        const m = q.matrixTransform(svg.getScreenCTM().inverse());
        const g0 = st.cv.f(st.cv.range[0]);
        const x = Math.max(view.x + 0.2, Math.min(view.x + view.w - 0.2, m.x)), y = Math.max(view.y + 0.2, Math.min(view.y + view.h - 0.2, -m.y));
        const z = [x - g0[0], y - g0[1]].map(t => (sn ? Math.round(t / sn) * sn : t));
        if (Math.hypot(...z) >= 0.2) { st.z0 = z; draw(); }
      };
      const up = () => { zh.removeEventListener('pointermove', move); zh.removeEventListener('pointerup', up); zh.removeEventListener('pointercancel', up); };
      zh.addEventListener('pointermove', move); zh.addEventListener('pointerup', up); zh.addEventListener('pointercancel', up);
    });
  }

  // first λ in [λ₀, λ_end] where γ leaves 𝒱 (cut crossed, origin hit), or null
  // (cut = false: only the origin counts, for ∇ᵂ)
  function leaveAt(cv, cut = true) {
    const [a, b] = cv.range, f = cv.f, ok = q => (cut ? ptInV(q) : Math.hypot(...q) > 1e-9);
    if (!ok(f(a))) return a;
    const bad = (x, y) => {
      const q1 = f(x), q2 = f(y);
      if (!ok(q2)) return true;
      if (cut && Math.abs(ptPol(q2)[1] - ptPol(q1)[1]) > Math.PI) return true;
      const d = [q2[0] - q1[0], q2[1] - q1[1]], dd = d[0] ** 2 + d[1] ** 2;
      const t = dd ? Math.max(0, Math.min(1, -(q1[0] * d[0] + q1[1] * d[1]) / dd)) : 0;
      return Math.hypot(q1[0] + t * d[0], q1[1] + t * d[1]) < 1e-9;
    };
    let prev = a;
    for (let i = 1; i <= 400; i++) {
      const l = a + (b - a) * i / 400;
      if (bad(prev, l)) {
        let lo = prev, hi = l;
        for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (bad(lo, m)) hi = m; else lo = m; }
        return hi;
      }
      prev = l;
    }
    return null;
  }
  // acceleration a_γ = ∇_{v_γ} v_γ (cartesian components): Γᴱ_𝒳 = 0, Γᴾ_𝒴 = 0
  // (∇ᵂ, ∇^κ: γ̈^k + Γ^k_{ji} γ̇^j γ̇^i in 𝒳)
  const accel = (cv, conn, l) => {
    if (conn === 'P') return mulv(ptJi(cv.f(l)), ptD2(ptPolNear(cv.f, l), l));
    const A = acc2(cv, l);
    if (conn === 'E' || (conn === 'W' && Math.hypot(...cv.f(l)) < 1e-9)) return A;
    const v = vel(cv, l), G = ptGx(conn, cv.f(l), v, v, kap);
    return [A[0] + G[0], A[1] + G[1]];
  };
  // ∇^κ: I(λ) = ∫ a ḃ dλ from λ₀ (table, midpoint rule on 2400 steps), so z¹ = z¹₀ − κ z²₀ I, z² = z²₀
  let itab = null;
  function kapI(cv, x) {
    const [a, b] = cv.range, N = 2400;
    if (!itab || itab.cv !== cv) {
      const I = [0];
      for (let i = 0; i < N; i++) { const l1 = a + (b - a) * i / N, l2 = a + (b - a) * (i + 1) / N;
        I.push(I[i] + cv.f((l1 + l2) / 2)[0] * (cv.f(l2)[1] - cv.f(l1)[1])); }
      itab = { cv, I };
    }
    const u = Math.max(0, Math.min(N, (x - a) / (b - a) * N)), i = Math.min(N - 1, Math.floor(u));
    return itab.I[i] + (u - i) * (itab.I[i + 1] - itab.I[i]);
  }
  // autoparallel check along the whole curve (part inside 𝒱 for ∇ᴾ)
  let cache = {};
  function badgeInfo(cv, conn, stopL) {
    const key = `${conn}|${cv.md}|${cv.range}`;
    if (cache[key]) return cache[key];
    const [a] = cv.range, b = stopL !== null ? stopL - 1e-2 : cv.range[1];
    let zero = true, par = true, bad = null;
    for (let i = 0; i <= 80 && b > a; i++) {
      const l = a + (b - a) * i / 80, v = vel(cv, l), A = accel(cv, conn, l), vv = Math.hypot(...v);
      const tol = 1e-4 * (1 + vv * vv);
      if (Math.hypot(...A) > tol) zero = false;
      if (Math.abs(A[0] * v[1] - A[1] * v[0]) / vv > tol) { par = false; if (bad === null) bad = l; }
    }
    return (cache[key] = { zero, par, bad });
  }

  const vec = a => `(${a.map(fmt).join(', ')})`;
  function draw() {
    for (const k of ['curve', 'arrows', 'marks', 'labels']) L[k].replaceChildren();
    const { cv, conn } = st, f = cv.f, [a, b] = cv.range;
    slider.min = a; slider.max = b; slider.step = (b - a) / 240; slider.value = st.l;
    const l = st.l, q = f(l), l0 = a, g0 = f(l0);
    lamOut.innerHTML = tex(`\\lambda = ${fmt(l)}`);
    for (const bt of connBtns) bt.className = `btn ${bt.dataset.conn === conn ? 'primary' : 'ghost'}`;

    // curve, cut, origin
    const pts = [];
    for (let i = 0; i <= 300; i++) pts.push(P(...f(a + (b - a) * i / 300)).join(','));
    L.curve.append(s('polyline', { points: pts.join(' '), class: 'cv-curve' }));
    L.curve.append(line([0, 0], [-30, 0], 'cb-cut'));
    L.marks.append(s('circle', { cx: 0, cy: 0, r: 0.07, class: 'cv-dot' }));

    // transport: ∇ᴱ keeps cartesian components, ∇ᴾ polar components (inside 𝒱 only),
    // ∇ᵂ the e₁/e₂ components (no origin), ∇^κ: z¹ = z¹₀ − κ z²₀ ∫ a ḃ dλ, z² = z²₀
    const stopL = conn === 'P' ? leaveAt(cv) : conn === 'W' ? leaveAt(cv, false) : null;
    const zP = conn === 'P' && ptInV(g0) ? mulv(ptJ(g0), st.z0) : null;
    const startOk = conn === 'P' ? !!zP : conn === 'W' ? Math.hypot(...g0) > 1e-9 : true;
    const t0 = ptPol(g0)[1];
    const Zc = x => (conn === 'E' ? st.z0 : conn === 'P' ? mulv(ptJi(f(x)), zP)
      : conn === 'W' ? ptRot(ptPol(f(x))[1] - t0, st.z0)
        : [st.z0[0] - kap * st.z0[1] * kapI(cv, x), st.z0[1]]);
    const reach = stopL === null ? b : stopL;
    const alive = startOk && (stopL === null || l < stopL - 1e-9);
    const segs = [], items = [];
    const arr = (p, w, cls) => { const tip = [p[0] + w[0], p[1] + w[1]]; L.arrows.append(arrow(p, tip, cls)); segs.push([p, tip]); return tip; };
    if (cfg.trail !== false && startOk) {
      const end = Math.min(l, reach - 1e-6);
      for (let i = 1; i < 8 && end > l0; i++) { const x = l0 + (end - l0) * i / 8; if (Math.abs(x - l) > 1e-6) arr(f(x), Zc(x), 'w-uvec pt-ghost'); }
    }
    const zt = arr(g0, st.z0, 'w-uvec pt-start');
    if (zh) placeHandle(zh, zt);
    if (Math.abs(l - l0) > 1e-6) items.push({ text: 'start', cls: 'vec small', cands: tipCands(g0, st.z0, -1) });
    const v = vel(cv, l), A = accel(cv, conn, l);
    const inV = ptInV(q);
    let Z = null;
    if (alive) { Z = Zc(l); arr(q, Z, 'w-uvec'); items.unshift({ text: '𝒵', cls: 'vec', cands: tipCands(q, Z, 1) }); }
    const cmp = cfg.compareE && conn !== 'E' && Z && Math.abs(l - l0) > 1e-6;
    if (cmp) { arr(q, st.z0, 'w-uvec pt-cmp'); items.push({ text: '∇ᴱ copy', cls: 'vec small', cands: tipCands(q, st.z0, -1) }); }
    if (cfg.showVelocity !== false) { arr(q, v, 'w-vec'); items.push({ text: 'v', cls: '', cands: tipCands(q, v, -1) }); }
    const accOk = conn === 'P' ? inV : conn === 'W' ? Math.hypot(...q) > 1e-9 : true;
    if (cfg.showAcceleration !== false && accOk && Math.hypot(...A) > 1e-3) { arr(q, A, 'w-vec pt-acc'); items.push({ text: 'a', cls: '', cands: tipCands(q, A, 1) }); }
    if (cfg.showBasis && inV) {
      const B = ptJi(q);
      for (const i of [0, 1]) { const e = [B[0][i], B[1][i]]; arr(q, e, 'w-basis pt-basis'); items.push({ text: `∂y${'₁₂'[i]}`, cls: 'basis small', cands: tipCands(q, e, i ? 1 : -1) }); }
    }
    placeLabels(items, segs);
    L.marks.append(s('circle', { cx: P(...q)[0], cy: P(...q)[1], r: 0.1, class: 'cv-p' }));

    // readout
    const rows = [
      h('div', { class: 'wide', html: mdInline(`${cv.md}; the point at $\\lambda = ${fmt(l)}$ is $${vec(q)}$.`) }),
      h('div', { class: 'wide', html: mdInline(conn === 'E'
        ? `$${NAB.E}$: parallel transport keeps the **cartesian** components of $\\mathcal{Z}$ constant.`
        : conn === 'P'
          ? `$${NAB.P}$: parallel transport keeps the **polar** components of $\\mathcal{Z}$ constant; it is defined only on the polar chart's domain (no origin, no cut $b = 0,\\ a \\le 0$).`
          : conn === 'W'
            ? `$${NAB.W}$: the unit radial and angular fields $e_1, e_2$ are declared parallel, so transport keeps the components of $\\mathcal{Z}$ along $e_1, e_2$ constant: $\\mathcal{Z}$ turns with the polar angle of $\\gamma(\\lambda)$. Defined on the plane minus the origin.`
            : `$${NAB.kappa}$ with $\\kappa = ${fmt(kap)}$: the only nonzero coefficient in $\\mathscr{X}$ is $\\Gamma^1_{22} = \\kappa a$, so transport gives $\\dot z^1 = -\\kappa\\, a\\, z^2\\, \\dot\\gamma^2$ and $\\dot z^2 = 0$.`) }),
    ];
    if (conn === 'W' && !startOk) rows.push(h('div', { class: 'wide warn', html: mdInline(`The curve starts at the origin, where $${NAB.W}$ is not defined.`) }));
    else if (conn === 'W' && !alive) rows.push(h('div', { class: 'wide warn', html: mdInline(`At $\\lambda \\approx ${fmt(stopL)}$ the curve hits the origin, where $${NAB.W}$ is not defined, so the transport stops.`) }));
    else if (conn === 'P' && !zP) rows.push(h('div', { class: 'wide warn', html: mdInline(`The curve starts outside the polar chart's domain: $${NAB.P}$ cannot transport anything from there.`) }));
    else if (!alive) rows.push(h('div', { class: 'wide warn', html: mdInline(`At $\\lambda \\approx ${fmt(stopL)}$ the curve leaves the polar chart's domain (${Math.hypot(...f(stopL)) < 1e-6 ? 'it hits the origin' : 'it reaches the cut'}): $${NAB.P}$ is not defined there, so the transport stops.`) }));
    const cell = (title, name) => {
      const out = [h('div', { class: 'cb-tag', html: mdInline(title) })];
      const conv = w => (name === 'x' ? w : mulv(ptJ(q), w));
      if (Z) out.push(h('div', { class: 'c-vec', html: tex(combo('\\mathcal{Z}', conv(Z), `\\partial ${name}`)) }));
      if (cfg.showVelocity !== false) out.push(h('div', { html: tex(combo('v_\\gamma', conv(v), `\\partial ${name}`)) }));
      if (cfg.showAcceleration !== false && accOk) out.push(h('div', { html: tex(combo('a_\\gamma', conv(A), `\\partial ${name}`)) }));
      return h('div', { class: 'cv-cell' }, ...out);
    };
    rows.push(cell('In $\\mathscr{X}$ (cartesian)', 'x'));
    rows.push(inV ? cell('In $\\mathscr{Y}$ (polar)', 'y')
      : h('div', { class: 'cv-cell cb-tag', html: mdInline('In $\\mathscr{Y}$ (polar): $\\gamma(\\lambda)$ is not in the domain (origin or cut), no polar components here.') }));

    // the transport equation in numbers, in the chart where the coefficients do not vanish
    if (cfg.residual !== false && Z && (conn === 'E' ? inV : true)) {
      const zIn = conn === 'E' ? x => mulv(ptJ(f(x)), st.z0) : x => Zc(x);          // components in 𝒴 (∇ᴱ) or 𝒳 (others)
      const zc = zIn(l);
      let G, zd;
      // ∇^κ, ∇ᵂ: ż from the side of λ we are on (one-sided at the end of the range, and at corners)
      if (conn === 'kappa' || conn === 'W') {
        const e = 1e-4, lo = Math.max(a, l - e), hi = Math.min(b, l + e), z1 = zIn(lo), z2 = zIn(hi);
        zd = [0, 1].map(k => (z2[k] - z1[k]) / (hi - lo));
        if (cv.d) { const fw = l + e <= b; const z3 = zIn(fw ? l + e : l - e); zd = [0, 1].map(k => (fw ? z3[k] - zc[k] : zc[k] - z3[k]) / e); }
      } else zd = ptD1(zIn, l);
      if (conn === 'kappa' || conn === 'W') {
        G = ptGx(conn, q, zc, v, kap);
      } else if (conn === 'E') {
        const r = Math.hypot(...q), gd = mulv(ptJ(q), v);
        G = [-r * zc[1] * gd[1], (zc[0] * gd[1] + zc[1] * gd[0]) / r];
      } else {
        // (Γᴾ_𝒳)^k_{ji} = Σ_m (D𝒴⁻¹)^k_m ∂_i (D𝒴)^m_j, by finite differences
        const Ji = ptJi(q), e = 1e-5;
        const dJ = [0, 1].map(i => { const dq = i ? [0, e] : [e, 0];
          const Jp = ptJ([q[0] + dq[0], q[1] + dq[1]]), Jm = ptJ([q[0] - dq[0], q[1] - dq[1]]);
          return Jp.map((row, m) => row.map((t, j) => (t - Jm[m][j]) / (2 * e))); });
        G = [0, 1].map(k => { let t = 0;
          for (const j of [0, 1]) for (const i of [0, 1]) for (const m of [0, 1]) t += Ji[k][m] * dJ[i][m][j] * zc[j] * v[i];
          return t; });
      }
      const ch = conn === 'E' ? '\\mathscr{Y}' : '\\mathscr{X}';
      rows.push(h('div', { class: 'wide', html: mdInline(`Transport equation in $${ch}$, where the coefficients of $${NAB[conn]}$ are not all zero:`) }));
      rows.push(h('div', { class: 'wide', html: tex('\\dot z^k + \\Gamma^k_{ji}\\,z^j\\,\\dot\\gamma^i = 0') }));
      for (const k of [0, 1])
        rows.push(h('div', { class: 'cv-cell' },
          h('div', { html: tex(`\\dot z^${k + 1} = ${fmt(zd[k])}`) }),
          h('div', { html: tex(`\\Gamma^${k + 1}_{ji}\\,z^j\\,\\dot\\gamma^i = ${fmt(G[k])}`) })));
    }

    if (cfg.torsion) {
      const r2 = q[0] ** 2 + q[1] ** 2, T = conn === 'W' ? (r2 > 1e-12 ? [-q[1] / r2, q[0] / r2] : null) : [0, 0];
      if (T) rows.push(h('div', { class: 'wide', html: mdInline(`Torsion at $\\gamma(\\lambda)$, components $\\mathtt{T}^i_{12} = \\Gamma^i_{21} - \\Gamma^i_{12}$ in $\\mathscr{X}$: $\\mathtt{T}^1_{12} = ${fmt(T[0])}$, $\\mathtt{T}^2_{12} = ${fmt(T[1])}$${conn === 'W' ? '' : ' (coefficients symmetric: torsion free)'}.`) }));
    }
    if (cmp) {
      const ang = Math.atan2(st.z0[0] * Z[1] - st.z0[1] * Z[0], st.z0[0] * Z[0] + st.z0[1] * Z[1]) * 180 / Math.PI;
      rows.push(h('div', { class: 'wide', html: mdInline(`Angle from the $${NAB.E}$ copy (dashed, cartesian components kept) to $\\mathcal{Z}$: $${fmt(ang)}^\\circ$ (counterclockwise positive).`) }));
    }
    if (cv.closed && cfg.holonomy !== false && startOk) {
      const done = stopL === null, Ze = done ? Zc(b) : null, dz = Ze && [Ze[0] - st.z0[0], Ze[1] - st.z0[1]];
      const Rm = conn === 'kappa' ? kap : 0, pred = -Rm * st.z0[1] * cv.area;
      rows.push(h('div', { class: 'wide', html: mdInline(done
        ? `**After the loop** (cartesian components): $\\Delta z = z(${fmt(b)}) - z(${fmt(a)}) = ${vec(dz)}$.`
        : `**After the loop**: not defined, the transport stops before the loop closes.`) }));
      rows.push(h('div', { class: 'wide', html: mdInline(conn === 'kappa'
        ? `**Prediction:** $\\Delta z^1 = -\\mathrm{Riem}^1_{212}\\, z^2 \\times \\text{area}$ with $\\mathrm{Riem}^1_{212} = \\kappa = ${fmt(kap)}$, $z^2 = ${fmt(st.z0[1])}$, area $= ${fmt(cv.area)}$: $\\Delta z^1 = ${fmt(pred)}$, and $\\Delta z^2 = 0$.`
        : `**Prediction:** $${NAB[conn]}$ is flat ($\\mathrm{Riem} = 0$), so $\\Delta z = (0, 0)$.`) }));
    }
    if (cfg.badge !== false && !cv.closed) {
      const bi = badgeInfo(cv, conn, stopL), Rnow = (A[0] * v[0] + A[1] * v[1]) / (v[0] ** 2 + v[1] ** 2);
      const part = conn === 'P' && stopL !== null ? ' (checked on the part of the curve inside the polar chart\'s domain)' : '';
      const txt = bi.zero
        ? `**Autoparallel?** Yes${part}, even autoparallelly transported: $a_\\gamma = \\nabla_{v_\\gamma} v_\\gamma = 0$ at every $\\lambda$.`
        : bi.par
          ? `**Autoparallel?** Yes${part}, but not autoparallelly transported: $a_\\gamma = \\text{ᚱ}(\\lambda)\\, v_\\gamma$ with $\\text{ᚱ} \\ne 0$ (here $\\text{ᚱ} = ${fmt(Rnow)}$).`
          : `**Autoparallel?** No${part}: $a_\\gamma$ is not a multiple of $v_\\gamma$ (for example at $\\lambda = ${fmt(bi.bad)}$).`;
      rows.push(h('div', { class: `wide ${bi.par ? 'ok' : 'warn'}`, html: mdInline(txt) }));
    }
    readout.replaceChildren(...rows);
  }
  draw();
}
