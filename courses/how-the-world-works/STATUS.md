# Status

Session start: read only the **Current** block (`sed -n '/^## Current/,/^## Log/p' courses/how-the-world-works/STATUS.md`), never the Log.

## Current (2026-10-26)

- **State:** `ch01-scales` (18), `ch01-energy` (13) and `ch01-feedback` (20 cards) built. Rest of the trail planned. Plan: build Levels 1 to 3 first, then review the tone with Igor before continuing.
- **Next unit:** widget `tradeoff-curve` (own session), then lesson `ch01-tradeoffs` (Level 1, concept, intro rules). `exam-partial` is after Level 7, `exam-final` after Level 14.
- **Verified (ch01-energy, by script):** 2000 W x 180 s = 3.6e5 J; 15 Wh = 54000 J; 54000 J / 10 W = 1.5 h; 1 kWh = 3.6e6 J; typical values: phone 5.4e4 J, chocolate bar 50 g about 260 kcal = 1.1e6 J, petrol 3.4e7 J/L, cyclist 400 W in / 100 W useful (25%), filament bulb 10%.
- **Verified:** ch01-scales: all numbers by script (cable 114 adults at 1 GPa; 90 km/h = 25 m/s; heart 2.94e9; water 58400 L); typical values: car 1000-1500 kg, plane 250 m/s, Earth orbit 29.8 km/s.
- **Paths:** lessons `courses/how-the-world-works/chNN/`, exams `exams/`; references in `REFERENCES.md`.

## Log

- 2026-10-27 ch01-feedback (20 cards: hook, open-loop room, sense/compare/act, on/off room, error, open vs closed, delay overshoot, toilet, cruise, 3 traps). Chose a numeric for the open-loop equilibrium (25 C) and band 1 (calm) / band 2 + delay 8 (overshoot, swings about 16 to 23). Verified by script: equilibrium out+20 (0.8/0.04); heater duty 80% at 5 C and 30% at 15 C outside (21 C setpoint); outside range [3,15] for onoff so the heater can hold 21. Conventions fixed here: feedback-loop preset labels are plain text (math in a preset label renders as raw HTML); always-on room: heater +0.8 C/min, loss 0.04 C/min per degree above outside; error e = T_set - T_sensed, heater on iff e > 0.
- 2026-10-27 widget `feedback-loop` (js/widgets/feedback-loop.js, docs in LESSON_FORMAT.md): thermostat room, modes open/onoff, band, delay; plot window scrolls, dt 0.5 min, leak 0.04, power 0.8 (heater-on equilibrium = outside + 20 degrees). Smoke and phone/desktop shots checked. Conventions fixed here: error = setpoint - sensed; room unit minutes, degrees C.

- 2026-10-27 ch01-energy built (hook, words, kettle, order of stores + log-ruler picture, phone Wh to J, lamp hours, bike heat, efficiency + bulb, kWh trap, "used up" trap, summary; 13 cards). Choices: log-ruler with `reveal: true, slider: false, readout: false` after the order card; two traps kept as mcq; guess-line in the hook. Conventions fixed here: see CONVENTIONS.md Chapter 1.

- 2026-10-27 ch01-scales built (hook guesses, powers of ten, log-ruler ladder and speeds, scaling, unit rules, heart estimate; 18 cards). Choices: speeds ruler placed after the order card with `reveal: true, slider: false, readout: false`; cable strength given in the prompt as 1e9 N/m^2. Conventions fixed here: see CONVENTIONS.md Chapter 1.

- 2026-10-27 widget unit: built shared `log-ruler` (`js/widgets/log-ruler.js`, CSS block in `css/app.css`, docs entry). Choices: widgets report nothing to cards (house convention), so graded questions are separate numeric cards; `reveal:false` + Check for guess ladders; YAML values need `1.0e-10` (with dot). Conventions fixed here: none.
### 2026-10-26: course created
Trail from the brainstorm with Igor: principle-first levels, one machine per lesson, challenges are technology deep dives. Added physical keys (Level 2) and the solar panel (Level 10).
