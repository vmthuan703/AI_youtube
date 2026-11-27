# Sổ luật dựng phim Ink Pastel

Đọc **trước khi sản xuất** mỗi tập (Stage 4, trước khi viết `shots.json`), không đọc cả file khi dựng shot:
`python tools/rules_check.py --project projects/<slug> --plan` gắn mã luật vào từng shot (`"rules": ["R01"]`) và in đúng các luật
shot đó cần. Người dựng shot chỉ đọc các dòng của luật được gắn. Trước khi render, `rules_check.py` (không có `--plan`) báo shot
nào có luật mà code chưa gọi helper, và mọi ghi chú còn mở.

Nguồn: **U** = bạn ghi (trang ghi chú hoặc chat), **R** = phân tích video mẫu, **Q** = lỗi tìm thấy khi QC. Thêm luật mới:
ghi chú phạm vi "luật chung" trên trang ghi chú → được chuyển thành luật có mã, helper và từ khoá. Phải có bạn đồng ý mới thêm.

| Mã | Luật | Bắt buộc thấy trên hình | Helper | Nguồn |
|---|---|---|---|---|
| R01 | **Mọi đòn đánh để lại hậu quả.** Tia, đòn năng lượng, cú đấm, vụ nổ chạm vào gì thì vật đó vỡ **ngay trong shot đó** | chớp sáng → lỗ thủng/mảng vỡ bung ra → gạch rơi xuống đất → bụi đọng 2–3 s → máy quay rung | `T.CQ.impact`, `T.CQ.beamSweep` (tia quét qua nhiều toà nhà) | U 2026-11-26: "Android 18 quét tia, các toà nhà bị ảnh hưởng phải vỡ, nổ" |
| R02 | **Hậu quả còn lại.** Shot sau cùng địa điểm, sau đòn đánh, vẫn thấy dấu | lỗ thủng, khói mỏng, gạch vụn dưới chân tường | `T.CQ.scar` | U (đi kèm R01) |
| R03 | **Cỡ nhân vật.** Hero cùng cỡ người lớn khác: chiều cao tính cả tóc lệch ≤ 5%, trẻ con ~0.74 | đứng cạnh nhau không ai "to bất thường" | `channel/cast.js` HERO `scale` (0.9); kiểm bằng một shot xếp hàng: các vai đứng cạnh nhau, in `ch.headWorld().y` | U 2026-11-26 |
| R04 | **Con số HUD luôn trong khung.** Shot có người mang đồng hồ: khung hình chừa chỗ trên đầu | viên thuốc số không bị cắt mép | `auto()` tự canh khung; shot viết tay dùng `clockAt` + `headPill` (`engine/ink/hud.js`) + nhìn sheet | Q demo |
| R05 | **Không nhép miệng theo lời dẫn.** Nhân vật chỉ mở miệng khi chính họ nói | cảnh lời dẫn: chớp mắt, đổi lông mày, cử chỉ nhỏ | `face({ gt })` (`auto()` làm sẵn): miệng chỉ mở cho vai có tên người nói của câu | R |
| R06 | **Bay phải đọc được là bay.** Nhân vật lơ lửng không trông như đang đứng | chân rời đất có khoảng hở, bóng đổ nhỏ xa dưới chân, tóc/áo bay, nhấp nhô | (đặt máy thấp thấy khoảng hở) | Q demo (s10: nhân vật bay) |
