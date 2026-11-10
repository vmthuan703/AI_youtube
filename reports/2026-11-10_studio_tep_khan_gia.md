# Báo cáo: đọc YouTube Studio và cách đề xuất đúng tệp khán giả What If

| | |
|---|---|
| Ngày lập | 2026-11-10 |
| Nguồn 1 | YouTube Studio kênh IfAhead, 28 ngày (13/10–9/11/2026), đọc trực tiếp ngày 10/11 |
| Nguồn 2 | Snapshot thị trường 10/11 (939 video dài, 58 kênh có mốc so sánh) ghép với `data/labels.csv` (375 video đã gắn nhãn động cơ xem) |
| Câu hỏi | Làm sao để đề xuất ý tưởng đúng tệp khán giả What If? |

## 1. Kết luận ngắn

1. **Kênh chưa có dữ liệu nhân khẩu học.** Studio báo "Không đủ dữ liệu" cho độ tuổi, giới tính, giờ xem, kênh khán giả xem. Vì vậy "tệp khán giả" lúc này chỉ xác định được theo **động cơ xem** (người ta bấm vì muốn gì), không theo tuổi hay giới tính.
2. **Mẫu của kênh còn rất nhỏ**: 306 lượt xem, 1 người đăng ký, 6 video, video cũ nhất mới 6 ngày. Số liệu dưới đây chỉ dùng để tạo giả thuyết, chưa đủ để kết luận.
3. **Tín hiệu đáng tin nhất từ kênh**: video "See Who Would Date You" (động cơ T7, được yêu / được chú ý) có tỉ lệ nhấp cao nhất trong các video đủ lượt hiển thị (3,0%) và giữ người xem tốt hơn hai video nhận nhiều lượt xem nhất.
4. **Tín hiệu cảnh báo**: hai video nhiều view nhất (Shrink, Body Healed) chỉ giữ 9% thời lượng. Người bấm vào chưa chắc là tệp mình muốn giữ.
5. **Cách đề xuất đúng tệp** (mục 5): chọn theo động cơ xem, lọc bằng dữ liệu thị trường, kiểm tra YouTube trực tiếp, rồi đo bằng 4 chỉ số sau 48 giờ để chuyển trọng số giữa các tệp.

## 2. Số liệu kênh trong Studio

**Tổng quan 28 ngày**

| Chỉ số | Giá trị |
|---|---|
| Lượt xem | 306 |
| Giờ xem | 6,0 |
| Người đăng ký | +1 (tổng 1) |
| Lượt hiển thị hình thu nhỏ | 8.080 |
| Tỉ lệ nhấp (CTR) | 2,5% |
| Thời lượng xem trung bình | 1:17 |
| Khán giả hằng tháng | 195 |
| Người xem mới / thông thường / thường xuyên | 99,5% / 0,5% / < 0,1% |

**Nguồn người xem**: video đề xuất 82,7%, tính năng duyệt xem 12,1%, trực tiếp hoặc không xác định 2,6%, trang kênh 1,0%, **tìm kiếm YouTube 1,0%**, khác 0,7%.

**Khu vực**: Hoa Kỳ 40,9%, Canada 3,6%. Hơn một nửa lượt xem đến từ nơi khác. Mình chưa mở danh sách đầy đủ các nước. **Thiết bị (theo giờ xem)**: máy tính bảng 40,3%, điện thoại 30,6%, TV 18,9%, máy tính 10,1%. Mẫu nhỏ nên tỉ lệ máy tính bảng cao chưa có ý nghĩa.

**Theo từng video** (28 ngày)

