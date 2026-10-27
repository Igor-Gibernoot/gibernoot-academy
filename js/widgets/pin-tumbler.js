// pin-tumbler
//
// Cutaway of a pin-tumbler lock with N pin stacks.  Each stack = spring + driver pin (top) + key pin (bottom).
// The key has one cut depth c_i in {0..D-1} per pin (0 = shallowest, D-1 = deepest); pin i has a secret depth s_i.
// The key lifts the stack so that the top of the key pin sits (s_i - c_i) steps above the shear line:
//   c_i = s_i  -> key pin ends exactly at the shear line (green), driver pin stays in the housing, key pin in the plug;
//   otherwise a pin crosses the shear line (red) and blocks the plug.
// The plug turns only if all N pins match.  Number of distinct keys: D^N.
// Optional picking mode: no key; tension (torque) on the plug makes ONE pin bind at a time (in bindOrder);
// pushing the binding pin (each click lifts it one step) to depth s_i sets it (stays at the shear line); pushing others does nothing useful.
// Fully general: no course text is hard-coded; every word comes from the config.
//
//   pins: 5, depths: 6                    N (3 to 6) and D (2 to 9)
//   secret: [..N numbers in 0..D-1]       the lock's cuts (default: a fixed pattern)
//   key: [..N numbers]                    start cuts of the key (default: all 0)
//   inserted: true                        start with the key inside (false = key outside, pins resting at the bottom)
//   editable: true                        key cuts can be changed (drag a cut up/down on the key, or the - + steppers)
//   mode: 'key' | 'pick'                  'pick' = picking mode (no key; tension button; click a pin to push it up one step)
//   bindOrder: [0,1,..]                   picking: order in which pins bind (default left to right)
//   show: { springs, shearLine, pinLabels, count, bitting, key, plug, steppers, insertButton, readouts }
//       all default true except count and pinLabels (false), where  springs = zigzag springs; shearLine = dashed line;
//       pinLabels = numbers 1..N above the pins; count = "k of N" text on the figure; bitting = the row of cut digits
//       under the key; key = the key outline (when false only pin colours show); plug = plug body + turn indicator;
//       steppers = the - + buttons under each cut; insertButton = the Insert/Remove key button; readouts = readout cells.
//   readouts: ['matches','turns','combinations']   default [] (any subset, any order)
//   presets: [{ label, key, secret, inserted }]    buttons; only the fields given change
//   labels: { matches, turns, combinations, yes, no, insert, remove, reset, tension, release, matchesOf, pinWord,
//             lock, plugTurns, plugStuck, bitting, less, more, binding }
//
// Pure model exported for script checks.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); e.append(...kids); return e; };

export function tumblerModel({ secret, key, inserted = true }) {
  const N = secret.length;
  const match = secret.map((v, i) => inserted && key[i] === v);
  const matches = match.filter(Boolean).length;
  return { N, match, matches, turns: inserted && matches === N };
}
export const combinations = (D, N) => Math.pow(D, N);

