# Lesson quick reference

The short version of `docs/LESSON_FORMAT.md`, for lesson sessions. The full
doc is the source of truth; open it only for the map format or engine-level rules. A widget's config is
in `docs/widgets/<name>.md` (index: `docs/widgets/README.md`).

## Registering (`courses/<course>/course.yaml`)

```yaml
      - id: ch03-circle               # must equal the lesson file's id
        title: "Guided Problem: …"
        kind: guided                  # concept | guided | traps | map | review | challenge | exam
        file: ch03/circle.yaml        # omit → planned node
        summary: One or two sentences shown before starting.
```

## Lesson file

```yaml
id: ch03-circle
title: …
kind: guided
cards:
  - type: text
    id: hook          # unique; never rename a played card's id
```

### `own:` (concept lessons and guided proofs: the "what you now own" summary)

A **guided proof** (`kind: guided` plus `proof: true` in the lesson file) ends in a
general result, so it takes `own:` and enters Recap like a concept lesson. A
**guided problem** (no `proof`) solves one specific case with its own numbers: no
`own:`, no Recap; close with a plain text card (method used, teaser). Say which one a
planned node is in its `summary:`.

```yaml
own: |
  - **Not a tensor**: the coefficients {{ $\Gamma^k_{ij}$ }} transform with
    {{ an inhomogeneous second-derivative term }}.
cards:
  ...
  - type: text          # LAST card: shows `own` (markers stripped), titled
    id: summary         # "What you now own" unless `title:` is given;
    body: |             # its body (optional) follows: the teaser
      **Next:** …
```

**Self-contained rule:** a summary is read alone (and as Recap blanks), so define in it every symbol, chart, map,
connection and example it recalls, with its type ("$\nabla^P$ = the polar-chart connection on $\mathbb{R}^2$"). State the setup before the formula that uses it. Check each bullet: could someone who skipped the lesson read it?

**Shape (model: `courses/diff-geometry-gr/ch03/atlases.yaml`):** open with the setting (space, charts, objects); then each
bullet = a bold name, one line of words, and its main formula on its own displayed `$$…$$` line (split long ones into
phone-safe pieces; line breaks are `\\`, never `\ `). Runes as `\text{ᛖ}`. Never "the book" or source section labels (C.3).
Use the source's notation exactly. A guided problem's last text card lists the method and the formulas it used.
`validate` warns when under a third of the bullets with math display a formula, or a source label appears.

The Recap button hides some `{{ … }}` spans and asks the learner to recall
them; only marked spans are ever hidden. Each blank is a spaced-repetition
item keyed by a hash of its text: **editing a blank resets its progress**,
editing around it does not; the same text twice is one item.
Markers go outside math (`{{ $x$ }}`, never `$ {{x}} $`); a blank may be a
whole `$$…$$` line. Marking rules:
- mark main results (definitions, the central law, a defining property);
  not notation introductions or intermediate algebra;
- **3–6 blanks** per summary (validator: at least 2, no nesting, balanced);
- each blank recallable from its own sentence; no two blanks that give each
  other away;
- prefer whole formulas (`{{ $\nabla_\mathcal{X}f = \mathcal{X}(f)$ }}`) over bare symbols;
- **blank the defining formulas** (a `{{ $$…$$ }}` line for displayed ones), not prose: never hide the verb or
  key word of a sentence ("{{ respects adding and scaling }}" is unguessable). Prose blanks only when the
  sentence itself recalls the answer (a name such as "they are {{ **contravariant** }}" after its formula).

