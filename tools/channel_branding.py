"""Bổ sung dữ liệu nhận diện kênh (từ khoá, avatar, banner, thống kê thật) vào bảng kênh.

Dùng YouTube Data API v3 channels.list (1 đơn vị quota/kênh). Khoá đọc từ biến môi trường
YOUTUBE_API_KEY; không bao giờ ghi khoá vào file.
Chạy: python tools/channel_branding.py [--csv data/channels_2026-11-04.csv] [--img-dir reports/2026-11-04/branding]
Cột mới được ghi thêm vào cuối cùng bảng (chạy lại thì ghi đè các cột này).
"""
import argparse, csv, os, sys
from pathlib import Path
import requests

API = "https://www.googleapis.com/youtube/v3/channels"
NEW = ["API: channel_id", "API: ngày tạo kênh", "API: quốc gia", "API: subscribers (làm tròn bởi YouTube)",
       "API: tổng view", "API: tổng video", "API: từ khoá kênh (brandingSettings.keywords)",
       "API: mô tả kênh", "API: URL avatar", "API: URL banner", "API: file avatar", "API: file banner",
       "API: trạng thái"]


def split_keywords(s):
    """keywords của YouTube: cụm có khoảng trắng nằm trong dấu ngoặc kép."""
    out, cur, q = [], "", False
    for ch in s:
        if ch == '"':
            q = not q
        elif ch == " " and not q:
            if cur:
                out.append(cur); cur = ""
        else:
            cur += ch
    if cur:
        out.append(cur)
    return out


def fetch(handle, key):
    r = requests.get(API, params={"part": "snippet,brandingSettings,statistics", "forHandle": handle, "key": key}, timeout=30)
    r.raise_for_status()
    items = r.json().get("items", [])
    return items[0] if items else None


def download(url, path):
    if not url:
        return ""
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    path.write_bytes(r.content)
    return str(path)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--csv", default="data/channels_2026-11-04.csv")
    p.add_argument("--img-dir", default="reports/2026-11-04/branding")
    a = p.parse_args()
    key = os.environ.get("YOUTUBE_API_KEY")
    if not key:
        sys.exit("Thiếu YOUTUBE_API_KEY")
    with open(a.csv, encoding="utf-8-sig", newline="") as f:
        rd = csv.DictReader(f)
        base = [c for c in rd.fieldnames if c not in NEW]
        rows = list(rd)
    img = Path(a.img_dir); img.mkdir(parents=True, exist_ok=True)
    for row in rows:
        h = row["Handle"]
        for c in NEW:
            row[c] = ""
        try:
            it = fetch(h, key)
        except Exception as e:
            row["API: trạng thái"] = f"lỗi: {e}"[:200]; continue
        if not it:
            row["API: trạng thái"] = "không tìm thấy handle"; continue
        sn, st = it["snippet"], it.get("statistics", {})
        br = it.get("brandingSettings", {})
        ch = br.get("channel", {})
        avatar = (sn.get("thumbnails", {}).get("high") or sn.get("thumbnails", {}).get("default") or {}).get("url", "")
        banner = br.get("image", {}).get("bannerExternalUrl", "")
        slug = h.lstrip("@")
        fa = fb = ""
        try:
            fa = download(avatar, img / f"{slug}_avatar.jpg")
            fb = download(banner + "=w2560" if banner else "", img / f"{slug}_banner.jpg")
        except Exception:
            row["API: trạng thái"] = "ok; chưa tải được ảnh (host ảnh bị chặn)"
        row.update({
            "API: channel_id": it["id"], "API: ngày tạo kênh": sn.get("publishedAt", "")[:10],
            "API: quốc gia": sn.get("country", ""),
            "API: subscribers (làm tròn bởi YouTube)": "" if st.get("hiddenSubscriberCount") else st.get("subscriberCount", ""),
            "API: tổng view": st.get("viewCount", ""), "API: tổng video": st.get("videoCount", ""),
            "API: từ khoá kênh (brandingSettings.keywords)": " | ".join(split_keywords(ch.get("keywords", ""))),
            "API: mô tả kênh": (ch.get("description") or sn.get("description", "")).replace("\n", " "),
            "API: URL avatar": avatar, "API: URL banner": banner, "API: file avatar": fa, "API: file banner": fb,
        })
        row["API: trạng thái"] = row["API: trạng thái"] or "ok"
        print(h, row["API: trạng thái"], "| tags:", row["API: từ khoá kênh (brandingSettings.keywords)"][:80])
    with open(a.csv, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=base + NEW)
        w.writeheader(); w.writerows(rows)


if __name__ == "__main__":
    main()
