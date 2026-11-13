# Báo cáo ngách 'what if' giả tưởng theo quốc gia

Ngày tạo: 2026-11-13. Dữ liệu: YouTube Data API, video đăng trong 365 ngày gần nhất, sắp theo lượt xem.

## Xếp hạng

| Hạng | Quốc gia | Điểm tổng (/5) | Nhu cầu | Cạnh tranh | Monetize | Số video pool | Video ≥100k (90 ngày) | Thiếu dữ liệu |
|---|---|---|---|---|---|---|---|---|
| 1 | BR | 4.14 | 4.0 | 4.33 | 2 | 190 | 70 | — |
| 2 | CA | 4.0 | 4.0 | 4.0 | n/a | 197 | 63 | monetize |
| 3 | AU | 4.0 | 4.0 | 4.0 | 5 | 197 | 64 | — |
| 4 | IN | 4.0 | 4.0 | 4.0 | 1 | 198 | 65 | — |
| 5 | US | 3.86 | 4.0 | 3.67 | 4 | 198 | 63 | — |
| 6 | GB | 3.86 | 4.0 | 3.67 | n/a | 198 | 61 | monetize |
| 7 | VN | 3.85 | 3.5 | 4.33 | n/a | 192 | 68 | monetize |
| 8 | JP | 3.85 | 3.5 | 4.33 | n/a | 194 | 54 | monetize |
| 9 | KR | 3.85 | 3.5 | 4.33 | n/a | 170 | 52 | monetize |
| 10 | ID | 3.85 | 3.5 | 4.33 | n/a | 200 | 64 | monetize |

## Cách tính

- **Nhu cầu (35%)**: số video ≥100k view trong 90 ngày và tỉ lệ tương tác (like + comment ÷ view).
- **Cạnh tranh (25%)**: tỉ trọng view của top 10 kênh trong pool, số kênh mới (<1 năm) có video ≥50k view, số video có tỉ lệ outlier ≥3x.
- **Monetize (20%)**: CPM tương đối theo nghiên cứu sơ bộ, chỉ có cho 4 nước. Nhóm này không tính vào điểm tổng để các nước so sánh được với nhau, chỉ hiển thị để tham khảo.
- **Bền vững (20%)**: chưa chấm tự động, cần đánh giá thủ công.
- **Điểm tổng** = trung bình có trọng số của Nhu cầu (35%) và Cạnh tranh (25%), tức là chuẩn hóa về 100% của hai nhóm này.

## Hạn chế

- Pool chỉ gồm top 50 video mỗi từ khóa, nên số video ≥100k chỉ là cận dưới.
- Tỉ trọng top 10 kênh tính trong pool, không phải toàn bộ thị trường.
- Kênh ẩn số subscriber sẽ không tính được tỉ lệ outlier.
- Ngưỡng điểm là kinh nghiệm chung, chưa được hiệu chỉnh với dữ liệu lịch sử.
- Tiêu chí outlier ≥3x bão hòa: phần lớn video đều đạt ngưỡng này, nên nhóm cạnh tranh gần như không phân biệt được các nước. Chênh lệch điểm giữa các nước chủ yếu đến từ tỉ trọng top 10 kênh và số kênh mới.
- Chênh lệch điểm giữa các nước khá nhỏ (vài phần mười), nên xem thứ hạng là gợi ý, không phải kết luận chắc chắn.
- CPM là ước tính từ nguồn không chính thức, các nguồn mâu thuẫn nhau.

## Cảnh báo về độ tin cậy

- **Các nước tiếng Anh gần như cùng một dữ liệu.** Mỹ, Anh, Canada, Úc và Ấn Độ chia sẻ 60–85% video trong pool. Tham số `regionCode` không tách được thị trường tốt, nên thứ hạng giữa 5 nước này gần như là nhiễu.
- **Chênh lệch điểm rất nhỏ.** Toàn bộ 10 nước nằm trong khoảng 3,85–4,14. Không có nước nào vượt trội rõ rệt.
- **Chỉ số tương tác là điểm phân biệt rõ nhất.** Brazil có tỉ lệ tương tác cao nhất (~2,2%), còn Việt Nam, Indonesia, Hàn Quốc thấp hơn (~1,0%).
- **Kết luận hợp lý nhất từ dữ liệu này:** chưa đủ căn cứ để chọn một quốc gia duy nhất. Nên thu thập thêm dữ liệu theo quốc gia (ví dụ tìm bằng ngôn ngữ bản địa và các từ khóa địa phương) rồi so sánh lại.

## Files đi kèm

- `bao_cao_what_if_quoc_gia.csv`: bảng tổng hợp theo quốc gia.
- `chi_tiet_video_what_if.csv`: toàn bộ video trong pool, để kiểm tra lại.
