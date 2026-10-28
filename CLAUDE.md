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
   - **Guided proof** (`proof: true` in the lesson file): ends in a general
     result or law. It takes `own:` (with Recap blanks) like a concept lesson.
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
   the lines just above ("on the plane $\mathbb{R}^2$ with cartesian chart
   $(x,y)$ and polar chart $(r,\theta)$, ..."). It is read alone, weeks
   later, and in Recap with blanks. Re-state the setup of any example you
   recall; never "the book" or its labels.
6. **Exam** (`exam`, own level, played by `js/exam.js`; format in
   `docs/LESSON_FORMAT.md`). **Every course has a partial and a final
   exam.** Partial = the unit right after the **last level of the first
   half** (level ⌈N/2⌉ of N chapter levels; its map, review, challenge come
   first), covering Levels 2 to ⌈N/2⌉ (Level 1 is the intro). Final = right
   after the **last chapter level**, covering the second half. Both are
   planned in `course.yaml` from the start (levels `exam-partial`,
   `exam-final`; no `file:` until built). **The next unit after such a level
   is always its exam**, before the next chapter's first lesson; Current
   blocks and next-session prompts must say so. Built from the professor's
   exam in `sources/` when there is one; otherwise **write an original
   exam** from the course's lessons (same format and rules, fresh numbers
   and setting, never a copy of a lesson example or challenge; check every
   number twice by script). One session per exam (its figure widgets first,
   in their own session). Rules:
   - **Faithful** (professor's exam): same questions, point weights
     (`points:` per card, same total), numbers; adapt only the format.
     Original exam: 10 points, ~5 questions of 2 points, 60 minutes (final:
     90 to 180), each question one setting combining concepts of several
     levels, mixing numeric, mcq, build, order cards.
   - **Own level** between chapters (`eyebrow`, `hue`), never inside one.
   - **Setting card first** (not a question; objects and notation,
     self-contained). Then one card per sub-question, tagged
     `Question N · …`, ids `qN-…`.
   - **Written answers become gradable cards**: mcq (also multi-select),
     numeric, build, order. Each wrong option encodes a real mistake with
     `feedback` (shown only in review). Every card has an `explanation`;
     the debrief lists the skills tested.
   - **No hints, feedback, or answer-revealing widgets** while answering;
     figures as in the original (static or display-only widgets).
   - **`rules:` written for the app** (timer, no feedback until submit, can
     go back, empty counts as wrong, no notes), not copied from paper.
     `minutes:` = the original time.
   - Verify every number twice; review shows the right answer per card.
   - Check: validate, shots, and a headless run of intro, answering,
     submit, time-up, results, review, exit.
7. **Review** is automatic: every question enters a per-course
   spaced-repetition deck, so prompts, hints and feedback must be
   **self-contained**.
8. **Intro level (Level 1, and any preview lesson)** is a *light* tour for
   a reader who may know nothing of the field or its notation. Keep the
   advanced content, present it thoroughly:
   - **Guessing is the point.** The first lesson says so for all intro
     lessons; each later one repeats it in one line in its opening card.
   - **Gloss every technical word at first use** in one plain sentence,
     even if a later Level formalizes it. Never a bare name plus "(Level N)".
   - **Warn about notation**: a raised index is a label, not a power ($x^i$;
     $x^2$ = "second component"); a dot is a time derivative; units such as
     $c = 1$. Avoid index-heavy formulas in cards and `own:`; if one appears
     (e.g. a widget readout) say "the symbols come later, watch the shape".
   - **Outside knowledge is explained where used**: the hint gives the
     result (e.g. slow-clock factor $\sqrt{1-v^2}$), the explanation
     derives or motivates it.
   - **Questions must be guessable** from intuition or the card before (no
     recalling course structure, no counting without the definition in the
     prompt). Explanations show the reasoning, not only arithmetic
     ("$4 + 4\cdot3/2$" → say what each term counts).
   - **Geometric puzzles get a picture** (widget preset before the question,
     not revealing the answer) and concrete wording.
   - **No meta or list cards** ("questions to carry", "order the course"):
     each puzzle card states its own question; the closing table maps
     puzzles to Levels.

### How to teach a topic

Igor's emphasis: **language as simple as possible, an intuitive approach,
a rigorous foundation**: define every new notation and symbol; weight on
understanding and on the physics (or, in other courses, what the subject is
for).

1. **Why the topic exists**: the problem it was invented to solve, flavored
   by the course's goal. Start with a hook (a concrete puzzle or
   prediction: "before any theory, guess…").
