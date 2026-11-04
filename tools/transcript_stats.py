import csv, glob, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from vtt_clean import parse
A = {r["video_url"].split("=")[1]: r for r in csv.DictReader(open("reports/2026-11-03/table_A_video.csv", encoding="utf-8-sig"))}
V = {r["video_id"]: r for r in csv.DictReader(open("reports/2026-11-03/videos.csv", encoding="utf-8-sig"))}
rows = []
for p in sorted(glob.glob("data/transcripts/T4/*.en.vtt")):
    vid = os.path.basename(p).split(".")[0]
    segs = parse(p)
    text = " ".join(x for _, x in segs)
    text = re.sub(r">>|\[[^\]]*\]", " ", text)
    words = re.findall(r"[A-Za-z0-9$%']+", text)
    sents = [s for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    n = len(words); dur = int(V[vid]["duration_s"])
    low = " ".join(words).lower()
    def first(pat):
        for t, x in segs:
            if re.search(pat, x, re.I): return round(t)
        return None
    rows.append(dict(
        vid=vid, ch=A[vid]["channel"][:14], rel=float(A[vid]["relative_performance"]), dur_min=round(dur/60,1),
        words=n, wpm=round(n/(dur/60)), avg_sent=round(n/max(len(sents),1),1),
        you_pct=round(100*len(re.findall(r"\byou(r|rs|rself)?\b", low))/max(n,1),1),
        i_pct=round(100*len(re.findall(r"\b(i|i'm|i'll|my|me)\b", low))/max(n,1),1),
        q_per_min=round(text.count("?")/(dur/60),1),
        short_sent_pct=round(100*sum(len(re.findall(r"\w+", s))<=6 for s in sents)/max(len(sents),1)),
        digits_per_min=round(len(re.findall(r"\$?\d[\d,.:]*", text))/(dur/60),1),
        first_you=first(r"\byou\b"), first_question=first(r"\?"), first_until=first(r"\buntil\b|\bbut\b.*\b(cost|price)\b"),
        first_rule=first(r"\brule|\bonly\b|\blimit|\bevery (day|night|time)\b"),
    ))
rows.sort(key=lambda r: -r["rel"])
cols = list(rows[0])
print("\t".join(cols))
for r in rows: print("\t".join(str(r[c]) for c in cols))
import statistics as st
print()
for c in ["wpm","avg_sent","you_pct","i_pct","q_per_min","short_sent_pct","digits_per_min"]:
    top=[r[c] for r in rows if r["rel"]>=2]; low=[r[c] for r in rows if r["rel"]<2]
    print(f"{c:16} top(rel>=2,n={len(top)}) med={st.median(top):6} | low(n={len(low)}) med={st.median(low):6} | all med={st.median([r[c] for r in rows])}")
