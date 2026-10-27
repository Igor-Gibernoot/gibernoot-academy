# `area-cell`
What $\sqrt{\det g}$ measures: how a chart stretches a small coordinate
square. Two panels (stacked on a phone). **Left, the chart's coordinates**
(first coordinate across, second up; the chart domain shaded, its real
boundary dashed: polar $r = 0$ and $\theta = \pm\pi$, sphere $\vartheta = 0,
\pi$ and $\varphi = \pm\pi$): a gold square cell of side $\Delta$ in both
coordinates, centred at the draggable point $p$ (gold handle, snapped to
`snap`), with purple arrows $\Delta e_1$, $\Delta e_2$ along two of its
edges. **Right, the manifold**: the chart's coordinate lines (faint purple,
the same lines as on the left), the true image of the cell (gold, curved
edges), and the **parallelogram** centred at $p$ spanned by
$\Delta\,(\partial/\partial\alpha^1)_p$ and $\Delta\,(\partial/\partial\alpha^2)_p$
(purple fill, dashed edge, arrows labelled "Δ∂r", "Δ∂θ", … when long enough).
Its area is $\sqrt{g_{11}g_{22} - g_{12}^2}\,\Delta^2 = \sqrt{\det g(p)}\,\Delta^2$
(Gram: area$^2 = |u|^2|w|^2 - (u\cdot w)^2$). The slider sets $\Delta\in$
[`dmin`, `dmax`]; $p$ is clamped so that the whole cell stays in the domain.
Charts (`chart`; Riemannian only, so $|\det g| = \det g$ and the readout
writes $\sqrt{\det g}$):
- `polar`: Euclidean plane, $(r,\theta)$, $r\in(0, 3.2)$ drawn,
  $\theta\in(-\pi,\pi)$, point $(r\cos\theta, r\sin\theta)$; lines every
  $0.5$ and $\pi/8$; $g = \mathrm{diag}(1, r^2)$, true area of the cell (a ring
  sector) $\tfrac12\Delta(r_2^2 - r_1^2) = r\Delta^2$: **exactly**
  $\sqrt{\det g(p)}\,\Delta^2$ for every $\Delta$, because $p$ is the centre.
- `sphere`: unit $S^2$, $(\vartheta,\varphi)$, point
  $(\sin\vartheta\cos\varphi, \sin\vartheta\sin\varphi, \cos\vartheta)$;
  lines every $\pi/12$; $g = \mathrm{diag}(1,\sin^2\vartheta)$; true area
  (Archimedes' zone) $\Delta(\cos\vartheta_1 - \cos\vartheta_2) =
  2\Delta\sin\vartheta\sin(\Delta/2)$, so the ratio is
  $\sin\vartheta\cdot\sin(\Delta/2)/(\Delta/2)\to\sin\vartheta$. Drawn in
  orthographic projection, radius $3$, seen from the direction of the cell
  (azimuth $\varphi$, elevation $\pi/2 - \vartheta$ capped at $\pm1$ rad so the
  pole stays in sight): the sphere turns as $p$ moves; only the front half is
  drawn; poles N, S as dots; the cut meridian dashed. $\partial/\partial\vartheta$
  points south (down), $\partial/\partial\varphi$ east (right).
- `sheared`: Euclidean plane, $(a,b)\in(-1.2, 1.2)^2$, point $(2a + b, b)$;
  lines every $0.25$; $\partial/\partial a = (2,0)$, $\partial/\partial b = (1,1)$,
  $g = \begin{pmatrix}4&2\\2&2\end{pmatrix}$, $\det g = 4$, true area $2\Delta^2$;
  the readout adds that the product of the side lengths,
  $\sqrt{g_{aa}g_{bb}}\,\Delta^2 = 2\sqrt2\,\Delta^2$, is too big (sides not
  perpendicular): the off-diagonal $g_{ab}$ matters.
- `cartesian`: $(x,y)\in(-2.5,2.5)^2$, everything $1$ (a control).
Readout: the chart's rule; the cell's coordinate ranges
$[\alpha_1,\alpha_2]$, $\Delta$, $p$, coordinate area $\Delta^2$ (gold);
$(\partial/\partial\alpha^i)_p$ in numbers (purple; vectors of $\mathbb{R}^3$ for
the sphere); $g_{11}, g_{12}, g_{22}$ as dot products, $\det g$,
$\sqrt{\det g}$; the parallelogram's area in numbers (purple); the true area
of the gold cell by elementary geometry (ring sector, zone, parallelogram,
square: no volume form used); "True area $/\Delta^2$ against $\sqrt{\det g}$
at $p$" with the badge **equal** (green, to three decimals) or "they differ by
…%. Shrink $\Delta$, and the ratio tends to $\sqrt{\det g}$ at $p$".
Checks (by hand): polar $p = (1.25, \pi/4)$, $\Delta = 0.5$: $g_{\theta\theta} =
1.5625$, parallelogram $= 1.25\cdot0.25 = 0.3125 = \tfrac12\cdot0.5\cdot(1.5^2 -
1^2)$, equal. Sphere $p = (\pi/3, 0.5)$, $\Delta = 0.5$: $\sqrt{\det g} = 0.866$,
parallelogram $0.217$, true $\sin(\pi/3)\sin0.25 = 0.214$, ratio $0.857$ ($1\%$).
Sphere $p = (0.35, -2)$, $\Delta = 0.6$: $\sqrt{\det g} = 0.343$, parallelogram
$0.123$, true $0.6(\cos0.05 - \cos0.65) = 0.122$ ($1.5\%$). Sheared $\Delta = 0.75$:
parallelogram $= 2\cdot0.5625 = 1.125$ = true, side product $1.591$.
```yaml
config:
  chart: polar                # polar | sphere | sheared | cartesian
  p: [1.25, 0.785]            # centre of the cell, chart coordinates
  d: 0.5                      # side Δ (both coordinates)
  dmin: 0.05                  # slider range
  dmax: 1
  snap: 0.05                  # grid for dragging p (angles too, in radians)
  slider: true
  drag: true
  lattice: true               # coordinate lines on the manifold
  parallelogram: true         # purple Δ∂ parallelogram and its readout row
  exact: true                 # true-area and ratio rows
  badge: true                 # "equal" / "differ by …%" words
  presets: [{ label: Near the pole, chart: sphere, p: [0.35, 0], d: 0.5 }]
```
A preset may switch `chart` (the panels are rebuilt); omitted `p`, `d` keep
the current values, clamped to the new domain. Font sizes are in view units,
so the small `sheared` chart panel shows larger tick labels.
