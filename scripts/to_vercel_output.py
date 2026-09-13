# Convert Metro's exported dist/ into Vercel's Build Output API (.vercel/output)
# so BOTH deploy routes work:
#   - `vercel deploy --prebuilt` (CLI, skips install/build entirely)
#   - GitHub integration (buildCommand ends with this script)
# Security headers are applied via `static[].headers` + route-level overrides.
import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
OUT = os.path.join(ROOT, ".vercel", "output")

SEC_HEADERS = {
    "content-security-policy": (
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: blob: https://cdn.islamic.network; "
        "media-src 'self' blob: https://cdn.islamic.network; "
        "font-src 'self' data:; "
        "connect-src 'self' https://cdn.islamic.network https://accounts.google.com "
        "https://oauth2.googleapis.com https://www.googleapis.com; "
        "frame-src https://accounts.google.com; "
        "worker-src 'self' blob:; child-src 'self' blob:; "
        "object-src 'none'; base-uri 'self'; form-action 'self'; "
        "frame-ancestors 'none'; upgrade-insecure-requests"
    ),
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": (
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), "
        "magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()"
    ),
    "cross-origin-opener-policy": "same-origin",
}

IMMUTABLE = "public, max-age=31536000, immutable"

config = {
    "version": 3,
    "routes": [
        # security headers on every response (evaluated before filesystem)
        {"src": "/(.*)", "headers": SEC_HEADERS, "continue": True},
        {"src": "/_expo/static/js/.*", "headers": {"cache-control": IMMUTABLE}, "continue": True},
        {"src": "/assets/vendor/.*", "headers": {"cache-control": IMMUTABLE}, "continue": True},
        {
            "src": "/.*\\.wasm",
            "headers": {"content-type": "application/wasm", "cache-control": IMMUTABLE},
            "continue": True,
        },
        {
            "src": "/manifest\\.webmanifest",
            "headers": {"content-type": "application/manifest+json"},
            "continue": True,
        },
        {"handle": "filesystem"},
        {"src": "/(.*)", "dest": "/index.html"},
    ],
    # per-file content type for files served straight from disk
    "overrides": {
        "manifest.webmanifest": {"contentType": "application/manifest+json", "path": "/manifest.webmanifest"},
        "index.html": {"contentType": "text/html; charset=utf-8", "path": "/index.html"},
    },
}

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT, exist_ok=True)
shutil.copytree(DIST, os.path.join(OUT, "static"))
with open(os.path.join(OUT, "config.json"), "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2)

n = sum(len(fs) for _, _, fs in os.walk(os.path.join(OUT, "static")))
print(f".vercel/output ready: {n} files (static + config.json with security headers)")
