// chsh-lab
//
// The CHSH test for two spin-1/2 particles in the singlet state. Alice measures along an axis at angle
// a or a', Bob along b or b' (all in one plane, angles in degrees). The correlation of two analysers is
//   E(x, y) = -cos(x - y)                       (quantum, singlet)
//   S = E(a,b) - E(a,b') + E(a',b) + E(a',b')
// Any local hidden-variable model has |S| <= 2; quantum mechanics reaches 2 sqrt(2) = 2.83.
//   preset: 'best' | 'free' | 'curve'   starting point (see PRESETS below); every other key overrides it
// Config (all wording from the config; every drawn element has a switch):
//   angles: { a, aP, b, bP }       starting angles in degrees (default 0, 90, 45, 135 = the best choice)
//   names:  { a, aP, b, bP }       labels of the four analysers (default a, a', b, b'; plain text)
//   owners: { alice, bob }         titles above the two dials (default Alice, Bob)
//   draggable: true                handles on the dials can be dragged (false: angles fixed on the dials)
//   sliders: false                 one angle slider per analyser (0 to 360)
//   show: { dials, angleLabels, angleValues, curve, localCurve, curveMarkers, curveTicks, axisLabels,
//           gauge, boundLocal, boundQuantum, gaugeTicks }
//        all default true.
//        dials = the two circles with the four analyser arrows; angleLabels = names next to the arrows;
//        angleValues = the angle in degrees added to each name; curve = plot of E against the angle
//        difference; localCurve = the straight-line local model drawn with it; curveMarkers = the four
//        pairs (a,b) (a,b') (a',b) (a',b') as dots on the curve; curveTicks = tick numbers on its axes;
//        axisLabels = names of its axes; gauge = the |S| bar; boundLocal / boundQuantum = the markers at
//        2 and 2 sqrt 2 on the bar; gaugeTicks = numbers under the bar.
//   readouts: ['ab','abP','aPb','aPbP','S','verdict']   rows in order ([] = none); default the five
//        correlations/S rows without 'verdict'. 'verdict' says beyond / within the local bound.
//   labels: { curveX, curveY, local, quantum, within, beyond, gauge, localCurve, quantumCurve }   wording
//   decimals: 2
//   Reports nothing to the card.

import { h } from '../dom.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const RAD = Math.PI / 180, QMAX = 2 * Math.SQRT2;
const mod = d => ((d % 360) + 360) % 360;
const E = (x, y) => -Math.cos((x - y) * RAD);
const Elocal = d => { const t = Math.min(mod(d), 360 - mod(d)); return -1 + 2 * t / 180; };

// Named presets (cfg.preset); any other key in the config overrides the preset's value (show is merged).
const PRESETS = {
  best: { draggable: false, readouts: ['ab', 'abP', 'aPb', 'aPbP', 'S'], show: { curve: false } },   // fixed best angles, S = -2.83, gauge
  free: { draggable: true, sliders: true, readouts: ['ab', 'abP', 'aPb', 'aPbP', 'S', 'verdict'] },    // everything, free play
  curve: { readouts: [], show: { dials: false, gauge: false, curveMarkers: false } },                  // only E against the angle difference
};

