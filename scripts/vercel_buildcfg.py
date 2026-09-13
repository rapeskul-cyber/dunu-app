# Configure the dozir-app Vercel project so a GitHub push builds correctly:
# metro web export -> postexport (relocate node_modules assets, PWA manifest)
# -> serve ./dist. Without this the integration builds the raw repo and every
# font/WASM 404s.
import json
import os
import subprocess

TOKEN = open(os.path.expanduser("~/.vt")).read().strip()
TEAM = "team_8V2GsGXBFYauT1jFzuqbaCFE"
PID = "prj_0BGrdSwj6QYhr2VMkIdxlhRffAfF"
suf = f"?teamId={TEAM}"


def api(path, method="GET", body=None):
    cmd = ["curl", "-s", "-X", method, "-H", f"Authorization: Bearer {TOKEN}",
           "https://api.vercel.com/v9" + path]
    if body is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"raw": r.stdout[:300]}


patch = {
    "framework": None,
    "buildCommand": "npx expo export --platform web && python scripts/postexport.py",
    "outputDirectory": "dist",
    "installCommand": "npm install --no-audit --no-fund",
}
r = api(f"/projects/{PID}{suf}", "PATCH", patch)
if "error" in r:
    print("patch failed:", json.dumps(r["error"])[:220])
else:
    print("buildCommand  :", r.get("buildCommand"))
    print("outputDirectory:", r.get("outputDirectory"))
    print("installCommand :", r.get("installCommand"))
