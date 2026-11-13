# Quy tắc thumbnail

**Trạng thái:** cập nhật 2026-11-13 theo plugin `aitrends-3d-studio` 2.1.0 (thumbnail điện ảnh dựng bằng engine 3D). Bỏ 4 bố cục A–D cố định và kiểu 2D phẳng của bản 2026-11-07; trước đó nữa đã bỏ phong cách "TINY.".

**Cách làm:** dùng lệnh `/make-thumbnail` (plugin `aitrends-3d-studio`; `/make-3d-video` cũng tự chạy bước này sau khi xuất MP4). Quy tắc chi tiết, bằng tiếng Anh, nằm trong plugin: `plugins/aitrends-3d-studio/skills/make-3d-video/references/thumbnails.md`. File này tóm tắt bằng tiếng Việt, giữ số liệu gốc và ghi kết quả A/B test của kênh.

**Công thức một câu:** một khung hình phim đúng khoảnh khắc luật của video phát huy, mặt hero to và được chiếu sáng, biểu cảm đúng khoảnh khắc, siêu năng lực hiện thành ánh sáng, có người khác đang phản ứng.

## Nguồn

- [Báo cáo đối thủ 07/11](../reports/2026-11-07_doi_thu_whatif/BAO_CAO.md): 40 thumbnail của kênh What If dẫn đầu (mã hóa tay, so view), 103 thumbnail của các kênh hạng A/B (xem bằng mắt), đo pixel trên 144 ảnh.
- Xem lại kênh dẫn đầu ngày 2026-11-13: cảnh thật có chiều sâu thay vì nền phẳng; nhân vật đổ bóng mềm, có ánh sáng; một hiệu ứng ánh sáng cho thấy năng lực; mặt rất to; màu rực; một yếu tố UI hoặc ≤ 3 chữ, thường là không có chữ.
- Mẫu nhỏ, chỉ là tương quan: chỉ coi là luật cứng khi đã qua A/B test của kênh mình.
- Học cấu trúc, không chép: không dùng nhân vật, linh vật, cảnh hay hình của kênh khác.

## 8 quy tắc

| # | Quy tắc | Cách kiểm |
|---|---|---|
| 1 | **Một khoảnh khắc, đọc trong một giây.** Khung hình là một khoảnh khắc trong script mà người lạ hiểu ngay | Che tiêu đề: vẫn nói được video về gì? |
| 2 | **Mặt hero là thứ thấy đầu tiên, biểu cảm theo bối cảnh** (bạn sửa ngày 2026-11-13). Đầu cao 35–45 % khung, nằm trên đường 1/3. Chọn mặt đúng với khoảnh khắc thumbnail kể: buồn khi bị bạn thân tắt tiếng, bối rối khi đứng giữa hai phía, vui khi đang thắng, lo lắng trước con số xấu. Smug / tự tin chỉ dùng khi hero đang thắng hoặc nắm lợi thế. Không quay lưng | Hàng 320 px của sheet |
| 3 | **Chiều sâu 3 lớp.** Hero ở tiền cảnh, người phản ứng ở trung cảnh, một nơi thật ở hậu cảnh, xóa phông | Nền mờ, mặt ở trung cảnh vẫn đọc được |
| 4 | **Ánh sáng nói lên cảm xúc và có nguồn.** Nắng sau lưng hero, cửa sổ sáng đèn, ánh sáng của chính năng lực. Luôn có viền sáng (rim) trên hero và mặt đọc được | Hero tách khỏi nền cả khi chuyển ảnh xám |
| 5 | **Năng lực hiện thành ánh sáng hoặc cảnh không thể có.** Hào quang màu của năng lực, thời tiết nghe lời, vật 200 kg trong một tay | Bỏ chữ đi: năng lực vẫn còn đó? |
| 6 | **Có người phản ứng.** 1–3 nhân vật trong roster, mặt rõ, quay về phía hero. Cảm xúc của họ là cảm xúc của người xem | Mặt cao ≥ 15 % khung |
| 7 | **Chỉ có chữ khi script cần.** Không chữ, hoặc 1 nhãn / con số, hoặc 1 cụm ≤ 3 từ không lặp tiêu đề. Trong các phương án, ít nhất 1 phương án không có chữ | `sheet.mjs` đếm số từ |
| 8 | **Máy thấp, ống kính dài, kín khung.** Máy dưới tầm mặt nhìn lên, fov 26–34, không viền đen, màu rực | — |

