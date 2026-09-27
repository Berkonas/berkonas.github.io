// Shared plumbing for the Bionic Playground: one WebGL renderer that moves
// between labs, palette tokens read from the site's CSS variables, a studio
// scene (lights, reflective environment, fading grid floor), thick force
// arrows, and HTML labels pinned to 3D points.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export { THREE, OrbitControls };

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rad = (d) => (d * Math.PI) / 180;
export const deg = (r) => (r * 180) / Math.PI;
export const G = 9.81;
export const byId = (id) => document.getElementById(id);

// Minimum-jerk position profile (Flash & Hogan): smooth human-like reaches.
export const minJerk = (t) => {
  const u = clamp(t, 0, 1);
  return u * u * u * (10 - 15 * u + 6 * u * u);
};

export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (e) {
      /* storage unavailable */
    }
  },
};

// Palette comes from CSS custom properties so the playground follows the
// site's identity. Lab-only semantic colors live in bored.css.
export function readPalette() {
  const cs = getComputedStyle(document.querySelector(".bionic") || document.documentElement);
  // Normalize any CSS color syntax (e.g. "rgb(9 21 38)") to hex for three.js.
  const probe = document.createElement("canvas").getContext("2d");
  const hex = (c, fallback) => {
    if (!c) return fallback;
    if (c.startsWith("var(") || c.includes("--")) return fallback;
    probe.fillStyle = fallback;
    probe.fillStyle = c;
    return probe.fillStyle;
  };
  const v = (name, fallback) => {
    const raw = cs.getPropertyValue(name).trim();
    if (name.startsWith("--font")) return raw || fallback;
    return hex(raw, fallback);
  };
  return {
    stage: v("--stage", "#091526"),
    stage2: v("--stage-2", "#0f213a"),
    stage3: v("--stage-3", "#17304f"),
    on: v("--on-stage", "#eeece7"),
    muted: v("--on-stage-muted", "#9a9ca3"),
    line: v("--stage-line", "rgba(238,236,231,0.12)"),
    accent: v("--accent", "#d4ac5e"),
    good: v("--lab-good", "#3ecf8e"),
    warn: v("--lab-warn", "#f5b942"),
    bad: v("--lab-bad", "#ff4d5e"),
    cool: v("--lab-cool", "#8fb4ff"),
    mono: v("--font-mono", "ui-monospace, monospace"),
    sans: v("--font-sans", "system-ui, sans-serif"),
  };
}

export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  renderer.domElement.className = "stage-gl";
  return { renderer, env };
}

