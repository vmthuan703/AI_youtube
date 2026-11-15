"""tools/cast_match.py - 2.2 match the characters a script needs against the channel roster (channel/cast.js), the twin of set_match.py.

  python tools/cast_match.py --project projects/<slug>                 read story/needs.json -> characters, print the report, write story/cast_match.json
  python tools/cast_match.py --project P --decide "astronaut=use:SCIENTIST" --decide "king=new:PRINCIPAL"
  python tools/cast_match.py --project P --check                       exit 1 while a "new" role is not defined in scenes/roles_new.js
  python tools/cast_match.py --project P --new-roles                   the roles this video defined itself (for promote.py)
  python tools/cast_match.py --list                                    the roster with its keywords

needs.json -> "characters" (written by Claude in the same read as the places and props; quotes are the script's own words):
  [{"name": "astronaut", "quote": "...", "desc": "white suit, helmet, adult man", "sex": "m|f", "age": "kid|teen|adult|old"}]

Statuses: ✅ have (a roster role whose keywords are in the name or desc), 🟡 near (a sex/age stand-in exists, the job does not),
❌ missing. 🟡 and ❌ default to "new": Claude writes the role in projects/<slug>/scenes/roles_new.js, starting from the suggested
base (`export const ASTRONAUT = { ...WORKER, ... };  // role: astronaut`), and checks it with `node render.mjs --project P --roles`.
Nothing is added to the channel roster here: tools/promote.py proposes the new roles to the user at the end of the video.
"""
import argparse, json, os, re, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass
ROSTER_PATH = os.path.join(ROOT, "channel", "cast.js")
# stand-ins by sex / age when the job is unknown (the base a new role starts from)
STAND_IN = {("m", "kid"): "LITTLE_SIB", ("f", "kid"): "LITTLE_SIB", ("m", "teen"): "BRO_2", ("f", "teen"): "CLASSMATE_2",
            ("m", "adult"): "DAD", ("f", "adult"): "MOM", ("m", "old"): "GRANDPA", ("f", "old"): "GRANDMA"}
HERO_WORDS = {"you", "hero", "ban", "narrator", "me", "i"}


