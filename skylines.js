// Line-drawn skylines for the hero: the three cities in my story.
// Each city is drawn in "units" on a strip about 1000 wide, ground at y = 0
// and up negative, as an architect's elevation: outlines, a few details.
// draw(ctx) strokes outlines; detail(ctx) strokes the lighter linework.

const TAU = Math.PI * 2;

function box(c, x, y0, w, h) {
  c.rect(x, y0 - h, w, h);
}

function hline(c, x0, x1, y) {
  c.moveTo(x0, y);
  c.lineTo(x1, y);
}

function vline(c, x, y0, y1) {
  c.moveTo(x, y0);
  c.lineTo(x, y1);
}

function poly(c, pts, close = true) {
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  if (close) c.closePath();
}

// Top half of an ellipse standing on y.
function dome(c, cx, y, rx, ry) {
  c.moveTo(cx - rx, y);
  c.ellipse(cx, y, rx, ry, 0, Math.PI, TAU);
}

function columns(c, x0, x1, yTop, yBot, step) {
  for (let x = x0 + step / 2; x < x1; x += step) vline(c, x, yTop, yBot);
}

function windows(c, x, w, yTop, yBot, cols, rows) {
  for (let i = 1; i < cols; i++) vline(c, x + (w * i) / cols, yTop, yBot);
  for (let j = 1; j < rows; j++) hline(c, x, x + w, yTop + ((yBot - yTop) * j) / rows);
}

function minaret(c, x, h, w = 6) {
  poly(c, [[x - w / 2, 0], [x - w / 2, -h], [x, -h - 24], [x + w / 2, -h], [x + w / 2, 0]], false);
  hline(c, x - w, x + w, -h * 0.62);
  hline(c, x - w, x + w, -h * 0.84);
  vline(c, x, -h - 24, -h - 32);
}

function water(c, x0, x1) {
  hline(c, x0, x1, 0);
  for (let x = x0 + 8; x < x1 - 8; x += 26) {
    c.moveTo(x, 5);
    c.lineTo(x + 10, 5);
  }
}

// --- Washington, D.C. -----------------------------------------------------------

function dc(c) {
  // Lincoln Memorial
  hline(c, 30, 170, 0);
  box(c, 36, 0, 128, 6);
  box(c, 42, -6, 116, 6);
  box(c, 48, -12, 104, 40);
  box(c, 44, -52, 112, 9);
  box(c, 62, -61, 76, 12);
  // Reflecting pool
  hline(c, 175, 330, -1);
  // Washington Monument
  poly(c, [[343, 0], [351, -300], [357, -318], [363, -300], [371, 0]]);
  // Smithsonian Castle
  box(c, 430, 0, 110, 38);
  box(c, 440, -38, 14, 34);
  poly(c, [[440, -72], [447, -86], [454, -72]], false);
  box(c, 476, -38, 20, 52);
  for (let x = 476; x < 496; x += 5) box(c, x, -90, 2.5, 4);
  box(c, 520, -38, 12, 22);
  poly(c, [[520, -60], [526, -70], [532, -60]], false);
  // U.S. Capitol
  box(c, 590, 0, 320, 44);
  box(c, 598, -44, 304, 6);
  box(c, 704, -50, 92, 16);
  poly(c, [[710, -66], [750, -82], [790, -66]]);
  box(c, 712, -82, 76, 32);
  box(c, 722, -114, 56, 14);
  dome(c, 750, -128, 30, 46);
  box(c, 744, -174, 12, 16);
  dome(c, 750, -190, 6, 6);
  vline(c, 750, -196, -206);
  // Low federal blocks
  box(c, 930, 0, 30, 30);
  box(c, 962, 0, 34, 22);
}

function dcDetail(c) {
  columns(c, 48, 152, -52, -12, 8);
  columns(c, 598, 902, -38, -8, 9);
  columns(c, 712, 788, -114, -82, 6);
  columns(c, 722, 778, -128, -114, 5);
  windows(c, 430, 110, -30, -8, 8, 2);
  for (let a = -0.8; a <= 0.8; a += 0.4) {
    c.moveTo(750 + Math.sin(a) * 30, -128);
    c.quadraticCurveTo(750 + Math.sin(a) * 26, -128 - Math.cos(a) * 30, 750 + Math.sin(a) * 6, -172);
  }
  hline(c, 347, 367, -150);
}

// --- İstanbul ---------------------------------------------------------------------

