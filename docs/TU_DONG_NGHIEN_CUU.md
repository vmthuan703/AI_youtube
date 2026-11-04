# Tự động nghiên cứu thị trường YouTube

## Luồng chạy

| Khi nào | Ai chạy | Làm gì | Ghi vào |
|---|---|---|---|
| Hằng ngày 08:17 UTC (15:17 giờ VN) | GitHub Actions (`.github/workflows/market-daily.yml`) | `market_watch.py daily`: chạy truy vấn tìm kiếm, thêm kênh mới thắng vào danh sách theo dõi, chụp snapshot mọi kênh đang theo dõi | nhánh `research/reports`, thư mục `data/YYYY-MM-DD/` |
| Chủ nhật, cùng lượt trên | GitHub Actions | `market_watch.py weekly`: bảng chấm ô, đối thủ, video bung, danh sách tiêu đề, tín hiệu nội dung (video thắng gần đây, khung tiêu đề, tags, mô tả, độ dài, giờ đăng) | `reports/YYYY-Www/SO_LIEU.md`, `TIN_HIEU_NOI_DUNG.md` + CSV |
| Hằng ngày, ngay sau lượt thu thập | GitHub Actions | `market_watch.py readme`: chép `TOM_TAT.md` mới nhất vào khối `DAILY` và phần "Kết luận nhanh" của báo cáo tuần mới nhất vào khối `WEEKLY` của `README.md`, rồi commit thẳng vào `main` | `README.md` trên `main` |
| Chủ nhật 19:47 giờ VN | Tác vụ Claude theo lịch | Viết báo cáo đối thủ theo `prompts/weekly_competitor_report.md`, rồi kế hoạch 5 video tuần tới theo `prompts/weekly_content_plan.md` | `reports/YYYY-Www/BAO_CAO_DOI_THU.md` (research/reports) và `ke-hoach/YYYY-Www.md` + link đầu `README.md` (main) |

Quota YouTube hồi lúc 00:00 giờ Thái Bình Dương: 08:00 UTC vào mùa đông, 07:00 UTC vào mùa hè. Lịch chạy
lúc 08:17 UTC nên luôn sau giờ hồi quanh năm.

**Lưu ý README:** bước này commit thẳng vào `main` bằng `GITHUB_TOKEN`, nên mỗi ngày có thêm một commit tự động. Nếu `main` bật bảo vệ nhánh (bắt buộc PR), bước này sẽ bị từ chối: cho phép `github-actions[bot]` đẩy vào `main`, hoặc bỏ bước này.

Báo cáo tuần của Claude (Chủ nhật 19:47 giờ VN) viết sau lượt chạy 15:17 nên lên README ở lượt chạy hôm sau (thứ Hai).

## Cài đặt một lần

1. Merge nhánh code vào `main`. GitHub chỉ chạy `schedule` của workflow nằm trên nhánh mặc định.
2. Thêm secret `YOUTUBE_API_KEY` ở Settings → Secrets and variables → Actions.
3. Vào Actions → "Thu thập thị trường hằng ngày" → Run workflow để chạy thử.

## Sửa phạm vi nghiên cứu

Sửa `config/markets.json`:

- `markets[].queries`: truy vấn tìm kiếm của ô. Mỗi truy vấn tốn 100 đơn vị quota. Theo tài liệu
  phương pháp, mỗi ô cần ≥ 8 truy vấn khác nhau.
- `markets[].region` / `language`: quốc gia và ngôn ngữ của ô.
- `markets[].title_regex`: bộ lọc tiêu đề của ô. Chỉ video có tiêu đề khớp mới được tính vào bảng chấm và mới
  được tự thêm kênh vào danh sách theo dõi.
- `markets[].exclude_channels`: tên hoặc ID kênh khớp bộ lọc chữ nhưng không làm ngách (vlog thử thách, hài kịch…),
  bị loại khỏi bảng chấm. Thêm vào đây khi đọc bảng "5 kênh có video to nhất" trong `SO_LIEU.md` thấy kênh sai.
- `discovery.min_niche_share`: kênh do discovery thêm vào mà có ít hơn tỉ lệ này video dài khớp bộ lọc thì
  `daily` tự bỏ khỏi danh sách theo dõi (kênh mồi không bao giờ bị bỏ). Dọn tay: `python market_watch.py prune --root research`.
- `quota_budget`: ngân sách quota mỗi lần chạy (mặc định 6000/10.000). Phần còn lại để bạn dùng tay.
- `discovery.new_channel_days`, `track_min_views`: điều kiện để tự thêm kênh vào danh sách theo dõi.
- `tracking.max_channels`: số kênh theo dõi tối đa.

Ước tính quota mỗi ngày với cấu hình mặc định: 20 truy vấn × ~102 = ~2.040 đơn vị, cộng ~2–6 đơn vị mỗi kênh
theo dõi.

## Chạy tay

```bash
export YOUTUBE_API_KEY=khoá_của_bạn
git worktree add research origin/research/reports
python market_watch.py daily --root research
python market_watch.py weekly --root research            # tuần chứa hôm nay
python market_watch.py weekly --root research --end 2026-11-08
python market_watch.py index --root research             # cập nhật reports/INDEX.md
```

## Phương pháp

Lấy theo tài liệu "Cách dựng kênh tâm lý từ số 0":

- **Bảng chấm ô:** có kênh ≤ 3 tháng đã có video ≥ 100k (quyết định); tuổi trung vị của 5 kênh có video to
  nhất ≤ 12 tháng; view/sub trung vị ≥ 10×; ≥ 8 video ≥ 100k; view trung vị 150k–600k (> 1,5M là cảnh báo).
  Tiêu chí "kênh đúng ngách ≥ 80%" do Claude chấm bằng cách đọc tiêu đề.
- **Video bung:** ≥ 10× trung vị video dài của **chính kênh đó**. Kênh có < 3 video dài thì không tính.
- **Chủ đề tự mang lực kéo:** bung ở ≥ 2 kênh khác nhau.
- **Tuổi kênh:** lấy theo video cũ nhất khi đã đọc đủ danh sách upload, nếu không thì lấy ngày tạo kênh.
