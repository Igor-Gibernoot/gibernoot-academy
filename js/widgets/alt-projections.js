// alt-projections
//
// Alternating minimization of the KL divergence between two curves K and S of the probability
// simplex of three outcomes (triangle). D[P:Q] = sum_i P_i ln(P_i/Q_i), P in K, Q in S (this
// argument order, always). Start at Q_0 in S, then alternately
//   P_t     = the point of K that minimizes D[P : Q_t]        (first argument free; the connecting
//             curve Q_t -> P_t is the exponential curve  q^(1-s) p^s / Z, s in [0,1])
//   Q_{t+1} = the point of S that minimizes D[P_t : Q]        (second argument free; the connecting
//             curve P_t -> Q_{t+1} is the straight mixture segment (1-s) p + s q)
// so that D[P_{t-1}:Q_t] >= D[P_t:Q_t] >= D[P_t:Q_{t+1}]. At each foot the connecting curve is
// orthogonal (Fisher metric) to the set it lands on (the marker's sides lie along the two curves;
// on screen the angle is not 90 degrees, the triangle is not drawn in the Fisher metric).
// Projections are computed numerically: a dense grid over the curve parameter, then golden section.
//
// Config:
//   outcomes: ['1','2','3']
//   K, S: a set each (keys below), plus optional name (default 'K' / 'S'), hue ('vec' for K,
//         'covec' for S):
//     { type:'mixture', a:[..], b:[..], t:[t0,t1] }     p = (1-t) a + t b; default t: the longest
//                                                       interval keeping every component >= 0.004
//     { type:'exponential', a:[..], b:[..], t:[t0,t1] } p_i proportional to a_i exp(t b_i); default t [-1,1]
//     { type:'arc', center:[..], r, from, to }          circle of the plane p1+p2+p3=1 (Euclidean
//                                                       radius r, angles in degrees)
//     { type:'curve', ps:[[..],..] }                    polyline through the listed points
//   start: [p1,p2,p3]            Q_0 (moved to the nearest point of S); default: middle of S
//   draggableStart: false        drag Q_0 along S (resets the path)
//   names: { K:'P', S:'Q' }      letters of the points (indices are added: P_0, Q_1, ...)
//   steps: 12                    max number of projections (each of P or Q counts one)
//   done: 0                      projections already done when the widget opens
//   showD: true                  table of D after every step (with bars)
//   showFoot: true               right-angle marker at every foot
//   showConnectors: true         draw the connecting curves (exp. from Q_t to P_t, mixture from
//                                P_t to Q_{t+1}); false = straight dashed segments
//   showMin: false               also mark and print the closest pair found by a grid search
//   hide: []                     any of 'buttons', 'table', 'tags' (K and S names on the curves),
//                                'feet', 'path', 'labels' (point names); picture-only presets
//   speed: 550                   ms per step of "Run"
//   labels: { step, run, reset, start, min }
//
// el.dataset: pts ("name:p1,p2,p3" joined by ' | '), d (D after each step joined by ','),
// steps (number done), min (grid-search closest-pair divergence, if showMin).

import { h } from '../dom.js';
import { mdInline, tex } from '../render.js';
import { s } from './plane.js';
import { V, HGT, SIDE, toXY, toP, norm, kl } from './simplex-points.js';

const M = src => h('span', { html: mdInline(String(src)) });
const T = src => h('span', { html: tex(String(src)) });
const HUES = { vec: 'var(--vec)', covec: 'var(--covec)', basis: 'var(--basis)', gold: 'var(--gold)' };
const f3 = x => x.toFixed(3);
const f4 = x => x.toFixed(4);
const EPS = 0.004;

