// heat-pump-flow
//
// A heat pump / refrigerator as an energy flow: heat Qc is taken from a cold box at Tc, work W is put in by a compressor, and Qh = Qc + W is
// delivered to a warm room at Th.  Plain SVG + HTML, every word and unit from the config (no course text hard-coded).
// Model (temperatures given in degrees, converted to kelvin by +273.15 in every formula):
//   Carnot limits:   COP_c,max = Tc / (Th - Tc)      COP_h,max = Th / (Th - Tc) = COP_c,max + 1
//   achieved:        COP_c = factor * COP_c,max       (mode 'factor': the fraction of the Carnot limit)   or a fixed COP_c = cop (mode 'cop')
//   flows:           W = Qc / COP_c,   Qh = Qc + W,   COP_h = Qh / W = COP_c + 1
//   work per 100 of heat moved:  100 / COP_c         (per 100 delivered to the room: 100 / COP_h)
//
//   Tc: 4, Th: 22                           start temperatures (degrees)
//   factor: 0.4                             start fraction of the Carnot limit (mode 'factor', the default)
//   cop: 3                                  giving it selects mode 'cop': fixed COP_c, the fraction is then a readout
//   tempRange: { cold: [lo, hi, step], hot: [lo, hi, step] }     temperature sliders and drag range
//   factorRange: [0.05, 1, 0.01]            copRange: [0.5, 12, 0.1]
//   qc: { value: 100, min, max, step }      heat moved (in `units.heat`); the slider is shown with show.qcSlider (then use units.heat 'W' for a power)
//   units: { temp: '°C', heat: 'J' }
//   show: { coldBox, room, pump, arrowQc, arrowW, arrowQh, arrowLabels, tempLabels, badge, limitWarning, readouts, tempSliders, factorSlider,
//           copSlider, qcSlider, handles, presets, reset }
//       default true except qcSlider (false); coldBox / room = the two boxes; pump = the compressor circle; arrowQc / arrowW / arrowQh = the
//       three flow arrows (width proportional to the flow, minimum 1.5 px); arrowLabels = the name and value above each arrow;
//       tempLabels = the temperature under each box; badge = the text strip `labels.badge`; limitWarning = the strip `labels.beyond` shown when a
//       fixed COP exceeds the Carnot limit; readouts = the readout cells; tempSliders = cold and hot sliders; factorSlider = the fraction slider
//       (mode 'factor'); copSlider = the COP slider (mode 'cop'); qcSlider = heat-moved slider; handles = drag a box up or down to change
//       its temperature (mouse or touch); presets = preset buttons; reset = reset button.
//   readouts: any of copC, copH, carnotC, carnotH, factor, work100, work100H, Qc, W, Qh   (default copC, copH, carnotC, work100)
//   presets: [{ label, Tc, Th, factor, cop, qc }]
//   labels: { copC, copH, carnotC, carnotH, factor, work100, work100H, Qc, W, Qh, cold, room, pump, badge, beyond, factorSlider, copSlider, qcSlider,
//             tempCold, tempHot, reset, aria }

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };
const num = (v, d = 2) => String(Number((+v).toFixed(d)));
const sig = (v, n = 3) => { if (!Number.isFinite(v)) return '–'; if (v === 0) return '0'; const p = Math.pow(10, n - 1 - Math.floor(Math.log10(Math.abs(v)))); return String(Math.round(v * p) / p); };
const K0 = 273.15;

// Pure model, exported for script checks.  Tc, Th in degrees Celsius; give factor (fraction of Carnot) or cop (fixed COP_cooling).
export function pumpModel({ Tc, Th, factor = null, cop = null, Qc = 100 }) {
  const TcK = Tc + K0, ThK = Th + K0, gap = Th - Tc;
  const carnotC = TcK / gap, carnotH = ThK / gap;
  const copC = cop != null ? cop : factor * carnotC;
  const W = Qc / copC, Qh = Qc + W;
  return { TcK, ThK, gap, carnotC, carnotH, copC, copH: copC + 1, factor: copC / carnotC, W, Qh, work100: 100 / copC, work100H: 100 / (copC + 1) };
}

