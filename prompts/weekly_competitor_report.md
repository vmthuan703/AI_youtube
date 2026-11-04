# Prompt: báo cáo đối thủ hằng tuần

Dùng cho tác vụ Claude chạy theo lịch mỗi chủ nhật. Đầu vào nằm ở nhánh `research/reports`:

- `reports/<tuần>/SO_LIEU.md`: số liệu do `market_watch.py weekly` tính sẵn (bảng chấm ô,
  đối thủ, video bung).
- `reports/<tuần>/titles.csv`: toàn bộ tiêu đề video dài của các kênh theo dõi, kèm view,
  `relative` (× trung vị của chính kênh) và cờ `burst`.
- `reports/<tuần>/competitors.csv`, `bung_videos.csv`, `scorecard.csv`.
- `data/<ngày>/discovery.csv`: video tìm được theo từng truy vấn (để phát hiện kênh mới).
- Báo cáo tuần trước (nếu có): để so sánh thay đổi.

Đầu ra: `reports/<tuần>/BAO_CAO_DOI_THU.md`, viết tiếng Việt có dấu.

## Quy tắc phương pháp (theo tài liệu "Cách dựng kênh tâm lý từ số 0")

- Mỗi lần chốt một điều phải trả lời được: **con số nào chứng minh, đo trên bao nhiêu mẫu?**
  Không trả lời được thì ghi "chưa đo".
- So hiệu suất **trong từng kênh** (× trung vị của chính kênh), không so view tuyệt đối giữa các kênh.
- Một chủ đề chỉ được coi là "tự mang lực kéo" khi **bung ở ≥ 2 kênh khác nhau**.
- Tuổi kênh là chỉ số dự báo mạnh nhất. View trung vị cao là dấu hiệu cửa đã đóng, không phải cửa mở.
- Tệp khán giả tách bằng **câu hứa trong tiêu đề** (đọc tay), không tách bằng hashtag, từ khoá
  hay định dạng.
- Không sáng tạo cái đã win: học theo **kênh mới mà thắng**, không học theo kênh to nhất.
- Không bịa số. Chỉ dùng số có trong file đầu vào hoặc tự đếm lại từ các file đó.

## Cấu trúc bắt buộc

```markdown
# Báo cáo đối thủ tuần <YYYY-Www>: <tên ô>

| | |
|---|---|
| Ngày nghiên cứu | <ngày viết báo cáo> |
| Khoảng dữ liệu | <ngày đầu> → <ngày cuối>, <n> snapshot |
| Phạm vi | <ô thị trường, quốc gia, ngôn ngữ>; <n> truy vấn; <n> kênh theo dõi; <n> video dài |
| Nguồn | YouTube Data API v3 qua market_watch.py; file số liệu: SO_LIEU.md |

## 1. Kết luận nhanh        (3–5 gạch, mỗi gạch có số và cỡ mẫu)
## 2. Bảng chấm ô           (chép từ SO_LIEU.md; tự chấm "kênh đúng ngách" bằng cách đọc
                             10 tiêu đề gần nhất của 5 kênh top, ghi tỉ lệ)
## 3. Đối thủ đáng chú ý    (5–8 kênh: tuổi, sub, tần suất đăng, trung vị view, video bung,
                             câu hứa chính, khung tiêu đề lặp lại)
## 4. Chủ đề bung ở ≥ 2 kênh khác nhau
                            (bảng: chủ đề · số kênh bung · tỉ lệ trúng · view trung vị · số video tồn tại)
## 5. Tệp khán giả          (gom theo câu hứa; mỗi tệp: "họ thầm nghĩ" / "họ cần được"; không trộn giọng)
## 6. Đề xuất tuyến nội dung (3–5 tuyến; mỗi tuyến: khung tiêu đề mẫu, bằng chứng số, rủi ro)
## 7. Việc cần làm tuần tới  (checklist có người làm/thời hạn nếu biết)
## 8. Thay đổi so với tuần trước (nếu có báo cáo tuần trước)
## 9. Giới hạn              (chép mục giới hạn của SO_LIEU.md, thêm giới hạn riêng của tuần)
```
