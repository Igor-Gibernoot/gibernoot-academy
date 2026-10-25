// Interactive widgets, referenced from lesson YAML by name:
//   - type: widget
//     widget: basis-playground
//     config: { ... }

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { torusFigure } from './torus.js';
import { sphereFigure } from './sphere.js';

const WIDGETS = {
  'basis-playground': basisPlayground,
  'machine-playground': machinePlayground,
  'map-builder': mapBuilder,
  'ball-probe': ballProbe,
  'preimage-explorer': preimageExplorer,
  'circle-charts': circleCharts,
  'curve-velocity': curveVelocity,
  'chart-basis': chartBasis,
  'parallel-transport': parallelTransport,
  'time-slices': timeSlices,
  'rotating-grid': rotatingGrid,
  'falling-cloud': fallingCloud,
  'light-cones': lightCones,
  'worldline-clock': worldlineClock,
  'observer-frame': observerFrame,
  'area-cell': areaCell,
  torus: torusFigure,
  sphere: sphereFigure,
};

export function mountWidget(name, el, config) {
  const w = WIDGETS[name];
  if (!w) { el.textContent = `Unknown widget "${name}".`; return; }
  w(el, config);
}

const NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

const fmt = x => (Math.abs(x) < 5e-3 ? '0' : String(Math.round(x * 100) / 100));

// "a x̂1 + b x̂2" in TeX, with the sign folded into the operator.
const combo = (name, [a, b], basis = '\\hat{x}') =>
  `${name} = ${fmt(a)}\\,${basis}_1 ${b < 0 && fmt(b) !== '0' ? '-' : '+'} ${fmt(Math.abs(b))}\\,${basis}_2`;
const dualCombo = (name, [a, b]) =>
  `${name} = ${fmt(a)}\\,\\hat{\\mathfrak{x}}^1 ${b < 0 ? '-' : '+'} ${fmt(Math.abs(b))}\\,\\hat{\\mathfrak{x}}^2`;

// ---------------------------------------------------------------------------
// Plane drawing helpers shared by the planar widgets (math y points up).
// ---------------------------------------------------------------------------
const P = (x, y) => [x, -y];

function line(a, b, cls) {
  const [x1, y1] = P(...a), [x2, y2] = P(...b);
  return s('line', { x1, y1, x2, y2, class: cls });
}
function arrow(a, b, cls, head = 0.28) {
  const g = s('g', { class: cls });
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  if (L < 1e-6) return g;
  const ux = dx / L, uy = dy / L, hl = Math.min(head, L * 0.45), hw = hl * 0.55;
  const base = [b[0] - ux * hl, b[1] - uy * hl];
  g.append(line(a, base, ''));
  const pts = [b, [base[0] - uy * hw, base[1] + ux * hw], [base[0] + uy * hw, base[1] - ux * hw]]
    .map(p => P(...p).join(',')).join(' ');
  g.append(s('polygon', { points: pts, style: 'stroke-dasharray:none' }));
  return g;
}
function label(p, text, cls = '') {
  const [x, y] = P(...p);
  const t = s('text', { x, y, class: `w-label ${cls}`, 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
  t.textContent = text;
  return t;
}
// Label placed just beyond the tip of the arrow from the origin to b.
function tipLabel(b, text, cls = '') {
  const L = Math.hypot(...b) || 1;
  return label([b[0] + 0.42 * b[0] / L - 0.25 * b[1] / L, b[1] + 0.42 * b[1] / L + 0.25 * b[0] / L], text, cls);
}
// Level lines C(p) = n of a covector with components C in the old dual basis.
function levelLines(C, cls = 'w-level') {
  const g = s('g');
  const n2 = C[0] ** 2 + C[1] ** 2;
  if (n2 < 1e-12) return g;
  const L = Math.sqrt(n2), d = [-C[1] / L, C[0] / L];
  for (let n = -15; n <= 15; n++) {
    const p0 = [n * C[0] / n2, n * C[1] / n2];
    g.append(line([p0[0] - 30 * d[0], p0[1] - 30 * d[1]], [p0[0] + 30 * d[0], p0[1] + 30 * d[1]], cls));
  }
  return g;
}

let clipCount = 0;
function planeSvg(view, ariaLabel, layerNames) {
  const svg = s('svg', { viewBox: `${view.x} ${-(view.y + view.h)} ${view.w} ${view.h}`, role: 'img', 'aria-label': ariaLabel });
  // When the svg is wider than its viewBox (height capped by CSS), long lines
  // would show outside the plane: clip the drawing layers to it.
  const clipId = `plane-clip-${++clipCount}`;
  const clip = s('clipPath', { id: clipId });
  clip.append(s('rect', { x: view.x, y: -(view.y + view.h), width: view.w, height: view.h }));
  svg.append(clip);
  const free = ['labels', 'handles'];
  const layers = ['grid', ...layerNames].reduce((o, k) => {
    o[k] = s('g', free.includes(k) ? {} : { 'clip-path': `url(#${clipId})` });
    svg.append(o[k]);
    return o;
  }, {});
  for (let k = Math.ceil(view.x); k <= view.x + view.w; k++)
    layers.grid.append(line([k, view.y], [k, view.y + view.h], k === 0 ? 'w-axis' : 'w-grid'));
  for (let k = Math.ceil(view.y); k <= view.y + view.h; k++)
    layers.grid.append(line([view.x, k], [view.x + view.w, k], k === 0 ? 'w-axis' : 'w-grid'));
  return { svg, layers };
}

// A draggable circle: calls onMove([x, y]) with the snapped, clamped tip.
function draggable(svg, view, c, snap, onMove) {
  c.addEventListener('pointerdown', e => {
    e.preventDefault();
    c.setPointerCapture(e.pointerId);
    const move = ev => {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      const m = pt.matrixTransform(svg.getScreenCTM().inverse());
      let v = [m.x, -m.y];
      if (snap) v = v.map(t => Math.round(t / snap) * snap);
      v = [Math.max(view.x + 0.2, Math.min(view.x + view.w - 0.2, v[0])),
           Math.max(view.y + 0.2, Math.min(view.y + view.h - 0.2, v[1]))];
      if (Math.hypot(...v) < 0.25) return;
      onMove(v);
    };
    const up = () => { c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up); };
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
  });
}
function placeHandle(c, b) {
  const [cx, cy] = P(...b);
  c.setAttribute('cx', cx);
  c.setAttribute('cy', cy);
}

// ---------------------------------------------------------------------------
// basis-playground
//
// A fixed vector X (and optionally a fixed covector, drawn as its level
// lines X(p) = n) in the plane. The reader drags the new basis vectors
// ŷ1, ŷ2 and watches the components change: vector components move against
// the basis, covector components with it, and their pairing never changes.
//
// config:
//   vector:   [3, 2]          X in the old basis x̂ (standard coordinates)
//   covector: [1, 0.5] | null components of the covector in the old dual basis
//   dual:     1 | 2 | null    draw the level lines of that dual basis covector
//                             ŷ^k and show it in the old dual basis
//   basis:    [[1,0],[0,1]]   initial ŷ1, ŷ2 in the old basis
//   snap:     0.5             grid the handles snap to (0 = free)
//   presets:  [{label, basis}]
// ---------------------------------------------------------------------------
function basisPlayground(el, cfg) {
  const X = cfg.vector ?? [3, 2];
  const C = cfg.covector ?? null;
  const dual = cfg.dual ?? null;
  const start = (cfg.basis ?? [[1, 0], [0, 1]]).map(v => [...v]);
  const snap = cfg.snap ?? 0.5;
  const presets = cfg.presets ?? [];
  let B = start.map(v => [...v]);

  const view = { x: -2.5, y: -2.5, w: 8, h: 7 };
  const { svg, layers } = planeSvg(view, 'Drag the tips of the basis vectors',
    ['lattice', 'levels', 'parts', 'vec', 'basis', 'labels', 'handles']);

  const handles = B.map((_, k) => {
    const c = s('circle', { r: 0.22, class: 'w-handle', tabindex: 0, 'aria-label': `tip of basis vector ${k + 1}` });
    layers.handles.append(c);
    draggable(svg, view, c, snap, v => { B[k] = v; draw(); });
    return c;
  });

  const readout = h('div', { class: 'readout' });
  const btns = h('div', { class: 'wbtns' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { B = start.map(v => [...v]); draw(); } }, 'Reset'),
    presets.map(p => h('button', { class: 'btn ghost', type: 'button', onclick: () => { B = p.basis.map(v => [...v]); draw(); } }, p.label)));
  el.append(svg, readout, btns);

  function draw() {
    for (const k of ['lattice', 'levels', 'parts', 'vec', 'basis', 'labels']) layers[k].replaceChildren();
    const [b1, b2] = B;
    const det = b1[0] * b2[1] - b2[0] * b1[1];
    const ok = Math.abs(det) > 1e-9;
    const y1 = ok ? (X[0] * b2[1] - X[1] * b2[0]) / det : NaN;
    const y2 = ok ? (b1[0] * X[1] - b1[1] * X[0]) / det : NaN;
    // dual basis ŷ^1, ŷ^2 in the old dual basis: the rows of the inverse basis matrix
    const D = ok ? [[b2[1] / det, -b2[0] / det], [-b1[1] / det, b1[0] / det]] : null;

    // lattice of the new basis
    if (ok && Math.abs(det) > 0.05) {
      for (let k = -10; k <= 10; k++) {
        layers.lattice.append(line([k * b1[0] - 30 * b2[0], k * b1[1] - 30 * b2[1]], [k * b1[0] + 30 * b2[0], k * b1[1] + 30 * b2[1]], 'w-lattice'));
        layers.lattice.append(line([k * b2[0] - 30 * b1[0], k * b2[1] - 30 * b1[1]], [k * b2[0] + 30 * b1[0], k * b2[1] + 30 * b1[1]], 'w-lattice'));
      }
    }
    if (C) layers.levels.append(levelLines(C));
    if (dual && D && Math.abs(det) > 0.05) layers.levels.append(levelLines(D[dual - 1]));
    // decomposition X = y1 ŷ1 + y2 ŷ2
    if (ok && Math.abs(y1) < 40 && Math.abs(y2) < 40) {
      const mid = [y1 * b1[0], y1 * b1[1]];
      layers.parts.append(arrow([0, 0], mid, 'w-part'), arrow(mid, X, 'w-part'));
    }
    layers.vec.append(arrow([0, 0], X, 'w-vec'));
    layers.labels.append(label([X[0] + 0.3, X[1] + 0.3], '𝒳'));
    B.forEach((b, k) => {
      layers.basis.append(arrow([0, 0], b, 'w-basis'));
      layers.labels.append(tipLabel(b, k ? 'ŷ₂' : 'ŷ₁', 'basis'));
      placeHandle(handles[k], b);
    });

    const rows = [
      h('div', { class: 'c-basis', html: tex(combo('\\hat{y}_1', b1)) }),
      h('div', { class: 'c-basis', html: tex(combo('\\hat{y}_2', b2)) }),
    ];
    if (!ok) {
      rows.push(h('div', { class: 'wide warn' }, 'ŷ₁ and ŷ₂ are parallel: they are not a basis, and the components of 𝒳 do not exist.'));
    } else {
      rows.push(
        h('div', { class: 'c-vec', html: tex(`y^1 = ${fmt(y1)}`) }),
        h('div', { class: 'c-vec', html: tex(`y^2 = ${fmt(y2)}`) }));
      if (dual) {
        rows.push(h('div', { class: 'wide c-covec', html: tex(dualCombo(`\\hat{\\mathfrak{y}}^${dual}`, D[dual - 1])) }));
      }
      if (C) {
        const c1 = C[0] * b1[0] + C[1] * b1[1], c2 = C[0] * b2[0] + C[1] * b2[1];
        rows.push(
          h('div', { class: 'c-covec', html: tex(`\\mathtt{y}_1 = \\mathsf{X}(\\hat{y}_1) = ${fmt(c1)}`) }),
          h('div', { class: 'c-covec', html: tex(`\\mathtt{y}_2 = \\mathsf{X}(\\hat{y}_2) = ${fmt(c2)}`) }),
          h('div', { class: 'wide', html: tex(`\\textstyle\\sum_i \\mathtt{y}_i\\, y^i = ${fmt(c1 * y1 + c2 * y2)}`) }));
      }
    }
    readout.replaceChildren(...rows);
  }
  draw();
}

// ---------------------------------------------------------------------------
// machine-playground
//
// A tensor as a machine with slots. The reader drags the input vectors and
// watches the output number.
//
//   slots: 1  a covector X (drawn as its level lines X(p) = n) eats one
//             vector 𝒳; the readout shows X(𝒳).
//   slots: 2  a (0,2)-tensor T(𝒳, 𝒴) = Σ T_ij x^i y^j eats two vectors.
//             area: true    shades the parallelogram spanned by 𝒳 and 𝒴
//             partial: true draws the covector T(𝒳, ·) as level lines and
//                           shows its components (fill one slot, get a covector)
//
// config:
//   covector: [1, 0.5]            (slots 1) X(𝒳) = 1 x^1 + 0.5 x^2
//   name:     'X'                 the covector's letter (slots 1, sans-serif)
//                                 or the tensor's letter (slots 2, default T)
//   tensor:   [[0,1],[-1,0]]      (slots 2) components T_ij, row i = first slot
//   u: [2, 1], v: [0, 2]          initial inputs, in the basis x̂
//   snap: 0.5
//   presets: [{label, u, v, tensor}]  (slots 2) a preset's tensor replaces T;
//                                 Reset restores the configured one
// ---------------------------------------------------------------------------
function machinePlayground(el, cfg) {
  const slots = cfg.slots ?? 1;
  const C = cfg.covector ?? [1, 0.5];
  const T0 = cfg.tensor ?? [[0, 1], [-1, 0]];
  let T = T0;
  const snap = cfg.snap ?? 0.5;
  const presets = cfg.presets ?? [];
  const start = [cfg.u ?? [2, 1], cfg.v ?? [0, 2]].slice(0, slots).map(v => [...v]);
  let U = start.map(v => [...v]);

  const view = { x: -3.5, y: -3, w: 8, h: 7 };
  const { svg, layers } = planeSvg(view, 'Drag the tips of the input vectors',
    ['area', 'levels', 'vec', 'labels', 'handles']);
  const names = ['𝒳', '𝒴'];

  const handles = U.map((_, k) => {
    const c = s('circle', { r: 0.22, class: 'w-handle vec', tabindex: 0, 'aria-label': `tip of input vector ${k + 1}` });
    layers.handles.append(c);
    draggable(svg, view, c, snap, v => { U[k] = v; draw(); });
    return c;
  });

  const readout = h('div', { class: 'readout' });
  const set = (arr, t) => { U = arr.slice(0, slots).map(v => [...v]); if (t) T = t; draw(); };
  const btns = h('div', { class: 'wbtns' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => set(start, T0) }, 'Reset'),
    h('button', { class: 'btn ghost', type: 'button', onclick: () => set([[2 * U[0][0], 2 * U[0][1]], ...U.slice(1)]) }, 'Double 𝒳'),
    slots === 2 && h('button', { class: 'btn ghost', type: 'button', onclick: () => set(U.map(v => [2 * v[0], 2 * v[1]])) }, 'Double both'),
    presets.map(p => h('button', { class: 'btn ghost', type: 'button', onclick: () => set([p.u ?? U[0], p.v ?? U[1]].filter(Boolean), p.tensor) }, p.label)));
  el.append(svg, readout, btns);

  const vecTex = (n, [a, b]) => `${n} = (${fmt(a)},\\ ${fmt(b)})`;
  const cname = `\\mathsf{${cfg.name ?? 'X'}}`;
  const tname = cfg.name ?? 'T';

  function draw() {
    for (const k of ['area', 'levels', 'vec', 'labels']) layers[k].replaceChildren();
    const [u, v] = U;
    const rows = [h('div', { class: 'c-vec', html: tex(vecTex('\\mathcal{X}', u)) })];

    if (slots === 1) {
      layers.levels.append(levelLines(C));
      const val = C[0] * u[0] + C[1] * u[1];
      const term = (c, x) => `${fmt(c)}\\cdot ${x < 0 ? `(${fmt(x)})` : fmt(x)}`;
      rows.push(
        h('div', { class: 'c-covec', html: tex(`${cname}(\\mathcal{X}) = ${fmt(C[0])}\\,x^1 ${C[1] < 0 ? '-' : '+'} ${fmt(Math.abs(C[1]))}\\,x^2`) }),
        h('div', { class: 'wide', html: tex(`${cname}(\\mathcal{X}) = ${term(C[0], u[0])} + ${term(C[1], u[1])} = ${fmt(val)}`) }));
    } else {
      if (cfg.area) {
        const pts = [[0, 0], u, [u[0] + v[0], u[1] + v[1]], v].map(p => P(...p).join(',')).join(' ');
        layers.area.append(s('polygon', { points: pts, class: 'w-area' }));
      }
      // T(𝒳, ·): fill the first slot, get a covector with components Σ_i T_ij x^i
      const part = [T[0][0] * u[0] + T[1][0] * u[1], T[0][1] * u[0] + T[1][1] * u[1]];
      const val = part[0] * v[0] + part[1] * v[1];
      if (cfg.partial) layers.levels.append(levelLines(part));
      rows.push(h('div', { class: 'c-vec', html: tex(vecTex('\\mathcal{Y}', v)) }));
      if (cfg.partial) rows.push(h('div', { class: 'wide c-covec', html: tex(dualCombo(`${tname}(\\mathcal{X},\\,\\cdot\\,)`, part)) }));
      rows.push(h('div', { class: 'wide', html: tex(`${tname}(\\mathcal{X}, \\mathcal{Y}) = ${fmt(val)}`) }));
    }

    U.forEach((b, k) => {
      layers.vec.append(arrow([0, 0], b, 'w-uvec'));
      layers.labels.append(tipLabel(b, names[k], 'vec'));
      placeHandle(handles[k], b);
    });
    readout.replaceChildren(...rows);
  }
  draw();
}

