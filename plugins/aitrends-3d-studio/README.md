# aiTrends 3D Studio

Plugin Claude Code biến **một kịch bản** thành **video hoạt hình 3D hoàn chỉnh** theo phong cách "What if…":
nhân vật người que 3D đầu tròn to, hero áo phao chanh tóc bạch kim anime, bối cảnh đơn giản mà điện ảnh, ánh sáng hoàng hôn phấn,
khung hình 2:1, sơ đồ giải thích hoạt hình.

Mọi khung hình đều dựng bằng code (Three.js) và render từng khung một. Không dùng AI tạo ảnh/video, nên nhân vật
giữ nguyên dáng suốt video và chữ luôn nét. Giọng đọc mặc định dùng Chatterbox (MIT, chạy máy cá nhân), dự phòng Kokoro-82M (Apache-2.0).

## Mới trong 1.0.6 — tự kiểm tra trước khi render và ghép file
- **Kiểm tra `story/shots.json` trước bản render cuối:** trùng id, cảnh chồng nhau, thời lượng không khớp cảnh cuối, hoặc thiếu file cảnh thì render dừng (`--force` để bỏ qua).
- **Trạng thái render:** sau bản cuối ghi `build/render_status.json`; có lỗi cảnh thì thoát mã 1 và `audio/mix.py` không ghép file.
- **Kiểm tra nhân vật trong cổng set match:** chạy `tools/cast_check.py` khi dự án có `scenes/cast.js`.
- **Kiểm tra file MP4 sau khi ghép:** có hình và tiếng, thời lượng khớp câu chuyện, fps đúng cấu hình; sai thì báo lỗi.

## Mới trong 1.0.4
- **Bảng điểm hình ảnh tự chạy** sau mỗi lần render bản cuối (độ sáng, độ rực, khung tối / trống / đứng yên, nhịp cảnh): in các mục cần xem ở cuối log, lưu `build/qc_scorecard.md` và đưa vào sổ bài học. Bỏ qua bằng `--no-scorecard`.
- **Bối cảnh sức mạnh và tập luyện** (`engine/strength12.js`): phòng tập tạ có tường gương phản chiếu thật (`T.W.weightRoom`), phòng leo núi với tuyến bám màu (`T.W.climbingGym`, `c.hold(i, k)`), tháp đèn sân vận động gãy chân, đứt cáp, đổ nghiêng (`T.W.lightTower`), lốp máy kéo 200 kg, thanh tạ có đĩa, góc livestream có ring light và số người xem (`T.W.streamCorner`), dãy tủ sắt rời đổ được (`T.W.lockerRow`). Demo: `examples/v104-sets`.
- **QC bắt tay/chân xuyên bàn:** kiểm tra cả đoạn chi (bắp tay, cẳng tay, đùi, cẳng chân), không chỉ các khớp. Cẳng tay cắm xuyên mặt bàn mỏng (cổ tay dưới bàn, khuỷu trên bàn) giờ là lỗi đỏ; tì sát mặt ghế vài cm không bị tính.

