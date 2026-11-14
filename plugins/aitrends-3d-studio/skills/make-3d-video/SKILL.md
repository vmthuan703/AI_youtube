---
name: make-3d-video
description: "This skill should be used when the user wants a narrated 3D animated story video from a SCRIPT in the aiTrends 3D style (toy-like 3D stick characters with big round heads, a loud channel hero in a lime puffer, American sets with real depth, a film picture with sky, sun, weather, haze and god rays, a 2:1 picture, animated explainer diagrams), e.g. \"make a 3D video from this script\", \"turn my script into a 3D animation\", \"tạo video 3D từ kịch bản\", \"làm video what if 3D\", \"animate this story in 3D\", or \"do the whole 3D video\", also from a bare idea in ONE prompt (it writes the script, stops once for the script, then runs to the MP4). It runs the full pipeline: channel settings, script check, emotional voiceover (Chatterbox, with Kokoro as fallback) with word timings, story breakdown, style and palette choice, 3D scene building, rendering up to 4K/60 fps, music, SFX, scorecard, the final MP4 and cinematic thumbnail options for it.\n"
metadata:
  version: "2.1.1"
  author: aiTrends
---

# aiTrends 3D Studio: script → finished 3D video

Turn a script into a finished MP4 where every frame is built by code: a local voiceover (Chatterbox, cloned from a Kokoro
voice), 3D sets and characters in Three.js, rendered frame by frame in headless Chromium and encoded with ffmpeg. No image or
video generation models are used, so characters stay consistent across the whole video and text stays crisp. Invent
the visuals fresh for every script; the style and the channel's hero stay fixed.

**Bundled resources (this skill's base directory):**
- `kit/`: the tested studio (renderer, 3D engine, TTS, tools, audio, `channel/`, examples). Install it into the workspace as
  `aitrends-3d-studio/` (`references/install.md`).
- `kit/channel/`: the channel's choices: `brand.json` (voice, style, bars, export, bubbles, subscribe gag, clean-up) and
  `cast.js` (the hero). Updates never overwrite it once installed.
- `references/install.md`: install, dependency table, doctor, self-test.
- `references/voiceover.md`: voices, preview, full voiceover, pace check, word timeline.
- `references/style-bible.md`: **the look** (characters, sets, light, camera, shot vocabulary, editing, graphics, 9:16).
  Read it fully before designing any shot.
- `references/story-breakdown.md`: script check, `story/bible.md`, `story/shots.json`, pacing.
- `references/set-match.md`: 1.0.5 catalogue of ready-made sets, props, actions and effects; needs.json, the match report, decisions, adding a set to the plugin, the wishlist.
- `references/engine-api.md`: config and shots.json schemas, the shot module API, characters, sets, diagrams, effects, cameras.
- `references/sound-design.md`: music plan, SFX library, ambience, levels.
- `references/render-qc.md`: quality presets, speed guide, preview and final render, scorecard, QC checklist, troubleshooting.
- `references/thumbnails.md`: 2.1 cinematic thumbnails: rules, reading the script for poster moments, the thumbnail project, composing in screen space, looks, render and check.

Stage commands re-run one stage: `/new-3d-video` (stages 1–4), `/3d-video-styles` (5), `/render-3d-video` (6 and 8),
`/3d-video-sound` (7), `/make-thumbnail` (9). When running end to end, follow this file and load references as each stage needs them.

## Golden rules
1. **Keep the script's words.** Never rewrite, add, drop or reorder spoken words (the TTS only fixes pronunciation). The
   script check only suggests; the user decides, and only the user's own edit changes the script.
   Every shot illustrates the words spoken while it is on screen.
2. **Same style, new pictures.** Invent sets, props, characters and actions from this script. Use the examples only to
   learn the API. Learn structure from reference videos; never copy their devices, gags or wording.
3. **Show what is said, literally and specifically.** Abstract lines become visual metaphors, inserts, diagrams or reactions.
4. **The channel's identity is fixed.** The hero from `channel/cast.js`, the voice and the purple stage stay the same in every
   video. Change them only when the user asks, and then in `channel/`.
5. **Draft, look, fix, then render.** Open contact sheets and stills yourself (read the PNGs) before any long render.
   Rendering 3D is slow; looking is fast.
6. **Six user checkpoints:** the script check, the **set match** (1.0.5: what the kit has, what is missing, and the user's choice
   for each missing item), the voice preview, the style and palette choice from rendered samples, the video preview with its
   scorecard, and the final file. If the user is away, take the defaults, state what was assumed, and continue; the one exception
   is the set match: a missing item is never added to the plugin without the user's yes.
7. **Files are the truth.** Each video lives in `aitrends-3d-studio/projects/<slug>/`; `story/shots.json` owns timing.

## One-prompt run (2.0): `/make-3d-video <idea or script>`
The user gives one prompt and gets the MP4. Run every stage without asking, with the channel's defaults (`channel/brand.json`:
voice, `cine` style, format, export quality), and stop **once**:
- **The script checkpoint** (the only stop). From an idea: write the script by the channel rules (`prompts/QUY_TAC_VIET_SCRIPT_KENH.md` in
  the repo when it exists, and `references/story-breakdown.md` -> "Writing a script"), write **three openings** of about 28 words each to
  `build_voice/<slug>/hooks.txt` (blocks separated by `---`) and rank them: `python tools/retention.py --hooks build_voice/<slug>/hooks.txt`.
  Put the best one on the script, then run `tools/script_check.py` and `python tools/retention.py --script <file> --out
  build_voice/<slug>/retention.md`. Fix every FLAT window and every LOOK/MISS you can yourself and re-run (the script is yours until the
  user has seen it). Then show: the title, the three hooks with their scores, the retention table, what is still open, and the script
  file. Ask once: continue, or edit. A script the user brought is checked the same way but never rewritten: show the tables and ask.
