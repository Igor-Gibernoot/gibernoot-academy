# Course `dg2gr`: From Differential Geometry to General Relativity

Course Igor takes at USP, based on an in-progress book by the professor
(Daniel López Cano). Everything in the root `CLAUDE.md` applies; this file
adds what is specific to this course.

## Sources (in `sources/`, git-ignored)

- The book (Markdown) is the **main reference**:
  `sources/book/from_differential_geometry_to_general_relativity.md`.
  It is complete: Chapters 1–10 plus appendices A (computational), B
  (proofs), C (worked examples). B and C are sources for guided problems;
  grep `DLC: PROOF` for results stated without proof.
- **The book is unpublished: never commit or push it** (Markdown, images,
  PDFs). Never read the PDFs.
- Exams: `sources/partial_exam/` and `sources/final_exam/` (built:
  `exams/partial.yaml`, `exams/final.yaml`; levels `exam-partial` between
  Levels 5 and 6, `exam-final` after Level 10).
- `sources/PDF_TYPOS.md`: typos found in the book's PDF.
- `archive/tex_exercises/`: retired TeX exercises, a source of good problems
  (and of each chapter's content map); the book stays the reference.

## Trail

`course.yaml`: one level per book chapter (Chapter 1 is the introduction:
the light-tour rules of the intro level apply). Status: `STATUS.md`.

## Notation and conventions

Use the book's conventions exactly:
- $\hat{x}_i = \sum_j J_i^j\cdot\hat{y}_j$ (old in terms of new),
  $y^i = \sum_j J^i_j x^j$, $\mathtt{x}_j = \sum_i J^i_j \mathtt{y}_i$
  (covector components are typewriter `\mathtt`, covectors sans-serif
  `\mathsf{X}`), notation $\mathcal{X}$, $\hat{\mathfrak{x}}^i$ (the book's
  "induced dual cobasis"), $T^{i_1\dots}_{j_1\dots}$ for tensor components,
  $T_p\mathcal{M}$, $T_p^*\mathcal{M}$.
- Chapter 2 writes sums explicitly; Einstein summation only from Chapter 4,
  where the book introduces it.
- Later conventions are listed in `STATUS.md` (Current).
- **Runes:** keep the book's runic symbols (never swap them for another
  notation): write them as `\text{ᛖ}`, `\text{ᛞ}`, `\text{ᚱ}`, … inside
  math. They render on every device through the runic font that extends
  KaTeX (`vendor/fonts/`, any rune U+16A0–16F8). Introduce each with its
  meaning and subscript order, e.g. $\text{ᛖ}_{\mathcal{U}\mathcal{V}} :=
  \mathscr{Y}\circ\mathscr{X}^{-1}$, Jacobian
  $(\text{ᛞ}_{\mathcal{V}\mathcal{U}})^i_j :=
  (\partial\mathscr{Y}^i/\partial\mathscr{X}^j)_p$ (first subscript = chart
  of the row index); the fraction form may be used alongside it in laws.
- Intro level glossary words for this course: event, worldline, proper
  time, timelike, geodesic, chart, basis, tangent plane, tensor, covector,
  great circle, horizon, orientable, energy–momentum tensor. Avoid Riem,
  $\Gamma$, $\partial_r$ in intro cards.
