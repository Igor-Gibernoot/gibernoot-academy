# `cellular-automaton`
A grid of live/dead cells evolving by a Birth/Survival rule (`js/widgets/cellular-automaton.js`, plain SVG + HTML,
all wording from the config). A dead cell is born if its number of live neighbours (of 8) is in B; a live cell
survives if it is in S. Default Conway's Life, `B3/S23`. Live cells use the accent colour. The widget displays and
probes only; it reports nothing to the card.
Config: `width`, `height` (default 10), `rule` (`"B3/S23"`), `wrap` (torus, default false: outside is dead),
`preset` (`glider` default, `blinker`, `block`, `empty`, `random`), `at: [col,row]` (preset corner, default
`[1,1]`; row 0 on top; the glider moves down-right), `cells: [[x,y],...]` (explicit live cells, replaces the
preset), `seed`, `density` (for `random`), `buttons` (subset of `[step, play, reset]`, `[]` = none), `speed`
(ms per generation), `editable: true` (click or drag toggles cells; editing restarts the generation count),
`grid` (cell borders), `generation`, `count` (live-cell counter), `ruleReadout: true`, `inspect: [x,y]` (purple
outline on that cell, orange outline on its 8 neighbours, its live-neighbour count written inside),
`inspectLabel: false` (outlines without the number), `pick: true` (a click moves the inspected cell),
`trace: true` (gold path of the mean position of the live cells, one point per generation), `traceDots: false`,
`labels: {step, play, pause, reset, generation, count, rule, neighbours}`. Reset returns to the preset,
discarding edits.
Example (glider, step and reset only, generation counter): `{width: 10, height: 10, preset: glider,
buttons: [step, reset], count: false}`. Neighbour count: `{width: 5, height: 5, cells: [[1,1],[2,1],[2,2]],
inspect: [2,2], buttons: [], count: false, generation: false}`.
