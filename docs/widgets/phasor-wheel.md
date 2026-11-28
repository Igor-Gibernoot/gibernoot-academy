# `phasor-wheel`
A rotating arrow z = A e^{i(wt+phi)} on the complex plane, with Re z (and optionally Im z) projected onto a trace that unrolls in time. `js/widgets/phasor-wheel.js`,
plain SVG + HTML, all wording from the config. Optional second phasor with the same w, added tip to tail: the resultant R e^{i delta} = A1 e^{i phi1} + A2 e^{i phi2}
is again a rotating arrow, so a sum of two cosines is one cosine (amplitude and phase read out). Reports nothing to the card.
Layout (fixed): plane top left (Re horizontal, Im vertical); Im trace to its right (time runs right, shares the Im axis); Re trace below (time runs down, shares the Re axis,
so the dashed drop line from the tip lands on the trace's "now" dot). Traces show the past, "now" at the plane. Phases in rad, omega in rad per time unit.
Config: `mode` ('single' | 'sum'), `amplitude` 1, `omega` 2, `phase` 0, `amplitude2` 0.7, `phase2` 1.2, `ranges` {amplitude, omega, phase, amplitude2, phase2} as [min, max, step]
(defaults amplitude [0, 1.5], amplitude2 [0, 1]; the plane's scale fits their sum; `extent` overrides it), `window` (time per trace, default two periods of the initial omega), `timeScale` 1, `time` 0, `autoplay` true, `phaseUnit` 'rad' | 'deg',
`units` {time, omega}, `readouts` (amp, phase, omega, period, re, im, time; default amp, phase; in sum mode amp and phase are the resultant's),
`show` {axes, axisLabels, circle, arrow, tip, angle, projection, imProjection, trace, imTrace, componentTraces, nowDot, second, resultant, parallelogram, labels, readouts,
ampSlider, omegaSlider, phaseSlider, amp2Slider, phase2Slider, timeSlider, modeToggle, play, presets} (all true except imTrace, imProjection, componentTraces, parallelogram,
timeSlider; the second-phasor sliders follow `second`). `second: false` removes sum mode entirely; `resultant: false` shows z1 and z2 tip to tail with no sum arrow (the trace then
follows z1); `componentTraces` draws the two cosines faint under the sum; `parallelogram` adds the other path (z2 then z1). `presets: [{label, mode, amplitude, omega, phase,
amplitude2, phase2}]` (given fields only). `labels`: re, im, time, amplitude, omega, phase, amplitude2, phase2, timeSlider, amp, phaseRead, period, reRead, imRead, timeRead,
angle, z1, z2, sum, single, sumMode, play, pause, reset. The tip is not draggable (sliders only).
Exported: `phasorSum({A1, phi1, A2, phi2})` -> `{A, phi}`. Script check: A1 = A2 = 1, phi1 = 0, phi2 = pi/2 gives A = 1.4142, phi = 0.7854.
Example (phase-shifted cosine): `{amplitude: 1, phase: 0.8, show: {second: false, imTrace: true, imProjection: true}}`.
Example (sum of two cosines): `{mode: sum, show: {componentTraces: true}, readouts: [amp, phase]}`.

```smoke
mode: sum
show: { imTrace: true, imProjection: true, componentTraces: true, parallelogram: true, timeSlider: true }
readouts: [amp, phase, omega, period, re, im, time]
presets: [{ label: Equal, amplitude2: 1, amplitude: 1, phase: 0, phase2: 3.14 }]
```
