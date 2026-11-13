# aiTrends Thumbnail

Script → các phương án thumbnail YouTube cho kênh What If.

- Đọc script, tìm "luật" của video và khoảnh khắc hero thắng.
- Mỗi phương án là một ý khác nhau, bố cục tự chỉnh theo script (không có bố cục cố định).
- Theo 5 quy tắc học từ dữ liệu đối thủ (07/11): hero mặt đắc ý, luật hiện thành 1 lớp giao diện game, có người phản ứng, nền sáng, tối đa 3 chữ.
- Vẽ 2D phẳng bằng SVG, render JPG 1280×720 bằng Chromium, kèm ảnh ghép và kiểm tra quy tắc tự động.
- Nhân vật: hero của kênh và các vai trong roster. Không sao chép nhân vật hay hình ảnh của kênh khác.

## Dùng

```
/make-thumbnail <đường dẫn script hoặc thư mục project>
```

Chạy thử bộ vẽ với ví dụ mẫu:

```bash
node plugins/aitrends-thumbnail/skills/make-thumbnail/kit/render_thumbs.mjs --spec plugins/aitrends-thumbnail/skills/make-thumbnail/kit/example_spec.mjs --out dist/thumb-example --studio D:/aitrends-3d-studio
```

## Cần có

- Node 18+ và `playwright` (dùng sẵn trong thư mục aiTrends studio; chỉ đường bằng `--studio`).
- Font Fredoka 700 đi kèm trong `kit/fonts` (giấy phép OFL).

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `skills/make-thumbnail/SKILL.md` | Quy trình: đọc script → chọn ý → viết spec → render → kiểm tra |
| `skills/make-thumbnail/references/thumbnail_rules.md` | 5 quy tắc, cách dựng theo script, mục không làm |
| `skills/make-thumbnail/kit/thumb_kit.mjs` | Hàm vẽ: hero, roster, nhãn, thanh chỉ số, cửa sổ game, phụ kiện |
| `skills/make-thumbnail/kit/render_thumbs.mjs` | Render JPG, ảnh ghép, kiểm tra quy tắc |
| `skills/make-thumbnail/kit/example_spec.mjs` | Ví dụ mẫu (Borrow Strength) |
