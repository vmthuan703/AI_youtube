# Số liệu đối thủ tuần 2026-W46

- **Ngày nghiên cứu:** 2026-11-15 (tạo tự động bởi `market_watch.py weekly`)
- **Khoảng dữ liệu:** 2026-11-09 → 2026-11-15 · 6 snapshot (2026-11-10, 2026-11-11, 2026-11-12, 2026-11-13, 2026-11-14, 2026-11-15)
- **Phạm vi ô What-If Fiction × Mỹ:** quốc gia US, ngôn ngữ en, 20 truy vấn tìm kiếm đã chạy, video đăng trong 90 ngày khi tìm, kênh theo dõi chi tiết bên dưới

## What-If Fiction × Mỹ

Cỡ mẫu: 175 kênh có video dài · 1235 video dài ≥ 4 phút (gộp tìm kiếm + theo dõi) · 59 kênh theo dõi với 1099 video dài. Bộ lọc tiêu đề: `\bwhat\s*if\b|\bhypothetical\b|\bimagine if\b|\bwhat would happen if\b`.

### Bảng chấm ô

| Điều kiện | Ngưỡng | Số đo | Kết quả |
|---|---|---|---|
| Có kênh ≤ 3 tháng đã có video ≥ 100k | có |  Jeremy Bearimy, Any Minute Now, ConChaser, DOOMPERK, Earth Tipping (+44 kênh) | đạt |
| Tuổi trung vị 5 kênh có video to nhất | ≤ 12 tháng | 57.7 tháng (ngày tạo kênh, video cũ nhất) | không |
| view/sub trung vị (5 kênh đó) | ≥ 10× | 74.5 | đạt |
| Số video dài ≥ 100k | ≥ 8 (cần, không đủ) | 362 | đạt |
| View trung vị của video ≥ 100k | 150k–600k | 270.580 | đạt |
| Kênh đúng ngách (top 5, tự động theo tiêu đề) | ≥ 80% | 2/2 kênh có đủ tiêu đề | — |

5 kênh có video to nhất (dùng cho 3 dòng tuổi, view/sub, đúng ngách; **cần đọc tay xác minh đúng ngách**, kênh sai thì thêm vào `exclude_channels` trong config):

| Kênh | Tuổi (ngày) | Sub | Video to nhất | Tỉ lệ tiêu đề khớp |
|---|---|---|---|---|
| Papa Joel | 2.736 | 3.030.000 | 4.942.895 | chưa theo dõi |
| Ifverse | 1.753 | 62.900 | 4.733.752 | chưa theo dõi |
| Joe Bartolozzi | 2.357 | 6.250.000 | 2.496.384 | chưa theo dõi |
| Minute Zero | 36 | 23.400 | 2.384.556 | 100% |
| ConChaser | 22 | 27.600 | 2.056.053 | 100% |

**Kết luận số: CẦN THEO DÕI.** Tuổi kênh dự báo mạnh nhất. View trung vị càng cao thì cửa càng đóng.

### Kênh mới thắng (≤ 180 ngày, có video dài ≥ 100k)

| Kênh | Tuổi (ngày) | Sub | Video to nhất |
|---|---|---|---|
| Minute Zero | 36 | 23.400 | 2.384.556 |
| ConChaser | 22 | 27.600 | 2.056.053 |
|  Jeremy Bearimy | 35 | 57.900 | 1.979.096 |
| The Hidden Why | 37 | 3.130 | 1.555.191 |
| Araragi | 127 | 24.900 | 1.532.337 |
| Hypo Room | 13 | 17.400 | 1.391.370 |
| OminiAM | 40 | 7.780 | 1.257.114 |
| Questionverse | 12 | 10.500 | 1.057.902 |
| IFOLOGY | 36 | 59.100 | 1.017.916 |
| Manifesting | 31 | 5.800 | 976.214 |
| Earth Tipping | 47 | 1.520 | 973.772 |
| What if U click | 30 | 5.550 | 942.723 |
| Miko | 29 | 10.200 | 920.417 |
| Skylox Story | 23 | 240.000 | 920.081 |
| What If Animations | 43 | 6.100 | 880.088 |

### Đối thủ đang theo dõi