// ---------------------------------------------------------------------------
// map-builder
//
// Two finite sets, the domain on the left and the target on the right. Every
// element of the domain has exactly one arrow (that is what makes it a map).
// Tapping a domain element moves its arrow to the next target element. The
// readout says whether the map is injective, surjective, bijective, and why.
//
// config:
//   domain:  ['a', 'b', 'c']
//   target:  ['1', '2', '3']
//   map:     [0, 0, 1]          index of the image of each domain element
//   presets: [{label, domain, target, map}]
// ---------------------------------------------------------------------------
function mapBuilder(el, cfg) {
  const init = () => ({
    dom: [...(cfg.domain ?? ['a', 'b', 'c'])],
    tgt: [...(cfg.target ?? ['1', '2', '3'])],
    map: [...(cfg.map ?? [0, 0, 1])],
  });
  let st = init();
  const presets = cfg.presets ?? [];

  const svg = s('svg', { role: 'img', 'aria-label': 'Tap an element on the left to change where it goes' });
  const readout = h('div', { class: 'readout' });
  const btns = h('div', { class: 'wbtns' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset'),
    presets.map(p => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      st = { dom: [...p.domain], tgt: [...p.target], map: [...(p.map ?? p.domain.map(() => 0))] }; draw();
    } }, p.label)));
  el.append(svg, readout, btns);

  function draw() {
    const { dom, tgt, map } = st;
    const rowsN = Math.max(dom.length, tgt.length);
    const W = 12, H = rowsN * 1.6 + 1.6, xl = 3.2, xr = 8.8;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.replaceChildren();
    const yAt = (k, n) => 1.4 + (k + 0.5) * (H - 1.6) / n;
    const hits = tgt.map((_, j) => map.filter(m => m === j).length);

    // set outlines and names
    for (const [x, n, name] of [[xl, dom.length, 'ℳ'], [xr, tgt.length, '𝒩']]) {
      svg.append(s('rect', { x: x - 1.1, y: 1.0, width: 2.2, height: H - 1.25, rx: 1.1, class: 'w-set' }));
      const t = s('text', { x, y: 0.5, class: 'w-setname', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
      t.textContent = name;
      svg.append(t);
    }
    // arrows
    map.forEach((j, i) => {
      const a = [xl + 0.3, yAt(i, dom.length)], b = [xr - 0.3, yAt(j, tgt.length)];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      const base = [b[0] - ux * 0.3, b[1] - uy * 0.3];
      const g = s('g', { class: `w-maparrow${hits[j] > 1 ? ' clash' : ''}` });
      g.append(s('line', { x1: a[0], y1: a[1], x2: base[0], y2: base[1] }));
      g.append(s('polygon', { points: [b, [base[0] - uy * 0.16, base[1] + ux * 0.16], [base[0] + uy * 0.16, base[1] - ux * 0.16]].map(p => p.join(',')).join(' ') }));
      svg.append(g);
    });
    // elements
    dom.forEach((name, i) => {
      const g = s('g', { class: 'w-elem dom', tabindex: 0, role: 'button', 'aria-label': `${name}: tap to change its image` });
      g.append(s('circle', { cx: xl, cy: yAt(i, dom.length), r: 0.42 }));
      const t = s('text', { x: xl, y: yAt(i, dom.length), 'text-anchor': 'middle', 'dominant-baseline': 'central' });
      t.textContent = name;
      g.append(t);
      const bump = () => { st.map[i] = (st.map[i] + 1) % tgt.length; draw(); };
      g.addEventListener('click', bump);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bump(); } });
      svg.append(g);
    });
    tgt.forEach((name, j) => {
      const g = s('g', { class: `w-elem tgt${hits[j] === 0 ? ' missed' : ''}${hits[j] > 1 ? ' clash' : ''}` });
      g.append(s('circle', { cx: xr, cy: yAt(j, tgt.length), r: 0.42 }));
      const t = s('text', { x: xr, y: yAt(j, tgt.length), 'text-anchor': 'middle', 'dominant-baseline': 'central' });
      t.textContent = name;
      g.append(t);
      svg.append(g);
    });

    const clash = tgt.findIndex((_, j) => hits[j] > 1);
    const miss = tgt.findIndex((_, j) => hits[j] === 0);
    const inj = clash < 0, sur = miss < 0;
    const who = j => dom.filter((_, i) => map[i] === j).join(' and ');
    const rows = [
      h('div', { class: `wide ${inj ? 'ok' : 'warn'}` }, inj
        ? 'Injective: no two elements share an image.'
        : `Not injective: ${who(clash)} both go to ${tgt[clash]}.`),
      h('div', { class: `wide ${sur ? 'ok' : 'warn'}` }, sur
        ? 'Surjective: every element of 𝒩 is hit.'
        : `Not surjective: nothing goes to ${tgt[miss]}.`),
      h('div', { class: 'wide' }, inj && sur
        ? `Bijective, so φ⁻¹ exists: ${tgt.map((t, j) => `${t} ↦ ${who(j)}`).join(', ')}.`
        : 'Not bijective, so there is no inverse map.'),
    ];
    readout.replaceChildren(...rows);
  }
  draw();
}

// ---------------------------------------------------------------------------
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
// ---------------------------------------------------------------------------
const EPS = 1e-9;
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

