# Gibernoot Academy — Study Apps

## Context

Personal study project for Igor, a physics PhD student at the University of
São Paulo. **Gibernoot Academy** is one static web app with several
**courses**, all built with the same engine, the same lesson kinds and the
same teaching method; only the content differs.

- Courses: `courses/catalog.yaml` (the home page list). Each course is a
  folder `courses/<id>/`:
  - `CLAUDE.md`: **read it before working on that course**: its sources,
    chapter-to-level mapping, notation and conventions.
  - `course.yaml` (the trail) and lesson files `chNN/*.yaml`, `exams/`.
  - `STATUS.md`: the course's build status (a short Current block + Log).
  - `CONVENTIONS.md`: notation, running examples and key numbers fixed
    while building, one `## Chapter N` section per chapter (read only the
    section you need).
  - `archive/` (optional): old exercises and notes worth mining.
  - `sources/` (**git-ignored, never committed**): the course's main
    reference (books, lecture notes, the professor's exams, PDFs).
- Every session works on **one course**. If the prompt does not name it and
  more than one course is in progress, ask.
- **Short prompts are enough.** "Create the course <name>" (plus where its
  material is, if Igor gives it) means: run `docs/NEW_COURSE.md` end to
  end, choosing the id yourself. "Next unit of <course>" (or just the
  course name, if it is the only one in progress) means: take the next
  unit from its Current block and build it following this file. Ask only
  what cannot be found or decided (e.g. where the sources are).
- **Never read the PDFs** (listed in `.claudeignore`); use the Markdown
  conversion of a source.
- **Sources may be unpublished: never commit or push them** (Markdown,
  images, PDFs). The repo is public; `.gitignore` excludes
  `courses/*/sources/` and all PDFs. Keep it that way.
- Trail levels use the **chapter numbers of the course's main source**
  (Chapter 1 is the introduction). In lessons, refer to later material by
  name ("the metric, Level 7").

## Role

Act as Igor's personal tutor, in problem-based-learning style: build genuine
understanding, explain rigorously but pedagogically, and connect back to the
main source's notation and logical development.

## The deliverable: a Brilliant-style study app

Static web app on GitHub Pages (laptop and phone). Deploy = commit + push to
`main` (Igor has authorized pushing this repo).
- Repo: https://github.com/Igor-Gibernoot/gibernoot-academy
- Live: https://igor-gibernoot.github.io/gibernoot-academy/ (home = course
  list; a course at `#/<id>`, a lesson at `#/<id>/lesson/<lessonId>/<n>`).
- Shared by all courses: the engine `js/`, the widgets `js/widgets/`
  (`index.js` holds the registry; any course may use any widget), styles
  `css/app.css`, `vendor/`, `tools/`, and the format docs in `docs/`.
- Trail: `courses/<id>/course.yaml`, one level per chapter; lessons without
  `file:` are planned nodes. Lessons: `courses/<id>/chNN/*.yaml` (format in
  `docs/QUICKREF.md`, full spec `docs/LESSON_FORMAT.md`). Engine and app
  features: `docs/APP.md` (read only when changing the engine).

### Lesson kinds (per chapter level)

1. **Concept** (`kind: concept`): open with a problem or prediction the
   reader cannot yet solve, build the concept, return to resolve it.
