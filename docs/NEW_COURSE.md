# Adding a course

A course is content only: the engine, widgets, lesson kinds and teaching
method are shared (root `CLAUDE.md`). Setting one up is its own session
(no lessons in it).

## 1. Choose the id

Short, lowercase, digits and `-` only (e.g. `qft`, `stat-mech`). It is the
folder name, the URL segment (`#/<id>/...`) and the prefix under which
progress is stored, so **never rename it once the course is studied**.

## 2. Create the folder

```
courses/<id>/
  CLAUDE.md      course-specific rules (template below)
  course.yaml    the trail: title + one level per chapter, lessons as planned nodes
  STATUS.md      "## Current" block (next unit, conventions) and "## Log"
  sources/       git-ignored: the main reference (Markdown), exams, PDFs
  archive/       optional: old exercise sheets, notes worth mining
```

Put the sources in `sources/` (Igor copies them in, or points to them).
Convert the main reference to Markdown if it is only a PDF (never read
PDFs directly). Check `git status` shows nothing from `sources/`.

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
up, then map, review and challenge. Exams get their own levels. Copy the
header comment of `courses/dg2gr/course.yaml` for the format.

## 5. Course CLAUDE.md

```markdown
# Course `<id>`: <title>

<who teaches it, what the main source is>. Everything in the root
`CLAUDE.md` applies; this file adds what is specific to this course.

## Sources (in `sources/`, git-ignored)
- Main reference: `sources/<file>.md` (chapters, appendices, where the
  proofs and worked examples are, how unproved results are marked).
- Exams: `sources/<folder>/`.

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

Reuse before building: `grep -n '^####' docs/LESSON_FORMAT.md` lists every
widget. A new widget goes in `js/widgets/` as a general tool, documented in
`docs/LESSON_FORMAT.md`, so every course can use it.
