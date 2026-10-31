// Card renderers. Each returns a controller the player drives:
//
//   info cards:     { kind: 'info' }
//   question cards: { kind: 'question',
//                     ready(),       -> can the "Check" button be pressed?
//                     onChange(fn),  -> call fn whenever ready() may change
//                     check(),       -> { correct, feedback }  (feedback: Markdown)
//                     retry(),       -> re-open input after a wrong attempt
//                     reveal(),      -> show the right answer in place
//                     correctMd(),   -> the right answer as Markdown (exam review)
//                     showCorrect?(),-> mark the right options, keeping the reader's picks
//                     select?(k) }   -> keyboard shortcut for option k
//
// The player locks input between check() and retry()/reveal().

import { h, shuffle } from './dom.js';
import { md, mdInline, tex } from './render.js';
import { mountWidget } from './widgets/index.js';
import { courseId } from './course.js';

export function renderCard(card, el) {
  const render = RENDERERS[card.type];
  if (!render) throw new Error(`Unknown card type "${card.type}"`);
  return render(card, el);
}

const RENDERERS = { text, widget, mcq, numeric, build, order, mapstep, mapview };

function header(card, el) {
  if (card.title) el.append(h('div', { class: 'prose' }, h('h2', { html: mdInline(card.title) })));
  images(card, el, 'top');
  if (card.type !== 'text') figure(card, el);
}

// `image:` (one object or a list) on any card: a captioned, credited picture from courses/<id>/img/.
// Shown under the title, above the body/prompt; `place: bottom` puts it after the body (text cards).
// `mat: true` gives transparent diagrams a light backing (dark theme). Tap to enlarge.
function images(card, el, place) {
  const list = [card.image].flat().filter(Boolean).filter(im => (im.place ?? 'top') === place);
  for (const im of list) {
    const src = /^(https?:|\/)/.test(im.src) ? im.src : `courses/${courseId()}/${im.src}`;
    const img = h('img', { src, alt: im.alt ?? '', loading: 'lazy', decoding: 'async', class: im.mat ? 'mat' : null });
    const credit = im.credit && (im.link
      ? h('a', { href: im.link, target: '_blank', rel: 'noopener noreferrer' }, im.credit)
      : im.credit);
    const cap = h('figcaption', {},
      h('span', { class: 'cap-text', html: im.caption ? mdInline(im.caption) : '' }),
      credit ? h('span', { class: 'cap-credit' }, 'Image: ', credit) : null);
    img.addEventListener('click', () => {
      const big = h('div', { class: 'lightbox', role: 'dialog', 'aria-label': im.alt ?? 'Image', onclick: () => big.remove() },
        h('img', { src, alt: im.alt ?? '', class: im.mat ? 'mat' : null }));
      document.body.append(big);
    });
    el.append(h('figure', { class: 'card-image' }, img, cap));
  }
}

// `figure: { widget, config }` on any card: a display-only widget above the prompt (below the body on text cards)
function figure(card, el) {
  if (!card.figure) return;
  const box = h('div', { class: 'widget' });
  el.append(box);
  mountWidget(card.figure.widget, box, card.figure.config ?? {});
}

function emitter() {
  const fns = [];
  return { on: fn => fns.push(fn), fire: () => fns.forEach(fn => fn()) };
}

// ---------- text ----------
function text(card, el) {
  header(card, el);
  el.append(h('div', { class: 'prose', html: md(card.body) }));
  images(card, el, 'bottom');
  figure(card, el);
  return { kind: 'info' };
}

// ---------- widget ----------
function widget(card, el) {
  header(card, el);
  if (card.body) el.append(h('div', { class: 'prose', html: md(card.body) }));
  const box = h('div', { class: 'widget' });
  el.append(box);
  mountWidget(card.widget, box, card.config ?? {});
  return { kind: 'info' };
}

