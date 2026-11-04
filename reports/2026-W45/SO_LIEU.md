# Số liệu đối thủ tuần 2026-W45

- **Ngày nghiên cứu:** 2026-11-04 (tạo tự động bởi `market_watch.py weekly`)
- **Khoảng dữ liệu:** 2026-10-29 → 2026-11-04 · 2 snapshot (2026-11-03, 2026-11-04)
- **Phạm vi ô What-If Fiction × Mỹ:** quốc gia US, ngôn ngữ en, 20 truy vấn tìm kiếm đã chạy, video đăng trong 90 ngày khi tìm, kênh theo dõi chi tiết bên dưới

## What-If Fiction × Mỹ

Cỡ mẫu: 136 kênh có video dài · 838 video dài ≥ 4 phút (gộp tìm kiếm + theo dõi) · 51 kênh theo dõi với 744 video dài. Bộ lọc tiêu đề: `\bwhat\s*if\b|\bhypothetical\b|\bimagine if\b|\bwhat would happen if\b`.

### Bảng chấm ô

| Điều kiện | Ngưỡng | Số đo | Kết quả |
|---|---|---|---|
| Có kênh ≤ 3 tháng đã có video ≥ 100k | có |  Jeremy Bearimy, ConChaser, DOOMPERK, Earth Tipping, IFOLOGY (+28 kênh) | đạt |
| Tuổi trung vị 5 kênh có video to nhất | ≤ 12 tháng | 57.3 tháng (ngày tạo kênh, video cũ nhất) | không |
| view/sub trung vị (5 kênh đó) | ≥ 10× | 78.6 | đạt |
| Số video dài ≥ 100k | ≥ 8 (cần, không đủ) | 220 | đạt |
| View trung vị của video ≥ 100k | 150k–600k | 256.989 | đạt |
| Kênh đúng ngách (top 5, tự động theo tiêu đề) | ≥ 80% | 2/2 kênh có đủ tiêu đề | — |

5 kênh có video to nhất (dùng cho 3 dòng tuổi, view/sub, đúng ngách; **cần đọc tay xác minh đúng ngách**, kênh sai thì thêm vào `exclude_channels` trong config):

| Kênh | Tuổi (ngày) | Sub | Video to nhất | Tỉ lệ tiêu đề khớp |
|---|---|---|---|---|
| Ifverse | 1.742 | 59.500 | 4.679.653 | chưa theo dõi |
| Minute Zero | 25 | 21.600 | 2.241.643 | 100% |
| Peekaboo Kidz | 4.533 | 7.910.000 | 1.886.460 | chưa theo dõi |
| Kian Odyssey | 2.401 | 4.940 | 1.862.452 | chưa theo dõi |
| Itadorists | 316 | 42.700 | 1.830.971 | 85% |

**Kết luận số: CẦN THEO DÕI.** Tuổi kênh dự báo mạnh nhất. View trung vị càng cao thì cửa càng đóng.

### Kênh mới thắng (≤ 180 ngày, có video dài ≥ 100k)

| Kênh | Tuổi (ngày) | Sub | Video to nhất |
|---|---|---|---|
| Minute Zero | 25 | 21.600 | 2.241.643 |
| Araragi | 116 | 22.700 | 1.374.705 |
| ConChaser | 11 | 14.600 | 1.313.338 |
| OminiAM | 29 | 6.340 | 1.142.835 |
|  Jeremy Bearimy | 24 | 32.000 | 1.062.186 |
| Earth Tipping | 36 | 1.500 | 943.197 |
| Manifesting | 23 | 4.740 | 942.459 |
| IFOLOGY | 25 | 51.600 | 902.342 |
| What If Animations | 32 | 6.080 | 875.857 |
| Miko | 18 | 7.300 | 715.276 |
| IFShift | 18 | 3.140 | 688.135 |
| OTHERWISE | 16 | 3.290 | 587.098 |
| Skylox Story | 12 | 189.000 | 508.788 |
| ŌTSUTSUKI UNIVERSE! | 112 | 38.800 | 395.516 |
| What if U click | 19 | 1.670 | 388.406 |