- After the user's yes nothing else stops the run. The set match decides by itself (`use:<id>` for the nearest ready-made set, `project`
  for anything missing: never add to the plugin without a yes; list those in the final summary instead). The voice preview, the style
  grid and the video preview are skipped: listen to and look at them yourself (contact sheets, `--qc` with 0 red, the scorecard).
- **Thumbnails** (Stage 9) are staged, rendered and checked without asking; the sheet goes out with the MP4.
- **Final summary** with the MP4 and the thumbnail sheet: what was assumed, the hook chosen, the weather and look per location, QC results, what was built only
  for this project and could go into the plugin, and the one thing most worth changing.
The user can still ask for any checkpoint ("show me the styles", "let me hear the voice"); then the staged flow below applies.

## Stage 0: Script depth gate (default level: Sâu)
Runs before Stage 1 and before any voice is generated (the voiceover is the costly step; never spend GPU on an unchecked script).
The channel default is **mức Sâu**; the user can say "mức chuẩn" or "bỏ qua mức" for one video. When the repo has
`prompts/MUC_SAU_VIET_SCRIPT.md`, follow it (and `prompts/QUY_TAC_VIET_SCRIPT_KENH.md` first):
- **From an idea:** run the 8 steps (30 ideas -> 3 cards -> loophole check -> 3 independent drafts -> blind council -> up to 3 revision rounds).
  Drop the "TTS editor" reviewer here (voice is Stage 3) and apply the 3D cast rule (hero boy, best friend girl, roster only).
- **A script the user brought:** score it with the same blind reviewers and gate, show the report, never rewrite it.
- **Gate (all must pass):** logic no P0; facts no false item; template risk <= 3; every factor >= 7; fantasy/shock >= 8; total >= 8.
  After 3 rounds without a pass, stop and show the best version with its scores; the user picks or edits. Scores are AI-made and
  differences under ~0.5 total are noise: say so.
- Measure word counts and marker positions with scripts, log tokens per step to `deep/token_ledger.md`, then continue with Stage 1
  (script_check, retention, set match) on the gate-passing script. Stage 8 of the Sâu process (retention log 48 h after posting) stays open.

## Stage 1: Intake and script check
**Lessons first (1.0.3).** Run `node tools/retro.mjs --next` in the studio and read `channel/LESSONS.md`: the problems that
came back in past videos and the checklist for this one. Tell the user the top 3 items in one short list and apply them while
planning, building and checking shots.
Get the script (a file, pasted text, or a path in the repo). Read `channel/brand.json` once the studio exists and do not ask
again what it already answers: voice, style, format, export quality. State those in one line, with the render-time estimate
from `references/render-qc.md`, and ask only what is missing (usually the title). Offer to change any of them for this video.

