# `gaussian-fit`
Fit a Gaussian $q(x)=\mathcal N(\mu,\sigma^2)$ to a 1D target density $p(x)$ (`js/widgets/gaussian-fit.js`, SVG, grid of 800
points; no maths text hard-coded). Target: `components: [{w, mean, sd}]` (mixture) or `skew: {loc, scale, alpha}` (skew-normal,
the default when no components). The density panel shows $p$ (grey area), $q$ (red) and its mean (dashed); sliders $\mu$ and $\sigma$
(`sigmaRange`); dragging on the panel moves $\mu$ (when `showTaylor` is off). Readouts in nats, each with a bar (full scale `klMax`,
3) and a black tick at the best value the Gaussian family reaches (`showBest`): $D_{KL}[q\|p]=\int q\ln(q/p)$ and, if
`showForward`, $D_{KL}[p\|q]=\int p\ln(p/q)$. $q$ is renormalised on the grid, so both are true KLs (nonnegative, 0 only when
$q=p$); neither is ever negated. Buttons: **fitRev** minimises $D_{KL}[q\|p]$ numerically (Nelder-Mead from the mode-width fit of
each mode and from the moment fit; mode-seeking: on a bimodal $p$ it picks one mode, ln 2 for two equal modes), **fitFwd**
moment-matching (mean and variance of $p$; straddles both modes), **laplace** puts $\mu$ at a mode (`modeIndex`: left to right, default the
highest) with $\sigma^{-2}=-(\ln p)''(\mu)$. $D_{KL}[q\|p]$ is the divergence inside $F=D_{KL}[Q\|P(x\mid y)]-\ln P(y)$ (the gap that $F$
minimises); it needs $\ln p$ only up to a constant, so it is computable without the normalised posterior; $D_{KL}[p\|q]$ is the
other direction.
`showTaylor: true` adds a second panel, $\ln p$ (height `lnSpan` nats), with $\ln q$ and the Taylor polynomial of $\ln p$ at a point
$a$ (slider or drag; order buttons 0 / 1 / 2). Readout: curvature $(\ln p)''(a)$ and precision $-(\ln p)''(a)$ (if negative curvature);
for order 2 with negative curvature the Gaussian it implies, $\mu=a-(\ln p)'/(\ln p)''$, $\sigma^2=-1/(\ln p)''$, is drawn dashed
on the density panel (at the mode it is the Laplace fit). **useTaylor** copies it into $q$.
Config: `components` | `skew`, `range` [lo, hi] (default spans the target), `grid`, `mu`, `sigma`, `sigmaRange`, `showForward`
true, `showBest` true, `klMax` 3, `showTaylor` false, `modeIndex`, `a`, `order` 2, `lnSpan` 9,
`labels: {p, q, x, mu, sigma, klRev, klFwd (KaTeX sources, no $), bestTick, fitRev, fitFwd, laplace, useTaylor, density, logDensity,
point, order0, order1, order2, curvature, precision, taylorGauss, notNormalisable, nats (plain or $-text)}`,
`presets: [{label, mu, sigma, a, order, fit}]` (`fit`: `rev`, `fwd` or `laplace`, applied last). `el.dataset`: `mu`, `sigma`, `klRev`,
`klFwd`, `bestRev`, `bestFwd`, `a`, `order`, `curv`, `mode`.
Examples: bimodal `{components: [{w: .5, mean: -2.2, sd: .7}, {w: .5, mean: 2.2, sd: .7}], mu: 0, sigma: 1}`; skewed with Laplace
`{skew: {loc: -1, scale: 1.5, alpha: 5}, showTaylor: true}`.
