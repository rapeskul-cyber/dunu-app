# Create the GitHub repo and push. Credentials come from git credential helper;
# nothing is printed.
import json
import subprocess
import sys

def cred():
    p = subprocess.run(
        ["git", "credential", "fill"],
        input="protocol=https\nhost=github.com\n\n",
        capture_output=True, text=True,
    )
    for line in p.stdout.splitlines():
        if line.startswith("password="):
            return line[len("password="):]
    sys.exit("no github credential found")

token = cred()

# 1. create repo (idempotent: 422 = already exists is fine)
body = json.dumps({
    "name": "dunu-app",
    "description": "Offline-first Islamic dua & dhikr app (Expo RN + SQLite). PWA deployed on Vercel.",
    "private": False,
    "auto_init": False,
    "has_issues": False,
})
r = subprocess.run(
    ["curl", "-s", "-w", "%{http_code}", "-o", "-", "-X", "POST",
     "-H", f"Authorization: token {token}",
     "-H", "Accept: application/vnd.github+json",
     "https://api.github.com/user/repos", "-d", body],
    capture_output=True, text=True,
)
code, payload = r.stdout[-3:], r.stdout[:-3]
if code in ("201", "422"):
    try:
        print("repo ready:", json.loads(payload).get("html_url", "?"))
    except Exception:
        print("repo ready (parse skipped)")
else:
    print("repo create failed:", code, payload[:300])
    sys.exit(1)

# 2. push
subprocess.run(["git", "remote", "remove", "origin"], cwd=r"C:\Users\User\dunu-app", capture_output=True)
subprocess.run(["git", "remote", "add", "origin",
                "https://rapeskul-cyber@github.com/rapeskul-cyber/dunu-app.git"],
               cwd=r"C:\Users\User\dunu-app", check=True, capture_output=True)
subprocess.run(["git", "branch", "-M", "main"], cwd=r"C:\Users\User\dunu-app", capture_output=True)
p = subprocess.run(["git", "push", "-u", "origin", "main"],
                   cwd=r"C:\Users\User\dunu-app", capture_output=True, text=True)
if p.returncode != 0:
    print("PUSH FAILED:", (p.stderr or p.stdout)[:500])
    sys.exit(1)
print("PUSHED_OK")

# 3. verify from GitHub side
v = subprocess.run(
    ["curl", "-s", "-H", f"Authorization: token {token}",
     "https://api.github.com/repos/rapeskul-cyber/dunu-app/commits/main"],
    capture_output=True, text=True,
)
try:
    d = json.loads(v.stdout)
    print("remote HEAD:", d["sha"][:8], "-", d["commit"]["message"].splitlines()[0])
except Exception:
    print("verify skipped:", v.stdout[:200])
