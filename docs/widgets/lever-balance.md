# `lever-balance`
A plank on a pivot (`js/widgets/lever-balance.js`, plain SVG + HTML, all wording from the config). Downward forces act at
positions along the plank; the torque of a force about the pivot is `tau = F |x - pivot|` (force times arm). The side with
the larger total torque tips down (plank animates, 3 to 10 degrees by size of the imbalance). Drag the pivot and the loads
(snap to `snap`), or focus a handle and use the arrow keys. Draws: plank with ruler, support, force arrows, dashed arms
with their lengths, a torque bar per side (left blue, right orange) with values, readouts, optional force sliders.
Exported `torques(pivotX, loads)` is the pure model (`{L, R, net, verdict, ratio}`; net = R - L; verdict 0 balanced, -1 tips
left, 1 tips right).
Config: `length: 10`, `start: 0` (plank spans start .. start+length), `snap: 0.1`, `pivot: {x, fixed}` (x default middle),
`loads: [{x, F, fixed, fixedF, label, torque, side}]` (`fixed`: x cannot be dragged; `fixedF`: F cannot change; a load with
`torque` and `side: 'L'|'R'` is a pure torque about the pivot, drawn as a curved arrow, e.g. a bolt's resistance; it has no
position or arm), `forceSliders: false` (one slider per load whose F may change), `forceRange: [0,100]`, `forceStep: 1`,
`forceMax`, `torqueMax` (arrow length / bar full scale; default 1.5 x the initial maximum), `rulerStep` (auto),
`pivotShape: 'triangle'|'bolt'` (support under the plank / hexagon on it), `units: {length, force, torque}` (m, N, N m),
`show: {arms, torques, forceArrows, tilt, ruler, readouts, pivot, labels, torqueArrows}` (each false hides it; `tilt: false`
keeps the plank level but readouts still give the verdict; `labels` = load names with values; `pivot` = support and handle),
`readouts: [torqueL, torqueR, net, ratio, verdict]` (default `[torqueL, torqueR, net, verdict]`; ratio = right/left),
`presets: [{label, pivot, loads: [{x, F}, ...]}]` (loads by index, only given fields change), `labels: {torqueL, torqueR,
net, ratio, verdict, balanced, tipsLeft, tipsRight, reset, plank, force, left, right}`. Reports nothing to the card.

Examples
- Seesaw: `{length: 10, pivot: {x: 5}, forceSliders: true, loads: [{x: 2, F: 30, label: A}, {x: 8, F: 20, label: B}], readouts: [torqueL, torqueR, ratio, verdict]}`
  (balanced when the pivot is at 4.0: 30 x 4 = 20 x 6 = 120).
- **Wrench mode**: a bolt at the pivot, one hand force at the handle end against the bolt's resisting torque; the arm length
  changes the torque. `{start: -0.1, length: 0.7, snap: 0.01, pivotShape: bolt, pivot: {x: 0, fixed: true}, forceRange: [0, 300],
  forceSliders: true, loads: [{x: 0.3, F: 100, label: Hand}, {torque: 40, side: L, label: Bolt, fixedF: true}],
  labels: {tipsLeft: Bolt holds, tipsRight: Bolt turns}}` (100 N x 0.3 m = 30 N m < 40: holds; drag the hand to 0.5 m: 50 N m, turns).