export function chshLab(el, cfg0) {
  const pr = PRESETS[cfg0.preset] ?? {};
  const cfg = { ...pr, ...cfg0, show: { ...(pr.show ?? {}), ...(cfg0.show ?? {}) } };
  const A0 = { a: 0, aP: 90, b: 45, bP: 135, ...(cfg.angles ?? {}) };
  const N = { a: 'a', aP: "a'", b: 'b', bP: "b'", ...(cfg.names ?? {}) };
  const O = { alice: 'Alice', bob: 'Bob', ...(cfg.owners ?? {}) };
  const sh = { dials: true, angleLabels: true, angleValues: true, curve: true, localCurve: true, curveMarkers: true, curveTicks: true, axisLabels: true,
    gauge: true, boundLocal: true, boundQuantum: true, gaugeTicks: true, ...(cfg.show ?? {}) };
  const L = { curveX: 'angle difference (degrees)', curveY: 'correlation E', local: 'local bound 2', quantum: 'quantum maximum 2.83',
    within: 'Within the local bound', beyond: 'Beyond the local bound', gauge: '|S|', localCurve: 'local model', quantumCurve: 'quantum', ...(cfg.labels ?? {}) };
  const rows = cfg.readouts ?? ['ab', 'abP', 'aPb', 'aPbP', 'S'];
  const dec = cfg.decimals ?? 2, f = v => v.toFixed(dec).replace('-', '−');
  const ang = { a: mod(A0.a), aP: mod(A0.aP), b: mod(A0.b), bP: mod(A0.bP) };
  const drag = cfg.draggable !== false;
  const COL = { a: 'var(--vec)', aP: 'var(--basis)', b: 'var(--covec)', bP: 'var(--bad)' };

  el.classList.add('chsh');
  const parts = [];

  // ---- dials
  const DW = 480, DH = 215, R = 68, CY = 126, C = { alice: 120, bob: 360 };
  const gDial = sv('g'), svgD = sv('svg', { viewBox: `0 0 ${DW} ${DH}`, class: 'chsh-svg', role: 'img', 'aria-label': 'Analyser directions of Alice and Bob' });
  svgD.append(gDial);
  const hd = {};
  function drawDials() {
    gDial.replaceChildren();
    for (const [who, cx] of [['alice', C.alice], ['bob', C.bob]]) {
      const t = sv('text', { x: cx, y: 15, class: 'chsh-ttl', 'text-anchor': 'middle' }); t.textContent = O[who]; gDial.append(t);
      gDial.append(sv('circle', { cx, cy: CY, r: R, class: 'chsh-ring' }), sv('line', { x1: cx - R, x2: cx + R, y1: CY, y2: CY, class: 'chsh-ref' }));
      for (const k of who === 'alice' ? ['a', 'aP'] : ['b', 'bP']) {
        const th = ang[k] * RAD, x = cx + R * Math.cos(th), y = CY - R * Math.sin(th);
        gDial.append(sv('line', { x1: cx, y1: CY, x2: x, y2: y, class: 'chsh-arm', stroke: COL[k] }));
        const dot = sv('circle', { cx: x, cy: y, r: drag ? 9 : 6, class: drag ? 'w-handle chsh-handle' : 'chsh-dot', fill: COL[k], 'data-k': k });
        if (drag) {
          dot.addEventListener('pointerdown', ev => { hd.k = k; hd.cx = cx; dot.setPointerCapture?.(ev.pointerId); ev.preventDefault(); });
          dot.addEventListener('pointermove', ev => {
            if (hd.k !== k) return;
            const r = svgD.getBoundingClientRect(), s = DW / r.width;
            const px = (ev.clientX - r.left) * s - cx, py = (ev.clientY - r.top) * s - CY;
            ang[k] = mod(Math.round(Math.atan2(-py, px) / RAD)); update();
          });
          const end = () => { hd.k = null; };
          dot.addEventListener('pointerup', end); dot.addEventListener('pointercancel', end);
        }
        gDial.append(dot);
        if (sh.angleLabels) {
          const lx = cx + (R + 22) * Math.cos(th), ly = CY - (R + 22) * Math.sin(th);
          const lab = sv('text', { x: lx, y: ly + 4, class: 'chsh-lab', 'text-anchor': 'middle', fill: COL[k] });
          lab.textContent = N[k] + (sh.angleValues ? ` ${Math.round(ang[k])}°` : '');
          gDial.append(lab);
        }
      }
    }
  }
  if (sh.dials) parts.push(svgD);

  // ---- E curve
  const CW = 480, CH = 230, X0 = 52, X1 = 462, Y0 = 12, Y1 = 188;
  const cx_ = d => X0 + d / 360 * (X1 - X0), cy_ = e => Y1 - (e + 1) / 2 * (Y1 - Y0);
  const svgC = sv('svg', { viewBox: `0 0 ${CW} ${CH}`, class: 'chsh-svg', role: 'img', 'aria-label': 'Correlation against angle difference' });
  const gC = sv('g'); svgC.append(gC);
  function drawCurve() {
    gC.replaceChildren();
    for (const e of [-1, 0, 1]) {
      gC.append(sv('line', { x1: X0, x2: X1, y1: cy_(e), y2: cy_(e), class: 'chsh-grid' }));
      if (sh.curveTicks) { const t = sv('text', { x: X0 - 6, y: cy_(e) + 4, class: 'chsh-tl', 'text-anchor': 'end' }); t.textContent = e.toString().replace('-', '−'); gC.append(t); }
    }
    for (const d of [0, 90, 180, 270, 360]) {
      gC.append(sv('line', { x1: cx_(d), x2: cx_(d), y1: Y0, y2: Y1, class: 'chsh-grid' }));
      if (sh.curveTicks) { const t = sv('text', { x: cx_(d), y: Y1 + 16, class: 'chsh-tl', 'text-anchor': 'middle' }); t.textContent = d + '°'; gC.append(t); }
    }
    gC.append(sv('line', { x1: X0, x2: X0, y1: Y0, y2: Y1, class: 'chsh-axis' }), sv('line', { x1: X0, x2: X1, y1: Y1, y2: Y1, class: 'chsh-axis' }));
    if (sh.axisLabels) {
      const tx = sv('text', { x: (X0 + X1) / 2, y: CH - 8, class: 'chsh-al', 'text-anchor': 'middle' }); tx.textContent = L.curveX;
      const ty = sv('text', { x: 13, y: (Y0 + Y1) / 2, class: 'chsh-al', 'text-anchor': 'middle', transform: `rotate(-90 13 ${(Y0 + Y1) / 2})` }); ty.textContent = L.curveY;
      gC.append(tx, ty);
    }
    const path = (fn, cls) => { let d = ''; for (let i = 0; i <= 180; i++) { const t = i * 2; d += `${i ? 'L' : 'M'}${cx_(t).toFixed(1)} ${cy_(fn(t)).toFixed(1)}`; } gC.append(sv('path', { d, class: cls, fill: 'none' })); };
    if (sh.localCurve) path(Elocal, 'chsh-local');
    path(d => -Math.cos(d * RAD), 'chsh-q');
    if (sh.curveMarkers) {
      for (const [x, y, col] of [['a', 'b', COL.a], ['a', 'bP', COL.aP], ['aP', 'b', COL.b], ['aP', 'bP', COL.bP]]) {
        const d = mod(ang[x] - ang[y]);
        gC.append(sv('circle', { cx: cx_(d), cy: cy_(E(ang[x], ang[y])), r: 5.5, class: 'chsh-mk', fill: col }));
      }
    }
    if (sh.localCurve) {
      {
        const l1 = sv('text', { x: X1 - 4, y: Y0 + 12, class: 'chsh-tl chsh-lg-q', 'text-anchor': 'end' }); l1.textContent = L.quantumCurve;
        const l2 = sv('text', { x: X1 - 4, y: Y0 + 28, class: 'chsh-tl chsh-lg-l', 'text-anchor': 'end' }); l2.textContent = L.localCurve;
        gC.append(l1, l2);
      }
    }
  }
  if (sh.curve) parts.push(svgC);

  // ---- gauge
  const GW = 480, GH = 100, G0 = 20, G1 = 460, GMAX = 3, gx = v => G0 + v / GMAX * (G1 - G0);
  const svgG = sv('svg', { viewBox: `0 0 ${GW} ${GH}`, class: 'chsh-svg chsh-gsvg', role: 'img', 'aria-label': '|S| against the bounds' });
  const gG = sv('g'); svgG.append(gG);
  function drawGauge(S) {
    gG.replaceChildren();
    const y = 30, hgt = 16, v = Math.min(GMAX, Math.abs(S));
    gG.append(sv('rect', { x: G0, y, width: G1 - G0, height: hgt, rx: 4, class: 'chsh-gbg' }));
    gG.append(sv('rect', { x: G0, y, width: gx(v) - G0, height: hgt, rx: 4, class: Math.abs(S) > 2 + 1e-9 ? 'chsh-gfill chsh-gbeyond' : 'chsh-gfill' }));
    const mark = (val, txt, below) => {
      gG.append(sv('line', { x1: gx(val), x2: gx(val), y1: y - 8, y2: y + hgt + (below ? 24 : 6), class: 'chsh-gmark' }));
      const t = sv('text', { x: Math.min(gx(val), GW - 6), y: below ? y + hgt + 38 : y - 12, class: 'chsh-tl', 'text-anchor': below ? 'end' : 'middle' }); t.textContent = txt; gG.append(t);
    };
    if (sh.boundLocal) mark(2, L.local);
    if (sh.boundQuantum) mark(QMAX, L.quantum, true);
    if (sh.gaugeTicks) for (const t of [0, 1, 2, 3]) { const e = sv('text', { x: gx(t), y: y + hgt + 20, class: 'chsh-tl', 'text-anchor': 'middle' }); e.textContent = t; gG.append(e); }
    const gl = sv('text', { x: G0, y: 11, class: 'chsh-al' }); gl.textContent = `${L.gauge} = ${Math.abs(S).toFixed(dec)}`; gG.append(gl);
  }
  if (sh.gauge) parts.push(svgG);

  // ---- readouts
  const rd = h('div', { class: 'readout chsh-read', role: 'status' });
  if (rows.length) parts.push(rd);

  // ---- sliders
  const sl = {};
  if (cfg.sliders) {
    const box = h('div', { class: 'chsh-sliders' });
    for (const k of ['a', 'aP', 'b', 'bP']) {
      const inp = h('input', { type: 'range', min: 0, max: 360, step: 1, 'aria-label': N[k] });
      const val = h('span', { class: 'chsh-sv' });
      inp.addEventListener('input', () => { ang[k] = +inp.value % 360; update(); });
      sl[k] = { inp, val };
      box.append(h('label', { class: 'chsh-slide' }, h('span', { class: 'chsh-sl', style: `color:${COL[k]}` }, N[k]), inp, val));
    }
    parts.push(box);
  }
  el.append(...parts);

  function update() {
    const eab = E(ang.a, ang.b), eabP = E(ang.a, ang.bP), eaPb = E(ang.aP, ang.b), eaPbP = E(ang.aP, ang.bP);
    const S = eab - eabP + eaPb + eaPbP;
    if (sh.dials) drawDials();
    if (sh.curve) drawCurve();
    if (sh.gauge) drawGauge(S);
    const nm = k => N[k];
    const get = {
      ab: [`E(${nm('a')}, ${nm('b')})`, f(eab)], abP: [`E(${nm('a')}, ${nm('bP')})`, f(eabP)],
      aPb: [`E(${nm('aP')}, ${nm('b')})`, f(eaPb)], aPbP: [`E(${nm('aP')}, ${nm('bP')})`, f(eaPbP)],
      S: ['S', f(S)],
    };
    const cells = [];
    for (const k of rows) {
      let c;
      if (k === 'verdict') c = h('div', { class: 'chsh-cell' }, h('b', { class: Math.abs(S) > 2 + 1e-9 ? 'chsh-beyond' : 'chsh-within' }, Math.abs(S) > 2 + 1e-9 ? L.beyond : L.within));
      else if (get[k]) c = h('div', { class: 'chsh-cell' }, h('span', { class: 'chsh-lab2' }, get[k][0]), ' = ', h('b', {}, get[k][1]));
      else continue;
      cells.push(c);
    }
    rd.replaceChildren(...cells);
    for (const k in sl) { sl[k].inp.value = ang[k]; sl[k].val.textContent = `${Math.round(ang[k])}°`; }
  }
  update();
}
