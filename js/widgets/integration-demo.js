// integration-demo
//
// A toy network of 4 to 6 nodes joined by undirected links. Clicking a link slot between two
// nodes switches that link on or off. The widget finds, by brute force over all splits of the
// nodes into two non-empty groups, the weakest cut: the split that severs the least total link
// weight. That smallest crossing weight is the "toy integration" (a stand-in for IIT's phi,
// NOT real phi): 0 for a disconnected network, low for a chain, higher for a ring or a dense net.
// Reports nothing to the card.
// Config (all wording from the config; every drawn element has a switch):
//   nodes: [{ label: 'A', x: 0.1, y: 0.5 }, ...]   4 to 6 nodes, x and y in 0..1 (default: ring of 5)
//   links: [[0, 1], [1, 2, 2], ...]                 initial links, [i, j] or [i, j, weight] (weight default 1)
//   clickable: true                                 clicking a link slot toggles it (Enter/Space too)
//   cutList: 0                                      show the K smallest partitions with their cut value
//   show: { nodes, labels, links, slots, cut, groups, score, cutValue, reset }
//         defaults: nodes, labels, links, slots, cut, groups, score true; cutValue, reset false
//         (slots = faint dashed lines for absent links; cut = severed links drawn dashed in the
//          accent colour; groups = the two sides coloured; score = toy integration readout;
//          cutValue = names the two groups in text)
//   labels: { score, partition, reset, cutList, links }   (math allowed, $...$)
import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const W = 480, H = 250;