### Đối thủ đang theo dõi

| Kênh | Tuổi (ngày) | Sub | +Sub | Video dài | Đăng trong tuần | Trung vị view | Video bung | ≥100k | +View tuần | Video to nhất |
|---|---|---|---|---|---|---|---|---|---|---|
|  Jeremy Bearimy | 24 | 32.000 | — | 35 | 13 | 87.077 | 1 | 16 | 724.072 | What IF You Could See Who Has a Crush on You? |
| ConChaser | 11 | 14.600 | — | 12 | 7 | 174.002 | 0 | 8 | 169.171 | What If You Could See Everyone's Future Wealth? |
| IFOLOGY | 25 | 51.600 | — | 36 | 12 | 96.576 | 0 | 18 | 83.256 | What IF You Were 10x Faster? |
| What If Hero | 16 | 1.340 | — | 12 | 6 | 11.428 | 0 | 0 | 47.320 | What If Everyone Could See YOUR Future Wealth? |
| DOOMPERK | 15 | 3.760 | — | 16 | 8 | 25.633 | 1 | 2 | 42.829 | What If You Gained 1 SUPERPOWER Every Day? |
| IFopposite  | 21 | 5.360 | — | 16 | 7 | 11.827 | 2 | 2 | 33.092 | What If You Had Infinite IQ at School? |
| OminiAM | 29 | 6.340 | — | 12 | 3 | 7.330 | 4 | 4 | 25.410 | What If Every Human Disappeared Right Now? |
| Price of If | 36 | 3.340 | — | 20 | 6 | 9.202 | 1 | 1 | 23.958 | What IF You Could See Everyone's Soulmate ? |
| One Small If | 22 | 5.260 | — | 16 | 5 | 16.812 | 1 | 1 | 23.870 | What If You Doubled in Size Every Hour? |
| OTHERWISE | 16 | 3.290 | — | 6 | 1 | 45.657 | 1 | 2 | 21.063 | What If You Were Reborn With All Your Memories? |
| Manifesting | 23 | 4.740 | — | 7 | 1 | 31.421 | 1 | 2 | 18.975 | What if your IQ was 10x higher ? |
| Ifsphere | 18 | 4.840 | — | 25 | 4 | 5.005 | 3 | 2 | 10.105 | What If You Could Breathe Underwater? |
| ObviouslyYou | 24 | 4.080 | — | 14 | 3 | 14.664 | 1 | 1 | 8.553 | POV: You’re Trapped On An Island With Your Crush (Part 1) |
| Maybeverse | 20 | 1.710 | — | 15 | 5 | 8.093 | 2 | 1 | 6.824 | What If You and Your Crush Lived a Googolplex Years? |
| WAnim | 21 | 1.730 | — | 8 | 1 | 27.962 | 1 | 1 | 4.733 | What If It Rained and Couldn't Stop? |
| Twivio | 19 | 576 | — | 13 | 4 | 1.246 | 3 | 0 | 762 | What IF You Had Laser Eyes… But Every Shot Made You Blind? |
| What If Animations | 32 | 6.080 | — | 26 | 8 | 1.273 | 2 | 1 | 667 | What if you shrank and couldn't stop? |
| Super Logic | 73 | 6.650 | — | 5 | 1 | 21.458 | 0 | 1 | 630 | What If You Could Travel in Time |
| WhatIf Functions | 13 | 449 | — | 13 | 6 | 437 | 2 | 0 | 507 | What If You Were Reborn With All Your Memories? |
| If Catch | 16 | 1.840 | — | 9 | 2 | 9.131 | 1 | 1 | 389 | What If You Could See Every Lie? |
| Imagine Otherwise | 21 | 206 | — | 12 | 5 | 117.0 | 1 | 0 | 222 | What If You Were 100x Smaller? |
| STELVO | 22 | 561 | — | 18 | 3 | 1.597 | 0 | 0 | 169 | What If You Traveled at the Speed of Light? |
| Ifcinema | 24 | 658 | — | 19 | 2 | 1.574 | 1 | 0 | 73 | What If You Healed 10x Faster? |
| One Odd Thing | 19 | 322 | — | 6 | 2 | 217.0 | 2 | 0 | 28 | What If You Aged 10x Slower? |
| Could've Been Tales | 20 | 629 | — | 6 | 2 | 554.5 | 1 | 0 | 11 | What If You Could See 1 Hour Into the Future? |
| Hypothetica | 19 | 12 | — | 6 | 1 | 65.5 | 1 | 0 | 9 | What If You Could Tell When Anyone Is Lying? |
| Minute Zero | 25 | 21.600 | — | 15 | 3 | 48.040 | 2 | 5 | — | What If You Sped Up and Couldn’t Stop? |
| Itadorists | 316 | 42.700 | — | 48 | 1 | 52.022 | 4 | 15 | — | What If Modulo Yuji Was Reborn With His Memories? |
| Araragi | 116 | 22.700 | — | 25 | 1 | 39.721 | 2 | 6 | — | What If Ino Saw Naruto’s Memories? |
| Earth Tipping | 36 | 1.500 | — | 16 | 5 | 1.581 | 1 | 1 | — | What If All the Ice on Earth Melted? |

