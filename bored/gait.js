// 02 · Gait Lab
// A 3D walker driven by normative sagittal joint angles (hip, knee, ankle)
// from gait-lab studies of healthy adults, with segment lengths from Winter's
// anthropometric ratios. Ground reaction force is not painted on: it is
// Newton's second law applied to the model's own centre of mass,
// F = m·(g + a), split between the feet in double support.
import {
  THREE,
  OrbitControls,
  Arrow,
  Labels,
  byId,
  clamp,
  G,
  rad,
  makeStudio,
  makeMaterials,
  placeBetween,
  hud,
  text,
  setSeg,
  periodicTable,
  sample,
} from "./core.js";

const H = 1.75; // m
const MASS = 75; // kg
const S = {
  thigh: 0.245 * H,
  shank: 0.246 * H,
  ankleH: 0.039 * H,
  heel: 0.05,
  mtp: 0.17,
  toe: 0.055,
  pelvis: 0.085,
  trunk: 0.29 * H,
  shoulder: 0.18,
  upper: 0.186 * H,
  fore: 0.146 * H,
  headR: 0.105,
};

// Normative sagittal angles over one gait cycle (% from right heel strike).
const BIO = {
  hip: periodicTable([[0, 30], [10, 27], [20, 19], [30, 10], [40, 1], [50, -8], [55, -10], [60, -6], [65, 2], [70, 12], [75, 20], [80, 26], [87, 31], [93, 31], [100, 30]]),
  knee: periodicTable([[0, 4], [6, 12], [14, 18], [22, 14], [32, 7], [42, 4], [48, 6], [54, 14], [60, 32], [66, 50], [72, 61], [78, 56], [85, 38], [92, 17], [97, 6], [100, 4]]),
  ankle: periodicTable([[0, 0], [5, -5], [10, -2], [20, 4], [30, 8], [40, 10], [46, 10], [52, 5], [57, -4], [62, -16], [66, -14], [72, -6], [80, 0], [90, 1], [100, 0]]),
};

const MODES = {
  bio: { right: BIO, stance: 0.62, label: "Biological" },
  passive: {
    right: {
      hip: periodicTable([[0, 32], [12, 28], [30, 11], [48, -3], [58, 0], [66, 9], [76, 24], [88, 34], [100, 32]]),
      knee: periodicTable([[0, 0], [15, 0], [40, 0], [50, 1], [58, 12], [66, 38], [73, 56], [82, 44], [92, 12], [100, 0]]),
      ankle: periodicTable([[0, 0], [7, -3], [20, 2], [40, 6], [52, 5], [60, 0], [68, -3], [80, 0], [100, 0]]),
    },
    stance: 0.57,
    label: "Passive prosthesis",
  },
  powered: {
    right: {
      hip: periodicTable([[0, 30], [10, 27], [20, 19], [30, 10], [40, 2], [50, -7], [55, -8], [60, -5], [66, 3], [72, 13], [78, 22], [87, 30], [100, 30]]),
      knee: periodicTable([[0, 3], [8, 9], [15, 13], [24, 10], [34, 5], [44, 3], [50, 6], [56, 14], [62, 32], [68, 50], [73, 58], [80, 50], [88, 30], [95, 8], [100, 3]]),
      ankle: periodicTable([[0, 0], [5, -4], [12, -1], [25, 5], [40, 9], [48, 8], [54, 2], [59, -8], [63, -14], [68, -10], [75, -3], [85, 0], [100, 0]]),
    },
    stance: 0.6,
    label: "Powered prosthesis",
  },
};

const PHASES = [
  [2, "Initial contact"],
  [12, "Loading response"],
  [31, "Mid stance"],
  [50, "Terminal stance"],
  [62, "Pre-swing: push-off"],
  [75, "Initial swing"],
  [87, "Mid swing"],
  [101, "Terminal swing"],
];

const N = 240; // samples per cycle for the physics tables
const HARM = 2; // Fourier harmonics kept: stride and step frequency

function warp(t, stance) {
  const tt = ((t % 1) + 1) % 1;
  const bio = 0.62;
  return tt < stance ? (tt / stance) * bio * 100 : (bio + ((tt - stance) / (1 - stance)) * (1 - bio)) * 100;
}

