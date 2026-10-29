# `flutter-lab`
One torsional (twist) mode of a bridge deck in steady wind, a LINEAR MODEL of self-excited flutter, with an optional contrast mode of forced resonance. `js/widgets/flutter-lab.js`,
plain SVG + HTML, all wording and units from the config. Three views: the deck cross-section (hanger cables, wind arrows, twist angle), the effective damping against wind speed
(critical speed marked, negative region tinted, dot at the current wind), the time trace of the twist angle (dashed limit lines). Reports nothing to the card. A caricature, not a
bridge design tool: the aerodynamic term is one number (real flutter derivatives depend on reduced velocity U/(f B) and the section shape).
Model (time in natural periods, theta in degrees, U wind speed, Uc critical speed, z_s structural damping ratio):
`theta'' + 2 z_eff theta' + theta = D cos(t)`. Flutter mode: `z_eff = z_s - k U = z_s (1 - U/Uc)`, `k = z_s/Uc`, `D = 0` (only the initial kick `initial` starts the motion).
Forced mode: `z_eff = z_s` fixed, `D = forceStatic U/Uc` at exactly the natural frequency, steady amplitude `D/(2 z_s)`. When `z_eff < 0` the amplitude is multiplied by
`exp(2 pi |z_eff|/sqrt(1 - z_eff^2))` per period; at `U = Uc` the motion neither decays nor grows. Reaching `limit` degrees freezes the motion and tints the deck (the model has no
saturation; the flag says "limit reached"). RK4. The animation runs `animPeriod` real seconds per natural period; readouts use the real `f0`.
Config: `mode` ('flutter' | 'forced'), `wind` (start speed, 0), `ucrit` 35, `windMax` (2 ucrit), `damping` (z_s, 0.04), `f0` 0.2 Hz, `initial` 0.5 deg, `limit` 15 deg, `forceStatic` 0.1 deg,
`animPeriod` 1.0, `window` 14 (periods in the trace), `drawGain` 1, `units` {speed, freq, time, angle}, `autoplay`, `ranges` {wind, damping, ucrit},
`readouts` (wind, ucrit, natural, period, damping, growth, angle, mode; default wind, damping, growth, angle),
`show` {deck, cables, wind, damping, marker, ucritMark, trace, limitLines, labels, readouts, flag, windSlider, dampingSlider, ucritSlider, modeToggle, play, presets}
(true except ucritSlider). `limitLines` = dashed limits in the trace plus the red deck at the limit; `flag` = status line (growing / decaying / steady / limit reached). `presets: [{label, mode,
wind, damping, ucrit}]` (given fields only; restarts). `labels`: wind, ucrit, natural, period, damping, growth, angle, mode, flutter, forced, windSlider, dampingSlider, ucritSlider, play,
pause, restart, reset, dampPlot, trace, time, perPeriod, failed, growing, decaying, steady, limit, modeFlutter, modeForced.
Exported for script checks: `effDamping(p)`, `growthFactor(z)`, `forcedAmplitude(D, z)`, `drive(p)`, `step`, `simulate(p, periods, S0)`.
Script check (z_s 0.04, Uc 35): z_eff at U = 0, 17.5, 35, 52.5 is 0.04, 0.02, 0, -0.02; growth per period at -0.02: simulated 1.13391 vs formula 1.13393; decay at 0.04: 0.77761 vs 0.77761;
U = Uc keeps 0.5 deg; forced D 0.1, z 0.04: amplitude 1.2499 vs D/(2z) = 1.25; U = 1.5 Uc from 0.5 deg to 15 deg takes 27.5 periods (27 s at animPeriod 1).
Presets worth using (same config otherwise `{ucrit: 35, units: {speed: 'mph'}}`):
- Self-excited walk-through: `show: {ucritSlider: false}`, presets `Calm {wind: 10}`, `At critical {wind: 35}`, `Storm {wind: 55}`.
- Flutter vs resonance: `modeToggle` on, presets `{label: 'Flutter', mode: 'flutter', wind: 52}`, `{label: 'Forced', mode: 'forced', wind: 52}`.
- Damping plot only (a card about the line): `show: {deck: false, trace: false, readouts: false, play: false, presets: false}`; add `modeToggle: false` if the card is flutter only.
- Critical speed is an input (a stiffer or better-shaped deck has a higher Uc): `ucritSlider: true`. Structural damping z_s only sets how fast things decay or grow (Uc stays fixed by the model).
