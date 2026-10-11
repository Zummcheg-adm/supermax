"""Firm consonant+vowel letter names («лэ», «мэ», «ка»…).
Piper tends to end «Cэ» with a й-like glide («лэ» → «лэй/лай»). Here we keep the consonant onset, take the
steadiest stretch of the vowel *before* the glide and sustain it (rubberband), then pick the clearest of several
takes (vowel formants + speech recognition). Alphabet names like «эль», «эм» get best-of-N plain takes."""
import sys, os, subprocess, re, wave
import numpy as np
sys.path.insert(0, '/home/claude/tts')
from synth import synth
from formants import track
from asr import transcribe

TMP = f'/tmp/claude-0/cvtmp{os.getpid()}'
os.makedirs(TMP, exist_ok=True)
SOUND = ['бэ', 'вэ', 'гэ', 'дэ', 'жэ', 'зэ', 'кэ', 'лэ', 'мэ', 'нэ', 'пэ', 'рэ', 'сэ', 'тэ', 'фэ', 'хэ', 'цэ', 'че', 'шэ', 'щэ']
ALPHA_CV = ['ка', 'ха', 'ша', 'ща']
CV_NAMES = set(SOUND + ALPHA_CV)
VC_NAMES = {'эль', 'эм', 'эн', 'эр', 'эс', 'эф'}
KID = 'asetrate=22050*1.22,aresample=22050,atempo=0.8197'


def load(p):
    with wave.open(p) as w:
        sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    return sr, x


def save(p, sr, x):
    a = np.clip(x * 32767, -32767, 32767).astype(np.int16)
    with wave.open(p, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.tobytes())


def norm(t):
    return re.sub(r'[^а-я]', '', t.lower().replace('ё', 'е').replace('э', 'е'))


def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def asr_kid(path):
    k = path.replace('.wav', '_k16.wav')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', path, '-af', KID, '-ar', '16000', '-ac', '1', k], check=True)
    return transcribe(k)


VBOX = {'а': (600, 1150, 1100, 2000), 'я': (550, 1150, 1200, 2300), 'о': (330, 800, 600, 1300), 'у': (280, 560, 480, 1250),
        'ы': (280, 620, 1700, 2650), 'и': (220, 560, 2150, 3400), 'е': (300, 760, 1800, 2950), 'э': (380, 950, 1450, 2700)}   # F1 lo/hi, F2 lo/hi
VTARGET = {'а': (840, 1460), 'я': (820, 1600), 'о': (620, 960), 'у': (360, 740), 'ы': (380, 2080), 'и': (340, 2650)}   # о и у у этого голоса близки — тянем их в разные стороны


def vowel_score(vow, f1, f2, cons=''):
    """Lower is better: how far the nucleus is from a clean Russian vowel (irina's own clear vowels as targets)."""
    if vow == 'э':
        return max(0, 1800 - f2) / 300 + max(0, 480 - f1) / 200 + max(0, f1 - 820) / 200
    if vow == 'е':
        return max(0, 2000 - f2) / 300
    if vow in VTARGET:
        t1, t2 = VTARGET['ы' if (vow == 'и' and cons in 'жшц') else vow]
        return max(0, abs(f1 - t1) - 90) / 150 + max(0, abs(f2 - t2) - 180) / 250
    return 0


VOW_LIM = {'у': (180, 1000, 2600), 'и': (180, 1000, 3400), 'ы': (200, 1000, 2700), 'о': (280, 1100, 3000)}   # F1 min, F1 max, F2 max


def low_energy(x, sr, hop=0.01, win=0.025):
    """Energy in the 150–1200 Hz band per frame: high in vowels, low in с/ш/ц/ч noise and weak in ж/з/в voicing."""
    n, h = int(sr * win), int(sr * hop)
    f = np.fft.rfftfreq(n, 1 / sr); band = (f >= 150) & (f <= 1200)
    out = [float((np.abs(np.fft.rfft(x[i:i + n] * np.hamming(n))) ** 2)[band].sum()) for i in range(0, len(x) - n, h)]
    m = max(out) if out else 1
    return np.array(out) / (m or 1)


