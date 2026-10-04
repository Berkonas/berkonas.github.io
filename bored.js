// The Workbench: three tools behind tabs. Each tool is its own module and is
// only loaded the first time its tab opens, so the page stays light.
const tabs = Array.from(document.querySelectorAll(".bench-tab"));
const loaders = {
  rotations: () => import("./bored/rotations.js?v=20261005"),
  segments: () => import("./bored/segments.js?v=20261005"),
  haptics: () => import("./bored/haptics.js?v=20261005"),
};
const started = {};
const tools = {};

function panelFor(tab) {
  return document.getElementById(tab.getAttribute("aria-controls"));
}

async function select(name, { focus = false, updateHash = true } = {}) {
  if (!loaders[name]) return;
  tabs.forEach((tab) => {
    const on = tab.dataset.tool === name;
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    panelFor(tab).hidden = !on;
    if (on && focus) tab.focus();
  });
  Object.entries(tools).forEach(([key, tool]) => {
    if (key !== name) tool.hide?.();
  });
  if (updateHash) {
    try {
      history.replaceState(null, "", `#${name}`);
    } catch (err) {
      /* file:// or sandboxed */
    }
  }
  if (!started[name]) {
    started[name] = loaders[name]()
      .then((mod) => {
        tools[name] = mod.init(document.getElementById(`tool-${name}`));
        return tools[name];
      })
      .catch((err) => {
        console.error(err);
        const panel = document.getElementById(`tool-${name}`);
        const p = document.createElement("p");
        p.className = "tool-error";
        p.textContent = "This tool couldn’t load. Refresh the page to try again.";
        panel.appendChild(p);
      });
  }
  const tool = await started[name];
  tool?.show?.();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => select(tab.dataset.tool));
  tab.addEventListener("keydown", (event) => {
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next >= 0) {
      event.preventDefault();
      select(tabs[next].dataset.tool, { focus: true });
    }
  });
});

const fromHash = (location.hash || "").replace("#", "");
select(loaders[fromHash] ? fromHash : "rotations", { updateHash: false });
window.addEventListener("hashchange", () => {
  const name = location.hash.replace("#", "");
  if (loaders[name]) select(name, { updateHash: false });
});
