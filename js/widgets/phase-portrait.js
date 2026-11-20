// phase-portrait
//
// The position-momentum plane (q horizontal, p vertical) of a one-dimensional system with unit mass, plus a small side view
// of the physical system moving in sync.  The reader clicks or drags in the plane to choose a start point; the widget draws
// the orbit through it (energy contour when there is no damping, the integrated spiral when there is) and animates the point.
// Motion is integrated by RK4 for  q' = p,  p' = -V'(q) - gamma p  (m = 1, dimensionless units).
//
//   system: pendulum   V = 1 - cos q   (m = l = g = 1; q = angle from hanging down; separatrix at E = 2, bottom E = 0)
//           spring     V = q^2/2       (m = k = 1; period 2 pi)
//           hill       V = -q^2/2      (inverted potential: unstable equilibrium, hyperbolas)
//   q: 1.0, p: 0                       start point (the first orbit, also the Restart point)
//   interactive: true                  click/drag in the plane sets the start; false = display only (no click, no pointer)
//   fixedStart: false                  true = the start is q, p from the config and the reader cannot change it (implies interactive false)
//   gamma: 0                           damping coefficient (spiral to rest for gamma > 0)
//   sliders: []                        any of ['gamma']
//   ranges: { gamma: [0, 0.6, 0.01] }
//   qRange: [-4.7, 4.7] (pendulum), [-2.5, 2.5] otherwise      pRange: [-2.6, 2.6] (pendulum), [-2.5, 2.5] otherwise
//   wrap: true                         pendulum only: a rotating orbit re-enters at the left edge (angle taken mod 2 pi) instead of leaving
//   speed: 1.5                         simulated time units per second;  autoplay: true
//   contourLevels: [0.25, 0.6, 1, 1.5, 2.6, 3.5]   energies of the background family of orbits (used when show.contours)
//   show: { axes, axisLabels, ticks, contours, orbit, separatrix, fixedPoints, trail, fade, point, direction, sideView, readouts,
//           sliders, buttons, start }
//       defaults true except ticks, contours, separatrix, direction (false); axes = the two axis lines; axisLabels = the letters q, p;
//       ticks = tick numbers (multiples of pi for the pendulum, integers otherwise); contours = faint family of orbits; orbit = the
//       orbit through the start (undamped: its energy contour; damped: the whole spiral); separatrix = the E = 2 curve (pendulum only);
//       fixedPoints = equilibrium markers; trail = path travelled so far; fade = older trail dimmer; point = the moving dot;
//       direction = an arrow on the dot along the flow; sideView = the pendulum / mass-spring / ball-on-hill drawing; readouts = readout
//       cells; sliders = slider block; buttons = Restart / Pause / presets; start = mark the chosen start point.
//   readouts: ['E', 'period']          any of E, period, q, p, gamma, time.  Period appears for undamped bound orbits (pendulum, spring) only.
//   presets: [{ label, q, p, gamma }]  buttons; set the start (and gamma if given), then restart
//   labels: { q, p, E, period, gamma, time, restart, pause, play, figure, side, start }
//
// Pure model exported for script checks: phaseModel(system) -> { V, dV, period(E) }, phaseStep(sys, gamma, q, p, dt).

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => String(Number((+v).toFixed(d)));
const TAU = 2 * Math.PI;

// Complete elliptic integral of the first kind, parameter m = k^2 (arithmetic-geometric mean).
const ellipK = m => { let a = 1, b = Math.sqrt(1 - m); for (let i = 0; i < 40 && Math.abs(a - b) > 1e-15; i++) { [a, b] = [(a + b) / 2, Math.sqrt(a * b)]; } return Math.PI / (2 * a); };

