// gauss-charts
//
// The family of Gaussians N(mu, sigma^2) drawn in two coordinate charts of the same half-plane of
// distributions: chart (mu, sigma) and chart (mu, sigma^2). One distribution is a point in both
// charts; dragging it in either chart moves it in the other, and the density curve p(x) is drawn
// below with its mean. Fixed extra points / paths show how the two charts deform each other.
//
// Config (names are TeX; label strings are markdown inline):
//   chart: 'both' | 'sigma' | 'variance'  which chart(s) to show (default both)
//   point: { mu: 0, sigma: 1, name: 'p', fixed: false, hue: 'vec' }   the main point
//   curves: [ { mu, sigma, name?, hue?, density?: true }                 extra fixed point (+ its density)
//           | { path: [[mu,sigma],..], hue?, name? }                     polyline given in (mu, sigma)
//           | { segment: { from:[mu,sigma], to:[mu,sigma], chart:'sigma'|'variance' }, hue? }
//                                    straight segment in the named chart (default sigma), bent in the other ]
//   grid: false | 'sigma' | 'variance' | 'both' (true)   coordinate lines in BOTH charts: sigma = const
//                                    (step gridStep, default 0.5) and/or sigma^2 = const (step 1)
//   showDensity: true                the density curve below (with dashed mean line, +-sigma bar)
//   readout: true                    mu, sigma, sigma^2 of the main point (false = hidden)
//   muRange: [-3, 3], sMax: 3, sMin: 0.25   chart extents (sigma^2 axis runs 0 .. sMax^2)
//   xRange: [-6, 6], yMax: 1.7       density plot extents
//   snap: 0                          snap dragged mu and sigma to a multiple (e.g. 0.1)
//   presets: [{ label, mu, sigma }]  buttons moving the main point;  reset: true  ("Reset" button)
//   labels: { mu, sigma, variance, density, reset, readout }
//
// el.dataset: mu, sigma, var (main point, 3 decimals).

import { h } from '../dom.js';
import { mdInline, tex } from '../render.js';
import { s } from './plane.js';

const M = src => h('span', { html: mdInline(String(src)) });
const T = src => h('span', { html: tex(String(src)) });
const HUES = { vec: 'var(--vec)', covec: 'var(--covec)', basis: 'var(--basis)', gold: 'var(--gold)' };
const DEF = ['covec', 'basis', 'gold', 'vec'];
const f2 = x => x.toFixed(2);
const f3 = x => x.toFixed(3);
const SQ = Math.sqrt(2 * Math.PI);
const gauss = (x, m, sg) => Math.exp(-0.5 * ((x - m) / sg) ** 2) / (sg * SQ);

const VW = 120, VH = 112, X0 = 20, X1 = 114, Y0 = 8, Y1 = 90;      // chart viewBox and plot box

