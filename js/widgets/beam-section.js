// beam-section
//
// A simply supported beam with a load at midspan, and the bending stress over the cross-section at midspan. Plain SVG + HTML, every word from the config.
// The model is SI: lengths in m, forces in kN, stress in MPa, E in GPa (the unit labels in the config only change the words).
// Model:
//   section: a stack of rectangles (width, from y0 to y1, sign +1 solid / -1 hole); area A = sum, centroid yc, second moment about the centroid I = sum sign w [(y1-yc)^3 - (y0-yc)^3]/3
//   (solid b x h: I = b h^3 / 12).  Three sections of the SAME area A: solid b x h, I-shape (flange width bf, web tw, depth H -> flange thickness from A), hollow box (B x H, wall from A).
//   midspan moment M = P L / 4;  stress at height y above the neutral axis  sigma(y) = - M y / I  (tension positive: compression above, tension below);  largest |sigma| = M c / I, c = H/2.
//   deflection at midspan  delta = P L^3 / (48 E I).
//   prestress: a uniform compressive stress sp (MPa) added to the profile:  sigma_total(y) = - M y / I - sp.
//   cracks: concrete tensile limit ft (MPa): the fibres where sigma_total > ft are marked (crack depth = from the bottom edge up to sigma_total = ft).
//   rebar: steel bars at the tension side (area As, cover c): cracked-section estimate T = M / (z), z = 0.9 d, d = H - c (a common simplified rule); steel stress = T / As.
//
//   span: 4  load: 100  E: 30 (GPa)  tensileLimit: 3 (MPa)  prestress: 0 (MPa)
//   section: 'solid' | 'I' | 'hollow'    sections: ['solid','I','hollow']
//   dims: { solid: {b: 0.1, h: 0.3}, I: {H: 0.4, bf: 0.2, tw: 0.03}, hollow: {B: 0.15, H: 0.3} }   (A comes from the solid section unless `area` is given: solid h = A / b)
//   rebar: { on: false, area: 0.0012, cover: 0.04, count: 3 }
//   ranges: { load: [0, 300, 5], prestress: [0, 10, 0.5] }    stressScale: MPa that fills the stress diagram (default: the largest of the three sections at the initial load)
//   exaggeration: deflection drawn this many times larger (default: the initial largest deflection draws 10 px)
//   show: { selector, beam, supports, loadArrow, section, stressDiagram, neutralAxis, stressValues, rebar, prestress, crack, momentDiagram, readouts, deflection, handles, loadSlider,
//           prestressSlider, rebarToggle, presets, labels, legend, dimensions }
//       defaults true except momentDiagram, loadSlider, prestressSlider, rebarToggle (false) and deflection (true).
//       selector = the section buttons; beam = side view of the beam; supports = its supports; loadArrow = midspan load; section = the cross-section drawing; stressDiagram = stress profile
//       beside it; neutralAxis = the dashed zero-stress line; stressValues = numbers at the extreme fibres; rebar = the steel bars (when on); prestress = the uniform compression added
//       (the shifted profile and its label); crack = tension limit line and crack marks where tension exceeds it; momentDiagram = triangle M(x) under the beam;
//       deflection = the bent shape of the beam; handles = draggable load arrow; loadSlider, prestressSlider = sliders; rebarToggle = checkbox; presets = preset buttons;
//       labels = all text in the drawing; legend = tension / compression key; dimensions = span mark.
//   readouts: array of  area, I, modulus, moment, maxstress, deflection, crack, steel
//   presets: [{ label, section, load, prestress, rebar (true/false), span }]
//   labels: { solid, I, hollow, area, I, modulus, moment, maxstress, deflection, crack, steel, tension, compression, neutral, none, reset, load, prestress, rebar, limit, span }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 1) => { const t = Number((+v).toFixed(d)); return String(Object.is(t, -0) ? 0 : t); };
const sci = v => (v >= 0.01 ? num(v, 4) : (+v).toExponential(2).replace('e-', ' × 10⁻').replace(/⁻(\d)$/, (_, d) => '⁻' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let uid = 0;

// ---------- pure model (exported for script checks) ----------
export function sectionRects(kind, dims, area) {
  const d = dims ?? {};
  if (kind === 'solid') { const b = d.solid?.b ?? 0.1, hh = area ? area / b : d.solid?.h ?? 0.3; return { rects: [{ w: b, y0: 0, y1: hh, sign: 1 }], H: hh, W: b }; }
  const A = area ?? (d.solid?.b ?? 0.1) * (d.solid?.h ?? 0.3);
  if (kind === 'I') {
    const H = d.I?.H ?? 0.4, bf = d.I?.bf ?? 0.2, tw = d.I?.tw ?? 0.03, tf = (A - H * tw) / (2 * (bf - tw));
    return { rects: [{ w: bf, y0: 0, y1: tf, sign: 1 }, { w: tw, y0: tf, y1: H - tf, sign: 1 }, { w: bf, y0: H - tf, y1: H, sign: 1 }], H, W: bf, tf, tw };
  }
  const B = d.hollow?.B ?? 0.15, H = d.hollow?.H ?? 0.3, S = B + H, t = (S - Math.sqrt(S * S - 4 * A)) / 4;
  return { rects: [{ w: B, y0: 0, y1: H, sign: 1 }, { w: B - 2 * t, y0: t, y1: H - t, sign: -1 }], H, W: B, t };
}
export function sectionProps(rects) {
  const A = rects.reduce((a, r) => a + r.sign * r.w * (r.y1 - r.y0), 0);
  const yc = rects.reduce((a, r) => a + r.sign * r.w * (r.y1 * r.y1 - r.y0 * r.y0) / 2, 0) / A;
  const I = rects.reduce((a, r) => a + r.sign * r.w * (Math.pow(r.y1 - yc, 3) - Math.pow(r.y0 - yc, 3)) / 3, 0);
  const top = Math.max(...rects.map(r => r.y1)) - yc, bot = yc - Math.min(...rects.map(r => r.y0));
  return { A, yc, I, top, bot, W: I / Math.max(top, bot) };
}
export function beamModel({ L, P, E, I, A, top, bot, prestress = 0, ft = 3, rebarArea = 0, depth, cover = 0.04 }) {
  const M = P * L / 4;                                              // kN m
  const sig = y => -M * y / I / 1000 - prestress;                   // MPa, y above the centroid (m), tension positive
  const sTop = sig(top), sBot = sig(-bot), delta = P * Math.pow(L, 3) / (48 * E * 1e6 * I);   // E in GPa -> kN/m2
  // crack height from the bottom edge: fibres with sigma > ft  (sigma = -M y/I - sp = ft  at  y = yLimit, below the neutral axis)
  const yLimit = M > 0 ? -(ft + prestress) * 1000 * I / M : -Infinity;
  const cracked = M > 0 && sBot > ft + 1e-9, crackH = cracked ? clamp(yLimit + bot, 0, bot + top) : 0;
  const z = 0.9 * (depth - cover), T = rebarArea > 0 ? M / z : 0;
  return { M, sig, sTop, sBot, delta, cracked, crackH, yLimit, T, steel: rebarArea > 0 ? T / rebarArea / 1000 : 0, z };
}

// ---------- widget ----------
export function beamSection(el, cfg) {
  const Lb = { solid: 'Solid', I: 'I-shape', hollow: 'Hollow', area: 'Area', Imom: 'Second moment I', modulus: 'I / c', moment: 'Midspan moment', maxstress: 'Largest stress',
    deflection: 'Midspan deflection', crack: 'Cracks', steel: 'Steel bars', tension: 'tension', compression: 'compression', neutral: 'neutral axis', none: 'none', reset: 'Reset',
    load: 'Load', prestress: 'Prestress', rebar: 'Steel bars', limit: 'tension limit', span: 'Span', ...(cfg.labels ?? {}) };
  const show = { selector: true, beam: true, supports: true, loadArrow: true, section: true, stressDiagram: true, neutralAxis: true, stressValues: true, rebar: true, prestress: true, crack: true,
    momentDiagram: false, readouts: true, deflection: true, handles: true, loadSlider: false, prestressSlider: false, rebarToggle: false, presets: true, labels: true, legend: true, dimensions: true, ...(cfg.show ?? {}) };
  const U = { length: 'm', force: 'kN', stress: 'MPa', ...(cfg.units ?? {}) };
  const R = { load: [0, 300, 5], prestress: [0, 10, 0.5], ...(cfg.ranges ?? {}) };
  const kinds = cfg.sections ?? ['solid', 'I', 'hollow'];
  const init = { kind: cfg.section ?? kinds[0], P: cfg.load ?? 100, L: cfg.span ?? 4, sp: cfg.prestress ?? 0, rebar: cfg.rebar?.on ?? false };
  const st = { ...init };
  const E = cfg.E ?? 30, ft = cfg.tensileLimit ?? 3, rb = { area: 0.0012, cover: 0.04, count: 3, ...(cfg.rebar ?? {}) };
  const Aref = cfg.area ?? (cfg.dims?.solid?.b ?? 0.1) * (cfg.dims?.solid?.h ?? 0.3);
  const info = kind => { const sec = sectionRects(kind, cfg.dims, Aref), pr = sectionProps(sec.rects); return { sec, pr }; };
  const modelOf = (kind, P = st.P, sp = (show.prestress ? st.sp : 0)) => { const { sec, pr } = info(kind); return { sec, pr, m: beamModel({ L: st.L, P, E, I: pr.I, A: pr.A, top: pr.top, bot: pr.bot, prestress: sp, ft, rebarArea: st.rebar ? rb.area : 0, depth: sec.H, cover: rb.cover }) }; };
  const Hmax = Math.max(...kinds.map(k => info(k).sec.H));
  const sigRef = cfg.stressScale ?? Math.max(1e-9, ...kinds.map(k => { const o = modelOf(k, init.P, 0); return Math.max(Math.abs(o.m.sTop), Math.abs(o.m.sBot)); })) * 1.05;
  const defl0 = Math.max(...kinds.map(k => modelOf(k, init.P, 0).m.delta));
  const exag = cfg.exaggeration ?? (defl0 > 0 ? 10 / (defl0 * (300 / st.L)) : 1);
  const colT = 'var(--covec)', colC = 'var(--vec)';

  const W = 360, Hh = 300, svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fs-svg', role: 'img', 'aria-label': 'beam' });
  const arrow = (g0, x0, y0, x1, y1, col, wd = 2.2) => {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy); if (len < 2) return;
    const ux = dx / len, uy = dy / len, hs = Math.min(6.5, len * 0.5);
    g0.append(s('line', { x1: x0, y1: y0, x2: x1 - ux * hs * 0.6, y2: y1 - uy * hs * 0.6, stroke: col, 'stroke-width': wd }),
      s('path', { d: `M${x1},${y1} L${x1 - ux * hs - uy * hs * 0.5},${y1 - uy * hs + ux * hs * 0.5} L${x1 - ux * hs + uy * hs * 0.5},${y1 - uy * hs - ux * hs * 0.5} Z`, fill: col }));
  };
  const BX0 = 30, BX1 = 330, BY = 62;
  const loadPx = P => clamp(18 + 26 * P / Math.max(R.load[1], 1) * 2, 18, 46);

  function paint() {
    svg.replaceChildren();
    const g0 = s('g'), lab = (x, y, txt, o = {}) => g0.append(s('text', { x, y, 'font-size': 9.5, fill: 'var(--muted)', ...o }, txt));
    const { sec, pr, m } = modelOf(st.kind), mid = (BX0 + BX1) / 2;
    // ----- beam, side view
    if (show.beam) {
      const defl = show.deflection ? m.delta * exag * (300 / st.L) : 0;
      const yAt = x => { const t = (x - BX0) / (BX1 - BX0), u = t <= 0.5 ? t : 1 - t; return BY + defl * (u * (3 - 4 * u * u)); };
      const pts = Array.from({ length: 41 }, (_, i) => { const x = BX0 + (BX1 - BX0) * i / 40; return `${i ? 'L' : 'M'}${x.toFixed(1)},${yAt(x).toFixed(1)}`; }).join(' ');
      if (show.supports) {
        g0.append(s('path', { d: `M${BX0},${BY + 4} L${BX0 - 9},${BY + 18} L${BX0 + 9},${BY + 18} Z`, fill: 'var(--muted)', opacity: 0.4, stroke: 'var(--muted)' }),
          s('path', { d: `M${BX1},${BY + 4} L${BX1 - 9},${BY + 18} L${BX1 + 9},${BY + 18} Z`, fill: 'var(--muted)', opacity: 0.4, stroke: 'var(--muted)' }),
          s('circle', { cx: BX1 - 4, cy: BY + 21, r: 3, fill: 'var(--muted)' }), s('circle', { cx: BX1 + 4, cy: BY + 21, r: 3, fill: 'var(--muted)' }));
      }
      g0.append(s('path', { d: pts, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 6, 'stroke-linecap': 'round' }));
      if (show.crack && m.cracked) {
        for (const dx of [-8, 0, 8]) g0.append(s('path', { d: `M${mid + dx},${yAt(mid) + 3} l-2,6 l4,5 l-2,6`, fill: 'none', stroke: 'var(--bad, #c0392b)', 'stroke-width': 1.6 }));
      }
      if (show.loadArrow) {
        const len = loadPx(st.P), top = BY - 6 - len;
        arrow(g0, mid, top, mid, yAt(mid) - 4, 'var(--ink)', 3.4);
        if (show.labels) lab(mid + 8, top + 8, `${num(st.P, 0)} ${U.force}`, { fill: 'var(--ink)', 'font-weight': 650 });
        if (show.handles) g0.append(s('circle', { cx: mid, cy: top, r: 7, fill: 'var(--bg, #fff)', stroke: 'var(--basis)', 'stroke-width': 2.5, 'data-load': 1, style: 'cursor:ns-resize;touch-action:none' }));
      }
      if (show.dimensions && show.labels) lab(mid, BY + 38, `${Lb.span} = ${num(st.L, 1)} ${U.length}`, { 'text-anchor': 'middle', fill: 'var(--ink)' });
      if (show.momentDiagram) {
        const base = BY + 44, hgt = 18;
        g0.append(s('path', { d: `M${BX0},${base} L${mid},${base + hgt} L${BX1},${base} Z`, fill: 'var(--muted)', opacity: 0.2, stroke: 'var(--muted)' }));
        if (show.labels) lab(mid + 6, base + hgt - 2, `M = ${num(m.M, 0)} ${U.force}·${U.length}`, { fill: 'var(--ink)' });
      }
    }
    // ----- section and stress profile, common vertical scale
    const SY0 = !show.beam ? 30 : show.momentDiagram ? 134 : 118, SY1 = 282, sc = (SY1 - SY0 - 6) / Hmax, cx = 82, ax = 250, kS = 64 / sigRef;
    const yTopPx = SY1 - (sec.H - 0) * sc - (Hmax - sec.H) * sc / 2 - 3, yPx = y => yTopPx + (sec.H - (y + pr.yc)) * sc;   // y above centroid -> px
    if (show.section) {
      for (const r of sec.rects) g0.append(s('rect', { x: cx - r.w * sc / 2, y: yTopPx + (sec.H - r.y1) * sc, width: r.w * sc, height: (r.y1 - r.y0) * sc, fill: r.sign > 0 ? 'var(--muted)' : 'var(--bg, #fff)', opacity: r.sign > 0 ? 0.45 : 1, stroke: r.sign > 0 ? 'var(--ink)' : 'var(--ink)', 'stroke-width': 1.4 }));
      if (show.rebar && st.rebar) {
        const yb = -pr.bot + rb.cover, n = rb.count, span = Math.min(sec.W * 0.7, 0.14);
        for (let i = 0; i < n; i++) g0.append(s('circle', { cx: cx + (n === 1 ? 0 : (i / (n - 1) - 0.5) * span * sc), cy: yPx(yb), r: clamp(Math.sqrt(rb.area / n / Math.PI) * sc, 2.2, 6), fill: 'var(--ink)' }));
      }
      if (show.crack && m.cracked) {
        const yTop = clamp(m.yLimit, -pr.bot, pr.top);
        for (const dx of [-0.3, 0, 0.3]) { const x = cx + dx * sec.W * sc, yb = yPx(-pr.bot), yt = yPx(yTop); g0.append(s('path', { d: `M${x},${yb} L${x - 2},${(yb * 2 + yt) / 3} L${x + 2},${(yb + yt * 2) / 3} L${x},${yt}`, fill: 'none', stroke: 'var(--bad, #c0392b)', 'stroke-width': 1.8 })); }
      }
      if (show.neutralAxis) g0.append(s('line', { x1: cx - sec.W * sc / 2 - 8, y1: yPx(0), x2: cx + sec.W * sc / 2 + 8, y2: yPx(0), stroke: 'var(--basis)', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }));
    }
    if (show.stressDiagram) {
      const f = y => m.sig(y);
      const id = 'clp' + (++uid), yt = yPx(pr.top), yb = yPx(-pr.bot), st0 = f(pr.top), sb0 = f(-pr.bot);
      const poly = `M${ax},${yt} L${ax + st0 * kS},${yt} L${ax + sb0 * kS},${yb} L${ax},${yb} Z`;
      g0.append(s('clipPath', { id: id + 'a' }, s('rect', { x: ax, y: 0, width: 200, height: Hh })), s('clipPath', { id: id + 'b' }, s('rect', { x: ax - 200, y: 0, width: 200, height: Hh })));
      g0.append(s('path', { d: `M${ax - 200},${yt} L${ax + st0 * kS},${yt} L${ax + sb0 * kS},${yb} L${ax - 200},${yb} Z`, fill: colT, opacity: 0.45, 'clip-path': `url(#${id}a)` }),
        s('path', { d: `M${ax + 200},${yt} L${ax + st0 * kS},${yt} L${ax + sb0 * kS},${yb} L${ax + 200},${yb} Z`, fill: colC, opacity: 0.45, 'clip-path': `url(#${id}b)` }));
      g0.append(s('path', { d: poly, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.6 }), s('line', { x1: ax, y1: yt - 4, x2: ax, y2: yb + 4, stroke: 'var(--muted)' }));
      if (show.neutralAxis) {
        const y0 = (() => { const a = f(pr.top), b = f(-pr.bot); return a === b ? null : yt + (0 - a) / (b - a) * (yb - yt); })();
        if (y0 != null && y0 >= yt && y0 <= yb) { g0.append(s('line', { x1: cx + sec.W * sc / 2 + 8, y1: y0, x2: ax + 70, y2: y0, stroke: 'var(--basis)', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' })); if (show.labels) lab(ax + 4, y0 - 3, Lb.neutral, { fill: 'var(--basis)' }); }
      }
      if (show.crack) {
        const xl = ax + ft * kS; g0.append(s('line', { x1: xl, y1: yt - 2, x2: xl, y2: yb + 2, stroke: 'var(--bad, #c0392b)', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }));
        if (show.labels) lab(xl + 3, yt - 3, `${Lb.limit} ${num(ft, 1)} ${U.stress}`, { fill: 'var(--bad, #c0392b)', 'text-anchor': xl > 290 ? 'end' : 'start' });
      }
      if (show.stressValues && show.labels) {
        lab(ax + st0 * kS + (st0 < 0 ? -3 : 3), yt - 3, `${num(Math.abs(st0), 2)} ${U.stress}`, { fill: st0 < 0 ? colC : colT, 'font-weight': 650, 'text-anchor': st0 < 0 ? 'end' : 'start' });
        lab(ax + sb0 * kS + (sb0 < 0 ? -3 : 3), yb + 10, `${num(Math.abs(sb0), 2)} ${U.stress}`, { fill: sb0 < 0 ? colC : colT, 'font-weight': 650, 'text-anchor': sb0 < 0 ? 'end' : 'start' });
      }
    }
    if (show.legend && show.labels && show.stressDiagram) {
      g0.append(s('rect', { x: 8, y: 8, width: 9, height: 9, fill: colT }), s('rect', { x: 8, y: 21, width: 9, height: 9, fill: colC }));
      lab(21, 16, Lb.tension, { fill: 'var(--ink)' }); lab(21, 29, Lb.compression, { fill: 'var(--ink)' });
    }
    svg.append(g0);
    readouts(m, pr, sec);
  }

  // ---------- readouts
  const readEl = h('div', { class: 'fs-reads' });
  const sliders = [];
  function readouts(m, pr) {
    const keys = cfg.readouts ?? ['area', 'Imom', 'maxstress', 'deflection'];
    const tens = Math.max(m.sTop, m.sBot), comp = Math.min(m.sTop, m.sBot);
    const val = {
      area: `${num(pr.A, 4)} ${U.length}²`, Imom: `${sci(pr.I)} ${U.length}⁴`, I: `${sci(pr.I)} ${U.length}⁴`, modulus: `${sci(pr.W)} ${U.length}³`, moment: `${num(m.M, 1)} ${U.force}·${U.length}`,
      maxstress: `${num(Math.max(Math.abs(tens), Math.abs(comp)), 2)} ${U.stress}`, deflection: `${num(m.delta * 1000, 2)} mm`,
      crack: m.cracked ? `${num(Math.min(m.crackH, pr.bot + pr.top) * 100, 0)} cm` : Lb.none, steel: st.rebar ? `${num(m.T, 0)} ${U.force}, ${num(m.steel, 0)} ${U.stress}` : '—',
    };
    readEl.replaceChildren(...keys.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(Lb[k] ?? k)), h('div', { class: 'fs-num', role: 'status' }, val[k] ?? ''))));
    for (const sl of sliders) sl.sync();
    kindBtns.forEach(([b, k]) => b.classList.toggle('active', k === st.kind));
  }

  // ---------- controls
  const slider = (label, key, range, fmt) => {
    const inp = h('input', { type: 'range', min: range[0], max: range[1], step: range[2], 'aria-label': label }), val = h('span', { class: 'fs-num' });
    inp.addEventListener('input', () => { st[key] = +inp.value; paint(); });
    sliders.push({ sync() { inp.value = st[key]; val.textContent = fmt(st[key]); } });
    return h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(label)), inp, val);
  };
  const rows = [show.loadSlider ? slider(Lb.load, 'P', R.load, v => `${num(v, 0)} ${U.force}`) : '', show.prestressSlider ? slider(Lb.prestress, 'sp', R.prestress, v => `${num(v, 1)} ${U.stress}`) : ''].filter(Boolean);
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const kindBtns = show.selector ? kinds.map(k => [btn(Lb[k] ?? k, () => { st.kind = k; paint(); }), k]) : [];
  const chk = show.rebarToggle ? h('label', { class: 'fs-lab' }, h('input', { type: 'checkbox', onchange: e => { st.rebar = e.target.checked; paint(); } }), ' ', mdInline(Lb.rebar)) : '';
  const presets = show.presets ? cfg.presets ?? [] : [];
  const apply = pr => { if (pr.section) st.kind = pr.section; if (pr.load != null) st.P = pr.load; if (pr.prestress != null) st.sp = pr.prestress; if (pr.rebar != null) st.rebar = !!pr.rebar; if (pr.span != null) st.L = pr.span; syncChk(); paint(); };
  const syncChk = () => { if (chk) chk.querySelector('input').checked = st.rebar; };
  const btns = h('div', { class: 'wbtns' }, kindBtns.map(x => x[0]), presets.map(pr => btn(pr.label, () => apply(pr))), presets.length ? btn(Lb.reset, () => { Object.assign(st, init); syncChk(); paint(); }) : '');
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts ? readEl : '', rows.length ? h('div', { class: 'fs-sliders' }, rows) : '', chk ? h('div', { class: 'fs-sliders' }, chk) : '', btns);
  syncChk();

  // ---------- dragging
  let drag = false;
  svg.addEventListener('pointerdown', ev => { if (ev.target?.hasAttribute?.('data-load')) { drag = true; svg.setPointerCapture?.(ev.pointerId); ev.preventDefault(); } });
  svg.addEventListener('pointermove', ev => {
    if (!drag) return;
    const r = svg.getBoundingClientRect(), y = (ev.clientY - r.top) / r.height * Hh, len = BY - 6 - y;   // handle height above the beam
    st.P = clamp(Math.round(((len - 18) / 28) / 2 * R.load[1] / R.load[2]) * R.load[2], R.load[0], R.load[1]); paint();
  });
  const up = () => { drag = false; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);

  paint();
}
