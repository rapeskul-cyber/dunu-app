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
