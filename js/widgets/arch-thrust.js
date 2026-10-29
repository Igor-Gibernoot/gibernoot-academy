// arch-thrust
//
// A cable, an arch or a dome carrying a load. Side view, plain SVG + HTML, every word and unit from the config (no course text hard-coded).
// Model (statics, all forces in `units.force`):
//   span L, rise h (sag for a cable), uniform load w per metre of horizontal span, optional point loads `points: [{x: 0.3, P: 100}]` (x = fraction of the span).
//   Beam analogy: vertical reactions Va, Vb from moments; M0(x) = Va x - w x^2/2 - sum P (x - xi)+ ; shear V(x) = Va - w x - sum P (xi < x).
//   Horizontal thrust: the funicular (thrust line) passes through height h at midspan, so  H = M0(L/2) / h;  uniform load: H = w L^2 / (8 h).
//   Thrust line y_t(x) = M0(x) / H ;  force along it N(x) = sqrt(H^2 + V(x)^2)  (largest at the supports).
//   cable   the cable takes the shape of the thrust line, hanging below the supports (y = -y_t): tension everywhere. Uniform load: a parabola.
//   arch    the structure is the parabola y = 4 h x (L - x) / L^2 (centre line), standing above the supports: compression everywhere. The thrust line
//           (dashed) coincides with it for a uniform load; with point loads it departs from it. `thickness` t = depth of the stone section (vertical).
//           Middle third: the thrust line must stay within  +- t/6  of the centre line (no joint opens); beyond  +- t/2  it leaves the stone (collapse).
//   dome    thin spherical shell (membrane theory) of radius a under its own weight w per unit surface area, cap of half-angle alpha (90 deg = hemisphere),
//           phi = angle from the crown.  Meridian force  N_phi = -w a / (1 + cos phi)  (compression),  hoop force  N_theta = w a (1/(1 + cos phi) - cos phi)  (tension positive)
//           (compression above phi = 51.8 deg, tension below it), per metre of shell.  Base (edge at alpha) per metre of edge: vertical  w a (1 - cos alpha)/sin alpha,
//           horizontal outward  w a cos alpha / (1 + cos alpha)  (ring tension = that times a).
//
//   mode: 'arch' | 'cable' | 'dome'     modes: ['cable','arch']  buttons (add 'dome' for the dome view)
//   span: 40, rise: 5, load: 10, points: [], thickness: 1 (m)
//   domeRadius: 20, domeLoad: 5, domeAngle: 90 (deg), probe: 40 (deg, the angle read in the dome view)
//   ranges: { span: [20, 80, 1], rise: [2, 15, 0.5], load: [0, 30, 1], angle: [30, 90, 1] }   sliders (rise range also fixes the vertical scale)
//   units: { length:'m', force:'kN', load:'kN/m', area:'kN/m2', line:'kN/m' }
//   forceScale: force that draws as the longest arrow (default: from the initial setting)
//   show: { shape, ground, ghost, loadArrows, forceArrows, forceColors, reactions, thrustLine, stone, band, dimensions, labels, legend, readouts, flag, handles,
//           pointHandles, riseSlider, spanSlider, loadSlider, angleSlider, capSlider, modeToggle, presets, forcePlot, switchLine, hoopRings }
//       defaults true except ghost, stone, band, spanSlider, loadSlider, capSlider, pointHandles (false).
//       shape = the cable / arch / dome curve; ground = deck line and abutments (dome: the base line); ghost = faint mirror of the shape (the other mode);
//       loadArrows = the load; forceArrows = arrow pairs along the shape (tension pulls apart, compression pushes together; length ~ force);
//       forceColors = colour them tension / compression (off: neutral); reactions = abutment reactions (vertical and horizontal); thrustLine = dashed thrust line (arch);
//       stone = outline of the stone section (+- t/2); band = middle-third band (+- t/6), flagged when the thrust line leaves it; dimensions = L and h marks;
//       labels = all text in the drawing; legend = tension / compression key; readouts = numbers row; flag = status message (reserved line);
//       handles = draggable crown (rise) and dome probe; pointHandles = draggable point loads; forcePlot = N_phi and N_theta against phi (dome);
//       switchLine = the angle where the hoop force changes sign (dome); hoopRings = the hoop force marks (dome).
//   readouts: array (or { arch: [...], cable: [...], dome: [...] }) of  thrust, vertical, maxforce, check  (arch, cable)  and  meridian, hoop, base, switch  (dome)
//   presets: [{ label, mode, span, rise, load, points, thickness, domeAngle, probe }]   only the fields given change
//   labels: { cable, arch, dome, thrust, vertical, maxforce, check, meridian, hoop, base, switch, tension, compression, span, rise, load, angle, cap, thicknessWord, inside,
//             edge, outside, hoopTension, hoopCompression, reset, crown, band }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 1) => String(Number((+v).toFixed(d)));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const HOOP_SWITCH = Math.acos((Math.sqrt(5) - 1) / 2);   // cos phi (1 + cos phi) = 1  ->  51.83 deg

