// Medals: achievements across every course, each with its own 8-bit picture.
//
// A category (lessons, accuracy, streaks, ...) holds one or more series; a
// series is a ladder of medals on one statistic ("lessons finished": 1, 10,
// 25, ...). Climbing a ladder changes the metal (bronze, silver, gold, gold
// with rays, emerald, ruby, legendary) and every series has its own symbol,
// so no two medals look alike. Course medals show the course's mascot on a coin.
//
// Statistics are computed from the progress store (so medals are retroactive);
// an earned medal is stored with the day it was earned (progress.award) and is
// kept even if a course later grows more lessons. Ids are "<category>:<name>"
// and must never change, since they are saved.

import { h } from './dom.js';
import { t, tn, lang } from './i18n.js';
import { getCatalog, getCourse } from './content.js';
import { progress } from './progress.js';
import { sounds } from './sound.js';
import { icons } from './icons.js';
import { themeButton } from './theme.js';
import { paintGrid, canvas, OUTLINE, SPRITES } from './pixel.js';
import { shareMedal } from './share.js';

export const PACE = 45; // seconds per card for a speed medal

// ---------- Symbols: 10 x 10 grids ----------
const SYMBOLS = {
  book: { pal: { W: '#fbfbff', g: '#9aa3b5', B: '#3f6fd8', b: '#2b4f9f' }, grid: [
    '..........',
    '.WWW..WWW.',
    'WWWWWWWWWW',
    'WggWWWWggW',
    'WWWWWWWWWW',
    'WggWWWWggW',
    'WWWWWWWWWW',
    'BBBBbbBBBB',
    '.BBB..BBB.',
    '..........'] },
  target: { pal: { R: '#e8414f', W: '#ffffff', Y: '#ffd23f' }, grid: [
    '...RRRR...',
    '.RRWWWWRR.',
    '.RWWRRWWR.',
    'RWWRRRRWWR',
    'RWRRYYRRWR',
    'RWRRYYRRWR',
    'RWWRRRRWWR',
    '.RWWRRWWR.',
    '.RRWWWWRR.',
    '...RRRR...'] },
  gem: { pal: { C: '#5ce1ff', c: '#1f9fc4', W: '#ffffff' }, grid: [
    '..........',
    '..CCCCCC..',
    '.CWCCCCcC.',
    'CWCCCCCCcc',
    'CCCCCCCCcc',
    '.cCCCCCCc.',
    '..cCCCCc..',
    '...cCCc...',
    '....cc....',
    '..........'] },
  flame: { pal: { R: '#e8412f', O: '#ff8a1f', Y: '#ffd23f', W: '#fff6c8' }, grid: [
    '....R.....',
    '....RR....',
    '...RRR..R.',
    '..RROR.RR.',
    '..ROORRRR.',
    '.RROYOORR.',
    '.ROYYYYOR.',
    '.ROYWWYOR.',
    '..ROYYOR..',
    '...RRRR...'] },
  bolt: { pal: { Y: '#ffd23f', y: '#e09a00' }, grid: [
    '......YY..',
    '.....YY...',
    '....YYy...',
    '...YYy....',
    '..YYYYYY..',
    '....YYy...',
    '...YYy....',
    '..YYy.....',
    '.YYy......',
    '.Y........'] },
  flag: { pal: { K: '#5a4a3a', R: '#e8414f', r: '#a8283a', W: '#ffffff', G: '#49b85c', g: '#2f8a42' }, grid: [
    '.KRRRRR...',
    '.KRRWRRRR.',
    '.KRWWWRRR.',
    '.KRRWRRr..',
    '.KRRr.....',
    '.K........',
    '.K....g...',
    '.K...gGg..',
    '.Kg.gGGGg.',
    'gGGgGGGGGg'] },
  map: { pal: { T: '#f1dca6', t: '#c9a965', K: '#7a5a3a', R: '#e8414f' }, grid: [
    'TTTttTTTtt',
    'TKTttTTTtt',
    'TTKttTRTRt',
    'TTTKtTTRtt',
    'TTTtKKRTRt',
    'TTTttTKTtt',
    'TTKKtTTKtt',
    'TKTttTTTtK',
    'TTTttTTTtt',
    'TTTttTTTtt'] },
  sword: { pal: { W: '#e8edf5', w: '#9aa6b8', Y: '#ffd23f', B: '#8a4fd8' }, grid: [
    '........WW',
    '.......WWw',
    '......WWw.',
    '.....WWw..',
    '.Y..WWw...',
    '..YWWw....',
    '...Yw.....',
    '..BBY.....',
    '.BB..Y....',
    'BB........'] },
  scroll: { pal: { T: '#f6ead0', t: '#c9b88a', K: '#7a6a55', R: '#e8414f', r: '#a8283a' }, grid: [
    '..........',
    '.TTTTTTTT.',
    'tTTTTTTTTt',
    '.TKKKKKKT.',
    '.TTTTTTTT.',
    '.TKKKKTTT.',
    '.TTTTTRRT.',
    'tTTTTRrRTt',
    '.TTTTTRR..',
    '......r.r.'] },
  star: { pal: { Y: '#ffd23f', y: '#e09a00', W: '#fff6c8' }, grid: [
    '....YY....',
    '....YY....',
    '...YWYY...',
    'YYYYWYYYYY',
    '.YYYYYYYy.',
    '..YYYYYy..',
    '..YYYyYy..',
    '.YYy..YYy.',
    '.Yy....Yy.',
    '..........'] },
  hourglass: { pal: { Y: '#b07a3a', W: '#cfe8ff', T: '#ffd23f' }, grid: [
    'YYYYYYYYYY',
    '.WTTTTTTW.',
    '..WTTTTW..',
    '...WTTW...',
    '....WW....',
    '...WTTW...',
    '..WWTTWW..',
    '.WTTTTTTW.',
    'YYYYYYYYYY',
    '..........'] },
  trophy: { pal: { Y: '#ffd23f', y: '#d99a00', W: '#fff6c8' }, grid: [
    '..YYYYYY..',
    'YYYWYYYyYY',
    'Y.YWYYYy.Y',
    'Y.YYYYYy.Y',
    '.YYYYYYyY.',
    '...YYYy...',
    '....Yy....',
    '....Yy....',
    '..yYYYYy..',
    '..yyyyyy..'] },
  globe: { pal: { B: '#3f8fe0', G: '#49b85c' }, grid: [
    '...BBBB...',
    '.BBGGBBBB.',
    '.BGGGGBGB.',
    'BBGGGBBGGB',
    'BBBGBBBGGB',
    'BBBBBBGGBB',
    'BBGGBBBGBB',
    '.BBGGBBBB.',
    '.BBBBGBBB.',
    '...BBBB...'] },
};

