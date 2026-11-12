"""audio/mix.py — build the soundtrack (voice + music + SFX + ambience), duck, master, and mux.

  python audio/mix.py --project projects/my-video [--video build/video_silent.mp4] [--no-music] [--no-sfx] [--upscale 1440p|2160p]

Reads config.json and story/shots.json:
  shot "sfx":  [{"at": 0.2, "name": "whoosh", "gain": -8, "dur": 0.7, "seed": 3, "pitch": 1.0}]  (at = seconds from shot start;
               name may also be a path to your own .wav/.mp3 relative to the project)
  shot "amb":  {"name": "rain", "gain": -20}   ambience bed looped under that shot (0.4 s fades)
  story "music": plan for audio/music.py  (or config.music.file = your own track, looped/trimmed)
Ducking: music −6 dB and ambience −4 dB while the narrator speaks, recovering quickly in the pauses (config.music.duckDb / releaseS). Master: loudness-normalised to config.loudness (default −14 LUFS).
Outputs build/mix.wav and, if the silent video exists, out/<title>.mp4 (AAC 48 kHz, 384 kb/s for quality high/max).
--upscale (or config "export": {"upscale": "1440p"}) re-encodes the picture to 1440p/4K with lanczos: YouTube then serves
its higher-bitrate VP9/AV1 encodes, so even 1080p viewers get a sharper image. Rendering stays at the project resolution.
"""
import argparse, json, os, re, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
from dsp import SR, secs, db, rms_db, place, write_wav, as_stereo, lp
from common import load_audio
import sfx as SFX
import music as MUSIC


def envelope(x, att=0.03, rel=0.45):
    """smoothed voice level 0..1 used to duck the music."""
    mono = np.abs(x).mean(axis=1) if x.ndim == 2 else np.abs(x)
    hop = secs(0.01); frames = np.sqrt(np.add.reduceat(mono ** 2, np.arange(0, len(mono), hop)) / hop)
    lv = np.clip((20 * np.log10(frames + 1e-9) + 50) / 30, 0, 1)
    out = np.zeros_like(lv); a, r = np.exp(-0.01 / att), np.exp(-0.01 / rel); v = 0.0
    for i, s in enumerate(lv):
        v = a * v + (1 - a) * s if s > v else r * v + (1 - r) * s; out[i] = v
    return np.repeat(out, hop)[: len(mono)]


def load_any(path, sr=SR):
    return load_audio(path, sr, mono=False)


def _probe(path, entries):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", entries, "-of", "json", path], capture_output=True, text=True)
    return json.loads(r.stdout or "{}")

