// rotating-grid
//
// Top view of the spatial plane of a Newtonian spacetime without gravity. A
// free particle moves straight in the inertial chart, x(t) = x₀ + v t; the
// rotating chart turns at constant θ̇ = ω (θ = ωt, no translation):
//   y¹ = x¹ cos ωt + x² sin ωt,  y² = −x¹ sin ωt + x² cos ωt,
// whose only nonzero coefficients are Γ¹₀₂ = Γ¹₂₀ = −ω, Γ²₀₁ = Γ²₁₀ = ω and
// Γ^α₀₀ = −ω² y^α. Panels: the inertial chart (x¹, x²) with the rotating grid
// drawn turning (purple lattice), and/or the rotating chart (y¹, y²) with the
// inertial grid turning the other way; the trace of the particle up to t
// (straight in the first, curling in the second). At the current t, in the
// rotating panel: the velocity ẏ (blue) and, per unit mass, the Coriolis
// pseudo-force −2Γ^α₀β ẏ^β = (2ωẏ², −2ωẏ¹) (gold), the centrifugal one
// −Γ^α₀₀ = ω² y (green) and their sum = ÿ (ink). Handles at t = 0 (where the
// charts agree): the start point x₀ and the tip of x₀ + v.
//
// config:
//   omega: 1, x0: [1, 0], v: [0, 0.5], t: 0, tmax: 6.28
//   view: 'both' | 'inertial' | 'rotating', views: ['inertial', 'rotating', 'both']
//   forces: true, components: true (false: only ÿ, no Coriolis/centrifugal arrows), forcesToggle: true, scale: 1 (arrow length per unit of
//   force), velocity: true, ghost: false (whole path faint), drag: true,
//   snap: 0.25, box: { x: -4, y: -4, w: 8, h: 8 },
//   presets: [{ label, omega, x0, v, t }]

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { P, arrow, fmt, label, line, placeHandle, planeSvg, s } from './plane.js';

const rgRot = (th, [a, b]) => [a * Math.cos(th) + b * Math.sin(th), -a * Math.sin(th) + b * Math.cos(th)];
const RG_VIEWS = ['inertial', 'rotating', 'both'];
const RG_WORD = { inertial: 'Inertial', rotating: 'Rotating', both: 'Both' };

