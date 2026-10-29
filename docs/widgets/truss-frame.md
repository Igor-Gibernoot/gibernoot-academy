# `truss-frame`
A pin-jointed frame (truss) with supports, loads and member forces by the method of joints (`js/widgets/truss-frame.js`, plain SVG + HTML, all words and units from the config).
Each bar carries only an axial force N (tension positive). At every joint bar forces + reaction + load add to zero: 2 equations per joint, `A x = -b`, x = bar forces then reactions.
Rank test: m bars + r reaction components against 2n equations. `rank(A) = 2n`: rigid (determinate if m + r = 2n, "redundant" if more; the minimum-norm force split is shown).
`rank(A) < 2n`: **mechanism**; if the load does work on the free motion (null space of A^T) the frame is drawn sheared along it (a plain square pushed sideways); if the load cannot be balanced no forces are drawn.
Built-in shapes: `square`, `braced` (+ diagonal), `triangle`, `warren`, `pratt` (`span`, `height`, `panels`), or your own `nodes`, `members`. Tension orange (`--covec`), compression blue (`--vec`), reactions purple; bar width grows with |N|; a bar with no force is dashed.
Joints are draggable (snap `snap`), the load arrow end is draggable (size and direction); click a bar to read its force.
Exported for script checks: `trussModel({nodes, members, supports, loads})` -> `{status, consistent, N, reactions, mode, collapses, m, r, n, rank}`, `buildShape({shape, span, height, panels})`.
Script check: Warren, span 16, height 3, 4 panels, 40 kN at the bottom midpoint: reactions 20/20, end bottom bar +13.33 (= 20 x 2/3), slanted bars +-24.04 (= 20 x sqrt(13)/3), middle bottom bars +40, middle top bars -53.33 (= M/h = 160/3); triangle span 4, height 3, 12 kN at the apex: legs -7.211, tie +4; braced square, 10 kN sideways at the top-left: diagonal +12.5, rigid; plain square: mechanism, collapses.
Config: `shape: braced`, `span: 4`, `height: 3`, `panels: 4`, `nodes`, `members`, `supports: [{node, type: pin|rollerY|rollerX}]`, `loads: [{node (index, mid or top), fx, fy, hang}]`, `units: {length, force}`, `ranges: {load: [-100, 100, 1]}`, `snap`, `forceScale`,
`readouts` (status, count, maxtension, maxcompression, reactions, member, load), `labels` (status, count, maxtension, maxcompression, reactions, member, load, tension, compression, zero, rigid, redundant, mechanism, balanced, unbalanced, collapse, reset, loadSlider, none),
`show: {members, joints, jointNames, supports, loadArrow, forces, forceLabels, widths, zeroMembers, jointForces, reactions, ghost, legend, labels, readouts, indicator, handles, loadHandle, loadSlider, presets, selectable}`
(all true except jointNames, jointForces, ghost, loadSlider; `jointForces` = small arrows of the bar forces on each joint; `ghost` = faint original when collapsed; `forces` off = neutral bars; `loadSlider` scales the first load keeping its direction),
`presets: [{label, shape, span, height, panels, nodes, members, supports, loads}]` (a preset replaces the whole frame, Reset returns to the config). Reports nothing to the card.

Example: `{shape: square, loads: [{node: top, fx: 10}], show: {ghost: true}, presets: [{label: Add a diagonal, shape: braced}]}`.
