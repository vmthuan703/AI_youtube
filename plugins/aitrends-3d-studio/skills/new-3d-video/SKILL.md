---
name: new-3d-video
description: "This skill should be used when the user runs /new-3d-video or asks to \"start a new 3D video\", \"set up a 3D video from this script\", \"make the voiceover for my 3D video\", \"time my script\", or \"plan the 3D shots for my script\" in the aiTrends 3D Studio. It covers channel settings and the script check, installing or checking the studio, the Chatterbox voiceover with word timings, creating the project, and the story breakdown with the shot list.\n"
metadata:
  version: "0.2.0"
  author: aiTrends
---

# /new-3d-video: channel settings → script check → install → voiceover → timeline → story breakdown

Stages 1–4 of the aiTrends 3D Studio pipeline. Shared references live in `../make-3d-video/references/` (relative to
this skill's base directory); the studio kit is `../make-3d-video/kit/`.

## 1. Intake survey
**Lessons first (1.0.3).** Run `node tools/retro.mjs --next` in the studio and read `channel/LESSONS.md`: the problems that
came back in past videos and the checklist for this one. Tell the user the top 3 items in one short list and apply them while
planning, building and checking shots.
Get the script (file, pasted text, or repo path). Read `channel/brand.json` once the studio exists: voice, style, format and export quality are already decided, so state them in
one line (with the render-time estimate from `render-qc.md`), offer to change them for this video, and ask only what is missing. Character voices go by role.

Then `python tools/script_check.py --script <file> --title "<title>"`: show the table, answer the **Story logic** questions it lists (power rule, timeline, climax cause and effect, twist, safety, science, cast: the hero is a boy and the best friend is a girl) with the script lines that break them, say what matters most, and ask whether the user wants to edit the script first. It never changes the script, and neither do you.

**Set match (1.0.5), once the script is final.** Follow `../make-3d-video/SKILL.md` → Stage 1b: write `story/needs.json` in the same read
as the Story logic answers, run `python tools/set_match.py --project projects/<slug> --script <file>`, send its lines and `STILL`
files (unopened), and ask the user for every ❌ (plugin / project / use:<id>). render.mjs blocks shot building until that is done.

## 2. Studio
If `aitrends-3d-studio/render.mjs` doesn't exist in the workspace, follow `../make-3d-video/references/install.md` in
full. Otherwise run `python tools/doctor.py` inside it and fix anything reported.

## 3. Voiceover, project and timeline (inside `aitrends-3d-studio/`)
Follow `../make-3d-video/references/voiceover.md`:
1. `python tools/tts.py --script <file> --list-speakers`, assign voices, render with `.venvs/chatterbox/Scripts/python tools/tts_chatterbox.py … --preview 6`, send the MP3 and ask. Keep the GPU free while it runs.
2. Full voiceover without `--preview`; read the pace line (target 160–175 words/min, re-run with the `--pace` it suggests) and check `tts_report.json`, `qc.json`.
3. `python tools/new_project.py --name <slug> --voice build_voice/<slug>/voiceover.mp3 --lines build_voice/<slug>/lines.json
   --script <file> --title "<title>"` (the rest comes from `channel/brand.json`)
4. `python tools/parse_script.py --project projects/<slug> --script build_voice/<slug>/words.json`; read
   `timeline/transcript.txt` (ends near the voiceover length).
5. `python tools/beats.py --project projects/<slug>` (`--force` to overwrite an existing shots.json).
A user-supplied voiceover goes through the Whisper route in `voiceover.md` instead.

## 4. Story breakdown
Read `../make-3d-video/references/style-bible.md` and `story-breakdown.md` fully, then write `story/bible.md`,
`scenes/cast.js` (hero and every other character from the `/channel/cast.js` roster, extras included: `CLASSMATE_2/3`, `BRO_2`, `RIVAL_2`, `STUDENTS`; `speaker` on every speaking character; `python tools/cast_check.py --project projects/<slug>` must pass) and the rewritten `story/shots.json` (locations from `story/set_match.json`), and send a 5–10 line summary (cast with colours, locations, palette,
signature device, shot count, highlights per act).

Finish by saying the next step is `/3d-video-styles` (or continue with `make-3d-video` if the user asked for the whole
video).
