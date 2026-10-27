# `dirichlet-counts`
Dirichlet counts of one or more columns $j$ of a likelihood matrix $\mathbf A$ (`js/widgets/dirichlet-counts.js`, plain HTML; all
text from the config; names are markdown inline and may carry `$..$`). Per column (a card) and outcome row $i$: the count
$a_{ij}$ (with `+1` / `−1` buttons if `editable`), a bar for the expected likelihood $\mathbb E[A_{ij}]=a_{ij}/a_{0j}$
($a_{0j}=\sum_i a_{ij}$), and the novelty (parameter information gain, Eq. B.31-B.33), exact and approximate:
$$W_{ij}=D_{KL}\big[\mathrm{Dir}(\mathbf a_{\cdot j}+e_i)\,\|\,\mathrm{Dir}(\mathbf a_{\cdot j})\big]=\ln\frac{a_{0j}}{a_{ij}}+\psi(a_{ij}+1)-\psi(a_{0j}+1)\approx\frac1{2a_{ij}}-\frac1{2a_{0j}}.$$
$\psi$ (digamma) by recurrence plus asymptotic series (exported `psi`, `noveltyExact`, `noveltyApprox`).
Config: `outcomes: [names]`; `columns: [{name, a: [counts], truth: [probs]}]` (`truth` only for sampling); `editable`;
`observe: true` (buttons "observe outcome $o$" applying $\mathbf a\leftarrow\mathbf a+\mathbf o\otimes\mathbf s$: column $j$ gains $s_j$),
with `beliefs: [{label, s: [per column]}]` choosing $\mathbf s$ (default one-hot per column; one column: no choice);
`sample: true` (a button per column drawing an outcome from `truth`, seeded stream `seed`, added with a one-hot belief);
`options: [{name, s, o?}]` ("where to look"): bars of the expected novelty $\mathbf o\cdot\mathbf W\mathbf s=\sum_j s_j\sum_i o_iW_{ij}$
with $\mathbf o=\mathbb E[\mathbf A]\mathbf s$ unless `o` is given, best option starred; `visitNext: true` (button: take the option
of largest expected novelty, ties to the first, draw its outcome from `truth` of the column of largest $s$, add it with
belief $s$; no preferences, so inhibition of return emerges: tiles 1,2,3,4,1,... with equal start counts);
`showExpected`, `showNovelty`, `showApprox`, `showOptions` (default true), `minCount` (0.05), `labels: {counts, expected,
novelty, approx, observe ({o}), belief, sample ({name}), visit, options, reset, update, last}`,
`presets: [{label, columns: [{a}]}]` (reset the counts). `el.dataset`: `a`, `w`, `wapprox`, `opts` (columns joined by ` | `).
Presets (copy into the lesson):
- `coin`: `{outcomes: [heads, tails], columns: [{name: coin, a: [1, 1], truth: [0.7, 0.3]}], editable: true, observe: true, sample: true,
  options: [{name: flip the coin, s: [1]}], labels: {sample: "Flip the {name}"}}` ($W=0.193$, approx. $0.25$).
- `two-coins`: `{outcomes: [heads, tails], columns: [{name: "coin A (5 flips)", a: [3, 4], truth: [.5, .5]}, {name: "coin B (100 flips)",
  a: [53, 49], truth: [.5, .5]}], sample: true, options: [{name: flip coin A, s: [1, 0]}, {name: flip coin B, s: [0, 1]}]}`
  (expected novelty $0.066$ vs $0.005$; the 5-flip coin teaches 13 times more).
- `tiles`: 4 columns `a: [1, 1]`, `truth` per tile, `options` one per tile (`s` one-hot), `visitNext: true`, no `observe`.
