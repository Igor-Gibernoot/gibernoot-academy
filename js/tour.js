// The welcome tour: three cards in a window over the home page, shown once to a
// newcomer (no lesson finished, tour not seen: the `toured` setting) and any time
// from #/welcome. 1. who we are (the cast); 2. a real puzzle to try (the Method
// page's `card` block); 3. how the trail, review and medals work.

import { h } from './dom.js';
import { getCatalog } from './content.js';
import { progress } from './progress.js';
import { BLOCKS, tryCard, pageBlock } from './pages.js';

export const tourSeen = () => progress.pref('toured', false);

export async function openTour() {
  document.querySelector('.tour-scrim')?.remove();
  const [catalog, card] = await Promise.all([getCatalog(), pageBlock('method', 'card').catch(() => null)]);
  const steps = [
    {
      title: `Welcome to ${catalog.title}`,
      body: [
        h('p', {}, 'Deep subjects, learned the way puzzles are solved: you meet a problem first, guess, and the lesson builds the tools with you. Each course has a pixel guide to walk the trail with you.'),
        BLOCKS.cast(null, catalog),
      ],
    },
    card && {
      title: 'Guess first',
      body: [h('p', {}, 'Every lesson opens like this. Pick an answer before thinking too hard: a wrong guess is fine, and its feedback is part of the lesson.'), tryCard({ ...card, tag: 'A first puzzle' })],
    },
    {
      title: 'Then it sticks',
      body: [
        h('p', {}, 'A course is a trail of levels, each made of a few kinds of lessons:'),
        BLOCKS.trail([{ kind: 'concept', label: 'Concept' }, { kind: 'guided', label: 'Guided problem' }, { kind: 'traps', label: 'Traps' }, { kind: 'challenge', label: 'Challenge' }]),
        h('p', {}, 'Every question you answer comes back on a spaced schedule, a little before you would forget it: the Today box on the home page gathers what is due in all your courses. Medals reward the habits that work, and progress is saved in this browser (sign in to sync it between devices).'),
      ],
    },
  ].filter(Boolean);

  let i = 0;
  const dots = h('div', { class: 'tour-dots', 'aria-hidden': 'true' }, steps.map(() => h('i')));
  const pane = h('div', { class: 'tour-pane' });
  const actions = h('div', { class: 'actions' });
  const sheet = h('div', { class: 'sheet tour-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Welcome tour' }, dots, pane, actions);
  const scrim = h('div', { class: 'scrim tour-scrim' }, sheet);
  const html = document.documentElement, overflow = html.style.overflow;
  const close = () => { progress.setPref('toured', true); if (location.hash === '#/welcome') history.replaceState(null, '', '#/'); scrim.remove(); html.style.overflow = overflow; removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  const btn = (label, cls, onclick) => h('button', { class: `btn ${cls}`, type: 'button', onclick }, label);

  function show() {
    const s = steps[i];
    pane.replaceChildren(h('div', { class: 'kind' }, `${i + 1} of ${steps.length}`), h('h3', {}, s.title), ...s.body);
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    const last = i === steps.length - 1;
    actions.replaceChildren(...[
      i ? btn('Back', 'ghost', () => { i--; show(); }) : btn('Skip', 'ghost', close),
      last ? h('a', { class: 'btn ghost', href: '#/method', onclick: close }, 'The method') : null,
      btn(last ? 'Pick a course' : 'Next', 'primary', () => { if (last) close(); else { i++; show(); } })].filter(Boolean));
    sheet.scrollTop = 0;
  }
  html.style.overflow = 'hidden';
  document.body.append(scrim);
  show();
  actions.querySelector('.primary')?.focus();
}
