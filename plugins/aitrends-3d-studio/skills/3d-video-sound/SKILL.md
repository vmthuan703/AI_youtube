---
name: 3d-video-sound
description: "This skill should be used when the user runs /3d-video-sound or asks to \"add music\", \"add sound effects\", \"design the sound\", \"change the music mood\", \"use my own music\", \"the music is too loud/quiet\", \"remix the audio\", or \"redo the soundtrack\" for an aiTrends 3D Studio video. It plans mood-based generated music, places SFX and ambience cues on the shot list, mixes them under the voiceover with ducking and loudness normalisation, and muxes the final MP4.\n"
metadata:
  version: "0.2.0"
  author: aiTrends
---

# /3d-video-sound: music, SFX, ambience and the final mix

Work inside `aitrends-3d-studio/` on the active project. Read `../make-3d-video/references/sound-design.md` first.

## 1. Music plan
- Read `story/bible.md` and the shot list, then write `story/shots.json` → `"music"`: contiguous `{start, end, mood,
  intensity}` sections that change at story turns (typically every 20–90 s).
- Moods: `mystery, tension, action, wonder, hopeful, sad, triumph, playful, calm, dark, epic`; intensity 0–1.
- Audition: `python audio/music.py --mood tension --intensity 0.7 --dur 20 --out build/test_tension.wav` (send the WAV
  if the user wants to listen).
- User's own track: copy into `projects/<slug>/input/`, then `config.json` → `"music": {"enabled": true, "file":
  "input/<name>.mp3", "gainDb": -15}`. No music: `"music": {"enabled": false}`.

## 2. SFX and ambience
- Per shot `"sfx": [{"at": <s from shot start>, "name": "<effect>", "gain": -8}]` (optional `dur`, `seed`, `pitch`;
  `name` may be a WAV/MP3 path inside the project) and `"amb": {"name": "rain|wind|city|roomtone|murmur|hum", "gain": -22}`.
- `python audio/sfx.py --list`; audition with `python audio/sfx.py --demo build/sfx_demo`.
- Cues on actions: `whoosh`/`swish` for speed and whips, `carpass` for cars, `pop`/`blip` for graphics and grabs,
  `riser` → `impact`/`stinger` on reveals, `slowmo`/`freeze` for time effects, `hit`/`kick`/`footstep` on contact.
  Never stack more than ~2 cues at one instant; keep dialogue clear.

## 3. Mix and mux
`python audio/mix.py --project projects/<slug> [--upscale 1440p]`: ducks music −6 dB and ambience −4 dB under the
voice with a quick recovery in the pauses, adds the subscribe gag's small sounds, normalises to `config.loudness` (−14 LUFS), writes `build/mix.wav`, and (if `build/video_silent.mp4` exists)
`out/<title>.mp4` with AAC 48 kHz (384 kb/s for quality high/max).
Levels: `config.music.gainDb` (default −15), `duckDb` (−6), `releaseS` (0.16), `config.sfx.gainDb` (default −6); change by 2–3 dB per iteration and let the user judge by ear. QC the
loudness with `ffmpeg -i out/<file>.mp4 -af ebur128=framelog=quiet -f null -` (≈ −14 LUFS).
