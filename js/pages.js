// Academy pages beside the course list: Method and About. Their text lives in
// pages/<id>.md (Markdown + $math$); the tab bar is shared with the home page.
//
// Besides Markdown, a page may hold visual blocks: a fenced code block whose
// language is one of the names below, with YAML inside.
//   ```cast            the course mascots, each a link to its course (YAML: optional list of course ids)
//   ```trail           a row of lesson-kind badges: [{ kind, label }] (kind = an icon in js/icons.js)
//   ```card            one real lesson card to try (mcq, numeric, build, order: docs/QUICKREF.md),
//                      with Check, feedback, Try again and the `explanation`; nothing is recorded
//   ```widget          { name, config, caption } any widget of js/widgets/
//   ```image           { src, alt, caption, credit, link, side } a picture from pages/img/
//                      (side: true floats it right of the text on wide screens)
//   ```bars            { title, unit, groups: [{ label, bars: [{ label, value, good }] }], note }
//                      a small bar chart (good: true paints a bar in the accent colour)

import { h } from './dom.js';
import { md, mdInline } from './render.js';
import { getCatalog } from './content.js';
import { themeButton } from './theme.js';
import { icons } from './icons.js';
import { mascotEl } from './pixel.js';
import { renderCard } from './cards.js';
import { mountWidget } from './widgets/index.js';

export const PAGES = [
  { id: '', label: 'Courses' },
  { id: 'method', label: 'Method', title: 'How the academy teaches' },
  { id: 'about', label: 'About', title: 'Why learning should be fun' },
];

const cache = {};
const BLOCK = /^```(cast|trail|card|widget|image|bars)[ \t]*\n([\s\S]*?)^```[ \t]*$/gm;

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
  const body = h('article', { class: 'prose page-body' });
  root.replaceChildren(h('div', { class: 'trail home academy-page' }, top, body));
  fill(body, cache[id], catalog);
  window.scrollTo(0, 0);
}

// Markdown runs between the blocks; each block becomes its element in place.
function fill(body, src, catalog) {
  let at = 0;
  const prose = text => { if (text.trim()) body.insertAdjacentHTML('beforeend', md(text)); };
  for (const m of src.matchAll(BLOCK)) {
    prose(src.slice(at, m.index));
    at = m.index + m[0].length;
    let data;
    try { data = jsyaml.load(m[2]) ?? {}; } catch (e) { body.append(h('p', { class: 'warn' }, `Block "${m[1]}": ${e.message}`)); continue; }
    body.append(BLOCKS[m[1]](data, catalog));
  }
  prose(src.slice(at));
  // Widgets mount once their box is in the page, so they can measure it.
  body.querySelectorAll('.widget[data-pending]').forEach(box => {
    const { name, config } = box._widget;
    box.removeAttribute('data-pending');
    mountWidget(name, box, config ?? {});
  });
}

