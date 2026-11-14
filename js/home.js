// The academy home: the Today box (review due in every course, and where to
// continue), then one card per course in courses/catalog.yaml, with how far the
// reader got in it and a memory heat-map of its levels. Courses marked
// `status: planned` show as coming soon. A newcomer gets the welcome tour.

import { h } from './dom.js';
import { mdInline } from './render.js';
import { icons } from './icons.js';
import { getCatalog, getCourse } from './content.js';
import { progress } from './progress.js';
import { themeButton } from './theme.js';
import { accountChip } from './trail.js';
import { bannerEl } from './pixel.js';
import { medalBar, medalCheck } from './medals.js';
import { pageTabs } from './pages.js';
import { mascotEl } from './pixel.js';
import { levelStrip } from './mastery.js';
import { openTour, tourSeen } from './tour.js';

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

  const live = catalog.courses.filter(c => c.status !== 'planned');
  const courses = Object.fromEntries(await Promise.all(live.map(async c => [c.id, await getCourse(c.id)])));
  const cards = await Promise.all(catalog.courses.map(async (c, k) => {
    const planned = c.status === 'planned';
    let meter = null, line = planned ? 'Coming soon' : '';
    if (!planned) {
      const course = courses[c.id];
      const lessons = course.levels.flatMap(l => l.lessons ?? []).filter(m => m.kind !== 'review');
      const built = lessons.filter(m => m.file).map(m => m.id);
      const st = progress.courseStats(c.id, built);
      line = [`${built.length ? Math.round(100 * st.done / built.length) : 0}% progress`, st.acc != null ? `${pct(st.acc)} first-try` : null, st.due ? `${st.due} to review` : null].filter(Boolean).join(' · ');
      meter = h('div', { class: 'meter' }, h('div', { style: `width:${built.length ? (100 * st.done) / built.length : 0}%` }));
    }
    const body = [
      c.banner ? bannerEl(c.banner) : null,
      c.eyebrow ? h('div', { class: 'eyebrow' }, c.eyebrow) : null,
      h('h2', { html: mdInline(c.title) }),
      c.blurb ? h('p', { html: mdInline(c.blurb) }) : null,
      meter,
      h('div', { class: 'course-line' }, line),
      planned ? null : levelStrip(courses[c.id], c.id),
    ];
    return planned
      ? h('div', { class: 'course-card planned', 'data-hue': c.hue ?? k % 6 }, body)
      : h('a', { class: 'course-card', href: `#/${c.id}`, 'data-hue': c.hue ?? k % 6 }, body);
  }));

  top.append(pageTabs(''), medalBar());
  root.replaceChildren(h('div', { class: 'trail home' }, top, todayBox(live, courses), h('div', { class: 'course-list' }, cards)));
  medalCheck().then(() => root.querySelector('.medal-bar')?.replaceWith(medalBar()));
  const newcomer = !Object.values(progress.allLessons()).some(l => l.done);
  if (location.hash === '#/welcome' || (newcomer && !tourSeen())) openTour().catch(err => console.error(err));
}

// Today: the questions due in all courses (one mixed session), and the next
// lesson of the course studied most recently.
function todayBox(live, courses) {
  const due = progress.allDue().filter(d => courses[d.course]);
  const perCourse = live.map(c => ({ c, n: due.filter(d => d.course === c.id).length })).filter(x => x.n);
  const recent = live.map(c => ({ c, t: progress.lastStudied(c.id) })).filter(x => x.t).sort((a, b) => b.t - a.t)[0]?.c;
  let next = null;
  if (recent) {
    const rec = id => progress.allLessons()[`${recent.id}:${id}`];
    const meta = courses[recent.id].levels.flatMap(l => l.lessons ?? []).find(m => m.file && m.kind !== 'review' && !rec(m.id)?.done);
    const part = meta && progress.snapshot().partial[`${recent.id}:${meta.id}`];
    if (meta) next = { meta, href: `#/${recent.id}/lesson/${meta.id}${part?.at > 0 ? `/${part.at + 1}` : ''}`, resume: part?.at > 0 };
  }
  const rows = [];
  if (due.length) {
    rows.push(h('div', { class: 'today-row' },
      h('div', { class: 'today-cast' }, perCourse.map(({ c }) => mascotEl(c.mascot, 2)).filter(Boolean)),
      h('div', { class: 'today-text' },
        h('b', {}, `${due.length} question${due.length > 1 ? 's' : ''} to review`),
        h('span', {}, perCourse.map(({ c, n }) => `${c.short ?? c.title} ${n}`).join(' · '))),
      h('a', { class: 'btn primary', href: '#/today' }, 'Review now')));
  } else if (recent) {
    rows.push(h('div', { class: 'today-row' },
      h('div', { class: 'today-text' }, h('b', {}, 'Review all caught up'), h('span', {}, 'Questions come back here when they are due, in every course at once.'))));
  }
  if (next) {
    rows.push(h('div', { class: 'today-row' },
      h('div', { class: 'today-cast' }, mascotEl(recent.mascot, 2)),
      h('div', { class: 'today-text' },
        h('b', { html: mdInline(next.meta.title) }),
        h('span', {}, `${next.resume ? 'Continue where you stopped' : 'Next lesson'} in ${recent.short ?? recent.title}`)),
      h('a', { class: `btn ${due.length ? 'ghost' : 'primary'}`, href: next.href }, next.resume ? 'Continue' : 'Start')));
  }
  if (!rows.length) {
    rows.push(h('div', { class: 'today-row' },
      h('div', { class: 'today-text' }, h('b', {}, 'New here?'), h('span', {}, 'Pick a course below, or take a 30-second tour of how the academy teaches.')),
      h('button', { class: 'btn primary', type: 'button', onclick: () => openTour() }, 'Take the tour')));
  }
  return h('section', { class: 'today-box', 'aria-label': 'Today' },
    h('div', { class: 'today-head' }, h('h2', {}, 'Today'),
      h('span', { class: 'today-streak', html: `${icons.flame}<span>${progress.streak()}-day streak</span>` })),
    rows);
}
