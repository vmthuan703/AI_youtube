import csv, glob, os, re, sys, statistics as st
sys.path.insert(0, os.path.dirname(__file__))
from vtt_clean import parse
A = {r["video_url"].split("=")[1]: r for r in csv.DictReader(open("reports/2026-11-03/table_A_video.csv", encoding="utf-8-sig"))}
V = {r["video_id"]: r for r in csv.DictReader(open("reports/2026-11-03/videos.csv", encoding="utf-8-sig"))}
FAM = r"\b(sister|brother|dad|mom|mother|father|grandpa|grandma|friend|wife|crush|daughter|son|lily)\b"
SCI = r"\b(scientist|science|study|studies|research|real|actually|record|percent|brain|physics|according)\b"
STOP = set("I Google Apple Bitcoin Monday Dad Mom You Your The A An And But So Then Okay Oh Hey Yeah No Yes Not Now What If Why How When Where Who This That It He She They We Is Are Was Were Do Does Did Can Could Would Should Let One Two Three Each Every".split())
rows = []
for p in sorted(glob.glob("data/transcripts/T4/*.en.vtt")):
    vid = os.path.basename(p).split(".")[0]
    segs = parse(p)
    full = " ".join(x for _, x in segs); full = re.sub(r">>|\[[^\]]*\]", " ", full)
    dur = int(V[vid]["duration_s"])
    head = " ".join(x for t, x in segs if t <= 20).lower()
    tail = " ".join(x for t, x in segs if t >= dur - 45)
    names = {w for w in re.findall(r"(?<![.!?]\s)(?<!^)\b([A-Z][a-z]{2,})\b", full) if w not in STOP}
    fam_first = next((round(t) for t, x in segs if re.search(FAM, x, re.I)), None)
    rows.append(dict(vid=vid, ch=A[vid]["channel"][:12], rel=float(A[vid]["relative_performance"]),
        opens_whatif=int("what if" in head[:60]), names=len(names), fam_first=fam_first,
        fam_per_min=round(len(re.findall(FAM, full, re.I))/(dur/60), 1),
        sci_per_min=round(len(re.findall(SCI, full, re.I))/(dur/60), 1),
        end_q=tail.count("?"), part2=int(bool(re.search(r"part (two|2)", full, re.I)))))
rows.sort(key=lambda r: -r["rel"])
print("\t".join(rows[0]))
for r in rows: print("\t".join(str(v) for v in r.values()))
print()
for c in ["opens_whatif", "names", "fam_per_min", "sci_per_min", "end_q", "part2"]:
    top=[r[c] for r in rows if r["rel"]>=2]; low=[r[c] for r in rows if r["rel"]<2]
    print(f"{c:13} top(n={len(top)}) mean={st.mean(top):.2f} med={st.median(top)} | low(n={len(low)}) mean={st.mean(low):.2f} med={st.median(low)}")
tf=[r["fam_first"] for r in rows if r["rel"]>=2 and r["fam_first"] is not None]; lf=[r["fam_first"] for r in rows if r["rel"]<2 and r["fam_first"] is not None]
print("fam_first(s) top med", st.median(tf), "low med", st.median(lf))
