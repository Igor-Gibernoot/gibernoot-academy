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
- ch01-challenge: fish band 18-26 C, expects 22, senses 30 (error -8); splash priors 0.6/0.3/0.1 (frog, duck, otter), evidence 0.2/0.5/0.9 -> 33/42/25%, flat 0.4/0.5/0.6 -> 53/33/13%; policy table (mismatch, information gained): rock (2,0), look (4,3), stay (7,0), scores 2/1/7, day two look (4,0); expected free energy G is something to MINIMISE (see the sign convention below).
- ch01-challenge p4-5: creature band 36-38 expects 37; sensed 37/35/41/28 -> errors 0/2/-4/9, distance outside band 0/1/3/8 (surprise ranks by distance, not signed error); rustle priors 0.5/0.3/0.2, evidence 0.3/0.5/0.9 -> 31/31/38%; sharp evidence 0.05/0.05/0.9 -> fox 82%; policies flee (3,0), look closer (5,3): scores 3 and 2; sharp belief: look closer ~5.
- **Sign of G (fixed, matches the book):** expected free energy G = mismatch with goals MINUS information gained; lower is better. Never flip the sign (the book minimises G; only the quality score is -G, and Level 1 does not use that). Words: mismatch (lower better), information gained (higher better, subtracted). Level 2 (ch02-efe-parts) names them pragmatic/risk and epistemic/ambiguity; the sign is already the book's.

- Persist demo (homeostat reduced mode): room 22, drift 0.04, actRate 0.8, band 36-38, body/set-point 37 (drift 0.08 would not hold the band).

## Chapter 2

- **Notation in Level 2 follows section 2.2: hidden state $x$, observation $y$** (not $s$, $o$); $P(x)$ prior, $P(y\mid x)$ likelihood, $P(x\mid y)$ posterior, joint $P(y,x)$. Later discrete-model lessons (Chapters 4, 7) use $s$, $o$: say so when they come (a renaming, same objects).
- Word change: from here "likelihood" = $P(y\mid x)$; "evidence" = $P(y)$ (model evidence, the normaliser), NOT Level 1's toy "evidence".
- ch02-perception-inference: garden: priors cat/dog/fox 0.6/0.3/0.1, rustle likelihoods 0.2/0.5/0.9, joints 0.12/0.15/0.09, $P(y)=0.36$, posterior 33/42/25%. Widget preset uses other numbers (0.4/0.4/0.2 start; 0.7/0.25/0.05 and 0.2/0.2/0.6 priors with likelihood 0.3/0.4/0.9).
- ch02-approximate-inference: counting hook $2^{200}\approx10^{60}$ (10 on/off causes x 20 moments), $K^n$ terms ($3^5=243$, $2^{10}=1024$), product family stores $nK=15$ numbers; rain/sprinkler exact posterior 0.5/0.5 on exactly-one, product $Q$ gives 0.25 to both. $x^*$ = world's state (process), $x$ = model's (as Fig. 2.2). $Q$ introduced as a product of separate $Q_i(x_i)$ (mean field named only as the idea).

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
