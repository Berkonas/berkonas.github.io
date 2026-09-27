// Home hero: a tactile pin-array display rendered with three.js.
// Pin displays are real haptic devices; this one draws Berk's world
// (a monogram, a robot arm, a heartbeat) and ripples under your cursor.
import * as THREE from "three";

const host = document.querySelector("[data-pin-field]");
if (host && canUseWebGL()) {
  document.fonts?.ready.then(() => start(host)).catch(() => start(host));
}

function canUseWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (err) {
    return false;
  }
}

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function start(host) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = window.innerWidth < 720;
  const COLS = narrow ? 28 : 72;
  const ROWS = narrow ? 46 : 38;
  const GAP = 0.42;
  const GLYPH_HEIGHT = narrow ? 0.5 : 0.85;
  const COUNT = COLS * ROWS;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0d0e11, 14, 34);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xe8ebf2, 0x0d0e11, 1.6));
  const key = new THREE.DirectionalLight(0xfff1e6, 2.2);
  key.position.set(-6, 12, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9db8ff, 0.9);
  rim.position.set(6, 4, -10);
  scene.add(rim);
  const glow = new THREE.PointLight(0xff5b24, 0, 7, 1.6);
  glow.position.set(0, 1.4, 0);
  scene.add(glow);

  const geometry = new THREE.CylinderGeometry(0.14, 0.14, 1, 14, 1);
  geometry.translate(0, 0.5, 0);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.28 });
  const pins = new THREE.InstancedMesh(geometry, material, COUNT);
  pins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(pins);

  const field = new THREE.Group();
  field.add(pins);
  scene.add(field);

  // Pin positions (field-local) and animated state.
  const px = new Float32Array(COUNT);
  const pz = new Float32Array(COUNT);
  const height = new Float32Array(COUNT).fill(0.2);
  for (let j = 0; j < ROWS; j += 1) {
    for (let i = 0; i < COLS; i += 1) {
      const n = j * COLS + i;
      px[n] = (i - (COLS - 1) / 2) * GAP;
      pz[n] = (j - (ROWS - 1) / 2) * GAP;
    }
  }

  // Glyphs are drawn on a small canvas and sampled per pin.
  const glyphCenter = narrow ? [0.5, 0.13] : [0.665, 0.4];
  const glyphs = [drawMonogram, drawRobotArm, drawHeartbeat].map((draw) => rasterize(draw, COLS, ROWS, glyphCenter, narrow));

  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  const graphite = new THREE.Color(0x353942);
  const steel = new THREE.Color(0x8a8f9c);
  const accent = new THREE.Color(0xff5b24);

  // Pointer state in field-local coordinates.
  const pointer = { x: 0, z: 0, active: 0, target: 0, lastMove: -10, has: false };
  const ripples = [];
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  function toField(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return null;
    field.worldToLocal(hit);
    return hit;
  }

  let lastRipple = 0;
  function onMove(event) {
    const p = toField(event.clientX, event.clientY);
    if (!p) return;
    pointer.x = p.x;
    pointer.z = p.z;
    pointer.target = 1;
    pointer.has = true;
    pointer.lastMove = clock.elapsedTime;
    if (clock.elapsedTime - lastRipple > 0.16) {
      lastRipple = clock.elapsedTime;
      addRipple(p.x, p.z, 0.35);
    }
    wake();
  }

  function onDown(event) {
    const p = toField(event.clientX, event.clientY);
    if (!p) return;
    addRipple(p.x, p.z, 1);
    pointer.lastMove = clock.elapsedTime;
    wake();
  }

  function addRipple(x, z, strength) {
    ripples.push({ x, z, born: clock.elapsedTime, strength });
    if (ripples.length > 8) ripples.shift();
  }

  // Listen on the whole hero so the copy on top doesn't block the pins.
  const hero = host.closest(".hero") || host;
  hero.addEventListener("pointermove", onMove, { passive: true });
  hero.addEventListener("pointerdown", onDown, { passive: true });
  hero.addEventListener("pointerleave", () => {
    pointer.target = 0;
  });

  function layout() {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (w < 720) {
      camera.fov = 46;
      camera.position.set(0, 14, 5.5);
      camera.lookAt(0, 0, -3.2);
      field.position.set(0, 0, 0);
    } else {
      camera.fov = 30;
      camera.position.set(0, 19, 14);
      camera.lookAt(0, 0, 1.2);
      field.position.set(0, 0, 0);
    }
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();
  const GLYPH_SPAN = 7.5;
  const WAVE_SPAN = 2.6;
  const CYCLE = GLYPH_SPAN + WAVE_SPAN;

  function patternAt(t) {
    const k = Math.floor(t / CYCLE);
    const local = t - k * CYCLE;
    const glyph = glyphs[k % glyphs.length];
    const mix = smooth(0, 1.4, local) * (1 - smooth(GLYPH_SPAN - 1.4, GLYPH_SPAN, local));
    return { glyph, mix, local };
  }

  function update(dt, t) {
    const { glyph, mix, local } = patternAt(t);

    // An idle "finger" keeps the display alive when nobody is touching it.
    const idle = t - pointer.lastMove > 3.2;
    if (idle) {
      const range = narrow ? 3.4 : 7.5;
      pointer.x = Math.sin(t * 0.37) * range + (narrow ? 0 : 3.5);
      pointer.z = Math.sin(t * 0.61 + 1.2) * (narrow ? 4 : 3.2);
      pointer.target = 0.55;
    }
    pointer.active += (pointer.target - pointer.active) * Math.min(1, dt * 4);

    glow.position.set(pointer.x + field.position.x, 1.5, pointer.z);
    glow.intensity = 26 * pointer.active;

    const follow = Math.min(1, dt * 7);
    for (let n = 0; n < COUNT; n += 1) {
      const x = px[n];
      const z = pz[n];

      let h =
        0.16 +
        0.11 * Math.sin(x * 0.55 + t * 1.05) * Math.cos(z * 0.62 - t * 0.72) +
        0.06 * Math.sin((x + z) * 0.34 + t * 1.5);

      if (mix > 0) {
        // Pins "type" the glyph left to right as it arrives.
        const sweep = smooth(0, 1, (local - (x + 16) * 0.03) / 0.9);
        h = h * (1 - mix * 0.55) + glyph[n] * GLYPH_HEIGHT * mix * sweep;
      }

      const dx = x - pointer.x;
      const dz = z - pointer.z;
      const d2 = dx * dx + dz * dz;
      h += Math.exp(-d2 / 1.3) * 0.7 * pointer.active;

      for (let r = 0; r < ripples.length; r += 1) {
        const rip = ripples[r];
        const age = t - rip.born;
        const rx = x - rip.x;
        const rz = z - rip.z;
        const d = Math.sqrt(rx * rx + rz * rz);
        const front = age * 6;
        const band = d - front;
        if (band > -2.4 && band < 0.6) {
          h += Math.sin(band * 2.6) * Math.exp(-age * 1.7) * 0.55 * rip.strength * Math.exp(-d * 0.08);
        }
      }

      h = Math.max(0.06, h);
      height[n] += (h - height[n]) * follow;
    }

    for (let r = ripples.length - 1; r >= 0; r -= 1) {
      if (t - ripples[r].born > 3) ripples.splice(r, 1);
    }
  }

  function commit() {
    for (let n = 0; n < COUNT; n += 1) {
      const h = height[n];
      matrix.makeScale(1, h, 1);
      matrix.setPosition(px[n], 0, pz[n]);
      pins.setMatrixAt(n, matrix);
      const heat = smooth(0.3, 0.7, h);
      color.copy(graphite).lerp(steel, smooth(0.1, 0.45, h) * 0.5).lerp(accent, heat);
      pins.setColorAt(n, color);
    }
    pins.instanceMatrix.needsUpdate = true;
    pins.instanceColor.needsUpdate = true;
    renderer.render(scene, camera);
  }

  let running = false;
  let inView = true;
  let raf = 0;

  function frame() {
    raf = 0;
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    update(dt, clock.elapsedTime);
    commit();
    raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (reduceMotion.matches || !inView || document.hidden) return;
    if (!running) {
      running = true;
      clock.getDelta();
      raf = requestAnimationFrame(frame);
    }
  }

  function sleep() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function renderStill() {
    // Reduced motion: settle on the monogram, no animation loop.
    const glyph = glyphs[0];
    for (let n = 0; n < COUNT; n += 1) {
      height[n] = 0.14 + 0.05 * Math.sin(px[n] * 0.55) * Math.cos(pz[n] * 0.62) + glyph[n] * 0.8;
    }
    commit();
  }

  layout();
  if (reduceMotion.matches) {
    renderStill();
  } else {
    // Seed heights so the first frame isn't flat.
    update(1, 0.01);
    commit();
    wake();
  }
  host.classList.add("is-live");

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) wake();
    else sleep();
  }).observe(host);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) sleep();
    else wake();
  });

  reduceMotion.addEventListener?.("change", () => {
    if (reduceMotion.matches) {
      sleep();
      renderStill();
    } else {
      wake();
    }
  });

  let resizeRaf = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      layout();
      if (!running) commit();
    });
  }).observe(host);
}

