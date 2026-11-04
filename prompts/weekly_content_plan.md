# Prompt: kế hoạch nội dung tuần tới

Dùng cho tác vụ Claude chạy mỗi chủ nhật, sau khi đã viết báo cáo đối thủ (`prompts/weekly_competitor_report.md`).
Mục tiêu: người làm video mở README là biết **tuần tới làm 5 video nào**, có sẵn tiêu đề, mô tả, tags và
prompt viết script, tất cả **dựa trên dữ liệu kênh đối thủ**.

## Đầu vào (nhánh `research/reports`, thư mục `reports/<tuần này>/`)

- `BAO_CAO_DOI_THU.md`: kết luận về đối thủ, chủ đề bung ở ≥ 2 kênh, tệp khán giả.
- `TIN_HIEU_NOI_DUNG.md` + `hot_videos.csv`: video thắng gần đây (≥ 3× trung vị của chính kênh), kèm tags
  và mô tả; khung tiêu đề video thắng so với phần còn lại; tags dùng nhiều; mô tả, độ dài, giờ đăng.
- `tags.csv`, `title_features.csv`, `SO_LIEU.md`, `competitors.csv`.
- Kế hoạch tuần trước trong `ke-hoach/` trên `main` (nếu có), để không lặp ý tưởng.
- `prompts/T4_script_prompt.md` trên `main`: khung prompt viết script đã có, dùng làm mẫu cấu trúc.

## Quy tắc

- **Mọi đề xuất phải dẫn bằng chứng có số và cỡ mẫu**: tên kênh, link video, view, × trung vị, số kênh.
  Không có số thì ghi "chưa đo". Không bịa số.
- **Học khung, không chép nội dung**: lấy khung tiêu đề/câu hứa đang thắng ở **≥ 2 kênh khác nhau**,
  nhưng chọn "điều được nhìn thấy / năng lực / cái giá" mà đối thủ **chưa làm** (kiểm `titles.csv`).
- Ưu tiên chủ đề **ít video tồn tại mà tỉ lệ trúng cao**. Tránh khung mà một kênh đang làm dày đặc
  (≥ 5 video trong 7 ngày) trừ khi có góc khác rõ ràng.
- **Một tệp khán giả cho một giọng**: không trộn câu hứa của hai tệp trong một video.
- Tiêu đề, mô tả, tags và prompt script viết **tiếng Anh** (khán giả Mỹ). Phần giải thích viết tiếng Việt có dấu.
- Tags: tổng ≤ 500 ký tự, bắt đầu bằng 2–3 tag sát chủ đề video, sau đó tag ngách dùng ở nhiều kênh
  (lấy từ `tags.csv`), cuối cùng là tên kênh của bạn nếu biết. Không nhồi tên kênh đối thủ.
- Mô tả: theo khuôn chung của video thắng (độ dài, hashtag, CTA). 2 dòng đầu phải nhắc lại câu hứa của tiêu đề.
- Nếu dữ liệu tags/mô tả còn thiếu, nói rõ và dùng khuôn từ video thắng có dữ liệu.

## Cấu trúc bắt buộc (file `ke-hoach/<tuần tới>.md` trên `main`)

```markdown
# Kế hoạch nội dung tuần <YYYY-Www> (<dd/mm>–<dd/mm>)

| | |
|---|---|
| Ngày lập | <ngày> |
| Dữ liệu dùng | <khoảng ngày snapshot>, <n> kênh theo dõi, <n> video dài đúng ngách, <n> video thắng gần đây |
| Phạm vi | <ô thị trường, quốc gia, ngôn ngữ> |
| Nguồn | link tới BAO_CAO_DOI_THU.md, TIN_HIEU_NOI_DUNG.md, SO_LIEU.md trên nhánh research/reports |

## Tóm tắt tuần tới
(bảng 5 dòng: # · ngày đăng gợi ý (giờ miền Đông Mỹ + giờ VN) · tiêu đề chốt · tuyến/tệp · bằng chứng chính · độ tin cậy cao/trung bình/thử nghiệm)

## Quy tắc chung rút từ đối thủ tuần này
(tiêu đề: khung nào thắng, độ dài; mô tả: khuôn; tags: bộ tag nền; độ dài video; giờ đăng; mỗi gạch có số)

## Video 1: <tiêu đề chốt>
### Vì sao làm video này      (bằng chứng: video đối thủ + số; khác biệt của mình)
### Tệp khán giả              (họ thầm nghĩ / họ cần được)
### Tiêu đề                   (3 phương án, đánh dấu phương án chốt, lý do; nhắc kiểm hộp gợi ý YouTube ở tab ẩn danh)
### Mô tả                     (bản nháp đầy đủ, trong khối ```text```)
### Tags                      (một dòng, phân tách bằng dấu phẩy, trong khối ```text```)
### Độ dài và giờ đăng
### Prompt viết script        (khối ```text``` hoàn chỉnh theo cấu trúc prompts/T4_script_prompt.md, đã điền sẵn
                               TITLE, RULE, COST, ... và 2–3 video đối thủ để tham khảo nhịp, không chép)
### Rủi ro

## Video 2 … Video 5         (cùng cấu trúc)

## Không nên làm tuần này     (khung đang bão hoà, chủ đề chỉ bung ở 1 kênh, tệp khác ngách; có số)
## Giới hạn
```

Sau khi viết xong:
1. Cập nhật `ke-hoach/README.md`: thêm dòng tuần mới lên đầu danh sách.
2. Thay đoạn giữa `<!-- KE_HOACH_MOI_NHAT:START -->` và `<!-- KE_HOACH_MOI_NHAT:END -->` ở đầu `README.md`
   bằng link tới file tuần mới.
