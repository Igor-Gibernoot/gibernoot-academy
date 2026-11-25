# `drag-fall`
A body of mass `m` falling, or thrown vertically, with its weight `m g` and an air drag against the velocity (`js/widgets/drag-fall.js`, plain
SVG + HTML, all wording from the config). Down is positive: `v` is the downward velocity (negative = moving up), `y` the distance fallen
(negative = above the start). The drag follows Taylor's split `f(v) = f_lin + f_quad`, `f_lin = b v`, `f_quad = c v^2` (Taylor 2.2, 2.3,
checked on the PDF render), always opposite to the velocity: `m dv/dt = m g - b v - c v |v|`, with the terms switched by the **law**:
`none` (`v = v0 + g t`, no terminal speed), `linear` (`f = b v`, `v_t = m g / b`, `tau = m / b`), `quad` (`f = c v^2`, `v_t = sqrt(m g / c)`),
`both` (`f = b v + c v^2`, `v_t = (-b + sqrt(b^2 + 4 c m g)) / (2 c)`). Integrated by RK4 at `dt = 0.002 s` (`dragFallModel` is exported).
Script check (`g = 9.8`, `m = 1`): linear `b = 1`: `v_t = 9.8`, `v(2) = 8.4737` and `y(2) = 11.1263`, equal to the closed form to 1e-12;
quad `c = 0.1`: `v_t = 9.8995`, `v(2) = 9.5291` equal to `v_t tanh(g t / v_t)`; thrown down at 20 m/s (above `v_t`) `v(2) = 10.0278`, equal
to the `coth` form; `both` with `b = 1, c = 0.1`: `v_t = 6.0905` and `b v_t + c v_t^2 = m g`; `none`, `v0 = 3`: `v(2) = 22.6`, `y(2) = 25.6`.
The run replays on every change (`duration` ms for the window `tmax`); the marker stays at the end. Draws: the scene (a dashed fall line with
the start level, the ball, weight arrow `m g` = 50 px, drag arrow clamped at 110 px, optional net force) and plots of `v(t)` and `y(t)`, with a dashed
terminal-speed line on the `v` plot. Axes are fixed from `g`, `tmax`, the `v0` range, start values and presets (free fall bounds every curve), so
curves never rescale; override with `axes`. Projectile mode (x, y path) is not included.
Config: `law: linear` (`none, linear, quad, both`), `laws: [none, linear, quad]` (buttons offered; one entry = no switch), `m: 1`, `b: 1`,
`c: 0.1`, `v0: 0` (kg, kg/s, kg/m, m/s), `g: 9.8`, `tmax: 6`, `duration: 4000`, `sliders: []` (any of `m, b, c, v0`),
`ranges: {m:[0.1,5,0.1], b:[0,5,0.1], c:[0,1,0.01], v0:[-20,30,1]}`, `axes: {v:[lo,hi], y:[lo,hi]}`, `units: {force, speed, distance, time, mass, b, c}`,
`show: {scene, weight, drag, net, vPlot, yPlot, terminal, freefall, cursor, labels, grid, readouts, laws, replay}` (all true except `net`,
`freefall`, `grid`; `scene` = ball with arrows, `weight`, `drag`, `net` = the three arrows, `vPlot`/`yPlot` both false = no plots, `terminal` = the
dashed `v_t` line (laws that have one), `freefall` = grey dashed drag-free curve, `cursor` = time marker and dots, `labels` = letters and axis
names, `laws` = the law buttons, `replay` = Release), `readouts: [speed, drag, terminal]` (any of `speed, drag, lin, quad, ratio, terminal,
accel, y, time, tau`; `lin = b v` and `quad = c v^2` and `ratio = f_quad / f_lin = c v / b` always use the current `b`, `c` whatever the law, so a
card can ask "which term wins" even on the linear law; `speed, drag, accel, y, time` at the marker), `presets: [{label, law, m, b, c, v0}]`
(only given fields change), `labels: {speed, drag, lin, quad, ratio, terminal, accel, y, time, tau, none, linear, quad, both, m, b, c, v0,
release, reset, scene, fWeight, fDrag, fNet, vAxis, yAxis, tAxis, vt, noTerminal}` (labels go through `mdInline`; letters inside the SVG are plain text). Reports nothing to the card.

Example (does drag grow with speed? compare the laws):
`{law: none, laws: [none, linear, quad], b: 1, c: 0.1, sliders: [b, c], readouts: [speed, drag, terminal], show: {freefall: true}}`.

```smoke
law: linear
laws: [none, linear, quad, both]
b: 1
c: 0.1
v0: 0
sliders: [m, b, c, v0]
show: { net: true, freefall: true, grid: true }
readouts: [speed, drag, lin, quad, ratio, terminal, accel, y, time, tau]
presets: [{label: Thrown up, v0: -15}, {label: Fast down, v0: 25, law: quad}]
```
