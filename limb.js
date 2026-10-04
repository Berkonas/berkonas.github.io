// Home hero: a powered knee–ankle prosthesis, walking.
//
// The leg is drawn as a field of dots, the way a halftone or a dot-matrix
// display would show it: each frame the limb is painted small, one pixel per
// cell, and every cell becomes a dot sized by how much leg is in it. The knee
// and ankle motors come through in the accent red. Over the dots sit the
// numbers a gait lab would watch: knee and ankle angles on callouts, and
// scrolling hip, knee and ankle traces. Hover (or touch) to look through the
// dots at the drawing itself.
//
// The motion is normative sagittal gait (hip, knee, ankle over one cycle),
// with the pelvis rising and falling over the stance foot.

const rad = (d) => (d * Math.PI) / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const window01 = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
const easeOut = (x) => 1 - Math.pow(1 - x, 4);
// One decimal with a true minus sign, and never "−0.0".
const signed = (v) => {
  const r = Math.round(v * 10) / 10;
  return `${r > 0 ? "+" : r < 0 ? "−" : ""}${Math.abs(r).toFixed(1)}`;
};

// --- Gait --------------------------------------------------------------------

const BODY = 1.75; // stature, m
const SEG = { thigh: 0.245 * BODY, shank: 0.246 * BODY, ankleH: 0.068 };
const TILT = 10; // forward pelvic tilt, deg
const STRIDE = 1.38; // m
const FREQ = 0.86; // strides per second
const STANCE = 62; // % of the cycle the foot is on the ground

// Cubic Hermite through keyframes, wrapped around the cycle and tabulated.
function periodic(keys, samples = 400) {
  const pts = keys.filter((k) => k[0] < 100);
  const n = pts.length;
  const xAt = (i) => pts[((i % n) + n) % n][0] + 100 * Math.floor(i / n);
  const vAt = (i) => pts[((i % n) + n) % n][1];
  const slope = (i) => (vAt(i + 1) - vAt(i - 1)) / (xAt(i + 1) - xAt(i - 1));
  const table = new Float32Array(samples + 1);
  for (let k = 0; k <= samples; k++) {
    const x = (k / samples) * 100;
    let i = n - 1;
    for (let j = 0; j < n; j++) {
      if (x >= xAt(j) && x < xAt(j + 1)) {
        i = j;
        break;
      }
    }
    const x0 = xAt(i);
    const h = xAt(i + 1) - x0;
    const t = (x - x0) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    table[k] =
      (2 * t3 - 3 * t2 + 1) * vAt(i) + (t3 - 2 * t2 + t) * h * slope(i) + (-2 * t3 + 3 * t2) * vAt(i + 1) + (t3 - t2) * h * slope(i + 1);
  }
  return table;
}

function sample(table, pct) {
  const n = table.length - 1;
  const x = ((((pct % 100) + 100) % 100) / 100) * n;
  const i = Math.floor(x);
  const f = x - i;
  return table[i] * (1 - f) + table[Math.min(n, i + 1)] * f;
}

// Average sagittal joint angles over one gait cycle, % from heel strike.
const GAIT = {
  hip: periodic([[0, 30], [10, 27], [20, 19], [30, 10], [40, 1], [50, -8], [55, -10], [60, -6], [65, 2], [70, 12], [75, 20], [80, 26], [87, 31], [93, 31], [100, 30]]),
  knee: periodic([[0, 4], [6, 12], [14, 18], [22, 14], [32, 7], [42, 4], [48, 6], [54, 14], [60, 32], [66, 50], [72, 61], [78, 56], [85, 38], [92, 17], [97, 6], [100, 4]]),
  ankle: periodic([[0, 0], [5, -5], [10, -2], [20, 4], [30, 8], [40, 10], [46, 10], [52, 5], [57, -4], [62, -16], [66, -14], [72, -6], [80, 0], [90, 1], [100, 0]]),
};

function angles(p) {
  const pct = (((p % 1) + 1) % 1) * 100;
  return { pct, hip: sample(GAIT.hip, pct), knee: sample(GAIT.knee, pct), ankle: sample(GAIT.ankle, pct) };
}

