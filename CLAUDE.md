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
- Khi người dùng yêu cầu chỉnh sửa, thêm hoặc thay đổi nội dung, KHÔNG tự tạo
  hoặc xuất bản bản xem trước (preview, artifact, ảnh, bản nháp đầy đủ).
- Thay vào đó, nêu ngắn gọn sẽ đổi gì và hỏi người dùng có muốn xem bản xem
  trước không.
- Chỉ thực hiện khi người dùng đồng ý rõ ràng. Mục đích: tiết kiệm token.

## Thumbnail
- Khi được yêu cầu thiết kế thumbnail, dùng quy tắc học từ dữ liệu đối thủ trong
  `prompts/thumbnail_style.md` (đã bỏ phong cách "TINY." cũ). Dựng 4 phương án
  theo 4 bố cục A–D trong file đó rồi gửi ảnh để chọn.

## Viết script
- Trước khi viết hoặc sửa script, đọc `prompts/QUY_TAC_VIET_SCRIPT_KENH.md` đầu tiên.

## Chọn nhánh
- Khi chưa rõ việc thuộc nhánh nào: hỏi người dùng mô tả việc, chọn nhánh,
  nêu lý do và chờ người dùng xác nhận trước khi thực hiện.

## Git
- Được tự `git commit` và `git push` lên nhánh làm việc mà không cần hỏi.
  Vẫn hỏi trước khi: push lên `main`, force-push, xóa nhánh, mở/đóng/gộp PR.
- Thay đổi trong `CLAUDE.md` thì commit riêng, không gộp với file khác.
- Mở GitHub (tạo PR, xem PR, repo) bằng Chrome của người dùng (Claude in Chrome),
  vì đã đăng nhập sẵn. Không dùng trình duyệt tích hợp, không chờ `gh`.
- Ngoại lệ: tác vụ theo lịch "Báo cáo đối thủ 3 ngày" được tự commit và push
  vào `research/reports`, và vào `main` nhưng chỉ đổi `ke-hoach/` và khối `KE_HOACH_MOI_NHAT` đầu `README.md`.

## Bảo trì file này
- Mỗi khi thêm nội dung vào `CLAUDE.md`, nếu file dài quá 50 dòng thì đề nghị
  người dùng rút gọn trước. Chỉ rút gọn khi người dùng đồng ý.
- Khi người dùng phải nhắc cùng một yêu cầu đến lần thứ 2, tự ghi yêu cầu đó
  thành quy tắc trong `CLAUDE.md` (rồi tự commit và push như ngoại lệ ở trên).

## Dọn dẹp sau mỗi lần thay đổi
- Sau mỗi lần `git push` lên GitHub, hoặc sau khi sửa trực tiếp file trên máy,
  đề xuất danh sách có thể xóa: file, nhánh (cục bộ và remote), thư mục, mục
  trong file (ví dụ `README.md`, `ke-hoach/`), kèm lý do từng mục.
- Chỉ đề xuất, không xóa. Chỉ xóa đúng những mục người dùng đã đồng ý.
- Không tính "người dùng im lặng" là đồng ý; mỗi lần đề xuất hỏi lại một lần.
