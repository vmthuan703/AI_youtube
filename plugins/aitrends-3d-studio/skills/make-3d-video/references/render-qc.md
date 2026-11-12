# Rendering, quality, QC and troubleshooting

## Quality presets (config.json `quality`, or `--quality` on the command line)
| preset | anti-aliasing | capture | x264 | use |
|---|---|---|---|---|
| `draft` | none | JPEG | CRF 23, veryfast | quick full-length checks |
| `standard` | FXAA | JPEG | CRF 18, medium | good uploads when time is short |
| `high` (default) | 4× MSAA | JPEG q96 | CRF 14, slow, `-tune animation` | the final video |
| `max` | 4× MSAA + 1.5× supersampling | PNG | CRF 10, slower | sharpest edges and text; ~2.5× slower than high |

Every final encode is H.264 High, yuv420p, BT.709, GOP = fps/2, B-frames 2, with AAC-LC 48 kHz at 384 kb/s
(high/max): YouTube's recommended upload settings.
- **Frame rate:** `fps` 24 | 30 | 60 in config.json. 60 fps is the smooth "1080p60" look; it renders twice as many frames.
- **Resolution:** 720p | 1080p | 1440p | 2160p. Render cost scales with the pixel count (1440p ≈ 1.8×, 4K ≈ 4× 1080p).
- **YouTube trick:** `export.upscale: "1440p"` (or `python audio/mix.py --project P --upscale 1440p`) re-encodes the
  final 1080p render to 1440p with lanczos. YouTube then serves its high-bitrate VP9/AV1 versions, which look clearly
  sharper even to 1080p viewers, for a fraction of the cost of rendering at 1440p. "1080p Premium" on YouTube is a
  YouTube-side encode for Premium members; uploaders can't choose it, but a high-bitrate 1080p60 or 1440p upload is the
  best source for it.

## Using a GPU (strongly recommended for 1080p60)
- **Windows / macOS:** nothing to set. `render.mjs` launches the full Chromium in GPU mode (`--gl auto`, ANGLE Direct3D 11
  on Windows, Metal on macOS) and prints the WebGL renderer at start, e.g. `WebGL: ANGLE (NVIDIA, NVIDIA GeForce GTX
  1660 SUPER Direct3D11 …) (GPU)`. If it says SwiftShader, the GPU isn't used: update the NVIDIA driver, run
  `npx playwright install chromium`, or try `--angle gl` / `--chrome "C:\Program Files\Google\Chrome\Application\chrome.exe"`.
- **Linux with an NVIDIA GPU:** add `--gl gpu` (optionally `--angle vulkan`).
- **NVENC:** with the GPU in use and an ffmpeg build that has `h264_nvenc` (the gyan.dev Windows builds do), parts are
  encoded on the GPU's hardware encoder (`encoder: auto`), which frees the CPU for capture. Force with
  `--encoder nvenc|x264` or config.json `"encoder"`. NVENC p7/hq at CQ 18 is visually transparent for animation; x264
  slow CRF 14 is a little more efficient per bit. `audio/mix.py --upscale` uses NVENC too when available.
- **Workers:** default half the CPU threads (max 8), capped for video memory on a GPU: 5 at 1440p, 3 at 4K (6 GB cards).
  More workers help until the CPU (capture + colour grade) or the GPU is saturated; try `--workers 4/6/8` with `--bench`.
- **Measure:** `node render.mjs --project examples/speed-demo --bench` (or your project) times one worker on frames
  across the video and estimates the full render on this machine. Run it once on each machine and quote it.

## Render
**Preview first, then the scorecard.** `node render.mjs --project projects/<slug> --from 0 --to 20 --scale 0.5` writes `build/preview.mp4`
(draft encode, JPEG). Add `--fps 30` to preview a 60 fps project at half the frames. Then `python tools/qc_metrics.py --project projects/<slug>` prints brightness, near-black share, saturation, frames too dark to read, bars, cut pace, words per minute and loudness against the reference ranges, and writes `build/qc_scorecard.md`. Send it with the preview.

**Final:**
```bash
nohup node render.mjs --project projects/<slug> > projects/<slug>/build/render.log 2>&1 &
python audio/mix.py --project projects/<slug>        # music + SFX, mix, mux (+ upscale if set) -> out/<title>.mp4
```
- Workers default to half the CPU threads (max 8). Each worker is a separate Chromium (≈ 1–1.5 GB RAM at 1080p). Never
  run two renders of the same project at once: they share `build/parts/`.
- GPU: Windows/macOS desktops use it automatically (`--gl auto`); Linux with an NVIDIA GPU: `--gl gpu`. Without a GPU
  (servers, cloud sessions) frames render on the CPU through SwiftShader (`--gl swiftshader`, the Linux default).
- Partial re-render after a fix: re-run the whole video (simple and safe), or render the changed range with
  `--from A --to B --out build/fix.mp4` (relative to the project) and splice it in with ffmpeg if you're comfortable.

