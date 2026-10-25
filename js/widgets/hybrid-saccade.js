// hybrid-saccade
//
// A hybrid (discrete + continuous) generative model turning a decision into a movement (Sec. 8.5, Figs 8.6-8.7, Eq. 8.8).
// Discrete layer: a POMDP posterior Q_tau(o) over the outcomes o (the places the eye can be: a fixation point and a few
//   targets) at each of `steps` discrete time steps. Each outcome o has a continuous location eta_o.
// Link (Eq. 8.8): P(v|o) = N(eta_o, Pi_v^-1) and the prior over the continuous cause is the Bayesian model average
//   q_tau = E_{Q_tau(o)}[eta] = sum_o Q_tau(o) eta_o.
// Continuous layer: the eye position x (2D) fulfils the prior q_tau during step tau. The model is a point attractor
//   pulled to q_tau; the belief tracks the sensed position and action fulfils the prediction, so the closed loop is
//   the critically damped spring   x'' = w^2 (q_tau - x) - 2 w x',   w = omega0 sqrt(Pi_v)
//   (the precision of the prior is the stiffness of the pull: bell-shaped saccade speed, as in Fig 8.7, bottom).
// Reciprocal message (upward): the continuous data (mean eye position xbar_tau over the last fifth of step tau) give
//   evidence for each outcome, L(o) = exp(-Pi_y |xbar_tau - eta_o|^2 / 2), and the updated belief is
//   Q'_tau(o) proportional to Q_tau(o) L(o). It appears (hollow marker) once that step's data have been played.
// Time is in ms. Deterministic, RK4 with dt = 1 ms.
//
// Config (every key can also sit in a preset; a preset overrides the config):
//   outcomes: [{name, eta: [x, y]}, ...]   default: fixation (0,0), up (0,1), right (1,0), down (0,-1), left (-1,0)
//   stages: ['cue','delay','saccade','fixate']   one label per discrete step (its length = number of steps)
//   beliefs: [[w..], ...]    raw weights per step over the outcomes (normalized for display), sliders edit them
//   cue: 1                   index of the outcome shown as a dot in the plane (null = none)
//   x0: [0, 0]               initial eye position
//   PiV: 1, PiVRange: [0.1, 30]       precision of the prior on the cause (log slider); w = omega0 sqrt(PiV)
//   omega0: 0.02                      1/ms; with PiV = 1 a saccade takes about 250 ms
//   stepMs: 250, stepRange: [80, 600] continuous time per discrete step (tau(2)/tau(1), in ms)
//   PiY: 8                            precision of the continuous evidence sent upward
//   conf: 0.9                         mass put on an outcome by an evidence button
//   playSec: 4                        real seconds of Play for the whole trial, autoplay: false
//   show: { beliefs, PiV, stepMs, feedback } = true/false
//   labels: { play, pause, reset, belief, plane, series, speed, step, uniform, later, PiV, stepMs, q, eye, post, prior,
//             updated, peak, arrive, final }
//   presets: [{ label, ..any key above.. }]

import { h } from '../dom.js';
import { mdInline, tex } from '../render.js';

const M = s => h('span', { html: mdInline(String(s)) });
const T = s => h('span', { html: tex(String(s)) });
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const f2 = (x, d = 2) => (Math.abs(x) < 5 * 10 ** -(d + 1) ? 0 : x).toFixed(d);
const COL = ['#7a7a7a', '#1f8a9e', '#c0504d', '#d08a1e', '#7a5fb0', '#4f9a4f', '#a0527a'];
const DEF_OUT = [{ name: 'fixation', eta: [0, 0] }, { name: 'up', eta: [0, 1] }, { name: 'right', eta: [1, 0] }, { name: 'down', eta: [0, -1] }, { name: 'left', eta: [-1, 0] }];

