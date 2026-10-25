// flow-lab
//
// A general ODE trajectory viewer (Ch. 8.3, Eq. 8.6-8.7). Two systems, same controls:
//
//  system 'lotka-volterra'  (Eq. 8.6)   xdot = x o (v + A x)      (o = elementwise product, any dimension n)
//      Shows the populations against time plus a strip that colours each moment by the species with the
//      greatest population (the peaks as a sequence: p, h, c, p, h, c, ...) and the sequence as chips.
//      A_ij = effect of species j on the growth rate of species i (the sign convention is the user's).
//  system 'lorenz'           (Eq. 8.7)   x1dot = sigma (x2 - x1),  x2dot = x1 (rho - x3) - x2,  x3dot = x1 x2 - beta x3
//      Shows a 2D projection of the 3D trajectory with a fading trail, and x1(t) against time.
//
//  Both: a second copy of the run whose initial condition is nudged by `nudge` in component `nudgeIndex`
//  (sensitivity to initial conditions); readouts compare them. Deterministic RK4, fixed step, horizon T.
//
// Config (every key can also sit in a preset; a preset overrides the config):
//   system: 'lotka-volterra' | 'lorenz'
//   x0: [..]                    initial condition (LV default [0.5,0.3,0.1]; Lorenz [1,1,20])
//   v: [1,1,1], A: [[..],..]    Lotka-Volterra growth rates and interaction matrix
//   names: ['p','h','c']        short species names (strip and chips);  nameLong: ['plants',..] for the legend
//   sigma: 10, rho: 28, beta: 8/3
//   nudge: 0, nudgeIndex: 0     size and component of the initial-condition nudge (0 = no second run)
//   T: 100 (LV) / 40 (Lorenz), speed: simulated time units per real second (LV 8, Lorenz 4), dt (LV .01, Lorenz .005)
//   view: 'xz' | 'xy' | 'yz' | 'tilt'   Lorenz projection (tilt = rotated 3D view with azimuth `azimuth` deg)
//   sliders: [{label, v: i | A: [[i,j],..] , min, max, step}]   LV sliders (a slider sets every listed cell at once);
//        default: one per growth rate v_i.  Lorenz sliders: show: {sigma, rho, beta, nudge, azimuth} (default
//        sigma, rho, beta, nudge true; azimuth only for the tilt view).
//   autoplay: false
//   labels: { play, pause, reset, time, nudge, sep, sepTime, seq, period, trail, nudged, main, ... }
//   presets: [{ label, ..any key above.. }]

import { h } from '../dom.js';
import { mdInline, tex } from '../render.js';

const M = s => h('span', { html: mdInline(String(s)) });
const T = s => h('span', { html: tex(String(s)) });
const COL = ['#1f8a9e', '#2e9e6b', '#c0504d', '#a8741a', '#7a5fb0'];
const f2 = (x, d = 2) => (Math.abs(x) < 5 * 10 ** -(d + 1) ? 0 : x).toFixed(d);

