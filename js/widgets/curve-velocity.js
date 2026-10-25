// curve-velocity
//
// The velocity of a curve as a derivative of functions along it. A fixed
// point p in the plane (or, with circle: true, on the unit circle S¹ with the
// angle chart θ ∈ (0, 2π)). Two curves γ₁ (solid) and γ₂ (dashed) pass
// through p at λ = 0:
//   plane:  γ(λ) = p + λ v + λ² a        (v, a ∈ ℝ²)
//   circle: θ(γ(λ)) = θ(p) + λ w + λ² a   (w, a ∈ ℝ)
// Each curve has two handles: the tip of its velocity arrow (blue) sets v
// (or w); the hollow handle at γ(−1) bends the curve (sets a) without moving
// the arrow. Dots mark λ = ±0.5, ±1, so spacing shows speed. The reader picks
// a scalar field f; its level lines are drawn (plane), and a second panel
// graphs λ ↦ f(γ(λ)) for both curves with their tangent lines at λ = 0.
// The readout gives, per curve, its formula, its components v^i = (𝒳^i∘γ)'(0)
// in the chart (x, y) or θ, and (f∘γ)'(0); a badge says whether the two
// velocities are equal (all components agree).
//
// config:
//   circle:  false        S¹ with the θ chart instead of the plane
//   p:       [1, 1]       the point (plane)
//   angle:   60           the point, in degrees (circle; not 0)
//   curves:  [{v, a}, {v, a}]   plane: v, a in ℝ²; circle: {w, a} numbers
//   bend:    true         show the bend handles (false: straight curves only)
//   f:       x2y          initial field: x | y | x2y (x² + y) | theta
//   fields:  [x, y, x2y, theta]   field buttons offered
//   graph:   true         show the panel of λ ↦ f(γ(λ))
//   chain:   false        expand (f∘γ)'(0) = Σ ∂_i f · v^i in the readout
//   snap:    0.25         grid for v, a (and w, a)
//   presets: [{label, curves, f}]

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { P, arrow, fmt, label, line, placeHandle, planeSvg, s } from './plane.js';

