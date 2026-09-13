# Delete the stray 'dist' project (wrong deploy target) and verify only
# 'dozir-app' remains. Token from ~/.vt; nothing printed.
import json
import os
import subprocess
import sys

TOKEN = open(os.path.expanduser("~/.vt")).read().strip()
API = "https://api.vercel.com/v9"


def api(path, method="GET", body=None):
    cmd = ["curl", "-s", "-X", method, "-H", f"Authorization: Bearer {TOKEN}", API + path]
    if body is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"raw": r.stdout[:200]}


u = api("/user")
teams = u.get("user", {}).get("teams", [])
TEAM = teams[0]["id"] if teams else None
suffix = f"?teamId={TEAM}" if TEAM else ""

projs = api("/projects" + suffix).get("projects", [])
print("projects:", [(p["name"], p["id"][-6:]) for p in projs])

for p in projs:
    if p["name"] in ("dist", "dunu"):
        d = api(f"/projects/{p['id']}" + suffix, "DELETE")
        ok = "error" not in d
        print(f"deleted '{p['name']}':", "ok" if ok else d.get("error"))

after = api("/projects" + suffix).get("projects", [])
print("remaining:", [(p["name"], p.get("targets", {})) for p in after][:4])