export function rotatingGrid(el, cfg) {
  const sn = cfg.snap ?? 0.25, scale = cfg.scale ?? 1;
  const views = (cfg.views ?? RG_VIEWS).filter(k => RG_VIEWS.includes(k));
  const box = cfg.box ?? { x: -4, y: -4, w: 8, h: 8 };
  const init = () => ({
    w: cfg.omega ?? 1, x0: [...(cfg.x0 ?? [1, 0])], v: [...(cfg.v ?? [0, 0.5])], t: cfg.t ?? 0,
    tmax: cfg.tmax ?? 6.28, view: views.includes(cfg.view) ? cfg.view : views[views.length - 1] ?? 'both',
    forces: cfg.forces !== false,
  });
  let st = init();
  const xAt = u => [st.x0[0] + st.v[0] * u, st.x0[1] + st.v[1] * u];
  const yAt = u => rgRot(st.w * u, xAt(u));

  const mk = (name, aria) => {
    const { svg, layers } = planeSvg(box, aria, ['other', 'trace', 'arrows', 'marks', 'labels', 'handles']);
    const cap = h('div', { class: 'rg-cap', html: mdInline(name) });
    return { svg, L: layers, wrap: h('div', { class: 'rg-panel' }, svg, cap) };
  };
  const PI = mk('inertial chart $(x^1, x^2)$', 'Inertial chart: the straight path of a free particle, with the rotating grid turning');
  const PR = mk('rotating chart $(y^1, y^2)$', 'Rotating chart: the same path curling, with the Coriolis and centrifugal arrows');
  const panels = h('div', { class: 'cc-panels rg-panels' }, PI.wrap, PR.wrap);
  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', min: 0, step: 0.01, 'aria-label': 'absolute time t' });
  slider.addEventListener('input', () => { stop(); st.t = +slider.value; draw(); });
  const tOut = h('span', { class: 'pt-lam' });
  let anim = null;
  const playBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => play() }, 'Play');
  const viewBtns = views.length > 1 ? views.map(k => h('button', { class: 'btn ghost', type: 'button', 'data-view': k,
    onclick: () => { st.view = k; draw(); } }, RG_WORD[k])) : [];
  const forceBtn = cfg.forcesToggle === false ? null : h('button', { class: 'btn ghost', type: 'button',
    onclick: () => { st.forces = !st.forces; draw(); } }, 'Forces');
  const btns = h('div', { class: 'wbtns' },
    playBtn, viewBtns, forceBtn,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      stop();
      if (pr.omega != null) st.w = pr.omega;
      if (pr.x0) st.x0 = [...pr.x0];
      if (pr.v) st.v = [...pr.v];
      st.t = pr.t ?? 0;
      draw();
    } }, pr.label)));
  el.append(panels, h('label', { class: 'wslider' }, tOut, slider), readout, btns);

  function stop() { if (anim) cancelAnimationFrame(anim); anim = null; playBtn.textContent = 'Play'; }
  function play() {
    if (anim) return stop();
    if (st.t >= st.tmax - 1e-9) st.t = 0;
    const tStart = st.t, dur = 7000 * (st.tmax - tStart) / st.tmax;
    let t0 = null;
    const step = tm => {
      if (!el.isConnected) return stop();
      if (t0 === null) t0 = tm;
      const u = Math.min(1, (tm - t0) / dur);
      st.t = tStart + (st.tmax - tStart) * u; draw();
      if (u < 1) anim = requestAnimationFrame(step); else stop();
    };
    playBtn.textContent = 'Pause';
    anim = requestAnimationFrame(step);
  }

  // handles at t = 0 (the charts agree there), in each panel: x₀ and the tip of x₀ + v
  const clampIn = q => [Math.max(box.x + 0.25, Math.min(box.x + box.w - 0.25, q[0])), Math.max(box.y + 0.25, Math.min(box.y + box.h - 0.25, q[1]))];
  const dragOn = (svg, c, onMove) => c.addEventListener('pointerdown', e => {
    e.preventDefault(); stop();
    c.setPointerCapture(e.pointerId);
    const move = ev => {
      const q = svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
      const m = q.matrixTransform(svg.getScreenCTM().inverse());
      onMove(clampIn([m.x, -m.y]).map(z => (sn ? Math.round(z / sn) * sn : z))); draw();
    };
    const up = () => { c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up); };
    c.addEventListener('pointermove', move); c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  });
  const handles = [];
  if (cfg.drag !== false)
    for (const Pn of [PI, PR]) {
      const hx = s('circle', { r: 0.2, class: 'w-handle rg-h', tabindex: 0, 'aria-label': 'start point x0' });
      const hv = s('circle', { r: 0.2, class: 'w-handle vec rg-h', tabindex: 0, 'aria-label': 'tip of the start velocity v' });
      Pn.L.handles.append(hx, hv);
      dragOn(Pn.svg, hx, q => { st.x0 = q; st.t = 0; });
      dragOn(Pn.svg, hv, q => { st.v = [q[0] - st.x0[0], q[1] - st.x0[1]]; st.t = 0; });
      handles.push([hx, hv]);
    }

  // the other chart's grid, turned by the angle th (lines at integer offsets), with its axis names
  function lattice(layer, labels, th, names) {
    const d = [Math.cos(th), Math.sin(th)], n = [-Math.sin(th), Math.cos(th)], R = 8;
    for (let k = -8; k <= 8; k++)
      for (const [a, b] of [[d, n], [n, d]])
        layer.append(line([k * b[0] - R * a[0], k * b[1] - R * a[1]], [k * b[0] + R * a[0], k * b[1] + R * a[1]], k === 0 ? 'w-lattice rg-axis' : 'w-lattice'));
    [d, n].forEach((e, i) => labels.append(label([3.3 * e[0] - 0.3 * e[1], 3.3 * e[1] + 0.3 * e[0]], names[i], 'basis small')));
  }
  const tracePts = (f, s1, N = 240) => { const pts = []; for (let i = 0; i <= N; i++) pts.push(P(...f(s1 * i / N)).join(',')); return pts.join(' '); };
  // arrow from a by F, labelled beyond its tip (side: push the label to the left (+1) or right (−1) of the arrow)
  const arrowLbl = (L, a, F, txt, cls, side = 0) => {
    const len = Math.hypot(...F);
    if (len < 1e-6) return;
    const b = [a[0] + F[0], a[1] + F[1]], u = [F[0] / len, F[1] / len];
    L.arrows.append(arrow(a, b, cls));
    L.labels.append(label([b[0] + 0.35 * u[0] - 0.3 * side * u[1], b[1] + 0.35 * u[1] + 0.3 * side * u[0]], txt, `small ${cls}`));
  };

  function draw() {
    for (const Pn of [PI, PR]) for (const k of ['other', 'trace', 'arrows', 'marks', 'labels']) Pn.L[k].replaceChildren();
    st.t = Math.max(0, Math.min(st.tmax, st.t));
    slider.max = st.tmax; slider.value = st.t;
    tOut.innerHTML = tex(`t = ${fmt(st.t)}`);
    for (const b of viewBtns) b.className = `btn ${b.dataset.view === st.view ? 'primary' : 'ghost'}`;
    if (forceBtn) forceBtn.className = `btn ${st.forces ? 'primary' : 'ghost'}`;
    PI.wrap.style.display = st.view === 'rotating' ? 'none' : '';
    PR.wrap.style.display = st.view === 'inertial' ? 'none' : '';
    panels.classList.toggle('single', st.view !== 'both');

    const w = st.w, t = st.t, th = w * t;
    const x = xAt(t), y = yAt(t);
    const Rv = rgRot(th, st.v), yd = [Rv[0] + w * y[1], Rv[1] - w * y[0]];
    const cor = [2 * w * yd[1], -2 * w * yd[0]], cf = [w * w * y[0], w * w * y[1]], sum = [cor[0] + cf[0], cor[1] + cf[1]];
    const sc = F => [scale * F[0], scale * F[1]];

    // inertial panel: rotating grid turned by +ωt, straight trace
    lattice(PI.L.other, PI.L.labels, th, ['y¹', 'y²']);
    PI.L.labels.append(label([box.x + box.w - 0.3, -0.3], 'x¹', ''), label([0.35, box.y + box.h - 0.3], 'x²', ''));
    if (cfg.ghost) PI.L.trace.append(s('polyline', { points: tracePts(xAt, st.tmax), class: 'rg-trace ghost' }));
    PI.L.trace.append(s('polyline', { points: tracePts(xAt, t), class: 'rg-trace' }));
    // rotating panel: inertial grid turned by −ωt, curling trace
    lattice(PR.L.other, PR.L.labels, -th, ['x¹', 'x²']);
    PR.L.labels.append(label([box.x + box.w - 0.3, -0.3], 'y¹', ''), label([0.35, box.y + box.h - 0.3], 'y²', ''));
    if (cfg.ghost) PR.L.trace.append(s('polyline', { points: tracePts(yAt, st.tmax), class: 'rg-trace ghost' }));
    PR.L.trace.append(s('polyline', { points: tracePts(yAt, t), class: 'rg-trace' }));

    // start point and start velocity (t = 0, where the charts agree), in both panels
    for (const Pn of [PI, PR]) {
      Pn.L.arrows.append(arrow(st.x0, [st.x0[0] + st.v[0], st.x0[1] + st.v[1]], 'rg-vel pt-start'));
      Pn.L.labels.append(label([st.x0[0] + st.v[0] + 0.32, st.x0[1] + st.v[1] + 0.32], 'v', 'vec small'));
      Pn.L.labels.append(label([st.x0[0] - 0.3, st.x0[1] - 0.34], 'x₀', 'small'));
    }
    for (const [hx, hv] of handles) { placeHandle(hx, st.x0); placeHandle(hv, [st.x0[0] + st.v[0], st.x0[1] + st.v[1]]); }

    // the particle now
    if (cfg.velocity !== false) arrowLbl(PI.L, x, st.v, 'ẋ', 'rg-vel');
    PI.L.marks.append(s('circle', { cx: P(...x)[0], cy: P(...x)[1], r: 0.13, class: 'rg-dot' }));
    if (cfg.velocity !== false) arrowLbl(PR.L, y, yd, 'ẏ', 'rg-vel');
    if (st.forces) {
      // the sum first and thicker, so a force along it stays visible on top
      arrowLbl(PR.L, y, sc(sum), 'ÿ', 'rg-sum');
      if (cfg.components !== false) {
        arrowLbl(PR.L, y, sc(cor), 'Coriolis', 'rg-cor', 1);
        arrowLbl(PR.L, y, sc(cf), 'centrifugal', 'rg-cf', -1);
      }
    }
    PR.L.marks.append(s('circle', { cx: P(...y)[0], cy: P(...y)[1], r: 0.13, class: 'rg-dot' }));

    // readout
    const pr = ([a, b]) => `(${fmt(a)}, ${fmt(b)})`;
    const zero = Math.hypot(...sum) < 5e-3;
    const rows = [
      h('div', { class: 'wide', html: mdInline(`Free particle: $x(t) = x_0 + v\\,t$ with $x_0 = ${pr(st.x0)}$ and $v = ${pr(st.v)}$. The rotating chart turns at $\\dot\\theta = \\omega = ${fmt(w)}$.`) }),
      h('div', { class: 'wide cb-tag', html: mdInline(`Its only nonzero coefficients: $\\Gamma^1_{02} = \\Gamma^1_{20} = -\\omega = ${fmt(-w)}$, $\\Gamma^2_{01} = \\Gamma^2_{10} = \\omega = ${fmt(w)}$, and $\\Gamma^\\alpha_{00} = -\\omega^2 y^\\alpha$.`) }),
      h('div', { class: 'wide', html: mdInline(`At $t = ${fmt(t)}$, inertial: $x = ${pr(x)}$, $\\dot x = ${pr(st.v)}$, $\\ddot x = (0, 0)$.`) }),
      h('div', { class: 'wide c-vec', html: mdInline(`Rotating: $y = ${pr(y)}$, $\\dot y = ${pr(yd)}$.`) }),
      h('div', { class: 'wide rg-cor', html: mdInline(`Coriolis, per unit mass: $-2\\Gamma^\\alpha_{0\\beta}\\dot y^\\beta = ${pr(cor)}$, i.e. $(2\\omega\\dot y^2, -2\\omega\\dot y^1)$.`) }),
      h('div', { class: 'wide rg-cf', html: mdInline(`Centrifugal, per unit mass: $-\\Gamma^\\alpha_{00} = \\omega^2 y^\\alpha$, i.e. $${pr(cf)}$.`) }),
      h('div', { class: `wide ${zero ? 'ok' : ''}`, html: mdInline(`Their sum is $\\ddot y = ${pr(sum)}$${zero ? ': the two pseudo-forces cancel right now.' : ': no real force acts, yet the rotating chart sees an acceleration.'}`) }),
    ];
    readout.replaceChildren(...rows);
  }
  draw();
}
