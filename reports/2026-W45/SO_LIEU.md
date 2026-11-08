# Số liệu đối thủ tuần 2026-W45

- **Ngày nghiên cứu:** 2026-11-08 (tạo tự động bởi `market_watch.py weekly`)
- **Khoảng dữ liệu:** 2026-11-02 → 2026-11-08 · 5 snapshot (2026-11-03, 2026-11-04, 2026-11-06, 2026-11-07, 2026-11-08)
- **Phạm vi ô What-If Fiction × Mỹ:** quốc gia US, ngôn ngữ en, 20 truy vấn tìm kiếm đã chạy, video đăng trong 90 ngày khi tìm, kênh theo dõi chi tiết bên dưới

## What-If Fiction × Mỹ

Cỡ mẫu: 166 kênh có video dài · 1056 video dài ≥ 4 phút (gộp tìm kiếm + theo dõi) · 59 kênh theo dõi với 923 video dài. Bộ lọc tiêu đề: `\bwhat\s*if\b|\bhypothetical\b|\bimagine if\b|\bwhat would happen if\b`.

### Bảng chấm ô

| Điều kiện | Ngưỡng | Số đo | Kết quả |
|---|---|---|---|
| Có kênh ≤ 3 tháng đã có video ≥ 100k | có |  Jeremy Bearimy, ConChaser, DOOMPERK, Earth Tipping, IFANIME (+37 kênh) | đạt |
| Tuổi trung vị 5 kênh có video to nhất | ≤ 12 tháng | 57.4 tháng (ngày tạo kênh, video cũ nhất) | không |
| view/sub trung vị (5 kênh đó) | ≥ 10× | 77.3 | đạt |
| Số video dài ≥ 100k | ≥ 8 (cần, không đủ) | 283 | đạt |
| View trung vị của video ≥ 100k | 150k–600k | 248.532 | đạt |
| Kênh đúng ngách (top 5, tự động theo tiêu đề) | ≥ 80% | 2/2 kênh có đủ tiêu đề | — |

5 kênh có video to nhất (dùng cho 3 dòng tuổi, view/sub, đúng ngách; **cần đọc tay xác minh đúng ngách**, kênh sai thì thêm vào `exclude_channels` trong config):

| Kênh | Tuổi (ngày) | Sub | Video to nhất | Tỉ lệ tiêu đề khớp |
|---|---|---|---|---|
| Ifverse | 1.746 | 60.800 | 4.701.947 | chưa theo dõi |
| Minute Zero | 29 | 22.400 | 2.321.374 | 100% |
| Peekaboo Kidz | 4.537 | 7.920.000 | 1.910.634 | chưa theo dõi |
| Kian Odyssey | 2.405 | 4.960 | 1.873.995 | chưa theo dõi |
| Itadorists | 320 | 42.900 | 1.849.487 | 85% |

**Kết luận số: CẦN THEO DÕI.** Tuổi kênh dự báo mạnh nhất. View trung vị càng cao thì cửa càng đóng.

### Kênh mới thắng (≤ 180 ngày, có video dài ≥ 100k)

| Kênh | Tuổi (ngày) | Sub | Video to nhất |
|---|---|---|---|
| Minute Zero | 29 | 22.400 | 2.321.374 |
|  Jeremy Bearimy | 28 | 46.200 | 1.715.109 |
| ConChaser | 15 | 19.300 | 1.590.112 |
| Araragi | 120 | 23.600 | 1.435.194 |
| OminiAM | 33 | 6.780 | 1.185.836 |
| Manifesting | 27 | 5.270 | 964.640 |
| Earth Tipping | 40 | 1.510 | 962.421 |
| IFOLOGY | 29 | 54.900 | 950.875 |
| The Hypothetical Room | 6 | 5.000 | 881.575 |
| What If Animations | 36 | 6.090 | 877.902 |
| Miko | 22 | 8.480 | 827.462 |
| Skylox Story | 16 | 221.000 | 760.411 |
| IFShift | 22 | 3.270 | 737.352 |
| OTHERWISE | 20 | 4.390 | 711.834 |
| What if U click | 23 | 3.350 | 672.373 |

