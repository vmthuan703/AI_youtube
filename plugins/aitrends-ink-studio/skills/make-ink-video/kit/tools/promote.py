"""tools/promote.py - 2.2 after the video: what this video built for itself, and which of it should go into the plugin.

  python tools/promote.py --project projects/<slug>            the proposal: new roles, sets, props, effects; stills to send; story/promote.md
  python tools/promote.py --project P --accept "ASTRONAUT,moon base"   record the user's yes (channel/promote_queue.json)
  python tools/promote.py --apply-role ASTRONAUT --project P --to <path>/channel/cast.js [--words "astronaut,spaceman"]
                                                               copy a new role into a roster file (studio and plugin kit), with ROLES keywords
  python tools/promote.py --queue                              what the user accepted and is not released yet
  python tools/promote.py --released                           mark the queue released (after the plugin update)

Nothing is added anywhere without --accept, and --accept is only run after the user said yes in chat.
A role goes in with --apply-role (twice: the studio's channel/cast.js and the plugin kit's). A set, prop or effect follows
references/set-match.md -> "Adding a set" (a T.W builder + a catalogue entry), then `set_match.py --added`.
"""
import argparse, glob, json, os, re, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUEUE = os.path.join(ROOT, "channel", "promote_queue.json")
WISH = os.path.join(ROOT, "channel", "set_wishlist.json")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass


def load(p, d):
    try:
        return json.load(open(p, encoding="utf-8"))
    except (OSError, ValueError):
        return d


