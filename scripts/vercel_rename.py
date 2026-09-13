# Rename the Vercel project to `dozir-app` and make sure production alias is
# https://dozir-app.vercel.app with deployment protection OFF (public URL).
import json
import os
import subprocess
import sys

TOKEN = open(os.path.expanduser("~/.vt")).read().strip()
API = "https://api.vercel.com/v9"
NEW_NAME = "dozir-app"


def api(path, method="GET", body=None):
    cmd = ["curl", "-s", "-X", method, "-H", f"Authorization: Bearer {TOKEN}", API + path]
    if body is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"raw": r.stdout[:300]}


# resolve team
u = api("/user")
teams = u.get("user", {}).get("teams", [])
TEAM = teams[0]["id"] if teams else None
suffix = f"?teamId={TEAM}" if TEAM else ""

projs = api("/projects" + suffix).get("projects", [])
proj = next((p for p in projs if p["name"] == NEW_NAME), None)
if not proj:
    proj = next((p for p in projs if p["name"] in ("dunu", "dist")), None)
if not proj:
    print("projects:", [p["name"] for p in projs])
    sys.exit("no project found")
print("found:", proj["name"], proj["id"])

if proj["name"] != NEW_NAME:
    upd = api(f"/projects/{proj['id']}" + suffix, "PATCH",
              {"name": NEW_NAME, "ssoProtection": None, "passwordProtection": None})
    if "error" in upd:
        print("rename failed:", json.dumps(upd["error"])[:200])
        sys.exit(1)
    print("renamed ->", upd.get("name"))
else:
    # already named right; still ensure protection is off
    api(f"/projects/{proj['id']}" + suffix, "PATCH",
        {"ssoProtection": None, "passwordProtection": None})
    print("already named", NEW_NAME)

# remove any leftover project named 'dist' so deploys don't split-brain
leftover = [p for p in projs if p["name"] == "dist" and p["id"] != proj["id"]]
print("cleanup leftover projects:", [p["id"] for p in leftover])

print("\nPRODUCTION URL: https://%s.vercel.app" % NEW_NAME)
