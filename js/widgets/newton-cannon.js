// newton-cannon
//
// Side view of a planet (radius R = 1, drawn large) with a tower of height h and a ball fired from its top with
// speed v0, horizontally or at an angle.  Gravity is the only force: r'' = -GM r / r^3, integrated by RK4 in
// units where GM = 1 and R = 1, so the circular speed at the surface is vc = 1, g = GM/R^2 = 1 and the time unit
// is sqrt(R^3/GM).  The outcome is classified from the simulated path:
//   falls  - the ball reaches r = R (landing marker, range = arc length along the surface, in R);
//   orbit  - bound and it completes one period without touching the ground (closed ellipse, period T);
//   escape - total energy v0^2/2 - 1/(1+h) >= 0 (for h = 0 this is v0 >= sqrt2 vc).
// Fully general: all words come from the config.
//
//   v0: 0.6, angle: 0, h: 0.08           start values (v0 in units of vc, angle in degrees above horizontal, h in units of R)
//   second: false, v0b: 1.0              a second ball (colour 2) from the same start with speed v0b and the same angle
//   sliders: ['v0']                      which sliders to show, in order: v0, v0b, angle, h (default ['v0'])
//   ranges: { v0: [0,1.5,0.01], v0b: [0,1.5,0.01], angle: [0,60,1], h: [0,0.3,0.01] }   [min, max, step]
//   view: auto                           half-width of the drawing in units of R; auto = fits the paths, between viewMin and viewMax
//   viewMin: 1.45, viewMax: 6            limits of the automatic view
//   duration: auto                       seconds of one run; auto grows with the flight time (2.5 s to 14 s)
//   moonDistance: 60                     distance of the Moon marker in R (used when show.moon)
//   units: { speed: 'v_c', length: 'R' } plain text appended to numbers
//   show: { trail, fade, arrows, parabola, moon, landing, tower, labels, readouts, sliders, fire, second }
//       defaults true except parabola, moon (false); second = draw ball 2 only when true here AND config second true
//       (so a preset can switch it on); trail = the path behind each ball; fade = older trail dimmer (off: uniform);
//       arrows = velocity arrow (ball colour) and gravity arrow (orange) on each ball; parabola = dashed flat-earth
//       path (uniform g = 1, flat ground at the surface level); moon = strip under the figure with the Moon at
//       moonDistance R; landing = marker and arc at the landing point; tower = the tower; labels = letters R, h and
//       the arrow letters; readouts = the readout cells; sliders = the slider block; fire = the Fire button.
//   readouts: ['v0','speed','outcome','range','period']   any of v0, speed (live v/vc), outcome, range, flatRange,
//       period, moonAcc, moonLaw.  Outcome, range and period appear when the ball has finished its run.
//   presets: [{ label, v0, v0b, angle, h, second, parabola }]   buttons; set the given fields, then fire
//   labels: { v0, v0b, angle, h, speed, outcome, range, flatRange, period, moonAcc, moonLaw, fire, reset, falls, orbit, escape,
//             radius, tower, velocity, gravity, moon, planet, ball1, ball2, figure }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => String(Number((+v).toFixed(d)));
const sig = (v, n = 3) => { const a = Number(v).toPrecision(n); return a.includes('e') ? Number(a).toExponential(n - 1).replace('e-', '×10^-') : String(Number(a)); };

