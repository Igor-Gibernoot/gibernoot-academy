## The short version

Every course here is a trail of puzzles. You meet a problem before you have the tools to solve it, you guess, and the lesson builds the tools with you until the puzzle falls apart in your hands. Everything you answer comes back later on a schedule, so it stays in memory. The courses differ in subject, but they all share this structure.

## A course is a trail

A course is a path of **levels**, one per chapter of its main source. Level 1 is a light tour of the whole subject for someone who knows nothing yet: guessing is the point there, every technical word is explained the first time it appears, and each puzzle points to the level where it is solved properly. The levels after that go through the subject in order, and each one is a small set of lessons of different kinds.

```trail
- { kind: concept, label: Concept }
- { kind: guided, label: Guided problem }
- { kind: traps, label: Traps }
- { kind: intuition, label: Intuition }
- { kind: map, label: Content map }
- { kind: levelReview, label: Level review }
- { kind: challenge, label: Challenge }
```

| Lesson | What happens in it |
|---|---|
| Concept | Opens with a question you cannot answer yet, builds the idea step by step, then comes back and answers it. |
| Guided problem | One substantial problem, broken into small questions you answer one at a time. A *guided proof* ends in a general law instead of a single number. |
| Traps | Quick questions, each built on a mistake people really make, with the reason it tempts you and the reason it fails. |
| Intuition | Derives nothing. You rebuild the main formulas from memory, check them with limits and scaling, and apply them to fresh numbers without being told which law to use. |
| Content map | You rebuild the concept map of the chapter, box by box, from a pile that includes decoys. |
| Level review | The questions of this level only, the weakest and the ones due first. |
| Level challenge | Harder problems that combine everything in the level. |

Every few levels there is an **exam**, a level of its own: a timed paper with no hints and no feedback until you submit, graded card by card, with a full review of every answer afterwards. Some exams follow a real professor's exam question for question; the rest are written for the course with fresh numbers and settings.

## Problem first, theory second

Lessons follow **problem-based learning**. Before any definition, you get a concrete puzzle or a prediction to make: guess what happens, then find out why. The theory arrives as the answer to a question you already care about, not as a list of facts to store for later. Each step of a derivation becomes a question ("why is this step allowed?", "build the next line"), so you do the reasoning instead of watching it.

Here is one, as it would appear on its first card. Guess before you think too hard; a wrong pick is fine.

```card
type: mcq
tag: "Try it: a real card"
prompt: |
  From the edge of a table, you drop one ball and, at the same instant, flick a second ball sideways so it flies off fast. Ignore the air. Which one hits the floor first?
options:
  - text: They land at the same time
    correct: true
  - text: The dropped ball
    feedback: |
      The flicked ball travels a longer path, so it feels like it must take longer. But its sideways speed does nothing to its downward motion: gravity pulls only downward, and both balls start with no downward speed at all.
  - text: The flicked ball
    feedback: |
      Being fast sideways feels like being "more energetic", so it should get down sooner. Yet gravity pulls only downward, and the flicked ball's sideways speed adds nothing to how fast it falls.
explanation: |
  Gravity acts only in the vertical direction, and both balls start with zero vertical speed from the same height $h$. Their vertical motions are identical, so both fall for the same time
  $$t = \sqrt{2h/g},$$
  where $g \approx 9.8\ \text{m/s}^2$ is the acceleration of gravity. The sideways motion only decides *where* the second ball lands, not *when*. This is the idea that horizontal and vertical motion are independent, and a lesson would now build it properly.
```

Lessons come in card-sized steps: one idea per card, a question on most cards, immediate feedback. The questions change shape (multiple choice, a number to compute, an equation to assemble from pieces, steps to put in order) so you cannot coast on recognising the right-looking option. Many cards carry an interactive figure you can drag and play with, placed right after the opening puzzle, before the formulas, so the intuition comes first.

## Mistakes are part of the lesson

Every wrong option in a question is a real misconception, and picking it shows you why it is tempting and where it breaks. A wrong answer is information, not a failure. Hints are there when you are stuck, and explanations show the reasoning, not only the arithmetic.

## Active recall and spaced review

Reading something again feels like learning, but pulling it out of memory is what makes it stick. So the academy asks instead of telling:

- **Review.** Every question you answer in a lesson joins the course's review deck. A missed question comes back the same day; one you got right comes back after 1, 3, 7, 16 and then 35 days, each time a little before you would have forgotten it. Questions are written to stand on their own, so they make sense weeks later, out of context.
- **Recap.** Each concept lesson ends with a summary of "what you now own": the main results written out with their formulas, every symbol defined. Later it comes back with the key results blanked out, and you fill them in from memory, on the same spaced schedule.
- **Content maps.** Rebuilding a chapter's map forces you to recall how the ideas connect, not only what each one says.


Why those intervals? Each review comes just as the memory starts to fade, and a memory you had to work a little to retrieve comes back stronger and fades more slowly. Switch review days on and off below, or try cramming.

```widget
name: forgetting-curve
caption: "A toy model, not real data: memory fades exponentially, and each review resets it and slows the next fade, more so when you had begun to forget. Three reviews crammed into the first hours barely help."
config:
  days: 60
  schedule: [1, 3, 7, 16, 35]
  chips: [1, 3, 7, 16, 35]
  presets:
    - { label: "Spaced (the academy)", schedule: [1, 3, 7, 16, 35] }
    - { label: "Cram on day 0", schedule: [0.1, 0.2, 0.3] }
    - { label: "Every day, first week", schedule: [1, 2, 3, 4, 5] }
    - { label: "No review", schedule: [] }
  labels: { withReview: "Your schedule", noReview: "Read once", end: "Day {d}" }
```

A few minutes of review a day keeps whole courses alive in memory, and your streak counts the days in a row you studied.

## Shortcuts and freedom

You do not have to walk every step. If you already know a chapter from somewhere else, **finishing its level challenge marks all the other lessons of that level as done**, and the challenge's menu also has a button to mark the level as known without playing it. Finished lessons can be replayed or *read through* with the answers shown (nothing is recorded), and their summaries are one tap away on the trail. A lesson you leave in the middle can be continued from the card where you stopped.

## Progress and medals

Progress is saved in your browser. Signing in with Google keeps it in your account and syncs it between phone and laptop; without an account, a progress code moves it by hand (Settings). Medals reward the habits that work: streaks, first-try accuracy, finished levels, reviews and recaps.