const norm = w => { const s = w.reduce((a, b) => a + Math.max(0, b), 0); return s > 0 ? w.map(q => Math.max(0, q) / s) : w.map(() => 1 / w.length); };
// Bayesian model average q = sum_o Q(o) eta_o
export const modelAverage = (Q, eta) => [0, 1].map(c => Q.reduce((a, p, o) => a + p * eta[o][c], 0));
// critically damped pull of the eye x (with velocity v) to q; returns state after dt
function rk4(s, q, w, dt) {
  const f = z => [z[2], z[3], w * w * (q[0] - z[0]) - 2 * w * z[2], w * w * (q[1] - z[1]) - 2 * w * z[3]];
  const k1 = f(s), k2 = f(s.map((x, i) => x + 0.5 * dt * k1[i])), k3 = f(s.map((x, i) => x + 0.5 * dt * k2[i])), k4 = f(s.map((x, i) => x + dt * k3[i]));
  return s.map((x, i) => x + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

export function hybridSaccade(el, cfg) {
  const presets = cfg.presets ?? [];
  const L = { play: 'Play', pause: 'Pause', reset: 'Reset', belief: 'Discrete layer: belief about where the eye is, at each step', plane: 'Continuous layer: the eye in the plane',
    series: 'Eye position against time', speed: 'Eye speed', step: 'Step', uniform: 'Flat', later: 'Copy to later steps', PiV: 'Prior precision',
    stepMs: 'ms per step', q: 'Prior q', eye: 'Eye', post: 'Belief', prior: 'before the movement', updated: 'after the movement', peak: 'Peak speed',
    arrive: 'Arrival (within 5%)', h: 'horizontal', v: 'vertical', final: 'Final position', ...(cfg.labels ?? {}) };
  let P, B, rec, tcur = 0, running = false, raf = null, last = 0, pidx = -1, sel = 0, ui = {}, Qs, qs, post, xbar;

  function load(i) {
    stop(); pidx = i;
    const base = { ...cfg, ...(i >= 0 ? presets[i] : {}) };
    P = { outcomes: DEF_OUT, stages: ['cue', 'delay', 'saccade', 'fixate'], PiV: 1, PiVRange: [0.1, 30], omega0: 0.02, stepMs: 250, stepRange: [80, 600], PiY: 8,
      conf: 0.9, playSec: 4, x0: [0, 0], cue: null, ...base };
    const n = P.outcomes.length, S = P.stages.length;
    B = (P.beliefs ?? []).map(r => [...r]);
    while (B.length < S) B.push(Array.from({ length: n }, (_, o) => (o === 0 ? 1 : 0)));
    sel = Math.min(sel, S - 1);
    build(); compute(); tcur = P.autoplay ? 0 : total(); draw();
    if (P.autoplay) startFresh();
  }
  const total = () => P.stages.length * P.stepMs;
  const omega = () => P.omega0 * Math.sqrt(P.PiV);
  function compute() {
    const eta = P.outcomes.map(o => o.eta), S = P.stages.length, sm = P.stepMs;
    Qs = B.map(norm); qs = Qs.map(Q => modelAverage(Q, eta));
    rec = [{ t: 0, x: [...P.x0], v: [0, 0], k: 0 }];
    let s = [...P.x0, 0, 0];
    for (let t = 0; t < S * sm; t++) {
      const k = Math.min(S - 1, Math.floor(t / sm));
      s = rk4(s, qs[k], omega(), 1);
      rec.push({ t: t + 1, x: [s[0], s[1]], v: [s[2], s[3]], k });
    }
    // upward evidence from the last fifth of each step
    xbar = []; post = [];
    for (let k = 0; k < S; k++) {
      const a = Math.round((k + 0.8) * sm), b = Math.round((k + 1) * sm), seg = rec.slice(a + 1, b + 1);
      const xb = [0, 1].map(c => seg.reduce((q, r) => q + r.x[c], 0) / seg.length);
      xbar.push(xb);
      post.push(norm(Qs[k].map((p, o) => p * Math.exp(-0.5 * P.PiY * ((xb[0] - eta[o][0]) ** 2 + (xb[1] - eta[o][1]) ** 2)))));
    }
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; if (ui.run) ui.run.textContent = L.play; }
  function startFresh() { tcur = 0; running = true; last = 0; ui.run.textContent = L.pause; raf = requestAnimationFrame(loop); }
  function loop(ts) {
    raf = null;
    if (!el.isConnected || !running) return;
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60; last = ts;
    tcur = Math.min(total(), tcur + dt * total() / P.playSec); draw();
    if (tcur >= total()) { stop(); draw(); return; }
    raf = requestAnimationFrame(loop);
  }
  function changed() { compute(); if (!running) tcur = total(); draw(); }

  function build() {
    el.textContent = ''; ui.sl = []; const n = P.outcomes.length, S = P.stages.length;
    const btn = (txt, on, cls = 'ghost') => h('button', { class: `btn ${cls}`, type: 'button', onclick: on }, M(txt));
    ui.pre = presets.map((p, i) => btn(p.label ?? String(i + 1), () => load(i)));
    ui.run = btn(L.play, () => { if (running) return stop(); if (tcur >= total() - 1e-9) startFresh(); else { running = true; last = 0; ui.run.textContent = L.pause; raf = requestAnimationFrame(loop); } }, 'primary');
    const show = P.show ?? {};
    ui.tabs = P.stages.map((st, k) => btn(`${k + 1} ${st}`, () => { sel = k; draw(); }));
    ui.ws = [];
    const wrows = P.outcomes.map((o, j) => {
      const out = h('span', { class: 'bs-val' });
      const inp = h('input', { type: 'range', min: 0, max: 1, step: 0.01, 'aria-label': `weight ${o.name}` });
      inp.addEventListener('input', () => { B[sel][j] = +inp.value; changed(); });
      ui.ws.push({ inp, out, j });
      return h('div', { class: 'wslider' }, h('span', { class: 'bs-sl', style: `color:${COL[j % COL.length]};min-width:5.5em` }, M(o.name)), inp, out);
    });
    const ev = P.outcomes.map((o, j) => btn(`${L.post} ${o.name}`, () => {
      B[sel] = P.outcomes.map((_, q) => (q === j ? P.conf : (1 - P.conf) / (n - 1))); changed();
    }));
    const flat = btn(L.uniform, () => { B[sel] = P.outcomes.map(() => 1); changed(); });
    const later = btn(L.later, () => { for (let k = sel + 1; k < S; k++) B[k] = [...B[sel]]; changed(); });
    const mk = (key, lab, rng, log, get, set, fmt) => {
      const out = h('span', { class: 'bs-val' });
      const inp = h('input', { type: 'range', min: 0, max: 1, step: 0.005, 'aria-label': key });
      const [a, b] = rng;
      inp.addEventListener('input', () => { const u = +inp.value; set(log ? a * (b / a) ** u : a + (b - a) * u); changed(); });
      ui.sl.push({ inp, out, fmt, get: () => { const v = get(); return log ? Math.log(v / a) / Math.log(b / a) : (v - a) / (b - a); }, val: get });
      return h('div', { class: 'wslider' }, h('span', { class: 'bs-sl' }, lab), inp, out);
    };
    const rows = [];
    if (show.PiV !== false) rows.push(mk('PiV', T('\\Pi_v'), P.PiVRange, true, () => P.PiV, v => { P.PiV = v; }, v => f2(v, v < 10 ? 2 : 1)));
    if (show.stepMs !== false) rows.push(mk('stepMs', T('\\tau_2/\\tau_1'), P.stepRange, false, () => P.stepMs, v => { P.stepMs = Math.round(v / 10) * 10; }, v => `${Math.round(v)} ms`));
    ui.fig1 = h('div', { class: 'fl-fig', role: 'img', 'aria-label': L.belief });
    ui.fig2 = h('div', { class: 'fl-fig', role: 'img', 'aria-label': L.plane });
    ui.fig3 = h('div', { class: 'fl-fig', role: 'img', 'aria-label': L.series });
    ui.fig4 = h('div', { class: 'fl-fig', role: 'img', 'aria-label': L.speed });
    ui.read = h('div', { class: 'fl-read' }); ui.legend = h('div', { class: 'fl-legend' });
    ui.fig1.addEventListener('click', e => { const r = ui.fig1.getBoundingClientRect(), u = (e.clientX - r.left) / r.width * 320; const k = Math.floor((u - 28) / ((320 - 36) / S)); if (k >= 0 && k < S) { sel = k; draw(); } });
    const cap = (t, fg) => h('div', {}, h('div', { class: 'fl-cap' }, M(t)), fg);
    el.append(
      presets.length ? h('div', { class: 'wbtns fl-pre' }, ...ui.pre) : '',
      h('div', { class: 'fl-figs' }, cap(L.belief, ui.fig1), cap(L.plane, ui.fig2)),
      h('div', { class: 'fl-figs' }, cap(L.series, ui.fig3), cap(L.speed, ui.fig4)),
      ui.legend, ui.read,
      show.beliefs !== false ? h('div', { class: 'fl-sl' }, h('div', { class: 'wbtns' }, ...ui.tabs), ...wrows, h('div', { class: 'wbtns' }, ...ev, flat, later)) : '',
      h('div', { class: 'fl-sl' }, ...rows),
      h('div', { class: 'wbtns' }, ui.run, btn(L.reset, () => { stop(); tcur = total(); draw(); })));
  }

  const W = 320;
  const ticks = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
  function frame(H, xr, yr, xt, yt, ml = 34) {
    const mr = 14, mt = 8, mb = 20, pw = W - ml - mr, ph = H - mt - mb;
    const X = t => ml + (t - xr[0]) / (xr[1] - xr[0]) * pw, Y = y => mt + ph - (y - yr[0]) / (yr[1] - yr[0]) * ph;
    let g = `<rect x="${ml}" y="${mt}" width="${pw}" height="${ph}" class="fl-box"/>`;
    xt.forEach(t => { g += `<line x1="${X(t)}" y1="${mt + ph}" x2="${X(t)}" y2="${mt + ph + 3}" class="fl-ax"/><text x="${X(t)}" y="${H - 6}" class="fl-t fl-mid">${f2(t, Math.abs(t) < 10 && t % 1 ? 1 : 0)}</text>`; });
    yt.forEach(y => { g += `<line x1="${ml - 3}" y1="${Y(y)}" x2="${ml}" y2="${Y(y)}" class="fl-ax"/><line x1="${ml}" y1="${Y(y)}" x2="${ml + pw}" y2="${Y(y)}" class="fl-grid"/><text x="${ml - 5}" y="${Y(y) + 3.5}" class="fl-t fl-end">${f2(y, Math.abs(y) < 10 && y % 1 ? 1 : 0)}</text>`; });
    return { X, Y, g, ml, mt, pw, ph };
  }
  const poly = (pts, cls, extra = '') => (pts.length > 1 ? `<polyline points="${pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}" class="${cls}" ${extra}/>` : '');

  function draw() {
    if (!ui.fig1) return;
    const S = P.stages.length, n = P.outcomes.length, sm = P.stepMs, Tt = total(), eta = P.outcomes.map(o => o.eta);
    const ti = Math.min(Tt, Math.round(tcur)), cur = rec[ti], done = k => tcur >= (k + 1) * sm - 1e-9;
    ui.pre.forEach((b, k) => { b.classList.toggle('primary', k === pidx); b.classList.toggle('ghost', k !== pidx); });
    ui.tabs.forEach((b, k) => { b.classList.toggle('primary', k === sel); b.classList.toggle('ghost', k !== sel); });
    ui.ws.forEach(w => { const v = B[sel][w.j]; if (document.activeElement !== w.inp) w.inp.value = Math.min(1, Math.max(0, v)); w.out.textContent = `${Math.round(Qs[sel][w.j] * 100)}%`; });
    ui.sl.forEach(s => { if (document.activeElement !== s.inp) s.inp.value = s.get(); s.out.textContent = s.fmt(s.val()); });
    // belief bars
    const f1 = frame(150, [0, S], [0, 1], [], [0, 0.5, 1], 28), gw = f1.pw / S, bw = Math.min(14, (gw - 6) / n);
    let g = f1.g + `<rect x="${f1.ml + sel * gw}" y="${f1.mt}" width="${gw}" height="${f1.ph}" fill="#8a8a8a" opacity=".13"/>`;
    for (let k = 0; k < S; k++) {
      const x0 = f1.ml + k * gw + (gw - bw * n) / 2;
      if (k > 0) g += `<line x1="${f1.ml + k * gw}" y1="${f1.mt}" x2="${f1.ml + k * gw}" y2="${f1.mt + f1.ph}" class="fl-grid"/>`;
      for (let o = 0; o < n; o++) {
        const c = COL[o % COL.length], y = f1.Y(Qs[k][o]);
        g += `<rect x="${(x0 + o * bw + 0.5).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 1).toFixed(1)}" height="${(f1.mt + f1.ph - y).toFixed(1)}" fill="${c}" opacity=".85"/>`;
        if (P.show?.feedback !== false && done(k)) g += `<rect x="${(x0 + o * bw + 0.5).toFixed(1)}" y="${f1.Y(post[k][o]).toFixed(1)}" width="${(bw - 1).toFixed(1)}" height="${(f1.mt + f1.ph - f1.Y(post[k][o])).toFixed(1)}" fill="none" stroke="#222" stroke-width="1.3"/>`;
      }
      g += `<text x="${(f1.ml + (k + 0.5) * gw).toFixed(1)}" y="144" class="fl-t fl-mid">${k + 1} ${esc(P.stages[k])}</text>`;
    }
    ui.fig1.innerHTML = `<svg viewBox="0 0 ${W} 150" class="fl-svg">${g}</svg>`;
    // plane
    const unit = Math.max(...eta.flat().map(Math.abs), 1e-9), ext = Math.max(unit, ...rec.map(r => Math.max(Math.abs(r.x[0]), Math.abs(r.x[1])))) * 1.25, r = [-ext, ext];
    const tk = [-unit, 0, unit].map(v => +v.toPrecision(2));
    const fp = frame(230, r, r, tk, tk, 38);
    const sx = fp.pw / (2 * ext), sy = fp.ph / (2 * ext), sc = Math.min(sx, sy);
    let gp = fp.g;
    P.outcomes.forEach((o, j) => {
      const cx = fp.X(o.eta[0]), cy = fp.Y(o.eta[1]), c = COL[j % COL.length], isCue = P.cue === j;
      gp += `<circle cx="${cx}" cy="${cy}" r="${isCue && tcur < sm ? 6 : 4}" fill="${isCue && tcur < sm ? c : 'none'}" stroke="${c}" stroke-width="1.6"/>`;
      if (j > 0) gp += `<text x="${cx + 7}" y="${cy - 6}" class="fl-t" style="fill:${c}">${esc(o.name)}</text>`;
    });
    const sel_q = qs[sel];
    gp += `<path d="M${fp.X(sel_q[0])} ${fp.Y(sel_q[1]) - 6}l6 6l-6 6l-6 -6z" fill="none" stroke="#222" stroke-width="1.5"/>`;
    const upto = rec.slice(0, ti + 1);
    for (let k = 0; k < S; k++) {
      const seg = upto.filter(q => q.k === k || (q.t === k * sm));
      gp += poly(seg.map(q => [fp.X(q.x[0]), fp.Y(q.x[1])]), 'fl-line', `stroke="#222" opacity="${(0.35 + 0.65 * (k + 1) / S).toFixed(2)}"`);
    }
    gp += `<circle cx="${fp.X(cur.x[0])}" cy="${fp.Y(cur.x[1])}" r="4.5" fill="#222"/>`;
    ui.fig2.innerHTML = `<svg viewBox="0 0 ${W} 230" class="fl-svg">${gp}</svg>`;
    // time series
    const yr = [-ext, ext], f3 = frame(150, [0, Tt], yr, ticks(0, Tt, 4).map(Math.round), tk, 38);
    let gs = f3.g;
    for (let k = 1; k < S; k++) gs += `<line x1="${f3.X(k * sm)}" y1="${f3.mt}" x2="${f3.X(k * sm)}" y2="${f3.mt + f3.ph}" class="fl-grid" stroke-dasharray="3 3"/>`;
    for (let c = 0; c < 2; c++) {
      const col = c ? '#111' : '#2b6cb0';
      gs += poly(qs.flatMap((q, k) => [[f3.X(k * sm), f3.Y(q[c])], [f3.X((k + 1) * sm), f3.Y(q[c])]]), 'fl-ghost', `stroke="${col}"`);
      gs += poly(upto.filter((_, i) => i % 3 === 0 || i === ti).map(q => [f3.X(q.t), f3.Y(q.x[c])]), 'fl-line', `stroke="${col}"`);
    }
    gs += `<text x="${f3.ml + 4}" y="${f3.mt + 11}" class="fl-t" style="fill:#2b6cb0">${esc(L.h)}</text><text x="${f3.ml + 4}" y="${f3.mt + 23}" class="fl-t" style="fill:#111">${esc(L.v)}</text>`;
    ui.fig3.innerHTML = `<svg viewBox="0 0 ${W} 150" class="fl-svg">${gs}</svg>`;
    // speed
    const sp = q => Math.hypot(q.v[0], q.v[1]) * 1000, smax = Math.max(...rec.map(sp), 1e-9), top = smax * 1.1;
    const f4 = frame(90, [0, Tt], [0, top], ticks(0, Tt, 4).map(Math.round), [0, top / 2, top].map(v => +v.toPrecision(2)), 38);
    let g4 = f4.g;
    for (let k = 1; k < S; k++) g4 += `<line x1="${f4.X(k * sm)}" y1="${f4.mt}" x2="${f4.X(k * sm)}" y2="${f4.mt + f4.ph}" class="fl-grid" stroke-dasharray="3 3"/>`;
    g4 += poly(upto.filter((_, i) => i % 3 === 0 || i === ti).map(q => [f4.X(q.t), f4.Y(sp(q))]), 'fl-line', 'stroke="#7a5fb0"');
    ui.fig4.innerHTML = `<svg viewBox="0 0 ${W} 90" class="fl-svg">${g4}</svg>`;
    // legend + readouts
    ui.legend.innerHTML = '';
    P.outcomes.forEach((o, j) => ui.legend.append(h('span', { class: 'fl-key', style: `--c:${COL[j % COL.length]}` }, M(o.name))));
    const fin = rec[Tt].x, tgt = qs[S - 1];
    const e0 = Math.hypot(P.x0[0] - tgt[0], P.x0[1] - tgt[1]);
    const arr = e0 < 1e-9 ? null : rec.find(q => q.k >= S - 1 && Math.hypot(q.x[0] - tgt[0], q.x[1] - tgt[1]) < 0.05 * e0);
    const qa = qs[sel].map(v => f2(v, 2));
    ui.read.innerHTML = `${mdInline(`**${L.step} ${sel + 1}** · ${L.q} = (${qa.join(', ')})`)} · ${mdInline(`**${L.peak}** ${f2(smax, 2)}`)} · ${mdInline(`**${L.final}** (${f2(fin[0], 2)}, ${f2(fin[1], 2)})`)}`;
    el.dataset.t = String(Math.round(tcur)); el.dataset.running = running ? '1' : '0'; el.dataset.step = String(sel + 1);
    el.dataset.PiV = P.PiV.toFixed(3); el.dataset.stepMs = String(sm);
    el.dataset.Q = Qs.map(Q => Q.map(v => v.toFixed(3)).join(',')).join(';');
    el.dataset.q = qs.map(q => q.map(v => v.toFixed(3)).join(',')).join(';');
    el.dataset.post = post.map(Q => Q.map(v => v.toFixed(3)).join(',')).join(';');
    el.dataset.x = cur.x.map(v => v.toFixed(3)).join(','); el.dataset.final = fin.map(v => v.toFixed(3)).join(',');
    el.dataset.peak = smax.toFixed(3); el.dataset.arrive = arr ? String(arr.t) : '';
  }
  load(-1);
}