def norm(s):
    s = unicodedata.normalize("NFD", str(s).replace("đ", "d").replace("Đ", "D").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return " " + re.sub(r"[^a-z0-9.]+", " ", s).strip() + " "


def roster():
    src = open(ROSTER_PATH, encoding="utf-8").read()
    names = set(re.findall(r"^export const (\w+)\s*=", src, re.M)) - {"ROLES"}
    m = re.search(r"export const ROLES = \{(.*?)\n\};", src, re.S)
    roles = {k: re.findall(r"'([^']+)'", v) for k, v in re.findall(r"(\w+):\s*\[([^\]]*)\]", m.group(1) if m else "")}
    return names, roles


def match(ch, roles):
    text = norm(ch.get("name", "") + " " + ch.get("desc", ""))
    if norm(ch.get("name", "")).strip() in HERO_WORDS:
        return "have", "HERO"
    best = None
    for role, kws in roles.items():
        for kw in kws:
            if norm(kw) in text and (best is None or len(kw) > best[1]):
                best = (role, len(kw))
    if best:
        return "have", best[0]
    sex = (ch.get("sex") or "").lower()[:1]
    age = (ch.get("age") or "").lower()
    if not sex:
        sex = "f" if re.search(r" (girl|woman|lady|she|her|mom|mother|queen|co|ba|chi) ", text) else "m"
    if age not in ("kid", "teen", "adult", "old"):
        age = "old" if re.search(r" (old|elderly|grand|cu|ong|ba gia) ", text) else "kid" if re.search(r" (kid|child|baby|be) ", text) \
            else "teen" if re.search(r" (teen|student|classmate|hoc sinh) ", text) else "adult"
    base = STAND_IN.get((sex, age), "DAD")
    return ("near" if age in ("kid", "teen") else "missing"), base


def role_id(name):
    return re.sub(r"[^A-Z0-9]+", "_", unicodedata.normalize("NFD", name).encode("ascii", "ignore").decode().upper()).strip("_") or "ROLE"


def new_roles(P):
    """Roles defined in scenes/roles_new.js: {ID: {"base": X, "role": words, "line": source}}."""
    f = os.path.join(P, "scenes", "roles_new.js")
    if not os.path.exists(f):
        return {}
    out = {}
    for line in open(f, encoding="utf-8").read().splitlines():
        m = re.match(r"export const (\w+)\s*=\s*\{\s*\.\.\.\s*(\w+)", line)
        if m:
            r = re.search(r"//\s*role:\s*([^|]+)", line)
            out[m.group(1)] = {"base": m.group(2), "role": (r.group(1).strip() if r else m.group(1).lower()), "line": line.strip()}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project")
    ap.add_argument("--decide", action="append", default=[])
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--new-roles", action="store_true")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()
    names, roles = roster()
    if a.list:
        for k in sorted(names):
            print(f"{k:<14} {', '.join(roles.get(k, []))}")
        return
    if not a.project:
        sys.exit("--project is required")
    P = a.project
    out_path = os.path.join(P, "story", "cast_match.json")
    if a.new_roles:
        print(json.dumps(new_roles(P), ensure_ascii=False, indent=1))
        return
    try:
        res = json.load(open(out_path, encoding="utf-8"))
    except (OSError, ValueError):
        res = {}
    if not a.check:
        needs = json.load(open(os.path.join(P, "story", "needs.json"), encoding="utf-8")).get("characters", [])
        if not needs:
            print("needs.json has no \"characters\": list every person the script names or shows (name, quote, desc, sex, age)")
        for ch in needs:
            st, role = match(ch, roles)
            old = res.get(ch["name"], {})
            res[ch["name"]] = {"status": st, "quote": ch.get("quote", ""), "desc": ch.get("desc", ""),
                               ("role" if st == "have" else "base"): role,
                               "decision": old.get("decision") or ("use:" + role if st == "have" else "new:" + role),
                               "id": old.get("id") or (role if st == "have" else role_id(ch["name"]))}
    for d in a.decide:
        name, _, dec = d.partition("=")
        if name not in res:
            sys.exit(f"unknown character: {name}")
        kind, _, rid = dec.partition(":")
        if kind not in ("use", "new") or (kind == "use" and rid not in names):
            sys.exit(f"decision must be use:<roster role> or new:<base role>: {dec}")
        res[name]["decision"] = dec
        res[name]["id"] = rid if kind == "use" else res[name]["id"]
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    json.dump(res, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    defined = new_roles(P)
    todo = [(n, r) for n, r in res.items() if r["decision"].startswith("new:") and r["id"] not in defined]
    icon = {"have": "✅", "near": "🟡", "missing": "❌"}
    print("Nhân vật (cast match):")
    for n, r in res.items():
        dec = r["decision"]
        what = f"dùng {dec[4:]}" if dec.startswith("use:") else (f"vai mới {r['id']} (từ {defined[r['id']]['base']}) ✓ đã có trong roles_new.js" if r["id"] in defined else f"vai mới {r['id']} (từ {dec[4:]}) — cần viết")
        print(f"  {icon[r['status']]} {n:<18} {what}")
    if todo:
        print("Viết trong scenes/roles_new.js (mỗi vai một dòng, bắt đầu từ vai gốc; trang phục: references/engine-api/characters.md):")
        print("  import { " + ", ".join(sorted({r['decision'][4:] for _, r in todo})) + " } from '/channel/cast.js';")
        for n, r in todo:
            print(f"  export const {r['id']} = {{ ...{r['decision'][4:]}, /* {r['desc'] or n} */ }};   // role: {n}")
        print("rồi: node render.mjs --project " + P + " --roles   (một ảnh mỗi vai mới, mở sheet đó)")
    if a.check and todo:
        sys.exit(1)


if __name__ == "__main__":
    main()