const CV_FIELDS = {
  x: { tex: 'x', name: 'x', f: q => q[0], grad: () => [1, 0] },
  y: { tex: 'y', name: 'y', f: q => q[1], grad: () => [0, 1] },
  x2y: { tex: 'x^2 + y', name: 'x² + y', f: q => q[0] ** 2 + q[1], grad: q => [2 * q[0], 1] },
  theta: { tex: '\\theta', name: 'θ', f: q => { const t = Math.atan2(q[1], q[0]); return t < 0 ? t + 2 * Math.PI : t; },
    grad: q => { const r2 = q[0] ** 2 + q[1] ** 2 || 1; return [-q[1] / r2, q[0] / r2]; } },
};
export function curveVelocity(el, cfg) {
  const circ = !!cfg.circle, sn = cfg.snap ?? 0.25, bend = cfg.bend ?? true, chain = !!cfg.chain;
  const showGraph = cfg.graph ?? true, S = circ ? 2 : 1;
  const fields = (cfg.fields ?? ['x', 'y', 'x2y', 'theta']).filter(k => CV_FIELDS[k]);
  const p0 = cfg.p ?? [1, 1], th0 = (cfg.angle ?? 60) * Math.PI / 180;
  const pt = circ ? [Math.cos(th0), Math.sin(th0)] : p0;
  const defCurves = circ ? [{ w: 1, a: 0 }, { w: 1, a: 0.5 }] : [{ v: [1, 0.5], a: [0, 0] }, { v: [1, 0.5], a: [0, -0.75] }];
  const norm = c => (circ ? { w: c.w ?? 1, a: c.a ?? 0 } : { v: [...(c.v ?? [1, 0])], a: [...(c.a ?? [0, 0])] });
  const init = () => ({ f: cfg.f ?? 'x2y', curves: (cfg.curves ?? defCurves).slice(0, 2).map(norm) });
  let st = init();
  const snap = t => (sn ? Math.round(t / sn) * sn : t);

  const view = cfg.view ?? (circ ? { x: -2.95, y: -2.95, w: 5.9, h: 5.9 } : { x: pt[0] - 2.5, y: pt[1] - 2.5, w: 5, h: 5 });
  const { svg, layers: L } = planeSvg(view, 'Drag the handles of the two curves through p', ['levels', 'curves', 'ticks', 'arrows', 'marks', 'labels', 'handles']);
  const XS = 2, gview = { x: -3, y: -2.7, w: 6, h: 5.4 };
  const { svg: gsvg, layers: G } = planeSvg(gview, 'Graph of f along each curve', ['curves', 'tans', 'marks', 'labels']);
  const panels = h('div', { class: `cc-panels${showGraph ? '' : ' single'}` }, svg, ...(showGraph ? [gsvg] : []));
  const fbtns = h('div', { class: 'wbtns' });
  const readout = h('div', { class: 'readout' });
  const btns = h('div', { class: 'wbtns' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      st = { f: pr.f ?? st.f, curves: pr.curves ? pr.curves.slice(0, 2).map(norm) : st.curves }; draw();
    } }, pr.label)));
  el.append(panels, fbtns, readout, btns);

  // the curve as a map λ ↦ point of ℝ² (the circle sits in ℝ² only to be drawn)
  const thetaAt = (c, l) => th0 + c.w * l + c.a * l * l;
  const gam = (c, l) => (circ
    ? [Math.cos(thetaAt(c, l)), Math.sin(thetaAt(c, l))]
    : [pt[0] + c.v[0] * l + c.a[0] * l * l, pt[1] + c.v[1] * l + c.a[1] * l * l]);
  const vel = c => (circ ? [-Math.sin(th0) * c.w, Math.cos(th0) * c.w] : c.v); // γ'(0) in ℝ²
  const comps = c => (circ ? [c.w] : c.v);
  const D = q => [S * q[0], S * q[1]];
  const fld = () => CV_FIELDS[st.f];
  // ∂f in the chart at p: (∂_x f, ∂_y f), or ∂_θ (f∘θ⁻¹) on the circle
  const partials = () => {
    const g = fld().grad(pt);
    return circ ? [-Math.sin(th0) * g[0] + Math.cos(th0) * g[1]] : g;
  };
  const deriv = c => { const g = fld().grad(pt), v = vel(c); return g[0] * v[0] + g[1] * v[1]; };

  // handles: k = curve, kind = 'v' (velocity tip) or 'a' (bend, at γ(−1))
  const hs = [];
  for (let k = 0; k < 2; k++) for (const kind of bend ? ['v', 'a'] : ['v']) {
    const c = s('circle', { r: kind === 'v' ? 0.17 : 0.14, class: kind === 'v' ? 'w-handle vec' : 'w-handle cv-bend',
      tabindex: 0, 'aria-label': `${kind === 'v' ? 'velocity' : 'bend'} of curve ${k + 1}` });
    L.handles.append(c);
    hs.push({ k, kind, c });
    c.addEventListener('pointerdown', e => {
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      const move = ev => {
        const q = svg.createSVGPoint();
        q.x = ev.clientX; q.y = ev.clientY;
        const m = q.matrixTransform(svg.getScreenCTM().inverse());
        const x = Math.max(view.x + 0.15, Math.min(view.x + view.w - 0.15, m.x)) / S;
        const y = Math.max(view.y + 0.15, Math.min(view.y + view.h - 0.15, -m.y)) / S;
        const cur = st.curves[k];
        if (circ && kind === 'v') cur.w = snap((x - pt[0]) * -Math.sin(th0) + (y - pt[1]) * Math.cos(th0));
        else if (circ) {
          // θ(γ(−1)) = θ(p) − w + a, with the pointer's angle taken nearest θ(p)
          let d = Math.atan2(y, x) - th0;
          d -= 2 * Math.PI * Math.round(d / (2 * Math.PI));
          cur.a = snap(d + cur.w);
        } else if (kind === 'v') cur.v = [snap(x - pt[0]), snap(y - pt[1])];
        else cur.a = [snap(x - pt[0] + cur.v[0]), snap(y - pt[1] + cur.v[1])];
        draw();
      };
      const up = () => { c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up); };
      c.addEventListener('pointermove', move);
      c.addEventListener('pointerup', up);
      c.addEventListener('pointercancel', up);
    });
  }

  // level lines f = f(p) + n·step of the field, in the plane
  function levels() {
    const fp = fld().f(pt), out = [], X0 = view.x, X1 = view.x + view.w, Y0 = view.y, Y1 = view.y + view.h;
    for (let n = -12; n <= 12; n++) {
      if (st.f === 'x') out.push([[pt[0] + n / 2, Y0], [pt[0] + n / 2, Y1]]);
      else if (st.f === 'y') out.push([[X0, pt[1] + n / 2], [X1, pt[1] + n / 2]]);
      else if (st.f === 'x2y') {
        const c = fp + n / 2, pts = [];
        for (let i = 0; i <= 80; i++) { const x = X0 + (X1 - X0) * i / 80; pts.push([x, c - x * x]); }
        out.push(pts);
      } else {
        const t = fp + n * Math.PI / 12;
        out.push([[0, 0], [40 * Math.cos(t), 40 * Math.sin(t)]]);
      }
    }
    return out;
  }
  const poly = (pts, cls) => s('polyline', { points: pts.map(q => P(...q).join(',')).join(' '), class: cls });
  const LAM = 1.4;

  function drawGraph() {
    for (const k of ['curves', 'tans', 'marks', 'labels']) G[k].replaceChildren();
    const fp = fld().f(pt);
    for (const x of [-1, 1]) {
      G.labels.append(line([XS * x, -0.12], [XS * x, 0.12], 'w-axis'));
      G.labels.append(label([XS * x, -0.42], x < 0 ? '−1' : '1', 'tick'));
    }
    G.labels.append(label([gview.x + gview.w - 0.3, 0.32], 'λ'));
    G.labels.append(label([0.95, gview.y + gview.h - 0.32], `f(γ(λ))`, 'small'));
    G.labels.append(label([gview.x + 0.5, 0.3], 'f(p)', 'tick'));
    st.curves.forEach((c, k) => {
      let seg = [], prev = null;
      const flush = () => { if (seg.length > 1) G.curves.append(poly(seg, `cv-curve c${k + 1}`)); seg = []; };
      for (let i = 0; i <= 140; i++) {
        const l = -LAM + 2 * LAM * i / 140;
        let y = circ && st.f === 'theta' ? thetaAt(c, l) - th0 : fld().f(gam(c, l)) - fp;
        if (prev != null && Math.abs(y - prev) > 1) flush();
        prev = y;
        seg.push([XS * l, Math.max(-9, Math.min(9, y))]);
      }
      flush();
      const d = deriv(c);
      G.tans.append(line([-XS * LAM, -LAM * d], [XS * LAM, LAM * d], `cv-tan c${k + 1}`));
    });
    const [cx, cy] = P(0, 0);
    G.marks.append(s('circle', { cx, cy, r: 0.13, class: 'w-handle gold' }));
  }

  function draw() {
    for (const k of ['levels', 'curves', 'ticks', 'arrows', 'marks', 'labels']) L[k].replaceChildren();
    fbtns.replaceChildren(h('span', { class: 'cv-flabel', html: tex('f =') }),
      ...fields.map(k => h('button', { class: `btn ${k === st.f ? '' : 'ghost'}`, type: 'button',
        onclick: () => { st.f = k; draw(); } }, CV_FIELDS[k].name)));
    if (circ) {
      L.curves.append(s('circle', { cx: 0, cy: 0, r: S, class: 'w-graph' }));
      const [mx, my] = P(S, 0);
      L.marks.append(s('circle', { cx: mx, cy: my, r: 0.12, class: 'w-end amb' }));
      L.labels.append(label([S + 0.45, -0.3], '(1,0)', 'tick'));
    } else for (const pts of levels()) L.levels.append(poly(pts, 'w-level'));

    st.curves.forEach((c, k) => {
      // the trace (offset off the circle so the two curves stay visible)
      const off = circ ? (k === 0 ? 1.07 : 0.93) : 1;
      const pts = [];
      for (let i = 0; i <= 120; i++) { const l = -LAM + 2 * LAM * i / 120; pts.push(D(gam(c, l)).map(t => t * off)); }
      L.curves.append(poly(pts, `cv-curve c${k + 1}`));
      for (const l of [-1, -0.5, 0.5, 1]) {
        const [cx, cy] = P(...D(gam(c, l)).map(t => t * off));
        L.ticks.append(s('circle', { cx, cy, r: 0.06, class: `cv-dot c${k + 1}` }));
      }
      const tip = [pt[0] + vel(c)[0], pt[1] + vel(c)[1]];
      L.arrows.append(arrow(D(pt), D(tip), `w-uvec${k ? ' cv-dash' : ''}`));
      const end = gam(c, LAM), e2 = D(end).map(t => t * off), dir = Math.hypot(...e2) || 1;
      L.labels.append(label(circ ? e2.map(t => t * (1 + (k ? -0.28 : 0.2) / dir)) : [e2[0] + 0.3, e2[1] + 0.25], k ? 'γ₂' : 'γ₁'));
      for (const hd of hs.filter(x => x.k === k)) placeHandle(hd.c, hd.kind === 'v' ? D(tip) : D(gam(c, -1)).map(t => t * off));
    });
    const [px, py] = P(...D(pt));
    L.marks.append(s('circle', { cx: px, cy: py, r: 0.11, class: 'cv-p' }));
    const pl = circ ? D(pt).map(t => t * 0.78) : [pt[0] - 0.3, pt[1] - 0.3];
    L.labels.append(label(pl, 'p', 'gold'));
    if (showGraph) drawGraph();

    // readout
    const F = fld(), dp = partials(), names = circ ? ['\\theta'] : ['1', '2'];
    // " + 2λ", " − λ": sign folded into the operator, a unit coefficient dropped
    const signed = t => `${t < 0 ? '-' : '+'} ${fmt(Math.abs(t)) === '1' ? '' : fmt(Math.abs(t))}`;
    const curveTex = (c, k) => {
      const g = `\\gamma_${k + 1}`;
      if (circ) {
        let r = `\\theta(${g}(\\lambda)) = \\theta_p`;
        if (Math.abs(c.w) > 1e-9) r += ` ${signed(c.w)}\\lambda`;
        if (Math.abs(c.a) > 1e-9) r += ` ${signed(c.a)}\\lambda^2`;
        return r;
      }
      let r = `${g}(\\lambda) = p + \\lambda\\,(${fmt(c.v[0])}, ${fmt(c.v[1])})`;
      if (Math.hypot(...c.a) > 1e-9) r += ` + \\lambda^2(${fmt(c.a[0])}, ${fmt(c.a[1])})`;
      return r;
    };
    const rows = [
      h('div', { html: tex(`f = ${F.tex}`) }),
      h('div', { html: circ ? tex(`p = (${fmt(pt[0])}, ${fmt(pt[1])}),\\ \\theta_p = ${fmt(th0)}`) : tex(`p = (${fmt(pt[0])}, ${fmt(pt[1])})`) }),
    ];
    const ds = st.curves.map(deriv);
    st.curves.forEach((c, k) => {
      const g = `\\gamma_${k + 1}`, v = comps(c);
      const compTex = circ ? `v^\\theta = ${fmt(v[0])}` : `(v^1, v^2) = (${fmt(v[0])}, ${fmt(v[1])})`;
      const par = t => (fmt(t).startsWith('-') ? `(${fmt(t)})` : fmt(t));
      // chain: the sum over the chart's partials, Σ ∂_i f(p) · v^i, on its own line
      const sum = `= ${dp.map((t, i) => `${i ? par(t) : fmt(t)}\\cdot ${par(v[i])}`).join(' + ')}`;
      rows.push(h('div', { class: 'cv-cell' },
        h('div', { html: tex(curveTex(c, k)) }),
        h('div', { class: 'c-vec', html: tex(compTex) }),
        h('div', { html: tex(`(f\\circ ${g})'(0) = ${fmt(ds[k])}`) }),
        ...(chain ? [h('div', { html: tex(sum) })] : [])));
    });
    const same = st.curves[0] && st.curves[1] && comps(st.curves[0]).every((t, i) => Math.abs(t - comps(st.curves[1])[i]) < 1e-9);
    const sameF = Math.abs(ds[0] - ds[1]) < 1e-9;
    let msg, cls = 'wide';
    if (same) { msg = 'Same velocity: $v_{\\gamma_1,p} = v_{\\gamma_2,p}$ (equal components, so equal on every $f$).'; cls += ' ok'; }
    else if (sameF) msg = `Equal on $f = ${F.tex}$ only: the components differ, so another $f$ tells the curves apart.`;
    else msg = 'Different velocities: $v_{\\gamma_1,p} \\neq v_{\\gamma_2,p}$.';
    rows.push(h('div', { class: cls, html: mdInline(msg) }));
    readout.replaceChildren(...rows);
  }
  draw();
}
