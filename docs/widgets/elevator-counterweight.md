# `elevator-counterweight`
A traction elevator (`js/widgets/elevator-counterweight.js`, plain SVG + HTML, all wording from the config): a cabin (empty mass + load) and a
counterweight hang on the two sides of a pulley driven by a motor. Model: ideal (massless rope, frictionless pulley, no drag) and CONSTANT speed
`v`, so all net forces are zero. Cabin rope `T1 = (cabin + load) g`, counterweight rope `T2 = counterweight g`, motor force on the cabin side of the
rope `F = T1 - T2 = (cabin + load - counterweight) g` (up positive), power `P = F * s * v` with `s = +1` going up, `-1` going down. `P > 0`: the
motor draws energy; `P < 0`: it brakes and regenerates (empty cabin going up with a heavy counterweight, or a full cabin going down). A trip of
`height` takes `t = height / v` and costs the motor `W = P t` (negative = energy returned). Each slider, preset or toggle replays a trip (3.5 s
whatever the real time). Draws: shaft guides, rotating pulley, cabin (load shaded) and counterweight (drawn only if its mass > 0) moving
oppositely, orange/purple tension arrows on the ropes (length proportional), a green motor-force arrow beside the pulley (up or down), a
power bar centred on zero (orange right = draws, green left = regenerates) and a trip-energy bar that fills as the run plays.
Exported `elevatorModel({cabin, load, counterweight, speed, dir, g, height})` (`dir` +1 up / -1 down) returns `{m, T1, T2, F, P, t, W, regen}`.
Script check (cabin 500 + load 300, 2 m/s, height 20 m): no counterweight gives F = 7840 N, P = 15.68 kW (down: -15.68 kW); counterweight
650 kg (cabin + half the load) gives F = 1470 N, P = 2.94 kW, W = 29.4 kJ full going up (down: -2.94 kW regenerating); empty cabin with 650 kg:
F = -1470 N (downward), P = -2.94 kW going up (regenerating), +2.94 kW going down.
Config: `cabin: 500`, `load: 300`, `counterweight: 0`, `speed: 2`, `dir: 'up'`, `g: 9.8`, `height: 20`, `duration: 3500`,
`ranges: {load:[0,800,10], counterweight:[0,1500,10], speed:[0.5,6,0.5]}`, `units: {mass, speed, force}`,
`show: {cabin, counterweight, ropeTensions, motorForce, powerBar, energy, loadSlider, counterweightSlider, speedSlider, directionToggle, shaft,
labels, readouts, replay}` (all true; `labels` = masses in the boxes, F letter and values, bar captions), `readouts: [tension, motorForce,
power, work, time]` (default first four; tension shows the cabin rope and, if the counterweight is drawn, the counterweight rope),
`presets: [{label, cabin, load, counterweight, speed, dir}]` (only given fields change), `labels: {tension, motorForce, power, work, time, load,
counterweight, speed, cabin, up, down, run, reset, regen, tensionCabin, tensionCw, force, motorDraws, motorRegen, energyAxis}`. Bar scales are fixed
by the largest reachable values, so bars do not rescale while a slider moves. Reports nothing to the card.

Example: `{cabin: 500, load: 300, counterweight: 0, show: {counterweightSlider: false}, presets: [{label: No counterweight, counterweight: 0},
{label: Balanced at half load, counterweight: 650}, {label: Empty cabin going up, load: 0, counterweight: 650, dir: up}]}`.
