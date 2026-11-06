# Phong cách thumbnail mặc định ("TINY.")

Dùng khi người dùng yêu cầu thiết kế thumbnail. Mẫu gốc: `Thumbnail_2D_B.jpg` của video
"What If You Could Shrink Anything You Touch?". Người dùng chọn phong cách này ngày 2026-11-06.

## Bố cục (1280×720, 16:9)

| Thành phần | Quy tắc |
|---|---|
| Nhân vật | Nhân vật chính của kênh (HERO) vẽ 2D phẳng, cận cảnh nửa trái, cắt ngang ngực. Mặt cao khoảng 45% khung hình |
| Biểu cảm | Ngạc nhiên ("awe"): mắt trắng to, miệng tròn. Đổi sang "smug" (mắt nửa khép) khi cần vẻ tự tin |
| Vật chính | Một vật nhỏ kẹp giữa hai ngón tay, giơ lên giữa khung, cùng 3–4 ngôi sao lấp lánh |
| Chữ chính | 1 từ viết hoa kèm dấu chấm (ví dụ `TINY.`), cỡ khoảng 270 px, góc dưới bên phải |
| Chữ phụ | 2–3 từ ở góc trên bên phải, cỡ khoảng 84 px |
| Nền | Gradient tròn cam → vàng, kèm 20 tia nắng từ tâm bên phải và viền tối nhẹ |
| Số phần tử | Tối đa 3: nhân vật, vật chính, chữ |

## Màu và chữ

- Font: Fredoka 700 (`node_modules/@fontsource/fredoka` trong `aitrends-3d-studio`).
- Màu: viền `#241a3a`, lime `#b4f02e`, lime tối `#69a81c`, đầu ngọc `#f4eff9`, tóc `#eef1fa`, bóng tóc `#8f9dd2`, vàng `#ffe14a`.
- Chữ chính màu lime (hoặc vàng), viền trắng, ngoài cùng viền tím đậm.
- **Chữ trắng phải có viền tím đậm, không có viền trắng.** Chữ trắng viền trắng sẽ hòa vào nhau và bị mờ.
- Nhân vật: đầu tròn viền dày 9, tóc bạch kim nhọn, áo puffer xanh chanh có đường chần.

## Biến thể được phép đổi

- Màu nền: cam, tím đậm, xanh dương, hồng, vàng. Màu tia nắng đi cùng tông nền.
- Vật chính: xe tải, xe buýt, ngôi nhà, thuyền buồm. Đổi theo nội dung video.
- Bố cục phụ: chia đôi trước/sau (có nhãn BEFORE/AFTER), chữ lớn bên trái và nhân vật bên phải.
- Con số làm chữ chính khi có (ví dụ `100x SMALLER`).

## Cách dựng

- Script mẫu: `D:\aitrends-3d-studio\projects\thumb-2d\gen.mjs` và `gen_b.mjs` (SVG, chụp bằng Playwright). Sao chép rồi đổi cảnh trong khối `scenes`.
- Xuất JPG 1280×720 vào `projects/<video>/out/`, cạnh file MP4.
- Mặc định dựng 3–5 phương án theo phong cách này, rồi gửi ảnh để người dùng chọn.
- Kiểm tra: thu nhỏ ảnh còn khoảng 320 px, chữ chính vẫn đọc được.

## Bằng chứng chọn phong cách

- Thumbnail đối thủ thắng nhất kể ý tưởng bằng hình và con số (`ONLY 2 LEFT`, `100x SMALLER`, `AGE 0 / AGE 70`), chữ ngắn có dấu chấm.
- Thumbnail thua thường là nhân vật làm mặt kịch tính kèm chữ chung chung (`NOT REAL`, `REPLACED`).
