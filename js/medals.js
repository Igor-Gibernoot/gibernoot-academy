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
import { getCatalog, getCourse } from './content.js';
import { progress } from './progress.js';
import { sounds } from './sound.js';
import { icons } from './icons.js';
import { themeButton } from './theme.js';
import { paintGrid, canvas, OUTLINE, SPRITES } from './pixel.js';

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
const plural = (n, one, many) => (n === 1 ? one : `${n} ${many}`);

export const CATEGORIES = [
  { id: 'lessons', name: 'Lessons', icon: 'book', ribbon: ['#3f6fd8', '#9fc0ff'], blurb: 'Every lesson you finish, in any course.',
    series: [{ key: '', stat: 'lessons', desc: n => `Finish ${plural(n, 'your first lesson', 'lessons')}.`,
      ladder: [[1, 'First Steps'], [10, 'Curious Mind'], [25, 'Bookworm'], [50, 'Scholar'], [100, 'Sage'], [250, 'Polymath'], [500, 'Living Library']] }] },
  { id: 'accuracy', name: 'Accuracy', icon: 'target', ribbon: ['#e8414f', '#ffd0d4'], blurb: 'Lessons finished with a high first-try score on their first run.',
    series: [
      { key: 'sharp', stat: 'sharp', desc: n => `Finish ${plural(n, 'a lesson', 'lessons')} with 90% or more right on the first try.`,
        ladder: [[1, 'Good Aim'], [10, 'Sharpshooter'], [25, 'Marksman'], [100, 'Eagle Eye']] },
      { key: 'flawless', stat: 'flawless', icon: 'gem', from: 2, desc: n => `Finish ${plural(n, 'a lesson', 'lessons')} with every question right on the first try.`,
        ladder: [[1, 'Clean Run'], [5, 'Spotless'], [25, 'Untouchable'], [100, 'Crystal Mind']] }] },
  { id: 'streak', name: 'Streaks', icon: 'flame', ribbon: ['#ff8a1f', '#ffe08a'], blurb: 'Days in a row with a lesson or a review, in any course.',
    series: [{ key: '', stat: 'streak', desc: n => `Study ${n} days in a row.`,
      ladder: [[3, 'Spark'], [7, 'Week on Fire'], [14, 'Fortnight Flame'], [30, 'Monthly Blaze'], [60, 'Wildfire'], [100, 'Eternal Flame']] }] },
  { id: 'speed', name: 'Speed', icon: 'bolt', ribbon: ['#e0b000', '#fff3a8'], blurb: `First runs played in one sitting, 90% or more right, under ${PACE} seconds a card.`,
    series: [{ key: '', stat: 'speedy', desc: n => `Finish ${plural(n, 'a lesson', 'lessons')} on the first run in one sitting with 90% or more, under ${PACE} s a card.`,
      ladder: [[1, 'Quick Study'], [5, 'Lightning Mind'], [25, 'Speed of Light']] }] },
  { id: 'levels', name: 'Levels', icon: 'flag', ribbon: ['#2f8a42', '#a6f0b4'], blurb: 'Levels with every lesson done.',
    series: [{ key: '', stat: 'levels', desc: n => `Clear every lesson of ${plural(n, 'a level', 'levels')}.`,
      ladder: [[1, 'Level Up'], [5, 'Climber'], [10, 'Summiteer'], [25, 'Grand Explorer']] }] },
  { id: 'maps', name: 'Content maps', icon: 'map', ribbon: ['#b5853f', '#f1dca6'], blurb: 'Concept maps rebuilt box by box.',
    series: [{ key: '', stat: 'maps', desc: n => `Rebuild ${plural(n, 'a content map', 'content maps')}.`,
      ladder: [[1, 'Cartographer'], [5, 'Pathfinder'], [10, 'Atlas Maker'], [25, 'Mapmaster']] }] },
  { id: 'challenges', name: 'Challenges', icon: 'sword', ribbon: ['#8a4fd8', '#d9c2ff'], blurb: 'Level challenges: the hardest problems of each level.',
    series: [{ key: '', stat: 'challenges', desc: n => `Beat ${plural(n, 'a level challenge', 'level challenges')}.`,
      ladder: [[1, 'Challenger'], [5, 'Gladiator'], [10, 'Champion'], [25, 'Legend']] }] },
  { id: 'exams', name: 'Exams', icon: 'scroll', ribbon: ['#a8283a', '#f6ead0'], blurb: 'Timed exams, scored on submit.',
    series: [
      { key: 'pass', stat: 'passed', desc: n => `Score 50% or more on ${plural(n, 'an exam', 'exams')}.`,
        ladder: [[1, 'Exam Passed'], [3, 'Exam Veteran'], [6, 'Examiner']] },
      { key: 'ace', stat: 'aced', icon: 'star', from: 3, desc: n => `Score 90% or more on ${plural(n, 'an exam', 'exams')}.`,
        ladder: [[1, 'Top Marks'], [3, 'Summa cum Laude']] }] },
  { id: 'memory', name: 'Memory', icon: 'hourglass', ribbon: ['#1f9fc4', '#cfe8ff'], blurb: 'Spaced-repetition reviews and recaps finished.',
    series: [{ key: '', stat: 'memory', desc: n => `Finish ${plural(n, 'a review or recap session', 'review or recap sessions')}.`,
      ladder: [[1, 'Remember Me'], [10, 'Memory Keeper'], [50, 'Elephant'], [100, 'Total Recall']] }] },
  { id: 'courses', name: 'Courses', icon: 'trophy', ribbon: ['#d99a00', '#fff3a8'], blurb: 'Whole courses finished, and courses explored.',
    series: [{ key: 'explorer', stat: 'started', icon: 'globe', desc: n => `Finish a lesson in ${n} different courses.`,
      ladder: [[2, 'Wanderer'], [3, 'Globetrotter'], [5, 'Renaissance Mind']] }] },
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
const rankOf = (t, n, from = 0) => (n === 1 ? Math.max(2, from) : from + Math.round((t * (6 - from)) / (n - 1)));
export const METAL_NAMES = ['Bronze', 'Silver', 'Gold', 'Radiant gold', 'Emerald', 'Ruby', 'Legendary'];

// Every medal, in display order (course medals come from the catalog).
export async function allMedals() {
  const catalog = await getCatalog();
  const list = [];
  for (const cat of CATEGORIES) {
    for (const s of cat.series) {
      s.ladder.forEach(([need, name], t) => list.push({
        id: `${cat.id}:${s.key ? `${s.key}-` : ''}${need}`, cat: cat.id, name, need, stat: s.stat, desc: s.desc(need),
        icon: s.icon ?? cat.icon, rank: rankOf(t, s.ladder.length, s.from),
      }));
    }
    if (cat.id === 'courses') {
      for (const c of catalog.courses.filter(c => c.status !== 'planned')) list.push({
        id: `courses:${c.id}`, cat: 'courses', name: `${c.short ?? c.title} Master`, need: 1, stat: `course:${c.id}`,
        desc: `Finish every lesson of ${c.title}.`, mascot: c.mascot, hue: c.hue ?? 0, rank: 3,
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
  return h('a', { class: 'medal-bar', href: '#/medals', 'aria-label': `Medals: ${earned.length} earned` },
    h('span', { class: 'mb-label' }, 'Medals'),
    CATEGORIES.map(c => h('span', { class: `mb-item${count(c.id) ? '' : ' none'}`, 'data-tip': `${c.name} medals` },
      categoryIcon(c.id), h('b', {}, String(count(c.id))))));
}

// A pop-up for each medal just earned (one summary when there are many).
export function showNewMedals(fresh) {
  if (!fresh?.length) return;
  let box = document.querySelector('.medal-toasts');
  if (!box) { box = h('div', { class: 'medal-toasts', 'aria-live': 'polite' }); document.body.append(box); }
  const items = fresh.length > 3
    ? [{ m: fresh[fresh.length - 1], title: `${fresh.length} new medals!`, text: 'Open the medal room to see them all.' }]
    : fresh.map(m => ({ m, title: `New medal: ${m.name}`, text: m.desc }));
  sounds.medal?.();
  items.forEach(({ m, title, text }, k) => {
    const t = h('a', { class: 'medal-toast', href: '#/medals', style: `animation-delay:${k * 0.25}s` },
      medalImg(m, 1.5), h('span', {}, h('b', {}, title), h('small', {}, text)));
    box.append(t);
    setTimeout(() => t.classList.add('out'), 5200 + k * 400);
    setTimeout(() => t.remove(), 5800 + k * 400);
  });
}

// Check for new medals and pop them up (fire and forget).
export const medalCheck = () => checkMedals().then(r => showNewMedals(r.fresh)).catch(err => console.error(err));

const dayText = d => new Date(d * 86400000).toLocaleDateString([], { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });

// The medal room (#/medals).
export async function renderMedals(root) {
  const { list, fresh } = await checkMedals();
  const earned = progress.medals();
  const nEarned = list.filter(m => m.id in earned).length;
  const top = h('header', { class: 'topbar' },
    h('a', { class: 'academy-link', href: '#/', html: `${icons.back}<span>Gibernoot Academy</span>` }),
    h('h1', { class: 'course-title', 'data-hue': 0 }, 'Medal Room'),
    h('div', { class: 'course-sub' }, `${nEarned} of ${list.length} medals earned. Go collect them all!`),
    h('div', { class: 'toolbar' }, themeButton(h)));
  const sections = CATEGORIES.map(cat => {
    const ms = list.filter(m => m.cat === cat.id);
    const got = ms.filter(m => m.id in earned).length;
    return h('section', { class: 'medal-cat' },
      h('div', { class: 'medal-cat-head' }, categoryIcon(cat.id, 3),
        h('div', {}, h('h2', {}, cat.name), h('p', {}, cat.blurb)),
        h('span', { class: 'medal-cat-count' }, `${got}/${ms.length}`)),
      h('div', { class: 'medal-grid' }, ms.map(m => {
        const have = m.id in earned;
        return h('div', { class: `medal${have ? '' : ' locked'}${fresh.includes(m) ? ' fresh' : ''}` },
          medalImg(m, 2.5),
          h('div', { class: 'm-name' }, m.name),
          h('div', { class: 'm-desc' }, m.desc),
          have ? h('div', { class: 'm-when' }, `${METAL_NAMES[m.rank]} · ${dayText(earned[m.id])}`)
            : h('div', { class: 'm-progress' },
              h('div', { class: 'meter' }, h('div', { style: `width:${Math.min(100, (100 * m.value) / m.need)}%` })),
              h('span', {}, `${Math.min(m.value, m.need)} / ${m.need}`)));
      })));
  });
  root.replaceChildren(h('div', { class: 'trail medals-page' }, top, sections));
  showNewMedals(fresh);
}
