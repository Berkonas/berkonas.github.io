// 01 · Rotation converter. One quaternion is the source of truth; every
// representation is rendered from it, and editing any of them writes back.
import {
  qNormalize,
  qMul,
  qConj,
  qFromAxisAngle,
  qToAxisAngle,
  qToMatrix,
  qFromMatrix,
  det3,
  orthoError,
  nearestRotation,
  eulerToQuat,
  quatToEuler,
  matVec,
  qRandom,
} from "./rotmath.js?v=20260929b";
import { segmented, parseNumber, fmt, copyText, palette, fitCanvas } from "./ui.js?v=20260929b";

const DEG = Math.PI / 180;
const PRIME = ["", "′", "″"];

export function init(root) {
  const $ = (sel) => root.querySelector(sel);
  const state = { q: [1, 0, 0, 0], az: 40 * DEG, el: 22 * DEG, digits: 6, format: "numpy" };
  // Three fields to a row leave room for about seven characters on a phone.
  if (window.matchMedia("(max-width: 520px)").matches) {
    state.digits = 4;
    $("#rot-precision").value = "4";
  }

  // --- Fields ----------------------------------------------------------------
  function makeRow(container, labels, rep) {
    container.innerHTML = "";
    return labels.map((label, i) => {
      const cell = document.createElement("label");
      cell.className = "num";
      const tag = document.createElement("span");
      tag.innerHTML = label;
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.dataset.rep = rep;
      input.dataset.index = i;
      cell.append(tag, input);
      container.appendChild(cell);
      return input;
    });
  }

  const qOrder = segmented($(".rep[data-rep='quat']"), "qorder", () => {
    buildQuat();
    render();
  });
  const eulerKind = segmented($(".rep[data-rep='euler'] .rep-options"), "euler-kind", () => {
    buildEuler();
    render();
  });
  const unit = segmented($(".rep[data-rep='euler'] .rep-options"), "unit", () => {
    buildEuler();
    buildAxis();
    render();
  });
  const seqSel = $("#rot-seq");
  seqSel.addEventListener("change", () => {
    buildEuler();
    render();
  });

  let quatInputs;
  let matInputs;
  let eulerInputs;
  let axisInputs;
  let rotvecInputs;

  function buildQuat() {
    const labels = qOrder.get() === "wxyz" ? ["w", "x", "y", "z"] : ["x", "y", "z", "w"];
    quatInputs = makeRow($("#rot-quat"), labels, "quat");
    $("#rot-quat-note").textContent =
      qOrder.get() === "wxyz"
        ? "Scalar first, as in MATLAB and Eigen’s constructor. ROS and SciPy put w last."
        : "Scalar last, as in ROS, SciPy and Eigen’s coeffs(). MATLAB puts w first.";
  }
  function buildMatrix() {
    const labels = [];
    for (let r = 1; r <= 3; r++) for (let c = 1; c <= 3; c++) labels.push(`r<sub>${r}${c}</sub>`);
    matInputs = makeRow($("#rot-matrix"), labels, "matrix");
  }
  function buildEuler() {
    const seq = seqSel.value;
    const ex = eulerKind.get() === "extrinsic";
    const greek = ["α", "β", "γ"];
    const labels = seq.split("").map((axis, i) => `${greek[i]} <em>${ex ? axis : axis + PRIME[i]}</em>`);
    eulerInputs = makeRow($("#rot-euler"), labels, "euler");
  }
  function buildAxis() {
    axisInputs = makeRow($("#rot-axis"), ["axis x", "axis y", "axis z", `θ <em>${unit.get()}</em>`], "axis");
    rotvecInputs = makeRow($("#rot-rotvec"), ["x", "y", "z"], "rotvec");
  }
  buildQuat();
  buildMatrix();
  buildEuler();
  buildAxis();

  // --- Rendering ---------------------------------------------------------------
  const toUnit = (rad) => (unit.get() === "deg" ? rad / DEG : rad);
  const fromUnit = (v) => (unit.get() === "deg" ? v * DEG : v);
  const setVals = (inputs, vals, skip) => {
    if (skip) return;
    inputs.forEach((input, i) => {
      if (document.activeElement === input && input.dataset.dirty) return;
      input.value = fmt(vals[i], state.digits);
      input.removeAttribute("aria-invalid");
    });
  };
  const note = (sel, text, kind) => {
    const el = $(sel);
    el.textContent = text;
    el.dataset.kind = kind || "";
  };

  function values() {
    const q = state.q;
    const R = qToMatrix(q);
    const eul = quatToEuler(seqSel.value, q, eulerKind.get() === "extrinsic");
    const aa = qToAxisAngle(q);
    return { q, R, eul, aa };
  }

  // except: skip re-filling that row (it's being typed in). keep: leave its note.
  function render(except, keep = except) {
    const { q, R, eul, aa } = values();
    const qv = qOrder.get() === "wxyz" ? q : [q[1], q[2], q[3], q[0]];
    setVals(quatInputs, qv, except === "quat");
    setVals(matInputs, R.flat(), except === "matrix");
    setVals(eulerInputs, eul.angles.map(toUnit), except === "euler");
    setVals(axisInputs, [...aa.axis, toUnit(aa.angle)], except === "axis");
    setVals(rotvecInputs, aa.axis.map((v) => v * aa.angle), except === "rotvec");
    if (eul.gimbal) {
      const beta = `${fmt(eul.angles[1] / DEG, 0)}°`;
      const zeroed = eulerKind.get() === "extrinsic" ? "α" : "γ";
      note("#rot-euler-note", `Gimbal lock: with β = ${beta} the outer angles only matter in combination, so ${zeroed} is set to 0.`, "warn");
    } else {
      note("#rot-euler-note", eulerHint(), "");
    }
    if (keep !== "matrix") note("#rot-matrix-note", "Columns are the rotated frame’s axes, written in world coordinates.", "");
    const deg = aa.angle / DEG;
    $("#rot-readout").textContent =
      aa.angle < 1e-9 ? "Identity: no rotation" : `θ = ${fmt(deg, 2)}° about [${aa.axis.map((v) => fmt(v, 3)).join(", ")}]`;
    draw();
  }

  function eulerHint() {
    const seq = seqSel.value;
    const ex = eulerKind.get() === "extrinsic";
    const axes = seq.split("");
    const steps = ex
      ? `about fixed ${axes[0]}, then fixed ${axes[1]}, then fixed ${axes[2]}`
      : `about ${axes[0]}, then the new ${axes[1]}′, then the newer ${axes[2]}″`;
    const alias = !ex && seq === "ZYX" ? " (yaw, pitch, roll)" : ex && seq === "XYZ" ? " (roll, pitch, yaw about fixed axes)" : "";
    return `Rotate ${steps}${alias}.`;
  }

  // --- Editing -----------------------------------------------------------------
  function readRow(inputs) {
    const vals = inputs.map((input) => parseNumber(input.value));
    inputs.forEach((input, i) => {
      if (Number.isFinite(vals[i])) input.removeAttribute("aria-invalid");
      else input.setAttribute("aria-invalid", "true");
    });
    return vals.every(Number.isFinite) ? vals : null;
  }

  function onEdit(rep) {
    if (rep === "quat") {
      const v = readRow(quatInputs);
      if (!v) return;
      const q = qOrder.get() === "wxyz" ? v : [v[3], v[0], v[1], v[2]];
      const n = Math.hypot(...q);
      if (n < 1e-9) {
        note("#rot-quat-note", "A zero quaternion isn’t a rotation.", "error");
        return;
      }
      note("#rot-quat-note", Math.abs(n - 1) > 1e-6 ? `Normalized from |q| = ${fmt(n, 4)}.` : "Unit quaternion.", Math.abs(n - 1) > 1e-6 ? "warn" : "");
      state.q = qNormalize(q);
    } else if (rep === "matrix") {
      const v = readRow(matInputs);
      if (!v) return;
      let M = [v.slice(0, 3), v.slice(3, 6), v.slice(6, 9)];
      const d = det3(M);
      if (d <= 1e-9) {
        note("#rot-matrix-note", d < 0 ? `det = ${fmt(d, 4)}: that’s a reflection, not a rotation.` : "This matrix is singular.", "error");
        return;
      }
      const err = orthoError(M);
      if (err > 1e-6) {
        M = nearestRotation(M);
        note("#rot-matrix-note", `Not orthonormal (error ${err.toExponential(1)}); snapped to the nearest rotation.`, "warn");
      } else {
        note("#rot-matrix-note", `Orthonormal, det = ${fmt(d, 6)}.`, "");
      }
      state.q = qFromMatrix(M);
    } else if (rep === "euler") {
      const v = readRow(eulerInputs);
      if (!v) return;
      state.q = eulerToQuat(seqSel.value, v.map(fromUnit), eulerKind.get() === "extrinsic");
    } else if (rep === "axis") {
      const v = readRow(axisInputs);
      if (!v) return;
      if (Math.hypot(v[0], v[1], v[2]) < 1e-12) return;
      state.q = qFromAxisAngle(v.slice(0, 3), fromUnit(v[3]));
    } else if (rep === "rotvec") {
      const v = readRow(rotvecInputs);
      if (!v) return;
      const angle = Math.hypot(...v);
      state.q = angle < 1e-12 ? [1, 0, 0, 0] : qFromAxisAngle(v, angle);
    }
    render(rep);
  }

  root.addEventListener("input", (e) => {
    const input = e.target.closest("input[data-rep]");
    if (!input) return;
    input.dataset.dirty = "1";
    onEdit(input.dataset.rep);
  });
  root.addEventListener("focusout", (e) => {
    const input = e.target.closest("input[data-rep]");
    if (!input || !input.dataset.dirty) return;
    delete input.dataset.dirty;
    // Leaving a field tidies its whole row into canonical form.
    render(null, input.dataset.rep);
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("input[data-rep]")) e.target.blur();
  });

  $("#rot-precision").addEventListener("change", (e) => {
    state.digits = Number(e.target.value);
    render();
  });
  $("#rot-format").addEventListener("change", (e) => {
    state.format = e.target.value;
  });
  state.format = $("#rot-format").value;

  root.querySelectorAll("[data-rot-preset]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const p = btn.dataset.rotPreset;
      const quarter = (axis) => qMul(qFromAxisAngle(axis, Math.PI / 2), state.q);
      if (p === "identity") state.q = [1, 0, 0, 0];
      if (p === "x90") state.q = quarter([1, 0, 0]);
      if (p === "y90") state.q = quarter([0, 1, 0]);
      if (p === "z90") state.q = quarter([0, 0, 1]);
      if (p === "random") state.q = qRandom();
      if (p === "inverse") state.q = qConj(state.q);
      state.q = qNormalize(state.q);
      render();
    })
  );

  // --- Copy --------------------------------------------------------------------
  function copyRep(rep) {
    const d = state.digits;
    const f = state.format;
    const { q, R, eul, aa } = values();
    const n = (v) => fmt(v, d);
    const list = (arr, sep = ", ") => arr.map(n).join(sep);
    const u = unit.get();
    const kind = eulerKind.get();
    const seq = seqSel.value;
    let text = "";
    if (rep === "quat") {
      const wxyz = qOrder.get() === "wxyz";
      const v = wxyz ? q : [q[1], q[2], q[3], q[0]];
      const order = wxyz ? "w, x, y, z" : "x, y, z, w";
      if (f === "numpy") text = `q = np.array([${list(v)}])  # ${order}`;
      else if (f === "matlab") text = wxyz ? `q = quaternion(${list(q)});` : `q = [${list(v, " ")}]; % ${order}`;
      else if (f === "latex") text = `q = ${n(q[0])} + ${n(q[1])}\\,i + ${n(q[2])}\\,j + ${n(q[3])}\\,k`;
      else text = list(v);
    } else if (rep === "matrix") {
      if (f === "numpy") text = `R = np.array([\n    [${list(R[0])}],\n    [${list(R[1])}],\n    [${list(R[2])}],\n])`;
      else if (f === "matlab") text = `R = [${R.map((r) => list(r, " ")).join("; ")}];`;
      else if (f === "latex") text = `R = \\begin{bmatrix} ${R.map((r) => list(r, " & ")).join(" \\\\ ")} \\end{bmatrix}`;
      else text = R.map((r) => list(r, "\t")).join("\n");
    } else if (rep === "euler") {
      const a = eul.angles.map((v) => (u === "deg" ? v / DEG : v));
      const label = `${kind} ${seq}, ${u}`;
      if (f === "numpy") text = `euler = np.array([${list(a)}])  # ${label}`;
      else if (f === "matlab") text = `eul = [${list(a, " ")}]; % ${label}`;
      else if (f === "latex") text = `(\\alpha, \\beta, \\gamma) = (${list(a)})${u === "deg" ? "^\\circ" : ""}`;
      else text = list(a);
    } else if (rep === "axis") {
      const ang = u === "deg" ? aa.angle / DEG : aa.angle;
      if (f === "numpy") text = `axis = np.array([${list(aa.axis)}])\nangle = ${n(ang)}  # ${u}`;
      else if (f === "matlab") text = `axang = [${list(aa.axis, " ")} ${n(aa.angle)}]; % angle in rad`;
      else if (f === "latex") text = `\\hat{n} = (${list(aa.axis)}),\\ \\theta = ${n(ang)}${u === "deg" ? "^\\circ" : ""}`;
      else text = `${list(aa.axis)}, ${n(ang)}`;
    }
    copyText(text, "Copied");
  }
  root.querySelectorAll("[data-copy-rep]").forEach((btn) => btn.addEventListener("click", () => copyRep(btn.dataset.copyRep)));

  // --- 3D view -----------------------------------------------------------------
  const canvas = $("#rot-canvas");
  const view = fitCanvas(canvas, () => draw());
  const pal = palette();
  const AXIS_COLORS = ["239, 107, 107", "92, 193, 154", pal.blue];
  const dragMode = segmented($(".viewport-tools"), "drag");

  function camera() {
    const ca = Math.cos(state.az);
    const sa = Math.sin(state.az);
    const ce = Math.cos(state.el);
    const se = Math.sin(state.el);
    return {
      r: [-sa, ca, 0],
      u: [-se * ca, -se * sa, ce],
      f: [ce * ca, ce * sa, se],
    };
  }
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  function draw() {
    const { ctx, w, h } = view;
    ctx.clearRect(0, 0, w, h);
    const cam = camera();
    const S = Math.min(w, h) * 0.27;
    const D = 7;
    const P = (p) => {
      const depth = dot(p, cam.f);
      const k = (S * D) / (D - depth);
      return { x: w / 2 + dot(p, cam.r) * k, y: h / 2 - dot(p, cam.u) * k, depth };
    };
    const line = (a, b, color, width = 1, dash = null) => {
      const pa = P(a);
      const pb = P(b);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash || []);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    const label = (p, text, color, font = "500 12px 'IBM Plex Mono', monospace") => {
      const q = P(p);
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, q.x, q.y);
    };

    // World: a unit circle on the XY plane and dashed axes.
    ctx.strokeStyle = `rgba(${pal.blue}, 0.22)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      const p = P([Math.cos(t) * 1.3, Math.sin(t) * 1.3, 0]);
      if (i) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
    }
    ctx.stroke();
    ["X", "Y", "Z"].forEach((name, i) => {
      const e = [0, 0, 0];
      e[i] = 1.55;
      line([0, 0, 0], e, `rgba(${pal.ink}, 0.32)`, 1, [4, 4]);
      const t = e.map((v) => v * 1.1);
      label(t, name, `rgba(${pal.ink}, 0.5)`);
    });

    const R = qToMatrix(state.q);
    const aa = qToAxisAngle(state.q);

    // Rotation axis in gold, with an arc for the angle.
    if (aa.angle > 1e-6) {
      const ax = aa.axis;
      line(ax.map((v) => -v * 1.7), ax.map((v) => v * 1.7), `rgba(${pal.gold}, 0.75)`, 1.2, [6, 5]);
      const ref = Math.abs(ax[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
      let e1 = [ax[1] * ref[2] - ax[2] * ref[1], ax[2] * ref[0] - ax[0] * ref[2], ax[0] * ref[1] - ax[1] * ref[0]];
      const n1 = Math.hypot(...e1);
      e1 = e1.map((v) => v / n1);
      const e2 = [ax[1] * e1[2] - ax[2] * e1[1], ax[2] * e1[0] - ax[0] * e1[2], ax[0] * e1[1] - ax[1] * e1[0]];
      const c = ax.map((v) => v * 1.45);
      const rr = 0.26;
      ctx.strokeStyle = `rgba(${pal.gold}, 0.95)`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const steps = 40;
      let last = null;
      let prev = null;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * aa.angle;
        const p = P([0, 1, 2].map((k) => c[k] + rr * (Math.cos(t) * e1[k] + Math.sin(t) * e2[k])));
        if (i) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
        prev = last;
        last = p;
      }
      ctx.stroke();
      if (prev && last) arrowHead(ctx, prev, last, `rgba(${pal.gold}, 0.95)`, 7);
    }

    // Body axes: arrows pointing away from the viewer are drawn behind the board.
    const axes = [0, 1, 2].map((i) => {
      const dir = [R[0][i], R[1][i], R[2][i]];
      return { i, dir, depth: dot(dir, cam.f) };
    });
    const drawAxis = ({ i, dir }) => {
      const tip = dir.map((v) => v * 1.3);
      const a = P([0, 0, 0]);
      const b = P(tip);
      ctx.strokeStyle = `rgb(${AXIS_COLORS[i]})`;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      arrowHead(ctx, a, b, `rgb(${AXIS_COLORS[i]})`, 10);
      label(dir.map((v) => v * 1.52), ["x′", "y′", "z′"][i], `rgb(${AXIS_COLORS[i]})`, "600 13px 'IBM Plex Mono', monospace");
    };
    axes.filter((a) => a.depth < 0).forEach(drawAxis);
    drawBoard(R, P, cam);
    axes.filter((a) => a.depth >= 0).forEach(drawAxis);
  }

  // A thin board, like an IMU breakout, so orientation reads at a glance.
  const HALF = [0.62, 0.42, 0.07];
  function drawBoard(R, P, cam) {
    const { ctx } = view;
    const corner = (sx, sy, sz) => matVec(R, [sx * HALF[0], sy * HALF[1], sz * HALF[2]]);
    const faces = [
      { n: [0, 0, 1], pts: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], top: true },
      { n: [0, 0, -1], pts: [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]] },
      { n: [1, 0, 0], pts: [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]] },
      { n: [-1, 0, 0], pts: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
      { n: [0, 1, 0], pts: [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]] },
      { n: [0, -1, 0], pts: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
    ];
    const light = [0.35, 0.25, 0.9];
    faces.forEach((face) => {
      const nw = matVec(R, face.n);
      if (dot(nw, cam.f) <= 0) return;
      const shade = 0.35 + 0.65 * Math.max(0, dot(nw, light) / Math.hypot(...light));
      const pts = face.pts.map((p) => P(corner(...p)));
      ctx.beginPath();
      pts.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = face.top ? `rgba(23, 48, 79, ${0.78 + 0.2 * shade})` : `rgba(15, 33, 58, ${0.85})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${pal.ink}, ${0.25 + 0.35 * shade})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (face.top) {
        // Silkscreen: a pin-1 dot and an arrow along x′.
        const c = P(corner(0.72, 0.66, 1));
        ctx.fillStyle = `rgba(${pal.gold}, 0.9)`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
        ctx.fill();
        const a0 = P(corner(-0.4, 0, 1));
        const a1 = P(corner(0.4, 0, 1));
        ctx.strokeStyle = `rgba(${pal.ink}, 0.55)`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(a0.x, a0.y);
        ctx.lineTo(a1.x, a1.y);
        ctx.stroke();
        arrowHead(ctx, a0, a1, `rgba(${pal.ink}, 0.55)`, 6);
      }
    });
  }

  function arrowHead(ctx, from, to, color, size) {
    const ang = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - size * Math.cos(ang - 0.42), to.y - size * Math.sin(ang - 0.42));
    ctx.lineTo(to.x - size * Math.cos(ang + 0.42), to.y - size * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();
  }

  // Drag: turn the frame about the screen axes, or orbit the camera.
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("is-dragging");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag = { x: e.clientX, y: e.clientY };
    if (dragMode.get() === "orbit") {
      state.az -= dx * 0.008;
      state.el = Math.max(-80 * DEG, Math.min(80 * DEG, state.el + dy * 0.008));
      draw();
      return;
    }
    const cam = camera();
    const axis = [0, 1, 2].map((k) => cam.u[k] * dx + cam.r[k] * dy);
    const angle = Math.hypot(dx, dy) * 0.009;
    if (angle < 1e-6) return;
    state.q = qNormalize(qMul(qFromAxisAngle(axis, angle), state.q));
    render();
  });
  const endDrag = () => {
    drag = null;
    canvas.classList.remove("is-dragging");
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // Start somewhere more telling than the identity.
  state.q = eulerToQuat("ZYX", [30 * DEG, 20 * DEG, 10 * DEG], false);
  render();

  return { show: () => draw() };
}
