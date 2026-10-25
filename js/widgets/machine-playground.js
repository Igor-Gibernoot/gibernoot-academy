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

import { h } from '../dom.js';
import { tex } from '../render.js';
import { P, arrow, draggable, dualCombo, fmt, label, levelLines, placeHandle, planeSvg, s, tipLabel } from './plane.js';

export function machinePlayground(el, cfg) {
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
