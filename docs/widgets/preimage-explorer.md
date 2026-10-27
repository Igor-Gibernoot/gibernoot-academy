# `preimage-explorer`
Continuity through preimages. The graph of a fixed map $\mathbb{R}\to\mathbb{R}$;
the reader drags the two ends of an open interval $\mathcal{V}$ (gold band) on
the vertical axis. The part of the graph inside the band is highlighted and the
preimage $\text{preim}(\mathcal{V})$ is drawn on the horizontal axis (filled end
dot = that end belongs to the preimage). The readout writes the rule, $\mathcal{V}$,
the preimage, and whether it is open (a filled end is a point with no room).
```yaml
config:
  fn: linear                  # linear (2x + 1) | step (H: 0 for x < 0, 1 for x ≥ 0)
                              # | square (x²) | const (1)
  V: [0.5, 1.5]               # ends of the open interval V (a < b)
  view: { x: -3, y: -1.5, w: 6, h: 4.5 }   # model units
  snap: 0.1                   # grid for the ends of V
  presets: [{ label: Jump, fn: step, V: [0.5, 1.5] }]   # fn, V optional
```
New maps go in `FUNCS` in `js/widgets/preimage-explorer.js` (rule text, formula, jump points).