## Mới trong 1.0.3 — diễn xuất sống hơn, trang phục chuyển động, tháng 11 nước Mỹ
- **Khẩu hình theo lời thoại** cho mọi kiểu miệng (cả khi cười, há miệng), lông mày nhướng ở từ nhấn mạnh, người nghe gật đầu (`T.listen3`). Chỉ cần `face({ gt })`.
- **Tay có ngón:** đếm 1–5, chữ V, giơ ngón cái lên / xuống, xoè tay, chỉ lên (`handR: 'count3'`, tư thế `showCount`, `thumbsUp`, `peaceSign`).
- **Chạm đúng:** tay tự đặt lên mặt bàn, bục, ghế; chân bám đất khi bắt đầu và dừng bước; bộ kiểm tra coi chạm nhẹ là bình thường.
- **Trang phục chuyển động:** khăn lắc theo bước và bay theo gió, mũ hoodie có dáng thật, áo phao gom lại khi ngồi.
- **Bối cảnh tháng 11:** bữa tối Lễ Tạ ơn, phố bí ngô, cơn gió cuốn lá, trận bóng tối thứ Sáu.
- **Sổ bài học tự động:** sau mỗi lần render bản cuối, lỗi kiểm tra, lỗi render và góp ý của bạn được gộp vào `channel/LESSONS.md`; đầu video sau Claude đọc sổ và đưa danh sách việc cần chú ý (`node tools/retro.mjs --next`), ghi góp ý bằng `--note`. Sổ còn đề xuất bối cảnh hợp mùa (có sẵn chưa dùng và nên thêm mới), đồ hoạ và kỹ xảo (theo bảng điểm hình ảnh, kỹ xảo có sẵn ít dùng, kỹ xảo mới nên thêm).
- **Thumbnail 3D** theo 4 bố cục A–D của kênh (`T.thumb`, `--thumbs`). Ví dụ: `examples/v103-demo`, `examples/v103-thumb`.

## Mới trong 1.0.2 — chuyển động tự nhiên, bắt lỗi tự động
- **Kiểm tra lỗi tự động** (`--qc`): tay chân xuyên đồ vật hoặc người khác, mặt bị che, máy quay nằm trong tường / xe / người hoặc nhảy giữa cảnh, chân trượt, khớp giật. Còn lỗi đỏ thì không cho render bản cuối.
- **Máy quay thông minh:** tự né vật chắn để thấy rõ mặt, ưu tiên góc nhìn thấy mặt, giữ nguyên tắc 180° khi hai người nói chuyện.
- **Thư viện động tác** (`T.act`): mở cửa, nhặt / bê / đặt đồ, ngồi lên mọi độ cao, chạy dừng gấp, vấp ngã, nhảy qua vật, leo lên ghế, ôm, đập tay, khoác vai, kéo tay chạy, đỡ người ngã.
- **Ngoại hình nhân vật chính mới:** áo phao lửng chần bông phồng, viền và mũ xám than, quần jogger bo gấu, sneaker trắng có mũi giày, sọc xanh chanh, cổ giày, dây giày. Đang mặc bộ mùa thu (`HERO_FALL`): mũ hoodie xám nhạt, khăn vàng mù tạt, jogger nâu ô liu. Video cũ muốn giữ dáng cũ thì dùng `HERO_CLASSIC`.
- **Nhân vật:** tay dài hơn 25% (giơ tay cao hơn đầu), khớp không gập ngược, tay cầm nắm (cán ô, bút, quả bóng), váy áo lay theo bước đi.
- **Diễn xuất:** ánh mắt nhìn theo người / vật, giật mình quay lại khi có tiếng động, đám đông tự nói chuyện, cười, xem điện thoại.
- **Xem nhanh bằng GIF** (`--gif`) cho từng cảnh. Ví dụ: `examples/v102-motion` (18 cảnh).

## Mới trong 1.0.1 — trường trung học Mỹ
- **Bối cảnh:** thư viện, phòng thí nghiệm hóa, hội trường có sân khấu, sân bóng bầu dục đêm thứ Sáu (khán đài, bảng điểm, cột gôn), phòng thay đồ, phòng ban nhạc, phòng hiệu trưởng, phòng phạt, phòng y tá, nhà vệ sinh (gương phản chiếu thật), bãi đỗ xe học sinh, đêm dạ hội, quán diner thập niên 50, trạm xe buýt vàng ở khu ngoại ô.
- **Thời tiết và mùa:** lá phong mùa thu, ngày tuyết (tuyết phủ, tuyết rơi, hơi thở thành khói), mưa chảy trên kính cửa sổ lớp, kính mờ hơi nước, mất điện giữa giông, đèn báo động xoay (diễn tập lốc xoáy), mũ tốt nghiệp tung lên, pháo giấy, sương dưới đèn sân, giấy bay theo gió; chọn giờ trong ngày bằng `T.W.schoolTime('afterSchool')`.
- **Hoạt ảnh học sinh:** giơ tay, gục ngủ trên bàn, chuyền giấy, liếc bài, ngồi uể oải, viết bảng, ôm sách, bê khay, đeo balo một vai, mở khóa số và đóng sập tủ đồ, che ô / che chung ô, ném bóng / ném tuyết, cổ vũ, tung mũ, chui gầm bàn; đội mũ lên đầu bằng `ch.wear()`.
- **Góc máy trường học:** `hallwayWalk`, `lockerPeek`, `bleachers`, `cafeteriaWide`, `backRow`, `teacherView`, `doorWindow`.
- Ví dụ: `examples/v101-school` (20 cảnh, 50 giây).

