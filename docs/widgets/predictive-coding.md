# `predictive-coding`
Prediction errors, precision weighting and gradient descent on the free energy (`js/widgets/predictive-coding.js`, SVG + HTML, rAF loop;
shared by the whole academy, symbols and texts come from `labels`). Signs: $F=\tfrac12\sum\epsilon\Pi\epsilon$ is minimised, $\dot\mu=-\nabla_\mu F$,
in generalized coordinates $\dot{\tilde\mu}-D\tilde\mu=-\nabla_{\tilde\mu}F$, action $\dot u=-\nabla_uF$. Mode tabs (`modes`; `mode` = first shown):
- **static**: one level, data $y$ (slider), prior mean $\eta$ (slider), mapping $g$. $\epsilon_y=y-g(\mu)$, $\epsilon_v=\mu-\eta$. Two number lines
  (cause: $\eta$ diamond, $\mu$ dot, dashed ring = minimum $\mu^*$; data: $y$ square, $g(\mu)$ ring) with red segments for the errors. Under the
  sliders: closed form $\mu^*=\dfrac{a\Pi_yy+\Pi_v\eta}{a^2\Pi_y+\Pi_v}$ when $g(x)=ax$ (plus the pull toward the data
  $a^2\Pi_y/(a^2\Pi_y+\Pi_v)$), else a Newton minimum labelled numerical. **Descend** runs $\dot\mu=-\nabla F$ until it stops (each frame is a fixed fraction
  of the time scale $1/\lambda$, so the animation lasts about a second for any precisions); Step; Reset.
- **hierarchy**: three rows, $\epsilon_y=y-g(\mu_1)$, $\epsilon_x=\mu_1-g_2(\mu_2)$, $\epsilon_v=\mu_2-\eta$, with $\Pi_y,\Pi_x,\Pi_v$; level 2 predicts level 1, which
  predicts the data. Numerical minimum shown.
- **dynamic**: generalized coordinates $\tilde\mu=(\mu,\mu',\mu'')$ of a hidden state tracking $y(t)=\text{offset}+\text{amp}\sin\omega t$ (data derivatives
  $\tilde y$ exact). Linear model $y=Gx$, $\dot x=f_xx+f_vv$: $\tilde\epsilon_y=\tilde y-G\tilde\mu$, $\tilde\epsilon_x=D\tilde\mu-(f_x\tilde\mu+f_v\tilde v)$ with
  $(D\tilde\mu)_i=\mu_{i+1}$ (last $=0$), $\tilde v=(v,0,0)$, $\epsilon_v=v-\eta$; precision of order $i$ is $\Pi\,\text{decay}^i$. Play runs real-time dynamics
  $\dot{\tilde\mu}-D\tilde\mu=-\nabla_{\tilde\mu}F$, $\dot v=-\nabla_vF$; plot: data (teal) vs prediction $G\mu$ (green); the buttons *Orders kept 1/2/3*
  drop the higher orders (1 order = visible lag, readout of the mean gap). Only linear $g$ (its `gain`) and $f$ here.
- **action**: arm drawn at angle $y=y_0+\text{dydu}\cdot u$ (thick), the belief $g(\mu)$ (green dotted), and $\eta$ = the descending prediction (gold dashed).
  Without the reflex only $\mu$ moves toward the data. **Enable reflex** adds $\dot u=-\nabla_uF=-\text{dydu}\,\Pi_y\epsilon_y$: the arm moves to fulfil the prediction;
  if $\Pi_y$ is large against $\Pi_v$ the belief is dragged toward the sensed arm (it stops believing "I am moving") while the arm moves faster; with small $\Pi_y$ the belief keeps the prediction but the arm moves slowly (sensory attenuation protects the belief "I am moving"; it does **not** speed the reflex up: the rate $\frac{\Pi_y\Pi_v}{\Pi_y+\Pi_v}(\eta-y)$ never falls as $\Pi_y$ rises; toy $y=0,\eta=1,\Pi_v=1$: $\Pi_y=4$ gives $\mu=.2,\dot u=.8$, $\Pi_y=.25$ gives $\mu=.8,\dot u=.2$). Readout: rate $-\text{dydu}^2\Pi_y\epsilon_y$.
Under the scene each error has a signed bar ($\epsilon$, full width = half the range) and a bar for its contribution $\tfrac12\Pi\epsilon^2$ to $F$ (full = largest $F$ since Reset),
with the numbers. Precision sliders are log-scale (`PiRange`).
Config: `mode`, `modes`, `g`, `g2` (`'identity'|'gain'|'tanh'|'sin'` or `{kind, gain}`, $g=\text{gain}\cdot\text{base}(x)$), `f: {x, v}`, `eta` 0, `y` 1, `y0` 0,
`mu0`, `Pi: {y, x, v}` (1), `PiRange` [.01, 100], `range` [-3, 3] (for $y,\eta,\mu$; angle range in action mode), `signal: {amp 1, omega 2, offset 0}`, `orders` 3, `decay` 1,
`showX` true, `dydu` 1, `reflex` false, `speed` 1, `autoplay` false, `window` 8, `show: {y, eta, Pi, closed}` (true),
`labels: {y, mu, mu2, eta, Py, Px, Pv, ey, ex, ev, F (KaTeX sources, no $); marks: {y, mu, eta, pred, min} (plain text in the SVG); descend, pause, step, reset, play, reflex, reflexOn,
orders ('Orders kept: {n}'), modeNames: {static, hierarchy, dynamic, action}; closed, minimum, weight, lag, rate, unit (suffix, e.g. '°')}`,
`presets: [{label, ...any config key}]`. `el.dataset`: `mode`, `F`, `mu`, `mustar`, `u`, `t`, `y`, `K`, `lag`, `reflex`, `running`.
Example: `{mode: static, g: {kind: gain, gain: 1}, y: 2, eta: -1, Pi: {y: 4, v: 1}}` (compromise 1.4).
Chapter 5 message passing can reuse it (each error is a message; the bars are the messages).
