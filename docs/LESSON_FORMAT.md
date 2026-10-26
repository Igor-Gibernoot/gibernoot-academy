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
Widgets live in `js/widgets/` (shared by all courses): one file per widget, named after it (`chart-basis.js`, its header comment lists its config), shared SVG helpers in `plane.js` (`s`, `fmt`, `P`, `line`, `arrow`, `label`, `planeSvg`, `draggable`, `placeHandle`, …), and the registry `WIDGETS` in `index.js` (import the new file and add one line). Follow a
widget card with a question about what the reader observed.

Available widgets (all coordinates are components in the reference basis
$\hat{x}_1, \hat{x}_2$; draggable tips snap to a grid of `snap`, 0 = free):

#### `basis-playground`
A fixed vector $\mathcal{X}$ (and optionally a covector, drawn as its level
lines) in the plane. The reader drags the new basis $\hat{y}_1, \hat{y}_2$;
the components $y^i$, the covector components $\mathtt{y}_i$ and their pairing
update live. Parallel basis vectors trigger a "not a basis" warning.
```yaml
config:
  vector: [3, 2]              # 𝒳 in the old basis
  covector: [1, 0.5]          # optional: covector components in the old dual basis
  dual: 1                     # optional, 1 or 2: draw the level lines of the dual
                              # basis covector ŷ^k and show it in the old dual basis
  basis: [[1, 0], [0, 1]]     # initial ŷ1, ŷ2
  snap: 0.5
  presets: [{ label: Shear, basis: [[1, 0], [1, 1]] }]
```

#### `machine-playground`
A tensor as a machine with slots: the reader drags the input vector(s) and
watches the output number. Buttons: **Reset**, **Double 𝒳**, and with two
slots **Double both**, plus the presets.
```yaml
config:
  slots: 1                    # 1: a covector eats 𝒳. 2: a (0,2)-tensor eats 𝒳 and 𝒴
  covector: [1, 0.5]          # slots 1: X(𝒳) = 1 x^1 + 0.5 x^2, drawn as level lines
  name: L                     # slots 1: the covector's letter (sans-serif), default X;
                              # slots 2: the tensor's letter, default T
  tensor: [[0, 1], [-1, 0]]   # slots 2: components T_ij, row i = first slot
                              # (the default [[0,1],[-1,0]] is the signed area)
  area: true                  # slots 2: shade the parallelogram spanned by 𝒳 and 𝒴
  partial: true               # slots 2: draw T(𝒳, ·) as level lines and show its
                              # components (fill one slot, get a covector)
  u: [2, 1]                   # initial 𝒳
  v: [0, 2]                   # initial 𝒴 (slots 2)
  snap: 0.5
  presets: [{ label: Along a line, u: [1, 2] }]   # u, v optional: keep the current inputs
                              # slots 2: a preset may also set tensor: [[..],[..]]
                              # (Reset restores the configured tensor)
```
The readout shows the inputs, the formula of a covector and its evaluation
$\mathsf{X}(\mathcal{X}) = \dots$ (slots 1), or $T(\mathcal{X}, \mathcal{Y})$
(slots 2).

#### `map-builder`
Two finite sets, the domain $\mathcal{M}$ on the left and the target
$\mathcal{N}$ on the right, with one arrow per domain element. Tapping a domain
element moves its arrow to the next target element; the readout says whether
the map is injective, surjective and bijective (and lists $\phi^{-1}$ when it
exists), with the reason.
```yaml
config:
  domain: ['a', 'b', 'c']
  target: ['1', '2', '3']
  map: [0, 0, 1]              # index in target of each domain element's image
  presets: [{ label: '3 → 4', domain: ['a','b','c'], target: ['1','2','3','4'] }]
                              # a preset's map is optional (all to the first element)
```

#### `ball-probe`
Is a set open? The reader drags a point $p$ and sets the radius $r$ with a
slider; the ball $B_r(p)$ is drawn and the part outside the set $\mathcal{U}$
(gold) turns red. The readout says whether the ball fits and the largest radius
that does. With an ambient space (an interval $\mathcal{N}$, or the circle
$S^1$ for an arc) the ball is cut down to it (inherited topology): the part
outside is faded, and $\mathcal{U}$ is judged both in the subspace and in
$\mathbb{R}$ or $\mathbb{R}^2$.
```yaml
config:
  dim: 1                      # 1: the real line; 2: the plane
  set: { a: 0, b: 1, closed: [true, false] }   # dim 1: an interval (a, b: null = ±∞)
  # dim 2: { shape: disc, center: [0, 0], radius: 2, closed: false }
  #      | { shape: halfplane, closed: false }              (second coordinate > 0)
  #      | { shape: arc, from: 0, to: 180, closed: [false, false] }  (unit circle, degrees)
  ambient: { a: 0, b: 2, closed: [true, false] }  # dim 1, optional: the space 𝒩 ⊇ 𝒰
  name: '\mathcal{U}'         # TeX names (ambientName for 𝒩)
  view: [-0.5, 1.5]           # dim 1: x range; dim 2: { x, y, w, h }
  p: 0                        # dim 1 number; dim 2 [x, y]; arc: angle in degrees
  r: 0.3
  rMax: 1                     # slider maximum
  snap: 0.05                  # grid for p (defaults 0.05, 0.1, arc 5°)
  presets: [{ label: '[0, 1]', set: {...}, p: 1, r: 0.2 }]   # ambient optional
```
Don't mix arc and non-arc sets in one widget's presets (the view scale differs).

**Pair mode** (Hausdorff separation, `dim: 2` only): `pair: true` drops the set
and shows two draggable points $p$ and $q$ with balls of the same radius $r$.
The balls turn red while they overlap; the readout gives $\lVert p - q\rVert$
and says they are disjoint exactly when $r \le \lVert p - q\rVert / 2$.
```yaml
config:
  dim: 2
  pair: true
  p: [-1, 0]                  # first point
  q: [1.5, 0.5]               # second point (default [2, 1])
  r: 1.5
  rMax: 3
  view: { x: -3.5, y: -3, w: 7, h: 6 }   # optional
  presets: [{ label: Close, p: [0, 0], q: [0.4, 0], r: 0.5 }]   # p, q, r optional
```

#### `preimage-explorer`
Continuity through preimages. The graph of a fixed map $\mathbb{R}\to\mathbb{R}$;
the reader drags the two ends of an open interval $\mathcal{V}$ (gold band) on
the vertical axis. The part of the graph inside the band is highlighted and the
preimage $\text{preim}(\mathcal{V})$ is drawn on the horizontal axis (filled end
dot = that end belongs to the preimage). The readout writes the rule, $\mathcal{V}$,
the preimage, and whether it is open (a filled end is a point with no room).
```yaml
config:
  fn: linear                  # linear (2x + 1) | step (H: 0 for x < 0, 1 for x ≥ 0)
                              # | square (x²) | const (1)
  V: [0.5, 1.5]               # ends of the open interval V (a < b)
  view: { x: -3, y: -1.5, w: 6, h: 4.5 }   # model units
  snap: 0.1                   # grid for the ends of V
  presets: [{ label: Jump, fn: step, V: [0.5, 1.5] }]   # fn, V optional
```
New maps go in `FUNCS` in `js/widgets/preimage-explorer.js` (rule text, formula, jump points).

#### `circle-charts`
Two charts on the unit circle $S^1$. Chart A (blue ring outside the circle) is
the angle $\theta \in (0, 2\pi)$ on $\mathcal{U} = S^1 \setminus \{(1,0)\}$;
chart B (orange ring inside) is the angle $\varphi \in (-\pi, \pi)$ on
$\mathcal{V} = S^1 \setminus \{(-1,0)\}$. Each missing point is a hollow dot
in its chart's hue; the overlap $\mathcal{U}\cap\mathcal{V}$ is gold on the
circle, in two pieces ("upper", "lower"). The reader drags $p$ (gold) around
the circle; small arcs at the centre show $\theta(p)$ and $\varphi(p)$
(negative $\varphi$ runs clockwise). A second panel graphs the transition map
$\varphi(\theta)$ on the overlap: $\varphi = \theta$ on $(0,\pi)$,
$\varphi = \theta - 2\pi$ on $(\pi, 2\pi)$, with the jump at $\theta = \pi$
and $p$ marked on it. The readout gives $p$, both coordinates (as multiples of
$\pi$ when the angle is a multiple of 15°), "undefined: $p \notin \mathcal{U}$"
at a missing point, and which piece's formula applies. With `stereo: true`,
chart B is the stereographic projection $\sigma = x/(1-y)$ from the north pole
on $\mathcal{V} = S^1 \setminus \{(0,1)\}$: the dashed ray from $(0,1)$ through
$p$ hits the horizontal axis at $\sigma(p)$, the overlap pieces are
$\theta \in (0, \pi/2)$ and $(\pi/2, 2\pi)$, and the graph is
$\sigma = \cos\theta/(1-\sin\theta)$ with its asymptote at $\theta = \pi/2$.
On a phone the two panels stack.
```yaml
config:
  angle: 60                 # p, in degrees from (1,0) counterclockwise
  show: both                # both | A | B (one chart alone: no overlap, no graph)
  stereo: false             # chart B = stereographic projection from (0,1)
  snap: 5                   # degrees p snaps to (0 = free; keep a divisor of 90
                            # so p can land on the missing points)
  presets: [{ label: Lower piece, angle: 240 }, { label: Chart A only, show: A }]
```

#### `curve-velocity`
The velocity of a curve as the derivative of functions along it. A fixed point
$p$ (gold) in the plane, or with `circle: true` on the unit circle $S^1$ with
the angle chart $\theta \in (0, 2\pi)$ (the missing point $(1,0)$ is a hollow
dot). Two curves pass through $p$ at $\lambda = 0$, $\gamma_1$ solid and
$\gamma_2$ dashed (labelled on the drawing):
plane $\gamma(\lambda) = p + \lambda v + \lambda^2 a$ with $v, a \in \mathbb{R}^2$;
circle $\theta(\gamma(\lambda)) = \theta_p + \lambda w + \lambda^2 a$ (drawn
slightly outside / inside the circle so both stay visible). Each curve has a
blue handle at the tip of its velocity arrow (sets $v$, or $w$) and a hollow
handle at $\gamma(-1)$ that bends the curve (sets $a$) without moving the
arrow. Small dots mark $\lambda = \pm 0.5, \pm 1$, so their spacing shows speed.
When both arrows coincide, the handle on top is $\gamma_2$'s. Buttons choose
the scalar field $f$: $x$, $y$, $x^2 + y$, $\theta$ (polar angle in $(0,2\pi)$;
on $S^1$ it is the chart itself). In the plane the level lines
$f = f(p) + n/2$ (rays every $\pi/12$ for $\theta$) are dashed orange.
A second panel graphs $\lambda \mapsto f(\gamma(\lambda))$ for both curves
(vertical axis shifted so $f(p)$ sits at the origin) with their tangent lines
at $\lambda = 0$ in blue: equal velocities give tangent graphs. The readout
gives $f$, $p$, and per curve its formula, its components in blue
($(v^1, v^2)$ for the chart $(x, y)$, or $v^\theta$ on $S^1$; these are
$v^i = (\mathscr{X}^i\circ\gamma)'(0)$) and $(f\circ\gamma)'(0)$; with
`chain: true` a line $= \partial_1 f(p)\cdot v^1 + \partial_2 f(p)\cdot v^2$ in
numbers (on $S^1$: $\partial_\theta(f\circ\theta^{-1})\cdot v^\theta$). A badge
says "Same velocity" (all components equal), "Equal on this $f$ only" (the
two numbers agree but the components differ), or "Different velocities".
```yaml
config:
  circle: false               # S¹ with the θ chart instead of the plane
  p: [1, 1]                   # the point (plane); view is centred on it
  angle: 60                   # the point in degrees (circle; never 0)
  curves:                     # plane: v, a in R²; circle: { w, a } numbers
    - { v: [1, 0.5], a: [0, 0] }
    - { v: [1, 0.5], a: [0, -0.75] }
  bend: true                  # false: no bend handles (curves stay as given)
  f: x2y                      # x | y | x2y (x² + y) | theta
  fields: [x, y, x2y, theta]  # field buttons offered
  graph: true                 # panel of λ ↦ f(γ(λ))
  chain: false                # expand (f∘γ)'(0) = Σ ∂_i f(p) v^i
  snap: 0.25                  # grid for v, a (circle: w, a)
  view: { x: -1.5, y: -1.5, w: 5, h: 5 }   # optional (plane)
  presets: [{ label: Faster, curves: [{ v: [1, 0.5] }, { v: [2, 1] }], f: x }]
```
Circle defaults: `curves: [{ w: 1, a: 0 }, { w: 1, a: 0.5 }]`. Keep $|w| \le 1$
in configs so arrows stay inside the drawing. New fields go in `CV_FIELDS`
(`js/widgets/curve-velocity.js`: TeX, button name, value, gradient in $\mathbb{R}^2$).

#### `chart-basis`
Chart-induced bases and the Jacobian in the plane $\mathbb{R}^2$ (points
$q = (q_1, q_2)$). One or two charts are drawn as their coordinate lines
(first chart solid, second dashed; the two lines through $p$ darker), around a
draggable point $p$ (gold). At $p$ each chart's basis vectors
$(\partial/\partial\mathscr{X}^i)_p$ are purple arrows (second chart dashed),
labelled on the drawing: the velocity at $\lambda = 0$ of the coordinate curve
$\lambda \mapsto \mathscr{X}^{-1}(\mathscr{X}(p) + \lambda e_i)$, so tangent to
the coordinate lines (column $i$ of $(D\mathscr{X})^{-1}$). A draggable blue
velocity $v$ at $p$ is the velocity of $\gamma(\lambda) = p + \lambda v$.
Chart presets: `cartesian` ($\mathscr{C}$, coordinates $x, y$), `polar`
($\mathscr{P}$, coordinates $r, \theta$ with $\theta \in (0, 2\pi)$), `X`
($\mathscr{X}(q) = (2q_1, -q_2)$) and `Y` ($\mathscr{Y}(q) = (q_1, q_2e^{q_1})$),
the C.3 pair. A polar chart takes `cut: right` (default, $\theta \in (0, 2\pi)$,
undefined on the half-line $q_2 = 0$, $q_1 \ge 0$) or `cut: left`
($\theta \in (-\pi, \pi)$, undefined for $q_1 \le 0$); its cut is drawn dotted.
$p$ can go anywhere: when it leaves a chart's domain (the cut, the origin),
that chart shows no basis and no components, the readout says why, and the
Jacobian is replaced by "needs $p$ in the domains of both charts".
The readout gives $p$, $v$, and per chart its rule, $\mathscr{X}(p)$ and the
components $(\mathscr{X}^i\circ\gamma)'(0)$ in blue; with two charts the
Jacobian $(\partial\mathscr{Y}^i/\partial\mathscr{X}^j)_p$ in numbers (row $i$,
column $j$, the book's convention: $\dot\gamma^i_\mathcal{V} = \sum_j
(\partial\mathscr{Y}^i/\partial\mathscr{X}^j)_p\,\dot\gamma^j_\mathcal{U}$) and
the line "Components in $\mathscr{Y}$ = Jacobian $\cdot$ components in
$\mathscr{X}$"; `chain: true` adds the product in numbers (column = matrix
times column). With `basisOnly: true`, $v$ and the components are hidden and
`chain` instead expands each $(\partial/\partial\mathscr{X}^i)_p =
\sum_j (\partial\mathscr{Y}^j/\partial\mathscr{X}^i)_p\,(\partial/\partial\mathscr{Y}^j)_p$
in numbers (column $i$ of the Jacobian). `inverse: true` also shows
$(\partial\mathscr{X}^i/\partial\mathscr{Y}^j)_p$. `jacobian: false` hides the
Jacobian and the component-law lines (for cards before the Jacobian is taught). Check (C.3, $p = (1,1)$,
$v = (1,2)$): $\mathscr{X}$-components $(2, -2)$, $\mathscr{Y}$-components
$(1, 3e) \approx (1, 8.15)$, Jacobian $\begin{pmatrix} 1/2 & 0 \\ e/2 & -e\end{pmatrix}$.
```yaml
config:
  charts: [X, Y]              # one or two of cartesian | polar | X | Y, or
                              # { chart: polar, name: '\mathscr{Y}', steps: [0.5, 0.3927], cut: left }
                              # (name: the chart letter; steps: line spacing per coordinate;
                              # cut: right = theta in (0, 2pi), left = theta in (-pi, pi))
  p: [1, 1]                   # the point; the default view is 5 × 5 centred on it
  v: [1, 2]                   # the velocity, standard components of R²
  basisOnly: false            # hide v and the components
  chain: false                # the law in numbers (components; basis law if basisOnly)
  inverse: false              # also the inverse Jacobian
  dragP: true                 # p draggable
  lines: 8                    # at most this many coordinate lines each side of p
  snap: 0.25                  # grid for p and the tip of v
  view: { x: -1.5, y: -1.5, w: 5, h: 5 }   # optional
  presets: [{ label: Polar, charts: [cartesian, polar], p: [1, 1], v: [1, 0] }]
```
Default steps: cartesian $(0.5, 0.5)$, polar $(0.5, \pi/8)$, `X` $(1, 0.5)$,
`Y` $(0.5, 1)$. Where the lines of one coordinate get closer than about
$0.14$ view units (the `Y` lines $q_2 = c\,e^{-q_1}$ for large $q_1$, the polar
rays near the origin), only every 2nd (4th, …) line continues, so they thin
out instead of crowding. Labels are placed automatically beside or beyond the
arrow tips, avoiding the arrows (including $v$), $p$ and each other. New charts go
in `CB_CHARTS` (`js/widgets/chart-basis.js`: name, coordinate TeX and glyphs, rule, map,
inverse, Jacobian of the map, steps).

