"""tools/verify_kit.py — confirm every 3D studio file was written exactly (run right after installing).

  python tools/verify_kit.py
Prints MISMATCH/MISSING for any file that differs from the tested version; copy those files again from the plugin kit folder.
(Line endings and leading/trailing blank lines are ignored. Files you customise later, e.g. engine/styles.js, will of course differ.)
"""
import hashlib, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPECTED = {
    "package.json": "2aec62b73f96018d",
    "player.html": "5ffdd7da4a48cd4b",
    "render.mjs": "82a9e4aacb53cbd9",
    "audio/dsp.py": "589d305d94d8acc3",
    "audio/mix.py": "2477d0be9bcdc7dc",
    "audio/music.py": "2fb3ce1df2fe5c7d",
    "audio/sfx.py": "2fa56141e2423718",
    "engine/core.js": "e269def910147ea8",
    "engine/fx2d.js": "d09f93f6d44366fa",
    "engine/fx3d.js": "71fa043d1588a3e2",
    "engine/kit3d.js": "b6aee6d2b0ec0ec4",
    "engine/player.js": "c60192be1365a5b1",
    "engine/rig2d.js": "ec2a665e0aa8ffed",
    "engine/rig3d.js": "ffc9875818d27fd5",
    "engine/styles.js": "34462ed420448f78",
    "engine/ui2d.js": "babd2978a5d2a6db",
    "engine/world3d.js": "789b3041844c082c",
    "examples/speed-demo/config.json": "a6ac1b0107858a17",
    "examples/speed-demo/input/script.txt": "a4b2a8d81915ef2c",
    "examples/speed-demo/scenes/cast.js": "99cbf7841ea04910",
    "examples/speed-demo/scenes/sets/bedroom.js": "fa8dc6c2b685e0fc",
    "examples/speed-demo/scenes/sets/street.js": "5c51f72614c12109",
    "examples/speed-demo/scenes/shots/01_hook.js": "7f867f21d8f6a36b",
    "examples/speed-demo/scenes/shots/02_morning.js": "f904901c3687d05c",
    "examples/speed-demo/scenes/shots/03_street.js": "0be8c17ac7b97bba",
    "examples/speed-demo/scenes/shots/04_end.js": "60af9c16fe953348",
    "examples/speed-demo/story/bible.md": "49ce3751e71ab867",
    "examples/speed-demo/story/shots.json": "0c948f8fe6d50c29",
    "examples/speed-demo/timeline/lines.json": "383ac4b7efc3515b",
    "examples/speed-demo/timeline/sentences.json": "257bb810945e3da2",
    "examples/speed-demo/timeline/transcript.txt": "6981a3aadec77096",
    "examples/speed-demo/timeline/words.json": "0104848974427879",
    "tools/beats.py": "eb42a8aef4d87584",
    "tools/common.py": "e237321f2f12416e",
    "tools/doctor.py": "7f8b84525acd6efd",
    "tools/new_project.py": "7e6b5cc029b56aa1",
    "tools/parse_script.py": "f33853d2823efde2",
    "tools/transcribe.py": "ecd48d05a6655d13",
    "tools/tts.py": "bae62a46f9d68395",
}
bad = 0
for rel, want in EXPECTED.items():
    p = os.path.join(ROOT, *rel.split("/"))
    if not os.path.exists(p):
        print(f"MISSING   {rel}"); bad += 1; continue
    got = hashlib.sha256(open(p, "rb").read().replace(b"\r\n", b"\n").strip()).hexdigest()[:16]
    if got != want:
        print(f"MISMATCH  {rel}"); bad += 1
print(f"{len(EXPECTED) - bad}/{len(EXPECTED)} files verified." + ("" if not bad else "  Copy the files listed above again from the plugin's kit folder, then run this again."))
sys.exit(1 if bad else 0)
