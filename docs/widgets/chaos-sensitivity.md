# `chaos-sensitivity`
Two nearby starting states under one deterministic map (`js/widgets/chaos-sensitivity.js`, plain SVG + HTML, wording
from the config). Default map: logistic, $x \to r\,x(1-x)$, iterated `steps` times from $x_0$ (state **a**, blue) and
$x_0 + \text{gap}$ (state **b**, orange). Two plots: the **time series** of both states, and the **gap**
$|x_a - x_b|$ on a log scale ($10^{-16}$ to $1$) against the step, with a dashed threshold line and a dot where the
gap first exceeds it. Sliders: **start gap** (log, default $10^{-12}$ to $10^{-1}$) and **r** (2.5 to 4). Readout: the
first step where the gap exceeds `threshold`, the gap at the last step, the start gap, r. Display only.
All numbers are IEEE **double precision** (about 16 digits): a gap below $\sim 10^{-16}$ is the same number, and the gap plot
floors at $10^{-16}$. With `map: doubling` ($x \to 2x \bmod 1$, no r slider) the machine loses one bit per step, so a state
falls to 0 after about 53 steps; keep `steps` below that.
Checked values (independent Python script, $x_0 = 0.2$, $r = 3.9$, threshold $0.1$): gap $10^{-3}$ first exceeds it at step 8, $10^{-6}$ at
step 22, $10^{-9}$ at step 33, $10^{-12}$ at step 44 (about 3.7 steps per decade of gap). At $r = 2.8$ the gap shrinks to $\lesssim 10^{-16}$ and never diverges.
Config: `map`, `r` (3.9), `rMin`/`rMax` (2.5, 4), `rStep`, `x0` (0.2), `gap` (`1.0e-6`, YAML keeps the dot),
`gapMin`/`gapMax` (exponents, $-12$, $-1$), `steps` (60), `threshold` (0.1); hide with `series`, `gapPlot`,
`thresholdLine`, `axisLabels`, `legend`, `rSlider`, `gapSlider` (hidden keeps the start value), `reset: false`,
`readout: false` or `readout: {first, final, gap, r}`;
`labels: {r, gap, series, gapPlot, a, b, threshold, step, first, final, gapRead, rRead, never, reset}`;
`presets: [{label, r, gap, x0}]` (buttons; omitted fields keep the current value). Example:
`{r: 3.9, gap: 1.0e-6, presets: [{label: "Regular r = 2.8", r: 2.8}, {label: "Gap 1e-12", gap: 1.0e-12}]}`.

Smoke presets (mounted by `node tools/widget-smoke.mjs`):

```smoke
r: 3.9
gap: 1.0e-6
presets:
  - {label: "Regular r = 2.8", r: 2.8}
  - {label: "Gap 1e-12", gap: 1.0e-12}
```

```smoke
map: doubling
x0: 0.3
gap: 1.0e-9
steps: 40
legend: false
thresholdLine: false
readout: {first: true}
```

```smoke
series: false
rSlider: false
gap: 1.0e-12
axisLabels: false
reset: false
labels: {gap: "Initial difference"}
```
