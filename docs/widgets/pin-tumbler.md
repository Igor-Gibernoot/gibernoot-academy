# `pin-tumbler`
Cutaway of a pin-tumbler lock (`js/widgets/pin-tumbler.js`, plain SVG + HTML, all wording from the config). N pin stacks (3 to 6), each a
spring, a driver pin (orange) and a key pin (blue); a key with one cut depth per pin over D levels (0 = shallowest). Pin i has a secret
depth `secret[i]`; the key lifts the key pin so its top sits `secret[i] - key[i]` steps above the shear line. Equal depths: the pin ends
exactly at the shear line (green); otherwise a pin crosses it (red) and blocks the plug. The plug turns only if all N match. Distinct keys: `D^N`
(6^5 = 7776). Drag a cut up/down on the key, or use the - / + steppers under it.
Exported `tumblerModel({secret, key, inserted})` gives `{N, match[], matches, turns}`; `combinations(D, N)`. Script check: secret
[3,1,4,0,2] with key [3,1,4,0,1] gives 4 matches, no turn; the same key as the secret turns; key removed never turns; exhaustive over 3^5 keys,
turns only for the one right key; combinations(6,5) = 7776.
Config: `pins: 5`, `depths: 6` (2 to 9), `secret: []` (N numbers 0..D-1), `key: []` (start cuts, default 0), `inserted: true`, `editable: true`,
`mode: 'key'|'pick'`, `bindOrder: [0..N-1]`,
`show: {springs, shearLine, pinLabels, count, bitting, key, plug, steppers, insertButton, readouts}` (all true except `pinLabels` and
`count`; `pinLabels` = numbers above pins, `count` = "k of N" on the figure, `bitting` = the row of cut digits, `plug` = plug body and
turn text, `steppers` = the - + buttons, `insertButton` = Insert/Remove key),
`readouts: ['matches','turns','combinations']` (default none), `presets: [{label, key, secret, inserted}]` (only given fields change),
`labels: {matches, turns, combinations, yes, no, insert, remove, reset, tension, release, matchesOf, pinWord, lock, plugTurns, plugStuck,
bitting, less, more, binding}`.
Picking mode (`mode: pick`): no key. The reader presses "Apply torque" (the plug then binds one pin at a time, in `bindOrder`, marked
with the `binding` label) and clicks a pin column to push that pin up one step (wraps from the top to the bottom). The binding pin that
reaches its secret depth is set (green, held at the shear line); clicks on other pins move them but nothing sets. Releasing the torque
drops all set pins. All set: the plug turns. Reports nothing to the card.
Example: `{pins: 5, depths: 6, secret: [3,1,4,0,2], key: [3,1,4,0,1], readouts: [matches, turns, combinations],
presets: [{label: Right key, key: [3,1,4,0,2]}]}`.
