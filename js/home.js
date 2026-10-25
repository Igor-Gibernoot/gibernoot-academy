// The academy home: one card per course in courses/catalog.yaml, with how far
// the reader got in it. Courses marked `status: planned` show as coming soon.

import { h } from './dom.js';
import { mdInline } from './render.js';
import { icons } from './icons.js';
import { getCatalog, getCourse } from './content.js';
import { progress } from './progress.js';
import { themeButton } from './theme.js';
import { accountChip } from './trail.js';

const pct = x => `${Math.round(x * 100)}%`;

export async function renderHome(root) {
  const catalog = await getCatalog();
  const top = h('header', { class: 'topbar' },
    h('h1', { class: 'course-title', 'data-hue': 0 }, catalog.title),
    catalog.tagline ? h('div', { class: 'course-sub', html: mdInline(catalog.tagline) }) : null,
    h('div', { class: 'toolbar' },
      h('span', { class: 'chip streak', tabindex: 0, 'data-tip': 'Days in a row you studied (any course)', html: `${icons.flame}<span>${progress.streak()}</span>` }),
      accountChip(),
      themeButton(h),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Progress & settings', 'data-tip': 'Settings & account', html: icons.settings, onclick: () => { location.hash = '#/settings'; } })));

  const cards = await Promise.all(catalog.courses.map(async (c, k) => {
    const planned = c.status === 'planned';
    let meter = null, line = planned ? 'Coming soon' : '';
    if (!planned) {
      const course = await getCourse(c.id);
      const lessons = course.levels.flatMap(l => l.lessons ?? []).filter(m => m.kind !== 'review');
      const built = lessons.filter(m => m.file).map(m => m.id);
      const st = progress.courseStats(c.id, built);
      line = [`${st.done} of ${built.length} lessons done`, st.acc != null ? `${pct(st.acc)} first-try` : null, st.due ? `${st.due} to review` : null].filter(Boolean).join(' · ');
      meter = h('div', { class: 'meter' }, h('div', { style: `width:${built.length ? (100 * st.done) / built.length : 0}%` }));
    }
    const body = [
      c.eyebrow ? h('div', { class: 'eyebrow' }, c.eyebrow) : null,
      h('h2', { html: mdInline(c.title) }),
      c.blurb ? h('p', { html: mdInline(c.blurb) }) : null,
      meter,
      h('div', { class: 'course-line' }, line),
    ];
    return planned
      ? h('div', { class: 'course-card planned', 'data-hue': c.hue ?? k % 6 }, body)
      : h('a', { class: 'course-card', href: `#/${c.id}`, 'data-hue': c.hue ?? k % 6 }, body);
  }));

  root.replaceChildren(h('div', { class: 'trail home' }, top, h('div', { class: 'course-list' }, cards)));
}
