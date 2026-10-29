// track-ride
//
// Side view of a track and a cart that rolls along it under gravity (no engine). Energy is conserved except for an optional friction loss.
// Model (per unit mass; every number comes from the config, no course text hard-coded):
//   release           the cart starts at rest at the first point of the track, at height h0 (`startHeight`)
//   speed             v^2 = 2 g (h0 - y - f s)      y = height, s = distance along the track, f = friction (energy lost per metre, as a fraction of weight)
//   felt g            N / (m g) = v^2 kappa / g + cos(phi)   phi = angle of the track from horizontal (pi at the top of a loop),
//                     kappa = signed curvature (positive when the track bends towards the side the cart rides on, the inside of a loop or a dip)
//   airtime           N < 0: the track cannot pull the cart down, it leaves the track (flag; the drawing keeps following the track)
//   stall             the cart stops where v^2 reaches 0 (cannot climb higher than the energy level); it cannot go further
//
//   profile: 'hill-hill' | 'crest' | 'loop' (alias 'loop-circle') | 'loop-clothoid' | 'points'  or  { type, ...params }
//     hill-hill       release hill, dip, a second hill of height `h2`, dip, flat.         params: h2 (30), span (2 h0, horizontal half-width of each hill), tail
//     crest           release hill, dip, a hump of height `crestH` whose top has radius `crestR`, dip, flat.   params: crestH (10), crestR (25), run (2 h0), tail
//     loop            ramp down from h0, a circular loop of height `loopHeight` (radius loopHeight/2), flat.   params: loopHeight (20), run (2 h0), tail
//     loop-clothoid   same with a teardrop loop: curvature changes smoothly, top tighter than the bottom by `ratio` (3).  Same params plus ratio
//     points          `points: [[x, y], ...]` control points (x increasing); smooth curve with level tangents at each point (cosine easing). The first
//                     point's y is the start height.
//   startHeight: 40            release height (m); in 'points' mode it is the y of the first point
//   friction: 0                energy lost per metre as a fraction of weight (a constant rolling-friction-like loss); 0 = none
//   position: 0                start position along the track, 0..1 of the track length
//   g: 9.8,  speedup: 1.5      playback speed factor
//   tolerance: { low, high }   felt-g limits (numbers come from the lesson); drawn on the g-meter and g-plot only if show.tolerance
//   gRange: [min, max]         force the felt-g axis (default: from the whole ride, with the tolerance included)
//   ranges: { height: [lo, hi, step], friction: [0, 0.3, 0.005] }   the sliders
//   units: { length:'m', speed:'m/s', energy:'J/kg' }
//   show: { track, ground, cart, handles, maxLine, trace, normalArrow, weightArrow, gMeter, tolerance, gPlot, energyBar, labels, readouts, flag,
//           positionSlider, heightSlider, frictionSlider, play, presets }
//       defaults true except handles (true only for profile 'points'), tolerance (false), trace (false), frictionSlider (false), heightSlider (false),
//       positionSlider (true).  track = the curve; ground = baseline at y = 0; cart = the cart; handles = draggable control points ('points' mode);
//       maxLine = dashed energy-level line at h0; trace = distance travelled drawn thick; normalArrow / weightArrow = the track's push N and the weight, drawn
//       from the cart (lengths proportional to g, weight = 1 g); gMeter = bar of the felt g; gPlot = felt g against distance along the track;
//       energyBar = stacked bar (height energy / motion energy / lost to friction); readouts = the numbers row; flag = the airtime / stalled message.
//   readouts: ['speed','g']   any of height, speed, g, ke, pe, lost, distance
//   presets: [{ label, profile, startHeight, friction, position }]   buttons; only the fields given change (a `profile` replaces the whole profile)
//   labels: { height, speed, g, ke, pe, lost, distance, play, pause, reset, position, startHeight, friction, gMeter, energy, maxLine, airtime, stalled,
//             low, high, gPlot, ground }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 1) => String(Number((+v).toFixed(d)));

