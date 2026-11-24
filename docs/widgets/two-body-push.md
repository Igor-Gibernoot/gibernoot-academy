# `two-body-push`
Two bodies of masses `m1` and `m2`, at rest, are pushed by a short force pulse `F(t)` of total impulse `J` (`js/widgets/two-body-push.js`,
plain SVG + HTML, all wording from the config). Body 1 (blue, drawn on the right) feels `F1 = F(t)` (plus the external force, if any), body 2
(orange, left) feels `F2 = -r F(t)`, with `r = 1` when the third law holds and `r = ratio` (default 0.5) when it is broken. Then
`p1' = F1`, `p2' = F2` and the total `P = p1 + p2` obeys `P' = (1 - r) F(t) + Fext`. Law on, no external force: `p1 = J`, `p2 = -J`, `P = 0`.
Law broken: `P` drifts to `(1 - r) J`. External force: `P' = Fext`. The external force acts on body 1 only and is constant over the window.
Every change replays one run (`duration` ms for the window `tmax`); the time marker then stays at the end. Draws: track with the two blocks
(block size grows with mass) and force arrows, a plot of `F1(t)`, `F2(t)`, and a plot of `p1(t)`, `p2(t)`, `P(t)` (dashed purple). Axes are
fixed from the largest values the sliders, start values and presets can reach, so curves do not rescale while a slider moves.
Exported `pushModel({m1, m2, J, T, ext, lawOn, ratio, pulse, tmax})` is the pure model (`at(t)`, `rows`, `final`, `Pfinal`). Script check:
`m1 = 1, m2 = 3, J = 2` gives `p1 = 2, p2 = -2, P = 0` (sine or rect pulse); `lawOn: false` (`r = 0.5`) gives `p2 = -1, P = 1`; `ext = 1`, `tmax = 2`
gives `P = 2`; final positions `x1 = 3.5`, `x2 = -1.1667`.
Config: `m1: 1`, `m2: 3`, `J: 2`, `T: 0.5` (pulse length), `ext: 0`, `lawOn: true`, `ratio: 0.5`, `pulse: sine | rect`, `tmax: 2`,
`sliders: []` (any of `m1, m2, J, ext, ratio, T`), `ranges: {m1:[0.5,5,0.5], m2:[0.5,5,0.5], J:[0,4,0.5], ext:[-2,2,0.5], ratio:[0,2,0.1], T:[0.1,1,0.1]}`,
`lawToggle: false` (two buttons: law holds / broken), `duration: 3500`, `xMax` (auto), `units: {mass, impulse, momentum, force, speed}`,
`show: {bodies, arrows, forcePlot, p1, p2, total, readouts, labels, replay, grid, extArrow, cursor}` (all true except `grid`; `p1`, `p2`,
`total` are the three momentum curves, all false hides that plot; `cursor` = time marker and dots), `readouts: [p1, p2, P, v1, v2, vcm, J]`
(default `p1, p2, P`; values at the time marker), `presets: [{label, m1, m2, J, T, ext, ratio, lawOn}]`, `labels: {p1, p2, P, v1, v2, vcm, J, F1, F2,
force, momentum, time, m1, m2, ext, ratio, T, lawOn, lawOff, play, reset, track, body1, body2, extForce}`. Reports nothing to the card.

Example (skater and gun style recoil, law on or broken):
`{m1: 1, m2: 3, J: 2, sliders: [m1, m2, J], lawToggle: true, ratio: 0.5, readouts: [p1, p2, P, v1, v2], presets: [{label: With wind, ext: 1}]}`.

```smoke
m1: 1
m2: 3
J: 2
sliders: [m1, m2, J, ext, ratio, T]
lawToggle: true
readouts: [p1, p2, P, v1, v2, vcm, J]
presets: [{label: Broken, lawOn: false}, {label: Wind, ext: 1}]
```
