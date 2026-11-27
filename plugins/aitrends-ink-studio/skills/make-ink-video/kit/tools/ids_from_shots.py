"""tools/ids_from_shots.py - write scenes/_ids.js ([id, plan line p, split]) from story/shots.json, for shot files keyed by plan line.

  python tools/ids_from_shots.py --project projects/<slug>   [--check]  (--check: list plan lines no shot file defines)
"""
import argparse, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser(); ap.add_argument('--project', required=True); ap.add_argument('--check', action='store_true'); a = ap.parse_args()
proj = ROOT / a.project
shots = json.loads((proj / 'story' / 'shots.json').read_text(encoding='utf-8'))['shots']
rows = [[s['id'], s['p'], bool(s.get('split'))] for s in shots]
(proj / 'scenes' / '_ids.js').write_text('// made by tools/ids_from_shots.py from story/shots.json: [id, plan line, split]\nexport const IDS = ' + json.dumps(rows) + ';\n', encoding='utf-8')
print(f'{len(rows)} shots -> scenes/_ids.js')
if a.check:
    src = ''.join(p.read_text(encoding='utf-8') for p in (proj / 'scenes' / 'shots').glob('*.js'))
    have = {int(m) for m in re.findall(r'\b[SD]\[(\d+)\]\s*=', src)}
    miss = sorted({p for _, p, _ in rows} - have)
    print('plan lines without a spec:', miss or 'none')
