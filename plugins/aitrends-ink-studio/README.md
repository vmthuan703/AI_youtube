# aiTrends Ink Pastel Studio

Biến kịch bản thành video What If theo phong cách **Ink Pastel**:
- nhân vật đầu cầu, mặt decal, lông mày dày;
- viền mực quanh mọi vật;
- màu pastel, bóng ngả tím oải hương;
- con số HUD trên đầu mọi người, thẻ hồi tưởng sepia;
- nhịp 25 cắt/phút, cắt giữa câu.

Xuất MP4 4K/60, −14 LUFS. **Không** làm thumbnail, **không** giao file giọng đọc.

Gọi bằng: `/aitrends-ink-studio:make-ink-video <kịch bản hoặc ý tưởng>`. Phiên sau: `/make-ink-video tiếp <slug>`.

## Cách làm một video (3 phiên)
| Phiên | Việc | Kết thúc khi |
|---|---|---|
| A | Kiểm kịch bản (dịch sang EN nếu cần), giọng Chatterbox 180–190 từ/phút, kế hoạch shot → `shots.json`, đọc sổ luật | `shots.json` có mã luật, STATE.md |
| B | Vai (từ roster kênh), bối cảnh, shot (`auto()` cho phần lớn, viết tay cho hook, đòn đánh, cao trào) | `--qc` 0 đỏ, `rules_check` 0 thiếu |
| C | Âm thanh, bản xem trước 1080p, trang ghi chú đạo diễn, render 4K/60, mix | MP4 |

Điểm dừng chờ bạn duyệt:
- kịch bản EN;
- giọng mẫu;
- 3 ảnh sau bối cảnh đầu tiên;
- bản xem trước kèm ghi chú;
- file cuối.

## Có gì bên trong
- `skills/make-ink-video/SKILL.md`: quy trình.
- `references/`: phong cách, kế hoạch shot, sổ luật và ghi chú, giọng, API engine, render và QC, âm thanh, cài đặt.
- `kit/`: studio, cài thành `aitrends-ink-studio/`.
  - Engine chép từ 3D Studio 2.3.0, thêm style `inkpastel` (viền mực, 4 look, lông mày dày) và `engine/consequence.js` (`T.CQ.impact`, `beamSweep`, `scar`).
  - Thư viện `engine/ink/`:
    - `auto.js`: shot theo bảng;
    - `hud.js`: viên số trên đầu, thẻ sepia, mí mắt;
    - `sets.js`: phố đổ nát, hầm trú ẩn, cống, công viên, phòng điều khiển, cửa hầm ban đêm, bầu trời.
  - Công cụ:
    - `plan_to_shots.py`: kế hoạch thành `shots.json` theo số cắt/phút;
    - `rules_check.py`: sổ luật;
    - `review.mjs` + `review.html`: trang ghi chú đạo diễn;
    - `lead_silence.py`: thêm khoảng lặng đầu video.
  - `rules/`: sổ luật R01–R06.
  - `channel/`: hero áo phao chanh (scale 0.9, cùng cỡ người lớn), giọng kể am_fenrir.
  - `examples/ink-demo`: 6 shot mẫu, cũng là bài tự kiểm khi cài.

## Engine độc lập
Engine chép từ aiTrends 3D Studio **2.3.0**. Từ đây hai engine độc lập: sửa lỗi bên này không tự sang bên kia. Khi cần mang một bản sửa qua, so file với kit 3D 2.3.0.

## Mới trong 0.1.0 (2026-11-28)
- Bản đầu, rút từ video thử Trunks EP01: 228 shot, 25.0 cắt/phút, QC 0 đỏ, sổ luật 0 thiếu.
- Phase C (âm thanh, ghi chú, render 4K, mix) **chưa chạy trọn trên một video**: số đo thời gian render và token sẽ có ở 0.2.0.

Người bảo trì:
- Sau khi sửa kit, chạy `python3 plugins/refresh_kit_hashes.py ink`.
- Đóng gói zip: `bash plugins/build_zip.sh aitrends-ink-studio`.
- Bốn kiểu tóc của dự án thử được đổi sang tên chung trong kit: `dbTrunks` → `curtainBowl`, `dbGohan` → `spikyLock`, `dbA17` → `centerCurtain`, `dbA18` → `sweptBob`. Studio `D:/aitrends-ink-studio` vẫn dùng tên cũ: đổi tên trong `scenes/cast.js` của các dự án trước khi chạy `sync_kit.py`.
