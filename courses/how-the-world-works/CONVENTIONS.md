# how-the-world-works conventions by chapter

Everything fixed while building this course: notation, running examples, key numbers, per-lesson choices.
Read only the section you need: `grep -n '^## ' courses/how-the-world-works/CONVENTIONS.md`, then `sed -n` that range.

## General (rules fixed while building)

- SI units; $g = 9.8\ \mathrm{m/s^2}$; $c \approx 3\times10^8$ m/s.

## Chapter 1

- Tone: plain words, guess first, each numeric card gives its data and units; explanations name what each factor counts. Guess-is-the-point line in the first card only so far.
- Powers of ten: exponent is not 'times'; order of magnitude = factor 10; good guess = within one order.
- Rules of thumb: 1 m/s = 3.6 km/h; 1 year ~ 3e7 s (pi x 1e7); scaling k -> area k^2, volume k^3.
- Typical values used: car 1000 kg, plane 250 m/s, walking 1.4 m/s, motorway car 30 m/s, Earth orbit 3e4 m/s, steel 1e9 N/m^2, adult 700 N, hair 1e-4 m, atom 1e-10 m.
- Energy lesson: $E = P\,t$ (J, W, s); 1 Wh = 3600 J, 1 kWh = 3.6e6 J; efficiency = useful/total (fraction, 0 to 1); typical: phone 5.4e4 J, chocolate bar 1.1e6 J, petrol 3.4e7 J/L, cyclist 400 W in / 100 W useful, filament bulb 50 W in / 5 W light. Heat is the usual leftover ("energy is moved, not used up").
- Guess-is-the-point line is repeated in the hook of every Level 1 lesson.
- log-ruler: guess ladder `reveal:false`; picture after its question `reveal:true, slider:false, readout:false`; widget cards `review: false`.
- Feedback lesson: room heater +0.8 C/min, loss 0.04 C/min per degree above outside (always-on settles at outside + 20); error $e = T_{\text{set}} - T_{\text{sensed}}$, heater on iff $e>0$; band/hysteresis glossed; feedback-loop presets: plain-text labels (no math), `review: false`, onoff outsideRange [3,15].
- Tradeoffs lesson: beam strength $S = 40t^2$ kN, weight $w = 2t+1$ kg/m ($t$ cm), needs $S\ge400$, $w\le12$, feasible $t\in[3.16, 5.5]$ (3.2 to 5.5 cm); bicycle $P = F\cdot v$, $v = 2s$ m/s, $F = 100/s$ N (P = 200 W), needs $v\ge4$, $F\ge60$ infeasible (needs 240 W); tradeoff-curve cards `review: false`, `range` only revealed in the resolving card.
