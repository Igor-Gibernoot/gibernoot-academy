# `multiverse-counter`
A growing sequence of $M$ bubble universes of two types, A (small, many) and B (large, few), born left (early) to
right (late) (`js/widgets/multiverse-counter.js`, plain SVG + HTML, all wording from the config). A **cut-off slider**
chooses how much of the sequence is counted; a **rule** says how the counted part is measured, and the fraction of A
changes with the rule (with the defaults: about 75% by count, 27% by volume, 43% by time at cut 0.6, seed 2):
- `count`: the first $K$ bubbles, each counts once.
- `volume`: bubbles in birth order until a total volume $V$ is reached; each counts by its volume.
- `time`: all bubbles born before time $T$; each counts by the volume it has at $T$ (type X is full-size after
  `tauX`, volume $\propto\min(1,\text{age}/\tau_X)^3$).
Bubble area shows the volume counted under the rule (equal dots for `count`); counted-out bubbles are faint.
Reports nothing to the card, so graded questions go in separate cards.
Config: `M` (80), `pA` (0.8, chance of A), `volA` (1), `volB` (8), `tauA` (4), `tauB` (25), `seed` (omit for true
random), `rules` (subset of `[count, volume, time]`, in this order; default all), `rule` (starting rule), `cut` (0 to 1,
default 0.5), `interval` (ms per Grow tick, 80), `labels: {A, B, count, volume, time, fraction, nA, nB, cut,
cutCount, cutVolume, cutTime, compare, grow, stop, reset, slider, traceX, traceY, axis, rules, note: {count, volume,
time}}`, `show: {bubbles, excluded, axis, cutline, legend, rules, slider, grow, reset, fraction, counts, cut,
compare, trace, ruleNote}`. Defaults true: bubbles, excluded, cutline, legend, rules, slider, fraction; false for the
rest. `excluded` = counted-out bubbles drawn faint (false: hidden); `axis` = birth-time arrow; `counts` = $n_A$, $n_B$;
`cut` = the cut-off in the current rule's own unit (K, V or T, labels `cutCount`/`cutVolume`/`cutTime`); `compare` = a
readout row of the fraction of A under every offered rule at the current cut; `trace` = plot of the fraction of A
against the cut-off, one line per rule, current rule bold; `ruleNote` = one line `labels.note.<rule>`. The buttons
`rules` show only with 2+ rules. Everything is wording from `labels`; math allowed.
Preset (rule toggle, fraction readout, no extras):
`{seed: 2, cut: 0.6, labels: {A: "type A (small, many)", B: "type B (large, few)", fraction: "fraction of type A"}, show: {}}`
Preset (all three rules side by side, plot, rule note): `{seed: 2, cut: 0.6, labels: {note: {count: "Each bubble counts once.",
volume: "Each bubble counts by its volume.", time: "Each bubble counts by the volume it has at time $T$."}}, show: {compare: true,
trace: true, ruleNote: true, counts: true, cut: true, axis: true, grow: true}}`
Preset (no readout, prediction first; reader judges by eye): `{rules: [count, volume], show: {fraction: false}}`
Preset (single rule, watch the fraction swing as the sequence grows): `{rule: time, rules: [time], M: 200, show: {rules: false,
grow: true, fraction: true, trace: true}}`
