# Course `how-the-world-works`: How the World Works

Igor's course on the physics and engineering of everyday technology. **There is no main
book**: the course's own spine is `course.yaml` (14 levels, easy to advanced) and the
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
supply them: formulas and constants are checked by (1) deriving them in the lesson,
(2) a script for every number, and (3) a cross-check against the level's references when a
formula is not derived (use `WebSearch`/`WebFetch` for a standard value if needed). Log what
was checked in the `Verified` line of `STATUS.md` (compact: formula or constant, reference).
If Igor later adds a book to `sources/` (git-ignored), follow the root workflow for it.

## Trail

`course.yaml`: 14 levels in four stages: classical world (1-7: forces, heat, fluids,
electricity, waves, matter), signals (8-9: radio, information), computing (10-12: chips,
networks and cryptography, large software), frontier (13-14: space, quantum and nano).
Exams: `exam-partial` after Level 7 (covers Levels 2-7), `exam-final` after Level 14
(covers Levels 8-14). Both original. Status: `STATUS.md`. Build Levels 1 to 3 first.

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
