#!/usr/bin/env python3
"""Tìm ngách YouTube mà kênh MỚI vẫn có video nhiều view.

Với mỗi (từ khoá, quốc gia): tìm video, lấy thông tin kênh, giữ lại các kênh
tạo gần đây, tính tỉ lệ view/subscriber và tốc độ tăng view, rồi xuất CSV.

Quota (hạn mức mặc định 10.000 đơn vị/ngày):
  search.list = 100, videos.list = 1, channels.list = 1.
Mọi phản hồi được cache trong SQLite để không tốn quota khi chạy lại.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import sqlite3
import sys
import time
from datetime import datetime, timedelta, timezone

import requests

API = "https://www.googleapis.com/youtube/v3"
COST = {"search": 100, "videos": 1, "channels": 1}
CSV_FIELDS = [
    "keyword", "region", "video_id", "title", "video_url", "published_at",
    "views", "views_per_day", "channel_id", "channel_title", "channel_url",
    "channel_created", "channel_age_days", "subscribers", "subs_hidden",
    "channel_total_views", "channel_video_count", "views_to_subs",
]


class Client:
    """Gọi YouTube Data API có cache SQLite và đếm quota."""

    def __init__(self, api_key, cache_path="cache.sqlite", ttl_hours=24, session=None):
        self.key = api_key
        self.ttl = ttl_hours * 3600
        self.session = session or requests.Session()
        self.units_used = 0
        self.db = sqlite3.connect(cache_path)
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS cache (k TEXT PRIMARY KEY, ts REAL, body TEXT)"
        )

    def get(self, endpoint, **params):
        k = hashlib.sha256(
            json.dumps([endpoint, sorted(params.items())]).encode()
        ).hexdigest()
        row = self.db.execute("SELECT ts, body FROM cache WHERE k=?", (k,)).fetchone()
        if row and time.time() - row[0] < self.ttl:
            return json.loads(row[1])
        r = self.session.get(
            f"{API}/{endpoint}", params={**params, "key": self.key}, timeout=30
        )
        if r.status_code != 200:
            try:
                msg = r.json()["error"]["message"]
            except Exception:
                msg = r.text[:200]
            raise RuntimeError(f"YouTube API {endpoint} lỗi {r.status_code}: {msg}")
        self.units_used += COST[endpoint]
        body = r.json()
        self.db.execute(
            "INSERT OR REPLACE INTO cache VALUES (?,?,?)", (k, time.time(), json.dumps(body))
        )
        self.db.commit()
        return body


def parse_time(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def chunks(seq, n=50):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


def search_videos(client, keyword, region, published_within_days, max_results=50,
                  language=None):
    after = datetime.now(timezone.utc) - timedelta(days=published_within_days)
    params = dict(
        part="id", q=keyword, type="video", order="viewCount",
        maxResults=max_results, regionCode=region,
        publishedAfter=after.strftime("%Y-%m-%dT00:00:00Z"),
    )
    if language:
        params["relevanceLanguage"] = language
    items = client.get("search", **params).get("items", [])
    return [i["id"]["videoId"] for i in items if "videoId" in i.get("id", {})]


def fetch_videos(client, ids):
    out = {}
    for batch in chunks(ids):
        for v in client.get("videos", part="snippet,statistics", id=",".join(batch)).get("items", []):
            out[v["id"]] = v
    return out


def fetch_channels(client, ids):
    out = {}
    for batch in chunks(sorted(set(ids))):
        for c in client.get("channels", part="snippet,statistics", id=",".join(batch)).get("items", []):
            out[c["id"]] = c
    return out


def build_rows(keyword, region, videos, channels, max_channel_age_days, now=None):
    now = now or datetime.now(timezone.utc)
    rows = []
    for vid, v in videos.items():
        ch = channels.get(v["snippet"]["channelId"])
        if not ch:
            continue
        created = parse_time(ch["snippet"]["publishedAt"])
        age = (now - created).days
        if age > max_channel_age_days:
            continue
        views = int(v["statistics"].get("viewCount", 0))
        days = max((now - parse_time(v["snippet"]["publishedAt"])).days, 1)
        cs = ch["statistics"]
        hidden = bool(cs.get("hiddenSubscriberCount"))
        subs = None if hidden else int(cs.get("subscriberCount", 0))
        rows.append({
            "keyword": keyword, "region": region, "video_id": vid,
            "title": v["snippet"]["title"],
            "video_url": f"https://www.youtube.com/watch?v={vid}",
            "published_at": v["snippet"]["publishedAt"],
            "views": views, "views_per_day": round(views / days, 1),
            "channel_id": ch["id"], "channel_title": ch["snippet"]["title"],
            "channel_url": f"https://www.youtube.com/channel/{ch['id']}",
            "channel_created": ch["snippet"]["publishedAt"], "channel_age_days": age,
            "subscribers": "" if hidden else subs, "subs_hidden": hidden,
            "channel_total_views": int(cs.get("viewCount", 0)),
            "channel_video_count": int(cs.get("videoCount", 0)),
            "views_to_subs": "" if not subs else round(views / subs, 2),
        })
    return rows


def run(client, keywords, regions, channel_age_days, video_age_days, max_results, language=None):
    rows = []
    for region in regions:
        for kw in keywords:
            ids = search_videos(client, kw, region, video_age_days, max_results, language)
            if not ids:
                continue
            videos = fetch_videos(client, ids)
            channels = fetch_channels(client, [v["snippet"]["channelId"] for v in videos.values()])
            rows += build_rows(kw, region, videos, channels, channel_age_days)
    rows.sort(key=lambda r: r["views_per_day"], reverse=True)
    return rows


def summarize(rows):
    """Gom theo (từ khoá, quốc gia): số kênh mới thắng và view/ngày trung vị."""
    groups = {}
    for r in rows:
        groups.setdefault((r["keyword"], r["region"]), []).append(r)
    out = []
    for (kw, region), rs in groups.items():
        vpd = sorted(r["views_per_day"] for r in rs)
        out.append({
            "keyword": kw, "region": region,
            "new_channels": len({r["channel_id"] for r in rs}),
            "videos": len(rs),
            "median_views_per_day": vpd[len(vpd) // 2],
        })
    out.sort(key=lambda g: (g["new_channels"], g["median_views_per_day"]), reverse=True)
    return out


def write_csv(path, rows):
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        w.writeheader()
        w.writerows(rows)


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("-k", "--keywords", nargs="+", required=True, help="Từ khoá/chủ đề (mỗi từ khoá/quốc gia = 100 đơn vị quota)")
    p.add_argument("-r", "--regions", nargs="+", default=["US"], help="Mã quốc gia ISO, vd: US VN JP")
    p.add_argument("--language", help="relevanceLanguage, vd: en, vi")
    p.add_argument("--channel-age-days", type=int, default=180, help="Chỉ giữ kênh tạo trong N ngày gần đây (mặc định 180)")
    p.add_argument("--video-age-days", type=int, default=90, help="Chỉ tìm video đăng trong N ngày gần đây (mặc định 90)")
    p.add_argument("--max-results", type=int, default=50, help="Số video tối đa mỗi lần tìm (tối đa 50)")
    p.add_argument("--out", default="niches.csv")
    p.add_argument("--cache", default="cache.sqlite")
    p.add_argument("--cache-ttl-hours", type=float, default=24)
    a = p.parse_args(argv)

    key = os.environ.get("YOUTUBE_API_KEY")
    if not key:
        sys.exit("Thiếu biến môi trường YOUTUBE_API_KEY (xem .env.example).")
    est = len(a.keywords) * len(a.regions) * 100
    print(f"Ước tính quota tối đa: ~{est} đơn vị (chưa tính cache).")

    client = Client(key, a.cache, a.cache_ttl_hours)
    try:
        rows = run(client, a.keywords, a.regions, a.channel_age_days,
                   a.video_age_days, min(a.max_results, 50), a.language)
    except RuntimeError as e:
        sys.exit(str(e))
    write_csv(a.out, rows)

    print(f"\nQuota đã dùng lần này: {client.units_used} đơn vị. Ghi {len(rows)} dòng vào {a.out}\n")
    print(f"{'từ khoá':<24}{'QG':<5}{'kênh mới':>9}{'video':>7}{'view/ngày (trung vị)':>22}")
    for g in summarize(rows):
        print(f"{g['keyword'][:23]:<24}{g['region']:<5}{g['new_channels']:>9}{g['videos']:>7}{g['median_views_per_day']:>22}")


if __name__ == "__main__":
    main()
