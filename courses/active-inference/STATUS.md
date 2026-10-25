# Status

Session start: read only **Current** (`sed -n '/^## Current (2026-10-24)

- **State:** Level 1 in progress. Built: persist, guessing, acting, map, `ch01-challenge` problems 1-3 (15 cards, file exists). Source 1.1-1.3 verified; 1.4.1 prose only.
- **Next unit:** `ch01-challenge` problems 4-5 (pending; finish `ch01/challenge.yaml`, replace the closing summary card and the intro list), then Level 1 is done.
- **Conventions:** `CONVENTIONS.md`, one section per chapter.
- **Paths:** lessons `courses/active-inference/chNN/`, sources git-ignored.

## Log/p' courses/active-inference/STATUS.md`).
Session end: update Current in place (keep it under ~40 lines: replace, don't append) and add a
3-line Log entry at the top of the Log, ending "Conventions fixed here: ..."; copy those conventions
into the chapter's section of `CONVENTIONS.md`, not into Current.

## Current (2026-10-24)

- **State:** Level 1 in progress. Built: `ch01-persist` (14), `ch01-guessing` (11, `belief-mixer`), `ch01-acting` (11, `homeostat`). Source 1.1-1.3 verified; 1.4.1 prose only.
- **Next unit:** `ch01-map` (Level 1 content map), then review, challenge.
- **Conventions:** `CONVENTIONS.md`, one section per chapter.
- **Paths:** lessons `courses/active-inference/chNN/`, sources git-ignored.

## Log

- 2026-10-24 widget `homeostat` built (scale with safe band/body/expectation/room markers, mismatch bar, in-band flag, belief/act/wait levers, scripted presets); validate, widget-smoke, shots at phone and desktop clean. Throwaway preset removed. Conventions fixed here: body blue, expectation orange, room purple, safe band green; defaults drift 0.08, actRate 0.8 (act alone settles at ~35.3 for room 20, expect 37, so for band 36-38 use room 28, drift 0.05).
- 2026-10-24 ch01-guessing built (concept, 11 cards: welcome, hook, belief-mixer, why-different mcq, words gloss, numeric toy 69%, 2 traps, predictive machine, lever mcq, summary). Validate and shots clean; mixer card viewed at phone width. Summary uses "belief proportional to prior x evidence" in words (own wording, not a book equation; book's Bayes' rule is Ch. 2, unverified). Notation check of CLAUDE.md: see CONVENTIONS. Conventions fixed here: causes cat/dog/fox; prior, evidence (= likelihood later), hidden cause, belief glossed; toy numbers 0.9/0.1 and 0.2/0.8 give 69/31.
- 2026-10-24 widget `belief-mixer` built (HTML sliders for prior and evidence, belief bars, noisy/sharp switch, presets, optional evidence markers); validate and widget-smoke clean, screenshots checked at phone and desktop. Conventions fixed here: causes coloured blue, orange, purple in the order given; noisy senses flatten evidence by power 0.3.
- 2026-10-24 ch01-persist built (concept, 14 cards: welcome, hook, drift prediction, persist=small set of states, loop + order, two ways to cut a mismatch, which lever, neats/scruffies, surprise gloss, 2 traps, roadmap table, summary). No widget existed for a state-drift demo; used mcq/order instead (choice made autonomously). Conventions fixed here: running example creature 36-38 C and fish; surprise glossed as distance from intact-keeping sensations; degrees as `{}^\circ`.
2026-10-24 · Course set up: folder, trail, CLAUDE.md, catalog entry; book converted to Markdown.
Conventions fixed here: none yet.
- 2026-10-24 ch01-acting: 11 cards. Hook cold creature, homeostat (presets Update belief only / Act), prediction error, set-point, one-step numeric (gap 1.8 after heater 80% + room 5%), policy, S-R trap, curiosity, explore/exploit trap. Source 1.4.1 goal/planning bullets (prose). Conventions fixed here: act settles near 36.4 C, belief-only drifts to ~29.5; prediction error = expected - sensed (words); expected free energy named, not formalised.
- 2026-10-24 ch01-map: 10 boxes (loop, surprise, prior, evidence, prediction error, belief, action lever, perception lever, policy, exploring/exploiting), 2 decoys each (incl. stimulus-response, belief = evidence only, explore-or-exploit switch). "Generative model" was never glossed in the three lessons, so its box became separate prior and evidence boxes; the term is left for Level 2. Display math in map cards needs blank lines around `$$` and `aligned` for the error formula (phone width). Conventions fixed here: map box set above; generative model not used in Level 1.
- 2026-10-24 ch01-challenge p1-3: fish/warm water (error -8, order loop), splash in the dark (42%, flatten reverses to 53%), cold creature policy scores (7 vs 6, then 6 vs 4). Summary is a plain text card (own: is not allowed in challenges). Conventions fixed here: see Chapter 1.