## Mới trong 1.0.0
- **Đồ họa:** ánh sáng môi trường theo bầu trời của từng mood, da/tóc/giày bóng kiểu đồ chơi vinyl (clearcoat), áo có ánh vải (sheen), sàn bóng và đường ướt phản chiếu, bầu trời có mây, tia nắng có bụi bay, bóng tối góc tường.
- **Bối cảnh dựng sẵn:** cầu thang trường, lớp học, trạm xe buýt, phố hàng quán, khu dân cư (nhà có bậc thềm), quán ăn vỉa hè, quán cà phê, người qua đường.
- **Hoạt ảnh:** leo cầu thang, nhảy có co giãn (squash & stretch), ngồi xuống/đứng dậy, xoay người tại chỗ.
- **Thêm (1.0):** siêu thị, hành lang bệnh viện, sân thượng, ga tàu; tuyết đọng, vũng nước, lá rơi; sét, mây che nắng, đèn xe quét, đèn chập chờn; tóc/dây mũ/balo đung đưa; khẩu hình theo âm; nhòe chuyển động `"mblur": "action"` và vệt vung tay; 16 góc máy có tên (`"camera"` trong shots.json); chỉ số độ bóng trong bảng điểm QC.
- So sánh trước/sau: `node render.mjs --project P --stills 3,12 --legacy`.

## Lệnh
| Lệnh | Việc làm |
|---|---|
| "Làm video 3D từ kịch bản này" | chạy toàn bộ quy trình (skill `make-3d-video`) |
| `/new-3d-video` | đọc thiết lập kênh, soát kịch bản, cài studio, tạo giọng đọc, mốc thời gian, phân cảnh |
| `/3d-video-styles` | render chính các cảnh của bạn ở các phong cách và bảng màu để chọn |
| `/render-3d-video` | dựng và kiểm tra cảnh, xem thử, bảng điểm, render bản cuối, dọn file |
| `/3d-video-sound` | nhạc theo cảm xúc, hiệu ứng âm thanh, mix và ghép |

## Quy trình
1. **Thiết lập kênh và soát kịch bản:** đọc `channel/brand.json` nên không hỏi lại; `tools/script_check.py` chỉ gợi ý, không tự sửa lời.
2. **Cài studio** vào thư mục làm việc (`aitrends-3d-studio/`): ffmpeg, Node, Chromium, numpy/scipy, Kokoro, Chatterbox.
3. **Giọng đọc:** nghe thử → đọc toàn bộ → báo tốc độ từ/phút (mục tiêu 160–175) → mốc thời gian từng từ có tên người nói.
4. **Phân cảnh:** `story/bible.md` (bảng màu và thiết bị đặc trưng riêng của video), trang phục, `story/shots.json`.
5. **Chọn phong cách** từ ảnh render thật: `pearl` (mặc định của kênh) · cinematic · soft · ink · toon · golden · neon · noir, cùng 6 bảng màu.
6. **Dựng từng cảnh** theo lô 8–12, kiểm tra bằng contact sheet. Sơ đồ giải thích từ `engine/diagrams2d.js`.
7. **Âm thanh:** nhạc tự sinh theo cảm xúc, 36 hiệu ứng, tiếng nền.
8. **Render:** xem thử + bảng điểm → bản cuối → mix (−14 LUFS) → `out/<tên>.mp4` → dọn file, chỉ giữ MP4.

