// coupled-agents
//
// Two agents, each with a continuous generative model (Lorenz, Eq. 8.7, or a Stuart-Landau oscillator), that
// "listen" to each other (Sec. 8.4, Figs 8.4-8.5). Agent 1 evolves as  x' = f(x) + w1 kappa (T^-1(y) - x)
// and agent 2 as  y' = F(y) + w2 kappa (T(x) - y),  where T is a fixed invertible map applied component-wise
// (T_i(x) = scale_i x + cubic_i x^3 + shift_i) and F is agent 2's own model, the model of agent 1 seen through T:
// F_i(y) = T_i'(x_i) f_i(x), x = T^-1(y). kappa (the "inference coupling") is how strongly each agent corrects its
// state towards what it hears, i.e. how well it has learned the other agent. The weights w1, w2 say who is listening:
//   turn: 0   both listen all the time (mutual);
//   turn: P>0 agents alternate every P time units; the speaker sings from its own model (w = 0), the listener
//             listens (w = 1). `first: 1 | 2` says who sings first.
// If T is the identity and the models are equal, kappa large gives identical synchrony (x = y). With a non-trivial T
// (different scale / shift / cubic) the models differ and the joint behaviour settles on the curve y = T(x):
// generalized synchrony. kappa = 0: independent agents.
// Shows: x_comp(t) and y_comp(t); the scatter x_comp vs y_comp (with the curve y = T(x) as a guide); a turn-taking strip.
//
// Config (all keys may sit in a preset; a preset overrides the config):
//   system: 'lorenz' | 'oscillator'
//   sigma: 10, rho: 28, beta: 8/3 (Lorenz);  mu: 1, omega: 1 (oscillator)
//   p2: {sigma, rho, beta, mu, omega}   overrides for agent 2's own model (before T); default equal to agent 1
//   transform: {scale: [..], shift: [..], cubic: [..]}   per component (defaults 1, 0, 0; scale > 0, cubic >= 0)
//   x0: [..], y0: [..]       initial states of agent 1 and agent 2 (defaults differ: Lorenz [1,1,20], [-5,-3,25])
//   kappa: 0, kmax: 6, turn: 0, first: 1, comp: 0 (component plotted), guide: true
//   names: ['1','2'] (agent names in strip and legend);  compName: 'x_1' (axis label, TeX)
//   T: 40, speed: 4, dt: 0.005, autoplay: false
//   show: {kappa: true}
//   labels: { play, pause, reset, series, scatter, strip, err, errMean, jump, both, a1, a2, manifold }
//   presets: [{ label, ..any key above.. }]

import { h } from '../dom.js';
import { mdInline, tex } from '../render.js';

