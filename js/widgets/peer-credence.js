// peer-credence
//
// Two peers A and B hold credences (degrees of belief) in a proposition. A rule says how each
// should revise after learning the other's credence: stand firm (keep your own), split the
// difference (both move to the average), or a weighted view (each gives the other peer weight r).
// Rows show each peer's start credence (tick) and updated credence (bar). Optional shared-evidence
// mode: if the two credences came from independent evidence on top of a common prior, the pooled
// odds are odds_A x odds_B / prior odds (the evidence adds, it is not averaged).
// Plain HTML; all wording from the config; the widget only displays (it reports nothing to the card).
//
//   peers: ["A", "B"]            names of the two peers (markdown inline ok)
//   a: 0.8, b: 0.4               start credences (0 to 1)
//   rule: "split"                start rule: "firm" | "split" | "weighted"
//   rules: ["firm","split","weighted"]   rules offered in the toggle (subset; one rule = fixed rule)
//   r: 0.3                       start weight on the other peer (weighted rule), 0 to 0.5
//   rMax: 0.5                    top of the r slider (1 allows deference)
//   prior: 0.5                   common prior of the evidence mode (0 to 1, exclusive)
//   evidence: false              show the pooled-evidence row and readout
//   evidenceToggle: false        true = a button shows/hides the evidence mode (evidence = start state)
//   priorSlider: false           slider for the common prior (evidence mode)
//   peerSliders: true            sliders for the two start credences
//   ruleToggle: true             the rule buttons
//   rSlider: true                the r slider (shown only while the rule is "weighted")
//   rows: true                   the credence rows (false = readout only)
//   bars: true                   the bars inside the rows (false = numbers only)
//   ticks: true                  the start-credence ticks on the updated bars
//   rowLabels: true              peer names at the left of the rows
//   pooledRow: true              the pooled row (evidence mode)
//   readout: true                or {updated, gap, moved, pooled} each true/false
//   reset: true                  the Reset button
//   labels: {rule, firm, split, weighted, r, prior, start, updated, pooled, gap, moved, pooled_odds,
//            slider, evidence_on, evidence_off, reset}
//   presets: [{label, a, b, r, rule, prior}]   buttons (omitted fields keep the current value)

import { h } from '../dom.js';
import { mdInline } from '../render.js';

const M = src => h('span', { html: mdInline(src) });
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pct = p => `${parseFloat((p * 100).toPrecision(3))}%`;
const num = (v, d) => { const x = Number(v); return Number.isFinite(x) ? x : d; };
const EPS = 1e-6;

