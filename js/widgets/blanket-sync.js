// blanket-sync
//
// Synchrony between two sets of states that are independent given a third value b (the blanket).
// Linear-Gaussian model:  b ~ N(0, sdB^2),
//   x  | b ~ N(slopeX  * b, noiseX^2)       (horizontal axis, e.g. external states)
//   mu | b ~ N(slopeMu * sign * b, noiseMu^2)   (vertical axis, e.g. internal states)
// x and mu are drawn INDEPENDENTLY given b. Over many values of b they still correlate (the thick
// line of conditional means). Three readouts: the sample correlation of the cloud; "condition on b"
// (a slider picks b, a small cloud shows the slice: no correlation left, axis-aligned spread);
// and a slider for a mean internal value muBar that draws the implied distribution of x
// (mean and spread, exact Gaussian conditioning) next to the numbers. No maths text is hard-coded.
//
//   slopeX: 1, slopeMu: 1, sign: 1      mean x = slopeX*b ; mean mu = sign*slopeMu*b
//   noiseX: 0.5, noiseMu: 0.5, sdB: 1   spreads
//   n: 150, seed: 3, maxN: 900          samples drawn at first, per click of "more", cap
//   range: 4                            half-width of both axes
//   b: 1                                start value of the slice slider; muBar: 1 start of the muBar slider
//   conditioned: false                  start with the slice shown
//   showImplied: true, showCorr: true   readouts
//   labels: { x, mu, b (KaTeX source), more, reset, condition, uncondition, corr, sliceCorr, implied,
//             mean, sd, means, slice, pick, sliderB, sliderMu, samples, theory }
//   presets: [{ label, sign, noiseX, noiseMu, slopeX, slopeMu, b, muBar }]

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const M = src => h('span', { html: mdInline(String(src)) });
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  kids.flat().forEach(c => c && e.append(c));
  return e;
};
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const fmt = v => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace('-', '−');
export function corr(pts) {
  const n = pts.length; if (n < 2) return 0;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  pts.forEach(p => { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) ** 2; syy += (p[1] - my) ** 2; });
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

const S = 300, PAD = 26;   // plot box side and margin in the viewBox (S + 2 PAD wide)

