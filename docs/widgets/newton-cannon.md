# `newton-cannon`
A planet of radius `R` (drawn large, centre in the middle of the figure) with a tower of height `h` on top and a ball fired from the
tower with speed `v0`, horizontally or at an angle (`js/widgets/newton-cannon.js`, plain SVG + HTML, all wording from the config).
Gravity is the only force, `r'' = -GM r / r^3`, integrated by RK4 in units where `GM = R = 1`: the circular speed at the surface is
`vc = 1`, `g = GM/R^2 = 1`, the time unit is `sqrt(R^3/GM)`. The path is computed when a slider moves; **Fire** (or a preset) animates it
in real simulated time (2.5 to 14 s per run). Outcome from the simulated path: `falls` (reaches `r = R`: landing cross, dotted arc, range
= arc length along the surface in `R`), `orbit` (bound and one full period without touching the ground, period `T = 2 pi a^(3/2)`),
`escape` (energy `v0^2/2 - 1/(1+h) >= 0`; for `h = 0` this is `v0 >= sqrt2 vc`). Outcome, range and period appear only when the ball
has finished (so the card can ask for a prediction first). Period shows for `orbit` only, not for a bound ball that hits the ground.
Exported pure functions for script checks: `cannonShot({v0, angle, h})` (`{pts, outcome, range, land, T, E}`), `flatShot`, `moonCheck(d)`.
Script check (h = 0.05): v0 0.3 falls, range 0.102 R (flat-earth 0.095); v0 1 orbit, T 7.30; v0 1.2 orbit, T 19.8; v0 1.36 orbit (T 485); v0 1.45 escape (threshold sqrt(2/1.05) = 1.380); h = 0, v0 = 1 stays on r = 1 (T = 2 pi = 6.283); Moon at 60 R: a = 2.7778e-4 g = 1/3600 g, T 2920.
Config: `v0: 0.6`, `angle: 0` (degrees above horizontal), `h: 0.08` (in `R`), `second: false` with `v0b: 1.0` (ball 2, same start and
angle, other speed; colours: ball 1 blue, ball 2 orange), `sliders: ['v0']` (any of `v0, v0b, angle, h`, in that order of your choice),
`ranges: {v0:[0,1.5,0.01], v0b:[0,1.5,0.01], angle:[0,60,1], h:[0,0.3,0.01]}`, `view` (half-width in `R`; default auto: fits the paths
between `viewMin: 1.45` and `viewMax: 6`), `duration` (seconds; default auto), `moonDistance: 60`, `units: {speed: 'v_c', length: 'R'}`,
`show: {trail, fade, arrows, parabola, moon, landing, tower, labels, readouts, sliders, fire, second}` (all true except `parabola` and
`moon`; `fade` = older trail dimmer; `arrows` = velocity in the ball's colour and gravity in the ink colour; `parabola` = purple dashed
flat-earth path with uniform `g` and flat ground at the surface level, the same speed and angle as ball 1; `moon` = a to-scale strip
with the Moon at `moonDistance` R, its acceleration from a simulated RK4 circular orbit; `second` must be true as well as the config
`second`, so presets can switch ball 2 on), `readouts: ['v0','speed','outcome','range','period']` (also `flatRange`, `moonAcc`,
`moonLaw`; with two balls each cell shows `ball 1 | ball 2` in their colours; `moonAcc` = `4 pi^2 r / T^2` of the simulated Moon orbit
in units of g, `moonLaw` = `g (R/r)^2`),
`presets: [{label, v0, v0b, angle, h, second, parabola}]` (set the given fields and fire), `labels: {v0, v0b, angle, h, speed, outcome,
range, flatRange, period, moonAcc, moonLaw, fire, reset, falls, orbit, escape, radius, tower, velocity, gravity, moon, planet, ball1,
ball2, figure}`. Uses the shared `fs-*` layout classes. Reports nothing to the card.

Example (the classic cannon): `{v0: 0.3, h: 0.1, sliders: [v0], show: {parabola: true}, presets: [{label: Short throw, v0: 0.4},
{label: Skims the ground, v0: 1, h: 0.02}, {label: Escape, v0: 1.45}]}`.

```smoke
v0: 0.6
h: 0.08
sliders: [v0, v0b, angle, h]
second: true
show: { parabola: true, moon: true }
readouts: [v0, speed, outcome, range, flatRange, period, moonAcc, moonLaw]
presets:
  - { label: short-throw, v0: 0.4, h: 0.1, angle: 0, second: false, parabola: true }
  - { label: skim-ground, v0: 1, h: 0.02, angle: 0, second: false, parabola: false }
  - { label: orbit-ellipse, v0: 1.2, h: 0.05, angle: 0, second: false }
  - { label: escape, v0: 1.45, h: 0.05, angle: 0, second: false }
  - { label: same-start-two-speeds, v0: 0.6, v0b: 1.0, h: 0.08, angle: 0, second: true }
```
