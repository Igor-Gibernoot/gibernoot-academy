# `diagonal-list`
Cantor's diagonal construction (`js/widgets/diagonal-list.js`, HTML only, wording from the config). N rows $x_1..x_N$, each a real in (0,1) written as K digits
(K is clamped up to N so each row has a diagonal digit). Each digit is a spinner: click or ArrowUp = +1, Shift+click or ArrowDown = -1 (wraps 0..9), or type a digit.
The diagonal cell (row k, digit k) is highlighted. The number $d$ takes, as digit k, the rule applied to the diagonal digit of row k; the rule never gives 0 or 9, so
$d$ has a unique decimal expansion ($0.0999\ldots = 0.1000\ldots$ cannot interfere). A check column shows whether $d$ differs from row k in digit k, plus a verdict line. Reports nothing to the card.

Config
- `rows` (5, range 2 to 8), `digits` (5, range N to 10), `values: ['31415', ...]` start rows (missing digits or rows get a default pattern), `presets: [{label, values}]` buttons.
- Rule: `preset: add1` (default; add 1 to the diagonal digit, but 8 and 9 give 1, 0 gives 1) or `five` (5 unless the diagonal digit is 5, then 6);
  `rule: [10 digits]` custom map (index = diagonal digit; every value forced into 1..8; overrides `preset`); `ruleText` replaces the automatic rule sentence.
- `editable` (true; false = fixed rows), `displayOnly` (false; true = no spinners, no buttons, everything revealed), `stepReveal` (false; $d$ starts empty and a button reveals one more digit with its check).
- `show` (all default true): `highlight` (gold diagonal cells in rows and $d$), `d` (the row of $d$'s digits), `checks` (check column and verdict), `rule` (rule text), `readout` (the live `d = 0.xxxxx` line), `rowLabels`, `resetButton`.
- `labels: {rule, row, d, check, ok, bad, verdict, next, reset, hidden}` (inline markdown; `row` and `d` are the name stems, default x and d).

Examples
- Default: `{}` (5 rows, add-1 rule). Step by step: `{stepReveal: true, show: {readout: false}}`. Static figure: `{displayOnly: true, values: ['14159','71828','57721','41421','61803'], preset: five}`.
- Only the table and highlight, no construction: `{show: {d: false, checks: false, rule: false, readout: false}}`.
