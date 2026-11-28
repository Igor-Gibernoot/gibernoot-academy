# `damped-regimes`
The free damped oscillator in Taylor's notation (5.4): x'' + 2 beta x' + w0^2 x = 0, beta = b/2m, w1 = sqrt(w0^2 - beta^2). `js/widgets/damped-regimes.js`, plain SVG + HTML, all wording
from the config. A slider on the ratio beta/w0 (default 0 to 3) crosses underdamped (beta < w0), critical (beta = w0, x = (C1 + C2 t) e^{-beta t}) and overdamped
(r = -beta +- sqrt(beta^2 - w0^2), x = C1 e^{r1 t} + C2 e^{r2 t}). The x(t) curve sweeps in time (marker at "now"), optional dashed envelope +-A e^{-beta t} (underdamped, x = A e^{-beta t} cos(w1 t - delta)),
the two dashed exponentials (overdamped), a phase inset of (x, v/w0) (circle when undamped, spiral under, node over), a regime label and a legend. Reports nothing to the card.
Time unit: w0 = `w0` (default 1) so the window is in 1/w0. Scales are fixed (largest |x| over all ratios for the initial x0, v0, so a larger start is clipped; `yMax` overrides) so nothing jumps when a slider moves.
Taylor's decay time is 1/beta (time for the AMPLITUDE to fall to 1/e); the energy falls to 1/e in 1/(2 beta) (readout `energyTime`); Q = w0/(2 beta). Zero crossings are exact (closed form), counted in the window.
Numerics: x = e^{-beta t}(x0 C + (v0 + beta x0) S) with C, S = cos / sin(s t)/s, or cosh / sinh(s t)/s, s^2 = |w0^2 - beta^2|, and the series (C -> 1, S -> t) when s^2 t^2 < 1e-3: no 0/0 at beta = w0.
Near critical the two overdamped exponentials are huge and cancel; they are clipped to the plot (the regime is critical within `tolerance` of beta/w0 = 1, where they are not drawn).
Config: `w0` 1, `ratio` 0.2, `x0` 1, `v0` 0, `window` (default 8 pi / w0), `yMax`, `tolerance` 0.005, `timeScale` 1, `autoplay` true, `holdTime` 1, `ranges` {ratio [0, 3, 0.05], x0 [-1.5, 1.5, 0.05], v0 [-3, 3, 0.05]},
`units` {time, w, x}, `readouts` (ratio, beta, w0, w1, decay, energyTime, period, q, crossings, regime, r1, r2, x, v, time; default regime, beta, w1, decay, crossings),
`show` {axes, axisLabels, curve, futureCurve, dot, envelope, exponentials, phase, phaseAxes, phaseTrail, regime, legend, labels, readouts, ratioSlider, x0Slider, v0Slider, timeSlider, play, presets}
(all true except timeSlider). `presets: [{label, ratio, x0, v0}]` (given fields only, restarts the sweep). `labels`: x, time, phaseX, phaseV, ratioSlider, x0Slider, v0Slider, timeSlider, ratioRead,
beta, w0, w1, decay, energyTime, period, q, crossings, regime, r1, r2, xRead, vRead, timeRead, play, pause, reset, under, critical, over, none, infinite, envelope, exp1, exp2, xCurve.
w1, period, r1, r2 show the `none` label where they do not exist. Hiding `phase` also shrinks the figure; with `phase` off the regime label sits under the plot.
Exported: `damped({w0, beta, x0, v0})` -> `{x(t), v(t), kind, w1, A, delta, period, r1, r2, C1, C2}`, `regimeOf(ratio, tol)`, `zeroCrossings(p, T)`.
Script checks (run): critical x matches (C1 + C2 t) e^{-beta t} to 0; beta = w0 (1 +- 1e-12) agrees with beta = w0 to 1e-11 (no blow-up); v matches a finite difference; zero crossings match a 200000-point count
(8, 1, 1, 8 on four cases).
Example (all three): `{ratio: 0.3, readouts: [regime, beta, w1, decay, period, q, crossings]}`. Example (overdamped only, no phase): `{ratio: 2, show: {phase: false}, readouts: [r1, r2]}`.

```smoke
ratio: 0.4
x0: 1
v0: 0.5
readouts: [ratio, beta, w0, w1, decay, energyTime, period, q, crossings, regime, r1, r2, x, v, time]
show: { timeSlider: true }
presets: [{ label: Critical, ratio: 1 }, { label: Over, ratio: 2.5, v0: -2 }]
```