export function blanketSync(el, cfg) {
  const base = { slopeX: 1, slopeMu: 1, sign: 1, noiseX: 0.5, noiseMu: 0.5, sdB: 1, n: 150, seed: 3, maxN: 900, range: 4, b: 1, muBar: 1 };
  const P = { ...base };
  for (const k of Object.keys(base)) if (cfg[k] != null) P[k] = cfg[k];
  const L = { x: 'x', mu: '\\mu', b: 'b', more: 'Draw more samples', reset: 'Reset', condition: 'Condition on b', uncondition: 'Stop conditioning',
    corr: 'Correlation of the cloud', sliceCorr: 'Correlation inside the slice', implied: 'Implied distribution of x', mean: 'mean', sd: 'spread (sd)',
    means: 'conditional means', slice: 'samples at this b', pick: 'Pick a mean internal value', sliderB: 'value of b', sliderMu: 'mean internal value',
    samples: 'samples', theory: 'exact', ...(cfg.labels ?? {}) };
  const tex = s => `$${String(s).replace(/^\$|\$$/g, '')}$`;
  const R = P.range, W = S + 2 * PAD;
  const X = v => PAD + ((v + R) / (2 * R)) * S, Y = v => PAD + (1 - (v + R) / (2 * R)) * S;
  let rnd, pts, cond = !!cfg.conditioned, bVal = P.b, muBar = P.muBar, drawn;
  let sliceZ;
  const mX = b => P.slopeX * b, mMu = b => P.sign * P.slopeMu * b;
  const reseed = () => {
    rnd = rng(P.seed); pts = [];
    sliceZ = Array.from({ length: 40 }, () => [gauss(rnd), gauss(rnd)]);
    more(P.n);
  };
  function more(k) {
    for (let i = 0; i < k && pts.length < P.maxN; i++) {
      const b = P.sdB * gauss(rnd);
      pts.push([mX(b) + P.noiseX * gauss(rnd), mMu(b) + P.noiseMu * gauss(rnd), b]);
    }
  }
  // exact Gaussian conditioning of x given mu (b integrated out)
  function implied(m) {
    const a = P.slopeX, c = mMu(1), s2 = P.sdB ** 2;
    const vMu = c * c * s2 + P.noiseMu ** 2, cov = a * c * s2, vX = a * a * s2 + P.noiseX ** 2;
    return { mean: (cov / vMu) * m, sd: Math.sqrt(vX - cov * cov / vMu), r: cov / Math.sqrt(vX * vMu) };
  }

  const svg = sv('svg', { viewBox: `0 0 ${W} ${W}`, class: 'bs-svg', role: 'img', 'aria-label': 'scatter of internal against external samples' });
  const layer = sv('g');
  const axis = (x1, y1, x2, y2) => sv('line', { x1, y1, x2, y2, class: 'bs-axis' });
  svg.append(sv('rect', { x: PAD, y: PAD, width: S, height: S, class: 'bs-frame' }), axis(X(-R), Y(0), X(R), Y(0)), axis(X(0), Y(R), X(0), Y(-R)), layer);
  const lab = (txt, left, top) => h('div', { class: 'bs-lab', style: `left:${left}%;top:${top}%` }, M(tex(txt)));
  const stage = h('div', { class: 'bs-stage' }, svg, lab(L.x, 95, 58), lab(L.mu, 56, 3));

  const sl = (label, min, max, step, val, on) => {
    const out = h('span', { class: 'bs-val' });
    const inp = h('input', { type: 'range', min, max, step, value: val, 'aria-label': label });
    inp.addEventListener('input', () => { on(+inp.value); });
    return { row: h('div', { class: 'wslider' }, h('span', { class: 'bs-sl' }, M(label)), inp, out), inp, out };
  };
  const bS = sl(`${L.sliderB}`, -R / 2, R / 2, 0.05, bVal, v => { bVal = v; draw(); });
  const mS = sl(`${L.sliderMu}`, -R, R, 0.05, muBar, v => { muBar = v; draw(); });
  const condBtn = h('button', { class: 'btn', type: 'button', onclick: () => { cond = !cond; draw(); } });
  const moreBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { more(P.n); draw(); } }, L.more);
  const resetBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { Object.assign(P, base); for (const k of Object.keys(base)) if (cfg[k] != null) P[k] = cfg[k]; bVal = P.b; muBar = P.muBar; bS.inp.value = bVal; mS.inp.value = muBar; cond = !!cfg.conditioned; reseed(); draw(); } }, L.reset);
  const presetBtns = (cfg.presets ?? []).map(p => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
    for (const k of Object.keys(base)) if (p[k] != null) P[k] = p[k];
    bVal = P.b; muBar = P.muBar; bS.inp.value = bVal; mS.inp.value = muBar;
    reseed(); draw();
  } }, M(p.label)));
  const read = h('div', { class: 'bg-read bs-read' });
  const showImp = cfg.showImplied !== false, showCorr = cfg.showCorr !== false;
  el.append(stage, h('div', { class: 'wbtns' }, condBtn, moreBtn, ...presetBtns, resetBtn), bS.row, showImp ? mS.row : '', showCorr || showImp ? read : '');
  bS.row.style.display = 'none';

  function draw() {
    layer.textContent = '';
    // whole cloud
    pts.forEach(p => {
      if (Math.abs(p[0]) > R || Math.abs(p[1]) > R) return;
      layer.append(sv('circle', { cx: X(p[0]).toFixed(1), cy: Y(p[1]).toFixed(1), r: 2.4, class: 'bs-pt' + (cond ? ' bs-faint' : '') }));
    });
    // line of conditional means (parameter b)
    const bm = R / Math.max(Math.abs(P.slopeX), Math.abs(mMu(1)), 1e-6);
    layer.append(sv('line', { x1: X(mX(-bm)), y1: Y(mMu(-bm)), x2: X(mX(bm)), y2: Y(mMu(bm)), class: 'bs-mean' }));
    // slice
    if (cond) {
      const cx = mX(bVal), cy = mMu(bVal);
      layer.append(sv('ellipse', { cx: X(cx), cy: Y(cy), rx: (P.noiseX / (2 * R)) * S, ry: (P.noiseMu / (2 * R)) * S, class: 'bs-ell' }));
      sliceZ.forEach(z => {
        const x = cx + P.noiseX * z[0], y = cy + P.noiseMu * z[1];
        if (Math.abs(x) <= R && Math.abs(y) <= R) layer.append(sv('circle', { cx: X(x).toFixed(1), cy: Y(y).toFixed(1), r: 3, class: 'bs-slice' }));
      });
      const k = 6;
      layer.append(sv('path', { d: `M${X(cx) - k},${Y(cy) - k}l${2 * k},${2 * k}M${X(cx) - k},${Y(cy) + k}l${2 * k},${-2 * k}`, class: 'bs-cross' }));
    }
    // implied distribution
    if (showImp) {
      const im = implied(muBar), yl = Y(muBar);
      layer.append(sv('line', { x1: X(-R), x2: X(R), y1: yl, y2: yl, class: 'bs-mubar' }));
      const hgt = 70, d = [];
      for (let i = 0; i <= 80; i++) {
        const xv = -R + (2 * R * i) / 80, g = Math.exp(-0.5 * ((xv - im.mean) / im.sd) ** 2);
        d.push(`${i ? 'L' : 'M'}${X(xv).toFixed(1)},${(yl - g * hgt * Math.min(1, 0.5 / im.sd + 0.35)).toFixed(1)}`);
      }
      layer.append(sv('path', { d: d.join(''), class: 'bs-imp', fill: 'none' }));
      layer.append(sv('line', { x1: X(im.mean), x2: X(im.mean), y1: yl - 6, y2: yl + 6, class: 'bs-impmean' }));
    }
    condBtn.textContent = cond ? L.uncondition : L.condition;
    condBtn.classList.toggle('primary', !cond);
    bS.row.style.display = cond ? '' : 'none';
    bS.out.textContent = fmt(bVal); mS.out.textContent = fmt(muBar);
    read.textContent = '';
    const im = implied(muBar), rs = corr(pts.map(p => [p[0], p[1]]));
    if (showCorr) {
      read.append(h('div', {}, h('b', {}, M(`${L.corr}: `)), M(`$r=${fmt(rs)}$ (${pts.length} ${L.samples}; ${L.theory} $${fmt(im.r)}$)`)));
      if (cond) read.append(h('div', {}, h('b', {}, M(`${L.sliceCorr}: `)),
        M(`$r=${fmt(corr(sliceZ.map(z => [z[0], z[1]])))}$ (${sliceZ.length} ${L.samples}, ${tex(L.b)} $=${fmt(bVal)}$)`)));
    }
    if (showImp) read.append(h('div', {}, h('b', {}, M(`${L.implied} ${tex(L.x)} (${tex(L.mu)} $=${fmt(muBar)}$): `)),
      M(`${L.mean} $${fmt(im.mean)}$, ${L.sd} $${fmt(im.sd)}$`)));
    el.dataset.r = fmt(rs); el.dataset.mean = fmt(im.mean); el.dataset.sd = fmt(im.sd); el.dataset.cond = String(cond);
  }
  reseed();
  draw();
}
