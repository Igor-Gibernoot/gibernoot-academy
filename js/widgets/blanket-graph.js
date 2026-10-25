// blanket-graph
//
// A small graph of coupled sets of states (default: external x, sensory y, active a, internal mu,
// the four sets of a Markov blanket). Arrows are toggles. The widget lists the directly connected
// pairs and, on request, "conditions on the blanket" (greys out the blanket nodes) and tests
// whether the internal and external sets are then independent: graph test = no undirected path
// from an external node to an internal node that avoids the blanket nodes (for flows, an arrow
// is a nonzero dependence of one set's flow on another). A leaking arrow (e.g. x -> mu) flips
// the verdict to "not a blanket" and is named. No maths is hard-coded: all wording is config.
//
//   nodes: [{ id, label, role, hue, pos: [x, y] }]
//        role: 'external' | 'internal' | 'sensory' | 'active' (external/internal are the two
//        sets tested for independence; any other role is just a node). hue: 0-360 (hsl).
//        pos: position in a 400 x 230 box. Defaults = the 4 nodes below.
//   edges: [{ from, to, on, editable, w }]   from == to is a self-loop. Only listed arrows exist.
//        editable: reader may toggle it (click the arrow or its chip). w: weight (simulation).
//   blanket: [ids]               the nodes conditioned on (default: roles sensory + active)
//   editable: true               default for edges that do not say (default false)
//   showVerdict: true            show the independence verdict (false: hide it, e.g. to ask first)
//   showList: true               show the "directly connected" list
//   showChips: true              toggle chips under the picture for the editable arrows
//   simulate: false              add flows: z' = -z + gain * sum_parents w*tanh(z_parent) + noise
//        gain 1.5, noise 0.6, dt 0.05, seed 7, with a trace plot and Play / Pause / Restart
//   labels: { list, none, condition, uncondition, reset, play, pause, restart, flows, linked,
//             indep, notBlanket, leak, because, path, given, nolink, and, via }
//   presets: [{ label, edges: ['x>y', 'a>x', 'y>mu', ...] }]   ids of the arrows that are ON
//        (others off). Also { label, conditioned: true } may be given.
//   conditioned: false           start conditioned

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const M = src => h('span', { html: mdInline(String(src)) });
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  kids.flat().forEach(c => c && e.append(c));
  return e;
};
const R = 27, W = 400, H = 230;
const DEFAULT_NODES = [
  { id: 'x', label: 'x', role: 'external', hue: 140, pos: [52, 115] },
  { id: 'y', label: 'y', role: 'sensory', hue: 48, pos: [170, 46] },
  { id: 'a', label: 'a', role: 'active', hue: 350, pos: [170, 184] },
  { id: 'mu', label: '\\mu', role: 'internal', hue: 188, pos: [348, 115] },
];
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

// exported for tests: undirected search from `from` ids to `to` ids avoiding `blocked` ids.
// edges: [{from,to}] (self-loops ignored). Returns the list of nodes on a path, or null.
export function findPath(edges, from, to, blocked = []) {
  const bl = new Set(blocked), prev = new Map(), q = [];
  from.forEach(s => { if (!bl.has(s)) { prev.set(s, null); q.push(s); } });
  while (q.length) {
    const u = q.shift();
    if (to.includes(u)) { const p = []; for (let v = u; v != null; v = prev.get(v)) p.unshift(v); return p; }
    for (const e of edges) {
      if (e.from === e.to) continue;
      const v = e.from === u ? e.to : e.to === u ? e.from : null;
      if (v != null && !bl.has(v) && !prev.has(v)) { prev.set(v, u); q.push(v); }
    }
  }
  return null;
}

