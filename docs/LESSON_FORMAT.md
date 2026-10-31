# Lesson format

Lessons are YAML files in `courses/<course>/<chapter>/`, registered in that
course's `courses/<course>/course.yaml` (courses are listed in
`courses/catalog.yaml`; new course: `docs/NEW_COURSE.md`). The engine (`js/`)
renders them for every course; adding a lesson never requires touching code
(unless it needs a new widget). Widgets are shared by all courses.

After any content change run:

```sh
node tools/validate.mjs <course>   # or no argument: every course
```

It checks structure, that build answers only use available tiles, and that
every `$...$` / `$$...$$` and every tile renders in KaTeX.

## Registering a lesson (`courses/<course>/course.yaml`)

```yaml
levels:
  - id: ch02
    number: 2
    title: Vector Spaces
    blurb: One line shown under the level title.
    lessons:
      - id: ch02-change-of-basis        # must equal the lesson file's id
        title: Same Arrow, Different Numbers
        kind: concept                   # concept | intuition | guided | traps | map | review | challenge
        file: ch02/change-of-basis.yaml # omit → shown as a planned node
        summary: One or two sentences shown before starting.
  - { id: ch06, number: 6, title: Covariant Derivative, status: unwritten }
```

Every level ends with three special nodes, in this order:

```yaml
      - { id: ch02-map, title: "Content Map: Vector Spaces", kind: map, file: ch02/map.yaml }
      - { id: ch02-review, title: Level Review, kind: review }        # automatic, never a file
      - { id: ch02-challenge, title: Level Challenge, kind: challenge, file: ch02/challenge.yaml }
```

- **map**: the content-map puzzle (format below). Build it once the level's lessons exist.
- **review**: automatic. It plays up to 12 questions from this level's lessons
  that the reader has already met, due and weak ones first (route `#/review/<levelId>`).
- **challenge**: an ordinary lesson file (any card types) with harder problems
  that **combine** several concepts of the level. Build it last.