function istanbul(c) {
  // Blue Mosque (Sultan Ahmed): cascading domes, six minarets
  box(c, 60, 0, 160, 46);
  dome(c, 75, -46, 14, 11);
  dome(c, 205, -46, 14, 11);
  dome(c, 102, -54, 24, 17);
  dome(c, 178, -54, 24, 17);
  box(c, 106, -54, 68, 12);
  dome(c, 140, -66, 38, 34);
  vline(c, 140, -100, -112);
  minaret(c, 14, 150);
  minaret(c, 38, 178);
  minaret(c, 242, 178);
  minaret(c, 266, 150);
  minaret(c, 62, 190, 5);
  minaret(c, 218, 190, 5);
  // Hagia Sophia: broad low dome, buttresses, four minarets
  box(c, 318, 0, 124, 52);
  box(c, 310, 0, 14, 66);
  box(c, 436, 0, 14, 66);
  dome(c, 344, -52, 22, 12);
  dome(c, 416, -52, 22, 12);
  box(c, 348, -52, 64, 20);
  dome(c, 380, -72, 36, 24);
  vline(c, 380, -96, -104);
  minaret(c, 300, 140, 7);
  minaret(c, 460, 150, 7);
  minaret(c, 326, 128, 5);
  minaret(c, 434, 128, 5);
  // Galata Tower
  poly(c, [[500, 0], [503, -148], [531, -148], [534, 0]], false);
  hline(c, 497, 537, -148);
  box(c, 500, -148, 34, 6);
  poly(c, [[499, -154], [517, -204], [535, -154]], false);
  vline(c, 517, -204, -214);
  // Houses down the hill
  [[548, 26], [578, 18], [602, 22]].forEach(([x, h]) => {
    box(c, x, 0, 26, h);
    poly(c, [[x - 2, -h], [x + 13, -h - 9], [x + 28, -h]], false);
  });
  // The Bosphorus, the bridge, and the Maiden's Tower
  water(c, 630, 1000);
  hline(c, 636, 1000, -40);
  [700, 930].forEach((x) => {
    vline(c, x - 4, -2, -176);
    vline(c, x + 4, -2, -176);
    [-64, -120, -172].forEach((y) => hline(c, x - 4, x + 4, y));
  });
  c.moveTo(640, -70);
  c.quadraticCurveTo(672, -112, 700, -172);
  c.moveTo(700, -172);
  c.quadraticCurveTo(815, 30, 930, -172);
  c.moveTo(930, -172);
  c.quadraticCurveTo(962, -112, 996, -72);
  box(c, 808, 0, 14, 24);
  poly(c, [[806, -24], [815, -38], [824, -24]], false);
  vline(c, 815, -38, -44);
}

function istanbulDetail(c) {
  // Hangers from the main cable to the deck.
  for (let x = 712; x < 930; x += 14) {
    const u = (x - 700) / 230;
    const y = (1 - u) * (1 - u) * -172 + 2 * (1 - u) * u * 30 + u * u * -172;
    vline(c, x, y, -40);
  }
  windows(c, 60, 160, -36, -10, 10, 1);
  windows(c, 318, 124, -40, -12, 8, 1);
  for (let x = 505; x < 530; x += 6) vline(c, x, -138, -128);
  hline(c, 501, 533, -104);
}

// --- Nashville ---------------------------------------------------------------------

function nashville(c) {
  // Tennessee State Capitol on its hill
  c.moveTo(20, 0);
  c.quadraticCurveTo(95, -28, 170, 0);
  box(c, 60, -18, 70, 34);
  poly(c, [[64, -52], [95, -64], [126, -52]]);
  box(c, 86, -64, 18, 26);
  box(c, 82, -90, 26, 22);
  box(c, 88, -112, 14, 8);
  dome(c, 95, -120, 7, 8);
  vline(c, 95, -128, -136);
  // Downtown towers
  box(c, 200, 0, 46, 132);
  box(c, 252, 0, 58, 176);
  hline(c, 252, 310, -170);
  box(c, 318, 0, 40, 108);
  // AT&T Building: the two spires everyone calls the Batman Building
  box(c, 372, 0, 70, 230);
  poly(c, [[372, -230], [376, -330], [384, -330], [388, -266], [407, -286], [426, -266], [430, -330], [438, -330], [442, -230]], false);
  box(c, 452, 0, 44, 150);
  box(c, 506, 0, 38, 118);
  // Pinnacle at Symphony Place
  box(c, 556, 0, 56, 196);
  box(c, 564, -196, 40, 14);
  box(c, 574, -210, 20, 12);
  vline(c, 584, -222, -262);
  box(c, 622, 0, 40, 92);
  // Cumberland River and the pedestrian bridge
  water(c, 676, 1000);
  hline(c, 676, 1000, -30);
  hline(c, 676, 1000, -36);
  for (let x = 700; x <= 980; x += 70) vline(c, x, 0, -30);
  for (let x = 700; x < 980; x += 70) {
    c.moveTo(x, -36);
    c.quadraticCurveTo(x + 35, -70, x + 70, -36);
  }
}

