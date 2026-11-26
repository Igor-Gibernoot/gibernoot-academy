# `rocket-exhaust`
A rocket of initial mass `m0` burns fuel at a constant rate `mdot` until only `mDry` is left (`js/widgets/rocket-exhaust.js`, plain SVG + HTML, all
wording from the config). Up is positive. Frame `rocket` (exhaust leaves at `vex` relative to the rocket): `m dv/dt = vex mdot - m g`, so
`v = vex ln(m0/m) - g t`. Frame `ground` (the frame trap: exhaust leaves at `vex` relative to the ground): `m dv/dt = (v + vex) mdot - m g`, so for
`g = 0` `v = vex (m0/m - 1)`, always above the log result. Momentum bars (ground frame): rocket `m v`, exhaust = sum over ejected packets (each leaves
with ground velocity `v - vex`, or `-vex`; gravity acts on packets too), total. With `g = 0` the total stays 0. With `g > 0` it falls as `-m0 g t`.
If thrust is below weight at lift-off the rocket sits on the pad (`v = 0`) and the momentum bookkeeping is not meaningful. RK4, burn end on a step
boundary; the run replays on every change (`duration` ms). Axes, scene and bars are fixed from the extremes over the slider corners, start values,
presets and (with `frameToggle`) both frames, so nothing rescales while a control moves.
Draws: a vertical scene (rocket shrinking as it burns, exhaust packets as dots left behind at their own ground velocity, optional ground, thrust arrow), three
signed momentum bars, `v(t)` with a dashed `vex ln(m0/m) (- g t)` curve and optional dashed constant-mass line `mdot vex t / m0 - g t`, and optional `v`
against `ln(m0/m)` (straight line of slope `vex` for the formula).
Exported `rocketModel({m0, mDry, vex, mdot, g, frame, tmax, coast})` is the pure model (`rows`, `final`, `closed(t)`). Script check (default
`m0 100, mDry 20, vex 2, mdot 10`): `v = 2 ln 5 = 3.218876`, total momentum 0; ground frame `v = 8` (`2 (5 - 1)`); with `g = 0.2`, `vex = 4`:
`v = 4.837752 = 4 ln 5 - 0.2 t` (t = 8) and `P = -m0 g t = -160`.
Config: `m0: 100`, `mDry: 20`, `vex: 2`, `mdot: 10`, `g: 0`, `frame: rocket | ground`, `coast: 0` (extra time after burnout, fraction of the longest burn), `tmax` (auto),
`sliders: []` (any of `m0, mDry, vex, mdot, g`), `ranges: {m0:[50,200,10], mDry:[10,100,5], vex:[0.5,4,0.5], mdot:[5,20,1], g:[0,5,0.5]}`, `frameToggle: false`
(two buttons), `duration: 5000`, `units: {mass, speed, time}`, `bars: [rocket, exhaust, total]` (subset, order),
`show: {scene, packets, groundLine, thrustArrow, bars, vPlot, lnPlot, naive, formula, formulaLine, readouts, labels, replay, timeSlider, grid, cursor}`
(all true except `naive, grid, timeSlider, lnPlot, formulaLine`; `groundLine` draws only when g > 0; `formula` = the dashed formula curves; `formulaLine` = text
line with its value), `readouts: [m, v, dv]` (any of `t, m, ratio, lnratio, v, dv, a, thrust, pr, pex, P, y`), `presets: [{label, m0, mDry, vex, mdot, g, frame}]`,
`labels: {rocket, exhaust, total, t, m, ratio, lnratio, v, dv, a, thrust, pr, pex, P, y, vex, mdot, m0, mDry, g, time, speed, lnaxis, vCurve, formulaCurve,
naiveCurve, formula, frameRocket, frameGround, play, reset, scene, thrustArrow, momentum}`. Reports nothing to the card.

Example (empty space, momentum stays zero):
`{vex: 2, mdot: 10, sliders: [vex, mdot], readouts: [m, v, pr, pex, P], presets: [{label: Gravity, g: 0.2, vex: 4}]}`.

```smoke
vex: 2
mdot: 10
sliders: [m0, mDry, vex, mdot, g]
frameToggle: true
coast: 0.3
bars: [rocket, exhaust, total]
show: {lnPlot: true, naive: true, formulaLine: true, timeSlider: true, grid: true}
readouts: [t, m, ratio, lnratio, v, dv, a, thrust, pr, pex, P, y]
presets: [{label: Gravity, g: 0.2, vex: 4}, {label: Ground frame, frame: ground}]
```