// ---------- pure model (exported for script checks) ----------
const ease = (keys, n = 120) => {
  const out = [];
  for (let i = 0; i + 1 < keys.length; i++) {
    const [x0, y0] = keys[i], [x1, y1] = keys[i + 1];
    for (let j = i ? 1 : 0; j <= n; j++) { const t = j / n; out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * (1 - Math.cos(Math.PI * t)) / 2]); }
  }
  return out;
};
const normProfile = p => (typeof p === 'string' ? { type: p } : { ...(p ?? { type: 'hill-hill' }) });

// dense polyline [x, y] of the track for a profile and release height h0
export function trackPoints(profile, h0) {
  const p = normProfile(profile), type = p.type === 'loop-circle' ? 'loop' : p.type ?? 'hill-hill', tail = p.tail ?? (p.type === 'loop' || p.type === 'loop-circle' || p.type === 'loop-clothoid' ? 15 : 30);
  if (type === 'points') { const pts = p.points.map(q => [...q]); pts[0][1] = h0; return ease(pts, 80); }
  if (type === 'hill-hill') {
    const sp = p.span ?? 2 * h0, h2 = p.h2 ?? 30;
    return ease([[0, h0], [sp, 0], [2 * sp, h2], [3 * sp, 0], [3 * sp + tail, 0]], 100);
  }
  if (type === 'crest') {
    const hc = p.crestH ?? 10, rc = p.crestR ?? 25, run = p.run ?? 2 * h0, w = Math.PI * Math.sqrt(hc * rc / 2);   // top curvature = hc pi^2 / (2 w^2) = 1/rc
    return ease([[0, h0], [run, 0], [run + w, hc], [run + 2 * w, 0], [run + 2 * w + tail, 0]], 100);
  }
  if (type === 'loop' || type === 'loop-clothoid') {
    const A = p.run ?? 2 * h0, H = p.loopHeight ?? 20, shift = 0;
    const ramp = ease([[-A, h0], [0, 0]], 160), loop = [];
    if (type === 'loop') {
      const R = H / 2;
      for (let i = 1; i <= 360; i++) { const th = 2 * Math.PI * i / 360; loop.push([R * Math.sin(th) + shift * i / 360, R * (1 - Math.cos(th))]); }
    } else {
      const ratio = p.ratio ?? 3, n = 720, L = 4 * Math.PI / (1 + ratio), ds = L / n, raw = [[0, 0]];   // unit shape: bottom curvature 1, top ratio; heading turns 2 pi
      let x = 0, y = 0, ph = 0, ymax = 0;
      for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, k = 1 + (ratio - 1) * Math.sin(Math.PI * u) ** 2; ph += k * ds / 2; x += Math.cos(ph) * ds; y += Math.sin(ph) * ds; ph += k * ds / 2; raw.push([x, y]); ymax = Math.max(ymax, y); }
      const k = H / ymax;
      raw.slice(1).forEach(([rx, ry], i) => loop.push([rx * k + shift * (i + 1) / n, ry * k]));
    }
    const xe = loop[loop.length - 1][0], pts = [...ramp, ...loop];
    for (let i = 1; i <= 8; i++) pts.push([xe + tail * i / 8, 0]);
    return pts;
  }
  throw new Error(`track-ride: unknown profile ${type}`);
}

