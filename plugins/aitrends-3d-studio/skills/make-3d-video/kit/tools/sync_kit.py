"""tools/sync_kit.py — 1.0.5 copy this kit's code into a studio, so a set the user just approved is usable at once; the plugin
release (PR, merge, plugin update) happens once, after the video.

  python tools/sync_kit.py --to D:/aitrends-3d-studio             copy every changed file, then run the studio's verify_kit
  python tools/sync_kit.py --to <studio> --dry                     list what would change

Copies engine/, tools/, audio/, examples/ (not their build/), render.mjs, player.html, package.json. Never touches the studio's
channel/ (cast, brand, lessons, wishlist), projects/, build_voice/ or node_modules/. Prints one line per changed file.
"""
import argparse, hashlib, os, shutil, subprocess, sys

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRS = ["engine", "tools", "audio", "examples"]
FILES = ["render.mjs", "player.html", "package.json"]
SKIP = {"build", "node_modules", "__pycache__", "out"}
KEEP = {"engine/styles.js"}   # the studio may customise its styles; copied only with --styles


def digest(p):
    return hashlib.sha256(open(p, "rb").read().replace(b"\r\n", b"\n").strip()).hexdigest()


def files():
    for f in FILES:
        yield f
    for d in DIRS:
        for root, dirs, names in os.walk(os.path.join(KIT, d)):
            dirs[:] = [x for x in dirs if x not in SKIP]
            for n in names:
                yield os.path.relpath(os.path.join(root, n), KIT).replace("\\", "/")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--to", required=True)
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--styles", action="store_true", help="also overwrite engine/styles.js")
    a = ap.parse_args()
    dst = os.path.abspath(a.to)
    if not os.path.exists(os.path.join(dst, "render.mjs")):
        sys.exit(f"not a studio: {dst}")
    if os.path.samefile(dst, KIT):
        sys.exit("source and studio are the same folder")
    n, changed = 0, []
    for rel in files():
        s, d = os.path.join(KIT, rel), os.path.join(dst, rel)
        if os.path.exists(d) and digest(s) == digest(d):
            continue
        if rel in KEEP and os.path.exists(d) and not a.styles:
            print("KEEP " + rel + "  (studio copy differs; --styles to overwrite)")
            continue
        changed.append(("NEW  " if not os.path.exists(d) else "SYNC ") + rel)
        n += 1
        if not a.dry:
            os.makedirs(os.path.dirname(d), exist_ok=True)
            shutil.copy2(s, d)
    if not changed:
        pass
    elif len(changed) <= 15:
        print("\n".join(changed))
    else:   # keep the output short: one line per folder
        groups = {}
        for c in changed:
            k = "/".join(c[5:].split("/")[:2])
            groups[k] = groups.get(k, 0) + 1
        print("\n".join(f"{v:3d}  {k}" for k, v in groups.items()))
    print(f"{n} file(s) {'would change' if a.dry else 'copied'}.")
    if not a.dry:
        r = subprocess.run([sys.executable, os.path.join(dst, "tools", "verify_kit.py")], cwd=dst, capture_output=True, text=True)
        lines = r.stdout.strip().splitlines()
        real = [l for l in lines if l.startswith(("MISMATCH", "MISSING", "CATALOG")) and l.split()[-1] not in KEEP]
        print("\n".join(real) or ("verify_kit: OK" + (" (kept your engine/styles.js)" if r.returncode else "")))
        sys.exit(1 if real else 0)


if __name__ == "__main__":
    main()
