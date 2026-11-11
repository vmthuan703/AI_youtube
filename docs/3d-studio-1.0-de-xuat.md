# aiTrends 3D Studio 1.0.0: đề xuất nâng cấp đồ họa

Ngày 2026-11-11. Nhánh `feature/3d-1.0.0`. Demo: `plugins/aitrends-3d-studio/skills/make-3d-video/kit/examples/v1-demo`.

## Đã làm trong 1.0.0 (có trong demo)

| Nhóm | Nâng cấp | Cách dùng |
|---|---|---|
| Độ bóng | Ánh sáng môi trường lấy từ bầu trời, mặt đất và mặt trời của từng mood: mọi vật liệu có phản chiếu nhẹ, khớp màu bối cảnh | tự bật; `stage({ env })`, `style.env` |
| Độ bóng | Da, tóc, giày bóng kiểu đồ chơi vinyl (clearcoat); áo có ánh vải (sheen) | tự bật; `style.gloss` 0–1.5 |
| Độ bóng | Sàn bóng và đường ướt phản chiếu, có nhòe và fresnel | `T.W.mirror` |
| Kỹ xảo | Bầu trời có mây và quầng mặt trời | `T.W.skyDome` |
| Kỹ xảo | Tia nắng qua cửa sổ, có bụi bay | `T.W.shafts` |
| Kỹ xảo | Bóng tối mềm ở chân tường, dây đèn bóng tròn | `T.W.aoStrip`, `T.W.stringLights` |
| Kỹ xảo | Bóng đổ nét hơn quanh nhân vật | `st.fitShadow` |
| Hoạt ảnh | Leo cầu thang (nâng gối, nghiêng người) | `T.climb` |
| Hoạt ảnh | Nhảy kiểu hoạt hình: lấy đà, duỗi, bay, co khi tiếp đất, nảy | `T.jump3`, `T.squash` |
| Hoạt ảnh | Ngồi xuống / đứng dậy tự nhiên; xoay người tại chỗ | `T.sitDown`, `T.turn3` |
| Bối cảnh | Cầu thang trường, lớp học, trạm xe buýt, phố hàng quán, khu dân cư, quán ăn vỉa hè, quán cà phê | `T.W.stairwell` … `T.W.cafe` |
| Bối cảnh | Người qua đường (lấy từ roster) | `T.W.passersby` |
| Công cụ | So sánh trước/sau cùng khung hình | `render.mjs --legacy` |

## Đề xuất cho các bản sau (chưa làm)

| # | Đề xuất | Lợi ích | Công sức |
|---|---|---|---|
| P1 | Tóc, dây mũ, balo đung đưa theo quán tính (lò xo tính theo thời gian) | nhân vật sống động hơn khi chạy, quay đầu | vừa |
| P2 | Khẩu hình theo âm vị từ `words.json` | lời thoại khớp miệng | vừa |
| P3 | Motion blur theo vật thể khi chạy nhanh, đấm, ngã | cảnh hành động mạnh hơn | vừa |
| P4 | Ánh sáng thay đổi theo kịch tính: đèn chớp, mây che nắng, đèn xe quét qua | không khí căng hơn | nhỏ |
| P5 | Thêm bối cảnh: siêu thị, bệnh viện hành lang, sân thượng, ga tàu, phòng gym trường, công viên nước | ít phải dựng bối cảnh riêng | vừa |
| P6 | Thời tiết trên bối cảnh: tuyết đọng, vũng nước, lá rơi | đa dạng mùa | nhỏ |
| P7 | Thư viện "góc máy" có tên (over-the-shoulder, low hero, dutch reveal) gắn vào shots.json | phân cảnh nhanh, đồng đều | nhỏ |
| P8 | Bảng điểm QC thêm chỉ số "độ bóng" và "phản chiếu" để phát hiện cảnh quá phẳng | giữ chất lượng đều | nhỏ |

## Lưu ý kỹ thuật
- Các bối cảnh mới chạy hiệu ứng qua `st.onTick`: trong `draw()` phải gọi `s.st.tick(t)` đầu tiên.
- `mirror` vẽ cảnh thêm một lần ở nửa độ phân giải; demo 28 giây 1080p30 render trong ~45 giây trên GTX 1660 SUPER.
- `?legacy` / `--legacy` tắt toàn bộ phần nhìn 1.0 để so sánh.
