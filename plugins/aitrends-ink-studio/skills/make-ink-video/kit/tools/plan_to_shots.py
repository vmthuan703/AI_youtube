"""tools/plan_to_shots.py - Ink Pastel Stage 4: a written shot plan + the voice's word timings -> story/shots.json.

  python tools/plan_to_shots.py --project projects/<slug> --plan scripts/<x>_plan.txt [--cpm 25]

Plan lines: para | anchor | set | cam | scene   (para = paragraph index of the VO script, anchor = words the shot starts on, "^" = paragraph start).
Cuts land on the anchor word (0.06 s early), so they fall mid-sentence wherever the picture changes, as in the reference style.
Then the longest shots are split at the word nearest their middle (a tighter framing of the same scene) until the video reaches
--cpm cuts per minute. Prints the pacing numbers; rules are tagged afterwards by tools/rules_check.py --plan.
"""
import argparse, json, re, statistics, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOOK = {'RUIN': 'inkRuin', 'FIELD': 'inkRuin', 'PARK': 'inkRuin', 'SKY': 'inkRuin', 'SEWER': 'inkDark', 'BUNKER_N': 'inkDark',
        'CTRL': 'inkDark', 'DOOR_N': 'inkDark', 'BUNKER': 'inkWarm',
        'SHELTER': 'inkWarm', 'STAIR': 'inkWarm', 'OUT': 'inkRuin', 'DEPOT': 'inkRuin', 'RAIN': 'inkDark', 'MODERN': 'inkDay'}
TIGHTER = {'wide': 'med', 'low': 'med', 'track': 'med', 'med': 'cu', 'ots': 'cu', 'cu': 'xcu', 'top': 'med', 'pov': 'cu', 'hud': 'cu',
           'insert': 'insert', 'xcu': 'cu', 'card': 'card', 'black': 'black'}
norm = lambda s: re.sub(r"[^a-z0-9'-]", '', s.lower())


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser()
    ap.add_argument('--project', required=True); ap.add_argument('--plan', required=True)
    ap.add_argument('--cpm', type=float, default=25)
    a = ap.parse_args()
    proj = ROOT / a.project
    W = json.loads((proj / 'timeline' / 'words.json').read_text(encoding='utf-8'))['words']
    L = json.loads((proj / 'timeline' / 'lines.json').read_text(encoding='utf-8'))
    for w in W: w['n'] = norm(w['word'])
    plan = [[x.strip() for x in l.split('|')] for l in (ROOT / a.plan).read_text(encoding='utf-8').splitlines() if l.strip() and not l.startswith('#')]

    shots, last_para, cursor = [], None, 0
    for para, anchor, st, cam, scene in plan:
        line = L[int(para)]
        lw = [i for i, w in enumerate(W) if line['start'] - 0.05 <= w['start'] <= line['end'] + 0.05]
        if not lw: sys.exit(f'no words for paragraph {para}')
        if para != last_para: cursor = lw[0]
        last_para = para
        if anchor == '^':
            idx = lw[0]
        else:
            toks = [norm(t) for t in anchor.split()]
            idx = next((i for i in range(cursor, lw[-1] + 1) if [W[j]['n'] for j in range(i, min(i + len(toks), len(W)))] == toks), None)
            if idx is None: sys.exit(f'anchor not found in paragraph {para}: "{anchor}"')
        cursor = idx + 1
        shots.append({'start': max(0.0, W[idx]['start'] - 0.06), 'set': st, 'camera': cam, 'scene': scene, 'w0': idx, 'p': len(shots)})   # p = plan line index (0-based, comments skipped)
    shots[0]['start'] = 0.0
    end = W[-1]['end'] + 1.6
    for i, s in enumerate(shots): s['end'] = shots[i + 1]['start'] if i + 1 < len(shots) else end

    # split the longest shots at the word nearest their middle until the cut rate is reached
    def split_one():
        for s in sorted(shots, key=lambda s: s['end'] - s['start'], reverse=True):
            if s['end'] - s['start'] < 2.6 or s['camera'] in ('black',): continue
            mid = (s['start'] + s['end']) / 2
            cand = [w for w in W if s['start'] + 0.9 < w['start'] < s['end'] - 0.9]
            if not cand: continue
            w = min(cand, key=lambda w: abs(w['start'] - mid)); t = w['start'] - 0.06
            new = {**s, 'start': t, 'camera': TIGHTER.get(s['camera'], s['camera']), 'scene': s['scene'] + ' (closer)', 'split': True}
            s['end'] = t; shots.insert(shots.index(s) + 1, new); return True
        return False
    while len(shots) / end * 60 < a.cpm and split_one():
        pass

    out = []
    for i, s in enumerate(shots):
        said = ' '.join(w['word'] for w in W if s['start'] <= w['start'] < s['end'])
        kind2d = s['set'] in ('BLACK', 'CARD', 'LAB', 'POWER')
        out.append({'id': f's{i + 1:03d}', 'start': round(s['start'], 3), 'end': round(s['end'], 3), 'line': said, 'scene': s['scene'], 'set': s['set'],
                    'camera': s['camera'], 'look': None if kind2d else LOOK.get(s['set']), 'p': s['p'], **({'split': True} if s.get('split') else {})})
    old = json.loads((proj / 'story' / 'shots.json').read_text(encoding='utf-8')) if (proj / 'story' / 'shots.json').exists() else {}
    data = {'title': old.get('title', proj.name), 'duration': round(end, 3), 'shots': out, 'music': old.get('music', [])}
    (proj / 'story' / 'shots.json').write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding='utf-8')
    d = [s['end'] - s['start'] for s in out]
    print(f"{len(out)} shots in {end:.1f} s = {len(out) / end * 60:.1f} cuts/min; median {statistics.median(d):.2f} s; "
          f"under 1 s {sum(x < 1 for x in d) / len(d) * 100:.0f}%; longest {max(d):.1f} s ({out[d.index(max(d))]['id']})")
    from collections import Counter
    print('sets:', dict(Counter(s['set'] for s in out))); print('cams:', dict(Counter(s['camera'] for s in out)))


if __name__ == '__main__':
    main()
