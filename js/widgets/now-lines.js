// now-lines
//
// A plain-language 1+1 Minkowski diagram (c = 1; space across, time up) for
// the relativity of simultaneity. Alice is at rest, Bob moves at speed u; both
// pass through the event O at the origin. Drawn: their worldlines (Alice blue,
// Bob orange), each one's line of "now" through O (Alice's horizontal, Bob's of
// slope u) with the parallel dashed line through E, the light cone of O with
// the "elsewhere" region shaded, a faint dot grid for the whole spacetime (the
// block universe) and a draggable event E = (a, τ). Readout in words and
// numbers: Alice's time of E is t_A = τ, Bob's is t_B = γ(τ − u·a) with
// γ = 1/√(1−u²), each labelled past of / same moment as / future of the
// observer's now; then a verdict (E spacelike from O: the observers may
// disagree on the order of E and O; otherwise all observers agree).
//
// config:
//   u: 0.6 (Bob's speed, 0 to 0.9), E: [3, 1], snap: 0.5, preset: 'rest'|'moving'
//   worldlines: true, nowLines: true, lightCones: true, readout: true,
//   verdict: true, block: false, slider: true, dragE: true,
//   view: { x: -4, y: -3.5, w: 8, h: 7 }
//   presets: ['rest', 'moving', { label, u, E }]   buttons offered

import { h } from '../dom.js';
import { mdInline } from '../render.js';
import { P, fmt, label, line, placeHandle, planeSvg, s } from './plane.js';

export const NL_PRESETS = {
  rest: { label: 'Bob at rest', u: 0, E: [3, 1] },
  moving: { label: 'Bob moving', u: 0.6, E: [3, 1] },
};

const EPS = 1e-9;
const kind = t => (Math.abs(t) < EPS ? 0 : t > 0 ? 1 : -1);
const WORDS = { '-1': 'past of', 0: 'same moment as', 1: 'future of' };

