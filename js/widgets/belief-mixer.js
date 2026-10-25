// belief-mixer
//
// Prior and evidence combine into a belief. Two or three hidden causes (bars).
// Section 1: one slider per cause = how much the reader expects it beforehand
// (prior). Section 2: one slider per cause = how well it explains the
// sensation (evidence). Section 3: bars of the result, prior x evidence,
// normalised to add up to 100%. A switch "noisy / sharp" senses: noisy senses
// flatten the evidence (each value is raised to the power `noisyPower`),
// sharp senses use it as set. All wording comes from the config.
//
//   causes: [{ name, prior, evidence }]   2-3 causes, values in (0, 1]
//   sharp: false                          start with noisy senses (default true)
//   noisyPower: 0.3                       flattening of noisy evidence
//   toggle: false                         hide the noisy/sharp switch
//   labels: { prior, evidence, belief, noisy, sharp, reset }   section titles/buttons
//   presets: [{ label, prior: [..], evidence: [..], sharp }]   buttons
//   markers: true                         show on each evidence slider the value
//                                         actually used after the noisy flattening

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const pct = x => `${Math.round(x * 100)}%`;
const COLORS = ['var(--vec)', 'var(--covec)', 'var(--basis)'];

export function beliefMixer(el, cfg) {
  const causes = (cfg.causes ?? []).slice(0, 3);
  const L = { prior: 'What you expect beforehand', evidence: 'How well each cause explains the sensation',
    belief: 'What you end up believing', noisy: 'Noisy senses', sharp: 'Sharp senses', reset: 'Reset', ...(cfg.labels ?? {}) };
  const nz = cfg.noisyPower ?? 0.3, n = causes.length;
  const init = () => ({ prior: causes.map(c => c.prior ?? 1 / n), evidence: causes.map(c => c.evidence ?? 0.5), sharp: cfg.sharp ?? true });
  let st = init();
  const clamp = v => Math.max(0.02, Math.min(1, v));

  const sliders = { prior: [], evidence: [] }, vals = { prior: [], evidence: [] }, marks = [], bars = [], bvals = [];
  const section = (key, title) => {
    const box = h('div', { class: 'bm-sec' }, h('div', { class: 'bm-title' }, mdInline(title)));
    causes.forEach((c, i) => {
      const inp = h('input', { type: 'range', min: 0.02, max: 1, step: 0.01, 'aria-label': `${title}: ${c.name}`, style: `accent-color:${COLORS[i]}` });
      inp.addEventListener('input', () => { st[key][i] = clamp(+inp.value); draw(); });
      const v = h('span', { class: 'bm-val' });
      sliders[key].push(inp); vals[key].push(v);
      let track = inp;
      if (key === 'evidence' && cfg.markers) {
        const m = h('span', { class: 'bm-mark', style: `background:${COLORS[i]}` });
        marks.push(m); track = h('span', { class: 'bm-track' }, inp, m);
      }
      box.append(h('label', { class: 'bm-row' }, h('span', { class: 'bm-name', style: `color:${COLORS[i]}` }, c.name), track, v));
    });
    return box;
  };
  const beliefBox = h('div', { class: 'bm-sec' }, h('div', { class: 'bm-title' }, mdInline(L.belief)));
  causes.forEach((c, i) => {
    const fill = h('span', { class: 'bm-fill', style: `background:${COLORS[i]}` });
    const v = h('span', { class: 'bm-val' });
    bars.push(fill); bvals.push(v);
    beliefBox.append(h('div', { class: 'bm-row' }, h('span', { class: 'bm-name', style: `color:${COLORS[i]}` }, c.name), h('span', { class: 'bm-bar' }, fill), v));
  });

  const bSharp = h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.sharp = true; draw(); } }, L.sharp);
  const bNoisy = h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.sharp = false; draw(); } }, L.noisy);
  const btns = h('div', { class: 'wbtns' },
    cfg.toggle === false ? '' : [bNoisy, bSharp],
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { st = init(); draw(); } }, L.reset),
    (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
      st = { prior: (pr.prior ?? st.prior).map(clamp), evidence: (pr.evidence ?? st.evidence).map(clamp), sharp: pr.sharp ?? st.sharp }; draw(); } }, pr.label)));
  el.append(section('prior', L.prior), section('evidence', L.evidence), beliefBox, btns);

  function draw() {
    const eff = st.evidence.map(e => (st.sharp ? e : Math.pow(e, nz)));
    const raw = st.prior.map((p, i) => p * eff[i]), tot = raw.reduce((a, b) => a + b, 0);
    causes.forEach((c, i) => {
      sliders.prior[i].value = st.prior[i]; sliders.evidence[i].value = st.evidence[i];
      vals.prior[i].textContent = st.prior[i].toFixed(2); vals.evidence[i].textContent = st.evidence[i].toFixed(2);
      if (marks[i]) marks[i].style.left = `${((eff[i] - 0.02) / 0.98) * 100}%`;
      bars[i].style.width = pct(raw[i] / tot); bvals[i].textContent = pct(raw[i] / tot);
    });
    bSharp.classList.toggle('on', st.sharp); bNoisy.classList.toggle('on', !st.sharp);
    bSharp.setAttribute('aria-pressed', st.sharp); bNoisy.setAttribute('aria-pressed', !st.sharp);
  }
  draw();
}
