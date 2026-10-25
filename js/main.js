// Router.
//   #/                              academy home: the list of courses
//   #/settings                      progress export/import/reset (all courses)
//   #/<course>                      the course's trail map
//   #/<course>/lesson/<id>          play a lesson
//   #/<course>/lesson/<id>/<n>      jump to card n (1-based) — handy while authoring
//   #/<course>/read/<id>            read a lesson with answers shown, nothing recorded
//   #/<course>/review               spaced-repetition session (due cards, all levels)
//   #/<course>/review/<levelId>     level review (that level's cards, most urgent first)
//   #/<course>/recap                recap of the summaries with blanks due (all levels)
//   #/<course>/recap/<levelId>      level recap (that level's summaries, due first)
// Links from before courses existed (#/lesson/<id>, ...) open in LEGACY_COURSE.

import { h, shuffle, escapeHtml } from './dom.js';
import { icons } from './icons.js';
import { getCatalog, getCourse, getLesson, nextLessonAfter, isQuestion } from './content.js';
import { setCourse, courseId, at, LEGACY_COURSE } from './course.js';
import { renderHome } from './home.js';
import { progress } from './progress.js';
import { renderTrail } from './trail.js';
import { runSession, lessonItems } from './player.js';
import { runExam } from './exam.js';
import { recapCards, runRecap } from './recap.js';
import { sounds, soundOn, setSound } from './sound.js';
import { initTheme, themeButton } from './theme.js';
import { initTooltips } from './tooltip.js';
import { cloudConfigured, initCloud, onCloudChange, signIn, signOutUser, flushCloud } from './cloud.js';

initTheme();
initTooltips();
initCloud();

const root = document.getElementById('app');
const REVIEW_SIZE = 12;
const RECAP_SIZE = 5;

async function route() {
  document.querySelectorAll('.scrim').forEach(s => s.remove());
  let parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  try {
    if (['lesson', 'read', 'review', 'recap'].includes(parts[0])) {
      location.replace(`#/${LEGACY_COURSE}/${parts.join('/')}`);
      return;
    }
    if (parts[0] === 'settings') return settings();
    if (!parts.length) { document.title = 'Gibernoot Academy'; return await renderHome(root); }
    const course = (await getCatalog()).courses.find(c => c.id === parts[0]);
    if (!course) { location.replace('#/'); return; }
    setCourse(course.id);
    document.title = `${course.short ?? course.title} · Gibernoot Academy`;
    parts = parts.slice(1);
    if (parts[0] === 'lesson' && parts[1]) return await playLesson(decodeURIComponent(parts[1]), +(parts[2] ?? 1) - 1);
    if (parts[0] === 'read' && parts[1]) return await playLesson(decodeURIComponent(parts[1]), +(parts[2] ?? 1) - 1, true);
    if (parts[0] === 'review') return await playReview(parts[1]);
    if (parts[0] === 'recap') return await playRecap(parts[1]);
    await renderTrail(root);
  } catch (err) {
    console.error(err);
    root.replaceChildren(h('div', { class: 'page' },
      h('div', { class: 'error-box' }, h('b', {}, 'Something went wrong. '), err.message),
      h('p', {}, h('a', { href: courseId() ? at() : '#/' }, '← Back'))));
  }
}

async function playLesson(id, startAt, readOnly = false) {
  const { meta, data } = await getLesson(id);
  if (!data) { location.hash = at(); return; }
  if (meta.kind === 'exam' && !readOnly) {
    runExam(root, {
      id, title: meta.title, data,
      onExit: () => { location.hash = at(); },
      onFinish: stats => progress.completeLesson(id, stats),
    });
    return;
  }
  const saved = progress.partial(id);
  runSession(root, {
    items: lessonItems(id, data),
    mode: 'lesson',
    readOnly,
    startAt: Math.max(0, Math.min(startAt || 0, data.cards.length - 1)),
    resume: !readOnly && startAt > 0 && saved?.n === data.cards.length ? saved : undefined,
    onProgress: (at, n, extra) => { if (at > 0 || progress.partial(id)) progress.savePartial(id, at, n, extra); },
    onExit: () => { location.hash = at(); },
    onFinish: async stats => {
      if (readOnly) { location.hash = at(); return; }
      progress.completeLesson(id, stats);
      const next = await nextLessonAfter(id);
      doneScreen({
        title: 'Lesson complete',
        subtitle: meta.title,
        stats,
        actions: [
          next ? ['primary', `Next: ${next.meta.title}`, at(`lesson/${next.meta.id}`)] : null,
          ['ghost', 'Back to the trail', at()],
        ],
      });
    },
  });
}

