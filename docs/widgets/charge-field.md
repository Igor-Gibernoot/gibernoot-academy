# `charge-field`
A charge `q` of mass `m` in a uniform magnetic field `B` along `+z` (toward the viewer in the top view) and an optional uniform electric field `E`
(`js/widgets/charge-field.js`, plain SVG + HTML, all wording from the config). Taylor 2.5 (Eq. 2.62-2.81, checked on the PDF render):
`m dv/dt = q (E + v x B)`, components `m dvx/dt = q Ex + q B vy`, `m dvy/dt = q Ey - q B vx`, `m dvz/dt = q Ez`; cyclotron frequency
`omega = q B / m` (Eq. 2.67; signed, so `q < 0` turns the other way), radius `r = v_perp / |omega| = m v_perp / (|q| B)` (Eq. 2.81, Taylor writes `v`
for the transverse speed and `r` for the radius), period `T = 2 pi / |omega|`. With `E = 0` the speed is constant (the force does no work), `vz` is
constant and the path is a helix, clockwise seen from `+z` for `q > 0`. With `E` the transverse path is the same circle riding on the drift
`u = E x B / B^2 = (Ey, -Ex) / B` (cycloid-like), and `Ez` along `B` only adds uniform acceleration to `z`. `B = 0` (or `q = 0`) gives a straight line
(a parabola if `E` acts on a charge with `B = 0`).
Integrated by RK4 at `dt = 0.005`; `chargeFieldModel` is exported with `at(t)` (RK4), `exact(t)` (closed forms below), `center(t)`, `R`, `T`, `omega`,
`drift`. Closed forms (derived the way Taylor does for `E = 0`, with `eta = vx + i vy`, `eta' = (q/m)(Ex + i Ey) - i omega eta`):
`eta = u + w0 e^(-i omega t)`, `w0 = eta0 - u`, `xi = x + i y = xi0 + u t + i w0 (e^(-i omega t) - 1)/omega`; guiding centre
`xi_c = xi0 - i w0 / omega + u t`, orbit radius `|w0| / |omega|`; `z = z0 + vz t + (q/2m) Ez t^2`.
Script check (8 cases: circle, negative charge, helix, drift, drift with all fields and `Ez`, `E` parallel to `B`, `B = 0` with `E`, `q = 0`): largest
difference between RK4 and the closed forms (position and velocity, `t` up to 6) is below 2e-10; circle `q=m=B=v0=1`: `r = 1`, `T = 2 pi`, back at the start at
`t = 2 pi`, centre `(0, -1)`, speed 1 to 1e-13; `E = 1` along `x`, `v0 = 0`: `u = (0, -1)`, after `T` the charge is at `(0, -2 pi)`; the distance to
`center(t)` equals `R` in the drifting case.
Draws (top view): `B` dots or crosses, axes, path (solid up to the marker, faint ahead), hollow start dot, dashed circle with its centre cross (moves with the
drift), optional radius line, the particle, arrows `v` (blue), `q v x B` (orange), `q E` and the drift `u` (purple), optional net force and the dashed
vacuum line. Other panels: `side` (x horizontal, z up) and `3d` (oblique, z up, x right, y up-right, floor shadow dashed). Arrows are scaled by the
largest speed and force over the start state and the presets (about 48 px, clamped at 90 px) and the world window is the box of the start path and every
preset path, so nothing rescales while a slider moves (set `window` or `scale` when sliders reach beyond the presets; paths outside the panel are clipped).
Time: the marker sits at `t = tmax` (full path) unless `start: play`; Play re-runs it over `duration` ms; the `t` slider scrubs; other sliders redraw in place.
Config: `q: 1`, `m: 1`, `B: 1`, `v0: 1` (speed in the `xy` plane), `angle: 0` (degrees from `+x`), `vz: 0`, `E: 0` (magnitude in the `xy` plane), `Eangle: 0`, `Ez: 0`,
`x0, y0, z0: 0`, `tmax: 6`, `duration: 5000`, `start: end` (or `play`), `sliders: []` (any of `q, m, B, v0, angle, vz, E, Eangle, Ez, t`),
`ranges: {q:[-3,3,0.5], m:[0.5,5,0.5], B:[0,3,0.1], v0:[0,3,0.1], angle:[0,360,5], vz:[-2,2,0.1], E:[0,3,0.1], Eangle:[0,360,5], Ez:[-2,2,0.1]}`,
`views: [top]` (any of `top, side, 3d`, stacked in the order given, `[]` = none), `window: {x:[lo,hi], y:[lo,hi], z:[lo,hi]}`, `scale: {v, f}`,
`units: {length, time, mass, charge, field, efield, speed, energy, force, angle}` (SI by default; `''` removes a unit),
`show: {particle, start, trace, ahead, velocity, force, eForce, net, drift, circle, center, radius, field, vacuum, axes, grid, shadow, labels, readouts, replay}`
(all true except `net`, `radius`, `vacuum`, `grid`; `eForce` draws only when `E` or `Ez` is not 0, `drift` only when `E != 0` and `B > 0`, `circle` and `center`
only when `omega != 0`; `shadow` = floor shadow in `3d`; `labels` = letters, panel titles and the `B` mark), `readouts: [r, omega, period, speed, ke]`
(any of `r, omega, period, speed, vperp, vz, ke, force, drift, time, x, y, z`; `r` and `period` read `∞` when `omega = 0`; `drift` reads `–` without `B` or `q`;
`ke = m v^2 / 2` is constant only when `E = 0`), `presets: [{label, q, m, B, v0, angle, vz, E, Eangle, Ez}]` (only given fields change),
`labels: {r, omega, period, speed, vperp, vz, ke, force, drift, time, x, y, z, q, m, B, v0, angle, E, Eangle, Ez, t, play, reset, topTitle, sideTitle,
threeTitle, fV, fF, fE, fNet, fU, bField, circle, center, start}` (go through `mdInline`; letters inside the SVG are plain text). Reports nothing to the card.

Example (why the radius scales with speed): `{q: 1, m: 1, B: 1, v0: 1, sliders: [v0], window: {x: [-4, 4], y: [-4, 4]}, show: {radius: true}, readouts: [r, omega, period, speed]}`.

```smoke
q: 1
m: 1
B: 1
v0: 1
vz: 0.4
E: 0.5
Eangle: 90
Ez: 0.2
sliders: [q, m, B, v0, angle, vz, E, Eangle, Ez, t]
views: [top, side, 3d]
show: { net: true, radius: true, vacuum: true, grid: true }
readouts: [r, omega, period, speed, vperp, vz, ke, force, drift, time, x, y, z]
presets: [{label: Circle, vz: 0, E: 0, Ez: 0}, {label: Helix, vz: 0.6, E: 0, Ez: 0}, {label: Drift, v0: 0, vz: 0, E: 1, Eangle: 0, Ez: 0}, {label: E parallel B, E: 0, Ez: 1, vz: 0}, {label: No field, B: 0, E: 0, Ez: 0}]
```
