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
- Between units the coordinator only reads that report: it checks that
  validate and shots were clean and the commit was pushed (`git log -1
  --oneline`), and passes the agent's next-unit prompt on, adding any
  doubt worth carrying forward. If a check failed, it sends the same agent
  back (SendMessage) rather than fixing things itself.
- Traps, map and challenge agents grep the chapter's earlier lesson files
  (titles, card ids, key prompts; not whole files) so they build on what
  was actually taught.
- **Stop at the end of each level** (after its challenge) and give Igor a
  summary of the units, any doubts, and the prompt to continue with the
  next level, so he can review the level on the live site first.
