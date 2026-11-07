// heat-layers
//
// Steady heat flow through a wall or flask cross-section made of 1 to 3 layers in series, between a hot side and a cold side.
// Plain SVG + HTML, every word and unit from the config (no course text hard-coded).
// Model (area A, temperatures in degrees, thickness L in metres internally):
//   layer of conductivity k:   R = L / (k A)        (K/W)         layer given as a surface film or radiating gap with coefficient h:  R = 1 / (h A)
//   series:                    R_tot = sum of R,    Q = (T_hot - T_cold) / R_tot = A dT / sum(L/k)       (W)
//   drop across a layer:       dT_i = Q R_i,  so the temperature profile is made of straight segments, steepest in the best insulator
//   optional surface films (convection at each side): R = 1 / (h A) with h = films.hot / films.cold (toggle)
//   optional body of heat capacity C (J/K) cooling through the stack: time constant tau = C R_tot
//
//   layers: [{ name, k, L, h, type, min, max, step, fixed, color, materials }]
//       k (W/m K) with L (config unit `lengthUnit`, default cm; internally L / lengthScale metres) or h (W/m^2 K) instead (no thickness);
//       type 'gap' draws a hatched layer (still air, vacuum, radiation: give its effective k and L, or h);
//       min/max/step = thickness slider range (display unit); fixed = no slider and no handle for this layer;
//       color = css colour; materials = names (from `materials`) offered in a select for this layer (its k and, if given, its colour then follow the choice).
//   materials: [{ name, k, h }]               choices for the layer selects
//   A: 1                                      area (m^2)
//   Thot: 80, Tcold: 20                       temperatures; tempRange: [lo, hi, step] for the temperature sliders (also fixes the profile axis)
//   films: { hot: 8, cold: 25, on: false }    surface heat-transfer coefficients (W/m^2 K) and the start state of the toggle
//   body: { C: 500000, label }                heat capacity of the thing inside (J/K), enables the cooling time readout `tau`
//   lengthUnit: 'cm', lengthScale: 100        display unit of thickness (1 m = lengthScale units)
//   units: { temp: '°C', length, power: 'W', area: 'm²' }
//   show: { layers, names, kValues, thickness, profile, tempLabels, guides, resistances, resistanceBar, flowArrow, hotCold, films,
//           readouts, thicknessSliders, kSliders, tempSliders, materialSelects, filmToggle, handles, presets, reset }
//       all default true except kSliders, filmToggle (false) and tempSliders (false);
//       layers = the coloured blocks; names = material names; kValues = "k = ..." under each layer; thickness = the thickness
//       under each layer; profile = the temperature graph above; tempLabels = temperature numbers at the layer boundaries;
//       guides = dashed lines from boundaries to the graph; resistances = "R = ..." under each layer; resistanceBar = bar whose
//       segments are the layers' shares of the total resistance; flowArrow = arrow with the heat flow Q; hotCold = the two side
//       strips with their temperatures; films = the thin film layers (when on); readouts = the readout cells;
//       thicknessSliders = one slider per adjustable layer; kSliders = a conductivity slider per layer; tempSliders = hot and cold
//       temperature sliders; materialSelects = material drop-down per layer that has `materials`; filmToggle = button for the films;
//       handles = drag the right edge of a layer to change its thickness; presets = preset buttons; reset = reset button.
//   readouts: ['Q','Rtot']  any of Q, flux, Rtot, Rarea, U, dT, tau, layerR, layerDT   (default Q and Rtot)
//   presets: [{ label, Thot, Tcold, films, layers: [{...fields to change, by position}] , materials: ['name', ...] }]
//   labels: { Q, flux, Rtot, Rarea, U, dT, tau, layerR, layerDT, hot, cold, thickness, k, temp, films, filmsOn, filmsOff, reset, aria, filmHot, filmCold }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => String(Number((+v).toFixed(d)));
const sig = (v, n = 3) => { if (!Number.isFinite(v)) return '–'; if (v === 0) return '0'; const p = Math.pow(10, n - 1 - Math.floor(Math.log10(Math.abs(v)))); return String(Math.round(v * p) / p); };
const fmtTime = t => !Number.isFinite(t) ? '–' : t < 120 ? `${sig(t, 3)} s` : t < 7200 ? `${sig(t / 60, 3)} min` : t < 172800 ? `${sig(t / 3600, 3)} h` : `${sig(t / 86400, 3)} days`;
const fmtP = (v, u) => { const a = Math.abs(v); return a >= 1e4 ? `${sig(v / 1e3, 3)} k${u}` : `${sig(v, 3)} ${u}`; };
const PALETTE = ['var(--basis)', 'var(--vec)', 'var(--muted)'];

