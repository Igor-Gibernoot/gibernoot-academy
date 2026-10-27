# `time-slices`
A 1+1 spacetime picture for absolute time (Newton-Cartan). Horizontal axis
$a$ (space), vertical axis $\tau$ (a chart coordinate), and a time function
$t$ from a preset. Drawn: the slices $\mathcal{S}_c = \mathrm{preim}_t(\{c\})$
at every multiple $c$ of `step` in view (thin ink), the slice of the slider's
$c$ in gold (labelled "c = …" near the edge away from $p$), a draggable point
$p$ (ink ring, snapped to `snap`), the line $\ker(dt)_p$ through $p$ (ink,
labelled "ker (dt)ₚ": the spatial directions at $p$, tangent to the slice
through $p$), and the covector $(dt)_p$ as its two level lines
$(dt)_p(w) = \pm1$ for displacements $w$ from $p$ (orange, dashed, labelled
$+1$, $-1$; with the Euclidean picture they sit at distance $1/|dt|$, so they
move off-screen where $dt$ is tiny). Where $dt = 0$ in view, a ring marks one
such point, labelled "dt = 0". Readout: $t$, $p$, $t(p)$ and the slice
$\mathcal{S}_{t(p)}$ containing $p$; $(dt)_p = \dots\,da + \dots\,d\tau$ (orange)
with its components $(\partial t/\partial a)_p$, $(\partial t/\partial\tau)_p$; a
vector $v$ spanning the kernel, $v^a = (\partial t/\partial\tau)_p$,
$v^\tau = -(\partial t/\partial a)_p$, and $(dt)_p(v) = 0$ in numbers (if
$(dt)_p = 0$: a warning that the kernel is the whole 2-dimensional tangent
space, "time stands still here"); the gold slice ("(two curves)" when
disconnected, "empty, since $t$ never takes that value" when there is none);
the badge **Absolute time?**: "Yes: $(dt)_q \ne 0$ at every point $q$ in view"
or "No: $(dt)_q = 0$ at $q = \dots$" (for `squared` the point of the line
$\tau = 0$ below or above $p$, "in fact on the whole line $\tau = 0$"; other
time functions are checked on a 61×61 grid). Buttons: one per entry of
`times` (KaTeX formula; switching keeps $p$ and moves the gold slice to
$t(p)$), **Slice through p** (sets $c = t(p)$), Reset, presets. The slider
runs over the multiples of `step` covering $t$ on the view (for `squared`
down to $c = -1$, to show an empty slice).
Time functions: `flat` $t = \tau$ ($dt = d\tau$, horizontal slices); `wavy`
$t = \tau + 0.3\sin a$ (slices $\tau = c - 0.3\sin a$); `squared` $t = \tau^2$
($dt = 2\tau\,d\tau$ vanishes on $\tau = 0$; $\mathcal{S}_c$ is two lines
$\tau = \pm\sqrt c$ for $c > 0$, the line $\tau = 0$ for $c = 0$, empty for
$c < 0$; the slices crowd away from $\tau = 0$ and spread near it); `boosted`
$t = (\tau - 0.5\,a)/\sqrt{0.75}$ (the Minkowski boost's time at speed $0.5$:
tilted slices $\tau = 0.5\,a + c\sqrt{0.75}$, slope $\tfrac12$).
Checks (by hand): `wavy`, $p = (1, 0.5)$: $t(p) = 0.5 + 0.3\sin 1 = 0.75$,
$(dt)_p = 0.16\,da + 1\,d\tau$ ($0.3\cos1 = 0.162$), $v = (1, -0.16)$, the slice
through $p$ has slope $-0.3\cos 1 = -0.16$ there (tangent). `boosted`,
$p = (1, 1)$: $t(p) = 0.5/0.866 = 0.58$, $(dt)_p = -0.58\,da + 1.15\,d\tau$,
$v = (1.15, 0.58)$ of slope $\tfrac12$ (along the slice). `squared`,
$p = (1, 1)$: $t(p) = 1$, $(dt)_p = 0\,da + 2\,d\tau$, $\mathcal{S}_1$ = two
lines $\tau = \pm1$, badge No at $q = (1, 0)$.
```yaml
config:
  time: wavy                  # flat | wavy | squared | boosted
  times: [flat, wavy, squared, boosted]   # buttons offered (one entry: none)
  p: [1, 0.5]                 # initial point (draggable)
  c: 0.75                     # initial gold slice (default t(p))
  step: 0.5                   # spacing of the drawn slices' values
  snap: 0.25                  # grid for p
  kernel: true                # the line ker(dt)_p
  stack: true                 # the orange level lines (dt)_p(w) = ±1
  badge: true                 # "Absolute time?"
  dragP: true
  view: { x: -3, y: -2.5, w: 6, h: 5 }
  presets: [{ label: Boosted, time: boosted, p: [1, 1] }]   # c optional
```
