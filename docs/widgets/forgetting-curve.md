# `forgetting-curve`
A toy model of forgetting and spaced review (`js/widgets/forgetting-curve.js`, plain SVG + HTML, all wording from the
config). Retention after the last review at $t_{\text{last}}$ fades as $R = e^{-(t - t_{\text{last}})/S}$; a review resets
$R$ to 1 and multiplies the stability $S$ by $1 + \text{gain}\,(1 - R)$, so a review made after some forgetting helps a
lot and a crammed one (made when $R \approx 1$) almost nothing. Plots the curve for the current schedule (accent, with a
dot and dotted jump at each review) and, optionally, the read-once curve (dashed). The reader toggles review days with
chips or sets a whole schedule with preset buttons. Illustrative only: say so in the caption.
Config: `days` (60), `s0` (2.5 days), `gain` (3.8), `schedule` ([1,3,7,16,35], days switched on at start; fractions
allowed), `chips` (toggleable days, `[]` = none), `presets: [{label, schedule}]`, `show: {noReview, markers, grid, ticks,
axisLabels, threshold}` (all true except threshold), `thresholdAt` (0.5), `readouts` (from `end, reviews`; `[]` = none),
`labels: {withReview, noReview, day, retention, end ("On day {d}"), reviews, threshold, chipsTitle}`. Reports nothing.
With the defaults each review falls near 70% and day 60 ends near 80% (read once: 0%). Used on the Method page.
