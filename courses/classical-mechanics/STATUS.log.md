# Status log

## 2026-11-20 widget newton-cannon
Built `js/widgets/newton-cannon.js` (+ `docs/widgets/newton-cannon.md`, README line, registry line). RK4, GM = R = 1; presets in the doc's smoke block: short-throw, skim-ground, orbit-ellipse, escape, same-start-two-speeds. Choices: outcome and range appear only after the run ends (so a card can ask for a prediction); period shown for orbit only (a bound ball that hits the ground shows nothing); escape judged by energy at the tower top (for h > 0 the threshold is sqrt(2/(1+h)), slightly below sqrt2 vc); preset buttons fire at once; slider moves reset to idle; angle range 0 to 60 deg upward; Moon strip is a separate to-scale inset, acceleration from a simulated RK4 circular orbit.
Conventions fixed here: speeds in units of the surface circular speed vc, lengths in R, time in sqrt(R^3/GM), g = 1.

Newest first. Never read this file in a session.

## 2026-11-20 sources and Level 18
Added Level 18 "From Particles to Fields" (6 teaching lessons); exam-final now covers 13-18. Lemos is the English Cambridge 2018 translation (text layer, offset +15); a Portuguese scan was replaced. Goldstein OCRed with tesseract (offset +9, contents confirmed); Taylor OCRed later the same day: no single offset (scan duplicates book pp. 458-459 and 597-598, misses 718-719), so taylor.md and goldstein.md carry per-page markers. Level 12 kept as one level (6 teaching lessons, fewer than Level 10). Conventions fixed here: Lemos writes the Poisson bracket {F,G} (8.4); bracket style still decided at Level 15.

## 2026-11-20 course setup
Created the course: `course.yaml` (17 levels, 3 exams, overview and sources), `CLAUDE.md` (two-source spine Taylor + Goldstein, Lemos for Noether, level-to-section map from memory, notation rule), status files, catalog entry (hue 5), sprite `newton` and banner `orbits` in `js/pixel.js`. TOCs partly confirmed by web search (Goldstein chapters 1-6 and 12, Taylor 16 chapters); the rest waits for the PDFs.
Conventions fixed here: one notation for the whole course, Goldstein's symbol wins where the books differ ($L$, $H$, $V$, $q_j$, $p_j$; to confirm against the sources); Taylor's where only Taylor has one.
