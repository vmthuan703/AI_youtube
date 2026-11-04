# Mô tả kênh: học từ đối thủ

Nguồn dữ liệu:

- Mô tả kênh lấy từ YouTube API ngày 2026-11-04, cột `API: mô tả kênh` trong `data/channels_2026-11-04.csv` (nhánh `split/a-research`).
- Hiệu quả kênh lấy từ `reports/2026-W45/competitors.csv` (nhánh `research/reports`).

## 1. Mô tả kênh có giúp tăng view không?

- **Gần như không.**
  - Jeremy Bearimy (32,8 N sub, trung vị 87 N view) chỉ để một câu đùa.
  - ObviouslyYou (max 396 N) chỉ ghi "thanks for Watching ;)".
  - View đến từ thumbnail, tiêu đề và chủ đề.
- **Mô tả vẫn có ích ở 3 chỗ:**
  - Dòng đầu hiện ngay dưới tên kênh, quyết định khách ghé trang kênh có bấm đăng ký không.
  - Từ khoá giúp YouTube hiểu kênh nói về gì.
  - Email giúp nhà tài trợ liên hệ.

## 2. Mẫu chung của các kênh có mô tả nghiêm túc

| Kênh | Sub | Trung vị view | Dòng đầu |
|---|---|---|---|
| IFOLOGY | 51,8 N | 96.576 | One question. One impossible idea. One story that follows it all the way. |
| ConChaser | 14,9 N | 174.002 | Reality is strange enough. Now imagine breaking its rules. |
| Manifesting | 4,8 N | 31.421 | Welcome to Manifesting! |
| DOOMPERK | 3,8 N | 25.634 | What if you could stop time, restart your day, or become the smartest person on Earth? |
| OTHERWISE | 3,4 N | 45.657 | Your life, otherwise. |
| Price of If | 3,4 N | 9.202 | What if you could teleport? Stop time? Never sleep? |

Các kênh này dùng cùng một cấu trúc, dài khoảng 300–550 ký tự:

1. **Dòng đầu là câu chốt ngắn**, không mở bằng "Welcome to…". Kênh lớn nhất và kênh có trung vị cao nhất đều làm vậy.
2. **2–3 câu "What if…?" làm ví dụ**: vừa nêu rõ thể loại, vừa chứa từ khoá.
3. **Lời hứa của kênh:** đi đến tận cùng câu chuyện, có khoa học thật, có cú twist hoặc cái giá.
4. **Nhịp đăng:** "every week" hoặc "every day".
5. **Kêu gọi bình luận:** "tell us which what if… next".
6. **Email liên hệ hợp tác.**

Cần tránh trùng: các câu "every power has a price/catch" đã có 3 kênh dùng (Price of If, If Catch, DOOMPERK).
Mô tả của mình dùng hình ảnh "hoá đơn" (the bill) để nói cùng ý mà không trùng chữ.

## 3. Mô tả đề xuất (tiếng Anh, 538 ký tự, giới hạn của YouTube là 1.000)

```text
You get one impossible upgrade. You also get the bill.

What if your phone showed tomorrow's notifications? What if your memory was 100x better? What if you could see everyone's search history? IfAhead drops you into one "what if" and follows it all the way: the wins, the cost nobody warned you about, and the twist at the end.

Animated stick-figure stories told to YOU, with real science checked and sourced in every description.

New what-if story every day. Tell us in the comments which power we should test next.

Business: [email]
```

| Phần | Lấy từ mẫu nào | Điểm riêng của mình |
|---|---|---|
| Dòng đầu (54 ký tự, không bị cắt) | Câu chốt ngắn kiểu IFOLOGY, ConChaser | Ngôi "you" + cái giá: đúng chất các kịch bản T4 |
| 3 câu What if | DOOMPERK, Price of If | Lấy đúng 3 video thật của kênh: T4 #2, A1, B1 |
| "follows it all the way… twist" | IFOLOGY, One Small If | Tách rõ 3 phần: được gì, mất gì, twist |
| "real science checked and sourced" | If Catch, Ifsphere | Đúng quy tắc prompt T4: mọi số liệu phải kiểm và ghi nguồn |
| "every day" | — | Khớp kế hoạch 2 video/ngày |

Bản ngắn (153 ký tự), dùng nếu muốn tối giản như OTHERWISE:

```text
One impossible power. One real cost. You're in the middle of it.

Animated what-if stories with real science and a twist at the end. New story every day.
```
