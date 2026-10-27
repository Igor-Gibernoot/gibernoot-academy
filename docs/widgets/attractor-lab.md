# `attractor-lab`
Movement as fulfilled proprioceptive predictions (`js/widgets/attractor-lab.js`; Eq. 8.1-8.5, Fig. 8.1). A limb with real position $x$
(the generative *process*, which has the action $u$) and an agent whose *model* has no $u$ and pulls $x$ toward the target $v$;
the belief $\mu$ follows $x$ through the data $y=x$. Deterministic, RK4, $dt=0.002$ s, horizon `T`. Three plots (position with
$x$, $\mu$, $v$; action $u$; phase portrait with the model's flow arrows), readouts (overshoot, time to 90%, settled within 5%, final $x$),
`Play` (live; sliders move the parameters while playing; stopped, a slider recomputes the whole run) and `Reset`.
- Mode `first` (model Eq. 8.3 $g=x$, $f=v-x$; process Eq. 8.4 $g=x$, $f=u$): $u=G(v-\mu)$ ($G$ = `actionGain`, 1 = the book's $u=v-\mu$),
$\dot\mu=(v-\mu)+\Pi_y(x-\mu)$, $\dot x=u$. With $a=v-\mu$, $b=v-x$ the rates are $-1$ and $-\Pi_y$: the approach is
$e^{-t\min(1,\Pi_y)}$, so more sensory precision never speeds it up. The phase plane is $(x,\dot x=u)$, a line $\dot x=v-x$.
- Mode `spring` (model Eq. 8.5, $x_1$ position, $x_2$ velocity): $\dot x_1=x_2$, $\dot x_2=\tfrac{\kappa}{m}(v-x_1)-b\,x_2$ ($b$ = `damping`;
$b=0$ is exactly Eq. 8.5, an extra we add); process $\dot x_2=u-c\,x_2$ ($c$ = `friction`), $u=\tfrac{\kappa}{m}(v-\mu_1)-b\mu_2$ (the acceleration the model predicts).
Belief from position data only: $\dot\mu_1=\mu_2+\Pi_y e$, $\dot\mu_2=f_2(\mu)+\tfrac14\Pi_y^2 e$, $e=x_1-\mu_1$. Natural frequency $\sqrt{\kappa/m}$;
critical damping $b=2\sqrt{\kappa/m}$ (overshoot $0$ at $\kappa/m=4$, $b=4$; $52.7\%$ at $b=0.8$; undamped: oscillates between $x_0$ and $2v-x_0$).
- **Precision only matters if the belief starts wrong or the limb is disturbed**: with $\mu_0=x_0$ (default) there is never a sensory error. Use `mu0` or `push`.
Config (keys can also sit in a preset; a preset overrides): `modes: [first, spring]` (buttons if more than one), `mode`, `v: 2`, `x0: 0`, `mu0` (initial belief, default $x_0$),
`push: {t, dx}` (the limb is pushed by `dx` at time `t`), `Pi: 1`, `PiRange: [0.1, 30]` (log slider), `kappa: 4`, `m: 1`, `damping: 0.8`, `friction: 0`,
`actionGain: 1`, `T: 8`, `speed: 1.5`, `range: [-1, 3]` (position axis), `show: {v, x0, mu0, Pi, kappa, m, damping, friction}` (sliders; default all except `mu0`, `friction`;
$\kappa$, $m$, $b$, $c$ only in spring mode), `showPhase`, `showAction`, `autoplay`, `labels` (names are markdown inline, may carry `$..$`), `presets: [{label, ...}]`.
`el.dataset`: `mode`, `x`, `mu`, `u`, `t`, `over`, `t90`, `settle`, `running`, `v`, `Pi`. Exported: `derivs`, `rk4`.
Presets (copy into the lesson):
- `point`: `{label: point attractor, mode: first, v: 2, x0: 0, Pi: 1}` (90% at 2.31 s, no overshoot).
- `low-precision`: `{label: belief already at the target, low precision, mode: first, mu0: 2, Pi: 0.1, show: {mu0: true}}` (belief says "already there": the limb reaches only $x=1.0$ at $t=8$).
- `high-precision`: same with `Pi: 20` (data pulls $\mu$ back, the limb moves: 90% at 2.36 s; the same speed as `point`, not faster).
- `push`: `{label: push, mode: first, v: 2, push: {t: 4, dx: -1.5}, T: 10}` (the attractor pulls the limb back).
- `spring`: `{label: spring: overshoot, mode: spring, kappa: 4, m: 1, damping: 0.8}` (52.7% overshoot, settles in 6.9 s); `spring-undamped` `damping: 0` (oscillates forever, peak $4$); `spring-critical` `damping: 4` (no overshoot, 90% at 1.95 s).