// Sagittal chain from the hip (x forward, y up), with a foot frame.
function chain(a, hx, hy) {
  const ft = rad(a.hip - TILT);
  const K = { x: hx + SEG.thigh * Math.sin(ft), y: hy - SEG.thigh * Math.cos(ft) };
  const fs = ft - rad(a.knee);
  const A = { x: K.x + SEG.shank * Math.sin(fs), y: K.y - SEG.shank * Math.cos(fs) };
  const b = fs + rad(a.ankle);
  const c = Math.cos(b);
  const s = Math.sin(b);
  const at = (lx, ly) => ({ x: A.x + lx * c - ly * s, y: A.y + lx * s + ly * c });
  const heel = at(-0.06, -SEG.ankleH);
  const toe = at(0.2, -SEG.ankleH);
  return { H: { x: hx, y: hy }, K, A, at, heel, toe, low: Math.min(heel.y, toe.y) };
}

// Pelvis height over the cycle, so the stance foot stays on the floor: a
// short Fourier series keeps it as smooth as a real centre of mass.
const HIP_Y = (() => {
  const N = 240;
  const raw = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const p = i / N;
    raw[i] = -Math.min(chain(angles(p), 0, 0).low, chain(angles(p + 0.5), 0, 0).low);
  }
  const terms = [];
  for (let n = 0; n <= 4; n++) {
    let a = 0;
    let b = 0;
    for (let i = 0; i < N; i++) {
      const th = (2 * Math.PI * n * i) / N;
      a += raw[i] * Math.cos(th);
      b += raw[i] * Math.sin(th);
    }
    terms.push([(n ? 2 : 1) * (a / N), (n ? 2 : 1) * (b / N)]);
  }
  return (p) => terms.reduce((sum, [a, b], n) => sum + a * Math.cos(2 * Math.PI * n * p) + b * Math.sin(2 * Math.PI * n * p), 0);
})();

// --- The limb, as shapes ------------------------------------------------------
// tone: how bright the part reads (0..1); red: a motor, lit in the accent.

const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const FOOT = [[-0.055, -0.03], [-0.065, -0.058], [0, -0.068], [0.12, -0.066], [0.205, -0.06], [0.215, -0.045], [0.16, -0.03], [0.06, -0.012], [0.02, 0.004], [-0.035, -0.008]];

function shapes(p) {
  const hy = HIP_Y(p);
  const pro = chain(angles(p), 0, hy); // the prosthesis, near side
  const bio = chain(angles(p + 0.5), 0, hy); // the sound leg, far side
  const up = (L, d) => {
    const v = { x: L.H.x - L.K.x, y: L.H.y - L.K.y };
    const n = Math.hypot(v.x, v.y);
    return { x: L.H.x + (v.x / n) * d, y: L.H.y + (v.y / n) * d };
  };
  const out = [];
  // Sound leg: soft and dim, so the machine reads first.
  out.push({ kind: "capsule", p0: up(bio, 0.07), p1: bio.K, r0: 0.07, r1: 0.05, tone: 0.24 });
  out.push({ kind: "capsule", p0: bio.K, p1: bio.A, r0: 0.05, r1: 0.032, tone: 0.22 });
  out.push({ kind: "poly", pts: FOOT.map(([x, y]) => bio.at(x, y)), tone: 0.2 });

  // Prosthesis, hip to toe: socket, pyramid adapter, powered knee, actuator
  // housing, pylon, powered ankle, foot shell.
  const S1 = lerp(pro.H, pro.K, 0.56);
  const S2 = lerp(pro.H, pro.K, 0.7);
  out.push({ kind: "capsule", p0: up(pro, 0.08), p1: S1, r0: 0.078, r1: 0.056, tone: 0.72 });
  out.push({ kind: "capsule", p0: S1, p1: S2, r0: 0.022, r1: 0.022, tone: 0.95 });
  out.push({ kind: "capsule", p0: S2, p1: pro.K, r0: 0.05, r1: 0.047, tone: 0.84 });
  const sh = (t) => lerp(pro.K, pro.A, t);
  out.push({ kind: "capsule", p0: pro.K, p1: sh(0.42), r0: 0.043, r1: 0.036, tone: 0.8 });
  out.push({ kind: "capsule", p0: sh(0.42), p1: sh(0.8), r0: 0.017, r1: 0.017, tone: 0.93 });
  out.push({ kind: "capsule", p0: sh(0.78), p1: pro.A, r0: 0.034, r1: 0.04, tone: 0.84 });
  out.push({ kind: "poly", pts: FOOT.map(([x, y]) => pro.at(x, y)), tone: 0.74 });

  // The hardware that makes it a powered leg, set behind the shank: the knee
  // motor and drive housing, and the push-rod that drives the ankle.
  const ux = (pro.A.x - pro.K.x) / SEG.shank;
  const uy = (pro.A.y - pro.K.y) / SEG.shank;
  const back = (pt, d) => ({ x: pt.x + uy * d, y: pt.y - ux * d });
  out.push({ kind: "capsule", p0: back(sh(0.1), 0.058), p1: back(sh(0.38), 0.062), r0: 0.03, r1: 0.027, tone: 0.9 });
  out.push({ kind: "circle", c: back(sh(0.1), 0.058), r: 0.014, red: true });
  out.push({ kind: "capsule", p0: back(sh(0.44), 0.05), p1: pro.at(-0.05, -0.022), r0: 0.011, r1: 0.011, tone: 0.97 });
  // The socket's brim, where the limb meets the machine.
  const tx = (pro.K.x - pro.H.x) / SEG.thigh;
  const ty = (pro.K.y - pro.H.y) / SEG.thigh;
  const across = (pt, d) => ({ x: pt.x + ty * d, y: pt.y - tx * d });
  const brim = up(pro, 0.03);
  out.push({ kind: "capsule", p0: across(brim, -0.088), p1: across(brim, 0.088), r0: 0.015, r1: 0.015, tone: 0.95 });
  out.push({ kind: "circle", c: pro.K, r: 0.046, tone: 1 });
  out.push({ kind: "circle", c: pro.K, r: 0.027, red: true });
  out.push({ kind: "circle", c: pro.A, r: 0.024, red: true });
  out.push({ kind: "circle", c: sh(0.24), r: 0.011, red: true });
  return { list: out, pro, bio, hy };
}

