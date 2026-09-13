"""Diagnose why the web build does not reach the home screen."""
import http.server, socketserver, threading, functools, os, time

PORT = 8097
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist")


class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *a):
        pass


def serve():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(H, directory=ROOT)) as h:
        h.serve_forever()


threading.Thread(target=serve, daemon=True).start()
time.sleep(1.0)

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    pg = b.new_page(viewport={"width": 420, "height": 900})
    pg.on("pageerror", lambda e: print("PAGEERROR:", str(e)[:400]))
    pg.on("console", lambda m: print(f"CONSOLE[{m.type}]:", m.text[:300]))
    pg.on("response", lambda r: print("HTTP", r.status, r.url[-70:]) if r.status >= 400 else None)
    pg.on("requestfailed", lambda r: print("REQFAIL:", r.url[-70:], r.failure))
    pg.goto(f"http://127.0.0.1:{PORT}/", wait_until="load", timeout=90000)
    for i in range(1, 11):
        time.sleep(10)
        txt = pg.inner_text("body")
        print(f"--- t={i*10}s ---")
        print(txt[:300].replace("\n", " | "))
        if "Kumpulan" in txt or "Selamat" in txt:
            print(">>> HOME REACHED")
            break
    b.close()
