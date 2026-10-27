# `mean-field-vb`
Mean-field variational Bayes on a joint over two discrete latent variables $x_1\in\{1..K_1\}$, $x_2\in\{1..K_2\}$ ($K\le4$) for a fixed
observation $y$ (`js/widgets/mean-field-vb.js`, HTML heat-grids + SVG trace; wording from the config). Three grids (rows $x_1$, columns $x_2$):
the joint $p(y,x_1,x_2)$ (sums to $p(y)$), the exact posterior $p(x\mid y)$ and the product $q_1(x_1)q_2(x_2)$; sliders set $q_1$ and $q_2$
(normalised). Book signs, nothing flipped: $F$ minimised,
$$F[q]=\sum_x q\,(\ln q-\ln p(y,x))=D_{KL}[q\,\|\,p(x\mid y)]-\ln p(y),$$
read out with $-\ln p(y)$ and the gap $=D_{KL}[q\|p(x\mid y)]$ (all in nats), plus **the smallest gap of any product** $q_1q_2$ (multi-start
coordinate search): 0 when the posterior is itself a product, positive when it is correlated (the floor that coordinate updates cannot
cross; it is shown as a dotted line on the trace). Buttons: **Update $q_1$** sets $\ln q_1(x_1)=\mathbb E_{q_2}[\ln p(y,x_1,x_2)]+\text{const}$,
**Update $q_2$** likewise, **Sweep** = both, **Reset**, **Show message terms** (for each value of the factor, the numbers $q_2(x_2)\ln p$ inside
the expectation, their sum and the new $q$). Each update minimises $F$ over one factor, so the trace of $F$ (after each update; dashed
line $-\ln p(y)$) never rises; moving a slider restarts the trace. Facts a preset can show: independent latents ($\rho=0$): one sweep gives the exact
posterior (gap 0); correlated: the gap stays positive; a symmetric start (uniform $q$) on a symmetric correlated joint is a fixed point that
the updates never leave (a saddle: nudge a slider), and different starts can end in different local minima.
Config: the joint is either a table `joint: [[..K2] per x1]` (any scale), or built from `marg1`, `marg2` (default uniform; or `K: [K1,K2]`),
`rho` ($|\rho|<1$) and `py` (0.2): $p(y,x_1,x_2)=p_y\,a_ib_j(1+\rho u_iv_j)/Z$, $u,v\in[-1,1]$ the positions of the values (positive $\rho$
favours matching positions). `names: [[x1 labels], [x2 labels]]` (KaTeX sources, default 1..K), `q1`, `q2` (start beliefs; ignored if the length does not
match the preset), `rhoSlider` (slider for $\rho$ with the marginal form), flags `showSliders`, `showMessages`, `showTrace` (true),
`labels: {joint, post, prod, update1, update2, sweep, reset, messages, hideMessages, rho, F, surprise, gap, best, trace, traceKey, sum, result}`,
`presets: [{label, ...any key above}]`. `el.dataset`: `F`, `surprise`, `gap`, `best`, `q1`, `q2`, `updates`, `trace`, `rho`.
Example: `{names: [['$a$','$b$'], ['$c$','$d$']], rho: 0.9, q1: [.6, .4], q2: [.3, .7], presets: [{label: independent, rho: 0}, {label: correlated, rho: 0.9}]}`.
