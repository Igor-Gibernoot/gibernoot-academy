// light-cones
//
// A 1+1 spacetime picture (a across, τ up) with a Lorentzian metric of
// signature (+, −) from a preset, all of the form
//   g = dτ⊗dτ − k² σ⊗σ,  σ := da − s(a) dτ,
// so g_p(X, Y) = X^τ Y^τ − k² (X^a − s X^τ)(Y^a − s Y^τ) for components in the
// order (a, τ). Null directions at p: X^a = (s ± 1/k) X^τ. Time orientation
// ᛏ = ±(s, 1), with g(ᛏ, ᛏ) = 1. Drawn: the light cone at a draggable p (two
// null lines, ink), its future half shaded green, ᛏ(p) (green arrow), a
// draggable vector 𝒳_p (blue, drawn from p), optionally small cones on a grid.
// Readout: the metric and its components at p, the components of 𝒳_p,
// g_p(𝒳_p, 𝒳_p) in numbers with timelike / lightlike / spacelike, and
// g_p(ᛏ(p), 𝒳_p) with future / past directed (causal vectors only).
//
// config:
//   metric: 'minkowski' | 'tilted' | 'scaled', views: [...] (buttons offered)
//   p: [0, 0], X: [1, 2] (components (X^a, X^τ)), snap: 0.5 (p), snapX: 0.25,
//   nullSnap: true, field: false, orientation: true | 'down' | false,
//   flip: false (button), badge: true (class words), dragP, dragX: true,
//   view: { x: -3, y: -2.5, w: 6, h: 5 }, presets: [{ label, metric, p, X, orientation }]

import { h } from '../dom.js';
import { mdInline } from '../render.js';
import { P, arrow, label, line, placeHandle, planeSvg, s } from './plane.js';

export const LC_METRICS = {
  minkowski: { name: 'Minkowski', k: 1, s: () => 0, md: 'g = d\\tau\\otimes d\\tau - da\\otimes da',
    q: '(X^\\tau)^2 - (X^a)^2', b: '\\text{ᛏ}^\\tau X^\\tau - \\text{ᛏ}^a X^a' },
  tilted: { name: 'Tilted', k: 1, s: a => a / 4,
    md: 'g = d\\tau\\otimes d\\tau - \\sigma\\otimes\\sigma$, with $\\sigma := da - s\\,d\\tau$ and $s := a/4',
    q: '(X^\\tau)^2 - (X^a - sX^\\tau)^2', b: '\\text{ᛏ}^\\tau X^\\tau - (\\text{ᛏ}^a - s\\text{ᛏ}^\\tau)(X^a - sX^\\tau)' },
  scaled: { name: 'Scaled', k: 2, s: () => 0, md: 'g = d\\tau\\otimes d\\tau - 4\\,da\\otimes da',
    q: '(X^\\tau)^2 - 4(X^a)^2', b: '\\text{ᛏ}^\\tau X^\\tau - 4\\,\\text{ᛏ}^a X^a' },
};
export const lcG = (M, a, X, Y) => { const s = M.s(a); return X[1] * Y[1] - M.k * M.k * (X[0] - s * X[1]) * (Y[0] - s * Y[1]); };

