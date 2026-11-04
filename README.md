# AI_youtube

Công cụ tự động hoá quy trình làm kênh YouTube.

<!-- DAILY:START -->
## Báo cáo hôm nay

Chưa có báo cáo nào. Báo cáo được cập nhật tự động mỗi ngày sau lượt thu thập thị trường.
<!-- DAILY:END -->

<!-- WEEKLY:START -->
## Báo cáo tuần mới nhất

Chưa có báo cáo tuần nào. Báo cáo được cập nhật tự động mỗi tuần.
<!-- WEEKLY:END -->

## 1. Tìm ngách: `niche_finder.py`

Tìm các chủ đề mà **kênh mới** vẫn có video nhiều view, theo từng quốc gia.

```bash
pip install -r requirements.txt
export YOUTUBE_API_KEY=khoá_của_bạn

# thử nhỏ trước: 1 từ khoá x 1 quốc gia = 100 đơn vị quota
python niche_finder.py -k "ancient history" -r US

# nhiều từ khoá, nhiều quốc gia
python niche_finder.py -k "true crime" "history documentary" -r US VN JP --language en
```

Kết quả: bảng tóm tắt trên màn hình và file `niches.csv` (mở bằng Excel/Sheets) gồm
mỗi video của kênh mới: view, view/ngày, số subscriber, `views_to_subs`, ngày tạo kênh...

Cách đọc: ngách tốt là ngách có **nhiều kênh mới khác nhau** (cột `kênh mới`) cùng có
view/ngày cao, và `views_to_subs` lớn (video vượt xa số người đăng ký).

Tuỳ chọn chính: `--channel-age-days` (mặc định 180), `--video-age-days` (mặc định 90),
`--language`, `--out`.

**Quota:** mặc định 10.000 đơn vị/ngày; mỗi lần tìm = 100 đơn vị (≈100 lượt/ngày). Kết quả
được cache 24 giờ trong `cache.sqlite` nên chạy lại cùng tham số không tốn quota.

Chạy test (không gọi API thật): `python -m pytest`

## 2. Tìm tệp khán giả theo động cơ xem: `audience_research.py`

Gom video thành **tệp khán giả giả thuyết** theo lời hứa tâm lý (không theo từ khoá),
chuẩn hoá hiệu suất theo từng kênh rồi lọc qua 3 cửa.

```bash
export YOUTUBE_API_KEY=khoá_của_bạn

# Bước 1: lấy toàn bộ video công khai của các kênh (~1 đơn vị quota / 50 video)
python audience_research.py collect --channels data/channels_2026-11-04.csv \
    --seed IFopposite --controls Manifesting Hypothetica \
    --extra "Hypothetica=@handle_that"      # kênh không có trong CSV
# -> out/videos.csv (mọi video kèm lý do loại) + out/coverage.csv (độ phủ từng kênh)

# Bước 2: lần đầu chưa có nhãn -> xuất out/labels_template.csv
python audience_research.py score
# Điền nhãn động cơ cho từng video (topic, promise, motivation_primary = T1..T8 hoặc
# mã tệp mới, confidence, ambiguous; để UNCLEAR nếu thiếu căn cứ), lưu data/labels.csv.
# Điền ideas_count / us_evidence (geo|english|none) trong data/segments.csv.

# Bước 3: tính Bảng A, Bảng B, ma trận tuổi
python audience_research.py score
```

Quy tắc đã cài: video dài ≥ 4 phút (Shorts, video 3–4 phút, livestream đang/sắp diễn ra,
thiếu view, trùng đều bị loại và ghi lý do); `baseline = median` video dài của kênh (cần ≥ 3
video, baseline 0 → không xác định); bùng = ≥ 10× baseline; robust = ≥ 12× và baseline ≥ 1.000;
đếm kênh bùng theo **kênh khác nhau**; `cross_channel_lift` chỉ tính kênh có ≥ 2 video trong tệp.
Chỉ có lượt xem tích luỹ nên luôn có cảnh báo tuổi video và cột `median_age_adjusted`
(relative chia cho trung vị cùng nhóm tuổi đăng); kiểm tra độ nhạy bằng `--min-age 7`,
`--exclude-roles seed control`, `--min-confidence medium`; xem `table_B2_age_matrix.csv` để
so sánh trong cùng nhóm tuổi. Điểm 100 là heuristic, không phải xác suất.

Kết quả nghiên cứu 2026-11-03 (27 kênh, 377 video dài): `reports/2026-11-03/BAO_CAO_TEP_KHAN_GIA.md`.

## 3. Script → voiceover (mã nguồn mở) → video 2D

`tools/tts/kokoro_tts.py` đọc kịch bản có tên người nói (`NARRATOR: …`, `MOM: …`) bằng
**Kokoro-82M** (Apache-2.0, chạy CPU, 28 giọng tiếng Anh), xuất `voiceover.mp3`, `words.json`
(mốc thời gian từng từ, nhập thẳng vào aiTrends 2D Studio, không cần Whisper) và `lines.json`
(ai nói lúc nào, để nhép miệng nhân vật).

```bash
pip install -r requirements-tts.txt
python tools/tts/kokoro_tts.py --download            # ~350 MB, một lần
python tools/tts/kokoro_tts.py --script scripts/T4_02_tomorrows_notifications_VO.txt --list-speakers
python tools/tts/kokoro_tts.py --script scripts/T4_02_tomorrows_notifications_VO.txt \
    --out-dir out/T4_02_voice --speed 1.12 --sentence-pause 0.15 --line-pause 0.35 \
    --voices "NARRATOR=am_michael,MOM=af_sarah,MAYA=af_bella,SAM=am_puck,..."
```

Skill dự án `.claude/skills/script-to-2d-video`: chỉ cần đưa kịch bản. Claude hỏi bạn một lần
(giọng dẫn, tốc độ, giọng nhân vật, khung hình), cho nghe thử, tạo voiceover, rồi chuyển sang
`aitrends-2d-studio:make-2d-video`.
