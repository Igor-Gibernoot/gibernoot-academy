// Router.
//   #/                              academy home: the list of courses
//   #/settings                      progress export/import/reset (all courses)
//   #/medals                        the medal room (achievements, all courses)
//   #/method, #/about               academy pages (text in pages/<id>.md)
//   #/today                         review session mixing the due questions of every course
//   #/welcome                       the home page with the welcome tour open
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
import { getCatalog, getCourse, getLesson, nextLessonAfter, isQuestion, peekSummaries, setPeekSummaries } from './content.js';
import { setCourse, courseId, at, LEGACY_COURSE, RENAMED } from './course.js';
import { renderHome } from './home.js';
import { renderPage } from './pages.js';
import { renderMedals, medalCheck } from './medals.js';
import { progress } from './progress.js';
import { renderTrail } from './trail.js';
import { runSession, lessonItems } from './player.js';
import { runExam } from './exam.js';
import { recapCards, runRecap } from './recap.js';
import { sounds, soundOn, setSound } from './sound.js';
import { initTheme, themeButton } from './theme.js';
import { initTooltips } from './tooltip.js';
import { shareLevel } from './share.js';
import { initOffline, offlinePanel } from './offline.js';
import { t, tn, lang, LANGUAGES, loadLang, setLang } from './i18n.js';
import { cloudConfigured, initCloud, onCloudChange, signIn, signOutUser, flushCloud, syncCloudNow } from './cloud.js';

await loadLang();
initTheme();
initTooltips();
initCloud();
initOffline();

const root = document.getElementById('app');
const REVIEW_SIZE = 12;
const RECAP_SIZE = 5;
const TODAY_SIZE = 15;

// Pixel font (Settings): 'all' (default, lessons too; math keeps its font), 'titles' (titles, labels, buttons), 'off'.
const pixelFont = () => progress.pref('pixelStyle', progress.pref('pixelFont', true) === false ? 'off' : 'all');
const applyPixelFont = () => { document.documentElement.dataset.pixel = pixelFont(); };
applyPixelFont();

async function route() {
  applyPixelFont();
  document.querySelectorAll('.scrim').forEach(s => s.remove());
  document.documentElement.style.overflow = ''; // a window closed by navigation must not leave the page frozen
  let parts = location.hash.replace(/^#\/?/, '').replace(/\?.*$/, '').split('/').filter(Boolean);
  try {
    if (['lesson', 'read', 'review', 'recap'].includes(parts[0])) {
      location.replace(`#/${LEGACY_COURSE}/${parts.join('/')}`);
      return;
    }
    if (RENAMED[parts[0]]) { location.replace(`#/${[RENAMED[parts[0]], ...parts.slice(1)].join('/')}`); return; }
    if (parts[0] === 'settings') return settings();
    if (parts[0] === 'medals') { document.title = `${t('Medals')} · Gibernoot Academy`; return await renderMedals(root); }
    if (parts[0] === 'method' || parts[0] === 'about') return await renderPage(root, parts[0]);
    if (parts[0] === 'today') { document.title = `${t('Today')} · Gibernoot Academy`; return await playToday(); }
    if (!parts.length || parts[0] === 'welcome') { document.title = 'Gibernoot Academy'; return await renderHome(root); }
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
      h('div', { class: 'error-box' }, h('b', {}, t('Something went wrong. ')), err.message),
      h('p', {}, h('a', { href: courseId() ? at() : '#/' }, t('← Back')))));
  }
}

