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
  function applyTheme() {
    var t = null;
    try { t = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (t === "dark") document.body.classList.add("dark");
    else if (t === "light") document.body.classList.remove("dark");
    // if unset, leave the tool's own default untouched
  }

  // --- 2. Sync tool's dark toggle back to the global key ------------------
  function watchTheme() {
    var obs = new MutationObserver(function () {
      try {
        localStorage.setItem(
          THEME_KEY,
          document.body.classList.contains("dark") ? "dark" : "light"
        );
      } catch (e) {}
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  // --- 3. Inject "back to hub" link --------------------------------------
  function injectHubLink() {
    if (document.getElementById("hub-back-link")) return;
    var a = document.createElement("a");
    a.id = "hub-back-link";
    a.href = "../index.html";
    a.textContent = "← Hub";
    a.title = "Back to Study Tools Hub";

    var bar = document.querySelector(".sys-ui");
    if (bar) {
      // MindMap / Abhidhamma: prepend into the existing top bar, styled distinct
      a.style.cssText =
        "display:inline-flex;align-items:center;gap:4px;margin-right:8px;" +
        "padding:2px 10px;border-radius:6px;font-weight:600;text-decoration:none;" +
        "color:#fff;background:#5b8def;white-space:nowrap;flex:0 0 auto;";
      bar.insertBefore(a, bar.firstChild);
    } else {
      // ScratchPad (no .sys-ui): floating link, top-left, out of the way
      a.style.cssText =
        "position:fixed;top:8px;left:8px;z-index:99999;" +
        "padding:4px 12px;border-radius:6px;font-weight:600;text-decoration:none;" +
        "color:#fff;background:#5b8def;opacity:.85;box-shadow:0 1px 4px rgba(0,0,0,.25);";
      document.body.appendChild(a);
    }
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