function ballProbe(el, cfg) {
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

// ---------------------------------------------------------------------------
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
// ---------------------------------------------------------------------------
const FUNCS = {
  linear: { name: 'f', rule: '$f(x) = 2x + 1$', f: x => 2 * x + 1, jumps: [] },
  step: { name: 'H', rule: '$H(x) = 0$ for $x < 0$, and $H(x) = 1$ for $x \\ge 0$', f: x => (x < 0 ? 0 : 1), jumps: [0] },
  square: { name: 'f', rule: '$f(x) = x^2$', f: x => x * x, jumps: [] },
  const: { name: 'c', rule: '$c(x) = 1$ for every $x$', f: () => 1, jumps: [] },
};

function preimageExplorer(el, cfg) {
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

// ---------------------------------------------------------------------------
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
// ---------------------------------------------------------------------------
function circleCharts(el, cfg) {
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

// ---------------------------------------------------------------------------
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
// ---------------------------------------------------------------------------
const CV_FIELDS = {
  x: { tex: 'x', name: 'x', f: q => q[0], grad: () => [1, 0] },
  y: { tex: 'y', name: 'y', f: q => q[1], grad: () => [0, 1] },
  x2y: { tex: 'x^2 + y', name: 'x² + y', f: q => q[0] ** 2 + q[1], grad: q => [2 * q[0], 1] },
  theta: { tex: '\\theta', name: 'θ', f: q => { const t = Math.atan2(q[1], q[0]); return t < 0 ? t + 2 * Math.PI : t; },
    grad: q => { const r2 = q[0] ** 2 + q[1] ** 2 || 1; return [-q[1] / r2, q[0] / r2]; } },
};
function curveVelocity(el, cfg) {
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

// ---------------------------------------------------------------------------
// chart-basis
//
// The plane ℝ² with one or two charts drawn as their coordinate lines (first
// chart solid, second dashed), a draggable point p (gold) and the chart-induced
// basis vectors (∂/∂𝒳ⁱ)_p in purple: the velocity at λ = 0 of the coordinate
// curve λ ↦ 𝒳⁻¹(𝒳(p) + λ eᵢ), i.e. column i of (D𝒳)⁻¹. A draggable velocity v
// (blue) at p is the velocity of γ(λ) = p + λ v; the readout gives its
// components (𝒳ⁱ∘γ)'(0) in each chart and the Jacobian (∂𝒴ⁱ/∂𝒳ʲ)_p (row i,
// column j), with "components in 𝒴 = Jacobian · components in 𝒳".
//
// config:
//   charts:    ['X', 'Y']       one or two of cartesian | polar | X | Y, or
//                               { chart: 'polar', name: '\\mathscr{Y}', steps: [0.5, 0.3927], cut: 'left' }
//                               (polar cut: 'right' = θ ∈ (0, 2π), default; 'left' = θ ∈ (−π, π))
//   p:         [1, 1]           the point (anywhere; outside a chart's domain that chart says so)
//   v:         [1, 2]           the velocity, in the standard components of ℝ²
//   basisOnly: false            hide v and the components
//   chain:     false            the law in numbers (components, or the basis
//                               law when basisOnly)
//   inverse:   false            also show the inverse Jacobian (∂𝒳ⁱ/∂𝒴ʲ)_p
//   jacobian:  true             false hides the Jacobian and the component law
//   dragP:     true             p draggable
//   snap:      0.25
//   lines:     8                at most this many coordinate lines on each side of p
//   view:      { x, y, w, h }   default: 5 × 5 centred on p
//   presets:   [{ label, charts, p, v }]
// Where the lines of one coordinate get closer than ~0.14 view units, only every
// 2nd (4th, …) line is drawn there, so lines thin out instead of crowding.
// ---------------------------------------------------------------------------
const TWO_PI = 2 * Math.PI;
const CB_CHARTS = {
  cartesian: { name: '\\mathscr{C}', coords: ['x', 'y'], glyphs: ['x', 'y'], rule: '(x, y) = (q_1, q_2)',
    map: q => [q[0], q[1]], inv: c => [c[0], c[1]], jac: () => [[1, 0], [0, 1]], steps: [0.5, 0.5] },
  polar: { name: '\\mathscr{P}', coords: ['r', '\\theta'], glyphs: ['r', 'θ'],
    inv: c => [c[0] * Math.cos(c[1]), c[0] * Math.sin(c[1])],
    jac: q => { const r2 = q[0] ** 2 + q[1] ** 2, r = Math.sqrt(r2); return [[q[0] / r, q[1] / r], [-q[1] / r2, q[0] / r2]]; },
    steps: [0.5, Math.PI / 8], polar: true },
  X: { name: '\\mathscr{X}', rule: '(2q_1, -q_2)',
    map: q => [2 * q[0], -q[1]], inv: c => [c[0] / 2, -c[1]], jac: () => [[2, 0], [0, -1]], steps: [1, 0.5] },
  Y: { name: '\\mathscr{Y}', rule: '(q_1, q_2e^{q_1})',
    map: q => [q[0], q[1] * Math.exp(q[0])], inv: c => [c[0], c[1] * Math.exp(-c[0])],
    jac: q => [[1, 0], [q[1] * Math.exp(q[0]), Math.exp(q[0])]], steps: [0.5, 1] },
};
// The polar chart with its cut: θ ∈ (t0, t0 + 2π), undefined on the closed half-line at angle t0.
function polarCut(cut) {
  const left = cut === 'left', t0 = left ? -Math.PI : 0;
  const ang = q => { const t = (((Math.atan2(q[1], q[0]) - t0) % TWO_PI) + TWO_PI) % TWO_PI; return t0 + t; };
  return { t0,
    map: q => [Math.hypot(...q), ang(q)],
    dom: q => Math.hypot(...q) > 1e-9 && Math.abs(ang(q) - t0) > 1e-9,
    rule: `(r, \\theta),\\ \\theta \\in ${left ? '(-\\pi, \\pi)' : '(0, 2\\pi)'}`,
    cutText: `$\\theta \\in ${left ? '(-\\pi, \\pi)' : '(0, 2\\pi)'}$ leaves out the half-line $q_2 = 0,\\ q_1 ${left ? '\\le' : '\\ge'} 0$ (the angle would jump there, and $r = 0$ has no angle)` };
}
// Unicode mathematical script capital for \mathscr{L} (for SVG labels).
const SCRIPT_HOLES = { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ' };
const scriptGlyph = name => {
  const m = /\\mathscr\{([A-Z])\}/.exec(name);
  if (!m) return name.replace(/\\/g, '');
  return SCRIPT_HOLES[m[1]] ?? String.fromCodePoint(0x1D49C + m[1].charCodeAt(0) - 65);
};
const inv2 = ([[a, b], [c, d]]) => { const D = a * d - b * c; return [[d / D, -b / D], [-c / D, a / D]]; };
const mul2 = (A, B) => A.map(r => [0, 1].map(j => r[0] * B[0][j] + r[1] * B[1][j]));
const mulv = (A, v) => A.map(r => r[0] * v[0] + r[1] * v[1]);

// Label placement (chart-basis, parallel-transport): try spots in order of
// preference and keep the first that clears the arrows (segments) and the
// labels already placed (else the clearest one). Distances are measured in
// label-sized units (labels are wide and short).
const LW = 0.5, LH = 0.24;
const dSeg = (q, a, b) => {
  const A = [(a[0] - q[0]) / LW, (a[1] - q[1]) / LH], B = [(b[0] - q[0]) / LW, (b[1] - q[1]) / LH];
  const d = [B[0] - A[0], B[1] - A[1]], dd = d[0] ** 2 + d[1] ** 2;
  const t = dd ? Math.max(0, Math.min(1, -(A[0] * d[0] + A[1] * d[1]) / dd)) : 0;
  return Math.hypot(A[0] + t * d[0], A[1] + t * d[1]);
};
function labelPlacer(view, layer) {
  return (items, segs) => {
    const placed = [];
    for (const it of items) {
      let best = null, bestS = -Infinity;
      for (const c of it.cands) {
        const inView = c[0] > view.x + 0.3 && c[0] < view.x + view.w - 0.3 && c[1] > view.y + 0.2 && c[1] < view.y + view.h - 0.2;
        const sc = Math.min(...segs.map(([a, b]) => dSeg(c, a, b)),
          ...placed.map(q => dSeg(c, q, q) / 2)) - (inView ? 0 : 5);
        if (sc >= 1.1) { best = c; break; }
        if (sc > bestS) { best = c; bestS = sc; }
      }
      placed.push(best);
      layer.append(label(best, it.text, it.cls));
    }
  };
}
// candidate spots around the tip of the arrow from p along e: beyond it, then beside it
const tipCands = (p, e, sg) => {
  const Ln = Math.hypot(...e) || 1, u = [e[0] / Ln, e[1] / Ln], n = [-u[1], u[0]], tip = [p[0] + e[0], p[1] + e[1]];
  const at = (al, be) => [tip[0] + al * u[0] + be * n[0], tip[1] + al * u[1] + be * n[1]];
  const side = 0.22 + 0.25 * Math.abs(u[1]);
  return [at(0.3, sg * side), at(0.3, -sg * side), at(0.5 + 0.3 * Math.abs(u[0]), 0), at(-0.35, sg * 0.4), at(-0.35, -sg * 0.4),
    at(0.15, sg * (side + 0.45)), at(0.15, -sg * (side + 0.45)), at(0.9 + 0.3 * Math.abs(u[0]), 0)];
};

function chartBasis(el, cfg) {
  const sn = cfg.snap ?? 0.25, basisOnly = !!cfg.basisOnly, chain = !!cfg.chain, showInv = !!cfg.inverse, showJac = cfg.jacobian !== false;
  const dragP = cfg.dragP ?? true, nmax = cfg.lines ?? 8;
  const mkChart = spec => {
    const o = typeof spec === 'string' ? { chart: spec } : spec;
    const base = CB_CHARTS[o.chart] ?? CB_CHARTS.X;
    const name = o.name ?? base.name;
    const g = scriptGlyph(name);
    return { dom: () => true, ...base, ...(base.polar ? polarCut(o.cut) : {}), name,
      coords: base.coords ?? [`${name}^1`, `${name}^2`],
      glyphs: base.glyphs ?? [`${g}¹`, `${g}²`],
      steps: o.steps ?? base.steps };
  };
  const init = () => ({
    charts: (cfg.charts ?? ['X', 'Y']).slice(0, 2).map(mkChart),
    p: [...(cfg.p ?? [1, 1])], v: [...(cfg.v ?? [1, 2])] });
  let st = init();
  const snap = t => (sn ? Math.round(t / sn) * sn : t);
  const p0 = cfg.p ?? [1, 1];
  const view = cfg.view ?? { x: p0[0] - 2.5, y: p0[1] - 2.5, w: 5, h: 5 };
  const minGap = 0.14 * Math.max(view.w, view.h) / 5;
  const { svg, layers: L } = planeSvg(view, 'Coordinate lines of the charts, the basis vectors at p and a velocity v',
    ['lines', 'arrows', 'marks', 'labels', 'handles']);
  const readout = h('div', { class: 'readout' });
  const btns = h('div', { class: 'wbtns' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      st = { charts: pr.charts ? pr.charts.slice(0, 2).map(mkChart) : st.charts,
        p: pr.p ? [...pr.p] : st.p, v: pr.v ? [...pr.v] : st.v };
      draw();
    } }, pr.label)));
  el.append(h('div', { class: 'cc-panels single' }, svg), readout, btns);

  const handle = (cls, aria, onMove) => {
    const c = s('circle', { r: 0.17, class: `w-handle ${cls}`, tabindex: 0, 'aria-label': aria });
    L.handles.append(c);
    c.addEventListener('pointerdown', e => {
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      const move = ev => {
        const q = svg.createSVGPoint();
        q.x = ev.clientX; q.y = ev.clientY;
        const m = q.matrixTransform(svg.getScreenCTM().inverse());
        const x = snap(Math.max(view.x + 0.2, Math.min(view.x + view.w - 0.2, m.x)));
        const y = snap(Math.max(view.y + 0.2, Math.min(view.y + view.h - 0.2, -m.y)));
        onMove([x, y]);
        draw();
      };
      const up = () => { c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up); };
      c.addEventListener('pointermove', move);
      c.addEventListener('pointerup', up);
      c.addEventListener('pointercancel', up);
    });
    return c;
  };
  const vh = basisOnly ? null : handle('vec', 'velocity v', q => {
    const v = [q[0] - st.p[0], q[1] - st.p[1]];
    if (Math.hypot(...v) >= 0.2) st.v = v;
  });
  const ph = dragP ? handle('gold', 'point p', q => { st.p = q; }) : null;

  const poly = (pts, cls) => s('polyline', { points: pts.map(q => P(...q).join(',')).join(' '), class: cls });
  // range of each chart coordinate over the view (sampled on a grid)
  function ranges(ch) {
    const lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
    for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) {
      const q = [view.x + view.w * i / 40, view.y + view.h * j / 40];
      if (!ch.dom(q)) continue;
      const c = ch.map(q);
      for (const k of [0, 1]) { lo[k] = Math.min(lo[k], c[k]); hi[k] = Math.max(hi[k], c[k]); }
    }
    if (ch.polar) { lo[0] = Math.max(lo[0], 0); if (Math.hypot(view.x + view.w / 2, view.y + view.h / 2) < Math.hypot(view.w, view.h)) { lo[1] = ch.t0; hi[1] = ch.t0 + TWO_PI; } }
    return { lo, hi };
  }
  // coordinate lines: coordinate k fixed at cp[k] + n·step, the other one runs.
  // Line n is drawn only where n is a multiple of m, the smallest power of 2
  // with m·(local spacing) ≥ minGap; the spacing of the lines of coordinate k
  // is step / |∇ coordinate k| (row k of the Jacobian of the chart).
  function coordLines(ch, idx, inDom) {
    const { lo, hi } = ranges(ch), out = [];
    const cp = inDom ? ch.map(st.p) : ch.polar ? [Math.hypot(...st.p), ch.t0] : ch.map(st.p);
    for (const k of [0, 1]) {
      const o = 1 - k, st_ = ch.steps[k];
      const nlo = Math.max(-nmax, Math.ceil((lo[k] - cp[k]) / st_)), nhi = Math.min(nmax, Math.floor((hi[k] - cp[k]) / st_));
      const a = ch.polar ? (o === 1 ? ch.t0 : Math.max(0, lo[0] - 0.1 * (hi[0] - lo[0]))) : lo[o] - 0.1 * (hi[o] - lo[o]);
      const b = ch.polar && o === 1 ? ch.t0 + TWO_PI : hi[o] + 0.1 * (hi[o] - lo[o]);
      for (let n = nlo; n <= nhi; n++) {
        const val = cp[k] + n * st_;
        if (ch.polar && k === 0 && val <= 1e-9) continue;
        if (ch.polar && k === 1 && (val < ch.t0 + 1e-9 || val > ch.t0 + TWO_PI - 1e-9)) continue;
        const cls = `cb-line c${idx + 1}${n === 0 && inDom ? ' main' : ''}`;
        let pts = [];
        for (let i = 0; i <= 200; i++) {
          const c = [0, 0];
          c[k] = val; c[o] = a + (b - a) * i / 200;
          const q = ch.inv(c), row = ch.jac(q)[k], gap = st_ / (Math.hypot(...row) || 1e-9);
          const m = gap >= minGap ? 1 : 2 ** Math.ceil(Math.log2(minGap / gap));
          if (n % m === 0 && Number.isFinite(q[0] + q[1])) pts.push(q);
          else { if (pts.length > 1) out.push(poly(pts, cls)); pts = []; }
        }
        if (pts.length > 1) out.push(poly(pts, cls));
      }
    }
    if (ch.polar) out.push(line([0, 0], [30 * Math.cos(ch.t0), 30 * Math.sin(ch.t0)], 'cb-cut'));
    return out;
  }

  const placeLabels = labelPlacer(view, L.labels);

  function draw() {
    for (const k of ['lines', 'arrows', 'marks', 'labels']) L[k].replaceChildren();
    const p = st.p, chs = st.charts, inD = chs.map(ch => ch.dom(p));
    chs.forEach((ch, idx) => L.lines.append(...coordLines(ch, idx, inD[idx])));
    // basis vectors: columns of (D𝒳)⁻¹ at p (only for charts whose domain contains p)
    const Ds = chs.map((ch, idx) => (inD[idx] ? ch.jac(p) : null)), Bs = Ds.map(D => D && inv2(D));
    const segs = [], items = [];
    if (!basisOnly) {
      const tip = [p[0] + st.v[0], p[1] + st.v[1]];
      L.arrows.append(arrow(p, tip, 'w-uvec'));
      segs.push([p, tip], [tip, tip]);
      items.push({ text: 'v', cls: 'vec', cands: tipCands(p, st.v, 1) });
      placeHandle(vh, tip);
    }
    chs.forEach((ch, idx) => {
      if (!Bs[idx]) return;
      for (const i of [0, 1]) {
        const e = [Bs[idx][0][i], Bs[idx][1][i]], tip = [p[0] + e[0], p[1] + e[1]];
        L.arrows.append(arrow(p, tip, `w-basis${idx ? ' cv-dash' : ''}`));
        segs.push([p, tip]);
        items.push({ text: `∂/∂${ch.glyphs[i]}`, cls: 'basis small', cands: tipCands(p, e, idx ? 1 : -1) });
      }
    });
    items.push({ text: 'p', cls: 'gold', cands: [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map(d => [p[0] + d[0], p[1] + d[1]]) });
    placeLabels(items, segs);
    const [px, py] = P(...p);
    L.marks.append(s('circle', { cx: px, cy: py, r: 0.11, class: 'cv-p' }));
    if (ph) placeHandle(ph, p);

    // readout
    const vec = a => `(${a.map(fmt).join(', ')})`;
    const comps = Ds.map(D => D && mulv(D, st.v));
    const rows = [h('div', { class: 'wide', html: mdInline(`$p = ${vec(p)}$${basisOnly ? '' : `, $v = ${vec(st.v)}$, the velocity of $\\gamma(\\lambda) = p + \\lambda\\, v$`}`) })];
    chs.forEach((ch, idx) => {
      const cell = [
        h('div', { class: 'cb-tag', html: mdInline(`$${ch.name}$, ${idx ? 'dashed' : 'solid'} lines`) }),
        h('div', { html: tex(`${ch.name}(q) = ${ch.rule}`) }),
      ];
      if (!inD[idx]) {
        cell.push(h('div', { class: 'cb-tag', html: mdInline(`$p$ is not in the domain of $${ch.name}$: ${ch.cutText ?? 'outside the chart'}. No basis, no components here.`) }));
      } else {
        cell.push(h('div', { html: tex(`${ch.name}(p) = ${vec(ch.map(p))}`) }));
        if (!basisOnly) for (const i of [0, 1])
          cell.push(h('div', { class: 'c-vec', html: tex(`(${ch.coords[i]}\\circ\\gamma)'(0) = ${fmt(comps[idx][i])}`) }));
      }
      rows.push(h('div', { class: 'cv-cell' }, ...cell));
    });
    if (chs.length === 2 && showJac && !(inD[0] && inD[1])) {
      rows.push(h('div', { class: 'wide cb-tag', html: mdInline('The Jacobian needs $p$ in the domains of both charts.') }));
    } else if (chs.length === 2 && showJac) {
      const [A, B] = chs;
      const J = mul2(Ds[1], Bs[0]);       // (∂𝒴ⁱ/∂𝒳ʲ)_p = D𝒴 · (D𝒳)⁻¹
      const mat = M => `\\begin{pmatrix} ${fmt(M[0][0])} & ${fmt(M[0][1])} \\\\ ${fmt(M[1][0])} & ${fmt(M[1][1])} \\end{pmatrix}`;
      const col = a => `\\begin{pmatrix} ${fmt(a[0])} \\\\ ${fmt(a[1])} \\end{pmatrix}`;
      const jac = [h('div', { html: tex(`\\Big(\\frac{\\partial ${B.name}^i}{\\partial ${A.name}^j}\\Big)_p = ${mat(J)}`) })];
      if (showInv) jac.push(h('div', { html: tex(`\\Big(\\frac{\\partial ${A.name}^i}{\\partial ${B.name}^j}\\Big)_p = ${mat(inv2(J))}`) }));
      rows.push(h('div', { class: 'wide cb-jac' }, ...jac));
      if (!basisOnly) {
        rows.push(h('div', { class: 'wide', html: mdInline(`Components in $${B.name}$ = Jacobian $\\cdot$ components in $${A.name}$${chain ? ':' : '.'}`) }));
        if (chain) rows.push(h('div', { class: 'wide', html: tex(`${col(comps[1])} = ${mat(J)} ${col(comps[0])}`) }));
      } else if (chain) {
        const bv = (ch, i) => `\\Big(\\frac{\\partial}{\\partial ${ch.coords[i]}}\\Big)_p`;
        const coef = (t, first) => (first ? fmt(t) : `${t < 0 ? '-' : '+'} ${fmt(Math.abs(t))}`);
        for (const i of [0, 1])
          rows.push(h('div', { html: tex(`\\begin{aligned} ${bv(A, i)} &= ${coef(J[0][i], true)}\\, ${bv(B, 0)} \\\\ &\\quad ${coef(J[1][i], false)}\\, ${bv(B, 1)} \\end{aligned}`) }));
      }
    }
    readout.replaceChildren(...rows);
  }
  draw();
}

// ---------------------------------------------------------------------------
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
// ---------------------------------------------------------------------------
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

function parallelTransport(el, cfg) {
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

// ---------------------------------------------------------------------------
// time-slices
//
// A 1+1 spacetime picture: horizontal axis a (space), vertical axis τ, and a
// time function t (preset). Drawn: the level curves 𝒮_c = preim_t({c}) at
// c = multiples of `step` (thin ink), the slice of the slider's c in gold, a
// draggable point p with the line ker(dt)_p through it (ink: the spatial
// directions at p, tangent to the slice through p) and the covector (dt)_p as
// its two level lines (dt)_p(w) = ±1 for displacements w from p (orange,
// dashed). Readout: t(p), (dt)_p = (∂t/∂a) da + (∂t/∂τ) dτ, a vector v spanning
// the kernel with (dt)_p(v) = 0 in numbers, the gold slice, and the badge
// "Absolute time?" (Yes iff dt ≠ 0 at every point in view; No with a point
// where dt = 0, marked on the picture).
//
// config:
//   time:   'flat' | 'wavy' | 'squared' | 'boosted'
//   times:  ['flat', 'wavy']    buttons offered (one entry: none)
//   p: [1, 0.5], c: t(p) (initial gold slice), step: 0.5, snap: 0.25,
//   kernel: true, stack: true, badge: true, dragP: true, view: { x, y, w, h }
//   presets: [{ label, time, p, c }]
// ---------------------------------------------------------------------------
const TS_R = Math.sqrt(0.75);
const TS_TIMES = {
  flat: { md: 't(a, \\tau) = \\tau',
    t: ([, u]) => u, dt: () => [0, 1], taus: (a, c) => [c] },
  wavy: { md: 't(a, \\tau) = \\tau + 0.3\\sin a',
    t: ([a, u]) => u + 0.3 * Math.sin(a), dt: ([a]) => [0.3 * Math.cos(a), 1], taus: (a, c) => [c - 0.3 * Math.sin(a)] },
  squared: { md: 't(a, \\tau) = \\tau^2', cmin: -1,
    t: ([, u]) => u * u, dt: ([, u]) => [0, 2 * u],
    taus: (a, c) => (c > 1e-12 ? [Math.sqrt(c), -Math.sqrt(c)] : Math.abs(c) <= 1e-12 ? [0] : []),
    // dt = 0 exactly on the line τ = 0: report the point of it below/above p
    zero: (view, p) => (view.y <= 0 && view.y + view.h >= 0 ? { q: [p[0], 0], note: 'in fact on the whole line $\\tau = 0$' } : null) },
  boosted: { md: 't(a, \\tau) = (\\tau - 0.5\\,a)/\\sqrt{0.75}',
    t: ([a, u]) => (u - 0.5 * a) / TS_R, dt: () => [-0.5 / TS_R, 1 / TS_R], taus: (a, c) => [0.5 * a + c * TS_R] },
};

function timeSlices(el, cfg) {
  const sn = cfg.snap ?? 0.25, step = cfg.step ?? 0.5;
  const times = (cfg.times ?? [cfg.time ?? 'flat']).filter(k => TS_TIMES[k]);
  const view = cfg.view ?? { x: -3, y: -2.5, w: 6, h: 5 };
  const init = () => {
    const tm = TS_TIMES[cfg.time] ? cfg.time : times[0] ?? 'flat';
    const p = [...(cfg.p ?? [1, 0.5])];
    return { tm, p, c: cfg.c ?? TS_TIMES[tm].t(p) };
  };
  let st = init();
  const { svg, layers: L } = planeSvg(view, 'Spacetime with the slices of a time function, a point p and the line of spatial directions at p',
    ['slices', 'gold', 'arrows', 'marks', 'labels', 'handles']);
  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', 'aria-label': 'value c of the highlighted slice' });
  slider.addEventListener('input', () => { st.c = +slider.value; draw(); });
  const cOut = h('span', { class: 'pt-lam' });
  const timeBtns = times.length > 1 ? times.map(k => h('button', { class: 'btn ghost', type: 'button', 'data-time': k,
    html: mdInline(`$${TS_TIMES[k].md}$`), onclick: () => { st.tm = k; st.c = TS_TIMES[k].t(st.p); draw(); } })) : [];
  const btns = h('div', { class: 'wbtns' },
    timeBtns,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.c = TS_TIMES[st.tm].t(st.p); draw(); } }, 'Slice through p'),
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      const tm = pr.time && TS_TIMES[pr.time] ? pr.time : st.tm, p = pr.p ? [...pr.p] : st.p;
      st = { tm, p, c: pr.c ?? TS_TIMES[tm].t(p) };
      draw();
    } }, pr.label)));
  el.append(h('div', { class: 'cc-panels single' }, svg), h('label', { class: 'wslider' }, cOut, slider), readout, btns);

  // drag p
  const ph = cfg.dragP === false ? null : s('circle', { r: 0.2, class: 'w-handle cv-bend', tabindex: 0, 'aria-label': 'the point p' });
  if (ph) {
    L.handles.append(ph);
    ph.addEventListener('pointerdown', e => {
      e.preventDefault();
      ph.setPointerCapture(e.pointerId);
      const move = ev => {
        const q = svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
        const m = q.matrixTransform(svg.getScreenCTM().inverse());
        const x = Math.max(view.x + 0.25, Math.min(view.x + view.w - 0.25, m.x)), y = Math.max(view.y + 0.25, Math.min(view.y + view.h - 0.25, -m.y));
        st.p = [x, y].map(t => (sn ? Math.round(t / sn) * sn : t)); draw();
      };
      const up = () => { ph.removeEventListener('pointermove', move); ph.removeEventListener('pointerup', up); ph.removeEventListener('pointercancel', up); };
      ph.addEventListener('pointermove', move); ph.addEventListener('pointerup', up); ph.addEventListener('pointercancel', up);
    });
  }

  // range of t over the view (grid), for the slider and the drawn slices
  const grid = fn => { for (let i = 0; i <= 60; i++) for (let j = 0; j <= 60; j++) { const r = fn([view.x + view.w * i / 60, view.y + view.h * j / 60]); if (r) return r; } return null; };
  const tRange = T => { let lo = Infinity, hi = -Infinity; grid(q => { const v = T.t(q); lo = Math.min(lo, v); hi = Math.max(hi, v); }); return [lo, hi]; };
  // dt ≠ 0 everywhere in view? (analytic zero set if the preset has one, else a grid search)
  const zeroOf = (T, p) => (T.zero ? T.zero(view, p) : grid(q => (Math.hypot(...T.dt(q)) < 1e-9 ? { q, note: '' } : null)));
  const slicePaths = (T, c) => {
    const N = 240, br = [];
    for (let i = 0; i <= N; i++) {
      const a = view.x + view.w * i / N;
      T.taus(a, c).forEach((u, k) => { (br[k] ??= []).push(P(a, u).join(',')); });
    }
    return br.map(b => b.join(' '));
  };
  const inView = (q, mx = 0.3, my = 0.2) => q[0] > view.x + mx && q[0] < view.x + view.w - mx && q[1] > view.y + my && q[1] < view.y + view.h - my;

  function draw() {
    for (const k of ['slices', 'gold', 'arrows', 'marks', 'labels']) L[k].replaceChildren();
    const T = TS_TIMES[st.tm], p = st.p;
    for (const bt of timeBtns) bt.className = `btn ${bt.dataset.time === st.tm ? 'primary' : 'ghost'}`;
    const [lo, hi] = tRange(T);
    const cmin = Math.min(T.cmin ?? Infinity, Math.floor(lo / step) * step), cmax = Math.ceil(hi / step) * step;
    st.c = Math.max(cmin, Math.min(cmax, st.c));
    slider.min = cmin; slider.max = cmax; slider.step = 0.05; slider.value = st.c;
    cOut.innerHTML = tex(`c = ${fmt(st.c)}`);

    // slices at multiples of step, then the gold one
    for (let k = Math.ceil(lo / step - 1e-9); k * step <= hi + 1e-9; k++)
      for (const d of slicePaths(T, k * step)) L.slices.append(s('polyline', { points: d, class: 'ts-slice' }));
    const gold = slicePaths(T, st.c);
    for (const d of gold) L.gold.append(s('polyline', { points: d, class: 'ts-slice gold' }));
    if (gold.length) {
      // label near the edge away from p, just above the upper branch
      const ax = p[0] > view.x + view.w / 2 ? view.x + 0.85 : view.x + view.w - 0.85, u = T.taus(ax, st.c)[0] + 0.28;
      if (inView([ax, u])) L.labels.append(label([ax, u], `c = ${fmt(st.c)}`, 'gold small'));
    }
    // axis names
    L.labels.append(label([view.x + view.w - 0.25, -0.28], 'a', ''));
    L.labels.append(label([0.25, view.y + view.h - 0.25], 'τ', ''));

    // (dt)_p, its kernel and its level lines (dt)_p(w) = ±1
    const C = T.dt(p), n2 = C[0] ** 2 + C[1] ** 2, tp = T.t(p);
    const zeroP = n2 < 1e-18;
    if (!zeroP) {
      const nn = Math.sqrt(n2), u = [C[1] / nn, -C[0] / nn], nrm = [C[0] / nn, C[1] / nn];
      if (cfg.stack !== false)
        for (const k of [1, -1]) {
          const o = [p[0] + k * C[0] / n2, p[1] + k * C[1] / n2];
          L.arrows.append(line([o[0] - 1.2 * u[0], o[1] - 1.2 * u[1]], [o[0] + 1.2 * u[0], o[1] + 1.2 * u[1]], 'w-level ts-stack'));
          const lp = [o[0] + 1.45 * u[0], o[1] + 1.45 * u[1]], lq = [o[0] - 1.45 * u[0], o[1] - 1.45 * u[1]];
          const lb = inView(lp) ? lp : inView(lq) ? lq : null;
          if (lb) L.labels.append(label(lb, k > 0 ? '+1' : '−1', 'covec small'));
        }
      if (cfg.kernel !== false) {
        L.arrows.append(line([p[0] - 1.5 * u[0], p[1] - 1.5 * u[1]], [p[0] + 1.5 * u[0], p[1] + 1.5 * u[1]], 'ts-ker'));
        const cands = [];
        for (const sg of [-1, 1]) for (const sd of [-1, 1]) {
          const e = [p[0] + sg * 1.05 * u[0], p[1] + sg * 1.05 * u[1]];
          cands.push([e[0] + sd * 0.25 * nrm[0], e[1] + sd * 0.25 * nrm[1]]);
        }
        L.labels.append(label(cands.find(q => inView(q, 0.75)) ?? cands[0], 'ker (dt)ₚ', 'small'));
      }
    }
    const zr = zeroOf(T, p);
    if (zr) {
      L.marks.append(s('circle', { cx: P(...zr.q)[0], cy: P(...zr.q)[1], r: 0.13, class: 'ts-zero' }));
      L.labels.append(label([zr.q[0] + (zr.q[0] > view.x + view.w - 1.2 ? -0.65 : 0.65), zr.q[1] - 0.28], 'dt = 0', 'small'));
    }
    L.marks.append(s('circle', { cx: P(...p)[0], cy: P(...p)[1], r: 0.08, class: 'cv-dot' }));
    L.labels.append(label([p[0] - 0.32, p[1] + 0.3], 'p', ''));
    if (ph) placeHandle(ph, p);

    // readout
    const term = (x, name) => `${x < 0 && fmt(x) !== '0' ? '-' : '+'} ${fmt(Math.abs(x))}\\,${name}`;
    const par = x => (x < 0 && fmt(x) !== '0' ? `(${fmt(x)})` : fmt(x));
    const rows = [
      h('div', { class: 'wide', html: mdInline(`Time function $${T.md}$; the point $p = (${fmt(p[0])}, ${fmt(p[1])})$ has $t(p) = ${fmt(tp)}$, so it lies on the slice $\\mathcal{S}_{${fmt(tp)}}$.`) }),
      h('div', { class: 'wide c-covec', html: tex(`(dt)_p = ${fmt(C[0])}\\,da ${term(C[1], 'd\\tau')}`) }),
      h('div', { class: 'wide cb-tag', html: mdInline(`components $(\\partial t/\\partial a)_p = ${fmt(C[0])}$ and $(\\partial t/\\partial \\tau)_p = ${fmt(C[1])}$`) }),
    ];
    if (zeroP) rows.push(h('div', { class: 'wide warn', html: mdInline('$(dt)_p = 0$: every vector $v$ at $p$ has $(dt)_p(v) = 0$, so $\\ker(dt)_p$ is the whole tangent space (dimension 2), not a line. Time stands still here.') }));
    else {
      const v = [C[1], -C[0]];
      rows.push(h('div', { class: 'wide', html: mdInline(`$\\ker(dt)_p$, the spatial directions at $p$, is the line spanned by the vector $v$ with components $v^a = ${fmt(v[0])}$, $v^\\tau = ${fmt(v[1])}$:`) }));
      rows.push(h('div', { class: 'wide', html: tex(`(dt)_p(v) = ${par(C[0])}\\cdot ${par(v[0])} + ${par(C[1])}\\cdot ${par(v[1])} = 0`) }));
    }
    rows.push(h('div', { class: 'wide', html: mdInline(gold.length
      ? `Gold: the slice $\\mathcal{S}_c = \\mathrm{preim}_t(\\{c\\})$ with $c = ${fmt(st.c)}$${gold.length > 1 ? ' (two curves)' : ''}.`
      : `Gold: $\\mathcal{S}_c$ with $c = ${fmt(st.c)}$ is empty, since $t$ never takes that value.`) }));
    if (cfg.badge !== false)
      rows.push(h('div', { class: `wide ${zr ? 'warn' : 'ok'}`, html: mdInline(zr
        ? `**Absolute time?** No: $(dt)_q = 0$ at $q = (${fmt(zr.q[0])}, ${fmt(zr.q[1])})$${zr.note ? `, ${zr.note}` : ''}. There time stands still.`
        : '**Absolute time?** Yes: $(dt)_q \\ne 0$ at every point $q$ in view, so time never stands still.') }));
    readout.replaceChildren(...rows);
  }
  draw();
}

