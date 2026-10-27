# `log-ruler`
A logarithmic ruler (`js/widgets/log-ruler.js`, plain SVG + HTML, all wording from the config): a horizontal
axis with one tick per power of ten, from $10^{\text{min}}$ to $10^{\text{max}}$. Items sit at their true place
(blue dots, label on a lane above); **items to guess** (`fixed: false`) get one chip each: select a chip, then
drag on the axis (touch scrolls vertically, drags horizontally), or use the slider / arrow keys; each guess is an
orange triangle below the axis. Readout: the current marker's value in scientific notation and the nearest power
of ten. **Check** (enabled once every guess is placed) reveals the true positions (purple rings), draws the gap
and lists each guess, its true value and the error in orders of magnitude; **Reset** starts over. With no
guessable item there is one free "my guess" marker. The widget only displays and probes: it reports nothing to
the card, so the graded question goes in a separate numeric/mcq card.
Config: `min`, `max` (exponents, default $-10$, $7$), `unit` (`m`, `m/s`; `''` = none), `items: [{label, value,
fixed}]` (`value` is the true number: in YAML write `1.0e-10` with the dot, or a string; `fixed` default true),
`reveal: true` (draw every item's true place from the start, no Check button; default false), `ticks`,
`tickLabels` (labels thin out automatically to fit), `readout`, `decadeCount: true` (a bracket "$\times10$" under
two neighbouring ticks), `slider: false`, `snap: true` (markers jump to whole powers), `start` (exponent of a
free marker, placed from the start), `showGuessLabel: false`, `labels: {guess, check, reset, pick, nearest,
notPlaced, truth, error, perStep, orders}`. Items beyond the range are drawn at the edge. Example (size ladder):
`{min: -10, max: 7, unit: m, decadeCount: true, items: [{label: atom, value: 1.0e-10, fixed: false}, {label: hair,
value: 8.0e-5}, {label: Earth radius, value: 6.4e6, fixed: false}]}`.
