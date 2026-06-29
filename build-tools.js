/* build-tools.js — produce cleaned tool pages from decoded/ sources.
 * Steps per tool:
 *   1. Strip ALL <script ... data-bard-injected="true" ...> blocks (AI Studio artifacts).
 *   2. Namespace the colliding localStorage key 'workspace_backup' per tool
 *      (all 3 tools shared it; under one origin that would cross-contaminate).
 *   3. Inject <script src="../assets/shared.js"></script> before </body>
 *      (hub link + global theme sync).
 *   4. Write to tools/<name>.html.
 * Idempotent: always rebuilds from decoded/ sources.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "decoded");
const OUT = path.join(ROOT, "tools");

const BARD = /<script[^>]*\bdata-bard-injected="true"[^>]*>[\s\S]*?<\/script>/g;
const SHARED_TAG = '<script src="../assets/shared.js"></script>';

const tools = [
  { src: "scratchpad.html", out: "scratchpad.html", ns: "sp_" },
  { src: "mindmap.html", out: "mindmap.html", ns: "mm_" },
  { src: "abhidhamma.html", out: "abhidhamma.html", ns: "ab_" },
];

fs.mkdirSync(OUT, { recursive: true });

for (const t of tools) {
  let html = fs.readFileSync(path.join(SRC, t.src), "utf8");
  const before = html.length;

  // 1. strip bard
  const bardCount = (html.match(BARD) || []).length;
  html = html.replace(BARD, "");

  // 2. namespace the shared key (quoted literal only -> precise, key-string only)
  const wsCount = (html.match(/'workspace_backup'/g) || []).length;
  html = html.replace(/'workspace_backup'/g, "'" + t.ns + "workspace_backup'");

  // 2b. PNG export: toDataURL -> toBlob (huge data: URLs produce corrupt/
  //     un-openable downloads in Chrome; Blob object URLs have no size limit).
  const PNG_RE =
    /let a = document\.createElement\('a'\); a\.href = c\.toDataURL\('image\/png'\); a\.download = ('[^']+_' \+ Date\.now\(\) \+ '\.png'); a\.click\(\);/g;
  const pngCount = (html.match(PNG_RE) || []).length;
  html = html.replace(
    PNG_RE,
    "c.toBlob(function(_b){ var _u=URL.createObjectURL(_b); var a=document.createElement('a'); a.href=_u; a.download=$1; a.click(); setTimeout(function(){URL.revokeObjectURL(_u);},2000); },'image/png');"
  );

  // 3. inject shared.js before </body> (only once)
  if (!html.includes(SHARED_TAG)) {
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, "  " + SHARED_TAG + "\n</body>");
    } else {
      html += "\n" + SHARED_TAG + "\n";
    }
  }

  fs.writeFileSync(path.join(OUT, t.out), html, "utf8");

  // verify residue
  const residue = (re) => (html.match(re) || []).length;
  console.log("== " + t.out + " ==");
  console.log("  bard removed: " + bardCount + " | size " + before + " -> " + html.length);
  console.log("  workspace_backup namespaced -> " + t.ns + "workspace_backup (x" + wsCount + ")");
  console.log("  PNG export toDataURL->toBlob: x" + pngCount);
  console.log("  shared.js injected: " + html.includes(SHARED_TAG));
  console.log("  RESIDUE firebase=" + residue(/firebase/gi) + " apiKey=" + residue(/apiKey/g) +
    " AIzaSy=" + residue(/AIzaSy/g) + " JWT=" + residue(/eyJhbGci/g) +
    " bard=" + residue(/data-bard-injected/g));
}
console.log("\nDone. Output in tools/");
