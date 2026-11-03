# `now-lines`
A plain-language 1+1 Minkowski diagram (speed of light = 1; space across, time
up) for the relativity of simultaneity, with no index notation. Alice (blue) is
at rest, Bob (orange) moves at speed $u$; both pass through the event $O$ at the
origin. Drawn: their worldlines (`worldlines`, labelled Alice, Bob); each one's
line of "now" through $O$ (`nowLines`: Alice's horizontal, Bob's of slope $u$,
solid, plus a dashed parallel through $E$, the "now" of each at $E$); the light
cone of $O$ with the "elsewhere" wedges shaded and labelled (`lightCones`); a
faint dot grid, spacing 0.5, for the whole spacetime, the block-universe
picture (`block`, **off by default**: set `block: true`); and a draggable event
$E = (a, \tau)$ (gold, snapped to `snap`; `dragE`; always drawn, as is $O$).
Readout (`readout`): where $E$ is; Alice's time of $E$, $t_A = \tau$; Bob's,
$t_B = \gamma(\tau - u\,a)$ with $\gamma = 1/\sqrt{1-u^2}$, with the numbers
substituted; each labelled "past of / same moment as / future of" her or his now
(sign of $t$). Verdict (`verdict`): $E$ spacelike from $O$ ($|a| > |\tau|$) and
the signs of $t_A$, $t_B$ differ: "Alice and Bob disagree on the order of E and
O"; spacelike but the signs agree at this $u$: says so and that a faster
observer would disagree; timelike or lightlike: "All observers agree: E is
after / before O". Slider (`slider`): $u$ from 0 to 0.9, step 0.05; with
`slider: false` $u$ is fixed by the preset. Buttons: Reset (shown if the slider,
the drag or `presets` is on) and one per entry of `presets`. Each option hides
exactly one thing.
Checks (by hand and script): $u = 0.6$, $\gamma = 1.25$. $E = (3, 0)$:
$t_A = 0$ (same moment), $t_B = -2.25$ (past), disagree. $E = (3, 1)$:
$t_A = 1$ (future), $t_B = 1.25(1 - 1.8) = -1$ (past), disagree. $E = (1, 3)$
timelike: $t_B = 1.25(3 - 0.6) = 3$, all agree.
Built-in named presets (for `preset:` and for the `presets:` buttons): `rest`
(label "Bob at rest", $u = 0$, $E = (3, 1)$), `moving` ("Bob moving", $u = 0.6$,
$E = (3, 1)$).
```yaml
config:
  u: 0.6                  # Bob's speed, 0 to 0.9
  E: [3, 1]               # initial event (a, tau); the view holds |a| <= 3.75, |tau| <= 3.25
  snap: 0.5               # grid for E
  preset: moving          # optional initial state: rest | moving (u, E override it)
  worldlines: true
  nowLines: true
  lightCones: true
  readout: true
  verdict: true
  block: false            # dot grid of the whole spacetime
  slider: true            # false: u fixed
  dragE: true
  view: { x: -4, y: -3.5, w: 8, h: 7 }
  presets: [rest, moving, { label: Fast, u: 0.9, E: [2, 1] }]   # buttons: names or { label, u, E }
```
