# `blanket-graph`
A small graph of coupled sets of states (`js/widgets/blanket-graph.js`, SVG + HTML labels, no library; all wording from the
config, no maths hard-coded). Default: the four sets of a Markov blanket, external $x$ (left), sensory $y$ (top), active $a$
(bottom), internal $\mu$ (right), arrows $x\to y$, $y\to\mu$, $\mu\to a$, $a\to x$. Arrows are toggles (click the arrow or its
chip; off arrows show dashed only if editable). Readouts: the **directly connected** list; a button **Condition on the
blanket** that greys the blanket nodes ("given") and states the verdict by the graph test: *no undirected path from an
external node to an internal node that avoids the blanket nodes* (for flows, an arrow is a nonzero dependence of one set's
flow on another). Independent: green box, "every path goes through $y$ and $a$". A leaking arrow (default toggles $x\to\mu$,
$\mu\to x$): red box "Not a blanket", the path and the leaking arrow named, drawn red. Before conditioning the box shows the
shortest path linking them. `el.dataset.verdict` = `open | blanket | leak`.
Config: `nodes: [{id, label, role, hue, pos:[x,y]}]` (role `external` / `internal` are the two sets tested; others are
free; `pos` in a 400x230 box; `label` is KaTeX source, e.g. `\mu`), `edges: [{from, to, on, editable, w}]` (`from == to` is a
self-loop; only listed arrows exist; `id` defaults to `from>to`), `blanket: [ids]` (default: roles sensory + active),
`editable` (default for edges, false), `conditioned` (start conditioned), `showVerdict`, `showList`, `showChips` (all
default true), `labels: {list, none, condition, uncondition, reset, play, pause, restart, flows, linked, indep, notBlanket,
leak, because, via, nolink, and, given}`, `presets: [{label, edges: ['x>y', ...ids that are ON], conditioned}]`.
`simulate: true` adds flows $\dot z_i=-z_i+\text{gain}\sum_{j\to i}w\tanh z_j+\text{noise}$ (each node only feels its
parents, the book's Fig. 3.1 statement) with a trace plot and Play / Restart (`gain` 1.5, `noise` 0.6, `dt` 0.05, `seed` 7;
paused at start, seeded, runs 400 warm-up steps). Node hues avoid the fixed blue, orange and purple.
Example: `{presets: [{label: Blanket, edges: ['x>y','a>x','y>mu','mu>a'], conditioned: true}, {label: Leaky, edges: ['x>y','a>x','y>mu','mu>a','x>mu'], conditioned: true}]}`.
