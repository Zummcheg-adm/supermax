"""Harder «Найди букву» and arcade: more blocks, look-alikes, speed bonus, find-all, levels, penalties, combo."""
import sys, time
sys.path.insert(0, '/home/claude/game')
from harness import setup, preload_emoji
from playwright.sync_api import sync_playwright

W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
TAG = f'{W}x{H}'; OUT = '/home/claude/game/preview'
L = {c: {"u": 1, "sc": sc, "n": 6, "ok": 4, "st": 1, "t": 0, "intro": 1}
     for c, sc in [('А', 95), ('М', 70), ('О', 60), ('У', 60), ('С', 60), ('Н', 60), ('Т', 30), ('И', 30), ('Л', 60), ('Ш', 95), ('Щ', 60)]}
seed = {"v": 1, "name": "Максим", "hero": "Супер-Макс", "boy": True, "mode": "sound", "lower": False, "rate": 0.9, "sfx": True,
        "len": 8, "gems": 40, "missions": 5, "L": L}
fails = []


def check(cond, msg):
    print(('OK   ' if cond else 'FAIL ') + msg)
    if not cond:
        fails.append(msg)


RUN = """([t, c]) => { const run = newRun('mission'); run.tasks = [{t, c}, {t:'find', c:'А'}]; run.i = 0; show('game');
  document.querySelector('#boss').hidden = false; document.querySelector('#free-title').hidden = true; renderHP(run);
  window.__done = false; TASKS[t]({t, c}, run).then(() => { window.__done = true; }).catch(() => {}); }"""