| Video | Ngày đăng | Hiển thị | CTR | Lượt xem | Xem trung bình | % thời lượng | Động cơ (nhãn tạm) |
|---|---|---|---|---|---|---|---|
| Shrink Anything You Touch | 6/11 | 2.425 | 2,8% | 108 | 0:55 | 9,5% | T1P / T9 |
| Your Body Healed Itself Every Night | 7/11 | 3.530 | 1,9% | 96 | 0:50 | 8,8% | T1P |
| See Who Would Date You | 9/11 | 1.468 | 3,0% | 58 | 1:44 | 16,7% | T7 |
| Memory Was 100x Better (bản 10:23) | 6/11 | 448 | 2,2% | 27 | 3:19 | 31,9% | T1G |
| Memory Was 100x Better (bản 9:41) | 5/11 | 125 | 5,6% | 10 | 1:43 | 17,9% | T1G |
| Your Phone Showed Tomorrow | 4/11 | 78 | 0% | 3 | 2:01 | 20,6% | T4 |

Nhãn động cơ ở cột cuối do mình gán theo tiêu đề, chưa kiểm lại bằng nội dung video.

**Nhận xét**
- YouTube phân phối video của kênh chủ yếu cạnh các video của kênh khác (đề xuất 82,7%). Với kênh mới, **tệp khán giả do thuật toán gom theo tiêu đề, hình thu nhỏ và nhịp xem 30 giây đầu**, không do mình khai báo.
- Shrink và Body Healed được đẩy nhiều lượt hiển thị (2.425 và 3.530), nhưng người xem rời đi sau chưa đầy 1 phút. Có hai cách đọc: lời hứa ở tiêu đề và hình thu nhỏ chưa khớp với 30 giây đầu, hoặc người bấm vào là người xem lướt, không phải tệp What If thật. Cần xem biểu đồ giữ chân khán giả từng video để chọn một trong hai (mình chưa mở biểu đồ này).
- "Date You" ít lượt hiển thị hơn nhưng CTR cao nhất và giữ chân gấp khoảng 1,8 lần hai video trên. Đây là tín hiệu thật nhưng sớm: 58 lượt xem, đăng mới 1 ngày.
- Memory 10:23 giữ 31,9% nhưng chỉ có 448 lượt hiển thị. Tệp T1G (thông minh vượt trội) giữ người tốt nhưng bị phân phối ít. Không đủ dữ liệu để biết vì sao.
- 99,5% là người xem mới và chỉ 1% từ tìm kiếm. Kênh chưa có tệp quay lại, nên chưa thể đánh giá "khán giả của kênh". Chỉ đánh giá được "khán giả của từng video".

### 2b. Biểu đồ giữ chân của 2 video xem nhiều nhất (đọc thêm ngày 10/11)

| | Shrink (9:41) | Body Healed (9:41) |
|---|---|---|
| Lượt xem có chủ đích | 95 / 108 | 95 / 96 |
| Xem trung bình | 0:55 (9,5%) | 0:50 (8,8%) |
| Còn xem ở giây 0:30 | 45% | không đọc được số, đường cong giảm mạnh ở những giây đầu rồi phẳng ở khoảng 10% |
| Nguồn | 95,4% đề xuất của YouTube | chưa đọc |

- Gần như mọi người bấm vào đều ở lại qua vài giây đầu, nên tiêu đề và hình thu nhỏ **không** bị lệch hẳn. Mất người xảy ra **trong 30 giây đầu**, rồi đường cong phẳng đến hết video.
- Kết luận cập nhật: sửa **đoạn mở đầu** (30 giây đầu) trước. Chưa cần bỏ hai ý này.
- Video mẫu nhỏ (100 lượt xem), 1 ngày đăng, chỉ đọc 2 video. Mình chưa xem 4 video còn lại.

### 2c. Đọc nốt 4 video còn lại (đọc ngày 11/11) và đối chiếu lời mở đầu

