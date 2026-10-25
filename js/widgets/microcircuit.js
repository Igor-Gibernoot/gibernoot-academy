// microcircuit
//
// A generic "message circuit": populations (nodes) joined by synapses (edges) that carry named messages,
// laid out on horizontal bands (layers, nuclei, levels). Click a node: its incoming messages (blue) and
// outgoing messages (orange) light up and are listed with their formulas. Click an edge: the message,
// the synapse sign (excitatory = arrowhead, inhibitory = round end), direction and frequency band.
// "Play messages" sends one dot along each edge of `sequence`, in order. An optional modulator slider
// scales the gain (thickness, dot size) of chosen edges: visual only. NOTHING is computed here: numbers
// belong to predictive-coding / pomdp-lab. No text is hard-coded: all names and formulas come from the config.
//
//   box: [W, H]                      drawing box (default 400 x 300); every position below is in it
//   bands: [{ label, y0, y1 }]       horizontal strips, label = plain text
//   nodes: [{ id, label, name, pos: [x, y], cls, populations, info, tag }]
//        label = KaTeX source drawn in the circle; name = plain text (readout); populations = plain text
//        (e.g. 'superficial pyramidal'); info = Markdown sentence; cls = expectation | error | inhibitory |
//        input | output | modulator (fill colour); tag = what hideNames shows instead (default A, B, C, ...)
//   edges: [{ id, from, to, sign: '+' | '-', message: { label, kind }, direction, freq, note }]
//        label = KaTeX; kind = prediction | error | expectation | policy | precision (dot colour);
//        direction = ascending | descending | intrinsic (any text is shown as a badge); freq = plain text;
//        note = Markdown. Edges between the same two nodes in both directions are drawn side by side.
//   sequence: [edge ids]             order of Play messages (default: all edges in the list)
//   modulator: { node, edges: [ids], label (KaTeX), min 0, max 2, value 1, step .1, weighting }
//        the slider scales the listed edges; weighting = KaTeX template, {g} = the gain (default '{label}={g}')
//   showLabels (message formulas and kinds), showSigns, showFreq, showModulator, showBands, showLegend   true; false hides that piece
//   hideNames: false    nodes show only their tag; names, populations and info are hidden (an mcq can ask
//        "which population?"); combine with showBands/showLabels false to hide more
//   select: 'id'        start with this node (or edge) selected
//   labels: { reads, sends, none, hint, play, stop, reset, from, to, sign, excitatory, inhibitory, message,
//        kind, direction, freq, step, gain, cls: { expectation, error, ... } }  (plain text overrides)
//   presets: [{ label, ...any key above }]   buttons replace the whole circuit (a preset overrides the
//        same-named top-level keys): this is how a discrete / continuous toggle is written.

import { h } from '../dom.js';
import { mdInline, tex } from '../render.js';

const M = src => h('span', { html: mdInline(String(src)) });
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  kids.flat().forEach(c => c && e.append(c));
  return e;
};
const R = 20;                       // node radius (box units)
const STEP_MS = 750;                // time per edge in Play messages
const dollars = s => `$${String(s).replace(/^\$|\$$/g, '')}$`;
const letter = i => String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : '');

// exported for tests: geometry of an edge, shortened at both nodes, shifted sideways by `off`
export function edgeGeom(a, b, off = 0, back = R + 1, fwd = R + 5) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, nx = -uy * off, ny = ux * off;
  return { x1: a[0] + ux * back + nx, y1: a[1] + uy * back + ny, x2: b[0] - ux * fwd + nx, y2: b[1] - uy * fwd + ny, ux, uy };
}

