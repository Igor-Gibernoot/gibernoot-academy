# Status

Session start: read only **Current** (`sed -n '/^## Current/,/^## Log/p' courses/diff-geometry-gr/STATUS.md`).
Session end: update Current in place (keep it under ~40 lines: replace, don't append) and add a
3-line Log entry at the top of the Log, ending "Conventions fixed here: …"; copy those conventions
into the chapter's section of `CONVENTIONS.md`, not into Current.

## Current (2026-10-24)

- **State:** the whole trail is built: Levels 1-10 (every concept, guided, intuition, traps,
  map, review and challenge node in `course.yaml`), `exam-partial` (after Level 5) and
  `exam-final` (after Level 10). No planned nodes left.
- **Next units (optional, pick one per session):** revisions from Igor's feedback; another intuition lesson only where a formula family gets mixed up (candidates: Einstein equations and trace reversal, Levi-Civita vs other connections). Built so far: `ch10-intuition-christoffel` (before Schwarzschild), `ch10-intuition-lorentz` (after `ch10-lorentz`), `ch10-intuition-einstein` (after `ch10-einstein-hilbert`). `ch10-intuition-connections` (after `ch10-intuition-einstein`, Levi-Civita vs other connections). No intuition lesson is pending.
- **Oversized-lesson cleanup (autonomous, 3 per session):** `node tools/validate.mjs diff-geometry-gr | grep "split it"` lists 45 warnings left (ch07-ch09 challenges done). Next, worst first: challenges `ch10-challenge` (49), `ch06-challenge` (49), `ch05-challenge` (38), `ch04-challenge` (36), `ch03-challenge` (44), `ch02-challenge` (33); then lessons `ch04-cotangent-basis` (37), then the 35s (`ch06-torsion-curvature`, `ch10-spacetime`, `ch10-matter`; ids as in `course.yaml`).
- **Conventions:** `CONVENTIONS.md`, one section per chapter (notation, running examples,
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
  exams, `PDF_TYPOS.md`) in git-ignored `courses/diff-geometry-gr/sources/`. Log entries before
  2026-10-24 say `content/…`, `docs/STATUS.md`, `js/widgets.js`: read as the new paths.

## Log

- 2026-10-26 split oversized level challenges (autonomous): `ch07-challenge` (61 cards) → P1 (18, keeps id) / `ch07-challenge-2` P2-3 (24) / `ch07-challenge-3` P4-5 (23); `ch08-challenge` (59) → P1-2 (23) / `-2` P3-4 (26) / `-3` P5 (14); `ch09-challenge` (58) → P1 (15) / `-2` P2-3 (23) / `-3` P4-5 (P5 needs the P4 planet). Three parts, not two: 3 problems alone would exceed 32. Cards moved verbatim with ids unchanged; only intro (problem list, intro title), wrap-up (own: formulas, setting) and teasers rewritten; nodes registered in `course.yaml`. Validate 0 errors, 45 warnings (was 48); shots 0 problems. Conventions fixed here: challenge parts are titled "Level Challenge · Part N", files `challenge.yaml`, `challenge-2.yaml`, `challenge-3.yaml`; the last part carries the level-chain wrap-up and the next-level teaser.
- 2026-10-26 widget guardrails: cards no longer say "ignore ..." (ch03-circle: `rings: false` on circle-charts; ch09-pseudo-forces: `components: false, velocity: false` on rotating-grid). Validator now warns on unused widget config keys and "ignore ..." near a widget. Conventions fixed here: none.
- 2026-10-25 `ch10-intuition-connections` (14 cards, after `ch10-intuition-einstein`, since Palatini in `ch10-einstein-hilbert` uses connection differences): torsion, compatibility, counting d³, Γ=Γ^LC+C, uniqueness. Verified: book 6.4 (torsion), 7.3 (7.2, 7.3, theorem), 6.2 remark (antisym part not removable). Conventions fixed here: Γ^i_{kj} = i-th component of ∇_{∂j}∂k (direction last, as the book), T^i_{jk}=Γ^i_{kj}−Γ^i_{jk} (the card plan had the opposite order).
- 2026-10-25 `ch10-intuition-einstein` (16 cards, after `ch10-einstein-hilbert`): G=Ric−½Rg and the ½ (div Ric=½dR), div G=0 ⇒ div T=0, tr G=(1−d/2)R=−R, trace reversal Ric=κ(T−½Tg), vacuum/dust, sign trap, constant term λg. Verified: book 10.2 Statement (G, boxed), G=8πG_N T, B.18.10, Ricci scalar/G definitions (Ch7). Conventions fixed here: κ:=8πG_N; numerics in units κ=1 at g=η. Note: cards on radiation/constant term preview `ch10-matter`.

### 2026-10-25 — Level 10 intuition lessons

`ch10-intuition-christoffel` (20 cards: constant metric ⇒ Γ=0, plus-plus-minus lowered Γ, raise with g⁻¹, symmetry and compatibility checks, scaling test, diagonal families, contracted sum, four numeric cards) and `ch10-intuition-lorentz` (16 cards: frames use Λ and components Λ⁻¹, build of the Lorentz condition, which matrices pass, boost checks, rapidity, 0.6⊕0.6⊕0.6 = 63/65, time dilation; widget `observer-frame` reused). Verified: Γ formulas against `ch07-levi-civita` and `ch10-schwarzschild`, Lorentz entries against `ch10-lorentz` (no new source reading).
Conventions fixed here: lowered symbol $\Gamma_{mij}$ (output first); rapidity $\varphi$; components in the moving frame written $\tilde X^a$.

### 2026-10-24 — refactor into Gibernoot Academy

Repo renamed to `gibernoot-academy`; home page lists the courses of `courses/catalog.yaml`; this course moved to `courses/diff-geometry-gr/` (content, archive, STATUS) with its sources in the git-ignored `sources/`; widgets moved to `js/widgets/`. Progress: one state for all courses (`gibernoot.progress.v2`, keys `diff-geometry-gr:<lessonId>…`), the old `diff-geometry-gr.progress.v1` state (local, cloud copy and import codes) is migrated automatically and kept as a backup. Old `#/lesson/…` links redirect to `#/diff-geometry-gr/lesson/…`. Course-specific rules moved to `courses/diff-geometry-gr/CLAUDE.md`; new-course recipe `docs/NEW_COURSE.md`.
Conventions fixed here: course id `diff-geometry-gr` (renamed from `dg2gr`; js/course.js RENAMED migrates old links and saved progress); shots paths relative to `courses/`.

### 2026-10-22 — final exam (`exam-final`)

Built `content/exams/final.yaml` and the level `exam-final` after Level 10 (eyebrow Final exam, hue 3): 3 h, 10 points, setting card with the sphere figure (Fig. 1) then Q1 (11 cards, 3 pt), Q2 (14 cards, 4 pt), Q3 (13 cards, 3 pt); mcq (single and multi-select), numeric, build (Gamma^1_22), order (the parallels argument). Every number checked twice (hand, plus finite differences in a node script). Choices made without asking: the card count is 39 (above the 25-card guideline, exam only); Fig. 4 shows the region without densities on all (b) cards and on the region cards of (c), with densities only on the integrand and the two integral cards; the paper's free-form (ii)(B) became a numeric card (which parallel) plus an order card (the argument). Validate clean, shots clean, headless exam flow run (intro, answering, submit, time-up, results, review, exit) at phone and desktop width. Conventions fixed here: exam cards may exceed 25 cards, one card per sub-question step with points split to 0.05 steps; densities only after omega_Y is asked.

### 2026-10-22 — widget `sphere` (final-exam figures)

Built `js/sphere.js` (canvas, painter-free: tinted quads, hidden lines dashed) with views domain, curves, geodesics, region (+ optional densities), tabs, drag rotation like `torus`; registered in `js/widgets.js`; documented in `docs/LESSON_FORMAT.md`. `js/torus.js` now exports palette, css, mixc, arrowHead, haloText, panelGeometry, frame (no behavior change). Tested with a throwaway preset lesson (deleted) at phone and desktop width: 0 problems; viewed the four views. Choices: grid of parallels every π/12 (equator apart), meridians every π/6; hidden axis parts are not removed; the density labels appear only with `densities: true`. Conventions fixed here: see Current (sphere widget).

### 2026-10-22 — exam figures as widgets
Built `torus` (canvas, six views), `figure:` on cards, placed on four cards of `exam-partial`; validate clean, headless exam flow (intro, answer, submit, review) clean at phone and desktop width. Conventions fixed here: exam figures are display-only widgets, blue = $\partial_\theta$/$\gamma$, purple = $\partial_\varphi$/$\delta$, normalized arrows, no numeric component labels.

### 2026-10-22 — Level 1 split into three lessons

New level `ch01` (Introduction), first built as one 41-card lesson, split into `ch01-gravity`, `ch01-curvature`, `ch01-spacetime` (card cap added to CLAUDE.md): nine guided puzzles that motivate each phrase of the opening sentence, with decode and order cards, the course structure table and a myth round. Reuses `falling-cloud` (falling view) and `rotating-grid` (no forces). Validate 0/0, shots clean. Conventions fixed here: none new.

### 2026-10-22 — intro level revision (ch01, three lessons)

Igor's feedback: undefined terms (worldline, proper time, geodesic), x^i read as a power, Lorentz factor assumed, Puzzle 7 confusing, count explanation bare, build-order too hard, questions card artificial, "guessing is fine" only in lesson 1. Fixed all; added the area-cell globe widget; wrote the intro rules into CLAUDE.md (item 8). Validate 0/0, shots clean. Conventions fixed here: intro-level rules in CLAUDE.md, Lesson kinds item 8.

### 2026-10-21 — level challenge `ch10-challenge`, part 2 (49 cards)

Added P4 (plane EM wave: T=rho k k, traceless, conservation forces speed of light, Doppler Ric(u,u), no rest frame), P5 (static clocks and redshift, modified f with Ric_00=f/r^4 as electric-field energy) and the wrap-up; intro lists real titles; course.yaml summary updated. Validate 0/0, shots clean. Chapter 10 complete. Conventions fixed here: EM momentum direction from T^{01}>0; k_a=(1,-1,0,0) for a beam along +x^1; Ric_00=f(r^2f')'/(2r^2).

### 2026-10-21 — guided `ch10-schwarzschild` (32 cards)

Step-by-step Ricci-flatness of Schwarzschild: metric and volume element, connection coefficients, Ricci components reduced to (r^2 f')'=0 and (rf)'=1, converse and r_S from the Newtonian limit, meaning of r, tidal tensor recovered (Newtonian times f, trace 0), Ricci-flat is not flat. No widget. Conventions fixed here: see Current, `ch10-schwarzschild` line.

### 2026-10-21 — concept `ch10-matter` (35 cards)

T as the response of the matter action to g; constant term, scalar field, electromagnetism, conservation. No widget. Conventions fixed here: see Current, `ch10-matter` line.

### 2026-10-21 — concept `ch10-einstein-hilbert` (33 cards)

Einstein equations from the Einstein–Hilbert action plus a matter term; no widget. Conventions fixed here: see Current, `ch10-einstein-hilbert` line.

### 2026-10-21 — intuition lesson `ch06-intuition-curvature` (19 cards)

Slots of torsion, Riemann and Ricci; commutator in components; numeric cards give data, not the law. Conventions fixed here: Riem slots = (output, carried, direction, direction); antisymmetric pair = the two direction slots; Ric contracts the upper index with the third slot.

- Intuition lesson revision: shear cards no longer state the law to apply (learner recalls it); house table style added in css/app.css (.prose table), applies to every Markdown table (incl. dual-basis-law). Conventions fixed here: intuition application cards give data, never the formula; tables are plain Markdown.
### 2026-10-21 — intuition lessons `ch04-intuition-jacobian` (16 cards) and `ch06-intuition-christoffel` (18 cards)

Both derive nothing: mnemonic, scaling/limit checks, build cards, numeric cards giving data not the law. Conventions fixed here: Jacobian laws via chain-rule cancellation (same chart letter on the repeated index); Γ_{jk}: j = differentiated field, k = direction; extra term of the Γ law has second derivatives of the old coordinates w.r.t. the new; barred symbols (arGamma) for a second connection (no apostrophes in single-quoted YAML).

### 2026-10-21 — new lesson kind `intuition`, first lesson `ch02-intuition-transformations` (18 cards)
- Engine: kind registered in validate (own: allowed), icons/KIND_LABEL (lightning icon, "Intuition lesson"), recap includes it. Placed in ch02 before `ch02-tensors`.
- Conventions fixed here: new-from-old, upper-index objects ($y^j$, $hat{mathfrak{y}}^j$) take $J$, lower-index ($hat{y}_j$, $mathtt{y}_j$) take $J^{-1}$; in $J_i^j$ lower = old, upper = new.

### 2026-10-21 — `area-cell` cards in `ch08-metric-volume` (22 → 31 cards)
- Added: `hook-widget` (sphere, no parallelogram/exact rows: drag $p$ to the pole) + MCQ `pole-cell` (cell at $\vartheta = 0.3$ is about $0.3\Delta^2$); after `polar-density`: `polar-widget` (presets far out $r = 2.5$, near origin $r = 0.4$; ring sector $= r\Delta^2$ derived), numeric `polar-cell` ($r = 2.5$, $\Delta = 0.2$: $0.1$), text `gram` (area$^2 = |u|^2|w|^2 - g(u,w)^2 = \det g\,\Delta^4$, Riemannian), `sheared-widget` ($\Delta = 0.75$), MCQ `side-product` (equal iff $g_{12} = 0$; rhombus $g_{12} = \tfrac12$ gives $0.87$); after `sphere`: numeric `sphere-ratio` (prediction $\sin(\pi/3) = 0.866$) then `sphere-widget` (presets Equator, Near the pole, Δ small). New `own:` bullet "What the root measures" (no blanks; existing blanks untouched).
- Validate 0/0, shots 0 problems; all four widget configs viewed.
- Conventions fixed here: the geometric meaning of $\sqrt{\det g}$ is stated for Riemannian $d = 2$ (parallelogram in $T_p\mathcal{M}$, first-order); prediction questions go before the widget that displays their answer.

### 2026-10-21 — widget `area-cell` (Chapter 8 addition)
- Built `area-cell` (`js/widgets.js`, CSS `ac-*`; `arrow()` got an optional head size): chart panel with a gold $\Delta\times\Delta$ cell around draggable $p$, manifold panel with the true image and the purple $\Delta\,\partial/\partial\alpha^i$ parallelogram; charts `polar`, `sphere` (orthographic, turns to face the cell), `sheared`, `cartesian`; readout $g_{ij}$, $\det g$, $\sqrt{\det g}\,\Delta^2$, true area by elementary geometry, ratio badge. Tested with throwaway cards in `ch08-metric-volume` (removed); documented in `LESSON_FORMAT.md` and `QUICKREF.md`.
- Choices: no Minkowski chart (a Lorentzian "area" has no picture as a gold region; the lesson's numeric Minkowski cards stay as they are); cell centred at $p$ (second-order accurate, polar exact) rather than cornered at $p$; one $\Delta$ for both coordinates.
- Conventions fixed here (widget `area-cell`): see Current, Chapter 8 bullet.
### 2026-10-21 — `ch10-observers` (concept, 29 cards)
- Hook: twins again, T on its outbound leg says "I am at rest"; prediction MCQ (T records time $4$, distance $0$). Widget `observer-frame` three times (traveller `compare`; light; spacelike `compare`); numerics $6.25$, $-1$, $2$ (Doppler), $-1/7$, $0.5$; build chain $g(e_0,e_0) = eta_{00} = 1$; MCQ on the unit-speed parametrization; order cards for "the frame is a basis" and the speed bound; traps after footnote 3 (lightlike ruler, another observer's frame, chart speed $2$).
- Choices: the 4D definition is stated with $eta_{ab}$ but all numbers are 1+1; the twin turnaround left as "T changes frame" (no accelerated observers); velocity addition only mentioned in an explanation (left for `ch10-lorentz`); the hook card does not recall T's $4$ (the MCQ asks it). Validate 0/0, shots 0 problems.
- Conventions fixed here: see Current, "Chapter 10 conventions so far" (`ch10-observers`).
### 2026-10-21 — widget `observer-frame`
- Built `observer-frame` (`js/widgets.js`, CSS `of-*`): 1+1 Minkowski (product via `lcG(LC_METRICS.minkowski, …)`); observer at $p$ with $u$ from a slider or by dragging $e_0$ along the unit hyperbola; purple frame $e_0, e_1$ with faint axes (scissors toward the light line); dashed hyperbolae $g = \pm1$; draggable $\mathcal{X}$ with the parallelogram $X^0e_0$, $X^1e_1$; readout orthonormality, both component sets, $X^0e_0 + X^1e_1 = \mathcal{X}$, $g(\mathcal{X},\mathcal{X})$ both ways, measured-speed badge; `compare`/`compareButton` rest frame. Documented in `LESSON_FORMAT.md` and `QUICKREF.md`; tested with a throwaway lesson (removed, `course.yaml` restored); shots 0 problems, images viewed at phone and desktop width.
- Choices: Minkowski only (no `metric` option: the lesson needs flat frames; tilted frames can come later if wanted); $p$ fixed at the origin (no drag); dragging $e_0$ snaps $u$ to $0.05$, slider to $0.01$; the $1/\sqrt{1-u^2}$ factor never named $\gamma$; measured speed written $|X^1/X^0|$ to keep $u$ for the observer; the readout adds $g(\mathcal{X},\mathcal{X}) = (X^0)^2 - (X^1)^2$ (prepares the speed-bound proof $g(v,v) = (\epsilon^0)^2(1-\sum u^2)$); edge labels only where they fit; for $|u| > 0.8$ $e_1$ may leave the default view.
- Conventions fixed here (widget `observer-frame`): see Current, "Chapter 10 conventions so far".
### 2026-10-21 — `ch10-worldlines` (concept, 29 cards)
- Hook: twins H (home) and T (out to $(3,5)$ and back), prediction MCQ ($10$ vs $8$). Widget `worldline-clock` used four times (twin `compare`; spacelike leg `[[0, 2], [5, 6]]`; `massless`; `bend [4, 5]` `compare`); classify-curves multi-select, past-directed piece MCQ, zero-velocity trap, build card for the definition, order card for reparametrization invariance, numerics 8, 4, 6, 8, 8.796.
- Choices: corners of kinked worldlines not discussed as non-smooth (only "straight pieces"); maximality shown first by $s_\gamma\leq v^\tau$ (simpler) and then by the reverse triangle inequality; 4D and curved cases stated, not proved; the `[[1, 6], [0, 4]]` case asked in an MCQ without a preset; the summary blank for the inequality uses $\mathcal{Z} := \mathcal{X}+\mathcal{Y}$ (phone width). Validate 0/0, shots 0 problems; four widget cards viewed at phone width. Next unit decided: widget `observer-frame` before `ch10-observers`.
- Follow-up: the `massive` card now says kinked paths are idealizations (rounding a corner keeps $v_\gamma$ in the future cone: $(3-6t,5)$, $g\geq16$; clock time changes as little as we like); "proper time" not used there since it is defined later.
- Conventions fixed here (`ch10-worldlines`): see Current, "Chapter 10 conventions so far".
### 2026-10-21 — widget `worldline-clock`
- Built `worldline-clock` (`js/widgets.js`, CSS `wc-*`): 1+1 spacetime reusing `LC_METRICS`/`lcG`; worldline $A = (0,0)\to B = (0,T)$ through 1–2 draggable kinks or a Bézier `bend`; small cones with $v_\gamma$, λ slider with Play, dot with clock; readout $v_\gamma$, $g(v_\gamma,v_\gamma)$, $\text{ᛇ}_\gamma$, $s_\gamma$, proper time vs chart $\tau$; red/gold pieces; badge "Massive worldline?"; `compare`, `massless`. Documented in `LESSON_FORMAT.md` and `QUICKREF.md`; tested with a throwaway lesson (six presets, phone and desktop images viewed), removed afterwards.
- Choices: λ uniform per piece (one unit per piece, $v_\gamma$ = displacement) rather than λ = chart τ, so past-directed pieces stay parametrizable; Bézier uses $\lambda\in[0,2]$ so its velocities match the kink scale; the world picture is scaled by $k = h/5.8$ into the SVG (labels keep their size), grid every world unit, ticks every 2; `massless` only for Minkowski (straight null pieces), one kink fixed at $(\pm T/2, T/2)$, two kinks a twice-bounced light ray; clock greyed once γ stops being timelike future; the compare dot moves with the same λ (same chart τ for symmetric paths).
- Conventions fixed here (widget `worldline-clock`): see Current, "Chapter 10 conventions so far".
### 2026-10-21 — `ch10-spacetime` (concept, 35 cards)
- Hook: two flashes and a ball from one event (prediction MCQ, resolved at the end by slopes: timelike means $|V^a| < V^\tau$). Widget `light-cones` used four times (Minkowski without ᛏ right after the hook; tilted field numbers-only; Minkowski with Flip ᛏ; tilted field with `orientation: down`). Cards: signature $(1,3)$ and the other convention, classes, light cone not a subspace, cones in their own tangent spaces, Euclidean trap, why ᛏ (extra data, timelike, IVT no-flip order card), future/past and "neither", $(\dagger)$ with proof and checks, the sextuple, redundant slot $\nabla^{\mathrm{LC}}$. `own:` with 5 blanks.
- Choices: the first widget keeps the badge (class words preview the definitions on the next card); 35 cards instead of ~30 (build card for the bilinear form and a convention-switch MCQ added); rune ᛏ read "tiwaz". Fixed tab characters that had replaced `\t` in STATUS and QUICKREF (light-cones lines). Validate clean, shots 0 problems; widget cards viewed at phone width.
- Conventions fixed here (`ch10-spacetime`): see Current, "Chapter 10 conventions so far".
### 2026-10-21 — widget `light-cones`
- New widget `light-cones` (`js/widgets.js`, CSS `.lc-*`, documented in `docs/LESSON_FORMAT.md` and QUICKREF): 1+1 Lorentzian spacetime, metrics `minkowski`/`tilted`/`scaled` of the form $d\tau\otimes d\tau - k^2\sigma\otimes\sigma$; light cone at draggable $p$, future half shaded, $\text{ᛏ}(p)$ green, draggable $\mathcal{X}_p$ with magnet onto null lines, `field` small cones, `badge: false` numbers-only mode, `orientation: down|false`, `flip`.
- Tested with a throwaway lesson (6 widget cards: Minkowski (1,2)/(1,1)/(2,1), tilted field at (2,0) with lightlike (1.5,1), scaled flipped without badge, past-directed (1,-2); removed, `course.yaml` restored); validate clean, shots 0 problems; images viewed (labels clamped into the view after the first look).
- Conventions fixed here (widget `light-cones`): see Current, "Chapter 10 conventions so far".
### 2026-10-21 — ch09-challenge part 2 (challenge, problems 4–5 + wrap-up, 23 cards; 58 in all)
- Appended to `content/ch09/challenge.yaml`: Problem 4 "A tunnel through a uniform planet" (12 cards), Problem 5 "Merry-go-round or gravity?" (10), `wrap-up` (five problems' formulas, level chain, Level 10 teaser). `course.yaml` summary sharpened. Chapter 9 complete.
- Choices: lab B keeps the planet's third axis ($\Gamma^3_{00} = y^3$) so $\mathrm{Ric}_{00} = 3$ ties P5 to P4's density; the plan's "one particle" MCQ became the closing verdict card (preceded by the origin and neighbour numerics); Riem of both labs verified symbolically (sympy). Validate clean, shots 0 problems. Next: widget `light-cones` before `ch10-spacetime`.
- Conventions fixed here (`ch09-challenge` part 2): see Current, "Chapter 9 conventions so far".
### 2026-10-21 — ch09-challenge part 1 (challenge, problems 1–3, 35 cards)
- `content/ch09/challenge.yaml`, registered in `course.yaml` with summary (covers all five problems). Intro (toolkit + list of all five problems), Problem 1 "Whirl and release" (13 cards), Problem 2 "A chart with bent clocks" (11), Problem 3 "Who else is inertial?" (10). No wrap-up yet (part 2).
- Choices: P1 adds a direct-differentiation check of $\ddot\chi^2_\mathcal{V}(\pi) = -\tfrac12$ and a spiral MCQ (involute named only); P2 adds "almost inertial?" MCQ (spatial coefficients zero but not stratified); P3 adds a time-shift MCQ ($y^0 = x^0+5$ not stratified, so $15$ not $16$) and marks affine $A$ / Coriolis-from-shear as "beyond the level, shown here". All numbers checked by hand or node. Validate clean, shots 0 problems.
- Conventions fixed here (`ch09-challenge` part 1): see Current, "Chapter 9 conventions so far".
### 2026-10-21 — ch09-map (map, 14 boxes)
- `content/ch09/map.yaml`, registered in `course.yaml` with summary. Intro, 14 boxes with 2 decoys each (misconceptions: $t(p)\neq0$ vs $(dt)_p\neq0$, spatial metric, $\dim\ker = 1$, observer-dependent simultaneity, never-zero ⇒ uniform, constant components ⇒ uniform, crossing once vs $(t\circ\gamma)'>0$, future-directed force, metric instead of $\nabla$, torsion allowed, $\ddot\gamma^k = 0$ in every chart, Newton I adds nothing, free parameter, $(dt)_p\neq0$ alone fixes $\lambda$, grids never move, all $\Gamma$ vanish, $\Gamma = 0$ at one event, inertial charts always exist, gravity a force, sign of $\Gamma^\alpha_{00}$, polar $r\dot\varphi^2$, Coriolis without $2$, curved absolute space, uniform field curves, $+\mathrm{Riem}$, tides $1/r^2$, vacuum ⇒ flat, wrong Ricci contraction), outro + teaser for the challenge (C.8 string vs released ball).
- Choices: time content merged into the worldlines box (14 boxes); "torsion-free" placed on the uniform flow → spacetime arrow. Validate clean, shots 0 problems; complete view checked at phone and desktop width.
- Conventions fixed here (`ch09-map`): 14 boxes, 3 columns, 9 rows; two dashed edges (gravity → pseudo-forces "if uniform", pseudo-forces → tidal "falling chart"); decoys reuse lesson/trap numbers; no soft hyphens needed.
### 2026-10-21 — ch09-traps (traps, 24 cards)
- `content/ch09/traps.yaml`, registered in `course.yaml` with summary: intro (notation), dt never zero, time content in a non-stratified chart, rest is future directed, which charts are stratified, velocity in a moving grid, $\Gamma^0_{ki} = 0$, Newton II parameter, polar $\ddot r = 18$ and "is it a pseudo-force?", Coriolis factor $2$, $\Gamma = 0$ at one event, uniform field (falling chart, strong but flat), sign of the acceleration, vacuum but curved, Ricci build card, tidal sign, pull vs tide, two bulges, egg ends, equivalence local, space flat; summary with rules as formulas and teaser for `ch09-map`.
- `ch09-newtonian-spacetime` hook: $\Phi\to\phi$ (5 lines, ids and `own:` unchanged).
- Choices: fresh examples instead of the lessons' $\phi = (x^1)^2$ and $G_NM = 8$ at $(2,0,0)$ (used $3(x^1-1)^2$, $x^1x^2$, $G_NM = 16$); pseudo-force trap is an MCQ after a numeric $\ddot r$ card, its explanation reconciling broad and classical meanings.
- Conventions fixed here (`ch09-traps`): see Current, "Chapter 9 conventions so far".
### 2026-10-21 — ch09-point-mass (guided, 33 cards)
- `content/ch09/point-mass.yaml`, registered in `course.yaml` with summary: seven steps (connection with removed worldline, full Hessian and off-axis point $(\sqrt2,\sqrt2,0)$, trace order card, Kepler III, co-rotating chart, radial fall with energy law and the parametric $t(r)$, falling chart with tides at $r = 4$), one `falling-cloud` card (Far start, linear). Validate clean; shots 0 problems; widget card viewed (phone), fine.
- Choices: 33 cards vs plan ~28 (off-axis eigenvector card, co-rotating "farther out" numeric, exact-vs-linear numeric added); the parametric solution is checked (not derived) in a text card, as the energy law is derived first; the "half a period" explained by the degenerate Kepler ellipse (stated, not proved); widget moved after the exact-vs-linear numeric because its readout shows $0.046$. All numbers checked by script (Hessians, RK4 fall to $r = 2$ at $1 + \pi/2$ with $\dot r = -2$).
- Conventions fixed here (`ch09-point-mass`): see Current, "Chapter 9 conventions so far".
### 2026-10-21 — ch09-tidal (concept, 27 cards)
- `content/ch09/tidal.yaml`, registered in `course.yaml`: hook crumbs in a free-falling station; `falling-cloud` (both) then egg MCQ; falling chart recall, "zero only at the origin" (equivalence principle along one worldline); Taylor + build card; Riem in the falling chart; sign MCQ; tidal equation with on-axis point-mass values; numeric linear/exact cards; widget at $t = 0.5$ with linear; egg-vs-ellipse MCQ; frozen $\cosh$ estimate; volume law and vacuum MCQ; ocean tides and two bulges; traps "weightless = no gravity" and "stronger pull = bigger tide" (Near/Far preset, factor 8; Sun vs Moon). Validate clean; shots 0 problems (images not viewed).
- Choices: offset named $\eta$ (widget and book) for points of the falling chart, $\gamma_\mathcal{V}$ for a particle; volume law derived (not in the book) to make "trace zero" concrete; the Sun/Moon numbers computed from standard masses and distances.
- Conventions fixed here (`ch09-tidal`): see Current, "Chapter 9 conventions so far".
### 2026-10-21 — widget falling-cloud (widget session, no lesson)
- New widget `falling-cloud` (`js/widgets.js`, CSS `.fc-*`, documented in `docs/LESSON_FORMAT.md` and QUICKREF): a ring of free particles falls exactly toward a point mass; sources and magnified falling-chart panels, $t$ slider with Play, draggable $c_0$ on the $x^1$ axis, gold exact tidal accelerations, optional dashed linear prediction, Riem readout with the vacuum trace. Tested with a throwaway lesson (5 cards: both + presets at 2 and 4, linear at $t = 0.5$, falling only at $0.8$, $c_0 = (4,0)$, clamped end; removed, `course.yaml` restored). Validate clean; shots 0 problems (also `ch09-pseudo-forces` regression); images viewed on phone and desktop, light and dark.
- Choices: the stop rule is "any particle reaches $|x| = 0.5$", since the inner particle hits the mass ($t = 0.884$) before the center reaches $0.5$; the linear curve integrates the tidal equation with Riem along $b(t)$ (the honest first-order prediction; the lesson may still quote the frozen hand estimate $\cosh$/$\cos$ as a rough check); $c_0$ restricted to the $x^1$ axis so Riem¹₀₁₀/Riem²₀₂₀ stay the radial/transverse components; arrows capped at 1.5 panel units (late times have relative accelerations above 20); default `scale: 1` (2 swamped the cloud).
- Conventions fixed here (widget `falling-cloud`): see Current, "Chapter 9 conventions so far".
### 2026-10-21 — ch09-gravity-connection (concept, 30 cards)
- Built `content/ch09/gravity-connection.yaml` (30 cards, no widget), registered in `course.yaml` with summary. Validate clean; shots 0 problems.
- Choices: hook = apple released in a freely falling elevator (floats); no widget (none fits; the tidal widget `falling-cloud` comes next); cabin MCQ (planet vs rocket, multiple select) for "same slot"; non-removability shown first numerically (one $\ddot b$ cannot cancel the point mass at two places) then by Riem; three traps at the end (zero at one event, constant coefficient, vacuum Ricci). Card count 30 vs plan ~28 (sign check and second derivation added).
- Conventions fixed here (`ch09-gravity-connection`): sources chart $x^i$, $\gamma^\alpha_\mathcal{U}$/$\gamma^\alpha_\mathcal{V}$, falling chart $x^\alpha = y^\alpha + b^\alpha(t)$; $\phi$, $\partial_\alpha\phi := \partial x_\alpha\lfloor\phi\rceil$, $\Delta\phi$; $\Gamma^\alpha_{00} = \partial_\alpha\phi$; $(\Gamma_\mathscr{Y})^\alpha_{00} = \partial_\alpha\phi + \ddot b^\alpha$; uniform gravity is a pseudo-force; $\mathrm{Riem}^\alpha_{0\beta0} = \partial_\beta\partial_\alpha\phi$; $\mathrm{Ric}_{00} = \Delta\phi = 4\pi G_N\rho$; point mass $G_NM = 8$ at $(2,0,0)$: $2$, $-2,1,1$, $0$.
### 2026-10-21 — ch09-pseudo-forces (concept, 32 cards)
- Built `content/ch09/pseudo-forces.yaml` (32 cards, 2 `rotating-grid` cards), registered in `course.yaml` with summary. Validate clean; shots 0 problems; both widget presets viewed (desktop and phone), fine.
- Choices: hook is a force-free puck on ice under a turning carousel floor (path on the floor: clockwise circle), resolved by a numeric card (Coriolis $-2$ beats centrifugal $+1$). Inertial-chart derivation split into an MCQ (rest particle kills $\Gamma^\alpha_{00}$) plus the $\pm v$ and quadratic steps. The build tiles for $\Gamma^1_{02}$ use $c, s$ shorthands to fit a phone line. Added a "sitting on the carousel" MCQ (centrifugal only) and a "cancel is momentary" MCQ (path still curls, $t = 4$ value from the widget doc). The previous lesson called every moved $\Gamma$-term a pseudo-force; here the classical name is reserved for moving-axes terms and the polar term is "not counted", stated explicitly. Footnote 5 (non-rigid charts) is a paragraph in the polar card. Card count 32 (planned ~28): the two widget numerics and the extra MCQs.
- Conventions fixed here (`ch09-pseudo-forces`): inertial chart = stratified chart with $\Gamma_\mathscr{X} = 0$ (rest, $\pm v$, quadratic part); $\mathrm{Riem} = 0$ by the tensor argument; inertial $x^i$, moving $y^i$ (book's $\alpha_i,\beta_i,\xi,\eta$ not used); $\text{ᛖ}_{\mathcal{V}\mathcal{U}} := \mathscr{X}\circ\mathscr{Y}^{-1}$ read "from $\mathcal{V}$ to $\mathcal{U}$"; rigid axes $\theta(t)$, origin $b^\alpha(t)$; $c := \cos\theta$, $s := \sin\theta$; $\gamma^\alpha := \mathscr{Y}^\alpha\circ\gamma$ (book's $\gamma^\alpha_\mathcal{V}$); Coriolis from $\Gamma^\alpha_{0\beta}$ (factor 2 from two index pairs), centrifugal/Euler/translational from $\Gamma^\alpha_{00}$; polar $\ddot r - r\dot\varphi^2$ not counted as a pseudo-force (classical name for moving-axes terms only).
### 2026-10-21 — widget rotating-grid (widget session, no lesson)
- New widget `rotating-grid` (`js/widgets.js`, CSS `.rg-*`, documented in `docs/LESSON_FORMAT.md` and QUICKREF): free particle straight in the inertial chart, curling in a chart rotating at $\omega$; panels `inertial | rotating | both` with buttons, $t$ slider with Play, draggable $x_0$ and $v$ (at $t = 0$, where the charts agree), Coriolis/centrifugal/sum arrows at the particle in the rotating panel, readout with the coefficients and all vectors in numbers. Tested with a throwaway lesson (6 presets: both views, rotating with forces off and ghost, inertial only, $\omega = 0.5$; removed); images viewed at phone and desktop; the three spec values and two more re-verified by hand.
- Choices: arrows only in the rotating panel (the inertial panel has no pseudo-forces, readout says $\ddot x = 0$); the sum drawn first, thick and translucent, so a force along it stays visible; force labels pushed to opposite sides; default `scale: 1` (0.5 hid the arrows under the handles); the $v$ handle sits above $x_0$, so with $v = 0$ the first drag sets $v$; handles in both panels, drag resets $t = 0$; Euler and translational forces not drawn ($\dot\theta$ constant, $b = 0$): the lesson states them from the formulas.
- Conventions fixed here (widget `rotating-grid`): top view of space; inertial chart $(x^1, x^2)$, rotating chart $(y^1, y^2)$ with $\theta = \omega t$, $b = 0$, $y^1 = x^1\cos\omega t + x^2\sin\omega t$, $y^2 = -x^1\sin\omega t + x^2\cos\omega t$ (book's sign: $\Gamma^1_{02} = -\omega$, $\Gamma^2_{01} = \omega$, $\Gamma^\alpha_{00} = -\omega^2 y^\alpha$); free particle $x = x_0 + v\,t$; $\dot y = R(\omega t)v + \omega(y^2, -y^1)$; per unit mass Coriolis $-2\Gamma^\alpha_{0\beta}\dot y^\beta = (2\omega\dot y^2, -2\omega\dot y^1)$ (gold), centrifugal $-\Gamma^\alpha_{00} = \omega^2 y$ (green), sum $\ddot y$ (translucent ink), velocities blue, the other chart's grid as a purple lattice; config names `omega`, `x0`, `v`, `t`, `tmax`, `view`/`views` (`inertial | rotating | both`), `forces`, `forcesToggle`, `scale`, `velocity`, `ghost`, `presets`. Checked presets ($\omega = 1$, $x_0 = (1,0)$, $t = 0$): $v = 0$ → $\dot y = (0,-1)$, Coriolis $(-2,0)$, centrifugal $(1,0)$, sum $(-1,0)$; $v = (0,0.5)$ → sum $0$; $v = (0,1)$ → $\dot y = 0$, sum = centrifugal $(1,0)$.
### 2026-10-21 — ch09-stratified (concept, 27 cards)
- Built `content/ch09/stratified.yaml` (27 cards, no widget), registered in `course.yaml` with summary. Validate clean; shots 0 problems; no images viewed.
- Choices: the planned hook (fixed grid vs grid sliding at speed 2) cannot show disagreement on $\Gamma$, since a constant-speed slide is affine and keeps $\Gamma = 0$; added observer C with an accelerating grid $z^1 = x^1 - (x^0)^2$ ($\Gamma^1_{00} = 2$) and made "B keeps $\Gamma = 0$" a prediction question. Spatial Newton II only recapped (one text card). The "whole left side" claim is shown with a ball at rest: $0 + 0$ in A vs $-2 + 2$ in C. Pseudo-force from $\Gamma = 0$ iff the inverse transition is not affine (stated with the inhomogeneous law, recalled from ch06). Also repaired the `ch09-newton-axioms` conventions and choices lines in STATUS, whose backslashes had been lost (`\n`, `\t`, `\b` turned into control characters).
- Conventions fixed here (`ch09-stratified`): stratified chart $\mathscr{X}^0 = t|_\mathcal{U}$, stratified atlas $\mathcal{A}_{\text{strat.}}\subseteq\mathcal{A}$; Greek $\alpha,\beta,\delta\in\{1,2,3\}$; existence via $\partial_\kappa[t\circ\mathscr{X}^{-1}](\mathscr{X}(p))\neq0$ ($\partial_\kappa$ = partial in slot $\kappa$ of $\mathbb{R}^4$) and the inverse function theorem stated inline as "a fact of analysis" (example $t = 3x^1 + (x^0)^2$ at $(0,0)$, new chart $(t,x^0)$, det $-3$, wrong swap gives $0$); Jacobian $(\text{ᛞ}_{\mathcal{V}\mathcal{U}})^i_j$ with time row $(1,0,0,0)$, $\partial\mathscr{Y}^\alpha/\partial\mathscr{X}^0$ = minus the grid velocity, determinant = det of the $3\times3$ spatial block, spatial vectors transform with that block only, velocities pick up the grid velocity; running observers A (chart $\mathscr{X}$, all $\Gamma = 0$), B ($\mathscr{Y}$, $y^1 = x^1 - 2x^0$, $\Gamma_\mathscr{Y} = 0$, resting ball has $v_\mathscr{Y}^1 = -2$), C ($\mathscr{Z}$, $z^1 = x^1 - (x^0)^2$, only $\Gamma^1_{00} = 2$, pseudo-force $-2m$, $-6$ for $m = 3$); C's coefficient derived twice (free particles of every velocity; inhomogeneous transformation law); from $\Gamma = 0$ a pseudo-force appears iff the inverse transition is not affine; rotating grid $y^1 = x^1\cos x^0 + x^2\sin x^0$, $y^2 = -x^1\sin x^0 + x^2\cos x^0$ (book's sign: $\Gamma^1_{02} = -\dot\theta$, Coriolis/centrifugal only teased); counts $10$ (upper $0$) and $18 + 9 + 3$ of $40$; pseudo-force form $m\ddot\gamma^\alpha = f^\alpha_\gamma - m\Gamma^\alpha_{\beta\delta}\dot\gamma^\beta\dot\gamma^\delta - 2m\Gamma^\alpha_{0\beta}\dot\gamma^\beta - m\Gamma^\alpha_{00}$ in two-line `aligned`; "inertial chart" not yet named (teaser). No widget.
### 2026-10-21 — ch09-newton-axioms (concept, 28 cards)
- Built `content/ch09/newton-axioms.yaml` (28 cards, 1 `time-slices` card with the already-seen wavy preset), registered in `course.yaml` with summary. Validate clean; shots 0 problems; no images viewed (no new preset).
- Choices: hook clock B uses $\lambda+\lambda^3$ instead of the planned $\lambda^3$ (which has $\tau'(0) = 0$, not a worldline); $\lambda^3$ reused as the "once per slice is not enough" trap. The $\tau''$ derivation is a build card (uniform-flow substitution) plus an order card (5 steps), with an MCQ on the extra term $(\nabla_v dt)(v)$ without uniform flow. Newton I phrased "autoparallel with zero acceleration" to match ch06's autoparallel ($a = \text{ᚱ}v$). The spatial split of Newton II (book 9.3) is done here as planned, so `ch09-stratified` should recap it and focus on the definition, existence, Jacobian structure, the 30 coefficients and the pseudo-force reading.
- Conventions fixed here (`ch09-newton-axioms`): time content of $\mathcal{X}_p$ = sign of $(dt)_p(\mathcal{X}_p)$: future directed / spatial / past directed; worldline $\gamma\colon\mathbb{R}\to\mathcal{M}$, $m>0$, $(t\circ\gamma)'>0$ (examples: $\lambda-\lambda^3$ meets $\mathcal{S}_0$ three times; $\lambda^3$ crosses each slice once but fails at $0$); force $\mathcal{F}_\gamma$ spatial, components $f^k_\gamma := (dx^k)(\mathcal{F}_\gamma)$; Newton I $\nabla_{v_\gamma}v_\gamma = 0$ ("autoparallel with zero acceleration", since ch06 calls $a = \text{ᚱ}v$ autoparallel) as a measurement rule; acceleration components $a^k = \ddot\gamma^k + \Gamma^k_{ji}\dot\gamma^i\dot\gamma^j$ (ch06); $\tau := t\circ\gamma$, $\tau' = \mathtt{t}_k\dot\gamma^k$, $\tau'' = (dt)(a_\gamma)$, general $\tau'' = (dt)(a_\gamma) + (\nabla_{v_\gamma}dt)(v_\gamma)$; allowed $\tau = c_1\lambda+c_2$, $c_1>0$, then $\lambda\equiv t$; hook clocks $\gamma_A = (\lambda,0,0,0)$, $\gamma_B = (\lambda+\lambda^3,0,0,0)$ in a chart with $x^0 = t$, all $\Gamma = 0$ ($\tau''(2) = 12$); spatial Newton II with Greek $\alpha,\beta,\delta$ in `aligned` on two lines ($2\Gamma^\alpha_{0\beta}$ from torsion-free), free particle at rest with $\Gamma^1_{00} = 9.8$ gives $\ddot\gamma^1 = -9.8$; "stratified" and "pseudo-force" still not named (teased only). Widget preset: wavy at $(1,0.5)$ with kernel and stack (as before).
### 2026-10-21 — ch09-newtonian-spacetime (concept, 28 cards)
- Built `content/ch09/newtonian-spacetime.yaml` (28 cards, 4 `time-slices` widget cards), registered in `course.yaml` with summary. Validate clean; shots 0 problems; the four widget presets viewed (phone/desktop), fine.
- Choices: the wavy readout prints the kernel vector $(1,-0.16)$, so the numeric card asks for $v^\tau$ at $v^a = 2$ ($-0.32$) instead of the planned $v^a = 1$; the squared readout states "time stands still", so the follow-up MCQ tests why (kernel vs slice dimension, future flipping across $\tau = 0$); added a numeric card showing that uniform flow constrains the pair $(\nabla,t)$ (wavy $t$, zero $\Gamma$); footnote 2 (alternative formulations) omitted; the "space vs spacetime" obstruction taught with slow/fast balls (same direction, different parabolas).
- Conventions fixed here (`ch09-newtonian-spacetime`): events = points of 4-dim $\mathcal{M}$; absolute time $t\in C^\infty(\mathcal{M})$, $(dt)_p\neq0$ ("time never stands still"); absolute space $\mathcal{S}_\tau := \mathrm{preim}_t(\{\tau\})$ with $\tau$ a value of $t$ in definitions and `own:`, $\mathcal{S}_c$ in widget cards (axis $\tau$ named a chart coordinate); $\mathcal{M} = \mathop{\dot{\bigcup}}_{\tau\in t(\mathcal{M})}\mathcal{S}_\tau$; $T_p\mathcal{S}_{t(p)} = \ker(dt)_p$, dim 3 by rank–nullity (defined inline); "spatial" used informally only (formal future/spatial/past left to `ch09-newton-axioms`); components $\mathtt{t}_k := \partial x_k\lfloor t\rceil$, $(\nabla_{\partial x_i}dt)_k = \partial x_i\lfloor\mathtt{t}_k\rceil - \Gamma^j_{ki}\mathtt{t}_j$ (ch06 covector rule, last lower index = direction); Latin $i,j,k\in\{0,1,2,3\}$, Greek $\alpha,\beta\in\{1,2,3\}$; chart with $\mathscr{X}^0 = t$ ("stratified" not yet named) gives $\mathtt{t}_k = \delta^0_k$ and $\nabla dt = 0\iff\Gamma^0_{ki} = 0$ (10 of 40); hook: $m\ddot\gamma^\alpha_\mathcal{U} = f^\alpha_\gamma - m\partial_\alpha\Phi$, Poisson $\sum_\alpha\partial_\alpha\partial_\alpha\Phi = 4\pi G_N\rho$; boosted observer's time written $t'$, $t'(2,0) = -1.15$; wavy $t$ with all-zero $\Gamma$ in $(a,\tau)$: $(\nabla_{\partial a}dt)_a = -0.3\sin a = -0.25$ at $a = 1$ (not uniform); trap $\Gamma^0_{11} = 1$ → $\ddot x^0 = -(\dot x^1)^2$; torsion-free justified by "autoparallels see only the symmetric part" (gyroscope remark); space-vs-spacetime: slow/fast balls from one point. Widget presets used: flat alone (no kernel/stack/badge), squared+wavy at $p = (1,0)$, flat+boosted with badge, wavy at $(1,0.5)$; the readout always shows the kernel vector $(1,-0.16)$ for wavy, so the numeric card asks $v^a = 2$.
### 2026-10-21 — widget time-slices (widget session, no lesson)
- New widget `time-slices` (`js/widgets.js`, CSS `.ts-*`, documented in `docs/LESSON_FORMAT.md` and QUICKREF): 1+1 picture, slices of $t$, gold slice on a
  $c$ slider, draggable $p$ with $\ker(dt)_p$ and the orange level lines $(dt)_p = \pm1$, readout with $(dt)_p(v) = 0$ in numbers, "Absolute time?" badge.
  Tested with a throwaway lesson (5 cards: flat, wavy with all four buttons, squared, squared at $\tau = 0$ with empty $\mathcal{S}_{-1}$, boosted; removed);
  images viewed at phone and desktop. Choices: covector shown as level lines rather than an arrow (an arrow would need a metric); `squared` slider
  extends to $c = -1$ to show an empty slice; zero of `squared` reported below/above $p$. Fix: KaTeX `\sqrt` was invisible in all widget readouts
  and buttons (`.widget svg` sizing hit KaTeX's glyph svgs); `.widget .katex svg` override added. Doubt: the widget's vertical axis is called
  $\tau$ while the book uses $\tau$ for values of $t$ ($\mathcal{S}_\tau$); harmless for `flat` ($t = \tau$), worth one sentence in the lesson.
- Conventions fixed here (widget `time-slices`): spacetime picture with horizontal $a$ (space) and vertical chart coordinate $\tau$; slices written $\mathcal{S}_c = \mathrm{preim}_t(\{c\})$ in the widget (the book writes $\mathcal{S}_\tau$ with $\tau$ a value of $t$: in lessons say "the slice $\mathcal{S}_c$" when the widget's $\tau$ axis is on screen); time functions flat $\tau$, wavy $\tau + 0.3\sin a$, squared $\tau^2$, boosted $(\tau - 0.5a)/\sqrt{0.75}$; $(dt)_p = \dots\,da + \dots\,d\tau$, kernel vector $v = ((\partial t/\partial\tau)_p, -(\partial t/\partial a)_p)$; covector drawn as its level lines $(dt)_p(w) = \pm1$ (orange), kernel line ink, gold slice; badge "Absolute time?". Widget readouts can now show `\sqrt` (CSS fix: `.widget .katex svg`).
### 2026-10-21 — ch08-challenge part 2 (challenge, 26 new cards, 59 total)
- Appended Problem 4 (13 cards), Problem 5 (12 cards) and `wrap-up` to `content/ch08/challenge.yaml`; intro items 4–5, intro title now "Five problems on integrals"; `course.yaml` summary extended. Validate clean; shots 0 problems; part 1's pmatrix option (p3-metric) viewed at 390 px: fits, unchanged. Chapter 8 complete.
- Choices: P5 rescaling letter $\psi$ ($\varphi$ is the torus angle); half-plane keeps ch07's $(u,w)$ although P4 uses $u$ for a light-cone coordinate (each card restates its setup); Möbius: no volume form proved with the sign-flip function $F$ and the intermediate value theorem (non-orientability then from the earlier converse, stated without proof); unsigned $|\det|$ densities named only. Also fixed a false aside in `ch08-metric-volume` (`unit-volume-converse` explanation): the light-cone chart with components $\begin{pmatrix}0&1\\1&0\end{pmatrix}$ is $((a+t)/\sqrt2,(a-t)/\sqrt2)$, Jacobian det $+1$, not "a $45°$ rotation".
- Conventions fixed here (`ch08-challenge` part 2): intro title "Five problems on integrals", items 4–5 added; tags "Problem 4 · Spacetime volume of a causal diamond", "Problem 5 · Rescaling and orientability". P4: 1+1 Minkowski $(t,a)$, $\eta = \mathrm{diag}(-1,1)$, events $O = (0,0)$, $P = (2,0)$, diamond $|a|<t$, $|a|<2-t$; light-cone chart $u := t-a$, $v := t+a$ (Jacobian det $+2$; $(v,u)$ det $-2$, wrong orientation), $\mathbf{G}_\mathscr{Y} = \begin{pmatrix}0&-\frac12\\-\frac12&0\end{pmatrix}$ ($-dt^2+da^2 = -du\,dv$), $\det = -\tfrac14$, $\omega^g = \tfrac12$, diamond = square $(0,2)^2$, volume $2$ (also as rhombus in $(t,a)$); boost at $\tfrac35$: $t' = \tfrac14(5t-3a)$, $a' = \tfrac14(5a-3t)$, $u' = 2u$, $v' = v/2$, rectangle $4\times1$, volume $2$, $P' = (\tfrac52,-\tfrac32)$; volume $\tfrac12\tau^2$ ($\tfrac92$ at $\tau = 3$). P5: rescaling letter $\psi$ (not $\varphi$, the torus angle): $\tilde g := e^{2\psi}g$, $\det\tilde g = e^{2d\psi}\det g$, $\Omega^{\tilde g} = e^{d\psi}\Omega^g$ ($16$ at $d = 4$, $\psi = \ln2$); half-plane $\mathbb{H}$, chart $(u,w)$ as ch07, $\psi = -\ln w$, density $1/w^2$ ($4$ at $w = \tfrac12$), strip $1<w<2$: $\tfrac12$, $\tfrac1{10}<w<1$: $9$ ($n-1$), $0<w<1$ excluded (closure in $\mathbb{H}$ not compact); Möbius strip = band $\mathbb{R}\times(-1,1)$, $(\theta+2\pi,-s)\sim(\theta,s)$, flat metric, charts $\mathscr{X} = (\theta,s)$, $\theta\in(0,2\pi)$, $\mathscr{Y} = (\theta',s')$, $\theta'\in(-\pi,\pi)$, overlap dets $+1$ / $-1$; no volume form via $F(\theta) := \Omega(\partial_\theta,\partial_s)|_{(\theta,0)}$, $F(\theta+2\pi) = -F(\theta)$ (IVT), non-orientable via the earlier converse; unsigned area with $|\det|$ ("density, or the Riemannian measure", stated without proof) $4\pi$. Wrap-up: five problems' formulas + the $\int_\mathcal{M}f$ sum; teaser Newton–Cartan (equal fall, pseudo-forces, absolute time). No widget.
### 2026-10-21 — ch08-challenge part 1 (challenge, 33 cards)
- Built `content/ch08/challenge.yaml` (intro + problems 1–3), registered in `course.yaml` with summary. Validate clean; shots: two phone overflows (p3-metric, p3-partition explanations) fixed with `aligned`, then 0 problems. No widget, no images viewed.
- Choices: P1 avoids the lesson's $(0,\infty)$ and tan examples as main cases (tan only recalled): proof as an order card, the bound in numbers, the manifold $(0,1)$ with $1/p$, and a chart $p^2$ whose density blows up at the edge (step 2 fails, not step 1). P2 builds a telescoping staircase instead of the normalization (normalization only in the order card). P3: C.7 was used by `ch08-circle-length`, so the torus (radii $R,\rho$) replaces it, with patches in two charts, a swapped chart of the wrong orientation, a cover count, and a four-chart partition.
- Conventions fixed here (`ch08-challenge` part 1): intro lists problems 1–3 only (part 2 appends 4–5); tags "Problem 1 · Why the closure must be compact", "Problem 2 · Building a partition of unity", "Problem 3 · The area of a torus". P1: integrand $h(\alpha) := (\omega_\mathscr{X}\circ\mathscr{X}^{-1})(f\circ\mathscr{X}^{-1})$ (book's name, only in P1), bound $C(2L)^d$ (disc radius 2, $f = a^2+b^2$: $64$ vs $8\pi$); manifold $\mathcal{M} = (0,1)$ with $f = 1/p$ (closure taken in $\mathcal{M}$), cutoff $(\epsilon,\tfrac12)$ → $\ln50$; edge chart $\mathscr{Y}(p) := p^2$ on $(0,\infty)$, density $1/(2\sqrt\beta)$ ($5$ at $\beta = \tfrac1{100}$), step 2 fails (tan chart breaks step 1). P2: $g(t) = e^{-1/t}$ ("unrelated to the metric"), $g' = t^{-2}e^{-1/t}$, $100e^{-10}\approx0.00454$, smooth not analytic; cover $\mathcal{U}_n = (n-1,n+1)$, steps $H_n(p) := h(2p-2n+1)$, staircase $\text{ᚹ}_n = H_n-H_{n+1}$ (supp $[n-\tfrac34,n+\tfrac34]$), $\text{ᚹ}_3(3.5) = \tfrac12$, two nonzero at $3.3$; refinement and **paracompact** named; existence order card (6 steps); two origins → $\text{ᚹ}_A(0_B) = 1$ contradiction; long line → countable basis. P3: torus $R>\rho$, $\vartheta$ round the tube ($0$ = outer rim), $\varphi$ round the axis, $\mathscr{X}\in(0,2\pi)^2$ positive, $\mathscr{Y}$: $\vartheta\in(-\pi,\pi)$, $\varphi\in(0,2\pi)$, $\mathscr{W}$: both in $(-\pi,\pi)$, swapped $\mathscr{Z} := (\varphi,\vartheta)$ (wrong orientation); $\vec u_\vartheta,\vec u_\varphi$, $g = \mathrm{diag}(\rho^2,(R+\rho\cos\vartheta)^2)$, $\omega^g = \rho(R+\rho\cos\vartheta)$; numbers at $R = 3$, $\rho = 1$: $2.5$ at $\vartheta = \tfrac{2\pi}3$, inner patch ($\vartheta,\varphi\in(\tfrac\pi2,\tfrac{3\pi}2)$) $\pi(3\pi-2)$, outer patch in $\mathscr{Y}$ $\pi(3\pi+2)$, $\mathscr{Z}$ gives $-\pi(3\pi-2)$, $\mathscr{X},\mathscr{W}$ miss $(0,\pi)$, $(\pi,0)$, total $12\pi^2 = 4\pi^2R\rho$; partition $h(\pm\cos\vartheta)h(\pm\cos\varphi)$ over the four charts. No widget.
### 2026-10-21 — ch08-map (map, 14 boxes)
- Built `content/ch08/map.yaml` (14 nodes on 12 rows, 2 decoys each, 14 labelled edges, intro + outro teasing `ch08-challenge`), registered in `course.yaml` with summary. Validate clean; shots 0 problems; complete view checked (labels clear, no arrow behind a box).
- Choices: no TeX map for Chapter 8, so boxes follow the book headings 8.1–8.3 and the lessons; $\varepsilon$ and $\det g_\mathscr{X}$ are root boxes (no arrow into them); support split from partition of unity; circle and sphere results merged into one box. Restored the lost backslashes in the `ch08-circle-length` Log entry.
- Conventions fixed here (`ch08-map`): 14 boxes, 3 columns: problem (disc $\pi$ vs $2\pi$), change of variables, volume form, Levi-Civita symbol (dashed "sign pattern"), scalar density, density law, oriented atlas, integral in one chart, support, partition of unity, integral over the manifold, $\det g_\mathscr{X}$, metric volume form, lengths and areas ($2\pi R$, $4\pi$); decoys reuse the trap examples (linear chart det $-5$, scaled $\mathscr{S}$, mirror $\mathscr{Z}$, disconnected overlap, $(0,\infty)$, $e^{-a^2-b^2}$ not compactly supported, indicators, $\tfrac12(1\mp q_1)$, lopsided partition, $\det g$ without root gives disc $\tfrac{2\pi}3$, no abs fails for $\eta$, density $R^2$, shadow $2R$); outro teaser: compact closure inside the chart (B.19).
### 2026-10-20 — ch08-traps (traps, 21 cards)
- Built `content/ch08/traps.yaml`: intro (notation), build (which Jacobian), abs det, scaled density, nowhere-zero densities, diagonal proposal, ε not a tensor, mirror integral,
  mirror atlases, disconnected overlap, one-chart regions on $S^1$, support of $a^2$, indicator split, lopsided partition, needs a metric?, $\sqrt{|\det g|}$, Lorentzian abs, mirror $\omega^g$,
  unit volume not orthonormal, length vs shadow; summary (rules) + teaser for `ch08-map`. Registered with summary. Validate clean, shots 0 problems.
- Choices: 19 questions (plan item 6 shown on $\mathbb{R}$ with a disconnected overlap, since both angle-chart overlap pieces on $S^1$ have the same sign); partition independence tested with a numerically computed piece.
- Conventions fixed here (`ch08-traps`): fresh examples: linear chart $a = s+2t$, $b = 3s+t$ (det $-5$, area $5$); scaled chart $\mathscr{S}(a,b) = (3a,3b)$, $\omega_\mathscr{S} = \tfrac19$ (also "ε is not a tensor": components $\tfrac19\varepsilon$); densities $1+a^2$, $-3$, $e^b$ allowed, $a$ not; proposal $\begin{pmatrix}1&1\\-1&0\end{pmatrix}$ fails ($\Omega_{11}\neq0$); mirror integral $f = b$ on $0<a<2$, $1<b<2$: $3$ vs $-3$; $\{\mathscr{X}\}$, $\{\mathscr{Z}\}$ oriented, $\{\mathscr{X},\mathscr{Z}\}$ not; disconnected overlap on $\mathbb{R}$: $\mathscr{Y} = p$ on $(1,2)$, $-p-10$ on $(-2,-1)$; arcs in $\theta\in(0,2\pi)$: $1<\theta<2$, $\frac\pi2<\theta<\frac{3\pi}2$ fit, $0<\theta<\pi$ and the whole domain do not; $\mathrm{supp}\,a^2 = \mathbb{R}^2$; indicator split gives $4\pi$; lopsided partition $\text{ᚹ}_1 = h(-q_1-\frac14)$, $\text{ᚹ}_2 = h(q_1+\frac14)$, pieces $\approx2.628$, $3.655$ (computed numerically); $\begin{pmatrix}2&1\\1&5\end{pmatrix}$: $\omega^g = 3$; Lorentzian $\begin{pmatrix}-1&2\\2&0\end{pmatrix}$: $2$; mirror $\omega^g_\mathscr{Z} = -1$; $\begin{pmatrix}2&1\\1&1\end{pmatrix}$ unit volume, not orthonormal; unit circle arc $\frac{5\pi}4\to\frac{7\pi}4$: $\frac\pi2$ vs shadow $\sqrt2$. No tags, no widget.
### 2026-10-20 — ch08-circle-length (guided, 27 cards)
- Built `content/ch08/circle-length.yaml` from the circle integration example: setup (three charts), Step 1 direction of $u$, transition map, Jacobian at $u=1$, oriented-atlas check;
  Step 2 induced metric as squared speed; Step 3 densities and the density law; Steps 4–5 arc in both charts (antiderivative, arcsin identity, no-density trap); Step 6 flipped projection;
  Steps 7–8 partition (supports, build of the first term, periodic shift, total $4\pi$, one-chart shortcut); wrap-up + teaser for `ch08-traps`. Validate clean, shots 0 problems.
- Choices: projection chart named $\mathscr{P}$ with coordinate $u$ (book $\mathscr{Z}$, $\gamma$ clash with the mirror chart and curves); book's step $\chi$ replaced by the earlier $h$.
- Conventions fixed here: see Current, "Chapter 8 conventions so far" (`ch08-circle-length`).
### 2026-10-20 — ch08-metric-volume (concept, 22 cards)
- Built `content/ch08/metric-volume.yaml` (hook: who chose $\Omega_{\mathrm{E}}$, sphere density guess; recall of the metric law, $\det g$ at $(3,4)$, determinant law, why the square root,
  definition, polar check, build of the density law, orientation MCQ, component-proof order card, mirror trap, orthonormal unit volume, Minkowski rescaled chart, light-cone converse trap,
  sphere density, patch $\tfrac\pi2$, poles and cut, total $4\pi$, integral formula, spacetime volume $3$); registered with summary.
  Choices: no widget (optional in the plan); sphere total justified by the zero-area fact "stated here without proof", after naming the partition-of-unity route, plus an $\epsilon$-exhaustion check; both derivations of the gluing given.
  validate 0/0, shots 0 problems.
- Conventions fixed here: see Current, "Chapter 8 conventions so far" (`ch08-metric-volume`).
### 2026-10-20 — ch08-integration (concept, 25 cards)
- Built `content/ch08/integration.yaml` (hook: length of $S^1$ without one chart, `circle-charts` cover widget, recipe guess, density on $S^1$, one-chart definition,
  compactness and its two failures, allowed arcs, quarter annulus in polar, disc-in-polar trap, chart-independence proof as text + build + sign MCQ, mirror trap,
  support, support trap, partition of unity, explicit circle partition, piece $=\pi$, total $2\pi$, finiteness, independence of the partition proved); registered with summary.
  Choices: the plan's "unit disc in both charts" replaced by a quarter annulus (the closed disc meets the polar cut, so the strict definition forbids it; made into a trap);
  partition built from an explicit smooth step so the pieces are computable by symmetry; independence of the partition proved (the book only states it).
  validate 0/0, shots 0 problems (one summary overflow fixed with `aligned`).
- Conventions fixed here: see Current, "Chapter 8 conventions so far" (`ch08-integration`).
### 2026-10-20 — ch08-volume-forms (concept, 33 cards)
- Built `content/ch08/volume-forms.yaml` (hook disc $\pi$ vs $2\pi$, `chart-basis` polar patch widget, change of variables, volume form, $\varepsilon$ and det,
  scalar density law, disc resolved, not-a-scalar trap, oriented atlas with mirror chart, orientability, volume form orients); registered with summary.
  Choices: the book's facts (a)-(c) shown as (a) plus the det formula plus "(b)" = book's (c); "a volume form fixes an orientation" proved (positive charts,
  flip $-\mathscr{X}^1$ on connected pieces), not in the book's 8.1 text; widget kept to the polar chart alone (cartesian arrows overlapped the polar ones at $p$).
  validate 0/0, shots 0 problems.
- Conventions fixed here: see Current, "Chapter 8 conventions so far" (`ch08-volume-forms`).
### 2026-10-20 — ch07-challenge part 2 (problems 4–5 and wrap-up, 22 cards; 61 in total)
- Appended to `content/ch07/challenge.yaml`: intro items 4–5, P4 second variation (half-plane sideways push, Minkowski clock, sphere equator arcs and the
  conjugate point), P5 Einstein curvature in 2D and the divergence-free combination, `wrap-up` with the Level 8 teaser (disc area chart by chart); `course.yaml`
  summary extended. Choices: the book's sideways meridian family (bowl, Wirtinger bound) replaced by the half-plane $\delta_{ij}/w^2$, where the $\text{ᛊ}^2$ coefficient
  is visibly positive and the bound is exact; the sphere trap derived by hand ($C = \tfrac12\int(h'^2-h^2)$) instead of only stated; the conjugate point is the antipode
  itself; the change-of-chart covector law of the E-L residual was not used (already shown to first order in `ch07-euler-lagrange`). 22 cards (plan ~25).
  validate 0/0, shots 0 problems.
- Conventions fixed here: see Current, "Chapter 7 conventions so far" (`ch07-challenge` part 2).
### 2026-10-20 — ch07-challenge part 1 (problems 1–3, 39 cards)
- Built `content/ch07/challenge.yaml` (intro with toolkit and problems 1–3; P1 contracted Christoffel symbols from B.18.1–B.18.2; P2 a variation by hand on the
  optical half-plane $\delta_{ij}/w^2$ with moving endpoints (fresh numbers, C.6 structure only); P3 B.18.4 for $\mathcal{Y}$ plus B.18.11 items 2–3); registered in
  `course.yaml` with `file:` and summary. Choices: intro lists only 1–3 (part 2 extends it); half-plane points named $(u,w)$ to avoid the $[a,b]$ clash; B.15 not used;
  energy E-L = (G) only recalled (already in `ch07-geodesic-equation`), the new content is the constant-speed theorem and the degree-1 tautology. 39 cards (plan said ~35).
  validate 0/0, shots 0 problems after one `aligned` fix (p3-shows).
- Conventions fixed here: see Current, "Chapter 7 conventions so far" (`ch07-challenge` part 1).
### 2026-10-20 — ch07-map (map, 14 boxes, 12 rows)
- Built `content/ch07/map.yaml` from the book's 7.x headings and intro paragraphs plus the lessons' `own:` summaries (no Chapter 7 TeX file); registered in
  `course.yaml` with `file:` and summary. Choices: one concept per row along the chain length→variations→E-L→(G)→Christoffel→LC→Riem, so 12 rows (taller than
  ch06's 8, but no horizontal edges and no arrow behind a box); Levi-Civita box holds torsion free + compatible + uniqueness; flat beside Ricci. validate 0/0,
  shots 0 problems; complete-map phone image checked (labels clear, no overlaps).
- Conventions fixed here: see Current, "Chapter 7 conventions so far" (`ch07-map`).
### 2026-10-20 — ch07-traps (traps, 24 cards)
- Built `content/ch07/traps.yaml` (intro; metric: same-height sum, ♭ not renaming, inverse not reciprocal; signature: congruence vs similarity, positive entries,
  det sign in 4D, lightlike nonzero; length: $\int g(v,v)$ not invariant, twin proper time + longest; geodesics: long way round, sheared coordinate lines, $\lambda^3$ speed,
  energy vs length Lagrangian; LC: torsion free not compatible (sphere), ∇ᵂ compatible with torsion, scaled metric keeps Γ; curvature: $f = 3r$ flat, equator Γ = 0,
  vacuum 4D, radius 3, cosh; summary + map teaser). Registered in `course.yaml` with summary. Choices: fresh numbers throughout (transfer, not repetition); null-geodesic
  trap skipped (already a card in `ch07-levi-civita`), replaced by "stationary is not shortest". validate 0/0, shots 0 problems.
- Conventions fixed here: see Current, "Chapter 7 conventions so far" (`ch07-traps`).
### 2026-10-20 — ch07-sphere (guided, 30 cards)
- Built `content/ch07/sphere.yaml` (hook pilot due east + parallels guess mcq; Step 1 chart/domain, metric from $\mathbb{R}^3$ dot products, $g_{22}$ numeric, $g_{12}$ mcq,
  family text; Step 2 $\Gamma^1_{22}$ build, $\Gamma^2_{12}$ mcq, numeric at $\pi/4$, pole trap, (G) mcq (factor 2); Step 3 meridian mcq, great circles by rotation;
  Step 4 speed and residual numerics, which-parallels mcq, equator $\lambda^2$ (G)/(S) mcq, pilot text + mcq (southern hemisphere); Step 5 variation text, $dL/d\text{ᛊ}$ numeric,
  over-the-pole mcq; Step 6 Riem mcq, $R$ numeric, Ric mcq; Step 7 holonomy order card; Step 8 radius $a$ build + numeric; summary + traps teaser).
  Choices: metric derived from the embedding (dot products of coordinate-line arrows), not by transformation law; variations included (book's paraboloid structure);
  holonomy verified by transport equation with $z = (1,0)$ on all legs; Gauss–Bonnet only stated ("angle = area"). validate 0/0, shots 0 problems (one phone overflow fixed by splitting $F$).
- Conventions fixed here: see Current, "Chapter 7 conventions so far" (`ch07-sphere`).
### 2026-10-20 — ch07-curvature (concept, 30 cards)
- Built `content/ch07/curvature.yaml` (hook: polar Γ ≠ 0 yet flat, guess mcq; recall Riem/Ric + "from now on" chain; derivatives mcq; polar numeric 0 and
  tensor argument; family $\mathrm{diag}(1,f^2)$: Γ mcq, $-ff''$ mcq, $f = r^2$ numeric $-2$, $f = 2r$ flat mcq; Riem♭ text + build, pair numeric $-8$; normal-chart
  derivation + cancel mcq; symmetries (a)–(d), components mcq, count numeric; Ricci-symmetric order; Ricci scalar text + numeric $-1$; 2D statement; sinh mcq;
  Einstein + contracted Bianchi, trace numeric; traps normal chart, flat ⇔ constant components, Ric = 0 by dimension; own (5 blanks) + sphere teaser).
  Choices: curved example $f = r^2$ (simple integers) with $f = \sinh r$ as the constant-curvature aside; book's name Riem♭ used instead of the plan's
  $\mathrm{Riem}_{ijkm}$; symmetries proved in a normal chart (the book's route); no widget (none fits). validate 0/0, shots 0 problems.
- Conventions fixed here: see Current, "Chapter 7 conventions so far" (`ch07-curvature`).
### 2026-10-20 — ch07-levi-civita (concept, 31 cards)
- Built `content/ch07/levi-civita.yaml` (hook (G) vs (A), "what must be checked" mcq (transformation law); recall ∇ᴱ/∇ᴾ/∇ᵂ polar coefficients;
  widget ray E/P/W with length mcq and ∇ᴾ numeric 6; Christoffel + LC definition; compatibility definition, chart build, ∇ᴱ/∇ᴾ numerics; LC compatible via
  lowered symbols (mcq, polar numeric); torsion free + theorem; cyclic build, solve mcq, proof order; existence from uniqueness + mcq; traps ∇ᵂ (numeric, mcq),
  antisymmetric, how-many, Γ not a tensor; transport identity, consequence mcq, ∇ᴾ speed trap, constant speed + null geodesics, Minkowski mcq; own + teaser).
  Choices: hook question is the existence debt (resolved by uniqueness) rather than a count, the count is asked late ("how-many"); added ∇ᴾ as the
  torsion-free-but-not-compatible counterexample (not in the plan). validate 0/0, shots 0 problems; widget preset viewed.
- Conventions fixed here: see Current, "Chapter 7 conventions so far" (`ch07-levi-civita`).
### 2026-10-20 — ch07-geodesic-equation (guided, 29 cards)
- Built `content/ch07/geodesic-equation.yaml` (hook: polar equations tested on radial line, circle, $r = \lambda^2$; Step 1 velocity-slot mcq, position-slot
  build, polar numeric; Step 2 insert the curve, "why multiply by ᛇs" mcq; Step 3 constant-speed mcq, chain-rule build, product rule; Step 4 swap mcq,
  order card, lowered form; Step 5 raise build; (G) and comparison with (A); properties mcq; polar $\Gamma^1_{22}$, $\Gamma^2_{12}$ numerics, all six, factor-2 mcq,
  horizontal line numeric; hook resolved; trap $r = \lambda^2$, (S), RHS numeric, arc-length mcq, energy shortcut mcq; summary). Registered in `course.yaml`.
  Choices: named the lowered combination $\Gamma_{mij}$ to keep build tiles phone-sized; kept ᚱ instead of B.16's σ; energy-Lagrangian card added
  (not in the plan) since ch07-euler-lagrange introduced it; constant-speed result of the energy E-L stated, not proved. validate 0/0, shots 0 problems.
- Conventions fixed here: see Current, "Chapter 7 conventions so far" (`ch07-geodesic-equation`).
### 2026-10-20 — ch07-euler-lagrange (concept, 31 cards)
- Built `content/ch07/euler-lagrange.yaml` (hook: arch family $(\lambda,\text{ᛊ}\sin\pi\lambda)$, guess $c_1$, compute $c_2 = \pi^2/4$; variation and shape; why $\text{ᛇ}\neq0$;
  precise geodesic definition; Lagrangian and bundle-chart slots, "not a covector" mcq, build card for the velocity slots; polar position slot (numeric);
  chain rule, build card for integration by parts, boundary-term mcq, fundamental lemma and "why the factor" mcq; E-L statement (book form + physics shorthand);
  order card for the proof; cartesian check (straight lines, any speed); energy Lagrangian and $(\lambda^2,0)$ test; reparametrization freedom; traps: stationary
  not minimal, free endpoint, chart dependence; chart-independence argument). `own:` with 4 blanks. Stopped before the geodesic equation (7.1). No widget.
  Choices: ᛉ called "shape"; B.14's admissibility step (compactness, $\text{ᛊ}_0$) told in one sentence, not a card. Housekeeping: the ch07-length doubt about
  broken escapes is resolved (fixed in d6d131d); also restored the lost `\\` row separators in the ch07-metric conventions line. validate 0/0, shots 0 problems.
- Conventions fixed here: see Current, "Chapter 7 conventions so far" (`ch07-euler-lagrange`).
### 2026-10-20 — ch07-length (concept, 28 cards)
- Built `content/ch07/length.yaml` (hook: two runners on the radius-5 circle; Minkowski clock breaks the root; sign rune and speed; length functional;
  circle in polar ($10\pi$) and polar slips; null curves select-all; piecewise sign; proper time, moving clock ($4$), twin paradox ($8$), longest worldline;
  reparametrization recall, $|\text{ᚱ}'|$ mcq, substitution, build card for the reversing case, order card for the invariance proof; traps: twice round,
  backwards, integral of $g(v,v)$; geodesic as stationary length, "why stationary"). `own:` with 4 blanks. Choices: parameter $\mu$ (ch04) instead of the
  proof's $\tilde\lambda$; proof extended to indefinite metrics interval by interval ($\text{ᛇ}_\delta = \text{ᛇ}_\gamma\circ\text{ᚱ}$); no widget (numerics serve better).
  Doubt (resolved in d6d131d): earlier STATUS entries (ch07-signature) had broken escapes.
  validate 0/0, shots 0 problems.
- Conventions fixed here: see Current, "Chapter 7 conventions so far" (`ch07-length`).
### 2026-10-20 — ch07-signature (concept, 27 cards)
- Built `content/ch07/signature.yaml` (hook: $\eta$ in three charts, guess the invariant; no eigenvalues (covector vs vector, $\lambda$ moves $1\to\tfrac14$);
  Sylvester's law, no zeros, order card for the B.12 existence proof, uniqueness mcq; completing squares; eigenvalue-sign route; light-cone and
  all-positive-entries traps; classes, Lorentzian select-all, null basis, null cone; constancy on connected manifolds with a disconnected example;
  determinant sign). `own:` with 5 blanks. Choices: no widget fits (numeric instead); $\mathbf{A}$ named for the Jacobian to avoid Chapter 2's $J$.
  Doubt resolved: the hook's $\mathrm{diag}(-\tfrac14,\tfrac14)$ and $\begin{pmatrix}0&1\\1&0\end{pmatrix}$ rechecked by hand, correct; metric.yaml teaser unchanged.
  validate 0/0, shots 0 problems.
- Conventions fixed here: see Current, "Chapter 7 conventions so far" (`ch07-signature`).
### 2026-10-20 — ch07-metric (concept, 30 cards)
- Built `content/ch07/metric.yaml` (hook: polar components $(0,1)$ at $(3,4)$, length 1 or 5?; `chart-basis` widget early; metric definition, pointwise
  non-degeneracy, metric-or-not, injective-not-enough; components, Euclidean polar $\mathrm{diag}(1,r^2)$; lowering, raising, $g^{-1}$ (order card for
  $g_{ij}(g^{-1})^{jk} = \delta^k_i$), "inverse of what?"; Minkowski $\eta$, lightlike trap). `own:` with 5 blanks. Signature left for `ch07-signature`.
  Choices: no Chapter 7 TeX file; Euclidean metric unlabelled $g$; book's $(g^{-1})^{ij}$ kept. validate 0/0, shots 0 problems (widget view enlarged once).
- Conventions fixed here: see Current, "Chapter 7 conventions so far" (`ch07-metric`).
### 2026-10-20 — own: backfill, Chapters 4-5 (tangent-space, cotangent, coordinate-basis, cotangent-basis, tensor-space, einstein; module, vector-fields, covector-fields, tensor-fields)
- Summary moved into `own:` (wording unchanged, blanks added); card keeps id, title and the "**Next:**" teaser. Guided lessons (`velocity-operations`,
  `chart-basis`, `differentials`) skipped. Blanks: tangent-space 4, cotangent 4, coordinate-basis 4, cotangent-basis 4, tensor-space 4, einstein 5,
  module 4, vector-fields 5, covector-fields 5, tensor-fields 5. validate 0/0, shots 0 problems.
- Conventions fixed here: long chains (Jacobian rune chain) are blanked whole; of a covariant/contravariant pair of laws mark one (the contravariant
  component law, or the covariant lower-index one); bundle charts and section conditions ($\pi\circ\mathcal{X} = \mathrm{id}$) are defining formulas;
  an iff/definition prose blank keeps the term and hides only the condition ("invertible iff {{ it never vanishes }}").
### 2026-10-20 — own: backfill, Chapter 3 (open-sets, standard-topology, homeomorphisms, hausdorff, charts, atlases, smooth-maps) + Back/retry fix
- Summary moved into `own:` (wording unchanged, blanks added); card keeps id, title and the "**Next:**" teaser. `circle` is `guided`, skipped.
  Blanks: open-sets 5 (three topology rules, discrete, indiscrete), standard-topology 3, homeomorphisms 3, hausdorff 3, charts 3, atlases 3, smooth-maps 3.
  Igor approved with no vetoes. Player fix: a question counts as answered (shown on Back) only once solved or revealed, not after a wrong attempt.
- Conventions fixed here: prose blanks hide only the definition and keep the term visible ("A map is **continuous** when {{ … }}"); a chain
  of independent rules is marked rule by rule; skip a definition whose key verb would be hidden (atlas = charts that "cover").
### 2026-10-20 — own: backfill, Chapter 2 (maps, axioms, dual, basis, change-of-basis, tensors, tensor-product)
- Summary moved from the wrap card into `own:` (wording unchanged, blanks added); the card keeps id, title and only the "**Next:**" teaser.
  Blanks: maps 3, axioms 5 (commutativity, inverses, scaling associativity, distributive 1, unit), dual 3, basis 4, change-of-basis 3, tensors 4,
  tensor-product 4. Axioms skipped the rules a marked one gives away (neutral element given by inverses, distributive 2 by distributive 1).
- Conventions fixed here: blank the defining formulas (`{{ $…$ }}` for displayed ones), not prose; never hide a sentence's verb or key word;
  a prose blank only when its own sentence recalls it (e.g. "contravariant" after the transformation formula); of a pair of rules that give each
  other away, mark one. Igor's pilot feedback: "focus on defining formulas".
### 2026-10-20 — ch06-challenge part 2 (problems 4–5 + wrap-up, 19 cards); Chapter 6 complete
- P4 difference tensor: setup (two non-tensors, name $\mathcal{Q}$), Leibniz build, properties multi-select, cartesian $Q^2_{11} = 4/25$ by hand,
  polar components MCQ, plain tensor law numeric ($5 = r$ at $(3,4)$), torsion build, connection-plus-tensor multi-select, summary. P5 normal
  coordinates for ∇^κ at $(1,0)$: equivalence-principle hook, recipe text, inverse build, law cancellation numeric ($\kappa = 2$), away-from-$p$ numeric,
  Riem numeric, what-can-be-removed multi-select, physics card, summary. Wrap-up: formulas of all five problems, Level 7 teaser.
- Choices: letter $\mathcal{Q}$ (vector-valued, like the torsion field $\mathcal{V}$) with components $Q^i_{jk}$ (not typewriter); added the
  "connections form an affine space" card beyond christoffel's tensor-or-not card; Γ in normal coords derived both by the law at $p$ and directly
  via basis fields away from $p$; Riem computed in the new chart (derivative survives) rather than only asserted.
- Conventions fixed here: see Current, "Chapter 6 conventions so far" (`ch06-challenge` part 2 lines).
### 2026-10-20 — ch06-challenge part 1 (problems 1–3, 30 cards)
- Intro lists all five problems (recalls Γ convention, acceleration, transport, T, Riem, the three connections). P1 ∇ᵂ straightest curves: guess,
  widget (circle W/E, ray, vertical), why-circle MCQ, polar Γ re-derived, radial MCQ, angular build, conserved $r\dot\theta$ build, frame-route text,
  cases multi-select, spiral numeric, spiral under ∇ᴱ numeric, flat-but-not-torsion-free trap, summary. P2 ∇ᶠ: setup table, other Riem components,
  Ricci, flat κ, autoparallels = ∇^κ, transport numeric, moral multi-select, summary. P3 sheared chart: count (1), equation build, which curves,
  tangent line $\dot v = 0$, same start MCQ, flat MCQ, summary. Wrap-up deferred to part 2.
- Choices: transport numeric along the vertical line $(1,\lambda)$ (exponential answer) rather than $(\lambda,0)$, already asked in
  ch06-parallel-transport; Riem/torsion of ∇ᶠ stated in setup (asked in three-connections) and new questions asked instead; widget $z_0 = (1,0)$
  on circles so $\mathcal{Z}$ does not overlap $v_\gamma$; added the symmetric part of ∇ᵂ being curved as the explanation of the trap card.
- Conventions fixed here: see Current, "Chapter 6 conventions so far" (`ch06-challenge` lines).
### 2026-10-20 — ch06-map (map, 14 boxes)
- No TeX map: built from the chapter headings and the ch06 lessons. Boxes: chart-dependent component derivatives, connection (five rules, product rule), affine manifold, Γ, $\pm\Gamma$ rule,
  transformation law, derivative along a curve, parallel transport, autoparallels, commutator, torsion, Riemann, Ricci, flat + torsion free; two decoys each (Γ a tensor, torsion → route dependence,
  Γ for functions, normal coordinates remove curvature, autoparallels see torsion, plus sign/index-slot, missing commutator terms, Ricci on the wrong slot or always symmetric, etc.).
- Choices: no model-example box (14 boxes already); 8 rows so every labelled edge crosses rows; label "added to $\mathcal{M}$" shortened to "equips" (validator); no soft hyphen in "Affine manifold" (wrapped badly).
- Checks: facts against the lessons (∇ᴱ polar $\Gamma^1_{22}=-r$, ∇ᵂ $\Gamma^1_{21} = -4/25$, holonomy $(0,1)\to(-1,1)$, $S(ab\,\partial x_2,\partial x_1) = -b\,\partial x_2$, $\mathrm{Riem}^m_{mab}$ antisymmetric);
  validate 0/0; shots 0 problems (after breaking T, Riem, commutator formulas); phone complete-map screenshot viewed, layout clean at 390 px.
- Also fixed the stale Queue line. Conventions fixed here: see Current, "Map ch06" lines.
### 2026-10-20 — ch06-traps (traps, 21 cards)
- 19 questions (10 numeric, 7 MCQ, 2 build), intro with notation (charts, Γ convention, ∇ᴱ, ∇ᵂ, ∇^κ), summary of rules as formulas, teaser for the map.
  Traps: Γ zero in cartesian but $2$ in a sheared chart; index order (∇ᵂ $\Gamma^1_{12}$); scalar rule (same $0.6$ for all connections); covector $-\Gamma$ ($5$); Leibniz vs $C^\infty$-linear slot ($6$ vs $3$);
  derivative needs the field near $p$; autoparallel vs autoparallelly transported ($(e^\lambda,e^\lambda)$); route dependence (∇^κ, $-1$); torsion does not cause route dependence (∇ᵂ); commutator first order and both terms;
  torsion free ≠ $\nabla_XY = \nabla_YX$; torsion from the antisymmetric part; autoparallels see the symmetric part (build + symmetrized connection); symmetry chart-independent; Ricci contraction (build + numeric $2$); Γ(0)=0 but Riem $=2$ (∇^κ at origin).
- Checks: every number by hand (sheared chart directly and via the law; ∇ᵂ $\nabla_{\partial x_2}\partial x_1 = -\tfrac a{r^2}\partial x_2$ from the frame; $dr$ via cartesian; routes vs holonomy law); validate 0/0; shots 21 cards, 0 problems.
- Choices: plan item 8's $[e_1,e_2]\neq0$ already a question in `ch06-torsion-curvature` (`which-commute`), so mentioned only in feedback and replaced by a "both terms" commutator numeric; plan item 6 avoided the λ² ray (already `radial-squared`) and used $(e^\lambda,e^\lambda)$;
  added two extra traps (derivative needs a neighbourhood; torsion free ≠ symmetric swap for non-commuting fields) and symmetric-in-every-chart.
- Conventions fixed here: see Current, `ch06-traps` lines.
### 2026-10-20 — ch06-three-connections (guided, 32 cards)
- Hook (three connections, 2×2 table, guess); early widget (vertical segment $(1,\lambda)$, $\lambda\in[-1,1]$, E/W/κ, compareE, torsion) + numeric $90°$, turning-is-not-curvature MCQ; tools card (Γ, T, Riem formulas);
  ∇ᴱ polar: derivation text, $-r\,\partial y_1$ MCQ, torsion MCQ, build of $\mathrm{Riem}^2_{112}$; ∇ᵂ: frame text, polar $\Gamma^2_{21}$ MCQ, $\mathtt{T}^2_{12} = 0.2$, cartesian build + numeric $-4/25$, torsion MCQs (cartesian, frame $-[e_1,e_2]$,
  three-agree with det), flat MCQ; ∇^κ: torsion MCQ, Riem from the definition ($2$), nonzero-components multi-select, straightest-curve build + numeric $\pi/4$; holonomy prediction $-4$, rectangle widget, shifted-square MCQ;
  traps (nonzero Γ, flat ⇒ torsion free); table MCQ; fourth-box numeric ($3$); summary with formulas.
- Checks: every number by hand (det, $-4/25$ via $-\tfrac{36+64}{625}$, $\mathrm{Riem}^1_{212}=\kappa+1$, holonomy side by side, widget shows $\Delta z = (-4,0)$); validate 0/0; shots 32 cards, 0 problems; both widget presets viewed.
- Choices: to avoid repeating `ch06-torsion-curvature` I computed $\mathrm{Riem}^2_{112}$ (not $^1_{212}$), $\Gamma^1_{21}$ (not $\nabla_{\partial x_1}\partial x_1$), ∇^κ Riem from the definition (not the formula), new loop; widget placed right after the hook
  (all three connections on one segment) instead of a W-only check at Part 2; added the book's polar ∇ᵂ coefficients and a "fourth box" example (not in the book) to complete the table; ∇ᵂ autoparallels (circles, spirals) left out.
- Conventions fixed here: see Current, `ch06-three-connections` lines.

### 2026-10-20 — ch06-torsion-tensor (guided, 19 cards)
- Hook (two non-tensors, one tensor; $\mathcal{V}$ and $\mathtt{T}$) + guess MCQ; goal (C^∞-linearity per slot, pointwise principle, facts (a)–(d)) + constants-not-enough MCQ; first slot MCQ;
  commutator: order card (5 steps), build of the rule, numeric check $-2$ on the plane; which-∇-term MCQ; three-pieces card; collect build (cancellation); conclusion;
  third slot by antisymmetry MCQ (trap: separate computation); contrast $S$ under ∇ᴱ numeric $-5$; Riem remark + MCQ on $-\nabla_{[g\mathcal{X},\mathcal{Y}]}\mathcal{Z}$; summary with formulas.
- Checks: both numerics verified by hand (commutator rule both sides; $S$ and $[ab\,\partial x_2,\partial x_1]$ both $-b\,\partial x_2$); validate 0/0; shots 19 cards, 0 problems; no widget.
- Choices: general covector fields $\mathsf{X},\mathsf{Y}$ instead of the book's $df,dh$; book's footnote (third-slot cancellation) left to the previous lesson's card; Riem's $\mathcal{Z}$ slot only mentioned.
- Conventions fixed here: $\mathcal{V}(\mathcal{X},\mathcal{Y})$ for the torsion's vector field, facts (a)–(d), commutator rule in the first slot (see Current, `ch06-torsion-tensor`).

### 2026-10-20 — ch06-torsion-curvature (concept, 35 cards)
- Hook "once around a loop" (∇ᴱ, ∇ᵂ, ∇^κ introduced), early widget (rectangle $[1,2]\times[0,1]$, κ vs E, holonomy hidden) + numeric $\Delta z^1 = -1$, who-returns MCQ;
  commutator (second-order trap $D(a^2)$, chart computation, Schwarz MCQ, component build, numeric $-6$, which-commute incl. $[e_1,e_2]$); torsion (definition, build
  $\Gamma^i_{kj}-\Gamma^i_{jk}$, one tensoriality card, MCQ on dropping the commutator), torsion free = symmetric, tilting example $-2$; ∇ᵂ coefficients + numeric $3/25$, widget
  (vertical $x_0=1$, compareE, torsion, radial preset) + MCQ; Riemann (definition, product-rule build, formula + antisymmetry, count 4, ∇ᴱ polar flat 0, ∇^κ = 3), Ricci + MCQ;
  holonomy widget (5 presets) + numeric $-12$ + around-origin MCQ; flat-chart theorem + Bianchi; which-have-Γ=0 MCQ; summary with formulas.
- Checks: ∇ᵂ torsion verified by hand from the book's coefficients ($\mathtt{T}^1_{12} = -b/r^2$, $\mathtt{T}^2_{12} = a/r^2$ ✓); validate 0/0; shots 0 problems; three widget shots viewed.
- Choices: general holonomy law stated as approximate for small loops (exact for ∇^κ), without proof; GR remarks (Ricci in Einstein's equations, free fall removes Γ only at a point) as one-liners.
- Conventions fixed here: see Current, `ch06-torsion-curvature` lines (commutator components with $x^i$, $\tilde x^j$; summation index $n$ in Riem; book index orders).

### 2026-10-20 — widget `parallel-transport` extended for `ch06-torsion-curvature` (widget session)
- `js/widgets.js`: connections `W` (𝒵 keeps its $e_1,e_2$ components, i.e. rotates by the change of polar angle; stops at the origin) and `kappa` ($\dot z^1 = -\kappa a z^2\dot\gamma^2$,
  integrated by a 2400-step midpoint table, exact on the rectangle); curve `rectangle` with exact piecewise velocity; "After the loop" $\Delta z$ + prediction row (replaces the
  badge on closed curves); `compareE` (dashed ∇ᴱ copy + angle), `torsion` ($\mathtt{T}^1_{12},\mathtt{T}^2_{12}$ in $\mathscr{X}$); acceleration/transport equation for W, κ in $\mathscr{X}$.
  Fixed: ∇ᴾ on a curve that never leaves $\mathcal{V}$ no longer loses 𝒵 at the end of the range. CSS `.pt-cmp`.
- Verified: κ = 1, $[1,2]\times[0,1]$, $z_0=(0,1)$ gives $\Delta z = (-1,0)$ = prediction (sign matches the book); W loop around the origin $\Delta z = 0$; W along $\gamma_1$
  turns 𝒵 by $124.5°$ at $\lambda = 1.5$. ch06-parallel-transport and ch06-christoffel shots pass; throwaway lesson deleted, course.yaml restored.
- Choices: the torsion hint uses the vertical line (autoparallel of ∇ᴱ, not of ∇ᵂ: ∇ᵂ's only straight autoparallels are radial lines, where ∇ᵂ and ∇ᴱ agree); the lesson
  should say so. Button words: "frame" (W), "curved" (κ). Prediction for flat connections shown as $\Delta z = 0$.
- Conventions fixed here: $\nabla^{\mathrm{W}}$, $\nabla^{\kappa}$, $\mathtt{T}^i_{jk} = \Gamma^i_{kj} - \Gamma^i_{jk}$, $\mathrm{Riem}^1_{212}$, holonomy $\Delta z^1 = -\mathrm{Riem}^1_{212}z^2\times$area, rectangle CCW one side per unit λ.

### 2026-10-20 — ch06-parallel-transport (concept, 31 cards)
- Hook "is the circle straight?" (guess for ∇ᴱ/∇ᴾ), early widget (circle, badge and acceleration hidden), fields along curves with figure-eight, $\nabla_{v_\gamma}$ (theorem, Leibniz MCQ, order card for the uniqueness derivation, build of $(**)$), transport ODE and linear map, circle in polar (solution MCQ, numeric $\dot z^1(1.2) = -0.93$), parallel vs parallelly transported, autoparallel equation, symmetric-part trap plus antisymmetric transport numeric, vertical line in polar (two numerics), circle acceleration and reparametrization, second widget (badge presets), hook resolved, radial λ² (ᚱ = 2/3 at 1.5), holonomy text + MCQ, summary.
- Choices: in-lesson labels (C) chart formula and (A) autoparallel equation (no book numbers); reparametrization with the rune ᚱ (as ch04); GR "free fall = autoparallel" mentioned once (metric connection Level 7); sphere holonomy stated without proof.
- Conventions fixed here: field along $\gamma$ $x^k_\gamma$, dot $= d/d\lambda$, (C), (A), reparametrization $\delta\circ\text{ᚱ}$, antisymmetric example $\Gamma^1_{12} = -\Gamma^1_{21} = 1$.

### 2026-10-20 — widget `parallel-transport` (widget session)
- `js/widgets.js`: new `parallelTransport` (curve presets, λ slider + Play, ∇ᴱ/∇ᴾ toggle, draggable start vector, faded trail, $v_\gamma$, $a_\gamma$ dashed, optional polar basis,
  components in $\mathscr{X}$ and $\mathscr{Y}$, transport equation in numbers in the chart where Γ ≠ 0 (Γᴾ in cartesian by finite differences), "Autoparallel?" badge checked
  along the whole curve). Label placer (`labelPlacer`, `tipCands`) moved to module scope, shared with `chart-basis`. `combo` no longer prints "−0". CSS `.pt-*`.
- Docs: `#### parallel-transport` in `docs/LESSON_FORMAT.md`, QUICKREF line. Tested with a throwaway lesson (deleted), phone and desktop shots viewed, drag/Play/toggles checked.
- Choices: ∇ᴾ transport stops at the cut/origin instead of continuing (it is defined only on $\mathcal{V}$); start vector labelled "start" ("λ₀" renders like "λo" in SVG);
  view fixed by the initial curve (presets switching curve may need `view`); exact transport (constant components mapped by the Jacobian), no ODE solver.
- Conventions fixed here: $\mathcal{Z}$, $z^k$, $v_\gamma$, $a_\gamma$, $\delta_{r_0}$, $\gamma_{x_0}$; "autoparallel" ($a_\gamma=\text{ᚱ}v_\gamma$) vs "autoparallelly transported" ($a_\gamma=0$).

### 2026-10-20 — ch05-challenge part 2 (problems 4–5, wrap-up)
- `content/ch05/challenge.yaml` now 38 cards: Problem 4 (closed vs exact: $\mathsf{B}$, recipe, endpoint integral, $\mathsf{A}+dg$, half-plane order card,
  patches trap), Problem 5 (Minkowski boost: inverse Jacobian, $(\eta_\mathcal{V})_{11}$, $(\eta_\mathcal{V})_{12}$, general $v$, chart trap, $\eta(\mathcal{W},\mathcal{W})$, timelike names), wrap-up with the level's laws. Chapter 5 complete.
- Choices: 2D spacetime with points $(t,a)$ (matches the plane's $(a,b)$); Lorentz factor renamed $\kappa$ (C.5 later uses $\nabla^\kappa$, a different object, local to that example).
- Conventions fixed here: Lorentz factor $\kappa$, $\eta$ components $(\eta_\mathcal{U})_{ij}$, timelike/spacelike/lightlike by sign with $\mathrm{diag}(-1,1)$.

### 2026-10-20 — ch05-differentials (guided)
- `content/ch05/differentials.yaml`, 28 cards: hook (potential for a force), predict, `curve-velocity` θ widget, three scales
  (point, closed/Poincaré, loop integral $2\pi$), chart-independence of (S), traps on closed vs exact, names (1-form, de Rham), summary.
- Choices: angle field named $\mathsf{A}$; polar cut on the positive axis to match the widget's $\theta\in(0,2\pi)$.
- Conventions fixed here: closed (S) with `\tag{S}`, $\mathsf{Z}$, $\mathsf{A}$, $\dot\gamma(\lambda)$, $\int_\gamma\mathsf{X}$ by one-variable calculus, $\bar{\mathtt{x}}_i$.

### 2026-10-19 — fix: labels vs powers
- `ch02-axioms`: new cards `labels-not-powers` + `power-or-label` before the quadrant question; polynomial card contrasts label `p^1` with power `x^N`. One-line notes added to the hooks of `ch02-dual` and `ch02-basis`.
- Audit: ch03 uses lower indices (`q_1`); ch04/ch05 already explain labels (tangent-space, einstein).
- Conventions fixed here: raised index on vector entries is a label; parentheses mark a power, `(x^2)^2`.

### 2026-10-19 — engine: content-map edge labels
- Map edges take an optional `label` (inline Markdown, 1–3 words), drawn at the arrow's midpoint
  (js/cards.js mapDiagram, css .cedge-label; built/live/pending states like the arrow). Any label
  widens the map's row gap to 36px. validate.mjs: label must be a string, warns past 18 chars.
- `ch04-map` now labels all 14 arrows; the intro's four-readings legend is replaced by one line.
- Conventions fixed here: map arrow labels read "from *label* to", 1–3 words, only between rows.

### 2026-10-19 — ch02-map and ch03-map arrow labels
- All 11 (ch02) and 19 (ch03) arrows labelled; intros now say to read each arrow as a sentence.
- Boxes moved down a row where arrows ran side by side (ch02: dual basis, laws, tensors; ch03:
  separation through diffeomorphism), so every arrow crosses a row gap. Build order unchanged.
- Conventions fixed here: labels of arrows leaving the same box are kept short so they don't touch.

### 2026-10-19 — `ch04-challenge` session 2 (problems 4–5 + wrap-up); Chapter 4 complete
- Appended 11 cards: p4-setup, p4-proof (order), p4-A, p4-S, p4-why, p5-setup, p5-X (build),
  p5-Y, p5-feed, p5-trace, wrap-up (teaser: Level 5, vector fields as smooth choices of $v_p$).
- Choices: p5-Y asks one entry $(T_\mathcal{V})^2_1 = 3e$ by the law; a separate p5-feed card gets
  $(T_\mathcal{V})^1_2 = 1/e$ by feeding basis elements (plan's "both ways" split into two cards).
  p4-why says same-height sums need a metric (Level 7). Did not reread the book: all numbers come
  from STATUS conventions, re-verified by hand ($JT_\mathcal{U}J^{-1}$, $M^{\mathsf T}M$, $A_\mathcal{V}$).
- validate 0/0; shots 36 cards, 0 problems.
- Conventions fixed here: trace $(T_\mathcal{U})^i_i$ vs explicit $\sum_i(S_\mathcal{U})_{ii}$; $T_\mathcal{V} = JT_\mathcal{U}J^{-1}$,
  $S_\mathcal{V} = M^{\mathsf T}S_\mathcal{U}M$; $T = v\otimes(df)_p$, $(T_\mathcal{U})^i_j = x^i_p\mathtt{x}^p_j$, trace $= (df)_p(v) = 4$.

Level challenge `ch04-challenge`, session 1 (25 cards): intro listing all five problems; P1 polar chart at
$(1,1)$ (basis, Jacobian entry $-1/2$, $v^r = 3/\sqrt2$, $v^\theta = 1/2$, $(df)_p$ by feeding and by $F = f\circ\mathscr{P}^{-1}$,
pairing $4$); P2 reparametrization $\text{ᚱ}$ (order proof, $-4$, pause curve, zero vector, Leibniz build, constants
order card, consequences); P3 $S^1$ $\theta$ vs $\sigma$ (Jacobian $2$ two ways, stretch, $v^\sigma = 6$, $(d\theta)_p = \tfrac12(d\sigma)_p$,
height covector two ways, pairing, why). Choices: point $\theta_p = \pi/6$ for clean numbers; Leibniz rule derived in P2
since no lesson had stated it; file ends after P3 (no wrap-up yet).
Conventions fixed here: see Current, "Challenge ch04".

Content map `ch04-map` (13 boxes, 15 cards): curves, scalar fields → velocity → $T_p\mathcal{M}$; chart +
$T_p\mathcal{M}$ → chart-induced basis → components and Jacobian (ᛞ); running example dashed to basis and Jacobian;
$T_p\mathcal{M}$ → $T_p^*\mathcal{M}$ → $(df)_p$ → dual basis; both laws → Einstein summation → $T_p^{(r,s)}\mathcal{M}$. Decoys on the
traps (image vs map curve, ambient arrow, one test field, curve sum, curves as vectors, whole-chart vs one-function,
inverse/row laws, $3e$ product rule, transposed Jacobian, same-height sum, $\delta^i_i$, gradient arrow, infinitesimal,
$(r+s)d$, all-$\partial\mathscr{Y}/\partial\mathscr{X}$ law). Choices: no edge labels (engine lacks them; legend in intro);
Einstein built after the dual basis to avoid horizontal edges, which vanish at 390 px.
Conventions fixed here: Map ch04 (`ch04-map`, 13 boxes, 8 rows): no horizontal edges between adjacent boxes (too short to show at 390 px; use diagonals or skip a row); edge readings ("defined from", "basis of", "dual of", "built from") given in the intro legend (the engine has no edge labels); Einstein box placed after both laws (compact form of vector and covector laws), so map cards before it write explicit sums.

Traps round `ch04-traps` (22 cards, 20 questions): velocity as a map, bent curve same velocity,
reparametrization scales ($6$), curve sum on $S^1$ leaves the circle, $\partial/\partial\mathscr{Z}^1$ depends on the
whole chart while $d\mathscr{Z}^1$ does not, mixed pairing (build + C.3 number $2$), meters/cm, Jacobian entry
$e/2$ with the rune, well-formed Einstein equations, $\delta\delta\delta = 3$, covector not an arrow ($(4,-1)$ vs
$(1,-1)$), $(df)_p$ linear, numbers vs objects, type $(1,2)$, $256$ components, $(1,1)$ law ($e$), swapped
product ($0$), zero in all charts. Choice: the brief's "$(dX^1)_p$ depends on the whole chart" is false
($d$ of a function depends only on the function), so the card teaches the asymmetry instead.
Conventions fixed here: see Current, "Traps (`ch04-traps`)".

Concept lesson `ch04-tensor-space` (31 cards): hook = metric counts $d^2 = 16$, definition of
$T_p^{(r,s)}\mathcal{M}$, special cases, `machine-playground` with $(df)_p\otimes(df)_p$ in $\mathscr{X}$-components,
products, (0,2) and (1,1) expansions (build), independence proof (order), law by feeding and by
re-expanding, running-example check ($1/e$, $1/e^2$), $\delta$ invariant, traps (Jacobian count, same
matrix different tensor, slot order, slogan). Conventions fixed here: see Current, "Tensor space".

Fixes after review: Jacobian rune $\text{ᛞ}$ introduced in `ch04-coordinate-basis` (definition,
inverse identity, summary), runic webfont added; `chart-basis` widget gains `jacobian: false`
(used on the first two widget cards so the Jacobian numbers no longer appear before they are
asked); numeric `wrong` values now match within 0.5% (engine, documented); `ch04-cotangent-basis`
derives the covector component law by both routes (prediction MCQ moved before them, new text +
build card); every mention of "the book" and of C.3/B.3 removed from lessons. Conventions fixed
here: rune $\text{ᛞ}_{\mathcal{V}\mathcal{U}}$ for $(\partial\mathscr{Y}/\partial\mathscr{X})_p$; lessons never cite the book.

Concept lesson `ch04-cotangent-basis` (35 cards): hook (a chart gives $d$ fields $\mathscr{X}^i$),
predict $(d\mathscr{X}^i)_p((\partial/\partial\mathscr{X}^j)_p)$, compute via projection MCQ, dual cobasis recall,
read-a-component numeric, `chart-basis` with `charts: [X]` (presets on the two basis vectors and
the vertical; image checked) + kernel MCQ and which-line trap, B.6 independence ($a_i\delta^i_j$ MCQ),
components + ordered spanning proof, expansion build, $(df)_p$ components with C.3 numerics in
$\mathscr{X}$ and $\mathscr{Y}$, pairing $4$ in both charts, `chart-basis [X, Y]` revisited (readouts =
dual bases on $v$), basis law (from the velocity component law) build + numeric $-e$, component
law + which-Jacobian MCQ + numeric, invariance via inverse identity + MCQ, footnote 7 bump argument
+ MCQ, shorthand, look-alike trap, reverse law numeric, summary, teaser Tensor Spaces. Choices:
no new widget (chart-basis readouts reinterpreted as $(d\mathscr{X}^i)_p(v)$); component law derived by
evaluating on $(\partial/\partial\mathscr{Y}^i)_p$ rather than the book's substitution (book's route mentioned).
Validate and shots clean (0 problems).
Conventions fixed here: $(d\mathscr{X}^i)_p$ pictured as the line where $\mathscr{X}^i$ is constant; coefficients
$a_i$ for covector combinations; $F(a^1,a^2)$, $G(b^1,b^2)$ C.3 representatives; laws in the forms above;
shorthand $(dx^i)_p$, $(dy^i)_p$ usable.

Concept lesson `ch04-cotangent` (23 cards): hook ($v\mapsto v(f)$, temperature observer),
predict linearity for $f = q_1^2+q_2$, `curve-velocity` widget (`chain`, `graph: false`,
`bend: false`, fields $x, y, x^2+y$; presets Sum, Doubled, Level line), numerics sum rate $4$ and
level-line rate $0$, recall dual space (Hom = homomorphism), definition of $T_p^*\mathcal{M}$,
closure MCQ, definition of $(df)_p$, ordered linearity proof (book footnote 6), justification
MCQ, C.3 numerics ($2$, $2$), same-value trap, sum/scalar/Leibniz rules, dimension (dual cobasis
recall, finite-dimensional caveat), dimension MCQ, lower-index card via chain rule
$\partial_if(p)v^i$, index-placement trap, not-an-arrow trap, locality trap, chart-free trap,
summary. Choices: components introduced only as "numbers describing a covector" (no basis);
"every covector is a differential" (book footnote 7) left for the next lesson. Validate and shots
clean (one phone overflow fixed by naming $s := \alpha\odot_Tu\oplus_Tw$); widget image checked.
Conventions fixed here: $\oplus_T^*$, $\odot_T^*$ value by value; $(df)_p$ one symbol; covector
numbers $\mathtt{x}^p_i$; covector drawn as its zero line, not an arrow.

Concept lesson `ch04-einstein` (23 cards): hook (sums written out), predict the summed
index in the basis law, rule card (range $1..d$, denominator = lower, labels not indices,
strict form), up-or-down MCQ, free/dummy card, rename MCQ, free-match trap, count terms
($d^2 = 4$), build basis and component laws, same-height traps (MCQ, plus a numeric showing
$\sum_i(\dot\gamma^i)^2$ is 8 in $\mathscr{X}$ but $1+9e^2$ in $\mathscr{Y}$), three-times trap,
$\delta^i_ja^j$, $\delta^i_i = 4$, `chart-basis` chain widget (preset reused), C.3 numeric $3e$,
inverse identity (text, MCQ, round-trip numeric $-2$), book shorthand table, chart-dependence MCQ,
summary. Choice: included the book's shorthand ($\mathcal{X}_p$, $x^i_p$, $(\partial x_i)_p$) here,
since 4.1.2 introduces it with the convention and no other node covers it. Validate and shots clean.
Conventions fixed here: Einstein summation (strict) from now on; denominator index is lower;
book shorthand $\mathcal{X}_p$, $x^i_p$, $(\partial x_i)_p$, $y^i_p$, $(\partial y_i)_p$ usable.

Guided lesson `ch04-chart-basis` (24 cards, B.5): hook (three claims), predict,
step 1 coordinate curve ($\lambda$ near 0 by openness of $\mathscr{X}(\mathcal{U})$,
smooth via chart representative, build $v_{c_i,p}(f)$), single-chart polar
`basisOnly` widget, $c_\theta$ range ($a = \pi/4$), cut at $(2,0)$; step 2
($\gamma$ stays in $\mathcal{U}$ near $\lambda_0$, build expansion); step 3 (test
fields via bump, order proof), numerics in C.3 ($w(f)=0$, $w(\mathscr{X}^1)=1$,
$w(f)=5$ from $w(\mathscr{X}^j)$), dimension + book footnote (global, atlas),
charts into $\mathbb{R}^2$ and $\mathbb{R}^3$ impossible; traps (circular count, one
field vs all, $\delta$ is not orthonormality). Conventions fixed here: coefficients
$a^i$; bump-function justification for $\mathscr{X}^j$ as test field; C.3 $w$ example.

Concept lesson `ch04-coordinate-basis` (33 cards): hook (C.3 velocity $(2,-2)$
vs $(1,3e)$), `chart-basis` explore (C.3 + cartesian/polar presets), chain rule
split into $\dot\gamma^i_\mathcal{U}$ and $A_i(f)$, definition, evaluations with
$f = q_1^2+q_2$ ($-1$, $v(f) = 4$), coordinate curves + `basisOnly` widget,
$(\partial/\partial\mathscr{Y}^2)_p = (0,1/e)$, tilt of $(\partial/\partial\mathscr{Y}^1)_p$,
$\delta^i_j$ build, Jacobian entry $e/2$, inverse proof + entry $1$, `inverse`,
basis-law order proof + `basisOnly chain`, component-law build, hook resolved
($3e$), `chain` widget, Chapter 2 link, three traps (summed index, Jacobian vs
transition map, $|\partial/\partial\theta| = r$). Basis property stated without
proof (next guided problem). Conventions fixed here: $\dot\gamma^i_\mathcal{U}$,
$\dot\gamma^i_\mathcal{V}$ names; $c_i$ coordinate curves; Jacobian only as
$(\partial\mathscr{Y}^i/\partial\mathscr{X}^j)_p$; $J_i^j = (\partial\mathscr{Y}^j/\partial\mathscr{X}^i)_p$.

Fixes (ch04-tangent-space, chart-basis). Lesson card `chain-explore`: $\theta$
is no longer called a field "smooth near $p$"; the card says $\theta\notin
C^\infty(\mathbb{R}^2)$ and uses an $f$ equal to $\theta$ on a disc around $p$,
switched off before the jump. Widget: $p$ may go anywhere; a polar chart
(`cut: right|left`) draws its cut dotted, and off its domain shows no basis,
no components, no Jacobian, with the reason; lines of one coordinate thin out
(every 2nd, 4th, … line) where closer than 0.14 view units; labels placed by
candidate spots avoiding arrows, the tip of $v$, $p$ and other labels. Tested
with a throwaway lesson (C.3, crowding, on the cut, left cut, near origin, long
$v$), screenshots viewed, then removed. Conventions fixed here: polar `cut`
option; $\theta$ in the plane via a field equal to it near $p$.

Built the `chart-basis` widget (no lesson): coordinate lines of one or two
charts (presets `cartesian`, `polar`, C.3 `X`, `Y`), draggable $p$, purple basis
$(\partial/\partial\mathscr{X}^i)_p$ as columns of $(D\mathscr{X})^{-1}$, draggable
$v$, components per chart, Jacobian $D\mathscr{Y}\,(D\mathscr{X})^{-1}$; options
`chain` (component law in numbers, or basis law with `basisOnly`), `inverse`,
`lines`, `dragP`, chart `name`/`steps` overrides. Tested with a throwaway preset
lesson (C.3, polar on the cut, basis-only, one chart), screenshots viewed,
then removed. C.3 numbers reproduced. Choices: polar keeps $|p|\ge 0.5$, on the
positive $q_1$-axis the readout says $\theta$ is read in $(-\pi,\pi)$; at most 8
lines each side of $p$ (the `Y` lines crowd for large $q_1$). Conventions fixed
here: Jacobian row $i$ = $\mathscr{Y}^i$, column $j$ = $\mathscr{X}^j$; chart letters
$\mathscr{C}$, $\mathscr{P}$; first chart solid, second dashed (see Current).

Built `ch04-velocity-operations` (guided, 23 cards, no widget): hook (is the
sum a velocity?), predict MCQ, C.3 setup with $\mathscr{X}$, $\mathscr{Y}$,
build $\mathscr{X}\circ\gamma_2$, numeric $\mathscr{Y}\circ\gamma_1(1)$ ($e$), construction
with domain remark, why subtract $\mathscr{X}(p)$, build $\sigma_\mathcal{U}$, numeric
$\sigma_\mathcal{V}(1)$ ($1+2/e$), why charts disagree, velocity 2, $f=q_1q_2$ gives 3,
build $\partial_1 f+2\partial_2 f$, general tool (chain rule via $F$), build
component derivative, 7-step order proof, chart-free MCQ, $\odot_T$ by
reparametrization (numeric 6, zero vector = constant curve), two traps, wrap-up.
Choice: next lesson needs a widget (curvilinear coordinate lines + basis at
$p$), so the next unit is the `chart-basis` widget. Conventions fixed here: $F$,
$\mathscr{X}^i$, $\sigma_\mathcal{U}$, $\sigma_\mathcal{V}$, scaling curve (see Current).

Built `ch04-tangent-space` (concept, 26 cards, 3 widgets): hook (velocity on
$S^1$ with no plane; predict $\theta_p+\lambda$ vs $\theta_p+2\lambda$), circle
widget + bend MCQ, recall curves/$C^\infty(\mathcal{M})$, why $f\circ\gamma$ is
differentiable, definition, linearity order card, C.3 numerics (2 and 2) and
"one f is not enough", plane widget (Trap preset), chain-rule build + numerics,
chain widget with θ, coordinate functions read components, $T_p\mathcal{M}$ with
$\oplus_T,\odot_T$, hook resolved as $2\odot_T v$, sum numeric (4), why not
$\gamma_1+\gamma_2$ (tease next lesson), four-velocity + thermometer MCQ, wrap-up.
Choices: f = q₁ on $S^1$ (globally smooth; θ is only a chart); θ in the plane
flagged "smooth near p". Conventions fixed here: velocity, $q=(q_1,q_2)$, $x,y$
coordinate functions, $\gamma^i$, $v^i$, explicit chain-rule sum, C.3 example
(see Current).

Widget `curve-velocity` (for `ch04-tangent-space`): plane or `circle: true`
($S^1$, θ chart); two curves through $p$ at λ = 0, velocity handle (blue tip)
and bend handle at γ(−1) that changes the curve but not the velocity; field
buttons $x, y, x^2+y, \theta$ with level lines; panel of λ ↦ f(γ(λ)) with
tangent lines; readouts per curve (formula, components, $(f\circ\gamma)'(0)$,
optional `chain` line), badge same / equal on this f only / different.
Tested with a throwaway preset (plane, plane+chain+θ, circle), drags checked
in Playwright, preset removed. Choices: curves parametrised so λ₀ = 0 (the book
allows any λ₀); coinciding velocity handles grab γ₂'s.
Conventions fixed here: see "Chapter 4 conventions so far" in Current.

ch03-challenge, proofs for facts flagged "without proof" (Igor's request; lesson
now 44 cards): p2-sphere (S² stereographic transition u/|u|², derived from
|u|² = (1+q₃)/(1−q₃)), p2-sphere-num (σ_N = (1,1) ⇒ σ_S = (½,½); decoy
componentwise 1/u), p2-compatible (σ_N⁻¹ explicit; compatible with half-circle
and angle charts, θ∘σ_N⁻¹ = 2 arctan u − π/2 or + 3π/2). p3-meaning: proved the
one-chart case φ = y⁻¹. Kept flagged as beyond the course: smooth structures on
ℝ with many charts, exotic 7-spheres, Whitney (contrast only).
Conventions fixed here: a fact stays "stated without proof" only when its proof
is far beyond the course; otherwise prove it in the simplest way.

ch03-challenge, session 2 of 2 (problems 4–5, 17 cards; lesson now 41):
(4) line with two origins built by gluing two copies of ℝ along t ≠ 0 (book
footnote 2): chart X_A is a homeomorphism onto ℝ, overlap image ℝ∖{0},
transition t ↦ t, tail of 1/n inside (−0.01, 0.01) from n = 101, multi-select
on limits (±1/n → both origins; constant 0_A does not → 0_B, T1 holds),
proof order, which axiom fails, trap on "charts onto ℝ ⇒ inherited
Hausdorff", T/F: no subset of ℝ² is homeomorphic to it (Whitney stated
without proof). (5) doubling D with θ at the source, φ at the target: domain
drops θ = π/2, 3π/2 (three pieces, shifts 0, −2π, −4π), slope 2 at θ = π
(the point the (θ, θ) pair missed), chart change φ∘D∘φ⁻¹ through transitions
(−π/4 ↦ 7π/4 ↦ 3π/2 ↦ −π/2), two preimages, verdict, reflection R is a
diffeomorphism (rep 2π − θ). Choices: went beyond hausdorff.yaml and
smooth-maps.yaml (mixed chart pair, T1 vs Hausdorff, embedding); also
flagged the S² transition, the σ/angle compatibility and exotic spheres in
problems 2–3 as "stated here without proof". Validate 0/0; shots 0 problems.
Conventions fixed here: two-origin charts (𝒰_A, 𝒳_A), 𝒰_A = ℳ∖{0_B};
doubling D, reflection R(q₁, q₂) = (q₁, −q₂); facts beyond the level are
flagged "stated here without proof".

ch03-challenge, session 1 of 2 (problems 1–3, 24 cards): (1) the graph Γ of
|t| is a smooth manifold (inherited Hausdorff/second countable, chart
forgets the height, one-chart atlas), but its inclusion into ℝ² is not
smooth (difference quotients −1/+1 at 0); (2) stereographic charts from N
and S written in q = (q₁, q₂), σ_S derived from the line through S, overlap
image ℝ∖{0}, σ_Nσ_S = 1 via (1−q₂)(1+q₂) = q₁², transition 1/u, slope −1/9
at u = 3, proof order; (3) ℝ_x vs ℝ_y: construct φ = ∛p from y∘φ = x, build
the representative of φ⁻¹, id is smooth one way only (slope 3 at a = 1),
smooth functions on ℝ_y are h(p³), meaning of "different structure".
Choices: stereographic was already taught in ch03-charts (as x/(1−y)), so it
is recalled, not introduced; no widget (problems are computational).
Conventions fixed here: see the Challenge ch03 line in Current.

Chapter 2 built: maps, axioms, dual space, bases and dual basis, change of
basis, covector law, J invertible, dual basis law, transformation traps,
tensors (multilinear maps, components, (0,2)/(1,1) laws, (1,1) = linear
maps), tensor product (simple tensors, area = sum of two products, V⊗W,
product basis, d^(r+s), T^(r,s) ≅ V⊗…⊗V*, rank), the content map (its
tensors box now includes the product-basis expansion), and the level
challenge (`ch02/challenge.yaml`: five problems on one change of basis
ŷ₁ = 2x̂₁ + x̂₂, ŷ₂ = 3x̂₁ + 2x̂₂; vector/covector/dual basis, (0,2) vs (1,1)
laws and trace invariance, symmetric + antisymmetric split, rank of a (1,1)
map, dimension counts and the "one up, one down" invariance rule; it
introduces symmetric/antisymmetric parts and the trace). All Chapter 2 lessons
have had a headless screenshot pass (desktop + phone); all widgets are
documented in `docs/LESSON_FORMAT.md` (machine-playground presets can now
switch the tensor). Short inline math keeps trailing punctuation on its line
(`js/render.js`).

Chapter 3 started: `ch03-open-sets` (powerset, topology rules, finite
topologies, discrete/indiscrete, closed and clopen, 4 topologies on two
points) and `ch03-standard-topology` (balls, standard topology, quantifier
order, ball is open, infinite intersections, inherited topology on [0,2) and
S¹), with the new `ball-probe` widget (line/plane/circle arc, optional
ambient subspace). Then `ch03-homeomorphisms` (preimages, continuity, ε-δ as
a special case, composition, homeomorphisms, the wrap [0,2π) → S¹ is a
continuous bijection but not a homeomorphism; new `preimage-explorer` widget)
and `ch03-hausdorff` (convergence via open sets, indiscrete limits, Hausdorff
with the `ball-probe` `pair: true` mode, unique limits, two-point topologies,
subspaces, line with two origins, basis, rational balls, discrete ℝ and
uncountably many lines not second countable, why physics needs both). All four
had a screenshot pass; all widgets are documented. Next: the remaining Chapter 3
nodes in `course.yaml` order, then Chapters 4–10 (each with its content map
and challenge). Each planned node in `course.yaml` is one lesson to build.

Built and documented the `circle-charts` widget (θ and φ angle charts on S¹,
or `stereo: true` for σ = x/(1−y); overlap pieces, draggable p, transition
graph with the jump). The trail now gives each level a hue (`data-hue` on
`.level`: banner and open nodes; light/dark variants in `css/app.css`) and a
darker light-mode `--muted`.

Built `ch03-charts` (chart (𝒰, 𝒳) with open image, why one chart can't
cover S¹, inclusion of an arc is not a chart, overlap in two pieces,
transition 𝒴∘𝒳⁻¹ = ᛖ, θ ↦ θ − 2π on the lower piece, harmless jump,
topological manifold definition and dimension, line with two origins,
stereographic σ = x/(1−y) and σ∘θ⁻¹ = cos/(1−sin), two traps). Screenshot
pass done.

Built `ch03-atlases` (hook: f(p) = p in charts x and x³ on ℝ; atlas
definition; angle and stereographic transitions revisited in circle-charts;
chart representatives f∘𝒳⁻¹ and the build f∘𝒴⁻¹ = (f∘𝒳⁻¹)∘(𝒳∘𝒴⁻¹);
C^k/C^∞ compatibility, x vs x³ fails one direction; dσ/dθ = 1/(1 − sin θ);
maximal atlas with an order-the-proof card; smooth manifold, two structures on
ℝ; three traps). Screenshot pass done. The due review chip now follows the
level hue with the course title.

Built `ch03-smooth-maps` (hook: are ℝ_x and ℝ_y the same smooth manifold?;
circle doubling map D in the θ chart via circle-charts, representative 2θ /
2θ − 2π, slope 2; smooth map via Φ = 𝒴∘φ∘𝒳⁻¹, why continuity, build of chart
independence; smooth functions and curves; id: ℝ_y → ℝ_x not smooth, F = p³
is a diffeomorphism ℝ_y → ℝ_x; p³ on standard ℝ is not; hierarchy; exotic ℝ⁴,
S⁷; two traps). Screenshot pass done.

Built `ch03-circle` (guided; book C.2 atlas of four half-circle projection
charts, not the θ/φ atlas: hook "is q ↦ q₁ a chart on all of S¹?"; circle-charts
`show: A` used only for the readout p = (q₁, q₂) to see which halves contain p;
steps topology (∩, build for ∪), Hausdorff (radius ½|p − q|), second countable
(rational discs ∩ S¹), homeomorphism (injectivity via sign of √), cover, overlaps
and transitions (0.6 ↦ 0.8, build −√(1−α²), domain (0,1)), smoothness (endpoint
trap, slope −0.75, order proof), angle chart θ compatible via cos/arccos). The
book's C.2 text stops after the first overlap; the remaining transitions were
completed here. Conventions fixed here: q = (q₁, q₂), \mathscr{X}_↑↓→← with
coordinate α, transitions ±√(1 − s²); S¹ (not 𝒮¹).

Built `ch03-traps` (traps, 14 cards, 12 questions, no widget): open-where
(multi-select: arc open in S¹ not ℝ², [0,1) open in [0,2π) not ℝ, {0}), not
open ⇏ closed, ⋃[1/n,1] = (0,1] not closed, continuous ⇏ open images,
(−1,1) ≅ ℝ via tan(πa/2), subsets of ℝ^d inherit Hausdorff + second countable,
locally ℝ ⇏ Hausdorff (two origins, restated), θ extended to [0,2π) not a chart,
minimum 2 charts on S¹ (numeric), disjoint domains compatible for free, one
failed map ≠ non-diffeomorphic (∛p: ℝ_x → ℝ_y), implications multi-select
(homeomorphism ⇏ smooth via ∛p). The planner's items already covered by
earlier Trap cards (continuous bijection, one-direction, smooth bijection,
different structures, closed-interval image) were replaced by variants.
Also fixed QUICKREF: shots.mjs takes the path relative to content/.
Conventions fixed here: traps lessons carry no `tag: Trap`; line with two
origins written $0_A, 0_B$.

Built `ch03-map` (content map, 15 boxes, 2 decoys each, 17 cards): topology
(decoys: ∩/∪ rules swapped, closed = not open) → standard, inherited,
continuity → homeomorphism; Hausdorff + second countable (dashed from ℝ^d:
the book defines them for any space; a solid edge from the full-width top box
would graze row 2); chart → atlas, transitions → topological manifold;
compatibility → smooth atlas + maximal atlas (one box: the book has no maximal
atlas, the lesson `ch03-atlases` does) → smooth manifold → smooth maps →
diffeomorphism. Decoys: one radius for all points, open sets inside N, images
instead of preimages, T1 instead of Hausdorff, locally Euclidean ⇒ both, chart
on all of M, continuous bijection chart, images cover ℝ^d, disjoint domains,
continuous / one-sided compatibility, all charts = maximal atlas, unique smooth
structure, f∘𝒳, chart independence on topological manifolds, smooth bijection,
homeomorphism ⇒ diffeo. TeX map's "Next: Chapter 4" aside moved to the outro.
shots.mjs now expands map lessons via js/content.js `expandLesson` and
screenshots `mapview` cards (2 lines changed); phone map viewed: fine after
soft-hyphenating Homeomorphism/Diffeomorphism.
Conventions fixed here: map dashed edge = "model example for"; soft hyphen in
long box titles.

### 2026-10-19 — ch05-vector-fields (concept)
- 29 cards: wind-map hook, predict ($v-w$ undefined), recall, `chart-basis` swirl widget (cartesian +
  polar cut left, presets at 4 points + origin), $T\mathcal{M}$ and why disjoint (zero maps collide), bundle
  charts and $\dim = 2d$, sections, smooth iff smooth components, $|b|\,\partial x_1$, chart independence,
  egg-carton fields $\mathcal{X}$, $\mathcal{Y}$ with law checks, action $\mathcal{X}\lfloor f\rceil$, two traps, summary.
- Choices: bundle charts and the topology included (stated without proof) so "smooth section" has a meaning;
  frames, parallelizability, hairy ball and $\oplus_\Gamma$ left for `ch05-module`; component functions written $X^i$,
  $Y^i$, $\tilde X^i$, $\tilde Y^i$ in the running example, $x^i$, $y^i$ in general.
- Conventions fixed here: see Current, "Chapter 5 conventions so far".

### 2026-10-19 — ch05-covector-fields (concept)
- 25 cards: contour-map hook, predict (is every field a $df$?), recall, `curve-velocity` widget ($x^2+y$ level
  lines as the whole field $df$, $\theta$ rays), kernel MCQ, $T^*\mathcal{M}$ and bundle charts, fibre transition MCQ
  (introduces $\text{ᛞ}_{\mathcal{U}\mathcal{V}}$), $\dim = 8$ for spacetime, sections and exactness, component functions, five-fonts MCQ,
  $df$ components and egg carton, field law (build), polar $\mathtt{Y}_2 = \pi$, action $\mathsf{X}\lceil\mathcal{X}\rfloor$, order proof of
  $df\lceil\mathcal{X}\rfloor = \mathcal{X}\lfloor f\rceil$, pairing $=1$ in polar, $C^\infty$-linearity vs Leibniz, arrow trap, non-exact $-b\,dx^1+a\,dx^2$, resolve, summary.
- Choices: the book's brackets $\mathsf{X}\lceil\mathcal{X}\rfloor$ (the unit prompt wrote $\lfloor\ \rceil$); non-exact example given fully by mixed
  partials (elementary), leaving closed-not-exact ($d\theta$ on the punctured plane) for the guided problem; $\oplus_\Gamma$, frames left for `ch05-module`.
- Conventions fixed here: see Current, "Covector fields (`ch05-covector-fields`)".

### 2026-10-19 — ch05-module (concept)
- 27 cards: hook (normalise the swirl by $1/r$), `chart-basis` widget (swirl vs unit arrows, one chart), predict-unit, predict-basis,
  ring and field definitions, invertible functions (multi-select), zero divisors and cancellation, $\oplus_\Gamma$/$\odot_\Gamma$/$\oplus^*_\Gamma$/$\odot^*_\Gamma$,
  module axioms, axiom check (M3), independence/spanning over a ring ($\mathbb{Z}$), $t\,\partial x_1$ on $\mathbb{R}$, egg-carton pair, order proof
  (basis ⇒ pointwise basis), frames and dual frames, polar frame off the origin, parallelizable + hairy ball, $S^1$ frame, $S^2$ no basis,
  egg-carton operations (two numerics), real vs $C^\infty$ dimension trap, resolve, summary with teaser for tensor fields.
- Choices: egg-carton $\mathcal{X},\mathcal{Y}$ used as the field-level "independent but not spanning" example (the TeX used $t\,\partial_t$ on $\mathbb{R}$; both
  included); unit-radial problem replaced by the unit swirl (same obstruction); polar frame extended past its chart to illustrate "frame ≠ chart"
  (the book's non-chart frame example is in a later appendix section, not used).
- Conventions fixed here: see Current, "Module (`ch05-module`)".
- 2026-10-19 `ch05-tensor-fields` (concept, 25 cards): hook (which maps let functions pull out; Leibniz fails), definition, $(0,1)$ count,
  `machine-playground` at three egg-carton points, pointwise principle (order card, bump proof), non-tensor $D$, $\mathbb{R}$- vs $C^\infty$-linearity,
  components and expansion, $T_{12}$ by hand, $(0,2)$ law build, $(1,1)$ law, polar $(T_\mathcal{V})_{22} = \pi^2$, notation roles, three traps, resolve, summary.
- Choices: no new widget (machine shows one point, presets switch point); the converse "(1,0) fields = vector fields" stated, not proved;
  Euclidean $\mathrm{diag}(1,r^2)$ used as a trap (from the TeX); Minkowski boost left for the challenge.
- Conventions fixed here: see Current, "Tensor fields (`ch05-tensor-fields`)".
- 2026-10-20 `ch05-traps` (traps, 24 cards: intro, 22 questions, summary): field vs chart vs component, zero vectors in the disjoint union,
  $\dim TS^2$, sections, $b|b|$ kink, $\partial y_1$ at the origin, vector law build, vector vs covector polar components at $(3,4)$,
  acting twice, mixed-chart pairing, zero divisors, independent-not-spanning, global frames, Leibniz value, which slot is $C^\infty$-linear,
  pointwise principle, pointwise-not-tensor $(z^1)^2$, closed coefficient, $g\,df$, angle field exact on a half-plane.
- Choices: fresh examples rather than repeats of the in-lesson traps; no widget; contractible named "disc-like" (Poincaré lemma recalled, not reproved).
- Conventions fixed here: see Current, "Traps (`ch05-traps`)".
- 2026-10-20 `ch05-map` (map, 14 boxes, 16 cards): recall boxes $T_p\mathcal{M}$, $T_p^*\mathcal{M}$; general bundle and sections;
  $T\mathcal{M}$, $T^*\mathcal{M}$ ($2d$); vector and covector fields with laws; actions ($df\lceil\mathcal{X}\rfloor = \mathcal{X}\lfloor f\rceil$, Leibniz);
  ring (zero divisors); modules (independent ≠ spanning); frames (hairy ball); tensor fields ($C^\infty$-linear ⇒ pointwise); closed/exact; angle field.
  Decoys from the traps: $T\mathcal{M}$ as a vector space, $\dim d$, $\sigma\circ\pi$, $\mathbb{R}$-linear suffices, pointwise suffices, closed ⇒ exact,
  pointwise-$df$ exactness, global frames, ring as a field.
- Choices: no separate manifold box (recalled inside the $T_p\mathcal{M}$ box); ring placed beside actions as a source box so "scalars of"
  reaches modules without crossing; "test for" reading replaced by "which are $df$?"; title "Closed and exact" (no soft hyphen needed).
- Conventions fixed here: see Current, "Map ch05 (`ch05-map`)".
- 2026-10-20 `ch05-challenge` part 1 (22 cards): intro listing five problems; P1 rotation field (smoothness, build $y^2$, $\mathcal{R}$ vs $\mathsf{Z}$
  in polar, invariant functions, $\mathcal{R}\lfloor a^2-b^2\rceil$ two ways, $(\mathsf{A}+\mathsf{Z})\lceil\mathcal{R}\rfloor$); P2 unit radial field ($\pm1/r$, polar $(1,0)$,
  dual coframe $\{dr,\mathsf{A}\}$, coefficient of $\mathcal{R}$ in $\partial x_2$, impossibility through the origin, frames/hairy ball); P3 ring (closure via charts,
  invertibility depends on the manifold, order proof $\psi(t)\psi(-t) = 0$, zero-divisor criterion, distributivity axiom by acting, fields killed by $\psi(-t)$).
- Choices: registered in `course.yaml` now with a summary covering all five problems; no wrap-up yet (validate accepts); repeats of
  ch05-module (unit swirl, $t\,\partial x_1$ alone, $(fg)\mathcal{X}$ axiom) avoided by switching to sign freedom, coframe and $\psi$-killed fields; no widget.
- Conventions fixed here: see Current, "Challenge ch05 (`ch05-challenge`, part 1)".
- 2026-10-20 `ch06-connections` (concept, 28 cards): hook "is $\partial x_1$ constant?" (polar components, recall $D(\mathcal{Z})$); widget `chart-basis`
  cartesian + polar `cut: left` with $v = \partial x_1$ at four presets; naive polar derivative ($-1$), extra second-derivative term, affine-only MCQ;
  why-not-subtract; definition and Rules 1–5 one card each with a question (value 9, zero field, term count 6, Rule-4 numeric, $C^\infty$ in direction);
  product-rule build (derivation in explanation), tensorial-slot multi-select, covector build; affine manifold with $\nabla^{\mathrm{E}}$ and $\nabla^{\mathrm{P}}$, swirl numerics,
  $\nabla^{\mathrm{E}}df$, hook resolved, "word on words" (B.9), summary with rules as formulas, teaser $(\Gamma_\mathscr{X})^i_{jk}$.
- Choices: followed the book's pointwise definition (not field-level axioms); generic field named $\mathcal{Y}$ (book) rather than $\mathcal{Z}$; invented
  $\nabla^{\mathrm{P}}$ to show that each chart's naive rule is a different connection; plain plane instead of the egg carton; no autoparallels or $\Gamma$ yet.
- Conventions fixed here: see Current, "Chapter 6 conventions so far".
- 2026-10-20 `ch06-christoffel` (concept, 28 cards): hook "how many numbers fix a connection?" (four guesses); widget `chart-basis` polar+cartesian
  basisOnly/chain at five presets; which-basis-changes multi-select; locality + chart expansion, product-rule build; definition (book order), index-order MCQ,
  component build, count ($4^3 = 64$), any-choice sketch, invented connection numeric; covector setup + build (both derivations); valence-sign MCQ; $\nabla^{\mathrm{E}}$
  polar coefficients directly ($-5$ at $(3,4)$, $\tfrac1r\partial y_2$ MCQ); transformation law in three cards (setup, origin MCQ, law) + numeric via law ($0.2$);
  tensor-or-not multi-select (difference, antisymmetric part); normal coordinates text; C.5.2 check in polar ($-0.6$); traps (zero here/zero everywhere,
  $\nabla^{\mathrm{P}}$ in cartesian $-1$, zero in both charts); summary with formulas.
- Choices: added normal coordinates (in the book's 6.2) as one text card; used the "Christoffel symbols" name only as an aside; renamed the book's
  summation index $p$ to $m$; widget charts listed polar first so `chain` expands the polar basis in the cartesian one.
- Conventions fixed here: see Current, "Chapter 6 conventions so far" (`ch06-christoffel` lines).
- 2026-10-20 **Recap engine** (engine session): optional `own:` on concept lessons, Markdown with `{{ }}` blanks; the last text card renders
  it (markers stripped) followed by its body (teaser). `js/recap.js`: `#/recap` (due summaries, all levels) and `#/recap/<levelId>` (due first,
  then practice), at most 5 summaries per session; tap or "Reveal next", then "Knew it" / "Missed"; missed blanks requeued once at the end.
  Items `progress.recap["<lessonId>#<hash>"] = { box, due, at, lapses, last }` on the quiz deck's Leitner boxes (knew +1 box, missed → box 0,
  due today), merged/synced like `cards`. Trail chip "Recap N" (due blanks; loads finished concept lessons' files asynchronously), Recap button
  in level-review sheets. Validator: balanced/unnested markers, ≥ 2 distinct blanks (warn outside 3–6), last card text. `shots.mjs` runs on
  Windows (Chrome/Edge, file-URL import). Tested with a throwaway lesson (removed): first view, rating, rescheduling, requeue, hash stability
  after editing outside the blanks, phone and desktop, light and dark.
- Choices: reused the Leitner boxes (no ease factor); only finished lessons are recapped; first view hides a random half, later passes hide
  exactly the due blanks (cap: one left showing when ≥ 3); a repeated expression is one item; markers are ignored inside math.
- Conventions fixed here: `own:` + `{{ }}` marking rules (`docs/QUICKREF.md`); the closing card's `body` is only the teaser once `own:` exists.
### 2026-10-20 — own: backfill, Chapter 6 (connections, christoffel, parallel-transport, torsion-curvature)
- Summary moved into `own:` (wording unchanged, blanks added); card keeps id, title and the "**Next:**" teaser. Guided lessons (`three-connections`,
  `torsion-tensor`) skipped. Blanks: connections 6, christoffel 5, parallel-transport 6, torsion-curvature 6. Backfill now complete (Chapters 2-6).
- Conventions fixed here: whole displayed laws (rule blocks, Leibniz, transformation law, Riemann components) are blanked as one `{{ $$…$$ }}` line;
  of two equivalent forms (transport equation vs covariant derivative along a curve) only one is marked; definitions with a symbol (`a_\gamma := …`,
  parallel/autoparallel conditions) blank the formula and keep the term.

### 2026-10-21 — intuition lesson `ch05-intuition-lie` (18 cards)

Self-contained (book has no Lie derivative section; defines L_X f = X⌊f⌉, L_X Y = [X,Y], covector via Leibniz, derived by an order card). Build cards: commutator, covector, (1,1), (0,2); numerics give data only (1D X = x², Y = x∂_x, A = x dx at x=3 give −9, 27; shear X = y∂_1, A = dx; (1,1) → 54; g = δ → 8). Doubt: the task said "+ per upper, − per lower like Γ", but the true Lie-derivative signs are the reverse (− upper, + lower); taught the true ones and contrasted with Γ. Conventions fixed here: ∂_i acts on component functions; covector A with components a_k; −upper/+lower with the derivative index at the top of x (upper) or on ∂ (lower).

### 2026-10-21 — intuition lesson `ch08-intuition-metric` (19 cards)

Index placement of ♭ and ♭⁻¹ with the book's component names, matrix inverse of g, scaling test g → λ²g (incl. √|det g| ~ λ^d), density law between charts, area-cell sheared widget, null vector in diag(1,−1,−1,−1). Numeric cards give data, not the law. All numbers hand-checked (g = [[4,2],[2,2]], det 4, g⁻¹ = ¼[[2,−2],[−2,4]]). Conventions fixed here: lowering uses g (sum index adjacent), raising uses g⁻¹; ᛞ_UV = ∂X/∂Y with √|det g_Y| = |det ᛞ_UV|√|det g_X|; scaling factors λ², λ⁻², λ^d.

### ch10-lorentz (2026-10-21)
Concept lesson, 24 cards, reuses `observer-frame`. Hook: guess the 2×2 dictionary H→T at u=0.6; η-condition as an order card; boosts and composition; frames vs coordinates; orientation.
Conventions fixed here: Λ^b_a := ε^b(ẽ_a) (old dual covector on new vector); column a = components of ẽ_a; O↑(1,3) := {Λ∈O(1,3) | Λ^0_0 ≥ 1}.