export function blanketGraph(el, cfg) {
  const nodes = (cfg.nodes ?? DEFAULT_NODES).map((n, i) => ({ pos: DEFAULT_NODES[i]?.pos ?? [W / 2, H / 2], hue: 200, ...n }));
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const L = { list: 'Directly connected', none: 'none', condition: 'Condition on the blanket', uncondition: 'Stop conditioning',
    reset: 'Reset', play: 'Play flows', pause: 'Pause', restart: 'Restart', flows: 'Flows', linked: 'Linked without conditioning',
    indep: 'independent given the blanket', notBlanket: 'Not a blanket', leak: 'Leaking arrow', because: 'Every path between them goes through',
    path: 'Path', given: 'given', nolink: 'No path links them', and: 'and', via: 'Still linked by the path', ...(cfg.labels ?? {}) };
  const blanket = cfg.blanket ?? nodes.filter(n => n.role === 'sensory' || n.role === 'active').map(n => n.id);
  const ext = nodes.filter(n => n.role === 'external').map(n => n.id);
  const int = nodes.filter(n => n.role === 'internal').map(n => n.id);
  const lab = id => byId[id]?.label ?? id;
  const edges = (cfg.edges ?? [
    { from: 'x', to: 'y', on: true }, { from: 'a', to: 'x', on: true }, { from: 'y', to: 'mu', on: true }, { from: 'mu', to: 'a', on: true },
    { from: 'x', to: 'mu', on: false, editable: true }, { from: 'mu', to: 'x', on: false, editable: true },
  ]).map(e => ({ on: false, editable: cfg.editable ?? false, w: 1, ...e, id: e.id ?? `${e.from}>${e.to}` }));
  const init = () => ({ on: Object.fromEntries(edges.map(e => [e.id, !!e.on])), cond: !!cfg.conditioned });
  let st = init();
  const showV = cfg.showVerdict !== false, showList = cfg.showList !== false, showChips = cfg.showChips !== false;

  // --- picture
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'bg-svg', role: 'img', 'aria-label': 'graph of coupled sets' });
  const defs = sv('defs');
  const marker = (id, cls) => sv('marker', { id, viewBox: '0 0 10 10', refX: 8.5, refY: 5, markerWidth: 6.5, markerHeight: 6.5, orient: 'auto-start-reverse' },
    sv('path', { d: 'M0,0 L10,5 L0,10 z', class: cls }));
  const uid = Math.random().toString(36).slice(2, 7);
  defs.append(marker(`bg-a-${uid}`, 'bg-head'), marker(`bg-l-${uid}`, 'bg-head bg-leakhead'), marker(`bg-o-${uid}`, 'bg-head bg-offhead'));
  svg.append(defs);
  const edgeG = sv('g'), nodeG = sv('g');
  svg.append(edgeG, nodeG);
  const unit = (dx, dy) => { const d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
  const geom = e => {
    const A = byId[e.from].pos, B = byId[e.to].pos;
    if (e.from === e.to) {
      const [ux, uy] = unit(A[0] - W / 2, A[1] - H / 2), cx = A[0] + ux * (R + 7), cy = A[1] + uy * (R + 7), r = 11;
      const phi = Math.atan2(-uy, -ux), p = t => `${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`;
      return { d: `M${p(phi + 0.75)} A${r},${r} 0 1 1 ${p(phi - 0.75)}`, loop: true };
    }
    const [ux, uy] = unit(B[0] - A[0], B[1] - A[1]), nx = -uy, ny = ux, bend = 13;
    const s = [A[0] + ux * R + nx * bend * 0.45, A[1] + uy * R + ny * bend * 0.45];
    const t = [B[0] - ux * (R + 2) + nx * bend * 0.45, B[1] - uy * (R + 2) + ny * bend * 0.45];
    const c = [(A[0] + B[0]) / 2 + nx * bend * 2, (A[1] + B[1]) / 2 + ny * bend * 2];
    return { d: `M${s[0].toFixed(1)},${s[1].toFixed(1)} Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${t[0].toFixed(1)},${t[1].toFixed(1)}` };
  };
  const eEls = edges.map(e => {
    const g = geom(e);
    const vis = sv('path', { d: g.d, class: 'bg-edge', fill: 'none' });
    const hit = sv('path', { d: g.d, class: 'bg-hit', fill: 'none' });
    const grp = sv('g', {}, vis, hit);
    if (e.editable) {
      grp.classList.add('bg-edit'); grp.setAttribute('tabindex', 0); grp.setAttribute('role', 'button');
      const tog = ev => { if (ev.type === 'keydown' && ev.key !== 'Enter' && ev.key !== ' ') return; ev.preventDefault(); toggle(e.id); };
      grp.addEventListener('click', tog); grp.addEventListener('keydown', tog);
    }
    edgeG.append(grp);
    return { e, vis, grp };
  });
  const nEls = nodes.map(n => {
    const c = sv('circle', { cx: n.pos[0], cy: n.pos[1], r: R, class: 'bg-node' });
    c.style.setProperty('--nh', n.hue);
    nodeG.append(c);
    return c;
  });
  const labs = nodes.map(n => {
    const d = h('div', { class: 'bg-lab', style: `left:${(n.pos[0] / W) * 100}%;top:${(n.pos[1] / H) * 100}%` }, M(`$${n.label.replace(/^\$|\$$/g, '')}$`));
    return d;
  });
  const givenTags = nodes.map(n => h('div', { class: 'bg-tag', style: `left:${(n.pos[0] / W) * 100}%;top:${((n.pos[1] + (Math.abs(n.pos[1] - H / 2) > 8 ? Math.sign(H / 2 - n.pos[1]) * (R + 9) - 6 : R + 3)) / H) * 100}%` }, M(L.given)));
  const stage = h('div', { class: 'bg-stage' }, svg, ...labs, ...givenTags);

  // --- readouts
  const listBox = h('div', { class: 'bg-read' });
  const verdictBox = h('div', { class: 'bg-verdict' });
  const chips = h('div', { class: 'wbtns bg-chips' });
  const chipEls = edges.filter(e => e.editable).map(e => {
    const b = h('button', { class: 'btn ghost', type: 'button', 'aria-pressed': 'false', onclick: () => toggle(e.id) },
      M(e.from === e.to ? `$${lab(e.from)}\\circlearrowright$` : `$${lab(e.from)}\\to ${lab(e.to)}$`));
    chips.append(b);
    return { e, b };
  });
  const condBtn = h('button', { class: 'btn', type: 'button', onclick: () => { st.cond = !st.cond; draw(); } });
  const resetBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); resetSim(); draw(); } }, L.reset);
  const presetBtns = (cfg.presets ?? []).map(p => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
    if (p.edges) edges.forEach(e => { st.on[e.id] = p.edges.includes(e.id); });
    if (p.conditioned != null) st.cond = p.conditioned;
    draw();
  } }, M(p.label)));
  const toggle = id => { st.on[id] = !st.on[id]; draw(); };

  // --- flows
  let sim = null, trace = null, playBtn = null, timer = null;
  function resetSim() {
    if (!cfg.simulate) return;
    const r = rng(cfg.seed ?? 7);
    sim = { z: nodes.map(() => 0), r, hist: [], t: 0 };
    for (let i = 0; i < 400; i++) stepSim();
    redrawTrace();
  }
  function stepSim() {
    const dt = cfg.dt ?? 0.05, g = cfg.gain ?? 1.5, sg = cfg.noise ?? 0.6, z = sim.z;
    const nz = z.map((zi, i) => {
      let f = -zi;
      edges.forEach(e => { if (st.on[e.id] && e.from !== e.to && e.to === nodes[i].id) f += g * e.w * Math.tanh(z[nodes.findIndex(n => n.id === e.from)]); });
      return zi + f * dt + sg * Math.sqrt(dt) * gauss(sim.r);
    });
    sim.z = nz; sim.t++;
    sim.hist.push(nz); if (sim.hist.length > 240) sim.hist.shift();
  }
  function redrawTrace() {
    if (!trace) return;
    trace.textContent = '';
    const h0 = sim.hist, lim = Math.max(2, ...h0.flat().map(Math.abs));
    trace.append(sv('line', { x1: 0, x2: 240, y1: 50, y2: 50, class: 'bg-axis' }));
    nodes.forEach((n, i) => {
      const pts = h0.map((v, k) => `${k},${(50 - (v[i] / lim) * 46).toFixed(1)}`).join(' ');
      const pl = sv('polyline', { points: pts, class: 'bg-tr', fill: 'none' });
      pl.style.setProperty('--nh', n.hue);
      trace.append(pl);
    });
  }
  function frame() {
    timer = null;
    if (!el.isConnected || !sim.playing) return;
    stepSim(); stepSim(); redrawTrace();
    timer = requestAnimationFrame(frame);
  }
  const simBox = cfg.simulate ? (() => {
    trace = sv('svg', { viewBox: '0 0 240 100', class: 'bg-trace', role: 'img', 'aria-label': L.flows });
    playBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      sim.playing = !sim.playing; playBtn.textContent = sim.playing ? L.pause : L.play;
      if (sim.playing && !timer) timer = requestAnimationFrame(frame);
    } }, L.play);
    const legend = h('div', { class: 'bg-legend' }, nodes.map(n => h('span', { class: 'bg-lg' },
      h('i', { style: `--nh:${n.hue}` }), M(`$${n.label.replace(/^\$|\$$/g, '')}$`))));
    return h('div', { class: 'bg-sim' }, h('div', { class: 'fe-title' }, M(L.flows)), trace, legend,
      h('div', { class: 'wbtns' }, playBtn, h('button', { class: 'btn ghost', type: 'button', onclick: () => { resetSim(); } }, L.restart)));
  })() : '';

  el.append(stage, showChips && chipEls.length ? chips : '', h('div', { class: 'wbtns' }, condBtn, ...presetBtns, resetBtn),
    showList ? listBox : '', showV ? verdictBox : '', simBox);
  resetSim();

  const pair = e => e.from === e.to ? `$${lab(e.from)}\\circlearrowright$` : `$${lab(e.from)}\\to ${lab(e.to)}$`;
  const names = ids => ids.map(i => `$${lab(i)}$`).join(` ${L.and} `);
  const pathTxt = p => p.map(i => `$${lab(i)}$`).join(' — ');

  function draw() {
    const onEdges = edges.filter(e => st.on[e.id]);
    // leaking arrows: an ON arrow directly joining an external and an internal node
    const leaks = onEdges.filter(e => (ext.includes(e.from) && int.includes(e.to)) || (int.includes(e.from) && ext.includes(e.to)));
    eEls.forEach(({ e, vis, grp }) => {
      const on = st.on[e.id], leak = on && leaks.includes(e) && st.cond;
      grp.style.display = on || e.editable ? '' : 'none';
      vis.setAttribute('class', `bg-edge${on ? '' : ' bg-off'}${leak ? ' bg-leak' : ''}`);
      vis.setAttribute('marker-end', `url(#${leak ? `bg-l-${uid}` : on ? `bg-a-${uid}` : `bg-o-${uid}`})`);
      grp.setAttribute('aria-label', `${e.from} to ${e.to}: ${on ? 'on' : 'off'}`);
    });
    nEls.forEach((c, i) => c.classList.toggle('bg-given', st.cond && blanket.includes(nodes[i].id)));
    labs.forEach((d, i) => d.classList.toggle('bg-dim', st.cond && blanket.includes(nodes[i].id)));
    givenTags.forEach((d, i) => d.style.display = st.cond && blanket.includes(nodes[i].id) ? '' : 'none');
    chipEls.forEach(({ e, b }) => { b.classList.toggle('on', st.on[e.id]); b.setAttribute('aria-pressed', String(st.on[e.id])); });
    condBtn.textContent = st.cond ? L.uncondition : L.condition;
    condBtn.classList.toggle('primary', !st.cond);

    const direct = onEdges.filter(e => e.from !== e.to);
    listBox.textContent = '';
    listBox.append(h('b', {}, M(L.list + ': ')), M(direct.length ? direct.map(pair).join(' · ') : L.none));

    const pathAll = findPath(onEdges, ext, int, []);
    const pathBl = findPath(onEdges, ext, int, blanket);
    verdictBox.textContent = '';
    verdictBox.classList.toggle('bad', st.cond && !!pathBl);
    verdictBox.classList.toggle('good', st.cond && !pathBl);
    const X = names(ext), I = names(int);
    if (!st.cond) {
      verdictBox.append(M(pathAll ? `${L.linked}: ${pathTxt(pathAll)}` : L.nolink));
    } else if (!pathBl) {
      verdictBox.append(M(`${I} ${L.and} ${X} ${L.indep}: ${L.because} ${names(blanket)}.`));
    } else {
      const direct1 = pathBl.length === 2 ? leaks : onEdges.filter(e => {
        const i = pathBl.indexOf(e.from), j = pathBl.indexOf(e.to);
        return i >= 0 && j >= 0 && Math.abs(i - j) === 1;
      });
      verdictBox.append(h('b', {}, M(L.notBlanket + '. ')), M(`${L.via} ${pathTxt(pathBl)}. ${L.leak}: ${direct1.map(pair).join(', ')}.`));
    }
    el.dataset.verdict = st.cond ? (pathBl ? 'leak' : 'blanket') : 'open';
    el.dataset.on = onEdges.map(e => e.id).join(',');
  }
  draw();
}
