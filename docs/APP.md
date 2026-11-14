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
  `trail.js`, `progress.js` (localStorage `gibernoot.progress.v2`, one state for all courses with keys prefixed `<courseId>:`, version-1 states migrated to `diff-geometry-gr:` on load, cloud merge and import; export/import codes, per-lesson resume position `partial`, Leitner
  spaced repetition), `main.js` (router), `render.js` (Markdown + KaTeX; short
  inline math keeps trailing punctuation on its line).
- `vendor/`: KaTeX, js-yaml, marked. No CDN, so the app works offline.
- Card images (`image:` on any card, `docs/IMAGES.md`): `cards.js` `images()` draws a captioned, credited `<figure>` from
  `courses/<id>/img/` (tap = lightbox); the same renderer serves lessons, review and exams. `tools/fetch-image.mjs`
  fetches free Commons images and keeps `img/credits.yaml`; `validate` checks alt, caption, credit, link, ledger, size, count.
- Player: back button, progress bar, synthesized feedback sounds
  (`js/sound.js`, toggle in the player header and settings; synced with the account via `progress.prefs`), varied
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
- Summary button: a built lesson's sheet shows **Summary** when its last card is
  the "what you now own" text (`own:` or a closing card titled "What you now own"
  / "Wrap-up"); it opens only that card in a floating window over the trail
  (`summaryCard` in `js/content.js`), recording nothing. Only finished lessons
  by default; the Settings toggle "Summaries" (`progress.prefs`, synced with the account) allows unfinished
  ones too. The trail does not scroll while the window is open.
- 8-bit look (`js/pixel.js`): course mascots (`SPRITES`, character grids, auto-outlined, two-frame walk sheet) and home
  banners (`BANNERS`, 96 x 28 scenes) drawn to tiny canvases and scaled with `image-rendering: pixelated`; picked per
  course by `mascot:`/`banner:` in `catalog.yaml` (validate checks the names). The mascot stands beside the next
  lesson node, walks in from the one before (skipped under reduced motion), hops on tap. Pixel font Jersey 10
  (`vendor/fonts`, OFL), Settings "Pixel style" (pref `pixelStyle`, `<html data-pixel>`): `all` (default: lessons too;
  KaTeX and widgets keep their fonts), `titles` (titles, labels, chips, buttons only), `off` (the
  older boolean pref `pixelFont: false` still maps to `off`).
- Academy pages (`js/pages.js`, routes `#/method`, `#/about`): text in `pages/<id>.md` (Markdown + math); the
  tab bar Courses · Method · About sits under the home header. Update `pages/method.md` when a feature changes.
- Medals (`js/medals.js`, route `#/medals`): `CATEGORIES` of series, each a ladder of `[need, name]` on one statistic
  computed from the progress store (retroactive): lessons, accuracy (90% / 100% first try, first run), streaks (best
  ever, `streak.best`), speed (first run in one sitting, 90%+, under `PACE` s per card: `lessons[..].pace`), levels
  cleared, maps, challenges, exams (50% / 90%), memory (`counts.reviews` + `counts.recaps`), courses (one per course,
  the mascot on a coin, plus explorer). Metal follows the rung (bronze to legendary), symbol follows the series, so each
  medal's 8-bit picture is unique. Earned ids are saved in `medals` with the day (merge keeps the earliest; never
  rename an id). `medalCheck()` runs after lessons, exams, reviews and on home/trail renders and pops toasts; the
  medal bar under the home and trail headers shows the count per category. New medals: add a rung or series there.
- Theme button cycling system/light/dark (`js/theme.js`); finishing a level challenge, or "Mark the level as known" on its sheet, marks the level's other lessons done with no score (`progress.markKnown`), instant tooltips via `data-tip`
  (`js/tooltip.js`), optional Google sign-in with Firestore sync
  (`js/cloud.js`, `docs/ACCOUNTS.md`; inactive until `js/firebase-config.js`
  is filled in).
- `tools/validate.mjs` (structure and KaTeX checks), `tools/shots.mjs`
  (headless screenshots and overflow check; see `courses/diff-geometry-gr/CONVENTIONS.md`, General, Tooling).
