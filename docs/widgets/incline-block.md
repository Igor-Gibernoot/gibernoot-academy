# `incline-block`
A block of mass `m` released from rest on a slope of angle `theta` with static coefficient `mu_s` and kinetic coefficient `mu_k`
(`js/widgets/incline-block.js`, plain SVG + HTML, all wording from the config). The weight splits into `m g sin(theta)` along the slope
(down) and `m g cos(theta)` across it (into the slope); the normal force is `N = m g cos(theta)`. The block slides only if
`tan(theta) > mu_s`, so the critical coefficient is `mu_crit = tan(theta)`. At rest, static friction `f = m g sin(theta)` balances the pull
(net force 0). Sliding: `f = mu_k N`, `a = g (sin(theta) - mu_k cos(theta))`, `v = a t`, `x = a t^2 / 2` (x = distance slid down the slope;
the mass cancels). `mu_k` is kept `<= mu_s` (a slider that would break this drags the other one along). The run replays on every change
(`duration` ms for the window `tmax`); the time marker then stays at the end. Draws: the slope (foot on the left) with the block, four force
arrows (weight grey, normal purple, friction orange, net blue; length proportional to the force, `m g` = 80 px), the two dashed components of
the weight, and plots of `a(t)`, `v(t)`, `x(t)`. The axes are fixed from the largest angle the sliders, start values and presets can reach
(kinetic friction 0 gives the largest `a`), so the curves never rescale. The drawn block stops at the foot after `length` metres.
Exported `inclineModel({angle, mus, muk, mass, g})` is the pure model (`{mucrit, slides, along, across, N, fric, a, net, at(t)}`). Script check
(`g = 9.8`, `mass = 1`): angle 30, `mu_s = 0.5`, `mu_k = 0.2` gives `mu_crit = 0.577`, slides, `a = 3.20 m/s^2`, `f = 1.70 N`, `N = 8.49 N`,
`v(2) = 6.41 m/s`, `x(2) = 6.41 m`; same angle with `mu_s = 0.7` gives no slide, `a = 0`, `f = 4.90 N`; angle 20, `mu_s = 0.3`, `mu_k = 0.1`
gives `a = 2.43 m/s^2`.
Config: `angle: 30`, `mus: 0.5`, `muk: 0.2`, `mass: 1`, `g: 9.8`, `tmax: 2`, `sliders: []` (any of `angle, mus, muk`), `ranges: {angle:[0,60,1],
mus:[0,1.2,0.05], muk:[0,1.2,0.05]}`, `length: 5`, `duration: 3000`, `units: {force, accel, speed, distance, mass}`,
`show: {weight, normal, friction, net, along, across, aPlot, vPlot, xPlot, readouts, labels, replay, grid, cursor, arc}` (all true except `grid`;
`along` and `across` are the dashed components, `aPlot`, `vPlot`, `xPlot` all false = no plots, `arc` = angle arc and value, `cursor` = time
marker and dots, `labels` = letters on the arrows and axis names), `readouts: [mucrit, state, a, v, x, friction, normal, net]` (default
`mucrit, state, a`; `a, v, x` at the time marker), `presets: [{label, angle, mus, muk}]` (only given fields change), `labels: {mucrit, state,
slides, holds, a, v, x, friction, normal, net, accel, speed, distance, time, angle, mus, muk, release, reset, scene, fFric, fNormal, fNet,
fWeight, fAlong, fAcross}` (the `f...` ones are the letters on the arrows). Reports nothing to the card.

Example (find the angle where the block starts to slide; compare ice and rubber):
`{angle: 20, mus: 0.5, muk: 0.3, sliders: [angle, mus, muk], readouts: [mucrit, state, a], presets: [{label: Ice, mus: 0.1, muk: 0.05}, {label: Rubber, mus: 0.9, muk: 0.7}]}`.

```smoke
angle: 30
mus: 0.5
muk: 0.2
sliders: [angle, mus, muk]
readouts: [mucrit, state, a, v, x, friction, normal, net]
presets: [{label: Sticks, mus: 0.7}, {label: Steep, angle: 55}]
```