def save(p, data):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    json.dump(data, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def norm(s):
    s = unicodedata.normalize("NFD", str(s).lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def roles_in(P):
    f = os.path.join(P, "scenes", "roles_new.js")
    out = {}
    if os.path.exists(f):
        for line in open(f, encoding="utf-8").read().splitlines():
            m = re.match(r"export const (\w+)\s*=\s*\{\s*\.\.\.\s*(\w+)", line)
            if m:
                r = re.search(r"//\s*role:\s*([^|]+)", line)
                out[m.group(1)] = {"base": m.group(2), "role": r.group(1).strip() if r else m.group(1).lower(), "line": line.strip()}
    return out


def shot_uses(P):
    """shots.json: set name -> shot ids, and the role ids each shot module mentions."""
    shots = load(os.path.join(P, "story", "shots.json"), {}).get("shots", [])
    by_set = {}
    for s in shots:
        if s.get("set"):
            by_set.setdefault(s["set"], []).append(s["id"])
    src = ""
    for f in glob.glob(os.path.join(P, "scenes", "**", "*.js"), recursive=True):
        src += open(f, encoding="utf-8", errors="ignore").read()
    return shots, by_set, src


def still_for(P, ids):
    for sid in ids:
        f = sorted(glob.glob(os.path.join(P, "build", "sheets", glob.escape(sid) + "_*.jpeg")))
        if f:
            return f[0]
    return None


def other_projects(P):
    root = os.path.dirname(os.path.abspath(P))
    return [q for q in glob.glob(os.path.join(root, "*")) if os.path.isdir(q) and os.path.abspath(q) != os.path.abspath(P)]


def proposal(P):
    slug = os.path.basename(os.path.normpath(P))
    shots, by_set, src = shot_uses(P)
    rows = []
    # roles
    others = {q: roles_in(q) for q in other_projects(P)}
    for rid, r in roles_in(P).items():
        n_shots = len(re.findall(r"\b" + rid + r"\b", src)) - 1
        past = [os.path.basename(q) for q, rs in others.items() if rid in rs or any(norm(x["role"]) == norm(r["role"]) for x in rs.values())]
        rows.append({"kind": "role", "name": rid, "what": f"{r['role']} (từ {r['base']})", "uses": max(0, n_shots), "past": past,
                     "still": os.path.join(P, "build", "sheets", "roles.png") if os.path.exists(os.path.join(P, "build", "sheets", "roles.png")) else None})
    # sets / props / effects built in this video
    sm = load(os.path.join(P, "story", "set_match.json"), {"items": []})
    wish = {norm(w["name"]): w for w in load(WISH, {"items": []})["items"]}
    kind_vi = {"sets": "set", "props": "prop", "actions": "action", "fx": "fx"}
    for it in sm.get("items", []):
        if it.get("decision") not in ("project", "plugin") or it.get("added"):
            continue
        ids = [sid for name, sids in by_set.items() if norm(name) == norm(it["name"]) or norm(it["name"]) in norm(name) for sid in sids]
        w = wish.get(norm(it["name"]), {})
        past = [v for v in w.get("videos", []) if v != slug]
        rows.append({"kind": kind_vi.get(it["kind"], it["kind"]), "name": it["name"], "what": it.get("desc", ""), "uses": len(ids), "past": past,
                     "still": still_for(P, ids)})
    for r in rows:
        score = len(r["past"]) * 2 + (1 if r["uses"] >= 3 else 0)
        r["advice"] = "nên thêm" if score >= 2 else "có thể thêm" if score == 1 else "để sau"
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project")
    ap.add_argument("--accept")
    ap.add_argument("--apply-role")
    ap.add_argument("--to")
    ap.add_argument("--words")
    ap.add_argument("--queue", action="store_true")
    ap.add_argument("--released", action="store_true")
    a = ap.parse_args()
    q = load(QUEUE, {"items": []})
    if a.queue or a.released:
        todo = [x for x in q["items"] if x.get("status") == "accepted"]
        for x in todo:
            if a.released:
                x["status"] = "released"
            else:
                print(f"ACCEPTED  {x['kind']:<6} {x['name']}  ({x['project']})")
        if a.released:
            save(QUEUE, q)
            print(f"released: {', '.join(x['name'] for x in todo) or 'nothing'}")
        elif not todo:
            print("nothing accepted and waiting.")
        return
    if not a.project:
        ap.error("--project is required")
    P = os.path.abspath(a.project)
    if a.apply_role:
        r = roles_in(P).get(a.apply_role)
        if not r:
            sys.exit(f"{a.apply_role} is not in {P}/scenes/roles_new.js")
        src = open(a.to, encoding="utf-8").read()
        if re.search(r"^export const " + a.apply_role + r"\s*=", src, re.M):
            print(f"{a.apply_role} is already in {a.to}")
            return
        if not re.search(r"^export const " + r["base"] + r"\s*=", src, re.M):
            sys.exit(f"base role {r['base']} is not in {a.to}")
        line = re.sub(r"//\s*role:.*$", "", r["line"]).rstrip() + f"   // 2.2 from video {os.path.basename(P)}: {r['role']}"
        words = [w.strip() for w in (a.words or r["role"]).split(",") if w.strip()]
        i = src.index("export const ROLES = {")
        src = src[:i] + line + "\n\n" + src[i:]
        src = src.replace("export const ROLES = {\n", "export const ROLES = {\n  " + a.apply_role + ": [" + ", ".join(repr(w) for w in words) + "],\n", 1)
        open(a.to, "w", encoding="utf-8").write(src)
        print(f"added {a.apply_role} to {a.to} (ROLES: {', '.join(words)})")
        return
    rows = proposal(P)
    if a.accept:
        names = [n.strip() for n in a.accept.split(",") if n.strip()]
        known = {norm(r["name"]): r for r in rows}
        for n in names:
            r = known.get(norm(n))
            if not r:
                sys.exit(f"'{n}' is not in this video's proposal")
            q["items"].append({"kind": r["kind"], "name": r["name"], "project": os.path.basename(P), "status": "accepted"})
        save(QUEUE, q)
        print(f"accepted: {', '.join(names)} -> channel/promote_queue.json")
        return
    if not rows:
        print("Video này không tự tạo vai, bối cảnh hay đạo cụ nào: không có gì để đề xuất.")
        return
    L = [f"# Đề xuất thêm vào plugin: {os.path.basename(P)}", "", "| Loại | Tên | Mô tả | Số cảnh dùng | Video trước cũng cần | Lời khuyên |", "|---|---|---|---|---|---|"]
    for r in sorted(rows, key=lambda r: ["nên thêm", "có thể thêm", "để sau"].index(r["advice"])):
        L.append(f"| {r['kind']} | {r['name']} | {r['what'][:60]} | {r['uses']} | {', '.join(r['past']) or '—'} | {r['advice']} |")
    L += ["", "Bạn chọn mục nào thêm vào plugin (ghi tên, cách nhau dấu phẩy), hoặc \"không\"."]
    open(os.path.join(P, "story", "promote.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
    print("\n".join(L))
    for f in sorted({r["still"] for r in rows if r["still"]}):
        print("STILL " + f)


if __name__ == "__main__":
    main()
