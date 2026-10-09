import sys, json
sys.path.insert(0, '/home/claude/game')
from harness import setup, preload_emoji
from playwright.sync_api import sync_playwright
W, H = int(sys.argv[1]), int(sys.argv[2]); TAG = f'{W}x{H}'; OUT = '/home/claude/game/preview'
L = {c: {"u": 1, "sc": sc, "n": 6, "ok": 4, "st": 1, "t": 0, "intro": 1} for c, sc in [('А', 95), ('М', 70), ('О', 60), ('У', 40)]}
seed = {"v": 1, "name": "Максим", "hero": "Супер-Макс", "boy": True, "mode": "sound", "lower": False, "rate": 0.9, "sfx": True, "len": 8,
        "gems": 60, "placed": 60, "missions": 5, "skin": "hero", "owned": ["hero"], "spent": 0, "L": L}
with sync_playwright() as pw:
    browser, ctx, page, errs = setup(pw, W, H, storage=seed)
    page.goto('file:///home/claude/game/dist/full.html'); page.wait_for_timeout(700)
    page.screenshot(path=f'{OUT}/{TAG}_h_home.png')
    page.click('#tile-heroes', force=True); page.wait_for_timeout(600)
    page.screenshot(path=f'{OUT}/{TAG}_h_shop.png')
    # buy cosmonaut (20) and ninja (35): wallet 60 -> 5
    page.click('.hcard[data-h="h_cosmo"]', force=True); page.wait_for_timeout(500)
    page.click('.hcard[data-h="h_ninja"]', force=True); page.wait_for_timeout(500)
    page.click('.hcard[data-h="h_robot"]', force=True); page.wait_for_timeout(500)   # not enough
    st = page.evaluate("() => { const S = window.__game.S(); return { wallet: window.__game.wallet(), owned: S.owned, skin: S.skin, gems: S.gems, spent: S.spent }; }")
    print('after buys', st)
    page.wait_for_timeout(900)
    page.screenshot(path=f'{OUT}/{TAG}_h_shop2.png')
    # select cosmonaut back, then start a task to see hero-mini
    page.click('.hcard[data-h="h_cosmo"]', force=True); page.wait_for_timeout(400)
    page.evaluate("""() => { const run = newRun('mission'); run.tasks = [{t:'find', c:'А'}]; run.i = 0; show('game'); renderHP(run); TASKS.find({t:'find', c:'А'}, run).catch(()=>{}); }""")
    page.wait_for_timeout(700)
    page.screenshot(path=f'{OUT}/{TAG}_h_task.png')
    page.evaluate("() => { goHome(); openBase(); }"); page.wait_for_timeout(1500)
    page.screenshot(path=f'{OUT}/{TAG}_h_base.png')
    page.evaluate("() => goHome()"); page.wait_for_timeout(500)
    page.screenshot(path=f'{OUT}/{TAG}_h_home2.png')
    miss = page.evaluate('() => [...new Set(window.__missing)]')
    print('missing', miss, 'errors', errs)
    browser.close()
