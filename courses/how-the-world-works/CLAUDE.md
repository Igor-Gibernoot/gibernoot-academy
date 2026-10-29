# Course `how-the-world-works`: How the World Works

Igor's course on the physics and engineering of everyday technology. **There is no main
book**: the course's own spine is `course.yaml` (19 levels, easy to advanced) and the
reference list is `REFERENCES.md`. Everything in the root `CLAUDE.md` applies; this file
adds what is specific to this course.

## Method (the heart of the course)

- **Each level is a cluster of physical principles. Each lesson takes one machine and uses it
  to teach one principle.** The machine is the hook ("why is the back of a fridge warm?");
  the principle is the payload. A machine may take two lessons if it needs them.
- **Recurring principles are taught once, early, then reused** by name (feedback, resonance,
  impedance, tradeoffs, efficiency). When a later machine reuses one, the lesson recalls it
  in a line ("Recall: ...") and builds on it.
- Three threads run through every level: **energy** (where it comes from and where it goes),
  **signals** (how information is carried) and **tradeoffs** (every design is a compromise).
- **Build from first principles**: derive the law from what the machine must do, then check
  it with a number small enough to do by hand. Real-world numbers (power of a kettle, speed
  of a plane) must be plausible and checked by script.
- **Level challenge = a technology deep dive** (see `course.yaml`): a design problem about one
  technology that uses every concept learned so far (not only the level's), ending with a
  "rebuild it" task with constraints (e.g. "design a thermos that keeps tea hot for 6 hours").
- A level may group machines of different fields if they share a principle (the solar panel is
  in the semiconductor level; the physical key is in Forces and Motion; cryptographic keys
  are in Networks and Cryptography, and their lessons point to each other by name).

## Sources and verification

No `sources/` book. `REFERENCES.md` lists the trusted books per level. Igor does not need to
supply them. Claims are checked by (1) deriving them in the lesson, (2) a script for every
number, and (3) a web check of every external fact (below). A script only proves the arithmetic
agrees with the formula, not that the formula, constant or real-world value is right. Log what
was checked in the `Verified` line of `STATUS.md` (compact: item, `web: <source>`).

**Web check is mandatory, not "from memory".** Every external fact in a lesson is checked with
WebSearch/WebFetch (NIST, Wikipedia for orientation only, Britannica, textbook or manufacturer
pages, journal or museum pages) *in the session that writes the lesson*, before committing.
External facts are: physical constants and material properties (specific heat, density,
friction coefficients, strengths), typical real-world values (car mass, petrol energy density,
battery capacity, efficiencies, speeds, stopping distances, safety figures), how a real
device works (lock, airbag, elevator, shower, ...), and every historical claim, named person,
experiment, date and institution. Not needed: numbers the lesson derives or invents itself
(the setting's data) and their scripted arithmetic.
- "Typical", "standard knowledge" or "memory" never counts as verified. The Verified line says
  `web: <source>` per item; an item without it is marked `UNVERIFIED` and the unit is not done.
- Typical values may be rounded in the lesson, but must lie inside the range the source gives;
  say "about" or "typically".
- A claim about how a real device works is checked for the mechanism, not only a number.
- Attributions are checked for what the person actually did or argued. Quotation marks only for
  text confirmed verbatim; otherwise paraphrase.
- If a search cannot confirm a claim, drop it or soften it; never keep a guess. An agent that
  skips the web check has not finished the unit; report it, don't commit.
- Briefs to agents must repeat this rule. If Igor asked for a specific check, do exactly that.

If Igor later adds a book to `sources/` (git-ignored), follow the root workflow for it.

## Trail

`course.yaml`: 19 levels in five stages (restructured 2026-10-29; only Levels 1-2 had lessons,
so ids of later levels were renumbered freely):
- Classical world (1-7): intro, forces and motion, **structures and materials**, heat, fluids,
  electricity and magnets, **energy sources and the grid** (grid balance, fission, radiation,
  half-life, wind, solar farms and storage).
- Waves, matter, body (8-11): waves/sound/light, **atmosphere, weather and climate**, matter and
  chemistry, **the body as a machine**.
- Signals (12-13): radio, information.
- Computing and society (14-17): chips, networks and cryptography, **chance, choice and trust**
  (noise, polls, voting systems, fairness, electronic voting, blockchain), large software.
- Space and frontier (18-19).

Exams (root rule: none covers over 6 levels): `exam-partial1` after Level 7 (covers 2-7),
`exam-partial2` after Level 13 (covers 8-13), `exam-final` after Level 19 (covers 14-19). All
original. The next unit after Level 7, 13 or 19 is its exam. Status: `STATUS.md`.

Placement notes for the new levels:
- **Resonance** is first taught in Level 3 (`ch03-skyscraper`: natural frequency, tuned mass damper),
  not Level 8. `ch03-flutter` corrects the "Tacoma Narrows was plain resonance" myth (web-check the
  account). Level 8 (strings, pipes) recalls resonance by name.
- **Solar farm** (`ch07-solarfarm`) treats the panel as a black box (capacity, capacity factor,
  storage); the physics of the cell is `ch14-solar`. Say so in the lesson.
- **Voting** is all in Level 16 (`ch16-voting`, `ch16-fairness`, `ch16-evoting`); hashing it needs
  is in Level 15. Polls and noise there support error correction (Level 13) and learning (Level 17).
- **Cooking and kitchen threads:** pressure cooker (Level 4), emulsions (Level 10), induction
  cooktop (Level 6, magnets). Ships (Level 5), roller coasters (Level 2), noise cancelling (Level 8),
  clocks before GPS (Level 18).

## Notation and conventions

SI units everywhere, always written with units in numeric cards. Standard symbols: position
$x$, velocity $v$, acceleration $a$, mass $m$, force $F$, torque $\tau$, energy $E$, work $W$,
power $P$, heat $Q$, temperature $T$ (kelvin in formulas), pressure $p$, density $\rho$,
voltage $V$, current $I$, resistance $R$, frequency $f$, wavelength $\lambda$, speed of light $c$.
Gravity $g = 9.8\ \mathrm{m/s^2}$. Fix any other symbol in `CONVENTIONS.md` when first used.
Use plain numbers and rounded constants in lessons ($c \approx 3\times10^8$ m/s); say when a
figure is a typical value, not an exact one.
Intro level glossary words (gloss at first use): energy, power, force, signal, feedback,
efficiency, tradeoff, order of magnitude, model.
