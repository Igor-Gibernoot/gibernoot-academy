# `projectile-drag`
A projectile launched from the origin with speed `v0` at angle `theta` above the horizontal, in the (x, y) plane with **y up**, under weight
`m g` and a drag opposite to the velocity (`js/widgets/projectile-drag.js`, plain SVG + HTML, all wording from the config). Taylor's split
`f(v) = f_lin + f_quad`, `f_lin = b v`, `f_quad = c v^2` (Taylor 2.1 to 2.3), switched by the **law**: `none` (vacuum, `R_0 = 2 v_x0 v_y0 / g`,
Eq. 2.38), `linear` (`f = b v`), `quad` (`f = c v^2`), `both`. Integrated by RK4 (`dt = 0.002 s`, the landing time found by bisection on the last
step); `projectileDragModel` and `projectileLinearExact` are exported.
Linear law, closed forms (Taylor Eq. 2.36, y up, checked on the PDF render, p. 54): `x(t) = v_x0 tau (1 - e^(-t/tau))`,
`y(t) = (v_y0 + v_ter) tau (1 - e^(-t/tau)) - v_ter t`, `tau = m/b`, `v_ter = m g / b`; trajectory Eq. 2.37
`y = (v_y0 + v_ter) x / v_x0 + v_ter tau ln(1 - x / (v_x0 tau))` with the vertical asymptote `x = v_x0 tau`.
Script check (`g = 9.8`, `m = 1`, `b = 1`, `v0 = 20`, `theta = 30`): RK4 against the closed forms for `x, y, v_x, v_y` at five times differs by under
1e-12; the closed `y` at the RK4 landing time is 8e-13 (landing is the root of `y`), `R = 13.896` (RK4 and closed form agree to 1e-12), `R_0 = 35.348`,
`R/R_0 = 0.393`, `tau = 1`, asymptote `17.32`, peak `3.108`; `none` gives `R = R_0` to 1e-13 and `T = 2 v_y0 / g`. Terminal speeds: linear 9.8,
quad (`c = 0.1`) 9.8995, both (`b = 1, c = 0.1`) 6.0905, equal to the formulas; a quad throw straight up at 200 m/s lands at 9.887 (below 9.8995).
The view is fixed (equal scale on both axes) from the vacuum range and peak over the start values, presets and slider limits, so a path never
rescales; override with `axes`. The ball replays the flight over `duration` ms.
Config: `law: linear` (`none, linear, quad, both`), `laws: [none, linear]` (buttons; one entry = no switch), `v0: 20`, `theta: 45`, `m: 1`, `b: 1`,
`c: 0.1`, `g: 9.8`, `sliders: []` (any of `v0, theta, m, b, c`), `ranges: {v0:[1,40,1], theta:[5,85,1], m:[0.1,5,0.1], b:[0,5,0.05], c:[0,1,0.01]}`,
`axes: {x:[0,X], y:[0,Y]}`, `dotEvery: 0.5` (s), `duration: 4000`, `units: {force, speed, distance, time, mass, b, c, angle}`,
`show: {path, vacuum, closed, dots, ball, weight, drag, velocity, range, asymptote, ground, labels, grid, readouts, laws, replay, timeSlider}`
(default true: `path, ball, ground, labels, readouts, laws, replay`; `vacuum` = dashed parabola, `closed` = the linear closed form as a thin dotted
curve on the path, `dots` = a dot every `dotEvery` s, `weight`, `drag`, `velocity` = arrows at the ball, `range` = markers at R and R_0,
`asymptote` = dashed vertical line x = v_x0 tau (laws with a linear term), `ground` = axes and tick labels, `labels` = letters and axis names,
`timeSlider` = slider for the time of the ball), `readouts: [range, time]` (any of `range, vacRange, ratio, time, peak, tau, asymptote, speed,
terminal, now`; `speed` and `now` at the ball), `presets: [{label, law, v0, theta, m, b, c}]` (only given fields change),
`labels: {range, vacRange, ratio, time, peak, tau, asymptote, speed, terminal, now, none, linear, quad, both, v0, theta, m, b, c, release, reset,
scene, fWeight, fDrag, fVel, rMark, r0Mark, asymLab, xAxis, yAxis}` (through `mdInline`; letters inside the SVG are plain text). Reports nothing to the card.

Example (does air cost range? compare with the vacuum parabola):
`{law: linear, laws: [none, linear], v0: 30, theta: 30, b: 0.5, sliders: [v0, theta, b], show: {vacuum: true, range: true}, readouts: [range, vacRange, ratio]}`.

```smoke
law: linear
laws: [none, linear, quad, both]
v0: 25
theta: 40
b: 0.5
c: 0.05
sliders: [v0, theta, m, b, c]
show: { vacuum: true, closed: true, dots: true, weight: true, drag: true, velocity: true, range: true, asymptote: true, grid: true, timeSlider: true }
readouts: [range, vacRange, ratio, time, peak, tau, asymptote, speed, terminal, now]
presets: [{label: Thick air, b: 2, law: linear}, {label: Steep, theta: 75}]
```
