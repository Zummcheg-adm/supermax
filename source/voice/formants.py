"""Tiny LPC formant tracker (F1/F2 per 10 ms frame) — used to spot diphthong glides like «лэ» → «лэй»."""
import wave, numpy as np
from scipy.signal import lfilter
from scipy.linalg import solve_toeplitz


def load(p):
    with wave.open(p) as w:
        sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    return sr, x


def lpc(frame, order):
    r = np.correlate(frame, frame, 'full')[len(frame) - 1:len(frame) + order]
    if r[0] <= 0:
        return None
    a = solve_toeplitz(r[:order], -r[1:order + 1])
    return np.concatenate([[1], a])


def track(x, sr, hop=0.01, win=0.025):
    y = lfilter([1, -0.97], [1], x)
    n, h = int(sr * win), int(sr * hop)
    order = 2 + sr // 1000
    out = []
    emax = max(1e-9, max(np.sqrt(np.mean(y[i:i + n] ** 2)) for i in range(0, len(y) - n, h)))
    for i in range(0, len(y) - n, h):
        fr = y[i:i + n] * np.hamming(n)
        e = np.sqrt(np.mean(fr ** 2)) / emax
        a = lpc(fr, order)
        f1 = f2 = None
        if a is not None and e > .12:
            roots = [r for r in np.roots(a) if np.imag(r) > 0]
            cand = []
            for r in roots:
                f = np.angle(r) * sr / (2 * np.pi); bw = -np.log(abs(r)) * sr / np.pi
                if 150 < f < 4500 and bw < 500:
                    cand.append(f)
            cand.sort()
            if len(cand) >= 2:
                f1, f2 = cand[0], cand[1]
        out.append((i / sr, e, f1, f2))
    return out


if __name__ == '__main__':
    import sys
    for p in sys.argv[1:]:
        sr, x = load(p)
        print(p.split('/')[-1])
        for t, e, f1, f2 in track(x, sr):
            if f1:
                print(f'  {t:5.2f} e={e:4.2f} F1={f1:5.0f} F2={f2:5.0f}')
