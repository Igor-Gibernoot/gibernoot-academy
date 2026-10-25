// observer-frame
//
// 1+1 Minkowski spacetime (a across, τ up, components in the order (a, τ),
// signature (+, −): g(X, Y) = X^τ Y^τ − X^a Y^a). An observer at p = (0, 0)
// moving with chart speed u: e_0 = (u, 1)/√(1−u²) (its 4-velocity, on the
// unit hyperbola g = 1) and e_1 = (1, u)/√(1−u²) (g = −1), drawn purple (the
// basis hue): the pair closes like scissors on the light line as |u| → 1.
// u from a slider or by dragging e_0's tip. A draggable vector 𝒳 (blue) with
// its measured components X^0 = ε^0(𝒳) = g(e_0, 𝒳), X^1 = ε^1(𝒳) = −g(e_1, 𝒳),
// drawn as the parallelogram along e_0, e_1. Readout: e_0, e_1, the
// Lorentz-orthonormality checks, both component sets, X^0 e_0 + X^1 e_1 = 𝒳,
// g(𝒳, 𝒳) in both, the measured speed |X^1/X^0| with a badge.
// compare: the observer at rest (u = 0), faint, and its measurements.
//
// config:
//   u: 0, X: [3, 5], snapX: 0.25, snapU: 0.05 (drag), nullSnap: true,
//   hyperbolae: true, parallelogram: true, badge: true, compare: false,
//   compareButton: false, slider: true, dragE: true, dragX: true,
//   view: { x: -3.5, y: -2.5, w: 7, h: 8 }, presets: [{ label, u, X, compare }]

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { P, arrow, label, line, placeHandle, planeSvg, s } from './plane.js';
import { LC_METRICS, lcG } from './light-cones.js';

