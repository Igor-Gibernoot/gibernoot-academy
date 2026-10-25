# App engine

Static site, no build step, served by GitHub Pages from the repo root.

- Courses: `courses/catalog.yaml` lists them; each `courses/<id>/` holds
  its `course.yaml` and lesson files. `js/course.js` keeps the current
  course (set by the router from `#/<id>/...`) and `at(path)` builds its
  hashes; `content.js` loads from `courses/<id>/`; `home.js` is the course
  list (`#/`). Links without a course (`#/lesson/<id>`, from before
  courses) redirect to `LEGACY_COURSE`.
- `js/`: `cards.js` (card types), `widgets/` (interactive SVG/canvas
  widgets shared by all courses: one file per widget `<name>.js`, the
  shared SVG plane helpers `plane.js`, the registry `WIDGETS` in `index.js`), `player.js` (lesson flow and feedback),
  `trail.js`, `progress.js` (localStorage `gibernoot.progress.v2`, one state for all courses with keys prefixed `<courseId>:`, version-1 states migrated to `dg2gr:` on load, cloud merge and import; export/import codes, per-lesson resume position `partial`, Leitner
  spaced repetition), `main.js` (router), `render.js` (Markdown + KaTeX; short
  inline math keeps trailing punctuation on its line).
- `vendor/`: KaTeX, js-yaml, marked. No CDN, so the app works offline.
- Player: back button, progress bar, synthesized feedback sounds
  (`js/sound.js`, toggle in the player header and settings), varied
  encouraging messages and "N in a row" streaks.
- Trail: average first-try accuracy (overall chip and per level), level
  reviews (`#/review/<levelId>`), a hue per level (`data-hue` on `.level`,
  light/dark variants in `css/app.css`).
- Recap (`js/recap.js`, `#/recap`, `#/recap/<levelId>`): cloze review of the
  `own:` summaries of finished concept lessons (`docs/LESSON_FORMAT.md`,
  "Recap summaries"). `content.js` parses `{{ }}` blanks (`ownParts`,
  `blankHash`) and renders the last card from `own` (`expandLesson`).
  Blanks are items in `progress.recap` (`<lessonId>#<hash>` →
  `{ box, due, at, lapses, last }`), on the same Leitner boxes as the quiz
  deck; synced and merged like `cards`. Hidden per pass: first view a random
  half (≥ 1, one left showing if ≥ 3 blanks); later the due ones (missed,
  then new, then low boxes). A summary is offered while any blank is due or
  new; missed blanks come back once at the end of the session. The trail's
  Recap chip counts due blanks (it loads the finished concept lessons'
  files after the trail draws); level-review sheets get a Recap button.
- Light/dark toggle (`js/theme.js`), instant tooltips via `data-tip`
  (`js/tooltip.js`), optional Google sign-in with Firestore sync
  (`js/cloud.js`, `docs/ACCOUNTS.md`; inactive until `js/firebase-config.js`
  is filled in).
- `tools/validate.mjs` (structure and KaTeX checks), `tools/shots.mjs`
  (headless screenshots and overflow check; see `courses/dg2gr/CONVENTIONS.md`, General, Tooling).
