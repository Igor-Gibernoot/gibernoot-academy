// gaussian-fit
//
// Fit a Gaussian q(x) = N(mu, sigma^2) to a 1D target density p(x) and compare the two KL divergences (nats):
//   D_KL[q||p] = sum q (ln q - ln p) dx   (the one a free energy minimises: it needs only ln p up to a constant;
//                                          mode-seeking, never negated)
//   D_KL[p||q] = sum p (ln p - ln q) dx   (the other direction: moment matching, mean and variance of p)
// Buttons: best for D_KL[q||p] (numerical minimisation, Nelder-Mead from several starts), best for D_KL[p||q]
// (moment matching), Laplace at a mode (mu = mode, sigma^-2 = -(ln p)''(mode)).
// Optional Taylor overlay (showTaylor): the Taylor polynomial of ln p at a draggable point a, order 0/1/2, drawn on a
// second panel (ln p); for order 2 with negative curvature the Gaussian it implies is drawn on the density panel.
// Curvature and implied precision are printed. All text and KaTeX come from labels; nothing course-specific.
//
//   target (one of):  components: [{w, mean, sd}]   mixture of Gaussians (weights normalised)
//                     skew: {loc, scale, alpha}      skew-normal (also logp: 'skew' with defaults)
//   range: [lo, hi]   (default: spans the target)    grid: 800 points
//   mu, sigma: initial q          sigmaRange: [min, max] of the slider
//   showForward: true (the p||q readout and button)    showTaylor: false     modeIndex: null (highest) or index
//   showBest: true (tick on each bar at the family's best value)    klMax: 3 (bar full scale)
//   a, order: initial Taylor point and order (0, 1, 2)   lnSpan: 9 (height of the ln p panel, nats)
//   labels: { p, q, x, mu, sigma, klRev, klFwd, bestTick, fitRev, fitFwd, laplace, useTaylor, density, logDensity,
//             point, order0, order1, order2, curvature, precision, taylorGauss, notNormalisable, nats }
//   presets: [{ label, mu, sigma, a, order, fit }]   fit: 'rev' | 'fwd' | 'laplace'

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
const fmt = v => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace('-', '−');
const tex = s => `$${String(s).replace(/^\$|\$$/g, '')}$`;
const LN2PI = Math.log(2 * Math.PI);