- **exam** (`kind: exam`): a timed exam with **no feedback**, played by `js/exam.js`
  (not the lesson player). It sits in its **own level** (no chapter number):
  `{ id: exam-partial, eyebrow: Partial exam, hue: 3, title: …, lessons: [ … ] }`
  (`eyebrow` replaces "Level N", `hue` keeps the other levels' colours). The file:

  ```yaml
  id: exam-partial
  kind: exam
  minutes: 60            # time limit; a bar and clock count down, auto-submit at 0
  rules: |               # Markdown on the intro screen
  debrief: |             # Markdown on the results screen
  cards:                 # first card = setting (text); then questions
    - type: mcq          # any question type; `points: 0.5` weights it (score out of the sum)
      id: q1a
      tag: Question 1 · …
  ```

  Flow: intro -> run (answers kept, Back allowed, no Check, no feedback) -> submit
  slide (numbered chips, empty ones dashed) -> results (score, accuracy, **Exit exam**,
  debrief) -> review (each question in its checked state, correct answer, the
  misconception feedback and explanation). Unanswered questions, and everything left at
  time-up, count as wrong and show the correct answer. On submit the lesson is completed
  (accuracy = questions right / total) and every question enters the review deck.
  Not saved mid-exam: leaving loses the attempt. Question cards need no hints beyond
  the original exam's; cards may use `explanation` and wrong-option `feedback` as usual
  (they only appear in the review). Final exam: same layout, a new level after the last chapter.

## Lesson file

```yaml
id: ch02-change-of-basis
title: Same Arrow, Different Numbers
kind: concept
cards:
  - type: text
    id: hook            # every card needs a unique id (review keys use it)
    ...
```

**Never rename the `id` of a card that has been played**: progress and the
review deck are keyed by `<lessonId>/<cardId>`.

## Card types

Any card also takes `image:` (a captioned, credited picture): see `docs/IMAGES.md`.

Shared optional fields: `title` (heading), `tag` (small label above the card).
Question cards also take `explanation` (shown after a correct answer or
"Show answer") and `review: false` (keep out of the spaced-repetition deck:
use it when the card only makes sense right after the previous card, such as a
question about a widget).

Question prompts, hints and feedback **must be self-contained**, because review shows them alone,
weeks later and out of order. Restate the setup ("With $\hat{y}_i = 2\cdot\hat{x}_i$…")
instead of saying "in the previous card". The validator warns about phrases such as
"previous card", "last lesson" or "as shown above".

**Never name a colour that changes with the theme** (the app has light and dark
modes: "the black arrow" is white in dark mode). Refer to labels ("the arrow
labelled $\mathcal{X}$") or to the fixed hues: basis vectors are **purple**,
vector components **blue**, covectors **orange**.

### `text`
```yaml
- type: text
  id: why-bases
  title: Why bases exist at all
  body: |
    Markdown with $inline$ and $$display$$ math.
```

### `mcq`
```yaml
- type: mcq
  id: J-doubled
  prompt: |
    Markdown question.
  multiple: false        # true → "select all that apply"
  shuffle: true          # false keeps the order (True/False questions)
  options:
    - text: '$\tfrac12$'
      correct: true
    - text: '$2$'
      feedback: |
        Why this tempting answer is wrong: the misconception, explained.
  explanation: |
    Full reasoning, shown once answered.
```
Every wrong option should carry `feedback` that names the misconception behind it.

### `numeric`
```yaml
- type: numeric
  id: shear
  prompt: |
    ... What is $y^1$?
  answer: -1
  tolerance: 0.001       # optional; default ~1e-6
  answerText: '-1'       # optional; shown on "Show answer"
  unit: 'm'              # optional, shown after the input
  wrong:                 # optional: targeted feedback for common wrong values
    - value: 0
      feedback: ...
  hint: Shown after a wrong answer with no specific feedback.
  explanation: ...
```
The reader may type decimals or fractions (`1/2`). A `wrong` value matches
within 0.5% of itself (at least the card's tolerance; override with its own
`tolerance:`), so rounded inputs such as 1.36 for $e/2$ still get its feedback.

### `build` — assemble an expression from tiles
```yaml
- type: build
  id: build-contra
  prompt: Build the law ...
  prefix: 'y^j ='                 # fixed TeX before the slots (optional)
  suffix: ''                      # fixed TeX after (optional)
  tiles: ['\sum_{i=1}^d', '\sum_{j=1}^d', 'J_i^j', '(J^{-1})_i^j', 'x^i', 'x^j']
  answers:                        # every accepted sequence (commuted factors!)
    - ['\sum_{i=1}^d', 'J_i^j', 'x^i']
    - ['\sum_{i=1}^d', 'x^i', 'J_i^j']
  wrong:
    - answer: ['\sum_{i=1}^d', '(J^{-1})_i^j', 'x^i']
      feedback: Targeted explanation.
  hint: ...
  explanation: ...
```
Tiles are TeX strings. Include distractor tiles that encode real
misconceptions (wrong index position, $J$ vs $J^{-1}$, the wrong summed index).
Each tile can be used once; list a tile twice if it is needed twice.

### `order` — put steps (e.g. of a proof) in order
```yaml
- type: order
  id: invariance-proof
  prompt: Put the proof in order.
  steps:                         # in the CORRECT order; shown shuffled
    - '$\displaystyle\sum_j \mathtt{y}_j\, y^j$'
    - '$\displaystyle= \dots$'
  hint: ...
  explanation: ...
```

### `widget`
```yaml
- type: widget
  id: playground
  title: Play with it
  widget: basis-playground
  config: { vector: [3, 2], covector: [1, 0.5], basis: [[1,0],[0,1]], snap: 0.5,
            presets: [{ label: Shear, basis: [[1,0],[1,1]] }] }
  body: |
    Instructions: what to drag and what to watch.
```
**Widget design rule: stable layout.** Nothing a widget shows may change the position or size of its drawing while the reader drags or presses a preset. The engine (`mountWidget` in `js/widgets/index.js`) keeps every `.readout` at the tallest height it has had, so readout text may vary freely; but a widget must also (1) never add or remove elements *above* its drawing, (2) give any text or badge that appears in the drawing area a reserved slot (hide with `visibility`, not `display`/removal), (3) keep SVG sizes independent of the data (fixed `viewBox`, no auto-fit to the content), and (4) put a conditional message in the readout, not between the drawing and the controls. Test: drag through the extreme values and check that the SVG's `getBoundingClientRect().top` never changes (`node tools/widget-smoke.mjs` does this).

**Widget design rule: everything a widget draws is optional.** Each visual part (arrows, rings, readout rows, labels) has a config option that hides it, so a card shows exactly what its text discusses. A card text must never say "ignore the ... arrows": add the option to the widget (header comment + this file) and set it in the card. Every option must be read in the widget's source (a config key the source never mentions is silently ignored). `node tools/validate.mjs` warns about both: a config key unused by the widget, and "ignore ..." wording around a widget card.

Widgets live in `js/widgets/` (shared by all courses): one file per widget, named after it (`chart-basis.js`, its header comment lists its config), shared SVG helpers in `plane.js` (`s`, `fmt`, `P`, `line`, `arrow`, `label`, `planeSvg`, `draggable`, `placeHandle`, …), and the registry `WIDGETS` in `index.js` (import the new file and add one line). Follow a
widget card with a question about what the reader observed.

Available widgets: the index is `docs/widgets/README.md`, one file per widget
in `docs/widgets/<name>.md` (config, presets, examples); read only the ones
you use. Plane widgets give coordinates as components in the reference basis
$\hat{x}_1, \hat{x}_2$; draggable tips snap to a grid of `snap`, 0 = free.

## Recap summaries (`own:`)

A concept lesson may carry `own:`, the text of its closing "what you now
own" summary (Markdown with math), with its key expressions marked
`{{ … }}`. It is the single source of truth for two things:

1. **The lesson's last card**, which must be a `text` card. It shows `own`
   with the markers stripped (content kept), titled "What you now own"
   unless the card sets `title:`. The card's own `body`, if any, is
   appended after it: put only the teaser ("**Next:** …") there.
2. **The Recap** (`#/recap`, `#/recap/<levelId>`; button on the trail and in
   each level-review sheet). A recap card shows the lesson title and the
   summary with some blanks replaced by tappable placeholders; the learner
   recalls each, taps to reveal it, and rates "Knew it" / "Missed".

**Self-contained:** every symbol, chart, map and example the summary recalls must be defined in it (with its type), since it is read alone and as Recap blanks. Restate the setup of any example before its formula.

```yaml
id: ch06-christoffel
kind: concept
own: |
  - **Coefficients**: in a chart a connection is fixed by
    {{ $\nabla_{\partial x_k}\partial x_j = \Gamma^i_{jk}\,\partial x_i$ }}.
  - **Not a tensor**: they transform with {{ an inhomogeneous second-derivative term }}.
  - **Law**:
  {{ $$(\nabla_\mathcal{X}\mathcal{Y})^i = \mathcal{X}(\mathcal{Y}^i) + \Gamma^i_{jk}\mathcal{Y}^j\mathcal{X}^k$$ }}
cards:
  - ...
  - type: text
    id: summary
    body: |
      **Next:** …
```

Mechanics:
- Only marked spans can be hidden; chance only picks *which* marked spans
  are hidden on a pass. Markers are recognized outside math only (inside
  `$…$` a `{{` is TeX); a blank may hold inline math, prose, or a whole
  `$$…$$` display (shown as a full-width placeholder).
- Each blank is a spaced-repetition item with key
  `<lessonId>#<hash>`, the hash of its text after trimming and collapsing
  whitespace. Editing text outside a blank keeps its progress; editing the
  blank itself starts a new item. The same expression twice in one summary
  is one item (both copies hide and reveal together).
- Only lessons the learner has finished are recapped.

**Marking rules** (the author chooses the marks):
- Mark main results: definitions, the central law, a defining property. Not
  notation introductions, not intermediate algebra.
- 3–6 blanks per summary (the validator requires at least 2 and warns
  outside 3–6; markers balanced, no nesting, no empty blank).
- Each blank must be recallable from its own sentence: the words around it
  say what to state.
- No two blanks that give each other away (e.g. a law and its special case
  in the next clause: mark one).
- Prefer whole formulas over bare symbols: `{{ $\nabla_{\mathcal{X}_p}f = \mathcal{X}_p(f)$ }}`,
  not `{{ $\nabla$ }}`.
- Phone-safe layout applies as everywhere: a long blank goes on its own
  `$$…$$` line.

## Content-map lessons (`kind: map`)

The file describes a graph; the engine turns it into cards: an intro, one
"which card belongs in this box?" question per node (in the order listed),
and the finished map. Each node's correct card competes with decoys that hide
a classic mistake, so every decoy needs `feedback`.

```yaml
id: ch02-map
title: "Content Map: Vector Spaces"
kind: map
name: Chapter 2, Vector Spaces     # used in the (self-contained) review prompts
intro: |
  Markdown shown before the puzzle.
cols: 3                            # grid columns
nodes:                             # build order = list order
  - id: basis                      # card id becomes node-basis: never rename
    title: 'Basis $\{\hat{x}_i\}$'
    row: 2                         # 1-based grid position
    col: 2
    span: 1                        # optional, columns the box spans
    body: |
      The correct card (Markdown, short: it is shown as an option).
    decoys:                        # 2 is a good number
      - body: |
          Same card with one subtle mistake.
        feedback: |
          Why it is wrong.
    explanation: |
      Optional: why this concept sits here, what it connects to.
edges:                             # arrows: from a concept to one built on it
  - [space, basis]
  - { from: maps, to: cob, dashed: true }   # dashed = "tool used in"
  - { from: space, to: dual, label: dual space }  # optional label on the arrow
outroTitle: Chapter 2 in one picture
outro: |
  Markdown shown under the finished map.
```

Lay the grid out so that no arrow passes behind a box. An edge `label` (inline
Markdown, 1–3 words, read as "from *label* to") sits at the middle of its arrow,
in the gap between rows; any label widens the row gap. Keep labelled arrows
between different rows: two side-by-side boxes leave no room for one. Keep decoys parallel to
the correct card (same format and length) so the reader has to read the details.

## Phone-safe layout (get it right on the first try)

The phone stage is about 320 px wide: a display line holds roughly **25–30
characters of rendered math** (a sum with limits counts as about 3). Anything
longer scrolls sideways. These rules apply to **every** string that holds math:
body, prompt, options, `explanation`, `hint`, `feedback`, map cards.

- **One relation per `$$` line.** Two equations go on two `$$` lines joined by
  prose ("and", "so"), never side by side with `\qquad`, `,\;` or `\text{and}`
  (spacing only makes the line wider).
- **Chains of equalities: use `aligned`**, one step per line, aligned at `=`:
  ```
  $$\begin{aligned}
  \mathsf{X}(\mathcal{X}) &= \sum_{i=1}^d \mathtt{x}_i\, x^i \\
  &= \mathtt{x}_1 x^1 + \mathtt{x}_2 x^2
  \end{aligned}$$
  ```
- **Lists of unrelated formulas** (definitions, a map's rule): use `gathered`,
  one per line.
- **No prose inside display math.** Move "(from the shear)" or
  `\text{for all } i` out into the sentence before or after.
- **Long right-hand sides**: break after an operator (`+`, `=`) inside
  `aligned`, not in the middle of a product.
- **Inline math** wraps only between formulas, so keep each `$...$` short
  (a symbol or a short equation); a long one belongs on a `$$` line.
- **Build cards**: the prefix plus all answer tiles must fit one line. Keep
  the prefix short (`'T_{ij} ='`), and prefer at most about 6 answer tiles.

New widgets: draw planes with `planeSvg` (it clips the layers to the plane and
the CSS caps the SVG height so the readout stays on screen on desktop); keep the
readout to a few short lines, each one formula.

## YAML gotchas

- Put TeX in **single quotes** (`'J_i^j'`) or block scalars (`|`). Never use
  double quotes: `"\sum"` breaks because YAML reads `\s` as an escape.
- Inside single quotes write an apostrophe as `''`.
- A plain (unquoted) value cannot contain `: ` or start with `[`, `{`, `*`, `&`, `!`, `|`, `>`, `'`, `"`, `%`, `@`.
  When in doubt, quote.

## Testing locally

```sh
python3 -m http.server 8000      # then open http://localhost:8000
```
`http://localhost:8000/#/lesson/<id>/<n>` jumps straight to card *n*.
