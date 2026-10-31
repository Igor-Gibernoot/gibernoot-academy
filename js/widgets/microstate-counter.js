// microstate-counter
//
// N particles (or coins) in a box with a left and a right half. Clicking a particle flips its
// side. The widget counts: the macrostate k (how many on the left), the number of microstates
// W = C(N, k) (which particles are on the left), the share W / 2^N of all arrangements, and
// S / k_B = ln W. Optional histogram of W for every k with the current k highlighted.
// "Shuffle" puts every particle on a random side; "Step" flips a few random particles;
// "Auto-run" repeats Step on a timer (drift towards k = N/2). Reports nothing to the card.
// Config (all wording from the config; every drawn element has a switch):
//   N: 10                      number of particles (2 to 400)
//   nOptions: [10, 100]        if 2+ values and show.selector, buttons to change N
//   start: 'left' | 'right' | 'half' | 'random' | number k   starting arrangement (default 'left')
//   seed: 1                    seeded random numbers (repeatable); omit for true random
//   perStep: 1                 particles flipped per Step / auto tick (random, may repeat)
//   interval: 120              ms between auto-run ticks
//   autorun: false             start running at once
//   clickable: true            clicking (Enter/Space on a focused particle) flips it
//   exactMax: 60               up to this N, W is printed exactly; beyond, as m×10^e
//   histScale: 'linear' | 'log'   bar heights W or ln W
//   show: { box, particles, sideLabels, histogram, highlight, ticks, k, W, share, S, steps,
//           shuffle, step, auto, reset, selector }
//         defaults: all true except S, share, histogram, highlight, ticks, auto, reset, selector false
//         (ticks and highlight only matter with the histogram; sideLabels = names of the halves)
//   labels: { left, right, k, W, share, S, steps, shuffle, step, auto, autoOn, reset, N,
//             hist, histX }   (math allowed, $...$)
import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const BW = 480, BH = 170, HH = 140;

