# aiTrends Thumbnail

Script → các phương án thumbnail kiểu điện ảnh cho kênh What If.

- Đọc script, chọn những khoảnh khắc đáng làm poster.
- Dựng mỗi khoảnh khắc thành một khung hình phim trên engine 3D của aiTrends 3D Studio (style `cine`, 2.0 trở lên): ánh sáng phim, xóa phông, thời tiết, góc máy thấp, hero to ở tiền cảnh, nhân vật roster phản ứng phía sau.
- Chữ tùy script: có phương án không chữ, có phương án 1 nhãn hoặc ≤ 3 chữ.
- Xuất JPG 1280×720, ảnh ghép để chọn (kèm hàng 320 px), kiểm tra tự động.
- Hero, nhân vật và bối cảnh giống trong video. Không vẽ 2D phẳng, không dùng mô hình tạo ảnh, không sao chép nhân vật hay hình ảnh của kênh khác.

## Dùng

```
/make-thumbnail <đường dẫn script hoặc thư mục project>
```

## Cần có

- aiTrends 3D Studio 2.0 trở lên (mặc định `D:\aitrends-3d-studio`), Node 18+, ffmpeg.

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `skills/make-thumbnail/SKILL.md` | Quy trình: đọc script → chọn khoảnh khắc → dựng cảnh → render → kiểm tra |
| `skills/make-thumbnail/references/thumbnail_rules.md` | 8 quy tắc điện ảnh, mục không làm |
| `skills/make-thumbnail/kit/template/` | Khung project mẫu, có 2 cảnh ví dụ (hoàng hôn, đêm mưa) |
| `skills/make-thumbnail/kit/template/scenes/_thumb.js` | Hàm bố cục theo vị trí trên khung hình và ánh sáng chân dung |
| `skills/make-thumbnail/kit/new_thumb_project.mjs` | Tạo project thumbnail trong studio |
| `skills/make-thumbnail/kit/sheet.mjs` | Ảnh ghép và kiểm tra độ sáng, tương phản, cháy sáng, số chữ |