with sync_playwright() as pw:
    browser, ctx, page, errs = setup(pw, W, H, storage=seed)
    page.goto('file:///home/claude/game/dist/full.html'); page.wait_for_timeout(500)
    preload_emoji(page)
    S = lambda: page.evaluate("() => window.__game.S()")
    check(S()['fl'] == 2 and S()['al'] == 3, 'start levels: find 2, battle 3')

    def blocks():
        return page.evaluate("() => [...document.querySelectorAll('#stage .opts .lb')].map(b => b.dataset.c)")

    # plain find (force: no find-all) — count blocks, look-alikes, speed bonus
    page.evaluate("() => { Math.__r = Math.random; }")
    for k in range(3):
        page.evaluate("() => { Math.random = () => .9; }")   # .9 > .35 → no find-all
        page.evaluate(RUN, ['find', 'Ш'])
        page.wait_for_timeout(250)
        page.evaluate("() => { Math.random = Math.__r; }")
        bs = blocks()
        if k == 0:
            page.screenshot(path=f'{OUT}/{TAG}_hard_find.png')
            print('blocks', bs)
            check(len(bs) == 7, f'L3 letter at find level 2: 7 blocks (got {len(bs)})')
            check('Щ' in bs, 'look-alike Щ is among the blocks for Ш')
            check(page.is_visible('#stage .speed'), 'speed bar shown')
        g0 = S()['gems']
        page.click('#stage .opts .lb[data-c="Ш"]', force=True)
        page.wait_for_function("() => window.__done", timeout=15000)
        g1 = S()['gems']
        check(g1 - g0 == 2, f'fast answer: +2 diamonds (got {g1 - g0})')
    st = S()
    check(st['fl'] == 3, f'three fast answers → find level 3 (got {st["fl"]})')
    check('Новый уровень! Будет сложнее!' in page.evaluate("() => window.__said"), 'level-up voice')

    # slow answer → no bonus
    page.evaluate("() => { Math.random = () => .9; }"); page.evaluate(RUN, ['find', 'М']); page.evaluate("() => { Math.random = Math.__r; }")
    page.evaluate("() => { const s = document.querySelector('#stage .speed'); s.classList.add('over'); }")
    page.wait_for_timeout(200)
    page.evaluate("() => { window.__t0 = performance.now(); }")
    time.sleep(0.1)
    # make the round slow by waiting past the bonus window
    fast = page.evaluate("() => fastMs()")
    page.wait_for_timeout(fast + 300)
    g0 = S()['gems']
    page.click('#stage .opts .lb[data-c="М"]', force=True)
    page.wait_for_function("() => window.__done", timeout=15000)
    check(S()['gems'] - g0 == 1, 'slow answer: just 1 diamond')

    # find-all
    page.evaluate("() => { Math.random = () => .1; }"); page.evaluate(RUN, ['find', 'Л']); page.wait_for_timeout(200); page.evaluate("() => { Math.random = Math.__r; }")
    page.wait_for_timeout(300)
    bs = blocks(); n = bs.count('Л')
    print('find-all blocks', bs)
    check(n >= 2 and len(bs) >= 9, f'find-all: {n} targets among {len(bs)} blocks')
    check('Найди все буквы лэ!' in page.evaluate("() => window.__said"), 'find-all voice')
    page.screenshot(path=f'{OUT}/{TAG}_hard_findall.png')
    for i in range(n):
        page.click('#stage .opts .lb[data-c="Л"]:not([data-hit])', force=True); page.wait_for_timeout(120)
        if i == 0:
            check(page.inner_text('#stage .fa-cnt') == f'1/{n}', 'counter updates')
    page.wait_for_function("() => window.__done", timeout=15000)
    check(True, 'find-all finished after all targets')

    # wrong answers lower the level
    lvl = S()['fl']
    page.evaluate("() => { Math.random = () => .9; }"); page.evaluate(RUN, ['find', 'С']); page.evaluate("() => { Math.random = Math.__r; }")
    page.wait_for_timeout(300)
    wrong = page.evaluate("() => [...document.querySelectorAll('#stage .opts .lb')].map(b => b.dataset.c).filter(c => c !== 'С').slice(0, 2)")
    for wch in wrong:
        page.click(f'#stage .opts .lb[data-c="{wch}"]', force=True); page.wait_for_timeout(500)
    page.click('#stage .opts .lb[data-c="С"]', force=True)
    page.wait_for_function("() => window.__done", timeout=15000)
    check(S()['fl'] == lvl - 1, f'two mistakes → level down ({lvl} → {S()["fl"]})')

    # arcade (final battle) at level 3
    page.evaluate(RUN, ['arcade', 'Ш'])
    page.wait_for_selector('.drone'); page.wait_for_timeout(1500)
    check(page.inner_text('.arc-top .lvl') == 'УР. 3', 'battle level badge')
    nstars = page.evaluate("() => document.querySelectorAll('.arc-top .stars img').length")
    check(nstars == 6, f'level 3 needs 6 hits ({nstars})')
    page.screenshot(path=f'{OUT}/{TAG}_hard_arcade.png')
    # a wrong hit costs 2 seconds
    t_before = page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('.timer i')).transform.split('(')[1]) || 1")
    hit_wrong = page.evaluate("""() => { const d = [...document.querySelectorAll('.drone')].find(x => x.querySelector('.lb') && x.querySelector('.lb').dataset.c !== 'Ш');
        if (!d) return false; d.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, cancelable:true})); return true; }""")
    page.wait_for_timeout(120)
    t_after = page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('.timer i')).transform.split('(')[1]) || 1")
    print('timer', t_before, '→', t_after)
    if hit_wrong:
        check(t_before - t_after > 0.05, 'wrong hit takes time off the clock')
    # hit targets quickly for a combo and level-up
    g0 = S()['gems']; hits = 0; t0 = time.time()
    while time.time() - t0 < 30 and page.query_selector('#stage .task.arcade'):
        hits += page.evaluate("""() => { const d = [...document.querySelectorAll('.drone')].find(x => x.querySelector('.lb[data-c="Ш"]'));
            if (!d) return 0; const ar = document.querySelector('.arena').getBoundingClientRect(), r = d.getBoundingClientRect();
            if (r.right < ar.left + 5 || r.left > ar.right - 5) return 0;
            d.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, cancelable:true})); return 1; }""")
        page.wait_for_timeout(120)
    page.wait_for_function("() => window.__done", timeout=20000)
    st = S()
    print('battle hits', hits, 'gems +', st['gems'] - g0, 'al', st['al'])
    check(st['gems'] - g0 >= hits + 1, 'combo bonus diamonds')
    check(st['al'] in (3, 4), f'battle level after win: {st["al"]}')

    # Тир runs three rounds with levels
    page.evaluate("() => { goHome(); startTir(); }")
    page.wait_for_selector('.drone', timeout=15000); page.wait_for_timeout(800)
    page.screenshot(path=f'{OUT}/{TAG}_hard_tir.png')
    check(page.is_visible('.arc-top .lvl'), 'Тир shows the level')
    page.evaluate("() => goHome()")
    page.evaluate("() => openParent()"); page.wait_for_timeout(300)
    txt = page.inner_text('#parent')
    check('найди букву —' in txt and 'бой —' in txt, 'parent page shows levels')
    print('missing', sorted(set(page.evaluate('() => window.__missing'))))
    print('errors', errs)
    check(not errs, 'no console errors')
    browser.close()
print('FAILS', fails)