// ---- the two sets
function makeSet(o) {
  const type = o.type ?? 'mixture';
  if (type === 'mixture') {
    const a = o.a, b = o.b;
    let t0 = -1e9, t1 = 1e9;
    for (let i = 0; i < 3; i++) {                      // a_i + t (b_i - a_i) >= EPS
      const d = b[i] - a[i], c = EPS - a[i];
      if (Math.abs(d) < 1e-12) continue;
      if (d > 0) t0 = Math.max(t0, c / d); else t1 = Math.min(t1, c / d);
    }
    const [lo, hi] = o.t ?? [t0, t1];
    return { f: t => a.map((x, i) => x + t * (b[i] - x)), t0: lo, t1: hi, type };
  }
  if (type === 'exponential') {
    const [lo, hi] = o.t ?? [-1, 1];
    return { f: t => norm(o.a.map((x, i) => x * Math.exp(t * o.b[i]))), t0: lo, t1: hi, type };
  }
  if (type === 'arc') {
    const U = [1 / Math.SQRT2, -1 / Math.SQRT2, 0], W = [1 / Math.sqrt(6), 1 / Math.sqrt(6), -2 / Math.sqrt(6)];
    return { f: t => { const th = t * Math.PI / 180; return o.center.map((x, i) => x + o.r * (Math.cos(th) * U[i] + Math.sin(th) * W[i])); },
      t0: o.from ?? 0, t1: o.to ?? 360, type };
  }
  const ps = o.ps.map(norm), n = ps.length - 1;       // curve
  return { f: t => { const k = Math.min(n - 1, Math.max(0, Math.floor(t))), u = t - k; return ps[k].map((x, i) => (1 - u) * x + u * ps[k + 1][i]); },
    t0: 0, t1: n, type };
}
const valid = p => p.every(x => x > 1e-9 && isFinite(x));

// minimise g(p) over the set: dense grid, then golden section in the best bracket
function argmin(set, g, N = 700) {
  let bi = -1, bv = Infinity;
  const tt = i => set.t0 + (set.t1 - set.t0) * i / N;
  for (let i = 0; i <= N; i++) {
    const p = set.f(tt(i));
    if (!valid(p)) continue;
    const v = g(p);
    if (v < bv) { bv = v; bi = i; }
  }
  if (bi < 0) return null;
  let a = tt(Math.max(0, bi - 1)), b = tt(Math.min(N, bi + 1));
  const gr = (Math.sqrt(5) - 1) / 2;
  const val = t => { const p = set.f(t); return valid(p) ? g(p) : Infinity; };
  let c = b - gr * (b - a), d = a + gr * (b - a), fc = val(c), fd = val(d);
  for (let k = 0; k < 70; k++) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - gr * (b - a); fc = val(c); }
    else { a = c; c = d; fc = fd; d = a + gr * (b - a); fd = val(d); }
  }
  let t = (a + b) / 2;
  const ends = [tt(bi), t].map(x => [x, val(x)]).sort((u, v) => u[1] - v[1]);
  t = ends[0][0];
  return { t, p: set.f(t) };
}

