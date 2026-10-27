# `policy-scorer`
Scores 2 to 4 policies by expected free energy (`js/widgets/policy-scorer.js`, plain HTML, no library; all wording and
numbers from the config). Per policy $\pi$, bars in nats on one shared scale: **risk**
$D_{KL}[Q(\tilde y\mid\pi)\parallel P(\tilde y\mid C)]$, **ambiguity** $\mathbb{E}_{Q(\tilde x\mid\pi)}H[P(\tilde y\mid\tilde x)]$,
$G=\text{ambiguity}+\text{risk}$ (Eq. 2.6; minimised, never negated). In states mode also the second form
$G=-\text{information gain}-\text{pragmatic value}$, with pragmatic value $\mathbb{E}_{Q(\tilde y\mid\pi)}[\ln P(\tilde y\mid C)]$ and
information gain $\mathbb{E}_{Q(\tilde x,\tilde y\mid\pi)}D_{KL}[Q(\tilde x\mid\tilde y,\pi)\parallel Q(\tilde x\mid\pi)]$ (computed directly, not as
$H[Q(\tilde y\mid\pi)]-\text{ambiguity}$; the $G$ readout then reads "$G=-\text{gain}+\text{cost}$", and the two forms agree to
rounding). Then the policy probabilities $\sigma(-\gamma G)$ with a $\gamma$ slider (the precision over policies, Eq. B.13),
and the lowest-$G$ policy gets a green frame and a badge.
Two modes. **qy mode**: `policies: [{name, qy, ambiguity}]` (`qy` normalised; `ambiguity` in nats, default 0); the second
form is hidden and a note says it needs states. **States mode**: `states: [names]`, `likelihood: [[P(y_k|x_j)]_k per
state]` (rows normalised; a policy may carry its own `likelihood`), `policies: [{name, qx}]`; qy and ambiguity are computed.
Config: `outcomes: [labels]`, `C: [..]` (P(y|C), normalised), `editable: true` (a slider per outcome, or per state in
states mode, kept normalised), `gamma` (start, default 1), `gammaMax` (8), `unit`, `labels: {risk, ambiguity, g,
pragmatic, epistemic, prob, gamma, lowest, reset, prefs, needsStates}`, `presets: [{label, gamma, policies: [{qy | qx}]}]`
(by policy order; fields optional). Flags, each default true, to reveal pieces step by step: `showRisk`,
`showAmbiguity`, `showG`, `showPragmatic`, `showEpistemic` (both only in states mode), `showProb`, `showGamma`,
`showPrefs` (the "Preferences: ..." line).
Example (pond and orchard): `{outcomes: [jumps, still], C: [0.8, 0.2], states: [frog, apple], likelihood: [[0.9, 0.1],
[0.1, 0.9]], policies: [{name: pond, qx: [0.8, 0.2]}, {name: orchard, qx: [0.1, 0.9]}]}` gives $Q(\text{jumps})=0.74,\,0.18$;
ambiguity $0.325$ for both; risk $0.011,\,0.889$; $G=0.336,\,1.214$; gain $0.248,\,0.146$; pragmatic value $-0.584,\,-1.360$
($-0.248+0.584=0.336$); at $\gamma=1$, $P(\pi)=0.706,\,0.294$.
