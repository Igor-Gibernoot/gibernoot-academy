// Exam mode (kind: exam lessons): a timed run with no feedback, a submit
// slide, a results screen and a review of every answer.
//
//   intro -> run (timer bar, answers kept, Back allowed) -> submit slide
//         -> results (score, Exit) -> review (your answer vs the correct one)
//
// Lesson file fields: `minutes` (time limit), `rules` (Markdown, intro
// screen), `debrief` (Markdown, shown on the results screen), and per
// question card an optional `points` (the score is out of their sum).

import { h } from './dom.js';
import { md } from './render.js';
import { icons } from './icons.js';
import { renderCard } from './cards.js';
import { isQuestion } from './content.js';
import { progress } from './progress.js';
import { sounds } from './sound.js';
import { themeButton } from './theme.js';

const fmtPts = x => `${Math.round(x * 100) / 100}`;
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function runExam(root, { id, title, data, onExit, onFinish }) {
  const cards = data.cards;
  const qIdx = cards.map((c, i) => (isQuestion(c) ? i : -1)).filter(i => i >= 0);
  const totalPts = qIdx.reduce((s, i) => s + (cards[i].points ?? 0), 0);
  const limit = (data.minutes ?? 60) * 60; // seconds
  const views = new Map(); // card index -> { el, ctl }
  const results = new Map(); // question index -> { answered, correct, pts }
  let i = 0;
  let timerId = null;
  let deadline = 0;
  let startedAt = 0;
  let submitted = false;
  let keyHandler = null;

  const setKeys = fn => {
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = fn;
    if (fn) document.addEventListener('keydown', fn);
  };
  const stop = () => { clearInterval(timerId); setKeys(null); };
  const leave = () => { stop(); onExit(); };

  function view(k) {
    if (!views.has(k)) {
      const card = cards[k];
      const el = h('div', { class: 'stage' });
      const label = [card.tag, card.points ? `${fmtPts(card.points)} pt` : null].filter(Boolean).join(' · ');
      if (label) el.append(h('div', { class: 'card-tag' }, label));
      views.set(k, { el, ctl: renderCard(card, el) });
    }
    return views.get(k);
  }

  // ---------- shell shared by the screens that keep the player frame ----------
  function frame({ top, body, foot, onKey }) {
    root.replaceChildren(h('div', { class: 'player exam' },
      h('header', { class: 'player-top' }, ...top),
      h('main', { class: 'player-main' }, body),
      h('footer', { class: 'player-foot' }, h('div', { class: 'foot-inner' }, ...foot))));
    window.scrollTo({ top: 0 });
    setKeys(onKey ?? null);
  }
  const btn = (label, cls, onclick, disabled = false) => h('button', { class: `btn ${cls}`, type: 'button', onclick, disabled }, label);
  const closeBtn = onclick => h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Exit', html: icons.close, onclick });
  const enterKey = fn => e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); fn(); } };

  // ---------- intro ----------
  function intro() {
    const nQ = qIdx.length;
    frame({
      top: [closeBtn(leave), h('div', { class: 'exam-title' }, title), themeButton(h)],
      body: h('div', { class: 'stage' },
        h('div', { class: 'card-tag' }, 'Exam'),
        h('div', { class: 'exam-facts' },
          h('div', { class: 'stat' }, h('b', {}, `${data.minutes ?? 60}`), h('span', {}, 'minutes')),
          h('div', { class: 'stat' }, h('b', {}, `${nQ}`), h('span', {}, 'questions')),
          totalPts ? h('div', { class: 'stat' }, h('b', {}, fmtPts(totalPts)), h('span', {}, 'points')) : null),
        h('div', { class: 'prose', html: md(data.rules ?? '') })),
      foot: [btn('Start the exam', 'primary', start)],
      onKey: enterKey(start),
    });
  }

  // ---------- run ----------
  const fill = h('div');
  const bar = h('div', { class: 'bar timer' }, fill);
  const clock = h('span', { class: 'exam-clock' });
  const counter = h('span', { class: 'hint-line', style: 'margin:0;min-width:44px;text-align:right' });

  function start() {
    startedAt = Date.now();
    deadline = startedAt + limit * 1000;
    tick();
    timerId = setInterval(tick, 250);
    show(0);
  }

  function tick() {
    const left = Math.max(0, (deadline - Date.now()) / 1000);
    fill.style.width = `${(left / limit) * 100}%`;
    bar.classList.toggle('low', left <= Math.min(300, limit * 0.1));
    clock.textContent = fmtTime(Math.ceil(left));
    if (left <= 0 && !submitted) submit(true);
  }

  function runTop() {
    return [closeBtn(() => { if (confirm('Leave the exam? Your answers will be lost.')) leave(); }), bar, clock, counter, themeButton(h)];
  }

  function show(k) {
    i = k;
    if (i >= cards.length) return submitSlide();
    const v = view(i);
    counter.textContent = `${i + 1}/${cards.length}`;
    const last = i === cards.length - 1;
    const go = () => show(i + 1);
    frame({
      top: runTop(),
      body: v.el,
      foot: [
        i > 0 ? h('button', { class: 'btn ghost back', type: 'button', 'aria-label': 'Previous card', html: icons.back, onclick: () => show(i - 1) }) : null,
        btn(last ? 'Review & submit' : 'Next', 'primary', go),
      ].filter(Boolean),
      onKey: e => {
        if (e.key === 'Enter' && !e.shiftKey && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); go(); }
        else if (/^[1-9]$/.test(e.key) && v.ctl.select && document.activeElement?.tagName !== 'INPUT') v.ctl.select(+e.key - 1);
      },
    });
  }

  // ---------- submit slide ----------
  const isAnswered = k => !!views.get(k)?.ctl.ready?.();

  function submitSlide() {
    i = cards.length;
    counter.textContent = '';
    const unanswered = qIdx.filter(k => !isAnswered(k));
    const grid = h('div', { class: 'q-grid' }, qIdx.map((k, n) => h('button', {
      class: `q-chip${isAnswered(k) ? ' done' : ''}`, type: 'button', 'aria-label': `Question card ${k + 1}`,
      onclick: () => show(k),
    }, `${n + 1}`)));
    const doSubmit = () => {
      if (unanswered.length && !confirm(`${unanswered.length} question${unanswered.length > 1 ? 's are' : ' is'} unanswered and will count as wrong. Submit anyway?`)) return;
      submit(false);
    };
    frame({
      top: runTop(),
      body: h('div', { class: 'stage' },
        h('div', { class: 'prose' }, h('h2', {}, 'Ready to submit?')),
        h('p', { class: 'hint-line', style: 'margin:0 0 14px' },
          unanswered.length
            ? `${qIdx.length - unanswered.length} of ${qIdx.length} questions answered. Tap a number to go back to it; empty ones are outlined.`
            : `All ${qIdx.length} questions answered. Tap a number to go back and change one.`),
        grid,
        h('p', { class: 'hint-line' }, 'After you submit, you cannot change your answers. Correct answers and explanations appear in the review.')),
      foot: [
        h('button', { class: 'btn ghost back', type: 'button', 'aria-label': 'Previous card', html: icons.back, onclick: () => show(cards.length - 1) }),
        btn('Submit exam', 'primary', doSubmit),
      ],
      onKey: enterKey(doSubmit),
    });
  }

  // ---------- grading ----------
  function submit(timeUp) {
    if (submitted) return;
    submitted = true;
    stop();
    const spent = Math.min(limit, (Date.now() - startedAt) / 1000);
    let correctN = 0, score = 0;
    for (const k of qIdx) {
      const card = cards[k];
      const { ctl } = view(k);
      const answered = !!ctl.ready();
      let correct = false, feedback = '';
      if (answered) ({ correct, feedback } = ctl.check());
      else ctl.reveal();
      if (correct) { correctN++; score += card.points ?? 0; }
      results.set(k, { answered, correct, feedback });
      if (card.review !== false) progress.recordLessonCard(`${id}/${card.id}`, correct);
    }
    const stats = { questions: qIdx.length, firstTry: correctN };
    onFinish?.(stats);
    sounds.finish();
    summary = { timeUp, spent, correctN, score };
    resultsScreen();
  }

  // ---------- results ----------
  let summary = null;
  function resultsScreen() {
    const { timeUp, spent, correctN, score } = summary;
    const n = qIdx.length;
    const pct = n ? Math.round((correctN / n) * 100) : 100;
    const blank = qIdx.filter(k => !results.get(k).answered).length;
    setKeys(null);
    root.replaceChildren(h('div', { class: 'page done-screen exam-results' },
      h('div', { class: 'burst', html: icons.check }),
      h('h1', {}, timeUp ? 'Time is up' : 'Exam submitted'),
      h('p', { class: 'hint-line' }, timeUp && blank
        ? `The clock ran out with ${blank} question${blank > 1 ? 's' : ''} unanswered; they count as wrong and are marked in the review.`
        : `You used ${fmtTime(Math.round(spent))} of ${data.minutes ?? 60}:00.`),
      h('div', { class: 'stats' },
        totalPts ? h('div', { class: 'stat' }, h('b', {}, `${fmtPts(score)}/${fmtPts(totalPts)}`), h('span', {}, 'points')) : null,
        h('div', { class: 'stat' }, h('b', {}, `${pct}%`), h('span', {}, `accuracy (${correctN}/${n} correct)`))),
      h('div', { class: 'actions' },
        btn('Review your answers', 'primary', () => review(0)),
        btn('Exit exam', 'ghost', leave)),
      data.debrief ? h('div', { class: 'panel prose exam-debrief', html: md(data.debrief) }) : null));
  }

  // ---------- review ----------
  const notes = new Map();
  function note(k) {
    if (!notes.has(k)) {
      const r = results.get(k);
      const { ctl } = view(k);
      const card = cards[k];
      ctl.showCorrect?.();
      const kind = r.correct ? 'good' : 'bad';
      const head = r.correct ? 'Correct' : r.answered ? 'Incorrect' : 'Not answered';
      const parts = [];
      if (!r.correct) parts.push(`**Correct answer**\n\n${ctl.correctMd?.() ?? ''}`);
      if (r.feedback) parts.push(r.feedback);
      if (card.explanation) parts.push(card.explanation);
      notes.set(k, h('div', { class: `feedback ${kind}` },
        h('div', { class: 'fb-head', html: (r.correct ? icons.check : icons.cross) + `<span>${head}${card.points ? ` · ${r.correct ? fmtPts(card.points) : 0}/${fmtPts(card.points)} pt` : ''}</span>` }),
        parts.length ? h('div', { class: 'prose', html: md(parts.join('\n\n')) }) : null));
    }
    return notes.get(k);
  }

  function review(n) {
    const k = qIdx[n];
    const back = resultsScreen;
    const v = view(k);
    const stage = h('div', {}, v.el, note(k));
    const lastQ = n === qIdx.length - 1;
    frame({
      top: [closeBtn(back), h('div', { class: 'exam-title' }, 'Review'), h('span', { class: 'hint-line', style: 'margin:0' }, `${n + 1}/${qIdx.length}`), themeButton(h)],
      body: stage,
      foot: [
        n > 0 ? h('button', { class: 'btn ghost back', type: 'button', 'aria-label': 'Previous question', html: icons.back, onclick: () => review(n - 1) }) : null,
        lastQ ? btn('Back to results', 'primary', back) : btn('Next', 'primary', () => review(n + 1)),
      ].filter(Boolean),
      onKey: e => { if (e.key === 'Escape') back(); else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); lastQ ? back() : review(n + 1); } },
    });
  }

  intro();
}
