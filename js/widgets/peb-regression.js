// peb-regression
//
// Second-level (group) regression on per-subject posterior estimates.
// Subject i has a first-level posterior N(m_i, 1/Pi_i) (mean m_i, sd_i = Pi_i^(-1/2)) and a covariate x_i. The group model is
//   theta_i ~ N(beta0 + beta1 x_i, 1/Pi2)     (Pi2 = group precision; the line is  X beta  with X = (1, x_i)).
// Shown: points m_i with +-1 sd bars, the line, and (toggle) the shrunk posterior of each subject,
//   shrunk mean = (Pi_i m_i + Pi2 line_i)/(Pi_i + Pi2),  shrunk precision = Pi_i + Pi2.
// Approximate log evidence (marginal over each true theta_i, m_i ~ N(line_i, 1/Pi_i + 1/Pi2)):
//   ln E(beta) = sum_i ln N(m_i; beta0 + beta1 x_i, 1/Pi_i + 1/Pi2).
//   "beta1 free"  : the slider values beta0, beta1.
//   "beta1 = 0"   : a precise prior at beta1 = 0; beta0 is refitted (generalised least squares at the current Pi2).
// Buttons: fit both betas (GLS), fit flat line. All text comes from labels; nothing course-specific.
//
//   subjects: [{x, m, sd}]   xRange: [lo, hi]   yRange: [lo, hi]   (default: span the data)
//   beta0, beta1, pi2: initial   beta0Range, beta1Range, pi2Range: slider ranges   shrink: true (initial toggle)
//   labels: { x, theta, beta0, beta1, pi2, points, line, flat, shrunk, shrinkToggle, fitBoth, fitFlat, evFree, evNull, evDiff, nats }
//     (x, theta, beta0, beta1, pi2: KaTeX sources, no $; others plain or $-text)
//   presets: [{ label, beta0, beta1, pi2, shrink, fit }]   fit: 'both' | 'flat' (applied last)

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
const fmt = (v, d = 2) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d).replace('-', '−');
const tex = s => `$${String(s).replace(/^\$|\$$/g, '')}$`;
const LN2PI = Math.log(2 * Math.PI);

const W = 420, H = 270, PL = 34, PR = 12, PT = 12, PB = 26;