// exported for tests
export const lvDeriv = (v, A) => x => x.map((xi, i) => xi * (v[i] + A[i].reduce((s, a, j) => s + a * x[j], 0)));
export const lorenzDeriv = (sigma, rho, beta) => ([x, y, z]) => [sigma * (y - x), x * (rho - z) - y, x * y - beta * z];
export function rk4(f, s, dt) {
  const k1 = f(s), k2 = f(s.map((q, i) => q + 0.5 * dt * k1[i])), k3 = f(s.map((q, i) => q + 0.5 * dt * k2[i])), k4 = f(s.map((q, i) => q + dt * k3[i]));
  return s.map((q, i) => q + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

export function flowLab(el, cfg) {
  const presets = cfg.presets ?? [];
  const L = { play: 'Play', pause: 'Pause', reset: 'Reset', time: 't', nudge: 'Nudge', sep: 'Separation now', sepTime: 'First time apart > 1',
    seq: 'Peaks in order', period: 'Period of the first species', main: 'Run', nudged: 'Nudged copy', pop: 'Populations against time',
    strip: 'Greatest population at each time', proj: 'Trajectory (projection)', x1t: 'First coordinate $x_1$ against time',
    never: 'not yet', ...(cfg.labels ?? {}) };
  let P, sys, tcur, rec, recB, S, SB, running = false, raf = null, last = 0, pidx = -1, step = 0, f, fB;
  const ui = {};
  const LV0 = { x0: [0.5, 0.3, 0.1], v: [1, 1, 1], A: [[-1, -1.5, -0.5], [-0.5, -1, -1.5], [-1.5, -0.5, -1]], names: ['p', 'h', 'c'], T: 100, speed: 8, dt: 0.01 };
  const LZ0 = { x0: [1, 1, 20], sigma: 10, rho: 28, beta: 8 / 3, T: 40, speed: 4, dt: 0.005, view: 'xz', azimuth: 30 };

  function load(i) {
    stop(); pidx = i;
    const base = { ...cfg, ...(i >= 0 ? presets[i] : {}) };
    sys = base.system ?? 'lorenz';
    P = { nudge: 0, nudgeIndex: 0, ...(sys === 'lorenz' ? LZ0 : LV0), ...base };
    P.v = [...P.v ?? []]; P.A = (P.A ?? []).map(r => [...r]); P.x0 = [...P.x0];
    build(); precompute(); draw();
    if (P.autoplay) startFresh();
  }
  function fns() {
    f = sys === 'lorenz' ? lorenzDeriv(P.sigma, P.rho, P.beta) : lvDeriv(P.v, P.A);
  }
  const x0B = () => P.x0.map((q, i) => (i === P.nudgeIndex ? q + P.nudge : q));
  function reset() { fns(); S = [...P.x0]; SB = x0B(); tcur = 0; step = 0; rec = []; recB = []; record(); }
  const REC = () => (sys === 'lorenz' ? 2 : 5);
  function record() { rec.push({ t: tcur, x: S }); if (P.nudge > 0) recB.push({ t: tcur, x: SB }); }
  function advance(sec) {
    const n = Math.max(1, Math.round(sec / P.dt));
    for (let k = 0; k < n && tcur < P.T - 1e-9; k++) {
      S = rk4(f, S, P.dt); if (P.nudge > 0) SB = rk4(f, SB, P.dt);
      tcur += P.dt; step++;
      if (step % REC() === 0) record();
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
  // a slider moved: while playing the parameters change live; stopped, recompute the whole run
  function changed() { if (running) { fns(); if (!(P.nudge > 0)) recB = []; draw(); return; } precompute(); draw(); }

  // ---- controls
  function slider(label, min, max, stp, get, set, fmt = v => f2(v, 2)) {
    const out = h('span', { class: 'bs-val' });
    const inp = h('input', { type: 'range', min, max, step: stp, 'aria-label': String(label).replace(/[\\${}]/g, '') });
    inp.addEventListener('input', () => { set(+inp.value); changed(); });
    const row = h('div', { class: 'wslider' }, h('span', { class: 'bs-sl' }, T(label)), inp, out);
    ui.sl.push({ inp, out, get, fmt, row });
    return row;
  }
  const nudgeSl = () => slider('\\delta', 0, 7, 1, () => (P.nudge > 0 ? Math.round(Math.log10(P.nudge) + 7) : 0),
    s => { P.nudge = s <= 0 ? 0 : 10 ** (s - 7); }, () => (P.nudge > 0 ? P.nudge.toExponential(0) : '0'));
  function build() {
    el.textContent = ''; ui.sl = [];
    const btn = (txt, on, cls = 'ghost') => h('button', { class: `btn ${cls}`, type: 'button', onclick: on }, M(txt));
    ui.pre = presets.map((p, i) => btn(p.label ?? String(i + 1), () => load(i)));
    ui.run = btn(L.play, () => { if (running) return stop(); if (tcur >= P.T - 1e-9 || tcur === 0) startFresh(); else { running = true; last = 0; ui.run.textContent = L.pause; raf = requestAnimationFrame(loop); } }, 'primary');
    const rows = [], show = P.show ?? {};
    if (sys === 'lorenz') {
      if (show.sigma !== false) rows.push(slider('\\sigma', 0, 20, 0.1, () => P.sigma, v => { P.sigma = v; }, v => f2(v, 1)));
      if (show.rho !== false) rows.push(slider('\\rho', 0, 50, 0.1, () => P.rho, v => { P.rho = v; }, v => f2(v, 1)));
      if (show.beta !== false) rows.push(slider('\\beta', 0.5, 6, 0.05, () => P.beta, v => { P.beta = v; }, v => f2(v, 2)));
      if (P.view === 'tilt' && show.azimuth !== false) rows.push(slider('\\text{azimuth}', 0, 180, 1, () => P.azimuth, v => { P.azimuth = v; }, v => `${Math.round(v)}°`));
    } else {
      const defs = P.sliders ?? P.v.map((_, i) => ({ v: i, label: `v_${i + 1}`, min: -1, max: 2, step: 0.05 }));
      defs.forEach(d => {
        const get = () => (d.v != null ? P.v[d.v] : P.A[d.A[0][0]][d.A[0][1]]);
        const set = val => { if (d.v != null) P.v[d.v] = val; else d.A.forEach(([i, j]) => { P.A[i][j] = val; }); };
        rows.push(slider(d.label ?? 'a', d.min ?? -2, d.max ?? 2, d.step ?? 0.05, get, set));
      });
    }
    if (show.nudge !== false) rows.push(nudgeSl());
    ui.fig1 = h('div', { class: 'fl-fig', role: 'img', 'aria-label': sys === 'lorenz' ? L.proj : L.pop });
    ui.fig2 = h('div', { class: 'fl-fig', role: 'img', 'aria-label': sys === 'lorenz' ? L.x1t : L.strip });
    ui.read = h('div', { class: 'fl-read' }); ui.legend = h('div', { class: 'fl-legend' });
    const VL = { xz: '$x_1$ vs $x_3$', xy: '$x_1$ vs $x_2$', yz: '$x_2$ vs $x_3$', tilt: '3D' };
    ui.views = sys === 'lorenz' ? ['xz', 'xy', 'yz', 'tilt'].map(vw => btn(VL[vw], () => { P.view = vw; build(); draw(); })) : [];
    const cap = (t, fg) => h('div', {}, h('div', { class: 'fl-cap' }, M(t)), fg);
    el.append(
      presets.length ? h('div', { class: 'wbtns fl-pre' }, ...ui.pre) : '',
      ui.views.length ? h('div', { class: 'wbtns fl-pre' }, ...ui.views) : '',
      ui.legend,
      h('div', { class: 'fl-figs' }, cap(sys === 'lorenz' ? L.proj : L.pop, ui.fig1), cap(sys === 'lorenz' ? L.x1t : L.strip, ui.fig2)),
      ui.read, h('div', { class: 'fl-sl' }, ...rows),
      h('div', { class: 'wbtns' }, ui.run, btn(L.reset, () => { stop(); precompute(); draw(); })));
  }

  // ---- drawing
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
  const nm = i => (P.names?.[i] ?? `x${i + 1}`);

  // peaks as a sequence: species with the greatest population, compressed
  function peakSeq(r) {
    const seq = [];
    r.forEach(p => { const m = p.x.indexOf(Math.max(...p.x)); if (!seq.length || seq[seq.length - 1].i !== m) seq.push({ i: m, t: p.t }); });
    return seq;
  }
  function period(r) {
    const peaks = [], mx = Math.max(...r.map(p => p.x[0]));
    for (let k = 1; k < r.length - 1; k++) if (r[k].x[0] > r[k - 1].x[0] && r[k].x[0] >= r[k + 1].x[0] && r[k].x[0] > 0.3 * mx) peaks.push(r[k].t);
    return peaks.length >= 2 ? peaks[peaks.length - 1] - peaks[peaks.length - 2] : null;
  }
  const dist = (a, b) => Math.hypot(...a.map((q, i) => q - b[i]));
  function sepInfo() {
    if (!(P.nudge > 0) || !recB.length) return null;
    let first = null;
    for (let k = 0; k < recB.length; k++) if (first == null && dist(rec[k].x, recB[k].x) > 1) first = rec[k].t;
    return { now: dist(rec[recB.length - 1].x, recB[recB.length - 1].x), first };
  }

  function drawLV() {
    const n = P.x0.length, Tt = P.T, cur = rec[rec.length - 1];
    const ymax = nice(Math.max(0.2, ...rec.map(r => Math.max(...r.x))) * 1.08);
    const fr = frame(160, [0, Tt], [0, ymax], ticks(0, Tt, 5), ticks(0, ymax, 4));
    let g = fr.g;
    if (recB.length) for (let i = 0; i < n; i++) g += poly(recB.map(r => [fr.X(r.t), fr.Y(r.x[i])]), 'fl-ghost', `stroke="${COL[i % 5]}"`);
    for (let i = 0; i < n; i++) g += poly(rec.map(r => [fr.X(r.t), fr.Y(r.x[i])]), 'fl-line', `stroke="${COL[i % 5]}"`);
    for (let i = 0; i < n; i++) g += `<circle cx="${fr.X(cur.t)}" cy="${fr.Y(cur.x[i])}" r="3.5" fill="${COL[i % 5]}"/>`;
    ui.fig1.innerHTML = `<svg viewBox="0 0 ${W} 160" class="fl-svg">${g}</svg>`;
    // strip
    const f2s = frame(60, [0, Tt], [0, 1], ticks(0, Tt, 5), []), seq = peakSeq(rec);
    let s = f2s.g;
    seq.forEach((q, k) => {
      const t1 = k + 1 < seq.length ? seq[k + 1].t : cur.t, x0 = f2s.X(q.t), w = Math.max(0.5, f2s.X(t1) - x0);
      s += `<rect x="${x0.toFixed(1)}" y="${f2s.mt}" width="${w.toFixed(1)}" height="${f2s.ph}" fill="${COL[q.i % 5]}" opacity=".8"/>`;
      if (w > 9) s += `<text x="${(x0 + w / 2).toFixed(1)}" y="${f2s.mt + f2s.ph / 2 + 4}" class="fl-chip fl-mid">${esc(nm(q.i))}</text>`;
    });
    ui.fig2.innerHTML = `<svg viewBox="0 0 ${W} 60" class="fl-svg">${s}</svg>`;
    ui.legend.innerHTML = '';
    for (let i = 0; i < n; i++) ui.legend.append(h('span', { class: 'fl-key', style: `--c:${COL[i % 5]}` }, M(P.nameLong?.[i] ?? nm(i))));
    const per = period(rec), sp = sepInfo(), chips = seq.slice(0, 14).map(q => nm(q.i)).join(' → ') + (seq.length > 14 ? ' → …' : '');
    ui.read.innerHTML = `${mdInline(`**${L.seq}** ${esc(chips)}`)} · ${mdInline(`**${L.period}** ${per == null ? '–' : f2(per, 1)}`)}`
      + (sp ? ` · ${mdInline(`**${L.sep}** ${f2(sp.now, 3)}`)}` : '');
    el.dataset.seq = seq.map(q => q.i).join(''); el.dataset.period = per == null ? '' : per.toFixed(2);
    el.dataset.x = cur.x.map(q => q.toFixed(4)).join(',');
    el.dataset.sep = sp ? sp.now.toFixed(4) : '';
  }

  function proj(p) {
    const [x, y, z] = p;
    switch (P.view) {
      case 'xy': return [x, y]; case 'yz': return [y, z];
      case 'tilt': { const a = P.azimuth * Math.PI / 180, pt = 0.35, zc = z - (P.rho - 1), u = x * Math.cos(a) + y * Math.sin(a), d = -x * Math.sin(a) + y * Math.cos(a);
        return [u, zc * Math.cos(pt) + d * Math.sin(pt)]; }
      default: return [x, z];
    }
  }
  function drawLorenz() {
    const Tt = P.T, cur = rec[rec.length - 1];
    const pts = rec.map(r => proj(r.x)), ptsB = recB.map(r => proj(r.x));
    const all = pts.concat(ptsB);
    const sx = Math.max(...all.map(p => Math.abs(p[0])), 20), sy = Math.max(...all.map(p => Math.abs(p[1])), 20);
    const xr = [-nice(sx * 1.05), nice(sx * 1.05)];
    const yr = P.view === 'xz' || P.view === 'yz' ? [0, nice(Math.max(...all.map(p => p[1]), 40) * 1.05)] : [-nice(sy * 1.05), nice(sy * 1.05)];
    const nt = r => (r[0] === 0 && r[1] % 10 === 0 ? r[1] / 10 : 4);
    const fr = frame(230, xr, yr, ticks(xr[0], xr[1], 4), ticks(yr[0], yr[1], nt(yr)), 38);
    let g = fr.g;
    const trail = (ps, color, op) => {
      const n = ps.length, ch = 5;
      for (let c = 0; c < ch; c++) {
        const a = Math.floor(c * (n - 1) / ch), b = Math.floor((c + 1) * (n - 1) / ch) + 1;
        g += poly(ps.slice(a, b + 1).map(p => [fr.X(p[0]), fr.Y(p[1])]), 'fl-line', `stroke="${color}" opacity="${((0.2 + 0.8 * (c + 1) / ch) * op).toFixed(2)}"`);
      }
      if (n) g += `<circle cx="${fr.X(ps[n - 1][0])}" cy="${fr.Y(ps[n - 1][1])}" r="4" fill="${color}"/>`;
    };
    if (ptsB.length) trail(ptsB, COL[2], 0.9);
    trail(pts, COL[0], 1);
    ui.fig1.innerHTML = `<svg viewBox="0 0 ${W} 230" class="fl-svg">${g}</svg>`;
    // x1(t)
    const xm = nice(Math.max(...rec.map(r => Math.abs(r.x[0])), 10) * 1.05);
    const f2f = frame(130, [0, Tt], [-xm, xm], ticks(0, Tt, 4), [-xm, 0, xm]);
    let s = f2f.g + poly(rec.map(r => [f2f.X(r.t), f2f.Y(r.x[0])]), 'fl-line', `stroke="${COL[0]}"`);
    if (recB.length) s += poly(recB.map(r => [f2f.X(r.t), f2f.Y(r.x[0])]), 'fl-line', `stroke="${COL[2]}" opacity=".85"`);
    ui.fig2.innerHTML = `<svg viewBox="0 0 ${W} 130" class="fl-svg">${s}</svg>`;
    ui.legend.innerHTML = '';
    ui.legend.append(h('span', { class: 'fl-key', style: `--c:${COL[0]}` }, M(L.main)));
    if (P.nudge > 0) ui.legend.append(h('span', { class: 'fl-key', style: `--c:${COL[2]}` }, M(L.nudged)));
    const sp = sepInfo(), c = cur.x;
    ui.read.innerHTML = `${tex(`(x_1,x_2,x_3)=(${c.map(q => f2(q, 1)).join(',\\,')})`)}`
      + (sp ? ` · ${mdInline(`**${L.sep}** ${f2(sp.now, 2)}`)} · ${mdInline(`**${L.sepTime}** ${sp.first == null ? L.never : `${f2(sp.first, 1)}`}`)}` : '');
    el.dataset.x = c.map(q => q.toFixed(4)).join(',');
    el.dataset.sep = sp ? sp.now.toFixed(4) : ''; el.dataset.firstApart = sp?.first == null ? '' : sp.first.toFixed(2);
  }
  function draw() {
    if (!ui.fig1) return;
    ui.pre.forEach((b, k) => { b.classList.toggle('primary', k === pidx); b.classList.toggle('ghost', k !== pidx); });
    ui.views.forEach((b, k) => { const on = ['xz', 'xy', 'yz', 'tilt'][k] === P.view; b.classList.toggle('primary', on); b.classList.toggle('ghost', !on); });
    ui.sl.forEach(s => { const v = s.get(); if (document.activeElement !== s.inp) s.inp.value = v; s.out.textContent = s.fmt(v); });
    if (sys === 'lorenz') drawLorenz(); else drawLV();
    el.dataset.system = sys; el.dataset.t = tcur.toFixed(2); el.dataset.running = running ? '1' : '0';
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  load(-1);
}