// ---------------------------------------------------------------------------
// rotating-grid
//
// Top view of the spatial plane of a Newtonian spacetime without gravity. A
// free particle moves straight in the inertial chart, x(t) = x₀ + v t; the
// rotating chart turns at constant θ̇ = ω (θ = ωt, no translation):
//   y¹ = x¹ cos ωt + x² sin ωt,  y² = −x¹ sin ωt + x² cos ωt,
// whose only nonzero coefficients are Γ¹₀₂ = Γ¹₂₀ = −ω, Γ²₀₁ = Γ²₁₀ = ω and
// Γ^α₀₀ = −ω² y^α. Panels: the inertial chart (x¹, x²) with the rotating grid
// drawn turning (purple lattice), and/or the rotating chart (y¹, y²) with the
// inertial grid turning the other way; the trace of the particle up to t
// (straight in the first, curling in the second). At the current t, in the
// rotating panel: the velocity ẏ (blue) and, per unit mass, the Coriolis
// pseudo-force −2Γ^α₀β ẏ^β = (2ωẏ², −2ωẏ¹) (gold), the centrifugal one
// −Γ^α₀₀ = ω² y (green) and their sum = ÿ (ink). Handles at t = 0 (where the
// charts agree): the start point x₀ and the tip of x₀ + v.
//
// config:
//   omega: 1, x0: [1, 0], v: [0, 0.5], t: 0, tmax: 6.28
//   view: 'both' | 'inertial' | 'rotating', views: ['inertial', 'rotating', 'both']
//   forces: true, forcesToggle: true, scale: 1 (arrow length per unit of
//   force), velocity: true, ghost: false (whole path faint), drag: true,
//   snap: 0.25, box: { x: -4, y: -4, w: 8, h: 8 },
//   presets: [{ label, omega, x0, v, t }]
// ---------------------------------------------------------------------------
const rgRot = (th, [a, b]) => [a * Math.cos(th) + b * Math.sin(th), -a * Math.sin(th) + b * Math.cos(th)];
const RG_VIEWS = ['inertial', 'rotating', 'both'];
const RG_WORD = { inertial: 'Inertial', rotating: 'Rotating', both: 'Both' };

function rotatingGrid(el, cfg) {
  const sn = cfg.snap ?? 0.25, scale = cfg.scale ?? 1;
  const views = (cfg.views ?? RG_VIEWS).filter(k => RG_VIEWS.includes(k));
  const box = cfg.box ?? { x: -4, y: -4, w: 8, h: 8 };
  const init = () => ({
    w: cfg.omega ?? 1, x0: [...(cfg.x0 ?? [1, 0])], v: [...(cfg.v ?? [0, 0.5])], t: cfg.t ?? 0,
    tmax: cfg.tmax ?? 6.28, view: views.includes(cfg.view) ? cfg.view : views[views.length - 1] ?? 'both',
    forces: cfg.forces !== false,
  });
  let st = init();
  const xAt = u => [st.x0[0] + st.v[0] * u, st.x0[1] + st.v[1] * u];
  const yAt = u => rgRot(st.w * u, xAt(u));

  const mk = (name, aria) => {
    const { svg, layers } = planeSvg(box, aria, ['other', 'trace', 'arrows', 'marks', 'labels', 'handles']);
    const cap = h('div', { class: 'rg-cap', html: mdInline(name) });
    return { svg, L: layers, wrap: h('div', { class: 'rg-panel' }, svg, cap) };
  };
  const PI = mk('inertial chart $(x^1, x^2)$', 'Inertial chart: the straight path of a free particle, with the rotating grid turning');
  const PR = mk('rotating chart $(y^1, y^2)$', 'Rotating chart: the same path curling, with the Coriolis and centrifugal arrows');
  const panels = h('div', { class: 'cc-panels rg-panels' }, PI.wrap, PR.wrap);
  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', min: 0, step: 0.01, 'aria-label': 'absolute time t' });
  slider.addEventListener('input', () => { stop(); st.t = +slider.value; draw(); });
  const tOut = h('span', { class: 'pt-lam' });
  let anim = null;
  const playBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => play() }, 'Play');
  const viewBtns = views.length > 1 ? views.map(k => h('button', { class: 'btn ghost', type: 'button', 'data-view': k,
    onclick: () => { st.view = k; draw(); } }, RG_WORD[k])) : [];
  const forceBtn = cfg.forcesToggle === false ? null : h('button', { class: 'btn ghost', type: 'button',
    onclick: () => { st.forces = !st.forces; draw(); } }, 'Forces');
  const btns = h('div', { class: 'wbtns' },
    playBtn, viewBtns, forceBtn,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      stop();
      if (pr.omega != null) st.w = pr.omega;
      if (pr.x0) st.x0 = [...pr.x0];
      if (pr.v) st.v = [...pr.v];
      st.t = pr.t ?? 0;
      draw();
    } }, pr.label)));
  el.append(panels, h('label', { class: 'wslider' }, tOut, slider), readout, btns);

  function stop() { if (anim) cancelAnimationFrame(anim); anim = null; playBtn.textContent = 'Play'; }
  function play() {
    if (anim) return stop();
    if (st.t >= st.tmax - 1e-9) st.t = 0;
    const tStart = st.t, dur = 7000 * (st.tmax - tStart) / st.tmax;
    let t0 = null;
    const step = tm => {
      if (!el.isConnected) return stop();
      if (t0 === null) t0 = tm;
      const u = Math.min(1, (tm - t0) / dur);
      st.t = tStart + (st.tmax - tStart) * u; draw();
      if (u < 1) anim = requestAnimationFrame(step); else stop();
    };
    playBtn.textContent = 'Pause';
    anim = requestAnimationFrame(step);
  }

  // handles at t = 0 (the charts agree there), in each panel: x₀ and the tip of x₀ + v
  const clampIn = q => [Math.max(box.x + 0.25, Math.min(box.x + box.w - 0.25, q[0])), Math.max(box.y + 0.25, Math.min(box.y + box.h - 0.25, q[1]))];
  const dragOn = (svg, c, onMove) => c.addEventListener('pointerdown', e => {
    e.preventDefault(); stop();
    c.setPointerCapture(e.pointerId);
    const move = ev => {
      const q = svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
      const m = q.matrixTransform(svg.getScreenCTM().inverse());
      onMove(clampIn([m.x, -m.y]).map(z => (sn ? Math.round(z / sn) * sn : z))); draw();
    };
    const up = () => { c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up); };
    c.addEventListener('pointermove', move); c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  });
  const handles = [];
  if (cfg.drag !== false)
    for (const Pn of [PI, PR]) {
      const hx = s('circle', { r: 0.2, class: 'w-handle rg-h', tabindex: 0, 'aria-label': 'start point x0' });
      const hv = s('circle', { r: 0.2, class: 'w-handle vec rg-h', tabindex: 0, 'aria-label': 'tip of the start velocity v' });
      Pn.L.handles.append(hx, hv);
      dragOn(Pn.svg, hx, q => { st.x0 = q; st.t = 0; });
      dragOn(Pn.svg, hv, q => { st.v = [q[0] - st.x0[0], q[1] - st.x0[1]]; st.t = 0; });
      handles.push([hx, hv]);
    }

  // the other chart's grid, turned by the angle th (lines at integer offsets), with its axis names
  function lattice(layer, labels, th, names) {
    const d = [Math.cos(th), Math.sin(th)], n = [-Math.sin(th), Math.cos(th)], R = 8;
    for (let k = -8; k <= 8; k++)
      for (const [a, b] of [[d, n], [n, d]])
        layer.append(line([k * b[0] - R * a[0], k * b[1] - R * a[1]], [k * b[0] + R * a[0], k * b[1] + R * a[1]], k === 0 ? 'w-lattice rg-axis' : 'w-lattice'));
    [d, n].forEach((e, i) => labels.append(label([3.3 * e[0] - 0.3 * e[1], 3.3 * e[1] + 0.3 * e[0]], names[i], 'basis small')));
  }
  const tracePts = (f, s1, N = 240) => { const pts = []; for (let i = 0; i <= N; i++) pts.push(P(...f(s1 * i / N)).join(',')); return pts.join(' '); };
  // arrow from a by F, labelled beyond its tip (side: push the label to the left (+1) or right (−1) of the arrow)
  const arrowLbl = (L, a, F, txt, cls, side = 0) => {
    const len = Math.hypot(...F);
    if (len < 1e-6) return;
    const b = [a[0] + F[0], a[1] + F[1]], u = [F[0] / len, F[1] / len];
    L.arrows.append(arrow(a, b, cls));
    L.labels.append(label([b[0] + 0.35 * u[0] - 0.3 * side * u[1], b[1] + 0.35 * u[1] + 0.3 * side * u[0]], txt, `small ${cls}`));
  };

  function draw() {
    for (const Pn of [PI, PR]) for (const k of ['other', 'trace', 'arrows', 'marks', 'labels']) Pn.L[k].replaceChildren();
    st.t = Math.max(0, Math.min(st.tmax, st.t));
    slider.max = st.tmax; slider.value = st.t;
    tOut.innerHTML = tex(`t = ${fmt(st.t)}`);
    for (const b of viewBtns) b.className = `btn ${b.dataset.view === st.view ? 'primary' : 'ghost'}`;
    if (forceBtn) forceBtn.className = `btn ${st.forces ? 'primary' : 'ghost'}`;
    PI.wrap.style.display = st.view === 'rotating' ? 'none' : '';
    PR.wrap.style.display = st.view === 'inertial' ? 'none' : '';
    panels.classList.toggle('single', st.view !== 'both');

    const w = st.w, t = st.t, th = w * t;
    const x = xAt(t), y = yAt(t);
    const Rv = rgRot(th, st.v), yd = [Rv[0] + w * y[1], Rv[1] - w * y[0]];
    const cor = [2 * w * yd[1], -2 * w * yd[0]], cf = [w * w * y[0], w * w * y[1]], sum = [cor[0] + cf[0], cor[1] + cf[1]];
    const sc = F => [scale * F[0], scale * F[1]];

    // inertial panel: rotating grid turned by +ωt, straight trace
    lattice(PI.L.other, PI.L.labels, th, ['y¹', 'y²']);
    PI.L.labels.append(label([box.x + box.w - 0.3, -0.3], 'x¹', ''), label([0.35, box.y + box.h - 0.3], 'x²', ''));
    if (cfg.ghost) PI.L.trace.append(s('polyline', { points: tracePts(xAt, st.tmax), class: 'rg-trace ghost' }));
    PI.L.trace.append(s('polyline', { points: tracePts(xAt, t), class: 'rg-trace' }));
    // rotating panel: inertial grid turned by −ωt, curling trace
    lattice(PR.L.other, PR.L.labels, -th, ['x¹', 'x²']);
    PR.L.labels.append(label([box.x + box.w - 0.3, -0.3], 'y¹', ''), label([0.35, box.y + box.h - 0.3], 'y²', ''));
    if (cfg.ghost) PR.L.trace.append(s('polyline', { points: tracePts(yAt, st.tmax), class: 'rg-trace ghost' }));
    PR.L.trace.append(s('polyline', { points: tracePts(yAt, t), class: 'rg-trace' }));

    // start point and start velocity (t = 0, where the charts agree), in both panels
    for (const Pn of [PI, PR]) {
      Pn.L.arrows.append(arrow(st.x0, [st.x0[0] + st.v[0], st.x0[1] + st.v[1]], 'rg-vel pt-start'));
      Pn.L.labels.append(label([st.x0[0] + st.v[0] + 0.32, st.x0[1] + st.v[1] + 0.32], 'v', 'vec small'));
      Pn.L.labels.append(label([st.x0[0] - 0.3, st.x0[1] - 0.34], 'x₀', 'small'));
    }
    for (const [hx, hv] of handles) { placeHandle(hx, st.x0); placeHandle(hv, [st.x0[0] + st.v[0], st.x0[1] + st.v[1]]); }

    // the particle now
    if (cfg.velocity !== false) arrowLbl(PI.L, x, st.v, 'ẋ', 'rg-vel');
    PI.L.marks.append(s('circle', { cx: P(...x)[0], cy: P(...x)[1], r: 0.13, class: 'rg-dot' }));
    if (cfg.velocity !== false) arrowLbl(PR.L, y, yd, 'ẏ', 'rg-vel');
    if (st.forces) {
      // the sum first and thicker, so a force along it stays visible on top
      arrowLbl(PR.L, y, sc(sum), 'ÿ', 'rg-sum');
      arrowLbl(PR.L, y, sc(cor), 'Coriolis', 'rg-cor', 1);
      arrowLbl(PR.L, y, sc(cf), 'centrifugal', 'rg-cf', -1);
    }
    PR.L.marks.append(s('circle', { cx: P(...y)[0], cy: P(...y)[1], r: 0.13, class: 'rg-dot' }));

    // readout
    const pr = ([a, b]) => `(${fmt(a)}, ${fmt(b)})`;
    const zero = Math.hypot(...sum) < 5e-3;
    const rows = [
      h('div', { class: 'wide', html: mdInline(`Free particle: $x(t) = x_0 + v\\,t$ with $x_0 = ${pr(st.x0)}$ and $v = ${pr(st.v)}$. The rotating chart turns at $\\dot\\theta = \\omega = ${fmt(w)}$.`) }),
      h('div', { class: 'wide cb-tag', html: mdInline(`Its only nonzero coefficients: $\\Gamma^1_{02} = \\Gamma^1_{20} = -\\omega = ${fmt(-w)}$, $\\Gamma^2_{01} = \\Gamma^2_{10} = \\omega = ${fmt(w)}$, and $\\Gamma^\\alpha_{00} = -\\omega^2 y^\\alpha$.`) }),
      h('div', { class: 'wide', html: mdInline(`At $t = ${fmt(t)}$, inertial: $x = ${pr(x)}$, $\\dot x = ${pr(st.v)}$, $\\ddot x = (0, 0)$.`) }),
      h('div', { class: 'wide c-vec', html: mdInline(`Rotating: $y = ${pr(y)}$, $\\dot y = ${pr(yd)}$.`) }),
      h('div', { class: 'wide rg-cor', html: mdInline(`Coriolis, per unit mass: $-2\\Gamma^\\alpha_{0\\beta}\\dot y^\\beta = ${pr(cor)}$, i.e. $(2\\omega\\dot y^2, -2\\omega\\dot y^1)$.`) }),
      h('div', { class: 'wide rg-cf', html: mdInline(`Centrifugal, per unit mass: $-\\Gamma^\\alpha_{00} = \\omega^2 y^\\alpha$, i.e. $${pr(cf)}$.`) }),
      h('div', { class: `wide ${zero ? 'ok' : ''}`, html: mdInline(`Their sum is $\\ddot y = ${pr(sum)}$${zero ? ': the two pseudo-forces cancel right now.' : ': no real force acts, yet the rotating chart sees an acceleration.'}`) }),
    ];
    readout.replaceChildren(...rows);
  }
  draw();
}

