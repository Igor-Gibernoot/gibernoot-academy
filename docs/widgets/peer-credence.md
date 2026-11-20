# `peer-credence`
Disagreement between two peers (`js/widgets/peer-credence.js`, plain HTML, all wording from the config). Peers A and B
hold credences in one proposition (start sliders, default 0.8 and 0.4). A **rule** says how each revises after hearing
the other: **firm** (keep your own), **split** (both go to the average) or **weighted** (each gives the other weight
$r$: $c_A' = (1-r)c_A + r\,c_B$, $c_B' = (1-r)c_B + r\,c_A$; the $r$ slider is shown only under this rule, $r = 0.5$ is
split, $r=0$ firm). Rows: one bar per peer (blue A, orange B) with a tick at the start credence and the filled bar at the
updated one. **Shared-evidence mode**: if both credences come from independent evidence on a common prior $p_0$, the
pooled odds are $\text{odds}_A\,\text{odds}_B/\text{odds}_0$ (evidence adds on the odds scale; it is not averaged); a
purple row and the pooled odds show it (credences clamped to $[10^{-6}, 1-10^{-6}]$). Display only; reports nothing.
Config: `peers` (names), `a`, `b`, `rule` (`firm|split|weighted`), `rules` (offered subset; one entry fixes the rule),
`r` (0.3), `rMax` (0.5), `prior` (0.5), `evidence` (start on), hide with `ruleToggle`, `peerSliders`, `rSlider`, `rows`,
`bars`, `ticks`, `rowLabels`, `pooledRow`, `reset: false`, `evidenceToggle` (default off; true adds a show/hide button),
`priorSlider` (default off), `readout: false` or `readout: {updated, gap, moved, pooled}`;
`labels: {rule, firm, split, weighted, r, prior, start, updated, pooled, gap, moved, pooled_odds, slider, evidence_on, evidence_off, reset}`
(`{peer}` placeholder in `moved` and `slider`); `presets: [{label, a, b, r, rule, prior}]`.

Smoke presets (mounted by `node tools/widget-smoke.mjs`):

```smoke
peers: ["Ann", "Ben"]
a: 0.8
b: 0.4
rule: split
presets:
  - {label: "Firm", rule: firm}
  - {label: "Weighted", rule: weighted, r: 0.2}
```

```smoke
a: 0.9
b: 0.6
rules: [firm, weighted]
rule: weighted
r: 0.25
rMax: 1
readout: {updated: true, moved: true}
```

```smoke
a: 0.8
b: 0.7
rule: split
evidence: true
evidenceToggle: true
priorSlider: true
prior: 0.5
ruleToggle: false
bars: false
ticks: false
rowLabels: false
reset: false
```
