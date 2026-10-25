// factor-graph
//
// A (Forney/Bayesian) factor graph: round nodes = random variables (shaded when observed), square
// nodes = factors (probability tables) joined to the variables they involve. Click a variable: the
// factors it must read to update its belief (the factors touching it = its Markov blanket in factor
// form: parents, children, co-parents of the children) are highlighted and listed, with the
// config-supplied KaTeX contribution of each; "show messages" draws an arrow from each of those
// factors to the variable. Click a factor: the variables it connects. Optional "observe" chips
// shade/free each variable. No maths is hard-coded: all text comes from the config.
//
//   variables: [{ id, label, pos: [x, y], observed, rep, hue }]    label = KaTeX source (e.g. 's_{t}')
//   factors:   [{ id, label, pos: [x, y], vars: [ids], term, rep }]
//        term = KaTeX contribution of this factor to the message of any variable it touches
//        ({v} is replaced by that variable's label). Default: the factor's label.
//        pos in a W x H box (default 400 x 230; with unroll, W grows by dx*(n-1); or box: [W, H]).
//   messageFormula: KaTeX template for the selected variable, e.g. 'q({v}) \\propto \\exp(\\,{terms}\\,)'
//        {v} = selected label, {terms} = the terms of its factors joined by `join` (default ' + ').
//   join: ' + '
//   unroll: n, dx: 110, t0: 0    repeat every item with rep: true n times, shifted by dx in x.
//        In rep ids/labels/terms, {t}, {t-1}, {t+1} = the copy index (+ t0). Ids become id_k.
//        In a factor's vars: 'id' = a non-repeated variable; 'id@0' = the same copy; 'id@-1' = the previous
//        copy ('id@+1' the next); an instance whose copy does not exist is skipped (no previous at k = 0).
//        In a non-rep factor, 'id@2' = absolute copy 2.
//   observable: true     show one chip per variable to toggle observed / free
//   messages: false      start with messages drawn      select: 'x'   start with this variable selected
//   labels: { reads, blanket, none, show, hide, observe, observed, free, connects, hint, reset, variable, factor }
//   presets: [{ label, variables, factors, messageFormula, unroll, dx, join, box, select, observable }]
//        a preset overrides the same-named top-level keys; buttons switch between presets.

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
const R = 22, S = 15;   // variable radius, factor half-side
const dollars = s => `$${String(s).replace(/^\$|\$$/g, '')}$`;

// exported for tests: spec -> { vars, factors, W, H }
export function expand(spec) {
  const n = spec.unroll ?? 0, dx = spec.dx ?? 110, t0 = spec.t0 ?? 0;
  const sub = (s, k) => String(s ?? '').replace(/\{t([+-]\d+)?\}/g, (_, d) => String(k + t0 + (d ? Number(d) : 0)));
  const vars = [], factors = [];
  for (const v of spec.variables ?? []) {
    if (v.rep) for (let k = 0; k < n; k++) vars.push({ ...v, id: `${v.id}_${k}`, label: sub(v.label, k), pos: [v.pos[0] + dx * k, v.pos[1]] });
    else vars.push({ ...v, label: sub(v.label, 0) });
  }
  const ids = new Set(vars.map(v => v.id));
  const ref = (r, k) => {
    const m = /^(.+?)@([+-]?\d+)$/.exec(r);
    if (!m) return r;
    const j = k == null ? Number(m[2]) : k + Number(m[2]);
    return `${m[1]}_${j}`;
  };
  for (const f of spec.factors ?? []) {
    const inst = k => {
      const vs = (f.vars ?? []).map(r => ref(r, k));
      if (!vs.every(i => ids.has(i))) return;
      const sh = k == null ? 0 : dx * k;
      factors.push({ ...f, id: k == null ? f.id : `${f.id}_${k}`, label: sub(f.label ?? f.id, k ?? 0), term: sub(f.term ?? f.label ?? f.id, k ?? 0),
        pos: [f.pos[0] + sh, f.pos[1]], vars: vs });
    };
    if (f.rep) for (let k = 0; k < n; k++) inst(k); else inst(null);
  }
  const rep = [...vars, ...factors].length && n > 1 ? dx * (n - 1) : 0;
  const [W, H] = spec.box ?? [400 + rep, 230];
  return { vars, factors, W, H };
}