def verify_final(out, total, cfg, upscaled=False):
    """1.0.6: check the muxed MP4 before it is delivered: video and audio present, duration equals the story,
    frame rate as configured. Exits 1 on any failure, so a bad file is never reported as done."""
    problems = []
    info = _probe(out, "format=duration:stream=codec_type,codec_name,avg_frame_rate,width,height")
    streams = info.get("streams", [])
    vids = [x for x in streams if x.get("codec_type") == "video"]; auds = [x for x in streams if x.get("codec_type") == "audio"]
    if not vids: problems.append("no video stream")
    if not auds: problems.append("no audio stream")
    dur = float((info.get("format") or {}).get("duration", 0) or 0)
    if abs(dur - float(total)) > 0.15: problems.append(f"duration {dur:.2f}s differs from the story's {float(total):.2f}s")
    if vids and not upscaled and cfg.get("fps"):
        num, _, den = (vids[0].get("avg_frame_rate") or "0/1").partition("/")
        fps = float(num) / float(den or 1) if float(den or 1) else 0
        if abs(fps - float(cfg["fps"])) > 0.5: problems.append(f"frame rate {fps:.2f} fps, config says {cfg['fps']}")
    if problems:
        print("FINAL FILE CHECK FAILED: " + "; ".join(problems)); sys.exit(1)
    print(f"final file check: {dur:.2f}s, video + audio present" + (", fps as configured" if vids and not upscaled else ""))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--project", required=True); ap.add_argument("--video"); ap.add_argument("--no-music", action="store_true"); ap.add_argument("--no-sfx", action="store_true"); ap.add_argument("--out"); ap.add_argument("--upscale", choices=["1440p", "2160p", "none"]); ap.add_argument("--encoder", choices=["auto", "x264", "nvenc"], default=None); ap.add_argument("--force", action="store_true", help="mux even if the render reported shot errors")
    a = ap.parse_args(); P = a.project
    cfg = json.load(open(os.path.join(P, "config.json"), encoding="utf-8")); story = json.load(open(os.path.join(P, "story", "shots.json"), encoding="utf-8"))
    total = story.get("duration") or story["shots"][-1]["end"]; n = secs(total)
    voice = load_any(os.path.join(P, cfg["voiceover"]))
    voice = np.concatenate([voice, np.zeros((max(0, n - len(voice)), 2), np.float32)])[:n]
    v_rms = rms_db(voice[np.abs(voice).mean(1) > db(-40)]) if np.any(np.abs(voice).mean(1) > db(-40)) else -20
    mcfg0 = cfg.get("music", {}) or {}
    env = envelope(voice, rel=float(mcfg0.get("releaseS", 0.16)))
    mix = voice.copy()
    # ---- music
    mcfg = cfg.get("music", {}) or {}
    if mcfg.get("enabled", True) and not a.no_music:
        if mcfg.get("file"):
            mus = load_any(os.path.join(P, mcfg["file"]))
            reps = int(np.ceil(n / len(mus))); mus = np.concatenate([mus] * reps)[:n]
            k = secs(3); mus[-k:] *= np.linspace(1, 0, k)[:, None]
        else:
            path = os.path.join(P, "build", "music.wav")
            plan = story.get("music") or MUSIC.default_plan(total)
            print(f"generating music: {len(plan)} section(s) — " + ", ".join(f"{s['mood']}@{s.get('intensity', .5)}" for s in plan))
            mus = MUSIC.render_score(plan, total, mcfg.get("seed", 1), mcfg.get("key")); write_wav(path, mus)
        mus = as_stereo(mus)[:n]; mus = np.concatenate([mus, np.zeros((n - len(mus), 2), np.float32)])
        mus *= db(v_rms + mcfg.get("gainDb", -15) - rms_db(mus))
        mus *= db(float(mcfg.get("duckDb", -6)) * env)[:, None]
        mix += mus
    # ---- sfx + ambience
    scfg = cfg.get("sfx", {}) or {}
    if scfg.get("enabled", True) and not a.no_sfx:
        bed = np.zeros((n, 2), np.float32); hits = np.zeros((n, 2), np.float32); cache = {}
        cues = []
        for s in story["shots"]:
            for c in s.get("sfx", []) or []: cues.append({**c, "t": s["start"] + float(c.get("at", 0))})
            if s.get("amb"):
                am = s["amb"]; ln = s["end"] - s["start"]
                key = (am["name"], am.get("seed", 1)); base = cache.get(key)
                if base is None: base = cache[key] = SFX.make(am["name"], dur=6.0, seed=am.get("seed", 1))
                loop = np.concatenate([base] * int(np.ceil(ln / (len(base) / SR) + 1)))[: secs(ln)]
                f = min(secs(0.4), len(loop) // 2); loop[:f] *= np.linspace(0, 1, f)[:, None]; loop[-f:] *= np.linspace(1, 0, f)[:, None]
                place(bed, loop, secs(s["start"]), db(am.get("gain", -20)))
        for c in story.get("sfx", []) or []: cues.append({**c, "t": float(c["t"])})
        gag = cfg.get("subscribeGag") or {}
        if gag.get("enabled") and cfg.get("aspect") != "9:16":   # the subscribe gag's own small sounds (engine/gag.js timing)
            at = float(gag.get("at", 90)); cues += [{"name": "pop", "t": at + 0.32, "gain": -14}, {"name": "blip", "t": at + 2.05, "gain": -12}, {"name": "ding", "t": at + 2.1, "gain": -18}]
        for c in cues:
            nm = c["name"]
            if re.search(r"\.(wav|mp3|ogg|flac|m4a)$", nm, re.I): snd = load_any(os.path.join(P, nm))
            else: snd = SFX.make(nm, dur=c.get("dur"), seed=c.get("seed"), pitch=c.get("pitch"))
            place(hits, snd, secs(c["t"]), db(c.get("gain", -8)))
        bed *= db(float(scfg.get("ambDuckDb", -4)) * env)[:, None]
        g = db(scfg.get("gainDb", -6) + (v_rms + 18))   # SFX levels are relative to the voice level
        mix += (hits + bed) * g
        print(f"sfx: {len(cues)} cue(s), ambience on {sum(1 for s in story['shots'] if s.get('amb'))} shot(s)")
    # ---- master: gentle high-pass, soft clip, loudness normalise with ffmpeg
    mix = mix - lp(mix, 25)
    peak = np.abs(mix).max()
    if peak > 0.95: mix = np.tanh(mix / peak * 1.2) / np.tanh(1.2) * 0.95
    raw = os.path.join(P, "build", "mix_raw.wav"); write_wav(raw, mix)
    out_wav = os.path.join(P, "build", "mix.wav"); lufs = cfg.get("loudness", -14)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af", f"loudnorm=I={lufs}:TP=-1.5:LRA=11", "-ar", str(SR), out_wav], check=True)
    print(f"wrote {out_wav}  ({total:.1f}s, target {lufs} LUFS)")
    video = a.video or os.path.join(P, "build", "video_silent.mp4")
    # 1.0.6: a render that reported shot errors or missing scenes is not muxed unless --force
    rs = os.path.join(P, "build", "render_status.json")
    if os.path.exists(rs) and not a.force:
        st = json.load(open(rs, encoding="utf-8"))
        if not st.get("ok", True): sys.exit(f"render reported {len(st.get('shotErrors', []))} shot error(s): fix the shots and re-render, or mux with --force")
    if os.path.exists(video):
        safe = re.sub(r"[^\w\- ]+", "", cfg.get("title") or "video").strip().replace(" ", "_") or "video"
        out = a.out or os.path.join(P, "out", f"{safe}.mp4"); os.makedirs(os.path.dirname(out), exist_ok=True)
        q = cfg.get("quality", "high"); abr = "384k" if q in ("high", "max") else "192k"
        up = a.upscale or (cfg.get("export") or {}).get("upscale")
        vcodec = ["-c:v", "copy"]
        if up and up != "none":
            vertical = cfg.get("aspect") == "9:16"; short = 1440 if up == "1440p" else 2160; long = short * 16 // 9
            w, h = (short, long) if vertical else (long, short)
            enc = a.encoder or cfg.get("encoder", "auto")
            nv = enc == "nvenc" or (enc == "auto" and subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-f", "lavfi", "-i", "color=c=black:s=320x240:d=0.2", "-c:v", "h264_nvenc", "-f", "null", "-"], capture_output=True).returncode == 0)
            codec = ["-c:v", "h264_nvenc", "-preset", "p7", "-tune", "hq", "-rc", "vbr", "-cq", "17", "-b:v", "0", "-maxrate", "100M", "-bufsize", "200M", "-spatial-aq", "1"] if nv else ["-c:v", "libx264", "-preset", "medium", "-crf", "15", "-tune", "animation"]
            vcodec = ["-vf", f"scale={w}:{h}:flags=lanczos", *codec, "-profile:v", "high", "-pix_fmt", "yuv420p",
                      "-g", str(max(1, round((cfg.get("fps") or 24) / 2))), "-bf", "2", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]
            print(f"upscaling picture to {w}x{h} for upload ({'NVENC' if nv else 'x264'})…")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", video, "-i", out_wav, "-map", "0:v:0", "-map", "1:a:0", *vcodec, "-c:a", "aac", "-b:a", abr, "-ar", "48000", "-shortest", "-movflags", "+faststart", out], check=True)
        verify_final(out, total, cfg, upscaled=bool(up and up != "none"))
        print(f"FINAL VIDEO: {out}")
    else:
        print(f"(no silent video at {video} yet — render it, then run this again to mux)")


if __name__ == "__main__":
    main()
