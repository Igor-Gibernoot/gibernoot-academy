# `curl-loop`
A small rectangle in a 2D force field with the work of each edge, the circulation and `curl x area` (`js/widgets/curl-loop.js`, plain SVG + HTML, all wording from
the config; reuses the `fs-*` readout and slider styles). The loop runs counter-clockwise from the draggable lower-left corner: bottom edge left to right, right edge up,
top edge right to left, left edge down; `W = integral F . dr` per edge (midpoint rule, 200 steps), circulation = their sum, curl `= dFy/dx - dFx/dy` by central
differences, so any field type works. Shows that the circulation and `curl x area` agree more and more as the loop shrinks (ratio readout, size sliders, shrink
animation). Does not report to the card. Checked first: `potential-gradient` (loop shows only the circulation, no edge works or curl) and `work-path` (roads, no loop), so neither could be adapted.
Fields: `swirl` `F = k(-(y-cy), x-cx)` curl `2k`; `shear` `F = (k y, 0)` curl `-k`; `spring` `F = -k(r-c)` curl 0; `central` softened `F = -k(r-c)/rho^3`,
`rho^2 = |r-c|^2 + eps^2` (`eps` 0.15) curl 0; `push` (alias `uniform`) `F = (fx, fy)` curl 0; `bend` `F = (0, k(x-cx)^2)` curl `2k(x-cx)`, not constant, so
circulation / (curl x area) tends to 1 only as the loop shrinks (swirl and shear are linear: the ratio is 1 at every size).
Curl is evaluated at the draggable corner (`curlAt: corner`, as in the small-rectangle proof) or at the centre (`curlAt: center`).
Script check (corner (-0.4, -0.3), height 0.7 x width, sizes 1, 0.1, 0.01): swirl `k = 0.7` circulation/area 1.400000 = curl; shear `k = 1.3` -1.300000; spring
`k = 1.5` 0 (1e-8); central `k = 1` 2e-5 at size 1, 1e-6 at 0.1; push 0; sum of the four edges equals the circulation exactly. `bend` `k = 1`, corner (0.4, -0.3):
ratio circulation / (curl x area) = `1 + w/(2x)` (2.25 at w = 1, 1.125 at 0.1, 1.0125 at 0.01), tending to 1.
Config: `fields: [{label, type, ...}]` (two or more give switch buttons), `view`, `corner`, `size: {w, h}`, `scale`, `curlAt`, `strength`,
`sliders: [width, height, size, strength]`, `ranges`, `units: {work, length, force}`, `duration` ms and `minScale` (shrink), `nField: [9, 6]`, `decimals: 3`, `barMax`,
`show: {field, loop, corner, edgeArrows, edgeLabels, bars, readouts, fieldButtons, shrink, labels}` (all true),
`readouts: [edges, circ, curl, curlArea, ratio]` (also `terms` for the two partial derivatives, `perArea`, `size`), `bars: [edges, circ, curlArea]` (any subset),
`labels: {bottom, right, top, left, circ, curl, curlArea, ratio, perArea, terms, size, width, height, scale, strength, shrink, reset, bothZero, dFydx, dFxdy, area, picture}`,
`barLabels` (shorter names for the bar rows). The ratio shows the word in `labels.bothZero` when circulation and curl x area are both zero.
Note: avoid glyphs the pixel font draws badly (a circulation integral sign) in labels; use words.

Example: `{fields: [{label: Swirl, type: swirl, k: 1}, {label: Bend, type: bend, k: 1}], corner: [0.3, -0.3], sliders: [size], readouts: [circ, curlArea, ratio]}`.

```smoke
fields:
  - {label: Swirl, type: swirl, k: 1}
  - {label: Shear, type: shear, k: 1}
  - {label: Spring, type: spring, k: 1}
  - {label: Central, type: central, k: 0.5, center: [0, 0.2]}
  - {label: Push, type: push, fx: 1, fy: 0}
  - {label: Bend, type: bend, k: 1}
corner: [0.3, -0.3]
sliders: [width, height, size]
readouts: [edges, circ, curl, curlArea, ratio, terms, perArea, size]
```
