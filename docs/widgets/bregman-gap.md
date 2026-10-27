# `bregman-gap`
A convex function $\psi(\xi)$ of one variable with a draggable tangent point $\xi_0$ and a second draggable point $\xi$ (`js/widgets/bregman-gap.js`; svg + plain HTML).
Draws the curve, the tangent line at $\xi_0$ (orange) and the vertical gap (gold) between the curve at $\xi$ and that line, which is the Bregman divergence
$D[\xi:\xi_0]=\psi(\xi)-\psi(\xi_0)-\psi'(\xi_0)(\xi-\xi_0)\ge0$. General tool, no course text. Nothing numeric is shown unless the preset asks.
Config: `psi: quad|negentropy|neglog|quartic` ($\tfrac12\xi^2$, $\xi\ln\xi-\xi$, $-\ln\xi$, $\xi^4/4+\xi^2/2$; the two logs on $\xi>0$, drag clamped by `min`);
`x0`, `x` start points; `fixX0`, `fixX` (not draggable); `xRange`, `yRange`, `min`; `showTangent` (true), `showGap` (true), `showChord` (secant, dashed);
`showReverse` (also the gap $D[\xi_0:\xi]$: dashed purple tangent at $\xi$ and purple gap above $\xi_0$); `readout: false|forward|both` (numbers $D[\xi:\xi_0]$, and $D[\xi_0:\xi]$);
`showSlope` (dashed slope triangle of run 1 and the number $\psi'(\xi_0)$); `showConjugate` (second panel: curve $\psi^*(\eta)=\max_\xi[\eta\xi-\psi(\xi)]$, the point $\eta_0=\psi'(\xi_0)$,
the tangent of $\psi^*$ there with slope $\xi_0$; in the first panel the hollow dot at $\xi=0$ is the tangent's intercept $-\psi^*(\eta_0)$, so keep $0\in$ `xRange`; with `showSlope` the readout adds its value);
`etaRange`, `psiStarRange`; `hide: ['tangent','gap','x']` (picture without the answer); `presets: [{label, x0?, x?}]`, `reset`; `labels: {xi, x0, psi, eta, reset}` (TeX).
`el.dataset`: `x0`, `x`, `dfwd`, `drev`, `slope`.
Presets (copy into the lesson):
- `symmetric`: `{psi: quad, x0: 1, x: -1.5, readout: both}` (gap $=\tfrac12(\xi-\xi_0)^2$ in both directions: equal; swap the points by dragging).
- `kl-measures`: `{psi: negentropy, x0: 1, x: 3, readout: both, showReverse: true}` (generalized KL; the two directions differ). Variant `-ln`: `{psi: neglog, readout: both, showReverse: true}`.
- `chord`: `{psi: quartic, x0: -1, x: 1.2, showChord: true, showTangent: false, showGap: false, fixX0: false}` (secant above the curve = definition of convex).
- `legendre`: `{psi: negentropy, x0: 1.5, x: 3, showConjugate: true, showSlope: true, hide: [x], xRange: [0, 4]}` (slope $\eta_0$ as new coordinate, intercept $-\psi^*(\eta_0)$; for `quad` use `xRange: [-3, 3]`).
