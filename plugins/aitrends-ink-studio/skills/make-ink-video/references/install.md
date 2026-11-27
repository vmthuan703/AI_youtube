# Installing the Ink Pastel studio (once per machine or workspace)

The studio is a Node + Python toolkit inside this plugin, in the `kit/` folder of the `make-ink-video` skill. Copy it
into a writable workspace folder: the plugin folder may be read-only and the studio needs `node_modules`, projects and
renders next to it.

## 1. Locate the kit
- `kit/` sits in the `make-ink-video` skill's base directory.
- If unclear: `find / -path "*make-ink-video/kit/render.mjs" 2>/dev/null | head -1` (Linux/macOS) or
  `Get-ChildItem -Recurse -Filter render.mjs -Path $HOME\.claude | Where-Object FullName -match 'make-ink-video' | Select-Object -First 1` (PowerShell).

## 2. Choose the workspace and copy
- Use the user's project folder (or the current working directory). Create `aitrends-ink-studio/` there.
- If `aitrends-ink-studio/render.mjs` already exists, it's installed: skip to step 4 and never overwrite `projects/`.
- Copy: `cp -r "<kit>/." aitrends-ink-studio/` (bash) or `Copy-Item -Recurse "<kit>\*" aitrends-ink-studio\` (PowerShell).
- Run `python tools/verify_kit.py` inside `aitrends-ink-studio/`; every file must verify. Re-copy any listed file.

## 3. Install dependencies
Tell the user, in one short list, what is installed and why: ffmpeg (video/audio encoding), Node.js packages (renderer,
Three.js, fonts), a headless Chromium (draws the frames), numpy + scipy (music and SFX synthesis), kokoro-onnx +
soundfile + the Kokoro-82M model (~350 MB, Apache-2.0: the reference voices and the fallback voiceover), Chatterbox in its own
Python 3.11 environment (~6 GB with PyTorch and models, MIT: the emotional voiceover).

| Need | Windows | macOS | Linux |
|---|---|---|---|
| ffmpeg + ffprobe | `winget install --id Gyan.FFmpeg -e` (new terminal after) | `brew install ffmpeg` | `sudo apt-get install -y ffmpeg` |
| Node.js ≥ 18 | `winget install OpenJS.NodeJS.LTS` | `brew install node` | nodesource or distro package |
| Python ≥ 3.9 | python.org installer | `brew install python` | distro package |
| JS packages | `npm install` (inside aitrends-ink-studio) | same | same |
| Headless Chromium | `npx playwright install chromium` | same | same (`npx playwright install-deps chromium` if libraries are missing). Cloud images with `/opt/pw-browsers` need nothing: render.mjs finds it |
| Python packages | `python -m pip install numpy scipy kokoro-onnx soundfile` | same | add `--break-system-packages` on managed Pythons |
| Voice model | `python tools/tts.py --download` (GitHub Releases, ~350 MB into `~/.cache/kokoro`; `KOKORO_MODEL_DIR` overrides) | same | same |
| Chatterbox (GPU recommended) | `py -3.11 -m venv .venvs\chatterbox`, then `.venvs\chatterbox\Scripts\python -m pip install torch==2.6.0 --index-url https://download.pytorch.org/whl/cu124` and `.venvs\chatterbox\Scripts\python -m pip install chatterbox-tts==0.1.7 faster-whisper librosa soundfile pyloudnorm` | same with `.venvs/chatterbox/bin/python`, CPU build of torch | same as macOS, CUDA build on NVIDIA. Models download to `.cache/hf` on first use |
| Only if the user brings a voiceover without a script | `python -m pip install faster-whisper` | same | same |

`python tools/doctor.py --install` runs the npm and pip fixes automatically. If the model download fails in a cloud
session, github.com release assets are blocked by the network policy: say which host to allow; don't substitute another
source silently.

## 4. Check and self-test
1. `python tools/doctor.py` until every required line is OK (use `python3` or `py -3` where needed). It also reports
   whether a GPU is available: without one, 3D frames render on the CPU (see render-qc.md for timing).
2. Self-test: `node render.mjs --project examples/ink-demo --sheet --scale 0.5`. It writes
   `examples/ink-demo/build/sheets/sheet_01.png`: six Ink Pastel frames (ruined street with pills, a HUD close-up, a beam into
   the walls, an explosion with scars, a shelter, a sepia card), every object outlined in ink. Open the PNG to confirm, then
   `node render.mjs --project examples/ink-demo --qc` (0 red) and `python tools/rules_check.py --project examples/ink-demo`
   (0 missing). Move `examples/ink-demo/build/` to the clean-up folder afterwards.
3. Sharing with 3D Studio on one machine: `node_modules`, `.cache` (voice models) and `.venvs` can be directory junctions to an
   existing `aitrends-3d-studio/` (`mklink /J node_modules <3d>/node_modules` on Windows, `ln -s` elsewhere): saves ~7 GB.
4. Updating an existing studio from a newer kit: `python tools/sync_kit.py --to <studio>` (run from the new kit) copies the
   code and runs verify_kit; it never touches `channel/` or `projects/`.

## Notes
- No GPU (Linux servers, cloud sessions): Chromium uses SwiftShader (`--gl swiftshader`, the Linux default). It works,
  but 3D is CPU-heavy. On Windows/macOS desktops the GPU is used (`--gl auto`); with an NVIDIA GPU on Linux pass `--gl gpu`.
  `npx playwright install chromium` installs the full Chromium used for GPU rendering. After installing, run
  `node render.mjs --project examples/ink-demo --bench`: the first line names the GPU (or warns that it isn't used),
  the last line estimates the render time on this machine. `python tools/doctor.py` also lists the NVIDIA GPU and NVENC.
- Disk: ~600 MB for node_modules + Chromium, ~350 MB for the voice model, plus renders (10 min at 1080p60 high ≈ 0.6–1.2 GB).
- Updating: copy the new `kit/` over the install **except `channel/`** (if `channel/brand.json` exists, keep the user's folder and only add missing files); it never touches `projects/`.
  `refs/`, `.venvs/` and `.cache/` also stay. Custom styles in `engine/styles.js` need re-adding.
