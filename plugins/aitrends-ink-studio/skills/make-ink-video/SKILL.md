---
name: make-ink-video
description: "This skill should be used when the user wants a narrated What If video from a SCRIPT in the Ink Pastel style (sphere-headed characters with flat decal faces and thick brows, a dark ink line round every object, soft pastel colours with lavender shadows, a HUD pill over people's heads, sepia flashback cards, fast cuts at 25 per minute that land mid-sentence), e.g. \"make an ink pastel video\", \"làm video ink pastel\", \"dựng video kiểu Ink Pastel từ kịch bản này\", \"turn my script into an Ink Pastel What If video\", or \"/make-ink-video <script>\". It runs three phases: A (script check, translation, voice, shot plan, rulebook), B (cast, sets, shots, motion QC, rule check), C (sound, preview, director's notes, 4K/60 render, mix). Outputs a 4K/60 MP4 at -14 LUFS; no thumbnails, no delivered voice file.\n"
metadata:
  version: "0.1.0"
  author: aiTrends
---

# aiTrends Ink Pastel Studio: script → finished Ink Pastel video

Every frame is built by code (Three.js in headless Chromium, ffmpeg), with an engine copied from aiTrends 3D Studio 2.3.0 and the
Ink Pastel look added: style `inkpastel`, an ink-line pass on every object, thick brows, four looks (`inkDay`, `inkRuin`,
`inkDark`, `inkWarm`), rulebook helpers (`T.CQ`) and the `engine/ink/` library. The two engines are **independent** from here on:
a fix in one does not reach the other. Pilot: Trunks EP01 (228 shots, 9:06), built through phase B.

