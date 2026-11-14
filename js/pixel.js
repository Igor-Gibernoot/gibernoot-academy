// 8-bit art: course mascots (trail) and course banners (home), drawn from
// character grids into tiny canvases that CSS scales up with crisp pixels
// (image-rendering: pixelated). No image files. A course picks its art in
// courses/catalog.yaml: `mascot: <sprite>` and `banner: <scene>`.
//
// Sprite: palette (one char per colour, '.' = empty), body rows shared by all
// frames, then `legs` (one row list per walk frame). Every sprite gets a dark
// 1-pixel outline drawn around it, so it reads on light and dark backgrounds.

export const OUTLINE = '#1b1b24';

export const SPRITES = {
  // Wild white hair, moustache, grey sweater: the relativity course.
  einstein: {
    pal: { W: '#f4f4f6', w: '#a9a9b6', S: '#f2c48d', s: '#d39a63', K: '#26262e', M: '#e2e2e8', G: '#7a8aa3', g: '#56637a', T: '#ffffff', B: '#6b5238' },
    body: [
      '...W..WW..W..W..',
      '..WWWWWWWWWWWW..',
      '.WWWWWWWWWWWWWW.',
      'WWWWSSSSSSSSWWWW',
      'WWWSSSSSSSSSSWWW',
      '.WWSwwSSSSwwSWW.',
      '.WWSSKSSSSKSSWW.',
      '..WSSSSssSSSSW..',
      '...SSMMMMMMSS...',
      '....SSSSSSSS....',
      '.....SSSSSS.....',
      '....GGGTTGGG....',
      '..GGGGGTTGGGGG..',
      '.GGGGGGgGGGGGGG.',
      '.GGGGGGgGGGGGGG.',
      '.SgGGGGgGGGGGgS.',
      '...GGGGGGGGGG...',
    ],
    legs: [
      ['...BBBB..BBBB...', '...BBBB..BBBB...', '..KKKKK..KKKKK..'],
      ['...BBBB..BBBB...', '...KKKK..BBBB...', '.........KKKKK..'],
    ],
  },
  // A pink brain with eyes: active inference.
  brain: {
    pal: { P: '#f59ab5', p: '#c9577c', W: '#ffffff', K: '#26262e' },
    body: [
      '.....PPPPPP.....',
      '...PPpPPPPpPP...',
      '..PPPPpPPpPPPP..',
      '.PPpPPPPPPPPpPP.',
      '.PPPpPPPpPPPpPP.',
      'PPpPPPPPpPPPPPpP',
      'PPPPWWPPPPWWPPPP',
      'PPPPWKPPPPWKPPPP',
      'PpPPPPPPPPPPPPpP',
      '.PPPPPKKKKPPPPP.',
      '.PPpPPPPPPPPpPP.',
      '..PPPPPpPPPPPP..',
      '....PPPPPPPP....',
      '.......pp.......',
    ],
    legs: [
      ['.....K....K.....', '.....K....K.....', '....KK....KK....'],
      ['.....K....K.....', '....K......K....', '...KK......KK...'],
    ],
  },
  // A robot whose screen shows a bell curve: information geometry.
  robot: {
    pal: { R: '#ff5a5a', L: '#b8c0cc', D: '#1d3b3a', N: '#5cf2a0', A: '#4f8de0', Y: '#ffd23f' },
    body: [
      '.......R........',
      '.......L........',
      '..LLLLLLLLLLLL..',
      '..LDDDDDDDDDDL..',
      '..LDDDDNNDDDDL..',
      '..LDDDNDDNDDDL..',
      '..LDDNDDDDNDDL..',
      '..LNNDDDDDDNNL..',
      '..LDDDDDDDDDDL..',
      '..LLLLLLLLLLLL..',
      '.....LLLLLL.....',
      '..AAAAAAAAAAAA..',
      '.LAAAYAAAAYAAAL.',
      '.LAAAAAAAAAAAAL.',
      '.LAAAAAAAAAAAAL.',
      '..AAAAAAAAAAAA..',
    ],
    legs: [
      ['....LL....LL....', '....LL....LL....', '...LLL....LLL...'],
      ['....LL....LL....', '...LL......LL...', '..LLL......LLL..'],
    ],
  },
  // Hard hat with a lamp, cyan goggles, orange safety vest and a wrench: how the world works.
  engineer: {
    pal: { Y: '#ffc928', y: '#d99a00', W: '#fffbe0', S: '#f2c48d', K: '#26262e', C: '#5ce1ff', O: '#ff7a1f', R: '#fff2b0', B: '#3f6fd0', G: '#b8c0cc' },
    body: [
      '.....YYYYYY.....',
      '....YYWWYYYY....',
      '...YYYWWYYYYY...',
      '..yyyyyyyyyyyy..',
      '...KCCCKKCCCK...',
      '....SSSSSSSS....',
      '....SSKKKKSS....',
      '.....SSSSSS.....',
      '..OOOOOOOOOOOOGG',
      '.OOORROOOORROOOG',
      '.SOORROOOORROOSG',
      '.SOOOOOOOOOOOOSG',
      '..BBBBBBBBBBBB.G',
      '..BBBBBBBBBBBB..',
    ],
    legs: [
      ['....BBB..BBB....', '....KKK..KKK....'],
      ['....BBB..BBB....', '...KKK....KKK...'],
    ],
  },
  // Bald, white beard, toga and a lantern: science, faith and mind.
  philosopher: {
    pal: { S: '#e9b98a', s: '#c78f5e', w: '#c9c9d3', K: '#26262e', W: '#f4f4f6', T: '#f1e6c8', t: '#c9b88a', Y: '#ffd23f', R: '#8a4fd8' },
    body: [
      '.....SSSSSS.....',
      '....SSSSSSSS....',
      '...wSSSSSSSSw...',
      '...wSSSSSSSSw...',
      '...wSKSSSSKSw...',
      '....SSSssSSS....',
      '....WWWWWWWW....',
      '...WWWWWWWWWW...',
      '...TWWWWWWWWT...',
      '..TTRWWWWWWTTT..',
      '.TTTTRWWWWTTTTT.',
      '.TTTTTRWWTTTTTT.',
      '.STTTTTRTTTTTTSY',
      '..TTTTTTRTTTTT.Y',
      '..TTTTTTTRTTTT..',
      '..TtTTTTTTTTtT..',
    ],
    legs: [
      ['...TTTTTTTTTT...', '....SS....SS....', '....KK....KK....'],
      ['...TTTTTTTTTT...', '...SS......SS...', '...KK......KK...'],
    ],
  },
};

