"use strict";

// Bionic Playground: three canvas simulations (myoelectric hand, gait lab,
// inverse-kinematics arm). Plain 2D canvas, no dependencies. Only the visible
// lab animates, and nothing runs while the page is hidden or scrolled away.
(() => {
  const byId = (id) => document.getElementById(id);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const rad = (deg) => (deg * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;
  const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const smooth = (dt, tau) => 1 - Math.exp(-dt / tau);

  const C = {
    grid: "rgba(140, 180, 240, 0.09)",
    gridStrong: "rgba(140, 180, 240, 0.18)",
    text: "#cfe0f7",
    dim: "rgba(207, 224, 247, 0.55)",
    cyan: "#5cc8ff",
    blue: "#4a7bd1",
    green: "#3ddc97",
    amber: "#ffb547",
    red: "#ff5d6c",
    orange: "#ff8a4c",
    metal: "#c9d6e8",
    carbon: "#1b2740",
  };
  const FONT = '"Manrope", "Helvetica Neue", Arial, sans-serif';

  const store = {
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

  let spareGauss = null;
  function gauss() {
    if (spareGauss !== null) {
      const v = spareGauss;
      spareGauss = null;
      return v;
    }
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const m = Math.sqrt(-2 * Math.log(u));
    spareGauss = m * Math.sin(2 * Math.PI * v);
    return m * Math.cos(2 * Math.PI * v);
  }

  function surface(canvas) {
    const ctx = canvas.getContext("2d");
    const s = { canvas, ctx, w: 0, h: 0 };
    s.resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      if (w === s.w && h === s.h && dpr === s.dpr) return false;
      s.w = w;
      s.h = h;
      s.dpr = dpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };
    s.clear = () => {
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      ctx.clearRect(0, 0, s.w, s.h);
    };
    return s;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawGrid(ctx, w, h, step) {
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = (w % step) / 2; x < w; x += step) {
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, h);
    }
    for (let y = (h % step) / 2; y < h; y += step) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(w, Math.round(y) + 0.5);
    }
    ctx.stroke();
  }

  function label(ctx, text, x, y, opts = {}) {
    ctx.font = `${opts.weight || 600} ${opts.size || 12}px ${FONT}`;
    ctx.fillStyle = opts.color || C.text;
    ctx.textAlign = opts.align || "left";
    ctx.textBaseline = opts.baseline || "alphabetic";
    ctx.fillText(text, x, y);
  }

  function setSeg(buttons, active) {
    buttons.forEach((b) => b.setAttribute("aria-checked", b === active ? "true" : "false"));
  }

  function makeStatus(el) {
    let current = "";
    return (text, tone = "") => {
      const key = text + "|" + tone;
      if (key === current) return;
      current = key;
      el.textContent = text;
      el.classList.toggle("good", tone === "good");
      el.classList.toggle("bad", tone === "bad");
    };
  }

  // ---------------------------------------------------------------------------
  // 01 · Myo Hand
  // ---------------------------------------------------------------------------
  function createMyo() {
    const surf = surface(byId("myo-canvas"));
    const pad = byId("flex-pad");
    const padFill = byId("flex-pad-fill");
    const feedbackEl = byId("myo-feedback");
    const windowEl = byId("myo-window");
    const thrEl = byId("myo-thr");
    const setStatus = makeStatus(byId("myo-status"));

    const OBJECTS = [
      { name: "Tennis ball", kind: "ball", r: 31, hh: 31, min: 5, max: 30, color: "#d4ec3a" },
      { name: "Soda can", kind: "can", r: 30, hh: 40, min: 8, max: 18, color: "#e0413c" },
      { name: "Tomato", kind: "tomato", r: 32, hh: 29, min: 4, max: 11, color: "#ff5a3c" },
      { name: "Paper cup", kind: "cup", r: 30, hh: 38, min: 2.5, max: 7, color: "#f2ede4" },
      { name: "Raw egg", kind: "egg", r: 25, hh: 33, min: 3, max: 8, color: "#f5e6cc" },
      { name: "Strawberry", kind: "berry", r: 24, hh: 26, min: 1.5, max: 5, color: "#e8344a" },
    ];
    const FMAX = 40;
    const HOLD = 1.8;
    const SAMPLE_RATE = 1000;
    const SCOPE_SAMPLES = 2500;
    const FINGER = [34, 27, 21];
    const GAIN = 2; // fingers close fully at 50% effort; the rest becomes grip force

    const raw = new Float32Array(SCOPE_SAMPLES);
    const envTrace = new Float32Array(SCOPE_SAMPLES);
    const sq = new Float32Array(400);
    let head = 0;
    let sqHead = 0;
    let sqSum = 0;
    let sampleCarry = 0;
    let samplesSinceExact = 0;

    let win = Number(windowEl.value);
    let thr = Number(thrEl.value) / 100;
    let feedback = feedbackEl.checked;

    let padActive = false;
    let padU = 0;
    let keyHeld = false;
    let keyU = 0;
    let u = 0;
    let act = 0;
    let env = 0;
    let cmd = 0;
    let effort = 0;
    let q = 0;
    let force = 0;
    let contact = false;

    let objIndex = 0;
    let obj = OBJECTS[0];
    let qc = 1;
    let phase = "grip";
    let phaseT = 0;
    let lift = 0;
    let hold = 0;
    let over = 0;
    let dropY = 0;
    let dropV = 0;
    let particles = [];
    let splat = 0;
    let buzzT = 0;
    let interacted = false;
    let banner = null;

    let score = 0;
    let streak = 0;
    let best = Number(store.get("bionic.myo.best", 0)) || 0;

    // Finger chain for the right-hand finger; the thumb mirrors it.
    function fingerPoints(qq, baseX, baseY, side) {
      const a1 = Math.PI / 2 - 0.5 + 1.05 * qq;
      const angles = [a1, a1 + 0.75 * qq, a1 + 1.35 * qq];
      const pts = [{ x: baseX, y: baseY }];
      let x = baseX;
      let y = baseY;
      for (let i = 0; i < 3; i++) {
        x += side * FINGER[i] * Math.cos(angles[i]);
        y += FINGER[i] * Math.sin(angles[i]);
        pts.push({ x, y });
      }
      return pts;
    }

    function geometry(o) {
      const palmBottom = -2 * o.hh - 8;
      return { palmBottom, baseX: o.r + 12, cy: -o.hh };
    }

    function findContact(o) {
      const g = geometry(o);
      const rx = o.r + 7;
      const ry = o.hh + 7;
      for (let qq = 0; qq <= 1; qq += 0.004) {
        const pts = fingerPoints(qq, g.baseX, g.palmBottom, 1);
        for (let i = 1; i < pts.length; i++) {
          for (let k = 0; k <= 4; k++) {
            const t = k / 4;
            const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t;
            const y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t;
            const nx = x / rx;
            const ny = (y - g.cy) / ry;
            if (nx * nx + ny * ny <= 1) return qq;
          }
        }
      }
      return 1;
    }

    function loadObject(index) {
      objIndex = index % OBJECTS.length;
      obj = OBJECTS[objIndex];
      qc = findContact(obj);
      phase = "grip";
      phaseT = 0;
      lift = 0;
      hold = 0;
      over = 0;
      dropY = 0;
      dropV = 0;
      splat = 0;
      particles = [];
      byId("myo-object").textContent = obj.name;
      byId("myo-band").textContent = `Safe grip ${obj.min}–${obj.max} N`;
    }

    function updateScore() {
      byId("myo-score").textContent = String(score);
      byId("myo-best").textContent = `Streak ${streak} · best ${best}`;
    }

    function burst(color, n, x, y) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 60 + Math.random() * 220;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 120,
          life: 1,
          size: 3 + Math.random() * 6,
          color,
        });
      }
    }

    function fail(kind) {
      phase = kind;
      phaseT = 0;
      streak = 0;
      updateScore();
      if (kind === "broken") {
        const g = geometry(obj);
        burst(obj.color, 34, 0, g.cy - lift * 70);
        if (obj.kind === "egg") burst("#ffc928", 14, 0, g.cy - lift * 70);
        banner = { text: "Crushed!", color: C.red, t: 0 };
        setStatus(`Too much force. The ${obj.name.toLowerCase()} gave way above ${obj.max} N. Relax and try again.`, "bad");
      } else {
        dropY = lift * 70;
        dropV = 0;
        banner = { text: "Slipped!", color: C.amber, t: 0 };
        setStatus(`Grip dropped below ${obj.min} N while lifting, so it slipped. Relax and try again.`, "bad");
      }
      lift = 0;
      hold = 0;
    }

    function succeed() {
      phase = "success";
      phaseT = 0;
      score += 1;
      streak += 1;
      if (streak > best) {
        best = streak;
        store.set("bionic.myo.best", best);
      }
      updateScore();
      banner = { text: "Clean lift!", color: C.green, t: 0 };
      setStatus(`Nice control! ${obj.name} lifted without damage. Relax your hand to load the next object.`, "good");
    }

    // Input: the pad maps press height to contraction; Space ramps it up.
    function padFromEvent(e) {
      const r = pad.getBoundingClientRect();
      padU = clamp((r.bottom - e.clientY) / r.height, 0, 1);
    }
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
    pad.addEventListener("pointermove", (e) => {
      if (padActive) padFromEvent(e);
    });
    const release = () => {
      padActive = false;
      padU = 0;
      pad.classList.remove("active");
    };
    pad.addEventListener("pointerup", release);
    pad.addEventListener("pointercancel", release);
    pad.addEventListener("lostpointercapture", release);
    pad.addEventListener("contextmenu", (e) => e.preventDefault());

    const onKey = (down) => (e) => {
      if (!api.active) return;
      if (e.code !== "Space" && e.key !== " ") return;
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

    feedbackEl.addEventListener("change", () => {
      feedback = feedbackEl.checked;
    });
    windowEl.addEventListener("input", () => {
      win = Number(windowEl.value);
      byId("myo-window-val").textContent = `${win} ms`;
      resumSquares();
    });
    thrEl.addEventListener("input", () => {
      thr = Number(thrEl.value) / 100;
      byId("myo-thr-val").textContent = `${thrEl.value}%`;
    });
    byId("myo-next").addEventListener("click", () => {
      streak = 0;
      updateScore();
      loadObject(objIndex + 1);
      setStatus(`Next up: ${obj.name.toLowerCase()}. Keep the grip between ${obj.min} and ${obj.max} N.`);
    });

    function resumSquares() {
      sqSum = 0;
      for (let i = 1; i <= win; i++) sqSum += sq[(sqHead - i + sq.length) % sq.length];
      samplesSinceExact = 0;
    }

    function step(dt) {
      keyU = keyHeld ? Math.min(1, keyU + dt * 0.55) : Math.max(0, keyU - dt * 1.8);
      u = padActive ? padU : keyU;
      act += (u - act) * smooth(dt, 0.05);

      // Synthesize 1 kHz surface EMG: zero-mean noise whose amplitude tracks activation.
      sampleCarry += dt * SAMPLE_RATE;
      const n = Math.floor(sampleCarry);
      sampleCarry -= n;
      for (let i = 0; i < n; i++) {
        const v = gauss() * (act * 0.95 + 0.035);
        raw[head] = v;
        const s2 = v * v;
        sqSum += s2 - sq[(sqHead - win + sq.length) % sq.length];
        sq[sqHead] = s2;
        sqHead = (sqHead + 1) % sq.length;
        if (++samplesSinceExact > 2000) resumSquares();
        env = Math.sqrt(Math.max(0, sqSum) / win) / 0.95;
        envTrace[head] = env;
        head = (head + 1) % SCOPE_SAMPLES;
      }

      cmd = clamp((env - thr) / (1 - thr), 0, 1);
      effort += (cmd - effort) * smooth(dt, 0.09);

      const hasObject = phase === "grip" || (phase === "success" && phaseT < 1.1);
      const qFree = Math.min(1, effort * GAIN);
      const limit = hasObject ? Math.min(qFree, qc) : qFree;
      const dq = limit - q;
      q += clamp(dq, -3 * dt, 2.4 * dt);
      const ec = qc / GAIN;
      contact = phase === "grip" && effort >= ec && q >= qc - 0.02;
      force = contact ? (FMAX * (effort - ec)) / Math.max(0.05, 1 - ec) : 0;

      padFill.style.height = `${(u * 100).toFixed(1)}%`;
      pad.setAttribute("aria-valuenow", String(Math.round(u * 100)));

      if (feedback && contact && interacted && navigator.vibrate) {
        buzzT -= dt;
        if (buzzT <= 0) {
          try {
            navigator.vibrate(10);
          } catch (e) {
            /* ignore */
          }
          buzzT = 0.35 - 0.28 * clamp(force / FMAX, 0, 1);
        }
      }

      if (banner) {
        banner.t += dt;
        if (banner.t > 1.6) banner = null;
      }

      particles.forEach((p) => {
        p.vy += 900 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y > 0) {
          p.y = 0;
          p.vy *= -0.3;
          p.vx *= 0.6;
        }
        p.life -= dt * 0.7;
      });
      particles = particles.filter((p) => p.life > 0);

      if (phase === "grip") {
        if (force >= obj.min) lift = Math.min(1, lift + dt * 1.6);
        else if (lift > 0.35) return fail("dropped");
        else lift = Math.max(0, lift - dt * 2.5);

        if (force > obj.max) {
          over += dt;
          if (over > 0.12) return fail("broken");
        } else {
          over = 0;
        }

        if (lift >= 1 && force <= obj.max) {
          hold += dt;
          if (hold >= HOLD) return succeed();
        }

        if (!contact) {
          setStatus(
            u > 0.02 && cmd === 0
              ? "Signal is under the activation threshold. Flex a little harder."
              : "Flex to close the hand around the object.",
          );
        } else if (force < obj.min) {
          setStatus(`Contact. Squeeze a bit more: at least ${obj.min} N to lift it.`);
        } else if (force > obj.max * 0.85) {
          setStatus("Careful, you're close to crushing it!", "bad");
        } else if (lift < 1) {
          setStatus("Lifting…");
        } else {
          setStatus(`Holding steady… ${Math.max(0, HOLD - hold).toFixed(1)} s to go.`, "good");
        }
      } else {
        phaseT += dt;
        if (phase === "dropped") {
          dropV += 1400 * dt;
          dropY -= dropV * dt;
          if (dropY < 0) {
            dropY = 0;
            dropV = -dropV * 0.35;
            if (Math.abs(dropV) < 40) dropV = 0;
          }
        }
        if (phase === "broken" && obj.kind === "egg") splat = Math.min(1, splat + dt * 3);
        if (phaseT > 1.1 && q < 0.2) {
          const next = phase === "success" ? objIndex + 1 : objIndex;
          loadObject(next);
          setStatus(`Next up: ${obj.name.toLowerCase()}. Keep the grip between ${obj.min} and ${obj.max} N.`);
        } else if (phaseT > 1.1) {
          setStatus("Relax your hand to load the next object.", phase === "success" ? "good" : "");
        }
      }
    }

    function drawScope(ctx, x, y, w, h) {
      roundRect(ctx, x, y, w, h, 14);
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      ctx.fill();
      ctx.strokeStyle = C.gridStrong;
      ctx.stroke();

      const mid = y + h / 2;
      const amp = h * 0.36;
      ctx.save();
      roundRect(ctx, x, y, w, h, 14);
      ctx.clip();

      ctx.strokeStyle = C.grid;
      ctx.beginPath();
      for (let i = 1; i < 10; i++) {
        const gx = Math.round(x + (w * i) / 10) + 0.5;
        ctx.moveTo(gx, y);
        ctx.lineTo(gx, y + h);
      }
      ctx.moveTo(x, Math.round(mid) + 0.5);
      ctx.lineTo(x + w, Math.round(mid) + 0.5);
      ctx.stroke();

      // Raw EMG as a min/max envelope per pixel column.
      const cols = Math.max(1, Math.floor(w));
      const per = SCOPE_SAMPLES / cols;
      ctx.strokeStyle = "rgba(92, 200, 255, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        let lo = Infinity;
        let hi = -Infinity;
        const s0 = Math.floor(c * per);
        const s1 = Math.max(s0 + 1, Math.floor((c + 1) * per));
        for (let s = s0; s < s1; s++) {
          const v = raw[(head + s) % SCOPE_SAMPLES];
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
        const px = x + c + 0.5;
        ctx.moveTo(px, mid - clamp(hi, -1.3, 1.3) * amp);
        ctx.lineTo(px, mid - clamp(lo, -1.3, 1.3) * amp + 0.5);
      }
      ctx.stroke();

      // Envelope (mirrored) and threshold.
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      for (const sign of [1, -1]) {
        ctx.beginPath();
        for (let c = 0; c < cols; c += 2) {
          const v = envTrace[(head + Math.floor(c * per)) % SCOPE_SAMPLES];
          const py = mid - sign * clamp(v, 0, 1.3) * amp;
          if (c === 0) ctx.moveTo(x + c, py);
          else ctx.lineTo(x + c, py);
        }
        ctx.stroke();
      }
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = C.amber;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, mid - thr * amp);
      ctx.lineTo(x + w, mid - thr * amp);
      ctx.moveTo(x, mid + thr * amp);
      ctx.lineTo(x + w, mid + thr * amp);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      label(ctx, "FOREARM EMG", x + 12, y + 20, { size: 11, weight: 700, color: C.dim });
      label(ctx, `motor command ${Math.round(cmd * 100)}%`, x + w - 12, y + 20, {
        size: 11,
        weight: 700,
        color: cmd > 0 ? C.cyan : C.dim,
        align: "right",
      });
      label(ctx, "raw", x + 12, y + h - 10, { size: 10, color: "rgba(92,200,255,0.8)" });
      label(ctx, "envelope", x + 40, y + h - 10, { size: 10, color: "#fff" });
      label(ctx, "threshold", x + 98, y + h - 10, { size: 10, color: C.amber });
    }

    function drawObject(ctx, o, cx, cy, sx, sy) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sx, sy);
      const r = o.r;
      const hh = o.hh;
      ctx.lineWidth = 2;
      if (o.kind === "can") {
        const grad = ctx.createLinearGradient(-r, 0, r, 0);
        grad.addColorStop(0, "#8e1f1c");
        grad.addColorStop(0.35, "#ff6b62");
        grad.addColorStop(0.6, o.color);
        grad.addColorStop(1, "#6d1411");
        roundRect(ctx, -r, -hh, 2 * r, 2 * hh, 7);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.fillStyle = "#d9dee6";
        ctx.fillRect(-r + 3, -hh, 2 * r - 6, 6);
        ctx.fillRect(-r + 3, hh - 6, 2 * r - 6, 6);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = `800 11px ${FONT}`;
        ctx.textAlign = "center";
        ctx.fillText("FIZZ", 0, 4);
      } else if (o.kind === "cup") {
        ctx.beginPath();
        ctx.moveTo(-r, -hh);
        ctx.lineTo(r, -hh);
        ctx.lineTo(r * 0.72, hh);
        ctx.lineTo(-r * 0.72, hh);
        ctx.closePath();
        ctx.fillStyle = o.color;
        ctx.fill();
        ctx.fillStyle = "#4a7bd1";
        ctx.fillRect(-r * 0.86, -hh * 0.2, r * 1.72, hh * 0.35);
        ctx.fillStyle = "#e1d8c9";
        ctx.fillRect(-r - 2, -hh - 3, 2 * r + 4, 5);
      } else if (o.kind === "egg") {
        const grad = ctx.createRadialGradient(-r * 0.3, -hh * 0.4, 2, 0, 0, hh * 1.2);
        grad.addColorStop(0, "#fffaf0");
        grad.addColorStop(1, "#d9c3a0");
        ctx.beginPath();
        ctx.ellipse(0, 0, r, hh, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      } else {
        const grad = ctx.createRadialGradient(-r * 0.35, -hh * 0.35, 2, 0, 0, r * 1.2);
        grad.addColorStop(0, "rgba(255,255,255,0.8)");
        grad.addColorStop(0.25, o.color);
        grad.addColorStop(1, "rgba(0,0,0,0.35)");
        ctx.beginPath();
        ctx.ellipse(0, 0, r, hh, 0, 0, Math.PI * 2);
        ctx.fillStyle = o.color;
        ctx.fill();
        ctx.fillStyle = grad;
        ctx.fill();
        if (o.kind === "ball") {
          ctx.strokeStyle = "rgba(255,255,255,0.85)";
          ctx.beginPath();
          ctx.arc(-r * 1.1, 0, r * 0.9, -0.9, 0.9);
          ctx.moveTo(r * 1.1 + r * 0.9 * Math.cos(Math.PI + 0.9), r * 0.9 * Math.sin(Math.PI + 0.9));
          ctx.arc(r * 1.1, 0, r * 0.9, Math.PI + 0.9, Math.PI - 0.9, true);
          ctx.stroke();
        } else if (o.kind === "tomato" || o.kind === "berry") {
          ctx.fillStyle = "#3aa655";
          for (let i = 0; i < 5; i++) {
            ctx.save();
            ctx.translate(0, -hh + 2);
            ctx.rotate(-0.9 + i * 0.45);
            ctx.beginPath();
            ctx.ellipse(0, -5, 3, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          if (o.kind === "berry") {
            ctx.fillStyle = "rgba(255, 230, 120, 0.9)";
            for (let i = 0; i < 14; i++) {
              const a = i * 2.4;
              const rr = (i / 14) * r * 0.75;
              ctx.fillRect(Math.cos(a) * rr - 1, Math.sin(a) * rr * (hh / r) + 2, 2, 3);
            }
          }
        }
      }
      ctx.restore();
    }

    function drawChain(ctx, pts, width, color, tip) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(11,19,32,0.55)";
      ctx.lineWidth = 2;
      for (let i = 1; i < pts.length - 1; i++) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, width * 0.32, 0, Math.PI * 2);
        ctx.stroke();
      }
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      ctx.strokeStyle = tip;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(a.x + (b.x - a.x) * 0.45, a.y + (b.y - a.y) * 0.45);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    function drawHand(ctx, o, yOff, glow) {
      const g = geometry(o);
      const pb = g.palmBottom - yOff;
      const pw = g.baseX + 12;

      // Carbon socket and forearm going up out of frame.
      const sock = ctx.createLinearGradient(-34, 0, 34, 0);
      sock.addColorStop(0, "#121c2f");
      sock.addColorStop(0.45, "#2a3a58");
      sock.addColorStop(1, "#0f1727");
      ctx.fillStyle = sock;
      roundRect(ctx, -32, pb - 420, 64, 380, 20);
      ctx.fill();
      ctx.strokeStyle = "rgba(92,200,255,0.25)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(-30, pb - 70 - i * 24);
        ctx.lineTo(30, pb - 82 - i * 24);
        ctx.stroke();
      }

      // Wrist ring LED shows the motor command.
      ctx.save();
      ctx.shadowColor = C.cyan;
      ctx.shadowBlur = 6 + glow * 26;
      ctx.fillStyle = `rgba(92, 200, 255, ${0.25 + glow * 0.75})`;
      roundRect(ctx, -36, pb - 62, 72, 9, 4);
      ctx.fill();
      ctx.restore();

      const palm = ctx.createLinearGradient(-pw, 0, pw, 0);
      palm.addColorStop(0, "#9fb0c7");
      palm.addColorStop(0.5, "#e7eef8");
      palm.addColorStop(1, "#8fa1ba");
      ctx.fillStyle = palm;
      roundRect(ctx, -pw, pb - 50, pw * 2, 50, 14);
      ctx.fill();
      ctx.fillStyle = "rgba(11,19,32,0.35)";
      roundRect(ctx, -pw + 10, pb - 38, pw * 2 - 20, 6, 3);
      ctx.fill();

      const back = fingerPoints(q * 0.97, g.baseX - 7, pb - 2, 1);
      drawChain(ctx, back, 13, "#8093ad", "#1f2a3d");
      const finger = fingerPoints(q, g.baseX, pb, 1);
      drawChain(ctx, finger, 15, C.metal, "#2b3446");
      const thumb = fingerPoints(q, -g.baseX, pb, -1);
      drawChain(ctx, thumb, 17, "#b3c2d6", "#2b3446");

      if (contact && feedback) {
        const tone = force > o.max * 0.85 ? C.red : force >= o.min ? C.green : C.amber;
        ctx.save();
        ctx.shadowColor = tone;
        ctx.shadowBlur = 16;
        ctx.fillStyle = tone;
        for (const p of [finger[3], thumb[3]]) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    function drawMeter(ctx, x, y, h) {
      const w = 12;
      roundRect(ctx, x, y, w, h, 6);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      const toY = (f) => y + h - (clamp(f, 0, FMAX) / FMAX) * h;
      ctx.fillStyle = "rgba(61, 220, 151, 0.35)";
      ctx.fillRect(x, toY(obj.max), w, toY(obj.min) - toY(obj.max));
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, toY(obj.max) + 0.5, w - 1, toY(obj.min) - toY(obj.max) - 1);
      label(ctx, `${FMAX} N`, x + w / 2, y - 6, { size: 10, align: "center", color: C.dim });
      label(ctx, "0", x + w / 2, y + h + 14, { size: 10, align: "center", color: C.dim });
      if (feedback) {
        const fy = toY(force);
        const tone = force > obj.max ? C.red : force >= obj.min ? C.green : C.amber;
        ctx.fillStyle = tone;
        ctx.beginPath();
        ctx.moveTo(x - 9, fy - 6);
        ctx.lineTo(x - 1, fy);
        ctx.lineTo(x - 9, fy + 6);
        ctx.fill();
        label(ctx, `${force.toFixed(1)} N`, x - 12, fy + 4, { size: 12, weight: 700, align: "right", color: tone });
      } else {
        label(ctx, "?", x + w / 2, y + h / 2 + 6, { size: 18, weight: 800, align: "center", color: C.dim });
      }
    }

    function draw() {
      const { ctx, w, h } = surf;
      surf.clear();
      drawGrid(ctx, w, h, 28);

      const pad0 = 14;
      const scopeH = Math.round(clamp(h * 0.3, 90, 170));
      drawScope(ctx, pad0, pad0, w - pad0 * 2, scopeH);

      const sceneTop = pad0 + scopeH + 10;
      const sceneH = h - sceneTop;
      const meterX = w - 30;
      const s = clamp(Math.min((w - 70) / 300, (sceneH - 20) / 215), 0.55, 1.9);
      const cx = (w - 40) / 2;
      const tableY = h - 26 * s;

      // Table.
      ctx.fillStyle = "rgba(92, 200, 255, 0.08)";
      ctx.fillRect(0, tableY, w, h - tableY);
      ctx.strokeStyle = "rgba(92, 200, 255, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, tableY);
      ctx.lineTo(w, tableY);
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, sceneTop, w, h - sceneTop);
      ctx.clip();
      ctx.translate(cx, tableY);
      ctx.scale(s, s);

      if (splat > 0) {
        ctx.fillStyle = "rgba(255, 245, 225, 0.8)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 48 * splat, 6 * splat, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffc928";
        ctx.beginPath();
        ctx.ellipse(4, -2, 14 * splat, 5 * splat, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const liftPx = lift * 70;
      const carry = phase === "success" ? 70 + Math.min(1, phaseT * 1.4) * 60 : liftPx;
      const g = geometry(obj);

      // Shadow.
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(0, 0, obj.r * (1 - carry / 300), 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (phase === "grip" || phase === "success" || phase === "dropped") {
        const squish = contact ? clamp(force / obj.max, 0, 1.2) : 0;
        const oy = phase === "dropped" ? -obj.hh - dropY : g.cy - carry;
        ctx.globalAlpha = phase === "success" ? clamp(1.6 - phaseT, 0, 1) : 1;
        drawObject(ctx, obj, 0, oy + squish * obj.hh * 0.05, 1 - squish * 0.14, 1 + squish * 0.05);
        ctx.globalAlpha = 1;
        if (phase === "grip" && hold > 0) {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.arc(0, oy, Math.max(obj.r, obj.hh) + 26, -Math.PI / 2, -Math.PI / 2 + (hold / HOLD) * Math.PI * 2);
          ctx.stroke();
        }
      }

      particles.forEach((p) => {
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      });
      ctx.globalAlpha = 1;

      drawHand(ctx, obj, phase === "success" ? carry : phase === "grip" ? liftPx : 0, cmd);
      ctx.restore();

      drawMeter(ctx, meterX, sceneTop + 24, tableY - sceneTop - 40);

      if (banner) {
        const a = clamp(1.6 - banner.t, 0, 1);
        ctx.globalAlpha = a;
        label(ctx, banner.text, cx, sceneTop + 34 - banner.t * 8, {
          size: 24,
          weight: 800,
          align: "center",
          color: banner.color,
        });
        ctx.globalAlpha = 1;
      }
    }

    loadObject(0);
    updateScore();

    const api = {
      active: false,
      surf,
      step,
      draw,
      onShow() {},
      onHide() {
        keyHeld = false;
        release();
      },
    };
    return api;
  }

  // ---------------------------------------------------------------------------
  // 02 · Gait Lab
  // ---------------------------------------------------------------------------

  // Periodic cubic Hermite through [percent, value] keys (0..100, wraps).
  function periodicTable(keys) {
    const pts = keys.filter((k) => k[0] < 100);
    const n = pts.length;
    const xAt = (i) => pts[((i % n) + n) % n][0] + 100 * Math.floor(i / n);
    const vAt = (i) => pts[((i % n) + n) % n][1];
    const slope = (i) => (vAt(i + 1) - vAt(i - 1)) / (xAt(i + 1) - xAt(i - 1));
    const table = new Float32Array(201);
    for (let k = 0; k <= 200; k++) {
      const x = k / 2;
      let i = n - 1;
      for (let j = 0; j < n; j++) {
        if (x >= xAt(j) && x < xAt(j + 1)) {
          i = j;
          break;
        }
      }
      const x0 = xAt(i);
      const x1 = xAt(i + 1);
      const hSeg = x1 - x0;
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

  function lookup(table, pct) {
    const x = (((pct % 100) + 100) % 100) * 2;
    const i = Math.floor(x);
    const f = x - i;
    return table[i] * (1 - f) + table[Math.min(200, i + 1)] * f;
  }

  function createGait() {
    const surf = surface(byId("gait-canvas"));
    const speedEl = byId("gait-speed");
    const scrubEl = byId("gait-scrub");
    const playBtn = byId("gait-play");
    const forcesEl = byId("gait-forces");
    const modeBtns = Array.from(document.querySelectorAll("[data-gait-mode]"));
    const phaseEl = byId("gait-phase");

    const BIO = {
      hip: periodicTable([[0, 25], [12, 22], [30, 6], [50, -10], [58, -6], [66, 5], [78, 22], [88, 28], [100, 25]]),
      knee: periodicTable([[0, 4], [15, 18], [38, 4], [50, 8], [62, 38], [72, 60], [84, 32], [95, 5], [100, 4]]),
      ankle: periodicTable([[0, 0], [8, -6], [25, 5], [45, 10], [55, 1], [62, -18], [70, -9], [80, 0], [100, 0]]),
    };
    const MODES = {
      bio: { right: BIO, stance: 0.62, push: 0.35, leftPeak: 0.35, energy: "Normal", label: "biological leg" },
      passive: {
        right: {
          hip: periodicTable([[0, 28], [12, 25], [30, 8], [50, -5], [60, 3], [74, 25], [87, 32], [100, 28]]),
          knee: periodicTable([[0, 0], [15, 1], [38, 0], [52, 3], [62, 24], [72, 55], [84, 34], [94, 4], [100, 0]]),
          ankle: periodicTable([[0, 0], [8, -3], [25, 3], [45, 7], [55, 4], [62, -4], [75, 0], [100, 0]]),
        },
        stance: 0.56,
        push: 0.1,
        leftPeak: 0.5,
        energy: "High",
        label: "passive prosthesis",
      },
      powered: {
        right: {
          hip: periodicTable([[0, 25], [12, 22], [30, 6], [50, -9], [58, -5], [66, 5], [78, 23], [88, 28], [100, 25]]),
          knee: periodicTable([[0, 3], [15, 13], [38, 3], [50, 6], [62, 36], [72, 58], [84, 30], [95, 4], [100, 3]]),
          ankle: periodicTable([[0, 0], [8, -5], [25, 4], [45, 9], [55, -1], [62, -15], [70, -8], [80, 0], [100, 0]]),
        },
        stance: 0.6,
        push: 0.28,
        leftPeak: 0.38,
        energy: "Lower",
        label: "powered prosthesis",
      },
    };
    const L = { thigh: 92, shank: 88 };

    let mode = "bio";
    let speed = Number(speedEl.value);
    let playing = true;
    let showForces = true;
    let p = 0.12;
    let belt = 0;
    let beltV = 0;
    let lastContact = null;
    let lastScrubWrite = -1;

    const cfg = () => MODES[mode];
    const amp = () => 0.8 + 0.15 * speed;
    const freq = () => 0.55 + 0.35 * speed;

    // Right leg can spend less time in stance; warp time into curve percent.
    function curvePct(t, stance) {
      const bio = 0.62;
      const tt = ((t % 1) + 1) % 1;
      return tt < stance ? (tt / stance) * bio * 100 : (bio + ((tt - stance) / (1 - stance)) * (1 - bio)) * 100;
    }

    function angles(side, t) {
      const c = cfg();
      const set = side === "R" ? c.right : BIO;
      const pct = side === "R" ? curvePct(t, c.stance) : t * 100;
      const k = amp();
      return {
        pct,
        hip: 9 + (lookup(set.hip, pct) - 9) * k,
        knee: lookup(set.knee, pct) * k,
        ankle: lookup(set.ankle, pct),
      };
    }

    function grf(side, t) {
      const c = cfg();
      const pct = side === "R" ? curvePct(t, c.stance) : ((t % 1) + 1) % 1 * 100;
      if (pct >= 62) return 0;
      const s = pct / 62;
      const gs = (x, m) => Math.exp(-(((x - m) / 0.11) ** 2));
      const first = side === "R" ? 0.35 : c.leftPeak;
      const second = side === "R" ? c.push : 0.35;
      return 0.78 * Math.sin(Math.PI * s) ** 0.8 + first * gs(s, 0.22) + second * gs(s, 0.78);
    }

    function legPose(hx, hy, a) {
      const ft = rad(a.hip);
      const K = { x: hx + L.thigh * Math.sin(ft), y: hy + L.thigh * Math.cos(ft) };
      const fs = ft - rad(a.knee);
      const A = { x: K.x + L.shank * Math.sin(fs), y: K.y + L.shank * Math.cos(fs) };
      const al = -fs - rad(a.ankle);
      const c = Math.cos(al);
      const s = Math.sin(al);
      const tf = (lx, ly) => ({ x: A.x + lx * c - ly * s, y: A.y + lx * s + ly * c });
      const heel = tf(-11, 14);
      const ball = tf(24, 14);
      const toe = tf(33, 12);
      const low = [heel, ball, toe].reduce((m, pt) => (pt.y > m.y ? pt : m));
      return { H: { x: hx, y: hy }, K, A, heel, ball, toe, top: tf(-6, 0), low };
    }

    function pose(t) {
      const aR = angles("R", t);
      const aL = angles("L", t + 0.5);
      const R0 = legPose(0, 0, aR);
      const L0 = legPose(0, 0, aL);
      const drop = Math.max(R0.low.y, L0.low.y);
      return { aR, aL, R: legPose(0, -drop, aR), Lf: legPose(0, -drop, aL), hipY: -drop };
    }

    modeBtns.forEach((b) =>
      b.addEventListener("click", () => {
        mode = b.dataset.gaitMode;
        setSeg(modeBtns, b);
        updateReadouts();
      }),
    );
    speedEl.addEventListener("input", () => {
      speed = Number(speedEl.value);
      updateReadouts();
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
    forcesEl.addEventListener("change", () => {
      showForces = forcesEl.checked;
    });

    function updateReadouts() {
      const c = cfg();
      byId("gait-speed-val").textContent = `${speed.toFixed(2)} m/s`;
      byId("gait-cadence").textContent = String(Math.round(freq() * 120));
      byId("gait-sym").textContent = `${Math.round((Math.min(c.stance, 0.62) / Math.max(c.stance, 0.62)) * 100)}%`;
      byId("gait-energy").textContent = c.energy;
    }

    const PHASES = [
      [2, "initial contact"],
      [12, "loading response"],
      [31, "mid stance"],
      [50, "terminal stance"],
      [62, "pre-swing (push-off)"],
      [75, "initial swing"],
      [87, "mid swing"],
      [101, "terminal swing"],
    ];

    function step(dt) {
      const prevP = p;
      if (playing) p = (p + freq() * dt) % 1;

      // Move the belt so the planted foot stays put.
      const ps = pose(p);
      const stanceSide = ps.R.low.y >= ps.Lf.low.y ? "R" : "L";
      const cp = stanceSide === "R" ? ps.R.low.x : ps.Lf.low.x;
      if (lastContact && lastContact.side === stanceSide && Math.abs(cp - lastContact.x) < 8) {
        const d = cp - lastContact.x;
        if (playing && dt > 0) beltV += (d / dt - beltV) * smooth(dt, 0.25);
        belt += playing ? beltV * dt : d;
      } else if (playing) {
        belt += beltV * dt;
      }
      lastContact = { side: stanceSide, x: cp };

      if (playing && Math.abs(p - prevP) > 0 && Math.abs(p * 100 - lastScrubWrite) > 0.9) {
        lastScrubWrite = p * 100;
        scrubEl.value = (p * 100).toFixed(1);
      }
      byId("gait-scrub-val").textContent = `${Math.round(p * 100)}%`;
      const pct = ps.aR.pct;
      const ph = PHASES.find((x) => pct < x[0]);
      const text = `Right leg (${cfg().label}): ${ph ? ph[1] : "terminal swing"}`;
      if (phaseEl.textContent !== text) phaseEl.textContent = text;
    }

    function drawLimb(ctx, a, b, width, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    function drawFoot(ctx, leg, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(leg.top.x, leg.top.y);
      ctx.lineTo(leg.A.x, leg.A.y);
      ctx.lineTo(leg.toe.x, leg.toe.y);
      ctx.lineTo(leg.ball.x, leg.ball.y);
      ctx.lineTo(leg.heel.x, leg.heel.y);
      ctx.closePath();
      ctx.fill();
    }

    function drawLeg(ctx, leg, near, prosthetic) {
      if (!prosthetic) {
        const col = near ? "#dfe9f7" : "#6f86a8";
        drawLimb(ctx, leg.H, leg.K, near ? 22 : 19, col);
        drawLimb(ctx, leg.K, leg.A, near ? 17 : 15, col);
        drawFoot(ctx, leg, col);
        return;
      }
      // Residual limb, socket, knee unit, pylon, carbon foot.
      const mid = { x: leg.H.x + (leg.K.x - leg.H.x) * 0.45, y: leg.H.y + (leg.K.y - leg.H.y) * 0.45 };
      drawLimb(ctx, leg.H, mid, 22, "#dfe9f7");
      const sock = { x: leg.H.x + (leg.K.x - leg.H.x) * 0.3, y: leg.H.y + (leg.K.y - leg.H.y) * 0.3 };
      drawLimb(ctx, sock, leg.K, 24, C.carbon);
      drawLimb(ctx, sock, leg.K, 2, "rgba(92,200,255,0.45)");
      drawLimb(ctx, leg.K, leg.A, 7, "#b8c4d4");
      drawLimb(ctx, leg.K, leg.A, 2, "#ffffff");
      const powered = mode === "powered";
      ctx.fillStyle = powered ? "#2f5d9f" : "#8a97aa";
      ctx.beginPath();
      ctx.arc(leg.K.x, leg.K.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = powered ? C.cyan : "#dfe6ef";
      ctx.lineWidth = 3;
      ctx.stroke();
      if (powered) {
        ctx.save();
        ctx.shadowColor = C.cyan;
        ctx.shadowBlur = 14;
        ctx.fillStyle = C.cyan;
        ctx.beginPath();
        ctx.arc(leg.K.x, leg.K.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(leg.A.x, leg.A.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = "#26334d";
      drawFoot(ctx, leg, "#26334d");
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(leg.heel.x, leg.heel.y);
      ctx.lineTo(leg.ball.x, leg.ball.y);
      ctx.lineTo(leg.toe.x, leg.toe.y);
      ctx.stroke();
    }

    function markers(ctx, leg, alpha) {
      ctx.save();
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 8 * alpha;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      for (const m of [leg.H, leg.K, leg.A, leg.toe]) {
        ctx.beginPath();
        ctx.arc(m.x, m.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawArm(ctx, S, armDeg, color, width) {
      const a = rad(armDeg);
      const E = { x: S.x + 60 * Math.sin(a), y: S.y + 60 * Math.cos(a) };
      const b = rad(armDeg + 16 + Math.max(0, armDeg) * 0.8);
      const W = { x: E.x + 55 * Math.sin(b), y: E.y + 55 * Math.cos(b) };
      drawLimb(ctx, S, E, width, color);
      drawLimb(ctx, E, W, width - 3, color);
    }

    function drawFigure(ctx, x, y, w, h) {
      const s = clamp(Math.min((h - 52) / 365, w / 300), 0.3, 1.6);
      const groundY = y + h - 34;
      const hx = x + w * 0.5;
      const ps = pose(p);

      // Treadmill.
      ctx.save();
      const beltX0 = x + 14;
      const beltX1 = x + w - 14;
      roundRect(ctx, beltX0, groundY, beltX1 - beltX0, 14, 7);
      ctx.fillStyle = "#16233b";
      ctx.fill();
      ctx.strokeStyle = "rgba(92,200,255,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(beltX0 + 6, groundY, beltX1 - beltX0 - 12, 14);
      ctx.clip();
      const spacing = 26;
      const off = (((belt * s) % spacing) + spacing) % spacing;
      ctx.strokeStyle = "rgba(92,200,255,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let bx = beltX0 - spacing + off; bx < beltX1 + spacing; bx += spacing) {
        ctx.moveTo(bx, groundY + 3);
        ctx.lineTo(bx - 6, groundY + 11);
      }
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(hx, groundY);
      ctx.scale(s, s);

      const H = { x: 0, y: ps.hipY };
      const lean = rad(5);
      const S = { x: H.x + 118 * Math.sin(lean), y: H.y - 118 * Math.cos(lean) };

      // Far side first.
      drawArm(ctx, S, -0.55 * (ps.aR.hip - 9), "#6f86a8", 13);
      drawLeg(ctx, ps.Lf, false, false);
      markers(ctx, ps.Lf, 0.45);

      // Trunk and head.
      drawLimb(ctx, H, S, 30, "#c6d5ea");
      ctx.fillStyle = "#dfe9f7";
      ctx.beginPath();
      ctx.arc(S.x + 6, S.y - 30, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0b1320";
      ctx.beginPath();
      ctx.arc(S.x + 17, S.y - 33, 2.5, 0, Math.PI * 2);
      ctx.fill();

      drawLeg(ctx, ps.R, true, mode !== "bio");
      markers(ctx, ps.R, 0.95);
      drawArm(ctx, S, -0.55 * (ps.aL.hip - 9), "#e7eef8", 14);

      if (showForces) {
        for (const [leg, side] of [
          [ps.R, "R"],
          [ps.Lf, "L"],
        ]) {
          const f = grf(side, side === "R" ? p : p + 0.5);
          if (f <= 0.02) continue;
          const pct = side === "R" ? curvePct(p, cfg().stance) : ((p + 0.5) % 1) * 100;
          const cop = clamp(pct / 62, 0, 1);
          const px = leg.heel.x + (leg.toe.x - leg.heel.x) * cop;
          const py = 0;
          const dx = H.x - px;
          const dy = H.y - 60 - py;
          const len = Math.hypot(dx, dy);
          const Lf = f * 150;
          const ex = px + (dx / len) * Lf;
          const ey = py + (dy / len) * Lf;
          const color = side === "R" ? C.orange : C.cyan;
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          const ang = Math.atan2(ey - py, ex - px);
          ctx.beginPath();
          ctx.moveTo(ex + 9 * Math.cos(ang), ey + 9 * Math.sin(ang));
          ctx.lineTo(ex + 9 * Math.cos(ang + 2.5), ey + 9 * Math.sin(ang + 2.5));
          ctx.lineTo(ex + 9 * Math.cos(ang - 2.5), ey + 9 * Math.sin(ang - 2.5));
          ctx.fill();
        }
      }
      ctx.restore();

      label(ctx, "SAGITTAL VIEW", x + 16, y + 22, { size: 11, weight: 700, color: C.dim });
      label(ctx, "● right", x + 16, y + 40, { size: 11, weight: 700, color: C.orange });
      label(ctx, "● left", x + 70, y + 40, { size: 11, weight: 700, color: C.cyan });
    }

    function plot(ctx, x, y, w, h, title, lo, hi, fnR, fnL) {
      roundRect(ctx, x, y, w, h, 10);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fill();
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      ctx.stroke();
      const px = x + 8;
      const pw = w - 16;
      const py = y + 20;
      const ph = h - 28;
      const toY = (v) => py + ph - ((v - lo) / (hi - lo)) * ph;
      if (lo < 0 && hi > 0) {
        ctx.strokeStyle = C.grid;
        ctx.beginPath();
        ctx.moveTo(px, toY(0));
        ctx.lineTo(px + pw, toY(0));
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(61,220,151,0.08)";
      ctx.fillRect(px, py, pw * 0.62, ph);
      label(ctx, title, x + 8, y + 14, { size: 10, weight: 700, color: C.dim });

      const series = [
        [fnL, C.cyan, (p + 0.5) % 1],
        [fnR, C.orange, p],
      ];
      for (const [fn, color, cur] of series) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const t = i / 60;
          const vx = px + t * pw;
          const vy = toY(clamp(fn(t), lo, hi));
          if (i === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px + cur * pw, toY(clamp(fn(cur), lo, hi)), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawPlots(ctx, x, y, w, h, cols) {
      const rows = Math.ceil(4 / cols);
      const gap = 8;
      const cw = (w - gap * (cols - 1)) / cols;
      const ch = (h - gap * (rows - 1)) / rows;
      const specs = [
        ["HIP FLEXION °", -20, 40, (t) => angles("R", t).hip, (t) => angles("L", t).hip],
        ["KNEE FLEXION °", -5, 75, (t) => angles("R", t).knee, (t) => angles("L", t).knee],
        ["ANKLE DORSIFLEX °", -25, 20, (t) => angles("R", t).ankle, (t) => angles("L", t).ankle],
        ["GROUND FORCE ×BW", 0, 1.5, (t) => grf("R", t), (t) => grf("L", t)],
      ];
      specs.forEach((sp, i) => {
        const cx = x + (i % cols) * (cw + gap);
        const cy = y + Math.floor(i / cols) * (ch + gap);
        plot(ctx, cx, cy, cw, ch, sp[0], sp[1], sp[2], sp[3], sp[4]);
      });
    }

    function draw() {
      const { ctx, w, h } = surf;
      surf.clear();
      drawGrid(ctx, w, h, 28);
      if (w >= 620) {
        const fw = Math.round(w * 0.56);
        drawFigure(ctx, 0, 0, fw, h);
        drawPlots(ctx, fw, 14, w - fw - 14, h - 28, 1);
      } else {
        const fh = Math.round(h * 0.6);
        drawFigure(ctx, 0, 0, w, fh);
        drawPlots(ctx, 12, fh + 4, w - 24, h - fh - 16, 2);
      }
    }

    updateReadouts();
    return { active: false, surf, step, draw, onShow() {}, onHide() {} };
  }

  // ---------------------------------------------------------------------------
  // 03 · Reach Bot
  // ---------------------------------------------------------------------------
  function createArm() {
    const surf = surface(byId("arm-canvas"));
    const canvas = surf.canvas;
    const speedEl = byId("arm-speed");
    const loadEl = byId("arm-load");
    const inkEl = byId("arm-ink");
    const challengeBtn = byId("arm-challenge");
    const linkBtns = Array.from(document.querySelectorAll("[data-arm-links]"));
    const torqueEl = byId("arm-torques");
    const setStatus = makeStatus(byId("arm-status"));

    const SPLITS = {
      2: [0.52, 0.48],
      3: [0.4, 0.34, 0.26],
      4: [0.32, 0.28, 0.22, 0.18],
    };
    const LINK_MASS = 3; // kg for the whole arm
    const MOTOR_MASS = 0.8; // kg per joint motor past the base
    const REACH_MM = 1000;

    let nLinks = 3;
    let q = [];
    let omega = rad(Number(speedEl.value));
    let payload = Number(loadEl.value);
    let target = null;
    let pointerAt = -10;
    let time = 0;
    let trail = [];
    let ink = false;
    let challenge = null;
    let best = Number(store.get("bionic.arm.best", 0)) || 0;
    let sparks = [];
    let grip = 0;
    let torqueRows = [];
    let torqueT = 0;

    function resetJoints() {
      q = [-Math.PI / 2 + 0.5];
      for (let i = 1; i < nLinks; i++) q.push(-0.7);
      buildTorqueRows();
    }

    function buildTorqueRows() {
      torqueEl.innerHTML = "";
      torqueRows = [];
      for (let i = 0; i < nLinks; i++) {
        const row = document.createElement("div");
        row.className = "torque-row";
        row.innerHTML = `<span>J${i + 1}</span><div class="torque-track"><div class="torque-fill"></div></div><span>0 N·m</span>`;
        torqueEl.appendChild(row);
        torqueRows.push({ fill: row.querySelector(".torque-fill"), val: row.lastElementChild });
      }
    }

    function geom() {
      const { w, h } = surf;
      const R = Math.max(60, Math.min(w < 520 ? w / 2 - 18 : w * 0.46, h - 76));
      const base = { x: w / 2, y: h - 34 };
      const lens = SPLITS[nLinks].map((f) => f * R);
      return { R, base, lens };
    }

    function fk(g, angles) {
      const pts = [{ x: g.base.x, y: g.base.y }];
      let a = 0;
      for (let i = 0; i < angles.length; i++) {
        a += angles[i];
        const prev = pts[i];
        pts.push({ x: prev.x + g.lens[i] * Math.cos(a), y: prev.y + g.lens[i] * Math.sin(a) });
      }
      return pts;
    }

    function fabrik(g, pts, t) {
      const n = g.lens.length;
      const P = pts.map((pt) => ({ x: pt.x, y: pt.y }));
      for (let iter = 0; iter < 12; iter++) {
        P[n] = { x: t.x, y: t.y };
        for (let i = n - 1; i >= 0; i--) {
          const dx = P[i].x - P[i + 1].x;
          const dy = P[i].y - P[i + 1].y;
          const d = Math.hypot(dx, dy) || 1;
          P[i] = { x: P[i + 1].x + (dx / d) * g.lens[i], y: P[i + 1].y + (dy / d) * g.lens[i] };
        }
        P[0] = { x: g.base.x, y: g.base.y };
        for (let i = 0; i < n; i++) {
          const dx = P[i + 1].x - P[i].x;
          const dy = P[i + 1].y - P[i].y;
          const d = Math.hypot(dx, dy) || 1;
          P[i + 1] = { x: P[i].x + (dx / d) * g.lens[i], y: P[i].y + (dy / d) * g.lens[i] };
        }
        if (Math.hypot(P[n].x - t.x, P[n].y - t.y) < 0.5) break;
      }
      const out = [];
      let prev = 0;
      for (let i = 0; i < n; i++) {
        const a = Math.atan2(P[i + 1].y - P[i].y, P[i + 1].x - P[i].x);
        let rel = wrapAngle(a - prev);
        if (i === 0) rel = clamp(wrapAngle(a), -Math.PI, 0);
        else rel = clamp(rel, -rad(165), rad(165));
        out.push(rel);
        prev += rel;
      }
      return out;
    }

    function toTarget(e) {
      const r = canvas.getBoundingClientRect();
      target = { x: e.clientX - r.left, y: e.clientY - r.top };
      pointerAt = time;
    }
    canvas.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse" || e.buttons) toTarget(e);
    });
    canvas.addEventListener("pointerdown", (e) => {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
      toTarget(e);
    });

    speedEl.addEventListener("input", () => {
      omega = rad(Number(speedEl.value));
      byId("arm-speed-val").textContent = `${speedEl.value}°/s`;
    });
    loadEl.addEventListener("input", () => {
      payload = Number(loadEl.value);
      byId("arm-load-val").textContent = `${payload.toFixed(1)} kg`;
    });
    inkEl.addEventListener("change", () => {
      ink = inkEl.checked;
      trail = [];
    });
    linkBtns.forEach((b) =>
      b.addEventListener("click", () => {
        nLinks = Number(b.dataset.armLinks);
        setSeg(linkBtns, b);
        trail = [];
        resetJoints();
      }),
    );
    challengeBtn.addEventListener("click", () => {
      challenge = { t: 30, score: 0, orb: null };
      spawnOrb();
      challengeBtn.textContent = "Restart challenge";
      byId("arm-score").textContent = "0";
      setStatus("Go! Touch as many orbs as you can in 30 seconds.", "good");
    });

    function spawnOrb() {
      const g = geom();
      const ee = fk(g, q)[nLinks];
      let orb;
      for (let tries = 0; tries < 30; tries++) {
        const a = -Math.PI + 0.25 + Math.random() * (Math.PI - 0.5);
        const rr = g.R * (0.35 + Math.random() * 0.57);
        orb = { x: g.base.x + rr * Math.cos(a), y: g.base.y + rr * Math.sin(a), fr: rr / g.R, a };
        if (Math.hypot(orb.x - ee.x, orb.y - ee.y) > g.R * 0.45) break;
      }
      orb.born = time;
      challenge.orb = orb;
    }

    function step(dt) {
      time += dt;
      const g = geom();
      if (challenge && challenge.orb) {
        // Keep orbs attached to the workspace if the stage resizes.
        const o = challenge.orb;
        o.x = g.base.x + o.fr * g.R * Math.cos(o.a);
        o.y = g.base.y + o.fr * g.R * Math.sin(o.a);
      }

      let t = target;
      const idle = time - pointerAt > 4;
      if (!t || idle) {
        t = {
          x: g.base.x + g.R * 0.62 * Math.sin(time * 0.7),
          y: g.base.y - g.R * (0.5 + 0.28 * Math.sin(time * 1.3)),
        };
      }
      let tx = t.x;
      let ty = Math.min(t.y, g.base.y - 6);
      const dx = tx - g.base.x;
      const dy = ty - g.base.y;
      const dist = Math.hypot(dx, dy);
      const reachable = dist <= g.R * 0.995;
      if (!reachable) {
        tx = g.base.x + (dx / dist) * g.R * 0.995;
        ty = g.base.y + (dy / dist) * g.R * 0.995;
      }

      const pts = fk(g, q);
      const want = fabrik(g, pts, { x: tx, y: ty });
      for (let i = 0; i < nLinks; i++) {
        const d = wrapAngle(want[i] - q[i]);
        q[i] += clamp(d, -omega * dt, omega * dt);
      }

      const now = fk(g, q);
      const ee = now[nLinks];
      trail.push({ x: ee.x, y: ee.y });
      if (!ink && trail.length > 50) trail.shift();
      if (ink && trail.length > 4000) trail.shift();

      grip = Math.max(0, grip - dt * 2.5);
      sparks.forEach((s) => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 400 * dt;
        s.life -= dt * 1.4;
      });
      sparks = sparks.filter((s) => s.life > 0);

      if (challenge) {
        if (challenge.t > 0) {
          challenge.t -= dt;
          const o = challenge.orb;
          if (o && Math.hypot(ee.x - o.x, ee.y - o.y) < 20) {
            challenge.score += 1;
            byId("arm-score").textContent = String(challenge.score);
            grip = 1;
            for (let i = 0; i < 18; i++) {
              const a = Math.random() * Math.PI * 2;
              const sp = 60 + Math.random() * 180;
              sparks.push({ x: o.x, y: o.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1 });
            }
            spawnOrb();
          }
          if (challenge.t <= 0) {
            challenge.t = 0;
            challenge.orb = null;
            const sc = challenge.score;
            const record = sc > best;
            if (record) {
              best = sc;
              store.set("bionic.arm.best", best);
            }
            byId("arm-best").textContent = `Best ${best}`;
            challengeBtn.textContent = "Play again";
            setStatus(
              record ? `Time! ${sc} orbs, a new personal best.` : `Time! ${sc} orbs. Try a faster motor speed or fewer joints.`,
              record ? "good" : "",
            );
          }
        }
      } else if (!reachable && !idle && target) {
        setStatus("Target out of reach. The arm stretches toward it as far as it can.", "bad");
      } else if (Math.hypot(ee.x - g.base.x, ee.y - g.base.y) > g.R * 0.97) {
        setStatus("Near a singularity: fully stretched, the arm loses the ability to move along its own length.");
      } else if (idle || !target) {
        setStatus("Demo mode. Move your cursor or drag on the stage to take control.");
      } else {
        setStatus("Tracking your target. The arm solves inverse kinematics every frame.");
      }

      const mmPer = REACH_MM / g.R;
      byId("arm-pos").textContent = `${Math.round((ee.x - g.base.x) * mmPer)}, ${Math.round((g.base.y - ee.y) * mmPer)}`;

      torqueT -= dt;
      if (torqueT <= 0) {
        torqueT = 0.1;
        updateTorques(g, now);
      }
    }

    function updateTorques(g, pts) {
      const m = (px) => (px * REACH_MM) / g.R / 1000;
      const worst = [];
      for (let i = 0; i < nLinks; i++) {
        let tau = 0;
        let worstTau = 0;
        let reachAhead = 0;
        for (let j = i; j < nLinks; j++) {
          const mj = (LINK_MASS * g.lens[j]) / g.R;
          const cx = (pts[j].x + pts[j + 1].x) / 2;
          tau += mj * m(cx - pts[i].x);
          worstTau += mj * m(reachAhead + g.lens[j] / 2);
          reachAhead += g.lens[j];
          if (j > i) {
            tau += MOTOR_MASS * m(pts[j].x - pts[i].x);
            worstTau += MOTOR_MASS * m(reachAhead - g.lens[j]);
          }
        }
        tau += payload * m(pts[nLinks].x - pts[i].x);
        worstTau += 5 * m(reachAhead);
        const tauNm = Math.abs(tau * 9.81);
        worst.push(worstTau * 9.81);
        const frac = clamp(tauNm / (worstTau * 9.81), 0, 1);
        const row = torqueRows[i];
        if (!row) continue;
        row.fill.style.width = `${(frac * 100).toFixed(1)}%`;
        row.fill.classList.toggle("hot", frac > 0.7);
        row.val.textContent = `${tauNm.toFixed(1)} N·m`;
      }
    }

    function drawArmBody(ctx, g, pts) {
      const n = nLinks;
      const scale = g.R / 300;
      // Pedestal.
      ctx.fillStyle = "#1d2a40";
      ctx.beginPath();
      ctx.moveTo(g.base.x - 34 * scale, g.base.y + 34);
      ctx.lineTo(g.base.x - 22 * scale, g.base.y);
      ctx.lineTo(g.base.x + 22 * scale, g.base.y);
      ctx.lineTo(g.base.x + 34 * scale, g.base.y + 34);
      ctx.closePath();
      ctx.fill();

      for (let i = 0; i < n; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const wid = (26 - (i * 12) / Math.max(1, n - 1)) * clamp(scale, 0.6, 1.4);
        ctx.lineCap = "round";
        ctx.strokeStyle = "#8e9db3";
        ctx.lineWidth = wid + 3;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.strokeStyle = "#e6edf6";
        ctx.lineWidth = wid;
        ctx.stroke();
        ctx.strokeStyle = "rgba(74,123,209,0.8)";
        ctx.lineWidth = wid * 0.22;
        ctx.stroke();
      }
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const r = (17 - (i * 7) / Math.max(1, n - 1)) * clamp(scale, 0.6, 1.4);
        ctx.fillStyle = "#2f5d9f";
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#dfe9f7";
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
      // Gripper.
      const a = pts[n - 1];
      const b = pts[n];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const open = 7 - grip * 5;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang);
      ctx.fillStyle = "#b8c4d4";
      ctx.fillRect(-4, -10, 8, 20);
      ctx.fillStyle = "#dfe9f7";
      ctx.fillRect(4, -open - 3, 12, 3);
      ctx.fillRect(4, open, 12, 3);
      ctx.restore();
    }

    function draw() {
      const { ctx, w, h } = surf;
      surf.clear();
      const g = geom();
      drawGrid(ctx, w, h, g.R / 5);

      ctx.setLineDash([5, 7]);
      ctx.strokeStyle = "rgba(92,200,255,0.3)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(g.base.x, g.base.y, g.R, Math.PI, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(92,200,255,0.4)";
      ctx.beginPath();
      ctx.moveTo(0, g.base.y + 34);
      ctx.lineTo(w, g.base.y + 34);
      ctx.stroke();
      label(ctx, "1 m reach", g.base.x + g.R - 4, g.base.y - 6, { size: 10, align: "right", color: C.dim });

      if (trail.length > 1) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (ink) {
          ctx.strokeStyle = C.cyan;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          trail.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
          ctx.stroke();
        } else {
          for (let i = 1; i < trail.length; i++) {
            ctx.strokeStyle = `rgba(92,200,255,${(i / trail.length) * 0.6})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
            ctx.lineTo(trail[i].x, trail[i].y);
            ctx.stroke();
          }
        }
      }

      if (challenge && challenge.orb) {
        const o = challenge.orb;
        const pulse = 1 + 0.15 * Math.sin((time - o.born) * 8);
        ctx.save();
        ctx.shadowColor = C.green;
        ctx.shadowBlur = 20;
        ctx.fillStyle = "rgba(61,220,151,0.25)";
        ctx.beginPath();
        ctx.arc(o.x, o.y, 20 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.arc(o.x, o.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      sparks.forEach((s) => {
        ctx.globalAlpha = clamp(s.life, 0, 1);
        ctx.fillStyle = C.green;
        ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
      });
      ctx.globalAlpha = 1;

      const pts = fk(g, q);
      drawArmBody(ctx, g, pts);

      if (target && time - pointerAt <= 4) {
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(target.x, target.y, 10, 0, Math.PI * 2);
        ctx.moveTo(target.x - 16, target.y);
        ctx.lineTo(target.x - 5, target.y);
        ctx.moveTo(target.x + 5, target.y);
        ctx.lineTo(target.x + 16, target.y);
        ctx.moveTo(target.x, target.y - 16);
        ctx.lineTo(target.x, target.y - 5);
        ctx.moveTo(target.x, target.y + 5);
        ctx.lineTo(target.x, target.y + 16);
        ctx.stroke();
      }

      const jointText = q
        .map((a, i) => `J${i + 1} ${Math.round(i === 0 ? -deg(a) : deg(a))}°`)
        .join("   ");
      label(ctx, jointText, 16, 24, { size: 11, weight: 700, color: C.dim });
      if (challenge) {
        label(ctx, `${Math.ceil(challenge.t)}s`, w - 16, 34, {
          size: 26,
          weight: 800,
          align: "right",
          color: challenge.t > 0 ? (challenge.t < 5 ? C.red : C.text) : C.dim,
        });
        label(ctx, `${challenge.score} orbs`, w - 16, 52, { size: 11, weight: 700, align: "right", color: C.green });
      }
    }

    resetJoints();
    byId("arm-best").textContent = `Best ${best}`;
    return {
      active: false,
      surf,
      step,
      draw,
      onShow() {},
      onHide() {},
    };
  }

  // ---------------------------------------------------------------------------
  // Tabs and the shared animation loop
  // ---------------------------------------------------------------------------
  const labs = { myo: createMyo(), gait: createGait(), arm: createArm() };
  const tabs = Array.from(document.querySelectorAll(".lab-tab"));
  let active = "myo";
  let raf = 0;
  let last = 0;
  let onScreen = true;

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const lab = labs[active];
    lab.surf.resize();
    lab.step(dt);
    lab.draw();
    schedule();
  }

  function schedule() {
    if (raf || !onScreen || document.hidden) return;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  }

  function select(name, focus) {
    if (!labs[name]) return;
    labs[active].active = false;
    labs[active].onHide();
    active = name;
    tabs.forEach((t) => {
      const on = t.dataset.lab === name;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      byId(t.getAttribute("aria-controls")).hidden = !on;
      if (on && focus) t.focus();
    });
    labs[name].active = true;
    labs[name].onShow();
    last = 0;
    schedule();
  }

  tabs.forEach((t, i) => {
    t.addEventListener("click", () => {
      select(t.dataset.lab);
      try {
        history.replaceState(null, "", `#${t.dataset.lab}`);
      } catch (e) {
        /* ignore */
      }
    });
    t.addEventListener("keydown", (e) => {
      let next = -1;
      if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = tabs.length - 1;
      if (next >= 0) {
        e.preventDefault();
        select(tabs[next].dataset.lab, true);
      }
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else schedule();
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      if (onScreen) schedule();
      else stop();
    });
    io.observe(document.querySelector(".bionic"));
  }

  const fromHash = (location.hash || "").replace("#", "");
  select(labs[fromHash] ? fromHash : "myo");
})();