function nashvilleDetail(c) {
  windows(c, 200, 46, -126, -6, 4, 11);
  windows(c, 252, 58, -164, -6, 5, 14);
  windows(c, 318, 40, -102, -6, 3, 8);
  windows(c, 372, 70, -222, -6, 6, 18);
  windows(c, 452, 44, -144, -6, 4, 12);
  windows(c, 506, 38, -112, -6, 3, 9);
  windows(c, 556, 56, -190, -6, 5, 16);
  windows(c, 622, 40, -86, -6, 3, 7);
  c.moveTo(413, -250);
  c.arc(407, -250, 6, 0, TAU);
  columns(c, 60, 130, -52, -18, 7);
  for (let x = 700; x < 980; x += 70) {
    for (let k = 1; k < 5; k++) vline(c, x + k * 14, -36, -36 - Math.sin((k / 5) * Math.PI) * 32);
  }
}

// --- Far layers, lights and beacons --------------------------------------------
// The far layer is a seeded, generated city fabric drawn fainter behind the
// landmarks. It returns closed shapes (so they can take a faint fill) and the
// windows that are lit tonight.

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blocks(r, x0, x1, height, lit, out) {
  for (let x = x0; x < x1; ) {
    const w = 12 + r() * 26;
    const h = Math.max(8, height(x + w / 2) * (0.55 + r() * 0.6));
    out.rects.push([x, h, w]);
    const n = Math.floor((w * h) / 900 * lit);
    for (let k = 0; k < n; k++) out.lights.push([x + 3 + r() * (w - 6), -(4 + r() * (h - 8))]);
    x += w + 2 + r() * 7;
  }
}

function nashvilleFar() {
  const r = rng(615);
  const out = { rects: [], lights: [], extra: [] };
  blocks(r, 0, 1000, (x) => 26 + 150 * Math.exp(-(((x - 420) / 230) ** 2)), 1.3, out);
  return out;
}

function dcFar() {
  const r = rng(202);
  const out = { rects: [], lights: [], extra: [] };
  // D.C. keeps its buildings low; trees line the Mall.
  blocks(r, 0, 1000, (x) => 20 + 16 * Math.sin(x / 90) ** 2, 0.9, out);
  for (let x = 170; x < 340; x += 11 + r() * 6) out.extra.push(["tree", x, 9 + r() * 7]);
  for (let x = 545; x < 590; x += 12) out.extra.push(["tree", x, 10 + r() * 6]);
  return out;
}

function istanbulFar() {
  const r = rng(34);
  const out = { rects: [], lights: [], extra: [] };
  // Houses climbing the seven hills, a few distant minarets, the Asian shore.
  const hill = (x) => 22 + 34 * (0.5 + 0.5 * Math.sin(x / 120 + 1.2)) + 12 * Math.sin(x / 47);
  for (let x = 0; x < 620; ) {
    const w = 7 + r() * 9;
    const base = hill(x) * 0.55;
    out.rects.push([x, base + 6 + r() * 10, w]);
    if (r() < 0.35) out.lights.push([x + w / 2, -(base + 3 + r() * 5)]);
    x += w + 1 + r() * 3;
  }
  for (const x of [120, 280, 470, 560]) out.extra.push(["minaret", x, 70 + r() * 30]);
  for (let x = 640; x < 1000; x += 8 + r() * 10) {
    const h = 8 + r() * 10;
    out.rects.push([x, h, 5 + r() * 6]);
    if (r() < 0.4) out.lights.push([x + 3, -h + 3]);
  }
  return out;
}

export function drawFar(c, far) {
  far.rects.forEach(([x, h, w]) => c.rect(x, -h, w, h));
  far.extra.forEach(([kind, x, h]) => {
    if (kind === "tree") {
      c.moveTo(x - h * 0.7, 0);
      c.arc(x, -h * 0.55, h * 0.7, Math.PI, 0);
      c.lineTo(x + h * 0.7, 0);
    } else {
      c.rect(x - 2, -h, 4, h);
      c.moveTo(x - 2, -h);
      c.lineTo(x, -h - 12);
      c.lineTo(x + 2, -h);
    }
  });
}

// beacons: the red aviation lights on the tallest structures.
// moon: "full", or "crescent" for İstanbul, which has one on its flag.
export const CITIES = [
  {
    id: "nashville",
    name: "Nashville",
    draw: nashville,
    detail: nashvilleDetail,
    far: nashvilleFar(),
    beacons: [[380, -332], [434, -332], [584, -264]],
    moon: "full",
  },
  {
    id: "dc",
    name: "Washington, D.C.",
    draw: dc,
    detail: dcDetail,
    far: dcFar(),
    beacons: [[357, -320]],
    moon: "full",
  },
  {
    id: "istanbul",
    name: "İstanbul",
    draw: istanbul,
    detail: istanbulDetail,
    far: istanbulFar(),
    beacons: [[700, -178], [930, -178], [517, -216]],
    moon: "crescent",
  },
];

export const STRIP = 1000; // units per city strip
export const PEAK = 340; // tallest point, units
