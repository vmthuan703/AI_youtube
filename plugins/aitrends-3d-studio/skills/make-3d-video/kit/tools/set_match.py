"""tools/set_match.py — 1.0.5 match a script against the kit's catalogue (engine/catalog.json) BEFORE any shot is built.

The user reads the result (story/set_match.md, in Vietnamese) and decides, for every place / prop / effect the kit does not have,
whether to add it to the plugin, build it only in this video, or use a ready-made one instead. The pipeline waits for that choice.

  python tools/set_match.py --project projects/<slug> --script <file>          scan the script for everything the catalogue knows
         [--needs projects/<slug>/story/needs.json]                             + the list Claude wrote of what the story needs
  python tools/set_match.py --project P --decide "kho hàng=plugin" --decide "xe tải=use:pickup" --decide "bãi rác=project"
  python tools/set_match.py --project P --check            exit 1 while a missing item has no decision (or waits for the plugin)
  python tools/set_match.py --project P --shots            every shots.json "set" must be a catalogue set or a project set
  python tools/set_match.py --scan-projects                past videos' own sets → channel/set_wishlist.json (what to promote)
  python tools/set_match.py --verify-catalog               every call in the catalogue exists in the engine (verify_kit runs it)
  python tools/set_match.py --list [sets|props|actions|fx] the catalogue as a table
  --root DIR                                               another studio's projects/ and channel/ (default: this folder)

needs.json (written by Claude after reading the script; quotes are the script's own words):
  {"places": [{"name": "abandoned warehouse", "quote": "...", "desc": "dark, crates, one hanging bulb"}],
   "props": [...], "actions": [...], "fx": [...]}
"""
import argparse, datetime, glob, json, os, re, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT_PATH = os.path.join(ROOT, "engine", "catalog.json")
WISH_PATH = os.path.join(ROOT, "channel", "set_wishlist.json")
KINDS = {"places": "sets", "props": "props", "actions": "actions", "fx": "fx"}
KIND_VI = {"sets": "Bối cảnh", "props": "Đạo cụ", "actions": "Động tác", "fx": "Thời tiết / hiệu ứng"}
STOP = set("a an the of in on at to and or with his her their my your its is are was be by for from into out up down this that it he she you they we "
           "cua cai mot nhung cac va voi o tai trong ngoai len xuong nay kia la thi".split())


def rel(p):
    try:
        return os.path.relpath(p)
    except ValueError:
        return p


def today():
    return datetime.date.today().isoformat()


def norm(s):
    s = unicodedata.normalize("NFD", str(s).replace("đ", "d").replace("Đ", "D").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def camel_words(s):
    return re.sub(r"([a-z])([A-Z])", r"\1 \2", s).replace(".", " ").replace("_", " ")


def tokens(s):
    out = set()
    for w in norm(s).split():
        if w in STOP or len(w) < 2:
            continue
        out.add(w[:-1] if len(w) > 4 and w.endswith("s") else w)
    return out


def load_json(p, default):
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def save_json(p, data):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)


def catalog():
    c = load_json(CAT_PATH, None)
    if not c:
        sys.exit(f"catalogue not found: {CAT_PATH}")
    for kind in ("sets", "props", "actions", "fx"):
        for e in c.get(kind, []):
            e["_kind"] = kind
            # _scan: phrases looked for in the script (4+ letters); _aliases adds the short names past videos gave their sets
            e["_scan"] = sorted({norm(a) for a in e.get("aliases", []) + [e.get("vi", "")] if len(norm(a)) >= 4}, key=len, reverse=True)
            e["_aliases"] = sorted({norm(a) for a in e.get("aliases", []) + e.get("names", []) + [e.get("vi", ""), camel_words(e["id"])] if norm(a)}, key=len, reverse=True)
            e["_tokens"] = set().union(*(tokens(a) for a in e["_aliases"])) | tokens(" ".join(e.get("tags", [])))
    return c


def label(e):
    call = e.get("call") or (f"T.W.{e['id']}" if e["_kind"] in ("sets", "props") else e["id"])
    if e.get("opts"):
        call += "(st, " + json.dumps(e["opts"]) + ")"
    return f"{e.get('vi', e['id'])} (`{call}`)"


