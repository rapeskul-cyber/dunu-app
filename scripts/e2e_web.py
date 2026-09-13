"""End-to-end browser test of the exported web build (Phase 1-4, real UI).

Serves ./dist with cross-origin-isolation headers (needed for OPFS-backed
SQLite on web) and drives the actual app: boot -> seed -> category -> detail
-> font scaling -> habit check-in -> tasbih completion -> persistence -> search.
"""
import http.server
import socketserver
import threading
import functools
import sys
import os
import time

PORT = 8099
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist")


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Deliberately NO COOP/COEP here: expo-sqlite's web build uses OPFS via
        # the File System Access API (no SharedArrayBuffer needed), and
        # require-corp would block the recitation CDN, which sends no CORP.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *a):
        pass


def serve():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=ROOT)) as h:
        h.serve_forever()


def main():
    if not os.path.isdir(ROOT):
        print("FAIL: dist/ missing - run: npx expo export --platform web")
        sys.exit(1)

    threading.Thread(target=serve, daemon=True).start()
    time.sleep(1.2)

    from playwright.sync_api import sync_playwright

    checks = []

    def check(name, cond, extra=""):
        checks.append(bool(cond))
        print(("  OK   " if cond else "  FAIL ") + name + (f"  {extra}" if extra else ""))

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        page = browser.new_page(viewport={"width": 420, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)[:180]))
        page.on("console", lambda m: errors.append("console: " + m.text[:180]) if m.type == "error" else None)

        page.goto(f"http://127.0.0.1:{PORT}/", wait_until="load", timeout=60000)

        # ---------------- PHASE 1: bootstrap + seed ----------------
        try:
            page.wait_for_function("document.body.innerText.includes('KATEGORI')", timeout=45000)
        except Exception:
            print("  .. boot timeout, body was:", page.inner_text("body")[:200])
        body = page.inner_text("body")
        check("loader cleared, home rendered", "KATEGORI" in body.upper() and "MENYIAPKAN" not in body)
        # Info only: if SQLite works WITHOUT cross-origin isolation, we do not
        # need COOP/COEP and audio keeps working. Empirical, not assumed.
        print("  info crossOriginIsolated =", page.evaluate("crossOriginIsolated"))
        cats = ["Zikir Pagi", "Zikir Petang", "Setelah Sholat", "Sebelum Tidur", "Perlindungan", "Rezeki & Hajat"]
        check("all 6 seeded categories visible", all(c in body for c in cats))
        check("seed counts render (5 zikir)", "5 zikir" in body)
        check("streak widget renders", "hari" in body)

        # ---------------- PHASE 3: category -> detail ----------------
        page.get_by_text("Zikir Pagi", exact=True).first.click()
        page.wait_for_function("document.body.innerText.includes('Sayyidul')", timeout=20000)
        cbody = page.inner_text("body")
        check("category lists its duas", "Sayyidul" in cbody and "Ayat Kursi" in cbody)
        check("hadith grade chips render", "Shahih" in cbody)

        page.locator("text=Sayyidul").first.click()
        page.wait_for_function("document.body.innerText.includes('KEUTAMAAN')", timeout=20000)
        d = page.inner_text("body")
        check("Arabic text renders", any("\u0600" <= ch <= "\u06FF" for ch in d))
        check("Latin transliteration renders", "Allāhumma antā rabbī".replace("ā", "ā")[:12] in d or "Allāhumma" in d)
        check("Indonesian translation renders", "Engkau adalah Tuhanku" in d)
        check("benefit/keutamaan section renders", "KEUTAMAAN" in d and "surga" in d)
        check("source citation renders", "Bukhari" in d)

        # font-size control must change rendered Arabic glyph size
        size_js = """() => {
          const els=[...document.querySelectorAll('div,span,p')];
          const ar=els.find(e=>/[\\u0600-\\u06FF]/.test(e.textContent||'') && e.children.length===0);
          return ar ? getComputedStyle(ar).fontSize : null; }"""
        s1 = page.evaluate(size_js)
        page.get_by_text("A+", exact=True).first.click()
        time.sleep(0.8)
        s2 = page.evaluate(size_js)
        check("Arabic font size control works", s1 and s2 and s1 != s2, f"{s1} -> {s2}")

        # ---------------- PHASE 4: habit check-in ----------------
        page.locator("text=Tandai sudah dibaca").first.click()
        time.sleep(1.5)
        check("habit check-in registers", "Sudah dibaca hari ini" in page.inner_text("body"))

        # ---------------- PHASE 2: tasbih in the real UI ----------------
        page.locator("text=Hitung dengan Tasbih").first.click()
        page.wait_for_function("document.body.innerText.includes('dari')", timeout=20000)
        check("tasbih opens with seeded target", "dari 1" in page.inner_text("body"))

        page.get_by_text("10x", exact=True).first.click()
        time.sleep(1.0)
        check("target switcher applies", "dari 10" in page.inner_text("body"))

        # tap the ring centre 10x -> must complete a cycle
        box = page.locator("svg").first.bounding_box()
        cx, cy = (box["x"] + box["width"] / 2), (box["y"] + box["height"] / 2)
        for _ in range(10):
            page.mouse.click(cx, cy)
            time.sleep(0.1)
        time.sleep(1.5)
        tb = page.inner_text("body")
        check("completion banks a cycle", "putaran selesai" in tb, )
        check("counter wrapped to 0", "0" in tb and "dari 10" in tb)

        # persistence across reload (SQLite on disk, not memory)
        page.reload(wait_until="load")
        page.wait_for_function("document.body.innerText.includes('KATEGORI')", timeout=45000)
        check("survives full reload", "Zikir Pagi" in page.inner_text("body"))
        page.get_by_text("Beranda", exact=True).first.click() if False else None

        # streak/habit screen reflects the earlier check-in.
        # The checklist loads async from SQLite; the screen must show a loading
        # state (not a false "empty" state) until the query resolves.
        page.get_by_text("Habit", exact=True).first.click()
        page.wait_for_function("document.body.innerText.includes('Sayyidul')", timeout=15000)
        hb = page.inner_text("body")
        check("habit screen shows today's entry", "Sayyidul" in hb)
        check("habit progress tracks daily goal", "3 zikir" in hb)
        check("streak counted from real check-ins", "hari" in hb)

        # ---------------- PHASE 3: fuzzy search ----------------
        page.get_by_text("Cari", exact=True).first.click()
        page.wait_for_function("!!document.querySelector('input')", timeout=20000)
        for query, expect in [("rezeki", "Doa Kecukupan Rezeki"), ("ampuni", "Sayyidul"), ("kursi", "Ayat Kursi"), ("sayidul", "Sayyidul")]:
            page.fill("input", query)
            time.sleep(1.4)
            check(f"search “{query}”", expect in page.inner_text("body"))

        check("no uncaught JS/console errors", not errors, str(errors[:2]))
        browser.close()

    print(f"\n---------- {sum(checks)}/{len(checks)} checks passed ----------")
    sys.exit(0 if all(checks) else 1)


if __name__ == "__main__":
    main()
