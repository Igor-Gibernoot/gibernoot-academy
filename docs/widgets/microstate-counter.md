# `microstate-counter`
N particles (or coins) in a box with a left and a right half (`js/widgets/microstate-counter.js`, plain SVG + HTML,
all wording from the config). Clicking a particle flips its side (focusable with Enter/Space when N <= 40). Readouts:
macrostate $k$ (number on the left), microstates $W=\binom{N}{k}$ (exact up to `exactMax`, else $m\times10^{e}$),
share $W/2^N$, $S/k_B=\ln W$, steps. Optional histogram of $W$ for every $k$ with the current $k$ highlighted.
Buttons: Shuffle (every particle to a random side), Step (flip `perStep` random particles), Auto-run (Step on a timer:
drift towards $k=N/2$), Reset, N selector. Reports nothing to the card.
Config: `N` (10; 2 to 400), `nOptions` (list for the selector), `start` (`left` | `right` | `half` | `random` | a number
$k$; default `left`), `seed` (repeatable; omit for true random), `perStep` (1), `interval` (ms, 120), `autorun` (false;
needs `show.auto`), `clickable` (true), `exactMax` (60), `histScale` (`linear` | `log`), `show: {box, particles,
sideLabels, histogram, highlight, ticks, k, W, share, S, steps, shuffle, step, auto, reset, selector}` (defaults true
for box, particles, sideLabels, k, W, steps, shuffle, step; false for the rest; highlight and ticks need histogram),
`labels: {left, right, k, W, share, S, steps, shuffle, step, auto, autoOn, reset, N, hist, histX}`.
Note: with few particles a linear histogram is readable; for N = 100 the end bars are almost invisible (that is the point;
use `histScale: log` to see them).
Example (N=10, all on the left): `{N: 10, start: left, seed: 1, show: {histogram: true, highlight: true, ticks: true,
share: true, S: true}, labels: {left: "left half", right: "right half"}}`.
Example (drift): `{N: 100, start: left, seed: 3, perStep: 1, interval: 60, show: {histogram: true, highlight: true,
share: true, S: true, auto: true, reset: true}}`.
