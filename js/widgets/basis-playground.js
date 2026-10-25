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

import { h } from '../dom.js';
import { tex } from '../render.js';
import { arrow, combo, draggable, dualCombo, fmt, label, levelLines, line, placeHandle, planeSvg, s, tipLabel } from './plane.js';

export function basisPlayground(el, cfg) {
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
