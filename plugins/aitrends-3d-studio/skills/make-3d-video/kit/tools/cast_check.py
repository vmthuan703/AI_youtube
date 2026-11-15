"""tools/cast_check.py - every character in a project's scenes/cast.js must come from the channel roster (/channel/cast.js).

  python tools/cast_check.py --project projects/my-video

A character passes when it is a roster role, a role of this video in scenes/roles_new.js (2.2), or a roster role with a few changes: `{ ...BESTIE, speaker: 'LILY' }`, `BRO_2`, `[...STUDENTS]`,
or a list whose items all start from a roster role. An outfit written from scratch (`{ top: 'hoodie', color: … }`) fails: pick the nearest role
(references/engine-api/characters.md, Role roster; a second or third girl is CLASSMATE_2 / CLASSMATE_3, background kids are STUDENTS) and change one colour or the hair.
Exit code 1 when something fails.
"""
import argparse, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("--project", required=True); a = ap.parse_args()
roster_src = open(os.path.join(ROOT, "channel", "cast.js"), encoding="utf-8").read()
ROSTER = set(re.findall(r"^export const (\w+)\s*=", roster_src, re.M)) - {"ROLES"}
# 2.2: scenes/roles_new.js holds the roles this video added (export const ASTRONAUT = { ...WORKER, ... };  // role: astronaut).
# Each must spread a roster role first; the cast may then use them like roster roles. tools/promote.py offers them to the roster.
PROJECT_ROLES, bad_new = set(), []
rn = os.path.join(a.project, "scenes", "roles_new.js")
if os.path.exists(rn):
    rsrc = re.sub(r"//[^\n]*", "", open(rn, encoding="utf-8").read())
    rimp = {n.strip().partition(" as ")[2].strip() or n.strip().partition(" as ")[0].strip(): n.strip().partition(" as ")[0].strip()
            for names, frm in re.findall(r"import\s*\{([^}]*)\}\s*from\s*'([^']+)'", rsrc) if frm == "/channel/cast.js" for n in names.split(",") if n.strip()}
    for m in re.finditer(r"^export const (\w+)\s*=\s*\{\s*\.\.\.\s*(\w+)", rsrc, re.M):
        (PROJECT_ROLES.add(m.group(1)) if rimp.get(m.group(2)) in ROSTER else bad_new.append(m.group(1)))
    for n in re.findall(r"^export const (\w+)", rsrc, re.M):
        if n not in PROJECT_ROLES and n not in bad_new: bad_new.append(n)
    for n in bad_new: print(f"FAIL  {n:<14} roles_new.js: start the role from a roster role imported from /channel/cast.js ({{ ...WORKER, ... }})")
src = open(os.path.join(a.project, "scenes", "cast.js"), encoding="utf-8").read()
src = re.sub(r"//[^\n]*", "", src)
imp = {}
for names, frm in re.findall(r"import\s*\{([^}]*)\}\s*from\s*'([^']+)'", src):
    for n in names.split(","):
        n = n.strip()
        if not n: continue
        orig, _, alias = n.partition(" as ")
        imp[(alias or orig).strip()] = (orig.strip(), frm)
local = {}
for m in re.finditer(r"^export const (\w+)\s*=\s*", src, re.M):
    i = m.end(); depth = 0; j = i
    while j < len(src):
        c = src[j]
        if c in "{[(": depth += 1
        elif c in "}])": depth -= 1
        elif c == ";" and depth == 0: break
        j += 1
    local[m.group(1)] = src[i:j].strip()

def base_ok(expr, seen=()):
    expr = expr.strip()
    if re.fullmatch(r"\w+", expr):
        if expr in imp:
            orig, frm = imp[expr]
            if frm.endswith("roles_new.js"): return orig in PROJECT_ROLES   # 2.2: a role this video defined from a roster base
            return frm == "/channel/cast.js" and orig in ROSTER
        if expr in local and expr not in seen: return base_ok(local[expr], seen + (expr,))
        return False
    m = re.match(r"\{\s*\.\.\.\s*(\w+)", expr)
    if m: return base_ok(m.group(1), seen)
    if expr.startswith("["):
        items = split_top(expr[1:-1]); return bool(items) and all(base_ok(re.sub(r"^\.\.\.", "", it.strip()), seen) for it in items if it.strip())
    return False

def split_top(s):
    out, depth, cur = [], 0, ""
    for c in s:
        if c in "{[(": depth += 1
        if c in "}])": depth -= 1
        if c == "," and depth == 0: out.append(cur); cur = ""
        else: cur += c
    if cur.strip(): out.append(cur)
    return out

bad = 0
for name, expr in local.items():
    ok = base_ok(expr)
    if not ok: bad += 1
    print(f"{'PASS' if ok else 'FAIL'}  {name:<14} {expr[:70].replace(chr(10), ' ')}")
print(f"{len(local) - bad}/{len(local)} characters come from the roster." + ("" if not bad else "  Dress the FAIL ones from a roster role (references/engine-api/characters.md, Role roster)."))
if PROJECT_ROLES: print(f"{len(PROJECT_ROLES)} project role(s) from roles_new.js: {', '.join(sorted(PROJECT_ROLES))} (promote.py offers them to the roster after the video)")
sys.exit(1 if bad or bad_new else 0)