// Pure model, exported for script checks.  Units GM = R = 1.  Launch point (0, 1 + h), velocity v0 (cos a, sin a).
export function cannonShot({ v0, angle = 0, h = 0, rStop = 9, maxSteps = 60000 }) {
  const r0 = 1 + h, a = angle * Math.PI / 180;
  let x = 0, y = r0, vx = v0 * Math.cos(a), vy = v0 * Math.sin(a), t = 0;
  const E = 0.5 * v0 * v0 - 1 / r0;
  const bound = E < 0, sma = bound ? -1 / (2 * E) : Infinity, T = bound ? 2 * Math.PI * Math.pow(sma, 1.5) : Infinity;
  const f = (px, py) => { const r3 = Math.pow(px * px + py * py, 1.5); return [-px / r3, -py / r3]; };
  const pts = [{ t, x, y, vx, vy }];
  let outcome = bound ? 'orbit' : 'escape', range = null, land = null;
  for (let i = 0; i < maxSteps; i++) {
    const r = Math.hypot(x, y), dt = Math.min(0.01 * Math.pow(r, 1.5), 0.05 * Math.max(1, T / 1000) );
    const [a1x, a1y] = f(x, y);
    const [a2x, a2y] = f(x + 0.5 * dt * vx, y + 0.5 * dt * vy);
    const k2x = vx + 0.5 * dt * a1x, k2y = vy + 0.5 * dt * a1y;
    const [a3x, a3y] = f(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y);
    const k3x = vx + 0.5 * dt * a2x, k3y = vy + 0.5 * dt * a2y;
    const [a4x, a4y] = f(x + dt * k3x, y + dt * k3y);
    const k4x = vx + dt * a3x, k4y = vy + dt * a3y;
    const nx = x + dt / 6 * (vx + 2 * k2x + 2 * k3x + k4x), ny = y + dt / 6 * (vy + 2 * k2y + 2 * k3y + k4y);
    const nvx = vx + dt / 6 * (a1x + 2 * a2x + 2 * a3x + a4x), nvy = vy + dt / 6 * (a1y + 2 * a2y + 2 * a3y + a4y);
    const nr = Math.hypot(nx, ny);
    if (nr < 1 - 1e-7) {   // landed: interpolate to r = 1
      const w = (r - 1) / (r - nr || 1), lx = x + w * (nx - x), ly = y + w * (ny - y);
      const ln = Math.hypot(lx, ly), px = lx / ln, py = ly / ln;
      pts.push({ t: t + w * dt, x: px, y: py, vx: vx + w * (nvx - vx), vy: vy + w * (nvy - vy) });
      outcome = 'falls'; land = [px, py];
      range = Math.atan2(px, py);   // angle swept from the launch axis (0, 1)
      range = Math.abs(range);
      break;
    }
    x = nx; y = ny; vx = nvx; vy = nvy; t += dt;
    pts.push({ t, x, y, vx, vy });
    if (bound && t >= T) break;
    if (!bound && nr > rStop) break;
  }
  return { pts, outcome, range, land, T: outcome === 'orbit' ? T : null, bound, sma, E, tEnd: pts[pts.length - 1].t };
}

// Flat-earth comparison: uniform g = 1, flat ground at the surface level (height h below the launch point).
export function flatShot({ v0, angle = 0, h = 0 }) {
  const a = angle * Math.PI / 180, vx = v0 * Math.cos(a), vy = v0 * Math.sin(a);
  const tl = (vy + Math.sqrt(vy * vy + 2 * h)) / 1;
  return { tl, range: vx * tl, at: t => [vx * t, 1 + h + vy * t - 0.5 * t * t] };
}

// Moon check: RK4 circular orbit at r = d (GM = 1); acceleration from the simulated period, a = 4 pi^2 d / T^2.
export function moonCheck(d = 60) {
  let x = d, y = 0, vx = 0, vy = 1 / Math.sqrt(d), t = 0;
  const f = (px, py) => { const r3 = Math.pow(px * px + py * py, 1.5); return [-px / r3, -py / r3]; };
  const dt = 0.5 * Math.sqrt(d) / 8;
  for (let i = 0; i < 200000; i++) {
    const [a1x, a1y] = f(x, y), [a2x, a2y] = f(x + 0.5 * dt * vx, y + 0.5 * dt * vy);
    const k2x = vx + 0.5 * dt * a1x, k2y = vy + 0.5 * dt * a1y, [a3x, a3y] = f(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y);
    const k3x = vx + 0.5 * dt * a2x, k3y = vy + 0.5 * dt * a2y, [a4x, a4y] = f(x + dt * k3x, y + dt * k3y);
    const k4x = vx + dt * a3x, k4y = vy + dt * a3y;
    const nx = x + dt / 6 * (vx + 2 * k2x + 2 * k3x + k4x), ny = y + dt / 6 * (vy + 2 * k2y + 2 * k3y + k4y);
    const nvx = vx + dt / 6 * (a1x + 2 * a2x + 2 * a3x + a4x), nvy = vy + dt / 6 * (a1y + 2 * a2y + 2 * a3y + a4y);
    if (y < 0 && ny >= 0 && t > dt) { const w = -y / (ny - y); const T = t + w * dt; return { T, a: 4 * Math.PI * Math.PI * d / (T * T), law: 1 / (d * d) }; }
    x = nx; y = ny; vx = nvx; vy = nvy; t += dt;
  }
  return { T: NaN, a: NaN, law: 1 / (d * d) };
}

