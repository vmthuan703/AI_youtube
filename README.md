# AI_youtube

Công cụ tự động hoá quy trình làm kênh YouTube.

## 1. Tìm ngách: `niche_finder.py`

Tìm các chủ đề mà **kênh mới** vẫn có video nhiều view, theo từng quốc gia.

```bash
pip install -r requirements.txt
export YOUTUBE_API_KEY=khoá_của_bạn

# thử nhỏ trước: 1 từ khoá x 1 quốc gia = 100 đơn vị quota
python niche_finder.py -k "ancient history" -r US

# nhiều từ khoá, nhiều quốc gia
python niche_finder.py -k "true crime" "history documentary" -r US VN JP --language en
```

Kết quả: bảng tóm tắt trên màn hình và file `niches.csv` (mở bằng Excel/Sheets) gồm
mỗi video của kênh mới: view, view/ngày, số subscriber, `views_to_subs`, ngày tạo kênh...

Cách đọc: ngách tốt là ngách có **nhiều kênh mới khác nhau** (cột `kênh mới`) cùng có
view/ngày cao, và `views_to_subs` lớn (video vượt xa số người đăng ký).

Tuỳ chọn chính: `--channel-age-days` (mặc định 180), `--video-age-days` (mặc định 90),
`--language`, `--out`.

**Quota:** mặc định 10.000 đơn vị/ngày; mỗi lần tìm = 100 đơn vị (≈100 lượt/ngày). Kết quả
được cache 24 giờ trong `cache.sqlite` nên chạy lại cùng tham số không tốn quota.

Chạy test (không gọi API thật): `python -m pytest`
