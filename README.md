# Gibernoot Academy

Interactive, problem-based study trails, one per course, all built on the
same engine. Each course is a trail of levels (one per chapter), each made
of short lessons:

- **concept lessons** that start from a puzzle and build the idea from first principles,
- **guided problems** broken into small steps,
- **trap rounds** built on common misconceptions,
- **intuition** rounds for quick recall of the main formulas,
- and, at the end of each level, a **content-map puzzle**, a **level review** and a **challenge**,
- plus timed **exams** modelled on real ones.

Every answered question joins the course's spaced-repetition review deck, and
the "what you now own" summaries come back as recaps with blanks. Progress is
stored in the browser and can be moved between devices with an export code, or
synced through an optional Google sign-in ([`docs/ACCOUNTS.md`](docs/ACCOUNTS.md)).

**Play it:** https://igor-gibernoot.github.io/gibernoot-academy/

## Courses

| Course | Folder |
| --- | --- |
| From Differential Geometry to General Relativity | [`courses/dg2gr/`](courses/dg2gr/) |
| Active Inference | [`courses/active-inference/`](courses/active-inference/) |

## Layout

```
index.html, css/, vendor/   app shell, styles, KaTeX / js-yaml / marked (no CDN)
js/                         the engine (router, player, cards, exams, recap, progress)
js/widgets/                 interactive widgets, shared by every course
courses/catalog.yaml        the course list shown on the home page
courses/<id>/               one course: course.yaml, lesson files, STATUS.md, CONVENTIONS.md, CLAUDE.md
tools/                      validate.mjs (structure + KaTeX), shots.mjs (headless layout check), widget-smoke.mjs
docs/                       lesson format, app engine, how to add a course
```

Run locally:

```sh
python3 -m http.server 8000   # open http://localhost:8000
node tools/validate.mjs       # check every course (or: node tools/validate.mjs dg2gr)
```

Lesson authoring format: [`docs/LESSON_FORMAT.md`](docs/LESSON_FORMAT.md).
Adding a course: [`docs/NEW_COURSE.md`](docs/NEW_COURSE.md).
