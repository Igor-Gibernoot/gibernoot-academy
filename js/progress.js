// Progress lives in localStorage (per browser/device). Export/import codes
// move it between devices.
//
// Spaced repetition: every question card gets a Leitner box. Box b is due
// INTERVALS[b] days after it was last answered; a miss sends it back to box 0
// (due today), a correct review promotes it one box.
//
// Recap items (the {{ }} blanks of "what you now own" summaries, keyed
// "<lessonId>#<hash>") share the same boxes: "knew it" promotes one box,
// "missed" sends the item back to box 0 and counts a lapse.
//
// One state holds every course: lesson, card, recap and partial keys start
// with "<courseId>:" (version 2). The API takes keys without the prefix and
// works on the current course (course.js); the streak is shared.

import { courseId, LEGACY_COURSE } from './course.js';

const KEY = 'gibernoot.progress.v2';
const OLD_KEY = 'dg2gr.progress.v1'; // single-course app; left in place as a backup
const INTERVALS = [0, 1, 3, 7, 16, 35];

const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
const blank = () => ({ version: 2, epoch: 0, lessons: {}, cards: {}, recap: {}, partial: {}, streak: { count: 0, last: null } });

// Keys without a course prefix come from version 1 (before courses existed,
// or an old tab still open somewhere) and belong to the first course; a
// prefixed copy of the same key wins.
function migrate(s) {
  const pre = obj => {
    const out = {};
    for (const [key, v] of Object.entries(obj ?? {})) if (key.includes(':')) out[key] = v;
    for (const [key, v] of Object.entries(obj ?? {})) if (!key.includes(':')) out[`${LEGACY_COURSE}:${key}`] ??= v;
    return out;
  };
  return { ...s, version: 2, lessons: pre(s.lessons), cards: pre(s.cards), recap: pre(s.recap), partial: pre(s.partial) };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY));
    return s && s.lessons && s.cards ? migrate({ recap: {}, partial: {}, ...s }) : blank();
  } catch { return blank(); }
}

// Current-course key, and the reverse.
const k = id => `${courseId()}:${id}`;
const mine = key => key.startsWith(`${courseId()}:`);
const strip = key => key.slice(key.indexOf(':') + 1);

let state = load();

const listeners = new Set();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep in memory */ }
  listeners.forEach(fn => fn(state));
}

// Merge two progress states without losing anything either side learned:
// lessons keep the best score and run count (latest run wins `score`/`last`),
// cards keep whichever side answered them most recently, streak keeps the
// more recent day.
function merge(a, b) {
  // A reset (or import) starts a new epoch; the newer epoch replaces older data entirely.
  const ea = a.epoch ?? 0, eb = b.epoch ?? 0;
  if (ea !== eb) return structuredClone(ea > eb ? a : b);
  const out = blank();
  out.epoch = ea;
  for (const id of new Set([...Object.keys(a.lessons), ...Object.keys(b.lessons)])) {
    const x = a.lessons[id], y = b.lessons[id];
    if (!x || !y) { out.lessons[id] = x ?? y; continue; }
    const newer = (y.last ?? 0) > (x.last ?? 0) ? y : x;
    out.lessons[id] = { ...newer, done: x.done || y.done, best: Math.max(x.best ?? 0, y.best ?? 0), runs: Math.max(x.runs ?? 0, y.runs ?? 0), first: x.first ?? y.first };
  }
  for (const k of new Set([...Object.keys(a.cards), ...Object.keys(b.cards)])) {
    const x = a.cards[k], y = b.cards[k];
    out.cards[k] = !x ? y : !y ? x : (y.at ?? 0) > (x.at ?? 0) ? y : x;
  }
  for (const k of new Set([...Object.keys(a.recap ?? {}), ...Object.keys(b.recap ?? {})])) {
    const x = a.recap?.[k], y = b.recap?.[k];
    out.recap[k] = !x ? y : !y ? x : (y.at ?? 0) > (x.at ?? 0) ? y : x;
  }
  // Position inside an unfinished lesson: the most recent save wins (`at: null` = cleared).
  for (const k of new Set([...Object.keys(a.partial ?? {}), ...Object.keys(b.partial ?? {})])) {
    const x = a.partial?.[k], y = b.partial?.[k];
    out.partial[k] = !x ? y : !y ? x : (y.t ?? 0) > (x.t ?? 0) ? y : x;
  }
  const sa = a.streak, sb = b.streak;
  out.streak = (sb.last ?? -1) > (sa.last ?? -1) || ((sb.last ?? -1) === (sa.last ?? -1) && sb.count > sa.count) ? { ...sb } : { ...sa };
  return out;
}

function bumpStreak() {
  const d = today(), s = state.streak;
  if (s.last === d) return;
  s.count = s.last === d - 1 ? s.count + 1 : 1;
  s.last = d;
}

