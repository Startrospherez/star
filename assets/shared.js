/* shared.js — Study Tools Hub
 * Cross-tool glue, framework-free. Loaded by every tool page.
 * Responsibilities (Phase 1):
 *   1. Apply the global theme (hub_theme) on load.
 *   2. Keep tool <-> hub theme in sync (tool's own dark toggle writes back).
 *   3. Inject a "back to hub" link, adapting to each tool's nav.
 * Knows nothing about any individual tool's internals.
 */
(function () {
  "use strict";

  var THEME_KEY = "hub_theme"; // "light" | "dark"

  // --- 1. Apply global theme on load -------------------------------------
  // Tools' own default look is already a warm/sepia cream, so both "light" and
  // "sepia" map to "no dark"; only "dark" toggles the tool's dark class.
  function applyTheme() {
    var t = null;
    try { t = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (t === "dark") document.body.classList.add("dark");
    else if (t === "light" || t === "sepia") document.body.classList.remove("dark");
    // if unset, leave the tool's own default untouched
  }

  // --- 2. Sync tool's dark toggle back to the global key ------------------
  // Preserve a "sepia" preference when the tool is not in dark mode.
  function watchTheme() {
    var obs = new MutationObserver(function () {
      try {
        var prev = localStorage.getItem(THEME_KEY);
        var next = document.body.classList.contains("dark")
          ? "dark"
          : (prev === "sepia" ? "sepia" : "light");
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {}
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  // --- 3. Inject "back to hub" link --------------------------------------
  // Floating pill, fixed at the bottom-left on every tool (consistent place,
  // never clipped by the top toolbar).
  function injectHubLink() {
    if (document.getElementById("hub-back-link")) return;
    var a = document.createElement("a");
    a.id = "hub-back-link";
    a.href = "../index.html";
    a.textContent = "← Hub";
    a.title = "Back to Study Tools Hub";
    // bottom-right, sitting just ABOVE the tool's info (i) button.
    a.style.cssText =
      "position:fixed;right:14px;bottom:62px;z-index:99999;" +
      "display:inline-flex;align-items:center;gap:4px;" +
      "padding:7px 14px;border-radius:999px;font-weight:600;font-size:14px;" +
      "text-decoration:none;color:#fff;background:#5b8def;" +
      "box-shadow:0 2px 8px rgba(0,0,0,.25);opacity:.92;";
    a.onmouseenter = function () { a.style.opacity = "1"; };
    a.onmouseleave = function () { a.style.opacity = ".92"; };
    document.body.appendChild(a);
    placeHubAboveInfo(a);
    window.addEventListener("resize", function () { placeHubAboveInfo(a); });
  }

  // Sit the Hub pill just above the tool's info (i) button, whatever its height.
  function placeHubAboveInfo(a) {
    var info = document.getElementById("about-btn");
    if (!info) return; // keep default bottom:62px
    var r = info.getBoundingClientRect();
    if (r.height === 0) return;
    a.style.bottom = Math.round(window.innerHeight - r.top + 8) + "px";
  }

  // Show the hub link as early as possible.
  function early() {
    injectHubLink();
  }

  // Apply theme AFTER the tool's own (sometimes async) init settles, then start
  // watching — so the tool's init churn isn't recorded as a theme change.
  function late() {
    setTimeout(function () {
      applyTheme();
      watchTheme();
    }, 150);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", early);
  } else {
    early();
  }
  if (document.readyState === "complete") {
    late();
  } else {
    window.addEventListener("load", late);
  }
})();
