// Contact: a black hole, with the light bent the way a black hole bends it.
//
// Every pixel fires one ray out of the camera and walks it back through
// Schwarzschild space until it falls through the horizon, leaves for the sky,
// or cuts the gas disc, often several times over, because a ray can loop the
// hole and come back. The disc is drawn once; the halo above and below it and
// the thin ring around the shadow are the same disc seen again through bent
// light. Units are horizon radii: r = 1 is the horizon, the disc starts at the
// innermost stable orbit, r = 3.
//
// Adapted from a React component on 21st.dev into plain WebGL for this site:
// the gas burns white-hot to ember, and the empty sky is the site's own black,
// so the section sits flush with the footer below it.

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const SCENE_FRAG = `
precision highp float;

#define MAX_STEPS 460
// Seconds before the wound-up gas pattern hands over to a fresh copy.
#define WIND_CYCLE 46.0

varying vec2 vUv;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uCamPos;
uniform vec3  uRight;
uniform vec3  uUp;
uniform vec3  uFwd;
uniform float uTanHalf;
uniform vec2  uFocus;
uniform float uSteps;
uniform float uSkyR;
uniform float uDiskIn;
uniform float uDiskOut;
uniform float uThick;
uniform float uDensity;
uniform float uSpin;
uniform float uGrain;
uniform float uBright;
uniform float uDoppler;
uniform vec3  uHot;
uniform vec3  uMid;
uniform vec3  uCool;
uniform float uEncode;
uniform vec2  uJitter;
uniform float uSeed;

float hash13(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

// lod fades the finest octave out, for rays whose steps are too long to see it.
float fbm(vec3 p, float lod) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 4; i++) {
    s += (i == 3 ? a * lod : a) * vnoise(p);
    p = p * 2.03 + vec3(11.3, 7.1, 3.7);
    a *= 0.5;
  }
  return s;
}

// Density and colour of the disc at a point. The gas runs on Kepler orbits and
// the turbulence is read in a frame that turns with it, which shears the
// clouds into trailing spirals; two copies on staggered clocks keep the shear
// from winding tighter forever.
void gasAt(vec3 p, float rd, float dt, out float dens, out vec3 tint, out float heat) {
  float rn = clamp((rd - uDiskIn) / max(0.001, uDiskOut - uDiskIn), 0.0, 1.0);
  float tk = uThick * (0.35 + 1.25 * rn);
  float v = p.y / tk;
  float sheet = exp(-v * v);
  float lod = clamp(1.0 - dt * uGrain * 14.0, 0.0, 1.0);

  float phi = atan(p.z, p.x);
  float omega = uSpin * pow(uDiskIn / rd, 1.5);
  float lr = log(rd) * 1.1 + uSpin * uTime * 0.05;

  float u = uTime / WIND_CYCLE;
  float fA = fract(u);
  float fB = fract(u + 0.5);
  float w = abs(2.0 * fA - 1.0);

  float cloudsA = fbm(vec3(vec2(cos(phi + omega * fA * WIND_CYCLE),
                                sin(phi + omega * fA * WIND_CYCLE)) * (rd * uGrain), lr), lod);
  float cloudsB = fbm(vec3(vec2(cos(phi + omega * fB * WIND_CYCLE),
                                sin(phi + omega * fB * WIND_CYCLE)) * (rd * uGrain), lr + 40.0), lod);
  float clouds = mix(cloudsA, cloudsB, w);
  float filaments = clouds * clouds * 1.75;

  float inner = smoothstep(0.0, 0.07, rn);
  float outer = 1.0 - smoothstep(0.45, 1.0, rn);
  float prof = inner * outer * pow(uDiskIn / rd, 2.0);

  dens = max(0.0, filaments * 1.5 - 0.30) * sheet * prof * uDensity * 4.6;

  // Shakura-Sunyaev: T falls as r^-3/4. The colour ramp rides it.
  heat = pow(uDiskIn / rd, 0.8) * (0.72 + 0.55 * clouds);
  tint = mix(uCool, uMid, smoothstep(0.10, 0.52, heat));
  tint = mix(tint, uHot, smoothstep(0.52, 1.05, heat));
}

void main() {
  vec2 uv = (gl_FragCoord.xy + uJitter - uFocus * uRes) / uRes.y;
  vec3 dir = normalize(uFwd + (uv.x * uRight + uv.y * uUp) * 2.0 * uTanHalf);

  vec3 pos = uCamPos;
  vec3 vel = dir;

  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);
  float h = sqrt(h2);
  float swept = 0.0;

  vec3 col = vec3(0.0);
  float transmit = 1.0;

  float jitter = fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453);

  for (int i = 0; i < MAX_STEPS; i++) {
    if (float(i) >= uSteps) break;

    float r2 = dot(pos, pos);
    float r = sqrt(r2);

    if (r < 1.0) break;                               // through the horizon
    if (r > uSkyR && dot(pos, vel) > 0.0) break;      // gone, and not coming back
    if (transmit < 0.004) break;

    float dt = clamp(0.14 * (r - 1.0), 0.025, 1.1);

    // Never step more than half the way to the disc plane while the disc is in
    // reach, or a grazing ray tunnels clean through it.
    if (r < uDiskOut * 1.25) {
      float rn = clamp((r - uDiskIn) / max(0.001, uDiskOut - uDiskIn), 0.0, 1.0);
      float tk = uThick * (0.35 + 1.25 * rn);
      dt = min(dt, max(tk * 0.38, abs(pos.y) * 0.5));
    }

    swept += h * dt / r2;
    // Each extra lap of the hole costs the image its proper brightness.
    float deep = exp(-1.3 * max(0.0, swept - 4.6));

    jitter = fract(jitter + 0.6180339887);
    vec3 mid = pos + vel * (dt * jitter);
    float rd = length(mid.xz);

    if (rd > uDiskIn && rd < uDiskOut && abs(mid.y) < uThick * 5.0) {
      float dens;
      float heat;
      vec3 tint;
      gasAt(mid, rd, dt, dens, tint, heat);

      if (dens > 0.001) {
        // Beaming: flux goes as g^3, and uDoppler dials the exponent.
        vec3 tang = normalize(cross(vec3(0.0, 1.0, 0.0), vec3(mid.x, 0.0, mid.z)));
        float beta = min(0.85, sqrt(0.5 / max(rd, 1.5)));
        float gam = inversesqrt(max(1e-4, 1.0 - beta * beta));
        vec3 toObs = -normalize(vel);
        float g = 1.0 / (gam * (1.0 - beta * dot(tang, toObs)));
        g *= sqrt(max(0.05, 1.0 - 1.0 / rd));
        float boost = pow(max(g, 0.02), 3.0 * uDoppler);

        vec3 shift = mix(
          vec3(1.0),
          g > 1.0 ? vec3(0.86, 0.94, 1.14) : vec3(1.15, 0.82, 0.62),
          clamp(abs(g - 1.0) * 1.6, 0.0, 1.0) * uDoppler
        );

        float emit = uBright * (0.26 + 2.0 * heat * heat);
        col += tint * shift * (emit * boost * dens * transmit * dt * deep);
        transmit *= exp(-dens * 0.30 * dt);
      }
    }

    // u'' + u = 3M u^2, in Cartesian form.
    vec3 acc = -1.5 * h2 * pos / (r2 * r2 * r);
    vel += acc * dt;
    pos += vel * dt;
  }

  if (uEncode > 0.5) col = col / (1.0 + col);
  gl_FragColor = vec4(col, 1.0);
}
`;

