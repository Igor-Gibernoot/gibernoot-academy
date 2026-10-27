# `belief-mixer`
Prior and evidence combine into a belief (`js/widgets/belief-mixer.js`, plain HTML, no library; all wording
comes from the config, no jargon in the widget). Three blocks: a **slider per cause** for what the reader
expects beforehand (prior), a **slider per cause** for how well that cause explains the sensation (evidence),
and a **bar per cause** with the result, prior $\times$ evidence normalised to add up to $100\%$. Sliders run
$0.02$ to $1$ (never exactly zero, so the bars are always defined). Buttons: **Noisy / Sharp senses** (noisy
raises each evidence value to `noisyPower`, default $0.3$, which flattens it toward "all causes explain it
equally"; sharp uses it as set), Reset, and the presets. Colours by cause: blue, orange, purple.
Config: `causes: [{name, prior, evidence}]` (2 or 3, values in $(0,1]$), `sharp` (start state, default true),
`noisyPower`, `toggle: false` (hide the switch), `markers: true` (a tick on each evidence slider at the
value actually used after the noisy flattening), `labels: {prior, evidence, belief, noisy, sharp, reset}`
(section titles and button texts), `presets: [{label, prior: [..], evidence: [..], sharp}]` (any field may be
omitted to keep the current value). Example "strong prior beats weak evidence":
`{label: "Strong prior, weak evidence", prior: [0.9, 0.1, 0.1], evidence: [0.4, 0.5, 0.5], sharp: false}`.
