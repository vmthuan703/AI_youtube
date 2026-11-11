"""tools/qc_metrics.py — scorecard for a preview or final video, compared with what was measured on six reference videos.

  python tools/qc_metrics.py --video out/final.mp4 [--project projects/my-video] [--out build/qc_scorecard.md]
  python tools/qc_metrics.py --project projects/my-video       (uses build/preview.mp4, or the file in out/)

Needs ffmpeg + numpy only. Picture numbers ignore letterbox bars. Short previews give rough cut and pace numbers.
"""
import argparse, glob, json, os, re, subprocess, sys
import numpy as np

# name: (low, high, unit, what to do when outside). From the references, with the bars removed.
TARGETS = {
    "bars": (0.05, 0.08, "share of height, each side", "Set config bars to cine."),
    "luma": (0.19, 0.40, "median brightness 0-1", "Too dark: raise ambient, use the pearl style or a brighter palette."),
    "dark": (0.03, 0.22, "share of near-black pixels", "Lift the shadows: pearl style, more ambient, lighter walls."),
    "sat": (0.35, 0.47, "mean saturation 0-1", "Too intense: pearl style; keep only the hero outfit loud."),
    "bright": (0.13, 0.65, "share of bright frames (median > 0.40)", "Add a daylight or outdoor sequence: nature sets (beach, island, snow, farm, underwater), moods beach/snow/day."),
    "places": (4.0, 60.0, "distinct locations (shots.json set)", "Fill each shot's set in shots.json; the references move through many places: add a location or vary the sets."),
    "murky": (0.0, 0.12, "share of frames too dark to read (median < 0.13)", "Night scenes: keep the stage faceLight on, add a practical lamp near the faces, lighter walls."),
    "gloss": (0.008, 0.06, "share of pixels with a small bright highlight (glossy skin, hair, floors)", "Too flat: keep style gloss/env on (1.0 defaults), add a mirror floor or wet street, a light shaft, practical lights near faces; too high: lower mirror strength."),
    "empty": (0.0, 0.02, "share of frames with almost nothing in them", "Fill the purple stage: a bigger figure (a third of the height), a bigger diagram, a backdrop; see style-bible Explainers."),
    "still": (0.0, 0.10, "share of half-seconds where nothing moves", "Every shot moves: a camera drift, idle3 on people, a diagram that builds."),
    "cuts": (16.0, 22.0, "shots per minute", "Add or merge cuts on phrase boundaries."),
    "median": (2.0, 2.7, "median shot, seconds", "Shorten holds or add inserts."),
    "p25": (1.2, 1.7, "a quarter of shots are shorter than, seconds", "Add one-second inserts and reaction cuts."),
    "long": (0.0, 0.08, "share of shots over 8 s", "Break long holds with a new graphic or camera move."),
    "wpm": (155.0, 178.0, "narration words per minute", "Use --pace in tts_chatterbox.py."),
    "loud": (-15.0, -13.0, "LUFS", "Check config loudness and re-mix."),
}


def frames(path, vf, w, h, extra=()):
    cmd = ["ffmpeg", "-hide_banner", "-nostdin", "-loglevel", "error", *extra, "-i", path, "-an", "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    n = len(raw) // (w * h * 3)
    return np.frombuffer(raw[: n * w * h * 3], dtype=np.uint8).reshape(n, h, w, 3).astype(np.float32) / 255


def gloss_share(F, y):
    """per frame: share of pixels that are a specular highlight: bright, nearly white, 0.1 above the local 7x7 mean, in a
    neighbourhood that is not itself bright (so lit windows and skies do not count). Measured at 320x180.
    Calibration 2026-11-11: 0.2.x videos ~0.005, the 1.0 demo ~0.015."""
    pad = np.pad(y, ((0, 0), (3, 3), (3, 3)), mode="edge")
    c = pad.cumsum(1).cumsum(2)
    c = np.pad(c, ((0, 0), (1, 0), (1, 0)))
    loc = (c[:, 7:, 7:] - c[:, :-7, 7:] - c[:, 7:, :-7] + c[:, :-7, :-7]) / 49.0
    mx, mn = F.max(axis=3), F.min(axis=3)
    sat = (mx - mn) / (mx + 1e-4)
    hi = (y > 0.6) & (sat < 0.3) & (y - loc > 0.1) & (loc < 0.55)
    return hi.reshape(len(y), -1).mean(axis=1)


def picture(path):
    F = frames(path, "fps=1/2,scale=160:90", 160, 90)
    if not len(F):
        sys.exit(f"could not read frames from {path}")
    y = F @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    rows = y.mean(axis=(0, 2))
    top = 0
    while top < 30 and rows[top] < 0.012:
        top += 1
    bars = top / 90 if top >= 3 else 0.0
    if top >= 3:
        F, y = F[:, top:-top], y[:, top:-top]
    mx, mn = F.max(axis=3), F.min(axis=3)
    sat = (mx - mn) / (mx + 1e-4)
    # detail: share of pixels on an edge; under 4.5 % is a near-empty picture (a bare stage with one small label)
    gx, gy = np.abs(np.diff(y, axis=2))[:, :-1, :], np.abs(np.diff(y, axis=1))[:, :, :-1]
    edge = ((gx + gy) > 0.05).reshape(len(y), -1).mean(axis=1)
    G = frames(path, "fps=1/2,scale=320:180", 320, 180)
    if top >= 3:
        G = G[:, top * 2:-top * 2]
    gl = gloss_share(G, G @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)) if len(G) else np.zeros(1)
    return {"gloss": float(np.median(gl)), "bars": float(bars), "luma": float(np.median(y)), "dark": float((y < 0.08).mean()), "sat": float(sat.mean()), "murky": float((np.median(y.reshape(len(y), -1), axis=1) < 0.13).mean()), "bright": float((np.median(y.reshape(len(y), -1), axis=1) > 0.40).mean()),
            "empty": float((edge < 0.045).mean()), "empty_at": [i * 2 for i in np.nonzero(edge < 0.045)[0].tolist()]}


