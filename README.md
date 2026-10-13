# play.neyra.vision — стриминг студии Neyra Vision (прототип, 13.10.2026)

Зритель смотрит наше кино: тизеры, сцены, серии, фильмы. RU/KZ. Отдельный сайт от `neyra.vision` (студия, проекты по кодам) и `studio.neyra.vision` (платформа для кинокоманд).

- `index.html` — главная: первый экран тайтла + ряды «Смотреть сейчас / Фильмы студии / Скоро».
- `t/<slug>/index.html` — страница тайтла с плеером (HLS через hls.js 1.7.3, в Safari нативно, запасной mp4), «О фильме», кадры, похожее.
- `assets/play.css` — токены (тёплый графит, янтарный акцент, Geologica/Onest/JetBrains Mono — казахские буквы есть), `assets/play.js` — язык RU/KZ (`data-ru`/`data-kz`, `?lang=kz`, localStorage), плеер, «продолжить просмотр».
- `media/<slug>/` — постер, кадры, `hls/master.m3u8` (лестница 720p/360p, сегменты 4 с, режется ffmpeg), запасной mp4. **На прод видео не в репозитории** (GitHub Pages: репо до 1 ГБ, файл до 100 МБ) — лежит на сервере/Bunny, в HTML только ссылки.
- `RAZBOR/01` — как устроены стриминги (Netflix, Apple TV, HBO, MUBI, Кинопоиск, Kinodaran изнутри), конвейер HLS, цены хранения. `RAZBOR/02` — концепт и уровни play.neyra.vision, решения Александра.

Локально: `python3 -m http.server 8793` из папки (в сессии Claude сервер поднят из копии в scratchpad — песочница не видит `~/Documents`). Проверять на 1440 и 375.

Правила: публично «технология NEYRA», без названий моделей; кадры 16:9; стиллы и тизеры партнёров (Ара Аруш, FORMLAB, Taurus, Абдрашев) — только после их «да»; казахские тексты — вычитка носителем до выкладки. На прод — только по слову Александра.

Нарезка HLS (пример):
```bash
ffmpeg -i in.mp4 -filter_complex "[0:v]split=2[v1][v2];[v1]scale=-2:720[v720];[v2]scale=-2:360[v360]" \
 -map "[v720]" -map 0:a -map "[v360]" -map 0:a -c:v libx264 -preset veryfast -crf 23 -g 48 -keyint_min 48 -sc_threshold 0 \
 -c:a aac -b:a 96k -f hls -hls_time 4 -hls_playlist_type vod -hls_segment_filename "hls/v%v/seg_%03d.ts" \
 -master_pl_name master.m3u8 -var_stream_map "v:0,a:0,name:720 v:1,a:1,name:360" hls/v%v/index.m3u8
```
