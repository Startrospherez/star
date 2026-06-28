# Study Tools Hub — Design Spec

**Date:** 2026-06-28
**Status:** Draft (awaiting user review)
**Owner:** chetphanu.sut@gmail.com

## 1. Purpose

A personal website that collects the user's study tools in one place — an
iLovePDF-style hub where you land, pick a tool, and start working. It replaces
the current setup where each tool is a giant `data:text/html` bookmark that
cannot be synced across devices because the whole app is embedded in the
bookmark string.

The website itself lives at a stable URL, so the "bookmark" is now just a tiny
link that syncs trivially across devices. Tool *data* is handled separately
(see Persistence).

## 2. Background / Current State

Three tools exist today, each a self-contained vanilla-JS HTML app exported from
Google AI Studio (Gemini "Build"):

| Tool | File | Decoded size | Purpose |
|------|------|--------------|---------|
| ScratchPad V.3.71 | `Scratchpad.txt` | ~76 KB | temporary writing / scratchpad |
| MindMap V.3.71 | `Mindmap.txt` | ~111 KB | mind maps |
| ผังอภิธรรม V.3.71 | `ผังอภิธรรม.txt` | ~122 KB | Abhidhamma chart coloring |

Decoded copies are in `decoded/{scratchpad,mindmap,abhidhamma}.html`.

**Tech stack (shared):** vanilla JS (manual `createElement`, no framework),
`contenteditable` editing, `localStorage` for local backup, `html2canvas`
(CDN) for image export.

**Key finding — why sync fails today:**
- The Firebase block at the top of each file is `data-bard-injected` — it is
  Google AI Studio's sandbox Firebase bridge, **not the user's own project**.
  It only works inside the AI Studio preview and errors elsewhere.
- Real cross-session persistence today is `localStorage` (`workspace_backup`),
  which is **per-device / per-browser**.
- Combined with the whole app living inside a `data:` URI bookmark, nothing
  syncs across devices.

**Security note:** the exported files contain a Firebase web `apiKey` and a
short-lived JWT `initialAuthToken`. These will be **stripped** during clean-up;
they must not land in a public repo.

## 3. Goals / Non-Goals

**Goals (Phase 1):**
- One hub page (minimal, iLovePDF style) linking to the 3 tools.
- Each tool cleaned: AI Studio Firebase + embedded credentials removed,
  functionality preserved.
- Persistence = `localStorage` (auto, per-device) + **Save/Load `.json` file**
  for manual cross-device transfer.
- Deployed free on GitHub Pages at `username.github.io/<repo>`.
- A "back to hub" nav on each tool.

**Non-Goals (deferred to Phase 2):**
- Cloud auto-sync / login.
- Custom domain (`star.sutadharo.com`) — start free, add later.
- New tools beyond the existing three.
- Visual redesign of the tools themselves (keep current look).

## 4. Approach

**Chosen: A — Hub + separate tool pages.** Each tool stays an isolated HTML
file; a lightweight hub links to them. Minimal change to working code, fast,
tools can't break each other, adding a new tool = drop a file + add a card.

Rejected:
- **B — Single-Page App merge:** cohesive but a large, risky rewrite. Overkill.
- **C — Rebuild with React/Vite:** best long-term, but heavy effort and
  beginner-unfriendly. YAGNI for a personal site.

## 5. Architecture

```
repo/
  index.html          # Hub: card grid of tools (minimal, iLovePDF style)
  tools/
    scratchpad.html   # cleaned existing tool
    mindmap.html      # cleaned existing tool
    abhidhamma.html   # cleaned existing tool
  assets/
    hub.css           # hub theme (shared design tokens)
    shared.js         # Save/Load-file helpers + "back to hub" nav
  README.md           # what this is, how to deploy/update
```

GitHub Pages serves from repo root. Suggested repo name: `star`
→ URL `username.github.io/star`.

### Units & responsibilities

- **`index.html` (Hub):** static card grid. Each card = icon + title + link to a
  tool page. No logic beyond navigation. Easy to extend with new cards.
- **Tool pages:** self-contained apps. Each owns its own UI + its own
  `localStorage` key namespace. They depend only on `shared.js` (optional) and
  their existing CDN script (`html2canvas`).
- **`shared.js`:** small, framework-free helpers — `saveToFile(data, name)`,
  `loadFromFile() -> Promise<data>`, and a "← Hub" link injector. One clear
  purpose: portability + navigation. Tools call it; it knows nothing about a
  specific tool's internals.
- **`hub.css`:** shared visual tokens (colors, spacing, card style) so the hub
  stays consistent and easy to restyle.

## 6. Data Flow & Persistence

