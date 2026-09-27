// 03 · Vibration pattern designer.
// A pattern is an amplitude envelope (breakpoints in normalized time) on a
// carrier. The same signal function drives the plot, the audio preview, the
// WAV file and the Arduino table, so what you see is what you export.
import { segmented, copyText, download, palette, fitCanvas, fmt, prettyJSON } from "./ui.js?v=20260928c";

const PRESETS = {
  tap: { dur: 40, freq: 175, freq2: 0, repeat: 1, gap: 200, points: [[0, 0], [0.08, 1], [0.7, 1], [1, 0]] },
  double: {
    dur: 260,
    freq: 175,
    freq2: 0,
    repeat: 1,
    gap: 200,
    points: [[0, 0], [0.02, 1], [0.2, 1], [0.25, 0], [0.55, 0], [0.57, 1], [0.75, 1], [0.8, 0], [1, 0]],
  },
  heartbeat: {
    dur: 900,
    freq: 150,
    freq2: 0,
    repeat: 2,
    gap: 150,
    points: [[0, 0], [0.03, 1], [0.12, 0.25], [0.16, 0], [0.22, 0], [0.25, 0.7], [0.33, 0.12], [0.38, 0], [1, 0]],
  },
  ramp: { dur: 1200, freq: 175, freq2: 0, repeat: 1, gap: 200, points: [[0, 0], [0.9, 1], [1, 0]] },
  alert: {
    dur: 600,
    freq: 235,
    freq2: 0,
    repeat: 1,
    gap: 200,
    points: [[0, 0], [0.01, 1], [0.15, 1], [0.16, 0], [0.34, 0], [0.35, 1], [0.49, 1], [0.5, 0], [0.68, 0], [0.69, 1], [0.83, 1], [0.84, 0], [1, 0]],
  },
  wave: { dur: 2000, freq: 80, freq2: 250, repeat: 1, gap: 200, actuator: "vc", points: [[0, 0], [0.25, 0.85], [0.5, 0.25], [0.75, 0.85], [1, 0]] },
};

// An ERM's rotor takes time to spin up and down; a first-order lag is a fair
// model. Its vibration frequency rises with speed.
const ERM_TAU = 0.03; // s
const ermFreq = (amp) => 60 + 160 * amp;

