---
name: make-3d-video
description: "This skill should be used when the user wants a narrated 3D animated story video from a SCRIPT in the aiTrends 3D style (toy-like 3D stick characters with big round heads and chunky hoodies, simple cinematic sets like school hallways, bedrooms and night streets, warm practical lights, low wide camera angles, depth of field), e.g. \"make a 3D video from this script\", \"turn my script into a 3D animation\", \"tạo video 3D từ kịch bản\", \"làm video what if 3D\", \"animate this story in 3D\", or \"do the whole 3D video\". It runs the full pipeline: survey, install, open-source voiceover (Kokoro TTS) with word timings, story breakdown, style choice, 3D scene building, rendering up to 4K/60 fps, music, SFX and the final MP4.\n"
metadata:
  version: "0.1.0"
  author: aiTrends
---

# aiTrends 3D Studio: script → finished 3D video

Turn a script into a finished MP4 where every frame is built by code: a local open-source voiceover (Kokoro-82M),
3D sets and characters in Three.js, rendered frame by frame in headless Chromium and encoded with ffmpeg. No image or
video generation models are used, so characters stay consistent across the whole video and text stays crisp. Invent
the visuals fresh for every script; only the style is fixed.

**Bundled resources (this skill's base directory):**
- `kit/`: the tested studio (renderer, 3D engine, TTS, tools, audio, the `examples/speed-demo` reference project).
  Install it into the workspace as `aitrends-3d-studio/` (`references/install.md`).
- `references/install.md`: install, dependency table, doctor, self-test.
- `references/voiceover.md`: the TTS survey answers → voices, preview, full voiceover, word timeline.
- `references/style-bible.md`: **the look** (characters, sets, light, camera, shot vocabulary, editing, graphics, 9:16).
  Read it fully before designing any shot.
- `references/story-breakdown.md`: `story/bible.md`, `story/shots.json`, pacing.
- `references/engine-api.md`: config and shots.json schemas, the shot module API, characters, sets, effects, cameras.
- `references/sound-design.md`: music plan, SFX library, ambience, levels.
- `references/render-qc.md`: quality presets, speed guide, preview and final render, QC checklist, troubleshooting.

Stage commands re-run one stage: `/new-3d-video` (stages 1–4), `/3d-video-styles` (5), `/render-3d-video` (6 and 8),
`/3d-video-sound` (7). When running end to end, follow this file and load references as each stage needs them.

## Golden rules
1. **Keep the script's words.** Never rewrite, add, drop or reorder spoken words (the TTS only fixes pronunciation).
   Every shot illustrates the words spoken while it is on screen.
2. **Same style, new pictures.** Invent sets, props, characters and actions from this script. Use
   `examples/speed-demo` only to learn the API.
3. **Show what is said, literally and specifically.** Abstract lines become visual metaphors, inserts or reactions.
4. **Draft, look, fix, then render.** Open contact sheets and stills yourself (read the PNGs) before any long render.
   Rendering 3D is slow; looking is fast.
5. **Four user checkpoints:** the setup survey, the voice preview, the style choice from rendered samples, and the video
   preview before the final render. If the user is away, take the defaults, state what was assumed, and continue.
6. **Files are the truth.** Each video lives in `aitrends-3d-studio/projects/<slug>/`; `story/shots.json` owns timing.

## Stage 1: Intake and survey
Get the script (a file, pasted text, or a path in the repo). Read it, list the speakers
(`python tools/tts.py --script <file> --list-speakers` once the studio is installed, or by eye), then ask ONE round
(AskUserQuestion, up to 4 questions, recommended option first):
1. **Narrator voice:** `am_michael` warm US male (Recommended) · `af_heart` warm US female · `am_fenrir` strong US male ·
   `bm_george` deep UK male.
2. **Export quality** (say the render-time estimate from `references/render-qc.md` for this machine and script length):
   1080p · 60 fps · high (Recommended for the final; smooth like the reference) · 1080p · 30 fps · high (half the render
   time) · 1440p/4K · 60 fps · max (sharpest, slowest; or 1080p60 + `--upscale 1440p` for YouTube's better encode) ·
   720p · 30 fps · draft (quick test).
3. **Format:** 16:9, captions off (Recommended) · 9:16 Shorts, captions on · 16:9 with burned-in captions.
4. **Pace:** natural 1.12× (Recommended) · calm 1.0× · fast 1.2×.

State the other defaults in one line and use them unless the user objects: character voices auto-assigned by role (show
the mapping), generated music + SFX on, style chosen later from rendered samples, title = the script's title.

## Stage 2: Install or check the studio
Follow `references/install.md`: copy `kit/` to `aitrends-3d-studio/` in the workspace (skip if present), install
dependencies, download the voice model, run `python tools/verify_kit.py` and `python tools/doctor.py`, then the
self-test, then `node render.mjs --project examples/speed-demo --bench`. Report what was installed in one short list,
the GPU line it printed (GPU or CPU) and its time estimate, which feeds the export-quality advice.

## Stage 3: Voiceover + timeline
Follow `references/voiceover.md` (inside `aitrends-3d-studio/`; `python3` where `python` isn't Python 3):
1. Preview: `python tools/tts.py --script <file> --out-dir build_voice/<slug> --voices "NARRATOR=…,JAKE=…" --speed 1.12
   --sentence-pause 0.15 --line-pause 0.35 --preview 8`. Send the MP3 (SendUserFile) and ask if voices and pace are OK.
2. Full voiceover: the same without `--preview` (background for long scripts). Check `tts_report.json`.
3. Project: `python tools/new_project.py --name <slug> --voice build_voice/<slug>/voiceover.mp3 --lines
   build_voice/<slug>/lines.json --script <file> --aspect 16:9 --resolution 1080p --fps 60 --quality high --title "<title>"
   [--captions] [--upscale 1440p]`.
4. Timeline: `python tools/parse_script.py --project projects/<slug> --script build_voice/<slug>/words.json` (exact
   timings with speakers; no Whisper). Check `timeline/transcript.txt` ends near the voiceover length.
5. `python tools/beats.py --project projects/<slug>` → beat sheet + draft `story/shots.json`.
If the user brought a finished voiceover instead, use the Whisper route in `references/voiceover.md`.

## Stage 4: Story breakdown
Read `references/style-bible.md` and `references/story-breakdown.md`. Write `story/bible.md` (logline, cast with one
signature colour each and their voices, locations with mood and light, motifs, music plan), `scenes/cast.js`, and
rewrite `story/shots.json` (contiguous shots, cut on phrase boundaries 0.1–0.2 s early, median 2.5–4 s, an
establishing shot per location, a concrete `scene` per shot). Send a 5–10 line plan summary and continue unless the
user objects.

## Stage 5: Style choice
Build the 1–2 most-used sets plus 3 representative shots (a wide with ≥ 2 characters, a face close-up with `dof`, an
action or night-exterior shot). Then:
```bash
node render.mjs --project projects/<slug> --styles cinematic,soft,ink,toon,golden,neon,noir --at <t1>,<t2>,<t3> --scale 0.5
```
Open `build/styles/style_grid.png`, then show it with one line per style: **cinematic** (ivory heads with a thin
outline, purple night, warm practicals, serif labels: the "crush" reference), **soft** (no outline, glossy pastel heads,
dreamy glow, rounded labels: the "luck" reference), **ink** (black stick figures, big white eyes, lavender rim), **toon** (bright
cel-shaded daylight), **golden** (warm sunset orange-teal), **neon** (magenta/cyan, strong glow), **noir** (cold,
desaturated thriller). Save the pick in `config.json` → `style`. Tweaks: add a custom entry to `STYLES` in
`engine/styles.js` (skin, paleSkin, outline, toon ramp, light multipliers, moods, grade) and re-render that row.

## Stage 6: Build every shot
Read `references/engine-api.md` and the example scenes in `examples/speed-demo/scenes/` (a full 32 s video) and
`examples/look-demo/scenes/` (explainer stage, UI pills, diner, gym, game show, casino, end screen) once. Work in batches of 8–12:
1. Write `scenes/sets/<location>.js` (reusable builders on top of `T.W.*`) and `scenes/shots/NN_<name>.js` with
   `registerShot('<id>', { init, draw, overlay? })` for the ids in shots.json.
2. `node render.mjs --project projects/<slug> --sheet --scale 0.4`. Open every `build/sheets/sheet_XX.png` against the
   QC checklist in `references/render-qc.md`. Fix MISSING shots, errors printed by the renderer, composition, poses.
3. Check motion with `--stills t1,t2,t3` or `--from A --to B --scale 0.5` (writes `build/preview.mp4`, draft encode).

Non-negotiables: a camera move in every shot; expressions on the beat; hands and feet in contact; colours from
`st.M`/`S()` and the cast; every number the narrator says on screen (`wordTime()`); `V()` for aspect-dependent values;
`draw()` a pure function of `t`; ≤ 5 real lights per shot; `dof` only on close-ups; no `Math.random`/`Date.now`.

## Stage 7: Sound
Read `references/sound-design.md`. Fill `story/shots.json` → `music` (contiguous mood sections) and per-shot `sfx` cues
and `amb` beds. Mixing happens after the final render, or run `python audio/mix.py --project projects/<slug>` now to
audition `build/mix.wav`.

## Stage 8: Render and deliver
Read `references/render-qc.md`.
1. Preview: `node render.mjs --project projects/<slug> --from 0 --to 20 --scale 0.5`. Send the preview (or contact
   sheets) and the final render-time estimate before the long render. This is the last checkpoint.
2. Final: `nohup node render.mjs --project projects/<slug> > build/render.log 2>&1 &` (quality, fps and resolution come
   from config.json). Poll the log (it prints fps and ETA) and report progress at sensible intervals.
3. `python audio/mix.py --project projects/<slug>`: music + SFX, ducking, −14 LUFS, AAC 48 kHz, and the upscale if
   `export.upscale` is set. Writes `out/<title>.mp4`.
4. QC the final file: duration matches, audio present, resolution/fps as chosen, a 1-frame-per-10-s contact sheet looks
   right. Deliver the MP4 (send the file), say in plain words where it was saved, and one line on what to tweak next.

## Defaults and judgement calls
- Unsure about a visual: choose the more literal, more cinematic option (a close-up for emotion, an insert for objects,
  a low wide for drama, a follow cam for action).
- About 12–20 shots per minute, 1–3 time-freezes per video, one establishing shot per location.
- Keep outfits fixed, screen direction consistent within a scene, and the same set build for every shot in a location.
- Long videos on a machine without a GPU: render a 720p draft of the whole video first, then the final quality
  overnight, or move the project folder to a desktop with a GPU (the project is self-contained).
