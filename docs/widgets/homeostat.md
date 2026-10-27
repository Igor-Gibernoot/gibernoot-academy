# `homeostat`
A creature keeps a body value (default temperature) inside a safe band (`js/widgets/homeostat.js`, plain HTML,
no library; all wording from the config). A scale shows the safe band (green), the body value (blue), the
creature's expectation (orange) and the room value (purple, the body drifts toward it). Readouts: sensed value,
expectation, room, a **mismatch bar** (|expectation - sensed|) and an **in/out of the safe band** flag. A slider
sets the expectation. Levers (each press is one time step, after which the body drifts toward the room):
**belief** moves the expectation a fraction `beliefRate` toward the sensed value (changing its mind), **act**
moves the body a fraction `actRate` toward the expectation (changing the world), optional **wait** only lets time
pass. Moving the slider cancels a running preset.
Config: `range: [0,50]`, `band: [35,39]`, `room`, `body`, `expect` (start values), `drift` (0.08), `beliefRate`,
`actRate` (0.8), `unit`, `step`, `decimals`, `bandLabel` (legend text of the green zone),
`labels: {body, sensed, expect, room, mismatch, slider, inBand, outBand, belief, act, wait, reset, steps}` (`wait`
empty = no wait button), `presets: [{label, body, expect, room, script: ['belief'|'act'|'wait', ...]}]` (sets the
state, then plays the script one step per 0.7 s). Example: `{label: "Update belief only", body: 30, expect: 37,
room: 20, script: [belief x6]}` (belief falls to the cold value, the body stays out of the band);
`{label: "Act", ..., script: [act x6]}` (body climbs into the band; with these numbers act alone wins the race
against the drift).
Reduced mode (no belief idea yet): `showBelief: false` hides the expectation marker, its legend key and
readout, the mismatch bar and the slider; the start `expect` stays as a hidden set-point that **act** pulls the
body toward (use the middle of the band). `levers: ['wait','act']` picks the buttons and their order (default
belief, act, plus wait if it has a label; `wait` without a label is called "Wait"). Defaults leave old presets
unchanged. Example (drift out, then hold): `{showBelief: false, levers: ['wait','act'], band: [36,38], expect: 37,
body: 37, room: 20, presets: [{label: "Do nothing", script: [wait x8]}, {label: "Keep acting", script: [act x8]}]}`.
