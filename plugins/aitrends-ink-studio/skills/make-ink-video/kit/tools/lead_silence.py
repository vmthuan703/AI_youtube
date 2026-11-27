"""tools/lead_silence.py - add silence before the voice and shift the word/line timings to match (run once, before plan_to_shots).

  python tools/lead_silence.py --project projects/<slug> --sec 0.9

The first shot needs time on screen before the first word (the pilot's s001 was too short at 0 s). Writes input/voiceover.mp3
with the silence in front (the old file is kept as input/voiceover_nolead.mp3) and shifts timeline/words.json + lines.json.
Refuses to run twice (a marker in words.json).
"""
import argparse, json, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--project', required=True); ap.add_argument('--sec', type=float, default=0.9)
    a = ap.parse_args()
    proj = Path(a.project) if Path(a.project).is_absolute() else ROOT / a.project
    wp, lp = proj / 'timeline' / 'words.json', proj / 'timeline' / 'lines.json'
    W = json.loads(wp.read_text(encoding='utf-8'))
    if W.get('leadSilence'):
        sys.exit(f"already shifted by {W['leadSilence']} s; nothing done")
    cfg = json.loads((proj / 'config.json').read_text(encoding='utf-8'))
    vo = proj / cfg.get('voiceover', 'input/voiceover.mp3'); keep = vo.with_name(vo.stem + '_nolead' + vo.suffix)
    shutil.copyfile(vo, keep)
    ms = int(round(a.sec * 1000))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(keep), '-af', f'adelay={ms}:all=1', '-q:a', '2', str(vo)], check=True)
    for w in W['words']:
        w['start'] = round(w['start'] + a.sec, 3); w['end'] = round(w['end'] + a.sec, 3)
    W['leadSilence'] = a.sec
    wp.write_text(json.dumps(W, ensure_ascii=False), encoding='utf-8')
    if lp.exists():
        L = json.loads(lp.read_text(encoding='utf-8'))
        for l in L:
            l['start'] = round(l['start'] + a.sec, 3); l['end'] = round(l['end'] + a.sec, 3)
        lp.write_text(json.dumps(L, ensure_ascii=False, indent=1), encoding='utf-8')
    if cfg.get('duration'):
        cfg['duration'] = round(cfg['duration'] + a.sec, 3)
        (proj / 'config.json').write_text(json.dumps(cfg, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'RESULT ok {a.sec} s of silence added; {len(W["words"])} words shifted; old voice kept as {keep.name}')


if __name__ == '__main__':
    main()
