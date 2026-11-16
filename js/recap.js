// Recap: cloze review of the "what you now own" summaries (`own:` on concept
// lessons). A card shows one summary with some {{ }} blanks hidden; the learner
// recalls each one, taps to reveal it and rates "Knew it" / "Missed". Each
// blank is a spaced-repetition item (progress.recordRecap).

import { h, shuffle } from './dom.js';
import { md, mdInline } from './render.js';
import { icons } from './icons.js';
import { allLessons, getLesson, ownParts } from './content.js';
import { progress } from './progress.js';
import { sounds } from './sound.js';
import { themeButton } from './theme.js';

// Recap cards of the finished concept lessons (of one level, if given):
// [{ id, title, own, keys, due }], due = the keys still new or due today.
export async function recapCards(levelId) {
  const entries = (await allLessons()).filter(({ level, meta }) =>
    ['concept', 'intuition'].includes(meta.kind) && meta.file && progress.lesson(meta.id)?.done && (!levelId || level.id === levelId));
  const cards = await Promise.all(entries.map(async ({ meta }) => {
    try {
      const { data } = await getLesson(meta.id);
      if (!data?.own) return null;
      const keys = [...new Set(ownParts(data.own).parts.filter(p => p.key).map(p => `${meta.id}#${p.key}`))];
      return { id: meta.id, title: meta.title, own: data.own, keys, due: keys.filter(progress.recapDue) };
    } catch { return null; } // file missing: skip
  }));
  return cards.filter(Boolean);
}

// Which blanks to hide. First view: a random half (at least 1, and at least one
// left showing when there are 3 or more). Later: the items due, missed ones
// first, then new ones, then the lowest boxes; a card with nothing due (level
// practice) hides its weakest half.
export function pickHidden(keys) {
  const n = keys.length, max = n >= 3 ? n - 1 : n;
  const half = Math.max(1, Math.min(max, Math.round(n / 2)));
  const recs = keys.map(progress.recapItem);
  if (recs.every(r => !r)) return shuffle(keys).slice(0, half);
  const rank = k => {
    const r = progress.recapItem(k);
    return !r ? 1 : !progress.recapDue(k) ? 3 : r.last === 'missed' ? 0 : 2;
  };
  const box = k => progress.recapItem(k)?.box ?? 0;
  const ranked = shuffle(keys).sort((a, b) => rank(a) - rank(b) || box(a) - box(b));
  const due = ranked.filter(k => rank(k) < 3).length;
  return ranked.slice(0, due ? Math.min(due, max) : half);
}

