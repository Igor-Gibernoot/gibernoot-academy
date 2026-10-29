// truss-frame
//
// A pin-jointed frame (truss) with supports and loads. Side view, plain SVG + HTML, every word and unit from the config (no course text hard-coded).
// Model (statics, all forces in `units.force`, lengths in `units.length`):
//   joints (nodes) with positions, straight members joining two joints (pins: no bending, each member carries only an axial force N, tension positive),
//   supports: 'pin' (reaction in x and y), 'rollerY' (vertical reaction only: rests on a roller), 'rollerX' (horizontal only), and loads {node, fx, fy} (fy < 0 is down).
//   Method of joints: at every joint the member forces, the reaction and the load add up to zero. That is 2 equations per joint: A x = -b with x = member forces then
//   reactions. m members + r reaction components against 2 n equations:  rank(A) = 2 n  -> rigid (statically determinate if m + r = 2 n, redundant if more);
//   rank(A) < 2 n -> MECHANISM: some motion costs no member any length, the frame can shear and collapse.  A mechanism is shown deformed along that motion
//   when the load pushes it (work of the load on the motion non-zero).  Redundant frames: the minimum-norm solution is shown (one possible split of the forces).
//   Built-in shapes (`shape`): square, braced (square + diagonal), triangle, warren, pratt (spans `span`, height `height`, `panels` bottom bays), or give `nodes`, `members`.
//
//   shape: 'braced'   span: 4   height: 3   panels: 4   (also: nodes: [[x,y],...], members: [[i,j],...])
//   supports: [{node, type}]   default: pin at the lower-left joint, rollerY at the lower-right joint
//   loads: [{node, fx, fy, hang}]   node = joint index or 'mid' (middle joint of the bottom chord) or 'top' (the first top-left joint); hang: arrow starts at the joint
//   units: { length:'m', force:'kN' }     ranges: { load: [-100, 100, 1] } (force steps)     snap: 0.25 (joint drag step, length units)
//   forceScale: force that draws as the thickest member (default: from the initial setting)
//   show: { members, joints, jointNames, supports, loadArrow, forces, forceLabels, widths, zeroMembers, jointForces, reactions, ghost, legend, labels, readouts,
//           indicator, handles, loadHandle, loadSlider, presets, selectable }
//       defaults true except jointNames, jointForces, ghost, loadSlider, selectable (false... selectable is true).
//       members = the bars; joints = the pins (dots); jointNames = A, B, C...; supports = triangle / roller marks; loadArrow = the applied loads; forces = tension / compression
//       colours on the bars (off: neutral); forceLabels = numbers on the bars; widths = bar thickness grows with |N|; zeroMembers = mark bars carrying no force;
//       jointForces = small arrows on each joint for the member forces (the method-of-joints picture); reactions = support reactions; ghost = faint original shape when it
//       collapses; legend = tension / compression key; labels = all text in the drawing; readouts = numbers row; indicator = the rigid / mechanism badge;
//       handles = draggable joints; loadHandle = draggable end of the load arrow (sets size and direction); loadSlider = slider for the vertical size of the first load;
//       presets = preset buttons; selectable = click a bar to read its force.
//   readouts: array of  status, count, maxtension, maxcompression, reactions, member, load
//   presets: [{ label, shape, span, height, panels, nodes, members, supports, loads }]   (a preset replaces the whole frame; Reset returns to the config)
//   labels: { status, count, maxtension, maxcompression, reactions, member, load, tension, compression, zero, rigid, redundant, mechanism, balanced, unbalanced,
//             collapse, reset, loadSlider, none }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 1) => { const t = Number((+v).toFixed(d)); return String(Object.is(t, -0) ? 0 : t); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const EPS = 1e-9;

