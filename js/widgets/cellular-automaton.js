// cellular-automaton
//
// A W x H grid of cells, each alive or dead, evolving by a Birth/Survival rule (default Conway's
// Life, B3/S23). Plain SVG + HTML, all wording from the config. Displays and probes only: it
// reports nothing to the card.
//
//   width, height: 10, 10      grid size in cells
//   rule: "B3/S23"             birth/survival digits (a dead cell with n live neighbours is born
//                              if n is in B; a live one survives if n is in S)
//   wrap: false                true = edges glue to a torus; false = outside the grid is dead
//   preset: "glider"           glider | blinker | block | empty | random
//   at: [1, 1]                 [column, row] of the preset's top-left corner (row 0 on top)
//   cells: [[x, y], ...]       explicit live cells (used instead of preset when given)
//   seed, density: 1, 0.3      for preset "random" (same grid every time)
//   buttons: ["step","play","reset"]   which buttons to show (any subset; [] = none)
//   speed: 400                 ms per generation while playing
//   editable: false            true = click or drag on the grid to toggle cells
//   grid: true                 draw the cell borders
//   generation: true           "Generation n" counter
//   count: true                "Live cells: k" counter
//   ruleReadout: false         show the rule as text (e.g. B3/S23)
//   inspect: null              [x, y] cell whose 8 neighbours are outlined, with its live-neighbour
//                              count written in the cell
//   inspectLabel: true         write that count in the inspected cell
//   pick: false                true = clicking a cell moves the inspected cell there
//   trace: false               true = draw the path of the centre (mean position) of the live cells
//   traceDots: true            dots at each generation on the trace
//   labels: { step, play, pause, reset, generation, count, rule, neighbours }
//
// Example: {width: 10, height: 10, preset: glider, buttons: [step, reset], count: false}

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return e;
};
const PRESETS = {
  glider: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
  blinker: [[0, 1], [1, 1], [2, 1]],
  block: [[0, 0], [1, 0], [0, 1], [1, 1]],
  empty: [],
};
const CELL = 30;

