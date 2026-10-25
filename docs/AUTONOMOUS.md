# Autonomous mode (agents, one unit each)

Read this only when Igor asks for several units in a row (e.g. "until the end
of Chapter 3" of a course). The main session is then a **lean coordinator**: it builds
nothing and reads nothing itself (no lesson files, no book, no docs), so its
context stays small. Igor reviews the level on the live site at the end.

- **Agent model = the session's own model and effort.** Pass `model` matching
  the model this session runs on (Sonnet session → `sonnet`, Opus session →
  `opus`) and leave `effort` unset so it inherits; never pick another model.
- For each unit, in `course.yaml` order and **strictly sequentially** (never
  in parallel), spawn one fresh agent whose prompt is the
  ready-to-paste unit prompt plus: "You are running autonomously: follow
  CLAUDE.md 'Building sessions' exactly, one unit only; you cannot ask Igor
  questions, so make reasonable choices and record them in the Log entry.
  Do not view screenshot images unless shots.mjs flags a card or the unit
  uses a widget preset never used before. Run commands from the repo root
  without `cd … &&` prefixes. At the end, validate, run shots, update
  the course's STATUS.md, commit and push, then reply with a report of at most 15
  lines (what was built, checks output, conventions fixed, doubts) followed
  by the next unit's prompt. When writing that prompt, decide explicitly
  whether a new widget would build intuition (CLAUDE.md: add a widget
  wherever manipulating something builds intuition); if yes, the next unit
  is that widget session and the lesson follows it. Never write 'No new
  widget' without a one-line reason."
- **Widgets are separate units, scheduled by the coordinator.** Before the
  first lesson of a level, the coordinator asks one agent to list, from the
  unit prompts' card plans, every widget card and whether an existing
  widget/preset fits; each missing widget becomes its own agent (widget
  unit, in `course.yaml` order *before* the lesson that uses it). If a lesson
  agent reports "needs widget", the coordinator spawns the widget agent and
  then sends the lesson agent back. A lesson agent never drops a planned
  widget card silently, and never writes "no widget fits" without naming the
  widgets it checked.
- **The unit prompt must carry the source rules**: the book's sign and
  symbols (no flipped signs), later material referred to by *name* (never
  "Levels 4 and 5"), and PDF verification of every formula or symbol used.
  Agents report any deviation as a doubt *and* fix it before committing.
- The coordinator also checks that `STATUS.md` Current matches the report
  (`sed -n '/^## Current/,/^## Log/p'`), not only the commit.
- Between units the coordinator only reads that report: it checks that
  validate and shots were clean and the commit was pushed (`git log -1
  --oneline`), and passes the agent's next-unit prompt on, adding any
  doubt worth carrying forward. If a check failed, it sends the same agent
  back (SendMessage) rather than fixing things itself.
- Traps, map and challenge agents grep the chapter's earlier lesson files
  (titles, card ids, key prompts; not whole files) so they build on what
  was actually taught.
- **Level audit (after the challenge, before stopping).** The coordinator
  spawns one fresh agent (same model rule) to audit every lesson file of the
  level, then fix what it finds, commit and push. Checklist:
  1. **Signs and symbols**: each formula and symbol matches the book (PDF
     pages, per the course `CLAUDE.md` "Source verification"); no quantity
     the book minimises is shown with a flipped sign; `sources/VERIFIED.md`
     lists what was checked (a prose-only check is redone against the PDF).
  2. **Level references**: no "Level N", "Levels N to M" or "Lesson N of this
     level" for later material; refer by name. Roadmap tables use the real
     level and lesson titles.
  3. **Planned widget cards**: every widget card in the unit prompts' plans
     exists in the lesson, or a widget unit was scheduled; no "no widget
     fits" without the widgets checked.
  4. **STATUS.md**: the Current block names the right next unit and matches
     the last report; it stays under ~40 lines.
  5. **Self-contained summaries**: every `own:` bullet shows its math and
     defines each symbol, chart and example it uses; no "the book" or
     section labels anywhere.
  6. **Intro-level rules** (Level 1 only): every technical word glossed at
     first use, guessing line in each opening card, cards guessable.
  7. `node tools/validate.mjs` and shots stay clean after the fixes.
  The agent fixes each problem itself (small `Edit`s), then reports a list
  of what it found and fixed, plus anything it could not decide.
- **Stop at the end of each level** (after the audit) and give Igor a
  summary of the units, any doubts, and the prompt to continue with the
  next level, so he can review the level on the live site first.
