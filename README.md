# AI_youtube

<!-- KE_HOACH_MOI_NHAT:START -->
> **Kế hoạch nội dung 3 ngày tới:** [05/11–07/11 · 6 video (tuyến A + B)](ke-hoach/2026-11-05.md) · lập ngày 2026-11-04 · cập nhật 3 ngày một lần · [các kế hoạch trước](ke-hoach/README.md)
<!-- KE_HOACH_MOI_NHAT:END -->

## Tự động nghiên cứu thị trường

- **Hằng ngày:** GitHub Actions chạy `market_watch.py daily`, đẩy dữ liệu vào nhánh `research/reports`.
- **Chủ nhật:** GitHub Actions tạo số liệu tuần. Sau đó một tác vụ Claude theo lịch viết báo cáo đối thủ.
- **Báo cáo:** đọc ở [`research/reports` → `reports/INDEX.md`](https://github.com/vmthuan703/AI_youtube/blob/research/reports/reports/INDEX.md).
- **Cài đặt** (secret `YOUTUBE_API_KEY`) và cách sửa phạm vi nghiên cứu: [`docs/TU_DONG_NGHIEN_CUU.md`](docs/TU_DONG_NGHIEN_CUU.md).

<!-- DAILY:START -->
## Báo cáo hôm nay

_Cập nhật tự động 2026-11-04. Số liệu từ YouTube Data API, đối chiếu bằng tay trước khi quyết định._

### Tóm tắt thu thập 2026-11-04

- Quota đã dùng: 2170 / ngân sách 6000 đơn vị
- Kênh theo dõi: 52 · video đã chụp: 1163

#### What-If Fiction × Mỹ

- Truy vấn đã chạy: 20 · bỏ qua: 0 · lỗi: 0
- Kênh mới thêm vào theo dõi: Matal, Vanessa Harris, Stick Revival, Nick ifverse, Nearside, Toonists, BrainBracket, Stick Knows, Then What?, Minute Zero Extra, The If Lab, My Academia Recap, Sual, The Frame One, IFSIM FILMS, What If That, What if U click, Mirage
- Kênh bỏ khỏi theo dõi vì lệch ngách: Matal (14% khớp), BrainBracket (43% khớp), Stick Knows (3% khớp)
- Bảng chấm nhanh (chỉ dữ liệu hôm nay): **CẦN THEO DÕI** · tuổi trung vị top 5: 57.3 tháng · video ≥ 100k: 220

| Kênh mới thắng | Tuổi (ngày) | Sub | Video to nhất |
|---|---|---|---|
| Minute Zero | 24 | 21.600 | 2.241.643 |
| Araragi | 115 | 22.700 | 1.374.705 |
| ConChaser | 11 | 14.600 | 1.313.338 |
| OminiAM | 28 | 6.340 | 1.142.835 |
|  Jeremy Bearimy | 24 | 32.000 | 1.062.186 |
| Earth Tipping | 35 | 1.500 | 943.197 |
| Manifesting | 23 | 4.740 | 942.459 |
| IFOLOGY | 25 | 51.600 | 902.342 |
| What If Animations | 32 | 6.080 | 875.857 |
| Miko | 17 | 7.300 | 715.276 |

Xem thêm: [dữ liệu ngày 2026-11-04](https://github.com/vmthuan703/AI_youtube/blob/research/reports/data/2026-11-04/TOM_TAT.md)

<!-- DAILY:END -->

<!-- WEEKLY:START -->
## Báo cáo tuần mới nhất

_Báo cáo 2026-11-03_moc · nguồn `BAO_CAO_DOI_THU.md`. Chỉ trích phần đầu, bản đầy đủ ở link bên dưới._

### 1. Kết luận nhanh

- **Cửa đang mở, nhưng mẫu bị lệch về kênh trẻ.** 17/26 kênh có video dài ≥ 100k khi chưa đầy 3 tháng tuổi.
  Tuổi trung vị của 5 kênh có video to nhất là 0,8 tháng. Danh sách kênh mồi lấy từ trang theo dõi
  *kênh mới*, nên kết luận này phải chờ discovery kiểm lại.
- **View trung vị của video ≥ 100k là 285.537** (61 video), nằm trong vùng tốt 150k–600k. Chưa có dấu
  hiệu kênh cũ ngồi sẵn.
- **Ô đang trộn hai ngách.** Trong 5 kênh có video to nhất, chỉ 3 kênh làm what-if *về chính người xem*
  (ConChaser, Manifesting, IFOLOGY). OminiAM và What If Animations làm what-if *về thế giới/khoa học*. Tỉ lệ
  đúng ngách 3/5 = 60%, dưới ngưỡng 80%.
- **Khung tiêu đề mạnh nhất là "What If You Could See Everyone's ___?"**: 23 video ở 11 kênh, 6 kênh có
  video ≥ 100k, 4 kênh có video bung. ConChaser làm toàn bộ bằng khung này và đạt trung vị 194.047
  view trên 11 video, khi kênh mới 10 ngày tuổi.
- **Chủ đề ít người làm mà vẫn bung:** "Làm lại cuộc đời với ký ức cũ" (7 video, bung ở 2 kênh) và
  "IQ vượt trội" (17 video ở 5 kênh, bung ở 2 kênh).

Xem thêm: [báo cáo đầy đủ 2026-11-03_moc](https://github.com/vmthuan703/AI_youtube/blob/research/reports/reports/2026-11-03_moc/BAO_CAO_DOI_THU.md) · [mọi báo cáo tuần](https://github.com/vmthuan703/AI_youtube/blob/research/reports/reports/INDEX.md)

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
| `tools/thumbnails/`, `docs/THUMBNAIL_PLAYBOOK.md` | Thu thập thumbnail đối thủ (workflow **Thu thập thumbnail đối thủ**) và cẩm nang làm thumbnail rút ra từ đó |
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

## Lưu ý

- Kết luận trong `reports/` là **giả thuyết** rút từ tiêu đề và lượt xem công khai, chưa chứng minh được retention hay CTR.
- Quy ước làm việc với Claude Code nằm trong [`CLAUDE.md`](CLAUDE.md).
