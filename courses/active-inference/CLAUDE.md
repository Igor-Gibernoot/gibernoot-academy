# Course `active-inference`: Active Inference

Igor's self-study course, based on *Active Inference: The Free Energy Principle
in Mind, Brain, and Behavior* (Thomas Parr, Giovanni Pezzulo, Karl J. Friston,
MIT Press 2022). Everything in the root `CLAUDE.md` applies; this file adds
what is specific to this course.

## Sources (in `sources/`, git-ignored, never commit)

- Main reference: `sources/active_inference_book.md`, converted from the PDF with
  `marker` (the PDF `sources/active_inference_book.pdf` is kept only for checking
  formulas; never read it as text). Find a section with
  `grep -nE '^#+ .*\b4\.3 ' sources/active_inference_book.md`, then `sed -n` the range
  to the next heading. Heading levels are inconsistent; chapter titles are `# N **Title**`
  (Ch. 1-9) or `### N **Title**` (Ch. 10), appendices `### **Appendix X: …**`.
- Part 1 (theory): Ch. 1-5. Part 2 (practice): Ch. 6-10. Appendix A = math background
  (linear algebra, Taylor/Laplace, variational calculus, stochastic dynamics): source of
  guided problems. Appendix B = derivations of the update equations (B.2 discrete time,
  B.3 generalized filtering): source of guided problems. Appendix C = annotated Matlab
  example (a T-maze-like task), source of worked numeric examples.
- No professor's exams: no exam levels.

## Source verification (conversion errors)

The Markdown is machine-converted, so equations may be wrong (seen: `y` read as
`\tilde{\gamma}`, braces turned into fractions). **Once per range, when a lesson uses it:**
render the PDF pages of that range
(`pdftoppm -r 110 -f P -l P -png sources/active_inference_book.pdf <scratchpad>/pg`, then
view the PNGs), compare the formulas, boxes and numbers the lesson will use against the
Markdown, fix the Markdown, and log the range in `sources/VERIFIED.md`
(`ch/section, PDF pages, date, fixes`). Read `sources/VERIFIED.md` first and skip any
range already logged. Check formulas and numbers, not prose. PDF page (1-based, for `pdftoppm`) = book page + 11 (Ch. 1 is book p. 3, anchor `page-13`, PDF p. 14).

## Trail

`course.yaml`: one level per book chapter (Chapter 1 is the introduction: the light-tour
rules of the intro level apply). Status: `STATUS.md`.

## Notation and conventions

Use the book's notation exactly. Fixed so far (read the book's Appendix B and Chapter 4
for the full list):
- Observations $o$ (outcomes $y$ in continuous time), hidden states $s$ (continuous $x$),
  policies $\pi$, preferences $C$, likelihood matrix $A$, transitions $B$, initial prior $D$,
  habit prior $E$, expected free energy $G$, variational free energy $F$, approximate
  posterior $Q$, generative model $P$, precision $\gamma$.
- Check each symbol against the Markdown section you use; record any deviation in
  `CONVENTIONS.md`.
- Intro level glossary words: surprise, generative model, prior, posterior, likelihood,
  hidden state, Markov blanket, free energy, policy, precision, prediction error,
  epistemic, pragmatic. Avoid matrices of $A, B, C, D$ and the KL divergence in intro cards.
- The topic is Bayesian inference and information theory (KL divergence, entropy),
  linear algebra and calculus: define every one at first use (Appendix A has the basics).
