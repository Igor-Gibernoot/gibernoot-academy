# `bike-balance`
A bicycle seen from behind as an inverted pendulum with steering feedback (`js/widgets/bike-balance.js`, plain SVG, no
library; all wording from the config). Parts: **back view** (wheel, lean rod and rider mass, dashed vertical and lean
arc), **top view** (front wheel turned by the steering angle and the dashed circle the bike follows, radius R = l / tan
delta), **plot** of the lean angle against time (fixed axes: 0 to `duration` s, -45 to 45 degrees, red dashed fall
lines), **readouts**, sliders and buttons.
Model (standard simplified bicycle, deterministic, dt = 0.005 s semi-implicit Euler): lean phi (positive = right)
`phi'' = (g/h) phi - (v^2/(h l)) delta`, steering `delta = clip(gain (phi + tau phi'), +-maxSteer)` (steer into the fall;
gain 0 = hands off, locked). Fall when |phi| > 45 degrees (the run stops, verdict "Falls (t s)"). A **Nudge** adds
`nudgeSize` to phi' (a sideways push); the first push of an autoplay run happens at 0.5 s. Moving a slider or pressing a
preset restarts the run. Exported `simulate(params, events, duration)` is the pure model (used for script checks).
Config: `speed: 1`, `gain: 0` (start values), `duration: 8`, `nudge: true` (button), `nudgeSize: 0.8` (rad/s),
`autoplay: true` (false = idle until Nudge), `sliders: ['speed','gain']`, `speedRange: [0,10]`, `gainRange: [0,4]`,
`height: 1` (h, m), `wheelbase: 1` (l, m), `tau: 0.3` (s), `maxSteer: 0.6` (rad),
`show: {lean, wheel, plot, turnArc, readouts}` (each false hides it; lean = rod, mass, vertical, arc; wheel = wheel
ellipse), `readouts: ['lean','steer','speed','verdict']` (order and choice), `presets: [{label, speed, gain}]`,
`labels: {speed, gain, nudge, reset, lean, steer, verdict, balancing, upright, fell, time, bike, turn, plot}`.
Checked numbers (nudge 0.8 rad/s at 0.5 s, 8 s run): gain 0 falls at every speed 0 to 10 m/s (at 1.08 s); gain 2: falls
at 1 m/s (1.15 s) and 2 m/s (1.70 s), recovers from 3 m/s up (peak lean 6.0 deg at 3 m/s, 2.2 deg at 5 m/s, back to 0).
Balance needs v^2 gain > g l (here v > 2.2 m/s for gain 2). Example: `{speed: 5, gain: 2, presets: [{label: "Slow",
speed: 1, gain: 2}, {label: "Hands off", speed: 5, gain: 0}]}`.
