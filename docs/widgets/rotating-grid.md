# `rotating-grid`
Pseudo-forces in a rotating chart (Newton-Cartan without gravity). A top
view of the spatial plane; time is the slider $t$ (with **Play**, 7 s for
the whole range). A free particle moves straight in the inertial chart,
$x(t) = x_0 + v\,t$. The rotating chart turns at constant $\dot\theta = \omega$
($\theta = \omega t$, no translation, the book's sign):
$y^1 = x^1\cos\omega t + x^2\sin\omega t$,
$y^2 = -x^1\sin\omega t + x^2\cos\omega t$, so its only nonzero coefficients
are $\Gamma^1_{02} = \Gamma^1_{20} = -\omega$, $\Gamma^2_{01} = \Gamma^2_{10} = \omega$,
$\Gamma^\alpha_{00} = -\omega^2 y^\alpha$.
Panels (by `view`, toggled by the buttons **Inertial**, **Rotating**,
**Both**; side by side on desktop, stacked on phones): the inertial chart
$(x^1, x^2)$, whose grey grid is fixed and over which the rotating chart's
grid turns by $+\omega t$ (purple lattice, axes labelled y¹, y²); the
rotating chart $(y^1, y^2)$, with the inertial grid turning by $-\omega t$
(axes x¹, x²). In each: the trace of the particle for $0\le s\le t$ (ink;
straight in the first, curling in the second; `ghost: true` adds the whole
path for $0\le s\le$ `tmax`, faint dashed), the particle (ink dot) with its
velocity ($\dot x = v$, resp. $\dot y$, blue), and, at $t = 0$ where the two
charts agree, the start point $x_0$ (grey ring handle) and the start velocity
$v$ (faint blue arrow, blue handle at its tip; drawn on top, so with $v = 0$
the first drag sets $v$). Dragging either handle resets $t = 0$. With
`forces` on (button **Forces** toggles), the rotating panel shows at the
particle, per unit mass and times `scale`: Coriolis
$-2\Gamma^\alpha_{0\beta}\dot y^\beta = (2\omega\dot y^2, -2\omega\dot y^1)$ (gold,
labelled "Coriolis"), centrifugal $-\Gamma^\alpha_{00} = \omega^2 y$ (green,
"centrifugal") and their sum $= \ddot y$ (thick translucent ink, "ÿ", drawn
underneath so a force along it stays visible). Readout: $x_0$, $v$, $\omega$;
the coefficients with numbers; inertial $x$, $\dot x = v$, $\ddot x = (0, 0)$;
rotating $y$, $\dot y = R(\omega t)\,v + \omega(y^2, -y^1)$ (blue); Coriolis
(gold) and centrifugal (green) in numbers; "Their sum is $\ddot y = \dots$"
(green "the two pseudo-forces cancel right now" when it is $0$).
Checks (by hand, $\omega = 1$, $x_0 = (1, 0)$, $t = 0$): $v = (0, 0)$:
$\dot y = (0, -1)$, Coriolis $(-2, 0)$, centrifugal $(1, 0)$, sum $(-1, 0) =
-\omega^2 y$ (the resting particle circles the origin of the rotating chart,
centripetal). $v = (0, 0.5)$: $\dot y = (0, -0.5)$, Coriolis $(-1, 0)$,
centrifugal $(1, 0)$, sum $(0, 0)$, as $y^1 = \cos t + 0.5t\sin t$,
$y^2 = -\sin t + 0.5t\cos t$ give $\ddot y(0) = 0$. $v = (0, 1)$: $\dot y = 0$
(momentarily at rest in the rotating chart), Coriolis $0$, sum = centrifugal
$(1, 0)$. Same $v = (0, 0.5)$ at $t = 4$: $y = (-2.17, -0.55)$,
$\dot y = (-0.93, 1.84)$, Coriolis $(3.68, 1.86)$. $x_0 = (-2, -1)$,
$v = (0.75, 0.5)$, $t = 2.5$: $x = (-0.12, 0.25)$, $y = (0.25, -0.13)$,
$\dot y = (-0.43, -1.1)$, Coriolis $(-2.2, 0.85)$, sum $(-1.95, 0.73)$.
```yaml
config:
  omega: 1                    # θ̇ (negative: clockwise)
  x0: [1, 0]                  # start point (draggable)
  v: [0, 0.5]                 # inertial velocity (draggable tip of x0 + v)
  t: 0                        # initial time
  tmax: 6.28                  # slider range [0, tmax]
  view: both                  # inertial | rotating | both
  views: [inertial, rotating, both]   # buttons offered (one entry: none)
  forces: true                # Coriolis, centrifugal and sum arrows
  forcesToggle: true          # the Forces button
  scale: 1                    # arrow length per unit of force
  velocity: true              # ẋ and ẏ arrows at the particle
  components: true            # false: only ÿ, no Coriolis/centrifugal arrows
  ghost: false                # whole path, faint
  drag: true
  snap: 0.25
  box: { x: -4, y: -4, w: 8, h: 8 }
  presets: [{ label: At rest, v: [0, 0] }]   # omega, x0, v, t (t defaults to 0)
```
