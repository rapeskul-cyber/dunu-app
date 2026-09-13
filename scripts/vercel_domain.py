# Attach dozir-app.vercel.app to the dozir-app project.
import json
import os
import subprocess

TOKEN = open(os.path.expanduser("~/.vt")).read().strip()
TEAM = "team_8V2GsGXBFYauT1jFzuqbaCFE"
PID = "prj_0BGrdSwj6QYhr2VMkIdxlhRffAfF"
suf = f"?teamId={TEAM}"


def api(path, method="GET", body=None):
    cmd = ["curl", "-s", "-X", method, "-H", f"Authorization: Bearer {TOKEN}",
           "https://api.vercel.com/v10" + path]
    if body is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"raw": r.stdout[:300]}


want = "dozir-app.vercel.app"
existing = api(f"/projects/{PID}/domains{suf}")
have = [d.get("name") for d in existing.get("domains", [])]
print("current domains:", have)

if want in have:
    print("already attached:", want)
else:
    r = api(f"/projects/{PID}/domains{suf}", "POST", {"name": want})
    if "error" in r:
        print("attach failed:", json.dumps(r["error"])[:200])
    else:
        print("attached:", r.get("name"))

after = api(f"/projects/{PID}/domains{suf}")
print("domains now:", [(d.get("name"), d.get("verified")) for d in after.get("domains", [])])
