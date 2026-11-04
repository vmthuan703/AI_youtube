"""Thu thập thumbnail video của đối thủ để học cách làm thumbnail.

Đọc snapshot videos.csv mới nhất do market_watch.py tạo (nhánh research/reports),
chọn video dài đúng ngách, tải thumbnail từ i.ytimg.com (không tốn quota API),
rồi ghép thành các tờ ảnh liên hoàn (contact sheet) để xem nhanh.

Nhóm được chọn cho mỗi kênh:
  - top    : video nhiều view nhất của kênh
  - flop   : video ít view nhất (đã đăng ≥ 7 ngày), để so với video thắng
Kèm hệ số "rel" = view / trung vị view video dài của chính kênh.

Đầu ra (trong --out):
  index.csv              mỗi dòng một thumbnail + chỉ số màu/độ sáng (+ chữ OCR nếu có tesseract)
  img/<video_id>.jpg     ảnh 640x360
  sheets/*.jpg           tờ ảnh: top theo view, top theo rel, flop, và từng kênh lớn
  README.md              mô tả nhanh

Chạy:
  python tools/thumbnails/collect_thumbnails.py --root research --out research/thumbnails/2026-11-04
"""
from __future__ import annotations

import argparse
import colorsys
import csv
import io
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone
from statistics import median

from PIL import Image, ImageDraw, ImageFont, ImageStat

NICHE_RX = re.compile(r"\bwhat\s*if\b|\bhypothetical\b|\bimagine if\b|\bwhat would happen if\b", re.I)
SIZES = ["maxresdefault", "sddefault", "hqdefault"]
W, H = 640, 360
INDEX_FIELDS = [
    "group", "channel", "channel_id", "video_id", "title", "published_at", "age_days",
    "views", "channel_median", "rel", "file", "brightness", "saturation", "contrast",
    "dominant_hex", "warm_share", "ocr_text", "ocr_words",
]


def latest_snapshot(root):
    data = os.path.join(root, "data")
    days = sorted(d for d in os.listdir(data) if re.fullmatch(r"\d{4}-\d{2}-\d{2}", d)
                  and os.path.exists(os.path.join(data, d, "videos.csv")))
    if not days:
        sys.exit(f"Không thấy data/<ngày>/videos.csv trong {root}")
    return days[-1], os.path.join(data, days[-1], "videos.csv")


def load_videos(path, market="whatif-us"):
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    out = []
    for r in rows:
        if market and r.get("market") != market:
            continue
        if r.get("is_long") not in ("True", "true", "1") or r.get("exclude_reason"):
            continue
        if not NICHE_RX.search(r.get("title", "")):
            continue
        try:
            r["views"] = int(float(r.get("views") or 0))
        except ValueError:
            continue
        out.append(r)
    return out


def age_days(iso, now):
    try:
        t = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return 0
    return max(0, (now - t).days)


def select(videos, now, top_per_channel=4, flop_per_channel=2, min_videos=4, flop_min_age=7):
    """Chọn video top + flop cho từng kênh, kèm rel = view / trung vị kênh."""
    by_ch = {}
    for v in videos:
        by_ch.setdefault(v["channel_id"], []).append(v)
    picked = []
    for ch_id, vs in by_ch.items():
        if len(vs) < min_videos:
            continue
        med = median(v["views"] for v in vs) or 1
        for v in vs:
            v["age_days"] = age_days(v.get("published_at", ""), now)
            v["channel_median"] = int(med)
            v["rel"] = round(v["views"] / med, 2)
        vs = sorted(vs, key=lambda v: v["views"], reverse=True)
        tops = vs[:top_per_channel]
        old = [v for v in vs if v["age_days"] >= flop_min_age and v not in tops]
        flops = old[-flop_per_channel:] if flop_per_channel else []
        picked += [dict(v, group="top") for v in tops]
        picked += [dict(v, group="flop") for v in flops]
    return picked


def fetch(video_id, opener=urllib.request.urlopen, retries=3):
    """Tải thumbnail lớn nhất có thật (YouTube trả ảnh xám 120x90 khi không có maxres)."""
    for size in SIZES:
        url = f"https://i.ytimg.com/vi/{video_id}/{size}.jpg"
        for i in range(retries):
            try:
                with opener(url, timeout=20) as r:
                    data = r.read()
                img = Image.open(io.BytesIO(data)).convert("RGB")
                if img.width <= 120:
                    break                      # ảnh giữ chỗ, thử cỡ nhỏ hơn
                return crop_16_9(img)
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    break
                time.sleep(2 ** i)
            except Exception:
                time.sleep(2 ** i)
    return None


def crop_16_9(img):
    """sd/hqdefault là 4:3 có viền đen trên dưới: cắt lấy phần 16:9 ở giữa."""
    w, h = img.size
    if abs(w / h - 16 / 9) > 0.05:
        nh = round(w * 9 / 16)
        top = (h - nh) // 2
        img = img.crop((0, top, w, top + nh))
    return img.resize((W, H), Image.LANCZOS)