// ---------- mcq ----------
function mcq(card, el) {
  header(card, el);
  el.append(h('div', { class: 'prose', html: md(card.prompt) }));
  const multi = !!card.multiple;
  if (multi) el.append(h('div', { class: 'hint-line' }, 'Select all that apply.'));

  const base = card.options.map((o, i) => ({ ...o, i }));
  const opts = card.shuffle === false ? base : shuffle(base);
  const ev = emitter();
  let selected = new Set();
  let locked = false;

  const btns = opts.map((o, k) => h('button', {
    class: 'option', type: 'button',
    html: `<span class="key">${k + 1}</span><span class="opt-text${card.richOptions ? ' prose' : ''}">${(card.richOptions ? md : mdInline)(o.text)}</span>`,
    onclick: () => select(k),
  }));
  el.append(h('div', { class: 'options' }, btns));

  function select(k) {
    if (locked || !btns[k] || btns[k].disabled) return;
    if (multi) selected.has(k) ? selected.delete(k) : selected.add(k);
    else selected = new Set([k]);
    btns.forEach((b, j) => b.classList.toggle('selected', selected.has(j)));
    ev.fire();
  }

  return {
    kind: 'question', select,
    ready: () => selected.size > 0,
    onChange: ev.on,
    check() {
      locked = true;
      btns.forEach(b => b.classList.remove('selected'));
      if (!multi) {
        const k = [...selected][0];
        const o = opts[k];
        btns[k].classList.add(o.correct ? 'correct' : 'wrong');
        return { correct: !!o.correct, feedback: o.feedback ?? '' };
      }
      const wrongPicks = [...selected].filter(k => !opts[k].correct);
      const missed = opts.filter((o, k) => o.correct && !selected.has(k));
      selected.forEach(k => btns[k].classList.add(opts[k].correct ? 'correct' : 'wrong'));
      const correct = wrongPicks.length === 0 && missed.length === 0;
      const notes = wrongPicks.map(k => opts[k].feedback).filter(Boolean);
      if (!correct && missed.length && !notes.length) notes.push('You missed at least one correct option.');
      return { correct, feedback: correct ? opts.filter(o => o.correct && o.feedback).map(o => o.feedback).join('\n\n') : notes.join('\n\n') };
    },
    correctMd: () => opts.filter(o => o.correct).map(o => `- ${o.text}`).join('\n'),
    showCorrect() { btns.forEach((b, k) => { if (opts[k].correct) b.classList.add('correct'); }); },
    retry() {
      btns.forEach((b, k) => {
        if (b.classList.contains('wrong') && !multi) { b.disabled = true; b.classList.add('struck'); }
        b.classList.remove('wrong', 'correct');
      });
      selected = new Set();
      locked = false;
      ev.fire();
    },
    reveal() {
      locked = true;
      btns.forEach((b, k) => {
        b.classList.remove('selected', 'struck', 'wrong');
        b.disabled = true;
        if (opts[k].correct) b.classList.add('correct');
      });
    },
  };
}

