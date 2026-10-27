# `light-cones`
A 1+1 spacetime picture for Lorentzian metrics (signature $(+,-)$, the
book's: timelike means $g_p(\mathcal{X}_p,\mathcal{X}_p) > 0$). Horizontal axis
$a$ (space), vertical axis $\tau$ (a chart coordinate). **Component order
$(a, \tau)$**: a vector is $\mathcal{X}_p$ with components $(X^a, X^\tau)$, so
`X: [1, 2]` means $X^a = 1$, $X^\tau = 2$. Every metric preset has the form
$$g = d\tau\otimes d\tau - k^2\,\sigma\otimes\sigma,\quad \sigma := da - s(a)\,d\tau,$$
i.e. $g_p(\mathcal{X}_p,\mathcal{Y}_p) = X^\tau Y^\tau - k^2(X^a - sX^\tau)(Y^a - sY^\tau)$,
components $g_{aa} = -k^2$, $g_{a\tau} = k^2 s$, $g_{\tau\tau} = 1 - k^2s^2$
($\det = -k^2 < 0$: Lorentzian everywhere); null directions
$X^a = (s \pm 1/k)\,X^\tau$; time orientation $\text{ᛏ} = \pm(s, 1)$ with
$g(\text{ᛏ},\text{ᛏ}) = 1$. Presets: `minkowski` ($k = 1$, $s = 0$: cones at
$45°$), `tilted` ($k = 1$, $s = a/4$: cones lean right as $a$ grows, left for
$a < 0$; the cone axis $\text{ᛏ} = (a/4, 1)$), `scaled` ($k = 2$, $s = 0$:
$g = d\tau\otimes d\tau - 4\,da\otimes da$, narrow cones of slope $\pm\tfrac12$
in $a$ per unit $\tau$).
Drawn: the light cone at a draggable $p$ (two null lines through $p$, ink;
snapped to `snap`), its future half shaded green, $\text{ᛏ}(p)$ (green arrow,
labelled), words "future"/"past" on the cone axis, the vector $\mathcal{X}_p$
(blue arrow from $p$, draggable tip snapped to `snapX`; with `nullSnap` the
tip jumps onto a null line when the pointer is within $0.15$ of it), and with
`field: true` small cones (null segments plus shaded future wedge) at the
integer points of the view, so the tilt is visible across spacetime. Each cone
is drawn at its base point but lives in the tangent space there.
Readout: the metric (formula), $p$ (and $s$ for `tilted`) with $g_{aa}$,
$g_{a\tau}$, $g_{\tau\tau}$; the null lines spanned by $(s\pm1/k, 1)$; the
components of $\mathcal{X}_p$ (blue); $g_p(\mathcal{X}_p,\mathcal{X}_p)$ as a
formula and in numbers; $\text{ᛏ}(p)$ with $g_p(\text{ᛏ}(p),\text{ᛏ}(p)) > 0$
(green); $g_p(\text{ᛏ}(p),\mathcal{X}_p)$ as a formula and in numbers. With
`badge: true` (default) the words are added: positive/zero/negative,
**timelike / lightlike / spacelike**, **future / past directed** (causal
vectors only; "spacelike vectors are neither"), and a final line
"$\mathcal{X}_p$ is timelike, future directed (inside the cone)" (green,
gold for lightlike, bold ink for spacelike). With `badge: false` only the
numbers show, so a question can ask for the class. $\mathcal{X}_p = 0$:
"only non-zero vectors are classified". `orientation: false` hides
$\text{ᛏ}$, the shading and the future/past lines; `'down'` takes
$\text{ᛏ} = -(s, 1)$; `flip: true` adds a **Flip ᛏ** button. Buttons: one per
entry of `views` (metric names), Reset, presets.
Checks (by hand): `minkowski`, $p = (0,0)$: $\mathcal{X}_p = (1,2)$ gives
$2^2 - 1^2 = 3$, timelike, $g_p(\text{ᛏ},\mathcal{X}_p) = 1\cdot2 - 0\cdot1 = 2$,
future directed; $(1,1)$ gives $0$, lightlike, future directed; $(2,1)$ gives
$-3$, spacelike; $(1,-2)$ gives $3$, timelike, $g_p(\text{ᛏ},\mathcal{X}_p) = -2$,
past directed. `tilted`, $p = (2, 0)$: $s = 0.5$, $g_{aa} = -1$,
$g_{a\tau} = 0.5$, $g_{\tau\tau} = 0.75$, null lines $(1.5, 1)$ and $(-0.5, 1)$,
$\mathcal{X}_p = (1.5, 1)$ gives $1^2 - 1^2 = 0$ (lightlike, future directed),
$(1, 1)$ gives $1 - 0.25 = 0.75$; $\text{ᛏ}(p) = (0.5, 1)$. `scaled`:
$(1,1)$ gives $1 - 4 = -3$ (spacelike), $(0.5, 1)$ gives $0$, $(1, 4)$ gives $12$.
```yaml
config:
  metric: minkowski           # minkowski | tilted | scaled
  views: [minkowski, tilted, scaled]   # buttons offered (one entry: none)
  p: [0, 0]                   # base point (draggable)
  X: [1, 2]                   # components (X^a, X^tau) of the vector at p
  snap: 0.5                   # grid for p
  snapX: 0.25                 # grid for X
  nullSnap: true              # magnet onto the null lines
  field: false                # small cones at the integer points
  orientation: true           # true | down | false (no ᛏ, no shading)
  flip: false                 # Flip ᛏ button
  badge: true                 # class words; false = numbers only
  dragP: true
  dragX: true
  view: { x: -3, y: -2.5, w: 6, h: 5 }
  presets: [{ label: Lightlike, metric: minkowski, p: [0, 0], X: [1, 1], orientation: true }]
```
Keep $p + \mathcal{X}_p$ inside the view in presets (the default view runs
$a\in[-3,3]$, $\tau\in[-2.5,2.5]$).
