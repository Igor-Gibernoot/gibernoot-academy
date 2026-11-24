// two-body-push
//
// Two bodies (masses m1, m2) at rest are pushed by a short force pulse F(t) of total impulse J = integral of F dt.
//   body 1 feels  F1 =  F(t) (+ the external force Fext, if any)
//   body 2 feels  F2 = -r F(t)   with r = 1 when the third law holds (equal and opposite), r = ratio (default 0.5) when it is broken
// so  p1' = F1,  p2' = F2,  and the total P = p1 + p2 obeys  P' = F1 + F2 = (1 - r) F(t) + Fext.
// Third law on and no external force: P stays 0 (p1 = J, p2 = -J). Law broken: P drifts to (1 - r) J. External force: P' = Fext.
// Body 1 is drawn on the right and body 2 on the left, so the positive pulse pushes them apart.
// Fully general: no course text is hard-coded; every word comes from the config.
//
//   m1: 1, m2: 3, J: 2, T: 0.5, ext: 0     start values (masses in massUnit, impulse in impulseUnit, pulse length T and window in s, ext = constant force on body 1)
//   lawOn: true                            start state of the third-law switch (false = broken)
//   ratio: 0.5                             r used when the law is broken
//   pulse: 'sine'                          'sine' (half-sine) or 'rect' (constant force during T)
//   tmax: 2                                time window shown (s)
//   sliders: ['m1','m2','J']               which sliders to show, in order (any of m1, m2, J, ext, ratio, T); default none
//   ranges: { m1: [0.5,5,0.5], m2: [0.5,5,0.5], J: [0,4,0.5], ext: [-2,2,0.5], ratio: [0,2,0.1], T: [0.1,1,0.1] }   [min, max, step]
//   lawToggle: false                       true = two buttons, law holds / law broken
//   duration: 3500                         animation time of one run (ms), whatever the real time
//   units: { mass: 'kg', impulse: 'N s', momentum: 'kg m/s', force: 'N', speed: 'm/s' }
//   show: { bodies, arrows, forcePlot, p1, p2, total, readouts, labels, replay, grid, extArrow, cursor }
//       all default true except grid (false). bodies = the track with the two blocks; arrows = force arrows on the blocks;
//       forcePlot = plot of F1(t) and F2(t); p1, p2, total = the curves p1(t), p2(t), P(t) of the momentum plot (all three false
//       hides that plot); extArrow = the arrow of the external force; cursor = the time marker on the plots;
//       labels = letters on arrows and curves and the axis names; grid = plot grid; replay = the Play button.
//   readouts: ['p1','p2','P']              any of p1, p2, P, v1, v2, vcm, J (default p1, p2, P); values at the time marker
//   presets: [{ label, m1, m2, J, T, ext, ratio, lawOn }]   buttons; only the fields given change
//   labels: { p1, p2, P, v1, v2, vcm, J, F1, F2, force, momentum, time, m1, m2, J, ext, ratio, T, lawOn, lawOff, play, reset, track,
//             body1, body2, extForce }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => { const x = Number((+v).toFixed(d)); return String(Object.is(x, -0) ? 0 : x); };

// Pure model, exported for script checks. Returns the force pulse and the momenta at time t, and the trajectory on a grid.
export function pushModel({ m1 = 1, m2 = 3, J = 2, T = 0.5, ext = 0, lawOn = true, ratio = 0.5, pulse = 'sine', tmax = 2, steps = 400 } = {}) {
  const r = lawOn ? 1 : ratio;
  const F0 = pulse === 'rect' ? J / T : J * Math.PI / (2 * T);                  // peak of the pulse
  const F = t => (t < 0 || t > T) ? 0 : pulse === 'rect' ? F0 : F0 * Math.sin(Math.PI * t / T);
  const I = t => { const u = Math.min(Math.max(t, 0), T); return pulse === 'rect' ? F0 * u : F0 * T / Math.PI * (1 - Math.cos(Math.PI * u / T)); };  // integral of F up to t
  const at = t => {
    const f = F(t), F1 = f + ext, F2 = -r * f, p1 = I(t) + ext * t, p2 = -r * I(t);
    return { t, F: f, F1, F2, p1, p2, P: p1 + p2, v1: p1 / m1, v2: p2 / m2, vcm: (p1 + p2) / (m1 + m2) };
  };
  const ts = [], rows = [];
  let x1 = 0, x2 = 0, prev = null;
  for (let i = 0; i <= steps; i++) {
    const row = at(tmax * i / steps);
    if (prev) { const dt = row.t - prev.t; x1 += 0.5 * (row.v1 + prev.v1) * dt; x2 += 0.5 * (row.v2 + prev.v2) * dt; }
    rows.push({ ...row, x1, x2 }); ts.push(row.t); prev = row;
  }
  return { r, F0, at, rows, final: rows[rows.length - 1], Pfinal: at(tmax).P };
}