async function playLesson(id, startAt, readOnly = false) {
  const { meta, data } = await getLesson(id);
  if (!data) { location.hash = at(); return; }
  if (meta.kind === 'exam' && !readOnly) {
    runExam(root, {
      id, title: meta.title, data,
      onExit: () => { location.hash = at(); },
      onFinish: stats => { progress.completeLesson(id, stats); medalCheck(); },
    });
    return;
  }
  const saved = progress.partial(id);
  const resume = !readOnly && startAt > 0 && saved?.n === data.cards.length ? saved : undefined;
  // A run played from the first card in one sitting is timed (speed medals).
  const t0 = !readOnly && !resume && !(startAt > 0) ? Date.now() : null;
  runSession(root, {
    items: lessonItems(id, data),
    mode: 'lesson',
    readOnly,
    startAt: Math.max(0, Math.min(startAt || 0, data.cards.length - 1)),
    resume,
    onProgress: (at, n, extra) => { if (at > 0 || progress.partial(id)) progress.savePartial(id, at, n, extra); },
    onExit: () => { location.hash = at(); },
    onFinish: async stats => {
      if (readOnly) { location.hash = at(); return; }
      const level = (await getCourse()).levels.find(l => (l.lessons ?? []).some(m => m.id === id));
      const counted = (level?.lessons ?? []).filter(m => m.kind !== 'review');
      const levelDone = () => counted.length > 0 && counted.every(m => m.file && progress.lesson(m.id)?.done);
      const wasDone = levelDone();
      progress.completeLesson(id, { ...stats, secs: t0 ? (Date.now() - t0) / 1000 : undefined, cards: data.cards.length });
      // Finishing a level challenge counts the level's other lessons as done (a shortcut for readers who know the chapter).
      let skipped = 0;
      if (meta.kind === 'challenge') {
        const rest = (level?.lessons ?? []).filter(m => m.file && m.kind !== 'review' && m.kind !== 'exam' && !progress.lesson(m.id)?.done);
        skipped = rest.length;
        if (skipped) progress.markKnown(rest.map(m => m.id));
      }
      const next = await nextLessonAfter(id);
      // The lesson that finishes a level offers a picture of it to share.
      const entry = !wasDone && levelDone() ? (await getCatalog()).courses.find(c => c.id === courseId()) : null;
      doneScreen({
        share: entry ? { label: t('Share: {level} complete', { level: level.title }), run: () => shareLevel({ course: entry, level, acc: progress.accuracy(counted.map(m => m.id)) }) } : null,
        title: entry ? t('Level complete!') : t('Lesson complete'),
        subtitle: skipped ? tn('{title} · {n} other lesson of this level marked as done', '{title} · {n} other lessons of this level marked as done', skipped, { title: meta.title }) : meta.title,
        stats,
        actions: [
          next ? ['primary', t('Next: {title}', { title: next.meta.title }), at(`lesson/${next.meta.id}`)] : null,
          ['ghost', t('Back to the trail'), at()],
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
  if (!keys.length) return nothingDue(t('Questions you answer in lessons come back here on a spaced schedule — missed ones the same day, the rest after 1, 3, 7, 16 and 35 days.'));
  const items = [];
  for (const key of keys) {
    const [lessonId, cardId] = key.split('/');
    try {
      const { meta, data } = await getLesson(lessonId);
      const card = data?.cards.find(c => c.id === cardId);
      if (card && isQuestion(card)) items.push({ card: { ...card, tag: meta.title }, key });
    } catch { /* lesson renamed or removed: skip */ }
  }
  if (!items.length) return nothingDue(t('The questions due were renamed or removed from their lessons.'));
  runSession(root, {
    items, mode: 'review',
    onExit: () => { location.hash = at(); },
    onFinish: stats => {
      progress.finishReview('reviews');
      doneScreen({
        title: level ? t('{level}: review done', { level: level.title }) : t('Review done'),
        subtitle: t('Spaced repetition keeps it in long-term memory.'),
        stats, mode: 'review', actions: [['primary', t('Back to the trail'), at()]],
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
  if (!cards.length) return nothingDue(t('The “what you now own” summary of each concept lesson you finish comes back here with its key results hidden, on a spaced schedule — missed ones the same day, the rest after 1, 3, 7, 16 and 35 days.'));
  runRecap(root, {
    cards,
    onExit: () => { location.hash = at(); },
    onFinish: stats => {
      progress.finishReview('recaps');
      doneScreen({
        title: level ? t('{level}: recap done', { level: level.title }) : t('Recap done'),
        subtitle: t('Stating the key results from memory is what makes them yours.'),
        stats, statLabel: t('of the hidden results recalled'), actions: [['primary', t('Back to the trail'), at()]],
      });
    },
  });
}

// Today: the due questions of every course in one session, the courses taking turns.
async function playToday() {
  const catalog = await getCatalog();
  const live = new Map(catalog.courses.filter(c => c.status !== 'planned').map(c => [c.id, c]));
  const queues = [...live.keys()].map(id => shuffle(progress.allDue().filter(d => d.course === id))).filter(q => q.length);
  const picked = [];
  while (picked.length < TODAY_SIZE && queues.some(q => q.length)) for (const q of queues) if (q.length && picked.length < TODAY_SIZE) picked.push(q.shift());
  const items = [];
  for (const { course, key } of picked) {
    const [lessonId, cardId] = key.split('/');
    try {
      setCourse(course);
      const { meta, data } = await getLesson(lessonId);
      const card = data?.cards.find(c => c.id === cardId);
      const c = live.get(course);
      if (card && isQuestion(card)) items.push({ card: { ...card, tag: `${c.short ?? c.title} · ${meta.title}` }, key, course });
    } catch { /* lesson renamed or removed: skip */ }
  }
  setCourse(null);
  if (!items.length) return nothingDue(t('Questions you answer in any course come back here when they are due: missed ones the same day, the rest after 1, 3, 7, 16 and 35 days.'), '#/', t('Back home'));
  runSession(root, {
    items, mode: 'review',
    onExit: () => { setCourse(null); location.hash = '#/'; },
    onFinish: stats => {
      setCourse(null);
      progress.finishReview('reviews');
      const left = progress.allDue().filter(d => live.has(d.course)).length;
      doneScreen({
        title: t('Today’s review done'),
        subtitle: left ? tn('{n} more question due: another round whenever you like.', '{n} more questions due: another round whenever you like.', left) : t('Everything due is reviewed. See you tomorrow!'),
        stats, mode: 'review',
        actions: [left ? ['primary', t('Another round'), location.hash === '#/today' ? '#/today?again' : '#/today'] : null, [left ? 'ghost' : 'primary', t('Back home'), '#/']],
      });
    },
  });
}

function nothingDue(text, href = at(), label = t('Back to the trail')) {
  root.replaceChildren(h('div', { class: 'page done-screen' },
    h('div', { class: 'burst', html: icons.check }),
    h('h1', {}, t('Nothing due')),
    h('p', { class: 'hint-line' }, text),
    h('div', { class: 'actions' }, h('a', { class: 'btn primary', href, style: 'text-decoration:none' }, label))));
}

function doneScreen({ title, subtitle, stats, actions, mode = 'lesson', statLabel, share }) {
  const pct = stats.questions ? Math.round((stats.firstTry / stats.questions) * 100) : 100;
  sounds.finish();
  root.replaceChildren(h('div', { class: 'page done-screen' },
    h('div', { class: 'burst', html: icons.check }),
    h('h1', {}, title),
    h('p', { class: 'hint-line', html: escapeHtml(subtitle) }),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', {}, `${pct}%`), h('span', {}, statLabel ?? (mode === 'lesson' ? t('first-try accuracy in this lesson') : t('first-try accuracy in this session')))),
      h('div', { class: 'stat' }, h('b', {}, `${progress.streak()}`), h('span', {}, t('day streak')))),
    h('div', { class: 'actions' },
      share ? h('button', { class: 'btn good', type: 'button', onclick: share.run }, share.label) : null,
      actions.filter(Boolean).map(([cls, label, href]) =>
        h('a', { class: `btn ${cls}`, href, style: 'text-decoration:none' }, label)))));
  setTimeout(medalCheck, 600); // after the finish jingle
}

function accountPanel() {
  const body = h('div');
  const panel = h('div', { class: 'panel' }, h('h3', {}, t('Account & sync')), body);
  if (!cloudConfigured) {
    body.append(h('p', {}, t('Sign-in is not set up for this copy of the app yet, so progress stays in this browser (use the code below to move it).')));
    return panel;
  }
  const msg = h('p', { class: 'hint-line', style: 'margin:8px 0 0' });
  const off = onCloudChange(st => {
    if (!panel.isConnected && body.childNodes.length) return off();
    if (st.user) {
      body.replaceChildren(
        h('p', {}, t('Signed in as {who}.', { who: `${st.user.name ?? st.user.email}${st.user.name ? ` (${st.user.email})` : ''}` })),
        h('p', { class: 'hint-line', style: 'margin:0 0 8px' },
          st.sync === 'syncing' ? t('Syncing…')
            : st.sync === 'error' ? t('Sync problem: {error} (retrying automatically)', { error: st.error })
            : t('Synced{time}{size}. Progress is merged with your account on every change, every minute and when you return to this tab.', { time: st.last ? t(' at {time}', { time: new Date(st.last).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }) : '', size: st.bytes ? t(' ({n} kB in the cloud)', { n: Math.round(st.bytes / 1000) }) : '' })),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => syncCloudNow() }, t('Sync now')),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => signOutUser() }, t('Sign out'))));
    } else {
      body.replaceChildren(
        h('p', {}, t('Sign in with Google to keep your progress in your account and share it between your phone and laptop. Progress already in this browser is merged in, never lost.')),
        h('div', { class: 'row' }, h('button', {
          class: 'btn primary', type: 'button',
          onclick: async () => { msg.textContent = ''; try { await signIn(); } catch (err) { msg.textContent = t('Sign-in failed: {error}', { error: err.message }); } },
        }, t('Sign in with Google'))),
        msg);
      if (st.error) msg.textContent = st.error;
    }
  });
  return panel;
}

const BUILD = '2026-11-14 (Today review, mastery maps, share cards, tour, offline)';

function languagePanel() {
  return h('div', { class: 'panel' },
    h('h3', {}, t('Language')),
    h('p', {}, t('The language of the interface and of every lesson that has been translated; the others stay in English.')),
    LANGUAGES.map(l => h('label', { class: 'toggle' },
      h('input', { type: 'radio', name: 'lang', checked: lang() === l.code, onchange: () => setLang(l.code) }),
      l.name)));
}

function settings() {
  const code = h('textarea', { readonly: true, 'aria-label': t('Your progress code') });
  code.value = progress.exportCode();
  const paste = h('textarea', { placeholder: t('Paste a progress code here'), 'aria-label': t('Progress code to import') });
  const msg = h('p', { style: 'margin-top:8px' });

  root.replaceChildren(h('div', { class: 'page' },
    h('header', { class: 'topbar' },
      h('a', { class: 'icon-btn', href: courseId() ? at() : '#/', 'aria-label': t('Back'), html: icons.back }),
      h('div', { class: 'brand' }, t('Progress & settings')),
      themeButton(h)),
    languagePanel(),
    accountPanel(),
    offlinePanel(),
    h('div', { class: 'panel' },
      h('h3', {}, t('Move progress by code')),
      h('p', {}, t('Without an account, progress is saved only in this browser. To continue on another device, copy this code here and import it there.')),
      code,
      h('div', { class: 'row' }, h('button', {
        class: 'btn primary', type: 'button',
        onclick: async e => {
          try { await navigator.clipboard.writeText(code.value); e.target.textContent = t('Copied!'); }
          catch { code.select(); }
        },
      }, t('Copy code')))),
    h('div', { class: 'panel' },
      h('h3', {}, t('Import progress')),
      h('p', {}, t('The code is merged into the progress stored in this browser: nothing already here is lost (use Reset below to start over).')),
      paste,
      h('div', { class: 'row' }, h('button', {
        class: 'btn primary', type: 'button',
        onclick: () => {
          try { progress.importCode(paste.value); msg.textContent = t('Imported.'); code.value = progress.exportCode(); }
          catch (err) { msg.textContent = t('Could not import: {error}', { error: err.message }); }
        },
      }, t('Import'))),
      msg),
    h('div', { class: 'panel' },
      h('h3', {}, t('Sounds')),
      h('label', { class: 'toggle' },
        h('input', { type: 'checkbox', checked: soundOn(), onchange: e => setSound(e.target.checked) }),
        t('Play a sound for right and wrong answers'))),
    h('div', { class: 'panel' },
      h('h3', {}, t('Pixel style')),
      [['all', t('Pixel font everywhere, lessons included (math keeps its own font)')],
        ['titles', t('Pixel font for titles, labels and buttons only (lesson text in the plain font)')],
        ['off', t('Plain font everywhere')]].map(([v, label]) => h('label', { class: 'toggle' },
        h('input', { type: 'radio', name: 'pixel', checked: pixelFont() === v, onchange: () => { progress.setPref('pixelStyle', v); applyPixelFont(); } }),
        label))),
    h('div', { class: 'panel' },
      h('h3', {}, t('Summaries')),
      h('label', { class: 'toggle' },
        h('input', { type: 'checkbox', checked: peekSummaries(), onchange: e => setPeekSummaries(e.target.checked) }),
        t('Show the summary of lessons I have not finished yet (off: only finished lessons)'))),
    h('div', { class: 'panel' },
      h('h3', {}, t('Start over')),
      h('p', {}, t('Erase all progress and the review decks of every course, here and in your account if signed in.')),
      h('button', {
        class: 'btn ghost', type: 'button',
        onclick: () => { if (confirm(t('Erase all progress in this browser (and in your account, if you are signed in)?'))) { progress.reset(); flushCloud(); location.hash = '#/'; } },
      }, t('Reset progress'))),
    h('div', { class: 'panel' },
      h('h3', {}, t('About this build')),
      h('p', {}, t('Build {build}', { build: BUILD })),
      h('p', {}, t('Reset epoch: {epoch}. Lessons done here: {n}.', { epoch: progress.snapshot().epoch ?? t('none (older data)'), n: Object.values(progress.snapshot().lessons).filter(l => l.done).length })))));
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
