"""Diagnose the failing habit assertion by separating two hypotheses:
  H1 habit screen does not render an existing check-in  (in-session read)
  H2 OPFS SQLite does not survive a reload              (cross-session read)
"""
import http.server, socketserver, threading, functools, os, time

PORT = 8098
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist")
SHOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "habit-debug.png")


class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *a):
        pass


def serve():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(H, directory=ROOT)) as httpd:
        httpd.serve_forever()


threading.Thread(target=serve, daemon=True).start()
time.sleep(1.0)

from playwright.sync_api import sync_playwright


def open_habit(pg):
    pg.get_by_text("Habit", exact=True).first.click()
    pg.wait_for_function("document.body.innerText.toUpperCase().includes('KEBIASAAN HARIAN')", timeout=20000)
    time.sleep(1.8)
    return pg.inner_text("body")


with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    pg = b.new_page(viewport={"width": 420, "height": 900})
    pg.on("pageerror", lambda e: print("PAGEERROR:", str(e)[:300]))
    pg.goto(f"http://127.0.0.1:{PORT}/", wait_until="load", timeout=60000)
    pg.wait_for_function("document.body.innerText.includes('KATEGORI')", timeout=45000)
    print("booted; today =", time.strftime("%Y-%m-%d"))

    # do a check-in on the first Zikir Pagi dua
    pg.get_by_text("Zikir Pagi", exact=True).first.click()
    pg.wait_for_function("document.body.innerText.includes('Sayyidul')", timeout=20000)
    pg.locator("text=Sayyidul").first.click()
    pg.wait_for_function("document.body.innerText.includes('KEUTAMAAN')", timeout=20000)
    pg.locator("text=Tandai sudah dibaca").first.click()
    time.sleep(1.6)
    print("detail confirms check-in:", "Sudah dibaca hari ini" in pg.inner_text("body"))

    # ---- H1: same session, no reload ----
    pg.locator("text=Kembali").first.click()
    time.sleep(0.8)
    hb = open_habit(pg)
    print("\n=== [H1] in-session habit screen ===")
    print(hb[:600])
    print("[H1] lists Sayyidul ->", "Sayyidul" in hb)
    pg.screenshot(path=SHOT)

    # ---- H2: after reload ----
    pg.goto(f"http://127.0.0.1:{PORT}/", wait_until="load", timeout=60000)
    pg.wait_for_function("document.body.innerText.includes('KATEGORI')", timeout=45000)
    hb2 = open_habit(pg)
    print("\n=== [H2] post-reload habit screen ===")
    print(hb2[:600])
    print("[H2] lists Sayyidul ->", "Sayyidul" in hb2)
    b.close()
