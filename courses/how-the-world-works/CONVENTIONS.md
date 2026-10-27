# how-the-world-works conventions by chapter

Everything fixed while building this course: notation, running examples, key numbers, per-lesson choices.
Read only the section you need: `grep -n '^## ' courses/how-the-world-works/CONVENTIONS.md`, then `sed -n` that range.

## General (rules fixed while building)

- SI units; $g = 9.8\ \mathrm{m/s^2}$; $c \approx 3\times10^8$ m/s.

## Chapter 1

- Tone: plain words, guess first, each numeric card gives its data and units; explanations name what each factor counts. Guess-is-the-point line in the first card only so far.
- Powers of ten: exponent is not 'times'; order of magnitude = factor 10; good guess = within one order.
- Rules of thumb: 1 m/s = 3.6 km/h; 1 year ~ 3e7 s (pi x 1e7); scaling k -> area k^2, volume k^3.
- Typical values used: car 1000 kg, plane 250 m/s, walking 1.4 m/s, motorway car 30 m/s, Earth orbit 3e4 m/s, steel 1e9 N/m^2, adult 700 N, hair 1e-4 m, atom 1e-10 m.
- Energy lesson: $E = P\,t$ (J, W, s); 1 Wh = 3600 J, 1 kWh = 3.6e6 J; efficiency = useful/total (fraction, 0 to 1); typical: phone 5.4e4 J, chocolate bar 1.1e6 J, petrol 3.4e7 J/L, cyclist 400 W in / 100 W useful, filament bulb 50 W in / 5 W light. Heat is the usual leftover ("energy is moved, not used up").
- Guess-is-the-point line is repeated in the hook of every Level 1 lesson.
- log-ruler: guess ladder `reveal:false`; picture after its question `reveal:true, slider:false, readout:false`; widget cards `review: false`.
- Feedback lesson: room heater +0.8 C/min, loss 0.04 C/min per degree above outside (always-on settles at outside + 20); error $e = T_{\text{set}} - T_{\text{sensed}}$, heater on iff $e>0$; band/hysteresis glossed; feedback-loop presets: plain-text labels (no math), `review: false`, onoff outsideRange [3,15].
- Tradeoffs lesson: beam strength $S = 40t^2$ kN, weight $w = 2t+1$ kg/m ($t$ cm), needs $S\ge400$, $w\le12$, feasible $t\in[3.16, 5.5]$ (3.2 to 5.5 cm); bicycle $P = F\cdot v$, $v = 2s$ m/s, $F = 100/s$ N (P = 200 W), needs $v\ge4$, $F\ge60$ infeasible (needs 240 W); tradeoff-curve cards `review: false`, `range` only revealed in the resolving card.
- Tour lesson: one puzzle per later level, titled by the level name; typical values: oven 2300 W at 230 V = 10 A, lamp 10 W = 0.04 A; sound 340 m/s (3 s = 1020 m); boat 2000 kg displaces 2 m^3 (water 1000 kg/m^3); 2^10 = 1024 for 1000 items; satellite at 400 km: gravity about 90%, speed about 7.7 km/s. Degrees in text: `^\circ$C` (no `\,`).
- Traps lesson: ends with a plain "Traps to remember" text card (no `own:`); new numbers: cube 1 cm = 2 g -> 3 cm = 54 g, 4 m/s = 14.4 km/h, 54 km/h 300 m = 20 s, beam 3 to 6 cm (360 to 1440 kN, 7 to 13 kg/m), heater 1.5 kW x 2 h = 3 kWh.
- Map lesson: 14 boxes titled by concept; bodies restate the formulas with symbols defined; tour box last, dashed edge.

## Chapter 2

