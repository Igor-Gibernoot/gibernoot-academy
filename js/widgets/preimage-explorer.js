// preimage-explorer
//
// Continuity via preimages. The graph of a map f: ℝ → ℝ; the reader drags the
// two ends of an open interval V on the vertical axis. The inputs x with
// f(x) ∈ V, the preimage, are marked on the horizontal axis: a filled end dot
// means the end belongs to the preimage. The readout writes the preimage and
// says whether it is open (a filled end dot is a point with no room).
//
// config:
//   fn:      linear (2x + 1) | step (H, jump at 0) | square (x²) | const (1)
//   V:       [0.5, 1.5]   ends of the open interval V (a < b)
//   view:    { x, y, w, h }  (model units; default { x: -3, y: -1.5, w: 6, h: 4.5 })
//   snap:    grid for the ends of V (default 0.1)
//   presets: [{label, fn, V}]   (fn, V optional)

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { P, fmt, label, line, placeHandle, planeSvg, s } from './plane.js';
import { EPS } from './ball-probe.js';

const FUNCS = {
  linear: { name: 'f', rule: '$f(x) = 2x + 1$', f: x => 2 * x + 1, jumps: [] },
  step: { name: 'H', rule: '$H(x) = 0$ for $x < 0$, and $H(x) = 1$ for $x \\ge 0$', f: x => (x < 0 ? 0 : 1), jumps: [0] },
  square: { name: 'f', rule: '$f(x) = x^2$', f: x => x * x, jumps: [] },
  const: { name: 'c', rule: '$c(x) = 1$ for every $x$', f: () => 1, jumps: [] },
};

