---
name: make-3d-video
description: "This skill should be used when the user wants a narrated 3D animated story video from a SCRIPT in the aiTrends 3D style (toy-like 3D stick characters with big round heads, a loud channel hero in a lime puffer, American sets with real depth, a film picture with sky, sun, weather, haze and god rays, a 2:1 picture, animated explainer diagrams), e.g. \"make a 3D video from this script\", \"turn my script into a 3D animation\", \"tạo video 3D từ kịch bản\", \"làm video what if 3D\", \"animate this story in 3D\", or \"do the whole 3D video\", also from a bare idea in ONE prompt (it writes the script, stops once for the script, then runs to the MP4). It runs the full pipeline: channel settings, script check, emotional voiceover (Chatterbox, with Kokoro as fallback) with word timings, story breakdown, cast and set match (builds what the kit lacks inside the video and proposes it for the plugin afterwards), style and palette choice, 3D scene building, rendering up to 4K/60 fps, music, SFX, scorecard, the final MP4 and cinematic thumbnail options for it.\n"
metadata:
  version: "2.3.0"
  author: aiTrends
---

# aiTrends 3D Studio: script → finished 3D video

Every frame is built by code: a local voiceover (Chatterbox), 3D sets and characters in Three.js rendered frame by frame in
headless Chromium, encoded with ffmpeg. No image or video models, so characters stay consistent. Invent the visuals fresh for
every script; the style and the channel's hero stay fixed. Version history: the plugin's `README.md` ("Mới trong …").