### Video bung (≥ 10× trung vị của chính kênh) · 64 video

| Kênh | Tiêu đề | View | × trung vị | Tuổi (ngày) |
|---|---|---|---|---|
| Stick Revival | [What If Only Two People Had to Repopulate the Earth?](https://www.youtube.com/watch?v=y0lMf_kmi6E) | 316.185 | 1.154 | 11 |
| What If Animations | [What if you shrank and couldn't stop?](https://www.youtube.com/watch?v=YayPaipjNAM) | 875.857 | 688.0 | 29 |
| Earth Tipping | [What If All the Ice on Earth Melted?](https://www.youtube.com/watch?v=syCnXSCxrZE) | 943.197 | 596.6 | 36 |
| Vanessa Harris | [What If 8 Billion People Jumped at Once?](https://www.youtube.com/watch?v=L3pK2pNNKrw) | 330.797 | 310.5 | 18 |
| One Odd Thing | [What If You Aged 10x Slower?](https://www.youtube.com/watch?v=dbglZFlsdLg) | 56.487 | 260.3 | 18 |
| Nearside | [What If You Were the Last Man on Earth?](https://www.youtube.com/watch?v=1QlZmTr2bkU) | 252.681 | 214.5 | 17 |
| What if U click | [What If You Aged Backwards?](https://www.youtube.com/watch?v=SeigWp8dGPo) | 388.406 | 213.5 | 4 |
| Imagine Otherwise | [What If You Were 100x Smaller?](https://www.youtube.com/watch?v=NnXqy47PhrU) | 21.159 | 180.8 | 21 |
| Sual | [What If an Immortal Snail Chased You Forever?](https://www.youtube.com/watch?v=LYzhLL5Mbwk) | 65.636 | 160.5 | 7 |
| OminiAM | [What If Every Human Disappeared Right Now?](https://www.youtube.com/watch?v=b6jmbFcJZCY) | 1.142.835 | 155.9 | 27 |
| Nearside | [What Early Humans Did For Pleasure? (Time-Travel)](https://www.youtube.com/watch?v=AbRIsWpfIg4) | 105.982 | 90.0 | 14 |
| IFShift | [What If Your Reflexes Were 100x Faster?](https://www.youtube.com/watch?v=ric3a4rv54M) | 688.135 | 75.8 | 17 |
| Mirage | [What IF You Found a Settings Menu for Your Body?](https://www.youtube.com/watch?v=_ko90JwL4vM) | 193.799 | 73.2 | 3 |
| Could've Been Tales | [What If You Could See 1 Hour Into the Future?](https://www.youtube.com/watch?v=aX7XDXwQKCI) | 38.876 | 70.1 | 20 |
| OminiAM | [What If You Traveled One Billion Years Into the Future?](https://www.youtube.com/watch?v=_lu85gSD39k) | 481.118 | 65.6 | 16 |
| Ifsphere | [What If You Could Breathe Underwater?](https://www.youtube.com/watch?v=ggRf0ZYzrr8) | 295.581 | 59.1 | 15 |
| WhatIf Functions | [What If You Were Reborn With All Your Memories?](https://www.youtube.com/watch?v=BQdEcPOYOUY) | 24.969 | 57.1 | 12 |
| What If Levels | [What If You Had 10,000 IQ?](https://www.youtube.com/watch?v=JOr27wqb910) | 365.572 | 53.5 | 16 |
| IFSIM FILMS | [What If Your Body Healed 100X Faster?](https://www.youtube.com/watch?v=Azr3pLPXEyg) | 53.364 | 51.3 | 14 |
| Minute Zero | [What If You Sped Up and Couldn’t Stop?](https://www.youtube.com/watch?v=gpLC_ELulyg) | 2.241.643 | 46.7 | 23 |
| One Odd Thing | [What If Your Nose Was 10,000x Stronger?](https://www.youtube.com/watch?v=_bENAqQu83U) | 10.117 | 46.6 | 19 |
| OminiAM | [What If You Were the Last Human on Earth?](https://www.youtube.com/watch?v=DgftZCQe8sI) | 327.700 | 44.7 | 17 |
| OminiAM | [What If Humans Never Discovered Clothes?](https://www.youtube.com/watch?v=n1CYFTKR_B0) | 324.283 | 44.2 | 15 |
| Minute Zero | [What If Time Sped Up and Couldn't Stop?](https://www.youtube.com/watch?v=5gbgKYMEySI) | 2.102.905 | 43.8 | 22 |
| The If Lab | [What If You Could Read Minds?](https://www.youtube.com/watch?v=2fDVRWoc6vk) | 109.316 | 41.0 | 3 |
| Itadorists | [What If Modulo Yuji Was Reborn With His Memories?](https://www.youtube.com/watch?v=6bfqwupwzR0) | 1.830.971 | 35.2 | 220 |
| Ifsphere | [What If You Could See Everyone's Hidden Secrets?](https://www.youtube.com/watch?v=TsZ7i-804eM) | 175.273 | 35.0 | 11 |
| Araragi | [What If Ino Saw Naruto’s Memories?](https://www.youtube.com/watch?v=DOGyvQflw9Y) | 1.374.705 | 34.6 | 26 |
| Manifesting | [What if your IQ was 10x higher ?](https://www.youtube.com/watch?v=ncziskWQbQA) | 942.459 | 30.0 | 20 |
| Itadorists | [What If Modulo Yuji Was at Shibuya?](https://www.youtube.com/watch?v=IOWJJ-kLG2g) | 1.470.659 | 28.3 | 228 |

## Giới hạn của số liệu

- **Thiên lệch sống sót:** chỉ thấy kênh còn sống và hiện ra trong tìm kiếm. Tỉ lệ thắng thật chưa đo được.
- **Tuổi kênh là ước lượng:** lấy từ video cũ nhất khi đã đọc đủ danh sách upload, nếu không thì lấy ngày tạo kênh.
  Kênh cũ đổi chủ đề hoặc xoá video cũ sẽ trông trẻ hơn thực tế.
- **Lượt xem là tích luỹ:** video mới đăng chưa kịp lên. Cột tăng trong tuần chỉ có khi có ≥ 2 snapshot.
- **"Bung = ≥ 10× trung vị của chính kênh"** là ngưỡng tự đặt, không phải chuẩn ngành. Kênh có < 3 video dài thì không tính.
- **Kênh đúng ngách** chấm tự động bằng bộ lọc tiêu đề (`title_regex`): kênh đúng ngách khi ≥ `min_niche_share`
  video dài khớp. Bộ lọc dựa trên chữ, vẫn nên đọc tay 10 tiêu đề gần nhất của kênh top.


File kèm theo: `scorecard.csv`, `competitors.csv`, `bung_videos.csv`, `titles.csv` (toàn bộ tiêu đề để đọc tay, gom chủ đề bung ở ≥ 2 kênh).