export function gaussCharts(el, cfg) {
  const which = cfg.chart ?? 'both';
  const charts = which === 'both' ? ['sigma', 'variance'] : [which === 'variance' ? 'variance' : 'sigma'];
  const [muMin, muMax] = cfg.muRange ?? [-3, 3];
  const sMax = cfg.sMax ?? 3, sMin = cfg.sMin ?? 0.25;
  const [xMin, xMax] = cfg.xRange ?? [-6, 6];
  const yMax = cfg.yMax ?? 1.7;
  const snap = cfg.snap ?? 0;
  const gridMode = cfg.grid === true ? 'both' : (cfg.grid || false);
  const gridStep = cfg.gridStep ?? 0.5;
  const showDens = cfg.showDensity !== false;
  const L = { mu: '\\mu', sigma: '\\sigma', variance: '\\sigma^2', density: 'p(x)', reset: 'Reset', readout: '', ...(cfg.labels ?? {}) };
  const main0 = { mu: 0, sigma: 1, name: 'p', ...(cfg.point ?? {}) };
  const col = (o, k) => HUES[o.hue] ?? o.hue ?? HUES[DEF[k % DEF.length]];
  const mainCol = HUES[main0.hue] ?? main0.hue ?? 'var(--vec)';
  let pt = { mu: main0.mu, sigma: main0.sigma };
  const clampPt = (mu, sg) => {
    let m = Math.min(muMax, Math.max(muMin, mu)), q = Math.min(sMax, Math.max(sMin, sg));
    if (snap) { m = Math.round(m / snap) * snap; q = Math.max(sMin, Math.round(q / snap) * snap); }
    return { mu: m, sigma: q };
  };

  // ---- coordinates of one chart
  const vMaxOf = c => (c === 'sigma' ? sMax : sMax * sMax);
  const yOf = (c, sg) => Y1 - ((c === 'sigma' ? sg : sg * sg) / vMaxOf(c)) * (Y1 - Y0);
  const xOf = mu => X0 + ((mu - muMin) / (muMax - muMin)) * (X1 - X0);
  const sigmaFromY = (c, y) => { const v = ((Y1 - y) / (Y1 - Y0)) * vMaxOf(c); return c === 'sigma' ? v : Math.sqrt(Math.max(v, 0)); };
  const muFromX = x => muMin + ((x - X0) / (X1 - X0)) * (muMax - muMin);

  const txt = (x, y, str, cls, anchor = 'middle') => {
    const t = s('text', { x, y, class: cls, 'text-anchor': anchor, 'dominant-baseline': 'middle' });
    t.textContent = str; return t;
  };
  const TXT = src => String(src).replace(/\\sigma\^2/g, 'σ²').replace(/\\sigma/g, 'σ').replace(/\\mu/g, 'μ').replace(/[$*_`]/g, '');

  const extras = cfg.curves ?? [];
  const sampled = (c, e) => {
    if (e.path) return e.path;
    const sg = e.segment; if (!sg) return null;
    const ch = sg.chart ?? 'sigma', n = 60, out = [];
    const w = v => (ch === 'variance' ? Math.sqrt(Math.max(v, 0)) : v);
    const a = ch === 'variance' ? sg.from[1] ** 2 : sg.from[1], b = ch === 'variance' ? sg.to[1] ** 2 : sg.to[1];
    for (let i = 0; i <= n; i++) { const t = i / n; out.push([sg.from[0] + t * (sg.to[0] - sg.from[0]), w(a + t * (b - a))]); }
    return out;
  };

  // ---- build each chart svg
  const panels = charts.map(c => {
    const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}`, role: 'img', class: 'gc-svg',
      'aria-label': c === 'sigma' ? 'Chart of Gaussians with coordinates mu and sigma' : 'Chart of Gaussians with coordinates mu and sigma squared' });
    svg.append(s('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0, class: 'gc-box' }));
    const gG = s('g'), gC = s('g'), gP = s('g');
    svg.append(gG, gC, gP);
    // grid families
    const gl = (cls, y) => s('line', { x1: X0, x2: X1, y1: y, y2: y, class: cls });
    if (gridMode === 'sigma' || gridMode === 'both') for (let v = gridStep; v < sMax + 1e-9; v += gridStep) gG.append(gl('gc-gs', yOf(c, v)));
    if (gridMode === 'variance' || gridMode === 'both') for (let v = 1; v < sMax * sMax + 1e-9; v += 1) gG.append(gl('gc-gv', yOf(c, Math.sqrt(v))));
    if (gridMode) for (let m = Math.ceil(muMin); m <= muMax; m++) gG.append(s('line', { x1: xOf(m), x2: xOf(m), y1: Y0, y2: Y1, class: 'gc-gm' }));
    // axes ticks
    for (let m = Math.ceil(muMin); m <= muMax; m++) gG.append(txt(xOf(m), Y1 + 7, String(m), 'gc-tick'));
    const vMax = vMaxOf(c), st = c === 'sigma' ? 1 : Math.ceil(vMax / 4);
    for (let v = 0; v <= vMax + 1e-9; v += st) gG.append(txt(X0 - 3, Y1 - (v / vMax) * (Y1 - Y0), String(v), 'gc-tick', 'end'));
    gG.append(txt((X0 + X1) / 2, VH - 4, TXT(L.mu), 'gc-ax'));
    const yl = txt(6, (Y0 + Y1) / 2, TXT(c === 'sigma' ? L.sigma : L.variance), 'gc-ax');
    yl.setAttribute('transform', `rotate(-90 6 ${(Y0 + Y1) / 2})`); gG.append(yl);
    // extras: paths and points
    const paths = extras.map((e, k) => {
      if (!(e.path || e.segment)) return null;
      const p = s('path', { class: 'gc-path', style: `stroke:${col(e, k)}` }); gC.append(p); return p;
    });
    const fixed = extras.map((e, k) => {
      if (e.mu == null) return null;
      const g = s('g', { class: 'gc-pt', style: `--c:${col(e, k)}` });
      g.append(s('circle', { r: 3, class: 'gc-dot', cx: xOf(e.mu), cy: yOf(c, e.sigma) }));
      if (e.name) g.append(txt(xOf(e.mu) + 5, yOf(c, e.sigma) - 5, TXT(e.name), 'gc-name', 'start'));
      gP.append(g); return g;
    });
    paths.forEach((p, k) => {
      if (!p) return;
      const pts = sampled(c, extras[k]);
      p.setAttribute('d', pts.map(([m, sg], i) => `${i ? 'L' : 'M'}${f2(xOf(m))},${f2(yOf(c, sg))}`).join(''));
    });
    // main point
    const g = s('g', { class: 'gc-pt' + (main0.fixed ? ' fixed' : ''), style: `--c:${mainCol}` });
    const dot = s('circle', { r: 3.6, class: 'gc-dot' });
    const lab = txt(0, 0, TXT(main0.name), 'gc-name', 'start');
    const hit = s('circle', { r: 10, class: 'gc-hit' });
    g.append(dot, lab, hit); gP.append(g);
    if (!main0.fixed) {
      hit.addEventListener('pointerdown', e => {
        e.preventDefault(); hit.setPointerCapture(e.pointerId);
        const move = ev => {
          const q = svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
          const m = q.matrixTransform(svg.getScreenCTM().inverse());
          pt = clampPt(muFromX(m.x), sigmaFromY(c, m.y)); draw();
        };
        const up = () => { for (const [n, f] of [['pointermove', move], ['pointerup', up], ['pointercancel', up]]) hit.removeEventListener(n, f); };
        hit.addEventListener('pointermove', move); hit.addEventListener('pointerup', up); hit.addEventListener('pointercancel', up);
      });
    }
    return { c, svg, dot, hit, lab };
  });

  // ---- density plot
  let dsvg = null, dMain, dMean, dBar, dExtra = [];
  if (showDens) {
    const DW = 240, DH = 100, A0 = 14, A1 = 232, B0 = 8, B1 = 84;
    dsvg = s('svg', { viewBox: `0 0 ${DW} ${DH}`, role: 'img', class: 'gc-dsvg', 'aria-label': 'Density curve of the Gaussian' });
    const xs = x => A0 + ((x - xMin) / (xMax - xMin)) * (A1 - A0), ys = y => B1 - (y / yMax) * (B1 - B0);
    dsvg.append(s('rect', { x: A0, y: B0, width: A1 - A0, height: B1 - B0, class: 'gc-box' }));
    dsvg.append(s('line', { x1: A0, x2: A1, y1: B1, y2: B1, class: 'gc-axis' }));
    for (let x = Math.ceil(xMin); x <= xMax; x += 2) dsvg.append(txt(xs(x), B1 + 7, String(x), 'gc-tick'));
    dsvg.append(txt((A0 + A1) / 2, DH - 4, 'x', 'gc-ax'));
    const dpath = (m, sg) => {
      let d = ''; const n = 160;
      for (let i = 0; i <= n; i++) { const x = xMin + (xMax - xMin) * i / n; d += `${i ? 'L' : 'M'}${f2(xs(x))},${f2(Math.max(B0, ys(gauss(x, m, sg))))}`; }
      return d;
    };
    extras.forEach((e, k) => {
      if (e.mu == null || e.density === false) return;
      const p = s('path', { class: 'gc-curve ex', style: `stroke:${col(e, k)}`, d: dpath(e.mu, e.sigma) });
      dsvg.append(p);
    });
    dMain = s('path', { class: 'gc-curve', style: `stroke:${mainCol}` });
    dMean = s('line', { y1: B0, y2: B1, class: 'gc-mean', style: `stroke:${mainCol}` });
    dBar = s('line', { class: 'gc-sbar', style: `stroke:${mainCol}` });
    dsvg.append(dMain, dMean, dBar);
    dsvg.append(txt(xs(xMax) - 2, B0 + 8, TXT(L.density), 'gc-ax', 'end'));
    var drawDens = () => {
      dMain.setAttribute('d', dpath(pt.mu, pt.sigma));
      const x = xs(pt.mu); dMean.setAttribute('x1', x); dMean.setAttribute('x2', x);
      const yb = ys(gauss(pt.mu + pt.sigma, pt.mu, pt.sigma));
      dBar.setAttribute('x1', xs(pt.mu - pt.sigma)); dBar.setAttribute('x2', xs(pt.mu + pt.sigma));
      dBar.setAttribute('y1', yb); dBar.setAttribute('y2', yb);
    };
  }

  // ---- readout and buttons
  const ro = cfg.readout !== false ? h('div', { class: 'fe-sec gc-read' }) : null;
  const btns = [];
  if (!main0.fixed && cfg.reset !== false) btns.push(h('button', { class: 'btn ghost', type: 'button', onclick: () => { pt = { mu: main0.mu, sigma: main0.sigma }; draw(); } }, M(L.reset)));
  for (const pr of cfg.presets ?? []) btns.push(h('button', { class: 'btn ghost', type: 'button', onclick: () => { pt = clampPt(pr.mu ?? pt.mu, pr.sigma ?? pt.sigma); draw(); } }, M(pr.label)));

  el.classList.add('gc-widget');
  el.append(h('div', { class: 'gc-charts' }, ...panels.map(p => p.svg)), dsvg ?? '', ro ?? '', btns.length ? h('div', { class: 'wbtns' }, ...btns) : '');

  function draw() {
    panels.forEach(p => {
      const x = xOf(pt.mu), y = yOf(p.c, pt.sigma);
      for (const n of [p.dot, p.hit]) { n.setAttribute('cx', x); n.setAttribute('cy', y); }
      p.lab.setAttribute('x', x + (x > X1 - 14 ? -22 : 5)); p.lab.setAttribute('y', y - 6);
    });
    if (showDens) drawDens();
    if (ro) {
      ro.textContent = '';
      ro.append(T(`${L.readout ? L.readout + '\\ ' : ''}\\mu=${f2(pt.mu)},\\quad \\sigma=${f2(pt.sigma)},\\quad \\sigma^2=${f2(pt.sigma ** 2)}`));
    }
    el.dataset.mu = f3(pt.mu); el.dataset.sigma = f3(pt.sigma); el.dataset.var = f3(pt.sigma ** 2);
  }
  draw();
}
