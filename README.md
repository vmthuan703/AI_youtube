# AI_youtube

<!-- DAILY:START -->
## Báo cáo hôm nay

Chưa có báo cáo nào. Báo cáo được cập nhật tự động mỗi ngày sau lượt thu thập thị trường.
<!-- DAILY:END -->

<!-- WEEKLY:START -->
## Báo cáo tuần mới nhất

Chưa có báo cáo tuần nào. Báo cáo được cập nhật tự động mỗi tuần.
<!-- WEEKLY:END -->

Bộ công cụ làm kênh YouTube truyện hoạt hình 2D thể loại **"What If"** cho khán giả Mỹ:
từ **nghiên cứu ngách** → **viết kịch bản** → **giọng đọc** → **render video**, hầu hết bằng code.

> Trạng thái: đang phát triển. Video đã dựng xong: **T4 #2 – "What If Your Phone Showed Tomorrow's Notifications Today?"** (9:48).

## Quy trình tổng thể

```
1. Nghiên cứu        niche_finder.py, audience_research.py
        ↓            → chọn ngách và tệp khán giả (báo cáo trong reports/)
2. Kịch bản          prompts/T4_script_prompt.md
        ↓            → kịch bản tiếng Anh trong scripts/
3. Giọng đọc         tools/tts/kokoro_tts.py (Kokoro-82M, chạy CPU, mã nguồn mở)
        ↓            → voiceover + mốc thời gian từng từ
4. Dựng video        aitrends-2d-studio/ (canvas 2D + Three.js, render từng khung hình)
                     → video mp4
```

## Có gì trong repo

| Thư mục / file | Dùng để làm gì |
|---|---|
| `niche_finder.py` | Tìm ngách mà **kênh mới** vẫn có video nhiều view (YouTube Data API, có cache SQLite) |
| `audience_research.py` | Phân tích tệp khán giả theo **động cơ xem** của 25+ kênh cùng thể loại |
| `reports/2026-11-03/` | Kết quả nghiên cứu: báo cáo tệp khán giả, mô típ kịch bản T4, các bảng CSV |
| `data/` | Dữ liệu đầu vào: danh sách kênh, nhãn động cơ, transcript 28 video T4 |
| `prompts/` | Prompt viết kịch bản T4 |
| `scripts/` | Kịch bản đã viết và bản đọc thuần cho giọng đọc |
| `tools/` | Công cụ phụ: TTS Kokoro, làm sạch phụ đề `.vtt`, thống kê mô típ transcript |
| `aitrends-2d-studio/` | Bộ dựng video: engine, dự án mẫu, công cụ tạo dự án và render |
| `market_watch.py`, `config/markets.json` | Tự động thu thập thị trường hằng ngày và tính số liệu đối thủ hằng tuần |
| `.github/workflows/market-daily.yml` | Lịch chạy `market_watch.py` mỗi ngày lúc 15:17 giờ VN, sau khi quota YouTube hồi |
| `tests/` | Kiểm thử cho `niche_finder`, `audience_research`, `market_watch`, TTS |
| `.claude/skills/` | Skill `script-to-2d-video`: từ kịch bản sang giọng đọc rồi sang video |

## Bắt đầu nhanh

**Yêu cầu:** Python 3, Node.js, ffmpeg, khóa YouTube Data API (cho bước nghiên cứu).

```bash
pip install -r requirements.txt
cp .env.example .env          # điền YOUTUBE_API_KEY
pytest                        # chạy kiểm thử
```

**Nghiên cứu ngách:**
```bash
python niche_finder.py -k "what if" "time travel" -r US --out niches.csv
```

**Tạo giọng đọc từ kịch bản:**
```bash
pip install -r requirements-tts.txt
python tools/tts/kokoro_tts.py --download          # tải model, ~350 MB
python tools/tts/kokoro_tts.py --script scripts/T4_02_tomorrows_notifications_VO.txt --out-dir out/voiceover
```

**Dựng video:**
```bash
cd aitrends-2d-studio
npm install
python tools/doctor.py                              # kiểm tra môi trường
python tools/new_project.py --name my-video --voice ../out/voiceover/voiceover.mp3
node render.mjs --project projects/my-video         # → build/video_silent.mp4
```

Xem thêm: ví dụ nhỏ tại `aitrends-2d-studio/examples/reaction-time/`, dự án hoàn chỉnh tại `aitrends-2d-studio/projects/t4-02/`.

## Tự động nghiên cứu thị trường

- **Hằng ngày:** GitHub Actions chạy `market_watch.py daily`, đẩy dữ liệu vào nhánh `research/reports`.
- **Chủ nhật:** GitHub Actions tạo số liệu tuần. Sau đó một tác vụ Claude theo lịch viết báo cáo đối thủ.
- **Báo cáo:** đọc ở [`research/reports` → `reports/INDEX.md`](https://github.com/vmthuan703/AI_youtube/blob/research/reports/reports/INDEX.md).
- **Cài đặt** (secret `YOUTUBE_API_KEY`) và cách sửa phạm vi nghiên cứu: [`docs/TU_DONG_NGHIEN_CUU.md`](docs/TU_DONG_NGHIEN_CUU.md).

## Lưu ý

- Kết luận trong `reports/` là **giả thuyết** rút từ tiêu đề và lượt xem công khai, chưa chứng minh được retention hay CTR.
- Quy ước làm việc với Claude Code nằm trong [`CLAUDE.md`](CLAUDE.md).
