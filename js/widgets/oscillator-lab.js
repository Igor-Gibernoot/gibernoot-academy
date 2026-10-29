// oscillator-lab
//
// A driven, damped mass on a spring (or a swaying tower), with an optional second tuned mass (a tuned mass damper). Plain SVG + HTML, every word and unit from the config
// (no course text hard-coded). Three parts: the system drawing (animated), the live resonance curve (steady-state amplitude against drive frequency, marker at the
// current drive), the time trace of displacement.
// Model (displacements in `units.length`; time in natural periods; x1 = main mass, x2 = second mass; r = drive frequency / f0):
//   main:    x1'' + 2 z1 x1' + x1 + mu [ nu^2 (x1 - x2) + 2 z2 nu (x1' - x2') ] = D cos(theta),   theta' = r        (time unit 1/w0, w0 = 2 pi f0)
//   second:  x2'' = nu^2 (x1 - x2) + 2 z2 nu (x1' - x2')                                                      (mu = m2/m1, nu = f_damper / f0)
//   D = drive amplitude = static displacement F0/k.  Integrated by RK4 for the animation.
//   Steady state (exact, complex): with Dd = nu^2 + 2i z2 nu r,   H1 = 1 / (1 - r^2 + 2i z1 r - mu Dd r^2 / (Dd - r^2)),   x1 = D H1,   x2 = x1 Dd / (Dd - r^2).
//   No damper (mu = 0): |H1| = 1 / sqrt((1 - r^2)^2 + (2 z1 r)^2); at resonance the peak is about 1/(2 z1) times the static displacement; phase lag = atan2(2 z1 r, 1 - r^2).
//   Den Hartog optimum for a damper on an undamped main mass: nu = 1/(1 + mu),  z2 = sqrt(3 mu / (8 (1 + mu)^3))  (config `damperTuning: 'optimal'` / `damperDamping: 'optimal'`).
//   Natural frequency f0 = (1/2 pi) sqrt(k/m) from `mass` and `stiffness` when both are given (then those can have sliders), else `f0` directly.
//
//   system: 'spring' | 'tower'      systems: ['spring','tower']  buttons (toggle)
//   f0: 0.2 (Hz) | mass: 100, stiffness: 4000      drive: 1 (amplitude D, static displacement)      driveFrequency: f0 (Hz)
//   damping: 0.05 (main z1)      damper: false (start with the second mass present)      massRatio: 0.02      tuning: 'optimal' | number nu      damperDamping: 'optimal' | number z2
//   ranges: { frequency: [0, 2 f0, f0/100], damping: [0, 0.3, 0.005], massRatio: [0.005, 0.1, 0.005], tuning: [0.7, 1.2, 0.005], damperDamping: [0, 0.3, 0.005],
//             drive: [0, 3, 0.1], mass: [m/4, 4m, m/20], stiffness: [k/4, 4k, k/20] }   (the curve's frequency axis ends at the largest range value; `fMax` overrides)
//   ampMax: 12 (curve and drawing scale: largest amplitude drawn on the curve, in units of D)      animPeriod: 2.4 (real seconds per natural period in the animation)      window: 10 (periods in the trace)
//   units: { length:'m', freq:'Hz', time:'s', mass:'kg', stiffness:'N/m' }      autoplay: true
//   show: { system, ground, spring, driver, damper, curve, marker, ghost, f0Line, trace, driveTrace, damperTrace, labels, readouts, freqReadout, phaseReadout, flag, handles,
//           freqSlider, dampingSlider, massRatioSlider, tuningSlider, damperDampingSlider, driveSlider, massSlider, stiffnessSlider, systemToggle, damperToggle, play, presets }
//       defaults true except damperDampingSlider, driveSlider, massSlider, stiffnessSlider, ghost (false).
//       system = the mass / tower drawing; ground = floor and wall; spring = the coil of the main spring (spring system) or the coil of the second mass (tower system);
//       driver = force arrow on the main mass (length ~ force, follows cos); damper = the second mass, its spring and its curve, trace and sliders; curve = the resonance plot;
//       marker = dot and line at the current drive frequency; ghost = faint curve without the damper (for comparison); f0Line = dotted line at f0; trace = displacement-time plot;
//       driveTrace = faint force in the trace; damperTrace = the second mass in the trace; labels = all text in the drawings; readouts = number row;
//       freqReadout = natural frequency / period cells, phaseReadout = phase cell; flag = status line (reserved); handles = drag the marker along the curve;
//       damperToggle = button that adds / removes the second mass; play = play/pause and restart buttons; presets = preset buttons.
//   readouts: any of  natural, period, drive, amplitude, ratio, phase, damperAmp   default [natural, period, amplitude, phase]
//   presets: [{ label, system, frequency, damping, damper, massRatio, tuning, damperDamping, drive, mass, stiffness }]   only the fields given change; restarts the motion
//   labels: { natural, period, drive, amplitude, ratio, phase, damperAmp, frequency, damping, massRatio, tuning, damperDamping, driveAmp, mass, stiffness, spring, tower, addDamper,
//             removeDamper, play, pause, restart, reset, curve, trace, force, noDamper, f0, driveFreq, time, ampAxis, degrees }
//   Exported for script checks: response({r, zeta, mu, nu, zeta2}) -> {a1, a2, phase}, denHartog(mu) -> {nu, zeta2}, simulate(p, periods) -> state.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 1) => String(Number((+v).toFixed(d)));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- pure model (exported for script checks) ----------
export function denHartog(mu) { return { nu: 1 / (1 + mu), zeta2: Math.sqrt(3 * mu / (8 * (1 + mu) ** 3)) }; }
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
// steady-state amplitude (in units of the static displacement D = 1) of the main mass a1 and the second mass a2, phase = lag of the main mass behind the force (rad)
export function response({ r, zeta = 0, mu = 0, nu = 1, zeta2 = 0 }) {
  const Dd = [nu * nu, 2 * zeta2 * nu * r], r2 = r * r;
  if (!(mu > 0)) { const x = cdiv([1, 0], [1 - r2, 2 * zeta * r + 1e-9]); return { a1: Math.hypot(...x), a2: 0, phase: Math.atan2(-x[1], x[0]) }; }
  const den = [Dd[0] - r2, Dd[1] + 1e-12];
  const t = cdiv(cmul(Dd, [mu * r2, 0]), den);
  const inv = [1 - r2 - t[0], 2 * zeta * r - t[1] + 1e-9];   // 1e-9: keeps the undamped resonance finite
  const x1 = cdiv([1, 0], inv), x2 = cmul(x1, cdiv(Dd, den));
  return { a1: Math.hypot(...x1), a2: Math.hypot(...x2), phase: Math.atan2(-x1[1], x1[0]) };
}
export function step(S, p, dt) {   // one RK4 step of the dimensionless equations; S = [x1, v1, x2, v2, theta]
  const f = ([x1, v1, x2, v2, th]) => {
    const fr = p.mu * (p.nu * p.nu * (x1 - x2) + 2 * p.zeta2 * p.nu * (v1 - v2));
    const a2 = p.mu > 0 ? p.nu * p.nu * (x1 - x2) + 2 * p.zeta2 * p.nu * (v1 - v2) : 0;
    return [v1, p.D * Math.cos(th) - 2 * p.zeta * v1 - x1 - fr, v2, a2, p.r];
  };
  const add = (a, b, k) => a.map((v, i) => v + b[i] * k);
  const k1 = f(S), k2 = f(add(S, k1, dt / 2)), k3 = f(add(S, k2, dt / 2)), k4 = f(add(S, k3, dt));
  return S.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
export function simulate(p, periods, S = [0, 0, 0, 0, 0]) {   // from rest; time in natural periods
  const T = periods * 2 * Math.PI, n = Math.ceil(T / 0.02);
  for (let i = 0; i < n; i++) S = step(S, p, T / n);
  return S;
}

// ---------- widget ----------
export function oscillatorLab(el, cfg) {
  const Lb = { natural: 'Natural frequency', period: 'Period', drive: 'Drive frequency', amplitude: 'Amplitude', ratio: 'Amplitude / static', phase: 'Phase lag', damperAmp: 'Second mass amplitude',
    frequency: 'Drive frequency', damping: 'Damping ratio', massRatio: 'Mass ratio', tuning: 'Tuning (frequency ratio)', damperDamping: 'Second mass damping', driveAmp: 'Drive amplitude',
    mass: 'Mass', stiffness: 'Stiffness', spring: 'Mass on a spring', tower: 'Tower', addDamper: 'Add second mass', removeDamper: 'Remove second mass', play: 'Play', pause: 'Pause',
    restart: 'Restart', reset: 'Reset', curve: 'amplitude against drive frequency', trace: 'displacement against time', force: 'force', noDamper: 'without second mass', f0: 'f0',
    driveFreq: 'drive', time: 'time', ampAxis: 'amplitude', degrees: 'deg', ...(cfg.labels ?? {}) };
  const U = { length: 'm', freq: 'Hz', time: 's', mass: 'kg', stiffness: 'N/m', ...(cfg.units ?? {}) };
  const show = { system: true, ground: true, spring: true, driver: true, damper: true, curve: true, marker: true, ghost: false, f0Line: true, trace: true, driveTrace: true, damperTrace: true,
    labels: true, readouts: true, freqReadout: true, phaseReadout: true, flag: true, handles: true, freqSlider: true, dampingSlider: true, massRatioSlider: true, tuningSlider: true,
    damperDampingSlider: false, driveSlider: false, massSlider: false, stiffnessSlider: false, systemToggle: true, damperToggle: true, play: true, presets: true, ...(cfg.show ?? {}) };
  const useMK = cfg.mass != null && cfg.stiffness != null;
  const init = { system: cfg.system ?? 'spring', mass: cfg.mass ?? 100, stiffness: cfg.stiffness ?? 4000, f0: cfg.f0 ?? 0.2, zeta: cfg.damping ?? 0.05, damper: cfg.damper ?? false,
    mu: cfg.massRatio ?? 0.02, tuning: cfg.tuning ?? 'optimal', zeta2: cfg.damperDamping ?? 'optimal', D: cfg.drive ?? 1, fd: cfg.driveFrequency ?? null };
  const st = { ...init };
  const f0Of = () => (useMK ? Math.sqrt(st.stiffness / st.mass) / (2 * Math.PI) : st.f0);
  if (st.fd == null) st.fd = f0Of();
  const R = { damping: [0, 0.3, 0.005], massRatio: [0.005, 0.1, 0.005], tuning: [0.7, 1.2, 0.005], damperDamping: [0, 0.3, 0.005], drive: [0, 3, 0.1],
    mass: [init.mass / 4, init.mass * 4, init.mass / 20], stiffness: [init.stiffness / 4, init.stiffness * 4, init.stiffness / 20], ...(cfg.ranges ?? {}) };
  const f0max = useMK ? Math.sqrt(R.stiffness[1] / R.mass[0]) / (2 * Math.PI) : init.f0;
  const fMax = cfg.fMax ?? 2 * (useMK && !(show.massSlider || show.stiffnessSlider) ? f0Of() : f0max);
  R.frequency = [0, fMax, fMax / 200]; Object.assign(R, cfg.ranges?.frequency ? { frequency: cfg.ranges.frequency } : {});
  const ampMax = cfg.ampMax ?? 12, animPeriod = cfg.animPeriod ?? 2.4, win = cfg.window ?? 10;

  const params = () => {
    const mu = st.damper ? st.mu : 0, opt = denHartog(Math.max(st.mu, 1e-9));
    return { r: st.fd / f0Of(), zeta: st.zeta, mu, nu: st.tuning === 'optimal' ? opt.nu : st.tuning, zeta2: st.zeta2 === 'optimal' ? opt.zeta2 : st.zeta2, D: st.D };
  };

  // geometry (px)
  const W = 360, SH = show.system ? 136 : 0, CH = show.curve ? 128 : 0, TR = show.trace ? 96 : 0;
  const Hh = SH + CH + TR + 6;
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fs-svg', role: 'img', 'aria-label': 'oscillator' });
  let S = [0, 0, 0, 0, 0], hist = [], tNow = 0;     // state; trace history [t, x1, x2, force]; time in periods
  const maxHist = () => Math.ceil(win * 60);
  const restart = () => { S = [0, 0, 0, 0, 0]; hist = []; tNow = 0; };

  // ---- drawing helpers
  const arrow = (g0, x0, y0, x1, y1, col) => {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy); if (len < 2) return;
    const ux = dx / len, uy = dy / len, hs = Math.min(7, len * 0.5);
    g0.append(s('line', { x1: x0, y1: y0, x2: x1 - ux * hs * 0.6, y2: y1 - uy * hs * 0.6, stroke: col, 'stroke-width': 2.5 }),
      s('path', { d: `M${x1},${y1} L${x1 - ux * hs - uy * hs * 0.5},${y1 - uy * hs + ux * hs * 0.5} L${x1 - ux * hs + uy * hs * 0.5},${y1 - uy * hs - ux * hs * 0.5} Z`, fill: col }));
  };
  const coil = (x0, y0, x1, y1, n, amp, col) => {   // zigzag between two points
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, e = Math.min(8, L / 6);
    let d = `M${x0},${y0} L${x0 + ux * e},${y0 + uy * e}`;
    for (let i = 0; i < n * 2; i++) { const t = e + (L - 2 * e) * (i + 0.5) / (n * 2), sg = i % 2 ? 1 : -1; d += ` L${x0 + ux * t - uy * amp * sg},${y0 + uy * t + ux * amp * sg}`; }
    d += ` L${x1 - ux * e},${y1 - uy * e} L${x1},${y1}`;
    return s('path', { d, fill: 'none', stroke: col, 'stroke-width': 1.8, 'stroke-linejoin': 'round' });
  };
  const gain = 24 / Math.max(init.D || 1, 0.1);   // px per unit of length: the initial drive amplitude D swings the mass 24 px (soft-clipped at the frame)
  const px = (x, HALF = 74) => HALF * Math.tanh(x * gain / HALF);

  function paintSystem(g0, q) {
    const lab = (x, y, txt, o = {}) => show.labels && g0.append(s('text', { x, y, 'font-size': 9.5, fill: 'var(--muted)', ...o }, txt));
    const x1 = px(q.x1), x2 = px(q.x2), cy = SH / 2 + 4;
    const fr = q.force;
    if (st.system === 'spring') {
      const wallX = 16, restX = 104, bw = 46, bh = 34;
      if (show.ground) { g0.append(s('line', { x1: wallX, y1: cy - 40, x2: wallX, y2: cy + 40, stroke: 'var(--ink)', 'stroke-width': 3 }), s('line', { x1: wallX - 2, y1: cy + bh / 2 + 4, x2: W - 10, y2: cy + bh / 2 + 4, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.6 })); }
      const bx = restX + x1;
      if (show.spring) g0.append(coil(wallX, cy, bx, cy, 9, 7, 'var(--muted)'));
      else g0.append(s('line', { x1: wallX, y1: cy, x2: bx, y2: cy, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '2 3' }));
      g0.append(s('line', { x1: restX + bw / 2, y1: cy - bh / 2 - 6, x2: restX + bw / 2, y2: cy + bh / 2 + 4, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.7 }));
      g0.append(s('rect', { x: bx, y: cy - bh / 2, width: bw, height: bh, rx: 4, fill: 'var(--basis)', opacity: 0.9, stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      lab(bx + bw / 2, cy + 4, 'm', { 'text-anchor': 'middle', fill: 'var(--bg, #fff)', 'font-weight': 700 });
      if (q.damper) {
        const sx = bx + bw + 6, bw2 = 22, bh2 = 22, rx = restX + bw + 54 + x2;
        const bx2 = Math.max(rx, sx + 18);
        if (show.spring) g0.append(coil(sx - 6, cy, bx2, cy, 5, 5, 'var(--muted)')); else g0.append(s('line', { x1: sx - 6, y1: cy, x2: bx2, y2: cy, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '2 3' }));
        g0.append(s('rect', { x: bx2, y: cy - bh2 / 2, width: bw2, height: bh2, rx: 3, fill: 'var(--covec)', opacity: 0.9, stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      }
      if (show.driver) arrow(g0, bx + bw / 2, cy - bh / 2 - 12, bx + bw / 2 + fr * 22, cy - bh / 2 - 12, 'var(--bad)');
    } else {   // tower
      const baseY = SH - 14, topY = 14, gx = 120, bw0 = 34, bw1 = 16, Ht = baseY - topY;
      const sway = (t) => px(q.x1, 34) * t * t;     // fraction t of the height: shape ~ t^2
      if (show.ground) g0.append(s('line', { x1: 8, y1: baseY, x2: W - 8, y2: baseY, stroke: 'var(--muted)', 'stroke-width': 1.5 }));
      const left = [], right = [];
      for (let i = 0; i <= 14; i++) { const t = i / 14, y = baseY - t * Ht, w = bw0 + (bw1 - bw0) * t; left.push([gx - w / 2 + sway(t), y]); right.push([gx + w / 2 + sway(t), y]); }
      const pts = [...left, ...right.reverse()].map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
      g0.append(s('polygon', { points: pts, fill: 'var(--basis)', opacity: 0.35, stroke: 'var(--ink)', 'stroke-width': 1.8, 'stroke-linejoin': 'round' }));
      if (q.damper) {
        const t = 0.82, yy = baseY - t * Ht + 18, cx = gx + sway(t), bwid = 16, dx = clamp((px(q.x2, 34) - px(q.x1, 34)) * 0.5, -6, 6);
        if (show.spring) { g0.append(coil(cx - bwid / 2 - 6, yy + 2, cx - bwid / 2 + dx, yy + 2, 3, 3, 'var(--muted)')); }
        g0.append(s('rect', { x: cx - bwid / 2 + dx, y: yy - 4, width: bwid, height: 12, rx: 3, fill: 'var(--covec)', opacity: 0.95, stroke: 'var(--ink)', 'stroke-width': 1.3 }));
      }
      if (show.driver) arrow(g0, gx + sway(0.95) - 52, topY + 16, gx + sway(0.95) - 52 + fr * 22, topY + 16, 'var(--bad)');
    }
    return g0;
  }

  // resonance curve
  const CX0 = 34, CX1 = W - 12;
  function paintCurve(g0, oy, p, q) {
    const y0 = oy + 8, y1 = oy + CH - 22, X = f => CX0 + (f / fMax) * (CX1 - CX0), Y = a => y1 - clamp(a / ampMax, 0, 1.02) * (y1 - y0);
    const lab = (x, y, txt, o = {}) => show.labels && g0.append(s('text', { x, y, 'font-size': 9.5, fill: 'var(--muted)', ...o }, txt));
    g0.append(s('line', { x1: CX0, y1: y1, x2: CX1, y2: y1, stroke: 'var(--muted)', 'stroke-width': 1 }), s('line', { x1: CX0, y1: y0, x2: CX0, y2: y1, stroke: 'var(--muted)', 'stroke-width': 1 }));
    const f0 = f0Of();
    const path = (pp) => { let d = ''; for (let i = 0; i <= 240; i++) { const f = fMax * i / 240, a = response({ ...pp, r: f / f0 }).a1 * pp.D; d += `${i ? 'L' : 'M'}${X(f).toFixed(1)},${Y(a).toFixed(1)} `; } return d; };
    if (show.ghost && p.mu > 0) g0.append(s('path', { d: path({ ...p, mu: 0 }), fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3', opacity: 0.8 }));
    if (show.f0Line) { g0.append(s('line', { x1: X(f0), y1: y0, x2: X(f0), y2: y1, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '1.5 3' })); lab(X(f0), y1 + 10, num(f0, 2), { 'text-anchor': 'middle' }); }
    g0.append(s('path', { d: path(p), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }));
    if (show.marker) {
      const a = q.a1 * p.D, mx = X(clamp(st.fd, 0, fMax));
      g0.append(s('line', { x1: mx, y1: y0, x2: mx, y2: y1, stroke: 'var(--bad)', 'stroke-width': 1.2, opacity: 0.7 }), s('circle', { cx: mx, cy: Y(a), r: 5, fill: 'var(--bad)', stroke: 'var(--ink)', 'stroke-width': 1, 'data-handle': 1 }));
      lab(mx, y1 + 10, num(st.fd, 2) + ' ' + U.freq, { 'text-anchor': mx > W - 50 ? 'end' : 'middle', dy: 9, fill: 'var(--bad)', 'font-weight': 650 });
    }
    lab(CX0 + 2, y0 + 2, `${Lb.curve} (${U.freq})`);
    if (show.ghost && p.mu > 0) lab(CX1, y0 + 12, '- - ' + Lb.noDamper, { 'text-anchor': 'end' });
  }
  function paintTrace(g0, oy, p, q) {
    const y0 = oy + 12, y1 = oy + TR - 8, ym = (y0 + y1) / 2;
    const lab = (x, y, txt, o = {}) => show.labels && g0.append(s('text', { x, y, 'font-size': 9.5, fill: 'var(--muted)', ...o }, txt));
    const A = Math.max(p.D * 1.3, q.a1 * p.D * 1.15, 1e-3), top = Math.pow(10, Math.ceil(Math.log10(A) * 3) / 3);   // fixed-ish scale on 1, 2.15, 4.6 ... steps
    const ylim = clamp(top, 0.1, ampMax * Math.max(p.D, 0.1));
    const tx = CX0, tw = CX1 - CX0, tEnd = tNow, tStart = tEnd - win;
    g0.append(s('line', { x1: CX0, y1: ym, x2: CX1, y2: ym, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.6 }));
    const Yp = v => ym - clamp(v / ylim, -1, 1) * (y1 - y0) / 2, Xp = t => tx + (t - tStart) / win * tw;
    const line = (idx, col, w, dash, k) => {
      let d = ''; for (const r of hist) { if (r[0] < tStart) continue; d += `${d ? 'L' : 'M'}${Xp(r[0]).toFixed(1)},${Yp(r[idx] * k).toFixed(1)} `; }
      if (d) g0.append(s('path', { d, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linejoin': 'round', ...(dash ? { 'stroke-dasharray': dash } : {}) }));
    };
    if (show.driveTrace) line(3, 'var(--bad)', 1.2, '3 3', p.D);
    if (show.damper && show.damperTrace && p.mu > 0) line(2, 'var(--covec)', 1.6, null, 1);
    line(1, 'var(--basis)', 2, null, 1);
    lab(CX0 + 2, y0 - 2, Lb.trace); lab(CX1, y1 + 10, `${Lb.time}: ${num(win / f0Of(), 0)} ${U.time}`, { 'text-anchor': 'end' });
  }

  // ---- readouts / flag / controls
  const reads = (cfg.readouts ?? ['natural', 'period', 'amplitude', 'phase']).filter(k => (k !== 'natural' && k !== 'period') || show.freqReadout).filter(k => k !== 'phase' || show.phaseReadout);
  const rd = {};
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const flagEl = show.flag ? h('div', { class: 'fs-lab', role: 'status', style: 'min-height:1.3em' }) : null;
  const slider = (label, min, max, step, onInput) => {
    const inp = h('input', { type: 'range', min, max, step, 'aria-label': label }), val = h('span', { class: 'fs-num' });
    inp.addEventListener('input', () => onInput(+inp.value));
    return { inp, val, row: h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(label)), inp, val) };
  };
  const sliders = [], sync = [];
  const add = (flag, label, rng, get, set, fmt, enabled = () => true) => {
    if (!flag) return; const o = slider(label, rng[0], rng[1], rng[2], v => { set(v); update(); });
    sliders.push(o.row); sync.push(() => { o.inp.value = get(); o.val.textContent = fmt(get()); o.row.style.display = enabled() ? '' : 'none'; });
  };
  const optNu = () => denHartog(st.mu).nu, optZ = () => denHartog(st.mu).zeta2;
  add(show.freqSlider, Lb.frequency, R.frequency, () => st.fd, v => { st.fd = v; }, v => `${num(v, 2)} ${U.freq}`);
  add(show.dampingSlider, Lb.damping, R.damping, () => st.zeta, v => { st.zeta = v; }, v => num(v, 3));
  add(show.massSlider && useMK, Lb.mass, R.mass, () => st.mass, v => { st.mass = v; }, v => `${num(v, 0)} ${U.mass}`);
  add(show.stiffnessSlider && useMK, Lb.stiffness, R.stiffness, () => st.stiffness, v => { st.stiffness = v; }, v => `${num(v, 0)} ${U.stiffness}`);
  add(show.driveSlider, Lb.driveAmp, R.drive, () => st.D, v => { st.D = v; }, v => `${num(v, 2)} ${U.length}`);
  add(show.massRatioSlider && show.damper, Lb.massRatio, R.massRatio, () => st.mu, v => { st.mu = v; }, v => num(v, 3), () => st.damper);
  add(show.tuningSlider && show.damper, Lb.tuning, R.tuning, () => (st.tuning === 'optimal' ? optNu() : st.tuning), v => { st.tuning = v; }, v => num(v, 3), () => st.damper);
  add(show.damperDampingSlider && show.damper, Lb.damperDamping, R.damperDamping, () => (st.zeta2 === 'optimal' ? optZ() : st.zeta2), v => { st.zeta2 = v; }, v => num(v, 3), () => st.damper);
  const btn = (txt, fn) => { const b = h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt)); return b; };
  let playBtn = null, damperBtn = null, spBtn = null, twBtn = null;
  let playing = cfg.autoplay !== false;
  const presets = show.presets ? cfg.presets ?? [] : [];
  const apply = pr => {
    if (pr.system != null) st.system = pr.system;
    if (pr.frequency != null) st.fd = pr.frequency;
    if (pr.driveRatio != null) st.fd = pr.driveRatio * f0Of();
    if (pr.damping != null) st.zeta = pr.damping;
    if (pr.damper != null) st.damper = pr.damper;
    if (pr.massRatio != null) st.mu = pr.massRatio;
    if (pr.tuning != null) st.tuning = pr.tuning;
    if (pr.damperDamping != null) st.zeta2 = pr.damperDamping;
    if (pr.drive != null) st.D = pr.drive;
    if (pr.mass != null) st.mass = pr.mass;
    if (pr.stiffness != null) st.stiffness = pr.stiffness;
    restart(); update();
  };
  const toggles = [];
  if (show.systemToggle) toggles.push(spBtn = btn(Lb.spring, () => { st.system = 'spring'; update(); }), twBtn = btn(Lb.tower, () => { st.system = 'tower'; update(); }));
  if (show.damper && show.damperToggle) toggles.push(damperBtn = btn(Lb.addDamper, () => { st.damper = !st.damper; restart(); update(); }));
  const btns = h('div', { class: 'wbtns' }, ...toggles,
    show.play ? (playBtn = btn(Lb.pause, () => { playing = !playing; if (playing) { last = performance.now(); loop(); } update(); })) : '',
    show.play ? btn(Lb.restart, () => { restart(); update(); }) : '',
    show.play ? btn(Lb.reset, () => { Object.assign(st, init); if (st.fd == null) st.fd = f0Of(); restart(); update(); }) : '',
    presets.map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', flagEl ?? '', sliders.length ? h('div', { class: 'fs-sliders' }, sliders) : '', btns);

  // ---- state -> screen
  function current() {
    const p = params(), f0 = f0Of(), ss = response(p), force = p.D * Math.cos(S[4]);
    return { p, f0, ss, a1: ss.a1, x1: S[0], x2: S[2], force: p.D ? force / p.D : 0, damper: p.mu > 0 };
  }
  function paint() {
    const q = current(), p = q.p, g0 = s('g');
    if (show.system) paintSystem(g0, q);
    if (show.curve) paintCurve(g0, SH, p, q);
    if (show.trace) paintTrace(g0, SH + CH, p, q);
    svg.replaceChildren(g0);
  }
  function update() {
    const q = current(), p = q.p, f0 = q.f0;
    const val = { natural: `${num(f0, 3)} ${U.freq}`, period: `${num(1 / f0, 2)} ${U.time}`, drive: `${num(st.fd, 2)} ${U.freq}`, amplitude: `${num(q.a1 * p.D, 2)} ${U.length}`,
      ratio: num(q.a1, 2) + '×', phase: `${num(q.ss.phase * 180 / Math.PI, 0)} ${Lb.degrees}`, damperAmp: `${num(response(p).a2 * p.D, 2)} ${U.length}` };
    for (const k of reads) if (rd[k]) rd[k].textContent = val[k] ?? '';
    for (const f of sync) f();
    if (damperBtn) damperBtn.textContent = st.damper ? Lb.removeDamper : Lb.addDamper;
    if (playBtn) playBtn.textContent = playing ? Lb.pause : Lb.play;
    if (spBtn) { spBtn.setAttribute('aria-pressed', st.system === 'spring'); twBtn.setAttribute('aria-pressed', st.system === 'tower'); spBtn.style.fontWeight = st.system === 'spring' ? 700 : ''; twBtn.style.fontWeight = st.system === 'tower' ? 700 : ''; }
    paint();
  }

  // ---- animation
  let raf = 0, last = 0;
  function loop() {
    cancelAnimationFrame(raf);
    const tick = now => {
      if (!el.isConnected) return;
      if (!playing) return;
      const dtReal = Math.min(0.05, (now - last) / 1000); last = now;
      const p = params(), dtP = dtReal / animPeriod, T = dtP * 2 * Math.PI, n = Math.max(1, Math.ceil(T / 0.03));
      for (let i = 0; i < n; i++) S = step(S, p, T / n);
      tNow += dtP;
      hist.push([tNow, S[0], S[2], Math.cos(S[4])]);
      while (hist.length > maxHist() || (hist.length && hist[0][0] < tNow - win - 0.5)) hist.shift();
      if (flagEl) flagEl.textContent = '';
      paint();
      raf = requestAnimationFrame(tick);
    };
    last = performance.now(); raf = requestAnimationFrame(tick);
  }

  // ---- dragging the marker along the curve
  let drag = false;
  const toF = ev => { const r = svg.getBoundingClientRect(), vx = (ev.clientX - r.left) / r.width * W; return clamp((vx - CX0) / (CX1 - CX0) * fMax, R.frequency[0], R.frequency[1]); };
  svg.addEventListener('pointerdown', ev => { if (!show.handles || !show.curve || !show.marker || !ev.target?.getAttribute?.('data-handle')) return; drag = true; svg.setPointerCapture?.(ev.pointerId); ev.preventDefault(); });
  svg.addEventListener('pointermove', ev => { if (!drag) return; st.fd = toF(ev); update(); });
  const up = () => { drag = false; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);

  update();
  if (playing) loop();
}