// geometry per point: x, y, s (arc length), phi (angle), k (signed curvature, positive = bends upward-left of the motion)
export function buildTrack(profile, h0) {
  const raw = trackPoints(profile, h0), n = raw.length, P = raw.map(([x, y]) => ({ x, y, s: 0, phi: 0, k: 0 }));
  for (let i = 1; i < n; i++) P[i].s = P[i - 1].s + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    let ph = Math.atan2(b.y - a.y, b.x - a.x);
    while (ph - prev > Math.PI) ph -= 2 * Math.PI;
    while (ph - prev < -Math.PI) ph += 2 * Math.PI;
    P[i].phi = prev = ph;
  }
  const w = 5;
  for (let i = 0; i < n; i++) { const a = P[Math.max(0, i - w)], b = P[Math.min(n - 1, i + w)]; P[i].k = b.s > a.s ? (b.phi - a.phi) / (b.s - a.s) : 0; }
  return { P, L: P[n - 1].s, h0 };
}
export const trackAt = (T, sq) => {
  const P = T.P; sq = Math.max(0, Math.min(T.L, sq));
  let lo = 0, hi = P.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; P[m].s <= sq ? lo = m : hi = m; }
  const a = P[lo], b = P[hi], t = b.s > a.s ? (sq - a.s) / (b.s - a.s) : 0, l = k => a[k] + (b[k] - a[k]) * t;
  return { x: l('x'), y: l('y'), phi: l('phi'), k: l('k'), s: sq };
};
// state at distance sq: speed, felt g (N/mg), energy parts per unit mass
export function rideAt(T, sq, { f = 0, g = 9.8 } = {}) {
  const q = trackAt(T, sq), v2 = Math.max(0, 2 * g * (T.h0 - q.y - f * q.s)), v = Math.sqrt(v2);
  const felt = v2 * q.k / g + Math.cos(q.phi);
  return { ...q, v, felt, ke: v2 / 2, pe: g * q.y, lost: g * f * q.s, air: felt < 0 };
}
// farthest distance reached (first place where v^2 hits 0), and the felt-g samples along the ride
export function rideReach(T, { f = 0, g = 9.8 } = {}) {
  const P = T.P;
  for (let i = 1; i < P.length; i++) if (2 * g * (T.h0 - P[i].y - f * P[i].s) <= 0) return { reach: P[i - 1].s, stalled: true };
  return { reach: T.L, stalled: false };
}

