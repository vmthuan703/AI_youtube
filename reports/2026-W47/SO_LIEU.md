# Số liệu đối thủ tuần 2026-W47

- **Ngày nghiên cứu:** 2026-11-22 (tạo tự động bởi `market_watch.py weekly`)
- **Khoảng dữ liệu:** 2026-11-16 → 2026-11-22 · 6 snapshot (2026-11-17, 2026-11-18, 2026-11-19, 2026-11-20, 2026-11-21, 2026-11-22)
- **Phạm vi ô What-If Fiction × Mỹ:** quốc gia US, ngôn ngữ en, 20 truy vấn tìm kiếm đã chạy, video đăng trong 90 ngày khi tìm, kênh theo dõi chi tiết bên dưới

## What-If Fiction × Mỹ

Cỡ mẫu: 188 kênh có video dài · 1388 video dài ≥ 4 phút (gộp tìm kiếm + theo dõi) · 59 kênh theo dõi với 1269 video dài. Bộ lọc tiêu đề: `\bwhat\s*if\b|\bhypothetical\b|\bimagine if\b|\bwhat would happen if\b`.

### Bảng chấm ô

| Điều kiện | Ngưỡng | Số đo | Kết quả |
|---|---|---|---|
| Có kênh ≤ 3 tháng đã có video ≥ 100k | có |  Jeremy Bearimy, Any Minute Now, Born in Lore, ConChaser, DOOMPERK (+56 kênh) | đạt |
| Tuổi trung vị 5 kênh có video to nhất | ≤ 12 tháng | 57.9 tháng (ngày tạo kênh, video cũ nhất) | không |
| view/sub trung vị (5 kênh đó) | ≥ 10× | 74.3 | đạt |
| Số video dài ≥ 100k | ≥ 8 (cần, không đủ) | 438 | đạt |
| View trung vị của video ≥ 100k | 150k–600k | 288.548 | đạt |
| Kênh đúng ngách (top 5, tự động theo tiêu đề) | ≥ 80% | 2/2 kênh có đủ tiêu đề | — |

5 kênh có video to nhất (dùng cho 3 dòng tuổi, view/sub, đúng ngách; **cần đọc tay xác minh đúng ngách**, kênh sai thì thêm vào `exclude_channels` trong config):

| Kênh | Tuổi (ngày) | Sub | Video to nhất | Tỉ lệ tiêu đề khớp |
|---|---|---|---|---|
| Papa Joel | 2.743 | 3.040.000 | 5.619.018 | chưa theo dõi |
| Ifverse | 1.760 | 64.000 | 4.753.656 | chưa theo dõi |
| Born in Lore | 25 | 37.300 | 3.367.483 | 100% |
| ConChaser | 29 | 33.200 | 2.946.209 | 97% |
| Joe Bartolozzi | 2.364 | 6.300.000 | 2.520.758 | chưa theo dõi |

**Kết luận số: CẦN THEO DÕI.** Tuổi kênh dự báo mạnh nhất. View trung vị càng cao thì cửa càng đóng.

### Kênh mới thắng (≤ 180 ngày, có video dài ≥ 100k)

| Kênh | Tuổi (ngày) | Sub | Video to nhất |
|---|---|---|---|
| Born in Lore | 25 | 37.300 | 3.367.483 |
| ConChaser | 29 | 33.200 | 2.946.209 |
| Minute Zero | 43 | 23.800 | 2.436.293 |
|  Jeremy Bearimy | 42 | 65.100 | 2.036.327 |
| IfYou Films | 28 | 8.110 | 2.018.638 |
| The Hidden Why | 44 | 3.810 | 1.758.861 |
| Araragi | 134 | 25.800 | 1.614.340 |
| OminiAM | 47 | 8.360 | 1.505.801 |
| Hypo Room | 20 | 28.900 | 1.496.495 |
| DOOMPERK | 33 | 23.100 | 1.459.231 |
| Miko | 36 | 16.800 | 1.406.680 |
| Questionverse | 19 | 13.500 | 1.253.417 |
| IFOLOGY | 43 | 62.000 | 1.062.854 |
| Skylox Story | 30 | 246.000 | 1.015.869 |
| What if U click | 37 | 6.690 | 1.014.749 |

### Đối thủ đang theo dõi

