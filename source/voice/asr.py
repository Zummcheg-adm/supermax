"""Transcribe wav files with GigaAM CTC (Russian) to sanity-check TTS output."""
import sys, wave, array
import sherpa_onnx

D = '/home/claude/tts/sherpa-onnx-nemo-ctc-giga-am-russian-2024-10-24'
_rec = None


def rec():
    global _rec
    if _rec is None:
        _rec = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=f'{D}/model.int8.onnx', tokens=f'{D}/tokens.txt', num_threads=2, decoding_method='greedy_search', debug=False)
    return _rec


def read(path):
    with wave.open(path) as w:
        sr = w.getframerate(); n = w.getnframes(); data = w.readframes(n)
    a = array.array('h'); a.frombytes(data)
    return [x / 32768 for x in a], sr


def transcribe(path):
    s, sr = read(path)
    r = rec(); st = r.create_stream(); st.accept_waveform(sr, s); r.decode_stream(st)
    return st.result.text


if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(p.split('/')[-1], '->', transcribe(p))
