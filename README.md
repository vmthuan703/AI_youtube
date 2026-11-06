# AI_youtube

<!-- KE_HOACH_MOI_NHAT:START -->
> **Kế hoạch nội dung 3 ngày tới:** [07/11–09/11 · 6 video (tuyến A + B)](ke-hoach/2026-11-07.md) · lập ngày 2026-11-06 · cập nhật 3 ngày một lần · [các kế hoạch trước](ke-hoach/README.md)
<!-- KE_HOACH_MOI_NHAT:END -->

## Tự động nghiên cứu thị trường

- **Hằng ngày:** GitHub Actions chạy `market_watch.py daily`, đẩy dữ liệu vào nhánh `research/reports`.
- **Chủ nhật:** GitHub Actions tạo số liệu tuần. Sau đó một tác vụ Claude theo lịch viết báo cáo đối thủ.
- **Báo cáo:** đọc ở [`research/reports` → `reports/INDEX.md`](https://github.com/vmthuan703/AI_youtube/blob/research/reports/reports/INDEX.md).
- **Cài đặt** (secret `YOUTUBE_API_KEY`) và cách sửa phạm vi nghiên cứu: [`docs/TU_DONG_NGHIEN_CUU.md`](docs/TU_DONG_NGHIEN_CUU.md).

<!-- DAILY:START -->
## Báo cáo hôm nay

_Cập nhật tự động 2026-11-06. Số liệu từ YouTube Data API, đối chiếu bằng tay trước khi quyết định._

### Tóm tắt thu thập 2026-11-06

- Quota đã dùng: 2176 / ngân sách 6000 đơn vị
- Kênh theo dõi: 54 · video đã chụp: 1229

#### What-If Fiction × Mỹ

- Truy vấn đã chạy: 20 · bỏ qua: 0 · lỗi: 0
- Kênh mới thêm vào theo dõi: Matal, BrainBracket, Stick Knows, The Hypothetical Room, Just Suppose ?, Stick Saga
- Kênh bỏ khỏi theo dõi vì lệch ngách: Matal (14% khớp), BrainBracket (43% khớp), Stick Knows (4% khớp), Stick Saga (33% khớp)
- Bảng chấm nhanh (chỉ dữ liệu hôm nay): **CẦN THEO DÕI** · tuổi trung vị top 5: 19.3 tháng · video ≥ 100k: 231

| Kênh mới thắng | Tuổi (ngày) | Sub | Video to nhất |
|---|---|---|---|
| Minute Zero | 26 | 21.900 | 2.271.217 |
| Araragi | 117 | 23.000 | 1.394.135 |
| ConChaser | 12 | 16.400 | 1.376.773 |
|  Jeremy Bearimy | 25 | 37.500 | 1.364.122 |
| OminiAM | 30 | 6.480 | 1.155.348 |
| Earth Tipping | 37 | 1.500 | 950.658 |
| Manifesting | 24 | 4.970 | 949.746 |
| IFOLOGY | 26 | 52.800 | 914.845 |
| What If Animations | 33 | 6.090 | 876.803 |
| Miko | 19 | 7.630 | 751.384 |

Xem thêm: [dữ liệu ngày 2026-11-06](https://github.com/vmthuan703/AI_youtube/blob/research/reports/data/2026-11-06/TOM_TAT.md)

<!-- DAILY:END -->

<!-- WEEKLY:START -->
## Báo cáo tuần mới nhất

_Báo cáo 2026-W45 · nguồn `SO_LIEU.md`. Chỉ trích phần đầu, bản đầy đủ ở link bên dưới._

#### Bảng chấm ô

| Điều kiện | Ngưỡng | Số đo | Kết quả |
|---|---|---|---|
| Có kênh ≤ 3 tháng đã có video ≥ 100k | có |  Jeremy Bearimy, ConChaser, DOOMPERK, Earth Tipping, IFOLOGY (+28 kênh) | đạt |
| Tuổi trung vị 5 kênh có video to nhất | ≤ 12 tháng | 57.3 tháng (ngày tạo kênh, video cũ nhất) | không |
| view/sub trung vị (5 kênh đó) | ≥ 10× | 78.6 | đạt |
| Số video dài ≥ 100k | ≥ 8 (cần, không đủ) | 220 | đạt |
| View trung vị của video ≥ 100k | 150k–600k | 256.989 | đạt |
| Kênh đúng ngách (top 5, tự động theo tiêu đề) | ≥ 80% | 2/2 kênh có đủ tiêu đề | — |

5 kênh có video to nhất (dùng cho 3 dòng tuổi, view/sub, đúng ngách; **cần đọc tay xác minh đúng ngách**, kênh sai thì thêm vào `exclude_channels` trong config):

| Kênh | Tuổi (ngày) | Sub | Video to nhất | Tỉ lệ tiêu đề khớp |
|---|---|---|---|---|
| Ifverse | 1.742 | 59.500 | 4.679.653 | chưa theo dõi |
| Minute Zero | 25 | 21.600 | 2.241.643 | 100% |
| Peekaboo Kidz | 4.533 | 7.910.000 | 1.886.460 | chưa theo dõi |
| Kian Odyssey | 2.401 | 4.940 | 1.862.452 | chưa theo dõi |
| Itadorists | 316 | 42.700 | 1.830.971 | 85% |

**Kết luận số: CẦN THEO DÕI.** Tuổi kênh dự báo mạnh nhất. View trung vị càng cao thì cửa càng đóng.

Xem thêm: [báo cáo đầy đủ 2026-W45](https://github.com/vmthuan703/AI_youtube/blob/research/reports/reports/2026-W45/SO_LIEU.md) · [mọi báo cáo tuần](https://github.com/vmthuan703/AI_youtube/blob/research/reports/reports/INDEX.md)

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
| `plugins/aitrends-3d-studio/` | **Plugin video 3D**: kịch bản → giọng đọc Kokoro → video hoạt hình 3D (Three.js), tới 4K/60 fps. Xem [README plugin](plugins/aitrends-3d-studio/README.md) |
| `.claude-plugin/marketplace.json` | Marketplace để cài plugin bằng `/plugin` |

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

**Dựng video 3D từ kịch bản (plugin `aitrends-3d-studio`):**
```bash
/plugin marketplace add vmthuan703/AI_youtube
/plugin install aitrends-3d-studio@ai-youtube
```
Mở repo này bằng Claude Code thì không cần hai lệnh trên: `.claude/settings.json` đã khai báo plugin (đồng ý khi được hỏi).
Sau đó nói "làm video 3D từ kịch bản này" kèm file kịch bản. Claude chạy đủ 8 bước: khảo sát, cài studio, giọng đọc,
phân cảnh, chọn phong cách, dựng cảnh, âm thanh, render (chọn 720p–4K, 24/30/60 fps, preset `draft`→`max`).
Đóng gói zip để tải lên claude.ai: `bash plugins/build_zip.sh`.

## Lưu ý

- Kết luận trong `reports/` là **giả thuyết** rút từ tiêu đề và lượt xem công khai, chưa chứng minh được retention hay CTR.
- Quy ước làm việc với Claude Code nằm trong [`CLAUDE.md`](CLAUDE.md).