// ---------- pure model (exported for script checks) ----------
export function archModel({ span: L, rise: hh, load: w = 0, points = [] }) {
  const pts = points.map(p => ({ x: p.x * L, P: p.P }));
  const total = w * L + pts.reduce((a, p) => a + p.P, 0);
  const Vb = (w * L * L / 2 + pts.reduce((a, p) => a + p.P * p.x, 0)) / L, Va = total - Vb;
  const M0 = x => Va * x - w * x * x / 2 - pts.reduce((a, p) => a + (x > p.x ? p.P * (x - p.x) : 0), 0);
  const V = x => Va - w * x - pts.reduce((a, p) => a + (x > p.x ? p.P : 0), 0);
  const H = hh > 0 ? M0(L / 2) / hh : 0;
  const thrust = x => (H > 0 ? M0(x) / H : 0);
  const N = x => Math.hypot(H, V(x));
  const parab = x => 4 * hh * x * (L - x) / (L * L);
  let dev = 0;
  for (let i = 0; i <= 200; i++) { const x = L * i / 200; dev = Math.max(dev, Math.abs(thrust(x) - parab(x))); }
  return { L, h: hh, total, Va, Vb, H, M0, V, thrust, N, parab, dev, Rmax: Math.max(N(0), N(L)) };
}
export function domeForces(phi, a, w) {   // per metre of shell; tension positive, compression negative
  const c = Math.cos(phi);
  return { meridian: -w * a / (1 + c), hoop: w * a * (1 / (1 + c) - c) };
}
export function domeBase(alpha, a, w) {
  return { vertical: w * a * (1 - Math.cos(alpha)) / Math.sin(alpha), horizontal: w * a * Math.cos(alpha) / (1 + Math.cos(alpha)) };
}

