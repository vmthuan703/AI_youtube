#!/usr/bin/env python3
"""Tự động nghiên cứu thị trường YouTube: thu thập hằng ngày, số liệu đối thủ hằng tuần.

  daily            Chạy mỗi ngày sau khi quota hồi (00:00 giờ Thái Bình Dương = 15h VN mùa đông).
                   1) Tìm video theo các truy vấn của từng ô thị trường (phát hiện kênh mới thắng).
                   2) Thêm kênh mới thắng vào danh sách theo dõi.
                   3) Chụp snapshot mọi kênh đang theo dõi (kênh + toàn bộ video).
                   -> <root>/data/YYYY-MM-DD/{discovery,channels,videos}.csv, run.json, TOM_TAT.md
  weekly           Gom snapshot N ngày (mặc định 7): bảng chấm ô, bảng đối thủ, video bung
                   (>= 10x trung vị của CHÍNH kênh đó), danh sách tiêu đề để đọc tay.
                   -> <root>/reports/YYYY-Www/SO_LIEU.md + CSV, cập nhật reports/INDEX.md
  prune            Bỏ kênh discovery lệch ngách khỏi danh sách theo dõi (daily cũng tự làm).
  index            Cập nhật reports/INDEX.md (sau khi viết BAO_CAO_DOI_THU.md).
  readme           Ghi báo cáo ngày mới nhất (TOM_TAT.md) và phần kết luận của báo cáo tuần mới nhất
                   vào các khối DAILY / WEEKLY (cặp dấu <!-- X:START --> ... <!-- X:END -->) của README.
  import-snapshot  Chuyển out/videos.csv của audience_research.py thành snapshot của một ngày.

Phương pháp lấy theo tài liệu "Cách dựng kênh tâm lý từ số 0": nhìn tuổi kênh của 5 kênh có
video to nhất (trung vị), view/sub trung vị, video bung so với trung vị của chính kênh,
chủ đề bung ở >= 2 kênh khác nhau. Mọi con số đều kèm cỡ mẫu.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
from datetime import date, datetime, timedelta, timezone
from statistics import median

import audience_research as ar
import niche_finder as nf

VN = timezone(timedelta(hours=7))           # Việt Nam không có giờ mùa hè
BIG_VIEWS = 100_000
BURST_X = ar.BURST_X                        # 10x trung vị của chính kênh
DEFAULT_CACHE = os.path.join(os.path.expanduser("~"), ".cache", "ai_youtube", "market_watch.sqlite")

REGISTRY_FIELDS = ["channel_id", "title", "handle", "market", "source", "first_seen", "reason"]
DISCOVERY_FIELDS = [
    "snapshot_date", "market", "query", "video_id", "title", "published_at", "age_days",
    "duration_s", "is_long", "views", "views_per_day", "channel_id", "channel_title",
    "channel_created", "channel_age_days", "subscribers", "views_to_subs",
]
CHANNEL_FIELDS = [
    "snapshot_date", "market", "channel_id", "title", "handle", "created_at", "subscribers",
    "subs_hidden", "total_views", "video_count", "observed_uploads", "uploads_complete",
    "first_upload_at",
]
VIDEO_FIELDS = [
    "snapshot_date", "market", "channel_id", "channel_title", "video_id", "title",
    "published_at", "duration_s", "is_long", "exclude_reason", "views", "likes", "comments",
]
SCORE_FIELDS = [
    "market", "name", "decisive_new_winner", "n_big_videos", "top5_median_age_months",
    "top5_age_source", "top5_median_views_to_subs", "median_big_views", "n_channels_seen",
    "niche_ok_top5", "gate_niche",
    "gate_decisive", "gate_age", "gate_ratio", "gate_big_count", "gate_median_views",
    "verdict",
]
COMPETITOR_FIELDS = [
    "market", "channel", "channel_id", "age_days", "age_source", "niche_share", "subscribers", "subs_gain",
    "long_videos", "uploads_in_window", "baseline_median", "max_views", "n_100k", "n_burst",
    "views_gain", "views_gain_per_day", "top_title",
]
BURST_FIELDS = [
    "market", "channel", "title", "video_url", "published_at", "age_days", "views",
    "baseline", "relative", "views_gain",
]
TITLE_FIELDS = [
    "market", "channel", "title", "video_url", "published_at", "age_days", "views",
    "relative", "burst", "views_gain",
]


# ---------------------------------------------------------------- tiện ích
def today_vn():
    return datetime.now(VN).date()


def read_csv(path):
    return ar.read_csv(path) if os.path.exists(path) else []


def write_csv(path, fields, rows):
    ar.write_csv(path, fields, rows)


def to_int(x):
    try:
        return int(float(x))
    except (TypeError, ValueError):
        return None


def truthy(x):
    return str(x).strip().lower() in ("true", "1", "yes")


def niche_rx(market):
    """Regex tiêu đề của ô (config: title_regex). Không có thì mọi tiêu đề đều tính."""
    pat = market.get("title_regex")
    return re.compile(pat, re.I) if pat else None


def in_niche(market, title):
    rx = niche_rx(market)
    return True if rx is None else bool(rx.search(title or ""))


def niche_share(market, titles):
    titles = list(titles)
    if not titles:
        return None
    return sum(in_niche(market, t) for t in titles) / len(titles)


def min_share(market, cfg=None):
    return market.get("min_niche_share", (cfg or {}).get("discovery", {}).get("min_niche_share", 0.5))


def days_between(a_iso, ref):
    """Số ngày từ thời điểm ISO a_iso đến datetime ref (UTC)."""
    if not a_iso:
        return None
    return max((ref - nf.parse_time(a_iso)).days, 0)


def end_of_day(d):
    return datetime(d.year, d.month, d.day, 23, 59, 59, tzinfo=VN).astimezone(timezone.utc)


def week_label(d):
    y, w, _ = d.isocalendar()
    return f"{y}-W{w:02d}"


def fmt_num(x):
    if x is None or x == "":
        return "—"
    if isinstance(x, float):
        return f"{x:,.1f}".replace(",", ".") if abs(x) < 1000 else f"{x:,.0f}".replace(",", ".")
    if isinstance(x, int):
        return f"{x:,}".replace(",", ".")
    return str(x)


def md_table(headers, rows):
    out = ["| " + " | ".join(headers) + " |", "|" + "---|" * len(headers)]
    for r in rows:
        out.append("| " + " | ".join(str(c).replace("|", "/").replace("\n", " ") for c in r) + " |")
    return "\n".join(out)


class Budget:
    """Chặn gọi API khi sắp vượt ngân sách quota của lần chạy."""

    def __init__(self, client, limit):
        self.client, self.limit = client, limit

    def allows(self, cost):
        return self.client.units_used + cost <= self.limit


# ---------------------------------------------------------------- danh sách theo dõi
def load_registry(root):
    return read_csv(os.path.join(root, "state", "channels.csv"))


def save_registry(root, rows):
    write_csv(os.path.join(root, "state", "channels.csv"), REGISTRY_FIELDS, rows)


def seed_registry(client, registry, market, snap_date, budget, base_dir="."):
    """Thêm kênh mồi của ô (CSV + seed_handles) nếu chưa có. 1 đơn vị / handle."""
    have = {r["handle"].lower() for r in registry if r.get("handle")}
    handles = []
    path = market.get("seed_channels_csv")
    if path and os.path.exists(os.path.join(base_dir, path)):
        handles += [ar.handle_from(r) for r in ar.read_csv(os.path.join(base_dir, path))]
    handles += market.get("seed_handles", [])
    added = []
    for h in handles:
        if not h or h.lower() in have or not budget.allows(1):
            continue
        info = ar.resolve_channel(client, h)
        have.add(h.lower())
        if not info or any(r["channel_id"] == info["id"] for r in registry):
            continue
        row = {"channel_id": info["id"], "title": info["snippet"]["title"], "handle": h,
               "market": market["id"], "source": "seed", "first_seen": snap_date.isoformat(),
               "reason": "kênh mồi trong cấu hình"}
        registry.append(row)
        added.append(row)
    return added


def update_registry(registry, discovery_rows, market, cfg, snap_date):
    """Theo dõi thêm kênh MỚI (<= new_channel_days) có video dài >= track_min_views."""
    known = {r["channel_id"] for r in registry}
    max_ch = cfg["tracking"]["max_channels"]
    disc = cfg["discovery"]
    mine = [r for r in discovery_rows if r["market"] == market["id"] and truthy(r["is_long"])]
    share = {}
    for r in mine:
        share.setdefault(r["channel_id"], []).append(r["title"])
    best = {}
    for r in mine:
        if not in_niche(market, r["title"]):
            continue
        if (niche_share(market, share[r["channel_id"]]) or 0) < min_share(market, cfg):
            continue
        age, views = to_int(r["channel_age_days"]), to_int(r["views"]) or 0
        if age is None or age > disc["new_channel_days"] or views < disc["track_min_views"]:
            continue
        if views > best.get(r["channel_id"], ({}, 0))[1]:
            best[r["channel_id"]] = (r, views)
    added, skipped = [], []
    for cid, (r, views) in sorted(best.items(), key=lambda kv: -kv[1][1]):
        if cid in known:
            continue
        if len(registry) >= max_ch:
            skipped.append(r["channel_title"])
            continue
        row = {"channel_id": cid, "title": r["channel_title"], "handle": "", "market": market["id"],
               "source": "discovery", "first_seen": snap_date.isoformat(),
               "reason": f"kênh {r['channel_age_days']} ngày, video {views:,} view ({r['query']})"}
        registry.append(row)
        known.add(cid)
        added.append(row)
    return added, skipped


# ---------------------------------------------------------------- BƯỚC daily
def fetch_video_items(client, ids):
    out = {}
    for batch in nf.chunks(list(ids)):
        for v in client.get("videos", part="snippet,statistics,contentDetails,liveStreamingDetails",
                            id=",".join(batch)).get("items", []):
            out[v["id"]] = v
    return out


def discover(client, market, cfg, snap_date, budget, now):
    """Chạy các truy vấn của ô. Trả (rows, đã chạy, bị bỏ qua, lỗi)."""
    disc = cfg["discovery"]
    rows, ran, skipped, errors = [], [], [], []
    for q in market["queries"]:
        if not budget.allows(100 + 2):
            skipped.append(q)
            continue
        try:
            ids = nf.search_videos(client, q, market.get("region", "US"), disc["video_age_days"],
                                   min(disc.get("max_results", 50), 50), market.get("language"))
            vids = fetch_video_items(client, ids)
            chans = nf.fetch_channels(client, [v["snippet"]["channelId"] for v in vids.values()])
        except RuntimeError as e:
            errors.append(f"{q}: {e}")
            if "quota" in str(e).lower():
                skipped += [x for x in market["queries"] if x not in ran and x != q]
                break
            continue
        ran.append(q)
        for vid in ids:
            v = vids.get(vid)
            if not v:
                continue
            ch = chans.get(v["snippet"]["channelId"])
            if not ch:
                continue
            c = ar.classify(v)
            views = to_int(c["views"]) or 0
            age_v = days_between(c["published_at"], now)
            cs = ch.get("statistics", {})
            subs = None if cs.get("hiddenSubscriberCount") else to_int(cs.get("subscriberCount"))
            rows.append({
                "snapshot_date": snap_date.isoformat(), "market": market["id"], "query": q,
                "video_id": vid, "title": c["title"], "published_at": c["published_at"],
                "age_days": age_v, "duration_s": c["duration_s"], "is_long": c["is_long"],
                "views": views, "views_per_day": round(views / max(age_v or 0, 1), 1),
                "channel_id": ch["id"], "channel_title": ch["snippet"]["title"],
                "channel_created": ch["snippet"]["publishedAt"],
                "channel_age_days": days_between(ch["snippet"]["publishedAt"], now),
                "subscribers": "" if subs is None else subs,
                "views_to_subs": round(views / subs, 2) if subs else "",
            })
    return rows, ran, skipped, errors


def track(client, registry, cfg, snap_date, budget):
    """Snapshot kênh + video của mọi kênh theo dõi. ~1 đơn vị / 50 kênh + 2 đơn vị / 50 video."""
    max_up = cfg["tracking"]["max_uploads_per_channel"]
    by_id = {r["channel_id"]: r for r in registry}
    ch_rows, v_rows, skipped = [], [], []
    infos = {}
    for batch in nf.chunks(list(by_id)):
        if not budget.allows(1):
            skipped += batch
            continue
        for c in client.get("channels", part="snippet,statistics,contentDetails",
                            id=",".join(batch)).get("items", []):
            infos[c["id"]] = c
    for cid, info in infos.items():
        reg = by_id[cid]
        playlist = info.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
        ids, token, complete = [], None, False
        while playlist and len(ids) < max_up and budget.allows(1):
            params = dict(part="contentDetails", playlistId=playlist, maxResults=50)
            if token:
                params["pageToken"] = token
            try:
                body = client.get("playlistItems", **params)
            except RuntimeError:
                break
            ids += [i["contentDetails"]["videoId"] for i in body.get("items", [])]
            token = body.get("nextPageToken")
            if not token:
                complete = True
                break
        need = (len(ids) + 49) // 50
        if not budget.allows(need):
            skipped.append(cid)
            continue
        vids = fetch_video_items(client, ids)
        published = []
        for vid in ids:
            v = vids.get(vid)
            if not v:
                continue
            c = ar.classify(v)
            published.append(c["published_at"])
            v_rows.append({
                "snapshot_date": snap_date.isoformat(), "market": reg["market"], "channel_id": cid,
                "channel_title": info["snippet"]["title"], "video_id": vid, "title": c["title"],
                "published_at": c["published_at"], "duration_s": c["duration_s"],
                "is_long": c["is_long"], "exclude_reason": c["exclude_reason"],
                "views": c["views"], "likes": c["likes"], "comments": c["comments"],
            })
        cs = info.get("statistics", {})
        hidden = bool(cs.get("hiddenSubscriberCount"))
        ch_rows.append({
            "snapshot_date": snap_date.isoformat(), "market": reg["market"], "channel_id": cid,
            "title": info["snippet"]["title"], "handle": reg.get("handle", ""),
            "created_at": info["snippet"]["publishedAt"],
            "subscribers": "" if hidden else cs.get("subscriberCount", ""), "subs_hidden": hidden,
            "total_views": cs.get("viewCount", ""), "video_count": cs.get("videoCount", ""),
            "observed_uploads": len(ids), "uploads_complete": complete,
            "first_upload_at": min(published) if complete and published else "",
        })
    return ch_rows, v_rows, skipped


def prune_registry(registry, v_rows, cfg, min_videos=3):
    """Bỏ kênh do discovery thêm vào nếu < min_niche_share video dài khớp title_regex của ô.

    Kênh mồi (source=seed) không bao giờ bị bỏ. Trả danh sách kênh bị bỏ.
    """
    markets = {m["id"]: m for m in cfg["markets"]}
    titles = {}
    for v in v_rows:
        if truthy(v["is_long"]):
            titles.setdefault(v["channel_id"], []).append(v["title"])
    keep, removed = [], []
    for r in registry:
        m = markets.get(r["market"])
        t = titles.get(r["channel_id"], [])
        sh = niche_share(m, t) if m else None
        if (r["source"] == "discovery" and m and len(t) >= min_videos
                and sh is not None and sh < min_share(m, cfg)):
            removed.append({**r, "niche_share": round(sh, 2), "long_videos": len(t)})
        else:
            keep.append(r)
    registry[:] = keep
    return removed


def run_daily(client, cfg, root, snap_date=None, now=None, base_dir="."):
    now = now or datetime.now(timezone.utc)
    snap_date = snap_date or today_vn()
    budget = Budget(client, cfg.get("quota_budget", 6000))
    registry = load_registry(root)
    log = {"snapshot_date": snap_date.isoformat(), "started_at": now.isoformat(),
           "quota_budget": budget.limit, "markets": {}}
    all_disc = []
    for m in cfg["markets"]:
        seeded = seed_registry(client, registry, m, snap_date, budget, base_dir)
        rows, ran, skipped, errors = discover(client, m, cfg, snap_date, budget, now)
        added, full = update_registry(registry, rows, m, cfg, snap_date)
        all_disc += rows
        log["markets"][m["id"]] = {
            "name": m["name"], "region": m.get("region"), "queries_run": ran,
            "queries_skipped": skipped, "errors": errors, "discovery_rows": len(rows),
            "seeded": [r["title"] for r in seeded], "added": [r["title"] for r in added],
            "not_added_registry_full": full,
        }
    ch_rows, v_rows, tskip = track(client, registry, cfg, snap_date, budget)
    pruned = prune_registry(registry, v_rows, cfg)
    gone = {r["channel_id"] for r in pruned}
    ch_rows = [r for r in ch_rows if r["channel_id"] not in gone]
    v_rows = [r for r in v_rows if r["channel_id"] not in gone]
    log["pruned_off_niche"] = [f"{r['title']} ({r['niche_share']:.0%} khớp)" for r in pruned]
    out = os.path.join(root, "data", snap_date.isoformat())
    write_csv(os.path.join(out, "discovery.csv"), DISCOVERY_FIELDS, all_disc)
    write_csv(os.path.join(out, "channels.csv"), CHANNEL_FIELDS, ch_rows)
    write_csv(os.path.join(out, "videos.csv"), VIDEO_FIELDS, v_rows)
    save_registry(root, registry)
    log.update(tracked_channels=len(ch_rows), tracked_videos=len(v_rows),
               tracking_skipped=tskip, quota_used=client.units_used,
               finished_at=datetime.now(timezone.utc).isoformat())
    with open(os.path.join(out, "run.json"), "w", encoding="utf-8") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)
    snap = {"discovery": all_disc, "channels": ch_rows, "videos": v_rows}
    with open(os.path.join(out, "TOM_TAT.md"), "w", encoding="utf-8") as f:
        f.write(daily_summary(cfg, snap, log, snap_date))
    return log


# ---------------------------------------------------------------- tính số
def load_window(root, end, days):
    """Đọc snapshot từ end-days+1 đến end. Trả list (date, {discovery, channels, videos})."""
    base = os.path.join(root, "data")
    snaps = []
    if not os.path.isdir(base):
        return snaps
    start = end - timedelta(days=days - 1)
    for name in sorted(os.listdir(base)):
        try:
            d = date.fromisoformat(name)
        except ValueError:
            continue
        if start <= d <= end:
            p = os.path.join(base, name)
            snaps.append((d, {k: read_csv(os.path.join(p, f"{k}.csv"))
                              for k in ("discovery", "channels", "videos")}))
    return snaps


def channel_age(ch, ref):
    """Tuổi kênh: ưu tiên video cũ nhất (như tài liệu), không có thì ngày tạo kênh."""
    if ch.get("first_upload_at"):
        return days_between(ch["first_upload_at"], ref), "video cũ nhất"
    if ch.get("created_at"):
        return days_between(ch["created_at"], ref), "ngày tạo kênh"
    return None, ""


def scorecard(market, pool_videos, channel_info, ref, cfg=None):
    """Bảng chấm ô theo tài liệu phương pháp.

    pool_videos: {video_id: {channel_id, views, is_long}}; channel_info: {channel_id: {age, age_source, subs}}.
    """
    longv = [v for v in pool_videos.values() if truthy(v["is_long"]) and v["views"] is not None]
    big = [v for v in longv if v["views"] >= BIG_VIEWS]
    best = {}
    for v in longv:
        if v["views"] > best.get(v["channel_id"], -1):
            best[v["channel_id"]] = v["views"]
    top5 = sorted(best, key=lambda c: -best[c])[:5]
    ages = [channel_info[c]["age"] for c in top5 if channel_info.get(c, {}).get("age") is not None]
    srcs = sorted({channel_info[c]["age_source"] for c in top5 if channel_info.get(c, {}).get("age_source")})
    ratios = [best[c] / channel_info[c]["subs"] for c in top5 if channel_info.get(c, {}).get("subs")]
    decisive = sorted({channel_info.get(v["channel_id"], {}).get("title", v["channel_id"])
                       for v in big if (channel_info.get(v["channel_id"], {}).get("age") or 10**9) <= 90})
    med_age_m = round(median(ages) / 30.4, 1) if ages else None
    med_ratio = round(median(ratios), 1) if ratios else None
    med_big = int(median(v["views"] for v in big)) if big else None
    shares = [channel_info.get(c, {}).get("niche_share") for c in top5]
    shares = [x for x in shares if x is not None]
    n_ok = sum(1 for x in shares if x >= min_share(market, cfg))
    top5_rows = [(channel_info.get(c, {}).get("title", c), channel_info.get(c, {}).get("age"),
                  channel_info.get(c, {}).get("subs"), best[c], channel_info.get(c, {}).get("niche_share"))
                 for c in top5]
    g = {
        "niche_ok_top5": (f"{n_ok}/{len(shares)} kênh có đủ tiêu đề" if shares else "—"),
        "gate_niche": "—" if len(shares) < 3 else ("đạt" if n_ok / len(shares) >= 0.8 else "không"),
        "gate_decisive": "đạt" if decisive else "không",
        "gate_age": "—" if med_age_m is None else ("đạt" if med_age_m <= 12 else "không"),
        "gate_ratio": "—" if med_ratio is None else ("đạt" if med_ratio >= 10 else "không"),
        "gate_big_count": "đạt" if len(big) >= 8 else "không",
        "gate_median_views": "—" if med_big is None else (
            "cảnh báo (>1,5M)" if med_big > 1_500_000 else
            "đạt" if 150_000 <= med_big <= 600_000 else "lệch vùng tốt"),
    }
    if g["gate_decisive"] == "đạt" and g["gate_age"] != "không":
        verdict = "CỬA MỞ" if g["gate_niche"] != "không" else "CẦN THEO DÕI (top 5 lẫn ngách)"
    elif g["gate_age"] == "đạt" or g["gate_ratio"] == "đạt":
        verdict = "CẦN THEO DÕI"
    elif g["gate_age"] == "—" and not big:
        verdict = "CHƯA ĐỦ SỐ LIỆU"
    else:
        verdict = "CỬA ĐÓNG"
    return {
        "market": market["id"], "name": market["name"],
        "decisive_new_winner": (", ".join(decisive[:5]) + (f" (+{len(decisive) - 5} kênh)" if len(decisive) > 5 else "")) or "—", "n_big_videos": len(big),
        "top5_median_age_months": med_age_m, "top5_age_source": ", ".join(srcs),
        "top5_median_views_to_subs": med_ratio, "median_big_views": med_big,
        "n_channels_seen": len(best), **g, "verdict": verdict, "_top5": top5_rows,
    }


def build_pool(snaps, market, ref):
    """Gộp video (discovery + theo dõi) và thông tin kênh mới nhất trong cửa sổ.

    Chỉ video có tiêu đề khớp title_regex của ô mới vào pool. niche_share của kênh tính trên
    mọi video dài đã thấy của kênh (trước khi lọc).
    """
    market_id = market["id"]
    excl = {x.lower() for x in market.get("exclude_channels", [])}
    skip = lambda r: (r["channel_id"].lower() in excl
                      or (r.get("channel_title") or r.get("title", "")).strip().lower() in excl)
    pool, info, seen = {}, {}, {}
    for _, s in snaps:                                     # cũ -> mới, mới ghi đè
        for r in s["videos"]:                              # chỉ kênh theo dõi mới đủ tiêu đề để chấm ngách
            if r["market"] == market_id and truthy(r["is_long"]):
                seen.setdefault(r["channel_id"], {})[r["video_id"]] = r["title"]
        for r in s["discovery"]:
            if r["market"] != market_id or not in_niche(market, r["title"]) or skip(r):
                continue
            pool[r["video_id"]] = {"channel_id": r["channel_id"], "views": to_int(r["views"]),
                                   "is_long": r["is_long"]}
            ci = info.setdefault(r["channel_id"], {})
            if "first_upload" not in ci:
                ci.update(title=r["channel_title"], subs=to_int(r["subscribers"]),
                          age=days_between(r["channel_created"], ref), age_source="ngày tạo kênh")
        for r in s["videos"]:
            if r["market"] == market_id and in_niche(market, r["title"]) and not skip(r):
                pool[r["video_id"]] = {"channel_id": r["channel_id"], "views": to_int(r["views"]),
                                       "is_long": r["is_long"]}
        for r in s["channels"]:
            if r["market"] == market_id:
                age, src = channel_age(r, ref)
                info[r["channel_id"]] = {"title": r["title"], "subs": to_int(r["subscribers"]),
                                         "age": age, "age_source": src, "first_upload": True}
    for cid, t in seen.items():
        info.setdefault(cid, {})["niche_share"] = niche_share(market, t.values())
    return pool, info


def competitors(snaps, market, ref, window_start, seeds=frozenset(), cfg=None):
    """Bảng đối thủ + video bung + danh sách tiêu đề từ snapshot theo dõi.

    Bỏ kênh không phải kênh mồi nếu tỉ lệ tiêu đề khớp ngách < min_niche_share.
    """
    market_id = market["id"]
    first_v, last_v, first_c, last_c = {}, {}, {}, {}
    for d, s in snaps:
        for r in s["videos"]:
            if r["market"] != market_id:
                continue
            first_v.setdefault(r["video_id"], (d, r))
            last_v[r["video_id"]] = (d, r)
        for r in s["channels"]:
            if r["market"] != market_id:
                continue
            first_c.setdefault(r["channel_id"], (d, r))
            last_c[r["channel_id"]] = (d, r)
    by_ch = {}
    for vid, (d, r) in last_v.items():
        if not truthy(r["is_long"]):
            continue
        fd, fr = first_v[vid]
        views = to_int(r["views"]) or 0
        gain = views - (to_int(fr["views"]) or 0) if fd < d else None
        by_ch.setdefault(r["channel_id"], []).append({
            **r, "views": views, "views_gain": gain, "gain_days": (d - fd).days,
            "age_days": days_between(r["published_at"], ref)})
    comp, bursts, titles = [], [], []
    for cid, vids in by_ch.items():
        ch = last_c.get(cid, (None, {}))[1]
        name = ch.get("title") or vids[0]["channel_title"]
        share = niche_share(market, (v["title"] for v in vids))
        if cid not in seeds and share is not None and share < min_share(market, cfg):
            continue
        views = sorted(v["views"] for v in vids)
        base = median(views) if len(views) >= ar.MIN_VIDEOS_FOR_BASELINE else None
        for v in vids:
            v["relative"] = round(v["views"] / base, 1) if base else None
            v["burst"] = bool(v["relative"] is not None and v["relative"] >= BURST_X)
        gains = [v["views_gain"] for v in vids if v["views_gain"] is not None]
        span = max((v["gain_days"] for v in vids), default=0)
        age, src = channel_age(ch, ref) if ch else (None, "")
        subs = to_int(ch.get("subscribers"))
        fsubs = to_int(first_c.get(cid, (None, {}))[1].get("subscribers"))
        top = max(vids, key=lambda v: v["views"])
        comp.append({
            "market": market_id, "channel": name, "channel_id": cid, "age_days": age,
            "age_source": src, "niche_share": round(share, 2) if share is not None else None,
            "subscribers": subs,
            "subs_gain": subs - fsubs if subs is not None and fsubs is not None and span else None,
            "long_videos": len(vids),
            "uploads_in_window": sum(1 for v in vids if v["published_at"] and
                                     nf.parse_time(v["published_at"]) >= window_start),
            "baseline_median": base, "max_views": top["views"],
            "n_100k": sum(1 for v in vids if v["views"] >= BIG_VIEWS),
            "n_burst": sum(1 for v in vids if v["burst"]),
            "views_gain": sum(gains) if gains else None,
            "views_gain_per_day": round(sum(gains) / span, 1) if gains and span else None,
            "top_title": top["title"],
        })
        for v in vids:
            url = f"https://www.youtube.com/watch?v={v['video_id']}"
            row = {"market": market_id, "channel": name, "title": v["title"], "video_url": url,
                   "published_at": v["published_at"], "age_days": v["age_days"], "views": v["views"],
                   "baseline": base, "relative": v["relative"], "burst": v["burst"],
                   "views_gain": v["views_gain"]}
            titles.append(row)
            if v["burst"]:
                bursts.append(row)
    comp.sort(key=lambda c: (-(c["views_gain"] or 0), -c["max_views"]))
    bursts.sort(key=lambda b: -(b["relative"] or 0))
    titles.sort(key=lambda t: (t["channel"].lower(), -(t["relative"] or 0)))
    return comp, bursts, titles


def new_winners(pool, info, max_age=180, min_views=BIG_VIEWS):
    best = {}
    for v in pool.values():
        if not truthy(v["is_long"]) or v["views"] is None:
            continue
        ci = info.get(v["channel_id"], {})
        if ci.get("age") is None or ci["age"] > max_age or v["views"] < min_views:
            continue
        best[v["channel_id"]] = max(best.get(v["channel_id"], 0), v["views"])
    return sorted(((info[c].get("title", c), info[c]["age"], info[c].get("subs"), vw)
                   for c, vw in best.items()), key=lambda x: -x[3])


# ---------------------------------------------------------------- báo cáo
LIMITS = """## Giới hạn của số liệu

