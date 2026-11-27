# Exams (`kind: exam`)

Moved from root `CLAUDE.md`. Read when planning or building an exam. Card format: `docs/LESSON_FORMAT.md`.

6. **Exam** (`exam`, own level, played by `js/exam.js`; format in
`docs/LESSON_FORMAT.md`). **No exam covers more than 6 chapter
levels** (Level 1, the intro, is never covered). With N chapter levels a
course has E = max(2, ⌈(N-1)/6⌉) exams: partial exams after the last
level of each block (its map, review, challenge come first) and the
**final** right after the **last chapter level**. Pick block boundaries
at planning time, as even as the topics allow, each ≤ 6 levels (N ≤ 13:
one partial after ⌈N/2⌉ covering Levels 2 to ⌈N/2⌉, the final covering
the rest; N = 14 to 19: two partials and a final, e.g. after Levels 7,
13, 19). Each exam covers the levels since the previous one. All are
planned in `course.yaml` from the start (levels `exam-partial`, or
`exam-partial1`, `exam-partial2`, … and `exam-final`; no `file:` until
built). **The next unit after such a level is always its exam**, before
the next chapter's first lesson; Current blocks must say so. Built from the professor's exam in `sources/` when there is
one; otherwise **write an original exam** from the course's lessons (same
format and rules, fresh numbers and setting, never a copy of a lesson
example or challenge; check every number twice by script). One session
per exam (its figure widgets first, in their own session). Rules:
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
