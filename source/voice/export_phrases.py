"""Export every phrase the game can say (window.__game.allPhrases) and the say-as map to phrases.json / sayas.json."""
import sys, json
sys.path.insert(0, '/home/claude/game')
from harness import setup
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b, ctx, page, errs = setup(pw, 1180, 820)
    page.goto('file:///home/claude/game/dist/full.html'); page.wait_for_timeout(500)
    ph = page.evaluate('() => window.__game.allPhrases()')
    sa = page.evaluate('() => window.__game.sayAs()')
    b.close()
json.dump(ph, open('/home/claude/tts/phrases.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
json.dump(sa, open('/home/claude/tts/sayas.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
old = set(json.load(open('/home/claude/tts/clips.json', encoding='utf-8')))
new = [p for p in ph if p not in old]
json.dump(new, open('/tmp/claude-0/work/new_phrases.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('phrases', len(ph), 'new', len(new), 'errors', errs)
