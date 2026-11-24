# `polar-motion`
A particle moving in the plane, described by polar coordinates `r(t)` (distance from `O`) and `phi(t)` (angle up from the x axis; Taylor's symbol, `js/widgets/polar-motion.js`, plain SVG + HTML, all wording from the config). The path is built from constant second derivatives: `r = r0 + rd0 t + rdd t^2/2`, `phi = phi0 + w0 t + alpha t^2/2` (`phi0` in degrees, `w0 = phi-dot` in rad/s, `alpha = phi-double-dot`). Circle at steady speed: `rd0 = rdd = alpha = 0`; spiral: `rd0` and `w0` both nonzero; radial line: `w0 = alpha = 0`. Keep `r > 0` over the window.
Unit vectors `r-hat = (cos phi, sin phi)` and `phi-hat = (-sin phi, cos phi)` are drawn at the particle and turn as it moves. Velocity `v = rd r-hat + r phid phi-hat`; acceleration `a = (rdd - r phid^2) r-hat + (r phidd + 2 rd phid) phi-hat`. The four terms (`rdd`, `-r phid^2`, `r phidd`, `2 rd phid`) are drawn as arrows, radial ones stacked head to tail along `r-hat`, angular ones along `phi-hat`, each stack a few px to the side of the particle. Time runs from 0 to `tmax` (replayed over `duration` ms on every change; the marker then stays at the end; optional time slider).
Exported `polarModel({r0, rd0, rdd, phi0, w0, alpha}).at(t)` is the pure model (`{r, rd, rdd, phi, phid, vr, vphi, speed, ar, aphi, acc, cent, phidd, cor, x, y, vx, vy, ax, ay}`). Script check: `r0 = 2`, `w0 = 3` gives `a_r = -18`, `a_phi = 0`, speed 6; Cartesian second differences of `x(t), y(t)` agree with `ax, ay` for a spiral with all six parameters nonzero; `r0 = 1, rd0 = 1, w0 = 0` has `a = 0`.
Config: `r0: 2`, `rd0: 0`, `rdd: 0`, `phi0: 0`, `w0: 1`, `alpha: 0`, `tmax: 6`, `duration: 6000`, `sliders: []` (any of `r0, rd0, rdd, phi0, w0, alpha`), `ranges: {r0:[0.5,3,0.1], rd0:[-1,2,0.1], rdd:[-1,1,0.1], phi0:[0,360,5], w0:[-3,3,0.1], alpha:[-2,2,0.1]}`, `scale`, `vscale`, `ascale` (px per unit; automatic from the start values and presets: largest `r` fills the frame, longest `v` and `a` about 70 px, so set them to keep a card's arrows readable), `unitLength: 40`, `units: {length, time}`, `terms: {rdd, cent, phidd, cor}` (initial on/off of the four term arrows, all true), `toggles: []` (which of the four get a checkbox), `show: {axes, origin, fullPath, trail, position, arc, unit, velocity, vComps, accel, aComps, termArrows, labels, readouts, replay, scrub, particle}` (all true except `position` (line from O), `arc` (angle phi), `vComps` (dashed v_r, v_phi), `aComps` (dashed a_r, a_phi), `scrub` (time slider); `unit` = r-hat and phi-hat, `termArrows` = the four term arrows, `labels` = letters on arrows), `readouts: [r, phi, vr, vphi, ar, aphi]` (any of `r, phi, rd, phid, vr, vphi, speed, ar, aphi, rdd, cent, phidd, cor, acc`, values at the time marker; phi in degrees), `presets: [{label, r0, rd0, rdd, phi0, w0, alpha}]` (only given fields change), `labels` (readout, checkbox, slider and button names, markdown math allowed: `r, phi, rd, phid, vr, vphi, speed, ar, aphi, rdd, cent, phidd, cor, acc, r0, rd0, rddS, phi0, w0, alpha, play, reset, scene, time`; plain letters in the picture: `rhat, phihat, v, a, termRdd, termCent, termPhidd, termCor, fvr, fvphi, far, faphi`, with `x_y` drawing a subscript). Reports nothing to the card.

Example (steady circle: does it accelerate? only the centripetal term is on):
`{r0: 2, w0: 1, tmax: 6.3, show: {velocity: true, accel: true, termArrows: false}, readouts: [vphi, ar, aphi]}`.

```smoke
r0: 1
rd0: 0.3
w0: 1.2
tmax: 4
sliders: [r0, rd0, w0, alpha]
toggles: [rdd, cent, phidd, cor]
show: {vComps: true, aComps: true, position: true, arc: true, scrub: true}
readouts: [r, phi, vr, vphi, ar, aphi, rdd, cent, phidd, cor]
presets: [{label: Circle, rd0: 0, w0: 1, alpha: 0}, {label: Radial, w0: 0, phi0: 30}, {label: Speeding up, rd0: 0, alpha: 0.5}]
```