// ---------------------------------------------------------------------------
// falling-cloud
//
// Tides in Newton-Cartan gravity. A plane through a point mass at the origin
// (x¹ radial, x² transverse; G_N M = GM). A cloud of N free particles on a
// circle of radius r0 around c0 = (c, 0), plus the center particle, all at
// rest at t = 0, falls freely: ẍ = −GM x/|x|³ (velocity Verlet, dt = 5·10⁻⁴,
// precomputed and sampled every 0.005). The run stops (tmax) just before any
// particle reaches |x| = 0.5. Panels: 'sources' (the sources chart: the mass,
// the center's path, the cloud) and 'falling' (the chart y = x − b(t), b =
// the center's path, magnified by zoom: the center stays at 0 and the circle
// turns into an egg). In the falling panel: the exact relative accelerations
// ÿ = a − b̈ (gold, `arrows`), and with `linear` the tidal-equation prediction
// −Riem^α₀β₀ η^β (dashed gold arrows) plus the dashed curve of the solution of
// η̈ = −Riem(t) η along the center's path. Riem^α₀β₀ = ∂β∂αφ at the center:
// on the x¹ axis diag(−2GM/r³, GM/r³) (and Riem³₀₃₀ = GM/r³, trace 0).
//
// config:
//   GM: 8, c0: [2, 0] (on the x¹ axis; draggable along it), r0: 0.2, N: 12,
//   zoom: 5, t: 0, tmax (default: automatic stop), view: 'both' | 'sources' |
//   'falling', views: ['sources', 'falling', 'both'], arrows: true,
//   linear: false, linearToggle: true, scale: 1 (arrow length in the falling
//   panel per unit of acceleration), drag: true, snap: 0.25,
//   presets: [{ label, c0, t, linear }]
// ---------------------------------------------------------------------------
const FC_VIEWS = ['sources', 'falling', 'both'];
const FC_WORD = { sources: 'Sources', falling: 'Falling', both: 'Both' };

// Integrate the cloud (offsets in `offs`, index 0 = the center) and the two
// linear factors A (radial, A'' = 2k A) and B (transverse, B'' = −k B), k = GM/|b|³.
function fcRun(GM, c, offs, tcap) {
  const dt = 5e-4, every = 10, n = offs.length;
  const X = offs.map(o => [c + o[0], o[1]]), V = offs.map(() => [0, 0]);
  const acc = x => { const r3 = Math.hypot(x[0], x[1]) ** 3; return [-GM * x[0] / r3, -GM * x[1] / r3]; };
  let A = X.map(acc);
  const lin = [1, 1], linV = [0, 0];
  const linAcc = (L, b) => { const k = GM / Math.hypot(b[0], b[1]) ** 3; return [2 * k * L[0], -k * L[1]]; };
  const samples = [{ X: X.map(p => [...p]), lin: [...lin] }];
  let t = 0, step = 0;
  while (t < tcap) {
    const LA = linAcc(lin, X[0]);
    for (let i = 0; i < n; i++) for (let d = 0; d < 2; d++) X[i][d] += V[i][d] * dt + 0.5 * A[i][d] * dt * dt;
    for (let d = 0; d < 2; d++) lin[d] += linV[d] * dt + 0.5 * LA[d] * dt * dt;
    const An = X.map(acc), LAn = linAcc(lin, X[0]);
    for (let i = 0; i < n; i++) for (let d = 0; d < 2; d++) V[i][d] += 0.5 * (A[i][d] + An[i][d]) * dt;
    for (let d = 0; d < 2; d++) linV[d] += 0.5 * (LA[d] + LAn[d]) * dt;
    A = An; t += dt; step++;
    if (X.some(p => Math.hypot(p[0], p[1]) <= 0.5)) break;
    if (step % every === 0) samples.push({ X: X.map(p => [...p]), lin: [...lin] });
  }
  return { samples, dt: dt * every, tmax: Math.floor((samples.length - 1) * dt * every * 100 + 1e-6) / 100 };
}

function fallingCloud(el, cfg) {
  const sn = cfg.snap ?? 0.25, scale = cfg.scale ?? 1;
  const GM = cfg.GM ?? 8, r0 = cfg.r0 ?? 0.2, N = Math.max(3, Math.round(cfg.N ?? 12));
  const views = (cfg.views ?? FC_VIEWS).filter(k => FC_VIEWS.includes(k));
  const c0of = v => (Array.isArray(v) ? v[0] : v) ?? 2;
  const init = () => ({
    c: c0of(cfg.c0), zoom: cfg.zoom ?? 5, t: cfg.t ?? 0,
    view: views.includes(cfg.view) ? cfg.view : views[views.length - 1] ?? 'both',
    linear: !!cfg.linear,
  });
  let st = init();
  // offsets: 0 = center, 1..N = the cloud (angle 2πk/N from the outer side), then outer, inner, side for the readout
  const offs = [[0, 0]];
  for (let k = 0; k < N; k++) offs.push([r0 * Math.cos(2 * Math.PI * k / N), r0 * Math.sin(2 * Math.PI * k / N)]);
  offs.push([r0, 0], [-r0, 0], [0, r0]);
  const iO = N + 1, iI = N + 2, iS = N + 3;
  let run = null, runC = null;
  const ensureRun = () => { if (runC !== st.c) { run = fcRun(GM, st.c, offs, 12); runC = st.c; } };
  const tmaxNow = () => Math.min(cfg.tmax ?? Infinity, run.tmax);

  const BS = { x: -0.5, y: -2.75, w: 5.5, h: 5.5 }, BF = { x: -3, y: -3, w: 6, h: 6 };
  const mk = (box, name, aria) => {
    const { svg, layers } = planeSvg(box, aria, ['other', 'trace', 'cloud', 'arrows', 'marks', 'labels', 'handles']);
    const cap = h('div', { class: 'rg-cap', html: mdInline(name) });
    return { svg, L: layers, cap, wrap: h('div', { class: 'rg-panel' }, svg, cap) };
  };
  const PS = mk(BS, 'sources chart $(x^1, x^2)$', 'Sources chart: the mass at the origin and the cloud falling toward it, stretching');
  const PF = mk(BF, 'falling chart', 'Falling chart, magnified: the center stays fixed and the circle of particles turns into an egg, with the tidal accelerations');
  const panels = h('div', { class: 'cc-panels rg-panels' }, PS.wrap, PF.wrap);
  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', min: 0, step: 0.01, 'aria-label': 'absolute time t' });
  slider.addEventListener('input', () => { stop(); st.t = +slider.value; draw(); });
  const tOut = h('span', { class: 'pt-lam' });
  let anim = null;
  const playBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => play() }, 'Play');
  const viewBtns = views.length > 1 ? views.map(k => h('button', { class: 'btn ghost', type: 'button', 'data-view': k,
    onclick: () => { st.view = k; draw(); } }, FC_WORD[k])) : [];
  const linBtn = cfg.linearToggle === false ? null : h('button', { class: 'btn ghost', type: 'button',
    onclick: () => { st.linear = !st.linear; draw(); } }, 'Linear');
  const btns = h('div', { class: 'wbtns' },
    playBtn, viewBtns, linBtn,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      stop();
      if (pr.c0 != null) st.c = c0of(pr.c0);
      if (pr.linear != null) st.linear = !!pr.linear;
      st.t = pr.t ?? 0;
      draw();
    } }, pr.label)));
  el.append(panels, h('label', { class: 'wslider' }, tOut, slider), readout, btns);

  function stop() { if (anim) cancelAnimationFrame(anim); anim = null; playBtn.textContent = 'Play'; }
  function play() {
    if (anim) return stop();
    const T = tmaxNow();
    if (st.t >= T - 1e-9) st.t = 0;
    const tStart = st.t, dur = 7000 * (T - tStart) / T;
    let t0 = null;
    const step = tm => {
      if (!el.isConnected) return stop();
      if (t0 === null) t0 = tm;
      const u = Math.min(1, (tm - t0) / dur);
      st.t = tStart + (T - tStart) * u; draw();
      if (u < 1) anim = requestAnimationFrame(step); else stop();
    };
    playBtn.textContent = 'Pause';
    anim = requestAnimationFrame(step);
  }

  // the start c0 of the center, draggable along the x¹ axis (resets t = 0)
  let hc = null;
  if (cfg.drag !== false) {
    hc = s('circle', { r: 0.16, class: 'w-handle rg-h', tabindex: 0, 'aria-label': 'start of the center, c0' });
    PS.L.handles.append(hc);
    hc.addEventListener('pointerdown', e => {
      e.preventDefault(); stop();
      hc.setPointerCapture(e.pointerId);
      const move = ev => {
        const q = PS.svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
        const m = q.matrixTransform(PS.svg.getScreenCTM().inverse());
        let c = Math.max(1.25, Math.min(BS.x + BS.w - 0.5, m.x));
        if (sn) c = Math.round(c / sn) * sn;
        st.c = c; st.t = 0; draw();
      };
      const up = () => { hc.removeEventListener('pointermove', move); hc.removeEventListener('pointerup', up); hc.removeEventListener('pointercancel', up); };
      hc.addEventListener('pointermove', move); hc.addEventListener('pointerup', up); hc.addEventListener('pointercancel', up);
    });
  }

  const pts = arr => arr.map(p => P(...p).join(',')).join(' ');
  const dot = (L, p, r, cls) => { const [cx, cy] = P(...p); L.append(s('circle', { cx, cy, r, class: cls })); };
  // arrow from a by F, capped at length cap
  const capArrow = (L, a, F, cls, cap) => {
    const len = Math.hypot(...F);
    if (len < 1e-3) return;
    const f = len > cap ? cap / len : 1;
    L.append(arrow(a, [a[0] + f * F[0], a[1] + f * F[1]], cls));
  };

  function draw() {
    ensureRun();
    for (const Pn of [PS, PF]) for (const k of ['other', 'trace', 'cloud', 'arrows', 'marks', 'labels']) Pn.L[k].replaceChildren();
    const T = tmaxNow();
    st.t = Math.max(0, Math.min(T, st.t));
    slider.max = T; slider.value = st.t;
    tOut.innerHTML = tex(`t = ${fmt(st.t)}`);
    for (const b of viewBtns) b.className = `btn ${b.dataset.view === st.view ? 'primary' : 'ghost'}`;
    if (linBtn) linBtn.className = `btn ${st.linear ? 'primary' : 'ghost'}`;
    PS.wrap.style.display = st.view === 'falling' ? 'none' : '';
    PF.wrap.style.display = st.view === 'sources' ? 'none' : '';
    panels.classList.toggle('single', st.view !== 'both');
    PF.cap.innerHTML = mdInline(`falling chart $y = x - b(t)$, magnified $\\times${fmt(st.zoom)}$`);

    const idx = Math.min(run.samples.length - 1, Math.round(st.t / run.dt));
    const { X, lin } = run.samples[idx];
    const b = X[0], r = Math.hypot(...b), k = GM / r ** 3;
    const eta = i => [X[i][0] - b[0], X[i][1] - b[1]];
    const accX = x => { const q = Math.hypot(...x) ** 3; return [-GM * x[0] / q, -GM * x[1] / q]; };
    const ab = accX(b);
    const rel = i => { const a = accX(X[i]); return [a[0] - ab[0], a[1] - ab[1]]; };
    // Riem^α₀β₀ = ∂β∂αφ at b = (r, 0): diag(−2GM/r³, GM/r³)
    const linA = e => [2 * k * e[0], -k * e[1]];
    const cloudIdx = Array.from({ length: N }, (_, j) => j + 1);

    // sources panel
    PS.L.labels.append(label([BS.x + BS.w - 0.3, -0.6], 'x¹', ''), label([0.3, BS.y + BS.h - 0.3], 'x²', ''));
    dot(PS.L.marks, [0, 0], 0.13, 'fc-mass');
    PS.L.labels.append(label([0, -0.42], 'M', ''));
    PS.L.trace.append(s('polyline', { points: pts([[st.c, 0], b]), class: 'fc-path' }));
    PS.L.cloud.append(s('polygon', { points: pts(cloudIdx.map(i => X[i])), class: 'fc-outline' }));
    for (const i of cloudIdx) dot(PS.L.cloud, X[i], 0.045, 'fc-dot');
    dot(PS.L.marks, b, 0.05, 'fc-center');
    if (hc) placeHandle(hc, [st.c, 0]);
    PS.L.labels.append(label([st.c, 0.45], 'c₀', 'small'));

    // falling panel (display = zoom × y)
    const z = st.zoom, Z = p => [z * p[0], z * p[1]];
    PF.L.labels.append(label([BF.x + BF.w - 0.3, -0.3], 'y¹', ''), label([0.3, BF.y + BF.h - 0.3], 'y²', ''));
    PF.L.other.append(s('circle', { cx: 0, cy: 0, r: z * r0, class: 'fc-start' }));
    if (st.linear) {
      const ell = [];
      for (let j = 0; j <= 96; j++) { const a = 2 * Math.PI * j / 96; ell.push(Z([lin[0] * r0 * Math.cos(a), lin[1] * r0 * Math.sin(a)])); }
      PF.L.trace.append(s('polyline', { points: pts(ell), class: 'fc-lin' }));
    }
    PF.L.cloud.append(s('polygon', { points: pts(cloudIdx.map(i => Z(eta(i)))), class: 'fc-outline' }));
    const cap = 1.5;
    for (const i of cloudIdx) {
      const p = Z(eta(i));
      if (cfg.arrows !== false) capArrow(PF.L.arrows, p, rel(i).map(v => scale * v), 'fc-tide', cap);
      if (st.linear) capArrow(PF.L.arrows, p, linA(eta(i)).map(v => scale * v), 'fc-tide lin', cap);
      dot(PF.L.cloud, p, 0.09, 'fc-dot');
    }
    dot(PF.L.marks, [0, 0], 0.1, 'fc-center');

    // readout
    const f3 = x => (Math.abs(x) < 5e-4 ? '0' : String(Math.round(x * 1000) / 1000));
    const p3 = ([a, c]) => `(${f3(a)}, ${f3(c)})`;
    const eO = eta(iO), eI = eta(iI), eS = eta(iS);
    const rows = [
      h('div', { class: 'wide', html: mdInline(`Mass at the origin, $G_NM = ${fmt(GM)}$. Cloud: ${N} free particles on a circle of radius $${fmt(r0)}$ around $c_0 = (${fmt(st.c)}, 0)$, at rest at $t = 0$.`) }),
      h('div', { class: 'wide', html: mdInline(`At $t = ${fmt(st.t)}$ the center is at $b = ${p3(b)}$, so $r = |b| = ${f3(r)}$.`) }),
      h('div', { class: 'wide', html: mdInline(`$\\mathrm{Riem}^1{}_{010} = -2G_NM/r^3 = ${f3(-2 * k)}$, $\\mathrm{Riem}^2{}_{020} = G_NM/r^3 = ${f3(k)}$.`) }),
      h('div', { class: 'wide cb-tag', html: mdInline(`Their sum is $${f3(-k)}$; with $\\mathrm{Riem}^3{}_{030} = ${f3(k)}$ the full trace is $0 = \\mathrm{Ric}_{00}$ (vacuum).`) }),
      h('div', { class: 'wide c-vec', html: mdInline(`Offsets $\\eta = x - b$: outer $${p3(eO)}$, inner $${p3(eI)}$, side $${p3(eS)}$.`) }),
    ];
    if (st.linear)
      rows.push(h('div', { class: 'wide cb-tag', html: mdInline(`Linear prediction (dashed curve): outer $${f3(lin[0] * r0)}$, inner $${f3(-lin[0] * r0)}$, side $${f3(lin[1] * r0)}$.`) }));
    if (cfg.arrows !== false)
      rows.push(h('div', { class: 'wide fc-gold', html: mdInline(`Tidal acceleration, outer: $${p3(rel(iO))}$; side: $${p3(rel(iS))}$.${st.linear ? ` Linear $-\\mathrm{Riem}^\\alpha{}_{0\\beta0}\\eta^\\beta$: $${p3(linA(eO))}$ and $${p3(linA(eS))}$.` : ''}`) }));
    readout.replaceChildren(...rows);
  }
  draw();
}

// ---------------------------------------------------------------------------
// light-cones
//
// A 1+1 spacetime picture (a across, τ up) with a Lorentzian metric of
// signature (+, −) from a preset, all of the form
//   g = dτ⊗dτ − k² σ⊗σ,  σ := da − s(a) dτ,
// so g_p(X, Y) = X^τ Y^τ − k² (X^a − s X^τ)(Y^a − s Y^τ) for components in the
// order (a, τ). Null directions at p: X^a = (s ± 1/k) X^τ. Time orientation
// ᛏ = ±(s, 1), with g(ᛏ, ᛏ) = 1. Drawn: the light cone at a draggable p (two
// null lines, ink), its future half shaded green, ᛏ(p) (green arrow), a
// draggable vector 𝒳_p (blue, drawn from p), optionally small cones on a grid.
// Readout: the metric and its components at p, the components of 𝒳_p,
// g_p(𝒳_p, 𝒳_p) in numbers with timelike / lightlike / spacelike, and
// g_p(ᛏ(p), 𝒳_p) with future / past directed (causal vectors only).
//
// config:
//   metric: 'minkowski' | 'tilted' | 'scaled', views: [...] (buttons offered)
//   p: [0, 0], X: [1, 2] (components (X^a, X^τ)), snap: 0.5 (p), snapX: 0.25,
//   nullSnap: true, field: false, orientation: true | 'down' | false,
//   flip: false (button), badge: true (class words), dragP, dragX: true,
//   view: { x: -3, y: -2.5, w: 6, h: 5 }, presets: [{ label, metric, p, X, orientation }]
// ---------------------------------------------------------------------------
const LC_METRICS = {
  minkowski: { name: 'Minkowski', k: 1, s: () => 0, md: 'g = d\\tau\\otimes d\\tau - da\\otimes da',
    q: '(X^\\tau)^2 - (X^a)^2', b: '\\text{ᛏ}^\\tau X^\\tau - \\text{ᛏ}^a X^a' },
  tilted: { name: 'Tilted', k: 1, s: a => a / 4,
    md: 'g = d\\tau\\otimes d\\tau - \\sigma\\otimes\\sigma$, with $\\sigma := da - s\\,d\\tau$ and $s := a/4',
    q: '(X^\\tau)^2 - (X^a - sX^\\tau)^2', b: '\\text{ᛏ}^\\tau X^\\tau - (\\text{ᛏ}^a - s\\text{ᛏ}^\\tau)(X^a - sX^\\tau)' },
  scaled: { name: 'Scaled', k: 2, s: () => 0, md: 'g = d\\tau\\otimes d\\tau - 4\\,da\\otimes da',
    q: '(X^\\tau)^2 - 4(X^a)^2', b: '\\text{ᛏ}^\\tau X^\\tau - 4\\,\\text{ᛏ}^a X^a' },
};
const lcG = (M, a, X, Y) => { const s = M.s(a); return X[1] * Y[1] - M.k * M.k * (X[0] - s * X[1]) * (Y[0] - s * Y[1]); };