// Folds the new frame into the running average; the camera holds still, so
// every frame lines up with the last.
const BLEND_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uCur;
uniform sampler2D uPrev;
uniform float uAlpha;
void main() {
  vec3 c = texture2D(uCur, vUv).rgb;
  vec3 p = texture2D(uPrev, vUv).rgb;
  gl_FragColor = vec4(mix(p, c, uAlpha), 1.0);
}
`;

const BRIGHT_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uDecode;
uniform float uPack;
uniform float uThreshold;
void main() {
  vec3 s = texture2D(uTex, vUv + uTexel * vec2(-1.0, -1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2( 1.0, -1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2(-1.0,  1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2( 1.0,  1.0)).rgb;
  s *= 0.25;
  if (uDecode > 0.5) s = s / max(vec3(0.002), 1.0 - s);
  float l = max(s.r, max(s.g, s.b));
  s *= max(0.0, l - uThreshold) / max(0.0001, l);
  gl_FragColor = vec4(s * uPack, 1.0);
}
`;

const BLUR_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uStep;
void main() {
  vec3 s = texture2D(uTex, vUv).rgb * 0.2270270;
  s += (texture2D(uTex, vUv + uStep * 1.3846154).rgb
      + texture2D(uTex, vUv - uStep * 1.3846154).rgb) * 0.3162162;
  s += (texture2D(uTex, vUv + uStep * 3.2307692).rgb
      + texture2D(uTex, vUv - uStep * 3.2307692).rgb) * 0.0702702;
  gl_FragColor = vec4(s, 1.0);
}
`;

// Tone map, then lay the picture over the page colour with a screen blend, so
// empty sky matches the page and the gas brightens it the way light would.
const COMPOSITE_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uDecode;
uniform float uPack;
uniform float uGlow;
uniform float uExposure;
uniform float uVignette;
uniform float uScrimDir;
uniform float uScrimAmt;
uniform float uSeed;
uniform vec3  uBg;

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec3 scene = texture2D(uScene, vUv).rgb;
  if (uDecode > 0.5) scene = scene / max(vec3(0.002), 1.0 - scene);
  vec3 bloom = texture2D(uBloom, vUv).rgb / uPack;

  vec3 c = scene + bloom * uGlow;
  c = aces(c * uExposure);
  c = pow(max(c, 0.0), vec3(0.4545));

  vec2 d = vUv - 0.5;
  c *= 1.0 - uVignette * dot(d, d) * 1.9;

  // The edge the copy sits on: heavy at the edge, off quickly.
  if (uScrimDir > 0.5) {
    float x = uScrimDir < 1.5 ? vUv.x
            : uScrimDir < 2.5 ? 1.0 - vUv.x
            : uScrimDir < 3.5 ? 1.0 - vUv.y
            : vUv.y;
    c *= 1.0 - uScrimAmt * pow(1.0 - clamp(x, 0.0, 1.0), 2.4);
  }

  c = 1.0 - (1.0 - c) * (1.0 - uBg);

  float n = fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) / 255.0;

  gl_FragColor = vec4(c, 1.0);
}
`;