**Resources (this skill's folder).** `kit/` is the studio, installed as `aitrends-3d-studio/` (`references/install.md`);
`kit/channel/` holds the channel's choices (`brand.json`, `cast.js` roster) and is never overwritten by updates. References, read
only when a stage says so: `voiceover.md`, `style-bible.md` (the look), `story-breakdown.md`, `set-match.md` (needs.json schema,
adding a set), `engine-api.md` (core API; `engine-api/stage.md`, `characters.md`, `sets.md` are for grep, not for reading whole),
`sound-design.md`, `render-qc.md`, `thumbnails.md`, `templates.md` (2.3 shot templates) and `cheatsheet-template.md`. In the studio, `examples/INDEX.md` maps every engine call to the example lines
that use it.

Stage commands re-run one stage: `/new-3d-video` (1–4), `/3d-video-styles` (5), `/render-3d-video` (6, 8), `/3d-video-sound` (7),
`/make-thumbnail` (9).

## Golden rules
1. **Keep the script's words.** Never rewrite, add, drop or reorder spoken words; the script check only suggests. Every shot
   illustrates the words spoken while it is on screen.
2. **Same style, new pictures.** Invent sets, props, characters and actions from this script; examples only teach the API.
3. **Show what is said, literally and specifically.** Abstract lines become metaphors, inserts, diagrams or reactions.
4. **The channel's identity is fixed:** the hero from `channel/cast.js`, the voice, the purple stage. Change only on request, in `channel/`.
5. **Draft, look, fix, then render.** Rendering is slow, looking is fast; but look at the *small* thing (see Token budget).
6. **Checkpoints:** the script, the voice preview, the style choice, the video preview with its scorecard, the final file, and the
   promote proposal after the video. If the user is away, take the defaults, say what was assumed, continue. Nothing goes into the
   plugin or the channel roster without the user's yes.
7. **Files are the truth.** Each video lives in `aitrends-3d-studio/projects/<slug>/`; `story/shots.json` owns timing.

## Token budget (2.3): how to run this cheaply
Every turn re-sends the whole conversation, so cost = turns × context. Measured on 2.1/2.2 runs: the main conversation (31%),
hand-written shot batches (27%), a late fix-all-QC pass (24%) and the script gate (13%). Keep turns and context small:
- **Three sessions per video** (see "Sessions and hand-over"): the main conversation never carries a finished phase.
- **The plugin's own agents, not general-purpose** (they load 6–8 tools instead of ~50): `aitrends-3d-studio:script-gate`
  (Stage 0), `aitrends-3d-studio:kit-builder` (Stage 6a, Stage 9), `aitrends-3d-studio:shot-builder` (each Stage 6 batch).
  Their standing rules live in the agent; the brief is only paths, ids and what is special about this run.
- **Templates for routine shots** (`references/templates.md`): only special shots are hand-written.
- **0 red inside every batch**: a batch is not done with a red; there is no fix-everything pass at the end.
- **Long commands run in the background and you wait for the notification.** Voiceover, final render, mix, thumbnails: start them
  with the Bash tool's background mode and do not poll the log. Every `render.mjs` run ends with one line `RESULT ok|fail …`
  (also in `build/last_result.txt`): read that line only. Open more of the log only when it says `fail`.
- **Check fixes on a small sheet.** After the first full sheet, use `--sheet --changed` (only shots whose files changed) or
  `--sheet --only s004,s007`, and `--qc --only …` for motion. Run `--qc` before opening any image; open a sheet once per fix round.
  Never re-open a sheet you already looked at.
- **Delegate the heavy stages to those agents**, one at a time (they share the GPU), each with a short brief (studio path,
  project, plugin references folder `<this skill>/references`, ids, what done means) and a short report back. The main
  conversation keeps the plan, the decisions and the user; it does not read engine code, shot code or sheets the agents opened.
- **Short renders run in the foreground** (sheet, `--qc`, stills: minutes) and you read the RESULT line; no sleep/until loops.
- **Read references by need, not up front:** `engine-api.md` core once; grep `engine-api/*.md` and `examples/INDEX.md` for a call,
  then read only those lines. Don't read example folders or engine source to find an API.
- **One video per session, one phase per session.** Plugin work found along the way goes to its own session (or the promote
  step), not into this one.

## Sessions and hand-over (2.3)
A video runs in three sessions; `projects/<slug>/story/STATE.md` (made by `new_project.py`) carries everything between them.
| Phase | Stages | Ends with |
|---|---|---|
| A | 0–5: script gate, check, cast/set match, voice, timeline, breakdown, style | shots.json + bible.md + STATE.md "next: Stage 6a" |
| B | 6: kit and templates, manual batches, full QC | every shot built, `--qc` 0 red, STATE.md "next: Stage 7" |
| C | 7–9: sound, preview, final render, mix, thumbnails, lessons, promote | the MP4, thumbnails, promote proposal |
- **Write STATE.md as you go**, not only at the end: every decision with its reason, every piece of user feedback in their words
  (also `retro.mjs --note`), open issues, the phase and the next step. Keep it under ~60 lines.
- **At the end of a phase:** update STATE.md, then move on in a fresh session. In the desktop app hand the next phase off to a new
  session (brief: `/make-3d-video tiếp <slug>`); elsewhere tell the user to open a new session and type that. In a one-prompt
  run with nobody to answer, hand off when the app can; if it cannot, continue here.
- **`/make-3d-video tiếp <slug>` (or "continue <slug>")**: read `projects/<slug>/story/STATE.md` and only the stage sections of
  this skill that the next step needs; don't re-read the script, the bible or earlier reports unless STATE.md says to.

## One-prompt run: `/make-3d-video <idea or script>`
Run every stage with the channel defaults (`channel/brand.json`: voice, `cine` style, format, export quality) and stop **once**:
- **The script checkpoint.** From an idea: write the script by the channel rules (`prompts/QUY_TAC_VIET_SCRIPT_KENH.md` in the
  repo when it exists, and `story-breakdown.md` → "Writing a script"), write **three openings** of about 28 words to
  `build_voice/<slug>/hooks.txt` (blocks separated by `---`), rank them with `python tools/retention.py --hooks <file>`, put the best
  one on the script, run `tools/script_check.py` and `python tools/retention.py --script <file> --out build_voice/<slug>/retention.md`,
  fix every FLAT window and LOOK/MISS you can and re-run. Show the title, the three hooks with scores, the retention table, what is
  still open and the script file; ask once: continue or edit. A script the user brought is checked the same way, never rewritten.
- After the yes nothing else stops the run: cast and set match decide by themselves, the voice preview, style grid and video
  preview are checked by you (contact sheets, `--qc` 0 red, the scorecard). Thumbnails are made without asking.
- **Final summary** with the MP4 and the thumbnail sheet: what was assumed, the hook, the weather and look per location, QC
  results, the promote proposal (Stage 8.6), and the one thing most worth changing.

## Stage 0: Script depth gate (default: mức Sâu)
Before any voice is generated. The user can say "mức chuẩn" or "bỏ qua mức" for one video. When the repo has
`prompts/MUC_SAU_VIET_SCRIPT.md`, **run it in one `aitrends-3d-studio:script-gate` agent** (it reads that file and
`QUY_TAC_VIET_SCRIPT_KENH.md` itself, runs every role as an `aitrends-3d-studio:script-reviewer` agent, reuses the past-scripts
index when no script is newer) and get back only the passing script's path, its score table and the open issues:
- The file holds the steps and the gate (logic no P0, facts no false item, template risk ≤ 3, every factor ≥ 7, fantasy ≥ 8,
  total ≥ 8). 3D changes: no "TTS editor" reviewer; the cast rule (hero boy, best friend girl, roster roles). A script the user
  brought is scored, never rewritten. After 3 rounds without a pass, show the best version; differences under ~0.5 are noise.
- Token use per step goes to the work folder's `token_ledger.md` (written once at the end). Then continue with Stage 1 on the
  passing script.

## Stage 1: Intake and script check
- `node tools/retro.mjs --next` and read `channel/LESSONS.md`; tell the user the top 3 items and apply them.
- Read `channel/brand.json` and don't ask what it answers (voice, style, format, export quality). State those in one line with the
  render-time estimate (`render-qc.md` → Speed guide) and ask only what is missing (usually the title).
- `python tools/script_check.py --script <file> --title "<title>" --out build_voice/<slug>/script_check.md` and
  `python tools/retention.py --script <file> --out build_voice/<slug>/retention.md`; show both tables.
- Answer in writing the **Story logic** questions at the end of `script_check.md` (power rule, big numbers, timeline, the climax's
  cause and effect, change of heart, twist set-up, safety, science, cast), quoting the script line for each problem. A MISS on
  **Hero name fits the hero** or **Day count adds up** and any logic problem is shown even if the user is away. The hero is a
  **boy**, the best friend a **girl**.
- Ask whether the user wants to edit before the voice is made; never change the script yourself. The voiceover refuses while the
  check has LOOK/MISS items; after the user says continue, run it with `--accept-script-check`.

## Stage 1b: Cast and set match (2.2), once the script is final
1. In the same read as the Story logic answers, write `projects/<slug>/story/needs.json`: `places`, `props`, `actions`, `fx` and
   **`characters`** (every person the script names or shows: `{name, quote, desc, sex, age}`), schema in `set-match.md`.
2. `python tools/set_match.py --project projects/<slug> --script <file>` and `python tools/cast_match.py --project projects/<slug>`.
   Their printed output is the whole report: don't open the .md files or `engine/catalog.json`. Fix needs.json if a match is
   wrong for the story, and override with `--decide` (`"<name>=use:<id>"`; cast: `"<name>=use:<ROLE>"` or `"=new:<BASE>"`).
3. **No stop.** A missing set, prop or effect is built in this video (`project`); a near one uses the nearest entry; a missing or
   near character becomes a new role in `scenes/roles_new.js`, spread from the suggested roster base (recipe and every outfit key:
   `engine-api/characters.md` → "a new role"). Check new roles with `node render.mjs --project projects/<slug> --roles` (one sheet).
   The user can ask for the old checkpoint (`set_match.py --ask`); then send the report lines and `STILL` files and ask per ❌.
4. `render.mjs` refuses sheets and renders while a shots.json `set` is unknown or a character is outside the roster and
   `roles_new.js` (`--force` overrides).

## Stage 2: Install or check the studio
Follow `install.md`: copy `kit/` to `aitrends-3d-studio/` (skip if present), install dependencies with the Chatterbox environment,
`python tools/verify_kit.py`, `python tools/doctor.py`, the self-test, `node render.mjs --project examples/speed-demo --bench`, then
`node render.mjs --catalog` in the background. Report what was installed, the GPU line and the time estimate in a short list.

## Stage 3: Voiceover + timeline
Follow `voiceover.md`. **Keep the GPU free while Chatterbox runs.** Measure the pace on a full sentence before quoting a time.
1. Preview: `.venvs/chatterbox/Scripts/python tools/tts_chatterbox.py --script <file> --out-dir build_voice/<slug> --voices
   "NARRATOR=am_puck+1.5,JAKE=am_liam+3" --lexicon <file> --preview 6`; send the MP3 and ask if voices and pace are OK.
2. Full voiceover: the same without `--preview`, in the background. Outside 160–175 words/min, re-run with the `--pace` it suggests
   (finished chunks are cached). Check `tts_report.json` and `qc.json`.
3. `python tools/new_project.py --name <slug> --voice build_voice/<slug>/voiceover.mp3 --lines build_voice/<slug>/lines.json
   --script <file> --title "<title>"`.
4. `python tools/parse_script.py --project projects/<slug> --script build_voice/<slug>/words.json`; `timeline/transcript.txt` must
   end near the voiceover length.
5. `python tools/beats.py --project projects/<slug>` → beat sheet + draft `story/shots.json`.
A finished voiceover from the user: the Whisper route in `voiceover.md`.

## Stage 4: Story breakdown
Read `style-bible.md` and `story-breakdown.md`. Write `story/bible.md` (logline, cast with one signature colour and voice each,
locations with mood and light, this video's palette, its one signature device, motifs, music plan) and `scenes/cast.js`: import
the hero and every role from `/channel/cast.js` (`ROLES` maps words to roles; extras are `CLASSMATE_2`/`_3`, `BRO_2`, `RIVAL_2`,
`STUDENTS`) and the new roles from `./roles_new.js`; give every speaking character its `speaker`; at most one colour or the hair
changed on a roster role; then `python tools/cast_check.py --project projects/<slug>`.
Rewrite `story/shots.json`: contiguous shots cut on phrase boundaries 0.1–0.2 s early, 17–21 shots per minute, median 2.2–2.5 s, a
quarter under ~1.5 s, a concrete `scene` per shot, `set` from `story/set_match.json`, and per shot a `"look"` (goldenHour, clearDay,
dusk, night, overcast, fogMorning, snowDay, snowDusk, rainNight, rainDay) and `"weather"` (rain, storm, snow, leaves, wind, fog),
the same within a scene and changing with the story's day and mood: at least three clearly different skies per video. The first
shot of the video and of each new place uses `establish` or `craneDown` and holds 3–4.5 s. Send a 5–10 line plan and continue.

## Stage 5: Style and palette
`cine` is the channel's style (`pearl` only re-renders old videos). Skipped in a one-prompt run. When the user asks to compare,
build the 1–2 main sets and 3 shots (a wide with ≥ 2 characters, a `dof` close-up, an action or night exterior) and run
`node render.mjs --project projects/<slug> --styles cine,pearl,cinematic --at <t1>,<t2>,<t3> --scale 0.5` (and `--style cine
--palette <p> --stills …`). Open `build/styles/style_grid.png` and describe each option in one line; the other styles and the
palettes are listed in `3d-video-styles`. Save the picks in `config.json` → `style`, `palette`.

## Stage 6: Build every shot (phase B: templates first, then special shots in batches)
**6a. Kit and templates: one `aitrends-3d-studio:kit-builder` agent.** Brief: studio and project paths, the plugin references
folder, the sets and roles the set/cast match marked `project`/new, the video's signature device. It builds the project sets and
roles, `scenes/_places.js`, `story/tpl_spec.py` (routine shots as data, special shots listed in MANUAL), runs
`python tools/gen_shots.py --project projects/<slug> --batches`, brings every template shot to `--qc` 0 red, and writes
`story/CHEATSHEET.md` (`references/templates.md`, `references/cheatsheet-template.md`). Expect 45–60% template shots; the hook, the
climax, reveals, hands on props and story effects stay hand-made. Open its sheet once.

**6b. Special shots: one `aitrends-3d-studio:shot-builder` agent per batch** in `story/batches.json`, one at a time. The brief
is only: studio path, project, plugin references folder, batch id (its slice has the shots and the template shots around them),
and anything special the user asked for in those shots. The agent's own rules cover the rest: it reads the cheat sheet, the slice
and its bible rows, loops sheet → `--qc` 0 red → sheet once, stops at 60 tool calls, and lists every `qcIgnore` it added.
- A batch reporting any red, or a `qcIgnore` you don't agree with, goes back to the same agent (SendMessage) with the shot ids,
  not to a new fix-everything agent.
- Read its report, then open its sheet once. Note the batch in STATE.md.

**6c. Close phase B:** `node render.mjs --project projects/<slug> --qc` in the background (the whole video; the RESULT line
names every `qcIgnore`), fix any red through the batch that owns the shot, then STATE.md "next: Stage 7" and hand over.

The shot rules (depth, sun, acting, contact, props, explainers, light limits) are in `render-qc.md` → "Shot non-negotiables";
the templates follow them by construction, and the QC checklist in the same file is what every sheet is judged against.

## Stage 7: Sound
Read `sound-design.md`. Fill `story/shots.json` → `music` (contiguous mood sections), per-shot `sfx` cues and `amb` beds. Mixing
runs after the final render (or `python audio/mix.py --project projects/<slug>` now to audition `build/mix.wav`).

## Stage 8: Render and deliver
Read `render-qc.md`.
1. Preview: `node render.mjs --project projects/<slug> --from 0 --to 40 --scale 0.5`, then `python tools/qc_metrics.py --project
   projects/<slug>`. Send the preview (or sheets), the scorecard and the render-time estimate: the last checkpoint before the long
   render. Check **moving** previews of dialogue shots, seated shots and prop inserts: jitter and clipping only show in motion.
2. Final: `node render.mjs --project projects/<slug> > projects/<slug>/build/render.log 2>&1` **in the background**; wait for the
   notification and read the `RESULT` line. Workers and encoder follow the card's free memory; close other GPU programs, don't
   pass `--workers` unless it fails. The run also writes the scorecard and the lesson book.
3. `python audio/mix.py --project projects/<slug>` (background): music + SFX, ducking, −14 LUFS, AAC 48 kHz, upscale if
   `export.upscale` → `out/<title>.mp4`.
4. QC the file (duration, audio, resolution/fps, a 1-frame-per-10-s sheet), re-run `qc_metrics.py` for loudness, send the MP4, say
   where it was saved and one thing to tweak next.
5. Lessons: record every piece of user feedback in their words, `node tools/retro.mjs --project projects/<slug> --note "..."`
   (also right when they give it), then a short proposal for the next video from `--next`.
6. **Promote proposal (2.2), always:** `python tools/promote.py --project projects/<slug>` lists what this video built for itself
   (new roles, sets, props, effects) with uses, past videos that needed the same, advice and `STILL` files. Send the table and the
   stills, and ask once which go into the plugin. Only after the user's yes: `--accept "<names>"`; roles go in with
   `--apply-role <ID> --to <studio>/channel/cast.js` and again `--to <plugin kit>/channel/cast.js` (with `--words`); sets follow
   `set-match.md` → "Adding a set", then `set_match.py --added`. Then one release: version branch, commit, push, PR and merge with
   the user's OK, update the installed plugin, `promote.py --released` and `set_match.py --released`. Nothing chosen: skip.
7. Clean up once the user has the file and a thumbnail: `python tools/tidy_project.py --project projects/<slug>` (keeps `out/`,
   moves the rest to a folder for the user to delete; deletes nothing).

## Stage 9: Thumbnails, always, right after the MP4 (one `aitrends-3d-studio:kit-builder` agent)
The agent reads `thumbnails.md` and follows it (3 or 4 poster moments that differ in place, hour or reaction; the hero's face
fits the moment; at least one option without text; `--qc` 0 red, `--thumbs`, `thumb_sheet.mjs` with no `✗`) and reports the sheet
path and one line per option.
Send `build/thumbs/sheet.jpg` with the MP4 and your pick; copy the chosen JPG to `out/Thumbnail.jpg`. In a staged run, name the
moments and ask before rendering. Start only after the final render and the mix (GPU).

## Defaults and judgement calls
- Unsure about a visual: the more literal, more cinematic option (close-up for emotion, insert for objects, low wide for drama,
  follow cam for action, diagram for numbers).
- 17–21 shots per minute, 1–3 time-freezes per video, one establishing shot per location; fixed outfits, consistent screen
  direction within a scene, the same set build for every shot in a location.
- The subscribe gag runs at about 1:30 by itself (`config.subscribeGag`); move `at` off a big reveal.
- No GPU and a long video: a 720p draft of the whole video first, the final quality overnight, or move the project (with
  `channel/`) to a machine with a GPU.