Có 5 điểm dừng để bạn duyệt: soát kịch bản, nghe thử giọng, chọn phong cách và bảng màu, xem thử kèm bảng điểm, bản cuối.

## Có gì mới ở 0.2.7 (thế giới, ánh sáng, HUD)
| Nhóm | Thay đổi |
|---|---|
| Bối cảnh thiên nhiên | `T.W.beach` (bãi cát, biển trong thấy chân khi lội, bọt sóng, cọ, mặt trời và vệt nắng trên nước lúc bình minh) · `island` (đảo giữa biển) · `snow` (dốc tuyết, thông phủ tuyết, núi, tuyết rơi, cực quang) · `farm` (chuồng đỏ, silo, hàng rào, ruộng, rơm) · `underwater` (đáy cát, tia nắng, rong lắc, vân sáng, đàn cá) · `space` + `planet` (trái đất xoay) |
| Tâm trạng mới | `beach`, `sunrise`, `snow`, `arctic`, `underwater`: cảnh sáng ban ngày, không chỉ đêm và trong nhà |
| Ánh sáng từ đồ vật | `FX3.fire` / `T.W.campfire` (lửa lập lòe chiếu mặt), `FX3.blade` (lưỡi sáng chiếu tay, mặt, tường), `FX3.torch` (đèn pin có tia), `FX3.glowLight` (ánh điện thoại trong bóng tối); ánh sáng đi theo đồ vật |
| HUD kiểu game | `userData.hud` trên nhân vật: bảng kính tên, cấp, thanh máu, chỉ số, tự thu nhỏ theo khoảng cách · `counters` trong shots.json: bộ đếm ở góc chạy xuyên các cảnh (DAY 15, 39/50, YOU 15 – 4 THEM) |
| Góc nhìn thứ nhất | `T.pov` + `T.povArms`: nhìn qua mắt hero, thấy tay áo phao chanh và bàn tay tròn đang cầm đồ |
| Sơ đồ | 47 icon (`D.icon`, `D.iconRow`, mọi pill/tag/HUD dùng chung tên) · `D.versus` (NGƯỜI THƯỜNG vs BẠN) |
| Vật thể vỡ, cháy, bắn nước | `FX3.slice` (cắt đôi, mặt cắt đỏ rực rồi nguội), `sparks` (tia lửa), `smoke` (khói), `debris` (mảnh vỡ văng rồi nằm yên), `splash` (bắn nước, vòng sóng) |
| Thú đồ chơi | `T.W.cow`, `sheep`, `pig`, `dog`, `cat`, `bird`, `crab`, `bee`, `fish`: mắt chấm như nhân vật, đi, vẫy đuôi, vỗ cánh, chớp mắt |
| Thể thao và đám đông lớn | `T.W.stadium` (5.000 khán giả), `boxingRing`, `track`, `pool` (người đứng trong nước), `formation` (đội quân bản sao), `crowd({ positions })` |
| Màn hình trong cảnh | `T.W.newsWall` (tường TV tin tức), `scoreboard3d` (bảng kết quả), `billboard` (biển quảng cáo), `feedDraw` (điện thoại đếm lượt xem), `newsDraw`, `boardDraw` |
| Kiểm tra | Bảng điểm thêm "tỉ lệ khung sáng" (mục tiêu 13–65%) và "số bối cảnh" (từ `set` trong shots.json) |
| Ví dụ | `examples/worlds-demo`: mỗi tính năng mới một shot (đợt 2 trong `wave2.js`) |