const RAD = Math.PI / 180;

function hexToLinear(hex) {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h.slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
}

function hexToSrgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Sub-pixel aim points from the Halton 2,3 sequence: the running average has
// to cover the pixel evenly, not clump in one corner of it.
const HALTON = [
  [0.5, 0.333], [0.25, 0.667], [0.75, 0.111], [0.125, 0.444],
  [0.625, 0.778], [0.375, 0.222], [0.875, 0.556], [0.0625, 0.889],
];

const WIDE = {
  distance: 24,
  elevation: -5.5,
  roll: -20,
  fov: 42,
  focus: [0.74, 0.5],
  scrim: "left",
  glow: 1,
  steps: 240,
  resolution: 0.6,
};

// A phone has no room to stand the art beside the copy, so the hole drops to
// the bottom of the frame under the text and the field widens.
const NARROW = {
  distance: 24,
  elevation: -7,
  roll: -14,
  fov: 58,
  focus: [0.5, 0.8],
  scrim: "top",
  glow: 0.85,
  steps: 170,
  resolution: 0.5,
};

const DISC = {
  diskInner: 3,
  diskOuter: 15,
  diskThickness: 0.26,
  diskDensity: 1,
  brightness: 1.15,
  spinSpeed: 0.06,
  grain: 0.48,
  doppler: 0.35,
  hotColor: "#FFFFFF",
  midColor: "#FF7A33",
  coolColor: "#C2410C",
  exposure: 0.9,
  vignette: 0.28,
  scrimStrength: 0.92,
  maxDpr: 1.5,
  background: "#080808",
};