async function playReview(levelId) {
  let keys, level;
  if (levelId) {
    level = (await getCourse()).levels.find(l => l.id === levelId);
    if (!level) { location.hash = at(); return; }
    keys = shuffle(progress.deckKeys((level.lessons ?? []).map(m => m.id)).slice(0, REVIEW_SIZE));
  } else {
    keys = shuffle(progress.dueKeys()).slice(0, REVIEW_SIZE);
  }
  if (!keys.length) return nothingDue('Questions you answer in lessons come back here on a spaced schedule — missed ones the same day, the rest after 1, 3, 7, 16 and 35 days.');
  const items = [];
  for (const key of keys) {
    const [lessonId, cardId] = key.split('/');
    try {
      const { meta, data } = await getLesson(lessonId);
      const card = data?.cards.find(c => c.id === cardId);
      if (card && isQuestion(card)) items.push({ card: { ...card, tag: meta.title }, key });
    } catch { /* lesson renamed or removed: skip */ }
  }
  if (!items.length) return nothingDue('The questions due were renamed or removed from their lessons.');
  runSession(root, {
    items, mode: 'review',
    onExit: () => { location.hash = at(); },
    onFinish: stats => {
      progress.finishReview();
      doneScreen({
        title: level ? `${level.title}: review done` : 'Review done',
        subtitle: 'Spaced repetition keeps it in long-term memory.',
        stats, mode: 'review', actions: [['primary', 'Back to the trail', at()]],
      });
    },
  });
}

async function playRecap(levelId) {
  let level;
  if (levelId) {
    level = (await getCourse()).levels.find(l => l.id === levelId);
    if (!level) { location.hash = at(); return; }
  }
  const all = await recapCards(levelId);
  const due = shuffle(all.filter(c => c.due.length));
  // A level recap tops up with that level's other summaries, for practice.
  const cards = (level ? [...due, ...shuffle(all.filter(c => !c.due.length))] : due).slice(0, RECAP_SIZE);
  if (!cards.length) return nothingDue('The “what you now own” summary of each concept lesson you finish comes back here with its key results hidden, on a spaced schedule — missed ones the same day, the rest after 1, 3, 7, 16 and 35 days.');
  runRecap(root, {
    cards,
    onExit: () => { location.hash = at(); },
    onFinish: stats => {
      progress.finishReview();
      doneScreen({
        title: level ? `${level.title}: recap done` : 'Recap done',
        subtitle: 'Stating the key results from memory is what makes them yours.',
        stats, statLabel: 'of the hidden results recalled', actions: [['primary', 'Back to the trail', at()]],
      });
    },
  });
}

function nothingDue(text) {
  root.replaceChildren(h('div', { class: 'page done-screen' },
    h('div', { class: 'burst', html: icons.check }),
    h('h1', {}, 'Nothing due'),
    h('p', { class: 'hint-line' }, text),
    h('div', { class: 'actions' }, h('a', { class: 'btn primary', href: at(), style: 'text-decoration:none' }, 'Back to the trail'))));
}

function doneScreen({ title, subtitle, stats, actions, mode = 'lesson', statLabel }) {
  const pct = stats.questions ? Math.round((stats.firstTry / stats.questions) * 100) : 100;
  sounds.finish();
  root.replaceChildren(h('div', { class: 'page done-screen' },
    h('div', { class: 'burst', html: icons.check }),
    h('h1', {}, title),
    h('p', { class: 'hint-line', html: escapeHtml(subtitle) }),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', {}, `${pct}%`), h('span', {}, statLabel ?? (mode === 'lesson' ? 'first-try accuracy in this lesson' : 'first-try accuracy in this session'))),
      h('div', { class: 'stat' }, h('b', {}, `${progress.streak()}`), h('span', {}, 'day streak'))),
    h('div', { class: 'actions' }, actions.filter(Boolean).map(([cls, label, href]) =>
      h('a', { class: `btn ${cls}`, href, style: 'text-decoration:none' }, label)))));
}

