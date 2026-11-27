# Status

## Current (2026-11-20)

- **Course set up (2026-11-20):** trail planned in `course.yaml` (18 chapter levels; exams `exam-partial1` after Level 6, `exam-partial2` after Level 12, `exam-final` after Level 18, all original). Sources: Taylor (Levels 1-13), Goldstein (14-18 and second derivations), Lemos (Noether, integrability, fields); map in `CLAUDE.md`.
- **Sources:** all three converted; level-to-section map confirmed against the contents pages. Taylor and Goldstein are OCR text with per-page markers (`=== PDF page N (book p. B) ===`); verify formulas on the PDF render.
- **Level 1 fully built and audited (2026-11-24):** prediction, least-action, phase-space, traps, map, challenge (27 cards). Widgets `newton-cannon`, `least-action-path`, `phase-portrait` (docs/widgets/).
- **Level 2 fully built and audited (2026-11-25):** space-time, inertia, third-law, cartesian, polar, polar-proof, traps, intuition, map, challenge (32 cards). Widgets `two-body-push`, `incline-block`, `polar-motion`.
- **Widget `drag-fall` built** (docs/widgets/drag-fall.md): falling or thrown body, law switch none / linear / quad / both, weight and drag arrows, v(t) and y(t), terminal-speed line, readouts incl. f_quad/f_lin = cv/b.
- **Built:** `ch03-drag` (21 cards, drag-fall x2), `ch03-linear-drag` (19 cards, drag-fall x3); no images.
- **Widget `projectile-drag` built** (docs/widgets/projectile-drag.md): (x, y) path with drag law none / linear / quad / both, RK4, linear closed forms (Eq. 2.36) as overlay, vacuum parabola, dots, arrows, range markers, asymptote, readouts R, R_0, R/R_0, time, peak, tau.
- **Built:** `ch03-trajectory` (guided problem, 23 cards, projectile-drag x3), `ch03-quadratic-drag` (22 cards, drag-fall x2; coasting by text and numeric cards).
- **Widget `charge-field` built** (docs/widgets/charge-field.md): charge in uniform B (optional E, Ez), RK4 vs closed forms; top, side and oblique views, circle r = mv/(qB), centre, v and qv×B arrows, E×B drift, vacuum line, sliders, readouts r, ω, T, speed, kinetic energy.
- **Built:** `ch03-magnetic` (19 cards, charge-field x2), `ch03-traps` (16), `ch03-intuition` (19), `ch03-map` (9 boxes: linear drag, drag laws, quadratic drag); no images.
- **Built:** `ch03-challenge` complete (32 cards: problems 1-3 ball up with drag, projectile with drag, charge spiral with drag; 4 fall with both drag terms (drag-fall), 5 electron helix; plain closing card with teaser to momentum). Level 3 content is built.
- **Level 3 audited (2026-11-26):** Taylor 2.2 render-checked (PDF 59-64); raindrop-at-0.6-m/s wording softened; validate and shots clean.
- **Widget `rocket-exhaust` built (2026-11-26)** (docs/widgets/rocket-exhaust.md): rocket burning fuel at rate mdot, exhaust speed vex relative to rocket or ground (frame trap), optional g; scene with packets, momentum bars (rocket, exhaust, total = 0), v(t) with dashed v_ex ln(m0/m) and constant-mass line, v against ln(m0/m), readouts, time slider.
- **Built:** `ch04-rockets` (Level 4, concept, 20 cards, rocket-exhaust x4, no image). Rocket equation, thrust, frame trap, gravity.
- **Widget `cm-toss` built (2026-11-26)** (docs/widgets/cm-toss.md): tossed body of 2 or 3 masses on rods, spin, launch sliders, mass sliders, CM marker and parabola, particle traces, P = MV and Mg arrows, rod-force arrows, strobe, probe ring (guess the CM), optional explosion (CM path unchanged).
- **Built:** `ch04-center-of-mass` (Level 4, concept, 23 cards, cm-toss x5, no image).
- **Widget `ang-mom-area` built (2026-11-26)** (docs/widgets/ang-mom-area.md): particle about a fixed origin, modes free / spring / gravity / push pulse (RK4); arrows r, p, F, torque arc, lever arm, L symbol, parallelogram, equal-time wedges with areas, strobe and spokes, L_z(t) plot, readouts L, dA/dt, L/2m, torque; presets.
- **Built:** `ch04-angular-momentum` (Level 4, concept, 21 cards, ang-mom-area x5, Kepler portrait). Several-particle result stated, proof deferred.
- **Built:** `ch04-many-particles` (Level 4, guided proof, 23 cards, no widget, no image). Proves dL/dt = N_ext from the third law plus central forces; couple counterexample.
- **Built:** `ch04-traps` (Level 4, traps, 16 cards, no widget, no image).
- **Built:** `ch04-intuition` (Level 4, intuition, 15 cards, no widget, no image).
- **Built:** `ch04-map` (Level 4, map, 6 boxes: momentum, rocket, center of mass, angular momentum, equal areas, many particles).
- **Built:** `ch04-challenge` part 1 (21 cards: rocket with gravity and burn rate, shell bursting at the top with the CM landing, puck on a string pulled through a hole; no widget, no image).
- **Built:** `ch04-challenge` part 2 (32 cards in all: problem 4 spinning pair in free flight, orbital plus spin L, reeling in; problem 5 off-center thruster puff; closing card with teaser to Energy). Level 4 content is built.
- **Level 4 audited (2026-11-27):** Taylor 3.2-3.5 (PDF 98-107) render-checked, no formula fixes; lesson cross-references by title; Kepler portrait caption softened (identification disputed); Level 2 torque symbol aligned (N). Validate clean.
- **Widget `work-path` built (2026-11-27)** (docs/widgets/work-path.md): field uniform / spring / swirl / shear, roads straight / bent / arc / draggable control, dots, running W = integral F.dr, bar per road, spread readout.
- **Built:** `ch05-work` (Level 5, concept, 21 cards, work-path x2, no image). Line integral, work-KE theorem (both derivations), Taylor's F=(y,2x) three roads.
- **Widget `potential-gradient` built (2026-11-27)** (docs/widgets/potential-gradient.md): F = -grad V (spring, uniform, gravity, softened 1/r; swirl and shear have no V), contours and colour map, probe point with F and grad V, roads with V(A) - V(B) against the work, loop circulation, trajectory with T, V, T + V bars.
- **Built:** `ch05-conservative` (Level 5, concept, 24 cards, potential-gradient x3, no image). Two conditions, V = -integral F.dr, W = V1 - V2, E = T + V, F = -grad V, Delta E = W_nc.
- **Widget `curl-loop` built (2026-11-27)** (docs/widgets/curl-loop.md): rectangle loop (draggable corner, width/height/size sliders, shrink), fields swirl / shear / spring / central / push / bend, work on each of the four edges, circulation, curl x area, ratio.
- **Next unit:** `ch05-curl-proof` (Guided Proof: Curl Zero Means Conservative, `proof: true`, uses `curl-loop`). The exam (`exam-partial1`) comes only after Level 6.
- **Exams:** the next unit after Level 6, 12 or 18 is its exam, before the next level's first lesson.
- **Checked facts:** one line per lesson in `VERIFIED.md` (grep, never read whole).
- **Paths:** lessons `courses/classical-mechanics/chNN/`, exams `exams/`.
