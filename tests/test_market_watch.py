import json
import os
import sys
from datetime import date, datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import market_watch as mw

NOW = datetime(2026, 11, 4, 9, 0, tzinfo=timezone.utc)
COST = {"search": 100, "videos": 1, "channels": 1, "playlistItems": 1}


def iso(days_ago):
    return (NOW - timedelta(days=days_ago)).strftime("%Y-%m-%dT%H:%M:%SZ")


def vid(v, ch, views, days_ago=10, dur="PT10M"):
    return {"id": v, "snippet": {"title": f"What if {v}", "channelId": ch, "publishedAt": iso(days_ago),
                                 "liveBroadcastContent": "none", "thumbnails": {}},
            "statistics": {"viewCount": str(views)}, "contentDetails": {"duration": dur}}


def chan(c, age, subs):
    return {"id": c, "snippet": {"title": c.upper(), "publishedAt": iso(age)},
            "statistics": {"subscriberCount": str(subs), "viewCount": "1", "videoCount": "3"},
            "contentDetails": {"relatedPlaylists": {"uploads": f"UU{c}"}}}


class FakeClient:
    """Giả YouTube API: 2 kênh (mới 'new' 30 ngày, cũ 'old' 900 ngày)."""

    def __init__(self, views=None):
        self.units_used = 0
        self.calls = []
        v = views or {}
        self.videos = {
            "a": vid("a", "new", v.get("a", 200_000)), "b": vid("b", "new", 1_000),
            "c": vid("c", "new", 1_200), "d": vid("d", "new", 900),
            "s": vid("s", "new", 5_000_000, dur="PT40S"),            # Shorts: bị loại
            "o": vid("o", "old", 3_000_000),
        }
        self.channels = {"new": chan("new", 30, 2_000), "old": chan("old", 900, 1_000_000)}

    def get(self, endpoint, **p):
        self.units_used += COST[endpoint]
        self.calls.append(endpoint)
        if endpoint == "search":
            return {"items": [{"id": {"videoId": x}} for x in ("a", "s", "o")]}
        if endpoint == "videos":
            return {"items": [self.videos[i] for i in p["id"].split(",") if i in self.videos]}
        if endpoint == "channels":
            if "forHandle" in p:
                return {"items": [self.channels["old"]]}
            return {"items": [self.channels[i] for i in p["id"].split(",") if i in self.channels]}
        if endpoint == "playlistItems":
            owner = p["playlistId"][2:]
            ids = [k for k, v in self.videos.items() if v["snippet"]["channelId"] == owner]
            return {"items": [{"contentDetails": {"videoId": i}} for i in ids]}
        raise AssertionError(endpoint)


def cfg(queries=("what if you",), budget=6000):
    return {"quota_budget": budget,
            "discovery": {"video_age_days": 90, "max_results": 50, "new_channel_days": 365,
                          "track_min_views": 20000},
            "tracking": {"max_channels": 60, "max_uploads_per_channel": 250},
            "markets": [{"id": "m", "name": "Ô thử", "region": "US", "language": "en",
                         "seed_handles": ["@old"], "queries": list(queries)}]}


def test_daily_adds_new_winner_and_writes_snapshot(tmp_path):
    root = str(tmp_path)
    log = mw.run_daily(FakeClient(), cfg(), root, date(2026, 11, 4), NOW)
    reg = {r["channel_id"]: r for r in mw.load_registry(root)}
    assert reg["old"]["source"] == "seed"
    assert reg["new"]["source"] == "discovery"          # kênh 30 ngày, video dài 200k
    out = tmp_path / "data" / "2026-11-04"
    for f in ("discovery.csv", "channels.csv", "videos.csv", "run.json", "TOM_TAT.md"):
        assert (out / f).exists()
    disc = mw.read_csv(str(out / "discovery.csv"))
    assert {r["video_id"] for r in disc} == {"a", "s", "o"}
    assert log["quota_used"] > 100 and log["tracked_channels"] == 2
    run = json.loads((out / "run.json").read_text(encoding="utf-8"))
    assert run["markets"]["m"]["queries_run"] == ["what if you"]


