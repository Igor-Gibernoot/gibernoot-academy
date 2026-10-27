#!/usr/bin/env node
// Checks the course catalog, then each course and every lesson file:
//   - YAML parses, required fields exist, ids are unique
//   - question cards are well-formed (mcq has a correct option, build answers
//     use only available tiles, numeric answers are numbers, ...)
//   - every piece of math ($...$, $$...$$, tiles, prefixes) renders in KaTeX
//
// Usage: node tools/validate.mjs            all courses in courses/catalog.yaml
//        node tools/validate.mjs <course>   one course (exit code 1 on any error)

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expandLesson, ownParts } from '../js/content.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const yaml = require(join(root, 'vendor/js-yaml.min.js'));
const katex = require(join(root, 'vendor/katex/katex.min.js'));

// KaTeX warns about symbols without font metrics (e.g. ᛖ); the browser renders them fine.
const consoleWarn = console.warn;
console.warn = (...args) => {
  if (!String(args[0]).startsWith('No character metrics')) consoleWarn(...args);
};

const errors = [];
const warnings = [];
let cid = ''; // course being checked: messages start with its folder
const err = (where, msg) => errors.push(`${cid}${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${cid}${where}: ${msg}`);

const MATH = /\$\$([\s\S]+?)\$\$|\$((?:\\\$|[^$\n])+?)\$/g;
function checkTex(where, src, display = false) {
  try { katex.renderToString(String(src), { displayMode: display, throwOnError: true, strict: false }); }
  catch (e) { err(where, `KaTeX: ${e.message.split('\n')[0]}  in  ${String(src).slice(0, 80)}`); }
}
function checkText(where, text) {
  if (text == null) return;
  const s = String(text);
  for (const m of s.matchAll(MATH)) checkTex(where, m[1] ?? m[2], m[1] !== undefined);
  const stripped = s.replace(MATH, '');
  if ((stripped.match(/(?<!\\)\$/g) ?? []).length) err(where, 'unbalanced $ in text');
}