function accountPanel() {
  const body = h('div');
  const panel = h('div', { class: 'panel' }, h('h3', {}, 'Account & sync'), body);
  if (!cloudConfigured) {
    body.append(h('p', {}, 'Sign-in is not set up for this copy of the app yet, so progress stays in this browser (use the code below to move it).'));
    return panel;
  }
  const msg = h('p', { class: 'hint-line', style: 'margin:8px 0 0' });
  const off = onCloudChange(st => {
    if (!panel.isConnected && body.childNodes.length) return off();
    if (st.user) {
      body.replaceChildren(
        h('p', {}, `Signed in as ${st.user.name ?? st.user.email}${st.user.name ? ` (${st.user.email})` : ''}.`),
        h('p', { class: 'hint-line', style: 'margin:0 0 8px' },
          st.sync === 'syncing' ? 'Syncing…' : st.sync === 'error' ? `Sync problem: ${st.error}` : 'Progress is synced to your account on every change.'),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => signOutUser() }, 'Sign out')));
    } else {
      body.replaceChildren(
        h('p', {}, 'Sign in with Google to keep your progress in your account and share it between your phone and laptop. Progress already in this browser is merged in, never lost.'),
        h('div', { class: 'row' }, h('button', {
          class: 'btn primary', type: 'button',
          onclick: async () => { msg.textContent = ''; try { await signIn(); } catch (err) { msg.textContent = `Sign-in failed: ${err.message}`; } },
        }, 'Sign in with Google')),
        msg);
      if (st.error) msg.textContent = st.error;
    }
  });
  return panel;
}

const BUILD = '2026-10-24.1 (academy: several courses)';

function settings() {
  const code = h('textarea', { readonly: true, 'aria-label': 'Your progress code' });
  code.value = progress.exportCode();
  const paste = h('textarea', { placeholder: 'Paste a progress code here', 'aria-label': 'Progress code to import' });
  const msg = h('p', { style: 'margin-top:8px' });

  root.replaceChildren(h('div', { class: 'page' },
    h('header', { class: 'topbar' },
      h('a', { class: 'icon-btn', href: courseId() ? at() : '#/', 'aria-label': 'Back', html: icons.back }),
      h('div', { class: 'brand' }, 'Progress & settings'),
      themeButton(h)),
    accountPanel(),
    h('div', { class: 'panel' },
      h('h3', {}, 'Move progress by code'),
      h('p', {}, 'Without an account, progress is saved only in this browser. To continue on another device, copy this code here and import it there.'),
      code,
      h('div', { class: 'row' }, h('button', {
        class: 'btn primary', type: 'button',
        onclick: async e => {
          try { await navigator.clipboard.writeText(code.value); e.target.textContent = 'Copied!'; }
          catch { code.select(); }
        },
      }, 'Copy code'))),
    h('div', { class: 'panel' },
      h('h3', {}, 'Import progress'),
      h('p', {}, 'This replaces the progress stored in this browser.'),
      paste,
      h('div', { class: 'row' }, h('button', {
        class: 'btn primary', type: 'button',
        onclick: () => {
          try { progress.importCode(paste.value); msg.textContent = 'Imported.'; code.value = progress.exportCode(); }
          catch (err) { msg.textContent = `Could not import: ${err.message}`; }
        },
      }, 'Import')),
      msg),
    h('div', { class: 'panel' },
      h('h3', {}, 'Sounds'),
      h('label', { class: 'toggle' },
        h('input', { type: 'checkbox', checked: soundOn(), onchange: e => setSound(e.target.checked) }),
        'Play a sound for right and wrong answers')),
    h('div', { class: 'panel' },
      h('h3', {}, 'Start over'),
      h('p', {}, 'Erase all progress and the review decks of every course, here and in your account if signed in.'),
      h('button', {
        class: 'btn ghost', type: 'button',
        onclick: () => { if (confirm('Erase all progress in this browser (and in your account, if you are signed in)?')) { progress.reset(); flushCloud(); location.hash = '#/'; } },
      }, 'Reset progress')),
    h('div', { class: 'panel' },
      h('h3', {}, 'About this build'),
      h('p', {}, `Build ${BUILD}`),
      h('p', {}, `Reset epoch: ${progress.snapshot().epoch ?? 'none (older data)'}. Lessons done here: ${Object.values(progress.snapshot().lessons).filter(l => l.done).length}.`))));
}

window.addEventListener('hashchange', route);
route();

// A cloud sync can merge in progress made on another device while the trail is
// already on screen: redraw it when the merged progress differs from what is shown.
if (cloudConfigured) {
  let shown = JSON.stringify(progress.snapshot());
  onCloudChange(st => {
    if (st.sync !== 'synced') return;
    const now = JSON.stringify(progress.snapshot());
    if (now === shown) return;
    shown = now;
    const page = location.hash.replace(/^#\/?/, '');
    if (!page.includes('/') || page.startsWith('settings')) route();
  });
}
