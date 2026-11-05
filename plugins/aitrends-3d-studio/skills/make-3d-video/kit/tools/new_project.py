"""tools/new_project.py — create a project folder for one video.

  python tools/new_project.py --name my-video --voice "path/voiceover.mp3" [--script path] [--lines path/lines.json] \
      --aspect 16:9|9:16 --resolution 720p|1080p|1440p|2160p --fps 24|30|60 --quality draft|standard|high|max \
      [--style cinematic] [--captions] [--upscale 1440p]

quality: draft (fast preview) · standard (CRF 18) · high (CRF 14, slow x264, lossless capture; default) ·
max (CRF 10 + 1.5x supersampling). fps 60 doubles the frames to render. --upscale makes the final MP4 1440p/4K for YouTube.
"""
import argparse, os, shutil, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import probe_duration, save_json

ap = argparse.ArgumentParser()
ap.add_argument("--name", required=True)
ap.add_argument("--voice", required=True)
ap.add_argument("--script")
ap.add_argument("--lines", help="lines.json from tools/tts.py (speaker windows for lip-sync)")
ap.add_argument("--aspect", default="16:9", choices=["16:9", "9:16"])
ap.add_argument("--resolution", default="1080p", choices=["720p", "1080p", "1440p", "2160p", "4k"])
ap.add_argument("--style", default="cinematic")
ap.add_argument("--fps", type=int, default=30, choices=[24, 25, 30, 50, 60])
ap.add_argument("--quality", default="high", choices=["draft", "standard", "high", "max"])
ap.add_argument("--upscale", choices=["1440p", "2160p"], help="upscale the final MP4 for YouTube (sharper VP9/AV1 encodes)")
ap.add_argument("--title", default="")
ap.add_argument("--captions", action="store_true", help="burn word-by-word captions (recommended for 9:16)")
a = ap.parse_args()

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
cfg = {"title": a.title or a.name, "aspect": a.aspect, "resolution": "2160p" if a.resolution == "4k" else a.resolution, "fps": a.fps, "quality": a.quality,
       "style": a.style, "voiceover": voice_dst.replace("\\", "/"), "script": script_dst.replace("\\", "/") if script_dst else None,
       "duration": round(dur, 3), "captions": bool(a.captions), "bars": None, "fadeIn": 0.5, "fadeOut": 0.8,
       "music": {"enabled": True, "gainDb": -17}, "sfx": {"enabled": True, "gainDb": -6}, "loudness": -14,
       "export": {"upscale": a.upscale} if a.upscale else {}}
save_json(os.path.join(root, "config.json"), cfg)
print(f"created {root}  (voiceover {dur:.1f}s, {a.aspect} {cfg['resolution']} @ {a.fps}fps, quality {a.quality}, style {a.style})")