export function lightCones(el, cfg) {
  const sn = cfg.snap ?? 0.5, snX = cfg.snapX ?? 0.25;
  const views = (cfg.views ?? [cfg.metric ?? 'minkowski']).filter(k => LC_METRICS[k]);
  const view = cfg.view ?? { x: -3, y: -2.5, w: 6, h: 5 };
  const f3 = x => (Math.abs(x) < 5e-4 ? '0' : String(Math.round(x * 1000) / 1000));
  const par = x => (f3(x).startsWith('-') ? `(${f3(x)})` : f3(x));
  const oriOf = o => (o === false ? 0 : o === 'down' ? -1 : 1);
  const init = () => ({
    m: LC_METRICS[cfg.metric] ? cfg.metric : views[0] ?? 'minkowski',
    p: [...(cfg.p ?? [0, 0])], X: [...(cfg.X ?? [1, 2])], ori: oriOf(cfg.orientation ?? true),
  });
  let st = init();
  const { svg, layers: L } = planeSvg(view, 'Spacetime with the light cone at p, its future half, the time orientation and a vector X at p',
    ['field', 'cone', 'arrows', 'marks', 'labels', 'handles']);
  const readout = h('div', { class: 'readout' });
  const mBtns = views.length > 1 ? views.map(k => h('button', { class: 'btn ghost', type: 'button', 'data-m': k,
    onclick: () => { st.m = k; draw(); } }, LC_METRICS[k].name)) : [];
  const flipBtn = cfg.flip && st.ori ? h('button', { class: 'btn ghost', type: 'button',
    html: mdInline('Flip $\\text{ᛏ}$'), onclick: () => { st.ori = -st.ori; draw(); } }) : null;
  const btns = h('div', { class: 'wbtns' }, mBtns, flipBtn,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      if (pr.metric && LC_METRICS[pr.metric]) st.m = pr.metric;
      if (pr.p) st.p = [...pr.p];
      if (pr.X) st.X = [...pr.X];
      if (pr.orientation != null) st.ori = oriOf(pr.orientation);
      draw();
    } }, pr.label)));
  el.append(h('div', { class: 'cc-panels single' }, svg), readout, btns);

  // the two null directions at a with X^τ of sign sg (unit Euclidean length):
  // for ᛏ = sg (s, 1) these are the future ones
  const nulls = (M, a, sg = 1) => [1, -1].map(e => {
    const d = [M.s(a) + e / M.k, 1], n = Math.hypot(...d);
    return [sg * d[0] / n, sg * d[1] / n];
  });
  const svgPt = ev => {
    const q = svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
    const m = q.matrixTransform(svg.getScreenCTM().inverse());
    return [m.x, -m.y];
  };
  const clampV = ([x, y], mg = 0.2) => [Math.max(view.x + mg, Math.min(view.x + view.w - mg, x)), Math.max(view.y + mg, Math.min(view.y + view.h - mg, y))];
  const drag = (hd, onMove) => hd.addEventListener('pointerdown', e => {
    e.preventDefault();
    hd.setPointerCapture(e.pointerId);
    const move = ev => { onMove(svgPt(ev)); draw(); };
    const up = () => { hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); };
    hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
  });
  const xh = cfg.dragX === false ? null : s('circle', { r: 0.22, class: 'w-handle vec', tabindex: 0, 'aria-label': 'tip of the vector X at p' });
  const ph = cfg.dragP === false ? null : s('circle', { r: 0.2, class: 'w-handle cv-bend', tabindex: 0, 'aria-label': 'the point p' });
  if (xh) {
    L.handles.append(xh);
    drag(xh, m => {
      const t = clampV(m), raw = [t[0] - st.p[0], t[1] - st.p[1]];
      let X = raw.map(v => (snX ? Math.round(v / snX) * snX : v));
      // magnet: onto a null line when the pointer is close to it (X^τ stays on the snap grid)
      if (cfg.nullSnap !== false && Math.hypot(...raw) > 0.3)
        for (const d of nulls(LC_METRICS[st.m], st.p[0]))
          if (Math.abs(raw[0] * d[1] - raw[1] * d[0]) < 0.15) {
            const xt = Math.round(raw[1] / snX) * snX || Math.sign(raw[1]) * snX;
            X = [xt * d[0] / d[1], xt];
          }
      st.X = X;
    });
  }
  if (ph) {
    L.handles.append(ph);
    drag(ph, m => { st.p = clampV(m, 0.25).map(v => (sn ? Math.round(v / sn) * sn : v)); });
  }

  const inside = ([x, y]) => [Math.max(view.x + 0.4, Math.min(view.x + view.w - 0.45, x)), Math.max(view.y + 0.22, Math.min(view.y + view.h - 0.22, y))];
  // label of 𝒳ₚ: beyond the tip, else beside it (either side), else clamped
  const xLab = (tip, X, xl) => {
    const u = [X[0] / xl, X[1] / xl], n = [u[1], -u[0]];
    const c = [[tip[0] + 0.38 * u[0] - 0.22 * u[1], tip[1] + 0.38 * u[1] + 0.22 * u[0]],
      [tip[0] + 0.5 * n[0], tip[1] + 0.5 * n[1]], [tip[0] - 0.5 * n[0], tip[1] - 0.5 * n[1]]];
    return c.find(q => inside(q).every((v, i) => Math.abs(v - q[i]) < 1e-9)) ?? inside(c[0]);
  };
  const wedge = (q, d1, d2, r) => s('polygon', { points: [q, [q[0] + r * d1[0], q[1] + r * d1[1]], [q[0] + r * d2[0], q[1] + r * d2[1]]].map(v => P(...v).join(',')).join(' '), class: 'lc-future' });
  function cone(layer, M, q, r, sg, cls) {
    const [d1, d2] = nulls(M, q[0], sg || 1);
    if (sg) layer.append(wedge(q, d1, d2, r));
    for (const d of [d1, d2]) layer.append(line([q[0] - r * d[0], q[1] - r * d[1]], [q[0] + r * d[0], q[1] + r * d[1]], cls));
    return [d1, d2];
  }

  function draw() {
    for (const k of ['field', 'cone', 'arrows', 'marks', 'labels']) L[k].replaceChildren();
    const M = LC_METRICS[st.m], p = st.p, X = st.X, a = p[0], sg = st.ori;
    for (const bt of mBtns) bt.className = `btn ${bt.dataset.m === st.m ? 'primary' : 'ghost'}`;
    L.labels.append(label([view.x + view.w - 0.25, -0.28], 'a', ''));
    L.labels.append(label([0.25, view.y + view.h - 0.25], 'τ', ''));

    if (cfg.field)
      for (let i = Math.ceil(view.x + 0.4); i <= view.x + view.w - 0.4; i++)
        for (let j = Math.ceil(view.y + 0.4); j <= view.y + view.h - 0.4; j++)
          if (Math.hypot(i - p[0], j - p[1]) > 0.7) cone(L.field, M, [i, j], 0.32, sg, 'lc-null thin');

    // the cone at p: future half shaded, two null lines; ᛏ(p)
    const [d1, d2] = cone(L.cone, M, p, 30, sg, 'lc-null');
    const T = sg ? [sg * M.s(a), sg] : null;
    if (sg) {
      const ax = [d1[0] + d2[0], d1[1] + d2[1]], n = Math.hypot(...ax), u = [ax[0] / n, ax[1] / n];
      const ok = q => q[0] > view.x + 0.6 && q[0] < view.x + view.w - 0.6 && q[1] > view.y + 0.25 && q[1] < view.y + view.h - 0.25;
      for (const [k, word] of [[1, 'future'], [-1, 'past']]) {
        const q = [1.75, 1.4].map(r => [p[0] + k * r * u[0], p[1] + k * r * u[1]]).find(ok);
        if (q) L.labels.append(label(q, word, 'small lc-word'));
      }
      L.arrows.append(arrow(p, [p[0] + T[0], p[1] + T[1]], 'lc-tau'));
      L.labels.append(label(inside([p[0] + T[0] + 0.45, p[1] + T[1] - 0.12]), 'ᛏ(p)', 'lc-tau lc-rune'));
    }
    const tip = [p[0] + X[0], p[1] + X[1]], xl = Math.hypot(...X) || 1;
    L.arrows.append(arrow(p, tip, 'w-vec lc-x'));
    L.labels.append(label(xLab(tip, X, xl), '𝒳ₚ', 'vec'));
    L.marks.append(s('circle', { cx: P(...p)[0], cy: P(...p)[1], r: 0.08, class: 'cv-dot' }));
    L.labels.append(label([p[0] - 0.32, p[1] - 0.3], 'p', ''));
    if (ph) placeHandle(ph, p);
    if (xh) placeHandle(xh, tip);

    // readout
    const s0 = M.s(a), k2 = M.k * M.k, tilt = st.m === 'tilted', words = cfg.badge !== false;
    const zero = Math.hypot(...X) < 1e-9, gq = lcG(M, a, X, X), nullX = Math.abs(gq) < 1e-9;
    const cls = nullX ? 'lightlike' : gq > 0 ? 'timelike' : 'spacelike';
    const sq = v => `${par(v)}^2`, kk = k2 === 1 ? '' : `${k2}\\cdot `;
    const qn = tilt ? `${sq(X[1])} - ${sq(X[0] - s0 * X[1])}` : `${sq(X[1])} - ${kk}${sq(X[0])}`;
    const nl = [s0 + 1 / M.k, s0 - 1 / M.k];
    const rows = [
      h('div', { class: 'wide', html: mdInline(`Metric (${M.name}): $${M.md}$.`) }),
      h('div', { class: 'wide cb-tag', html: mdInline(`At $p = (${f3(p[0])}, ${f3(p[1])})$${tilt ? `, $s = ${f3(s0)}$` : ''}; components in the order $(a, \\tau)$: $g_{aa} = ${f3(-k2)}$, $g_{a\\tau} = ${f3(k2 * s0)}$, $g_{\\tau\\tau} = ${f3(1 - k2 * s0 * s0)}$.`) }),
      h('div', { class: 'wide', html: mdInline(`Light cone at $p$: the null lines spanned by $(${f3(nl[0])}, 1)$ and $(${f3(nl[1])}, 1)$.`) }),
      h('div', { class: 'wide c-vec', html: mdInline(`Components of $\\mathcal{X}_p$ in the order $(a, \\tau)$: $X^a = ${f3(X[0])}$, $X^\\tau = ${f3(X[1])}$.`) }),
    ];
    if (zero) rows.push(h('div', { class: 'wide', html: mdInline('$\\mathcal{X}_p = 0$: only non-zero vectors are classified.') }));
    else rows.push(h('div', { class: 'wide', html: mdInline(`$g_p(\\mathcal{X}_p, \\mathcal{X}_p) = ${M.q}$ $= ${qn} = ${f3(gq)}$${words ? `, ${nullX ? 'zero' : gq > 0 ? 'positive' : 'negative'}: **${cls}**` : ''}.`) }));
    let gb = 0;
    if (sg) {
      gb = lcG(M, a, T, X);
      const bn = tilt ? `${par(T[1])}\\cdot ${par(X[1])} - ${par(T[0] - s0 * T[1])}\\cdot ${par(X[0] - s0 * X[1])}`
        : `${par(T[1])}\\cdot ${par(X[1])} - ${kk}${par(T[0])}\\cdot ${par(X[0])}`;
      rows.push(h('div', { class: 'wide lc-green', html: mdInline(`Time orientation $\\text{ᛏ}(p) = (${f3(T[0])}, ${f3(T[1])})$, with $g_p(\\text{ᛏ}(p), \\text{ᛏ}(p)) = ${f3(lcG(M, a, T, T))} > 0$.`) }));
      if (!zero) {
        const tail = !words ? '' : gq < -1e-9 ? '; spacelike vectors are neither future nor past directed'
          : `, ${gb > 0 ? 'positive' : 'negative'}: **${gb > 0 ? 'future' : 'past'} directed**`;
        rows.push(h('div', { class: 'wide', html: mdInline(`$g_p(\\text{ᛏ}(p), \\mathcal{X}_p) = ${M.b}$ $= ${bn} = ${f3(gb)}$${tail}.`) }));
      }
    }
    if (words && !zero) {
      const dir = sg && gq >= -1e-9 ? (gb > 0 ? ', future directed' : ', past directed') : '';
      const where = cls === 'timelike' ? 'inside the cone' : cls === 'lightlike' ? 'on the cone' : 'outside the cone';
      rows.push(h('div', { class: `wide ${cls === 'timelike' ? 'ok' : cls === 'lightlike' ? 'lc-gold' : 'lc-space'}`,
        html: mdInline(`$\\mathcal{X}_p$ is **${cls}${dir}** (${where}).`) }));
    }
    readout.replaceChildren(...rows);
  }
  draw();
}
