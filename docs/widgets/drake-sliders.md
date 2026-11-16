# `drake-sliders`
A product of factors with log sliders (`js/widgets/drake-sliders.js`, plain SVG + HTML, all wording from the config).
Default: the seven Drake factors $R_*, f_p, n_e, f_l, f_i, f_c, L$ (any list works) and
$N = \prod$ factors, live on a **log bar** (axis $10^{-10}$ to $10^{10}$, dashed marker at $N = 1$; bar turns from
blue to purple when $N \ge 1$). Optional **preset buttons** (`values`, one number per factor) and an optional
**distribution view**: each factor has a log-uniform range (`low`, `high`, default its slider range); a seeded
Monte Carlo (`draws`, `seed`, reproducible) fills a histogram of $\log_{10} N$ (bins left of $N=1$ blue, right purple),
with the **median** and the **share of draws with $N<1$**, and an **interval** readout (smallest and largest $N$:
product of lows, product of highs). The histogram does not follow the sliders. Display only.
Config: `factors: [{name, min, max, start, unit, low, high}]` (min/max/start/low/high are plain positive numbers, YAML
needs a dot in `1.0e-3`; `name` takes inline math; `start` defaults to the geometric middle), `axisMin`/`axisMax`,
`draws` (20000), `seed` (7), `binWidth` (1 decade), `presets: [{label, values}]`, `labels: {n, bar_axis, one, median,
fraction, interval_min, interval_max, hist, reset}`. Hide with `sliders`, `factorValues`, `names`, `bar`, `ticks`,
`marker1`, `nReadout`, `presets`, `reset`, `median`, `fraction` (all `false`); `histogram` and `interval` are **off by
default** (`true` to show). A hidden slider group keeps the start values (so a card can show only the histogram).
Examples:
- Live N: `{factors: [...7 with min/max/start], presets: [{label: "Pessimist", values: [1,0.2,0.1,1.0e-3,1.0e-3,0.01,100]}, {label: "Optimist", values: [3,1,1,1,1,0.5,1.0e8]}]}`
  (N $= 2\times10^{-8}$ and $1.5\times10^{8}$).
- Distribution only: `{sliders: false, factorValues: false, bar: false, nReadout: false, histogram: true, interval: true}`.

Smoke presets (mounted by `node tools/widget-smoke.mjs`):

```smoke
factors:
  - {name: "$R_*$", min: 0.1, max: 10, start: 1, unit: "/yr"}
  - {name: "$f_p$", min: 0.01, max: 1, start: 0.2}
  - {name: "$n_e$", min: 0.01, max: 1, start: 0.1}
  - {name: "$f_l$", min: 1.0e-3, max: 1, start: 1.0e-3}
  - {name: "$f_i$", min: 1.0e-3, max: 1, start: 1.0e-3}
  - {name: "$f_c$", min: 0.01, max: 1, start: 0.01}
  - {name: "$L$", min: 100, max: 1.0e8, start: 100, unit: "yr"}
presets:
  - {label: "Pessimist", values: [1, 0.2, 0.1, 1.0e-3, 1.0e-3, 0.01, 100]}
  - {label: "Optimist", values: [3, 1, 1, 1, 1, 0.5, 1.0e8]}
```

```smoke
histogram: true
interval: true
draws: 5000
seed: 3
sliders: false
factorValues: false
bar: false
nReadout: false
```

```smoke
bar: false
ticks: false
marker1: false
names: false
reset: false
nReadout: false
```