// ---------- numeric ----------
export function parseNumber(s) {
  const t = String(s).trim().replace(/\s+/g, '').replace(',', '.').replace(/^\+/, '').replace(/−/g, '-');
  if (!t) return null;
  const frac = t.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
  if (frac) return Number(frac[2]) === 0 ? null : Number(frac[1]) / Number(frac[2]);
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function numeric(card, el) {
  header(card, el);
  el.append(h('div', { class: 'prose', html: md(card.prompt) }));
  const ev = emitter();
  const input = h('input', {
    type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false',
    placeholder: card.placeholder ?? 'Your answer', 'aria-label': 'Your answer',
  });
  input.addEventListener('input', () => { input.classList.remove('wrong'); ev.fire(); });
  const row = h('div', { class: 'numeric-row' },
    card.label ? h('span', { html: mdInline(card.label) }) : null,
    input,
    card.unit ? h('span', { html: mdInline(card.unit) }) : null);
  // Phone decimal keypads have no minus or slash key: provide them.
  const keys = h('div', { class: 'numeric-keys' },
    ...[['−', 'minus sign'], ['/', 'fraction slash']].map(([ch, label]) => h('button', {
      type: 'button', class: 'numeric-key', 'aria-label': label,
      onmousedown: e => e.preventDefault(),
      onclick: () => {
        if (input.disabled) return;
        const a = input.selectionStart ?? input.value.length, b = input.selectionEnd ?? a;
        input.setRangeText(ch, a, b, 'end');
        input.dispatchEvent(new Event('input'));
        input.focus({ preventScroll: true });
      },
    }, ch)));
  el.append(row, keys, h('div', { class: 'hint-line' }, 'Fractions like 1/2 are fine.'));
  setTimeout(() => input.focus({ preventScroll: true }), 50);

  const tol = card.tolerance ?? 1e-6 * Math.max(1, Math.abs(card.answer));
  const near = (a, b, t = tol) => Math.abs(a - b) <= t;
  // A wrong value matches looser than the answer (0.5%, or its own tolerance),
  // so a rounded 1.36 still gets the feedback written for e/2.
  const wrongTol = w => w.tolerance ?? Math.max(tol, 0.005 * Math.max(1, Math.abs(w.value)));

  return {
    kind: 'question',
    ready: () => parseNumber(input.value) !== null,
    onChange: ev.on,
    check() {
      const v = parseNumber(input.value);
      input.disabled = true;
      const correct = near(v, card.answer);
      input.classList.add(correct ? 'correct' : 'wrong');
      const match = (card.wrong ?? []).find(w => near(v, w.value, wrongTol(w)));
      return { correct, feedback: correct ? '' : match?.feedback ?? card.hint ?? '' };
    },
    correctMd: () => `$${card.answerText ?? card.answer}$`,
    retry() { input.disabled = false; input.select(); ev.fire(); },
    reveal() {
      input.disabled = true;
      input.classList.remove('wrong');
      input.classList.add('correct');
      input.value = card.answerText ?? String(card.answer);
    },
  };
}

// ---------- build (tap tiles to assemble an expression) ----------
const norm = s => String(s).replace(/\s+/g, '');
const sameSeq = (a, b) => a.length === b.length && a.every((x, i) => norm(x) === norm(b[i]));

function build(card, el) {
  header(card, el);
  el.append(h('div', { class: 'prose', html: md(card.prompt) }));
  const ev = emitter();
  const order = card.shuffle === false ? card.tiles.map((_, i) => i) : shuffle(card.tiles.map((_, i) => i));
  let seq = [];
  let locked = false;

  const line = h('div', { class: 'build-line', 'aria-label': 'Your expression' });
  const bank = h('div', { class: 'tile-bank' });
  const bankBtns = new Map();
  for (const i of order) {
    const b = h('button', { class: 'tile', type: 'button', html: tex(card.tiles[i]), onclick: () => add(i) });
    bankBtns.set(i, b);
    bank.append(b);
  }
  const tools = h('div', { class: 'build-tools' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { if (!locked) { seq.pop(); paint(); } } }, '⌫ Undo'),
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { if (!locked) { seq = []; paint(); } } }, 'Clear'));
  el.append(line, bank, tools, h('div', { class: 'hint-line' }, 'Tap tiles to build the expression; tap a placed tile to remove it.'));

  function add(i) { if (locked || seq.includes(i)) return; seq.push(i); paint(); }
  function remove(pos) { if (locked) return; seq.splice(pos, 1); paint(); }

  function paint() {
    line.replaceChildren();
    if (card.prefix) line.append(h('span', { class: 'prefix', html: tex(card.prefix) }));
    seq.forEach((i, pos) => line.append(h('button', {
      class: 'tile placed', type: 'button', html: tex(card.tiles[i]), onclick: () => remove(pos),
    })));
    if (!seq.length) line.append(h('span', { class: 'placeholder' }, 'tap tiles below…'));
    if (card.suffix) line.append(h('span', { class: 'prefix', html: tex(card.suffix) }));
    bankBtns.forEach((b, i) => b.classList.toggle('used', seq.includes(i)));
    ev.fire();
  }
  paint();

  const current = () => seq.map(i => card.tiles[i]);

  return {
    kind: 'question',
    ready: () => seq.length > 0,
    onChange: ev.on,
    check() {
      locked = true;
      const got = current();
      const correct = card.answers.some(a => sameSeq(a, got));
      line.classList.add(correct ? 'correct' : 'wrong');
      const match = (card.wrong ?? []).find(w => sameSeq(w.answer, got));
      return { correct, feedback: correct ? '' : match?.feedback ?? card.hint ?? '' };
    },
    correctMd: () => `$$${[card.prefix, ...card.answers[0], card.suffix].filter(Boolean).join(' ')}$$`,
    retry() { locked = false; line.classList.remove('wrong'); },
    reveal() {
      const used = new Set();
      seq = card.answers[0].map(t => {
        const i = card.tiles.findIndex((x, j) => !used.has(j) && norm(x) === norm(t));
        used.add(i);
        return i;
      });
      locked = false; paint(); locked = true;
      line.classList.remove('wrong');
      line.classList.add('correct');
    },
  };
}