Then run the check and show the table:
```bash
python tools/script_check.py --script <file> --title "<title>" --out build_voice/<slug>/script_check.md
```
Then read the whole script and answer, in writing, the **Story logic** questions at the end of `script_check.md`: the power rule,
big numbers, the timeline, the climax's cause and effect, the change of heart, the twist set-up, safety, science, and cast. Quote the
script line for each problem. These are the faults that cost the Memory 100x v2 script its logic score (6.5/10). Rewriting the
script after the voiceover is the most expensive fix, so raise them now. A MISS on **Hero name fits the hero** or **Day count adds up**
and any logic problem must be shown even if the user is away. The channel hero is a **boy** and the best friend is a **girl**
(`channel/cast.js`).
Also run `python tools/retention.py --script <file> --out build_voice/<slug>/retention.md` (2.0): the hook score for the first 10 seconds and a
score for every 30 seconds, with what each FLAT window lacks. Show the table with the script check.
Say which results matter most and ask whether the user wants to edit the script before the voice is generated. Never change
the script yourself. If they say to continue as is, continue. When the user asks you to **write** a script, follow the rules in (1.0.7: the voiceover stops while the check has LOOK/MISS items; after the user says to continue, re-run the voiceover with `--accept-script-check`.)
`references/story-breakdown.md` → "Writing a script" from the first draft.