## Có gì mới ở 0.2.5 (chuyển động)
| Nhóm | Thay đổi |
|---|---|
| Diễn xuất | Chuyển tư thế có lấy đà và vượt đà, hông đi trước, đầu đến sau (`posesAt3`) · nhân vật nghỉ dồn trọng tâm, liếc nhìn (`idle3`) · người nói gật đầu, đánh tay theo từ (`speak3`) · người nghe quay đầu về phía người nói mà mặt vẫn hướng camera (`lookAtSpeaker`) · đi/chạy có tăng tốc, giảm tốc, không trượt chân (`walkTo`) |
| Khuôn mặt | Biểu cảm chuyển mượt 0,16 s, chớp mắt khi đổi biểu cảm · chớp mắt không đều, có chớp đôi · mắt liếc nhẹ · miệng theo chữ cái đang nói (a/e/i mở, o/u tròn, m/b/p khép) |
| Camera | `dolly` chạy một đường cong mượt qua mọi điểm · rung tay máy nhẹ cho mọi shot 3D (`config.handheld`) · `crashZoom`, `punch`, `dutch`, `rackFocus`, `chase` |
| Dựng phim | Whip pan có nhòe thật · smash cut · slow-motion cục bộ (`ramp` trong shots.json) |
| Đồ họa | Nhãn và thẻ thu nhỏ rời đi trước khi cắt (`end: 'shot'`) · số đếm tăng dần (`count: true`) · sân khấu tím có vệt sáng trôi và bụi bay (2D và 3D) |
| Kiểm tra | Bảng điểm thêm "khung gần như trống" (kèm thời điểm) và "nửa giây không có gì chuyển động" |

## Có gì mới ở 0.2.4
| Nhóm | Thay đổi |
|---|---|
| Ánh sáng | Bóng mềm dưới chân nhân vật và dưới đồ đạc · cảnh đêm/bão có đèn nhẹ từ phía máy quay làm sáng mặt, viền sáng mạnh hơn |
| Màu | Phong cách `pearl`: bối cảnh bớt đậm 16% (`setSat`), nhân vật giữ màu; độ bão hòa trung bình 0.488 → 0.451 trên Body Healed |
| Bối cảnh | Phòng `hospital` (giường có thanh chắn, máy đo tim chạy nhịp, cây truyền dịch, rèm, tủ, bồn rửa) · lớp học thêm đồng hồ, bảng ghim, giá sách · tường có ánh sáng nhạt dần, phào, tường hai màu |
| Đám đông | Có tóc, tay, màu trầm; nhấp nhô, lắc lư, giơ tay theo đợt |
| Chuyển động | Tóc trễ nhịp theo đầu, thân hơi kéo giãn khi bật lên/rơi xuống (`posesAt3`) |
| Chữ | Cỡ chữ tối thiểu cho bong bóng thoại, nhãn, thẻ · `config.textScale` |
| Kiểm tra | Bảng điểm thêm "tỉ lệ khung quá tối" |

## Có gì mới ở 0.2.3
| Nhóm | Thay đổi |
|---|---|
| Nhân vật | Dàn 25 vai trong `channel/cast.js`: gia đình, trường học, bệnh viện, cảnh sát, cứu hỏa, bảo vệ, đầu bếp, thu ngân, nhà khoa học, công nhân, phóng viên, cô giáo áo dài · `ROLES` nối từ trong kịch bản với vai |
| Engine | `engine/costume3d.js`: mũ y tá, kê-pi, mũ đầu bếp, mũ bảo hộ, ống nghe, dây thẻ, còi, phù hiệu, áo phản quang, tạp dề, râu, ria, hói, lông mày bạc, gậy, sách, micro… · áo `scrubs`, `aodai` · tư thế `hunch`, `hunchCane`, `handsOnHips`, `handsOnBelt`, `holdMic` |
| Sửa lỗi | Vành mũ không còn đổ vệt bóng ngang mặt · áo blouse trắng ngà thay vì trắng tinh |

