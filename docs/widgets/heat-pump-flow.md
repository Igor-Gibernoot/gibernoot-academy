# `heat-pump-flow`
A refrigerator or heat pump as an energy flow (`js/widgets/heat-pump-flow.js`, plain SVG + HTML, all wording from the config). A cold box at `Tc`, a warm room at `Th`,
a compressor between them; three arrows: heat `Qc` taken from the cold side, work `W` put in, heat `Qh = Qc + W` delivered to the room (arrow widths proportional to the
flows, minimum 1.5 px, reference = the start values). Reports nothing to the card. General tool: fridge, freezer, air conditioner, heating heat pump.
Model (degrees in the UI, kelvin = +273.15 in every formula): Carnot limit cooling `Tc/(Th - Tc)`, heating `Th/(Th - Tc)` = cooling + 1; achieved `COP_c = factor x Carnot`
(mode `factor`, default, slider 0 to 1) or a fixed `COP_c = cop` (mode `cop`, chosen by giving `cop`; the fraction becomes a readout and a strip warns when it exceeds the Carnot
limit); `W = Qc/COP_c`, `Qh = Qc + W`, `COP_h = Qh/W = COP_c + 1`; work per 100 of heat moved `100/COP_c`. Heat to move is `qc.value` (energy, `units.heat: J`) or, with
`show.qcSlider` and `units.heat: W`, a power: the readout `W` is then the electric power needed. Exported `pumpModel({Tc, Th, factor|cop, Qc})`.
Script check: Tc 277.15 K, Th 295.15 K: Carnot 15.40 (heating 16.40); at 40 % COP_c 6.16, COP_h 7.16, W 16.2 J per 100 J moved; -18 / 22 C at 40 %: Carnot 6.38, COP_c 2.55, 39.2 J per 100 J;
0 / 20 C at 50 %: Carnot 13.66; 0 / 35 C at 100 %: 7.80 and 8.80 (matches the published example, web-checked, see the course `VERIFIED.md`).
Config: `Tc`, `Th`, `factor` or `cop`, `qc: {value, min, max, step}`, `tempRange: {cold: [lo, hi, step], hot: [...]}` (defaults -30..20 and 0..40), `factorRange` (0.05 to 1),
`copRange` (0.5 to 12), `units: {temp, heat}`, `show: {coldBox, room, pump, arrowQc, arrowW, arrowQh, arrowLabels, tempLabels, badge, limitWarning, readouts, tempSliders, factorSlider,
copSlider, qcSlider, handles, presets, reset}` (all true except `qcSlider`; `handles` = drag a box up or down; `badge` shows only if `labels.badge` is non-empty),
`readouts` (any of `copC, copH, carnotC, carnotH, factor, work100, work100H, Qc, W, Qh`; default `copC, copH, carnotC, work100`), `presets: [{label, Tc, Th, factor, cop, qc}]`,
`labels: {copC, copH, carnotC, carnotH, factor, work100, work100H, Qc, W, Qh, cold, room, pump, badge, beyond, factorSlider, copSlider, qcSlider, tempCold, tempHot, reset, aria}`.
Real values (web-checked): the Carnot COP is a ceiling; real air heat pumps give about 3 to 4 at a mild single point and less over a season; real cooling machines reach a fraction of Carnot.

Keep the arrow names short (about 12 characters; the gap between box and compressor is about 70 px). Examples. Fridge 4 C inside, 22 C kitchen, machine at 40 % of Carnot:
`{Tc: 4, Th: 22, factor: 0.4, labels: {cold: Inside, room: Kitchen, pump: Compressor, badge: "Heat uphill needs work", Qc: "Heat taken", W: "Work", Qh: "Heat to the kitchen"}, readouts: [copC, copH, carnotC, work100]}`.
Freezer: same with `Tc: -18` (Carnot 6.38; set `tempRange.cold: [-30, 10, 1]`). Heating heat pump, 0 C outside, 20 C inside, 3.5 kW of heat moved:
`{Tc: 0, Th: 20, factor: 0.5, qc: {value: 3500, min: 500, max: 6000, step: 250}, units: {heat: W}, show: {qcSlider: true}, labels: {cold: Outside, room: Inside, pump: Pump}, readouts: [Qc, W, Qh, copH, carnotH]}`.
Fixed COP instead of a fraction: add `cop: 3` (then `readouts: [factor]` shows the fraction of Carnot).

```smoke
Tc: 4
Th: 22
factor: 0.4
qc: { value: 500, min: 100, max: 3000, step: 100 }
units: { heat: W }
labels: { cold: Fridge, room: Kitchen, pump: Pump, badge: Heat uphill needs work, Qc: Heat moved, W: Work, Qh: Heat out }
show: { qcSlider: true }
readouts: [copC, copH, carnotC, carnotH, factor, work100, work100H, Qc, W, Qh]
presets: [{ label: Freezer, Tc: -18 }, { label: Heating, Tc: 0, Th: 20 }]
```
