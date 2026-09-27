// Bionic Playground entry. One WebGL renderer is shared by the three labs and
// moved into whichever tab is open; only that lab simulates and renders, and
// nothing runs while the page is hidden or scrolled out of view.
const tabs = Array.from(document.querySelectorAll(".lab-tab"));
const params = new URLSearchParams(location.search);

function showFallback(msg) {
  document.querySelectorAll(".stage-view").forEach((v) => {
    const p = document.createElement("p");
    p.className = "stage-fallback";
    p.textContent = msg;
    v.appendChild(p);
  });
}

function wireTabs(select) {
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
}

function showTab(name, focus) {
  tabs.forEach((t) => {
    const on = t.dataset.lab === name;
    t.setAttribute("aria-selected", on ? "true" : "false");
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    if (on && focus) t.focus();
  });
}

async function start() {
  let core;
  let mods;
  try {
    core = await import("./bored/core.js");
    mods = await Promise.all([import("./bored/myo.js"), import("./bored/gait.js"), import("./bored/arm.js")]);
  } catch (e) {
    console.error(e);
    wireTabs((n, f) => showTab(n, f));
    showFallback("The 3D engine couldn't load. Check your connection and refresh.");
    return;
  }
  if (!core.hasWebGL()) {
    wireTabs((n, f) => showTab(n, f));
    showFallback("These simulations need WebGL, which this browser has turned off.");
    return;
  }

  const { renderer, env } = core.createRenderer();
  const pal = core.readPalette();
  const shared = { renderer, env, pal };
  const labs = {
    myo: mods[0].createMyo(shared),
    gait: mods[1].createGait(shared),
    arm: mods[2].createArm(shared),
  };

  let active = null;
  let raf = 0;
  let last = 0;
  let onScreen = true;
  let size = { w: 0, h: 0 };

  function fit() {
    const lab = labs[active];
    const r = lab.host.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (w === size.w && h === size.h) return;
    size = { w, h };
    renderer.setSize(w, h, false);
    lab.resize(w, h);
  }

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const lab = labs[active];
    fit();
    lab.update(dt);
    renderer.render(lab.scene, lab.camera);
    lab.overlay();
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
    if (active) {
      labs[active].active = false;
      labs[active].onHide();
    }
    active = name;
    showTab(name, focus);
    const lab = labs[name];
    lab.host.appendChild(renderer.domElement);
    lab.active = true;
    lab.onShow();
    size = { w: 0, h: 0 };
    last = 0;
    schedule();
  }

  wireTabs(select);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : schedule()));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      if (onScreen) schedule();
      else stop();
    }).observe(document.querySelector(".bionic"));
  }

  const fromHash = (location.hash || "").replace("#", "") || params.get("lab");
  select(labs[fromHash] ? fromHash : "myo");
  document.querySelector(".bionic").classList.add("is-live");
}

start();
