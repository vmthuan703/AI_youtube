#!/usr/bin/env python3
"""Maintainer tool: after editing any file in the 3D studio kit, refresh the hash table in tools/verify_kit.py.

  python3 plugins/refresh_kit_hashes.py
"""
import hashlib, os, re

KIT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "aitrends-3d-studio", "skills", "make-3d-video", "kit")
SKIP_DIRS = {"node_modules", "build", "__pycache__", "out", "channel"}   # channel/ is the user's own settings: never verified
files = []
for root, dirs, names in os.walk(KIT):
    dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
    for n in sorted(names):
        rel = os.path.relpath(os.path.join(root, n), KIT).replace(os.sep, "/")
        if rel == "tools/verify_kit.py" or n.endswith((".pyc", ".mp3", ".wav")):
            continue
        files.append(rel)
h = lambda p: hashlib.sha256(open(os.path.join(KIT, p), "rb").read().replace(b"\r\n", b"\n").strip()).hexdigest()[:16]
table = "EXPECTED = {\n" + "".join(f'    "{f}": "{h(f)}",\n' for f in files) + "}"
vp = os.path.join(KIT, "tools", "verify_kit.py")
src = open(vp, encoding="utf-8").read()
src = re.sub(r"EXPECTED = \{.*?\n\}", table, src, flags=re.S)
open(vp, "w", encoding="utf-8").write(src)
print(f"{len(files)} files hashed into tools/verify_kit.py")
