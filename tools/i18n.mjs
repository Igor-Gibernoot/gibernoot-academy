#!/usr/bin/env node
// Translations (docs/I18N.md). English is the source; a language is an overlay.
//
//   node tools/i18n.mjs ui [lang]                       interface strings: t('…') keys in js/ against i18n/<lang>.json
//   node tools/i18n.mjs status [course] [--lang pt] [--list]
//                                                        per course: lessons/exams missing, stale, invalid or current
//   node tools/i18n.mjs check <course> [--lang pt]      structure check of every translated file (exit 1 on errors)
//   node tools/i18n.mjs stamp <course>/<file>… [--lang pt]
//                                                        record the English file's hash in the translation (run right
//                                                        after translating a file; `status` calls it stale when English changes)
//
// Translated copies: courses/<id>/<lang>/<same path as English> (lessons, exams), courses/<id>/<lang>/course.yaml
// (an overlay: only text fields, by level and lesson id), courses/catalog.<lang>.yaml, pages/<lang>/<page>.md.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const yaml = require(join(root, 'vendor/js-yaml.min.js'));

const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf(name); if (i < 0) return dflt; const v = args[i + 1]; args.splice(i, 2); return v; };
const lang = flag('--lang', 'pt');
const list = args.includes('--list'); if (list) args.splice(args.indexOf('--list'), 1);
const [cmd, ...rest] = args;

const read = p => readFileSync(join(root, p), 'utf8');
const load = p => yaml.load(read(p));
const hashOf = p => createHash('sha1').update(read(p).replace(/\r\n/g, '\n').trim()).digest('hex').slice(0, 12);
const ok = p => existsSync(join(root, p));

// ---------- interface strings ----------

function uiKeys() {
  const keys = new Map(); // key -> file
  const lit = String.raw`(['"\`])((?:\\.|(?!\1)[\s\S])*?)\1`;
  const one = new RegExp(String.raw`(?<![\w.$])(?:t|T)\(\s*${lit}`, 'g');
  const two = new RegExp(String.raw`(?<![\w.$])tn\(\s*${lit}\s*,\s*(['"\`])((?:\\.|(?!\3)[\s\S])*?)\3`, 'g');
  const unq = s => s.replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n');
  const problems = [];
  for (const f of readdirSync(join(root, 'js')).filter(f => f.endsWith('.js') && f !== 'i18n.js')) {
    const src = read(`js/${f}`);
    for (const m of src.matchAll(one)) { if (m[1] === '`' && m[2].includes('${')) problems.push(`js/${f}: template literal with \${} as a key: ${m[2].slice(0, 50)}`); else keys.set(unq(m[2]), f); }
    for (const m of src.matchAll(two)) { keys.set(unq(m[2]), f); keys.set(unq(m[4]), f); }
  }
  return { keys, problems };
}

function ui(code) {
  const { keys, problems } = uiKeys();
  const path = `i18n/${code}.json`;
  const dict = ok(path) ? JSON.parse(read(path)) : {};
  const missing = [...keys.keys()].filter(k => !(k in dict) || dict[k] === '');
  const unused = Object.keys(dict).filter(k => !keys.has(k));
  const holes = Object.entries(dict).filter(([k, v]) => {
    const ph = s => (s.match(/\{\w+\}/g) ?? []).sort().join();
    return v && ph(k) !== ph(v);
  }).map(([k]) => k);
  console.log(`${keys.size} interface strings in js/, ${Object.keys(dict).length} in ${path}`);
  problems.forEach(p => console.log('PROBLEM', p));
  missing.forEach(k => console.log(`MISSING  ${JSON.stringify(k)}  (${keys.get(k)})`));
  unused.forEach(k => console.log(`UNUSED   ${JSON.stringify(k)}`));
  holes.forEach(k => console.log(`PLACEHOLDERS differ  ${JSON.stringify(k)}`));
  console.log(missing.length || holes.length || problems.length ? `${missing.length} missing, ${holes.length} with different {placeholders}` : 'interface complete');
  return !(missing.length || holes.length || problems.length);
}

// ---------- content ----------