export function peerCredence(el, cfg) {
  const L = {
    rule: 'Rule', firm: 'Stand firm', split: 'Split the difference', weighted: 'Weighted',
    r: 'Weight on the other peer r', prior: 'Common prior', start: 'start', updated: 'after the rule',
    pooled: 'Pooled evidence', gap: 'Gap between the peers', moved: '{peer} moves by',
    pooled_odds: 'Pooled odds', slider: 'Start credence of {peer}',
    evidence_on: 'Show shared evidence', evidence_off: 'Hide shared evidence', reset: 'Reset',
    ...(cfg.labels ?? {}),
  };
  const on = (k, d = true) => (cfg[k] === undefined ? d : cfg[k] !== false);
  const peers = (cfg.peers ?? ['Peer A', 'Peer B']).slice(0, 2);
  const allRules = ['firm', 'split', 'weighted'];
  const rules = (cfg.rules ?? allRules).filter(x => allRules.includes(x));
  if (!rules.length) rules.push('split');
  const rMax = clamp(num(cfg.rMax, 0.5), 0.05, 1);
  const ro = typeof cfg.readout === 'object' ? cfg.readout : (cfg.readout === false ? {} : { updated: true, gap: true, moved: false, pooled: true });
  const st0 = () => ({
    a: clamp(num(cfg.a, 0.8), 0, 1), b: clamp(num(cfg.b, 0.4), 0, 1),
    rule: rules.includes(cfg.rule) ? cfg.rule : rules[0],
    r: clamp(num(cfg.r, 0.3), 0, rMax), prior: clamp(num(cfg.prior, 0.5), 0.01, 0.99),
    ev: cfg.evidence === true,
  });
  let s = st0();

  const wOther = () => (s.rule === 'firm' ? 0 : s.rule === 'split' ? 0.5 : s.r);
  const update = () => { const w = wOther(); return [(1 - w) * s.a + w * s.b, (1 - w) * s.b + w * s.a]; };
  const odds = p => p / (1 - p);
  const pool = () => {
    const a = clamp(s.a, EPS, 1 - EPS), b = clamp(s.b, EPS, 1 - EPS);
    const o = odds(a) * odds(b) / odds(s.prior);
    return { o, p: o / (1 + o) };
  };
  const fmtOdds = o => (o >= 1e4 || o < 1e-3 ? o.toExponential(1).replace('e+', '×10^').replace('e-', '×10^-').replace(/\^(-?)(\d+)/, (_, m, d) => (m ? '⁻' : '') + [...d].map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('')) : String(parseFloat(o.toPrecision(3))));

  // ----- rows -----
  const rowsBox = h('div', { class: 'pc-rows' });
  const mkRow = (cls, label) => {
    const fill = h('div', { class: 'pc-fill' }), tick = h('div', { class: 'pc-tick' });
    const track = h('div', { class: 'pc-track' }, fill, tick);
    if (!on('bars')) track.hidden = true;
    const val = h('span', { class: 'pc-val' });
    const name = h('span', { class: 'pc-name' });
    const row = h('div', { class: `pc-row ${cls}${on('rowLabels') ? '' : ' pc-nolab'}` }, on('rowLabels') ? name : null, track, val);
    return { row, fill, tick, val, name, label };
  };
  const rA = mkRow('pc-a'), rB = mkRow('pc-b'), rP = mkRow('pc-p');
  if (on('rows')) rowsBox.append(rA.row, rB.row);
  if (on('rows') && on('pooledRow')) rowsBox.append(rP.row);
  const axis = on('rows') && on('bars') ? h('div', { class: 'pc-axis' }, h('span', {}, '0'), h('span', {}, '1')) : null;

  // ----- controls -----
  const ctl = h('div', { class: 'pc-ctl' });
  const slider = (label, min, max, step, get, set) => {
    const inp = h('input', { type: 'range', min, max, step });
    const val = h('span', { class: 'pc-sval' }), name = h('span', { class: 'pc-sname' });
    inp.addEventListener('input', () => { set(+inp.value); draw(); });
    const row = h('label', { class: 'pc-srow' }, name, inp, val);
    return { row, inp, val, name, label, get };
  };
  const sls = [];
  if (on('peerSliders')) {
    sls.push(slider(0, 0, 1, 0.01, () => s.a, v => { s.a = v; }));
    sls[0].tpl = i => L.slider.replace('{peer}', peers[0]);
    sls.push(slider(0, 0, 1, 0.01, () => s.b, v => { s.b = v; }));
    sls[1].tpl = i => L.slider.replace('{peer}', peers[1]);
  }
  const rS = on('rSlider') && rules.includes('weighted') ? slider(0, 0, rMax, 0.01, () => s.r, v => { s.r = v; }) : null;
  if (rS) { rS.tpl = () => L.r; rS.weighted = true; sls.push(rS); }
  const pS = on('priorSlider', false) ? slider(0, 0.01, 0.99, 0.01, () => s.prior, v => { s.prior = v; }) : null;
  if (pS) { pS.tpl = () => L.prior; pS.evid = true; sls.push(pS); }
  sls.forEach(x => ctl.append(x.row));

  const ruleBtns = on('ruleToggle') && rules.length > 1 ? rules.map(k => h('button', { class: 'btn ghost pc-rule', type: 'button', onclick: () => { s.rule = k; draw(); } }, L[k])) : [];
  const ruleBar = ruleBtns.length ? h('div', { class: 'wbtns pc-rules', role: 'group', 'aria-label': L.rule }, ...ruleBtns) : null;
  const evBtn = on('evidenceToggle', false) ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { s.ev = !s.ev; draw(); } }) : null;

  // ----- readout -----
  const out = h('div', { class: 'pc-out' });
  const oUpd = h('div', { class: 'pc-line strong' }), oGap = h('div', { class: 'pc-line' });
  const oMov = h('div', { class: 'pc-line' }), oPool = h('div', { class: 'pc-line' });
  if (ro.updated) out.append(oUpd);
  if (ro.gap) out.append(oGap);
  if (ro.moved) out.append(oMov);
  if (ro.pooled) out.append(oPool);

  const presetBtns = (cfg.presets ?? []).map(pr => h('button', { class: 'btn ghost', type: 'button', onclick: () => {
    if (pr.a != null) s.a = clamp(num(pr.a, s.a), 0, 1);
    if (pr.b != null) s.b = clamp(num(pr.b, s.b), 0, 1);
    if (pr.r != null) s.r = clamp(num(pr.r, s.r), 0, rMax);
    if (pr.prior != null) s.prior = clamp(num(pr.prior, s.prior), 0.01, 0.99);
    if (rules.includes(pr.rule)) s.rule = pr.rule;
    draw(); } }, pr.label));
  const resetBtn = on('reset') ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { s = st0(); draw(); } }, L.reset) : null;
  const bar = h('div', { class: 'wbtns' }, evBtn, ...presetBtns, resetBtn);

  if (ruleBar) el.append(ruleBar);
  if (rowsBox.children.length) el.append(h('div', { class: 'pc-wrap' }, rowsBox, axis));
  if (sls.length) el.append(ctl);
  if (out.children.length) el.append(out);
  if (bar.children.length) el.append(bar);

  const setRow = (r, name, p, p0, label) => {
    r.name.replaceChildren(M(name));
    r.fill.style.width = `${p * 100}%`;
    r.val.textContent = pct(p);
    if (p0 == null || !on('ticks')) r.tick.hidden = true;
    else { r.tick.hidden = false; r.tick.style.left = `${p0 * 100}%`; r.tick.title = `${L.start}: ${pct(p0)}`; }
    r.row.setAttribute('aria-label', `${name}: ${pct(p)}`);
  };

  function draw() {
    const [ua, ub] = update();
    ruleBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(rules[i] === s.rule)));
    for (const x of sls) {
      x.name.replaceChildren(M(x.tpl()));
      x.inp.value = x.get(); x.val.textContent = x.weighted || x.evid ? String(parseFloat(x.get().toFixed(2))) : pct(x.get());
      x.row.hidden = (x.weighted && s.rule !== 'weighted') || (x.evid && !s.ev);
    }
    rP.row.hidden = !s.ev;
    setRow(rA, peers[0], ua, s.a); setRow(rB, peers[1], ub, s.b);
    const pl = pool();
    setRow(rP, L.pooled, pl.p, null);
    if (evBtn) evBtn.textContent = s.ev ? L.evidence_off : L.evidence_on;
    if (ro.updated) oUpd.replaceChildren(M(`${peers[0]}: ${pct(s.a)} → **${pct(ua)}**; ${peers[1]}: ${pct(s.b)} → **${pct(ub)}**`));
    if (ro.gap) oGap.replaceChildren(M(`${L.gap}: ${pct(Math.abs(s.a - s.b))} → ${pct(Math.abs(ua - ub))}`));
    if (ro.moved) oMov.replaceChildren(M(`${L.moved.replace('{peer}', peers[0])} ${pct(Math.abs(ua - s.a))}; ${L.moved.replace('{peer}', peers[1])} ${pct(Math.abs(ub - s.b))}`));
    oPool.hidden = !s.ev;
    if (ro.pooled) oPool.replaceChildren(M(`${L.pooled_odds}: ${fmtOdds(pl.o)} (${pct(pl.p)})`));
  }
  draw();
}