function erfc(x) {            // Numerical Recipes erfcc, relative error < 1.2e-7 everywhere
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
    t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
const lse = arr => { const m = Math.max(...arr); return m + Math.log(arr.reduce((s, v) => s + Math.exp(v - m), 0)); };

const W = 420, PL = 8, PR = 8, PT = 8, PB = 20;

export function gaussianFit(el, cfg) {
  const L = { p: 'p(x)', q: 'q(x)', x: 'x', mu: '\\mu', sigma: '\\sigma', klRev: 'D_{KL}[q\\|p]', klFwd: 'D_{KL}[p\\|q]',
    bestTick: 'best q', fitRev: 'Best for the first', fitFwd: 'Best for the second', laplace: 'Laplace at the mode',
    useTaylor: 'Use as q', density: 'density', logDensity: 'log density', point: 'a', order0: 'order 0', order1: 'order 1',
    order2: 'order 2', curvature: 'curvature', precision: 'precision', taylorGauss: 'Gaussian from the expansion',
    notNormalisable: 'not a Gaussian (curvature is not negative)', nats: 'nats', ...(cfg.labels ?? {}) };

  // ---- target ln p (unnormalised pieces are normalised on the grid) ----
  let lnpRaw, comps = null, sk = null;
  if (Array.isArray(cfg.components) && cfg.components.length) {
    const tw = cfg.components.reduce((s, c) => s + (c.w ?? 1), 0);
    comps = cfg.components.map(c => ({ w: (c.w ?? 1) / tw, mean: c.mean, sd: c.sd }));
    lnpRaw = x => lse(comps.map(c => Math.log(c.w) - 0.5 * ((x - c.mean) / c.sd) ** 2 - Math.log(c.sd) - 0.5 * LN2PI));
  } else {
    sk = { loc: 0, scale: 1, alpha: 4, ...(cfg.skew ?? {}) };
    lnpRaw = x => { const z = (x - sk.loc) / sk.scale; return Math.log(2) - Math.log(sk.scale) - 0.5 * z * z - 0.5 * LN2PI + Math.log(Math.max(0.5 * erfc(-sk.alpha * z / Math.SQRT2), 1e-300)); };
  }
  let lo, hi;
  if (Array.isArray(cfg.range)) [lo, hi] = cfg.range;
  else if (comps) { lo = Math.min(...comps.map(c => c.mean - 4 * c.sd)); hi = Math.max(...comps.map(c => c.mean + 4 * c.sd)); }
  else { lo = sk.loc - 3.5 * sk.scale; hi = sk.loc + 5 * sk.scale; }
  const N = cfg.grid ?? 800, dx = (hi - lo) / (N - 1), xs = Array.from({ length: N }, (_, i) => lo + i * dx);
  const raw = xs.map(lnpRaw), lz = lse(raw) + Math.log(dx);
  const lnp = x => Math.max(lnpRaw(x) - lz, -700);
  const lp = raw.map(v => Math.max(v - lz, -700)), pd = lp.map(Math.exp);
  const pMax = Math.max(...pd);
  const mean = pd.reduce((s, v, i) => s + v * xs[i] * dx, 0);
  const varp = pd.reduce((s, v, i) => s + v * (xs[i] - mean) ** 2 * dx, 0);

  // modes (local maxima of ln p), refined by ternary search
  const modes = [];
  for (let i = 1; i < N - 1; i++) if (lp[i] > lp[i - 1] && lp[i] >= lp[i + 1]) {
    let a0 = xs[i - 1], b0 = xs[i + 1];
    for (let k = 0; k < 40; k++) { const m1 = a0 + (b0 - a0) / 3, m2 = b0 - (b0 - a0) / 3; if (lnp(m1) < lnp(m2)) a0 = m1; else b0 = m2; }
    modes.push((a0 + b0) / 2);
  }
  if (!modes.length) modes.push(xs[lp.indexOf(Math.max(...lp))]);
  const modeAt = cfg.modeIndex != null && modes[cfg.modeIndex] != null ? modes[cfg.modeIndex] : modes.reduce((b, m) => (lnp(m) > lnp(b) ? m : b), modes[0]);
  const hh = (hi - lo) * 1e-3;
  const d1 = x => (lnp(x + hh) - lnp(x - hh)) / (2 * hh);
  const d2 = x => (lnp(x + hh) - 2 * lnp(x) + lnp(x - hh)) / (hh * hh);

  // ---- KL on the grid ----
  const lnq = (x, m, s) => -0.5 * ((x - m) / s) ** 2 - Math.log(s) - 0.5 * LN2PI;
  const kls = (m, s) => {            // q is renormalised on the grid (mass outside the range is dropped), so both are true KLs
    let z = 0;
    for (let i = 0; i < N; i++) z += Math.exp(lnq(xs[i], m, s)) * dx;
    const lzq = Math.log(Math.max(z, 1e-300));
    let r = 0, f = 0;
    for (let i = 0; i < N; i++) {
      const lq = lnq(xs[i], m, s) - lzq, q = Math.exp(lq);
      r += q * (lq - lp[i]) * dx;
      f += pd[i] * (lp[i] - lq) * dx;
    }
    return { rev: r, fwd: f };
  };
  const sMin = cfg.sigmaRange?.[0] ?? Math.max(3 * dx, (hi - lo) * 0.012), sMax = cfg.sigmaRange?.[1] ?? (hi - lo) * 0.4;
  const clampS = s => Math.min(Math.max(s, sMin), sMax);
  const clampM = m => Math.min(Math.max(m, lo), hi);
  function nelder(f, x0, step) {
    let pts = [x0, [x0[0] + step[0], x0[1]], [x0[0], x0[1] + step[1]]].map(p => ({ p, v: f(p) }));
    for (let it = 0; it < 160; it++) {
      pts.sort((u, v) => u.v - v.v);
      const [b, , w] = pts, c = [(pts[0].p[0] + pts[1].p[0]) / 2, (pts[0].p[1] + pts[1].p[1]) / 2];
      const at = t => { const p = [c[0] + t * (w.p[0] - c[0]), c[1] + t * (w.p[1] - c[1])]; return { p, v: f(p) }; };
      const r = at(-1);
      if (r.v < b.v) { const e = at(-2); pts[2] = e.v < r.v ? e : r; }
      else if (r.v < pts[1].v) pts[2] = r;
      else { const k = at(r.v < w.v ? -0.5 : 0.5); if (k.v < Math.min(r.v, w.v)) pts[2] = k; else pts = pts.map((q, i) => (i ? { p: [b.p[0] + 0.5 * (q.p[0] - b.p[0]), b.p[1] + 0.5 * (q.p[1] - b.p[1])], v: 0 } : q)).map(q => ({ p: q.p, v: f(q.p) })); }
    }
    pts.sort((u, v) => u.v - v.v); return pts[0];
  }
  function bestRev() {
    const f = ([m, ls]) => kls(clampM(m), clampS(Math.exp(ls))).rev;
    const starts = [...modes.map(m => [m, Math.log(clampS(Math.sqrt(-1 / d2(m) || 1)))]), [mean, Math.log(clampS(Math.sqrt(varp)))]];
    let best = null;
    for (const s of starts) { const r = nelder(f, s, [0.05 * (hi - lo), 0.3]); if (!best || r.v < best.v) best = r; }
    return { mu: clampM(best.p[0]), sigma: clampS(Math.exp(best.p[1])) };
  }
  const fwdFit = { mu: clampM(mean), sigma: clampS(Math.sqrt(varp)) };
  const revFit = bestRev();
  const bestVals = { rev: kls(revFit.mu, revFit.sigma).rev, fwd: kls(fwdFit.mu, fwdFit.sigma).fwd };
  const lapSig = d2(modeAt) < 0 ? clampS(Math.sqrt(-1 / d2(modeAt))) : sMax;

  // ---- state ----
  let mu = clampM(cfg.mu ?? mean), sigma = clampS(cfg.sigma ?? Math.sqrt(varp));
  let a = clampM(cfg.a ?? modeAt), order = cfg.order ?? 2;
  const showTaylor = !!cfg.showTaylor, showFwd = cfg.showForward !== false, showBest = cfg.showBest !== false, klMax = cfg.klMax ?? 3;
  const lnSpan = cfg.lnSpan ?? 9;

  // ---- panels ----
  const H1 = 190, H2 = 150;
  const X = x => PL + ((x - lo) / (hi - lo)) * (W - PL - PR);
  const inv = px => lo + ((px - PL) / (W - PL - PR)) * (hi - lo);
  const Y1 = v => H1 - PB - (v / (pMax * 1.3)) * (H1 - PB - PT);
  const lpTop = Math.log(pMax) + 0.5, lpBot = lpTop - lnSpan;
  const Y2 = v => H2 - PB - ((v - lpBot) / (lpTop - lpBot)) * (H2 - PB - PT);
  const cid = Math.random().toString(36).slice(2, 8);
  const mkSvg = (H, id, aria) => {
    const s = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'gf-svg', role: 'img', 'aria-label': aria });
    s.append(sv('clipPath', { id: `${id}${cid}` }, sv('rect', { x: PL, y: PT, width: W - PL - PR, height: H - PB - PT })), sv('rect', { x: 0, y: 0, width: W, height: H, class: 'gf-frame' }));
    return s;
  };
  const s1 = mkSvg(H1, 'gfa', 'target density and Gaussian'), s2 = mkSvg(H2, 'gfb', 'log density');
  const g1 = sv('g', { 'clip-path': `url(#gfa${cid})` }), g2 = sv('g', { 'clip-path': `url(#gfb${cid})` });
  const ticks = (s, H) => {
    const raw = (hi - lo) / 6, pw = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 5, 10].map(m => m * pw).find(v => v >= raw);
    for (let x = Math.ceil(lo / step) * step; x <= hi + 1e-9; x += step) {
      s.append(sv('line', { x1: X(x), x2: X(x), y1: H - PB, y2: H - PB + 4, class: 'gf-axis' }), sv('text', { x: X(x), y: H - 6, class: 'gf-tick', 'text-anchor': 'middle' }, document.createTextNode((+x.toFixed(6) + '').replace('-', '−'))));
    }
    s.append(sv('line', { x1: PL, x2: W - PR, y1: H - PB, y2: H - PB, class: 'gf-axis' }));
  };
  s1.append(g1); ticks(s1, H1); s2.append(g2); ticks(s2, H2);
  const poly = (f, ys, Y, cls) => sv('polyline', { points: xs.filter((_, i) => i % 2 === 0).map(x => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(' '), class: cls });
  const areaPath = () => 'M' + xs.map((x, i) => `${X(x).toFixed(1)},${Y1(pd[i]).toFixed(1)}`).join('L') + `L${X(hi)},${Y1(0)}L${X(lo)},${Y1(0)}Z`;

  const lg = (cls, txt, plain) => h('span', { class: 'gf-key' }, h('i', { class: cls }), M(plain ? txt : tex(txt)));
  const legend = h('div', { class: 'gf-leg' }, lg('gf-sw-p', L.p), lg('gf-sw-q', L.q));
  const legendT = showTaylor ? lg('gf-sw-t', L.taylorGauss, true) : null;
  if (legendT) legend.append(legendT);

  const dragPt = (svg, set) => {
    let on = false;
    const at = e => { const r = svg.getBoundingClientRect(); set(inv(((e.clientX - r.left) / r.width) * W)); };
    svg.addEventListener('pointerdown', e => { on = true; svg.setPointerCapture?.(e.pointerId); at(e); e.preventDefault(); });
    svg.addEventListener('pointermove', e => { if (on) at(e); });
    svg.addEventListener('pointerup', () => { on = false; });
    svg.style.touchAction = 'none'; svg.style.cursor = 'ew-resize';
  };
  if (showTaylor) { dragPt(s1, v => { a = clampM(v); aS.inp.value = a; draw(); }); dragPt(s2, v => { a = clampM(v); aS.inp.value = a; draw(); }); }
  else dragPt(s1, v => { mu = clampM(v); muS.inp.value = mu; draw(); });

  const sl = (label, min, max, step, val, on) => {
    const out = h('span', { class: 'bs-val' });
    const inp = h('input', { type: 'range', min, max, step, value: val, 'aria-label': String(label).replace(/\$/g, '') });
    inp.addEventListener('input', () => { on(+inp.value); draw(); });
    return { row: h('div', { class: 'wslider' }, h('span', { class: 'bs-sl' }, M(tex(label))), inp, out), inp, out };
  };
  const muS = sl(L.mu, lo, hi, (hi - lo) / 400, mu, v => { mu = v; });
  const sgS = sl(L.sigma, sMin, sMax, (sMax - sMin) / 400, sigma, v => { sigma = v; });
  const aS = sl(L.point, lo, hi, (hi - lo) / 400, a, v => { a = v; });
  const setQ = (m, s) => { mu = clampM(m); sigma = clampS(s); muS.inp.value = mu; sgS.inp.value = sigma; draw(); };
  const doFit = k => {
    if (k === 'rev') setQ(revFit.mu, revFit.sigma);
    else if (k === 'fwd') setQ(fwdFit.mu, fwdFit.sigma);
    else if (k === 'laplace') { setQ(modeAt, lapSig); a = modeAt; aS.inp.value = a; draw(); }
  };
  const btn = (txt, on, cls = 'ghost') => h('button', { class: `btn ${cls}`, type: 'button', onclick: on }, M(txt));
  const fitBtns = [btn(L.fitRev, () => doFit('rev')), ...(showFwd ? [btn(L.fitFwd, () => doFit('fwd'))] : []), btn(L.laplace, () => doFit('laplace'))];
  const ordBtns = [0, 1, 2].map(o => btn(L['order' + o], () => { order = o; draw(); }));
  const useBtn = btn(L.useTaylor, () => { const c = d2(a); if (c < 0) setQ(a - d1(a) / c, Math.sqrt(-1 / c)); });
  const presetBtns = (cfg.presets ?? []).map(p => btn(p.label, () => {
    if (p.mu != null) mu = clampM(p.mu); if (p.sigma != null) sigma = clampS(p.sigma);
    if (p.a != null) { a = clampM(p.a); aS.inp.value = a; } if (p.order != null) order = p.order;
    muS.inp.value = mu; sgS.inp.value = sigma; if (p.fit) doFit(p.fit); else draw();
  }));

  const mkRow = (label) => {
    const val = h('b', { class: 'gf-num' }), bar = h('i', { class: 'gf-bar' }), tick = h('u', { class: 'gf-tick-b' });
    return { val, bar, tick, row: h('div', { class: 'gf-kl' }, h('span', { class: 'gf-kl-l' }, M(tex(label))), h('span', { class: 'gf-track' }, bar, showBest ? tick : ''), val, h('span', { class: 'gf-unit' }, M(L.nats))) };
  };
  const rRev = mkRow(L.klRev), rFwd = mkRow(L.klFwd);
  const tread = h('div', { class: 'bg-read bs-read' });
  const kids = [legend, ...(showTaylor ? [h('div', { class: 'gf-cap' }, M(L.density))] : []), s1];
  if (showTaylor) kids.push(h('div', { class: 'gf-cap' }, M(L.logDensity)), s2);
  el.append(...kids,
    muS.row, sgS.row, h('div', { class: 'wbtns' }, ...fitBtns), rRev.row, showFwd ? rFwd.row : '');
  if (showTaylor) el.append(aS.row, h('div', { class: 'wbtns' }, ...ordBtns, useBtn), tread);
  if (presetBtns.length) el.append(h('div', { class: 'wbtns' }, ...presetBtns));

  function draw() {
    const kl = kls(mu, sigma);
    g1.textContent = ''; g2.textContent = '';
    g1.append(sv('path', { d: areaPath(), class: 'gf-parea' }), poly(x => pd[Math.round((x - lo) / dx)] ?? 0, 0, Y1, 'gf-pline'),
      poly(x => Math.exp(lnq(x, mu, sigma)), 0, Y1, 'gf-qline'), sv('line', { x1: X(mu), x2: X(mu), y1: PT, y2: H1 - PB, class: 'gf-qmu' }));
    let tg = null, c2 = d2(a), l1 = d1(a), l0 = lnp(a);
    const T = x => (order >= 0 ? l0 : 0) + (order >= 1 ? l1 * (x - a) : 0) + (order >= 2 ? 0.5 * c2 * (x - a) ** 2 : 0);
    if (showTaylor) {
      if (order === 2 && c2 < 0) { tg = { m: a - l1 / c2, s: Math.sqrt(-1 / c2) }; g1.append(poly(x => Math.exp(lnq(x, tg.m, tg.s)), 0, Y1, 'gf-tline')); }
      g1.append(sv('line', { x1: X(a), x2: X(a), y1: PT, y2: H1 - PB, class: 'gf-amark' }));
      g2.append(poly(lnp, 0, Y2, 'gf-pline'), poly(x => lnq(x, mu, sigma), 0, Y2, 'gf-qline'), poly(T, 0, Y2, 'gf-tline'),
        sv('line', { x1: X(a), x2: X(a), y1: PT, y2: H2 - PB, class: 'gf-amark' }), sv('circle', { cx: X(a), cy: Y2(l0), r: 4, class: 'gf-adot' }));
    }
    muS.out.textContent = fmt(mu); sgS.out.textContent = fmt(sigma); aS.out.textContent = fmt(a);
    for (const [r, v, b] of [[rRev, kl.rev, bestVals.rev], [rFwd, kl.fwd, bestVals.fwd]]) {
      r.val.textContent = fmt(v); r.bar.style.width = `${Math.min(100, Math.max(0, (v / klMax) * 100))}%`; r.tick.style.left = `${Math.min(100, (b / klMax) * 100)}%`;
      r.tick.title = L.bestTick;
    }
    ordBtns.forEach((b, i) => b.classList.toggle('on', i === order));
    if (showTaylor) {
      tread.textContent = '';
      tread.append(h('div', {}, h('b', {}, M(`${L.curvature}: `)), M(`$${fmt(c2)}$`), h('span', {}, '   '), h('b', {}, M(`${L.precision}: `)), M(c2 < 0 ? `$${fmt(-c2)}$` : '—')),
        h('div', {}, tg ? M(`${L.taylorGauss}: ${tex(L.mu)} = $${fmt(tg.m)}$, ${tex(L.sigma)} = $${fmt(tg.s)}$`) : M(order === 2 ? L.notNormalisable : '—')));
      useBtn.disabled = !(c2 < 0);
    }
    Object.assign(el.dataset, { mu: fmt(mu), sigma: fmt(sigma), klRev: fmt(kl.rev), klFwd: fmt(kl.fwd), bestRev: fmt(bestVals.rev), bestFwd: fmt(bestVals.fwd),
      a: fmt(a), order, curv: fmt(c2), mode: fmt(modeAt) });
  }
  draw();
}
