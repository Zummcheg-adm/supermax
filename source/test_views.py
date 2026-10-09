import sys, time, json
sys.path.insert(0, '/home/claude/game')
from harness import setup, preload_emoji, draw_trace
from playwright.sync_api import sync_playwright

W, H = int(sys.argv[1]), int(sys.argv[2])
only = sys.argv[3].split(',') if len(sys.argv) > 3 else None
TAG = f'{W}x{H}'
OUT = '/home/claude/game/preview'
URL = 'file:///home/claude/game/dist/full.html'

L = {}
for c, sc in [('А', 95), ('М', 70), ('О', 60), ('У', 40), ('С', 30), ('Ж', 0), ('Щ', 10), ('Ё', 5), ('Й', 5), ('Д', 5)]:
    L[c] = {"u": 1, "sc": sc, "n": 6, "ok": 4, "st": 1, "t": 0, "intro": 1}
seed = {"v": 1, "name": "Максим", "hero": "Супер-Макс", "boy": True, "mode": "sound", "lower": True, "voiceURI": "", "rate": 0.9,
        "sfx": True, "len": 8, "gems": 40, "placed": 31, "missions": 4, "L": L}

RUNTASK = """([t, c]) => { const run = newRun('mission'); run.tasks = [{t, c}, {t:'find', c:'А'}]; run.i = 0; show('game');
  document.querySelector('#boss').hidden = false; document.querySelector('#free-title').hidden = true; renderHP(run);
  TASKS[t]({t, c}, run).catch(() => {}); }"""


def want(name):
    return only is None or name in only


with sync_playwright() as pw:
    browser, ctx, page, errs = setup(pw, W, H, storage=seed)
    page.goto(URL)
    page.wait_for_timeout(500)
    preload_emoji(page)
    page.wait_for_timeout(700)
    if want('home'):
        page.screenshot(path=f'{OUT}/{TAG}_v_home.png')
    if want('intro'):
        page.evaluate(RUNTASK, ['intro', 'Ж'])
        page.wait_for_selector('#stage .next:not([hidden])', timeout=15000)
        page.wait_for_timeout(500)
        page.screenshot(path=f'{OUT}/{TAG}_v_intro.png')
    for kind, c in [('find', 'О'), ('pic', 'М'), ('match', 'У')]:
        if not want(kind):
            continue
        page.evaluate(RUNTASK, [kind, c])
        page.wait_for_selector('#stage .opts .lb')
        page.wait_for_timeout(500)
        page.screenshot(path=f'{OUT}/{TAG}_v_{kind}.png')
    if want('trace'):
        for c in ['Щ', 'Ё', 'Й', 'Д', 'Ж']:
            page.evaluate(RUNTASK, ['trace', c])
            page.wait_for_function("() => window.__game.TR && !window.__game.TR.demoS", timeout=30000)
            page.wait_for_timeout(200)
            if c in ('Щ', 'Ё'):
                page.screenshot(path=f'{OUT}/{TAG}_v_trace_{c}.png')
            pts = draw_trace(page, sloppy=True)
            page.wait_for_timeout(100)
            fin = page.evaluate("() => { const T = window.__game.TR; return T ? [T.finished, T.done.map(Boolean)] : 'gone'; }")
            print('trace', c, fin)
            if c == 'Щ':
                page.screenshot(path=f'{OUT}/{TAG}_v_trace_{c}_done.png')
    if want('arcade'):
        page.evaluate(RUNTASK, ['arcade', 'С'])
        page.wait_for_selector('.drone')
        page.wait_for_timeout(2500)
        page.screenshot(path=f'{OUT}/{TAG}_v_arcade.png')
    if want('reward'):
        page.evaluate("""() => { const run = newRun('mission'); run.tasks = [{t:'find',c:'А'},{t:'find',c:'М'},{t:'pic',c:'О'},{t:'trace',c:'Ж'},{t:'arcade',c:'С'}];
            run.earned = 11; run.before['М'] = 1; finishMission(run).catch(()=>{}); }""")
        page.wait_for_timeout(1300)
        page.screenshot(path=f'{OUT}/{TAG}_v_reward.png')
    if want('base'):
        page.evaluate("() => { goHome(); window.__game.S().gems = 75; openBase(); }")
        page.wait_for_function("() => window.__game.S().placed >= 75", timeout=60000)
        page.wait_for_timeout(1500)
        page.screenshot(path=f'{OUT}/{TAG}_v_base.png')
    if want('abc'):
        page.evaluate("() => openABC('abc')")
        page.wait_for_timeout(500)
        page.screenshot(path=f'{OUT}/{TAG}_v_abc.png')
        page.evaluate("() => openCard('Ж')")
        page.wait_for_timeout(500)
        page.screenshot(path=f'{OUT}/{TAG}_v_card.png')
        page.evaluate("() => closeModal()")
    if want('parent'):
        page.evaluate("() => { goHome(); openGate(); }")
        page.wait_for_timeout(300)
        page.screenshot(path=f'{OUT}/{TAG}_v_gate.png')
        page.evaluate("() => { closeModal(); openParent(); }")
        page.wait_for_timeout(400)
        page.screenshot(path=f'{OUT}/{TAG}_v_parent.png')
        page.evaluate("() => document.querySelector('.parent-wrap').scrollTop = 99999")
        page.wait_for_timeout(200)
        page.screenshot(path=f'{OUT}/{TAG}_v_parent2.png')
    if want('tir'):
        page.evaluate("() => { goHome(); startTir(); }")
        page.wait_for_selector('.drone', timeout=15000)
        page.wait_for_timeout(1800)
        page.screenshot(path=f'{OUT}/{TAG}_v_tir.png')
    # horizontal overflow check on every screen
    ov = page.evaluate("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, document.body.scrollWidth]")
    print('overflow', ov)
    print('ERRORS', errs)
    browser.close()