// Self-contained check: review shows a question alone, weeks later.
// Widget guardrails. A widget must not draw things the card has to apologise for:
// hide them with a config option (or add one), never write "ignore the ...".
const IGNORE_VISUAL = /\b(ignore|disregard|never mind|do not worry about|don't worry about)\b[^.\n]{0,70}\b(arrows?|lines?|curves?|dots?|points?|sliders?|buttons?|panels?|readouts?|numbers?|colou?rs?|labels?|parts? of the (widget|figure|picture))\b/i;
const widgetSrc = (() => {
  const idx = readFileSync(join(root, 'js/widgets/index.js'), 'utf8');
  const fileOf = {};
  for (const m of idx.matchAll(/import \{ (\w+) \} from '\.\/([\w-]+)\.js'/g)) fileOf[m[1]] = m[2];
  const out = {};
  for (const m of idx.matchAll(/^\s*(?:'([\w-]+)'|(\w+))(?::\s*(\w+))?,\s*$/gm)) {
    const name = m[1] ?? m[2], fn = m[3] ?? m[2];
    if (fileOf[fn] && existsSync(join(root, 'js/widgets', fileOf[fn] + '.js'))) out[name] = readFileSync(join(root, 'js/widgets', fileOf[fn] + '.js'), 'utf8');
  }
  return out;
})();
const BACKREF = /\b(previous|last) (card|step|lesson|question)|\bin the (last|previous) lesson|\bas (shown|seen) above/i;

const KINDS = ['concept', 'intuition', 'guided', 'traps', 'map', 'review', 'challenge', 'exam'];
const catalog = yaml.load(readFileSync(join(root, 'courses/catalog.yaml'), 'utf8'));
const only = process.argv[2];
if (only && !catalog.courses?.some(c => c.id === only)) { console.log(`ERROR no course "${only}" in courses/catalog.yaml`); process.exit(1); }
let built = 0, cardsTotal = 0;
const courseIds = new Set();
for (const c of catalog.courses ?? []) {
  if (!c.id || !c.title) err('catalog.yaml', 'each course needs id and title');
  if (!/^[a-z0-9-]+$/.test(c.id ?? '')) err('catalog.yaml', `course id "${c.id}": lowercase letters, digits and - only`);
  if (courseIds.has(c.id)) err('catalog.yaml', `duplicate course id "${c.id}"`);
  courseIds.add(c.id);
  checkText(`catalog.yaml ${c.id}`, c.blurb);
  if (c.status === 'planned' || (only && c.id !== only)) continue;
  if (!existsSync(join(root, 'courses', c.id, 'course.yaml'))) { err('catalog.yaml', `courses/${c.id}/course.yaml not found`); continue; }
  cid = `${c.id}/`;
  checkCourse(yaml.load(readFileSync(join(root, 'courses', c.id, 'course.yaml'), 'utf8')), join(root, 'courses', c.id));
  cid = '';
}

// Every registered widget needs docs/widgets/<name>.md and a line in docs/widgets/README.md;
// LESSON_FORMAT.md must not grow widget sections again (it is read in pieces, widgets live in docs/widgets/).
{
  const reg = readFileSync(join(root, 'js/widgets/index.js'), 'utf8');
  const names = [...reg.slice(reg.indexOf('const WIDGETS')).matchAll(/^\s*'([a-z0-9-]+)':/gm)].map(m => m[1]);
  const idx = existsSync(join(root, 'docs/widgets/README.md')) ? readFileSync(join(root, 'docs/widgets/README.md'), 'utf8') : '';
  for (const n of names) {
    if (!existsSync(join(root, 'docs/widgets', n + '.md'))) err('docs/widgets', `widget "${n}" has no docs/widgets/${n}.md`);
    if (!idx.includes('`' + n + '`')) err('docs/widgets/README.md', `widget "${n}" missing from the index`);
  }
  if (/^#### `/m.test(readFileSync(join(root, 'docs/LESSON_FORMAT.md'), 'utf8'))) err('docs/LESSON_FORMAT.md', 'widget sections belong in docs/widgets/<name>.md');
}

// STATUS.md must keep one header and one short Current block; the history lives in STATUS.log.md.
// (agents' scripts corrupted these files before)
function checkStatus(dir) {
  const f = join(dir, 'STATUS.md');
  if (!existsSync(f)) { err('STATUS.md', 'missing'); return; }
  const lines = readFileSync(f, 'utf8').split('\n');
  const at = re => lines.flatMap((l, i) => (re.test(l) ? [i] : []));
  const [title, cur] = [at(/^# Status\s*$/), at(/^## Current\b/)];
  if (title.length !== 1) err('STATUS.md', `needs exactly one "# Status" header (found ${title.length})`);
  if (cur.length !== 1) err('STATUS.md', `needs exactly one "## Current" block (found ${cur.length})`);
  if (at(/^## Log\s*$/).length) err('STATUS.md', 'the Log moved to STATUS.log.md; keep only the Current block here');
  if (title.length === 1 && cur.length === 1) {
    if (title[0] > cur[0]) err('STATUS.md', 'order must be "# Status", "## Current"');
    else if (lines.length - cur[0] > 45) warn('STATUS.md', `Current block is ${lines.length - cur[0]} lines (keep it under ~40)`);
  }
  if (at(/^<{7}|^={7}$|^>{7}/).length) err('STATUS.md', 'merge-conflict markers');
  const g = join(dir, 'STATUS.log.md');
  if (!existsSync(g)) { err('STATUS.log.md', 'missing'); return; }
  const gl = readFileSync(g, 'utf8').split('\n');
  const n = gl.filter(l => /^# Status log\s*$/.test(l)).length;
  if (n !== 1) err('STATUS.log.md', `needs exactly one "# Status log" header (found ${n})`);
  if (gl.some(l => /^<{7}|^={7}$|^>{7}/.test(l))) err('STATUS.log.md', 'merge-conflict markers');
}

function checkCourse(course, dir) {
  checkStatus(dir);
const lessonIds = new Set();
const registered = new Set();
for (const level of course.levels ?? []) for (const m of level.lessons ?? []) if (m.file) registered.add(m.file);
for (const d of readdirSync(dir, { withFileTypes: true })) {
  if (!d.isDirectory() || !/^(ch\d+|exams)$/.test(d.name)) continue;
  for (const f of readdirSync(join(dir, d.name))) {
    if (f.endsWith('.yaml') && !registered.has(`${d.name}/${f}`)) err(`${d.name}/${f}`, 'lesson file is not registered: add `file:` to its node in course.yaml');
  }
}
for (const level of course.levels ?? []) {
  const lw = `course.yaml level ${level.id}`;
  if (!level.id || !level.title || (level.number == null && !level.eyebrow)) err(lw, 'needs id, title and number (or eyebrow)');
  checkText(lw, level.blurb);
  for (const meta of level.lessons ?? []) {
    const w = `course.yaml lesson ${meta.id}`;
    if (!meta.id || !meta.title) err(w, 'needs id and title');
    if (lessonIds.has(meta.id)) err(w, 'duplicate lesson id');
    lessonIds.add(meta.id);
    if (!KINDS.includes(meta.kind)) err(w, `kind must be one of ${KINDS.join(', ')}`);
    checkText(w, meta.title);
    checkText(w, meta.summary);
    if (meta.kind === 'review' && meta.file) err(w, 'a level review is automatic: it takes no file');
    if (!meta.file) continue;
    const path = join(dir, meta.file);
    if (!existsSync(path)) { err(w, `file not found: ${meta.file}`); continue; }
    built++;
    let lesson;
    try { lesson = yaml.load(readFileSync(path, 'utf8')); }
    catch (e) { err(meta.file, `YAML: ${e.message.split('\n')[0]}`); continue; }
    if (lesson.id !== meta.id) err(meta.file, `id "${lesson.id}" does not match course.yaml id "${meta.id}"`);
    if (lesson.kind === 'map') checkMap(meta.file, lesson);
    if (lesson.own != null) checkOwn(meta.file, lesson);
    checkLesson(meta.file, expandLesson(lesson));
  }
}
}

function checkMap(file, m) {
  if (!m.name) err(file, 'map needs name (used in review prompts)');
  if (!Array.isArray(m.nodes) || !m.nodes.length) return err(file, 'map needs nodes');
  const ids = new Set();
  const cells = new Set();
  for (const n of m.nodes) {
    const w = `${file} node ${n.id}`;
    if (!n.id || ids.has(n.id)) err(w, 'node needs a unique id');
    ids.add(n.id);
    if (!n.title || !n.body) err(w, 'node needs title and body');
    if (!(n.row >= 1 && n.col >= 1)) err(w, 'node needs row and col (1-based)');
    if (n.col + (n.span ?? 1) - 1 > (m.cols ?? 3)) err(w, 'node sticks out of the grid (col + span > cols)');
    for (let c = n.col; c < n.col + (n.span ?? 1); c++) {
      if (cells.has(`${n.row},${c}`)) err(w, `overlaps another node at row ${n.row}, col ${c}`);
      cells.add(`${n.row},${c}`);
    }
    if ((n.decoys ?? []).length < 2) warn(w, 'give at least 2 decoys');
  }
  for (const e of m.edges ?? []) {
    const [a, b] = Array.isArray(e) ? e : [e.from, e.to];
    if (!ids.has(a) || !ids.has(b)) err(file, `edge ${a} -> ${b} names an unknown node`);
    if (e.label !== undefined) {
      if (typeof e.label !== 'string') err(file, `edge ${a} -> ${b}: label must be a string`);
      else if (e.label.length > 18) warn(file, `edge ${a} -> ${b}: label "${e.label}" is long for a phone (keep it to 1–3 words)`);
    }
  }
}

// `own:` (the "what you now own" summary): {{ }} balanced and not nested,
// 3–6 distinct blanks (2 at the least), and a closing text card to show it on.
function checkOwn(file, lesson) {
  const w = `${file} own`;
  if (typeof lesson.own !== 'string') return err(w, 'own must be a Markdown string (use a | block)');
  if (!['concept', 'intuition'].includes(lesson.kind)) warn(w, 'own: is meant for concept and intuition lessons');
  checkText(w, lesson.own);
  const { parts, errors } = ownParts(lesson.own);
  for (const e of errors) err(w, e);
  const blanks = parts.filter(p => p.key);
  for (const b of blanks) {
    if (!b.blank) err(w, 'empty {{ }}');
    checkText(`${w} blank`, b.blank);
  }
  const n = new Set(blanks.map(b => b.key)).size;
  if (n < 2) err(w, `needs at least 2 distinct {{ }} blanks (has ${n})`);
  else if (n < 3 || n > 6) warn(w, `${n} blanks; aim for 3–6`);
  if (lesson.cards?.at(-1)?.type !== 'text') err(w, 'the last card must be a text card: it shows the summary (its body, if any, follows as the teaser)');
}

function checkLesson(file, lesson) {
  const ids = new Set();
  if (!Array.isArray(lesson.cards) || !lesson.cards.length) return err(file, 'no cards');
  if (lesson.kind !== 'exam') {
    const max = lesson.kind === 'challenge' ? 32 : 25, n = lesson.cards.length;
    if (n > max) warn(file, `${n} cards; ${lesson.kind === 'challenge' ? 'challenges' : 'lessons'} stay at ${max} or fewer: split it (CLAUDE.md, Lesson length)`);
  }
  lesson.cards.forEach((c, n) => {
    cardsTotal++;
    const w = `${file} card ${n + 1}${c.id ? ` (${c.id})` : ''}`;
    if (!c.id) err(w, 'every card needs an id (review keys depend on it)');
    else if (ids.has(c.id)) err(w, 'duplicate card id');
    ids.add(c.id);
    for (const f of ['title', 'body', 'prompt', 'explanation', 'hint', 'label', 'unit']) checkText(w, c[f]);
    if (['mcq', 'numeric', 'build', 'order', 'mapstep'].includes(c.type) && c.review !== false) {
      const texts = [c.prompt, c.hint, ...(c.options ?? []).map(o => o.feedback), ...(c.wrong ?? []).map(x => x.feedback)];
      if (texts.some(t => t && BACKREF.test(t))) warn(w, 'refers to a previous card/lesson, but review shows it alone; restate the fact instead');
    }
    switch (c.type) {
      case 'text':
        if (!c.body) err(w, 'text card needs body');
        break;
      case 'mapview':
        break;
      case 'widget':
        if (!c.widget) err(w, 'widget card needs widget');
        else if (!widgetSrc[c.widget]) err(w, `unknown widget "${c.widget}" (not in js/widgets/index.js)`);
        else {
          // a config key that the widget's source never mentions is silently ignored: a typo or a missing option
          for (const key of Object.keys(c.config ?? {})) {
            if (!new RegExp(`\\b${key}\\b`).test(widgetSrc[c.widget])) warn(w, `config key "${key}" is not used by widget ${c.widget} (typo, or the widget needs this option: add it, never tell the reader to ignore what it draws)`);
          }
          for (const nb of [lesson.cards[n - 1], c, lesson.cards[n + 1]]) {
            const t = nb && [nb.title, nb.body, nb.prompt, nb.hint].filter(Boolean).join(' ');
            if (t && IGNORE_VISUAL.test(t)) warn(w, 'the text around this widget tells the reader to ignore part of it: hide that part with a config option (add one to the widget if needed) instead');
          }
        }
        break;
      case 'mcq':
      case 'mapstep': {
        if (!c.prompt) err(w, 'needs prompt');
        if (!Array.isArray(c.options) || c.options.length < 2) { err(w, 'needs >= 2 options'); break; }
        const correct = c.options.filter(o => o.correct).length;
        if (!correct) err(w, 'no option marked correct: true');
        if (correct > 1 && !c.multiple) err(w, 'several correct options but multiple: true not set');
        c.options.forEach((o, k) => {
          if (typeof o.text !== 'string') err(w, `option ${k + 1} text must be a string (quote it)`);
          checkText(`${w} option ${k + 1}`, o.text);
          checkText(`${w} option ${k + 1} feedback`, o.feedback);
          if (!o.correct && !o.feedback) warn(w, `wrong option ${k + 1} has no feedback (misconception explanation)`);
        });
        if (!c.explanation) warn(w, 'no explanation');
        break;
      }
      case 'numeric':
        if (!c.prompt) err(w, 'needs prompt');
        if (typeof c.answer !== 'number') err(w, 'answer must be a number');
        for (const x of c.wrong ?? []) {
          if (typeof x.value !== 'number') err(w, 'wrong[].value must be a number');
          checkText(w, x.feedback);
        }
        if (!c.explanation) warn(w, 'no explanation');
        break;
      case 'build': {
        if (!c.prompt) err(w, 'needs prompt');
        if (!Array.isArray(c.tiles) || !c.tiles.length) { err(w, 'needs tiles'); break; }
        c.tiles.forEach(t => checkTex(`${w} tile`, t));
        if (c.prefix) checkTex(`${w} prefix`, c.prefix);
        if (c.suffix) checkTex(`${w} suffix`, c.suffix);
        const norm = s => String(s).replace(/\s+/g, '');
        const fits = seq => {
          const pool = c.tiles.map(norm);
          return seq.every(t => { const i = pool.indexOf(norm(t)); if (i < 0) return false; pool.splice(i, 1); return true; });
        };
        if (!Array.isArray(c.answers) || !c.answers.length) err(w, 'needs answers (list of tile sequences)');
        for (const a of c.answers ?? []) if (!fits(a)) err(w, `answer uses tiles not in tiles[]: ${a.join(' ')}`);
        for (const x of c.wrong ?? []) {
          if (!fits(x.answer)) err(w, `wrong answer uses tiles not in tiles[]: ${x.answer.join(' ')}`);
          checkText(w, x.feedback);
        }
        if (!c.explanation) warn(w, 'no explanation');
        break;
      }
      case 'order':
        if (!c.prompt) err(w, 'needs prompt');
        if (!Array.isArray(c.steps) || c.steps.length < 2) err(w, 'needs >= 2 steps');
        (c.steps ?? []).forEach((s, k) => checkText(`${w} step ${k + 1}`, s));
        if (new Set(c.steps ?? []).size !== (c.steps ?? []).length) err(w, 'steps must be distinct');
        break;
      default:
        err(w, `unknown type "${c.type}"`);
    }
  });
}

for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`\n${built} built lessons, ${cardsTotal} cards, ${errors.length} errors, ${warnings.length} warnings.`);
process.exit(errors.length ? 1 : 0);