| Video | Hiển thị | Biểu đồ giữ chân | Ghi chú |
|---|---|---|---|
| See Who Would Date You | 1.468 | Chưa có (YouTube xử lý đến 2 ngày) | Chưa kết luận được |
| Memory 10:25 (kịch bản v2) | 448 | Xuống khoảng 80% rất nhanh, giữ 60–80% suốt phần đầu, giảm dần, trung bình 31,9% | Chỉ khoảng 15 lượt xem có chủ đích, đường cong răng cưa |
| Memory 9:41 (kịch bản v1) | 125 | Rớt còn khoảng 30% trong vài giây đầu rồi phẳng, trung bình 17,9% | 10 lượt xem có chủ đích |
| Phone Showed Tomorrow | 78 | Không đủ dữ liệu | 3 lượt xem có chủ đích |

Ghép bản kịch bản với video theo độ dài và số từ (v2: 1.688 từ khớp 10:25; v1: 1.393 từ khớp 9:41). Đây là suy luận của mình, chưa xác nhận.

**Cấu trúc 90 giây đầu của các kịch bản** (số từ tính từ đầu; khoảng 160 từ/phút nên giây 30 ≈ từ thứ 80)

| Kịch bản | "Your name is…" | Cảnh báo tương lai ("six days from now…") | Luật ("Here's the rule") |
|---|---|---|---|
| Shrink | từ 42 | từ 48 | từ 110 (≈ giây 41) |
| Body Healed | từ 41 | từ 49 | từ 109 |
| Date You | từ 40 | từ 46 | từ 107 |
| Memory v2 | từ 45 | từ 51 | từ 122 |
| Memory v1 | từ 44 | không có | từ 60 |

**Điều rút ra, kèm giới hạn**
- Ba video của kịch bản mới có cùng khung: biểu diễn năng lực (khoảng 40 từ), rồi một đoạn "tên, tuổi, thảm họa sau N ngày" (khoảng 45 từ), rồi mới đến luật ở giây 40 trở đi. Ở giây 30 người xem đang nghe đoạn giới thiệu nhân vật, chưa có hình ảnh hay luật mới.
- Bằng chứng **không thống nhất**: Memory v2 có cùng khung đó nhưng giữ chân tốt nhất (31,9%), còn Memory v1 (luật ở từ 60, không có cảnh báo tương lai) lại rớt nhanh. Hình thu nhỏ, số hiển thị (448 so với 125) và số lượt xem đều khác nhau, và chỉ 10–15 lượt xem.
- Một giả thuyết khác: **lưu lượng rộng thì giữ chân thấp**. Hai video nhận 2.400–3.500 lượt hiển thị giữ khoảng 9%, video nhận 448 lượt hiển thị giữ 32%. Nghĩa là lỗi có thể nằm ở việc YouTube đẩy video tới người xem chưa đúng tệp, không chỉ ở lời mở đầu.
- Vì vậy chưa thể kết luận lời mở đầu là nguyên nhân. Cần kiểm chứng bằng chính 9 video mới.

## 3. Tệp khán giả What If trên thị trường (theo động cơ xem)

Cách đo: mỗi video dài so với **trung vị video dài của chính kênh nó**. "Thắng" là ≥ 3× trung vị. Nguồn: 375 video đã gắn nhãn trong `data/labels.csv`, lượt xem lấy từ snapshot 10/11.

| Mã | Tệp (người xem bấm vì...) | Video | Kênh | Thắng ≥3× | Video ≥100k | Trung vị lượt xem |
|---|---|---|---|---|---|---|
| T1P | Muốn một siêu năng lực | 118 | 20 | 35% | 26 | 14.956 |
| T9 | Muốn cơ thể bị đẩy tới giới hạn | 38 | 13 | 39% | 3 | 4.764 |
| T7 | Muốn được yêu, được chú ý | 35 | 11 | 34% | 11 | 22.689 |
| T6 | Muốn thử sống sót trong thế giới đảo lộn | 32 | 14 | 28% | 4 | 4.446 |
| T8 | Tò mò thế giới bất khả thi | 31 | 11 | 26% | 4 | 3.999 |
| T4 | Muốn làm chủ thời gian và số phận | 30 | 17 | **43%** | 8 | 29.581 |
| T2 | Muốn nhìn thấu điều người khác giấu | 27 | 13 | 41% | 11 | **60.057** |
| T1G | Muốn thông minh vượt trội | 18 | 5 | 33% | 6 | 26.085 |
| T11 | Muốn bước vào một thế giới hoặc vai trò quen thuộc | 13 | 4 | **0%** | 0 | 15.184 |
| T10 | Muốn giàu lên tức thì | 12 | 10 | 33% | 2 | 6.374 |

