# Tệp khán giả cốt lõi cho kênh What-If Fiction (Mỹ): báo cáo nghiên cứu

Snapshot: 2026-11-03 19:56 UTC · Nguồn: YouTube Data API v3 (uploads playlist + videos.list) ·
Công cụ: `audience_research.py` · Nhãn động cơ: `data/labels.csv`

> Đây là **giả thuyết về động cơ click** dựa trên tiêu đề và lượt xem công khai. Báo cáo
> không chứng minh các tệp là những nhóm người xem khác nhau. Báo cáo cũng không xác minh
> được tỷ trọng khán giả Mỹ, CTR hay retention.

## 1. Dữ liệu và độ phủ

| Mục | Số |
|---|---|
| Kênh trong danh sách | 25 (file CSV) + Hypothetica (đối chứng, không có trong CSV) + 1 kênh trùng tên được kiểm tra |
| Kênh tìm thấy qua API | 27/27 |
| Video báo cáo (videoCount) / quan sát (uploads playlist) | 624 / 624 tổng; lệch từng kênh: IFOLOGY 46/48 (thiếu 2), Jeremy Bearimy 35/34, Could've Been Tales 16/15 |
| Bị loại: Shorts hoặc ≤ 3 phút | 239 |
| Bị loại: 3–4 phút | 5 |
| Bị loại: livestream đang hoặc sắp diễn ra | 3 |
| Bị loại: thiếu lượt xem / trùng lặp | 0 / 0 |
| **Video dài hợp lệ (≥ 4 phút)** | **377** thuộc 26 kênh |
| Video dài có cờ live/premiere đã qua (giữ lại, có đánh dấu) | 41 |
| Đã gán tệp / chưa đủ căn cứ (UNCLEAR) / ngoài ngách (OFF) | 372 / 3 / 2 |
| Độ tin cậy nhãn | cao 267 · trung bình 81 · thấp 29 |

**Hypothetica:** có 5 kênh cùng tên. Tôi dùng **@hypotheticatales**: mô tả kênh nói "YOU get one
impossible ability", khớp ngách nhất. Kênh này có 6 video dài, baseline chỉ 65,5 views. Kênh
@hypotheticca chỉ có Shorts nên không có video dài nào. **Bạn nên xác nhận đây đúng là kênh
đối chứng bạn định dùng.**

**Thiên lệch tuổi video rất lớn.** Video dài đăng từ 2026-08-23 đến 2026-11-03, phần lớn
dưới 30 ngày tuổi, và chỉ có lượt xem tích lũy. Video 14–29 ngày tuổi có relative cao gấp
3–8 lần video 0–6 ngày tuổi trong cùng một tệp (`table_B2_age_matrix.csv`). Vì vậy có thêm cột
**median_age_adjusted**: relative của video chia cho median relative của mọi video cùng nhóm
tuổi đăng. Ngoài ra còn 3 phép kiểm tra độ nhạy (mục 4).

