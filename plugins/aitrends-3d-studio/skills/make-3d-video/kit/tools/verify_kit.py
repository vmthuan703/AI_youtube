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
    "render.mjs": "8d6059c79f24bac1",
    "audio/dsp.py": "589d305d94d8acc3",
    "audio/mix.py": "fabf2b05cad92d43",
    "audio/music.py": "2fb3ce1df2fe5c7d",
    "audio/sfx.py": "2fa56141e2423718",
    "engine/core.js": "a366762cb922448c",
    "engine/diagrams2d.js": "b6d240a747039ddc",
    "engine/fx2d.js": "d09f93f6d44366fa",
    "engine/fx3d.js": "71fa043d1588a3e2",
    "engine/gag.js": "728a86bf82e46afb",
    "engine/hair3d.js": "06e64dc3cfc7baa0",
    "engine/kit3d.js": "4cdb0ace3f93d219",
    "engine/player.js": "b901466ed5aaddd7",
    "engine/rig2d.js": "ec2a665e0aa8ffed",
    "engine/rig3d.js": "1831cdff73738c9d",
    "engine/styles.js": "303f018aaf34a305",
    "engine/ui2d.js": "39c9e5393ab26d88",
    "engine/world3d.js": "d04429b8ed022d20",
    "examples/diagram-gallery/config.json": "c1ac44eee0faf27d",
    "examples/diagram-gallery/scenes/shots/a.js": "c8ddaac2d475aa37",
    "examples/diagram-gallery/story/shots.json": "bb1cdf4dfb5cdef1",
    "examples/look-demo/config.json": "49f0ce8a8914ff8d",
    "examples/look-demo/scenes/cast.js": "476ef9ae268caede",
    "examples/look-demo/scenes/shots/a.js": "1e870301ef9e647e",
    "examples/look-demo/story/shots.json": "a279aad617bdbf6d",
    "examples/speed-demo/config.json": "a6ac1b0107858a17",
    "examples/speed-demo/input/script.txt": "a4b2a8d81915ef2c",
    "examples/speed-demo/scenes/cast.js": "99cbf7841ea04910",
    "examples/speed-demo/scenes/sets/bedroom.js": "fa8dc6c2b685e0fc",
    "examples/speed-demo/scenes/sets/street.js": "5c51f72614c12109",
    "examples/speed-demo/scenes/shots/01_hook.js": "7f867f21d8f6a36b",
    "examples/speed-demo/scenes/shots/02_morning.js": "f0d9e2aeba26440b",
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
    "tools/doctor.py": "8d037a2b0fa634f5",
    "tools/new_project.py": "cb5dd45c811db41a",
    "tools/parse_script.py": "f33853d2823efde2",
    "tools/qc_metrics.py": "49a4c72037139c39",
    "tools/script_check.py": "54e4ca974d105593",
    "tools/tidy_project.py": "37a1c24f85e1446d",
    "tools/transcribe.py": "ecd48d05a6655d13",
    "tools/tts.py": "bae62a46f9d68395",
    "tools/tts_chatterbox.py": "d5e959c509ae0c21",
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
