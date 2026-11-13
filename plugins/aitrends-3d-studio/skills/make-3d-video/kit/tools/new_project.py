"""tools/new_project.py — create a project folder for one video.

  python tools/new_project.py --name my-video --voice "path/voiceover.mp3" [--script path] [--lines path/lines.json] --title "..."

Everything else defaults to channel/brand.json (style, palette, bars, resolution, fps, quality, upscale, bubbles, subscribe gag), so
a new video starts with the channel's choices. Any option can still be given for one video:
  --aspect 16:9|9:16 --resolution 720p|1080p|1440p|2160p --fps 24|30|60 --quality draft|standard|high|max
  --style cine|pearl --palette dusk|cozy|tropic|alert|school|midnight --bars cine|none --captions --upscale 1440p --no-gag --no-bubbles

quality: draft (fast preview) · standard (CRF 18) · high (CRF 14, slow x264, lossless capture; default) ·
max (CRF 10 + 1.5x supersampling). fps 60 doubles the frames to render. --upscale makes the final MP4 1440p/4K for YouTube.
"""
import argparse, json, os, shutil, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import probe_duration, save_json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
try:
    BRAND = json.load(open(os.path.join(ROOT, "channel", "brand.json"), encoding="utf-8"))
except (OSError, ValueError):
    BRAND = {}
EX = BRAND.get("export", {})

ap = argparse.ArgumentParser()
ap.add_argument("--name", required=True)
ap.add_argument("--voice", required=True)
ap.add_argument("--script")
ap.add_argument("--lines", help="lines.json from the voiceover step (speaker windows for lip-sync and speech bubbles)")
ap.add_argument("--aspect", default=BRAND.get("aspect", "16:9"), choices=["16:9", "9:16"])
ap.add_argument("--resolution", default=EX.get("resolution", "1080p"), choices=["720p", "1080p", "1440p", "2160p", "4k"])
ap.add_argument("--style", default=BRAND.get("style", "cine"))
ap.add_argument("--palette", default=BRAND.get("palette"), help="this video's colour world: dusk, cozy, tropic, alert, school, midnight")
ap.add_argument("--bars", default=BRAND.get("bars", "cine"), help="cine (2:1 picture), none, wide, scope")
ap.add_argument("--fps", type=int, default=EX.get("fps", 30), choices=[24, 25, 30, 50, 60])
ap.add_argument("--quality", default=EX.get("quality", "high"), choices=["draft", "standard", "high", "max"])
ap.add_argument("--upscale", default=EX.get("upscale"), choices=["1440p", "2160p", "none"], help="upscale the final MP4 for YouTube (sharper VP9/AV1 encodes)")
ap.add_argument("--title", default="")
ap.add_argument("--captions", action="store_true", default=bool(EX.get("captions")), help="burn word-by-word captions (recommended for 9:16)")
ap.add_argument("--no-gag", action="store_true", help="no mid-video subscribe gag in this video")
ap.add_argument("--no-bubbles", action="store_true", help="no automatic speech bubbles in this video")
a = ap.parse_args()

vertical = a.aspect == "9:16"
root = os.path.join("projects", a.name)
for d in ["input", "timeline", "story", "scenes/sets", "scenes/shots", "build", "out", "audio"]:
    os.makedirs(os.path.join(root, d), exist_ok=True)
voice_dst = os.path.join("input", "voiceover" + os.path.splitext(a.voice)[1].lower())
shutil.copy2(a.voice, os.path.join(root, voice_dst))
script_dst = None
if a.script:
    script_dst = os.path.join("input", "script" + os.path.splitext(a.script)[1].lower())
    shutil.copy2(a.script, os.path.join(root, script_dst))
if a.lines:
    shutil.copy2(a.lines, os.path.join(root, "timeline", "lines.json"))
dur = probe_duration(os.path.join(root, voice_dst))
gag = dict(BRAND.get("subscribeGag") or {"enabled": True, "at": 90, "dur": 5})
if a.no_gag or vertical or dur < float(gag.get("at", 90)) + float(gag.get("dur", 5)) + 5:
    gag["enabled"] = False
upscale = None if a.upscale in (None, "none") else a.upscale
cfg = {"title": a.title or a.name, "aspect": a.aspect, "resolution": "2160p" if a.resolution == "4k" else a.resolution, "fps": a.fps, "quality": a.quality,
       "style": a.style, "palette": a.palette, "voiceover": voice_dst.replace("\\", "/"), "script": script_dst.replace("\\", "/") if script_dst else None,
       "duration": round(dur, 3), "captions": bool(a.captions) or vertical, "bars": None if vertical or a.bars == "none" else a.bars, "fadeIn": 0.5, "fadeOut": 0.8,
       "speechBubbles": False if a.no_bubbles else bool(BRAND.get("speechBubbles", True)), "subscribeGag": gag,
       "music": {"enabled": True, "gainDb": -15, "duckDb": -6, "releaseS": 0.16}, "sfx": {"enabled": True, "gainDb": -6}, "loudness": -14,
       "export": {"upscale": upscale} if upscale else {}}
save_json(os.path.join(root, "config.json"), cfg)
print(f"created {root}  (voiceover {dur:.1f}s, {a.aspect} {cfg['resolution']} @ {a.fps}fps, quality {a.quality}, style {a.style}" + (f", palette {a.palette}" if a.palette else "") + f", bars {cfg['bars']}, subscribe gag {'on' if gag.get('enabled') else 'off'})")