**Status 0.1.0:** phases A and B are proven on the pilot (voice 186 wpm, 228 shots at 25.0 cuts/min, QC 0 red, rule check
0 missing). **Phase C has not been run on a full video yet** (sound, director's-notes pass, 4K render, mix): follow it, measure
render time and tokens, and write what you learn into STATE.md for 0.2.0.

**Resources (this skill's folder).** `kit/` is the studio, installed as `aitrends-ink-studio/` (`references/install.md`).
`kit/channel/` holds the channel's choices (hero, narrator) and is never overwritten by updates. References, read only when a
step says so: `ink-style.md` (the look and the edit, measured on the reference channel), `shot-plan.md` (plan file → shots.json,
`auto()` shots, sets, HUD), `rules-and-notes.md` (rulebook + director's notes page), `voiceover.md`, `engine-api.md` (core API;
`engine-api/*.md` for grep), `render-qc.md`, `sound-design.md`. The working example is `kit/examples/ink-demo` (six shots: auto
shots, beam sweep, impact + scars, HUD countdown, sepia card).

## Golden rules
1. **Keep the script's words** once the user has approved them. Translation (VI → EN) is yours to draft and theirs to approve.
2. **The look is fixed** (`ink-style.md`): ink line on everything, pastel, lavender shadows, sphere heads, decal faces. Invent the
   sets, props and roles fresh for every script; the channel hero (lime puffer, `channel/cast.js` HERO, scale 0.9) plays "you".
3. **Every episode has one HUD rule** (what number floats over heads and when it changes), written in STATE.md before the plan.
4. **Read the rulebook before production** (`rules/RULES.md` via `rules_check.py --plan`), and nothing renders with a rule missing.
5. **Same size:** the hero stands as tall as the other adults (R03); kids ~0.74.
6. **Checkpoints:** the English script, the voice preview, 3 stills after the first set, the 1080p preview with the notes page, the
   final file. If the user is away, take the defaults, say what was assumed, continue. Nothing goes into the plugin, the rulebook or
   the channel without the user's yes.
7. **Files are the truth.** Each video lives in `aitrends-ink-studio/projects/<slug>/`; `story/shots.json` owns timing,
   `story/STATE.md` carries decisions between sessions, `story/notes.json` carries the director's notes.
8. **Outputs:** the MP4 (4K/60, −14 LUFS), the final EN script, notes.json, STATE.md, proposals for new roles or rules, a token
   table. **No thumbnails, no voice file handed over** (the voice is an intermediate file in `build/`).

## Token budget: how to run this cheaply
- **One phase per session** (A, B, C). End each with STATE.md (≤ 60 lines: decisions in the user's words, files, the next step);
  the next session starts with `/make-ink-video tiếp <slug>`, reads STATE.md and only the step sections it needs.
- **Most shots are one `auto()` line** (place + blocking + framing + pills, `shot-plan.md`). Hand-write only the hook, the rule
  reveal, hits (R01), the climax and the ending. Pilot: 228 shots in ~1 400 lines of scene code.
- **0 red inside every batch** (`--qc --only …`), no fix-everything pass at the end.
- **Long commands in the background** (voice, final render, mix); read only the `RESULT` line (`build/last_result.txt`).
- **Look at small things:** `--sheet --only s045,s046` or `--sheet --changed`; never re-open a sheet you already looked at.
- **Read references by need:** grep `engine-api/*.md` and `examples/INDEX.md` for a call; don't read engine source.

## Phase A: script → voice → shot plan (one session)
1. **Intake.** Read the script. If it is Vietnamese, translate to English for the narrator (second person, present tense, short
   sentences, concrete numbers) and send it for approval. Check against `ink-style.md` → Narration: cold open → the rule shown by
   the HUD by ~5 s → a mystery → three promises → "But right now…"; one real science fact mid-video; end on an open question.
   Suggest lines; never add them without the user's yes. Write the HUD rule into STATE.md.
2. **Install or check the studio** (`install.md`).
3. **Voice** (`voiceover.md`; keep the GPU free). Narrator from `channel/brand.json` (am_fenrir, exaggeration 0.7). Every speaker
   must be in `--voices`, even for a preview. Add a lexicon for names (`Name=Phonetic`, keep it short; test the names in the
   preview). Preview → user OK → full run in the background. **Target 180–190 wpm** (pace ~1.13 for am_fenrir); outside it re-run
   with the suggested `--pace` (chunks are cached; `--seed` is part of the cache key: changing it regenerates everything, so redo
   one bad line with `--redo "<phrase from that line>" --tries 6` instead). Lines below the ASR match are listed in the report: listen, fix the lexicon,
   redo those chunks only.
4. **Project.** `python tools/new_project.py --name <slug> --voice build_voice/<slug>/voiceover.mp3 --lines build_voice/<slug>/lines.json
   --script <file> --title "<title>"`, then set `config.json`: `"style": "inkpastel"`, `"resolution": "2160p"`, `"fps": 60`,
   `"speechBubbles": false`. If the first word starts under ~0.9 s: `python tools/lead_silence.py --project projects/<slug> --sec 0.9`.
5. **Shot plan** (`shot-plan.md`): write `scripts/<slug>_plan.txt` (one line per picture change: `para|anchor|SET|cam|scene`), then
   `python tools/plan_to_shots.py --project projects/<slug> --plan scripts/<slug>_plan.txt --cpm 25`. Target 25 cuts/min; cuts land
   on the anchor word, mid-sentence where the picture changes.
6. **Read the rulebook:** `python tools/rules_check.py --project projects/<slug> --plan` tags each shot with its rule ids and prints
   only the rules this episode needs. Open "luật chung" notes from earlier episodes: ask whether they become rules.
7. STATE.md: decisions, files, cast list, set list with shot counts, next step "Phase B". Hand off.

## Phase B: cast, sets, shots (one session)
1. **Cast** in `projects/<slug>/scenes/cast.js`: every role is a roster base from `/channel/cast.js` with the script's name and
   changes (hair, colours, head, patch). Roles the roster lacks go in from the closest base; after the video, ask whether to keep
   them. Check sizes against the hero (R03).
2. **Sets:** use `engine/ink/sets.js` (ruined street, shelter, sewer, fairground, control room, shelter door at night, sky) or build
   the episode's own in `scenes/_places.js` (same shape: add to the stage, return spots + `update(t)`), registered in `PLACES`.
3. **Checkpoint:** after the first set, render 3 stills (`--sheet --only …`), run `--qc` on them (0 red), send, and wait for the OK
   before the rest. This is the only style check: the style is tuned inside the episode.
4. **Shots in batches by set:** blockings (`BLOCK.<name>`) + one `auto()` per shot; special shots by hand with the `T.CQ` helpers
   for R01/R02 and `engine/ink/hud.js` for pills. 2D shots (black stage, sepia cards, science cards) are `overlay` drawings.
   Each batch: `node render.mjs --project projects/<slug> --qc --only <ids>` → 0 red (amber: look, fix the real ones, mark intended
   cases with `qcIgnore`), then one sheet of the batch.
5. **Gate:** `node render.mjs --project projects/<slug> --qc` 0 red on all shots and `python tools/rules_check.py --project
   projects/<slug>` 0 missing. STATE.md "Phase C", list known look issues for the preview. Hand off.

## Phase C: sound, preview, notes, final (one session) — not yet run end to end (0.1.0)
1. **Sound** (`sound-design.md`): music sections and SFX in shots.json: hits, whooshes on whips, HUD pings on number changes. Target
   −14 LUFS with a low range (~3 LU) as the reference channel.
2. **Preview** at 1080p: `node render.mjs --project projects/<slug> --scale 0.5` (background), `python audio/mix.py --project
   projects/<slug>`. Ask before sending a preview; files over 30 MB can't reach a phone over Remote Control, so say where it is.
3. **Director's notes:** `node tools/review.mjs --project projects/<slug>` (port 5178) opens the review page: N pauses and writes a
   note at the current second, tied to the shot; scope "this shot" or "general rule". Fix by shot id, re-render only changed shots,
   mark notes done with how they were fixed. A "general rule" note becomes a rulebook entry (`rules-and-notes.md`) only with the
   user's yes.
4. **Final:** `node render.mjs --project projects/<slug> > projects/<slug>/build/render.log 2>&1` in the background (4K/60 from
   config), then `python audio/mix.py --project projects/<slug>`. QC the file (duration, loudness, 2160p60, a 1-frame-per-10-s sheet).
5. **Report:** where the MP4 is, render time, a token table for the three sessions, open notes, proposed roles/rules. Clean up with
   `python tools/tidy_project.py --project projects/<slug>` only after the user has the file (it moves, never deletes).

## Defaults and judgement calls
- Narrator am_fenrir 0.7; other speakers from the roster voices (`voiceover.md`), chosen by what the script says about them.
- Looks by set: outdoors `inkRuin` (storm, dusk) or `inkDay`; indoor warm `inkWarm`; night and underground `inkDark`.
- Camera: wide and low angles, slow push-ins (3–8%), no handheld; DOF on close-ups; motion blur only on reveals.
- Acting: few, clear changes (brows + one gesture); people do not lip-sync the narrator (R05); poses change by cutting.
- The user is often on Remote Control: keep messages short, send stills (small), not videos over 30 MB.
