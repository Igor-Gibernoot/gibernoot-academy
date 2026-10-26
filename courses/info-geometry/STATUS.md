# Status

Session start: read only **Current** (`sed -n '/^## Current/,/^## Log/p' STATUS.md`), never the Log.

## Current (2026-10-26)

- **State:** widgets `simplex-points` and `gauss-charts` built; **`ch01-why` built** (19 cards, intro rules). Other Level 1 lessons planned.
- **Next unit:** `ch01-manifold` (source md 345-520). Widgets: `simplex-points`, `gauss-charts` (presets `both`, `sigma-only`, `two-points`), `chart-basis` (polar chart preset, see LESSON_FORMAT "Chart presets"). No further widget known to be missing.
- **Verified:** Preface and Ch.1 opening (PDF p.16); KL (1.30) PDF p.24; Pythagorean (2.70-2.71) PDF p.54 (see `sources/VERIFIED.md`). The md page anchors drift from the PDF later in the book: locate a PDF page by searching, not by anchor+1.
- **Paths:** lessons `courses/info-geometry/chNN/`, exams `exams/`, sources git-ignored.

## Log
### 2026-10-26: course created
Trail planned from the book's table of contents (planned lesson list is a draft: adjust as sections are read).

- 2026-10-26: `ch01-why` session stopped before writing: needs widget `simplex-points` (no existing widget or preset shows distributions as points of a probability simplex; checked gaussian-fit, dirichlet-counts, belief-mixer, sphere). Opening range verified.
- 2026-10-26 widget `simplex-points`: triangle simplex, 1-3 points (fixed/draggable), Euclid + KL both ways + midpoint KL with bars, segment, mixture/exponential/curve families, presets. Tested with a throwaway lesson (removed): smoke 0 errors, phone screenshot ok, validate ok. Choices: Euclid distance measured in p-space (side sqrt2); names are TeX; bars clamp at `barMax`=3 nats. Conventions fixed here: none.

### 2026-10-26: ch01-why built
19 cards: hook, simplex picture, reading a point, rain 50/51 vs 1/2, Euclid (pair A/B same distance 0.110), KL definition, by-hand KL, asymmetry (predict, widget, read), midpoints, right-angle picture + numeric Pythagoras, mixture vs exponential, "why curved", summary with closing table.
Choices: Pythagorean example p=(0.6,0.3,0.1), q=(0.3,0.4,0.3), r=q e^{t v}/Z with v=(0,2,-1), t=0.5 (r≈(0.1912,0.6929,0.1160)): D[p:q]=0.2197, D[q:r]=0.2006, D[p:r]=0.4203 (script-checked, orthogonality sum (p-q)(ln r-ln q)=0). Preset `right-angle` = 3 fixed points, `pairs: []`, mixture a:0 b:1 + exponential a:1 b:2 (viewed, fine). Euclid pair table A/B, KL 0.018 vs 0.144. Teaser mentions the Poincare half-plane (preface prose).
Conventions fixed here: $\ln$ for the book's $\log$; unit "nats"; points named $p,q,r$ in the triangle with outcomes $a,b,c$.
- 2026-10-26 widget `gauss-charts`: charts (mu,sigma) and (mu,sigma^2) side by side, draggable point in either, density with mean line and +-sigma bar, grid of sigma=const / sigma^2=const lines in both charts, extra fixed points/paths/segments (a segment straight in one chart is bent in the other). Throwaway lesson (removed): smoke 0 errors, shots ok (desktop+phone), validate ok. Choices: sigma^2 axis runs 0..sMax^2; sigma clamped to >= sMin=0.25 so peaks fit yMax=1.7; `curves` entries are points, paths or segments. Conventions fixed here: none.
