# `integration-demo`
Toy network of 4 to 6 nodes (`js/widgets/integration-demo.js`, plain SVG + HTML, wording from the config). Links are
undirected and weighted (weight 1 unless given). Clicking (or Enter/Space on) a link slot between two nodes switches the
link on or off. The widget tries every split of the nodes into two non-empty groups (brute force, at most 31 splits),
adds up the weight of the links crossing each split, and takes the smallest: the **weakest cut**. That smallest crossing
weight is shown as **toy integration**, a stand-in for IIT's $\Phi$ and not the real $\Phi$ (no causal repertoires, no
effect information). A disconnected network scores 0, a chain 1, a ring 2, five fully linked nodes 4. Ties: the most
balanced split is shown. Reports nothing to the card.
Drawn: nodes (the two sides of the weakest cut coloured: group A vector hue, group B covector hue), links (solid; thicker
when weight > 1, weight written on it if not 1), faint dashed slots for absent links, severed links of the weakest cut
dashed in the covector hue, readout rows, optional list of the K smallest cuts.
Config: `nodes` (list of `{label, x, y}`, x and y in 0..1; default 5 nodes on a pentagon labelled A to E), `links`
(list of `[i, j]` or `[i, j, weight]`, 0-based; the initial links), `clickable` (true; the weight restored on a switch-on is
the one given in `links`, else 1), `cutList` (0; K = show the K smallest partitions with their cut value), `show: {nodes,
labels, links, slots, cut, groups, score, cutValue, reset}` (defaults true for nodes, labels, links, slots, cut, groups,
score; false for cutValue = names of the two groups in text, reset = button back to the initial links),
`labels: {score, partition, reset, cutList}`. With `slots: false` absent links are invisible (still clickable if
`clickable`; hide both for a static picture); with `links: false` nothing solid is drawn.
Presets (5 nodes on the default pentagon unless noted; scores checked by brute force in an independent script):
- `chain`: `{links: [[0,1],[1,2],[2,3],[3,4]]}` -> toy integration 1 (weakest cut A B | C D E; every single link ties at 1).
- `ring`: `{links: [[0,1],[1,2],[2,3],[3,4],[4,0]]}` -> 2 (two links must be cut).
- `complete`: all 10 pairs -> 4 (isolating one node cuts its 4 links).
- `empty-editable`: `{links: []}` -> 0; the reader builds a network by clicking.
- `two-clusters` (6 nodes: A, B, C left at x = 0.1 to 0.35, D, E, F right at x = 0.65 to 0.9; triangles ABC and DEF plus
  link C-D): `{nodes: [{label: A, x: 0.1, y: 0.15}, {label: B, x: 0.1, y: 0.85}, {label: C, x: 0.35, y: 0.5},
  {label: D, x: 0.65, y: 0.5}, {label: E, x: 0.9, y: 0.15}, {label: F, x: 0.9, y: 0.85}],
  links: [[0,1],[0,2],[1,2],[3,4],[3,5],[4,5],[2,3]]}` -> 1 (cut the bridge C-D; the dense clusters are not the weak
  point, the bridge is). Adding a second bridge (B-F) raises it to 2.
Example (reader explores, with the list): `{links: [[0,1],[1,2],[2,3],[3,4]], cutList: 4, show: {cutValue: true, reset: true}}`.
Example (static picture, no interaction): `{links: [[0,1],[1,2],[2,3],[3,4],[4,0]], clickable: false, show: {slots: false, score: false}}`.

Smoke presets (mounted by `node tools/widget-smoke.mjs`):
```smoke
links: [[0,1],[1,2],[2,3],[3,4]]
cutList: 4
show: {cutValue: true, reset: true}
```
```smoke
nodes: [{label: A, x: 0.1, y: 0.15}, {label: B, x: 0.1, y: 0.85}, {label: C, x: 0.35, y: 0.5}, {label: D, x: 0.65, y: 0.5}, {label: E, x: 0.9, y: 0.15}, {label: F, x: 0.9, y: 0.85}]
links: [[0,1],[0,2],[1,2],[3,4],[3,5],[4,5],[2,3]]
```
```smoke
links: []
show: {slots: false, links: false, cut: false, groups: false, score: false}
```
