// The trail map: levels (chapters) with their lessons as a winding path.

import { h } from './dom.js';
import { mdInline } from './render.js';
import { icons, KIND_LABEL } from './icons.js';
import { getCourse } from './content.js';
import { at } from './course.js';
import { progress } from './progress.js';
import { recapCards } from './recap.js';
import { themeButton } from './theme.js';
import { cloudConfigured, preloadCloud, onCloudChange, signIn } from './cloud.js';

const OFFSETS = [0, 52, 78, 52, 0, -52, -78, -52];

export async function renderTrail(root) {
  const course = await getCourse();
  const due = progress.dueKeys().length;
  const dueSet = new Set(progress.dueKeys());
  const streak = progress.streak();
  const allIds = course.levels.flatMap(l => (l.lessons ?? []).map(m => m.id));
  const acc = progress.accuracy(allIds);

  // The first built lesson not yet done gets the "start here" marker.
  const nextId = course.levels.flatMap(l => l.lessons ?? []).find(m => m.file && !progress.lesson(m.id)?.done)?.id;

  const top = h('header', { class: 'topbar' },
    h('a', { class: 'academy-link', href: '#/', html: `${icons.back}<span>Gibernoot Academy</span>` }),
    h('h1', { class: 'course-title', 'data-hue': 0 }, ...titleLines(course.title)),
    h('div', { class: 'toolbar' },
      acc != null ? h('span', { class: 'chip acc', tabindex: 0, 'data-tip': 'Average first-try accuracy over the lessons you finished', html: `${icons.target}<span>${pct(acc)}</span>` }) : null,
      h('span', { class: 'chip streak', tabindex: 0, 'data-tip': 'Days in a row you studied', html: `${icons.flame}<span>${streak}</span>` }),
      h('button', {
        class: `chip review${due ? ' due' : ''}`, type: 'button', 'data-hue': 0, 'data-tip': 'Spaced-repetition review',
        html: `${icons.review}<span>${due ? `Review ${due}` : 'Review'}</span>`, onclick: () => { location.hash = at('review'); },
      }),
      recapChip(),
      accountChip(),
      themeButton(h),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Progress & settings', 'data-tip': 'Settings & account', html: icons.settings, onclick: () => { location.hash = '#/settings'; } })));

  // Exam levels carry their own hue, so inserting one never recolours the chapters after it.
  const hueOf = new Map(course.levels.filter(l => l.hue == null).map((l, n) => [l.id, n % 6]));
  const levels = course.levels.map((level) => {
    const lessons = level.lessons ?? [];
    const counted = lessons.filter(m => m.kind !== 'review');
    const done = counted.filter(m => m.file && progress.lesson(m.id)?.done).length;
    const unwritten = level.status === 'unwritten';
    const levelAcc = progress.accuracy(counted.map(m => m.id));
    const deck = progress.deckKeys(lessons.map(m => m.id));
    const levelDue = deck.filter(k => dueSet.has(k)).length;

    const head = h('div', { class: 'level-head' },
      h('div', { class: 'eyebrow' }, `${level.eyebrow ?? `Level ${level.number}`}${unwritten ? ' · not in the book yet' : ''}`),
      h('h2', {}, level.title),
      level.blurb ? h('p', { html: mdInline(level.blurb) }) : null,
      counted.length ? h('div', { class: 'meter', title: `${done}/${counted.length} lessons done` },
        h('div', { style: `width:${(done / counted.length) * 100}%` })) : null,
      counted.length ? h('div', { class: 'meta' },
        h('span', {}, `${done}/${counted.length} lessons`),
        levelAcc != null ? h('span', { class: 'acc', title: 'Average first-try accuracy in this level' }, `${pct(levelAcc)} accuracy`) : null) : null);

    const path = h('div', { class: 'path' }, lessons.map((meta, k) => {
      const rec = progress.lesson(meta.id);
      const isReview = meta.kind === 'review';
      const state = isReview ? (deck.length ? 'available' : 'planned')
        : !meta.file ? 'planned' : rec?.done ? 'done' : 'available';
      const isNext = meta.id === nextId;
      const special = SPECIAL.includes(meta.kind);
      const node = h('button', {
        class: `node ${state}${special ? ' special' : ''}${isNext ? ' next' : ''}`, type: 'button', 'aria-label': meta.title,
        html: (state === 'done' ? icons.check : state === 'planned' && !special ? icons.planned : ICON[meta.kind] ?? icons.concept)
          + (isReview && levelDue ? `<span class="badge">${levelDue}</span>` : ''),
        onclick: () => openSheet(meta, state, { level, deck: deck.length, due: levelDue }),
      });
      return h('div', { class: `node-wrap${isNext ? ' has-bubble' : ''}`, style: `transform: translateX(${OFFSETS[k % OFFSETS.length]}px)` },
        isNext ? h('div', { class: 'start-bubble' }, rec ? 'CONTINUE' : 'START') : null,
        node,
        h('div', { class: `node-label${state === 'planned' ? ' planned' : ''}`, html: mdInline(meta.title) }));
    }));

    return h('section', { class: `level${unwritten ? ' unwritten' : ''}`, id: level.id, 'data-hue': level.hue ?? hueOf.get(level.id) }, head, lessons.length ? path : null);
  });

  root.replaceChildren(h('div', { class: 'trail' }, top, levels));
  if (nextId) {
    const el = root.querySelector('.node.next');
    el?.scrollIntoView({ block: 'center' });
  }
  followLevelHue([...root.querySelectorAll('.course-title, .chip.review, .chip.recap')], [...root.querySelectorAll('section.level')]);
}

// The course title and the review chip take the hue of the level on screen:
// the one crossing a line a third of the way down the area below the sticky top bar.
function followLevelHue(targets, sections) {
  const [title] = targets;
  let queued = false;
  const update = () => {
    queued = false;
    if (!title.isConnected) return removeEventListener('scroll', onScroll);
    const bar = title.parentElement.getBoundingClientRect().bottom;
    const line = bar + (innerHeight - bar) / 3;
    const cur = sections.findLast(s => s.getBoundingClientRect().top <= line) ?? sections[0];
    if (cur) for (const el of targets) if (el.dataset.hue !== cur.dataset.hue) el.dataset.hue = cur.dataset.hue;
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  update();
}

const SPECIAL = ['map', 'review', 'challenge', 'exam'];
const ICON = { ...icons, map: icons.map, review: icons.levelReview, challenge: icons.challenge, exam: icons.exam };
const pct = x => `${Math.round(x * 100)}%`;

function openSheet(meta, state, { level, deck, due }) {
  const close = () => scrim.remove();
  const rec = progress.lesson(meta.id);
  const kind = KIND_LABEL[meta.kind] ?? 'Lesson';
  let body, actions;
  if (meta.kind === 'review') {
    body = h('p', {}, deck
      ? `Practice only the questions from ${level.title}: ${due ? `${due} due now, ` : ''}${deck.length} in this level's deck. Due and weak ones come first.`
      : `Questions you answer in this level's lessons collect here, so you can practice just ${level.title}. Play a lesson first.`);
    actions = [h('button', { class: 'btn ghost', type: 'button', onclick: close }, 'Close')];
    if (deck) actions.push(h('button', { class: 'btn primary', type: 'button', onclick: () => { close(); location.hash = at(`review/${level.id}`); } }, 'Start review'));
  } else if (state === 'planned') {
    body = h('p', {}, 'Not built yet. Ask Claude to build this lesson from the course sources.');
    actions = [h('button', { class: 'btn ghost', type: 'button', onclick: close }, 'Close')];
  } else {
    body = h('p', { html: mdInline(meta.summary ?? '') + (rec ? `<br><b>Best first-try score: ${Math.round(rec.best * 100)}%</b>` : '') });
    const part = progress.partial(meta.id);
    const go = (path) => () => { close(); location.hash = path; };
    actions = [
      h('button', { class: 'btn ghost', type: 'button', onclick: close }, 'Close'),
      rec ? h('button', { class: 'btn ghost', type: 'button', onclick: go(at(`read/${meta.id}`)) }, 'Read through') : null,
      h('button', { class: `btn ${part ? 'ghost' : 'primary'}`, type: 'button', onclick: go(at(`lesson/${meta.id}`)) }, part ? 'Start over' : rec ? 'Replay' : 'Start'),
      part ? h('button', { class: 'btn primary', type: 'button', onclick: go(at(`lesson/${meta.id}/${part.at + 1}`)) }, `Continue (card ${part.at + 1}${part.n ? `/${part.n}` : ''})`) : null,
    ].filter(Boolean);
  }
  const scrim = h('div', { class: 'scrim', onclick: e => { if (e.target === scrim) close(); } },
    h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'kind' }, kind),
      h('h3', { html: mdInline(meta.title) }),
      body,
      h('div', { class: 'actions' }, actions)));
  document.body.append(scrim);
  scrim.querySelector('.btn.primary')?.focus();
  if (meta.kind === 'review') recapCards(level.id).then(list => {
    if (!list.length || !scrim.isConnected) return;
    const n = list.reduce((s, c) => s + c.due.length, 0);
    const recap = h('button', {
      class: `btn ${deck ? 'ghost' : 'primary'}`, type: 'button', 'data-tip': 'Recall the key results of this level’s lesson summaries',
      onclick: () => { close(); location.hash = at(`recap/${level.id}`); },
    }, n ? `Recap ${n}` : 'Recap');
    const start = scrim.querySelector('.actions .btn.primary');
    if (start) start.before(recap); else scrim.querySelector('.actions').append(recap);
  }).catch(() => {});
}

