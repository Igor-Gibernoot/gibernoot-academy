# Course `machine-learning`: Machine Learning

Igor's course on the ideas behind modern machine learning, from probability
and linear models to transformers, LLMs and diffusion models. **One main
source**: Bishop and Bishop, *Deep Learning: Foundations and Concepts*
(Springer, 2024). Everything in the root `CLAUDE.md` applies; this file adds
what is specific to this course.

## Sources (in `sources/`, git-ignored)
- Main reference: `sources/bishop-deep-learning.md` (from
  `sources/bishop-deep-learning.pdf`, `pdftotext -layout`, one page per form
  feed). 20 chapters, appendices A (linear algebra), B (calculus of
  variations), C (Lagrange multipliers). Each chapter ends with Exercises;
  margin notes point to sections ("Section 4.3", "Exercise 2.7"). Results
  stated without derivation and left to the exercises are the best guided
  proofs; worked examples (screening 2.1.1, sinusoidal curve 1.2, robot
  kinematics 6.5.1) are the best guided problems.
- No professor's exams: all exams are original (root `CLAUDE.md`, Exam).
- **The book's figures are copyrighted** (Springer, "all rights reserved",
  reuse of illustrations included) and the repo is public: never put a book
  figure, or a trace of one, in a lesson. Rebuild the idea as a widget or
  use a free image (root `CLAUDE.md`, Images).

## Source verification (conversion errors)
The Markdown is machine-converted, so equations may be wrong. **Once per
range, when a lesson uses it:** render the PDF pages of that range
(`pdftoppm -r 110 -f P -l P -png sources/bishop-deep-learning.pdf <scratchpad>/pg`,
then view the PNGs), compare the formulas, boxes and numbers the lesson will
use against the Markdown, fix the Markdown, and log the range in
`sources/VERIFIED.md` (`section, PDF pages, date, fixes`). Read
`sources/VERIFIED.md` first and skip any range already logged. Check
formulas and numbers, not prose. PDF page = book page + 20 (checked at
pp. 6, 112, 582); front matter (roman numerals) does not follow the offset.

## Trail
`course.yaml`: 20 chapter levels (Level N = Chapter N) and four exams
(after Levels 6, 10, 15, 20; covering 2-6, 7-10, 11-15, 16-20).
Status: `STATUS.md`.

## Course method (what makes this course different)
The skill trained is **predict, then verify**: guess what a model will do
before seeing the result, then check code, numbers or an AI's claim against
it. Code is read, ordered, specified and audited more than written.
- **AI audits.** Most levels have a guided node "Audit: ..." (summary
  starts "Guided problem (AI audit)"): a short AI-written pipeline, claim or
  results table with real mistakes (leakage, scaling before the split,
  tuning on the test set, accuracy on rare classes, softmax applied twice,
  wrong loss, confident causal claims). The reader states the plan first
  (loss, split, metric, baseline), then finds what breaks and predicts the
  honest result. Never present a made-up quote as from a real product; say
  "an AI assistant wrote".
- **Traps** include AI-style wrong answers: fluent, plausible explanations
  whose error the feedback names.
- **Code on cards:** short Python (NumPy, PyTorch style), inline `code`, or
  build/order cards for pipeline lines. Code must run if copied (test every
  snippet by script before writing it in; record the check in `VERIFIED.md`).
  A click-the-faulty-line widget does not exist yet: the first audit lesson
  needs a widget session first (`code-audit`).
- **Problem and model table.** Each content map ends with the level's row
  of a running table: problem type, models, what each assumes, when it fails.
  Running problems, reused across levels: the noisy sinusoidal curve
  (regression, Level 1), medical screening and skin-lesion diagnosis
  (classification, rare positives, Levels 2 and 5), text (Level 12), images
  (Levels 10, 20). Fix their numbers in `CONVENTIONS.md`.
- Original material the book has little of (data splits, leakage, metrics
  on imbalanced data, reading training curves) lives in the nodes listed in
  `course.yaml` (e.g. `ch04-honest-splits`); check its claims on the web
  (`docs/WEB_SEARCH.md`) and log `web: <source>`.

## Notation and conventions
Follow the book (preface, checked 2026-11-20): vectors bold lowercase
$\mathbf{x}$, column vectors, $\mathbf{x}^{\mathrm{T}}$ transpose, matrices
bold uppercase; data matrix $\mathbf{X}$ is $N \times D$ (row $n$ =
$\mathbf{x}_n^{\mathrm{T}}$); $N$ data points, $D$ input dimensions;
expectation $\mathbb{E}_x[\cdot]$, $\mathrm{var}[\cdot]$, $\mathrm{cov}[\cdot]$;
Gaussian $\mathcal{N}(x|\mu,\sigma^2)$ (vertical bar); $x \sim p(x)$ =
sampled from; $\mathcal{N}(i)$ neighbours of node $i$; learning rate $\eta$;
design matrix $\Phi_{nj} = \phi_j(\mathbf{x}_n)$. From memory, confirm when
first used: weights $\mathbf{w}$, targets $t_n$, model $y(\mathbf{x},\mathbf{w})$,
error $E(\mathbf{w})$ (minimized, never sign-flipped), noise precision $\beta$,
regularization $\lambda$, logistic sigmoid $\sigma(a)$, pre-activation $a$,
hidden unit $z$, activation $h(\cdot)$, backprop errors $\delta$, $K$ classes.
Intro level glossary words: model, parameter (weight), training data, test
data, error (loss) function, overfitting, generalization, regularization,
validation, neural network, layer, gradient, probability, classifier,
generative model, large language model, token.
Useful existing widgets: `curve-fit-lab` (polynomial fits, residuals,
held-out point), `gaussian-fit`, `map-builder`. Planned widgets (one session
each, before the lesson that needs them): `code-audit` (click the faulty
line), `decision-boundary` (2D points, switch model), `loss-landscape`
(gradient descent, momentum, learning rate), `learning-curve` (training vs
validation error).