export function altProjections(el, cfg) {
  const outs = cfg.outcomes ?? ['1', '2', '3'];
  const Kset = makeSet(cfg.K), Sset = makeSet(cfg.S);
  const nm = { K: 'P', S: 'Q', ...(cfg.names ?? {}) };
  const setName = { K: cfg.K.name ?? 'K', S: cfg.S.name ?? 'S' };
  const hide = new Set(cfg.hide ?? []);
  const showD = cfg.showD !== false && !hide.has('table');
  const showFoot = cfg.showFoot !== false && !hide.has('feet');
  const showConn = cfg.showConnectors !== false;
  const maxSteps = cfg.steps ?? 12;
  const L = { step: 'Step', run: 'Run', reset: 'Reset', start: 'start', min: 'Closest pair (search)', ...(cfg.labels ?? {}) };
  const colK = HUES[cfg.K.hue ?? 'vec'] ?? cfg.K.hue, colS = HUES[cfg.S.hue ?? 'covec'] ?? cfg.S.hue;

  const DKL = (a, b) => `D[${a}:${b}]`;
  const projK = q => argmin(Kset, p => kl(p, q));     // P minimising D[P:Q]
  const projS = p => argmin(Sset, q => kl(p, q));     // Q minimising D[P:Q]
  const nearestS = p => argmin(Sset, q => q.reduce((a, x, i) => a + (x - p[i]) ** 2, 0), 1500);

  // ---- state
  let start = nearestS(cfg.start ?? Sset.f((Sset.t0 + Sset.t1) / 2));
  let seq = [];            // { kind:'K'|'S', idx, t, p, d (null for Q_0), from }
  let timer = null, converged = false;
  const reset = () => {
    stop(); converged = false;
    seq = [{ kind: 'S', idx: 0, t: start.t, p: start.p, d: null }];
    for (let i = 0; i < (cfg.done ?? 0); i++) if (!doStep()) break;
  };
  function doStep() {
    if (seq.length - 1 >= maxSteps) return false;
    const last = seq[seq.length - 1];
    let r, entry;
    if (last.kind === 'S') {
      r = projK(last.p); if (!r) return false;
      entry = { kind: 'K', idx: last.idx, t: r.t, p: r.p, d: kl(r.p, last.p) };
    } else {
      r = projS(last.p); if (!r) return false;
      entry = { kind: 'S', idx: last.idx + 1, t: r.t, p: r.p, d: kl(last.p, r.p) };
    }
    const prev = seq.length > 1 ? seq[seq.length - 1].d : null;
    seq.push(entry);
    if (prev != null && Math.abs(prev - entry.d) < 1e-10) converged = true;
    return true;
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  // ---- svg
  const svg = s('svg', { viewBox: `-14 -12 128 ${HGT + 28}`, role: 'img',
    'aria-label': `Probability simplex with two curves ${setName.K} and ${setName.S} and the alternating projections between them` });
  const gGrid = s('g'), gSet = s('g'), gConn = s('g'), gFoot = s('g'), gPts = s('g'), gLab = s('g');
  svg.append(gGrid, gSet, gConn, gFoot, gLab, gPts);
  gGrid.append(s('polygon', { points: V.map(v => v.join(',')).join(' '), class: 'sp-tri' }));
  for (let k = 1; k < 10; k++) {
    const t = k / 10;
    for (let i = 0; i < 3; i++) {
      const a = [0, 0, 0], b = [0, 0, 0];
      a[i] = t; b[i] = t; a[(i + 1) % 3] = 1 - t; b[(i + 2) % 3] = 1 - t;
      const [x1, y1] = toXY(a), [x2, y2] = toXY(b);
      gGrid.append(s('line', { x1, y1, x2, y2, class: 'sp-grid' }));
    }
  }
  gGrid.append(s('polygon', { points: V.map(v => v.join(',')).join(' '), class: 'sp-edge' }));
  const txt = (x, y, str, cls, anchor = 'middle') => {
    const t = s('text', { x, y, class: cls, 'text-anchor': anchor, 'dominant-baseline': 'middle' });
    t.textContent = str; return t;
  };
  const vlab = [[-3, HGT + 7, 'end'], [SIDE + 3, HGT + 7, 'start'], [SIDE / 2, -6, 'middle']];
  outs.slice(0, 3).forEach((o, i) => gLab.append(txt(vlab[i][0], vlab[i][1], String(o).replace(/[$*_`]/g, ''), 'sp-vlab', vlab[i][2])));

  const pathD = (set, n = 320) => {
    let d = '', pen = false;
    for (let i = 0; i <= n; i++) {
      const p = set.f(set.t0 + (set.t1 - set.t0) * i / n);
      if (p.some(x => x < -1e-9 || !isFinite(x))) { pen = false; continue; }
      const [x, y] = toXY(p.map(x => Math.max(0, x)));
      d += `${pen ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`; pen = true;
    }
    return d;
  };
  gSet.append(s('path', { d: pathD(Kset), class: 'ap-set', style: `stroke:${colK}` }),
    s('path', { d: pathD(Sset), class: 'ap-set', style: `stroke:${colS}` }));
  if (!hide.has('tags')) {
    for (const [key, set, col] of [['K', Kset, colK], ['S', Sset, colS]]) {
      const cands = [0.9, 0.1, 0.5].map(u => set.f(set.t0 + (set.t1 - set.t0) * u));
      const p = cands.find(valid) ?? cands[2];
      const [x, y] = toXY(p);
      const t = txt(x + (x > SIDE * 0.7 ? -5 : 5), y + (y < 10 ? 6 : -6), setName[key], 'ap-tag', x > SIDE * 0.7 ? 'end' : 'start');
      t.style.fill = col; gLab.append(t);
    }
  }

  // markers for the closest pair (optional)
  let best = null;
  if (cfg.showMin) {
    const N = 260;
    let bv = Infinity, bp = null;
    const Pp = [], Qq = [];
    for (let i = 0; i <= N; i++) { Pp.push(Kset.f(Kset.t0 + (Kset.t1 - Kset.t0) * i / N)); Qq.push(Sset.f(Sset.t0 + (Sset.t1 - Sset.t0) * i / N)); }
    let q = null;
    for (const p of Pp) if (valid(p)) for (const qq of Qq) if (valid(qq)) { const v = kl(p, qq); if (v < bv) { bv = v; bp = [p, qq]; } }
    q = bp[1]; let P = bp[0];
    for (let i = 0; i < 40; i++) { P = projK(q).p; q = projS(P).p; }
    best = { P, Q: q, d: kl(P, q) };
    for (const [p, col] of [[best.P, colK], [best.Q, colS]]) {
      const [x, y] = toXY(p);
      gFoot.append(s('circle', { cx: x, cy: y, r: 4.6, class: 'ap-best', style: `stroke:${col}` }));
    }
  }

  const gSeq = s('g');
  gConn.append(gSeq);
  const hit = s('circle', { r: 9, class: 'sp-hit' });

  // point name with a subscript
  const nameNode = (x, y, letter, idx, col, anchor) => {
    const t = s('text', { x, y, class: 'ap-name', 'text-anchor': anchor, 'dominant-baseline': 'middle', style: `fill:${col}` });
    t.append(document.createTextNode(letter));
    const sub = s('tspan', { dy: 2, 'font-size': 3.6 });
    sub.textContent = String(idx);
    t.append(sub);
    return t;
  };

  function unit(p0, p1) {
    const [x0, y0] = toXY(p0), [x1, y1] = toXY(p1);
    const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy) || 1;
    return [dx / n, dy / n];
  }
  function tangent(set, t) {
    const e = (set.t1 - set.t0) * 1e-3;
    const a = Math.max(set.t0, t - e), b = Math.min(set.t1, t + e);
    return unit(set.f(a), set.f(b));
  }
  function connector(kind, from, to) {         // path d from `from` to `to`
    if (!showConn) { const [x1, y1] = toXY(from), [x2, y2] = toXY(to); return `M${x1.toFixed(2)},${y1.toFixed(2)}L${x2.toFixed(2)},${y2.toFixed(2)}`; }
    let d = '';
    for (let k = 0; k <= 40; k++) {
      const u = k / 40;
      const r = kind === 'exp' ? norm(from.map((x, i) => Math.exp((1 - u) * Math.log(x) + u * Math.log(to[i])))) : from.map((x, i) => (1 - u) * x + u * to[i]);
      const [x, y] = toXY(r);
      d += `${k ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
    }
    return d;
  }

  // ---- readouts and buttons
  const table = h('div', { class: 'fe-sec ap-table' });
  const minLine = cfg.showMin ? h('div', { class: 'ap-min' }, M(L.min + ': '), T(`D[K:S]\\approx ${f4(best.d)}`)) : '';
  const bStep = h('button', { class: 'btn', type: 'button', onclick: () => { stop(); setRun(false); doStep(); draw(); } }, M(L.step));
  const bRun = h('button', { class: 'btn ghost', type: 'button', onclick: () => { if (timer) { stop(); setRun(false); return; } runAll(); } }, M(L.run));
  const bReset = h('button', { class: 'btn ghost', type: 'button', onclick: () => { reset(); setRun(false); draw(); } }, M(L.reset));
  const setRun = on => { bRun.textContent = ''; bRun.append(M(on ? 'Pause' : L.run)); };
  function runAll() {
    if (seq.length - 1 >= maxSteps || converged) { reset(); draw(); }
    setRun(true);
    timer = setInterval(() => {
      if (!doStep() || converged || seq.length - 1 >= maxSteps) { stop(); setRun(false); }
      draw();
    }, cfg.speed ?? 550);
    doStep(); draw();
  }

  el.classList.add('sp-widget', 'ap-widget');
  el.append(svg, showD ? table : '', minLine, hide.has('buttons') ? '' : h('div', { class: 'wbtns' }, bStep, bRun, bReset));

  // ---- draw
  function draw() {
    gSeq.textContent = ''; gFoot.querySelectorAll('.ap-foot').forEach(n => n.remove());
    gPts.textContent = ''; table.textContent = '';
    // path
    if (!hide.has('path')) {
      for (let i = 1; i < seq.length; i++) {
        const a = seq[i - 1], b = seq[i];
        const kind = b.kind === 'K' ? 'exp' : 'mix';
        gSeq.append(s('path', { d: connector(kind, a.p, b.p), class: 'ap-conn ' + (b.kind === 'K' ? 'k' : 's'), style: `stroke:${b.kind === 'K' ? colK : colS}` }));
      }
    }
    // feet
    if (showFoot) {
      for (let i = 1; i < seq.length; i++) {
        const a = seq[i - 1], b = seq[i];
        const set = b.kind === 'K' ? Kset : Sset;
        const [x, y] = toXY(b.p);
        const u = tangent(set, b.t);
        // direction of the connector at the foot, towards the other end
        const towards = b.kind === 'K'
          ? unit(b.p, norm(b.p.map((v, j) => Math.exp(0.97 * Math.log(v) + 0.03 * Math.log(a.p[j])))))
          : unit(b.p, b.p.map((v, j) => 0.97 * v + 0.03 * a.p[j]));
        const z = 4;
        const pts = [[x + z * u[0], y + z * u[1]], [x + z * (u[0] + towards[0]), y + z * (u[1] + towards[1])], [x + z * towards[0], y + z * towards[1]]];
        gFoot.append(s('polyline', { points: pts.map(q => q.join(',')).join(' '), class: 'ap-foot' }));
      }
    }
    // points
    seq.forEach((e, i) => {
      const [x, y] = toXY(e.p);
      const col = e.kind === 'K' ? colK : colS;
      const g = s('g', { class: 'sp-pt' + (i === 0 && cfg.draggableStart ? '' : ' fixed'), style: `--c:${col}` });
      g.append(s('circle', { cx: x, cy: y, r: i === seq.length - 1 ? 2.8 : 2.1, class: 'sp-dot' }));
      if (!hide.has('labels') && (seq.length <= 8 || i === 0 || i >= seq.length - 4)) {
        const left = e.kind === 'K';
        g.append(nameNode(x + (left ? -3.5 : 3.5), y + (left ? -4 : 5.5), nm[e.kind], e.idx, col, left ? 'end' : 'start'));
      }
      gPts.append(g);
    });
    if (cfg.draggableStart) {
      const [x, y] = toXY(seq[0].p);
      hit.setAttribute('cx', x); hit.setAttribute('cy', y);
      gPts.append(hit);
    }
    // table
    if (showD) {
      const rows = seq.filter(e => e.d != null);
      const scale = Math.max(...rows.map(e => e.d), 1e-9);
      if (!rows.length) table.append(h('div', { class: 'sp-sub' }, M('Press **Step** to project.')));
      else table.append(h('div', { class: 'sp-sub' }, M('Divergence after each step (nats)')));
      const grid = h('div', { class: 'ap-rows' });
      table.append(grid);
      rows.forEach(e => {
        const name = e.kind === 'K' ? DKL(`${nm.K}_{${e.idx}}`, `${nm.S}_{${e.idx}}`) : DKL(`${nm.K}_{${e.idx - 1}}`, `${nm.S}_{${e.idx}}`);
        const col = e.kind === 'K' ? colK : colS;
        const fill = h('span', { class: 'fe-fill', style: `background:${col};width:${Math.min(1, e.d / scale) * 100}%` });
        grid.append(h('div', { class: 'fe-brow' },
          h('div', { class: 'fe-blabel' }, h('span', {}, T(name)), h('span', { class: 'fe-val fe-bval' }, f4(e.d))),
          h('span', { class: 'fe-bar' }, fill)));
      });
      if (converged) table.append(h('div', { class: 'sp-sub' }, M('No further decrease: the pair has settled.')));
    }
    const doneN = seq.length - 1;
    bStep.disabled = doneN >= maxSteps || converged;
    el.dataset.pts = seq.map(e => `${nm[e.kind]}${e.idx}:${e.p.map(f4).join(',')}`).join(' | ');
    el.dataset.d = seq.filter(e => e.d != null).map(e => e.d.toFixed(6)).join(',');
    el.dataset.steps = String(doneN);
    if (best) el.dataset.min = best.d.toFixed(6);
  }

  if (cfg.draggableStart) {
    hit.addEventListener('pointerdown', e => {
      e.preventDefault();
      hit.setPointerCapture(e.pointerId);
      const move = ev => {
        const pt = svg.createSVGPoint();
        pt.x = ev.clientX; pt.y = ev.clientY;
        const m = pt.matrixTransform(svg.getScreenCTM().inverse());
        const r = nearestS(toP([m.x, m.y]).map(x => Math.max(0, x)));
        if (r) { start = r; reset(); setRun(false); draw(); }
      };
      const up = () => { hit.removeEventListener('pointermove', move); hit.removeEventListener('pointerup', up); hit.removeEventListener('pointercancel', up); };
      hit.addEventListener('pointermove', move);
      hit.addEventListener('pointerup', up);
      hit.addEventListener('pointercancel', up);
    });
  }

  reset();
  draw();
}