**Đọc bảng**
- **Tệp lớn và ổn định**: T1P (nhiều video nhất, 26 video ≥100k). **Tệp thắng nhiều nhất trên mỗi video**: T4, T2, T9. **Tệp có view trung vị cao nhất**: T2 (60k), T4 (30k), T1G (26k), T7 (23k).
- **Tệp nên tránh**: T11 (0/13 thắng). Rủi ro: tuyến C "Luật game ngoài đời" có thể bị gom nhầm vào T11. Nếu video C giống "đặt mình vào thế giới game", nó sẽ rơi vào tệp yếu nhất. Nếu nó giống "có siêu năng lực kèm luật" (kiểu Jeremy Bearimy), nó thuộc T1P. Cần gắn nhãn tuyến C trước khi đo.
- Tệp T9 có video thắng rất lớn (878k) nhưng chỉ 3 video ≥100k, nên kết quả phụ thuộc vào vài video đột biến.
- Hạn chế: chỉ 375/939 video có nhãn, và nhãn do người/AI đọc từng video nên có sai số. Tỉ lệ thắng của từng ô là ước lượng, không phải xác suất.

## 4. Vì sao đề xuất ý tưởng hay trượt tệp

Từ hai nguồn trên, những nguyên nhân thực tế:

1. **Chọn theo chủ đề, không theo động cơ.** "Shrink" và "Body Healed" khác chủ đề nhưng cùng tệp T1P. Ý nghĩ "đa dạng" của kế hoạch thực ra chỉ chạm 2–3 tệp.
2. **Tiêu đề hứa một tệp, 30 giây đầu phục vụ tệp khác.** Hai video nhiều view nhất giữ chân dưới 10%.
3. **Mẫu của kênh quá nhỏ để tự xác định tệp.** Một video 58 lượt xem chưa đủ để kết luận. Cần dùng dữ liệu thị trường làm nền, dữ liệu kênh để hiệu chỉnh.
4. **Ý đã có người làm.** Kết quả tìm YouTube ngày 10/11 cho thấy 8/9 tiêu đề đề xuất lần đầu đã tồn tại. Kênh mới không thắng được một ý trùng với các kênh có sẵn tệp.
5. **Tín hiệu tìm kiếm gần như bằng 0 (1%).** Kênh sống bằng đề xuất, nên tiêu đề và hình thu nhỏ phải khớp với các video "hàng xóm" mà YouTube gắn, không dựa vào từ khoá.

## 5. Quy trình đề xuất đúng tệp (áp dụng cho mỗi lần lập kế hoạch)

**Bước 1. Gắn tệp trước khi nghĩ tiêu đề.** Với mỗi ý, viết một câu: "Người xem bấm vì họ muốn ___" và chọn mã T1–T11. Không viết được thì bỏ ý.

**Bước 2. Lọc theo bảng thị trường.** Ưu tiên tệp có đủ: ≥ 10 kênh, thắng ≥ 35%, ≥ 8 video ≥100k. Hiện tại đạt: T1P, T4, T2, T7. Ghi chú: T9 và T1G đạt tỉ lệ nhưng thiếu số kênh hoặc video ≥100k. Loại tệp có thắng 0% (T11) cho đến khi có bằng chứng mới.

**Bước 3. Chia việc theo tệp, không theo chủ đề.** Mỗi đợt 9 video chia khoảng 3 tệp × 3 ý, mỗi ý khác cơ chế. Hiện kế hoạch 11–13/11 có A (T1P/T9), B (T2/T7), C (cần gắn nhãn, mục 3).