const rows = (s, f) => [...s.body, ...s.legs[f % s.legs.length]];
const spriteSize = s => ({ w: s.body[0].length + 2, h: s.body.length + s.legs[0].length + 2 });

// Paint one frame with its top-left corner (outline included) at (x0, y0).
function paintSprite(ctx, s, f, x0, y0) { paintGrid(ctx, s.pal, rows(s, f), x0, y0); }

// Any character grid with its palette and a 1-pixel dark outline (also used by medals.js).
export function paintGrid(ctx, pal, grid, x0, y0, outline = true) {
  const s = { pal };
  const on = (x, y) => grid[y]?.[x] != null && grid[y][x] !== '.';
  ctx.fillStyle = OUTLINE;
  if (outline) for (let y = -1; y <= grid.length; y++) for (let x = -1; x <= grid[0].length; x++)
    if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) ctx.fillRect(x0 + x + 1, y0 + y + 1, 1, 1);
  grid.forEach((r, y) => [...r].forEach((c, x) => {
    if (c === '.') return;
    ctx.fillStyle = s.pal[c] ?? '#ff00ff';
    ctx.fillRect(x0 + x + 1, y0 + y + 1, 1, 1);
  }));
}

export const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });

// Walk-cycle sheet (frames side by side) as a data URL, cached per sprite.
const sheets = new Map();
export function spriteSheet(name) {
  const s = SPRITES[name];
  if (!s) return null;
  if (!sheets.has(name)) {
    const { w, h } = spriteSize(s), n = s.legs.length;
    const c = canvas(w * n, h + 1), ctx = c.getContext('2d');
    // The second frame sits one pixel higher: a small bounce in the stride.
    for (let f = 0; f < n; f++) paintSprite(ctx, s, f, f * w, f % 2 ? 0 : 1);
    sheets.set(name, { url: c.toDataURL(), w, h: h + 1, frames: n });
  }
  return sheets.get(name);
}

// The trail mascot: a div whose background steps through the walk sheet.
// CSS (.mascot) scales it; the `walking` class runs the cycle.
export function mascotEl(name, scale = 3) {
  const sh = spriteSheet(name);
  if (!sh) return null;
  const el = document.createElement('div');
  el.className = 'mascot';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = `width:${sh.w * scale}px;height:${sh.h * scale}px;background-image:url(${sh.url});`
    + `background-size:${sh.frames * 100}% 100%;--frames:${sh.frames};`;
  return el;
}

