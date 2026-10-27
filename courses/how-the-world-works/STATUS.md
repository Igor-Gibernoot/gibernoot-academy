# Status

Session start: read only the **Current** block (`sed -n '/^## Current/,/^## Log/p' courses/how-the-world-works/STATUS.md`), never the Log.

## Current (2026-10-26)

- **State:** course created; trail of 14 levels planned in `course.yaml` (no lessons built yet). Plan: build Levels 1 to 3 first, then review the tone with Igor before continuing.
- **Next unit:** `ch01-scales` (Level 1, concept, intro rules of the root `CLAUDE.md`), uses the shared widget `log-ruler` (built, in `docs/LESSON_FORMAT.md`). `exam-partial` is after Level 7, `exam-final` after Level 14.
- **Verified:** nothing yet.
- **Paths:** lessons `courses/how-the-world-works/chNN/`, exams `exams/`; references in `REFERENCES.md`.

## Log

- 2026-10-27 widget unit: built shared `log-ruler` (`js/widgets/log-ruler.js`, CSS block in `css/app.css`, docs entry). Choices: widgets report nothing to cards (house convention), so graded questions are separate numeric cards; `reveal:false` + Check for guess ladders; YAML values need `1.0e-10` (with dot). Conventions fixed here: none.
### 2026-10-26: course created
Trail from the brainstorm with Igor: principle-first levels, one machine per lesson, challenges are technology deep dives. Added physical keys (Level 2) and the solar panel (Level 10).
