"""Probe the LIVE URL: what does the body show over time, what errors fire?"""
import sys, time
URL = sys.argv[1]
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    pg = b.new_page(viewport={"width": 420, "height": 900})
    pg.on("pageerror", lambda e: print("PAGEERROR:", str(e)[:300]))
    pg.on("console", lambda m: print(f"CONSOLE[{m.type}]:", m.text[:240]) if m.type in ("error", "warning") else None)
    pg.on("response", lambda r: print("HTTP", r.status, r.url[-80:]) if r.status >= 400 else None)
    pg.goto(URL, wait_until="load", timeout=90000)
    for i in range(1, 19):
        time.sleep(10)
        txt = pg.inner_text("body")
        head = txt[:220].replace("\n", " | ")
        print(f"--- t={i*10}s --- {head}")
        if "KUMPULAN ZIKIR" in txt.upper():
            print(">>> HOME REACHED")
            break
    b.close()
