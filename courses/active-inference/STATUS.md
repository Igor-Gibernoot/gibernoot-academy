# Status

Session start: read only **Current** (`sed -n '/^## Current (2026-10-24)

- **State:** Level 1 in progress. Built: `ch01-persist` (14 cards), `ch01-guessing` (11 cards, uses `belief-mixer`). Source 1.1-1.3 verified; 1.4.1 prose only (no source formulas used).
- **Next unit:** widget `homeostat` (creature state vs expected range, levers "change belief" / "act"), then `ch01-acting` (concept).
- **Conventions:** `CONVENTIONS.md`, one section per chapter.
- **Paths:** lessons `courses/active-inference/chNN/`, sources git-ignored.

## Log

- 2026-10-24 ch01-guessing built (concept, 11 cards: welcome, hook, belief-mixer, why-different mcq, words gloss, numeric toy 69%, 2 traps, predictive machine, lever mcq, summary). Validate and shots clean; mixer card viewed at phone width. Summary uses "belief proportional to prior x evidence" in words (own wording, not a book equation; book's Bayes' rule is Ch. 2, unverified). Notation check of CLAUDE.md: see CONVENTIONS. Conventions fixed here: causes cat/dog/fox; prior, evidence (= likelihood later), hidden cause, belief glossed; toy numbers 0.9/0.1 and 0.2/0.8 give 69/31.
- 2026-10-24 widget `belief-mixer` built (HTML sliders for prior and evidence, belief bars, noisy/sharp switch, presets, optional evidence markers); validate and widget-smoke clean, screenshots checked at phone and desktop. Conventions fixed here: causes coloured blue, orange, purple in the order given; noisy senses flatten evidence by power 0.3.
- 2026-10-24 ch01-persist built (concept, 14 cards: welcome, hook, drift prediction, persist=small set of states, loop + order, two ways to cut a mismatch, which lever, neats/scruffies, surprise gloss, 2 traps, roadmap table, summary). No widget existed for a state-drift demo; used mcq/order instead (choice made autonomously). Conventions fixed here: running example creature 36-38 C and fish; surprise glossed as distance from intact-keeping sensations; degrees as `{}^\circ`.
p' courses/active-inference/STATUS.md`).
Session end: update Current in place (keep it under ~40 lines: replace, don't append) and add a
3-line Log entry at the top of the Log, ending "Conventions fixed here: …"; copy those conventions
into the chapter's section of `CONVENTIONS.md`, not into Current.

## Current (2026-10-24)

- **State:** course created. Trail planned in `course.yaml` (10 levels, one per chapter, all
  nodes planned, no lessons built). Source converted to `sources/active_inference_book.md`
  with marker (no ranges verified yet: see `CLAUDE.md`, "Source verification").
- **Next unit:** Level 1, `ch01-persist` (concept, intro rules). Source: Chapter 1, lines
  ~103-135 of the Markdown (1.1-1.3); figure 1.1 is the action-perception loop.
- **Conventions:** `CONVENTIONS.md`, one section per chapter.
- **Paths:** lessons `courses/active-inference/chNN/`, sources git-ignored.

## Log

2026-10-24 · Course set up: folder, trail, CLAUDE.md, catalog entry; book converted to Markdown.
Conventions fixed here: none yet.
