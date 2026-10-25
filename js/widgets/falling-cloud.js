// falling-cloud
//
// Tides in Newton-Cartan gravity. A plane through a point mass at the origin
// (x¹ radial, x² transverse; G_N M = GM). A cloud of N free particles on a
// circle of radius r0 around c0 = (c, 0), plus the center particle, all at
// rest at t = 0, falls freely: ẍ = −GM x/|x|³ (velocity Verlet, dt = 5·10⁻⁴,
// precomputed and sampled every 0.005). The run stops (tmax) just before any
// particle reaches |x| = 0.5. Panels: 'sources' (the sources chart: the mass,
// the center's path, the cloud) and 'falling' (the chart y = x − b(t), b =
// the center's path, magnified by zoom: the center stays at 0 and the circle
// turns into an egg). In the falling panel: the exact relative accelerations
// ÿ = a − b̈ (gold, `arrows`), and with `linear` the tidal-equation prediction
// −Riem^α₀β₀ η^β (dashed gold arrows) plus the dashed curve of the solution of
// η̈ = −Riem(t) η along the center's path. Riem^α₀β₀ = ∂β∂αφ at the center:
// on the x¹ axis diag(−2GM/r³, GM/r³) (and Riem³₀₃₀ = GM/r³, trace 0).
//
// config:
//   GM: 8, c0: [2, 0] (on the x¹ axis; draggable along it), r0: 0.2, N: 12,
//   zoom: 5, t: 0, tmax (default: automatic stop), view: 'both' | 'sources' |
//   'falling', views: ['sources', 'falling', 'both'], arrows: true,
//   linear: false, linearToggle: true, scale: 1 (arrow length in the falling
//   panel per unit of acceleration), drag: true, snap: 0.25,
//   presets: [{ label, c0, t, linear }]

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { P, arrow, fmt, label, placeHandle, planeSvg, s } from './plane.js';

const FC_VIEWS = ['sources', 'falling', 'both'];
const FC_WORD = { sources: 'Sources', falling: 'Falling', both: 'Both' };

// Integrate the cloud (offsets in `offs`, index 0 = the center) and the two
// linear factors A (radial, A'' = 2k A) and B (transverse, B'' = −k B), k = GM/|b|³.
function fcRun(GM, c, offs, tcap) {
  const dt = 5e-4, every = 10, n = offs.length;
  const X = offs.map(o => [c + o[0], o[1]]), V = offs.map(() => [0, 0]);
  const acc = x => { const r3 = Math.hypot(x[0], x[1]) ** 3; return [-GM * x[0] / r3, -GM * x[1] / r3]; };
  let A = X.map(acc);
  const lin = [1, 1], linV = [0, 0];
  const linAcc = (L, b) => { const k = GM / Math.hypot(b[0], b[1]) ** 3; return [2 * k * L[0], -k * L[1]]; };
  const samples = [{ X: X.map(p => [...p]), lin: [...lin] }];
  let t = 0, step = 0;
  while (t < tcap) {
    const LA = linAcc(lin, X[0]);
    for (let i = 0; i < n; i++) for (let d = 0; d < 2; d++) X[i][d] += V[i][d] * dt + 0.5 * A[i][d] * dt * dt;
    for (let d = 0; d < 2; d++) lin[d] += linV[d] * dt + 0.5 * LA[d] * dt * dt;
    const An = X.map(acc), LAn = linAcc(lin, X[0]);
    for (let i = 0; i < n; i++) for (let d = 0; d < 2; d++) V[i][d] += 0.5 * (A[i][d] + An[i][d]) * dt;
    for (let d = 0; d < 2; d++) linV[d] += 0.5 * (LA[d] + LAn[d]) * dt;
    A = An; t += dt; step++;
    if (X.some(p => Math.hypot(p[0], p[1]) <= 0.5)) break;
    if (step % every === 0) samples.push({ X: X.map(p => [...p]), lin: [...lin] });
  }
  return { samples, dt: dt * every, tmax: Math.floor((samples.length - 1) * dt * every * 100 + 1e-6) / 100 };
}

