# Widgets

One file per widget: `docs/widgets/<name>.md` (config, presets, examples).
Read only the file of a widget you use. General rules (stable layout,
everything hideable) are in `docs/LESSON_FORMAT.md`, "Card types > widget".
Adding a widget: new `js/widgets/<name>.js`, one line in `js/widgets/index.js`,
and a new `docs/widgets/<name>.md` plus a line below.

- `alt-projections`: Alternating minimization of the KL divergence between two curves K and S of the three-o…
- `area-cell`: What { g} measures
- `attractor-lab`: Movement as fulfilled proprioceptive predictions
- `ball-probe`: Is a set open? The reader drags a point p and sets the radius r with a
- `basis-playground`: A fixed vector X
- `belief-mixer`: Prior and evidence combine into a belief
- `sequence-sampler`: A seeded stream of observations from a hidden rule (always the same, a change at a step, or a rate p); tally, run, claim flag, surprise marker
- `blanket-graph`: A small graph of coupled sets of states
- `blanket-sync`: Synchrony of two sets that are independent given a third value
- `bregman-gap`: A convex function
- `chart-basis`: Chart-induced bases and the Jacobian in the plane {R}^2
- `circle-charts`: Two charts on the unit circle S^1
- `coupled-agents`: Two agents with continuous models that listen to each other
- `curve-velocity`: The velocity of a curve as the derivative of functions along it
- `deep-levels`: Two-level discrete hierarchy
- `dirichlet-counts`: Dirichlet counts of one or more columns j of a likelihood matrix  A
- `dual-grids`: Two planes side by side
- `factor-graph`: A factor graph
- `falling-cloud`: Tides (Newton-Cartan gravity of a point mass)
- `feedback-loop`: A thermostat-controlled room
- `flow-lab`: General ODE trajectory viewer
- `free-energy-bound`: Variational free energy as a bound on surprise
- `gauss-charts`: The Gaussians N
- `gaussian-fit`: Fit a Gaussian q
- `homeostat`: A creature keeps a body value
- `hybrid-saccade`: A hybrid (discrete + continuous) model turning a decision into an eye movement
- `light-cones`: A 1+1 spacetime picture for Lorentzian metrics
- `log-ruler`: A logarithmic ruler
- `machine-playground`: A tensor as a machine with slots
- `map-builder`: Two finite sets
- `mean-field-vb`: Mean-field variational Bayes on a joint over two discrete latent variables x_1\{1
- `microcircuit`: A generic message circuit
- `observer-frame`: An observer's frame and what it measures
- `parallel-transport`: Parallel transport and autoparallels in the plane
- `peb-regression`: Group regression on per-subject posteriors
- `policy-scorer`: Scores 2 to 4 policies by expected free energy
- `pomdp-lab`: A small discrete-time model
- `predictive-coding`: Prediction errors
- `preimage-explorer`: Continuity through preimages
- `rotating-grid`: Pseudo-forces in a rotating chart
- `simplex-points`: The probability simplex of three outcomes as an equilateral triangle
- `sphere`: The final-exam figures
- `steady-state-walk`: A 2D random walker over contours of surprise
- `time-slices`: A 1+1 spacetime picture for absolute time
- `tradeoff-curve`: A design slider moves a marker along a tradeoff curve between two quantities, with an optional needs region
- `torus`: The exam figures
- `worldline-clock`: A worldline and the clock it carries
- `bike-balance`: A bicycle from behind as an inverted pendulum with steering feedback; lean-angle plot, speed and gain sliders, nudge
- `lever-balance`: A plank on a pivot; drag pivot and loads, force arrows, dashed arms, a torque bar per side, tilt; `wrench` form (hand force vs a bolt's torque)
- `friction-stop`: A vehicle braking on a road with friction mu: stopping distance d = v0^2/(2 g mu) (mass cancels), speed-against-distance plot, kinetic energy turning into heat, optional slope and locked/rolling toggle
- `pin-tumbler`: Cutaway pin-tumbler lock with N pins and a key of D cut depths: pins at the shear line turn green, the plug turns only if all match, D^N keys; optional picking mode
- `elevator-counterweight`: A traction elevator: cabin and counterweight on a pulley, sliders for load, counterweight and speed, up/down; rope tensions, motor force F = (m - M) g, power P = F v (negative = regenerating), trip energy bar
- `track-ride`: Side-view track (hill-hill, crest, circle or teardrop loop, or draggable control points) and a cart with energy conservation and optional friction; felt-g meter and plot (N/mg, signed, optional tolerance band), force arrows, energy bar, airtime and stall flags
- `crash-impulse`: A mass stopped by a wall or bag: stop time or crumple length slider, force-time plot with the area (impulse = m v0) shaded, peak force, deceleration bar in g with optional injury band
- `frequency-grid`: N dots as natural frequencies for Bayes: sliders base rate, sensitivity, false-positive rate; TP/FN/FP/TN colours and counts (explicit rounding), posterior TP/(TP+FP), optional bar and formula line; sliders hideable/fixable
- `curve-fit-lab`: Draggable data points with polynomial least-squares fits of several degrees at once (degree slider 1-8), residuals, a held-out x where fits disagree, simplest fit within tolerance; add/remove points (underdetermination of theory by data)
- `cellular-automaton`: W x H grid with a Birth/Survival rule (default Life B3/S23), preset glider/blinker/block/empty/random or explicit cells; step/play/reset, drag-toggle, generation and live counters, neighbour-count overlay for one cell, centre-of-mass trace, rule readout
- `arch-thrust`: Cable, arch or dome under load: span, rise, uniform and point loads, thrust H = wL^2/(8h), reactions, tension/compression arrows, thrust line with middle-third band, dome meridian and hoop force
- `truss-frame`: Pin-jointed frame (square, braced, triangle, Warren, Pratt) with draggable joints and load, bar forces by method of joints (tension orange, compression blue), rigid / mechanism indicator
- `beam-section`: Simply supported beam, solid / I / hollow section of equal area, second moment I, bending stress profile, optional rebar, prestress, crack marker, deflection
- `oscillator-lab`: Driven mass on a spring or swaying tower: frequency, damping, live resonance curve with marker, optional tuned second mass (Den Hartog tuning, mass ratio), time trace, f = (1/2pi) sqrt(k/m), phase
- `flutter-lab`: Torsional twist of a bridge deck in wind (linear model): effective damping = structural minus aerodynamic term falls to zero at a critical wind speed, negative past it (growth, limit); damping-vs-wind plot, twist trace, optional forced-resonance contrast mode
- `chsh-lab`: CHSH test, singlet pair: draggable analyser angles a, a', b, b' on two dials, E = -cos(x-y) curve with the local straight-line model, S and its four correlations, |S| gauge against 2 and 2.83; presets best / free / curve

- `diagonal-list`: Cantor's diagonal table: N rows of K-digit decimals (click/arrow spinner per digit), highlighted diagonal cells, diagonal number d built from a rule that never gives 0 or 9 (presets add1, five, or custom map), check column "d differs from row k in digit k", live readout, optional step-reveal and display-only modes
- `scale-factor`: Schematic cosmic scale factor a(t) for Big Bang / bounce / eternal / emergent pasts, model selector, draggable cursor reading a, T = T0/a and rho ~ a^-3 or a^-4, optional breakdown and unknown-physics bands (not Einstein solutions)
- `multiverse-counter`: A growing sequence of bubble universes of types A (small, many) and B (large, few) with a cut-off slider and a counting rule (by count, by volume, by time); the fraction of A swings with the rule; optional compare row, trace plot, grow
- `microstate-counter`: N particles in a box with two halves; click to flip, macrostate k, W = C(N,k), share W/2^N, S/k_B = ln W, optional histogram of W for every k with k highlighted; shuffle, step, auto-run (drift to N/2), reset, N selector; seeded
