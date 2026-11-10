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
HERO_NAME = re.compile(r"\byour name is ([A-Z][a-z]+)", re.I)
WEEKDAY = re.compile(r"\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b", re.I)
TIMEJUMP = re.compile(r"\b(next|following|a week later|weeks? later|days? later|later that|that week|last)\b", re.I)
DAYMARK = re.compile(r"\bday ([a-z-]+|\d+)\b", re.I)
DEADLINE = re.compile(r"\b([a-z-]+|\d+) days to\b|\bin ([a-z-]+|\d+) days\b", re.I)
SETUP = re.compile(r"\b(asks?|asked|wonders?|wants to know)\b|\?$", re.I)
# Names that read as female to a young English-speaking audience. The channel hero is a boy, so these names clash with him on screen.
FEMALE_NAMES = set("ava emma olivia sophia sophie mia isabella amelia harper evelyn abigail emily ella elizabeth chloe grace lily zoe "
                   "nora riley hannah lucy anna leah sarah sara maya stella violet hazel aurora ruby alice lena tess jade ivy "
                   "clara mila luna nova willow layla zoey madison aria scarlett penelope camila natalie audrey bella eva rose "
                   "julia kate katie molly paige jenna megan amy rachel jessica ashley lauren sofia".split())
NUM = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen "
                                  "seventeen eighteen nineteen".split())}
