# Rename the Vercel project to `dunu` and turn Deployment Protection OFF so the
# public URL loads without an SSO wall. Uses ~/.vt token. Never prints the token.
import json
import os
import subprocess
import sys

TEAM = os.environ.get("VERCEL_TEAM", "")
TOKEN = open(os.path.expanduser("~/.vt")).read().strip()
API = "https://api.vercel.com/v9"


def api(path, method="GET", body=None):
    cmd = ["curl", "-s", "-X", method, "-H", f"Authorization: Bearer {TOKEN}",
           f"{API}{path}"]
    if body is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"raw": r.stdout[:300]}


suffix = f"?teamId={TEAM}" if TEAM else ""

# resolve team id if not given
if not TEAM:
    u = api("/user")
    teams = u.get("user", {}).get("teams", [])
    if teams:
        TEAM = teams[0]["id"]
        suffix = f"?teamId={TEAM}"
        print("team:", teams[0]["name"])

# find the deployed project (was auto-named 'dist')
projs = api(f"/projects{suffix}")
proj = next((p for p in projs.get("projects", []) if p["name"] in ("dist", "dunu")), None)
if not proj:
    print("projects found:", [p["name"] for p in projs.get("projects", [])])
    sys.exit("project not found")
print("project:", proj["name"], proj["id"])

# 1) rename to 'dunu'  2) remove SSO/auth wall so the public URL is open
upd = api(f"/projects/{proj['id']}{suffix}", "PATCH",
          {"name": "dunu", "ssoProtection": None, "passwordProtection": None})
if upd.get("error" if "error" in upd else "name") and "name" not in upd:
    print("patch result:", json.dumps(upd)[:300])
    sys.exit("patch failed")
print("renamed ->", upd.get("name"), "| ssoProtection:", upd.get("ssoProtection"))

# domains on the project
doms = api(f"/projects/{proj['id']}/domains{suffix}")
print("production domains:", [d.get("name") for d in doms.get("domains", [])])
