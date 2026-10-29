# `oscillator-lab`
A driven, damped mass on a spring or a swaying tower, with an optional second tuned mass (tuned mass damper). `js/widgets/oscillator-lab.js`, plain SVG + HTML,
all wording and units from the config. Three views: the animated system, the live resonance curve (steady-state amplitude against drive frequency, marker at the
current drive), the time trace. Reports nothing to the card. General tool: strings, pipes, bridges, buildings (a preset names the system).
Model (time in natural periods, x in length units, D = drive amplitude = static displacement F0/k, r = drive/f0, z1 main damping ratio, mu = m2/m1, nu = f_damper/f0):
`x1'' + 2 z1 x1' + x1 + mu[nu^2 (x1-x2) + 2 z2 nu (x1'-x2')] = D cos(theta)`, `x2'' = nu^2 (x1-x2) + 2 z2 nu (x1'-x2')`, integrated by RK4 (animation).
Curve and readouts use the exact steady state: `H1 = 1/(1 - r^2 + 2i z1 r - mu Dd r^2/(Dd - r^2))`, `Dd = nu^2 + 2i z2 nu r`, `x2 = x1 Dd/(Dd - r^2)`. No damper:
`|H1| = 1/sqrt((1-r^2)^2 + (2 z1 r)^2)`, peak about `1/(2 z1)` at r = 1, phase lag 90 deg at resonance. Natural frequency `f0 = (1/2 pi) sqrt(k/m)` when `mass` and
`stiffness` are both given, else `f0`. Den Hartog optimum (damper on an undamped main mass): `nu = 1/(1+mu)`, `z2 = sqrt(3 mu/(8 (1+mu)^3))`; `tuning: 'optimal'`
and `damperDamping: 'optimal'` (the defaults) use them. The animation runs `animPeriod` real seconds per natural period (a 5 s tower period is shown fast); readouts
are in real units. The drawing is soft-clipped to its frame (the initial `drive` swings the mass 24 px); the curve is clipped at `ampMax` (x D).
Config: `system` ('spring' | 'tower'), `f0` 0.2 or `mass` 100 + `stiffness` 4000, `drive` 1, `driveFrequency` (default f0), `damping` 0.05, `damper` false, `massRatio` 0.02,
`tuning`, `damperDamping`, `ranges` {frequency, damping, massRatio, tuning, damperDamping, drive, mass, stiffness}, `fMax` (curve axis end, default 2 f0; with mass/stiffness sliders
2 x the largest f0), `ampMax` 12, `animPeriod` 2.4, `window` 10 (periods in the trace), `units` {length, freq, time, mass, stiffness}, `autoplay` true,
`readouts` (natural, period, drive, amplitude, ratio, phase, damperAmp; default natural, period, amplitude, phase),
`show` {system, ground, spring, driver, damper, curve, marker, ghost, f0Line, trace, driveTrace, damperTrace, labels, readouts, freqReadout, phaseReadout, flag, handles,
freqSlider, dampingSlider, massRatioSlider, tuningSlider, damperDampingSlider, driveSlider, massSlider, stiffnessSlider, systemToggle, damperToggle, play, presets}
(true except damperDampingSlider, driveSlider, massSlider, stiffnessSlider, ghost). `spring` hides the coil (spring system: main spring and second spring become dashed
links; tower: the second mass's spring). `ghost` = dashed curve without the damper. `handles` = drag the marker along the curve. The mass-ratio, tuning and damper-damping
sliders show only while the second mass is present. `presets: [{label, system, frequency, driveRatio, damping, damper, massRatio, tuning, damperDamping, drive, mass,
stiffness}]` (given fields only; restarts the motion). `labels`: natural, period, drive, amplitude, ratio, phase, damperAmp, frequency, damping, massRatio, tuning,
damperDamping, driveAmp, mass, stiffness, spring, tower, addDamper, removeDamper, play, pause, restart, reset, curve, trace, noDamper, degrees, time.
Exported for script checks: `response({r, zeta, mu, nu, zeta2})` -> `{a1, a2, phase}`, `denHartog(mu)`, `step`, `simulate(p, periods)`.
Script check: z1 0.05 peak 10.01 near r = 1 (1/(2 z1) = 10), static limit 1, phase 90 deg at r = 1; mu 0.02 optimal: nu 0.9804, z2 0.0841, peak 10.07 (theory sqrt(1+2/mu) = 10.05),
numeric best z2 0.086; undamped main z1 0.001 peak 354 vs z1 0.01 with damper 8.7 (49.8 without); RK4 matches steady state (2.9646 vs 2.9645; resonance 10.0000).
Example: `{f0: 0.16, damping: 0.02, system: tower, damper: true, show: {ghost: true, damperDampingSlider: true}, presets: [{label: Detuned, tuning: 0.8}]}`.
