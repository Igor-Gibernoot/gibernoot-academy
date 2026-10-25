// time-slices
//
// A 1+1 spacetime picture: horizontal axis a (space), vertical axis τ, and a
// time function t (preset). Drawn: the level curves 𝒮_c = preim_t({c}) at
// c = multiples of `step` (thin ink), the slice of the slider's c in gold, a
// draggable point p with the line ker(dt)_p through it (ink: the spatial
// directions at p, tangent to the slice through p) and the covector (dt)_p as
// its two level lines (dt)_p(w) = ±1 for displacements w from p (orange,
// dashed). Readout: t(p), (dt)_p = (∂t/∂a) da + (∂t/∂τ) dτ, a vector v spanning
// the kernel with (dt)_p(v) = 0 in numbers, the gold slice, and the badge
// "Absolute time?" (Yes iff dt ≠ 0 at every point in view; No with a point
// where dt = 0, marked on the picture).
//
// config:
//   time:   'flat' | 'wavy' | 'squared' | 'boosted'
//   times:  ['flat', 'wavy']    buttons offered (one entry: none)
//   p: [1, 0.5], c: t(p) (initial gold slice), step: 0.5, snap: 0.25,
//   kernel: true, stack: true, badge: true, dragP: true, view: { x, y, w, h }
//   presets: [{ label, time, p, c }]

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { P, fmt, label, line, placeHandle, planeSvg, s } from './plane.js';

const TS_R = Math.sqrt(0.75);
const TS_TIMES = {
  flat: { md: 't(a, \\tau) = \\tau',
    t: ([, u]) => u, dt: () => [0, 1], taus: (a, c) => [c] },
  wavy: { md: 't(a, \\tau) = \\tau + 0.3\\sin a',
    t: ([a, u]) => u + 0.3 * Math.sin(a), dt: ([a]) => [0.3 * Math.cos(a), 1], taus: (a, c) => [c - 0.3 * Math.sin(a)] },
  squared: { md: 't(a, \\tau) = \\tau^2', cmin: -1,
    t: ([, u]) => u * u, dt: ([, u]) => [0, 2 * u],
    taus: (a, c) => (c > 1e-12 ? [Math.sqrt(c), -Math.sqrt(c)] : Math.abs(c) <= 1e-12 ? [0] : []),
    // dt = 0 exactly on the line τ = 0: report the point of it below/above p
    zero: (view, p) => (view.y <= 0 && view.y + view.h >= 0 ? { q: [p[0], 0], note: 'in fact on the whole line $\\tau = 0$' } : null) },
  boosted: { md: 't(a, \\tau) = (\\tau - 0.5\\,a)/\\sqrt{0.75}',
    t: ([a, u]) => (u - 0.5 * a) / TS_R, dt: () => [-0.5 / TS_R, 1 / TS_R], taus: (a, c) => [0.5 * a + c * TS_R] },
};

