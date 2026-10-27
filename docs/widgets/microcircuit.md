# `microcircuit`
A generic message circuit (`js/widgets/microcircuit.js`, SVG + HTML, rAF for Play; no inference, all names and formulas from the config).
Populations (round nodes) joined by synapses (arrows) that carry named messages, on horizontal bands (layers, nuclei, levels). Colours: input
teal, expectation green, error red, inhibitory grey, output purple, modulator gold (`cls`); an excitatory synapse ends in an arrowhead, an
inhibitory one in a round end (`sign: '-'`). **Click a node**: thick ring; incoming edges blue, outgoing orange, the rest dimmed; the readout
lists "Receives / Sends" with each message formula, kind, direction, frequency and sign. **Click an edge**: lights it and states message, synapse
sign, direction badge, frequency, `note`. **Play messages** sends one dot (colour = message kind) along each edge of `sequence`, one per
~0.75 s, with the step in the readout; Stop/Reset. Optional **modulator**: a gold node with dashed arrows to the listed edges and a slider that
scales their thickness and dot size (visual only; the readout prints the weighting, e.g. $\Pi_y=1.5$). Edges in both directions between two
nodes are drawn side by side. No self-loops (use two nodes). Hues, not colour names, in the text: blue = incoming, orange = outgoing.
```yaml
config:
  box: [400, 300]                        # drawing box; all positions are in it (default 400 x 300)
  bands: [{label: "layers II/III", y0: 0, y1: 100}, ...]
  nodes:
    - {id: ss, label: "\\epsilon^{(i)}", name: "spiny stellate", pos: [90, 135], cls: input,
       populations: "layer IV", info: "Markdown sentence", tag: "A"}
  edges:
    - {id: e1, from: ss, to: sp, sign: '+', message: {label: "\\Pi\\epsilon", kind: error},
       direction: ascending, freq: gamma, note: "Markdown"}
  sequence: [e1, e2, e3]                 # order of Play (default: all edges)
  modulator: {node: mod, edges: [e1], label: "\\Pi_y", min: 0, max: 2, value: 1, step: .1, weighting: "{label}={g}"}
  hideNames: false      # true: nodes show only `tag` (default A, B, C...); names, populations, info, notes hidden
  showLabels: true      # message formulas and kinds   (all six flags below default true; false hides the piece)
  showSigns, showFreq, showModulator, showBands, showLegend
  select: sp            # start with a node (or edge) selected
  labels: {reads, sends, none, hint, play, stop, reset, sign, excitatory, inhibitory, message, direction, step, gain, cls: {error: "..."}}
  presets: [{label: "continuous", ...any key above}, {label: "discrete", nodes: [...], edges: [...]}]
```
`kind` in {prediction, error, expectation, policy, precision} sets the dot colour; `direction` is a free badge (ascending | descending |
intrinsic, or any text). Presets replace the whole circuit (a preset overrides the same-named top-level keys): a discrete/continuous
toggle, a "with / without modulator" toggle (`modulator: null`) or a stepwise reveal are presets. For an mcq "which population?" use
`hideNames: true`, `showBands: false` (layer names would give it away) and, if the formula would, `showLabels: false`.
`el.dataset`: `selected`, `selectedEdge`, `reads`, `sends` (edge ids), `playing`, `step`, `gain`, `preset`.
Covers the Level 5 presets: `column` (anatomy, signs), `pc`, `pomdp`, `spinal`, `bg` (modulator = dopamine), `hybrid`; any layered
signal-flow diagram (Bayes filter, learning loop, a network layer diagram) is the same config.