export function twoBodyPush(el, cfg) {
  const Lb = { p1: 'p₁', p2: 'p₂', P: 'P = p₁ + p₂', v1: 'v₁', v2: 'v₂', vcm: 'Center-of-mass speed', J: 'Impulse J', F1: 'F₁', F2: 'F₂', force: 'Force', momentum: 'Momentum', time: 'time',
    m1: 'Mass m₁', m2: 'Mass m₂', ext: 'External force', ratio: 'Force on 2 / force on 1', T: 'Pulse length', lawOn: 'Third law holds', lawOff: 'Third law broken', play: 'Play', reset: 'Reset',
    track: 'Two bodies pushing each other', body1: '1', body2: '2', extForce: 'F_ext', ...(cfg.labels ?? {}) };
  const show = { bodies: true, arrows: true, forcePlot: true, p1: true, p2: true, total: true, readouts: true, labels: true, replay: true, grid: false, extArrow: true, cursor: true, ...(cfg.show ?? {}) };
  const reads = cfg.readouts ?? ['p1', 'p2', 'P'];
  const U = { mass: 'kg', impulse: 'N s', momentum: 'kg m/s', force: 'N', speed: 'm/s', ...(cfg.units ?? {}) };
  const R = { m1: [0.5, 5, 0.5], m2: [0.5, 5, 0.5], J: [0, 4, 0.5], ext: [-2, 2, 0.5], ratio: [0, 2, 0.1], T: [0.1, 1, 0.1], ...(cfg.ranges ?? {}) };
  const tmax = cfg.tmax ?? 2, duration = cfg.duration ?? 3500, pulse = cfg.pulse ?? 'sine', ratioBroken = cfg.ratio ?? 0.5;
  const init = { m1: cfg.m1 ?? 1, m2: cfg.m2 ?? 3, J: cfg.J ?? 2, T: cfg.T ?? 0.5, ext: cfg.ext ?? 0, ratio: ratioBroken, lawOn: cfg.lawOn !== false };
  const st = { ...init };
  const sliderKeys = cfg.sliders ?? [];
  const model = q => pushModel({ ...q, pulse, tmax });

  // Fixed scales from the largest values the controls can reach, so axes do not jump while sliders move.
  const cases = [init, ...(cfg.presets ?? []).map(p => ({ ...init, ...p }))];
  const maxOf = k => Math.max(...cases.map(q => Math.abs(q[k])), ...(sliderKeys.includes(k) ? [Math.abs(R[k][0]), Math.abs(R[k][1])] : [0]));
  const Jm = maxOf('J'), em = maxOf('ext'), rm = Math.max(1, maxOf('ratio'));
  const Tmin = Math.min(...cases.map(q => q.T), ...(sliderKeys.includes('T') ? [R.T[0]] : []));
  const Fm = (pulse === 'rect' ? 1 : Math.PI / 2) * Jm / Tmin + em;       // largest force
  const Pm = Math.max(1e-6, Math.max(Jm + em * tmax, rm * Jm));  // largest |momentum| of any curve
  const mmin = Math.min(...cases.flatMap(q => [q.m1, q.m2]), ...['m1', 'm2'].filter(k => sliderKeys.includes(k)).map(k => R[k][0]));
  const vmaxBody = (Jm * Math.max(1, rm) + em * tmax) / mmin;
  const xext = cfg.xMax ?? Math.max(1.5, Math.min(vmaxBody * tmax * 0.8, 6));
  const bandP = Pm;

  // geometry (px)
  const W = 360, TY = 66, TH = 34, PL = 40, PR = 340, PH = 84;
  const bodiesH = show.bodies ? 96 : 0;
  const hasMomPlot = show.p1 || show.p2 || show.total;
  let y = bodiesH;
  const yForce = show.forcePlot ? (y += 22) : 0; if (show.forcePlot) y += PH + 18;
  const yMom = hasMomPlot ? (y += 22) : 0; if (hasMomPlot) y += PH + 20;
  const H = Math.max(y + 4, 20);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.track });
  let tNow = 0, raf = 0, t0 = 0;

  const xT = t => PL + t / tmax * (PR - PL);
  const col = { b1: 'var(--vec)', b2: 'var(--covec)', tot: 'var(--basis)' };

  function plot(top, ymax, curves, ylab, fmtMax) {
    const pg = s('g'), mid = top + PH / 2, yv = v => mid - Math.max(-1, Math.min(1, v / ymax)) * PH / 2;
    if (show.grid) for (const f of [-1, -0.5, 0.5, 1]) pg.append(s('line', { x1: PL, x2: PR, y1: mid - f * PH / 2, y2: mid - f * PH / 2, stroke: 'var(--line, #ccc)', 'stroke-width': 0.7 }));
    pg.append(s('line', { x1: PL, y1: top, x2: PL, y2: top + PH, stroke: 'var(--ink)', 'stroke-width': 1.2 }), s('line', { x1: PL, y1: mid, x2: PR, y2: mid, stroke: 'var(--ink)', 'stroke-width': 1.2 }));
    pg.append(s('text', { x: PL - 4, y: top + 4, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, fmtMax), s('text', { x: PL - 4, y: top + PH + 3, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, '−' + fmtMax), s('text', { x: PL - 4, y: mid + 3, 'font-size': 9, 'text-anchor': 'end', fill: 'var(--muted)' }, '0'));
    if (show.labels) pg.append(s('text', { x: PL + 3, y: top - 5, 'font-size': 9.5, fill: 'var(--muted)' }, ylab), s('text', { x: PR, y: top + PH + 12, 'font-size': 9.5, 'text-anchor': 'end', fill: 'var(--muted)' }, `${Lb.time} (s)`));
    for (const c of curves) {
      const d = c.pts.map((v, i) => `${i ? 'L' : 'M'}${xT(tmax * i / (c.pts.length - 1)).toFixed(1)} ${yv(v).toFixed(1)}`).join(' ');
      pg.append(s('path', { d, fill: 'none', stroke: c.color, 'stroke-width': c.w ?? 2.4, 'stroke-dasharray': c.dash ?? '' }));
      if (show.labels && c.label) { const lastV = c.pts[Math.round(c.pts.length * 0.93)]; pg.append(s('text', { x: PR - 2, y: Math.max(top + 9, Math.min(top + PH - 2, yv(lastV) + (c.dy ?? -4))), 'font-size': 10, 'text-anchor': 'end', fill: c.color, 'font-weight': 650 }, c.label)); }
      if (show.cursor) { const v = c.pts[Math.round(tNow / tmax * (c.pts.length - 1))]; pg.append(s('circle', { cx: xT(tNow), cy: yv(v), r: 4, fill: c.color, stroke: 'var(--bg, #fff)', 'stroke-width': 1.5 })); }
    }
    if (show.cursor) pg.append(s('line', { x1: xT(tNow), x2: xT(tNow), y1: top, y2: top + PH, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }));
    return pg;
  }

  function arrow(g, x1, y1, x2, y2, color, txt, tx, ty, anchor) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); if (L < 2) return;
    const ux = dx / L, uy = dy / L;
    g.append(s('line', { x1, y1, x2: x2 - ux * 6, y2: y2 - uy * 6, stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }),
      s('polygon', { fill: color, points: `${x2},${y2} ${x2 - ux * 8 - uy * 4},${y2 - uy * 8 + ux * 4} ${x2 - ux * 8 + uy * 4},${y2 - uy * 8 - ux * 4}` }));
    if (show.labels && txt) g.append(s('text', { x: tx, y: ty, 'font-size': 10, 'text-anchor': anchor, fill: color, 'font-weight': 650 }, txt));
  }

  function paint() {
    const M = model(st), now = M.at(tNow), idx = Math.round(tNow / tmax * (M.rows.length - 1)), row = M.rows[idx];
    if (show.bodies) {
      const g0 = s('g'), cx = W / 2, sc = 140 / (1 + xext), bw = bx => 22 + 6 * Math.cbrt(bx);
      const base = TY + TH + 2;
      g0.append(s('line', { x1: 14, y1: base, x2: W - 14, y2: base, stroke: 'var(--muted)', 'stroke-width': 3 }));
      g0.append(s('line', { x1: cx, y1: base, x2: cx, y2: base + 6, stroke: 'var(--muted)', 'stroke-width': 1 }));
      const p1x = cx + (1 + row.x1) * sc, p2x = cx + (-1 + row.x2) * sc;   // body 1 starts right of the centre, body 2 left
      const draw = (xc, m, color, label) => {
        const w = bw(m), hgt = 14 + 7 * Math.cbrt(m);
        g0.append(s('rect', { x: xc - w / 2, y: base - hgt, width: w, height: hgt, rx: 3, fill: color, opacity: 0.92 }));
        if (show.labels) g0.append(s('text', { x: xc, y: base - hgt / 2 + 4, 'font-size': 11, 'text-anchor': 'middle', fill: '#fff', 'font-weight': 700 }, label));
        return [xc, hgt];
      };
      const [c1, h1] = draw(p1x, st.m1, col.b1, `${Lb.body1}`);
      const [c2, h2] = draw(p2x, st.m2, col.b2, `${Lb.body2}`);
      if (show.arrows) {
        const k = 44 / Fm, ay1 = base - h1 / 2, ay2 = base - h2 / 2;
        const pf = Math.max(0, row.F);
        if (pf > 1e-9) {
          arrow(g0, c1 + 12, ay1, c1 + 12 + 4 + pf * k, ay1, col.b1, Lb.F1, c1 + 12 + 4 + pf * k, ay1 - 8, 'end');
          const f2 = M.r * pf * k;
          if (f2 > 1e-9) arrow(g0, c2 - 12, ay2, c2 - 16 - f2, ay2, col.b2, Lb.F2, c2 - 16 - f2, ay2 - 8, 'start');
        }
        if (show.extArrow && Math.abs(st.ext) > 1e-9) {
          const L = 4 + Math.abs(st.ext) * k, dir = Math.sign(st.ext), xe = dir > 0 ? c1 + 12 : c1 - 12, yy = base - h1 - 12;
          arrow(g0, xe - dir * 0, yy, xe + dir * L, yy, 'var(--muted)', Lb.extForce, xe + dir * L, yy - 6, dir > 0 ? 'end' : 'start');
        }
      }
      svg.append(g0);
    }
    if (show.forcePlot) {
      const f1 = M.rows.map(r => r.F1), f2 = M.rows.map(r => r.F2), top = yForce;
      svg.append(plot(top, Fm, [{ pts: f1, color: col.b1, label: Lb.F1 }, { pts: f2, color: col.b2, label: Lb.F2, dy: 12 }], Lb.force + ` (${U.force})`, num(Fm, 1)));
    }
    if (hasMomPlot) {
      const cs = [];
      if (show.p1) cs.push({ pts: M.rows.map(r => r.p1), color: col.b1, label: Lb.p1, dy: -4 });
      if (show.p2) cs.push({ pts: M.rows.map(r => r.p2), color: col.b2, label: Lb.p2, dy: 12 });
      if (show.total) cs.push({ pts: M.rows.map(r => r.P), color: col.tot, label: Lb.P.split('=')[0].trim(), w: 3.2, dash: '6 3', dy: -5 });
      svg.append(plot(yMom, bandP, cs, Lb.momentum + ` (${U.momentum})`, num(bandP, 1)));
    }
    const val = { p1: row.p1, p2: row.p2, P: row.P, v1: row.v1, v2: row.v2, vcm: row.vcm };
    for (const k of reads) if (rd[k]) rd[k].textContent = k === 'J' ? `${num(st.J, 2)} ${U.impulse}` : `${num(val[k], 2)} ${k[0] === 'v' ? U.speed : U.momentum}`;
    for (const [k, inp] of Object.entries(inps)) { inp.value = st[k]; vals[k].textContent = fmtSlider(k); }
    for (const [mode, b] of Object.entries(modeBtns)) b.setAttribute('aria-pressed', String((mode === 'on') === st.lawOn));
  }
  const fmtSlider = k => k === 'm1' || k === 'm2' ? `${num(st[k], 1)} ${U.mass}` : k === 'J' ? `${num(st.J, 1)} ${U.impulse}` : k === 'ext' ? `${num(st.ext, 1)} ${U.force}` : k === 'T' ? `${num(st.T, 1)} s` : num(st.ratio, 1);

  // controls
  const rd = {}, inps = {}, vals = {}, modeBtns = {};
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const sliderEls = sliderKeys.map(k => {
    const [lo, hi, step] = R[k];
    const inp = inps[k] = h('input', { type: 'range', min: lo, max: hi, step, value: st[k], 'aria-label': Lb[k] });
    inp.addEventListener('input', () => { st[k] = +inp.value; play(); });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb[k])), inp, vals[k] = h('span', { class: 'fs-num' }));
  });
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const toggles = cfg.lawToggle ? [['on', Lb.lawOn], ['off', Lb.lawOff]].map(([mode, txt]) => { const b = btn(txt, () => { st.lawOn = mode === 'on'; play(); }); return modeBtns[mode] = b; }) : [];
  const apply = p => { for (const k of ['m1', 'm2', 'J', 'T', 'ext', 'ratio', 'lawOn']) if (p[k] != null) st[k] = p[k]; play(); };
  const btns = h('div', { class: 'wbtns' }, show.replay ? btn(Lb.play, () => play()) : '', toggles,
    btn(Lb.reset, () => { Object.assign(st, init); play(); }), (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', sliderEls.length ? h('div', { class: 'fs-sliders' }, sliderEls) : '', btns);

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