// ---------- widget ----------
export function archThrust(el, cfg) {
  const Lb = { cable: 'Cable', arch: 'Arch', dome: 'Dome', thrust: 'Horizontal thrust', vertical: 'Vertical reaction', maxforce: 'Largest force', check: 'Thrust line offset',
    meridian: 'Meridian force', hoop: 'Hoop force', base: 'At the base (per metre)', switch: 'Hoop changes sign at', tension: 'tension', compression: 'compression',
    span: 'Span', rise: 'Rise', load: 'Load', angle: 'Angle from the crown', cap: 'Dome opening angle', each: 'each', inside: 'The thrust line stays inside the middle third.',
    edge: 'The thrust line left the middle third: joints open on one side.', outside: 'The thrust line left the stone: the arch collapses.', hoopTension: 'tension',
    hoopCompression: 'compression', reset: 'Reset', crown: '', band: 'middle third', ...(cfg.labels ?? {}) };
  const U = { length: 'm', force: 'kN', load: 'kN/m', area: 'kN/m2', line: 'kN/m', ...(cfg.units ?? {}) };
  const modes = cfg.modes ?? ['cable', 'arch'];
  const show = { shape: true, ground: true, ghost: false, loadArrows: true, forceArrows: true, forceColors: true, reactions: true, thrustLine: true, stone: false, band: false,
    dimensions: true, labels: true, legend: true, readouts: true, flag: true, handles: true, pointHandles: false, riseSlider: true, spanSlider: false, loadSlider: false,
    angleSlider: true, capSlider: false, modeToggle: modes.length > 1, presets: true, forcePlot: true, switchLine: true, hoopRings: true, ...(cfg.show ?? {}) };
  const R = { span: [20, 80, 1], rise: [2, 15, 0.5], load: [0, 30, 1], angle: [30, 90, 1], ...(cfg.ranges ?? {}) };
  const init = { mode: cfg.mode ?? modes[0], L: cfg.span ?? 40, h: cfg.rise ?? 5, w: cfg.load ?? 10, points: JSON.parse(JSON.stringify(cfg.points ?? [])), t: cfg.thickness ?? 1,
    a: cfg.domeRadius ?? 20, wd: cfg.domeLoad ?? 5, alpha: cfg.domeAngle ?? 90, phi: cfg.probe ?? 40 };
  const st = JSON.parse(JSON.stringify(init));
  const forceRef = cfg.forceScale ?? (() => { const m = archModel({ span: init.L, rise: init.h, load: init.w, points: init.points }); return Math.max(m.Rmax, 1e-9) * 1.25; })();

  // geometry (px)
  const W = 360, Hh = 250, PX0 = 42, PX1 = 318, YS = 125, YMAX = 96;
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fs-svg', role: 'img', 'aria-label': 'structure' });
  const arrow = (g0, x0, y0, x1, y1, col, wd = 2.2) => {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy); if (len < 2) return;
    const ux = dx / len, uy = dy / len, hs = Math.min(6.5, len * 0.5);
    g0.append(s('line', { x1: x0, y1: y0, x2: x1 - ux * hs * 0.6, y2: y1 - uy * hs * 0.6, stroke: col, 'stroke-width': wd }),
      s('path', { d: `M${x1},${y1} L${x1 - ux * hs - uy * hs * 0.5},${y1 - uy * hs + ux * hs * 0.5} L${x1 - ux * hs + uy * hs * 0.5},${y1 - uy * hs - ux * hs * 0.5} Z`, fill: col }));
  };
  const colT = show.forceColors ? 'var(--covec)' : 'var(--ink)', colC = show.forceColors ? 'var(--vec)' : 'var(--ink)';

  // ---------- line view (cable, arch)
  function paintLine(g0, lab) {
    const m = archModel({ span: st.L, rise: st.h, load: st.w, points: st.points }), arch = st.mode === 'arch';
    const sx = (PX1 - PX0) / st.L, sy = Math.min(sx, YMAX / R.rise[1]), X = x => PX0 + x * sx, Y = y => YS - y * sy;
    const sgn = arch ? 1 : -1, yc = x => (arch ? m.parab(x) : -m.thrust(x));   // the drawn shape (world y, up positive)
    const yd = v => clamp(v, -1e3, 1e3), N = 160, xs = Array.from({ length: N + 1 }, (_, i) => st.L * i / N);
    const pathOf = f => xs.map((x, i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${clamp(Y(f(x)), 4, Hh - 4).toFixed(1)}`).join(' ');
    if (show.ground) {
      g0.append(s('line', { x1: X(0), y1: YS, x2: X(st.L), y2: YS, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.6 }),
        s('rect', { x: X(0) - 12, y: YS - 4, width: 12, height: 22, fill: 'var(--muted)', opacity: 0.35 }), s('rect', { x: X(st.L), y: YS - 4, width: 12, height: 22, fill: 'var(--muted)', opacity: 0.35 }));
    }
    if (show.ghost) g0.append(s('path', { d: pathOf(x => -yc(x)), fill: 'none', stroke: 'var(--muted)', 'stroke-width': 2, 'stroke-dasharray': '4 4', opacity: 0.5 }));
    if (arch && show.stone) {
      const up = pathOf(x => m.parab(x) + st.t / 2), dn = xs.slice().reverse().map(x => `L${X(x).toFixed(1)},${Y(m.parab(x) - st.t / 2).toFixed(1)}`).join(' ');
      g0.append(s('path', { d: `${up} ${dn} Z`, fill: 'var(--muted)', opacity: 0.18, stroke: 'var(--muted)', 'stroke-width': 1 }));
    }
    if (arch && show.band) {
      const up = pathOf(x => m.parab(x) + st.t / 6), dn = xs.slice().reverse().map(x => `L${X(x).toFixed(1)},${Y(m.parab(x) - st.t / 6).toFixed(1)}`).join(' ');
      g0.append(s('path', { d: `${up} ${dn} Z`, fill: 'var(--good, #2e9e5b)', opacity: 0.28 }));
    }
    // load
    const tail = arch ? 14 : YS - 30;
    if (show.loadArrows) {
      if (st.w > 0) {
        for (let i = 0; i < 14; i++) { const x = st.L * (i + 0.5) / 14; arrow(g0, X(x), tail, X(x), clamp(Y(yc(x)) - 1, tail + 6, Hh - 6), 'var(--muted)', 1.4); }
        g0.append(s('line', { x1: X(0), y1: tail, x2: X(st.L), y2: tail, stroke: 'var(--muted)', 'stroke-width': 1.4 }));
        if (show.labels) lab(X(st.L / 2), tail - 4, `${num(st.w, 1)} ${U.load}`, { 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 650 });
      }
      st.points.forEach((p, i) => {
        const x = p.x * st.L;
        arrow(g0, X(x), tail - 6, X(x), clamp(Y(yc(x)), tail + 10, Hh - 6), 'var(--ink)', 3.4);
        if (show.labels) lab(X(x) + 5, tail + 6, `${num(p.P, 0)} ${U.force}`, { fill: 'var(--ink)', 'font-weight': 650 });
        if (show.pointHandles) g0.append(s('circle', { cx: X(x), cy: tail - 6, r: 7, fill: 'var(--bg, #fff)', stroke: 'var(--basis)', 'stroke-width': 2.5, 'data-pt': i, style: 'cursor:ew-resize;touch-action:none' }));
      });
    }
    if (show.shape) g0.append(s('path', { d: pathOf(yc), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    if (arch && show.thrustLine && m.H > 0) g0.append(s('path', { d: pathOf(m.thrust), fill: 'none', stroke: 'var(--basis)', 'stroke-width': 1.8, 'stroke-dasharray': '5 3' }));
    // force arrows along the shape
    if (show.forceArrows && m.H > 0) {
      const col = arch ? colC : colT;
      for (let i = 1; i <= 9; i++) {
        const x = st.L * i / 10, e = 0.01 * st.L, slope = (yc(Math.min(st.L, x + e)) - yc(Math.max(0, x - e))) / (Math.min(st.L, x + e) - Math.max(0, x - e));
        const ux = sx, uy = -slope * sy, ul = Math.hypot(ux, uy), tx = ux / ul, ty = uy / ul, len = clamp(10 + 38 * m.N(x) / forceRef, 8, 52) / 2;
        const px = X(x), py = clamp(Y(yc(x)), 4, Hh - 4), g = 2.5;
        if (arch) { arrow(g0, px + tx * len, py + ty * len, px + tx * g, py + ty * g, col); arrow(g0, px - tx * len, py - ty * len, px - tx * g, py - ty * g, col); }
        else { arrow(g0, px + tx * g, py + ty * g, px + tx * len, py + ty * len, col); arrow(g0, px - tx * g, py - ty * g, px - tx * len, py - ty * len, col); }
      }
    }
    // reactions
    if (show.reactions && m.total > 0) {
      const k = 62 / forceRef, c = 'var(--basis)', hl = clamp(m.H * k, 6, 62);
      const ends = [[0, m.Va, -1], [st.L, m.Vb, 1]];
      for (const [x, V, side] of ends) {
        const vl = clamp(V * k, 6, 62);
        arrow(g0, X(x) + side * 6, YS + vl, X(x) + side * 6, YS, c, 3);
        if (arch) arrow(g0, X(x) + side * hl, YS, X(x), YS, c, 3); else arrow(g0, X(x), YS, X(x) + side * hl, YS, c, 3);
        if (show.labels) {
          lab(X(x) + side * 8, YS + vl + 10, `${num(V, 0)}`, { 'text-anchor': side < 0 ? 'end' : 'start', fill: c, 'font-weight': 650 });
          lab(X(x) + side * (hl + 3), YS - 5, `${num(m.H, 0)}`, { 'text-anchor': side < 0 ? 'end' : 'start', fill: c, 'font-weight': 650 });
        }
      }
    }
    // dimensions
    if (show.dimensions && show.labels) {
      lab(X(st.L / 2), Hh - 4, `${Lb.span} = ${num(st.L, 0)} ${U.length}`, { 'text-anchor': 'middle', fill: 'var(--ink)' });
      lab(X(st.L / 2) + 14, arch ? YS - sy * st.h - 10 : YS + sy * st.h + 14, `${Lb.rise} = ${num(st.h, 1)} ${U.length}`, { fill: 'var(--ink)' });
      g0.append(s('line', { x1: X(st.L / 2), y1: YS, x2: X(st.L / 2), y2: clamp(Y(sgn * st.h), 4, Hh - 4), stroke: 'var(--ink)', 'stroke-width': 1, 'stroke-dasharray': '2 2' }));
    }
    if (show.handles) g0.append(s('circle', { cx: X(st.L / 2), cy: clamp(Y(sgn * st.h), 4, Hh - 4), r: 8, fill: 'var(--bg, #fff)', stroke: 'var(--basis)', 'stroke-width': 2.5, 'data-rise': 1, style: 'cursor:ns-resize;touch-action:none' }));
    st._view = { sx, sy, X, Y, sgn };
    return m;
  }

  // ---------- dome view
  function paintDome(g0, lab) {
    const ar = 100, CX = 180, CY = 150, al = st.alpha * Math.PI / 180, P = (phi, side = 1) => [CX + side * ar * Math.sin(phi), CY - ar * Math.cos(phi)];
    const f = phi => domeForces(phi, st.a, st.wd), wa = st.wd * st.a, ncol = v => (v < 0 ? colC : colT);
    if (show.ground) g0.append(s('line', { x1: CX - ar - 20, y1: P(al)[1], x2: CX + ar + 20, y2: P(al)[1], stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.6 }));
    const arc = side => Array.from({ length: 61 }, (_, i) => { const p = P(al * i / 60, side); return `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`; }).join(' ');
    if (show.shape) for (const side of [1, -1]) g0.append(s('path', { d: arc(side), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    if (show.switchLine && al > HOOP_SWITCH) {
      const p = P(HOOP_SWITCH);
      g0.append(s('line', { x1: CX, y1: CY, x2: p[0], y2: p[1], stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '4 3' }));
      if (show.labels) lab(p[0] + 4, p[1] + 10, `${num(HOOP_SWITCH * 180 / Math.PI, 1)}°`, { fill: 'var(--muted)' });
    }
    for (let i = 1; i <= 8; i++) {
      const phi = al * i / 8, fv = f(phi);
      for (const side of [1, -1]) {
        const [px, py] = P(phi, side);
        if (show.forceArrows) {
          const tx = side * Math.cos(phi), ty = Math.sin(phi), len = clamp(14 + 30 * Math.abs(fv.meridian) / wa, 8, 48) / 2;   // tangent along the meridian, pointing down the shell
          arrow(g0, px + tx * len, py + ty * len, px + tx * 2.5, py + ty * 2.5, colC); arrow(g0, px - tx * len, py - ty * len, px - tx * 2.5, py - ty * 2.5, colC);
        }
        if (show.hoopRings) g0.append(s('circle', { cx: px - side * Math.sin(phi) * 12, cy: py + Math.cos(phi) * 12, r: clamp(2 + 7 * Math.abs(fv.hoop) / wa, 1.5, 9), fill: ncol(fv.hoop), opacity: 0.85, stroke: 'var(--ink)', 'stroke-width': 0.6 }));
      }
    }
    // probe
    const pr = clamp(st.phi * Math.PI / 180, 0, al), pp = P(pr);
    g0.append(s('line', { x1: CX, y1: CY, x2: pp[0], y2: pp[1], stroke: 'var(--basis)', 'stroke-width': 1.4 }));
    if (show.handles) g0.append(s('circle', { cx: pp[0], cy: pp[1], r: 8, fill: 'var(--bg, #fff)', stroke: 'var(--basis)', 'stroke-width': 2.5, 'data-probe': 1, style: 'cursor:grab;touch-action:none' }));
    if (show.labels) lab(CX + 6, CY - 12, `φ = ${num(st.phi, 0)}°`, { fill: 'var(--basis)', 'font-weight': 650 });
    // force plot against phi
    if (show.forcePlot) {
      const x0 = 46, x1 = 318, y0 = 172, y1 = 240, a0 = -1.1, b0 = 1.1, GX = v => x0 + v / al * (x1 - x0), GY = v => y1 - (clamp(v, a0, b0) - a0) / (b0 - a0) * (y1 - y0);
      g0.append(s('line', { x1: x0, y1: GY(0), x2: x1, y2: GY(0), stroke: 'var(--muted)' }), s('line', { x1: x0, y1: y0, x2: x0, y2: y1, stroke: 'var(--muted)' }));
      for (const [key, c] of [['meridian', 'var(--vec)'], ['hoop', 'var(--covec)']]) {
        g0.append(s('path', { d: Array.from({ length: 61 }, (_, i) => `${i ? 'L' : 'M'}${GX(al * i / 60).toFixed(1)},${GY(f(al * i / 60)[key] / wa).toFixed(1)}`).join(' '), fill: 'none', stroke: c, 'stroke-width': 2 }));
        g0.append(s('circle', { cx: GX(pr), cy: GY(f(pr)[key] / wa), r: 3.5, fill: c }));
      }
      if (show.labels) { lab(x0 - 4, GY(0) + 3, '0', { 'text-anchor': 'end' }); lab(x1, y1 + 9, 'φ', { 'text-anchor': 'end' }); lab(x0 + 4, y0 - 2, `${Lb.meridian} (blue), ${Lb.hoop} (orange)`, {}); }
    }
    return null;
  }

  function paint() {
    svg.replaceChildren();
    const g0 = s('g'), lab = (x, y, txt, o = {}) => g0.append(s('text', { x, y, 'font-size': 9.5, fill: 'var(--muted)', ...o }, txt));
    const dome = st.mode === 'dome', m = dome ? paintDome(g0, lab) : paintLine(g0, lab);
    if (show.legend && show.labels && show.forceColors) {
      const ly = dome ? 8 : Hh - 36;
      g0.append(s('rect', { x: 8, y: ly, width: 9, height: 9, fill: 'var(--covec)' }), s('rect', { x: 8, y: ly + 13, width: 9, height: 9, fill: 'var(--vec)' }));
      lab(21, ly + 8, Lb.tension, { fill: 'var(--ink)' }); lab(21, ly + 21, Lb.compression, { fill: 'var(--ink)' });
    }
    svg.append(g0);
    readouts(m);
  }

  // ---------- readouts
  const defaultReads = { arch: ['thrust', 'vertical', 'check'], cable: ['thrust', 'vertical', 'maxforce'], dome: ['meridian', 'hoop', 'base'] };
  const readsFor = mode => { const r = cfg.readouts; const list = Array.isArray(r) ? r : r?.[mode] ?? defaultReads[mode]; return list; };
  const lineKeys = ['thrust', 'vertical', 'maxforce', 'check'], domeKeys = ['meridian', 'hoop', 'base', 'switch'];
  const readEl = h('div', { class: 'fs-reads' }), flagEl = h('div', { class: 'fs-lab', role: 'status' });
  function readouts(m) {
    const dome = st.mode === 'dome', keys = readsFor(st.mode).filter(k => (dome ? domeKeys : lineKeys).includes(k));
    let val = {}, msg = '', bad = false;
    if (dome) {
      const phi = clamp(st.phi * Math.PI / 180, 0, st.alpha * Math.PI / 180), f = domeForces(phi, st.a, st.wd), b = domeBase(st.alpha * Math.PI / 180, st.a, st.wd);
      const word = v => (v < 0 ? Lb.compression : Lb.hoopTension);
      val = { meridian: `${num(-f.meridian, 1)} ${U.line} (${Lb.compression})`, hoop: `${num(Math.abs(f.hoop), 1)} ${U.line} (${word(f.hoop)})`,
        base: `${num(b.vertical, 1)} ${U.line} ↓, ${num(b.horizontal, 1)} ${U.line} →`, switch: `${num(HOOP_SWITCH * 180 / Math.PI, 1)}°` };
    } else {
      const lim = st.t / 6, stone = st.t / 2;
      val = { thrust: `${num(m.H, 0)} ${U.force}`, vertical: Math.abs(m.Va - m.Vb) < 1e-6 ? `${num(m.Va, 0)} ${U.force} ${Lb.each}` : `${num(m.Va, 0)} / ${num(m.Vb, 0)} ${U.force}`,
        maxforce: `${num(m.Rmax, 0)} ${U.force}`, check: `${num(m.dev, 2)} ${U.length} (≤ ${num(lim, 2)})` };
      if (st.mode === 'arch' && show.band) {
        if (m.dev > stone + 1e-9) { msg = Lb.outside; bad = true; } else if (m.dev > lim + 1e-9) { msg = Lb.edge; bad = true; } else msg = Lb.inside;
      }
    }
    readEl.replaceChildren(...keys.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), h('div', { class: 'fs-num', role: 'status' }, val[k] ?? ''))));
    flagEl.textContent = msg; flagEl.style.color = bad ? 'var(--bad)' : ''; flagEl.className = 'fs-lab' + (bad ? ' c-bad' : '');
    for (const sl of sliders) sl.sync();
    modeBtns.forEach(([b, md]) => b.classList.toggle('active', md === st.mode));
  }

  // ---------- controls
  const sliders = [];
  const slider = (label, key, range, shown, fmt, onSet) => {
    const inp = h('input', { type: 'range', min: range[0], max: range[1], step: range[2], 'aria-label': label }), val = h('span', { class: 'fs-num' });
    inp.addEventListener('input', () => { st[key] = +inp.value; onSet?.(); paint(); });
    sliders.push({ sync() { inp.value = st[key]; val.textContent = fmt(st[key]); row.style.display = shown() ? '' : 'none'; } });
    const row = h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(label)), inp, val);
    return row;
  };
  const line = () => st.mode !== 'dome', domeOn = () => st.mode === 'dome';
  const rows = [
    show.riseSlider ? slider(Lb.rise, 'h', R.rise, line, v => `${num(v, 1)} ${U.length}`) : '',
    show.spanSlider ? slider(Lb.span, 'L', R.span, line, v => `${num(v, 0)} ${U.length}`) : '',
    show.loadSlider ? slider(Lb.load, 'w', R.load, line, v => `${num(v, 1)} ${U.load}`) : '',
    show.loadSlider ? slider(Lb.load, 'wd', [0, R.load[1], 0.5], domeOn, v => `${num(v, 1)} ${U.area}`) : '',
    show.angleSlider ? slider(Lb.angle, 'phi', [0, 90, 1], domeOn, v => `${num(v, 0)}°`) : '',
    show.capSlider ? slider(Lb.cap, 'alpha', R.angle, domeOn, v => `${num(v, 0)}°`) : '',
  ].filter(Boolean);
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const modeBtns = show.modeToggle ? modes.map(md => [btn(Lb[md] ?? md, () => { st.mode = md; paint(); }), md]) : [];
  const apply = pr => {
    if (pr.mode) st.mode = pr.mode;
    if (pr.span != null) st.L = pr.span; if (pr.rise != null) st.h = pr.rise; if (pr.load != null) st.w = pr.load;
    if (pr.points) st.points = JSON.parse(JSON.stringify(pr.points)); if (pr.thickness != null) st.t = pr.thickness;
    if (pr.domeAngle != null) st.alpha = pr.domeAngle; if (pr.probe != null) st.phi = pr.probe; if (pr.domeLoad != null) st.wd = pr.domeLoad;
    paint();
  };
  const presets = show.presets ? cfg.presets ?? [] : [];
  const btns = h('div', { class: 'wbtns' }, modeBtns.map(x => x[0]), presets.map(pr => btn(pr.label, () => apply(pr))), presets.length ? btn(Lb.reset, () => { Object.assign(st, JSON.parse(JSON.stringify(init))); paint(); }) : '');
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts ? readEl : '', show.flag ? flagEl : '', rows.length ? h('div', { class: 'fs-sliders' }, rows) : '', btns);
  flagEl.style.minHeight = '1.3em';

  // ---------- dragging
  let drag = null;
  const pos = ev => { const r = svg.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * Hh]; };
  svg.addEventListener('pointerdown', ev => {
    const t = ev.target; if (!t?.getAttribute) return;
    drag = t.hasAttribute('data-rise') ? { k: 'rise' } : t.hasAttribute('data-probe') ? { k: 'probe' } : t.hasAttribute('data-pt') ? { k: 'pt', i: +t.getAttribute('data-pt') } : null;
    if (drag) { svg.setPointerCapture?.(ev.pointerId); ev.preventDefault(); }
  });
  svg.addEventListener('pointermove', ev => {
    if (!drag) return;
    const [x, y] = pos(ev);
    if (drag.k === 'rise') { const v = st._view, step = R.rise[2]; st.h = clamp(Math.round(Math.abs(YS - y) / v.sy / step) * step, R.rise[0], R.rise[1]); }
    else if (drag.k === 'pt') { const v = st._view; st.points[drag.i].x = clamp(Math.round((x - PX0) / v.sx / st.L * 100) / 100, 0.05, 0.95); }
    else { const dx = x - 180, dy = 150 - y; st.phi = clamp(Math.round(Math.atan2(dx, dy) * 180 / Math.PI), 0, st.alpha); }
    paint();
  });
  const up = () => { drag = null; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);

  paint();
}