| Kênh | Tuổi (ngày) | Sub | +Sub | Video dài | Đăng trong tuần | Trung vị view | Video bung | ≥100k | +View tuần | Video to nhất |
|---|---|---|---|---|---|---|---|---|---|---|
| DOOMPERK | 33 | 23.100 | 8.300 | 35 | 6 | 63.532 | 3 | 14 | 3.430.029 | What If You Had Infinite IQ on a Deserted ISLAND? |
| IfYou Films | 28 | 8.110 | 4.620 | 21 | 7 | 28.860 | 2 | 8 | 2.378.657 | Zombie Outbreak: What If YOU Were Patient Zero? (Full Story) |
| ConChaser | 29 | 33.200 | 4.700 | 29 | 7 | 117.403 | 3 | 15 | 2.338.226 | What If You Could See Everyone's IQ? |
| Miko | 36 | 16.800 | 5.900 | 23 | 7 | 29.215 | 4 | 8 | 2.278.922 | What If You Could See How Long Someone Has Crush on You? |
|  Jeremy Bearimy | 42 | 65.100 | 6.200 | 73 | 15 | 67.275 | 8 | 29 | 2.252.829 | What IF You Could See Who Has a Crush on You? |
| ŌTSUTSUKI UNIVERSE! | 130 | 52.200 | 4.700 | 60 | 4 | 168.132 | 0 | 42 | 1.546.789 | (Full STORY) WHAT IF NARUTO UCHIHA HAD THE POWER OF EVERY MA |
| Hypo Room | 20 | 28.900 | 8.800 | 19 | 6 | 91.175 | 3 | 9 | 1.284.560 | What If Humans Never Invented Clothes? |
| Born in Lore | 25 | 37.300 | 5.200 | 9 | 3 | 440.421 | 0 | 7 | 1.257.413 | What If You Were Born as Ghost? / Call of Duty |
| What if U click | 37 | 6.690 | 880 | 33 | 4 | 11.988 | 6 | 6 | 753.731 | What If You Aged Backwards? |
| Stupid Dupid  | 16 | 27.800 | 3.500 | 24 | 5 | 80.301 | 0 | 11 | 729.895 | What If You Turned Into A Girl? |
| IFOLOGY | 43 | 62.000 | 2.300 | 75 | 16 | 34.928 | 5 | 24 | 717.609 | What IF You Were 10x Faster? |
| Questionverse | 19 | 13.500 | 2.000 | 14 | 3 | 139.690 | 0 | 8 | 616.221 | What If You Were Stuck in a Bunker With Your Crush? |
| Skylox Story | 30 | 246.000 | 5.000 | 9 | 3 | 184.492 | 0 | 6 | 495.538 | What If the WHOLE WORLD Became Roblox? 😱 |
| One Small If | 40 | 7.750 | 1.160 | 28 | 5 | 12.595 | 3 | 4 | 461.939 | I Can Breathe Underwater. The Coast Guard Keeps Saving Me. |
| Milo Whatsit | 32 | 4.270 | 1.230 | 7 | 2 | 36.273 | 1 | 3 | 442.260 | What If You Earned $1 Every Millisecond? |
| What If Hero | 34 | 6.100 | 790 | 26 | 6 | 52.850 | 0 | 8 | 440.604 | What If Everyone Could See How Many Kids You’ll Have? |
| All Answers | 1.402 | 12.900 | 700 | 31 | 3 | 47.062 | 3 | 12 | 421.842 | What If You Kept Getting Nicer and Couldn't Stop? |
| IFopposite  | 38 | 7.890 | 1.110 | 18 | 2 | 27.664 | 2 | 4 | 417.684 | What If You Had Infinite IQ at School? |
| If Catch | 34 | 2.590 | 740 | 28 | 5 | 1.512 | 6 | 3 | 408.985 | What If You Became Perfect Whenever Your Crush Was Watching? |
| OminiAM | 47 | 8.360 | 420 | 18 | 3 | 5.717 | 4 | 4 | 386.052 | What If Every Human Disappeared Right Now? |
| WhatIfFunctions | 31 | 5.210 | 2.110 | 30 | 6 | 2.526 | 8 | 1 | 292.608 | What If Goku Was Trapped In The Time Chamber For 1000 Years? |
| Then What? | 31 | 3.340 | 430 | 15 | 0 | 29.308 | 0 | 5 | 264.530 | What If Your Money Doubled Every Time You Blinked? |
| Araragi | 134 | 25.800 | 700 | 22 | 0 | 81.074 | 1 | 7 | 180.109 | What If Ino Saw Naruto’s Memories? |
| Lookif | 17 | 2.130 | 270 | 15 | 8 | 11.887 | 3 | 3 | 170.476 | What If You Could See Everyone's Real-Life Rating? |
| IFANIME | 29 | 7.070 | 400 | 19 | 6 | 12.222 | 2 | 3 | 158.729 | What If YOU Went Super Saiyan in Real Life? |
| Nick ifverse | 27 | 3.140 | 810 | 11 | 4 | 25.134 | 1 | 1 | 136.850 | What If You Could See Everyone’s Love Meter? |
| Stick Revival | 31 | 494 | 45 | 22 | 8 | 135.0 | 4 | 1 | 132.194 | What If Only Two People Had to Repopulate the Earth? |
| Sacred Strawhat | 265 | 12.200 | 300 | 6 | 0 | 174.438 | 0 | 4 | 128.906 | What If Luffy Was Reborn With His Memories and Powers? |
| OTHERWISE | 34 | 5.560 | 240 | 11 | 2 | 9.175 | 3 | 3 | 126.596 | What If You Were Reborn With All Your Memories? |
| The If Lab | 22 | 1.520 | 160 | 9 | 0 | 1.374 | 1 | 1 | 117.173 | What If You Could Read Minds? |

