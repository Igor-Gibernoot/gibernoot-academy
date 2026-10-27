// lever-balance
//
// A plank on a pivot. Forces act downward at positions along the plank; the torque of a force about the
// pivot is  tau = F * |x - pivot|  (force times arm). The side with the larger total torque tips down.
// Drag the pivot and the loads (or use the arrow keys on a focused handle). Fully general: no course text
// is hard-coded; every word comes from the config.
//
//   length: 10, start: 0       the plank covers x = start .. start + length
//   snap: 0.1                  positions snap to this step (same unit as x)
//   pivot: { x: 5, fixed: false }          fixed = true: the pivot cannot be dragged
//   loads: [{ x, F, fixed, fixedF, label, torque, side }]
//       x position, F force (downward); fixed: x cannot be dragged; fixedF: F cannot change.
//       A load with `torque` (instead of F) is a pure torque about the pivot, with side 'L' or 'R'
//       (e.g. the resisting torque of a bolt); it has no position and no arm.
//   forceRange: [0, 100]       range of the force sliders;  forceStep: 1
//   forceSliders: false        true = one slider per load whose force may change (fixedF not set)
//   forceMax: auto             force that gives the longest arrow;  torqueMax: auto, torque that fills a bar
//   rulerStep: auto            tick spacing of the ruler (same unit as x)
//   pivotShape: 'triangle' | 'bolt'        support drawn under the plank / a hexagon on the plank
//   show: { arms, torques, forceArrows, tilt, ruler, readouts, pivot, labels, torqueArrows }   false hides (default true)
//       arms = dashed arms with their lengths; torques = the two torque bars with values; tilt = plank
//       rotates (false = stays level, text verdict still given); torqueArrows = curved arrows of `torque` loads;
//       labels = load names; pivot = the support and its handle
//   readouts: ['torqueL','torqueR','net','ratio','verdict']   which readouts, in order
//   units: { length: 'm', force: 'N', torque: 'N m' }
//   presets: [{ label, pivot: x, loads: [{x, F}, ...] }]   buttons; loads listed by index, only given fields change
//   labels: { torqueL, torqueR, net, ratio, verdict, balanced, tipsLeft, tipsRight, reset, plank, force, left, right }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => String(Number((+v).toFixed(d)));

// Pure model, exported for script checks. loads: [{x, F, torque, side}]. Returns torques and verdict.
export function torques(pivotX, loads) {
  let L = 0, R = 0;
  for (const l of loads) {
    if (l.torque != null) { if (l.side === 'L') L += l.torque; else R += l.torque; continue; }
    const arm = l.x - pivotX;
    if (arm < 0) L += l.F * -arm; else if (arm > 0) R += l.F * arm;
  }
  const net = R - L, tol = 1e-9 + 1e-6 * Math.max(L, R);
  return { L, R, net, verdict: Math.abs(net) <= tol ? 0 : net > 0 ? 1 : -1, ratio: L > 0 ? R / L : null };
}

