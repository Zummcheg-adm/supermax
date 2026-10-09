import sys, time, json
sys.path.insert(0, '/home/claude/game')
from harness import setup, info, draw_trace, arcade_hits, preload_emoji
from playwright.sync_api import sync_playwright

W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
TAG = f'{W}x{H}'
OUT = '/home/claude/game/preview'
URL = 'file:///home/claude/game/dist/full.html'

with sync_playwright() as pw:
    browser, ctx, page, errs = setup(pw, W, H)
    page.goto(URL)
    page.wait_for_timeout(600)
    preload_emoji(page)
    page.wait_for_timeout(600)
    page.screenshot(path=f'{OUT}/{TAG}_home.png')
    page.click('#btn-play', force=True)
    shots = set()
    wrong_done = set()
    log = []
    t_start = time.time()
    for step in range(400):
        if time.time() - t_start > 240:
            log.append('TIMEOUT'); break
        inf = info(page)
        if inf['screen'] == 'scr-reward':
            break
        cls = inf['cls'] or ''
        i = inf['i']
        if 'intro' in cls:
            btn = page.locator('#stage .next')
            btn.wait_for(state='visible', timeout=20000)
            if 'intro' not in shots: page.screenshot(path=f'{OUT}/{TAG}_intro.png'); shots.add('intro')
            btn.click(force=True)
        elif any(k in cls for k in ('match', 'find', 'picq')):
            kind = 'match' if 'match' in cls else 'pic' if 'picq' in cls else 'find'
            page.wait_for_selector('#stage .opts .lb')
            page.wait_for_timeout(250)
            if kind not in shots: page.screenshot(path=f'{OUT}/{TAG}_{kind}.png'); shots.add(kind)
            if kind not in wrong_done:
                wrong = page.query_selector(f'#stage .opts .lb:not([data-c="{inf["c"]}"])')
                if wrong:
                    wrong.click(force=True); page.wait_for_timeout(700)
                    if kind + '_wrong' not in shots: page.screenshot(path=f'{OUT}/{TAG}_{kind}_wrong.png'); shots.add(kind + '_wrong')
                wrong_done.add(kind)
            page.click(f'#stage .opts .lb[data-c="{inf["c"]}"]', force=True)
            log.append(f'{i}:{inf["t"]}:{inf["c"]}')
        elif 'trace' in cls:
            page.wait_for_function("() => window.__game.TR && !window.__game.TR.demoS", timeout=30000)
            page.wait_for_timeout(200)
            if 'trace' not in shots: page.screenshot(path=f'{OUT}/{TAG}_trace.png'); shots.add('trace')
            draw_trace(page)
            page.wait_for_timeout(150)
            if 'trace_done' not in shots: page.screenshot(path=f'{OUT}/{TAG}_trace_done.png'); shots.add('trace_done')
            log.append(f'{i}:trace:{inf["c"]} finished={page.evaluate("() => window.__game.TR && window.__game.TR.finished")}')
        elif 'arcade' in cls:
            page.wait_for_timeout(1500)
            if 'arcade' not in shots: page.screenshot(path=f'{OUT}/{TAG}_arcade.png'); shots.add('arcade')
            h = arcade_hits(page, inf['c'], 6)
            log.append(f'{i}:arcade:{inf["c"]} hits={h}')
        else:
            page.wait_for_timeout(300); continue
        # wait for task index or screen to change
        try:
            page.wait_for_function(f"""() => {{ const R = window.__game.RUN; const scr = [...document.querySelectorAll('.screen')].find(s => !s.hidden);
                return (scr && scr.id === 'scr-reward') || !R || R.i !== {i if i is not None else -1}; }}""", timeout=25000)
        except Exception as e:
            log.append(f'stuck at {inf}'); page.screenshot(path=f'{OUT}/{TAG}_stuck.png'); break
    print('LOG0', log, info(page), errs, flush=True)
    page.wait_for_timeout(900)
    page.screenshot(path=f'{OUT}/{TAG}_reward.png')
    st = page.evaluate("() => { const S = window.__game.S(); return { gems: S.gems, placed: S.placed, missions: S.missions, L: Object.fromEntries(Object.entries(S.L).filter(([k,v]) => v.u).map(([k,v]) => [k, [v.sc, v.n, v.ok, v.intro]])) }; }")
    # build
    page.click('#rw-build', force=True)
    page.wait_for_timeout(900)
    page.screenshot(path=f'{OUT}/{TAG}_build.png')
    assert page.evaluate("() => !document.querySelector('#scr-build').hidden"), 'build screen not shown'
    said = page.evaluate('() => window.__said')
    print('LOG', log)
    print('STATE', json.dumps(st, ensure_ascii=False))
    print('SAID', len(said))
    for s in said: print('  >', s)
    print('ERRORS', errs)
    browser.close()
