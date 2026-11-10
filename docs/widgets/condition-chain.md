# `condition-chain`
A chain of links in which each link conditions the next, "when this is, that is" (`js/widgets/condition-chain.js`, plain SVG, all wording from the config). The reader clicks (or Enter/Space on) a node to remove it, or to restore it. A link **arises** iff it is not removed and the link before it arises; so removing one link stops every link downstream. With a loop-back (cyclic) the last link conditions the first: the cycle runs only while no link is removed, and one removal stops all links, the stop travelling round the loop. A counter shows how many links still arise. Reports nothing to the card.
Drawn: numbered nodes (arising: vector hue; stopped downstream: dashed grey; removed: covector hue), optional labels, arrows between neighbours (solid ink while their source arises), the closing arrow last to first when cyclic, counter "k / N", optional list of stopped links, optional cyclic/linear switch and reset.
Config: `links` (2 to 14 labels; default A to F), `layout` ('ring' default, or 'row'), `cyclic` (false; initial mode), `clickable` (true), `toggle` (false; shows Cyclic / Linear buttons), `removed` (0-based links removed at the start), `show: {labels, arrows, loop, counter, status, list, reset}` (defaults true for labels, arrows, loop, counter, status; false for list = text list of stopped links, reset = restore button; `loop: false` hides the closing arrow, `status: false` stops colouring nodes and arrows so a card can show a bare picture), `labels: {counter, stopped, reset, cyclic, linear}` (math allowed). Note: in a linear chain removing link k stops links k+1 onward; the first link has no condition.
Presets:
- `linear-row`: `{layout: row, links: [A, B, C, D, E, F]}`: click any node, the rest to its right stops.
- `cycle-toggle`: `{cyclic: true, toggle: true, show: {reset: true, list: true}, links: [...12 names]}`: remove one link and all stop; switch to Linear and only the downstream ones stop.
- `static-loop`: `{cyclic: true, clickable: false, show: {status: false, counter: false}}`: a bare picture of the closed cycle.

Smoke presets (mounted by `node tools/widget-smoke.mjs`):
```smoke
layout: row
links: [A, B, C, D, E, F]
removed: [3]
```
```smoke
cyclic: true
toggle: true
links: [One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten, Eleven, Twelve]
show: {reset: true, list: true}
```
```smoke
cyclic: true
clickable: false
show: {status: false, counter: false, labels: false}
```