export function leverBalance(el, cfg) {
  const Lb = { torqueL: 'Left torque', torqueR: 'Right torque', net: 'Net torque (right minus left)', ratio: 'Right / left',
    verdict: 'Verdict', balanced: 'Balanced', tipsLeft: 'Tips left', tipsRight: 'Tips right', reset: 'Reset', plank: 'Plank on a pivot',
    force: 'Force', left: 'left', right: 'right', ...(cfg.labels ?? {}) };
  const show = { arms: true, torques: true, forceArrows: true, tilt: true, ruler: true, readouts: true, pivot: true, labels: true, torqueArrows: true, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['torqueL', 'torqueR', 'net', 'verdict'];
  const U = { length: 'm', force: 'N', torque: 'N m', ...(cfg.units ?? {}) };
  const len = cfg.length ?? 10, x0 = cfg.start ?? 0, x1 = x0 + len, snap = cfg.snap ?? 0.1;
  const rulerStep = cfg.rulerStep ?? (len > 20 ? 5 : len > 4 ? 1 : len > 1.5 ? 0.5 : 0.1);
  const [fLo, fHi] = cfg.forceRange ?? [0, 100], fStep = cfg.forceStep ?? 1;
  const init = { pivot: cfg.pivot?.x ?? x0 + len / 2, loads: (cfg.loads ?? []).map(l => ({ ...l })) };
  const st = { pivot: init.pivot, loads: init.loads.map(l => ({ ...l })) };
  const pivotFixed = cfg.pivot?.fixed === true;
  const forceMax = cfg.forceMax ?? Math.max(1, 1.5 * Math.max(...init.loads.map(l => l.F ?? 0), 1));
  const t0 = torques(init.pivot, init.loads);
  const torqueMax = cfg.torqueMax ?? Math.max(1e-9, 1.5 * Math.max(t0.L, t0.R, ...init.loads.map(l => l.torque ?? 0)));

  // geometry (px)
  const W = 360, H = 226, PX0 = 24, PX1 = 336, PY = 112;
  const X = x => PX0 + (x - x0) / len * (PX1 - PX0), invX = px => x0 + (px - PX0) / (PX1 - PX0) * len;
  const clampX = v => Math.min(x1, Math.max(x0, Math.round(v / snap) * snap));

  // static parts
  const plankG = s('g'), plank = s('rect', { x: PX0 - 6, y: PY - 5, width: PX1 - PX0 + 12, height: 10, rx: 2, fill: 'var(--ink)', opacity: 0.85 });
  plankG.append(plank);
  if (show.ruler) {
    for (let v = Math.ceil(x0 / rulerStep - 1e-9) * rulerStep; v <= x1 + 1e-9; v += rulerStep) {
      plankG.append(s('line', { x1: X(v), y1: PY + 5, x2: X(v), y2: PY + 9, stroke: 'var(--ink)', 'stroke-width': 1 }),
        s('text', { x: X(v), y: PY + 19, 'text-anchor': 'middle', 'font-size': 8.5, fill: 'var(--muted)' }, num(v, 2)));
    }
  }
  const support = s('polygon', { fill: 'var(--muted)', opacity: 0.8 });
  const hex = s('polygon', { fill: 'var(--muted)', stroke: 'var(--ink)', 'stroke-width': 1.5 });
  const bolt = cfg.pivotShape === 'bolt';
  const pivotHandle = s('circle', { r: 7, fill: 'var(--basis)', stroke: 'var(--bg, #fff)', 'stroke-width': 1.5, class: 'lb-handle', tabindex: 0, role: 'slider', 'aria-label': 'pivot' });
  const ground = s('line', { stroke: 'var(--muted)', 'stroke-width': 2 });

  const dyn = s('g');
  const barY = 207;
  const barL = s('rect', { y: barY - 7, height: 14, fill: 'var(--vec)', rx: 2 }), barR = s('rect', { y: barY - 7, height: 14, fill: 'var(--covec)', rx: 2 });
  const tL = s('text', { y: barY + 4, 'font-size': 10, fill: 'var(--ink)' }), tR = s('text', { y: barY + 4, 'font-size': 10, fill: 'var(--ink)' });
  const mid = s('line', { x1: W / 2, y1: barY - 11, x2: W / 2, y2: barY + 11, stroke: 'var(--muted)', 'stroke-width': 1.5 });
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lb-svg', role: 'img', 'aria-label': Lb.plank }, ground, dyn);

  const drags = [];
  const loadEls = st.loads.map((l, i) => {
    const g = {};
    if (l.torque != null) {
      g.arc = s('path', { fill: 'none', stroke: 'var(--covec)', 'stroke-width': 3, 'stroke-linecap': 'round' });
      g.head = s('polygon', { fill: 'var(--covec)' });
      g.txt = s('text', { 'font-size': 10, 'text-anchor': 'middle', fill: 'var(--ink)' });
    } else {
      g.line = s('line', { stroke: 'var(--covec)', 'stroke-width': 3, 'stroke-linecap': 'round' });
      g.head = s('polygon', { fill: 'var(--covec)' });
      g.arm = s('line', { stroke: 'var(--basis)', 'stroke-width': 2, 'stroke-dasharray': '5 3' });
      g.armE = s('line', { stroke: 'var(--basis)', 'stroke-width': 2 });
      g.armT = s('text', { 'font-size': 10, 'text-anchor': 'middle', fill: 'var(--basis)', 'font-weight': 650 });
      g.txt = s('text', { 'font-size': 10, 'text-anchor': 'middle', fill: 'var(--ink)' });
      g.hd = s('circle', { r: 7, fill: 'var(--covec)', stroke: 'var(--bg, #fff)', 'stroke-width': 1.5, class: 'lb-handle', tabindex: l.fixed ? -1 : 0, role: 'slider', 'aria-label': l.label ?? `load ${i + 1}` });
      if (!l.fixed) { g.hd.style.cursor = 'ew-resize'; drags.push({ hd: g.hd, set: v => { l.x = clampX(v); draw(); } , get: () => l.x }); }
    }
    return g;
  });
  if (!pivotFixed && show.pivot) { pivotHandle.style.cursor = 'ew-resize'; drags.push({ hd: pivotHandle, set: v => { st.pivot = clampX(v); draw(); }, get: () => st.pivot }); }

  for (const d of drags) {
    d.hd.addEventListener('pointerdown', e => {
      e.preventDefault(); d.on = true; try { d.hd.setPointerCapture(e.pointerId); } catch {}
    });
    const mv = e => {
      if (!d.on) return;
      const m = svg.getScreenCTM(); if (!m) return;
      const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      d.set(invX(p.matrixTransform(m.inverse()).x));
    };
    d.hd.addEventListener('pointermove', mv); window.addEventListener('pointermove', mv);
    const up = () => { d.on = false; };
    d.hd.addEventListener('pointerup', up); d.hd.addEventListener('pointercancel', up); window.addEventListener('pointerup', up);
    d.hd.addEventListener('keydown', e => {
      const k = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
      if (k) { e.preventDefault(); d.set(d.get() + k * snap); d.hd.focus(); }
    });
  }

  // readouts
  const rd = {};
  const names = { torqueL: Lb.torqueL, torqueR: Lb.torqueR, net: Lb.net, ratio: Lb.ratio, verdict: Lb.verdict };
  const readEl = h('div', { class: 'lb-reads' }, reads.map(k => h('div', { class: 'lb-cell' },
    h('div', { class: 'lb-lab' }, mdInline(names[k] ?? k)), rd[k] = h('div', { class: 'lb-num', role: k === 'verdict' ? 'status' : null }))));

  // force sliders
  const sliderEls = [];
  if (cfg.forceSliders) st.loads.forEach((l, i) => {
    if (l.fixedF || l.torque != null) return;
    const inp = h('input', { type: 'range', min: fLo, max: fHi, step: fStep, value: l.F, 'aria-label': `${Lb.force}: ${l.label ?? i + 1}` });
    const val = h('span', { class: 'lb-num' });
    const sync = () => { val.textContent = `${num(l.F)} ${U.force}`; };
    inp.addEventListener('input', () => { l.F = +inp.value; sync(); draw(); });
    l.sync = () => { inp.value = l.F; sync(); }; sync();
    sliderEls.push(h('label', { class: 'lb-slide' }, h('span', { class: 'lb-lab' }, mdInline(`${Lb.force} ${l.label ?? ''}`.trim())), inp, val));
  });

  const reset = () => { st.pivot = init.pivot; st.loads.forEach((l, i) => { Object.assign(l, init.loads[i]); l.sync?.(); }); draw(); };
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const btns = h('div', { class: 'wbtns' }, btn(Lb.reset, reset),
    (cfg.presets ?? []).map(pr => btn(pr.label, () => {
      if (pr.pivot != null) st.pivot = pr.pivot;
      (pr.loads ?? []).forEach((pl, i) => { if (pl && st.loads[i]) { Object.assign(st.loads[i], pl); st.loads[i].sync?.(); } });
      draw();
    })));

  el.append(h('div', { class: 'lb-fig' }, svg), show.readouts && reads.length ? readEl : '', sliderEls.length ? h('div', { class: 'lb-sliders' }, sliderEls) : '', btns);

  // ---- drawing
  let theta = 0, target = 0, raf = 0, last = 0;
  function layout() {
    const px = X(st.pivot), c = Math.cos(theta), sn = Math.sin(theta);
    const pt = x => { const dx = X(x) - px; return [px + dx * c, PY + dx * sn]; };
    return { px, pt };
  }
  function draw() {
    const T = torques(st.pivot, st.loads);
    const mag = Math.min(1, Math.abs(T.net) / torqueMax);
    target = show.tilt && T.verdict ? T.verdict * (3 + 7 * mag) * Math.PI / 180 : 0;
    frame(); startLoop();
    const f = v => num(v);
    if (rd.torqueL) rd.torqueL.textContent = `${f(T.L)} ${U.torque}`;
    if (rd.torqueR) rd.torqueR.textContent = `${f(T.R)} ${U.torque}`;
    if (rd.net) rd.net.textContent = `${num(T.net)} ${U.torque}`;
    if (rd.ratio) rd.ratio.textContent = T.ratio == null ? '–' : num(T.ratio, 2);
    if (rd.verdict) { rd.verdict.textContent = T.verdict === 0 ? Lb.balanced : T.verdict < 0 ? Lb.tipsLeft : Lb.tipsRight; rd.verdict.className = `lb-num ${T.verdict === 0 ? 'ok' : ''}`; }
    // torque bars (not tied to the animation)
    dyn.querySelectorAll('.lb-bars').forEach(n => n.remove());
    if (show.torques) {
      const wL = Math.min(1, T.L / torqueMax) * (W / 2 - 30), wR = Math.min(1, T.R / torqueMax) * (W / 2 - 30);
      barL.setAttribute('x', W / 2 - wL); barL.setAttribute('width', wL); barR.setAttribute('x', W / 2); barR.setAttribute('width', wR);
      tL.setAttribute('x', W / 2 - wL - 4); tL.setAttribute('text-anchor', 'end'); tL.textContent = `${f(T.L)} ${U.torque}`;
      tR.setAttribute('x', W / 2 + wR + 4); tR.setAttribute('text-anchor', 'start'); tR.textContent = `${f(T.R)} ${U.torque}`;
      const g = s('g', { class: 'lb-bars' }, mid, barL, barR, tL, tR); dyn.append(g);
    }
  }
  function frame() {
    const { px, pt } = layout();
    plankG.setAttribute('transform', `rotate(${theta * 180 / Math.PI} ${px} ${PY})`);
    // support
    if (show.pivot) {
      if (bolt) {
        hex.setAttribute('points', [0, 1, 2, 3, 4, 5].map(k => `${px + 13 * Math.cos(k * Math.PI / 3)},${PY + 13 * Math.sin(k * Math.PI / 3)}`).join(' '));
      } else {
        support.setAttribute('points', `${px},${PY + 3} ${px - 15},${PY + 40} ${px + 15},${PY + 40}`);
        ground.setAttribute('x1', 12); ground.setAttribute('x2', W - 12); ground.setAttribute('y1', PY + 40); ground.setAttribute('y2', PY + 40);
        pivotHandle.setAttribute('cx', px); pivotHandle.setAttribute('cy', PY + 30);
      }
      if (bolt) { pivotHandle.setAttribute('cx', px); pivotHandle.setAttribute('cy', PY); }
      pivotHandle.setAttribute('aria-valuenow', st.pivot);
    }
    st.loads.forEach((l, i) => {
      const g = loadEls[i];
      if (l.torque != null) {
        const left = l.side === 'L', r = 30, cy = PY, a0 = left ? -50 : -130, a1 = left ? -130 : -50;
        const P = a => [px + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
        const [ax, ay] = P(a0), [bx, by] = P(a1);
        g.arc.setAttribute('d', `M ${ax} ${ay} A ${r} ${r} 0 0 ${left ? 0 : 1} ${bx} ${by}`);
        // arrow head: tangent direction at the end
        const dir = left ? -1 : 1, ang = a1 * Math.PI / 180, tx = -Math.sin(ang) * dir, ty = Math.cos(ang) * dir, nx = -ty, ny = tx;
        g.head.setAttribute('points', `${bx + tx * 7},${by + ty * 7} ${bx + nx * 5},${by + ny * 5} ${bx - nx * 5},${by - ny * 5}`);
        g.txt.setAttribute('x', px); g.txt.setAttribute('y', cy - r - 6); g.txt.textContent = show.labels ? `${l.label ?? ''} ${num(l.torque)} ${U.torque}`.trim() : '';
        return;
      }
      const [fx, fy] = pt(l.x), top = fy - 6, aLen = 12 + 38 * Math.min(1, l.F / forceMax);
      g.line.setAttribute('x1', fx); g.line.setAttribute('x2', fx); g.line.setAttribute('y1', top - aLen); g.line.setAttribute('y2', top - 6);
      g.head.setAttribute('points', `${fx},${top} ${fx - 5},${top - 9} ${fx + 5},${top - 9}`);
      g.txt.setAttribute('x', fx); g.txt.setAttribute('y', top - aLen - 4);
      g.txt.textContent = show.labels ? `${l.label ? l.label + ' ' : ''}${num(l.F)} ${U.force}` : '';
      g.hd.setAttribute('cx', fx); g.hd.setAttribute('cy', fy); g.hd.setAttribute('aria-valuenow', l.x);
      const ay = PY + 55, arm = l.x - st.pivot;
      g.arm.setAttribute('x1', px); g.arm.setAttribute('x2', fx); g.arm.setAttribute('y1', ay); g.arm.setAttribute('y2', ay);
      g.armE.setAttribute('x1', fx); g.armE.setAttribute('x2', fx); g.armE.setAttribute('y1', fy + 6); g.armE.setAttribute('y2', ay + 4);
      g.armT.setAttribute('x', (px + fx) / 2); g.armT.setAttribute('y', ay + 13);
      g.armT.textContent = `${num(Math.abs(arm))} ${U.length}`;
    });
  }
  function startLoop() {
    cancelAnimationFrame(raf); last = performance.now();
    const tick = now => {
      if (!el.isConnected) return;
      const k = 1 - Math.exp(-(now - last) / 120); last = now;
      theta += (target - theta) * k;
      if (Math.abs(target - theta) < 1e-3) theta = target;
      frame();
      if (theta !== target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  // assemble svg in layer order
  dyn.append(plankG);
  if (show.pivot) dyn.append(bolt ? hex : support);
  st.loads.forEach((l, i) => {
    const g = loadEls[i];
    if (l.torque != null) { if (show.torqueArrows) dyn.append(g.arc, g.head, g.txt); return; }
    if (show.arms) dyn.append(g.arm, g.armE, g.armT);
    if (show.forceArrows) dyn.append(g.line, g.head);
    if (show.labels) dyn.append(g.txt);
  });
  if (show.pivot && !pivotFixed) dyn.append(pivotHandle);
  st.loads.forEach((l, i) => { if (loadEls[i].hd) dyn.append(loadEls[i].hd); });
  if (!show.pivot) pivotHandle.remove();
  if (!show.arms) { /* arms never attached */ }
  draw();
}
