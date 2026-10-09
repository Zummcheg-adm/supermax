"""App icons for the home-screen web app: hero + letter block on a pixel island in the sky."""
import random, sys
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, '/home/claude/game')
from sprites import SPR, PAL

S = 512
R = random.Random(7)


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def sprite(name, scale):
    rows = SPR[name]; w, h = len(rows[0]), len(rows)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); px = im.load()
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != '.':
                px[x, y] = hexrgb(PAL[ch]) + (255,)
    return im.resize((w * scale, h * scale), Image.NEAREST)


def tex(kind, size):
    """16x16 pixel texture scaled up."""
    t = Image.new('RGB', (16, 16)); p = t.load()
    for y in range(16):
        for x in range(16):
            if kind == 'gold':
                c = R.choice(['#f5c518', '#f5c518', '#ffe066', '#e3b012'])
            elif kind == 'grass':
                c = R.choice(['#5cb84a', '#4fa63e', '#6fcf5a']) if y < 4 + (x * 7 % 3 == 0) else R.choice(['#8a5a34', '#6d4426', '#a36d3f'])
            else:
                c = R.choice(['#8a5a34', '#6d4426', '#a36d3f', '#7b4f2c'])
            p[x, y] = hexrgb(c)
    if kind == 'gold':
        for i in range(16):
            p[i, 0] = p[0, i] = hexrgb('#fff2a8'); p[i, 15] = p[15, i] = hexrgb('#c8961a')
    return t.resize((size, size), Image.NEAREST)


img = Image.new('RGB', (S, S), hexrgb('#62c6f2'))
d = ImageDraw.Draw(img)
# halftone dots
for y in range(0, S, 22):
    for x in range(0, S, 22):
        d.ellipse([x + 8, y + 8, x + 13, y + 13], fill=hexrgb('#85d5f6'))
# ground: one row of grass blocks + dirt below
bs = 64
gy = S - 96
for x in range(0, S, bs):
    img.paste(tex('grass', bs), (x, gy))
    img.paste(tex('dirt', bs), (x, gy + bs))
d.line([(0, gy), (S, gy)], fill=hexrgb('#1b1530'), width=5)
# hero
hero = sprite('hero', 13)  # 208 x 312
img.paste(hero, (44, gy - hero.height + 6), hero)
# letter block
B = 176; bx, by = S - B - 40, gy - B - 2
img.paste(tex('gold', B), (bx, by))
d.rectangle([bx, by, bx + B, by + B], outline=hexrgb('#1b1530'), width=7)
m = 30
d.rectangle([bx + m, by + m, bx + B - m, by + B - m], fill=hexrgb('#fff4d6'), outline=hexrgb('#1b1530'), width=5)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 98)
txt = 'А'
tb = d.textbbox((0, 0), txt, font=font)
tw, th = tb[2] - tb[0], tb[3] - tb[1]
d.text((bx + (B - tw) / 2 - tb[0], by + (B - th) / 2 - tb[1]), txt, font=font, fill=hexrgb('#e0303a'))

out = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/game/dist/site'
img.save(f'{out}/icon-512.png', optimize=True)
img.resize((192, 192), Image.LANCZOS).save(f'{out}/icon-192.png', optimize=True)
img.resize((180, 180), Image.LANCZOS).save(f'{out}/icon-180.png', optimize=True)
print('icons ok')
