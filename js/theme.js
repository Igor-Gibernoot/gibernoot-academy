// Light/dark theme. Default follows the system; the toggle stores an explicit
// choice per browser (not part of the progress code).

import { icons } from './icons.js';

const KEY = 'gibernoot.theme', OLD_KEY = 'dg2gr.theme';
const mq = window.matchMedia('(prefers-color-scheme: dark)');

function stored() {
  try { const v = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY); return v === 'light' || v === 'dark' ? v : null; } catch { return null; }
}

// The chosen mode: 'system' (follow the browser), 'light' or 'dark'.
export const themeMode = () => stored() ?? 'system';
export const currentTheme = () => stored() ?? (mq.matches ? 'dark' : 'light');

function apply() {
  const t = currentTheme();
  document.documentElement.dataset.theme = t;
  for (const m of document.querySelectorAll('meta[name="theme-color"]')) m.removeAttribute('media');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = t === 'dark' ? '#16171b' : '#f6f5f1';
}

export function initTheme() {
  apply();
  mq.addEventListener?.('change', apply);
}

const NEXT = { system: 'light', light: 'dark', dark: 'system' };
const LABEL = { system: 'System', light: 'Light', dark: 'Dark' };

function cycle() {
  const next = NEXT[themeMode()];
  try { next === 'system' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, next); } catch { /* keep in memory only */ }
  try { localStorage.removeItem(OLD_KEY); } catch { /* ignore */ }
  apply();
}

// A button that cycles system -> light -> dark and repaints its own icon.
export function themeButton(h) {
  const b = h('button', { class: 'icon-btn', type: 'button' });
  const paint = () => {
    const m = themeMode();
    b.innerHTML = m === 'system' ? icons.system : m === 'dark' ? icons.moon : icons.sun;
    b.setAttribute('aria-label', `Theme: ${LABEL[m]}. Switch to ${LABEL[NEXT[m]]}`);
    b.dataset.tip = `Theme: ${LABEL[m]}`;
  };
  b.addEventListener('click', () => { cycle(); paint(); });
  paint();
  return b;
}
