// Home hero: a point-light walker.
// Fifteen markers, the minimum a motion-capture lab puts on a body, driven by
// normative sagittal gait kinematics (hip, knee, ankle) on a body built from
// standard anthropometric ratios. Johansson showed in 1973 that dots alone are
// enough for people to see a person walking. Move the pointer to turn it;
// hover to reveal the skeleton. Type "tr" or "us" (or triple-click) for a flag.

// --- Kinematics --------------------------------------------------------------

const H = 1.75; // stature, m
const S = {
  thigh: 0.245 * H,
  shank: 0.246 * H,
  ankleH: 0.039 * H,
  heel: 0.05,
  toe: 0.2,
  hipW: 0.085,
  trunk: 0.29 * H,
  shoulderW: 0.18,
  upper: 0.186 * H,
  fore: 0.146 * H,
};
const TILT = 10; // forward pelvic tilt, deg
const rad = (d) => (d * Math.PI) / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Average sagittal joint angles over one gait cycle, % from heel strike.
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

const GAIT = {
  hip: periodic([[0, 30], [10, 27], [20, 19], [30, 10], [40, 1], [50, -8], [55, -10], [60, -6], [65, 2], [70, 12], [75, 20], [80, 26], [87, 31], [93, 31], [100, 30]]),
  knee: periodic([[0, 4], [6, 12], [14, 18], [22, 14], [32, 7], [42, 4], [48, 6], [54, 14], [60, 32], [66, 50], [72, 61], [78, 56], [85, 38], [92, 17], [97, 6], [100, 4]]),
  ankle: periodic([[0, 0], [5, -5], [10, -2], [20, 4], [30, 8], [40, 10], [46, 10], [52, 5], [57, -4], [62, -16], [66, -14], [72, -6], [80, 0], [90, 1], [100, 0]]),
};

function angles(p) {
  const pct = (((p % 1) + 1) % 1) * 100;
  return { pct, hip: sample(GAIT.hip, pct), knee: sample(GAIT.knee, pct), ankle: sample(GAIT.ankle, pct) };
}

// Sagittal leg chain from the hip joint (x forward, y up).
function leg(a, hx, hy) {
  const ft = rad(a.hip - TILT);
  const K = { x: hx + S.thigh * Math.sin(ft), y: hy - S.thigh * Math.cos(ft) };
  const fs = ft - rad(a.knee);
  const A = { x: K.x + S.shank * Math.sin(fs), y: K.y - S.shank * Math.cos(fs) };
  const b = fs + rad(a.ankle);
  const c = Math.cos(b);
  const s = Math.sin(b);
  const at = (lx, ly) => ({ x: A.x + lx * c - ly * s, y: A.y + lx * s + ly * c });
  const heel = at(-S.heel, -S.ankleH);
  const toe = at(S.toe, -S.ankleH);
  return { K, A, heel, toe, low: Math.min(heel.y, toe.y) };
}

