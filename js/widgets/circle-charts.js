// circle-charts
//
// Two charts on the unit circle S¹. Chart A: the angle θ ∈ (0, 2π), defined
// on 𝒰 = S¹ ∖ {(1,0)}. Chart B: the angle φ ∈ (−π, π) on 𝒱 = S¹ ∖ {(−1,0)},
// or (stereo) the stereographic projection σ = x/(1 − y) from the north pole
// on 𝒱 = S¹ ∖ {(0,1)}. Each chart's domain is a ring around the circle, the
// overlap is drawn on the circle itself, and the missing points are hollow.
// The reader drags p around the circle; a second panel graphs the transition
// map (B's coordinate as a function of θ) on θ(𝒰 ∩ 𝒱).
//
// config:
//   angle:   60          position of p, in degrees from (1,0) counterclockwise
//   show:    both        both | A | B (one chart alone hides the transition)
//   stereo:  false       chart B is stereographic projection instead of φ
//   snap:    5           degrees p snaps to (0 = free)
//   presets: [{label, angle, show}]

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { P, fmt, label, line, placeHandle, planeSvg, s } from './plane.js';

export function circleCharts(el, cfg) {
  const R = 2, stereo = !!cfg.stereo, sn = cfg.snap ?? 5;
  const init = () => ({ deg: cfg.angle ?? 60, show: cfg.show ?? 'both' });
  let st = init();
  const missB = stereo ? 90 : 180;
  const view = { x: -2.95, y: -2.95, w: 5.9, h: 5.9 };
  const { svg, layers: L } = planeSvg(view, 'Drag the point p around the circle', ['rings', 'circle', 'angles', 'proj', 'marks', 'labels', 'handles']);
  // the graph's vertical axis is squashed by YS so the panel is wider than tall
  const YS = 0.6, gview = { x: -1, y: -2.75, w: 7.9, h: 5.5 };
  const { svg: gsvg, layers: G } = planeSvg(gview, 'Graph of the transition map on the overlap', ['ticks', 'curve', 'marks', 'labels']);
  const panels = h('div', { class: 'cc-panels' }, svg, gsvg);
  const readout = h('div', { class: 'readout' });
  const btns = h('div', { class: 'wbtns' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(p => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      st = { deg: p.angle ?? st.deg, show: p.show ?? st.show }; draw();
    } }, p.label)));
  el.append(panels, readout, btns);

  const handle = s('circle', { r: 0.2, class: 'w-handle gold', tabindex: 0, 'aria-label': 'point p' });
  L.handles.append(handle);
  handle.addEventListener('pointerdown', e => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    const move = ev => {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      const m = pt.matrixTransform(svg.getScreenCTM().inverse());
      let d = Math.atan2(-m.y, m.x) * 180 / Math.PI;
      if (sn) d = Math.round(d / sn) * sn;
      st.deg = ((d % 360) + 360) % 360;
      draw();
    };
    const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); handle.removeEventListener('pointercancel', up); };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  });

  const rad = d => d * Math.PI / 180;
  const at = (d, r = R) => [r * Math.cos(rad(d)), r * Math.sin(rad(d))];
  // counterclockwise arc from d0 to d1 degrees (d1 > d0), radius r
  const arc = (d0, d1, r = R) => {
    const [x0, y0] = P(...at(d0, r)), [x1, y1] = P(...at(d1, r));
    return `M${x0},${y0} A${r},${r} 0 ${d1 - d0 > 180 ? 1 : 0} 0 ${x1},${y1}`;
  };
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  // coordinates of p (null where the chart is undefined)
  const thetaOf = d => (near(d, 0) ? null : rad(d));
  const bOf = d => {
    if (near(d, missB)) return null;
    if (stereo) return Math.cos(rad(d)) / (1 - Math.sin(rad(d)));
    return d < 180 ? rad(d) : rad(d) - 2 * Math.PI;
  };
  const bName = stereo ? '\\sigma' : '\\varphi';
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  // an angle in degrees as a TeX multiple of π (≈ decimal when it isn't nice)
  const piTex = d => {
    if (near(d, 0)) return '0';
    if (Math.abs(d - Math.round(d)) > 1e-9 || Math.round(d) % 15) return fmt(rad(d));
    const n = Math.abs(Math.round(d)), g = gcd(n, 180), num = n / g, den = 180 / g;
    const top = num === 1 ? '\\pi' : `${num}\\pi`;
    return `${d < 0 ? '-' : ''}${den === 1 ? top : `\\dfrac{${top}}{${den}}`}`;
  };
  const angTex = d => { const t = piTex(d); return t.includes('pi') ? `${t} \\approx ${fmt(rad(d))}` : t; };

  // the transition map's graph: B's coordinate against θ ∈ (0, 2π)
  function drawGraph() {
    for (const k of ['ticks', 'curve', 'marks', 'labels']) G[k].replaceChildren();
    const TP = 2 * Math.PI;
    for (const [x, t] of [[Math.PI, 'π'], [TP, '2π']]) {
      G.ticks.append(line([x, -0.12], [x, 0.12], 'w-axis'));
      G.labels.append(label([x, -0.45], t));
    }
    G.labels.append(label([TP + 0.45, 0.35], 'θ'));
    G.labels.append(label([-0.5, gview.y + gview.h - 0.35], stereo ? 'σ' : 'φ', 'covec'));
    if (!stereo) for (const [y, t] of [[Math.PI, 'π'], [-Math.PI, '−π']]) {
      G.ticks.append(line([-0.12, YS * y], [0.12, YS * y], 'w-axis'));
      G.labels.append(label([-0.55, YS * y], t));
    }
    // pieces of the overlap, in θ (open intervals)
    const pieces = stereo ? [[0, Math.PI / 2], [Math.PI / 2, TP]] : [[0, Math.PI], [Math.PI, TP]];
    const f = th => bOf(th * 180 / Math.PI);
    for (const [u, v] of pieces) {
      const pts = [];
      for (let k = 1; k < 400; k++) {
        const th = u + (v - u) * k / 400, y = f(th);
        if (Math.abs(y) < 30) pts.push(P(th, YS * y).join(','));
      }
      G.curve.append(s('polyline', { points: pts.join(' '), class: 'w-graph on cc' }));
      for (const th of [u, v]) {
        const y = stereo && near(th, Math.PI / 2) ? null : th === u ? f(th + 1e-9) : f(th - 1e-9);
        if (y == null) continue;
        const [cx, cy] = P(th, YS * y);
        G.marks.append(s('circle', { cx, cy, r: 0.11, class: 'w-end cc' }));
      }
    }
    if (stereo) G.ticks.append(line([Math.PI / 2, gview.y], [Math.PI / 2, gview.y + gview.h], 'w-edge cc-asym'));
    const th = thetaOf(st.deg), y = bOf(st.deg);
    if (th != null && y != null && Math.abs(YS * y) < gview.h / 2) {
      const [cx, cy] = P(th, YS * y);
      G.marks.append(s('circle', { cx, cy, r: 0.17, class: 'w-handle gold' }));
    }
  }

  function draw() {
    for (const k of ['rings', 'circle', 'angles', 'proj', 'marks', 'labels']) L[k].replaceChildren();
    const showA = st.show !== 'B', showB = st.show !== 'A', both = showA && showB;
    gsvg.style.display = both ? '' : 'none';
    panels.classList.toggle('single', !both);
    const d = st.deg, p = at(d);
    // domains: A outside the circle, B inside; hollow dots at the missing points
    L.circle.append(s('circle', { cx: 0, cy: 0, r: R, class: 'w-graph' }));
    const gap = 4;
    if (showA) L.rings.append(s('path', { d: arc(gap, 360 - gap, R + 0.28), class: 'cc-ring a' }));
    if (showB) L.rings.append(s('path', { d: arc(missB + gap, missB + 360 - gap, R - 0.28), class: 'cc-ring b' }));
    if (both) for (const [u, v] of stereo ? [[0, 90], [90, 360]] : [[0, 180], [180, 360]])
      L.circle.append(s('path', { d: arc(u + gap, v - gap), class: 'w-region-arc' }));
    if (showA) { const [cx, cy] = P(...at(0)); L.marks.append(s('circle', { cx, cy, r: 0.13, class: 'w-end cc-miss a' })); }
    if (showB) { const [cx, cy] = P(...at(missB)); L.marks.append(s('circle', { cx, cy, r: 0.13, class: 'w-end cc-miss b' })); }
    if (showA) L.labels.append(label(at(225, R + 0.75), 'θ', 'vec'));
    if (showB) L.labels.append(label(at(stereo ? 225 : 315, R - 0.75), stereo ? 'σ' : 'φ', 'covec'));
    if (both && !stereo) {
      L.labels.append(label(at(90, R + 0.62), 'upper', 'gold small'));
      L.labels.append(label(at(270, R + 0.62), 'lower', 'gold small'));
    }
    // how each chart reads p: angles from (1,0), or the projection from N
    L.angles.append(line([0, 0], [R, 0], 'w-axis'), line([0, 0], p, 'w-axis'));
    const th = thetaOf(d), b = bOf(d);
    if (showA && th != null) L.angles.append(s('path', { d: arc(0, d, 0.55), class: 'cc-angle a' }));
    if (showB && b != null && !stereo) {
      const [d0, d1] = b >= 0 ? [0, d] : [d, 360];
      L.angles.append(s('path', { d: arc(d0, d1, 0.85), class: 'cc-angle b' }));
    }
    if (showB && stereo) {
      L.proj.append(line([-3, 0], [3, 0], 'cc-line'));
      if (b != null) {
        const far = Math.abs(b) > 40 ? Math.sign(b) * 40 : b;
        L.proj.append(line([0, R], [R * far, 0], 'cc-ray'));
        const [cx, cy] = P(R * b, 0);
        if (Math.abs(R * b) < 2.9) L.marks.append(s('circle', { cx, cy, r: 0.12, class: 'cc-hit' }));
      }
    }
    L.labels.append(label([p[0] * 1.3 + (p[0] >= 0 ? 0.25 : -0.25), p[1] * 1.3], 'p', 'gold'));
    placeHandle(handle, p);
    if (both) drawGraph();

    const [x, y] = [Math.cos(rad(d)), Math.sin(rad(d))];
    const rows = [h('div', { class: 'wide', html: tex(`p = (${fmt(x)}, ${fmt(y)})`) })];
    if (showA) rows.push(h('div', { class: 'c-vec', html: th == null
      ? mdInline('$\\theta(p)$ undefined: $p = (1,0) \\notin \\mathcal{U}$')
      : tex(`\\theta(p) = ${angTex(d)}`) }));
    if (showB) rows.push(h('div', { class: 'c-covec', html: b == null
      ? mdInline(`$${bName}(p)$ undefined: $p = ${stereo ? '(0,1)' : '(-1,0)'} \\notin \\mathcal{V}$`)
      : tex(stereo ? `\\sigma(p) = \\dfrac{x}{1-y} = ${fmt(b)}` : `\\varphi(p) = ${angTex(b * 180 / Math.PI)}`) }));
    if (both) {
      let msg;
      if (th == null || b == null) msg = `$p \\notin \\mathcal{U} \\cap \\mathcal{V}$: only one chart covers $p$, so there is nothing to translate.`;
      else if (stereo) msg = `$p \\in \\mathcal{U} \\cap \\mathcal{V}$: $\\sigma = \\dfrac{\\cos\\theta}{1-\\sin\\theta} = ${fmt(b)}$`;
      else if (d < 180) msg = `$p$ in the upper piece: $\\varphi = \\theta = ${piTex(d)}$`;
      else msg = `$p$ in the lower piece: $\\varphi = \\theta - 2\\pi = ${piTex(d - 360)}$`;
      rows.push(h('div', { class: `wide${th == null || b == null ? ' warn' : ''}`, html: mdInline(msg) }));
    }
    readout.replaceChildren(...rows);
  }
  draw();
}