function lightCones(el, cfg) {
  const sn = cfg.snap ?? 0.5, snX = cfg.snapX ?? 0.25;
  const views = (cfg.views ?? [cfg.metric ?? 'minkowski']).filter(k => LC_METRICS[k]);
  const view = cfg.view ?? { x: -3, y: -2.5, w: 6, h: 5 };
  const f3 = x => (Math.abs(x) < 5e-4 ? '0' : String(Math.round(x * 1000) / 1000));
  const par = x => (f3(x).startsWith('-') ? `(${f3(x)})` : f3(x));
  const oriOf = o => (o === false ? 0 : o === 'down' ? -1 : 1);
  const init = () => ({
    m: LC_METRICS[cfg.metric] ? cfg.metric : views[0] ?? 'minkowski',
    p: [...(cfg.p ?? [0, 0])], X: [...(cfg.X ?? [1, 2])], ori: oriOf(cfg.orientation ?? true),
  });
  let st = init();
  const { svg, layers: L } = planeSvg(view, 'Spacetime with the light cone at p, its future half, the time orientation and a vector X at p',
    ['field', 'cone', 'arrows', 'marks', 'labels', 'handles']);
  const readout = h('div', { class: 'readout' });
  const mBtns = views.length > 1 ? views.map(k => h('button', { class: 'btn ghost', type: 'button', 'data-m': k,
    onclick: () => { st.m = k; draw(); } }, LC_METRICS[k].name)) : [];
  const flipBtn = cfg.flip && st.ori ? h('button', { class: 'btn ghost', type: 'button',
    html: mdInline('Flip $\\text{ᛏ}$'), onclick: () => { st.ori = -st.ori; draw(); } }) : null;
  const btns = h('div', { class: 'wbtns' }, mBtns, flipBtn,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      if (pr.metric && LC_METRICS[pr.metric]) st.m = pr.metric;
      if (pr.p) st.p = [...pr.p];
      if (pr.X) st.X = [...pr.X];
      if (pr.orientation != null) st.ori = oriOf(pr.orientation);
      draw();
    } }, pr.label)));
  el.append(h('div', { class: 'cc-panels single' }, svg), readout, btns);

  // the two null directions at a with X^τ of sign sg (unit Euclidean length):
  // for ᛏ = sg (s, 1) these are the future ones
  const nulls = (M, a, sg = 1) => [1, -1].map(e => {
    const d = [M.s(a) + e / M.k, 1], n = Math.hypot(...d);
    return [sg * d[0] / n, sg * d[1] / n];
  });
  const svgPt = ev => {
    const q = svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
    const m = q.matrixTransform(svg.getScreenCTM().inverse());
    return [m.x, -m.y];
  };
  const clampV = ([x, y], mg = 0.2) => [Math.max(view.x + mg, Math.min(view.x + view.w - mg, x)), Math.max(view.y + mg, Math.min(view.y + view.h - mg, y))];
  const drag = (hd, onMove) => hd.addEventListener('pointerdown', e => {
    e.preventDefault();
    hd.setPointerCapture(e.pointerId);
    const move = ev => { onMove(svgPt(ev)); draw(); };
    const up = () => { hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); };
    hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
  });
  const xh = cfg.dragX === false ? null : s('circle', { r: 0.22, class: 'w-handle vec', tabindex: 0, 'aria-label': 'tip of the vector X at p' });
  const ph = cfg.dragP === false ? null : s('circle', { r: 0.2, class: 'w-handle cv-bend', tabindex: 0, 'aria-label': 'the point p' });
  if (xh) {
    L.handles.append(xh);
    drag(xh, m => {
      const t = clampV(m), raw = [t[0] - st.p[0], t[1] - st.p[1]];
      let X = raw.map(v => (snX ? Math.round(v / snX) * snX : v));
      // magnet: onto a null line when the pointer is close to it (X^τ stays on the snap grid)
      if (cfg.nullSnap !== false && Math.hypot(...raw) > 0.3)
        for (const d of nulls(LC_METRICS[st.m], st.p[0]))
          if (Math.abs(raw[0] * d[1] - raw[1] * d[0]) < 0.15) {
            const xt = Math.round(raw[1] / snX) * snX || Math.sign(raw[1]) * snX;
            X = [xt * d[0] / d[1], xt];
          }
      st.X = X;
    });
  }
  if (ph) {
    L.handles.append(ph);
    drag(ph, m => { st.p = clampV(m, 0.25).map(v => (sn ? Math.round(v / sn) * sn : v)); });
  }

  const inside = ([x, y]) => [Math.max(view.x + 0.4, Math.min(view.x + view.w - 0.45, x)), Math.max(view.y + 0.22, Math.min(view.y + view.h - 0.22, y))];
  // label of 𝒳ₚ: beyond the tip, else beside it (either side), else clamped
  const xLab = (tip, X, xl) => {
    const u = [X[0] / xl, X[1] / xl], n = [u[1], -u[0]];
    const c = [[tip[0] + 0.38 * u[0] - 0.22 * u[1], tip[1] + 0.38 * u[1] + 0.22 * u[0]],
      [tip[0] + 0.5 * n[0], tip[1] + 0.5 * n[1]], [tip[0] - 0.5 * n[0], tip[1] - 0.5 * n[1]]];
    return c.find(q => inside(q).every((v, i) => Math.abs(v - q[i]) < 1e-9)) ?? inside(c[0]);
  };
  const wedge = (q, d1, d2, r) => s('polygon', { points: [q, [q[0] + r * d1[0], q[1] + r * d1[1]], [q[0] + r * d2[0], q[1] + r * d2[1]]].map(v => P(...v).join(',')).join(' '), class: 'lc-future' });
  function cone(layer, M, q, r, sg, cls) {
    const [d1, d2] = nulls(M, q[0], sg || 1);
    if (sg) layer.append(wedge(q, d1, d2, r));
    for (const d of [d1, d2]) layer.append(line([q[0] - r * d[0], q[1] - r * d[1]], [q[0] + r * d[0], q[1] + r * d[1]], cls));
    return [d1, d2];
  }

  function draw() {
    for (const k of ['field', 'cone', 'arrows', 'marks', 'labels']) L[k].replaceChildren();
    const M = LC_METRICS[st.m], p = st.p, X = st.X, a = p[0], sg = st.ori;
    for (const bt of mBtns) bt.className = `btn ${bt.dataset.m === st.m ? 'primary' : 'ghost'}`;
    L.labels.append(label([view.x + view.w - 0.25, -0.28], 'a', ''));
    L.labels.append(label([0.25, view.y + view.h - 0.25], 'τ', ''));

    if (cfg.field)
      for (let i = Math.ceil(view.x + 0.4); i <= view.x + view.w - 0.4; i++)
        for (let j = Math.ceil(view.y + 0.4); j <= view.y + view.h - 0.4; j++)
          if (Math.hypot(i - p[0], j - p[1]) > 0.7) cone(L.field, M, [i, j], 0.32, sg, 'lc-null thin');

    // the cone at p: future half shaded, two null lines; ᛏ(p)
    const [d1, d2] = cone(L.cone, M, p, 30, sg, 'lc-null');
    const T = sg ? [sg * M.s(a), sg] : null;
    if (sg) {
      const ax = [d1[0] + d2[0], d1[1] + d2[1]], n = Math.hypot(...ax), u = [ax[0] / n, ax[1] / n];
      const ok = q => q[0] > view.x + 0.6 && q[0] < view.x + view.w - 0.6 && q[1] > view.y + 0.25 && q[1] < view.y + view.h - 0.25;
      for (const [k, word] of [[1, 'future'], [-1, 'past']]) {
        const q = [1.75, 1.4].map(r => [p[0] + k * r * u[0], p[1] + k * r * u[1]]).find(ok);
        if (q) L.labels.append(label(q, word, 'small lc-word'));
      }
      L.arrows.append(arrow(p, [p[0] + T[0], p[1] + T[1]], 'lc-tau'));
      L.labels.append(label(inside([p[0] + T[0] + 0.45, p[1] + T[1] - 0.12]), 'ᛏ(p)', 'lc-tau lc-rune'));
    }
    const tip = [p[0] + X[0], p[1] + X[1]], xl = Math.hypot(...X) || 1;
    L.arrows.append(arrow(p, tip, 'w-vec lc-x'));
    L.labels.append(label(xLab(tip, X, xl), '𝒳ₚ', 'vec'));
    L.marks.append(s('circle', { cx: P(...p)[0], cy: P(...p)[1], r: 0.08, class: 'cv-dot' }));
    L.labels.append(label([p[0] - 0.32, p[1] - 0.3], 'p', ''));
    if (ph) placeHandle(ph, p);
    if (xh) placeHandle(xh, tip);

    // readout
    const s0 = M.s(a), k2 = M.k * M.k, tilt = st.m === 'tilted', words = cfg.badge !== false;
    const zero = Math.hypot(...X) < 1e-9, gq = lcG(M, a, X, X), nullX = Math.abs(gq) < 1e-9;
    const cls = nullX ? 'lightlike' : gq > 0 ? 'timelike' : 'spacelike';
    const sq = v => `${par(v)}^2`, kk = k2 === 1 ? '' : `${k2}\\cdot `;
    const qn = tilt ? `${sq(X[1])} - ${sq(X[0] - s0 * X[1])}` : `${sq(X[1])} - ${kk}${sq(X[0])}`;
    const nl = [s0 + 1 / M.k, s0 - 1 / M.k];
    const rows = [
      h('div', { class: 'wide', html: mdInline(`Metric (${M.name}): $${M.md}$.`) }),
      h('div', { class: 'wide cb-tag', html: mdInline(`At $p = (${f3(p[0])}, ${f3(p[1])})$${tilt ? `, $s = ${f3(s0)}$` : ''}; components in the order $(a, \\tau)$: $g_{aa} = ${f3(-k2)}$, $g_{a\\tau} = ${f3(k2 * s0)}$, $g_{\\tau\\tau} = ${f3(1 - k2 * s0 * s0)}$.`) }),
      h('div', { class: 'wide', html: mdInline(`Light cone at $p$: the null lines spanned by $(${f3(nl[0])}, 1)$ and $(${f3(nl[1])}, 1)$.`) }),
      h('div', { class: 'wide c-vec', html: mdInline(`Components of $\\mathcal{X}_p$ in the order $(a, \\tau)$: $X^a = ${f3(X[0])}$, $X^\\tau = ${f3(X[1])}$.`) }),
    ];
    if (zero) rows.push(h('div', { class: 'wide', html: mdInline('$\\mathcal{X}_p = 0$: only non-zero vectors are classified.') }));
    else rows.push(h('div', { class: 'wide', html: mdInline(`$g_p(\\mathcal{X}_p, \\mathcal{X}_p) = ${M.q}$ $= ${qn} = ${f3(gq)}$${words ? `, ${nullX ? 'zero' : gq > 0 ? 'positive' : 'negative'}: **${cls}**` : ''}.`) }));
    let gb = 0;
    if (sg) {
      gb = lcG(M, a, T, X);
      const bn = tilt ? `${par(T[1])}\\cdot ${par(X[1])} - ${par(T[0] - s0 * T[1])}\\cdot ${par(X[0] - s0 * X[1])}`
        : `${par(T[1])}\\cdot ${par(X[1])} - ${kk}${par(T[0])}\\cdot ${par(X[0])}`;
      rows.push(h('div', { class: 'wide lc-green', html: mdInline(`Time orientation $\\text{ᛏ}(p) = (${f3(T[0])}, ${f3(T[1])})$, with $g_p(\\text{ᛏ}(p), \\text{ᛏ}(p)) = ${f3(lcG(M, a, T, T))} > 0$.`) }));
      if (!zero) {
        const tail = !words ? '' : gq < -1e-9 ? '; spacelike vectors are neither future nor past directed'
          : `, ${gb > 0 ? 'positive' : 'negative'}: **${gb > 0 ? 'future' : 'past'} directed**`;
        rows.push(h('div', { class: 'wide', html: mdInline(`$g_p(\\text{ᛏ}(p), \\mathcal{X}_p) = ${M.b}$ $= ${bn} = ${f3(gb)}$${tail}.`) }));
      }
    }
    if (words && !zero) {
      const dir = sg && gq >= -1e-9 ? (gb > 0 ? ', future directed' : ', past directed') : '';
      const where = cls === 'timelike' ? 'inside the cone' : cls === 'lightlike' ? 'on the cone' : 'outside the cone';
      rows.push(h('div', { class: `wide ${cls === 'timelike' ? 'ok' : cls === 'lightlike' ? 'lc-gold' : 'lc-space'}`,
        html: mdInline(`$\\mathcal{X}_p$ is **${cls}${dir}** (${where}).`) }));
    }
    readout.replaceChildren(...rows);
  }
  draw();
}

