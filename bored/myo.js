// 01 · Myo Hand
// A myoelectric prosthetic hand in 3D. The player's "muscle" drives a
// synthetic surface EMG signal (band-limited noise whose amplitude follows
// muscle activation). Its RMS envelope, above a threshold, commands grip force.
// Whether the object lifts, slips or breaks comes from Coulomb friction:
// two opposing contacts can hold weight only while 2·μ·N ≥ m·(g + a).
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  THREE,
  OrbitControls,
  Arrow,
  Labels,
  byId,
  clamp,
  G,
  minJerk,
  store,
  makeStudio,
  makeMaterials,
  placeBetween,
  hud,
  text,
  makeStatus,
} from "./core.js";

// Real-world-ish parameters. Masses and friction are typical values; breaking
// forces are approximate (they vary a lot between individual objects).
const OBJECTS = [
  { id: "can", name: "Soda can", m: 0.37, mu: 0.45, crush: 40, r: 3.3, hh: 6.1, p: 8, fall: 99, how: "dents" },
  { id: "egg", name: "Raw egg", m: 0.06, mu: 0.35, crush: 30, r: 2.2, hh: 2.85, p: 2, fall: 0.8, how: "cracks" },
  { id: "tomato", name: "Ripe tomato", m: 0.12, mu: 0.55, crush: 15, r: 3.1, hh: 2.6, p: 2, fall: 2.5, how: "bursts" },
  { id: "cup", name: "Paper cup of water", m: 0.25, mu: 0.45, crush: 6, r: 3.4, hh: 4.6, p: 6, fall: 0.6, how: "buckles" },
  { id: "jar", name: "Glass jar of water", m: 0.9, mu: 0.3, crush: 400, r: 4.1, hh: 6.4, p: 8, fall: 1.4, how: "shatters" },
  { id: "berry", name: "Strawberry", m: 0.022, mu: 0.5, crush: 3, r: 1.6, hh: 1.9, p: 2, fall: 3, how: "bruises" },
];

const FMAX = 80; // N, typical of commercial myoelectric hands
const GAMMA = 2; // force = FMAX · x^γ gives finer control at low forces
const LIFT_CM = 8;
const LIFT_T = 0.7;
const HOLD_S = 1.6;
const FS = 1000; // EMG sample rate
const SCOPE_N = 2500;
const PHAL = [4.2, 2.6, 2.1]; // cm, proximal → distal
const FR = 0.82; // finger radius, cm
const GAP = 0.8; // palm clearance above object, cm

// RBJ biquad for EMG band-limiting (20–450 Hz).
function biquad(type, f0, q) {
  const w = (2 * Math.PI * f0) / FS;
  const cw = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  let b0, b1, b2;
  if (type === "lp") {
    b0 = (1 - cw) / 2;
    b1 = 1 - cw;
    b2 = (1 - cw) / 2;
  } else {
    b0 = (1 + cw) / 2;
    b1 = -(1 + cw);
    b2 = (1 + cw) / 2;
  }
  const a0 = 1 + alpha;
  const c = { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * cw) / a0, a2: (1 - alpha) / a0, x1: 0, x2: 0, y1: 0, y2: 0 };
  return (x) => {
    const y = c.b0 * x + c.b1 * c.x1 + c.b2 * c.x2 - c.a1 * c.y1 - c.a2 * c.y2;
    c.x2 = c.x1;
    c.x1 = x;
    c.y2 = c.y1;
    c.y1 = y;
    return y;
  };
}

let spare = null;
function gauss() {
  if (spare !== null) {
    const v = spare;
    spare = null;
    return v;
  }
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const m = Math.sqrt(-2 * Math.log(u));
  spare = m * Math.sin(2 * Math.PI * v);
  return m * Math.cos(2 * Math.PI * v);
}

// Finger chain in the hand's 2D grasp plane: x outward from the object's
// axis, y downward from the palm. q = 0 open, 1 fully flexed.
function chain(q, bx) {
  const a1 = Math.PI / 2 - 0.42 + 1.1 * q;
  const angles = [a1, a1 + 0.8 * q, a1 + 1.7 * q];
  const pts = [{ x: bx, y: 0 }];
  let x = bx;
  let y = 0;
  for (let i = 0; i < 3; i++) {
    x += PHAL[i] * Math.cos(angles[i]);
    y += PHAL[i] * Math.sin(angles[i]);
    pts.push({ x, y });
  }
  return pts;
}

function findContact(o, bx) {
  const cy = GAP + o.hh;
  const rx = o.r + FR;
  const ry = o.hh + FR;
  for (let q = 0; q <= 1; q += 0.0025) {
    const pts = chain(q, bx);
    for (let i = 1; i < pts.length; i++) {
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t;
        const y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t;
        const v = Math.abs(x / rx) ** o.p + Math.abs((y - cy) / ry) ** o.p;
        if (v <= 1) return { q, x: x - FR, y };
      }
    }
  }
  return { q: 1, x: o.r, y: cy };
}

