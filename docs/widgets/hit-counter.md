# `hit-counter`
How many hits out of $n$ trials count as evidence (`js/widgets/hit-counter.js`, plain SVG + HTML, all wording
from the config). Two sets of **binomial bars** for the hit count $X$ out of $n$: under **chance** (orange, rate
$p_0$, or $p_0 = 1/k$ with $k$ options to choose among) and under a **claimed rate** $p_1$ (blue). Bar heights
are $P(X = x) = \binom{n}{x} p^x (1-p)^{n-x}$, scaled to the tallest visible bar. A dashed **threshold** line
$t$ ("hits needed, fixed in advance", purple) sits between $t-1$ and $t$; drag its handle (or arrow keys, or
the $t$ slider). Bars at or above $t$ are full, the rest faded. **Readout**: hits needed ("5 of 10"),
false-positive rate $P(X \ge t \mid p_0)$, power $P(X \ge t \mid p_1)$ and, when `x` is given, the likelihood
ratio $P(X = x \mid p_1)/P(X = x \mid p_0)$ with a triangle marker under the axis at $x$. Probabilities show as
percent ($10^{-3}$ and above) or $m \times 10^{e}$; tails are exact (log binomial coefficients, summed from
the top). Display only; it reports nothing to the card.

Config: `n` (10), `nMin`/`nMax` (1, 30), `k` (5; omit `k` and give `p0` for a direct chance rate),
`kMin`/`kMax` (2, 10), `p0` (0.2, slider 0.01 to 0.99), `p1` (0.5), `p1Min`/`p1Max` (0.01, 1), `t`
(default $\lceil n/2 \rceil$, clamped to $1..n$), `x` (observed hits; omitted = no marker, no LR row).
Controls: `nSlider`, `kSlider` (k mode), `p0Slider` (rate mode), `p1Slider`, `tSlider`, `xSlider` (only with
`x`), each `false` to hide (the value stays at its start); `locked: [n, k, p0, p1, t, x]` shows a control
disabled (`t` locked also removes the drag handle). Hide parts with `chanceBars`, `claimBars`, `shade` (fading
below $t$), `threshold` (line, label and handle), `handle`, `tLabel`, `observed`, `axis`, `ticks`,
`axisLabel`, `legend`, `reset: false`, `readout: false` or `readout: {t, fp, power, lr}` (each true/false).
`labels: {n, k, p0, p1, t, x, chance, claim, axis, tline, xmark, r_t, r_fp, r_power, r_lr, of, reset}`;
`presets: [{label, n, k, p0, p1, t, x}]` (buttons; omitted fields keep the current value).
Checked numbers ($n = 10$, $p_0 = 1/5$, $p_1 = 1/2$): $P(X\ge4\mid p_0) = 12.1\%$, $P(X\ge5\mid p_0) = 3.28\%$,
$P(X\ge6\mid p_0) = 0.637\%$; power at $t = 5$: $62.3\%$, at $t = 6$: $37.7\%$; LR at $x = 6$: $37.3$.

Smoke presets (mounted by `node tools/widget-smoke.mjs`):

```smoke
n: 10
k: 5
p1: 0.5
t: 5
locked: [n, k]
presets:
  - {label: "Strict t = 6", t: 6}
  - {label: "Loose t = 3", t: 3}
```

```smoke
n: 20
p0: 0.5
p1: 0.65
t: 14
x: 15
labels: {chance: "fair coin", claim: "claimed skill"}
```

```smoke
n: 30
k: 10
p1: 0.3
t: 10
x: 9
nSlider: false
kSlider: false
tSlider: false
claimBars: false
legend: false
axisLabel: false
tLabel: false
readout: {fp: true, lr: true}
reset: false
```
