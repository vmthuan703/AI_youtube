# aiTrends 3D Studio

Plugin Claude Code biến **một kịch bản** thành **video hoạt hình 3D hoàn chỉnh** theo phong cách "What if…":
nhân vật người que 3D đầu tròn to, hero áo phao chanh tóc bạch kim anime, bối cảnh đơn giản mà điện ảnh, ánh sáng hoàng hôn phấn,
khung hình 2:1, sơ đồ giải thích hoạt hình.

Mọi khung hình đều dựng bằng code (Three.js) và render từng khung một. Không dùng AI tạo ảnh/video, nên nhân vật
giữ nguyên dáng suốt video và chữ luôn nét. Giọng đọc mặc định dùng Chatterbox (MIT, chạy máy cá nhân), dự phòng Kokoro-82M (Apache-2.0).

## Lệnh
| Lệnh | Việc làm |
|---|---|
| "Làm video 3D từ kịch bản này" | chạy toàn bộ quy trình (skill `make-3d-video`) |
| `/new-3d-video` | đọc thiết lập kênh, soát kịch bản, cài studio, tạo giọng đọc, mốc thời gian, phân cảnh |
| `/3d-video-styles` | render chính các cảnh của bạn ở các phong cách và bảng màu để chọn |
| `/render-3d-video` | dựng và kiểm tra cảnh, xem thử, bảng điểm, render bản cuối, dọn file |
| `/3d-video-sound` | nhạc theo cảm xúc, hiệu ứng âm thanh, mix và ghép |

## Quy trình
1. **Thiết lập kênh và soát kịch bản:** đọc `channel/brand.json` nên không hỏi lại; `tools/script_check.py` chỉ gợi ý, không tự sửa lời.
2. **Cài studio** vào thư mục làm việc (`aitrends-3d-studio/`): ffmpeg, Node, Chromium, numpy/scipy, Kokoro, Chatterbox.
3. **Giọng đọc:** nghe thử → đọc toàn bộ → báo tốc độ từ/phút (mục tiêu 160–175) → mốc thời gian từng từ có tên người nói.
4. **Phân cảnh:** `story/bible.md` (bảng màu và thiết bị đặc trưng riêng của video), trang phục, `story/shots.json`.
5. **Chọn phong cách** từ ảnh render thật: `pearl` (mặc định của kênh) · cinematic · soft · ink · toon · golden · neon · noir, cùng 6 bảng màu.
6. **Dựng từng cảnh** theo lô 8–12, kiểm tra bằng contact sheet. Sơ đồ giải thích từ `engine/diagrams2d.js`.
7. **Âm thanh:** nhạc tự sinh theo cảm xúc, 36 hiệu ứng, tiếng nền.
8. **Render:** xem thử + bảng điểm → bản cuối → mix (−14 LUFS) → `out/<tên>.mp4` → dọn file, chỉ giữ MP4.

Có 5 điểm dừng để bạn duyệt: soát kịch bản, nghe thử giọng, chọn phong cách và bảng màu, xem thử kèm bảng điểm, bản cuối.

## Có gì mới ở 0.2.3
| Nhóm | Thay đổi |
|---|---|
| Nhân vật | Dàn 25 vai trong `channel/cast.js`: gia đình, trường học, bệnh viện, cảnh sát, cứu hỏa, bảo vệ, đầu bếp, thu ngân, nhà khoa học, công nhân, phóng viên, cô giáo áo dài · `ROLES` nối từ trong kịch bản với vai |
| Engine | `engine/costume3d.js`: mũ y tá, kê-pi, mũ đầu bếp, mũ bảo hộ, ống nghe, dây thẻ, còi, phù hiệu, áo phản quang, tạp dề, râu, ria, hói, lông mày bạc, gậy, sách, micro… · áo `scrubs`, `aodai` · tư thế `hunch`, `hunchCane`, `handsOnHips`, `handsOnBelt`, `holdMic` |
| Sửa lỗi | Vành mũ không còn đổ vệt bóng ngang mặt · áo blouse trắng ngà thay vì trắng tinh |

