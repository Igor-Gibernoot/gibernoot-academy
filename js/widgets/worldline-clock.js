// worldline-clock
//
// A 1+1 spacetime (a across, τ up, components in the order (a, τ)) with a
// metric from LC_METRICS and the time orientation ᛏ = (s, 1). A worldline γ
// from A = (0, 0) to B = (0, T): straight pieces through 1–2 draggable kinks
// (λ ∈ [0, n], one unit of λ per piece, so v_γ = the piece's displacement),
// or a quadratic Bézier with a draggable control point C (λ ∈ [0, 2],
// u = λ/2, γ = 2u(1−u)C + u²B). Small light cones along γ with v_γ (blue,
// drawn at scale vScale), a λ slider with Play, the dot and its clock.
// Readout: v_γ(λ), g(v_γ, v_γ) with ᛇ_γ, s_γ = √(ᛇ g(v, v)), the running
// ∫ s_γ dλ (proper time when γ is massive so far) against the chart τ of the
// dot, and the badge "Massive worldline?". Pieces where v_γ is spacelike or
// past directed are red, lightlike ones gold. compare: the straight worldline
// A → B (dashed, same λ range, its own dot and clock). massless (minkowski
// only): kinks constrained so that every piece is null.
//
// config:
//   metric: 'minkowski' | 'tilted' | 'scaled', T: 10, shape: 'kinks' | 'bend',
//   kinks: [[3, 5]] (1 or 2 points), bend: [4, 5], massless: false,
//   compare: false, cones: 4, vScale: 0.3, lambda: 0, snap: 0.5, drag: true,
//   view: { x: -0.6T, y: -0.1T, w: 1.2T, h: 1.25T },
//   presets: [{ label, shape, kinks, bend, lambda }]

import { h } from '../dom.js';
import { tex, mdInline } from '../render.js';
import { P, arrow, label, line, placeHandle, planeSvg, s } from './plane.js';
import { LC_METRICS, lcG } from './light-cones.js';