def firm_cv(name, raw, out, target=0.30, K=5, closed=False, lo=.62):
    """Cut the glide off one take and sustain the steady vowel. Returns (f1, f2, movement, (s0, n0, n1)) of the nucleus or None."""
    f1lo, f1hi, f2hi = VOW_LIM.get(name[-1], (300, 1100, 3000))
    sr, x = load(raw)
    tr = track(x, sr)
    E = low_energy(x, sr)[:len(tr)]
    tr = tr[:len(E)]
    if not len(E):
        return None
    hop_, win_ = int(sr * .01), int(sr * .025)
    R = np.array([float(np.sqrt(np.mean(x[i:i + win_] ** 2))) for i in range(0, len(x) - win_, hop_)])[:len(E)]
    vw = name[-1]
    bx = VBOX.get('ы' if (vw == 'и' and name[0] in 'жшц') else vw)
    inbox = np.array([bool(r[2] and r[3] and bx and bx[0] <= r[2] <= bx[1] and bx[2] <= r[3] <= bx[3]) for r in tr[:len(R)]]) if bx else np.ones(len(R), bool)
    ref = R[inbox].max() if inbox.any() else (R.max() if len(R) else 1)
    loud = R >= lo * ref                               # loud for this vowel (и is quieter than the м murmur before it)
    peak = int(E.argmax())
    a = peak
    while a > 0 and E[a - 1] > .35:
        a -= 1
    b = peak
    while b < len(E) - 1 and E[b + 1] > .35:
        b += 1
    if closed:   # «мут.», «моп.»: the vowel sits right before the closure, the murmur of м/н/л at the start
        a = a + int(.35 * (b - a))
    best = None
    for k in range(a, max(a + 1, b - K + 2)):
        win = tr[k:k + K]
        if len(win) < K or any(r[2] is None for r in win) or not loud[k:k + K].all():
            continue
        f1 = np.array([r[2] for r in win]); f2 = np.array([r[3] for r in win])
        if f1.max() > f1hi or f2.max() > f2hi or f1.min() < f1lo:
            continue
        bx = VBOX.get('ы' if (vw == 'и' and name[0] in 'жшц') else vw)
        if bx and (f1.min() < bx[0] or f1.max() > bx[1] or f2.min() < bx[2] or f2.max() > bx[3]):
            continue
        mv = np.abs(np.diff(f2)).sum() + np.abs(np.diff(f1)).sum()
        # the nucleus must sit before the glide: later windows pay a little, rising-F2 windows pay a lot
        rise = max(0, f2[-1] - f2[0])
        cost = mv + 2 * rise + (0 if closed else 20 * (k - a))
        if best is None or cost < best[0]:
            best = (cost, k, float(np.median(f1)), float(np.median(f2)), float(mv))
    if best is None:
        return None
    _, k, f1, f2, mv = best
    hop, win = int(sr * .01), int(sr * .025)
    th = .02 * np.abs(x).max()
    s0 = max(0, int(np.argmax(np.abs(x) > th)) - int(sr * .01))
    n0, n1 = k * hop, (k + K - 1) * hop + win
    onset, core = x[s0:n0 + int(sr * .008)], x[n0:n1]
    cp, sp = f'{TMP}/core.wav', f'{TMP}/str.wav'
    save(cp, sr, core)
    tempo = len(core) / sr / target
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', cp, '-af',
                    f'rubberband=tempo={tempo:.4f}:transients=smooth:formant=preserved:pitchq=quality', sp], check=True)
    _, body = load(sp)
    xf = int(sr * .008)
    fade = np.linspace(0, 1, xf)
    head = onset.copy()
    if len(head) >= xf and len(body) > xf:
        head[-xf:] = head[-xf:] * (1 - fade) + body[:xf] * fade
        sig = np.concatenate([head, body[xf:]])
    else:
        sig = np.concatenate([head, body])
    r = int(sr * .12)
    sig[-r:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, r))
    sig *= 0.89 / (np.abs(sig).max() or 1)
    save(out, sr, sig)
    return f1, f2, mv, (s0, n0, n1)


def cv_wav(name, out, n=4, log=False, drawn_out=None, _lo=.62):
    """Best firm take of a consonant-vowel letter name, written to `out` (22.05 kHz, before the child-voice step)."""
    vow = name[-1]
    texts = [name + '!', name + '.', name + 'т.'] if vow in 'эе' else [name + 'т.', name + 'п.', name + '!', name + '.']
    cands = []
    for ti, t in enumerate(texts):
        for s in range(n):
            raw = f'{TMP}/{ord(name[0])}_{ti}_{s}.wav'; built = raw.replace('.wav', '_f.wav')
            synth(t, raw, 'irina', speed=0.9, noise=0.5, noise_w=0.6)
            res = firm_cv(name, raw, built, closed=t.endswith(('т.', 'п.')), lo=_lo)
            if not res:
                continue
            f1, f2, mv, meta = res
            hyp = asr_kid(built)
            err = lev(norm(hyp), norm(name)) / max(1, len(norm(name)))
            score = 1.5 * err + 1.5 * vowel_score(vow, f1, f2, name[0]) + mv / 2000
            cands.append((score, built, hyp, f1, f2, t, raw, meta))
    if not cands and n < 12:      # nothing usable: more takes, softer loudness rule
        return cv_wav(name, out, n=n + 4, log=log, drawn_out=drawn_out, _lo=.45)
    cands.sort(key=lambda c: c[0])
    if log:
        for c in cands[:5]:
            print(f'   {c[0]:.2f} {c[5]!r} F1={c[3]:.0f} F2={c[4]:.0f} asr={c[2]!r}')
    best = cands[0]
    os.replace(best[1], out)
    if drawn_out:
        drawn_cv(name, best[6], best[7], drawn_out)
    return best