# ---------------------------------------------------------------- project sets (built inside a video)
def project_sets(P):
    """Names a project defines itself: exported builders in scenes/sets/*.js and keys of a SETS table in scenes/*.js."""
    names = set()
    for f in glob.glob(os.path.join(P, "scenes", "sets", "*.js")) + glob.glob(os.path.join(P, "scenes", "*.js")):
        src = open(f, encoding="utf-8", errors="ignore").read()
        names |= set(re.findall(r"export\s+(?:function|const)\s+(\w+)", src))
        m = re.search(r"SETS\s*=\s*\{(.*?)\n\};", src, re.S)
        if m:
            names |= set(re.findall(r"^\s*(\w+)\s*:", m.group(1), re.M))
        if os.path.basename(os.path.dirname(f)) == "sets":
            names.add(os.path.splitext(os.path.basename(f))[0])
    return names


# ---------------------------------------------------------------- matching
def scan_script(text, cat):
    """Every catalogue entry the script names (whole-phrase match on any alias), with the first line that names it."""
    lines = [l for l in text.splitlines() if l.strip()]
    nlines = [" " + norm(l) + " " for l in lines]
    hits = {}
    for kind in ("sets", "fx", "props", "actions"):
        for e in cat[kind]:
            if e.get("prefer") and e["prefer"] in hits:
                continue
            for a in e["_scan"]:
                pat = re.compile(r" " + re.escape(a) + r"(?:s|es)? ")
                for i, nl in enumerate(nlines):
                    if pat.search(nl):
                        h = hits.setdefault(e["id"], {"entry": e, "alias": a, "quote": lines[i].strip()[:160], "count": 0})
                        h["count"] += len(pat.findall(nl))
                if e["id"] in hits:
                    break
    return hits


def match_need(need, kind, cat):
    """have: an alias of one entry is in the need's name; near: most of its words belong to one entry; else missing."""
    name = need.get("name", "")
    nn = " " + norm(name) + " "
    want = tokens(name) or tokens(need.get("desc", ""))
    best = None   # the longest alias found inside the name wins ("football game" beats "game")
    for e in cat[kind]:
        for a in e["_aliases"]:
            if len(a) >= 3 and re.search(r" " + re.escape(a) + r"(?:s|es)? ", nn) and (best is None or len(a) > len(best[0])):
                best = (a, e)
            if best and best[1] is e:
                break
    if best:
        a, e = best
        cover = len(tokens(a) & want) / max(1, len(want))
        return ("have" if cover >= 0.6 else "near"), e, []
    want = tokens(name) or tokens(need.get("desc", ""))
    ranked = []
    for e in cat[kind]:
        ov = want & e["_tokens"]
        if ov:
            ranked.append((len(ov) / max(1, len(want)), e))
    ranked.sort(key=lambda x: -x[0])
    if ranked and ranked[0][0] >= 0.5:
        return "near", ranked[0][1], [e for _, e in ranked[1:3]]
    # substitutes for a missing place: the closest sets by description words, or nothing
    desc_t = tokens(need.get("desc", "")) | want
    subs = sorted(((len(desc_t & e["_tokens"]), e) for e in cat[kind]), key=lambda x: -x[0])
    return "missing", None, [e for s, e in subs[:3] if s > 0]


def build_report(P, script, needs_path, cat):
    text = open(script, encoding="utf-8").read() if script else ""
    hits = scan_script(text, cat) if text else {}
    needs = load_json(needs_path, {}) if needs_path else {}
    old = load_json(os.path.join(P, "story", "set_match.json"), {})
    old_dec = {i["name"]: i.get("decision") for i in old.get("items", [])}
    items = []
    for key, kind in KINDS.items():
        for need in needs.get(key, []):
            status, e, alts = match_need(need, kind, cat)
            pref = None
            if e is not None and e.get("prefer"):
                pref = next((x for x in cat["sets"] if x["id"] == e["prefer"]), None)
            items.append({"kind": kind, "name": need.get("name", ""), "quote": need.get("quote", ""), "desc": need.get("desc", ""), "status": status,
                          "use": (pref or e)["id"] if e else None, "alts": [a["id"] for a in alts], "decision": old_dec.get(need.get("name", ""))})
    covered = {i["use"] for i in items if i["use"]}
    found = [{"kind": h["entry"]["_kind"], "id": k, "alias": h["alias"], "quote": h["quote"], "count": h["count"], "new": k not in covered}
             for k, h in hits.items()]
    res = {"project": os.path.basename(os.path.normpath(P)), "date": today(), "script": script, "needs": needs_path, "items": items, "found": found,
           "catalog": cat.get("version")}
    save_json(os.path.join(P, "story", "set_match.json"), res)
    write_md(P, res, cat)
    return res


