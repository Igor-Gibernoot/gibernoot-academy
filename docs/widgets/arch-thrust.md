# `arch-thrust`
A cable, an arch or a dome carrying a load (`js/widgets/arch-thrust.js`, plain SVG + HTML, all words and units from the config).
Line modes (`cable`, `arch`): span `L`, rise `h`, uniform load `w` per metre of horizontal span, optional point loads `points: [{x, P}]` (`x` = fraction of the span).
Beam analogy: `Va`, `Vb` by moments; `M0(x)`; shear `V(x)`. The thrust line passes through height `h` at midspan, so `H = M0(L/2)/h`; uniform load `H = w L^2/(8 h)`.
Thrust line `y_t = M0/H`, force along it `N = sqrt(H^2 + V^2)` (largest at the supports). **Cable**: takes the shape of the thrust line, hangs below the supports,
tension everywhere (uniform load: a parabola). **Arch**: the structure is the parabola `4 h x (L - x)/L^2` above the supports, compression everywhere; the dashed thrust line
coincides with it for a uniform load, departs from it under point loads. `thickness` t = depth of the stone section: middle third = thrust line within `+- t/6` of the centre
line (flag "edge" beyond, joints open), beyond `+- t/2` it leaves the stone (flag "outside", collapse). Modelling choice: the thrust line is pinned at the supports and the crown (three-pin arch).
Dome mode: thin spherical shell, membrane theory, own weight `w` per unit surface area, radius `a`, cap half-angle `alpha`, `phi` from the crown. Meridian force `-w a/(1+cos phi)`
(compression); hoop force `w a (1/(1+cos phi) - cos phi)` (tension positive): compression above `phi = 51.83 deg` (`cos phi (1 + cos phi) = 1`), tension below. Crown both `-wa/2`;
equator hoop `+wa`. Base per metre of edge: vertical `w a (1 - cos alpha)/sin alpha`, horizontal outward `w a cos alpha/(1 + cos alpha)` (zero for a hemisphere).
web: the 51.8 deg sign change and tension in the lower dome (Scribd dome-design worksheet, PSU "Geometry of the crack-free spherical masonry dome" abstract, Polimi abstract on meridional cracks and tension rings); the formulas themselves are the standard membrane results, checked by script (hoop = 0 at 51.83 deg, crown equal).
Exported for script checks: `archModel({span, rise, load, points})` -> `{Va, Vb, H, M0, V, thrust, N, parab, dev, Rmax, total}`, `domeForces(phi, a, w)` -> `{meridian, hoop}`, `domeBase(alpha, a, w)`, `HOOP_SWITCH`.
Script check: w 10 kN/m, L 40 m, h 5 m: H 400 kN, Va = Vb = 200 kN, largest force 447 kN; h 2.5 m: H 800 kN (flatter, double); point load 100 kN at midspan, no w: H = PL/(4h) = 200 kN;
w 4 + 150 kN at x = 0.25 L: Va 192.5, Vb 117.5, H 310 kN. Dome a 20 m, w 5 kN/m2: crown -50 / -50, equator -100 / +100, hemisphere base vertical 100 kN/m.
Config: `mode` (arch, cable, dome), `modes: ['cable','arch']` (buttons; add `dome`), `span: 40`, `rise: 5`, `load: 10`, `points: []`, `thickness: 1`, `domeRadius: 20`, `domeLoad: 5`, `domeAngle: 90`, `probe: 40`,
`ranges: {span: [20,80,1], rise: [2,15,0.5], load: [0,30,1], angle: [30,90,1]}` (the rise range also fixes the vertical scale), `units: {length, force, load, area, line}`, `forceScale` (force drawn as the longest arrow),
`readouts` (array or `{arch, cable, dome}`; keys thrust, vertical, maxforce, check, meridian, hoop, base, switch), `labels` (cable, arch, dome, thrust, vertical, maxforce, check, meridian, hoop, base, switch, tension, compression, span, rise, load, angle, cap, each, inside, edge, outside, hoopTension, hoopCompression, reset),
`show: {shape, ground, ghost, loadArrows, forceArrows, forceColors, reactions, thrustLine, stone, band, dimensions, labels, legend, readouts, flag, handles, pointHandles, riseSlider, spanSlider, loadSlider, angleSlider, capSlider, modeToggle, presets, forcePlot, switchLine, hoopRings}`
(all true except ghost, stone, band, spanSlider, loadSlider, capSlider, pointHandles; `ghost` = faint mirror of the shape, the other mode; `forceColors` off = neutral arrows; `handles` = crown (rise) and dome probe;
`flag` = the thrust-line message, only with `band`), `presets: [{label, mode, span, rise, load, points, thickness, domeAngle, probe, domeLoad}]` (only given fields change; Reset appears with presets).
Tension is orange (`--covec`), compression blue (`--vec`), reactions purple. Reports nothing to the card. Arrow lengths use one fixed scale (from the initial setting) so they grow when H grows.

Example: `{mode: arch, modes: [cable, arch], span: 40, rise: 5, load: 10, thickness: 1.2, show: {band: true, stone: true, ghost: true}, presets: [{label: Point load, points: [{x: 0.25, P: 150}], load: 4}]}`.
