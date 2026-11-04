# Báo cáo đối thủ (mốc đầu): What-If Fiction × Mỹ

| | |
|---|---|
| Ngày nghiên cứu | 2026-11-04 |
| Khoảng dữ liệu | 1 snapshot, chụp 2026-11-03 19:56 UTC (chưa có số tăng theo tuần) |
| Phạm vi | Ô What-If Fiction × Mỹ, tiếng Anh · 27 kênh mồi (25 kênh trong `data/channels_2026-11-04.csv`, Hypothetica và 1 kênh trùng tên được kiểm tra) · 624 video, trong đó 377 video dài ≥ 4 phút thuộc 26 kênh · 0 truy vấn tìm kiếm (chưa chạy discovery) |
| Nguồn | YouTube Data API v3 (uploads playlist + videos.list), nhập bằng `market_watch.py import-snapshot`. Số liệu: `SO_LIEU.md`. Nhãn động cơ: `data/labels.csv` (377 nhãn đọc tay) |

> Đây là **mốc đầu**, dựng từ dữ liệu đã thu ngày 2026-11-03. Từ khi lịch chạy hằng ngày được bật,
> báo cáo tuần sẽ có thêm kênh mới tìm qua 20 truy vấn và số view tăng trong tuần.

## 1. Kết luận nhanh

- **Cửa đang mở, nhưng mẫu bị lệch về kênh trẻ.** 17/26 kênh có video dài ≥ 100k khi chưa đầy 3 tháng tuổi.
  Tuổi trung vị của 5 kênh có video to nhất là 0,8 tháng. Danh sách kênh mồi lấy từ trang theo dõi
  *kênh mới*, nên kết luận này phải chờ discovery kiểm lại.
- **View trung vị của video ≥ 100k là 285.537** (61 video), nằm trong vùng tốt 150k–600k. Chưa có dấu
  hiệu kênh cũ ngồi sẵn.
- **Ô đang trộn hai ngách.** Trong 5 kênh có video to nhất, chỉ 3 kênh làm what-if *về chính người xem*
  (ConChaser, Manifesting, IFOLOGY). OminiAM và What If Animations làm what-if *về thế giới/khoa học*. Tỉ lệ
  đúng ngách 3/5 = 60%, dưới ngưỡng 80%.
- **Khung tiêu đề mạnh nhất là "What If You Could See Everyone's ___?"**: 23 video ở 11 kênh, 6 kênh có
  video ≥ 100k, 4 kênh có video bung. ConChaser làm toàn bộ bằng khung này và đạt trung vị 194.047
  view trên 11 video, khi kênh mới 10 ngày tuổi.
- **Chủ đề ít người làm mà vẫn bung:** "Làm lại cuộc đời với ký ức cũ" (7 video, bung ở 2 kênh) và
  "IQ vượt trội" (17 video ở 5 kênh, bung ở 2 kênh).

## 2. Bảng chấm ô

| Điều kiện | Ngưỡng | Số đo | Kết quả |
|---|---|---|---|
| Có kênh ≤ 3 tháng đã có video ≥ 100k | có | 17 kênh (ConChaser 10 ngày tuổi: 1.292.507 view) | đạt, quyết định |
| Tuổi trung vị 5 kênh có video to nhất | ≤ 12 tháng | 0,8 tháng (tính theo video cũ nhất) | đạt |
| view/sub trung vị | ≥ 10× | chưa đo (snapshot cũ không có số sub) | — |
| Số video dài ≥ 100k | ≥ 8 | 61 | đạt (cần, không đủ) |
| View trung vị của video ≥ 100k | 150k–600k | 285.537 | đạt |
| Kênh đúng ngách | ≥ 80% | 3/5 kênh top (đọc 10 tiêu đề gần nhất) | **không đạt** |

Cách chấm "đúng ngách": đọc 10 video dài gần nhất của mỗi kênh. Kênh được tính là đúng ngách khi phần lớn
tiêu đề là tình huống giả định *đặt người xem vào vai chính* ("What if **you**…").

| Kênh | Tiêu đề "What if you…" / 10 | Đúng ngách |
|---|---|---|
| ConChaser | 10/10 | có |
| Manifesting | 7/7 (kênh chỉ có 7 video dài) | có |
| IFOLOGY | 10/10 (3 tiêu đề mượn game: GTA 6, Freddy Fazbear, Backrooms) | có |
| OminiAM | 4/10 (còn lại: chiến tranh hạt nhân, AI, Trái Đất ngừng quay…) | không |
| What If Animations | 4/10 (còn lại: côn trùng biến mất, lịch sử Trái Đất…) | không |

## 3. Đối thủ đáng chú ý

Tuổi kênh tính theo video cũ nhất, chưa phải ngày tạo kênh. "Bung" nghĩa là ≥ 10× trung vị của chính kênh đó.

