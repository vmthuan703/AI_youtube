"""tools/doctor.py — check (and optionally install) everything the 3D studio needs.

  python tools/doctor.py            # report
  python tools/doctor.py --install  # also run the install commands that are safe to automate
"""
import importlib.util, json, os, platform, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OS = platform.system()  # Windows | Darwin | Linux
PY = sys.executable
rows, fixes = [], []


def ok(name, good, detail="", fix=None):
    rows.append((("OK " if good else "MISSING ") + name, detail))
    if not good and fix: fixes.append(fix)


def ver(cmd):
    try: return subprocess.run(cmd, capture_output=True, text=True, timeout=30).stdout.strip().splitlines()[0]
    except Exception: return None


ff = shutil.which("ffmpeg") and shutil.which("ffprobe")
ok("ffmpeg + ffprobe", bool(ff), ver(["ffmpeg", "-version"]) or "",
   {"Windows": "winget install --id Gyan.FFmpeg -e   (then open a NEW terminal)", "Darwin": "brew install ffmpeg"}.get(OS, "sudo apt-get install -y ffmpeg"))
nv = ver(["node", "--version"])
ok("Node.js >= 18", bool(nv) and int(nv.lstrip("v").split(".")[0]) >= 18, nv or "",
   {"Windows": "winget install OpenJS.NodeJS.LTS", "Darwin": "brew install node"}.get(OS, "install Node 20 LTS from https://nodejs.org or: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"))
nm = all(os.path.isdir(os.path.join(ROOT, "node_modules", p)) for p in ["three", "playwright", "@fontsource/fredoka", "@fontsource/nunito", "@fontsource/playfair-display"])
ok("npm packages (three, playwright, fonts)", nm, "", f"cd \"{ROOT}\" && npm install")
chrom = False
try:
    out = subprocess.run(["node", "-e", "import('playwright').then(p=>{console.log(p.chromium.executablePath())})"], cwd=ROOT, capture_output=True, text=True, timeout=60).stdout.strip()
    chrom = bool(out) and os.path.exists(out)
except Exception:
    pass
if not chrom:   # a pre-installed Chromium is fine too (render.mjs finds /opt/pw-browsers, ~/.cache/ms-playwright or CHROME_PATH)
    for base in [os.environ.get("CHROME_PATH", ""), "/opt/pw-browsers", os.path.expanduser("~/.cache/ms-playwright")]:
        if base and os.path.isfile(base): chrom = True
        elif base and os.path.isdir(base):
            for d in os.listdir(base):
                for rel in ["chrome-linux/chrome", "chrome-linux64/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-win/chrome.exe"]:
                    if os.path.exists(os.path.join(base, d, rel)): chrom = True
ok("Chromium (Playwright or pre-installed)", chrom, "", f"cd \"{ROOT}\" && npx playwright install chromium")
pipx = " --break-system-packages" if OS == "Linux" else ""
for mod, pipname in [("numpy", "numpy"), ("scipy", "scipy"), ("kokoro_onnx", "kokoro-onnx"), ("soundfile", "soundfile")]:
    ok(f"python: {pipname}", importlib.util.find_spec(mod) is not None, "", f"\"{PY}\" -m pip install {pipname}" + pipx)
mdir = os.environ.get("KOKORO_MODEL_DIR", os.path.expanduser("~/.cache/kokoro"))
ok("Kokoro TTS model (~350 MB)", all(os.path.exists(os.path.join(mdir, f)) for f in ["kokoro-v1.0.onnx", "voices-v1.0.bin"]), mdir, f"\"{PY}\" tools/tts.py --download")
cb = os.path.exists(os.path.join(ROOT, ".venvs", "chatterbox", "Scripts" if os.name == "nt" else "bin", "python.exe" if os.name == "nt" else "python"))
rows.append((("OK " if cb else "optional ") + "Chatterbox voice environment (.venvs/chatterbox)", "the channel's default voice; see references/install.md. Kokoro works without it" if not cb else ""))
fw = importlib.util.find_spec("faster_whisper") is not None
rows.append((("OK " if fw else "optional ") + "python: faster-whisper", "only needed when you bring your own voiceover" if not fw else ""))
ok(f"python >= 3.9", sys.version_info >= (3, 9), sys.version.split()[0], "install Python 3.10+ from https://python.org")

gpu = "unknown"
try:
    nv = ver(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"]) if shutil.which("nvidia-smi") else None
    if nv: gpu = f"NVIDIA GPU: {nv}" + (" (used automatically)" if OS != "Linux" else " (render with --gl gpu)")
    elif OS == "Darwin": gpu = "macOS GPU (used automatically)"
    elif OS == "Windows": gpu = "Windows GPU (used automatically; check the WebGL line printed by render.mjs)"
    else: gpu = "no GPU found: 3D frames render on the CPU (SwiftShader) — fine for 720p drafts, slow for 1080p60"
except Exception: pass
nvenc = False
if ff:
    try: nvenc = subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-f", "lavfi", "-i", "color=c=black:s=320x240:d=0.2", "-c:v", "h264_nvenc", "-f", "null", "-"], capture_output=True, timeout=30).returncode == 0
    except Exception: pass
rows.append((("OK " if nvenc else "optional ") + "ffmpeg NVENC (h264_nvenc)", "hardware encoding on: render.mjs uses it with the GPU" if nvenc else "not available (x264 on the CPU is used)"))
print("\naiTrends 3D Studio — environment check\n")
for a, b in rows: print(f"  {a:45s} {b}")
print(f"\n  {OS} {platform.machine()}, {os.cpu_count()} CPU threads, {gpu}")
print("  Measure this machine: node render.mjs --project examples/speed-demo --bench")
if fixes:
    print("\nTo fix, run:")
    for f in fixes: print("  " + f)
    if "--install" in sys.argv:
        for f in fixes:
            if f.startswith(("cd ", f"\"{PY}\"")):
                print(f"\n>>> {f}"); subprocess.run(f, shell=True, cwd=ROOT)
        print("\nRe-run: python tools/doctor.py")
else:
    print("\nAll good.")