export function integrationDemo(el, cfg) {
  const L = { score: 'toy integration', partition: 'weakest cut', reset: 'Reset', cutList: 'smallest cuts', links: 'links on', ...(cfg.labels ?? {}) };
  const sh = { nodes: true, labels: true, links: true, slots: true, cut: true, groups: true, score: true, cutValue: false, reset: false, ...(cfg.show ?? {}) };
  const clickable = cfg.clickable ?? true;
  const listK = Math.max(0, Math.round(cfg.cutList ?? 0));
  const def = ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({ label: l, x: 0.5 + 0.4 * Math.cos(-Math.PI / 2 + 2 * Math.PI * i / 5), y: 0.5 + 0.4 * Math.sin(-Math.PI / 2 + 2 * Math.PI * i / 5) }));
  const nodes = (cfg.nodes?.length >= 4 && cfg.nodes.length <= 6 ? cfg.nodes : def);
  const n = nodes.length;
  const px = i => 30 + nodes[i].x * (W - 60), py = i => 28 + nodes[i].y * (H - 56);
  const pairs = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  const key = (i, j) => (i < j ? `${i}-${j}` : `${j}-${i}`);
  const init = new Map();
  for (const [a, b, w] of (cfg.links ?? [])) init.set(key(a, b), w ?? 1);
  const wt = new Map(pairs.map(([i, j]) => [key(i, j), init.get(key(i, j)) ?? 0]));
  const full = new Map(pairs.map(([i, j]) => [key(i, j), init.get(key(i, j)) ?? 1]));   // weight when switched on

  // all bipartitions: masks containing node 0 (so each split is counted once), non-empty other side
  function cuts() {
    const out = [];
    for (let m = 1; m < (1 << n) - 1; m += 2) {
      let v = 0;
      for (const [i, j] of pairs) if (((m >> i) & 1) !== ((m >> j) & 1)) v += wt.get(key(i, j));
      const a = [], b = [];
      for (let i = 0; i < n; i++) (((m >> i) & 1) ? a : b).push(i);
      out.push({ m, v, a, b });
    }
    // smallest value first; ties: most balanced, then lowest mask
    out.sort((p, q) => p.v - q.v || Math.abs(p.a.length - p.b.length) - Math.abs(q.a.length - q.b.length) || p.m - q.m);
    return out;
  }
  const names = g => g.map(i => nodes[i].label).join('');
  const fmt = v => String(Math.round(v * 100) / 100);

  el.classList.add('idm');
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'idm-svg', role: 'group', 'aria-label': 'Network of nodes and links' });
  const rd = h('div', { class: 'readout idm-read', role: 'status', 'aria-live': 'polite' });
  const list = h('div', { class: 'idm-list' });
  const bar = h('div', { class: 'wbtns idm-btns' });
  if (sh.reset) bar.append(h('button', { class: 'btn ghost', type: 'button', onclick: () => { for (const [k] of wt) wt.set(k, init.get(k) ?? 0); draw(); } }, h('span', { html: mdInline(L.reset) })));
  el.append(svg, ...(sh.reset ? [bar] : []), rd, ...(listK ? [list] : []));

  const lines = new Map();
  if (sh.links || sh.slots) {
    for (const [i, j] of pairs) {
      const k = key(i, j), g = sv('g', { class: 'idm-link' });
      const ln = sv('line', { x1: px(i), y1: py(i), x2: px(j), y2: py(j), class: 'idm-line' });
      const hit = sv('line', { x1: px(i), y1: py(i), x2: px(j), y2: py(j), class: 'idm-hit' });
      const lab = sv('text', { x: (px(i) + px(j)) / 2, y: (py(i) + py(j)) / 2 - 4, class: 'idm-w', 'text-anchor': 'middle' });
      g.append(ln, lab);
      if (clickable) {
        g.classList.add('idm-click'); g.append(hit);
        g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `Link ${nodes[i].label} to ${nodes[j].label}`);
        const flip = () => { wt.set(k, wt.get(k) > 0 ? 0 : full.get(k)); draw(); };
        g.addEventListener('click', flip);
        g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); flip(); } });
      }
      lines.set(k, { g, ln, lab }); svg.append(g);
    }
  }
  const dots = [];
  if (sh.nodes) for (let i = 0; i < n; i++) {
    const c = sv('circle', { cx: px(i), cy: py(i), r: 15, class: 'idm-node' }); svg.append(c);
    const t = sv('text', { x: px(i), y: py(i) + 5, class: 'idm-lab', 'text-anchor': 'middle' }); t.textContent = sh.labels ? nodes[i].label.replace(/\$/g, '') : '';
    svg.append(t); dots.push(c);
  }

  function draw() {
    const all = cuts(), best = all[0], inA = new Set(best.a);
    for (const [i, j] of pairs) {
      const k = key(i, j), o = lines.get(k); if (!o) continue;
      const on = wt.get(k) > 0, crossing = inA.has(i) !== inA.has(j);
      o.g.classList.toggle('idm-on', on && sh.links);
      o.g.classList.toggle('idm-off', !on);
      o.g.classList.toggle('idm-cut', on && crossing && sh.cut);
      o.g.style.display = (!on && !sh.slots) ? (clickable ? '' : 'none') : '';
      o.ln.style.strokeWidth = on ? 1.5 + 1.5 * wt.get(k) : '';
      o.lab.textContent = on && wt.get(k) !== 1 ? fmt(wt.get(k)) : '';
      if (clickable) o.g.setAttribute('aria-pressed', String(on));
      if (!sh.links && on) o.g.style.display = clickable ? '' : 'none';
    }
    dots.forEach((c, i) => { c.classList.toggle('idm-a', sh.groups && inA.has(i)); c.classList.toggle('idm-b', sh.groups && !inA.has(i)); });
    const row = (lab, val) => h('span', { class: 'idm-row' }, h('span', { class: 'idm-lbl', html: mdInline(lab) }), ' ', h('b', {}, val));
    const rows = [];
    if (sh.score) rows.push(row(L.score, fmt(best.v)));
    if (sh.cutValue) rows.push(row(L.partition, `${names(best.a)} | ${names(best.b)}`));
    rd.replaceChildren(...rows); rd.style.display = rows.length ? '' : 'none';
    if (listK) {
      list.replaceChildren(h('div', { class: 'idm-lbl', html: mdInline(L.cutList) }),
        ...all.slice(0, listK).map((c, r) => h('div', { class: 'idm-li' + (r === 0 ? ' idm-best' : '') }, `${names(c.a)} | ${names(c.b)}`, ' : ', h('b', {}, fmt(c.v)))));
    }
  }
  draw();
}