function mount(host, section) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  // Reduced motion leaves this running, as it does the walker: the gas turns
  // in place inside its own frame and nothing travels across the page.
  const narrowQuery = window.matchMedia("(max-width: 767px)");
  // Drops to a cheaper setting if the GPU cannot keep up (see tick).
  let lite = false;
  const settings = () => {
    const base = { ...DISC, ...(narrowQuery.matches ? NARROW : WIDE) };
    if (lite) {
      base.steps = Math.min(base.steps, 150);
      base.resolution = Math.min(base.resolution, 0.42);
      base.maxDpr = 1;
    }
    return base;
  };

  const opts = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  };
  const gl = canvas.getContext("webgl2", opts) || canvas.getContext("webgl", opts);

  // A dead canvas paints white or a broken-image mark over the page, which is
  // worse than nothing, so any failure takes it out and leaves the plain glow.
  function giveUp() {
    canvas.remove();
    const caption = section.querySelector("[data-hole-caption]");
    if (caption) caption.hidden = true;
    host.classList.remove("is-live");
    section.classList.remove("has-hole");
  }

  if (!gl) return giveUp();

  // Software renderers run this shader at seconds per frame; drop far down.
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const rendererName = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "") : "";
  const software = /swiftshader|llvmpipe|softpipe|software|microsoft basic/i.test(rendererName);
  const isGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;

  function compile(type, src) {
    const sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error("blackhole: shader failed —", gl.getShaderInfoLog(sh) || "no log (context lost?)");
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function link(fragSrc) {
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "aPos");
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return null;
    }
    const u = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) u[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program, u };
  }

  // Half floats keep the gas bright enough to bloom; without them the scene is
  // packed with Reinhard into 8 bits and unpacked on the way out.
  let hdr = true;
  let texType = gl.UNSIGNED_BYTE;
  let internal = gl.RGBA;
  if (isGL2) {
    if (gl.getExtension("EXT_color_buffer_half_float") || gl.getExtension("EXT_color_buffer_float")) {
      texType = gl.HALF_FLOAT;
      internal = gl.RGBA16F;
    } else hdr = false;
  } else {
    const hf = gl.getExtension("OES_texture_half_float");
    const cb = gl.getExtension("EXT_color_buffer_half_float");
    if (hf && cb) texType = hf.HALF_FLOAT_OES;
    else hdr = false;
  }
  if (!hdr) {
    texType = gl.UNSIGNED_BYTE;
    internal = gl.RGBA;
  }
  const linearOK = isGL2 || !!gl.getExtension("OES_texture_half_float_linear") || !hdr;
  const filter = linearOK ? gl.LINEAR : gl.NEAREST;
  const pack = hdr ? 1 : 0.12;

  function makeTarget(w, h) {
    const tex = gl.createTexture();
    const fb = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA, texType, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteTexture(tex);
      gl.deleteFramebuffer(fb);
      return null;
    }
    return { fb, tex, w, h };
  }

  let sceneProg, blendProg, brightProg, blurProg, compProg;
  let scene = null;
  let histA = null;
  let histB = null;
  let bloomA = null;
  let bloomB = null;
  let settled = 0;
  let width = 0;
  let height = 0;
  let sceneW = 0;
  let sceneH = 0;

  function build() {
    sceneProg = link(SCENE_FRAG);
    blendProg = link(BLEND_FRAG);
    brightProg = link(BRIGHT_FRAG);
    blurProg = link(BLUR_FRAG);
    compProg = link(COMPOSITE_FRAG);
    if (!sceneProg || !blendProg || !brightProg || !blurProg || !compProg) return false;
    // One triangle that covers the frame: no seam down the diagonal.
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    return true;
  }

  function dropTargets() {
    for (const t of [scene, histA, histB, bloomA, bloomB]) {
      if (!t) continue;
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fb);
    }
    scene = histA = histB = bloomA = bloomB = null;
    settled = 0;
  }

  function resize() {
    const C = settings();
    const rect = host.getBoundingClientRect();
    const dpr = software ? 1 : Math.min(window.devicePixelRatio || 1, C.maxDpr);
    const cssW = Math.max(1, Math.round(rect.width));
    const cssH = Math.max(1, Math.round(rect.height));
    const scale = software ? 0.34 : C.resolution;
    const w = Math.max(2, Math.round(cssW * dpr));
    const h = Math.max(2, Math.round(cssH * dpr));
    const sw = Math.max(2, Math.round(w * scale));
    const sh = Math.max(2, Math.round(h * scale));
    if (w === width && h === height && sw === sceneW && sh === sceneH) return;
    width = w;
    height = h;
    sceneW = sw;
    sceneH = sh;
    canvas.width = w;
    canvas.height = h;
    dropTargets();
    scene = makeTarget(sw, sh);
    histA = makeTarget(sw, sh);
    histB = makeTarget(sw, sh);
    bloomA = makeTarget(Math.max(2, sw >> 2), Math.max(2, sh >> 2));
    bloomB = makeTarget(Math.max(2, sw >> 2), Math.max(2, sh >> 2));
  }

  const pass = (prog, target) => {
    gl.useProgram(prog.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, target ? target.w : width, target ? target.h : height);
  };
  const draw = () => gl.drawArrays(gl.TRIANGLES, 0, 3);
  const bind = (tex, unit) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  };

  function render(t) {
    if (!scene || !histA || !histB || !bloomA || !bloomB) return;
    const C = settings();

    // Camera on an orbit about the hole, looking in, rolled about the line of
    // sight so the disc runs on a diagonal.
    const az = 0;
    const el = C.elevation * RAD;
    const dist = C.distance;
    const ce = Math.cos(el);
    const camX = dist * ce * Math.cos(az);
    const camY = dist * Math.sin(el);
    const camZ = dist * ce * Math.sin(az);
    const fx = -camX / dist;
    const fy = -camY / dist;
    const fz = -camZ / dist;
    let rx = fz;
    let ry = 0;
    let rz = -fx;
    const rl = Math.hypot(rx, ry, rz) || 1;
    rx /= rl;
    ry /= rl;
    rz /= rl;
    const ux = ry * fz - rz * fy;
    const uy = rz * fx - rx * fz;
    const uz = rx * fy - ry * fx;
    const cr = Math.cos(C.roll * RAD);
    const sr = Math.sin(C.roll * RAD);

    const hot = hexToLinear(C.hotColor);
    const mid = hexToLinear(C.midColor);
    const cool = hexToLinear(C.coolColor);

    pass(sceneProg, scene);
    const u = sceneProg.u;
    gl.uniform2f(u.uRes, scene.w, scene.h);
    gl.uniform1f(u.uTime, t);
    gl.uniform3f(u.uCamPos, camX, camY, camZ);
    gl.uniform3f(u.uRight, rx * cr + ux * sr, ry * cr + uy * sr, rz * cr + uz * sr);
    gl.uniform3f(u.uUp, -rx * sr + ux * cr, -ry * sr + uy * cr, -rz * sr + uz * cr);
    gl.uniform3f(u.uFwd, fx, fy, fz);
    gl.uniform1f(u.uTanHalf, Math.tan(C.fov * 0.5 * RAD));
    gl.uniform2f(u.uFocus, C.focus[0], 1 - C.focus[1]);
    gl.uniform1f(u.uSteps, software ? 130 : C.steps);
    gl.uniform1f(u.uSkyR, Math.max(dist * 1.35, C.diskOuter * 2.4));
    gl.uniform1f(u.uDiskIn, C.diskInner);
    gl.uniform1f(u.uDiskOut, C.diskOuter);
    gl.uniform1f(u.uThick, C.diskThickness);
    gl.uniform1f(u.uDensity, C.diskDensity);
    gl.uniform1f(u.uSpin, C.spinSpeed * 6.2831853);
    gl.uniform1f(u.uGrain, C.grain);
    gl.uniform1f(u.uBright, C.brightness);
    gl.uniform1f(u.uDoppler, C.doppler);
    gl.uniform3f(u.uHot, hot[0], hot[1], hot[2]);
    gl.uniform3f(u.uMid, mid[0], mid[1], mid[2]);
    gl.uniform3f(u.uCool, cool[0], cool[1], cool[2]);
    gl.uniform1f(u.uEncode, hdr ? 0 : 1);
    const jit = HALTON[settled % HALTON.length];
    gl.uniform2f(u.uJitter, jit[0] - 0.5, jit[1] - 0.5);
    gl.uniform1f(u.uSeed, (settled % 64) * 17.13);
    draw();

    // Enough history to bury the noise, not so much the gas drags a tail.
    pass(blendProg, histB);
    bind(scene.tex, 0);
    bind(histA.tex, 1);
    gl.uniform1i(blendProg.u.uCur, 0);
    gl.uniform1i(blendProg.u.uPrev, 1);
    gl.uniform1f(blendProg.u.uAlpha, settled === 0 ? 1 : 0.14);
    draw();
    const shown = histB;
    histB = histA;
    histA = shown;
    settled++;

    pass(brightProg, bloomA);
    bind(shown.tex, 0);
    gl.uniform1i(brightProg.u.uTex, 0);
    gl.uniform2f(brightProg.u.uTexel, 1 / shown.w, 1 / shown.h);
    gl.uniform1f(brightProg.u.uDecode, hdr ? 0 : 1);
    gl.uniform1f(brightProg.u.uPack, pack);
    gl.uniform1f(brightProg.u.uThreshold, 0.85);
    draw();

    const blurStep = (src, dst, dx, dy) => {
      pass(blurProg, dst);
      bind(src.tex, 0);
      gl.uniform1i(blurProg.u.uTex, 0);
      gl.uniform2f(blurProg.u.uStep, dx / dst.w, dy / dst.h);
      draw();
    };
    blurStep(bloomA, bloomB, 1, 0);
    blurStep(bloomB, bloomA, 0, 1);
    blurStep(bloomA, bloomB, 2.6, 0);
    blurStep(bloomB, bloomA, 0, 2.6);

    pass(compProg, null);
    bind(shown.tex, 0);
    bind(bloomA.tex, 1);
    const cu = compProg.u;
    gl.uniform1i(cu.uScene, 0);
    gl.uniform1i(cu.uBloom, 1);
    gl.uniform1f(cu.uDecode, hdr ? 0 : 1);
    gl.uniform1f(cu.uPack, pack);
    gl.uniform1f(cu.uGlow, C.glow * 0.26);
    gl.uniform1f(cu.uExposure, C.exposure);
    gl.uniform1f(cu.uVignette, C.vignette);
    gl.uniform1f(cu.uScrimDir, C.scrim === "left" ? 1 : C.scrim === "right" ? 2 : C.scrim === "top" ? 3 : 4);
    gl.uniform1f(cu.uScrimAmt, C.scrimStrength);
    gl.uniform1f(cu.uSeed, (t * 60) % 1000);
    const bg = hexToSrgb(C.background);
    gl.uniform3f(cu.uBg, bg[0], bg[1], bg[2]);
    draw();
  }

  // A still, done properly: the frames the average would gather over time are
  // taken at once, each aimed at a different point in the pixel.
  const settle = (passes) => {
    for (let i = 0; i < passes; i++) render(clock);
  };

  let clock = 0;
  let lastFrame = 0;
  let running = true;
  let visible = true;
  let raf = 0;
  const frameTimes = [];

  // Fig. 3's readout: the simulation clock, and how fast the gas at the
  // inner edge of the disc is moving (sqrt(M/r) with M = 1/2, as a fraction
  // of c), which is what throws the near side brighter.
  const readout = section.querySelector("[data-hole-readout]");
  const rimSpeed = Math.sqrt(0.5 / DISC.diskInner).toFixed(2).replace(/^0/, "");
  let lastReadout = -1;
  const updateReadout = () => {
    if (!readout || Math.abs(clock - lastReadout) < 0.1) return;
    lastReadout = clock;
    readout.innerHTML = `r<sub>in</sub> ${DISC.diskInner} r<sub>s</sub> · rim ${rimSpeed}c · t ${clock.toFixed(1)} s`;
  };

  function tick(now) {
    raf = 0;
    if (!running || !visible) return;
    raf = requestAnimationFrame(tick);
    const raw = lastFrame ? (now - lastFrame) / 1000 : 0;
    const dt = Math.min(0.05, raw);
    lastFrame = now;
    // Watch the first second or so of frames; a slow median means a weak GPU.
    if (!lite && raw > 0 && frameTimes.length < 60) {
      frameTimes.push(raw);
      if (frameTimes.length === 60) {
        const median = [...frameTimes].sort((a, b) => a - b)[30];
        if (median > 0.03) {
          lite = true;
          resize();
        }
      }
    }
    clock += dt;
    render(clock);
    updateReadout();
  }

  const wake = () => {
    if (running && visible && !raf) {
      lastFrame = 0;
      raf = requestAnimationFrame(tick);
    }
  };

  if (!build()) return giveUp();
  resize();
  settle(1);
  section.classList.add("has-hole");
  const caption = section.querySelector("[data-hole-caption]");
  if (caption) caption.hidden = false;
  updateReadout();
  requestAnimationFrame(() => host.classList.add("is-live"));
  wake();

  // Resizing reallocates the canvas, which clears it; draw straight away so
  // the section never blinks empty while the window is being dragged.
  new ResizeObserver(() => {
    resize();
    render(clock);
  }).observe(host);

  // Only spend the GPU while the section is on screen.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && !document.hidden;
    wake();
  }).observe(host);

  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    wake();
  });

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    canvas.style.display = "none";
  });

  canvas.addEventListener("webglcontextrestored", () => {
    width = height = sceneW = sceneH = 0;
    if (!build()) return giveUp();
    canvas.style.display = "";
    resize();
    running = true;
    settle(1);
    wake();
  });
}

// Wait until the section is close before compiling anything: nobody at the
// top of the page should pay for the bottom of it.
document.querySelectorAll("[data-blackhole]").forEach((host) => {
  const section = host.closest("section") || host.parentElement;
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      mount(host, section);
    },
    { rootMargin: "400px 0px" },
  );
  io.observe(host);
});