// ---------- Categories and series ----------
// T() only marks a string for translation (tools/i18n-check.mjs finds it); t() looks it up when it is shown.
const T = s => s;

export const CATEGORIES = [
  { id: 'lessons', name: T('Lessons'), icon: 'book', ribbon: ['#3f6fd8', '#9fc0ff'], blurb: T('Every lesson you finish, in any course.'),
    series: [{ key: '', stat: 'lessons', desc: n => n === 1 ? t('Finish your first lesson.') : t('Finish {n} lessons.', { n }),
      ladder: [[1, T('First Steps')], [10, T('Curious Mind')], [25, T('Bookworm')], [50, T('Scholar')], [100, T('Sage')], [250, T('Polymath')], [500, T('Living Library')]] }] },
  { id: 'accuracy', name: T('Accuracy'), icon: 'target', ribbon: ['#e8414f', '#ffd0d4'], blurb: T('Lessons finished with a high first-try score on their first run.'),
    series: [
      { key: 'sharp', stat: 'sharp', desc: n => tn('Finish a lesson with 90% or more right on the first try.', 'Finish {n} lessons with 90% or more right on the first try.', n),
        ladder: [[1, T('Good Aim')], [10, T('Sharpshooter')], [25, T('Marksman')], [100, T('Eagle Eye')]] },
      { key: 'flawless', stat: 'flawless', icon: 'gem', from: 2, desc: n => tn('Finish a lesson with every question right on the first try.', 'Finish {n} lessons with every question right on the first try.', n),
        ladder: [[1, T('Clean Run')], [5, T('Spotless')], [25, T('Untouchable')], [100, T('Crystal Mind')]] }] },
  { id: 'streak', name: T('Streaks'), icon: 'flame', ribbon: ['#ff8a1f', '#ffe08a'], blurb: T('Days in a row with a lesson or a review, in any course.'),
    series: [{ key: '', stat: 'streak', desc: n => t('Study {n} days in a row.', { n }),
      ladder: [[3, T('Spark')], [7, T('Week on Fire')], [14, T('Fortnight Flame')], [30, T('Monthly Blaze')], [60, T('Wildfire')], [100, T('Eternal Flame')]] }] },
  { id: 'speed', name: 'Speed', icon: 'bolt', ribbon: ['#e0b000', '#fff3a8'], blurb: T('First runs played in one sitting, 90% or more right, under {pace} seconds a card.'),
    series: [{ key: '', stat: 'speedy', desc: n => tn('Finish a lesson on the first run in one sitting with 90% or more, under {pace} s a card.', 'Finish {n} lessons on the first run in one sitting with 90% or more, under {pace} s a card.', n, { pace: PACE }),
      ladder: [[1, T('Quick Study')], [5, T('Lightning Mind')], [25, T('Speed of Light')]] }] },
  { id: 'levels', name: T('Levels'), icon: 'flag', ribbon: ['#2f8a42', '#a6f0b4'], blurb: T('Levels with every lesson done.'),
    series: [{ key: '', stat: 'levels', desc: n => tn('Clear every lesson of a level.', 'Clear every lesson of {n} levels.', n),
      ladder: [[1, T('Level Up')], [5, T('Climber')], [10, T('Summiteer')], [25, T('Grand Explorer')]] }] },
  { id: 'maps', name: T('Content maps'), icon: 'map', ribbon: ['#b5853f', '#f1dca6'], blurb: T('Concept maps rebuilt box by box.'),
    series: [{ key: '', stat: 'maps', desc: n => tn('Rebuild a content map.', 'Rebuild {n} content maps.', n),
      ladder: [[1, T('Cartographer')], [5, T('Pathfinder')], [10, T('Atlas Maker')], [25, T('Mapmaster')]] }] },
  { id: 'challenges', name: T('Challenges'), icon: 'sword', ribbon: ['#8a4fd8', '#d9c2ff'], blurb: T('Level challenges: the hardest problems of each level.'),
    series: [{ key: '', stat: 'challenges', desc: n => tn('Beat a level challenge.', 'Beat {n} level challenges.', n),
      ladder: [[1, T('Challenger')], [5, T('Gladiator')], [10, T('Champion')], [25, T('Legend')]] }] },
  { id: 'exams', name: T('Exams'), icon: 'scroll', ribbon: ['#a8283a', '#f6ead0'], blurb: T('Timed exams, scored on submit.'),
    series: [
      { key: 'pass', stat: 'passed', desc: n => tn('Score 50% or more on an exam.', 'Score 50% or more on {n} exams.', n),
        ladder: [[1, T('Exam Passed')], [3, T('Exam Veteran')], [6, T('Examiner')]] },
      { key: 'ace', stat: 'aced', icon: 'star', from: 3, desc: n => tn('Score 90% or more on an exam.', 'Score 90% or more on {n} exams.', n),
        ladder: [[1, T('Top Marks')], [3, T('Summa cum Laude')]] }] },
  { id: 'memory', name: T('Memory'), icon: 'hourglass', ribbon: ['#1f9fc4', '#cfe8ff'], blurb: T('Spaced-repetition reviews and recaps finished.'),
    series: [{ key: '', stat: 'memory', desc: n => tn('Finish a review or recap session.', 'Finish {n} review or recap sessions.', n),
      ladder: [[1, T('Remember Me')], [10, T('Memory Keeper')], [50, T('Elephant')], [100, T('Total Recall')]] }] },
  { id: 'courses', name: T('Courses'), icon: 'trophy', ribbon: ['#d99a00', '#fff3a8'], blurb: T('Whole courses finished, and courses explored.'),
    series: [{ key: 'explorer', stat: 'started', icon: 'globe', desc: n => t('Finish a lesson in {n} different courses.', { n }),
      ladder: [[2, T('Wanderer')], [3, T('Globetrotter')], [5, T('Renaissance Mind')]] }] },
];
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
export const categoryOf = id => id.split(':')[0];

