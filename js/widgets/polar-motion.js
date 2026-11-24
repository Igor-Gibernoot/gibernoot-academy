// polar-motion
//
// A particle moves in the plane with polar coordinates r(t) (distance from O) and phi(t) (angle up from the x axis, Taylor's symbol).
// The path is built from constant second derivatives, so one model covers every case:
//   r(t)   = r0 + rd0 t + rdd t^2 / 2          (r0 start distance, rd0 start radial speed, rdd = r-double-dot)
//   phi(t) = phi0 + w0 t + alpha t^2 / 2       (phi0 in degrees, w0 = start phi-dot in rad/s, alpha = phi-double-dot in rad/s^2)
// Circle at steady speed: rd0 = rdd = 0, alpha = 0.  Spiral: rd0 != 0, w0 != 0.  Radial line: w0 = alpha = 0.
// Unit vectors: r-hat = (cos phi, sin phi) points the way r grows, phi-hat = (-sin phi, cos phi) the way phi grows. They turn as the particle moves.
//   velocity      v = rd r-hat + r phid phi-hat           (v_r = rd, v_phi = r phid)
//   acceleration  a = (rdd - r phid^2) r-hat + (r phidd + 2 rd phid) phi-hat
// The four acceleration terms: rdd (radial), -r phid^2 (radial, "centripetal"), r phidd (angular), 2 rd phid (angular).
// Keep r > 0 over the window tmax (the drawing does not handle r < 0).
// Fully general: no course text is hard-coded; every word comes from the config.
//
//   r0: 2, rd0: 0, rdd: 0, phi0: 0, w0: 1, alpha: 0   start values (see above)
//   tmax: 6, duration: 6000                            time window shown (s) and the animation time of one run (ms)
//   sliders: ['r0','rd0','rdd','phi0','w0','alpha']    which sliders to show, in order; default none
//   ranges: { r0: [0.5,3,0.1], rd0: [-1,2,0.1], rdd: [-1,1,0.1], phi0: [0,360,5], w0: [-3,3,0.1], alpha: [-2,2,0.1] }   [min, max, step]
//   scale: px per unit length, vscale, ascale: px per unit speed / acceleration (default: automatic from the start values and the presets:
//        the largest r fills the frame, the longest v and a are about 70 px); unitLength: 40 (px, r-hat and phi-hat)
//   units: { length: 'm', time: 's' }                  speed and acceleration units are built from these
//   terms: { rdd: true, cent: true, phidd: true, cor: true }   initial state of the four acceleration-term arrows
//   toggles: ['rdd','cent','phidd','cor']              which term checkboxes the reader gets (any of those four); default none
//   show: { axes, origin, fullPath, trail, position, arc, unit, velocity, vComps, accel, aComps, termArrows, labels, readouts, replay, scrub, particle }
//       all default true except aComps, vComps, position (the line from O to the particle), arc (the angle phi), scrub (time slider);
//       fullPath = faint whole path, trail = path so far, unit = r-hat and phi-hat, velocity = v arrow, vComps = dashed v_r and v_phi,
//       accel = total a arrow, aComps = dashed a_r and a_phi, termArrows = the arrows of the four terms (each also needs its flag in terms),
//       axes = x and y axes, origin = the O dot, labels = letters on arrows, readouts = the readout cells, replay = Play button.
//   readouts: ['r','phi','vr','vphi','ar','aphi']      any of r, phi, rd, phid, vr, vphi, speed, ar, aphi, rdd, cent, phidd, cor, acc (at the time marker)
//   presets: [{ label, r0, rd0, rdd, phi0, w0, alpha }]   buttons; only the fields given change
//   labels: { r, phi, rd, phid, vr, vphi, speed, ar, aphi, rdd, cent, phidd, cor, acc (readouts, checkboxes; markdown/math allowed), r0, rd0, rddS, phi0, w0, alpha, play, reset, scene, time,
//             rhat, phihat, v, a, termRdd, termCent, termPhidd, termCor }
//             fvr, fvphi, far, faphi }
//       (readout, checkbox and slider names (rddS = the r-double-dot slider) and button words; the letters drawn in the picture are plain text:
//        rhat, phihat, v, a, term... on the arrows, fvr, fvphi, far, faphi on the dashed components; 'x_y' draws y as a subscript)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };

// Pure model, exported for script checks. phi0 in degrees. Returns the state at time t.
export function polarModel({ r0 = 2, rd0 = 0, rdd = 0, phi0 = 0, w0 = 1, alpha = 0 } = {}) {
  const ph0 = phi0 * Math.PI / 180;
  const at = t => {
    const r = r0 + rd0 * t + 0.5 * rdd * t * t, rd = rd0 + rdd * t;
    const phi = ph0 + w0 * t + 0.5 * alpha * t * t, phid = w0 + alpha * t;
    const cent = -r * phid * phid, phidd = r * alpha, cor = 2 * rd * phid;
    const vr = rd, vphi = r * phid, ar = rdd + cent, aphi = phidd + cor;
    const c = Math.cos(phi), sn = Math.sin(phi);
    return { t, r, rd, rdd, phi, phid, vr, vphi, speed: Math.hypot(vr, vphi), ar, aphi, acc: Math.hypot(ar, aphi), cent, phidd, cor,
      x: r * c, y: r * sn, vx: vr * c - vphi * sn, vy: vr * sn + vphi * c, ax: ar * c - aphi * sn, ay: ar * sn + aphi * c };
  };
  return { at };
}

export function polarMotion(el, cfg) {
  const Lb = { r: '$r$', phi: '$\\varphi$', rd: '$\\dot r$', phid: '$\\dot\\varphi$', vr: '$v_r$', vphi: '$v_\\varphi$', speed: 'Speed', ar: '$a_r$', aphi: '$a_\\varphi$', rdd: '$\\ddot r$',
    cent: '$-r\\dot\\varphi^2$', phidd: '$r\\ddot\\varphi$', cor: '$2\\dot r\\dot\\varphi$', acc: 'Acceleration', r0: 'Start $r$', rd0: 'Start $\\dot r$', rddS: '$\\ddot r$',
    phi0: 'Start $\\varphi$', w0: 'Start $\\dot\\varphi$', alpha: '$\\ddot\\varphi$', play: 'Play', reset: 'Reset', scene: 'A particle in polar coordinates', time: 'Time',
    rhat: 'r̂', phihat: 'φ̂', v: 'v', fvr: 'v_r', fvphi: 'v_φ', a: 'a', far: 'a_r', faphi: 'a_φ', termRdd: 'r̈', termCent: '−rφ̇²', termPhidd: 'rφ̈', termCor: '2ṙφ̇', ...(cfg.labels ?? {}) };
  const show = { axes: true, origin: true, fullPath: true, trail: true, position: false, arc: false, unit: true, velocity: true, vComps: false, accel: true, aComps: false, termArrows: true,
    labels: true, readouts: true, replay: true, scrub: false, particle: true, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['r', 'phi', 'vr', 'vphi', 'ar', 'aphi'];
  const U = { length: 'm', time: 's', ...(cfg.units ?? {}) };
  const unitOf = { r: U.length, phi: 'rad', rd: `${U.length}/${U.time}`, phid: `rad/${U.time}`, vr: `${U.length}/${U.time}`, vphi: `${U.length}/${U.time}`, speed: `${U.length}/${U.time}` };
  for (const k of ['ar', 'aphi', 'rdd', 'cent', 'phidd', 'cor', 'acc']) unitOf[k] = `${U.length}/${U.time}²`;
  const R = { r0: [0.5, 3, 0.1], rd0: [-1, 2, 0.1], rdd: [-1, 1, 0.1], phi0: [0, 360, 5], w0: [-3, 3, 0.1], alpha: [-2, 2, 0.1], ...(cfg.ranges ?? {}) };
  const tmax = cfg.tmax ?? 6, duration = cfg.duration ?? 6000, unitLen = cfg.unitLength ?? 40;
  const init = { r0: cfg.r0 ?? 2, rd0: cfg.rd0 ?? 0, rdd: cfg.rdd ?? 0, phi0: cfg.phi0 ?? 0, w0: cfg.w0 ?? 1, alpha: cfg.alpha ?? 0 };
  const st = { ...init };
  const sliderKeys = cfg.sliders ?? [];
  const terms = { rdd: true, cent: true, phidd: true, cor: true, ...(cfg.terms ?? {}) };
  const toggleKeys = cfg.toggles ?? [];

  // Fixed scales from the start values and the presets (a slider pushed further may run off the drawing, which is clipped).
  const cases = [init, ...(cfg.presets ?? []).map(p => ({ ...init, ...p }))];
  let rMax = 0.1, vMax = 0.01, aMax = 0.01;
  for (const c of cases) { const m = polarModel(c); for (let i = 0; i <= 40; i++) { const q = m.at(tmax * i / 40); rMax = Math.max(rMax, Math.abs(q.r)); vMax = Math.max(vMax, q.speed); aMax = Math.max(aMax, q.acc); } }
  const half = 150, W = 360, cx = W / 2, cy = W / 2;
  const sc = cfg.scale ?? half / (rMax * 1.08), kv = cfg.vscale ?? 70 / vMax, ka = cfg.ascale ?? 70 / aMax;
  const svg = s('svg', { viewBox: `0 0 ${W} ${W}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.scene });
  let tNow = 0, raf = 0, t0 = 0;

  const col = { unit: 'var(--basis)', vel: 'var(--vec)', acc: 'var(--covec)', pos: 'var(--muted)' };
  const P = (x, y) => [cx + x * sc, cy - y * sc];

  const tspans = txt => { const [b, sub] = String(txt).split('_'); return sub ? [b, s('tspan', { 'font-size': 8, dy: 3 }, sub)] : [b]; };
  function arrow(g0, x1, y1, x2, y2, color, txt, dash, dx = 0, dy = 0, w = 3) {
    const ddx = x2 - x1, ddy = y2 - y1, L = Math.hypot(ddx, ddy); if (L < 3) return;
    const ux = ddx / L, uy = ddy / L, ww = dash ? 1.8 : w;
    g0.append(s('line', { x1, y1, x2: x2 - ux * 5, y2: y2 - uy * 5, stroke: color, 'stroke-width': ww, 'stroke-linecap': 'round', ...(dash ? { 'stroke-dasharray': '4 3' } : {}) }),
      s('polygon', { fill: color, points: `${x2},${y2} ${x2 - ux * 8 - uy * 4},${y2 - uy * 8 + ux * 4} ${x2 - ux * 8 + uy * 4},${y2 - uy * 8 - ux * 4}` }));
    if (show.labels && txt) g0.append(s('text', { x: x2 + dx, y: y2 + dy, 'font-size': 11, 'text-anchor': dx < 0 ? 'end' : dx > 0 ? 'start' : 'middle', fill: color, 'font-weight': 650 }, ...tspans(txt)));
  }

  function paint() {
    const M = polarModel(st), q = M.at(tNow), g0 = s('g');
    const c = Math.cos(q.phi), sn = Math.sin(q.phi), rh = [c, -sn], ph = [-sn, -c];       // screen directions (y down) of r-hat, phi-hat
    const [px, py] = P(q.x, q.y);
    if (show.axes) g0.append(s('line', { x1: 8, y1: cy, x2: W - 8, y2: cy, stroke: 'var(--line, #ccc)', 'stroke-width': 1 }), s('line', { x1: cx, y1: 8, x2: cx, y2: W - 8, stroke: 'var(--line, #ccc)', 'stroke-width': 1 }));
    const pathD = (t1) => { const n = Math.max(2, Math.ceil(80 * t1 / tmax)), pts = []; for (let i = 0; i <= n; i++) { const p = M.at(t1 * i / n), [a, b] = P(p.x, p.y); pts.push(`${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`); } return pts.join(' '); };
    if (show.fullPath) g0.append(s('path', { d: pathD(tmax), fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1.2, 'stroke-dasharray': '2 4', opacity: 0.8 }));
    if (show.trail && tNow > 0) g0.append(s('path', { d: pathD(tNow), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, opacity: 0.7 }));
    if (show.origin) g0.append(s('circle', { cx, cy, r: 3.5, fill: 'var(--ink)' }), ...(show.labels ? [s('text', { x: cx - 6, y: cy + 14, 'font-size': 10, fill: 'var(--muted)', 'text-anchor': 'end' }, 'O')] : []));
    if (show.position) g0.append(s('line', { x1: cx, y1: cy, x2: px, y2: py, stroke: col.pos, 'stroke-width': 1.5 }));
    if (show.arc) {
      const r = 26, a2 = [cx + r * Math.cos(q.phi), cy - r * Math.sin(q.phi)], ph0 = ((q.phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      g0.append(s('path', { d: `M${cx + r} ${cy} A${r} ${r} 0 ${ph0 > Math.PI ? 1 : 0} 0 ${a2[0].toFixed(1)} ${a2[1].toFixed(1)}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.2 }));
      if (show.labels) g0.append(s('text', { x: cx + r + 6, y: cy - 6, 'font-size': 11, fill: 'var(--ink)' }, 'φ'));
    }
    const A = (ox, oy, vx, vy, len, color, txt, dash, dx, dy, w) => { const x2 = ox + vx * len, y2 = oy + vy * len; arrow(g0, ox, oy, x2, y2, color, txt, dash, dx, dy, w); return [x2, y2]; };
    // vectors in physical components (x right, y up) -> screen
    const S = (vx, vy, k) => [vx * k, -vy * k];
    if (show.unit) {
      A(px, py, rh[0], rh[1], unitLen, col.unit, Lb.rhat, false, rh[0] * 10, rh[1] * 10 + 4, 2.5);
      A(px, py, ph[0], ph[1], unitLen, col.unit, Lb.phihat, false, ph[0] * 10, ph[1] * 10 + 4, 2.5);
    }
    if (show.vComps) {
      A(px, py, rh[0], rh[1], q.vr * kv, col.vel, Lb.fvr, true, rh[0] * 6, rh[1] * 6 + 10);
      A(px, py, ph[0], ph[1], q.vphi * kv, col.vel, Lb.fvphi, true, ph[0] * 6, ph[1] * 6 + 10);
    }
    if (show.velocity) { const [dx, dy] = S(q.vx, q.vy, kv); arrow(g0, px, py, px + dx, py + dy, col.vel, Lb.v, false, dx >= 0 ? 6 : -6, dy >= 0 ? 12 : -4); }
    if (show.aComps) {
      A(px, py, rh[0], rh[1], q.ar * ka, col.acc, Lb.far, true, rh[0] * 6, rh[1] * 6 + 10);
      A(px, py, ph[0], ph[1], q.aphi * ka, col.acc, Lb.faphi, true, ph[0] * 6, ph[1] * 6 + 10);
    }
    if (show.accel) { const [dx, dy] = S(q.ax, q.ay, ka); arrow(g0, px, py, px + dx, py + dy, col.acc, Lb.a, false, dx >= 0 ? 6 : -6, dy >= 0 ? 12 : -4, 3.5); }
    if (show.termArrows) {
      // radial terms stacked head to tail along r-hat, angular terms along phi-hat; each stack sits a few px to the side
      const stack = (dir, side, items) => { let ox = px + side[0] * 7, oy = py + side[1] * 7;
        for (const [on, val, txt] of items) if (on) { [ox, oy] = A(ox, oy, dir[0], dir[1], val * ka, col.acc, txt, false, side[0] * 8, side[1] * 8 + 4, 2); } };
      stack(rh, ph, [[terms.rdd, q.rdd, Lb.termRdd], [terms.cent, q.cent, Lb.termCent]]);
      stack(ph, rh, [[terms.phidd, q.phidd, Lb.termPhidd], [terms.cor, q.cor, Lb.termCor]]);
    }
    if (show.particle) g0.append(s('circle', { cx: px, cy: py, r: 6, fill: 'var(--ink)', stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 }));
    svg.append(g0);

    for (const key of reads) if (rd[key]) rd[key].textContent = `${num(key === 'phi' ? q.phi * 180 / Math.PI : q[key], 2)} ${key === 'phi' ? '°' : unitOf[key] ?? ''}`.trim();
    for (const [key, inp] of Object.entries(inps)) { inp.value = st[key]; vals[key].textContent = num(st[key], key === 'phi0' ? 0 : 2); }
    if (scrub) { scrub.value = tNow; scrubVal.textContent = `${num(tNow, 1)} ${U.time}`; }
    for (const [k, cb] of Object.entries(cbs)) cb.checked = terms[k];
  }

  // controls
  const rd = {}, inps = {}, vals = {}, cbs = {};
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab', html: mdInline(Lb[k] ?? k) }), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const sliderEls = sliderKeys.map(k => {
    const [lo, hi, step] = R[k], name = k === 'rdd' ? Lb.rddS : Lb[k];
    const inp = inps[k] = h('input', { type: 'range', min: lo, max: hi, step, value: st[k], 'aria-label': name });
    inp.addEventListener('input', () => { st[k] = +inp.value; play(); });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab', html: mdInline(name) }), inp, vals[k] = h('span', { class: 'fs-num' }));
  });
  const names = { rdd: Lb.rdd, cent: Lb.cent, phidd: Lb.phidd, cor: Lb.cor };
  const toggleEls = toggleKeys.map(k => h('label', { class: 'fs-lab', style: 'display:inline-flex;gap:6px;align-items:center;margin-right:14px' }, cbs[k] = h('input', { type: 'checkbox', checked: terms[k], onchange: e => { terms[k] = e.target.checked; redraw(); } }), h('span', { html: mdInline(names[k]) })));
  let scrub = null, scrubVal = null;
  if (show.scrub) { scrub = h('input', { type: 'range', min: 0, max: tmax, step: tmax / 200, value: 0, 'aria-label': Lb.time }); scrub.addEventListener('input', () => { cancelAnimationFrame(raf); tNow = +scrub.value; redraw(); }); }
  const scrubEl = scrub ? h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab', html: mdInline(Lb.time) }), scrub, scrubVal = h('span', { class: 'fs-num' })) : '';
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn, html: mdInline(txt) });
  const apply = p => { for (const k of Object.keys(init)) if (p[k] != null) st[k] = p[k]; play(); };
  const btns = h('div', { class: 'wbtns' }, show.replay ? btn(Lb.play, () => play()) : '', btn(Lb.reset, () => { Object.assign(st, init); play(); }), (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', toggleEls.length ? h('div', { class: 'fs-sliders', style: 'display:flex;flex-wrap:wrap' }, toggleEls) : '',
    sliderEls.length || scrub ? h('div', { class: 'fs-sliders' }, sliderEls, scrubEl) : '', btns);

  function redraw() { svg.replaceChildren(); paint(); }
  function play() {
    cancelAnimationFrame(raf); tNow = 0; t0 = performance.now(); redraw();
    const tick = now => {
      if (!el.isConnected) return;
      tNow = Math.max(0, Math.min(tmax, (now - t0) / duration * tmax)); redraw();
      if (tNow < tmax) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  play();
}