export function runRecap(root, { cards, onFinish, onExit }) {
  const queue = cards.map(c => ({ ...c, hidden: pickHidden(c.keys) }));
  const again = new Set(); // lessons already queued a second time for their missed blanks
  const stats = { questions: 0, firstTry: 0 };
  let i = 0, primary = null;

  const fill = h('div');
  const counter = h('span', { class: 'hint-line', style: 'margin:0;min-width:44px;text-align:right' });
  const stage = h('div', { class: 'stage' });
  const foot = h('div', { class: 'foot-inner' });
  root.replaceChildren(h('div', { class: 'player' },
    h('header', { class: 'player-top' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Exit', html: icons.close, onclick: exit }),
      h('div', { class: 'bar' }, fill), counter, themeButton(h)),
    h('main', { class: 'player-main' }, stage),
    h('footer', { class: 'player-foot' }, foot)));

  function onKey(e) {
    if (e.key === 'Escape') return exit();
    if (e.key === 'Enter' && !e.shiftKey && primary) { e.preventDefault(); primary.click(); }
  }
  document.addEventListener('keydown', onKey);
  // Ratings are saved as they are made, so leaving early loses nothing.
  function exit() { document.removeEventListener('keydown', onKey); onExit(); }

  const btn = (label, cls, onclick) => h('button', { class: `btn ${cls}`, type: 'button', onclick }, label);
  function setFoot(...buttons) {
    foot.replaceChildren(...buttons);
    primary = buttons.find(b => b.classList.contains('primary') || b.classList.contains('good')) ?? null;
  }

  function show() {
    const card = queue[i];
    fill.style.width = `${((i + 1) / queue.length) * 100}%`;
    counter.textContent = `${i + 1}/${queue.length}`;
    stage.classList.remove('stage'); void stage.offsetWidth; stage.classList.add('stage');
    window.scrollTo({ top: 0 });

    // Blanks become placeholders after the Markdown pass, so they can sit anywhere in it.
    const blanks = [];
    const src = ownParts(card.own).parts.map(p => typeof p === 'string' ? p : `@@B${blanks.push(p) - 1}@@`).join('');
    const html = md(src).replace(/@@B(\d+)@@/g, (_, n) => {
      const b = blanks[+n];
      return `<span class="blank${b.blank.includes('$$') ? ' display' : ''}" data-key="${card.id}#${b.key}"><span class="blank-body">${mdInline(b.blank)}</span></span>`;
    });
    const text = h('div', { class: 'prose recap-text', html });
    const els = key => [...text.querySelectorAll('.blank')].filter(el => el.dataset.key === key);

    const hidden = card.hidden;
    const rated = new Map(); // key -> knew
    let active = null;
    for (const el of text.querySelectorAll('.blank')) {
      if (!hidden.includes(el.dataset.key)) continue;
      el.classList.add('hidden');
      const display = el.classList.contains('display');
      el.prepend(h('button', {
        class: 'blank-face', type: 'button', 'aria-label': 'Reveal the hidden expression',
        onclick: () => reveal(el.dataset.key),
      }, display ? 'Tap to reveal' : '?'));
    }

    const count = h('p', { class: 'hint-line recap-count' });
    stage.replaceChildren(
      h('div', { class: 'card-tag' }, 'Recap · what you now own'),
      h('div', { class: 'prose' }, h('h2', { html: mdInline(card.title) })),
      h('p', { class: 'hint-line', style: 'margin:0 0 12px' }, 'Say each hidden expression to yourself, then tap it to check.'),
      text, count);

    function reveal(key) {
      if (active || rated.has(key)) return;
      active = key;
      for (const el of els(key)) { el.classList.remove('hidden'); el.classList.add('active'); el.querySelector('.blank-face')?.remove(); }
      paint();
    }
    function rate(knew) {
      progress.recordRecap(active, knew);
      if (knew) sounds.correct();
      stats.questions++;
      if (knew) stats.firstTry++;
      for (const el of els(active)) { el.classList.remove('active'); el.classList.add(knew ? 'knew' : 'missed'); }
      rated.set(active, knew);
      active = null;
      paint();
    }
    function paint() {
      text.classList.toggle('busy', !!active);
      count.textContent = `${rated.size}/${hidden.length} rated`;
      if (active) {
        count.textContent += ' · did you recall it?';
        return setFoot(btn('Missed', 'ghost', () => rate(false)), btn('Knew it', 'good', () => rate(true)));
      }
      const left = hidden.filter(k => !rated.has(k));
      if (left.length) {
        // Reveal next = the first still hidden in reading order.
        const nextKey = text.querySelector('.blank.hidden')?.dataset.key ?? left[0];
        return setFoot(btn('Reveal next', 'primary', () => reveal(nextKey)));
      }
      const missed = hidden.filter(k => !rated.get(k));
      count.textContent = missed.length
        ? `You knew ${hidden.length - missed.length} of ${hidden.length}. The missed ${missed.length === 1 ? 'one comes' : 'ones come'} back at the end and again soon.`
        : `You knew all ${hidden.length}.`;
      if (missed.length && !again.has(card.id)) { again.add(card.id); queue.push({ ...card, hidden: missed }); counter.textContent = `${i + 1}/${queue.length}`; }
      setFoot(btn(i === queue.length - 1 ? 'Finish' : 'Continue', 'primary', next));
    }
    paint();
  }

  function next() {
    i++;
    if (i >= queue.length) { document.removeEventListener('keydown', onKey); onFinish(stats); return; }
    show();
  }

  show();
}
