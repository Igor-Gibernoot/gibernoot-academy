# Status

Session start: read only the **Current** block (`sed -n '/^## Current/,/^## Log/p' courses/how-the-world-works/STATUS.md`), never the Log.

## Current (2026-10-26)

- **State:** `ch01-scales` built (18 cards). Rest of the trail planned. Plan: build Levels 1 to 3 first, then review the tone with Igor before continuing.
- **Next unit:** `ch01-energy` (Level 1, concept, intro rules). `exam-partial` is after Level 7, `exam-final` after Level 14.
- **Verified:** ch01-scales: all numbers by script (cable 114 adults at 1 GPa; 90 km/h = 25 m/s; heart 2.94e9; water 58400 L); typical values: car 1000-1500 kg, plane 250 m/s, Earth orbit 29.8 km/s.
- **Paths:** lessons `courses/how-the-world-works/chNN/`, exams `exams/`; references in `REFERENCES.md`.

## Log

- 2026-10-27 ch01-scales built (hook guesses, powers of ten, log-ruler ladder and speeds, scaling, unit rules, heart estimate; 18 cards). Choices: speeds ruler placed after the order card with `reveal: true, slider: false, readout: false`; cable strength given in the prompt as 1e9 N/m^2. Conventions fixed here: see CONVENTIONS.md Chapter 1.

- 2026-10-27 widget unit: built shared `log-ruler` (`js/widgets/log-ruler.js`, CSS block in `css/app.css`, docs entry). Choices: widgets report nothing to cards (house convention), so graded questions are separate numeric cards; `reveal:false` + Check for guess ladders; YAML values need `1.0e-10` (with dot). Conventions fixed here: none.
### 2026-10-26: course created
Trail from the brainstorm with Igor: principle-first levels, one machine per lesson, challenges are technology deep dives. Added physical keys (Level 2) and the solar panel (Level 10).