#### `parallel-transport`
Parallel transport and autoparallels in the plane. A curve $\gamma$ (preset)
is drawn with a slider for $\lambda$ (and a Play button); a vector $\mathcal{Z}$
starts at $\gamma(\lambda_0)$ ($\lambda_0$ = start of the range; the start
vector is faded, labelled "start", its tip draggable) and is parallelly
transported along $\gamma$ under the chosen connection: $\nabla^{\mathrm{E}}$
keeps its cartesian components constant, $\nabla^{\mathrm{P}}$ its polar
components (chart $\mathscr{Y} = (r, \theta)$, $\theta \in (-\pi, \pi)$, cut
$b = 0,\ a \le 0$ drawn dotted). $\nabla^{\mathrm{P}}$ exists only on the polar
chart's domain: where the curve reaches the cut or the origin the transport
stops (warning "at $\lambda \approx \dots$ the curve leaves the polar chart's
domain") and $\mathcal{Z}$ is no longer drawn. A faded trail shows $\mathcal{Z}$
at 7 earlier parameters; $\mathcal{Z}$ is blue, the velocity $v_\gamma$ (ink) and
the acceleration $a_\gamma = \nabla_{v_\gamma}v_\gamma$ (ink, dashed) start at the
gold point $\gamma(\lambda)$; `showBasis` adds $\partial y_1, \partial y_2$ in purple.
The readout gives $\mathcal{Z}$, $v_\gamma$, $a_\gamma$ as combinations of
$\partial x_k$ ($\mathscr{X}$, cartesian) and $\partial y_k$ ($\mathscr{Y}$), the
transport equation $\dot z^k + \Gamma^k_{ji} z^j\dot\gamma^i = 0$ in numbers in
the chart where the connection's coefficients do not vanish ($\mathscr{Y}$ for
$\nabla^{\mathrm{E}}$, with $\Gamma^1_{22} = -r$, $\Gamma^2_{12} = \Gamma^2_{21} = 1/r$;
$\mathscr{X}$ for $\nabla^{\mathrm{P}}$), and the badge **Autoparallel?**,
checked along the whole curve (for $\nabla^{\mathrm{P}}$, the part inside the
domain): "Yes, even autoparallelly transported" ($a_\gamma = 0$), "Yes, but not
autoparallelly transported" ($a_\gamma = \text{ᚱ}(\lambda)\,v_\gamma$, with ᚱ at the
current $\lambda$), or "No" (with a $\lambda$ where $a_\gamma \not\parallel v_\gamma$).
Curves: `circle` $\delta_{r_0}(\lambda) = (r_0\cos\lambda, r_0\sin\lambda)$,
$\lambda \in [0, 2\pi]$ (reaches the cut at $\lambda = \pi$); `vertical`
$\gamma_{x_0}(\lambda) = (x_0, \lambda)$, $\lambda \in [-2.5, 2.5]$ (inside the domain
iff $x_0 > 0$); `radial` $\lambda(\cos\theta_0, \sin\theta_0)$, $\lambda \in [0.5, 3]$;
`radial-squared` $\lambda^2(\cos\theta_0, \sin\theta_0)$, $\lambda \in [0.7, 1.75]$
(autoparallel but not autoparallelly transported). Expected badges: circle No
under $\nabla^{\mathrm{E}}$, autoparallelly transported under $\nabla^{\mathrm{P}}$;
vertical line the reverse; radial lines the same under both. Check
($r_0 = 2$, $z_0 = (1, 0)$, $\lambda = 1.2$, $\nabla^{\mathrm{E}}$): polar components
$(\cos\lambda, -\sin\lambda/2) = (0.36, -0.47)$, $\dot z^1 = -0.93$,
$\Gamma^1_{ji}z^j\dot\gamma^i = 0.93$.

Two more connections (for torsion and curvature). `W` is $\nabla^{\mathrm{W}}$:
the unit radial and angular fields $e_1 = (a\,\partial x_1 + b\,\partial x_2)/r$,
$e_2 = (-b\,\partial x_1 + a\,\partial x_2)/r$ are declared parallel, on the plane
minus the origin; $\mathcal{Z}$ keeps its $e_1, e_2$ components, i.e. turns with
the polar angle of $\gamma(\lambda)$ (the transport stops if the curve hits the
origin). Its nonzero coefficients in $\mathscr{X}$: $\Gamma^2_{11} = b/r^2$,
$\Gamma^2_{12} = -a/r^2$, $\Gamma^1_{21} = -b/r^2$, $\Gamma^1_{22} = a/r^2$ (flat, with
torsion $\mathtt{T}^1_{12} = -b/r^2$, $\mathtt{T}^2_{12} = a/r^2$, where
$\mathtt{T}^i_{jk} = \Gamma^i_{kj} - \Gamma^i_{jk}$). `kappa` is $\nabla^{\kappa}$ with the
single coefficient $\Gamma^1_{22} = \kappa a$ in $\mathscr{X}$ (`kappa:`, default 1;
torsion free, $\mathrm{Riem}^1_{212} = \kappa$): $\dot z^1 = -\kappa\,a\,z^2\dot\gamma^2$,
$\dot z^2 = 0$, integrated along the curve (midpoint rule, 2400 steps; exact on
the rectangle). For both, the transport equation and the acceleration are shown
in $\mathscr{X}$. Curve `rectangle` $[x_0, x_1]\times[b_0, b_1]$: closed,
counterclockwise from $(x_0, b_0)$ (bottom, right side up, top, left side
down), one side per unit of $\lambda \in [0, 4]$, exact piecewise velocity;
no autoparallel badge (corners), instead **After the loop**: $\Delta z =
z(4) - z(0)$ (cartesian) next to the **Prediction**: for $\nabla^{\kappa}$,
$\Delta z^1 = -\mathrm{Riem}^1_{212}\,z^2\times\text{area}$, $\Delta z^2 = 0$ (exact for any
loop, by $\oint a\,db = $ area); for the flat ones $\Delta z = 0$ ($\nabla^{\mathrm{P}}$
stops at the cut if the loop surrounds the origin; $\nabla^{\mathrm{W}}$ returns
even around the origin). `compareE: true` draws, for connections other than
$\nabla^{\mathrm{E}}$, the $\nabla^{\mathrm{E}}$ copy of $\mathcal{Z}$ (start vector at
$\gamma(\lambda)$, dashed, labelled "∇ᴱ copy") and the angle from it to $\mathcal{Z}$
(torsion hint: $\nabla^{\mathrm{W}}$ along the vertical line $\gamma_1$ turns
$\mathcal{Z}$ by the change of polar angle, $124.5^\circ$ from $\lambda = -2.5$ to
$1.5$; along radial lines the two agree). `torsion: true` adds
$\mathtt{T}^1_{12}, \mathtt{T}^2_{12}$ at $\gamma(\lambda)$. Check ($\kappa = 1$,
rectangle $[1,2]\times[0,1]$, $z_0 = (0,1)$): $z = (-1, 1)$ at $\lambda = 1.5$ and
$\Delta z = (-1, 0)$ after the loop (right side $-2$, left side $+1$). The view
is fitted to the curve only; give `view` when $\mathcal{Z}$ is long.
```yaml
config:
  curve: circle               # circle | vertical | radial | radial-squared, or
                              # { type: circle, r0: 2 } | { type: vertical, x0: 1 }
                              # | { type: radial, theta0: 0.785 }; any type takes range: [l0, l1]
                              # | { type: rectangle, x0: 1, x1: 2, b0: 0, b1: 1 }
  connection: E               # E | P | W | kappa
  connections: [E, P]         # toggle buttons offered (one entry: none)
  kappa: 1                    # κ of ∇^κ
  compareE: false             # dashed ∇ᴱ copy of Z and the angle to it
  torsion: false              # readout T¹₁₂, T²₁₂ at γ(λ)
  holonomy: true              # closed curves: Δz after the loop and the prediction
  z0: [1, 0]                  # start vector, cartesian components (tip draggable)
  lambda: 0                   # initial slider value (default: start of the range)
  showVelocity: true
  showAcceleration: true
  showBasis: false            # polar basis at the current point (purple)
  trail: true                 # faded copies of Z along the way
  residual: true              # the transport equation in numbers
  badge: true                 # the "Autoparallel?" badge
  dragZ: true
  snap: 0.25                  # grid for the tip of the start vector
  view: { x: -3.2, y: -3.2, w: 6.4, h: 6.4 }   # default: fits the initial curve and its velocity
  presets: [{ label: Vertical line, curve: { type: vertical, x0: 1 }, connection: P, z0: [1, 0], lambda: 0 }]
```
The view is fixed by the initial curve: give `view` when presets switch to a
curve that does not fit it.

#### `time-slices`
A 1+1 spacetime picture for absolute time (Newton-Cartan). Horizontal axis
$a$ (space), vertical axis $\tau$ (a chart coordinate), and a time function
$t$ from a preset. Drawn: the slices $\mathcal{S}_c = \mathrm{preim}_t(\{c\})$
at every multiple $c$ of `step` in view (thin ink), the slice of the slider's
$c$ in gold (labelled "c = …" near the edge away from $p$), a draggable point
$p$ (ink ring, snapped to `snap`), the line $\ker(dt)_p$ through $p$ (ink,
labelled "ker (dt)ₚ": the spatial directions at $p$, tangent to the slice
through $p$), and the covector $(dt)_p$ as its two level lines
$(dt)_p(w) = \pm1$ for displacements $w$ from $p$ (orange, dashed, labelled
$+1$, $-1$; with the Euclidean picture they sit at distance $1/|dt|$, so they
move off-screen where $dt$ is tiny). Where $dt = 0$ in view, a ring marks one
such point, labelled "dt = 0". Readout: $t$, $p$, $t(p)$ and the slice
$\mathcal{S}_{t(p)}$ containing $p$; $(dt)_p = \dots\,da + \dots\,d\tau$ (orange)
with its components $(\partial t/\partial a)_p$, $(\partial t/\partial\tau)_p$; a
vector $v$ spanning the kernel, $v^a = (\partial t/\partial\tau)_p$,
$v^\tau = -(\partial t/\partial a)_p$, and $(dt)_p(v) = 0$ in numbers (if
$(dt)_p = 0$: a warning that the kernel is the whole 2-dimensional tangent
space, "time stands still here"); the gold slice ("(two curves)" when
disconnected, "empty, since $t$ never takes that value" when there is none);
the badge **Absolute time?**: "Yes: $(dt)_q \ne 0$ at every point $q$ in view"
or "No: $(dt)_q = 0$ at $q = \dots$" (for `squared` the point of the line
$\tau = 0$ below or above $p$, "in fact on the whole line $\tau = 0$"; other
time functions are checked on a 61×61 grid). Buttons: one per entry of
`times` (KaTeX formula; switching keeps $p$ and moves the gold slice to
$t(p)$), **Slice through p** (sets $c = t(p)$), Reset, presets. The slider
runs over the multiples of `step` covering $t$ on the view (for `squared`
down to $c = -1$, to show an empty slice).
Time functions: `flat` $t = \tau$ ($dt = d\tau$, horizontal slices); `wavy`
$t = \tau + 0.3\sin a$ (slices $\tau = c - 0.3\sin a$); `squared` $t = \tau^2$
($dt = 2\tau\,d\tau$ vanishes on $\tau = 0$; $\mathcal{S}_c$ is two lines
$\tau = \pm\sqrt c$ for $c > 0$, the line $\tau = 0$ for $c = 0$, empty for
$c < 0$; the slices crowd away from $\tau = 0$ and spread near it); `boosted`
$t = (\tau - 0.5\,a)/\sqrt{0.75}$ (the Minkowski boost's time at speed $0.5$:
tilted slices $\tau = 0.5\,a + c\sqrt{0.75}$, slope $\tfrac12$).
Checks (by hand): `wavy`, $p = (1, 0.5)$: $t(p) = 0.5 + 0.3\sin 1 = 0.75$,
$(dt)_p = 0.16\,da + 1\,d\tau$ ($0.3\cos1 = 0.162$), $v = (1, -0.16)$, the slice
through $p$ has slope $-0.3\cos 1 = -0.16$ there (tangent). `boosted`,
$p = (1, 1)$: $t(p) = 0.5/0.866 = 0.58$, $(dt)_p = -0.58\,da + 1.15\,d\tau$,
$v = (1.15, 0.58)$ of slope $\tfrac12$ (along the slice). `squared`,
$p = (1, 1)$: $t(p) = 1$, $(dt)_p = 0\,da + 2\,d\tau$, $\mathcal{S}_1$ = two
lines $\tau = \pm1$, badge No at $q = (1, 0)$.
```yaml
config:
  time: wavy                  # flat | wavy | squared | boosted
  times: [flat, wavy, squared, boosted]   # buttons offered (one entry: none)
  p: [1, 0.5]                 # initial point (draggable)
  c: 0.75                     # initial gold slice (default t(p))
  step: 0.5                   # spacing of the drawn slices' values
  snap: 0.25                  # grid for p
  kernel: true                # the line ker(dt)_p
  stack: true                 # the orange level lines (dt)_p(w) = ±1
  badge: true                 # "Absolute time?"
  dragP: true
  view: { x: -3, y: -2.5, w: 6, h: 5 }
  presets: [{ label: Boosted, time: boosted, p: [1, 1] }]   # c optional
```