def test_budget_skips_queries_instead_of_overspending(tmp_path):
    client = FakeClient()
    log = mw.run_daily(client, cfg(queries=("q1", "q2", "q3"), budget=250), str(tmp_path),
                       date(2026, 11, 4), NOW)
    m = log["markets"]["m"]
    assert len(m["queries_run"]) == 2 and m["queries_skipped"] == ["q3"]
    assert client.units_used <= 250


def test_scorecard_open_market():
    pool = {f"v{i}": {"channel_id": f"c{i % 5}", "views": 200_000 + i, "is_long": "True"} for i in range(10)}
    info = {f"c{i}": {"title": f"C{i}", "age": 40 + i, "age_source": "video cũ nhất", "subs": 5_000}
            for i in range(5)}
    sc = mw.scorecard({"id": "m", "name": "Ô"}, pool, info, NOW)
    assert sc["gate_decisive"] == "đạt" and sc["gate_age"] == "đạt"
    assert sc["gate_ratio"] == "đạt" and sc["gate_big_count"] == "đạt"
    assert sc["verdict"] == "CỬA MỞ"


def test_scorecard_closed_market_old_channels():
    pool = {f"v{i}": {"channel_id": f"c{i % 5}", "views": 2_000_000, "is_long": "True"} for i in range(10)}
    info = {f"c{i}": {"title": f"C{i}", "age": 2000, "age_source": "ngày tạo kênh", "subs": 5_000_000}
            for i in range(5)}
    sc = mw.scorecard({"id": "m", "name": "Ô"}, pool, info, NOW)
    assert sc["gate_decisive"] == "không" and sc["gate_age"] == "không"
    assert sc["gate_median_views"].startswith("cảnh báo")
    assert sc["verdict"] == "CỬA ĐÓNG"


def test_weekly_computes_gain_and_burst(tmp_path):
    root = str(tmp_path)
    mw.run_daily(FakeClient(), cfg(), root, date(2026, 11, 2), NOW - timedelta(days=2))
    mw.run_daily(FakeClient(views={"a": 260_000}), cfg(), root, date(2026, 11, 4), NOW)
    d, n = mw.run_weekly(cfg(), root, date(2026, 11, 4), 7, generated=date(2026, 11, 4))
    assert n == 2
    comp = {r["channel_id"]: r for r in mw.read_csv(os.path.join(d, "competitors.csv"))}
    assert int(comp["new"]["views_gain"]) == 60_000
    bursts = mw.read_csv(os.path.join(d, "bung_videos.csv"))
    assert [b["title"] for b in bursts] == ["What if a"]          # 260k so với trung vị kênh
    md = open(os.path.join(d, "SO_LIEU.md"), encoding="utf-8").read()
    assert "Ngày nghiên cứu:** 2026-11-04" in md and "2026-10-29 → 2026-11-04" in md
    assert "2026-W45" in open(os.path.join(root, "reports", "INDEX.md"), encoding="utf-8").read()


def test_import_snapshot(tmp_path):
    src = tmp_path / "videos.csv"
    mw.write_csv(str(src), ["channel_name", "handle", "channel_id", "video_id", "title", "published_at",
                            "duration_s", "views", "likes", "comments", "is_long", "exclude_reason"],
                 [{"channel_name": "X", "handle": "@x", "channel_id": "cx", "video_id": "v1", "title": "t",
                   "published_at": iso(20), "duration_s": 600, "views": 5, "likes": 0, "comments": 0,
                   "is_long": True, "exclude_reason": ""}])
    nc, nv = mw.import_snapshot(str(src), str(tmp_path / "r"), "m", date(2026, 11, 3))
    assert (nc, nv) == (1, 1)
    ch = mw.read_csv(str(tmp_path / "r" / "data" / "2026-11-03" / "channels.csv"))
    assert ch[0]["first_upload_at"] == iso(20)


