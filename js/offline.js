// Offline use and installing the app (sw.js does the caching).
//   initOffline()   registers the service worker; the first time it takes over,
//                   the files this visit already loaded are cached too
//   offlinePanel()  the Settings panel: save every course for offline use, install the app

import { h } from './dom.js';

const SHELL_FLAG = 'gibernoot.offline.v1';
let installPrompt = null;
const canWork = 'serviceWorker' in navigator && location.protocol !== 'file:';

export function initOffline() {
  if (!canWork) return;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; document.querySelector('.install-btn')?.removeAttribute('hidden'); });
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('Offline mode unavailable:', err.message));
    navigator.serviceWorker.ready.then(() => {
      try { if (localStorage.getItem(SHELL_FLAG)) return; } catch { return; }
      // This visit's scripts, styles and fonts were loaded before the worker existed: fetch them again through it.
      const seen = performance.getEntriesByType('resource').map(r => r.name).filter(u => u.startsWith(location.origin));
      Promise.all(seen.map(u => fetch(u).catch(() => {}))).then(() => { try { localStorage.setItem(SHELL_FLAG, '1'); } catch {} });
    });
  });
}

// Every file the courses need: catalog, trails, lessons, their pictures, the academy pages.
async function courseFiles() {
  const get = async path => jsyaml.load(await (await fetch(path, { cache: 'no-cache' })).text());
  const files = ['courses/catalog.yaml', 'pages/method.md', 'pages/about.md', 'pages/img/ebbinghaus.webp'];
  const catalog = await get('courses/catalog.yaml');
  for (const c of catalog.courses.filter(c => c.status !== 'planned')) {
    const course = await get(`courses/${c.id}/course.yaml`);
    files.push(`courses/${c.id}/course.yaml`);
    for (const m of course.levels.flatMap(l => l.lessons ?? []).filter(m => m.file)) files.push(`courses/${c.id}/${m.file}`);
  }
  return { files, catalog };
}

const imagesOf = (lesson, dir) => (lesson?.cards ?? []).flatMap(card => [card.image].flat().filter(Boolean))
  .map(im => im.src).filter(src => src && !/^(https?:|\/)/.test(src)).map(src => `${dir}/${src}`);

async function saveAll(report) {
  const { files } = await courseFiles();
  const queue = [...new Set(files)];
  let done = 0, failed = 0;
  report(`Saving… 0 / ${queue.length}`);
  const worker = async () => {
    while (queue.length) {
      const path = queue.shift();
      try {
        const res = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) throw new Error(res.status);
        if (path.endsWith('.yaml') && /\/ch|\/exams?\//.test(path)) {
          const dir = path.slice(0, path.indexOf('/', 'courses/'.length));
          for (const img of imagesOf(jsyaml.load(await res.text()), dir)) if (!files.includes(img)) { files.push(img); queue.push(img); }
        }
      } catch { failed++; }
      done++;
      report(`Saving… ${done} / ${files.length}`);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return { total: done, failed };
}

export function offlinePanel() {
  const status = h('p', { class: 'hint-line', style: 'margin:8px 0 0' });
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const save = h('button', {
    class: 'btn primary', type: 'button', disabled: !canWork,
    onclick: async () => {
      save.disabled = true;
      try {
        await navigator.serviceWorker.ready;
        const { total, failed } = await saveAll(t => { status.textContent = t; });
        status.textContent = failed ? `Saved ${total - failed} files; ${failed} could not be fetched (try again when the connection is better).` : `All ${total} files saved: every course now works offline in this browser.`;
      } catch (err) { status.textContent = `Could not save: ${err.message}`; }
      save.disabled = false;
    },
  }, 'Save all courses for offline use');
  const install = h('button', {
    class: 'btn ghost install-btn', type: 'button', hidden: !installPrompt,
    onclick: async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; install.hidden = true; },
  }, 'Install the app');
  return h('div', { class: 'panel' },
    h('h3', {}, 'Offline & install'),
    h('p', {}, canWork
      ? 'Pages you open are kept for offline use automatically. Save everything at once before a trip, and review on the go; progress made offline syncs when you are back online.'
      : 'Offline mode needs the app to be opened from its web address.'),
    standalone ? h('p', {}, 'You are using the installed app.')
      : h('p', {}, ios ? 'To install on iPhone or iPad: tap Share, then “Add to Home Screen”.' : 'On a phone or in Chrome or Edge, the app can be installed like any other: it opens in its own window, even offline.'),
    h('div', { class: 'row' }, save, install),
    status);
}