#### `rotating-grid`
Pseudo-forces in a rotating chart (Newton-Cartan without gravity). A top
view of the spatial plane; time is the slider $t$ (with **Play**, 7 s for
the whole range). A free particle moves straight in the inertial chart,
$x(t) = x_0 + v\,t$. The rotating chart turns at constant $\dot\theta = \omega$
($\theta = \omega t$, no translation, the book's sign):
$y^1 = x^1\cos\omega t + x^2\sin\omega t$,
$y^2 = -x^1\sin\omega t + x^2\cos\omega t$, so its only nonzero coefficients
are $\Gamma^1_{02} = \Gamma^1_{20} = -\omega$, $\Gamma^2_{01} = \Gamma^2_{10} = \omega$,
$\Gamma^\alpha_{00} = -\omega^2 y^\alpha$.
Panels (by `view`, toggled by the buttons **Inertial**, **Rotating**,
**Both**; side by side on desktop, stacked on phones): the inertial chart
$(x^1, x^2)$, whose grey grid is fixed and over which the rotating chart's
grid turns by $+\omega t$ (purple lattice, axes labelled y¹, y²); the
rotating chart $(y^1, y^2)$, with the inertial grid turning by $-\omega t$
(axes x¹, x²). In each: the trace of the particle for $0\le s\le t$ (ink;
straight in the first, curling in the second; `ghost: true` adds the whole
path for $0\le s\le$ `tmax`, faint dashed), the particle (ink dot) with its
velocity ($\dot x = v$, resp. $\dot y$, blue), and, at $t = 0$ where the two
charts agree, the start point $x_0$ (grey ring handle) and the start velocity
$v$ (faint blue arrow, blue handle at its tip; drawn on top, so with $v = 0$
the first drag sets $v$). Dragging either handle resets $t = 0$. With
`forces` on (button **Forces** toggles), the rotating panel shows at the
particle, per unit mass and times `scale`: Coriolis
$-2\Gamma^\alpha_{0\beta}\dot y^\beta = (2\omega\dot y^2, -2\omega\dot y^1)$ (gold,
labelled "Coriolis"), centrifugal $-\Gamma^\alpha_{00} = \omega^2 y$ (green,
"centrifugal") and their sum $= \ddot y$ (thick translucent ink, "ÿ", drawn
underneath so a force along it stays visible). Readout: $x_0$, $v$, $\omega$;
the coefficients with numbers; inertial $x$, $\dot x = v$, $\ddot x = (0, 0)$;
rotating $y$, $\dot y = R(\omega t)\,v + \omega(y^2, -y^1)$ (blue); Coriolis
(gold) and centrifugal (green) in numbers; "Their sum is $\ddot y = \dots$"
(green "the two pseudo-forces cancel right now" when it is $0$).
Checks (by hand, $\omega = 1$, $x_0 = (1, 0)$, $t = 0$): $v = (0, 0)$:
$\dot y = (0, -1)$, Coriolis $(-2, 0)$, centrifugal $(1, 0)$, sum $(-1, 0) =
-\omega^2 y$ (the resting particle circles the origin of the rotating chart,
centripetal). $v = (0, 0.5)$: $\dot y = (0, -0.5)$, Coriolis $(-1, 0)$,
centrifugal $(1, 0)$, sum $(0, 0)$, as $y^1 = \cos t + 0.5t\sin t$,
$y^2 = -\sin t + 0.5t\cos t$ give $\ddot y(0) = 0$. $v = (0, 1)$: $\dot y = 0$
(momentarily at rest in the rotating chart), Coriolis $0$, sum = centrifugal
$(1, 0)$. Same $v = (0, 0.5)$ at $t = 4$: $y = (-2.17, -0.55)$,
$\dot y = (-0.93, 1.84)$, Coriolis $(3.68, 1.86)$. $x_0 = (-2, -1)$,
$v = (0.75, 0.5)$, $t = 2.5$: $x = (-0.12, 0.25)$, $y = (0.25, -0.13)$,
$\dot y = (-0.43, -1.1)$, Coriolis $(-2.2, 0.85)$, sum $(-1.95, 0.73)$.
```yaml
config:
  omega: 1                    # θ̇ (negative: clockwise)
  x0: [1, 0]                  # start point (draggable)
  v: [0, 0.5]                 # inertial velocity (draggable tip of x0 + v)
  t: 0                        # initial time
  tmax: 6.28                  # slider range [0, tmax]
  view: both                  # inertial | rotating | both
  views: [inertial, rotating, both]   # buttons offered (one entry: none)
  forces: true                # Coriolis, centrifugal and sum arrows
  forcesToggle: true          # the Forces button
  scale: 1                    # arrow length per unit of force
  velocity: true              # ẋ and ẏ arrows at the particle
  ghost: false                # whole path, faint
  drag: true
  snap: 0.25
  box: { x: -4, y: -4, w: 8, h: 8 }
  presets: [{ label: At rest, v: [0, 0] }]   # omega, x0, v, t (t defaults to 0)
```

#### `falling-cloud`
Tides (Newton-Cartan gravity of a point mass). A plane through the mass $M$
at the origin of the sources chart: $x^1$ radial, $x^2$ transverse,
$G_NM$ = `GM`. A cloud of `N` free particles on a circle of radius `r0`
around $c_0 = (c, 0)$ on the $x^1$ axis, plus the center particle, all at
rest at $t = 0$, falls freely along the exact law
$\ddot x = -G_NM\,x/|x|^3$ (velocity Verlet, $dt = 5\cdot10^{-4}$, sampled every
$0.005$, recomputed when $c_0$ changes). Time is the slider $t$ (with
**Play**, 7 s for the whole range); the run stops (`tmax`, automatic) at the
last sample before **any** particle reaches $|x| = 0.5$ (the inner one gets
there first: $t_{\max} = 0.88$ from $c_0 = (2, 0)$, $2.84$ from $(4, 0)$; the
center alone would need $\approx 1.11$ to reach the mass).
Panels (by `view`, buttons **Sources**, **Falling**, **Both**): the sources
chart $(x^1, x^2)$, with the mass (ink dot, "M"), the center's path from
$c_0$ (dashed), the cloud (blue dots, translucent blue outline), the center
(small ink dot) and the grey ring handle at $c_0$ (drag along the $x^1$ axis,
$1.25\le c\le 4.5$, resets $t = 0$); the falling chart $y = x - b(t)$, $b$ =
the center's path, magnified by `zoom` (caption "magnified ×5"; grid step $1/$`zoom`
in $y$ units): center fixed at $0$, the start circle (thin grey), the cloud
turning into an egg (longer on the inner side), and with `arrows` the exact
tidal accelerations $\ddot y = a - \ddot b$ of each particle (gold, `scale`
panel units per unit of acceleration, not zoomed, capped at 1.5 panel
units). With `linear` (button **Linear**): dashed gold arrows
$-\mathrm{Riem}^\alpha{}_{0\beta0}\eta^\beta$ at each particle's actual offset
$\eta = x - b$, and the dashed gold curve of the tidal equation
$\ddot\eta = -\mathrm{Riem}(t)\,\eta$ solved along the center's path (Riem at
$b(t)$, not frozen at $t = 0$): an ellipse, symmetric, unlike the egg.
$\mathrm{Riem}^\alpha{}_{0\beta0} = \partial_\beta\partial_\alpha\phi$ at $b = (r, 0)$:
$\mathrm{Riem}^1{}_{010} = -2G_NM/r^3$, $\mathrm{Riem}^2{}_{020} = \mathrm{Riem}^3{}_{030} = G_NM/r^3$.
Readout: setup line; $b$ and $r$; the two components; "Their sum is …;
with $\mathrm{Riem}^3{}_{030}$ the full trace is $0 = \mathrm{Ric}_{00}$ (vacuum)";
offsets of the outer $(r_0, 0)$, inner $(-r_0, 0)$ and side $(0, r_0)$
particles (tracked even when `N` is not a multiple of 4), blue; with
`linear` the linear prediction (outer, inner $= -$outer, side); gold: tidal
acceleration of the outer and side particles (and their linear values).
Checks (`GM: 8`, $c_0 = (2, 0)$, $r_0 = 0.2$, numerically verified):
$t = 0$: Riem $-2$, $1$ (sum $-1$, $+1$ gives $0$); exact accelerations outer
$0.347$, inner $-0.469$, side $-0.197$; linear outer $0.4$, side $-0.2$.
$t = 0.5$: $b = (1.738, 0)$; offsets outer $0.248$, inner $-0.267$, side
$(0.004, 0.174)$; linear prediction outer $0.256$, side $0.174$ (the frozen
hand estimate $0.2\cosh(\sqrt2\cdot0.5) = 0.2521$, $0.2\cos0.5 = 0.1755$ is
not what is drawn). $t = 0.8$: $b = (1.268, 0)$, outer $0.351$, inner
$-0.443$, side $0.128$; linear $\pm0.385$, $0.127$. $c_0 = (4, 0)$, $t = 0$:
Riem $-0.25$, $0.125$ (8 times weaker), outer acceleration $0.046$.
```yaml
config:
  GM: 8                       # G_N M
  c0: [2, 0]                  # start of the center (on the x¹ axis; draggable)
  r0: 0.2                     # radius of the cloud
  N: 12                       # particles on the circle
  zoom: 5                     # magnification of the falling panel
  t: 0                        # initial time (clamped to tmax)
  tmax: 0.8                   # optional; default = automatic stop
  view: both                  # sources | falling | both
  views: [sources, falling, both]   # buttons offered (one entry: none)
  arrows: true                # exact tidal accelerations (gold)
  linear: false               # dashed linear prediction (arrows + curve)
  linearToggle: true          # the Linear button
  scale: 1                    # arrow length per unit of acceleration
  drag: true
  snap: 0.25
  presets: [{ label: Far, c0: [4, 0] }]   # c0, t, linear (t defaults to 0)
```

#### `light-cones`
A 1+1 spacetime picture for Lorentzian metrics (signature $(+,-)$, the
book's: timelike means $g_p(\mathcal{X}_p,\mathcal{X}_p) > 0$). Horizontal axis
$a$ (space), vertical axis $\tau$ (a chart coordinate). **Component order
$(a, \tau)$**: a vector is $\mathcal{X}_p$ with components $(X^a, X^\tau)$, so
`X: [1, 2]` means $X^a = 1$, $X^\tau = 2$. Every metric preset has the form
$$g = d\tau\otimes d\tau - k^2\,\sigma\otimes\sigma,\quad \sigma := da - s(a)\,d\tau,$$
i.e. $g_p(\mathcal{X}_p,\mathcal{Y}_p) = X^\tau Y^\tau - k^2(X^a - sX^\tau)(Y^a - sY^\tau)$,
components $g_{aa} = -k^2$, $g_{a\tau} = k^2 s$, $g_{\tau\tau} = 1 - k^2s^2$
($\det = -k^2 < 0$: Lorentzian everywhere); null directions
$X^a = (s \pm 1/k)\,X^\tau$; time orientation $\text{ᛏ} = \pm(s, 1)$ with
$g(\text{ᛏ},\text{ᛏ}) = 1$. Presets: `minkowski` ($k = 1$, $s = 0$: cones at
$45°$), `tilted` ($k = 1$, $s = a/4$: cones lean right as $a$ grows, left for
$a < 0$; the cone axis $\text{ᛏ} = (a/4, 1)$), `scaled` ($k = 2$, $s = 0$:
$g = d\tau\otimes d\tau - 4\,da\otimes da$, narrow cones of slope $\pm\tfrac12$
in $a$ per unit $\tau$).
Drawn: the light cone at a draggable $p$ (two null lines through $p$, ink;
snapped to `snap`), its future half shaded green, $\text{ᛏ}(p)$ (green arrow,
labelled), words "future"/"past" on the cone axis, the vector $\mathcal{X}_p$
(blue arrow from $p$, draggable tip snapped to `snapX`; with `nullSnap` the
tip jumps onto a null line when the pointer is within $0.15$ of it), and with
`field: true` small cones (null segments plus shaded future wedge) at the
integer points of the view, so the tilt is visible across spacetime. Each cone
is drawn at its base point but lives in the tangent space there.
Readout: the metric (formula), $p$ (and $s$ for `tilted`) with $g_{aa}$,
$g_{a\tau}$, $g_{\tau\tau}$; the null lines spanned by $(s\pm1/k, 1)$; the
components of $\mathcal{X}_p$ (blue); $g_p(\mathcal{X}_p,\mathcal{X}_p)$ as a
formula and in numbers; $\text{ᛏ}(p)$ with $g_p(\text{ᛏ}(p),\text{ᛏ}(p)) > 0$
(green); $g_p(\text{ᛏ}(p),\mathcal{X}_p)$ as a formula and in numbers. With
`badge: true` (default) the words are added: positive/zero/negative,
**timelike / lightlike / spacelike**, **future / past directed** (causal
vectors only; "spacelike vectors are neither"), and a final line
"$\mathcal{X}_p$ is timelike, future directed (inside the cone)" (green,
gold for lightlike, bold ink for spacelike). With `badge: false` only the
numbers show, so a question can ask for the class. $\mathcal{X}_p = 0$:
"only non-zero vectors are classified". `orientation: false` hides
$\text{ᛏ}$, the shading and the future/past lines; `'down'` takes
$\text{ᛏ} = -(s, 1)$; `flip: true` adds a **Flip ᛏ** button. Buttons: one per
entry of `views` (metric names), Reset, presets.
Checks (by hand): `minkowski`, $p = (0,0)$: $\mathcal{X}_p = (1,2)$ gives
$2^2 - 1^2 = 3$, timelike, $g_p(\text{ᛏ},\mathcal{X}_p) = 1\cdot2 - 0\cdot1 = 2$,
future directed; $(1,1)$ gives $0$, lightlike, future directed; $(2,1)$ gives
$-3$, spacelike; $(1,-2)$ gives $3$, timelike, $g_p(\text{ᛏ},\mathcal{X}_p) = -2$,
past directed. `tilted`, $p = (2, 0)$: $s = 0.5$, $g_{aa} = -1$,
$g_{a\tau} = 0.5$, $g_{\tau\tau} = 0.75$, null lines $(1.5, 1)$ and $(-0.5, 1)$,
$\mathcal{X}_p = (1.5, 1)$ gives $1^2 - 1^2 = 0$ (lightlike, future directed),
$(1, 1)$ gives $1 - 0.25 = 0.75$; $\text{ᛏ}(p) = (0.5, 1)$. `scaled`:
$(1,1)$ gives $1 - 4 = -3$ (spacelike), $(0.5, 1)$ gives $0$, $(1, 4)$ gives $12$.
```yaml
config:
  metric: minkowski           # minkowski | tilted | scaled
  views: [minkowski, tilted, scaled]   # buttons offered (one entry: none)
  p: [0, 0]                   # base point (draggable)
  X: [1, 2]                   # components (X^a, X^tau) of the vector at p
  snap: 0.5                   # grid for p
  snapX: 0.25                 # grid for X
  nullSnap: true              # magnet onto the null lines
  field: false                # small cones at the integer points
  orientation: true           # true | down | false (no ᛏ, no shading)
  flip: false                 # Flip ᛏ button
  badge: true                 # class words; false = numbers only
  dragP: true
  dragX: true
  view: { x: -3, y: -2.5, w: 6, h: 5 }
  presets: [{ label: Lightlike, metric: minkowski, p: [0, 0], X: [1, 1], orientation: true }]
```
Keep $p + \mathcal{X}_p$ inside the view in presets (the default view runs
$a\in[-3,3]$, $\tau\in[-2.5,2.5]$).

#### `worldline-clock`
A worldline and the clock it carries, in 1+1 spacetime with the conventions
of `light-cones` ($a$ across, $\tau$ up, components in the order $(a, \tau)$,
signature $(+,-)$, metric presets from `light-cones`, time orientation
$\text{ᛏ} = (s, 1)$, future halves of the cones shaded green, velocities blue).
The worldline $\gamma$ runs from $A = (0,0)$ to $B = (0,T)$:
- `shape: kinks` (default): straight pieces through 1–2 draggable kinks
  $K_1$, $K_2$ (snapped to `snap`). **Parametrization:** $\lambda\in[0,n]$
  for $n$ pieces, one unit of $\lambda$ per piece, uniform on each, so on a
  piece $v_\gamma$ is constant and equals the piece's displacement (twin
  out to $(3,5)$: $v_\gamma = (3,5)$, then $(-3,5)$).
- `shape: bend`: the quadratic Bézier $\gamma(\lambda) = 2u(1-u)\,C + u^2B$,
  $u := \lambda/2$, $\lambda\in[0,2]$, with a draggable control point $C$
  (dashed control lines $A$–$C$–$B$); $v_\gamma = (1-u)\,C + u\,(B - C)$.

Proper time does not depend on the parametrization (another $\lambda$
rescales $v_\gamma$ and $d\lambda$ oppositely); the widget's choice only
fixes the numbers shown for $v_\gamma$ and $s_\gamma$. Drawn: $\gamma$ in
ink where $v_\gamma$ is timelike and future directed, **gold** where it is
lightlike and future directed, **red** where it is spacelike, past directed
or zero; `cones` small light cones at evenly spaced $\lambda$ with
$v_\gamma$ (blue arrows drawn at scale `vScale`, the class does not change
under scaling); a $\lambda$ slider with Play; the dot $\gamma(\lambda)$ with
its own cone, $v_\gamma(\lambda)$ and a clock (one turn of the hand $= T$;
greyed with "–" once $\gamma$ has stopped being timelike and future directed).
`compare: true` adds the straight worldline $A\to B$ (dashed) with the
same $\lambda$ range and uniform speed, its own dot and clock.
`massless: true` (Minkowski only; ignored otherwise) forces every piece onto
a null line: one kink sits at $(\pm T/2, T/2)$ (dragging picks the side); with
two kinks $K_1 = (x, |x|)$ is dragged along the light ray from $A$
($|x|\in[\mathtt{snap}, T/2 - \mathtt{snap}]$) and $K_2 = (x \mp T/2, |x| + T/2)$
follows (a light ray bounced twice).
Readout: the metric; the worldline and its $\lambda$ range; the dot
$\gamma(\lambda)$ in chart coordinates (and $s$ for `tilted`); $v_\gamma(\lambda)$
(blue); $g(v_\gamma, v_\gamma)$ as numbers with
$\text{ᛇ}_\gamma(\lambda) = \mathrm{sgn}\,g(v_\gamma,v_\gamma)$ and the class,
$g(\text{ᛏ}, v_\gamma)$ with future/past directed; the speed
$s_\gamma = \sqrt{\text{ᛇ}_\gamma\,g(v_\gamma,v_\gamma)}$; the **proper time**
so far $\tau_{[0,\lambda]}[\gamma] = \int_0^\lambda s_\gamma\,d\lambda$ (green;
"not a proper time" once $v_\gamma$ failed to be timelike and future
directed); the **chart coordinate** $\tau$ of the dot, with the sentence that
it labels the event and is not the dot's clock; with `compare` the straight
worldline's numbers; the badge "Massive worldline?": **Yes** (green, with the
proper time from $A$ to $B$) when $v_\gamma$ is timelike and future directed
for every $\lambda$; **No … a massless worldline** (gold) when it is lightlike,
future directed and non-zero everywhere; otherwise **No** (red) with the first
$\lambda$ range where $v_\gamma$ is zero, spacelike, past directed or lightlike.
The integral is computed by the midpoint rule, 200 steps per unit of
$\lambda$ (exact on straight Minkowski pieces).
Checks (by hand): Minkowski twin `kinks: [[3, 5]]`: $v_\gamma = (3,5)$,
$g = 25 - 9 = 16$, $s_\gamma = 4$ on both pieces, proper time $4 + 4 = 8$;
the straight worldline has $v = (0,5)$, $s = 5$, proper time $10$; at
$\lambda = 1$ the clocks read $4$ and $5$ (both dots at chart $\tau = 5$).
`bend: [4, 5]`: $\gamma = (8u(1-u), 10u)$, $v_\gamma = (4 - 8u, 5)$,
$g = 25 - (4-8u)^2 > 0$, proper time
$\tfrac14\int_{-4}^4\sqrt{25 - w^2}\,dw = 3 + 6.25\arcsin0.8 \approx 8.796$.
`kinks: [[0, 2], [5, 6]]`: pieces $(0,2)$ ($s = 2$), $(5,4)$ and $(-5,4)$
($g = -9$, spacelike, red), badge No for $\lambda\in[1,3]$.
`kinks: [[1, 6], [0, 4]]`: piece $(-1,-2)$ has $g = 3$ (timelike) but
$g(\text{ᛏ}, v) = -2$: past directed, red. `massless`, `kinks: [[2, 2], [0, 0]]`:
$K_1 = (2,2)$, $K_2 = (-3,7)$, pieces $(2,2)$, $(-5,5)$, $(3,3)$, all null:
massless badge. `tilted`, twin `[[3, 5]]`: the straight worldline stays on
$a = 0$ ($s = 0$), proper time $10$; the return piece $(-3,5)$ starts at
$a = 3$ ($s = 0.75$): $X^a - sX^\tau = -6.75$, $g = 25 - 45.5625 < 0$,
spacelike for $\lambda\in[1, 1.467]$ (the readout shows $1.465$, its sampling step; where $6.75 - 3.75\mu > 5$, $\mu = \lambda - 1$).
```yaml
config:
  metric: minkowski           # minkowski | tilted | scaled
  T: 10                       # B = (0, T)
  shape: kinks                # kinks | bend
  kinks: [[3, 5]]             # 1 or 2 points (a, tau), draggable
  bend: [4, 5]                # control point C for shape: bend
  massless: false             # pieces forced onto null lines (minkowski)
  compare: false              # straight worldline A -> B with its clock
  cones: 4                    # small cones along the curve
  vScale: 0.3                 # drawing scale of the velocity arrows
  lambda: 0                   # initial lambda (not a fraction)
  snap: 0.5
  drag: true
  view: { x: -6, y: -1, w: 12, h: 12.5 }   # default: from T
  presets: [{ label: Halfway, shape: kinks, kinks: [[3, 5]], lambda: 1 }]
```
Keep the kinks at least $1$ inside the view so their labels fit.

