#!/usr/bin/env python3
"""Tìm tệp khán giả cốt lõi theo ĐỘNG CƠ XEM (không theo từ khoá).

Hai bước:

  1) collect  — lấy toàn bộ video công khai của danh sách kênh qua YouTube Data API
                (uploads playlist + videos.list), lưu đủ trường, đánh dấu Shorts,
                livestream, thiếu view, trùng; báo độ phủ từng kênh.
                Quota rất thấp: ~1 đơn vị / kênh + 1 đơn vị / 50 video.

  2) score    — chuẩn hoá theo kênh (baseline = median views video dài hợp lệ),
                tính relative performance, cờ bùng 10x / robust 12x & baseline>=1000,
                ghép nhãn động cơ (labels.csv, do người/AI đọc từng video), rồi tính
                Bảng A (video) và Bảng B (tệp) với bộ lọc 3 cửa + điểm heuristic 100.

Không có nhãn -> `score` xuất labels_template.csv để điền (bước 3 của quy trình),
không tự gán nhãn theo từ khoá.
"""
from __future__ import annotations

import argparse
import csv
import os
import re
import sys
from datetime import datetime, timezone
from statistics import median

import niche_finder as nf

LONG_MIN_SECONDS = 240          # video dài >= 4 phút
SHORTS_MAX_SECONDS = 180        # Shorts hiện tối đa 3 phút
BURST_X = 10
ROBUST_X = 12
ROBUST_MIN_BASELINE = 1000
MIN_VIDEOS_FOR_BASELINE = 3
AGE_BUCKETS = [(0, 6, "0-6d"), (7, 13, "7-13d"), (14, 29, "14-29d"),
               (30, 89, "30-89d"), (90, 10**9, "90d+")]

VIDEO_FIELDS = [
    "channel_name", "channel_role", "handle", "channel_id", "video_id", "video_url",
    "title", "published_at", "duration_s", "views", "likes", "comments",
    "thumbnail_url", "description", "live_flag", "collected_at", "source",
    "is_long", "exclude_reason",
]
LABEL_FIELDS = [
    "video_id", "channel_name", "title", "topic", "promise", "desired_experience",
    "motivation_primary", "motivation_secondary", "confidence", "confidence_reason",
    "ambiguous",
]
TABLE_A_FIELDS = [
    "channel", "channel_role", "video_url", "title", "topic", "promise",
    "motivation_primary", "motivation_secondary", "confidence", "ambiguous", "views",
    "age_days", "age_bucket", "baseline_channel", "baseline_n", "relative_performance",
    "burst_10x", "burst_robust", "low_base_burst", "ge_100k",
]
TABLE_B_FIELDS = [
    "segment", "name", "viewer_sentence", "n_video", "n_channel", "median_views",
    "median_relative", "cross_channel_lift", "cross_channel_n", "hit_rate",
    "n_burst_channels", "n_robust_channels", "n_100k", "coverage", "age_bias",
    "gate1", "gate2", "gate3", "score", "score_detail", "decision",
]
UNASSIGNED = {"", "UNCLEAR", "AMBIGUOUS", "NONE"}