// Tapered capsule between two screen points.
function capsulePath(g, P0, P1, R0, R1) {
  const dx = P1.x - P0.x;
  const dy = P1.y - P0.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const a = Math.atan2(ny, nx);
  g.beginPath();
  g.moveTo(P0.x + nx * R0, P0.y + ny * R0);
  g.lineTo(P1.x + nx * R1, P1.y + ny * R1);
  g.arc(P1.x, P1.y, R1, a, a + Math.PI, true);
  g.lineTo(P0.x - nx * R0, P0.y - ny * R0);
  g.arc(P0.x, P0.y, R0, a + Math.PI, a, true);
  g.closePath();
  return { nx, ny };
}

// Paint the limb solid and shaded: this is what the dots sample.
function paintSolid(g, list, T, scale) {
  list.forEach((s) => {
    if (s.red) {
      const C = T(s.c);
      g.fillStyle = "rgb(255, 36, 64)";
      g.beginPath();
      g.arc(C.x, C.y, s.r * scale, 0, Math.PI * 2);
      g.fill();
      return;
    }
    const v = Math.round(255 * s.tone);
    if (s.kind === "circle") {
      const C = T(s.c);
      g.fillStyle = `rgb(${v}, ${v}, ${v})`;
      g.beginPath();
      g.arc(C.x, C.y, s.r * scale, 0, Math.PI * 2);
      g.fill();
    } else if (s.kind === "poly") {
      g.fillStyle = `rgb(${v}, ${v}, ${v})`;
      g.beginPath();
      s.pts.forEach((pt, i) => {
        const P = T(pt);
        if (i) g.lineTo(P.x, P.y);
        else g.moveTo(P.x, P.y);
      });
      g.closePath();
      g.fill();
    } else {
      const P0 = T(s.p0);
      const P1 = T(s.p1);
      const R0 = s.r0 * scale;
      const R1 = s.r1 * scale;
      const { nx, ny } = capsulePath(g, P0, P1, R0, R1);
      // A cylinder lit from the upper left: bright band, falling to a dark edge.
      const M = { x: (P0.x + P1.x) / 2, y: (P0.y + P1.y) / 2 };
      const R = (R0 + R1) / 2;
      const grad = g.createLinearGradient(M.x + nx * R, M.y + ny * R, M.x - nx * R, M.y - ny * R);
      const at = (k) => `rgb(${Math.round(v * k)}, ${Math.round(v * k)}, ${Math.round(v * k)})`;
      grad.addColorStop(0, at(0.5));
      grad.addColorStop(0.32, at(1));
      grad.addColorStop(1, at(0.42));
      g.fillStyle = grad;
      g.fill();
    }
  });
}

