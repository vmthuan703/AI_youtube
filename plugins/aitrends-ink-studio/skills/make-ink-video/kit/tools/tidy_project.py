"""tools/tidy_project.py — after a video is delivered, keep only the final MP4 in its project and move the rest aside.

  python tools/tidy_project.py --project projects/my-video [--dry-run]

Nothing is deleted. Working files move to <studio>/<cleanup folder>/<slug>-<date>/ (channel/brand.json, default "_xoa_duoc"), where
you can check them and delete the folder yourself. Moving on the same drive is instant and does not touch the Recycle Bin.
"""
import argparse, datetime, json, os, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def size(path):
    if os.path.isfile(path):
        return os.path.getsize(path)
    return sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(path) for f in fs)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project", required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    P = os.path.abspath(a.project)
    slug = os.path.basename(P.rstrip("\\/"))
    if not os.path.isdir(P):
        sys.exit(f"no such project: {P}")
    finals = [f for f in os.listdir(os.path.join(P, "out"))] if os.path.isdir(os.path.join(P, "out")) else []
    if not any(f.lower().endswith(".mp4") for f in finals):
        sys.exit("no final MP4 in out/: nothing was moved")
    try:
        folder = json.load(open(os.path.join(ROOT, "channel", "brand.json"), encoding="utf-8")).get("cleanup", {}).get("folder", "_xoa_duoc")
    except (OSError, ValueError):
        folder = "_xoa_duoc"
    dest = os.path.join(ROOT, folder, f"{slug}-{datetime.date.today():%Y%m%d}")
    items = [os.path.join(P, n) for n in os.listdir(P) if n != "out"]
    voice = os.path.join(ROOT, "build_voice", slug)
    if os.path.isdir(voice):
        items.append(voice)
    total = sum(size(i) for i in items)
    print(f"{'Would move' if a.dry_run else 'Moving'} {len(items)} item(s), {total / 1e9:.2f} GB, to {dest}")
    if a.dry_run:
        for i in items:
            print("  ", i)
        return
    os.makedirs(dest, exist_ok=True)
    for i in items:
        target = os.path.join(dest, os.path.basename(i))
        if os.path.exists(target):
            target += "-2"
        shutil.move(i, target)
    print(f"Kept: {os.path.join(P, 'out')}. Delete {dest} yourself when you are sure.")


if __name__ == "__main__":
    main()
