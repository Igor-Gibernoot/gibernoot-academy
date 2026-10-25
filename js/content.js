// Loads the course catalog (courses/catalog.yaml) and, for the current course,
// its course map and lesson files from courses/<id>/.

import { courseId } from './course.js';

const cache = new Map();

function loadYaml(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(`courses/${path}`, { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error(`courses/${path}: HTTP ${r.status}`); return r.text(); })
      .then(t => jsyaml.load(t)));
  }
  return cache.get(path);
}

export const getCatalog = () => loadYaml('catalog.yaml');

export const QUESTION_TYPES = ['mcq', 'numeric', 'build', 'order', 'mapstep'];
export const isQuestion = card => QUESTION_TYPES.includes(card.type);

export const getCourse = (id = courseId()) => loadYaml(`${id}/course.yaml`);

// Every lesson entry of the course, in trail order, with its level attached.
export async function allLessons() {
  const course = await getCourse();
  return course.levels.flatMap(level => (level.lessons ?? []).map(meta => ({ level, meta })));
}

export async function getLesson(id) {
  const entry = (await allLessons()).find(e => e.meta.id === id);
  if (!entry) throw new Error(`No lesson with id "${id}" in course.yaml.`);
  if (!entry.meta.file) return { ...entry, data: null };
  return { ...entry, data: expandLesson(await loadYaml(`${courseId()}/${entry.meta.file}`)) };
}

export async function nextLessonAfter(id) {
  const list = (await allLessons()).filter(e => e.meta.file);
  const i = list.findIndex(e => e.meta.id === id);
  return i >= 0 ? list[i + 1] ?? null : null;
}

// A content-map lesson (kind: map) is written as a graph of nodes and edges;
// it plays as cards: an intro, one "which card goes here?" step per node (in
// the order listed), and the finished map.
export function expandLesson(data) {
  if (data?.own && data.cards?.length) data = withOwn(data);
  if (data?.kind !== 'map' || data.cards) return data;
  const cards = [{ type: 'mapview', id: 'intro', title: data.introTitle ?? 'Build the map', body: data.intro, map: data, filled: 0 }];
  data.nodes.forEach((n, k) => cards.push({
    type: 'mapstep', id: `node-${n.id}`, map: data, step: k,
    prompt: n.prompt ?? `Content map of **${data.name}**: which card belongs in the **${n.title}** box?`,
    options: [{ text: n.body, correct: true }, ...(n.decoys ?? []).map(d => ({ text: d.body, feedback: d.feedback }))],
    explanation: n.explanation,
  }));
  cards.push({ type: 'mapview', id: 'complete', title: data.outroTitle ?? 'Your map', body: data.outro, map: data, filled: data.nodes.length });
  return { ...data, cards };
}

// "What you now own" (`own:` on a concept lesson): Markdown whose key
// expressions are marked {{ … }}. The lesson's last card (a text card) shows it
// with the markers stripped, followed by that card's own body (the teaser);
// the recap hides some marked spans. Markers inside $…$ are TeX braces.
const MATH = /\$\$([\s\S]+?)\$\$|\$((?:\\\$|[^$\n])+?)\$/g; // as in render.js

// A blank's key is a hash of its normalized text, so edits elsewhere in the
// summary keep its progress, and a repeated expression is one item.
export function blankHash(s) {
  let x = 0x811c9dc5;
  for (const c of String(s).trim().replace(/\s+/g, ' ')) x = Math.imul(x ^ c.codePointAt(0), 0x01000193) >>> 0;
  return x.toString(36);
}

// Splits `own` into text strings and { blank, key } segments; errors lists
// unbalanced or nested markers.
export function ownParts(src) {
  const math = [];
  const text = String(src ?? '').replace(MATH, m => `\u0001${math.push(m) - 1}\u0002`);
  const back = s => s.replace(/\u0001(\d+)\u0002/g, (_, n) => math[+n]);
  const parts = [], errors = [];
  let open = -1, last = 0;
  for (const m of text.matchAll(/\{\{|\}\}/g)) {
    if (m[0] === '{{') {
      if (open >= 0) { errors.push('nested {{ inside a blank'); continue; }
      parts.push(back(text.slice(last, m.index)));
      open = m.index + 2;
    } else {
      if (open < 0) { errors.push('}} without a matching {{'); continue; }
      const blank = back(text.slice(open, m.index)).trim();
      parts.push({ blank, key: blankHash(blank) });
      open = -1; last = m.index + 2;
    }
  }
  if (open >= 0) { errors.push('{{ without a matching }}'); last = open - 2; }
  parts.push(back(text.slice(last)));
  return { parts: parts.filter(p => p !== ''), errors };
}

export const stripOwn = src => ownParts(src).parts.map(p => typeof p === 'string' ? p : p.blank).join('');

function withOwn(data) {
  const cards = [...data.cards];
  const end = cards[cards.length - 1];
  if (end.type !== 'text') return data;
  cards[cards.length - 1] = { ...end, title: end.title ?? 'What you now own', body: stripOwn(data.own) + (end.body ? `\n\n${end.body}` : '') };
  return { ...data, cards };
}
