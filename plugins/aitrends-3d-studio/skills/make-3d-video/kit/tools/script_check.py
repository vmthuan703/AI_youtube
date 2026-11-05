"""tools/script_check.py — read a script BEFORE the voiceover and list what is worth a second look. It never edits the script.

  python tools/script_check.py --script scripts/x_VO.txt [--title "What If You Could ..."] [--wpm 165] [--out build_voice/x/script_check.md]

The checks come from measuring six long reference videos of the genre (see references/story-breakdown.md). They are a template
that worked for one channel, not rules: the writer decides. Each result is PASS, LOOK (worth checking) or MISS (absent).
"""
import argparse, json, os, re, sys

FUTURE = re.compile(r"\b(from now|by (sunrise|morning|midnight|monday|friday|the end|tomorrow|next)|one day|someday|you'll|you will|will (be|end|cost|take|have)|in (\w+|\d+) (hours?|days?|weeks?|months?|years?)|before (this|the) (night|week|day|year) (is|ends))\b", re.I)
PIVOT = re.compile(r"(?:^|[.!?]\s+)(?:(?:but|and|for)\s+)?(?:right\s+)?now\b|(?:^|[.!?]\s+)but (?:first|tonight)\b", re.I)
STAKES = re.compile(r"\b(stops being|collects|the catch|costs? you|that's when|the price|the problem)\b", re.I)
INSCENE = re.compile(r"(^|[.!?]\s+)See,|\b(a normal person|most people|normal (guy|person)|the average person)\b", re.I)
NUMBER = re.compile(r"\b(\d[\d,.]*|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|fifty|hundred|thousand|million|billion|percent)\b", re.I)
VIEWERQ = re.compile(r"\b(would you|what would you|so,? would|will you|could you|which would)\b[^?]*\?", re.I)
COMMENTS = re.compile(r"\b(comment|comments)\b", re.I)
SUBSCRIBE = re.compile(r"\b(subscribe|like and)\b", re.I)
CALLBACK = re.compile(r"\bif you('d| would)\b", re.I)
MYSTERY = re.compile(r"\b(stranger|unknown|don't know|someone|somebody|a letter|a knock|a number|a woman|a man|a new|phone number|black car|wanna|want it back|been watching)\b", re.I)


def parse(path):
    """Tagged script -> [(speaker, text)]. Plain text counts as narration."""
    out = []
    for raw in open(path, encoding="utf-8").read().splitlines():
        s = raw.strip()
        if not s or s.startswith("#"):
            continue
        m = re.match(r"^([A-Z][A-Z0-9 .'_-]{1,28})(\s*\([^)]*\))?:\s*(.+)$", s)
        out.append((m.group(1).strip(), m.group(3).strip()) if m else ("NARRATOR", s))
    return out


def sentences(text):
    return [x.strip() for x in re.split(r"(?<=[.!?])\s+", text) if x.strip()]


