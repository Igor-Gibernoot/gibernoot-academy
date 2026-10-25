# active-inference conventions by chapter

Everything fixed while building this course: notation, running examples, key numbers, per-lesson choices.
Read only the section you need: `grep -n '^## ' courses/active-inference/CONVENTIONS.md`, then `sed -n` that range.

## General (rules fixed while building)

- Degrees in math: `$37\,{}^\circ\text{C}$` (bare `^\circ` fails in KaTeX here).
- No existing widget fits a creature/state demo; intro lessons use mcq/order cards until a widget exists.

## Chapter 1

- Running example: a warm-blooded creature in a room, safe body range 36-38 C; a fish for surprise (water vs dry sand).
- Intro glosses fixed in ch01-persist: state, environment, action, observation, action-perception loop, mismatch, surprise (technical: distance of current sensations from those that keep you intact; not shock), neats/scruffies.
- belief-mixer: causes coloured blue, orange, purple in config order; noisy senses = evidence^0.3; all text from the preset.
- homeostat: body blue, expectation orange, room purple, safe band green; each lever press = one step then drift to the room; for band 36-38 C use room 28, drift 0.05, actRate 0.8.
- Notation: no symbols in ch01-persist (section 1.1-1.3 has none); deviation check of CLAUDE.md notation deferred to chapters that use it.
- ch01-guessing: running example a rustle in a garden (cat/dog/fox). Words: hidden cause, prior, evidence (called likelihood from Level 2), belief (a spread of confidence). Toy: priors 0.9/0.1, evidence 0.2/0.8 gives 69%/31%. Summary formula in words: belief proportional to prior times evidence.
- Notation check vs Markdown (Ch. 4-7): matrices A, B, C, D, E are **bold upright** in the book (policy prior E = habits, C = preferences); s and o are italic; policies pi; continuous outcomes appear as gamma in the Markdown only through conversion (the book's y), so precision symbol gamma and Pi (continuous precision, Eq. 4.19) must be rechecked in the PDF before use.
- ch01-acting: homeostat range [20,42]; body 30, expect 37, room 28; one Act step gives body 35.22 (gap 1.78); act settles ~36.4, belief-only ~29.5. Prediction error = expected - sensed (words, no symbols). Words: set-point, goal = prior prediction, policy, expected free energy (named only), salient, exploring/exploiting.
- ch01-map: boxes loop, surprise, prior, evidence, prediction error, belief, action, perception, policy, exploring/exploiting. "Generative model" not taught in Level 1 (introduce in Level 2). Prediction error shown as `aligned` on two lines for phone width.
- ch01-challenge: fish band 18-26 C, expects 22, senses 30 (error -8); splash priors 0.6/0.3/0.1 (frog, duck, otter), evidence 0.2/0.5/0.9 -> 33/42/25%, flat 0.4/0.5/0.6 -> 53/33/13%; policy table (fit, resolved): rock (6,0), look (4,3), stay (1,0); expected free energy shown sign-flipped (bigger better).
- ch01-challenge p4-5: creature band 36-38 expects 37; sensed 37/35/41/28 -> errors 0/2/-4/9, distance outside band 0/1/3/8 (surprise ranks by distance, not signed error); rustle priors 0.5/0.3/0.2, evidence 0.3/0.5/0.9 -> 31/31/38%; sharp evidence 0.05/0.05/0.9 -> fox 82%; policies flee (5,0), look closer (3,3).

## Chapter 2

- (none yet)

## Chapter 3

- (none yet)

## Chapter 4

- (none yet)

## Chapter 5

- (none yet)

## Chapter 6

- (none yet)

## Chapter 7

- (none yet)

## Chapter 8

- (none yet)

## Chapter 9

- (none yet)

## Chapter 10

- (none yet)
