"""Neural Russian TTS via sherpa-onnx + Piper voices."""
import sys, os, wave, array, json
import sherpa_onnx

BASE = '/home/claude/tts'
_cache = {}


def engine(voice, noise=0.667, noise_w=0.8):
    key = (voice, noise, noise_w)
    if key in _cache:
        return _cache[key]
    d = f'{BASE}/vits-piper-ru_RU-{voice}-medium'
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=f'{d}/ru_RU-{voice}-medium.onnx', lexicon='', data_dir=f'{d}/espeak-ng-data',
                tokens=f'{d}/tokens.txt', noise_scale=noise, noise_scale_w=noise_w, length_scale=1.0),
            provider='cpu', num_threads=2, debug=False),
        max_num_sentences=1)
    t = sherpa_onnx.OfflineTts(cfg)
    _cache[key] = t
    return t


def synth(text, path, voice='irina', speed=1.0, noise=0.667, noise_w=0.8):
    t = engine(voice, noise, noise_w)
    a = t.generate(text, sid=0, speed=speed)
    sr = a.sample_rate
    samples = a.samples
    pcm = array.array('h', (max(-32767, min(32767, int(s * 32767))) for s in samples))
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
    return len(samples) / sr


if __name__ == '__main__':
    voice, text, out = sys.argv[1], sys.argv[2], sys.argv[3]
    print(synth(text, out, voice))