// Text fields a translation may change; every other string must stay exactly as in English.
const TEXT = new Set(['title', 'tag', 'prompt', 'body', 'text', 'feedback', 'explanation', 'hint', 'steps', 'label', 'caption', 'alt',
  'own', 'name', 'outro', 'outroTitle', 'intro', 'introTitle', 'note', 'rules', 'debrief', 'unit', 'praise', 'placeholder', 'term',
  'summary', 'eyebrow', 'blurb', 'subtitle', 'tagline', 'short', 'what', 'who', 'overview', 'sources']);
const MATH = /\$\$([\s\S]+?)\$\$|\$((?:\\\$|[^$\n])+?)\$/g;
const mathOf = s => [...s.matchAll(MATH)].map(m => m[0]);
const marks = s => (s.match(/\{\{|\}\}/g) ?? []).length;
const urls = s => (s.match(/\]\([^)]*\)|https?:\/\/\S+/g) ?? []).join('|');
const letters = s => s.replace(MATH, '').replace(/[^\p{L}]+/gu, ' ').trim();

// Compares a translation with its English original; pushes error messages, counts prose strings.
function compare(en, tr, path, key, errors, tally) {
  if (typeof en !== typeof tr || Array.isArray(en) !== Array.isArray(tr) || (en === null) !== (tr === null)) { errors.push(`${path}: type differs`); return; }
  if (Array.isArray(en)) {
    if (en.length !== tr.length) { errors.push(`${path}: ${en.length} items in English, ${tr.length} here`); return; }
    en.forEach((v, i) => compare(v, tr[i], `${path}[${i}]`, key, errors, tally));
  } else if (en && typeof en === 'object') {
    const a = Object.keys(en), b = Object.keys(tr).filter(k => k !== 'source_hash');
    for (const k of a) if (!(k in tr)) errors.push(`${path}.${k}: missing`);
    for (const k of b) if (!(k in en)) errors.push(`${path}.${k}: not in English`);
    for (const k of a) if (k in tr) compare(en[k], tr[k], `${path}.${k}`, k, errors, tally);
  } else if (typeof en === 'string') {
    if (!TEXT.has(key)) { if (en !== tr) errors.push(`${path}: must stay exactly "${en.slice(0, 40)}" (not a text field)`); return; }
    if (JSON.stringify(mathOf(en)) !== JSON.stringify(mathOf(tr))) errors.push(`${path}: math differs (${mathOf(en).length} formulas in English, ${mathOf(tr).length} here, or changed)`);
    if (marks(en) !== marks(tr)) errors.push(`${path}: {{ }} blank markers differ`);
    if (urls(en) !== urls(tr)) errors.push(`${path}: link addresses differ`);
    const l = letters(en);
    if (l.length > 25) { tally.prose++; if (en.trim() === tr.trim()) tally.same++; }
  } else if (en !== tr) errors.push(`${path}: ${JSON.stringify(en)} must stay ${JSON.stringify(en)}, found ${JSON.stringify(tr)}`);
}

const lessonFiles = course => {
  const c = load(`courses/${course}/course.yaml`);
  return c.levels.flatMap(l => (l.lessons ?? []).filter(m => m.file).map(m => m.file));
};
const trPath = (course, file, code = lang) => `courses/${course}/${code}/${file}`;

function stateOf(course, file) {
  const p = trPath(course, file);
  if (!ok(p)) return { state: 'missing' };
  const errors = [], tally = { prose: 0, same: 0 };
  let tr;
  try { tr = load(p); } catch (e) { return { state: 'invalid', errors: [`YAML: ${e.message.split('\n')[0]}`] }; }
  compare(load(`courses/${course}/${file}`), tr, '', '', errors, tally);
  if (errors.length) return { state: 'invalid', errors, tally };
  return { state: tr?.source_hash === hashOf(`courses/${course}/${file}`) ? 'current' : 'stale', tally };
}

