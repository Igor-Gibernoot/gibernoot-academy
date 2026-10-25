// homeostat
//
// A creature's body value (default: temperature) drifts toward the room value
// every time a lever is used. A slider sets the creature's expectation
// (target). Two levers: "belief" moves the expectation toward the sensed
// value (changing its mind); "act" moves the body value toward the expectation
// (changing the world). Readouts: sensed value, expectation, mismatch bar,
// "in safe band" indicator. All wording comes from the config.
//
//   range: [0, 50]            axis of the scale (and slider)
//   band: [35, 39]            safe band of the body value
//   room: 20                  value the body drifts toward
//   body: 30, expect: 37      starting body value and expectation
//   drift: 0.08               fraction of the gap to the room lost per step
//   beliefRate: 0.5, actRate: 0.8   fraction of the gap closed by each lever
//   unit: "°C", step: 0.5, decimals: 1
//   labels: { body, sensed, expect, room, mismatch, slider, inBand, outBand,
//             belief, act, wait, reset, steps }    wait: omit/'' = no wait button
//   showBelief: false         hide expectation marker/readout/slider, mismatch bar (the
//                             expect value stays as a hidden set-point that 'act' pulls toward)
//   levers: ['wait','act']    which buttons, in order (default: belief, act, wait if labelled)
//   presets: [{ label, body, expect, room, script: ['belief'|'act'|'wait', ..] }]
//             a preset sets the state and plays its script, one step per 0.7 s

import { h } from '../dom.js';
import { mdInline } from '../render.js';

export function homeostat(el, cfg) {
  const [lo, hi] = cfg.range ?? [0, 50], [bl, bh] = cfg.band ?? [35, 39];
  const unit = cfg.unit ?? '°C', dec = cfg.decimals ?? 1, span = hi - lo;
  const drift = cfg.drift ?? 0.08, bRate = cfg.beliefRate ?? 0.5, aRate = cfg.actRate ?? 0.8;
  const L = { body: 'Body', sensed: 'Sensed', expect: 'Expectation', room: 'Room', mismatch: 'Mismatch',
    slider: 'Set the expectation', inBand: 'In the safe band', outBand: 'Outside the safe band',
    belief: 'Change belief', act: 'Act', wait: '', reset: 'Reset', steps: 'Steps', ...(cfg.labels ?? {}) };
  const showB = cfg.showBelief !== false;
  const levers = cfg.levers ?? ['belief', 'act', ...(L.wait ? ['wait'] : [])];
  const init = () => ({ body: cfg.body ?? 30, expect: cfg.expect ?? 37, room: cfg.room ?? 20, n: 0 });
  let st = init(), timer = null;
  const cl = v => Math.max(lo, Math.min(hi, v));
  const pos = v => `${((cl(v) - lo) / span) * 100}%`;
  const f = v => `${v.toFixed(dec)} ${unit}`;

  const slider = h('input', { type: 'range', min: lo, max: hi, step: cfg.step ?? 0.5, 'aria-label': L.slider });
  slider.addEventListener('input', () => { stop(); st.expect = +slider.value; draw(); });
  const mark = (cls, label) => h('span', { class: `hs-mark ${cls}`, title: label });
  const zone = h('span', { class: 'hs-zone' }), mBody = mark('body', L.body), mExp = showB ? mark('exp', L.expect) : h('span'), mRoom = mark('room', L.room);
  const scale = h('div', { class: 'hs-scale' }, zone, mRoom, mExp, mBody);
  const legend = h('div', { class: 'hs-legend' },
    h('span', { class: 'hs-key body' }, mdInline(L.body)), showB ? h('span', { class: 'hs-key exp' }, mdInline(L.expect)) : '',
    h('span', { class: 'hs-key room' }, mdInline(L.room)), h('span', { class: 'hs-key zone' }, mdInline(cfg.bandLabel ?? `${bl}–${bh} ${unit}`)));
  const rd = {};
  const cell = (k, label) => h('div', { class: 'hs-cell' }, h('div', { class: 'hs-lab' }, mdInline(label)), rd[k] = h('div', { class: 'hs-num' }));
  const readouts = h('div', { class: 'hs-reads' }, cell('sensed', L.sensed), ...(showB ? [cell('exp', L.expect)] : []), cell('room', L.room));
  const fill = h('span', { class: 'hs-fill' });
  const mm = h('div', { class: 'hs-mm' }, h('span', { class: 'hs-lab' }, mdInline(L.mismatch)), h('span', { class: 'hs-bar' }, fill), rd.mm = h('span', { class: 'hs-num' }));
  const flag = h('div', { class: 'hs-flag', role: 'status' });
  const steps = h('span', { class: 'hs-steps' });

  const step = kind => {
    if (kind === 'belief') st.expect += bRate * (st.body - st.expect);
    else if (kind === 'act') st.body += aRate * (st.expect - st.body);
    st.body += drift * (st.room - st.body); st.n++;
    st.expect = cl(st.expect); st.body = cl(st.body); draw();
  };
  const stop = () => { if (timer) { clearTimeout(timer); timer = null; } };
  const btn = (txt, fn, cls = '') => h('button', { class: `btn ghost ${cls}`, type: 'button', onclick: () => { stop(); fn(); } }, mdInline(txt));
  const lv = { belief: () => btn(L.belief, () => step('belief'), 'hs-belief'), act: () => btn(L.act, () => step('act'), 'hs-act'),
    wait: () => btn(L.wait || 'Wait', () => step('wait')) };
  const btns = h('div', { class: 'wbtns' },
    levers.map(k => lv[k]?.() ?? ''), btn(L.reset, () => { st = init(); draw(); }),
    (cfg.presets ?? []).map(pr => btn(pr.label, () => {
      st = { body: pr.body ?? st.body, expect: pr.expect ?? st.expect, room: pr.room ?? st.room, n: 0 }; draw();
      const run = (s, i) => { if (i >= s.length) return; timer = setTimeout(() => { step(s[i]); run(s, i + 1); }, 700); };
      run(pr.script ?? [], 0);
    })));
  el.append(h('div', { class: 'hs-sec' }, scale, legend), readouts, showB ? mm : '', flag,
    showB ? h('label', { class: 'hs-slide' }, h('span', { class: 'hs-lab' }, mdInline(L.slider)), slider) : '', btns, h('div', { class: 'hs-foot' }, steps));

  function draw() {
    zone.style.left = pos(bl); zone.style.width = `${((bh - bl) / span) * 100}%`;
    mBody.style.left = pos(st.body); if (showB) mExp.style.left = pos(st.expect); mRoom.style.left = pos(st.room);
    slider.value = st.expect;
    rd.sensed.textContent = f(st.body); if (showB) rd.exp.textContent = f(st.expect); rd.room.textContent = f(st.room);
    const gap = Math.abs(st.expect - st.body);
    if (showB) { fill.style.width = `${Math.min(1, gap / span) * 100}%`; rd.mm.textContent = f(gap); }
    const ok = st.body >= bl && st.body <= bh;
    flag.textContent = ok ? L.inBand : L.outBand; flag.className = `hs-flag ${ok ? 'ok' : 'bad'}`;
    steps.textContent = `${L.steps}: ${st.n}`;
  }
  draw();
}