export function observerFrame(el, cfg) {
  const snX = cfg.snapX ?? 0.25, snU = cfg.snapU ?? 0.05, UM = 0.95;
  const view = cfg.view ?? { x: -3.5, y: -2.5, w: 7, h: 8 };
  const f3 = x => (Math.abs(x) < 5e-4 ? '0' : String(Math.round(x * 1000) / 1000));
  const par = x => (f3(x).startsWith('-') ? `(${f3(x)})` : f3(x));
  const clampU = u => Math.max(-UM, Math.min(UM, u));
  const G = (X, Y) => lcG(LC_METRICS.minkowski, 0, X, Y);
  const init = () => ({ u: clampU(cfg.u ?? 0), X: [...(cfg.X ?? [3, 5])], cmp: !!cfg.compare });
  let st = init();
  const { svg, layers: L } = planeSvg(view, 'Minkowski spacetime with the light cone at p, the frame e0, e1 of an observer moving with speed u, and a vector X with its measured components',
    ['hyp', 'cone', 'axes', 'part', 'arrows', 'marks', 'labels', 'handles']);
  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', min: -UM, max: UM, step: 0.01, 'aria-label': 'speed u of the observer' });
  slider.addEventListener('input', () => { st.u = +slider.value; draw(); });
  const uOut = h('span', { class: 'c-basis' });
  const cmpBtn = cfg.compareButton ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.cmp = !st.cmp; draw(); } }, 'Observer at rest') : null;
  const btns = h('div', { class: 'wbtns' }, cmpBtn,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      if (pr.u != null) st.u = clampU(pr.u);
      if (pr.X) st.X = [...pr.X];
      if (pr.compare != null) st.cmp = !!pr.compare;
      draw();
    } }, pr.label)));
  el.append(h('div', { class: 'cc-panels single' }, svg),
    cfg.slider === false ? '' : h('label', { class: 'wslider' }, uOut, slider), readout, btns);

  const svgPt = ev => {
    const q = svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
    const m = q.matrixTransform(svg.getScreenCTM().inverse());
    return [m.x, -m.y];
  };
  const drag = (hd, onMove) => hd.addEventListener('pointerdown', e => {
    e.preventDefault();
    hd.setPointerCapture(e.pointerId);
    const move = ev => { onMove(svgPt(ev)); draw(); };
    const up = () => { hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); };
    hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
  });
  const clampV = ([x, y], mg = 0.2) => [Math.max(view.x + mg, Math.min(view.x + view.w - mg, x)), Math.max(view.y + mg, Math.min(view.y + view.h - mg, y))];
  const xh = cfg.dragX === false ? null : s('circle', { r: 0.22, class: 'w-handle vec', tabindex: 0, 'aria-label': 'tip of the vector X' });
  const eh = cfg.dragE === false ? null : s('circle', { r: 0.22, class: 'w-handle', tabindex: 0, 'aria-label': 'tip of e0, on the unit hyperbola' });
  const nulls = [[Math.SQRT1_2, Math.SQRT1_2], [-Math.SQRT1_2, Math.SQRT1_2]];
  if (xh) {
    L.handles.append(xh);
    drag(xh, m => {
      const raw = clampV(m);
      let X = raw.map(v => (snX ? Math.round(v / snX) * snX : v));
      // magnet: onto a null line when the pointer is close to it
      if (cfg.nullSnap !== false && Math.hypot(...raw) > 0.3)
        for (const d of nulls)
          if (Math.abs(raw[0] * d[1] - raw[1] * d[0]) < 0.15) {
            const xt = Math.round(raw[1] / snX) * snX || Math.sign(raw[1]) * snX;
            X = [xt * d[0] / d[1], xt];
          }
      st.X = X;
    });
  }
  if (eh) {
    L.handles.append(eh);
    // e_0 stays on the future unit hyperbola: only the slope u = a/τ of the pointer is read
    drag(eh, ([x, y]) => {
      const u = y > Math.abs(x) ? x / y : Math.sign(x) * UM;
      st.u = clampU(snU ? Math.round(u / snU) * snU : u);
    });
  }

  const inside = ([x, y]) => [Math.max(view.x + 0.4, Math.min(view.x + view.w - 0.45, x)), Math.max(view.y + 0.22, Math.min(view.y + view.h - 0.22, y))];
  const tipPos = tip => {
    const l = Math.hypot(...tip) || 1, u = [tip[0] / l, tip[1] / l];
    return inside([tip[0] + 0.4 * u[0] - 0.22 * u[1], tip[1] + 0.4 * u[1] + 0.22 * u[0]]);
  };
  const tipLab = (tip, d, txt, cls) => L.labels.append(label(tipPos(tip), txt, cls));
  const poly = (pts, cls) => s('polyline', { points: pts.map(v => P(...v).join(',')).join(' '), class: cls });

  function draw() {
    for (const k of ['hyp', 'cone', 'axes', 'part', 'arrows', 'marks', 'labels']) L[k].replaceChildren();
    const u = st.u, gf = 1 / Math.sqrt(1 - u * u), e0 = [u * gf, gf], e1 = [gf, u * gf], X = st.X;
    slider.value = u; uOut.innerHTML = tex(`u = ${f3(u)}`);
    L.labels.append(label([view.x + view.w - 0.25, -0.28], 'a', ''));
    L.labels.append(label([0.25, view.y + view.h - 0.25], 'τ', ''));
    // unit hyperbolae g(X, X) = 1 (future and past branch) and g(X, X) = −1
    if (cfg.hyperbolae !== false) {
      const R = Math.max(Math.abs(view.x), Math.abs(view.x + view.w), Math.abs(view.y), Math.abs(view.y + view.h)) + 1;
      const tt = Array.from({ length: 121 }, (_, i) => -R + 2 * R * i / 120);
      for (const sg of [1, -1]) {
        L.hyp.append(poly(tt.map(t => [t, sg * Math.sqrt(1 + t * t)]), 'of-hyp'));
        L.hyp.append(poly(tt.map(t => [sg * Math.sqrt(1 + t * t), t]), 'of-hyp'));
      }
      const al = view.x + 0.75;
      L.labels.append(label([al, Math.sqrt(1 + al * al) + 0.35], 'g = 1', 'small lc-word'));
      L.labels.append(label([view.x + view.w - 0.6, view.y + 0.7], 'g = −1', 'small lc-word'));
    }
    // light cone at p, future half shaded
    L.cone.append(s('polygon', { points: [[0, 0], [-30, 30], [30, 30]].map(v => P(...v).join(',')).join(' '), class: 'lc-future' }));
    for (const d of nulls) L.cone.append(line([-30 * d[0], -30 * d[1]], [30 * d[0], 30 * d[1]], 'lc-null'));
    // the observer's axes: its worldline along e_0, its space line along e_1
    for (const d of [e0, e1]) L.axes.append(line([-30 * d[0], -30 * d[1]], [30 * d[0], 30 * d[1]], 'of-axis'));
    if (st.cmp) {
      L.arrows.append(arrow([0, 0], [0, 1], 'w-basis of-faint'), arrow([0, 0], [1, 0], 'w-basis of-faint'));
      L.labels.append(label([-0.45, 0.95], 'rest', 'small basis of-faint-l'));
    }
    // measured components and the parallelogram
    const X0 = G(e0, X), X1 = -G(e1, X), A = [X0 * e0[0], X0 * e0[1]], B = [X1 * e1[0], X1 * e1[1]];
    const zero = Math.hypot(...X) < 1e-9;
    if (cfg.parallelogram !== false && !zero) {
      L.part.append(s('polygon', { points: [[0, 0], A, X, B].map(v => P(...v).join(',')).join(' '), class: 'w-area' }));
      if (Math.abs(X0) > 1e-9) L.part.append(line([0, 0], A, 'w-part'), line(B, X, 'w-part'));
      if (Math.abs(X1) > 1e-9) L.part.append(line([0, 0], B, 'w-part'), line(A, X, 'w-part'));
      // labels at the edges' midpoints, only when that spot is in the view
      const inV = q => inside(q).every((v, i) => Math.abs(v - q[i]) < 1e-9);
      // on the outer side of the edge 0 -> E, away from the basis tip e
      const spot = (E, other, e) => {
        const l = Math.hypot(...E), n = [-E[1] / l, E[0] / l], sg = n[0] * other[0] + n[1] * other[1] > 0 ? -1 : 1;
        return [0.5, 0.3, 0.7].map(f => [f * E[0] + 0.45 * sg * n[0], f * E[1] + 0.45 * sg * n[1]])
          .find(q => inV(q) && [tipPos(e), [-0.3, -0.3]].every(r => Math.hypot(q[0] - r[0], q[1] - r[1]) > 0.55));
      };
      const qa = Math.abs(X0) > 0.6 ? spot(A, B, e0) : null, qb = Math.abs(X1) > 0.6 ? spot(B, A, e1) : null;
      if (qa) L.labels.append(label(qa, 'X⁰e₀', 'small vec'));
      if (qb) L.labels.append(label(qb, 'X¹e₁', 'small vec'));
    }
    L.arrows.append(arrow([0, 0], e0, 'w-basis'), arrow([0, 0], e1, 'w-basis'));
    tipLab(e0, e0, 'e₀', 'basis'); tipLab(e1, e1, 'e₁', 'basis');
    L.arrows.append(arrow([0, 0], X, 'w-vec lc-x'));
    if (!zero) tipLab(X, X, '𝒳', 'vec');
    L.marks.append(s('circle', { cx: 0, cy: 0, r: 0.08, class: 'cv-dot' }));
    L.labels.append(label([-0.3, -0.3], 'p', ''));
    if (eh) placeHandle(eh, e0);
    if (xh) placeHandle(xh, X);

    // readout
    const pt = v => `(${f3(v[0])}, ${f3(v[1])})`, sq = v => `${par(v)}^2`;
    const gq = G(X, X), nullX = Math.abs(gq) < 1e-9, words = cfg.badge !== false;
    const rows = [
      h('div', { class: 'wide', html: mdInline('Minkowski: $g = d\\tau\\otimes d\\tau - da\\otimes da$; components in the order $(a, \\tau)$, so $g(\\mathcal{X}, \\mathcal{Y}) = X^\\tau Y^\\tau - X^a Y^a$.') }),
      h('div', { class: 'wide c-basis', html: mdInline(`Observer at $p$ with $u = ${f3(u)}$: $1/\\sqrt{1 - u^2} = ${f3(gf)}$, so $e_0 = (u, 1)/\\sqrt{1-u^2} = ${pt(e0)}$ and $e_1 = (1, u)/\\sqrt{1-u^2} = ${pt(e1)}$.`) }),
      h('div', { class: 'wide', html: mdInline(`Lorentz-orthonormal: $g(e_0, e_0) = ${sq(e0[1])} - ${sq(e0[0])} = ${f3(G(e0, e0))},$ $g(e_1, e_1) = ${sq(e1[1])} - ${sq(e1[0])} = ${f3(G(e1, e1))},$ $g(e_0, e_1) = ${par(e0[1])}\\cdot ${par(e1[1])} - ${par(e0[0])}\\cdot ${par(e1[0])} = ${f3(G(e0, e1))}$.`) }),
      h('div', { class: 'wide c-vec', html: mdInline(`Chart components of $\\mathcal{X}$: $X^a = ${f3(X[0])}$, $X^\\tau = ${f3(X[1])}$.`) }),
      h('div', { class: 'wide c-vec', html: mdInline(`Measured by the observer: $X^0 = \\epsilon^0(\\mathcal{X}) = g(e_0, \\mathcal{X})$ $= ${par(e0[1])}\\cdot ${par(X[1])} - ${par(e0[0])}\\cdot ${par(X[0])} = ${f3(X0)}$ and $X^1 = \\epsilon^1(\\mathcal{X}) = -g(e_1, \\mathcal{X})$ $= -(${par(e1[1])}\\cdot ${par(X[1])} - ${par(e1[0])}\\cdot ${par(X[0])}) = ${f3(X1)}$.`) }),
      h('div', { class: 'wide', html: mdInline(`Check: $X^0 e_0 + X^1 e_1$ $= ${par(X0)}\\,${pt(e0)} + ${par(X1)}\\,${pt(e1)}$ $= ${pt([A[0] + B[0], A[1] + B[1]])} = \\mathcal{X}$.`) }),
      h('div', { class: 'wide', html: mdInline(`Same $g(\\mathcal{X}, \\mathcal{X})$ both ways: $(X^\\tau)^2 - (X^a)^2 = ${sq(X[1])} - ${sq(X[0])} = ${f3(gq)}$ and $(X^0)^2 - (X^1)^2 = ${sq(X0)} - ${sq(X1)} = ${f3(X0 * X0 - X1 * X1)}$.`) }),
    ];
    if (st.cmp) {
      const sp = Math.abs(X[1]) > 1e-9 && gq >= -1e-9 ? `, measured speed $|X^a/X^\\tau| = ${f3(Math.abs(X[0] / X[1]))}$` : '';
      rows.push(h('div', { class: 'wide cb-tag', html: mdInline(`Observer at rest (faint, $u = 0$): $e_0 = (0, 1)$, $e_1 = (1, 0)$, so it measures the chart components: time $X^\\tau = ${f3(X[1])}$, space $X^a = ${f3(X[0])}$${sp}.`) }));
    }
    if (words) {
      let b;
      if (zero) b = h('div', { class: 'wide', html: mdInline('$\\mathcal{X} = 0$: both measured components are $0$; no speed.') });
      else if (nullX) b = h('div', { class: 'wide lc-gold', html: mdInline(`Measured speed $|X^1/X^0| = ${f3(Math.abs(X1 / X0))}$: $\\mathcal{X}$ is **lightlike**; light has speed $1$ for every observer.`) });
      else if (gq > 0) b = h('div', { class: 'wide ok', html: mdInline(`Measured speed $|X^1/X^0| = ${f3(Math.abs(X1 / X0))} < 1$: $\\mathcal{X}$ is **timelike** (${X0 > 0 ? '$X^0 > 0$: future directed' : '$X^0 < 0$: past directed'}), a possible velocity of a massive particle.`) });
      else b = h('div', { class: 'wide lc-space', html: mdInline('$|X^1| > |X^0|$: $\\mathcal{X}$ is **spacelike**, not a particle velocity: no measured speed.') });
      rows.push(b);
    }
    readout.replaceChildren(...rows);
  }
  draw();
}