- Bike lesson: lean $\varphi$ from vertical; $a = v^2/r$ (derived by direction change); $\tan\varphi = a/g$ (5 m/s, r 10 m: 14.3 deg; 10 m/s: 45.6 deg); $r = l/\tan\delta$; bike loop: setpoint upright, error = lean, actuator = steering; lean time scale $\sqrt{h/g} \approx 0.3$ s; widget card `review: false`.
- Brakes lesson: friction $F = \mu N = \mu m g$ ($\mu$ unitless: 0.7 dry, 0.4 wet, 0.1 ice; weight is $mg$, $W$ is work); $a = \mu g$; $d = v^2/(2\mu g)$; kinetic energy $E_k = \tfrac12 m v^2$, work $F d$; running car 1000 kg at 15 m/s: 6860 N, 16.4 m (wet 28.7 m), 112 500 J; widget card `review: false`.
- Gears lesson: torque $\tau = Fr$ (N m, $r$ the perpendicular arm); lever balance $F_1r_1 = F_2r_2$; gear pair driver $N_1,\omega_1,\tau_1$ to driven $N_2$: $\tau_2 = \tau_1N_2/N_1$, $\omega_2 = \omega_1N_1/N_2$; $P = \tau\omega$; bike running example: chainring 48, cog 16, ratio 3, wheel $C = 2.1$ m, 80 turns/min = 8.4 m/s, pull at tyre $157/s$ N.
- Brakes-heat lesson: specific heat $c$ steel 450 J/(kg K) typical; $\Delta T = Q/(c\,m_{\text{disc}})$ (K = step of $1\,{}^\circ$C); 5 kg discs, 1000 kg car from 30 m/s: $Q$ = 450 kJ, 200 K (50 K from 15 m/s); rolling grip about $1.2\mu$ (typical): 54.7 m vs 65.6 m locked; ABS loop: setpoint slip, sensor wheel speed, error, actuator valve; write `{}^\circ` in KaTeX.
- Lock lesson: $N$ pins, $D$ depths (cuts 0 shallowest), keys at most $D^N$ (6^5 = 7776, 6^6 = 46656); tolerance lowers usable $D$ (4^5 = 1024, typical); $k$ split pins give $2^k$ opening keys (32 keys, chance 1/243); picking about $D\times N$ tries (30); widget cards `review: false`.
- Elevator lesson: maximum load 300 kg (best counterweight = cabin + half of it); weight written $mg$, $W$ is work; $W = mgh$, $P = Fv$; motor efficiency 0.8 typical (2.94 kW needs 3.675 kW electric); regeneration = negative $P$; counterweight acts as a battery (29.4 kJ = 156.8 - 127.4); widget cards `review: false`.
- Elevator widget (`elevator-counterweight`): motor force $F = (m - M)g$ on the cabin side of the rope (cabin+load $m$, counterweight $M$, up positive), $P = Fv$ with the cabin velocity, negative = regenerating; 800 kg at 2 m/s without counterweight: 7840 N, 15.68 kW; best counterweight = cabin + half the load (650 kg for 500 + 300): 1470 N, 2.94 kW.
- Airbag lesson: momentum $p = mv$, impulse $J = F\Delta t = \Delta p$ (N s = kg m/s); $F = mv/\Delta t$; $\Delta t = 2d/v$ (average speed $v/2$); $F d = \tfrac12 m v^2$; car 1200 kg at 15 m/s: J 18000 N s, 180 kN (0.1 s), 36 kN (0.5 s), 225 kN (0.6 m, 0.08 s), 1800 kN rigid (0.01 s), 900 kN at 30 m/s; head 5 kg typical: 750 N (0.1 s bag) vs 7500 N (0.01 s); widget card `review: false`.
- Traps lesson: ends with plain text "Traps to remember"; new numbers: 2000 kg van wet 15 m/s = 28.7 m, mu 1.2 from 15 m/s = 9.6 m, gears 12 to 36 teeth 95% = 342 W, locked 65.6 m vs ABS 54.7 m (30 m/s dry), reaction 1 s e-bike 22.76 m.
- Guided problem lesson: e-bike + rider 90 kg at 10 m/s, wet mu 0.4, junction 20 m: E_k 4500 J, F 352.8 N, d 12.76 m; reaction 1 s: 22.76 m total, 4.65 m/s at the junction (latest reaction 0.72 s); 1:10 hill needs mg/10 = 88.2 N, wheel radius 0.334 m, crank torque 52.5 N m, max gear ratio s 1.78; post: J 900 N s, 0.5 m pad gives 0.1 s, 9000 N. Guided summary is a plain text card (no `own:`).
- Map lesson: 12 boxes (balance, torque, ratio, friction, work, power, kinetic = braking distance, momentum, impulse, shear, combo); dashed edge balance to friction; challenge is one file `ch02/challenge.yaml`, two sessions.
- Intuition lesson: recalls running examples (1000 kg car 15 m/s 16.4 m, ratio 3 = 30 to 90 teeth, 1200 kg airbag car 18000 N s, 800/650 kg elevator 1470 N, 6^5 = 7776); new numbers: 30 to 90 teeth with 12 N m gives 36 N m, 1200 kg stopped in 0.25 s gives 72 kN, 800 kg vs 700 kg counterweight gives 980 N; closing card is a short teaser after `own:`.
- Challenge part 1: bike 70 kg rider+bike, hill force mg/10 = 68.6 N, wheel r 0.334 m, crank torque 52.5 N m, sustained 250 W gives 3.64 m/s (s 1.3 at 80 rpm); needs speed >= 3 m/s, pull >= 68.6 N (s 1.07 to 2.29); brake spec 15 m with 1 s reaction, mu 0.4: 7.61 m/s (7.39 m braking), ABS 1.2 mu: 6.16 m, heat 2028 J, 0.5 kg steel 9 K; crank 0.175 m, limit 150 N m (typical) holds 857 N; frame 3 kg x1.1 scale = 3.99 kg, strength per kg x0.909; part 1 ends with plain text "Part 1 results".
- Challenge part 2 (`ch02-challenge-2`, own file): max split pins for 1/1000 chance is k = 2 (D = 6; 8/7776 = 1/972 fails), k = 0 (D = 4, 1/1024); helmet head 5 kg at 7.61 m/s, bare stop 0.002 s gives 19025 N, foam 0.02 m gives 7239 N, 4000 N limit needs 0.0362 m, 4 cm gives 3619 N; final-check fails on gear ratio 2.5 (pull 62.8 N); ends with plain text summary of the specification.
