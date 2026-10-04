// Projects header: a rounded glass block resting over the headline.
// The headline is painted into a texture, and the block bends it the way a
// thick piece of glass would: each pixel of the block looks up the texture
// along a refracted ray, once per band of six wavelengths, so the words show
// through magnified, flipped, and split into blue and yellow fringes. The back
// faces are drawn first into their own pass, which is why the inside edges of
// the block show faintly through the front. Drag it, use the arrow keys, or
// the two buttons to turn it; left alone it drifts.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const STAGE = "#080808";
const STAGE_2 = "#161616";
const INK = "#f5f5f4";
const SILVER_TOP = "#ffffff";
const SILVER_BOTTOM = "#8f8f8f";

const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const QUAD_FRAG = /* glsl */ `
uniform sampler2D uTex;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(uTex, vUv);
  #include <colorspace_fragment>
}
`;

const GLASS_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vEye;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vec4 mvPos = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPos;
  vNormal = normalize(normalMatrix * normal);
  vEye = normalize(mvPos.xyz);
}
`;

const GLASS_FRAG = /* glsl */ `
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uIorR;
uniform float uIorY;
uniform float uIorG;
uniform float uIorC;
uniform float uIorB;
uniform float uIorP;
uniform float uRefractPower;
uniform float uChromatic;
uniform float uSaturation;
uniform float uShininess;
uniform float uDiffuseness;
uniform float uFresnelPower;
uniform float uBackside;
uniform vec3 uLight;
varying vec3 vNormal;
varying vec3 vEye;

#define LOOP 16

vec3 saturateColor(vec3 rgb, float s) {
  float l = dot(rgb, vec3(0.2125, 0.7154, 0.0721));
  return mix(vec3(l), rgb, s);
}

