// Share cards: a 1200 x 630 pixel-art picture of a finished level or an earned
// medal, shown in a sheet with Share (the phone's share menu, when it accepts
// files) and Save image (a PNG download). Nothing leaves the device unless the
// reader shares it.
//   shareLevel({ course, level, acc })   course = catalog entry, level = course.yaml level, acc 0..1 or null
//   shareMedal(medal, day)               a medal of medals.js and the day it was earned

import { h } from './dom.js';
import { bannerEl, spriteCanvas } from './pixel.js';
import { medalCanvas } from './medals.js';
import { progress } from './progress.js';

const W = 1200, H = 630, FONT = '"Jersey 10", system-ui, sans-serif';
const HUE = ['#7b93ff', '#4fc4c9', '#b394ff', '#f27aae', '#ff9a55', '#62b3ea'];
const BG = '#15161c', TEXT = '#f2f2f6', MUTED = '#a9aab6', GOLD = '#f5bf3c';
const APP_URL = 'https://igor-gibernoot.github.io/gibernoot-academy/';

async function surface(hue) {
  try { await document.fonts.load(`64px ${FONT}`); } catch { /* system font */ }
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = HUE[hue % 6]; ctx.fillRect(0, H - 14, W, 14);
  return { c, ctx };
}

// Text in the pixel font, shrunk until it fits `max` pixels wide.
function text(ctx, str, x, y, { size, color, max = W - 2 * x, align = 'left' }) {
  let s = size;
  do { ctx.font = `${s}px ${FONT}`; s -= 2; } while (ctx.measureText(str).width > max && s > 20);
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

// Word-wrapped lines, at most `lines` of them (the last one ends in "…" if cut).
function wrap(ctx, str, x, y, { size, color, max, lead = 1.2, lines = 3 }) {
  ctx.font = `${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = 'left';
  const out = [];
  let line = '';
  for (const w of str.split(/\s+/)) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  if (out.length > lines) { out.length = lines; out[lines - 1] = `${out[lines - 1].replace(/\s+\S*$/, '')}…`; }
  out.forEach((l, k) => ctx.fillText(l, x, y + k * size * lead));
}

const plain = s => String(s ?? '').replace(/\$[^$]*\$/g, '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();

export async function shareLevel({ course, level, acc }) {
  const { c, ctx } = await surface(course.hue ?? 0);
  const banner = course.banner && bannerEl(course.banner);
  if (banner) {
    ctx.fillStyle = HUE[(course.hue ?? 0) % 6]; ctx.fillRect(18, 18, W - 36, 348);
    ctx.drawImage(banner, 24, 24, W - 48, 336);
  }
  const eyebrow = level.eyebrow ? `${plain(level.eyebrow)} complete` : `Level ${level.number} complete`;
  text(ctx, eyebrow.toUpperCase(), 48, 432, { size: 46, color: GOLD });
  text(ctx, plain(level.title), 48, 506, { size: 74, color: TEXT, max: W - 96 });
  const streak = progress.streak();
  const facts = [plain(course.short ?? course.title), acc != null ? `${Math.round(acc * 100)}% first try` : null, streak > 1 ? `${streak}-day streak` : null].filter(Boolean).join('  ·  ');
  text(ctx, facts, 48, 568, { size: 40, color: MUTED, max: W - 420 });
  text(ctx, 'Gibernoot Academy', W - 48, 590, { size: 40, color: HUE[(course.hue ?? 0) % 6], align: 'right' });
  openShare(c, { title: `${eyebrow}: ${plain(level.title)}`, text: `I finished ${plain(level.title)} in ${plain(course.short ?? course.title)} on Gibernoot Academy.`, file: `${course.id}-${level.id}.png` });
}

export async function shareMedal(m, day) {
  const { c, ctx } = await surface(m.hue ?? 0);
  const art = medalCanvas(m);
  ctx.drawImage(art, 90, 112, art.width * 9, art.height * 9);
  const x = 420, max = W - x - 60;
  text(ctx, 'MEDAL EARNED', x, 188, { size: 46, color: GOLD, max });
  text(ctx, plain(m.name), x, 278, { size: 86, color: TEXT, max });
  wrap(ctx, plain(m.desc), x, 352, { size: 44, color: MUTED, max, lines: 3 });
  if (day != null) text(ctx, new Date(day * 86400000).toLocaleDateString([], { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }), x, 530, { size: 38, color: MUTED, max });
  const mascot = m.mascot && spriteCanvas(m.mascot);
  if (mascot) ctx.drawImage(mascot, W - 60 - mascot.width * 5, 470 - mascot.height * 5 + 120, mascot.width * 5, mascot.height * 5);
  text(ctx, 'Gibernoot Academy', x, 590, { size: 40, color: HUE[(m.hue ?? 0) % 6] });
  openShare(c, { title: `Medal: ${plain(m.name)}`, text: `I earned the ${plain(m.name)} medal on Gibernoot Academy.`, file: `medal-${m.id.replace(/[^a-z0-9]+/gi, '-')}.png` });
}

function openShare(c, { title, text: msg, file }) {
  const close = () => { scrim.remove(); removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  const url = c.toDataURL('image/png');
  const status = h('p', { class: 'hint-line share-status' });
  const blob = new Promise(res => c.toBlob(res, 'image/png'));
  const save = async () => {
    const a = h('a', { href: URL.createObjectURL(await blob), download: file });
    document.body.append(a); a.click(); a.remove();
    status.textContent = 'Saved to your downloads.';
  };
  const share = async () => {
    try {
      const f = new File([await blob], file, { type: 'image/png' });
      await navigator.share({ files: [f], title, text: `${msg} ${APP_URL}` });
    } catch (err) { if (err?.name !== 'AbortError') { status.textContent = 'Sharing is not available here: saving the image instead.'; save(); } }
  };
  const canShare = !!navigator.canShare?.({ files: [new File([new Blob()], file, { type: 'image/png' })] });
  const scrim = h('div', { class: 'scrim', onclick: e => { if (e.target === scrim) close(); } },
    h('div', { class: 'sheet share-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'kind' }, 'Share'),
      h('h3', {}, title),
      h('img', { class: 'share-preview pix', src: url, alt: title }),
      status,
      h('div', { class: 'actions' },
        h('button', { class: 'btn ghost', type: 'button', onclick: close }, 'Close'),
        h('button', { class: `btn ${canShare ? 'ghost' : 'primary'}`, type: 'button', onclick: save }, 'Save image'),
        canShare ? h('button', { class: 'btn primary', type: 'button', onclick: share }, 'Share') : null)));
  document.body.append(scrim);
  scrim.querySelector('.btn.primary')?.focus();
}
