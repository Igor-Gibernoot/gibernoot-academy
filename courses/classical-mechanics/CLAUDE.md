# Course `classical-mechanics`: Classical Mechanics

Igor's course from undergraduate Newtonian mechanics to graduate Hamiltonian
mechanics and chaos. **Two main sources**: Taylor (pedagogical, Levels 1 to 13)
and Goldstein (advanced, Levels 14 to 18), plus Lemos for Noether's theorem
and fields.
The level list is the course's own spine (`course.yaml`), not one book's
chapters; the table below maps each level to its sections. Everything in the
root `CLAUDE.md` applies; this file adds what is specific to this course.

## Sources (in `sources/`, git-ignored)
- Taylor: `sources/taylor.md` (from `sources/taylor.pdf`). John R. Taylor,
  *Classical Mechanics* (University Science Books, 2005), 16 chapters.
- Goldstein: `sources/goldstein.md` (from `sources/goldstein.pdf`).
  Goldstein, Poole, Safko, *Classical Mechanics*, 3rd ed. (Addison-Wesley, 2002).
- Lemos: `sources/lemos.md` (from `sources/lemos.pdf`, text layer, no OCR).
  Nivaldo A. Lemos, *Analytical Mechanics* (Cambridge UP, 2018), the English
  translation (not the Portuguese *Mecânica Analítica*, whose numbering
  differs). Used for 2.5-2.7 (symmetries, Noether), 9.7-9.10 (integrability)
  and ch 11 (fields).
- No professor's exams: all exams are original (root `CLAUDE.md`, Exam).
- **Conversion:** Taylor and Goldstein are scans without a text layer, so
  they were OCRed with tesseract (300 dpi, eng); their `.md` files are OCR
  text, with a form feed between PDF pages and weak equations: verify
  formulas against the PDF render (below). Lemos came from `pdftotext -layout`.

## Level-to-source map
Goldstein and Lemos numbers are confirmed against their contents pages;
Taylor's are still from memory until its conversion is checked. "Primary" fixes notation and order;
"second road" is the other derivation the lesson must also give (root
`CLAUDE.md`, How to teach, 10).

| Level | Topic | Primary | Second road |
|---|---|---|---|
| 1 | Predicting Motion (intro tour) | Taylor ch 1 tone | Goldstein 2.1 (action) |
| 2 | Newton's Laws | Taylor ch 1 | Goldstein 1.1 |
| 3 | Projectiles and Charged Particles | Taylor ch 2 | |
| 4 | Momentum and Angular Momentum | Taylor ch 3 | Goldstein 1.2 |
| 5 | Energy | Taylor ch 4 | Goldstein 1.1-1.2 |
| 6 | Oscillations | Taylor ch 5 | |
| 7 | Calculus of Variations | Taylor ch 6 | Goldstein 2.2 |
| 8 | Lagrange's Equations | Taylor ch 7 | Goldstein 1.3-1.5, 2.1-2.4 (d'Alembert) |
| 9 | Symmetry and Noether | Lemos 2.5-2.7 | Taylor 7.8, Goldstein 2.6-2.7 |
| 10 | Central Forces and Orbits | Taylor ch 8 (+ ch 14 for scattering) | Goldstein 3.6 (Bertrand), 3.9 (LRL), 3.10-3.11 (scattering); Lemos 1.7 |
| 11 | Noninertial Frames | Taylor ch 9 | Goldstein 4.9-4.10, Lemos 3.6 |
| 12 | Rigid Bodies | Taylor ch 10 | Goldstein 4.4 (Euler angles), 5.1-5.7 (inertia tensor, Euler equations, heavy top) |
| 13 | Coupled Oscillations | Taylor ch 11 | Goldstein 6.1-6.4 (6.4 triatomic) |
| 14 | Hamiltonian Mechanics | Goldstein 8.1-8.6 | Taylor ch 13 |
| 15 | Canonical Transformations | Goldstein 9.1-9.9 | Lemos 8.1-8.8 |
| 16 | Hamilton-Jacobi, Action-Angle | Goldstein 10.1-10.8 | Lemos 9.1-9.6, 9.11, 9.13 (optics, quantum) |
| 17 | Chaos and Integrability | Taylor ch 12 (maps, sections) | Goldstein 11.1-11.8 (11.2 KAM, 11.6 Hénon-Heiles, 11.8 logistic); Lemos 9.7-9.10 (Liouville-Arnold, tori) |
| 18 | From Particles to Fields | Goldstein 13.1-13.7 | Lemos 11.1-11.5; Taylor ch 16 (string, wave equation) |

Left out on purpose: special relativity (Taylor 15, Goldstein 7; the
`diff-geometry-gr` course covers it), canonical perturbation theory
(Goldstein 12, Lemos 10), solids and fluids (rest of Taylor 16), solitons
and constrained fields (Lemos 11.6-11.7), constrained Hamiltonian systems
(Lemos 8.9).

## Source verification (conversion errors)
The Markdown is machine-converted, so equations may be wrong. **Once per
range, when a lesson uses it:** render the PDF pages of that range
(`pdftoppm -r 110 -f P -l P -png sources/<book>.pdf <scratchpad>/pg`, then
view the PNGs), compare the formulas, boxes and numbers the lesson will use
against the Markdown, fix the Markdown, and log the range in
`sources/VERIFIED.md` (`book, section, PDF pages, date, fixes`). Read
`sources/VERIFIED.md` first and skip any range already logged. Check formulas
and numbers, not prose. PDF page = book page + offset: Taylor `?`,
Goldstein `+9` (checked at pp. 7, 34, 208, 589), Lemos `+15` (checked at
pp. 73, 374). Front-matter pages (roman numerals) do not follow the offset.

## Trail
`course.yaml`: 18 chapter levels and three exams (after Levels 6, 12, 18;
covering 2-6, 7-12, 13-18).
Status: `STATUS.md`.

## Notation and conventions
**One notation for the whole course**, so a symbol never changes meaning
between the Taylor and Goldstein parts. Default rule: where the two books
differ, use **Goldstein's** symbol (the one the advanced levels and research
papers use) and say once, in the lesson that introduces it, what the
undergraduate books write instead. Where only Taylor has a symbol (drag
constants, damping constant, Fourier coefficients), use Taylor's. Fix each
choice in `CONVENTIONS.md` General the first time it appears; confirm every
symbol against the source when the sources arrive. Expected choices (from
memory, unverified): Lagrangian $L$ (Taylor writes $\mathcal{L}$),
Hamiltonian $H$, potential energy $V$ (Taylor writes $U$), generalized
coordinates $q_j$ and momenta $p_j$ with index $j$, overdot = time
derivative, vectors bold $\mathbf{r}$, unit vectors $\hat{\mathbf{r}}$,
SI units. The Poisson bracket (Goldstein $[u,v]$; Lemos 8.4 writes $\{F,G\}$, checked)
is decided at Level 15 with Igor.
Intro level glossary words: force, mass, momentum, energy, frame of
reference, derivative and rate of change, vector, trajectory, action,
Lagrangian, phase space, Hamiltonian, conserved quantity, symmetry, chaos.
Useful existing widgets: `flow-lab` (ODE trajectories, phase portraits),
`oscillator-lab` (driven, damped), `rotating-grid` (pseudo-forces),
`chaos-sensitivity` (two nearby starts), `track-ride` (energy on a track).
