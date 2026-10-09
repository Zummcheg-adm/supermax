"""Shared Playwright harness: local fonts, speech mock, helpers."""
import os, re, json, time
from playwright.sync_api import sync_playwright

FS = '/home/claude/game/fontpkgs/node_modules/@fontsource'
PKGS = ['dela-gothic-one', 'press-start-2p', 'rubik', 'noto-emoji']


def font_css():
    out = []
    for pkg in PKGS:
        css = open(f'{FS}/{pkg}/index.css', encoding='utf-8').read() if os.path.exists(f'{FS}/{pkg}/index.css') else ''
        for w in (500, 600, 700, 800):
            p = f'{FS}/{pkg}/{w}.css'
            if pkg == 'rubik' and os.path.exists(p):
                css += open(p, encoding='utf-8').read()
        css = css.replace('url(./files/', f'url(https://fonts.gstatic.com/fs/{pkg}/files/')
        if pkg == 'noto-emoji':
            css = css.replace("font-family: 'Noto Emoji'", "font-family: 'Noto Color Emoji'")
        out.append(css)
    return '\n'.join(out)


MOCK = r"""
(() => {
  window.__said = []; window.__missing = []; window.__voiceRate = window.__voiceRate || 4;
  const voices = [{name:'Test Russian', lang:'ru-RU', voiceURI:'test-ru', localService:true, default:true}];
  class U { constructor(t){ this.text = t; } }
  window.SpeechSynthesisUtterance = U;
  const mock = {
    speaking:false, pending:false, paused:false,
    getVoices(){ return window.__noVoices ? [] : voices; },
    speak(u){ window.__said.push(u.text); const ms = window.__speechMs ?? 15; setTimeout(()=>{ try{ u.onend && u.onend({}); }catch(e){} }, ms); },
    cancel(){}, pause(){}, resume(){},
    addEventListener(){}, removeEventListener(){}, onvoiceschanged:null
  };
  Object.defineProperty(window, 'speechSynthesis', {value: mock, configurable:true});
})();
"""


def setup(pw, w, h, touch=True, storage=None):
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, has_touch=touch)
    css = font_css()

    def gfonts(route):
        route.fulfill(status=200, headers={'content-type': 'text/css', 'access-control-allow-origin': '*'}, body=css)

    def gstatic(route):
        m = re.search(r'/fs/([^/]+)/files/(.+)$', route.request.url)
        if not m:
            return route.fulfill(status=404, body='')
        path = f'{FS}/{m.group(1)}/files/{m.group(2)}'
        if not os.path.exists(path):
            return route.fulfill(status=404, body='')
        ct = 'font/woff2' if path.endswith('woff2') else 'font/woff'
        route.fulfill(status=200, headers={'content-type': ct, 'access-control-allow-origin': '*'}, body=open(path, 'rb').read())

    ctx.route('https://fonts.googleapis.com/**', gfonts)
    ctx.route('https://fonts.gstatic.com/**', gstatic)
    ctx.add_init_script(MOCK)
    if storage is not None:
        ctx.add_init_script('try{localStorage.setItem("supermax-letters-v1", %s)}catch(e){}' % json.dumps(json.dumps(storage)))
    page = ctx.new_page()
    errs = []
    page.on('console', lambda m: errs.append(f'console.{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
    return browser, ctx, page, errs


def preload_emoji(page):
    page.evaluate("""async () => { const all = Object.values(window.__game.LET).flatMap(l => l.words.map(w => w.e)).filter(e => e[0] !== '#').join('');
      try { await document.fonts.load('64px "Noto Color Emoji"', all); } catch (e) {} }""")


def info(page):
    return page.evaluate("""() => { const R = window.__game.RUN; const t = R && R.tasks && R.tasks[R.i];
      const task = document.querySelector('#stage .task'); const scr = [...document.querySelectorAll('.screen')].find(s => !s.hidden);
      const st = document.querySelector('#stage'); const fresh = R && String(R.i) === st.dataset.ti;
      return { kind: R && R.kind, i: R ? R.i : null, t: t ? t.t : null, c: t ? t.c : null, cls: (task && (fresh || !R || R.kind !== 'mission')) ? task.className : '', screen: scr ? scr.id : null, n: R && R.tasks ? R.tasks.length : 0 }; }""")


def draw_trace(page, sloppy=False):
    pts = page.evaluate("""() => { const T = window.__game.TR; const r = T.cv.getBoundingClientRect();
        return T.cps.map(s => s.map(p => [r.left + p.sx, r.top + p.sy])); }""")
    for s in pts:
        x, y = s[0]
        page.mouse.move(x, y)
        page.mouse.down()
        if len(s) == 1:
            page.mouse.move(x + 2, y + 1)
        for (px, py) in s[1:]:
            off = 9 if sloppy else 0
            page.mouse.move(px + off, py - off, steps=2)
        page.mouse.up()
        time.sleep(0.05)
    return pts


def arcade_hits(page, target, need, timeout=40):
    t0 = time.time()
    hits = 0
    while time.time() - t0 < timeout:
        r = page.evaluate("""(c) => { const d = [...document.querySelectorAll('.drone')].find(x => x.querySelector('.lb[data-c="' + c + '"]'));
            if (!d) return 0; const ar = document.querySelector('.arena').getBoundingClientRect(); const r = d.getBoundingClientRect();
            if (r.right < ar.left + 5 || r.left > ar.right - 5) return 0;
            d.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, cancelable:true})); return 1; }""", target)
        hits += r
        if not page.query_selector('#stage .task.arcade'):
            break
        time.sleep(0.25)
    return hits
