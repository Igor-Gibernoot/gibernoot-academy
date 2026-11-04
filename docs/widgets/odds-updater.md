# `odds-updater`
Bayes in odds form (`js/widgets/odds-updater.js`, plain SVG + HTML, all wording from the config): posterior odds
$=$ likelihood ratio $\times$ prior odds. Sliders on log scales: **prior odds** (default $10^{-9}$ to $1$, where $1$
is even odds) and **likelihood ratio** LR ($10^0$ to $10^{12}$). With `witnesses: true` the LR slider is replaced by
**n** independent witnesses (1 to `nMax`) and a **q** slider (chance each reports falsely, log scale), with
$\text{LR} = P(E\mid M)/q^{n}$ (`pEM`, default 1). A **log-odds bar** draws three rows on one axis (0 = even odds =
50%, dashed): prior (blue, from 0), evidence (orange, from the prior to the posterior), posterior (purple, from 0).
Segments past the axis are clipped. **Readout**: prior odds, LR, posterior odds, posterior probability (percent
in the middle range, $\approx 10^{t}$ below $10^{-4}$ odds, $1 - 10^{-t}$ above $10^{4}$). Display only; it reports nothing
to the card.
Config: `prior` (start probability, `1.0e-6`), `lr` (start LR), `witnesses`, `n`, `q` (`1.0e-3`), `pEM`,
`priorMin`/`priorMax` (exponents, $-9$, $0$), `lrMax` ($12$), `nMax` ($10$), `qMin`/`qMax` ($-9$, $-0.3$),
`axisMin`/`axisMax` ($-10$, $12$); hide with `priorSlider`, `lrSlider`, `nSlider`, `qSlider`, `bar`, `ticks`,
`rowLabels`, `marker50`, `reset: false`, `readout: false` or `readout: {prior, lr, odds, prob}` (each true/false;
a hidden control keeps its start value, so a card can fix the LR and let only the prior move);
`labels: {prior, lr, n, q, bar_prior, bar_lr, bar_post, r_prior, r_lr, r_odds, r_prob, even, reset}`;
`presets: [{label, prior, lr | n, q}]` (buttons; omitted fields keep the current value). YAML numbers keep a dot
(`1.0e-6`). Examples:
- Witnesses, toy case: `{witnesses: true, prior: 1.0e-6, n: 1, q: 1.0e-3, presets: [{label: "Two witnesses", n: 2}]}`
  (LR $=10^{3n}$; $n = 2$ gives even odds).
- Worldviews: `{lr: 1000, lrSlider: false, presets: [{label: "Prior 1e-3", prior: 1.0e-3}, {label: "Prior 1e-9", prior: 1.0e-9}]}`.

Smoke presets (mounted by `node tools/widget-smoke.mjs`):

```smoke
prior: 1.0e-6
lr: 1000
presets:
  - {label: "LR 1e6", lr: 1.0e6}
```

```smoke
witnesses: true
prior: 1.0e-9
n: 2
q: 1.0e-3
presets:
  - {label: "n=3", n: 3}
```

```smoke
priorSlider: false
lrSlider: false
ticks: false
marker50: false
rowLabels: false
reset: false
readout: {prob: true}
```