function schedule(key, box) {
  state.cards[key] = { box, due: today() + INTERVALS[box], at: Date.now() };
}

export const progress = {
  lesson: id => state.lessons[k(id)],

  // Lessons done, review cards due and average first-try accuracy of any course (for the course list).
  courseStats(course, ids) {
    const recs = ids.map(id => state.lessons[`${course}:${id}`]).filter(r => r?.done);
    const scores = recs.map(r => r.first ?? r.score ?? r.best);
    const due = Object.entries(state.cards).filter(([key, c]) => key.startsWith(`${course}:`) && c.due <= today()).length;
    return { done: recs.length, due, acc: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
  },

  completeLesson(lessonId, { questions, firstTry }) {
    const id = k(lessonId);
    const prev = state.lessons[id];
    const score = questions ? firstTry / questions : 1;
    state.lessons[id] = {
      done: true,
      score, // latest run
      first: prev ? (prev.first ?? prev.score ?? score) : score, // first run: what the trail accuracy uses
      best: Math.max(score, prev?.best ?? 0),
      runs: (prev?.runs ?? 0) + 1,
      last: today(),
    };
    state.partial[id] = { at: null, t: Date.now() };
    bumpStreak();
    save();
  },

  // Where the reader stopped in an unfinished lesson: { at: 0-based card, n: cards }, or undefined.
  partial: id => {
    const p = state.partial[k(id)];
    return p && p.at > 0 ? p : undefined;
  },

  // `extra` ({ stats, combo, answered }) lets a resumed lesson show earlier answers and keep its score.
  savePartial(id, at, n, extra) {
    state.partial[k(id)] = { at, n, ...extra, t: Date.now() };
    save();
  },

  // A question answered inside a lesson enters the review deck.
  recordLessonCard(key, firstTry) {
    const c = state.cards[k(key)];
    if (!c || !firstTry) schedule(k(key), firstTry ? 1 : 0);
    save();
  },

  recordReview(key, correct) {
    const box = correct ? Math.min((state.cards[k(key)]?.box ?? 0) + 1, INTERVALS.length - 1) : 0;
    schedule(k(key), box);
    save();
  },

  finishReview() { bumpStreak(); save(); },

  // Recap items: undefined until first rated.
  recapItem: key => state.recap[k(key)],
  recapDue: key => !state.recap[k(key)] || state.recap[k(key)].due <= today(),

  recordRecap(recapKey, knew) {
    const key = k(recapKey);
    const prev = state.recap[key];
    const box = knew ? Math.min((prev?.box ?? 0) + 1, INTERVALS.length - 1) : 0;
    state.recap[key] = { box, due: today() + INTERVALS[box], at: Date.now(), lapses: (prev?.lapses ?? 0) + (knew ? 0 : 1), last: knew ? 'knew' : 'missed' };
    save();
  },

  // Average first-try accuracy (first run; replays don't change it) over the finished lessons among ids.
  accuracy(ids) {
    const scores = ids.map(id => state.lessons[k(id)]).filter(r => r?.done).map(r => r.first ?? r.score ?? r.best);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  },

  // Review-deck keys belonging to the given lessons, most urgent first:
  // due cards, then the weakest box, then the earliest due date.
  deckKeys(lessonIds) {
    const set = new Set(lessonIds.map(k));
    return Object.entries(state.cards)
      .filter(([key]) => set.has(key.split('/')[0]))
      .sort(([, a], [, b]) => (a.due <= today() ? 0 : 1) - (b.due <= today() ? 0 : 1) || a.box - b.box || a.due - b.due)
      .map(([key]) => strip(key));
  },

  dueKeys() {
    const d = today();
    return Object.entries(state.cards).filter(([key, c]) => mine(key) && c.due <= d).map(([key]) => strip(key));
  },

  streak() {
    const s = state.streak;
    return s.last != null && s.last >= today() - 1 ? s.count : 0;
  },

  // Cloud sync hooks (see cloud.js).
  snapshot: () => state,
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  // Combine a remote state into the local one; returns the merged state.
  mergeRemote(remote) {
    if (!remote || !remote.lessons || !remote.cards) return state;
    state = merge(state, migrate({ streak: { count: 0, last: null }, partial: {}, ...remote }));
    save();
    return state;
  },

  exportCode: () => btoa(unescape(encodeURIComponent(JSON.stringify(state)))),

  importCode(code) {
    const s = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!s || !s.lessons || !s.cards) throw new Error('Not a progress code.');
    state = { ...migrate({ recap: {}, partial: {}, ...s }), epoch: Date.now() };
    save();
  },

  reset() { state = { ...blank(), epoch: Date.now() }; save(); },
};