export function fallingCloud(el, cfg) {
  const sn = cfg.snap ?? 0.25, scale = cfg.scale ?? 1;
  const GM = cfg.GM ?? 8, r0 = cfg.r0 ?? 0.2, N = Math.max(3, Math.round(cfg.N ?? 12));
  const views = (cfg.views ?? FC_VIEWS).filter(k => FC_VIEWS.includes(k));
  const c0of = v => (Array.isArray(v) ? v[0] : v) ?? 2;
  const init = () => ({
    c: c0of(cfg.c0), zoom: cfg.zoom ?? 5, t: cfg.t ?? 0,
    view: views.includes(cfg.view) ? cfg.view : views[views.length - 1] ?? 'both',
    linear: !!cfg.linear,
  });
  let st = init();
  // offsets: 0 = center, 1..N = the cloud (angle 2πk/N from the outer side), then outer, inner, side for the readout
  const offs = [[0, 0]];
  for (let k = 0; k < N; k++) offs.push([r0 * Math.cos(2 * Math.PI * k / N), r0 * Math.sin(2 * Math.PI * k / N)]);
  offs.push([r0, 0], [-r0, 0], [0, r0]);
  const iO = N + 1, iI = N + 2, iS = N + 3;
  let run = null, runC = null;
  const ensureRun = () => { if (runC !== st.c) { run = fcRun(GM, st.c, offs, 12); runC = st.c; } };
  const tmaxNow = () => Math.min(cfg.tmax ?? Infinity, run.tmax);

  const BS = { x: -0.5, y: -2.75, w: 5.5, h: 5.5 }, BF = { x: -3, y: -3, w: 6, h: 6 };
  const mk = (box, name, aria) => {
    const { svg, layers } = planeSvg(box, aria, ['other', 'trace', 'cloud', 'arrows', 'marks', 'labels', 'handles']);
    const cap = h('div', { class: 'rg-cap', html: mdInline(name) });
    return { svg, L: layers, cap, wrap: h('div', { class: 'rg-panel' }, svg, cap) };
  };
  const PS = mk(BS, 'sources chart $(x^1, x^2)$', 'Sources chart: the mass at the origin and the cloud falling toward it, stretching');
  const PF = mk(BF, 'falling chart', 'Falling chart, magnified: the center stays fixed and the circle of particles turns into an egg, with the tidal accelerations');
  const panels = h('div', { class: 'cc-panels rg-panels' }, PS.wrap, PF.wrap);
  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', min: 0, step: 0.01, 'aria-label': 'absolute time t' });
  slider.addEventListener('input', () => { stop(); st.t = +slider.value; draw(); });
  const tOut = h('span', { class: 'pt-lam' });
  let anim = null;
  const playBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => play() }, 'Play');
  const viewBtns = views.length > 1 ? views.map(k => h('button', { class: 'btn ghost', type: 'button', 'data-view': k,
    onclick: () => { st.view = k; draw(); } }, FC_WORD[k])) : [];
  const linBtn = cfg.linearToggle === false ? null : h('button', { class: 'btn ghost', type: 'button',
    onclick: () => { st.linear = !st.linear; draw(); } }, 'Linear');
  const btns = h('div', { class: 'wbtns' },
    playBtn, viewBtns, linBtn,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); st = init(); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      stop();
      if (pr.c0 != null) st.c = c0of(pr.c0);
      if (pr.linear != null) st.linear = !!pr.linear;
      st.t = pr.t ?? 0;
      draw();
    } }, pr.label)));
  el.append(panels, h('label', { class: 'wslider' }, tOut, slider), readout, btns);

  function stop() { if (anim) cancelAnimationFrame(anim); anim = null; playBtn.textContent = 'Play'; }
  function play() {
    if (anim) return stop();
    const T = tmaxNow();
    if (st.t >= T - 1e-9) st.t = 0;
    const tStart = st.t, dur = 7000 * (T - tStart) / T;
    let t0 = null;
    const step = tm => {
      if (!el.isConnected) return stop();
      if (t0 === null) t0 = tm;
      const u = Math.min(1, (tm - t0) / dur);
      st.t = tStart + (T - tStart) * u; draw();
      if (u < 1) anim = requestAnimationFrame(step); else stop();
    };
    playBtn.textContent = 'Pause';
    anim = requestAnimationFrame(step);
  }

  // the start c0 of the center, draggable along the x¹ axis (resets t = 0)
  let hc = null;
  if (cfg.drag !== false) {
    hc = s('circle', { r: 0.16, class: 'w-handle rg-h', tabindex: 0, 'aria-label': 'start of the center, c0' });
    PS.L.handles.append(hc);
    hc.addEventListener('pointerdown', e => {
      e.preventDefault(); stop();
      hc.setPointerCapture(e.pointerId);
      const move = ev => {
        const q = PS.svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
        const m = q.matrixTransform(PS.svg.getScreenCTM().inverse());
        let c = Math.max(1.25, Math.min(BS.x + BS.w - 0.5, m.x));
        if (sn) c = Math.round(c / sn) * sn;
        st.c = c; st.t = 0; draw();
      };
      const up = () => { hc.removeEventListener('pointermove', move); hc.removeEventListener('pointerup', up); hc.removeEventListener('pointercancel', up); };
      hc.addEventListener('pointermove', move); hc.addEventListener('pointerup', up); hc.addEventListener('pointercancel', up);
    });
  }

  const pts = arr => arr.map(p => P(...p).join(',')).join(' ');
  const dot = (L, p, r, cls) => { const [cx, cy] = P(...p); L.append(s('circle', { cx, cy, r, class: cls })); };
  // arrow from a by F, capped at length cap
  const capArrow = (L, a, F, cls, cap) => {
    const len = Math.hypot(...F);
    if (len < 1e-3) return;
    const f = len > cap ? cap / len : 1;
    L.append(arrow(a, [a[0] + f * F[0], a[1] + f * F[1]], cls));
  };

  function draw() {
    ensureRun();
    for (const Pn of [PS, PF]) for (const k of ['other', 'trace', 'cloud', 'arrows', 'marks', 'labels']) Pn.L[k].replaceChildren();
    const T = tmaxNow();
    st.t = Math.max(0, Math.min(T, st.t));
    slider.max = T; slider.value = st.t;
    tOut.innerHTML = tex(`t = ${fmt(st.t)}`);
    for (const b of viewBtns) b.className = `btn ${b.dataset.view === st.view ? 'primary' : 'ghost'}`;
    if (linBtn) linBtn.className = `btn ${st.linear ? 'primary' : 'ghost'}`;
    PS.wrap.style.display = st.view === 'falling' ? 'none' : '';
    PF.wrap.style.display = st.view === 'sources' ? 'none' : '';
    panels.classList.toggle('single', st.view !== 'both');
    PF.cap.innerHTML = mdInline(`falling chart $y = x - b(t)$, magnified $\\times${fmt(st.zoom)}$`);

    const idx = Math.min(run.samples.length - 1, Math.round(st.t / run.dt));
    const { X, lin } = run.samples[idx];
    const b = X[0], r = Math.hypot(...b), k = GM / r ** 3;
    const eta = i => [X[i][0] - b[0], X[i][1] - b[1]];
    const accX = x => { const q = Math.hypot(...x) ** 3; return [-GM * x[0] / q, -GM * x[1] / q]; };
    const ab = accX(b);
    const rel = i => { const a = accX(X[i]); return [a[0] - ab[0], a[1] - ab[1]]; };
    // Riem^α₀β₀ = ∂β∂αφ at b = (r, 0): diag(−2GM/r³, GM/r³)
    const linA = e => [2 * k * e[0], -k * e[1]];
    const cloudIdx = Array.from({ length: N }, (_, j) => j + 1);

    // sources panel
    PS.L.labels.append(label([BS.x + BS.w - 0.3, -0.6], 'x¹', ''), label([0.3, BS.y + BS.h - 0.3], 'x²', ''));
    dot(PS.L.marks, [0, 0], 0.13, 'fc-mass');
    PS.L.labels.append(label([0, -0.42], 'M', ''));
    PS.L.trace.append(s('polyline', { points: pts([[st.c, 0], b]), class: 'fc-path' }));
    PS.L.cloud.append(s('polygon', { points: pts(cloudIdx.map(i => X[i])), class: 'fc-outline' }));
    for (const i of cloudIdx) dot(PS.L.cloud, X[i], 0.045, 'fc-dot');
    dot(PS.L.marks, b, 0.05, 'fc-center');
    if (hc) placeHandle(hc, [st.c, 0]);
    PS.L.labels.append(label([st.c, 0.45], 'c₀', 'small'));

    // falling panel (display = zoom × y)
    const z = st.zoom, Z = p => [z * p[0], z * p[1]];
    PF.L.labels.append(label([BF.x + BF.w - 0.3, -0.3], 'y¹', ''), label([0.3, BF.y + BF.h - 0.3], 'y²', ''));
    PF.L.other.append(s('circle', { cx: 0, cy: 0, r: z * r0, class: 'fc-start' }));
    if (st.linear) {
      const ell = [];
      for (let j = 0; j <= 96; j++) { const a = 2 * Math.PI * j / 96; ell.push(Z([lin[0] * r0 * Math.cos(a), lin[1] * r0 * Math.sin(a)])); }
      PF.L.trace.append(s('polyline', { points: pts(ell), class: 'fc-lin' }));
    }
    PF.L.cloud.append(s('polygon', { points: pts(cloudIdx.map(i => Z(eta(i)))), class: 'fc-outline' }));
    const cap = 1.5;
    for (const i of cloudIdx) {
      const p = Z(eta(i));
      if (cfg.arrows !== false) capArrow(PF.L.arrows, p, rel(i).map(v => scale * v), 'fc-tide', cap);
      if (st.linear) capArrow(PF.L.arrows, p, linA(eta(i)).map(v => scale * v), 'fc-tide lin', cap);
      dot(PF.L.cloud, p, 0.09, 'fc-dot');
    }
    dot(PF.L.marks, [0, 0], 0.1, 'fc-center');

    // readout
    const f3 = x => (Math.abs(x) < 5e-4 ? '0' : String(Math.round(x * 1000) / 1000));
    const p3 = ([a, c]) => `(${f3(a)}, ${f3(c)})`;
    const eO = eta(iO), eI = eta(iI), eS = eta(iS);
    const rows = [
      h('div', { class: 'wide', html: mdInline(`Mass at the origin, $G_NM = ${fmt(GM)}$. Cloud: ${N} free particles on a circle of radius $${fmt(r0)}$ around $c_0 = (${fmt(st.c)}, 0)$, at rest at $t = 0$.`) }),
      h('div', { class: 'wide', html: mdInline(`At $t = ${fmt(st.t)}$ the center is at $b = ${p3(b)}$, so $r = |b| = ${f3(r)}$.`) }),
      h('div', { class: 'wide', html: mdInline(`$\\mathrm{Riem}^1{}_{010} = -2G_NM/r^3 = ${f3(-2 * k)}$, $\\mathrm{Riem}^2{}_{020} = G_NM/r^3 = ${f3(k)}$.`) }),
      h('div', { class: 'wide cb-tag', html: mdInline(`Their sum is $${f3(-k)}$; with $\\mathrm{Riem}^3{}_{030} = ${f3(k)}$ the full trace is $0 = \\mathrm{Ric}_{00}$ (vacuum).`) }),
      h('div', { class: 'wide c-vec', html: mdInline(`Offsets $\\eta = x - b$: outer $${p3(eO)}$, inner $${p3(eI)}$, side $${p3(eS)}$.`) }),
    ];
    if (st.linear)
      rows.push(h('div', { class: 'wide cb-tag', html: mdInline(`Linear prediction (dashed curve): outer $${f3(lin[0] * r0)}$, inner $${f3(-lin[0] * r0)}$, side $${f3(lin[1] * r0)}$.`) }));
    if (cfg.arrows !== false)
      rows.push(h('div', { class: 'wide fc-gold', html: mdInline(`Tidal acceleration, outer: $${p3(rel(iO))}$; side: $${p3(rel(iS))}$.${st.linear ? ` Linear $-\\mathrm{Riem}^\\alpha{}_{0\\beta0}\\eta^\\beta$: $${p3(linA(eO))}$ and $${p3(linA(eS))}$.` : ''}`) }));
    readout.replaceChildren(...rows);
  }
  draw();
}
