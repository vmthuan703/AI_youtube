---
name: render-3d-video
description: "This skill should be used when the user runs /render-3d-video or asks to \"build the 3D scenes\", \"check the shots\", \"show me a contact sheet\", \"preview the video\", \"render the video\", \"render in 1080p60 / 4K / 9:16\", \"export in high quality\", \"re-render after a fix\", or \"export the final MP4\" for an aiTrends 3D Studio project. It writes or repairs shot code in batches with contact-sheet QC, makes preview clips, sets the export quality, runs the full frame-by-frame render, and muxes the final video with sound.\n"
metadata:
  version: "0.2.0"
  author: aiTrends
---

# /render-3d-video: build, QC, preview, export quality and final render

Work inside `aitrends-3d-studio/` on the active project (ask if several exist). Read `engine-api.md` (core) and `render-qc.md`
(non-negotiables + QC checklist) in `../make-3d-video/references/` before writing or fixing scenes; grep `engine-api/*.md` and
`examples/INDEX.md` for calls instead of reading examples or engine code. Follow "Token budget" in `../make-3d-video/SKILL.md`:
batches in subagents, long runs in the background, every `render.mjs` run ends with one `RESULT` line to read.

## 1. Build or repair shots (batches of 8–12)
- `node render.mjs --project projects/<slug> --sheet --scale 0.4 [--only id,id]` writes `build/sheets/sheet_XX.png` (or
  `sheet_only.png`); its RESULT line lists MISSING shots and errors. Fix rounds: `--sheet --changed` (only the shots edited since).
- Write `scenes/sets/*.js` and `scenes/shots/NN_name.js` (`registerShot(id, { init, draw, overlay })`); look calls up in
  `examples/INDEX.md`. Explainers use `engine/diagrams2d.js`, never just text. New roles: `scenes/roles_new.js`, checked with `--roles`.
- After each batch: `--qc --only <ids>` to 0 red first, then open the batch's sheet **once** against the QC checklist; after a fix,
  open only the `--changed` sheet. Repeat until clean.
- Motion: `--gif` (1.0.2: one small looping GIF per shot in `build/gifs/`, `--gif id,id` for some) — open the GIFs of every
  shot with people moving: stills hide jerks and sliding feet. `--stills t1,t2,t3` or `--from A --to B --scale 0.5` (preview.mp4).
- **Thumbnails (1.0.3)**: a thumbnail project (one shot per layout A–D, overlays with `T.thumb`) renders with `--thumbs` →
  build/thumbs/*.jpg + grid.jpg; follow the AI_youtube prompts/thumbnail_style.md rules.
- **Motion QC (1.0.2)**: `node render.mjs --project projects/<slug> --qc` checks sampled frames for limbs inside props or other
  bodies, hidden faces, the camera inside a wall / car / person or jumping mid-shot, sliding feet and snapping joints
  (`build/qc_motion.json`). Fix every RED before the final render (the full render refuses while any is left, `--force`
  overrides); read the amber ones (hands resting on a desk are fine). An intended case: shots.json `"qcIgnore": ["clip"]`.

## 2. Export quality
Confirm or change `config.json`: `resolution` (720p/1080p/1440p/2160p), `fps` (24/30/60), `quality`
(draft/standard/high/max) and `export.upscale` ("1440p"/"2160p" for YouTube). Recommend 1080p · 60 fps · high, plus
upscale 1440p for YouTube when the machine can afford it. Measure first: `node render.mjs --project projects/<slug>
--bench` prints whether the GPU is used and estimates the full render; quote that (GPU tips in `render-qc.md`).
Switching aspect needs a fresh sheet review (9:16 framing differs).

## 3. Preview checkpoint
`node render.mjs --project projects/<slug> --from 0 --to 40 --scale 0.5`, then `python tools/qc_metrics.py --project projects/<slug>`, and send the preview (or the sheets) and the scorecard with the
final render-time estimate before the long render. Fix anything marked CHECK that the user cares about first. Include the motion QC line (red / amber counts).

## 4. Final render
`node render.mjs --project projects/<slug> > projects/<slug>/build/render.log 2>&1` in the background (Bash background mode);
don't poll: wait for the notification and read the `RESULT` line (`build/last_result.txt`). Fewer workers if memory is tight. Output: `build/video_silent.mp4`; the end of the log lists shot
errors to fix and re-render. When it finishes it records the video's QC problems in the channel lesson book (1.0.3,
`channel/LESSONS.md`); add the user's review feedback with `node tools/retro.mjs --project projects/<slug> --note "..."`.

## 5. Sound, mux and deliver
Make sure the music plan and SFX are set (`/3d-video-sound`), then `python audio/mix.py --project projects/<slug>` →
`out/<title>.mp4` (AAC 48 kHz; upscaled if `export.upscale`). QC with ffprobe (resolution, fps, duration, audio) and a
final contact sheet; the final render already printed the picture scorecard (1.0.4, build/qc_scorecard.md): read every
CHECK line, and after the mix re-run `python tools/qc_metrics.py --project projects/<slug>` for loudness; send the MP4, and say in plain words where it was saved.

## 6. Clean up
Once the user has the file: `python tools/tidy_project.py --project projects/<slug>`. It keeps only `out/` and moves the working files to a clearly named folder for the user to delete. It deletes nothing; never send big files to the Recycle Bin.