export function phaseModel(system) {
  if (system === 'spring') return { V: q => 0.5 * q * q, dV: q => q, period: E => (E >= 0 ? TAU : null), Emax: Infinity };
  if (system === 'hill') return { V: q => -0.5 * q * q, dV: q => -q, period: () => null, Emax: Infinity };
  return {   // pendulum; E = p^2/2 + 1 - cos q
    V: q => 1 - Math.cos(q), dV: q => Math.sin(q), Emax: 2,
    period: E => E < 0 ? null : E < 2 ? 4 * ellipK(E / 2) : E > 2 ? 4 * ellipK(2 / E) / Math.sqrt(2 * E) : Infinity,
  };
}
// One RK4 step of q' = p, p' = -V'(q) - gamma p.
export function phaseStep(M, gamma, q, p, dt) {
  const f = (qq, pp) => [pp, -M.dV(qq) - gamma * pp];
  const [a1, b1] = f(q, p), [a2, b2] = f(q + 0.5 * dt * a1, p + 0.5 * dt * b1), [a3, b3] = f(q + 0.5 * dt * a2, p + 0.5 * dt * b2), [a4, b4] = f(q + dt * a3, p + dt * b3);
  return [q + dt / 6 * (a1 + 2 * a2 + 2 * a3 + a4), p + dt / 6 * (b1 + 2 * b2 + 2 * b3 + b4)];
}

