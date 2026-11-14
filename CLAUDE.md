## Xưng hô
- Xưng "mình", gọi người dùng là "bạn".

## Ngôn ngữ & văn phong
- Luôn trả lời bằng tiếng Việt có dấu.
- Ngắn gọn, đi thẳng vào việc; không rào đón, không nhắc lại câu hỏi.
  Chỉ giải thích khi được hỏi, hoặc khi thao tác có thể làm mất dữ liệu.

## Định dạng
- Ưu tiên gạch đầu dòng thay cho đoạn văn dài.
- Dùng bảng khi so sánh nhiều phương án, số liệu hoặc thuộc tính.

## Hỏi trước khi chỉnh sửa
- Hỏi trước khi xuất bản bản xem trước (theo quy tắc chung trong CLAUDE.md của người dùng).

## Góp ý sau khi video đã duyệt
- Góp ý lỗi của một video đã chấp nhận là để sửa plugin cho video sau; không làm lại video cũ trừ khi người dùng nói rõ.

## Thumbnail
- Khi được yêu cầu thiết kế thumbnail, dùng `/make-thumbnail` (plugin `aitrends-3d-studio`)
  theo quy tắc trong `prompts/thumbnail_style.md`: dựng 3–4 phương án là các khoảnh khắc
  khác nhau (không còn bố cục A–D cố định), biểu cảm hero theo bối cảnh, rồi gửi ảnh để chọn.

## Viết script
- Trước khi viết hoặc sửa script, đọc `prompts/QUY_TAC_VIET_SCRIPT_KENH.md` đầu tiên.
- Khi người dùng nói "mức sâu" (hoặc "mức chuẩn"), làm theo `prompts/MUC_SAU_VIET_SCRIPT.md`.

## Chọn nhánh
- Khi chưa rõ việc thuộc nhánh nào: hỏi người dùng mô tả việc, chọn nhánh,
  nêu lý do và chờ người dùng xác nhận trước khi thực hiện.

## Git
- Được tự `git commit` và `git push` lên nhánh làm việc mà không cần hỏi.
  Vẫn hỏi trước khi: push lên `main`, force-push, xóa nhánh, mở/đóng/gộp PR.
- Thay đổi trong `CLAUDE.md` thì commit riêng, không gộp với file khác.
- Mở GitHub (tạo PR, xem PR, repo) bằng Chrome của người dùng (Claude in Chrome),
  vì đã đăng nhập sẵn. Không dùng trình duyệt tích hợp, không chờ `gh`.
- Ngoại lệ: tác vụ "Báo cáo đối thủ 3 ngày" tự push `research/reports`, và `main` chỉ đổi `ke-hoach/` và khối `KE_HOACH_MOI_NHAT` trong `README.md`.

## Bảo trì file này
- Mỗi khi thêm nội dung vào `CLAUDE.md`, nếu file dài quá 50 dòng thì đề nghị
  người dùng rút gọn trước. Chỉ rút gọn khi người dùng đồng ý.
- Khi người dùng phải nhắc cùng một yêu cầu đến lần thứ 2, tự ghi yêu cầu đó
  thành quy tắc trong `CLAUDE.md` (rồi tự commit và push như ngoại lệ ở trên).

## Dọn dẹp sau mỗi lần thay đổi
- Tự chuyển file/thư mục có thể xóa vào `D:\_xoa_duoc\<ngày>\`, không hỏi, không xóa; người dùng tự xóa. Báo lại đã chuyển gì.
- Nhánh git, PR và mục trên GitHub không chuyển được: vẫn hỏi trước khi xóa.