export function cellularAutomaton(el, cfg) {
  const Wc = Math.max(1, Math.min(60, cfg.width ?? 10)), Hc = Math.max(1, Math.min(60, cfg.height ?? 10));
  const L = { step: 'Step', play: 'Play', pause: 'Pause', reset: 'Reset', generation: 'Generation', count: 'Live cells',
    rule: 'Rule', neighbours: 'live neighbours', ...(cfg.labels ?? {}) };
  const rule = String(cfg.rule ?? 'B3/S23').toUpperCase();
  const m = /^B(\d*)\/S(\d*)$/.exec(rule) ?? ['', '3', '23'];
  const born = new Set([...m[1]].map(Number)), stay = new Set([...m[2]].map(Number));
  const wrap = cfg.wrap === true, editable = cfg.editable === true, pick = cfg.pick === true;
  const buttons = cfg.buttons ?? ['step', 'play', 'reset'];
  const speed = cfg.speed ?? 400;
  const showGrid = cfg.grid !== false, showGen = cfg.generation !== false, showCount = cfg.count !== false;
  const showRule = cfg.ruleReadout === true, showTrace = cfg.trace === true, showDots = cfg.traceDots !== false;
  const showNum = cfg.inspectLabel !== false;
  let insp = Array.isArray(cfg.inspect) ? [cfg.inspect[0], cfg.inspect[1]] : null;

  const idx = (x, y) => y * Wc + x;
  function initial() {
    const g = new Uint8Array(Wc * Hc);
    let list;
    if (Array.isArray(cfg.cells)) list = cfg.cells;
    else if (cfg.preset === 'random') {
      let s = (cfg.seed ?? 1) >>> 0 || 1; const d = cfg.density ?? 0.3; list = [];
      for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; if (s / 4294967296 < d) list.push([x, y]); }
    } else {
      const [ox, oy] = cfg.at ?? [1, 1];
      list = (PRESETS[cfg.preset ?? 'glider'] ?? []).map(([x, y]) => [x + ox, y + oy]);
    }
    for (const [x, y] of list) if (x >= 0 && y >= 0 && x < Wc && y < Hc) g[idx(x, y)] = 1;
    return g;
  }
  function neighbours(g, x, y) {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      let X = x + dx, Y = y + dy;
      if (wrap) { X = (X + Wc) % Wc; Y = (Y + Hc) % Hc; } else if (X < 0 || Y < 0 || X >= Wc || Y >= Hc) continue;
      n += g[idx(X, Y)];
    }
    return n;
  }
  const centre = g => {
    let sx = 0, sy = 0, k = 0;
    for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) if (g[idx(x, y)]) { sx += x; sy += y; k++; }
    return k ? [sx / k, sy / k] : null;
  };

  let grid = initial(), gen = 0, timer = null, path = [centre(grid)];
  const svg = sv('svg', { viewBox: `0 0 ${Wc * CELL} ${Hc * CELL}`, class: 'ca-svg', role: 'img', 'aria-label': 'Cellular automaton grid' });
  if (editable || pick) svg.style.touchAction = 'none';
  svg.style.maxWidth = Math.min(Wc * CELL, 480) + 'px';
  const gCells = sv('g'), gInsp = sv('g'), gTrace = sv('g');
  svg.append(gCells, gTrace, gInsp);

  const gen$ = showGen ? h('span', { class: 'ca-stat' }) : null;
  const cnt$ = showCount ? h('span', { class: 'ca-stat' }) : null;
  const rule$ = showRule ? h('span', { class: 'ca-stat' }) : null;
  const stats = [gen$, cnt$, rule$].filter(Boolean);
  const readout = stats.length ? h('div', { class: 'readout ca-read', role: 'status' }, ...stats) : null;

  const stop = () => { if (timer) { clearInterval(timer); timer = null; } if (bPlay) bPlay.textContent = L.play; };
  const doStep = () => {
    const next = new Uint8Array(grid.length);
    for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) {
      const n = neighbours(grid, x, y);
      next[idx(x, y)] = (grid[idx(x, y)] ? stay.has(n) : born.has(n)) ? 1 : 0;
    }
    grid = next; gen++; path.push(centre(grid)); draw();
  };
  const bStep = buttons.includes('step') ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); doStep(); } }, mdInline(L.step)) : null;
  const bPlay = buttons.includes('play') ? h('button', { class: 'btn ghost', type: 'button', onclick: () => {
    if (timer) return stop();
    bPlay.textContent = L.pause; timer = setInterval(doStep, speed);
  } }, mdInline(L.play)) : null;
  const bReset = buttons.includes('reset') ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); grid = initial(); gen = 0; path = [centre(grid)]; draw(); } }, mdInline(L.reset)) : null;
  const btns = [bStep, bPlay, bReset].filter(Boolean);
  el.classList.add('ca');
  el.append(svg, ...(readout ? [readout] : []), ...(btns.length ? [h('div', { class: 'wbtns' }, ...btns)] : []));

  function draw() {
    gCells.replaceChildren();
    for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) {
      gCells.append(sv('rect', { x: x * CELL, y: y * CELL, width: CELL, height: CELL, class: `ca-cell${grid[idx(x, y)] ? ' on' : ''}${showGrid ? ' ln' : ''}` }));
    }
    gTrace.replaceChildren();
    const pts = path.filter(Boolean);
    if (showTrace && pts.length) {
      const P = ([x, y]) => [(x + 0.5) * CELL, (y + 0.5) * CELL];
      if (pts.length > 1) gTrace.append(sv('polyline', { class: 'ca-trace', fill: 'none', points: pts.map(p => P(p).join(',')).join(' ') }));
      if (showDots) for (const p of pts) { const [cx, cy] = P(p); gTrace.append(sv('circle', { cx, cy, r: 3, class: 'ca-tdot' })); }
    }
    gInsp.replaceChildren();
    if (insp && insp[0] >= 0 && insp[1] >= 0 && insp[0] < Wc && insp[1] < Hc) {
      const [ix, iy] = insp;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        let X = ix + dx, Y = iy + dy;
        if (wrap) { X = (X + Wc) % Wc; Y = (Y + Hc) % Hc; } else if (X < 0 || Y < 0 || X >= Wc || Y >= Hc) continue;
        gInsp.append(sv('rect', { x: X * CELL + 2, y: Y * CELL + 2, width: CELL - 4, height: CELL - 4, class: 'ca-nb' }));
      }
      gInsp.append(sv('rect', { x: ix * CELL + 1, y: iy * CELL + 1, width: CELL - 2, height: CELL - 2, class: 'ca-me' }));
      if (showNum) gInsp.append(sv('text', { x: (ix + 0.5) * CELL, y: (iy + 0.5) * CELL + 6, class: `ca-num${grid[idx(ix, iy)] ? ' on' : ''}`, 'text-anchor': 'middle' }, neighbours(grid, ix, iy)));
    }
    if (gen$) gen$.textContent = `${L.generation}: ${gen}`;
    if (cnt$) cnt$.textContent = `${L.count}: ${grid.reduce((a, b) => a + b, 0)}`;
    if (rule$) rule$.textContent = `${L.rule}: ${rule}`;
  }

  // pointer: drag-toggle cells (editable) or move the inspected cell (pick)
  let paint = null;
  const cellAt = ev => {
    const r = svg.getBoundingClientRect();
    const x = Math.floor((ev.clientX - r.left) / r.width * Wc), y = Math.floor((ev.clientY - r.top) / r.height * Hc);
    return x >= 0 && y >= 0 && x < Wc && y < Hc ? [x, y] : null;
  };
  svg.addEventListener('pointerdown', ev => {
    const c = cellAt(ev); if (!c) return;
    if (pick) { insp = c; draw(); }
    if (!editable) return;
    svg.setPointerCapture?.(ev.pointerId);
    paint = grid[idx(c[0], c[1])] ? 0 : 1; grid[idx(c[0], c[1])] = paint;
    path = [centre(grid)]; gen = 0; draw();
  });
  svg.addEventListener('pointermove', ev => {
    if (paint == null) return;
    const c = cellAt(ev); if (!c || grid[idx(c[0], c[1])] === paint) return;
    grid[idx(c[0], c[1])] = paint; draw();
  });
  const up = () => { paint = null; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  draw();
}
