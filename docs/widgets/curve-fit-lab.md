# `curve-fit-lab`
Underdetermination of theory by data (`js/widgets/curve-fit-lab.js`, SVG, no library; all wording from `labels`).
Draggable data points; least-squares polynomial fits of several degrees at once; residuals; a held-out x where the
curves disagree; the simplest curve that fits within a tolerance. Solver: x mapped to [-1,1], Chebyshev basis, QR by
modified Gram-Schmidt (twice); dependent columns dropped, so degree >= number of points just interpolates (readout
shows the effective degree). Interactions: drag a point; tap empty plane adds one; double-tap a point removes it;
buttons Add (in the widest gap, y = `truth` + noise or random), Remove (last), Jitter (seeded noise), Reset.
Config: `points [[x,y]]`, `xRange` [0,10], `yRange` [-3,3], `degree` (main, slider) 2, `degreeRange` [1,8], `compare` (extra degrees
drawn too), `tolerance` 0.3 (fits = RMS gap <= tolerance; simplest = lowest degree in `degreeRange` that fits), `holdout` x (null = none),
`noise` 0.3, `seed` 1, `truth` (ascending polynomial coefficients), `edit` true (false: fixed points), `lockX` false,
`labels: {degree, tolerance, rms, holdout, spread, simplest, none, add, remove, jitter, reset, nofit, curve, x, y}`,
`show: {points, curves, residuals, holdout, simplest, slider, tolerance, readout, legend, axes, buttons}` (all true except
`residuals`, `simplest`, `tolerance`). Each hides one element: dots; every fitted curve; vertical gaps to the main fit; the dashed
holdout line + predictions + spread; the gold highlight and readout line of the simplest fit; the degree slider; the tolerance slider;
per-degree RMS lines; colour keys; axis lines; the button row. `presets: [{label, points, degree, compare, tolerance, holdout}]`.
`el.dataset`: `degree`, `n`, `simplest`, `rms`, `holdSpread`.
Examples: five points, three theories
`{points: [[1,0.2],[3,1.1],[5,0.9],[7,2.1],[9,1.8]], degree: 1, compare: [2,4], holdout: 10, xRange: [0,10.5], show: {simplest: true}}`;
data only `{show: {curves: false, readout: false, legend: false, slider: false, buttons: false}}`.
