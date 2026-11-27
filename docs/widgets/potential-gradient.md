# `potential-gradient`
A force field `F = -grad V` in the plane with its potential (`js/widgets/potential-gradient.js`, plain SVG + HTML, all wording from the config; reuses the
`fs-*` readout and slider styles and `roadPoints` from `work-path.js`). Contours of `V` (marching squares, `nLevels` evenly spaced between the 2nd and 98th
percentile of `V` in view, or explicit `levels` per field), optional colour map, grey field arrows, a draggable probe point with the arrows `F` (blue, solid)
and `grad V` (orange, dashed, opposite to `F`, so perpendicular to the contour), two roads A to B and a closed loop, a played trajectory with bars `T`, `V`, `T + V`.
Sign convention: `F = -grad V`, `W = integral F . dr = V(A) - V(B)`, `T = m v^2 / 2`. Does not report to the card.
Fields: `spring` `V = k|r-c|^2/2`; `uniform` `F = (fx, fy)`, `V = -(fx (x-cx) + fy (y-cy))`; `gravity` `F = (0, -g)`, `V = g (y-cy)`; `central`
`V = -k/rho`, `rho^2 = |r-c|^2 + eps^2` (softened 1/r, attractive; `eps` default 0.15); `swirl` `F = k(-(y-cy), x-cx)` and `shear` `F = (k y, 0)` have **no
potential**: contours, colour map, `grad V`, the `V` rows and `V(B) - V(A)` are hidden (the bars show "no potential"), the loop circulation is not zero, the trajectory
shows `T` only.
Mass is only used in the dynamics `a = F/m`; `V` is in the units of work, so for gravity put `g` as the force on the body (`m g`) and `mass` as `m`.
Loop: `loop: roads` (default; road 1 out, road 2 back, circulation = `W1 - W2`), `{kind: circle, center, radius}` (counter-clockwise), or `false`.
Trajectory: RK4 (`dt` 0.004, `tmax` 6), starts at the probe point (drag it, then Launch) unless `start` is set; velocity `v0: [vx, vy]` or the sliders
`speed` / `angle`; stops when it leaves `view`. Dragging the point or a road handle rebuilds everything; the playback jumps to time 0.
Exported pure model: `potential`, `fieldForce`, `workAlong`, `closedWork`, `trajectory`, `hasPotential`.
Script check (A = (-1.2, -0.5), B = (1.2, 0.5), roads straight, arc `bulge` 0.4, bent via (1.2, -0.5)): `V(A) - V(B)` equals the work on every road to 1e-5 for spring
`k = 1.5` about (0.2, 0.1) (0.87), uniform (0.3, -1) (-0.28), gravity `g = 2` (-2.00) and central `k = 1` about (0, 0.3) (0.126); circulation 5e-15 (spring), 2e-6 (central);
`F + grad V` below 1e-10 by finite differences; `T + V` constant to 1e-13 (RK4, harmonic and uniform) and 1.4e-6 (central, 3 time units); swirl `k = 1`, loop straight
then back along the arc: 4.0316 = `2k x` segment area 4.0317; swirl `k = 0.7` circle radius 0.6: 1.5833 = `2k pi r^2` = 1.5834.
Config: `fields: [{label, type, ...}]` (two or more give switch buttons), `A`, `B`, `view`, `roads` (two: kinds as in work-path, `control` has a draggable handle), `loop`,
`point`, `start`, `v0`, `mass`, `tmax`, `dt`, `strength`, `sliders: [strength, speed, angle]`, `ranges`, `units: {V, work, length, force}`, `duration` ms, `autoplay: false`,
`nLevels: 10`, `nField: [9, 6]`, `decimals: 2`, `barMax` (default auto),
`show: {contours, colorMap, field, point, forceArrow, gradArrow, roads, markers, endLabels, loop, bars, energy, trajectory, handle, scrub, play, readouts, fieldButtons, labels}`
(all true except `colorMap`), `readouts: [dV, work, loop, probe, energy]` (default `dV, work, loop`),
`labels: {A, B, play, replay, scrub, strength, speed, angle, dV, minusDV, work, roadN, loop, probe, energy, T, V, E, noV, same, differ, F, gradV, picture}`.
Note: `labels.F`, `labels.gradV` are not drawn on the picture (arrows are described by the card text); the bars have a fixed zero line, so a hidden bar block takes no space.

Example: `{fields: [{label: Spring, type: spring, k: 1}, {label: Gravity, type: gravity, g: 1}, {label: Swirl, type: swirl, k: 1, center: [0, 1.5]}],
roads: [{kind: straight}, {kind: control}], point: [0.6, 0.5], v0: [0, 0.6], show: {energy: false, colorMap: true}}`.

```smoke
fields:
  - {label: Spring, type: spring, k: 1}
  - {label: Gravity, type: gravity, g: 1}
  - {label: Central, type: central, k: 0.5, center: [0, 0.2]}
  - {label: Swirl, type: swirl, k: 1, center: [0, 1.5]}
roads:
  - {kind: straight}
  - {kind: control}
point: [0.6, 0.5]
v0: [0, 0.6]
sliders: [strength, speed, angle]
readouts: [dV, work, loop, probe, energy]
show: {colorMap: true}
```
