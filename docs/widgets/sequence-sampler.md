# `sequence-sampler`
A seeded stream of observations from a hidden rule (`js/widgets/sequence-sampler.js`, plain HTML, no library;
all wording and symbols come from the config). Each observation is outcome A (usual) or B (other). Buttons:
**Observe next**, **Observe 10**, Reset, and the presets. The claim under test is "every observation is A":
it stands until the first B, which is marked by a surprise label and refutes it for good.
Hidden rules: `same` (always A), `change` (A until step `changeAt`, B from then on), `rate` (B with probability `p`
at each step). The same `seed` always gives the same stream.
Config: `rule`, `changeAt` (default 30), `p` (0.1), `seed` (1), `symbols: [A, B]`, `claim` (text next to the flag),
`max` (200, buttons disable), `labels: {next, ten, reset, tally, streak, standing, refuted, surprise, empty}`,
`show: {strip, tally, streak, flag, surprise}` (all default true; each hides one drawn element: the row of
observations, the counts, the current run of A, the stands/refuted line, the marker on the first B),
`presets: [{label, rule, changeAt, p, seed}]` (restart with another rule).
Examples: Hume's Sun
`{rule: "change", changeAt: 37, symbols: ["☀","🌑"], claim: "The Sun rises every day."}`; Popper's swans
`{rule: "rate", p: 0.03, seed: 4, symbols: ["⚪","⚫"], claim: "All swans are white.", show: {streak: false}}`;
only a strip, no verdict: `show: {tally: false, streak: false, flag: false, surprise: false}`.