function overlayErrors(course) {
  const p = `courses/${course}/${lang}/course.yaml`;
  if (!ok(p)) return null;
  const en = load(`courses/${course}/course.yaml`), o = load(p), errors = [];
  const levels = new Map(en.levels.map(l => [l.id, l])), lessons = new Map(en.levels.flatMap(l => l.lessons ?? []).map(m => [m.id, m]));
  const only = (obj, where) => Object.keys(obj ?? {}).filter(k => !['title', 'blurb', 'eyebrow', 'summary', 'overview'].includes(k)).forEach(k => errors.push(`${where}.${k}: not a text field`));
  for (const [id, v] of Object.entries(o.levels ?? {})) { if (!levels.has(id)) errors.push(`levels.${id}: no such level`); only(v, `levels.${id}`); }
  for (const [id, v] of Object.entries(o.lessons ?? {})) { if (!lessons.has(id)) errors.push(`lessons.${id}: no such lesson`); only(v, `lessons.${id}`); }
  const missingLessons = [...lessons.keys()].filter(id => !o.lessons?.[id]).length;
  const missingLevels = [...levels.keys()].filter(id => !o.levels?.[id]).length;
  return { errors, missingLessons, missingLevels, overview: !!o.overview };
}

function status(only) {
  const courses = only ? [only] : readdirSync(join(root, 'courses'), { withFileTypes: true }).filter(d => d.isDirectory() && ok(`courses/${d.name}/course.yaml`)).map(d => d.name);
  for (const course of courses) {
    const counts = { current: 0, stale: 0, invalid: 0, missing: 0 };
    const rows = [];
    for (const file of lessonFiles(course)) { const r = stateOf(course, file); counts[r.state]++; rows.push([file, r]); }
    const ov = overlayErrors(course);
    console.log(`${course} [${lang}]: ${counts.current} current, ${counts.stale} stale, ${counts.invalid} invalid, ${counts.missing} missing of ${rows.length}`
      + (ov ? `; trail overlay: ${ov.missingLevels} levels and ${ov.missingLessons} lessons without text${ov.errors.length ? `, ${ov.errors.length} errors` : ''}` : '; no trail overlay'));
    if (list || only) for (const [file, r] of rows) if (r.state !== 'current') console.log(`  ${r.state.padEnd(8)} ${file}`);
  }
}

function check(course) {
  if (!course) { console.error('usage: i18n.mjs check <course>'); process.exit(2); }
  let bad = 0, done = 0;
  for (const file of lessonFiles(course)) {
    const r = stateOf(course, file);
    if (r.state === 'missing') continue;
    done++;
    if (r.state === 'invalid') { bad++; console.log(`ERROR ${file}`); r.errors.slice(0, 12).forEach(e => console.log(`   ${e}`)); if (r.errors.length > 12) console.log(`   … ${r.errors.length - 12} more`); }
    else if (r.tally?.prose && r.tally.same / r.tally.prose > 0.3) console.log(`WARN  ${file}: ${r.tally.same} of ${r.tally.prose} prose strings are identical to English (untranslated?)`);
  }
  const ov = overlayErrors(course);
  if (ov?.errors.length) { bad++; ov.errors.forEach(e => console.log(`ERROR course.yaml overlay: ${e}`)); }
  console.log(`${course} [${lang}]: ${done} translated files checked, ${bad} with errors`);
  process.exit(bad ? 1 : 0);
}

function stamp(files) {
  for (const f of files) {
    const [course, ...r] = f.split('/'), file = r.join('/');
    const p = trPath(course, file), en = `courses/${course}/${file}`;
    if (!ok(p) || !ok(en)) { console.error(`skip ${f}: translation or English file not found`); continue; }
    const h = hashOf(en);
    const text = read(p).replace(/^source_hash: .*\n/m, '');
    writeFileSync(join(root, p), `source_hash: ${h}\n${text}`);
    console.log(`stamped ${p} ${h}`);
  }
}

if (cmd === 'ui') process.exit(ui(rest[0] ?? lang) ? 0 : 1);
else if (cmd === 'status') status(rest[0]);
else if (cmd === 'check') check(rest[0]);
else if (cmd === 'stamp') stamp(rest);
else { console.error('usage: node tools/i18n.mjs ui|status|check|stamp (see the header of this file)'); process.exit(2); }