// ---------------------------------------------------------------------------
// Glyph rasterizer: draw on a canvas, average each cell to a 0..1 height.
// ---------------------------------------------------------------------------

function rasterize(draw, cols, rows, center, narrow) {
  const SCALE = 10;
  const canvas = document.createElement("canvas");
  canvas.width = cols * SCALE;
  canvas.height = rows * SCALE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.save();
  ctx.translate(canvas.width * center[0], canvas.height * center[1]);
  const unit = SCALE * (narrow ? 0.52 : 0.78);
  draw(ctx, unit);
  ctx.restore();

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const out = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      let sum = 0;
      for (let y = 2; y < SCALE; y += 3) {
        for (let x = 2; x < SCALE; x += 3) {
          sum += data[((j * SCALE + y) * canvas.width + (i * SCALE + x)) * 4];
        }
      }
      out[j * cols + i] = smooth(0.25, 0.85, sum / (9 * 255));
    }
  }
  return out;
}

// Units are pin cells. Everything is drawn around (0, 0).
function drawMonogram(ctx, u) {
  ctx.font = `600 ${17 * u}px Geist, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BK", 0, u * 0.8);
}

function drawRobotArm(ctx, u) {
  ctx.lineWidth = 2.1 * u;
  ctx.beginPath();
  ctx.moveTo(-9 * u, 8 * u);
  ctx.lineTo(3 * u, 8 * u);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3 * u, 8 * u);
  ctx.lineTo(-3 * u, 5 * u);
  ctx.lineTo(-7 * u, -5 * u);
  ctx.lineTo(5 * u, -8 * u);
  ctx.lineTo(8 * u, -3 * u);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-7 * u, -5 * u, 2 * u, 0, Math.PI * 2);
  ctx.arc(5 * u, -8 * u, 1.7 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1.5 * u;
  ctx.beginPath();
  ctx.moveTo(6.5 * u, 0 * u);
  ctx.lineTo(8 * u, -3 * u);
  ctx.lineTo(10.5 * u, -1 * u);
  ctx.stroke();
}

function drawHeartbeat(ctx, u) {
  ctx.lineWidth = 1.7 * u;
  ctx.beginPath();
  const pts = [
    [-15, 1],
    [-7, 1],
    [-5, -1],
    [-3, 1],
    [-1, 1],
    [1, 8],
    [3.5, -10],
    [6, 4],
    [8, 1],
    [15, 1],
  ];
  pts.forEach(([x, y], k) => (k ? ctx.lineTo(x * u, y * u) : ctx.moveTo(x * u, y * u)));
  ctx.stroke();
}
