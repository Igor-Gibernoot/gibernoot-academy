# Course `info-geometry`: Information Geometry and Its Applications

Igor's self-study course, based on *Information Geometry and Its Applications*
(Shun-ichi Amari, Springer, Applied Mathematical Sciences 194, 2016). Everything
in the root `CLAUDE.md` applies; this file adds what is specific to this course.

## Sources (in `sources/`, git-ignored, never commit)

- Main reference: `sources/information_geometry_book.md`, converted from the PDF with
  `marker` (the PDF `sources/information_geometry_book.pdf`, 378 pages, is kept only for
  checking formulas; never read it as text). Find a section with
  `grep -nE '^#+ .*\b1\.4 ' sources/information_geometry_book.md`, then `sed -n` the range.
  Heading levels may be inconsistent: check with `grep -n '^#' ... | head -80`.
- Part I (Ch. 1-4): divergence, Bregman, Legendre, dually flat structure, Pythagorean theorem,
  exponential/mixture families, invariance and f-divergence, alpha-geometry. Readable without
  differential geometry. Part II (Ch. 5-6): differential geometry (metric, connection,
  curvature) then dual connections. Part III (Ch. 7-10): statistical inference (asymptotics, EM,
  Neyman-Scott, time series). Part IV (Ch. 11-13): applications (machine learning, natural
  gradient, signal processing, optimization). Proofs are often sketched: good source of
  guided problems (Pythagorean theorem 1.6, Levi-Civita 5.9, metric from divergence 6.2).
- No professor's exams: the partial exam (after Level 7, Levels 2 to 7) and the final exam
  (after Level 13, Levels 8 to 13) are **original** (root `CLAUDE.md`, Exam).

## Source verification (conversion errors)

Machine-converted Markdown: equations may be wrong. **Once per range, when a lesson uses it:**
render the PDF pages (`pdftoppm -r 110 -f P -l P -png sources/information_geometry_book.pdf
<scratchpad>/pg`, then view the PNGs), compare the formulas, boxes and numbers against the
Markdown, fix the Markdown, and log the range in `sources/VERIFIED.md`
(`ch/section, PDF pages, date, fixes`). Read `VERIFIED.md` first and skip logged ranges.
PDF page (1-based) = book page + OFFSET (to be fixed in the first session: Ch. 1 is book p. 3).
Check formulas and numbers, not prose. Watch for index placement (lower vs upper indices) and
tilde/hat/star marks, which converters drop.

## Trail

`course.yaml`: one level per book chapter (13 levels). The book has no introductory chapter, so
Level 1 opens with a light preview lesson (`ch01-why`) obeying the intro-level rules of the root
`CLAUDE.md`; its other lessons are regular but still gloss every word at first use, since Part I
assumes no differential geometry. Exams: `exam-partial` after Level 7, `exam-final` after Level 13.
Status: `STATUS.md`.

## Notation and conventions

Use the book's notation exactly; record each convention in `CONVENTIONS.md` when first used.
Expected (verify against the Markdown): manifold $S$ with coordinates $\xi$, divergence
$D[P:Q]$ (not symmetric), potential $\psi(\theta)$ and its Legendre dual $\varphi(\eta)$,
dual coordinates $\theta$ (e-affine) and $\eta$ (m-affine), metric $g_{ij}$, Fisher information,
KL divergence $D_{KL}[p:q]$, alpha-divergence, Einstein summation with the book's index placement.
Intro level glossary words: manifold, coordinate system, divergence, probability distribution,
exponential family, mixture, Legendre transformation, dual, geodesic, projection, Fisher
information, curvature, connection, entropy.
The topic needs probability, calculus and linear algebra: define each at first use.
