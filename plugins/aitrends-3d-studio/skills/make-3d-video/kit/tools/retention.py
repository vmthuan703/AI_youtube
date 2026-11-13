"""tools/retention.py — 2.0: will this script hold a viewer? Scores the first 10 seconds and every 30-second window BEFORE the voiceover.
It never edits the script.

  python tools/retention.py --script scripts/x_VO.txt [--wpm 165] [--out build_voice/x/retention.md]
  python tools/retention.py --hooks build_voice/x/hooks.txt        # rank candidate openings (blocks separated by a line with ---)

Each window gets 0-10 from signals that keep people watching in this genre: a turn in the story (but / suddenly / until), a question
or an open loop, a concrete number, a voice other than the narrator, something at stake, short sentences. A window under 5 is FLAT:
the report says what is missing and what to add. The hook is scored on the first ~28 words (10 s at 165 words/min).
"""
import argparse, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script_check import parse, NUMBER, STAKES, FUTURE   # noqa: E402

TURN = re.compile(r"\b(but|until|suddenly|then|instead|except|only|still|however|that's when|and then|turns out|wrong|worse)\b", re.I)
OPEN = re.compile(r"\?|\b(you don't know|what you don't|nobody knows|no one knows|not yet|there's a catch|one problem|what happens (if|when)|why|how)\b", re.I)
DANGER = re.compile(r"\b(lose|lost|die|dead|caught|expelled|fired|secret|never|forever|last chance|too late|can't|cannot|hurt|broke|alone|gone|risk|price|cost|catch)\b", re.I)
SENSE = re.compile(r"\b(see|hear|feel|watch|look|scream|whisper|run|grab|slam|drop|freeze|shake|stare|laugh|cry|smile)\w*\b", re.I)
YOU = re.compile(r"\byou(r|'re|'ve|'ll)?\b", re.I)
INTRO = re.compile(r"\b(your name is|years? old|welcome|in this video|today we|hey guys|let me tell you|once upon)\b", re.I)


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def score_window(words, lines):
    text = " ".join(words)
    n = max(1, len(words))
    sents = sentences(text)
    avg = n / max(1, len(sents))
    turns, opens, nums = len(TURN.findall(text)), len(OPEN.findall(text)), len(NUMBER.findall(text))
    stakes = len(STAKES.findall(text)) + len(DANGER.findall(text)) + len(FUTURE.findall(text))
    voices = len({sp for sp, _ in lines if sp != "NARRATOR"})
    parts = {
        "turn": min(2.5, turns * 0.9),
        "question": min(2.0, opens * 1.0),
        "stakes": min(2.0, stakes * 0.7),
        "number": min(1.0, nums * 0.5),
        "voice": min(1.5, voices * 0.8),
        "pace": 1.0 if avg <= 13 else 0.5 if avg <= 18 else 0.0,
    }
    return round(sum(parts.values()), 1), parts, avg


ADVICE = {"turn": "add a turn (but / until / suddenly): something must change in these 30 s",
          "question": "open a loop: a question or a thing the viewer has not been told yet",
          "stakes": "say what can be lost, or the deadline",
          "number": "put one concrete number on it",
          "voice": "let a character speak (a line of dialogue)",
          "pace": "cut the long sentences in two"}


def score_hook(text):
    words = text.split()[:28]
    t = " ".join(words)
    checks = [
        ("speaks to the viewer (you)", bool(YOU.search(t)), 2.0),
        ("something at stake or a catch", bool(DANGER.search(t) or STAKES.search(t)), 2.0),
        ("an open question", bool(OPEN.search(t)), 2.0),
        ("a concrete number or thing", bool(NUMBER.search(t)), 1.0),
        ("an action you can picture", bool(SENSE.search(t)), 1.5),
        ("no slow intro (name, age, welcome)", not INTRO.search(t), 1.5),
    ]
    return round(sum(w for _, ok, w in checks if ok), 1), checks, t


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script"); ap.add_argument("--hooks"); ap.add_argument("--wpm", type=float, default=165); ap.add_argument("--out")
    a = ap.parse_args()
    out = []
    if a.hooks:
        blocks = [b.strip() for b in re.split(r"^\s*---+\s*$", open(a.hooks, encoding="utf-8").read(), flags=re.M) if b.strip()]
        ranked = sorted(((score_hook(re.sub(r"^[A-Z ]+:\s*", "", b, flags=re.M)), i) for i, b in enumerate(blocks)), key=lambda x: -x[0][0])
        out.append("# Hook ranking (first 10 seconds)\n")
        for (sc, checks, t), i in ranked:
            miss = [n for n, ok, _ in checks if not ok]
            out.append(f"- **Hook {i + 1}: {sc}/10** — \"{t}...\"" + (f"\n  - missing: {'; '.join(miss)}" if miss else ""))
        out.append(f"\nBEST: hook {ranked[0][1] + 1}")
    if a.script:
        lines = parse(a.script)
        flat_words, owner = [], []
        for i, (sp, tx) in enumerate(lines):
            for w in tx.split():
                flat_words.append(w); owner.append(i)
        per = int(a.wpm / 2)
        sc, checks, t = score_hook(" ".join(flat_words))
        out.append(f"# Retention check ({len(flat_words)} words, about {len(flat_words) / a.wpm:.1f} min at {a.wpm:.0f} words/min)\n")
        out.append(f"## Hook (first 10 s): {sc}/10 {'PASS' if sc >= 7 else 'LOOK'}\n\"{t}...\"")
        out += [f"- {'ok  ' if ok else 'MISS'} {n}" for n, ok, _ in checks]
        out.append("\n## Every 30 seconds\n| time | score | weakest | first words |\n|---|---|---|---|")
        flat, scores = [], []
        for k in range(0, len(flat_words), per):
            ws = flat_words[k:k + per]
            if len(ws) < per * 0.4 and k:
                break
            ls = [lines[j] for j in sorted(set(owner[k:k + per]))]
            s, parts, avg = score_window(ws, ls)
            weak = sorted(parts, key=lambda p: parts[p])[:2]
            t0 = k / a.wpm * 60
            tag = "FLAT" if s < 5 else ""
            scores.append(s)
            out.append(f"| {int(t0 // 60)}:{int(t0 % 60):02d} | {s} {tag} | {', '.join(weak)} | {' '.join(ws[:8])}... |")
            if s < 5:
                flat.append((t0, weak))
        avg_s = sum(scores) / max(1, len(scores))
        out.append(f"\nAverage {avg_s:.1f}/10; {len(flat)} flat window(s) of {len(scores)}.")
        for t0, weak in flat:
            out.append(f"- {int(t0 // 60)}:{int(t0 % 60):02d}: " + "; ".join(ADVICE[w] for w in weak))
        out.append(f"\nRESULT: {'PASS' if sc >= 7 and len(flat) <= max(1, len(scores) // 6) else 'LOOK'} (hook {sc}/10, flat {len(flat)}/{len(scores)})")
    if not out:
        ap.error("give --script or --hooks")
    text = "\n".join(out)
    if a.out:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        open(a.out, "w", encoding="utf-8").write(text + "\n")
    sys.stdout.reconfigure(encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
