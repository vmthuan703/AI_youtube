# Prompt: kế hoạch nội dung 3 ngày tới

Dùng cho tác vụ Claude chạy theo lịch, cứ 3 ngày một lần, sau khi đã viết báo cáo đối thủ
(`prompts/weekly_competitor_report.md`). Mục tiêu: mở README là biết **3 ngày tới làm 6 video nào**
(2 video/ngày, mỗi tuyến 1 video), có sẵn tiêu đề, mô tả, tags và prompt viết script, tất cả **dựa trên dữ liệu
kênh đối thủ**. Mẫu đã duyệt: `ke-hoach/2026-11-05.md`. Viết đúng cấu trúc của file đó.

## Tuyến

- Dùng 2 tuyến đã duyệt ghi trong `ke-hoach/README.md`. Hiện tại là:
  - **A. Cơ thể mạnh lên gấp X lần**: giác quan/bộ phận ×100, và kích thước.
  - **B. Nhìn thấu người khác**: "What If You Could See Everyone's ___?".
- Mỗi lần lập kế hoạch, tính lại số đo của 2 tuyến trên dữ liệu mới: số video, số kênh có video bung, số kênh có
  video ≥ 100k, tỉ lệ thắng (≥ 3× trung vị của chính kênh), tiêu đề đã có trên thị trường. So với mặt bằng chung.
- **Không tự đổi tuyến.** Nếu một tuyến tụt dưới mặt bằng chung, hoặc một tuyến khác vượt lên rõ (nhiều kênh bung hơn),
  ghi đề xuất đổi tuyến vào mục "Đề xuất cho bạn duyệt" ở cuối kế hoạch, kèm số liệu, và vẫn lập kế hoạch bằng 2 tuyến cũ.

## Đầu vào (nhánh `research/reports`, thư mục `reports/<ngày lập>/`)

- `BAO_CAO_DOI_THU.md`, `TIN_HIEU_NOI_DUNG.md`, `hot_videos.csv` (kèm tags và mô tả), `tags.csv`,
  `title_features.csv`, `titles.csv`, `SO_LIEU.md`.
- `data/*/discovery.csv` và `data/*/videos.csv`: toàn bộ tiêu đề thị trường để **kiểm trùng góc**.
- Các kế hoạch cũ trong `ke-hoach/` trên `main`: không lặp góc đã dùng.
- `prompts/T4_script_prompt.md`: khung prompt viết script.

## Quy tắc

- Mọi đề xuất phải có bằng chứng: link video đối thủ, view, × trung vị, số kênh. Không có số thì ghi "chưa đo". Không bịa số.
- Mỗi tiêu đề chốt phải là **góc chưa có trên thị trường**: kiểm bằng regex trên toàn bộ tiêu đề, và ghi số tiêu đề trùng tìm được.
- Áp dụng quy tắc tiêu đề, mô tả, tags, độ dài và giờ đăng rút từ `TIN_HIEU_NOI_DUNG.md` của lần này. Ghi rõ số đo.
- Giờ đăng: tuyến A ở khung giờ thắng nhiều nhất, tuyến B ở khung giờ thắng nhiều thứ hai (giờ miền Đông Mỹ, kèm giờ VN).
- Tiêu đề, mô tả, tags và prompt script viết tiếng Anh. Phần giải thích viết tiếng Việt có dấu.
- Số liệu khoa học trong prompt viết script để dạng "research and verify … Cite sources".
- Nhắc đánh giá video sau 14 ngày. Nếu `ke-hoach/` có kế hoạch cũ đủ 14 ngày tuổi, thêm mục "Kết quả kế hoạch cũ":
  tìm video của kênh bạn trong snapshot nếu có, không có thì ghi "chưa có dữ liệu kênh của bạn".

## Sau khi viết xong

1. Lưu file `ke-hoach/<YYYY-MM-DD của ngày đầu tiên>.md`.
2. Thêm dòng mới lên đầu danh sách giữa `<!-- DANH_SACH:START -->` và `<!-- DANH_SACH:END -->` trong `ke-hoach/README.md`.
3. Thay đoạn giữa `<!-- KE_HOACH_MOI_NHAT:START -->` và `<!-- KE_HOACH_MOI_NHAT:END -->` ở đầu `README.md`
   bằng link tới file mới, cùng dạng với dòng hiện tại.
