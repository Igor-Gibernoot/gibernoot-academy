# `worldline-clock`
A worldline and the clock it carries, in 1+1 spacetime with the conventions
of `light-cones` ($a$ across, $\tau$ up, components in the order $(a, \tau)$,
signature $(+,-)$, metric presets from `light-cones`, time orientation
$\text{ᛏ} = (s, 1)$, future halves of the cones shaded green, velocities blue).
The worldline $\gamma$ runs from $A = (0,0)$ to $B = (0,T)$:
- `shape: kinks` (default): straight pieces through 1–2 draggable kinks
  $K_1$, $K_2$ (snapped to `snap`). **Parametrization:** $\lambda\in[0,n]$
  for $n$ pieces, one unit of $\lambda$ per piece, uniform on each, so on a
  piece $v_\gamma$ is constant and equals the piece's displacement (twin
  out to $(3,5)$: $v_\gamma = (3,5)$, then $(-3,5)$).
- `shape: bend`: the quadratic Bézier $\gamma(\lambda) = 2u(1-u)\,C + u^2B$,
  $u := \lambda/2$, $\lambda\in[0,2]$, with a draggable control point $C$
  (dashed control lines $A$–$C$–$B$); $v_\gamma = (1-u)\,C + u\,(B - C)$.

Proper time does not depend on the parametrization (another $\lambda$
rescales $v_\gamma$ and $d\lambda$ oppositely); the widget's choice only
fixes the numbers shown for $v_\gamma$ and $s_\gamma$. Drawn: $\gamma$ in
ink where $v_\gamma$ is timelike and future directed, **gold** where it is
lightlike and future directed, **red** where it is spacelike, past directed
or zero; `cones` small light cones at evenly spaced $\lambda$ with
$v_\gamma$ (blue arrows drawn at scale `vScale`, the class does not change
under scaling); a $\lambda$ slider with Play; the dot $\gamma(\lambda)$ with
its own cone, $v_\gamma(\lambda)$ and a clock (one turn of the hand $= T$;
greyed with "–" once $\gamma$ has stopped being timelike and future directed).
`compare: true` adds the straight worldline $A\to B$ (dashed) with the
same $\lambda$ range and uniform speed, its own dot and clock.
`massless: true` (Minkowski only; ignored otherwise) forces every piece onto
a null line: one kink sits at $(\pm T/2, T/2)$ (dragging picks the side); with
two kinks $K_1 = (x, |x|)$ is dragged along the light ray from $A$
($|x|\in[\mathtt{snap}, T/2 - \mathtt{snap}]$) and $K_2 = (x \mp T/2, |x| + T/2)$
follows (a light ray bounced twice).
Readout: the metric; the worldline and its $\lambda$ range; the dot
$\gamma(\lambda)$ in chart coordinates (and $s$ for `tilted`); $v_\gamma(\lambda)$
(blue); $g(v_\gamma, v_\gamma)$ as numbers with
$\text{ᛇ}_\gamma(\lambda) = \mathrm{sgn}\,g(v_\gamma,v_\gamma)$ and the class,
$g(\text{ᛏ}, v_\gamma)$ with future/past directed; the speed
$s_\gamma = \sqrt{\text{ᛇ}_\gamma\,g(v_\gamma,v_\gamma)}$; the **proper time**
so far $\tau_{[0,\lambda]}[\gamma] = \int_0^\lambda s_\gamma\,d\lambda$ (green;
"not a proper time" once $v_\gamma$ failed to be timelike and future
directed); the **chart coordinate** $\tau$ of the dot, with the sentence that
it labels the event and is not the dot's clock; with `compare` the straight
worldline's numbers; the badge "Massive worldline?": **Yes** (green, with the
proper time from $A$ to $B$) when $v_\gamma$ is timelike and future directed
for every $\lambda$; **No … a massless worldline** (gold) when it is lightlike,
future directed and non-zero everywhere; otherwise **No** (red) with the first
$\lambda$ range where $v_\gamma$ is zero, spacelike, past directed or lightlike.
The integral is computed by the midpoint rule, 200 steps per unit of
$\lambda$ (exact on straight Minkowski pieces).
Checks (by hand): Minkowski twin `kinks: [[3, 5]]`: $v_\gamma = (3,5)$,
$g = 25 - 9 = 16$, $s_\gamma = 4$ on both pieces, proper time $4 + 4 = 8$;
the straight worldline has $v = (0,5)$, $s = 5$, proper time $10$; at
$\lambda = 1$ the clocks read $4$ and $5$ (both dots at chart $\tau = 5$).
`bend: [4, 5]`: $\gamma = (8u(1-u), 10u)$, $v_\gamma = (4 - 8u, 5)$,
$g = 25 - (4-8u)^2 > 0$, proper time
$\tfrac14\int_{-4}^4\sqrt{25 - w^2}\,dw = 3 + 6.25\arcsin0.8 \approx 8.796$.
`kinks: [[0, 2], [5, 6]]`: pieces $(0,2)$ ($s = 2$), $(5,4)$ and $(-5,4)$
($g = -9$, spacelike, red), badge No for $\lambda\in[1,3]$.
`kinks: [[1, 6], [0, 4]]`: piece $(-1,-2)$ has $g = 3$ (timelike) but
$g(\text{ᛏ}, v) = -2$: past directed, red. `massless`, `kinks: [[2, 2], [0, 0]]`:
$K_1 = (2,2)$, $K_2 = (-3,7)$, pieces $(2,2)$, $(-5,5)$, $(3,3)$, all null:
massless badge. `tilted`, twin `[[3, 5]]`: the straight worldline stays on
$a = 0$ ($s = 0$), proper time $10$; the return piece $(-3,5)$ starts at
$a = 3$ ($s = 0.75$): $X^a - sX^\tau = -6.75$, $g = 25 - 45.5625 < 0$,
spacelike for $\lambda\in[1, 1.467]$ (the readout shows $1.465$, its sampling step; where $6.75 - 3.75\mu > 5$, $\mu = \lambda - 1$).
```yaml
config:
  metric: minkowski           # minkowski | tilted | scaled
  T: 10                       # B = (0, T)
  shape: kinks                # kinks | bend
  kinks: [[3, 5]]             # 1 or 2 points (a, tau), draggable
  bend: [4, 5]                # control point C for shape: bend
  massless: false             # pieces forced onto null lines (minkowski)
  compare: false              # straight worldline A -> B with its clock
  cones: 4                    # small cones along the curve
  vScale: 0.3                 # drawing scale of the velocity arrows
  lambda: 0                   # initial lambda (not a fraction)
  snap: 0.5
  drag: true
  view: { x: -6, y: -1, w: 12, h: 12.5 }   # default: from T
  presets: [{ label: Halfway, shape: kinks, kinks: [[3, 5]], lambda: 1 }]
```
Keep the kinks at least $1$ inside the view so their labels fit.
