# `chsh-lab`
The CHSH test for two spin-1/2 particles in the singlet state (`js/widgets/chsh-lab.js`, plain SVG + HTML, wording from the config).
Alice's analysers $a, a'$ and Bob's $b, b'$ are directions in one plane (degrees). Correlation $E(x,y) = -\cos(x-y)$,
$S = E(a,b) - E(a,b') + E(a',b) + E(a',b')$; local hidden variables give $|S|\le 2$, quantum mechanics reaches $2\sqrt2 \approx 2.83$
(best angles $a=0, a'=90, b=45, b'=135$, $S=-2.83$). Two dials (draggable handles), a plot of $E$ against the angle difference
with the straight-line local model, a $|S|$ gauge with the bounds 2 and 2.83, readout rows. Reports nothing to the card.

Config
- `preset`: `best` (fixed best angles, dials + gauge + readouts, no curve), `free` (draggable + sliders + everything + verdict row),
  `curve` (only the E curve and its local-model line, no dials/gauge/readouts). Every other key overrides the preset (`show` is merged).
- `angles: {a, aP, b, bP}` degrees (default 0, 90, 45, 135); `names: {a, aP, b, bP}` plain-text labels (default a, a', b, b');
  `owners: {alice, bob}` dial titles.
- `draggable` (default true; false = fixed angles), `sliders` (default false; one 0 to 360 slider per analyser), `decimals` (2).
- `show` (all default true): `dials`, `angleLabels` (names next to arrows), `angleValues` (degrees after the names), `curve`,
  `localCurve` (dashed straight-line model + legend), `curveMarkers` (the four pairs as dots on the curve), `curveTicks`, `axisLabels`,
  `gauge`, `boundLocal`, `boundQuantum`, `gaugeTicks`.
- `readouts` list from `ab, abP, aPb, aPbP, S, verdict` (default first five; `[]` = none; `verdict` = beyond / within the local bound).
- `labels: {curveX, curveY, local, quantum, within, beyond, gauge, localCurve, quantumCurve}`.
Colours: a blue, a' purple, b orange, b' red.

Examples
- Best angles: `{preset: best}`; free play: `{preset: free, angles: {a: 20, aP: 70, b: 200, bP: 300}}`; curve only: `{preset: curve}`.
- Dials only, no numbers: `{preset: free, show: {curve: false, gauge: false, angleValues: false}, readouts: []}`.