| Kênh | Tuổi (ngày) | Sub | +Sub | Video dài | Đăng trong tuần | Trung vị view | Video bung | ≥100k | +View tuần | Video to nhất |
|---|---|---|---|---|---|---|---|---|---|---|
| DOOMPERK | 26 | 13.600 | 6.890 | 29 | 7 | 63.443 | 1 | 11 | 2.281.284 | What If You Had Infinite IQ in PRISON? |
|  Jeremy Bearimy | 35 | 57.900 | 7.300 | 57 | 13 | 77.366 | 6 | 26 | 1.893.003 | What IF You Could See Who Has a Crush on You? |
| ConChaser | 22 | 27.600 | 5.900 | 22 | 6 | 94.988 | 3 | 11 | 1.795.976 | What If You Could See Everyone's IQ? |
| Questionverse | 12 | 10.500 | 7.080 | 11 | 5 | 157.903 | 0 | 7 | 1.570.346 | What If You Were Stuck in a Bunker With Your Crush? |
| Stupid Dupid  | 9 | 21.800 | 13.640 | 19 | 13 | 80.314 | 0 | 7 | 1.412.691 | What If You Turned Into A Girl? |
| Hypo Room | 13 | 17.400 | 10.000 | 13 | 7 | 123.766 | 1 | 7 | 1.166.746 | What If Humans Never Invented Clothes? |
| ŌTSUTSUKI UNIVERSE! | 123 | 46.800 | 4.200 | 56 | 3 | 156.316 | 0 | 38 | 1.164.730 | (Full Story) WNHAT IF NARUTO WAS REBORN AS AN UCHIHA? |
| What if U click | 30 | 5.550 | 1.650 | 29 | 6 | 7.727 | 5 | 5 | 829.822 | What If You Aged Backwards? |
| All Answers | 1.395 | 11.900 | 1.400 | 28 | 4 | 45.910 | 3 | 11 | 692.524 | What If You Kept Getting Nicer and Couldn't Stop? |
| What If Hero | 27 | 5.140 | 1.920 | 20 | 5 | 46.974 | 0 | 7 | 655.004 | What If Everyone Could See How Many Kids You’ll Have? |
| IFOLOGY | 36 | 59.100 | 2.900 | 59 | 15 | 53.398 | 3 | 21 | 587.483 | What IF You Were 10x Faster? |
| Skylox Story | 23 | 240.000 | 10.000 | 6 | 3 | 169.572 | 0 | 4 | 328.353 | What If the WHOLE WORLD Became Roblox? 😱 |
| Lookif | 10 | 1.750 | 1.010 | 7 | 3 | 35.888 | 0 | 2 | 308.878 | What If You Could See Everyone's Real-Life Rating? |
| OminiAM | 40 | 7.780 | 740 | 16 | 2 | 6.914 | 4 | 4 | 290.294 | What If Every Human Disappeared Right Now? |
| Miko | 29 | 10.200 | 1.110 | 16 | 6 | 21.599 | 2 | 4 | 285.873 | What If You Could See Everyone’s Lie Count? |
| Milo Whatsit | 25 | 2.720 | 1.230 | 5 | 2 | 10.373 | 2 | 2 | 281.533 | What If You Earned $1 Every Millisecond? |
| WhatIfFunctions | 24 | 2.720 | 1.670 | 24 | 6 | 1.423 | 6 | 1 | 274.212 | What If Goku Was Trapped In The Time Chamber For 1000 Years? |
| IfYou Films | 21 | 3.260 | 610 | 14 | 5 | 20.862 | 1 | 4 | 249.773 | Zombie Outbreak: What If YOU Were Patient Zero? |
| Then What? | 24 | 2.750 | 610 | 15 | 0 | 22.488 | 0 | 3 | 214.071 | What If Your Money Doubled Every Time You Blinked? |
| Araragi | 127 | 24.900 | 900 | 25 | 0 | 48.275 | 1 | 7 | 179.513 | What If Ino Saw Naruto’s Memories? |
| The If Lab | 15 | 1.330 | 330 | 9 | 4 | 1.119 | 1 | 1 | 169.673 | What If You Could Read Minds? |
| OTHERWISE | 27 | 5.260 | 520 | 9 | 2 | 50.314 | 1 | 3 | 161.489 | What If You Were Reborn With All Your Memories? |
| Price of If | 47 | 5.400 | 710 | 38 | 10 | 7.470 | 3 | 2 | 153.498 | What IF You Could See Everyone's Soulmate ? |
| IFANIME | 22 | 6.590 | 560 | 13 | 5 | 10.530 | 2 | 2 | 141.221 | What If YOU Went Super Saiyan in Real Life? |
| Ifsphere | 29 | 5.580 | 460 | 32 | 3 | 4.706 | 4 | 2 | 135.323 | What If You Could Breathe Underwater? |
| Sacred Strawhat | 258 | 11.800 | 300 | 6 | 0 | 164.129 | 0 | 4 | 115.581 | What If Luffy Was Reborn With His Memories and Powers? |
| IFopposite  | 31 | 6.670 | 500 | 16 | 0 | 21.962 | 1 | 3 | 114.161 | What If You Had Infinite IQ at School? |
| One Small If | 33 | 6.530 | 450 | 23 | 5 | 9.905 | 2 | 2 | 108.306 | What If You Doubled in Size Every Hour? |
| Minute Zero | 36 | 23.400 | 600 | 15 | 0 | 49.718 | 3 | 5 | 100.507 | What If You Sped Up and Couldn’t Stop? |
| Manifesting | 31 | 5.800 | 280 | 3 | 0 | 366.489 | 0 | 3 | 92.099 | What If Your IQ Was 10x Higher? (The Terrifying Truth) |