def find(cat, eid):
    for kind in ("sets", "props", "actions", "fx"):
        for e in cat[kind]:
            if e["id"] == eid:
                return e
    return None


NEAR_VI = {"sets": "dùng và chỉnh trong video (màu, đạo cụ, ánh sáng)", "props": "dùng và đổi màu / kích cỡ trong video",
           "actions": "ghép từ động tác này trong video", "fx": "dùng và chỉnh thông số trong video"}
DEC_VI = {"plugin": "thêm vào plugin", "project": "dựng riêng trong video này"}


def dec_text(d):
    if not d:
        return "**chờ bạn chọn**"
    if d.startswith("use:"):
        return f"dùng `{d[4:]}` thay thế"
    return DEC_VI.get(d, d)


def write_md(P, res, cat):
    items = res["items"]
    have = [i for i in items if i["status"] == "have"]
    near = [i for i in items if i["status"] == "near"]
    miss = [i for i in items if i["status"] == "missing"]
    L = [f"# Đối chiếu bối cảnh: {res['project']}", "", f"Ngày {res['date']} · danh mục plugin {res.get('catalog')} · "
         f"{len(have)} có sẵn, {len(near)} gần đúng, {len(miss)} thiếu.", ""]
    for kind in ("sets", "props", "actions", "fx"):
        rows = [i for i in items if i["kind"] == kind]
        if not rows:
            continue
        L += [f"## {KIND_VI[kind]}", "", "| | Script cần | Câu trong script | Dùng | Ghi chú |", "|---|---|---|---|---|"]
        for i in rows:
            e = find(cat, i["use"]) if i["use"] else None
            icon = {"have": "✅", "near": "🟡", "missing": "❌"}[i["status"]]
            alts = ", ".join(f"`{a}`" for a in i["alts"])
            note = ("có sẵn" if i["status"] == "have" else
                    f"gần đúng: {NEAR_VI[kind]}{'; khác: ' + alts if alts else ''}" if i["status"] == "near" else
                    f"{dec_text(i.get('decision'))}{'; thay thế được: ' + alts if alts else ''}")
            q = i["quote"].replace("|", "/")[:90]
            L.append(f"| {icon} | {i['name']} | {q} | {label(e) if e else '—'} | {note} |")
        L.append("")
    extra = [f for f in res["found"] if f["new"] and f["kind"] in ("sets", "fx")]
    if extra:
        L += ["## Script còn nhắc tới (tìm tự động, kiểm tra lại)", ""]
        for f in extra:
            e = find(cat, f["id"])
            L.append(f"- {label(e)}: \"{f['quote'][:100]}\"")
        L.append("")
    if miss:
        L += ["## Bạn chọn cho từng mục ❌", "", "- **thêm vào plugin**: mình dựng trên nhánh mới, gửi ảnh mẫu, bạn duyệt rồi mới PR, merge, cập nhật plugin;",
              "- **dựng riêng**: chỉ dựng trong video này (ghi vào hàng chờ `channel/set_wishlist.json`, video sau cần lại sẽ đề xuất đưa vào plugin);",
              "- **dùng bối cảnh thay thế**: chọn một mục có sẵn.", ""]
    wish = load_json(WISH_PATH, {"items": []})["items"]
    hot = [w for w in wish if w.get("status") == "wanted" and len(w.get("videos", [])) >= 2]
    if hot:
        L += ["## Hàng chờ: đã dựng riêng ở ≥ 2 video, nên đưa vào plugin", ""]
        for w in hot:
            L.append(f"- {w['name']} ({len(w['videos'])} video: {', '.join(w['videos'][:5])})")
        L.append("")
    with open(os.path.join(P, "story", "set_match.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(L) + "\n")


# ---------------------------------------------------------------- decisions, gates
def wish_add(name, desc, video, status, source):
    w = load_json(WISH_PATH, {"items": []})
    key = norm(name)
    it = next((x for x in w["items"] if norm(x["name"]) == key), None)
    if not it:
        it = {"name": name, "desc": desc, "videos": [], "first": today(), "status": status, "source": source}
        w["items"].append(it)
    if video and video not in it["videos"]:
        it["videos"].append(video)
    if status == "plugin" or it["status"] != "plugin":
        it["status"] = status
    if desc and not it.get("desc"):
        it["desc"] = desc
    save_json(WISH_PATH, w)


def decide(P, pairs, cat):
    p = os.path.join(P, "story", "set_match.json")
    res = load_json(p, None)
    if not res:
        sys.exit("run set_match.py --project P --script ... first")
    for pair in pairs:
        name, _, d = pair.partition("=")
        name, d = name.strip(), d.strip()
        it = next((i for i in res["items"] if norm(i["name"]) == norm(name)), None)
        if not it:
            sys.exit(f"no item named '{name}' in set_match.json")
        if d.startswith("use:") and not find(cat, d[4:]):
            sys.exit(f"'{d[4:]}' is not in the catalogue")
        if d not in ("plugin", "project") and not d.startswith("use:"):
            sys.exit("decision must be plugin, project or use:<catalogue id>")
        it["decision"] = d
        if d in ("plugin", "project"):
            wish_add(it["name"], it.get("desc", ""), res["project"], "plugin" if d == "plugin" else "wanted", "set_match")
    save_json(p, res)
    write_md(P, res, cat)


def check(P, cat):
    res = load_json(os.path.join(P, "story", "set_match.json"), None)
    if not res:
        print("NO MATCH YET  run set_match.py --project P --script <file> --needs story/needs.json")
        return 1
    bad = 0
    for i in res["items"]:
        if i["status"] != "missing":
            continue
        d = i.get("decision")
        if not d:
            print(f"WAITING   {i['name']}: the user has not chosen (plugin / project / use:<id>)"); bad += 1
        elif d == "plugin" and not i.get("added"):
            print(f"PLUGIN    {i['name']}: waits for the plugin update (then: --added \"{i['name']}=<new id>\")"); bad += 1
    print("set_match: " + ("ready to build shots." if not bad else f"{bad} item(s) still open."))
    return 1 if bad else 0


def added(P, pairs, cat):
    p = os.path.join(P, "story", "set_match.json")
    res = load_json(p, {})
    for pair in pairs:
        name, _, eid = pair.partition("=")
        if not find(cat, eid.strip()):
            sys.exit(f"'{eid.strip()}' is not in the catalogue yet: add it to engine/catalog.json with the new set")
        it = next((i for i in res["items"] if norm(i["name"]) == norm(name)), None)
        if not it:
            sys.exit(f"no item named '{name}'")
        it.update(added=eid.strip(), use=eid.strip(), status="have")
        w = load_json(WISH_PATH, {"items": []})
        for x in w["items"]:
            if norm(x["name"]) == norm(name):
                x["status"], x["added"] = "added", eid.strip()
        save_json(WISH_PATH, w)
    save_json(p, res)
    write_md(P, res, cat)


def check_shots(P, cat):
    shots = load_json(os.path.join(P, "story", "shots.json"), {}).get("shots", [])
    ok = {e["id"] for e in cat["sets"]} | {e["id"].split(".")[0] for e in cat["sets"]} | project_sets(P) | {"stage", "explainer", "void"}
    res = load_json(os.path.join(P, "story", "set_match.json"), {})
    ok |= {i["use"] for i in res.get("items", []) if i.get("use")}
    bad = sorted({s.get("set") for s in shots if s.get("set") and s.get("set") not in ok})
    for b in bad:
        n = [s["id"] for s in shots if s.get("set") == b]
        print(f"UNKNOWN SET  '{b}' in {len(n)} shot(s) ({', '.join(n[:4])}): not in the catalogue, not built in scenes/sets/")
    print(f"shots: {len(shots)} shots, {len({s.get('set') for s in shots})} sets, {len(bad)} unknown.")
    return 1 if bad else 0


# ---------------------------------------------------------------- past videos → wishlist
def scan_projects(cat):
    """Sets past videos built for themselves: the "set" names their shots.json used, grouped across videos."""
    rows = {}
    for P in sorted(glob.glob(os.path.join(ROOT, "projects", "*"))):
        slug = os.path.basename(P)
        used = {s.get("set") for s in load_json(os.path.join(P, "story", "shots.json"), {}).get("shots", []) if s.get("set")}
        for name in used:
            rows.setdefault(name, set()).add(slug)
    out = []
    for name, vids in sorted(rows.items(), key=lambda x: -len(x[1])):
        base = re.sub(r"(Am|Pm|Ev|Night|Day|New|Storm|Set|Mat|Net)$", "", name) or name
        status, e, _ = match_need({"name": camel_words(base)}, "sets", cat)
        if e is not None and e.get("prefer"):
            e = find(cat, e["prefer"]) or e
        out.append((name, sorted(vids), status, e))
    print("| Built in a video | Videos | In the catalogue |\n|---|---|---|")
    for name, vids, status, e in out:
        print(f"| {name} | {len(vids)} | {e['id'] + (' (near)' if status == 'near' else '') if e else '—'} |")
        if status != "have" and len(vids) >= 2:
            for v in vids:
                wish_add(camel_words(name), "built inside past videos", v, "wanted", "scan")
    print(f"\nwishlist: {WISH_PATH}")


# ---------------------------------------------------------------- catalogue checks
def verify_catalog(cat, quiet=False):
    eng = os.path.join(ROOT, "engine")
    src = {os.path.basename(f): open(f, encoding="utf-8").read() for f in glob.glob(os.path.join(eng, "*.js"))}
    exports = set()
    for s in src.values():
        exports |= set(re.findall(r"export\s+(?:function|const|let)\s+(\w+)", s))
        exports |= set(re.findall(r"export\s*\{\s*(\w+)", s))
    rig = src.get("rig3d.js", "")
    m = re.search(r"export const POSES3 = \{(.*?)\n\};", rig, re.S)
    poses = set(re.findall(r"^  (\w+):", m.group(1), re.M)) if m else set()
    bad, ids = [], set()
    for kind in ("sets", "props", "actions", "fx"):
        for e in cat[kind]:
            if e["id"] in ids and kind == "sets":
                bad.append(f"duplicate id {e['id']}")
            ids.add(e["id"])
            call = e.get("call") or (f"T.W.{e['id']}" if kind in ("sets", "props") else "")
            for name in re.findall(r"T\.(?:W\.|act\.|FX3\.)?(\w+)", call):
                if name not in exports:
                    bad.append(f"{kind}/{e['id']}: {name} is not exported by the engine")
            for p in re.findall(r"'(\w+)'", call) if call.startswith("pose") else []:
                if p not in poses:
                    bad.append(f"{kind}/{e['id']}: pose {p} does not exist")
            if kind == "sets" and "demo" not in e:
                bad.append(f"sets/{e['id']}: no demo recipe")
    for b in bad:
        print("CATALOG  " + b)
    if not quiet or bad:
        print(f"catalogue: {sum(len(cat[k]) for k in ('sets', 'props', 'actions', 'fx'))} entries, {len(bad)} problem(s).")
    return 1 if bad else 0


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project")
    ap.add_argument("--script")
    ap.add_argument("--needs")
    ap.add_argument("--decide", action="append", default=[])
    ap.add_argument("--added", action="append", default=[])
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--shots", action="store_true")
    ap.add_argument("--scan-projects", action="store_true")
    ap.add_argument("--verify-catalog", action="store_true")
    ap.add_argument("--list", nargs="?", const="sets")
    ap.add_argument("--root", help="another studio folder for projects/ and channel/ (default: this kit)")
    a = ap.parse_args()
    if a.root:
        global ROOT, WISH_PATH
        ROOT = os.path.abspath(a.root); WISH_PATH = os.path.join(ROOT, "channel", "set_wishlist.json")
    cat = catalog()
    if a.verify_catalog:
        sys.exit(verify_catalog(cat))
    if a.list:
        for e in cat[a.list]:
            print(f"{e['id']:22} {e.get('vi', '')}  [{', '.join(e.get('tags', []))}]")
        return
    if a.scan_projects:
        scan_projects(cat)
        return
    if not a.project:
        ap.error("--project is required")
    P = os.path.abspath(a.project)
    if a.decide:
        decide(P, a.decide, cat)
    if a.added:
        added(P, a.added, cat)
    if a.script or a.needs:
        needs = a.needs or (os.path.join(P, "story", "needs.json") if os.path.exists(os.path.join(P, "story", "needs.json")) else None)
        res = build_report(P, a.script, needs, cat)
        n = {s: sum(1 for i in res["items"] if i["status"] == s) for s in ("have", "near", "missing")}
        print(f"set_match: {n['have']} have, {n['near']} near, {n['missing']} missing; {len(res['found'])} catalogue entries named in the script "
              f"-> {rel(os.path.join(P, 'story', 'set_match.md'))}")
    if a.shots:
        sys.exit(check_shots(P, cat))
    if a.check:
        sys.exit(check(P, cat))
    if a.decide or a.added:
        print(f"decisions saved -> {rel(os.path.join(P, 'story', 'set_match.md'))}")


if __name__ == "__main__":
    main()
