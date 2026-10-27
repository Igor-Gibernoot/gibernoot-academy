# `curve-velocity`
The velocity of a curve as the derivative of functions along it. A fixed point
$p$ (gold) in the plane, or with `circle: true` on the unit circle $S^1$ with
the angle chart $\theta \in (0, 2\pi)$ (the missing point $(1,0)$ is a hollow
dot). Two curves pass through $p$ at $\lambda = 0$, $\gamma_1$ solid and
$\gamma_2$ dashed (labelled on the drawing):
plane $\gamma(\lambda) = p + \lambda v + \lambda^2 a$ with $v, a \in \mathbb{R}^2$;
circle $\theta(\gamma(\lambda)) = \theta_p + \lambda w + \lambda^2 a$ (drawn
slightly outside / inside the circle so both stay visible). Each curve has a
blue handle at the tip of its velocity arrow (sets $v$, or $w$) and a hollow
handle at $\gamma(-1)$ that bends the curve (sets $a$) without moving the
arrow. Small dots mark $\lambda = \pm 0.5, \pm 1$, so their spacing shows speed.
When both arrows coincide, the handle on top is $\gamma_2$'s. Buttons choose
the scalar field $f$: $x$, $y$, $x^2 + y$, $\theta$ (polar angle in $(0,2\pi)$;
on $S^1$ it is the chart itself). In the plane the level lines
$f = f(p) + n/2$ (rays every $\pi/12$ for $\theta$) are dashed orange.
A second panel graphs $\lambda \mapsto f(\gamma(\lambda))$ for both curves
(vertical axis shifted so $f(p)$ sits at the origin) with their tangent lines
at $\lambda = 0$ in blue: equal velocities give tangent graphs. The readout
gives $f$, $p$, and per curve its formula, its components in blue
($(v^1, v^2)$ for the chart $(x, y)$, or $v^\theta$ on $S^1$; these are
$v^i = (\mathscr{X}^i\circ\gamma)'(0)$) and $(f\circ\gamma)'(0)$; with
`chain: true` a line $= \partial_1 f(p)\cdot v^1 + \partial_2 f(p)\cdot v^2$ in
numbers (on $S^1$: $\partial_\theta(f\circ\theta^{-1})\cdot v^\theta$). A badge
says "Same velocity" (all components equal), "Equal on this $f$ only" (the
two numbers agree but the components differ), or "Different velocities".
```yaml
config:
  circle: false               # S¹ with the θ chart instead of the plane
  p: [1, 1]                   # the point (plane); view is centred on it
  angle: 60                   # the point in degrees (circle; never 0)
  curves:                     # plane: v, a in R²; circle: { w, a } numbers
    - { v: [1, 0.5], a: [0, 0] }
    - { v: [1, 0.5], a: [0, -0.75] }
  bend: true                  # false: no bend handles (curves stay as given)
  f: x2y                      # x | y | x2y (x² + y) | theta
  fields: [x, y, x2y, theta]  # field buttons offered
  graph: true                 # panel of λ ↦ f(γ(λ))
  chain: false                # expand (f∘γ)'(0) = Σ ∂_i f(p) v^i
  snap: 0.25                  # grid for v, a (circle: w, a)
  view: { x: -1.5, y: -1.5, w: 5, h: 5 }   # optional (plane)
  presets: [{ label: Faster, curves: [{ v: [1, 0.5] }, { v: [2, 1] }], f: x }]
```
Circle defaults: `curves: [{ w: 1, a: 0 }, { w: 1, a: 0.5 }]`. Keep $|w| \le 1$
in configs so arrows stay inside the drawing. New fields go in `CV_FIELDS`
(`js/widgets/curve-velocity.js`: TeX, button name, value, gradient in $\mathbb{R}^2$).
