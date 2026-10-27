# `factor-graph`
A factor graph (`js/widgets/factor-graph.js`, SVG + HTML labels; all wording and maths from the config). Round nodes =
random variables (grey-shaded when observed), square nodes = factors (probability tables) joined by lines to the variables
they involve. **Click a variable**: it gets a thick ring, the factors touching it turn blue (the ones it must read to update
its belief: its Markov blanket in factor form, i.e. parents via the prior/transition factors, children, co-parents of its
children), the other variables on those factors get a dashed blue ring, and a readout lists the factors, the variables it
talks to, and the formula `messageFormula` with `{terms}` = each factor's `term` joined by `join`. **Show messages**
(button, visible once a variable is selected) draws an orange arrow from each of those factors to the variable. **Click a
factor**: lists the variables it connects. Click again to deselect. `observable: true` adds one chip per variable to
toggle observed / free. `el.dataset`: `selected`, `selectedFactor`, `reads` (factor ids), `observed`.
Config: `variables: [{id, label, pos:[x,y], observed, rep}]` (`label` KaTeX source), `factors: [{id, label, pos, vars:[ids],
term, rep}]` (`term` = KaTeX contribution of that factor to a message, `{v}` = the variable's label; default the label; keep
factor labels short, 1-4 characters fit the square, e.g. `A`, `P(x)`), `messageFormula` (KaTeX, `{v}`, `{terms}`), `join`
(default `' + '`), positions in a 400x230 box (`box: [W, H]`; with `unroll` the width grows by `dx*(n-1)`), `unroll: n`,
`dx` (default 110), `t0`: every item with `rep: true` is repeated n times, shifted by `dx`; in its id/label/term `{t}`,
`{t-1}`, `{t+1}` = copy index (+ `t0`); in a factor's `vars` `'s@0'` = same copy, `'s@-1'` = previous copy (instance skipped
when it does not exist), plain `'x'` = a non-repeated variable, and in a non-rep factor `'s@0'` = absolute copy 0.
`observable`, `messages` (start showing), `select` (start with a variable selected), `labels: {reads, blanket, none, show,
hide, observe, observed, free, connects, hint, reset, variable, factor}`, `presets: [{label, variables, factors,
messageFormula, unroll, dx, join, box, select, observable}]` (buttons switch the whole graph; a preset overrides the
top-level key of the same name).
Example (two diseases): `variables: [{id: x, label: x, pos: [70,40]}, {id: z, label: z, pos: [70,190]}, {id: y, label: y,
pos: [300,115], observed: true}]`, `factors: [{id: A, label: 'P(x)', pos: [20,40], vars: [x]}, {id: B, label: 'P(z)', pos:
[20,190], vars: [z]}, {id: L, label: 'L', pos: [185,115], vars: [x,z,y], term: '\ln P(y\mid x,z)'}]`. Unrolled
chain: `unroll: 3`, `variables: [{id: s, label: 's_{t}', pos: [60,120], rep: true}]`, `factors: [{id: B, label: B, pos: [120,120],
vars: ['s@-1','s@0'], rep: true}]`.
