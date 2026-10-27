# `pomdp-lab`
A small discrete-time model (POMDP) you can edit, generate from and invert (`js/widgets/pomdp-lab.js`, HTML bars + SVG
curve; all wording from the config). Matrices as editable heat-grids: $\mathbf A$ (rows = outcomes, columns = states),
$\mathbf B_u$ (rows = next state, columns = current state, one grid per action, switch with the action buttons), $\mathbf D$
(initial prior); every column is a probability vector (editing a cell rescales the rest of its column; text field, `0.3` or
`0,3`). Time steps $\tau=1..T$; a **policy** = one action per transition ($T-1$ actions). Book signs, nothing flipped: $F$ and $G$ are
minimised and
$$F_\pi=\sum_\tau F_{\pi\tau},\quad F_{\pi\tau}=\mathbf s_{\pi\tau}\cdot\big(\ln\mathbf s_{\pi\tau}-\ln\mathbf A\cdot o_\tau-\ln\mathbf B_{\pi,\tau-1}\mathbf s_{\pi,\tau-1}\big),\ \mathbf s_{\pi,0}:=\mathbf D,$$
$$G_{\pi\tau}=\mathrm{KL}[\mathbf A\mathbf s_{\pi\tau}\,\|\,\mathbf C]+\mathbf H\cdot\mathbf s_{\pi\tau},\quad \pi=\sigma(-\mathbf G-\mathbf F),$$
$H_j=-\sum_o A_{oj}\ln A_{oj}$ (ambiguity), $\mathbf C$ = preferred outcome probabilities (normalised), $G$ summed over steps
$\ge$ `gFrom` (default 2). **Mode `generate`**: policy buttons; *Sample a trajectory* draws (seeded; each press a new draw) the true state
path and the outcomes; *Predict* shows, per step, bars of $\mathbf s_{\pi\tau}=\mathbf B_{\pi,\tau-1}\mathbf s_{\pi,\tau-1}$, bars of the
predicted outcomes $\mathbf A\mathbf s_{\pi\tau}$ and the ambiguity $\mathbf H\cdot\mathbf s_{\pi\tau}$. **Mode `infer`**: a select per step sets the
observed outcome ($-$ = not observed: flat likelihood); *Play / Step / Reset* run the Euler flow
$\mathbf v'=-\nabla_{\mathbf s}F_\pi$, $\mathbf s=\sigma(\mathbf v)$ (step-size slider `dt`) from uniform beliefs: the bars of
$\mathbf s_{\pi\tau}$ move, the $F_\pi$ curve falls (it never rises for small `dt`: the gradient is exact, including the term
through $\mathbf s_{\pi,\tau+1}$), thick ticks = the exact posterior (forward-backward), with the largest gap printed. The flow
converges to a minimum of this $F$, **not exactly** the exact posterior (beliefs about neighbouring steps are treated as
independent: close for noisy dynamics, far for near-deterministic ones with ambiguous data); with no observations it converges to
the forward prediction. *Use the sampled outcomes* copies the last sample into the observations. Below: for every policy the
converged $F_\pi$, $G_\pi$ and $\pi=\sigma(-\mathbf G-\mathbf F)$ (best policy outlined).
Config: `states`, `outcomes`, `actions` (labels, markdown inline; actions default to the keys of `B`), `short: {states, outcomes}` (short names
for bars and headers; default first 3 characters), `A` (rows = outcomes), `B: {actionLabel: matrix}`, `D`, `C`, `T` (3),
`policies: [[actionLabel, ...]]` (default: each action repeated), `policy` (initially selected), `gFrom`, `modes` (default
both, order = tabs), `mode` (start), `obs` (outcome index or -1 per step), `editable` (false = read-only grids), `seed`, `dt`
(.25), `maxIter` (200), flags `showA/showB/showD/showAmbiguity/showExact/showCurve/showPolicies` (true),
`labels: {generate, infer, policy, sample, predict, play, pause, step, reset, stepSize, iter, observe, none, useSample,
ambiguity, trueState, drawn, exact, free, expected, post, grids, nothing}`, `presets: [{label, ...any key above}]` (buttons
replace the whole model). `el.dataset`: `mode`, `policy`, `iter`, `F`, `s`, `exact` (JSON, step by outcome), `pi`, `g`, `fs`
(per policy), `path`, `outs` (last sample).
Presets used by the lessons: **door** (states closed/open; outcomes looks closed/looks open, sensor 0.8; actions push, wait; $\mathbf D=(0.9,0.1)$; $\mathbf C$ prefers
"looks open"; $T=3$, four policies) and **tmaze** (6 states = location cue/left arm/right arm $\times$ reward side; outcomes cue
says left/right, reward, no reward; actions cue, left, right; start at the cue, $T=3$, policies cue-left, cue-right, left-left, right-right). The Level 7 lesson `decision-planning` does not use this 6-state preset: it writes its own 8-state T-maze (4 places middle/cue/left/right $\times$ 2 contexts) in the lesson's widget config.
Example: `{mode: infer, obs: [0, 1, 1], showA: false, showB: false, showD: false, states: [closed, open], outcomes: [looks closed, looks open],
A: [[.8, .2], [.2, .8]], B: {push: [[.2, .05], [.8, .95]], wait: [[.9, .1], [.1, .9]]}, D: [.9, .1], C: [.2, .8]}`.