Shared optional fields: `title`, `tag`. Question cards also take
`explanation` and `review: false` (only for cards that make no sense alone,
e.g. a question about a widget just shown). Prompts, hints and feedback must be
**self-contained** (restate the setup; never "previous card", "as shown
above"). Never name a theme-dependent colour; use labels or the fixed hues
(basis purple, vector components blue, covectors orange).

## Card types

```yaml
- type: text
  id: …
  body: |
    Markdown with $inline$ and $$display$$ math.

- type: mcq
  id: …
  prompt: |
    …
  multiple: false        # true → select all that apply
  shuffle: true          # false keeps order (True/False)
  options:
    - text: '$\tfrac12$'
      correct: true
    - text: '$2$'
      feedback: |
        The misconception behind it, explained.   # every wrong option
  explanation: |
    …

- type: numeric
  id: …
  prompt: …
  answer: -1
  tolerance: 0.001       # optional
  answerText: '-1'       # optional
  wrong:                 # optional targeted feedback
    - { value: 0, feedback: … }   # matches within 0.5% (or the card tolerance, or its own `tolerance:`)
  hint: …
  explanation: …         # reader may type decimals or fractions

- type: build            # assemble an expression from tiles
  id: …
  prompt: …
  prefix: 'y^j ='        # optional; prefix + answer must fit one phone line
  suffix: ''
  tiles: ['\sum_{i=1}^d', 'J_i^j', '(J^{-1})_i^j', 'x^i']   # distractors = misconceptions
  answers:               # every accepted sequence (commuted factors too)
    - ['\sum_{i=1}^d', 'J_i^j', 'x^i']
  wrong:
    - { answer: ['\sum_{i=1}^d', '(J^{-1})_i^j', 'x^i'], feedback: … }
  hint: …
  explanation: …         # each tile usable once; list twice if needed twice

- type: order            # proof steps, listed in CORRECT order, shown shuffled
  id: …
  prompt: Put the proof in order.
  steps: ['…', '…']
  hint: …
  explanation: …

- type: widget
  id: …
  widget: circle-charts
  config: { … }          # see the widget's subsection in LESSON_FORMAT.md
  body: |
    What to drag and what to watch.   # follow with a question on what was seen
```

## Images (full rules: `docs/IMAGES.md`)

Any card takes `image:` (one object or a list): `src` (in `courses/<id>/img/`), `alt`, one-sentence `caption` that teaches
something, `credit`, `link` (source page), optional `place: bottom`, `mat: true`. Max 4 per lesson (8 in the intro level),
free licenses only, fetched with `node tools/fetch-image.mjs search|get` (it resizes and writes `img/credits.yaml`).
Use for people introduced, described experiments and scenarios, real objects; never a decoration, never the answer.

## Widgets (config details: `docs/widgets/<name>.md`)

- `basis-playground`: drag a new basis; watch a fixed vector's (and covector's) components.
- `machine-playground`: tensor as a slot machine; drag input vectors, watch the output.
- `map-builder`: arrows between two finite sets; injective/surjective/bijective.
- `ball-probe`: is a set open? drag $p$, set radius $r$; line, plane, circle arc, subspaces, `pair: true` for Hausdorff.
- `preimage-explorer`: continuity via preimages of an open interval.
- `circle-charts`: θ/φ angle charts on $S^1$ (or `stereo: true` for $\sigma = x/(1-y)$), overlap pieces, draggable $p$, transition graph.
- `curve-velocity`: two curves through $p$ (plane, or `circle: true` for $S^1$ with θ); drag velocity and bend handles; readouts $(f\circ\gamma)'(0)$, components $v^i$, "same velocity?" badge.
- `chart-basis`: coordinate lines of one or two charts (cartesian, polar with `cut: right|left`, C.3 `X`, `Y`) in the plane, draggable $p$, basis $(\partial/\partial\mathscr{X}^i)_p$ in purple, draggable $v$; components per chart, Jacobian $(\partial\mathscr{Y}^i/\partial\mathscr{X}^j)_p$, `chain`, `basisOnly`, `inverse`.
- `parallel-transport`: a curve (circle $\delta_{r_0}$, vertical $\gamma_{x_0}$, radial, radial $\lambda^2$), λ slider and Play; a vector transported under $\nabla^{\mathrm{E}}$ (cartesian components constant) or $\nabla^{\mathrm{P}}$ (polar constant, stops at the cut/origin); components of $\mathcal{Z}, v_\gamma, a_\gamma$ in both charts, transport equation in numbers, "Autoparallel?" badge. Also $\nabla^{\mathrm{W}}$ (`W`, frame $e_1, e_2$ parallel), $\nabla^{\kappa}$ (`kappa`, $\Gamma^1_{22} = \kappa a$), closed `rectangle` loop with "After the loop" $\Delta z$ vs $-\mathrm{Riem}^1_{212}z^2\times$area, `compareE` (dashed ∇ᴱ copy, angle), `torsion` readout.
- `time-slices`: 1+1 spacetime ($a$ across, $\tau$ up), slices $\mathcal{S}_c$ of a time function (`flat` $\tau$, `wavy` $\tau + 0.3\sin a$, `squared` $\tau^2$, `boosted` $(\tau - 0.5a)/\sqrt{0.75}$), $c$ slider with the gold slice, draggable $p$ with $\ker(dt)_p$ (ink) and $(dt)_p$ as orange level lines $\pm1$; readout $(dt)_p$, kernel vector, "Absolute time?" badge (No with a point where $dt = 0$).
- `rotating-grid`: top view of space; a free particle $x = x_0 + v\,t$ (straight) seen in the inertial chart and in a chart rotating at $\omega$ (trace curls); `view: inertial | rotating | both`, t slider with Play, draggable $x_0$ and $v$ (at $t = 0$); in the rotating panel $\dot y$ (blue), Coriolis (gold), centrifugal (green), sum $\ddot y$ (ink); readout with $\Gamma^1_{02} = -\omega$, $\Gamma^2_{01} = \omega$, $\Gamma^\alpha_{00} = -\omega^2 y^\alpha$.
- `falling-cloud`: tides near a point mass ($x^1$ radial); a ring of free particles around $c_0$ falls exactly; `view: sources | falling | both` (falling chart $y = x - b(t)$ magnified by `zoom`: circle → egg), t slider with Play (auto stop), draggable $c_0$ on the axis; gold exact tidal accelerations, `linear` adds dashed $-\mathrm{Riem}^\alpha{}_{0\beta0}\eta^\beta$ and the tidal-equation ellipse; readout $\mathrm{Riem}^1{}_{010} = -2G_NM/r^3$, $\mathrm{Riem}^2{}_{020} = G_NM/r^3$, trace $0 = \mathrm{Ric}_{00}$, outer/inner/side offsets.
- `light-cones`: 1+1 Lorentzian spacetime, signature $(+,-)$ ($a$ across, $\tau$ up, components in the order $(X^a, X^\tau)$); metrics `minkowski`, `tilted` ($g = d\tau\otimes d\tau - \sigma\otimes\sigma$, $\sigma = da - (a/4)\,d\tau$, cones lean), `scaled` ($d\tau\otimes d\tau - 4\,da\otimes da$, narrow cones); light cone at draggable $p$ with future half shaded, $\text{ᛏ}(p)$ green, draggable $\mathcal{X}_p$ (blue, magnet onto null lines); readout $g_p(\mathcal{X}_p,\mathcal{X}_p)$ and $g_p(\text{ᛏ}(p),\mathcal{X}_p)$ in numbers, `badge` words timelike/lightlike/spacelike and future/past directed (`badge: false`: numbers only); `field` small cones on a grid, `orientation: down|false`, `flip`.
- `worldline-clock`: 1+1 spacetime as `light-cones` (`metric`, $(a,\tau)$ order); worldline from $A = (0,0)$ to $B = (0,T)$ through 1–2 draggable `kinks` ($\lambda\in[0,n]$, one unit per piece, $v_\gamma$ = displacement) or a Bézier `bend` ($\lambda\in[0,2]$); small cones with $v_\gamma$ (blue), λ slider with Play, dot with its clock; readout $v_\gamma$, $g(v_\gamma,v_\gamma)$, $\text{ᛇ}_\gamma$, $s_\gamma$, proper time $\tau_{[0,\lambda]}[\gamma] = \int s_\gamma\,d\lambda$ vs the dot's chart coordinate $\tau$; red pieces (spacelike/past), gold (lightlike); badge "Massive worldline?"; `compare` (straight $A\to B$, twin $8$ vs $10$), `massless` (null pieces, Minkowski).
- `observer-frame`: 1+1 Minkowski ($(a,\tau)$ order, $(+,-)$); an observer at $p$ with chart speed $u$ (slider, or drag $e_0$ along the unit hyperbola): frame $e_0 = (u,1)/\sqrt{1-u^2}$, $e_1 = (1,u)/\sqrt{1-u^2}$ in purple, closing like scissors on the light line; dashed unit hyperbolae $g = \pm1$; draggable $\mathcal{X}$ (blue) with measured components $X^0 = g(e_0,\mathcal{X})$, $X^1 = -g(e_1,\mathcal{X})$ as a parallelogram; readout orthonormality in numbers, $X^0e_0 + X^1e_1 = \mathcal{X}$, $g(\mathcal{X},\mathcal{X})$ both ways, badge measured speed $|X^1/X^0|$ ($<1$ timelike, $=1$ light, spacelike: none); `compare` faint frame at rest.
- `area-cell`: what $\sqrt{\det g}$ measures; left the chart's coordinates with a gold square cell of side $\Delta$ (slider) around draggable $p$, right the manifold (`polar`, unit `sphere` turning to face the cell, `sheared` $(2a+b, b)$, `cartesian`) with the true curved cell (gold) and the purple parallelogram of $\Delta\,\partial/\partial\alpha^i$ at $p$, area $\sqrt{\det g}\,\Delta^2$; readout $g_{ij}$, $\det g$, true area by elementary geometry, ratio true$/\Delta^2$ vs $\sqrt{\det g(p)}$ ("equal" or "differ by …%, shrink $\Delta$").

