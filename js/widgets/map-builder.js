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

import { h } from '../dom.js';
import { label, line, s } from './plane.js';

export function mapBuilder(el, cfg) {
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
