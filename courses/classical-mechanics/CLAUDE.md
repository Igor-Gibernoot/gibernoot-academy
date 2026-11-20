# Course `classical-mechanics`: Classical Mechanics

Igor's course from undergraduate Newtonian mechanics to graduate Hamiltonian
mechanics and chaos. **Two main sources**: Taylor (pedagogical, Levels 1 to 13)
and Goldstein (advanced, Levels 14 to 17), plus Lemos for Noether's theorem.
The level list is the course's own spine (`course.yaml`), not one book's
chapters; the table below maps each level to its sections. Everything in the
root `CLAUDE.md` applies; this file adds what is specific to this course.

## Sources (in `sources/`, git-ignored)
- Taylor: `sources/taylor.md` (from `sources/taylor.pdf`). John R. Taylor,
  *Classical Mechanics* (University Science Books, 2005), 16 chapters.
- Goldstein: `sources/goldstein.md` (from `sources/goldstein.pdf`).
  Goldstein, Poole, Safko, *Classical Mechanics*, 3rd ed. (Addison-Wesley, 2002).
- Lemos: `sources/lemos.md` (from `sources/lemos.pdf`), only the chapter on
  Hamilton's principle and symmetries (Noether). Nivaldo A. Lemos,
  *Analytical Mechanics* (Cambridge UP, 2018).
- No professor's exams: all exams are original (root `CLAUDE.md`, Exam).
- **Status (2026-11-20): PDFs not yet in `sources/`.** Igor copies them in;
  the next session converts them (`pdftotext -layout`), fills the PDF-page
  offsets below and confirms the section numbers in the table.

## Level-to-source map
Section numbers are from memory, **to confirm against the Markdown** when the
sources arrive (fix this table then). "Primary" fixes notation and order;
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
| 9 | Symmetry and Noether | Lemos (Noether chapter) | Taylor 7.8, Goldstein 2.6-2.7 |
| 10 | Central Forces and Orbits | Taylor ch 8 (+ ch 14 for scattering) | Goldstein ch 3 (Bertrand, LRL, scattering) |
| 11 | Noninertial Frames | Taylor ch 9 | Goldstein 4.9-4.10 |
| 12 | Rigid Bodies | Taylor ch 10 | Goldstein ch 4-5 (Euler angles, heavy top) |
| 13 | Coupled Oscillations | Taylor ch 11 | Goldstein ch 6 |
| 14 | Hamiltonian Mechanics | Goldstein ch 8 | Taylor ch 13 |
| 15 | Canonical Transformations | Goldstein ch 9 | |
| 16 | Hamilton-Jacobi, Action-Angle | Goldstein ch 10 | |
| 17 | Chaos and Integrability | Taylor ch 12 (maps, sections) | Goldstein ch 11 (KAM, Hénon-Heiles) |

Left out on purpose: special relativity (Taylor 15, Goldstein 7; the
`diff-geometry-gr` course covers it), canonical perturbation theory
(Goldstein 12), continua and fields (Taylor 16, Goldstein 13). Candidates for
a later Level 18 "From Particles to Fields" (then the final covers 13-18).

## Source verification (conversion errors)
The Markdown is machine-converted, so equations may be wrong. **Once per
range, when a lesson uses it:** render the PDF pages of that range
(`pdftoppm -r 110 -f P -l P -png sources/<book>.pdf <scratchpad>/pg`, then
view the PNGs), compare the formulas, boxes and numbers the lesson will use
against the Markdown, fix the Markdown, and log the range in
`sources/VERIFIED.md` (`book, section, PDF pages, date, fixes`). Read
`sources/VERIFIED.md` first and skip any range already logged. Check formulas
and numbers, not prose. PDF page = book page + offset: Taylor `?`,
Goldstein `?`, Lemos `?` (fill in when converted).

## Trail
`course.yaml`: 17 chapter levels and three exams (after Levels 6, 12, 17).
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
SI units. The Poisson bracket (Goldstein $[u,v]$, Lemos and most modern texts
$\{u,v\}$) is decided at Level 15 with Igor.
Intro level glossary words: force, mass, momentum, energy, frame of
reference, derivative and rate of change, vector, trajectory, action,
Lagrangian, phase space, Hamiltonian, conserved quantity, symmetry, chaos.
Useful existing widgets: `flow-lab` (ODE trajectories, phase portraits),
`oscillator-lab` (driven, damped), `rotating-grid` (pseudo-forces),
`chaos-sensitivity` (two nearby starts), `track-ride` (energy on a track).