export function nowLines(el, cfg) {
  const sn = cfg.snap ?? 0.5;
  const view = cfg.view ?? { x: -4, y: -3.5, w: 8, h: 7 };
  const base = NL_PRESETS[cfg.preset] ?? {};
  const init = () => ({ u: cfg.u ?? base.u ?? 0.6, E: [...(cfg.E ?? base.E ?? [3, 1])] });
  let st = init();
  const on = k => cfg[k] !== false;
  const { svg, layers: L } = planeSvg(view, 'Spacetime diagram with Alice and Bob through the event O, their lines of now, and an event E',
    ['block', 'region', 'cone', 'nows', 'worldlines', 'marks', 'labels', 'handles']);
  const readout = h('div', { class: 'readout' });
  const slider = h('input', { type: 'range', min: 0, max: 0.9, step: 0.05, 'aria-label': "Bob's speed u" });
  slider.addEventListener('input', () => { st.u = +slider.value; draw(); });
  const uOut = h('span', { class: 'pt-lam' });
  const named = (cfg.presets ?? []).map(p => (typeof p === 'string' ? NL_PRESETS[p] : p)).filter(Boolean);
  const showReset = on('slider') || on('dragE') || named.length > 0;
  const btns = h('div', { class: 'wbtns' },
    showReset ? [h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, 'Reset')] : [],
    named.map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      st = { u: pr.u ?? st.u, E: pr.E ? [...pr.E] : st.E }; draw();
    } }, pr.label)));
  el.append(h('div', { class: 'cc-panels single' }, svg));
  if (on('slider')) el.append(h('label', { class: 'wslider' }, uOut, slider));
  el.append(readout);
  if (showReset) el.append(btns);

  const eh = on('dragE') ? s('circle', { r: 0.2, class: 'w-handle cv-bend', tabindex: 0, 'aria-label': 'the event E' }) : null;
  if (eh) {
    L.handles.append(eh);
    eh.addEventListener('pointerdown', e => {
      e.preventDefault();
      eh.setPointerCapture(e.pointerId);
      const move = ev => {
        const q = svg.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY;
        const m = q.matrixTransform(svg.getScreenCTM().inverse());
        const x = Math.max(view.x + 0.25, Math.min(view.x + view.w - 0.25, m.x));
        const y = Math.max(view.y + 0.25, Math.min(view.y + view.h - 0.25, -m.y));
        st.E = [x, y].map(t => Math.round(t / sn) * sn); draw();
      };
      const up = () => { eh.removeEventListener('pointermove', move); eh.removeEventListener('pointerup', up); eh.removeEventListener('pointercancel', up); };
      eh.addEventListener('pointermove', move); eh.addEventListener('pointerup', up); eh.addEventListener('pointercancel', up);
    });
  }
  const X0 = view.x, X1 = view.x + view.w, Y0 = view.y, Y1 = view.y + view.h;
  const pts = arr => arr.map(q => P(...q).join(',')).join(' ');

  // static layers: block grid, shaded elsewhere, the cone
  if (cfg.block === true)
    for (let a = Math.ceil(X0 / 0.5) * 0.5; a <= X1; a += 0.5)
      for (let t = Math.ceil(Y0 / 0.5) * 0.5; t <= Y1; t += 0.5)
        L.block.append(s('circle', { cx: a, cy: -t, r: 0.035, class: 'nl-dot' }));
  if (on('lightCones')) {
    const W = 20;
    L.region.append(s('polygon', { points: pts([[0, 0], [W, W], [W, -W]]), class: 'nl-else' }));
    L.region.append(s('polygon', { points: pts([[0, 0], [-W, W], [-W, -W]]), class: 'nl-else' }));
    L.cone.append(line([-W, -W], [W, W], 'lc-null'));
    L.cone.append(line([-W, W], [W, -W], 'lc-null'));
    L.labels.append(label([X0 + 0.95, Y1 - 0.45], 'elsewhere', 'lc-word'));
    L.labels.append(label([X1 - 0.95, Y0 + 0.45], 'elsewhere', 'lc-word'));
  }

  function draw() {
    for (const k of ['nows', 'worldlines', 'marks']) L[k].replaceChildren();
    L.labels.querySelectorAll('.nl-dyn').forEach(n => n.remove());
    const dyn = (p, t, c) => { const n = label(p, t, `${c} nl-dyn`); L.labels.append(n); };
    const u = st.u, E = st.E, [a, tau] = E;
    const g = 1 / Math.sqrt(1 - u * u);
    slider.value = u;
    uOut.innerHTML = mdInline(`$u = ${fmt(u)}$`);
    const H = Math.max(view.w, view.h) * 2;

    if (on('nowLines')) {
      // dashed lines through E (E's own "now" for each observer), then the solid ones through O
      L.nows.append(line([-H, tau], [H, tau], 'nl-now nl-alice dashed'));
      L.nows.append(line([-H, tau - u * (a + H)], [H, tau + u * (H - a)], 'nl-now nl-bob dashed'));
      L.nows.append(line([-H, 0], [H, 0], 'nl-now nl-alice'));
      L.nows.append(line([-H, -u * H], [H, u * H], 'nl-now nl-bob'));
      dyn([X0 + 1.0, 0.3], "Alice's now", 'nl-alice-t small');
      const xb = X1 - 1.0;
      dyn([xb, u * xb + 0.3 + 0.25 * u], "Bob's now", 'nl-bob-t small');
    }
    if (on('worldlines')) {
      L.worldlines.append(line([0, -H], [0, H], 'nl-wl nl-alice'));
      L.worldlines.append(line([-u * H, -H], [u * H, H], 'nl-wl nl-bob'));
      const yt = Y1 - 0.35;
      dyn([-0.55, yt], 'Alice', 'nl-alice-t small');
      dyn([Math.max(-u * yt, X0 + 0.6) - 0.6, -yt], 'Bob', 'nl-bob-t small');
    }
    L.marks.append(s('circle', { cx: 0, cy: 0, r: 0.09, class: 'cv-dot' }));
    dyn([-0.3, -0.32], 'O', '');
    L.marks.append(s('circle', { cx: a, cy: -tau, r: 0.1, class: 'nl-e' }));
    dyn([a - 0.34, tau + 0.34], 'E', 'nl-e-t');
    if (eh) placeHandle(eh, E);

    const tA = tau, tB = g * (tau - u * a);
    const kA = kind(tA), kB = kind(tB);
    const rows = [];
    if (on('readout')) {
      rows.push(h('div', { class: 'wide', html: mdInline(`The event $E$ is $${fmt(Math.abs(a))}$ ${a < 0 ? 'to the left of' : a > 0 ? 'to the right of' : 'in line with'} $O$ and $${fmt(Math.abs(tau))}$ ${tau < 0 ? 'earlier' : 'later'} than $O$ on Alice's clock. Bob's speed is $u = ${fmt(u)}$, so $\\gamma = 1/\\sqrt{1-u^2} = ${fmt(g)}$ (the speed of light is 1).`) }));
      rows.push(h('div', { class: 'wide nl-row-a', html: mdInline(`**Alice:** $t_A = \\tau = ${fmt(tA)}$, so $E$ is in the ${WORDS[kA]} her now.`) }));
      rows.push(h('div', { class: 'wide nl-row-b', html: mdInline(`**Bob:** $t_B = \\gamma(\\tau - u\\,a) = ${fmt(g)}\\,(${fmt(tau)} - ${fmt(u)}\\cdot ${a < 0 ? `(${fmt(a)})` : fmt(a)}) = ${fmt(tB)}$, so $E$ is in the ${WORDS[kB]} his now.`) }));
    }
    if (on('verdict')) {
      const spacelike = Math.abs(a) > Math.abs(tau) + EPS, same = Math.abs(a) < EPS && Math.abs(tau) < EPS;
      let txt, cls = 'ok';
      if (same) txt = '**E is O itself:** every observer agrees.';
      else if (spacelike && kA !== kB) { txt = '**Alice and Bob disagree on the order of E and O.** E is too far away to be reached by light from O (it lies in "elsewhere").'; cls = 'warn'; }
      else if (spacelike) { txt = `**E is in "elsewhere": Alice and Bob happen to agree at this speed, but a faster observer would disagree.** Try a larger $u$.`; cls = 'warn'; }
      else txt = `**All observers agree:** E is ${tau > 0 ? 'after' : 'before'} O${Math.abs(Math.abs(a) - Math.abs(tau)) < EPS ? ' (light from O can just reach it)' : ' (light from O can reach it, or the reverse)'}.`;
      rows.push(h('div', { class: `wide ${cls}`, html: mdInline(txt) }));
    }
    readout.replaceChildren(...rows);
  }
  draw();
}
