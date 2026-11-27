# `work-path`
A force field in the plane and two or three roads from A to B (`js/widgets/work-path.js`, plain SVG + HTML, all wording from the config; reuses
the `fs-*` readout and slider styles). A dot walks each road at the same fraction of its length, and the work `W = integral of F . dr` is
accumulated (midpoint rule, 400 segments) into a running readout and one bar per road (bars are centred on zero, negative work goes left).
Fields: `uniform` `F = (fx, fy)`, `spring` `F = -k (r - c)`, `swirl` `F = k (-(y - cy), x - cx)` (curl `2k`, not conservative), `shear` `F = (k y, 0)`.
Roads: `straight`, `bent` (A, corner `via`, B; default corner `(B.x, A.y)`), `arc` (circular, sagitta = `bulge` x chord, sign = side, |bulge| <= 0.5),
`control` (quadratic curve with a draggable control point, mouse or touch; the walk jumps to the end while dragging so the bars update live).
Exported pure model: `fieldForce(field, x, y, strength)`, `roadPoints(road, A, B, n)`, `workAlong(field, pts, strength)` -> `{cum, len, total, length}`.
Script check (A = (-1.2, -0.5), B = (1.2, 0.5)): uniform `(1, 2)` gives 4.4 on every road; spring `k = 1.5` about `(0.2, 0.1)` gives
`-k/2 (|B-c|^2 - |A-c|^2) = 0.87` on every road; swirl `k = 1` about the origin gives 0 (straight; A, B, origin are collinear), 2.40 (bent via
`(1.2, -0.5)`, the straight-minus-bent difference is `2 k x area of the triangle = 2.4`), -4.03 (arc `bulge` 0.4, `2 k x segment area = 4.031`), +4.03 (bulge -0.4).
Tip: put the swirl centre off the A-B line (or move A, B) so the straight road is not zero by accident.
Config: `fields: [{label, type, ...}]` (or `field: {...}`; two or more give switch buttons), `A`, `B`, `view: [xmin, xmax, ymin, ymax]`, `roads: [{kind, label, color,
via | bulge | control}]`, `strength: 1` (multiplies the field), `sliders: []` (`strength`), `ranges: {strength: [-2, 2, 0.1]}`, `units: {work, length, force}`,
`duration: 4000` ms, `autoplay: true`, `barMax` (auto: fixed from the start geometry so sliders do not rescale; grows if a dragged road needs more), `decimals: 2`, `nField: [9, 6]`,
`show: {field, roads, trail, markers, endLabels, dots, forceArrows, bars, handle, scrub, play, readouts, fieldButtons, labels}` (all true; `field` = grey arrows,
`roads` = faint full roads, `trail` = thick walked part, `markers` = A and B points, `endLabels` = their letters, `forceArrows` = force at each dot, `bars` = bar chart,
`handle` = control-point handle, `scrub` = fraction slider, `play` = play/replay button, `fieldButtons` = field switch, `labels` = road names, captions, same/differs note),
`readouts: [work, final, spread]` (default `work`, `spread`; `work` = running per road, `final` = whole road, `spread` = largest minus smallest final; "same on every road" / "depends on the road" note with `labels`),
`labels: {A, B, play, replay, work, final, spread, roadN, same, differ, scrub, strength, picture}`. Reports nothing to the card.

Example: `{fields: [{label: Uniform, type: uniform, fx: 0, fy: 1}, {label: Spring, type: spring, k: 1}, {label: Swirl, type: swirl, k: 1, center: [0, 1.5]}],
roads: [{kind: straight, label: Straight}, {kind: bent, label: Bent}, {kind: control, label: Yours}], A: [-1.2, -0.5], B: [1.2, 0.5], units: {work: J}}`.

```smoke
fields:
  - {label: Uniform, type: uniform, fx: 0.5, fy: 1}
  - {label: Spring, type: spring, k: 1}
  - {label: Swirl, type: swirl, k: 1, center: [0, 1.5]}
roads:
  - {kind: straight, label: Straight}
  - {kind: bent, label: Bent}
  - {kind: control, label: Yours}
sliders: [strength]
readouts: [work, final, spread]
```
