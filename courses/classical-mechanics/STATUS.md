# Status

## Current (2026-11-20)

- **Course set up (2026-11-20):** trail planned in `course.yaml` (18 chapter levels; exams `exam-partial1` after Level 6, `exam-partial2` after Level 12, `exam-final` after Level 18, all original). Sources: Taylor (Levels 1-13), Goldstein (14-18 and second derivations), Lemos (Noether, integrability, fields); map in `CLAUDE.md`.
- **Sources:** all three converted; level-to-section map confirmed against the contents pages. Taylor and Goldstein are OCR text with per-page markers (`=== PDF page N (book p. B) ===`); verify formulas on the PDF render.
- **Widget `newton-cannon` built** (docs/widgets/newton-cannon.md): falls / orbit / escape cannon, second ball, flat-earth parabola, Moon check.
- **Widget `least-action-path` built** (docs/widgets/least-action-path.md): modes `path` (drag control points, action S, true path, snap, hideTrue) and `fermat` (drag crossing point, time, Snell).
- **Built:** `ch01-prediction` (Level 1, 18 cards), `ch01-least-action` (Level 1, 21 cards; Fermat portrait), `ch01-phase-space` (Level 1, 20 cards, phase-portrait x6, no image).
- **Widget `phase-portrait` built** (docs/widgets/phase-portrait.md): (q, p) plane of pendulum / spring / hill; click-to-start, energy contour or damped spiral, side view in sync, contours, separatrix, E and period readouts.
- **Built:** `ch01-traps` (Level 1, 14 cards, no widget, no image).
- **Built:** `ch01-map` (Level 1 content map, 9 boxes in three columns: Lagrange, Newton, Hamilton).
- **Built:** `ch01-challenge` complete (27 cards: problems 1-5 = skimming satellite, lifeguard, kicked pendulum, thrown ball by action, ball on a hilltop; plain wrap-up card). Level 1 is fully built.
- **Level 1 audited (2026-11-24):** signs, numbers, level references, summaries, intro rules fixed; validate and shots clean.
- **Built:** `ch02-space-time` (Level 2, concept, 21 cards, basis-playground, no image).
- **Built:** `ch02-inertia` (Level 2, concept, 22 cards, friction-stop, Galileo portrait).
- **Widget `two-body-push` built** (docs/widgets/two-body-push.md): masses m1, m2, force pulse and its opposite, F(t), p1, p2, P plots, third-law toggle (P drifts), optional external force.
- **Built:** `ch02-third-law` (Level 2, concept, 22 cards, two-body-push x2, no image).
- **Widget `incline-block` built** (docs/widgets/incline-block.md): block on a slope, sliders angle, mu_s, mu_k; weight, normal, friction, net arrows and dashed components; a(t), v(t), x(t); mu_crit = tan(angle) readout.
- **Next unit:** `ch02-cartesian` (guided problem "A Block on an Incline", Taylor 1.6, incline-block). After it: NEW widget `polar-motion`, then `ch02-polar`.
- **Exams:** the next unit after Level 6, 12 or 18 is its exam, before the next level's first lesson.
- **Checked facts:** one line per lesson in `VERIFIED.md` (grep, never read whole).
- **Paths:** lessons `courses/classical-mechanics/chNN/`, exams `exams/`.
