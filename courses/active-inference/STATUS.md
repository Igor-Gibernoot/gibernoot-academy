# Status

Session start: read only **Current** (`sed -n '/^## Current/,/^## Log/p' courses/active-inference/STATUS.md`).
Session end: update Current in place (keep it under ~40 lines: replace, don't append) and add a
3-line Log entry at the top of the Log, ending "Conventions fixed here: ..."; copy those conventions
into the chapter's section of `CONVENTIONS.md`, not into Current.

## Current (2026-10-24)

- **State:** Level 1 fully built: `ch01-persist` (15, homeostat card 4), `ch01-guessing` (11), `ch01-acting` (11), `ch01-map`, `ch01-challenge`. Source 1.1-1.3 verified; 1.4.1 prose only.
- **Next unit:** `ch02-perception-inference` (Level 2). Level 1 sign of G is already the book's (mismatch minus information gained, lower is better); see CONVENTIONS Chapter 1.
- **Conventions:** `CONVENTIONS.md`, one section per chapter.
- **Paths:** lessons `courses/active-inference/chNN/`, sources git-ignored.

## Log
- 2026-10-24 ch01-persist fix: homeostat reduced-mode card after the guess card (guess first, widget tests it; 15 cards); room now cold (22 C) in hook and guess; widget drift 0.04 (0.08 left 'Keep acting' at ~35.6, outside the band); headless: 'Do nothing' ends outside, 'Keep acting' inside (~36.3); roadmap table uses level/lesson titles; ASCII loop diagram fine at phone width. No new source formulas. Conventions fixed here: persist demo room 22, drift 0.04, actRate 0.8.

- 2026-10-24 ch01-challenge problems 4-5 built (25 cards total): p4 surprise ranking 37/35/41/28 (errors 0,2,-4,9; distance outside band 0,1,3,8), traps big-error and low-surprise-still-acts; p5 rustle 31/31/38%, policies flee 5 vs look closer 6, sharp senses (0.05,0.05,0.9 -> fox 82%) flips to flee. Validate and shots clean. Conventions fixed here: see CONVENTIONS ch01-challenge.
- 2026-10-24 widget `homeostat` built (scale with safe band/body/expectation/room markers, mismatch bar, in-band flag, belief/act/wait levers, scripted presets); validate, widget-smoke, shots at phone and desktop clean. Throwaway preset removed. Conventions fixed here: body blue, expectation orange, room purple, safe band green; defaults drift 0.08, actRate 0.8 (act alone settles at ~35.3 for room 20, expect 37, so for band 36-38 use room 28, drift 0.05).
- 2026-10-24 ch01-guessing built (concept, 11 cards: welcome, hook, belief-mixer, why-different mcq, words gloss, numeric toy 69%, 2 traps, predictive machine, lever mcq, summary). Validate and shots clean; mixer card viewed at phone width. Summary uses "belief proportional to prior x evidence" in words (own wording, not a book equation; book's Bayes' rule is Ch. 2, unverified). Notation check of CLAUDE.md: see CONVENTIONS. Conventions fixed here: causes cat/dog/fox; prior, evidence (= likelihood later), hidden cause, belief glossed; toy numbers 0.9/0.1 and 0.2/0.8 give 69/31.
- 2026-10-24 widget `belief-mixer` built (HTML sliders for prior and evidence, belief bars, noisy/sharp switch, presets, optional evidence markers); validate and widget-smoke clean, screenshots checked at phone and desktop. Conventions fixed here: causes coloured blue, orange, purple in the order given; noisy senses flatten evidence by power 0.3.
- 2026-10-24 ch01-persist built (concept, 14 cards: welcome, hook, drift prediction, persist=small set of states, loop + order, two ways to cut a mismatch, which lever, neats/scruffies, surprise gloss, 2 traps, roadmap table, summary). No widget existed for a state-drift demo; used mcq/order instead (choice made autonomously). Conventions fixed here: running example creature 36-38 C and fish; surprise glossed as distance from intact-keeping sensations; degrees as `{}^\circ`.
2026-10-24 · Course set up: folder, trail, CLAUDE.md, catalog entry; book converted to Markdown.
Conventions fixed here: none yet.
- 2026-10-24 ch01-acting: 11 cards. Hook cold creature, homeostat (presets Update belief only / Act), prediction error, set-point, one-step numeric (gap 1.8 after heater 80% + room 5%), policy, S-R trap, curiosity, explore/exploit trap. Source 1.4.1 goal/planning bullets (prose). Conventions fixed here: act settles near 36.4 C, belief-only drifts to ~29.5; prediction error = expected - sensed (words); expected free energy named, not formalised.
- 2026-10-24 ch01-map: 10 boxes (loop, surprise, prior, evidence, prediction error, belief, action lever, perception lever, policy, exploring/exploiting), 2 decoys each (incl. stimulus-response, belief = evidence only, explore-or-exploit switch). "Generative model" was never glossed in the three lessons, so its box became separate prior and evidence boxes; the term is left for Level 2. Display math in map cards needs blank lines around `$$` and `aligned` for the error formula (phone width). Conventions fixed here: map box set above; generative model not used in Level 1.
- 2026-10-24 ch01-challenge p1-3: fish/warm water (error -8, order loop), splash in the dark (42%, flatten reverses to 53%), cold creature policy scores (7 vs 6, then 6 vs 4). Summary is a plain text card (own: is not allowed in challenges). Conventions fixed here: see Chapter 1.
- 2026-10-24 widget `homeostat` extended (unit: persist demo): new options `showBelief: false` (hides expectation marker, readout, mismatch bar, slider; `expect` is a hidden set-point) and `levers: [...]` (buttons and order; unlabelled wait = "Wait"). Defaults unchanged. Tested with a throwaway preset (shots viewed at phone width), documented in LESSON_FORMAT. Conventions fixed here: none.

### 2026-10-24 sign fix
Expected free energy in Level 1 (acting, map, challenge p3/p5 and summary) rebuilt as G = mismatch - information gained, lower is better (was sign-flipped, bigger better). New numbers: p3 (mismatch, info) rock (2,0), look (4,3), stay (7,0) -> scores 2/1/7, answer 1; day two look (4,0) -> 4, rock wins; p5 flee (3,0), look closer (5,3) -> 3/2, answer 2; sharp belief: look closer ~5 > 3. Source prose checked (sources/VERIFIED.md), no formula used. Conventions fixed here: sign of G; words mismatch / information gained.