export function newtonCannon(el, cfg = {}) {
  const Lb = { v0: 'Launch speed', v0b: 'Launch speed of ball 2', angle: 'Launch angle', h: 'Tower height', speed: 'Speed now', outcome: 'Outcome',
    range: 'Landing distance', flatRange: 'Flat-earth distance', period: 'Period', moonAcc: 'Moon acceleration', moonLaw: 'Inverse-square value',
    fire: 'Fire', reset: 'Reset', falls: 'falls', orbit: 'orbit', escape: 'escape', radius: 'R', tower: 'h', velocity: 'v', gravity: 'g',
    moon: 'Moon', planet: '', ball1: 'ball 1', ball2: 'ball 2', figure: 'A ball fired from a tower on a planet', ...(cfg.labels ?? {}) };
  const show = { trail: true, fade: true, arrows: true, parabola: false, moon: false, landing: true, tower: true, labels: true, readouts: true, sliders: true, fire: true, second: true, ...(cfg.show ?? {}) };
  const U = { speed: 'v_c', length: 'R', ...(cfg.units ?? {}) };
  const reads = cfg.readouts ?? ['v0', 'speed', 'outcome', 'range', 'period'];
  const sliderKeys = cfg.sliders ?? ['v0'];
  const Rg = { v0: [0, 1.5, 0.01], v0b: [0, 1.5, 0.01], angle: [0, 60, 1], h: [0, 0.3, 0.01], ...(cfg.ranges ?? {}) };
  const init = { v0: cfg.v0 ?? 0.6, v0b: cfg.v0b ?? 1.0, angle: cfg.angle ?? 0, h: cfg.h ?? 0.08, second: !!cfg.second, parabola: !!show.parabola };
  const st = { ...init };
  const viewMin = cfg.viewMin ?? 1.45, viewMax = cfg.viewMax ?? 6, moonD = cfg.moonDistance ?? 60;
  const W = 360, H = 300, CX = W / 2, CY = H / 2;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.figure });
  const clipId = 'nc-clip-' + Math.random().toString(36).slice(2, 8);
  const moonSvg = show.moon ? s('svg', { viewBox: `0 0 ${W} 58`, class: 'fs-svg', role: 'img', 'aria-label': Lb.moon }) : null;
  const moon = show.moon ? moonCheck(moonD) : null;

  let shots = [], flat = null, S = 2, cT = 0, running = false, fired = false, raf = 0, last = 0, total = 1, rate = 1;

  function compute() {
    const rStop = Math.max(8, viewMax * 1.5);
    shots = [{ q: cannonShot({ v0: st.v0, angle: st.angle, h: st.h, rStop }), col: 'var(--vec)', name: Lb.ball1 }];
    if (st.second && show.second) shots.push({ q: cannonShot({ v0: st.v0b, angle: st.angle, h: st.h, rStop }), col: 'var(--covec)', name: Lb.ball2 });
    flat = show.parabola && st.parabola ? flatShot({ v0: st.v0, angle: st.angle, h: st.h }) : null;
    total = Math.max(...shots.map(o => o.q.tEnd));
    let ext = 0;
    for (const o of shots) for (const p of o.q.pts) ext = Math.max(ext, Math.abs(p.x), Math.abs(p.y) * W / H);
    if (flat) ext = Math.max(ext, Math.min(viewMax, flat.range + 0.1));
    S = cfg.view ?? Math.min(viewMax, Math.max(viewMin, 1.4 * (1 + st.h), ext * 1.12));
    const dur = cfg.duration ?? Math.min(14, Math.max(2.5, total * 1.5));
    rate = total / dur;
  }
  const k = () => (W / 2) / S;
  const px = x => CX + k() * x, py = y => CY - k() * y;
  const at = (pts, t) => {
    if (t >= pts[pts.length - 1].t) return { ...pts[pts.length - 1], i: pts.length - 1 };
    let lo = 0, hi = pts.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; (pts[m].t <= t ? lo = m : hi = m); }
    const a = pts[lo], b = pts[hi], w = (t - a.t) / (b.t - a.t || 1);
    return { t, x: a.x + w * (b.x - a.x), y: a.y + w * (b.y - a.y), vx: a.vx + w * (b.vx - a.vx), vy: a.vy + w * (b.vy - a.vy), i: lo };
  };
  const arrowPx = (g, x1, y1, dx, dy, col) => {
    const L = Math.hypot(dx, dy); if (L < 2) return;
    const ux = dx / L, uy = dy / L, x2 = x1 + dx, y2 = y1 + dy;
    g.append(s('line', { x1, y1, x2: x2 - ux * 5, y2: y2 - uy * 5, stroke: col, 'stroke-width': 2.2, 'stroke-linecap': 'round' }),
      s('polygon', { fill: col, points: `${x2},${y2} ${x2 - ux * 8 - uy * 4},${y2 - uy * 8 + ux * 4} ${x2 - ux * 8 + uy * 4},${y2 - uy * 8 - ux * 4}` }));
  };
  const done = o => cT >= o.q.tEnd - 1e-9 && fired;

  function paint() {
    svg.replaceChildren();
    const defs = s('defs'); defs.append(s('clipPath', { id: clipId }, s('rect', { x: 0, y: 0, width: W, height: H })));
    svg.append(defs);
    const kk = k();
    // planet, tower
    svg.append(s('circle', { cx: CX, cy: CY, r: kk, fill: 'var(--muted)', 'fill-opacity': 0.16, stroke: 'var(--muted)', 'stroke-width': 1.5 }));
    if (show.tower && st.h > 0.004) svg.append(s('line', { x1: px(0), y1: py(1) + 1, x2: px(0), y2: py(1 + st.h), stroke: 'var(--ink)', 'stroke-width': 4 }));
    if (show.labels) {
      svg.append(s('line', { x1: CX, y1: CY, x2: px(-Math.SQRT1_2), y2: py(-Math.SQRT1_2), stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }),
        s('circle', { cx: CX, cy: CY, r: 2.5, fill: 'var(--muted)' }),
        s('text', { x: px(-0.5) - 8, y: py(-0.5) - 4, 'font-size': 12, 'font-weight': 650, fill: 'var(--muted)', 'text-anchor': 'end' }, Lb.radius));
      if (show.tower && st.h > 0.03) svg.append(s('text', { x: px(0) + 6, y: py(1 + st.h / 2) + 4, 'font-size': 11, 'font-weight': 650, fill: 'var(--ink)' }, Lb.tower));
      if (Lb.planet) svg.append(s('text', { x: CX, y: CY + 4, 'font-size': 12, 'text-anchor': 'middle', fill: 'var(--muted)' }, Lb.planet));
    }
    const g = s('g', { 'clip-path': `url(#${clipId})` });
    // flat-earth parabola
    if (flat) {
      const pts = [], n = 60;
      for (let i = 0; i <= n; i++) { const [x, y] = flat.at(flat.tl * i / n); pts.push(`${i ? 'L' : 'M'}${px(x).toFixed(1)} ${py(y).toFixed(1)}`); }
      g.append(s('path', { d: pts.join(' '), fill: 'none', stroke: 'var(--basis)', 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
    }
    for (const o of shots) {
      const pts = o.q.pts, cur = at(pts, Math.min(cT, o.q.tEnd)), col = o.col;
      if (show.trail && fired) {
        const stride = Math.max(1, Math.floor(cur.i / 500)), list = [];
        for (let i = 0; i <= cur.i; i += stride) list.push(pts[i]);
        list.push(cur);
        const nSeg = show.fade ? 24 : 1, per = Math.max(1, Math.ceil((list.length - 1) / nSeg));
        for (let a = 0; a < list.length - 1; a += per) {
          const seg = list.slice(a, Math.min(list.length, a + per + 1));
          const op = show.fade ? 0.18 + 0.82 * (a + per) / (list.length - 1) : 1;
          g.append(s('polyline', { points: seg.map(p => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' '), fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-opacity': Math.min(1, op).toFixed(2), 'stroke-linejoin': 'round' }));
        }
      }
      if (show.landing && o.q.land && done(o)) {
        const [lx, ly] = o.q.land;
        g.append(s('line', { x1: px(lx) - 5, y1: py(ly) - 5, x2: px(lx) + 5, y2: py(ly) + 5, stroke: col, 'stroke-width': 3 }), s('line', { x1: px(lx) - 5, y1: py(ly) + 5, x2: px(lx) + 5, y2: py(ly) - 5, stroke: col, 'stroke-width': 3 }));
        const a0 = Math.PI / 2, a1 = Math.atan2(ly, lx), n = 24, d = [];
        for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; d.push(`${i ? 'L' : 'M'}${px(1.06 * Math.cos(a)).toFixed(1)} ${py(1.06 * Math.sin(a)).toFixed(1)}`); }
        g.append(s('path', { d: d.join(' '), fill: 'none', stroke: col, 'stroke-width': 1.5, 'stroke-dasharray': '2 3' }));
      }
      if (show.arrows && !(done(o) && o.q.land)) {
        const bx = px(cur.x), by = py(cur.y), v = Math.hypot(cur.vx, cur.vy), r = Math.hypot(cur.x, cur.y);
        const vl = 34 * Math.min(1.6, v);
        if (v > 0.02) arrowPx(g, bx, by, vl * cur.vx / v, -vl * cur.vy / v, col);
        const gl = Math.max(10, 28 / (r * r));
        arrowPx(g, bx, by, -gl * cur.x / r, gl * cur.y / r, 'var(--ink)');
        if (show.labels && v > 0.02 && o === shots[0]) {
          g.append(s('text', { x: bx + vl * cur.vx / v + 6, y: by - vl * cur.vy / v - 5, 'font-size': 11, 'font-weight': 650, fill: col }, Lb.velocity));
          g.append(s('text', { x: bx - gl * cur.x / r + 7, y: by + gl * cur.y / r + 3, 'font-size': 11, 'font-weight': 650, fill: 'var(--ink)' }, Lb.gravity));
        }
      }
      g.append(s('circle', { cx: px(cur.x), cy: py(cur.y), r: 4.6, fill: col, stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
    }
    svg.append(g);
    if (moonSvg) paintMoon();
    paintReads();
  }
  function paintMoon() {
    moonSvg.replaceChildren();
    const x0 = 22, x1 = W - 22, rpx = (x1 - x0) / moonD, cy = 26;
    moonSvg.append(s('line', { x1: x0, y1: cy, x2: x1, y2: cy, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }),
      s('circle', { cx: x0, cy, r: Math.max(rpx, 3), fill: 'var(--muted)', 'fill-opacity': 0.3, stroke: 'var(--muted)' }),
      s('circle', { cx: x1, cy, r: 5, fill: 'var(--basis)' }));
    arrowPx(moonSvg, x1 - 8, cy, -30, 0, 'var(--ink)');
    if (show.labels) moonSvg.append(s('text', { x: x0, y: cy + 22, 'font-size': 10.5, 'text-anchor': 'middle', fill: 'var(--muted)' }, Lb.radius),
      s('text', { x: x1, y: cy - 12, 'font-size': 10.5, 'text-anchor': 'end', fill: 'var(--basis)', 'font-weight': 650 }, `${Lb.moon} · ${moonD} ${U.length}`),
      s('text', { x: x1 - 40, y: cy + 4, 'font-size': 11, 'font-weight': 650, 'text-anchor': 'end', fill: 'var(--ink)' }, Lb.gravity));
  }
  const rd = {}, inps = {}, vals = {};
  const lenFmt = v => `${num(v, 2)} ${U.length}`;
  function readValue(key, o, idx) {
    const q = o.q, fin = done(o), cur = at(q.pts, Math.min(cT, q.tEnd));
    switch (key) {
      case 'v0': return `${num(idx ? st.v0b : st.v0, 2)} ${U.speed}`;
      case 'speed': return fired ? `${num(Math.hypot(cur.vx, cur.vy), 2)} ${U.speed}` : '–';
      case 'outcome': return fin ? Lb[q.outcome] : '–';
      case 'range': return fin && q.range != null ? lenFmt(q.range) : '–';
      case 'flatRange': return flatShot({ v0: idx ? st.v0b : st.v0, angle: st.angle, h: st.h }).range.toFixed(2) + ` ${U.length}`;
      case 'period': return fin && q.T != null ? num(q.T, 2) : '–';
      default: return '';
    }
  }
  function paintReads() {
    for (const key of reads) {
      const cell = rd[key]; if (!cell) continue;
      if (key === 'moonAcc') { cell.textContent = `${sig(moon.a)} g`; continue; }
      if (key === 'moonLaw') { cell.textContent = `${sig(moon.law)} g`; continue; }
      cell.replaceChildren(...shots.flatMap((o, i) => [i ? h('span', { class: 'fs-sep' }, ' | ') : '', h('span', { style: shots.length > 1 ? `color:${o.col}` : '' }, readValue(key, o, i))]));
    }
    for (const [key, inp] of Object.entries(inps)) { inp.value = st[key]; vals[key].textContent = key === 'angle' ? `${num(st[key], 0)}°` : key === 'h' ? `${num(st[key], 2)} ${U.length}` : `${num(st[key], 2)} ${U.speed}`; }
  }
  const stop = () => { cancelAnimationFrame(raf); running = false; };
  function idle() { stop(); fired = false; cT = 0; compute(); paint(); }
  function fire() {
    stop(); compute(); fired = true; cT = 0; running = true; last = performance.now(); paint();
    const tick = now => {
      if (!el.isConnected) return;
      cT = Math.min(total, cT + rate * (now - last) / 1000); last = now; paint();
      if (cT < total) raf = requestAnimationFrame(tick); else running = false;
    };
    raf = requestAnimationFrame(tick);
  }
  const names = { v0: Lb.v0, speed: Lb.speed, outcome: Lb.outcome, range: Lb.range, flatRange: Lb.flatRange, period: Lb.period, moonAcc: Lb.moonAcc, moonLaw: Lb.moonLaw };
  const readEl = h('div', { class: 'fs-reads' }, reads.map(key => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[key] ?? key)), rd[key] = h('div', { class: 'fs-num', role: 'status' }))));
  const sliderEls = sliderKeys.map(key => {
    const [lo, hi, step] = Rg[key];
    const inp = inps[key] = h('input', { type: 'range', min: lo, max: hi, step, value: st[key], 'aria-label': Lb[key] });
    inp.addEventListener('input', () => { st[key] = +inp.value; idle(); });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb[key])), inp, vals[key] = h('span', { class: 'fs-num' }));
  });
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const apply = p => { for (const key of ['v0', 'v0b', 'angle', 'h', 'second', 'parabola']) if (p[key] != null) st[key] = p[key]; fire(); };
  const btns = h('div', { class: 'wbtns' }, show.fire ? btn(Lb.fire, () => fire()) : '', btn(Lb.reset, () => { Object.assign(st, init); idle(); }),
    (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), moonSvg ? h('div', { class: 'fs-fig' }, moonSvg) : '', show.readouts && reads.length ? readEl : '',
    show.sliders && sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', btns);
  idle();
}
