"""«Читаем» и «Числа»: каждое задание на разных уровнях (скриншоты), подсказки, рост уровня, полные миссии, смешанная миссия, родители."""
import sys, time, json
sys.path.insert(0, '/home/claude/game')
from harness import setup, preload_emoji, arcade_hits
from playwright.sync_api import sync_playwright

W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
TAG = f'{W}x{H}'; OUT = '/home/claude/game/preview'
L = {c: {"u": 1, "sc": 70, "n": 6, "ok": 4, "st": 1, "t": 0, "intro": 1} for c in 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'}
seed = {"v": 1, "name": "Максим", "hero": "Супер-Макс", "mode": "sound", "gems": 300, "spent": 0, "missions": 40, "L": L,
        "petsSeen": 1, "buildSeen": 1}
fails = []


def check(cond, msg):
    print(('OK   ' if cond else 'FAIL ') + msg, flush=True)
    if not cond:
        fails.append(msg)


SEL = '#stage .opts [data-c="{0}"], #stage .wopts [data-c="{0}"], #stage .yn-row [data-c="{0}"], #stage .cmp [data-c="{0}"]'


def options(page):
    return page.evaluate("""() => [...document.querySelectorAll('#stage .opts [data-c], #stage .wopts [data-c], #stage .yn-row [data-c], #stage .cmp [data-c]')]
        .filter(b => !b.classList.contains('dead') && !b.dataset.used && !b.dataset.hit).map(b => b.dataset.c)""")


def wait_target(page, timeout=12):
    t0 = time.time()
    while time.time() - t0 < timeout:
        tg = page.evaluate("() => window.__target")
        if tg is not None:
            arc = page.query_selector('#stage .task.arcade')
            if arc or page.query_selector('#stage [data-c]'):
                return tg
        page.wait_for_timeout(80)
    return None


def click_c(page, c):
    el = page.query_selector(SEL.format(c))
    if not el:
        return False
    el.click(force=True); return True


def answer(page, tg, wrong=0):
    """Answer the current task: `wrong` wrong taps first, then the right one(s)."""
    if page.query_selector('#stage .task.arcade'):
        need = page.evaluate("() => document.querySelectorAll('#stage .stars img').length")
        return arcade_hits(page, tg, need, timeout=40)
    if isinstance(tg, list):   # «Собери слово»
        for _ in range(wrong):
            bad = page.evaluate("(need) => { const b = [...document.querySelectorAll('#stage .rb-opts .lb')].find(x => !x.dataset.used && x.dataset.c !== need); return b && b.dataset.c; }", tg[0])
            if bad:
                page.click(f'#stage .rb-opts .lb[data-c="{bad}"]:not([data-used])', force=True); page.wait_for_timeout(350)
        for s in tg:
            page.click(f'#stage .rb-opts .lb[data-c="{s}"]:not([data-used])', force=True); page.wait_for_timeout(250)
        return True
    for _ in range(wrong):
        bad = [c for c in options(page) if c != tg]
        if bad:
            click_c(page, bad[0]); page.wait_for_timeout(700)
    page.wait_for_timeout(120)
    return click_c(page, tg)


def run_task(page, t, k, level, wrong=0, shot=None):
    page.evaluate("""([t, k, lv]) => { const S = window.__game.S(); if (t === 'rd') S.rl = lv; else S.nl = lv;
        const run = newRun(t === 'rd' ? 'read' : 'num'); run.tasks = [{ t, k }]; run.i = 0;
        show('game'); renderHP(run); document.querySelector('#boss').hidden = false; document.querySelector('#free-title').hidden = true;
        window.__done = false; TASKS[t]({ t, k }, run).then(() => { window.__done = true; }, e => { window.__done = 'err:' + (e && e.stop ? 'stop' : e); }); }""", [t, k, level])
    tg = wait_target(page)
    if tg is None:
        return None, 'no target'
    page.wait_for_timeout(450)
    if shot:
        page.screenshot(path=f'{OUT}/{TAG}_{shot}.png')
    said0 = len(page.evaluate("() => window.__said"))
    answer(page, tg, wrong)
    t0 = time.time()
    while time.time() - t0 < 15:
        d = page.evaluate("() => window.__done")
        if d:
            break
        page.wait_for_timeout(100)
    return tg, page.evaluate("() => window.__done"), page.evaluate("(n) => window.__said.slice(n)", said0)


with sync_playwright() as pw:
    browser, ctx, page, errs = setup(pw, W, H, storage=seed)
    page.goto('file:///home/claude/game/dist/full.html'); page.wait_for_timeout(700)
    preload_emoji(page)
    page.evaluate("""async () => { const all = window.__game.PICS.map(p => p.e).concat(window.__game.STORIES.flatMap(s => s[2])).filter(e => e[0] !== '#').join('') + '🚂🧸🪵🍪🧱🦴🍎🎈🐟🍓🦆🚗🐞⚽🌸';
        try { await document.fonts.load('64px "Noto Color Emoji"', all); } catch (e) {} }""")
    check(page.is_visible('#btn-read') and page.is_visible('#btn-num'), 'home: ЧИТАЕМ and ЧИСЛА buttons')
    check(page.evaluate("() => document.querySelector('#btn-read').classList.contains('is-new')"), 'НОВОЕ badge')
    page.screenshot(path=f'{OUT}/{TAG}_l_home.png')

    # ---- every reading task kind
    for k, lv, wrong in [('sylRun', 1, 1), ('sylEar', 1, 0), ('sylEar', 3, 2), ('sylPic', 2, 1), ('sylPic', 4, 0), ('wordPic', 3, 0), ('wordPic', 6, 2),
                         ('wordEar', 4, 1), ('wordEar', 7, 0), ('build', 3, 2), ('build', 7, 0), ('yesNo', 7, 1), ('story', 9, 2), ('arcade', 2, 0)]:
        r = run_task(page, 'rd', k, lv, wrong, shot=f'l_rd_{k}_{lv}')
        tg, done = r[0], r[1]
        print(f'   rd {k} L{lv} target={tg} said={r[2][:8] if len(r) > 2 else ""}')
        check(done is True, f'reading {k} at level {lv} finished ({done})')
    page.evaluate("() => goHome()")
    # ---- every number task kind
    for k, lv, wrong in [('count', 1, 0), ('count', 2, 2), ('count', 4, 1), ('find', 2, 1), ('find', 6, 0), ('missing', 2, 0), ('missing', 7, 2),
                         ('compare', 1, 1), ('compare', 5, 0), ('arith', 1, 2), ('arith', 3, 0), ('arith', 8, 1), ('arith', 10, 0), ('bond', 6, 1),
                         ('word', 3, 2), ('word', 7, 0), ('arcade', 2, 0), ('arcade', 5, 0)]:
        r = run_task(page, 'nm', k, lv, wrong, shot=f'l_nm_{k}_{lv}')
        tg, done = r[0], r[1]
        print(f'   nm {k} L{lv} target={tg} said={r[2][:10] if len(r) > 2 else ""}')
        check(done is True, f'numbers {k} at level {lv} finished ({done})')
    page.evaluate("() => goHome()")

    # ---- generated content sanity: arithmetic never negative / over 100, decoys distinct
    bad = page.evaluate("""() => { const out = []; for (let L = 1; L <= 10; L++) for (let i = 0; i < 400; i++) { const e = window.__game.arithGen(L);
        if (!(e.ans >= 1 && e.ans <= 100 && e.a >= 1 && e.b >= 1)) out.push([L, e]); } return out.slice(0, 5); }""")
    check(not bad, f'arithmetic stays within 1..100 {bad}')

    # ---- level up after four right answers in a row
    page.evaluate("() => { const S = window.__game.S(); S.rl = 3; S.rlS = 0; S.rlB = 0; }")
    for i in range(4):
        run_task(page, 'rd', 'wordPic', page.evaluate("() => window.__game.S().rl"), 0)
    check(page.evaluate("() => window.__game.S().rl") == 4, f'reading level 3 → 4 after four right answers ({page.evaluate("() => window.__game.S().rl")})')
    page.evaluate("() => { const S = window.__game.S(); S.nl = 4; S.nlS = 0; S.nlB = 0; }")
    for i in range(2):
        run_task(page, 'nm', 'find', 4, 2)
    check(page.evaluate("() => window.__game.S().nl") == 3, 'numbers level drops after two hard tasks')
    page.evaluate("() => goHome()")

    # ---- a full reading mission from the home button
    page.evaluate("() => { const S = window.__game.S(); S.rl = 2; S.len = 6; }")
    gems0 = page.evaluate("() => window.__game.wallet()")
    page.click('#btn-read', force=True)
    seen = {}; t0 = time.time()
    while time.time() - t0 < 150:
        if page.is_visible('#scr-reward'):
            break
        tg = wait_target(page, 3)
        if tg is None:
            continue
        key = page.evaluate("() => window.__game.RUN ? window.__game.RUN.i : -1")
        if key in seen and time.time() - seen[key] < 2.5:
            page.wait_for_timeout(150); continue
        if key in seen:
            print('   retry task', key, tg, page.evaluate("() => (document.querySelector('#stage .task') || {}).className"))
        seen[key] = time.time(); answer(page, tg, 0); page.wait_for_timeout(300)
    page.wait_for_timeout(1500)
    check(page.is_visible('#scr-reward'), f'reading mission finished ({len(seen)} tasks)')
    chips = page.evaluate("() => [...document.querySelectorAll('#rw-letters .chip')].map(c => c.textContent)")
    print('   chips', chips)
    check(len(chips) >= 3 and chips[0].startswith('ЧТЕНИЕ'), 'reward shows what was read')
    check(page.evaluate("() => window.__game.wallet()") > gems0, 'gems earned')
    check(not page.evaluate("() => document.querySelector('#btn-read').classList.contains('is-new')"), 'badge gone after first play')
    page.screenshot(path=f'{OUT}/{TAG}_l_reward.png')
    page.click('#rw-again', force=True); page.wait_for_timeout(600)
    check(page.evaluate("() => window.__game.RUN && window.__game.RUN.kind") == 'read', '«Ещё» starts reading again')
    page.evaluate("() => goHome()"); page.wait_for_timeout(300)

    # ---- a full numbers mission
    page.evaluate("() => { const S = window.__game.S(); S.nl = 4; S.len = 6; }")
    page.click('#btn-num', force=True)
    seen = {}; t0 = time.time()
    while time.time() - t0 < 150:
        if page.is_visible('#scr-reward'):
            break
        tg = wait_target(page, 3)
        if tg is None:
            continue
        key = page.evaluate("() => window.__game.RUN ? window.__game.RUN.i : -1")
        if key in seen and time.time() - seen[key] < 2.5:
            page.wait_for_timeout(150); continue
        if key in seen:
            print('   retry task', key, tg, page.evaluate("() => (document.querySelector('#stage .task') || {}).className"))
        seen[key] = time.time(); answer(page, tg, 0); page.wait_for_timeout(300)
    page.wait_for_timeout(1500)
    check(page.is_visible('#scr-reward'), f'numbers mission finished ({len(seen)} tasks)')
    print('   chips', page.evaluate("() => [...document.querySelectorAll('#rw-letters .chip')].map(c => c.textContent)"))
    page.evaluate("() => goHome()"); page.wait_for_timeout(300)

    # ---- letters mission mixes in one reading and one numbers task
    kinds = page.evaluate("() => { const S = window.__game.S(); S.len = 8; const t = planMission(); return t.map(x => x.t); }")
    print('   mission', kinds)
    check('rd' in kinds and 'nm' in kinds, 'letter mission has a reading and a numbers task')

    # ---- parent screen
    page.evaluate("() => openParent()"); page.wait_for_timeout(300)
    rl0 = page.evaluate("() => window.__game.S().rl")
    page.click('#p-rlup', force=True); page.wait_for_timeout(150)
    check(page.evaluate("() => window.__game.S().rl") == min(10, rl0 + 1), 'parent can raise the reading level')
    page.screenshot(path=f'{OUT}/{TAG}_l_parent.png', full_page=False)
    page.evaluate("() => document.querySelector('.parent-wrap').scrollTop = 0")
    miss = sorted(set(page.evaluate('() => window.__missing')))
    print('missing clips', len(miss), miss[:12])
    print('errors', errs)
    check(not errs, 'no console errors')
    browser.close()
print('FAILS', fails)
