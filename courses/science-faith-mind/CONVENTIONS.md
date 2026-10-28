# science-faith-mind conventions by chapter

Everything fixed while building this course: notation, running examples, key numbers.
Read only the section you need: `grep -n '^## ' courses/science-faith-mind/CONVENTIONS.md`, then `sed -n` that range.

## General (rules fixed while building)

- Premises numbered P1, P2, ...; conclusion C. Each guided proof asks which premise a critic rejects.
- Label claims: established fact / live debate / faith commitment.
- Bayes: $P(H\mid E)=\dfrac{P(E\mid H)\,P(H)}{P(E)}$; odds form $\dfrac{P(H_1\mid E)}{P(H_2\mid E)}=\dfrac{P(E\mid H_1)}{P(E\mid H_2)}\cdot\dfrac{P(H_1)}{P(H_2)}$.

## Chapter 1

- Toy worldviews are "View A/B/C" (never real traditions) in `belief-mixer`; mixer evidence for the mild case is $0.5,0.6,0.55$; prior "born among A" is $0.8,0.1,0.1$.
- Glossed in Level 1 (do not re-gloss at length later): worldview, belief, evidence, testimony, fallacy (genetic), steelman, strawman. Testimony: Hume (track record) vs Reid (default trust). Origin vs truth: strict view vs qualified (debunking) view, a live debate.
- Lenses lesson: four lenses (science, philosophy, theology, lived experience); universe ~13.8 billion years (Planck 2018, model-dependent); glossed there: universe, science, philosophy, argument, premise, theology, theist, principle of sufficient reason. Disagreements named as premise / value / kind of evidence.
- Reasons lesson: glossed there: reason, evidence, argument, premise, conclusion, testimony, experience, trust, cherry-picking, circular argument. Mixer with two claims, labels "Trust"/"Evidence": trust $0.9,0.1$, fit $0.4,0.6$ gives $86\%$ for claim 1.
- Tour lesson: puzzle card ids `p-<topic>`; each explanation names the later level by title; Hindu and Buddhist levels share `p-self` (chariot, anatta vs atman). Glossed there: selection effect, dualist, materialist, hedonism, perennialism, constructivist, analogy, fallibilist.
- Traps lesson: ids are topic slugs; lottery trap previews fine-tuning ("rare, therefore planned"); perennialism glossed there.
- Intro welcome card states "guessing is the point" for all Level 1 lessons.

## Chapter 2

- Argument cards use P1.. and C; thinkers' dates at first use: Hume 1711-1776 (Treatise 1739, Enquiry 1748), Russell 1872-1970 (chicken), Popper 1902-1994, Reichenbach 1891-1953, Laplace 1749-1827, Goodman 1906-1998 (1955).
- Induction lesson: running example is the Sun; hidden-rule toy `sequence-sampler` rule `change`, changeAt 37, symbols sun/new moon. Laplace rule $(n+1)/(n+2)$: $n=10$ gives $11/12$; 5000 years ~ 1,826,213 days gives odds 1,826,214 to 1. Glossed there: deductive, inductive, uniformity principle, circular (vicious), corroborated, grue/bleen.
- Four replies to Hume (bypass, vindicate, reshape, explain away), each with its best objection; layers card (fact / debate / commitment) closes the lesson.
- Paradigms lesson: Kuhn 1922-1996, *Structure* 1962; cycle normal science, anomalies, crisis, revolution, new normal science; values accuracy, scope, simplicity, consistency, fruitfulness; Mercury ~43 arcsec/century; incommensurability as Kuhn vs critics (Popper, Lakatos). Glossed: paradigm, normal science, anomaly, gestalt, incommensurable.
- Falsification lesson: modus tollens $T\Rightarrow O$, not $O$, so not $T$; Duhem form $(T\wedge A)\Rightarrow O$ with $A$ = auxiliary assumptions; swans toy = `rate` p 0.03 seed 4. Dates: Eddington 1882-1944, Le Verrier 1811-1877 (Neptune 1846), Duhem 1861-1916, eclipse 29 May 1919, Vlamingh 1697. Popper separates science from meaning (positivists equate). Glossed: falsifiable, conjecture, corroborated, auxiliary assumption, demarcation.
- Bayes lesson: hook test 90%/9%/1 in 100 gives 9/98 = 9.18% (grid 9, 1, 89, 901); odds example 20% with LR 6 gives 60%; priors 50% and 5% with LR 10 give 91% and 34%; DNA toy 1 in 5,000,000 gives 1/6; Bayes 1701-1761 (pub. 1763). Glossed: prior, likelihood, posterior, odds, likelihood ratio, prosecutor's fallacy, subjective/objective Bayesian, frequentist.
- Bayes-proof lesson: P1 odds identity (order card), P2 rational beliefs obey probability (the premise critics reject), P3 likelihoods differ; toy numbers prior 0.3/0.7 with likelihoods 0.8/0.2 gives 12/19 = 63.2%; risky prediction 10% prior, 0.9 vs 0.02 gives 5/6 = 83.3%; safe prediction ratio 1 stays 10%; 1% prior with ratio 3 needs 7 results (95.7%; 6 gives 88.0%). Old evidence (Glymour 1980, Le Verrier 1859, GR 1915) with replies counterfactual prior and explanatory fit. Glossed: likelihood ratio again, Dutch book, corroboration, old evidence.
- Underdetermination lesson: toy points (1,0.2),(3,1.1),(5,0.9),(7,2.1),(9,1.8), holdout x=10 (degree 1 gives 2.3, degree 4 gives -1.3); RMS example errors 1.0, 1.7, 2.2 give 1.71 (simple curve 0.14); odds 3:2 unchanged at LR 1. Duhem 1861-1916, Quine 1908-2000 (1951 essay, mild vs radical reading), van Fraassen b.1941. Weak vs strong underdetermination; truth-tracking vs pragmatic simplicity. Glossed: underdetermination, degree, RMS, overfitting, held-out, web of belief, realist, instrumentalist.
- Realism lesson: Putnam 1926-2016 (no miracles, 1975), Laudan b.1941 (pessimistic meta-induction, 1981; caloric, phlogiston, ether), Worrall 1989 (structural realism, Fresnel's equations kept in Maxwell), Hacking b.1936; $S$ = empirical success, $R$ = approximate truth. Glossed: scientific realism, instrumentalism, approximately true, inference to the best explanation, meta-induction, constructive empiricism, empirically adequate.
- Pseudo lesson: four marks (unfalsifiable, ad hoc rescue, no progress, no independent checking) as a cluster, according to Popper and Lakatos (1922-1974); Carlson 1985 Nature double-blind astrology test (28 astrologers, about 1 in 3 right, expected >= 1/2); 30C = 100^30 = 10^60, mole x 10^-60 = 6e-37 molecules; Hahnemann 1755-1843; prior 1% with LR 3 gives 2.9% (LR 1.1: 1.1%, LR 10: 9.2%); Laudan 1983 (drop demarcation), Wegener 1912. Glossed: demarcation, pseudoscience, ad hoc, progressive/degenerating programme, double-blind, mole, family resemblance.