export function pinTumbler(el, cfg) {
  const Lb = { matches: 'Pins at the shear line', turns: 'Plug turns', combinations: 'Different keys', yes: 'Yes', no: 'No',
    insert: 'Insert key', remove: 'Remove key', reset: 'Reset', tension: 'Apply torque', release: 'Release torque', matchesOf: 'of',
    pinWord: 'Pin', lock: 'Pin-tumbler lock', plugTurns: 'Plug turns', plugStuck: 'Plug stuck', bitting: 'Cut depths', less: 'Shallower cut', more: 'Deeper cut',
    binding: 'binding', ...(cfg.labels ?? {}) };
  const show = { springs: true, shearLine: true, pinLabels: false, count: false, bitting: true, key: true, plug: true, steppers: true, insertButton: true, readouts: true, ...(cfg.show ?? {}) };
  const N = Math.max(3, Math.min(6, cfg.pins ?? 5)), D = Math.max(2, Math.min(9, cfg.depths ?? 6));
  const dflt = [3, 1, 4, 0, 2, 5].map(v => v % D);
  const fit = (a, d) => Array.from({ length: N }, (_, i) => Math.max(0, Math.min(D - 1, Math.round(a?.[i] ?? d(i)))));
  let secret = fit(cfg.secret, i => dflt[i]);
  const init = { key: fit(cfg.key, () => 0), inserted: cfg.inserted !== false };
  const st = { key: [...init.key], inserted: init.inserted, tension: false, lift: Array(N).fill(D - 1), set: Array(N).fill(false) };
  const pick = cfg.mode === 'pick';
  const order = cfg.bindOrder ?? Array.from({ length: N }, (_, i) => i);
  const reads = cfg.readouts ?? [];

  // geometry (px): y grows downward
  const W = 360, PL = 40, PW = 280, pitch = PW / N, pinW = Math.min(22, pitch * 0.52);
  const u = Math.min(13, 78 / D), DL = 22, BASE = 30;       // step, driver length, base key-pin length
  const SY = 30 + 12 + DL + (D - 1) * u + 4;                  // shear line y
  const YT = 30;                                              // housing chamber top
  const Ykey0 = SY + BASE;                                    // key surface y at depth 0
  const Ybot = Ykey0 + (D - 1) * u + 6;                       // bottom of the plug / key pins at rest
  const H = Ybot + 32;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pt-svg', role: 'img', 'aria-label': Lb.lock });
  const cx = i => PL + pitch * (i + 0.5);

  const model = () => tumblerModel({ secret, key: st.key, inserted: st.inserted });
  // top of key pin i (px) in the current state
  function stack(i) {
    const len = BASE + secret[i] * u;
    if (pick) {
      const c = st.set[i] ? secret[i] : st.lift[i], b = Ykey0 + c * u;
      return { top: b - len, bottom: b, ok: st.set[i] };
    }
    if (!st.inserted) { const b = Ykey0 + (D - 1) * u; return { top: b - len, bottom: b, ok: false }; }
    const b = Ykey0 + st.key[i] * u, t = b - len;
    return { top: t, bottom: b, ok: st.key[i] === secret[i] };
  }

  function paint() {
    const M = model();
    const turns = pick ? st.set.every(Boolean) : M.turns;
    svg.replaceChildren();
    const okCount = pick ? st.set.filter(Boolean).length : M.matches;
    // housing and plug
    svg.append(s('rect', { x: PL - 12, y: YT - 14, width: PW + 24, height: SY - YT + 14, fill: 'var(--grid, #ddd)', opacity: 0.55, stroke: 'var(--muted)', 'stroke-width': 1.2 }));
    if (show.plug) {
      const plug = s('g', turns ? { transform: `rotate(-14 ${W / 2} ${(SY + Ybot) / 2})` } : {});
      plug.append(s('rect', { x: PL - 12, y: SY, width: PW + 24, height: Ybot - SY, fill: turns ? 'var(--good-soft)' : 'var(--bg, #fff)', stroke: turns ? 'var(--good)' : 'var(--muted)', 'stroke-width': 1.6 }));
      svg.append(plug);
    }
    // chambers: pins
    for (let i = 0; i < N; i++) {
      const x = cx(i), { top, bottom, ok } = stack(i);
      const col = ok ? 'var(--good)' : !pick && st.inserted ? 'var(--bad)' : 'var(--vec)';
      const dTop = top - DL;
      if (show.springs) {
        const y1 = YT, y2 = Math.max(YT + 4, dTop), n = 6, pts = [];
        for (let k = 0; k <= n; k++) pts.push(`${(x + (k % 2 ? 6 : -6)).toFixed(1)},${(y1 + (y2 - y1) * k / n).toFixed(1)}`);
        svg.append(s('polyline', { points: `${x},${y1} ${pts.join(' ')} ${x},${y2}`, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1.6 }));
      }
      svg.append(s('rect', { x: x - pinW / 2, y: dTop, width: pinW, height: DL, fill: 'var(--covec)', opacity: 0.9, stroke: 'var(--bg, #fff)', 'stroke-width': 0.8 }));
      svg.append(s('rect', { x: x - pinW / 2, y: top, width: pinW, height: bottom - top, fill: col, opacity: 0.88, stroke: 'var(--bg, #fff)', 'stroke-width': 0.8 }));
      if (pick && st.tension && !st.set[i] && order.find(j => !st.set[j]) === i)
        svg.append(s('text', { x, y: YT - 18, 'font-size': 9, 'text-anchor': 'middle', fill: 'var(--bad)', 'font-weight': 650 }, Lb.binding));
      if (show.pinLabels) svg.append(s('text', { x, y: YT - 4, 'font-size': 11, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-weight': 650 }, String(i + 1)));
    }
    if (show.shearLine) {
      svg.append(s('line', { x1: PL - 12, x2: PL + PW + 12, y1: SY, y2: SY, stroke: 'var(--basis)', 'stroke-width': 1.8, 'stroke-dasharray': '5 3' }));
    }
    // key
    if (show.key && !pick && st.inserted) {
      const d = [`M${PL - 36},${Ybot + 4}`, `L${PL - 36},${Ykey0 - 4}`, `L${PL - 12},${Ykey0 - 4}`];
      for (let i = 0; i < N; i++) { const yy = Ykey0 + st.key[i] * u; d.push(`L${cx(i) - pitch * 0.36},${yy}`, `L${cx(i) + pitch * 0.36},${yy}`); }
      d.push(`L${PL + PW + 8},${Ykey0 + 2}`, `L${PL + PW + 8},${Ybot + 4}`, 'Z');
      svg.append(s('path', { d: d.join(' '), fill: 'var(--gold, #f5bf3c)', opacity: 0.85, stroke: 'var(--ink)', 'stroke-width': 1.2 }));
    }
    if (show.plug) svg.append(s('text', { x: W / 2, y: Ybot + 22, 'font-size': 11, 'text-anchor': 'middle', fill: turns ? 'var(--good)' : 'var(--muted)', 'font-weight': 650 }, turns ? Lb.plugTurns : Lb.plugStuck));
    if (show.count) svg.append(s('text', { x: PL - 12, y: 12, 'font-size': 11, fill: 'var(--ink)', 'font-weight': 650 }, `${okCount} ${Lb.matchesOf} ${N}`));
    // key cut interaction handles (invisible hit areas)
    if (!pick && st.inserted && cfg.editable !== false) for (let i = 0; i < N; i++) {
      const r = s('rect', { x: cx(i) - pitch / 2, y: Ykey0 - 6, width: pitch, height: Ybot - Ykey0 + 12, fill: 'transparent', class: 'pt-hit', 'data-pin': i, style: 'cursor:ns-resize;touch-action:none' });
      svg.append(r);
    }
    // readouts and bitting
    const val = { matches: `${okCount} ${Lb.matchesOf} ${N}`, turns: turns ? Lb.yes : Lb.no, combinations: String(combinations(D, N)) };
    for (const k of reads) if (rd[k]) rd[k].textContent = val[k] ?? '';
    if (bitRow) bitRow.replaceChildren(...bitCells());
    for (const b of pickBtns) b.textContent = st.tension ? Lb.release : Lb.tension;
    if (insBtn) insBtn.textContent = st.inserted ? Lb.remove : Lb.insert;
  }

  const setCut = (i, v) => { st.key[i] = Math.max(0, Math.min(D - 1, v)); paint(); };
  // drag on the key
  svg.addEventListener('pointerdown', ev => {
    const t = ev.target; if (pick) return;
    if (!t.classList?.contains('pt-hit')) return;
    const i = +t.getAttribute('data-pin');
    svg.setPointerCapture?.(ev.pointerId);
    const move = e => {
      const r = svg.getBoundingClientRect(), y = (e.clientY - r.top) * (H / r.height);
      setCut(i, Math.round((y - Ykey0) / u));
    };
    move(ev);
    const up = () => { svg.removeEventListener('pointermove', move); svg.removeEventListener('pointerup', up); svg.removeEventListener('pointercancel', up); };
    svg.addEventListener('pointermove', move); svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    ev.preventDefault();
  });
  // picking: click a pin to push it up one step
  svg.addEventListener('click', ev => {
    if (!pick) return;
    const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * (W / r.width);
    const i = Math.floor((x - PL) / pitch); if (i < 0 || i >= N || st.set[i]) return;
    st.lift[i] = st.lift[i] > 0 ? st.lift[i] - 1 : D - 1;
    if (st.tension && order.find(j => !st.set[j]) === i && st.lift[i] === secret[i]) st.set[i] = true;
    paint();
  });

  // controls
  const rd = {}, pickBtns = [];
  const names = { matches: Lb.matches, turns: Lb.turns, combinations: Lb.combinations };
  const readEl = h('div', { class: 'pt-reads' }, reads.map(k => h('div', { class: 'pt-cell' }, h('div', { class: 'pt-lab' }, mdInline(names[k] ?? k)), rd[k] = h('div', { class: 'pt-num', role: 'status' }))));
  const bitCells = () => st.key.map((c, i) => h('div', { class: 'pt-bit' },
    show.steppers && cfg.editable !== false && !pick ? h('button', { class: 'btn ghost pt-step', type: 'button', 'aria-label': `${Lb.pinWord} ${i + 1}: ${Lb.less}`, onclick: () => setCut(i, st.key[i] - 1) }, '−') : '',
    h('span', { class: 'pt-digit' }, String(c)),
    show.steppers && cfg.editable !== false && !pick ? h('button', { class: 'btn ghost pt-step', type: 'button', 'aria-label': `${Lb.pinWord} ${i + 1}: ${Lb.more}`, onclick: () => setCut(i, st.key[i] + 1) }, '+') : ''));
  const bitRow = show.bitting && !pick ? h('div', { class: 'pt-bits', 'aria-label': Lb.bitting }) : null;
  const btn = (txt, fn) => h('button', { class: 'btn ghost', type: 'button', onclick: fn }, mdInline(txt));
  const insBtn = show.insertButton && !pick ? btn(Lb.insert, () => { st.inserted = !st.inserted; paint(); }) : null;
  const tBtn = pick ? btn(Lb.tension, () => {
    st.tension = !st.tension;
    if (!st.tension) { st.set.fill(false); }
    paint();
  }) : null;
  if (tBtn) pickBtns.push(tBtn);
  const apply = p => {
    if (p.secret) secret = fit(p.secret, i => dflt[i]);
    if (p.key) st.key = fit(p.key, () => 0);
    if (p.inserted != null) st.inserted = p.inserted;
    paint();
  };
  const initSecret = [...secret];
  const btns = h('div', { class: 'wbtns' }, insBtn ?? '', tBtn ?? '',
    btn(Lb.reset, () => { secret = [...initSecret]; st.key = [...init.key]; st.inserted = init.inserted; st.tension = false; st.lift.fill(D - 1); st.set.fill(false); paint(); }),
    (cfg.presets ?? []).map(pr => btn(pr.label, () => apply(pr))));
  el.append(h('div', { class: 'pt-fig' }, svg), bitRow ?? '', show.readouts && reads.length ? readEl : '', btns);
  paint();
}
