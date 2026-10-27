# `parallel-transport`
Parallel transport and autoparallels in the plane. A curve $\gamma$ (preset)
is drawn with a slider for $\lambda$ (and a Play button); a vector $\mathcal{Z}$
starts at $\gamma(\lambda_0)$ ($\lambda_0$ = start of the range; the start
vector is faded, labelled "start", its tip draggable) and is parallelly
transported along $\gamma$ under the chosen connection: $\nabla^{\mathrm{E}}$
keeps its cartesian components constant, $\nabla^{\mathrm{P}}$ its polar
components (chart $\mathscr{Y} = (r, \theta)$, $\theta \in (-\pi, \pi)$, cut
$b = 0,\ a \le 0$ drawn dotted). $\nabla^{\mathrm{P}}$ exists only on the polar
chart's domain: where the curve reaches the cut or the origin the transport
stops (warning "at $\lambda \approx \dots$ the curve leaves the polar chart's
domain") and $\mathcal{Z}$ is no longer drawn. A faded trail shows $\mathcal{Z}$
at 7 earlier parameters; $\mathcal{Z}$ is blue, the velocity $v_\gamma$ (ink) and
the acceleration $a_\gamma = \nabla_{v_\gamma}v_\gamma$ (ink, dashed) start at the
gold point $\gamma(\lambda)$; `showBasis` adds $\partial y_1, \partial y_2$ in purple.
The readout gives $\mathcal{Z}$, $v_\gamma$, $a_\gamma$ as combinations of
$\partial x_k$ ($\mathscr{X}$, cartesian) and $\partial y_k$ ($\mathscr{Y}$), the
transport equation $\dot z^k + \Gamma^k_{ji} z^j\dot\gamma^i = 0$ in numbers in
the chart where the connection's coefficients do not vanish ($\mathscr{Y}$ for
$\nabla^{\mathrm{E}}$, with $\Gamma^1_{22} = -r$, $\Gamma^2_{12} = \Gamma^2_{21} = 1/r$;
$\mathscr{X}$ for $\nabla^{\mathrm{P}}$), and the badge **Autoparallel?**,
checked along the whole curve (for $\nabla^{\mathrm{P}}$, the part inside the
domain): "Yes, even autoparallelly transported" ($a_\gamma = 0$), "Yes, but not
autoparallelly transported" ($a_\gamma = \text{ᚱ}(\lambda)\,v_\gamma$, with ᚱ at the
current $\lambda$), or "No" (with a $\lambda$ where $a_\gamma \not\parallel v_\gamma$).
Curves: `circle` $\delta_{r_0}(\lambda) = (r_0\cos\lambda, r_0\sin\lambda)$,
$\lambda \in [0, 2\pi]$ (reaches the cut at $\lambda = \pi$); `vertical`
$\gamma_{x_0}(\lambda) = (x_0, \lambda)$, $\lambda \in [-2.5, 2.5]$ (inside the domain
iff $x_0 > 0$); `radial` $\lambda(\cos\theta_0, \sin\theta_0)$, $\lambda \in [0.5, 3]$;
`radial-squared` $\lambda^2(\cos\theta_0, \sin\theta_0)$, $\lambda \in [0.7, 1.75]$
(autoparallel but not autoparallelly transported). Expected badges: circle No
under $\nabla^{\mathrm{E}}$, autoparallelly transported under $\nabla^{\mathrm{P}}$;
vertical line the reverse; radial lines the same under both. Check
($r_0 = 2$, $z_0 = (1, 0)$, $\lambda = 1.2$, $\nabla^{\mathrm{E}}$): polar components
$(\cos\lambda, -\sin\lambda/2) = (0.36, -0.47)$, $\dot z^1 = -0.93$,
$\Gamma^1_{ji}z^j\dot\gamma^i = 0.93$.