| Kênh | Tuổi | Video dài | Đăng trong 7 ngày | Trung vị view | ≥ 100k | Bung | Câu hứa chính / khung tiêu đề |
|---|---|---|---|---|---|---|---|
| ConChaser | 10 ngày | 11 | 7 | 194.047 | 7 | 0 | "What If You Could See Everyone's ___?": nhìn thấy điều ẩn của người khác (tài sản tương lai, IQ, crush) |
| Jeremy Bearimy | 23 ngày | 34 | 14 | 78.686 | 15 | 1 | "What IF You Could See Who ___?" và tình huống xã hội (nổi tiếng, crush, trường học) |
| IFOLOGY | 24 ngày | 35 | 13 | 99.742 | 17 | 0 | Siêu năng lực cá nhân + bối cảnh game/văn hoá mạng; hiệu suất đều, không có cú bung |
| Manifesting | 22 ngày | 7 | 1 | 31.353 | 2 | 1 | Nâng cấp bản thân 10×: "What if your IQ was 10x higher?" (939.128 view, 30×) |
| OTHERWISE | 15 ngày | 5 | 0 | 51.807 | 2 | 1 | "Reborn With All Your Memories" (568.278 view, 11×) |
| IFopposite | 20 ngày | 16 | 8 | 10.965 | 2 | 2 | Infinite IQ ("Infinite IQ at School" 286.494 view, 26×) |
| OminiAM | 28 ngày | 12 | 3 | 7.262 | 4 | 4 | What-if về loài người/Trái Đất. Khác tệp: 4 cú bung đều là kịch bản thế giới |
| What If Animations | 31 ngày | 26 | 9 | 1.271 | 1 | 2 | Một phát trúng: "shrank and couldn't stop" 875.419 view (689×), phần còn lại < 600 view |

Điểm cần kiểm: video "What IF You Could See Who Has a Crush on You?" của Jeremy Bearimy đạt 825.913 view
sau khoảng 1 ngày (đăng 2026-11-02). Tốc độ này bất thường. Có thể do quảng cáo, đăng lại, hoặc video đó
được đẩy rất mạnh. Snapshot ngày sau sẽ cho biết.

## 4. Chủ đề bung ở ≥ 2 kênh khác nhau

Gom theo khung tiêu đề (đếm bằng từ khoá trên 377 tiêu đề, rồi đọc lại bằng tay):

| Chủ đề / khung | Video tồn tại | Số kênh | Kênh bung | Kênh có video ≥ 100k | Tỉ lệ trúng | View trung vị |
|---|---|---|---|---|---|---|
| Nhìn thấu người khác ("See everyone's / see who") | 23 | 11 | 4 | 6 | 4/23 = 17% | 137.867 |
| Thay đổi cơ thể theo cấp số (10×, 100× nhỏ hơn…) | 34 | 15 | 6 | 5 | 7/34 = 21% | 15.937 |
| Crush / soulmate / được yêu | 24 | 8 | 4 | 5 | 4/24 = 17% | 16.173 |
| IQ vượt trội | 17 | 5 | 2 | 4 | 3/17 = 18% | 26.169 |
| Làm lại cuộc đời với ký ức cũ | 7 | 5 | 2 | 1 | 2/7 = 29% | 24.769 |
| Nhìn thấy tương lai | 16 | 13 | 2 | 4 | 2/16 = 13% | 45.828 |
| Người cuối cùng / loài người biến mất | 9 | 6 | 1 | 1 | 2/9 = 22% | 4.780 |

Cách đọc bảng:
- "Người cuối cùng" chỉ bung ở 1 kênh (OminiAM). Có thể do kênh giỏi hoặc do may, **chưa đủ bằng chứng**.
- "Thay đổi cơ thể" bung ở nhiều kênh nhất (6). View trung vị thấp, nên chủ đề này dễ vượt trung vị của
  kênh nhưng hiếm khi ra view lớn tuyệt đối.
- "Làm lại cuộc đời" có ít video nhất (7) mà tỉ lệ trúng cao nhất (29%). Theo bước 6 của phương pháp,
  đây là chủ đề nên ưu tiên. Mẫu nhỏ, cần thêm dữ liệu.

## 5. Tệp khán giả

Gom theo câu hứa của tiêu đề (dựa trên nhãn đọc tay trong `data/labels.csv`). Không trộn giọng giữa các tệp.

| Tệp | Video | Kênh bung | Họ thầm nghĩ | Họ cần được |
|---|---|---|---|---|
| Nhìn thấu điều người khác giấu (T2) | 27 | 3 | "Mọi người đang giấu mình điều gì?" | biết trước, nắm thế chủ động |
| Làm chủ thời gian / sửa số phận (T4) | 30 | 4 | "Giá mà mình được làm lại." | cơ hội thứ hai |
| Được yêu / được chú ý (T7) | 35 | 4 | "Có ai thật sự để ý mình không?" | được xác nhận |
| Thông minh vượt trội (T1G) | 18 | 2 | "Mình giỏi hơn người ta nghĩ." | thắng, được công nhận |

