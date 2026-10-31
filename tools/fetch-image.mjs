#!/usr/bin/env node
// Fetches a free-licensed image from Wikimedia Commons into courses/<id>/img/,
// resized to a phone-friendly WebP, and records its credit in img/credits.yaml.
//
//   node tools/fetch-image.mjs search "Kurt Gödel portrait"             list candidate files with license
//   node tools/fetch-image.mjs get <course> "File:Kurt gödel.jpg" <name> [--width 900]
//
// `get` refuses non-free licenses (NC, ND, fair use, unknown), downloads, converts
// (needs ImageMagick `magick`), appends to the ledger and prints the YAML to paste on a card
// (then edit alt and caption: one sentence that teaches something).

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, statSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = { 'User-Agent': 'GibernootAcademy/1.0 (https://github.com/Igor-Gibernoot/gibernoot-academy; study app, image fetch tool)' };
const FREE = /^(public domain|pd\b|cc0|cc[- ]by(-sa)?\b|cc by(-sa)?\b|attribution|no restrictions|gfdl|nasa|copyrighted free use|free art)/i;
const NONFREE = /\b(nc|nd|fair use|non-?commercial|no derivatives|all rights reserved)\b/i;

const strip = html => String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const api = async params => {
  const r = await fetch(`${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`, { headers: UA });
  if (!r.ok) throw new Error(`Commons API: HTTP ${r.status}`);
  return r.json();
};
const info = async (title, width = 900) => {
  const j = await api({ action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: width });
  const page = Object.values(j.query?.pages ?? {})[0];
  if (!page?.imageinfo) throw new Error(`No such file on Commons: ${title}`);
  const ii = page.imageinfo[0], m = ii.extmetadata ?? {};
  return {
    title: page.title, ii,
    license: strip(m.LicenseShortName?.value) || 'unknown',
    author: strip(m.Artist?.value) || strip(m.Credit?.value) || 'unknown',
    page: ii.descriptionurl,
    restrictions: strip(m.Restrictions?.value),
  };
};

const [cmd, ...rest] = process.argv.slice(2);

if (cmd === 'search') {
  const j = await api({ action: 'query', generator: 'search', gsrsearch: `${rest.join(' ')} filetype:bitmap|drawing`, gsrnamespace: 6, gsrlimit: 12, prop: 'imageinfo', iiprop: 'size|extmetadata' });
  const pages = Object.values(j.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  if (!pages.length) console.log('no results; try other words');
  for (const p of pages) {
    const ii = p.imageinfo?.[0], m = ii?.extmetadata ?? {};
    const lic = strip(m.LicenseShortName?.value) || '?';
    const ok = FREE.test(lic) && !NONFREE.test(lic) ? 'ok  ' : 'NO  ';
    console.log(`${ok}${p.title}  [${lic}]  ${ii?.width}x${ii?.height}  ${strip(m.ImageDescription?.value).slice(0, 80)}`);
  }
} else if (cmd === 'get') {
  const args = rest.filter(a => !a.startsWith('--'));
  const wi = rest.indexOf('--width');
  const width = wi >= 0 ? Number(rest[wi + 1]) : 900;
  const [course, fileTitle, name] = args.filter(a => a !== String(width) || wi < 0);
  if (!course || !fileTitle || !/^[a-z0-9-]+$/.test(name ?? '')) { console.error('usage: get <course> "File:Name.jpg" <name-lowercase-with-dashes> [--width 900]'); process.exit(2); }
  if (!existsSync(join(root, 'courses', course))) { console.error(`no course folder courses/${course}`); process.exit(2); }
  const t = await info(fileTitle.startsWith('File:') ? fileTitle : `File:${fileTitle}`, width);
  if (!FREE.test(t.license) || NONFREE.test(t.license)) { console.error(`REFUSED: license "${t.license}" is not free to reuse (${t.page})`); process.exit(1); }
  if (/trademark|personality|insignia/i.test(t.restrictions)) console.error(`note: restrictions on this file: ${t.restrictions}`);
  const dir = join(root, 'courses', course, 'img');
  mkdirSync(dir, { recursive: true });
  const url = t.ii.thumburl || t.ii.url;
  const buf = Buffer.from(await (await fetch(url, { headers: UA })).arrayBuffer());
  const tmp = join(dir, `.${name}.tmp`);
  writeFileSync(tmp, buf);
  const out = join(dir, `${name}.webp`);
  try {
    execFileSync('magick', [`${tmp}[0]`, '-auto-orient', '-resize', `${width}x${width}>`, '-strip', '-quality', '82', out]);
  } finally { rmSync(tmp, { force: true }); }
  const kb = Math.round(statSync(out).size / 1024);
  const ledger = join(dir, 'credits.yaml');
  const q = s => JSON.stringify(s);
  appendFileSync(ledger, `${name}.webp:\n  source: ${q(t.page)}\n  title: ${q(t.title)}\n  author: ${q(t.author)}\n  license: ${q(t.license)}\n  fetched: ${new Date().toISOString().slice(0, 10)}\n`);
  const credit = `${t.author.length > 70 ? t.author.slice(0, 67) + '…' : t.author}, ${t.license}, via Wikimedia Commons`;
  console.log(`saved courses/${course}/img/${name}.webp (${kb} KB); ledger updated. Paste on the card, then write alt and caption:\n`);
  console.log(`  image:\n    src: img/${name}.webp\n    alt: ${q('TODO: what the picture shows')}\n    caption: ${q('TODO: one sentence that teaches something')}\n    credit: ${q(credit)}\n    link: ${q(t.page)}`);
} else {
  console.error('usage:\n  node tools/fetch-image.mjs search "words"\n  node tools/fetch-image.mjs get <course> "File:Name.jpg" <name> [--width 900]');
  process.exit(2);
}