def test_readme_block_replace_and_idempotent(tmp_path):
    root = tmp_path / "r"
    for d, body in (("2026-11-03", "# Tóm tắt thu thập 2026-11-03\n\n## Ô A\n- cũ"),
                    ("2026-11-04", "# Tóm tắt thu thập 2026-11-04\n\n## Ô A\n- mới")):
        (root / "data" / d).mkdir(parents=True)
        (root / "data" / d / "TOM_TAT.md").write_text(body, encoding="utf-8")
    readme = tmp_path / "README.md"
    readme.write_text("# X\n\nMở đầu\n\n" + mw.README_START + "\nCŨ\n" + mw.README_END + "\n\nCuối\n",
                      encoding="utf-8")
    day, changed = mw.update_readme(str(root), str(readme), "o/r")
    text = readme.read_text(encoding="utf-8")
    assert (day, changed) == ("2026-11-04", True)
    assert "- mới" in text and "- cũ" not in text and "CŨ" not in text      # chỉ lấy ngày mới nhất
    assert "### Tóm tắt thu thập 2026-11-04" in text and "#### Ô A" in text  # hạ cấp tiêu đề
    assert text.startswith("# X\n\nMở đầu\n") and text.rstrip().endswith("Cuối")
    assert "blob/research/reports/data/2026-11-04/TOM_TAT.md" in text
    assert mw.update_readme(str(root), str(readme), "o/r") == ("2026-11-04", False)  # chạy lại không đổi


def test_readme_appends_block_when_markers_missing(tmp_path):
    readme = tmp_path / "README.md"
    readme.write_text("# X\n", encoding="utf-8")
    (tmp_path / "r").mkdir()
    day, changed = mw.update_readme(str(tmp_path / "r"), str(readme))
    text = readme.read_text(encoding="utf-8")
    assert day is None and changed and text.count(mw.README_START) == 1 and "Chưa có báo cáo" in text


def test_readme_weekly_block(tmp_path):
    root = tmp_path / "r"
    (root / "reports" / "2026-W44").mkdir(parents=True)
    (root / "reports" / "2026-W44" / "SO_LIEU.md").write_text("# Số liệu\n\n### Bảng chấm ô\ncũ", encoding="utf-8")
    d = root / "reports" / "2026-W45"
    d.mkdir()
    (d / "SO_LIEU.md").write_text("# Số liệu\n\n### Bảng chấm ô\nSỐ LIỆU", encoding="utf-8")
    (d / "BAO_CAO_DOI_THU.md").write_text(
        "# Báo cáo\n\n## 1. Kết luận nhanh\n- ý một\n- ý hai\n\n## 2. Bảng chấm ô\nBẢNG\n\n## 9. Giới hạn\nGH",
        encoding="utf-8")
    readme = tmp_path / "README.md"
    readme.write_text(f"# X\n\n{mw.README_START}\n{mw.README_END}\n\n{mw.WEEKLY_START}\nCŨ\n{mw.WEEKLY_END}\n\nCuối\n",
                      encoding="utf-8")
    mw.update_readme(str(root), str(readme), "o/r")
    text = readme.read_text(encoding="utf-8")
    assert "### 1. Kết luận nhanh" in text and "- ý hai" in text         # lấy mục kết luận, hạ cấp tiêu đề
    assert "BẢNG" not in text and "GH" not in text and "CŨ" not in text   # không lấy mục khác
    assert "reports/2026-W45/BAO_CAO_DOI_THU.md" in text and "2026-W44" not in text
    assert text.rstrip().endswith("Cuối")
    assert mw.update_readme(str(root), str(readme), "o/r")[1] is False    # chạy lại không đổi


def test_readme_weekly_falls_back_to_numbers_file(tmp_path):
    root = tmp_path / "r"
    d = root / "reports" / "2026-W45"
    d.mkdir(parents=True)
    (d / "SO_LIEU.md").write_text("# Số liệu\n\n## Ô A\n\n### Bảng chấm ô\nSỐ LIỆU\n\n### Kênh\nKHÁC", encoding="utf-8")
    readme = tmp_path / "README.md"
    readme.write_text("# X\n", encoding="utf-8")
    mw.update_readme(str(root), str(readme))
    text = readme.read_text(encoding="utf-8")
    assert "SỐ LIỆU" in text and "KHÁC" not in text and "nguồn `SO_LIEU.md`" in text
