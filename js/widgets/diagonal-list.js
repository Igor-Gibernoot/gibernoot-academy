// diagonal-list
//
// Cantor's diagonal construction as a hands-on table.  N rows x_1..x_N, each a real in (0,1) written as K decimal digits
// (K >= N, so every row has a diagonal digit).  The diagonal cell (row k, digit k) is highlighted.  The number d is built digit
// by digit from a rule that maps the diagonal digit to a new digit that is never 0 or 9 (so d has a unique decimal expansion:
// 0.0999... = 0.1000... cannot bite).  A check column says whether d differs from row k in digit k.  A live readout shows d.
// Each digit cell is a spinner: click or Enter/ArrowUp = +1, Shift+click or ArrowDown = -1 (wraps 0..9), or type a digit.
// General tool: all wording comes from the config.
//
//   rows: 5, digits: 5                       N (2 to 8) and K (N to 10; clamped up to N)
//   preset: 'add1' | 'five'                  the rule: 'add1' = add 1 to the diagonal digit, but 8 (and 9) -> 1; 0->1;
//                                            'five' = 5 unless the diagonal digit is 5, then 6
//   rule: [10 digits]                        custom rule: rule[x] = new digit for diagonal digit x (each forced into 1..8); overrides preset
//   values: [ '14159', '71828', ... ]        start rows, one string of digits per row (missing digits / rows get a default pattern)
//   presets: [{ label, values }]             buttons that replace the rows
//   editable: true                           digit cells are spinners (false = fixed rows)
//   displayOnly: false                       true = no interaction at all (no spinners, no buttons), everything revealed
//   stepReveal: false                        d starts empty; a button reveals one more digit at a time (digits and checks appear together)
//   show: { highlight, d, checks, rule, readout, rowLabels, resetButton }   all default true
//       highlight = the diagonal cells (rows and d); d = the row of d's digits; checks = the check column (and the verdict line);
//       rule = the rule text above the table; readout = the live "d = 0.xxxxx" text line;
//       rowLabels = the x_1.. names left of the rows; resetButton = the Reset button
//   labels: { rule, row, d, check, ok, bad, verdict, next, reset, hidden }
//       row = name stem (default 'x'); d = name of the diagonal number (default 'd'); check = column title;
//       ok / bad = check marks text; verdict = line when every digit is revealed; rule = text before the rule (or the whole rule text if ruleText given)
//   ruleText: 'custom rule sentence (inline markdown)'   replaces the automatic rule sentence
//
// Pure model exported for script checks.

import { h } from '../dom.js';
import { mdInline } from '../render.js';

export const RULES = {
  add1: [1, 2, 3, 4, 5, 6, 7, 8, 1, 1],
  five: [5, 5, 5, 5, 5, 6, 5, 5, 5, 5],
};
const clampDigit = v => Math.max(1, Math.min(8, Math.round(v)));
export const ruleMap = cfg => (Array.isArray(cfg.rule) && cfg.rule.length === 10 ? cfg.rule.map(clampDigit) : RULES[cfg.preset] ?? RULES.add1);
export function diagonalModel(rows, map, revealed = Infinity) {
  const n = rows.length;
  const d = rows.map((r, k) => map[r[k]]);
  const diff = d.map((v, k) => v !== rows[k][k]);
  return { d, diff, revealed: Math.min(revealed, n), allDiffer: diff.every(Boolean) };
}

const DEF = ['31415926535', '71828182845', '57721566490', '41421356237', '61803398874', '30102999566', '69314718055', '25881940379'];

