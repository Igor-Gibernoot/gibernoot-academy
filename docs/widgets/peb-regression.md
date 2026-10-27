# `peb-regression`
Group regression on per-subject posteriors (`js/widgets/peb-regression.js`, SVG; no course text hard-coded). Subject $i$ has a
covariate $x_i$ and a first-level posterior $\mathcal N(m_i,\Pi_i^{-1})$, drawn as a dot at $m_i$ with a bar of one sd
$\Pi_i^{-1/2}$. Second-level model: $\theta_i\sim\mathcal N(\beta_0+\beta_1x_i,\ (\Pi^{(2)})^{-1})$, i.e. $X\beta$ with
$X=(1,x_i)$ and $\Pi^{(2)}$ the group *precision*. Sliders: $\beta_0$, $\beta_1$, $\Pi^{(2)}$ (red line = the group line;
grey dashed = the best slope-0 line). Toggle **shrinkage**: each dot is moved to the posterior of $\theta_i$ under the group prior,
$\hat m_i=(\Pi_i m_i+\Pi^{(2)}\ell_i)/(\Pi_i+\Pi^{(2)})$ with $\ell_i=\beta_0+\beta_1x_i$ and precision $\Pi_i+\Pi^{(2)}$ (teal dot and
bar; the original is faded; a short link joins them). Precise subjects barely move, imprecise ones are pulled to the line.
Readouts (nats), approximate log evidence marginal over each true $\theta_i$, $m_i\sim\mathcal N(\ell_i,\Pi_i^{-1}+(\Pi^{(2)})^{-1})$:
$$\ln E(\beta)=\sum_i\ln\mathcal N\!\big(m_i;\ \beta_0+\beta_1x_i,\ \Pi_i^{-1}+(\Pi^{(2)})^{-1}\big)$$
**slope free** uses the slider values; **slope 0** (a precise prior at $\beta_1=0$) uses $\beta_1=0$ with $\beta_0$ refitted
(weighted mean, weights $[\Pi_i^{-1}+(\Pi^{(2)})^{-1}]^{-1}$, at the current $\Pi^{(2)}$); **difference** = free minus slope 0 (a log Bayes
factor; positive favours the slope; the Occam penalty on $\beta$ itself is not included, flat priors on $\beta$). Buttons: *fitBoth*
(generalised least squares for $\beta_0,\beta_1$ at the current $\Pi^{(2)}$, the best-supported line), *fitFlat*.
Config: `subjects: [{x, m, sd}]`, `xRange`, `yRange` (default span the data), `beta0`, `beta1`, `pi2`, `beta0Range`, `beta1Range`,
`pi2Range` [0.1, 20], `shrink` true, `labels: {x, theta, beta0, beta1, pi2 (KaTeX sources, no $; defaults x, \theta, \beta_0,
\beta_1, \Pi^{(2)}), points, line, flat, shrunk, shrinkToggle, fitBoth, fitFlat, evFree, evNull, evDiff, nats (plain or $-text)}`,
`presets: [{label, beta0, beta1, pi2, shrink, fit}]` (`fit`: `both` or `flat`, applied last). `el.dataset`: `beta0`, `beta1`, `pi2`,
`lnEFree`, `lnENull`, `diff`, `flat`, `shrunk` (comma list), `shrink`.
Example (8 subjects, age): `{subjects: [{x: 20, m: 1.2, sd: .8}, {x: 25, m: 1.9, sd: .5}, {x: 31, m: 1.4, sd: 1}, {x: 38, m: 2.6, sd: .45},
{x: 44, m: 2.3, sd: .9}, {x: 52, m: 3.4, sd: .6}, {x: 60, m: 3.1, sd: .4}, {x: 67, m: 4, sd: .9}], xRange: [15, 72], yRange: [0, 5],
beta0: -0.5, beta1: 0.06, pi2: 3, beta0Range: [-3, 3], beta1Range: [-0.1, 0.15], pi2Range: [0.2, 20], labels: {x: '\\text{age}'}}`.
Hand-checked by script: slider values give $\ln E=-8.4994$, slope 0 $-10.0683$ (flat level 2.5613), difference $1.5689$;
fitBoth gives $\beta_0=0.4435$, $\beta_1=0.0496$, $\ln E=-7.0384$; first shrunk mean (x=20, slider values) $0.8712$.
