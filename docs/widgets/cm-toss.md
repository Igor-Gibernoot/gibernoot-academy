# `cm-toss`
A tossed extended body (2 or 3 point masses on light rods) under uniform gravity (`js/widgets/cm-toss.js`, plain SVG + HTML, all wording from the config).
Closed-form model, no integration. The CM follows `R(t) = R0 + V0 t - (g t²/2) y-hat` of a single particle of mass `M = sum m_i`; the body spins at constant
`omega` about the CM, so particle `i` is at `R + Rot(phi0 + omega t) r_i` (a parabola plus a circle: a wavy path). Internal rod force on particle `i`:
`F_i = -m_i omega² r_i` (toward the CM), summing to zero. Optional explosion at time `explode.t`: rods vanish and each particle gets `u_i = kick r_i`
(`sum m_i u_i = 0`); afterwards each fragment is a projectile and the CM path is unchanged. The run stops when the CM lands (`y = 0`).
The view (scale, window) is fixed from every case the sliders, start values and presets can reach (incl. explosion fragments), so nothing rescales.
Arrow scales are fixed too: `P` arrow is proportional to `M V` (longest launch = 46 px), `Mg` to `M g`, rod forces to `m omega² r`; the three arrows use separate scales.
Probe: with `probe` set, a ring sits on the line from the first to the last particle at fraction `probe`; its trace (`probePath`) is smooth only when the ring is
at the CM. For a guess-the-CM card hide the CM (`show.cm: false`), give a probe slider and the mass sliders.
Exported `tossModel({masses, points, v0, theta, omega, phi0, g, y0, explode, kick})` returns `{M, cb, rel, tf, at(t)}` (`at(t)` gives `R`, `V`, `parts`).
Script check: masses [1,2,3] at x = -1, 0.2, 1.5, omega 5, kick 1.3: mass-weighted mean of particle positions and velocities equals `R(t)`, `V(t)` to 1e-15, rigid and exploded.
Config: `masses: [1, 3]` (2 or 3), `points` (body frame; default evenly spaced on a line, spacing 1.2), `rods: chain | all | none`, `v0: 7`, `theta: 55` (deg),
`omega: 4` (rad/s, counter-clockwise), `phi0: 0` (deg), `g: 9.8`, `y0: 0`, `explode: {t, kick}`, `sliders: []` (any of `v0, theta, omega, m1, m2, m3, probe, kick`),
`ranges: {v0:[2,10,0.5], theta:[20,80,5], omega:[0,12,0.5], m1/m2/m3:[0.5,5,0.5], probe:[0,1,0.01], kick:[0,2,0.1]}`, `probe: null` (start fraction 0..1),
`units: {mass, length, speed, time}`, `duration: 4000` (ms), `tmax` (auto), `readouts: [t, R, V, P]` (any of `t, R, V, P, W, M, off, omega, vx, vy`),
`show: {ground, body, cm, cmPath, paths, strobe, momentum, weight, internal, readouts, labels, replay, timeSlider, probePath}` (true except `strobe, internal, timeSlider, probePath`;
`internal` draws only before the explosion), `presets: [{label, ...fields}]`, `labels: {t, R, V, P, W, M, off, omega, vx, vy, v0, theta, m1, m2, m3, probe, kick, time, play, reset,
scene, cm, momentum, weight, internal}` (the last four are names on the marked point and arrows). Slider moves redraw at the current time; Play restarts. Reports nothing to the card.

Example (hammer toss, CM parabola and total momentum): `{masses: [1, 3], sliders: [omega, m2], show: {strobe: true}, readouts: [R, V, P]}`.

```smoke
masses: [1, 2, 3]
points: [[-1, 0], [0.2, 0], [1.5, 0]]
sliders: [v0, theta, omega, m1, m2, m3, probe, kick]
probe: 0.4
explode: {t: 0.5, kick: 1}
show: {strobe: true, internal: true, probePath: true, timeSlider: true}
readouts: [t, R, V, P, W, M, off, omega, vx, vy]
presets: [{label: Spin, omega: 10}, {label: Heavy end, m2: 5}]
```