### Đối thủ đang theo dõi

| Kênh | Tuổi (ngày) | Sub | +Sub | Video dài | Đăng trong tuần | Trung vị view | Video bung | ≥100k | +View tuần | Video to nhất |
|---|---|---|---|---|---|---|---|---|---|---|
|  Jeremy Bearimy | 28 | 46.200 | — | 43 | 13 | 76.112 | 4 | 20 | 3.917.804 | What IF You Could See Who Has a Crush on You? |
| ConChaser | 15 | 19.300 | — | 16 | 7 | 137.531 | 2 | 9 | 1.652.309 | What If You Could See Everyone's Future Wealth? |
| ŌTSUTSUKI UNIVERSE! | 116 | 41.400 | 2.600 | 53 | 3 | 141.104 | 0 | 31 | 749.812 | (Full Story) WNHAT IF NARUTO WAS REBORN AS AN UCHIHA? |
| IFOLOGY | 29 | 54.900 | — | 44 | 11 | 86.544 | 1 | 20 | 660.565 | What IF You Were 10x Faster? |
| DOOMPERK | 19 | 5.580 | — | 21 | 7 | 13.212 | 4 | 5 | 569.176 | What If You Gained 1 SUPERPOWER Every Day? |
| What if U click | 23 | 3.350 | 1.680 | 23 | 7 | 3.789 | 4 | 2 | 507.682 | What If You Aged Backwards? |
| The Hypothetical Room | 6 | 5.000 | 1.880 | 6 | 6 | 87.474 | 1 | 3 | 496.840 | What If Humans Never Invented Clothes? |
| OTHERWISE | 20 | 4.390 | — | 7 | 2 | 53.314 | 1 | 3 | 400.146 | What If You Were Reborn With All Your Memories? |
| What If Hero | 20 | 2.460 | — | 15 | 5 | 22.178 | 0 | 3 | 391.773 | What If You Got Stuck on a Girls Only Island? |
| Skylox Story | 16 | 221.000 | 32.000 | 3 | 2 | 244.515 | 0 | 2 | 347.014 | What If the WHOLE WORLD Became Roblox? 😱 |
| Miko | 22 | 8.480 | 1.180 | 10 | 4 | 24.291 | 1 | 3 | 247.110 | What If You Could See Everyone’s Lie Count? |
| Minute Zero | 29 | 22.400 | 800 | 15 | 0 | 48.810 | 3 | 5 | 235.263 | What If You Sped Up and Couldn’t Stop? |
| Mirage | 16 | 2.220 | 580 | 24 | 7 | 1.582 | 6 | 2 | 221.782 | What IF You Found a Settings Menu for Your Body? |
| Price of If | 40 | 4.270 | — | 27 | 9 | 9.074 | 1 | 1 | 214.939 | What IF You Could See Everyone's Soulmate ? |
| IFopposite  | 25 | 6.000 | — | 16 | 3 | 18.426 | 1 | 3 | 195.116 | What If You Had Infinite IQ at School? |
| The If Lab | 8 | 794 | 404 | 5 | 3 | 1.685 | 1 | 1 | 188.715 | What If You Could Read Minds? |
| Manifesting | 27 | 5.270 | — | 9 | 2 | 7.369 | 3 | 3 | 182.160 | What if your IQ was 10x higher ? |
| Araragi | 120 | 23.600 | 900 | 25 | 0 | 43.440 | 1 | 6 | 181.301 | What If Ino Saw Naruto’s Memories? |
| OminiAM | 33 | 6.780 | — | 15 | 3 | 5.690 | 4 | 4 | 178.029 | What If Every Human Disappeared Right Now? |
| One Small If | 26 | 5.850 | — | 18 | 5 | 12.710 | 2 | 2 | 157.261 | What If You Doubled in Size Every Hour? |
| Then What? | 17 | 1.980 | 340 | 15 | 2 | 14.529 | 1 | 2 | 137.737 | What If Your Money Doubled Every Time You Blinked? |
| Nick ifverse | 13 | 1.920 | 330 | 5 | 1 | 16.574 | 1 | 1 | 124.303 | What If You Could See Everyone’s Love Meter? |
| Stick Revival | 17 | 362 | 58 | 13 | 6 | 204 | 3 | 1 | 96.795 | What If Only Two People Had to Repopulate the Earth? |
| What If Levels | 24 | 3.080 | 440 | 10 | 4 | 3.164 | 1 | 1 | 91.011 | What If You Had 10,000 IQ? |
| Lookif | 3 | 447 | 170 | 4 | 4 | 32.282 | 0 | 1 | 76.053 | What If You Could See Who Would Die for You? |
| Itadorists | 320 | 42.900 | 200 | 48 | 1 | 52.165 | 4 | 15 | 75.769 | What If Modulo Yuji Was Reborn With His Memories? |
| Nearside | 25 | 1.590 | 250 | 24 | 7 | 2.384 | 3 | 2 | 63.958 | What If You Were the Last Man on Earth? |
| Toonists | 246 | 11.000 | 400 | 15 | 1 | 48.429 | 0 | 4 | 62.926 | What If Team Avatar Were Reborn With Their Memories? |
| The Frame One | 25 | 5.440 | 280 | 9 | 0 | 34.355 | 1 | 2 | 60.016 | What If the Moon Fell and Couldn't Stop? |
| IFANIME | 15 | 5.400 | 250 | 8 | 3 | 14.897 | 2 | 2 | 59.833 | What If YOU Went Super Saiyan in Real Life? |

