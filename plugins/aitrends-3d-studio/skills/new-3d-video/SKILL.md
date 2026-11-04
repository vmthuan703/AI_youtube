---
name: new-3d-video
description: "This skill should be used when the user runs /new-3d-video or asks to \"start a new 3D video\", \"set up a 3D video from this script\", \"make the voiceover for my 3D video\", \"time my script\", or \"plan the 3D shots for my script\" in the aiTrends 3D Studio. It covers the intake survey, installing or checking the studio, the Kokoro voiceover with word timings, creating the project, and the story breakdown with the shot list.\n"
metadata:
  version: "0.1.0"
  author: aiTrends
---

# /new-3d-video: survey → install → voiceover → timeline → story breakdown

Stages 1–4 of the aiTrends 3D Studio pipeline. Shared references live in `../make-3d-video/references/` (relative to
this skill's base directory); the studio kit is `../make-3d-video/kit/`.

## 1. Intake survey
Get the script (file, pasted text, or repo path). Ask ONE round (AskUserQuestion, recommended option first), skipping
anything the user already said: narrator voice, export quality (resolution + fps + preset, with the render-time
estimate from `render-qc.md`), format (16:9 / 9:16 + captions), pace. State the defaults for the rest (character voices
by role, generated music + SFX, style picked later from samples, title from the script).

## 2. Studio
If `aitrends-3d-studio/render.mjs` doesn't exist in the workspace, follow `../make-3d-video/references/install.md` in
full. Otherwise run `python tools/doctor.py` inside it and fix anything reported.

## 3. Voiceover, project and timeline (inside `aitrends-3d-studio/`)
Follow `../make-3d-video/references/voiceover.md`:
1. `python tools/tts.py --script <file> --list-speakers`, assign voices, render a `--preview 8`, send the MP3 and ask.
2. Full voiceover without `--preview`; check `tts_report.json`.
3. `python tools/new_project.py --name <slug> --voice build_voice/<slug>/voiceover.mp3 --lines build_voice/<slug>/lines.json
   --script <file> --aspect <16:9|9:16> --resolution <res> --fps <24|30|60> --quality <preset> --title "<title>"
   [--captions] [--upscale 1440p]`
4. `python tools/parse_script.py --project projects/<slug> --script build_voice/<slug>/words.json`; read
   `timeline/transcript.txt` (ends near the voiceover length).
5. `python tools/beats.py --project projects/<slug>` (`--force` to overwrite an existing shots.json).
A user-supplied voiceover goes through the Whisper route in `voiceover.md` instead.

## 4. Story breakdown
Read `../make-3d-video/references/style-bible.md` and `story-breakdown.md` fully, then write `story/bible.md`,
`scenes/cast.js` and the rewritten `story/shots.json`, and send a 5–10 line summary (cast with colours, locations, shot
count, highlights per act).

Finish by saying the next step is `/3d-video-styles` (or continue with `make-3d-video` if the user asked for the whole
video).