// ---------------------------------------------------------------------------
// Object meshes
// ---------------------------------------------------------------------------
function lathe(profile, material, segments = 48) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments);
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function buildObject(o, pal) {
  const g = new THREE.Group();
  const r = o.r;
  const h = o.hh * 2;
  if (o.id === "can") {
    const body = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(pal.cool), metalness: 0.55, roughness: 0.3, clearcoat: 1 });
    const alu = new THREE.MeshStandardMaterial({ color: 0xd8dadf, metalness: 1, roughness: 0.25 });
    const prof = [];
    prof.push([0, 0], [r * 0.78, 0], [r * 0.95, 0.35], [r, 1.0], [r, h - 1.3], [r * 0.83, h - 0.25], [r * 0.83, h], [0, h]);
    g.add(lathe(prof.slice(2, 6), body));
    g.add(lathe(prof.slice(0, 3), alu));
    g.add(lathe(prof.slice(5), alu));
    const band = lathe([[r + 0.01, h * 0.42], [r + 0.01, h * 0.58]], new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.5, metalness: 0.2 }));
    g.add(band);
  } else if (o.id === "egg") {
    const prof = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const y = t * h;
      const s = Math.sin(Math.PI * t);
      prof.push([r * Math.sqrt(Math.max(0, s)) * (1.05 - 0.18 * t), y]);
    }
    g.add(lathe(prof, new THREE.MeshPhysicalMaterial({ color: 0xefe3cf, roughness: 0.55, sheen: 0.5, sheenColor: 0xffffff })));
  } else if (o.id === "tomato") {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 48, 32),
      new THREE.MeshPhysicalMaterial({ color: 0xd9301e, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
    );
    m.scale.set(1, o.hh / r, 1);
    m.position.y = o.hh;
    m.castShadow = true;
    g.add(m);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7d3a, roughness: 0.7, side: THREE.DoubleSide });
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 6), leafMat);
      leaf.position.set(0, h - 0.05, 0);
      leaf.rotation.set(Math.PI / 2 - 0.35, 0, 0);
      const pivot = new THREE.Group();
      pivot.rotation.y = (i / 5) * Math.PI * 2;
      leaf.position.z = 0.8;
      pivot.add(leaf);
      pivot.position.y = 0;
      g.add(pivot);
    }
  } else if (o.id === "cup") {
    const paper = new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.8, side: THREE.DoubleSide });
    const stripe = new THREE.MeshStandardMaterial({ color: new THREE.Color(pal.accent), roughness: 0.7, side: THREE.DoubleSide });
    const rb = r * 0.74;
    g.add(lathe([[0, 0], [rb, 0], [rb + (r - rb) * 0.35, h * 0.35]], paper));
    g.add(lathe([[rb + (r - rb) * 0.35, h * 0.35], [rb + (r - rb) * 0.65, h * 0.65]], stripe));
    g.add(lathe([[rb + (r - rb) * 0.65, h * 0.65], [r, h], [r + 0.15, h + 0.12], [r - 0.1, h + 0.1]], paper));
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(r * 0.94, 40),
      new THREE.MeshPhysicalMaterial({ color: 0x7fb6d9, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.85 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = h * 0.86;
    g.add(water);
  } else if (o.id === "jar") {
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xdfeef0,
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.32,
      clearcoat: 1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    g.add(lathe([[0, 0], [r - 0.5, 0], [r, 0.5], [r, h - 1.4], [r * 0.86, h - 0.9], [r * 0.86, h - 0.1]], glass));
    const water = lathe(
      [[0, 0.25], [r - 0.35, 0.25], [r - 0.3, 0.6], [r - 0.3, h * 0.72], [0, h * 0.72]],
      new THREE.MeshPhysicalMaterial({ color: 0x6fa9c9, roughness: 0.1, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    water.castShadow = false;
    g.add(water);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 1, 40), new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 1, roughness: 0.3 }));
    lid.position.y = h - 0.1 + 0.5;
    lid.castShadow = true;
    g.add(lid);
  } else if (o.id === "berry") {
    const prof = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      prof.push([r * Math.pow(Math.sin((Math.PI / 2) * t), 0.7) * (1 - 0.35 * Math.pow(t, 6)), t * h]);
    }
    const berry = lathe(prof, new THREE.MeshPhysicalMaterial({ color: 0xc81d33, roughness: 0.35, clearcoat: 0.6 }), 36);
    g.add(berry);
    const seedMat = new THREE.MeshStandardMaterial({ color: 0xf2d06b, roughness: 0.6 });
    const seedGeo = new THREE.SphereGeometry(0.07, 6, 4);
    for (let i = 0; i < 60; i++) {
      const t = 0.15 + 0.75 * (i / 60);
      const a = i * 2.39996;
      const rr = r * Math.pow(Math.sin((Math.PI / 2) * t), 0.7) * (1 - 0.35 * Math.pow(t, 6));
      const s = new THREE.Mesh(seedGeo, seedMat);
      s.position.set(Math.cos(a) * rr, t * h, Math.sin(a) * rr);
      g.add(s);
    }
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7d3a, roughness: 0.7, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const pivot = new THREE.Group();
      pivot.rotation.y = (i / 6) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.4, 5), leafMat);
      leaf.rotation.x = Math.PI / 2 - 0.25;
      leaf.position.set(0, h, 0.6);
      pivot.add(leaf);
      g.add(pivot);
    }
  }
  g.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  return g;
}