Tệp siêu năng lực chung (T1P) có nhiều video nhất (120 video, 20 kênh) nhưng tỉ lệ trúng chỉ 7%. Tệp này
đông người làm và không có câu hứa riêng.

## 6. Đề xuất tuyến nội dung

1. **Nhìn thấu người khác.** Khung: "What If You Could See Everyone's ___?" hoặc "What If You Could See Who ___?".
   - Bằng chứng: 6 kênh có video ≥ 100k. ConChaser đạt trung vị 194.047 view trên 11 video.
   - Rủi ro: ConChaser đang khai thác dày (7 video trong 7 ngày), nên khung này có thể bão hoà nhanh. Cần
     chọn "điều được nhìn thấy" mà các kênh chưa làm, và kiểm bằng hộp gợi ý YouTube trước khi làm.
2. **Làm lại cuộc đời với ký ức cũ.** Khung: "What If You Were Reborn With All Your Memories?" và các biến thể
   (quay lại năm 2010, làm lại năm học cuối…).
   - Bằng chứng: OTHERWISE đạt 568.278 view (11×). WhatIf Functions đạt 52× trung vị. Chỉ có 7 video tồn tại.
   - Rủi ro: mẫu nhỏ (2 kênh bung).
3. **IQ vượt trội.** Khung: "What If You Had Infinite IQ ___?" hoặc "What if your IQ was 10x higher?". Hợp với
   kênh mồi IFopposite.
   - Bằng chứng: Manifesting đạt 939.128 view (30×). IFopposite đạt 286.494 view (26×). 4 kênh có video ≥ 100k.
   - Rủi ro: 17 video ở 5 kênh, khung đang bắt đầu đông.
4. **Crush / được yêu (thử nghiệm).** Khung: "What If You Could See Who Has a Crush on You?".
   - Bằng chứng: bung ở 4 kênh, 5 kênh có video ≥ 100k.
   - Rủi ro: view trung vị chỉ 16.173. Cú 825.913 view của Jeremy Bearimy cần kiểm vì tăng bất thường.

Không đề xuất: what-if thế giới/khoa học (OminiAM, What If Animations). Đây là tệp khác và nên làm thành
kênh riêng nếu muốn theo.

## 7. Việc cần làm tuần tới

- [ ] Merge PR #4 và PR tự động hoá vào `main`. GitHub chỉ chạy lịch hằng ngày từ nhánh mặc định.
- [ ] Thêm secret `YOUTUBE_API_KEY` cho repo (Settings → Secrets and variables → Actions).
- [ ] Chạy tay workflow "Thu thập thị trường hằng ngày" một lần (Actions → Run workflow) để kiểm tra.
- [ ] Xác nhận kênh đối chứng Hypothetica là `@hypotheticatales`.
- [ ] Quyết định có tách ô "what-if thế giới/khoa học" thành ô riêng trong `config/markets.json` không.
- [ ] Chọn 1 trong 3 tuyến đầu ở mục 6, viết 5 tiêu đề, kiểm từng tiêu đề bằng hộp gợi ý YouTube ở tab ẩn danh.
- [ ] Theo dõi video 825.913 view của Jeremy Bearimy qua snapshot ngày mai.

## 8. Thay đổi so với tuần trước

Chưa có: đây là báo cáo đầu tiên.

## 9. Giới hạn

- **Thiên lệch chọn mẫu:** 25/27 kênh lấy từ trang theo dõi *kênh mới* của bên thứ ba, nên tuổi kênh trong
  ô bị kéo về phía trẻ. Phải chờ discovery (20 truy vấn/ngày) để kiểm lại kết luận "cửa mở".
- **Thiên lệch sống sót:** chỉ thấy kênh còn sống. Tỉ lệ thắng thật chưa đo được.
- **Lượt xem là tích luỹ**, chỉ có 1 snapshot: phần lớn video dưới 30 ngày tuổi. Video mới đăng bị thiệt khi so
  với video cũ.
- **Chưa có số subscriber** trong snapshot này, nên chưa tính view/sub.
- **Đếm chủ đề bằng từ khoá** rồi đọc lại bằng tay. Một tiêu đề có thể thuộc 2 khung.
- **Ngưỡng bung 10×** là ngưỡng tự đặt. Kênh có < 3 video dài thì không tính bung.
- **Chưa đo tỉ lệ khán giả Mỹ.** Chỉ biết tiêu đề tiếng Anh và bối cảnh Mỹ.
