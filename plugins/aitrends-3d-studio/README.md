# aiTrends 3D Studio

Plugin Claude Code biến **một kịch bản** thành **video hoạt hình 3D hoàn chỉnh** theo phong cách "What if…":
nhân vật người que 3D đầu tròn to (trắng ngà có viền, hoặc đen mắt trắng), áo hoodie to màu, bối cảnh đơn giản
mà điện ảnh (hành lang trường, phòng ngủ, phố đêm…), ánh đèn ấm, góc máy thấp, xóa phông.

Mọi khung hình đều dựng bằng code (Three.js) và render từng khung một. Không dùng AI tạo ảnh/video, nên nhân vật
giữ nguyên dáng suốt video và chữ luôn nét. Giọng đọc dùng Kokoro-82M (mã nguồn mở, Apache-2.0, chạy máy cá nhân).

## Lệnh
| Lệnh | Việc làm |
|---|---|
| "Làm video 3D từ kịch bản này" | chạy toàn bộ quy trình (skill `make-3d-video`) |
| `/new-3d-video` | khảo sát, cài studio, tạo giọng đọc, mốc thời gian, phân cảnh |
| `/3d-video-styles` | render chính các cảnh của bạn ở 7 phong cách để chọn |
| `/render-3d-video` | dựng và kiểm tra cảnh, xem thử, chọn chất lượng xuất, render bản cuối |
| `/3d-video-sound` | nhạc theo cảm xúc, hiệu ứng âm thanh, mix và ghép |

## Quy trình (giống aitrends-2d-studio, thêm bước giọng đọc)
1. **Khảo sát 1 lần:** giọng người dẫn, chất lượng xuất, khung hình, tốc độ đọc.
2. **Cài studio** vào thư mục làm việc (`aitrends-3d-studio/`): ffmpeg, Node, Chromium, numpy/scipy, Kokoro.
3. **Giọng đọc:** nghe thử 8 câu → đọc toàn bộ → mốc thời gian từng từ có tên người nói (không cần Whisper).
4. **Phân cảnh:** `story/bible.md`, trang phục nhân vật, `story/shots.json`.
5. **Chọn phong cách** từ ảnh render thật: cinematic (có viền, như video "Crush") · soft (không viền, như video "Luck") · ink · toon · golden · neon · noir.
6. **Dựng từng cảnh** theo lô 8–12, kiểm tra bằng contact sheet.
7. **Âm thanh:** nhạc tự sinh theo cảm xúc, 36 hiệu ứng, tiếng nền.
8. **Render:** xem thử → bản cuối → mix (−14 LUFS) → `out/<tên>.mp4`.

Có 4 điểm dừng để bạn duyệt: khảo sát, nghe thử giọng, chọn phong cách, xem thử video.

## Chất lượng xuất
| Tùy chọn | Giá trị |
|---|---|
| Độ phân giải | 720p · 1080p · 1440p · 2160p (4K) |
| Khung hình/giây | 24 · 30 · **60** |
| Preset | `draft` (nháp) · `standard` · **`high`** (MSAA 4×, CRF 14) · `max` (thêm siêu lấy mẫu 1,5×, CRF 10) |
| Nâng cấp khi xuất | `upscale 1440p` / `2160p`: YouTube cấp bản VP9/AV1 bitrate cao, nét hơn cả khi người xem chọn 1080p |

Bản xuất: H.264 High, BT.709, AAC 48 kHz 384 kb/s, đúng khuyến nghị tải lên của YouTube. Mặc định đề xuất:
**1080p60 · high**, kèm `upscale 1440p` khi đăng YouTube.

## Thời gian render
- Máy **có GPU** (PC Windows/macOS): phần 3D gần như không tốn thời gian, còn lại chủ yếu là chụp khung và chỉnh màu.
  Ước tính 15–40 khung/giây ở 1080p với nhiều worker (video 10 phút 1080p60 khoảng 20–40 phút).
  Đây là ước tính, chưa đo trên GPU thật; chạy `--bench` để có số của máy bạn.
- Máy **không GPU** (máy chủ, phiên cloud): khoảng 0,6 khung/giây ở 1080p chất lượng high.
  - 1 phút video 1080p60 mất khoảng 100–120 phút (đo thật: demo 32,5 giây 1080p60 high mất 61 phút).
  - Nên xem thử bản 720p trước, rồi render bản cuối qua đêm hoặc trên máy có GPU.

## Tận dụng GPU (ví dụ GTX 1660 Super 6 GB)
- Trên Windows, renderer tự dùng GPU, không cần cấu hình. Dòng đầu log in tên card, ví dụ `WebGL: ANGLE (NVIDIA … GTX 1660 SUPER …) (GPU)`.
  Nếu thấy `SwiftShader` là GPU chưa được dùng: cập nhật driver NVIDIA rồi chạy `npx playwright install chromium`.
- Bộ mã hóa phần cứng **NVENC** của card được dùng tự động khi ffmpeg có `h264_nvenc` (bản ffmpeg cài bằng winget có sẵn),
  giúp CPU rảnh để chụp khung. Ép chọn: `--encoder nvenc` hoặc `--encoder x264`.
- Số worker mặc định bằng nửa số luồng CPU, tối đa 8. Với card 6 GB, plugin tự giới hạn 5 worker ở 1440p, 3 worker ở 4K.
- Đo máy của bạn: `node render.mjs --project examples/speed-demo --bench`. Lệnh in GPU đang dùng, thời gian mỗi khung và ước tính tổng.

## Cài đặt plugin
- **Mở repo này bằng Claude Code** (máy bạn hoặc claude.ai/code): plugin đã khai báo sẵn trong `.claude/settings.json`.
  Khi được hỏi có tin thư mục và cài marketplace `ai-youtube` không, chọn đồng ý.
- **Cài cho mọi thư mục trên máy** (Claude Code):
  ```bash
  /plugin marketplace add vmthuan703/AI_youtube
  /plugin install aitrends-3d-studio@ai-youtube
  ```
- **Claude Desktop / claude.ai** (giống plugin 2D): `bash plugins/build_zip.sh`, rồi tải
  `dist/aitrends-3d-studio-0.1.0.zip` lên mục Plugins trên claude.ai.

## Nội dung
- `skills/make-3d-video/`: quy trình đầy đủ, tài liệu tham chiếu và bộ studio (`kit/`: renderer, engine 3D,
  TTS, công cụ, âm thanh, dự án mẫu `examples/speed-demo`).
- `skills/new-3d-video`, `3d-video-styles`, `render-3d-video`, `3d-video-sound`: các lệnh theo giai đoạn.

Không cần API key hay connector.