NUM.update({"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90, "hundred": 100})


def num(word):
    """'nine' -> 9, 'twenty-two' -> 22, '30' -> 30, anything else -> None."""
    w = word.lower().strip("-")
    if w.isdigit():
        return int(w)
    parts = w.split("-")
    if all(p in NUM for p in parts):
        return sum(NUM[p] for p in parts)
    return None


RULE_LINE = r"\bhere'?s (the rule|how (it|this) works)\b|\bhere is (the rule|how (it|this) works)\b"
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
    # opening rules from the 2026-11-11 retention review (prompts/QUY_TAC_VIET_SCRIPT_KENH.md, section 1b)
    def word_at(pattern):
        m_ = re.search(pattern, text, re.I)
        return len(text[: m_.start()].split()) if m_ else None
    rule_at = word_at(RULE_LINE)
    add("Rule stated early", "PASS" if rule_at is not None and rule_at <= 70 else ("LOOK" if rule_at is not None else "MISS"),
        f"starts at word {rule_at} (about {rule_at / wpm * 60:.0f} s)" if rule_at is not None else "no \"Here's the rule\" line found",
        "" if rule_at is not None and rule_at <= 70 else "State the rule before word 70 (about 26 s). Retention fell to 45% at 0:30 when it came after word 105.")
    intro = next((t for t in narr if HERO_NAME.search(t)), "")
    im = HERO_NAME.search(intro)
    intro_words = len(intro[im.start():].split()) if im else None
    if intro_words is not None:
        add("Name, age and flash-forward are short", "PASS" if intro_words <= 25 else "LOOK", f"{intro_words} words from \"Your name is\" to the end of that line",
            "" if intro_words <= 25 else "Keep the name, age and \"N days from now\" part to 25 words or fewer, next to the rule, not between the demo and the rule.")
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
    # cast: the hero on screen is the channel's boy in the lime puffer; the best friend is a girl
    hm = HERO_NAME.search(" ".join(narr))
    if hm and hm.group(1).lower() in FEMALE_NAMES:
        add("Hero name fits the hero", "MISS", f"\"Your name is {hm.group(1)}\"",
            "The channel hero is a boy, and this name reads as a girl's. Use a boy's name, he/him for the hero, and a girl as the best friend.")
    else:
        add("Hero name fits the hero", "LOOK", f"\"Your name is {hm.group(1)}\"" if hm else "no \"Your name is ...\" line",
            "Check: a boy's name and he/him for the hero, a girl as the best friend, and the cast table matches the script.")
    # story calendar: weekdays should move forward unless a line marks the jump
    seq, back = [], []
    order = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for s in sentences(" ".join(narr)):
        for m in WEEKDAY.finditer(s):
            d = m.group(1).lower()
            if seq and order.index(d) <= order.index(seq[-1][0]) and not TIMEJUMP.search(s):
                back.append(f"{seq[-1][0].title()}→{d.title()}")
            seq.append((d, s))
    if seq:
        add("Weekdays run in order", "LOOK" if back else "PASS", " → ".join(d.title() for d, _ in seq)[:120],
            ("Goes back or wraps without a time-jump line: " + ", ".join(back) + ". Add \"next week\" / \"a week later\" or reorder.") if back else "")
    # story calendar: "Day N" markers rise, and a "N days to ..." deadline lands on the day the event happens
    days = [(num(m.group(1)), m.start()) for m in DAYMARK.finditer(" ".join(narr))]
    days = [(d, at) for d, at in days if d is not None]
    probs = [f"Day {a}→Day {b}" for (a, _), (b, _) in zip(days, days[1:]) if b < a]
    for m in DEADLINE.finditer(" ".join(narr)):
        n_ = num(m.group(1) or m.group(2))
        before = [d for d, at in days if at < m.start()]
        if n_ and before:
            due, last = before[-1] + n_, max(d for d, _ in days)
            if last < due:
                probs.append(f"{n_}-day deadline set on Day {before[-1]} ends Day {due}, but the story's last marker is Day {last}")
    probs = list(dict.fromkeys(probs))
    if days:
        add("Day count adds up", "MISS" if probs else "PASS", ", ".join(f"Day {d}" for d, _ in days)[:120],
            ("; ".join(probs) + ". Use one day count for the whole story.") if probs else "")
    # punchlines: a 1-4 word answer right after a setup is easy to miss when spoken ("You say YouTube.")
    tiny = []
    for t_ in narr:
        ss = sentences(t_)
        for a_, b_ in zip(ss, ss[1:]):
            if len(b_.split()) <= 4 and SETUP.search(a_) and re.match(r"^(you|he|she|they)\s+(say|says|tell|tells|answer|answers)\b", b_, re.I):
                tiny.append(b_)
    add("Punchlines land when heard", "LOOK" if tiny else "PASS", "; ".join(f"\"{x}\"" for x in tiny)[:120] or "none flagged",
        "A one-word answer is easy to miss when spoken. Say the joke in full so a young viewer gets it on first listen." if tiny else "")
    # length
    state = "PASS" if 1500 <= n <= 1850 else "LOOK"
    add("Length", state, f"{n} words, about {sec / 60:.1f} min at {wpm} words/min", "" if state == "PASS" else "References run 1,730-1,800 words; the channel plan asks for 1,500-1,650. Under 1,500 is short of both.")
    return R


LOGIC_REVIEW = """## Story logic (answer each in writing; a regex cannot check these)
The Memory 100x v2 script scored 6.5/10 on logic because of these, so read the whole script and answer them before the voiceover:
1. **Power rule.** Quote the one passage that defines the power. Does it say when it starts, whether it reaches back to memories from before then, how fast it takes things in, how accurate recall is, and what it costs? List every scene that uses the power and say which part of the rule allows it. A scene that needs a second power (perfect memory is not speed reading) is a problem.
2. **Big numbers.** Is each number possible under the rule and in the story's time (12,000 books in 30 days = 400 a day)?
3. **Timeline.** Write the story days as a table (Day 1-7, 8-10, ...). One day count only. Every deadline lands where the story says the event happens.
4. **Climax by cause and effect.** Is the sacrifice forced by the hero's choice, with rules stated beforehand? Is the danger clearly settled on screen (who is safe, who confirmed it)? If the person is already safe and the prize is still on offer, the sacrifice makes no sense.
5. **Change of heart.** Is there a step between the problem and the fix? The hero wins by choosing what to do, not because a symptom vanishes instantly.
6. **Twist.** Is the final twist hinted at least once earlier?
7. **Safety.** Is no dangerous real-world advice given, such as "walk toward the water" in a rescue? Rescuers should lead.
8. **Science.** Are terms used correctly (HSAM is memory of one's own life; working memory is limited attention, not physical slots)? Are names and figures checked? Is there no science explainer in the middle of the climax?
9. **Cast.** Is the hero a boy (he/him, a boy's name) and the best friend a girl? Does every prop the script names (headphones, a receipt) have a shot where it can be seen?
10. **First consequence.** Does the first result of the power (not the demo) show before word 120, about 45 s? A regex cannot find it, so point to the sentence.
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--script", required=True)
    ap.add_argument("--title", default="")
    ap.add_argument("--wpm", type=float, default=165)
    ap.add_argument("--out")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")   # Windows consoles default to cp1252
    if not os.path.exists(a.script):
        sys.exit(f"script not found: {a.script}")
    R = check(parse(a.script), a.title, a.wpm)
    if a.json:
        print(json.dumps(R, ensure_ascii=False, indent=1))
    rows = ["| Check | Result | Found | Worth considering |", "|---|---|---|---|"]
    for r in R:
        rows.append(f"| {r['check']} | {r['state']} | {r['found'].replace('|', ' ')} | {r['hint']} |")
    md = "# Script check (nothing was changed)\n\n" + "\n".join(rows) + "\n\n" + LOGIC_REVIEW
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