# ---------------------------------------------------------------- tiện ích
def parse_duration(s):
    """ISO-8601 (PT1H2M3S, P1DT2H) -> giây; None nếu không đọc được."""
    m = re.fullmatch(r"P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?", s or "")
    if not m:
        return None
    d, h, mi, se = (int(x or 0) for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + se


def handle_from(row):
    h = (row.get("Handle") or "").strip()
    if not h and row.get("URL YouTube"):
        m = re.search(r"/(@[^/?#]+)", row["URL YouTube"])
        h = m.group(1) if m else ""
    return h


def fmt(x, nd=2):
    if x is None:
        return ""
    return round(x, nd) if isinstance(x, float) else x


def write_csv(path, fields, rows):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def read_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


# ---------------------------------------------------------------- BƯỚC 1
def resolve_channel(client, handle):
    items = client.get("channels", part="snippet,statistics,contentDetails",
                       forHandle=handle).get("items", [])
    return items[0] if items else None


def list_upload_ids(client, playlist_id):
    ids, token = [], None
    while True:
        params = dict(part="contentDetails", playlistId=playlist_id, maxResults=50)
        if token:
            params["pageToken"] = token
        body = client.get("playlistItems", **params)
        ids += [i["contentDetails"]["videoId"] for i in body.get("items", [])]
        token = body.get("nextPageToken")
        if not token:
            return ids


def classify(v):
    """Trả (row-fields, exclude_reason)."""
    sn, st, cd = v.get("snippet", {}), v.get("statistics", {}), v.get("contentDetails", {})
    dur = parse_duration(cd.get("duration"))
    live = sn.get("liveBroadcastContent", "none")
    was_live = "liveStreamingDetails" in v
    reason = ""
    if live in ("live", "upcoming"):
        reason = "livestream_dang_dien_ra_hoac_sap_toi"
    elif "viewCount" not in st:
        reason = "thieu_views"
    elif dur is None or dur == 0:
        reason = "thieu_thoi_luong"
    elif dur <= SHORTS_MAX_SECONDS:
        reason = "shorts_hoac_ngan<=3p"
    elif dur < LONG_MIN_SECONDS:
        reason = "ngan_3-4p"
    thumbs = sn.get("thumbnails", {})
    thumb = (thumbs.get("maxres") or thumbs.get("high") or thumbs.get("default") or {}).get("url", "")
    return {
        "video_id": v["id"], "video_url": f"https://www.youtube.com/watch?v={v['id']}",
        "title": sn.get("title", ""), "published_at": sn.get("publishedAt", ""),
        "duration_s": "" if dur is None else dur,
        "views": st.get("viewCount", ""), "likes": st.get("likeCount", ""),
        "comments": st.get("commentCount", ""), "thumbnail_url": thumb,
        "description": (sn.get("description") or "").replace("\r", " ")[:500],
        "live_flag": "live/premiere_da_qua" if was_live else "",
        "is_long": reason == "", "exclude_reason": reason,
    }


def collect(client, channels, roles, now=None):
    now = now or datetime.now(timezone.utc)
    stamp = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    videos, coverage, seen = [], [], set()
    for ch in channels:
        name, handle = ch["Kênh"], handle_from(ch)
        role = roles.get(name.lower(), "")
        info = resolve_channel(client, handle) if handle else None
        if not info:
            coverage.append({"channel_name": name, "handle": handle, "role": role,
                             "status": "KHONG_TIM_THAY_KENH"})
            continue
        ids = list_upload_ids(client, info["contentDetails"]["relatedPlaylists"]["uploads"])
        got = {}
        for batch in nf.chunks(ids):
            for v in client.get("videos", part="snippet,statistics,contentDetails,liveStreamingDetails",
                                id=",".join(batch)).get("items", []):
                got[v["id"]] = v
        counts = {"long_valid": 0, "shorts": 0, "short_3_4m": 0, "live": 0,
                  "missing": 0, "duplicate": 0}
        for vid in ids:
            v = got.get(vid)
            if not v:
                counts["missing"] += 1
                continue
            row = classify(v)
            if vid in seen:
                row["is_long"], row["exclude_reason"] = False, "trung_lap"
                counts["duplicate"] += 1
            seen.add(vid)
            r = row["exclude_reason"]
            if r == "":
                counts["long_valid"] += 1
            elif r.startswith("shorts"):
                counts["shorts"] += 1
            elif r == "ngan_3-4p":
                counts["short_3_4m"] += 1
            elif r.startswith("livestream"):
                counts["live"] += 1
            elif r != "trung_lap":
                counts["missing"] += 1
            row.update(channel_name=name, channel_role=role, handle=handle,
                       channel_id=info["id"], collected_at=stamp,
                       source="YouTube Data API v3 (uploads playlist + videos.list)")
            videos.append(row)
        reported = int(info.get("statistics", {}).get("videoCount", 0))
        coverage.append({
            "channel_name": name, "handle": handle, "role": role, "channel_id": info["id"],
            "status": "OK", "reported_videos": reported, "observed_videos": len(ids),
            "missing_vs_reported": max(reported - len(ids), 0),
            "coverage_pct": round(100 * len(ids) / reported, 1) if reported else "",
            **counts,
        })
    return videos, coverage


# ---------------------------------------------------------------- BƯỚC 2
def age_bucket(days):
    for lo, hi, name in AGE_BUCKETS:
        if lo <= days <= hi:
            return name
    return ""


def normalize(videos, now=None):
    """Tính baseline từng kênh và relative performance cho video dài hợp lệ."""
    now = now or datetime.now(timezone.utc)
    long_rows = [dict(v) for v in videos if str(v.get("is_long")) in ("True", "true", "1")]
    by_ch = {}
    for r in long_rows:
        r["views"] = int(r["views"])
        by_ch.setdefault(r["channel_name"], []).append(r["views"])
    baselines = {}
    for ch, vs in by_ch.items():
        b = median(vs) if len(vs) >= MIN_VIDEOS_FOR_BASELINE else None
        baselines[ch] = (b if b else None, len(vs))
    for r in long_rows:
        b, n = baselines[r["channel_name"]]
        rel = r["views"] / b if b else None
        days = (now - nf.parse_time(r["published_at"])).days
        r.update(
            age_days=days, age_bucket=age_bucket(days),
            baseline_channel=b if b is not None else "khong_xac_dinh", baseline_n=n,
            relative_performance=rel,
            burst_10x=bool(rel is not None and rel >= BURST_X),
            burst_robust=bool(rel is not None and rel >= ROBUST_X and b >= ROBUST_MIN_BASELINE),
            low_base_burst=bool(rel is not None and rel >= BURST_X and b < ROBUST_MIN_BASELINE),
            ge_100k=r["views"] >= 100_000,
        )
    return long_rows, baselines


# ---------------------------------------------------------------- BƯỚC 5–7
def score_segment(m, cfg):
    """Điểm heuristic 100 — quy tắc nghiên cứu, không phải xác suất thành công."""
    parts = {}
    parts["lap_lai"] = 30 if m["n_burst_channels"] >= 3 else 20 if m["n_burst_channels"] == 2 else 0
    mr = m["median_relative"] or 0
    parts["on_dinh"] = 25 if mr >= 1.5 else 15 if mr >= 1.1 else 7 if mr >= 0.8 else 0
    parts["do_rong"] = (15 if m["n_video"] >= 15 and m["n_channel"] >= 5 else
                        10 if m["n_video"] >= 10 and m["n_channel"] >= 3 else 0)
    ideas = int(cfg.get("ideas_count") or 0)
    parts["y_tuong"] = 15 if ideas >= 20 else 8 if ideas >= 10 else 0
    us = (cfg.get("us_evidence") or "none").lower()
    parts["my"] = 10 if us == "geo" else 3 if us == "english" else 0
    parts["ro_rang"] = 5 if (cfg.get("promise_clear") or "").lower() in ("yes", "y", "1", "true") else 0
    return sum(parts.values()), parts


def segment_table(rows, segments_cfg):
    all_ages = [r["age_days"] for r in rows]
    overall_age = median(all_ages) if all_ages else None
    groups = {}
    for r in rows:
        groups.setdefault(r["motivation_primary"], []).append(r)
    out = []
    for seg, rs in groups.items():
        cfg = segments_cfg.get(seg, {})
        rels = [r["relative_performance"] for r in rs if r["relative_performance"] is not None]
        per_ch = {}
        for r in rs:
            if r["relative_performance"] is not None:
                per_ch.setdefault(r["channel_name"], []).append(r["relative_performance"])
        lifts = [median(v) for v in per_ch.values() if len(v) >= 2]
        complete = [r for r in rs if r.get("title") and r.get("published_at")
                    and str(r.get("duration_s")) and r.get("thumbnail_url")
                    and r["relative_performance"] is not None]
        ages = [r["age_days"] for r in rs]
        seg_age = median(ages)
        warn = ["chi_co_view_tich_luy"]
        if overall_age and not (0.67 <= (seg_age + 1) / (overall_age + 1) <= 1.5):
            warn.append(f"tuoi_trung_vi_{seg_age}d_vs_chung_{overall_age}d")
        young = sum(a < 7 for a in ages) / len(ages)
        if young > 0.3:
            warn.append(f"{round(100 * young)}%_video_<7_ngay")
        m = {
            "segment": seg, "name": cfg.get("name", ""),
            "viewer_sentence": cfg.get("viewer_sentence", ""),
            "n_video": len(rs), "n_channel": len({r["channel_name"] for r in rs}),
            "median_views": median(r["views"] for r in rs),
            "median_relative": median(rels) if rels else None,
            "cross_channel_lift": median(lifts) if lifts else None,
            "cross_channel_n": len(lifts),
            "hit_rate": sum(r["burst_10x"] for r in rs) / len(rs),
            "n_burst_channels": len({r["channel_name"] for r in rs if r["burst_10x"]}),
            "n_robust_channels": len({r["channel_name"] for r in rs if r["burst_robust"]}),
            "n_100k": sum(r["ge_100k"] for r in rs),
            "coverage": len(complete) / len(rs),
            "age_bias": "; ".join(warn),
        }
        # CỬA 1
        if m["n_video"] >= 15 and m["n_channel"] >= 5:
            g1 = "DAT_TIN_CAY"
        elif m["n_video"] >= 10 and m["n_channel"] >= 3:
            g1 = "DAT_SO_BO (CAN THU THAP THEM)"
        else:
            g1 = "CAN THU THAP THEM"
        # CỬA 2
        if m["n_burst_channels"] >= 2:
            g2 = "DAT"
            g2 += "+ROBUST" if m["n_robust_channels"] >= 2 else " (robust<2 kenh)"
            g2 += "" if (m["median_relative"] or 0) >= 1 else " | median_rel<1: co hit, chua on dinh"
        else:
            g2 = "KHONG_DAT (<2 kenh bung)"
        # CỬA 3
        ideas = int(cfg.get("ideas_count") or 0)
        g3 = "DAT" if ideas >= 20 else f"CHUA_DAT ({ideas} y tuong)" if ideas else "CHUA_DANH_GIA"
        total, parts = score_segment(m, cfg)
        passed = (g1.startswith("DAT")) + g2.startswith("DAT") + (g3 == "DAT")
        if passed == 3:
            decision = "UNG VIEN - THU NGHIEM" if g1 == "DAT_TIN_CAY" else "UNG VIEN SO BO - THU NGHIEM"
        elif g2.startswith("DAT"):
            decision = "TIEM NANG - CAN BO SUNG"
        else:
            decision = "CHUA DU BANG CHUNG"
        m.update(gate1=g1, gate2=g2, gate3=g3, score=total,
                 score_detail=" ".join(f"{k}={v}" for k, v in parts.items()),
                 decision=decision, _passed=passed)
        out.append(m)
    out.sort(key=lambda m: (m["_passed"], m["score"], m["median_relative"] or 0), reverse=True)
    return out


def age_matrix(rows):
    """Median relative theo tệp x nhóm tuổi đăng (so sánh tuổi tương đương)."""
    cells = {}
    for r in rows:
        if r["relative_performance"] is not None:
            cells.setdefault((r["motivation_primary"], r["age_bucket"]), []).append(r["relative_performance"])
    out = []
    for seg in sorted({k[0] for k in cells}):
        row = {"segment": seg}
        for _, _, b in AGE_BUCKETS:
            v = cells.get((seg, b))
            row[b] = f"{median(v):.2f} (n={len(v)})" if v else ""
        out.append(row)
    return out


def run_score(videos_path, labels_path, segments_path, out_dir, now=None):
    long_rows, baselines = normalize(read_csv(videos_path), now)
    if not labels_path or not os.path.exists(labels_path):
        tpl = os.path.join(out_dir, "labels_template.csv")
        write_csv(tpl, LABEL_FIELDS, [{"video_id": r["video_id"], "channel_name": r["channel_name"],
                                       "title": r["title"]} for r in long_rows])
        return {"template": tpl, "n_long": len(long_rows)}
    labels = {l["video_id"]: l for l in read_csv(labels_path)}
    segs = {s["code"]: s for s in read_csv(segments_path)} if segments_path else {}
    table_a, labeled = [], []
    for r in long_rows:
        l = labels.get(r["video_id"], {})
        r.update({k: (l.get(k) or "").strip() for k in LABEL_FIELDS[3:]})
        r["motivation_primary"] = r["motivation_primary"].upper()
        a = dict(r, channel=r["channel_name"],
                 relative_performance=fmt(r["relative_performance"]))
        table_a.append(a)
        if r["motivation_primary"] not in UNASSIGNED:
            labeled.append(r)
    table_a.sort(key=lambda a: (a["channel"], -(a["relative_performance"] or 0)))
    table_b = segment_table(labeled, segs)
    for m in table_b:
        for k in ("median_relative", "cross_channel_lift", "hit_rate", "coverage"):
            m[k] = fmt(m[k])
    write_csv(os.path.join(out_dir, "table_A_video.csv"), TABLE_A_FIELDS, table_a)
    write_csv(os.path.join(out_dir, "table_B_audience.csv"), TABLE_B_FIELDS, table_b)
    write_csv(os.path.join(out_dir, "table_B2_age_matrix.csv"),
              ["segment"] + [b for _, _, b in AGE_BUCKETS], age_matrix(labeled))
    write_csv(os.path.join(out_dir, "baselines.csv"), ["channel", "baseline", "n_long"],
              [{"channel": c, "baseline": b if b is not None else "khong_xac_dinh", "n_long": n}
               for c, (b, n) in sorted(baselines.items())])
    return {"n_long": len(long_rows), "n_labeled": len(labeled),
            "n_unassigned": len(long_rows) - len(labeled), "table_b": table_b}


# ---------------------------------------------------------------- CLI
def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("collect", help="Bước 1: lấy video của các kênh")
    c.add_argument("--channels", required=True, help="CSV có cột Kênh, Handle/URL YouTube")
    c.add_argument("--seed", nargs="*", default=["IFopposite"])
    c.add_argument("--controls", nargs="*", default=["Manifesting", "Hypothetica"])
    c.add_argument("--extra", nargs="*", default=[], help="Thêm kênh dạng Tên=@handle")
    c.add_argument("--out", default="out/videos.csv")
    c.add_argument("--coverage-out", default="out/coverage.csv")
    c.add_argument("--cache", default="cache.sqlite")
    s = sub.add_parser("score", help="Bước 2–7: chuẩn hoá, ghép nhãn, Bảng A/B")
    s.add_argument("--videos", default="out/videos.csv")
    s.add_argument("--labels", default="data/labels.csv")
    s.add_argument("--segments", default="data/segments.csv")
    s.add_argument("--out-dir", default="out")
    a = p.parse_args(argv)

    if a.cmd == "collect":
        key = os.environ.get("YOUTUBE_API_KEY")
        if not key:
            sys.exit("Thiếu biến môi trường YOUTUBE_API_KEY (xem .env.example).")
        chans = read_csv(a.channels)
        for e in a.extra:
            name, _, h = e.partition("=")
            chans.append({"Kênh": name, "Handle": h})
        roles = {n.lower(): "seed" for n in a.seed}
        roles.update({n.lower(): "control" for n in a.controls})
        names = {c["Kênh"].lower() for c in chans}
        for n in list(roles):
            if n not in names:
                print(f"CẢNH BÁO: kênh vai trò '{n}' không có trong danh sách (thêm bằng --extra Tên=@handle).")
        client = nf.Client(key, a.cache)
        try:
            videos, cov = collect(client, chans, roles)
        except RuntimeError as e:
            sys.exit(str(e))
        write_csv(a.out, VIDEO_FIELDS, videos)
        cov_fields = ["channel_name", "handle", "role", "channel_id", "status", "reported_videos",
                      "observed_videos", "missing_vs_reported", "coverage_pct", "long_valid",
                      "shorts", "short_3_4m", "live", "missing", "duplicate"]
        write_csv(a.coverage_out, cov_fields, cov)
        ok = [c for c in cov if c["status"] == "OK"]
        print(f"Quota dùng: {client.units_used}. Kênh tìm thấy {len(ok)}/{len(cov)}.")
        print(f"Tổng báo cáo {sum(c['reported_videos'] for c in ok)}, quan sát "
              f"{sum(c['observed_videos'] for c in ok)}, video dài hợp lệ "
              f"{sum(c['long_valid'] for c in ok)}. Chi tiết: {a.coverage_out}")
    else:
        res = run_score(a.videos, a.labels, a.segments, a.out_dir)
        if "template" in res:
            print(f"Chưa có nhãn. Đã xuất {res['template']} ({res['n_long']} video dài) — "
                  f"điền nhãn động cơ rồi lưu thành {a.labels}.")
            return
        print(f"Video dài {res['n_long']}, đã gán tệp {res['n_labeled']}, "
              f"chưa đủ căn cứ {res['n_unassigned']}.")
        for m in res["table_b"]:
            print(f"{m['segment']:<6}{m['n_video']:>4}v {m['n_channel']:>3}k  medRel={m['median_relative']}"
                  f"  bùng={m['n_burst_channels']} robust={m['n_robust_channels']}  điểm={m['score']}  {m['decision']}")


if __name__ == "__main__":
    main()
