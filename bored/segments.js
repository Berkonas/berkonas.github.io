// 02 · Body segment calculator.
// de Leva P. (1996) J Biomech 29(9):1223–1230, Table 4 (first set of endpoints).
// Lengths in mm for the reference subjects; everything else in % :
// mass of body mass, CM position of segment length from the origin endpoint,
// radii of gyration (sagittal, transverse, longitudinal) of segment length.
import { segmented, parseNumber, fmt, copyText, download, prettyJSON } from "./ui.js?v=20261006";

const REF = {
  F: { stature: 1.735, label: "female" },
  M: { stature: 1.741, label: "male" },
};

const SEGMENTS = [
  { id: "head", name: "Head and neck", ends: ["VERT", "MIDG"], L: [200.2, 203.3], m: [6.68, 6.94], cm: [58.94, 59.76], r: [[33.0, 35.9, 31.8], [36.2, 37.6, 31.2]] },
  { id: "trunk", name: "Trunk", ends: ["SUPR", "MIDH"], L: [529.3, 531.9], m: [42.57, 43.46], cm: [41.51, 44.86], r: [[35.7, 33.9, 17.1], [37.2, 34.7, 19.1]] },
  { id: "upt", name: "Upper trunk", sub: true, ends: ["SUPR", "XYPH"], L: [142.5, 170.7], m: [15.45, 15.96], cm: [20.77, 29.99], r: [[74.6, 50.2, 71.8], [71.6, 45.4, 65.9]] },
  { id: "mpt", name: "Middle trunk", sub: true, ends: ["XYPH", "OMPH"], L: [205.3, 215.5], m: [14.65, 16.33], cm: [45.12, 45.02], r: [[43.3, 35.4, 41.5], [48.2, 38.3, 46.8]] },
  { id: "lpt", name: "Lower trunk", sub: true, ends: ["OMPH", "MIDH"], L: [181.5, 145.7], m: [12.47, 11.17], cm: [49.2, 61.15], r: [[43.3, 40.2, 44.4], [61.5, 55.1, 58.7]] },
  { id: "upperarm", name: "Upper arm", side: true, ends: ["SJC", "EJC"], L: [275.1, 281.7], m: [2.55, 2.71], cm: [57.54, 57.72], r: [[27.8, 26.0, 14.8], [28.5, 26.9, 15.8]] },
  { id: "forearm", name: "Forearm", side: true, ends: ["EJC", "WJC"], L: [264.3, 268.9], m: [1.38, 1.62], cm: [45.59, 45.74], r: [[26.1, 25.7, 9.4], [27.6, 26.5, 12.1]] },
  { id: "hand", name: "Hand", side: true, ends: ["WJC", "MET3"], L: [78.0, 86.2], m: [0.56, 0.61], cm: [74.74, 79.0], r: [[53.1, 45.4, 33.5], [62.8, 51.3, 40.1]] },
  { id: "thigh", name: "Thigh", side: true, ends: ["HJC", "KJC"], L: [368.5, 422.2], m: [14.78, 14.16], cm: [36.12, 40.95], r: [[36.9, 36.4, 16.2], [32.9, 32.9, 14.9]] },
  { id: "shank", name: "Shank", side: true, ends: ["KJC", "LMAL"], L: [432.3, 434.0], m: [4.81, 4.33], cm: [44.16, 44.59], r: [[27.1, 26.7, 9.3], [25.5, 24.9, 10.3]] },
  { id: "foot", name: "Foot", side: true, ends: ["HEEL", "TTIP"], L: [228.3, 258.1], m: [1.29, 1.37], cm: [40.14, 44.15], r: [[29.9, 27.9, 13.9], [25.7, 24.5, 12.4]] },
];
const SUBS = ["upt", "mpt", "lpt"];
const IN = 0.0254;
const LB = 0.45359237;

const sig = (v, n = 4) => (v === 0 ? "0" : Number(v.toPrecision(n)).toString());

