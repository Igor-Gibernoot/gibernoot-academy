# `gauss-charts`
The Gaussians $N(\mu,\sigma^2)$ as one half-plane of distributions seen in two charts (`js/widgets/gauss-charts.js`; svg + plain HTML). Left:
chart $(\mu,\sigma)$; right: chart $(\mu,\sigma^2)$ (axis $0..$`sMax`$^2$). The main point is one distribution, drawn in both; dragging it in either
chart (pointer/touch) moves it in the other, and the density $p(x)$ is drawn below with a dashed mean line and a $\pm\sigma$ bar.
Config: `chart: both|sigma|variance`; `point: {mu, sigma, name?, fixed?, hue?}` (default $\mu=0,\sigma=1$, name p, hue vec); `curves: [..]` fixed extras:
`{mu, sigma, name?, hue?, density?}` (point, with its dashed density), `{path: [[mu,sigma],..], hue?}`, `{segment: {from, to, chart: sigma|variance}, hue?}`
(straight in the named chart, bent in the other); `grid: false|sigma|variance|both` (lines $\sigma=$ const, step `gridStep` 0.5, in blue, and/or
$\sigma^2=$ const, step 1, in orange, drawn in BOTH charts: even in one, uneven in the other); `showDensity` (true); `readout` (true; shows
$\mu,\sigma,\sigma^2$, set false to hide numbers); `muRange` [−3,3], `sMax` 3, `sMin` 0.25, `xRange` [−6,6], `yMax` 1.7, `snap`, `presets: [{label, mu, sigma}]`,
`reset`, `labels: {mu, sigma, variance, density, reset, readout}`. `el.dataset`: `mu`, `sigma`, `var`.
Presets (copy into the lesson):
- `both`: `{point: {mu: 0.5, sigma: 1}}` (free dragging, readout on).
- `sigma-only`: `{chart: sigma, point: {mu: 0, sigma: 1}, readout: false}` (one chart and the density, no numbers).
- `two-points`: `{point: {name: p, mu: -1, sigma: 0.6}, curves: [{name: q, mu: 1, sigma: 1.6}, {segment: {from: [-1, 0.6], to: [1, 1.6], chart: sigma}, hue: gold}], grid: both}`
  (two distributions with their densities; the straight segment in chart $(\mu,\sigma)$ is curved in chart $(\mu,\sigma^2)$).