def vc_wav(name, out, n=8, log=False):
    """Alphabet names that start with a vowel («эль», «эм»): best plain take without a glide."""
    cands = []
    for s in range(n):
        raw = f'{TMP}/vc_{s}.wav'
        synth(name + '!', raw, 'irina', speed=0.85, noise=0.5, noise_w=0.6)
        sr, x = load(raw)
        tr0 = track(x, sr); E = low_energy(x, sr)[:len(tr0)]
        tr = [r for r, e in zip(tr0, E) if r[2] and e > .35 and r[2] < 1100 and r[3] < 3000]
        f2 = [r[3] for r in tr]
        rise = (max(f2) - f2[0]) if f2 else 0
        hyp = asr_kid(raw)
        err = lev(norm(hyp), norm(name)) / max(1, len(norm(name)))
        cands.append((2.0 * err + rise / 600, raw, hyp, rise))
        os.replace(raw, raw.replace('.wav', f'_{s}.wav'))
        cands[-1] = (cands[-1][0], raw.replace('.wav', f'_{s}.wav'), hyp, rise)
    cands.sort(key=lambda c: c[0])
    if log:
        for c in cands[:3]:
            print(f'   {c[0]:.2f} rise={c[3]:.0f} asr={c[2]!r}')
    sr, x = load(cands[0][1])
    th = .02 * np.abs(x).max()
    b = max(0, int(np.argmax(np.abs(x) > th)) - int(sr * .01)); e = len(x) - max(0, int(np.argmax(np.abs(x[::-1]) > th)) - int(sr * .03))
    sig = x[b:e]; sig *= 0.89 / (np.abs(sig).max() or 1)
    save(out, sr, sig)
    return cands[0]


STRETCHY = set('мнлзсшжвфхщ')   # these consonants can be drawn out: «ммм», «ссс»; р, п, т, к, б, д, г — only the vowel


def _stretch(seg, sr, target):
    a, b = f'{TMP}/st_a.wav', f'{TMP}/st_b.wav'
    save(a, sr, seg)
    tempo = max(0.05, len(seg) / sr / target)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', a, '-af',
                    f'rubberband=tempo={tempo:.4f}:transients=smooth:formant=preserved:pitchq=quality', b], check=True)
    return load(b)[1]


def _join(parts, sr, xf=0.008):
    n = int(sr * xf); out = parts[0].copy()
    for p in parts[1:]:
        if len(out) > n and len(p) > n:
            f = np.linspace(0, 1, n)
            out[-n:] = out[-n:] * (1 - f) + p[:n] * f
            out = np.concatenate([out, p[n:]])
        else:
            out = np.concatenate([out, p])
    return out


def drawn_cv(name, raw, meta, out, cons_len=0.42, vow_len=0.62):
    """A slow, drawn-out syllable for the blending demo: «ммм-аа», «ссс-уу», «т-аа»."""
    sr, x = load(raw)
    s0, n0, n1 = meta
    onset, core = x[s0:n0], x[n0:n1]
    body = _stretch(core, sr, vow_len)
    tr = int(sr * .035)
    if name[0] in STRETCHY and len(onset) > tr + int(sr * .03):
        cons, trans = onset[:-tr], onset[-tr:]
        a = min(len(cons) // 4, int(sr * .015))
        head = _join([cons[:a], _stretch(cons[a:], sr, cons_len), trans], sr) if a else _join([_stretch(cons, sr, cons_len), trans], sr)
    else:
        head = onset
    sig = _join([head, body], sr)
    r = int(sr * .14)
    sig[-r:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, r))
    sig *= 0.89 / (np.abs(sig).max() or 1)
    save(out, sr, sig)


if __name__ == '__main__':
    os.makedirs('/home/claude/tts/cv', exist_ok=True)
    for nm in (sys.argv[1:] or sorted(CV_NAMES | VC_NAMES)):
        out = f'/home/claude/tts/cv/c_{"_".join(str(ord(ch)) for ch in nm)}.wav'
        print(nm, flush=True)
        (cv_wav if nm in CV_NAMES else vc_wav)(nm, out, log=True)
