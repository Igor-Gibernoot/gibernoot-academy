# `phase-portrait`
The position-momentum plane (`q` horizontal, `p` vertical) of a 1D system with unit mass, and a small side view of the physical system in sync
(`js/widgets/phase-portrait.js`, plain SVG + HTML, all wording from the config). Motion by RK4 of `q' = p`, `p' = -V'(q) - gamma p`.
The reader clicks or drags in the plane to choose a start point; while dragging the dot waits, on release it runs. The orbit through the
start is drawn: the exact energy contour when `gamma = 0`, the integrated spiral when `gamma > 0`.

Systems (`system`): `pendulum` (`V = 1 - cos q`, `m = l = g = 1`, `q` = angle from hanging down, bottom `E = 0`, separatrix `E = 2`,
period `4 K(E/2)` below it and `4 K(2/E)/sqrt(2E)` above, `K` the complete elliptic integral of parameter `m`; a rotating orbit re-enters at the
left edge when `wrap`); `spring` (`V = q^2/2`, period `2 pi`); `hill` (`V = -q^2/2`, inverted potential, unstable point, hyperbolas; ball on a hilltop
in the side view, the run stops once it is far away). Side view: bob on a rod, mass on a spring, ball on a hill.

Config: `system`, `q: 1`, `p: 0` (start), `interactive: true` (`false` = display only: no click, no pointer cursor), `fixedStart: false`
(`true` = the start is the config `q, p` and cannot be changed; implies not interactive), `gamma: 0`, `sliders: []` (`['gamma']`),
`ranges: {gamma: [0, 0.6, 0.01]}`, `qRange`, `pRange` (default pendulum `[-4.7, 4.7]` x `[-2.6, 2.6]`, others `[-2.5, 2.5]` both), `wrap: true`,
`speed: 1.5` (simulated time per second), `autoplay: true`, `contourLevels` (energies of the background family; default pendulum
`[0.25, 0.6, 1, 1.5, 2.6, 3.5]`), `readouts: ['E','period']` (also `q`, `p`, `gamma`, `time`; period shows for undamped pendulum or spring orbits, `∞`
on the separatrix, `–` otherwise), `presets: [{label, q, p, gamma}]` (set the start, and damping if given, then restart),
`labels: {q, p, E, period, gamma, time, restart, pause, play, figure, side, start}`,
`show: {axes, axisLabels, ticks, contours, orbit, separatrix, fixedPoints, trail, fade, point, direction, sideView, readouts, sliders, buttons, start}`
(all true except `ticks`, `contours`, `separatrix`, `direction`; `ticks` = multiples of pi on the pendulum `q` axis, integers elsewhere; `contours` = faint family of orbits;
`separatrix` = purple dashed `E = 2` (pendulum); `fixedPoints` = filled dot stable, open dot unstable; `direction` = arrowhead on the dot along the flow;
`start` = dashed ring at the chosen start, only when interactive; `buttons` = Restart, Pause and presets). Colours: dot and trail blue, orbit orange, separatrix purple.
Reports nothing to the card. Pure functions for script checks: `phaseModel(system)` (`V, dV, period(E)`), `phaseStep(M, gamma, q, p, dt)`.
Script check: pendulum period at `E` small tends to `2 pi`; `E = 1` gives `T = 4K(0.5) = 7.4163`.

Example (the pendulum's map): `{system: pendulum, q: 1, show: {contours: true, separatrix: true, ticks: true}, readouts: [E, period],
presets: [{label: Small swing, q: 0.4}, {label: Near the top, q: 3, p: 0}, {label: Spins over, q: 0, p: 2.4}]}`.

```smoke
system: pendulum
q: 1
show: { contours: true, separatrix: true, ticks: true, direction: true }
readouts: [E, period, q, p, gamma, time]
sliders: [gamma]
presets:
  - { label: small, q: 0.4, p: 0, gamma: 0 }
  - { label: spins, q: 0, p: 2.4 }
  - { label: damped, q: 2, p: 0, gamma: 0.3 }
```

```smoke
system: spring
q: 1.5
show: { contours: true, ticks: true }
interactive: false
```

```smoke
system: hill
q: 0.3
p: 0
fixedStart: true
```
