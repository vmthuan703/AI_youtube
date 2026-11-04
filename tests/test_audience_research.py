import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import audience_research as ar

NOW = datetime(2026, 11, 3, tzinfo=timezone.utc)


def iso(days_ago):
    return (NOW - timedelta(days=days_ago)).strftime("%Y-%m-%dT%H:%M:%SZ")


def test_parse_duration():
    assert ar.parse_duration("PT4M") == 240
    assert ar.parse_duration("PT1H2M3S") == 3723
    assert ar.parse_duration("P1DT1S") == 86401
    assert ar.parse_duration("P0D") == 0
    assert ar.parse_duration("garbage") is None


def api_video(vid, dur, views=100, live="none", was_live=False):
    v = {"id": vid, "snippet": {"title": vid, "publishedAt": iso(5), "liveBroadcastContent": live,
                                "thumbnails": {"high": {"url": "t"}}},
         "contentDetails": {"duration": dur}, "statistics": {}}
    if views is not None:
        v["statistics"]["viewCount"] = str(views)
    if was_live:
        v["liveStreamingDetails"] = {}
    return v


def test_classify_excludes_shorts_live_missing():
    assert ar.classify(api_video("a", "PT10M"))["exclude_reason"] == ""
    assert ar.classify(api_video("b", "PT59S"))["exclude_reason"].startswith("shorts")
    assert ar.classify(api_video("c", "PT3M30S"))["exclude_reason"] == "ngan_3-4p"
    assert ar.classify(api_video("d", "PT10M", live="live"))["exclude_reason"].startswith("livestream")
    assert ar.classify(api_video("e", "PT10M", views=None))["exclude_reason"] == "thieu_views"
    r = ar.classify(api_video("f", "PT10M", was_live=True))
    assert r["is_long"] and r["live_flag"]


class FakeClient:
    units_used = 0

    def __init__(self, uploads):
        self.uploads = uploads

    def get(self, endpoint, **p):
        if endpoint == "channels":
            return {"items": [{"id": "UC1", "statistics": {"videoCount": "5"},
                               "contentDetails": {"relatedPlaylists": {"uploads": "UU1"}}}]}
        if endpoint == "playlistItems":
            if p.get("pageToken") is None:
                return {"items": [{"contentDetails": {"videoId": i}} for i in ["a", "b"]],
                        "nextPageToken": "n"}
            return {"items": [{"contentDetails": {"videoId": i}} for i in ["c", "a"]]}
        if endpoint == "videos":
            return {"items": [self.uploads[i] for i in p["id"].split(",") if i in self.uploads]}


def test_collect_paginates_dedups_and_reports_coverage():
    up = {"a": api_video("a", "PT10M"), "b": api_video("b", "PT30S"), "c": api_video("c", "PT8M")}
    vids, cov = ar.collect(FakeClient(up), [{"Kênh": "X", "Handle": "@x"}], {"x": "seed"}, now=NOW)
    assert [v["video_id"] for v in vids] == ["a", "b", "c", "a"]
    assert vids[-1]["exclude_reason"] == "trung_lap"
    c = cov[0]
    assert c["reported_videos"] == 5 and c["observed_videos"] == 4
    assert c["long_valid"] == 2 and c["shorts"] == 1 and c["duplicate"] == 1
    assert vids[0]["channel_role"] == "seed"


def vrow(ch, vid, views, days=10):
    return {"channel_name": ch, "video_id": vid, "views": str(views), "is_long": "True",
            "published_at": iso(days), "title": vid, "duration_s": "600", "thumbnail_url": "t"}


def test_normalize_baseline_and_burst_flags():
    rows = [vrow("A", f"a{i}", 2000) for i in range(4)] + [vrow("A", "hit", 30000)]
    rows += [vrow("B", "b1", 100), vrow("B", "b2", 100), vrow("B", "b3", 1500)]
    rows += [vrow("C", "c1", 0), vrow("C", "c2", 0), vrow("C", "c3", 0)]   # baseline 0
    rows += [vrow("D", "d1", 50)]                                         # quá ít video
    long_rows, base = ar.normalize(rows, now=NOW)
    by = {r["video_id"]: r for r in long_rows}
    assert base["A"] == (2000, 5)
    assert by["hit"]["relative_performance"] == 15 and by["hit"]["burst_robust"]
    assert by["b3"]["burst_10x"] and not by["b3"]["burst_robust"] and by["b3"]["low_base_burst"]
    assert by["c1"]["relative_performance"] is None and by["c1"]["baseline_channel"] == "khong_xac_dinh"
    assert by["d1"]["relative_performance"] is None
    assert by["d1"]["age_adjusted_relative"] is None
    assert by["hit"]["age_adjusted_relative"] > 1    # cùng nhóm tuổi, vượt trung vị


def labeled(ch, vid, rel, seg, views=1000, burst=None, robust=False, age=10):
    return {"channel_name": ch, "video_id": vid, "relative_performance": rel,
            "motivation_primary": seg, "views": views, "age_days": age,
            "burst_10x": rel >= 10 if burst is None else burst, "burst_robust": robust,
            "ge_100k": views >= 100000, "title": vid, "published_at": "x",
            "duration_s": "600", "thumbnail_url": "t"}


def test_segment_metrics_gates_and_score():
    rows = []
    # T1: 6 kênh x 3 video, 2 kênh bùng robust
    for c in range(6):
        for j, rel in enumerate([1.2, 2.0, 15.0 if c < 2 else 1.6]):
            rows.append(labeled(f"K{c}", f"t1-{c}-{j}", rel, "T1", robust=rel >= 12))
    # T2: 1 kênh có 2 video bùng -> không được tính là 2 kênh
    rows += [labeled("K0", "t2a", 20, "T2"), labeled("K0", "t2b", 30, "T2")]
    cfg = {"T1": {"ideas_count": "25", "us_evidence": "english", "promise_clear": "yes"}}
    t = {m["segment"]: m for m in ar.segment_table(rows, cfg)}
    t1, t2 = t["T1"], t["T2"]
    assert t1["n_video"] == 18 and t1["n_channel"] == 6
    assert t1["n_burst_channels"] == 2 and t1["n_robust_channels"] == 2
    assert t1["gate1"] == "DAT_TIN_CAY" and t1["gate2"].startswith("DAT+ROBUST") and t1["gate3"] == "DAT"
    assert t1["cross_channel_lift"] == 1.6
    # 20 (2 kênh bùng) + 25 (median 1.6) + 15 + 15 + 3 + 5
    assert t1["score"] == 83
    assert t1["decision"] == "UNG VIEN - THU NGHIEM"
    assert t2["n_burst_channels"] == 1 and t2["gate2"].startswith("KHONG_DAT")
    assert ar.segment_table(rows, cfg)[0]["segment"] == "T1"


def test_run_score_writes_template_without_labels(tmp_path):
    p = tmp_path / "v.csv"
    ar.write_csv(str(p), ar.VIDEO_FIELDS, [dict(vrow("A", "a", 10), is_long=True)])
    res = ar.run_score(str(p), str(tmp_path / "none.csv"), None, str(tmp_path), now=NOW)
    assert os.path.exists(res["template"]) and res["n_long"] == 1