def stillness(path, top_share):
    """Share of half-second steps where the picture barely changes (cuts excluded): frozen holds read as a slideshow."""
    F = frames(path, "fps=2,scale=96:54", 96, 54)
    if len(F) < 3:
        return None
    t = int(round(top_share * 54))
    if t:
        F = F[:, t:-t]
    d = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2, 3))
    d = d[d < 0.12]   # bigger jumps are cuts
    return float((d < 0.0025).mean()) if len(d) else None


def cuts(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-i", path, "-an", "-vf", "scale=320:-2,select='gt(scene,0.22)',metadata=print:file=-", "-f", "null", "-"], capture_output=True, text=True, errors="ignore")
    ts, out = [float(x) for x in re.findall(r"pts_time:([\d.]+)", r.stdout)], []
    for t in ts:
        if not out or t - out[-1] >= 0.15:
            out.append(t)
    return out


def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip() or 0)


def loudness(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-i", path, "-vn", "-af", "ebur128=framelog=quiet", "-f", "null", "-"], capture_output=True, text=True, errors="ignore")
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    return float(m[-1]) if m else None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--video")
    ap.add_argument("--project")
    ap.add_argument("--out")
    a = ap.parse_args()
    v = a.video
    if not v and a.project:
        finals = sorted(glob.glob(os.path.join(a.project, "out", "*.mp4")), key=os.path.getmtime)
        prev = os.path.join(a.project, "build", "preview.mp4")
        v = finals[-1] if finals else prev
    if not v or not os.path.exists(v):
        sys.exit("no video found: pass --video or render a preview first")
    dur = duration(v)
    M = picture(v)
    M["still"] = stillness(v, M["bars"])
    ts = cuts(v)
    c = [0.0] + ts + [dur]
    d = np.array([b - a_ for a_, b in zip(c, c[1:])])
    M.update(cuts=len(d) / max(dur, 1) * 60, median=float(np.median(d)), p25=float(np.percentile(d, 25)), long=float((d > 8).mean()))
    M["loud"] = loudness(v)
    if a.project and os.path.exists(os.path.join(a.project, "timeline", "words.json")):
        w = json.load(open(os.path.join(a.project, "timeline", "words.json"), encoding="utf-8"))
        w = w.get("words", w) if isinstance(w, dict) else w
        if w:
            M["wpm"] = len(w) / max(w[-1]["end"] - w[0]["start"], 1) * 60
    if a.project and os.path.exists(os.path.join(a.project, "story", "shots.json")):
        sh = json.load(open(os.path.join(a.project, "story", "shots.json"), encoding="utf-8")).get("shots", [])
        sets = {str(x.get("set")).strip().lower() for x in sh if x.get("set")}
        if sets:
            M["places"] = float(len(sets))
    rows, bad = ["| Measure | This video | Target | Result |", "|---|---|---|---|"], 0
    for k, (lo, hi, unit, fix) in TARGETS.items():
        if M.get(k) is None:
            continue
        ok = lo <= M[k] <= hi
        bad += not ok
        fmt = (lambda x: f"{x:.3f}") if k == "gloss" else (lambda x: f"{x:.2f}") if k not in ("cuts", "wpm", "loud", "places") else (lambda x: f"{x:.1f}")
        rows.append(f"| {unit} | {fmt(M[k])} | {fmt(lo)} to {fmt(hi)} | {'OK' if ok else 'CHECK: ' + fix} |")
    md = f"# Scorecard: {os.path.basename(v)} ({dur:.0f} s)\n\n" + "\n".join(rows) + f"\n\n{len(rows) - 2 - bad} in range, {bad} to check. Targets describe one winning channel's template, not a rule.\n"
    if M.get("empty_at"):
        md += "\nNear-empty frames at (s): " + ", ".join(str(x) for x in M["empty_at"][:30]) + "\n"
    print(md)
    out = a.out or (os.path.join(a.project, "build", "qc_scorecard.md") if a.project else None)
    if out:
        os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
        open(out, "w", encoding="utf-8").write(md)
        open(os.path.splitext(out)[0] + ".json", "w", encoding="utf-8").write(json.dumps(M, indent=1))


if __name__ == "__main__":
    main()
