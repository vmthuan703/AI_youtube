# Quy tắc thumbnail (học từ dữ liệu đối thủ)

**Trạng thái:** bạn đã duyệt ngày 2026-11-07. Thay toàn bộ phong cách "TINY." cũ (đã bỏ).

**Nguồn:** [báo cáo đối thủ 07/11](../reports/2026-11-07_doi_thu_whatif/BAO_CAO.md).
- 40 thumbnail của Jeremy Bearimy, mã hóa tay rồi so view.
- 103 thumbnail của các kênh hạng A/B, xem bằng mắt.
- Đo pixel trên 144 ảnh.
- Mẫu nhỏ, chỉ là tương quan: chỉ coi là luật cứng khi đã qua A/B test.

**Công thức một câu:** hero đang thắng + siêu năng lực hiện thành giao diện game + người khác phản ứng, trên nền sáng.

## 5 quy tắc bắt buộc

| # | Quy tắc | Bằng chứng (view trung vị, Jeremy Bearimy) |
|---|---|---|
| 1 | **Hero mặt smug / tự tin**: mắt nửa khép, nhếch mép, hoặc ngón tay đặt lên môi "shh". Không dùng mặt sợ hay mặt nạn nhân | Smug 340k (n=20) · trung tính 56k · hoảng sợ 31k · không có hero 22k |
| 2 | **Luật của video hiện thành 1 lớp giao diện game**: nhãn trên đầu người, thanh chỉ số/HP, số đếm, dòng lệnh, đồng hồ đo | Nhãn/UI 265k, 7/8 video ≥ 100k · chữ to 76k · không chữ 38k |
| 3 | **Cược xã hội**: ít nhất 1 nhân vật phụ hoặc 1 đám đông phản ứng với hero. Nhân vật phụ màu trầm, không tranh với hero | Có nhân vật nữ 400k (8/8 ≥ 100k) · đám đông/chất đống 517k |
| 4 | **Nền sáng, rực màu; hero to**: hero chiếm 1/3–1/2 khung, mặt còn đọc được khi thu ảnh về 320 px | Độ sáng 82/100 so với 51 của đối thủ · độ rực 134 so với 77 |
| 5 | **Chữ ít, giọng nói chuyện**: tối đa 1 cụm chữ lớn ≤ 3 từ, không lặp tiêu đề ("oh yeah.", "this is fine..", "RESPAWN"). Bỏ hẳn chữ lớn nếu nhãn đã kể đủ chuyện | Video top 1 (1,57 triệu) chỉ có 3 nhãn, không có chữ lớn |

## 4 bố cục: mỗi lần dựng 1 phương án cho mỗi bố cục

| Bố cục | Cách dựng | Ví dụ thắng |
|---|---|---|
| **A. Nhãn trên đầu** | Hero smug một bên. 2–3 người khác có nhãn trên đầu; nhãn bất ngờ, trái với vẻ ngoài | JB "Crush" (`friend / CRUSH / friend`) 1,57 tr · "murderer" 513k · ConChaser "160 IQ / 70 IQ" 1,25 tr |
| **B. Chia đôi đối lập** | Hai vế (trước/sau, mình/người khác), mỗi vế 1 nhãn hoặc 1 thanh chỉ số | JB "Shooting" 863k · "27 / 19,342,514 follower" 286k |
| **C. Đám đông / chất đống** | Hero smug giữa đám đông đang nhìn mình, hoặc ngồi trên đống tiền/đồ vật | JB "Only Guy at a Girls Only School" 870k · "Infinite Money" 782k · "Every Girl" 517k |
| **D. Giao diện game cả khung** | Hero smug + 1 bảng UI lớn: thanh HP, LEVEL, đồng hồ max, dòng lệnh | JB "/gamemode creative" 712k · "LUCK" 596k · "LEVEL 10" 243k |

## Không làm (rút từ thumbnail thua)

- Mặt hoảng sợ, khổ sở, cầu cứu ("HELP", "MISSING", "10X SLOWER": đều dưới 80k).
- Chủ đề ghê hoặc khó chịu ("2759 HOURS POOING", "10X FAT", "87 YEARS OLD": đều dưới 40k).
- Cận cảnh trừu tượng không có câu chuyện (cận mắt "you see everything…", 24k).
- Hero nhỏ, quay lưng, hoặc lẫn vào cảnh (Control Water 17k, Shrunk 1cm 20k).
- Máu, súng chĩa thật vào người, nội dung không hợp khán giả trẻ.
- Chữ dài hoặc chữ nhắc lại tiêu đề.

## Giữ nguyên từ kênh

- **Hero của kênh:** đầu ngọc trai, tóc bạch kim nhọn, áo puffer xanh chanh, vẽ 2D phẳng viền dày. Đây là nhận diện kênh, tương đương linh vật áo xanh của Jeremy Bearimy.
- **Font:** Fredoka 700.
- **Màu:** viền `#241a3a`, lime `#b4f02e`, vàng `#ffe14a`, xanh lá UI `#3ddc5a`, đỏ UI `#ee3b2f`, nền nhãn tối `#14102a`.
- **Chữ trắng phải có viền tối, không viền trắng** (viền trắng làm chữ mờ).
- **Nhãn:** nền đặc, viền đậm 8 px, góc bo 18 px, mũi nhọn chỉ vào người.

## Cách dựng

- Bản 3D (plugin 1.0.3): dự án mẫu `examples/v103-thumb` (4 cảnh = 4 bố cục, nhãn và thanh chỉ số bằng `T.thumb`), xuất bằng `node render.mjs --project ... --thumbs`.
- Script mẫu 2D: `D:\aitrends-3d-studio\projects\thumb-2d\gen_heal_jb.mjs`. Có sẵn hàm `hero`, `kid` (bạn cùng lớp), `grandpa`, `tag` (nhãn), `hp` (thanh máu). Sao chép rồi đổi khối `scenes2`.
- Mỗi video dựng **4 phương án theo 4 bố cục A–D**. Xuất JPG 1280×720 cạnh file MP4, kèm 1 ảnh ghép 2×2 để chọn.
- **Kiểm tra trước khi gửi:**
  - Thu ảnh về 320 px: mặt hero và nhãn vẫn đọc được.
  - Đủ 5 quy tắc bắt buộc.
  - Không vướng mục "Không làm".
- Sau khi đăng: dùng "Test & Compare" của YouTube Studio cho 2–3 phương án. Ghi kết quả vào file này để luật dựa trên CTR thật của kênh bạn.
