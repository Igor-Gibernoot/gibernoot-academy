// Plays a sequence of cards (a lesson, or a review session).
//
// items: [{ card, key, course }]  — key = "<lessonId>/<cardId>" for question cards;
//        course (optional) = the card's course, for sessions that mix courses
// mode:  'lesson' | 'review'

import { h } from './dom.js';
import { md } from './render.js';
import { icons } from './icons.js';
import { renderCard } from './cards.js';
import { isQuestion } from './content.js';
import { progress } from './progress.js';
import { setCourse } from './course.js';
import { sounds, soundOn, setSound } from './sound.js';
import { themeButton } from './theme.js';

export function runSession(root, { items, mode, startAt = 0, readOnly = false, resume, onProgress, onFinish, onExit }) {
  const stats = { questions: 0, firstTry: 0, ...resume?.stats };
  const requeued = new Set();
  // item index -> { firstTry, head }; set once solved or revealed; revisits (Back) show the answer
  const answered = new Map(Object.entries(resume?.answered ?? {}).map(([k, v]) => [+k, v]));
  let i = startAt;
  let combo = resume?.combo ?? 0; // first-try correct answers in a row
  let footButtons = [];

  const fill = h('div');
  const counter = h('span', { class: 'hint-line', style: 'margin:0;min-width:44px;text-align:right' });
  const stage = h('div', { class: 'stage' });
  const main = h('main', { class: 'player-main' }, stage);
  const foot = h('div', { class: 'foot-inner' });
  const closeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Exit', html: icons.close, onclick: exit });
  const soundBtn = h('button', { class: 'icon-btn', type: 'button', onclick: toggleSound });
  paintSoundBtn();

  root.replaceChildren(h('div', { class: 'player' },
    h('header', { class: 'player-top' }, closeBtn, h('div', { class: 'bar' }, fill), counter, soundBtn, themeButton(h)),
    main,
    h('footer', { class: 'player-foot' }, foot)));

  function paintSoundBtn() {
    const on = soundOn();
    soundBtn.innerHTML = on ? icons.soundOn : icons.soundOff;
    soundBtn.setAttribute('aria-label', on ? 'Mute sounds' : 'Turn sounds on');
    soundBtn.dataset.tip = on ? 'Sounds on' : 'Sounds off';
  }
  function toggleSound() { setSound(!soundOn()); paintSoundBtn(); }

  let controller = null;
  function onKey(e) {
    if (e.key === 'Escape') return exit();
    if (e.key === 'Enter' && !e.shiftKey) {
      const primary = footButtons.find(b => b.classList.contains('primary') || b.classList.contains('good'));
      if (primary && !primary.disabled) { e.preventDefault(); primary.click(); }
      return;
    }
    if (/^[1-9]$/.test(e.key) && controller?.select && document.activeElement?.tagName !== 'INPUT') controller.select(+e.key - 1);
  }
  document.addEventListener('keydown', onKey);
  const cleanup = () => document.removeEventListener('keydown', onKey);

  function exit() {
    if (!readOnly && i > 0 && i < items.length && !confirm(mode === 'lesson' ? 'Leave now? You can continue from this card later.' : 'Leave now? Progress inside this session is not saved.')) return;
    cleanup();
    onExit();
  }

  // The Back button sits on the left of the footer on every card but the first.
  function setFoot(buttons) {
    const back = i > 0
      ? h('button', { class: 'btn ghost back', type: 'button', 'aria-label': 'Previous card', html: icons.back, onclick: prev })
      : null;
    footButtons = buttons;
    foot.replaceChildren(...[back, ...buttons].filter(Boolean));
  }
  const btn = (label, cls, onclick, disabled = false) =>
    h('button', { class: `btn ${cls}`, type: 'button', onclick, disabled }, label);

  function feedbackBox(kind, head, body) {
    return h('div', { class: `feedback ${kind}` },
      h('div', { class: 'fb-head', html: (kind === 'good' ? icons.check : kind === 'bad' ? icons.cross : '') + `<span>${head}</span>` }),
      body ? h('div', { class: 'prose', html: md(body) }) : null);
  }
  function showFeedback(box) {
    stage.querySelector('.feedback')?.remove();
    stage.append(box);
    requestAnimationFrame(() => box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  function record(item, firstTry) {
    stats.questions++;
    if (firstTry) stats.firstTry++;
    if (!item.key) return;
    if (mode === 'review') {
      progress.recordReview(item.key, firstTry);
      if (!firstTry && !requeued.has(item.key)) { requeued.add(item.key); items.push(item); }
    } else {
      progress.recordLessonCard(item.key, firstTry);
    }
  }

  function next() {
    i++;
    if (i >= items.length) { cleanup(); onFinish(stats); return; }
    show();
  }
  function prev() {
    if (i === 0) return;
    i--;
    show();
  }

  function show() {
    const item = items[i];
    // A mixed session (Today) carries each card's course: images and records follow it.
    if (item.course) setCourse(item.course);
    if (!readOnly) onProgress?.(i, items.length, { stats: { ...stats }, combo, answered: Object.fromEntries(answered) });
    fill.style.width = `${((i + 1) / items.length) * 100}%`;
    counter.textContent = `${i + 1}/${items.length}`;
    stage.replaceChildren();
    stage.classList.remove('stage'); void stage.offsetWidth; stage.classList.add('stage');
    window.scrollTo({ top: 0 });

    if (item.card.tag) stage.append(h('div', { class: 'card-tag' }, item.card.tag));
    controller = renderCard(item.card, stage);
    const last = i === items.length - 1;
    const continueBtn = () => btn(last ? 'Finish' : 'Continue', 'primary', next);

    if (controller.kind === 'info') {
      setFoot([continueBtn()]);
      return;
    }

    const ctl = controller;
    const explanation = item.card.explanation;

    // Revisiting a question already answered in this session: show the answer.
    const before = readOnly ? { firstTry: false } : answered.get(i);
    if (before) {
      ctl.reveal();
      showFeedback(before.head
        ? feedbackBox('good', before.head, explanation ?? '')
        : feedbackBox(readOnly ? 'good' : 'neutral', 'Answer', explanation ?? ''));
      setFoot([continueBtn()]);
      return;
    }

    let attempts = 0;

    function askCheck() {
      const check = btn('Check', 'primary', doCheck, !ctl.ready());
      setFoot([check]);
      ctl.onChange(() => { check.disabled = !ctl.ready(); });
    }

    function doCheck() {
      attempts++;
      const r = ctl.check();
      if (r.correct) {
        sounds.correct();
        if (attempts === 1) { record(item, true); combo++; }
        const head = praise(attempts, combo);
        answered.set(i, { firstTry: attempts === 1, head });
        const body = [r.feedback, explanation].filter(Boolean).join('\n\n');
        showFeedback(feedbackBox('good', head, body));
        setFoot([continueBtn()]);
      } else {
        sounds.wrong();
        if (attempts === 1) { record(item, false); combo = 0; }
        showFeedback(feedbackBox('bad', pick(attempts === 1 ? NOT_YET : NOT_YET_AGAIN), r.feedback));
        setFoot([
          btn('Show answer', 'ghost', () => {
            ctl.reveal();
            answered.set(i, { firstTry: false });
            showFeedback(feedbackBox('neutral', 'Answer', explanation ?? ''));
            setFoot([continueBtn()]);
          }),
          btn('Try again', 'primary', () => {
            stage.querySelector('.feedback')?.remove();
            ctl.retry();
            askCheck();
          }),
        ]);
      }
    }
    askCheck();
  }

  show();
}

// Encouragement in the feedback header.
const PRAISE = ['Correct!', 'Exactly.', 'Nice work!', 'Yes!', 'Spot on.', 'You nailed it.', 'Great thinking!'];
const RETRY_PRAISE = ['Got it this time!', 'There you go!', 'Nice recovery!', 'Yes! Fixing a mistake is how it sticks.'];
const NOT_YET = ['Not quite.', 'Not yet.', 'Good try, but no.', 'Almost everyone trips here.'];
const NOT_YET_AGAIN = ['Still not it. Keep going.', 'Not yet. Read the hint and try once more.', 'Hang in there. Read why below.'];
const STREAK = { 3: 'Three in a row!', 5: 'Five in a row! You\'re on fire.', 10: 'Ten in a row! Outstanding.' };
const pick = a => a[Math.floor(Math.random() * a.length)];

function praise(attempts, combo) {
  if (attempts > 1) return pick(RETRY_PRAISE);
  return STREAK[combo] ?? (combo > 10 && combo % 5 === 0 ? `${combo} in a row!` : pick(PRAISE));
}

export function lessonItems(lessonId, data) {
  return data.cards.map(card => ({ card, key: isQuestion(card) && card.review !== false ? `${lessonId}/${card.id}` : null }));
}