export function microcircuit(el, cfg) {
  const L = { reads: 'Receives', sends: 'Sends', none: 'nothing', hint: 'Click a population (circle) or a synapse (arrow).',
    play: 'Play messages', stop: 'Stop', reset: 'Reset', from: 'from', to: 'to', sign: 'Synapse', excitatory: 'excitatory (+)',
    inhibitory: 'inhibitory (-)', message: 'Message', kind: 'Kind', direction: 'Direction', freq: 'Frequency', step: 'Step', gain: 'Gain',
    cls: { expectation: 'expectation', error: 'error', inhibitory: 'inhibitory', input: 'input', output: 'output', modulator: 'modulator' },
    ...(cfg.labels ?? {}) };
  L.cls = { expectation: 'expectation', error: 'error', inhibitory: 'inhibitory', input: 'input', output: 'output', modulator: 'modulator', ...(cfg.labels?.cls ?? {}) };
  const presets = cfg.presets?.length ? cfg.presets : [{}];
  let pi = 0, spec, nodes, edges, byN, byE, sel = null, selE = null, playing = false, stepNo = -1, gain = 1, raf = 0, t0 = 0;
  const flag = k => spec[k] !== false;
  const uid = Math.random().toString(36).slice(2, 7);

  const host = h('div', { class: 'mc-host' });
  const readBox = h('div', { class: 'mc-read' });
  const legend = h('div', { class: 'mc-legend' });
  const slider = h('input', { type: 'range', 'aria-label': 'gain' });
  const gainOut = h('span', { class: 'mc-gainout' });
  const gainRow = h('div', { class: 'mc-gain' });
  const playBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => (playing ? stop() : play()) });
  const resetBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => load(pi) }, L.reset);
  const presetBtns = presets.length > 1 ? presets.map((p, i) => h('button', { class: 'btn ghost', type: 'button', onclick: () => load(i) }, M(p.label ?? String(i + 1)))) : [];
  el.append(presets.length > 1 ? h('div', { class: 'wbtns mc-presets' }, ...presetBtns) : '', host, legend, h('div', { class: 'wbtns' }, playBtn, resetBtn), gainRow, readBox);
  slider.addEventListener('input', () => { gain = Number(slider.value); draw(); });

  let els = {};
  function load(i) {
    stop(true);
    pi = i; spec = { ...cfg, ...presets[i] };
    nodes = (spec.nodes ?? []).map((n, k) => ({ ...n, tag: n.tag ?? letter(k) }));
    edges = spec.edges ?? [];
    byN = Object.fromEntries(nodes.map(n => [n.id, n]));
    byE = Object.fromEntries(edges.map(e => [e.id, e]));
    const m = spec.modulator;
    gain = m?.value ?? 1;
    sel = selE = null;
    if (spec.select && byN[spec.select]) sel = spec.select; else if (spec.select && byE[spec.select]) selE = spec.select;
    build();
    presetBtns.forEach((b, j) => { b.classList.toggle('primary', j === i); b.classList.toggle('ghost', j !== i); });
    draw();
  }

  const nodeName = n => (spec.hideNames ? n.tag : n.name ?? n.id);
  const nodeLab = n => (spec.hideNames ? n.tag : dollars(n.label ?? n.id));
  const gainOf = e => (spec.modulator?.edges?.includes(e.id) && flag('showModulator') ? gain : 1);

  function build() {
    const [W, H] = spec.box ?? [400, 300];
    host.textContent = ''; legend.textContent = '';
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'mc-svg', role: 'img', 'aria-label': 'message circuit' });
    const bG = sv('g'), eG = sv('g'), mG = sv('g'), dG = sv('g'), nG = sv('g');
    svg.append(bG, eG, mG, dG, nG);
    els = { edges: {}, nodes: {}, modl: [] };
    const showBands = flag('showBands') && !spec.hideBands;
    if (showBands) (spec.bands ?? []).forEach((b, k) => bG.append(sv('rect', { x: 0, y: b.y0, width: W, height: b.y1 - b.y0, class: `mc-band ${k % 2 ? 'odd' : ''}` })));
    const pair = new Set(edges.map(e => `${e.from}>${e.to}`));
    for (const e of edges) {
      const a = byN[e.from], b = byN[e.to];
      if (!a || !b) continue;
      const off = pair.has(`${e.to}>${e.from}`) ? 6 : 0;
      const g = edgeGeom(a.pos, b.pos, off, R + 1, R + (e.sign === '-' ? 6 : 5));
      const grp = sv('g', { class: `mc-edge mc-k-${e.message?.kind ?? 'none'}`, tabindex: 0, role: 'button', 'aria-label': `synapse ${e.id}` });
      const line = sv('line', { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2, class: 'mc-line' });
      let head;
      if (e.sign === '-' && flag('showSigns')) head = sv('circle', { cx: g.x2 + g.ux * 4, cy: g.y2 + g.uy * 4, r: 4.5, class: 'mc-hd' });
      else {
        const px = -g.uy * 4.5, py = g.ux * 4.5, bx = g.x2 - g.ux * 2, by = g.y2 - g.uy * 2, tx = g.x2 + g.ux * 8, ty = g.y2 + g.uy * 8;
        head = sv('polygon', { points: `${tx},${ty} ${bx + px},${by + py} ${bx - px},${by - py}`, class: 'mc-hd' });
      }
      const hit = sv('line', { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2, class: 'mc-hit' });
      grp.append(hit, line, head);
      const act = () => { if (!playing) { selE = selE === e.id ? null : e.id; sel = null; draw(); } };
      grp.addEventListener('click', act);
      grp.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); act(); } });
      eG.append(grp);
      els.edges[e.id] = { grp, line, g };
    }
    // modulator: dashed arrows from the modulator node to the midpoint of each listed edge
    const m = spec.modulator;
    if (m && byN[m.node] && flag('showModulator')) for (const id of m.edges ?? []) {
      const ed = els.edges[id]; if (!ed) continue;
      const a = byN[m.node].pos, mx = (ed.g.x1 + ed.g.x2) / 2, my = (ed.g.y1 + ed.g.y2) / 2, d = Math.hypot(mx - a[0], my - a[1]) || 1;
      const ex = mx - (mx - a[0]) / d * 3, ey = my - (my - a[1]) / d * 3;
      const sx = a[0] + (mx - a[0]) / d * (R + 1), sy = a[1] + (my - a[1]) / d * (R + 1);
      els.modl.push(sv('line', { x1: sx, y1: sy, x2: ex, y2: ey, class: 'mc-mod' }));
      mG.append(els.modl.at(-1));
    }
    els.dot = sv('circle', { r: 6, class: 'mc-dot', style: 'display:none' });
    dG.append(els.dot);
    for (const n of nodes) {
      const c = sv('circle', { cx: n.pos[0], cy: n.pos[1], r: R, class: `mc-node mc-n-${n.cls ?? 'expectation'}`, tabindex: 0, role: 'button', 'aria-label': `population ${n.tag}` });
      const act = () => { if (!playing) { sel = sel === n.id ? null : n.id; selE = null; draw(); } };
      c.addEventListener('click', act);
      c.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); act(); } });
      nG.append(c); els.nodes[n.id] = c;
    }
    const pct = (p, q) => `left:${(p / W) * 100}%;top:${(q / H) * 100}%`;
    const labs = nodes.map(n => h('div', { class: 'mc-lab', style: pct(...n.pos) }, M(nodeLab(n))));
    if (showBands) (spec.bands ?? []).forEach(b => labs.push(h('div', { class: 'mc-bandlab', style: `left:4px;top:${(b.y0 / H) * 100}%` }, M(b.label ?? ''))));
    host.append(h('div', { class: 'mc-stage', style: `max-width:${Math.min(Math.max(W * 1.4, 320), 720)}px` }, svg, ...labs));
    if (flag('showLegend') && !spec.hideNames) {
      const seen = [...new Set(nodes.map(n => n.cls ?? 'expectation'))];
      seen.forEach(c => legend.append(h('span', { class: 'mc-chip' }, h('i', { class: `mc-sw mc-n-${c}` }), L.cls[c] ?? c)));
    }
    const mm = spec.modulator;
    gainRow.textContent = '';
    gainRow.style.display = mm && flag('showModulator') ? '' : 'none';
    if (mm) {
      Object.assign(slider, { min: mm.min ?? 0, max: mm.max ?? 2, step: mm.step ?? 0.1, value: gain });
      gainRow.append(h('span', { class: 'mc-gainlab' }, L.gain + ':'), slider, gainOut);
    }
  }

  const fmtG = g => String(Math.round(g * 100) / 100);
  const badge = e => [e.direction && (L[e.direction] ?? e.direction), flag('showFreq') && e.freq].filter(Boolean).join(' · ');
  const msgTex = e => (flag('showLabels') && e.message?.label ? dollars(e.message.label) : '');
  const sgn = e => (flag('showSigns') ? ` (${e.sign === '-' ? L.inhibitory : L.excitatory})` : '');
  const edgeLine = (e, other) => h('li', {}, h('b', {}, M(nodeName(byN[other]))), ' ', M(msgTex(e)), flag('showLabels') && e.message?.kind ? ` ${e.message.kind}` : '', badge(e) ? ` [${badge(e)}]` : '', sgn(e));

  function draw() {
    const cur = playing && stepNo >= 0 ? byE[spec.sequence?.[stepNo] ?? edges[stepNo]?.id] : null;
    const into = sel ? edges.filter(e => e.to === sel) : [], out = sel ? edges.filter(e => e.from === sel) : [];
    const hasSel = !!(sel || selE || cur);
    const nb = new Set([...into.map(e => e.from), ...out.map(e => e.to)]);
    for (const n of nodes) {
      const c = els.nodes[n.id];
      c.classList.toggle('mc-sel', sel === n.id || (selE && (byE[selE].from === n.id || byE[selE].to === n.id)) || (cur && (cur.from === n.id || cur.to === n.id)));
      c.classList.toggle('mc-nb', nb.has(n.id));
      c.setAttribute('aria-pressed', String(sel === n.id));
    }
    for (const e of edges) {
      const o = els.edges[e.id]; if (!o) continue;
      const g = gainOf(e), inn = into.includes(e), outt = out.includes(e), hot = selE === e.id || cur === e;
      o.grp.classList.toggle('mc-in', inn); o.grp.classList.toggle('mc-out', outt); o.grp.classList.toggle('mc-hot', hot);
      o.grp.classList.toggle('mc-dim', hasSel && !inn && !outt && !hot);
      o.line.style.strokeWidth = String(2.2 * Math.max(g, 0.15));
      o.grp.setAttribute('aria-pressed', String(selE === e.id));
    }
    els.modl.forEach(l => { l.style.strokeWidth = String(1 + gain); });
    gainOut.replaceChildren(h('span', { html: tex((spec.modulator?.weighting ?? '{label}={g}').replace(/\{label\}/g, spec.modulator?.label ?? '\\text{gain}').replace(/\{g\}/g, fmtG(gain))) }));
    playBtn.textContent = playing ? L.stop : L.play;
    readBox.textContent = '';
    if (cur) {
      readBox.append(h('div', {}, h('b', {}, `${L.step} ${stepNo + 1}/${(spec.sequence ?? edges).length}: `), M(`${nodeName(byN[cur.from])} → ${nodeName(byN[cur.to])} `), M(msgTex(cur)), flag('showLabels') && cur.message?.kind ? ` (${cur.message.kind})` : ''));
      if (cur.note && !spec.hideNames) readBox.append(h('div', {}, M(cur.note)));
    } else if (sel) {
      const n = byN[sel];
      readBox.append(h('div', {}, h('b', {}, M(spec.hideNames ? `${n.tag}` : `${n.name ?? n.id}`)), spec.hideNames ? '' : M(n.populations ? ` (${n.populations})` : '')));
      if (n.info && !spec.hideNames) readBox.append(h('div', {}, M(n.info)));
      readBox.append(h('div', {}, h('b', { class: 'mc-in-t' }, L.reads + ':')), into.length ? h('ul', {}, ...into.map(e => edgeLine(e, e.from))) : h('div', { class: 'mc-hintline' }, L.none));
      readBox.append(h('div', {}, h('b', { class: 'mc-out-t' }, L.sends + ':')), out.length ? h('ul', {}, ...out.map(e => edgeLine(e, e.to))) : h('div', { class: 'mc-hintline' }, L.none));
    } else if (selE) {
      const e = byE[selE];
      readBox.append(h('div', {}, h('b', {}, M(`${nodeName(byN[e.from])} → ${nodeName(byN[e.to])}`))));
      if (flag('showLabels') && (e.message?.label || e.message?.kind)) readBox.append(h('div', {}, h('b', {}, L.message + ': '), M(msgTex(e)), e.message?.kind ? ` (${e.message.kind})` : ''));
      if (flag('showSigns')) readBox.append(h('div', {}, h('b', {}, L.sign + ': '), e.sign === '-' ? L.inhibitory : L.excitatory));
      if (badge(e)) readBox.append(h('div', {}, h('b', {}, L.direction + ': '), badge(e)));
      if (e.note && !spec.hideNames) readBox.append(h('div', {}, M(e.note)));
    } else readBox.append(h('div', { class: 'mc-hintline' }, M(L.hint)));
    el.dataset.selected = sel ?? '';
    el.dataset.selectedEdge = selE ?? '';
    el.dataset.reads = into.map(e => e.id).join(',');
    el.dataset.sends = out.map(e => e.id).join(',');
    el.dataset.playing = String(playing);
    el.dataset.step = String(playing ? stepNo : -1);
    el.dataset.gain = String(gain);
    el.dataset.preset = String(pi);
  }

  function play() {
    const seq = (spec.sequence ?? edges.map(e => e.id)).filter(id => els.edges[id]);
    if (!seq.length) return;
    spec = { ...spec, sequence: seq };
    playing = true; stepNo = 0; t0 = performance.now();
    const tick = now => {
      if (!playing) return;
      if (!el.isConnected) { playing = false; return; }
      const k = Math.floor((now - t0) / STEP_MS);
      if (k >= seq.length) { stop(); return; }
      if (k !== stepNo) { stepNo = k; draw(); }
      const e = byE[seq[stepNo]], g = els.edges[e.id].g, f = ((now - t0) % STEP_MS) / STEP_MS * 1.25;
      const u = Math.min(f, 1), gg = gainOf(e);
      els.dot.setAttribute('cx', g.x1 + (g.x2 - g.x1) * u); els.dot.setAttribute('cy', g.y1 + (g.y2 - g.y1) * u);
      els.dot.setAttribute('r', String(5.5 * Math.max(gg, 0.3)));
      els.dot.setAttribute('class', `mc-dot mc-k-${e.message?.kind ?? 'none'}`);
      els.dot.style.display = '';
      raf = requestAnimationFrame(tick);
    };
    draw();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  }
  function stop(silent) {
    playing = false; stepNo = -1; cancelAnimationFrame(raf);
    if (els.dot) els.dot.style.display = 'none';
    if (!silent && els.edges) draw();
  }
  load(0);
}