export function factorGraph(el, cfg) {
  const L = { reads: 'It must read', blanket: 'Variables it then talks to', none: 'none', show: 'Show messages', hide: 'Hide messages',
    observe: 'Observed', observed: 'observed', free: 'free', connects: 'This factor connects', hint: 'Click a variable (circle) or a factor (square).',
    reset: 'Reset', variable: 'variable', factor: 'factor', ...(cfg.labels ?? {}) };
  const presets = cfg.presets?.length ? cfg.presets : [{}];
  let pi = 0, model, spec, sel = null, selF = null, msgs = !!cfg.messages, obs = {};
  const uid = Math.random().toString(36).slice(2, 7);

  const stageHost = h('div', { class: 'fgr-host' });
  const readBox = h('div', { class: 'fgr-read' });
  const chips = h('div', { class: 'wbtns fgr-chips' });
  const msgBtn = h('button', { class: 'btn', type: 'button', onclick: () => { msgs = !msgs; draw(); } });
  const resetBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => load(pi) }, L.reset);
  const presetBtns = presets.length > 1 ? presets.map((p, i) => h('button', { class: 'btn ghost', type: 'button', onclick: () => load(i) }, M(p.label ?? String(i + 1)))) : [];
  el.append(presets.length > 1 ? h('div', { class: 'wbtns fgr-presets' }, ...presetBtns) : '', stageHost, h('div', { class: 'wbtns' }, msgBtn, resetBtn), chips, readBox);

  let els = {};
  function load(i) {
    pi = i; spec = { ...cfg, ...presets[i] };
    model = expand(spec);
    msgs = !!spec.messages;
    sel = spec.select && model.vars.some(v => v.id === spec.select) ? spec.select : null; selF = null;
    obs = Object.fromEntries(model.vars.map(v => [v.id, !!v.observed]));
    build();
    presetBtns.forEach((b, j) => { b.classList.toggle('primary', j === i); b.classList.toggle('ghost', j !== i); });
    draw();
  }

  function build() {
    const { vars, factors, W, H } = model, byV = Object.fromEntries(vars.map(v => [v.id, v]));
    stageHost.textContent = ''; chips.textContent = '';
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fgr-svg', role: 'img', 'aria-label': 'factor graph' });
    const marker = sv('marker', { id: `fgr-m-${uid}`, viewBox: '0 0 10 10', refX: 8.5, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, sv('path', { d: 'M0,0 L10,5 L0,10 z', class: 'fgr-head' }));
    svg.append(sv('defs', {}, marker));
    const eG = sv('g'), mG = sv('g'), nG = sv('g');
    svg.append(eG, mG, nG);
    const unit = (dx, dy) => { const d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
    els = { edges: [], vars: {}, facs: {}, msgs: [], labs: [] };
    for (const f of factors) for (const vid of f.vars) {
      const A = byV[vid].pos, B = f.pos, [ux, uy] = unit(B[0] - A[0], B[1] - A[1]);
      const sIn = S / Math.max(Math.abs(ux), Math.abs(uy), 1e-6);
      const p1 = [A[0] + ux * R, A[1] + uy * R], p2 = [B[0] - ux * Math.min(sIn, S * 1.42), B[1] - uy * Math.min(sIn, S * 1.42)];
      const line = sv('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], class: 'fgr-edge' });
      eG.append(line);
      // message arrow: factor -> variable, shifted sideways a little so it sits beside the edge
      const nx = -uy * 5, ny = ux * 5;
      const arr = sv('line', { x1: p2[0] + nx, y1: p2[1] + ny, x2: p1[0] + nx - ux * 2, y2: p1[1] + ny - uy * 2, class: 'fgr-msg', 'marker-end': `url(#fgr-m-${uid})` });
      mG.append(arr);
      els.edges.push({ f: f.id, v: vid, line }); els.msgs.push({ f: f.id, v: vid, arr });
    }
    const act = (node, fn) => {
      node.setAttribute('tabindex', 0); node.setAttribute('role', 'button'); node.classList.add('fgr-click');
      node.addEventListener('click', fn);
      node.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fn(); } });
    };
    for (const v of vars) {
      const c = sv('circle', { cx: v.pos[0], cy: v.pos[1], r: R, class: 'fgr-var' });
      if (v.hue != null) c.style.setProperty('--nh', v.hue);
      act(c, () => { sel = sel === v.id ? null : v.id; selF = null; draw(); });
      c.setAttribute('aria-label', `${L.variable} ${v.id}`);
      nG.append(c); els.vars[v.id] = c;
    }
    for (const f of factors) {
      const r = sv('rect', { x: f.pos[0] - S, y: f.pos[1] - S, width: 2 * S, height: 2 * S, rx: 3, class: 'fgr-fac' });
      act(r, () => { selF = selF === f.id ? null : f.id; sel = null; draw(); });
      r.setAttribute('aria-label', `${L.factor} ${f.id}`);
      nG.append(r); els.facs[f.id] = r;
    }
    const pct = (p, q) => `left:${(p / W) * 100}%;top:${(q / H) * 100}%`;
    const labs = [...vars.map(v => h('div', { class: 'fgr-lab', style: pct(...v.pos) }, M(dollars(v.label)))),
      ...factors.map(f => h('div', { class: 'fgr-lab fgr-flab', style: pct(...f.pos) }, M(dollars(f.label))))];
    const stage = h('div', { class: 'fgr-stage', style: `max-width:${Math.min(Math.max(W * 1.15, 300), 680)}px` }, svg, ...labs);
    stageHost.append(stage);
    els.chips = [];
    if (spec.observable) {
      chips.append(h('span', { class: 'fgr-chiptitle' }, M(L.observe + ':')));
      for (const v of vars) {
        const b = h('button', { class: 'btn ghost', type: 'button', onclick: () => { obs[v.id] = !obs[v.id]; draw(); } }, M(dollars(v.label)));
        chips.append(b); els.chips.push({ id: v.id, b });
      }
    }
  }

  function draw() {
    const { vars, factors } = model, byV = Object.fromEntries(vars.map(v => [v.id, v])), byF = Object.fromEntries(factors.map(f => [f.id, f]));
    const reads = sel ? factors.filter(f => f.vars.includes(sel)) : [];
    const readIds = new Set(reads.map(f => f.id));
    const nb = new Set(reads.flatMap(f => f.vars).filter(i => i !== sel));
    const fv = selF ? new Set(byF[selF].vars) : new Set();
    for (const v of vars) {
      const c = els.vars[v.id];
      c.classList.toggle('fgr-obs', !!obs[v.id]);
      c.classList.toggle('fgr-sel', sel === v.id);
      c.classList.toggle('fgr-nb', nb.has(v.id) || fv.has(v.id));
      c.setAttribute('aria-pressed', String(sel === v.id));
    }
    for (const f of factors) {
      els.facs[f.id].classList.toggle('fgr-hot', readIds.has(f.id) || selF === f.id);
      els.facs[f.id].setAttribute('aria-pressed', String(selF === f.id));
    }
    els.edges.forEach(({ f, v, line }) => line.classList.toggle('fgr-hot', (sel === v && readIds.has(f)) || (selF === f)));
    els.msgs.forEach(({ f, v, arr }) => { arr.style.display = msgs && sel === v && readIds.has(f) ? '' : 'none'; });
    els.chips.forEach(({ id, b }) => { b.classList.toggle('on', !!obs[id]); b.setAttribute('aria-pressed', String(!!obs[id])); });
    msgBtn.textContent = msgs ? L.hide : L.show;
    msgBtn.classList.toggle('primary', !msgs);
    msgBtn.style.display = 'none';
    if (sel) msgBtn.style.display = '';

    readBox.textContent = '';
    if (sel) {
      const v = byV[sel], st = obs[sel] ? L.observed : L.free;
      const termOf = f => String(f.term).replace(/\{v\}/g, v.label);
      readBox.append(h('div', {}, h('b', {}, M(`${dollars(v.label)} (${st}). ${L.reads}: `)),
        M(reads.length ? reads.map(f => dollars(f.label)).join(', ') : L.none)));
      readBox.append(h('div', {}, h('b', {}, M(L.blanket + ': ')), M(nb.size ? [...nb].map(i => dollars(byV[i].label)).join(', ') : L.none)));
      if (spec.messageFormula && reads.length) {
        const f = String(spec.messageFormula).replace(/\{v\}/g, v.label).replace(/\{terms\}/g, () => reads.map(termOf).join(spec.join ?? ' + '));
        readBox.append(h('div', { class: 'fgr-formula', html: tex(f, true) }));
      }
    } else if (selF) {
      const f = byF[selF];
      readBox.append(h('div', {}, h('b', {}, M(`${dollars(f.label)}. ${L.connects}: `)), M(f.vars.map(i => dollars(byV[i].label)).join(', '))));
    } else readBox.append(h('div', { class: 'fgr-hintline' }, M(L.hint)));
    el.dataset.selected = sel ?? '';
    el.dataset.selectedFactor = selF ?? '';
    el.dataset.reads = reads.map(f => f.id).join(',');
    el.dataset.observed = vars.filter(v => obs[v.id]).map(v => v.id).join(',');
  }
  load(0);
}