// Floor grid drawn in a shader so lines stay crisp and fade out radially.
function gridMaterial(color, cell, fade) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uCell: { value: cell },
      uFade: { value: fade },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vPos = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uCell;
      uniform float uFade;
      varying vec3 vPos;
      float lines(vec2 c) {
        vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
        return 1.0 - min(min(g.x, g.y), 1.0);
      }
      void main() {
        float minor = lines(vPos.xz / uCell) * 0.35;
        float major = lines(vPos.xz / (uCell * 5.0));
        float d = length(vPos.xz);
        float a = max(minor, major) * (1.0 - smoothstep(uFade * 0.35, uFade, d));
        gl_FragColor = vec4(uColor, a * 0.32);
      }`,
  });
}

// A studio: dark backdrop matching the stage, soft key light with shadows,
// a warm rim in the accent color, and a floor that fades into fog.
export function makeStudio(scene, pal, env, opts = {}) {
  const size = opts.size || 10;
  const cell = opts.cell || 0.1;
  scene.background = new THREE.Color(pal.stage);
  scene.environment = env;
  scene.fog = new THREE.Fog(pal.stage, size * 0.55, size * 1.25);

  const hemi = new THREE.HemisphereLight(0xffffff, new THREE.Color(pal.stage2), 0.55);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(size * 0.35, size * 0.6, size * 0.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  const sc = key.shadow.camera;
  const ext = opts.shadowExtent || size * 0.3;
  sc.left = -ext;
  sc.right = ext;
  sc.top = ext;
  sc.bottom = -ext;
  sc.near = 0.1;
  sc.far = size * 3;
  scene.add(key);

  const rim = new THREE.DirectionalLight(new THREE.Color(pal.accent), 0.9);
  rim.position.set(-size * 0.5, size * 0.25, -size * 0.5);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(size * 1.4, 64),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(pal.stage2), roughness: 0.92, metalness: 0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.Mesh(new THREE.PlaneGeometry(size * 2.8, size * 2.8), gridMaterial(pal.on, cell, size * 0.9));
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = 0.0005 * size;
  scene.add(grid);

  return { key, rim, hemi, floor, grid };
}

// Thick arrow (shaft + cone) that can be pointed and resized every frame.
export class Arrow {
  constructor(color, radius = 0.01) {
    this.group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), toneMapped: false });
    this.mat = mat;
    this.r = radius;
    this.shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 12), mat);
    this.head = new THREE.Mesh(new THREE.ConeGeometry(radius * 2.6, 1, 16), mat);
    this.group.add(this.shaft, this.head);
    this.group.renderOrder = 5;
    this._up = new THREE.Vector3(0, 1, 0);
    this._dir = new THREE.Vector3();
  }
  set(origin, dir, length) {
    const len = Math.max(0, length);
    this.group.visible = len > this.r * 2;
    if (!this.group.visible) return;
    this._dir.copy(dir).normalize();
    const headLen = Math.min(len * 0.45, this.r * 7);
    this.group.position.copy(origin);
    this.group.quaternion.setFromUnitVectors(this._up, this._dir);
    this.shaft.scale.set(1, len - headLen, 1);
    this.shaft.position.y = (len - headLen) / 2;
    this.head.scale.set(1, headLen, 1);
    this.head.position.y = len - headLen / 2;
  }
  hide() {
    this.group.visible = false;
  }
}

// HTML callouts that track 3D points (cheap alternative to CSS2DRenderer).
export class Labels {
  constructor(layer) {
    this.layer = layer;
    this.items = [];
    this._v = new THREE.Vector3();
  }
  add(className = "") {
    const el = document.createElement("div");
    el.className = `callout ${className}`.trim();
    this.layer.appendChild(el);
    const item = { el, pos: new THREE.Vector3(), visible: false, text: "" };
    this.items.push(item);
    return item;
  }
  set(item, pos, text, visible = true) {
    item.pos.copy(pos);
    item.visible = visible;
    if (text !== undefined && text !== item.text) {
      item.text = text;
      item.el.textContent = text;
    }
  }
  update(camera, w, h) {
    for (const it of this.items) {
      if (!it.visible) {
        it.el.style.opacity = "0";
        continue;
      }
      this._v.copy(it.pos).project(camera);
      const behind = this._v.z > 1;
      const x = (this._v.x * 0.5 + 0.5) * w;
      const y = (-this._v.y * 0.5 + 0.5) * h;
      it.el.style.opacity = behind ? "0" : "1";
      it.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }
}

// Orient a capsule/cylinder mesh (built along +Y, centered) between two points.
const _yAxis = new THREE.Vector3(0, 1, 0);
const _seg = new THREE.Vector3();
export function placeBetween(mesh, a, b, baseLength = 1) {
  _seg.subVectors(b, a);
  const len = _seg.length() || 1e-6;
  mesh.position.copy(a).addScaledVector(_seg, 0.5);
  mesh.quaternion.setFromUnitVectors(_yAxis, _seg.multiplyScalar(1 / len));
  mesh.scale.set(1, len / baseLength, 1);
}

// Hi-DPI 2D canvas for HUD plots.
export function hud(canvas) {
  const ctx = canvas.getContext("2d");
  const s = { canvas, ctx, w: 0, h: 0, dpr: 1 };
  s.resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (w !== s.w || h !== s.h || dpr !== s.dpr) {
      s.w = w;
      s.h = h;
      s.dpr = dpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
  };
  return s;
}

export function text(ctx, str, x, y, pal, opts = {}) {
  ctx.font = `${opts.weight || 500} ${opts.size || 11}px ${opts.font || pal.mono}`;
  ctx.fillStyle = opts.color || pal.muted;
  ctx.textAlign = opts.align || "left";
  ctx.textBaseline = opts.baseline || "alphabetic";
  ctx.fillText(str, x, y);
}

export function makeStatus(el) {
  let current = "";
  return (msg, tone = "") => {
    const key = msg + "|" + tone;
    if (key === current) return;
    current = key;
    el.textContent = msg;
    el.dataset.tone = tone;
  };
}

export function setSeg(buttons, active) {
  buttons.forEach((b) => b.setAttribute("aria-checked", b === active ? "true" : "false"));
}

// Periodic cubic Hermite through [percent, value] keys (0..100, wraps).
export function periodicTable(keys, samples = 400) {
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
    const hSeg = xAt(i + 1) - x0;
    const t = (x - x0) / hSeg;
    const t2 = t * t;
    const t3 = t2 * t;
    table[k] =
      (2 * t3 - 3 * t2 + 1) * vAt(i) +
      (t3 - 2 * t2 + t) * hSeg * slope(i) +
      (-2 * t3 + 3 * t2) * vAt(i + 1) +
      (t3 - t2) * hSeg * slope(i + 1);
  }
  return table;
}

export function sample(table, pct) {
  const n = table.length - 1;
  const x = ((((pct % 100) + 100) % 100) / 100) * n;
  const i = Math.floor(x);
  const f = x - i;
  return table[i] * (1 - f) + table[Math.min(n, i + 1)] * f;
}

// Carbon-fiber weave drawn once into a canvas texture.
function weaveTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#15171b";
  g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const horiz = (x + y) % 2 === 0;
      const grad = horiz ? g.createLinearGradient(x * 8, 0, x * 8 + 8, 0) : g.createLinearGradient(0, y * 8, 0, y * 8 + 8);
      grad.addColorStop(0, "#1b1e23");
      grad.addColorStop(0.5, "#3a3f47");
      grad.addColorStop(1, "#1b1e23");
      g.fillStyle = grad;
      g.fillRect(x * 8 + 0.5, y * 8 + 0.5, 7, 7);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Engineering materials shared by the labs.
export function makeMaterials(pal) {
  const weave = weaveTexture();
  return {
    aluminum: new THREE.MeshPhysicalMaterial({ color: 0xd9dde3, metalness: 0.7, roughness: 0.3, clearcoat: 0.4, envMapIntensity: 1.4 }),
    titanium: new THREE.MeshPhysicalMaterial({ color: 0xb4bac3, metalness: 0.85, roughness: 0.22, envMapIntensity: 1.4 }),
    graphite: new THREE.MeshStandardMaterial({ color: 0x2a2d33, metalness: 0.4, roughness: 0.45 }),
    silicone: new THREE.MeshStandardMaterial({ color: 0x1b1d21, metalness: 0, roughness: 0.85 }),
    carbon: (repeat = 4) => {
      const t = weave.clone();
      t.repeat.set(repeat, repeat);
      t.needsUpdate = true;
      return new THREE.MeshPhysicalMaterial({ map: t, metalness: 0.2, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.12 });
    },
    skin: new THREE.MeshPhysicalMaterial({ color: 0xd9d6d0, metalness: 0, roughness: 0.55, sheen: 0.4, sheenColor: 0xffffff }),
    accent: new THREE.MeshStandardMaterial({ color: new THREE.Color(pal.accent), metalness: 0.3, roughness: 0.4 }),
    glow: new THREE.MeshStandardMaterial({
      color: new THREE.Color(pal.accent),
      emissive: new THREE.Color(pal.accent),
      emissiveIntensity: 1,
      roughness: 0.4,
    }),
  };
}
