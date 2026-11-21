# Gibernoot Academy — Study Apps

## Context

Personal study project for Igor, a physics PhD student at the University of
São Paulo. **Gibernoot Academy** is one static web app with several
**courses**, all built with the same engine, lesson kinds and teaching
method; only the content differs.

- Courses: `courses/catalog.yaml` (home list). Each is a folder `courses/<id>/`:
  - `CLAUDE.md`: **read before working on that course** (sources,
    chapter-to-level mapping, notation, conventions).
  - `course.yaml` (the trail), lessons `chNN/*.yaml`, `exams/`.
  - `STATUS.md`: build status (short Current block only).
  - `STATUS.log.md`: history, **never read** (append-only).
  - `VERIFIED.md`: one line per lesson of what was checked (pages, `web: <source>`);
    append one line per unit, look up with `grep -n`, **never read whole**.
  - `CONVENTIONS.md`: notation, running examples, key numbers fixed while
    building, one `## Chapter N` section per chapter.
  - `archive/` (optional): old exercises and notes worth mining.
  - `sources/` (**git-ignored, never committed**): main reference (books,
    notes, the professor's exams, PDFs).
- Every session works on **one course**. If the prompt doesn't name it and
  several are in progress, ask.
- **Short prompts are enough.** "Create the course <name>" (plus where its
  material is) = run `docs/NEW_COURSE.md` end to end, choosing the id.
  "Next unit of <course>" (or just the course name, if it is the only one in
  progress) = take the next unit from its Current block and build it per
  this file. Ask only what cannot be found or decided.
- **Never read PDFs** (`.claudeignore`); use the Markdown conversion.
- **Sources may be unpublished: never commit or push them** (Markdown,
  images, PDFs). The repo is public; `.gitignore` excludes
  `courses/*/sources/` and all PDFs. Keep it so.
- Trail levels use the **chapter numbers of the main source** (Chapter 1 =
  introduction). In lessons, refer to later material by name ("the metric,
  Level 7").

## Role

Igor's personal tutor, problem-based-learning style: build genuine
understanding, explain rigorously but pedagogically, connect back to the
main source's notation and logical development.

## Deliverable: a Brilliant-style study app

Static web app on GitHub Pages (laptop and phone). Deploy = commit + push to
`main` (authorized).
- Repo: https://github.com/Igor-Gibernoot/gibernoot-academy
- Live: https://igor-gibernoot.github.io/gibernoot-academy/ (course at
  `#/<id>`, lesson at `#/<id>/lesson/<lessonId>/<n>`).
- Shared: engine `js/`, widgets `js/widgets/` (`index.js` = registry; any
  course may use any widget), `css/app.css`, `vendor/`, `tools/`, format
  docs in `docs/`.
- Trail: `courses/<id>/course.yaml`, one level per chapter; lessons without
  `file:` are planned nodes. Lesson format: `docs/QUICKREF.md`, full spec
  `docs/LESSON_FORMAT.md`. Engine/app features: `docs/APP.md` (only when
  changing the engine).

### Every course has the academy's look (new courses too)

A new course is not done until it has all of these (`docs/NEW_COURSE.md`):
- **`overview:` in `course.yaml`** (the "About this course" box): `text` is
  an engaging pitch for a curious newcomer: open with a question or hook,
  say what problem the subject solves, why it matters, who would love it,
  how the course teaches it (puzzles, guess first). No jargon, ~100 words,
  no formulas. Courses with code on cards also set `code:` (one or two
  sentences naming the language and libraries, shown as "Programming
  language" above the sources). `sources:` is a list of `{who, what}` for main sources and
  authors (published works only: never `sources/` material such as the
  professor's notes or exams).
- **Level `references:` (any course with more than one source):** each
  level lists the works it was built from, with complete author names,
  full title, publisher and year, and the chapter or sections used
  (shown as a "References (n)" fold under the memory strip; format in
  `docs/LESSON_FORMAT.md`). Take them from the course `CLAUDE.md` level
  map; published works only, never `sources/` material; mark nothing you
  could not pin to a specific work. Update the list when a lesson draws
  on a new source. Single-source courses may skip it.
- **Pixel character:** own `mascot:` sprite (16-wide grid plus two walk
  frames) in `js/pixel.js` `SPRITES`, set in `courses/catalog.yaml`.
- **Pixel image:** own `banner:` scene (96 x 28) in `js/pixel.js`
  `BANNERS`, set in `courses/catalog.yaml`, plus a `hue` there.
- Pixel font (Jersey 10) and the sticky medal bar come from the shared
  engine; never override them per course. Validate checks the names.

### Lesson kinds (per chapter level)

1. **Concept** (`concept`): open with a problem or prediction the reader
   cannot yet solve, build the concept, return and resolve it.
2. **Guided problem** (`guided`): one substantial problem in steps, each a
   question. Prefer results the source states without proof and its
   appendix proofs (course `CLAUDE.md` says where). Two flavours, decided
   at planning time and stated in the node's `summary:`:
   - **Guided problem**: one specific case with its own numbers. No `own:`,
     no Recap; it closes with a plain "what you now own" text card (method,
     teaser).
   - **Guided proof** (`proof: true`): ends in a general result or law.
     Takes `own:` (with Recap blanks) like a concept lesson.
3. **Traps** (`traps`): fast questions, each built on a common misconception.
4. **Intuition** (`intuition`): derives nothing; quick recall of the main
   formulas of the concept lessons (mnemonics, limit/scaling checks, build
   cards, a small numeric example). The numeric/applied cards after the
   build cards **must not state the formula to apply**: give data, not the
   law (hints may point to the family or scaling test, never write the law).
5. **End of every level:** **content map** (`map`: rebuild the chapter's
   concept map box by box among decoys; start from an old map in `archive/`
   if any, check it against the source), **level review** (`review`,
   automatic), **level challenge** (`challenge`: harder problems combining
   the level's concepts; built last).
   **Summaries (`own:`) show the math and are self-contained:** each bullet
   restates its main formulas (displayed, phone-safe) and defines every
   symbol, chart, map, space and running example it uses, in the bullet or
   the lines just above. It is read alone, weeks later, and in Recap with
   blanks. Re-state the setup of any example you recall; never "the book"
   or its labels.
6. **Exam** (`exam`, own level, played by `js/exam.js`). Full rules,
   format and checks: **`docs/EXAMS.md`** (read it when planning or
   building one). Planning essentials: **no exam covers more than 6
   chapter levels** (Level 1 is never covered); E = max(2, ⌈(N-1)/6⌉)
   exams for N chapter levels, partials after the last level of each block
   and the **final** right after the last chapter level (N ≤ 13: one
   partial after ⌈N/2⌉; N = 14 to 19: e.g. after Levels 7, 13, 19). All are
   planned in `course.yaml` from the start (`exam-partial`, or
   `exam-partial1`, `exam-partial2`, … and `exam-final`; no `file:` until
   built). **The next unit after such a level is always its exam**, before
   the next chapter's first lesson; Current blocks and next-session
   prompts must say so. One session per exam (figure widgets first, in
   their own session).
7. **Review** is automatic: every question enters a per-course
   spaced-repetition deck, so prompts, hints and feedback must be
   **self-contained**.
8. **Intro level (Level 1, and any preview lesson)** is a *light* tour for
   a reader who may know nothing of the field or its notation; guessing is
   the point, every technical word is glossed at first use, notation is
   warned about. Full rules: **`docs/INTRO.md`** (read it before planning
   or building an intro lesson).

### How to teach a topic

**Writing style (all lesson text, hints, explanations).** Natural, fluid
prose in simple words and first-principles logic. No "Step 1: ..." labels,
no AI buzzwords, no absolutist words (perfectly, exactly), few bullets and
dashes. Concise and clear. A derivation reads as a paragraph with displayed
equations between sentences; a worked example that applies a result gets
its own card, not a closing paragraph. A final equation goes on one line
when it fits at phone width.
A worked example that applies a formula **restates that formula** (with
its symbols) on its own card, so the reader never flips back, and goes one
quantity at a time: setup, each ingredient computed, then the assembly.
Only a trivial example (one or two operations) may be short.

Igor's emphasis: **language as simple as possible, an intuitive approach,
a rigorous foundation**: define every new notation and symbol; weight on
understanding and on the physics (or, in other courses, what the subject is
for).

1. **Why the topic exists**: the problem it was invented to solve, flavored
   by the course's goal. Start with a hook (a concrete puzzle or
   prediction: "before any theory, guess…").
2. **First principles.** Derive what can be derived; state requirements,
   valid conditions, limitations. Turn derivation steps into questions (why
   is this step allowed? build the next line).
3. **Notation properly.** Name every symbol at first use, say what
   abbreviations stand for (Hom = homomorphism, id = identity), give each
   variable its type before use.
4. **Misconceptions are questions.** Each wrong MCQ option or `wrong:`
   entry encodes a real misconception, with feedback on why it tempts and
   fails. Pitfalls are *explained*, not only asserted.
5. **Applied examples** small enough to check by hand; verify every number.
6. **Never use a concept before it is introduced.** Recall briefly
   ("Recall: …") instead of pointing to a source section.
7. **Show, don't assert.** Claims like "the same in every basis" get the
   general argument plus a small numeric example or a widget.
8. **Don't give away a question in the card before it.**
9. **Consistency.** Use the main source's conventions exactly (index
   placement, symbols, fonts, special characters, **and signs**: a quantity
   the source minimises is never shown "sign-flipped so bigger is better";
   build any toy version to keep the source's direction). Each lesson
   checks its formulas and symbols against the source pages (course
   `CLAUDE.md`, "Source verification"), even in intro levels. Later
   conventions are in the chapter's section of `CONVENTIONS.md`.
10. **Self-contained.** Never mention "the book"/"the notes" or section
    labels (C.3, B.5: say "the running example"); where the source derives
    a result another way, give both derivations. End each lesson with a
    short "what you now own" summary and a teaser for the next.
11. **Card-sized steps.** One idea per card, many small questions,
    immediate feedback, mixed question types (not only MCQ). Add a widget
    wherever manipulating something builds intuition, **early** (right
    after the hook, before formulas); a later widget may revisit it.
    **Lesson length:** never more than 25 cards, ideally under 20. **Split
    at planning time:** count the card plan before writing; if over 25, do
    not trim questions or squeeze cards. Stop, split along a natural seam
    (a result that stands on its own), add the new node(s) to
    `course.yaml`, build only the first part this session, and say so in
    the report and next-session prompt. If a written lesson ends above 25,
    split it the same way before committing. Never cut worked questions,
    traps or the summary to stay under the limit. **Challenges** may go to
    **32 cards** (ideally fewer); beyond that split (e.g. problems 1–3 and
    4–5); 40+ is always too long. **Exams** are exempt. `node
    tools/validate.mjs` warns over 25 / 32. **Images count as no card**
    (they ride on a card), but each adds scroll.
    **Split lessons stand alone.** Part 2+ opens with a "Recall:" card (or
    two) restating, with formulas and defined symbols, what the previous
    part established and this part uses (never "as we saw"). A card citing
    an earlier result names the lesson by title ("the lesson Volume Forms
    and Orientation"), never "earlier" or "the previous lesson". Parts that
    need nothing from before need only the usual toolkit recall.
12. **Displayed math.** A standalone equation, definition or chain goes on
    its own `$$...$$` line, phone-safe (`docs/QUICKREF.md`).
13. **Theme-neutral wording.** Never "the black arrow": name things by
    label or fixed hue (basis purple, vector components blue, covectors
    orange).
14. **Tables.** Plain Markdown only; house style is `.prose table` in
    `css/app.css`. Never style a table per lesson.

### Images (`docs/IMAGES.md`)

A lesson may carry **pictures** on any card (`image:` with `alt`, a
one-sentence `caption` that teaches something, `credit` and `link`) where
they make something concrete: **a person when first introduced** (portrait),
**an experiment or scenario described in words**, **a real object or data
image**. Max 4 per lesson (6 in people-heavy history-of-ideas lessons,
where every named person gets a portrait; intro level up to 8); most need 0
to 2. Never decorative, never the answer to a question, never a copyrighted
figure or anything from `sources/`. Only **free licenses** (public domain,
CC0, CC BY, CC BY-SA), fetched from Wikimedia Commons by `node
tools/fetch-image.mjs search|get` (resizes, writes the credit ledger
`courses/<id>/img/credits.yaml`, prints the card block). In every
concept/guided/intro lesson plan ask: "is there a person, experiment or
object here worth a picture?"; if yes and a free image exists, add it; if
none, skip (never a placeholder or non-free image). Read `docs/IMAGES.md`
once when a lesson gets an image. Images show in review too.

### Widgets are shared

Widgets live in `js/widgets/` and belong to the academy, not a course.
**Everything a widget draws must be hideable by a config option** (arrows,
rings, readout rows, labels), so a card shows exactly what its text
discusses; a card never says "ignore" part of a widget (add the option),
and every option must be read in the widget's source. The validator warns
on both. **File names must not look like trackers or ads** (Arc, Dia and
uBlock-style blockers block such URLs; `hit-counter.js` once stopped the
whole app). Never name any file in `js/`, `css/` or `vendor/` hit-counter,
tracker, analytics, beacon, pageview, telemetry, metrics, stats, ad(s),
advert, popup, sponsor or collect; validate rejects these in
`js/widgets/`. Widgets load on demand (dynamic `import()` in
`js/widgets/index.js`, registry line `'name': ['file', 'exportName']`);
never add static imports of widget files. Before building a new one, read
`docs/widgets/README.md` (one line per widget) for an existing one a preset
could adapt. A new widget is a new `js/widgets/<name>.js` (registered in
`index.js`), a general tool (parameters in the preset, no course-specific
text hard-coded).

### Building sessions (token efficiency)

Igor starts each session with `/clear` and a prompt naming **one course and
one unit of work**.
- **One unit per session:** one concept or guided lesson, or one traps
  round, or one content map, or **one new widget** (build it, document it
  in `docs/widgets/<name>.md` and its index line, test with a throwaway
  preset, no lesson). A level challenge takes two sessions (problems 1–3,
  then 4–5). A lesson needing a new widget is two sessions: widget first.
  **A planned widget card is never dropped silently:** if the plan needs a
  widget that doesn't exist (and no preset fits), stop *before writing the
  lesson* and report "needs widget <name>: <what it shows>" with the
  widget unit's prompt. Don't start the next unit even if budget remains.
- **Read only what you need, once:**
  - The course's `CLAUDE.md` (always).
  - `courses/<id>/STATUS.md` (short), never `STATUS.log.md`.
  - Conventions: `grep -n '^## '`, then `sed -n` the General section and the
    chapter's section only.
  - Format: `docs/QUICKREF.md`. `docs/widgets/<name>.md` only for a widget
    you use, `docs/LESSON_FORMAT.md` (`grep -n '^## '`) only for the map
    section when building a map.
  - Model lesson: the most recent of the same chapter, first ~120 lines.
  - Source: `grep -n` the heading, read just that range.
  - Widget code only in widget sessions: the widget's own file (plus
    `plane.js` helpers, `index.js` to register).
  - Never re-read a file you wrote or edited this session.
  - Use `offset`/`limit` or `grep`/`sed -n` on any file over ~300 lines.
- **Write the lesson in one `Write` call**, then small `Edit`s. Plan the
  card list in your head, not as a draft file.
- **Checks are text-first.** `node tools/validate.mjs <id>` (fix every
  error and warning; without `<id>` it checks all courses), then
  `node tools/shots.mjs <id>/<file> <lessonId> <scratchpad>/shots` (path
  relative to `courses/`): prints only problems (formula overflow at phone
  and desktop width, page errors). **View images only when something visual
  is new** (widget sessions, an unseen preset) or a card is flagged.
  `--all` only when hunting a layout bug. Setup once:
  `npm install --prefix tools`. By hand: `python3 -m http.server 8000`,
  `#/<id>/lesson/<lessonId>/<n>` (1-based).
- **Token rules (sessions and agents):**
  - `widget-smoke` only when a widget was added or changed; `shots` only on
    the lesson just built.
  - **Any web check** (facts, quotations, constants, image captions): follow
    `docs/WEB_SEARCH.md` (short keyword queries, 3+ variations, primary and
    reference sites, `tried:` log). A failed search is not "unconfirmed"
    until all its steps fail.
  - Source verification is mandatory but **scoped**: check only the source
    range of the lesson's own formulas and symbols; write the pages (and,
    where required, each fact with `web: <source>`) as one line in the
    course's `VERIFIED.md`, never in `STATUS.md`; before verifying,
    `grep -n` it and don't re-verify what is listed.
  - **Traps and intuition lessons are lighter**: reuse what their concept
    lessons verified; read the source only for a formula or figure not yet
    in `VERIFIED.md`.
  - Keep `STATUS.md` and `CONVENTIONS.md` short: Current under ~40 lines
    (no per-lesson "Verified" lines), a convention is one or two lines (the
    notation or number future lessons must reuse). Compress a file when it
    grows. Don't repeat in a course file what this file or `docs/` say.
  - Agents run at the session's model at `effort: medium` (Igor's choice).
- **End of every session:** validate, shots, update `STATUS.md` (Current
  block, plus an entry of a few lines in `STATUS.log.md` ending
  "Conventions fixed here: …", copied into the chapter's section of
  `CONVENTIONS.md`), commit and push, then **give Igor a ready-to-paste
  prompt for the next session** naming the course and the single next unit
  from `course.yaml`, with a ~10-line card plan (hook, widget, key
  questions, summary) and the source lines to read.
- **`STATUS.md` is edited only with `Edit`** (small `old_string`
  replacements), never `sed`/`python`/`perl`/scripts, never by rewriting the
  whole file (scripted edits corrupted it before). Replace Current line by
  line, in place, never appending history; add a log entry by `Edit`ing the
  `# Status log` line of `STATUS.log.md` (newest first). `node
  tools/validate.mjs` checks the structure (one `# Status` and one
  `## Current` in `STATUS.md`, one `# Status log` in `STATUS.log.md`); fix
  before commit.
- **Several units in a row** ("until the end of Chapter 3"): follow
  `docs/AUTONOMOUS.md`.
- **Engine changes** (shared): run `node tools/validate.mjs` (all courses)
  and shots on a lesson of each course; after a widget change also
  `node tools/widget-smoke.mjs`.
