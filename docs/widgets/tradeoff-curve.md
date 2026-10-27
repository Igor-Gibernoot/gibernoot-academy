# `tradeoff-curve`
A design slider moves a marker along a tradeoff curve between two quantities X (horizontal) and Y (vertical)
(`js/widgets/tradeoff-curve.js`, plain SVG + HTML, all wording from the config). Each quantity is
$q(s) = a\,s^k + b$ of the design parameter $s$: linear ($k=1$), power ($k=2,\,0.5,\dots$), inverse ($k=-1$, $b=0$).
Optional "needs" region (requirements `xMin, xMax, yMin, yMax`, any subset) drawn as a green rectangle; the marker
turns green when every need is met.
Config: `param: {label, unit, range, value, step, decimals}` (the slider), `x`/`y: {a, k, b, label, unit, range, decimals}`
(`range` default: extent of the curve, padded), `needs: {xMin, xMax, yMin, yMax}`,
`show: {curve, marker, needs, grid, ticks, axisLabels}` (default true) and `{feasible, guides}` (default false: green part
of the curve meeting all needs; dashed lines from the marker to the axes), `slider: false` (design fixed at `param.value`),
`readouts` (list from `design, x, y, range, verdict`; default `[x, y]`; `range` = the design values meeting every need or
`none`; `verdict` = meets / misses plus what fails), `labels: {meets, misses, none, range, design, tooShortX, tooLongX,
tooShortY, tooLongY}`, `presets: [{label, value}]` (buttons that jump the slider). Reports nothing to the card.

Examples
- Beam, strength against weight (thickness $s$ cm; strength $40s^2$ kN, weight $2s+1$ kg/m), needs strength at least 400 and weight at most 12:
  `{param: {label: Thickness, unit: cm, range: [0.5, 8], value: 2, step: 0.1}, x: {label: Weight, unit: kg/m, a: 2, b: 1, range: [0, 20]}, y: {label: Strength, unit: kN, a: 40, k: 2, range: [0, 2600]}, needs: {yMin: 400, xMax: 12}, show: {guides: true}, readouts: [design, x, y, verdict]}`
  (feasible thickness about 3.2 to 5.5 cm; add `feasible: true`, `range` to reveal it).
- Gear ratio, speed against pulling force ($s$ = ratio; speed $2s$ m/s, force $100/s$ N): `{param: {label: Gear ratio, range: [0.5, 5], value: 1, step: 0.1}, x: {label: Speed, unit: m/s, a: 2, range: [0, 11]}, y: {label: Pull force, unit: N, a: 100, k: -1, range: [0, 220]}, needs: {xMin: 4, yMin: 60}, readouts: [x, y, verdict]}` (infeasible: speed 4 needs $s\ge2$, force 60 needs $s\le1.67$).
