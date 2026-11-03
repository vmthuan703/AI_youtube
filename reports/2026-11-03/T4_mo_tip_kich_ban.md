# T4 Control of Time/Fate: mô típ kịch bản, prompt và đề xuất kịch bản

Lời hứa cốt lõi: **người xem bấm vì họ muốn làm chủ thời gian hoặc sửa lại số phận**
(biết trước, làm lại, dừng lại, không bao giờ thua).

## 0. Nguồn dữ liệu và giới hạn

- **Chưa có transcript lời thoại.** Phiên đám mây này không truy cập được `youtube.com`, và
  YouTube Data API chỉ cho tải phụ đề của video mình sở hữu. Phân tích dưới đây dựa trên
  **mô tả video, mốc chapter, tiêu đề, thời lượng và hiệu suất** của 30 video T4
  (`reports/2026-11-03/videos.csv`). Mô tả của các kênh này thường tóm tắt cốt truyện và có chapter
  theo từng nhịp, nên đủ để thấy **cấu trúc và kiểu câu hook**. Nhịp câu thoại chi tiết
  (độ dài câu, tần suất câu hỏi…) **là suy luận, chưa đo được**.
- Cách bổ sung transcript: xem mục 6. Khi có file, tôi sẽ đối chiếu và sửa lại tài liệu này.
- Mẫu nhỏ (30 video, 17 kênh), toàn kênh dưới 3 tháng tuổi. Coi các mô típ là **giả thuyết để
  thử**, không phải công thức đã chứng minh.

Video T4 tốt nhất theo relative (đều có mô tả chi tiết):

| Kênh | Video | Views | Rel | Thời lượng |
|---|---|---|---|---|
| Could've Been Tales | See 1 Hour Into the Future | 38.870 | 70,2× | 10:19 |
| WhatIf Functions | Reborn With All Your Memories | 24.769 | 52,2× | 10:06 |
| Twivio | Stop Time (chỉ khi nín thở) | 25.332 | 29,2× | 6:38 |
| OTHERWISE | Reborn With All Your Memories | 568.278 | 11,0× | 10:07 |
| IFOLOGY | Stop Time | 656.899 | 6,6× | 10:11 |
| Price of If | See 10 Seconds Into the Future | 52.786 | 5,8× | 9:33 |
| Jeremy Bearimy | Control Your Luck / Respawn | 423.622 / 324.883 | 5,4× / 4,1× | 10:29 / 10:49 |

Video yếu nhất: Manifesting 60 giây tương lai (0,05×), ConChaser về 10 năm trước để làm giàu
(0,29×), Jeremy "Never Had to Wait" (0,46×). Chúng có một số điểm chung, nêu ở mục 3.

## 1. Khung nhịp (beat map) cho video khoảng 10 phút

Ghép từ chapter của Could've Been Tales, Ifsphere, Maybeverse, Hypothetica, WhatIf Functions:

| Mốc | Nhịp | Nội dung | Bằng chứng (chapter / mô tả) |
|---|---|---|---|
| 0:00–0:30 | **Cold open giữa một khoảnh khắc cụ thể** | Hành động nhỏ, đời thường, có giác quan: ly nước cam đổ, lon soda, sinh nhật 8 tuổi, chết ở tuổi 82 rồi mở mắt năm 1999 | "0:00 The van", "0:00 The soda can", "0:00 Your 8th birthday", "0:00 The coffee loop"; OTHERWISE "You die at 82…" |
| 0:25–0:50 | **Câu premise = tiêu đề** | Nhắc lại đúng câu "What if you could…" | "0:25 What if…", "0:49 What if you could see 10 seconds ahead?" |
| 0:45–1:30 | **Luật chơi + giới hạn** | 1 luật, 1 giới hạn đo được: chỉ trong lúc nín thở, mỗi tin nhắn ngắn dần, mỗi lần respawn lâu hơn, 24 giờ trọn đời | "0:45 The rule"; Twivio "only as long as you can hold your breath"; ObviouslyYou "engraved with two rules" |
| 1:30–3:00 | **Dễ như chơi (easy mode)** | 3–4 chiến thắng nhỏ, tăng dần: bắt điện thoại rơi, điểm thi tuyệt đối, bánh pudding miễn phí, không bao giờ trễ | "1:27 Life on easy mode", "1:05 The math test" |
| 3:00–4:30 | **Leo thang: tiền, danh tiếng, thí nghiệm** | Xổ số, casino, Bitcoin, nổi tiếng trên mạng; kéo theo hệ quả xã hội (bị cấm khỏi casino, không ai tin đứa trẻ 4 tuổi) | "2:44 Going viral", "2:10 The football experiment"; OTHERWISE "Google at $85… Bitcoin at six cents" |
| 3:40–5:00 | **Cái giá ẩn lộ ra** | Năng lực có chi phí: mất thời gian thật, ký ức lẫn lộn, ngày bị mất, mình là người duy nhất nhớ | "3:39 The hidden cost", "4:05 Missing days", "4:40 The price"; Price of If "memory starts mixing up versions" |
| 5:00–7:00 | **Khủng hoảng liên quan người thân** | Năng lực bị đẩy tới giới hạn để cứu một người: em gái trên cầu, giàn đèn rơi trên đầu em gái, buổi hòa nhạc, "dont go home" | Could've Been "your little sister on the bridge"; Twivio "steel lighting rig… above his little sister"; Twivio "dont go home" |
| 6:00–7:30 | **Đếm ngược** | Mốc thời gian chính xác, giới hạn sắp cạn | "6:03 57 minutes", "2:32 7:29 p.m.", "5:10 4 p.m." |
| 7:00–9:00 | **Lựa chọn / hy sinh** | Dùng lần cuối, chấp nhận cái giá, hoặc chọn không dùng | "5:30 The choice", "7:09 Live" |
| 9:00–10:00 | **Kết + câu hỏi người xem / móc Part 2** | "Be honest. Would you?", "Which day of YOUR life would you relive?", tiết lộ dẫn sang Part 2 | IFOLOGY, Ifsphere, WhatIf Functions Part 2 |

## 2. Mô típ câu thoại và lời dẫn

Tần suất thật chưa đo được (cần transcript); bằng chứng lấy từ mô tả và chapter.

