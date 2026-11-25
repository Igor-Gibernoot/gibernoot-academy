// Markdown + KaTeX. Math is pulled out before Markdown runs, so `_`, `*`
// and `\\` inside formulas are never touched by the Markdown parser.
import { Html } from './dom.js';

const MATH = /\$\$([\s\S]+?)\$\$|\$((?:\\\$|[^$\n])+?)\$/g;

export function tex(src, display = false) {
  return katex.renderToString(String(src), { displayMode: display, throwOnError: false, strict: false });
}

function protect(src) {
  const parts = [];
  const text = String(src ?? '').replace(MATH, (_, block, inline) => {
    parts.push(block !== undefined ? tex(block.trim(), true)
      : Object.assign(new String(tex(inline, false)), { short: inline.length <= 30 }));
    return `@@M${parts.length - 1}@@`;
  });
  return [text, parts];
}

// A short inline formula keeps the punctuation after it on the same line
// (otherwise "… $\mathsf{X}$?" can wrap the "?" alone). Long formulas stay
// breakable at their relations so they never overflow a phone.
const restore = (html, parts) => html.replace(/@@M(\d+)@@([.,;:?!)]*)/g, (_, n, p) =>
  p && parts[+n].short ? `<span class="nowrap">${parts[+n]}${p}</span>` : `${parts[+n]}${p}`);

// Block Markdown (paragraphs, lists, quotes) with math.
export function md(src) {
  const [text, parts] = protect(src);
  return new Html(restore(marked.parse(text), parts));
}

// Single-line Markdown with math (option labels, titles).
export function mdInline(src) {
  const [text, parts] = protect(src);
  return new Html(restore(marked.parseInline(text), parts));
}
