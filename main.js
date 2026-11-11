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

// Case study sidebar: mark the section currently in view and keep its chip visible on small screens
const toc = document.querySelector(".case-toc");
if (toc) {
  const links = [...toc.querySelectorAll(".case-toc__link")];
  const targets = links.map((a) => document.getElementById(a.hash.slice(1)));
  let current = null, queued = false;
  function syncToc() {
    queued = false;
    const line = window.innerHeight * 0.3;
    let index = 0;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= line) index = i; });
    // at the very bottom, light up the last entry even if it's short
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      index = targets.findLastIndex((t) => t && t.closest(".case__content") && !t.matches(".case-sub__title"));
      if (index < 0) index = targets.length - 1;
    }
    let link = links[index];
    // sub-entries are hidden in the mobile chip row; light up their parent instead
    if (!link.offsetParent) link = link.closest(".case-toc__sub").closest("li").querySelector(".case-toc__link");
    if (link === current) return;
    current?.removeAttribute("aria-current");
    link.setAttribute("aria-current", "true");
    current = link;
    // horizontal chip row: scroll the active chip into view without moving the page
    if (toc.scrollWidth > toc.clientWidth) {
      const chip = link.getBoundingClientRect(), bar = toc.getBoundingClientRect();
      if (chip.left < bar.left || chip.right > bar.right) {
        toc.scrollLeft += chip.left - bar.left - 24;
      }
    }
  }
  document.addEventListener("scroll", () => {
    if (!queued) { queued = true; requestAnimationFrame(syncToc); }
  }, { passive: true });
  window.addEventListener("resize", syncToc);
  syncToc();
}
