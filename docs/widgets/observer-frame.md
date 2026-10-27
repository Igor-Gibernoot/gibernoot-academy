# `observer-frame`
An observer's frame and what it measures, in 1+1 **Minkowski** spacetime with
the conventions of `light-cones` ($a$ across, $\tau$ up, components in the
order $(a, \tau)$, signature $(+,-)$:
$g(\mathcal{X},\mathcal{Y}) = X^\tau Y^\tau - X^aY^a$; light cone at $p = (0,0)$
in ink, future half shaded green). The observer passes through $p$ with chart
speed $u\in[-0.95, 0.95]$ (slider, or drag the tip of $e_0$: it stays on the
future unit hyperbola, only the pointer's slope $a/\tau$ is read, snapped to
`snapU`):
$$e_0 = (u, 1)/\sqrt{1-u^2},\quad e_1 = (1, u)/\sqrt{1-u^2}.$$
The frame is drawn in **purple** (the app's basis hue: $e_0, e_1$ are a basis
of $T_p\mathcal{M}$), with faint purple lines through $p$ along $e_0$ (the
observer's worldline) and $e_1$ (its space line): as $|u|\to1$ the pair closes
like scissors on the light line, symmetric about it. Optional dashed unit
hyperbolae $g(\mathcal{X},\mathcal{X}) = 1$ (both branches, labelled
"g = 1") and $= -1$ ("g = −1"): $e_0$ always ends on the first, $e_1$ on the
second. The vector $\mathcal{X}$ (blue, draggable tip snapped to `snapX`,
magnet onto the null lines as in `light-cones`) and its **measured components**
$$X^0 = \epsilon^0(\mathcal{X}) = g(e_0,\mathcal{X}),\quad X^1 = \epsilon^1(\mathcal{X}) = -g(e_1,\mathcal{X}),$$
drawn as the parallelogram $0$, $X^0e_0$, $\mathcal{X}$, $X^1e_1$ (dashed blue
edges, light fill; edge labels "X⁰e₀", "X¹e₁" when there is room). Measured
components carry the frame labels $0, 1$; chart components the coordinate
labels $a, \tau$. `compare: true` (or the **Observer at rest** button with
`compareButton: true`) adds the frame at rest, $u = 0$ (faint purple, "rest"),
which measures the chart components.
Readout: the metric; $u$, $1/\sqrt{1-u^2}$, $e_0$, $e_1$ in numbers (purple);
Lorentz-orthonormality $g(e_0,e_0) = 1$, $g(e_1,e_1) = -1$, $g(e_0,e_1) = 0$
computed in numbers; the chart components $X^a, X^\tau$ (blue); $X^0$ and
$X^1$ computed in numbers; the check $X^0e_0 + X^1e_1 = \mathcal{X}$;
$g(\mathcal{X},\mathcal{X})$ both as $(X^\tau)^2 - (X^a)^2$ and as
$(X^0)^2 - (X^1)^2$ (same number); with `compare` the rest observer's time
$X^\tau$, space $X^a$ and speed $|X^a/X^\tau|$; the badge (`badge: false`
hides it): **timelike** (green) "measured speed $|X^1/X^0| = \dots < 1$",
with $X^0 > 0$ future / $X^0 < 0$ past directed; **lightlike** (gold) speed
exactly $1$ "for every observer"; **spacelike** (bold) "$|X^1| > |X^0|$ …
not a particle velocity: no measured speed"; $\mathcal{X} = 0$: no speed.
The slider name $u$ is the observer's speed relative to the chart (the rest
observer); the measured speed of $\mathcal{X}$ is written $|X^1/X^0|$, never
$u$, so the two speeds are not confused in lessons.
Checks (by hand): rest, $\mathcal{X} = (1,2)$: $X^0 = 2$, $X^1 = 1$, speed
$0.5$, $g = 3$. $u = 0.6$: $1/\sqrt{1-u^2} = 1.25$, $e_0 = (0.75, 1.25)$,
$e_1 = (1.25, 0.75)$, $1.25^2 - 0.75^2 = 1$; light $\mathcal{X} = (1,1)$:
$X^0 = 1.25 - 0.75 = 0.5$, $X^1 = -(0.75 - 1.25) = 0.5$, speed $1$;
$\mathcal{X} = (3,5)$: $X^0 = 1.25\cdot5 - 0.75\cdot3 = 4$ (the traveller's
proper time on the twin's outbound leg), $X^1 = -(0.75\cdot5 - 1.25\cdot3) = 0$:
at rest in that frame, $g = 25 - 9 = 16 = 4^2 - 0^2$; the rest observer
measures time $5$, speed $0.6$. $u = -0.9$: $1/\sqrt{0.19}\approx2.294$,
$e_0\approx(-2.065, 2.294)$; spacelike $\mathcal{X} = (2,1)$:
$X^0\approx6.424$, $X^1\approx6.653$, $(X^0)^2 - (X^1)^2 = -3$.
```yaml
config:
  u: 0.6                      # observer's chart speed, clamped to [-0.95, 0.95]
  X: [3, 5]                   # components (X^a, X^tau)
  snapX: 0.25                 # grid for X
  snapU: 0.05                 # u steps when dragging e_0 (slider: 0.01)
  nullSnap: true              # magnet onto the null lines
  hyperbolae: true            # dashed g = 1 and g = -1
  parallelogram: true         # X^0 e_0 and X^1 e_1
  badge: true                 # measured-speed badge
  compare: false              # faint frame at rest (u = 0)
  compareButton: false        # toggle button for it
  slider: true
  dragE: true
  dragX: true
  view: { x: -3.5, y: -2.5, w: 7, h: 8 }
  presets: [{ label: Light, u: 0.6, X: [1, 1], compare: false }]
```
For $u < -0.8$ the tip of $e_1$ leaves the default view at the bottom (and for
$u > 0.8$ only just fits): use a taller view in presets with large $|u|$.
