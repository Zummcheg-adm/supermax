"""Pick the clearest of N stochastic syntheses per phrase (judged by ASR on the child-voice version).
Writes the winner to wav/<key>.wav (the cache build_clips.py reuses) and drops its mp3 so it is re-encoded."""
import sys, os, json, hashlib, subprocess, re
sys.path.insert(0, '/home/claude/tts')
from synth import synth
from asr import transcribe

AF = ('asetrate=22050*1.22,aresample=22050,atempo=0.8197,silenceremove=start_periods=1:start_threshold=-50dB,'
      'areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse')
TMP = '/tmp/claude-0/bestof'
os.makedirs(TMP, exist_ok=True)


def norm(t):
    return re.sub(r'[^а-я]', '', t.lower().replace('ё', 'е'))


def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def best(text, n=6, speed=1.0, noise=0.6):
    key = hashlib.md5(text.encode('utf-8')).hexdigest()[:16]
    clean = text.replace('«', '').replace('»', '')
    target = norm(clean)
    scored = []
    for k in range(n):
        raw = f'{TMP}/{key}_{k}.wav'; kid = f'{TMP}/{key}_{k}_k.wav'
        synth(clean, raw, 'irina', speed=speed, noise=noise)
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-af', AF, '-ar', '16000', '-ac', '1', kid], check=True)
        hyp = transcribe(kid)
        scored.append((lev(norm(hyp), target) / max(1, len(target)), k, hyp))
    scored.sort()
    err, k, hyp = scored[0]
    os.replace(f'{TMP}/{key}_{k}.wav', f'/home/claude/tts/wav/{key}.wav')
    mp3 = f'/home/claude/tts/mp3/{key}.mp3'
    if os.path.exists(mp3):
        os.remove(mp3)
    return err, hyp, [round(s[0], 2) for s in scored]


if __name__ == '__main__':
    phrases = json.load(open(sys.argv[1], encoding='utf-8'))
    for t in phrases:
        short = len(t.split()) <= 2
        err, hyp, all_ = best(t, n=8 if short else 5, speed=0.95 if short else 1.05)
        print(f'{err:.2f} {all_}  {t}  ->  {hyp}', flush=True)