## Speed guide (measure, then tell the user)
Frames = seconds × fps. Measured on a 4-thread cloud CPU **without a GPU**, quality `high`, typical street/room shots:
- 1080p: ≈ 0.55–0.6 frames/s → 1 minute of video ≈ 50–60 min at 30 fps, ≈ 100–120 min at 60 fps (the 32.5 s
  speed-demo at 1080p60 high, 3 workers, with motion blur on 3 shots: 61 min).
- 720p: ≈ 1.4 frames/s. Preview at `--scale 0.5 --fps 30`: ≈ 3–4 frames/s.
- Extra cost per shot: `dof` +40%, `mblur: 2` ×2, `mblur: 3` ×3, quality `max` ×2.5.
With a desktop GPU the 3D part takes milliseconds and capture (≈ 70 ms) + colour grade (≈ 20–40 ms) per frame dominate:
expect very roughly 5–10 frames/s per worker at 1080p, i.e. 15–40 frames/s with several workers on a 6–8-core PC (a
10-minute 1080p60 video in roughly 20–40 minutes). These GPU figures are estimates, not measurements: run `--bench`. Always state the estimate before a long render, and
offer: a 720p30 draft now, the final overnight or on a GPU machine (copy the project folder; it's self-contained).

The render log prints frames, fps, elapsed time and ETA every 48 frames; report progress at sensible intervals.

## QC checklist (run on every contact sheet)
- [ ] No `MISSING SHOT` or red `ERROR` frames, and the console printed no shot errors.
- [ ] Each picture matches its `line`, and the key action lands on the key word.
- [ ] Characters readable: faces visible when they matter (not backs), heads separated from the background by light or
      rim, nobody cut awkwardly by the frame edge, nobody hidden behind props.
- [ ] Contact: feet on the floor, hands on what they hold, sitting on seats, props not sinking into tables.
- [ ] **No hand or arm passes through a table, desk or counter.** Hands rest on the top (table top at `h` + 0.025), so lower the shoulder or raise the pose. Check every seated table shot in motion. (Memory 100x v2, 3:23: hand through the diner table.)
- [ ] **No missing limbs.** Seated characters show their legs in front of the seat; nothing is cut off by the seat, the floor or another mesh. (v2, 0:54: the hero lost his legs on the bus seat.)
- [ ] **Props read as the real thing at a glance.** A receipt has printed lines, a total, a torn or zigzag edge and paper proportions, and it is held in the hand, not a plain grey slab standing upright. Give every named prop one detail that says what it is. (v2, 0:02.)
- [ ] **Every prop the narration names is visible.** Small ones (headphones, earbuds, a ring, a key) get a colour that contrasts with hair and skin, a slightly larger scale, and at least one close-up or insert. (v2, 3:59: headphones could not be seen.)
- [ ] **Speech bubbles hold still** for the whole line: the box is anchored once per line (engine/player.js) and only the tail moves. If one still jumps, set `shot.bubble = {x, y}` by hand. (v2, 1:12.)
- [ ] **Cast matches the script**: the hero is a boy and the best friend is a girl, and names and pronouns match the models.
- [ ] Outfits and screen direction consistent within a scene; same set geometry in every shot of a location.
- [ ] Light: 1–3 bright accents, faces not too dark, nothing blown out (bloom only on lamps/screens/neon), almost no pure black inside the picture. The hero's outfit reads as loud in every shot.
- [ ] Explainers: a moving picture in every one, none is just text on an empty stage, and some sit on the blurred scene.
- [ ] Bars: nothing important under them; text between y = 90 and y = 990. Speech bubbles sit near the right head and cover no face.
- [ ] Size variety: giant foreground heads, macro inserts, wides, no run of same-sized faces.
- [ ] Every shot has camera motion and some atmosphere (dust, bokeh, rain, glows).
- [ ] **Motion reads as acting** (check in a moving preview): pose changes anticipate and settle (`posesAt3`), nobody stands frozen (`idle3`),
      speakers nod on their words (`speak3`) and listeners turn toward them with their face still to camera (`lookAtSpeaker`), walks start and stop
      without sliding feet (`walkTo`), expressions blend (`expr` keys). Camera accents (crash zoom, punch, smash, ramp) land on the word, one per shot at most.
- [ ] Scorecard rows "almost nothing in them" and "nothing moves" are in range; open the listed near-empty times and fill those frames.
- [ ] Text short, inside the safe area, legible at phone size; numbers match the narration.
- [ ] Variety: no more than 3 consecutive shots of the same type or framing.
- [ ] 9:16: subjects in the middle, nothing important under the captions.
- [ ] Audio: voice clear, music ducked, no SFX pile-ups, final loudness about −14 LUFS.

Final file QC: `python tools/qc_metrics.py --project projects/<slug>`, `ffprobe -v error -show_entries stream=width,height,r_frame_rate,codec_name -of csv out/<file>.mp4`
(resolution and fps as chosen, audio present), duration ≈ `story/shots.json` duration, and a contact sheet:
`ffmpeg -i out/<file>.mp4 -vf fps=1/5,scale=384:-1,tile=6x4 -frames:v 1 build/final_sheet.png`.

## Clean-up after delivery
`python tools/tidy_project.py --project projects/<slug>` keeps `out/` and moves everything else, plus `build_voice/<slug>`, to `<studio>/_xoa_duoc/<slug>-<date>/` for the user to check and delete. It deletes nothing and does not use the Recycle Bin. `--dry-run` lists what would move.

## Troubleshooting
- **A prop is missing** → it may be inside another object (a phone sunk into a table top). Raise it a few millimetres,
  or render a still with the camera pulled back. Props stand on y = 0; table tops are at `h` + 0.025.
- **A hand goes through the table** → the arm pose reaches below the table top. Use a pose whose hands end at the top height, move the
  character back from the table, or lift the hands onto an object on the table. Render `--from A --to B` to check it in motion.
- **Legs vanish on a seat** → the seat mesh or its back is in front of the legs, or the sit pose puts them inside the cushion. Move the seat
  back, lower the seat height to match the pose, or frame the shot so the knees are visible.
- **Speech bubble jumps** → it was placed by hand from a moving value. Give `shot.bubble` fixed `x, y` (the tail still follows the head).
- **Something that should move is frozen** → it was merged as static. Return it from `init` or set
  `obj.userData.dynamic = true`.
- **Workers render different things / jumps at worker boundaries** → `draw()` used state from previous frames. Make it a
  pure function of `t`.
- **Black or very dark 3D** → too few lights: raise `ambient`/`keyIntensity`, add a `T.lamp`, check the mood. Faces dark
  → move the key (`keyPos`) toward the camera side.
- **Metal looks black** → shiny materials need `metal > 0.3` or `rough < 0.3` to get reflections (automatic).
- **`Player failed to boot`** → read the message: usually a JSON syntax error in shots.json/config.json or an import
  path in a scene file. Import errors are listed at the end of a render.
- **Out of memory** → `--workers 1` or `2`, avoid `max` quality at 4K.
- **Chromium not found** → `npx playwright install chromium`, or point `CHROME_PATH` / `--chrome` at an installed Chrome.
- **TTS model download fails** → github.com release assets blocked (cloud network policy); allow the host or copy the
  model folder and set `KOKORO_MODEL_DIR`.
- **The video is longer/shorter than the audio** → `story.duration` must equal the last shot's `end`.
- **Windows paths** → quote paths with spaces; use `python` (or `py -3`) instead of `python3`.

## Variety (0.2.7)
- The scorecard counts **bright frames** (median brightness above 0.40; the references have 13–65%) and **distinct locations** (the `set` of each shot in shots.json).
  Too few bright frames: add a daylight or outdoor sequence (nature sets, moods `beach`, `snow`, `day`). Fill `set` on every shot so the count is right.
- Animals, screens and crowds read at phone size: a news headline at least 1/12 of the TV height, HUD text never under the floor, crowds not a grey blur (raise `cheer` or light them).


## Gloss (1.0)
The scorecard row `gloss` is the share of pixels that are small near-white highlights (glossy skin, hair, wet floors), lit windows and skies excluded.
0.2.x videos measured ~0.005, the 1.0 demo ~0.015; under 0.008 reads flat: keep the 1.0 defaults (style gloss/env), add a mirror floor or wet street, a light shaft, a practical near the faces.


## Motion QC (1.0.2)
`node render.mjs --project P --qc [--every 0.5]` probes frames (and the frames either side) of every 3D shot and writes
`build/qc_motion.json`: **clip** (a hand / elbow / knee / foot / head / chest inside a prop or another body), **occluded** (the
subject's face — `YOU` unless shots.json `qcSubject` says otherwise — more than half hidden), **camera** (lens inside a wall, a car,
a locker or a person, or jumping mid-shot), **slide** (a planted foot skating), **jerk** (a joint snapping in one frame, a sudden
change of speed). RED blocks the final render (`--force` to override), amber is a warning: hands resting on a desk and feet at the
start of a walk show up amber and are usually fine. Silence an intended case per shot with `"qcIgnore": ["clip"]`.
Watch the motion itself with `--gif` (build/gifs/<shot>.gif, 10 fps): stills cannot show a jerk.

## 1.0.3 additions
- Clipping: a hand / elbow / knee / foot that only touches a surface (less than 4 cm in) is contact, not a clip. Hands now rest on
  furniture tops by themselves, so desk scenes stop showing amber clips.
- `--thumbs`: one 1280×720 JPG per shot (+ grid.jpg) for thumbnail projects; check at 320 px that the hero's face and the labels read.
