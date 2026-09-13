# Clear the Vercel project's build/install/output settings so the CLI's
# --prebuilt path is authoritative (and the GitHub build stops trying to run
# `npm install` in a directory that has no package.json for it).
import json
import os
import subprocess

TOKEN = open(os.path.expanduser("~/.vt")).read().strip()
TEAM = "team_8V2GsGXBFYauT1jFzuqbaCFE"
PID = "prj_0BGrdSwj6QYhr2VMkIdxlhRffAfF"

body = {"buildCommand": None, "installCommand": None, "outputDirectory": None, "framework": None}
cmd = [
    "curl", "-s", "-X", "PATCH",
    "-H", f"Authorization: Bearer {TOKEN}",
    "-H", "Content-Type: application/json",
    f"https://api.vercel.com/v9/projects/{PID}?teamId={TEAM}",
    "-d", json.dumps(body),
]
r = subprocess.run(cmd, capture_output=True, text=True)
try:
    d = json.loads(r.stdout)
except Exception:
    print("raw:", r.stdout[:250])
    raise SystemExit(1)
if "error" in d:
    print("ERROR:", json.dumps(d["error"])[:200])
else:
    print("buildCommand   :", d.get("buildCommand"))
    print("installCommand :", d.get("installCommand"))
    print("outputDirectory:", d.get("outputDirectory"))