- **Auto-save:** on edit, each tool writes to `localStorage` under its own key
  (e.g. `scratchpad:workspace`, `mindmap:workspace`, `abhidhamma:workspace`).
  Instant, per-device, zero cost, no server.
- **Save (export):** "Save" button serializes the tool's state to a `.json`
  file the browser downloads to the user's computer.
- **Load (import):** "Load" button reads a `.json` file the user picks and
  restores state — this is how data moves between devices.
- **No backend, no account, no server burden** in Phase 1.

This satisfies both requests: "stays on my device" (localStorage) and "carry
across devices" (Save/Load file).

**Phase 2 hook:** persistence is funneled through `shared.js` save/load
functions, so a future cloud provider (e.g. user-owned Firebase or Google Drive)
can be added behind the same interface without touching each tool's internals.

## 7. Error Handling

- **Corrupt/empty localStorage:** tools fall back to an empty workspace rather
  than crashing; existing `workspace_backup` logic is preserved/cleaned.
- **Bad import file:** "Load" validates JSON shape; on failure shows a message
  and leaves current state untouched (no destructive overwrite).
- **Removed Firebase:** all AI-Studio Firebase calls and the auth bridge are
  deleted, so no network errors on load.
- **CDN offline (`html2canvas`):** image-export button degrades gracefully
  (disabled / message); core editing still works.

## 8. Deployment

1. `git init` the project (currently not a git repo).
2. Create a GitHub repo named `star` (public).
3. Push files.
4. Enable GitHub Pages (Settings → Pages → branch `main`, root).
5. Site live at `username.github.io/star`.

The user is new to GitHub ("has an account, never pushed"). Deployment will be
walked through step by step. `username` to be provided at deploy time; not
required to start building.

## 9. Testing / Verification

- Open `index.html` locally → all 3 cards navigate correctly.
- Each tool: type → reload page → content persists (localStorage).
- Save → file downloads; clear localStorage → Load file → state restored.
- Confirm no console errors referencing Firebase / auth bridge.
- Confirm no `apiKey` / JWT strings remain (`grep`).

## 10. Open Items

- GitHub `username` (needed only at deploy).
- Final repo name (default: `star`).
- Exact `.json` schema per tool — derived from each tool's existing state shape
  during clean-up.

## 11. Phasing

- **Phase 1 (now):** hub + 3 cleaned tools + Save/Load file + deploy to Pages.
- **Phase 2 (later):** cloud auto-sync, custom domain, additional tools.

## 12. Implementation Notes (from tool co-author, verified against `decoded/`)

The current V.3.71 tools were co-developed in Google AI Studio; the original
build AI supplied the notes below. Each was verified by grepping `decoded/`.

1. **JSON export/import already exists — reuse, don't rewrite.**
   `exportJSON()` and `importJSON()` are present in **all three** files
   (verified: 2 refs each). `shared.js` should **extract** this existing logic
   rather than reimplement serialization. Watch the per-tool state shapes:
   - MindMap: `{ nodes, lines, nid, views }` (verified: `nid`, `views` present)
   - Abhidhamma: `{ nodes, abPatterns, views }` (verified: `abPatterns`, `views`)
   - ScratchPad: own shape (already has `exportJSON`/`importJSON`).

2. **Do NOT strip the crop / hi-res export UI.** A custom screenshot UI
   (`#cropUI`, `#cropBox`) with aspect-ratio presets (Free, 1:1, 16:9, PPT) and
   `window.confirmCrop` / `window.doExportDblClick` is present in all three
   (verified). `html2canvas` export uses `{ scale: 3 }` for high-res. Clean-up
   must preserve all of this — only the bard blocks get removed.

3. **Global theme (Dark / Sepia).** Tools toggle theme via
   `document.body.className` + CSS variables on `:root`. The Hub should add a
   Dark Mode toggle and persist it to a **global** `localStorage` key
   `hub_theme`. `shared.js` reads `hub_theme` on tool load so the theme is
   consistent across the whole suite. (`hub_theme` not yet present — new.)

4. **"← Hub" link injection — nav differs per tool.**
   - MindMap & Abhidhamma have a fixed top bar `.sys-ui` (flex row) plus a
     floating `#float-ui-btn` when minimized. Inject the "← Hub" link at the
     **start (extreme left)** of `.sys-ui`, styled distinctly from tool buttons.
   - **ScratchPad has no `.sys-ui`** (verified) — it uses a different nav with
     `#float-ui-btn`. Its hub link needs a tool-specific injection point.
   So `shared.js` must not assume `.sys-ui` exists; inject adaptively.

5. **Stripping Firebase.** Each file has **9** `<script data-bard-injected="true">`
   blocks (verified) — AI Studio preview artifacts. Delete all of them. The real
   application logic lives in the final `<script>` at the bottom of `<body>`;
   do not touch it beyond removing bard references.
