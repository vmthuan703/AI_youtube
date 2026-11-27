"""tools/rules_check.py - the Ink Pastel rulebook (rules/RULES.md, rules/rules.json) applied to one project.

  python tools/rules_check.py --project projects/<slug> --plan   # Stage 4: tag shots.json with rule ids, print only the rules each shot needs
  python tools/rules_check.py --project projects/<slug>          # before render: rule helpers missing in shot code + open director notes

Short output on purpose: the main conversation reads it, the shot builders read only their shots' lines.
"""
import argparse, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load(p, default=None):
    p = Path(p)
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else default


def shot_text(shot, words):
    said = ' '.join(w['word'] for w in words if shot['start'] <= w['start'] < shot['end'])
    return f"{said} {shot.get('scene', '')} {shot.get('line', '')}".lower()


def shot_code(proj):
    """{shot id: its source text} from every scenes/**/*.js (registerShot('id', ...) up to the next registerShot)."""
    code = {}
    for f in (proj / 'scenes').rglob('*.js'):
        src = f.read_text(encoding='utf-8')
        marks = [(m.start(), m.group(1)) for m in re.finditer(r"registerShot\(\s*['\"]([\w-]+)['\"]", src)]
        for i, (pos, sid) in enumerate(marks):
            code[sid] = code.get(sid, '') + src[pos: marks[i + 1][0] if i + 1 < len(marks) else len(src)]
        for m in re.finditer(r"const\s+(\w+)\s*=\s*\(id[^)]*\)\s*=>\s*registerShot", src):   # helpers like black('s08')
            for c in re.finditer(m.group(1) + r"\(\s*['\"]([\w-]+)['\"]", src):
                code[c.group(1)] = code.get(c.group(1), '') + src[m.start(): m.start() + 600]
    # table-driven shots: wrapper calls like auto('s045', {...}) / bk('s054', {...}). A shot's code is its call text plus the bodies
    # of the functions and constants that text names (two levels deep), so helpers such as DUST = (s, T) => T.CQ.scar(...) count.
    defs, calls = {}, []
    for f in (proj / 'scenes').rglob('*.js'):
        src = f.read_text(encoding='utf-8')
        for m in re.finditer(r"(?:function\s+(\w+)\s*\(|const\s+(\w+)\s*=)", src):
            defs.setdefault(m.group(1) or m.group(2), src[m.start(): m.start() + 2500])
        marks = [(m.start(), m.group(1), m.group(2)) for m in re.finditer(r"\b(\w+)\(\s*['\"](s\d{3})['\"]", src) if m.group(1) != 'registerShot']
        for i, (pos, fn, sid) in enumerate(marks):
            calls.append((sid, src[pos: marks[i + 1][0] if i + 1 < len(marks) else len(src)]))
    names = lambda txt: set(re.findall(r"\b([A-Za-z_]\w*)\b", txt)) & defs.keys()
    for sid, txt in calls:
        lvl1 = names(txt); body = ''.join(defs[n] for n in lvl1)
        lvl2 = names(body) - lvl1; body += ''.join(defs[n] for n in lvl2)
        code[sid] = code.get(sid, '') + txt + body
    return code


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser()
    ap.add_argument('--project', required=True)
    ap.add_argument('--plan', action='store_true')
    a = ap.parse_args()
    proj = Path(a.project) if Path(a.project).is_absolute() else ROOT / a.project
    rules = load(ROOT / 'rules' / 'rules.json')['rules']
    byid = {r['id']: r for r in rules}
    shots_p = proj / 'story' / 'shots.json'
    data = load(shots_p)
    words = (load(proj / 'timeline' / 'words.json', {}) or {}).get('words', [])
    notes = (load(proj / 'story' / 'notes.json', {}) or {}).get('notes', [])

    if a.plan:
        used, hit_sets = set(), set()
        for s in data['shots']:
            txt, ids = shot_text(s, words), []
            for r in rules:
                if r.get('triggers') and any(re.search(t, txt, re.I) for t in r['triggers']):
                    ids.append(r['id'])
            if 'R01' in ids and s.get('set'):
                hit_sets.add(s['set'])
            elif s.get('set') in hit_sets and 'R02' in byid:
                ids.append('R02')
            keep = [x for x in s.get('rules', []) if x not in byid or x in ids or x.endswith('!')]   # hand-added ids stay
            s['rules'] = sorted(set(keep + ids))
            used.update(s['rules'])
            if s['rules']:
                print(f"{s['id']:>5} {s['start']:6.2f}s  {', '.join(s['rules'])}")
        shots_p.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding='utf-8')
        print('\nRules this video needs (read only these lines of rules/RULES.md):')
        for r in rules:
            if r['id'] in used or r.get('global'):
                print(f"  {r['id']} {r['name']}: {r['must']}" + (f"  [{' | '.join(r['helper'])}]" if r.get('helper') else ''))
        return

    code, bad = shot_code(proj), []
    for s in data['shots']:
        for rid in s.get('rules', []):
            r = byid.get(rid.rstrip('!'))
            if not r or not r.get('helper') or rid.endswith('!'):
                continue
            if not any(h in code.get(s['id'], '') for h in r['helper']):
                bad.append(f"{s['id']}: {rid} {r['name']} - no {' / '.join(r['helper'])} in the shot code")
    open_notes = [n for n in notes if n.get('status', 'open') == 'open']
    for line in bad:
        print('MISSING', line)
    for n in open_notes:
        print(f"NOTE    {n.get('shot', '?')} {n.get('t', 0):.1f}s [{n.get('scope', 'shot')}/{n.get('kind', '')}] {n.get('text', '')}")
    print(f"RESULT {'ok' if not bad and not open_notes else 'look'} rules: {len(bad)} missing, notes: {len(open_notes)} open")
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