def color_stats(img):
    small = img.resize((64, 36))
    b = small.tobytes()
    px = [tuple(b[i:i + 3]) for i in range(0, len(b), 3)]
    hsv = [colorsys.rgb_to_hsv(r / 255, g / 255, b / 255) for r, g, b in px]
    sat = sum(s for _, s, _ in hsv) / len(hsv)
    warm = sum(1 for h, s, v in hsv if s > 0.35 and v > 0.3 and (h < 0.12 or h > 0.92)) / len(hsv)
    gray = img.convert("L")
    st = ImageStat.Stat(gray)
    q = small.quantize(colors=4, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[:12]
    counts = sorted(q.getcolors(), reverse=True)
    top = counts[0][1]
    dom = "#%02x%02x%02x" % tuple(pal[top * 3: top * 3 + 3])
    return {
        "brightness": round(st.mean[0] / 255, 3),
        "contrast": round(st.stddev[0] / 255, 3),
        "saturation": round(sat, 3),
        "dominant_hex": dom,
        "warm_share": round(warm, 3),
    }


def ocr(path):
    if not shutil.which("tesseract"):
        return ""
    try:
        r = subprocess.run(["tesseract", path, "-", "--psm", "11"], capture_output=True,
                           text=True, timeout=30)
    except Exception:
        return ""
    words = re.findall(r"[A-Za-z0-9$%!?']{2,}", r.stdout)
    return " ".join(words)


def font(size):
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def contact_sheet(rows, img_dir, path, title, cols=4, tw=400):
    if not rows:
        return
    th = tw * 9 // 16
    cap = 46
    n_rows = (len(rows) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, 40 + n_rows * (th + cap)), "white")
    d = ImageDraw.Draw(sheet)
    d.text((8, 8), title, fill="black", font=font(20))
    f = font(13)
    for i, r in enumerate(rows):
        x, y = (i % cols) * tw, 40 + (i // cols) * (th + cap)
        try:
            sheet.paste(Image.open(os.path.join(img_dir, r["file"])).resize((tw - 4, th)), (x + 2, y))
        except Exception:
            continue
        line1 = f"#{i + 1} {int(r['views']):,} view · x{r['rel']} · {r['channel'][:22]}"
        d.text((x + 4, y + th + 2), line1, fill="black", font=f)
        d.text((x + 4, y + th + 20), r["title"][:52], fill="#444", font=f)
    sheet.save(path, quality=85)


def build_sheets(rows, out, per_sheet=20, channel_min=5):
    img_dir = os.path.join(out, "img")
    sd = os.path.join(out, "sheets")
    os.makedirs(sd, exist_ok=True)
    made = []

    def emit(name, title, rs):
        for k in range(0, len(rs), per_sheet):
            fn = f"{name}_{k // per_sheet + 1}.jpg"
            contact_sheet(rs[k:k + per_sheet], img_dir, os.path.join(sd, fn), f"{title} ({k + 1}-{k + len(rs[k:k + per_sheet])})")
            made.append(fn)

    tops = [r for r in rows if r["group"] == "top"]
    emit("top_views", "Top theo view", sorted(tops, key=lambda r: -int(r["views"]))[:60])
    emit("top_rel", "Top theo rel (view / trung vị kênh)",
         sorted(tops, key=lambda r: -float(r["rel"]))[:40])
    emit("flop", "Flop (video yếu nhất mỗi kênh)",
         sorted([r for r in rows if r["group"] == "flop"], key=lambda r: float(r["rel"]))[:40])
    return made


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default="research", help="thư mục chứa data/<ngày>/videos.csv")
    ap.add_argument("--videos", help="đường dẫn videos.csv (mặc định: snapshot mới nhất trong --root)")
    ap.add_argument("--out", help="thư mục đầu ra (mặc định: <root>/thumbnails/<ngày>)")
    ap.add_argument("--market", default="whatif-us")
    ap.add_argument("--top", type=int, default=4)
    ap.add_argument("--flop", type=int, default=2)
    args = ap.parse_args(argv)

    if args.videos:
        day, path = os.path.basename(os.path.dirname(args.videos)), args.videos
    else:
        day, path = latest_snapshot(args.root)
    out = args.out or os.path.join(args.root, "thumbnails", day)
    os.makedirs(os.path.join(out, "img"), exist_ok=True)

    now = datetime.now(timezone.utc)
    picked = select(load_videos(path, args.market), now, args.top, args.flop)
    print(f"Snapshot {day}: chọn {len(picked)} thumbnail")

    rows, missing = [], 0
    for v in picked:
        vid = v["video_id"]
        fn = f"{vid}.jpg"
        fp = os.path.join(out, "img", fn)
        if not os.path.exists(fp):
            img = fetch(vid)
            if img is None:
                missing += 1
                continue
            img.save(fp, quality=82)
        img = Image.open(fp).convert("RGB")
        text = ocr(fp)
        rows.append({
            "group": v["group"], "channel": v["channel_title"].strip(), "channel_id": v["channel_id"],
            "video_id": vid, "title": v["title"], "published_at": v.get("published_at", ""),
            "age_days": v["age_days"], "views": v["views"], "channel_median": v["channel_median"],
            "rel": v["rel"], "file": fn, **color_stats(img),
            "ocr_text": text, "ocr_words": len(text.split()),
        })

    with open(os.path.join(out, "index.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=INDEX_FIELDS)
        w.writeheader()
        w.writerows(rows)
    sheets = build_sheets(rows, out)
    with open(os.path.join(out, "README.md"), "w", encoding="utf-8") as f:
        f.write(f"# Thumbnail đối thủ · snapshot {day}\n\n"
                f"- {len(rows)} ảnh ({sum(r['group'] == 'top' for r in rows)} top, "
                f"{sum(r['group'] == 'flop' for r in rows)} flop), thiếu {missing}.\n"
                f"- `rel` = view / trung vị view video dài của chính kênh.\n"
                f"- Bảng đầy đủ: `index.csv`. Tờ ảnh: " + ", ".join(f"`sheets/{s}`" for s in sheets) + "\n")
    print(f"Xong: {len(rows)} ảnh, thiếu {missing}, {len(sheets)} tờ ảnh → {out}")


if __name__ == "__main__":
    main()
