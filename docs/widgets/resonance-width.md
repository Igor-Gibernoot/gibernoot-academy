# `resonance-width`
Steady-state response of the driven damped oscillator in Taylor's notation (5.6): x'' + 2 beta x' + w0^2 x = f0 cos(w t), x = A cos(w t - delta), A^2 = f0^2 / ((w0^2 - w^2)^2 + 4 beta^2 w^2).
`js/widgets/resonance-width.js`, plain SVG + HTML, all wording from the config. Plots A^2 against w with sliders on beta/w0 (0.02 to 0.6) and w0 (0.5 to 1.5). Reports nothing to the card.
Peak (beta < w0/sqrt 2): w2 = sqrt(w0^2 - 2 beta^2), A^2_max = f0^2 / (4 beta^2 (w0^2 - beta^2)); for larger beta there is no peak (wPeak 0, curve falls from w = 0).
Half-maximum points are exact (a quadratic in u = w^2), so the width w+ - w- is the true FWHM; it is about 2 beta for small beta/w0 (readout `widthRatio` = width / 2beta shows how close; `width` shows
`none` when there is no lower half-maximum point). Lorentzian overlay f0^2 / (4 w0^2 ((w0 - w)^2 + beta^2)): height f0^2/(4 w0^2 beta^2), width exactly 2 beta; it matches the curve near w0 only.
The vertical scale is automatic (1.12 x the current peak) unless `yMax` fixes it; the horizontal axis runs from `wMin` (0) to `wMax` (default 1.3 x the largest w0 of the slider range, 2 w0 without a w0 slider; a `wMin` above 0 zooms in on the peak) so the curve moves when w0 changes.
Config: `f0` 1, `w0` 1, `ratio` 0.1, `w` (marker, default w0), `wMin`, `wMax`, `yMax`, `ranges` {ratio [0.02, 0.6, 0.01], w0 [0.5, 1.5, 0.05], w}, `units` {w, a2},
`readouts` (ratio, beta, w0, twoBeta, width, widthRatio, q, peak, wPeak, halfMax, lorentzPeak, w, a2, a; default width, twoBeta, q, peak),
`show` {axes, axisLabels, ticks, curve, w0Line, halfLine, bracket, lorentzian, marker, markerDrop, labels, readouts, ratioSlider, w0Slider, wSlider, drag, presets}
(true except wSlider, halfLine, bracket, lorentzian, marker). `drag` moves the marker by dragging the figure (needs `marker`). `presets: [{label, ratio, w0, w}]` (given fields only).
`labels`: a2, w, w0, halfMax, width, lorentzian, curve, ratioSlider, w0Slider, wSlider, ratio, beta, w0Read, twoBeta, widthRead, widthRatio, q, peak, wPeak, halfMaxRead, lorentzPeak, wRead, a2Read, aRead, none, reset.
Exported: `response({f0, w0, beta})` -> `{a2(w), wPeak, peak, wLo, wHi, width, lorentz(w)}`.
Example (the width lesson): `{ratio: 0.05, show: {halfLine: true, bracket: true, wSlider: true, w0Slider: false}, readouts: [width, twoBeta, q, peak]}`.

```smoke
ratio: 0.08
w: 0.9
readouts: [ratio, beta, w0, twoBeta, width, widthRatio, q, peak, wPeak, halfMax, lorentzPeak, w, a2, a]
show: { halfLine: true, bracket: true, lorentzian: true, marker: true, wSlider: true }
presets: [{ label: Weak damping, ratio: 0.03 }, { label: Heavy, ratio: 0.5 }]
```
