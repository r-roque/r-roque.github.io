// Live clock in Rodrigo's local time (Chapel Hill)
const clock = document.getElementById("clock");
const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
function tick() {
  const now = new Date();
  clock.textContent = fmt.format(now);
  clock.dateTime = now.toISOString();
}
tick();
setInterval(tick, 1000);

// Tab bar: slide the indicator to the tab matching the URL hash,
// and show that tab's view (falls back to home until a view exists)
const page = document.querySelector(".page");
// Views use data-view-name, not ids, so the browser never jumps to them as anchors
const views = Object.fromEntries(
  [...document.querySelectorAll("[data-view-name]")].map((el) => [el.dataset.viewName, el])
);
const tabbar = document.querySelector(".tabbar");   // only on index.html
const tabs = tabbar ? [...tabbar.querySelectorAll(".tabbar__tab")] : [];
function syncTabs() {
  const hash = location.hash || "#home";
  let index = tabs.findIndex((t) => t.getAttribute("href") === hash);
  if (index < 0) index = 0;
  tabs.forEach((t, i) =>
    i === index ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current")
  );
  tabbar.style.setProperty("--active", index);

  const view = hash.slice(1) in views ? hash.slice(1) : "home";
  for (const [name, el] of Object.entries(views)) el.hidden = name !== view;
  page.dataset.view = view;
  window.scrollTo(0, 0);                  // start each view at the top
}
if (tabbar) {
  window.addEventListener("hashchange", syncTabs);
  syncTabs();
}

// Cursor ring: a circle that follows the pointer, grows over links,
// and flips to white over the black footer / tab bar. Mouse and trackpad only.
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  ring.setAttribute("aria-hidden", "true");
  document.body.append(ring);

  let x = 0, y = 0, queued = false;
  document.addEventListener("pointermove", (e) => {
    x = e.clientX;
    y = e.clientY;
    const target = e.target instanceof Element ? e.target : null;
    ring.classList.add("is-visible");
    ring.classList.toggle("is-hovering", Boolean(target?.closest("a, button")));
    ring.classList.toggle("is-inverted", Boolean(target?.closest(".case-footer, .tabbar")));
    if (!queued) {
      queued = true;
      requestAnimationFrame(() => {
        ring.style.transform = `translate(${x}px, ${y}px)`;
        queued = false;
      });
    }
  });
  document.documentElement.addEventListener("pointerleave", () => ring.classList.remove("is-visible"));
}