export function init(root) {
  const $ = (sel) => root.querySelector(sel);
  const pal = palette();
  const p = {
    name: "Heartbeat",
    points: PRESETS.heartbeat.points.map((pt) => pt.slice()),
    dur: 900,
    freq: 150,
    freq2: 0,
    repeat: 2,
    gap: 150,
  };

  // --- Controls --------------------------------------------------------------------
  const actuator = segmented($(".hap-grid"), "actuator", () => {
    syncControls();
    redraw();
  });
  const freq = $("#hap-freq");
  const freq2 = $("#hap-freq2");
  const dur = $("#hap-dur");
  const rep = $("#hap-rep");
  const gap = $("#hap-gap");

  function syncControls() {
    const a = actuator.get();
    freq.disabled = a === "erm";
    freq2.disabled = a !== "vc";
    if (a === "lra") {
      freq.min = 120;
      freq.max = 260;
    } else {
      freq.min = 40;
      freq.max = 400;
    }
    p.freq = Math.min(Number(freq.max), Math.max(Number(freq.min), p.freq));
    freq.value = p.freq;
    freq2.value = p.freq2;
    dur.value = p.dur;
    rep.value = p.repeat;
    gap.value = p.gap;
    // The Pacinian mark sits at 250 Hz on whatever range the slider has.
    const mark = root.querySelector(".range-marks i");
    const at = (250 - freq.min) / (freq.max - freq.min);
    mark.style.setProperty("--at", at);
    mark.classList.toggle("is-end", at > 0.7);
    mark.hidden = a === "erm";
    $("#hap-freq-val").textContent = a === "erm" ? "Set by speed" : `${p.freq} Hz${a === "lra" ? " resonance" : ""}`;
    $("#hap-freq2-val").textContent = a !== "vc" ? "Voice coil only" : p.freq2 ? `${p.freq2} Hz` : "Off";
    $("#hap-dur-val").textContent = `${p.dur} ms`;
    $("#hap-rep-val").textContent = `${p.repeat}×`;
    $("#hap-gap-val").textContent = p.repeat > 1 ? `${p.gap} ms` : "—";
    gap.disabled = p.repeat < 2;
    stats();
  }

  const onRange = (el, key) =>
    el.addEventListener("input", () => {
      p[key] = Number(el.value);
      markCustom();
      syncControls();
      redraw();
    });
  onRange(freq, "freq");
  onRange(freq2, "freq2");
  onRange(dur, "dur");
  onRange(rep, "repeat");
  onRange(gap, "gap");

  function markCustom() {
    root.querySelectorAll("[data-hap-preset]").forEach((b) => b.classList.remove("is-active"));
    if (!p.name.endsWith("(edited)")) p.name = `${p.name} (edited)`;
  }

  root.querySelectorAll("[data-hap-preset]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const pre = PRESETS[btn.dataset.hapPreset];
      Object.assign(p, { dur: pre.dur, freq: pre.freq, freq2: pre.freq2, repeat: pre.repeat, gap: pre.gap });
      p.points = pre.points.map((pt) => pt.slice());
      p.name = btn.textContent.trim();
      if (pre.actuator) actuator.set(pre.actuator, true);
      else if (actuator.get() === "vc" && !pre.freq2) actuator.set("lra", true);
      root.querySelectorAll("[data-hap-preset]").forEach((b) => b.classList.toggle("is-active", b === btn));
      syncControls();
      redraw();
      play();
    })
  );
  root.querySelector('[data-hap-preset="heartbeat"]').classList.add("is-active");

  // --- Signal ------------------------------------------------------------------------
  function env(u) {
    const pts = p.points;
    if (u <= 0) return pts[0][1];
    if (u >= 1) return pts[pts.length - 1][1];
    for (let i = 1; i < pts.length; i++) {
      if (u <= pts[i][0]) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        return x1 === x0 ? y1 : y0 + ((u - x0) / (x1 - x0)) * (y1 - y0);
      }
    }
    return 0;
  }

  // Render the whole sequence (repeats and gaps) at a sample rate.
  // Returns { signal, envelope } as Float32Arrays.
  function renderSequence(rate) {
    const a = actuator.get();
    const pulse = p.dur / 1000;
    const gapS = p.repeat > 1 ? p.gap / 1000 : 0;
    const total = p.repeat * pulse + (p.repeat - 1) * gapS;
    const n = Math.max(1, Math.round(total * rate));
    const signal = new Float32Array(n);
    const envelope = new Float32Array(n);
    let phase = 0;
    let lag = 0;
    const k = 1 - Math.exp(-1 / (rate * ERM_TAU));
    for (let i = 0; i < n; i++) {
      const t = i / rate;
      const period = pulse + gapS;
      const local = t % period;
      const inPulse = local < pulse && Math.floor(t / period) < p.repeat;
      const target = inPulse ? env(local / pulse) : 0;
      let amp = target;
      let f;
      if (a === "erm") {
        lag += (target - lag) * k;
        amp = lag;
        f = ermFreq(lag);
      } else if (a === "vc" && p.freq2) {
        f = p.freq + (p.freq2 - p.freq) * (inPulse ? local / pulse : 0);
      } else {
        f = p.freq;
      }
      phase += (2 * Math.PI * f) / rate;
      envelope[i] = amp;
      signal[i] = amp * Math.sin(phase);
    }
    return { signal, envelope, total };
  }

  // One pulse on its own, for the plot and the Arduino table.
  function renderPulse(rate) {
    const repeat = p.repeat;
    p.repeat = 1;
    const out = renderSequence(rate);
    p.repeat = repeat;
    return out;
  }

  // --- Plot ----------------------------------------------------------------------------
  const canvas = $("#hap-canvas");
  const view = fitCanvas(canvas, () => redraw());
  const PAD = { l: 42, r: 18, t: 34, b: 28 };
  const plot = () => ({ x: PAD.l, y: PAD.t, w: view.w - PAD.l - PAD.r, h: view.h - PAD.t - PAD.b });
  const toPx = (u, a) => {
    const r = plot();
    return [r.x + u * r.w, r.y + (1 - a) * r.h];
  };
  const fromPx = (x, y) => {
    const r = plot();
    return [(x - r.x) / r.w, 1 - (y - r.y) / r.h];
  };
  let playhead = -1;
  let hoverIdx = -1;

  function redraw() {
    const { ctx, w, h } = view;
    const r = plot();
    ctx.clearRect(0, 0, w, h);
    const mid = r.y + r.h / 2;

    // Grid and axes.
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    [0, 0.5, 1].forEach((a) => {
      const y = r.y + (1 - a) * r.h;
      ctx.strokeStyle = `rgba(${pal.ink}, ${a === 0 ? 0.16 : 0.07})`;
      ctx.lineWidth = 1;
      ctx.setLineDash(a === 0 ? [] : [3, 4]);
      ctx.beginPath();
      ctx.moveTo(r.x, y);
      ctx.lineTo(r.x + r.w, y);
      ctx.stroke();
      ctx.fillStyle = `rgba(${pal.ink}, 0.4)`;
      ctx.fillText(a.toFixed(1), r.x - 8, y);
    });
    ctx.setLineDash([]);
    const step = niceStep(p.dur);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let t = 0; t <= p.dur + 1e-6; t += step) {
      const x = r.x + (t / p.dur) * r.w;
      ctx.strokeStyle = `rgba(${pal.ink}, 0.06)`;
      ctx.beginPath();
      ctx.moveTo(x, r.y);
      ctx.lineTo(x, r.y + r.h);
      ctx.stroke();
      ctx.fillStyle = `rgba(${pal.ink}, 0.4)`;
      ctx.fillText(`${Math.round(t)}`, x, r.y + r.h + 8);
    }
    ctx.textAlign = "right";
    ctx.fillText("ms", r.x + r.w + PAD.r - 2, r.y + r.h + 8);

    // Waveform: min/max per pixel column over one pulse, mirrored about the midline.
    const rate = Math.max(8000, Math.min(48000, (r.w / (p.dur / 1000)) * 24));
    const { signal, envelope } = renderPulse(rate);
    const perPx = signal.length / r.w;
    ctx.strokeStyle = `rgba(${pal.blue}, 0.55)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < r.w; x++) {
      let lo = 0;
      let hi = 0;
      const i0 = Math.floor(x * perPx);
      const i1 = Math.max(i0 + 1, Math.floor((x + 1) * perPx));
      for (let i = i0; i < i1 && i < signal.length; i++) {
        if (signal[i] < lo) lo = signal[i];
        if (signal[i] > hi) hi = signal[i];
      }
      const px = r.x + x + 0.5;
      ctx.moveTo(px, mid - hi * (r.h / 2));
      ctx.lineTo(px, mid - lo * (r.h / 2) + 0.01);
    }
    ctx.stroke();

    // For an ERM, show the lagging envelope the motor actually delivers.
    if (actuator.get() === "erm") {
      ctx.strokeStyle = `rgba(${pal.ink}, 0.55)`;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let x = 0; x <= r.w; x++) {
        const i = Math.min(envelope.length - 1, Math.floor(x * perPx));
        const y = r.y + (1 - envelope[i]) * r.h;
        if (x) ctx.lineTo(r.x + x, y);
        else ctx.moveTo(r.x + x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Envelope and its breakpoints, in gold.
    const pts = p.points.map(([u, a]) => toPx(u, a));
    const grad = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    grad.addColorStop(0, `rgba(${pal.gold}, 0.22)`);
    grad.addColorStop(1, `rgba(${pal.gold}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], r.y + r.h);
    pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(pts[pts.length - 1][0], r.y + r.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgb(${pal.gold})`;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    pts.forEach(([x, y], i) => {
      const hot = i === hoverIdx || (drag && drag.i === i);
      ctx.fillStyle = hot ? `rgb(${pal.gold})` : `rgb(${pal.stage})`;
      ctx.strokeStyle = `rgb(${pal.gold})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, y, hot ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Header: carrier and sequence.
    ctx.font = "500 11px 'IBM Plex Mono', monospace";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = `rgba(${pal.ink}, 0.72)`;
    const a = actuator.get();
    const carrier = a === "erm" ? `ERM ≈ ${ermFreq(0).toFixed(0)}–${ermFreq(1).toFixed(0)} Hz with speed` : a === "vc" && p.freq2 ? `${p.freq} → ${p.freq2} Hz sweep` : `${p.freq} Hz`;
    ctx.fillText(`${p.name} · ${carrier}${p.repeat > 1 ? ` · ×${p.repeat}, ${p.gap} ms gaps` : ""}`, r.x, 17);

    if (playhead >= 0) {
      const x = r.x + playhead * r.w;
      ctx.strokeStyle = `rgba(${pal.gold}, 0.9)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, r.y - 6);
      ctx.lineTo(x, r.y + r.h);
      ctx.stroke();
    }
  }

  function niceStep(ms) {
    const target = ms / 6;
    const pow = Math.pow(10, Math.floor(Math.log10(target)));
    const m = target / pow;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * pow;
  }

  // --- Editing the envelope ---------------------------------------------------------------
  let drag = null;
  const local = (e) => {
    const b = canvas.getBoundingClientRect();
    return [e.clientX - b.left, e.clientY - b.top];
  };
  const hit = (x, y) => {
    let best = -1;
    let bestD = 12;
    p.points.forEach(([u, a], i) => {
      const [px, py] = toPx(u, a);
      const d = Math.hypot(px - x, py - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  canvas.addEventListener("pointerdown", (e) => {
    const [x, y] = local(e);
    let i = hit(x, y);
    if (i < 0) {
      const [u, a] = fromPx(x, y);
      if (u <= 0.001 || u >= 0.999) return;
      i = p.points.findIndex(([pu]) => pu > u);
      p.points.splice(i, 0, [u, clamp(a, 0, 1)]);
      markCustom();
    }
    drag = { i };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("is-dragging");
    redraw();
    stats();
  });
  canvas.addEventListener("pointermove", (e) => {
    const [x, y] = local(e);
    if (!drag) {
      const i = hit(x, y);
      if (i !== hoverIdx) {
        hoverIdx = i;
        canvas.classList.toggle("on-point", i >= 0);
        redraw();
      }
      return;
    }
    const [u, a] = fromPx(x, y);
    const pts = p.points;
    const i = drag.i;
    const first = i === 0;
    const lastPt = i === pts.length - 1;
    const minU = first ? 0 : pts[i - 1][0] + 0.002;
    const maxU = lastPt ? 1 : pts[i + 1][0] - 0.002;
    pts[i] = [first ? 0 : lastPt ? 1 : clamp(u, minU, maxU), clamp(a, 0, 1)];
    markCustom();
    redraw();
    stats();
  });
  const endDrag = () => {
    drag = null;
    canvas.classList.remove("is-dragging");
    redraw();
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("dblclick", (e) => {
    const [x, y] = local(e);
    const i = hit(x, y);
    if (i > 0 && i < p.points.length - 1) {
      p.points.splice(i, 1);
      hoverIdx = -1;
      markCustom();
      redraw();
      stats();
    }
  });

  // --- Playback ------------------------------------------------------------------------------
  let audio = null;
  let source = null;
  let raf = 0;
  const playBtn = $("#hap-play");

  function stop() {
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch (err) {
        /* already stopped */
      }
    }
    source = null;
    cancelAnimationFrame(raf);
    playhead = -1;
    playBtn.classList.remove("is-playing");
    playBtn.querySelector(".play-label").textContent = "Play";
    redraw();
  }

  function play() {
    stop();
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
      return;
    }
    if (audio.state === "suspended") audio.resume();
    const { signal, total } = renderSequence(audio.sampleRate);
    const buffer = audio.createBuffer(1, signal.length, audio.sampleRate);
    buffer.copyToChannel(normalize(signal, 0.9), 0);
    source = audio.createBufferSource();
    source.buffer = buffer;
    source.connect(audio.destination);
    const t0 = audio.currentTime + 0.02;
    source.start(t0);
    source.onended = stop;
    playBtn.classList.add("is-playing");
    playBtn.querySelector(".play-label").textContent = "Stop";
    const pulse = p.dur / 1000;
    const period = pulse + (p.repeat > 1 ? p.gap / 1000 : 0);
    const tick = () => {
      const t = audio.currentTime - t0;
      if (t > total) return;
      const localT = ((t % period) + period) % period;
      playhead = t >= 0 && localT < pulse ? localT / pulse : -1;
      redraw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function normalize(signal, peak) {
    let max = 0;
    for (let i = 0; i < signal.length; i++) max = Math.max(max, Math.abs(signal[i]));
    if (max < 1e-9) return signal;
    const out = new Float32Array(signal.length);
    for (let i = 0; i < signal.length; i++) out[i] = (signal[i] / max) * peak;
    return out;
  }

  playBtn.addEventListener("click", () => (source ? stop() : play()));

  // navigator.vibrate is on/off only, so the envelope becomes runs above a threshold.
  function vibratePattern() {
    const { envelope } = renderSequence(1000);
    const runs = [];
    let on = false;
    let len = 0;
    for (let i = 0; i < envelope.length; i++) {
      const now = envelope[i] > 0.25;
      if (now === on) len++;
      else {
        runs.push(len);
        on = now;
        len = 1;
      }
    }
    runs.push(len);
    // runs[0] is always an "off" stretch, but the API starts with "vibrate":
    // drop it if empty, otherwise lead with a zero-length vibration.
    if (runs[0] === 0) runs.shift();
    else runs.unshift(0);
    return runs;
  }

  const vib = $("#hap-vibrate");
  if ("vibrate" in navigator && window.matchMedia("(pointer: coarse)").matches) {
    vib.hidden = false;
    vib.addEventListener("click", () => navigator.vibrate(vibratePattern()));
  }

  // --- Export ------------------------------------------------------------------------------
  const slug = () => p.name.toLowerCase().replace(/\(edited\)/, "custom").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function wav() {
    const rate = 48000;
    const { signal } = renderSequence(rate);
    const data = normalize(signal, 0.9);
    const bytes = 44 + data.length * 2;
    const buf = new ArrayBuffer(bytes);
    const v = new DataView(buf);
    const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    str(0, "RIFF");
    v.setUint32(4, bytes - 8, true);
    str(8, "WAVE");
    str(12, "fmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); // PCM
    v.setUint16(22, 1, true); // mono
    v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    str(36, "data");
    v.setUint32(40, data.length * 2, true);
    for (let i = 0; i < data.length; i++) v.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, data[i])) * 32767), true);
    download(`${slug()}.wav`, new Blob([buf], { type: "audio/wav" }));
  }

  function arduino() {
    const STEP = 5; // ms
    const { envelope } = renderPulse(1000 / STEP);
    const duty = Array.from(envelope, (a) => Math.round(a * 255));
    const rows = [];
    for (let i = 0; i < duty.length; i += 16) rows.push("  " + duty.slice(i, i + 16).join(", "));
    const a = actuator.get();
    const note =
      a === "erm"
        ? "// ERM: PWM sets motor voltage, so speed and frequency follow the envelope.\n"
        : a === "lra"
        ? `// LRA: this table is the amplitude envelope. Let a driver IC (e.g. DRV2605L in\n// real-time playback mode) hold the ${p.freq} Hz resonance and feed it these values.\n`
        : "// Voice coil: the table is the envelope only. For the full waveform, play the WAV\n// export through an audio amplifier instead.\n";
    return `// "${p.name}", from berkonas.github.io/bored.html#haptics
${note}// Drive the actuator through a transistor or motor driver, never straight from the pin.
#include <avr/pgmspace.h>

const uint8_t MOTOR_PIN = 9;       // any PWM pin
const uint8_t STEP_MS = ${STEP};
const uint8_t REPEAT = ${p.repeat};
const uint16_t GAP_MS = ${p.repeat > 1 ? p.gap : 0};
const uint16_t STEPS = ${duty.length};
const uint8_t PATTERN[STEPS] PROGMEM = {
${rows.join(",\n")}
};

void playPattern() {
  for (uint8_t r = 0; r < REPEAT; r++) {
    for (uint16_t i = 0; i < STEPS; i++) {
      analogWrite(MOTOR_PIN, pgm_read_byte(&PATTERN[i]));
      delay(STEP_MS);
    }
    analogWrite(MOTOR_PIN, 0);
    if (r + 1 < REPEAT) delay(GAP_MS);
  }
}

void setup() {
  pinMode(MOTOR_PIN, OUTPUT);
}

void loop() {
  playPattern();
  delay(1500);
}
`;
  }

  function json() {
    const a = actuator.get();
    return prettyJSON({
      name: p.name,
      actuator: { lra: "LRA", vc: "voice coil", erm: "ERM" }[a],
      duration_ms: p.dur,
      carrier_hz: a === "erm" ? null : p.freq,
      sweep_to_hz: a === "vc" && p.freq2 ? p.freq2 : null,
      repeat: p.repeat,
      gap_ms: p.repeat > 1 ? p.gap : 0,
      envelope: p.points.map(([u, amp]) => [Math.round(u * p.dur * 10) / 10, Math.round(amp * 1000) / 1000]),
      envelope_units: ["ms", "amplitude 0-1"],
    });
  }

  root.querySelectorAll("[data-export]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const kind = btn.dataset.export;
      if (kind === "wav") wav();
      if (kind === "arduino") copyText(arduino(), "Arduino sketch copied");
      if (kind === "vibrate") copyText(`navigator.vibrate([${vibratePattern().join(", ")}]);`, "Copied");
      if (kind === "json") copyText(json(), "Pattern copied");
    })
  );

  // --- Stats and advice ----------------------------------------------------------------------
  function stats() {
    const { envelope, total } = renderSequence(1000);
    let sum = 0;
    let onMs = 0;
    let shortest = Infinity;
    let run = 0;
    for (let i = 0; i < envelope.length; i++) {
      sum += envelope[i] * envelope[i];
      if (envelope[i] > 0.25) {
        onMs++;
        run++;
      } else if (run) {
        shortest = Math.min(shortest, run);
        run = 0;
      }
    }
    if (run) shortest = Math.min(shortest, run);
    const rms = Math.sqrt(sum / envelope.length);
    const a = actuator.get();
    const tips = [];
    if (a === "erm" && shortest < 40) tips.push(`A ${shortest} ms pulse is shorter than a typical ERM spin-up; it will feel soft.`);
    if (a === "lra" && (p.freq < 150 || p.freq > 240)) tips.push("Most LRAs resonate between 150 and 235 Hz; check your part’s datasheet.");
    if (a !== "erm" && p.freq < 60) tips.push("Below about 50 Hz the skin reads flutter rather than vibration.");
    if (a !== "erm" && Math.min(p.freq, p.freq2 || p.freq) < 150) tips.push("Laptop speakers barely play this carrier; use headphones or the actuator itself.");
    $("#hap-stats").innerHTML =
      `<span>Total <b>${fmt(total * 1000, 0)} ms</b></span><span>On time <b>${Math.round((onMs / envelope.length) * 100)}%</b></span><span>RMS amplitude <b>${fmt(rms, 2)}</b></span><span>Shortest pulse <b>${Number.isFinite(shortest) ? `${shortest} ms` : "—"}</b></span>` +
      tips.map((t) => `<span class="warn">${t}</span>`).join("");
  }

  syncControls();
  redraw();
  return { show: () => redraw(), hide: () => stop() };
}