1. **Ngôi thứ hai, thì hiện tại.** "You knock over the orange juice. You blink. The glass is full again."
   Phần lớn hit lớn kể theo "you" (OTHERWISE, Could've Been, ObviouslyYou). Kênh dùng tên nhân vật
   (Twivio: Kai, If Catch: Eli) vẫn giữ góc nhìn sát.
2. **Câu rất ngắn, ba nhịp.** "Not a guess. Not a feeling. Exactly sixty minutes ahead." /
   "Not years. Not days. Just ten seconds." Hai câu phủ định rồi một câu khẳng định đo được.
3. **Bước ngoặt "Sounds perfect… until".** Xuất hiện nguyên dạng ở 3 mô tả (Price of If,
   Ifsphere ×2), cộng 2 biến thể: Maybeverse "Sounds like life on easy mode... until" và WhatIf
   Functions "Sounds like the ultimate superpower, right? But what if...". Đây là trục chuyển từ easy mode sang cái giá.
4. **Con số cụ thể thay cho tính từ.** 7:29 p.m., 57 minutes, 450 meters up, forty steps from the
   front door, Bitcoin at six cents, Google at $85, three hours old.
5. **Liệt kê ba chiến thắng nhỏ trước một cú ngoặt.** "Perfect test scores, free puddings, the best
   week of your life. But every text is shorter than the last…"
6. **Một chi tiết cảm xúc giấu trong danh sách thực dụng.** "And the third line in your notebook has
   nothing to do with money." Ẩn một mục tiêu tình cảm giữa các mục tiêu làm giàu.
7. **Khoa học thật xen vào truyện.** "The texts and the characters are fiction. The science is real.";
   "why your brain already lives 0.1 seconds in the past", "why goalkeepers have to guess penalties".
   Mỗi lần xen vào khoảng 1–2 câu, giải thích vì sao năng lực khó.
8. **Hỏi người xem đúng một lần, ở cuối.** Câu hỏi gọi tên lựa chọn đạo đức: "Would you use it to win,
   or to save people?"
9. **Ngôn ngữ game cho thời gian.** checkpoint, respawn, reload, easy mode, game-over screen. Chủ yếu
   ở Jeremy Bearimy và WhatIf Functions.

## 3. Những gì nên tránh (rút từ video yếu, có thể do yếu tố khác nên chỉ là quan sát)

- **Premise chung chung, không có luật hay cái giá.** Manifesting: "A superpower that could change your
  life—or destroy it." (0,05×)
- **Chỉ nói chuyện làm giàu, không có con người.** ConChaser 10 năm trước + Bitcoin (0,29×), trong khi
  OTHERWISE cùng ý tưởng nhưng có "the third line… nothing to do with money" (11×).
- **Dạng giải thích, không có nhân vật.** Jeremy "Never Had to Wait" (0,46×), ConChaser "cup trick" (0,51×).
- **Chọn năng lực đã bão hòa mà không có góc mới.** "See 10 seconds into the future" đã có ở 6 kênh. Nếu
  làm, cần một luật hoặc một cái giá khác biệt.

## 4. Prompt viết kịch bản (dùng lại cho mọi video T4)

File dùng trực tiếp: `prompts/T4_script_prompt.md`. Nội dung tóm tắt: nhận vào tiêu đề, luật,
cái giá, người thân bị đe dọa và độ dài; trả về kịch bản lời dẫn tiếng Anh theo 10 nhịp ở mục 1,
kèm ghi chú cảnh cho hoạt hình 2D, prompt thumbnail và checklist tự kiểm tra.

## 5. Đề xuất kịch bản T4 (15)

Mỗi kịch bản có đủ: **luật**, **cái giá**, **leo thang**, **người thân bị đe dọa**, **kết**. Tránh
lặp nguyên văn premise của đối thủ; các năng lực đã bão hòa (10 giây tương lai, tái sinh có ký
ức) chỉ dùng khi có luật mới.

| # | Tiêu đề | Luật / giới hạn | Cái giá | Leo thang → khủng hoảng | Kết |
|---|---|---|---|---|---|
| 1 | What If You Could Undo One Decision Every Day? | Mỗi ngày 1 lần undo, phải chọn trước nửa đêm | Thứ bị undo biến mất khỏi ký ức của mọi người, trừ bạn | Bài thi → lời tỏ tình → khoản đầu tư → 11:58 p.m., bố gặp tai nạn lúc 6 giờ chiều nhưng undo hôm nay đã dùng cho chuyện vặt | Học cách để dành; câu hỏi: "What would you save it for?" |
| 2 | What If Your Phone Showed Tomorrow's Notifications Today? | Chỉ thấy thông báo, không mở được nội dung | Mỗi thông báo bạn né tránh, ngày mai sẽ gửi một thông báo khác thay thế | Tin nhắn crush, điểm thi → "Missed call: Mom (14)" | Gọi lại ngay hôm nay. Part 2: ai gửi thông báo đầu tiên? |
| 3 | What If You Woke Up on Your First Day of High School With Every Memory? | Về đúng ngày đầu cấp 3, nhớ hết 15 năm | Mỗi thay đổi lớn xóa 1 ký ức đẹp của tương lai cũ | Thi cử, bạn bè, cổ phiếu → người bạn thân lẽ ra gặp năm 2031 không còn tồn tại | Chọn giữ một người hay giữ cả gia tài |
| 4 | What If You Could Freeze Time, But You Aged Twice as Fast While It Was Frozen? | Dừng thời gian không giới hạn | Mỗi phút dừng = 2 phút tuổi thọ | Đi học muộn → chép bài → cứu người lạ khỏi xe buýt → tóc bạc ở tuổi 19 | Đếm số năm đã mất; "Was it worth it?" |
| 5 | What If You Lived the Same Year Until You Got It Perfect? | Vòng lặp 1 năm, reset vào giao thừa | Chỉ bạn nhớ; "perfect" do ai định nghĩa? | Năm điểm A tuyệt đối → năm giàu → năm mọi người yêu quý → năm 47 vẫn chưa thoát | "Perfect" hóa ra là để em gái tha thứ cho một lỗi cũ |
| 6 | What If You Could Borrow One Hour From Tomorrow? | Mượn tối đa 1 giờ/ngày | Ngày mai ngắn đi đúng bằng giờ đã mượn | Ngủ thêm → ôn thi → nợ thời gian chồng chất → một ngày chỉ còn 9 phút | Trả nợ bằng 1 ngày bị "skip" hoàn toàn |
| 7 | What If You Knew the Exact Day Your Luck Would Run Out? | Một bộ đếm may mắn hiện trước mắt | Khi bộ đếm về 0, mọi xui xẻo dồn lại | Thắng mọi thứ → bộ đếm giảm nhanh khi giúp người khác | Dùng phần may cuối cho người khác |
| 8 | What If Every Mistake You Made Reset the Day? | Lỗi lớn → ngày quay lại 7:00 a.m. | Không chọn được; ngay cả lỗi nhỏ cũng reset | Ngày phỏng vấn lặp 31 lần → phát hiện "lỗi" thật là chuyện với bố | Ngày tiếp tục khi nói được câu xin lỗi |
| 9 | What If You Could Pause Everyone Except One Person? | Mỗi lần dừng, chọn đúng 1 người được cử động | Người đó nhớ mọi thứ và có thể kể lại | Chọn crush → chọn kẻ bắt nạt → người được chọn bắt đầu dùng bạn | Chọn chính mình 10 năm trước? Mở Part 2 |
| 10 | What If You Could Replay Any Moment and Change Only One Thing? | Đổi đúng 1 chi tiết mỗi lần phát lại | Hiệu ứng cánh bướm, mỗi lần một lớn hơn | Đổi 1 câu nói → đổi 1 ngã rẽ → mất người em chưa sinh ra | Giữ nguyên khoảnh khắc tệ nhất vì nó sinh ra điều tốt nhất |
| 11 | What If You Got a Warning 5 Minutes Before Every Bad Thing? | Rung nhẹ 5 phút trước sự cố | Không biết sự cố là gì | Né mưa → né tai nạn → cảnh báo rung liên tục 3 ngày ở cả thành phố | Khoa học về linh cảm và độ trễ của não; chọn cứu ai |
| 12 | What If You Could Rewind One Conversation Per Day? | 1 cuộc trò chuyện/ngày | Người kia nhớ mơ hồ, có cảm giác déjà vu | Phỏng vấn → hẹn hò → bố mẹ cãi nhau → cuộc gọi cuối với ông | Không tua lại, vì lời nói thật quý hơn lời nói hoàn hảo |
| 13 | What If You Could Save Your Life Like a Video Game Before Every Risk? | 1 save slot, ghi đè mỗi lần save | Save nhầm lúc thì không quay lại được | Skate → núi → save ngay trước khi nhận tin dữ | Phải sống tiếp từ save tệ nhất |
| 14 | What If Time Moved 10x Slower When You Were Scared? | Sợ hãi kích hoạt slow motion | Càng dùng càng khó cảm thấy sợ, nên năng lực yếu dần | Bài thuyết trình → tai nạn → đến lúc cần nhất thì không còn sợ được | Khoa học về adrenaline và cảm nhận thời gian |
| 15 | What If You Could Choose the Day You Die—and Change It Only Once? | Biết và chọn ngày chết | Chỉ được đổi 1 lần | Sống liều vì biết mình an toàn → người thân không có năng lực này | Dùng lần đổi duy nhất cho người khác (nếu được không?) |

**Ưu tiên làm trước (cho 4 video thử nghiệm):** #2, #4, #1, #3. Đây là những ý tưởng bám bối cảnh
đời thường, có luật đo được và người thân rõ ràng, và chưa thấy kênh nào trong mẫu làm.

## 6. Bổ sung transcript để đo lời thoại thật

Danh sách 30 URL đã sắp theo hiệu suất: `data/transcripts/T4_urls.txt`. Hai cách:
1. **Thủ công:** mở video → "…more" → "Show transcript" → copy → lưu thành
   `data/transcripts/T4/<video_id>.txt`. Chỉ cần 8–10 video đầu danh sách.
2. **Trên máy của bạn** (mạng thường, không phải phiên đám mây này):
   `yt-dlp --skip-download --write-auto-subs --sub-langs en --sub-format vtt -o "data/transcripts/T4/%(id)s" -a data/transcripts/T4_urls.txt`
   rồi commit thư mục đó lên nhánh.

Khi có transcript, tôi sẽ đo:
- số từ/phút, độ dài câu trung bình, tỷ lệ "you";
- số câu hỏi, vị trí câu "until";
- thời điểm xuất hiện luật, cái giá, khủng hoảng;

rồi cập nhật mục 1–2 và prompt.
