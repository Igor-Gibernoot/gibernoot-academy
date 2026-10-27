# `circle-charts`
Two charts on the unit circle $S^1$. Chart A (blue ring outside the circle) is
the angle $\theta \in (0, 2\pi)$ on $\mathcal{U} = S^1 \setminus \{(1,0)\}$;
chart B (orange ring inside) is the angle $\varphi \in (-\pi, \pi)$ on
$\mathcal{V} = S^1 \setminus \{(-1,0)\}$. Each missing point is a hollow dot
in its chart's hue; the overlap $\mathcal{U}\cap\mathcal{V}$ is gold on the
circle, in two pieces ("upper", "lower"). The reader drags $p$ (gold) around
the circle; small arcs at the centre show $\theta(p)$ and $\varphi(p)$
(negative $\varphi$ runs clockwise). A second panel graphs the transition map
$\varphi(\theta)$ on the overlap: $\varphi = \theta$ on $(0,\pi)$,
$\varphi = \theta - 2\pi$ on $(\pi, 2\pi)$, with the jump at $\theta = \pi$
and $p$ marked on it. The readout gives $p$, both coordinates (as multiples of
$\pi$ when the angle is a multiple of 15°), "undefined: $p \notin \mathcal{U}$"
at a missing point, and which piece's formula applies. With `stereo: true`,
chart B is the stereographic projection $\sigma = x/(1-y)$ from the north pole
on $\mathcal{V} = S^1 \setminus \{(0,1)\}$: the dashed ray from $(0,1)$ through
$p$ hits the horizontal axis at $\sigma(p)$, the overlap pieces are
$\theta \in (0, \pi/2)$ and $(\pi/2, 2\pi)$, and the graph is
$\sigma = \cos\theta/(1-\sin\theta)$ with its asymptote at $\theta = \pi/2$.
On a phone the two panels stack.
```yaml
config:
  angle: 60                 # p, in degrees from (1,0) counterclockwise
  show: both                # both | A | B (one chart alone: no overlap, no graph)
  rings: true               # false: no chart rings, angle arcs, θ/φ labels or chart readouts (only p)
  stereo: false             # chart B = stereographic projection from (0,1)
  snap: 5                   # degrees p snaps to (0 = free; keep a divisor of 90
                            # so p can land on the missing points)
  presets: [{ label: Lower piece, angle: 240 }, { label: Chart A only, show: A }]
```