const BLOCKS = {
  cast(ids, catalog) {
    const list = Array.isArray(ids) && ids.length ? ids.map(i => catalog.courses.find(c => c.id === i)).filter(Boolean) : catalog.courses;
    return h('div', { class: 'cast', 'aria-label': 'The course guides' }, list.filter(c => c.mascot).map(c => {
      const m = mascotEl(c.mascot, 4);
      return h('a', { class: 'cast-member', href: `#/${c.id}`, 'data-hue': c.hue ?? 0 }, h('span', { class: 'cast-sprite' }, m), h('span', {}, c.short ?? c.title));
    }));
  },

  trail(steps) {
    const list = [steps].flat().filter(Boolean);
    return h('div', { class: 'kind-trail', role: 'list' }, list.map(s => h('div', { class: 'kind-step', role: 'listitem' },
      h('span', { class: `kind-node${s.kind === 'challenge' || s.kind === 'exam' ? ' gold' : ''}`, html: icons[s.kind] ?? icons.concept }),
      h('span', { class: 'kind-label', html: mdInline(s.label ?? s.kind) }))));
  },

  card(card) { return tryCard(card); },

  widget(w) {
    const box = h('div', { class: 'widget', 'data-pending': '' });
    box._widget = w;
    return h('figure', { class: 'page-figure' }, box, w.caption ? h('figcaption', { html: mdInline(w.caption) }) : null);
  },

  image(im) {
    const src = /^(https?:|\/)/.test(im.src) ? im.src : `pages/${im.src}`;
    const credit = im.credit && (im.link ? h('a', { href: im.link, target: '_blank', rel: 'noopener noreferrer' }, im.credit) : im.credit);
    return h('figure', { class: `card-image page-image${im.side ? ' side' : ''}` },
      h('img', { src, alt: im.alt ?? '', decoding: 'async' }),
      h('figcaption', {},
        h('span', { class: 'cap-text', html: im.caption ? mdInline(im.caption) : '' }),
        credit ? h('span', { class: 'cap-credit' }, 'Image: ', credit) : null));
  },

  bars(b) {
    const unit = b.unit ?? '';
    const max = b.max ?? Math.max(...b.groups.flatMap(g => g.bars.map(x => x.value)));
    return h('figure', { class: 'page-bars' },
      b.title ? h('div', { class: 'bars-title', html: mdInline(b.title) }) : null,
      b.groups.map(g => h('div', { class: 'bars-group' },
        h('div', { class: 'bars-label', html: mdInline(g.label) }),
        g.bars.map(x => h('div', { class: `bar-row${x.good ? ' good' : ''}` },
          h('span', { class: 'bar-name', html: mdInline(x.label) }),
          h('span', { class: 'bar-track' }, h('span', { class: 'bar-fill', style: `width:${(100 * x.value / max).toFixed(1)}%` })),
          h('span', { class: 'bar-value' }, `${x.value}${unit}`))))),
      b.note ? h('figcaption', { html: mdInline(b.note) }) : null);
  },
};

// One lesson card, playable in place: Check, then feedback; a wrong answer can be retried.
function tryCard(card) {
  const stage = h('div', { class: 'try-stage' });
  const ctl = renderCard(card, stage);
  const foot = h('div', { class: 'try-foot' });
  const box = h('div', { class: 'try-card' }, h('div', { class: 'try-tag' }, card.tag ?? 'Try it: a real card'), stage, foot);
  if (ctl.kind !== 'question') return box;
  const btn = (label, cls, onclick) => h('button', { class: `btn ${cls}`, type: 'button', onclick }, label);
  const feedback = (kind, head, text) => h('div', { class: `feedback ${kind}` },
    h('div', { class: 'fb-head', html: (kind === 'good' ? icons.check : kind === 'bad' ? icons.cross : '') + `<span>${head}</span>` }),
    text ? h('div', { class: 'prose', html: md(text) }) : null);
  const show = fb => { stage.querySelector('.feedback')?.remove(); stage.append(fb); };

  function ask() {
    const check = btn('Check', 'primary', () => {
      const r = ctl.check();
      if (r.correct) {
        show(feedback('good', card.praise ?? 'Right!', [r.feedback, card.explanation].filter(Boolean).join('\n\n')));
        foot.replaceChildren(btn('Again', 'ghost', reset));
      } else {
        show(feedback('bad', 'Not quite. That mistake is a lesson too:', r.feedback));
        foot.replaceChildren(
          btn('Show answer', 'ghost', () => { ctl.reveal(); show(feedback('neutral', 'Answer', card.explanation ?? '')); foot.replaceChildren(btn('Again', 'ghost', reset)); }),
          btn('Try again', 'primary', () => { stage.querySelector('.feedback')?.remove(); ctl.retry(); ask(); }));
      }
    });
    check.disabled = !ctl.ready();
    ctl.onChange(() => { check.disabled = !ctl.ready(); });
    foot.replaceChildren(check);
  }
  function reset() { box.replaceWith(tryCard(card)); }
  ask();
  return box;
}