### Video bung (≥ 10× trung vị của chính kênh) · 136 video

| Kênh | Tiêu đề | View | × trung vị | Tuổi (ngày) |
|---|---|---|---|---|
| Stick Revival | [What If Only Two People Had to Repopulate the Earth?](https://www.youtube.com/watch?v=y0lMf_kmi6E) | 678.184 | 5.024 | 29 |
| Earth Tipping | [What If All the Ice on Earth Melted?](https://www.youtube.com/watch?v=syCnXSCxrZE) | 979.320 | 1.924 | 54 |
| What If Animations | [What if you shrank and couldn't stop?](https://www.youtube.com/watch?v=YayPaipjNAM) | 882.257 | 1.495 | 47 |
| What If Levels | [What If You Had 10,000 IQ?](https://www.youtube.com/watch?v=JOr27wqb910) | 548.833 | 810.1 | 34 |
| The If Lab | [What If You Could Read Minds?](https://www.youtube.com/watch?v=2fDVRWoc6vk) | 694.860 | 505.7 | 21 |
| Vanessa Harris | [What If 8 Billion People Jumped at Once?](https://www.youtube.com/watch?v=L3pK2pNNKrw) | 386.502 | 349.8 | 36 |
| Just Suppose ? | [What If You Got Luckier and Couldn’t Stop?](https://www.youtube.com/watch?v=YIqBcaXygNQ) | 50.637 | 297.9 | 23 |
| One Odd Thing | [What If You Aged 10x Slower?](https://www.youtube.com/watch?v=dbglZFlsdLg) | 56.652 | 263.5 | 36 |
| OminiAM | [What If Every Human Disappeared Right Now?](https://www.youtube.com/watch?v=b6jmbFcJZCY) | 1.505.801 | 263.4 | 45 |
| IFShift | [What If Your Reflexes Were 100x Faster?](https://www.youtube.com/watch?v=ric3a4rv54M) | 837.590 | 249.7 | 35 |
| Sual | [What If an Immortal Snail Chased You Forever?](https://www.youtube.com/watch?v=LYzhLL5Mbwk) | 76.045 | 173.2 | 25 |
| Imagine Otherwise | [What If You Were 100x Smaller?](https://www.youtube.com/watch?v=NnXqy47PhrU) | 21.476 | 163.9 | 39 |
| WhatIfFunctions | [What If Goku Was Trapped In The Time Chamber For 1000 Years? (Part 1 o](https://www.youtube.com/watch?v=or5mgWyRjvk) | 408.862 | 161.9 | 18 |
| If Catch | [What If You Became Perfect Whenever Your Crush Was Watching? (41 Fight](https://www.youtube.com/watch?v=4_kUQhT7G5Y) | 239.539 | 158.4 | 4 |
| OminiAM | [What If You Traveled One Billion Years Into the Future?](https://www.youtube.com/watch?v=_lu85gSD39k) | 892.833 | 156.2 | 34 |
| If Catch | [What If You Could See Every Lie?](https://www.youtube.com/watch?v=bbyffZ0L67g) | 229.441 | 151.7 | 34 |
| Ifsphere | [What If You Could Breathe Underwater?](https://www.youtube.com/watch?v=ggRf0ZYzrr8) | 524.866 | 122.1 | 33 |
| IFSIM FILMS | [What If Your Body Healed 100X Faster?](https://www.youtube.com/watch?v=Azr3pLPXEyg) | 53.560 | 113.5 | 32 |
| If Catch | [What If You Turned Into Whatever You Touched? (20 Hunters vs You)](https://www.youtube.com/watch?v=blm2c_xN9YU) | 155.018 | 102.5 | 6 |
| OTHERWISE | [What If You Were Reborn With All Your Memories?](https://www.youtube.com/watch?v=297D7Xesn8Q) | 927.598 | 101.1 | 29 |
| Coulda Been Roblox | [What If You Could See 1 Hour Into the Future?](https://www.youtube.com/watch?v=aX7XDXwQKCI) | 39.018 | 98.5 | 38 |
| OminiAM | [What If You Were the Last Human on Earth?](https://www.youtube.com/watch?v=DgftZCQe8sI) | 501.776 | 87.8 | 35 |
| What if U click | [What If You Aged Backwards?](https://www.youtube.com/watch?v=SeigWp8dGPo) | 1.014.749 | 84.6 | 22 |
| What if U click | [What If Humans Lived for 1,000 Years?](https://www.youtube.com/watch?v=3AodXmVNHSg) | 927.395 | 77.4 | 10 |
| IfYou Films | [Zombie Outbreak: What If YOU Were Patient Zero? (Full Story)](https://www.youtube.com/watch?v=6qIJI38aTmE) | 2.018.638 | 69.9 | 7 |
| Just Suppose ? | [What If Light Slowed Down and Couldn’t Stop?](https://www.youtube.com/watch?v=teM2wwRqvj0) | 10.992 | 64.7 | 22 |
| OminiAM | [What If Humans Never Discovered Clothes?](https://www.youtube.com/watch?v=n1CYFTKR_B0) | 344.596 | 60.3 | 33 |
| Twivio | [What If You Stole the World's Best Footballer's Talent?](https://www.youtube.com/watch?v=LInSlffbMgs) | 61.450 | 54.1 | 11 |
| One Small If | [I Can Breathe Underwater. The Coast Guard Keeps Saving Me.](https://www.youtube.com/watch?v=Nma7BRz1cp0) | 660.393 | 52.4 | 3 |
| What If Levels | [What If You Could Read Minds… and Heard Your Wife’s First? // What If ](https://www.youtube.com/watch?v=wAA1NSHEwjE) | 34.148 | 50.4 | 27 |

## Giới hạn của số liệu

- **Thiên lệch sống sót:** chỉ thấy kênh còn sống và hiện ra trong tìm kiếm. Tỉ lệ thắng thật chưa đo được.
- **Tuổi kênh là ước lượng:** lấy từ video cũ nhất khi đã đọc đủ danh sách upload, nếu không thì lấy ngày tạo kênh.
  Kênh cũ đổi chủ đề hoặc xoá video cũ sẽ trông trẻ hơn thực tế.
- **Lượt xem là tích luỹ:** video mới đăng chưa kịp lên. Cột tăng trong tuần chỉ có khi có ≥ 2 snapshot.
- **"Bung = ≥ 10× trung vị của chính kênh"** là ngưỡng tự đặt, không phải chuẩn ngành. Kênh có < 3 video dài thì không tính.
- **Kênh đúng ngách** chấm tự động bằng bộ lọc tiêu đề (`title_regex`): kênh đúng ngách khi ≥ `min_niche_share`
  video dài khớp. Bộ lọc dựa trên chữ, vẫn nên đọc tay 10 tiêu đề gần nhất của kênh top.


File kèm theo: `scorecard.csv`, `competitors.csv`, `bung_videos.csv`, `titles.csv` (toàn bộ tiêu đề để đọc tay, gom chủ đề bung ở ≥ 2 kênh).