// --- Renderer ----------------------------------------------------------------

function start(host) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const hero = host.closest(".hero") || host;

  const css = getComputedStyle(document.documentElement);
  const rgb = (name, fallback) => (css.getPropertyValue(name).trim() || fallback).split(/\s+/).join(", ");
  const INK = rgb("--on-stage-rgb", "245 245 244");
  const ACCENT = rgb("--accent-rgb", "232 48 75");
  const STAGE = rgb("--stage-rgb", "8 8 8");

  // The small canvas the limb is painted into, one pixel per dot.
  const src = document.createElement("canvas");
  const sctx = src.getContext("2d", { willReadFrequently: true });

  let W = 1;
  let Hc = 1;
  let dpr = 1;
  let cell = 7; // CSS px per dot
  let cols = 1;
  let rows = 1;
  let scale = 1; // px per metre on the stage
  let ox = 0; // hip, on screen
  let groundY = 0;
  let vignette = new Float32Array(1);

  function resize() {
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width);
    Hc = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(Hc * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${Hc}px`;
    cols = Math.max(1, Math.floor(W / cell));
    rows = Math.max(1, Math.floor(Hc / cell));
    src.width = cols;
    src.height = rows;
    host.style.setProperty("--cell", `${cell}px`);
    // The leg fills the stage: hip near the top, the floor at 70%, and the
    // swing reach (about 45 cm either way) kept clear of the callout margin.
    groundY = Hc * 0.7;
    scale = Math.min((groundY - Hc * 0.07) / 0.93, (W * 0.29) / 0.45);
    ox = W * 0.33;
    // Edges fade out, the way a lens falls off.
    vignette = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const dx = ((i + 0.5) / cols - 0.42) / 0.62;
        const dy = ((j + 0.5) / rows - 0.48) / 0.62;
        const d = Math.hypot(dx, dy);
        vignette[j * cols + i] = 1 - clamp((d - 0.55) / 0.45, 0, 1);
      }
    }
  }

  const T = (pt) => ({ x: ox + pt.x * scale, y: groundY - pt.y * scale });

  // --- State -------------------------------------------------------------------

  const now = () => performance.now() / 1000;
  const bootAt = now();
  let phase = 0.12;
  let walked = 0;
  let lastT = 0;
  let enteredAt = 0;
  let onScreen = false;
  const trace = []; // recent { t, knee, ankle, stance }
  const pointer = { x: 0, y: 0, inside: false, lens: 0 };

  host.addEventListener("pointermove", (e) => {
    const r = host.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.inside = e.pointerType === "mouse" || e.buttons > 0;
  });
  host.addEventListener("pointerdown", (e) => {
    const r = host.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.inside = true;
  });
  const out = () => (pointer.inside = false);
  host.addEventListener("pointerleave", out);
  host.addEventListener("pointerup", (e) => {
    if (e.pointerType !== "mouse") out();
  });
  host.addEventListener("pointercancel", out);

  function step(t) {
    const dt = lastT ? Math.min(0.05, t - lastT) : 1 / 60;
    lastT = t;
    if (!enteredAt && onScreen && (hero.classList.contains("is-entered") || t - bootAt > 3)) enteredAt = t;
    phase = (phase + FREQ * dt) % 1;
    walked += STRIDE * FREQ * dt;
    pointer.lens += ((pointer.inside ? 1 : 0) - pointer.lens) * (1 - Math.exp(-dt * 10));
    const a = angles(phase);
    trace.push({ t, hip: a.hip, knee: a.knee, ankle: a.ankle, stance: a.pct < STANCE });
    while (trace.length && t - trace[0].t > 2.4) trace.shift();
    return a;
  }

  // --- Dots --------------------------------------------------------------------

  const LEVELS = 10;
  const inkPaths = Array.from({ length: LEVELS }, () => null);
  const redPaths = Array.from({ length: LEVELS }, () => null);

  function drawDots(t, list, rv) {
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.clearRect(0, 0, cols, rows);
    sctx.setTransform(1 / cell, 0, 0, 1 / cell, 0, 0);
    paintSolid(sctx, list, T, scale);
    const data = sctx.getImageData(0, 0, cols, rows).data;

    // The reveal: a scan line passes down the stage and the dots arrive
    // behind it.
    const scanRow = rv < 0 ? -1 : easeOut(window01(rv, 0, 1.15)) * (rows + 6);
    for (let k = 0; k < LEVELS; k++) {
      inkPaths[k] = new Path2D();
      redPaths[k] = new Path2D();
    }
    const glowInk = new Path2D();
    const glowRed = new Path2D();
    const half = cell / 2;
    for (let j = 0; j < rows; j++) {
      const appear = clamp((scanRow - j) / 6, 0, 1);
      if (appear <= 0) break;
      for (let i = 0; i < cols; i++) {
        const o = (j * cols + i) * 4;
        const alpha = data[o + 3] / 255;
        if (alpha < 0.04) continue;
        const r = data[o];
        const g = data[o + 1];
        const isRed = r > 120 && r > g * 1.7;
        const lum = isRed ? (r / 255) * alpha : ((0.299 * r + 0.587 * g + 0.114 * data[o + 2]) / 255) * alpha;
        // A slow wave runs through the field, so it reads as a live display.
        const pulse = 1 + 0.1 * Math.sin(t * 2.4 - i * 0.21 - j * 0.13);
        const v = Math.pow(lum, 0.85) * vignette[j * cols + i] * appear * pulse;
        if (v < 0.06) continue;
        const level = Math.min(LEVELS - 1, Math.floor(v * LEVELS));
        const radius = half * (0.18 + 0.82 * ((level + 1) / LEVELS));
        const cx = i * cell + half;
        const cy = j * cell + half;
        const path = isRed ? redPaths[level] : inkPaths[level];
        path.moveTo(cx + radius, cy);
        path.arc(cx, cy, radius, 0, Math.PI * 2);
        if (level >= LEVELS - 3 || isRed) {
          const glow = isRed ? glowRed : glowInk;
          glow.moveTo(cx + radius * 2.4, cy);
          glow.arc(cx, cy, radius * 2.4, 0, Math.PI * 2);
        }
      }
    }
    // Bloom first, then the dots, brightest last.
    ctx.fillStyle = `rgba(${INK}, 0.05)`;
    ctx.fill(glowInk);
    ctx.fillStyle = `rgba(${ACCENT}, 0.16)`;
    ctx.fill(glowRed);
    for (let k = 0; k < LEVELS; k++) {
      ctx.fillStyle = `rgba(${INK}, ${0.35 + 0.65 * ((k + 1) / LEVELS)})`;
      ctx.fill(inkPaths[k]);
      ctx.fillStyle = `rgba(${ACCENT}, ${0.55 + 0.45 * ((k + 1) / LEVELS)})`;
      ctx.fill(redPaths[k]);
    }

    if (rv >= 0 && rv < 1.5) {
      const y = (scanRow / rows) * Hc;
      const a = 1 - window01(rv, 1.0, 1.45);
      const band = ctx.createLinearGradient(0, y - 40, 0, y);
      band.addColorStop(0, `rgba(${ACCENT}, 0)`);
      band.addColorStop(1, `rgba(${ACCENT}, ${0.12 * a})`);
      ctx.fillStyle = band;
      ctx.fillRect(0, y - 40, W, 40);
      ctx.fillStyle = `rgba(${ACCENT}, ${0.9 * a})`;
      ctx.fillRect(0, y - 0.5, W, 1);
    }
  }

  // --- The data layer ----------------------------------------------------------

  const mono = (size, weight = 500) => `${weight} ${size}px "IBM Plex Mono", ui-monospace, monospace`;

  function drawGround(alpha) {
    const x0 = W * 0.05;
    const x1 = W * 0.95;
    ctx.strokeStyle = `rgba(${INK}, ${0.28 * alpha})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(x0, groundY + 0.5);
    ctx.lineTo(x1, groundY + 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
    // Treadmill belt: ticks every 10 cm running backwards under the foot.
    const step = 0.1 * scale;
    const off = (walked * scale) % step;
    ctx.beginPath();
    for (let x = x1 - off; x > x0; x -= step) {
      ctx.moveTo(x, groundY + 4);
      ctx.lineTo(x, groundY + 8);
    }
    ctx.strokeStyle = `rgba(${INK}, ${0.2 * alpha})`;
    ctx.stroke();
  }

  // An engineering callout: a dot on the part, a leader with one elbow, and
  // the label in the margin. "draw" (0..1) grows the leader on entrance.
  function callout(P, y, label, value, red, draw) {
    if (draw <= 0) return;
    const lx = W * 0.7;
    const ex = lx - 16;
    const len1 = Math.hypot(ex - P.x, y - P.y);
    const len2 = lx - 6 - ex;
    const total = len1 + len2;
    const d = total * easeOut(draw);
    const col = red ? ACCENT : INK;
    ctx.strokeStyle = `rgba(${col}, 0.7)`;
    ctx.fillStyle = `rgba(${col}, 0.95)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(P.x, P.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(P.x, P.y);
    if (d <= len1) {
      const k = d / len1;
      ctx.lineTo(P.x + (ex - P.x) * k, P.y + (y - P.y) * k);
    } else {
      ctx.lineTo(ex, y);
      ctx.lineTo(ex + (d - len1), y);
    }
    ctx.stroke();
    const textA = window01(draw, 0.6, 1);
    if (textA <= 0) return;
    ctx.globalAlpha = textA;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = mono(9.5);
    ctx.fillStyle = `rgba(${INK}, 0.5)`;
    ctx.fillText(label, lx, y - 4);
    ctx.font = mono(13);
    ctx.fillStyle = `rgba(${red ? ACCENT : INK}, 0.95)`;
    ctx.fillText(value, lx, y + 12);
    ctx.globalAlpha = 1;
  }

  function drawTraces(t, alpha) {
    if (trace.length < 2 || alpha <= 0) return;
    const x0 = W * 0.06;
    const x1 = W * 0.94;
    const top = groundY + Math.max(30, Hc * 0.075);
    const h = Math.max(34, Math.min(72, Hc - top - 10));
    const span = 2.4;
    const X = (tt) => x1 - ((t - tt) / span) * (x1 - x0);
    ctx.globalAlpha = alpha;
    // Stance spans of the prosthetic foot, shaded behind the curves.
    ctx.fillStyle = `rgba(${INK}, 0.035)`;
    let s0 = null;
    trace.forEach((p, i) => {
      if (p.stance && s0 === null) s0 = p.t;
      if ((!p.stance || i === trace.length - 1) && s0 !== null) {
        ctx.fillRect(X(s0), top, X(p.t) - X(s0), h);
        s0 = null;
      }
    });
    ctx.strokeStyle = `rgba(${INK}, 0.12)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, top + 0.5, x1 - x0 - 1, h - 1);
    const curve = (get, lo, hi, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      trace.forEach((p, i) => {
        const y = top + h - ((get(p) - lo) / (hi - lo)) * h;
        if (i) ctx.lineTo(X(p.t), y);
        else ctx.moveTo(X(p.t), y);
      });
      ctx.stroke();
    };
    curve((p) => p.hip, -15, 38, `rgba(${INK}, 0.32)`);
    curve((p) => p.knee, -5, 70, `rgba(${INK}, 0.85)`);
    curve((p) => p.ankle, -22, 16, `rgba(${ACCENT}, 0.9)`);
    ctx.globalAlpha = 1;
  }

  // The x-ray lens: inside it, the dots give way to the drawing they render.
  function drawLens(list, pro) {
    const k = pointer.lens;
    if (k < 0.02) return;
    const R = Math.min(84, W * 0.2) * easeOut(k);
    const { x, y } = pointer;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = `rgba(${STAGE}, 0.94)`;
    ctx.fillRect(x - R, y - R, R * 2, R * 2);
    // Fine construction grid.
    ctx.strokeStyle = `rgba(${INK}, 0.07)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = Math.floor((x - R) / 12) * 12; gx < x + R; gx += 12) {
      ctx.moveTo(gx + 0.5, y - R);
      ctx.lineTo(gx + 0.5, y + R);
    }
    for (let gy = Math.floor((y - R) / 12) * 12; gy < y + R; gy += 12) {
      ctx.moveTo(x - R, gy + 0.5);
      ctx.lineTo(x + R, gy + 0.5);
    }
    ctx.stroke();
    // Outlines of every part, motors in red.
    list.forEach((s) => {
      ctx.lineWidth = 1;
      if (s.kind === "capsule") {
        capsulePath(ctx, T(s.p0), T(s.p1), s.r0 * scale, s.r1 * scale);
      } else if (s.kind === "poly") {
        ctx.beginPath();
        s.pts.forEach((pt, i) => {
          const P = T(pt);
          if (i) ctx.lineTo(P.x, P.y);
          else ctx.moveTo(P.x, P.y);
        });
        ctx.closePath();
      } else {
        const C = T(s.c);
        ctx.beginPath();
        ctx.arc(C.x, C.y, s.r * scale, 0, Math.PI * 2);
      }
      const dim = s.tone !== undefined && s.tone < 0.3;
      ctx.fillStyle = s.red ? `rgba(${ACCENT}, 0.25)` : `rgba(${INK}, ${dim ? 0.02 : 0.05})`;
      ctx.fill();
      ctx.strokeStyle = s.red ? `rgba(${ACCENT}, 0.95)` : `rgba(${INK}, ${dim ? 0.3 : 0.85})`;
      ctx.stroke();
    });
    // Centre lines through the thigh and shank, as on a drawing.
    ctx.setLineDash([8, 3, 2, 3]);
    ctx.strokeStyle = `rgba(${ACCENT}, 0.6)`;
    ctx.beginPath();
    [[pro.H, pro.K], [pro.K, pro.A]].forEach(([a, b]) => {
      const A = T(a);
      const B = T(b);
      ctx.moveTo(A.x + (A.x - B.x) * 0.12, A.y + (A.y - B.y) * 0.12);
      ctx.lineTo(B.x + (B.x - A.x) * 0.12, B.y + (B.y - A.y) * 0.12);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.strokeStyle = `rgba(${ACCENT}, ${0.85 * k})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = mono(9);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const tw = ctx.measureText("DRAWING").width + 10;
    ctx.fillStyle = `rgba(${STAGE}, ${0.9 * k})`;
    ctx.fillRect(x - tw / 2, y - R - 17, tw, 14);
    ctx.fillStyle = `rgba(${ACCENT}, ${0.9 * k})`;
    ctx.fillText("DRAWING", x, y - R - 6);
  }

  function draw(t, a = angles(phase)) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hc);
    const rv = enteredAt ? t - enteredAt : -1;
    if (rv < 0) return; // nothing on stage until the hero arrives

    const { list, pro } = shapes(phase);
    const dataIn = window01(rv, 0.6, 1.4);
    drawGround(dataIn);
    drawDots(t, list, rv);

    // Callouts, laid out down the right margin without colliding.
    const Kp = T(pro.K);
    const Ap = T(pro.A);
    const floorTop = groundY - 14;
    const rowsY = [Math.min(Kp.y, floorTop - 48), Math.min(Ap.y, floorTop)];
    rowsY[1] = Math.max(rowsY[1], rowsY[0] + 48);
    const grow = (d) => window01(rv, 0.9 + d, 1.7 + d);
    callout(Kp, rowsY[0], "KNEE", `${a.knee.toFixed(1)}°`, false, grow(0));
    callout(Ap, rowsY[1], "ANKLE", `${signed(a.ankle)}°`, false, grow(0.12));

    drawTraces(t, dataIn);
    drawLens(list, pro);
  }

  // --- Loop --------------------------------------------------------------------

  let running = false;
  let inView = true;
  let raf = 0;

  // Frame budget: time our own drawing. If a slower device keeps needing more
  // than ~9 ms, coarsen the dot grid a step, which halves the work quickly.
  let cost = 0;
  let costFrames = 0;
  function adaptQuality(ms) {
    cost = costFrames ? cost * 0.95 + ms * 0.05 : ms;
    costFrames++;
    if (costFrames < 90 || cost < 9 || cell >= 11) return;
    cell += 1;
    costFrames = 0;
    resize();
  }

  function frame() {
    raf = 0;
    if (!running) return;
    const t = now();
    const t0 = performance.now();
    const a = step(t);
    draw(t, a);
    adaptQuality(performance.now() - t0);
    raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (!inView || document.hidden || running) return;
    running = true;
    lastT = 0;
    raf = requestAnimationFrame(frame);
  }

  function sleep() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // Phones get a slightly finer grid: the stage is smaller.
  cell = window.matchMedia("(max-width: 560px)").matches ? 6 : 7;
  resize();
  draw(now());
  wake();
  host.classList.add("is-live");

  new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (entry.intersectionRatio >= 0.55) onScreen = true;
      if (inView) wake();
      else sleep();
    },
    { threshold: [0, 0.55] }
  ).observe(host);
  document.addEventListener("visibilitychange", () => (document.hidden ? sleep() : wake()));
  new ResizeObserver(() => {
    resize();
    if (!running) draw(now());
  }).observe(host);
}

const host = document.querySelector("[data-limb]");
if (host) start(host);
