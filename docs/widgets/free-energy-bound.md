# `free-energy-bound`
Variational free energy as a bound on surprise (`js/widgets/free-energy-bound.js`, plain HTML, no library; all
wording and numbers from the config). One hidden cause $x$ with $K = 2$ to $4$ values, one observed $y$. The prior
$P(x)$, the likelihood $P(y\mid x)$ and the start of $Q$ are fixed by the config. A **slider per cause** sets the
approximate posterior $Q(x)$, kept normalised (moving one slider rescales the others in proportion; each shows
its $\%$). Bars, in nats and on a fixed scale (the largest $F$ reachable at the current model): the **free
energy** $F=\sum_x Q(x)\,[\ln Q(x)-\ln P(x)-\ln P(y\mid x)]$, the **surprise** $-\ln P(y)$ with
$P(y)=\sum_x P(x)P(y\mid x)$, and the **gap** $F-\text{surprise}=D_{KL}[Q(x)\parallel P(x\mid y)]\ge 0$. A
dashed tick on the $F$ bar marks the surprise (the bar never ends left of it). Same signs as Eq. 2.5: $F$ is
minimised, $F\ge-\ln P(y)$. Buttons: **Set Q = exact posterior** (gap goes to $0$, $F$ meets the tick), Reset,
presets.
Config: `causes: [{name, prior, likelihood}]` (prior normalised, likelihood in $(0,1]$), `q: [..]` (start $Q$,
default uniform), `observation` (line naming the observed $y$), `unit` (`nats`),
`labels: {observation, q, f, surprise, gap, exact, reset, prior, likelihood}`, `presets: [{label, q, prior,
likelihood}]` (any field optional; `q: exact` sets the exact posterior; a preset may change the model but not $K$).
Hide parts to reveal them step by step: `showF`, `showSurprise` (also drops the tick), `showGap`, `showQ`
(bars only, presets still set $Q$), `showModel` (the "prior / likelihood" line under each slider) and `exact`,
each `false`. Example (garden): `{observation: "you hear a rustle", causes: [{name: cat, prior: 0.6, likelihood:
0.2}, {name: dog, prior: 0.3, likelihood: 0.5}, {name: fox, prior: 0.1, likelihood: 0.9}], presets: [{label: "Q =
prior", q: [0.6, 0.3, 0.1]}]}` gives $P(y)=0.36$, surprise $1.02$ nats, exact posterior $(0.33, 0.42, 0.25)$,
$Q=$ prior has $F=1.18$ (gap $0.16$).
