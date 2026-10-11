"""Second pass: re-take the unclear syllables with more takes, finish the missing ones, then best-of for the other phrases."""
import sys, os, json, re, time
sys.path.insert(0, '/home/claude/tts')
from cv import cv_wav
new = json.load(open(sys.argv[1], encoding='utf-8'))
REDO = None   # all
CV = re.compile(r'^[бвгджзклмнпрстфхцчшщ][аоуыиэея]$'); DR = re.compile(r'^([бвгджзклмнпрстфхцчшщ])\1\1-([аоуыиэея])\2$')
core = lambda p: p.strip('!.?, ').lower()
syl, drawn, rest = set(), set(), []
for p in new:
    c = core(p); m = DR.match(c)
    if m: drawn.add(m.group(1) + m.group(2))
    elif CV.match(c): syl.add(c)
    elif len(c) == 1: pass
    else: rest.append(p)
ords = lambda t: '_'.join(str(ord(ch)) for ch in t)
t0 = time.time()
todo = sorted(syl | drawn)
for i, c in enumerate(todo):
    tp, dp = f'/home/claude/tts/cv/c_{ords(c)}.wav', f'/home/claude/tts/cv/d_{ords(c)}.wav'
    if REDO is not None and c not in REDO and os.path.exists(tp) and (c not in drawn or os.path.exists(dp)):
        continue
    b = cv_wav(c, tp, n=5, drawn_out=dp if c in drawn else None)
    print(f'[syl {i+1}/{len(todo)}] {c} score={b[0]:.2f} F1={b[3]:.0f} F2={b[4]:.0f} {b[5]!r} asr={b[2]!r} {time.time()-t0:.0f}s', flush=True)
from best_of import best
for i, t in enumerate(rest):
    short = len(t.split()) <= 2
    err, hyp, all_ = best(t, n=8 if short else 5, speed=0.95 if short else 1.05)
    print(f'[best {i+1}/{len(rest)}] {err:.2f} {all_} {t} -> {hyp} {time.time()-t0:.0f}s', flush=True)
print('DONE', f'{time.time()-t0:.0f}s', flush=True)