## Có gì mới ở 0.2.0
| Nhóm | Thay đổi |
|---|---|
| Hình ảnh | Dải đen 2:1 · phong cách `pearl` · 6 bảng màu riêng từng video · mặt `deadpan`, `unimpressed` · áo phao chính thức · da không còn cháy sáng |
| Giải thích | Khoảng 25 sơ đồ hoạt hình · sơ đồ trên chính cảnh đó làm mờ · bong bóng thoại tự động |
| Dựng phim | Góc máy siêu cận, đầu khổng lồ tiền cảnh · nhắc đăng ký bằng hero ở khoảng 1:30 |
| Kịch bản | Bước soát kịch bản, chỉ gợi ý · thiết bị đặc trưng cho mỗi video |
| Quy trình | Bộ nhận diện kênh `channel/` · Chatterbox trong plugin · nhạc nền cân lại · bảng điểm `qc_metrics.py` · dọn file `tidy_project.py` |
| Sửa lỗi | `focusOn` lệch tâm bị mờ · `--out` lỗi ở bước ghép · nhà và trăng sai màu theo tâm trạng cảnh |

## Chất lượng xuất
| Tùy chọn | Giá trị |
|---|---|
| Độ phân giải | 720p · 1080p · 1440p · 2160p (4K) |
| Khung hình/giây | 24 · 30 · **60** |
| Preset | `draft` (nháp) · `standard` · **`high`** (MSAA 4×, CRF 14) · `max` (thêm siêu lấy mẫu 1,5×, CRF 10) |
| Nâng cấp khi xuất | `upscale 1440p` / `2160p`: YouTube cấp bản VP9/AV1 bitrate cao, nét hơn cả khi người xem chọn 1080p |

Bản xuất: H.264 High, BT.709, AAC 48 kHz 384 kb/s, đúng khuyến nghị tải lên của YouTube. Mặc định của kênh:
**1080p60 · high**, kèm `upscale 1440p`.

## Thời gian render
- Máy **có GPU** (PC Windows/macOS): phần 3D gần như không tốn thời gian, còn lại chủ yếu là chụp khung và chỉnh màu.
  Chạy `--bench` để có số của máy bạn.
- Máy **không GPU** (máy chủ, phiên cloud): khoảng 0,6 khung/giây ở 1080p chất lượng high.
  - Nên xem thử bản 720p trước, rồi render bản cuối qua đêm hoặc trên máy có GPU.

## Tận dụng GPU (ví dụ GTX 1660 Super 6 GB)
- Trên Windows, renderer tự dùng GPU, không cần cấu hình. Dòng đầu log in tên card.
  Nếu thấy `SwiftShader` là GPU chưa được dùng: cập nhật driver NVIDIA rồi chạy `npx playwright install chromium`.
- **NVENC** được dùng tự động khi ffmpeg có `h264_nvenc`. Ép chọn: `--encoder nvenc` hoặc `--encoder x264`.
- Khi Chatterbox đang tạo giọng, **không render gì khác**: card 6 GB vượt bộ nhớ sẽ chậm đi hơn 10 lần.

## Cài đặt plugin
- **Mở repo này bằng Claude Code**: plugin đã khai báo sẵn trong `.claude/settings.json`.
- **Cài cho mọi thư mục trên máy** (Claude Code):
  ```bash
  /plugin marketplace add vmthuan703/AI_youtube
  /plugin install aitrends-3d-studio@ai-youtube
  ```
- **Claude Desktop / claude.ai**: `bash plugins/build_zip.sh`, rồi tải `dist/aitrends-3d-studio-<phiên bản>.zip` lên mục Plugins.
- **Cập nhật studio đã cài:** chép `kit/` mới đè lên, **giữ nguyên `channel/`**, `projects/`, `refs/`, `.venvs/`, `.cache/`.

## Nội dung
- `skills/make-3d-video/`: quy trình đầy đủ, tài liệu tham chiếu và bộ studio (`kit/`: renderer, engine 3D, TTS, công cụ, âm thanh, `channel/`, ví dụ).
- `skills/new-3d-video`, `3d-video-styles`, `render-3d-video`, `3d-video-sound`: các lệnh theo giai đoạn.

Không cần API key hay connector.
