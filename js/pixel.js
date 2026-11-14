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
    pal: { P: '#f59ab5', p: '#c9577c', W: '#ffffff', K: '#26262e', R: '#e53935', T: '#8a5a2b', Y: '#fff0a0', O: '#ff9a1f' },
    body: [
      '..................Y.',
      '.................YOY',
      '.................ORO',
      '..................O.',
      '.......PPPPPP.....T.',
      '.....PPpPPPPpPP...T.',
      '....PPPPpPPpPPPP..T.',
      '...PPpPPPPPPPPpPP.T.',
      '...RRRRRRRRRRRRRR.T.',
      '..PPpPKPPPPPPKPPRRT.',
      '..PPPPPKPPPPKPPPPPT.',
      '..PPPPWWPPPPWWPPPPP.',
      '.PPpPPWKPPPPWKPPpPP.',
      'P.PPPPPPPPPPPPPPPP..',
      'P..PPPPPKKKKPPPPP...',
      '...PPpPKPPPPKpPPP...',
      '....PPPPPpPPPPPP....',
      '......PPPPPPPP......',
    ],
    legs: [
      ['.......K....K.......', '.......K....K.......', '......KK....KK......'],
      ['.......K....K.......', '......K......K......', '.....KK......KK.....'],
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
  // Slim engineer: hard hat with a lamp, cyan goggles, orange vest with reflective stripes, a big wrench held up.
  engineer: {
    pal: { Y: '#ffc928', y: '#d99a00', W: '#fffbe0', S: '#f2c48d', K: '#26262e', C: '#5ce1ff', O: '#ff7a1f', R: '#fff2b0', B: '#3f6fd0', G: '#dfe5ee', P: '#f28f8f' },
    body: [
      '...YYWWYY.......',
      '..KCCYYCCK.GG.GG',
      '.yyyyyyyyy.GGGGG',
      '..SWKSSWKS...GG.',
      '..SSSKKSSS...GG.',
      '...SSSSSS....GG.',
      '..OOOOOOOOOSSGG.',
      '.SOORROORROO.GG.',
      '..OOOOOOOO...GG.',
      '..OORROORR...GG.',
      '..BBBBBBBB......',
    ],
    legs: [
      ['..BBB..BBB......', '..KKK..KKK......'],
      ['..BBB..BBB......', '.KKK....KKK.....'],
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
  // A brain exploring a dark, misty forest at dawn: torch in hand, eyes glowing in the bushes, crows overhead.
  blanket(g) {
    g.sky(['#5c7a90', '#8fa9b4', '#d9b99a', '#f2c488']);
    g.disc(12, 19, 6, '#ff9a4a'); g.disc(12, 19, 4, '#ffd27a');
    [[48, 6], [50, 5], [52, 6], [76, 9], [78, 8], [80, 9]].forEach(([x, y]) => { g.px(x, y, '#1b1b24'); g.px(x + 1, y + 1, '#1b1b24'); });
    const pine = (x, base, hgt, c, d) => {
      for (let k = 0; k < hgt; k++) { const w = Math.floor(k / 2.2); g.rect(x - w, base - hgt + k, 2 * w + 1, 1, k % 4 === 3 ? d : c); }
      g.rect(x, base, 1, 2, '#2a1d18');
    };
    [[30, 22, 11], [34, 22, 8]].forEach(([x, b2, hh]) => pine(x, b2, hh, '#486f66', '#3b5d56'));
    for (let y = 18; y < 24; y++) for (let x = 0; x < 96; x++) if ((x + y) % 2 === 0 && y % 2 === 0) g.px(x, y, '#cfdcd8');
    [[6, 23, 17], [19, 24, 14], [78, 24, 14], [91, 23, 17]].forEach(([x, b2, hh]) => pine(x, b2, hh, '#173f31', '#0f2c23'));
    g.rect(0, 24, 96, 4, '#1f3a26'); g.rect(0, 24, 96, 1, '#3d6a3a');
    for (let x = 1; x < 96; x += 3) g.px(x, 23, '#2c5a32');
    // bushes with eyes in the dark
    [[24, 21], [84, 21]].forEach(([x, y]) => { g.rect(x, y, 9, 3, '#0b1f18'); g.px(x + 2, y + 1, '#ff3b3b'); g.px(x + 5, y + 1, '#ff3b3b'); });
    // a wolf watching from the mist
    g.grid([
      '.K.K.........K',
      '.KKK........KK',
      'KKEKKKKKKKKKK.',
      'KKKKKKKKKKKKK.',
      '.KKKKKKKKKKKK.',
      '..KKKKKKKKKK..',
      '..KK.KK..KK.KK',
      '..KK.KK..KK.KK',
    ], 66, 17, { K: '#20242e', E: '#ffd23f' });
    g.sprite('brain', 38, 26);
    [[57, 6], [64, 5], [56, 11], [66, 10]].forEach(([x, y]) => g.px(x, y, '#ffd86b'));
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
  // A bright morning of inventions: hot-air balloon, wind turbine, rocket lifting off, and the engineer.
  machines(g) {
    g.sky(['#6fc0f2', '#9bd6f6', '#c9ebfa', '#f3f8e8']);
    g.disc(88, 6, 4, '#ffe27a'); g.disc(88, 6, 2, '#fff6c4');
    [[40, 4], [41, 4], [42, 4], [39, 5], [40, 5], [41, 5], [42, 5], [43, 5], [4, 12], [5, 12], [6, 12], [3, 13], [4, 13], [5, 13], [6, 13], [7, 13]].forEach(([x, y]) => g.px(x, y, '#ffffff'));
    // hills
    for (let x = 0; x < 96; x++) { const h = 24 + Math.round(1.6 * Math.sin(x / 8)); g.rect(x, h, 1, 28 - h, '#62b35c'); g.px(x, h, '#9be07a'); }
    // hot-air balloon
    g.disc(20, 9, 5, '#ff5a4f'); g.rect(19, 4, 3, 10, '#ffd23f'); g.rect(17, 9, 7, 1, '#ffffff');
    g.px(18, 14, '#5a4a3a'); g.px(22, 14, '#5a4a3a'); g.rect(18, 15, 5, 2, '#8a5a2b');
    // wind turbine
    g.rect(41, 13, 1, 11, '#f4f7fa'); g.disc(41, 12, 1, '#c9d2dc');
    [-80, 40, 160].forEach(a2 => { const r = a2 * Math.PI / 180; for (let t = 2; t <= 9; t += 0.5) { const x = 41 + t * Math.cos(r), y = 12 + t * Math.sin(r); g.px(x, y, '#ffffff'); if (t > 4) g.px(x + 1, y, '#dfe8f0'); } });
    g.disc(41, 12, 1, '#9aa7b5');
    // rocket lifting off
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
    ], 55, 3, { R: '#e53935', W: '#f4f4f6', B: '#5ce1ff', O: '#ff8a1f', Y: '#ffd23f' });
    [[58, 15, 1], [57, 17, 1], [59, 19, 2], [57, 21, 2], [59, 23, 2]].forEach(([x, y, r], i) => g.disc(x, y, r, i % 2 ? '#e3eaf1' : '#ffffff'));
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
