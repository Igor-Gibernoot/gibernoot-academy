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
- ch01-guessing: running example a rustle in a garden (cat/dog/fox). Words: hidden cause, prior, evidence (renamed likelihood in Level 1 too, to match Level 2), belief (a spread of confidence). Toy: priors 0.9/0.1, evidence 0.2/0.8 gives 69%/31%. Summary formula in words: belief proportional to prior times evidence.
- Notation check vs Markdown (Ch. 4-7): matrices A, B, C, D, E are **bold upright** in the book (policy prior E = habits, C = preferences); s and o are italic; policies pi; continuous outcomes appear as gamma in the Markdown only through conversion (the book's y), so precision symbol gamma and Pi (continuous precision, Eq. 4.19) must be rechecked in the PDF before use.
- ch01-acting: homeostat range [20,42]; body 30, expect 37, room 28; one Act step gives body 35.22 (gap 1.78); act settles ~36.4, belief-only ~29.5. Prediction error = expected - sensed (words, no symbols). Words: set-point, goal = prior prediction, policy, expected free energy (named only), salient, exploring/exploiting.
- ch01-map: boxes loop, surprise, prior, evidence, prediction error, belief, action, perception, policy, exploring/exploiting. "Generative model" not taught in Level 1 (introduce in Level 2). Prediction error shown as `aligned` on two lines for phone width.
- ch01-challenge: fish band 18-26 C, expects 22, senses 30 (error -8); splash priors 0.6/0.3/0.1 (frog, duck, otter), evidence 0.2/0.5/0.9 -> 33/42/25%, flat 0.4/0.5/0.6 -> 53/33/13%; policy table (mismatch, information gained): rock (2,0), look (4,3), stay (7,0), scores 2/1/7, day two look (4,0); expected free energy G is something to MINIMISE (see the sign convention below).
- ch01-challenge p4-5: creature band 36-38 expects 37; sensed 37/35/41/28 -> errors 0/2/-4/9, distance outside band 0/1/3/8 (surprise ranks by distance, not signed error); rustle priors 0.5/0.3/0.2, evidence 0.3/0.5/0.9 -> 31/31/38%; sharp evidence 0.05/0.05/0.9 -> fox 82%; policies flee (3,0), look closer (5,3): scores 3 and 2; sharp belief: look closer ~5.
- **Sign of G (fixed, matches the book):** expected free energy G = mismatch with goals MINUS information gained; lower is better. Never flip the sign (the book minimises G; only the quality score is -G, and Level 1 does not use that). Words: mismatch (lower better), information gained (higher better, subtracted). Level 2 (ch02-efe-parts) names them pragmatic/risk and epistemic/ambiguity; the sign is already the book's.

- Persist demo (homeostat reduced mode): room 22, drift 0.04, actRate 0.8, band 36-38, body/set-point 37 (drift 0.08 would not hold the band).

## Chapter 2

- **Notation in Level 2 follows section 2.2: hidden state $x$, observation $y$** (not $s$, $o$); $P(x)$ prior, $P(y\mid x)$ likelihood, $P(x\mid y)$ posterior, joint $P(y,x)$. Later discrete-model lessons (Chapters 4, 7) use $s$, $o$: say so when they come (a renaming, same objects).
- Word change: from here "likelihood" = $P(y\mid x)$; "evidence" = $P(y)$ (model evidence, the normaliser), (Level 1 now says "likelihood" for the toy P(y|x) too; the YAML key `evidence:` of belief-mixer is kept.)
- ch02-perception-inference: garden: priors cat/dog/fox 0.6/0.3/0.1, rustle likelihoods 0.2/0.5/0.9, joints 0.12/0.15/0.09, $P(y)=0.36$, posterior 33/42/25%. Widget preset uses other numbers (0.4/0.4/0.2 start; 0.7/0.25/0.05 and 0.2/0.2/0.6 priors with likelihood 0.3/0.4/0.9).
- ch02-approximate-inference: counting hook $2^{200}\approx10^{60}$ (10 on/off causes x 20 moments), $K^n$ terms ($3^5=243$, $2^{10}=1024$), product family stores $nK=15$ numbers; rain/sprinkler exact posterior 0.5/0.5 on exactly-one, product $Q$ gives 0.25 to both. $x^*$ = world's state (process), $x$ = model's (as Fig. 2.2). $Q$ introduced as a product of separate $Q_i(x_i)$ (mean field named only as the idea).
- ch02-action-inference: surprise $\mathfrak{I}(y)=-\ln P(y)$ nats; action $u$ (acts on the world $x^*$, not the model); toy model A: P(cold)=0.05, P(warm)=0.5 (drop $\ln10\approx2.30$); homeostat body 35, expect 37, room 28, drift 0.05.
- free-energy-bound widget: $F=\sum_x Q(x)[\ln Q-\ln P(x)-\ln P(y\mid x)]$ minimised, $F\ge-\ln P(y)$, gap $=D_{KL}[Q\parallel P(x\mid y)]$; garden: $P(y)=0.36$, surprise $1.02$ nats, exact posterior $0.33/0.42/0.25$, $Q=$prior gives $F=1.18$ (gap $0.16$), all on fox $F=2.41$.
- ch02-free-energy: $F[Q,y]=\mathbb{E}_Q[\ln Q-\ln P(y,x)]$; garden Q=prior: complexity 0, accuracy -1.184, F 1.184, gap 0.162; KL example Q=(.5,.5), P=(.25,.75) gives 0.144 (swapped 0.131); all on cat F=2.12, uniform Q F=1.04. KL is asymmetric (stated).
- ch02-free-energy-bound: KL>=0 proved by $\ln u\le u-1$ with $u=P(x\mid y)/Q$ (Jensen mentioned, Eq. 4.2); all-on-fox $Q=(0,0,1)$: $F=2.408$, gap $\ln4=1.386$; $F=2$, $P(y)=0.36$ gives divergence $0.978$. Terms with $Q=0$ contribute $0$.
- ch02-free-energy-traps: garden at exact posterior: complexity 0.170, accuracy -0.852 (F 1.022); $Q=(0.5,0.3,0.2)$: complexity 0.0475, accuracy -1.034, F 1.081; $Q=(0.5,0.5,0)$: F 1.316; KL example swapped 0.131 vs 0.144.
- ch02-expected-free-energy: $\tilde{x}$, $\tilde{y}$ trajectories (book 2.7); pond (frog 0.8/apple 0.2) vs orchard (0.1/0.9), $P(\text{jumps}\mid\text{frog})=0.9$, $P(\text{jumps}\mid\text{apple})=0.1$ give $P(\text{jumps}\mid\pi)=0.74$ vs $0.18$; $G=1,2,3$ gives $P(\pi)=0.665/0.245/0.090$; $P(\pi)=e^{-G}/\sum e^{-G'}=\sigma(-G)$, no $\gamma$ yet.
- Widget `policy-scorer`: pond/orchard test numbers (our own): C = (jumps 0.8, still 0.2); Q(jumps) = 0.74 / 0.18; ambiguity 0.325; risk 0.011 / 0.889; G = 0.336 / 1.214; gain 0.248 / 0.146; pragmatic value -0.584 / -1.360. Precision gamma over policies (B.13) is verified: P(pi) = sigma(-gamma G), gamma = 1 default; the lesson must say so before showing the slider.
- ch02-efe-parts: G = ambiguity + risk = -information gain - pragmatic value (Eq. 2.6), shown in `policy-scorer` (qy mode, then states mode); hook C = (jumps 0.8, still 0.2); risk of a sure jump $\ln(1/0.8)=0.223$ (same as $(0.5,0.5)$); ambiguity demo: sharp likelihood 0.9/0.1 vs blurry rows (0.78,0.22)/(0.58,0.42), both qx 0.8/0.2 give $Q(\text{jumps})=0.74$, risk 0.011, ambiguity 0.325 vs 0.558; fair coin ambiguity $\ln2=0.693$; cafe example is the book's (calendar epistemic, cafe pragmatic); $\gamma$ introduced in the recall card as the precision over policies (B.13), $\gamma=1$, $P(\text{pond})=0.706$; cost bars (risk, ambiguity, G) lower is better, value terms (gain, pragmatic value) subtracted, G never negated.

- ch02-efe-decomposition: proof G = -gain - pragmatic = ambiguity + risk via $\ln Q(\tilde x|\tilde y,\pi)-\ln Q(\tilde x|\pi)=\ln P(\tilde y|\tilde x)-\ln Q(\tilde y|\pi)$; gain $=H[Q(\tilde y|\pi)]-$ambiguity (pond $0.573-0.325=0.248$, orchard $0.471-0.325=0.146$); $P(\text{pond})=0.706$; flat C (0.5, 0.5) look/blind: G $0.325$ / $0.693$, gain $0.368$ / $0$; flat-C risk of $Q(y)=(0.9,0.1)$ is $0.368$; flat C gives $G=\ln n-$gain; no ambiguity and no preferences gives $G=\ln n-H[Q(\tilde y|\pi)]$ (maximum entropy). Fig. 2.6 schemes: no preferences = Bayesian surprise/intrinsic motivation; no ambiguity = KL (risk-sensitive) control; only preferences = expected utility; neither = entropy maximisation (prose p. 36). Line 3 of Eq. 2.6 inequality is stated by the book; the data-processing reason is ours.

- ch02-intuition-free-energy: garden Q=prior energy 2.082, entropy 0.898, F 1.184; point mass on dog energy 1.897, entropy 0 (spreading raises energy and entropy, entropy wins); pond gain 0.248, pragmatic -0.584, G 0.336; orchard risk for Q(y)=(0.18,0.82), C=(0.8,0.2) is 0.889 (swapped 0.911); gamma=2 gives P(pond)=0.853.

- ch02-map: 14 boxes in a 3-column grid, F branch (model, posterior, Q, F, bound, perception, action) left and middle, G branch (policy, G, ambiguity/risk, gain/pragmatic, softmax) in column 3; the bound box spans columns 1-2. No book concept map exists for Chapter 2.

- ch02-challenge (problems 1-3): tap model priors rain/branch/bird 0.5/0.3/0.2, likelihood of a tap 0.2/0.6/0.5: joints 0.10/0.18/0.10, $P(y)=0.38$, posterior 0.263/0.474/0.263, surprise 0.968; second tap evidence 0.4684 (surprise 0.758, posterior of branch 0.607), total 1.726. F: Q=prior 1.097 (gap 0.129), uniform 1.008, all on branch 1.715, exact 0.968, Q=(0.3,0.5,0.2) 0.979. Robin: C=(0.8,0.2) worm/no worm, Lawn qx (.5,.5) L .9/.1: risk 0.223, amb 0.325, G 0.548, gain 0.368, prag -0.916; Mud qx (.8,.2) L .7/.3: risk 0.086, amb 0.611, G 0.697, gain 0.053, prag -0.750; Bed qx (.2,.8) L .95/.05: risk 0.751, amb 0.199, G 0.950, gain 0.341, prag -1.291; P(pi) at gamma=1: 0.395/0.340/0.264.

- ch02-challenge (problems 4-5): porch light prior home/away (0.7,0.3), P(on|x)=(0.9,0.2); y=off: P=0.31, surprise 1.171, posterior (0.226,0.774), F at Q=prior 1.679 (gap 0.508); y=on: P=0.69, surprise 0.371, posterior (0.913,0.087), F at Q=prior 0.557 (gap 0.186); robin G 0.548/0.697/0.950 softmax: gamma=0 1/3 each, 0.5 0.364/0.338/0.298, 2 0.457/0.339/0.204, 10 about 0.804/0.181/0.014; ratio P(a)/P(b)=e^{gamma(G_b-G_a)}; gamma=-1 gives 0.274/0.318/0.409. Challenge file kept at 25 cards.

- Audit: learner-visible text never names the source or its labels ("the book", Figure 2.6, Eq. numbers); special-case schemes of G are named (expected utility, KL control, intrinsic motivation, uncertainty sampling).

## Chapter 3

- ch03-markov-blankets: sets external $x$, internal $\mu$, sensory $y$, **active $u$** (the book's letter, same as the action $u$ of Level 2), blanket $b=(u,y)$; $\mu\perp x\mid b\Leftrightarrow p(\mu,x\mid b)=p(\mu\mid b)p(x\mid b)$. Loop $x\to y\to\mu\to u\to x$. Flows $\dot z=f_z(\cdot)+\omega_z$, $\dot\mu=f_\mu(\mu,u,y)+\omega_\mu$, $\dot x=f_x(x,u,y)+\omega_x$ (printed figure's $f_u(x,..)$, $f_y(\mu,..)$ looks swapped; not used). "Active states" (capital sense) vs behaviour $u$. Toy numbers: 0.3/0.8 gives 0.24; Gaussian toy ($b\sim N(0,1)$, noise sd 0.5): $E[x\mid\mu=1.5]=1.2$. Graph-widget node id `a` carries label `u`.
- ch03-self-evidencing: preferred sensations are priors of the model ('optimism bias'); evidence $P(y)$ max = surprise $\mathfrak I(y)=-\ln P(y)$ min; perception = descriptive side, action = prescriptive side; self-evidencing = acting to gather data that are evidence for one's own model. Temperature toy: comfort $37\,{}^{\circ}\mathrm{C}$ (write `\,{}^{\circ}`, plain `^\circ` after `\,` breaks KaTeX); $P(y)=0.5$ vs $0.1$ gives 0.69 vs 2.30 nats.
- ch03-least-action: walk state $y=(y_1,y_2)$; $H[P(y)]=\mathbb E_{P(y)}[\mathfrak I(y)]$ (Eq. 3.1); entropy numbers $(0.5,.25,.25)\to1.04$, $(0.9,.05,.05)\to0.39$ nats; capital-A Action; gap $F-\mathfrak I=D_{\mathrm{KL}}[Q(x)\|P(x\mid y)]$; widget noise is $2\Gamma$ (lesson says only 'random kicks').
- ch03-inference-dynamics: $m$ only in $P(y\mid m)$; $\mathfrak{I}(y\mid m)\le F=D_{\mathrm{KL}}[Q(x)\|P(x\mid y,m)]-\ln P(y\mid m)$. Glucose example: sated/hungry prior 0.8/0.2; low glucose likelihood 0.1/0.9 (P(y)=0.26, surprise 1.347, F(Q=(.5,.5))=1.427); high glucose 0.9/0.1 (P(y)=0.74, surprise 0.30). Policy G=1,2 gives 0.731.
- ch03-blanket-free-energy: noise covariance $2\Gamma$ (not the printed $\tfrac12\Gamma^{-1}$); Fokker-Planck $\partial_\tau p=\nabla_x\cdot(\Gamma\nabla_x p-fp)$; steady state $f=-(\Gamma-\mathsf Q)\nabla_x\mathfrak I$ with circulation matrix written $\mathsf Q$ (antisymmetric; never the approximate posterior $Q$). Numbers: $\Gamma=2$, $p=N(0,4)$, $f(6)=-3$; $\nabla\mathfrak I=(1,2)$, $q=1$: $f=(1,-3)$, rate $-5$.
- ch03-models-policies: preference = prior belief (no value table); $P(\pi)=\sigma(-G)$, lowest $G$ most probable ($G=0.336/1.214\to P(\text{orchard})=0.294$); Hamilton analogy: (i) quantity, (ii) Hamiltonian = surprise $\mathfrak I=-\ln P(y)$, (iii) function (path, belief $Q$) vs functional (Action, $F$); $F$ favours high $H[Q]$, $G$ low ambiguity ($H[(0.9,0.1)]=0.325$ nats); creatures minimising only $F$ 'live in the present'.
- ch03-reconciliation: three schools map to blanket (enactive), $F$ as prediction error (cybernetic), generative model + policies + attenuation of sensory evidence (predictive/ideomotor); good regulator = controller must be/contain a model; chapter arc: blanket, persistence, surprise, $F$ bound, policies with $G$.

- ch03-blanket-traps: fish out of water $P=0.001\to6.9$ nats; shelter $2\cdot3+8\cdot0.2=7.6$ vs staying 10; $G=1,2\to0.731$; blanket $(u,y)$ = interface, neither external nor internal.
- ch03-map: 11 boxes (ids blanket, steady, selfev, flow, bound, least, percact, depth, policy, school); flow box $f=-(\Gamma-\mathsf{Q})\nabla_x\mathfrak{I}$.
- ch03-challenge (A): toy blanket b fair coin, p(mu=1|b)=0.3/0.8, p(x=1|b)=0.6/0.2 (cov -0.05); leak table 0.5,0.1,0.1,0.3 gives 75%; p=N(0,4), Gamma=2, f(6)=-3; Gamma=1, grad I=(2,1), Q=[[0,3],[-3,0]] gives f=(1,-7), rate -5; glucose: gap 0.080, act-only F=1.427, action share 1.046, posterior after eating (0.973,0.027).
- ch03-challenge (B): P4 sigma^2=0.5, Gamma=3, f=-6x, p(1.5)=0.05946, current -0.268 for f=-3x, 0 for f=-6x; P5 heron C=(0.8,0.2), G=0.326,0.548,1.214, P(gamma=1)=0.452,0.362,0.186, gamma=3 gives 0.631.

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