export function preimageExplorer(el, cfg) {
  const view = cfg.view ?? { x: -3, y: -1.5, w: 6, h: 4.5 };
  const init = () => ({ fn: cfg.fn ?? 'linear', V: [...(cfg.V ?? [0.5, 1.5])] });
  let st = init();
  const sn = cfg.snap ?? 0.1;
  const { svg, layers: L } = planeSvg(view, 'Drag the ends of the interval V on the vertical axis', ['band', 'graph', 'pre', 'marks', 'labels', 'handles']);
  const readout = h('div', { class: 'readout' });
  const btns = h('div', { class: 'wbtns' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(p => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      st = { fn: p.fn ?? st.fn, V: p.V ? [...p.V] : st.V }; draw();
    } }, p.label)));
  el.append(svg, readout, btns);

  const ends = [0, 1].map(k => {
    const c = s('circle', { r: 0.17, class: 'w-handle gold', tabindex: 0, 'aria-label': k ? 'upper end of V' : 'lower end of V' });
    L.handles.append(c);
    c.addEventListener('pointerdown', e => {
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      const move = ev => {
        const pt = svg.createSVGPoint();
        pt.x = ev.clientX; pt.y = ev.clientY;
        const y = -pt.matrixTransform(svg.getScreenCTM().inverse()).y;
        let v = Math.round(y / sn) * sn;
        v = Math.max(view.y + 0.1, Math.min(view.y + view.h - 0.1, v));
        st.V[k] = k ? Math.max(v, st.V[0] + sn) : Math.min(v, st.V[1] - sn);
        draw();
      };
      const up = () => { c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up); };
      c.addEventListener('pointermove', move);
      c.addEventListener('pointerup', up);
      c.addEventListener('pointercancel', up);
    });
    return c;
  });

  // The preimage {x | a < f(x) < b} on the visible range, as intervals
  // [lo, hi, loClosed, hiClosed]; an end at the edge of the view is ±∞.
  function preimage(F, [a, b]) {
    const x0 = view.x, x1 = view.x + view.w, n = 1200;
    const xs = [];
    for (let k = 0; k <= n; k++) {
      const x = x0 + (x1 - x0) * k / n;
      xs.push(F.jumps.find(j => Math.abs(x - j) < EPS) ?? x);   // jumps sampled exactly
    }
    for (const j of F.jumps) if (!xs.includes(j)) xs.push(j);
    xs.sort((u, v) => u - v);
    const inV = x => { const y = F.f(x); return y > a && y < b; };
    const isJump = x => F.jumps.some(j => Math.abs(x - j) < EPS);
    // boundary between xs[k] and xs[k+1]: at a jump point exactly, else bisect
    const cut = (u, v) => {
      if (isJump(u)) return [u, inV(u)];
      if (isJump(v)) return [v, inV(v)];
      const iu = inV(u);
      for (let t = 0; t < 40; t++) { const m = (u + v) / 2; if (inV(m) === iu) u = m; else v = m; }
      return [(u + v) / 2, false];
    };
    const out = [];
    let cur = inV(xs[0]) ? [-Infinity, null, false, false] : null;
    for (let k = 0; k + 1 < xs.length; k++) {
      const iu = inV(xs[k]), iv = inV(xs[k + 1]);
      if (iu === iv) continue;
      const [x, closed] = cut(xs[k], xs[k + 1]);
      if (iv) cur = [x, null, closed, false];
      else { cur[1] = x; cur[3] = closed; out.push(cur); cur = null; }
    }
    if (cur) { cur[1] = Infinity; out.push(cur); }
    return out;
  }

  function draw() {
    for (const k of ['band', 'graph', 'pre', 'marks', 'labels']) L[k].replaceChildren();
    const F = FUNCS[st.fn] ?? FUNCS.linear, [a, b] = st.V;
    const x0 = view.x, x1 = view.x + view.w;
    // V: a band across the plane, solid on the vertical axis, ends excluded
    const [rx, ry] = P(x0, b);
    L.band.append(s('rect', { x: rx, y: ry, width: view.w, height: b - a, class: 'w-region' }));
    for (const y of [a, b]) L.band.append(line([x0, y], [x1, y], 'w-edge'));
    L.band.append(line([0, a], [0, b], 'w-region-line'));
    // the graph, broken at the jumps, highlighted where f(x) ∈ V
    const cuts = [x0, ...F.jumps.filter(j => j > x0 && j < x1), x1];
    for (let k = 0; k + 1 < cuts.length; k++) {
      const pts = [];
      for (let t = 0; t <= 300; t++) {
        let x = cuts[k] + (cuts[k + 1] - cuts[k]) * t / 300;
        if (t === 300 && k + 1 < cuts.length - 1) x -= 1e-7;
        pts.push([x, F.f(x)]);
      }
      L.graph.append(s('polyline', { points: pts.map(p => P(...p).join(',')).join(' '), class: 'w-graph' }));
    }
    const pre = preimage(F, st.V);
    for (const [lo, hi] of pre) {
      const u = Math.max(lo, x0), v = Math.min(hi, x1), pts = [];
      for (let t = 0; t <= 200; t++) { const x = u + (v - u) * t / 200; pts.push([x, F.f(x)]); }
      L.graph.append(s('polyline', { points: pts.map(p => P(...p).join(',')).join(' '), class: 'w-graph on' }));
      L.pre.append(line([u, 0], [v, 0], 'w-ball-line'));
    }
    for (const j of F.jumps) {
      const yl = F.f(j - 1e-7), y = F.f(j);
      if (Math.abs(yl - y) > EPS) {
        const [cx, cy] = P(j, yl);
        L.marks.append(s('circle', { cx, cy, r: 0.08, class: 'w-end graph' }));
        const [dx, dy] = P(j, y);
        L.marks.append(s('circle', { cx: dx, cy: dy, r: 0.08, class: 'w-end graph closed' }));
      }
    }
    for (const [lo, hi, cl, ch] of pre) {
      if (lo > x0) { const [cx, cy] = P(lo, 0); L.marks.append(s('circle', { cx, cy, r: 0.09, class: `w-end ball ${cl ? 'closed' : ''}` })); }
      if (hi < x1) { const [cx, cy] = P(hi, 0); L.marks.append(s('circle', { cx, cy, r: 0.09, class: `w-end ball ${ch ? 'closed' : ''}` })); }
    }
    L.labels.append(label([0.35, (a + b) / 2], 'V', 'gold'));
    ends.forEach((c, k) => placeHandle(c, [0, st.V[k]]));

    const num = x => (x === -Infinity ? '-\\infty' : x === Infinity ? '\\infty' : fmt(x));
    const itv = ([lo, hi, cl, ch]) => `${cl ? '[' : '('}${num(lo)}, ${num(hi)}${ch ? ']' : ')'}`;
    const preTex = pre.length ? pre.map(itv).join('\\cup ') : '\\emptyset';
    const bad = pre.flatMap(([lo, hi, cl, ch]) => [cl ? lo : null, ch ? hi : null]).filter(x => x != null);
    readout.replaceChildren(
      h('div', { class: 'wide', html: mdInline(F.rule) }),
      h('div', { class: 'wide', html: tex(`\\mathcal{V} = (${fmt(a)}, ${fmt(b)})`) }),
      h('div', { class: 'wide', html: tex(`\\mathrm{preim}_${F.name}(\\mathcal{V}) = ${preTex}`) }),
      h('div', { class: `wide ${bad.length ? 'warn' : 'ok'}`, html: mdInline(bad.length
        ? `Not open: $${fmt(bad[0])}$ belongs to the preimage, but every ball around it contains points that do not.`
        : 'Open: every point of the preimage has a ball around it inside the preimage.') }));
  }
  draw();
}
