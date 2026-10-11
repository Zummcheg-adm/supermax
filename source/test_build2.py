"""Стройка v2: участки, вкладки блоков, рамка, динамит, ночь, семья ходит по постройкам, новые чертежи и герои."""
import sys, time
sys.path.insert(0, '/home/claude/game')
from harness import setup
from playwright.sync_api import sync_playwright

W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
TAG = f'{W}x{H}'; OUT = '/home/claude/game/preview'
old_world = '.' * (16 * 9) + '....bbbb........'          # 4 bricks on the bottom row (old single-world save)
L = {c: {"u": 1, "sc": 80, "n": 6, "ok": 4, "st": 1, "t": 0, "intro": 1} for c in 'АМОУСНТИЛК'}
seed = {"v": 1, "name": "Максим", "hero": "Супер-Макс", "mode": "sound", "gems": 400, "spent": 0, "missions": 30,
        "world": old_world, "bp": -1, "bpDone": [0, 1, 2, 3, 4], "btool": "brick", "buildSeen": 1, "L": L,
        "owned": ["hero", "h_cosmo", "h_ninja", "h_robot", "h_builder", "h_dino", "h_knight", "h_pirate", "h_wizard"]}
fails = []


def check(cond, msg):
    print(('OK   ' if cond else 'FAIL ') + msg)
    if not cond:
        fails.append(msg)