// Metals by rank: base, highlight, shadow; `rays` adds a starburst.
const METALS = [
  { base: '#cd7f3e', hi: '#f0b07a', lo: '#8a4b1f' },
  { base: '#b7c0cb', hi: '#f1f4f8', lo: '#77818f' },
  { base: '#f2b632', hi: '#ffe58a', lo: '#a9740b' },
  { base: '#f2b632', hi: '#ffe58a', lo: '#a9740b', rays: true },
  { base: '#38c172', hi: '#a6f5c6', lo: '#1f7a46', rays: true },
  { base: '#e04a5f', hi: '#ff9fae', lo: '#8e1f33', rays: true },
  { base: '#5b3bd1', hi: '#c7b8ff', lo: '#2c1a7a', rays: true, rainbow: true },
];
const rankOf = (idx, n, from = 0) => (n === 1 ? Math.max(2, from) : from + Math.round((idx * (6 - from)) / (n - 1)));
export const METAL_NAMES = [T('Bronze'), T('Silver'), T('Gold'), T('Radiant gold'), T('Emerald'), T('Ruby'), T('Legendary')];

// Every medal, in display order (course medals come from the catalog).
export async function allMedals() {
  const catalog = await getCatalog();
  const list = [];
  for (const cat of CATEGORIES) {
    for (const s of cat.series) {
      s.ladder.forEach(([need, name], idx) => list.push({
        id: `${cat.id}:${s.key ? `${s.key}-` : ''}${need}`, cat: cat.id, name: t(name), need, stat: s.stat, desc: s.desc(need),
        icon: s.icon ?? cat.icon, rank: rankOf(idx, s.ladder.length, s.from),
      }));
    }
    if (cat.id === 'courses') {
      for (const c of catalog.courses.filter(c => c.status !== 'planned')) list.push({
        id: `courses:${c.id}`, cat: 'courses', name: t('{course} Master', { course: c.short ?? c.title }), need: 1, stat: `course:${c.id}`,
        desc: t('Finish every lesson of {course}.', { course: c.title }), mascot: c.mascot, hue: c.hue ?? 0, rank: 3,
      });
    }
  }
  return list;
}

