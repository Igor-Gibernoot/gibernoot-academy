# Status log

## 2026-10-27 ch01-traps
Built `ch01/traps.yaml` (17 cards: hook, 14 fast questions on scales/units, energy, feedback, tradeoffs with new numbers, summary). Choices: the closing card is a plain text card "Traps to remember" (no `own:`, the validator says `own:` is for concept and intuition lessons), so no Recap blanks; a few extra cards beyond the 14 planned (separate power-vs-efficiency and impossible-efficiency, beam 3 to 6 cm instead of 2 to 4). Conventions fixed here: traps lessons end with a plain summary text card, no `own:`.

## 2026-10-27 ch01-tour
Built `ch01/tour.yaml` (17 cards: hook, 13 puzzles one per later level (fluids has mcq + numeric volume), closing table, summary with 5 blanks). No widget (puzzles are guessable text; a picture would give answers away). Choices: no card says "Level N" for later levels, names only; the paint-mixing analogy for key exchange; frontier puzzle is a pure mcq. Numbers checked by script. Validate and shots clean. Conventions fixed here: tour typical values (copied to CONVENTIONS.md).

## 2026-10-27 ch01-tradeoffs
Built `ch01/tradeoffs.yaml` (22 cards: beam strength vs weight with tradeoff-curve, needs region, feasible range, bicycle speed vs force with P = F v, infeasible needs, order card, 3 trap cards, summary with 5 blanks). All numbers checked by script (160/360/640/1960 kN; weights 5/7/9/15; sqrt(10)=3.16; 5.5 cm; 40 N; 240 W). Choices: beam values stated as made-up but plausible typical values; weight = 2t+1 so doubling gives 1.8x (said "less than 2x"); the "what to do" card is multi-select; trap round of 3. Validate and shots clean; range/gear-needs presets viewed. Conventions fixed here: beam and gear numbers above (copied to CONVENTIONS.md).

## 2026-10-27 widget tradeoff-curve
Checked feedback-loop, log-ruler, bregman-gap: none draws a parametric two-quantity curve with a needs region. Built `tradeoff-curve` (quantities a*s^k+b of one slider; needs rectangle; feasible-part highlight, guides, readouts incl. feasible design range). CSS prefix `tc-` (`fl-` is taken). Smoke and validate pass; screenshots checked (phone, desktop). Choices: axis ranges default to curve extent; curve clamps at the axis range; marker turns green when all needs are met. Conventions fixed here: none (widget only).

Newest first. Never read this file in a session; add an entry by `Edit`ing the `# Status log` line.

- 2026-10-27 ch01-feedback (20 cards: hook, open-loop room, sense/compare/act, on/off room, error, open vs closed, delay overshoot, toilet, cruise, 3 traps). Chose a numeric for the open-loop equilibrium (25 C) and band 1 (calm) / band 2 + delay 8 (overshoot, swings about 16 to 23). Verified by script: equilibrium out+20 (0.8/0.04); heater duty 80% at 5 C and 30% at 15 C outside (21 C setpoint); outside range [3,15] for onoff so the heater can hold 21. Conventions fixed here: feedback-loop preset labels are plain text (math in a preset label renders as raw HTML); always-on room: heater +0.8 C/min, loss 0.04 C/min per degree above outside; error e = T_set - T_sensed, heater on iff e > 0.
- 2026-10-27 widget `feedback-loop` (js/widgets/feedback-loop.js, docs in LESSON_FORMAT.md): thermostat room, modes open/onoff, band, delay; plot window scrolls, dt 0.5 min, leak 0.04, power 0.8 (heater-on equilibrium = outside + 20 degrees). Smoke and phone/desktop shots checked. Conventions fixed here: error = setpoint - sensed; room unit minutes, degrees C.

- 2026-10-27 ch01-energy built (hook, words, kettle, order of stores + log-ruler picture, phone Wh to J, lamp hours, bike heat, efficiency + bulb, kWh trap, "used up" trap, summary; 13 cards). Choices: log-ruler with `reveal: true, slider: false, readout: false` after the order card; two traps kept as mcq; guess-line in the hook. Conventions fixed here: see CONVENTIONS.md Chapter 1.

- 2026-10-27 ch01-scales built (hook guesses, powers of ten, log-ruler ladder and speeds, scaling, unit rules, heart estimate; 18 cards). Choices: speeds ruler placed after the order card with `reveal: true, slider: false, readout: false`; cable strength given in the prompt as 1e9 N/m^2. Conventions fixed here: see CONVENTIONS.md Chapter 1.

- 2026-10-27 widget unit: built shared `log-ruler` (`js/widgets/log-ruler.js`, CSS block in `css/app.css`, docs entry). Choices: widgets report nothing to cards (house convention), so graded questions are separate numeric cards; `reveal:false` + Check for guess ladders; YAML values need `1.0e-10` (with dot). Conventions fixed here: none.
### 2026-10-26: course created
Trail from the brainstorm with Igor: principle-first levels, one machine per lesson, challenges are technology deep dives. Added physical keys (Level 2) and the solar panel (Level 10).
