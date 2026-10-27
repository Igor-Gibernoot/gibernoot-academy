# `simplex-points`
The probability simplex of three outcomes as an equilateral triangle (`js/widgets/simplex-points.js`; svg + plain HTML). A point is a
distribution $p=(p_1,p_2,p_3)$, $p_i>0$, $\sum p_i=1$, placed at the barycentric combination of the vertices (vertex $i$ = "outcome $i$
certain"; bottom-left, bottom-right, top). Up to 3 points, each fixed or draggable (pointer/touch; components clamped to at least `eps`
and renormalised). Readouts, per pair of points (names are TeX):
- Euclidean distance $\lVert p-q\rVert=\sqrt{\sum_i(p_i-q_i)^2}$ in $p$-space (triangle side $=\sqrt2$);
- $D_{KL}[p:q]=\sum_i p_i\ln(p_i/q_i)$ and $D_{KL}[q:p]$ in nats, with bars (full width = `barMax`);
- midpoint $m=(p+q)/2$ (hollow marker): $D_{KL}[p:m]$, $D_{KL}[m:p]$, $D_{KL}[q:m]$, $D_{KL}[m:q]$.

Config: `outcomes: [names]` (vertex labels, plain text); `points: [{name, tag?, p: [p1,p2,p3], fixed?, hue?: vec|covec|basis|gold}]`
(default hues vec, covec, basis; `tag` = text in the picture); `showKL` (default true), `showEuclid`, `showMidpoints`, `showComponents`
(default true): set `showKL: false, showComponents: false` for a picture only; `pairs: [[0,1],..]` (default all pairs) for the readouts,
the segments and the midpoints; `segment: true | [[i,j],..]` (dashed straight segment); `family: [{type: 'mixture'|'exponential', a, b,
hue?} | {type: 'curve', ps: [[..],..]}]` ($(1-t)p+tq$ or $p^{1-t}q^t/Z$ through points $a,b$, $t\in$ [`tMin`, `tMax`] = [−2, 3], clipped to
the triangle; follows the points when they move); `grid` (default true), `ticks` (0.25/0.5/0.75 on the edges), `snap` (e.g. 0.05),
`eps` (0.01), `barMax` (3 nats), `presets: [{label, points: [[..],..]}]` (buttons), `reset` (default true if some point is draggable),
`labels: {components, euclid, kl, mid, reset}`. Nothing is revealed unless the preset turns a readout on.
`el.dataset`: `p` (points joined by ` | `, components by `,`), `d` (distance per pair), `kl` (`D[p:q],D[q:p]` per pair), `klmid` (four values per pair).
Presets (copy into the lesson):
- `picture`: `{outcomes: [a, b, c], points: [{name: p, p: [0.5, 0.3, 0.2]}, {name: q, p: [0.2, 0.3, 0.5]}], showKL: false, showComponents: false}` (free dragging, no numbers).
- `asymmetry`: `{points: [{name: p, p: [0.6, 0.3, 0.1]}, {name: q, p: [0.2, 0.3, 0.5]}], showEuclid: true, segment: true}` ($\lVert p-q\rVert=0.566$,
  $D_{KL}[p:q]=0.498$ vs $D_{KL}[q:p]=0.585$ nats), add `showMidpoints: true` for the four midpoint divergences.
- `mix-vs-exp`: `family: [{type: mixture, a: 0, b: 1}, {type: exponential, a: 0, b: 1, hue: covec}]` (straight line vs the curved geodesic-like family).
