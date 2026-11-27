# `energy-diagram`
Motion in one dimension in a potential `V(x)` (`js/widgets/energy-diagram.js`, plain SVG + HTML, all wording from the config; reuses the `fs-*` readout and slider styles).
Notation: this widget (and the course) writes **V** for the potential energy and `x` for the coordinate; Taylor writes `U`. `F = -dV/dx`, `x'' = F/m`, `T = m v^2 / 2`, `E = T + V`.
Picture: curve `V(x)`, a purple line at the total energy `E` (drag the line or its knob, or use the `E` slider), the allowed region `E >= V` shaded between the curve and the line
(and as a green band on the bottom axis), orange dots at the turning points `V = E` (dashed verticals), marks on the curve at the equilibria `V' = 0`: filled green = stable (`V'' > 0`),
open red ring = unstable (`V'' < 0`), grey diamond = flat (`V'' = 0`, the second-derivative test is silent). The ball (blue) is dragged along the allowed curve; RK4 with steps of at most 0.002 time units.
Dragging `E` keeps the ball where it is when `V(x) <= E` and otherwise moves it to the nearest allowed point; the speed is then set from `E`. A ball that leaves `view` stops (message, button reads Replay).
The bars `T`, `V`, `E` use the integrated speed (`T = m v^2/2`), so `E` really is `T + V` and not the line value; `F` is an orange arrow at the ball (full length = the largest `|V'|` in view); `tangent` draws the slope line.
Potentials (`potentials: [{label, type, ...}]` gives switch buttons; `potential: {...}` or a type name for one):
`well` `V = -V0 sech^2(x/w)` (`V0` 1, `w` 1; `V''(0) = 2 V0 / w^2`); `hill` `V = +V0 sech^2(x/w)`; `double` `V = V0 ((x/a)^2 - 1)^2` (`V0` 1, `a` 1; minima at `+-a`, barrier `V0`);
`spring` `V = k x^2 / 2`; `lj` `V = 4 eps ((sigma/x)^12 - (sigma/x)^6)`, `x > 0` (minimum at `2^(1/6) sigma`, depth `eps`); `slope` `V = g x` (constant force `-g`, no equilibrium, gravity-like);
`poly` `V = sum c_n x^n` (`coeffs`, give `view`). Each has a default `view`, `E`, start `x` (see the header of the JS); every potential may override `view`, `E`, `x`, `direction`, `mass`.
Period readouts: `period` = twice the RK4 time from one turning point to the other (bounded motion in the ball's allowed interval, else "no period"; infinite at the separatrix);
`smallPeriod` = `2 pi sqrt(m / V''(x_eq))` for the stable equilibrium in that interval.
Exported pure model: `makePotential`, `turningPoints`, `equilibria`, `rk4`, `periodOf`.
Script check: `V'` and `V''` against finite differences below 1e-5 (all types); `V(turning point) - E` below 3e-15; equilibria: well (0 stable), hill (0 unstable), double (`+-1` stable, 0 unstable),
spring (0 stable), lj (1.1225 stable), slope none, `x^3` (0 flat); `max |T + V - E|` over 40 time units: 3e-13 (well), 1e-11 (double), 1e-8 (Lennard-Jones, stiff wall), 5e-14 (spring);
period for `E` just above a minimum against `2 pi sqrt(m/V'')`: well 4.44289 / 4.44288, double 2.22144 / 2.22144, Lennard-Jones 0.83116 / 0.83116; spring `E = 2`: 6.283185 = `2 pi`;
double well `E = 0.5`: 2.519 (grows towards the barrier: 5.53 at `E = 0.999`).
Config: `potentials`/`potential`, `view`, `E`, `x`, `direction`, `mass`, `speed` (time units per second, default 1), `height` (px, 190), `sliders: [E, mass, speed]`, `ranges: {E, mass, speed}` as `[min, max, step]`,
`readouts: [x, V, T, E, F, slope, period, smallPeriod]` (default none), `bars: [T, V, E]` (rows), `traceTime` (10), `units: {V, x, t, F}`, `decimals` 2, `autoplay: false`,
`show: {curve, axes, zero, region, axisBand, line, handle, turning, turnLines, equilibria, eqLabels, ball, drag, forceArrow, tangent, bars, trace, readouts, flag, play, reset, potentialButtons, labels}`
(all true except `tangent` and `trace`; `labels` hides every word on the picture and in the readout cells),
`labels: {x, V, E, T, play, pause, replay, reset, stable, unstable, flat, left, noPeriod, slope, F, period, smallPeriod, mass, speed, picture}`. Reports nothing to the card.

Example: `{potentials: [{label: Double well, type: double}, {label: Well, type: well}], sliders: [E], readouts: [period, smallPeriod], show: {trace: true}}`.

```smoke
potentials:
  - {label: Double well, type: double}
  - {label: Well, type: well}
  - {label: Hill, type: hill}
  - {label: Spring, type: spring}
  - {label: Lennard-Jones, type: lj}
  - {label: Slope, type: slope}
sliders: [E, mass, speed]
readouts: [x, V, T, E, F, slope, period, smallPeriod]
show: {tangent: true, trace: true}
```
