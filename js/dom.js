// Tiny DOM helpers.

// HTML produced by md()/mdInline(): a String subclass, so every string use still works, but h()
// inserts it as HTML when it is passed as a child (a plain string child is text, never HTML).
export class Html extends String {}

// h('div', {class: 'x', html: '<b>hi</b>', onclick}, child1, 'text', ...)
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    if (c instanceof Html) el.insertAdjacentHTML('beforeend', String(c));
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