// ---------- order (tap steps into the right sequence) ----------
function order(card, el) {
  header(card, el);
  el.append(h('div', { class: 'prose', html: md(card.prompt) }));
  const ev = emitter();
  const n = card.steps.length;
  let pool = shuffle(card.steps.map((_, i) => i));
  while (n > 1 && pool.every((v, i) => v === i)) pool = shuffle(pool);
  let chosen = [];
  let locked = false;

  const chosenBox = h('div', { class: 'order-list' });
  const poolBox = h('div', { class: 'order-list pool' });
  el.append(h('div', { class: 'order-cols' },
    h('div', {}, h('div', { class: 'order-label' }, card.chosenLabel ?? 'Your order'), chosenBox),
    h('div', {}, h('div', { class: 'order-label' }, 'Tap to place next'), poolBox)));

  const stepBtn = (i, num, onclick) => h('button', { class: 'step', type: 'button', onclick },
    num ? h('span', { class: 'num' }, num) : null,
    h('span', { html: mdInline(card.steps[i]) }));

  function paint(marks = {}) {
    chosenBox.replaceChildren(...chosen.map((i, pos) => {
      const b = stepBtn(i, pos + 1, () => { if (!locked) { chosen.splice(pos, 1); pool.push(i); paint(); } });
      if (marks[pos]) b.classList.add(marks[pos]);
      b.disabled = locked;
      return b;
    }));
    if (!chosen.length) chosenBox.append(h('div', { class: 'hint-line' }, 'Empty — tap steps below in order.'));
    poolBox.replaceChildren(...pool.map((i, pos) => {
      const b = stepBtn(i, null, () => { if (!locked) { pool.splice(pos, 1); chosen.push(i); paint(); } });
      b.disabled = locked;
      return b;
    }));
    ev.fire();
  }
  paint();

  let firstWrong = -1;
  return {
    kind: 'question',
    ready: () => chosen.length === n,
    onChange: ev.on,
    check() {
      locked = true;
      firstWrong = chosen.findIndex((v, i) => v !== i);
      const marks = {};
      chosen.forEach((v, i) => { marks[i] = v === i ? 'correct' : 'wrong'; });
      paint(marks);
      const correct = firstWrong === -1;
      return { correct, feedback: correct ? '' : `Step ${firstWrong + 1} is out of place.${card.hint ? '\n\n' + card.hint : ''}` };
    },
    correctMd: () => card.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
    retry() {
      // Keep the correct prefix, send the rest back to the pool.
      locked = false;
      pool = shuffle([...pool, ...chosen.slice(firstWrong)]);
      chosen = chosen.slice(0, firstWrong);
      paint();
    },
    reveal() {
      locked = true;
      chosen = card.steps.map((_, i) => i);
      pool = [];
      paint(Object.fromEntries(chosen.map(i => [i, 'correct'])));
    },
  };
}

// ---------- content map (kind: map lessons, see content.js expandLesson) ----------
const SVG_NS = 'http://www.w3.org/2000/svg';
let mapSeq = 0;