// ---------- Statistics from the progress store ----------
async function facts() {
  const catalog = await getCatalog();
  const recs = progress.allLessons();
  const f = { lessons: 0, sharp: 0, flawless: 0, speedy: 0, levels: 0, maps: 0, challenges: 0, passed: 0, aced: 0, started: 0 };
  for (const c of catalog.courses.filter(c => c.status !== 'planned')) {
    let course;
    try { course = await getCourse(c.id); } catch { continue; }
    let started = false, complete = true;
    for (const level of course.levels) {
      const counted = (level.lessons ?? []).filter(m => m.kind !== 'review');
      let cleared = counted.length > 0;
      for (const m of counted) {
        const r = recs[`${c.id}:${m.id}`];
        if (!m.file || !r?.done) { cleared = false; complete = false; continue; }
        started = true;
        if (r.known) continue; // marked as known: counts for levels and courses, not for score medals
        f.lessons++;
        const first = r.first ?? r.score ?? r.best ?? 0;
        if (m.kind === 'exam') { if (first >= 0.5) f.passed++; if (first >= 0.9) f.aced++; continue; }
        if (m.kind === 'map') f.maps++;
        if (m.kind === 'challenge') f.challenges++;
        if ((r.q ?? 1) > 0) { if (first >= 0.9) f.sharp++; if (first >= 0.9999) f.flawless++; }
        if (r.pace != null && r.pace <= PACE && first >= 0.9) f.speedy++;
      }
      if (cleared) f.levels++;
    }
    if (started) f.started++;
    f[`course:${c.id}`] = complete && started ? 1 : 0;
  }
  const n = progress.counts();
  f.memory = (n.reviews ?? 0) + (n.recaps ?? 0);
  f.streak = progress.bestStreak();
  return f;
}

// Award every medal whose goal is met; returns the newly earned ones and the
// full list with each medal's current value.
export async function checkMedals() {
  const [list, f] = await Promise.all([allMedals(), facts()]);
  for (const m of list) m.value = f[m.stat] ?? 0;
  const fresh = new Set(progress.award(list.filter(m => m.value >= m.need).map(m => m.id)));
  return { list, fresh: list.filter(m => fresh.has(m.id)) };
}

// ---------- Art ----------
const MW = 28, MH = 38, CX = 14, CY = 23, R = 10.5;

