"""Full network trace of a cold boot on the live URL."""
import sys, time
URL = sys.argv[1]
from playwright.sync_api import sync_playwright

net = []
with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    ctx = b.new_context(viewport={"width": 420, "height": 900})
    pg = ctx.new_page()
    pg.on("request", lambda r: net.append((round(time.time() - t0, 1), "->", r.url.rsplit("/", 1)[-1][:58])))
    pg.on("response", lambda r: net.append((round(time.time() - t0, 1),
                                           f"{r.status}", r.url.rsplit('/', 1)[-1][:58])))
    pg.on("requestfailed", lambda r: net.append((round(time.time() - t0, 1), "FAIL", r.url.rsplit('/', 1)[-1][:58])))
    pg.on("pageerror", lambda e: net.append((round(time.time() - t0, 1), "JSERR", str(e)[:120])))
    pg.on("console", lambda m: net.append((round(time.time() - t0, 1), f"console.{m.type}", m.text[:140]))
          if m.type in ("error", "warning") else None)

    t0 = time.time()
    pg.goto(URL, wait_until="load", timeout=90000)
    for i in range(1, 13):
        time.sleep(15)
        txt = pg.inner_text("body")
        mark = "HOME" if "KUMPULAN ZIKIR" in txt.upper() else "loader"
        print(f"t={i*15}s [{mark}] {txt[:60].strip()}")
        if mark == "HOME":
            break

    print("\n--- network/events timeline ---")
    for ts, kind, what in net:
        print(f"{ts:7.1f}s {kind:>10} {what}")
    b.close()
