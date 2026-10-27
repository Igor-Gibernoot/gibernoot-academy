# `crash-impulse`
A mass brought to rest by a wall, bag or crumpling front (`js/widgets/crash-impulse.js`, plain SVG + HTML, all wording from the config). Model:
impulse `J = m v0` (area under the force-time curve, any shape); stop by time `t = stop`, or by distance `t = 2d/v0` (average speed `v0/2`; exact for the
symmetric shapes); average force `m v0 / t`; average deceleration `v0/t = v0^2/(2d)`; peak force = 1x average for `constant`, 2x for `triangle`
(rises to the peak at t/2, falls to zero; same area). `square` is an alias of `constant`. Draws: car scene (approach, then the body crumples by the
stopping distance, live speed), force-time plot with fixed axes (so the area visibly shrinks and grows as the slider moves), shaded area up to the sweeping
cursor, dashed peak line with value, deceleration bar in g (peak; tick = average if different) with an injury band beyond `dangerG` (hidden by default).
Each slider, preset or button replays the stop (3.2 s whatever the real time). Exported `crashModel({mass, v0, stopMode, stop, shape, g})` returns
`{J, t, d, Favg, Fpeak, aAvg, aPeak, gAvg, gPeak}`.
Script check (1200 kg, 15 m/s): J = 18000 N s; 0.1 s gives 180 kN (15.3 g); 0.5 s gives 36 kN (3.1 g); 0.6 m gives t = 0.08 s, 225 kN, 19.1 g average;
triangle 0.5 s peaks at 72 kN.
Config: `mass: 1200`, `v0: 15`, `stopMode: time|distance`, `stop: 0.1` (s or m), `shape: constant|triangle|square`, `g: 9.8`, `dangerG: 30`, `duration: 3200`,
`ranges: {time:[0.02,1,0.01], distance:[0.05,2,0.05]}`, `units: {mass, speed, force, time, length}`,
`show: {car, forcePlot, area, peakForce, gBar, dangerBand(false), stopSlider, shapeToggle, labels, readouts, replay}`,
`readouts: [impulse, avgForce, peakForce, decel, time, distance]` (default first, third, fourth and second: impulse, peakForce, decel, time),
`presets: [{label, stop, stopMode, shape, mass, v0}]` (only given fields change), `labels: {impulse, avgForce, peakForce, decel, time, distance, stop,
run, reset, constant, triangle, wall, forceAxis, timeAxis, areaCaption, gAxis, danger, avg}`. Axes scale to the shortest and longest stops reachable
(slider ranges and presets), so a very hard stop shows a tall narrow spike. Reports nothing to the card.

Example: `{mass: 1200, v0: 15, stop: 0.1, show: {dangerBand: true}, presets: [{label: Hard, stop: 0.02}, {label: Airbag, stop: 0.5, shape: triangle}, {label: Crumple zone, stopMode: distance, stop: 0.6}]}`.
