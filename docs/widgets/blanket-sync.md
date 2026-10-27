# `blanket-sync`
Synchrony of two sets that are independent given a third value (`js/widgets/blanket-sync.js`, SVG, seeded; no maths text
hard-coded). Linear-Gaussian model: $b\sim\mathcal N(0,\text{sdB}^2)$, $x\mid b\sim\mathcal N(\text{slopeX}\,b,\text{noiseX}^2)$,
$\mu\mid b\sim\mathcal N(\text{sign}\cdot\text{slopeMu}\,b,\text{noiseMu}^2)$, with $x,\mu$ drawn independently given $b$.
Plot: $x$ horizontal, $\mu$ vertical; the cloud of samples (green), the thick line of conditional means (through the cross
at $b$), the sample correlation next to the exact one. **Condition on b** fades the cloud, shows a slider for $b$ and a
small red cloud at that $b$ with its axis-aligned 1-sd ellipse and the correlation inside the slice (about 0). A second
slider picks a mean internal value $\bar\mu$: the teal dashed line marks it, the teal curve over $x$ is the implied
distribution $p(x\mid\mu=\bar\mu)$ (exact Gaussian conditioning, $b$ integrated out), with mean and sd in the readout.
Buttons: Condition on b, Draw more samples (adds `n`, cap `maxN`), presets, Reset.
Config: `slopeX` 1, `slopeMu` 1, `sign` 1 (-1 = inverse synchrony), `noiseX` .5, `noiseMu` .5, `sdB` 1, `n` 150, `seed` 3,
`maxN` 900, `range` 4 (axes half-width), `b` 1, `muBar` 1, `conditioned`, `showImplied`, `showCorr`,
`labels: {x, mu, b (KaTeX source), more, reset, condition, uncondition, corr, sliceCorr, implied, mean, sd, sliderB, sliderMu, samples, theory}`,
`presets: [{label, sign, noiseX, noiseMu, slopeX, slopeMu, b, muBar}]`. `el.dataset`: `r`, `mean`, `sd`, `cond`.
Example: `{presets: [{label: Inverse, sign: -1}, {label: Noisy, noiseX: 1.2, noiseMu: 1.2}]}`.
