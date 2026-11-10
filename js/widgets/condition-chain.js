// condition-chain
//
// A chain of links in which each link conditions the next ("when this is, that is"). The reader
// clicks a link to remove it (or restore it); every link that depends on a removed one stops
// arising. Optional loop-back: the last link conditions the first, closing the chain into a cycle,
// and a switch between cyclic and linear. Reports nothing to the card.
// Rule: a link arises iff it is not removed and its condition (the previous link) arises. In the
// linear chain link 0 has no condition. In the cycle every link has one, so the cycle sustains
// itself only if no link is removed (a cycle with all links present is a steady loop; remove one
// and the stop travels round to every link).
// Config (all wording from the config; every drawn element has a switch):
//   links: ['Ignorance', 'Formations', ...]   2 to 14 labels (default: 6 letters A-F)
//   layout: 'ring' | 'row'                    ring (default) or a row of nodes
//   cyclic: true                              initial mode: the last link conditions the first
//   clickable: true                           clicking (Enter/Space) a node removes or restores it
//   toggle: false                             show a cyclic / linear switch
//   show: { labels, arrows, loop, counter, list, reset, status }
//         defaults: labels, arrows, loop, counter, status true; list, reset false
//         (labels = names inside/next to nodes; arrows = the conditioning arrows;
//          loop = the closing arrow last -> first when cyclic; counter = "k of N arising";
//          list = text list of the links that stopped; reset = restore all;
//          status = per-node colour for arising / stopped / removed)
//   removed: [2]                              links removed at the start (0-based)
//   labels: { counter, stopped, reset, cyclic, linear }   (math allowed, $...$)
import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };

export function conditionChain(el, cfg) {
  const names = (cfg.links?.length >= 2 ? cfg.links : ['A', 'B', 'C', 'D', 'E', 'F']).slice(0, 14).map(String);
  const n = names.length;
  const L = { counter: 'arising', stopped: 'stopped', reset: 'Reset', cyclic: 'Cyclic', linear: 'Linear', ...(cfg.labels ?? {}) };
  const sh = { labels: true, arrows: true, loop: true, counter: true, status: true, list: false, reset: false, ...(cfg.show ?? {}) };
  const ring = (cfg.layout ?? 'ring') !== 'row';
  const clickable = cfg.clickable ?? true;
  let cyclic = cfg.cyclic ?? false;
  const removed = new Set((cfg.removed ?? []).filter(i => i >= 0 && i < n));
  const initRemoved = new Set(removed);
  const initCyclic = cyclic;
  const W = ring ? 500 : 560, H = ring ? 330 : 170;
  const R = 15;
  const pos = i => ring
    ? [W / 2 + 118 * Math.cos(-Math.PI / 2 + 2 * Math.PI * i / n), H / 2 + 118 * Math.sin(-Math.PI / 2 + 2 * Math.PI * i / n)]
    : [30 + i * ((W - 60) / Math.max(1, n - 1)), H / 2 - 10];

  el.classList.add('ccn');
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'ccn-svg', role: 'group', 'aria-label': 'Chain of conditioned links' });
  const defs = sv('defs');
  const mk = sv('marker', { id: `ccn-ah-${Math.random().toString(36).slice(2, 7)}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
  mk.append(sv('path', { d: 'M0 0 L10 5 L0 10 z', class: 'ccn-head' })); defs.append(mk); svg.append(defs);
  const rd = h('div', { class: 'readout ccn-read', role: 'status', 'aria-live': 'polite' });
  const list = h('div', { class: 'ccn-list' });
  const bar = h('div', { class: 'wbtns ccn-btns' });
  const btnC = h('button', { class: 'btn ghost', type: 'button', onclick: () => { cyclic = true; draw(); } }, h('span', { html: mdInline(L.cyclic) }));
  const btnL = h('button', { class: 'btn ghost', type: 'button', onclick: () => { cyclic = false; draw(); } }, h('span', { html: mdInline(L.linear) }));
  if (cfg.toggle) bar.append(btnC, btnL);
  if (sh.reset) bar.append(h('button', { class: 'btn ghost', type: 'button', onclick: () => { removed.clear(); initRemoved.forEach(i => removed.add(i)); cyclic = initCyclic; draw(); } }, h('span', { html: mdInline(L.reset) })));
  el.append(svg, ...(bar.children.length ? [bar] : []), rd, ...(sh.list ? [list] : []));

  // arrows i -> i+1 (and the loop n-1 -> 0)
  const arrows = [];
  if (sh.arrows) for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, isLoop = i === n - 1;
    if (isLoop && !sh.loop) { arrows.push(null); continue; }
    const [x1, y1] = pos(i), [x2, y2] = pos(j);
    let d;
    if (isLoop && !ring) {
      d = `M ${x1} ${y1 + R} C ${x1} ${y1 + 70}, ${x2} ${y2 + 70}, ${x2} ${y2 + R + 4}`;
    } else {
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      d = `M ${x1 + ux * (R + 2)} ${y1 + uy * (R + 2)} L ${x2 - ux * (R + 5)} ${y2 - uy * (R + 5)}`;
    }
    const p = sv('path', { d, class: 'ccn-arrow', 'marker-end': `url(#${mk.id})` });
    svg.append(p); arrows.push(p);
  }
  const nodes = [], labs = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = pos(i);
    const g = sv('g', { class: 'ccn-node' });
    const c = sv('circle', { cx: x, cy: y, r: R, class: 'ccn-dot' });
    const num = sv('text', { x, y: y + 5, class: 'ccn-num', 'text-anchor': 'middle' }); num.textContent = String(i + 1);
    g.append(c, num);
    if (sh.labels) {
      const t = sv('text', { x, y: ring ? y + (y < H / 2 - 5 ? -R - 7 : R + 16) : y + R + 16, class: 'ccn-lab', 'text-anchor': ring ? (x < W / 2 - 8 ? 'end' : x > W / 2 + 8 ? 'start' : 'middle') : 'middle' });
      if (ring) { t.setAttribute('x', x + (x < W / 2 - 8 ? -R - 5 : x > W / 2 + 8 ? R + 5 : 0)); t.setAttribute('y', Math.abs(x - W / 2) <= 8 ? (y < H / 2 ? y - R - 7 : y + R + 16) : y + 5); }
      t.textContent = names[i].replace(/\$/g, ''); g.append(t); labs.push(t);
    }
    if (clickable) {
      g.classList.add('ccn-click'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `Link ${i + 1}: ${names[i]}`);
      const flip = () => { removed.has(i) ? removed.delete(i) : removed.add(i); draw(); };
      g.addEventListener('click', flip);
      g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); flip(); } });
    }
    svg.append(g); nodes.push(g);
  }

  // which links arise: start from "arising" for all non-removed links, then iterate the rule
  function arising() {
    const on = names.map((_, i) => !removed.has(i));
    for (let it = 0; it < n + 1; it++) {
      let ch = false;
      for (let i = 0; i < n; i++) {
        if (!on[i]) continue;
        const prev = i === 0 ? (cyclic ? n - 1 : -1) : i - 1;
        if (prev >= 0 && !on[prev]) { on[i] = false; ch = true; }
      }
      if (!ch) break;
    }
    return on;
  }
  function draw() {
    const on = arising();
    nodes.forEach((g, i) => {
      const isRem = removed.has(i);
      g.classList.toggle('ccn-on', sh.status && on[i]);
      g.classList.toggle('ccn-removed', sh.status && isRem);
      g.classList.toggle('ccn-stopped', sh.status && !on[i] && !isRem);
      if (clickable) g.setAttribute('aria-pressed', String(isRem));
    });
    arrows.forEach((p, i) => {
      if (!p) return;
      const isLoop = i === n - 1;
      p.style.display = isLoop && !cyclic ? 'none' : '';
      p.classList.toggle('ccn-live', sh.status && on[i]);
    });
    btnC.classList.toggle('ccn-act', cyclic); btnL.classList.toggle('ccn-act', !cyclic);
    const k = on.filter(Boolean).length;
    const rows = [];
    if (sh.counter) rows.push(h('span', { class: 'ccn-row' }, h('b', {}, `${k} / ${n}`), ' ', h('span', { class: 'ccn-lbl', html: mdInline(L.counter) })));
    rd.replaceChildren(...rows); rd.style.display = rows.length ? '' : 'none';
    if (sh.list) {
      const st = names.filter((_, i) => !on[i]);
      list.replaceChildren(h('span', { class: 'ccn-lbl', html: mdInline(L.stopped) }), ' : ', st.length ? st.join(', ') : '-');
    }
  }
  draw();
}