export function phasePortrait(el, cfg = {}) {
  const system = ['pendulum', 'spring', 'hill'].includes(cfg.system) ? cfg.system : 'pendulum';
  const M = phaseModel(system), pend = system === 'pendulum';
  const Lb = { q: 'q', p: 'p', E: 'Energy', period: 'Period', gamma: 'Damping', time: 'Time', restart: 'Restart', pause: 'Pause', play: 'Play',
    figure: 'Position-momentum plane', side: 'The physical system', start: 'start', ...(cfg.labels ?? {}) };
  const show = { axes: true, axisLabels: true, ticks: false, contours: false, orbit: true, separatrix: false, fixedPoints: true, trail: true, fade: true,
    point: true, direction: false, sideView: true, readouts: true, sliders: true, buttons: true, start: true, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['E', 'period'];
  const sliderKeys = cfg.sliders ?? [];
  const Rg = { gamma: [0, 0.6, 0.01], ...(cfg.ranges ?? {}) };
  const [qlo, qhi] = cfg.qRange ?? (pend ? [-4.7, 4.7] : [-2.5, 2.5]);
  const [plo, phi] = cfg.pRange ?? (pend ? [-2.6, 2.6] : [-2.5, 2.5]);
  const interactive = (cfg.interactive ?? true) && !cfg.fixedStart;
  const wrap = pend && (cfg.wrap ?? true) && (qhi - qlo) >= TAU;
  const rate = cfg.speed ?? 1.5;
  const levels = cfg.contourLevels ?? (pend ? [0.25, 0.6, 1, 1.5, 2.6, 3.5] : [0.25, 0.7, 1.5, 2.5, 3.5]);
  const init = { q: cfg.q ?? 1, p: cfg.p ?? 0, gamma: cfg.gamma ?? 0 };
  const st = { ...init };

  const W = 360, H = 300, X0 = 30, X1 = W - 10, Y0 = 10, Y1 = H - 26;
  const px = q => X0 + (q - qlo) / (qhi - qlo) * (X1 - X0), py = p => Y1 - (p - plo) / (phi - plo) * (Y1 - Y0);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.figure, style: interactive ? 'touch-action:none;cursor:crosshair' : '' });
  const SW = 360, SH = 120;
  const side = show.sideView ? s('svg', { viewBox: `0 0 ${SW} ${SH}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.side }) : null;
  const clipId = 'pp-clip-' + Math.random().toString(36).slice(2, 8);

  let q = st.q, p = st.p, t = 0, trail = [], playing = !!(cfg.autoplay ?? true), dragging = false, raf = 0, last = 0, orbitCache = null;
  const energy = (qq, pp) => 0.5 * pp * pp + M.V(qq);
  const wrapQ = qq => wrap ? qlo + (((qq - qlo) % TAU) + TAU) % TAU : qq;

  // Contour of energy E as polylines of [q, p] (in the window); keep(segment) filters; branch: +1/-1/0 (both) picks p's sign for open curves.
  function contour(E, only = null) {
    const out = [], N = 360, dq = (qhi - qlo) / N, pv = qq => Math.sqrt(Math.max(0, 2 * (E - M.V(qq))));
    let a = null;   // current segment start: { q, edge }
    const segs = [];
    const turn = (qa, qb) => { let lo = qa, hi = qb; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; (E - M.V(m) >= 0 === E - M.V(qa) >= 0) ? lo = m : hi = m; } return (lo + hi) / 2; };
    let inside = E - M.V(qlo) >= 0; if (inside) a = { q: qlo, edge: true };
    for (let i = 1; i <= N; i++) {
      const q0 = qlo + (i - 1) * dq, q1 = qlo + i * dq, in1 = E - M.V(q1) >= 0;
      if (inside && !in1) { segs.push({ a: a.q, ae: a.edge, b: turn(q0, q1), be: false }); inside = false; }
      else if (!inside && in1) { a = { q: turn(q0, q1), edge: false }; inside = true; }
    }
    if (inside) segs.push({ a: a.q, ae: a.edge, b: qhi, be: true });
    for (const g of segs) {
      if (only != null && !(only.q >= g.a - 1e-9 && only.q <= g.b + 1e-9)) continue;
      const qs = [];
      if (!g.ae && !g.be) for (let i = 0; i <= 120; i++) qs.push((g.a + g.b) / 2 - (g.b - g.a) / 2 * Math.cos(Math.PI * i / 120));
      else for (let i = 0; i <= 200; i++) qs.push(g.a + (g.b - g.a) * i / 200);
      const open = g.ae || g.be;
      const up = qs.map(qq => [qq, pv(qq)]), dn = qs.map(qq => [qq, -pv(qq)]);
      if (!open) out.push([...up, ...dn.reverse()]);
      else { if (only == null || only.p >= 0) out.push(up); if (only == null || only.p <= 0) out.push(dn); }
    }
    return out;
  }
  const pathOf = pls => pls.map(pl => pl.map(([qq, pp], i) => `${i ? 'L' : 'M'}${px(qq).toFixed(1)} ${py(pp).toFixed(1)}`).join(' ')).join(' ');

  // Orbit through the start: contour (undamped) or the integrated spiral (damped).
  function orbitPath() {
    const key = `${st.q},${st.p},${st.gamma}`;
    if (orbitCache?.key === key) return orbitCache.d;
    let d;
    if (st.gamma <= 0) {
      const E = energy(st.q, st.p);
      d = pathOf(contour(E, { q: Math.max(qlo, Math.min(qhi, st.q)), p: st.p }));
      // a start on the unstable top at rest sits on the separatrix curves: draw both branches
      if (pend && Math.abs(E - 2) < 1e-9) d = pathOf(contour(2));
    } else {
      let a = st.q, b = st.p; const pts = [[a, b]];
      for (let i = 0; i < 6000; i++) { [a, b] = phaseStep(M, st.gamma, a, b, 0.01); pts.push([a, b]); if (Math.abs(a) > 3 * Math.max(qhi, -qlo) || energy(a, b) < 1e-4) break; }
      const segsP = []; let cur = [];
      for (const [qq, pp] of pts) { const w = wrapQ(qq); if (cur.length && Math.abs(w - cur[cur.length - 1][0]) > TAU / 2) { segsP.push(cur); cur = []; } cur.push([w, pp]); }
      segsP.push(cur); d = pathOf(segsP);
    }
    orbitCache = { key, d }; return d;
  }

  const arrowTip = (g, x, y, dx, dy, col, len = 14) => {
    const L = Math.hypot(dx, dy); if (L < 1e-6) return; const ux = dx / L, uy = dy / L;
    g.append(s('polygon', { fill: col, points: `${x + ux * len},${y + uy * len} ${x - uy * 5},${y + ux * 5} ${x + uy * 5},${y - ux * 5}`, opacity: 0.9 }));
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function paintPlane() {
    svg.replaceChildren();
    svg.append(s('defs', {}, s('clipPath', { id: clipId }, s('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0 }))));
    const x0 = clamp(px(0), X0, X1), y0 = clamp(py(0), Y0, Y1);
    if (show.axes) svg.append(s('line', { x1: X0, y1: y0, x2: X1, y2: y0, stroke: 'var(--muted)', 'stroke-width': 1.3 }), s('line', { x1: x0, y1: Y0, x2: x0, y2: Y1, stroke: 'var(--muted)', 'stroke-width': 1.3 }));
    if (show.axisLabels) svg.append(s('text', { x: X1 - 2, y: y0 - 6, 'font-size': 14, 'font-weight': 650, 'font-style': 'italic', fill: 'var(--ink)', 'text-anchor': 'end' }, Lb.q),
      s('text', { x: x0 + 7, y: Y0 + 12, 'font-size': 14, 'font-weight': 650, 'font-style': 'italic', fill: 'var(--ink)' }, Lb.p));
    if (show.ticks) {
      const stepQ = pend ? Math.PI : 1;
      for (let k = Math.ceil(qlo / stepQ); k * stepQ <= qhi; k++) if (k) svg.append(s('line', { x1: px(k * stepQ), y1: y0 - 3, x2: px(k * stepQ), y2: y0 + 3, stroke: 'var(--muted)' }),
        s('text', { x: px(k * stepQ), y: y0 + 16, 'font-size': 10.5, fill: 'var(--muted)', 'text-anchor': 'middle' }, pend ? `${k === 1 ? '' : k === -1 ? '−' : k}π` : String(k)));
      for (let k = Math.ceil(plo); k <= phi; k++) if (k) svg.append(s('line', { x1: x0 - 3, y1: py(k), x2: x0 + 3, y2: py(k), stroke: 'var(--muted)' }),
        s('text', { x: x0 - 6, y: py(k) + 3.5, 'font-size': 10.5, fill: 'var(--muted)', 'text-anchor': 'end' }, String(k)));
    }
    const g = s('g', { 'clip-path': `url(#${clipId})` });
    if (show.contours) for (const E of levels) g.append(s('path', { d: pathOf(contour(E)), fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-opacity': 0.38 }));
    if (show.separatrix && pend) g.append(s('path', { d: pathOf(contour(2)), fill: 'none', stroke: 'var(--basis)', 'stroke-width': 2, 'stroke-dasharray': '6 4' }));
    if (show.orbit) g.append(s('path', { d: orbitPath(), fill: 'none', stroke: 'var(--covec)', 'stroke-width': 2.2, 'stroke-opacity': 0.85, 'stroke-linejoin': 'round' }));
    if (show.trail && trail.length > 1) {
      const nSeg = show.fade ? 20 : 1, per = Math.max(1, Math.ceil(trail.length / nSeg));
      for (let a = 0; a < trail.length - 1; a += per) {
        let d = '', prev = null;
        for (const pt of trail.slice(a, Math.min(trail.length, a + per + 1))) { d += `${prev === null || Math.abs(pt[0] - prev) > TAU / 2 ? 'M' : 'L'}${px(pt[0]).toFixed(1)} ${py(pt[1]).toFixed(1)} `; prev = pt[0]; }
        g.append(s('path', { d, fill: 'none', stroke: 'var(--vec)', 'stroke-width': 3, 'stroke-opacity': show.fade ? (0.15 + 0.85 * (a + per) / trail.length).toFixed(2) : 1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      }
    }
    if (show.fixedPoints) {
      const marks = pend ? [] : [[0, system === 'spring']];
      if (pend) for (let k = Math.ceil((qlo - Math.PI) / TAU); k * TAU + Math.PI <= qhi + 1e-9; k++) { if (k * TAU >= qlo) marks.push([k * TAU, true]); if (k * TAU + Math.PI >= qlo && k * TAU + Math.PI <= qhi) marks.push([k * TAU + Math.PI, false]); }
      if (pend && qlo <= 0 && !marks.some(m => m[0] === 0)) marks.push([0, true]);
      for (const [mq, stable] of marks) g.append(s('circle', { cx: px(mq), cy: py(0), r: 4, fill: stable ? 'var(--ink)' : 'var(--bg, #fff)', stroke: 'var(--ink)', 'stroke-width': 1.5 }));
    }
    if (show.start && interactive) g.append(s('circle', { cx: px(wrapQ(st.q)), cy: py(st.p), r: 6.5, fill: 'none', stroke: 'var(--vec)', 'stroke-width': 1.5, 'stroke-dasharray': '3 2' }));
    if (show.point) {
      const wq = wrapQ(q);
      if (show.direction) { const a = -M.dV(q) - st.gamma * p; arrowTip(g, px(wq), py(p), p / (qhi - qlo) * (X1 - X0), -a / (phi - plo) * (Y1 - Y0), 'var(--vec)', 14); }
      g.append(s('circle', { cx: px(wq), cy: py(p), r: 5.2, fill: 'var(--vec)', stroke: 'var(--bg, #fff)', 'stroke-width': 1.6 }));
    }
    svg.append(g, s('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0, fill: 'none', stroke: 'var(--muted)', 'stroke-opacity': 0.35 }));
  }

  function paintSide() {
    if (!side) return;
    side.replaceChildren();
    const ink = 'var(--ink)', mut = 'var(--muted)', col = 'var(--vec)', cx = SW / 2;
    if (pend) {
      const L = 84, ox = cx, oy = 14, bx = ox + L * Math.sin(q), by = oy + L * Math.cos(q);
      side.append(s('path', { d: `M${ox - L * 0.8} ${oy + L * Math.cos(0.64)} A${L} ${L} 0 0 0 ${ox + L * 0.8} ${oy + L * Math.cos(0.64)}`, fill: 'none', stroke: mut, 'stroke-opacity': 0.3, 'stroke-dasharray': '3 4' }),
        s('line', { x1: ox - 24, y1: oy - 2, x2: ox + 24, y2: oy - 2, stroke: ink, 'stroke-width': 3 }),
        s('line', { x1: ox, y1: oy, x2: bx, y2: by, stroke: ink, 'stroke-width': 2 }), s('circle', { cx: ox, cy: oy, r: 3, fill: ink }),
        s('circle', { cx: bx, cy: by, r: 10, fill: col, stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
    } else if (system === 'spring') {
      const sc = 60, floor = 82, bx = cx + sc * q, wall = 16, n = 9, pts = [`${wall},${floor - 20}`], x1 = bx - 13;
      for (let i = 0; i <= n; i++) pts.push(`${(wall + 12 + (x1 - wall - 12) * i / n).toFixed(1)},${floor - 20 + (i === 0 || i === n ? 0 : i % 2 ? -9 : 9)}`);
      pts.push(`${x1},${floor - 20}`);
      side.append(s('line', { x1: 8, y1: floor, x2: SW - 8, y2: floor, stroke: mut, 'stroke-width': 1.5 }), s('line', { x1: wall, y1: floor - 40, x2: wall, y2: floor, stroke: ink, 'stroke-width': 4 }),
        s('line', { x1: cx, y1: floor - 44, x2: cx, y2: floor + 6, stroke: mut, 'stroke-dasharray': '3 3', 'stroke-opacity': 0.6 }),
        s('polyline', { points: pts.join(' '), fill: 'none', stroke: ink, 'stroke-width': 2, 'stroke-linejoin': 'round' }),
        s('rect', { x: bx - 13, y: floor - 33, width: 26, height: 26, rx: 3, fill: col, stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
    } else {
      const sc = 60, top = 36;
      const yAt = qq => top + 9 * qq * qq;
      side.append(s('polyline', { points: Array.from({ length: 61 }, (_, i) => { const qq = -2.8 + 5.6 * i / 60; return `${(cx + sc * qq).toFixed(1)},${Math.min(SH - 6, yAt(qq)).toFixed(1)}`; }).join(' '), fill: 'none', stroke: ink, 'stroke-width': 2 }));
      const qq = clamp(q, -2.8, 2.8);
      side.append(s('circle', { cx: cx + sc * qq, cy: yAt(qq) - 10, r: 10, fill: col, stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
    }
  }

  const rd = {}, inps = {}, vals = {};
  const readValue = key => {
    const E = energy(q, p);
    switch (key) {
      case 'E': return num(E, 2);
      case 'period': { if (st.gamma > 0) return '–'; const T = M.period(energy(st.q, st.p)); return T == null ? '–' : Number.isFinite(T) ? num(T, 2) : '∞'; }
      case 'q': return num(q, 2);
      case 'p': return num(p, 2);
      case 'gamma': return num(st.gamma, 2);
      case 'time': return num(t, 1);
      default: return '';
    }
  };
  const names = { E: Lb.E, period: Lb.period, q: Lb.q, p: Lb.p, gamma: Lb.gamma, time: Lb.time };
  function paintReads() {
    for (const key of reads) if (rd[key]) rd[key].textContent = readValue(key);
    for (const [key, inp] of Object.entries(inps)) { inp.value = st[key]; vals[key].textContent = num(st[key], 2); }
  }
  const paint = () => { paintPlane(); paintSide(); paintReads(); };

  const stopLoop = () => { cancelAnimationFrame(raf); raf = 0; };
  function loop() {
    stopLoop(); last = performance.now();
    const tick = now => {
      if (!el.isConnected) return;
      if (playing && !dragging) {
        let left = Math.min(0.1, (now - last) / 1000) * rate;
        while (left > 1e-9) {
          const dt = Math.min(0.01, left); [q, p] = phaseStep(M, st.gamma, q, p, dt); left -= dt; t += dt;
          if (Math.abs(q) > 6 * Math.max(qhi, -qlo, 1) && !pend) { playing = false; break; }
        }
        if (pend && !wrap && (q < qlo - 1 || q > qhi + 1)) playing = false;
        trail.push([wrapQ(q), p]); if (trail.length > 700) trail.shift();
        syncPause();
      }
      last = now; paint(); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function restart(play = true) { q = st.q; p = st.p; t = 0; trail = [[wrapQ(q), p]]; playing = play; syncPause(); paint(); }

  function setStart(ev) {
    const r = svg.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H;
    st.q = clamp(qlo + (x - X0) / (X1 - X0) * (qhi - qlo), qlo, qhi); st.p = clamp(plo + (Y1 - y) / (Y1 - Y0) * (phi - plo), plo, phi);
    q = st.q; p = st.p; t = 0; trail = [[wrapQ(q), p]]; paint();
  }
  if (interactive) {
    svg.addEventListener('pointerdown', e => { e.preventDefault(); try { svg.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ } dragging = true; setStart(e); });
    svg.addEventListener('pointermove', e => { if (dragging) setStart(e); });
    const end = () => { if (dragging) { dragging = false; playing = true; syncPause(); } };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  }

  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  let pauseBtn;
  function syncPause() { if (pauseBtn) pauseBtn.textContent = playing ? Lb.pause : Lb.play; }
  const apply = pr => { for (const k of ['q', 'p', 'gamma']) if (pr[k] != null) st[k] = pr[k]; restart(true); };
  const btns = h('div', { class: 'wbtns' }, btn(Lb.restart, () => restart(true)), pauseBtn = btn(Lb.pause, () => { playing = !playing; syncPause(); }),
    (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
  const readEl = h('div', { class: 'fs-reads' }, reads.map(key => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[key] ?? key)), rd[key] = h('div', { class: 'fs-num', role: 'status' }))));
  const sliderEls = sliderKeys.filter(k => Rg[k]).map(key => {
    const [lo, hi, step] = Rg[key];
    const inp = inps[key] = h('input', { type: 'range', min: lo, max: hi, step, value: st[key], 'aria-label': Lb[key] });
    inp.addEventListener('input', () => { st[key] = +inp.value; restart(true); });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb[key])), inp, vals[key] = h('span', { class: 'fs-num' }));
  });
  el.append(h('div', { class: 'fs-fig' }, svg), side ? h('div', { class: 'fs-fig' }, side) : '', show.readouts && reads.length ? readEl : '',
    show.sliders && sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', show.buttons ? btns : '');
  restart(playing);
  loop();
}