2. **Guided problem** (`kind: guided`): one substantial problem split into
   steps, each a question. Prefer results the source states without proof
   and its appendix proofs (the course's `CLAUDE.md` says where they are).
3. **Traps** (`kind: traps`): fast questions, each built on a common
   misconception.
4. **Intuition** (`kind: intuition`): derives nothing; builds quick recall of the main formulas of the concept lessons (mnemonics, limit/scaling checks, build cards, a small numeric example).
   The numeric/applied cards after the build cards **must not state the formula to apply**: the learner recalls it (hints may point to the family or the scaling test, never write the law). Give data, not the law.
5. **End of every level:** **content map** (`kind: map`, rebuild the
   chapter's concept map box by box among decoys; start from an old map in
   `archive/` if any and check it against the source), **level review**
   (`kind: review`, automatic), **level challenge** (`kind: challenge`,
   harder problems combining the level's concepts; built last).
   **Summaries show the math:** each `own:` bullet restates its main formulas (displayed, phone-safe), never only prose.
   **Summaries are self-contained:** the recap is read alone, weeks later, and in Recap with blanks. Every symbol, chart, map, connection, space and running example an `own:` bullet uses is defined in that bullet or in the lines just above it ("on the plane $\mathbb{R}^2$ with cartesian chart $(x,y)$ and polar chart $(r,\theta)$, ..."), never assumed from the lesson. Re-state the setup of any example you recall; never "the book" or its labels.
6. **Exam** (`kind: exam`, own level, played by `js/exam.js`; format in `docs/LESSON_FORMAT.md`). **Every course has two: a partial exam and a final exam.** The partial exam is the unit right after the **last level of the first half** (level ⌈N/2⌉ of N chapter levels; its map, review and challenge come first), covering Levels 2 to ⌈N/2⌉ (Level 1 is the intro); the final exam is the unit right after the **last chapter level**, covering the second half. Both are planned in `course.yaml` from the start (own levels `exam-partial`, `exam-final`; a node without `file:` until built), and **the next unit after such a level is always its exam**, before the next chapter's first lesson: Current blocks and next-session prompts must say so. Built from the professor's exam in the course's `sources/` when there is one; otherwise **write an original exam** from the course's own lessons (same format and rules, fresh numbers and a fresh setting, never a copy of a lesson example or challenge; check every number twice by script). One session per exam (widgets for its figures first, in their own session). Rules for building one:
   - **Faithful** (when there is a professor's exam): same questions, same point weights (`points:` per card, total = original total), same numbers. Adapt only the format (below). An original exam: 10 points, about 5 questions of 2 points, 60 minutes (final: 90 to 180), each question one setting that combines concepts of several levels, mixing numeric, mcq, build and order cards.
   - **Own level** between chapters (`eyebrow`, `hue`), never inside a chapter. The final exam is `exam-final` after the last chapter level.
   - **Setting card first** (not a question): the objects and notation of the exam, self-contained. Then one card per sub-question, tagged `Question N · …`, ids `qN-…`.
   - **Written answers become gradable cards**: mcq (also multi-select), numeric, build, order. Each wrong option encodes a real mistake, with `feedback` (shown only in the review). Every card has an `explanation`; the debrief lists the skills tested.
   - **No hints, no feedback, no widgets that reveal the answer** while answering; figures are shown as in the original exam (static or interactive widgets that only display, never solve).
   - **`rules:` written for the app** (timer, no feedback until submit, can go back, empty counts as wrong, no notes), not copied from the paper exam. `minutes:` = the original time.
   - Verify every number twice; the review must show the right answer for every card.
   - Check: validate, shots, and a headless run of intro, answering, submit, time-up, results, review, exit.

7. **Review** is automatic: every question enters a spaced-repetition deck
   (one deck per course), so prompts, hints and feedback must be
   **self-contained**.
8. **Intro level (Level 1 of a course, and any future preview lesson)** is a
   *light* tour for a reader who may know nothing of the field and none of
   its notation. Keep the advanced content, but present it thoroughly:
   - **Guessing is the point, for the whole level.** The first lesson says
     so for *all* intro lessons; every later intro lesson repeats it in one
     line in its opening card.
   - **Gloss every technical word at first use**, in one plain sentence,
     even if a later Level formalizes it (in a relativity course: event,
     worldline, proper time, geodesic, chart, tensor, horizon, …). Never a
     bare name plus "(Level N)".
   - **Warn about notation**: e.g. a raised index is a label, not a power
     ($x^i$, $x^2$ = "second component"); a dot is a time derivative;
     units such as $c = 1$. Avoid index-heavy formulas in cards and
     `own:`; if one appears (e.g. a widget readout), say "the symbols come
     later, watch the shape".
   - **Outside knowledge is explained where used**: if a question needs a
     result from another subject (e.g. the slow-clock factor
     $\sqrt{1-v^2}$), the hint gives it and the explanation derives or
     motivates it, so a reader who never met it learns it.
   - **Questions must be guessable** from intuition or the card before
     (no recalling the course structure, no counting tasks without the
     needed definition in the prompt). Explanations show the reasoning,
     not only the arithmetic ("$4 + 4\cdot3/2$" → say what each term counts).
   - **Geometric puzzles get a picture** (a widget preset, before the
     question, not revealing its answer) and concrete wording.
   - **No meta or list cards** ("questions to carry", "order the course"):
     each puzzle card states its own question, and the closing table maps
     puzzles to Levels.

### How to teach a topic

Igor's emphasis: **language as simple as possible and an intuitive approach,
while building a rigorous foundation**: define every new notation and symbol,
and put the weight on understanding and on the physics (or, in other
courses, on what the subject is for).

1. **Why the topic exists.** Say what problem it was invented to solve,
   ideally flavored by the course's goal. Start with a hook: a concrete
   puzzle or prediction ("before any theory, guess…").
2. **First principles.** Derive what can be derived from the definitions;
   state requirements, valid conditions and limitations (finite-dimensional,
   real scalars, needs a metric or not, …). Turn derivation steps into
   questions (why is this step allowed? build the next line).
3. **Introduce notation properly.** Name every symbol when first used, and
   say what abbreviations stand for (Hom = homomorphism, id = identity).
   Every variable is introduced with its type before use.
4. **Misconceptions are questions.** Each wrong MCQ option or `wrong:` entry
   encodes a real misconception, with feedback explaining why it is tempting
   and why it fails. Pitfalls are *explained* in the lesson, not only asserted.
5. **Applied examples** small enough to check by hand. Verify every number
   before writing it.
6. **Never use a concept before it is introduced.** Recall earlier
   concepts briefly ("Recall: …") instead of pointing to a source section.
7. **Show, don't assert.** Claims like "the same in every basis" get
   demonstrated, by the general argument plus a small numeric example or a
   widget.
8. **Don't give away a question in the card before it.**
9. **Consistency.** Use the main source's conventions exactly (its index
   placement, symbols, fonts, special characters, **and signs**: a quantity
   the source minimises is never shown "sign-flipped so bigger is better";
   if a toy version is needed, build it so it keeps the source's direction).
   Each lesson checks the formulas and symbols it uses against the PDF
   pages (course `CLAUDE.md`, "Source verification"), even in intro levels.
   Each course's
   `CLAUDE.md` lists them; later conventions fixed while building are in
   its `CONVENTIONS.md` (the chapter's section).
10. **Self-contained.** Never mention "the book" (or "the notes") or its
    section labels (C.3, B.5: say "the running example"); where the source
    derives a result another way, give both derivations in the lesson. End
    each lesson with a short "what you now own" summary and a teaser for
    the next one.
11. **Card-sized steps for flow.** One idea per card, many small
    questions, immediate feedback. Mix question types (not only MCQ). Add a
    widget wherever manipulating something builds intuition, and put it
    **early** (right after the hook, before the formulas); a later widget
    can revisit it to probe limits.
    **Lesson length:** never more than 25 cards, ideally under 20. A topic
    that needs more is split into two or three lessons, each with its own
    hook or recall opening, `own:` summary and teaser. **Split at planning
    time, not afterwards:** count the card plan before writing; if it
    exceeds 25, do not trim questions or squeeze cards to fit. Stop and
    split the unit along a natural seam (a result that stands on its own),
    add the new node(s) to `course.yaml`, build only the first part this
    session, and say so in the report and in the next-session prompt. If a
    lesson already written ends up above 25, split it the same way before
    committing. Never cut worked questions, traps or the summary to
    stay under the limit. **Level challenges** (`kind: challenge`) may go
    up to **32 cards** (ideally fewer); beyond that, split them the same
    way (e.g. problems 1–3 and 4–5 as two challenge nodes); 40 or more is
    always too long. **Exams** (`kind: exam`) are exempt: an exam has as
    many cards as the original has sub-questions. `node tools/validate.mjs`
    warns on lessons over 25 and challenges over 32.
12. **Displayed math.** A standalone equation, definition or chain goes on
    its own `$$...$$` line, phone-safe (`docs/QUICKREF.md`).
13. **Theme-neutral wording.** Never "the black arrow": name things by label
    or by the fixed hues (basis purple, vector components blue, covectors
    orange).
14. **Tables.** Plain Markdown tables only; the house style lives in `css/app.css` (`.prose table`: bordered, shaded header, zebra rows). Never style a table per lesson.

### Widgets are shared

Widgets live in `js/widgets/` and belong to the academy, not to a course.
**Everything a widget draws must be hideable by a config option** (arrows, rings, readout rows, labels), so a card shows exactly what its text discusses; a card never tells the reader to "ignore" part of a widget (add the option instead), and every option must be read in the widget's source. The validator warns on both (unused config key, "ignore the ..." near a widget). Before building a new one, check `docs/LESSON_FORMAT.md` (`grep -n '^####'`)
for an existing widget that a preset could adapt. A new widget is a new
file `js/widgets/<name>.js` (registered in `index.js`), built as a
general tool (parameters in the preset, no course-specific text hard-coded),
so other courses can reuse them.

### Building sessions (token efficiency)

Lessons are built across many short sessions. Igor starts each with
`/clear` and a prompt naming **one course and one unit of work**.
- **One unit per session:** one concept or guided lesson, or one traps
  round, or one content map, or **one new widget** (build it, document it
  in `docs/LESSON_FORMAT.md`, test it with a throwaway preset, no lesson).
  A level challenge takes two sessions (problems 1–3, then 4–5). A lesson
  that needs a new widget is two sessions: the widget first. **A planned
  widget card is never dropped silently.** If the card plan asks for a
  widget that does not exist (and no preset of an existing one fits), the
  lesson session stops *before writing the lesson* and reports "needs widget
  <name>: <what it shows>" with the widget unit's prompt; it does not build
  the lesson without it. Don't start
  the next unit even if budget seems to remain; finish cleanly.
- **Read only what you need, once:**
  - The course's `CLAUDE.md` (always).
  - Status: only the **Current** block of the course's status
    (`sed -n '/^## Current/,/^## Log/p' courses/<id>/STATUS.md`), never
    the Log.
  - Conventions: only the chapter's section of `courses/<id>/CONVENTIONS.md`
    (`grep -n '^## '`, then `sed -n` that range), plus its General section.
  - Format: `docs/QUICKREF.md`. Open `docs/LESSON_FORMAT.md` only for the
    subsection of a widget you use (`grep -n '^####'`, read that range),
    the map section when building a map, or in widget sessions.
  - The model lesson: the most recent lesson of the same chapter, first
    ~120 lines only.
  - The source: `grep -n` the section heading and read just that range.
  - Widget code only in widget sessions: the widget's own file
    `js/widgets/<name>.js` (plus `plane.js` for the helpers, `index.js`
    to register it), never the other widgets' files.
  - Never re-read a file you wrote or edited this session.
- **Write the lesson in one `Write` call**, then fix with small `Edit`s.
  Plan the card list in your head, not as a draft file.
- **Checks are text-first.** `node tools/validate.mjs <id>` (fix every
  error and warning; without `<id>` it checks every course), then
  `node tools/shots.mjs <id>/<file> <lessonId> <scratchpad>/shots` (file
  path relative to `courses/`): it prints only problems (formula overflow
  at phone and desktop width, page errors). **View images only when
  something visual is new** (widget sessions, a widget preset not seen
  before) or a card is flagged. `--all` only when hunting a layout bug.
  Setup once: `npm install --prefix tools`. By hand:
  `python3 -m http.server 8000`, `#/<id>/lesson/<lessonId>/<n>` (1-based).
- **Token efficiency (rules for every session and agent):**
  - Run `widget-smoke` only when a widget was added or changed; run `shots`
    only on the lesson just built (never `--all` without a layout bug).
  - Source verification is mandatory but **scoped**: read and check only the
    source range of the lesson's own formulas and symbols. Write the pages
    checked in the `STATUS.md` "Verified" line, and do **not** re-verify an
    item already listed there.
  - **Traps and intuition lessons are lighter**: reuse the formulas and
    pages already verified for their concept lessons; read the source only
    for a formula or figure not yet in "Verified".
  - Keep `STATUS.md` and `CONVENTIONS.md` short: Current under ~40 lines,
    "Verified" as compact page lists (no prose), a convention is one or two
    lines. When a file grows, compress it in the same session.
  - Agents run at the same model as the session and at `effort: medium` (Igor's standing choice).
- **End of every session:** validate, run shots, update the course's
  `STATUS.md` (Current block, plus a Log entry of a few lines ending with
  "Conventions fixed here: …", copied into the chapter's section of
  `CONVENTIONS.md`), commit
  and push, then **give Igor a ready-to-paste prompt for the next session**
  naming the course and the single next unit from its `course.yaml`, with a
  card plan of about 10 lines (hook, widget, key questions, summary) and
  the source lines to read.
- **`STATUS.md` is edited only with the `Edit` tool** (small `old_string`
  replacements), never with `sed`, `python`, `perl` or any script, and never
  by rewriting the whole file: scripted edits corrupted it before (duplicate
  Current/Log, a mangled header). Replace the Current block by `Edit`ing its
  lines; add a Log entry by `Edit`ing the `## Log` line to `## Log` plus the
  new entry. `node tools/validate.mjs` checks the structure (one `# Status`,
  one `## Current` before one `## Log`) and fails otherwise; fix before commit.
- **Keep the Markdown lean** (every session pays to read it). Current
  stays under ~40 lines: rewrite it in place (state, next unit, pointers),
  never append history to it; history goes in the Log (never read), and
  details in `CONVENTIONS.md`. A convention entry is one or two lines:
  the notation or number future lessons must reuse, not a lesson summary.
  Don't repeat in a course file what the root `CLAUDE.md` or `docs/` say.
- **Several units in a row** ("until the end of Chapter 3"): follow
  `docs/AUTONOMOUS.md`.
- **Engine changes** (shared by all courses): after one, run
  `node tools/validate.mjs` (all courses) and shots on a lesson of each
  course; after a widget change, also `node tools/widget-smoke.mjs`
  (mounts every widget preset of every course, clicks, drags, reports
  page errors).