function outlinePass(c) {
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
  const a = (x, y) => x >= 0 && y >= 0 && x < c.width && y < c.height && d[(y * c.width + x) * 4 + 3] > 0;
  const add = [];
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++)
    if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) add.push([x, y]);
  ctx.fillStyle = OUTLINE;
  for (const [x, y] of add) ctx.fillRect(x, y, 1, 1);
}

const rainbow = ang => `hsl(${Math.round(((ang / (2 * Math.PI)) * 360 + 360) % 360)} 90% 62%)`;
const HUES = ['#7b93ff', '#41b883', '#f08a4b', '#c46bd8', '#3fb5c8', '#e0b000'];

function drawMedal(m) {
  const c = canvas(MW, MH), ctx = c.getContext('2d');
  const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); };
  const metal = METALS[Math.min(m.rank, METALS.length - 1)];
  const [r1, r2] = CAT[m.cat].ribbon;
  // Ribbon: two straps meeting in a V behind the disc, a light stripe down each.
  for (let y = 1; y <= 14; y++) {
    const off = Math.floor(y / 2);
    for (let x = 3 + off; x <= 8 + off; x++) px(MW - 1 - x, y, x === 5 + off || x === 6 + off ? r2 : r1);
    for (let x = 3 + off; x <= 8 + off; x++) px(x, y, x === 5 + off || x === 6 + off ? r2 : r1);
  }
  // Disc, rim shading and (higher ranks) rays.
  const disc = (rimOnly) => {
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const dx = x + 0.5 - CX, dy = y + 0.5 - CY, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
      const ray = metal.rays && Math.cos(8 * ang) > 0.55 && d <= R + 2.2;
      if (d > R && !ray) continue;
      if (d > R) { if (!rimOnly) px(x, y, metal.rainbow ? rainbow(ang) : Math.cos(8 * ang) > 0.85 ? metal.hi : metal.base); continue; }
      const rim = d > R - 1.6, gloss = d > R - 3.6 && d < R - 2.4 && ang < -Math.PI / 4 && ang > -Math.PI * 0.8;
      if (rimOnly && !rim) continue;
      if (rim) px(x, y, metal.rainbow ? rainbow(ang) : dx + dy < 0 ? metal.hi : metal.lo);
      else px(x, y, gloss ? metal.hi : m.mascot ? HUES[m.hue % 6] : metal.base);
    }
  };
  disc(false);
  if (m.mascot && SPRITES[m.mascot]) {
    // Course coin: the mascot's head and shoulders, clipped to the disc.
    const s = SPRITES[m.mascot];
    ctx.save();
    ctx.beginPath(); ctx.arc(CX, CY, R - 1.4, 0, 2 * Math.PI); ctx.clip();
    paintGrid(ctx, s.pal, s.body.slice(0, 14), CX - 9, CY - 9);
    ctx.restore();
    disc(true);
  } else {
    const sym = SYMBOLS[m.icon];
    paintGrid(ctx, sym.pal, sym.grid, CX - 6, CY - 6);
  }
  outlinePass(c);
  return c;
}

const urls = new Map();
const cached = (key, draw) => { if (!urls.has(key)) urls.set(key, draw().toDataURL()); return urls.get(key); };
const pixImg = (src, w, hgt, cls, alt = '') => h('img', { src, width: w, height: hgt, class: `pix ${cls}`, alt, draggable: 'false' });

// The medal's picture as a fresh canvas (share cards scale it up).
export const medalCanvas = m => drawMedal(m);

export const medalImg = (m, scale = 3) => pixImg(cached(m.id, () => drawMedal(m)), MW * scale, MH * scale, 'medal-art', m.name);

// A category's symbol alone (12 x 12 with its outline), for the counters.
export function categoryIcon(catId, scale = 2) {
  const sym = SYMBOLS[CAT[catId].icon];
  return pixImg(cached(`icon:${catId}`, () => { const c = canvas(12, 12); paintGrid(c.getContext('2d'), sym.pal, sym.grid, 0, 0); return c; }), 12 * scale, 12 * scale, 'cat-icon');
}

// ---------- UI ----------