export function timeSlices(el, cfg) {
  const sn = cfg.snap ?? 0.25, step = cfg.step ?? 0.5;
  const times = (cfg.times ?? [cfg.time ?? 'flat']).filter(k => TS_TIMES[k]);
  const view = cfg.view ?? { x: -3, y: -2.5, w: 6, h: 5 };
  const init = () => {
    const tm = TS_TIMES[cfg.time] ? cfg.time : times[0] ?? 'flat';
    const p = [...(cfg.p ?? [1, 0.5])];
    return { tm, p, c: cfg.c ?? TS_TIMES[tm].t(p) };
  };
  let st = init();
  const { svg, layers: L } = planeSvg(view, 'Spacetime with the slices of a time function, a point p and the line of spatial directions at p',
    ['slices', 'gold', 'arrows', 'marks', 'labels', 'handles']);
  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', 'aria-label': 'value c of the highlighted slice' });
  slider.addEventListener('input', () => { st.c = +slider.value; draw(); });
  const cOut = h('span', { class: 'pt-lam' });
  const timeBtns = times.length > 1 ? times.map(k => h('button', { class: 'btn ghost', type: 'button', 'data-time': k,
    html: mdInline(`$${TS_TIMES[k].md}$`), onclick: () => { st.tm = k; st.c = TS_TIMES[k].t(st.p); draw(); } })) : [];
  const btns = h('div', { class: 'wbtns' },
    timeBtns,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.c = TS_TIMES[st.tm].t(st.p); draw(); } }, 'Slice through p'),
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      const tm = pr.time && TS_TIMES[pr.time] ? pr.time : st.tm, p = pr.p ? [...pr.p] : st.p;
      st = { tm, p, c: pr.c ?? TS_TIMES[tm].t(p) };
      draw();
    } }, pr.label)));
  el.append(h('div', { class: 'cc-panels single' }, svg), h('label', { class: 'wslider' }, cOut, slider), readout, btns);

  // drag p
  const ph = cfg.dragP === false ? null : s('circle', { r: 0.2, class: 'w-handle cv-bend', tabindex: 0, 'aria-label': 'the point p' });
  if (ph) {
    L.handles.append(ph);
    ph.addEventListener('pointerdown', e => {
      e.preventDefault();
      ph.setPointerCapture(e.pointerId);
      const move = ev => {
        const q = svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
        const m = q.matrixTransform(svg.getScreenCTM().inverse());
        const x = Math.max(view.x + 0.25, Math.min(view.x + view.w - 0.25, m.x)), y = Math.max(view.y + 0.25, Math.min(view.y + view.h - 0.25, -m.y));
        st.p = [x, y].map(t => (sn ? Math.round(t / sn) * sn : t)); draw();
      };
      const up = () => { ph.removeEventListener('pointermove', move); ph.removeEventListener('pointerup', up); ph.removeEventListener('pointercancel', up); };
      ph.addEventListener('pointermove', move); ph.addEventListener('pointerup', up); ph.addEventListener('pointercancel', up);
    });
  }

  // range of t over the view (grid), for the slider and the drawn slices
  const grid = fn => { for (let i = 0; i <= 60; i++) for (let j = 0; j <= 60; j++) { const r = fn([view.x + view.w * i / 60, view.y + view.h * j / 60]); if (r) return r; } return null; };
  const tRange = T => { let lo = Infinity, hi = -Infinity; grid(q => { const v = T.t(q); lo = Math.min(lo, v); hi = Math.max(hi, v); }); return [lo, hi]; };
  // dt ≠ 0 everywhere in view? (analytic zero set if the preset has one, else a grid search)
  const zeroOf = (T, p) => (T.zero ? T.zero(view, p) : grid(q => (Math.hypot(...T.dt(q)) < 1e-9 ? { q, note: '' } : null)));
  const slicePaths = (T, c) => {
    const N = 240, br = [];
    for (let i = 0; i <= N; i++) {
      const a = view.x + view.w * i / N;
      T.taus(a, c).forEach((u, k) => { (br[k] ??= []).push(P(a, u).join(',')); });
    }
    return br.map(b => b.join(' '));
  };
  const inView = (q, mx = 0.3, my = 0.2) => q[0] > view.x + mx && q[0] < view.x + view.w - mx && q[1] > view.y + my && q[1] < view.y + view.h - my;

  function draw() {
    for (const k of ['slices', 'gold', 'arrows', 'marks', 'labels']) L[k].replaceChildren();
    const T = TS_TIMES[st.tm], p = st.p;
    for (const bt of timeBtns) bt.className = `btn ${bt.dataset.time === st.tm ? 'primary' : 'ghost'}`;
    const [lo, hi] = tRange(T);
    const cmin = Math.min(T.cmin ?? Infinity, Math.floor(lo / step) * step), cmax = Math.ceil(hi / step) * step;
    st.c = Math.max(cmin, Math.min(cmax, st.c));
    slider.min = cmin; slider.max = cmax; slider.step = 0.05; slider.value = st.c;
    cOut.innerHTML = tex(`c = ${fmt(st.c)}`);

    // slices at multiples of step, then the gold one
    for (let k = Math.ceil(lo / step - 1e-9); k * step <= hi + 1e-9; k++)
      for (const d of slicePaths(T, k * step)) L.slices.append(s('polyline', { points: d, class: 'ts-slice' }));
    const gold = slicePaths(T, st.c);
    for (const d of gold) L.gold.append(s('polyline', { points: d, class: 'ts-slice gold' }));
    if (gold.length) {
      // label near the edge away from p, just above the upper branch
      const ax = p[0] > view.x + view.w / 2 ? view.x + 0.85 : view.x + view.w - 0.85, u = T.taus(ax, st.c)[0] + 0.28;
      if (inView([ax, u])) L.labels.append(label([ax, u], `c = ${fmt(st.c)}`, 'gold small'));
    }
    // axis names
    L.labels.append(label([view.x + view.w - 0.25, -0.28], 'a', ''));
    L.labels.append(label([0.25, view.y + view.h - 0.25], 'τ', ''));

    // (dt)_p, its kernel and its level lines (dt)_p(w) = ±1
    const C = T.dt(p), n2 = C[0] ** 2 + C[1] ** 2, tp = T.t(p);
    const zeroP = n2 < 1e-18;
    if (!zeroP) {
      const nn = Math.sqrt(n2), u = [C[1] / nn, -C[0] / nn], nrm = [C[0] / nn, C[1] / nn];
      if (cfg.stack !== false)
        for (const k of [1, -1]) {
          const o = [p[0] + k * C[0] / n2, p[1] + k * C[1] / n2];
          L.arrows.append(line([o[0] - 1.2 * u[0], o[1] - 1.2 * u[1]], [o[0] + 1.2 * u[0], o[1] + 1.2 * u[1]], 'w-level ts-stack'));
          const lp = [o[0] + 1.45 * u[0], o[1] + 1.45 * u[1]], lq = [o[0] - 1.45 * u[0], o[1] - 1.45 * u[1]];
          const lb = inView(lp) ? lp : inView(lq) ? lq : null;
          if (lb) L.labels.append(label(lb, k > 0 ? '+1' : '−1', 'covec small'));
        }
      if (cfg.kernel !== false) {
        L.arrows.append(line([p[0] - 1.5 * u[0], p[1] - 1.5 * u[1]], [p[0] + 1.5 * u[0], p[1] + 1.5 * u[1]], 'ts-ker'));
        const cands = [];
        for (const sg of [-1, 1]) for (const sd of [-1, 1]) {
          const e = [p[0] + sg * 1.05 * u[0], p[1] + sg * 1.05 * u[1]];
          cands.push([e[0] + sd * 0.25 * nrm[0], e[1] + sd * 0.25 * nrm[1]]);
        }
        L.labels.append(label(cands.find(q => inView(q, 0.75)) ?? cands[0], 'ker (dt)ₚ', 'small'));
      }
    }
    const zr = zeroOf(T, p);
    if (zr) {
      L.marks.append(s('circle', { cx: P(...zr.q)[0], cy: P(...zr.q)[1], r: 0.13, class: 'ts-zero' }));
      L.labels.append(label([zr.q[0] + (zr.q[0] > view.x + view.w - 1.2 ? -0.65 : 0.65), zr.q[1] - 0.28], 'dt = 0', 'small'));
    }
    L.marks.append(s('circle', { cx: P(...p)[0], cy: P(...p)[1], r: 0.08, class: 'cv-dot' }));
    L.labels.append(label([p[0] - 0.32, p[1] + 0.3], 'p', ''));
    if (ph) placeHandle(ph, p);

    // readout
    const term = (x, name) => `${x < 0 && fmt(x) !== '0' ? '-' : '+'} ${fmt(Math.abs(x))}\\,${name}`;
    const par = x => (x < 0 && fmt(x) !== '0' ? `(${fmt(x)})` : fmt(x));
    const rows = [
      h('div', { class: 'wide', html: mdInline(`Time function $${T.md}$; the point $p = (${fmt(p[0])}, ${fmt(p[1])})$ has $t(p) = ${fmt(tp)}$, so it lies on the slice $\\mathcal{S}_{${fmt(tp)}}$.`) }),
      h('div', { class: 'wide c-covec', html: tex(`(dt)_p = ${fmt(C[0])}\\,da ${term(C[1], 'd\\tau')}`) }),
      h('div', { class: 'wide cb-tag', html: mdInline(`components $(\\partial t/\\partial a)_p = ${fmt(C[0])}$ and $(\\partial t/\\partial \\tau)_p = ${fmt(C[1])}$`) }),
    ];
    if (zeroP) rows.push(h('div', { class: 'wide warn', html: mdInline('$(dt)_p = 0$: every vector $v$ at $p$ has $(dt)_p(v) = 0$, so $\\ker(dt)_p$ is the whole tangent space (dimension 2), not a line. Time stands still here.') }));
    else {
      const v = [C[1], -C[0]];
      rows.push(h('div', { class: 'wide', html: mdInline(`$\\ker(dt)_p$, the spatial directions at $p$, is the line spanned by the vector $v$ with components $v^a = ${fmt(v[0])}$, $v^\\tau = ${fmt(v[1])}$:`) }));
      rows.push(h('div', { class: 'wide', html: tex(`(dt)_p(v) = ${par(C[0])}\\cdot ${par(v[0])} + ${par(C[1])}\\cdot ${par(v[1])} = 0`) }));
    }
    rows.push(h('div', { class: 'wide', html: mdInline(gold.length
      ? `Gold: the slice $\\mathcal{S}_c = \\mathrm{preim}_t(\\{c\\})$ with $c = ${fmt(st.c)}$${gold.length > 1 ? ' (two curves)' : ''}.`
      : `Gold: $\\mathcal{S}_c$ with $c = ${fmt(st.c)}$ is empty, since $t$ never takes that value.`) }));
    if (cfg.badge !== false)
      rows.push(h('div', { class: `wide ${zr ? 'warn' : 'ok'}`, html: mdInline(zr
        ? `**Absolute time?** No: $(dt)_q = 0$ at $q = (${fmt(zr.q[0])}, ${fmt(zr.q[1])})$${zr.note ? `, ${zr.note}` : ''}. There time stands still.`
        : '**Absolute time?** Yes: $(dt)_q \\ne 0$ at every point $q$ in view, so time never stands still.') }));
    readout.replaceChildren(...rows);
  }
  draw();
}
