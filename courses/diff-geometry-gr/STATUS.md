# Status

Session start: read this file (short); never read `STATUS.log.md`.
Session end: update Current in place (keep it under ~40 lines: replace, don't append) and add a
3-line entry at the top of `STATUS.log.md`, ending "Conventions fixed here: …"; copy those conventions
into the chapter's section of `CONVENTIONS.md`, not into Current.

## Current (2026-10-24)

- **State:** the whole trail is built: Levels 1-10 (every concept, guided, intuition, traps,
  map, review and challenge node in `course.yaml`), `exam-partial` (after Level 5) and
  `exam-final` (after Level 10). No planned nodes left.
- **Next units (optional, pick one per session):** revisions from Igor's feedback; another intuition lesson only where a formula family gets mixed up (candidates: Einstein equations and trace reversal, Levi-Civita vs other connections). Built so far: `ch10-intuition-christoffel` (before Schwarzschild), `ch10-intuition-lorentz` (after `ch10-lorentz`), `ch10-intuition-einstein` (after `ch10-einstein-hilbert`). `ch10-intuition-connections` (after `ch10-intuition-einstein`, Levi-Civita vs other connections). No intuition lesson is pending.
- **Oversized-lesson cleanup (autonomous, 5 per session from now on):** **finished: 0 warnings left** (`node tools/validate.mjs diff-geometry-gr`). Last four split: `ch09-tidal`, `ch03-smooth-maps`, `ch04-tangent-space`, `ch10-traps` (each Part 1 + `-2`). Done (each now Part 1 + `-2`): `ch02-tensors`, `ch05-module`, `ch07-signature`, `ch08-circle-length`, `ch09-stratified`, `ch04-cotangent-basis`, `ch06-torsion-curvature`, `ch10-spacetime`, `ch10-matter`, `ch04-coordinate-basis`, `ch08-volume-forms`, `ch09-point-mass`, `ch10-einstein-hilbert`, `ch06-three-connections`, `ch09-pseudo-forces`, `ch10-schwarzschild`, `ch04-tensor-space`, `ch06-parallel-transport`, `ch07-euler-lagrange`, `ch07-levi-civita`, `ch08-metric-volume`, `ch09-gravity-connection`, `ch07-metric`, `ch07-curvature`, `ch07-sphere`, `ch05-vector-fields`, `ch06-connections`, `ch07-geodesic-equation`, `ch10-worldlines`, `ch10-observers`, `ch05-differentials`, `ch06-christoffel`, `ch07-length`, `ch09-newtonian-spacetime`, `ch09-newton-axioms`.- **Conventions:** `CONVENTIONS.md`, one section per chapter (notation, running examples,
  key numbers already used). Before building or editing a lesson of Chapter N, read that
  section only (`grep -n '^## ' CONVENTIONS.md`). The rules that apply everywhere are in its
  **General** section; the most-used ones:
  - Never edit the text of a recap blank `{{ }}` without need: its progress is keyed by its hash.
  - The first raised label ($x^1$) appears in `ch02-axioms` ("labels, not powers"); a lesson that
    introduces one earlier must say so.
  - Map arrows take `label:` (1-3 words) only between different rows.
  - Exam cards: tagged `Question N · …`, ids `qN-…`, `points:` per card; exam figures
    (`torus`, `sphere`) are display-only widgets.
- **Paths:** lessons `courses/diff-geometry-gr/chNN/`, exams `courses/diff-geometry-gr/exams/`, sources (book,
  exams, `PDF_TYPOS.md`) in git-ignored `courses/diff-geometry-gr/sources/`. Log (`STATUS.log.md`) entries before
  2026-10-24 say `content/…`, `docs/STATUS.md`, `js/widgets.js`: read as the new paths.