// ---------------------------------------------------------------------------
// worldline-clock
//
// A 1+1 spacetime (a across, τ up, components in the order (a, τ)) with a
// metric from LC_METRICS and the time orientation ᛏ = (s, 1). A worldline γ
// from A = (0, 0) to B = (0, T): straight pieces through 1–2 draggable kinks
// (λ ∈ [0, n], one unit of λ per piece, so v_γ = the piece's displacement),
// or a quadratic Bézier with a draggable control point C (λ ∈ [0, 2],
// u = λ/2, γ = 2u(1−u)C + u²B). Small light cones along γ with v_γ (blue,
// drawn at scale vScale), a λ slider with Play, the dot and its clock.
// Readout: v_γ(λ), g(v_γ, v_γ) with ᛇ_γ, s_γ = √(ᛇ g(v, v)), the running
// ∫ s_γ dλ (proper time when γ is massive so far) against the chart τ of the
// dot, and the badge "Massive worldline?". Pieces where v_γ is spacelike or
// past directed are red, lightlike ones gold. compare: the straight worldline
// A → B (dashed, same λ range, its own dot and clock). massless (minkowski
// only): kinks constrained so that every piece is null.
//
// config:
//   metric: 'minkowski' | 'tilted' | 'scaled', T: 10, shape: 'kinks' | 'bend',
//   kinks: [[3, 5]] (1 or 2 points), bend: [4, 5], massless: false,
//   compare: false, cones: 4, vScale: 0.3, lambda: 0, snap: 0.5, drag: true,
//   view: { x: -0.6T, y: -0.1T, w: 1.2T, h: 1.25T },
//   presets: [{ label, shape, kinks, bend, lambda }]
// ---------------------------------------------------------------------------
function worldlineClock(el, cfg) {
  const T = cfg.T ?? 10;
  const mName = LC_METRICS[cfg.metric] ? cfg.metric : 'minkowski', M = LC_METRICS[mName];
  const massless = !!cfg.massless && mName === 'minkowski';
  const view = cfg.view ?? { x: -0.6 * T, y: -0.1 * T, w: 1.2 * T, h: 1.25 * T };
  const k = view.h / 5.8, sv = { x: view.x / k, y: view.y / k, w: view.w / k, h: view.h / k };
  const S = ([x, y]) => [x / k, y / k];
  const sn = cfg.snap ?? 0.5, vS = cfg.vScale ?? 0.3, nC = cfg.cones ?? 4;
  const f3 = x => (Math.abs(x) < 5e-4 ? '0' : String(Math.round(x * 1000) / 1000));
  const par = x => (f3(x).startsWith('-') ? `(${f3(x)})` : f3(x));
  const pt = q => `(${f3(q[0])}, ${f3(q[1])})`;
  const B = [0, T];
  const init = () => {
    const K = (cfg.kinks ?? [[3, 5]]).slice(0, 2).map(q => [...q]);
    return { shape: cfg.shape === 'bend' ? 'bend' : 'kinks', K, C: [...(cfg.bend ?? [4, 5])],
      mx: K[0][0] || 1, f: 0 };
  };
  let st = init();
  const Lam = () => (st.shape === 'bend' ? 2 : kinkPts().length - 1);
  const setLam = lam => { st.f = Math.max(0, Math.min(1, (lam ?? 0) / Lam())); };
  setLam(cfg.lambda);

  // the kinks actually used (massless: forced onto null lines)
  function kinkPts() {
    if (!massless) return [[0, 0], ...st.K, B];
    const sg = Math.sign(st.mx) || 1;
    if (st.K.length < 2) return [[0, 0], [sg * T / 2, T / 2], B];
    const x = sg * Math.max(sn, Math.min(T / 2 - sn, Math.abs(st.mx)));
    return [[0, 0], [x, Math.abs(x)], [x - sg * T / 2, Math.abs(x) + T / 2], B];
  }
  // position and velocity at λ
  function at(lam) {
    if (st.shape === 'bend') {
      const u = lam / 2, C = st.C;
      return { q: [2 * u * (1 - u) * C[0] + u * u * B[0], 2 * u * (1 - u) * C[1] + u * u * B[1]],
        v: [(1 - u) * C[0] + u * (B[0] - C[0]), (1 - u) * C[1] + u * (B[1] - C[1])] };
    }
    const Pk = kinkPts(), n = Pk.length - 1, i = Math.max(0, Math.min(n - 1, Math.floor(lam))), t = lam - i;
    const v = [Pk[i + 1][0] - Pk[i][0], Pk[i + 1][1] - Pk[i][1]];
    return { q: [Pk[i][0] + t * v[0], Pk[i][1] + t * v[1]], v };
  }
  // class of the velocity at q: time | null | space | zero, and future?
  function cls(q, v) {
    const vv = v[0] * v[0] + v[1] * v[1];
    if (vv < 1e-12) return { c: 'zero', g: 0, gb: 0, fut: false };
    const g = lcG(M, q[0], v, v), gb = lcG(M, q[0], [M.s(q[0]), 1], v);
    return { c: Math.abs(g) < 1e-9 * (vv + 1) ? 'null' : g > 0 ? 'time' : 'space', g, gb, fut: gb > 0 };
  }
  const sOf = (q, v) => Math.sqrt(Math.abs(lcG(M, q[0], v, v)));
  const tag = c => ({ c, ok: c.c === 'time' && c.fut, nul: c.c === 'null' && c.fut });
  const NPU = 200;
  // samples: midpoints of the λ grid with their class, cumulative ∫ s dλ (midpoint rule)
  function sample() {
    const Lm = Lam(), N = Lm * NPU, cum = [0], mids = [];
    for (let j = 0; j < N; j++) {
      const lm = (j + 0.5) * Lm / N, { q, v } = at(lm);
      mids.push({ lm, ...tag(cls(q, v)) });
      cum.push(cum[j] + sOf(q, v) * Lm / N);
    }
    const ends = st.shape === 'bend' ? [0, Lm].map(lm => { const { q, v } = at(lm); return { lm, ...tag(cls(q, v)) }; }) : [];
    return { Lm, N, cum, mids, ends };
  }
  const intTo = (smp, lam) => {
    const j = Math.min(smp.N - 1, Math.floor(lam / smp.Lm * smp.N)), l0 = j * smp.Lm / smp.N;
    if (lam <= l0) return smp.cum[j];
    const { q, v } = at((l0 + lam) / 2);
    return smp.cum[j] + sOf(q, v) * (lam - l0);
  };

  const { svg, layers: L } = planeSvg(sv, 'Spacetime with a worldline from A to B, light cones along it, a moving dot and its clock',
    ['curve', 'cone', 'arrows', 'marks', 'labels', 'handles']);
  // grid and ticks in world units
  L.grid.replaceChildren();
  for (let i = Math.ceil(view.x); i <= view.x + view.w; i++)
    L.grid.append(line(S([i, view.y]), S([i, view.y + view.h]), i === 0 ? 'w-axis' : 'w-grid'));
  for (let j = Math.ceil(view.y); j <= view.y + view.h; j++)
    L.grid.append(line(S([view.x, j]), S([view.x + view.w, j]), j === 0 ? 'w-axis' : 'w-grid'));
  const tk = T >= 8 ? 2 : 1;
  for (let j = tk; j <= view.y + view.h - 0.3 * k; j += tk)
    L.grid.append(label([sv.x + 0.22, j / k], String(j), 'tick'));
  for (let i = Math.ceil(view.x / tk) * tk; i <= view.x + view.w - 0.4 * k; i += tk)
    if (i !== 0 && i > view.x + 0.5 * k) L.grid.append(label([i / k, -0.2], String(i), 'tick'));
  L.grid.append(label([sv.x + sv.w - 0.22, 0.22], 'a', ''), label([0.3, sv.y + sv.h - 0.22], 'τ', ''));

  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', min: 0, max: 1, step: 0.0025, 'aria-label': 'curve parameter lambda' });
  slider.addEventListener('input', () => { stop(); st.f = +slider.value; draw(); });
  const tOut = h('span', { class: 'pt-lam' });
  let anim = null;
  const playBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => play() }, 'Play');
  const btns = h('div', { class: 'wbtns' }, playBtn,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); st = init(); setLam(cfg.lambda); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      stop();
      if (pr.shape) st.shape = pr.shape === 'bend' ? 'bend' : 'kinks';
      if (pr.kinks) { st.K = pr.kinks.slice(0, 2).map(q => [...q]); st.mx = st.K[0][0] || 1; }
      if (pr.bend) st.C = [...pr.bend];
      setLam(pr.lambda);
      draw();
    } }, pr.label)));
  el.append(h('div', { class: 'cc-panels single' }, svg), h('label', { class: 'wslider' }, tOut, slider), readout, btns);

  function stop() { if (anim) cancelAnimationFrame(anim); anim = null; playBtn.textContent = 'Play'; }
  function play() {
    if (anim) return stop();
    if (st.f >= 1 - 1e-9) st.f = 0;
    const f0 = st.f, dur = 8000 * (1 - f0);
    let t0 = null;
    const step = tm => {
      if (!el.isConnected) return stop();
      if (t0 === null) t0 = tm;
      const u = Math.min(1, (tm - t0) / dur);
      st.f = f0 + (1 - f0) * u; draw();
      if (u < 1) anim = requestAnimationFrame(step); else stop();
    };
    playBtn.textContent = 'Pause';
    anim = requestAnimationFrame(step);
  }

  // handles: pointer → world point, clamped to the view and snapped
  const svgW = ev => {
    const q = svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
    const m = q.matrixTransform(svg.getScreenCTM().inverse());
    const w = [m.x * k, -m.y * k], mg = 0.25 * k;
    return [Math.max(view.x + mg, Math.min(view.x + view.w - mg, w[0])), Math.max(view.y + mg, Math.min(view.y + view.h - mg, w[1]))]
      .map(z => (sn ? Math.round(z / sn) * sn : z));
  };
  const dragOn = (hd, onMove) => hd.addEventListener('pointerdown', e => {
    e.preventDefault(); stop();
    hd.setPointerCapture(e.pointerId);
    const move = ev => { onMove(svgW(ev)); draw(); };
    const up = () => { hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); };
    hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
  });
  const mkH = aria => s('circle', { r: 0.2, class: 'w-handle cv-bend', tabindex: 0, 'aria-label': aria });
  const kH = [0, 1].map(i => mkH(`kink K${i + 1} of the worldline`));
  const cH = mkH('control point C of the bent worldline');
  if (cfg.drag !== false) {
    dragOn(kH[0], w => { if (massless) st.mx = w[0] || st.mx; else st.K[0] = w; });
    dragOn(kH[1], w => { if (!massless) st.K[1] = w; });
    dragOn(cH, w => { st.C = w; });
  }

  const wedge = (q, d1, d2, r) => s('polygon', { points: [q, [q[0] + r * d1[0], q[1] + r * d1[1]], [q[0] + r * d2[0], q[1] + r * d2[1]]].map(v => P(...v).join(',')).join(' '), class: 'lc-future' });
  function cone(q, r) {  // q in world units, r in screen units; ᛏ = (s, 1) gives the future half
    const sq = S(q), ds = [1, -1].map(e => { const d = [M.s(q[0]) + e / M.k, 1], n = Math.hypot(...d); return [d[0] / n, d[1] / n]; });
    L.cone.append(wedge(sq, ds[0], ds[1], r));
    for (const d of ds) L.cone.append(line([sq[0] - r * d[0], sq[1] - r * d[1]], [sq[0] + r * d[0], sq[1] + r * d[1]], 'lc-null thin'));
  }
  const vArrow = (q, v) => L.arrows.append(arrow(S(q), S([q[0] + vS * v[0], q[1] + vS * v[1]]), 'w-vec lc-x'));
  function clock(q, val, side, on) {  // one turn of the hand = T
    const c = [S(q)[0] + side * 0.62, S(q)[1] + 0.05], th = 2 * Math.PI * val / T, g = s('g', { class: `wc-clock${on ? '' : ' off'}` });
    g.append(s('circle', { cx: P(...c)[0], cy: P(...c)[1], r: 0.3 }));
    g.append(line([c[0], c[1] + 0.3], [c[0], c[1] + 0.22], ''));
    g.append(line(c, [c[0] + 0.24 * Math.sin(th), c[1] + 0.24 * Math.cos(th)], ''));
    L.marks.append(g);
    L.labels.append(label([c[0], c[1] - 0.47], on ? f3(val) : '–', 'small'));
  }
  const sub = ['₁', '₂'];
  const dot = (q, r, cl) => L.marks.append(s('circle', { cx: P(...S(q))[0], cy: P(...S(q))[1], r, class: cl }));

  function draw() {
    for (const n of ['curve', 'cone', 'arrows', 'marks', 'labels']) L[n].replaceChildren();
    const smp = sample(), Lm = smp.Lm, lam = st.f * Lm, Pk = kinkPts(), ms = smp.mids;
    slider.value = st.f;
    tOut.innerHTML = tex(`\\lambda = ${f3(lam)}`);

    // the curve, in runs of one kind: ok (ink), null (gold), bad (red)
    const kindOf = m => (m.ok ? 'ok' : m.nul ? 'null' : 'bad');
    let run = [], kind = null;
    const flush = () => { if (run.length > 1) L.curve.append(s('polyline', { points: run.map(q => P(...S(q)).join(',')).join(' '), class: `wc-curve ${kind}` })); };
    for (let j = 0; j < ms.length; j++) {
      const kd = kindOf(ms[j]), l0 = j * Lm / smp.N, l1 = (j + 1) * Lm / smp.N;
      if (kd !== kind) { flush(); run = [at(l0).q]; kind = kd; }
      run.push(at(Math.min(l1, Lm - 1e-12)).q);
    }
    if (st.shape === 'kinks' && run.length) run[run.length - 1] = B;
    flush();
    if (cfg.compare) L.curve.append(line(S([0, 0]), S(B), 'wc-straight'));
    if (st.shape === 'bend') L.curve.append(line(S([0, 0]), S(st.C), 'wc-ctrl'), line(S(st.C), S(B), 'wc-ctrl'));

    // small cones along γ with v_γ
    for (let c = 0; c < nC; c++) {
      const { q, v } = at(Lm * (c + 0.5) / nC);
      cone(q, 0.38); vArrow(q, v);
    }
    // end points, kinks, handles
    dot([0, 0], 0.07, 'cv-dot'); dot(B, 0.07, 'cv-dot');
    L.labels.append(label([S([0, 0])[0] + 0.3, S([0, 0])[1] + 0.22], 'A', ''), label([S(B)[0] + 0.32, S(B)[1] + 0.05], 'B', ''));
    for (const hd of [...kH, cH]) hd.remove();
    if (st.shape === 'kinks') Pk.slice(1, -1).forEach((q, i) => {
      const rt = q[0] >= 0 ? S(q)[0] + 0.45 < sv.x + sv.w - 0.2 : S(q)[0] - 0.45 < sv.x + 0.2;
      L.labels.append(label([S(q)[0] + (rt ? 0.45 : -0.45), S(q)[1] + 0.05], `K${sub[i]}`, ''));
      if (cfg.drag !== false && (!massless || i === 0)) { L.handles.append(kH[i]); placeHandle(kH[i], S(q)); }
      else dot(q, 0.07, 'cv-dot');
    });
    else {
      L.labels.append(label([S(st.C)[0] + 0.4, S(st.C)[1] + 0.05], 'C', ''));
      if (cfg.drag !== false) { L.handles.append(cH); placeHandle(cH, S(st.C)); }
    }

    // the dot: cone, velocity, clock
    const { q, v } = at(Math.min(lam, Lm)), c = cls(q, v);
    const massiveSoFar = ms.every(m => m.lm > lam + 1e-9 || m.ok) && (st.shape !== 'bend' || smp.ends[0].ok);
    const tp = intTo(smp, lam), total = smp.cum[smp.N];
    cone(q, 0.5); vArrow(q, v);
    dot(q, 0.11, 'wc-dot');
    const side = q[0] >= 0 ? 1 : -1;
    clock(q, tp, side, massiveSoFar);
    const v0 = [0, T / Lm], s0S = Math.sqrt(Math.max(0, lcG(M, 0, v0, v0))), tStr = lam * s0S;
    if (cfg.compare) {
      const qS = [0, lam * T / Lm];
      dot(qS, 0.1, 'wc-dot');
      clock(qS, tStr, -side, true);
    }

    // readout
    const tilt = mName === 'tilted', s0 = M.s(q[0]), kk = M.k * M.k === 1 ? '' : `${M.k * M.k}\\cdot `;
    const shapeTxt = st.shape === 'bend'
      ? `Worldline $\\gamma(\\lambda) = 2u(1-u)\\,C + u^2B$ with $u = \\lambda/2$, $C = ${pt(st.C)}$, from $A = (0, 0)$ to $B = ${pt(B)}$; $\\lambda\\in[0, 2]$.`
      : `Worldline $\\gamma$ from $A = (0, 0)$ to $B = ${pt(B)}$ through ${Pk.slice(1, -1).map((p, i) => `$K_${i + 1} = ${pt(p)}$`).join(' and ')}: straight pieces, $\\lambda\\in[0, ${Lm}]$, one unit of $\\lambda$ per piece.`;
    const sgn = c.c === 'time' ? '+1' : c.c === 'space' ? '-1' : '0';
    const qn = tilt ? `${par(v[1])}^2 - ${par(v[0] - s0 * v[1])}^2` : `${par(v[1])}^2 - ${kk}${par(v[0])}^2`;
    const word = c.c === 'time' ? 'timelike' : c.c === 'null' ? 'lightlike' : 'spacelike';
    const dirTxt = c.c === 'space' ? 'spacelike vectors are neither future nor past directed'
      : `$g(\\text{ᛏ}, v_\\gamma) = ${f3(c.gb)}$, ${c.fut ? 'positive: future directed' : 'negative: past directed'}`;
    const rows = [
      h('div', { class: 'wide', html: mdInline(`Metric (${M.name}): $${M.md}$; time orientation $\\text{ᛏ} = (${tilt ? 's' : '0'}, 1)$, future halves of the cones shaded.`) }),
      h('div', { class: 'wide cb-tag', html: mdInline(shapeTxt) }),
      h('div', { class: 'wide', html: mdInline(`At $\\lambda = ${f3(lam)}$ the dot is at $\\gamma(\\lambda) = ${pt(q)}$ (chart coordinates $(a, \\tau)$${tilt ? `; there $s = ${f3(s0)}$` : ''}).`) }),
      h('div', { class: 'wide c-vec', html: mdInline(`Velocity $v_\\gamma(\\lambda)$: components $${pt(v)}$ in the order $(a, \\tau)$ (blue arrows, drawn at scale $${f3(vS)}$).`) }),
      c.c === 'zero' ? h('div', { class: 'wide', html: mdInline('$v_\\gamma(\\lambda) = 0$: the zero vector gets no class.') })
        : h('div', { class: 'wide', html: mdInline(`$g(v_\\gamma, v_\\gamma) = ${qn} = ${f3(c.g)}$, so $\\text{ᛇ}_\\gamma(\\lambda) = ${sgn}$: **${word}**; ${dirTxt}.`) }),
      h('div', { class: 'wide', html: mdInline(`Speed $s_\\gamma(\\lambda) = \\sqrt{\\text{ᛇ}_\\gamma\\, g(v_\\gamma, v_\\gamma)} = ${f3(sOf(q, v))}$.`) }),
      massiveSoFar
        ? h('div', { class: 'wide lc-green', html: mdInline(`**Proper time** so far (the dot's clock): $\\tau_{[0, \\lambda]}[\\gamma] = \\int_0^{\\lambda} s_\\gamma\\,d\\lambda = ${f3(tp)}$${lam >= Lm - 1e-9 ? ', reached at $B$' : ''}.`) })
        : h('div', { class: 'wide', html: mdInline(`$\\int_0^{\\lambda} s_\\gamma\\,d\\lambda = ${f3(tp)}$ is **not a proper time**: $v_\\gamma$ was not timelike and future directed all the way (the clock is greyed).`) }),
      h('div', { class: 'wide cb-tag', html: mdInline(`Chart coordinate of the dot: $\\tau = ${f3(q[1])}$. It labels the event in the chart; it is not the time on the dot's clock.`) }),
    ];
    if (cfg.compare)
      rows.push(h('div', { class: 'wide', html: mdInline(`Straight worldline $A\\to B$ (dashed, same $\\lambda$): $v = ${pt(v0)}$, $s = ${f3(s0S)}$, proper time so far $${f3(tStr)}$. At $B$: $${f3(Lm * s0S)}$ straight, against $${f3(total)}$ along $\\gamma$.`) }));
    // badge
    const all = [...ms, ...smp.ends];
    const firstRange = test => {
      const j0 = ms.findIndex(test);
      if (j0 < 0) return null;
      let j1 = j0; while (j1 + 1 < ms.length && test(ms[j1 + 1])) j1++;
      return `$\\lambda\\in[${f3(j0 * Lm / smp.N)}, ${f3((j1 + 1) * Lm / smp.N)}]$`;
    };
    let badge;
    if (all.every(m => m.ok))
      badge = h('div', { class: 'wide ok', html: mdInline(`Massive worldline? **Yes**: $v_\\gamma$ is timelike and future directed for every $\\lambda$ ($\\text{ᛇ}_\\gamma \\equiv +1$); proper time from $A$ to $B$: $${f3(total)}$.`) });
    else if (all.every(m => m.nul))
      badge = h('div', { class: 'wide lc-gold', html: mdInline('Massive worldline? **No**: $v_\\gamma$ is lightlike, future directed and non-zero for every $\\lambda$: a **massless** worldline ($\\text{ᛇ}_\\gamma \\equiv 0$, $s_\\gamma \\equiv 0$).') });
    else {
      const why = [];
      const rz = firstRange(m => m.c.c === 'zero'); if (rz) why.push(`zero for ${rz}`);
      const rs = firstRange(m => m.c.c === 'space'); if (rs) why.push(`spacelike for ${rs}`);
      const rp = firstRange(m => (m.c.c === 'time' || m.c.c === 'null') && !m.c.fut); if (rp) why.push(`past directed for ${rp}`);
      const rn = firstRange(m => m.nul); if (rn) why.push(`lightlike for ${rn}`);
      if (!why.length) why.push('not timelike and future directed at an end point');
      badge = h('div', { class: 'wide wc-bad-text', html: mdInline(`Massive worldline? **No**: $v_\\gamma$ is ${why.join('; ')}.`) });
    }
    rows.push(badge);
    readout.replaceChildren(...rows);
  }
  draw();
}

