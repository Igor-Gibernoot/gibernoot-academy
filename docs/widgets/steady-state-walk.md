# `steady-state-walk`
A 2D random walker over contours of surprise (`js/widgets/steady-state-walk.js`, SVG, seeded, rAF loop; no maths text
hard-coded). Dynamics (Euler-Maruyama): $\Delta x=f(x)\Delta\tau+\omega\sqrt{\Delta\tau}$ with $\omega\sim\mathcal N(0,2\Gamma)$,
$\Gamma=\text{gamma}\cdot I$ (the widget's choice: noise covariance $2\Gamma$ makes $p\propto e^{-\mathfrak I}$ stationary for
$f=-\Gamma\nabla\mathfrak I$; the book writes the noise as $\mathcal N(0,\tfrac12\Gamma^{-1})$ in another convention). Surprise
$\mathfrak I(x)=-\ln p(x)$ for the Gaussian $p=\mathcal N(\text{center},\text{cov})$; grey ellipses mark 1, 2, 3 standard
deviations, the ring is the start. Mode buttons: **Restoring** $f=-\Gamma\nabla\mathfrak I$ (steady state);
**Restoring + circulating** $f=-(\Gamma-\mathsf Q)\nabla\mathfrak I$ with $\mathsf Q=\begin{pmatrix}0&q\\-q&0\end{pmatrix}$ (slider
`q`: same steady state, the path also circles the contours; this $\mathsf Q$ is the book's $Q(x)$ of Eq. A.50, not the
approximate posterior $Q$); **No drift** $f=0$ (dissipates). Slider *restoring strength* $k$ multiplies the drift only (noise
fixed): $k=1$ exact steady state, $k<1$ under-restored (average surprise rises). Changing mode or pressing Restart / New noise
re-runs from the start with the same seed (New noise: seed+1), so modes are compared on equal noise. Under the path: trail
(fading), a trace of $\mathfrak I$ with the average over the last `window` samples (black) and the entropy
$H=\mathbb E[\mathfrak I]=\ln(2\pi\sqrt{\det\text{cov}})+1$ (teal dashed), and readouts (now, average, entropy).
Config: `center` [0,0], `cov` [[2,.8],[.8,1.5]], `start` [5,5], `range` 6, `gamma` 1, `strength` 1, `qCirc` 1 (initial q,
slider 0..2), `dt` .05, `seed` 4, `prerun` 500 (steps done before first draw), `every` 4 (steps per sample/frame), `window` 300,
`traceLen` 700, `traceMax` 12, `trail` 400, `mode`, `modes` (subset of `restoring, circulating, none`), `autoplay`,
`showStrength`, `showTrace`, `labels: {x1, x2 (KaTeX), restoring, circulating, none, play, pause, reset, noise, strength, circ,
surprise, now, avg, entropy, trace}`, `presets: [{label, mode, strength, q, gamma}]`. `el.dataset`: `avg`, `now`, `H`, `mode`.
Example: `{modes: [restoring, none], presets: [{label: Weak, strength: 0.2}]}`.