def check(lines, title, wpm):
    text = " ".join(t for _, t in lines)
    words = text.split()
    n = len(words)
    sec = n / wpm * 60
    upto = lambda seconds: " ".join(words[: int(seconds / 60 * wpm)])
    narr = [t for s, t in lines if s == "NARRATOR"]
    first = sentences(narr[0])[0] if narr else ""
    R = []

    def add(key, state, found, hint=""):
        R.append({"check": key, "state": state, "found": found, "hint": hint})

    # opening
    low = first.lower()
    if low.startswith("what if"):
        add("Opening line", "MISS", first[:70], "Open in the middle of one physical moment; references never open with the question.")
    elif re.match(r"^(you|your)\b", low):
        add("Opening line", "PASS", first[:70])
    else:
        add("Opening line", "LOOK", first[:70], "All six references start with \"You\" plus an action. A concrete action without \"you\" can still work.")
    # title read aloud
    head = upto(100)
    spoken = None
    m = re.search(r"[^.!?]*\bwhat if\b[^.!?]*[.!?]", head, re.I)
    if m:
        spoken = m.group(0).strip()
    add("Title stays on screen", "LOOK" if spoken else "PASS", spoken[:70] if spoken else "not read in the first 100 s",
        "References show the title as a silent card (0:30-1:15) and never read it. Consider cutting this sentence." if spoken else "")
    # flash-forward + pivot
    fm = FUTURE.search(upto(70))
    add("Flash-forward", "PASS" if fm else "MISS", f"\"{fm.group(0)}\"" if fm else "none in the first 70 s", "" if fm else "Between about 0:20 and 1:05 tell what this will turn into: the big win and the danger.")
    pm = PIVOT.search(upto(90))
    add("Back to right now", "PASS" if pm else "MISS", f"\"{pm.group(0)}\"" if pm else "none in the first 90 s", "" if pm else "One line that drops back to the small present moment after the flash-forward.")
    sm = STAKES.search(upto(120))
    add("Cost is hinted early", "PASS" if sm else "LOOK", f"\"{sm.group(0)}\"" if sm else "no clear hint in the first 2 min", "" if sm else "A short line that promises the power has a price.")
    # middle
    inscene = len(INSCENE.findall(text))
    add("Science told inside the scene", "PASS" if inscene >= 2 else "LOOK", f"{inscene} marker(s)", "" if inscene >= 2 else "Explain from inside the moment, often against what a normal person can do.")
    nums = len(NUMBER.findall(text)) / max(sec / 60, 0.1)
    add("Concrete numbers", "PASS" if nums >= 6 else "LOOK", f"{nums:.1f} per minute (references 7-9)", "" if nums >= 6 else "Swap vague words for numbers the screen can show.")
    sl = [len(s.split()) for s in sentences(text)]
    avg, short = sum(sl) / max(len(sl), 1), 100 * sum(x <= 6 for x in sl) / max(len(sl), 1)
    add("Short sentences", "PASS" if 5.5 <= avg <= 9 and short >= 45 else "LOOK", f"average {avg:.1f} words, {short:.0f}% at 6 words or fewer (references 6.0-8.4, 51-70%)")
    # ending
    tail = " ".join(words[-120:])
    last = " ".join(words[-55:])
    vq = VIEWERQ.search(last)
    add("Question to the viewer", "PASS" if vq else "MISS", vq.group(0)[:70] if vq else "none", "" if vq else "End on one question the viewer can answer in the comments.")
    add("Comment call", "PASS" if COMMENTS.search(last) else "MISS", "found" if COMMENTS.search(last) else "none")
    subs = SUBSCRIBE.search(last)
    add("Like and subscribe call", "PASS" if subs else "LOOK", "found" if subs else "none", "" if subs else "References close with one line asking for it. Use the channel's own wording.")
    cb = CALLBACK.search(last)
    add("Call ties back to the story", "PASS" if cb else "LOOK", "found" if cb else "none", "" if cb else "Name one decision from this story in the call, so it reads as part of the ending.")
    my = MYSTERY.search(tail)
    add("New mystery at the end", "PASS" if my else "LOOK", f"\"{my.group(0)}\"" if my else "none detected", "" if my else "A last small twist that opens a sequel: a stranger, a message, an offer.")
    # length
    state = "PASS" if 1500 <= n <= 1850 else "LOOK"
    add("Length", state, f"{n} words, about {sec / 60:.1f} min at {wpm} words/min", "" if state == "PASS" else "References run 1,730-1,800 words; the channel plan asks for 1,500-1,650. Under 1,500 is short of both.")
    return R


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--script", required=True)
    ap.add_argument("--title", default="")
    ap.add_argument("--wpm", type=float, default=165)
    ap.add_argument("--out")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    if not os.path.exists(a.script):
        sys.exit(f"script not found: {a.script}")
    R = check(parse(a.script), a.title, a.wpm)
    if a.json:
        print(json.dumps(R, ensure_ascii=False, indent=1))
    rows = ["| Check | Result | Found | Worth considering |", "|---|---|---|---|"]
    for r in R:
        rows.append(f"| {r['check']} | {r['state']} | {r['found'].replace('|', ' ')} | {r['hint']} |")
    md = "# Script check (nothing was changed)\n\n" + "\n".join(rows) + "\n"
    if a.out:
        os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
        open(a.out, "w", encoding="utf-8").write(md)
    if not a.json:
        print(md)
    miss = sum(r["state"] == "MISS" for r in R)
    look = sum(r["state"] == "LOOK" for r in R)
    print(f"{len(R) - miss - look} pass, {look} to look at, {miss} missing. The script was not edited.")


if __name__ == "__main__":
    main()