## Số liệu gốc (view trung vị, 40 thumbnail kênh dẫn đầu, 2026-11-07)

| Yếu tố | View trung vị |
|---|---|
| Hero smug (n=20) · trung tính · hoảng sợ · không có hero | 340k · 56k · 31k · 22k |
| Có nhân vật nữ phản ứng · đám đông / chất đống | 400k · 517k |
| Có nhãn / UI · chữ to · không chữ | 265k · 76k · 38k |

Số liệu smug là tương quan trên kênh khác. Bạn thấy mặt smug ở mọi phương án không hợp truyện (video "Who Muted You"), nên quy tắc 2 chọn biểu cảm theo khoảnh khắc.

## Phương án

Mỗi video dựng **3 hoặc 4 phương án là các khoảnh khắc khác nhau** hoặc cách nhìn khác nhau về luật: nơi khác, giờ khác, khoảng cách khác, người phản ứng khác. Hai góc máy của cùng một khoảnh khắc chỉ tính là một phương án. Không còn 4 bố cục cố định.

## Không làm

- Mặt hoảng sợ, khổ sở, cầu cứu khi khoảnh khắc không đòi hỏi, hoặc chữ cầu cứu ("HELP", "MISSING", "10X SLOWER": đều dưới 80k ở kênh dẫn đầu). Biểu cảm theo quy tắc 2.
- Hero nhỏ, quay lưng, lẫn vào cảnh (Control Water 17k, Shrunk 1cm 20k).
- Cận cảnh trừu tượng không có câu chuyện (cận mắt "you see everything…", 24k).
- Ánh sáng trưa phẳng, mọi thứ đều nét (kiểu thumbnail 3D cũ: đọc được nhưng không hấp dẫn).
- Khung đen hoặc xám. Cảnh đêm cần một nguồn sáng rực màu và cửa sổ sáng đèn.
- Nhiều hơn một yếu tố chữ; chữ dài; chữ nhắc lại tiêu đề.
- Chủ đề ghê, khó chịu; máu; vũ khí thật chĩa vào người; nội dung không hợp khán giả trẻ.
- Lộ twist hoặc kết thúc. Chỉ cho thấy cái vui của luật, cùng lắm gợi cái giá.
- Vùng trắng cháy trên mặt hoặc áo hero.

## Giữ nguyên từ kênh

- **Hero:** hero trong `channel/cast.js` (tóc bạch kim nhọn, áo puffer xanh chanh). Không ai khác có tóc gần trắng hay màu nổi như hero.
- **Dàn nhân vật:** chỉ dùng vai trong roster.
- **Chữ (khi có):** Fredoka 700, trắng hoặc vàng, viền tối `#241a3a` (không viền trắng); nhãn trên nền tối `#14102a`.
- Màu lime của hero không đặt trên nền xanh lá (bãi cỏ ngay sau áo): đổi góc máy hoặc chỗ đứng.

## Kiểm tra trước khi gửi

- `node render.mjs --project projects/thumb-<slug> --qc`: 0 lỗi đỏ.
- `sheet.mjs`: sửa mọi ✗, đọc mọi !.
- Xem sheet: mặt hero là thứ thấy đầu tiên ở 320 px, biểu cảm đúng khoảnh khắc, các phương án thật sự khác nhau.

## Sau khi đăng

Dùng "Test & Compare" của YouTube Studio cho 2–3 phương án. Ghi kết quả vào mục dưới để quy tắc dựa trên CTR thật của kênh bạn.

### Kết quả A/B test của kênh

(chưa có)
