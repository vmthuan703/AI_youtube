# Mức Sâu: quy trình viết và chấm script What If

> Chốt ngày 14/11/2026 sau lần chạy thử trên video "What IF You Could Shrink Anything?". Dùng khi người dùng nói "viết script mức sâu". Đọc [QUY_TAC_VIET_SCRIPT_KENH.md](QUY_TAC_VIET_SCRIPT_KENH.md) trước (mục 1b mở đầu 30 giây, mục 4 câu kêu gọi cuối cố định) và [SCRIPT_CHECKLIST.md](../../aitrends-3d-studio/SCRIPT_CHECKLIST.md) mục A.

## 0. Giới hạn cần nhớ
- Mọi điểm do tác nhân AI chấm, chưa có người thật và chưa có số liệu giữ chân thật để hiệu chỉnh. Các ngưỡng là quy ước của người dùng, không phải số đã kiểm chứng.
- Điểm chênh dưới khoảng 0,5 điểm tổng nằm trong nhiễu. Cùng một bản từng được 8,75 khi chấm riêng nhưng khoảng 7 khi chấm mù cạnh bản khác.
- Luôn đo số từ và vị trí mốc bằng script, không để người chấm ước lượng (một người từng đếm 2.350 từ cho bản 1.763 từ).
- Chi phí tham khảo (tác nhân phụ, chưa tính phiên chính): mức Sâu đủ khoảng 2,2 triệu token (30 tác nhân), chấm mù lại 4 bản khoảng 570 nghìn.
- Ghi token từng bước vào sổ để báo người dùng. Hỏi trước khi sửa file của người dùng theo quy tắc chung.

## 1. Quy trình (8 bước, 3 bản, 6 vai phản biện, tối đa 3 vòng)

| # | Bước | Làm gì |
|--|--|--|
| 0 | Học mẫu thắng | So 8 video nhiều view nhất với 8 thấp nhất của kênh nhỏ (đo bằng script: số từ tới luật, tới hệ quả đầu, số cụ thể và cược trong 25 từ đầu) |
| 1 | Sinh và chọn ý | 3 tác nhân song song viết 30 ý (cơ chế, cảm xúc, cú sốc giả tưởng); 1 tác nhân chọn 3 ý có hình dạng truyện và lõi cảm xúc khác nhau |
| 2-3 | Soi lỗ hổng luật | Luật sư tìm kẽ hở, đường tắt, lỗi số học; sửa thẻ ý (một luật, một giới hạn, một cái giá quan hệ, khung mốc từ) |
| 4 | Viết 3 bản độc lập | Mỗi người viết chỉ đọc 1 thẻ ý; 1.750 đến 1.850 từ lời đọc; đo bằng script |
| 5 | Hội đồng chấm mù | Xáo tên file, bỏ tiêu đề và danh sách vai, chỉ mở bảng ánh xạ sau khi có đủ báo cáo |
| 6 | Sửa tối đa 3 vòng | Một tác nhân sửa theo mọi lỗi, chấm lại; dừng khi qua mọi điều kiện ở mục 4 |
| 7 | Kiểm kỹ thuật | `script_check.py` (báo thiếu "Here's the rule" nếu bỏ cụm khung; luật phải được đếm tay), `nvidia-smi` trước khi thử đọc 90 giây bằng Chatterbox (cần khoảng 5,2 GB trên card 6 GB; đóng ứng dụng dùng GPU trước), `beats.py` |
| 8 | Ghi giữ chân | Sau 48 giờ đăng, ghi giữ chân vào sổ kịch bản để biết luật nào có bằng chứng |

## 2. Trọng số giữa 6 nhân tố (tổng 100)

| Nhân tố | Trọng số |
|--|--|
| Giữ chân | 25 |
| Logic | 15 |
| Kiểm chứng | 10 |
| Khán giả 13–17 | 15 |
| Rủi ro khuôn mẫu | 35 |
| Giọng đọc AI | 0 (chỉ kiểm tra kỹ thuật trước khi thu âm) |

Điểm tổng = tổng (điểm nhân tố nhân trọng số); rủi ro khuôn mẫu quy đổi bằng 10 trừ điểm.

## 3. Trọng số con và cách chấm từng nhân tố

**Giữ chân** (một người chấm mù, đo số từ bằng script)

| Tiêu chí | Trọng số |
|--|--|
| Tuyến cảm xúc | 35% |
| 30 giây đầu (khoảng 75 từ) | 15% |
| Vòng lặp mở mỗi phút | 23% |
| Cao trào | 18% |
| Kết | 9% |

**Logic** (đối chiếu từng cảnh với đoạn luật, liệt kê lỗi P0/P1/P2, tính lại số học bằng script)

| Tiêu chí | Trọng số |
|--|--|
| Luật nhất quán, không có "luật thứ hai" | 30% |
| Cao trào là hệ quả bắt buộc, không có đường tắt | 25% |
| Dòng thời gian và số học | 20% |
| Twist gài trước, không có sợi treo | 15% |
| Động cơ nhân vật | 10% |