function angles(mode, side, t, k) {
  const cfg = MODES[mode];
  const set = side === "R" ? cfg.right : BIO;
  const pct = side === "R" ? warp(t, cfg.stance) : (((t % 1) + 1) % 1) * 100;
  return {
    pct,
    hip: 10 + (sample(set.hip, pct) - 10) * k,
    knee: sample(set.knee, pct) * (0.65 + 0.35 * k),
    ankle: sample(set.ankle, pct),
  };
}

// Sagittal leg chain from the hip joint (x forward, y up).
// Hip flexion is measured against the pelvis, which tilts forward about 10°,
// so the thigh's angle from vertical is hip flexion minus that tilt.
const TILT = 10;

function leg(a, hx = 0, hy = 0) {
  const ft = rad(a.hip - TILT);
  const K = { x: hx + S.thigh * Math.sin(ft), y: hy - S.thigh * Math.cos(ft) };
  const fs = ft - rad(a.knee);
  const A = { x: K.x + S.shank * Math.sin(fs), y: K.y - S.shank * Math.cos(fs) };
  const b = fs + rad(a.ankle);
  const c = Math.cos(b);
  const s = Math.sin(b);
  const at = (lx, ly) => ({ x: A.x + lx * c - ly * s, y: A.y + lx * s + ly * c });
  const heel = at(-S.heel, -S.ankleH);
  const mtp = at(S.mtp, -S.ankleH);
  // Toes stay flat when the heel rises; otherwise they follow the foot.
  const tb = b < 0 ? b * 0.15 : b;
  const toe = { x: mtp.x + S.toe * Math.cos(tb), y: mtp.y + S.toe * Math.sin(tb) };
  const low = [heel, mtp, toe].reduce((m, p) => (p.y < m.y ? p : m));
  return { H: { x: hx, y: hy }, K, A, heel, mtp, toe, low, b };
}

function fourier(arr) {
  const a = [];
  const b = [];
  for (let n = 0; n <= HARM; n++) {
    let sa = 0;
    let sb = 0;
    for (let i = 0; i < N; i++) {
      const th = (2 * Math.PI * n * i) / N;
      sa += arr[i] * Math.cos(th);
      sb += arr[i] * Math.sin(th);
    }
    a.push((2 / N) * sa);
    b.push((2 / N) * sb);
  }
  return { a, b };
}

// Evaluate a Fourier series (d = derivative order w.r.t. phase p).
function fEval(F, p, d = 0) {
  let v = d === 0 ? F.a[0] / 2 : 0;
  for (let n = 1; n <= HARM; n++) {
    const w = 2 * Math.PI * n;
    const th = w * p;
    const c = Math.cos(th);
    const s = Math.sin(th);
    if (d === 0) v += F.a[n] * c + F.b[n] * s;
    else if (d === 1) v += w * (-F.a[n] * s + F.b[n] * c);
    else if (d === 2) v += -w * w * (F.a[n] * c + F.b[n] * s);
    else if (d === -1) v += (F.a[n] * s - F.b[n] * c) / w;
  }
  return v;
}

// One full cycle of the model: hip height, forward progression, contacts,
// and the resulting ground reaction forces. A foot is in stance for the first
// 62% of its own cycle (by definition of the gait cycle); the pelvis sits on
// whichever stance leg is longer, so the other foot just touches.
function buildCycle(mode, k) {
  const hipY = new Float32Array(N);
  const adv = new Float32Array(N); // hip advance per sample (m)
  const cR = new Uint8Array(N);
  const cL = new Uint8Array(N);
  const lead = new Int8Array(N);
  const stanceR = MODES[mode].stance;
  let prev = null;
  let lastD = 0;
  for (let i = 0; i < N; i++) {
    const p = i / N;
    const r = leg(angles(mode, "R", p, k));
    const l = leg(angles(mode, "L", p + 0.5, k));
    const sR = p < stanceR;
    const sL = (p + 0.5) % 1 < 0.62;
    const hR = -r.low.y;
    const hL = -l.low.y;
    const support = sR && sL ? (hR >= hL ? "R" : "L") : sR ? "R" : "L";
    hipY[i] = support === "R" ? hR : hL;
    cR[i] = sR ? 1 : 0;
    cL[i] = sL ? 1 : 0;
    lead[i] = r.A.x > l.A.x ? 1 : -1;
    const ax = support === "R" ? r.low.x : l.low.x;
    if (prev && prev.support === support && Math.abs(ax - prev.x) < 0.02) lastD = prev.x - ax;
    adv[i] = lastD;
    prev = { support, x: ax };
  }
  adv[0] = adv[N - 1];
  let stride = 0;
  for (let i = 0; i < N; i++) stride += adv[i];
  const Fy = fourier(hipY);
  const Fv = fourier(Array.from(adv, (d) => d * N)); // hip velocity in m per cycle
  return { hipY, cR, cL, lead, stride, Fy, Fv, mode, k };
}

