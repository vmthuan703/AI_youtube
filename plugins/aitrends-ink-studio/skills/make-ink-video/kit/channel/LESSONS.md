# Sổ bài học của kênh

Tự cập nhật sau mỗi lần render bản cuối (plugin 1.0.3, `tools/retro.mjs`). 15 video, cập nhật 2026-11-26.

## Việc cần chú ý cho video tiếp theo

1. **Tay và ngón tay** (gặp ở 6/15 video, 4 góp ý của bạn): Dùng tư thế có sẵn (showCount, thumbsUp, peaceSign, raiseHand) và hand mode (count1–5, grip, pinch); oneStrap chỉ dùng khi có ba lô.
2. **Xuyên vật / xuyên người** (gặp ở 6/15 video, 4 góp ý của bạn): Đặt ghế, bục, bàn bằng anchor của bối cảnh (seat(), podium) và dùng T.act.sitOn; giữ khoảng cách 0,5 m giữa hai người trừ khi ôm / đập tay; chạy --qc trước khi render.
3. **Chân trượt** (gặp ở 5/15 video): Đi bằng T.walkTo với t0 / t1 đủ dài (≥ 0,8 s cho 1 m); không dời ch.position bằng tay khi chân đang đứng.
4. **Chuyển động giật, khựng** (gặp ở 3/15 video, 3 góp ý của bạn): Dùng T.flow3 cho mọi động tác vung, ném, với tay; không nối posesAt3 với khoảng < 0,3 s; xem GIF (--gif) từng cảnh có người cử động.
5. **Trang phục** (gặp ở 2/15 video, 2 góp ý của bạn; plugin đã xử lý ở 1.0.2 áo phao, quần, giày, bộ thu, kiểm tra lại): Lấy trang phục từ channel/cast.js (HERO theo mùa); không tự chế màu cho nhân vật chính.

## Lỗi lặp lại theo loại

| Loại | Số video gặp | Đỏ | Vàng | Góp ý | Gần nhất | Plugin |
|---|---|---|---|---|---|---|
| Tay và ngón tay | 6/15 | 0 | 61 | 4 | 2026-11-16 | — |
| Xuyên vật / xuyên người | 6/15 | 0 | 102 | 4 | 2026-11-16 | — |
| Chân trượt | 5/15 | 0 | 128 | 0 | 2026-11-26 | — |
| Chuyển động giật, khựng | 3/15 | 0 | 1 | 3 | 2026-11-13 | — |
| Trang phục | 2/15 | 0 | 0 | 2 | 2026-11-12 | đã xử lý 1.0.2 |
| Kịch bản, nhịp kể | 2/15 | 0 | 0 | 2 | 2026-11-06 | — |
| Lỗi render / thiếu cảnh | 1/15 | 0 | 0 | 1 | 2026-11-11 | — |
| Bối cảnh, ánh sáng | 1/15 | 0 | 0 | 1 | 2026-11-06 | — |
| Âm thanh, nhạc, giọng | 1/15 | 0 | 0 | 1 | 2026-11-06 | — |
| Máy quay (trong tường, nhảy, che mặt) | 1/15 | 0 | 0 | 1 | 2026-11-06 | đã xử lý 1.0.2 |

## Nên sửa trong plugin (lặp lại ở ≥ 3 video hoặc bạn đã nhắc ≥ 2 lần, chưa có bản sửa)

- Tay và ngón tay
- Xuyên vật / xuyên người
- Chân trượt
- Chuyển động giật, khựng
- Kịch bản, nhịp kể

## Đề xuất khung cảnh và đồ hoạ cho video tiếp theo (mùa thu)

**Bối cảnh có sẵn hợp mùa, chưa dùng gần đây:**

- bữa tối Lễ Tạ ơn (`T.W.thanksgivingDinner`) — kênh chưa dùng lần nào
- trạm xe buýt khu dân cư (`T.W.suburbStop`) — kênh chưa dùng lần nào
- bãi đỗ xe học sinh (`T.W.studentLot`) — kênh chưa dùng lần nào
- thư viện (`T.W.library`) — kênh chưa dùng lần nào

**Bối cảnh mới nên thêm vào plugin:**

- Siêu thị ngày Black Friday: xe đẩy, kệ giảm giá, đám đông chen lấn
- Trận bóng bầu dục ngày Lễ Tạ ơn ở sân sau nhà, cả nhà cổ vũ
- Sân nhà ngập lá: đống lá cào, nhảy vào đống lá, máy thổi lá

**Hàng chờ bối cảnh (đã dựng riêng trong video, `channel/set_wishlist.json`):**

