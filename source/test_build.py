"""Build mode (Стройка): place / paint / drag / pickaxe / blueprints / rocket / no gems / persistence."""
import sys, json, time
sys.path.insert(0, '/home/claude/game')
from harness import setup
from playwright.sync_api import sync_playwright

W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
TAG = f'{W}x{H}'; OUT = '/home/claude/game/preview'
L = {c: {"u": 1, "sc": 60, "n": 6, "ok": 4, "st": 1, "t": 0, "intro": 1} for c in 'АМОУ'}
seed = {"v": 1, "name": "Максим", "hero": "Супер-Макс", "boy": True, "mode": "sound", "lower": False, "rate": 0.9, "sfx": True,
        "len": 8, "gems": 60, "placed": 60, "missions": 5, "skin": "hero", "owned": ["hero"], "spent": 0, "L": L}
fails = []


def check(cond, msg):
    print(('OK   ' if cond else 'FAIL ') + msg)
    if not cond:
        fails.append(msg)


with sync_playwright() as pw:
    browser, ctx, page, errs = setup(pw, W, H, storage=seed)
    page.goto('file:///home/claude/game/dist/full.html'); page.wait_for_timeout(700)
    check(page.evaluate("() => window.__game.wallet()") == 60, 'wallet 60 at start (old auto-base does not eat gems)')
    page.click('[data-go="build"]', force=True); page.wait_for_timeout(900)
    page.screenshot(path=f'{OUT}/{TAG}_b_first.png')
    G = lambda: page.evaluate("() => window.__game.S()")

    def xy(x, y):
        return page.evaluate("""([x, y]) => { const G = window.__game.BV.g, r = document.querySelector('#build-cv').getBoundingClientRect();
            return [r.left + G.ox + (x + .5) * G.cs, r.top + G.oy + (y + .5) * G.cs]; }""", [x, y])

    def tap(x, y):
        px, py = xy(x, y); page.mouse.click(px, py); page.wait_for_timeout(60)

    def drag(cells):
        px, py = xy(*cells[0]); page.mouse.move(px, py); page.mouse.down()
        for c in cells[1:]:
            px, py = xy(*c); page.mouse.move(px, py, steps=3)
        page.mouse.up(); page.wait_for_timeout(80)

    def ch(x, y):
        return page.evaluate("([x, y]) => window.__game.S().world[y * window.__game.WW + x]", [x, y])

    def tool(t):
        page.click(f'.hb[data-t="{t}"]', force=True); page.wait_for_timeout(50)

    def wallet():
        return page.evaluate("() => window.__game.wallet()")

    said = lambda: page.evaluate("() => window.__said.slice()")
    check('Это твоя стройка! Выбери блок внизу и нажми, куда его поставить.' in said(), 'first visit explains the build')
    cs = page.evaluate("() => window.__game.BV.g.cs"); print('cell size', cs)

    tap(8, 9)
    check(ch(8, 9) == 'p' and wallet() == 59, 'tap places planks, costs 1 diamond')
    tool('brick')
    check('Кирпичик!' in said(), 'hotbar says the block name')
    drag([(2, 9), (6, 9)])
    check(all(ch(x, 9) == 'b' for x in range(2, 7)) and wallet() == 54, 'drag places a row of 5 bricks')
    tap(8, 9)
    check(ch(8, 9) == 'b' and wallet() == 54, 'tap on another block repaints it for free')
    drag([(8, 9), (8, 5)])
    check(all(ch(8, y) == 'b' for y in range(5, 10)) and wallet() == 50, 'vertical drag from a block builds a column')
    tool('pick')
    check('Кирка! Нажми на блок, и он превратится обратно в алмаз.' in said(), 'pickaxe explained')
    tap(8, 5)
    check(ch(8, 5) == '.' and wallet() == 51, 'pickaxe removes a block and gives the diamond back')
    drag([(2, 9), (6, 9)])
    check(all(ch(x, 9) == '.' for x in range(2, 7)) and wallet() == 56, 'pickaxe drag clears a row')
    page.wait_for_timeout(900)
    page.screenshot(path=f'{OUT}/{TAG}_b_free.png')

    # blueprint: house
    page.click('#btn-plan', force=True); page.wait_for_timeout(500)
    page.screenshot(path=f'{OUT}/{TAG}_b_plans.png')
    page.click('.plan-card[data-i="0"]', force=True); page.wait_for_timeout(400)
    check('Строим домик! Ставь блоки на подсказки.' in said(), 'blueprint chosen and announced')
    page.screenshot(path=f'{OUT}/{TAG}_b_house0.png')
    cells = page.evaluate("() => { const b = window.__game.BP[0]; return b.cells.map(c => [b.ox + c.x, b.oy + c.y, c.t]); }")
    gems0 = G()['gems']
    for i, (x, y, t) in enumerate(sorted(cells, key=lambda c: (-c[1], c[0]))):
        if ch(x, y) != '.':
            continue
        if G()['btool'] != t:
            tool(t)
        tap(x, y)
        if i == 12:
            page.screenshot(path=f'{OUT}/{TAG}_b_house_mid.png')
    page.wait_for_timeout(300)
    page.screenshot(path=f'{OUT}/{TAG}_b_house_done.png')
    page.wait_for_timeout(3500)
    s = G()
    check(0 in s['bpDone'] and s['gems'] == gems0 + 10, f'house finished: bonus +10 (gems {gems0} -> {s["gems"]})')
    check('Ура! Домик построен!' in said() and 'Держи десять алмазов в подарок!' in said(), 'house celebration voice')
    prog = page.evaluate("() => window.__game.bpProgress()"); check(prog[0] == prog[1], f'progress full {prog}')
    hdr = page.evaluate("() => [document.querySelector('#build-name').textContent, document.querySelector('#build-count').textContent]")
    print('header', hdr)

    # rocket (enough gems), over the house
    page.evaluate("() => { const S = window.__game.S(); S.gems += 80; window.__game.save(); gemsText(); }")
    page.click('#btn-plan', force=True); page.wait_for_timeout(300)
    page.click('.plan-card[data-i="3"]', force=True); page.wait_for_timeout(300)
    cells = page.evaluate("() => { const b = window.__game.BP[3]; return b.cells.map(c => [b.ox + c.x, b.oy + c.y, c.t]); }")
    for (x, y, t) in sorted(cells, key=lambda c: (-c[1], c[0])):
        if ch(x, y) != '.':
            continue
        if G()['btool'] != t:
            tool(t)
        tap(x, y)
    busy_seen = False
    for k in range(40):
        page.wait_for_timeout(150)
        b = page.evaluate("() => window.__game.BV.busy")
        busy_seen = busy_seen or b
        if k == 8:
            page.screenshot(path=f'{OUT}/{TAG}_b_rocket_fly.png')
        if busy_seen and not b:
            break
    page.wait_for_timeout(2500)
    check(busy_seen and not page.evaluate("() => window.__game.BV.busy"), 'rocket flew and landed')
    check('Ракета слетала в космос и вернулась!' in said(), 'rocket voice')
    check(3 in G()['bpDone'], 'rocket counted')
    page.screenshot(path=f'{OUT}/{TAG}_b_rocket_done.png')

    # out of diamonds
    page.evaluate("() => { const S = window.__game.S(); S.gems = S.spent + window.__game.usedBlocks(); window.__game.save(); gemsText(); }")
    check(wallet() == 0, 'wallet emptied')
    tool('glass'); tap(0, 0)
    page.wait_for_timeout(300)
    check(ch(0, 0) == '.', 'no diamonds: nothing placed')
    check('Нужны алмазы! Сыграй миссию, и будет из чего строить.' in said(), 'no diamonds: voice hint')
    check(page.is_visible('#build-play'), 'play button shows when out of diamonds')
    page.screenshot(path=f'{OUT}/{TAG}_b_empty.png')

    # persistence
    page.wait_for_timeout(400)
    stored = page.evaluate("() => JSON.parse(localStorage.getItem('supermax-letters-v1')).world")
    check(stored == G()['world'] and stored.count('.') < 160, 'world saved to storage')
    page.evaluate("() => goHome()"); page.wait_for_timeout(300)
    page.click('[data-go="build"]', force=True); page.wait_for_timeout(700)
    page.screenshot(path=f'{OUT}/{TAG}_b_reopen.png')
    for vw, vh in [(820, 1180), (1080, 810), (844, 390)]:
        page.set_viewport_size({'width': vw, 'height': vh}); page.wait_for_timeout(500)
        page.screenshot(path=f'{OUT}/{TAG}_b_vp{vw}x{vh}.png')
        print('vp', vw, vh, 'cell', page.evaluate("() => window.__game.BV.g && window.__game.BV.g.cs"))
    page.evaluate("() => goHome()"); page.wait_for_timeout(300)
    page.screenshot(path=f'{OUT}/{TAG}_b_home.png')
    miss = page.evaluate('() => [...new Set(window.__missing)]')
    print('missing', miss)
    print('errors', errs)
    check(not errs, 'no console errors')
    browser.close()
print('FAILS', fails)
