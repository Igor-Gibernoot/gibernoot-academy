# `boiling-curve`
Boiling (saturation) temperature against pressure (`js/widgets/boiling-curve.js`, plain SVG + HTML, all wording from the config). The curve comes from a data table in the preset
(rows `[T in °C, p]`); between rows it is a monotone cubic of ln p against 1/T (kelvin), which passes through every row (checked by script: table reproduced to 1e-15; with every other
row left out the held-out pressures are within 0.05 %; boiling point at 101.325 kPa: R-134a -26.07 C, isobutane -11.75 C). Two draggable dots (mouse or touch, or sliders) sit on the curve:
`low` (evaporator) and `high` (condenser), each with its boiling temperature. `mode: single` keeps only the `low` dot (water at a given pressure). Reports nothing to the card.
Exported `satModel(table)` gives `{pOf(T), TOf(p), pMin, pMax, Tmin, Tmax}`.
Config: `table`, `units: {p, temp}` (the table must already be in `units.p` and °C), `mode`, `low`, `high` (start pressures), `logP` (default true; false = linear axis), `pRange`, `TRange`
(axis limits; default the table range), `lines: {cold, warm}` (temperatures of two horizontal lines), `show: {curve, grid, axes, guides, markers, markerLabels, lineCold, lineWarm,
lineLabels, lift, regions, readouts, sliders, handles, presets, reset}` (all true except `lift`, `regions`, `sliders`; the lines appear only if `lines` gives their temperature; `lift` = shaded
band between the two boiling temperatures with its width; `regions` = the words `liquid` and `gas` on the two sides of the curve; `guides` = dashed lines from a dot to the axes),
`readouts` (any of `pLow, TLow, pHigh, THigh, ratio, lift, p, T`; default `pLow, TLow, pHigh, THigh`, or `p, T` in single mode), `presets: [{label, low, high}]`,
`labels: {pLow, TLow, pHigh, THigh, ratio, lift, p, T, low, high, single, cold, warm, liquid, gas, xAxis, yAxis, sliderLow, sliderHigh, sliderSingle, reset, aria}`.
The dots stay inside the table range and `low <= high`. Pressure ratio = `high / low`.

Data (NIST Chemistry WebBook fluid properties, saturation, web-checked, see the course `VERIFIED.md`; pressures in kPa; R-134a and isobutane -40 to 90 C in steps of 5, water 20 to 180 C in steps of 10).
R-134a (`ID C811972`; normal boiling point -26.07 C):
`[[-40,51.209],[-35,66.144],[-30,84.378],[-25,106.40],[-20,132.73],[-15,163.94],[-10,200.60],[-5,243.34],[0,292.80],[5,349.66],[10,414.61],[15,488.37],[20,571.71],[25,665.38],[30,770.20],[35,886.98],[40,1016.6],[45,1159.9],[50,1317.9],[55,1491.5],[60,1681.8],[65,1889.8],[70,2116.8],[75,2364.1],[80,2633.2],[85,2925.8],[90,3244.2]]`
Isobutane R-600a (`ID C75285`; normal boiling point -11.75 C):
`[[-40,28.702],[-35,36.797],[-30,46.622],[-25,58.427],[-20,72.477],[-15,89.053],[-10,108.45],[-5,130.98],[0,156.96],[5,186.72],[10,220.61],[15,258.99],[20,302.22],[25,350.67],[30,404.72],[35,464.77],[40,531.21],[45,604.44],[50,684.90],[55,772.99],[60,869.16],[65,973.85],[70,1087.5],[75,1210.7],[80,1343.8],[85,1487.4],[90,1642.0]]`
Water (`ID C7732185`):
`[[20,2.3393],[30,4.2470],[40,7.3849],[50,12.352],[60,19.946],[70,31.201],[80,47.414],[90,70.182],[100,101.42],[110,143.38],[120,198.67],[130,270.28],[140,361.54],[150,476.16],[160,618.23],[170,792.19],[180,1002.8]]`
Handy numbers (script, interpolated): isobutane 110 kPa boils at -9.6 C, 450 kPa at 33.8 C (pressure ratio 4.1); R-134a 300 kPa at 0.7 C, 350 kPa at 5.0 C, 700 kPa at 26.7 C, 1100 kPa at 43.0 C (ratio 3.1); water 101.325 kPa at about 100 C, 200 kPa at about 120.2 C.

Examples (paste the table in `table:`). Fridge loop, isobutane, 4 C inside, 22 C kitchen: evaporator must boil below 4 C, condenser above 22 C:
`{table: <R-600a>, low: 110, high: 450, lines: {cold: 4, warm: 22}, labels: {low: Evaporator, high: Condenser, cold: Inside, warm: Kitchen, xAxis: Pressure, yAxis: Boiling temperature, liquid: liquid, gas: gas}, readouts: [pLow, TLow, pHigh, THigh, ratio], show: {lift: true}}`
Air conditioner, R-134a, 24 C room, 35 C outside: `{table: <R-134a>, low: 350, high: 1100, lines: {cold: 24, warm: 35}, labels: {low: Evaporator, high: Condenser, cold: Room, warm: Outside}, readouts: [pLow, TLow, pHigh, THigh, ratio, lift], show: {lift: true, sliders: true}}`
(for the aircon the evaporator is usually a few degrees below the room air and the condenser above the outside air; the lesson chooses the numbers.)
Water, pressure cooker: `{table: <water>, mode: single, low: 101.325, logP: false, pRange: [0, 400], labels: {single: Pot, liquid: water, gas: steam}, readouts: [p, T], show: {regions: true}}`
`pRange` lower end must stay at or above the table's lowest pressure to be used (dots are kept inside the table range); with the water table the lowest pressure is 2.34 kPa.

```smoke
table: [[-40,28.702],[-30,46.622],[-20,72.477],[-10,108.45],[0,156.96],[10,220.61],[20,302.22],[30,404.72],[40,531.21],[50,684.90],[60,869.16],[70,1087.5],[80,1343.8],[90,1642.0]]
low: 110
high: 450
lines: { cold: 4, warm: 22 }
labels: { low: Evaporator, high: Condenser, cold: Inside, warm: Kitchen, liquid: liquid, gas: gas, lift: Lift }
readouts: [pLow, TLow, pHigh, THigh, ratio, lift]
show: { lift: true, regions: true, sliders: true }
presets: [{ label: Cold, low: 60, high: 300 }]
```
