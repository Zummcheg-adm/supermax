# Супер-Макс — исходники

Опубликованная игра — `../index.html` (один файл: код, шрифты и озвучка внутри) + `sw.js` (офлайн-кэш) + `manifest.webmanifest` и иконки.

## Сборка
- `src/` — стили, разметка и код игры. Спрайты — `sprites.py`.
- `build.py` — собирает `dist/site/index.html` (+ `sw.js` с новой версией кэша, манифест, иконки) и вариант для артефакта Claude.
- Озвучка (`voice/`): нейросетевой голос Piper `ru_RU-irina-medium` через sherpa-onnx (модель — GitHub releases k2-fsa/sherpa-onnx, `tts-models/vits-piper-ru_RU-irina-medium.tar.bz2`).
  Параметры детского голоса: speed 1.10, noise 0.75, затем ffmpeg `asetrate=22050*1.22,aresample=22050,atempo=0.8197`; название буквы синтезируется отдельно (speed 0.85) через паузу 140 мс; MP3 32 кбит/с.
  Злодей Глюк — голос `ruslan`, speed 0.9, тон вниз (`asetrate*0.8`) с эхом.
- Список всех фраз берётся из игры: `window.__game.allPhrases()` → `voice/phrases.json`; `voice/build_clips.py` озвучивает их в `voice/clips.json` (ключ — точный текст фразы). Фразы без записи игра говорит голосом устройства.

## Обновление на iPad
Новая сборка меняет версию в `sw.js`. При запуске иконки с интернетом игра скачивает обновление; прогресс ребёнка (localStorage `supermax-letters-v1`) сохраняется.
