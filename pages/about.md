## Manifesto

Deep ideas are not reserved for people who were lucky enough to meet them in the right classroom. Curvature of spacetime, the brain as a prediction machine, the geometry hiding inside probability: anyone curious enough can understand them, if they meet them the right way. Gibernoot Academy is an attempt at that right way, and each course has a pixel guide to walk the trail with you.

```cast
```

We believe a few simple things.

**Curiosity comes before content.** Nobody remembers an answer to a question they never asked. So every lesson starts with a puzzle, and the theory shows up as the way out of it.

**Understanding beats memorising, and recall makes it last.** We derive what can be derived, define every symbol before using it, and say when a result holds and when it fails. Then we ask you for it again, days and weeks later, until it is yours.

**Mistakes are welcome.** A wrong guess made in a low-stakes puzzle is the cheapest and most memorable lesson there is. Every trap in a course exists because real people fall into it.

**Learning should be fun.** Not fun as a sugar coating on top of the hard part, but the fun of figuring something out, of a prediction coming true, of a picture suddenly making sense. Pixel characters, medals and streaks are there to keep the mood light, and the real game is the puzzles themselves.

**Rigour and simplicity are friends.** Plain words and a careful foundation are not opposites. The simplest honest explanation is usually the most rigorous one.

## Why active recall

The usual way of studying is to read, highlight and reread. It feels productive because the material becomes familiar, and familiarity is easy to mistake for knowing. The test comes when you have to produce the idea with the page closed.

Memory research says the act of retrieving is itself what strengthens memory. In a classic experiment (Roediger and Karpicke, 2006), some students read a short text four times, while others read it once and then spent the same time writing down what they could recall. Five minutes later the rereaders were ahead. A week later the picture had flipped, even though the rereaders had felt more confident.

```bars
title: Share of the text recalled
unit: "%"
max: 100
groups:
  - label: Five minutes later
    bars:
      - { label: Read 4 times, value: 83 }
      - { label: "Read once, recall 3 times", value: 71, good: true }
  - label: One week later
    bars:
      - { label: Read 4 times, value: 40 }
      - { label: "Read once, recall 3 times", value: 61, good: true }
note: Roediger and Karpicke (2006), Experiment 2, rounded.
```

This is the *testing effect*, and it has been replicated many times, from vocabulary to medicine to physics.

```image
src: img/ebbinghaus.webp
side: true
alt: Portrait photograph of Hermann Ebbinghaus, a bearded man in a dark suit
caption: "Hermann Ebbinghaus memorised long lists of nonsense syllables and measured how fast he forgot them: the first forgetting curve."
credit: Unknown author, public domain, via Wikimedia Commons
link: https://commons.wikimedia.org/wiki/File:Ebbinghaus2.jpg
```

A second effect multiplies it. Reviews spread over days and weeks beat the same amount of study packed into one evening, an observation that goes back to Hermann Ebbinghaus in the 1880s and to his curve of forgetting. Each review just before you would forget resets the curve and makes it flatter; the [Method page](#/method) has a small model of it to play with.

Active learning helps whole classes too. A large analysis of 225 studies of university science courses (Freeman and colleagues, 2014) found that students in traditional lectures were about one and a half times more likely to fail than students in courses where they worked on problems during class.

```bars
title: Students who failed the course
unit: "%"
max: 40
groups:
  - label: Average over 225 studies
    bars:
      - { label: Traditional lecture, value: 33.8 }
      - { label: Active learning, value: 21.8, good: true }
note: Freeman and colleagues (2014), PNAS.
```

## Compared with traditional study

| | Traditional | Active recall here |
|---|---|---|
| First contact | A definition or a lecture | A puzzle you guess at |
| Your role | Read and follow | Answer, build, predict |
| Mistakes | Found at the exam | Found and explained on the spot |
| Remembering | Reread before the test | Spaced review and recaps, automatically |
| Feedback | Weeks later, as a grade | Immediately, on every card |
| Pace | The class's | Yours, a few cards at a time |

None of this makes learning effortless. Recall is harder than rereading, and that difficulty is the point: it is effort spent where it builds something.

## Who makes it

Gibernoot Academy began as a personal study project of a physics PhD student at the University of São Paulo, built to learn deep subjects properly and to have fun doing it. Each course follows published books and lecture courses, listed in its "About this course" box. The app is free, open source and runs in any browser, on phone or laptop.