2. **First principles.** Derive what can be derived; state requirements,
   valid conditions, limitations (finite-dimensional, real scalars, needs a
   metric or not…). Turn derivation steps into questions (why is this step
   allowed? build the next line).
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
    4–5); 40+ is always too long. **Exams** are exempt (as many cards as
    the original has sub-questions). `node tools/validate.mjs` warns over
    25 / 32.
    **Split lessons stand alone.** Part 2+ opens with a "Recall:" card (or
    two) restating, with formulas and defined symbols, what the previous
    part established and this part uses (never "as we saw"). A card citing
    an earlier result names the lesson by title ("the lesson Volume Forms
    and Orientation"), never "earlier" or "the previous lesson". Parts that
    need nothing from before (e.g. independent challenge problems) need only
    the usual toolkit recall.
12. **Displayed math.** A standalone equation, definition or chain goes on
    its own `$$...$$` line, phone-safe (`docs/QUICKREF.md`).
13. **Theme-neutral wording.** Never "the black arrow": name things by
    label or fixed hue (basis purple, vector components blue, covectors
    orange).
14. **Tables.** Plain Markdown only; house style is `.prose table` in
    `css/app.css`. Never style a table per lesson.

### Widgets are shared

Widgets live in `js/widgets/` and belong to the academy, not a course.
**Everything a widget draws must be hideable by a config option** (arrows,
rings, readout rows, labels), so a card shows exactly what its text
discusses; a card never says "ignore" part of a widget (add the option),
and every option must be read in the widget's source. The validator warns
on both. Before building a new one, read `docs/widgets/README.md`
(one line per widget) for an existing one a preset could adapt. A new widget is a new
`js/widgets/<name>.js` (registered in `index.js`), a general tool
(parameters in the preset, no course-specific text hard-coded).

### Building sessions (token efficiency)

Igor starts each session with `/clear` and a prompt naming **one course and
one unit of work**.
- **One unit per session:** one concept or guided lesson, or one traps
  round, or one content map, or **one new widget** (build it, document it
  in `docs/widgets/<name>.md` and its index line, test with a throwaway preset, no lesson). A
  level challenge takes two sessions (problems 1–3, then 4–5). A lesson
  needing a new widget is two sessions: widget first. **A planned widget
  card is never dropped silently:** if the plan needs a widget that doesn't
  exist (and no preset fits), stop *before writing the lesson* and report
  "needs widget <name>: <what it shows>" with the widget unit's prompt. Don't
  start the next unit even if budget remains.
- **Read only what you need, once:**
  - The course's `CLAUDE.md` (always).
  - `courses/<id>/STATUS.md` (short), never `STATUS.log.md`.
  - Conventions: `grep -n '^## '`, then `sed -n` the General section and the
    chapter's section only.
  - Format: `docs/QUICKREF.md`. `docs/widgets/<name>.md` only for a widget
    you use (index: `docs/widgets/README.md`), `docs/LESSON_FORMAT.md`
    (`grep -n '^## '`) only for the map section when building a map.
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
  - Source verification is mandatory but **scoped**: check only the source
    range of the lesson's own formulas and symbols; write the pages in the
    `STATUS.md` "Verified" line; don't re-verify items listed there.
  - **Traps and intuition lessons are lighter**: reuse what their concept
    lessons verified; read the source only for a formula or figure not yet
    in "Verified".
  - Keep `STATUS.md` and `CONVENTIONS.md` short: Current under ~40 lines,
    "Verified" as compact page lists, a convention is one or two lines (the
    notation or number future lessons must reuse, not a lesson summary).
    Compress a file when it grows. Don't repeat in a course file what this
    file or `docs/` say.
  - Agents run at the session's model at `effort: medium` (Igor's choice).
- **End of every session:** validate, shots, update `STATUS.md` (Current
  block, plus an entry of a few lines in `STATUS.log.md` ending "Conventions fixed here: …",
  copied into the chapter's section of `CONVENTIONS.md`), commit and push,
  then **give Igor a ready-to-paste prompt for the next session** naming the
  course and the single next unit from `course.yaml`, with a ~10-line card
  plan (hook, widget, key questions, summary) and the source lines to read.
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
  `node tools/widget-smoke.mjs` (mounts every preset, clicks, drags,
  reports page errors).
