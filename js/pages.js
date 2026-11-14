// Academy pages beside the course list: Method and About. Their text lives in
// pages/<id>.md (Markdown + $math$); the tab bar is shared with the home page.

import { h } from './dom.js';
import { md, mdInline } from './render.js';
import { getCatalog } from './content.js';
import { themeButton } from './theme.js';

export const PAGES = [
  { id: '', label: 'Courses' },
  { id: 'method', label: 'Method', title: 'How the academy teaches' },
  { id: 'about', label: 'About', title: 'Why learning should be fun' },
];

const cache = {};

// The tab bar: Courses (home, #/), Method, About.
export function pageTabs(current = '') {
  return h('nav', { class: 'page-tabs', 'aria-label': 'Academy pages' },
    PAGES.map(p => h('a', {
      href: `#/${p.id}`, class: p.id === current ? 'on' : null,
      'aria-current': p.id === current ? 'page' : null,
    }, p.label)));
}

export async function renderPage(root, id) {
  const page = PAGES.find(p => p.id === id && id);
  const catalog = await getCatalog();
  cache[id] ??= await fetch(`pages/${id}.md`).then(r => { if (!r.ok) throw new Error(`pages/${id}.md: ${r.status}`); return r.text(); });
  document.title = `${page.label} · Gibernoot Academy`;
  const top = h('header', { class: 'topbar' },
    h('h1', { class: 'course-title', 'data-hue': 0 }, catalog.title),
    catalog.tagline ? h('div', { class: 'course-sub', html: mdInline(catalog.tagline) }) : null,
    h('div', { class: 'toolbar' }, themeButton(h)),
    pageTabs(id));
  root.replaceChildren(h('div', { class: 'trail home academy-page' }, top,
    h('article', { class: 'prose page-body', html: md(cache[id]) })));
  window.scrollTo(0, 0);
}
