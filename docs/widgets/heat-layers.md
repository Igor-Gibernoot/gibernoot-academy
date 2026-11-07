# `heat-layers`
Steady heat flow through a wall or flask cross-section of 1 to 3 layers in series between a hot and a cold side (`js/widgets/heat-layers.js`, plain SVG + HTML,
all wording from the config). Draws the layers side by side (width follows thickness, minimum 22 px), the temperature profile above them as straight segments
(steepest in the best insulator), a heat-flow arrow, the layers' resistances, a bar of each layer's share of the total resistance, readouts and controls.
Reports nothing to the card. General tool: windows, oven walls, jackets, vacuum flasks, fridge walls, a pan bottom.
Model (area `A`, thickness `L` in metres internally): layer `R = L/(k A)` (K/W); a layer given with a coefficient `h` (surface film, convection, radiation
across a vacuum gap) has `R = 1/(h A)`; series `R_tot = sum R`; `Q = (T_hot - T_cold)/R_tot = A dT / sum(L/k)`; drop across a layer `Q R`; flux `Q/A`;
`U = 1/(A R_tot)`; optional surface films (hot side `films.hot` = 8, cold side `films.cold` = 25 W/m^2 K, toggle); optional body of heat capacity `body.C` (J/K):
time constant `tau = C R_tot`. Exported `stackModel({layers:[{k,L,h}], A, Thot, Tcold, films:{hot,cold}|null})` -> `{R[], Rtot, Q, dT, T[], flux, U, Rarea}`
(`T[j]` = temperature before resistance j).
Script check: glass 1 cm, k 1.0, A 1, dT 20 gives R 0.01, Q 2000 W; air gap 1 cm k 0.026 gives R 0.3846, Q 52 W; glass-air-glass (1 cm each) R 0.4046, Q 49.4 W with the
air taking 19.02 K of 20; glass with films 8 and 25: R 0.175, Q 114.3 W; glass in series with a gap h = 6: R 0.1767.
Config: `layers: [{name, k, L, h, type, min, max, step, fixed, color, materials}]` (L in `lengthUnit`, default cm, `lengthScale` 100 = units per metre; `type: gap` draws a
hatched layer; `h` instead of `k`/`L` makes a thin surface-type layer with no thickness; `min/max/step` = thickness slider range, defaults L/4, 4L; `fixed` = not adjustable;
`materials` = names offered in a select for that layer), `materials: [{name, k, h, color}]`, `A: 1`, `Thot: 80`, `Tcold: 20`, `tempRange: [lo, hi, step]` (temperature sliders;
giving it fixes the profile axis, else the axis fits the start values and presets), `films: {hot, cold, on}`, `body: {C}`, `units: {temp, length, power, area}`,
`show: {layers, names, kValues, thickness, profile, tempLabels, guides, resistances, resistanceBar, flowArrow, hotCold, films, readouts, thicknessSliders, kSliders,
tempSliders, materialSelects, filmToggle, handles, presets, reset}` (all true except `kSliders`, `tempSliders`, `filmToggle`; `handles` = drag the right edge of a layer, mouse or touch;
`films` = the dashed film slabs when the films are on), `readouts` (any of `Q, flux, Rtot, Rarea, U, dT, tau, layerR, layerDT`; default Q, Rtot),
`presets: [{label, Thot, Tcold, films, layers: [{L, k, h} by position], materials: [names by position]}]`, `labels: {Q, flux, Rtot, Rarea, U, dT, tau, layerR, layerDT, hot,
cold, thickness, k, temp, films, filmsOn, filmsOff, reset, aria}`.
Typical k (W/m K, web-checked, see the course `VERIFIED.md`): copper 385-401, carbon steel 36-54 (stainless 14-24), window glass 0.8-1.0, oak 0.15-0.17, pine 0.09-0.12,
still air about 0.026, sheep wool batt 0.035-0.042, expanded polystyrene 0.030-0.040, water 0.59. Surface films: inside about 8, outside about 25 W/m^2 K (R_si 0.13, R_se 0.04 m^2 K/W).

Examples. One layer: `{Thot: 20, Tcold: 0, layers: [{name: Glass, k: 1.0, L: 1, min: 0.5, max: 5, step: 0.1}], readouts: [Q, Rtot]}`.
Two layers in series (foam against wood): `{Thot: 90, Tcold: 20, layers: [{name: Wood, k: 0.15, L: 2}, {name: Foam, k: 0.033, L: 5}], readouts: [Q, Rtot, layerDT]}`.
Air gap and double glazing: `{Thot: 20, Tcold: 0, layers: [{name: Glass, k: 1.0, L: 0.4, fixed: true}, {name: Air, type: gap, k: 0.026, L: 1.2, min: 0.2, max: 4}, {name: Glass, k: 1.0, L: 0.4, fixed: true}]}`.
Flask (wall, vacuum, radiation as a coefficient, body cooling): `{Thot: 90, Tcold: 20, A: 0.05, body: {C: 400000}, layers: [{name: Steel, k: 16, L: 0.1, fixed: true}, {name: Vacuum, type: gap, h: 0.3}, {name: Steel, k: 16, L: 0.1, fixed: true}], readouts: [Q, Rtot, tau]}`.

```smoke
Thot: 90
Tcold: 20
A: 0.05
films: { hot: 8, cold: 25 }
body: { C: 400000 }
materials:
  - { name: Steel, k: 16 }
  - { name: Wood, k: 0.15 }
layers:
  - { name: Steel, k: 16, L: 0.1, min: 0.05, max: 0.5, step: 0.05, materials: [Steel, Wood] }
  - { name: Vacuum, type: gap, h: 0.3 }
  - { name: Foam, k: 0.033, L: 2, min: 0.5, max: 6, step: 0.5 }
show: { filmToggle: true, tempSliders: true, kSliders: true }
readouts: [Q, flux, Rtot, Rarea, U, dT, tau, layerR, layerDT]
presets: [{ label: Wood, materials: [Wood], films: true, Thot: 60 }]
```
