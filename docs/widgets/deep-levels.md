# `deep-levels`
Two-level discrete hierarchy, sentences over words (`js/widgets/deep-levels.js`, plain HTML; all text from the config; names are
markdown inline and may carry `$..$`). A higher-level state $k$ (a sentence) persists over all $T$ word steps and predicts the word
$w_t(k)$ at step $t$; those predictions are the empirical prior $\mathbf D$ of the lower-level POMDP for that word:
$$D_t(w)=\sum_k Q(k\mid\text{words before }t)\,P(w\mid k,t),\qquad Q(k\mid\text{words})\propto P(k)\prod_t P(\text{word}_t\mid k,t),$$
$P(w\mid k,t)=1-\text{noise}$ if $w=w_t(k)$, else $\text{noise}/(\#\text{words}-1)$. One card per word step $t$ (header
$\tau^{(2)}=t$, ticks $\tau^{(1)}=1..$`fastSteps` showing the faster scale inside each word, a "next" badge on the first unread step):
buttons to set or clear the word read at that step, and bars of the predicted word distribution (= $\mathbf D$ at step 1, the
next-word prediction at later steps). Below: every sentence with its words (chips that match the evidence are shaded) and a bar
prior (tick) $\to$ posterior; sentences with zero posterior fade; if no sentence fits, `labels.inconsistent` shows.
Config: `words: [names]`; `sentences: [{words: [names]}]` (equal lengths); `prior: [numbers]` (normalised, default uniform);
`noise` (0); `fastSteps` (3); `evidence: [word|null,...]`; `presets: [{label, evidence}]`; `labels: {slow, fast (bare KaTeX), step, sentences,
prior, posterior, predicted, none, reset, next, inconsistent}`. `el.dataset`: `prior`, `post`, `d` (step-1 prediction), `next`
(prediction at the first step after the last read word, or `done`).
Presets (copy into the lesson):
- `reading` (six sentences of four words from flee/feed/wait): `words: [flee, feed, wait]`, `sentences:` flee wait feed wait; wait wait wait feed;
  wait flee wait feed; flee wait feed flee; wait wait wait flee; wait flee wait flee; `fastSteps: 3`, presets `flee`, `flee, wait, feed, wait`.
  Numbers: $\mathbf D$ at step 1 = flee 1/3, wait 2/3; after flee: sentences 1 and 4 at 0.5 each, step 2 wait 1.0, step 3 feed 1.0;
  after flee, wait, feed: step 4 wait 0.5, flee 0.5; after flee, wait, feed, wait: sentence 1 with probability 1.
- `two-sentences`: `words: [yes, no]`, sentences yes no no; yes yes no, `prior: [3, 1]`, `noise: 0.05`: $\mathbf D$ at step 1 = yes 0.95, no 0.05; with the prior 0.75/0.25
  the step 2 prediction for no is $0.75\cdot0.95+0.25\cdot0.05=0.725$ (the word yes at step 1 fits both sentences, the posterior stays 0.75/0.25).