// Recap button: its count (blanks new or due in finished lessons' summaries)
// needs the lesson files, so it fills in once they have loaded.
function recapChip() {
  const label = h('span', {}, 'Recap');
  const chip = h('button', {
    class: 'chip recap', type: 'button', 'data-hue': 0, 'data-tip': 'Recall the key results of the lessons you finished',
    onclick: () => { location.hash = at('recap'); },
  });
  chip.innerHTML = icons.recap;
  chip.append(label);
  recapCards().then(list => {
    const n = list.reduce((s, c) => s + c.due.length, 0);
    if (n) { chip.classList.add('due'); label.textContent = `Recap ${n}`; }
  }).catch(() => {});
  return chip;
}

// "From A to B": break before the last " to " so the title sits on two lines.
function titleLines(title) {
  const i = title.lastIndexOf(' to ');
  return i < 0 ? [title] : [title.slice(0, i), h('br'), title.slice(i + 1)];
}

// Sign-in button that turns into the account avatar once signed in.
export function accountChip() {
  if (!cloudConfigured) return null;
  preloadCloud();
  const btn = h('button', { class: 'chip account', type: 'button' });
  const off = onCloudChange(st => {
    if (!btn.isConnected && btn.childNodes.length) return off();
    if (st.user) {
      btn.replaceChildren(st.user.photo
        ? h('img', { src: st.user.photo, alt: '', referrerpolicy: 'no-referrer' })
        : h('span', { html: icons.user }));
      btn.append(h('span', {}, (st.user.name ?? st.user.email ?? 'Account').split(' ')[0]));
      btn.dataset.tip = `Signed in as ${st.user.email ?? st.user.name} · tap for account`;
      btn.onclick = () => { location.hash = '#/settings'; };
    } else {
      btn.replaceChildren(h('span', { html: icons.user }), h('span', {}, 'Log in'));
      btn.dataset.tip = 'Sign in with Google to sync progress';
      btn.onclick = () => signIn().catch(err => alert(`Sign-in failed: ${err.message}`));
    }
  });
  return btn;
}
