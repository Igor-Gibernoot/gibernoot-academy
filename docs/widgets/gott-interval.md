# `gott-interval`
Gott's Copernican-duration argument (`js/widgets/gott-interval.js`, plain SVG + HTML, wording from the config, display only).
A **timeline** of a span of length $T$ with a draggable **now** marker at the fraction $f$ elapsed ($t_\text{past} = fT$).
For confidence $c$ the future lies between $t_\text{past}\,\frac{1-c}{1+c}$ and $t_\text{past}\,\frac{1+c}{1-c}$
(95%: $1/39$ and $39$ times $t_\text{past}$), drawn as an **interval bar** after now (clipped with an arrow at the end of the
span), a **true-end marker** at $T$ (green if the interval covers the true future $T-t_\text{past}$, red if not; covered exactly when
$(1-c)/2 \le f \le (1+c)/2$). The optional **Monte Carlo panel** draws $N$ uniform observation moments per click (seeded,
cumulative), with share covered (tends to $c$), tally and a bar with the $c$ marker.
Config: `span` (100), `unit`, `f` (0.3), `c` (0.95), `cMin`/`cMax` (0.5/0.99), `draws` (1000), `seed` (7),
`labels: {now, end, past, future, interval, tPast, lower, upper, factors, trueFuture, covered, yes, no, f, c, mc, draw, coverage, tally, expected, reset}`.
Hide with `false`: `timeline`, `past`, `nowMarker`, `interval`, `endMarker`, `ticks`, `verdict`, `dragNow`, `fSlider`, `readouts`, and the rows
`tPast`, `lower`, `upper`, `factors`, `trueFuture`, `covered`. Off by default (`true` to show): `cSlider`, `monteCarlo` (inside it `mcButton`,
`mcCoverage`, `mcTally`, `mcBar`, each `false` to hide).
Examples:
- Gott card: `{span: 100, unit: "years", f: 0.3}` plus `cSlider: true` to vary the confidence.
- Coverage only: `{timeline: false, readouts: false, fSlider: false, monteCarlo: true}`.

Smoke presets (mounted by `node tools/widget-smoke.mjs`):

```smoke
span: 13.8
unit: "Gyr"
f: 0.3
c: 0.95
cSlider: true
monteCarlo: true
```

```smoke
span: 200
f: 0.6
fSlider: false
readouts: false
verdict: false
interval: true
```

```smoke
timeline: false
fSlider: false
readouts: false
monteCarlo: true
draws: 500
mcTally: false
```