#### `observer-frame`
An observer's frame and what it measures, in 1+1 **Minkowski** spacetime with
the conventions of `light-cones` ($a$ across, $\tau$ up, components in the
order $(a, \tau)$, signature $(+,-)$:
$g(\mathcal{X},\mathcal{Y}) = X^\tau Y^\tau - X^aY^a$; light cone at $p = (0,0)$
in ink, future half shaded green). The observer passes through $p$ with chart
speed $u\in[-0.95, 0.95]$ (slider, or drag the tip of $e_0$: it stays on the
future unit hyperbola, only the pointer's slope $a/\tau$ is read, snapped to
`snapU`):
$$e_0 = (u, 1)/\sqrt{1-u^2},\quad e_1 = (1, u)/\sqrt{1-u^2}.$$
The frame is drawn in **purple** (the app's basis hue: $e_0, e_1$ are a basis
of $T_p\mathcal{M}$), with faint purple lines through $p$ along $e_0$ (the
observer's worldline) and $e_1$ (its space line): as $|u|\to1$ the pair closes
like scissors on the light line, symmetric about it. Optional dashed unit
hyperbolae $g(\mathcal{X},\mathcal{X}) = 1$ (both branches, labelled
"g = 1") and $= -1$ ("g = −1"): $e_0$ always ends on the first, $e_1$ on the
second. The vector $\mathcal{X}$ (blue, draggable tip snapped to `snapX`,
magnet onto the null lines as in `light-cones`) and its **measured components**
$$X^0 = \epsilon^0(\mathcal{X}) = g(e_0,\mathcal{X}),\quad X^1 = \epsilon^1(\mathcal{X}) = -g(e_1,\mathcal{X}),$$
drawn as the parallelogram $0$, $X^0e_0$, $\mathcal{X}$, $X^1e_1$ (dashed blue
edges, light fill; edge labels "X⁰e₀", "X¹e₁" when there is room). Measured
components carry the frame labels $0, 1$; chart components the coordinate
labels $a, \tau$. `compare: true` (or the **Observer at rest** button with
`compareButton: true`) adds the frame at rest, $u = 0$ (faint purple, "rest"),
which measures the chart components.
Readout: the metric; $u$, $1/\sqrt{1-u^2}$, $e_0$, $e_1$ in numbers (purple);
Lorentz-orthonormality $g(e_0,e_0) = 1$, $g(e_1,e_1) = -1$, $g(e_0,e_1) = 0$
computed in numbers; the chart components $X^a, X^\tau$ (blue); $X^0$ and
$X^1$ computed in numbers; the check $X^0e_0 + X^1e_1 = \mathcal{X}$;
$g(\mathcal{X},\mathcal{X})$ both as $(X^\tau)^2 - (X^a)^2$ and as
$(X^0)^2 - (X^1)^2$ (same number); with `compare` the rest observer's time
$X^\tau$, space $X^a$ and speed $|X^a/X^\tau|$; the badge (`badge: false`
hides it): **timelike** (green) "measured speed $|X^1/X^0| = \dots < 1$",
with $X^0 > 0$ future / $X^0 < 0$ past directed; **lightlike** (gold) speed
exactly $1$ "for every observer"; **spacelike** (bold) "$|X^1| > |X^0|$ …
not a particle velocity: no measured speed"; $\mathcal{X} = 0$: no speed.
The slider name $u$ is the observer's speed relative to the chart (the rest
observer); the measured speed of $\mathcal{X}$ is written $|X^1/X^0|$, never
$u$, so the two speeds are not confused in lessons.
Checks (by hand): rest, $\mathcal{X} = (1,2)$: $X^0 = 2$, $X^1 = 1$, speed
$0.5$, $g = 3$. $u = 0.6$: $1/\sqrt{1-u^2} = 1.25$, $e_0 = (0.75, 1.25)$,
$e_1 = (1.25, 0.75)$, $1.25^2 - 0.75^2 = 1$; light $\mathcal{X} = (1,1)$:
$X^0 = 1.25 - 0.75 = 0.5$, $X^1 = -(0.75 - 1.25) = 0.5$, speed $1$;
$\mathcal{X} = (3,5)$: $X^0 = 1.25\cdot5 - 0.75\cdot3 = 4$ (the traveller's
proper time on the twin's outbound leg), $X^1 = -(0.75\cdot5 - 1.25\cdot3) = 0$:
at rest in that frame, $g = 25 - 9 = 16 = 4^2 - 0^2$; the rest observer
measures time $5$, speed $0.6$. $u = -0.9$: $1/\sqrt{0.19}\approx2.294$,
$e_0\approx(-2.065, 2.294)$; spacelike $\mathcal{X} = (2,1)$:
$X^0\approx6.424$, $X^1\approx6.653$, $(X^0)^2 - (X^1)^2 = -3$.
```yaml
config:
  u: 0.6                      # observer's chart speed, clamped to [-0.95, 0.95]
  X: [3, 5]                   # components (X^a, X^tau)
  snapX: 0.25                 # grid for X
  snapU: 0.05                 # u steps when dragging e_0 (slider: 0.01)
  nullSnap: true              # magnet onto the null lines
  hyperbolae: true            # dashed g = 1 and g = -1
  parallelogram: true         # X^0 e_0 and X^1 e_1
  badge: true                 # measured-speed badge
  compare: false              # faint frame at rest (u = 0)
  compareButton: false        # toggle button for it
  slider: true
  dragE: true
  dragX: true
  view: { x: -3.5, y: -2.5, w: 7, h: 8 }
  presets: [{ label: Light, u: 0.6, X: [1, 1], compare: false }]
```
For $u < -0.8$ the tip of $e_1$ leaves the default view at the bottom (and for
$u > 0.8$ only just fits): use a taller view in presets with large $|u|$.

#### `area-cell`
What $\sqrt{\det g}$ measures: how a chart stretches a small coordinate
square. Two panels (stacked on a phone). **Left, the chart's coordinates**
(first coordinate across, second up; the chart domain shaded, its real
boundary dashed: polar $r = 0$ and $\theta = \pm\pi$, sphere $\vartheta = 0,
\pi$ and $\varphi = \pm\pi$): a gold square cell of side $\Delta$ in both
coordinates, centred at the draggable point $p$ (gold handle, snapped to
`snap`), with purple arrows $\Delta e_1$, $\Delta e_2$ along two of its
edges. **Right, the manifold**: the chart's coordinate lines (faint purple,
the same lines as on the left), the true image of the cell (gold, curved
edges), and the **parallelogram** centred at $p$ spanned by
$\Delta\,(\partial/\partial\alpha^1)_p$ and $\Delta\,(\partial/\partial\alpha^2)_p$
(purple fill, dashed edge, arrows labelled "Δ∂r", "Δ∂θ", … when long enough).
Its area is $\sqrt{g_{11}g_{22} - g_{12}^2}\,\Delta^2 = \sqrt{\det g(p)}\,\Delta^2$
(Gram: area$^2 = |u|^2|w|^2 - (u\cdot w)^2$). The slider sets $\Delta\in$
[`dmin`, `dmax`]; $p$ is clamped so that the whole cell stays in the domain.
Charts (`chart`; Riemannian only, so $|\det g| = \det g$ and the readout
writes $\sqrt{\det g}$):
- `polar`: Euclidean plane, $(r,\theta)$, $r\in(0, 3.2)$ drawn,
  $\theta\in(-\pi,\pi)$, point $(r\cos\theta, r\sin\theta)$; lines every
  $0.5$ and $\pi/8$; $g = \mathrm{diag}(1, r^2)$, true area of the cell (a ring
  sector) $\tfrac12\Delta(r_2^2 - r_1^2) = r\Delta^2$: **exactly**
  $\sqrt{\det g(p)}\,\Delta^2$ for every $\Delta$, because $p$ is the centre.