- mute icon over heads: 1 video (who-muted-you)
- gold star icon: 1 video (who-muted-you)
- orange headphones: 1 video (who-muted-you)
- oxygen mask: 1 video (who-muted-you)
- space heater: 1 video (who-muted-you)

**Đồ hoạ và kỹ xảo nên cải thiện:**

- Hình quá sáng ở trunks_ep01_demo (luma 0.477, nên 0.19–0.4): tăng ambient / dùng style pearl, tường sáng hơn.
- Màu nhạt ở trunks_ep01_demo (sat 0.197, nên 0.35–0.47): chỉ giữ áo nhân vật chính rực, nền trầm hơn.
- Khung trống ở trunks_ep01_demo (empty 0.05, nên 0–0.02): nhân vật to hơn, thêm đạo cụ tiền cảnh.
- Nâng cấp đồ hoạ trong engine: Sàn và đường ướt phản chiếu đèn sau mưa.
- Nâng cấp đồ hoạ trong engine: Bóng đổ mềm và ánh sáng dội (GI giả) trong phòng.

**Kỹ xảo có sẵn nên dùng lại (ít dùng gần đây):**

- vệt sáng theo chuyển động nhanh (`T.FX3.trail`), kênh chưa dùng lần nào
- vết chém xé khung hình (`T.FX3.slice`), kênh chưa dùng lần nào
- vệt gió khi vung tay (`T.FX3.swoosh`), kênh chưa dùng lần nào
- lưỡi năng lượng (`T.FX3.blade`), kênh chưa dùng lần nào

**Kỹ xảo mới nên thêm vào plugin:**

- Khung hình va chạm (impact frame): 2–3 khung đen trắng tương phản mạnh lúc cú đánh trúng
- Slow motion ở khoảnh khắc đỉnh, kèm vệt mờ chuyển động
- Năng lượng tụ về tay trước khi tung chiêu (charge-up: hạt hút vào, sáng dần)
- Tua ngược thời gian kiểu VHS: nhiễu sọc, chữ REWIND, mọi thứ chạy lùi

## Góp ý gần đây của bạn

- 2026-11-12 · who-muted-you: Bản xem trước 40 s: tay vẫn xuyên bàn căng tin; QC có bắt (172 đỏ) nhưng chỉ chạy lúc render cuối, preview gửi đi khi chưa chạy --qc
- 2026-11-12 · demo-1.0.1: Chuyển động rất giật, không tự nhiên
- 2026-11-12 · demo-1.0.1: Nhân vật ngồi xuyên qua ghế, đứng xuyên qua bục
- 2026-11-12 · demo-1.0.1: Tay nhân vật bị gập ở cảnh đầu
- 2026-11-12 · demo-1.0.1: Ném bóng và mở tủ đồ vẫn cứng
- 2026-11-12 · hero-outfit: Nhân vật chính thiếu quần và giày, cần trang phục theo mùa
- 2026-11-12 · borrow-strength: s037, s042: tay xuyên qua bàn căng tin; QC không bắt được vì chỉ kiểm khớp (sửa 1.0.4: kiểm cả đoạn chi; tư thế ngồi bàn cao dùng IK, không dùng sitDesk)
- 2026-11-11 · game-over: Tay giơ ngược hướng do sai dấu góc tay
- 2026-11-11 · game-over: schoolFront bus:false làm lỗi render (crash)
- 2026-11-08 · every-hit-stronger: Cảnh bước xuống xe buýt bị cứng, giật

## Từng video

| Video | Ngày | QC đỏ / vàng | Cảnh nhiều lỗi nhất |
|---|---|---|---|
| trunks_ep01_demo | 2026-11-26 | 0 / 6 | s15, s18 |
| helping-the-wrong-way | 2026-11-16 | 0 / 54 | s096, s182, s048, s185, s199 |
| see-who-needs-help | 2026-11-15 | 0 / 143 | s011, s019, s100, s010, s012 |
| quan-ca-phe-6h | 2026-11-15 | 0 / 0 | — |
| tau-sang-som | 2026-11-15 | 0 / 0 | — |
| who-muted-you | 2026-11-13 | 0 / 40 | s180, s195, s057, s164, s022 |
| demo-1.0.1 | 2026-11-12 | — | — |
| hero-outfit | 2026-11-12 | — | — |
| borrow-strength | 2026-11-12 | 0 / 49 | s105, s106, s123, s094, s124 |
| game-over | 2026-11-11 | — | — |
| every-hit-stronger | 2026-11-08 | — | — |
| who-would-date-you | 2026-11-08 | — | — |
| memory-100x-remake | 2026-11-06 | — | — |
| shrink-anything | 2026-11-06 | — | — |
| body-healed | 2026-11-06 | — | — |