export function pebRegression(el, cfg) {
  const L = { x: 'x', theta: '\\theta', beta0: '\\beta_0', beta1: '\\beta_1', pi2: '\\Pi^{(2)}', points: 'subject estimate', line: 'group line',
    flat: 'line with slope 0', shrunk: 'shrunk estimate', shrinkToggle: 'Show shrinkage', fitBoth: 'Fit both', fitFlat: 'Fit flat line',
    evFree: 'log evidence, slope free', evNull: 'log evidence, slope 0', evDiff: 'difference', nats: 'nats', ...(cfg.labels ?? {}) };
  const S = (cfg.subjects ?? []).map(s => ({ x: s.x, m: s.m, sd: s.sd, P: 1 / (s.sd * s.sd) }));
  const n = S.length;
  const xmin = Math.min(...S.map(s => s.x)), xmax = Math.max(...S.map(s => s.x));
  const ymin = Math.min(...S.map(s => s.m - 2 * s.sd)), ymax = Math.max(...S.map(s => s.m + 2 * s.sd));
  const [xlo, xhi] = cfg.xRange ?? [xmin - 0.08 * (xmax - xmin), xmax + 0.08 * (xmax - xmin)];
  const [ylo, yhi] = cfg.yRange ?? [ymin - 0.05 * (ymax - ymin), ymax + 0.05 * (ymax - ymin)];
  const b0R = cfg.beta0Range ?? [ylo, yhi], b1R = cfg.beta1Range ?? [-(yhi - ylo) / (xhi - xlo) * 2, (yhi - ylo) / (xhi - xlo) * 2];
  const p2R = cfg.pi2Range ?? [0.1, 20];
  let b0 = cfg.beta0 ?? (ylo + yhi) / 2, b1 = cfg.beta1 ?? 0, p2 = cfg.pi2 ?? 2, shrink = cfg.shrink !== false;

  // ---- maths ----
  const wts = () => S.map(s => 1 / (1 / s.P + 1 / p2));          // 1/(1/Pi_i + 1/Pi2)
  const lnE = (c0, c1) => S.reduce((a, s, i) => { const v = 1 / s.P + 1 / p2; return a - 0.5 * (LN2PI + Math.log(v) + (s.m - c0 - c1 * s.x) ** 2 / v); }, 0);
  const fitBoth = () => {
    const w = wts(); let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    S.forEach((s, i) => { sw += w[i]; sx += w[i] * s.x; sy += w[i] * s.m; sxx += w[i] * s.x * s.x; sxy += w[i] * s.x * s.m; });
    const d = sw * sxx - sx * sx, c1 = (sw * sxy - sx * sy) / d;
    return { b0: (sy - c1 * sx) / sw, b1: c1 };
  };
  const fitFlat = () => { const w = wts(); return S.reduce((a, s, i) => a + w[i] * s.m, 0) / w.reduce((a, v) => a + v, 0); };
  const shrunk = (c0, c1) => S.map(s => { const l = c0 + c1 * s.x; return { m: (s.P * s.m + p2 * l) / (s.P + p2), sd: 1 / Math.sqrt(s.P + p2), line: l }; });

  // ---- plot ----
  const X = x => PL + ((x - xlo) / (xhi - xlo)) * (W - PL - PR);
  const Y = y => H - PB - ((y - ylo) / (yhi - ylo)) * (H - PB - PT);
  const cid = Math.random().toString(36).slice(2, 8);
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pr-svg', role: 'img', 'aria-label': 'subject estimates against the covariate' });
  svg.append(sv('clipPath', { id: `pr${cid}` }, sv('rect', { x: PL, y: PT, width: W - PL - PR, height: H - PB - PT })), sv('rect', { x: 0, y: 0, width: W, height: H, class: 'pr-frame' }));
  const tk = (lo, hi) => { const raw = (hi - lo) / 5, pw = 10 ** Math.floor(Math.log10(raw)), st = [1, 2, 5, 10].map(m => m * pw).find(v => v >= raw); const r = []; for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) r.push(+v.toFixed(8)); return r; };
  const num = v => String(v).replace('-', '−');
  for (const v of tk(xlo, xhi)) svg.append(sv('line', { x1: X(v), x2: X(v), y1: H - PB, y2: H - PB + 4, class: 'pr-axis' }), sv('text', { x: X(v), y: H - 10, class: 'pr-tick', 'text-anchor': 'middle' }, document.createTextNode(num(v))));
  for (const v of tk(ylo, yhi)) svg.append(sv('line', { x1: PL - 4, x2: PL, y1: Y(v), y2: Y(v), class: 'pr-axis' }), sv('text', { x: PL - 6, y: Y(v) + 3, class: 'pr-tick', 'text-anchor': 'end' }, document.createTextNode(num(v))));
  svg.append(sv('line', { x1: PL, x2: W - PR, y1: H - PB, y2: H - PB, class: 'pr-axis' }), sv('line', { x1: PL, x2: PL, y1: PT, y2: H - PB, class: 'pr-axis' }));
  const g = sv('g', { 'clip-path': `url(#pr${cid})` });
  svg.append(g);

  const lg = (cls, txt) => h('span', { class: 'pr-key' }, h('i', { class: cls }), M(txt));
  const legend = h('div', { class: 'pr-leg' }, lg('pr-sw-pt', L.points), lg('pr-sw-line', L.line), lg('pr-sw-flat', L.flat), lg('pr-sw-sh', L.shrunk));
  const cap = h('div', { class: 'pr-cap' }, M(`${tex(L.theta)} (vertical) · ${tex(L.x)} (horizontal)`));

  const sl = (label, min, max, step, val, on) => {
    const out = h('span', { class: 'bs-val' });
    const inp = h('input', { type: 'range', min, max, step, value: val, 'aria-label': String(label).replace(/\$/g, '') });
    inp.addEventListener('input', () => { on(+inp.value); draw(); });
    return { row: h('div', { class: 'wslider' }, h('span', { class: 'bs-sl' }, M(tex(label))), inp, out), inp, out };
  };
  const s0 = sl(L.beta0, b0R[0], b0R[1], (b0R[1] - b0R[0]) / 400, b0, v => { b0 = v; });
  const s1 = sl(L.beta1, b1R[0], b1R[1], (b1R[1] - b1R[0]) / 400, b1, v => { b1 = v; });
  const s2 = sl(L.pi2, p2R[0], p2R[1], (p2R[1] - p2R[0]) / 400, p2, v => { p2 = v; });
  const chk = h('input', { type: 'checkbox', checked: shrink ? '' : null });
  chk.checked = shrink;
  chk.addEventListener('change', () => { shrink = chk.checked; draw(); });
  const toggle = h('label', { class: 'pr-toggle' }, chk, M(L.shrinkToggle));
  const setAll = (c0, c1) => { b0 = Math.min(b0R[1], Math.max(b0R[0], c0)); b1 = Math.min(b1R[1], Math.max(b1R[0], c1)); s0.inp.value = b0; s1.inp.value = b1; draw(); };
  const btn = (txt, on) => h('button', { class: 'btn ghost', type: 'button', onclick: on }, M(txt));
  const doFit = k => { if (k === 'both') { const f = fitBoth(); setAll(f.b0, f.b1); } else if (k === 'flat') setAll(fitFlat(), 0); };
  const presetBtns = (cfg.presets ?? []).map(p => btn(p.label, () => {
    if (p.beta0 != null) b0 = p.beta0; if (p.beta1 != null) b1 = p.beta1;
    if (p.pi2 != null) { p2 = p.pi2; s2.inp.value = p2; }
    if (p.shrink != null) { shrink = p.shrink; chk.checked = shrink; }
    s0.inp.value = b0; s1.inp.value = b1;
    if (p.fit) doFit(p.fit); else draw();
  }));
  const row = (label, cls) => { const v = h('b', { class: 'pr-num' }); return { v, row: h('div', { class: `pr-ev ${cls ?? ''}` }, h('span', { class: 'pr-ev-l' }, M(label)), v, h('span', { class: 'pr-unit' }, M(L.nats))) }; };
  const rF = row(L.evFree), rN = row(L.evNull), rD = row(L.evDiff, 'pr-diff');
  el.append(legend, cap, svg, s0.row, s1.row, s2.row, toggle,
    h('div', { class: 'wbtns' }, btn(L.fitBoth, () => doFit('both')), btn(L.fitFlat, () => doFit('flat'))),
    ...(presetBtns.length ? [h('div', { class: 'wbtns' }, ...presetBtns)] : []), rF.row, rN.row, rD.row);

  function draw() {
    g.textContent = '';
    const flat0 = fitFlat();
    g.append(sv('line', { x1: X(xlo), x2: X(xhi), y1: Y(flat0), y2: Y(flat0), class: 'pr-flat' }),
      sv('line', { x1: X(xlo), x2: X(xhi), y1: Y(b0 + b1 * xlo), y2: Y(b0 + b1 * xhi), class: 'pr-line' }));
    const sh = shrunk(b0, b1);
    S.forEach((s, i) => {
      const faded = shrink ? ' pr-faded' : '';
      g.append(sv('line', { x1: X(s.x), x2: X(s.x), y1: Y(s.m - s.sd), y2: Y(s.m + s.sd), class: 'pr-bar' + faded }), sv('circle', { cx: X(s.x), cy: Y(s.m), r: 4, class: 'pr-pt' + faded }));
      if (shrink) {
        const t = sh[i];
        g.append(sv('line', { x1: X(s.x), x2: X(s.x), y1: Y(s.m), y2: Y(t.m), class: 'pr-link' }),
          sv('line', { x1: X(s.x), x2: X(s.x), y1: Y(t.m - t.sd), y2: Y(t.m + t.sd), class: 'pr-bar pr-bar-sh' }), sv('circle', { cx: X(s.x), cy: Y(t.m), r: 4.5, class: 'pr-pt-sh' }));
      }
    });
    s0.out.textContent = fmt(b0); s1.out.textContent = fmt(b1, 3); s2.out.textContent = fmt(p2);
    const eF = lnE(b0, b1), eN = lnE(flat0, 0);
    rF.v.textContent = fmt(eF); rN.v.textContent = fmt(eN); rD.v.textContent = fmt(eF - eN);
    legend.querySelectorAll('.pr-key')[3].style.display = shrink ? '' : 'none';
    Object.assign(el.dataset, { beta0: fmt(b0, 4), beta1: fmt(b1, 4), pi2: fmt(p2, 4), lnEFree: fmt(eF, 4), lnENull: fmt(eN, 4), diff: fmt(eF - eN, 4),
      flat: fmt(flat0, 4), shrunk: sh.map(t => fmt(t.m, 4)).join(','), shrink: String(shrink) });
  }
  draw();
}