function rng(seed) {
  let a = (seed | 0) + 0x6D2B79F5;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function microstateCounter(el, cfg) {
  const L = { left: 'left', right: 'right', k: 'on the left, k', W: 'microstates W', share: 'share of all arrangements',
    S: 'S / k_B = ln W', steps: 'steps', shuffle: 'Shuffle', step: 'Step', auto: 'Auto-run', autoOn: 'Stop', reset: 'Reset',
    N: 'N', hist: 'W for each k', histX: 'k (number on the left)', ...(cfg.labels ?? {}) };
  const sh = { box: true, particles: true, sideLabels: true, histogram: false, highlight: false, ticks: false, k: true, W: true,
    share: false, S: false, steps: true, shuffle: true, step: true, auto: false, reset: false, selector: false, ...(cfg.show ?? {}) };
  const nOpts = (cfg.nOptions ?? []).map(Number).filter(n => n >= 2 && n <= 400);
  let N = Math.max(2, Math.min(400, Math.round(cfg.N ?? 10)));
  const perStep = Math.max(1, Math.round(cfg.perStep ?? 1)), interval = cfg.interval ?? 120;
  const exactMax = cfg.exactMax ?? 60, logScale = cfg.histScale === 'log';
  const clickable = cfg.clickable ?? true;
  let rand, left, pos, steps, timer = null;   // left[i] true = particle i in the left half

  function reset() {
    rand = cfg.seed == null ? Math.random : rng(cfg.seed);
    // fixed jittered-grid position (u, v in 0..1) of each particle inside its half
    const cols = Math.max(1, Math.round(Math.sqrt(N * (BW / 2) / BH))), rows = Math.ceil(N / cols);
    const order = [...Array(N).keys()];
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    pos = Array(N);
    order.forEach((p, slot) => {
      const c = slot % cols, r = Math.floor(slot / cols);
      pos[p] = [(c + 0.5 + (rand() - 0.5) * 0.5) / cols, (r + 0.5 + (rand() - 0.5) * 0.5) / rows];
    });
    const s = cfg.start ?? 'left';
    left = Array(N).fill(false);
    const kStart = s === 'left' ? N : s === 'right' ? 0 : s === 'half' ? Math.floor(N / 2) : typeof s === 'number' ? Math.max(0, Math.min(N, s)) : null;
    if (kStart == null) for (let i = 0; i < N; i++) left[i] = rand() < 0.5;
    else for (let i = 0; i < kStart; i++) left[i] = true;
    steps = 0;
  }

  // ln C(N, k) and exact C(N, k)
  const lnC = (n, k) => { let s = 0; for (let i = 1; i <= k; i++) s += Math.log((n - k + i) / i); return s; };
  const exactC = (n, k) => { let r = 1n; for (let i = 1; i <= k; i++) r = r * BigInt(n - k + i) / BigInt(i); return r; };
  const sci = (ln) => {   // from a natural log
    const l10 = ln / Math.LN10, e = Math.floor(l10 + 1e-12), mant = Math.pow(10, l10 - e);
    return `${mant.toFixed(2)}×10${String(e).split('').map(c => SUP[c]).join('')}`;
  };
  const fmtW = (n, k) => {
    if (n <= exactMax) return exactC(n, k).toString();
    const ln = lnC(n, k);
    return ln < Math.log(1e6) ? String(Math.round(Math.exp(ln))) : sci(ln);
  };
  const fmtShare = ln => {
    const p = Math.exp(ln);
    if (p >= 0.01) return `${(p * 100).toPrecision(p >= 0.1 ? 3 : 2).replace(/\.?0+$/, '')}%`;
    return sci(ln);
  };
  const count = () => left.reduce((a, b) => a + (b ? 1 : 0), 0);

  // --- DOM ---
  el.classList.add('ms');
  const box = (sh.box || sh.particles) ? sv('svg', { viewBox: `0 0 ${BW} ${BH}`, class: 'ms-svg', role: 'group', 'aria-label': 'Box with particles in a left and a right half' }) : null;
  const hist = sh.histogram ? sv('svg', { viewBox: `0 0 ${BW} ${HH}`, class: 'ms-hist', role: 'img' }) : null;
  const rd = h('div', { class: 'readout ms-read', role: 'status', 'aria-live': 'polite' });
  const bar = h('div', { class: 'wbtns ms-btns' });
  el.append(...[box, bar, rd, hist].filter(Boolean));

  const btn = (label, fn, extra = {}) => h('button', { class: 'btn ghost', type: 'button', onclick: fn, ...extra }, h('span', { html: mdInline(label) }));
  function flip(i) { left[i] = !left[i]; draw(); }
  function stepOnce() { for (let j = 0; j < perStep; j++) { const i = Math.floor(rand() * N); left[i] = !left[i]; } steps++; draw(); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } if (autoBtn) { autoBtn.classList.remove('on'); autoBtn.setAttribute('aria-pressed', 'false'); autoBtn.firstChild.innerHTML = mdInline(L.auto); } }
  function start() {
    if (timer) return;
    timer = setInterval(() => { if (!el.isConnected) { stop(); return; } stepOnce(); }, interval);
    if (autoBtn) { autoBtn.classList.add('on'); autoBtn.setAttribute('aria-pressed', 'true'); autoBtn.firstChild.innerHTML = mdInline(L.autoOn); }
  }
  let autoBtn = null;
  if (nOpts.length > 1 && sh.selector) {
    bar.append(h('span', { class: 'ms-nl', html: mdInline(L.N) }), ...nOpts.map(n => h('button', { class: 'btn ghost', type: 'button', 'data-n': n, 'aria-pressed': String(n === N),
      onclick: () => { stop(); N = n; reset(); build(); draw(); } }, String(n))));
  }
  if (sh.shuffle) bar.append(btn(L.shuffle, () => { for (let i = 0; i < N; i++) left[i] = rand() < 0.5; steps++; draw(); }));
  if (sh.step) bar.append(btn(L.step, stepOnce));
  if (sh.auto) { autoBtn = btn(L.auto, () => (timer ? stop() : start()), { 'aria-pressed': 'false' }); bar.append(autoBtn); }
  if (sh.reset) bar.append(btn(L.reset, () => { stop(); reset(); draw(); }));
  bar.style.display = bar.children.length ? '' : 'none';

  let dots = [];
  function build() {
    dots = [];
    if (box) {
      box.replaceChildren();
      const pad = 8, x0 = pad, x1 = BW - pad, y0 = pad + (sh.sideLabels ? 16 : 0), y1 = BH - pad, mid = (x0 + x1) / 2;
      box._g = { x0, x1, y0, y1, mid };
      if (sh.box) box.append(sv('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 6, class: 'ms-box' }), sv('line', { x1: mid, x2: mid, y1: y0, y2: y1, class: 'ms-mid' }));
      if (sh.sideLabels) for (const [x, s] of [[(x0 + mid) / 2, L.left], [(mid + x1) / 2, L.right]]) {
        const t = sv('text', { x, y: y0 - 5, class: 'ms-lab', 'text-anchor': 'middle' }); t.textContent = s.replace(/\$/g, ''); box.append(t);
      }
      if (sh.particles) {
        const r = Math.max(2.2, Math.min(9, 130 / Math.sqrt(N) / 2.2));
        for (let i = 0; i < N; i++) {
          const c = sv('circle', { r, class: 'ms-dot', 'data-i': i });
          if (clickable) {
            c.classList.add('ms-click');
            if (N <= 40) { c.setAttribute('tabindex', '0'); c.setAttribute('role', 'button'); c.setAttribute('aria-label', `Particle ${i + 1}`); }
            c.addEventListener('click', () => flip(i));
            c.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); flip(i); } });
          }
          dots.push(c); box.append(c);
        }
      }
    }
    if (hist) {
      hist.replaceChildren();
      hist._bars = [];
      const px0 = 12, px1 = BW - 12, py0 = 8, py1 = HH - (sh.ticks ? 30 : 18), bw = (px1 - px0) / (N + 1);
      const val = k => (logScale ? lnC(N, k) : Math.exp(lnC(N, k) - lnC(N, Math.floor(N / 2))));
      const vmax = logScale ? lnC(N, Math.floor(N / 2)) || 1 : 1;
      for (let k = 0; k <= N; k++) {
        const hh = Math.max(1.5, val(k) / vmax * (py1 - py0));
        const r = sv('rect', { x: px0 + k * bw + Math.min(1, bw * 0.12), y: py1 - hh, width: Math.max(0.8, bw - 2 * Math.min(1, bw * 0.12)), height: hh, class: 'ms-bar' });
        hist.append(r); hist._bars.push(r);
      }
      hist.append(sv('line', { x1: px0, x2: px1, y1: py1, y2: py1, class: 'ms-axis' }));
      if (sh.ticks) {
        for (const k of new Set([0, Math.round(N / 2), N])) {
          const t = sv('text', { x: px0 + (k + 0.5) * bw, y: py1 + 14, class: 'ms-lab', 'text-anchor': 'middle' }); t.textContent = k; hist.append(t);
        }
        const t = sv('text', { x: BW / 2, y: HH - 3, class: 'ms-lab', 'text-anchor': 'middle' }); t.textContent = L.histX.replace(/\$/g, ''); hist.append(t);
      }
      hist.setAttribute('aria-label', `${L.hist}, N = ${N}`);
    }
  }

  function draw() {
    const k = count(), lw = lnC(N, k);
    if (box && sh.particles) {
      const { x0, x1, y0, y1, mid } = box._g, m = 14;
      dots.forEach((c, i) => {
        const [u, v] = pos[i], isL = left[i], xa = isL ? x0 : mid, xb = isL ? mid : x1;
        c.setAttribute('cx', (xa + m + u * (xb - xa - 2 * m)).toFixed(1));
        c.setAttribute('cy', (y0 + m + v * (y1 - y0 - 2 * m)).toFixed(1));
        c.classList.toggle('ms-l', isL); c.classList.toggle('ms-r', !isL);
        if (c.hasAttribute('role')) c.setAttribute('aria-pressed', String(isL));
      });
    }
    if (hist) hist._bars.forEach((r, j) => r.classList.toggle('ms-cur', sh.highlight && j === k));
    const rows = [];
    const row = (lab, val) => h('span', { class: 'ms-row' }, h('span', { class: 'ms-lbl', html: mdInline(lab) }), ' ', h('b', {}, val));
    if (sh.k) rows.push(row(L.k, `${k}`));
    if (sh.W) rows.push(row(L.W, fmtW(N, k)));
    if (sh.share) rows.push(row(L.share, fmtShare(lw - N * Math.LN2)));
    if (sh.S) rows.push(row(L.S, (lw).toFixed(lw < 100 ? 2 : 1)));
    if (sh.steps) rows.push(row(L.steps, `${steps}`));
    rd.replaceChildren(...rows);
    rd.style.display = rows.length ? '' : 'none';
  }

  reset(); build(); draw();
  if (cfg.autorun && sh.auto) start();
}
