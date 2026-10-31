# `scale-factor`
Schematic cosmic scale factor $a(t)$ (`js/widgets/scale-factor.js`, plain SVG + HTML, all wording from the config):
**the curves are illustrative shapes, not solutions of Einstein's equations**; say so in the card text. $a = 1$ today
(at $t = 0$). A model selector (buttons) switches the past; a cursor on the curve is dragged on the plot, moved with
arrow keys (Shift = 5 steps, Home/End; the plot is focusable) or the slider. Readouts: $a$, temperature $T = T_0/a$,
relative density $\rho/\rho_0 = a^{-3}$ (matter) or $a^{-4}$ (radiation). Large/small numbers print as $m\times10^{e}$.
Models: `bang` ($a\to0$ at `bangTime`, the curve starts there, cursor cannot go earlier), `bounce` (minimum `aMin` at
`bounceTime`, the past continues), `eternal` ($a=e^{\text{rate}\,t}$, $\to0$ only as $t\to-\infty$), `emergent`
($a\to$ `emergentA` $>0$ as $t\to-\infty$).
Config: `models` (list, order = buttons; default `[bang, bounce, eternal]`), `model` (shown first), `tRange` (default
`[-3, 1]`), `bangTime` (-2.4), `bounceTime` (-1.8), `aMin` (0.1), `emergentA` (0.2), `rate` (1), `density: matter |
radiation`, `T0` (2.725), `tempUnit` ('K'), `cursor` (starting $t$, default 0), `breakdown: {a}` (band of $a$ below
which "equations break down"), `unknown: {from, to}` (shaded band of times), `readouts` (`a`, `T`, `rho`, `t`, `model`;
default `[a, T, rho]`, `[]` = none), `show: {curve, cursor, today, axes, axisLabels, selector, slider, ticks,
breakdown, unknown, ghosts, guides, endMarks}` (defaults true for the first seven, false for the rest; `ghosts` = other
models faint and dashed, `guides` = dashed lines cursor to axes, `endMarks` = open circle where the bang curve starts),
`labels: {t, a, today, breakdown, unknown, selector, slider, rowA, rowT, rowRho, rowTime, rowModel, models:{bang,
bounce, eternal, emergent}}`. Reports nothing to the card.
Example: `{models: [bang, bounce, eternal], model: bang, cursor: 0, density: radiation, unknown: {from: -3, to: -2.4},
breakdown: {a: 0.1}, show: {breakdown: true, unknown: true, ghosts: true, endMarks: true}, labels: {t: "time
(schematic)", a: "scale factor a", unknown: "unknown physics", breakdown: "equations break down"}}`.
