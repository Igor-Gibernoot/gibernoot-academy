# `friction-stop`
A block or vehicle of mass `m` slides on a road with friction coefficient `mu` and initial speed `v0` (`js/widgets/friction-stop.js`,
plain SVG + HTML, all wording from the config). Sliding friction `F = mu N`, `N = m g cos(slope)`, gives a constant deceleration
`a = g (mu cos(slope) - sin(slope))` (slope in degrees, positive = downhill), so `d = v0^2 / (2 a)` (flat: `v0^2 / (2 g mu)`, the mass
cancels) and `t = v0 / a`. Heat `Q = F d`. Every change of a slider, preset or toggle replays the braking run (about 2.5 s, whatever the
real time). Draws: the road (tilted by the slope) with the vehicle, friction F / normal N / weight mg arrows, a dashed marker at the
stopping distance, a plot of speed against distance with a moving dot, and a bar of kinetic energy (blue) turning into heat (orange);
on a downhill slope the bar grows by the energy gravity releases, uphill a grey part shows energy stored. If `a <= 0` the vehicle does
not stop (readout shows the `noStop` label).
Exported `stopModel({mu, v0, mass, slope, g})` is the pure model (`{a, N, F, E0, stops, d, t, Q}`). Script check: v0 10 m/s, mu 0.7 gives
7.29 m (mass 1000 or 2000 kg alike); mu 0.1 gives 51.0 m; v0 20 gives 29.2 m (4x); slope 10 deg downhill gives 9.89 m, uphill 5.91 m;
mu 0.1 on 8 deg downhill never stops.
Config: `mu: 0.7`, `v0: 10`, `mass: 1000`, `slope: 0`, `g: 9.8`, `sliders: []` (any of `mu, v0, mass, slope`), `ranges: {mu:[0.05,1.2,0.05],
v0:[1,40,1], mass:[50,2000,10], slope:[-15,15,1]}`, `lockToggle: false` (two buttons: locked wheels use `mu`, rolling wheels use
`staticRatio * mu`, default 1.2, `locked: true` is the start state), `distanceMax` and `speedMax` (auto from the start values and
presets, so the axes stay fixed while sliders move), `duration: 2500` ms, `units: {speed, mass, distance, energy, force}`,
`show: {forceArrows, speedPlot, energyBar, heat, potential, distanceMarker, grid, wheels, labels, pin, readouts, replay}` (all true
except `grid` and `pin`; `heat` = orange part of the bar, `potential` = grey part, `pin` = a button that keeps the current speed curve
as a grey dashed ghost for comparing two cases, `labels` = arrow letters and axis names, `grid` = plot grid and road ticks),
`readouts: [distance, time, energy, heat, decel, force]` (default first four; energy = kinetic energy at the start, heat = total at the stop),
`presets: [{label, mu, v0, mass, slope, locked}]` (only given fields change), `labels: {distance, time, energy, heat, decel, force,
speed, ke, potential, friction, normal, weight, locked, rolling, reset, brake, pin, unpin, noStop, speedAxis, distanceAxis, mu, v0, mass,
slope, road}`. Reports nothing to the card.

Example (dry, wet, ice, downhill; mass slider shows the distance does not change while energy and heat do):
`{mu: 0.7, v0: 10, mass: 1000, sliders: [mu, v0, mass], show: {pin: true}, presets: [{label: Dry, mu: 0.7}, {label: Wet, mu: 0.4},
{label: Ice, mu: 0.1}, {label: Downhill, mu: 0.7, slope: 10}]}`.
