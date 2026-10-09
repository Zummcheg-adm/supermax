"""Synthesize every game phrase with Piper (irina), trim, normalize, encode MP3, write clips.json."""
import json, os, sys, hashlib, subprocess, wave, array, base64, time
sys.path.insert(0, '/home/claude/tts')
from synth import synth

phrases = json.load(open('/home/claude/tts/phrases.json', encoding='utf-8'))
import re
NAMES = sorted([n for n in json.load(open('/home/claude/tts/names.json', encoding='utf-8')) if 'знак' not in n], key=len, reverse=True)
_nr = '|'.join(re.escape(n) for n in NAMES)
PAT_END = re.compile(r'^(.*(?:букву|буква|буквы|буквой))\s+(' + _nr + r')([!.?])$')
PAT_START = re.compile(r'^(' + _nr + r'): (.+)$', re.I)
os.makedirs('/home/claude/tts/wav2', exist_ok=True)
_seg = {}


def read_pcm(path):
    with wave.open(path) as w:
        sr = w.getframerate(); a = array.array('h'); a.frombytes(w.readframes(w.getnframes()))
    return sr, a


from vowels import vowel_wav, PURE, IOT


def seg(text, speed):
    key = (text, speed)
    if key not in _seg:
        core = text.strip('!.?, ').lower()
        if len(core) == 1 and core in (PURE | IOT):
            tp = f'/home/claude/tts/vow/v_{ord(core)}.wav'   # firm single-sound vowel
            if not os.path.exists(tp):
                vowel_wav(core, tp)
        else:
            tp = f'/home/claude/tts/wav2/seg_{hashlib.md5((text + str(speed)).encode()).hexdigest()[:12]}.wav'
            if not os.path.exists(tp):
                synth(text, tp, 'irina', speed=speed, noise=0.75)
        _seg[key] = read_pcm(tp)
    return _seg[key]


def split_parts(text):
    m = PAT_END.match(text)
    if m:
        return [(m.group(1) + ',', 1.10), (m.group(2) + '!', 0.85)]
    m = PAT_START.match(text)
    if m:
        nm = m.group(1); return [(nm[0].upper() + nm[1:] + '!', 0.85), (m.group(2), 1.10)]
    return None


def synth_split(parts, out):
    sr = 22050; pcm = array.array('h')
    for i, (t, sp) in enumerate(parts):
        r, a = seg(t, sp); sr = r
        # trim leading/trailing near-silence of each segment
        th = 300
        b = 0
        while b < len(a) and abs(a[b]) < th: b += 1
        e = len(a)
        while e > b and abs(a[e - 1]) < th: e -= 1
        if i: pcm.extend([0] * int(sr * 0.14))
        pcm.extend(a[max(0, b - 200):min(len(a), e + 400)])
    with wave.open(out, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())

VILLAIN = {'Ха-ха! Я спрятал все буквы! Не найдёшь!'}
os.makedirs('/home/claude/tts/wav', exist_ok=True)
os.makedirs('/home/claude/tts/mp3', exist_ok=True)
QA = os.environ.get('QA', '6')

def h(t):
    return hashlib.md5(t.encode('utf-8')).hexdigest()[:16]


def peak_normalize(path, target=0.89):
    with wave.open(path) as w:
        sr = w.getframerate(); data = w.readframes(w.getnframes())
    a = array.array('h'); a.frombytes(data)
    pk = max(1, max(abs(x) for x in a))
    g = target * 32767 / pk
    b = array.array('h', (max(-32767, min(32767, int(x * g))) for x in a))
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(b.tobytes())


t0 = time.time()
clips = {}
total_dur = 0
for k, text in enumerate(phrases):
    key = h(text)
    wavp = f'/home/claude/tts/wav/{key}.wav'
    mp3p = f'/home/claude/tts/mp3/{key}.mp3'
    if not os.path.exists(mp3p):
        clean = text.replace('«', '').replace('»', '')
        if text in VILLAIN:
            if not os.path.exists(wavp): synth(clean, wavp, 'ruslan', speed=0.9)
            af = ('asetrate=22050*0.8,aresample=22050,atempo=1.25,aecho=0.8:0.6:45:0.25,'
                  'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse')
        else:
            parts = split_parts(clean)
            if parts:
                wavp = f'/home/claude/tts/wav2/{key}.wav'
                synth_split(parts, wavp)
            elif not os.path.exists(wavp): synth(clean, wavp, 'irina', speed=1.10, noise=0.75)
            af = ('asetrate=22050*1.22,aresample=22050,atempo=0.8197,'
                  'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,adelay=40')
        tmp = wavp.replace('.wav', '.t.wav')
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', wavp, '-af', af, '-ac', '1', '-ar', '22050', tmp], check=True)
        peak_normalize(tmp)
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', os.environ.get('BR', '32k'), mp3p], check=True)
        os.remove(tmp)
    wp = wavp if os.path.exists(wavp) else f'/home/claude/tts/wav2/{key}.wav'
    if os.path.exists(wp):
        with wave.open(wp) as w:
            total_dur += w.getnframes() / w.getframerate()
    if k == 0 or not os.path.exists(wavp):
        pass
    clips[text] = base64.b64encode(open(mp3p, 'rb').read()).decode('ascii')
    if k % 100 == 0:
        print(k, f'{time.time()-t0:.0f}s', flush=True)

json.dump(clips, open('/home/claude/tts/clips.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
size = os.path.getsize('/home/claude/tts/clips.json')
print('done', len(clips), 'clips', f'{total_dur/60:.1f} min raw audio', f'clips.json {size/1e6:.2f} MB', f'{time.time()-t0:.0f}s')
