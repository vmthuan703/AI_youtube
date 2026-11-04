# Cẩm nang thumbnail: học từ đối thủ

| | |
|---|---|
| Dữ liệu | Snapshot 2026-11-04 · 266 thumbnail · 47 kênh · ô What-If Fiction × Mỹ |
| Cách chọn | Mỗi kênh lấy 4 video nhiều view nhất (**top**) và 2 video ít view nhất đã đăng ≥ 7 ngày (**flop**) |
| `rel` | View của video / trung vị view video dài của chính kênh. "Thắng" là rel ≥ 3 |
| Ảnh gốc | [`research/reports` → `thumbnails/2026-11-04/`](https://github.com/vmthuan703/AI_youtube/tree/research/reports/thumbnails/2026-11-04) (`index.csv` + tờ ảnh `sheets/`) |
| Chạy lại | Actions → **Thu thập thumbnail đối thủ** → *Run workflow*, hoặc `python tools/thumbnails/collect_thumbnails.py --root <thư mục research/reports>` |

## 1. Kết luận nhanh

- **Phong cách không phải là thứ tạo khác biệt.** Video thắng và video flop của *cùng một kênh* dùng cùng một kiểu ảnh.
  Chỉ số đo bằng máy gần như bằng nhau:

  | Chỉ số (trung vị) | Thắng (127 ảnh) | Flop (78 ảnh) |
  |---|---|---|
  | Độ sáng | 0,36 | 0,37 |
  | Độ bão hoà màu | 0,50 | 0,52 |
  | Tỉ lệ vùng màu nóng | 0,19 | 0,14 |
  | Số chữ đọc được (OCR) | 5 | 6 |
  | Có chữ số trên ảnh | 41% | 41% |

  Phong cách chỉ là "vé vào cửa". Thiếu nó thì ảnh lạc giữa trang chủ, nhưng có nó cũng chưa chắc thắng.
- **Thứ tạo khác biệt là ý tưởng của ảnh:** ảnh thắng cho người xem *thấy luật chơi bằng một con số hoặc nhãn cụ thể*,
  kèm một phản ứng. Ảnh flop dùng chữ chung chung theo kiểu cảm xúc (REPLACED., NOT REAL., UH OH…, MIND POWER).
- **Màu nóng nhỉnh hơn ở ảnh thắng** (0,19 so với 0,14): có một mảng đỏ hoặc cam làm điểm nhấn. Chênh lệch nhỏ, chỉ coi là gợi ý.

## 2. Năm mẫu thumbnail thắng

| # | Mẫu | Ví dụ thắng (view · rel) | Hợp với |
|---|---|---|---|
| 1 | **Nhãn số trên đầu người**: con số hoặc nhãn nổi trên đầu từng nhân vật, thể hiện đúng siêu năng lực | ConChaser *Future Wealth* `$150` vs `$8,742,619,300` (1,31 triệu · 7,6×) · *IQ* `160 IQ` vs `70 IQ` (975k) · *Crush* `0` vs `999+` (579k) · Jeremy Bearimy `friend / CRUSH / friend` (1,06 triệu · 12×) | Tuyến B "See Everyone's ___" |
| 2 | **Trước / sau chia đôi**: cùng một nhân vật ở 2 trạng thái, có nhãn mốc | OminiAM `TODAY / 50 YEARS LATER` (1,14 triệu · 156×) · What if U click `AGE 0 / AGE 70` (388k · 214×) · OminiAM `DAY 1 / YEAR 10` (328k · 45×) · IFSIM `HEAL 100x FASTER` (53k · 41×) | Tuyến A "×100" |
| 3 | **Bảng chỉ số / HUD**: một bảng số đo kiểu game hoặc app | IFShift `REACTION TIME 0.0025 s · normal 0.25 s` (688k · 76×) · Mirage `BODY SETTINGS` (194k · 73×) · Miko `LIES COUNTER 9,317 +1` (715k · 19×) · If Catch `LIE 99%` (227k · 25×) | Cả 2 tuyến |
| 4 | **Nhân vật "biết tuốt" + 2 chữ**: nhân vật chính cười nhếch hoặc liếc mắt, bên cạnh là người bị bất ngờ. Chữ là câu thoại ngôi thứ nhất | IFOLOGY `I ALREADY WON.` (355k) · OTHERWISE `I REMEMBER EVERYTHING.` (587k · 13×) · Ifsphere `I KNOW.` (175k · 35×) · IFOLOGY `PAUSED.` (661k) | Video "năng lực = lợi thế" |
| 5 | **Quy mô cực lớn**: rất nhiều người hoặc cả Trái Đất, con số khổng lồ | Vanessa Harris `8 BILLION JUMP AT ONCE!` (331k · 310×) · Stick Revival `ONLY 2 LEFT` (316k · 873×) · OminiAM `1 BILLION YEARS.` (481k · 66×) | Video về cả thế giới (không phải tuyến hiện tại) |

Mẫu riêng của **Minute Zero** (chữ serif mảnh, kiểu "YOUR SPEED 1,235 km/h · and still speeding up") đạt 2,2 triệu view.
Nhưng cùng mẫu đó cũng flop (`4 mm`, `63 dB`, `54,754 km/h`), và chỉ hợp với ngách "…couldn't stop". Không nên chép.

## 3. Dấu hiệu của ảnh flop

- **Chữ chỉ nói cảm xúc, không nói luật chơi:** `REPLACED.`, `NOT REAL.`, `UH OH...`, `MIND POWER`, `ZERO PAIN.` (rel 0,08–0,33).
- **Cảnh toàn, nhân vật nhỏ:** ví dụ `What If You Were the Last Human Alive?` dùng người thật đứng giữa phố, rel 0,04.
- **Con số không đi kèm phản ứng:** `$4,213,880,517` có số nhưng hai nhân vật đứng xa, không có mặt cận, rel 0,16.
  So với `$8,742,619,300` của ConChaser (7,6×): bản thắng có người nghèo và nhân vật chính đối diện nhau.
- **Chủ đề yếu thì ảnh đẹp vẫn flop:** phần lớn ảnh flop vẫn đẹp. Nên kiểm tra tiêu đề và chủ đề trước khi chỉnh ảnh.

## 4. Checklist cho mỗi thumbnail

1. **Một con số hoặc một nhãn nói lên luật chơi**, cỡ lớn, đọc được khi ảnh chỉ rộng 168 px.
2. **Mặt cận của nhân vật chính** chiếm khoảng 30–40% khung hình. Cảm xúc rõ: sốc, cười nhếch, hoặc sợ.
3. **Tối đa 3 từ chữ to** (Fredoka đậm, trắng + vàng, viền đen dày). Chữ **thêm** thông tin về cái giá hoặc lợi thế, **không lặp lại tiêu đề**.
4. **Bố cục 3 vùng:** chữ ở góc trên trái, nhân vật ở một bên, vật mang con số ở bên kia.
5. **Tương phản nóng/lạnh:** nền xanh tối + một mảng đỏ hoặc cam. Không để cả ảnh tối đều như khung hình trong video.
6. **Tự dựng thumbnail riêng, không cắt khung hình từ video.** Khung hình trong video của mình quá tối và nhân vật quá nhỏ.
7. Mỗi video làm **3 phương án** (năng lực / cái giá / con số) và chạy **Test & Compare** của YouTube Studio.

## 5. Đã áp dụng: T4 #2 "What If Your Phone Showed Tomorrow's Notifications Today?"

Dựng bằng chính engine của video (cùng nhân vật Maya, cùng thẻ TOMORROW), ở dự án
`aitrends-2d-studio/projects/t4-02-thumb/`. Ảnh 1280×720 nằm trong thư mục `thumbnails/` của dự án đó.

| Phương án | Mẫu áp dụng | Nội dung |
|---|---|---|
| **A · TOO LATE?** (đề xuất làm ảnh chính) | Mẫu 1 + phản ứng sốc | Maya sốc, mặt sáng xanh vì màn hình. Thẻ to "Mom · **14 missed calls** · TOMORROW 6:12 PM". Năng lực và cái giá nằm chung một khung |
| B · I KNOW. | Mẫu 4 | Maya cười nhếch. Thẻ "Mr. Okafor · **POP QUIZ** · TOMORROW 8:05 AM" + bài kiểm tra **20/20** |
| C · IT KEEPS COUNT. | Mẫu 3 | Màn hình khoá **312 NEW** + nhãn **+2**, Maya đổ mồ hôi |

Dựng lại sau khi sửa `scenes/thumbs.js`:

```bash
cd aitrends-2d-studio && node render.mjs --project projects/t4-02-thumb --stills 0.5,1.5,2.5
```

## 6. Brief thumbnail cho 6 video trong kế hoạch 05/11–07/11

| Video | Mẫu | Chữ to | Vật mang con số | Mặt nhân vật |
|---|---|---|---|---|
| A1 Memory 100x | 2 + 3 | `I REMEMBER.` | HUD "MEMORY **100×** · pages stored: **1,284,902**", sách bay vào đầu | Ava cười nhếch, mắt phát sáng |
| A2 Taste 100x | 2 | `TOO STRONG.` | Chia đôi: miếng pizza "NORMAL" / cùng miếng đó "**100×**" bốc lửa | Sốc, chảy nước mắt |
| A3 Hands 100x | 2 + 5 | `OOPS.` | Bàn tay khổng lồ cầm cả chiếc xe buýt, có thước đo "**100×**" | Ngượng, đổ mồ hôi |
| B1 Searches | 1 | `DON'T LOOK.` | Ô tìm kiếm nổi trên đầu 3 người: thầy giáo, bạn thân (dòng đỏ), mẹ | Sốc, nhìn ô của bạn thân |
| B2 Real Age | 1 | `SHE'S 312?` | Nhãn tuổi trên đầu: "16", "41", "**312**" (đỏ) | Sốc + một nhân vật cười bí ẩn |
| B3 Worst Day | 1 + 2 | `TOMORROW.` | Nhãn trên đầu bạn thân: "WORST DAY: **TOMORROW**" | Sợ, đưa tay ra |

Ghi chú:

- Chữ to dưới 3 từ và không trùng tiêu đề.
- Con số đặt ở vùng đối diện mặt nhân vật.
- Mỗi video vẫn làm thêm 2 phương án để A/B test.
