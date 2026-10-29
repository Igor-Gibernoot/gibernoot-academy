# Adding a course

A course is content only: the engine, widgets, lesson kinds and teaching
method are shared (root `CLAUDE.md`). Setting one up is its own session
(no lessons in it).

## 1. Choose the id

Short, lowercase, digits and `-` only (e.g. `qft`, `stat-mech`). It is the
folder name, the URL segment (`#/<id>/...`) and the prefix under which
progress is stored, so pick a descriptive one. Renaming a studied course is possible only by adding it to `RENAMED` in `js/course.js` (links and saved progress migrate).

## 2. Create the folder

```
courses/<id>/
  CLAUDE.md      course-specific rules (template below)
  course.yaml    the trail: title + one level per chapter, lessons as planned nodes
  STATUS.md      short "## Current" block (state, next unit); the history goes in
                  `STATUS.log.md` (never read in a session)
  CONVENTIONS.md "## General" then one "## Chapter N" section per chapter
  sources/       git-ignored: the main reference (Markdown), exams, PDFs
  archive/       optional: old exercise sheets, notes worth mining
```

Create the two status files from these templates (the validator requires them):
`STATUS.md` = `# Status`, a blank line, `## Current (<date>)` and a short
state / next-unit list (nothing else, no Log); `STATUS.log.md` = `# Status log`
and a line "Newest first. Never read this file in a session." Keep
`CONVENTIONS.md` short and per chapter; if one grows past ~300 lines, split
it into `conventions/general.md` and `conventions/chNN.md`.

Put the sources in `sources/`: Igor copies them in, or gives a path or a
link (copy or download them there). If none is given, look in
`courses/<id>/sources/`, then ask. If the main reference is only a PDF,
convert it to Markdown with a command-line tool (`pdftotext -layout`, or
`marker`/`pandoc` if installed) without reading the PDF yourself, then
work from the Markdown. Check `git status` shows nothing from `sources/`.

The conversion is machine-made and has formula errors, so every course
uses the same two-step workflow: (1) convert the PDF once, here; (2) in
each lesson session, check the lesson's source range against the rendered
PDF pages, fix the Markdown, and log the range in `sources/VERIFIED.md`
(template below, "Source verification"). Create `sources/VERIFIED.md`
(header only) in this session, and find the PDF-page offset
(PDF page = book page + offset) once the Markdown exists.

## 3. Register it

Add an entry to `courses/catalog.yaml` (`id`, `title`, `short`, `eyebrow`,
`blurb`, `hue` 0–5). Use `status: planned` to show it as "coming soon"
before its folder exists.

## 4. Plan the trail

Read the source's table of contents and chapter intros (grep the headings,
never the whole file). In `course.yaml`, one level per chapter (Chapter 1 =
the light intro level), each with planned lesson nodes (no `file:`): concept
lessons in the order the source builds them, guided problems from proofs
and worked examples, a traps round, an intuition round where formulas pile
up, then map, review and challenge. Exams get their own levels: plan
partial exams (`exam-partial`, or `exam-partial1`, `exam-partial2`, …) so no
exam covers more than 6 chapter levels, and `exam-final` after the last
chapter (planned nodes, no `file:`; rule in root `CLAUDE.md`, Exam),
with or without a professor's exam (root `CLAUDE.md`, Exam). Copy the
header comment of `courses/diff-geometry-gr/course.yaml` for the format.

## 5. Course CLAUDE.md

```markdown
# Course `<id>`: <title>

<who teaches it, what the main source is>. Everything in the root
`CLAUDE.md` applies; this file adds what is specific to this course.

## Sources (in `sources/`, git-ignored)
- Main reference: `sources/<file>.md` (chapters, appendices, where the
  proofs and worked examples are, how unproved results are marked).
- Exams: `sources/<folder>/`.

## Source verification (conversion errors)
The Markdown is machine-converted, so equations may be wrong. **Once per
range, when a lesson uses it:** render the PDF pages of that range
(`pdftoppm -r 110 -f P -l P -png sources/<file>.pdf <scratchpad>/pg`, then
view the PNGs), compare the formulas, boxes and numbers the lesson will
use against the Markdown, fix the Markdown, and log the range in
`sources/VERIFIED.md` (`ch/section, PDF pages, date, fixes`). Read
`sources/VERIFIED.md` first and skip any range already logged. Check
formulas and numbers, not prose. PDF page = book page + <offset>.

## Trail
`course.yaml`: one level per chapter. Status: `STATUS.md`.

## Notation and conventions
<the source's conventions to follow exactly: index placement, fonts,
symbols, sign conventions, units; special characters and how to write
them in KaTeX>.
Intro level glossary words: <the field's technical words to gloss>.
```

## 6. Check and ship

```sh
node tools/validate.mjs          # every course, including the new one
python3 -m http.server 8000      # the home page lists it; open #/<id>
```

Commit (never `sources/`), push, update the README course table, and give
Igor the prompt for the first lesson (Level 1's first concept lesson).

## Widgets

Reuse before building: `docs/widgets/README.md` lists every
widget. A new widget goes in `js/widgets/` as a general tool, documented in
`docs/widgets/<name>.md` (plus an index line), so every course can use it.
