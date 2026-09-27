// 03 · Reach Bot
// A 4-axis arm with Universal Robots UR5 link lengths and masses. Inverse
// kinematics is solved in closed form (base yaw + planar 2R + wrist pitch that
// keeps the gripper pointing down). Each joint moves with a trapezoidal
// velocity profile (speed and acceleration limits), and the panel shows the
// static gravity torque each joint must hold, against UR5 rated torques.
import {
  THREE,
  OrbitControls,
  Labels,
  byId,
  clamp,
  G,
  rad,
  deg,
  store,
  makeStudio,
  makeMaterials,
  makeStatus,
  setSeg,
} from "./core.js";

// UR5 dimensions (m) and link masses (kg) from the published DH parameters.
const D1 = 0.0892;
const A2 = 0.425;
const A3 = 0.3922;
const LW = 0.0946 + 0.145; // wrist (d5) + parallel gripper to fingertip centre
const M_UPPER = 8.393;
const M_FORE = 2.275;
const M_WRIST = 1.219 + 1.219 + 0.188;
const M_GRIP = 0.9;
const RATED = [150, 150, 150, 28]; // N·m, UR5 joint sizes
const CUBE = 0.045;
const CUBE_MASS = 0.09;
const HOVER = 0.2;
const BIN = { x: -0.12, z: 0.5, size: 0.2, wall: 0.07 };

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// Closed-form IK for a tool tip position with the tool pointing straight down.
function solveIK(x, y, z) {
  const t1 = Math.atan2(z, x);
  let r = Math.hypot(x, z);
  let dy = y + LW - D1;
  let dist = Math.hypot(r, dy);
  const max = (A2 + A3) * 0.998;
  const min = Math.abs(A2 - A3) * 1.05;
  let clipped = false;
  if (dist > max || dist < min) {
    const s = clamp(dist, min, max) / (dist || 1);
    r *= s;
    dy *= s;
    dist = Math.hypot(r, dy);
    clipped = true;
  }
  const D = clamp((r * r + dy * dy - A2 * A2 - A3 * A3) / (2 * A2 * A3), -1, 1);
  const t3 = -Math.acos(D); // elbow up
  const t2 = Math.atan2(dy, r) - Math.atan2(A3 * Math.sin(t3), A2 + A3 * Math.cos(t3));
  const t4 = -Math.PI / 2 - t2 - t3;
  return { q: [t1, t2, t3, t4], clipped };
}

function fk(q) {
  const [t1, t2, t3] = q;
  const ex = A2 * Math.cos(t2);
  const ey = D1 + A2 * Math.sin(t2);
  const wx = ex + A3 * Math.cos(t2 + t3);
  const wy = ey + A3 * Math.sin(t2 + t3);
  const c = Math.cos(t1);
  const s = Math.sin(t1);
  return {
    elbow: { r: ex, y: ey },
    wrist: { r: wx, y: wy },
    tip: new THREE.Vector3(wx * c, wy - LW, wx * s),
  };
}

