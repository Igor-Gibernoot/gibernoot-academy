# `ang-mom-area`
A particle in the plane about a fixed origin O, free or under a force (`js/widgets/ang-mom-area.js`, plain SVG + HTML, all wording from the config).
Angular momentum `L_z = m (x v_y - y v_x) = (r x p)_z` (positive counter-clockwise, out of the page), `L = |L_z|`; area swept by `r`: `dA/dt = |r x v|/2 = L/2m`;
torque `tau = (r x F)_z = x F_y - y F_x`, `dL_z/dt = tau`. Modes (config `mode`, or a preset key): `free` (line, start `(-xs, b)`, velocity `(v, 0)`, `b` = signed impact parameter;
`L_z = -m b v`, clockwise for `b > 0`), `spring` (`F = -k r`, start `(r0, 0)`, velocity `(0, v)`), `gravity` (`F = -k r-hat / r²`, softened by `eps = 0.05`, same start; circular orbit
`v = sqrt(k/(m r0))`, ellipse for smaller `v`, open orbit past `sqrt(2k/(m r0))`), `push` (free line plus a constant force `F` of direction `ang` degrees, only for `push.t0 <= t < push.t0 + push.dur`
(default 1 to 2 s): off-center, so `L_z` changes by `int tau dt`; for `b = 0.8`, `ang = 90`, `F = 1` the free line crosses x = 0 at t = 2.5, so the pulse gives `Delta L_z = -1`).
Model: RK4, fixed step 0.005, sampled once and interpolated; areas are polygon sums of the sampled path, so `dA/dt = L/2m` is a check and not an input. The readout `dAdt` is a numerical
derivative of the area over +-0.05 s, `L2m` is `L/(2m)` from the momentum (they agree to about 1e-6, except at the sharp ends of a push pulse, where the window straddles the kink).
View and arrow scales are fixed from the start values and presets (so nothing rescales; a slider pushed past them may leave the window, which clips): `view` (half-width, default automatic, at most 12), `p` arrow 55 px at the
largest momentum, `F` arrow 45 px at the largest force, torque arc thickness follows `|tau|` (fixed radius 20 px at O).
Equal-time wedges: `wedge: {n: 5, dt: 1, t0: 0}` draws the wedges swept between `t0 + i dt` and `t0 + (i+1) dt`, complete ones only, alternating tint, areas printed (`wedgeAreas`) or listed (`wedgeList`).
Exported `angMomModel({mode, m, b, r0, v, k, F, ang, xs, eps, push, tmax, dt})` returns `{at(t), area(ta, tb), tmax, m}`; `at(t)` has `x, y, vx, vy, px, py, Fx, Fy, Lz, L, r, speed, tau, A, dAdt, L2m`.
Script check (node, ran 2026-11-26): free closed form to 4e-14; spring ellipse `(r0 cos wt, ...)` to 5e-11; max `|L_z - L_z(0)|` for free, spring, circular and elliptical gravity (m = 1 to 3) is 3e-13 or less,
max `|dA/dt - L/2m|` is 3e-14 (free) and 3e-6 or less (central); push: `Delta L_z = -1.0008` against `-1`.
Config: `mode: free`, `m: 1`, `b: 0.8`, `r0: 2`, `v: 1`, `k: 1`, `F: 1`, `ang: 90`, `xs: 2.5`, `eps: 0.05`, `push`, `tmax: 8`, `duration: 8000` (ms), `wedge`, `strobeDt` (default `wedge.dt`),
`sliders: []` (any of `b, r0, v, k, F, ang`; give each the sliders its mode uses), `ranges: {b:[-2,2,0.1], r0:[0.8,3,0.1], v:[0.2,3,0.1], k:[0.2,6,0.1], F:[0,4,0.1], ang:[0,360,15]}`,
`units: {length, time, mass}`, `readouts: [t, L, dAdt, L2m]` (any of `t, r, speed, p, Lz, L, A, dAdt, L2m, tau`; `A` and `dAdt` print absolute values),
`show: {axes, origin, fullPath, trail, particle, r, p, force, torque, lever, parallelogram, lmark, wedges, wedgeAreas, wedgeList, strobe, spokes, lplot, labels, readouts, replay, timeSlider}`
(true: `axes, origin, fullPath, trail, particle, r, labels, readouts, replay`; the rest false), `presets: [{label, mode, b, r0, v, k, F, ang}]` (only the fields given change),
`labels: {t, r, speed, p, Lz, L, A, dAdt, L2m, tau, b, r0, v, k, F, ang, wedge, time, play, reset, scene, ar, ap, aF, aL, atau, ad}` (`ar..ad` are the plain letters on the arrows, L symbol, torque arc and lever arm).
`parallelogram` is spanned by the drawn arrows `r` and `p` (area proportional to `L`, not equal to it); `lmark` is a dot (L out of the page) or cross (into it) at the top left, nothing when `L = 0`;
`torque` and `lever` show only while the force is nonzero (`lever` = dashed line from O to the line of the force, label `ad`). Slider moves redraw at the current time; Play restarts. Reports nothing to the card.

Example (equal areas): `{mode: free, sliders: [b, v], show: {wedges: true, wedgeAreas: true, strobe: true, spokes: true, p: true}, readouts: [L, dAdt, L2m]}`.

```smoke
mode: free
sliders: [b, r0, v, k, F, ang]
show: {p: true, force: true, torque: true, lever: true, parallelogram: true, lmark: true, wedges: true, wedgeAreas: true, wedgeList: true, strobe: true, spokes: true, lplot: true, timeSlider: true}
readouts: [t, r, speed, p, Lz, L, A, dAdt, L2m, tau]
wedge: {n: 5, dt: 1}
view: 6
presets:
  - {label: Free line, mode: free, b: 0.8, v: 1}
  - {label: Circular orbit, mode: gravity, r0: 2, v: 1.4, k: 4}
  - {label: Ellipse, mode: gravity, r0: 2, v: 1, k: 4}
  - {label: Spring, mode: spring, r0: 2, v: 1, k: 1}
  - {label: Off-center push, mode: push, b: 0.8, v: 1, F: 1, ang: 90}
```
