import sys, time, json, random
sys.path.insert(0, '/home/claude/game')
from harness import setup, info, draw_trace, arcade_hits, preload_emoji
from playwright.sync_api import sync_playwright
N = int(sys.argv[1]) if len(sys.argv) > 1 else 5
ERR_RATE = float(sys.argv[2]) if len(sys.argv) > 2 else 0.15
OUT = '/home/claude/game/preview'
with sync_playwright() as pw:
    browser, ctx, page, errs = setup(pw, 1180, 820)
    page.goto('file:///home/claude/game/dist/full.html'); page.wait_for_timeout(500)
    page.click('#btn-play', force=True)
    kinds = {}
    for m in range(N):
        t0 = time.time()
        while time.time() - t0 < 240:
            inf = info(page)
            if inf['screen'] == 'scr-reward': break
            cls = inf['cls'] or ''; i = inf['i']
            if 'intro' in cls:
                page.locator('#stage .next').wait_for(state='visible', timeout=20000); page.locator('#stage .next').click(force=True)
            elif any(k in cls for k in ('match', 'find', 'picq')):
                page.wait_for_selector('#stage .opts .lb')
                kinds[inf['t']] = kinds.get(inf['t'], 0) + 1
                if random.random() < ERR_RATE:
                    w = page.query_selector(f'#stage .opts .lb:not([data-c="{inf["c"]}"])')
                    if w: w.click(force=True); page.wait_for_timeout(300)
                for _ in range(6):   # «Найди все…» has several targets
                    el = page.query_selector(f'#stage .opts .lb[data-c="{inf["c"]}"]:not([data-hit])')
                    if not el: break
                    el.click(force=True); page.wait_for_timeout(150)
            elif 'trace' in cls:
                page.wait_for_function("() => window.__game.TR && !window.__game.TR.demoS", timeout=30000)
                kinds['trace'] = kinds.get('trace', 0) + 1
                draw_trace(page)
            elif 'arcade' in cls:
                page.wait_for_timeout(600); kinds['arcade'] = kinds.get('arcade', 0) + 1
                arcade_hits(page, inf['c'], 6)
            else:
                page.wait_for_timeout(200); continue
            try:
                page.wait_for_function(f"""() => {{ const R = window.__game.RUN; const scr = [...document.querySelectorAll('.screen')].find(s => !s.hidden);
                    return (scr && scr.id === 'scr-reward') || !R || R.i !== {i}; }}""", timeout=25000)
            except Exception:
                print('STUCK', inf); page.screenshot(path=f'{OUT}/multi_stuck.png'); break
        page.wait_for_timeout(300)
        st = page.evaluate("() => { const S = window.__game.S(); return { gems: S.gems, missions: S.missions, L: Object.fromEntries(Object.entries(S.L).filter(([k,v]) => v.u).map(([k,v]) => [k, v.sc])) }; }")
        print(f'mission {m+1}: {time.time()-t0:.0f}s', json.dumps(st, ensure_ascii=False), flush=True)
        page.wait_for_timeout(300)
        page.click('#rw-again', force=True)
    said = page.evaluate('() => window.__said')
    print('KINDS', kinds)
    miss = page.evaluate('() => [...new Set(window.__missing)]')
    print('MISSING CLIPS', miss)
    print('new-letter announcements:', sum(1 for s in said if 'новая буква' in s.lower()))
    print('sample said:', [s for s in said if 'начинается' in s][:4])
    print('ERRORS', errs)
    browser.close()