Two more connections (for torsion and curvature). `W` is $\nabla^{\mathrm{W}}$:
the unit radial and angular fields $e_1 = (a\,\partial x_1 + b\,\partial x_2)/r$,
$e_2 = (-b\,\partial x_1 + a\,\partial x_2)/r$ are declared parallel, on the plane
minus the origin; $\mathcal{Z}$ keeps its $e_1, e_2$ components, i.e. turns with
the polar angle of $\gamma(\lambda)$ (the transport stops if the curve hits the
origin). Its nonzero coefficients in $\mathscr{X}$: $\Gamma^2_{11} = b/r^2$,
$\Gamma^2_{12} = -a/r^2$, $\Gamma^1_{21} = -b/r^2$, $\Gamma^1_{22} = a/r^2$ (flat, with
torsion $\mathtt{T}^1_{12} = -b/r^2$, $\mathtt{T}^2_{12} = a/r^2$, where
$\mathtt{T}^i_{jk} = \Gamma^i_{kj} - \Gamma^i_{jk}$). `kappa` is $\nabla^{\kappa}$ with the
single coefficient $\Gamma^1_{22} = \kappa a$ in $\mathscr{X}$ (`kappa:`, default 1;
torsion free, $\mathrm{Riem}^1_{212} = \kappa$): $\dot z^1 = -\kappa\,a\,z^2\dot\gamma^2$,
$\dot z^2 = 0$, integrated along the curve (midpoint rule, 2400 steps; exact on
the rectangle). For both, the transport equation and the acceleration are shown
in $\mathscr{X}$. Curve `rectangle` $[x_0, x_1]\times[b_0, b_1]$: closed,
counterclockwise from $(x_0, b_0)$ (bottom, right side up, top, left side
down), one side per unit of $\lambda \in [0, 4]$, exact piecewise velocity;
no autoparallel badge (corners), instead **After the loop**: $\Delta z =
z(4) - z(0)$ (cartesian) next to the **Prediction**: for $\nabla^{\kappa}$,
$\Delta z^1 = -\mathrm{Riem}^1_{212}\,z^2\times\text{area}$, $\Delta z^2 = 0$ (exact for any
loop, by $\oint a\,db = $ area); for the flat ones $\Delta z = 0$ ($\nabla^{\mathrm{P}}$
stops at the cut if the loop surrounds the origin; $\nabla^{\mathrm{W}}$ returns
even around the origin). `compareE: true` draws, for connections other than
$\nabla^{\mathrm{E}}$, the $\nabla^{\mathrm{E}}$ copy of $\mathcal{Z}$ (start vector at
$\gamma(\lambda)$, dashed, labelled "∇ᴱ copy") and the angle from it to $\mathcal{Z}$
(torsion hint: $\nabla^{\mathrm{W}}$ along the vertical line $\gamma_1$ turns
$\mathcal{Z}$ by the change of polar angle, $124.5^\circ$ from $\lambda = -2.5$ to
$1.5$; along radial lines the two agree). `torsion: true` adds
$\mathtt{T}^1_{12}, \mathtt{T}^2_{12}$ at $\gamma(\lambda)$. Check ($\kappa = 1$,
rectangle $[1,2]\times[0,1]$, $z_0 = (0,1)$): $z = (-1, 1)$ at $\lambda = 1.5$ and
$\Delta z = (-1, 0)$ after the loop (right side $-2$, left side $+1$). The view
is fitted to the curve only; give `view` when $\mathcal{Z}$ is long.
```yaml
config:
  curve: circle               # circle | vertical | radial | radial-squared, or
                              # { type: circle, r0: 2 } | { type: vertical, x0: 1 }
                              # | { type: radial, theta0: 0.785 }; any type takes range: [l0, l1]
                              # | { type: rectangle, x0: 1, x1: 2, b0: 0, b1: 1 }
  connection: E               # E | P | W | kappa
  connections: [E, P]         # toggle buttons offered (one entry: none)
  kappa: 1                    # κ of ∇^κ
  compareE: false             # dashed ∇ᴱ copy of Z and the angle to it
  torsion: false              # readout T¹₁₂, T²₁₂ at γ(λ)
  holonomy: true              # closed curves: Δz after the loop and the prediction
  z0: [1, 0]                  # start vector, cartesian components (tip draggable)
  lambda: 0                   # initial slider value (default: start of the range)
  showVelocity: true
  showAcceleration: true
  showBasis: false            # polar basis at the current point (purple)
  trail: true                 # faded copies of Z along the way
  residual: true              # the transport equation in numbers
  badge: true                 # the "Autoparallel?" badge
  dragZ: true
  snap: 0.25                  # grid for the tip of the start vector
  view: { x: -3.2, y: -3.2, w: 6.4, h: 6.4 }   # default: fits the initial curve and its velocity
  presets: [{ label: Vertical line, curve: { type: vertical, x0: 1 }, connection: P, z0: [1, 0], lambda: 0 }]
```
The view is fixed by the initial curve: give `view` when presets switch to a
curve that does not fit it.
