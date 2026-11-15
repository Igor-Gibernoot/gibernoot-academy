// Mastery heat-maps, built from the review deck: each question answered in a
// lesson sits in a Leitner box, 0 (just missed) to 5 (remembered for weeks).
//   masteryStrip(cards)       one cell per question of a level (trail level header)
//   levelStrip(course, id)    one cell per chapter level of a course (home course card)
// A cell's shade is its strength (box / 5); a cell due for review is drawn hollow.

import { h } from './dom.js';
import { t, tn } from './i18n.js';
import { progress } from './progress.js';

const MAX_BOX = 5;
export const strength = cards => cards.length ? cards.reduce((s, c) => s + c.box, 0) / (MAX_BOX * cards.length) : null;
const shade = s => `--m:${(0.18 + 0.82 * s).toFixed(2)}`;

export function masteryStrip(cards) {
  if (!cards.length) return null;
  const sorted = [...cards].sort((a, b) => b.box - a.box || a.due - b.due);
  const strong = cards.filter(c => c.box >= 4).length, due = cards.filter(c => c.due).length;
  const tip = t('Memory of this level: {n} in review, {strong} strong{due}. Each square brightens as a question survives longer gaps.', {
    n: tn('{n} question', '{n} questions', cards.length), strong, due: due ? t(', {n} due now (hollow)', { n: due }) : '' });
  return h('div', { class: 'mastery', tabindex: 0, 'data-tip': tip, 'aria-label': tip },
    h('span', { class: 'mastery-label' }, t('Memory')),
    h('span', { class: 'mastery-cells' }, sorted.map(c => h('i', { class: c.due ? 'due' : null, style: shade(c.box / MAX_BOX) }))));
}

// Chapter levels only (exams and the intro tour carry no `number`, or have no lessons with questions).
export function levelStrip(course, id) {
  const levels = course.levels.filter(l => (l.lessons ?? []).some(m => m.file && m.kind !== 'exam'));
  const rows = levels.map(l => ({ l, s: strength(progress.deckCards((l.lessons ?? []).map(m => m.id), id)) }));
  if (rows.every(r => r.s == null)) return null;
  return h('div', { class: 'mastery level-strip', 'aria-label': t('Memory per level') },
    h('span', { class: 'mastery-label' }, t('Memory')),
    h('span', { class: 'mastery-cells' }, rows.map(({ l, s }) => h('i', {
      class: s == null ? 'empty' : null, style: s == null ? null : shade(s),
      title: `${l.eyebrow ?? t('Level {n}', { n: l.number })}: ${s == null ? t('not started') : t('{pct}% memory strength', { pct: Math.round(100 * s) })}`,
    }))));
}