export function createArm({ renderer, env, pal }) {
  const root = byId("lab-arm");
  const host = root.querySelector(".stage-3d");
  const labelLayer = root.querySelector(".stage-labels");
  const speedEl = byId("arm-speed");
  const loadEl = byId("arm-load");
  const envEl = byId("arm-envelope");
  const challengeBtn = byId("arm-challenge");
  const camBtns = Array.from(root.querySelectorAll("[data-cam]"));
  const torqueEl = byId("arm-torques");
  const jointEl = byId("arm-joints");
  const setStatus = makeStatus(byId("arm-status"));

  const scene = new THREE.Scene();
  const studio = makeStudio(scene, pal, env, { size: 6, cell: 0.05, shadowExtent: 1.2 });
  studio.key.position.set(1.5, 3, 1.8);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.02, 40);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 0.9;
  controls.maxDistance = 4.5;
  controls.maxPolarAngle = rad(86);
  controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controls.enabled = false;
  const CAMS = {
    three: { pos: [1.05, 0.85, 1.2], target: [0.1, 0.2, 0.2] },
    top: { pos: [0.05, 2.3, 0.2], target: [0.05, 0, 0.12] },
    side: { pos: [0.05, 0.5, 2.1], target: [0.05, 0.3, 0.1] },
  };
  let camTween = null;
  function setCam(name, instant) {
    const c = CAMS[name];
    const to = new THREE.Vector3(...c.pos);
    const tt = new THREE.Vector3(...c.target);
    if (instant) {
      camera.position.copy(to);
      controls.target.copy(tt);
    } else camTween = { from: camera.position.clone(), fromT: controls.target.clone(), to, tt, t: 0 };
    setSeg(camBtns, camBtns.find((b) => b.dataset.cam === name));
  }
  setCam("three", true);

  const mats = makeMaterials(pal);
  const urWhite = new THREE.MeshPhysicalMaterial({ color: 0xe4e6e9, metalness: 0.1, roughness: 0.35, clearcoat: 0.6 });
  const capMat = mats.accent;

  // Arm geometry ------------------------------------------------------------
  const base = new THREE.Group();
  scene.add(base);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.02, 48), mats.graphite);
  pedestal.position.y = 0.01;
  pedestal.receiveShadow = true;
  scene.add(pedestal);
  function joint(radius, length, parent, capColor = capMat) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 40), urWhite);
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    g.add(body);
    for (const s of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.008, 40), s > 0 ? capColor : mats.graphite);
      cap.rotation.x = Math.PI / 2;
      cap.position.z = (s * length) / 2;
      g.add(cap);
    }
    parent.add(g);
    return g;
  }
  function tube(radius, length, parent, x0 = 0) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 32), mats.aluminum);
    m.rotation.z = Math.PI / 2;
    m.position.x = x0 + length / 2;
    m.castShadow = true;
    parent.add(m);
    return m;
  }
  const baseBody = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.068, D1, 40), urWhite);
  baseBody.position.y = D1 / 2;
  baseBody.castShadow = true;
  base.add(baseBody);
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.004, 8, 48), mats.glow.clone());
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = D1 * 0.55;
  base.add(baseRing);

  const shoulder = new THREE.Group();
  shoulder.position.y = D1;
  base.add(shoulder);
  joint(0.067, 0.15, shoulder);
  tube(0.047, A2 - 0.1, shoulder, 0.05);
  const elbow = new THREE.Group();
  elbow.position.x = A2;
  shoulder.add(elbow);
  joint(0.058, 0.13, elbow);
  tube(0.037, A3 - 0.08, elbow, 0.04);
  const wrist = new THREE.Group();
  wrist.position.x = A3;
  elbow.add(wrist);
  joint(0.045, 0.11, wrist);
  const wristLink = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.095, 32), urWhite);
  wristLink.rotation.z = Math.PI / 2;
  wristLink.position.x = 0.0946 / 2 + 0.02;
  wristLink.castShadow = true;
  wrist.add(wristLink);
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 32), mats.graphite);
  flange.rotation.z = Math.PI / 2;
  flange.position.x = 0.105;
  wrist.add(flange);
  const gripBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.11), mats.graphite);
  gripBody.position.x = 0.14;
  gripBody.castShadow = true;
  wrist.add(gripBody);
  const fingers = [-1, 1].map((s) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.022, 0.012), mats.aluminum);
    f.position.set(LW - 0.02, 0, s * 0.04);
    f.castShadow = true;
    wrist.add(f);
    return { f, s };
  });

  // Reach envelope, target ring, bin, blocks --------------------------------
  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(A2 + A3, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.accent), wireframe: true, transparent: true, opacity: 0.08 }),
  );
  envelope.position.y = D1;
  scene.add(envelope);

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.028, 0.036, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.accent), transparent: true, opacity: 0.9 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  scene.add(ring);
  const drop = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]),
    new THREE.LineDashedMaterial({ color: new THREE.Color(pal.accent), dashSize: 0.012, gapSize: 0.01, transparent: true, opacity: 0.6 }),
  );
  scene.add(drop);

  const bin = new THREE.Group();
  bin.position.set(BIN.x, 0, BIN.z);
  scene.add(bin);
  const wallMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const binFloor = new THREE.Mesh(new THREE.BoxGeometry(BIN.size, 0.006, BIN.size), mats.accent);
  binFloor.position.y = 0.003;
  binFloor.receiveShadow = true;
  bin.add(binFloor);
  for (const [x, z, w, d] of [
    [0, BIN.size / 2, BIN.size, 0.006],
    [0, -BIN.size / 2, BIN.size, 0.006],
    [BIN.size / 2, 0, 0.006, BIN.size],
    [-BIN.size / 2, 0, 0.006, BIN.size],
  ]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, BIN.wall, d), wallMat);
    wall.position.set(x, BIN.wall / 2, z);
    bin.add(wall);
  }

  const cubeGeo = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
  const cubeMats = [0xeeece7, 0x9aa0a8, 0x2a2d33].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.1 }));
  let cubes = [];

  const labels = new Labels(labelLayer);
  const tipLabel = labels.add("callout-accent");

  // Torque + joint readouts in the panel -------------------------------------
  const torqueRows = [];
  ["J2 shoulder", "J3 elbow", "J4 wrist"].forEach((name, i) => {
    const row = document.createElement("div");
    row.className = "torque-row";
    row.innerHTML = `<span>${name}</span><div class="torque-track"><div class="torque-fill"></div></div><span>0</span>`;
    torqueEl.appendChild(row);
    torqueRows.push({ fill: row.querySelector(".torque-fill"), val: row.lastElementChild, rated: RATED[i + 1] });
  });

  // State ---------------------------------------------------------------------
  const q = [rad(35), rad(55), rad(-100), 0];
  q[3] = -Math.PI / 2 - q[1] - q[2];
  const v = [0, 0, 0, 0];
  let vmax = rad(Number(speedEl.value));
  let amax = vmax * 2.5;
  let payload = Number(loadEl.value);
  let grip = 0; // 0 open, 1 closed
  let gripTarget = 0;
  let pointer = new THREE.Vector3(0.45, 0, 0.1);
  let tipTarget = new THREE.Vector3(0.45, HOVER, 0.1);
  let clipped = false;
  let seq = [];
  let carrying = null;
  let challenge = null;
  let bestTime = Number(store.get("bionic.arm.best", 0)) || 0;
  let lastInput = -10;
  let time = 0;

  function resetCubes() {
    cubes.forEach((c) => scene.remove(c.mesh));
    cubes = [];
    const placed = [];
    for (let i = 0; i < 5; i++) {
      let pos;
      for (let tries = 0; tries < 60; tries++) {
        const a = rad(-70 + Math.random() * 120);
        const r = 0.3 + Math.random() * 0.4;
        pos = new THREE.Vector3(r * Math.cos(a), CUBE / 2, r * Math.sin(a));
        const inBin = Math.abs(pos.x - BIN.x) < BIN.size && Math.abs(pos.z - BIN.z) < BIN.size;
        if (!inBin && placed.every((p) => p.distanceTo(pos) > 0.1)) break;
      }
      placed.push(pos);
      const mesh = new THREE.Mesh(cubeGeo, cubeMats[i % cubeMats.length]);
      mesh.position.copy(pos);
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      cubes.push({ mesh, vy: 0, inBin: false });
    }
  }

  function inBinXZ(p) {
    return Math.abs(p.x - BIN.x) < BIN.size / 2 - CUBE / 2 && Math.abs(p.z - BIN.z) < BIN.size / 2 - CUBE / 2;
  }

  function updateChallengeText() {
    const n = cubes.filter((c) => c.inBin).length;
    byId("arm-score").textContent = challenge ? `${n}/5` : "–";
    byId("arm-best").textContent = bestTime ? `Best ${bestTime.toFixed(1)} s` : "Best –";
  }

  // Pointer → target on the table --------------------------------------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const canvas = renderer.domElement;
  function pointToTable(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = new THREE.Vector3();
    if (ray.ray.intersectPlane(tablePlane, hit)) {
      const rr = Math.hypot(hit.x, hit.z);
      const maxR = 0.82;
      if (rr > maxR) hit.multiplyScalar(maxR / rr);
      if (rr < 0.16) hit.multiplyScalar(0.16 / Math.max(rr, 1e-3));
      pointer.set(hit.x, 0, hit.z);
      lastInput = time;
    }
  }
  let down = null;
  function onMove(e) {
    if (!api.active) return;
    if (e.pointerType === "mouse" || down) pointToTable(e);
  }
  function onDown(e) {
    if (!api.active || (e.pointerType === "mouse" && e.button !== 0)) return;
    down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    pointToTable(e);
  }
  function onUp(e) {
    if (!down || e.pointerId !== down.id) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const dtms = performance.now() - down.t;
    down = null;
    if (moved < 8 && dtms < 500) act();
  }
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  canvas.addEventListener("contextmenu", (e) => api.active && e.preventDefault());

  speedEl.addEventListener("input", () => {
    vmax = rad(Number(speedEl.value));
    amax = vmax * 2.5;
    byId("arm-speed-val").textContent = `${speedEl.value}°/s`;
  });
  loadEl.addEventListener("input", () => {
    payload = Number(loadEl.value);
    byId("arm-load-val").textContent = `${payload.toFixed(1)} kg`;
  });
  envEl.addEventListener("change", () => (envelope.visible = envEl.checked));
  envelope.visible = envEl.checked;
  camBtns.forEach((b) => b.addEventListener("click", () => setCam(b.dataset.cam)));
  challengeBtn.addEventListener("click", () => {
    resetCubes();
    carrying = null;
    seq = [];
    gripTarget = 0;
    challenge = { t: 0, done: false };
    challengeBtn.textContent = "Restart";
    updateChallengeText();
    setStatus("Clock's running. Click a block to pick it up, then click the orange tray to drop it in.", "good");
  });

  // Pick and place as a queue of Cartesian waypoints.
  function act() {
    if (seq.length) return;
    const p = pointer.clone();
    if (!carrying) {
      let best = null;
      let bd = 0.07;
      cubes.forEach((c) => {
        if (c.inBin) return;
        const d = Math.hypot(c.mesh.position.x - p.x, c.mesh.position.z - p.z);
        if (d < bd && c.mesh.position.y < CUBE) {
          bd = d;
          best = c;
        }
      });
      if (!best) {
        setStatus("No block under the gripper. Hover over one and click.");
        return;
      }
      const c = best.mesh.position;
      seq = [
        { tip: new THREE.Vector3(c.x, HOVER, c.z), grip: 0 },
        { tip: new THREE.Vector3(c.x, CUBE / 2, c.z), grip: 0 },
        { tip: new THREE.Vector3(c.x, CUBE / 2, c.z), grip: 1, then: () => (carrying = best), wait: 0.35 },
        { tip: new THREE.Vector3(c.x, HOVER, c.z), grip: 1 },
      ];
      setStatus("Picking: move above, descend, close the gripper, lift.");
    } else {
      const target = inBinXZ(p) ? new THREE.Vector3(p.x, 0.006 + CUBE / 2, p.z) : new THREE.Vector3(p.x, CUBE / 2, p.z);
      const cube = carrying;
      seq = [
        { tip: new THREE.Vector3(p.x, HOVER, p.z), grip: 1 },
        { tip: new THREE.Vector3(target.x, target.y + 0.004, target.z), grip: 1 },
        {
          tip: new THREE.Vector3(target.x, target.y + 0.004, target.z),
          grip: 0,
          wait: 0.3,
          then: () => {
            carrying = null;
            cube.inBin = inBinXZ(cube.mesh.position);
            updateChallengeText();
          },
        },
        { tip: new THREE.Vector3(p.x, HOVER, p.z), grip: 0 },
      ];
      setStatus(inBinXZ(p) ? "Placing it in the tray." : "Placing it on the table.");
    }
  }

  function step(dt) {
    time += dt;
    if (camTween) {
      camTween.t = Math.min(1, camTween.t + dt / 0.9);
      const e = 1 - Math.pow(1 - camTween.t, 3);
      camera.position.lerpVectors(camTween.from, camTween.to, e);
      controls.target.lerpVectors(camTween.fromT, camTween.tt, e);
      if (camTween.t >= 1) camTween = null;
    }
    controls.update();

    // Idle demo: trace a slow figure-eight until someone takes control.
    const idle = time - lastInput > 6 && !seq.length && !challenge;
    if (idle) {
      pointer.set(0.45 + 0.18 * Math.sin(time * 0.5), 0, 0.12 + 0.28 * Math.sin(time));
    }

    if (seq.length) {
      tipTarget.copy(seq[0].tip);
      gripTarget = seq[0].grip;
    } else {
      tipTarget.set(pointer.x, carrying ? HOVER : idle ? 0.12 + 0.08 * Math.sin(time * 0.7) : HOVER, pointer.z);
    }

    const sol = solveIK(tipTarget.x, tipTarget.y, tipTarget.z);
    clipped = sol.clipped;
    for (let i = 0; i < 4; i++) {
      const e = i === 0 ? wrap(sol.q[i] - q[i]) : sol.q[i] - q[i];
      const vdes = Math.sign(e) * Math.min(vmax, Math.sqrt(2 * amax * Math.abs(e)));
      v[i] += clamp(vdes - v[i], -amax * dt, amax * dt);
      if (Math.abs(e) < 1e-4 && Math.abs(v[i]) < 1e-3) v[i] = 0;
      q[i] += v[i] * dt;
    }
    grip += clamp(gripTarget - grip, -dt * 4, dt * 4);

    const f = fk(q);
    const settled = f.tip.distanceTo(tipTarget) < 0.004 && Math.max(...v.map(Math.abs)) < 0.05 && Math.abs(grip - gripTarget) < 0.02;
    if (seq.length && settled) {
      const w = seq[0];
      w.waited = (w.waited || 0) + dt;
      if (w.waited >= (w.wait || 0)) {
        if (w.then) w.then();
        seq.shift();
        if (!seq.length && !challenge?.done) setStatus(carrying ? "Holding a block. Click where to put it: the orange tray scores." : "Hover over a block and click to pick it up.");
      }
    }

    // Blocks: carried ones ride the gripper, released ones fall.
    cubes.forEach((c) => {
      if (c === carrying) {
        c.mesh.position.copy(f.tip);
        c.mesh.rotation.y = -q[0];
        c.vy = 0;
      } else {
        const floor = inBinXZ(c.mesh.position) ? 0.006 + CUBE / 2 : CUBE / 2;
        if (c.mesh.position.y > floor + 1e-4) {
          c.vy -= G * dt;
          c.mesh.position.y = Math.max(floor, c.mesh.position.y + c.vy * dt);
          if (c.mesh.position.y === floor) c.vy = 0;
        }
      }
    });

    if (challenge && !challenge.done) {
      challenge.t += dt;
      if (cubes.every((c) => c.inBin)) {
        challenge.done = true;
        const tt = challenge.t;
        const record = !bestTime || tt < bestTime;
        if (record) {
          bestTime = tt;
          store.set("bionic.arm.best", tt.toFixed(2));
        }
        updateChallengeText();
        challengeBtn.textContent = "Play again";
        setStatus(record ? `All five sorted in ${tt.toFixed(1)} s, a new best.` : `All five sorted in ${tt.toFixed(1)} s. Try a faster motor speed.`, "good");
      }
    }
    if (clipped && !seq.length && !idle) setStatus("That spot is outside the reach envelope, so the arm stretches as far as it can.", "bad");

    // Pose meshes.
    base.rotation.y = -q[0];
    shoulder.rotation.z = q[1];
    elbow.rotation.z = q[2];
    wrist.rotation.z = q[3];
    const open = 0.04 - grip * (0.04 - CUBE / 2 - 0.006);
    fingers.forEach(({ f: m, s }) => (m.position.z = s * open));
    baseRing.material.emissiveIntensity = 0.4 + Math.min(1, Math.max(...v.map(Math.abs)) / vmax) * 1.8;

    ring.position.set(pointer.x, 0.002, pointer.z);
    drop.position.set(f.tip.x, 0, f.tip.z);
    drop.scale.set(1, Math.max(0.001, f.tip.y), 1);
    drop.computeLineDistances();
    labels.set(tipLabel, f.tip.clone().add(new THREE.Vector3(0, 0.07, 0)), `${Math.round(f.tip.x * 1000)}, ${Math.round(f.tip.z * 1000)}, ${Math.round(f.tip.y * 1000)} mm`);

    readouts(f);
    updateChallengeText();
  }

  let readT = 0;
  function readouts(f) {
    readT -= 1;
    if (readT > 0) return;
    readT = 5;
    const names = ["J1 base", "J2 shoulder", "J3 elbow", "J4 wrist"];
    jointEl.innerHTML = q.map((a, i) => `<span>${names[i]}</span><b>${deg(i === 0 ? wrap(a) : a).toFixed(0)}°</b>`).join("");
    // Static gravity torques from horizontal lever arms in the arm's plane.
    const load = M_GRIP + payload + (carrying ? CUBE_MASS : 0);
    const e = f.elbow.r;
    const wr = f.wrist.r;
    const cUpper = 0.5 * e;
    const cFore = e + 0.38 * (wr - e);
    const t2 = G * (M_UPPER * cUpper + M_FORE * cFore + (M_WRIST + load) * wr);
    const t3 = G * (M_FORE * (cFore - e) + (M_WRIST + load) * (wr - e));
    const t4 = G * load * 0; // tool hangs straight down through the J4 axis
    [t2, t3, t4].forEach((tau, i) => {
      const row = torqueRows[i];
      const frac = clamp(Math.abs(tau) / row.rated, 0, 1);
      row.fill.style.width = `${(frac * 100).toFixed(1)}%`;
      row.fill.classList.toggle("hot", frac > 0.7);
      row.val.textContent = `${Math.abs(tau).toFixed(1)} / ${row.rated}`;
    });
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
      camera.fov = width < 520 ? 44 : 34;
      camera.updateProjectionMatrix();
    },
    update: step,
    overlay() {
      labels.update(camera, w, h);
    },
    onShow() {
      controls.enabled = true;
    },
    onHide() {
      controls.enabled = false;
      down = null;
    },
  };
  resetCubes();
  updateChallengeText();
  return api;
}
