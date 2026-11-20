# `decision-matrix`
A decision under uncertainty (`js/widgets/decision-matrix.js`, plain HTML, all wording from the config): 2 to 4
**actions** (rows) by 2 to 4 **states** (columns), a payoff in every cell, a probability for every state, the
**expected value** (EV) of every row, the best row(s) highlighted. Display only; it reports nothing to the card.

**Payoffs** are typed (text field) or fixed (`payoffEdit: false`). A value may be a number, `Infinity` (YAML `.inf`)
or the strings `"inf"`, `"+inf"`, `"∞"`, `"-inf"`; typed, the same words work. A small **∞** button under each field
switches that payoff to +∞ and back to its last finite value (`infToggle: false` hides it).

**Probabilities.** With two visible states, one slider sets P(state 1) and state 2 gets the rest. With more visible
states (3 or 4, or after the extra columns are shown), each state has a weight slider and the probabilities are the
weights divided by their sum (shown in the probability row). `probMode: "log"` makes the sliders log scales
(powers of ten down to `probMin`, default $-9$), with the bottom stop meaning exactly 0.

**EV rule.** $\text{EV} = \sum_j p_j x_j$, with the convention $0 \times \infty = 0$: a state with probability above 0
and payoff $+\infty$ makes the EV $+\infty$; probability 0 contributes 0; $+\infty$ and $-\infty$ together give
"undefined". Rows with EV $+\infty$ tie, and the readout says the EV cannot rank them. **Notes** (shown only when
they apply) explain the infinite case, the $0 \times \infty$ convention and the undefined case.

**Many gods.** `extraStates: [{label, prob, payoffs: [one per row]}]` adds up to 2 columns. With `extraToggle: true`
a button shows or hides them (`extraShown` = start state); otherwise they are always shown. Their weights share the
probability with the base states.

**Threshold readout** (`threshold: true` or `{state, row, versus}`, indices from 0; defaults 0, 0, 1): the probability
of `state` at which row `row` starts to beat row `versus`, the other visible states keeping their mutual proportions
(so with two states it is the usual crossing point $p^* = d_b/(d_b - d_a)$). Says "above", "below", "at every
probability", "never", or, with infinite payoffs, "at every probability above 0" or "below 1".

Config (all optional): `actions`, `states`, `payoffs` (rows x states), `probs` (start weights), `extraStates`,
`extraToggle`, `extraShown`, `probMode`, `probMin`, `payoffEdit`, `infToggle`; hide with `probSlider: false`
(probabilities fixed at their start), `probRow`, `ev`, `highlight`, `rowLabels`, `colLabels`, `reset: false`,
`readout: false` or `readout: {best, threshold, notes}` (each true/false); `labels: {corner, prob_row, ev, p_slider,
best, tie, none, thr_above, thr_below, thr_always, thr_never, thr_pos, thr_lt1, thr_tie, note_inf, note_zero,
note_undef, extra_on, extra_off, reset, inf_btn}` (templates take `{row}`, `{vs}`, `{state}`, `{p}`);
`presets: [{label, payoffs, prob, probs, gods}]` (buttons; `prob` = probability of state 1 in the two-state view,
`probs` = all weights, `gods` = show the extras; omitted fields keep the current value). YAML numbers keep a dot
(`1.0e-6`). The widget has no built-in theory: a card's text names what the rows and states mean.

Smoke presets (mounted by `node tools/widget-smoke.mjs`):

```smoke
actions: ["Act", "Refrain"]
states: ["State A", "State B"]
payoffs: [[10, -2], [0, 1]]
probs: [0.5, 0.5]
threshold: true
presets:
  - {label: "Likely A", prob: 0.9}
```

```smoke
actions: ["Act", "Refrain"]
states: ["State A", "State B"]
payoffs: [[.inf, -2], [0, 1]]
probMode: log
probs: [1.0e-6, 0.999999]
threshold: {state: 0, row: 0, versus: 1}
presets:
  - {label: "P = 0", prob: 0}
  - {label: "Both infinite", payoffs: [[.inf, -2], [.inf, 1]]}
```

```smoke
actions: ["A", "B", "C"]
states: ["S1", "S2", "S3"]
payoffs: [[5, 0, -1], [1, 1, 1], [0, 4, 2]]
probs: [0.5, 0.3, 0.2]
extraStates:
  - {label: "S4", prob: 0.1, payoffs: [-.inf, 2, 3]}
  - {label: "S5", prob: 0.1, payoffs: [1, .inf, 0]}
extraToggle: true
threshold: {state: 1, row: 2, versus: 1}
presets:
  - {label: "All shown", gods: true}
```