export function init(root) {
  const $ = (sel) => root.querySelector(sel);
  const measured = {}; // id -> length in m, typed by the user

  const sex = segmented($(".subject"), "sex", update);
  const hUnit = segmented($(".subject"), "hunit", (u) => convertInput($("#seg-height"), u === "in" ? 1 / 2.54 : 2.54, 1));
  const mUnit = segmented($(".subject"), "munit", (u) => convertInput($("#seg-mass"), u === "lb" ? 1 / LB : LB, 1));

  function convertInput(input, factor, digits) {
    const v = parseNumber(input.value);
    if (Number.isFinite(v)) input.value = fmt(v * factor, digits);
    update();
  }

  function subject() {
    const h = parseNumber($("#seg-height").value);
    const m = parseNumber($("#seg-mass").value);
    const H = hUnit.get() === "in" ? h * IN : h / 100;
    const M = mUnit.get() === "lb" ? m * LB : m;
    const okH = Number.isFinite(H) && H > 0.5 && H < 2.6;
    const okM = Number.isFinite(M) && M > 5 && M < 400;
    $("#seg-height").toggleAttribute("aria-invalid", !okH);
    $("#seg-mass").toggleAttribute("aria-invalid", !okM);
    return okH && okM ? { H, M, sex: sex.get() } : null;
  }

  // All parameters for the current subject, in SI units.
  function compute(sub) {
    const k = sub.sex === "F" ? 0 : 1;
    const scale = sub.H / REF[sub.sex].stature;
    const scaled = (s) => (s.L[k] / 1000) * scale;
    const trunk = SEGMENTS.find((s) => s.id === "trunk");
    // A measured trunk stretches its three parts in proportion.
    const trunkFactor = measured.trunk ? measured.trunk / scaled(trunk) : 1;
    return SEGMENTS.map((s) => {
      const auto = scaled(s) * (SUBS.includes(s.id) ? trunkFactor : 1);
      const L = measured[s.id] || auto;
      const mass = (s.m[k] / 100) * sub.M;
      const cm = (s.cm[k] / 100) * L;
      const I = s.r[k].map((r) => mass * ((r / 100) * L) ** 2);
      return { ...s, L, auto, mass, cm, cmPct: s.cm[k], massPct: s.m[k], I, isMeasured: Boolean(measured[s.id]) };
    });
  }

  // --- Table -------------------------------------------------------------------
  const body = $("#seg-body");
  body.innerHTML = SEGMENTS.map(
    (s) => `<tr data-seg="${s.id}" class="${s.sub ? "is-sub" : ""}">
      <th scope="row" class="seg-name"><b>${s.name}${s.side ? '<span class="side-tag">each side</span>' : ""}</b><span>${s.ends[0]} → ${s.ends[1]}</span></th>
      <td class="n"><input class="len-input" type="text" inputmode="decimal" aria-label="${s.name} length in metres" data-len="${s.id}" /></td>
      <td class="n" data-col="mass"></td>
      <td class="n" data-col="cm"></td>
      <td class="n" data-col="i0"></td>
      <td class="n" data-col="i1"></td>
      <td class="n" data-col="i2"></td>
    </tr>`
  ).join("");

  body.addEventListener("input", (e) => {
    const input = e.target.closest("[data-len]");
    if (!input) return;
    const id = input.dataset.len;
    const text = input.value.trim();
    if (!text) {
      delete measured[id];
      input.removeAttribute("aria-invalid");
    } else {
      const v = parseNumber(text);
      if (Number.isFinite(v) && v > 0.01 && v < 1.5) {
        measured[id] = v;
        input.removeAttribute("aria-invalid");
      } else {
        input.setAttribute("aria-invalid", "true");
        return;
      }
    }
    update(id);
  });
  body.addEventListener("focusout", (e) => {
    if (e.target.closest("[data-len]")) update();
  });

  let last = null;
  function update(editing) {
    const sub = subject();
    if (!sub) return;
    const rows = compute(sub);
    last = { sub, rows };
    rows.forEach((r) => {
      const tr = body.querySelector(`[data-seg="${r.id}"]`);
      const input = tr.querySelector("[data-len]");
      if (editing !== r.id && document.activeElement !== input) input.value = fmt(r.L, 3);
      input.classList.toggle("is-measured", r.isMeasured);
      input.title = r.isMeasured ? `Measured. Clear the field to use the scaled ${fmt(r.auto, 3)} m.` : "Scaled from stature. Type a measured length to override.";
      tr.querySelector('[data-col="mass"]').textContent = fmt(r.mass, 3);
      tr.querySelector('[data-col="cm"]').textContent = `${fmt(r.cm, 3)}`;
      tr.querySelector('[data-col="cm"]').title = `${fmt(r.cmPct, 2)}% of the length from ${r.ends[0]}`;
      r.I.forEach((v, i) => (tr.querySelector(`[data-col="i${i}"]`).textContent = sig(v)));
    });
    const total = rows.filter((r) => !r.sub).reduce((sum, r) => sum + r.mass * (r.side ? 2 : 1), 0);
    const com = wholeBodyCom(sub, rows);
    $("#seg-total").innerHTML = `<th scope="row" class="seg-name"><b>Whole body</b><span>limbs counted twice</span></th>
      <td class="n">${fmt(sub.H, 3)}</td><td class="n">${fmt(total, 2)}</td>
      <td class="n" title="Height of the whole-body center of mass in the standing pose drawn here">${fmt(com, 3)}</td>
      <td class="n" colspan="3">CM ${fmt((com / sub.H) * 100, 1)}% of stature, standing</td>`;
    drawFigure(sub, rows);
  }

  // Heights (m) of the landmarks in a relaxed standing pose.
  function landmarks(sub, rows) {
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    const ankle = 0.039 * sub.H; // lateral malleolus height, Winter's proportion
    const knee = ankle + by.shank.L;
    const hip = knee + by.thigh.L;
    const supr = hip + by.trunk.L;
    const xyph = supr - by.upt.L;
    const omph = xyph - by.mpt.L;
    const vert = sub.H;
    const midg = vert - by.head.L;
    const sjc = supr - 0.012 * sub.H;
    const ejc = sjc - by.upperarm.L;
    const wjc = ejc - by.forearm.L;
    const met3 = wjc - by.hand.L;
    return { by, ankle, knee, hip, supr, xyph, omph, vert, midg, sjc, ejc, wjc, met3 };
  }

  // Height of each segment's center of mass, weighted by mass.
  function wholeBodyCom(sub, rows) {
    const p = landmarks(sub, rows);
    const { by } = p;
    const parts = [
      [by.head, p.vert - by.head.cm],
      [by.trunk, p.supr - by.trunk.cm],
      [by.upperarm, p.sjc - by.upperarm.cm, 2],
      [by.forearm, p.ejc - by.forearm.cm, 2],
      [by.hand, p.wjc - by.hand.cm, 2],
      [by.thigh, p.hip - by.thigh.cm, 2],
      [by.shank, p.knee - by.shank.cm, 2],
      [by.foot, p.ankle * 0.45, 2],
    ];
    const m = parts.reduce((s, [r, , n = 1]) => s + r.mass * n, 0);
    return parts.reduce((s, [r, y, n = 1]) => s + r.mass * n * y, 0) / m;
  }

  // --- Figure --------------------------------------------------------------------
  const svg = $("#seg-figure");
  const NS = "http://www.w3.org/2000/svg";
  let hovered = null;

  function drawFigure(sub, rows) {
    const p = landmarks(sub, rows);
    const { by } = p;
    const top = 14;
    const floor = 404;
    const ppm = (floor - top) / sub.H;
    const Y = (h) => floor - h * ppm;
    const cx = 108;
    const hipW = 0.052 * sub.H * ppm;
    const shW = 0.108 * sub.H * ppm;
    const parts = [];
    const el = (tag, attrs, seg) => {
      const node = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      if (seg) node.dataset.part = seg;
      parts.push(node);
      return node;
    };
    const limb = (seg, x0, y0, x1, y1, w) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * (w / 2);
      const ny = (dx / len) * (w / 2);
      const d = `M${x0 + nx},${y0 + ny} L${x1 + nx},${y1 + ny} A${w / 2},${w / 2} 0 0 1 ${x1 - nx},${y1 - ny} L${x0 - nx},${y0 - ny} A${w / 2},${w / 2} 0 0 1 ${x0 + nx},${y0 + ny}Z`;
      el("path", { d, class: "seg-seg" }, seg);
    };
    const com = (seg, x, y) => {
      const g = el("g", { class: "seg-com", transform: `translate(${x} ${y})` }, seg);
      g.innerHTML = `<circle r="4.2" fill="var(--stage)" stroke="var(--accent)" stroke-width="1.1"/><path d="M0 0V-4.2A4.2 4.2 0 0 1 4.2 0Z M0 0V4.2A4.2 4.2 0 0 1 -4.2 0Z" fill="var(--accent)"/>`;
    };

    // Floor and stature dimension.
    el("line", { x1: 20, y1: floor, x2: 196, y2: floor, class: "seg-dim" });
    const dimX = 222;
    el("line", { x1: dimX, y1: Y(sub.H), x2: dimX, y2: floor, class: "seg-dim" });
    el("line", { x1: dimX - 4, y1: Y(sub.H), x2: dimX + 4, y2: Y(sub.H), class: "seg-dim" });
    el("line", { x1: dimX - 4, y1: floor, x2: dimX + 4, y2: floor, class: "seg-dim" });
    const t = el("text", { x: dimX - 6, y: (Y(sub.H) + floor) / 2, class: "seg-dim-text", transform: `rotate(-90 ${dimX - 6} ${(Y(sub.H) + floor) / 2})`, "text-anchor": "middle" });
    t.textContent = `${fmt(sub.H, 3)} m`;

    // Trunk, split into its three parts.
    const trunkPoly = (yTop, yBot, wTop, wBot, seg) =>
      el("path", { d: `M${cx - wTop},${yTop} L${cx + wTop},${yTop} L${cx + wBot},${yBot} L${cx - wBot},${yBot}Z`, class: "seg-seg" }, seg);
    const wAt = (h) => {
      const f = (h - p.hip) / (p.supr - p.hip);
      return hipW * 1.35 + (shW * 0.82 - hipW * 1.35) * Math.max(0, Math.min(1, f)) ** 0.8;
    };
    trunkPoly(Y(p.supr), Y(p.xyph), wAt(p.supr), wAt(p.xyph), "upt");
    trunkPoly(Y(p.xyph), Y(p.omph), wAt(p.xyph), wAt(p.omph), "mpt");
    trunkPoly(Y(p.omph), Y(p.hip), wAt(p.omph), wAt(p.hip), "lpt");

    // Neck (not a segment of its own here) and head.
    el("line", { x1: cx, y1: Y(p.supr), x2: cx, y2: Y(p.midg), stroke: "rgb(var(--on-stage-rgb) / 0.3)", "stroke-width": 7, "stroke-linecap": "round" });
    el("ellipse", { cx, cy: (Y(p.vert) + Y(p.midg)) / 2, rx: 0.058 * sub.H * ppm, ry: (by.head.L * ppm) / 2, class: "seg-seg" }, "head");

    // Limbs, both sides.
    [-1, 1].forEach((s) => {
      const sx = cx + s * shW;
      const tilt = 0.07;
      const ex = sx + s * by.upperarm.L * ppm * tilt;
      const wx = ex + s * by.forearm.L * ppm * 0.04;
      const mx = wx + s * by.hand.L * ppm * 0.02;
      limb("upperarm", sx, Y(p.sjc), ex, Y(p.ejc), 0.05 * sub.H * ppm);
      limb("forearm", ex, Y(p.ejc), wx, Y(p.wjc), 0.04 * sub.H * ppm);
      limb("hand", wx, Y(p.wjc), mx, Y(p.met3), 0.036 * sub.H * ppm);
      const hx = cx + s * hipW;
      const kx = cx + s * hipW * 0.86;
      const ax = cx + s * hipW * 0.8;
      limb("thigh", hx, Y(p.hip), kx, Y(p.knee), 0.074 * sub.H * ppm);
      limb("shank", kx, Y(p.knee), ax, Y(p.ankle), 0.052 * sub.H * ppm);
      const fw = 0.034 * sub.H * ppm;
      el("path", { d: `M${ax - fw * 0.6},${Y(p.ankle)} L${ax + fw * 0.6},${Y(p.ankle)} L${ax + s * fw * 0.5 + fw * 0.9},${floor} L${ax + s * fw * 0.5 - fw * 0.9},${floor}Z`, class: "seg-seg" }, "foot");

      const along = (x0, y0, x1, y1, f) => [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f];
      com("upperarm", ...along(sx, Y(p.sjc), ex, Y(p.ejc), by.upperarm.cmPct / 100));
      com("forearm", ...along(ex, Y(p.ejc), wx, Y(p.wjc), by.forearm.cmPct / 100));
      com("hand", ...along(wx, Y(p.wjc), mx, Y(p.met3), by.hand.cmPct / 100));
      com("thigh", ...along(hx, Y(p.hip), kx, Y(p.knee), by.thigh.cmPct / 100));
      com("shank", ...along(kx, Y(p.knee), ax, Y(p.ankle), by.shank.cmPct / 100));
      com("foot", ax + s * fw * 0.3, (Y(p.ankle) + floor) / 2 + 1);
    });
    com("head", cx, Y(p.vert - by.head.cm));
    com("trunk", cx, Y(p.supr - by.trunk.cm));
    com("upt", cx, Y(p.supr - by.upt.cm));
    com("mpt", cx, Y(p.xyph - by.mpt.cm));
    com("lpt", cx, Y(p.omph - by.lpt.cm));

    svg.replaceChildren(...parts);
    applyHover();
  }

  function partsFor(id) {
    if (id === "trunk") return ["upt", "mpt", "lpt", "trunk"];
    return [id];
  }

  function applyHover() {
    const on = hovered ? partsFor(hovered) : [];
    svg.querySelectorAll("[data-part]").forEach((node) => {
      const part = node.dataset.part;
      const lit = on.includes(part);
      if (node.classList.contains("seg-com")) {
        // At rest every main segment shows its CM faintly; hovering picks one.
        // The trunk row shows the trunk's own CM, not its parts'.
        node.classList.toggle("is-on", part === hovered);
        node.classList.toggle("is-dim", !hovered && !SUBS.includes(part));
      } else {
        node.classList.toggle("is-on", lit);
      }
    });
    body.querySelectorAll("tr").forEach((tr) => tr.classList.toggle("is-on", tr.dataset.seg === hovered));
    const r = hovered && last?.rows.find((x) => x.id === hovered);
    $("#seg-caption").innerHTML = r
      ? `<b>${r.name}</b>: ${fmt(r.L, 3)} m, ${fmt(r.mass, 2)} kg${r.side ? " each" : ""}. <span class="com-key" aria-hidden="true"></span>${fmt(r.cmPct, 1)}% from ${r.ends[0]}.`
      : `Hover a row or a segment. <span class="com-key" aria-hidden="true"></span> marks its center of mass.`;
  }

  const setHover = (id) => {
    if (hovered === id) return;
    hovered = id;
    applyHover();
  };
  body.addEventListener("pointerover", (e) => {
    const tr = e.target.closest("tr[data-seg]");
    if (tr) setHover(tr.dataset.seg);
  });
  body.addEventListener("focusin", (e) => {
    const tr = e.target.closest("tr[data-seg]");
    if (tr) setHover(tr.dataset.seg);
  });
  $(".seg-table").addEventListener("pointerleave", () => setHover(null));
  svg.addEventListener("pointerover", (e) => {
    const node = e.target.closest("[data-part]");
    if (node) setHover(node.dataset.part);
  });
  svg.addEventListener("pointerleave", () => setHover(null));

  $("#seg-height").addEventListener("input", () => update());
  $("#seg-mass").addEventListener("input", () => update());

  // --- Export --------------------------------------------------------------------
  function header() {
    const { sub } = last;
    return `de Leva (1996), ${REF[sub.sex].label}, stature ${fmt(sub.H, 3)} m, mass ${fmt(sub.M, 1)} kg. SI units; limbs are per side; I about the segment CM (sagittal, transverse, longitudinal).`;
  }
  const key = (id) => ({ upperarm: "upper_arm", upt: "upper_trunk", mpt: "middle_trunk", lpt: "lower_trunk" }[id] || id);

  function asText(format) {
    const { rows } = last;
    const n = (v) => sig(v, 5);
    if (format === "python") {
      const lines = rows.map(
        (r) => `    "${key(r.id)}": {"length": ${n(r.L)}, "mass": ${n(r.mass)}, "com": ${n(r.cm)}, "I": [${r.I.map(n).join(", ")}]},`
      );
      return `# ${header()}\nsegments = {\n${lines.join("\n")}\n}`;
    }
    if (format === "matlab") {
      const lines = rows.map(
        (r) => `seg.${key(r.id)} = struct('length', ${n(r.L)}, 'mass', ${n(r.mass)}, 'com', ${n(r.cm)}, 'I', [${r.I.map(n).join(" ")}]);`
      );
      return `% ${header()}\n${lines.join("\n")}`;
    }
    const out = {
      source: "de Leva P. (1996) J Biomech 29(9):1223-1230, Table 4",
      subject: { sex: last.sub.sex, stature_m: +last.sub.H.toFixed(4), mass_kg: +last.sub.M.toFixed(3) },
      units: { length: "m", mass: "kg", com: "m from origin endpoint", I: "kg·m² about CM: sagittal, transverse, longitudinal" },
      segments: Object.fromEntries(
        rows.map((r) => [key(r.id), { origin: r.ends[0], other: r.ends[1], per_side: Boolean(r.side), length: +n(r.L), mass: +n(r.mass), com: +n(r.cm), I: r.I.map((v) => +n(v)) }])
      ),
    };
    return prettyJSON(out);
  }

  $("#seg-copy").addEventListener("click", () => last && copyText(asText($("#seg-format").value), "Copied"));
  $("#seg-csv").addEventListener("click", () => {
    if (!last) return;
    const head = "segment,origin,other,per_side,length_m,mass_kg,com_from_origin_m,com_pct,I_sagittal_kgm2,I_transverse_kgm2,I_longitudinal_kgm2";
    const lines = last.rows.map((r) =>
      [key(r.id), r.ends[0], r.ends[1], r.side ? 1 : 0, sig(r.L, 5), sig(r.mass, 5), sig(r.cm, 5), r.cmPct, ...r.I.map((v) => sig(v, 5))].join(",")
    );
    const csv = `# ${header()}\n${head}\n${lines.join("\n")}\n`;
    const { sub } = last;
    download(`segments-deleva-${sub.sex}-${Math.round(sub.H * 100)}cm-${Math.round(sub.M)}kg.csv`, new Blob([csv], { type: "text/csv" }));
  });

  update();
  return { show: () => {} };
}