// ---------- built-in shapes (exported for script checks) ----------
export function buildShape({ shape = 'braced', span = 4, height = 3, panels = 4 } = {}) {
  const L = span, H = height;
  const bottom = (p) => Array.from({ length: p + 1 }, (_, i) => [L * i / p, 0]);
  let nodes, members, sup;
  if (shape === 'square' || shape === 'braced') {
    nodes = [[0, 0], [L, 0], [L, H], [0, H]]; members = [[0, 1], [1, 2], [2, 3], [3, 0]];
    if (shape === 'braced') members.push([0, 2]);
    sup = [{ node: 0, type: 'pin' }, { node: 1, type: 'rollerY' }];
    return { nodes, members, supports: sup, mid: 0, top: 3 };
  }
  if (shape === 'triangle') {
    nodes = [[0, 0], [L, 0], [L / 2, H]]; members = [[0, 1], [1, 2], [2, 0]];
    return { nodes, members, supports: [{ node: 0, type: 'pin' }, { node: 1, type: 'rollerY' }], mid: 0, top: 2 };
  }
  const p = Math.max(2, Math.round(panels)), a = L / p;
  nodes = bottom(p); members = []; for (let i = 0; i < p; i++) members.push([i, i + 1]);
  if (shape === 'warren') {
    const t0 = nodes.length; for (let i = 0; i < p; i++) nodes.push([(i + 0.5) * a, H]);
    for (let i = 0; i < p - 1; i++) members.push([t0 + i, t0 + i + 1]);
    for (let i = 0; i < p; i++) members.push([i, t0 + i], [t0 + i, i + 1]);
    return { nodes, members, supports: [{ node: 0, type: 'pin' }, { node: p, type: 'rollerY' }], mid: Math.round(p / 2), top: t0 };
  }
  if (shape === 'pratt') {
    const t0 = nodes.length; for (let i = 1; i < p; i++) nodes.push([i * a, H]);   // top joint i -> index t0 + i - 1, above bottom joint i
    const T = i => t0 + i - 1;
    for (let i = 1; i < p - 1; i++) members.push([T(i), T(i + 1)]);
    for (let i = 1; i < p; i++) members.push([i, T(i)]);                              // verticals
    for (let i = 1; i < p; i++) { if (i < p / 2) members.push([T(i), i + 1]); else if (i > p / 2) members.push([T(i), i - 1]); }   // diagonals slope down to the centre
    members.push([0, T(1)], [p, T(p - 1)]);                                            // end posts (inclined)
    return { nodes, members, supports: [{ node: 0, type: 'pin' }, { node: p, type: 'rollerY' }], mid: Math.round(p / 2), top: T(1) };
  }
  throw new Error('truss-frame: unknown shape ' + shape);
}

