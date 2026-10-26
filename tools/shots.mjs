// Screenshot pass for one lesson (serves the repo itself, no server needed).
// usage: node tools/shots.mjs <lessonFile> <lessonId> <outDir> [--all]
//   <lessonFile> is relative to courses/, so it starts with the course folder:
//   e.g. node tools/shots.mjs diff-geometry-gr/ch03/hausdorff.yaml ch03-hausdorff /tmp/shots
// Prints one line per problem (formula overflow at phone/desktop width, page
// errors) and saves PNGs of widget cards (plus build/order and phone `$$`
// cards with --all). Setup once: npm install --prefix tools
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const all = args.includes('--all');
const [file, id, out] = args.filter(a => a !== '--all');
const yaml = createRequire(import.meta.url)(`${repo}/vendor/js-yaml.min.js`);
// Map lessons (kind: map) have no cards: expand them as the app does.
const { expandLesson } = await import(pathToFileURL(`${repo}/js/content.js`));
const course = file.split('/')[0];
const lesson = expandLesson(yaml.load(readFileSync(`${repo}/courses/${file}`, 'utf8')));
mkdirSync(out, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.yaml': 'text/yaml', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = join(repo, p);
  if (!f.startsWith(repo) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(0);
const port = server.address().port;

// The cached Chromium on the Mac; on Windows the installed Chrome or Edge; CHROME=<path> overrides.
const exe = [process.env.CHROME,
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && existsSync(p));
const b = await chromium.launch({ executablePath: exe });
const shotTypes = new Set(all ? ['widget', 'build', 'order', 'mapview'] : ['widget', 'mapview']);
let problems = 0, shots = 0;
for (const [w, hgt, tag] of [[390, 844, 'phone'], [1280, 860, 'desk']]) {
  const p = await b.newPage({ viewport: { width: w, height: hgt } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  for (let n = 0; n < lesson.cards.length; n++) {
    const c = lesson.cards[n];
    await p.goto(`http://localhost:${port}/#/${course}/lesson/${id}/${n + 1}`); await p.waitForTimeout(300);
    await p.reload(); await p.waitForTimeout(400);
    const extras = [c.explanation, c.hint, ...(c.options ?? []).map(o => o.feedback), ...(c.wrong ?? []).map(o => o.feedback)].filter(Boolean);
    const res = await p.evaluate(async extras => {
      const { md } = await import('/js/render.js');
      const stage = document.querySelector('.stage');
      const bad = el => [...el.querySelectorAll('.katex-display')].filter(k => k.scrollWidth > k.clientWidth + 1).map(k => k.textContent.slice(0, 60));
      const main = bad(document);
      const ex = [];
      for (const t of extras) { const d = document.createElement('div'); d.className = 'prose'; d.innerHTML = md(t); stage.append(d); ex.push(...bad(d)); d.remove(); }
      return { main, ex, wide: document.documentElement.scrollWidth > window.innerWidth };
    }, extras);
    if (res.main.length || res.ex.length || res.wide) { problems++; console.log(tag, n + 1, c.id, JSON.stringify(res)); }
    const hasDisplay = JSON.stringify(c).includes('$$');
    if (shotTypes.has(c.type) || (all && tag === 'phone' && hasDisplay)) {
      await p.screenshot({ path: `${out}/${tag}-${String(n + 1).padStart(2, '0')}-${c.id}.png`, fullPage: true }); shots++;
    }
    // The fixed footer covers the readouts in full-page shots: also save the widget alone, footer hidden.
    const wEl = c.type === 'widget' && await p.$('.widget');
    if (wEl) {
      await p.evaluate(() => { for (const e of document.querySelectorAll('*')) if (['fixed', 'sticky'].includes(getComputedStyle(e).position)) e.style.visibility = 'hidden'; });
      await wEl.screenshot({ path: `${out}/${tag}-${String(n + 1).padStart(2, '0')}-${c.id}-widget.png` }); shots++;
    }
  }
  if (errs.length) { problems++; console.log(tag, 'page errors', errs); }
  await p.close();
}
await b.close(); server.close();
console.log(`done: ${lesson.cards.length} cards, ${problems} problems, ${shots} screenshots in ${out}`);
