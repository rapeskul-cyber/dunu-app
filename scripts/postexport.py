"""Post-export: make the exported dist/ installable as a PWA + Vercel-ready.

1. Writes dist/manifest.webmanifest (name, icons, standalone, theme).
2. Injects <link rel=manifest> + apple meta into dist/index.html.
3. Writes dist/vercel.json: correct MIME/cache for the SQLite WASM asset.
Run after: npx expo export --platform web
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
assert os.path.isdir(DIST), "dist/ missing - run `npx expo export --platform web` first"

manifest = {
    "name": "Dunu - Doa & Zikir Harian",
    "short_name": "Dunu",
    "description": "Kumpulan doa & zikir offline-first dengan tasbih pintar, audio murattal, dan habit tracker.",
    "start_url": "/",
    "display": "standalone",
    "orientation": "portrait",
    "background_color": "#0B1210",
    "theme_color": "#0B1210",
    "lang": "id",
    "icons": [
        {"src": "/favicon.ico", "sizes": "48x48 72x72 96x96 144x144 168x168 192x192 256x256 512x512", "type": "image/x-icon", "purpose": "any"}
    ],
}
with open(os.path.join(DIST, "manifest.webmanifest"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

idx_path = os.path.join(DIST, "index.html")
with open(idx_path, encoding="utf-8") as f:
    html = f.read()

# --- Vercel uploads skip ANY directory named `node_modules`, but Metro exports
# assets (SQLite WASM + every @expo-google-fonts .ttf) to
# dist/assets/node_modules/... . Move each one to a flat vendor path and rewrite
# the plain-string references inside the exported JS bundles.
import glob
import shutil

moved_files, rewritten_refs = 0, 0
vend = os.path.join(DIST, "assets", "vendor")
js_files = glob.glob(os.path.join(DIST, "_expo", "static", "js", "web", "*.js"))
codes = {f: open(f, encoding="utf-8", errors="ignore").read() for f in js_files}

for src in glob.glob(os.path.join(DIST, "assets", "node_modules", "**", "*.*"), recursive=True):
    if not os.path.isfile(src):
        continue
    rel = os.path.relpath(src, os.path.join(DIST, "assets", "node_modules")).replace("\\", "/")
    ext = os.path.splitext(src)[1]
    # flatten: keep only the hashed filename (already content-hash-unique)
    flat = f"{os.path.basename(src)}"
    os.makedirs(vend, exist_ok=True)
    shutil.copy2(src, os.path.join(vend, flat))
    old_ref, new_ref = "assets/node_modules/" + rel, "assets/vendor/" + flat
    n = 0
    for f, code in codes.items():
        if old_ref in code:
            codes[f] = code = code.replace(old_ref, new_ref)
            n += code.count(new_ref)
    moved_files += 1
    rewritten_refs += n

for f, code in codes.items():
    with open(f, "w", encoding="utf-8", newline="") as fh:
        fh.write(code)
print(f"relocated {moved_files} node_modules assets -> assets/vendor ({rewritten_refs} bundle refs rewritten)")

if "manifest.webmanifest" not in html:
    html = html.replace(
        "</head>",
        '  <link rel="manifest" href="/manifest.webmanifest" />'
        '<meta name="theme-color" content="#0B1210" />'
        '<meta name="mobile-web-app-capable" content="yes" />'
        '<meta name="apple-mobile-web-app-capable" content="yes" />'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />'
        "<meta name=\"apple-mobile-web-app-title\" content=\"Dunu\" />\n</head>",
    )
    with open(idx_path, "w", encoding="utf-8") as f:
        f.write(html)

vercel = {
    "framework": None,
    "cleanUrls": True,
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                {"key": "X-Content-Type-Options", "value": "nosniff"},
                {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
            ],
        },
        {
            "source": "/(.*).wasm",
            "headers": [
                {"key": "Content-Type", "value": "application/wasm"},
                {"key": "Cache-Control", "value": "public, max-age=31536000, immutable"},
            ],
        },
        {
            "source": "/assets/vendor/(.*)",
            "headers": [
                {"key": "Cache-Control", "value": "public, max-age=31536000, immutable"},
            ],
        },
        {
            "source": "/_expo/static/js/(.*)",
            "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}],
        },
        {
            "source": "/manifest.webmanifest",
            "headers": [{"key": "Content-Type", "value": "application/manifest+json"}],
        },
    ],
}
with open(os.path.join(DIST, "vercel.json"), "w", encoding="utf-8") as f:
    json.dump(vercel, f, indent=2)

print("PWA manifest + vercel.json written into dist/")
print("index.html patched:", "manifest.webmanifest" in open(idx_path, encoding='utf-8').read())