// ---------- linear algebra ----------
function rref(M, ncols, tol = 1e-9) {   // in place, pivots only among the first `ncols` columns; returns {rank, piv}
  const R = M.length; let r = 0; const piv = [];
  for (let c = 0; c < ncols && r < R; c++) {
    let p = r; for (let i = r + 1; i < R; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
    if (Math.abs(M[p][c]) < tol) continue;
    [M[r], M[p]] = [M[p], M[r]];
    const d = M[r][c]; for (let j = 0; j < M[r].length; j++) M[r][j] /= d;
    for (let i = 0; i < R; i++) if (i !== r) { const f = M[i][c]; if (f) for (let j = 0; j < M[r].length; j++) M[i][j] -= f * M[r][j]; }
    piv.push(c); r++;
  }
  return { rank: r, piv };
}

// ---------- pure model (exported for script checks) ----------
// frame: {nodes:[[x,y]], members:[[i,j]], supports:[{node,type}], loads:[{node,fx,fy}]}
export function trussModel({ nodes, members, supports, loads }) {
  const n = nodes.length, m = members.length;
  const rc = []; for (const sp of supports) { if (sp.type !== 'rollerY') rc.push({ node: sp.node, d: 0 }); if (sp.type !== 'rollerX') rc.push({ node: sp.node, d: 1 }); }
  const cols = m + rc.length, rows = 2 * n;
  const A = Array.from({ length: rows }, () => new Array(cols).fill(0)), b = new Array(rows).fill(0);
  const len = members.map(([i, j]) => Math.hypot(nodes[j][0] - nodes[i][0], nodes[j][1] - nodes[i][1]));
  members.forEach(([i, j], k) => {
    if (len[k] < EPS) return;
    const c = (nodes[j][0] - nodes[i][0]) / len[k], sn = (nodes[j][1] - nodes[i][1]) / len[k];   // tension on joint i points toward j
    A[2 * i][k] += c; A[2 * i + 1][k] += sn; A[2 * j][k] -= c; A[2 * j + 1][k] -= sn;
  });
  rc.forEach((q, k) => { A[2 * q.node + q.d][m + k] = 1; });
  for (const l of loads) { b[2 * l.node] += l.fx ?? 0; b[2 * l.node + 1] += l.fy ?? 0; }   // A x = -b
  const Ar = A.map(r => r.slice());
  const rankA = rref(Ar, cols).rank;
  const aug = A.map((r, i) => [...r, -b[i]]);
  const { rank, piv } = rref(aug, cols);
  let consistent = true; for (let i = rank; i < rows; i++) if (Math.abs(aug[i][cols]) > 1e-7 * (1 + Math.hypot(...b))) consistent = false;
  let x = new Array(cols).fill(0);
  if (consistent) {
    if (rank === rows && cols > rows) {   // redundant: minimum-norm solution x = A^T y, (A A^T) y = -b
      const G = Array.from({ length: rows }, (_, i) => { const row = new Array(rows + 1).fill(0); for (let j = 0; j < rows; j++) for (let k = 0; k < cols; k++) row[j] += A[i][k] * A[j][k]; row[rows] = -b[i]; return row; });
      rref(G, rows); const y = G.map(r => r[rows]);
      for (let k = 0; k < cols; k++) for (let i = 0; i < rows; i++) x[k] += A[i][k] * y[i];
    } else piv.forEach((c, i) => { x[c] = aug[i][cols]; });
  }
  const status = rankA < rows ? 'mechanism' : cols > rows ? 'redundant' : 'rigid';
  // mechanism modes: null space of A^T (virtual displacements costing no member length and moving no support)
  let mode = null, work = 0;
  if (status === 'mechanism') {
    const B = Array.from({ length: cols }, (_, k) => Array.from({ length: rows }, (_, i) => A[i][k]));
    const { piv: pb } = rref(B, rows), free = []; for (let c = 0; c < rows; c++) if (!pb.includes(c)) free.push(c);
    const basis = free.map(fc => { const u = new Array(rows).fill(0); u[fc] = 1; pb.forEach((pc, i) => { u[pc] = -B[i][fc]; }); return u; });
    const f = new Array(rows).fill(0); for (const l of loads) { f[2 * l.node] += l.fx ?? 0; f[2 * l.node + 1] += l.fy ?? 0; }
    const wk = basis.map(u => u.reduce((acc, v, i) => acc + v * f[i], 0));
    mode = new Array(rows).fill(0); basis.forEach((u, k) => u.forEach((v, i) => { mode[i] += wk[k] * v; }));
    work = mode.reduce((acc, v, i) => acc + v * f[i], 0);
    const mx = Math.max(...mode.map(Math.abs)); if (mx < 1e-9) mode = null; else mode = mode.map(v => v / mx);
  }
  return { n, m, r: rc.length, rank: rankA, status, consistent, N: x.slice(0, m), reactions: rc.map((q, k) => ({ node: q.node, d: q.d, v: x[m + k] })), len, mode, collapses: !!mode && Math.abs(work) > 1e-9 };
}

// ---------- widget ----------
export function trussFrame(el, cfg) {
  const Lb = { status: 'Frame', count: 'Count', maxtension: 'Largest tension', maxcompression: 'Largest compression', reactions: 'Reactions', member: 'Selected bar', load: 'Load',
    tension: 'tension', compression: 'compression', zero: 'no force', rigid: 'Rigid: holds its shape', redundant: 'Rigid, with more bars than needed', mechanism: 'Mechanism: it can fold',
    balanced: 'Mechanism, but this load happens to balance', unbalanced: 'Load cannot be balanced: it collapses', collapse: 'collapses', reset: 'Reset', loadSlider: 'Load', none: 'click a bar',
    ...(cfg.labels ?? {}) };
  const U = { length: 'm', force: 'kN', ...(cfg.units ?? {}) };
  const show = { members: true, joints: true, jointNames: false, supports: true, loadArrow: true, forces: true, forceLabels: true, widths: true, zeroMembers: true, jointForces: false,
    reactions: true, ghost: false, legend: true, labels: true, readouts: true, indicator: true, handles: true, loadHandle: true, loadSlider: false, presets: true, selectable: true, ...(cfg.show ?? {}) };
  const snap = cfg.snap ?? 0.25, Rload = { load: [-100, 100, 1], ...(cfg.ranges ?? {}) }.load;

  const resolve = (spec, base) => {
    const nd = spec.nodes ?? (spec.shape ? undefined : base.nodes), mb = spec.nodes ? spec.members : base.members;
    const sh = nd ? { nodes: nd, members: mb ?? [], supports: [{ node: 0, type: 'pin' }, { node: 1, type: 'rollerY' }], mid: 0, top: 0 } : buildShape({ ...base, ...spec });
    const node = v => (v === 'mid' ? sh.mid : v === 'top' ? sh.top : +v);
    const loads = (spec.loads ?? base.loads ?? []).map(l => ({ node: node(l.node), fx: l.fx ?? 0, fy: l.fy ?? 0, hang: l.hang ?? (Math.abs(l.fy ?? 0) > Math.abs(l.fx ?? 0) && (l.fy ?? 0) < 0) }));
    return JSON.parse(JSON.stringify({ nodes: sh.nodes, members: sh.members, supports: spec.supports ?? base.supports ?? sh.supports, loads }));
  };
  const baseSpec = { shape: cfg.shape ?? 'braced', span: cfg.span ?? 4, height: cfg.height ?? 3, panels: cfg.panels ?? 4, nodes: cfg.nodes, members: cfg.members, supports: cfg.supports, loads: cfg.loads ?? [{ node: 'mid', fy: -10 }] };
  const init = resolve({}, baseSpec);
  let st = JSON.parse(JSON.stringify(init)); st.sel = -1;
  const names = i => (i < 26 ? String.fromCharCode(65 + i) : String(i));
  const mname = k => names(st.members[k][0]) + names(st.members[k][1]);

  // viewport fitted to the initial frame (fixed while dragging)
  const W = 360, Hh = 250, xs0 = init.nodes.map(p => p[0]), ys0 = init.nodes.map(p => p[1]);
  const bx0 = Math.min(...xs0), bx1 = Math.max(...xs0), by0 = Math.min(...ys0), by1 = Math.max(...ys0);
  const AX0 = 44, AX1 = 316, AY0 = 56, AY1 = 176;
  const sc = Math.min((AX1 - AX0) / Math.max(bx1 - bx0, 1e-6), (AY1 - AY0) / Math.max(by1 - by0, 1e-6)), ox = (AX0 + AX1) / 2 - (bx0 + bx1) / 2 * sc, oy = (AY0 + AY1) / 2 + (by0 + by1) / 2 * sc;
  const X = x => ox + x * sc, Y = y => oy - y * sc, unX = px => (px - ox) / sc, unY = py => (oy - py) / sc;
  const loadMag0 = Math.max(1e-9, ...init.loads.map(l => Math.hypot(l.fx, l.fy)));
  const kLoad = 48 / loadMag0;   // px per force unit
  const forceRef = cfg.forceScale ?? (() => { const mo = trussModel(init); return Math.max(1e-9, ...mo.N.map(Math.abs), loadMag0); })();
  const colT = show.forces ? 'var(--covec)' : 'var(--ink)', colC = show.forces ? 'var(--vec)' : 'var(--ink)';

  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fs-svg', role: 'img', 'aria-label': 'truss' });
  const arrow = (g0, x0, y0, x1, y1, col, wd = 2.2) => {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy); if (len < 2) return;
    const ux = dx / len, uy = dy / len, hs = Math.min(6.5, len * 0.5);
    g0.append(s('line', { x1: x0, y1: y0, x2: x1 - ux * hs * 0.6, y2: y1 - uy * hs * 0.6, stroke: col, 'stroke-width': wd }),
      s('path', { d: `M${x1},${y1} L${x1 - ux * hs - uy * hs * 0.5},${y1 - uy * hs + ux * hs * 0.5} L${x1 - ux * hs + uy * hs * 0.5},${y1 - uy * hs - ux * hs * 0.5} Z`, fill: col }));
  };

  let M = null;
  function paint() {
    svg.replaceChildren();
    const g0 = s('g'), lab = (x, y, txt, o = {}) => g0.append(s('text', { x, y, 'font-size': 9.5, fill: 'var(--muted)', ...o }, txt));
    M = trussModel(st);
    const collapsed = M.collapses && M.mode, dscale = 0.3 * Math.min(bx1 - bx0 || 1, by1 - by0 || 1) / 1;
    const pos = st.nodes.map((p, i) => collapsed ? [p[0] + dscale * M.mode[2 * i], p[1] + dscale * M.mode[2 * i + 1]] : p);
    const P = i => [X(pos[i][0]), Y(pos[i][1])];
    const unbal = !M.consistent;
    // ghost of the original when collapsed
    if (collapsed && show.ghost) st.members.forEach(([i, j]) => { g0.append(s('line', { x1: X(st.nodes[i][0]), y1: Y(st.nodes[i][1]), x2: X(st.nodes[j][0]), y2: Y(st.nodes[j][1]), stroke: 'var(--muted)', 'stroke-width': 2, 'stroke-dasharray': '4 4', opacity: 0.55 })); });
    // supports
    if (show.supports) st.supports.forEach(sp => {
      const [px, py] = P(sp.node);
      if (sp.type === 'pin') g0.append(s('path', { d: `M${px},${py} L${px - 9},${py + 14} L${px + 9},${py + 14} Z`, fill: 'var(--muted)', opacity: 0.4, stroke: 'var(--muted)' }), s('line', { x1: px - 13, y1: py + 15, x2: px + 13, y2: py + 15, stroke: 'var(--muted)', 'stroke-width': 2 }));
      else if (sp.type === 'rollerY') g0.append(s('path', { d: `M${px},${py} L${px - 8},${py + 11} L${px + 8},${py + 11} Z`, fill: 'var(--muted)', opacity: 0.4, stroke: 'var(--muted)' }), s('circle', { cx: px - 4, cy: py + 14, r: 3, fill: 'var(--muted)' }), s('circle', { cx: px + 4, cy: py + 14, r: 3, fill: 'var(--muted)' }), s('line', { x1: px - 13, y1: py + 18, x2: px + 13, y2: py + 18, stroke: 'var(--muted)', 'stroke-width': 2 }));
      else g0.append(s('path', { d: `M${px},${py} L${px - 11},${py - 8} L${px - 11},${py + 8} Z`, fill: 'var(--muted)', opacity: 0.4, stroke: 'var(--muted)' }));
    });
    // members
    if (show.members) st.members.forEach(([i, j], k) => {
      const [x1, y1] = P(i), [x2, y2] = P(j), f = M.N[k] ?? 0, zero = Math.abs(f) < 1e-6 * forceRef + 1e-9;
      const neutral = unbal || zero || !show.forces, col = neutral ? 'var(--ink)' : f > 0 ? colT : colC;
      const wd = show.widths && !unbal ? 2.2 + 5 * Math.min(1, Math.abs(f) / forceRef) : 3.2;
      const mk = { x1, y1, x2, y2, stroke: col, 'stroke-width': wd, 'stroke-linecap': 'round' };
      if (show.zeroMembers && zero && !unbal) { mk['stroke-dasharray'] = '5 4'; mk.opacity = 0.7; }
      g0.append(s('line', mk));
      if (show.selectable) g0.append(s('line', { x1, y1, x2, y2, stroke: 'transparent', 'stroke-width': 14, 'data-m': k, style: 'cursor:pointer' }));
      if (k === st.sel) g0.append(s('line', { x1, y1, x2, y2, stroke: 'var(--basis)', 'stroke-width': wd + 4, opacity: 0.3, 'pointer-events': 'none' }));
      if (show.forceLabels && show.labels && !unbal) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, sgn = ny > 0 ? -1 : 1;
        g0.append(s('text', { x: mx + nx * sgn * 9, y: my + ny * sgn * 9 + 3, 'font-size': 9.5, 'text-anchor': 'middle', fill: neutral ? 'var(--muted)' : col, 'font-weight': 650, stroke: 'var(--bg, #fff)', 'stroke-width': 3, 'paint-order': 'stroke' }, zero ? '0' : `${f > 0 ? '+' : '−'}${num(Math.abs(f), 1)}`));
      }
      // joint-force arrows: force the bar exerts on each joint (tension pulls the joint along the bar, compression pushes it away)
      if (show.jointForces && !unbal && !zero) [[i, x1, y1, x2, y2], [j, x2, y2, x1, y1]].forEach(([_, ax, ay, bx, by]) => {
        const d = Math.hypot(bx - ax, by - ay) || 1, sg = f > 0 ? 1 : -1, ux = (bx - ax) / d * sg, uy = (by - ay) / d * sg, len = 10 + 18 * Math.min(1, Math.abs(f) / forceRef);
        const sx = ax + (f > 0 ? 3 : 3) * ux, sy = ay + 3 * uy; arrow(g0, sx, sy, sx + ux * len, sy + uy * len, 'var(--ink)', 1.6);
      });
    });
    // joints
    if (show.joints) st.nodes.forEach((_, i) => { const [px, py] = P(i); g0.append(s('circle', { cx: px, cy: py, r: 4.2, fill: 'var(--bg, #fff)', stroke: 'var(--ink)', 'stroke-width': 1.8 })); });
    if (show.jointNames && show.labels) st.nodes.forEach((_, i) => { const [px, py] = P(i); lab(px + 6, py - 6, names(i), { fill: 'var(--ink)', 'font-weight': 650 }); });
    // loads
    st.loads.forEach((l, li) => {
      if (!show.loadArrow) return;
      const mag = Math.hypot(l.fx, l.fy); if (mag < EPS) return;
      const [px, py] = P(l.node), dx = l.fx / mag, dy = -l.fy / mag, len = clamp(mag * kLoad, 14, 86);
      const [tx, ty, hx, hy] = l.hang ? [px, py, px + dx * len, py + dy * len] : [px - dx * len, py - dy * len, px, py];
      if (l.hang) arrow(g0, px + dx * 5, py + dy * 5, hx, hy, 'var(--ink)', 3.4); else arrow(g0, tx, ty, px - dx * 5, py - dy * 5, 'var(--ink)', 3.4);
      if (show.labels) lab((tx + hx) / 2 + (Math.abs(dx) > 0.5 ? 0 : 6), (ty + hy) / 2 + (Math.abs(dx) > 0.5 ? -6 : 3), `${num(mag, 1)} ${U.force}`, { fill: 'var(--ink)', 'font-weight': 650, 'text-anchor': Math.abs(dx) > 0.5 ? 'middle' : 'start' });
      if (show.handles && show.loadHandle) { const [ex, ey] = l.hang ? [hx, hy] : [tx, ty]; g0.append(s('circle', { cx: ex, cy: ey, r: 7, fill: 'var(--bg, #fff)', stroke: 'var(--basis)', 'stroke-width': 2.5, 'data-load': li, style: 'cursor:move;touch-action:none' })); }
    });
    // reactions
    if (show.reactions && M.consistent && !collapsed) {
      const col = 'var(--basis)', byNode = new Map();
      M.reactions.forEach(q => { const o = byNode.get(q.node) ?? { fx: 0, fy: 0 }; if (q.d === 0) o.fx = q.v; else o.fy = q.v; byNode.set(q.node, o); });
      for (const [nd, r] of byNode) {
        const [px, py] = P(nd), by = st.supports.find(q => q.node === nd)?.type === 'rollerY' ? 21 : 18;
        if (Math.abs(r.fy) > 1e-6) { const len = clamp(Math.abs(r.fy) * kLoad, 10, 60); arrow(g0, px, py + by + (r.fy > 0 ? len : 0), px, py + by + (r.fy > 0 ? 0 : len), col, 3);
          if (show.labels) lab(px + 8, py + by + len / 2 + 4, num(r.fy, 1), { fill: col, 'font-weight': 650 }); }
        if (Math.abs(r.fx) > 1e-6) { const len = clamp(Math.abs(r.fx) * kLoad, 10, 60), sg = r.fx > 0 ? 1 : -1; arrow(g0, px - sg * (len + 14), py + 2, px - sg * 14, py + 2, col, 3);
          if (show.labels) lab(px - sg * (len + 14), py - 4, num(r.fx, 1), { fill: col, 'font-weight': 650, 'text-anchor': sg > 0 ? 'end' : 'start' }); }
      }
    }
    // indicator badge
    const word = M.status === 'mechanism' ? (collapsed ? (unbal ? Lb.unbalanced : Lb.collapse) : Lb.balanced) : M.status === 'redundant' ? Lb.redundant : Lb.rigid;
    if (show.indicator && show.labels) {
      const bad = M.status === 'mechanism', txt = M.status === 'mechanism' ? (collapsed ? Lb.mechanism + ' — ' + Lb.collapse : Lb.mechanism) : word;
      g0.append(s('rect', { x: 8, y: 8, width: Math.min(344, 12 + txt.length * 5.6), height: 18, rx: 4, fill: bad ? 'var(--bad, #c0392b)' : 'var(--good, #2e9e5b)', opacity: 0.18 }));
      lab(14, 21, txt, { fill: bad ? 'var(--bad, #c0392b)' : 'var(--good, #2e9e5b)', 'font-weight': 700, 'font-size': 10.5 });
    }
    if (show.legend && show.labels && show.forces) {
      const ly = Hh - 28;
      g0.append(s('rect', { x: 8, y: ly, width: 9, height: 9, fill: 'var(--covec)' }), s('rect', { x: 8, y: ly + 13, width: 9, height: 9, fill: 'var(--vec)' }));
      lab(21, ly + 8, Lb.tension, { fill: 'var(--ink)' }); lab(21, ly + 21, Lb.compression, { fill: 'var(--ink)' });
    }
    if (show.handles) st.nodes.forEach((_, i) => { const [px, py] = P(i); if (!collapsed) g0.append(s('circle', { cx: px, cy: py, r: 8, fill: 'transparent', stroke: 'var(--basis)', 'stroke-width': 1.5, opacity: 0.8, 'data-node': i, style: 'cursor:grab;touch-action:none' })); });
    svg.append(g0);
    readouts(word);
  }

  // ---------- readouts
  const readEl = h('div', { class: 'fs-reads' });
  function readouts(word) {
    const keys = cfg.readouts ?? ['status', 'count', 'maxtension', 'maxcompression'], ok = M.consistent;
    let hi = -Infinity, lo = Infinity, hik = -1, lok = -1; M.N.forEach((f, k) => { if (f > hi) { hi = f; hik = k; } if (f < lo) { lo = f; lok = k; } });
    const sel = st.sel >= 0 && st.sel < st.members.length ? st.sel : -1, f = sel >= 0 ? M.N[sel] : 0;
    const val = {
      status: word, count: `${M.m} + ${M.r} ${M.m + M.r >= 2 * M.n ? '≥' : '<'} 2 × ${M.n}`,
      maxtension: ok && hi > 1e-6 ? `${mname(hik)}: ${num(hi, 1)} ${U.force}` : '—', maxcompression: ok && lo < -1e-6 ? `${mname(lok)}: ${num(-lo, 1)} ${U.force}` : '—',
      reactions: ok ? M.reactions.map(q => `${names(q.node)}${q.d ? 'y' : 'x'} ${num(q.v, 1)}`).join(', ') : '—',
      member: sel < 0 ? Lb.none : ok ? `${mname(sel)}: ${num(Math.abs(f), 1)} ${U.force} ${Math.abs(f) < 1e-6 ? Lb.zero : f > 0 ? Lb.tension : Lb.compression}` : mname(sel),
      load: st.loads.map(l => `${num(Math.hypot(l.fx, l.fy), 1)} ${U.force}`).join(', '),
    };
    readEl.replaceChildren(...keys.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), h('div', { class: 'fs-num', role: 'status' }, val[k] ?? ''))));
    if (loadInp) { const l0 = st.loads[0], mg = l0 ? Math.hypot(l0.fx, l0.fy) : 0; loadInp.value = mg; loadVal.textContent = `${num(mg, 1)} ${U.force}`; }
  }

  // ---------- controls
  const loadInp = show.loadSlider ? h('input', { type: 'range', min: Rload[2], max: Rload[1], step: Rload[2], 'aria-label': Lb.loadSlider }) : null, loadVal = h('span', { class: 'fs-num' });
  if (loadInp) loadInp.addEventListener('input', () => { const l = st.loads[0], mg = l ? Math.hypot(l.fx, l.fy) : 0; if (l && mg > 0) { const k = +loadInp.value / mg; l.fx *= k; l.fy *= k; paint(); } });
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const presets = show.presets ? cfg.presets ?? [] : [];
  const keepSel = () => { st.sel = -1; };
  const btns = h('div', { class: 'wbtns' }, presets.map(pr => btn(pr.label, () => { st = { ...resolve(pr, { ...baseSpec, nodes: undefined, members: undefined, supports: undefined }), sel: -1 }; paint(); })),
    presets.length ? btn(Lb.reset, () => { st = JSON.parse(JSON.stringify(init)); keepSel(); paint(); }) : '');
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts ? readEl : '', loadInp ? h('div', { class: 'fs-sliders' }, h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb.loadSlider)), loadInp, loadVal)) : '', btns);

  // ---------- dragging
  let drag = null;
  const pt = ev => { const r = svg.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * Hh]; };
  svg.addEventListener('pointerdown', ev => {
    const t = ev.target; if (!t?.getAttribute) return;
    if (t.hasAttribute('data-m')) { const k = +t.getAttribute('data-m'); st.sel = st.sel === k ? -1 : k; paint(); return; }
    drag = t.hasAttribute('data-node') ? { k: 'node', i: +t.getAttribute('data-node') } : t.hasAttribute('data-load') ? { k: 'load', i: +t.getAttribute('data-load') } : null;
    if (drag) { svg.setPointerCapture?.(ev.pointerId); ev.preventDefault(); }
  });
  svg.addEventListener('pointermove', ev => {
    if (!drag) return;
    const [px, py] = pt(ev);
    if (drag.k === 'node') {
      st.nodes[drag.i] = [Math.round(unX(clamp(px, 14, W - 14)) / snap) * snap, Math.round(unY(clamp(py, 34, 190)) / snap) * snap];
    } else {
      const l = st.loads[drag.i], [nx, ny] = [X(st.nodes[l.node][0]), Y(st.nodes[l.node][1])];
      let dx = px - nx, dy = py - ny; if (!l.hang) { dx = -dx; dy = -dy; }
      const step = Rload[2] || 1; let fx = dx / kLoad, fy = -dy / kLoad;
      fx = clamp(Math.round(fx / step) * step, Rload[0], Rload[1]); fy = clamp(Math.round(fy / step) * step, Rload[0], Rload[1]);
      if (Math.abs(fx) < step * 0.5 && Math.abs(fy) < step * 0.5) fy = -step;
      l.fx = fx; l.fy = fy;
    }
    paint();
  });
  const up = () => { drag = null; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);

  paint();
}
