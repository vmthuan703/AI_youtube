import sys, os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import niche_finder as nf

NOW = datetime(2026, 11, 3, tzinfo=timezone.utc)


def iso(days_ago):
    return (NOW - timedelta(days=days_ago)).strftime("%Y-%m-%dT%H:%M:%SZ")


def video(vid, ch, views, days_ago):
    return {"id": vid, "snippet": {"title": vid, "channelId": ch, "publishedAt": iso(days_ago)},
            "statistics": {"viewCount": str(views)}}


def channel(cid, age, subs, hidden=False):
    stats = {"viewCount": "1000", "videoCount": "3", "hiddenSubscriberCount": hidden}
    if not hidden:
        stats["subscriberCount"] = str(subs)
    return {"id": cid, "snippet": {"title": cid, "publishedAt": iso(age)}, "statistics": stats}


def test_build_rows_filters_old_channels_and_computes_ratios():
    videos = {"a": video("a", "new", 10000, 10), "b": video("b", "old", 99999, 10),
              "c": video("c", "hid", 500, 0)}
    channels = {"new": channel("new", 30, 100), "old": channel("old", 900, 5000),
                "hid": channel("hid", 10, 0, hidden=True)}
    rows = nf.build_rows("kw", "US", videos, channels, 180, now=NOW)
    by = {r["video_id"]: r for r in rows}
    assert set(by) == {"a", "c"}                      # kênh cũ bị loại
    assert by["a"]["views_per_day"] == 1000.0
    assert by["a"]["views_to_subs"] == 100.0
    assert by["c"]["views_to_subs"] == "" and by["c"]["subs_hidden"] is True
    assert by["c"]["views_per_day"] == 500.0          # video 0 ngày tuổi -> chia cho 1


def test_summarize_groups_and_counts_unique_channels():
    rows = [
        {"keyword": "k", "region": "US", "channel_id": "x", "views_per_day": 10},
        {"keyword": "k", "region": "US", "channel_id": "x", "views_per_day": 30},
        {"keyword": "k", "region": "US", "channel_id": "y", "views_per_day": 20},
        {"keyword": "k", "region": "VN", "channel_id": "z", "views_per_day": 5},
    ]
    s = nf.summarize(rows)
    assert s[0]["region"] == "US" and s[0]["new_channels"] == 2 and s[0]["videos"] == 3
    assert s[0]["median_views_per_day"] == 20


def test_client_caches_and_counts_quota(tmp_path):
    calls = []

    class Resp:
        status_code = 200
        def json(self): return {"items": []}

    class Sess:
        def get(self, url, params, timeout):
            calls.append(url)
            return Resp()

    c = nf.Client("k", str(tmp_path / "c.sqlite"), session=Sess())
    c.get("search", q="x"); c.get("search", q="x"); c.get("videos", id="1")
    assert len(calls) == 2            # lần 2 lấy từ cache
    assert c.units_used == 101


def test_client_raises_readable_error(tmp_path):
    class Resp:
        status_code = 403
        def json(self): return {"error": {"message": "quotaExceeded"}}

    class Sess:
        def get(self, *a, **k): return Resp()

    c = nf.Client("k", str(tmp_path / "c.sqlite"), session=Sess())
    try:
        c.get("search", q="x")
    except RuntimeError as e:
        assert "quotaExceeded" in str(e)
    else:
        raise AssertionError("phải raise")
