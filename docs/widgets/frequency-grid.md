# `frequency-grid`
Bayes by natural frequencies (`js/widgets/frequency-grid.js`, plain HTML, no library; all wording comes from the
config). A grid of $N$ dots (each one case), three sliders (base rate $P(H)$, sensitivity $P(E|H)$, false-positive
rate $P(E|\neg H)$), four colour-coded counts and the posterior $P(H|E)=TP/(TP+FP)$. Dots, in order: true positive
(green, $H$ and $E$), false negative (blue, $H$ no $E$), false positive (red, not $H$ and $E$), true negative (grey).
**Rounding (explicit):** `nH = round(N*prior)`, `TP = round(nH*sens)`, `FN = nH-TP`, `FP = round((N-nH)*fpr)`,
`TN = N-nH-FP` (`Math.round`, halves up). The posterior is computed from these whole-dot counts, so it can differ
slightly from the exact formula (slider readouts show the exact percentages); shown as the `none` label when
$TP+FP=0$.
Config: `N` (1000), `cols` (dots per row, default $\mathrm{round}\sqrt{1.6N}$, 40 for 1000), `prior` (0.01), `sens` (0.9),
`fpr` (0.1) start values; `sliders: {prior|sens|fpr: {value, min, max, step, fixed, hidden}}` (`fixed`: locked at
`value`, slider shown disabled; `hidden`: no slider row; `step` default 0.01, use 0.001 for very rare events);
`labels: {prior, sens, fpr, tp, fn, fp, tn, posterior, formula, reset, none}`;
`show: {grid, counts, posterior, bar, formula}` (defaults true, true, true, false, false; each hides one drawn
element: the dots, the four counts with colour keys, the posterior readout, the bar of TP over TP+FP, the line
`TP / (TP + FP) = a / b = x%`); `reset: false` hides Reset; `presets: [{label, prior, sens, fpr}]` (fixed sliders ignore preset values).
Examples:
- Rare disease test: `{prior: 0.01, sens: 0.9, fpr: 0.09, show: {bar: true, formula: true}, labels: {prior: "Has the disease", sens: "Test positive if ill", fpr: "Test positive if healthy", posterior: "Ill, given positive"}}` (posterior $9/(9+89)\approx 9\%$).
- Old evidence, no update: `{prior: 0.3, sens: 0.6, fpr: 0.6, sliders: {sens: {fixed: true}, fpr: {fixed: true}}}` ($P(E|H)=P(E|\neg H)$, so the posterior equals the prior).
- Only the picture to count by hand: `{show: {counts: false, posterior: false}, sliders: {prior: {hidden: true}, sens: {hidden: true}, fpr: {hidden: true}}}`.