**Thị trường Mỹ:** chưa có dữ liệu địa lý. Mọi tệp chỉ được 3/10 điểm ("tiếng Anh, tình huống
Mỹ"). Cột "Quốc gia đăng ký" trong CSV là nơi kênh đăng ký (US, PK, VN, IT…), không phải nơi
khán giả ở.

## 2. Thay đổi so với 8 tệp khởi tạo (dựa trên ví dụ thực tế)

- **T1 tách đôi.** **T1G Genius** (IQ, thông minh hơn mọi người trong bối cảnh quen thuộc) và
  **T1P Superpower** (năng lực cơ thể hoặc siêu nhiên). Hai nhóm này có lời hứa khác nhau:
  thắng người khác bằng trí tuệ, khác với sở hữu một năng lực.
- **Thêm T9 Body Limits & Escalation.** Cơ thể bị đẩy tới giới hạn rồi gánh hậu quả, ví dụ
  "shrank and couldn't stop", "fell into Jupiter", "heart beat 10x faster". Người xem không có
  lợi ích gì, nên đây không phải T1P; nội dung xoay quanh "bạn", nên cũng không phải T8.
- **Thêm T10 Wealth Shortcut** (giàu tức thì) và **T11 Step Into a World/Role** (GTA, SCP,
  Backrooms, La Mã cổ đại, Mafia boss).
- **Ranh giới nhạy nhất là T2 và T7.** "See who has a crush on you" có cơ chế nhìn thấu nhưng
  lời hứa là được yêu, nên tôi gán T7 (phụ T2). Mục 4 có phép thử chuyển 7 video này sang T2.
- Cùng chủ đề IQ nhưng lời hứa ngược nhau thì tách: "Everyone Had Infinite IQ **Except You**"
  được gán T6, không phải T1G.

## 3. Bảng B: cấp tệp khán giả (sắp theo số cửa đã qua, rồi điểm)

relative = views / median views video dài của kênh. "Bùng" = ≥ 10×. "Robust" = ≥ 12× và baseline ≥ 1.000.
Cột "kênh bùng" đếm số **kênh khác nhau**.

| Tệp | Người xem bấm vì họ muốn… | Video | Kênh | View trung vị | median_rel | age-adj | cross_ch_lift (n kênh) | hit_rate | Kênh bùng | Kênh robust | ≥100k | Cửa 1 / 2 / 3 | Điểm | Quyết định |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **T4 Control of Time/Fate** | làm chủ thời gian hoặc sửa lại số phận | 30 | 17 | 28.944 | **2,18** | **1,78** | **3,73** (8) | 0,13 | 4 | **0** | 7 | Tin cậy / Đạt, robust < 2 / Đạt | 93 | Ứng viên, thử nghiệm |
| **T7 Love/Recognition** | được yêu, được chú ý, được công nhận | 35 | 11 | 19.717 | 1,00 | **1,87** | 1,10 (5) | 0,11 | 4 | **3** | 7 | Tin cậy / Đạt + robust / Đạt | 75 | Ứng viên, thử nghiệm |
| **T2 Hidden Truth** | nhìn thấu điều người khác giấu | 27 | 13 | **44.462** | 0,87 | 1,09 | 1,00 (7) | 0,11 | 3 | **2** | **11** | Tin cậy / Đạt + robust, median < 1 / Đạt | 75 | Ứng viên, thử nghiệm |
| T1P Superpower | sở hữu một năng lực phi thường | 120 | 20 | 12.068 | 1,13 | 1,05 | 1,24 (17) | 0,07 | 6 | 1 | 20 | Tin cậy / Đạt, robust < 2 / chưa đánh giá | 68 | Tiềm năng |
| T9 Body Limits | thấy cơ thể bị đẩy tới giới hạn | 38 | 13 | 4.717 | 1,08 | 0,73 | 1,58 (7) | 0,11 | 3 | 1 | 3 | Tin cậy / Đạt, robust < 2 / – | 60 | Tiềm năng |
| T1G Genius | thông minh vượt trội, thắng mọi người | 18 | 5 | 17.673 | 1,17 | 1,06 | 1,53 (4) | 0,17 | 2 | 2 | 4 | Tin cậy / Đạt + robust\* / – | 58 | Tiềm năng\* |
| T5 Extreme Existence | biết hệ quả của sống vô hạn | 9 | 9 | 7.037 | 3,32 | 3,01 | – | 0,22 | 2 | 0 | 1 | **Cần thu thập thêm** / Đạt, robust < 2 / – | 53 | Tiềm năng, mẫu nhỏ |
| T8 Wonder/Impossible World | xem điều bất khả thi của thế giới | 31 | 11 | 3.600 | 0,53 | 1,01 | 0,49 (6) | 0,13 | 2 | 1 | 4 | Tin cậy / Đạt, median < 1 / – | 43 | Có hit, chưa ổn định |
| T10 Wealth Shortcut | giàu tức thì | 12 | 10 | 5.825 | 1,07 | 1,07 | 2,27 (2) | 0 | 0 | 0 | 2 | Sơ bộ / Không đạt | 25 | Chưa đủ bằng chứng |
| T6 Survival/Isolation | xem mình có sống sót nổi không | 32 | 14 | 3.175 | 0,48 | 0,84 | 1,17 (8) | 0,03 | 1 | 1 | 2 | Tin cậy / Không đạt | 23 | Chưa đủ bằng chứng |
| T11 World/Role | nhập vai thế giới quen thuộc | 13 | 4 | 7.251 | 0,34 | 0,51 | 0,32 (3) | 0 | 0 | 0 | 0 | Sơ bộ / Không đạt | 18 | Chưa đủ bằng chứng |
| T3 Loss of Privacy | sợ bí mật của mình bị lộ | 7 | 3 | 4.121 | 0,62 | 1,01 | 1,37 (2) | 0 | 0 | 0 | 0 | Cần thêm / Không đạt | 8 | Chưa đủ bằng chứng |

Điểm 100 là heuristic, **không phải xác suất thành công**. Chỉ T4, T7 và T2 đã được đánh giá Cửa 3
(viết ≥ 20 ý tưởng, xem phụ lục). Các tệp khác bị trừ 15 điểm ở mục này vì chưa đánh giá,
nên điểm của chúng không so sánh ngang được.

\* **T1G gần như sụp khi bỏ kênh hạt giống và kênh đối chứng.** 2/2 kênh bùng là IFopposite (hạt
giống) và Manifesting (đối chứng). Bỏ hai kênh này, T1G còn 6 video, 3 kênh, 0 kênh bùng,
median_rel 0,78. Snapshot trước ("Super Intelligence 2,56×, 2 kênh bùng") phản ánh đúng hai
kênh này, **không phải bằng chứng độc lập từ thị trường.**

## 4. Kiểm tra độ nhạy

| Kịch bản | T4 (rel / age-adj / kênh robust) | T7 | T2 | T1G |
|---|---|---|---|---|
| Gốc | 2,18 / 1,78 / 0 | 1,00 / 1,87 / 3 | 0,87 / 1,09 / 2 | 1,17 / 1,06 / 2 |
| Chỉ video ≥ 7 ngày tuổi | 2,84 / 1,78 / 0 | 1,00 / **0,96** / 2 | 1,00 / 1,09 / 2 | 1,95 / 1,06 / 2 |
| Bỏ hạt giống và đối chứng | 2,25 / 2,14 / 0 | 1,00 / 1,87 / 3 | 0,86 / 1,04 / 2 | **0,78 / 1,17 / 0** |
| Bỏ nhãn độ tin cậy thấp | 2,19 / 2,10 / 0 | 1,00 / 1,87 / 2 | 0,93 / 1,12 / 2 | 1,86 / 1,17 / 2 |
| 7 video "crush reveal" chuyển T7 → T2 | không đổi | 1,03 / 1,66 / 2 | 0,93 / 1,12 / **3** | không đổi |
| 3 video "crush × googolplex năm" chuyển T7 → T5 | không đổi | 1,00 / 1,66 / 2 | không đổi | không đổi |

Đọc kết quả:
- **T4 vững nhất về hiệu suất ổn định.** Đứng đầu ở mọi kịch bản, và trong từng nhóm tuổi đều > 1
  (1,30 / 1,62 / 3,94). **Nhưng T4 có 0 kênh robust.** Bốn video bùng của T4: OTHERWISE 10,97×
  (baseline 51,8k, thiếu chút nữa mới đạt 12×) và ba kênh nền thấp (Could've Been 70×, WhatIf
  Functions 52×, Twivio 29×).
- **Điểm age-adjusted cao của T7 phụ thuộc vào video rất mới.** Chỉ tính video ≥ 7 ngày, chỉ số
  này còn 0,96. Một phần bằng chứng robust đến từ nhãn độ tin cậy thấp (Maybeverse).
- **T2 ổn định ở mức trung bình.** age-adj khoảng 1,04–1,12, luôn có 2–3 kênh robust độc lập
  (Ifsphere, If Catch). T2 còn có **nhiều video ≥ 100k nhất (11)**, vì nó chạy rất tốt ở các kênh
  nền cao: ConChaser (baseline 194k) đạt 4,8× và 6,7× với 0,9M và 1,3M views.

## 5. Bảng C: 3 ứng viên

| | **T4 Control of Time/Fate** | **T2 Hidden Truth** | **T7 Love/Recognition** |
|---|---|---|---|
| Ưu điểm | median_rel 2,18; cross-channel lift 3,73 trên 8 kênh; 17 kênh đã làm; vững ở mọi kịch bản; lời hứa rõ (được làm lại, biết trước, dừng thời gian) | 11 video ≥ 100k; mạnh ở kênh nền cao (ConChaser 1,29M = 6,7×; Jeremy 392k = 5,0×); 2–3 kênh robust độc lập; khớp snapshot trước (0,81×) | 3 kênh robust; age-adj 1,87; các hit lớn (Jeremy 826k = 10,5×; ObviouslyYou 393k = 26,8×) |
| Nhược điểm | 0 kênh robust; hit lớn nhất ở kênh nền cao chỉ 3,5–6,6× (IFOLOGY 657k, Jeremy 424k); chủ đề quen ("10 seconds into the future" có ở 6 kênh) nên dễ bão hòa | median_rel < 1: video thường dưới baseline; nhiều video rất mới (52% < 7 ngày) | phụ thuộc nhãn (ranh giới T2/T7) và video mới; nội dung "only guy at girls school" có rủi ro định vị và brand-safety |
| Bằng chứng lặp lại | 4 kênh bùng (OTHERWISE, Could've Been, WhatIf Functions, Twivio) | 3 kênh bùng (Ifsphere 35×, If Catch 25×, Hypothetica 15× nền thấp) | 4 kênh bùng (Jeremy, Maybeverse, Price of If, ObviouslyYou) |
| Độ vững | Hiệu suất trung vị vững; độ vững viral **chưa chứng minh** | Viral vững (2 robust), hiệu suất trung vị trung bình | Viral vững ở kịch bản gốc; nhạy với nhãn và tuổi video |
| Khoảng trống | Hệ quả dài hạn của việc sửa số phận, giá phải trả, bối cảnh đời thường (thi cử, tình bạn, công việc) | Bí mật trong quan hệ gần (bạn bè, gia đình, đồng nghiệp); "nhìn thấu" kèm cái giá | Công nhận không lãng mạn (được tôn trọng, được nhớ tới) ít kênh làm |
| Kế hoạch thử | 4 video (mục 7) | 4 video | Không thử riêng; lồng 1 video T2 × T7 (crush reveal) để đo ranh giới |

## 6. Kết luận

**Trục chính đề xuất thử nghiệm: T4 Control of Time/Fate.** Người xem bấm vì họ muốn **làm chủ
thời gian hoặc sửa lại số phận** (biết trước, làm lại, dừng lại, không bao giờ thua).

Lý do dựa trên dữ liệu: T4 là tệp duy nhất đứng đầu ở **mọi** kịch bản độ nhạy:
- median_rel 2,18–2,84, age-adjusted 1,78–2,14;
- 17 kênh độc lập, trong đó 8 kênh có ≥ 2 video với median lift 3,73;
- lợi thế không biến mất khi bỏ kênh hạt giống và đối chứng, cũng không biến mất khi bỏ video mới.

**Tệp so sánh trong thử nghiệm: T2 Hidden Truth.** Lý do: T2 có bằng chứng viral robust độc lập
mà T4 còn thiếu, và chạy tốt ở các kênh nền cao.

**Chưa nói chắc tệp nào thắng.** T4 thắng về độ ổn định; T2 và T7 thắng về bằng chứng viral robust.
Đây là đánh đổi mà dữ liệu công khai không phân xử được. Chỉ số kênh mới khi thử nghiệm sẽ quyết định.

**Không chọn T1G làm trục chính.** Bằng chứng của T1G đến từ chính kênh hạt giống và kênh đối
chứng (mục 3). T1P (siêu năng lực) là "nền chung" của ngách: 120 video, age-adj 1,05, chỉ 1 kênh
robust. Nó phù hợp làm biến thể, không phải lời hứa để khác biệt.

### Những điều chưa thể xác minh
- Tỷ trọng khán giả Mỹ, CTR, retention, returning viewers: cần YouTube Analytics của kênh mới.
- Người xem các tệp có trùng nhau không: dữ liệu công khai không cho biết.
- Lượt xem theo cùng mốc tuổi (ví dụ 30 ngày đầu): chưa có; cần chụp snapshot định kỳ.
  Chạy lại `collect` sau 14 và 30 ngày, so sánh cùng `video_id`.
- Nhãn chỉ dựa trên tiêu đề, chưa xem thumbnail hay phần mở đầu. 29 nhãn độ tin cậy thấp được
  đánh dấu `ambiguous=yes` trong Bảng A.
- Quy trình AI của đối thủ: chưa xác minh. Chỉ quan sát thấy hoạt hình 2D, stickman, faceless.

## 7. Kế hoạch thử nghiệm (bước 8)

- 8 video: 4 T4 và 4 T2. Cùng độ dài (8–12 phút), cùng phong cách 2D, cùng kiểu thumbnail
  (một nhân vật cùng một đạo cụ thể hiện lời hứa). Đăng xen kẽ T4 và T2.
- Đọc chỉ số sau cùng một mốc (7 ngày và 28 ngày tính từ ngày đăng):
  - CTR theo nguồn (Browse, Suggested);
  - tỷ lệ còn xem ở giây 30 và average percentage viewed;
  - returning viewers;
  - % khán giả Mỹ.
- Chọn trục chính khi một tệp hơn rõ ở **cả** CTR Suggested lẫn retention 30 giây trên ≥ 3/4
  video. Sau đó dồn 70–80% video vào lời hứa đó.

## 8. Mười tiêu đề đề xuất (không sao chép nguyên văn đối thủ)

Trục T4 (7):
1. What If You Woke Up on Your First Day of High School With Every Memory?
2. What If You Could Undo One Decision Every Day?
3. What If Your Phone Showed Tomorrow's Notifications Today?
4. What If You Could Freeze Time, But You Aged Twice as Fast While It Was Frozen?
5. What If You Lived the Same Year Until You Got It Perfect?
6. What If You Could Borrow One Hour From Tomorrow?
7. What If You Knew the Exact Day Your Luck Would Run Out?

Đối chứng T2 (3):

8. What If You Could Hear What People Say About You After You Leave?
9. What If You Could See Which of Your Friends Are Fake?
10. What If You Could See the Last Lie Everyone Told?

## Phụ lục: Cửa 3 (ý tưởng cùng lời hứa)

**T4 (22 ý tưởng):** ngày đầu cấp 3 với toàn bộ ký ức · mỗi ngày được undo 1 quyết định · cảnh báo
5 phút trước mọi chuyện xấu · dừng thời gian cho tất cả trừ 1 người · mỗi tối chọn ngày mai là ngày
nào · "save game" trước mọi rủi ro · sống lại một năm đến khi hoàn hảo · thấy kết cục mọi lựa chọn
trước khi chọn · thư từ chính mình 20 năm sau · đổi năm tuổi thọ lấy cơ hội thứ hai · về năm 8 tuổi
với ký ức 30 năm · thời gian chậm lại khi sợ · điện thoại hiện thông báo của ngày mai · tua lại 1
cuộc trò chuyện mỗi ngày · làm lại đời nhưng mất 1 ký ức mỗi lần · biết ngày vận may cạn · mượn 1
giờ từ ngày mai · tái sinh làm con của chính mình · dừng thời gian nhưng già gấp đôi · phát lại 1
khoảnh khắc và đổi đúng 1 chi tiết · chọn ngày mình chết và được đổi 1 lần · mỗi lỗi sai khiến ngày
quay lại từ đầu.

**T2 (21 ý tưởng):** lời nói dối gần nhất của mọi người · lịch sử tìm kiếm của bất kỳ ai · ai thầm
ghét mình · số dư ngân hàng trên đầu mọi người · nghe người khác nói gì sau khi mình rời đi · nỗi sợ
lớn nhất trước khi gặp · ai sẽ phản bội mình · ai từng ngoại tình · tuổi tinh thần thật · bạn bè nào
giả tạo · đáp án trong đầu giáo viên · tiền án của người lạ · bí mật người lạ mang xuống mồ · thu
nhập thật của mọi người · suy nghĩ riêng của bố mẹ · lý do thật khi ai đó tốt với mình · ai sẽ thành
công sau 10 năm · căn phòng bí mật trong thành phố · điều mọi người hối hận đã làm với mình · sự thật
sau mọi quảng cáo · thú cưng thật sự nghĩ gì về mình.

**T7 (20 ý tưởng):** thấy khoảnh khắc ai đó bắt đầu thích mình · cả trường muốn làm bạn · crush chỉ
nghe được lời khen của mình · thành "nhân vật chính" ai cũng chú ý · chuyển trường nơi ai cũng đã
biết mình · người lạ đều mỉm cười khi mình đi qua · khiến ai đó nhớ mình mãi · cứu crush nhưng không
ai tin · mỗi ngày nhận thư tình ẩn danh · người yêu cũ thấy đời mình tốt lên · nổi tiếng sau một đêm
không lý do · đồng hồ đếm ngược tới tri kỷ · mọi người vỗ tay mỗi khi mình làm việc tốt · kẹt trong
cabin tuyết với crush · cảm nhận được mọi người yêu mình bao nhiêu · được bầu nổi tiếng nhất mà không
ứng cử · kẻ bắt nạt phải ngưỡng mộ mình · tua lại lúc crush để ý mình · là lựa chọn số một của mọi
người trong 1 tuần · nghe tên mình mỗi khi có người nghĩ tới mình.

## Tệp đi kèm
- `table_A_video.csv`: Bảng A, 377 video dài với nhãn, relative, age-adjusted và các cờ bùng.
- `table_B_audience.csv`, `table_B2_age_matrix.csv`, `baselines.csv`, `coverage.csv`, `videos.csv` (dữ liệu thô).
- `sensitivity/`: Bảng B theo từng kịch bản độ nhạy.
- Tái tạo: `python audience_research.py score [--min-age 7 | --exclude-roles seed control | --min-confidence medium]`.