// Pelvis height over the cycle. The stance foot sets it, so the body rises and
// falls as it vaults over each leg; a short Fourier series keeps the path as
// smooth as a real centre of mass instead of kinking at every heel strike.
const HIP_Y = (() => {
  const N = 240;
  const raw = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const p = i / N;
    raw[i] = -Math.min(leg(angles(p), 0, 0).low, leg(angles(p + 0.5), 0, 0).low);
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

// One full pose at gait phase p (0..1, right heel strike at 0).
function pose(p) {
  const aR = angles(p);
  const aL = angles(p + 0.5);
  const hipY = HIP_Y(p);
  const yaw = rad(4) * Math.cos(2 * Math.PI * p);
  const sway = 0.022 * Math.cos(2 * Math.PI * (p - 0.2));
  const hip = (side) => ({ x: Math.sin(yaw) * S.hipW * side, z: S.hipW * side + sway });
  const hR = hip(1);
  const hL = hip(-1);
  const R = leg(aR, hR.x, hipY);
  const L = leg(aL, hL.x, hipY);

  const lean = rad(3);
  const sc = { x: S.trunk * Math.sin(lean), y: hipY + S.trunk * Math.cos(lean), z: sway * 0.6 };
  const arm = (a, side) => {
    const sh = { x: sc.x + Math.sin(yaw * 0.6) * S.shoulderW * side, y: sc.y - 0.03, z: sc.z + S.shoulderW * side };
    const flex = rad(-0.55 * (a.hip - 10));
    const E = { x: sh.x + S.upper * Math.sin(flex), y: sh.y - S.upper * Math.cos(flex), z: sh.z + 0.02 * side };
    const ef = flex + rad(18 + Math.max(0, -0.55 * (a.hip - 10)) * 0.9);
    const W = { x: E.x + S.fore * Math.sin(ef), y: E.y - S.fore * Math.cos(ef), z: E.z + 0.01 * side };
    return { sh, E, W };
  };
  const armR = arm(aR, 1);
  const armL = arm(aL, -1);
  const head = { x: sc.x + 0.035, y: sc.y + 0.2, z: sc.z };
  const at = (pt, z) => ({ x: pt.x, y: pt.y, z });

  const m = {
    head,
    shR: armR.sh,
    shL: armL.sh,
    elR: armR.E,
    elL: armL.E,
    wrR: armR.W,
    wrL: armL.W,
    hipR: { x: hR.x, y: hipY, z: hR.z },
    hipL: { x: hL.x, y: hipY, z: hL.z },
    knR: at(R.K, hR.z),
    knL: at(L.K, hL.z),
    anR: at(R.A, hR.z * 0.92),
    anL: at(L.A, hL.z * 0.92),
    toR: at(R.toe, hR.z * 0.95 + 0.02),
    toL: at(L.toe, hL.z * 0.95 - 0.02),
  };
  // Whole-body centre of mass sits just in front of the sacrum.
  const com = { x: 0.03, y: hipY + 0.1, z: sway * 0.8 };
  return { m, com, aR, heelR: at(R.heel, hR.z), heelL: at(L.heel, hL.z) };
}

const MARKERS = ["head", "shR", "shL", "elR", "elL", "wrR", "wrL", "hipR", "hipL", "knR", "knL", "anR", "anL", "toR", "toL"];
const BONES = [
  ["shR", "shL"],
  ["hipR", "hipL"],
  ["shR", "hipR"],
  ["shL", "hipL"],
  ["shR", "elR"],
  ["elR", "wrR"],
  ["shL", "elL"],
  ["elL", "wrL"],
  ["hipR", "knR"],
  ["knR", "anR"],
  ["anR", "toR"],
  ["hipL", "knL"],
  ["knL", "anL"],
  ["anL", "toL"],
];
const TRAILS = ["anR", "anL"];

// Stride and cadence for a comfortable walk.
const STRIDE = 1.38; // m
const FREQ = 0.86; // strides per second

// --- Flags (easter egg) ------------------------------------------------------

function star(ctx, cx, cy, r, rotation) {
  ctx.beginPath();
  for (let k = 0; k < 10; k += 1) {
    const radius = k % 2 ? r * 0.382 : r;
    const a = rotation + (k * Math.PI) / 5;
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fill();
}

function drawTurkishFlag(ctx, w, h) {
  const G = h;
  ctx.fillStyle = "#e30a17";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0.5 * G, h / 2, 0.25 * G, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e30a17";
  ctx.beginPath();
  ctx.arc(0.5625 * G, h / 2, 0.2 * G, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  star(ctx, 0.8958 * G, h / 2, 0.125 * G, Math.PI);
}

function drawUSFlag(ctx, w, h) {
  const stripe = h / 13;
  for (let k = 0; k < 13; k += 1) {
    ctx.fillStyle = k % 2 ? "#ffffff" : "#b22234";
    ctx.fillRect(0, k * stripe, w, stripe + 0.5);
  }
  const cw = 0.4 * w;
  const ch = 7 * stripe;
  ctx.fillStyle = "#3c3b6e";
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = "#fff";
  for (let r = 0; r < 5; r += 1) {
    for (let c = 0; c < 6; c += 1) {
      star(ctx, cw * (0.09 + c * 0.164), ch * (0.12 + r * 0.19), ch * 0.055, -Math.PI / 2);
    }
  }
}

// Flag cloth as a grid of colours sampled from a small painted canvas.
function flagCloth(draw, aspect) {
  const COLS = 30;
  const ROWS = Math.round(COLS / aspect);
  const px = 8;
  const c = document.createElement("canvas");
  c.width = COLS * px;
  c.height = ROWS * px;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  draw(ctx, c.width, c.height);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const colors = [];
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const k = ((j * px + px / 2) * c.width + (i * px + px / 2)) * 4;
      colors.push([data[k], data[k + 1], data[k + 2]]);
    }
  }
  return { COLS, ROWS, colors, aspect };
}

// --- Renderer ----------------------------------------------------------------

function start(host) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const readout = document.querySelector("[data-walker-readout]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hero = host.closest(".hero") || host;

  const css = getComputedStyle(document.documentElement);
  const rgb = (name, fallback) => (css.getPropertyValue(name).trim() || fallback).split(/\s+/).join(", ");
  const INK = rgb("--on-stage-rgb", "232 237 244");
  const GOLD = rgb("--accent-rgb", "212 172 94");
  const BLUE = rgb("--blue-rgb", "118 170 222");

  let W = 0;
  let Hc = 0;
  let dpr = 1;
  let k = 1; // focal length in px
  const view = { yaw: rad(24), pitch: rad(7), tYaw: rad(24), tPitch: rad(7) };
  const D = 4.6; // camera distance, m
  const CY = 0.88; // height the camera looks at, m

  function resize() {
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width);
    Hc = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(Hc * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${Hc}px`;
    k = (Math.min(Hc * 0.74, W * 1.05) * D) / 1.85;
  }

  function project(p) {
    const cy = Math.cos(view.yaw);
    const sy = Math.sin(view.yaw);
    const cp = Math.cos(view.pitch);
    const sp = Math.sin(view.pitch);
    const x = p.x - 0.05;
    const y = p.y - CY;
    const x1 = x * cy - p.z * sy;
    const z1 = x * sy + p.z * cy;
    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    const d = D - z2;
    const s = k / d;
    return { x: W * 0.5 + x1 * s, y: Hc * 0.47 - y2 * s, d, s };
  }

  // Pointer turns the figure; hover (or a tap) reveals the skeleton.
  const pointer = { inside: false, last: -10 };
  let bones = 0;
  let bonesTarget = 0;
  let tapBones = false;
  hero.addEventListener(
    "pointermove",
    (e) => {
      const r = hero.getBoundingClientRect();
      const nx = clamp((e.clientX - r.left) / r.width, 0, 1);
      const ny = clamp((e.clientY - r.top) / r.height, 0, 1);
      view.tYaw = rad(-58 + nx * 116);
      view.tPitch = rad(2 + ny * 16);
      pointer.last = performance.now() / 1000;
      const hr = host.getBoundingClientRect();
      pointer.inside = e.clientX >= hr.left && e.clientX <= hr.right && e.clientY >= hr.top && e.clientY <= hr.bottom;
      wake();
    },
    { passive: true }
  );
  hero.addEventListener("pointerleave", () => {
    pointer.inside = false;
  });

  // Easter egg: a flag, carried in the right hand.
  const flags = {
    tr: flagCloth(drawTurkishFlag, 1.5),
    us: flagCloth(drawUSFlag, 1.9),
  };
  let flag = null;
  const raiseFlag = (key) => {
    flag = { cloth: flags[key], born: now() };
    wake();
    if (reduceMotion.matches) draw(now());
  };
  let taps = [];
  host.addEventListener("pointerdown", (e) => {
    const t = now();
    taps = taps.filter((x) => t - x < 0.6);
    taps.push(t);
    if (e.pointerType !== "mouse") tapBones = !tapBones;
    if (taps.length >= 3) {
      taps = [];
      raiseFlag(flag && flag.cloth === flags.tr ? "us" : "tr");
    }
    wake();
  });
  let typed = "";
  window.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (!/^[a-z]$/i.test(e.key)) return;
    typed = (typed + e.key.toLowerCase()).slice(-2);
    if (typed === "tr" || typed === "us") raiseFlag(typed);
  });

  const now = () => performance.now() / 1000;
  let phase = 0.08;
  let walked = 0; // metres of belt that have passed under the walker
  const history = []; // recent poses in belt coordinates, for trails
  let lastT = 0;
  let lastReadout = 0;

  function step(t) {
    const dt = lastT ? Math.min(0.05, t - lastT) : 1 / 60;
    lastT = t;
    phase = (phase + FREQ * dt) % 1;
    walked += STRIDE * FREQ * dt;

    // With no pointer for a while the figure turns slowly on its own.
    if (t - pointer.last > 4) {
      view.tYaw = rad(18 + 34 * Math.sin(t * 0.12));
      view.tPitch = rad(7 + 3 * Math.sin(t * 0.09));
    }
    const ease = 1 - Math.exp(-dt * 3.2);
    view.yaw += (view.tYaw - view.yaw) * ease;
    view.pitch += (view.tPitch - view.pitch) * ease;
    bonesTarget = pointer.inside || tapBones ? 1 : 0;
    bones += (bonesTarget - bones) * (1 - Math.exp(-dt * 5));

    const ps = pose(phase);
    history.push({ w: walked, m: ps.m, com: ps.com });
    while (history.length && walked - history[0].w > 1.5) history.shift();
    return ps;
  }

  function draw(t, ps = pose(phase)) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hc);

    drawGround();
    drawTrails();

    // Markers sorted far to near, sized and lit by depth.
    const pts = MARKERS.map((name) => ({ name, p: project(ps.m[name]) }));
    const dMin = D - 0.5;
    const dMax = D + 0.5;
    const depth = (d) => clamp((dMax - d) / (dMax - dMin), 0, 1);

    if (bones > 0.01) {
      ctx.lineCap = "round";
      BONES.forEach(([a, b]) => {
        const pa = project(ps.m[a]);
        const pb = project(ps.m[b]);
        const near = depth((pa.d + pb.d) / 2);
        ctx.strokeStyle = `rgba(${BLUE}, ${bones * (0.25 + 0.45 * near)})`;
        ctx.lineWidth = 1 + near * 0.8;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      });
      const neck = project({ x: (ps.m.shR.x + ps.m.shL.x) / 2, y: (ps.m.shR.y + ps.m.shL.y) / 2, z: (ps.m.shR.z + ps.m.shL.z) / 2 });
      const hd = project(ps.m.head);
      ctx.strokeStyle = `rgba(${BLUE}, ${bones * 0.45})`;
      ctx.beginPath();
      ctx.moveTo(neck.x, neck.y);
      ctx.lineTo(hd.x, hd.y);
      ctx.stroke();
      drawKneeAngle(ps);
    }

    if (flag) drawFlag(t, ps);

    pts.sort((a, b) => b.p.d - a.p.d);
    pts.forEach(({ name, p }) => {
      const near = depth(p.d);
      const r = (name === "head" ? 4.6 : 3.3) * (0.75 + 0.5 * near) * (k / 900 + 0.55);
      const glow = ctx.createRadialGradient(p.x, p.y, r * 0.6, p.x, p.y, r * 2.8);
      glow.addColorStop(0, `rgba(${INK}, ${0.1 + 0.12 * near})`);
      glow.addColorStop(1, `rgba(${INK}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${INK}, ${0.55 + 0.45 * near})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Centre of mass in gold: the drafting symbol, a quartered circle.
    const c = project(ps.com);
    const cr = 5.2 * (k / 900 + 0.55);
    ctx.strokeStyle = `rgba(${GOLD}, 0.95)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, cr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(${GOLD}, 0.95)`;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.arc(c.x, c.y, cr, -Math.PI / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.arc(c.x, c.y, cr, Math.PI / 2, Math.PI);
    ctx.closePath();
    ctx.fill();

    if (readout && t - lastReadout > 0.12) {
      lastReadout = t;
      const a = ps.aR;
      readout.textContent = `Gait cycle ${String(Math.round(a.pct)).padStart(2, "0")}% · R knee ${a.knee.toFixed(1)}° · ${(STRIDE * FREQ).toFixed(2)} m/s`;
    }
  }

  // A drafting grid on the floor that runs backwards like a treadmill belt.
  function drawGround() {
    const step = 0.25;
    const off = walked % step;
    const X = 1.6;
    const Z = 0.9;
    ctx.lineWidth = 1;
    const line = (a, b, alpha) => {
      const pa = project(a);
      const pb = project(b);
      ctx.strokeStyle = `rgba(${BLUE}, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    };
    for (let x = -X - off + step; x <= X; x += step) {
      const fade = 1 - Math.abs(x) / X;
      const segs = 8;
      for (let i = 0; i < segs; i++) {
        const z0 = -Z + (2 * Z * i) / segs;
        const z1 = -Z + (2 * Z * (i + 1)) / segs;
        const fz = 1 - Math.abs((z0 + z1) / 2) / Z;
        line({ x, y: 0, z: z0 }, { x, y: 0, z: z1 }, 0.26 * fade * fz);
      }
    }
    for (let z = -Z; z <= Z + 1e-6; z += step) {
      const fz = 1 - Math.abs(z) / Z;
      const segs = 12;
      for (let i = 0; i < segs; i++) {
        const x0 = -X + (2 * X * i) / segs;
        const x1 = -X + (2 * X * (i + 1)) / segs;
        const fx = 1 - Math.abs((x0 + x1) / 2) / X;
        line({ x: x0, y: 0, z }, { x: x1, y: 0, z }, 0.26 * fx * fz);
      }
    }
  }

  // Long-exposure trails: where the ankles, a wrist and the toe have been,
  // carried backwards by the belt. The gold line is the centre of mass.
  function drawTrails() {
    if (history.length < 3) return;
    const nowW = walked;
    const path = (get, color, width, maxA) => {
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      let prev = null;
      for (let i = 0; i < history.length; i++) {
        const h = history[i];
        const age = nowW - h.w;
        const q = get(h);
        const p = project({ x: q.x - age, y: q.y, z: q.z });
        if (prev) {
          const a = maxA * Math.pow(1 - age / 1.5, 1.6);
          ctx.strokeStyle = `rgba(${color}, ${a})`;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        prev = p;
      }
    };
    TRAILS.forEach((name) => path((h) => h.m[name], INK, 1, 0.3));
    path((h) => h.com, GOLD, 1.4, 0.7);
  }

  // Knee flexion drawn as a dimension arc on the right knee.
  function drawKneeAngle(ps) {
    const Kp = project(ps.m.knR);
    const Hp = project(ps.m.hipR);
    const Ap = project(ps.m.anR);
    const a1 = Math.atan2(Hp.y - Kp.y, Hp.x - Kp.x);
    const a0 = a1 + Math.PI; // thigh line extended through the knee
    const a2 = Math.atan2(Ap.y - Kp.y, Ap.x - Kp.x);
    let delta = a2 - a0;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    const r = 26;
    ctx.strokeStyle = `rgba(${GOLD}, ${bones * 0.9})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(Kp.x, Kp.y);
    ctx.lineTo(Kp.x + Math.cos(a0) * r * 1.5, Kp.y + Math.sin(a0) * r * 1.5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(Kp.x, Kp.y, r, a0, a0 + delta, delta < 0);
    ctx.stroke();
    ctx.fillStyle = `rgba(${GOLD}, ${bones})`;
    ctx.font = `500 11px "IBM Plex Mono", ui-monospace, monospace`;
    const mid = a0 + delta / 2;
    ctx.fillText(`${ps.aR.knee.toFixed(0)}°`, Kp.x + Math.cos(mid) * (r + 8) + 4, Kp.y + Math.sin(mid) * (r + 8) + 4);
  }

  // The cloth is painted opaque on its own layer, then faded as one piece,
  // so the seams between cells never show.
  const cloth = document.createElement("canvas");
  const clothCtx = cloth.getContext("2d");

  function drawFlag(t, ps) {
    const age = t - flag.born;
    const life = 9;
    if (age > life) {
      flag = null;
      return;
    }
    const alpha = clamp(age / 0.6, 0, 1) * clamp((life - age) / 0.8, 0, 1);
    const raise = 1 - Math.pow(1 - clamp(age / 0.9, 0, 1), 3); // the pole rises out of the hand
    const wr = ps.m.wrR;
    const base = { x: wr.x + 0.02, y: wr.y - 0.06, z: wr.z + 0.02 };
    const top = { x: base.x - 0.04, y: base.y + 0.25 + 0.62 * raise, z: base.z };
    const { COLS, ROWS, colors, aspect } = flag.cloth;
    const fw = 0.5;
    const fh = fw / aspect;
    const pt = (u, v) => {
      // u: 0 at the pole → 1 at the fly end; v: 0 top → 1 bottom.
      const wave = Math.sin(u * 5.2 - t * 7.5) * 0.05 * u;
      return project({
        x: top.x - u * fw,
        y: top.y - v * fh - u * 0.025 + Math.sin(u * 3.1 - t * 5) * 0.014 * u,
        z: top.z + wave,
      });
    };
    const grid = [];
    for (let j = 0; j <= ROWS; j++) {
      const row = [];
      for (let i = 0; i <= COLS; i++) row.push(pt(i / COLS, j / ROWS));
      grid.push(row);
    }
    const cells = [];
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const a = grid[j][i];
        const b = grid[j][i + 1];
        const c = grid[j + 1][i + 1];
        const d = grid[j + 1][i];
        const shade = 0.8 + 0.2 * Math.cos((i / COLS) * 5.2 - t * 7.5 - 0.6);
        cells.push({ a, b, c, d, depth: (a.d + c.d) / 2, color: colors[j * COLS + i], shade });
      }
    }
    cells.sort((m, n) => n.depth - m.depth);

    if (cloth.width !== canvas.width || cloth.height !== canvas.height) {
      cloth.width = canvas.width;
      cloth.height = canvas.height;
    }
    const g = clothCtx;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, Hc);
    g.lineJoin = "round";
    g.lineWidth = 0.8;
    cells.forEach(({ a, b, c, d, color, shade }) => {
      g.fillStyle = `rgb(${Math.round(color[0] * shade)}, ${Math.round(color[1] * shade)}, ${Math.round(color[2] * shade)})`;
      g.strokeStyle = g.fillStyle;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.lineTo(c.x, c.y);
      g.lineTo(d.x, d.y);
      g.closePath();
      g.fill();
      g.stroke();
    });
    const pb = project(base);
    const ptop = project(top);
    g.strokeStyle = `rgb(${INK})`;
    g.lineWidth = 1.8;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(pb.x, pb.y);
    g.lineTo(ptop.x, ptop.y - 4);
    g.stroke();
    g.fillStyle = `rgb(${GOLD})`;
    g.beginPath();
    g.arc(ptop.x, ptop.y - 5, 2.6, 0, Math.PI * 2);
    g.fill();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(cloth, 0, 0);
    ctx.restore();
  }

  // --- Loop ------------------------------------------------------------------

  let running = false;
  let inView = true;
  let raf = 0;

  function frame() {
    raf = 0;
    if (!running) return;
    const t = now();
    const ps = step(t);
    draw(t, ps);
    raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (reduceMotion.matches || !inView || document.hidden || running) return;
    running = true;
    lastT = 0;
    raf = requestAnimationFrame(frame);
  }

  function sleep() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function still() {
    // Reduced motion: one clear pose at mid-stance, skeleton shown.
    phase = 0.3;
    bones = 1;
    tapBones = true;
    history.length = 0;
    draw(now());
  }

  resize();
  if (reduceMotion.matches) still();
  else {
    // Pre-roll so the first frame already has trails.
    const t0 = now();
    for (let i = 0; i < 90; i++) step(t0 - (90 - i) / 60);
    lastT = 0;
    draw(t0);
    wake();
  }
  host.classList.add("is-live");

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) wake();
    else sleep();
  }).observe(host);
  document.addEventListener("visibilitychange", () => (document.hidden ? sleep() : wake()));
  reduceMotion.addEventListener?.("change", () => {
    if (reduceMotion.matches) {
      sleep();
      still();
    } else {
      tapBones = false;
      wake();
    }
  });
  new ResizeObserver(() => {
    resize();
    if (!running) draw(now());
  }).observe(host);
}

const host = document.querySelector("[data-walker]");
if (host) start(host);