// The map as a grid of boxes with arrows. Boxes before `filled` show as built
// (tap one to read its card), box `current` is the one being chosen, the rest
// are empty slots that only show their title.
function mapDiagram(map, { filled, current = -1 }) {
  const grid = h('div', { class: 'cmap', style: `grid-template-columns: repeat(${map.cols ?? 3}, minmax(0, 1fr))` });
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'cmap-edges');
  svg.setAttribute('aria-hidden', 'true');
  const marker = `cmap-arrow-${++mapSeq}`;
  const labels = h('div', { class: 'cmap-labels', 'aria-hidden': 'true' });
  if ((map.edges ?? []).some(e => e.label)) grid.classList.add('labeled');
  grid.append(svg, labels);
  const detail = h('div', { class: 'cmap-detail prose', hidden: true });

  const boxes = new Map();
  const index = new Map(map.nodes.map((n, k) => [n.id, k]));
  map.nodes.forEach((n, k) => {
    const state = k < filled ? 'filled' : k === current ? 'current' : 'empty';
    const b = h('button', {
      class: `cnode ${state}`, type: 'button', disabled: state !== 'filled',
      style: `grid-row: ${n.row}; grid-column: ${n.col} / span ${n.span ?? 1}`,
      html: `<span>${mdInline(n.title)}</span>${state === 'current' ? '<b class="q">?</b>' : ''}`,
      onclick: () => {
        const open = b.classList.contains('open');
        boxes.forEach(x => x.classList.remove('open'));
        if (open) { detail.hidden = true; return; }
        b.classList.add('open');
        detail.hidden = false;
        detail.innerHTML = `<h3>${mdInline(n.title)}</h3>${md(n.body)}`;
      },
    });
    boxes.set(n.id, b);
    grid.append(b);
  });

  // Arrows from the edge of one box to the edge of the other.
  function clip(r, toward) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const dx = toward.x - cx, dy = toward.y - cy;
    const t = Math.min(dx ? (r.w / 2 + 3) / Math.abs(dx) : Infinity, dy ? (r.h / 2 + 3) / Math.abs(dy) : Infinity);
    return { x: cx + dx * t, y: cy + dy * t };
  }
  function drawEdges() {
    const g = grid.getBoundingClientRect();
    if (!g.width) return;
    const rect = el => { const r = el.getBoundingClientRect(); return { x: r.left - g.left, y: r.top - g.top, w: r.width, h: r.height }; };
    svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
    svg.setAttribute('width', g.width);
    svg.setAttribute('height', g.height);
    labels.replaceChildren();
    svg.innerHTML = `<defs><marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>`;
    for (const e of map.edges ?? []) {
      const [a, b] = Array.isArray(e) ? e : [e.from, e.to];
      if (!boxes.has(a) || !boxes.has(b)) continue;
      const ra = rect(boxes.get(a)), rb = rect(boxes.get(b));
      const p = clip(ra, { x: rb.x + rb.w / 2, y: rb.y + rb.h / 2 });
      const q = clip(rb, { x: ra.x + ra.w / 2, y: ra.y + ra.h / 2 });
      const ka = index.get(a), kb = index.get(b);
      const built = ka < filled && kb < filled;
      const live = (ka < filled || ka === current) && (kb < filled || kb === current) && !built;
      const line = document.createElementNS(SVG_NS, 'line');
      Object.entries({ x1: p.x, y1: p.y, x2: q.x, y2: q.y }).forEach(([k, v]) => line.setAttribute(k, v));
      line.setAttribute('class', `cedge${built ? ' built' : live ? ' live' : ''}${e.dashed ? ' dashed' : ''}`);
      line.setAttribute('marker-end', `url(#${marker})`);
      svg.append(line);
      // An edge label sits on the middle of its arrow (in the gap between rows).
      if (e.label) labels.append(h('span', {
        class: `cedge-label${built ? ' built' : live ? ' live' : ''}`,
        style: `left: ${(p.x + q.x) / 2}px; top: ${(p.y + q.y) / 2}px`,
        html: mdInline(e.label),
      }));
    }
  }
  new ResizeObserver(drawEdges).observe(grid);
  return h('div', { class: 'cmap-wrap' }, grid, detail);
}

function mapstep(card, el) {
  el.append(mapDiagram(card.map, { filled: card.step, current: card.step }));
  return mcq({ ...card, richOptions: true }, el);
}

function mapview(card, el) {
  header(card, el);
  if (card.body) el.append(h('div', { class: 'prose', html: md(card.body) }));
  el.append(mapDiagram(card.map, { filled: card.filled }));
  if (card.filled) el.append(h('div', { class: 'hint-line' }, 'Tap a box to read its card.'));
  return { kind: 'info' };
}