const M = s => h('span', { html: mdInline(String(s)) });
const T = s => h('span', { html: tex(String(s)) });
const COL = ['#1f8a9e', '#c0504d', '#7a5fb0'];
const f2 = (x, d = 2) => (Math.abs(x) < 5 * 10 ** -(d + 1) ? 0 : x).toFixed(d);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const lorenz = (s, r, b) => ([x, y, z]) => [s * (y - x), x * (r - z) - y, x * y - b * z];
const oscill = (mu, om) => ([x, y]) => { const q = mu - x * x - y * y; return [x * q - om * y, y * q + om * x]; };
export function rk4(f, s, dt) {
  const k1 = f(s), k2 = f(s.map((q, i) => q + 0.5 * dt * k1[i])), k3 = f(s.map((q, i) => q + 0.5 * dt * k2[i])), k4 = f(s.map((q, i) => q + dt * k3[i]));
  return s.map((q, i) => q + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
// component-wise transform
export function makeT(tr, n) {
  const sc = i => tr?.scale?.[i] ?? 1, sh = i => tr?.shift?.[i] ?? 0, cu = i => tr?.cubic?.[i] ?? 0;
  const fw = (i, x) => sc(i) * x + cu(i) * x ** 3 + sh(i);
  const dfw = (i, x) => sc(i) + 3 * cu(i) * x * x;
  const inv = (i, y) => {
    if (!cu(i)) return (y - sh(i)) / sc(i);
    let x = (y - sh(i)) / sc(i);
    for (let k = 0; k < 40; k++) { const d = fw(i, x) - y, nx = x - d / dfw(i, x); if (Math.abs(nx - x) < 1e-12) { x = nx; break; } x = nx; }
    return x;
  };
  return { fw, dfw, inv, n };
}

export function coupledAgents(el, cfg) {
  const presets = cfg.presets ?? [];
  const L = { play: 'Play', pause: 'Pause', reset: 'Reset', series: 'Both agents against time', scatter: 'Joint behaviour: agent 1 against agent 2',
    strip: 'Who is singing', err: 'Mismatch now', errMean: 'Mean mismatch (second half)', jump: 'Mismatch at the last hand-over', both: 'both listen',
    a1: 'Agent 1', a2: 'Agent 2', manifold: 'Synchronization manifold', ...(cfg.labels ?? {}) };
  let P, tcur, rec, S, running = false, raf = null, last = 0, pidx = -1, step = 0, F1, F2, TT, nrec;
  const ui = {};
  const D0 = { lorenz: { x0: [1, 1, 20], y0: [-5, -3, 25] }, oscillator: { x0: [1, 0], y0: [-0.3, 0.8] } };

  function load(i) {
    stop(); pidx = i;
    const base = { ...cfg, ...(i >= 0 ? presets[i] : {}) };
    const sys = base.system ?? 'lorenz';
    P = { sigma: 10, rho: 28, beta: 8 / 3, mu: 1, omega: 1, kappa: 0, kmax: 6, turn: 0, first: 1, comp: 0, guide: true, T: 40, speed: 4, dt: 0.005,
      names: ['1', '2'], compName: 'x_1', ...D0[sys], ...base, system: sys };
    P.x0 = [...P.x0]; P.y0 = [...P.y0];
    build(); precompute(); draw();
    if (P.autoplay) startFresh();
  }
  const model = p => (P.system === 'lorenz' ? lorenz(p.sigma, p.rho, p.beta) : oscill(p.mu, p.omega));
  function fns() {
    const p1 = { sigma: P.sigma, rho: P.rho, beta: P.beta, mu: P.mu, omega: P.omega };
    const f1 = model(p1), f2m = model({ ...p1, ...(P.p2 ?? {}) });
    const n = P.x0.length; TT = makeT(P.transform, n);
    F1 = f1;
    // agent 2's own model: agent 1's (or its parameter variant) seen through T
    F2 = y => { const x = y.map((q, i) => TT.inv(i, q)), d = f2m(x); return d.map((q, i) => TT.dfw(i, x[i]) * q); };
  }
  // speaker (0 or 1; -1 = both listen) at time t
  const speaker = t => (P.turn > 0 ? ((Math.floor(t / P.turn + 1e-9) + (P.first === 2 ? 1 : 0)) % 2) : -1);
  const mism = (x, y) => Math.hypot(...y.map((q, i) => q - TT.fw(i, x[i])));
  function reset() { fns(); S = [[...P.x0], [...P.y0]]; tcur = 0; step = 0; rec = []; record(); }
  function record() { rec.push({ t: tcur, x: S[0], y: S[1], sp: speaker(tcur), e: mism(S[0], S[1]) }); }
  function advance(sec) {
    const n = Math.max(1, Math.round(sec / P.dt)), n1 = P.x0.length;
    for (let k = 0; k < n && tcur < P.T - 1e-9; k++) {
      const sp = speaker(tcur + 1e-9), w1 = sp === 0 ? 0 : 1, w2 = sp === 1 ? 0 : 1, kap = P.kappa;
      const G = z => {
        const x = z.slice(0, n1), y = z.slice(n1);
        const dx = F1(x).map((q, i) => q + w1 * kap * (TT.inv(i, y[i]) - x[i]));
        const dy = F2(y).map((q, i) => q + w2 * kap * (TT.fw(i, x[i]) - y[i]));
        return dx.concat(dy);
      };
      const z = rk4(G, S[0].concat(S[1]), P.dt);
      S = [z.slice(0, n1), z.slice(n1)];
      tcur += P.dt; step++;
      if (step % 5 === 0) record();
    }
  }
  function precompute() { reset(); advance(P.T); running = false; }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; if (ui.run) ui.run.textContent = L.play; }
  function startFresh() { reset(); running = true; last = 0; ui.run.textContent = L.pause; raf = requestAnimationFrame(loop); }
  function loop(ts) {
    raf = null;
    if (!el.isConnected || !running) return;
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60; last = ts;
    advance(dt * P.speed); draw();
    if (tcur >= P.T - 1e-9) { stop(); draw(); return; }
    raf = requestAnimationFrame(loop);
  }
  function changed() { if (running) { fns(); draw(); return; } precompute(); draw(); }

  function build() {
    el.textContent = ''; ui.sl = [];
    const btn = (txt, on, cls = 'ghost') => h('button', { class: `btn ${cls}`, type: 'button', onclick: on }, M(txt));
    ui.pre = presets.map((p, i) => btn(p.label ?? String(i + 1), () => load(i)));
    ui.run = btn(L.play, () => { if (running) return stop(); if (tcur >= P.T - 1e-9 || tcur === 0) startFresh(); else { running = true; last = 0; ui.run.textContent = L.pause; raf = requestAnimationFrame(loop); } }, 'primary');
    const rows = [];
    if ((P.show ?? {}).kappa !== false) {
      const out = h('span', { class: 'bs-val' });
      const inp = h('input', { type: 'range', min: 0, max: P.kmax, step: 0.1, 'aria-label': 'coupling kappa' });
      inp.addEventListener('input', () => { P.kappa = +inp.value; changed(); });
      ui.sl.push({ inp, out, get: () => P.kappa, fmt: v => f2(v, 1) });
      rows.push(h('div', { class: 'wslider' }, h('span', { class: 'bs-sl' }, T('\\kappa')), inp, out));
    }
    ui.fig1 = h('div', { class: 'fl-fig', role: 'img', 'aria-label': L.series });
    ui.fig2 = h('div', { class: 'fl-fig', role: 'img', 'aria-label': L.scatter });
    ui.fig3 = h('div', { class: 'fl-fig', role: 'img', 'aria-label': L.strip });
    ui.read = h('div', { class: 'fl-read' }); ui.legend = h('div', { class: 'fl-legend' });
    const cap = (t, fg) => h('div', {}, h('div', { class: 'fl-cap' }, M(t)), fg);
    el.append(
      presets.length ? h('div', { class: 'wbtns fl-pre' }, ...ui.pre) : '',
      ui.legend,
      h('div', { class: 'fl-figs' }, cap(L.series, ui.fig1), cap(L.scatter, ui.fig2)),
      h('div', { class: 'fl-figs' }, cap(L.strip, ui.fig3)),
      ui.read, h('div', { class: 'fl-sl' }, ...rows),
      h('div', { class: 'wbtns' }, ui.run, btn(L.reset, () => { stop(); precompute(); draw(); })));
  }

  const W = 320;
  const nice = x => { const e = 10 ** Math.floor(Math.log10(x)), r = x / e; return ([1, 1.5, 2, 2.5, 3, 4, 5, 8, 10].find(c => r <= c + 1e-9) ?? 10) * e; };
  const ticks = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
  function frame(H, xr, yr, xt, yt, ml = 34) {
    const mr = 8, mt = 8, mb = 20, pw = W - ml - mr, ph = H - mt - mb;
    const X = t => ml + (t - xr[0]) / (xr[1] - xr[0]) * pw, Y = y => mt + ph - (y - yr[0]) / (yr[1] - yr[0]) * ph;
    let g = `<rect x="${ml}" y="${mt}" width="${pw}" height="${ph}" class="fl-box"/>`;
    xt.forEach(t => { g += `<line x1="${X(t)}" y1="${mt + ph}" x2="${X(t)}" y2="${mt + ph + 3}" class="fl-ax"/><text x="${X(t)}" y="${H - 6}" class="fl-t fl-mid">${f2(t, Math.abs(t) < 10 && t % 1 ? 1 : 0)}</text>`; });
    yt.forEach(y => { g += `<line x1="${ml - 3}" y1="${Y(y)}" x2="${ml}" y2="${Y(y)}" class="fl-ax"/><line x1="${ml}" y1="${Y(y)}" x2="${ml + pw}" y2="${Y(y)}" class="fl-grid"/><text x="${ml - 5}" y="${Y(y) + 3.5}" class="fl-t fl-end">${f2(y, Math.abs(y) < 10 && y % 1 ? 1 : 0)}</text>`; });
    return { X, Y, g, ml, mt, pw, ph };
  }
  const poly = (pts, cls, extra = '') => (pts.length > 1 ? `<polyline points="${pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}" class="${cls}" ${extra}/>` : '');
  const sym = ar => { const m = Math.max(...ar.map(Math.abs), 1e-9); const v = nice(m * 1.05); return [-v, v]; };

  function draw() {
    if (!ui.fig1) return;
    ui.pre.forEach((b, k) => { b.classList.toggle('primary', k === pidx); b.classList.toggle('ghost', k !== pidx); });
    ui.sl.forEach(s => { const v = s.get(); if (document.activeElement !== s.inp) s.inp.value = v; s.out.textContent = s.fmt(v); });
    const c = P.comp, cur = rec[rec.length - 1], Tt = P.T;
    const xs = rec.map(r => r.x[c]), ys = rec.map(r => r.y[c]);
    // time series
    const yr = sym(xs.concat(ys)), fr = frame(150, [0, Tt], yr, ticks(0, Tt, 4), [yr[0], 0, yr[1]]);
    ui.fig1.innerHTML = `<svg viewBox="0 0 ${W} 150" class="fl-svg">${fr.g}${poly(rec.map(r => [fr.X(r.t), fr.Y(r.x[c])]), 'fl-line', `stroke="${COL[0]}"`)}${poly(rec.map(r => [fr.X(r.t), fr.Y(r.y[c])]), 'fl-line', `stroke="${COL[1]}" opacity=".85"`)}</svg>`;
    // scatter
    const xr = sym(xs), yr2 = sym(ys), fs = frame(230, xr, yr2, ticks(xr[0], xr[1], 4), ticks(yr2[0], yr2[1], 4), 38);
    let g = fs.g;
    if (P.guide !== false) {
      const gp = Array.from({ length: 61 }, (_, k) => { const x = xr[0] + (xr[1] - xr[0]) * k / 60; return [fs.X(x), fs.Y(Math.max(yr2[0], Math.min(yr2[1], TT.fw(c, x))))]; });
      g += poly(gp, 'fl-ghost', 'stroke="#7a7a7a"');
    }
    const n = rec.length, ch = 5;
    for (let q = 0; q < ch; q++) {
      const a = Math.floor(q * (n - 1) / ch), b = Math.floor((q + 1) * (n - 1) / ch) + 1;
      g += poly(rec.slice(a, b + 1).map(r => [fs.X(r.x[c]), fs.Y(r.y[c])]), 'fl-line', `stroke="${COL[2]}" opacity="${(0.2 + 0.8 * (q + 1) / ch).toFixed(2)}"`);
    }
    g += `<circle cx="${fs.X(cur.x[c])}" cy="${fs.Y(cur.y[c])}" r="4" fill="${COL[2]}"/>`;
    g += `<text x="${fs.ml + fs.pw}" y="${fs.mt + fs.ph - 4}" class="fl-t fl-end">${esc(L.a1)} →</text><text x="${fs.ml + 3}" y="${fs.mt + 10}" class="fl-t">↑ ${esc(L.a2)}</text>`;
    ui.fig2.innerHTML = `<svg viewBox="0 0 ${W} 230" class="fl-svg">${g}</svg>`;
    // strip
    const f3 = frame(46, [0, Tt], [0, 1], ticks(0, Tt, 4), []);
    let s = f3.g;
    let a = 0;
    for (let k = 1; k <= rec.length; k++) {
      if (k === rec.length || rec[k].sp !== rec[a].sp) {
        const t1 = k === rec.length ? cur.t : rec[k].t, x0 = f3.X(rec[a].t), w = Math.max(0.5, f3.X(t1) - x0), sp = rec[a].sp;
        s += `<rect x="${x0.toFixed(1)}" y="${f3.mt}" width="${w.toFixed(1)}" height="${f3.ph}" fill="${sp < 0 ? '#8a8a8a' : COL[sp]}" opacity=".8"/>`;
        if (w > 12) s += `<text x="${(x0 + w / 2).toFixed(1)}" y="${f3.mt + f3.ph / 2 + 4}" class="fl-chip fl-mid">${sp < 0 ? '' : esc(P.names[sp])}</text>`;
        a = k;
      }
    }
    ui.fig3.innerHTML = `<svg viewBox="0 0 ${W} 46" class="fl-svg">${s}</svg>`;
    // legend, readouts
    ui.legend.innerHTML = '';
    ui.legend.append(h('span', { class: 'fl-key', style: `--c:${COL[0]}` }, M(`${L.a1} (${P.names[0]})`)), h('span', { class: 'fl-key', style: `--c:${COL[1]}` }, M(`${L.a2} (${P.names[1]})`)));
    if (P.turn <= 0) ui.legend.append(h('span', { class: 'fl-key', style: '--c:#8a8a8a' }, M(L.both)));
    const half = rec.filter(r => r.t >= cur.t / 2), em = half.reduce((q, r) => q + r.e, 0) / half.length;
    let jump = null;
    if (P.turn > 0) for (let k = Math.floor(cur.t / P.turn); k >= 1; k--) { const tk = k * P.turn; if (tk <= cur.t) { jump = rec.reduce((b, r) => (Math.abs(r.t - tk) < Math.abs(b.t - tk) ? r : b)).e; break; } }
    ui.read.innerHTML = `${mdInline(`**${L.err}** ${f2(cur.e, 2)}`)} · ${mdInline(`**${L.errMean}** ${f2(em, 2)}`)}` + (jump != null ? ` · ${mdInline(`**${L.jump}** ${f2(jump, 2)}`)}` : '');
    el.dataset.t = cur.t.toFixed(2); el.dataset.running = running ? '1' : '0'; el.dataset.err = cur.e.toFixed(4); el.dataset.errMean = em.toFixed(4);
    el.dataset.kappa = P.kappa; el.dataset.jump = jump == null ? '' : jump.toFixed(4); el.dataset.speaker = String(cur.sp);
    el.dataset.x = cur.x.map(q => q.toFixed(3)).join(','); el.dataset.y = cur.y.map(q => q.toFixed(3)).join(',');
  }
  load(-1);
}