// Pure model, exported for script checks.  layers: [{k, L (m), h}], Rfilm: [hotFilm, coldFilm] resistances per area or null.
export function stackModel({ layers, A = 1, Thot, Tcold, films = null }) {
  const R = [];
  if (films?.hot) R.push(1 / (films.hot * A));
  for (const l of layers) R.push(l.h ? 1 / (l.h * A) : l.L / (l.k * A));
  if (films?.cold) R.push(1 / (films.cold * A));
  const Rtot = R.reduce((a, b) => a + b, 0), dT = Thot - Tcold, Q = dT / Rtot;
  const T = [Thot]; for (const r of R) T.push(T.at(-1) - Q * r);
  return { R, Rtot, Q, dT, T, flux: Q / A, U: 1 / (Rtot * A), Rarea: Rtot * A, hasHot: !!films?.hot, hasCold: !!films?.cold };
}

export function heatLayers(el, cfg) {
  const Lb = { Q: 'Heat flow Q', flux: 'Heat flux', Rtot: 'Total resistance', Rarea: 'R per area', U: 'U-value', dT: 'Temperature difference', tau: 'Cooling time constant',
    layerR: 'R', layerDT: 'Drop', hot: 'Hot', cold: 'Cold', thickness: 'Thickness', k: 'Conductivity', temp: 'Temperature', films: 'Surface films', filmsOn: 'Surface films: on',
    filmsOff: 'Surface films: off', reset: 'Reset', aria: 'Heat flow through layers', filmHot: 'film', filmCold: 'film', ...(cfg.labels ?? {}) };
  const show = { layers: true, names: true, kValues: true, thickness: true, profile: true, tempLabels: true, guides: true, resistances: true, resistanceBar: true, flowArrow: true, hotCold: true,
    films: true, readouts: true, thicknessSliders: true, kSliders: false, tempSliders: false, materialSelects: true, filmToggle: false, handles: true, presets: true, reset: true, ...(cfg.show ?? {}) };
  const U = { temp: '°C', length: cfg.lengthUnit ?? 'cm', power: 'W', area: 'm²', ...(cfg.units ?? {}) };
  const scale = cfg.lengthScale ?? 100, A = cfg.A ?? 1;
  const mats = cfg.materials ?? [];
  const reads = cfg.readouts ?? ['Q', 'Rtot'];
  const filmCfg = { hot: 8, cold: 25, on: false, ...(cfg.films ?? {}) };
  const init = {
    Thot: cfg.Thot ?? 80, Tcold: cfg.Tcold ?? 20, films: !!filmCfg.on,
    layers: (cfg.layers ?? []).slice(0, 3).map(l => ({ k: l.k, h: l.h, L: l.h ? 0 : (l.L ?? 1) / scale, mat: l.material ?? (cfg.materials ?? []).find(m => (l.materials ?? []).includes(m.name) && (m.k === l.k || (l.h && m.h === l.h)))?.name ?? null })),
  };
  const st = JSON.parse(JSON.stringify(init));
  const lay = (cfg.layers ?? []).slice(0, 3);
  const matOf = n => mats.find(m => m.name === n);
  const trange = cfg.tempRange ?? [0, 100, 1];
  const allT = [init.Thot, init.Tcold, ...(cfg.presets ?? []).flatMap(p => [p.Thot ?? init.Thot, p.Tcold ?? init.Tcold])];
  const span = Math.max(...allT) - Math.min(...allT) || 1;
  const fixedAxis = !!cfg.tempRange || show.tempSliders;
  const Tlo = fixedAxis ? Math.min(trange[0], ...allT) : Math.min(...allT) - 0.12 * span, Thi = fixedAxis ? Math.max(trange[1], ...allT) : Math.max(...allT) + 0.12 * span;
  const adjustable = i => !lay[i].h && !lay[i].fixed;
  const rangeOf = i => { const l = lay[i], base = l.L ?? 1; return [l.min ?? base / 4, l.max ?? base * 4, l.step ?? Math.max(0.01, base / 20)]; };
  const kRange = i => { const k = lay[i].k; return [lay[i].kMin ?? k / 5, lay[i].kMax ?? k * 5]; };
  const colorOf = i => (st.layers[i].mat && matOf(st.layers[i].mat)?.color) || lay[i].color || PALETTE[i % PALETTE.length];
  const nameOf = i => st.layers[i].mat ?? lay[i].name ?? '';
  const model = () => stackModel({ layers: st.layers, A, Thot: st.Thot, Tcold: st.Tcold, films: st.films ? { hot: filmCfg.hot, cold: filmCfg.cold } : null });

  // geometry (px)
  const W = 360, PL = 14, PR = 346, SW = 14, FW = 10;
  const showProfile = show.profile, PT = 24, PH = showProfile ? 96 : 0;
  const AR = show.flowArrow ? PT + PH + 8 : PT + PH, ARH = show.flowArrow ? 26 : 0;
  const LY = AR + ARH + 4, LH = 66;
  const txtBase = LY + LH + 14;
  const rowsBelow = (show.names ? 1 : 0) + (show.kValues || show.thickness ? 1 : 0) + (show.resistances ? 1 : 0);
  const BY = txtBase + rowsBelow * 13 + 4, BH = 14;
  const H = show.resistanceBar ? BY + BH + 16 : BY;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.aria, style: 'touch-action:pan-y' });
  let geo = null;

  const yT = T => PT + PH - (T - Tlo) / (Thi - Tlo) * PH;

  function paint() {
    const M = model(), n = st.layers.length;
    const filmsOn = st.films;
    const nf = (filmsOn && show.films ? 2 : 0), edge = show.hotCold ? SW : 0;
    const avail = PR - PL - 2 * edge - nf * FW;
    const minW = 22, sumL = st.layers.reduce((a, l) => a + (l.h ? 0 : l.L), 0) || 1;
    let ws = st.layers.map(l => l.h ? minW : minW + (avail - n * minW) * (l.L / sumL)); const tot = ws.reduce((a, b) => a + b, 0); ws = ws.map(w => w * avail / tot);
    // x boundaries of all slabs: hot strip, [hot film], layers, [cold film], cold strip
    const slabs = [];
    let x = PL;
    if (show.hotCold) { slabs.push({ kind: 'hot', x0: x, x1: x + SW }); x += SW; }
    if (nf && M.hasHot) { slabs.push({ kind: 'film', x0: x, x1: x + FW, j: 0 }); x += FW; }
    const li0 = M.hasHot ? 1 : 0;
    ws.forEach((w, i) => { slabs.push({ kind: 'layer', i, x0: x, x1: x + w, j: li0 + i }); x += w; });
    if (nf && M.hasCold) { slabs.push({ kind: 'film', x0: x, x1: x + FW, j: M.R.length - 1 }); x += FW; }
    if (show.hotCold) { slabs.push({ kind: 'cold', x0: x, x1: x + SW }); x += SW; }
    const resSlabs = slabs.filter(sl => sl.kind === 'film' || sl.kind === 'layer');
    for (const sl of resSlabs) { sl.R = M.R[sl.j]; sl.Ta = M.T[sl.j]; sl.Tb = M.T[sl.j + 1]; }
    geo = { layers: slabs.filter(sl => sl.kind === 'layer'), sumL, avail };

    const g = s('g');
    // profile
    if (showProfile) {
      g.append(s('line', { x1: PL, y1: PT, x2: PL, y2: PT + PH, stroke: 'var(--ink)', 'stroke-width': 1 }), s('line', { x1: PL, y1: PT + PH, x2: PR, y2: PT + PH, stroke: 'var(--ink)', 'stroke-width': 1 }));
      const hotS = slabs.find(q => q.kind === 'hot'), coldS = slabs.find(q => q.kind === 'cold');
      const firstX = resSlabs[0].x0, lastX = resSlabs.at(-1).x1;
      const pts = [[hotS ? hotS.x0 : firstX, M.T[0]], [firstX, M.T[0]]];
      for (const sl of resSlabs) { pts.push([sl.x0, sl.Ta]); pts.push([sl.x1, sl.Tb]); }
      pts.push([lastX, M.T.at(-1)], [coldS ? coldS.x1 : lastX, M.T.at(-1)]);
      g.append(s('path', { d: pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${yT(p[1]).toFixed(1)}`).join(' '), fill: 'none', stroke: 'var(--covec)', 'stroke-width': 2.6, 'stroke-linejoin': 'round' }));
      if (show.tempLabels) {
        const bounds = [[resSlabs[0].x0, resSlabs[0].Ta]]; for (const sl of resSlabs) bounds.push([sl.x1, sl.Tb]);
        bounds.forEach(([bx, T], j) => {
          g.append(s('circle', { cx: bx, cy: yT(T), r: 3.2, fill: 'var(--covec)' }));
          const anchor = j === 0 ? 'start' : j === bounds.length - 1 ? 'end' : 'middle';
          const below = j === bounds.length - 1 && bounds.length > 1 && bounds[j - 1][1] > T;
          g.append(s('text', { x: bx + (j === 0 ? 4 : j === bounds.length - 1 ? -4 : 0), y: yT(T) + (below ? 15 : -7), 'font-size': 9.5, 'text-anchor': anchor, fill: 'var(--ink)', 'font-weight': 650 }, `${sig(T, 3)} ${U.temp}`));
        });
      }
      if (show.guides) for (const sl of resSlabs) for (const bx of [sl.x0, sl.x1]) g.append(s('line', { x1: bx, y1: PT, x2: bx, y2: LY, stroke: 'var(--muted)', 'stroke-width': 0.7, 'stroke-dasharray': '2 3', opacity: 0.7 }));
      g.append(s('text', { x: PL + 3, y: PT - 2, 'font-size': 9, fill: 'var(--muted)' }, `${Lb.temp} (${U.temp})`));
    }
    // flow arrow
    if (show.flowArrow) {
      const ay = AR + ARH / 2, x1 = PL + 6, x2 = PR - 6, flowRef = geo.ref ??= M.Q || 1;
      const q = M.Q / flowRef, wid = 2 + 9 * q / (1 + q);
      g.append(s('line', { x1, y1: ay, x2: x2 - 10, y2: ay, stroke: 'var(--covec)', 'stroke-width': wid, 'stroke-linecap': 'round' }),
        s('polygon', { fill: 'var(--covec)', points: `${x2},${ay} ${x2 - 6 - wid},${ay - 4 - wid / 2} ${x2 - 6 - wid},${ay + 4 + wid / 2}` }));
      g.append(s('text', { x: (x1 + x2) / 2, y: ay - wid / 2 - 3, 'font-size': 10.5, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 650 }, `${Lb.Q} = ${fmtP(M.Q, U.power)}`));
    }
    // blocks
    for (const sl of slabs) {
      if (sl.kind === 'hot' || sl.kind === 'cold') {
        const hot = sl.kind === 'hot';
        g.append(s('rect', { x: sl.x0, y: LY, width: sl.x1 - sl.x0, height: LH, fill: hot ? 'var(--covec)' : 'var(--vec)', opacity: 0.8 }),
          s('text', { x: (sl.x0 + sl.x1) / 2, y: LY + LH / 2, 'font-size': 9.5, fill: '#fff', 'font-weight': 700, 'text-anchor': 'middle', transform: `rotate(${hot ? -90 : 90} ${(sl.x0 + sl.x1) / 2} ${LY + LH / 2})` }, hot ? Lb.hot : Lb.cold));
      } else if (sl.kind === 'film') {
        g.append(s('rect', { x: sl.x0, y: LY, width: sl.x1 - sl.x0, height: LH, fill: 'var(--muted)', opacity: 0.18, stroke: 'var(--muted)', 'stroke-dasharray': '2 2' }));
      } else if (show.layers) {
        const i = sl.i, gap = lay[i].type === 'gap';
        g.append(s('rect', { x: sl.x0, y: LY, width: sl.x1 - sl.x0, height: LH, fill: colorOf(i), opacity: gap ? 0.12 : 0.4, stroke: colorOf(i), 'stroke-width': 1.5 }));
        if (gap) for (let hy = LY + 8; hy < LY + LH; hy += 10) g.append(s('line', { x1: sl.x0 + 2, y1: hy, x2: sl.x1 - 2, y2: hy, stroke: colorOf(i), 'stroke-width': 0.8, 'stroke-dasharray': '1 4', opacity: 0.8 }));
      }
    }
    // texts below layers
    for (const sl of geo.layers) {
      const i = sl.i, cx = (sl.x0 + sl.x1) / 2, w = sl.x1 - sl.x0;
      let yy = txtBase; const t = (txt, col, wt) => { g.append(s('text', { x: cx, y: yy, 'font-size': 9.5, 'text-anchor': 'middle', fill: col ?? 'var(--ink)', 'font-weight': wt ?? 500 }, txt)); yy += 13; };
      const l = st.layers[i];
      if (show.names) t(nameOf(i), colorOf(i), 700);
      if (show.kValues || show.thickness) {
        const parts = []; if (show.kValues) parts.push(l.h ? `h = ${sig(l.h)}` : `k = ${sig(l.k)}`); if (show.thickness && !l.h) parts.push(`${sig(l.L * scale)} ${U.length}`);
        t(parts.join(', '), 'var(--muted)');
      }
      if (show.resistances) t(`${Lb.layerR} = ${sig(sl.R)} K/W`, 'var(--ink)');
      if (show.handles && adjustable(i)) {
        const hx = sl.x1, hy = LY + LH / 2;
        g.append(s('rect', { x: hx - 4, y: hy - 12, width: 8, height: 24, rx: 3, fill: 'var(--bg, #fff)', stroke: 'var(--ink)', 'stroke-width': 1.3, style: 'cursor:ew-resize' }),
          s('line', { x1: hx - 1, y1: hy - 6, x2: hx - 1, y2: hy + 6, stroke: 'var(--ink)', 'stroke-width': 1 }), s('line', { x1: hx + 1.5, y1: hy - 6, x2: hx + 1.5, y2: hy + 6, stroke: 'var(--ink)', 'stroke-width': 1 }));
      }
    }
    // resistance bar
    if (show.resistanceBar) {
      const bx0 = PL, bw = PR - PL; let cx = bx0;
      g.append(s('rect', { x: bx0, y: BY, width: bw, height: BH, fill: 'none', stroke: 'var(--muted)' }));
      M.R.forEach((r, j) => {
        const isFilm = (M.hasHot && j === 0) || (M.hasCold && j === M.R.length - 1), i = j - li0;
        const w = r / M.Rtot * bw;
        g.append(s('rect', { x: cx, y: BY, width: w, height: BH, fill: isFilm ? 'var(--muted)' : colorOf(i), opacity: isFilm ? 0.35 : 0.75 }));
        if (w > 30) g.append(s('text', { x: cx + w / 2, y: BY + 10.5, 'font-size': 9, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 650 }, `${sig(r / M.Rtot * 100, 2)}%`));
        cx += w;
      });
      g.append(s('text', { x: PL, y: BY + BH + 11, 'font-size': 9, fill: 'var(--muted)' }, `${Lb.Rtot}: ${sig(M.Rtot)} K/W`));
    }
    svg.append(g);

    // readouts
    const lay2 = M.R.map((r, j) => ({ r, dT: M.Q * r, isFilm: (M.hasHot && j === 0) || (M.hasCold && j === M.R.length - 1) })).filter(q => !q.isFilm);
    const tau = cfg.body?.C ? cfg.body.C * M.Rtot : null;
    const val = { Q: fmtP(M.Q, U.power), flux: `${sig(M.flux)} ${U.power}/${U.area}`, Rtot: `${sig(M.Rtot)} K/W`, Rarea: `${sig(M.Rarea)} ${U.area}·K/W`,
      U: `${sig(M.U)} ${U.power}/(${U.area}·K)`, dT: `${sig(M.dT)} K`, tau: tau == null ? '–' : fmtTime(tau),
      layerR: lay2.map(q => sig(q.r)).join(' + ') + ' K/W', layerDT: lay2.map(q => sig(q.dT)).join(' + ') + ' K' };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    st.layers.forEach((l, i) => {
      if (inps.t[i]) { inps.t[i].value = l.L * scale; vals.t[i].textContent = `${sig(l.L * scale)} ${U.length}`; }
      if (inps.k[i]) { inps.k[i].value = Math.log10(l.k); vals.k[i].textContent = `${sig(l.k)}`; }
      if (sels[i]) sels[i].value = l.mat ?? '';
    });
    if (inps.hot) { inps.hot.value = st.Thot; vals.hot.textContent = `${num(st.Thot, 0)} ${U.temp}`; }
    if (inps.cold) { inps.cold.value = st.Tcold; vals.cold.textContent = `${num(st.Tcold, 0)} ${U.temp}`; }
    if (filmBtn) { filmBtn.textContent = st.films ? Lb.filmsOn : Lb.filmsOff; filmBtn.setAttribute('aria-pressed', String(st.films)); }
  }

  // controls
  const rd = {}, vals = { t: [], k: [] }, inps = { t: [], k: [] }, sels = [];
  const names = { Q: Lb.Q, flux: Lb.flux, Rtot: Lb.Rtot, Rarea: Lb.Rarea, U: Lb.U, dT: Lb.dT, tau: Lb.tau, layerR: Lb.layerR, layerDT: Lb.layerDT };
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const rows = [];
  lay.forEach((l, i) => {
    const nm = () => lay[i].name ?? `${i + 1}`;
    if (show.materialSelects && l.materials?.length) {
      const sel = sels[i] = h('select', { 'aria-label': `${nm()}` }, st.layers[i].mat ? '' : h('option', { value: '' }, '—'), l.materials.map(n => h('option', { value: n }, n)));
      sel.addEventListener('change', () => { const m = matOf(sel.value); st.layers[i].mat = sel.value; if (m?.h) { st.layers[i].h = m.h; } else if (m) { st.layers[i].k = m.k; st.layers[i].h = undefined; } redraw(); });
      rows.push(h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(l.name ?? `${i + 1}`)), sel, h('span', { class: 'fs-num' })));
    }
    if (show.thicknessSliders && adjustable(i)) {
      const [lo, hi, step] = rangeOf(i);
      const inp = inps.t[i] = h('input', { type: 'range', min: lo, max: hi, step, value: st.layers[i].L * scale, 'aria-label': `${Lb.thickness} ${nm()}` });
      inp.addEventListener('input', () => { st.layers[i].L = +inp.value / scale; redraw(); });
      rows.push(h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(`${Lb.thickness}${lay.length > 1 ? ' · ' + nm() : ''}`)), inp, vals.t[i] = h('span', { class: 'fs-num' })));
    }
    if (show.kSliders && !l.h) {
      const [lo, hi] = kRange(i);
      const inp = inps.k[i] = h('input', { type: 'range', min: Math.log10(lo), max: Math.log10(hi), step: 0.01, value: Math.log10(st.layers[i].k), 'aria-label': `${Lb.k} ${nm()}` });
      inp.addEventListener('input', () => { st.layers[i].k = Math.pow(10, +inp.value); st.layers[i].mat = null; redraw(); });
      rows.push(h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(`${Lb.k}${lay.length > 1 ? ' · ' + nm() : ''}`)), inp, vals.k[i] = h('span', { class: 'fs-num' })));
    }
  });
  if (show.tempSliders) for (const key of ['hot', 'cold']) {
    const K = key === 'hot' ? 'Thot' : 'Tcold';
    const inp = inps[key] = h('input', { type: 'range', min: trange[0], max: trange[1], step: trange[2], value: st[K], 'aria-label': Lb[key] });
    inp.addEventListener('input', () => { st[K] = +inp.value; redraw(); });
    rows.push(h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(Lb[key])), inp, vals[key] = h('span', { class: 'fs-num' })));
  }
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const filmBtn = show.filmToggle ? btn(Lb.filmsOff, () => { st.films = !st.films; redraw(); }) : null;
  const apply = p => {
    if (p.Thot != null) st.Thot = p.Thot; if (p.Tcold != null) st.Tcold = p.Tcold; if (p.films != null) st.films = !!p.films;
    (p.layers ?? []).forEach((c, i) => { const l = st.layers[i]; if (!l) return; if (c.L != null) l.L = c.L / scale; if (c.k != null) { l.k = c.k; l.mat = null; } if (c.h != null) l.h = c.h; });
    (p.materials ?? []).forEach((n, i) => { const m = matOf(n), l = st.layers[i]; if (!m || !l) return; l.mat = n; if (m.h) l.h = m.h; else { l.k = m.k; l.h = undefined; } });
    redraw();
  };
  const btns = h('div', { class: 'wbtns' }, filmBtn ?? '', show.presets ? (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))) : '',
    show.reset ? btn(Lb.reset, () => { Object.assign(st, JSON.parse(JSON.stringify(init))); redraw(); }) : '');
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', rows.length ? h('div', { class: 'fs-sliders' }, rows) : '', btns);

  // drag the right edge of a layer (touch and mouse)
  let drag = null;
  const svgX = e => { const r = svg.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; };
  svg.addEventListener('pointerdown', e => {
    if (!show.handles || !geo) return;
    const px = svgX(e); let best = null, bd = 18;
    for (const sl of geo.layers) if (adjustable(sl.i) && Math.abs(sl.x1 - px) < bd) { bd = Math.abs(sl.x1 - px); best = sl; }
    if (!best) return;
    drag = { i: best.i, x0: px, L0: st.layers[best.i].L, per: geo.sumL / geo.avail };
    svg.setPointerCapture(e.pointerId); svg.style.touchAction = 'none'; e.preventDefault();
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const [lo, hi, step] = rangeOf(drag.i);
    let v = (drag.L0 + (svgX(e) - drag.x0) * drag.per * 1.6) * scale;
    v = Math.min(hi, Math.max(lo, Math.round(v / step) * step));
    st.layers[drag.i].L = v / scale; redraw();
  });
  const end = () => { drag = null; svg.style.touchAction = 'pan-y'; };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);

  function redraw() { svg.replaceChildren(); paint(); }
  redraw();
}