float specular(vec3 light, float shininess, float diffuseness, vec3 n, vec3 eye) {
  vec3 lightVector = normalize(-light);
  vec3 halfVector = normalize(-eye + lightVector);
  float kDiffuse = max(0.0, dot(n, lightVector));
  float kSpecular = pow(max(dot(n, halfVector), 0.0), shininess);
  return kSpecular + kDiffuse * diffuseness;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  // three.js flips the winding for BackSide, so gl_FrontFacing cannot be
  // trusted here; the material says which side it is drawing.
  vec3 n = normalize(vNormal);
  if (uBackside > 0.5) n = -n;
  vec3 eye = normalize(vEye);

  vec3 color = vec3(0.0);
  for (int i = 0; i < LOOP; i++) {
    float slide = float(i) / float(LOOP) * 0.045;
    vec3 rR = refract(eye, n, 1.0 / uIorR);
    vec3 rY = refract(eye, n, 1.0 / uIorY);
    vec3 rG = refract(eye, n, 1.0 / uIorG);
    vec3 rC = refract(eye, n, 1.0 / uIorC);
    vec3 rB = refract(eye, n, 1.0 / uIorB);
    vec3 rP = refract(eye, n, 1.0 / uIorP);

    float r = texture2D(uTexture, uv + rR.xy * (uRefractPower + slide * 1.0) * uChromatic).x * 0.5;
    vec3 ty = texture2D(uTexture, uv + rY.xy * (uRefractPower + slide * 1.0) * uChromatic).rgb;
    float y = (ty.x * 2.0 + ty.y * 2.0 - ty.z) / 6.0;
    float g = texture2D(uTexture, uv + rG.xy * (uRefractPower + slide * 2.0) * uChromatic).y * 0.5;
    vec3 tc = texture2D(uTexture, uv + rC.xy * (uRefractPower + slide * 2.5) * uChromatic).rgb;
    float c = (tc.y * 2.0 + tc.z * 2.0 - tc.x) / 6.0;
    float b = texture2D(uTexture, uv + rB.xy * (uRefractPower + slide * 3.0) * uChromatic).z * 0.5;
    vec3 tp = texture2D(uTexture, uv + rP.xy * (uRefractPower + slide * 1.0) * uChromatic).rgb;
    float p = (tp.z * 2.0 + tp.x * 2.0 - tp.y) / 6.0;

    float R = r + (2.0 * p + 2.0 * y - c) / 3.0;
    float G = g + (2.0 * y + 2.0 * c - p) / 3.0;
    float B = b + (2.0 * c + 2.0 * p - y) / 3.0;
    color += vec3(R, G, B);
  }
  color /= float(LOOP);
  color = saturateColor(color, uSaturation);

  float spec = specular(uLight, uShininess, uDiffuseness, n, eye)
             + 0.6 * specular(vec3(1.0, 1.0, -1.0), uShininess * 0.6, uDiffuseness * 0.5, n, eye);
  color += spec * (uBackside > 0.5 ? 0.35 : 1.0);

  // The bevels catch the light and go white.
  float f = pow(1.0 + dot(eye, n), uFresnelPower);
  color = mix(color, vec3(1.0), f * (uBackside > 0.5 ? 0.25 : 0.55));
  color += vec3(0.004, 0.005, 0.007);

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

function init(root) {
  const canvas = root.querySelector(".glass-canvas");
  // Reduced motion leaves the drift on, as it does the walker: the block turns
  // in place inside its own frame and nothing travels across the page.

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (err) {
    return; // No WebGL: the HTML headline simply stays.
  }
  renderer.setClearColor(STAGE);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // A machine with no usable GPU (a VM, remote desktop, a blocklisted driver
  // on Linux or Windows) runs WebGL in software. There the block is drawn at
  // 1x and only while someone is turning it, instead of drifting every frame.
  const gl = renderer.getContext();
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const gpuName = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "") : "";
  const software = /swiftshader|llvmpipe|softpipe|software|microsoft basic/i.test(gpuName);
  renderer.setPixelRatio(software ? 1 : Math.min(window.devicePixelRatio || 1, 2));

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  // --- The headline, painted into a texture ---------------------------------

  const board = document.createElement("canvas");
  const boardTex = new THREE.CanvasTexture(board);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  boardTex.minFilter = THREE.LinearFilter;
  boardTex.magFilter = THREE.LinearFilter;
  boardTex.generateMipmaps = false;

  const bgScene = new THREE.Scene();
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { uTex: { value: boardTex } },
      vertexShader: QUAD_VERT,
      fragmentShader: QUAD_FRAG,
      depthTest: false,
      depthWrite: false,
    }),
  );
  quad.frustumCulled = false;
  bgScene.add(quad);

  // --- The glass ------------------------------------------------------------

  const shared = {
    uIorR: 1.15,
    uIorY: 1.16,
    uIorG: 1.18,
    uIorC: 1.22,
    uIorB: 1.22,
    uIorP: 1.22,
    uChromatic: 0.5,
    uSaturation: 1.08,
    uShininess: 90,
    uDiffuseness: 0.02,
    uFresnelPower: 5,
  };
  const makeMaterial = (backside) => {
    const uniforms = {
      uTexture: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uRefractPower: { value: backside ? 0.22 : 0.3 },
      uBackside: { value: backside ? 1 : 0 },
      uLight: { value: new THREE.Vector3(-1, 1, 1) },
    };
    Object.entries(shared).forEach(([key, value]) => (uniforms[key] = { value }));
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: GLASS_VERT,
      fragmentShader: GLASS_FRAG,
      side: backside ? THREE.BackSide : THREE.FrontSide,
    });
  };
  const backMat = makeMaterial(true);
  const frontMat = makeMaterial(false);

  const scene = new THREE.Scene();
  const pivot = new THREE.Group();
  const spinner = new THREE.Group();
  const cube = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 8, 0.12), frontMat);
  spinner.add(cube);
  pivot.add(spinner);
  scene.add(pivot);
  spinner.quaternion.setFromEuler(new THREE.Euler(-0.42, 0.62, 0.18));

  // Half floats keep the dark gradient behind the words free of banding, but
  // not every GPU can render into them (older iPhones, some Android chips).
  // Without that, a half-float target is incomplete and the glass draws blank.
  const canHalf =
    renderer.extensions.has("EXT_color_buffer_half_float") || renderer.extensions.has("EXT_color_buffer_float");
  const rtOptions = { type: canHalf ? THREE.HalfFloatType : THREE.UnsignedByteType, depthBuffer: true };
  const rtBack = new THREE.WebGLRenderTarget(2, 2, rtOptions);
  const rtFront = new THREE.WebGLRenderTarget(2, 2, rtOptions);
  backMat.uniforms.uTexture.value = rtBack.texture;
  frontMat.uniforms.uTexture.value = rtFront.texture;

  // --- Layout ---------------------------------------------------------------

  let W = 1;
  let H = 1;

  function drawHeadline(mobile) {
    const dpr = renderer.getPixelRatio();
    board.width = Math.max(2, Math.round(W * dpr));
    board.height = Math.max(2, Math.round(H * dpr));
    const ctx = board.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const glow = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.7);
    glow.addColorStop(0, STAGE_2);
    glow.addColorStop(1, STAGE);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Blueprint grid. Through the glass it bends along with the words.
    const cx = W / 2;
    const gridLines = (step, alpha) => {
      ctx.strokeStyle = `rgba(200, 200, 205, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = (cx % step) + 0.5; x < W; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      for (let y = 0.5; y < H; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();
    };
    gridLines(24, 0.03);
    gridLines(120, 0.06);

    const lines = [
      { text: "Things", serif: false },
      { text: "I’ve", serif: false },
      { text: "built.", serif: true },
    ];
    const fontFor = (line, size) =>
      line.serif ? `italic 400 ${size * 1.16}px "Instrument Serif", Georgia, serif` : `700 ${size}px Archivo, sans-serif`;
    const setFont = (line, size) => {
      ctx.font = fontFor(line, size);
      if ("fontStretch" in ctx) ctx.fontStretch = line.serif ? "normal" : "semi-expanded";
      if ("letterSpacing" in ctx) ctx.letterSpacing = `${(line.serif ? -0.01 : -0.045) * size}px`;
    };

    let fs = Math.min(H * 0.185, W * (mobile ? 0.21 : 0.118));
    const widest = () =>
      Math.max(
        ...lines.map((line) => {
          setFont(line, fs);
          return ctx.measureText(line.text).width;
        }),
      );
    const limit = W * (mobile ? 0.88 : 0.5);
    const measured = widest();
    if (measured > limit) fs *= limit / measured;

    const cy = H * (mobile ? 0.48 : 0.5);
    const gap = fs * 1.02;
    const cap = fs * 0.72;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    lines.forEach((line, i) => {
      setFont(line, fs);
      const y = cy + cap / 2 + (i - 1) * gap;
      if (line.serif) {
        // Brushed silver, like the accent words in the page's own type.
        const metal = ctx.createLinearGradient(0, y - fs * 0.8, 0, y + fs * 0.1);
        metal.addColorStop(0, SILVER_TOP);
        metal.addColorStop(0.5, "#d9d9d9");
        metal.addColorStop(1, SILVER_BOTTOM);
        ctx.fillStyle = metal;
      } else {
        ctx.fillStyle = INK;
      }
      ctx.fillText(line.text, W * 0.5, y);
    });
    boardTex.needsUpdate = true;
  }

  function layout() {
    W = Math.max(1, root.clientWidth);
    H = Math.max(1, root.clientHeight);
    const mobile = W < 768 || W / H < 1;

    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();

    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    rtBack.setSize(size.x, size.y);
    rtFront.setSize(size.x, size.y);
    backMat.uniforms.uResolution.value.copy(size);
    frontMat.uniforms.uResolution.value.copy(size);

    drawHeadline(mobile);

    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visW = visH * camera.aspect;
    const sx = mobile ? 0.5 : 0.515;
    const sy = mobile ? 0.48 : 0.5;
    pivot.position.set((sx - 0.5) * visW, (0.5 - sy) * visH, 0);
    const px = Math.min(H * 0.42, W * (mobile ? 0.48 : 0.27));
    pivot.scale.setScalar((px / H) * visH);
  }

  function draw() {
    renderer.setRenderTarget(rtBack);
    renderer.render(bgScene, camera);

    renderer.setRenderTarget(rtFront);
    renderer.render(bgScene, camera);
    renderer.autoClear = false;
    cube.material = backMat;
    renderer.render(scene, camera);
    renderer.autoClear = true;

    renderer.setRenderTarget(null);
    renderer.render(bgScene, camera);
    renderer.autoClear = false;
    renderer.clearDepth();
    cube.material = frontMat;
    renderer.render(scene, camera);
    renderer.autoClear = true;
  }

  // --- Motion ---------------------------------------------------------------

  const Y = new THREE.Vector3(0, 1, 0);
  const X = new THREE.Vector3(1, 0, 0);
  const q = new THREE.Quaternion();
  const turn = (axis, angle) => spinner.quaternion.premultiply(q.setFromAxisAngle(axis, angle));

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;
  let velX = 0; // rad per 60 Hz frame
  let velY = 0;
  let releasedAt = performance.now() - 2000;
  const spin = { axis: Y, left: 0 };

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    spin.left = 0;
    velX = velY = 0;
    lastX = event.clientX;
    lastY = event.clientY;
    lastMove = performance.now();
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = (event.clientX - lastX) * 0.008;
    const dy = (event.clientY - lastY) * 0.008;
    turn(Y, dx);
    turn(X, dy);
    const frames = Math.max(1, (now - lastMove) / 16.67);
    velX = dx / frames;
    velY = dy / frames;
    lastX = event.clientX;
    lastY = event.clientY;
    lastMove = now;
    wake();
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    releasedAt = performance.now();
    // A pointer that stopped before letting go should not fling the block.
    if (releasedAt - lastMove > 90) velX = velY = 0;
    canvas.classList.remove("dragging");
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  const startSpin = (axis, angle) => {
    velX = velY = 0;
    spin.axis = axis;
    spin.left = angle;
    releasedAt = performance.now();
    wake();
  };

  root.querySelectorAll("[data-turn]").forEach((button) => {
    button.addEventListener("click", () => startSpin(Y, (Math.PI / 2) * Number(button.dataset.turn)));
  });

  canvas.addEventListener("keydown", (event) => {
    const moves = {
      ArrowLeft: [Y, -Math.PI / 2],
      ArrowRight: [Y, Math.PI / 2],
      ArrowUp: [X, -Math.PI / 2],
      ArrowDown: [X, Math.PI / 2],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    startSpin(...move);
  });

  // --- Loop -----------------------------------------------------------------

  let visible = true;
  let raf = 0;
  let last = 0;
  let lost = false;

  // Fig. 2's readout: the block's orientation, as a mechanism drawing would
  // give it. Text is only rewritten when a rounded angle actually changes.
  const readout = root.querySelector("[data-glass-readout]");
  const euler = new THREE.Euler();
  let lastText = "";
  const deg = (r) => {
    const d = Math.round(THREE.MathUtils.radToDeg(r));
    const signed = `${d < 0 ? "−" : ""}${Math.abs(d)}`;
    return `${signed.padStart(4, "\u2007")}°`;
  };
  function updateReadout() {
    if (!readout) return;
    euler.setFromQuaternion(spinner.quaternion, "YXZ");
    const text = `θ ${deg(euler.y)}  φ ${deg(euler.x)}  ψ ${deg(euler.z)}`;
    if (text !== lastText) readout.textContent = lastText = text;
  }

  function tick(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const f = dt * 60;

    if (!dragging) {
      if (Math.abs(spin.left) > 0.0005) {
        const step = spin.left * Math.min(1, 0.09 * f);
        turn(spin.axis, step);
        spin.left -= step;
      } else {
        spin.left = 0;
      }
      if (Math.abs(velX) + Math.abs(velY) > 1e-5) {
        turn(Y, velX * f);
        turn(X, velY * f);
        const damp = Math.pow(0.94, f);
        velX *= damp;
        velY *= damp;
      }
      if (!software) {
        const idle = Math.min(1, Math.max(0, (now - releasedAt - 600) / 1000));
        turn(Y, 0.0035 * idle * f);
        turn(X, 0.0012 * idle * f);
      }
    }

    draw();
    updateReadout();
    const settling = dragging || Math.abs(spin.left) > 0.0005 || Math.abs(velX) + Math.abs(velY) > 1e-5;
    if (visible && (!software || settling)) raf = requestAnimationFrame(tick);
    else last = 0;
  }

  function wake() {
    if (!raf && visible && !lost) raf = requestAnimationFrame(tick);
  }

  // If the GPU drops the context (a driver reset, too many tabs on a phone),
  // stop drawing and let the HTML headline stand in until it comes back.
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    raf = 0;
    root.classList.remove("glass-ready");
  });
  canvas.addEventListener("webglcontextrestored", () => {
    lost = false;
    layout();
    draw();
    root.classList.add("glass-ready");
    wake();
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && !document.hidden;
    if (visible) wake();
  }).observe(root);

  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    last = 0;
    if (visible) wake();
  });

  new ResizeObserver(() => {
    layout();
    draw();
  }).observe(root);

  // Words go in the texture, so the fonts must be there before the first paint.
  const fontsReady = Promise.all([
    document.fonts.load('700 100px "Archivo"'),
    document.fonts.load('italic 400 100px "Instrument Serif"'),
  ]).catch(() => {});
  Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 2500))]).then(() => {
    layout();
    draw();
    updateReadout();
    root.classList.add("glass-ready");
    wake();
    // A font that arrives after the timeout still gets painted in.
    fontsReady.then(() => {
      layout();
      draw();
    });
  });
}

const glassRoot = document.querySelector("[data-glass]");
if (glassRoot) init(glassRoot);
