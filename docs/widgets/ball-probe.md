# `ball-probe`
Is a set open? The reader drags a point $p$ and sets the radius $r$ with a
slider; the ball $B_r(p)$ is drawn and the part outside the set $\mathcal{U}$
(gold) turns red. The readout says whether the ball fits and the largest radius
that does. With an ambient space (an interval $\mathcal{N}$, or the circle
$S^1$ for an arc) the ball is cut down to it (inherited topology): the part
outside is faded, and $\mathcal{U}$ is judged both in the subspace and in
$\mathbb{R}$ or $\mathbb{R}^2$.
```yaml
config:
  dim: 1                      # 1: the real line; 2: the plane
  set: { a: 0, b: 1, closed: [true, false] }   # dim 1: an interval (a, b: null = ±∞)
  # dim 2: { shape: disc, center: [0, 0], radius: 2, closed: false }
  #      | { shape: halfplane, closed: false }              (second coordinate > 0)
  #      | { shape: arc, from: 0, to: 180, closed: [false, false] }  (unit circle, degrees)
  ambient: { a: 0, b: 2, closed: [true, false] }  # dim 1, optional: the space 𝒩 ⊇ 𝒰
  name: '\mathcal{U}'         # TeX names (ambientName for 𝒩)
  view: [-0.5, 1.5]           # dim 1: x range; dim 2: { x, y, w, h }
  p: 0                        # dim 1 number; dim 2 [x, y]; arc: angle in degrees
  r: 0.3
  rMax: 1                     # slider maximum
  snap: 0.05                  # grid for p (defaults 0.05, 0.1, arc 5°)
  presets: [{ label: '[0, 1]', set: {...}, p: 1, r: 0.2 }]   # ambient optional
```
Don't mix arc and non-arc sets in one widget's presets (the view scale differs).

**Pair mode** (Hausdorff separation, `dim: 2` only): `pair: true` drops the set
and shows two draggable points $p$ and $q$ with balls of the same radius $r$.
The balls turn red while they overlap; the readout gives $\lVert p - q\rVert$
and says they are disjoint exactly when $r \le \lVert p - q\rVert / 2$.
```yaml
config:
  dim: 2
  pair: true
  p: [-1, 0]                  # first point
  q: [1.5, 0.5]               # second point (default [2, 1])
  r: 1.5
  rMax: 3
  view: { x: -3.5, y: -3, w: 7, h: 6 }   # optional
  presets: [{ label: Close, p: [0, 0], q: [0.4, 0], r: 0.5 }]   # p, q, r optional
```