// ---------- widget ----------
export function trackRide(el, cfg) {
  const Lb = { height: 'Height', speed: 'Speed', g: 'Felt g', ke: 'Motion energy', pe: 'Height energy', lost: 'Lost to friction', distance: 'Distance', play: 'Play', pause: 'Pause', reset: 'Reset',
    position: 'Position', startHeight: 'Start height', friction: 'Friction', gMeter: 'felt g', energy: 'energy', maxLine: 'start height', airtime: 'Airtime: the cart leaves the track',
    stalled: 'The cart stops here: not enough energy', low: 'low', high: 'high', gPlot: 'felt g along the track', ground: '', ...(cfg.labels ?? {}) };
  const U = { length: 'm', speed: 'm/s', energy: 'J/kg', ...(cfg.units ?? {}) };
  const g = cfg.g ?? 9.8, speedup = cfg.speedup ?? 1.5, tol = cfg.tolerance ?? null;
  const startProfile = normProfile(cfg.profile);
  const show = { track: true, ground: true, cart: true, handles: startProfile.type === 'points', maxLine: true, trace: false, normalArrow: true, weightArrow: true, gMeter: true,
    tolerance: false, gPlot: true, energyBar: true, labels: true, readouts: true, flag: true, positionSlider: true, heightSlider: false, frictionSlider: false, play: true,
    presets: true, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['speed', 'g'];
  const h0init = cfg.startHeight ?? startProfile.points?.[0]?.[1] ?? 40;
  const R = { height: [Math.round(h0init * 0.5), Math.round(h0init * 1.5), 1], friction: [0, 0.3, 0.005], ...(cfg.ranges ?? {}) };
  const init = { profile: startProfile, h0: h0init, f: cfg.friction ?? 0, pos: cfg.position ?? 0 };
  const st = { ...init, profile: JSON.parse(JSON.stringify(init.profile)), s: 0, playing: false };
  let T = null, reachInfo = null, view = null, gAxis = null, curve = null, gSeries = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // geometry (px)
  const W = 360, TH = 160, M = 14;
  const BX = 24, BW = W - 48;
  let yy = TH + 8;
  const gMeterY = show.gMeter ? (yy += 54) - 54 : 0;
  const energyY = show.energyBar ? (yy += 40) - 40 : 0;
  const gPlotY = show.gPlot ? (yy += 98) - 98 : 0;
  const Hh = yy + 2;
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fs-svg', role: 'img', 'aria-label': 'track' });

  function rebuild() {
    T = buildTrack(st.profile, st.h0);
    curve = null; reachInfo = null;
  }
  function setView() {   // fixed scale for the profile, from the highest release the sliders allow
    const hi = st.profile.type === 'points' ? Math.max(R.height[1], ...st.profile.points.map(p => p[1])) : R.height[1];
    const T2 = buildTrack(st.profile, hi);
    let x0 = 1e9, x1 = -1e9, y1 = 0;
    for (const p of T2.P) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    const sc = Math.min((W - 2 * M) / (x1 - x0), (TH - 2 * M - 8) / y1);
    view = { x0, sc, hiH: hi, ox: M + ((W - 2 * M) - (x1 - x0) * sc) / 2 };
    // felt-g axis from the full ride at the top release, no friction
    let lo = 0, up = 1;
    for (let i = 0; i < T2.P.length; i += 2) { const r = rideAt(T2, T2.P[i].s, { g }); lo = Math.min(lo, r.felt); up = Math.max(up, r.felt); }
    if (tol) { if (tol.high != null) up = Math.max(up, tol.high); if (tol.low != null) lo = Math.min(lo, tol.low); }
    gAxis = cfg.gRange ?? [clamp(Math.floor(lo - 0.3), -3, 0), clamp(Math.ceil(up + 0.3), 2, 12)];
  }
  const X = x => view.ox + (x - view.x0) * view.sc, Y = y => TH - M - y * view.sc;
  const pathD = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
  function ride() {
    if (!reachInfo) reachInfo = rideReach(T, { f: st.f, g });
    return reachInfo;
  }
  function series() {   // felt g samples up to the reach, for the plot
    const { reach } = ride(), out = [], n = 160;
    for (let i = 0; i <= n; i++) { const q = rideAt(T, reach * i / n, { f: st.f, g }); out.push([q.s, q.felt]); }
    return out;
  }
  const arrow = (g0, x0, y0, x1, y1, col, dash) => {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy); if (len < 2) return;
    const ux = dx / len, uy = dy / len, hs = Math.min(7, len * 0.5);
    g0.append(s('line', { x1: x0, y1: y0, x2: x1 - ux * hs * 0.6, y2: y1 - uy * hs * 0.6, stroke: col, 'stroke-width': 2.5, ...(dash ? { 'stroke-dasharray': '3 2' } : {}) }),
      s('path', { d: `M${x1},${y1} L${x1 - ux * hs - uy * hs * 0.5},${y1 - uy * hs + ux * hs * 0.5} L${x1 - ux * hs + uy * hs * 0.5},${y1 - uy * hs - ux * hs * 0.5} Z`, fill: col }));
  };

  function paint() {
    const { reach, stalled } = ride(), q = rideAt(T, Math.min(st.s, reach), { f: st.f, g });
    const g0 = s('g'), lab = (x, y, txt, o = {}) => g0.append(s('text', { x, y, 'font-size': 9.5, fill: 'var(--muted)', ...o }, txt));
    // --- track
    if (show.ground) g0.append(s('line', { x1: 6, y1: Y(0), x2: W - 6, y2: Y(0), stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.5 }));
    if (show.maxLine) {
      g0.append(s('line', { x1: 6, y1: Y(st.h0), x2: W - 6, y2: Y(st.h0), stroke: 'var(--covec)', 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }));
      if (show.labels) lab(W - 8, Y(st.h0) - 3, `${Lb.maxLine} ${num(st.h0, 0)} ${U.length}`, { 'text-anchor': 'end', fill: 'var(--covec)', 'font-weight': 650 });
    }
    if (show.track) {
      curve ??= pathD(T.P);
      g0.append(s('path', { d: curve, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      if (show.trace && st.s > 0) g0.append(s('path', { d: pathD(T.P.filter(p => p.s <= Math.min(st.s, reach)).concat([q])), fill: 'none', stroke: 'var(--vec)', 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    }
    if (show.handles && st.profile.type === 'points') st.profile.points.forEach((p, i) => g0.append(s('circle', { cx: X(p[0]), cy: Y(i ? p[1] : st.h0), r: 7, fill: 'var(--bg, #fff)', stroke: 'var(--basis)', 'stroke-width': 2.5, 'data-i': i, style: 'cursor:ns-resize;touch-action:none' })));
    // --- cart and arrows
    const cx = X(q.x), cy = Y(q.y), col = q.air ? 'var(--bad)' : 'var(--vec)';
    if (show.cart) {
      g0.append(s('g', { transform: `translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${(-q.phi * 180 / Math.PI).toFixed(1)})` },
        s('rect', { x: -9, y: -13, width: 18, height: 10, rx: 3, fill: col, stroke: 'var(--ink)', 'stroke-width': 1.2 }),
        s('circle', { cx: -5, cy: -3, r: 2.6, fill: 'var(--ink)' }), s('circle', { cx: 5, cy: -3, r: 2.6, fill: 'var(--ink)' })));
    }
    const cc = [cx - Math.sin(-q.phi) * 0, cy], mid = (() => { const nx = -Math.sin(q.phi), ny = Math.cos(q.phi); return [cx + nx * 8, cy - ny * 8]; })();   // centre of the cart body
    if (show.weightArrow) arrow(g0, mid[0], mid[1], mid[0], mid[1] + 15, 'var(--vec)');
    if (show.normalArrow) {
      const nx = -Math.sin(q.phi), ny = Math.cos(q.phi), len = clamp(q.felt * 15, -75, 75);
      arrow(g0, mid[0], mid[1], mid[0] + nx * len, mid[1] - ny * len, 'var(--covec)', q.felt < 0);
    }
    void cc;
    // --- g meter
    if (show.gMeter) {
      const by = gMeterY + 16, [a, b] = gAxis, gx = v => BX + (clamp(v, a, b) - a) / (b - a) * BW;
      if (show.tolerance && tol) {
        const band = (x0, x1) => g0.append(s('rect', { x: x0, y: by - 3, width: Math.max(0, x1 - x0), height: 22, fill: 'var(--bad)', opacity: 0.22 }));
        if (tol.high != null) { band(gx(tol.high), BX + BW); if (show.labels) lab(BX + BW, by + 41, `${Lb.high} ${num(tol.high, 1)} g`, { 'text-anchor': 'end', fill: 'var(--bad)', 'font-weight': 650 }); }
        if (tol.low != null) { band(BX, gx(tol.low)); if (show.labels) lab(BX, by + 41, `${Lb.low} ${num(tol.low, 1)} g`, { fill: 'var(--bad)', 'font-weight': 650 }); }
      }
      g0.append(s('rect', { x: BX, y: by, width: BW, height: 16, fill: 'none', stroke: 'var(--muted)' }),
        s('rect', { x: Math.min(gx(0), gx(q.felt)), y: by, width: Math.max(1, Math.abs(gx(q.felt) - gx(0))), height: 16, fill: q.air ? 'var(--bad)' : 'var(--covec)', opacity: 0.85 }),
        s('line', { x1: gx(0), y1: by - 3, x2: gx(0), y2: by + 19, stroke: 'var(--ink)', 'stroke-width': 1.5 }),
        s('line', { x1: gx(1), y1: by - 3, x2: gx(1), y2: by + 19, stroke: 'var(--ink)', 'stroke-width': 1, 'stroke-dasharray': '2 2' }));
      if (show.labels) {
        lab(BX, by - 6, `${Lb.gMeter} = ${num(q.felt, 1)} g`, { fill: 'var(--ink)', 'font-weight': 650 });
        for (const t of [a, 0, 1, b]) lab(gx(t), by + 29, num(t, 0), { 'text-anchor': 'middle', 'font-size': 8.5 });
      }
    }
    // --- energy bar (fractions of g h0)
    if (show.energyBar) {
      const by = energyY + 16, E = g * st.h0, f = v => Math.max(0, v / E) * BW;
      const parts = [['pe', q.pe, 'var(--vec)'], ['ke', q.ke, 'var(--covec)'], ['lost', q.lost, 'var(--muted)']];
      g0.append(s('rect', { x: BX, y: by, width: BW, height: 16, fill: 'none', stroke: 'var(--muted)' }));
      let x = BX;
      for (const [, v, c] of parts) { const w = Math.min(f(v), BX + BW - x); g0.append(s('rect', { x, y: by, width: w, height: 16, fill: c, opacity: 0.85 })); x += w; }
      if (show.labels) {
        lab(BX, by - 6, Lb.energy, { fill: 'var(--ink)', 'font-weight': 650 });
        let t = BX; const names = { pe: Lb.pe, ke: Lb.ke, lost: Lb.lost };
        for (const [k, v] of parts) { const w = f(v); if (w > 46) lab(t + w / 2, by + 12, names[k], { 'text-anchor': 'middle', fill: '#fff', 'font-weight': 650, 'font-size': 8.5 }); t += w; }
      }
    }
    // --- felt g against distance
    if (show.gPlot) {
      gSeries ??= series();
      const px0 = 34, px1 = W - 10, py0 = gPlotY + 14, py1 = gPlotY + 80, [a, b] = gAxis;
      const GX = v => px0 + v / T.L * (px1 - px0), GY = v => py1 - (clamp(v, a, b) - a) / (b - a) * (py1 - py0);
      if (show.tolerance && tol) {
        if (tol.high != null) g0.append(s('rect', { x: px0, y: py0, width: px1 - px0, height: GY(tol.high) - py0, fill: 'var(--bad)', opacity: 0.18 }));
        if (tol.low != null) g0.append(s('rect', { x: px0, y: GY(tol.low), width: px1 - px0, height: py1 - GY(tol.low), fill: 'var(--bad)', opacity: 0.18 }));
      }
      g0.append(s('line', { x1: px0, y1: py1, x2: px1, y2: py1, stroke: 'var(--muted)' }), s('line', { x1: px0, y1: py0, x2: px0, y2: py1, stroke: 'var(--muted)' }));
      for (const t of [0, 1]) g0.append(s('line', { x1: px0, y1: GY(t), x2: px1, y2: GY(t), stroke: 'var(--muted)', 'stroke-width': t ? 1 : 1.4, 'stroke-dasharray': t ? '3 3' : '' }));
      g0.append(s('path', { d: gSeries.map(([sv, v], i) => `${i ? 'L' : 'M'}${GX(sv).toFixed(1)},${GY(v).toFixed(1)}`).join(' '), fill: 'none', stroke: 'var(--covec)', 'stroke-width': 2 }));
      g0.append(s('circle', { cx: GX(Math.min(st.s, reach)), cy: GY(q.felt), r: 4, fill: q.air ? 'var(--bad)' : 'var(--ink)' }));
      if (show.labels) {
        lab(px0 - 4, GY(0) + 3, '0', { 'text-anchor': 'end' }); lab(px0 - 4, GY(1) + 3, '1', { 'text-anchor': 'end' });
        lab(px0 + 4, py0 - 4, Lb.gPlot, { fill: 'var(--ink)', 'font-weight': 650 });
      }
    }
    svg.append(g0);
    // --- readouts, flag, sliders
    const val = { height: `${num(q.y, 1)} ${U.length}`, speed: `${num(q.v, 1)} ${U.speed}`, g: `${num(q.felt, 1)} g`, ke: `${num(q.ke, 0)} ${U.energy}`, pe: `${num(q.pe, 0)} ${U.energy}`,
      lost: `${num(q.lost, 0)} ${U.energy}`, distance: `${num(q.s, 0)} ${U.length}` };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    if (flagEl) {
      const atStall = stalled && st.s >= reach - 1e-6;
      flagEl.textContent = q.air ? Lb.airtime : atStall ? Lb.stalled : '';
      flagEl.className = 'fs-lab' + (q.air || atStall ? ' c-bad' : '');
      flagEl.style.color = q.air || atStall ? 'var(--bad)' : '';
      flagEl.style.minHeight = '1.3em';
    }
    if (posInp) { posInp.max = String(Math.round(reach / T.L * 1000) / 1000); posInp.value = String(Math.min(st.s, reach) / T.L); }
    if (hInp) { hInp.value = st.h0; hVal.textContent = `${num(st.h0, 0)} ${U.length}`; }
    if (fInp) { fInp.value = st.f; fVal.textContent = num(st.f, 3); }
    if (playBtn) playBtn.textContent = st.playing ? Lb.pause : Lb.play;
  }

  // controls
  const rd = {};
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const flagEl = show.flag ? h('div', { class: 'fs-lab', role: 'status' }) : null;
  const slider = (label, min, max, step, onInput) => {
    const inp = h('input', { type: 'range', min, max, step, 'aria-label': label }), val = h('span', { class: 'fs-num' });
    inp.addEventListener('input', () => onInput(+inp.value));
    return [inp, val, h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(label)), inp, val)];
  };
  let posInp = null, hInp = null, hVal = null, fInp = null, fVal = null, playBtn = null;
  const sl = [];
  if (show.positionSlider) { const [i,, row] = slider(Lb.position, 0, 1, 0.001, v => { stop(); st.s = v * T.L; refresh(); }); posInp = i; sl.push(row); }
  if (show.heightSlider) { const [i, v, row] = slider(Lb.startHeight, R.height[0], R.height[1], R.height[2], v => { st.h0 = v; changed(); }); hInp = i; hVal = v; sl.push(row); }
  if (show.frictionSlider) { const [i, v, row] = slider(Lb.friction, R.friction[0], R.friction[1], R.friction[2], v => { st.f = v; changed(); }); fInp = i; fVal = v; sl.push(row); }
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const presets = show.presets ? cfg.presets ?? [] : [];
  const apply = pr => {
    stop();
    if (pr.profile != null) { st.profile = JSON.parse(JSON.stringify(normProfile(pr.profile))); if (pr.startHeight == null && st.profile.points) st.h0 = st.profile.points[0][1]; setView(); }
    if (pr.startHeight != null) st.h0 = pr.startHeight;
    if (pr.friction != null) st.f = pr.friction;
    changed(); st.s = (pr.position ?? 0) * T.L; refresh();
  };
  const btns = h('div', { class: 'wbtns' }, show.play ? (playBtn = btn(Lb.play, () => (st.playing ? stop() : play()))) : '', show.play ? btn(Lb.reset, () => { stop(); Object.assign(st, { h0: init.h0, f: init.f, profile: JSON.parse(JSON.stringify(init.profile)) }); setView(); changed(); st.s = init.pos * T.L; refresh(); }) : '',
    presets.map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', flagEl ?? '', sl.length ? h('div', { class: 'fs-sliders' }, sl.map(r => r)) : '', btns);

  function changed() { rebuild(); gSeries = null; st.s = Math.min(st.s, T.L); refresh(); }
  function refresh() { svg.replaceChildren(); paint(); }

  // playback
  let raf = 0, last = 0;
  function stop() { st.playing = false; cancelAnimationFrame(raf); }
  function play() {
    const { reach } = ride();
    if (st.s >= reach - 1e-6) st.s = 0;
    st.playing = true; last = performance.now();
    const tick = now => {
      if (!el.isConnected) return;
      let dt = Math.min(0.05, (now - last) / 1000) * speedup; last = now;
      const { reach: rc } = ride();
      for (let k = 0; k < 4; k++) { const v = Math.max(rideAt(T, st.s, { f: st.f, g }).v, 1.2); st.s = Math.min(rc, st.s + v * dt / 4); }
      if (st.s >= rc - 1e-6) { st.s = rc; st.playing = false; }
      refresh();
      if (st.playing) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  // dragging control points (vertical only)
  let drag = -1;
  const toY = ev => { const r = svg.getBoundingClientRect(), vy = (ev.clientY - r.top) / r.height * Hh; return clamp((TH - M - vy) / view.sc, 0, view.hiH); };
  svg.addEventListener('pointerdown', ev => { const i = ev.target?.getAttribute?.('data-i'); if (i == null || !show.handles) return; drag = +i; stop(); svg.setPointerCapture?.(ev.pointerId); ev.preventDefault(); });
  svg.addEventListener('pointermove', ev => {
    if (drag < 0) return;
    const y = toY(ev); st.profile.points[drag][1] = y; if (drag === 0) st.h0 = y;
    changed();
  });
  const up = () => { drag = -1; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);

  setView(); rebuild(); st.s = init.pos * T.L; refresh();
}