export function diagonalList(el, cfg) {
  const L = { rule: 'Rule for each digit of', row: 'x', d: 'd', check: 'Differs?', ok: 'differs', bad: 'same', verdict: 'differs from every row in its diagonal digit',
    next: 'Reveal next digit', reset: 'Reset', hidden: '?', ...(cfg.labels ?? {}) };
  const show = { highlight: true, d: true, checks: true, rule: true, readout: true, rowLabels: true, resetButton: true, ...(cfg.show ?? {}) };
  const N = Math.max(2, Math.min(8, Math.round(cfg.rows ?? 5)));
  const K = Math.max(N, Math.min(10, Math.round(cfg.digits ?? 5)));
  const disp = !!cfg.displayOnly;
  const editable = cfg.editable !== false && !disp;
  const step = !!cfg.stepReveal && !disp;
  const map = ruleMap(cfg);
  const toRows = vals => Array.from({ length: N }, (_, i) => Array.from({ length: K }, (_, j) => {
    const c = String(vals?.[i] ?? '')[j]; return c >= '0' && c <= '9' ? +c : +DEF[i % DEF.length][j % 11];
  }));
  let rows = toRows(cfg.values);
  const init = rows.map(r => [...r]);
  let rev = step ? 0 : N;

  const hl = 'var(--gold)', ok = 'var(--good)', bad = 'var(--bad)';
  const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';
  const cellStyle = (diag, flag) => `font:600 1.15rem/1 ${mono};width:2.1rem;height:2.4rem;padding:0;border-radius:8px;text-align:center;` +
    `border:1.5px solid ${diag && show.highlight ? hl : 'var(--line)'};` +
    `background:${diag && show.highlight ? 'color-mix(in srgb, var(--gold) 28%, var(--surface))' : 'var(--surface)'};color:var(--text);` + (flag ?? '');

  const tbl = h('div', { style: 'overflow-x:auto;max-width:100%' });
  const info = h('div', { role: 'status', style: 'margin:.5rem 0;min-height:1.6em' });
  const btns = h('div', { style: 'display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.4rem' });

  const md = (tag, style, src) => h(tag, { style, html: mdInline(src) });
  const ruleSentence = () => {
    if (cfg.ruleText) return cfg.ruleText;
    const pairs = [...Array(10).keys()].map(x => `${x}→${map[x]}`);
    const compact = cfg.preset === 'five' && !Array.isArray(cfg.rule);
    return `${L.rule} $${L.d}$: diagonal digit → new digit (${compact ? '5, except 5→6' : pairs.join(', ')}). It is never 0 or 9.`;
  };

  function setDigit(i, j, v) { rows[i][j] = (v + 10) % 10; draw(); setTimeout(() => { const c = tbl.querySelector(`[data-c="${i}-${j}"]`); c && c.focus(); }, 0); }

  function cell(i, j) {
    const diag = i === j, v = rows[i][j];
    if (!editable) return h('div', { style: cellStyle(diag) + 'display:flex;align-items:center;justify-content:center;' }, String(v));
    return h('button', {
      type: 'button', 'data-c': `${i}-${j}`, role: 'spinbutton', 'aria-valuenow': v, 'aria-valuemin': 0, 'aria-valuemax': 9,
      'aria-label': `${L.row}${i + 1}, digit ${j + 1}`, style: cellStyle(diag, 'cursor:pointer;'),
      onclick: e => setDigit(i, j, v + (e.shiftKey ? -1 : 1)),
      onkeydown: e => {
        if (e.key === 'ArrowUp') { e.preventDefault(); setDigit(i, j, v + 1); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); setDigit(i, j, v - 1); }
        else if (/^[0-9]$/.test(e.key)) { e.preventDefault(); setDigit(i, j, +e.key); }
      },
    }, String(v));
  }

  function draw() {
    const m = diagonalModel(rows, map, rev);
    const shown = disp ? N : rev;
    const gridCols = `${show.rowLabels ? 'auto ' : ''}auto${show.checks ? ' auto' : ''}`;
    const out = [];
    const dig = (nodes) => h('div', { style: 'display:flex;gap:.25rem;align-items:center' }, nodes);
    for (let i = 0; i < N; i++) {
      if (show.rowLabels) out.push(md('div', 'white-space:nowrap', `$${L.row}_{${i + 1}} = 0.$`));
      out.push(dig(rows[i].map((_, j) => cell(i, j))));
      if (show.checks) {
        const vis = i < shown;
        out.push(h('div', { style: `font-weight:600;white-space:nowrap;color:${vis ? (m.diff[i] ? ok : bad) : 'var(--muted)'}` },
          vis ? (m.diff[i] ? `✓ ${L.ok}` : `✗ ${L.bad}`) : '·'));
      }
    }
    if (show.d) {
      if (show.rowLabels) out.push(md('div', 'white-space:nowrap;font-weight:700;border-top:1px solid var(--line);padding-top:.4rem', `$${L.d} = 0.$`));
      out.push(h('div', { style: 'display:flex;gap:.25rem;align-items:center;border-top:1px solid var(--line);padding-top:.4rem' }, Array.from({ length: K }, (_, j) => {
        const known = j < N && j < shown;
        const txt = j >= N ? '' : known ? String(m.d[j]) : L.hidden;
        const diag = j < N;
        return h('div', { style: cellStyle(diag && known, `display:flex;align-items:center;justify-content:center;${known ? 'font-weight:800;' : 'color:var(--muted);'}${j >= N ? 'visibility:hidden;' : ''}`) }, txt);
      })));
      if (show.checks) out.push(h('div', { style: 'border-top:1px solid var(--line);padding-top:.4rem' }));
    }
    const grid = h('div', { style: `display:grid;grid-template-columns:${gridCols};gap:.35rem .7rem;align-items:center;width:max-content;max-width:none` }, out);
    tbl.replaceChildren(grid);

    // readout
    const known = m.d.slice(0, shown).join('') + (shown < N ? L.hidden.repeat(N - shown) : '');
    const parts = [];
    if (show.readout && show.d) parts.push(h('div', { style: `font:700 1.1rem ${mono}` }, `${L.d} = 0.${known}…`));
    if (show.checks && shown >= N) parts.push(md('div', `color:${m.allDiffer ? ok : bad};font-weight:600`, `$${L.d}$ ${m.allDiffer ? L.verdict : '≠ — ' + L.bad}`));
    info.replaceChildren(...parts);
    // buttons
    const b = [];
    if (step && rev < N) b.push(h('button', { class: 'btn', type: 'button', onclick: () => { rev++; draw(); }, html: mdInline(L.next) }));
    if (!disp && show.resetButton) b.push(h('button', { class: 'btn ghost', type: 'button', onclick: () => { rows = init.map(r => [...r]); rev = step ? 0 : N; draw(); }, html: mdInline(L.reset) }));
    for (const p of cfg.presets ?? []) if (!disp) b.push(h('button', { class: 'btn ghost', type: 'button', onclick: () => { rows = toRows(p.values); rev = step ? 0 : N; draw(); }, html: mdInline(p.label ?? 'Preset') }));
    btns.replaceChildren(...b);
  }

  const ruleEl = show.rule ? md('div', 'margin-bottom:.5rem;color:var(--muted)', ruleSentence()) : '';
  el.append(ruleEl, tbl, info, btns);
  draw();
}