// ---------------------------------------------------------------------------
export function createMyo({ renderer, env, pal }) {
  const root = byId("lab-myo");
  const host = root.querySelector(".stage-3d");
  const labelLayer = root.querySelector(".stage-labels");
  const scope = hud(byId("myo-scope"));
  const gauge = hud(byId("myo-gauge"));
  const pad = byId("flex-pad");
  const padFill = byId("flex-pad-fill");
  const feedbackEl = byId("myo-feedback");
  const forcesEl = byId("myo-forces");
  const windowEl = byId("myo-window");
  const thrEl = byId("myo-thr");
  const setStatus = makeStatus(byId("myo-status"));

  const scene = new THREE.Scene();
  const studio = makeStudio(scene, pal, env, { size: 100, cell: 1, shadowExtent: 26 });
  studio.key.position.set(30, 60, 36);
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 400);
  camera.position.set(26, 24, 46);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 9, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 28;
  controls.maxDistance = 95;
  controls.maxPolarAngle = rad2(84);
  controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controls.enabled = false;

  const mats = makeMaterials(pal);

  // Hand rig ---------------------------------------------------------------
  const hand = new THREE.Group();
  scene.add(hand);
  const socket = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.3, 34, 48, 1, true), mats.carbon(3));
  socket.castShadow = true;
  hand.add(socket);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(3.35, 3.35, 0.8, 48), mats.graphite);
  hand.add(cap);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.32, 16, 64), mats.glow.clone());
  ring.rotation.x = Math.PI / 2;
  hand.add(ring);
  const palm = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 4, 0.16), mats.aluminum);
  palm.castShadow = true;
  hand.add(palm);
  const knuckle = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 3, 0.3), mats.graphite);
  hand.add(knuckle);

  const FINGERS = [
    { side: 1, z: -2.9, scale: 0.86, r: FR * 0.92 },
    { side: 1, z: -1.0, scale: 1, r: FR },
    { side: 1, z: 0.95, scale: 1, r: FR },
    { side: 1, z: 2.9, scale: 0.94, r: FR * 0.96 },
    { side: -1, z: 0, scale: 1, r: FR * 1.2, thumb: true },
  ];
  FINGERS.forEach((f) => {
    f.segs = PHAL.map((L, i) => {
      const len = L * f.scale;
      const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(f.r * (1 - i * 0.06), Math.max(0.1, len - f.r * 0.6), 6, 16), i === 2 ? mats.silicone : mats.aluminum);
      mesh.castShadow = true;
      hand.add(mesh);
      return { mesh, len };
    });
    f.axles = [0, 1, 2].map(() => {
      const ax = new THREE.Mesh(new THREE.CylinderGeometry(f.r * 0.55, f.r * 0.55, f.r * 2.3, 20), mats.graphite);
      ax.rotation.x = Math.PI / 2;
      hand.add(ax);
      return ax;
    });
  });

  // Force arrows + callouts ---------------------------------------------------
  const labels = new Labels(labelLayer);
  const arrows = {
    w: new Arrow(pal.cool, 0.16),
    nL: new Arrow(pal.on, 0.16),
    nR: new Arrow(pal.on, 0.16),
    fL: new Arrow(pal.good, 0.16),
    fR: new Arrow(pal.good, 0.16),
  };
  Object.values(arrows).forEach((a) => scene.add(a.group));
  const lblW = labels.add("callout-cool");
  const lblN = labels.add();
  const lblF = labels.add("callout-good");

  // Particles for breaks and spills -------------------------------------------
  const particles = [];
  const partGeo = new THREE.IcosahedronGeometry(0.28, 0);
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshPhysicalMaterial({ color: 0x7fb6d9, roughness: 0.05, transparent: true, opacity: 0.7 }));
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.y = 0.03;
  puddle.visible = false;
  scene.add(puddle);

  function spawnParticles(color, n, origin, opts = {}) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.4, transparent: true, opacity: opts.opacity ?? 1 });
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(partGeo, mat);
      const s = (opts.size || 1) * (0.5 + Math.random());
      m.scale.setScalar(s);
      m.position.copy(origin);
      m.castShadow = true;
      scene.add(m);
      const a = Math.random() * Math.PI * 2;
      const sp = (opts.speed || 40) * (0.4 + Math.random());
      particles.push({ m, v: new THREE.Vector3(Math.cos(a) * sp, 15 + Math.random() * 35, Math.sin(a) * sp), life: 2.2, spin: Math.random() * 8 });
    }
  }

  // EMG state -----------------------------------------------------------------
  const hp = biquad("hp", 20, 0.707);
  const lp = biquad("lp", 450, 0.707);
  let emgGain = 1;
  {
    let acc = 0;
    for (let i = 0; i < 6000; i++) {
      const y = lp(hp(gauss()));
      if (i > 1000) acc += y * y;
    }
    emgGain = 1 / Math.sqrt(acc / 5000);
  }
  const raw = new Float32Array(SCOPE_N);
  const envTrace = new Float32Array(SCOPE_N);
  const sq = new Float32Array(500);
  let head = 0;
  let sqHead = 0;
  let sqSum = 0;
  let carry = 0;
  let sinceExact = 0;

  let win = Number(windowEl.value);
  let thr = Number(thrEl.value) / 100;
  let feedback = feedbackEl.checked;
  let showForces = forcesEl.checked;

  let padActive = false;
  let padU = 0;
  let keyHeld = false;
  let keyU = 0;
  let u = 0;
  let act = 0;
  let rms = 0;
  let cmd = 0;
  let effort = 0;
  let q = 0;
  let force = 0;
  let interacted = false;
  let buzzT = 0;

  // Game/physics state ---------------------------------------------------------
  let idx = 0;
  let obj = OBJECTS[0];
  let objMesh = null;
  let contact = { q: 1, x: 0, y: 0 };
  let bx = 0;
  let phase = "grip"; // grip | lift | hold | lower | success | slipped | broken
  let phaseT = 0;
  let hLift = 0; // hand height offset, cm
  let hVel = 0; // m/s
  let hAcc = 0; // m/s^2
  let objY = 0; // object bottom height, cm
  let objV = 0; // m/s (world)
  let slip = 0; // cm the object slid relative to the fingers
  let slipV = 0; // m/s relative
  let attached = false;
  let marginT = 0;
  let overT = 0;
  let broken = false;
  let squash = 0;
  let score = 0;
  let streak = 0;
  let best = Number(store.get("bionic.myo.best", 0)) || 0;
  let flash = null;

  const nNeed = () => (obj.m * G) / (2 * obj.mu); // static, no acceleration

  function loadObject(i) {
    idx = ((i % OBJECTS.length) + OBJECTS.length) % OBJECTS.length;
    obj = OBJECTS[idx];
    if (objMesh) scene.remove(objMesh);
    objMesh = buildObject(obj, pal);
    scene.add(objMesh);
    bx = obj.r + 1.5;
    contact = findContact(obj, bx);
    phase = "grip";
    phaseT = 0;
    hLift = 0;
    hVel = 0;
    hAcc = 0;
    objY = 0;
    objV = 0;
    slip = 0;
    slipV = 0;
    attached = false;
    marginT = 0;
    overT = 0;
    broken = false;
    squash = 0;
    puddle.visible = false;
    particles.splice(0).forEach((p) => scene.remove(p.m));
    objMesh.scale.set(1, 1, 1);
    objMesh.rotation.set(0, 0, 0);

    // Hand geometry scales to the object's width.
    const palmW = bx * 2 + 2.4;
    palm.scale.set(palmW, 3.4, 9.2);
    knuckle.scale.set(palmW * 0.92, 0.7, 9.6);
    byId("myo-object").textContent = obj.name;
    byId("myo-mass").textContent = `${Math.round(obj.m * 1000)} g · μ ${obj.mu}`;
    byId("myo-band").textContent = `${nNeed().toFixed(1)}–${obj.crush >= FMAX ? FMAX : obj.crush} N`;
    setStatus(`Grip the ${obj.name.toLowerCase()} with at least ${nNeed().toFixed(1)} N, but under ${obj.crush} N or it ${obj.how}.`);
  }

  function updateScore() {
    byId("myo-score").textContent = String(score);
    byId("myo-best").textContent = `Streak ${streak} · best ${best}`;
  }

  // Input ----------------------------------------------------------------------
  function padFromEvent(e) {
    const r = pad.getBoundingClientRect();
    padU = clamp((r.bottom - e.clientY) / r.height, 0, 1);
  }
  const release = () => {
    padActive = false;
    padU = 0;
    pad.classList.remove("active");
  };
  pad.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    padActive = true;
    interacted = true;
    pad.classList.add("active");
    try {
      pad.setPointerCapture(e.pointerId);
    } catch (err) {
      /* ignore */
    }
    padFromEvent(e);
  });
  pad.addEventListener("pointermove", (e) => padActive && padFromEvent(e));
  pad.addEventListener("pointerup", release);
  pad.addEventListener("pointercancel", release);
  pad.addEventListener("lostpointercapture", release);
  pad.addEventListener("contextmenu", (e) => e.preventDefault());
  pad.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") padU = clamp(padU + 0.05, 0, 1);
    if (e.key === "ArrowDown") padU = clamp(padU - 0.05, 0, 1);
  });

  const onKey = (down) => (e) => {
    if (!api.active || (e.code !== "Space" && e.key !== " ")) return;
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || (tag === "BUTTON" && e.target !== pad)) return;
    e.preventDefault();
    keyHeld = down;
    if (down) interacted = true;
  };
  window.addEventListener("keydown", onKey(true));
  window.addEventListener("keyup", onKey(false));
  window.addEventListener("blur", () => {
    keyHeld = false;
    release();
  });

  feedbackEl.addEventListener("change", () => (feedback = feedbackEl.checked));
  forcesEl.addEventListener("change", () => (showForces = forcesEl.checked));
  windowEl.addEventListener("input", () => {
    win = Number(windowEl.value);
    byId("myo-window-val").textContent = `${win} ms`;
    resum();
  });
  thrEl.addEventListener("input", () => {
    thr = Number(thrEl.value) / 100;
    byId("myo-thr-val").textContent = `${thrEl.value}%`;
  });
  byId("myo-next").addEventListener("click", () => {
    streak = 0;
    updateScore();
    loadObject(idx + 1);
  });

  function resum() {
    sqSum = 0;
    for (let i = 1; i <= win; i++) sqSum += sq[(sqHead - i + sq.length) % sq.length];
    sinceExact = 0;
  }

  function fail(kind, msg) {
    phase = kind;
    phaseT = 0;
    streak = 0;
    updateScore();
    flash = { tone: "bad", t: 0 };
    setStatus(msg, "bad");
  }

  function breakObject(reason) {
    broken = true;
    const c = new THREE.Vector3(0, objY + obj.hh, 0);
    if (obj.id === "egg") {
      spawnParticles(0xefe3cf, 26, c, { size: 0.8 });
      puddle.material.color.set(0xf4c430);
      puddle.material.opacity = 0.9;
      puddle.scale.setScalar(3.2);
      puddle.visible = true;
      objMesh.visible = false;
    } else if (obj.id === "jar") {
      spawnParticles(0xdfeef0, 34, c, { opacity: 0.5, size: 1.1, rough: 0.05, speed: 60 });
      puddle.material.color.set(0x7fb6d9);
      puddle.material.opacity = 0.6;
      puddle.scale.setScalar(9);
      puddle.visible = true;
      objMesh.visible = false;
    } else if (obj.id === "cup") {
      spawnParticles(0x7fb6d9, 30, new THREE.Vector3(0, objY + obj.hh * 2, 0), { opacity: 0.7, rough: 0.05, size: 0.8 });
      puddle.material.color.set(0x7fb6d9);
      puddle.material.opacity = 0.6;
      puddle.scale.setScalar(7);
      puddle.visible = true;
      squash = 0.45;
    } else if (obj.id === "can") {
      squash = 0.28;
    } else {
      spawnParticles(obj.id === "berry" ? 0xc81d33 : 0xd9301e, 18, c, { size: 0.6 });
      puddle.material.color.set(obj.id === "berry" ? 0x9e1528 : 0xb3261a);
      puddle.material.opacity = 0.85;
      puddle.scale.setScalar(obj.r * 1.4);
      puddle.visible = true;
      squash = 0.5;
    }
    fail("broken", reason);
  }

  // Simulation step ------------------------------------------------------------
  function step(dt) {
    keyU = keyHeld ? Math.min(1, keyU + dt * 0.5) : Math.max(0, keyU - dt * 1.6);
    u = padActive ? padU : keyHeld || keyU > 0 ? keyU : padU;
    if (!padActive && !keyHeld && keyU === 0 && document.activeElement !== pad) padU = 0;

    // Excitation → activation (Zajac): faster to activate than to relax.
    const tau = u > act ? 0.015 : 0.05;
    act += (u - act) * (1 - Math.exp(-dt / tau));

    carry += dt * FS;
    const n = Math.floor(carry);
    carry -= n;
    for (let i = 0; i < n; i++) {
      const band = lp(hp(gauss())) * emgGain;
      const v = band * (act * 1.0 + 0.02); // mV
      raw[head] = v;
      const s2 = v * v;
      sqSum += s2 - sq[(sqHead - win + sq.length) % sq.length];
      sq[sqHead] = s2;
      sqHead = (sqHead + 1) % sq.length;
      if (++sinceExact > 2000) resum();
      rms = Math.sqrt(Math.max(0, sqSum) / win);
      envTrace[head] = rms;
      head = (head + 1) % SCOPE_N;
    }

    cmd = clamp((rms - thr) / (1 - thr), 0, 1);
    effort += (cmd - effort) * (1 - Math.exp(-dt / 0.06));

    const holding = phase === "grip" || phase === "lift" || phase === "hold" || phase === "lower";
    const contactQ = contact.q;
    const qFree = Math.min(1, effort * 2);
    const qTarget = holding && !broken ? Math.min(qFree, contactQ) : qFree;
    q += clamp(qTarget - q, -1.6 * dt, 1.25 * dt);

    const ec = contactQ / 2; // effort at which fingers first touch
    const touching = holding && !broken && q >= contactQ - 0.015 && effort > ec;
    const x = touching ? clamp((effort - ec) / (1 - ec), 0, 1) : 0;
    const fCmd = FMAX * Math.pow(x, GAMMA);
    force += (fCmd - force) * (1 - Math.exp(-dt / 0.08));
    if (!touching) force = Math.max(0, force - FMAX * dt * 4);

    padFill.style.height = `${(u * 100).toFixed(1)}%`;
    pad.setAttribute("aria-valuenow", String(Math.round(u * 100)));

    if (feedback && touching && interacted && navigator.vibrate) {
      buzzT -= dt;
      if (buzzT <= 0) {
        try {
          navigator.vibrate(10);
        } catch (e) {
          /* ignore */
        }
        buzzT = 0.35 - 0.3 * clamp(force / 40, 0, 1);
      }
    }

    phaseT += dt;
    if (flash) {
      flash.t += dt;
      if (flash.t > 1.2) flash = null;
    }

    // Crushing: sustained force above the breaking load.
    if (holding && !broken) {
      if (force > obj.crush) {
        overT += dt;
        if (overT > 0.06) breakObject(`${force.toFixed(0)} N is more than the ${obj.name.toLowerCase()} can take. It ${obj.how}. Relax to reset.`);
      } else overT = 0;
    }

    // Hand motion: min-jerk lift and lower (cm, with derivatives in m/s, m/s²).
    const prevLift = hLift;
    const prevVel = hVel;
    if (phase === "grip") {
      const margin = force > 0 ? (2 * obj.mu * force) / (obj.m * G) : 0;
      if (touching && margin >= 1.15) marginT += dt;
      else marginT = 0;
      attached = touching && force > 0.02;
      if (marginT > 0.25) {
        phase = "lift";
        phaseT = 0;
      }
    }
    if (phase === "lift") hLift = LIFT_CM * minJerk(phaseT / LIFT_T);
    else if (phase === "hold") hLift = LIFT_CM;
    else if (phase === "lower") hLift = LIFT_CM * (1 - minJerk(phaseT / LIFT_T));
    else if (phase === "success" || phase === "slipped" || phase === "broken") hLift = Math.max(0, hLift - dt * 12);
    hVel = ((hLift - prevLift) / 100) / Math.max(dt, 1e-4);
    hAcc = (hVel - prevVel) / Math.max(dt, 1e-4);
    if (phase === "grip") hAcc = 0;

    // Object vertical dynamics with Coulomb friction at two contacts.
    {
      const inGrip = holding && touching && attached && !broken && phase !== "grip";
      if (inGrip) {
        const need = obj.m * (G + hAcc); // friction needed to follow the hand
        const fStatic = 2 * obj.mu * force;
        const fKinetic = 2 * obj.mu * 0.8 * force;
        if (slipV === 0 && need <= fStatic) {
          objY = hLift - slip;
        } else {
          // Sliding down relative to the fingers.
          const aRel = (need - fKinetic) / obj.m;
          slipV = Math.max(0, slipV + aRel * dt);
          slip += slipV * dt * 100;
          objY = hLift - slip;
        }
        objV = hVel - slipV;
        if (slip > 1.4) {
          attached = false;
          fail("slipped", `It slid out. ${nNeed().toFixed(1)} N was the minimum; add grip before lifting. Relax to reset.`);
        }
      } else if (objY > 0) {
        objV -= G * dt;
        objY += objV * dt * 100;
        if (objY <= 0) {
          const impact = -objV;
          objY = 0;
          objV = 0;
          if (!broken && impact > obj.fall) breakObject(`Dropped from ${(hLift || 1).toFixed(0)} cm: at ${impact.toFixed(1)} m/s it ${obj.how}. Relax to reset.`);
          else if (phase === "lift" || phase === "hold") fail("slipped", `It slipped. Friction 2μN fell below its weight. Relax to reset.`);
        }
      }
      if (objY < 0) objY = 0;
    }

    if (phase === "lift" && phaseT >= LIFT_T) {
      phase = "hold";
      phaseT = 0;
    }
    if (phase === "hold") {
      if (phaseT >= HOLD_S) {
        phase = "lower";
        phaseT = 0;
      }
    }
    if (phase === "lower" && phaseT >= LIFT_T) {
      phase = "success";
      phaseT = 0;
      score += 1;
      streak += 1;
      if (streak > best) {
        best = streak;
        store.set("bionic.myo.best", best);
      }
      updateScore();
      flash = { tone: "good", t: 0 };
      setStatus(`Clean lift. You held it without slipping or ${obj.how.replace(/s$/, "ing")} it. Relax to load the next object.`, "good");
    }

    if ((phase === "success" || phase === "slipped" || phase === "broken") && phaseT > 0.9 && effort < 0.08 && q < 0.25) {
      loadObject(phase === "success" ? idx + 1 : idx);
    }

    // Live coaching while gripping.
    if (phase === "grip" || phase === "lift" || phase === "hold") {
      const need = nNeed();
      if (!touching) {
        setStatus(u > 0.03 && cmd === 0 ? "Your signal is under the threshold. Flex a little harder." : "Flex to close the fingers around it.");
      } else if (force < need) {
        setStatus(`Touching. ${force.toFixed(1)} N of grip gives ${(2 * obj.mu * force).toFixed(2)} N of friction; it weighs ${(obj.m * G).toFixed(2)} N.`);
      } else if (force > obj.crush * 0.8) {
        setStatus(`Careful: ${force.toFixed(0)} N, it ${obj.how} at about ${obj.crush} N.`, "bad");
      } else if (phase === "hold") {
        setStatus(`Holding. Keep it steady for ${Math.max(0, HOLD_S - phaseT).toFixed(1)} s.`, "good");
      } else {
        setStatus(`Enough friction. Lifting…`, "good");
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.v.y -= 180 * dt;
      p.m.position.addScaledVector(p.v, dt * 0.12);
      if (p.m.position.y < 0.2) {
        p.m.position.y = 0.2;
        p.v.set(p.v.x * 0.4, -p.v.y * 0.25, p.v.z * 0.4);
      }
      p.m.rotation.x += p.spin * dt;
      p.life -= dt;
      if (p.life < 0.6) p.m.material.opacity = Math.max(0, p.life / 0.6) * (p.m.material.opacity > 0.9 ? 1 : 0.6);
      if (p.life <= 0) {
        scene.remove(p.m);
        particles.splice(i, 1);
      }
    }
  }

  // Pose the hand and object, then forces ---------------------------------------
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  function pose() {
    const palmBottom = obj.hh * 2 + GAP;
    hand.position.y = hLift;
    palm.position.set(0, palmBottom + 1.7, 0);
    knuckle.position.set(0, palmBottom + 0.3, 0);
    cap.position.set(0, palmBottom + 3.8, 0);
    ring.position.set(0, palmBottom + 4.3, 0);
    socket.position.set(0, palmBottom + 4.2 + 17, 0);
    ring.material.emissiveIntensity = 0.25 + cmd * 2.2;

    FINGERS.forEach((f) => {
      const pts = chain(q, bx);
      // Scale segment lengths per finger for visual variety.
      const w = [pts[0]];
      for (let i = 1; i < 4; i++) {
        const dx = (pts[i].x - pts[i - 1].x) * f.scale;
        const dy = (pts[i].y - pts[i - 1].y) * f.scale;
        w.push({ x: w[i - 1].x + dx, y: w[i - 1].y + dy });
      }
      for (let i = 0; i < 3; i++) {
        tmpA.set(f.side * w[i].x, palmBottom - w[i].y, f.z);
        tmpB.set(f.side * w[i + 1].x, palmBottom - w[i + 1].y, f.z);
        placeBetween(f.segs[i].mesh, tmpA, tmpB, tmpA.distanceTo(tmpB));
        f.segs[i].mesh.scale.set(1, 1, 1);
        f.axles[i].position.copy(tmpA);
      }
    });

    if (objMesh) {
      objMesh.position.y = objY;
      const sq = broken ? squash : 0;
      const live = !broken && force > 0 ? clamp(force / obj.crush, 0, 1) * 0.06 : 0;
      objMesh.scale.set(1 - sq * 0.8 - live, 1 - sq * 0.3, 1 + sq * 0.25 + live * 0.5);
    }

    // Free-body diagram (1 N ↔ 0.9 cm, capped so arrows stay on screen).
    const on = showForces && objMesh && objMesh.visible && !broken;
    const scale = (N) => Math.min(14, N * 0.9);
    const cy = objY + obj.hh;
    if (on) {
      const W = obj.m * G;
      arrows.w.set(V(0, cy, 0), V(0, -1, 0), scale(W) + 0.8);
      labels.set(lblW, V(0.6, cy - scale(W) - 1.8, 0), `mg = ${W.toFixed(2)} N`);
    } else {
      arrows.w.hide();
      labels.set(lblW, V(), "", false);
    }
    const inContact = on && force > 0.05;
    if (inContact) {
      const pyWorld = hLift + obj.hh * 2 + GAP - contact.y;
      const n = force;
      const len = scale(n);
      arrows.nR.set(V(contact.x + len + 0.6, pyWorld, 0), V(-1, 0, 0), len);
      arrows.nL.set(V(-contact.x - len - 0.6, pyWorld, 0), V(1, 0, 0), len);
      const need = obj.m * (G + (phase === "lift" ? hAcc : 0)) * (hLift > 0.01 || phase !== "grip" ? 1 : 0);
      const fMax = 2 * obj.mu * n;
      const fUsed = Math.min(need, fMax);
      const each = fUsed / 2;
      arrows.fR.set(V(contact.x + 0.25, pyWorld, 1.4), V(0, 1, 0), scale(each));
      arrows.fL.set(V(-contact.x - 0.25, pyWorld, 1.4), V(0, 1, 0), scale(each));
      labels.set(lblN, V(contact.x + len + 1.4, pyWorld + 1.2, 0), `N = ${n.toFixed(1)} N`);
      labels.set(lblF, V(-contact.x - 1.2, pyWorld + scale(each) + 2.4, 1.4), `f = ${fUsed.toFixed(2)} N (max 2μN ${fMax.toFixed(2)})`);
    } else {
      arrows.nR.hide();
      arrows.nL.hide();
      arrows.fR.hide();
      arrows.fL.hide();
      labels.set(lblN, V(), "", false);
      labels.set(lblF, V(), "", false);
    }
  }

  // HUD: EMG scope and grip gauge ------------------------------------------------
  function drawScope() {
    scope.resize();
    const { ctx, w, h } = scope;
    const mid = h / 2 + 6;
    const amp = (h / 2 - 16) / 1.6; // ±1.6 mV
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 5; i++) {
      const x = Math.round((w * i) / 5) + 0.5;
      ctx.moveTo(x, 18);
      ctx.lineTo(x, h - 4);
    }
    ctx.moveTo(0, Math.round(mid) + 0.5);
    ctx.lineTo(w, Math.round(mid) + 0.5);
    ctx.stroke();

    const cols = Math.max(1, Math.floor(w));
    const per = SCOPE_N / cols;
    ctx.strokeStyle = pal.muted;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    for (let c = 0; c < cols; c++) {
      let lo = Infinity;
      let hi = -Infinity;
      const s0 = Math.floor(c * per);
      const s1 = Math.max(s0 + 1, Math.floor((c + 1) * per));
      for (let s = s0; s < s1; s++) {
        const v = raw[(head + s) % SCOPE_N];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      ctx.moveTo(c + 0.5, mid - clamp(hi, -1.6, 1.6) * amp);
      ctx.lineTo(c + 0.5, mid - clamp(lo, -1.6, 1.6) * amp + 0.5);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = pal.on;
    ctx.lineWidth = 1.6;
    for (const sgn of [1, -1]) {
      ctx.beginPath();
      for (let c = 0; c < cols; c += 2) {
        const v = envTrace[(head + Math.floor(c * per)) % SCOPE_N];
        const y = mid - sgn * clamp(v, 0, 1.6) * amp;
        if (c === 0) ctx.moveTo(c, y);
        else ctx.lineTo(c, y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, mid - thr * amp);
    ctx.lineTo(w, mid - thr * amp);
    ctx.moveTo(0, mid + thr * amp);
    ctx.lineTo(w, mid + thr * amp);
    ctx.stroke();
    ctx.setLineDash([]);

    text(ctx, "SURFACE EMG · mV", 10, 13, pal, { size: 10 });
    text(ctx, `RMS ${rms.toFixed(2)} → cmd ${Math.round(cmd * 100)}%`, w - 10, 13, pal, {
      size: 10,
      align: "right",
      color: cmd > 0 ? pal.accent : pal.muted,
    });
  }

  function drawGauge() {
    gauge.resize();
    const { ctx, w, h } = gauge;
    const top = 26;
    const bottom = h - 34;
    const x = 14;
    const bw = 10;
    const scaleMax = obj.crush <= 20 ? 25 : obj.crush <= 45 ? 50 : FMAX;
    const toY = (f) => bottom - (clamp(f, 0, scaleMax) / scaleMax) * (bottom - top);
    const need = nNeed();
    ctx.fillStyle = pal.stage3;
    ctx.fillRect(x, top, bw, bottom - top);
    ctx.fillStyle = pal.good;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(x, toY(Math.min(obj.crush, scaleMax)), bw, toY(need) - toY(Math.min(obj.crush, scaleMax)));
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.bad;
    if (obj.crush < scaleMax) ctx.fillRect(x, top, bw, toY(obj.crush) - top);
    text(ctx, "GRIP N", x - 4, 14, pal, { size: 10 });
    text(ctx, String(scaleMax), x + bw + 4, top + 4, pal, { size: 9 });
    text(ctx, "0", x + bw + 4, bottom + 3, pal, { size: 9 });
    text(ctx, need.toFixed(1), x + bw + 4, toY(need) + 3, pal, { size: 9, color: pal.good });
    if (obj.crush < scaleMax) text(ctx, String(obj.crush), x + bw + 4, toY(obj.crush) + 3, pal, { size: 9, color: pal.bad });
    if (feedback) {
      const y = toY(force);
      const tone = force > obj.crush ? pal.bad : force >= need ? pal.good : pal.warn;
      ctx.fillStyle = tone;
      ctx.fillRect(x - 4, y - 1.5, bw + 8, 3);
      const margin = force > 0 ? (2 * obj.mu * force) / (obj.m * G) : 0;
      text(ctx, `${force.toFixed(1)}`, x - 2, h - 18, pal, { size: 12, weight: 600, color: tone });
      text(ctx, `×${margin.toFixed(1)} grip`, x - 2, h - 5, pal, { size: 9, color: pal.muted });
    } else {
      text(ctx, "no", x - 2, h - 18, pal, { size: 10 });
      text(ctx, "feel", x - 2, h - 6, pal, { size: 10 });
    }
  }

  let w = 1;
  let h = 1;
  const api = {
    active: false,
    host,
    scene,
    camera,
    controls,
    resize(width, height) {
      w = width;
      h = height;
      camera.aspect = width / height;
      camera.fov = width < 520 ? 40 : 32;
      // Shift the optical centre so the hand sits clear of the HUD and pad.
      camera.setViewOffset(width, height, width < 520 ? 58 : 44, -height * 0.07, width, height);
      camera.updateProjectionMatrix();
    },
    update(dt) {
      step(dt);
      pose();
      controls.update();
    },
    overlay() {
      labels.update(camera, w, h);
      drawScope();
      drawGauge();
      root.querySelector(".lab-stage").dataset.flash = flash ? flash.tone : "";
    },
    onShow() {
      controls.enabled = true;
    },
    onHide() {
      controls.enabled = false;
      keyHeld = false;
      release();
    },
  };

  loadObject(0);
  updateScore();
  return api;
}

function rad2(d) {
  return (d * Math.PI) / 180;
}
