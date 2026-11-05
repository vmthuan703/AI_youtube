# Installing the 3D studio (once per machine or workspace)

The studio is a Node + Python toolkit inside this plugin, in the `kit/` folder of the `make-3d-video` skill. Copy it
into a writable workspace folder: the plugin folder may be read-only and the studio needs `node_modules`, projects and
renders next to it.

## 1. Locate the kit
- `kit/` sits in the `make-3d-video` skill's base directory. Stage commands (`new-3d-video`, `3d-video-styles`,
  `render-3d-video`, `3d-video-sound`) reach it at `../make-3d-video/kit/` from their own base directory.
- If unclear: `find / -path "*make-3d-video/kit/render.mjs" 2>/dev/null | head -1` (Linux/macOS) or
  `Get-ChildItem -Recurse -Filter render.mjs -Path $HOME\.claude | Where-Object FullName -match 'make-3d-video' | Select-Object -First 1` (PowerShell).

## 2. Choose the workspace and copy
- Use the user's project folder (or the current working directory). Create `aitrends-3d-studio/` there.
- If `aitrends-3d-studio/render.mjs` already exists, it's installed: skip to step 4 and never overwrite `projects/`.
- Copy: `cp -r "<kit>/." aitrends-3d-studio/` (bash) or `Copy-Item -Recurse "<kit>\*" aitrends-3d-studio\` (PowerShell).
- Run `python tools/verify_kit.py` inside `aitrends-3d-studio/`; every file must verify. Re-copy any listed file.

## 3. Install dependencies
Tell the user, in one short list, what is installed and why: ffmpeg (video/audio encoding), Node.js packages (renderer,
Three.js, fonts), a headless Chromium (draws the frames), numpy + scipy (music and SFX synthesis), kokoro-onnx +
soundfile + the Kokoro-82M model (~350 MB, Apache-2.0: the voiceover).

| Need | Windows | macOS | Linux |
|---|---|---|---|
| ffmpeg + ffprobe | `winget install --id Gyan.FFmpeg -e` (new terminal after) | `brew install ffmpeg` | `sudo apt-get install -y ffmpeg` |
| Node.js ≥ 18 | `winget install OpenJS.NodeJS.LTS` | `brew install node` | nodesource or distro package |
| Python ≥ 3.9 | python.org installer | `brew install python` | distro package |
| JS packages | `npm install` (inside aitrends-3d-studio) | same | same |
| Headless Chromium | `npx playwright install chromium` | same | same (`npx playwright install-deps chromium` if libraries are missing). Cloud images with `/opt/pw-browsers` need nothing: render.mjs finds it |
| Python packages | `python -m pip install numpy scipy kokoro-onnx soundfile` | same | add `--break-system-packages` on managed Pythons |
| Voice model | `python tools/tts.py --download` (GitHub Releases, ~350 MB into `~/.cache/kokoro`; `KOKORO_MODEL_DIR` overrides) | same | same |
| Only if the user brings a voiceover without a script | `python -m pip install faster-whisper` | same | same |

`python tools/doctor.py --install` runs the npm and pip fixes automatically. If the model download fails in a cloud
session, github.com release assets are blocked by the network policy: say which host to allow; don't substitute another
source silently.

## 4. Check and self-test
1. `python tools/doctor.py` until every required line is OK (use `python3` or `py -3` where needed). It also reports
   whether a GPU is available: without one, 3D frames render on the CPU (see render-qc.md for timing).
2. Self-test: `node render.mjs --project examples/speed-demo --sheet --scale 0.4`. It writes
   `examples/speed-demo/build/sheets/sheet_01.png` with one finished frame per shot (bedroom, phone insert, night street,
   time-freeze, close-ups, super-speed) and prints no errors. Open the PNG to confirm, then delete
   `examples/speed-demo/build/`.

## Notes
- No GPU (Linux servers, cloud sessions): Chromium uses SwiftShader (`--gl swiftshader`, the Linux default). It works,
  but 3D is CPU-heavy. On Windows/macOS desktops the GPU is used (`--gl auto`); with an NVIDIA GPU on Linux pass `--gl gpu`.
  `npx playwright install chromium` installs the full Chromium used for GPU rendering. After installing, run
  `node render.mjs --project examples/speed-demo --bench`: the first line names the GPU (or warns that it isn't used),
  the last line estimates the render time on this machine. `python tools/doctor.py` also lists the NVIDIA GPU and NVENC.
- Disk: ~600 MB for node_modules + Chromium, ~350 MB for the voice model, plus renders (10 min at 1080p60 high ≈ 0.6–1.2 GB).
- Updating: copy the new `kit/` over the install; it never touches `projects/`. Custom styles in `engine/styles.js`
  need re-adding.