// ---------- Banners (home page): 96 x 28 pixel scenes ----------

export const BANNER_W = 96, BANNER_H = 28;

// Small seeded random generator, so stars sit in the same place on every visit.
function rng(seed) {
  let t = seed >>> 0;
  return () => { t = (t + 0x6d2b79f5) >>> 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}

function painter(ctx) {
  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const g = {
    px,
    rect: (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); },
    // Horizontal colour bands from top to bottom.
    sky(colors) {
      const band = BANNER_H / colors.length;
      for (let y = 0; y < BANNER_H; y++) for (let x = 0; x < BANNER_W; x++) {
        const k = Math.min(colors.length - 1, Math.floor(y / band));
        px(x, y, colors[k]);
      }
    },
    stars(n, seed, colors, maxY = BANNER_H) {
      const r = rng(seed);
      for (let i = 0; i < n; i++) px(Math.floor(r() * BANNER_W), Math.floor(r() * maxY), colors[i % colors.length]);
    },
    disc(cx, cy, rad, c) {
      for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad + rad * 0.8) px(cx + x, cy + y, c);
    },
    // A curve y = f(x), with vertical runs filled so steep parts stay joined.
    curve(f, x0, x1, c) {
      let prev = null;
      for (let x = x0; x <= x1; x++) {
        const y = Math.round(f(x));
        if (prev != null) for (let k = Math.min(prev, y) + 1; k < Math.max(prev, y); k++) px(x - (y > prev ? 0 : 1), k, c);
        px(x, y, c);
        prev = y;
      }
    },
    grid(def, x0, y0, pal) {
      def.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px(x0 + x, y0 + y, pal[ch]); }));
    },
    // Sprite standing with its feet (outline included) on row `ground`.
    sprite(name, x, ground, frame = 0) {
      const s = SPRITES[name], { h } = spriteSize(s);
      paintSprite(ctx, s, frame, x, ground - h + 1);
    },
  };
  return g;
}

const gauss = (x, m, w) => Math.exp(-(((x - m) / w) ** 2));

