// Languages. English is the source of truth; every other language is an
// overlay that falls back to English where a string or file is missing.
//
//   t('Some English text')        interface text: the English string is the key;
//   t('{n} cards', { n: 3 })      i18n/<lang>.json maps it to the translation.
//                                 {name} placeholders are filled from the 2nd argument.
//   tn(one, other, n, vars)       plural form: n is added to the placeholders
//   lang()                        the chosen language code ('en' by default)
//   langPath(path)                where a translated copy of a content file would live
//   loadLang()                    call once before the first render (loads i18n/<lang>.json)
//
// Content (docs/I18N.md): courses/<id>/<lang>/<file> for a lesson or exam,
// courses/<id>/<lang>/course.yaml for the trail texts, courses/catalog.<lang>.yaml
// for the home list, pages/<lang>/<page>.md for Method and About.

import { progress } from './progress.js';

export const LANGUAGES = [{ code: 'en', name: 'English' }, { code: 'pt', name: 'Português' }];
const KEY = 'gibernoot.lang';

let current = 'en';
let dict = {};

const known = c => LANGUAGES.some(l => l.code === c);

function chosen() {
  const pref = progress.pref('lang', null);
  if (known(pref)) return pref;
  try { const s = localStorage.getItem(KEY); if (known(s)) return s; } catch { /* no storage */ }
  return 'en';
}

export const lang = () => current;

export async function loadLang() {
  current = chosen();
  document.documentElement.lang = current;
  dict = {};
  if (current === 'en') return;
  try {
    const r = await fetch(`i18n/${current}.json`, { cache: 'no-cache' });
    if (r.ok) dict = await r.json();
  } catch { /* offline and uncached: English text */ }
}

export function setLang(code) {
  if (!known(code)) return;
  progress.setPref('lang', code);
  try { localStorage.setItem(KEY, code); } catch { /* no storage */ }
  location.reload();
}

// Plural: tn('{n} card', '{n} cards', n) picks the singular for 1; both strings are keys of i18n/<lang>.json.
export const tn = (one, other, n, vars) => t(n === 1 ? one : other, { n, ...vars });

export function t(en, vars) {
  const s = dict[en] ?? en;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
}

// Where the translated copy of a content file lives (null in English):
// 'catalog.yaml' -> 'catalog.pt.yaml'; '<course>/ch01/x.yaml' -> '<course>/pt/ch01/x.yaml'.
export function langPath(path) {
  if (current === 'en') return null;
  const i = path.indexOf('/');
  return i < 0 ? path.replace(/\.yaml$/, `.${current}.yaml`) : `${path.slice(0, i)}/${current}/${path.slice(i + 1)}`;
}