### Video bung (≥ 10× trung vị của chính kênh) · 113 video

| Kênh | Tiêu đề | View | × trung vị | Tuổi (ngày) |
|---|---|---|---|---|
| Stick Revival | [What If Only Two People Had to Repopulate the Earth?](https://www.youtube.com/watch?v=y0lMf_kmi6E) | 515.519 | 2.678 | 22 |
| What If Animations | [What if you shrank and couldn't stop?](https://www.youtube.com/watch?v=YayPaipjNAM) | 880.088 | 1.521 | 40 |
| Earth Tipping | [What If All the Ice on Earth Melted?](https://www.youtube.com/watch?v=syCnXSCxrZE) | 973.772 | 1.460 | 47 |
| Just Suppose ? | [What If You Got Luckier and Couldn’t Stop?](https://www.youtube.com/watch?v=YIqBcaXygNQ) | 50.501 | 548.9 | 16 |
| The If Lab | [What If You Could Read Minds?](https://www.youtube.com/watch?v=2fDVRWoc6vk) | 557.066 | 497.8 | 14 |
| Vanessa Harris | [What If 8 Billion People Jumped at Once?](https://www.youtube.com/watch?v=L3pK2pNNKrw) | 363.156 | 333.0 | 29 |
| What If Levels | [What If You Had 10,000 IQ?](https://www.youtube.com/watch?v=JOr27wqb910) | 520.964 | 324.2 | 27 |
| If Catch | [What If You Could See Every Lie?](https://www.youtube.com/watch?v=bbyffZ0L67g) | 228.629 | 306.5 | 27 |
| One Odd Thing | [What If You Aged 10x Slower?](https://www.youtube.com/watch?v=dbglZFlsdLg) | 56.625 | 251.7 | 29 |
| Sual | [What If an Immortal Snail Chased You Forever?](https://www.youtube.com/watch?v=LYzhLL5Mbwk) | 75.692 | 249.8 | 18 |
| Mirage | [What IF You Found a Settings Menu for Your Body?](https://www.youtube.com/watch?v=_ko90JwL4vM) | 420.918 | 226.5 | 14 |
| OminiAM | [What If Every Human Disappeared Right Now?](https://www.youtube.com/watch?v=b6jmbFcJZCY) | 1.257.114 | 181.8 | 38 |
| WhatIfFunctions | [What If Goku Was Trapped In The Time Chamber For 1000 Years?](https://www.youtube.com/watch?v=or5mgWyRjvk) | 257.680 | 181.1 | 11 |
| Imagine Otherwise | [What If You Were 100x Smaller?](https://www.youtube.com/watch?v=NnXqy47PhrU) | 21.418 | 171.3 | 32 |
| IFShift | [What If Your Reflexes Were 100x Faster?](https://www.youtube.com/watch?v=ric3a4rv54M) | 775.610 | 144.0 | 28 |
| What if U click | [What If You Aged Backwards?](https://www.youtube.com/watch?v=SeigWp8dGPo) | 942.723 | 122.0 | 15 |
| Just Suppose ? | [What If Light Slowed Down and Couldn’t Stop?](https://www.youtube.com/watch?v=teM2wwRqvj0) | 10.690 | 116.2 | 15 |
| OminiAM | [What If You Traveled One Billion Years Into the Future?](https://www.youtube.com/watch?v=_lu85gSD39k) | 753.580 | 109.0 | 27 |
| Could've Been Tales | [What If You Could See 1 Hour Into the Future?](https://www.youtube.com/watch?v=aX7XDXwQKCI) | 38.995 | 99.1 | 31 |
| Ifsphere | [What If You Could Breathe Underwater?](https://www.youtube.com/watch?v=ggRf0ZYzrr8) | 439.433 | 93.4 | 26 |
| IFSIM FILMS | [What If Your Body Healed 100X Faster?](https://www.youtube.com/watch?v=Azr3pLPXEyg) | 53.512 | 84.1 | 25 |
| Mirage | [What IF You Could See Who Would Save You & Who Would Watch You Die?](https://www.youtube.com/watch?v=HjGgc-c5U3I) | 145.343 | 78.2 | 13 |
| What if U click | [What If Humans Lived for 1,000 Years?](https://www.youtube.com/watch?v=3AodXmVNHSg) | 533.938 | 69.1 | 3 |
| OminiAM | [What If You Were the Last Human on Earth?](https://www.youtube.com/watch?v=DgftZCQe8sI) | 435.573 | 63.0 | 28 |
| OminiAM | [What If Humans Never Discovered Clothes?](https://www.youtube.com/watch?v=n1CYFTKR_B0) | 342.462 | 49.5 | 26 |
| IFANIME | [What If YOU Went Super Saiyan in Real Life?](https://www.youtube.com/watch?v=lDhzDKKWYr4) | 506.694 | 48.1 | 15 |
| Minute Zero | [What If You Sped Up and Couldn’t Stop?](https://www.youtube.com/watch?v=gpLC_ELulyg) | 2.384.556 | 48.0 | 34 |
| What If Animations | [What if you were swallowed into the human body?](https://www.youtube.com/watch?v=hqX2xMW0DQk) | 27.784 | 48.0 | 38 |
| If Catch | [What If You Were 10x Luckier Than Everyone?](https://www.youtube.com/watch?v=pVPjaVjTGiM) | 33.563 | 45.0 | 23 |
| One Odd Thing | [What If Your Nose Was 10,000x Stronger?](https://www.youtube.com/watch?v=_bENAqQu83U) | 10.136 | 45.0 | 30 |

## Giới hạn của số liệu

- **Thiên lệch sống sót:** chỉ thấy kênh còn sống và hiện ra trong tìm kiếm. Tỉ lệ thắng thật chưa đo được.
- **Tuổi kênh là ước lượng:** lấy từ video cũ nhất khi đã đọc đủ danh sách upload, nếu không thì lấy ngày tạo kênh.
  Kênh cũ đổi chủ đề hoặc xoá video cũ sẽ trông trẻ hơn thực tế.
- **Lượt xem là tích luỹ:** video mới đăng chưa kịp lên. Cột tăng trong tuần chỉ có khi có ≥ 2 snapshot.
- **"Bung = ≥ 10× trung vị của chính kênh"** là ngưỡng tự đặt, không phải chuẩn ngành. Kênh có < 3 video dài thì không tính.
- **Kênh đúng ngách** chấm tự động bằng bộ lọc tiêu đề (`title_regex`): kênh đúng ngách khi ≥ `min_niche_share`
  video dài khớp. Bộ lọc dựa trên chữ, vẫn nên đọc tay 10 tiêu đề gần nhất của kênh top.


File kèm theo: `scorecard.csv`, `competitors.csv`, `bung_videos.csv`, `titles.csv` (toàn bộ tiêu đề để đọc tay, gom chủ đề bung ở ≥ 2 kênh).
