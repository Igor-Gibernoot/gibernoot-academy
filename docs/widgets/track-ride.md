# `track-ride`
Side view of a track and a cart rolling on it (`js/widgets/track-ride.js`, plain SVG + HTML, wording from the config; no human tolerance figures are built in).
Model per unit mass: the cart is released at rest at the first point of the track, at height `h0` (`startHeight`); `v^2 = 2 g (h0 - y - f s)` (`f` = energy lost per
metre as a fraction of weight, a constant loss, not a full friction model); felt g = `N/(mg) = v^2 kappa / g + cos(phi)` (phi = track angle from horizontal, kappa =
signed curvature, positive when the track bends towards the cart's side: loop inside, dip). Loop bottom `1 + v^2/(g r)`, loop top `v^2/(g r) - 1`, crest top
`1 - v^2/(g r)`. `felt < 0` = airtime flag (the track cannot pull: the cart leaves it; the drawing keeps following the track, in the warning colour). The ride
stops where `v^2` reaches 0 (stall message). The cart's drawn orientation turns with the track (upside down at a loop top).
Profiles (`profile: 'name'` or `{type, ...params}`; heights in m):
`hill-hill` (params `h2` 30, `span` 2 h0, `tail`), `crest` (`crestH` 10, `crestR` 25 = exact radius of the hump top, `run` 2 h0, `tail`), `loop` / `loop-circle` (`loopHeight` 20,
`run` 2 h0, `tail` 15; an exact circle, entry and exit at the same point), `loop-clothoid` (same plus `ratio` 3 = top curvature / bottom curvature; teardrop), `points`
(`points: [[x, y], ...]`, x increasing, smooth with level tangents at every point; the first point's y is the start height).
Handles (profile `points`): drag vertically, the first handle sets the start height.
Exported for script checks: `buildTrack(profile, h0)`, `rideAt(T, s, {f, g})` -> `{x,y,v,felt,ke,pe,lost,air}`, `rideReach(T, {f, g})` -> `{reach, stalled}`.
Script check (g 9.8, h0 40, loop 20 m): loop top v = 19.8 m/s, felt 3.00 (= v^2/(g R) - 1 with R 10); crest 25 m radius, hump 10 m: top felt -1.38 (airtime, expect
1 - 2*30/25 = -1.40); loop with h0 = 25.2 gives about 0 at the top (limit 2.5 R = 25 m); hill-hill h0 40 / second hill 30 clears, h0 25 stalls at 102 m.
Config: `profile`, `startHeight: 40`, `friction: 0`, `position: 0` (0..1 of the track), `g: 9.8`, `speedup: 1.5`, `tolerance: {low, high}` (felt-g limits, numbers from the lesson;
drawn only with `show.tolerance`), `gRange: [min, max]` (default from the whole ride), `ranges: {height: [0.5 h0, 1.5 h0, 1], friction: [0, 0.3, 0.005]}`,
`units: {length, speed, energy}`, `readouts` (any of height, speed, g, ke, pe, lost, distance; default speed, g),
`show: {track, ground, cart, handles, maxLine, trace, normalArrow, weightArrow, gMeter, tolerance, gPlot, energyBar, labels, readouts, flag, positionSlider, heightSlider,
frictionSlider, play, presets}` (all true except handles (true only for `points`), tolerance, trace, heightSlider, frictionSlider; `trace` = travelled part drawn thick;
`normalArrow`/`weightArrow` = the track's push and the weight at the cart, 1 g = 15 px, N dashed when negative; `energyBar` = height energy / motion energy / lost),
`presets: [{label, profile, startHeight, friction, position}]` (only given fields change; a `profile` replaces the whole profile), `labels: {height, speed, g, ke, pe, lost,
distance, play, pause, reset, position, startHeight, friction, gMeter, energy, maxLine, airtime, stalled, low, high, gPlot, ground}`. The view is fixed from the highest start
height the slider allows, so the track does not rescale while sliding. Reports nothing to the card.

Example: `{profile: loop, startHeight: 30, show: {heightSlider: true, frictionSlider: true}, presets: [{label: Teardrop, profile: {type: loop-clothoid}}, {label: Crest, profile: crest, startHeight: 40}]}`.
