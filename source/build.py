import sys, os, json, re, base64, hashlib, shutil, subprocess
sys.path.insert(0, '/home/claude/game')
from sprites import to_json

ROOT = '/home/claude/game'
FS = f'{ROOT}/fontpkgs/node_modules/@fontsource'
SITE_URL = 'zummcheg-adm.github.io/supermax'
TITLE = 'Супер-Макс и буквы'


def font_css():
    want = [('Dela Gothic One', 'dela-gothic-one', 400, ['cyrillic', 'latin']),
            ('Rubik', 'rubik', 500, ['cyrillic', 'latin']), ('Rubik', 'rubik', 600, ['cyrillic', 'latin']),
            ('Rubik', 'rubik', 700, ['cyrillic', 'latin']), ('Rubik', 'rubik', 800, ['cyrillic', 'latin']),
            ('Press Start 2P', 'press-start-2p', 400, ['latin'])]
    out = []
    for fam, pkg, w, subs in want:
        css = open(f'{FS}/{pkg}/{"index" if w == 400 else w}.css', encoding='utf-8').read()
        for sub in subs:
            fn = f'{pkg}-{sub}-{w}-normal.woff2'
            m = re.search(r'@font-face\s*{[^}]*' + re.escape(fn) + r'[^}]*}', css)
            ur = re.search(r'unicode-range:\s*([^;]+);', m.group(0)).group(1).strip()
            b64 = base64.b64encode(open(f'{FS}/{pkg}/files/{fn}', 'rb').read()).decode()
            out.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{w};font-display:swap;"
                       f"src:url(data:font/woff2;base64,{b64}) format('woff2');unicode-range:{ur}}}")
    return '\n'.join(out)


css = open(f'{ROOT}/src/style.css', encoding='utf-8').read()
body = open(f'{ROOT}/src/body.html', encoding='utf-8').read()
js = open(f'{ROOT}/src/app.js', encoding='utf-8').read()
assert '/*SPRITES*/{}' in js and '/*CLIPS*/{}' in js and '/*PWA*/false' in js
js = js.replace('/*SPRITES*/{}', to_json())
clips_path = '/home/claude/tts/clips.json'
clips = open(clips_path, encoding='utf-8').read() if os.path.exists(clips_path) and '--noclips' not in sys.argv else '{}'
assert '</' not in clips
js = js.replace('/*CLIPS*/{}', clips)
fonts = font_css()

NOSCRIPT = (f'<noscript><div style="position:fixed;inset:0;z-index:99;background:rgba(27,21,48,.86);display:flex;align-items:center;justify-content:center;padding:24px;font:600 20px/1.45 system-ui,sans-serif;color:#1b1530">'
            f'<div style="background:#fff4d6;border:4px solid #1b1530;border-radius:10px;padding:22px 26px;max-width:560px">'
            f'<b style="font-size:24px">Это просмотр файла — здесь игра не запускается.</b><br><br>'
            f'На iPad откройте в Safari адрес<br><b style="font-size:24px">{SITE_URL}</b><br>'
            f'и нажмите «Поделиться» → «На экран „Домой“». Потом игра работает без интернета.</div></div></noscript>')

frag_js = js  # PWA stays false in the artifact
frag = f'<title>{TITLE}</title>\n<style>\n{fonts}\n{css}\n</style>\n{body}\n<script>\n{frag_js}\n</script>\n'
site_js = js.replace('/*PWA*/false', 'true')
head = ('<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-title" content="Супер-Макс">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
        '<meta name="theme-color" content="#62c6f2">\n<link rel="manifest" href="manifest.webmanifest">\n'
        '<link rel="apple-touch-icon" href="icon-180.png">\n<link rel="icon" type="image/png" href="icon-192.png">\n'
        f'<title>{TITLE}</title>\n')
full = head + f'<style>\n{fonts}\n{css}\n</style>\n</head>\n<body>\n{NOSCRIPT}\n{body}\n<script>\n{site_js}\n</script>\n</body>\n</html>\n'

os.makedirs(f'{ROOT}/dist/site', exist_ok=True)
open(f'{ROOT}/dist/supermax.html', 'w', encoding='utf-8').write(frag)
open(f'{ROOT}/dist/full.html', 'w', encoding='utf-8').write(full)
open(f'{ROOT}/dist/site/index.html', 'w', encoding='utf-8').write(full)
ver = hashlib.sha1(full.encode('utf-8')).hexdigest()[:10]
manifest = {
    'name': TITLE, 'short_name': 'Супер-Макс', 'lang': 'ru', 'start_url': './', 'scope': './',
    'display': 'standalone', 'orientation': 'any', 'background_color': '#62c6f2', 'theme_color': '#62c6f2',
    'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
              {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
              {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}
open(f'{ROOT}/dist/site/manifest.webmanifest', 'w', encoding='utf-8').write(json.dumps(manifest, ensure_ascii=False, indent=1))
sw = f"""// Супер-Макс: офлайн-кэш. Версия меняется при каждой сборке.
const V = 'supermax-{ver}';
const CORE = ['./', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {{ self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(CORE))); }});
self.addEventListener('activate', e => {{ e.waitUntil((async () => {{ for (const k of await caches.keys()) if (k !== V) await caches.delete(k); await self.clients.claim(); }})()); }});
self.addEventListener('fetch', e => {{
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {{
    const cache = await caches.open(V);
    const nav = req.mode === 'navigate' || /\\/(index\\.html)?$/.test(url.pathname);
    const hit = nav ? await cache.match('./') : await cache.match(req, {{ ignoreSearch: true }});
    if (hit) return hit;
    try {{ const res = await fetch(req); if (res.ok) cache.put(req, res.clone()); return res; }}
    catch (err) {{ const fb = await cache.match('./'); return fb || Response.error(); }}
  }})());
}});
"""
open(f'{ROOT}/dist/site/sw.js', 'w', encoding='utf-8').write(sw)
subprocess.run([sys.executable, f'{ROOT}/make_icons.py', f'{ROOT}/dist/site'], check=True, stdout=subprocess.DEVNULL)
for f in ('icon-180.png', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest', 'sw.js'):
    shutil.copy(f'{ROOT}/dist/site/{f}', f'{ROOT}/dist/{f}')
print('frag', len(frag.encode()) // 1024, 'KB; full', len(full.encode()) // 1024, 'KB; clips', 'yes' if clips != '{}' else 'NO', '; ver', ver)