- **Thiên lệch sống sót:** chỉ thấy kênh còn sống và hiện ra trong tìm kiếm. Tỉ lệ thắng thật chưa đo được.
- **Tuổi kênh là ước lượng:** lấy từ video cũ nhất khi đã đọc đủ danh sách upload, nếu không thì lấy ngày tạo kênh.
  Kênh cũ đổi chủ đề hoặc xoá video cũ sẽ trông trẻ hơn thực tế.
- **Lượt xem là tích luỹ:** video mới đăng chưa kịp lên. Cột tăng trong tuần chỉ có khi có ≥ 2 snapshot.
- **"Bung = ≥ 10× trung vị của chính kênh"** là ngưỡng tự đặt, không phải chuẩn ngành. Kênh có < 3 video dài thì không tính.
- **Kênh đúng ngách** chấm tự động bằng bộ lọc tiêu đề (`title_regex`): kênh đúng ngách khi ≥ `min_niche_share`
  video dài khớp. Bộ lọc dựa trên chữ, vẫn nên đọc tay 10 tiêu đề gần nhất của kênh top.
"""


def weekly_numbers(cfg, snaps, end, days, generated, seeds=frozenset()):
    ref = end_of_day(end)
    start = end - timedelta(days=days - 1)
    window_start = datetime(start.year, start.month, start.day, tzinfo=VN).astimezone(timezone.utc)
    dates = [d for d, _ in snaps]
    out = {"scores": [], "competitors": [], "bursts": [], "titles": []}
    lines = [
        f"# Số liệu đối thủ tuần {week_label(end)}",
        "",
        f"- **Ngày nghiên cứu:** {generated.isoformat()} (tạo tự động bởi `market_watch.py weekly`)",
        f"- **Khoảng dữ liệu:** {start.isoformat()} → {end.isoformat()} · "
        f"{len(snaps)} snapshot ({', '.join(d.isoformat() for d in dates) or 'không có'})",
    ]
    for m in cfg["markets"]:
        n_q = sorted({r["query"] for _, s in snaps for r in s["discovery"] if r["market"] == m["id"]})
        lines.append(f"- **Phạm vi ô {m['name']}:** quốc gia {m.get('region')}, ngôn ngữ "
                     f"{m.get('language') or '—'}, {len(n_q)} truy vấn tìm kiếm đã chạy, video đăng "
                     f"trong {cfg['discovery']['video_age_days']} ngày khi tìm, kênh theo dõi chi tiết bên dưới")
    lines.append("")
    for m in cfg["markets"]:
        pool, info = build_pool(snaps, m, ref)
        sc = scorecard(m, pool, info, ref, cfg)
        comp, bursts, titles = competitors(snaps, m, ref, window_start, seeds, cfg)
        out["scores"].append(sc)
        out["competitors"] += comp
        out["bursts"] += bursts
        out["titles"] += titles
        n_vid = sum(c["long_videos"] for c in comp)
        n_long = sum(1 for v in pool.values() if truthy(v["is_long"]))
        lines += [
            f"## {m['name']}",
            "",
            f"Cỡ mẫu: {sc['n_channels_seen']} kênh có video dài · {n_long} video dài ≥ 4 phút (gộp tìm kiếm + theo dõi) · "
            f"{len(comp)} kênh theo dõi với {n_vid} video dài. "
            f"Bộ lọc tiêu đề: `{m.get('title_regex') or 'không có'}`.",
            "",
            "### Bảng chấm ô",
            "",
            md_table(["Điều kiện", "Ngưỡng", "Số đo", "Kết quả"], [
                ["Có kênh ≤ 3 tháng đã có video ≥ 100k", "có", sc["decisive_new_winner"], sc["gate_decisive"]],
                ["Tuổi trung vị 5 kênh có video to nhất", "≤ 12 tháng",
                 f"{fmt_num(sc['top5_median_age_months'])} tháng ({sc['top5_age_source'] or '—'})", sc["gate_age"]],
                ["view/sub trung vị (5 kênh đó)", "≥ 10×", fmt_num(sc["top5_median_views_to_subs"]), sc["gate_ratio"]],
                ["Số video dài ≥ 100k", "≥ 8 (cần, không đủ)", sc["n_big_videos"], sc["gate_big_count"]],
                ["View trung vị của video ≥ 100k", "150k–600k", fmt_num(sc["median_big_views"]), sc["gate_median_views"]],
                ["Kênh đúng ngách (top 5, tự động theo tiêu đề)", "≥ 80%",
                 sc["niche_ok_top5"], sc["gate_niche"]],
            ]),
            "",
            "5 kênh có video to nhất (dùng cho 3 dòng tuổi, view/sub, đúng ngách; **cần đọc tay xác minh "
            "đúng ngách**, kênh sai thì thêm vào `exclude_channels` trong config):",
            "",
            md_table(["Kênh", "Tuổi (ngày)", "Sub", "Video to nhất", "Tỉ lệ tiêu đề khớp"],
                     [[t, fmt_num(a), fmt_num(sb), fmt_num(v), "chưa theo dõi" if sh is None else f"{sh:.0%}"]
                      for t, a, sb, v, sh in sc["_top5"]]),
            "",
            f"**Kết luận số: {sc['verdict']}.** Tuổi kênh dự báo mạnh nhất. View trung vị càng cao thì cửa càng đóng.",
            "",
            "### Kênh mới thắng (≤ 180 ngày, có video dài ≥ 100k)",
            "",
        ]
        nw = new_winners(pool, info)
        lines += [md_table(["Kênh", "Tuổi (ngày)", "Sub", "Video to nhất"],
                           [[t, a, fmt_num(s), fmt_num(v)] for t, a, s, v in nw[:15]])
                  if nw else "Chưa có kênh nào đạt.", ""]
        lines += ["### Đối thủ đang theo dõi", ""]
        lines += [md_table(
            ["Kênh", "Tuổi (ngày)", "Sub", "+Sub", "Video dài", "Đăng trong tuần", "Trung vị view",
             "Video bung", "≥100k", "+View tuần", "Video to nhất"],
            [[c["channel"], fmt_num(c["age_days"]), fmt_num(c["subscribers"]), fmt_num(c["subs_gain"]),
              c["long_videos"], c["uploads_in_window"], fmt_num(c["baseline_median"]), c["n_burst"],
              c["n_100k"], fmt_num(c["views_gain"]), c["top_title"][:60]] for c in comp[:30]])
            if comp else "Chưa có snapshot kênh theo dõi.", ""]
        lines += [f"### Video bung (≥ {BURST_X}× trung vị của chính kênh) · {len(bursts)} video", ""]
        lines += [md_table(["Kênh", "Tiêu đề", "View", "× trung vị", "Tuổi (ngày)"],
                           [[b["channel"], f"[{b['title'][:70]}]({b['video_url']})", fmt_num(b["views"]),
                             fmt_num(b["relative"]), b["age_days"]] for b in bursts[:30]])
                  if bursts else "Không có video nào đạt ngưỡng.", ""]
    lines += [LIMITS, "",
              "File kèm theo: `scorecard.csv`, `competitors.csv`, `bung_videos.csv`, `titles.csv` "
              "(toàn bộ tiêu đề để đọc tay, gom chủ đề bung ở ≥ 2 kênh)."]
    return "\n".join(lines) + "\n", out


def daily_summary(cfg, snap, log, snap_date):
    ref = datetime.now(timezone.utc)
    lines = [f"# Tóm tắt thu thập {snap_date.isoformat()}", "",
             f"- Quota đã dùng: {log.get('quota_used')} / ngân sách {log.get('quota_budget')} đơn vị",
             f"- Kênh theo dõi: {log.get('tracked_channels')} · video đã chụp: {log.get('tracked_videos')}", ""]
    for m in cfg["markets"]:
        ml = log["markets"].get(m["id"], {})
        pool, info = build_pool([(snap_date, snap)], m, ref)
        sc = scorecard(m, pool, info, ref, cfg)
        lines += [f"## {m['name']}", "",
                  f"- Truy vấn đã chạy: {len(ml.get('queries_run', []))} · bỏ qua: {len(ml.get('queries_skipped', []))}"
                  f" · lỗi: {len(ml.get('errors', []))}",
                  f"- Kênh mới thêm vào theo dõi: {', '.join(ml.get('added', [])) or 'không'}",
                  f"- Kênh bỏ khỏi theo dõi vì lệch ngách: {', '.join(log.get('pruned_off_niche', [])) or 'không'}",
                  f"- Bảng chấm nhanh (chỉ dữ liệu hôm nay): **{sc['verdict']}** · tuổi trung vị top 5: "
                  f"{fmt_num(sc['top5_median_age_months'])} tháng · video ≥ 100k: {sc['n_big_videos']}", ""]
        nw = new_winners(pool, info)
        if nw:
            lines += [md_table(["Kênh mới thắng", "Tuổi (ngày)", "Sub", "Video to nhất"],
                               [[t, a, fmt_num(s), fmt_num(v)] for t, a, s, v in nw[:10]]), ""]
    return "\n".join(lines) + "\n"


def update_index(root):
    rep = os.path.join(root, "reports")
    rows = []
    for name in sorted(os.listdir(rep), reverse=True):
        p = os.path.join(rep, name)
        if not os.path.isdir(p):
            continue
        main = "BAO_CAO_DOI_THU.md" if os.path.exists(os.path.join(p, "BAO_CAO_DOI_THU.md")) else "SO_LIEU.md"
        rows.append(f"- [{name}]({name}/{main})" + ("" if main == "BAO_CAO_DOI_THU.md" else " (mới có số liệu)"))
    with open(os.path.join(rep, "INDEX.md"), "w", encoding="utf-8") as f:
        f.write("# Báo cáo đối thủ theo tuần\n\nMới nhất ở trên cùng.\n\n" + "\n".join(rows) + "\n")


def run_weekly(cfg, root, end=None, days=7, generated=None, label=None):
    end = end or today_vn()
    generated = generated or today_vn()
    snaps = load_window(root, end, days)
    seeds = frozenset(r["channel_id"] for r in load_registry(root) if r.get("source") == "seed")
    md, out = weekly_numbers(cfg, snaps, end, days, generated, seeds)
    d = os.path.join(root, "reports", label or week_label(end))
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "SO_LIEU.md"), "w", encoding="utf-8") as f:
        f.write(md)
    write_csv(os.path.join(d, "scorecard.csv"), SCORE_FIELDS, out["scores"])
    write_csv(os.path.join(d, "competitors.csv"), COMPETITOR_FIELDS, out["competitors"])
    write_csv(os.path.join(d, "bung_videos.csv"), BURST_FIELDS, out["bursts"])
    write_csv(os.path.join(d, "titles.csv"), TITLE_FIELDS, out["titles"])
    update_index(root)
    return d, len(snaps)


# ---------------------------------------------------------------- README hằng ngày / hằng tuần
README_START = "<!-- DAILY:START -->"
README_END = "<!-- DAILY:END -->"
WEEKLY_START = "<!-- WEEKLY:START -->"
WEEKLY_END = "<!-- WEEKLY:END -->"
WEEKLY_PICK = ("Kết luận nhanh", "Bảng chấm ô")      # mục lấy vào README, theo thứ tự ưu tiên


def demote(md, n):
    """Hạ cấp mọi tiêu đề n bậc (bỏ qua dòng trong khối code)."""
    out, in_code = [], False
    for ln in md.strip().splitlines():
        if ln.lstrip().startswith("```"):
            in_code = not in_code
        out.append(ln if in_code else re.sub(r"^(#+) ", lambda m: "#" * (len(m.group(1)) + n) + " ", ln))
    return out


def extract_section(md, names):
    """Lấy mục có tiêu đề chứa một trong `names` (tới tiêu đề cùng cấp hoặc cao hơn kế tiếp)."""
    lines = md.splitlines()
    for name in names:
        for i, ln in enumerate(lines):
            m = re.match(r"^(#+) (.*)", ln)
            if m and name.lower() in m.group(2).lower():
                level, j = len(m.group(1)), i + 1
                while j < len(lines):
                    mj = re.match(r"^(#+) ", lines[j])
                    if mj and len(mj.group(1)) <= level:
                        break
                    j += 1
                return "\n".join(lines[i:j]).strip()
    return None


def latest_summary(root):
    """Trả (ngày, nội dung TOM_TAT.md) của ngày mới nhất, hoặc (None, None)."""
    base = os.path.join(root, "data")
    days = sorted((d for d in os.listdir(base) if os.path.exists(os.path.join(base, d, "TOM_TAT.md"))),
                  reverse=True) if os.path.isdir(base) else []
    if not days:
        return None, None
    with open(os.path.join(base, days[0], "TOM_TAT.md"), encoding="utf-8") as f:
        return days[0], f.read()


def latest_weekly(root):
    """Trả (tên thư mục tuần, tên file, nội dung) của báo cáo tuần mới nhất, hoặc None.
    Ưu tiên BAO_CAO_DOI_THU.md (Claude viết), không có thì dùng SO_LIEU.md (máy tính)."""
    base = os.path.join(root, "reports")
    if not os.path.isdir(base):
        return None
    for name in sorted((d for d in os.listdir(base) if os.path.isdir(os.path.join(base, d))), reverse=True):
        for fn in ("BAO_CAO_DOI_THU.md", "SO_LIEU.md"):
            path = os.path.join(base, name, fn)
            if os.path.exists(path):
                with open(path, encoding="utf-8") as f:
                    return name, fn, f.read()
    return None


def render_readme_block(day, summary, repo=None, data_branch="research/reports"):
    """Khối báo cáo ngày. Hạ cấp tiêu đề của TOM_TAT xuống dưới '##'."""
    lines = [README_START, "## Báo cáo hôm nay", ""]
    if not day:
        lines += ["Chưa có báo cáo nào.", README_END]
        return "\n".join(lines)
    lines += [f"_Cập nhật tự động {day}. Số liệu từ YouTube Data API, đối chiếu bằng tay trước khi quyết định._", ""]
    lines += demote(summary, 2) + [""]
    if repo:
        url = f"https://github.com/{repo}/blob/{data_branch}"
        lines += [f"Xem thêm: [dữ liệu ngày {day}]({url}/data/{day}/TOM_TAT.md)", ""]
    lines.append(README_END)
    return "\n".join(lines)


def render_weekly_block(weekly, repo=None, data_branch="research/reports"):
    """Khối báo cáo tuần: chỉ phần kết luận (hoặc bảng chấm ô), kèm link bản đầy đủ."""
    lines = [WEEKLY_START, "## Báo cáo tuần mới nhất", ""]
    if not weekly:
        lines += ["Chưa có báo cáo tuần nào.", WEEKLY_END]
        return "\n".join(lines)
    name, fn, text = weekly
    picked = extract_section(text, WEEKLY_PICK)
    lines += [f"_Báo cáo {name} · nguồn `{fn}`. Chỉ trích phần đầu, bản đầy đủ ở link bên dưới._", ""]
    lines += (demote(picked, 1) if picked else text.strip().splitlines()[:30]) + [""]
    if repo:
        url = f"https://github.com/{repo}/blob/{data_branch}"
        lines += [f"Xem thêm: [báo cáo đầy đủ {name}]({url}/reports/{name}/{fn})"
                  f" · [mọi báo cáo tuần]({url}/reports/INDEX.md)", ""]
    lines.append(WEEKLY_END)
    return "\n".join(lines)


def replace_block(text, block, start=README_START, end=README_END, after=None):
    """Thay khối giữa hai dấu. Nếu chưa có dấu: chèn sau dấu `after` (nếu có trong file), không thì
    ngay dưới tiêu đề đầu tiên, để báo cáo luôn nằm đầu README."""
    a, b = text.find(start), text.find(end)
    if a != -1 and b > a:
        return text[:a] + block + text[b + len(end):]
    if after and after in text:
        i = text.index(after) + len(after)
    elif text.startswith("# ") and "\n" in text:
        i = text.index("\n")
    else:
        i = 0
    return text[:i].rstrip("\n") + ("\n\n" if i else "") + block + "\n\n" + text[i:].lstrip("\n")


def update_readme(root, readme_path, repo=None):
    day, summary = latest_summary(root)
    weekly = latest_weekly(root)
    with open(readme_path, encoding="utf-8") as f:
        old = f.read()
    new = replace_block(old, render_readme_block(day, summary, repo))
    if weekly or WEEKLY_START in new:       # chưa có báo cáo tuần và README chưa có khối thì bỏ qua
        new = replace_block(new, render_weekly_block(weekly, repo), WEEKLY_START, WEEKLY_END, after=README_END)
    if new != old:
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(new)
    return day, new != old


def prune_snapshot(cfg, root):
    """Dọn danh sách theo dõi dựa trên snapshot mới nhất trong <root>/data."""
    base = os.path.join(root, "data")
    days = sorted(d for d in os.listdir(base) if os.path.exists(os.path.join(base, d, "videos.csv")))
    if not days:
        return []
    registry = load_registry(root)
    removed = prune_registry(registry, read_csv(os.path.join(base, days[-1], "videos.csv")), cfg)
    save_registry(root, registry)
    return removed


# ---------------------------------------------------------------- nhập dữ liệu cũ
def import_snapshot(videos_csv, root, market_id, snap_date):
    """Biến out/videos.csv của audience_research.py thành snapshot (không có sub/ngày tạo kênh)."""
    rows = ar.read_csv(videos_csv)
    out = os.path.join(root, "data", snap_date.isoformat())
    v_rows, chans = [], {}
    for r in rows:
        v_rows.append({"snapshot_date": snap_date.isoformat(), "market": market_id,
                       "channel_id": r["channel_id"], "channel_title": r["channel_name"],
                       "video_id": r["video_id"], "title": r["title"], "published_at": r["published_at"],
                       "duration_s": r["duration_s"], "is_long": r["is_long"],
                       "exclude_reason": r["exclude_reason"], "views": r["views"],
                       "likes": r["likes"], "comments": r["comments"]})
        c = chans.setdefault(r["channel_id"], {"title": r["channel_name"], "handle": r["handle"], "pub": []})
        if r["published_at"]:
            c["pub"].append(r["published_at"])
    ch_rows = [{"snapshot_date": snap_date.isoformat(), "market": market_id, "channel_id": cid,
                "title": c["title"], "handle": c["handle"], "observed_uploads": len(c["pub"]),
                "uploads_complete": True, "first_upload_at": min(c["pub"]) if c["pub"] else ""}
               for cid, c in chans.items()]
    write_csv(os.path.join(out, "discovery.csv"), DISCOVERY_FIELDS, [])
    write_csv(os.path.join(out, "channels.csv"), CHANNEL_FIELDS, ch_rows)
    write_csv(os.path.join(out, "videos.csv"), VIDEO_FIELDS, v_rows)
    reg = load_registry(root)
    known = {r["channel_id"] for r in reg}
    for cid, c in chans.items():
        if cid not in known:
            reg.append({"channel_id": cid, "title": c["title"], "handle": c["handle"], "market": market_id,
                        "source": "seed", "first_seen": snap_date.isoformat(),
                        "reason": f"nhập từ {videos_csv}"})
    save_registry(root, reg)
    return len(ch_rows), len(v_rows)


# ---------------------------------------------------------------- CLI
def load_config(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    for name in ("daily", "weekly", "index", "readme", "prune", "import-snapshot"):
        s = sub.add_parser(name)
        s.add_argument("--config", default="config/markets.json")
        s.add_argument("--root", default="research", help="Thư mục dữ liệu (worktree của nhánh research/reports)")
    sub.choices["daily"].add_argument("--date", type=date.fromisoformat, help="Mặc định: hôm nay giờ VN")
    sub.choices["daily"].add_argument("--cache", default=DEFAULT_CACHE)
    sub.choices["weekly"].add_argument("--end", type=date.fromisoformat, help="Ngày cuối, mặc định hôm nay giờ VN")
    sub.choices["weekly"].add_argument("--days", type=int, default=7)
    sub.choices["weekly"].add_argument("--label", help="Tên thư mục báo cáo, mặc định YYYY-Www")
    rd = sub.choices["readme"]
    rd.add_argument("--readme", default="README.md")
    rd.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY"), help="owner/repo, để tạo link")
    imp = sub.choices["import-snapshot"]
    imp.add_argument("--videos", required=True)
    imp.add_argument("--market", default="whatif-us")
    imp.add_argument("--date", type=date.fromisoformat, required=True)
    a = p.parse_args(argv)
    cfg = load_config(a.config)

    if a.cmd == "daily":
        key = os.environ.get("YOUTUBE_API_KEY")
        if not key:
            sys.exit("Thiếu biến môi trường YOUTUBE_API_KEY.")
        os.makedirs(os.path.dirname(a.cache), exist_ok=True)
        client = nf.Client(key, a.cache, ttl_hours=20)
        log = run_daily(client, cfg, a.root, a.date)
        print(f"Xong {log['snapshot_date']}: quota {log['quota_used']}, {log['tracked_channels']} kênh, "
              f"{log['tracked_videos']} video.")
        for mid, ml in log["markets"].items():
            if ml["errors"]:
                print(f"[{mid}] lỗi: " + "; ".join(ml["errors"]), file=sys.stderr)
    elif a.cmd == "weekly":
        d, n = run_weekly(cfg, a.root, a.end, a.days, label=a.label)
        print(f"Đã ghi {d}/SO_LIEU.md từ {n} snapshot.")
        if n == 0:
            print("Cảnh báo: không có snapshot nào trong khoảng ngày.", file=sys.stderr)
    elif a.cmd == "readme":
        day, changed = update_readme(a.root, a.readme, a.repo)
        print(f"README: báo cáo {day or 'trống'} · {'đã đổi' if changed else 'không đổi'}.")


    elif a.cmd == "prune":
        removed = prune_snapshot(cfg, a.root)
        print(f"Đã bỏ {len(removed)} kênh lệch ngách khỏi {a.root}/state/channels.csv")
        for r in removed:
            print(f"  - {r['title']}: {r['niche_share']:.0%} khớp trên {r['long_videos']} video dài")
    elif a.cmd == "index":
        update_index(a.root)
        print(f"Đã cập nhật {a.root}/reports/INDEX.md")
    else:
        nc, nv = import_snapshot(a.videos, a.root, a.market, a.date)
        print(f"Đã nhập {nc} kênh, {nv} video vào {a.root}/data/{a.date.isoformat()}.")


if __name__ == "__main__":
    main()
