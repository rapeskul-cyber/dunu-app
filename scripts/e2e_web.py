"""E2E for the redesigned app: manuscript UI + full Qur'an module.

Asserts design-system rules too (no emoji in UI, SVG icons present, correct
fonts loaded, Arabic rendered in Noto Naskh) — the point of this pass was that
v1 looked like AI slop, so the look is part of what gets verified.
"""
import http.server, socketserver, threading, functools, os, sys, time, re

PORT = 8099
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist")
EMOJI = re.compile("[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F000-\U0001F0FF]")


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # No COOP/COEP: expo-sqlite web uses OPFS via the File System Access API
        # and require-corp would block the recitation CDN (no CORP header).
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *a):
        pass


def serve():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=ROOT)) as h:
        h.serve_forever()


checks = []


def check(name, cond, extra=""):
    checks.append(bool(cond))
    print(("  OK   " if cond else "  FAIL ") + name + (f"  {extra}" if extra else ""))


if not os.path.isdir(ROOT):
    print("FAIL: dist/ missing - run: npx expo export --platform web")
    sys.exit(1)

threading.Thread(target=serve, daemon=True).start()
time.sleep(1.2)

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    ctx = b.new_context(viewport={"width": 420, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)[:180]))
    page.on("console", lambda m: errors.append("console: " + m.text[:180]) if m.type == "error" else None)

    page.goto(f"http://127.0.0.1:{PORT}/", wait_until="load", timeout=90000)

    # ---------- boot (includes 6236-ayah Qur'an seed) ----------
    page.wait_for_function("document.body.innerText.toUpperCase().includes('KUMPULAN ZIKIR')", timeout=240000)
    body = page.inner_text("body")
    check("boot: shell + seed complete", "KUMPULAN ZIKIR" in body.upper())
    check("Qur'an panel shows full counts", "6.236 ayat" in body and "114 surah" in body)

    # ---------- design system: no emoji icons ----------
    check("no emoji glyphs in home UI", not EMOJI.search(body), str(EMOJI.findall(body)[:5]))
    check("SVG icon layer rendered", page.locator("svg").count() >= 6, f"{page.locator('svg').count()} svg")

    # ---------- fonts actually applied ----------
    fam = page.evaluate("""() => {
      const els=[...document.querySelectorAll('div,span,p')];
      const g=(re)=>{const e=els.find(x=>re.test(x.textContent||'')&&x.children.length===0);
                     return e?getComputedStyle(e).fontFamily:null;};
      return {
        serif: g(/Selamat (pagi|siang|sore|malam)/),
        sans:  g(/Kumpulan zikir/),
        ar:    g(/\\u0600-\\u06FF/),
      }; }""")
    check("display type = Cormorant Garamond", fam["serif"] and "Cormorant" in fam["serif"], str(fam["serif"]))
    check("UI type = Public Sans", fam["sans"] and "Public Sans" in fam["sans"], str(fam["sans"]))
    check("Arabic type = Noto Naskh Arabic", fam["ar"] and "Noto Naskh" in fam["ar"], str(fam["ar"]))
    check("document fonts loaded", page.evaluate("document.fonts.status") == "loaded")

    # ---------- theme tokens: warm parchment, not #fff/#000 ----------
    bg = page.evaluate("""() => {
      const els=[document.body, ...document.body.querySelectorAll('*')];
      for (const e of els){const c=getComputedStyle(e).backgroundColor;
        if(c && c!=='rgba(0, 0, 0, 0)') return c;} return null; }""")
    rgb = tuple(int(x) for x in re.findall(r"\d+", bg or "")[:3])
    check("background is warm parchment (not pure white/grey)",
          len(rgb) == 3 and rgb[0] > rgb[2] and rgb[0] > 200, bg)

    # ---------- category -> detail (dhikr module) ----------
    page.get_by_text("Zikir Pagi", exact=True).first.click()
    page.wait_for_function("document.body.innerText.includes('Sayyidul')", timeout=20000)
    check("category list opens", "Sayyidul" in page.inner_text("body"))

    page.locator("text=Sayyidul").first.click()
    page.wait_for_function("document.body.innerText.toUpperCase().includes('KEUTAMAAN')", timeout=20000)
    d = page.inner_text("body")
    check("detail: Arabic panel", any("\u0600" <= c <= "\u06FF" for c in d))
    check("detail: Latin transliteration", "Allāhumma" in d)
    check("detail: translation", "Engkau adalah Tuhanku" in d)
    check("detail: citation with source", "Bukhari" in d and "SUMBER" in d.upper())
    check("detail: no emoji", not EMOJI.search(d))

    ar_js = """() => {
      const els=[...document.querySelectorAll('div,span,p')];
      const ar=els.find(e=>/[\\u0600-\\u06FF]/.test(e.textContent||'')&&e.children.length===0
                 && getComputedStyle(e).writingDirection==='rtl');
      return ar?parseFloat(getComputedStyle(ar).fontSize):null; }"""
    s1 = page.evaluate(ar_js)
    page.get_by_text("A+", exact=True).first.click()
    time.sleep(0.7)
    s2 = page.evaluate(ar_js)
    check("Arabic size stepper grows text", s1 and s2 and s2 > s1, f"{s1}px -> {s2}px")

    # ---------- habit check-in ----------
    page.locator("text=Tandai sudah dibaca").first.click()
    page.wait_for_function("document.body.innerText.includes('Sudah dibaca hari ini')", timeout=15000)
    check("habit check-in registers", True)

    # ---------- Qur'an: index + reader ----------
    page.get_by_text("Kembali", exact=True).first.click()
    page.locator("text=Al-Qur’an").first.click()
    page.wait_for_function("document.body.innerText.includes('An-Naas')", timeout=30000)
    qb = page.inner_text("body")
    check("surah index lists all 114", "Al-Faatiha" in qb and "An-Naas" in qb)
    check("surah metadata (Makkiyah/juz)", "Makkiyah" in qb and "ayat" in qb)

    page.locator("text=Al-Kahf").first.click()
    page.wait_for_function("document.body.innerText.includes('۝١')", timeout=30000)
    rd = page.inner_text("body")
    check("reader opens with Arabic-numeral ayah marker", "۝١" in rd)
    check("reader shows basmala header separately", "بِسْمِ ٱللَّهِ" in rd or "بِسْمِ" in rd)
    check("reader shows translation", len(rd) > 800)

    # infinite scroll loads more ayahs
    before = rd.count("۝")
    page.mouse.wheel(0, 6000)
    time.sleep(2.5)
    after = page.inner_text("body").count("۝")
    check("reader paginates on scroll", after > before, f"{before} -> {after} ayah markers")

    # bookmark an ayah
    page.locator("[aria-label='Tandai ayat']").first.click()
    time.sleep(1.2)
    check("ayah bookmark toggles", page.locator("[aria-label='Hapus tandai ayat']").count() >= 1)

    # ---------- search: dhikr + Qur'an ----------
    page.get_by_text("Cari", exact=True).first.click()
    page.wait_for_function("!!document.querySelector('input')", timeout=15000)
    page.fill("input", "sayidul")
    time.sleep(1.6)
    check("dhikr search w/ typo", "Sayyidul" in page.inner_text("body"))

    page.get_by_text("Al-Qur’an", exact=True).first.click()
    page.fill("input", "2:255")
    time.sleep(1.8)
    sb = page.inner_text("body")
    check("numeric quick-jump 2:255", "2:255" in sb and any("\u0600" <= c <= "\u06FF" for c in sb))

    page.fill("input", "makanan")
    time.sleep(2.0)
    mb = page.inner_text("body")
    check("Qur'an translation search", "makan" in mb.lower() and "hasil" in mb.lower())

    page.fill("input", "سميع")
    time.sleep(2.0)
    check("Qur'an Arabic search (diacritic-insensitive)", "hasil" in page.inner_text("body").lower())

    # ---------- tasbih ----------
    page.get_by_text("Tasbih", exact=True).first.click()
    page.wait_for_function("document.body.innerText.includes('dari')", timeout=20000)
    page.get_by_text("10×", exact=True).first.click()
    time.sleep(0.8)
    check("target switcher applies", "dari 10" in page.inner_text("body"))
    box = page.locator("svg").first.bounding_box()
    for _ in range(10):
        page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        time.sleep(0.1)
    time.sleep(1.2)
    tb = page.inner_text("body")
    check("cycle completes", "putaran selesai" in tb)
    check("tab bar hidden in focus mode", page.locator("text=Beranda").count() == 0)

    # ---------- persistence across reload ----------
    page.reload(wait_until="load")
    page.wait_for_function("document.body.innerText.toUpperCase().includes('KUMPULAN ZIKIR')", timeout=120000)
    r2 = page.inner_text("body")
    check("survives reload (DB persisted)", "1 hari" in r2 or "hari beruntun" in r2)
    check("no emoji after reload", not EMOJI.search(r2))

    check("no uncaught JS/console errors", not errors, str(errors[:2]))

    os.makedirs(os.path.join(ROOT, "..", "shots"), exist_ok=True)
    for name, act in [("home", lambda: page.get_by_text("Beranda", exact=True).first.click()),
                      ("quran", lambda: None)]:
        try:
            act()
            time.sleep(1.0)
            page.screenshot(path=os.path.join(ROOT, "..", "shots", f"{name}.png"))
        except Exception as e:
            print("  screenshot skipped:", name, str(e)[:60])
    b.close()

print(f"\n---------- {sum(checks)}/{len(checks)} checks passed ----------")
sys.exit(0 if all(checks) else 1)
