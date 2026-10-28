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
