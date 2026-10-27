# `falling-cloud`
Tides (Newton-Cartan gravity of a point mass). A plane through the mass $M$
at the origin of the sources chart: $x^1$ radial, $x^2$ transverse,
$G_NM$ = `GM`. A cloud of `N` free particles on a circle of radius `r0`
around $c_0 = (c, 0)$ on the $x^1$ axis, plus the center particle, all at
rest at $t = 0$, falls freely along the exact law
$\ddot x = -G_NM\,x/|x|^3$ (velocity Verlet, $dt = 5\cdot10^{-4}$, sampled every
$0.005$, recomputed when $c_0$ changes). Time is the slider $t$ (with
**Play**, 7 s for the whole range); the run stops (`tmax`, automatic) at the
last sample before **any** particle reaches $|x| = 0.5$ (the inner one gets
there first: $t_{\max} = 0.88$ from $c_0 = (2, 0)$, $2.84$ from $(4, 0)$; the
center alone would need $\approx 1.11$ to reach the mass).
Panels (by `view`, buttons **Sources**, **Falling**, **Both**): the sources
chart $(x^1, x^2)$, with the mass (ink dot, "M"), the center's path from
$c_0$ (dashed), the cloud (blue dots, translucent blue outline), the center
(small ink dot) and the grey ring handle at $c_0$ (drag along the $x^1$ axis,
$1.25\le c\le 4.5$, resets $t = 0$); the falling chart $y = x - b(t)$, $b$ =
the center's path, magnified by `zoom` (caption "magnified ×5"; grid step $1/$`zoom`
in $y$ units): center fixed at $0$, the start circle (thin grey), the cloud
turning into an egg (longer on the inner side), and with `arrows` the exact
tidal accelerations $\ddot y = a - \ddot b$ of each particle (gold, `scale`
panel units per unit of acceleration, not zoomed, capped at 1.5 panel
units). With `linear` (button **Linear**): dashed gold arrows
$-\mathrm{Riem}^\alpha{}_{0\beta0}\eta^\beta$ at each particle's actual offset
$\eta = x - b$, and the dashed gold curve of the tidal equation
$\ddot\eta = -\mathrm{Riem}(t)\,\eta$ solved along the center's path (Riem at
$b(t)$, not frozen at $t = 0$): an ellipse, symmetric, unlike the egg.
$\mathrm{Riem}^\alpha{}_{0\beta0} = \partial_\beta\partial_\alpha\phi$ at $b = (r, 0)$:
$\mathrm{Riem}^1{}_{010} = -2G_NM/r^3$, $\mathrm{Riem}^2{}_{020} = \mathrm{Riem}^3{}_{030} = G_NM/r^3$.
Readout: setup line; $b$ and $r$; the two components; "Their sum is …;
with $\mathrm{Riem}^3{}_{030}$ the full trace is $0 = \mathrm{Ric}_{00}$ (vacuum)";
offsets of the outer $(r_0, 0)$, inner $(-r_0, 0)$ and side $(0, r_0)$
particles (tracked even when `N` is not a multiple of 4), blue; with
`linear` the linear prediction (outer, inner $= -$outer, side); gold: tidal
acceleration of the outer and side particles (and their linear values).
Checks (`GM: 8`, $c_0 = (2, 0)$, $r_0 = 0.2$, numerically verified):
$t = 0$: Riem $-2$, $1$ (sum $-1$, $+1$ gives $0$); exact accelerations outer
$0.347$, inner $-0.469$, side $-0.197$; linear outer $0.4$, side $-0.2$.
$t = 0.5$: $b = (1.738, 0)$; offsets outer $0.248$, inner $-0.267$, side
$(0.004, 0.174)$; linear prediction outer $0.256$, side $0.174$ (the frozen
hand estimate $0.2\cosh(\sqrt2\cdot0.5) = 0.2521$, $0.2\cos0.5 = 0.1755$ is
not what is drawn). $t = 0.8$: $b = (1.268, 0)$, outer $0.351$, inner
$-0.443$, side $0.128$; linear $\pm0.385$, $0.127$. $c_0 = (4, 0)$, $t = 0$:
Riem $-0.25$, $0.125$ (8 times weaker), outer acceleration $0.046$.
```yaml
config:
  GM: 8                       # G_N M
  c0: [2, 0]                  # start of the center (on the x¹ axis; draggable)
  r0: 0.2                     # radius of the cloud
  N: 12                       # particles on the circle
  zoom: 5                     # magnification of the falling panel
  t: 0                        # initial time (clamped to tmax)
  tmax: 0.8                   # optional; default = automatic stop
  view: both                  # sources | falling | both
  views: [sources, falling, both]   # buttons offered (one entry: none)
  arrows: true                # exact tidal accelerations (gold)
  linear: false               # dashed linear prediction (arrows + curve)
  linearToggle: true          # the Linear button
  scale: 1                    # arrow length per unit of acceleration
  drag: true
  snap: 0.25
  presets: [{ label: Far, c0: [4, 0] }]   # c0, t, linear (t defaults to 0)
```