- `sphere`: unit $S^2$, $(\vartheta,\varphi)$, point
  $(\sin\vartheta\cos\varphi, \sin\vartheta\sin\varphi, \cos\vartheta)$;
  lines every $\pi/12$; $g = \mathrm{diag}(1,\sin^2\vartheta)$; true area
  (Archimedes' zone) $\Delta(\cos\vartheta_1 - \cos\vartheta_2) =
  2\Delta\sin\vartheta\sin(\Delta/2)$, so the ratio is
  $\sin\vartheta\cdot\sin(\Delta/2)/(\Delta/2)\to\sin\vartheta$. Drawn in
  orthographic projection, radius $3$, seen from the direction of the cell
  (azimuth $\varphi$, elevation $\pi/2 - \vartheta$ capped at $\pm1$ rad so the
  pole stays in sight): the sphere turns as $p$ moves; only the front half is
  drawn; poles N, S as dots; the cut meridian dashed. $\partial/\partial\vartheta$
  points south (down), $\partial/\partial\varphi$ east (right).
- `sheared`: Euclidean plane, $(a,b)\in(-1.2, 1.2)^2$, point $(2a + b, b)$;
  lines every $0.25$; $\partial/\partial a = (2,0)$, $\partial/\partial b = (1,1)$,
  $g = \begin{pmatrix}4&2\\2&2\end{pmatrix}$, $\det g = 4$, true area $2\Delta^2$;
  the readout adds that the product of the side lengths,
  $\sqrt{g_{aa}g_{bb}}\,\Delta^2 = 2\sqrt2\,\Delta^2$, is too big (sides not
  perpendicular): the off-diagonal $g_{ab}$ matters.
- `cartesian`: $(x,y)\in(-2.5,2.5)^2$, everything $1$ (a control).
Readout: the chart's rule; the cell's coordinate ranges
$[\alpha_1,\alpha_2]$, $\Delta$, $p$, coordinate area $\Delta^2$ (gold);
$(\partial/\partial\alpha^i)_p$ in numbers (purple; vectors of $\mathbb{R}^3$ for
the sphere); $g_{11}, g_{12}, g_{22}$ as dot products, $\det g$,
$\sqrt{\det g}$; the parallelogram's area in numbers (purple); the true area
of the gold cell by elementary geometry (ring sector, zone, parallelogram,
square: no volume form used); "True area $/\Delta^2$ against $\sqrt{\det g}$
at $p$" with the badge **equal** (green, to three decimals) or "they differ by
…%. Shrink $\Delta$, and the ratio tends to $\sqrt{\det g}$ at $p$".
Checks (by hand): polar $p = (1.25, \pi/4)$, $\Delta = 0.5$: $g_{\theta\theta} =
1.5625$, parallelogram $= 1.25\cdot0.25 = 0.3125 = \tfrac12\cdot0.5\cdot(1.5^2 -
1^2)$, equal. Sphere $p = (\pi/3, 0.5)$, $\Delta = 0.5$: $\sqrt{\det g} = 0.866$,
parallelogram $0.217$, true $\sin(\pi/3)\sin0.25 = 0.214$, ratio $0.857$ ($1\%$).
Sphere $p = (0.35, -2)$, $\Delta = 0.6$: $\sqrt{\det g} = 0.343$, parallelogram
$0.123$, true $0.6(\cos0.05 - \cos0.65) = 0.122$ ($1.5\%$). Sheared $\Delta = 0.75$:
parallelogram $= 2\cdot0.5625 = 1.125$ = true, side product $1.591$.
```yaml
config:
  chart: polar                # polar | sphere | sheared | cartesian
  p: [1.25, 0.785]            # centre of the cell, chart coordinates
  d: 0.5                      # side Δ (both coordinates)
  dmin: 0.05                  # slider range
  dmax: 1
  snap: 0.05                  # grid for dragging p (angles too, in radians)
  slider: true
  drag: true
  lattice: true               # coordinate lines on the manifold
  parallelogram: true         # purple Δ∂ parallelogram and its readout row
  exact: true                 # true-area and ratio rows
  badge: true                 # "equal" / "differ by …%" words
  presets: [{ label: Near the pole, chart: sphere, p: [0.35, 0], d: 0.5 }]
```
A preset may switch `chart` (the panels are rebuilt); omitted `p`, `d` keep
the current values, clamped to the new domain. Font sizes are in view units,
so the small `sheared` chart panel shows larger tick labels.

#### `torus`
The exam figures: the torus $\mathcal{M}$ with the angle chart $(\theta,\varphi)$ and the
projection chart $(a,b)$ (`js/widgets/torus.js`, canvas, no library, theme-aware). **Display only**:
no component values, no labelled results. A rotatable 3D torus (drag; touch rotates
horizontally only, so the page scrolls; arrow keys; buttons Reset view / From above / From the side)
plus chart panels below it. Config: `view` (one name, or a list shown as tab buttons;
`labels: {view: text}` renames tabs), `rotate: false`, `az`, `el` (first camera angles).
Views: `domain` (Fig. 1: grid, green cuts $\theta=\pi$, $\varphi=\pi$, $p_0$); `transition`
(Fig. 2: $\mathcal{V}$ tinted, equators dashed, panels $\mathscr{Y}$ and $\mathscr{X}$ with the
images of $\mathcal{U}\cap\mathcal{V}$ and the grid); `curves` (Fig. 3: $\gamma$ blue, $\delta$ purple,
direction-only velocity arrows at $p_0$); `scalar` (Fig. 4: $f=a$ colour and level sets, tangent
plane, stack of level lines of $(df)_{p_0}$, $\gamma$ and $\delta$); `fields` (Fig. 5: normalized
$\partial_\theta$ blue and $\partial_\varphi$ purple on the torus and in both charts); `actions`
(Fig. 6, four colour maps of $\mathcal{X}\lfloor f\rceil$ in $\mathscr{X}$ and $\mathscr{Y}$,
$(\mathcal{X}\oplus_\Gamma\mathcal{Y})\lfloor f\rceil$, $\mathcal{Y}\lfloor f\rceil$; this one shows the
answer of Question 4(b,c) qualitatively, as the paper exam did).
#### `sphere`
The final-exam figures: the unit sphere $\mathcal{M}$, $\Phi(\alpha_1,\alpha_2)=(\sin\alpha_1\cos\alpha_2,\sin\alpha_1\sin\alpha_2,\cos\alpha_1)$,
with the angle chart $(\alpha_1,\alpha_2)$ and the projection chart $(\beta_1,\beta_2)$ on the northern
hemisphere (`js/widgets/sphere.js`, canvas, no library, theme-aware; reuses the palette, frame and text helpers
exported by `js/widgets/torus.js`, and the `tor-*` CSS). **Display only**: no component values, no labelled
answers. A rotatable 3D sphere (hidden lines dashed; drag, touch rotates horizontally only, arrow keys,
buttons Reset view / From above / From the side) plus chart panels below. Config: `view` (one name, or
a list shown as tab buttons; `labels: {view: text}` renames tabs), `rotate: false`, `az`, `el`
(first camera angles), and per view `alpha0` (`curves`, default $\pi/4$), `alpha1bar` (`geodesics`,
default $\pi/4$), `densities` (`region`, default false).
Views: `domain` (Fig. 1: grid, meridians blue, parallels orange, removed half meridian and poles green,
$\mathcal{V}$ tinted with dashed equator, axes $a,b,c$; panels $\mathscr{X}(\mathcal{U})$ with
$\mathscr{X}(\mathcal{U}\cap\mathcal{V})$ tinted, and the unit disk with the green cut); `curves` (Fig. 2:
$\gamma$ blue and $\delta$ orange with ticks at $\lambda=0.1..0.9$ and $k\pi/20$ on two slightly separated
copies of the meridian $\alpha_2=0$, $\sigma$ purple; panels disk and $\mathscr{X}$ up to $\pi/2$);
`geodesics` (Fig. 3: green meridians and equator, purple dashed parallel, $\gamma$/$\delta$ ticks; panel
$\mathscr{X}$); `region` (Fig. 4: $\mathcal{D}=\{a>0,\ 1/2<c<\sqrt3/2\}$ tinted; panels the rectangle
$(\pi/6,\pi/3)\times(-\pi/2,\pi/2)$ and the half annulus $1/4<\beta_1^2+\beta_2^2<3/4$, $\beta_1>0$).
`densities: true` on `region` adds the two density curves with shaded ranges ($\sin\alpha_1$ over the
chart $\mathscr{X}$, $1/\sqrt{1-\beta_1^2}$ along $\beta_2=0$ with the $\beta_1=1$ asymptote) and the tick
labels $\pi/6$, $\pi/3$, $\pm\pi/2$ of the rectangle; default false, because the curves and those
bounds answer a question. $\gamma$ sits at $\alpha_2=+0.07$ and $\delta$ at $-0.07$ (chart panels: $\beta_2=\pm0.07$,
$\alpha_2=\pm0.45$ or $\pm0.3$), only for readability.

**Figure on any card:** `figure: { widget: torus | sphere, config: {...} }` shows a widget above the
prompt (below the body on text cards); used by exam cards.

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

#### `belief-mixer`
Prior and evidence combine into a belief (`js/widgets/belief-mixer.js`, plain HTML, no library; all wording
comes from the config, no jargon in the widget). Three blocks: a **slider per cause** for what the reader
expects beforehand (prior), a **slider per cause** for how well that cause explains the sensation (evidence),
and a **bar per cause** with the result, prior $\times$ evidence normalised to add up to $100\%$. Sliders run
$0.02$ to $1$ (never exactly zero, so the bars are always defined). Buttons: **Noisy / Sharp senses** (noisy
raises each evidence value to `noisyPower`, default $0.3$, which flattens it toward "all causes explain it
equally"; sharp uses it as set), Reset, and the presets. Colours by cause: blue, orange, purple.
Config: `causes: [{name, prior, evidence}]` (2 or 3, values in $(0,1]$), `sharp` (start state, default true),
`noisyPower`, `toggle: false` (hide the switch), `markers: true` (a tick on each evidence slider at the
value actually used after the noisy flattening), `labels: {prior, evidence, belief, noisy, sharp, reset}`
(section titles and button texts), `presets: [{label, prior: [..], evidence: [..], sharp}]` (any field may be
omitted to keep the current value). Example "strong prior beats weak evidence":
`{label: "Strong prior, weak evidence", prior: [0.9, 0.1, 0.1], evidence: [0.4, 0.5, 0.5], sharp: false}`.

#### `homeostat`
A creature keeps a body value (default temperature) inside a safe band (`js/widgets/homeostat.js`, plain HTML,
no library; all wording from the config). A scale shows the safe band (green), the body value (blue), the
creature's expectation (orange) and the room value (purple, the body drifts toward it). Readouts: sensed value,
expectation, room, a **mismatch bar** (|expectation - sensed|) and an **in/out of the safe band** flag. A slider
sets the expectation. Levers (each press is one time step, after which the body drifts toward the room):
**belief** moves the expectation a fraction `beliefRate` toward the sensed value (changing its mind), **act**
moves the body a fraction `actRate` toward the expectation (changing the world), optional **wait** only lets time
pass. Moving the slider cancels a running preset.
Config: `range: [0,50]`, `band: [35,39]`, `room`, `body`, `expect` (start values), `drift` (0.08), `beliefRate`,
`actRate` (0.8), `unit`, `step`, `decimals`, `bandLabel` (legend text of the green zone),
`labels: {body, sensed, expect, room, mismatch, slider, inBand, outBand, belief, act, wait, reset, steps}` (`wait`
empty = no wait button), `presets: [{label, body, expect, room, script: ['belief'|'act'|'wait', ...]}]` (sets the
state, then plays the script one step per 0.7 s). Example: `{label: "Update belief only", body: 30, expect: 37,
room: 20, script: [belief x6]}` (belief falls to the cold value, the body stays out of the band);
`{label: "Act", ..., script: [act x6]}` (body climbs into the band; with these numbers act alone wins the race
against the drift).
Reduced mode (no belief idea yet): `showBelief: false` hides the expectation marker, its legend key and
readout, the mismatch bar and the slider; the start `expect` stays as a hidden set-point that **act** pulls the
body toward (use the middle of the band). `levers: ['wait','act']` picks the buttons and their order (default
belief, act, plus wait if it has a label; `wait` without a label is called "Wait"). Defaults leave old presets
unchanged. Example (drift out, then hold): `{showBelief: false, levers: ['wait','act'], band: [36,38], expect: 37,
body: 37, room: 20, presets: [{label: "Do nothing", script: [wait x8]}, {label: "Keep acting", script: [act x8]}]}`.

#### `free-energy-bound`
Variational free energy as a bound on surprise (`js/widgets/free-energy-bound.js`, plain HTML, no library; all
wording and numbers from the config). One hidden cause $x$ with $K = 2$ to $4$ values, one observed $y$. The prior
$P(x)$, the likelihood $P(y\mid x)$ and the start of $Q$ are fixed by the config. A **slider per cause** sets the
approximate posterior $Q(x)$, kept normalised (moving one slider rescales the others in proportion; each shows
its $\%$). Bars, in nats and on a fixed scale (the largest $F$ reachable at the current model): the **free
energy** $F=\sum_x Q(x)\,[\ln Q(x)-\ln P(x)-\ln P(y\mid x)]$, the **surprise** $-\ln P(y)$ with
$P(y)=\sum_x P(x)P(y\mid x)$, and the **gap** $F-\text{surprise}=D_{KL}[Q(x)\parallel P(x\mid y)]\ge 0$. A
dashed tick on the $F$ bar marks the surprise (the bar never ends left of it). Same signs as Eq. 2.5: $F$ is
minimised, $F\ge-\ln P(y)$. Buttons: **Set Q = exact posterior** (gap goes to $0$, $F$ meets the tick), Reset,
presets.
Config: `causes: [{name, prior, likelihood}]` (prior normalised, likelihood in $(0,1]$), `q: [..]` (start $Q$,
default uniform), `observation` (line naming the observed $y$), `unit` (`nats`),
`labels: {observation, q, f, surprise, gap, exact, reset, prior, likelihood}`, `presets: [{label, q, prior,
likelihood}]` (any field optional; `q: exact` sets the exact posterior; a preset may change the model but not $K$).
Hide parts to reveal them step by step: `showF`, `showSurprise` (also drops the tick), `showGap`, `showQ`
(bars only, presets still set $Q$), `showModel` (the "prior / likelihood" line under each slider) and `exact`,
each `false`. Example (garden): `{observation: "you hear a rustle", causes: [{name: cat, prior: 0.6, likelihood:
0.2}, {name: dog, prior: 0.3, likelihood: 0.5}, {name: fox, prior: 0.1, likelihood: 0.9}], presets: [{label: "Q =
prior", q: [0.6, 0.3, 0.1]}]}` gives $P(y)=0.36$, surprise $1.02$ nats, exact posterior $(0.33, 0.42, 0.25)$,
$Q=$ prior has $F=1.18$ (gap $0.16$).

#### `policy-scorer`
Scores 2 to 4 policies by expected free energy (`js/widgets/policy-scorer.js`, plain HTML, no library; all wording and
numbers from the config). Per policy $\pi$, bars in nats on one shared scale: **risk**
$D_{KL}[Q(\tilde y\mid\pi)\parallel P(\tilde y\mid C)]$, **ambiguity** $\mathbb{E}_{Q(\tilde x\mid\pi)}H[P(\tilde y\mid\tilde x)]$,
$G=\text{ambiguity}+\text{risk}$ (Eq. 2.6; minimised, never negated). In states mode also the second form
$G=-\text{information gain}-\text{pragmatic value}$, with pragmatic value $\mathbb{E}_{Q(\tilde y\mid\pi)}[\ln P(\tilde y\mid C)]$ and
information gain $\mathbb{E}_{Q(\tilde x,\tilde y\mid\pi)}D_{KL}[Q(\tilde x\mid\tilde y,\pi)\parallel Q(\tilde x\mid\pi)]$ (computed directly, not as
$H[Q(\tilde y\mid\pi)]-\text{ambiguity}$; the $G$ readout then reads "$G=-\text{gain}+\text{cost}$", and the two forms agree to
rounding). Then the policy probabilities $\sigma(-\gamma G)$ with a $\gamma$ slider (the precision over policies, Eq. B.13),
and the lowest-$G$ policy gets a green frame and a badge.
Two modes. **qy mode**: `policies: [{name, qy, ambiguity}]` (`qy` normalised; `ambiguity` in nats, default 0); the second
form is hidden and a note says it needs states. **States mode**: `states: [names]`, `likelihood: [[P(y_k|x_j)]_k per
state]` (rows normalised; a policy may carry its own `likelihood`), `policies: [{name, qx}]`; qy and ambiguity are computed.
Config: `outcomes: [labels]`, `C: [..]` (P(y|C), normalised), `editable: true` (a slider per outcome, or per state in
states mode, kept normalised), `gamma` (start, default 1), `gammaMax` (8), `unit`, `labels: {risk, ambiguity, g,
pragmatic, epistemic, prob, gamma, lowest, reset, prefs, needsStates}`, `presets: [{label, gamma, policies: [{qy | qx}]}]`
(by policy order; fields optional). Flags, each default true, to reveal pieces step by step: `showRisk`,
`showAmbiguity`, `showG`, `showPragmatic`, `showEpistemic` (both only in states mode), `showProb`, `showGamma`,
`showPrefs` (the "Preferences: ..." line).
Example (pond and orchard): `{outcomes: [jumps, still], C: [0.8, 0.2], states: [frog, apple], likelihood: [[0.9, 0.1],
[0.1, 0.9]], policies: [{name: pond, qx: [0.8, 0.2]}, {name: orchard, qx: [0.1, 0.9]}]}` gives $Q(\text{jumps})=0.74,\,0.18$;
ambiguity $0.325$ for both; risk $0.011,\,0.889$; $G=0.336,\,1.214$; gain $0.248,\,0.146$; pragmatic value $-0.584,\,-1.360$
($-0.248+0.584=0.336$); at $\gamma=1$, $P(\pi)=0.706,\,0.294$.

#### `blanket-graph`
A small graph of coupled sets of states (`js/widgets/blanket-graph.js`, SVG + HTML labels, no library; all wording from the
config, no maths hard-coded). Default: the four sets of a Markov blanket, external $x$ (left), sensory $y$ (top), active $a$
(bottom), internal $\mu$ (right), arrows $x\to y$, $y\to\mu$, $\mu\to a$, $a\to x$. Arrows are toggles (click the arrow or its
chip; off arrows show dashed only if editable). Readouts: the **directly connected** list; a button **Condition on the
blanket** that greys the blanket nodes ("given") and states the verdict by the graph test: *no undirected path from an
external node to an internal node that avoids the blanket nodes* (for flows, an arrow is a nonzero dependence of one set's
flow on another). Independent: green box, "every path goes through $y$ and $a$". A leaking arrow (default toggles $x\to\mu$,
$\mu\to x$): red box "Not a blanket", the path and the leaking arrow named, drawn red. Before conditioning the box shows the
shortest path linking them. `el.dataset.verdict` = `open | blanket | leak`.
Config: `nodes: [{id, label, role, hue, pos:[x,y]}]` (role `external` / `internal` are the two sets tested; others are
free; `pos` in a 400x230 box; `label` is KaTeX source, e.g. `\mu`), `edges: [{from, to, on, editable, w}]` (`from == to` is a
self-loop; only listed arrows exist; `id` defaults to `from>to`), `blanket: [ids]` (default: roles sensory + active),
`editable` (default for edges, false), `conditioned` (start conditioned), `showVerdict`, `showList`, `showChips` (all
default true), `labels: {list, none, condition, uncondition, reset, play, pause, restart, flows, linked, indep, notBlanket,
leak, because, via, nolink, and, given}`, `presets: [{label, edges: ['x>y', ...ids that are ON], conditioned}]`.
`simulate: true` adds flows $\dot z_i=-z_i+\text{gain}\sum_{j\to i}w\tanh z_j+\text{noise}$ (each node only feels its
parents, the book's Fig. 3.1 statement) with a trace plot and Play / Restart (`gain` 1.5, `noise` 0.6, `dt` 0.05, `seed` 7;
paused at start, seeded, runs 400 warm-up steps). Node hues avoid the fixed blue, orange and purple.
Example: `{presets: [{label: Blanket, edges: ['x>y','a>x','y>mu','mu>a'], conditioned: true}, {label: Leaky, edges: ['x>y','a>x','y>mu','mu>a','x>mu'], conditioned: true}]}`.

#### `factor-graph`
A factor graph (`js/widgets/factor-graph.js`, SVG + HTML labels; all wording and maths from the config). Round nodes =
random variables (grey-shaded when observed), square nodes = factors (probability tables) joined by lines to the variables
they involve. **Click a variable**: it gets a thick ring, the factors touching it turn blue (the ones it must read to update
its belief: its Markov blanket in factor form, i.e. parents via the prior/transition factors, children, co-parents of its
children), the other variables on those factors get a dashed blue ring, and a readout lists the factors, the variables it
talks to, and the formula `messageFormula` with `{terms}` = each factor's `term` joined by `join`. **Show messages**
(button, visible once a variable is selected) draws an orange arrow from each of those factors to the variable. **Click a
factor**: lists the variables it connects. Click again to deselect. `observable: true` adds one chip per variable to
toggle observed / free. `el.dataset`: `selected`, `selectedFactor`, `reads` (factor ids), `observed`.
Config: `variables: [{id, label, pos:[x,y], observed, rep}]` (`label` KaTeX source), `factors: [{id, label, pos, vars:[ids],
term, rep}]` (`term` = KaTeX contribution of that factor to a message, `{v}` = the variable's label; default the label; keep
factor labels short, 1-4 characters fit the square, e.g. `A`, `P(x)`), `messageFormula` (KaTeX, `{v}`, `{terms}`), `join`
(default `' + '`), positions in a 400x230 box (`box: [W, H]`; with `unroll` the width grows by `dx*(n-1)`), `unroll: n`,
`dx` (default 110), `t0`: every item with `rep: true` is repeated n times, shifted by `dx`; in its id/label/term `{t}`,
`{t-1}`, `{t+1}` = copy index (+ `t0`); in a factor's `vars` `'s@0'` = same copy, `'s@-1'` = previous copy (instance skipped
when it does not exist), plain `'x'` = a non-repeated variable, and in a non-rep factor `'s@0'` = absolute copy 0.
`observable`, `messages` (start showing), `select` (start with a variable selected), `labels: {reads, blanket, none, show,
hide, observe, observed, free, connects, hint, reset, variable, factor}`, `presets: [{label, variables, factors,
messageFormula, unroll, dx, join, box, select, observable}]` (buttons switch the whole graph; a preset overrides the
top-level key of the same name).
Example (two diseases): `variables: [{id: x, label: x, pos: [70,40]}, {id: z, label: z, pos: [70,190]}, {id: y, label: y,
pos: [300,115], observed: true}]`, `factors: [{id: A, label: 'P(x)', pos: [20,40], vars: [x]}, {id: B, label: 'P(z)', pos:
[20,190], vars: [z]}, {id: L, label: 'L', pos: [185,115], vars: [x,z,y], term: '\ln P(y\mid x,z)'}]`. Unrolled
chain: `unroll: 3`, `variables: [{id: s, label: 's_{t}', pos: [60,120], rep: true}]`, `factors: [{id: B, label: B, pos: [120,120],
vars: ['s@-1','s@0'], rep: true}]`.

#### `pomdp-lab`
A small discrete-time model (POMDP) you can edit, generate from and invert (`js/widgets/pomdp-lab.js`, HTML bars + SVG
curve; all wording from the config). Matrices as editable heat-grids: $\mathbf A$ (rows = outcomes, columns = states),
$\mathbf B_u$ (rows = next state, columns = current state, one grid per action, switch with the action buttons), $\mathbf D$
(initial prior); every column is a probability vector (editing a cell rescales the rest of its column; text field, `0.3` or
`0,3`). Time steps $\tau=1..T$; a **policy** = one action per transition ($T-1$ actions). Book signs, nothing flipped: $F$ and $G$ are
minimised and
$$F_\pi=\sum_\tau F_{\pi\tau},\quad F_{\pi\tau}=\mathbf s_{\pi\tau}\cdot\big(\ln\mathbf s_{\pi\tau}-\ln\mathbf A\cdot o_\tau-\ln\mathbf B_{\pi,\tau-1}\mathbf s_{\pi,\tau-1}\big),\ \mathbf s_{\pi,0}:=\mathbf D,$$
$$G_{\pi\tau}=\mathrm{KL}[\mathbf A\mathbf s_{\pi\tau}\,\|\,\mathbf C]+\mathbf H\cdot\mathbf s_{\pi\tau},\quad \pi=\sigma(-\mathbf G-\mathbf F),$$
$H_j=-\sum_o A_{oj}\ln A_{oj}$ (ambiguity), $\mathbf C$ = preferred outcome probabilities (normalised), $G$ summed over steps
$\ge$ `gFrom` (default 2). **Mode `generate`**: policy buttons; *Sample a trajectory* draws (seeded; each press a new draw) the true state
path and the outcomes; *Predict* shows, per step, bars of $\mathbf s_{\pi\tau}=\mathbf B_{\pi,\tau-1}\mathbf s_{\pi,\tau-1}$, bars of the
predicted outcomes $\mathbf A\mathbf s_{\pi\tau}$ and the ambiguity $\mathbf H\cdot\mathbf s_{\pi\tau}$. **Mode `infer`**: a select per step sets the
observed outcome ($-$ = not observed: flat likelihood); *Play / Step / Reset* run the Euler flow
$\mathbf v'=-\nabla_{\mathbf s}F_\pi$, $\mathbf s=\sigma(\mathbf v)$ (step-size slider `dt`) from uniform beliefs: the bars of
$\mathbf s_{\pi\tau}$ move, the $F_\pi$ curve falls (it never rises for small `dt`: the gradient is exact, including the term
through $\mathbf s_{\pi,\tau+1}$), thick ticks = the exact posterior (forward-backward), with the largest gap printed. The flow
converges to a minimum of this $F$, **not exactly** the exact posterior (beliefs about neighbouring steps are treated as
independent: close for noisy dynamics, far for near-deterministic ones with ambiguous data); with no observations it converges to
the forward prediction. *Use the sampled outcomes* copies the last sample into the observations. Below: for every policy the
converged $F_\pi$, $G_\pi$ and $\pi=\sigma(-\mathbf G-\mathbf F)$ (best policy outlined).
Config: `states`, `outcomes`, `actions` (labels, markdown inline; actions default to the keys of `B`), `short: {states, outcomes}` (short names
for bars and headers; default first 3 characters), `A` (rows = outcomes), `B: {actionLabel: matrix}`, `D`, `C`, `T` (3),
`policies: [[actionLabel, ...]]` (default: each action repeated), `policy` (initially selected), `gFrom`, `modes` (default
both, order = tabs), `mode` (start), `obs` (outcome index or -1 per step), `editable` (false = read-only grids), `seed`, `dt`
(.25), `maxIter` (200), flags `showA/showB/showD/showAmbiguity/showExact/showCurve/showPolicies` (true),
`labels: {generate, infer, policy, sample, predict, play, pause, step, reset, stepSize, iter, observe, none, useSample,
ambiguity, trueState, drawn, exact, free, expected, post, grids, nothing}`, `presets: [{label, ...any key above}]` (buttons
replace the whole model). `el.dataset`: `mode`, `policy`, `iter`, `F`, `s`, `exact` (JSON, step by outcome), `pi`, `g`, `fs`
(per policy), `path`, `outs` (last sample).
Presets used by the lessons: **door** (states closed/open; outcomes looks closed/looks open, sensor 0.8; actions push, wait; $\mathbf D=(0.9,0.1)$; $\mathbf C$ prefers
"looks open"; $T=3$, four policies) and **tmaze** (6 states = location cue/left arm/right arm $\times$ reward side; outcomes cue
says left/right, reward, no reward; actions cue, left, right; start at the cue, $T=3$, policies cue-left, cue-right, left-left, right-right). The Level 7 lesson `decision-planning` does not use this 6-state preset: it writes its own 8-state T-maze (4 places middle/cue/left/right $\times$ 2 contexts) in the lesson's widget config.
Example: `{mode: infer, obs: [0, 1, 1], showA: false, showB: false, showD: false, states: [closed, open], outcomes: [looks closed, looks open],
A: [[.8, .2], [.2, .8]], B: {push: [[.2, .05], [.8, .95]], wait: [[.9, .1], [.1, .9]]}, D: [.9, .1], C: [.2, .8]}`.

#### `blanket-sync`
Synchrony of two sets that are independent given a third value (`js/widgets/blanket-sync.js`, SVG, seeded; no maths text
hard-coded). Linear-Gaussian model: $b\sim\mathcal N(0,\text{sdB}^2)$, $x\mid b\sim\mathcal N(\text{slopeX}\,b,\text{noiseX}^2)$,
$\mu\mid b\sim\mathcal N(\text{sign}\cdot\text{slopeMu}\,b,\text{noiseMu}^2)$, with $x,\mu$ drawn independently given $b$.
Plot: $x$ horizontal, $\mu$ vertical; the cloud of samples (green), the thick line of conditional means (through the cross
at $b$), the sample correlation next to the exact one. **Condition on b** fades the cloud, shows a slider for $b$ and a
small red cloud at that $b$ with its axis-aligned 1-sd ellipse and the correlation inside the slice (about 0). A second
slider picks a mean internal value $\bar\mu$: the teal dashed line marks it, the teal curve over $x$ is the implied
distribution $p(x\mid\mu=\bar\mu)$ (exact Gaussian conditioning, $b$ integrated out), with mean and sd in the readout.
Buttons: Condition on b, Draw more samples (adds `n`, cap `maxN`), presets, Reset.
Config: `slopeX` 1, `slopeMu` 1, `sign` 1 (-1 = inverse synchrony), `noiseX` .5, `noiseMu` .5, `sdB` 1, `n` 150, `seed` 3,
`maxN` 900, `range` 4 (axes half-width), `b` 1, `muBar` 1, `conditioned`, `showImplied`, `showCorr`,
`labels: {x, mu, b (KaTeX source), more, reset, condition, uncondition, corr, sliceCorr, implied, mean, sd, sliderB, sliderMu, samples, theory}`,
`presets: [{label, sign, noiseX, noiseMu, slopeX, slopeMu, b, muBar}]`. `el.dataset`: `r`, `mean`, `sd`, `cond`.
Example: `{presets: [{label: Inverse, sign: -1}, {label: Noisy, noiseX: 1.2, noiseMu: 1.2}]}`.

#### `steady-state-walk`
A 2D random walker over contours of surprise (`js/widgets/steady-state-walk.js`, SVG, seeded, rAF loop; no maths text
hard-coded). Dynamics (Euler-Maruyama): $\Delta x=f(x)\Delta\tau+\omega\sqrt{\Delta\tau}$ with $\omega\sim\mathcal N(0,2\Gamma)$,
$\Gamma=\text{gamma}\cdot I$ (the widget's choice: noise covariance $2\Gamma$ makes $p\propto e^{-\mathfrak I}$ stationary for
$f=-\Gamma\nabla\mathfrak I$; the book writes the noise as $\mathcal N(0,\tfrac12\Gamma^{-1})$ in another convention). Surprise
$\mathfrak I(x)=-\ln p(x)$ for the Gaussian $p=\mathcal N(\text{center},\text{cov})$; grey ellipses mark 1, 2, 3 standard
deviations, the ring is the start. Mode buttons: **Restoring** $f=-\Gamma\nabla\mathfrak I$ (steady state);
**Restoring + circulating** $f=-(\Gamma-\mathsf Q)\nabla\mathfrak I$ with $\mathsf Q=\begin{pmatrix}0&q\\-q&0\end{pmatrix}$ (slider
`q`: same steady state, the path also circles the contours; this $\mathsf Q$ is the book's $Q(x)$ of Eq. A.50, not the
approximate posterior $Q$); **No drift** $f=0$ (dissipates). Slider *restoring strength* $k$ multiplies the drift only (noise
fixed): $k=1$ exact steady state, $k<1$ under-restored (average surprise rises). Changing mode or pressing Restart / New noise
re-runs from the start with the same seed (New noise: seed+1), so modes are compared on equal noise. Under the path: trail
(fading), a trace of $\mathfrak I$ with the average over the last `window` samples (black) and the entropy
$H=\mathbb E[\mathfrak I]=\ln(2\pi\sqrt{\det\text{cov}})+1$ (teal dashed), and readouts (now, average, entropy).
Config: `center` [0,0], `cov` [[2,.8],[.8,1.5]], `start` [5,5], `range` 6, `gamma` 1, `strength` 1, `qCirc` 1 (initial q,
slider 0..2), `dt` .05, `seed` 4, `prerun` 500 (steps done before first draw), `every` 4 (steps per sample/frame), `window` 300,
`traceLen` 700, `traceMax` 12, `trail` 400, `mode`, `modes` (subset of `restoring, circulating, none`), `autoplay`,
`showStrength`, `showTrace`, `labels: {x1, x2 (KaTeX), restoring, circulating, none, play, pause, reset, noise, strength, circ,
surprise, now, avg, entropy, trace}`, `presets: [{label, mode, strength, q, gamma}]`. `el.dataset`: `avg`, `now`, `H`, `mode`.
Example: `{modes: [restoring, none], presets: [{label: Weak, strength: 0.2}]}`.

#### `gaussian-fit`
Fit a Gaussian $q(x)=\mathcal N(\mu,\sigma^2)$ to a 1D target density $p(x)$ (`js/widgets/gaussian-fit.js`, SVG, grid of 800
points; no maths text hard-coded). Target: `components: [{w, mean, sd}]` (mixture) or `skew: {loc, scale, alpha}` (skew-normal,
the default when no components). The density panel shows $p$ (grey area), $q$ (red) and its mean (dashed); sliders $\mu$ and $\sigma$
(`sigmaRange`); dragging on the panel moves $\mu$ (when `showTaylor` is off). Readouts in nats, each with a bar (full scale `klMax`,
3) and a black tick at the best value the Gaussian family reaches (`showBest`): $D_{KL}[q\|p]=\int q\ln(q/p)$ and, if
`showForward`, $D_{KL}[p\|q]=\int p\ln(p/q)$. $q$ is renormalised on the grid, so both are true KLs (nonnegative, 0 only when
$q=p$); neither is ever negated. Buttons: **fitRev** minimises $D_{KL}[q\|p]$ numerically (Nelder-Mead from the mode-width fit of
each mode and from the moment fit; mode-seeking: on a bimodal $p$ it picks one mode, ln 2 for two equal modes), **fitFwd**
moment-matching (mean and variance of $p$; straddles both modes), **laplace** puts $\mu$ at a mode (`modeIndex`: left to right, default the
highest) with $\sigma^{-2}=-(\ln p)''(\mu)$. $D_{KL}[q\|p]$ is the divergence inside $F=D_{KL}[Q\|P(x\mid y)]-\ln P(y)$ (the gap that $F$
minimises); it needs $\ln p$ only up to a constant, so it is computable without the normalised posterior; $D_{KL}[p\|q]$ is the
other direction.
`showTaylor: true` adds a second panel, $\ln p$ (height `lnSpan` nats), with $\ln q$ and the Taylor polynomial of $\ln p$ at a point
$a$ (slider or drag; order buttons 0 / 1 / 2). Readout: curvature $(\ln p)''(a)$ and precision $-(\ln p)''(a)$ (if negative curvature);
for order 2 with negative curvature the Gaussian it implies, $\mu=a-(\ln p)'/(\ln p)''$, $\sigma^2=-1/(\ln p)''$, is drawn dashed
on the density panel (at the mode it is the Laplace fit). **useTaylor** copies it into $q$.
Config: `components` | `skew`, `range` [lo, hi] (default spans the target), `grid`, `mu`, `sigma`, `sigmaRange`, `showForward`
true, `showBest` true, `klMax` 3, `showTaylor` false, `modeIndex`, `a`, `order` 2, `lnSpan` 9,
`labels: {p, q, x, mu, sigma, klRev, klFwd (KaTeX sources, no $), bestTick, fitRev, fitFwd, laplace, useTaylor, density, logDensity,
point, order0, order1, order2, curvature, precision, taylorGauss, notNormalisable, nats (plain or $-text)}`,
`presets: [{label, mu, sigma, a, order, fit}]` (`fit`: `rev`, `fwd` or `laplace`, applied last). `el.dataset`: `mu`, `sigma`, `klRev`,
`klFwd`, `bestRev`, `bestFwd`, `a`, `order`, `curv`, `mode`.
Examples: bimodal `{components: [{w: .5, mean: -2.2, sd: .7}, {w: .5, mean: 2.2, sd: .7}], mu: 0, sigma: 1}`; skewed with Laplace
`{skew: {loc: -1, scale: 1.5, alpha: 5}, showTaylor: true}`.

#### `peb-regression`
Group regression on per-subject posteriors (`js/widgets/peb-regression.js`, SVG; no course text hard-coded). Subject $i$ has a
covariate $x_i$ and a first-level posterior $\mathcal N(m_i,\Pi_i^{-1})$, drawn as a dot at $m_i$ with a bar of one sd
$\Pi_i^{-1/2}$. Second-level model: $\theta_i\sim\mathcal N(\beta_0+\beta_1x_i,\ (\Pi^{(2)})^{-1})$, i.e. $X\beta$ with
$X=(1,x_i)$ and $\Pi^{(2)}$ the group *precision*. Sliders: $\beta_0$, $\beta_1$, $\Pi^{(2)}$ (red line = the group line;
grey dashed = the best slope-0 line). Toggle **shrinkage**: each dot is moved to the posterior of $\theta_i$ under the group prior,
$\hat m_i=(\Pi_i m_i+\Pi^{(2)}\ell_i)/(\Pi_i+\Pi^{(2)})$ with $\ell_i=\beta_0+\beta_1x_i$ and precision $\Pi_i+\Pi^{(2)}$ (teal dot and
bar; the original is faded; a short link joins them). Precise subjects barely move, imprecise ones are pulled to the line.
Readouts (nats), approximate log evidence marginal over each true $\theta_i$, $m_i\sim\mathcal N(\ell_i,\Pi_i^{-1}+(\Pi^{(2)})^{-1})$:
$$\ln E(\beta)=\sum_i\ln\mathcal N\!\big(m_i;\ \beta_0+\beta_1x_i,\ \Pi_i^{-1}+(\Pi^{(2)})^{-1}\big)$$
**slope free** uses the slider values; **slope 0** (a precise prior at $\beta_1=0$) uses $\beta_1=0$ with $\beta_0$ refitted
(weighted mean, weights $[\Pi_i^{-1}+(\Pi^{(2)})^{-1}]^{-1}$, at the current $\Pi^{(2)}$); **difference** = free minus slope 0 (a log Bayes
factor; positive favours the slope; the Occam penalty on $\beta$ itself is not included, flat priors on $\beta$). Buttons: *fitBoth*
(generalised least squares for $\beta_0,\beta_1$ at the current $\Pi^{(2)}$, the best-supported line), *fitFlat*.
Config: `subjects: [{x, m, sd}]`, `xRange`, `yRange` (default span the data), `beta0`, `beta1`, `pi2`, `beta0Range`, `beta1Range`,
`pi2Range` [0.1, 20], `shrink` true, `labels: {x, theta, beta0, beta1, pi2 (KaTeX sources, no $; defaults x, \theta, \beta_0,
\beta_1, \Pi^{(2)}), points, line, flat, shrunk, shrinkToggle, fitBoth, fitFlat, evFree, evNull, evDiff, nats (plain or $-text)}`,
`presets: [{label, beta0, beta1, pi2, shrink, fit}]` (`fit`: `both` or `flat`, applied last). `el.dataset`: `beta0`, `beta1`, `pi2`,
`lnEFree`, `lnENull`, `diff`, `flat`, `shrunk` (comma list), `shrink`.
Example (8 subjects, age): `{subjects: [{x: 20, m: 1.2, sd: .8}, {x: 25, m: 1.9, sd: .5}, {x: 31, m: 1.4, sd: 1}, {x: 38, m: 2.6, sd: .45},
{x: 44, m: 2.3, sd: .9}, {x: 52, m: 3.4, sd: .6}, {x: 60, m: 3.1, sd: .4}, {x: 67, m: 4, sd: .9}], xRange: [15, 72], yRange: [0, 5],
beta0: -0.5, beta1: 0.06, pi2: 3, beta0Range: [-3, 3], beta1Range: [-0.1, 0.15], pi2Range: [0.2, 20], labels: {x: '\\text{age}'}}`.
Hand-checked by script: slider values give $\ln E=-8.4994$, slope 0 $-10.0683$ (flat level 2.5613), difference $1.5689$;
fitBoth gives $\beta_0=0.4435$, $\beta_1=0.0496$, $\ln E=-7.0384$; first shrunk mean (x=20, slider values) $0.8712$.

#### `predictive-coding`
Prediction errors, precision weighting and gradient descent on the free energy (`js/widgets/predictive-coding.js`, SVG + HTML, rAF loop;
shared by the whole academy, symbols and texts come from `labels`). Signs: $F=\tfrac12\sum\epsilon\Pi\epsilon$ is minimised, $\dot\mu=-\nabla_\mu F$,
in generalized coordinates $\dot{\tilde\mu}-D\tilde\mu=-\nabla_{\tilde\mu}F$, action $\dot u=-\nabla_uF$. Mode tabs (`modes`; `mode` = first shown):
- **static**: one level, data $y$ (slider), prior mean $\eta$ (slider), mapping $g$. $\epsilon_y=y-g(\mu)$, $\epsilon_v=\mu-\eta$. Two number lines
  (cause: $\eta$ diamond, $\mu$ dot, dashed ring = minimum $\mu^*$; data: $y$ square, $g(\mu)$ ring) with red segments for the errors. Under the
  sliders: closed form $\mu^*=\dfrac{a\Pi_yy+\Pi_v\eta}{a^2\Pi_y+\Pi_v}$ when $g(x)=ax$ (plus the pull toward the data
  $a^2\Pi_y/(a^2\Pi_y+\Pi_v)$), else a Newton minimum labelled numerical. **Descend** runs $\dot\mu=-\nabla F$ until it stops (each frame is a fixed fraction
  of the time scale $1/\lambda$, so the animation lasts about a second for any precisions); Step; Reset.
- **hierarchy**: three rows, $\epsilon_y=y-g(\mu_1)$, $\epsilon_x=\mu_1-g_2(\mu_2)$, $\epsilon_v=\mu_2-\eta$, with $\Pi_y,\Pi_x,\Pi_v$; level 2 predicts level 1, which
  predicts the data. Numerical minimum shown.
- **dynamic**: generalized coordinates $\tilde\mu=(\mu,\mu',\mu'')$ of a hidden state tracking $y(t)=\text{offset}+\text{amp}\sin\omega t$ (data derivatives
  $\tilde y$ exact). Linear model $y=Gx$, $\dot x=f_xx+f_vv$: $\tilde\epsilon_y=\tilde y-G\tilde\mu$, $\tilde\epsilon_x=D\tilde\mu-(f_x\tilde\mu+f_v\tilde v)$ with
  $(D\tilde\mu)_i=\mu_{i+1}$ (last $=0$), $\tilde v=(v,0,0)$, $\epsilon_v=v-\eta$; precision of order $i$ is $\Pi\,\text{decay}^i$. Play runs real-time dynamics
  $\dot{\tilde\mu}-D\tilde\mu=-\nabla_{\tilde\mu}F$, $\dot v=-\nabla_vF$; plot: data (teal) vs prediction $G\mu$ (green); the buttons *Orders kept 1/2/3*
  drop the higher orders (1 order = visible lag, readout of the mean gap). Only linear $g$ (its `gain`) and $f$ here.
- **action**: arm drawn at angle $y=y_0+\text{dydu}\cdot u$ (thick), the belief $g(\mu)$ (green dotted), and $\eta$ = the descending prediction (gold dashed).
  Without the reflex only $\mu$ moves toward the data. **Enable reflex** adds $\dot u=-\nabla_uF=-\text{dydu}\,\Pi_y\epsilon_y$: the arm moves to fulfil the prediction;
  if $\Pi_y$ is large against $\Pi_v$ the belief is dragged toward the sensed arm (it stops believing "I am moving") while the arm moves faster; with small $\Pi_y$ the belief keeps the prediction but the arm moves slowly (sensory attenuation protects the belief "I am moving"; it does **not** speed the reflex up: the rate $\frac{\Pi_y\Pi_v}{\Pi_y+\Pi_v}(\eta-y)$ never falls as $\Pi_y$ rises; toy $y=0,\eta=1,\Pi_v=1$: $\Pi_y=4$ gives $\mu=.2,\dot u=.8$, $\Pi_y=.25$ gives $\mu=.8,\dot u=.2$). Readout: rate $-\text{dydu}^2\Pi_y\epsilon_y$.
Under the scene each error has a signed bar ($\epsilon$, full width = half the range) and a bar for its contribution $\tfrac12\Pi\epsilon^2$ to $F$ (full = largest $F$ since Reset),
with the numbers. Precision sliders are log-scale (`PiRange`).
Config: `mode`, `modes`, `g`, `g2` (`'identity'|'gain'|'tanh'|'sin'` or `{kind, gain}`, $g=\text{gain}\cdot\text{base}(x)$), `f: {x, v}`, `eta` 0, `y` 1, `y0` 0,
`mu0`, `Pi: {y, x, v}` (1), `PiRange` [.01, 100], `range` [-3, 3] (for $y,\eta,\mu$; angle range in action mode), `signal: {amp 1, omega 2, offset 0}`, `orders` 3, `decay` 1,
`showX` true, `dydu` 1, `reflex` false, `speed` 1, `autoplay` false, `window` 8, `show: {y, eta, Pi, closed}` (true),
`labels: {y, mu, mu2, eta, Py, Px, Pv, ey, ex, ev, F (KaTeX sources, no $); marks: {y, mu, eta, pred, min} (plain text in the SVG); descend, pause, step, reset, play, reflex, reflexOn,
orders ('Orders kept: {n}'), modeNames: {static, hierarchy, dynamic, action}; closed, minimum, weight, lag, rate, unit (suffix, e.g. '°')}`,
`presets: [{label, ...any config key}]`. `el.dataset`: `mode`, `F`, `mu`, `mustar`, `u`, `t`, `y`, `K`, `lag`, `reflex`, `running`.
Example: `{mode: static, g: {kind: gain, gain: 1}, y: 2, eta: -1, Pi: {y: 4, v: 1}}` (compromise 1.4).
Chapter 5 message passing can reuse it (each error is a message; the bars are the messages).

#### `mean-field-vb`
Mean-field variational Bayes on a joint over two discrete latent variables $x_1\in\{1..K_1\}$, $x_2\in\{1..K_2\}$ ($K\le4$) for a fixed
observation $y$ (`js/widgets/mean-field-vb.js`, HTML heat-grids + SVG trace; wording from the config). Three grids (rows $x_1$, columns $x_2$):
the joint $p(y,x_1,x_2)$ (sums to $p(y)$), the exact posterior $p(x\mid y)$ and the product $q_1(x_1)q_2(x_2)$; sliders set $q_1$ and $q_2$
(normalised). Book signs, nothing flipped: $F$ minimised,
$$F[q]=\sum_x q\,(\ln q-\ln p(y,x))=D_{KL}[q\,\|\,p(x\mid y)]-\ln p(y),$$
read out with $-\ln p(y)$ and the gap $=D_{KL}[q\|p(x\mid y)]$ (all in nats), plus **the smallest gap of any product** $q_1q_2$ (multi-start
coordinate search): 0 when the posterior is itself a product, positive when it is correlated (the floor that coordinate updates cannot
cross; it is shown as a dotted line on the trace). Buttons: **Update $q_1$** sets $\ln q_1(x_1)=\mathbb E_{q_2}[\ln p(y,x_1,x_2)]+\text{const}$,
**Update $q_2$** likewise, **Sweep** = both, **Reset**, **Show message terms** (for each value of the factor, the numbers $q_2(x_2)\ln p$ inside
the expectation, their sum and the new $q$). Each update minimises $F$ over one factor, so the trace of $F$ (after each update; dashed
line $-\ln p(y)$) never rises; moving a slider restarts the trace. Facts a preset can show: independent latents ($\rho=0$): one sweep gives the exact
posterior (gap 0); correlated: the gap stays positive; a symmetric start (uniform $q$) on a symmetric correlated joint is a fixed point that
the updates never leave (a saddle: nudge a slider), and different starts can end in different local minima.
Config: the joint is either a table `joint: [[..K2] per x1]` (any scale), or built from `marg1`, `marg2` (default uniform; or `K: [K1,K2]`),
`rho` ($|\rho|<1$) and `py` (0.2): $p(y,x_1,x_2)=p_y\,a_ib_j(1+\rho u_iv_j)/Z$, $u,v\in[-1,1]$ the positions of the values (positive $\rho$
favours matching positions). `names: [[x1 labels], [x2 labels]]` (KaTeX sources, default 1..K), `q1`, `q2` (start beliefs; ignored if the length does not
match the preset), `rhoSlider` (slider for $\rho$ with the marginal form), flags `showSliders`, `showMessages`, `showTrace` (true),
`labels: {joint, post, prod, update1, update2, sweep, reset, messages, hideMessages, rho, F, surprise, gap, best, trace, traceKey, sum, result}`,
`presets: [{label, ...any key above}]`. `el.dataset`: `F`, `surprise`, `gap`, `best`, `q1`, `q2`, `updates`, `trace`, `rho`.
Example: `{names: [['$a$','$b$'], ['$c$','$d$']], rho: 0.9, q1: [.6, .4], q2: [.3, .7], presets: [{label: independent, rho: 0}, {label: correlated, rho: 0.9}]}`.

#### `microcircuit`
A generic message circuit (`js/widgets/microcircuit.js`, SVG + HTML, rAF for Play; no inference, all names and formulas from the config).
Populations (round nodes) joined by synapses (arrows) that carry named messages, on horizontal bands (layers, nuclei, levels). Colours: input
teal, expectation green, error red, inhibitory grey, output purple, modulator gold (`cls`); an excitatory synapse ends in an arrowhead, an
inhibitory one in a round end (`sign: '-'`). **Click a node**: thick ring; incoming edges blue, outgoing orange, the rest dimmed; the readout
lists "Receives / Sends" with each message formula, kind, direction, frequency and sign. **Click an edge**: lights it and states message, synapse
sign, direction badge, frequency, `note`. **Play messages** sends one dot (colour = message kind) along each edge of `sequence`, one per
~0.75 s, with the step in the readout; Stop/Reset. Optional **modulator**: a gold node with dashed arrows to the listed edges and a slider that
scales their thickness and dot size (visual only; the readout prints the weighting, e.g. $\Pi_y=1.5$). Edges in both directions between two
nodes are drawn side by side. No self-loops (use two nodes). Hues, not colour names, in the text: blue = incoming, orange = outgoing.
```yaml
config:
  box: [400, 300]                        # drawing box; all positions are in it (default 400 x 300)
  bands: [{label: "layers II/III", y0: 0, y1: 100}, ...]
  nodes:
    - {id: ss, label: "\\epsilon^{(i)}", name: "spiny stellate", pos: [90, 135], cls: input,
       populations: "layer IV", info: "Markdown sentence", tag: "A"}
  edges:
    - {id: e1, from: ss, to: sp, sign: '+', message: {label: "\\Pi\\epsilon", kind: error},
       direction: ascending, freq: gamma, note: "Markdown"}
  sequence: [e1, e2, e3]                 # order of Play (default: all edges)
  modulator: {node: mod, edges: [e1], label: "\\Pi_y", min: 0, max: 2, value: 1, step: .1, weighting: "{label}={g}"}
  hideNames: false      # true: nodes show only `tag` (default A, B, C...); names, populations, info, notes hidden
  showLabels: true      # message formulas and kinds   (all six flags below default true; false hides the piece)
  showSigns, showFreq, showModulator, showBands, showLegend
  select: sp            # start with a node (or edge) selected
  labels: {reads, sends, none, hint, play, stop, reset, sign, excitatory, inhibitory, message, direction, step, gain, cls: {error: "..."}}
  presets: [{label: "continuous", ...any key above}, {label: "discrete", nodes: [...], edges: [...]}]
```
`kind` in {prediction, error, expectation, policy, precision} sets the dot colour; `direction` is a free badge (ascending | descending |
intrinsic, or any text). Presets replace the whole circuit (a preset overrides the same-named top-level keys): a discrete/continuous
toggle, a "with / without modulator" toggle (`modulator: null`) or a stepwise reveal are presets. For an mcq "which population?" use
`hideNames: true`, `showBands: false` (layer names would give it away) and, if the formula would, `showLabels: false`.
`el.dataset`: `selected`, `selectedEdge`, `reads`, `sends` (edge ids), `playing`, `step`, `gain`, `preset`.
Covers the Level 5 presets: `column` (anatomy, signs), `pc`, `pomdp`, `spinal`, `bg` (modulator = dopamine), `hybrid`; any layered
signal-flow diagram (Bayes filter, learning loop, a network layer diagram) is the same config.

#### `dirichlet-counts`
Dirichlet counts of one or more columns $j$ of a likelihood matrix $\mathbf A$ (`js/widgets/dirichlet-counts.js`, plain HTML; all
text from the config; names are markdown inline and may carry `$..$`). Per column (a card) and outcome row $i$: the count
$a_{ij}$ (with `+1` / `−1` buttons if `editable`), a bar for the expected likelihood $\mathbb E[A_{ij}]=a_{ij}/a_{0j}$
($a_{0j}=\sum_i a_{ij}$), and the novelty (parameter information gain, Eq. B.31-B.33), exact and approximate:
$$W_{ij}=D_{KL}\big[\mathrm{Dir}(\mathbf a_{\cdot j}+e_i)\,\|\,\mathrm{Dir}(\mathbf a_{\cdot j})\big]=\ln\frac{a_{0j}}{a_{ij}}+\psi(a_{ij}+1)-\psi(a_{0j}+1)\approx\frac1{2a_{ij}}-\frac1{2a_{0j}}.$$
$\psi$ (digamma) by recurrence plus asymptotic series (exported `psi`, `noveltyExact`, `noveltyApprox`).
Config: `outcomes: [names]`; `columns: [{name, a: [counts], truth: [probs]}]` (`truth` only for sampling); `editable`;
`observe: true` (buttons "observe outcome $o$" applying $\mathbf a\leftarrow\mathbf a+\mathbf o\otimes\mathbf s$: column $j$ gains $s_j$),
with `beliefs: [{label, s: [per column]}]` choosing $\mathbf s$ (default one-hot per column; one column: no choice);
`sample: true` (a button per column drawing an outcome from `truth`, seeded stream `seed`, added with a one-hot belief);
`options: [{name, s, o?}]` ("where to look"): bars of the expected novelty $\mathbf o\cdot\mathbf W\mathbf s=\sum_j s_j\sum_i o_iW_{ij}$
with $\mathbf o=\mathbb E[\mathbf A]\mathbf s$ unless `o` is given, best option starred; `visitNext: true` (button: take the option
of largest expected novelty, ties to the first, draw its outcome from `truth` of the column of largest $s$, add it with
belief $s$; no preferences, so inhibition of return emerges: tiles 1,2,3,4,1,... with equal start counts);
`showExpected`, `showNovelty`, `showApprox`, `showOptions` (default true), `minCount` (0.05), `labels: {counts, expected,
novelty, approx, observe ({o}), belief, sample ({name}), visit, options, reset, update, last}`,
`presets: [{label, columns: [{a}]}]` (reset the counts). `el.dataset`: `a`, `w`, `wapprox`, `opts` (columns joined by ` | `).
Presets (copy into the lesson):
- `coin`: `{outcomes: [heads, tails], columns: [{name: coin, a: [1, 1], truth: [0.7, 0.3]}], editable: true, observe: true, sample: true,
  options: [{name: flip the coin, s: [1]}], labels: {sample: "Flip the {name}"}}` ($W=0.193$, approx. $0.25$).
- `two-coins`: `{outcomes: [heads, tails], columns: [{name: "coin A (5 flips)", a: [3, 4], truth: [.5, .5]}, {name: "coin B (100 flips)",
  a: [53, 49], truth: [.5, .5]}], sample: true, options: [{name: flip coin A, s: [1, 0]}, {name: flip coin B, s: [0, 1]}]}`
  (expected novelty $0.066$ vs $0.005$; the 5-flip coin teaches 13 times more).
- `tiles`: 4 columns `a: [1, 1]`, `truth` per tile, `options` one per tile (`s` one-hot), `visitNext: true`, no `observe`.

#### `deep-levels`
Two-level discrete hierarchy, sentences over words (`js/widgets/deep-levels.js`, plain HTML; all text from the config; names are
markdown inline and may carry `$..$`). A higher-level state $k$ (a sentence) persists over all $T$ word steps and predicts the word
$w_t(k)$ at step $t$; those predictions are the empirical prior $\mathbf D$ of the lower-level POMDP for that word:
$$D_t(w)=\sum_k Q(k\mid\text{words before }t)\,P(w\mid k,t),\qquad Q(k\mid\text{words})\propto P(k)\prod_t P(\text{word}_t\mid k,t),$$
$P(w\mid k,t)=1-\text{noise}$ if $w=w_t(k)$, else $\text{noise}/(\#\text{words}-1)$. One card per word step $t$ (header
$\tau^{(2)}=t$, ticks $\tau^{(1)}=1..$`fastSteps` showing the faster scale inside each word, a "next" badge on the first unread step):
buttons to set or clear the word read at that step, and bars of the predicted word distribution (= $\mathbf D$ at step 1, the
next-word prediction at later steps). Below: every sentence with its words (chips that match the evidence are shaded) and a bar
prior (tick) $\to$ posterior; sentences with zero posterior fade; if no sentence fits, `labels.inconsistent` shows.
Config: `words: [names]`; `sentences: [{words: [names]}]` (equal lengths); `prior: [numbers]` (normalised, default uniform);
`noise` (0); `fastSteps` (3); `evidence: [word|null,...]`; `presets: [{label, evidence}]`; `labels: {slow, fast (bare KaTeX), step, sentences,
prior, posterior, predicted, none, reset, next, inconsistent}`. `el.dataset`: `prior`, `post`, `d` (step-1 prediction), `next`
(prediction at the first step after the last read word, or `done`).
Presets (copy into the lesson):
- `reading` (six sentences of four words from flee/feed/wait): `words: [flee, feed, wait]`, `sentences:` flee wait feed wait; wait wait wait feed;
  wait flee wait feed; flee wait feed flee; wait wait wait flee; wait flee wait flee; `fastSteps: 3`, presets `flee`, `flee, wait, feed, wait`.
  Numbers: $\mathbf D$ at step 1 = flee 1/3, wait 2/3; after flee: sentences 1 and 4 at 0.5 each, step 2 wait 1.0, step 3 feed 1.0;
  after flee, wait, feed: step 4 wait 0.5, flee 0.5; after flee, wait, feed, wait: sentence 1 with probability 1.
- `two-sentences`: `words: [yes, no]`, sentences yes no no; yes yes no, `prior: [3, 1]`, `noise: 0.05`: $\mathbf D$ at step 1 = yes 0.95, no 0.05; with the prior 0.75/0.25
  the step 2 prediction for no is $0.75\cdot0.95+0.25\cdot0.05=0.725$ (the word yes at step 1 fits both sentences, the posterior stays 0.75/0.25).

#### `attractor-lab`
Movement as fulfilled proprioceptive predictions (`js/widgets/attractor-lab.js`; Eq. 8.1-8.5, Fig. 8.1). A limb with real position $x$
(the generative *process*, which has the action $u$) and an agent whose *model* has no $u$ and pulls $x$ toward the target $v$;
the belief $\mu$ follows $x$ through the data $y=x$. Deterministic, RK4, $dt=0.002$ s, horizon `T`. Three plots (position with
$x$, $\mu$, $v$; action $u$; phase portrait with the model's flow arrows), readouts (overshoot, time to 90%, settled within 5%, final $x$),
`Play` (live; sliders move the parameters while playing; stopped, a slider recomputes the whole run) and `Reset`.
- Mode `first` (model Eq. 8.3 $g=x$, $f=v-x$; process Eq. 8.4 $g=x$, $f=u$): $u=G(v-\mu)$ ($G$ = `actionGain`, 1 = the book's $u=v-\mu$),
$\dot\mu=(v-\mu)+\Pi_y(x-\mu)$, $\dot x=u$. With $a=v-\mu$, $b=v-x$ the rates are $-1$ and $-\Pi_y$: the approach is
$e^{-t\min(1,\Pi_y)}$, so more sensory precision never speeds it up. The phase plane is $(x,\dot x=u)$, a line $\dot x=v-x$.
- Mode `spring` (model Eq. 8.5, $x_1$ position, $x_2$ velocity): $\dot x_1=x_2$, $\dot x_2=\tfrac{\kappa}{m}(v-x_1)-b\,x_2$ ($b$ = `damping`;
$b=0$ is exactly Eq. 8.5, an extra we add); process $\dot x_2=u-c\,x_2$ ($c$ = `friction`), $u=\tfrac{\kappa}{m}(v-\mu_1)-b\mu_2$ (the acceleration the model predicts).
Belief from position data only: $\dot\mu_1=\mu_2+\Pi_y e$, $\dot\mu_2=f_2(\mu)+\tfrac14\Pi_y^2 e$, $e=x_1-\mu_1$. Natural frequency $\sqrt{\kappa/m}$;
critical damping $b=2\sqrt{\kappa/m}$ (overshoot $0$ at $\kappa/m=4$, $b=4$; $52.7\%$ at $b=0.8$; undamped: oscillates between $x_0$ and $2v-x_0$).
- **Precision only matters if the belief starts wrong or the limb is disturbed**: with $\mu_0=x_0$ (default) there is never a sensory error. Use `mu0` or `push`.
Config (keys can also sit in a preset; a preset overrides): `modes: [first, spring]` (buttons if more than one), `mode`, `v: 2`, `x0: 0`, `mu0` (initial belief, default $x_0$),
`push: {t, dx}` (the limb is pushed by `dx` at time `t`), `Pi: 1`, `PiRange: [0.1, 30]` (log slider), `kappa: 4`, `m: 1`, `damping: 0.8`, `friction: 0`,
`actionGain: 1`, `T: 8`, `speed: 1.5`, `range: [-1, 3]` (position axis), `show: {v, x0, mu0, Pi, kappa, m, damping, friction}` (sliders; default all except `mu0`, `friction`;
$\kappa$, $m$, $b$, $c$ only in spring mode), `showPhase`, `showAction`, `autoplay`, `labels` (names are markdown inline, may carry `$..$`), `presets: [{label, ...}]`.
`el.dataset`: `mode`, `x`, `mu`, `u`, `t`, `over`, `t90`, `settle`, `running`, `v`, `Pi`. Exported: `derivs`, `rk4`.
Presets (copy into the lesson):
- `point`: `{label: point attractor, mode: first, v: 2, x0: 0, Pi: 1}` (90% at 2.31 s, no overshoot).
- `low-precision`: `{label: belief already at the target, low precision, mode: first, mu0: 2, Pi: 0.1, show: {mu0: true}}` (belief says "already there": the limb reaches only $x=1.0$ at $t=8$).
- `high-precision`: same with `Pi: 20` (data pulls $\mu$ back, the limb moves: 90% at 2.36 s; the same speed as `point`, not faster).
- `push`: `{label: push, mode: first, v: 2, push: {t: 4, dx: -1.5}, T: 10}` (the attractor pulls the limb back).
- `spring`: `{label: spring: overshoot, mode: spring, kappa: 4, m: 1, damping: 0.8}` (52.7% overshoot, settles in 6.9 s); `spring-undamped` `damping: 0` (oscillates forever, peak $4$); `spring-critical` `damping: 4` (no overshoot, 90% at 1.95 s).


#### `flow-lab`
General ODE trajectory viewer (`js/widgets/flow-lab.js`; Eq. 8.6-8.7). Deterministic RK4, fixed step, horizon `T`; `Play` (live; sliders change parameters while playing, stopped a slider recomputes the run) and `Reset`.
A second copy of the run starts from `x0` nudged by `nudge` in component `nudgeIndex` (sensitivity); the slider $\delta$ runs $0, 10^{-6},\dots,1$.
- `system: lotka-volterra` (Eq. 8.6): $\dot x=x\circ(v+Ax)$, any dimension. Plots the populations against time, a strip coloured by the species with the greatest population at each time (the peaks as a sequence), and the sequence as text (`p → h → c → …`) with the period of the first species. $A_{ij}$ is the effect of species $j$ on the growth rate of $i$. Config: `v`, `A`, `x0`, `names` (short, strip and sequence), `nameLong` (legend), `T: 100`, `speed: 8`, `dt: 0.01`, `sliders: [{label, v: i | A: [[i,j],..], min, max, step}]` (one slider sets all listed cells; default one per $v_i$).
- `system: lorenz` (Eq. 8.7): $\dot x_1=\sigma(x_2-x_1)$, $\dot x_2=x_1(\rho-x_3)-x_2$, $\dot x_3=x_1x_2-\beta x_3$. 2D projection with a fading trail (`view: xz | xy | yz | tilt`, buttons switch it; `tilt` is a rotated 3D view, slider `azimuth`) and $x_1(t)$ for both runs; readouts: state, separation now, first time the two runs are more than 1 apart. Config: `sigma: 10`, `rho: 28`, `beta: 8/3`, `x0: [1,1,20]`, `T: 40`, `speed: 4`, `dt: 0.005`, `show: {sigma, rho, beta, nudge, azimuth}` (false hides a slider).
- Common: `autoplay`, `labels` (`play, pause, reset, main, nudged, sep, sepTime, seq, period, pop, strip, proj, x1t, never`), `presets: [{label, ..keys..}]`. `el.dataset`: `system, t, running, x, sep, seq, period, firstApart`. Exported: `lvDeriv, lorenzDeriv, rk4`.
Presets (copy into the lesson):
- `lv-sequence`: `{system: lotka-volterra, names: [p,h,c], nameLong: [plants, herbivores, carnivores], v: [1,1,1], A: [[-1,-1.5,-0.5],[-0.5,-1,-1.5],[-1.5,-0.5,-1]], x0: [0.5,0.3,0.1], sliders: [{label: 'a_{12}', A: [[0,1],[1,2],[2,0]], min: -2, max: 0}, {label: 'a_{13}', A: [[0,2],[1,0],[2,1]], min: -2, max: 0}]}`: endless cycle $p\to h\to c\to p\dots$, period 24.7 ($A_{12}+A_{13}=-2$ keeps it exactly periodic; the sum below $-2$ damps it, above $-2$ lengthens each cycle). Cyclic competition, not a food chain: each species is hurt by the next one in the cycle.
- `lorenz-chaos`: `{system: lorenz, rho: 28, nudge: 0.000001, view: xz}`: the copies are 1 apart at $t\approx13.2$ and then look unrelated (set `nudge: 0` for one run).
- `lorenz-rho-slider`: `{system: lorenz, rho: 10, nudge: 0}`, $\rho$ slider $0$ to $50$: $\rho<1$ decays to the origin, $1<\rho<24.7$ settles on a fixed point, $\rho=28$ is the butterfly.

#### `coupled-agents`
Two agents with continuous models that listen to each other (`js/widgets/coupled-agents.js`; Sec. 8.4, Figs 8.4-8.5). Agent 1: $\dot x=f(x)+w_1\kappa\,(T^{-1}(y)-x)$; agent 2: $\dot y=F(y)+w_2\kappa\,(T(x)-y)$. $\kappa$ (slider, `0..kmax`) is the inference coupling: how strongly each agent corrects its state towards what it hears, i.e. how well it has learned the other. $T$ is a fixed map applied component-wise, $T_i(x)=\text{scale}_i\,x+\text{cubic}_i\,x^3+\text{shift}_i$, and agent 2's own model is agent 1's seen through $T$ ($F_i(y)=T_i'(x_i)f_i(x)$), so with $T=\text{id}$ the models are equal. Models: `system: lorenz` (Eq. 8.7) or `oscillator` (Stuart-Landau, `mu`, `omega`). `p2: {sigma,rho,beta,mu,omega}` overrides agent 2's own parameters.
- `turn: 0`: both listen all the time. `turn: P>0`: the agents alternate every $P$ time units (`first: 1|2`); the speaker runs on its own model, the listener listens. Strip = who sings (grey = both listen).
- Plots: $x_c(t)$ and $y_c(t)$ (`comp`, default 0); scatter $x_c$ vs $y_c$ with a dashed guide $y=T(x)$ (`guide: false` hides it): the line $y=x$ for identical synchrony, a curve for generalized synchrony. Readouts: mismatch $\|y-T(x)\|$ now, mean over the second half, and at the last hand-over (a jump means the new singer did not continue the same song).
- Config: `kappa: 0`, `kmax: 6`, `turn`, `first`, `comp`, `transform: {scale, shift, cubic}` (per component; scale > 0, cubic >= 0), `x0`, `y0` (defaults Lorenz `[1,1,20]`, `[-5,-3,25]`; oscillator `[1,0]`, `[-0.3,0.8]`), `T: 40`, `speed: 4`, `dt: 0.005`, `names: ['1','2']`, `autoplay`, `show: {kappa}`, `labels`, `presets`. `el.dataset`: `t, running, err, errMean, kappa, jump, speaker, x, y`.
- Measured (Lorenz, $T$ = id or the preset below): $\kappa=0$ mean mismatch about 20 (identical) / 41 (generalized); with turn 8 and $\kappa\ge2$ it is 0.00; $\kappa=1$ is the threshold (0.06 identical, 1.1 generalized).
Presets (copy into the lesson):
- `independent`: `{kappa: 0, turn: 8}` (scatter fills a cloud).
- `identical-sync`: `{kappa: 4, turn: 8}` (points on the line $y=x$; hand-overs seamless).
- `generalized-sync`: `{kappa: 4, turn: 8, transform: {scale: [1.5, 1.5, 1], cubic: [0.01, 0.01, 0]}}` (different model for agent 2; the scatter is the curve $y=1.5x+0.01x^3$).

#### `hybrid-saccade`
A hybrid (discrete + continuous) model turning a decision into an eye movement (`js/widgets/hybrid-saccade.js`; Sec. 8.5, Figs 8.6-8.7, Eq. 8.8). Discrete layer: a posterior $Q_\tau(o)$ over the outcomes $o$ (places the eye can be: fixation plus targets) at each discrete step $\tau$ (bars, one group per step; the selected step is shaded, click a group or use the step buttons). Each outcome has a continuous location $\eta_o$ and $P(v\mid o)=\mathcal N(\eta_o,\Pi_v^{-1})$; the prior over the cause is the Bayesian model average $q_\tau=\sum_o Q_\tau(o)\,\eta_o$ (black diamond in the plane for the selected step; a belief spread over opposite targets pulls $q$ back to the middle). Continuous layer: during step $\tau$ the eye $x$ (2D) fulfils that prior; the closed loop is the critically damped spring $\ddot x=w^2(q_\tau-x)-2w\dot x$ with $w=\omega_0\sqrt{\Pi_v}$ (the precision of the prior is the stiffness of the pull; bell-shaped speed, Fig 8.7 bottom). Reciprocal message: the mean eye position in the last fifth of each step gives evidence $L(o)=\exp(-\Pi_y|\bar x_\tau-\eta_o|^2/2)$ and the updated belief $Q'_\tau\propto Q_\tau L$ appears as a hollow outline over each bar once that step has been played. Time in ms; deterministic.
- Controls: step buttons; one weight slider per outcome for the selected step (raw weights, % shown is normalized); evidence buttons (`Belief <name>` puts `conf` on that outcome), `Flat`, `Copy to later steps`; sliders $\Pi_v$ (log, `PiVRange`) and $\tau_2/\tau_1$ (ms per step, `stepRange`); Play replays the trial in `playSec` seconds (the cue dot shows only during step 1), Reset shows the whole trial. Plots: plane (targets, eye path darker with later steps, eye dot), $x_1(t),x_2(t)$ with dashed piecewise-constant $q$, speed (units/s).
- Config: `outcomes: [{name, eta: [x,y]}]` (default fixation, up, right, down, left at unit distance), `stages: ['cue','delay','saccade','fixate']` (its length is the number of steps), `beliefs: [[w..],..]` (per step; default fixation), `cue: 1` (outcome index shown as a dot, or null), `x0`, `PiV: 1`, `PiVRange: [0.1,30]`, `omega0: 0.02` (1/ms), `stepMs: 250`, `stepRange: [80,600]`, `PiY: 8`, `conf: 0.9`, `playSec: 4`, `autoplay`, `show: {beliefs, PiV, stepMs, feedback}`, `labels`, `presets: [{label, ..}]`.
- `el.dataset` readouts: `t` (ms revealed), `running`, `step` (selected, 1-based), `PiV`, `stepMs`, `Q` (normalized beliefs, steps separated by `;`, outcomes by `,`), `q` (prior per step, `x,y;x,y;..`), `post` (updated beliefs, as `Q`), `x` (eye now), `final`, `peak` (peak speed, units/s), `arrive` (ms when within 5% of the last prior, empty if never).
- Measured: with the preset below $q_3=q_4=(0,0.80)$ (the average hedges: $0.85-0.05$), peak speed $5.9$ units/s at $t\approx 550$ ms, final $(0,0.80)$; a flat belief over the five outcomes gives $q=(0,0)$ and no movement; $\Pi_v=0.2$ with 150 ms steps does not arrive within the trial.
Preset (copy into the lesson):
- `cue-delay-saccade`: `{cue: 1, beliefs: [[1,0,0,0,0],[1,0,0,0,0],[0,0.85,0.05,0.05,0.05],[0,0.85,0.05,0.05,0.05]]}` (stages cue, delay, saccade, fixate; target up).