## Phone-safe layout

About 25–30 characters of rendered math per display line (a sum with limits ≈ 3).
Applies to every string with math (body, prompt, options, hint, feedback, explanation).

- One relation per `$$` line; join two equations with prose, never `\qquad` or `\text{and}`.
- Chains of equalities: `aligned`, one step per line, aligned at `=`.
- Lists of unrelated formulas: `gathered`, one per line.
- No prose inside display math.
- Long right-hand sides: break after an operator inside `aligned`.
- Inline `$...$` short (a symbol or short equation); longer goes on a `$$` line.
- Build cards: short prefix, at most about 6 answer tiles.

## Book symbols

- Runes as in the book, inside math: `$\text{ᛖ}_{\mathcal{U}\mathcal{V}}$` (transition map
  $\mathscr{Y}\circ\mathscr{X}^{-1}$), `$\text{ᛞ}_{\mathcal{V}\mathcal{U}}$` (its Jacobian
  $(\partial\mathscr{Y}^i/\partial\mathscr{X}^j)_p$), `$\text{ᚱ}$` (reparametrization), …
  A bundled runic font makes them render everywhere; no need to avoid them.
- Never write "the book" or section labels (C.3, B.5) in lessons.

## Tables

Write plain Markdown tables (`| a | b |` with a `|---|---|` row). The `.prose table` style in `css/app.css` gives the one house layout: outer border, rounded corners, shaded uppercase header, cell borders, zebra rows. Never restyle per lesson; keep 2–4 short columns (phone width).

## YAML gotchas

- TeX in **single quotes** or block scalars (`|`); never double quotes (`"\sum"` breaks).
- Apostrophe inside single quotes: `''`.
- Quote any value containing `: ` or starting with `[ { * & ! | > ' " % @`.

## Checks

```sh
node tools/validate.mjs diff-geometry-gr          # one course; no argument = all courses
node tools/shots.mjs diff-geometry-gr/ch03/circle.yaml ch03-circle <scratchpad>/shots   # path relative to courses/
```
`#/lesson/<id>/<n>` (1-based) jumps to card n under `python3 -m http.server 8000`.