export function worldlineClock(el, cfg) {
  const T = cfg.T ?? 10;
  const mName = LC_METRICS[cfg.metric] ? cfg.metric : 'minkowski', M = LC_METRICS[mName];
  const massless = !!cfg.massless && mName === 'minkowski';
  const view = cfg.view ?? { x: -0.6 * T, y: -0.1 * T, w: 1.2 * T, h: 1.25 * T };
  const k = view.h / 5.8, sv = { x: view.x / k, y: view.y / k, w: view.w / k, h: view.h / k };
  const S = ([x, y]) => [x / k, y / k];
  const sn = cfg.snap ?? 0.5, vS = cfg.vScale ?? 0.3, nC = cfg.cones ?? 4;
  const f3 = x => (Math.abs(x) < 5e-4 ? '0' : String(Math.round(x * 1000) / 1000));
  const par = x => (f3(x).startsWith('-') ? `(${f3(x)})` : f3(x));
  const pt = q => `(${f3(q[0])}, ${f3(q[1])})`;
  const B = [0, T];
  const init = () => {
    const K = (cfg.kinks ?? [[3, 5]]).slice(0, 2).map(q => [...q]);
    return { shape: cfg.shape === 'bend' ? 'bend' : 'kinks', K, C: [...(cfg.bend ?? [4, 5])],
      mx: K[0][0] || 1, f: 0 };
  };
  let st = init();
  const Lam = () => (st.shape === 'bend' ? 2 : kinkPts().length - 1);
  const setLam = lam => { st.f = Math.max(0, Math.min(1, (lam ?? 0) / Lam())); };
  setLam(cfg.lambda);

  // the kinks actually used (massless: forced onto null lines)
  function kinkPts() {
    if (!massless) return [[0, 0], ...st.K, B];
    const sg = Math.sign(st.mx) || 1;
    if (st.K.length < 2) return [[0, 0], [sg * T / 2, T / 2], B];
    const x = sg * Math.max(sn, Math.min(T / 2 - sn, Math.abs(st.mx)));
    return [[0, 0], [x, Math.abs(x)], [x - sg * T / 2, Math.abs(x) + T / 2], B];
  }
  // position and velocity at λ
  function at(lam) {
    if (st.shape === 'bend') {
      const u = lam / 2, C = st.C;
      return { q: [2 * u * (1 - u) * C[0] + u * u * B[0], 2 * u * (1 - u) * C[1] + u * u * B[1]],
        v: [(1 - u) * C[0] + u * (B[0] - C[0]), (1 - u) * C[1] + u * (B[1] - C[1])] };
    }
    const Pk = kinkPts(), n = Pk.length - 1, i = Math.max(0, Math.min(n - 1, Math.floor(lam))), t = lam - i;
    const v = [Pk[i + 1][0] - Pk[i][0], Pk[i + 1][1] - Pk[i][1]];
    return { q: [Pk[i][0] + t * v[0], Pk[i][1] + t * v[1]], v };
  }
  // class of the velocity at q: time | null | space | zero, and future?
  function cls(q, v) {
    const vv = v[0] * v[0] + v[1] * v[1];
    if (vv < 1e-12) return { c: 'zero', g: 0, gb: 0, fut: false };
    const g = lcG(M, q[0], v, v), gb = lcG(M, q[0], [M.s(q[0]), 1], v);
    return { c: Math.abs(g) < 1e-9 * (vv + 1) ? 'null' : g > 0 ? 'time' : 'space', g, gb, fut: gb > 0 };
  }
  const sOf = (q, v) => Math.sqrt(Math.abs(lcG(M, q[0], v, v)));
  const tag = c => ({ c, ok: c.c === 'time' && c.fut, nul: c.c === 'null' && c.fut });
  const NPU = 200;
  // samples: midpoints of the λ grid with their class, cumulative ∫ s dλ (midpoint rule)
  function sample() {
    const Lm = Lam(), N = Lm * NPU, cum = [0], mids = [];
    for (let j = 0; j < N; j++) {
      const lm = (j + 0.5) * Lm / N, { q, v } = at(lm);
      mids.push({ lm, ...tag(cls(q, v)) });
      cum.push(cum[j] + sOf(q, v) * Lm / N);
    }
    const ends = st.shape === 'bend' ? [0, Lm].map(lm => { const { q, v } = at(lm); return { lm, ...tag(cls(q, v)) }; }) : [];
    return { Lm, N, cum, mids, ends };
  }
  const intTo = (smp, lam) => {
    const j = Math.min(smp.N - 1, Math.floor(lam / smp.Lm * smp.N)), l0 = j * smp.Lm / smp.N;
    if (lam <= l0) return smp.cum[j];
    const { q, v } = at((l0 + lam) / 2);
    return smp.cum[j] + sOf(q, v) * (lam - l0);
  };

  const { svg, layers: L } = planeSvg(sv, 'Spacetime with a worldline from A to B, light cones along it, a moving dot and its clock',
    ['curve', 'cone', 'arrows', 'marks', 'labels', 'handles']);
  // grid and ticks in world units
  L.grid.replaceChildren();
  for (let i = Math.ceil(view.x); i <= view.x + view.w; i++)
    L.grid.append(line(S([i, view.y]), S([i, view.y + view.h]), i === 0 ? 'w-axis' : 'w-grid'));
  for (let j = Math.ceil(view.y); j <= view.y + view.h; j++)
    L.grid.append(line(S([view.x, j]), S([view.x + view.w, j]), j === 0 ? 'w-axis' : 'w-grid'));
  const tk = T >= 8 ? 2 : 1;
  for (let j = tk; j <= view.y + view.h - 0.3 * k; j += tk)
    L.grid.append(label([sv.x + 0.22, j / k], String(j), 'tick'));
  for (let i = Math.ceil(view.x / tk) * tk; i <= view.x + view.w - 0.4 * k; i += tk)
    if (i !== 0 && i > view.x + 0.5 * k) L.grid.append(label([i / k, -0.2], String(i), 'tick'));
  L.grid.append(label([sv.x + sv.w - 0.22, 0.22], 'a', ''), label([0.3, sv.y + sv.h - 0.22], 'τ', ''));

  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', min: 0, max: 1, step: 0.0025, 'aria-label': 'curve parameter lambda' });
  slider.addEventListener('input', () => { stop(); st.f = +slider.value; draw(); });
  const tOut = h('span', { class: 'pt-lam' });
  let anim = null;
  const playBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => play() }, 'Play');
  const btns = h('div', { class: 'wbtns' }, playBtn,
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); st = init(); setLam(cfg.lambda); draw(); } }, 'Reset'),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      stop();
      if (pr.shape) st.shape = pr.shape === 'bend' ? 'bend' : 'kinks';
      if (pr.kinks) { st.K = pr.kinks.slice(0, 2).map(q => [...q]); st.mx = st.K[0][0] || 1; }
      if (pr.bend) st.C = [...pr.bend];
      setLam(pr.lambda);
      draw();
    } }, pr.label)));
  el.append(h('div', { class: 'cc-panels single' }, svg), h('label', { class: 'wslider' }, tOut, slider), readout, btns);

  function stop() { if (anim) cancelAnimationFrame(anim); anim = null; playBtn.textContent = 'Play'; }
  function play() {
    if (anim) return stop();
    if (st.f >= 1 - 1e-9) st.f = 0;
    const f0 = st.f, dur = 8000 * (1 - f0);
    let t0 = null;
    const step = tm => {
      if (!el.isConnected) return stop();
      if (t0 === null) t0 = tm;
      const u = Math.min(1, (tm - t0) / dur);
      st.f = f0 + (1 - f0) * u; draw();
      if (u < 1) anim = requestAnimationFrame(step); else stop();
    };
    playBtn.textContent = 'Pause';
    anim = requestAnimationFrame(step);
  }

  // handles: pointer → world point, clamped to the view and snapped
  const svgW = ev => {
    const q = svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
    const m = q.matrixTransform(svg.getScreenCTM().inverse());
    const w = [m.x * k, -m.y * k], mg = 0.25 * k;
    return [Math.max(view.x + mg, Math.min(view.x + view.w - mg, w[0])), Math.max(view.y + mg, Math.min(view.y + view.h - mg, w[1]))]
      .map(z => (sn ? Math.round(z / sn) * sn : z));
  };
  const dragOn = (hd, onMove) => hd.addEventListener('pointerdown', e => {
    e.preventDefault(); stop();
    hd.setPointerCapture(e.pointerId);
    const move = ev => { onMove(svgW(ev)); draw(); };
    const up = () => { hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); };
    hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
  });
  const mkH = aria => s('circle', { r: 0.2, class: 'w-handle cv-bend', tabindex: 0, 'aria-label': aria });
  const kH = [0, 1].map(i => mkH(`kink K${i + 1} of the worldline`));
  const cH = mkH('control point C of the bent worldline');
  if (cfg.drag !== false) {
    dragOn(kH[0], w => { if (massless) st.mx = w[0] || st.mx; else st.K[0] = w; });
    dragOn(kH[1], w => { if (!massless) st.K[1] = w; });
    dragOn(cH, w => { st.C = w; });
  }

  const wedge = (q, d1, d2, r) => s('polygon', { points: [q, [q[0] + r * d1[0], q[1] + r * d1[1]], [q[0] + r * d2[0], q[1] + r * d2[1]]].map(v => P(...v).join(',')).join(' '), class: 'lc-future' });
  function cone(q, r) {  // q in world units, r in screen units; ᛏ = (s, 1) gives the future half
    const sq = S(q), ds = [1, -1].map(e => { const d = [M.s(q[0]) + e / M.k, 1], n = Math.hypot(...d); return [d[0] / n, d[1] / n]; });
    L.cone.append(wedge(sq, ds[0], ds[1], r));
    for (const d of ds) L.cone.append(line([sq[0] - r * d[0], sq[1] - r * d[1]], [sq[0] + r * d[0], sq[1] + r * d[1]], 'lc-null thin'));
  }
  const vArrow = (q, v) => L.arrows.append(arrow(S(q), S([q[0] + vS * v[0], q[1] + vS * v[1]]), 'w-vec lc-x'));
  function clock(q, val, side, on) {  // one turn of the hand = T
    const c = [S(q)[0] + side * 0.62, S(q)[1] + 0.05], th = 2 * Math.PI * val / T, g = s('g', { class: `wc-clock${on ? '' : ' off'}` });
    g.append(s('circle', { cx: P(...c)[0], cy: P(...c)[1], r: 0.3 }));
    g.append(line([c[0], c[1] + 0.3], [c[0], c[1] + 0.22], ''));
    g.append(line(c, [c[0] + 0.24 * Math.sin(th), c[1] + 0.24 * Math.cos(th)], ''));
    L.marks.append(g);
    L.labels.append(label([c[0], c[1] - 0.47], on ? f3(val) : '–', 'small'));
  }
  const sub = ['₁', '₂'];
  const dot = (q, r, cl) => L.marks.append(s('circle', { cx: P(...S(q))[0], cy: P(...S(q))[1], r, class: cl }));

  function draw() {
    for (const n of ['curve', 'cone', 'arrows', 'marks', 'labels']) L[n].replaceChildren();
    const smp = sample(), Lm = smp.Lm, lam = st.f * Lm, Pk = kinkPts(), ms = smp.mids;
    slider.value = st.f;
    tOut.innerHTML = tex(`\\lambda = ${f3(lam)}`);

    // the curve, in runs of one kind: ok (ink), null (gold), bad (red)
    const kindOf = m => (m.ok ? 'ok' : m.nul ? 'null' : 'bad');
    let run = [], kind = null;
    const flush = () => { if (run.length > 1) L.curve.append(s('polyline', { points: run.map(q => P(...S(q)).join(',')).join(' '), class: `wc-curve ${kind}` })); };
    for (let j = 0; j < ms.length; j++) {
      const kd = kindOf(ms[j]), l0 = j * Lm / smp.N, l1 = (j + 1) * Lm / smp.N;
      if (kd !== kind) { flush(); run = [at(l0).q]; kind = kd; }
      run.push(at(Math.min(l1, Lm - 1e-12)).q);
    }
    if (st.shape === 'kinks' && run.length) run[run.length - 1] = B;
    flush();
    if (cfg.compare) L.curve.append(line(S([0, 0]), S(B), 'wc-straight'));
    if (st.shape === 'bend') L.curve.append(line(S([0, 0]), S(st.C), 'wc-ctrl'), line(S(st.C), S(B), 'wc-ctrl'));

    // small cones along γ with v_γ
    for (let c = 0; c < nC; c++) {
      const { q, v } = at(Lm * (c + 0.5) / nC);
      cone(q, 0.38); vArrow(q, v);
    }
    // end points, kinks, handles
    dot([0, 0], 0.07, 'cv-dot'); dot(B, 0.07, 'cv-dot');
    L.labels.append(label([S([0, 0])[0] + 0.3, S([0, 0])[1] + 0.22], 'A', ''), label([S(B)[0] + 0.32, S(B)[1] + 0.05], 'B', ''));
    for (const hd of [...kH, cH]) hd.remove();
    if (st.shape === 'kinks') Pk.slice(1, -1).forEach((q, i) => {
      const rt = q[0] >= 0 ? S(q)[0] + 0.45 < sv.x + sv.w - 0.2 : S(q)[0] - 0.45 < sv.x + 0.2;
      L.labels.append(label([S(q)[0] + (rt ? 0.45 : -0.45), S(q)[1] + 0.05], `K${sub[i]}`, ''));
      if (cfg.drag !== false && (!massless || i === 0)) { L.handles.append(kH[i]); placeHandle(kH[i], S(q)); }
      else dot(q, 0.07, 'cv-dot');
    });
    else {
      L.labels.append(label([S(st.C)[0] + 0.4, S(st.C)[1] + 0.05], 'C', ''));
      if (cfg.drag !== false) { L.handles.append(cH); placeHandle(cH, S(st.C)); }
    }

    // the dot: cone, velocity, clock
    const { q, v } = at(Math.min(lam, Lm)), c = cls(q, v);
    const massiveSoFar = ms.every(m => m.lm > lam + 1e-9 || m.ok) && (st.shape !== 'bend' || smp.ends[0].ok);
    const tp = intTo(smp, lam), total = smp.cum[smp.N];
    cone(q, 0.5); vArrow(q, v);
    dot(q, 0.11, 'wc-dot');
    const side = q[0] >= 0 ? 1 : -1;
    clock(q, tp, side, massiveSoFar);
    const v0 = [0, T / Lm], s0S = Math.sqrt(Math.max(0, lcG(M, 0, v0, v0))), tStr = lam * s0S;
    if (cfg.compare) {
      const qS = [0, lam * T / Lm];
      dot(qS, 0.1, 'wc-dot');
      clock(qS, tStr, -side, true);
    }

    // readout
    const tilt = mName === 'tilted', s0 = M.s(q[0]), kk = M.k * M.k === 1 ? '' : `${M.k * M.k}\\cdot `;
    const shapeTxt = st.shape === 'bend'
      ? `Worldline $\\gamma(\\lambda) = 2u(1-u)\\,C + u^2B$ with $u = \\lambda/2$, $C = ${pt(st.C)}$, from $A = (0, 0)$ to $B = ${pt(B)}$; $\\lambda\\in[0, 2]$.`
      : `Worldline $\\gamma$ from $A = (0, 0)$ to $B = ${pt(B)}$ through ${Pk.slice(1, -1).map((p, i) => `$K_${i + 1} = ${pt(p)}$`).join(' and ')}: straight pieces, $\\lambda\\in[0, ${Lm}]$, one unit of $\\lambda$ per piece.`;
    const sgn = c.c === 'time' ? '+1' : c.c === 'space' ? '-1' : '0';
    const qn = tilt ? `${par(v[1])}^2 - ${par(v[0] - s0 * v[1])}^2` : `${par(v[1])}^2 - ${kk}${par(v[0])}^2`;
    const word = c.c === 'time' ? 'timelike' : c.c === 'null' ? 'lightlike' : 'spacelike';
    const dirTxt = c.c === 'space' ? 'spacelike vectors are neither future nor past directed'
      : `$g(\\text{ᛏ}, v_\\gamma) = ${f3(c.gb)}$, ${c.fut ? 'positive: future directed' : 'negative: past directed'}`;
    const rows = [
      h('div', { class: 'wide', html: mdInline(`Metric (${M.name}): $${M.md}$; time orientation $\\text{ᛏ} = (${tilt ? 's' : '0'}, 1)$, future halves of the cones shaded.`) }),
      h('div', { class: 'wide cb-tag', html: mdInline(shapeTxt) }),
      h('div', { class: 'wide', html: mdInline(`At $\\lambda = ${f3(lam)}$ the dot is at $\\gamma(\\lambda) = ${pt(q)}$ (chart coordinates $(a, \\tau)$${tilt ? `; there $s = ${f3(s0)}$` : ''}).`) }),
      h('div', { class: 'wide c-vec', html: mdInline(`Velocity $v_\\gamma(\\lambda)$: components $${pt(v)}$ in the order $(a, \\tau)$ (blue arrows, drawn at scale $${f3(vS)}$).`) }),
      c.c === 'zero' ? h('div', { class: 'wide', html: mdInline('$v_\\gamma(\\lambda) = 0$: the zero vector gets no class.') })
        : h('div', { class: 'wide', html: mdInline(`$g(v_\\gamma, v_\\gamma) = ${qn} = ${f3(c.g)}$, so $\\text{ᛇ}_\\gamma(\\lambda) = ${sgn}$: **${word}**; ${dirTxt}.`) }),
      h('div', { class: 'wide', html: mdInline(`Speed $s_\\gamma(\\lambda) = \\sqrt{\\text{ᛇ}_\\gamma\\, g(v_\\gamma, v_\\gamma)} = ${f3(sOf(q, v))}$.`) }),
      massiveSoFar
        ? h('div', { class: 'wide lc-green', html: mdInline(`**Proper time** so far (the dot's clock): $\\tau_{[0, \\lambda]}[\\gamma] = \\int_0^{\\lambda} s_\\gamma\\,d\\lambda = ${f3(tp)}$${lam >= Lm - 1e-9 ? ', reached at $B$' : ''}.`) })
        : h('div', { class: 'wide', html: mdInline(`$\\int_0^{\\lambda} s_\\gamma\\,d\\lambda = ${f3(tp)}$ is **not a proper time**: $v_\\gamma$ was not timelike and future directed all the way (the clock is greyed).`) }),
      h('div', { class: 'wide cb-tag', html: mdInline(`Chart coordinate of the dot: $\\tau = ${f3(q[1])}$. It labels the event in the chart; it is not the time on the dot's clock.`) }),
    ];
    if (cfg.compare)
      rows.push(h('div', { class: 'wide', html: mdInline(`Straight worldline $A\\to B$ (dashed, same $\\lambda$): $v = ${pt(v0)}$, $s = ${f3(s0S)}$, proper time so far $${f3(tStr)}$. At $B$: $${f3(Lm * s0S)}$ straight, against $${f3(total)}$ along $\\gamma$.`) }));
    // badge
    const all = [...ms, ...smp.ends];
    const firstRange = test => {
      const j0 = ms.findIndex(test);
      if (j0 < 0) return null;
      let j1 = j0; while (j1 + 1 < ms.length && test(ms[j1 + 1])) j1++;
      return `$\\lambda\\in[${f3(j0 * Lm / smp.N)}, ${f3((j1 + 1) * Lm / smp.N)}]$`;
    };
    let badge;
    if (all.every(m => m.ok))
      badge = h('div', { class: 'wide ok', html: mdInline(`Massive worldline? **Yes**: $v_\\gamma$ is timelike and future directed for every $\\lambda$ ($\\text{ᛇ}_\\gamma \\equiv +1$); proper time from $A$ to $B$: $${f3(total)}$.`) });
    else if (all.every(m => m.nul))
      badge = h('div', { class: 'wide lc-gold', html: mdInline('Massive worldline? **No**: $v_\\gamma$ is lightlike, future directed and non-zero for every $\\lambda$: a **massless** worldline ($\\text{ᛇ}_\\gamma \\equiv 0$, $s_\\gamma \\equiv 0$).') });
    else {
      const why = [];
      const rz = firstRange(m => m.c.c === 'zero'); if (rz) why.push(`zero for ${rz}`);
      const rs = firstRange(m => m.c.c === 'space'); if (rs) why.push(`spacelike for ${rs}`);
      const rp = firstRange(m => (m.c.c === 'time' || m.c.c === 'null') && !m.c.fut); if (rp) why.push(`past directed for ${rp}`);
      const rn = firstRange(m => m.nul); if (rn) why.push(`lightlike for ${rn}`);
      if (!why.length) why.push('not timelike and future directed at an end point');
      badge = h('div', { class: 'wide wc-bad-text', html: mdInline(`Massive worldline? **No**: $v_\\gamma$ is ${why.join('; ')}.`) });
    }
    rows.push(badge);
    readout.replaceChildren(...rows);
  }
  draw();
}
