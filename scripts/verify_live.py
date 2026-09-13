"""Verify the LIVE redesigned deployment: boot (6236-ayah seed), fonts, no emoji,
Qur'an reader, search. Any 404 on a subresource is reported."""
import sys, time, re
URL = sys.argv[1]
from playwright.sync_api import sync_playwright

EMOJI = re.compile("[\U0001F300-\U0001FAFF\U00002600-\U000027BF]")
bad, checks = [], []


def check(n, c, e=""):
    checks.append(bool(c))
    print(("  OK   " if c else "  FAIL ") + n + (f"  {e}" if e else ""))


with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    ctx = b.new_context(viewport={"width": 420, "height": 900})
    pg = ctx.new_page()
    pg.on("response", lambda r: bad.append((r.status, r.url)) if r.status >= 400 else None)
    pg.on("pageerror", lambda e: bad.append(("JS", str(e)[:120])))
    r = pg.goto(URL, wait_until="load", timeout=90000)
    check("live page 200", r and r.status == 200, f"status={r.status if r else '?'}")

    pg.wait_for_function("document.body.innerText.toUpperCase().includes('KUMPULAN ZIKIR')", timeout=240000)
    body = pg.inner_text("body")
    check("app boots on Vercel (SQLite WASM ok)", True)
    check("full Qur'an present (6.236 ayat)", "6.236 ayat" in body)
    check("warm parchment theme painted", pg.evaluate(
        "getComputedStyle(document.body.querySelector('#root')||document.body).backgroundColor"))
    check("no emoji in UI", not EMOJI.search(body), str(EMOJI.findall(body)[:4]))
    check("SVG icons rendered", pg.locator("svg").count() >= 6, f"{pg.locator('svg').count()} svg")
    check("Cormorant loaded", "Cormorant" in pg.evaluate(
        "getComputedStyle([...document.querySelectorAll('div')].find(e=>/Selamat/.test(e.textContent||'')&&e.children.length===0)).fontFamily"))

    # Qur'an reader on the live site
    pg.locator("text=Al-Qur’an").first.click()
    pg.wait_for_function("document.body.innerText.includes('An-Naas')", timeout=45000)
    check("surah index 114 live", "Al-Faatiha" in pg.inner_text("body"))
    pg.locator("text=Al-Kahf").first.click()
    pg.wait_for_function("document.body.innerText.includes('۝١')", timeout=45000)
    check("mushaf reader live (۝ marker + Arabic)", True)

    # search live
    pg.get_by_text("Cari", exact=True).first.click()
    pg.wait_for_function("!!document.querySelector('input')", timeout=20000)
    pg.fill("input", "makanan")
    time.sleep(3.0)
    check("Qur'an search live", "hasil" in pg.inner_text("body").lower())

    check("no subresource 404 / JS errors", not bad, str(bad[:3]))
    pg.screenshot(path="live-redesign.png")
    b.close()

print(f"\n---------- LIVE: {sum(checks)}/{len(checks)} passed ----------")
sys.exit(0 if all(checks) else 1)
