"""Clean, firm vowel letter names: take the steadiest part of the synthesized vowel and sustain it."""
import sys, os, wave, array, math, subprocess, cmath
sys.path.insert(0, '/home/claude/tts')
from synth import synth

TMP = '/home/claude/tts/vow'
os.makedirs(TMP, exist_ok=True)
PURE = set('аоуыэи')
IOT = set('еёюя')


def load(p):
    with wave.open(p) as w:
        sr = w.getframerate(); a = array.array('h'); a.frombytes(w.readframes(w.getnframes()))
    return sr, [x / 32768 for x in a]


def save(p, sr, s):
    a = array.array('h', (max(-32767, min(32767, int(x * 32767))) for x in s))
    with wave.open(p, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.tobytes())


def spectrum(fr):
    # coarse magnitude spectrum via DFT on 32 bands (cheap, enough for stability)
    n = len(fr); bands = 32; out = []
    for k in range(1, bands + 1):
        f = k * 3.0  # bin index scale
        acc = sum(fr[i] * cmath.exp(-2j * math.pi * f * i / n) for i in range(0, n, 2))
        out.append(math.log(abs(acc) + 1e-6))
    return out


def steady_region(sr, s, frames=7):
    hop, win = int(sr * 0.01), int(sr * 0.03)
    F = []
    for i in range(0, len(s) - win, hop):
        fr = s[i:i + win]
        F.append((i, math.sqrt(sum(x * x for x in fr) / win), fr))
    emax = max(e for _, e, _ in F)
    voiced = [k for k, (_, e, _) in enumerate(F) if e > 0.45 * emax]
    if not voiced:
        return None
    specs = {k: spectrum(F[k][2]) for k in voiced}
    best, bk = 1e9, voiced[0]
    for k in voiced:
        ks = list(range(k, k + frames))
        if not all(x in specs for x in ks):
            continue
        d = sum(sum((a - b) ** 2 for a, b in zip(specs[ks[j]], specs[ks[j + 1]])) for j in range(frames - 1))
        if d < best:
            best, bk = d, k
    start = F[bk][0]; end = F[bk + frames - 1][0] + win
    first_voiced = F[voiced[0]][0]
    return start, end, first_voiced


def env(n, sr, attack=0.012, release=0.12):
    a, r = int(sr * attack), int(sr * release)
    out = []
    for i in range(n):
        g = 1.0
        if i < a: g = 0.5 - 0.5 * math.cos(math.pi * i / a)
        if i > n - r: g = min(g, 0.5 + 0.5 * math.cos(math.pi * (i - (n - r)) / r))
        out.append(g)
    return out


def vowel_wav(v, out, target=0.42):
    """v: one of аоуыэиеёюя (lowercase). Writes a 22.05 kHz wav (before the child-voice pitch step)."""
    raw = f'{TMP}/raw_{ord(v)}.wav'
    if v in IOT:
        # natural glide + vowel: calmer synthesis, no stretching
        synth(v + '.', raw, 'irina', speed=0.85, noise=0.4, noise_w=0.5)
        sr, s = load(raw)
        th = 0.02 * max(abs(x) for x in s)
        b = next(i for i, x in enumerate(s) if abs(x) > th); e = len(s) - next(i for i, x in enumerate(reversed(s)) if abs(x) > th)
        sig = s[b:e]; g = env(len(sig), sr, attack=0.01, release=0.1)
        sig = [x * gg for x, gg in zip(sig, g)]; pk = max(abs(x) for x in sig) or 1
        save(out, sr, [x * 0.89 / pk for x in sig])
        return len(sig) / sr
    synth(v + '.', raw, 'irina', speed=0.75, noise=0.3, noise_w=0.5)
    sr, s = load(raw)
    st, en, fv = steady_region(sr, s)
    core = s[st:en]
    core_p = f'{TMP}/core_{ord(v)}.wav'; save(core_p, sr, core)
    tempo = len(core) / sr / target
    str_p = f'{TMP}/str_{ord(v)}.wav'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', core_p, '-af', f'rubberband=tempo={tempo:.4f}:transients=smooth:formant=preserved:pitchq=quality', str_p], check=True)
    _, body = load(str_p)
    if v in IOT:
        onset = s[fv:st]  # keep the й-glide
        g = env(len(onset), sr, attack=0.012, release=0.0001)
        onset = [x * gg for x, gg in zip(onset, g)]
        body_env = env(len(body), sr, attack=0.008, release=0.12)
        body = [x * gg for x, gg in zip(body, body_env)]
        sig = onset + body
    else:
        e = env(len(body), sr)
        sig = [x * g for x, g in zip(body, e)]
    pk = max(abs(x) for x in sig) or 1
    sig = [x * 0.89 / pk for x in sig]
    save(out, sr, sig)
    return len(sig) / sr


if __name__ == '__main__':
    for v in sys.argv[1] if len(sys.argv) > 1 else 'аоуыэиеёюя':
        print(v, f'{vowel_wav(v, f"{TMP}/v_{ord(v)}.wav"):.2f}s')
