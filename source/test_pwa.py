"""Serve dist/site on localhost, install the service worker, go offline, reload: the game must still boot."""
import sys, threading, functools, http.server, socketserver, time
sys.path.insert(0, '/home/claude/game')
from harness import setup
from playwright.sync_api import sync_playwright

PORT = 8765
Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory='/home/claude/game/dist/site')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.TCPServer(('127.0.0.1', PORT), functools.partial(Q, directory='/home/claude/game/dist/site'))
threading.Thread(target=httpd.serve_forever, daemon=True).start()

with sync_playwright() as pw:
    browser, ctx, page, errs = setup(pw, 1180, 820)
    page.goto(f'http://localhost:{PORT}/')
    page.wait_for_function("() => navigator.serviceWorker && navigator.serviceWorker.controller !== undefined", timeout=10000)
    ok = page.evaluate("""async () => { const r = await navigator.serviceWorker.ready; await new Promise(r => setTimeout(r, 1500));
        const keys = await caches.keys(); const c = await caches.open(keys[0]); const reqs = await c.keys();
        return { scope: r.scope, caches: keys, entries: reqs.map(x => x.url.replace(location.origin, '')) }; }""")
    print('SW', ok)
    page.reload(); page.wait_for_timeout(800)
    print('controlled after reload:', page.evaluate('() => !!navigator.serviceWorker.controller'))
    httpd.shutdown(); httpd.server_close()
    ctx.set_offline(True)
    page.reload(); page.wait_for_timeout(1500)
    boot = page.evaluate("() => ({ play: !!document.querySelector('#btn-play'), hero: (document.querySelector('#home-hero-img')||{}).src?.slice(0,22), clips: typeof CLIPS === 'object' ? Object.keys(CLIPS).length : -1, title: document.title })")
    print('OFFLINE BOOT', boot)
    page.click('#btn-play', force=True); page.wait_for_timeout(2500)
    print('mission started offline:', page.evaluate("() => !!document.querySelector('#stage .task')"))
    page.screenshot(path='/home/claude/game/preview/pwa_offline.png')
    print('ERRORS', [e for e in errs if 'favicon' not in e])
    browser.close()
