"""CSP-safe live verification of https://dozir-app.vercel.app

Deliberately avoids page.evaluate / wait_for_function: the deployed CSP forbids
'unsafe-eval', so eval-based test APIs are blocked by design. Using selector
waits proves instead that the APP works under the strict policy.
"""
import sys
import re
import time

URL = sys.argv[1] if len(sys.argv) > 1 else "https://dozir-app.vercel.app"
SEC_HEADERS = [
    "content-security-policy",
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
    "permissions-policy",
]
checks, bad = [], []


def check(name, cond, extra=""):
    checks.append(bool(cond))
    print(("  OK   " if cond else "  FAIL ") + name + (f"  {extra}" if extra else ""))


from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    ctx = b.new_context(viewport={"width": 420, "height": 900})
    pg = ctx.new_page()
    pg.on("response", lambda r: bad.append((r.status, r.url[-60:])) if r.status >= 400 else None)
    pg.on("pageerror", lambda e: bad.append(("JS", str(e)[:120])))
    pg.on("console", lambda m: bad.append(("console", m.text[:120])) if m.type == "error" else None)

    r = pg.goto(URL, wait_until="load", timeout=90000)
    check("live page 200", r and r.status == 200, f"status={r.status if r else '?'}")

    hd = {k.lower(): v for k, v in (r.headers.items() if r else [])}
    missing = [h for h in SEC_HEADERS if h not in hd]
    check("all security headers present", not missing, f"missing={missing}")
    csp = hd.get("content-security-policy", "")
    check("CSP allows wasm (needed by SQLite)", "wasm-unsafe-eval" in csp)
    check("CSP blocks eval (no unsafe-eval)", "'unsafe-eval'" not in csp)
    check("CSP anti-clickjacking frame-ancestors", "frame-ancestors 'none'" in csp)
    check("CSP blocks plugins object-src", "object-src 'none'" in csp)

    # boot: selector-based wait, no eval (CSP-safe)
    booted = True
    try:
        pg.wait_for_selector("text=KUMPULAN ZIKIR & DOA", timeout=240000)
    except Exception:
        booted = False
    check("app boots under strict CSP (SQLite WASM runs)", booted)

    if booted:
        body = pg.inner_text("body")
        check("full Qur'an seeded (6.236 ayat)", "6.236 ayat" in body)
        check("no emoji in UI", not re.search(r"[\U0001F300-\U0001FAFF]", body))

        # reader: open Al-Qur'an -> a surah. NOTE: the list is a virtualised
        # FlatList -- An-Naas (row 114) is not in the DOM until scrolled, so
        # assert on the first rendered rows instead.
        try:
            pg.locator("text=Al-Qur’an").first.click()
            pg.wait_for_selector("text=Al-Faatiha", timeout=60000)
            check("surah index renders", "Al-Baqara" in pg.inner_text("body"))
            pg.locator("text=Al-Kahf").first.click()
            pg.wait_for_selector("text=Murattal", timeout=60000)
            rd = pg.inner_text("body")
            check("mushaf reader renders (Arabic + marker)",
                  any("\u0600" <= c <= "\u06FF" for c in rd) and "۝" in rd)
        except Exception as e:
            check("mushaf reader renders ayah marker", False, str(e)[:80])

        # wildcard-injection regression: '%' must NOT dump the whole mushaf.
        # Go back to Beranda first: the tab bar is hidden on pushed screens.
        try:
            pg.locator("text=Surah").first.click()  # reader back -> index
            pg.locator("text=Beranda").first.click()  # index back -> home
            pg.wait_for_selector("text=KUMPULAN ZIKIR & DOA", timeout=30000)
            pg.get_by_text("Cari", exact=True).first.click()
            pg.wait_for_selector("input", timeout=30000)
            pg.fill("input", "%")
            time.sleep(3.5)
            m = re.search(r"(\d+)\s+hasil", pg.inner_text("body"))
            n = int(m.group(1)) if m else -1
            check("LIKE wildcard no longer matches everything", n == 0 or n < 50, f"{n} hasil for '%'")
        except Exception as e:
            check("LIKE wildcard regression test", False, str(e)[:80])

    check("no 404 / JS / console errors", not bad, str(bad[:3]))
    pg.screenshot(path="live-csp.png")
    b.close()

print(f"\n---------- LIVE: {sum(checks)}/{len(checks)} passed ----------")
sys.exit(0 if all(checks) else 1)
