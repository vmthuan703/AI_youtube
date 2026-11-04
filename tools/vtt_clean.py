#!/usr/bin/env python3
"""Làm sạch phụ đề tự động .vtt của YouTube -> danh sách (giây, câu chữ), bỏ dòng lặp cuộn."""
import re, sys, html

TS = re.compile(r"(\d+):(\d\d):(\d\d)\.(\d+) --> ")

def parse(path):
    """Trả list (start_s, text). Phụ đề tự động lặp lại dòng trước; chỉ giữ phần chữ mới."""
    out, last, t0 = [], "", 0.0
    for raw in open(path, encoding="utf-8"):
        line = raw.strip()
        m = TS.match(line)
        if m:
            h, mi, s, ms = m.groups()
            t0 = int(h) * 3600 + int(mi) * 60 + int(s) + int(ms) / 1000
            continue
        if not line or line.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")) or "-->" in line:
            continue
        txt = html.unescape(re.sub(r"<[^>]+>", "", line)).replace("​", "").strip()
        txt = re.sub(r"\s+", " ", txt)
        if not txt or txt == last:
            continue
        out.append((t0, txt))
        last = txt
    # bỏ dòng là tiền tố của dòng kế tiếp (cuộn)
    res = []
    for i, (t, x) in enumerate(out):
        if i + 1 < len(out) and out[i + 1][1].startswith(x):
            continue
        res.append((t, x))
    return res

if __name__ == "__main__":
    for t, x in parse(sys.argv[1]):
        print(f"{t:7.1f}  {x}")
