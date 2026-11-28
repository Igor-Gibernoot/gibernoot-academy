# `lissajous-lab`
A two-dimensional oscillator x = Ax cos(wx t - dx), y = Ay cos(wy t - dy) (Taylor 5.3 form; dx = `phaseX`, default 0, dy = dx + delta). `js/widgets/lissajous-lab.js`, plain SVG + HTML,
all wording from the config. A dot on the xy plane with a fading trail, the complete closed curve optional; the x(t) strip below (time runs down, shares the x axis) and the y(t) strip to the
right (time runs right, shares the y axis), with dashed projection lines from the dot to each strip's "now" dot. Reports nothing to the card.
Readouts: ratio wx : wy in lowest terms (decimal if not rational within `tolerance`, denominators up to 24), delta, curve type (line / circle / ellipse / closed curve / open curve; wx = wy gives
line, circle (Ax = Ay, delta = +-pi/2) or ellipse; a rational ratio otherwise gives a closed Lissajous curve; irrational gives open), period 2 pi q / wy when rational (else the `none` label).
Config: `ax` 1, `ay` 1, `wx` 2, `wy` 3, `delta` 0, `phaseX` 0, `ranges` {ax, ay, wx, wy, delta} as [min, max, step] (defaults amplitudes [0, 1.5, 0.05], w [1, 6, 1], delta [-pi, pi, pi/36]; use a finer
w step to reach open curves; `extent` overrides the plane scale), `window` (time per strip, default two periods of the slower initial w), `trail` (trail length, default window), `curveTime` (span of the
full curve when open, default 10 windows), `timeScale` 1, `time` 0, `autoplay` true, `phaseUnit` 'rad' | 'deg', `units` {time, w}, `tolerance` 1e-4,
`readouts` (ratio, delta, type, period, wx, wy, ax, ay, x, y, time; default ratio, delta, type),
`show` {axes, axisLabels, trail, curve, dot, xStrip, yStrip, xProjection, yProjection, nowDot, labels, readouts, axSlider, aySlider, wxSlider, wySlider, deltaSlider, timeSlider, play, presets}
(all true except curve, timeSlider). `presets: [{label, ax, ay, wx, wy, delta}]` (given fields only). `labels`: x, y, time, ax, ay, wx, wy, delta, timeSlider, ratio, deltaRead, type, period, wxRead, wyRead,
axRead, ayRead, xRead, yRead, timeRead, play, pause, reset, line, circle, ellipse, closed, open, none.
Exported: `ratioOf(wx, wy, tol)` -> `{p, q}` | null; `curveKind({ax, ay, wx, wy, delta, tol})`. Script checks: ratioOf(2, 3) = 2:3; ratioOf(4, 6) = 2:3; ratioOf(1, sqrt 2) = null;
curveKind with wx = wy = 1, ax = ay = 1, delta = pi/2 gives circle.
Example (isotropic, ellipse to line): `{wx: 2, wy: 2, delta: 1.57, show: {xStrip: false, yStrip: false}, readouts: [delta, type]}`.
Example (Lissajous): `{wx: 3, wy: 2, delta: 0.8, show: {curve: true}, readouts: [ratio, period, type]}`.

```smoke
wx: 3
wy: 2
delta: 0.8
show: { curve: true, timeSlider: true }
readouts: [ratio, delta, type, period, wx, wy, ax, ay, x, y, time]
ranges: { wx: [1, 6, 0.05] }
presets: [{ label: Circle, wx: 2, wy: 2, delta: 1.5708 }]
```