// ---------------------------------------------------------------------------
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
// ---------------------------------------------------------------------------
function observerFrame(el, cfg) {
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

// ---------------------------------------------------------------------------
// area-cell
//
// What √det g measures. Left: the chart's coordinates, with a square cell of
// side Δ centred at p (gold; p draggable, Δ on a slider). Right: the
// manifold, with the cell's true image (gold) and the parallelogram spanned
// by Δ ∂/∂α¹, Δ ∂/∂α² around p (purple), of area √det g(p) Δ². The readout
// compares true area / Δ² with √det g(p). Charts in AC_CHARTS (first
// coordinate across, second up); the sphere is drawn in orthographic
// projection, turned to face the cell.
// ---------------------------------------------------------------------------
const ac3 = x => (Math.abs(x) < 5e-4 ? '0' : String(Math.round(x * 1000) / 1000));
const acPar = x => (ac3(x).startsWith('-') ? `(${ac3(x)})` : ac3(x));
const acDot = (u, w) => u.reduce((t, x, i) => t + x * w[i], 0);
// real: the domain edges that are boundaries of the chart (0, 1 = min, max of
// the first coordinate; 2, 3 = of the second), drawn dashed
const AC_CHARTS = {
  cartesian: {
    c: ['x', 'y'], g: ['x', 'y'], ang: [false, false], dom: [[-2.5, 2.5], [-2.5, 2.5]], real: [], steps: [0.5, 0.5],
    rule: 'Euclidean plane, cartesian chart $(x, y)$.',
    X: q => q, D: () => [[1, 0], [0, 1]],
    exact: (p, d) => [d * d, `a square of side $\\Delta$: $\\Delta^2 = ${ac3(d * d)}$`],
  },
  polar: {
    c: ['r', '\\theta'], g: ['r', 'θ'], ang: [false, true], dom: [[0, 3.2], [-Math.PI, Math.PI]], real: [0, 2, 3], steps: [0.5, Math.PI / 8],
    rule: 'Euclidean plane, polar chart $(r, \\theta)$ with $r > 0$, $\\theta\\in(-\\pi, \\pi)$: the point $(r\\cos\\theta,\\ r\\sin\\theta)$.',
    X: ([r, t]) => [r * Math.cos(t), r * Math.sin(t)],
    D: ([r, t]) => [[Math.cos(t), Math.sin(t)], [-r * Math.sin(t), r * Math.cos(t)]],
    exact: ([r], d) => {
      const r1 = r - d / 2, r2 = r + d / 2, A = d * (r2 * r2 - r1 * r1) / 2;
      return [A, `a ring sector: $\\tfrac12\\Delta\\,(r_2^2 - r_1^2)$ $= \\tfrac12\\cdot${ac3(d)}\\cdot(${ac3(r2)}^2 - ${ac3(r1)}^2) = ${ac3(A)}$`];
    },
  },
  sphere: {
    c: ['\\vartheta', '\\varphi'], g: ['ϑ', 'φ'], ang: [true, true], dom: [[0, Math.PI], [-Math.PI, Math.PI]], real: [0, 1, 2, 3], steps: [Math.PI / 12, Math.PI / 12], sphere: true,
    rule: 'Unit sphere, chart $(\\vartheta, \\varphi)$ with $\\vartheta\\in(0, \\pi)$, $\\varphi\\in(-\\pi, \\pi)$: the point $(\\sin\\vartheta\\cos\\varphi,\\ \\sin\\vartheta\\sin\\varphi,\\ \\cos\\vartheta)$ of $\\mathbb{R}^3$.',
    X: ([t, f]) => [Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)],
    D: ([t, f]) => [[Math.cos(t) * Math.cos(f), Math.cos(t) * Math.sin(f), -Math.sin(t)], [-Math.sin(t) * Math.sin(f), Math.sin(t) * Math.cos(f), 0]],
    exact: ([t], d) => {
      const c1 = Math.cos(t - d / 2), c2 = Math.cos(t + d / 2), A = d * (c1 - c2);
      return [A, `a piece of the zone between two latitudes (Archimedes): $\\Delta\\,(\\cos\\vartheta_1 - \\cos\\vartheta_2)$ $= ${ac3(d)}\\cdot(${ac3(c1)} - ${acPar(c2)}) = ${ac3(A)}$`];
    },
  },
  sheared: {
    c: ['a', 'b'], g: ['a', 'b'], ang: [false, false], dom: [[-1.2, 1.2], [-1.2, 1.2]], real: [], steps: [0.25, 0.25],
    rule: 'Euclidean plane, sheared chart $(a, b)$: the point $(2a + b,\\ b)$.',
    X: ([a, b]) => [2 * a + b, b], D: () => [[2, 0], [1, 1]],
    exact: (p, d) => [2 * d * d, `a parallelogram with base $2\\Delta$ and height $\\Delta$: $2\\Delta^2 = ${ac3(2 * d * d)}$`],
  },
};

function areaCell(el, cfg) {
  const SN = cfg.snap ?? 0.05, RS = 3, dMin = cfg.dmin ?? 0.05, dMax = cfg.dmax ?? 1;
  const mv = { x: -3.45, y: -3.45, w: 6.9, h: 6.9 };
  const init = () => ({ chart: AC_CHARTS[cfg.chart] ? cfg.chart : 'polar', p: [...(cfg.p ?? [1.25, Math.PI / 4])], d: cfg.d ?? 0.5 });
  let st = init(), C, A, M, cs, hd;
  const panels = h('div', { class: 'cc-panels' });
  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', min: dMin, max: dMax, step: 0.01, 'aria-label': 'side Δ of the coordinate cell' });
  slider.addEventListener('input', () => { st.d = +slider.value; clampP(); draw(); });
  const dOut = h('span', { class: 'ac-gold' });
  const apply = next => { const c = st.chart; st = next; if (st.chart !== c) build(); clampP(); draw(); };
  const btns = h('div', { class: 'wbtns' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => apply(init()) }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => apply({
      chart: AC_CHARTS[pr.chart] ? pr.chart : st.chart, p: [...(pr.p ?? st.p)], d: pr.d ?? st.d }) }, pr.label)));
  el.append(panels, cfg.slider === false ? '' : h('label', { class: 'wslider' }, dOut, slider), readout, btns);

  // keep the whole cell inside the chart's domain
  const clampP = () => {
    st.d = Math.max(dMin, Math.min(dMax, st.d));
    const m = st.d / 2 + 0.02;
    st.p = st.p.map((v, i) => Math.max(C.dom[i][0] + m, Math.min(C.dom[i][1] - m, v)));
  };

  function build() {
    C = AC_CHARTS[st.chart];
    const [[a0, a1], [b0, b1]] = C.dom;
    const cv = { x: a0 - 0.65, y: b0 - 0.5, w: a1 - a0 + 1.15, h: b1 - b0 + 1 };
    let ms;
    ({ svg: cs, layers: A } = planeSvg(cv, `The chart's coordinates (${C.g.join(', ')}) with a square cell of side Δ around p`,
      ['dom', 'lat', 'cell', 'arrows', 'marks', 'labels', 'handles']));
    ({ svg: ms, layers: M } = planeSvg(mv, `The ${C.sphere ? 'unit sphere' : 'plane'} with the image of the cell and the parallelogram of the chart basis at p`,
      ['lat', 'cell', 'par', 'arrows', 'marks', 'labels']));
    A.grid.replaceChildren();
    if (C.sphere) M.grid.replaceChildren();
    hd = null;
    if (cfg.drag !== false) {
      hd = s('circle', { r: 0.2, class: 'w-handle gold', tabindex: 0, 'aria-label': 'centre p of the cell' });
      A.handles.append(hd);
      hd.addEventListener('pointerdown', e => {
        e.preventDefault();
        hd.setPointerCapture(e.pointerId);
        const move = ev => {
          const q = cs.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
          const m = q.matrixTransform(cs.getScreenCTM().inverse());
          st.p = [m.x, -m.y].map(v => (SN ? Math.round(v / SN) * SN : v));
          clampP(); draw();
        };
        const up = () => { hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); };
        hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
      });
    }
    panels.replaceChildren(cs, ms);
  }

  const pts = a => a.map(v => P(...v).join(',')).join(' ');
  const pl = (a, cls) => s('polyline', { points: pts(a), class: cls });
  const pg = (a, cls) => s('polygon', { points: pts(a), class: cls });
  const seg = (q0, q1, n) => Array.from({ length: n + 1 }, (_, k) => [q0[0] + (q1[0] - q0[0]) * k / n, q0[1] + (q1[1] - q0[1]) * k / n]);
  const add = (...vs) => vs.reduce((a, b) => a.map((x, i) => x + b[i]));
  const sc = (k, v) => v.map(x => k * x);
  const tickTxt = (i, v) => (C.ang[i] ? { '-2': '−π', '-1': '−π/2', 0: '0', 1: 'π/2', 2: 'π' }[Math.round(v / (Math.PI / 2))] : String(v).replace('-', '−'));

  function draw() {
    for (const k of ['dom', 'lat', 'cell', 'arrows', 'marks', 'labels']) A[k].replaceChildren();
    for (const k of ['lat', 'cell', 'par', 'arrows', 'marks', 'labels']) M[k].replaceChildren();
    const [[a0, a1], [b0, b1]] = C.dom, [p1, p2] = st.p, d = st.d, h2 = d / 2;
    slider.value = d; dOut.innerHTML = tex(`\\Delta = ${ac3(d)}`);

    // the manifold's drawing map: the plane as it is; the sphere seen from
    // the direction of the cell (elevation capped so a pole stays in sight)
    let proj = v => v, vis = () => true;
    if (C.sphere) {
      const az = p2, ev = Math.max(-1, Math.min(1, Math.PI / 2 - p1));
      const R = [-Math.sin(az), Math.cos(az), 0], U = [-Math.sin(ev) * Math.cos(az), -Math.sin(ev) * Math.sin(az), Math.cos(ev)];
      const V = [Math.cos(ev) * Math.cos(az), Math.cos(ev) * Math.sin(az), Math.sin(ev)];
      proj = v => [RS * acDot(v, R), RS * acDot(v, U)];
      vis = v => acDot(v, V) > -1e-9;
      M.lat.append(s('circle', { cx: 0, cy: 0, r: RS, class: 'ac-outline' }));
    }
    // a curve given by chart points, drawn where it is on the visible side
    const curve = (qs, cls) => {
      let run = [];
      const flush = () => { if (run.length > 1) M.lat.append(pl(run, cls)); run = []; };
      for (const q of qs) { const v = C.X(q); if (vis(v)) run.push(proj(v)); else flush(); }
      flush();
    };

    // chart panel: domain, its real boundary dashed, axes, ticks
    A.dom.append(pg([[a0, b0], [a1, b0], [a1, b1], [a0, b1]], 'ac-dom'));
    const edges = [[[a0, b0], [a0, b1]], [[a1, b0], [a1, b1]], [[a0, b0], [a1, b0]], [[a0, b1], [a1, b1]]];
    for (const k of C.real) { A.dom.append(line(...edges[k], 'ac-cut')); curve(seg(...edges[k], 72), 'ac-cut'); }
    if (b0 < 0 && b1 > 0) A.dom.append(line([a0, 0], [a1, 0], 'w-axis'));
    if (a0 < 0 && a1 > 0) A.dom.append(line([0, b0], [0, b1], 'w-axis'));
    for (const i of [0, 1]) {
      const [lo, hi] = C.dom[i], u = C.ang[i] ? Math.PI / 2 : 1;
      for (let k = Math.ceil(lo / u - 1e-9); k * u <= hi + 1e-9; k++)
        A.labels.append(label(i ? [a0 - 0.33, k * u] : [k * u, b0 - 0.25], tickTxt(i, k * u), 'tick'));
    }
    A.labels.append(label([a1 + 0.3, b0 - 0.25], C.g[0]), label([a0 - 0.33, b1 + 0.32], C.g[1]));
    // coordinate lines, the same ones in both panels
    for (const i of [0, 1]) {
      const [lo, hi] = C.dom[i], sp = C.steps[i];
      for (let k = Math.ceil((lo + 1e-9) / sp); k * sp < hi - 1e-9; k++) {
        const v = k * sp, e = i ? [[a0, v], [a1, v]] : [[v, b0], [v, b1]];
        A.lat.append(line(...e, 'w-lattice'));
        if (cfg.lattice !== false) curve(seg(...e, 72), 'w-lattice ac-lat');
      }
    }
    // the poles, labelled on the side away from the cell
    const poles = [];
    if (C.sphere) for (const [v, t] of [[[0, 0, 1], 'N'], [[0, 0, -1], 'S']]) if (vis(v)) {
      const q = proj(v), c = proj(C.X(st.p)), o = [q[0] - c[0], q[1] - c[1]], lo = Math.hypot(...o) || 1;
      const ql = Math.hypot(...q) > 0.3 ? [q[0] + 0.32 * q[0] / Math.hypot(...q), q[1] + 0.32 * q[1] / Math.hypot(...q)] : [q[0] + 0.3 * o[0] / lo, q[1] + 0.3 * o[1] / lo];
      M.marks.append(s('circle', { cx: q[0], cy: -q[1], r: 0.07, class: 'cv-dot' }));
      M.labels.append(label(ql, t, 'small'));
      poles.push(q, ql);
    }

    // the cell: a square in the chart, its true image on the manifold
    const sq = [[p1 - h2, p2 - h2], [p1 + h2, p2 - h2], [p1 + h2, p2 + h2], [p1 - h2, p2 + h2]];
    A.cell.append(pg(sq, 'ac-cell'));
    A.arrows.append(arrow(sq[0], sq[1], 'w-basis', 0.16), arrow(sq[0], sq[3], 'w-basis', 0.16));
    A.marks.append(s('circle', { cx: p1, cy: -p2, r: 0.06, class: 'cv-p' }));
    A.labels.append(label([p1 + h2 + 0.2, p2 + h2 + 0.2], 'p'));
    if (hd) placeHandle(hd, st.p);
    const bd = [0, 1, 2, 3].flatMap(k => seg(sq[k], sq[(k + 1) % 4], 24));
    M.cell.append(pg(bd.map(q => proj(C.X(q))), 'ac-cell'));
    // the parallelogram of Δ ∂/∂α¹, Δ ∂/∂α², centred at p
    const Xp = C.X(st.p), Dp = C.D(st.p), [u, w] = Dp.map(c => sc(d, c)), pc = proj(Xp);
    if (cfg.parallelogram !== false) {
      const c0 = add(Xp, sc(-0.5, u), sc(-0.5, w));
      const par = [c0, add(c0, u), add(c0, u, w), add(c0, w)].map(proj);
      M.par.append(pg(par, 'ac-par'));
      M.arrows.append(arrow(par[0], par[1], 'w-basis', 0.16), arrow(par[0], par[3], 'w-basis', 0.16));
      for (const [tip, i] of [[par[1], 0], [par[3], 1]]) {
        if (Math.hypot(tip[0] - par[0][0], tip[1] - par[0][1]) < 0.45) continue;
        const o = [tip[0] - pc[0], tip[1] - pc[1]], lo = Math.hypot(...o) || 1;
        const q = [tip[0] + 0.4 * o[0] / lo, tip[1] + 0.4 * o[1] / lo];
        if (poles.some(r => Math.hypot(q[0] - r[0], q[1] - r[1]) < 0.5)) continue;
        M.labels.append(label(q, `Δ∂${C.g[i]}`, 'small basis'));
      }
    }
    M.marks.append(s('circle', { cx: pc[0], cy: -pc[1], r: 0.07, class: 'cv-p' }));

    // readout
    const [c1, c2] = C.c, gn = (i, j) => `g_{${C.c[i]}${C.c[j]}}`, vec = v => `(${v.map(ac3).join(', ')})`;
    const g11 = acDot(Dp[0], Dp[0]), g12 = acDot(Dp[0], Dp[1]), g22 = acDot(Dp[1], Dp[1]);
    const det = g11 * g22 - g12 * g12, rt = Math.sqrt(det), Apar = rt * d * d;
    const [Aex, exTex] = C.exact(st.p, d), ratio = Aex / (d * d);
    const rows = [
      h('div', { class: 'wide', html: mdInline(C.rule) }),
      h('div', { class: 'wide ac-gold', html: mdInline(`Gold cell: $${c1}\\in[${c1}_1, ${c1}_2] = [${ac3(p1 - h2)}, ${ac3(p1 + h2)}]$, $${c2}\\in[${c2}_1, ${c2}_2] = [${ac3(p2 - h2)}, ${ac3(p2 + h2)}]$, side $\\Delta = ${ac3(d)}$ in both coordinates, centred at $p$, where $(${c1}, ${c2}) = (${ac3(p1)}, ${ac3(p2)})$. Coordinate area $\\Delta^2 = ${ac3(d * d)}$.`) }),
      h('div', { class: 'wide c-basis', html: mdInline(`At $p$: $(\\partial/\\partial ${c1})_p = ${vec(Dp[0])}$ and $(\\partial/\\partial ${c2})_p = ${vec(Dp[1])}$${C.sphere ? ', vectors of $\\mathbb{R}^3$ tangent to the sphere' : ''}.`) }),
      h('div', { class: 'wide', html: mdInline(`Metric at $p$ (dot products of these): $${gn(0, 0)} = ${ac3(g11)}$, $${gn(0, 1)} = ${ac3(g12)}$, $${gn(1, 1)} = ${ac3(g22)}$, so $\\det g = ${ac3(det)}$ and $\\sqrt{\\det g} = ${ac3(rt)}$.`) }),
    ];
    if (cfg.parallelogram !== false) {
      const naive = Math.abs(g12) > 1e-9 ? ` The product of the side lengths, $\\sqrt{${gn(0, 0)}${gn(1, 1)}}\\,\\Delta^2 = ${ac3(Math.sqrt(g11 * g22) * d * d)}$, is too big: the sides are not perpendicular.` : '';
      rows.push(h('div', { class: 'wide c-basis', html: mdInline(`Purple parallelogram, spanned by $\\Delta\\,\\partial/\\partial ${c1}$ and $\\Delta\\,\\partial/\\partial ${c2}$: area $\\sqrt{${gn(0, 0)}${gn(1, 1)} - ${gn(0, 1)}^2}\\;\\Delta^2$ $= \\sqrt{\\det g}\\;\\Delta^2 = ${ac3(rt)}\\cdot${ac3(d)}^2 = ${ac3(Apar)}$.${naive}`) }));
    }
    if (cfg.exact !== false) {
      rows.push(h('div', { class: 'wide ac-gold', html: mdInline(`The gold cell is ${exTex}.`) }));
      const same = Math.abs(ratio - rt) < 5e-4 * Math.max(1, rt);
      const tail = cfg.badge === false ? '.'
        : same ? ': **equal** (to three decimals).'
        : `: they differ by $${Math.round(Math.abs(ratio / rt - 1) * 1000) / 10 || 0.1}\\%$. Shrink $\\Delta$, and the ratio tends to $\\sqrt{\\det g}$ at $p$.`;
      rows.push(h('div', { class: `wide${same && cfg.badge !== false ? ' ok' : ''}`, html: mdInline(`True area $/\\,\\Delta^2 = ${ac3(ratio)}$ against $\\sqrt{\\det g} = ${ac3(rt)}$ at $p$${tail}`) }));
    }
    readout.replaceChildren(...rows);
  }
  build(); clampP(); draw();
}