### Video bung (≥ 10× trung vị của chính kênh) · 95 video

| Kênh | Tiêu đề | View | × trung vị | Tuổi (ngày) |
|---|---|---|---|---|
| Stick Revival | [What If Only Two People Had to Repopulate the Earth?](https://www.youtube.com/watch?v=y0lMf_kmi6E) | 409.633 | 2.008 | 15 |
| What If Animations | [What if you shrank and couldn't stop?](https://www.youtube.com/watch?v=YayPaipjNAM) | 877.902 | 1.503 | 33 |
| Earth Tipping | [What If All the Ice on Earth Melted?](https://www.youtube.com/watch?v=syCnXSCxrZE) | 962.421 | 606.4 | 40 |
| Vanessa Harris | [What If 8 Billion People Jumped at Once?](https://www.youtube.com/watch?v=L3pK2pNNKrw) | 346.495 | 320.8 | 22 |
| Sual | [What If an Immortal Snail Chased You Forever?](https://www.youtube.com/watch?v=LYzhLL5Mbwk) | 70.474 | 268.5 | 11 |
| One Odd Thing | [What If You Aged 10x Slower?](https://www.youtube.com/watch?v=dbglZFlsdLg) | 56.557 | 255.3 | 22 |
| OminiAM | [What If Every Human Disappeared Right Now?](https://www.youtube.com/watch?v=b6jmbFcJZCY) | 1.185.836 | 208.4 | 31 |
| Mirage | [What IF You Found a Settings Menu for Your Body?](https://www.youtube.com/watch?v=_ko90JwL4vM) | 318.928 | 201.5 | 7 |
| What if U click | [What If You Aged Backwards?](https://www.youtube.com/watch?v=SeigWp8dGPo) | 672.373 | 177.5 | 8 |
| The If Lab | [What If You Could Read Minds?](https://www.youtube.com/watch?v=2fDVRWoc6vk) | 294.332 | 174.7 | 7 |
| Imagine Otherwise | [What If You Were 100x Smaller?](https://www.youtube.com/watch?v=NnXqy47PhrU) | 21.352 | 146.2 | 25 |
| What If Levels | [What If You Had 10,000 IQ?](https://www.youtube.com/watch?v=JOr27wqb910) | 445.320 | 140.7 | 20 |
| Manifesting | [What if your IQ was 10x higher ?](https://www.youtube.com/watch?v=ncziskWQbQA) | 964.640 | 130.9 | 24 |
| Nearside | [What If You Were the Last Man on Earth?](https://www.youtube.com/watch?v=1QlZmTr2bkU) | 270.248 | 113.4 | 21 |
| IFShift | [What If Your Reflexes Were 100x Faster?](https://www.youtube.com/watch?v=ric3a4rv54M) | 737.352 | 100.6 | 21 |
| OminiAM | [What If You Traveled One Billion Years Into the Future?](https://www.youtube.com/watch?v=_lu85gSD39k) | 541.922 | 95.2 | 20 |
| If Catch | [What If You Could See Every Lie?](https://www.youtube.com/watch?v=bbyffZ0L67g) | 227.908 | 93.8 | 20 |
| Mirage | [What IF You Could See Who Would Save You & Who Would Watch You Die?](https://www.youtube.com/watch?v=HjGgc-c5U3I) | 127.052 | 80.3 | 6 |
| IFSIM FILMS | [What If Your Body Healed 100X Faster?](https://www.youtube.com/watch?v=Azr3pLPXEyg) | 53.447 | 75.9 | 18 |
| Could've Been Tales | [What If You Could See 1 Hour Into the Future?](https://www.youtube.com/watch?v=aX7XDXwQKCI) | 38.932 | 70.3 | 24 |
| Ifsphere | [What If You Could Breathe Underwater?](https://www.youtube.com/watch?v=ggRf0ZYzrr8) | 320.622 | 64.6 | 19 |
| OminiAM | [What If You Were the Last Human on Earth?](https://www.youtube.com/watch?v=DgftZCQe8sI) | 360.338 | 63.3 | 21 |
| OminiAM | [What If Humans Never Discovered Clothes?](https://www.youtube.com/watch?v=n1CYFTKR_B0) | 336.327 | 59.1 | 19 |
| What if U click | [What If Your Mom Aged Backwards?](https://www.youtube.com/watch?v=_kgsrQtmRlg) | 201.352 | 53.1 | 1 |
| WhatIf Functions | [What If You Were Reborn With All Your Memories?](https://www.youtube.com/watch?v=BQdEcPOYOUY) | 25.505 | 52.3 | 16 |
| Minute Zero | [What If You Sped Up and Couldn’t Stop?](https://www.youtube.com/watch?v=gpLC_ELulyg) | 2.321.374 | 47.6 | 27 |
| What If Animations | [What if you were swallowed into the human body?](https://www.youtube.com/watch?v=hqX2xMW0DQk) | 27.728 | 47.5 | 31 |
| One Odd Thing | [What If Your Nose Was 10,000x Stronger?](https://www.youtube.com/watch?v=_bENAqQu83U) | 10.132 | 45.7 | 23 |
| Nearside | [What Early Humans Did For Pleasure? (Time-Travel)](https://www.youtube.com/watch?v=AbRIsWpfIg4) | 106.600 | 44.7 | 18 |
| Minute Zero | [What If Time Sped Up and Couldn't Stop?](https://www.youtube.com/watch?v=5gbgKYMEySI) | 2.128.220 | 43.6 | 26 |

## Giới hạn của số liệu

- **Thiên lệch sống sót:** chỉ thấy kênh còn sống và hiện ra trong tìm kiếm. Tỉ lệ thắng thật chưa đo được.
- **Tuổi kênh là ước lượng:** lấy từ video cũ nhất khi đã đọc đủ danh sách upload, nếu không thì lấy ngày tạo kênh.
  Kênh cũ đổi chủ đề hoặc xoá video cũ sẽ trông trẻ hơn thực tế.
- **Lượt xem là tích luỹ:** video mới đăng chưa kịp lên. Cột tăng trong tuần chỉ có khi có ≥ 2 snapshot.
- **"Bung = ≥ 10× trung vị của chính kênh"** là ngưỡng tự đặt, không phải chuẩn ngành. Kênh có < 3 video dài thì không tính.
- **Kênh đúng ngách** chấm tự động bằng bộ lọc tiêu đề (`title_regex`): kênh đúng ngách khi ≥ `min_niche_share`
  video dài khớp. Bộ lọc dựa trên chữ, vẫn nên đọc tay 10 tiêu đề gần nhất của kênh top.


File kèm theo: `scorecard.csv`, `competitors.csv`, `bung_videos.csv`, `titles.csv` (toàn bộ tiêu đề để đọc tay, gom chủ đề bung ở ≥ 2 kênh).
