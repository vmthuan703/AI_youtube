import csv
import os
import sys
from datetime import datetime, timezone

from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools", "thumbnails"))
import collect_thumbnails as ct  # noqa: E402

NOW = datetime(2026, 11, 4, tzinfo=timezone.utc)


def _v(ch, vid, views, title="What If X?", day="2026-10-01"):
    return {"market": "whatif-us", "channel_id": ch, "channel_title": ch, "video_id": vid,
            "title": title, "published_at": f"{day}T00:00:00Z", "is_long": "True",
            "exclude_reason": "", "views": str(views)}


def test_select_top_and_flop_with_rel():
    vs = [dict(v, views=int(v["views"])) for v in
          [_v("A", f"a{i}", n) for i, n in enumerate([100, 200, 300, 400, 5000, 50])]]
    picked = ct.select(vs, NOW, top_per_channel=2, flop_per_channel=1)
    tops = [p["video_id"] for p in picked if p["group"] == "top"]
    flops = [p["video_id"] for p in picked if p["group"] == "flop"]
    assert tops == ["a4", "a3"]
    assert flops == ["a5"]
    assert picked[0]["rel"] == round(5000 / 250, 2)


def test_select_skips_small_channels():
    vs = [dict(_v("B", "b1", 10), views=10)]
    assert ct.select(vs, NOW) == []


def test_load_videos_filters_niche_and_shorts(tmp_path):
    p = tmp_path / "videos.csv"
    rows = [_v("A", "1", 10), _v("A", "2", 10, title="Cooking vlog"),
            dict(_v("A", "3", 10), is_long="False")]
    with open(p, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    assert [r["video_id"] for r in ct.load_videos(str(p))] == ["1"]


def test_crop_letterboxed_to_16_9():
    img = Image.new("RGB", (480, 360), "black")
    assert ct.crop_16_9(img).size == (ct.W, ct.H)


def test_main_end_to_end(tmp_path, monkeypatch):
    day = tmp_path / "data" / "2026-11-04"
    day.mkdir(parents=True)
    rows = [_v("A", f"a{i}", 1000 * (i + 1)) for i in range(5)]
    with open(day / "videos.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    monkeypatch.setattr(ct, "fetch", lambda vid: Image.new("RGB", (ct.W, ct.H), (200, 30, 30)))
    monkeypatch.setattr(ct, "ocr", lambda p: "")
    ct.main(["--root", str(tmp_path)])
    out = tmp_path / "thumbnails" / "2026-11-04"
    with open(out / "index.csv", encoding="utf-8") as f:
        idx = list(csv.DictReader(f))
    assert len(idx) == 5
    assert float(idx[0]["warm_share"]) > 0.9
    assert (out / "sheets" / "top_views_1.jpg").exists()
