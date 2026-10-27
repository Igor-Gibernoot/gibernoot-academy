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
- log-ruler: guess ladder `reveal:false`; picture after its question `reveal:true, slider:false, readout:false`; widget cards `review: false`.
