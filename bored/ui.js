// Small pieces shared by the workbench tools: segmented controls, a safe
// expression parser for number fields, copy-to-clipboard, file downloads.

// Wire a radiogroup of buttons. Returns a getter for the current value.
export function segmented(root, attr, onChange) {
  const buttons = Array.from(root.querySelectorAll(`[data-${attr}]`));
  let value = (buttons.find((b) => b.getAttribute("aria-checked") === "true") || buttons[0]).dataset[toCamel(attr)];
  const set = (next, silent) => {
    value = next;
    buttons.forEach((b) => {
      const on = b.dataset[toCamel(attr)] === next;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    if (!silent) onChange?.(value);
  };
  buttons.forEach((b, i) => {
    b.addEventListener("click", () => set(b.dataset[toCamel(attr)]));
    b.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = buttons[(i + d + buttons.length) % buttons.length];
      next.focus();
      set(next.dataset[toCamel(attr)]);
    });
  });
  set(value, true);
  return { get: () => value, set };
}

function toCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// Numbers with a little arithmetic: + - * / ^, parentheses, pi, e, and a few
// functions. No eval: a tiny recursive-descent parser.
const FUNCS = {
  sqrt: Math.sqrt,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  abs: Math.abs,
  deg: (x) => (x * Math.PI) / 180,
  rad: (x) => (x * 180) / Math.PI,
};
const CONSTS = { pi: Math.PI, π: Math.PI, e: Math.E, tau: 2 * Math.PI };

export function parseNumber(text) {
  const src = String(text).trim().replace(/−/g, "-").replace(/×/g, "*").replace(/,/g, ".");
  if (!src) return NaN;
  let i = 0;
  const peek = () => src[i];
  const skip = () => {
    while (src[i] === " ") i++;
  };
  function expr() {
    let v = term();
    for (;;) {
      skip();
      if (peek() === "+") {
        i++;
        v += term();
      } else if (peek() === "-") {
        i++;
        v -= term();
      } else return v;
    }
  }
  function term() {
    let v = power();
    for (;;) {
      skip();
      if (peek() === "*") {
        i++;
        v *= power();
      } else if (peek() === "/") {
        i++;
        v /= power();
      } else return v;
    }
  }
  function power() {
    const base = unary();
    skip();
    if (peek() === "^") {
      i++;
      return Math.pow(base, power());
    }
    return base;
  }
  function unary() {
    skip();
    if (peek() === "-") {
      i++;
      return -unary();
    }
    if (peek() === "+") {
      i++;
      return unary();
    }
    return atom();
  }
  function atom() {
    skip();
    if (peek() === "(") {
      i++;
      const v = expr();
      skip();
      if (peek() !== ")") throw new Error("paren");
      i++;
      return v;
    }
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(src.slice(i));
    if (num) {
      i += num[0].length;
      return parseFloat(num[0]);
    }
    const word = /^[a-zπ]+/i.exec(src.slice(i));
    if (word) {
      const w = word[0].toLowerCase();
      i += word[0].length;
      if (w in CONSTS) return CONSTS[w];
      if (w in FUNCS) {
        skip();
        if (peek() !== "(") throw new Error("call");
        i++;
        const v = expr();
        skip();
        if (peek() !== ")") throw new Error("paren");
        i++;
        return FUNCS[w](v);
      }
    }
    throw new Error("token");
  }
  try {
    const v = expr();
    skip();
    return i === src.length && Number.isFinite(v) ? v : NaN;
  } catch (err) {
    return NaN;
  }
}

// Fixed decimals without "-0.000".
export function fmt(v, digits) {
  const s = v.toFixed(digits);
  return /^-0\.?0*$/.test(s) ? s.slice(1) : s;
}

let toastTimer = 0;
export function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-on"), 1800);
}

export async function copyText(text, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label} to the clipboard`);
  } catch (err) {
    // Clipboard blocked: fall back to a selectable prompt.
    window.prompt("Copy this:", text);
  }
}

export function download(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Read theme colours from the site tokens so canvases match the CSS.
export function palette() {
  const css = getComputedStyle(document.documentElement);
  const rgb = (name, fallback) => (css.getPropertyValue(name).trim() || fallback).split(/\s+/).join(", ");
  return {
    ink: rgb("--on-stage-rgb", "232 237 244"),
    gold: rgb("--accent-rgb", "255 98 36"),
    blue: rgb("--blue-rgb", "196 198 204"),
    stage: rgb("--stage-rgb", "9 21 38"),
  };
}

// A canvas that tracks its element's size at device resolution.
export function fitCanvas(canvas, onResize) {
  const ctx = canvas.getContext("2d");
  const state = { w: 1, h: 1, dpr: 1, ctx };
  // The first measurement is synchronous and silent, so callers can finish
  // setting up; the observer's first callback then triggers the first draw.
  const resize = (notify = true) => {
    const r = canvas.getBoundingClientRect();
    state.w = Math.max(1, r.width);
    state.h = Math.max(1, r.height);
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(state.w * state.dpr);
    canvas.height = Math.round(state.h * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    if (notify) onResize?.(state);
  };
  new ResizeObserver(() => resize()).observe(canvas);
  resize(false);
  return state;
}

// JSON with two-space indents, but short arrays of numbers kept on one line.
export function prettyJSON(value) {
  return JSON.stringify(value, null, 2).replace(/\[\s+([-\d.e,\s]+?)\s+\]/g, (_, inner) => `[${inner.split(/,\s*/).join(", ")}]`);
}
