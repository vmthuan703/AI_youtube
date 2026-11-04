# Đăng video T4 #2: tiêu đề, mô tả, tags

Video: `aitrends-2d-studio/projects/t4-02` (9:48). Thumbnail đề xuất:
`aitrends-2d-studio/projects/t4-02-thumb/thumbnails/D_pick_up.jpg`.

Áp dụng quy tắc trong [`ke-hoach/2026-11-05.md`](../ke-hoach/2026-11-05.md), mục "Quy tắc chung":

- Tiêu đề tối đa 45 ký tự, mở bằng "What If You/Your", kết thúc bằng "?", không viết HOA cả từ.
- Mô tả khoảng 600 ký tự, ngôi "you".
- Tag đầu là tiêu đề, sau đó là tag chủ đề, rồi đến bộ tag nền.

Dữ liệu đối thủ lấy từ snapshot 2026-11-04 trên nhánh `research/reports`.

## 1. Tiêu đề

| | Tiêu đề | Ký tự | Ghi chú |
|---|---|---|---|
| **Chốt** | **What If Your Phone Showed Tomorrow?** | 35 | Ngắn, đúng quy tắc. Khớp với thẻ TOMORROW trên thumbnail, để thumbnail nói thay chữ "notifications" |
| Dự phòng | What If You Could See Tomorrow's Notifications? | 47 | Dùng khung "What If You Could See ___?", khung mạnh nhất thị trường. Dài hơn 45 ký tự 2 ký tự |
| Không dùng | What If Your Phone Showed Tomorrow's Notifications Today? | 57 | Tiêu đề gốc, quá dài: dễ bị cắt trên điện thoại |

Bằng chứng:

- **Khung "nhìn thấy tương lai" đang chạy tốt:**
  - IFOLOGY *See 10 Seconds Into the Future*: 355.150 view (3,7×).
  - Jeremy Bearimy, cùng chủ đề: 310.533 view (3,6×).
  - Price of If: 52.833 view (5,7×).
  - Could've Been Tales *1 Hour Into the Future*: 70×.
- **Góc "điện thoại báo trước" gần như còn trống:**
  - Video gần nhất là Twivio *What If You Got a Text From Tomorrow?*: 2.059 view (1,7×).
  - Chưa có tiêu đề nào về *notifications* hay *lock screen*.

## 2. Mô tả (572 ký tự + phần nguồn)

```text
At 11:59 every night, your phone shows you tomorrow's notifications. The time. The sender. The first forty characters. You can't open them, and you can't reply.

At first it's the best power in the world: you ace the pop quiz, stay dry in a storm nobody saw coming, and post tomorrow's news a day early. Then you learn the rule: tomorrow keeps count. Erase one notification, and tomorrow sends back two. And one night your lock screen says: Mom. 14 missed calls. Tomorrow, 6:12 p.m.

Would you want to see tomorrow's notifications?

New What If story every day. Subscribe!

Know the signs of a stroke: F.A.S.T. (Face drooping, Arm weakness, Speech difficulty, Time to call 911).

Sources:
- ~46 push notifications a day: Airship, 2019 survey of U.S. smartphone users
- Forgetting curve: Hermann Ebbinghaus
- 5-day forecasts ~90% accurate, 10-day ~50%: NOAA SciJinks
- Phantom vibrations: Drouin et al. (2012), Computers in Human Behavior
- Teens need 8–10 hours of sleep: American Academy of Sleep Medicine
- ~1.9 million neurons lost per minute in a stroke: Saver (2006), Stroke
- Clot-busting treatment window (3–4.5 hours): AHA/ASA guidelines
- A stroke every ~40 seconds in the U.S.: CDC
- Favorites can break through Do Not Disturb: iOS Focus / Android starred contacts

This story is fiction. The science facts are real.

#whatif #animation #notifications
```

Cấu trúc:

1. **Đoạn 1:** đặt người xem vào tình huống và nêu luật chơi.
2. **Đoạn 2:** cái lợi trước, rồi đến cái giá ("tomorrow keeps count"). Kết bằng đúng chi tiết trên thumbnail (14 missed calls, 6:12 p.m.).
3. **Câu hỏi cho người xem**, sau đó là lời kêu gọi đăng ký.
4. **Dòng F.A.S.T.:** video có cảnh đột quỵ, nên thêm thông điệp an toàn như phần kiểm chứng cuối video.
5. **Nguồn:** theo quy tắc prompt T4 (mọi số liệu phải ghi nguồn), lấy từ mục F của `T4_02_tomorrows_notifications.md`.
6. **Hashtag:** `#whatif #animation` cộng 1 hashtag chủ đề.

## 3. Tags (12 tag, 250/500 ký tự)

```text
what if your phone showed tomorrow, what if, tomorrow's notifications, phone from the future, what if you could see the future, text from tomorrow, see the future, what if animation, animated story, stickman animation, what if scenarios, hypothetical
```

| Nhóm | Tags |
|---|---|
| Tiêu đề | what if your phone showed tomorrow |
| Chủ đề | tomorrow's notifications, phone from the future, what if you could see the future, text from tomorrow, see the future |
| Nền (số kênh đối thủ dùng) | what if (28), what if animation (20), animated story (19), stickman animation (18), what if scenarios (14), hypothetical (10) |

## 4. Trước khi bấm đăng

- [ ] Kiểm lại các nguồn ở mục 2. Kịch bản ghi rõ là "kiểm tra lại trước khi đăng".
- [ ] Thumbnail: `D_pick_up.jpg`. Nếu kênh có Test & Compare thì thêm `T4_02_thumbnail_DANG.jpg` (bản A).
- [ ] Giờ đăng: 10:00 hoặc 15:00 giờ miền Đông Mỹ (22:00 hoặc 03:00 giờ VN), theo kế hoạch nội dung.
- [ ] Đánh giá video sau 14 ngày, không phải sau 1–2 ngày.