with sync_playwright() as pw:
    browser, ctx, page, errs = setup(pw, W, H, storage=seed)
    page.goto('file:///home/claude/game/dist/full.html'); page.wait_for_timeout(700)
    S = lambda: page.evaluate("() => window.__game.S()")
    said = lambda: page.evaluate("() => window.__said.slice()")
    st = S()
    check(st['worlds'][0] == old_world and st['world'] == old_world, 'old build moved to plot «Луг»')
    w0 = page.evaluate("() => window.__game.wallet()")
    check(w0 == 396, f'wallet still counts the 4 old bricks ({w0})')
    page.click('[data-go="build"]', force=True); page.wait_for_timeout(1200)
    res = page.evaluate("() => BV.res.map(r => r.id)")
    check('vinni' in res and 'elli' in res, f'Винни и Элли гуляют по стройке {res}')
    check('Смотри! Теперь на стройке живёт наша семья. Нажми на семью внизу!' in said(), 'family hello')
    page.screenshot(path=f'{OUT}/{TAG}_b2_open.png')

    def xy(x, y):
        return page.evaluate("""([x, y]) => { const G = BV.g, r = document.querySelector('#build-cv').getBoundingClientRect();
            return [r.left + G.ox + (x + .5) * G.cs, r.top + G.oy + (y + .5) * G.cs]; }""", [x, y])

    def tap(x, y):
        px, py = xy(x, y); page.mouse.click(px, py); page.wait_for_timeout(80)

    def drag(a, b):
        px, py = xy(*a); page.mouse.move(px, py); page.mouse.down()
        px, py = xy(*b); page.mouse.move(px, py, steps=6); page.mouse.up(); page.wait_for_timeout(150)

    ch = lambda x, y: page.evaluate("([x, y]) => window.__game.S().world[y * 16 + x]", [x, y])
    # tabs
    page.click('.hb-tab[data-tab="3"]', force=True); page.wait_for_timeout(150)
    items = page.evaluate("() => [...document.querySelectorAll('.hb-items .hb')].map(b => b.dataset.t)")
    check(items == ['slopeL', 'slopeR', 'fence', 'lamp', 'tnt'], f'«Особые» tab {items}')
    page.click('.hb[data-t="tnt"]', force=True); page.wait_for_timeout(150)
    check('Динамит! Поставь его и нажми на него ещё раз. Будет бум!' in said(), 'TNT explained')
    # bricks around the TNT, then boom
    page.evaluate("() => { const S = window.__game.S(); let w = S.world.split(''); [[9,9],[10,9],[11,9],[10,8],[12,9]].forEach(([x,y]) => w[y*16+x] = 'b'); S.world = w.join(''); S.worlds[S.plot] = S.world; bReq(); }")
    tap(10, 7)
    check(ch(10, 7) == 't', 'TNT placed')
    tap(10, 7); page.wait_for_timeout(500)
    check(page.evaluate("() => BV.fuses.length") == 1, 'tap on TNT lights the fuse')
    page.screenshot(path=f'{OUT}/{TAG}_b2_fuse.png')
    page.wait_for_timeout(1400)
    print('after boom', [ch(x, y) for (x, y) in [(10,7),(10,8),(9,9),(10,9),(11,9),(12,9)]])
    check(ch(10, 7) == '.' and ch(10, 8) == '.' and ch(10, 9) == '.' and ch(11, 9) == '.' and ch(12, 9) == 'b', 'BOOM: TNT and nearby blocks gone, far ones stay')
    check(ch(5, 9) == 'b', 'far bricks stay')
    # fill tool
    page.click('.hb-tab[data-tab="0"]', force=True); page.click('.hb[data-t="planks"]', force=True)
    page.click('.hb[data-t="fill"]', force=True); page.wait_for_timeout(100)
    check('Рамка! Проведи пальцем, и всё внутри заполнится блоками.' in said(), 'fill tool explained')
    w1 = page.evaluate("() => window.__game.wallet()")
    drag((11, 9), (14, 7))
    filled = sum(1 for x in range(11, 15) for y in range(7, 10) if ch(x, y) == 'p')
    check(filled == 11, f'rectangle filled with planks around the leftover brick ({filled})')
    check(page.evaluate("() => window.__game.wallet()") == w1 - 11, 'each filled block costs a diamond')
    # roof with slopes
    page.click('.hb-tab[data-tab="3"]', force=True); page.click('.hb[data-t="slopeL"]', force=True); tap(11, 6)
    page.click('.hb[data-t="slopeR"]', force=True); tap(14, 6)
    page.click('.hb[data-t="lamp"]', force=True); tap(8, 9)
    page.click('.hb[data-t="fence"]', force=True); tap(7, 9)
    # family: dad onto the planks block
    page.click('.hb-tab[data-tab="4"]', force=True); page.wait_for_timeout(100)
    fam = page.evaluate("() => [...document.querySelectorAll('.hb-items .hb')].map(b => b.dataset.t)")
    check(len(fam) == 7, f'family tab: {fam}')
    page.click('.hb[data-t="fam:dad"]', force=True); page.wait_for_timeout(100)
    tap(12, 3)
    d = page.evaluate("() => { const r = BV.res.find(r => r.id === 'dad'); return r && [r.x, r.y]; }")
    check(d is not None and d[1] == 6, f'папа стоит на крыше/доске ({d})')
    check('Это папа!' in said(), 'dad says hello')
    page.click('.hb[data-t="fam:mom"]', force=True); tap(3, 2)
    page.click('.hb[data-t="fam:baby"]', force=True); tap(6, 2)
    page.click('.hb[data-t="fam:max"]', force=True); tap(1, 2)
    p0 = page.evaluate("() => BV.res.map(r => r.x)")
    page.wait_for_timeout(2500)
    p1 = page.evaluate("() => BV.res.map(r => r.x)")
    check(sum(1 for a, b in zip(p0, p1) if abs(a - b) > .2) >= 2, 'family walks around')
    page.screenshot(path=f'{OUT}/{TAG}_b2_family.png')
    # tap on a resident → jump + voice
    page.evaluate("() => { BV.res.forEach((r, k) => { r.wait = 5; if (r.id === 'mom') { r.x = 15.5; r.y = 9; r.dy = 0; } else if (r.x > 13) r.x = 2.5 + k; }); }")
    q = page.evaluate("() => { const r = BV.res.find(r => r.id === 'mom'); const q = resRect(r), b = document.querySelector('#build-cv').getBoundingClientRect(); return [b.left + q.x + q.w / 2, b.top + q.y + q.h * .3]; }")
    page.mouse.click(q[0], q[1]); page.wait_for_timeout(150)
    print('last said', said()[-2:])
    check(said()[-1] == 'Это мама!', 'tap mom → «Это мама!»')
    # night
    page.click('#btn-night', force=True); page.wait_for_timeout(600)
    check(S()['night'] and 'night' in page.get_attribute('#build-stage', 'class'), 'night mode')
    page.screenshot(path=f'{OUT}/{TAG}_b2_night.png')
    page.click('#btn-night', force=True); page.wait_for_timeout(200)
    # plots
    used0 = page.evaluate("() => window.__game.usedBlocks()")
    page.click('#btn-plot', force=True); page.wait_for_timeout(400)
    page.screenshot(path=f'{OUT}/{TAG}_b2_plots.png')
    page.click('.plan-card[data-i="1"]', force=True); page.wait_for_timeout(600)
    check(S()['plot'] == 1 and S()['world'].count('.') == 160, 'winter plot is empty')
    check('Зима!' in said(), 'plot voice')
    page.click('.hb-tab[data-tab="2"]', force=True); page.click('.hb[data-t="snow"]', force=True)
    for x in range(5, 11):
        tap(x, 9)
    check(page.evaluate("() => window.__game.usedBlocks()") == used0 + 6, 'blocks on all plots are counted')
    page.screenshot(path=f'{OUT}/{TAG}_b2_winter.png')
    page.click('#btn-plot', force=True); page.wait_for_timeout(300); page.click('.plan-card[data-i="3"]', force=True); page.wait_for_timeout(500)
    page.screenshot(path=f'{OUT}/{TAG}_b2_moon.png')
    page.click('#btn-plot', force=True); page.wait_for_timeout(300); page.click('.plan-card[data-i="0"]', force=True); page.wait_for_timeout(500)
    check(S()['plot'] == 0 and S()['world'][16 * 7 + 12] == 'p', 'back on «Луг»: the build is still here')
    check(len(page.evaluate("() => BV.res")) >= 4, 'family is back on «Луг»')
    # new blueprint: big house
    big = page.evaluate("() => window.__game.BP.findIndex(b => b.name === 'Большой дом')")
    page.evaluate("(i) => { const S = window.__game.S(); S.world = '.'.repeat(160); S.worlds[0] = S.world; bSetPlan(i); }", big)
    cells = page.evaluate("(i) => { const b = window.__game.BP[i]; return b.cells.map(c => [b.ox + c.x, b.oy + c.y, c.t]); }", big)
    for (x, y, t) in sorted(cells, key=lambda c: (-c[1], c[0])):
        if S()['btool'] != t:
            tab = page.evaluate("(t) => window.__game.BLOCKS.find(b => b.t === t).cat", t)
            page.click(f'.hb-tab[data-tab="{tab}"]', force=True)
            page.click(f'.hb[data-t="{t}"]', force=True)
        tap(x, y)
    page.wait_for_timeout(2500)
    check(big in S()['bpDone'], 'big house blueprint finished')
    page.screenshot(path=f'{OUT}/{TAG}_b2_bighouse.png')
    page.click('#btn-plan', force=True); page.wait_for_timeout(400)
    page.screenshot(path=f'{OUT}/{TAG}_b2_plans.png')
    page.evaluate("() => closeModal()")
    # heroes
    page.evaluate("() => goHome()"); page.click('#tile-heroes', force=True); page.wait_for_timeout(500)
    n = page.evaluate("() => document.querySelectorAll('.hcard').length")
    check(n == 17, f'17 heroes ({n})')
    page.click('.hcard[data-h="h_tanker"]', force=True); page.wait_for_timeout(300)
    check('h_tanker' in S()['owned'], 'bought Танкист')
    page.screenshot(path=f'{OUT}/{TAG}_b2_heroes.png')
    print('errors', errs)
    check(not errs, 'no console errors')
    browser.close()
print('FAILS', fails)
