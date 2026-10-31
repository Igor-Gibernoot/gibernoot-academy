# Images in lessons

A picture earns its place when it makes a person, a scenario or a real object
concrete. It never replaces a widget or a derivation, and never decorates.

## When to add one

- **Introducing a person** (scientist, philosopher, thinker): a portrait, once,
  at the card where they are first named with their idea.
- **A scenario or experiment** described in words: a photo or period drawing of
  the apparatus, the pattern it produced, the place.
- **A real object or data image**: telescope, CMB map, manuscript page, specimen.
- **Own schematic (SVG)** when no free picture shows the setup; a figure that
  could be a widget is a widget, not an image.

Not: stock illustrations, mood images, a picture of a formula, anything that
gives away the answer of a question on the same card, copyrighted figures from
books or papers, anything from `sources/`.

## Limits

- **At most 4 per lesson** (the intro level, Level 1 and its preview lessons, up
  to 8). Concept lessons and guided problems usually need 0 to 2. Traps,
  intuition, maps and exams rarely any (an exam figure only if the original has one).
- `validate` warns above the limit. When in doubt, leave it out.
- A person gets one portrait in the course; later mentions do not repeat it.
- Prefer a portrait that is actually documented as the person. If the only
  portrait is disputed or a later idealisation (e.g. Bayes), skip it or say so in the caption.

## Card format (any card type, including questions: review shows it too)

```yaml
- type: text
  id: godel-intro
  title: A logician's shock
  image:                              # one object, or a list of them
    src: img/godel.webp               # relative to courses/<id>/
    alt: Portrait photograph of Kurt Gödel in middle age     # what it shows (screen readers); required
    caption: Kurt Gödel (1906–1978) showed in 1931 that no consistent system of axioms can prove every arithmetic truth.
    credit: Unknown author, Public domain, via Wikimedia Commons   # required
    link: https://commons.wikimedia.org/wiki/File:Kurt_gödel.jpg    # source page; required unless our own
    place: top                        # optional: top (default, under the title) | bottom (after a text body)
    mat: false                        # optional: true gives a transparent diagram a white backing (dark theme)
  body: |
    …
```

- **Caption**: one sentence (two at most), self-contained, that **teaches
  something the card text does not**: who or what, when, why it matters, what to
  look at. Markdown and `$math$` allowed. Never "see the figure", never the
  answer to a question on the card. Names with years for people; the date and
  place for an experiment.
- **Credit**: `<author>, <license>, via Wikimedia Commons` (the fetch tool writes
  it; shorten very long author strings). Own drawings: `Gibernoot Academy`
  (no `link`). A tap on the picture enlarges it.
- **Alt**: 8 or more characters; describe the picture, not the lesson.
- Self-contained rules as for any card: no "the book", no "previous card".
- Where a question card carries an image, the prompt must still make sense in
  review, where the card is shown alone: the image comes with it, so the prompt may refer to
  "the picture" only if the caption/alt also make it clear.

## Getting a free image

Only **free licenses**: public domain, CC0, CC BY, CC BY-SA (also GFDL). Never
NC / ND / fair use / "all rights reserved". Wikimedia Commons is the source
(NASA/ESA/NIH imagery is on Commons as well). The tool refuses anything else.

```sh
node tools/fetch-image.mjs search "Kurt Gödel portrait"      # candidates: license, size, description
node tools/fetch-image.mjs get <course> "File:Kurt gödel.jpg" godel [--width 900]
```

`get` downloads, resizes to at most 900 px wide WebP (~50–150 KB), saves
`courses/<course>/img/<name>.webp`, appends the author, license, source page and
date to `courses/<course>/img/credits.yaml` (the audit ledger; never edit by
hand except to add own drawings), and prints the `image:` block to paste. Edit
alt and caption (they start as TODO; validate does not catch "TODO" in the
text, so check). Pick wide pictures (landscape or square) for phones; check the
license text: CC BY and CC BY-SA need exactly the author and license in the credit.

Search several queries (names in the original language help, "portrait", "photograph", "1887"). Open
the file's Commons page (the `link`) when unsure who the person in a picture is:
the file description must name them. If no suitable free image exists, **skip
it**. Never leave a placeholder, never hotlink, never use a non-free image "for now".

## Own drawings (SVG)

Hand-written SVG in `courses/<id>/img/<name>.svg`, with `mat: true` (it must read on a
light backing in either theme), `viewBox` set, text at least 14 px at phone
width, colours from the fixed hues (basis purple, vectors blue, covectors orange).
Add its ledger entry by hand:

```yaml
name.svg:
  source: "Gibernoot Academy"
  author: "Gibernoot Academy"
  license: "own work"
```

## Checks

`node tools/validate.mjs <id>`: file exists and is under 400 KB (warns over 200), alt, caption, credit,
link, ledger entry, count per lesson. `node tools/shots.mjs …` flags broken images
and saves a screenshot of every image card: **look at the first image card of a session**
(crop, caption length, credit wrapping on a phone), not every one.

## Retrofitting an existing lesson

Read the lesson's cards and list candidates (people introduced, experiments
described, real objects) with the card id each would go on. Keep only those
that pass "When to add one". Fetch, add the `image:` block to that card with
a small `Edit`, validate, shots. Do not change any other text. Log the count in the course's `STATUS.log.md`.
