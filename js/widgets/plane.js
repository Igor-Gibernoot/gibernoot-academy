// Drawing helpers shared by the planar SVG widgets: SVG element factory,
// number formatting, and a plane with math y pointing up (arrows, labels,
// level lines, draggable handles).

const NS = 'http://www.w3.org/2000/svg';
export function s(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

export const fmt = x => (Math.abs(x) < 5e-3 ? '0' : String(Math.round(x * 100) / 100));

// "a x̂1 + b x̂2" in TeX, with the sign folded into the operator.
export const combo = (name, [a, b], basis = '\\hat{x}') =>
  `${name} = ${fmt(a)}\\,${basis}_1 ${b < 0 && fmt(b) !== '0' ? '-' : '+'} ${fmt(Math.abs(b))}\\,${basis}_2`;
export const dualCombo = (name, [a, b]) =>
  `${name} = ${fmt(a)}\\,\\hat{\\mathfrak{x}}^1 ${b < 0 ? '-' : '+'} ${fmt(Math.abs(b))}\\,\\hat{\\mathfrak{x}}^2`;

// ---------------------------------------------------------------------------
// Plane drawing helpers shared by the planar widgets (math y points up).
// ---------------------------------------------------------------------------
export const P = (x, y) => [x, -y];

export function line(a, b, cls) {
  const [x1, y1] = P(...a), [x2, y2] = P(...b);
  return s('line', { x1, y1, x2, y2, class: cls });
}
export function arrow(a, b, cls, head = 0.28) {
  const g = s('g', { class: cls });
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  if (L < 1e-6) return g;
  const ux = dx / L, uy = dy / L, hl = Math.min(head, L * 0.45), hw = hl * 0.55;
  const base = [b[0] - ux * hl, b[1] - uy * hl];
  g.append(line(a, base, ''));
  const pts = [b, [base[0] - uy * hw, base[1] + ux * hw], [base[0] + uy * hw, base[1] - ux * hw]]
    .map(p => P(...p).join(',')).join(' ');
  g.append(s('polygon', { points: pts, style: 'stroke-dasharray:none' }));
  return g;
}
export function label(p, text, cls = '') {
  const [x, y] = P(...p);
  const t = s('text', { x, y, class: `w-label ${cls}`, 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
  t.textContent = text;
  return t;
}
// Label placed just beyond the tip of the arrow from the origin to b.
export function tipLabel(b, text, cls = '') {
  const L = Math.hypot(...b) || 1;
  return label([b[0] + 0.42 * b[0] / L - 0.25 * b[1] / L, b[1] + 0.42 * b[1] / L + 0.25 * b[0] / L], text, cls);
}
// Level lines C(p) = n of a covector with components C in the old dual basis.
export function levelLines(C, cls = 'w-level') {
  const g = s('g');
  const n2 = C[0] ** 2 + C[1] ** 2;
  if (n2 < 1e-12) return g;
  const L = Math.sqrt(n2), d = [-C[1] / L, C[0] / L];
  for (let n = -15; n <= 15; n++) {
    const p0 = [n * C[0] / n2, n * C[1] / n2];
    g.append(line([p0[0] - 30 * d[0], p0[1] - 30 * d[1]], [p0[0] + 30 * d[0], p0[1] + 30 * d[1]], cls));
  }
  return g;
}

let clipCount = 0;
export function planeSvg(view, ariaLabel, layerNames) {
  const svg = s('svg', { viewBox: `${view.x} ${-(view.y + view.h)} ${view.w} ${view.h}`, role: 'img', 'aria-label': ariaLabel });
  // When the svg is wider than its viewBox (height capped by CSS), long lines
  // would show outside the plane: clip the drawing layers to it.
  const clipId = `plane-clip-${++clipCount}`;
  const clip = s('clipPath', { id: clipId });
  clip.append(s('rect', { x: view.x, y: -(view.y + view.h), width: view.w, height: view.h }));
  svg.append(clip);
  const free = ['labels', 'handles'];
  const layers = ['grid', ...layerNames].reduce((o, k) => {
    o[k] = s('g', free.includes(k) ? {} : { 'clip-path': `url(#${clipId})` });
    svg.append(o[k]);
    return o;
  }, {});
  for (let k = Math.ceil(view.x); k <= view.x + view.w; k++)
    layers.grid.append(line([k, view.y], [k, view.y + view.h], k === 0 ? 'w-axis' : 'w-grid'));
  for (let k = Math.ceil(view.y); k <= view.y + view.h; k++)
    layers.grid.append(line([view.x, k], [view.x + view.w, k], k === 0 ? 'w-axis' : 'w-grid'));
  return { svg, layers };
}

// A draggable circle: calls onMove([x, y]) with the snapped, clamped tip.
export function draggable(svg, view, c, snap, onMove) {
  c.addEventListener('pointerdown', e => {
    e.preventDefault();
    c.setPointerCapture(e.pointerId);
    const move = ev => {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      const m = pt.matrixTransform(svg.getScreenCTM().inverse());
      let v = [m.x, -m.y];
      if (snap) v = v.map(t => Math.round(t / snap) * snap);
      v = [Math.max(view.x + 0.2, Math.min(view.x + view.w - 0.2, v[0])),
           Math.max(view.y + 0.2, Math.min(view.y + view.h - 0.2, v[1]))];
      if (Math.hypot(...v) < 0.25) return;
      onMove(v);
    };
    const up = () => { c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up); };
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
  });
}
export function placeHandle(c, b) {
  const [cx, cy] = P(...b);
  c.setAttribute('cx', cx);
  c.setAttribute('cy', cy);
}
