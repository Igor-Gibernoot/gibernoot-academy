# `least-action-path`
Two modes in `js/widgets/least-action-path.js` (plain SVG + HTML, all wording from the config). Header comment lists every option.

**`mode: path` (default).** A particle goes from the fixed event (t0, y0) to (t1, y1); plot of height y against time t. The reader drags
`points` (1 to 5) control points vertically (at equally spaced times); the path is the polynomial through endpoints and points
(`curve: smooth`, default; 1 point = parabola) or straight pieces (`curve: linear`). Live action `S = integral (1/2 m y'^2 - m g y - k y^2/2) dt`
(Simpson, 800 steps), a gauge bar (S against the true value marked), the true path dashed (`m y'' = -m g - k y`, with its own S) and the optional
button `snap` (control points jump onto the true path). `hideTrue: true` hides the true path and `S_true` until the Reveal button.
Config: `t0 0, t1 2, y0 0, y1 2, yMin -1, yMax 4, points 1, curve, m 1, g 0, k 0, start [..], startOffset 1, hideTrue false, sliders [m, g, k], ranges`.

**`mode: fermat`.** Light from A (above the boundary y = 0, speed `v1`) to B (below, speed `v2`); the reader drags the crossing point X along
the boundary. Live travel time, angles from the normal (marks and readouts), Snell quantities sin(theta)/v of both media (equal at the minimum),
the minimum time and crossing point (golden-section search; dashed best path), optional small plot of time against X. Config: `A [0,3], B [6,-3],
xRange [-1,7], v1 1, v2 0.67, x (start), hideTrue, sliders [v1, v2], ranges`. Equal scale in x and y (angles are true).

Both: `units {time, distance, action}`, `show {truePath, readouts, bar, labels, grid, points, snap, reveal, parts, angles, snell, timeCurve, media, reset}`
(true except `grid`, `snap`, `timeCurve`; `snap` is false by default and in fermat it is a "go to the best point" button), `readouts` (path:
`S, Strue, diff, T, V`, default `S, Strue`; fermat: `time, best, theta1, theta2, snell1, snell2`, default `time, best`), `presets: [{label, ...}]`
(path fields `start, g, m, k, curve`; fermat `x, v1, v2`), `labels {...}` (see header). Reports nothing to the card. Pure helpers exported:
`makePath, actionOf, truePathOf, fermatTime, fermatBest`.

Script check (all by `actionOf`, m = 1, T = 2): free ball y0 = 0, y1 = 2: straight line S = 1; smooth path through (1, 2) (parabola) S = 2.333, straight
pieces through (1, 2) S = 2 (all larger: second variation `int m dy'^2 > 0`). Thrown ball g = 10, y0 = y1 = 0: parabola `10 t - 5 t^2` (peak 5 at t = 1)
has S = -33.333 (T part 33.33, V part 66.67); midpoint height 3, 4, 6, 7 give -28, -32, -32, -28, all larger (minimum at 5). Spring k = 1, m = 1,
T = 4 (> pi sqrt(m/k)), y0 = y1 = 1: true S = 2.185; adding 0.3 sin(pi t / 4) lowers S to 2.151, adding 0.3 sin(pi t / 2) raises it to 2.317, so the true
path is a saddle, stationary but not a minimum. Fermat glass (v1 1, v2 0.67, A (0,3), B (6,-3)): best x = 4.077, time 10.380 (straight line x = 3: 10.575),
sin(theta)/v = 0.8054 in both. Fermat water (v1 5, v2 1.5): best x = 5.193, time 3.271 (x = 3: 3.677), sin(theta)/v = 0.1732 in both.
Piecewise linear action has a small numeric error at the kinks (about 1e-3).

Example (smoke configs below also run in `widget-smoke`):
```smoke
mode: path
t0: 0
t1: 2
y0: 0
y1: 2
points: 1
show: {snap: true}
sliders: [m]
presets: [{label: Reset line, start: [1]}]
```
```smoke
mode: path
t1: 2
y1: 0
yMin: -2
yMax: 7
g: 10
points: 2
hideTrue: true
start: [2, 3]
readouts: [S, Strue, diff, T, V]
show: {snap: true, grid: true}
```
```smoke
mode: fermat
A: [0, 3]
B: [6, -3]
v1: 5
v2: 1.5
hideTrue: true
sliders: [v1, v2]
readouts: [time, best, theta1, theta2, snell1, snell2]
show: {timeCurve: true, snap: true}
labels: {medium1: sand, medium2: water}
```
```smoke
mode: fermat
v1: 1
v2: 0.67
show: {angles: false, media: false, labels: false, readouts: false}
```