## Stage 1b: Set match (1.0.5), once the script is final
1. In the same read as the Story logic answers, write `projects/<slug>/story/needs.json`: every place, named prop, non-trivial
   action and weather/effect, each `{name, quote, desc}` (schema in `references/set-match.md`; don't read that file otherwise).
2. `python tools/set_match.py --project projects/<slug> --script <file>`. Its output is the whole report: read it, not the .md and
   not `engine/catalog.json`. Fix needs.json if a 🟡/✅ is wrong for the story; decide 🟡 yourself (`--decide "<name>=use:<id>"`).
3. **Checkpoint.** Send the user the report lines plus the `STILL` files it printed (SendUserFile; don't open them), and ask for
   every ❌: **plugin**, **project** (built only here) or **use:<id>**. Record: `--decide "<name>=plugin" --decide ...`.
4. For each "plugin" item: read `references/set-match.md` → "Adding a set", build it in the plugin repo on the next version
   branch with its catalogue entry, `--verify-catalog`, `node render.mjs --catalog <id>` and open only those stills; send them.
   On the user's OK: `python tools/sync_kit.py --to <studio>` (copies the kit into the studio at once), then in the studio
   `--added "<name>=<id>"` and `node render.mjs --catalog <id>` (its still for later videos). Continue the video; the plugin
   release waits for Stage 8.
Shot building needs no extra command: `render.mjs` refuses `--sheet`, previews and the final render while a ❌ is undecided or a
shots.json `set` is unknown (`--force` overrides).

## Stage 2: Install or check the studio
Follow `references/install.md`: copy `kit/` to `aitrends-3d-studio/` in the workspace (skip if present), install
dependencies including the Chatterbox environment, run `python tools/verify_kit.py` and `python tools/doctor.py`, then the
self-test, then `node render.mjs --project examples/speed-demo --bench`, then `node render.mjs --catalog` once in the background
(one still per ready-made set for the set match; re-run after a plugin update). Report what was installed in one short list,
the GPU line it printed (GPU or CPU) and its time estimate, which feeds the export-quality advice.

## Stage 3: Voiceover + timeline
Follow `references/voiceover.md` (inside `aitrends-3d-studio/`). **Keep the GPU free while Chatterbox runs: no renders, no other
GPU work.** Measure the pace from a full-length sentence before quoting a finish time.
1. Preview: `.venvs/chatterbox/Scripts/python tools/tts_chatterbox.py --script <file> --out-dir build_voice/<slug> --voices
   "NARRATOR=am_puck+1.5,JAKE=am_liam+3" --lexicon <file> --preview 6`. Send the MP3 (SendUserFile) and ask if voices and pace are OK.
2. Full voiceover: the same without `--preview` (background). Read the pace line it prints. Outside 160–175 words/min, re-run with
   the `--pace` it suggests (finished chunks are cached). Check `tts_report.json` and `qc.json`.
3. Project: `python tools/new_project.py --name <slug> --voice build_voice/<slug>/voiceover.mp3 --lines
   build_voice/<slug>/lines.json --script <file> --title "<title>"` (everything else comes from `channel/brand.json`).
4. Timeline: `python tools/parse_script.py --project projects/<slug> --script build_voice/<slug>/words.json` (exact
   timings with speakers). Check `timeline/transcript.txt` ends near the voiceover length.
5. `python tools/beats.py --project projects/<slug>` → beat sheet + draft `story/shots.json`.
If the user brought a finished voiceover instead, use the Whisper route in `references/voiceover.md`.

## Stage 4: Story breakdown
Read `references/style-bible.md` and `references/story-breakdown.md`. Write `story/bible.md` (logline, cast with one
signature colour each and their voices, locations with mood and light, **this video's palette**, **its one signature device**,
motifs, music plan), `scenes/cast.js` (import the hero and every supporting role from `/channel/cast.js`: a nurse is `NURSE`, a grandpa `GRANDPA`, see `ROLES`; give every speaking character its `speaker` name;
**every character comes from the roster, extras included**: a second or third girl is `CLASSMATE_2` / `CLASSMATE_3`, a second boy `BRO_2` / `RIVAL_2`, background
students `STUDENTS`; change one colour or the hair at most, never write an outfit from scratch; then run `python tools/cast_check.py --project projects/<slug>`), and
rewrite `story/shots.json` (contiguous shots, cut on phrase boundaries 0.1–0.2 s early, 17–21 shots per minute, median 2.2–2.5 s,
a quarter of shots under about 1.5 s, an establishing shot per location, a concrete `scene` per shot).
**2.0: every shot names its light and weather in shots.json**: `"look"` (goldenHour, clearDay, dusk, night, overcast, fogMorning, snowDay,
snowDusk, rainNight, rainDay; left out = from the stage's mood) and `"weather"` (rain, storm, snow, leaves, wind, fog). Pick them from the
story's calendar and feeling, keep them the same for every shot of one scene, and change them when the story's day or mood changes: a
video should pass through at least three clearly different skies. The first shot of the video and of each new place uses the camera
`establish` or `craneDown` and holds 3-4.5 s. Locations come from
`story/set_match.json` (the `use` id of each place, or the user's choice). Send a 5–10 line plan summary and continue unless the user objects.

## Stage 5: Style and palette choice
**2.0: `cine` is the channel's style** (film picture: shader sky, sun, contact shadows, haze, god rays, split-tone lens; `pearl` is the
old look, kept for re-rendering old videos). In a one-prompt run skip this stage. When the user asks to compare, build the 1–2 most-used sets plus 3 representative shots (a wide with ≥ 2 characters, a face
close-up with `dof`, an action or night-exterior shot). Then render the choices side by side:
```bash
node render.mjs --project projects/<slug> --styles cine,pearl,cinematic --at <t1>,<t2>,<t3> --scale 0.5
node render.mjs --project projects/<slug> --style cine --palette <candidate> --stills <t1>,<t2>,<t3> --scale 0.5
```
Open `build/styles/style_grid.png`, then show it with one line per option: **cine** (the channel: film picture), **pearl** (soft pastel dusk, lifted shadows,
loud hero), **cinematic** (darker night, thin outline, warm practicals), **soft** (no outline, dreamy glow), plus the rest on request:
**ink** (black stick figures), **toon** (bright cel-shaded), **golden** (sunset), **neon** (magenta and cyan), **noir** (cold thriller).
Palettes: `dusk`, `cozy`, `tropic`, `alert`, `school`, `midnight` (engine-api.md). Save the picks in `config.json` → `style`, `palette`.
Tweaks: add a custom entry to `STYLES` or `PALETTES` in `engine/styles.js` and re-render that row.

## Stage 6: Build every shot
Read `references/engine-api.md` (start with "2.0 film picture") and the example scenes in `examples/v2-demo/scenes/` (2.0: one street in three weathers, the crane opening, the close-up with a blurred background) and `examples/v2-sets/scenes/` (2.0: Main Street and the high school; look and weather taken from shots.json), `examples/speed-demo/scenes/` (a full 32 s video), `examples/catalog/` (1.0.5: every ready-made set built from its catalogue recipe),
`examples/v103-demo/scenes/` (1.0.3 lip-sync on every mouth, listening nods, finger counts / thumbs up / peace, hands resting on desks, planted feet, scarf and wind, the hood, Thanksgiving dinner, pumpkin street, leaf gust, Friday-night football), `examples/thumb-cine/scenes/` (2.1 cinematic thumbnails with engine/thumbcine.js, `--thumbs`), `examples/v102-motion/scenes/` (1.0.2 actions: door, carry, sitOn, runStop, trip, vault, climbOn, hug, high five, arm around, pull-run, catch a fall; gaze, react, busy crowds; longer arms before/after, grips, skirt sway, smart camera; motion QC and GIFs), `examples/v101-school/scenes/` (1.0.1 American high school: library, chem lab, auditorium, Friday-night football, principal, nurse, restroom mirror, band, locker room, student lot, prom, diner, suburb bus stop; fall, snow day, rain on windows, blackout, tornado-drill beacon, graduation caps; student poses and school cameras), `examples/v1-more/scenes/` (1.0 supermarket, hospital, rooftop, train station, snow, puddles, leaves, lightning, headlights, named cameras, lip-sync), `examples/v1-demo/scenes/` (1.0 everyday places: stairwell, classroom, city bus stop, shop street, residential, street food, café; gloss and motion), `examples/look-demo/scenes/` (sets and UI), `examples/diagram-gallery/scenes/` (every diagram, a blurred-scene backdrop) and
`examples/worlds-demo/scenes/` (nature sets, light from props, game HUD and counters, first person, icons, planet) once.
Work in batches of 8–12:
1. Write `scenes/sets/<location>.js` (reusable builders on top of `T.W.*`) and `scenes/shots/NN_<name>.js` with
   `registerShot('<id>', { init, draw, overlay? })` for the ids in shots.json.
2. `node render.mjs --project projects/<slug> --sheet --scale 0.4`. Open every `build/sheets/sheet_XX.png` against the
   QC checklist in `references/render-qc.md`. Fix MISSING shots, errors printed by the renderer, composition, poses.
3. Check motion with `--stills t1,t2,t3` or `--from A --to B --scale 0.5` (writes `build/preview.mp4`, draft encode).

Non-negotiables: **depth in every outdoor frame (2.0)**: something close to the lens (a branch, a fence, a parked car, a lamp), the subject, and far layers behind (use `T.usa.mapleStreet`, `mainStreet`, `highSchool`, or add `T.usa.backdrop(st, { season })` behind an older outdoor set); **the sun in or near the frame for openings** (`sun: [x, y, z]` on the stage) so god rays and long shadows show; wet streets get `T.W.mirror`; never more than one lamp cone between the lens and the subject; a camera move in every shot; expressions on the beat (`expr` keys, so they blend), deadpan as the hero's resting comedy face;
**people act, not tween** (engine-api.md → Acting recipe: `posesAt3`, `idle3`, `speak3` + `face({ speaker, gt })`, `lookAtSpeaker`, `walkTo`);
camera accents on the words that earn them (`crashZoom`, `punch`, `smash` cut, `ramp` slow motion, `rackFocus`); hands and feet in
contact; colours from `st.M`/`S()` and the cast; every number the narrator says on screen (`wordTime()`); **no empty stage: every
explainer has a moving picture from `engine/diagrams2d.js`, and most sit on the blurred scene (`backdrop`), not the bare purple stage**;
text between y = 90 and y = 990 so the bars don't cut it; **at least one bright or outdoor sequence when the story allows** (nature sets);
**glowing props light the faces** (`FX3.fire/blade/torch/glowLight`, dim stage); game-like powers get one HUD layer (`userData.hud`, `counters`); animals are toys (`T.W.cow` …), big crowds are instanced (`stadium`, `formation`), the world reacts on
screens in the world (`newsWall`, `feedDraw`, `scoreboard3d`, `billboard`), and breaks show physics (`slice`, `sparks`, `debris`, `smoke`, `splash`);
**props read as the real thing** (a receipt has printed lines, a torn edge and paper size, never a plain grey slab); **no missing or
sunk limbs** (seated legs visible in front of the seat, not swallowed by it); **hands rest on a table top, never pass through it**;
**every prop the script names is visible** (headphones in a contrasting colour, at least one close-up); `V()` for aspect-dependent values; `draw()` a pure function of `t`; ≤ 5 real lights per
shot; `dof` only on close-ups; no `Math.random`/`Date.now`.

## Stage 7: Sound
Read `references/sound-design.md`. Fill `story/shots.json` → `music` (contiguous mood sections) and per-shot `sfx` cues
and `amb` beds. Mixing happens after the final render, or run `python audio/mix.py --project projects/<slug>` now to
audition `build/mix.wav`.

## Stage 8: Render and deliver
Read `references/render-qc.md`.
1. Preview: `node render.mjs --project projects/<slug> --from 0 --to 40 --scale 0.5`, then `python tools/qc_metrics.py --project
   projects/<slug>`. Send the preview (or contact sheets), the scorecard and the final render-time estimate before the long render.
   This is the last checkpoint before rendering. Check **moving** previews, not only stills, of every dialogue shot (bubbles stay
   put), every seated shot (legs, hands on tables) and every prop insert: jitter and clipping only show in motion.
2. Final: `nohup node render.mjs --project projects/<slug> > build/render.log 2>&1 &` (quality, fps and resolution come
   from config.json). 2.0: the renderer reads the card's free video memory and picks the number of workers and the encoder by itself
   (the film picture needs about 1.4 GB per worker at 1080p); close other GPU programs first and do not pass `--workers` unless it fails. Poll the log (it prints fps and ETA) and report progress at sensible intervals.
3. `python audio/mix.py --project projects/<slug>`: music + SFX, ducking, −14 LUFS, AAC 48 kHz, and the upscale if
   `export.upscale` is set. Writes `out/<title>.mp4`.
4. QC the final file: duration matches, audio present, resolution/fps as chosen, a 1-frame-per-10-s contact sheet looks
   right. The final render (1.0.4) already ran the picture scorecard on video_silent.mp4 (build/qc_scorecard.md, printed at the end of
   the log, also in the lesson book); after the mix run it again on the MP4 for loudness: `python tools/qc_metrics.py --project projects/<slug>`. Deliver the MP4 (send the file), say in plain words where it was saved, and one line on what to tweak next.
5. Lessons (1.0.3): the final render already wrote this video's QC problems into `channel/lessons.json` / `LESSONS.md`. Record
   every piece of feedback the user gave during the reviews, one line each, in their words: `node tools/retro.mjs --project
   projects/<slug> --note "..."` (also right when they give it). Then give a short proposal for the next video from the
   refreshed checklist (`--next`): what to watch for, and any problem the plugin itself should fix (the "Nên sửa" list), plus the sets, graphics and effects the book proposes.
6. Plugin release (1.0.5), once per video: `python tools/set_match.py --pending` lists sets this video added to the studio. If any,
   ask the user once to release them together with any other plugin fixes from this video: commit and push the version branch,
   PR and merge (with their OK), update the installed plugin, then `--released`. Nothing pending: skip.
7. Clean up once the user has the file and has picked a thumbnail (Stage 9): `python tools/tidy_project.py --project projects/<slug>` keeps only `out/` and moves the working
   files to a clearly named folder for the user to delete. It deletes nothing, and never send big files to the Recycle Bin.

## Stage 9: Thumbnails (2.1), always, right after the MP4
Read `references/thumbnails.md` and follow it. Every video ends with thumbnail options: do not ask whether to make them.
1. From the final script pick 3–5 poster moments (the rule visible in one frame), then choose 3 or 4 that differ in place, hour or
   reaction. The hero's face is the face of that moment (smug only when winning). Text per option from the script: none, one label
   or number, or ≤ 3 words; at least one option without text.
2. `node tools/new_thumbs.mjs --project projects/<slug>` → `projects/thumb-<slug>/` with the video's cast. Stage each option in
   `scenes/shots/thumbs.js` with `engine/thumbcine.js` (`frameHead`, `placeAt`, `watch`, `heroLights`, `powerGlow`), on the video's
   own sets (import them by absolute path) and a film look per moment.
3. `node render.mjs --project projects/thumb-<slug> --qc` (0 red), `--thumbs`, then `node tools/thumb_sheet.mjs --project
   projects/thumb-<slug>` (no `✗`). Look at the sheet yourself, also at its 320 px row, and re-stage weak options.
4. Send `build/thumbs/sheet.jpg` with the MP4: one line per option and your pick. When the user chooses, copy that JPG to the
   video's `out/Thumbnail.jpg`. In a staged (not one-prompt) run, the usual preview rule applies: name the moments and ask before rendering.
The render needs the GPU: start it only after the final video render and the mix have finished.

## Defaults and judgement calls
- Unsure about a visual: choose the more literal, more cinematic option (a close-up for emotion, an insert for objects,
  a low wide for drama, a follow cam for action, a diagram for numbers).
- About 17–21 shots per minute, 1–3 time-freezes per video, one establishing shot per location.
- Keep outfits fixed, screen direction consistent within a scene, and the same set build for every shot in a location.
- The subscribe gag runs at about 1:30 by itself (`config.subscribeGag`); pick a moment that isn't a big reveal and move `at` if needed.
- Long videos on a machine without a GPU: render a 720p draft of the whole video first, then the final quality
  overnight, or move the project folder to a desktop with a GPU (the project is self-contained; copy `channel/` too).