Neo: 9–10 không có P0/P1; 8 không P0 và tối đa 2 P1; 7 không P0 và 3 đến 5 P1; 6 trở xuống nếu có P0 hoặc trên 5 P1.

**Kiểm chứng** (tra web có nguồn, tính lại bằng script)

| Tiêu chí | Trọng số |
|--|--|
| Số liệu và phép tính | 35% |
| An toàn, không có hành động trẻ có thể bắt chước | 35% |
| Khoa học, y khoa, tên riêng đúng | 20% |
| Không nói quá | 10% |

Neo: 9–10 không có mục sai và tối đa 3 mục sửa lời; 8 không sai và tối đa 5 mục sửa lời; 7 trở xuống nếu có mục sai hoặc trên 5 mục sửa lời.

**Khán giả 13–17** (người chấm nhập vai thiếu niên xem What If trên YouTube)

| Tiêu chí | Trọng số |
|--|--|
| Giả tưởng và gây sốc | 45% |
| Bấm xem và ở lại quá 30 giây | 25% |
| Đồng cảm, gần đời sống | 15% |
| Hài hước, giọng văn | 15% |

**Rủi ro khuôn mẫu** (thang ngược: 10 là giống khuôn, thấp là tốt; chấm 3 lần độc lập, lấy trung vị từng tiêu chí; người chấm phải đọc đủ cả bản và các script cũ, không chỉ phần đầu và cuối)

| Tiêu chí | Trọng số | Cách chấm |
|--|--|--|
| Động cơ cốt truyện và thứ tự cảnh | 35% | So danh sách cảnh với các script cũ |
| Cụm khung kênh | 30% | Đếm 5 cụm: "Here's the rule", "Your name is", "there's a cost", "N days from now", "is any of this real". 0 cụm = 1, 1 = 3, 2 = 5, 3 = 7, 4–5 = 9 |
| Kết cục và lõi cảm xúc | 25% | So với các script cũ |
| Trùng chữ (cụm 4 từ) | 10% | Đo bằng script. Dưới 1% = 1, 1–1,5% = 3, 1,5–2,5% = 5, 2,5–4% = 7, trên 4% = 9 |

Đã loại khỏi phép đo: cặp nhân vật Leo và Zoe, câu kêu gọi cuối cố định.

## 4. Điều kiện chặn (phải qua đủ)
1. Logic không có lỗi P0.
2. Kiểm chứng không có mục sai sự thật.
3. Rủi ro khuôn mẫu từ 3 trở xuống.
4. Mọi nhân tố từ 7 trở lên (rủi ro quy đổi 10 trừ điểm).
5. Giả tưởng và gây sốc từ 8 trở lên.
6. Điểm tổng từ 8 trở lên.

## 5. Kết quả lần thử đầu (Shrink, chấm mù ngày 14/11)

| Bản | Tổng | Rủi ro | Giả tưởng |
|--|--|--|--|
| Dung hòa (câu chuyện Conservation + tàu Marlow 90 m) | 7,80 | 2,75 | 8 |
| Sâu (Conservation) | 7,21 | 3,00 | 7 |
| Chuẩn (rồng, chiếc nhẫn của ông) | 7,13 | 4,55 | 9 |
| Cũ (đã đăng) | 5,61 | 8,20 | 6 |

Chưa bản nào qua điều kiện tổng từ 8. Dung hòa qua các điều kiện còn lại. Các file thử nghiệm nằm trong `scripts/experiment/` (draft, deep, compare, compare2), sổ token ở `scripts/experiment/deep/token_ledger.md`.

## 5b. Vị trí trong workflow video 3D (từ 14/11/2026)
- Mức Sâu là mặc định, chạy ở "Bước 0: cổng kịch bản" của `/new-3d-video` và `/make-3d-video`, trước khảo sát, `script_check` và mọi bước tạo giọng đọc.
- Nói "mức chuẩn" hoặc "bỏ qua mức" để đổi cho một video.
- Kịch bản người dùng mang tới chỉ được chấm và báo cáo, không viết lại.
- Bỏ vai "biên tập giọng TTS" khỏi hội đồng ở bước này (giọng đọc kiểm ở bước thu âm). Giữ quy tắc diễn viên 3D: nhân vật chính là bé trai, bạn thân là bé gái, chỉ dùng roster kênh.
- Không qua cổng sau 3 vòng: dừng, đưa bản tốt nhất kèm điểm để người dùng chọn hoặc tự sửa.

## 6. Ghi chú kỹ thuật cho bước thu âm
- Chatterbox cần từ điển phát âm cho tên riêng (ví dụ "Wadlow"); viết số đo mét và xăng-ti-mét thành chữ rõ để giọng đọc không nhầm.
- Ít hơn hoặc bằng 2 dòng quá 40 từ, mỗi giọng nhân vật phân biệt được bằng tai.