export const BANNERS = {
  // Curved spacetime: a rubber-sheet grid dented by a planet.
  spacetime(g) {
    g.sky(['#0b1030', '#121a45', '#1a2560']);
    g.stars(34, 7, ['#ffffff', '#9fb4ff', '#ffe9a8']);
    const dent = x => 7 * gauss(x, 36, 13);
    for (let k = 0; k < 4; k++) g.curve(x => 14 + 4 * k + dent(x) * (1 - k / 4), 0, 95, ['#4fd1ff', '#3fb4ec', '#3196d6', '#2a7bbf'][k]);
    g.disc(36, 13, 5, '#ff9a3c');
    g.disc(35, 12, 3, '#ffc46b');
    g.px(34, 11, '#fff3d0');
    g.disc(60, 7, 1, '#d8d8e8');
    g.sprite('einstein', 74, 27);
  },
  // A brain standing in a moonlit forest, fireflies drifting between the pines.
  blanket(g) {
    g.sky(['#0a1f2e', '#0f3040', '#164a4a', '#1d5c4c']);
    g.stars(16, 11, ['#ffffff', '#bfe9ff'], 12);
    g.disc(80, 6, 4, '#fff1b8'); g.disc(82, 5, 3, '#0f3040');
    const pine = (x, base, hgt, c, d) => {
      for (let k = 0; k < hgt; k++) { const w = Math.floor(k / 2.2); g.rect(x - w, base - hgt + k, 2 * w + 1, 1, k % 4 === 3 ? d : c); }
      g.rect(x, base, 1, 2, '#4a3220');
    };
    [[6, 22, 14], [20, 23, 12], [58, 22, 15], [72, 23, 11], [90, 22, 14], [32, 22, 9], [66, 22, 9]].forEach(([x, b2, hh]) => pine(x, b2, hh, '#14503a', '#0d3a2b'));
    g.rect(0, 24, 96, 4, '#0b2a22'); g.rect(0, 24, 96, 1, '#1d6b4a');
    g.disc(48, 17, 9, '#1d5c4c');
    [[14, 6], [27, 12], [34, 5], [60, 9], [68, 14], [78, 17], [86, 8], [8, 15], [42, 3], [54, 4]].forEach(([x, y], i) => {
      g.px(x, y, '#ffe86b'); if (i % 2) { g.px(x + 1, y, '#c9a93a'); }
    });
    g.sprite('brain', 40, 26);
  },
  // Bell curves of different widths, and the robot that fits them.
  curves(g) {
    g.sky(['#062a2a', '#0a3a3a', '#0f4a48']);
    for (let x = 0; x < 96; x += 2) g.px(x, 26, '#1f6b66');
    for (let y = 4; y < 26; y += 2) for (let x = 0; x < 96; x += 12) g.px(x, y, '#155955');
    g.curve(x => 25 - 18 * gauss(x, 22, 6), 0, 60, '#5cf2a0');
    g.curve(x => 25 - 11 * gauss(x, 34, 11), 0, 64, '#ffd23f');
    g.curve(x => 25 - 7 * gauss(x, 48, 16), 0, 70, '#ff7ab8');
    g.sprite('robot', 74, 27);
  },
  // Sunset over a workshop town: factory with smoking chimneys, a big gear and a rocket lifting off.
  machines(g) {
    g.sky(['#2b1b4a', '#6a3a7a', '#d9645a', '#ffb36b']);
    g.stars(14, 4, ['#ffffff', '#ffe9a8'], 9);
    g.disc(34, 24, 7, '#ffd86b'); g.disc(34, 24, 4, '#fff1b8');
    // factory: sawtooth roof, chimneys, lit windows
    g.rect(0, 18, 30, 10, '#1d1530');
    for (let x = 0; x < 30; x += 6) for (let k = 0; k < 4; k++) g.rect(x + k, 15 + k, 1, 3 - k + 0, '#1d1530');
    g.rect(4, 6, 3, 12, '#2a1d40'); g.rect(20, 9, 3, 9, '#2a1d40');
    g.rect(3, 6, 5, 1, '#ff7a1f'); g.rect(19, 9, 5, 1, '#ff7a1f');
    [[5, 3], [7, 1], [21, 6], [23, 4], [25, 2]].forEach(([x, y]) => g.disc(x, y, 1, '#8b7aa0'));
    for (let x = 2; x < 28; x += 5) g.rect(x, 21, 3, 2, '#ffd23f');
    // big gear with a lit hub
    for (let a = 0; a < 12; a++) g.rect(Math.round(46 + 8 * Math.cos(a * Math.PI / 6)) - 1, Math.round(17 + 8 * Math.sin(a * Math.PI / 6)) - 1, 3, 3, '#8d97a6');
    g.disc(46, 17, 6, '#b5bfcc'); g.disc(46, 17, 3, '#6a4a7a'); g.disc(46, 17, 1, '#ffd23f');
    // rocket lifting off with a flame and smoke
    g.grid([
      '...R...',
      '..RRR..',
      '..WWW..',
      '..WBW..',
      '..WBW..',
      '..WWW..',
      '.RWWWR.',
      'RRWWWRR',
      '..OYO..',
      '..OYO..',
      '...Y...',
    ], 62, 5, { R: '#e53935', W: '#f4f4f6', B: '#5ce1ff', O: '#ff8a1f', Y: '#ffd23f' });
    [[65, 17], [64, 19], [66, 21], [63, 23], [65, 25]].forEach(([x, y], i) => g.disc(x, y, i < 3 ? 1 : 2, i % 2 ? '#c9b8d8' : '#e8dff0'));
    g.rect(0, 27, 96, 1, '#120c20');
    g.sprite('engineer', 74, 27);
  },
  // Dusk over a temple, a crescent moon and the first stars.
  temple(g) {
    g.sky(['#1d1640', '#3a2160', '#7a3a6e', '#d9774f']);
    g.stars(20, 3, ['#ffffff', '#ffe9a8'], 12);
    g.disc(14, 7, 4, '#fff1b8');
    g.disc(16, 6, 4, '#1d1640');
    g.rect(0, 26, 96, 2, '#2a1a35');
    const stone = '#efe2c4', shade = '#b8a77f';
    g.rect(34, 8, 30, 2, stone);
    for (let x = 34; x < 64; x++) g.px(x, 7 - Math.min(x - 34, 63 - x) / 5, stone);
    g.rect(33, 10, 32, 1, shade);
    for (let x = 36; x < 64; x += 6) { g.rect(x, 11, 2, 13, stone); g.rect(x + 2, 11, 1, 13, shade); }
    g.rect(32, 24, 34, 2, stone);
    g.sprite('philosopher', 74, 27);
  },
};

// A banner as a canvas element; CSS sizes it (.banner).
export function bannerEl(name) {
  const draw = BANNERS[name];
  if (!draw) return null;
  const c = canvas(BANNER_W, BANNER_H);
  c.className = 'banner';
  c.setAttribute('aria-hidden', 'true');
  draw(painter(c.getContext('2d')));
  return c;
}
