// Light/dark theme. Default follows the system; the toggle stores an explicit
// choice per browser (not part of the progress code).

import { icons } from './icons.js';

const KEY = 'gibernoot.theme', OLD_KEY = 'dg2gr.theme';
const mq = window.matchMedia('(prefers-color-scheme: dark)');

function stored() {
  try { const v = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY); return v === 'light' || v === 'dark' ? v : null; } catch { return null; }
}

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

function toggle() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(KEY, next); } catch { /* keep in memory only */ }
  document.documentElement.dataset.theme = next;
  apply();
}

// A button that flips the theme and repaints its own icon.
export function themeButton(h) {
  const b = h('button', { class: 'icon-btn', type: 'button' });
  const paint = () => {
    const dark = currentTheme() === 'dark';
    b.innerHTML = dark ? icons.sun : icons.moon;
    b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    b.dataset.tip = dark ? 'Light mode' : 'Dark mode';
  };
  b.addEventListener('click', () => { toggle(); paint(); });
  paint();
  return b;
}
