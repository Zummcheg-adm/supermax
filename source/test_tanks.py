"""«Танчики», собаки и малыш Даниил: экран, управление, попадания, бонусы, победа/поражение, помощник в заданиях, стройка."""
import sys, time
sys.path.insert(0, '/home/claude/game')
from harness import setup, preload_emoji
from playwright.sync_api import sync_playwright

W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
TAG = f'{W}x{H}'; OUT = '/home/claude/game/preview'
L = {c: {"u": 1, "sc": sc, "n": 6, "ok": 4, "st": 1, "t": 0, "intro": 1} for c, sc in [('А', 95), ('М', 70), ('О', 60), ('У', 40), ('С', 30), ('Л', 50)]}
seed = {"v": 1, "name": "Максим", "hero": "Супер-Макс", "boy": True, "mode": "sound", "lower": False, "rate": 0.9, "sfx": True,
        "len": 8, "gems": 40, "missions": 5, "L": L}
fails = []


def check(cond, msg):
    print(('OK   ' if cond else 'FAIL ') + msg)
    if not cond:
        fails.append(msg)


with sync_playwright() as pw:
    browser, ctx, page, errs = setup(pw, W, H, storage=seed)
    page.goto('file:///home/claude/game/dist/full.html'); page.wait_for_timeout(600)
    preload_emoji(page)
    said = lambda: page.evaluate("() => window.__said.slice()")
    page.screenshot(path=f'{OUT}/{TAG}_t_home.png')
    page.click('.pet.p-vinni', force=True); page.wait_for_timeout(300)
    check('Это Винни! Гав-гав!' in said(), 'tap Винни → he barks and says his name')
    page.click('.pet.p-baby', force=True); page.wait_for_timeout(300)
    check('Это малыш Даниил! Он болеет за тебя!' in said(), 'tap baby → Даниил')

    # tanks
    page.click('[data-go="tanks"]', force=True); page.wait_for_timeout(1200)
    st = page.evaluate("() => ({ on: TK.on, target: TK.target, side: TK.side, s: TK.s, L: TK.L, need: TK.cfg.need, lives: TK.lives })")
    print('tanks', st)
    check(st['on'] and st['target'] in 'АМОУСЛ' and st['s'] >= 12, 'tank game running with a learned letter')
    check(any(x.startswith('Подбей танки с буквой') for x in said()), 'voice: target letter')
    page.wait_for_timeout(1500)
    page.screenshot(path=f'{OUT}/{TAG}_t_tanks.png')
    # pad: hold «up» for 0.6 s
    y0 = page.evaluate("() => TK.p.y")
    box = page.locator('#tk-pad').bounding_box()
    cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    page.mouse.move(cx, cy - box['height'] * .35); page.mouse.down(); page.wait_for_timeout(600); page.mouse.up()
    y1 = page.evaluate("() => TK.p.y")
    check(y1 < y0 - 1, f'pad up moves the tank ({y0:.1f} → {y1:.1f})')
    # keyboard left
    x0 = page.evaluate("() => TK.p.x")
    page.keyboard.down('ArrowLeft'); page.wait_for_timeout(400); page.keyboard.up('ArrowLeft')
    check(page.evaluate("() => TK.p.x") < x0 - .5, 'keyboard moves the tank')
    # put a target tank right above the player and fire
    page.evaluate("""() => { TK.tanks.forEach(t => t.alive = false); TK.bullets = []; TK.spawnT = 99;
      const p = TK.p; p.x = 2; p.y = 14; p.dir = 0; TK.g.fill(0, 0, 26 * 14);
      for (let y = 0; y < 14; y++) for (let x = 0; x < 6; x++) TK.g[y * 26 + x] = 0; TK.dirty = true;
      const e = tkTank(2, 6, TK.target); e.speed = 0; e.fireT = 99; TK.tanks.push(e); }""")
    got0 = page.evaluate("() => TK.got")
    fire = page.locator('#tk-fire').bounding_box()
    page.mouse.move(fire['x'] + fire['width'] / 2, fire['y'] + fire['height'] / 2); page.mouse.down(); page.wait_for_timeout(250); page.mouse.up()
    page.wait_for_timeout(900)
    check(page.evaluate("() => TK.got") == got0 + 1, 'fire button: target tank destroyed')
    # decoy: bounce, voice names its letter
    decoy = page.evaluate("() => TK.decoys[0]")
    page.evaluate("""(d) => { TK.bullets = []; const p = TK.p; p.x = 2; p.y = 14; p.dir = 0; p.fireT = 0;
      const e = tkTank(2, 6, d); e.speed = 0; e.fireT = 99; TK.tanks.push(e); window.__said.length = 0; }""", decoy)
    page.keyboard.down('Space'); page.wait_for_timeout(120); page.keyboard.up('Space'); page.wait_for_timeout(900)
    alive = page.evaluate("(d) => TK.tanks.some(t => t.alive && t.ch === d)", decoy)
    check(alive, 'decoy tank survives the hit')
    check(any(x.startswith('Это буква') for x in said()), 'decoy hit: voice names the letter')
    # power-ups
    page.evaluate("() => { TK.pu = { x: TK.p.x, y: TK.p.y, kind: 'vinni', t: 10 }; }"); page.wait_for_timeout(200)
    check(page.evaluate("() => TK.freeze > 0") and 'Винни гавкнул, и танки замерли!' in said(), 'Винни power-up freezes tanks')
    page.evaluate("() => { TK.pu = { x: TK.p.x, y: TK.p.y, kind: 'gerda', t: 10 }; }"); page.wait_for_timeout(200)
    check(page.evaluate("() => TK.guard > 0 && TK.g[22 * 26 + 10] === 2"), 'Герда power-up turns the chest walls to steel')
    lives = page.evaluate("() => TK.lives")
    page.evaluate("() => { TK.pu = { x: TK.p.x, y: TK.p.y, kind: 'elli', t: 10 }; }"); page.wait_for_timeout(200)
    check(page.evaluate("() => TK.lives") == lives + 1, 'Элли power-up gives a life')
    page.evaluate("() => { TK.pu = { x: TK.p.x, y: TK.p.y, kind: 'baby', t: 10 }; }"); page.wait_for_timeout(200)
    check(page.evaluate("() => TK.p.shield > 5") and 'Малыш Даниил дал тебе щит!' in said(), 'Даниил power-up: shield')
    page.wait_for_timeout(400)
    page.screenshot(path=f'{OUT}/{TAG}_t_power.png')
    # win
    tank0 = page.evaluate("() => window.__game.S().tank")
    page.evaluate("""() => { TK.got = TK.cfg.need - 1; TK.freeze = 0; TK.bullets = []; TK.tanks.forEach(t => t.alive = false); const p = TK.p; p.x = 2; p.y = 14; p.dir = 0; p.fireT = 0;
      const e = tkTank(2, 6, TK.target); e.speed = 0; e.fireT = 99; TK.tanks.push(e); }""")
    page.keyboard.down('Space'); page.wait_for_timeout(120); page.keyboard.up('Space'); page.wait_for_timeout(2200)
    check(page.is_visible('#tk-over') and 'ПОБЕДА' in page.inner_text('#tk-over'), 'win overlay')
    check(page.evaluate("() => window.__game.S().tank") == tank0 + 1, 'tank level up after win')
    page.screenshot(path=f'{OUT}/{TAG}_t_win.png')
    page.click('[data-tk="next"]', force=True); page.wait_for_timeout(800)
    check(page.evaluate("() => TK.state") == 'play' and page.evaluate("() => TK.L") == tank0 + 1, 'next level starts')
    page.screenshot(path=f'{OUT}/{TAG}_t_level2.png')
    # chest lost: enemy shell straight into the chest
    page.evaluate("""() => { TK_WALLS.forEach(i => TK.g[i] = 0); TK.dirty = true; const e = tkTank(12, 16, 'Ж'); e.alive = true; TK.tanks.push(e);
      TK.bullets.push({ x: 13, y: 21, dir: 2, sp: 10, own: e }); e.nb = 1; }""")
    page.wait_for_timeout(1800)
    check(page.is_visible('#tk-over') and 'ЕЩЁ' in page.inner_text('#tk-over') and 'Сундук разбит! Давай ещё раз!' in said(), 'chest destroyed → try again')
    page.screenshot(path=f'{OUT}/{TAG}_t_lose.png')
    page.click('[data-tk="again"]', force=True); page.wait_for_timeout(600)
    # natural play for a few seconds: enemies spawn, move and shoot — no errors
    page.wait_for_timeout(5000)
    n = page.evaluate("() => TK.tanks.filter(t => t.alive).length")
    check(n >= 1, f'enemies on the field ({n})')
    page.screenshot(path=f'{OUT}/{TAG}_t_play.png')
    page.click('#scr-tanks [data-home]', force=True); page.wait_for_timeout(400)
    check(page.evaluate("() => !TK.on"), 'leaving stops the game')

    # dog helper in a find task
    page.evaluate("""() => { const run = newRun('mission'); run.tasks = [{t:'find', c:'М'}]; run.i = 0; show('game'); renderHP(run);
      Math.__r = Math.random; Math.random = () => .9; TASKS.find({t:'find', c:'М'}, run).catch(() => {}); Math.random = Math.__r; }""")
    page.wait_for_timeout(500)
    wrong = page.evaluate("() => [...document.querySelectorAll('#stage .opts .lb')].map(b => b.dataset.c).filter(c => c !== 'М').slice(0, 2)")
    for wch in wrong:
        page.click(f'#stage .opts .lb[data-c="{wch}"]', force=True); page.wait_for_timeout(450)
    page.wait_for_timeout(800)
    check(page.query_selector('.helper-dog') is not None, 'a dog runs to the right block after two mistakes')
    check(any(x in said() for x in ['Винни нашёл букву!', 'Элли нашла букву!', 'Герда нашла букву!']), 'dog helper voice')
    page.screenshot(path=f'{OUT}/{TAG}_t_helper.png')
    page.click('#stage .opts .lb[data-c="М"]', force=True); page.wait_for_timeout(600)

    # build: dogs walk, Герда comes to her finished kennel
    page.evaluate("() => { goHome(); const S = window.__game.S(); S.gems = 200; S.bp = 4; openBuild(); }")
    page.wait_for_timeout(900)
    check(page.evaluate("() => document.querySelectorAll('#bdogs .bdog.trot').length") == 2, 'Винни and Элли walk on the build site')
    page.evaluate("""() => { const b = window.__game.BP[4]; const S = window.__game.S(); let w = S.world.split('');
      b.cells.forEach(c => { w[(b.oy + c.y) * 16 + b.ox + c.x] = TCH[c.t]; }); S.world = w.join(''); bCheck(true); }""")
    page.wait_for_timeout(2500)
    check(page.is_visible('#bdogs .bdog.gerda'), 'Герда sits by her kennel')
    check('Ура! Будка для Герды построена!' in said(), 'kennel blueprint finished')
    page.screenshot(path=f'{OUT}/{TAG}_t_build.png')
    page.evaluate("() => goHome()"); page.wait_for_timeout(400)
    # reward screen with dogs
    page.evaluate("""() => { const run = newRun('mission'); run.tasks = [{t:'find',c:'А'},{t:'find',c:'М'}]; run.earned = 9; finishMission(run).catch(()=>{}); }""")
    page.wait_for_timeout(1200)
    page.screenshot(path=f'{OUT}/{TAG}_t_reward.png')
    print('missing', len(set(page.evaluate('() => window.__missing'))))
    print('errors', errs)
    check(not errs, 'no console errors')
    browser.close()
print('FAILS', fails)
