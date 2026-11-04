# Đề xuất nhận diện kênh cho video T4 #2

Nguồn: YouTube Data API v3 `channels.list` (snippet, brandingSettings, statistics), lấy 2026-11-04 cho 25 kênh trong
`data/channels_2026-11-04.csv`. Các cột mới có tiền tố `API:` đã được ghi vào cuối bảng đó.
Kênh "thắng" = top view/video: ConChaser (341.018), Jeremy Bearimy (201.727), IFOLOGY (130.079), OTHERWISE (107.430),
Manifesting (92.716). Lưu ý: view/video bị lệch vì kênh còn rất mới (hầu hết dưới 30 ngày tuổi).

## 1. Tên kênh
Bằng chứng: 11/25 tên chứa "If"; các kênh thắng đều ngắn (1-2 từ): ConChaser, OTHERWISE, IFOLOGY, Manifesting, Jeremy Bearimy.

| Ưu tiên | Tên | Lý do | Kiểm tra trùng (API, 2026-11-04) |
|---|---|---|---|
| 1 | **IfAhead** | Một từ ghép, có gốc "If" như nhóm thắng, gợi "nhìn trước tương lai" đúng chủ đề T4 | Handle `@IfAhead` chưa ai dùng; tìm theo tên không có kênh trùng |
| 2 | **Tomorif** | Một từ, gợi "tomorrow + if" khớp T4 #2 | Handle `@Tomorif` chưa dùng; không có kênh trùng |
| Loại | If Tomorrow, Ifmorrow, ForeIf | Đã có kênh trùng hoặc handle đã bị dùng | |

## 2. Tags kênh (brandingSettings.keywords)
11/25 kênh đặt tags; trong top-5 thắng chỉ Manifesting có. Vì vậy tags chỉ học được từ 11 kênh, không phải từ cả nhóm thắng.
Tags xuất hiện ở ≥2 kênh (số kênh): what if (7), animated stories (5), what if animation (5), what if scenarios (5),
what would happen if (4), science fiction (3), hypothetical (3), stickman animation (3), superpowers (3), animated story (3),
science explained (3), animated what if (2), what if you could (2), superhuman abilities (2), animated short film (2).

Bộ tags đề xuất:
- **Học từ kênh thắng:** what if, what if animation, what if scenarios, what would happen if, what if you could,
  animated stories, animated what if, hypothetical, stickman animation, animated short film, science fiction
- **Riêng T4 #2 (do mình thêm, chưa có bằng chứng từ kênh khác):** tomorrow's notifications, see the future, phone from the future,
  control of time, time and fate

## 3. Ảnh kênh và ảnh nền: chưa làm được
- API trả đủ URL avatar và banner (cột `API: URL avatar`, `API: URL banner`; 24/25 kênh có banner, Super Logic không có).
- Host ảnh `yt3.ggpht.com` bị chặn bởi network policy của session, nên chưa tải và xem được ảnh. Mình không đoán nội dung ảnh.
- Cách mở: Network access của environment cho phép `yt3.ggpht.com` (và `i.ytimg.com` nếu cần thumbnail), rồi chạy lại
  `python tools/channel_branding.py`. Script sẽ lưu ảnh vào `reports/2026-11-04/branding/`.