export function heatPumpFlow(el, cfg) {
  const Lb = { copC: 'COP (cooling) = Qc/W', copH: 'COP (heating) = Qh/W', carnotC: 'Carnot limit (cooling)', carnotH: 'Carnot limit (heating)', factor: 'Fraction of Carnot',
    work100: 'Work per 100 of heat moved', work100H: 'Work per 100 delivered', Qc: 'Heat moved', W: 'Work needed', Qh: 'Heat delivered', cold: 'cold', room: 'warm', pump: 'pump',
    badge: '', beyond: '', factorSlider: 'Fraction of Carnot', copSlider: 'COP', qcSlider: 'Heat to move', tempCold: 'Cold side', tempHot: 'Warm side',
    reset: 'Reset', aria: 'Heat pump energy flow', ...(cfg.labels ?? {}) };
  const show = { coldBox: true, room: true, pump: true, arrowQc: true, arrowW: true, arrowQh: true, arrowLabels: true, tempLabels: true, badge: true, limitWarning: true,
    readouts: true, tempSliders: true, factorSlider: true, copSlider: true, qcSlider: false, handles: true, presets: true, reset: true, ...(cfg.show ?? {}) };
  const U = { temp: '°C', heat: 'J', ...(cfg.units ?? {}) };
  const fixedCop = cfg.cop != null;
  const tr = { cold: [-30, 20, 1], hot: [0, 40, 1], ...(cfg.tempRange ?? {}) };
  const fr = cfg.factorRange ?? [0.05, 1, 0.01], cr = cfg.copRange ?? [0.5, 12, 0.1];
  const qcfg = { value: 100, min: 10, max: 1000, step: 10, ...(cfg.qc ?? {}) };
  const reads = cfg.readouts ?? ['copC', 'copH', 'carnotC', 'work100'];
  const init = { Tc: cfg.Tc ?? 4, Th: cfg.Th ?? 22, factor: cfg.factor ?? 0.4, cop: cfg.cop ?? 3, Qc: qcfg.value };
  const st = { ...init };
  const model = () => pumpModel({ Tc: st.Tc, Th: st.Th, factor: fixedCop ? null : st.factor, cop: fixedCop ? st.cop : null, Qc: st.Qc });
  const clampGap = () => { st.Tc = Math.min(st.Tc, st.Th - 1); };

  // geometry (px)
  const W = 360, BT = show.badge && Lb.badge ? 28 : 8, BH = 100, BW = 70, PX = 180, PW = 28;
  const midY = BT + 10 + BH / 2, bottom = BT + 10 + BH;
  const H = bottom + (show.tempLabels ? 30 : 12) + (show.limitWarning && fixedCop ? 22 : 0);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fs-svg', role: 'img', 'aria-label': Lb.aria, style: 'touch-action:pan-y' });
  const refQh = (() => { const m = pumpModel({ Tc: init.Tc, Th: init.Th, factor: fixedCop ? null : init.factor, cop: fixedCop ? init.cop : null, Qc: init.Qc }); return m.Qh; })();
  const widOf = q => Math.min(16, Math.max(1.5, 16 * q / refQh * 0.7));

  const arrow = (x1, y1, x2, y2, wid, col) => {
    const a = Math.atan2(y2 - y1, x2 - x1), hl = 7 + wid * 0.5, hw = 4 + wid * 0.9, ex = x2 - Math.cos(a) * hl, ey = y2 - Math.sin(a) * hl;
    const nx = -Math.sin(a), ny = Math.cos(a);
    return s('g', {}, s('line', { x1, y1, x2: ex, y2: ey, stroke: col, 'stroke-width': wid, 'stroke-linecap': 'butt' }),
      s('polygon', { fill: col, points: `${x2},${y2} ${ex + nx * hw},${ey + ny * hw} ${ex - nx * hw},${ey - ny * hw}` }));
  };
  const label = (x, y, name, value, anchor = 'middle') => [
    s('text', { x, y: y - 10, 'font-size': 9, 'text-anchor': anchor, fill: 'var(--muted)', 'font-weight': 650 }, name),
    s('text', { x, y, 'font-size': 9.5, 'text-anchor': anchor, fill: 'var(--ink)', 'font-weight': 700 }, value)];

  function paint() {
    const M = model(), g = s('g');
    if (show.badge && Lb.badge) {
      g.append(s('rect', { x: 14, y: 4, width: W - 28, height: 20, rx: 10, fill: 'var(--muted)', opacity: 0.16 }),
        s('text', { x: W / 2, y: 18, 'font-size': 10.5, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 700 }, Lb.badge));
    }
    const boxes = [['cold', 14, 'var(--vec)', Lb.cold, st.Tc, M.TcK], ['room', W - 14 - BW, 'var(--covec)', Lb.room, st.Th, M.ThK]];
    for (const [key, x0, col, name, T, TK] of boxes) {
      if (!(key === 'cold' ? show.coldBox : show.room)) continue;
      g.append(s('rect', { x: x0, y: BT + 10, width: BW, height: BH, rx: 6, fill: col, opacity: 0.22, stroke: col, 'stroke-width': 1.6 }),
        s('text', { x: x0 + BW / 2, y: midY + 4, 'font-size': 11, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 700 }, name));
      if (show.handles) g.append(s('rect', { x: x0 + BW / 2 - 14, y: BT + 6, width: 28, height: 8, rx: 4, fill: 'var(--bg, #fff)', stroke: 'var(--ink)', 'stroke-width': 1.2, style: 'cursor:ns-resize' }));
      if (show.tempLabels) g.append(s('text', { x: x0 + BW / 2, y: bottom + 16, 'font-size': 9.5, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 650 }, `${num(T, 1)} ${U.temp} (${num(TK, 2)} K)`));
    }
    const xl = 14 + BW, xr = W - 14 - BW;
    if (show.pump) {
      g.append(s('circle', { cx: PX, cy: midY, r: PW, fill: 'var(--basis)', opacity: 0.2, stroke: 'var(--basis)', 'stroke-width': 1.8 }),
        s('text', { x: PX, y: midY + 3.5, 'font-size': 9.5, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 700 }, Lb.pump));
    }
    const wQc = widOf(st.Qc), wW = widOf(M.W), wQh = widOf(M.Qh);
    if (show.arrowQc) {
      g.append(arrow(xl + 2, midY, PX - PW - 2, midY, wQc, 'var(--vec)'));
      if (show.arrowLabels) g.append(...label((xl + PX - PW) / 2, midY - 22, Lb.Qc, `${sig(st.Qc)} ${U.heat}`));
    }
    if (show.arrowQh) {
      g.append(arrow(PX + PW + 2, midY, xr - 2, midY, wQh, 'var(--covec)'));
      if (show.arrowLabels) g.append(...label((xr + PX + PW) / 2, midY - 22, Lb.Qh, `${sig(M.Qh)} ${U.heat}`));
    }
    if (show.arrowW) {
      g.append(arrow(PX, bottom + 2, PX, midY + PW + 2, wW, 'var(--basis)'));
      if (show.arrowLabels) g.append(...label(PX + 18, bottom - 8, Lb.W, `${sig(M.W)} ${U.heat}`, 'start'));
    }
    if (show.limitWarning && fixedCop && M.factor > 1.0001 && Lb.beyond) {
      g.append(s('rect', { x: 14, y: H - 22, width: W - 28, height: 18, rx: 9, fill: 'var(--covec)', opacity: 0.2 }),
        s('text', { x: W / 2, y: H - 9, 'font-size': 10, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 700 }, Lb.beyond));
    }
    svg.append(g);

    const val = { copC: sig(M.copC), copH: sig(M.copH), carnotC: sig(M.carnotC), carnotH: sig(M.carnotH), factor: `${sig(M.factor * 100, 3)} %`,
      work100: `${sig(M.work100)} ${U.heat}`, work100H: `${sig(M.work100H)} ${U.heat}`, Qc: `${sig(st.Qc)} ${U.heat}`, W: `${sig(M.W)} ${U.heat}`, Qh: `${sig(M.Qh)} ${U.heat}` };
    for (const key of reads) if (rd[key]) rd[key].textContent = val[key] ?? '';
    if (inps.cold) { inps.cold.value = st.Tc; vals.cold.textContent = `${num(st.Tc, 0)} ${U.temp}`; }
    if (inps.hot) { inps.hot.value = st.Th; vals.hot.textContent = `${num(st.Th, 0)} ${U.temp}`; }
    if (inps.factor) { inps.factor.value = st.factor; vals.factor.textContent = `${sig(st.factor * 100, 3)} %`; }
    if (inps.cop) { inps.cop.value = st.cop; vals.cop.textContent = sig(st.cop); }
    if (inps.qc) { inps.qc.value = st.Qc; vals.qc.textContent = `${sig(st.Qc)} ${U.heat}`; }
  }

  // controls
  const rd = {}, vals = {}, inps = {};
  const names = { copC: Lb.copC, copH: Lb.copH, carnotC: Lb.carnotC, carnotH: Lb.carnotH, factor: Lb.factor, work100: Lb.work100, work100H: Lb.work100H, Qc: Lb.Qc, W: Lb.W, Qh: Lb.Qh };
  const readEl = h('div', { class: 'fs-reads' }, reads.map(k => h('div', { class: 'fs-cell' }, h('div', { class: 'fs-lab' }, mdInline(names[k] ?? k)), rd[k] = h('div', { class: 'fs-num', role: 'status' }))));
  const rows = [];
  const slider = (key, text, [lo, hi, step], get, set) => {
    const inp = inps[key] = h('input', { type: 'range', min: lo, max: hi, step, value: get(), 'aria-label': text });
    inp.addEventListener('input', () => { set(+inp.value); redraw(); });
    rows.push(h('label', { class: 'fs-slide' }, h('span', { class: 'fs-lab' }, mdInline(text)), inp, vals[key] = h('span', { class: 'fs-num' })));
  };
  if (show.tempSliders) {
    slider('cold', Lb.tempCold, tr.cold, () => st.Tc, v => { st.Tc = v; if (st.Th < v + 1) st.Th = v + 1; });
    slider('hot', Lb.tempHot, tr.hot, () => st.Th, v => { st.Th = v; clampGap(); });
  }
  if (show.factorSlider && !fixedCop) slider('factor', Lb.factorSlider, fr, () => st.factor, v => { st.factor = v; });
  if (show.copSlider && fixedCop) slider('cop', Lb.copSlider, cr, () => st.cop, v => { st.cop = v; });
  if (show.qcSlider) slider('qc', Lb.qcSlider, [qcfg.min, qcfg.max, qcfg.step], () => st.Qc, v => { st.Qc = v; });
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const apply = p => {
    if (p.Tc != null) st.Tc = p.Tc; if (p.Th != null) st.Th = p.Th; if (p.factor != null) st.factor = p.factor; if (p.cop != null) st.cop = p.cop; if (p.qc != null) st.Qc = p.qc;
    if (st.Th < st.Tc + 1) st.Th = st.Tc + 1; redraw();
  };
  const btns = h('div', { class: 'wbtns' }, show.presets ? (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))) : '',
    show.reset ? btn(Lb.reset, () => { Object.assign(st, init); redraw(); }) : '');
  el.append(h('div', { class: 'fs-fig' }, svg), show.readouts && reads.length ? readEl : '', rows.length ? h('div', { class: 'fs-sliders' }, rows) : '', btns);

  // drag a box up or down to change its temperature (touch and mouse)
  let drag = null;
  const svgPt = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  svg.addEventListener('pointerdown', e => {
    if (!show.handles) return;
    const [px, py] = svgPt(e);
    if (py < BT - 4 || py > bottom + 4) return;
    const side = px < W / 2 ? 'cold' : 'room';
    if ((side === 'cold' && (!show.coldBox || px > 14 + BW + 6)) || (side === 'room' && (!show.room || px < W - 14 - BW - 6))) return;
    drag = { side, y0: py, T0: side === 'cold' ? st.Tc : st.Th };
    svg.setPointerCapture(e.pointerId); svg.style.touchAction = 'none'; e.preventDefault();
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const [, py] = svgPt(e), [lo, hi, step] = tr[drag.side === 'cold' ? 'cold' : 'hot'];
    const T = Math.min(hi, Math.max(lo, Math.round((drag.T0 + (drag.y0 - py) * (hi - lo) / 160) / step) * step));
    if (drag.side === 'cold') { st.Tc = T; if (st.Th < T + 1) st.Th = T + 1; } else { st.Th = T; clampGap(); }
    redraw();
  });
  const end = () => { drag = null; svg.style.touchAction = 'pan-y'; };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);

  function redraw() { svg.replaceChildren(); paint(); }
  redraw();
}
