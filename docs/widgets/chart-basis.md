# `chart-basis`
Chart-induced bases and the Jacobian in the plane $\mathbb{R}^2$ (points
$q = (q_1, q_2)$). One or two charts are drawn as their coordinate lines
(first chart solid, second dashed; the two lines through $p$ darker), around a
draggable point $p$ (gold). At $p$ each chart's basis vectors
$(\partial/\partial\mathscr{X}^i)_p$ are purple arrows (second chart dashed),
labelled on the drawing: the velocity at $\lambda = 0$ of the coordinate curve
$\lambda \mapsto \mathscr{X}^{-1}(\mathscr{X}(p) + \lambda e_i)$, so tangent to
the coordinate lines (column $i$ of $(D\mathscr{X})^{-1}$). A draggable blue
velocity $v$ at $p$ is the velocity of $\gamma(\lambda) = p + \lambda v$.
Chart presets: `cartesian` ($\mathscr{C}$, coordinates $x, y$), `polar`
($\mathscr{P}$, coordinates $r, \theta$ with $\theta \in (0, 2\pi)$), `X`
($\mathscr{X}(q) = (2q_1, -q_2)$) and `Y` ($\mathscr{Y}(q) = (q_1, q_2e^{q_1})$),
the C.3 pair. A polar chart takes `cut: right` (default, $\theta \in (0, 2\pi)$,
undefined on the half-line $q_2 = 0$, $q_1 \ge 0$) or `cut: left`
($\theta \in (-\pi, \pi)$, undefined for $q_1 \le 0$); its cut is drawn dotted.
$p$ can go anywhere: when it leaves a chart's domain (the cut, the origin),
that chart shows no basis and no components, the readout says why, and the
Jacobian is replaced by "needs $p$ in the domains of both charts".
The readout gives $p$, $v$, and per chart its rule, $\mathscr{X}(p)$ and the
components $(\mathscr{X}^i\circ\gamma)'(0)$ in blue; with two charts the
Jacobian $(\partial\mathscr{Y}^i/\partial\mathscr{X}^j)_p$ in numbers (row $i$,
column $j$, the book's convention: $\dot\gamma^i_\mathcal{V} = \sum_j
(\partial\mathscr{Y}^i/\partial\mathscr{X}^j)_p\,\dot\gamma^j_\mathcal{U}$) and
the line "Components in $\mathscr{Y}$ = Jacobian $\cdot$ components in
$\mathscr{X}$"; `chain: true` adds the product in numbers (column = matrix
times column). With `basisOnly: true`, $v$ and the components are hidden and
`chain` instead expands each $(\partial/\partial\mathscr{X}^i)_p =
\sum_j (\partial\mathscr{Y}^j/\partial\mathscr{X}^i)_p\,(\partial/\partial\mathscr{Y}^j)_p$
in numbers (column $i$ of the Jacobian). `inverse: true` also shows
$(\partial\mathscr{X}^i/\partial\mathscr{Y}^j)_p$. `jacobian: false` hides the
Jacobian and the component-law lines (for cards before the Jacobian is taught). Check (C.3, $p = (1,1)$,
$v = (1,2)$): $\mathscr{X}$-components $(2, -2)$, $\mathscr{Y}$-components
$(1, 3e) \approx (1, 8.15)$, Jacobian $\begin{pmatrix} 1/2 & 0 \\ e/2 & -e\end{pmatrix}$.
```yaml
config:
  charts: [X, Y]              # one or two of cartesian | polar | X | Y, or
                              # { chart: polar, name: '\mathscr{Y}', steps: [0.5, 0.3927], cut: left }
                              # (name: the chart letter; steps: line spacing per coordinate;
                              # cut: right = theta in (0, 2pi), left = theta in (-pi, pi))
  p: [1, 1]                   # the point; the default view is 5 × 5 centred on it
  v: [1, 2]                   # the velocity, standard components of R²
  basisOnly: false            # hide v and the components
  arrows: true                # false: no v, no basis arrows, no components (lines and p only)
  chain: false                # the law in numbers (components; basis law if basisOnly)
  inverse: false              # also the inverse Jacobian
  dragP: true                 # p draggable
  lines: 8                    # at most this many coordinate lines each side of p
  snap: 0.25                  # grid for p and the tip of v
  view: { x: -1.5, y: -1.5, w: 5, h: 5 }   # optional
  presets: [{ label: Polar, charts: [cartesian, polar], p: [1, 1], v: [1, 0] }]
```
Default steps: cartesian $(0.5, 0.5)$, polar $(0.5, \pi/8)$, `X` $(1, 0.5)$,
`Y` $(0.5, 1)$. Where the lines of one coordinate get closer than about
$0.14$ view units (the `Y` lines $q_2 = c\,e^{-q_1}$ for large $q_1$, the polar
rays near the origin), only every 2nd (4th, …) line continues, so they thin
out instead of crowding. Labels are placed automatically beside or beyond the
arrow tips, avoiding the arrows (including $v$), $p$ and each other. New charts go
in `CB_CHARTS` (`js/widgets/chart-basis.js`: name, coordinate TeX and glyphs, rule, map,
inverse, Jacobian of the map, steps).