## Có gì mới ở 0.2.0
| Nhóm | Thay đổi |
|---|---|
| Hình ảnh | Dải đen 2:1 · phong cách `pearl` · 6 bảng màu riêng từng video · mặt `deadpan`, `unimpressed` · áo phao chính thức · da không còn cháy sáng |
| Giải thích | Khoảng 25 sơ đồ hoạt hình · sơ đồ trên chính cảnh đó làm mờ · bong bóng thoại tự động |
| Dựng phim | Góc máy siêu cận, đầu khổng lồ tiền cảnh · nhắc đăng ký bằng hero ở khoảng 1:30 |
| Kịch bản | Bước soát kịch bản, chỉ gợi ý · thiết bị đặc trưng cho mỗi video |
| Quy trình | Bộ nhận diện kênh `channel/` · Chatterbox trong plugin · nhạc nền cân lại · bảng điểm `qc_metrics.py` · dọn file `tidy_project.py` |
| Sửa lỗi | `focusOn` lệch tâm bị mờ · `--out` lỗi ở bước ghép · nhà và trăng sai màu theo tâm trạng cảnh |

## Chất lượng xuất
| Tùy chọn | Giá trị |
|---|---|
| Độ phân giải | 720p · 1080p · 1440p · 2160p (4K) |
| Khung hình/giây | 24 · 30 · **60** |
| Preset | `draft` (nháp) · `standard` · **`high`** (MSAA 4×, CRF 14) · `max` (thêm siêu lấy mẫu 1,5×, CRF 10) |
| Nâng cấp khi xuất | `upscale 1440p` / `2160p`: YouTube cấp bản VP9/AV1 bitrate cao, nét hơn cả khi người xem chọn 1080p |

Bản xuất: H.264 High, BT.709, AAC 48 kHz 384 kb/s, đúng khuyến nghị tải lên của YouTube. Mặc định của kênh:
**1080p60 · high**, kèm `upscale 1440p`.

## Thời gian render
- Máy **có GPU** (PC Windows/macOS): phần 3D gần như không tốn thời gian, còn lại chủ yếu là chụp khung và chỉnh màu.
  Chạy `--bench` để có số của máy bạn.
- Máy **không GPU** (máy chủ, phiên cloud): khoảng 0,6 khung/giây ở 1080p chất lượng high.
  - Nên xem thử bản 720p trước, rồi render bản cuối qua đêm hoặc trên máy có GPU.

## Tận dụng GPU (ví dụ GTX 1660 Super 6 GB)
- Trên Windows, renderer tự dùng GPU, không cần cấu hình. Dòng đầu log in tên card.
  Nếu thấy `SwiftShader` là GPU chưa được dùng: cập nhật driver NVIDIA rồi chạy `npx playwright install chromium`.
- **NVENC** được dùng tự động khi ffmpeg có `h264_nvenc`. Ép chọn: `--encoder nvenc` hoặc `--encoder x264`.
- Khi Chatterbox đang tạo giọng, **không render gì khác**: card 6 GB vượt bộ nhớ sẽ chậm đi hơn 10 lần.

## Cài đặt plugin
- **Mở repo này bằng Claude Code**: plugin đã khai báo sẵn trong `.claude/settings.json`.
- **Cài cho mọi thư mục trên máy** (Claude Code):
  ```bash
  /plugin marketplace add vmthuan703/AI_youtube
  /plugin install aitrends-3d-studio@ai-youtube
  ```
- **Claude Desktop / claude.ai**: `bash plugins/build_zip.sh`, rồi tải `dist/aitrends-3d-studio-<phiên bản>.zip` lên mục Plugins.
- **Cập nhật studio đã cài:** chép `kit/` mới đè lên, **giữ nguyên `channel/`**, `projects/`, `refs/`, `.venvs/`, `.cache/`.

## Nội dung
- `skills/make-3d-video/`: quy trình đầy đủ, tài liệu tham chiếu và bộ studio (`kit/`: renderer, engine 3D, TTS, công cụ, âm thanh, `channel/`, ví dụ).
- `skills/new-3d-video`, `3d-video-styles`, `render-3d-video`, `3d-video-sound`: các lệnh theo giai đoạn.

Không cần API key hay connector.