**Bước 4. Kiểm tra YouTube trực tiếp** (đã có trong `prompts/content_plan_3_ngay.md`): tìm tiêu đề và 2 từ khoá; có video dài cùng ý thì bỏ.

**Bước 5. Viết 30 giây đầu theo đúng lời hứa của tiêu đề.** Mở bằng đúng cảnh tiêu đề nói tới, nói hệ quả đầu tiên trong 10–15 giây. Đây là sửa lỗi chính của Shrink và Body Healed (giữ chân 9%).

**Bước 6. Đo 4 chỉ số sau 48 giờ cho mỗi video**, ghi theo mã tệp:

| Chỉ số | Cách lấy trong Studio | Dùng để |
|---|---|---|
| Lượt hiển thị | Nội dung → Tiếp cận | Cho biết YouTube có thử video không |
| CTR | Nội dung → Tiếp cận | Hình thu nhỏ và tiêu đề có hợp tệp không |
| % thời lượng xem trung bình | Nội dung → Mức độ tương tác | 30 giây đầu có hợp tệp không |
| Tỉ lệ giữ chân ở 30 giây | Biểu đồ giữ chân khán giả | Phân biệt "bấm nhầm" với "bấm đúng rồi chán" |

**Bước 7. Chuyển trọng số sau mỗi 9 video** (đợt 11–13/11 đo đến khoảng 25/11):
- Tệp có ít nhất 2 video CTR ≥ trung bình kênh và giữ chân ≥ 15%: tăng số video.
- Tệp có CTR thấp: đổi tiêu đề và hình thu nhỏ trước, đừng bỏ tệp ngay.
- Tệp có CTR ổn nhưng giữ chân < 10%: sửa 30 giây đầu, đừng bỏ ý.
- Tệp có cả hai thấp qua ≥ 3 video: bỏ.

Ngưỡng 15% và 10% là mốc làm việc mình đề xuất dựa trên kênh hiện tại (Date You 16,7%, Shrink 9,5%), chưa phải chuẩn của YouTube.

**Bước 8. Mở khoá nhân khẩu học.** Khi kênh đủ dữ liệu (Studio sẽ tự hiện độ tuổi, giới tính, giờ xem), đối chiếu lại với tệp: tuổi, quốc gia, thiết bị. Mục tiêu tạm thời: Hoa Kỳ chiếm hơn 60% lượt xem (hiện 40,9%).

## 6. Việc đề xuất làm ngay (cần bạn duyệt)

1. Mở biểu đồ giữ chân của Shrink và Body Healed trong Studio để xem người xem rời ở giây nào. Mình có thể làm giúp nếu bạn đồng ý.
2. Gắn lại nhãn động cơ cho 6 video hiện có và 9 video của kế hoạch 11–13/11 vào một file (ví dụ `data/own_videos_labels.csv`), kèm CTR và % thời lượng sau 48 giờ.
3. Gắn nhãn rõ cho tuyến C trước khi quay: T1P (siêu năng lực có luật) hay T11 (bước vào thế giới game).
4. Mở danh sách đầy đủ các nước trong Studio để xem hơn 55% lượt xem còn lại đến từ đâu.

## 7. Giới hạn của báo cáo

- Mẫu kênh: 306 lượt xem, 6 video, kênh 1 người đăng ký. Mọi nhận xét về tệp của kênh là giả thuyết.
- Studio chưa có nhân khẩu học, giờ xem, kênh khán giả xem. Mình chưa mở biểu đồ giữ chân từng video, tab Xu hướng, và danh sách nước đầy đủ. Trang URL trực tiếp của Studio báo lỗi nên mình vào qua thanh điều hướng.
- Nhãn động cơ trong bảng 3 chưa đủ phủ (375/939 video) và chưa kiểm lại với từng video. Nhãn của video kênh mình do mình gán nhanh theo tiêu đề.
- Mốc ngưỡng (15%, 10%, 35%) là đề xuất làm việc, chưa kiểm chứng.