// Counters under the home and trail headers: one symbol per category with the medals earned.
export function medalBar() {
  const earned = Object.keys(progress.medals());
  const count = id => earned.filter(m => categoryOf(m) === id).length;
  return h('a', { class: 'medal-bar', href: '#/medals', 'aria-label': t('Medals: {n} earned', { n: earned.length }) },
    h('span', { class: 'mb-label' }, t('Medals')),
    CATEGORIES.map(c => h('span', { class: `mb-item${count(c.id) ? '' : ' none'}`, 'data-tip': t('{category} medals', { category: t(c.name) }) },
      categoryIcon(c.id), h('b', {}, String(count(c.id))))));
}

// A pop-up for each medal just earned (one summary when there are many).
export function showNewMedals(fresh) {
  if (!fresh?.length) return;
  let box = document.querySelector('.medal-toasts');
  if (!box) { box = h('div', { class: 'medal-toasts', 'aria-live': 'polite' }); document.body.append(box); }
  const items = fresh.length > 3
    ? [{ m: fresh[fresh.length - 1], title: t('{n} new medals!', { n: fresh.length }), text: t('Open the medal room to see them all.') }]
    : fresh.map(m => ({ m, title: t('New medal: {name}', { name: m.name }), text: m.desc }));
  sounds.medal?.();
  items.forEach(({ m, title, text }, k) => {
    const toast = h('a', { class: 'medal-toast', href: '#/medals', style: `animation-delay:${k * 0.25}s` },
      medalImg(m, 1.5), h('span', {}, h('b', {}, title), h('small', {}, text)));
    box.append(toast);
    setTimeout(() => toast.classList.add('out'), 5200 + k * 400);
    setTimeout(() => toast.remove(), 5800 + k * 400);
  });
}

// Check for new medals and pop them up (fire and forget).
export const medalCheck = () => checkMedals().then(r => showNewMedals(r.fresh)).catch(err => console.error(err));

const dayText = d => new Date(d * 86400000).toLocaleDateString(lang(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });

// The medal room (#/medals).
export async function renderMedals(root) {
  const { list, fresh } = await checkMedals();
  const earned = progress.medals();
  const nEarned = list.filter(m => m.id in earned).length;
  const top = h('header', { class: 'topbar' },
    h('a', { class: 'academy-link', href: '#/', html: `${icons.back}<span>Gibernoot Academy</span>` }),
    h('h1', { class: 'course-title', 'data-hue': 0 }, t('Medal Room')),
    h('div', { class: 'course-sub' }, t('{n} of {total} medals earned. Go collect them all!', { n: nEarned, total: list.length }) + (nEarned ? ` ${t('Tap an earned medal to share it.')}` : '')),
    h('div', { class: 'toolbar' }, themeButton(h)));
  const sections = CATEGORIES.map(cat => {
    const ms = list.filter(m => m.cat === cat.id);
    const got = ms.filter(m => m.id in earned).length;
    return h('section', { class: 'medal-cat' },
      h('div', { class: 'medal-cat-head' }, categoryIcon(cat.id, 3),
        h('div', {}, h('h2', {}, t(cat.name)), h('p', {}, t(cat.blurb, { pace: PACE }))),
        h('span', { class: 'medal-cat-count' }, `${got}/${ms.length}`)),
      h('div', { class: 'medal-grid' }, ms.map(m => {
        const have = m.id in earned;
        const share = () => shareMedal(m, earned[m.id]);
        return h('div', { class: `medal${have ? ' shareable' : ' locked'}${fresh.includes(m) ? ' fresh' : ''}`,
          ...(have ? { role: 'button', tabindex: 0, 'data-tip': t('Tap to share this medal'), onclick: share, onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); share(); } } } : {}) },
          medalImg(m, 2.5),
          h('div', { class: 'm-name' }, m.name),
          h('div', { class: 'm-desc' }, m.desc),
          have ? h('div', { class: 'm-when' }, `${t(METAL_NAMES[m.rank])} · ${dayText(earned[m.id])}`)
            : h('div', { class: 'm-progress' },
              h('div', { class: 'meter' }, h('div', { style: `width:${Math.min(100, (100 * m.value) / m.need)}%` })),
              h('span', {}, `${Math.min(m.value, m.need)} / ${m.need}`)));
      })));
  });
  root.replaceChildren(h('div', { class: 'trail medals-page' }, top, sections));
  showNewMedals(fresh);
}