// Weight share of the right foot, ramping across double support.
function shareRight(cyc, i) {
  const r = cyc.cR[i];
  const l = cyc.cL[i];
  if (r && !l) return 1;
  if (l && !r) return 0;
  if (!r && !l) return 0.5;
  let s = i;
  let e = i;
  while (cyc.cR[(s - 1 + N) % N] && cyc.cL[(s - 1 + N) % N] && s > i - N) s--;
  while (cyc.cR[(e + 1) % N] && cyc.cL[(e + 1) % N] && e < i + N) e++;
  const prog = (i - s + 0.5) / (e - s + 1);
  return cyc.lead[i] === 1 ? prog : 1 - prog;
}

export function createGait({ renderer, env, pal }) {
  const root = byId("lab-gait");
  const host = root.querySelector(".stage-3d");
  const labelLayer = root.querySelector(".stage-labels");
  const plots = hud(byId("gait-plots"));
  const speedEl = byId("gait-speed");
  const scrubEl = byId("gait-scrub");
  const playBtn = byId("gait-play");
  const forcesEl = byId("gait-forces");
  const modeBtns = Array.from(root.querySelectorAll("[data-gait-mode]"));
  const camBtns = Array.from(root.querySelectorAll("[data-cam]"));
  const phaseEl = byId("gait-phase");

  const scene = new THREE.Scene();
  const studio = makeStudio(scene, pal, env, { size: 9, cell: 0.1, shadowExtent: 2.2 });
  studio.key.position.set(2.5, 5, 3);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 2.2;
  controls.maxDistance = 9;
  controls.maxPolarAngle = rad(88);
  controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controls.enabled = false;
  const CAMS = {
    three: { pos: [3.1, 1.55, 3.7], target: [0, 0.85, 0] },
    side: { pos: [0.1, 1.05, 5.2], target: [0, 0.85, 0] },
    front: { pos: [4.8, 1.2, 0.2], target: [0, 0.85, 0] },
  };
  let camTween = null;
  function setCam(name, instant) {
    const c = CAMS[name];
    const to = new THREE.Vector3(...c.pos);
    const tt = new THREE.Vector3(...c.target);
    if (instant) {
      camera.position.copy(to);
      controls.target.copy(tt);
    } else {
      camTween = { from: camera.position.clone(), fromT: controls.target.clone(), to, tt, t: 0 };
    }
    setSeg(camBtns, camBtns.find((b) => b.dataset.cam === name));
  }
  setCam("three", true);

  const mats = makeMaterials(pal);
  const skin = mats.skin;

  // Treadmill ---------------------------------------------------------------
  const tread = new THREE.Group();
  scene.add(tread);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 0.78), mats.graphite);
  deck.position.y = -0.05;
  deck.receiveShadow = true;
  deck.castShadow = true;
  tread.add(deck);
  const beltCanvas = document.createElement("canvas");
  beltCanvas.width = 256;
  beltCanvas.height = 64;
  {
    const g = beltCanvas.getContext("2d");
    g.fillStyle = "#17191d";
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = "#23262c";
    for (let x = 0; x < 256; x += 8) g.fillRect(x, 0, 3, 64);
    g.fillStyle = pal.accent;
    g.globalAlpha = 0.5;
    g.fillRect(0, 0, 10, 64);
  }
  const beltTex = new THREE.CanvasTexture(beltCanvas);
  beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping;
  beltTex.repeat.set(2.2 / 1.1, 1);
  beltTex.colorSpace = THREE.SRGBColorSpace;
  const belt = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.6), new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.9 }));
  belt.rotation.x = -Math.PI / 2;
  belt.position.y = 0.001;
  belt.receiveShadow = true;
  tread.add(belt);
  for (const z of [-0.36, 0.36]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.06, 0.07), mats.aluminum);
    rail.position.set(0, 0.02, z);
    rail.castShadow = true;
    tread.add(rail);
  }

  // Walker -------------------------------------------------------------------
  const body = new THREE.Group();
  scene.add(body);
  function limb(r0, r1, mat) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, 1, 20), mat);
    m.castShadow = true;
    body.add(m);
    return m;
  }
  function ball(r, mat) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
    m.castShadow = true;
    body.add(m);
    return m;
  }
  function footMesh(mat) {
    const shape = new THREE.Shape();
    shape.moveTo(-S.heel, 0);
    shape.quadraticCurveTo(-S.heel - 0.02, S.ankleH * 0.6, -S.heel + 0.015, S.ankleH + 0.01);
    shape.lineTo(0.06, S.ankleH + 0.015);
    shape.quadraticCurveTo(S.mtp - 0.02, S.ankleH * 0.6, S.mtp, 0.0);
    shape.lineTo(-S.heel, 0);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.085, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3 });
    g.translate(0, -S.ankleH, -0.0425);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    body.add(m);
    return m;
  }
  function toeMesh(mat) {
    const g = new THREE.BoxGeometry(S.toe, 0.03, 0.08);
    g.translate(S.toe / 2, 0.015, 0);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    body.add(m);
    return m;
  }

  const legs = {};
  for (const side of ["R", "L"]) {
    legs[side] = {
      thigh: limb(0.052, 0.075, skin),
      shank: limb(0.038, 0.055, skin),
      knee: ball(0.056, skin),
      ankle: ball(0.04, skin),
      foot: footMesh(skin),
      toe: toeMesh(skin),
      hipBall: ball(0.07, skin),
    };
  }
  // Prosthetic parts for the right leg.
  const pros = {
    socket: limb(0.06, 0.085, mats.carbon(3)),
    knee: new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 28), mats.titanium),
    kneeRing: new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.01, 10, 32), mats.glow.clone()),
    pylon: limb(0.016, 0.016, mats.titanium),
    foot: footMesh(mats.carbon(2)),
    toe: toeMesh(mats.carbon(2)),
    ankle: ball(0.035, mats.titanium),
  };
  pros.knee.castShadow = true;
  body.add(pros.knee);
  body.add(pros.kneeRing);

  // Torso as a lathe: pelvis → waist → chest → shoulders, then flattened
  // front-to-back into an ellipse.
  const torsoProfile = [
    [0.0, -0.06], [0.1, -0.05], [0.13, 0.0], [0.115, 0.12], [0.112, 0.2], [0.14, 0.33], [0.15, 0.42], [0.13, 0.49], [0.07, 0.53], [0.0, 0.54],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoProfile, 40), skin);
  torso.scale.set(0.72, 1, 1.18);
  torso.castShadow = true;
  body.add(torso);
  const neck = limb(0.045, 0.045, skin);
  const head = ball(S.headR, skin);
  head.scale.set(1, 1.12, 0.95);
  const arms = {};
  for (const side of ["R", "L"]) {
    arms[side] = { upper: limb(0.035, 0.045, skin), fore: limb(0.03, 0.036, skin), elbow: ball(0.042, skin), hand: ball(0.045, skin), sh: ball(0.055, skin) };
  }

  // Motion-capture markers (the reflective balls a real gait lab tracks).
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const markers = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), markerMat);
    scene.add(m);
    markers.push(m);
  }

  // CoM marker and its trail.
  const com = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), mats.glow);
  scene.add(com);
  const TRAIL = 160;
  const trailPos = new Float32Array(TRAIL * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: new THREE.Color(pal.accent), transparent: true, opacity: 0.7 }));
  trail.frustumCulled = false;
  scene.add(trail);
  let trailCount = 0;

  const arrowR = new Arrow(pal.accent, 0.012);
  const arrowL = new Arrow(pal.on, 0.012);
  scene.add(arrowR.group, arrowL.group);
  const labels = new Labels(labelLayer);
  const lblR = labels.add("callout-accent");
  const lblL = labels.add();
  const lblPhase = labels.add("callout-title");

  // State ----------------------------------------------------------------------
  let mode = "bio";
  let speed = Number(speedEl.value);
  let playing = true;
  let showForces = forcesEl.checked;
  let p = 0.08;
  let beltOff = 0;
  let cyc = null;
  let strideCache = {};
  let freq = 1;
  let lastScrub = -1;

  function strideFor(m, k) {
    const key = `${m}:${k.toFixed(2)}`;
    if (!(key in strideCache)) strideCache[key] = buildCycle(m, k).stride;
    return strideCache[key];
  }

  // Speed → stride frequency (typical adult relation), then solve for the
  // joint-amplitude scale that makes the model's own stride match.
  function rebuild() {
    freq = 0.55 + 0.35 * speed;
    const want = speed / freq;
    let lo = 0.5;
    let hi = 1.45;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (strideFor(mode, mid) < want) lo = mid;
      else hi = mid;
    }
    cyc = buildCycle(mode, (lo + hi) / 2);
    updateReadouts();
    trailCount = 0;
  }

  function stanceFraction(arr) {
    let c = 0;
    for (let i = 0; i < N; i++) c += arr[i];
    return c / N;
  }

  function grfAt(pp) {
    const i = Math.floor((((pp % 1) + 1) % 1) * N) % N;
    const ay = fEval(cyc.Fy, pp, 2) * freq * freq; // m/s² (hip height is a function of phase)
    const ax = fEval(cyc.Fv, pp, 1) * freq * freq; // velocity series is in m/cycle
    const fy = MASS * (G + ay);
    const fx = MASS * ax;
    const sR = shareRight(cyc, i);
    return { fy, fx, sR, cR: cyc.cR[i], cL: cyc.cL[i] };
  }

  function updateReadouts() {
    const v = cyc.stride * freq;
    byId("gait-speed-val").textContent = `${speed.toFixed(2)} m/s`;
    byId("gait-v").textContent = v.toFixed(2);
    byId("gait-cadence").textContent = String(Math.round(freq * 120));
    const sr = stanceFraction(cyc.cR);
    const sl = stanceFraction(cyc.cL);
    byId("gait-sym").textContent = `${Math.round((Math.min(sr, sl) / Math.max(sr, sl)) * 100)}%`;
    let peak = 0;
    for (let i = 0; i < N; i++) {
      const pp = i / N;
      const g = grfAt(pp);
      peak = Math.max(peak, g.fy * Math.max(g.sR, 1 - g.sR));
    }
    byId("gait-peak").textContent = `${(peak / (MASS * G)).toFixed(2)}×`;
    byId("gait-stride").textContent = cyc.stride.toFixed(2);
    byId("gait-v").textContent = v.toFixed(2);
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.gaitMode;
      setSeg(modeBtns, b);
      rebuild();
    }),
  );
  camBtns.forEach((b) => b.addEventListener("click", () => setCam(b.dataset.cam)));
  speedEl.addEventListener("input", () => {
    speed = Number(speedEl.value);
    rebuild();
  });
  scrubEl.addEventListener("input", () => {
    playing = false;
    playBtn.textContent = "Play";
    p = Number(scrubEl.value) / 100;
  });
  playBtn.addEventListener("click", () => {
    playing = !playing;
    playBtn.textContent = playing ? "Pause" : "Play";
  });
  forcesEl.addEventListener("change", () => (showForces = forcesEl.checked));

  // Frame --------------------------------------------------------------------
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const tA = new THREE.Vector3();
  const tB = new THREE.Vector3();

  function seg(mesh, a, b) {
    placeBetween(mesh, a, b, 1);
  }

  function poseLeg(side, a, hip, z, prosthetic) {
    const Lg = leg(a, hip.x, hip.y);
    const P = (pt) => v3(pt.x, pt.y, z);
    const L = legs[side];
    const Hh = P(Lg.H);
    const K = P(Lg.K);
    const A = P(Lg.A);
    L.hipBall.position.copy(Hh);
    if (prosthetic) {
      const mid = v3(Hh.x + (K.x - Hh.x) * 0.45, Hh.y + (K.y - Hh.y) * 0.45, z);
      seg(L.thigh, Hh, mid);
      seg(pros.socket, v3(Hh.x + (K.x - Hh.x) * 0.3, Hh.y + (K.y - Hh.y) * 0.3, z), v3(K.x + (Hh.x - K.x) * 0.12, K.y + (Hh.y - K.y) * 0.12, z));
      pros.knee.position.copy(K);
      pros.knee.rotation.set(Math.PI / 2, 0, 0);
      pros.kneeRing.position.copy(K).add(v3(0, 0, 0.052));
      pros.kneeRing.material.emissiveIntensity = 1.6;
      seg(pros.pylon, K, A);
      pros.ankle.position.copy(A);
      pros.foot.position.copy(A);
      pros.foot.rotation.set(0, 0, Lg.b);
      pros.toe.position.copy(P(Lg.mtp));
      pros.toe.rotation.set(0, 0, Lg.b < 0 ? Lg.b * 0.15 : Lg.b);
      [L.shank, L.knee, L.ankle, L.foot, L.toe].forEach((m) => (m.visible = false));
      Object.values(pros).forEach((m) => (m.visible = true));
      pros.kneeRing.visible = mode === "powered";
    } else {
      seg(L.thigh, Hh, K);
      seg(L.shank, K, A);
      L.knee.position.copy(K);
      L.ankle.position.copy(A);
      L.foot.position.copy(A);
      L.foot.rotation.set(0, 0, Lg.b);
      L.toe.position.copy(P(Lg.mtp));
      L.toe.rotation.set(0, 0, Lg.b < 0 ? Lg.b * 0.15 : Lg.b);
      [L.shank, L.knee, L.ankle, L.foot, L.toe].forEach((m) => (m.visible = true));
      if (side === "R") Object.values(pros).forEach((m) => (m.visible = false));
    }
    return { Lg, P };
  }

  function update(dt) {
    if (camTween) {
      camTween.t = Math.min(1, camTween.t + dt / 0.9);
      const e = 1 - Math.pow(1 - camTween.t, 3);
      camera.position.lerpVectors(camTween.from, camTween.to, e);
      controls.target.lerpVectors(camTween.fromT, camTween.tt, e);
      if (camTween.t >= 1) camTween = null;
    }
    controls.update();

    const prevP = p;
    if (playing) p = (p + freq * dt) % 1;
    const v = cyc.stride * freq;
    let dp = p - prevP;
    if (dp < -0.5) dp += 1;
    if (dp > 0.5) dp -= 1;
    beltOff += (dp / freq) * v;
    beltTex.offset.x = beltOff / 1.1;

    if (playing && Math.abs(p * 100 - lastScrub) > 0.8) {
      lastScrub = p * 100;
      scrubEl.value = (p * 100).toFixed(1);
    }
    byId("gait-scrub-val").textContent = `${Math.round(p * 100)}%`;

    // Hip path: height from the legs, fore–aft sway from velocity changes.
    const hipY = fEval(cyc.Fy, p, 0);
    // ∫(v − v̄)dp: the body surges and lags a few cm over a constant-speed belt.
    const hipX = fEval(cyc.Fv, p, -1) - 0.05;
    const aR = angles(mode, "R", p, cyc.k);
    const aL = angles(mode, "L", p + 0.5, cyc.k);

    const yaw = rad(4) * Math.cos(2 * Math.PI * p);
    const list = rad(3.5) * Math.sin(2 * Math.PI * (p - 0.12));
    const sway3 = 0.022 * Math.cos(2 * Math.PI * (p - 0.2));
    const hipR = { x: hipX + Math.sin(yaw) * S.pelvis, y: hipY - Math.sin(list) * S.pelvis };
    const hipL = { x: hipX - Math.sin(yaw) * S.pelvis, y: hipY + Math.sin(list) * S.pelvis };
    const zR = S.pelvis + sway3;
    const zL = -S.pelvis + sway3;
    const R = poseLeg("R", aR, hipR, zR, mode !== "bio");
    const Lft = poseLeg("L", aL, hipL, zL, false);

    // Pelvis, trunk, head.
    const lean = rad(3);
    torso.position.set(hipX, hipY + 0.02, sway3);
    torso.rotation.set(list * 0.6, yaw * 0.4, -lean);
    const shoulderC = v3(hipX + S.trunk * Math.sin(lean), hipY + S.trunk * Math.cos(lean), sway3 * 0.6);
    const neckTop = v3(shoulderC.x + 0.015, shoulderC.y + 0.1, shoulderC.z);
    seg(neck, v3(shoulderC.x, shoulderC.y, shoulderC.z), neckTop);
    head.position.set(neckTop.x + 0.02, neckTop.y + S.headR * 0.9, neckTop.z);

    for (const [side, hipA, zs] of [
      ["R", aR, 1],
      ["L", aL, -1],
    ]) {
      const arm = arms[side];
      const shYaw = -yaw * 0.6;
      const sh = v3(shoulderC.x - Math.sin(shYaw) * S.shoulder * zs, shoulderC.y - 0.03, shoulderC.z + S.shoulder * zs);
      const flex = rad(-0.55 * (hipA.hip - 10));
      const E = v3(sh.x + S.upper * Math.sin(flex), sh.y - S.upper * Math.cos(flex), sh.z + 0.02 * zs);
      const ef = flex + rad(18 + Math.max(0, -0.55 * (hipA.hip - 10)) * 0.9);
      const W = v3(E.x + S.fore * Math.sin(ef), E.y - S.fore * Math.cos(ef), E.z);
      arm.sh.position.copy(sh);
      seg(arm.upper, sh, E);
      seg(arm.fore, E, W);
      arm.elbow.position.copy(E);
      arm.hand.position.copy(W);
    }

    // Markers on the right (near) leg and pelvis.
    const Lg = R.Lg;
    const mk = [
      v3(Lg.H.x, Lg.H.y, zR + 0.07),
      v3(Lg.K.x, Lg.K.y, zR + 0.06),
      v3(Lg.A.x, Lg.A.y, zR + 0.045),
      v3(Lg.heel.x, Lg.heel.y + 0.03, zR),
      v3(Lg.toe.x, Lg.toe.y + 0.02, zR),
      v3(Lft.Lg.K.x, Lft.Lg.K.y, zL - 0.06),
      v3(Lft.Lg.A.x, Lft.Lg.A.y, zL - 0.045),
      v3(Lft.Lg.heel.x, Lft.Lg.heel.y + 0.03, zL),
      v3(hipX + 0.1, hipY + 0.08, sway3 + 0.1),
      v3(hipX + 0.1, hipY + 0.08, sway3 - 0.1),
    ];
    mk.forEach((m, i) => markers[i].position.copy(m));

    // Centre of mass (approx. just above the hip joints) and its path.
    const comPos = v3(hipX + 0.02, hipY + 0.09, sway3 * 0.8);
    com.position.copy(comPos);
    const beltStep = (dp / freq) * v;
    for (let i = 0; i < trailCount; i++) trailPos[i * 3] -= beltStep;
    if (playing) {
      if (trailCount < TRAIL) trailCount++;
      trailPos.copyWithin(3, 0, (TRAIL - 1) * 3);
      trailPos[0] = comPos.x;
      trailPos[1] = comPos.y;
      trailPos[2] = comPos.z;
    }
    trailGeo.setDrawRange(0, trailCount);
    trailGeo.attributes.position.needsUpdate = true;

    // Ground reaction force vectors from the center of pressure.
    const g = grfAt(p);
    const bw = MASS * G;
    const drawGRF = (arrow, lbl, Lgx, z, share, on) => {
      const fy = g.fy * share;
      const fx = g.fx * share;
      if (!showForces || !on || fy < 20) {
        arrow.hide();
        labels.set(lbl, v3(0, 0, 0), "", false);
        return;
      }
      const cop = Lgx.low;
      tA.set(cop.x, 0.002, z);
      tB.set(fx, fy, 0);
      const len = (tB.length() / bw) * 0.62;
      arrow.set(tA, tB, len);
      tB.normalize().multiplyScalar(len + 0.06).add(tA);
      labels.set(lbl, tB, `${(fy / bw).toFixed(2)} BW`);
    };
    drawGRF(arrowR, lblR, R.Lg, zR, g.sR, g.cR);
    drawGRF(arrowL, lblL, Lft.Lg, zL, 1 - g.sR, g.cL);

    const pct = aR.pct;
    const ph = PHASES.find((x) => pct < x[0]);
    const phText = ph ? ph[1] : "Terminal swing";
    labels.set(lblPhase, v3(Lg.A.x, Lg.A.y - 0.16, zR + 0.12), phText);
    const txt = `Right leg (${MODES[mode].label.toLowerCase()}): ${phText.toLowerCase()}`;
    if (phaseEl.textContent !== txt) phaseEl.textContent = txt;
  }

  // Plots ----------------------------------------------------------------------
  function plot(ctx, x, y, w, h, title, lo, hi, fns, unit) {
    ctx.fillStyle = pal.stage2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    const px = x + 10;
    const pw = w - 20;
    const py = y + 22;
    const ph = h - 30;
    const toY = (v) => py + ph - ((v - lo) / (hi - lo)) * ph;
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (lo < 0 && hi > 0) {
      ctx.moveTo(px, toY(0));
      ctx.lineTo(px + pw, toY(0));
    }
    ctx.moveTo(px + pw * 0.62, py);
    ctx.lineTo(px + pw * 0.62, py + ph);
    ctx.stroke();
    text(ctx, title, x + 10, y + 15, pal, { size: 10 });
    text(ctx, unit, x + w - 10, y + 15, pal, { size: 10, align: "right" });
    for (const f of fns) {
      ctx.strokeStyle = f.color;
      ctx.lineWidth = f.width || 1.6;
      ctx.setLineDash(f.dash || []);
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const t = i / 80;
        const yy = toY(clamp(f.fn(t), lo, hi));
        if (i === 0) ctx.moveTo(px + t * pw, yy);
        else ctx.lineTo(px + t * pw, yy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (f.cursor !== undefined) {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(px + f.cursor * pw, toY(clamp(f.fn(f.cursor), lo, hi)), 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawPlots() {
    plots.resize();
    const { ctx, w, h } = plots;
    const cols = w < 640 ? 2 : 4;
    const rows = 4 / cols;
    const gap = 8;
    const cw = (w - gap * (cols - 1)) / cols;
    const ch = (h - gap * (rows - 1)) / rows;
    const k = cyc.k;
    const bw = MASS * G;
    const norm = (key) => (t) => sample(BIO[key], t * 100);
    const specs = [
      ["HIP FLEXION", -20, 40, "deg", "hip"],
      ["KNEE FLEXION", -5, 75, "deg", "knee"],
      ["ANKLE DORSIFLEXION", -25, 20, "deg", "ankle"],
    ];
    specs.forEach((sp, i) => {
      const cx = (i % cols) * (cw + gap);
      const cy = Math.floor(i / cols) * (ch + gap);
      plot(ctx, cx, cy, cw, ch, sp[0], sp[1], sp[2], [
        { fn: norm(sp[4]), color: pal.muted, dash: [3, 4], width: 1 },
        { fn: (t) => angles(mode, "L", t, k)[sp[4]], color: pal.on, cursor: (p + 0.5) % 1 },
        { fn: (t) => angles(mode, "R", t, k)[sp[4]], color: pal.accent, cursor: p },
      ], sp[3]);
    });
    const i = 3;
    plot(ctx, (i % cols) * (cw + gap), Math.floor(i / cols) * (ch + gap), cw, ch, "VERTICAL GRF", 0, 1.5, [
      { fn: () => 1, color: pal.muted, dash: [3, 4], width: 1 },
      { fn: (t) => (grfAt(t).fy * (1 - grfAt(t).sR)) / bw, color: pal.on },
      { fn: (t) => (grfAt(t).fy * grfAt(t).sR) / bw, color: pal.accent, cursor: p },
    ], "× body wt");
  }

  let w = 1;
  let h = 1;
  rebuild();
  return {
    active: false,
    host,
    scene,
    camera,
    controls,
    resize(width, height) {
      w = width;
      h = height;
      camera.aspect = width / height;
      camera.fov = width < 520 ? 27 : 30;
      camera.updateProjectionMatrix();
    },
    update,
    overlay() {
      labels.update(camera, w, h);
      drawPlots();
    },
    onShow() {
      controls.enabled = true;
    },
    onHide() {
      controls.enabled = false;
    },
  };
}

