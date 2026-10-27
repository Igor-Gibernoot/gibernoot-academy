// Mounts every widget config found in the lessons of every course, then
// clicks each button, moves each slider and select, and drags each handle,
// reporting page errors. usage: node tools/widget-smoke.mjs [course]
import { chromium } from 'playwright-core';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const yaml = createRequire(import.meta.url)(`${repo}/vendor/js-yaml.min.js`);
const only = process.argv[2];
const files = [];
const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (f === 'sources' || f === 'archive') continue; statSync(p).isDirectory() ? walk(p) : f.endsWith('.yaml') && files.push(p); } };
for (const c of readdirSync(join(repo, 'courses'))) if (!only || c === only) { const d = join(repo, 'courses', c); if (statSync(d).isDirectory()) walk(d); }
const mounts = [];
const scan = (o, where) => {
  if (Array.isArray(o)) return o.forEach(x => scan(x, where));
  if (!o || typeof o !== 'object') return;
  if (o.type === 'widget' && o.widget) mounts.push({ name: o.widget, config: o.config ?? {}, where: `${where}#${o.id}` });
  if (o.figure?.widget) mounts.push({ name: o.figure.widget, config: o.figure.config ?? {}, where: `${where}#${o.id} (figure)` });
  for (const v of Object.values(o)) scan(v, where);
};
for (const f of files) scan(yaml.load(readFileSync(f, 'utf8')), f.slice(repo.length + 9));

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.yaml': 'text/yaml', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = join(repo, p);
  if (!f.startsWith(repo) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f));
}).listen(0);
const exe = [process.env.CHROME,
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
  'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p => p && existsSync(p));
const b = await chromium.launch({ executablePath: exe });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
let errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:${server.address().port}/`); await p.waitForTimeout(500);
let bad = 0;
for (const m of mounts) {
  errs = [];
  try {
  await p.evaluate(async m => {
    const { mountWidget } = await import('/js/widgets/index.js');
    document.body.replaceChildren();
    const el = document.createElement('div'); el.className = 'widget'; document.body.append(el);
    mountWidget(m.name, el, m.config);
  }, m);
  await p.waitForTimeout(150);
  await p.evaluate(async () => {
    const root = document.querySelector('.widget');
    const fire = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true }));
    for (const r of root.querySelectorAll('input[type=range]')) for (const v of [r.min, r.max, (Number(r.min) + Number(r.max)) / 2]) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); }
    for (const s of root.querySelectorAll('select')) for (const o of s.options) { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); }
    for (const c of root.querySelectorAll('input[type=checkbox]')) { c.click(); c.click(); }
    for (const bt of root.querySelectorAll('button')) { bt.click(); await new Promise(r => setTimeout(r, 30)); }
    const svg0 = root.querySelector('svg'), top0 = () => svg0 && svg0.getBoundingClientRect().top + scrollY;
    const t0 = top0();
    for (const hd of root.querySelectorAll('.w-handle, [class*=handle], circle')) {
      const bx = hd.getBoundingClientRect(); if (!bx.width) continue;
      const x = bx.x + bx.width / 2, y = bx.y + bx.height / 2;
      fire(hd, 'pointerdown', x, y); fire(hd, 'pointermove', x + 15, y - 10); fire(window, 'pointermove', x + 25, y - 20); fire(hd, 'pointerup', x + 25, y - 20);
    }
    if (svg0 && Math.abs(top0() - t0) > 0.5) throw new Error(`layout shift: first svg moved ${(top0() - t0).toFixed(1)}px while dragging`);
    for (const bt of root.querySelectorAll('button')) bt.click();
  });
  await p.waitForTimeout(400);
  } catch (e) { errs.push(e.message.split('\n')[0]); }
  if (errs.length) { bad++; console.log(m.name, m.where, [...new Set(errs)]); }
}
await b.close(); server.close();
console.log(`done: ${mounts.length} widget mounts, ${bad} with errors`);
