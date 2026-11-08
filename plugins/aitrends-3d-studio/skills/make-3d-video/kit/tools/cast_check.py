"""tools/cast_check.py - every character in a project's scenes/cast.js must come from the channel roster (/channel/cast.js).

  python tools/cast_check.py --project projects/my-video

A character passes when it is a roster role or a roster role with a few changes: `{ ...BESTIE, speaker: 'LILY' }`, `BRO_2`, `[...STUDENTS]`,
or a list whose items all start from a roster role. An outfit written from scratch (`{ top: 'hoodie', color: … }`) fails: pick the nearest role
(engine-api.md, Role roster; a second or third girl is CLASSMATE_2 / CLASSMATE_3, background kids are STUDENTS) and change one colour or the hair.
Exit code 1 when something fails.
"""
import argparse, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("--project", required=True); a = ap.parse_args()
roster_src = open(os.path.join(ROOT, "channel", "cast.js"), encoding="utf-8").read()
ROSTER = set(re.findall(r"^export const (\w+)\s*=", roster_src, re.M)) - {"ROLES"}
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
        if expr in imp: return imp[expr][1] == "/channel/cast.js" and imp[expr][0] in ROSTER
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
print(f"{len(local) - bad}/{len(local)} characters come from the roster." + ("" if not bad else "  Dress the FAIL ones from a roster role (engine-api.md, Role roster)."))
sys.exit(1 if bad else 0)
