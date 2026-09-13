"""Find every 404 the live page hits, and inspect what the Tasbih tab renders."""
import sys, time, json
URL = sys.argv[1]
from playwright.sync_api import sync_playwright

bad = []
with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    pg = b.new_page(viewport={"width": 420, "height": 900})
    pg.on("response", lambda r: bad.append((r.status, r.url)) if r.status >= 400 else None)
    pg.goto(URL, wait_until="load", timeout=90000)
    pg.wait_for_function("document.body.innerText.includes('KATEGORI')", timeout=60000)
    print("booted. initial 404s:")
    for s, u in bad:
        print("  ", s, u[:120])

    before = len(bad)
    pg.get_by_text("Cari", exact=True).first.click()
    pg.wait_for_function("!!document.querySelector('input')", timeout=20000)
    pg.get_by_text("Tasbih", exact=True).first.click()
    time.sleep(3.0)
    body = pg.inner_text("body")
    print("\nnew 404s after Tasbih tab:")
    for s, u in bad[before:]:
        print("  ", s, u[:120])
    print("\nTASBIH SCREEN TEXT >>>")
    print(body[:700])
    print("<<< END")
    pg.screenshot(path="tasbih-live.png")
    b.close()
