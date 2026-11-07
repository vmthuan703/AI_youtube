"""Phân tích đối thủ What If (2026-11-07).

Đầu vào:
  --snap   thư mục snapshot (channels.csv, videos.csv) lấy từ nhánh research/reports, data/2026-11-06
  --jb     file JSONL metadata đầy đủ của @JeremyBearimyTheory (yt-dlp -j), lấy ngày 2026-11-07
  --thumbs thư mục ảnh thumbnail <video_id>.jpg
Đầu ra (trong thư mục của script): data/*.csv, img/*.png, stats.json

Chạy: python analyze.py --snap <dir> --jb <file> --thumbs <dir>
"""
import argparse, json, re, sys, math
from pathlib import Path
import numpy as np, pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw, ImageFont, ImageStat

sys.stdout.reconfigure(encoding="utf-8")
ap = argparse.ArgumentParser()
ap.add_argument("--snap", required=True); ap.add_argument("--jb", required=True); ap.add_argument("--thumbs", required=True)
a = ap.parse_args()
OUT = Path(__file__).parent; (OUT / "data").mkdir(exist_ok=True); (OUT / "img").mkdir(exist_ok=True)
JB = "UCIHVYxXnwAzTvNU0PE_ZLsg"
ANIME = {"Itadorists", "Araragi", "Sacred Strawhat", "ŌTSUTSUKI UNIVERSE!", "Toonists", "My Academia Recap"}

# ---------- palette (dataviz reference palette, light) ----------
BLUE, ORANGE, AQUA, YELLOW, MAGENTA, GREEN, VIOLET, RED = "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"
INK, INK2, MUTED, GRID, SURF = "#0b0b0b", "#52514e", "#898781", "#e1e0d9", "#fcfcfb"
plt.rcParams.update({"font.family": "Segoe UI", "font.size": 10, "axes.edgecolor": "#c3c2b7", "axes.labelcolor": INK2,
                     "xtick.color": MUTED, "ytick.color": INK2, "axes.facecolor": SURF, "figure.facecolor": SURF,
                     "axes.grid": True, "grid.color": GRID, "grid.linewidth": .6, "axes.spines.top": False, "axes.spines.right": False})

def save(fig, name):
    fig.tight_layout(); fig.savefig(OUT / "img" / name, dpi=150); plt.close(fig)

# ---------- load ----------
c = pd.read_csv(Path(a.snap) / "channels.csv", encoding="utf-8-sig")
v = pd.read_csv(Path(a.snap) / "videos.csv", encoding="utf-8-sig")
v["snap"] = pd.Timestamp("2026-11-06", tz="UTC")
rows = [json.loads(l) for l in open(a.jb, encoding="utf-8")]
jb = pd.DataFrame([dict(channel_id=JB, channel_title="Jeremy Bearimy", video_id=r["id"], title=r["title"],
                        published_at=pd.Timestamp(r["timestamp"], unit="s", tz="UTC").isoformat(), duration_s=r["duration"],
                        is_long=r["duration"] > 240, views=r["view_count"], likes=r.get("like_count"), comments=r.get("comment_count"),
                        tags="|".join(r.get("tags") or []), description=r.get("description") or "", chapters=len(r.get("chapters") or []),
                        snap=pd.Timestamp("2026-11-07", tz="UTC")) for r in rows])
v = pd.concat([v[v.channel_id != JB], jb], ignore_index=True)
v["channel_title"] = v.channel_title.str.strip(); c["title"] = c.title.str.strip()
v["published_at"] = pd.to_datetime(v.published_at, utc=True, format="mixed")
v["age_d"] = (v.snap - v.published_at).dt.total_seconds() / 86400
v["tags"] = v.tags.fillna(""); v["description"] = v.description.fillna("")
L = v[(v.is_long == True) & (v.duration_s <= 3600)].copy()  # bỏ shorts và video tổng hợp nhiều giờ

# ---------- channel score ----------
c["first"] = pd.to_datetime(c.first_upload_at, utc=True, format="mixed")
c["age"] = ((pd.Timestamp("2026-11-07", tz="UTC") - c["first"]).dt.days).clip(lower=1)
g = L.groupby("channel_id").agg(n=("video_id", "count"), med=("views", "median"), mx=("views", "max"), tot=("views", "sum"),
                                hits=("views", lambda s: int((s >= 100_000).sum())))
c = c.merge(g, left_on="channel_id", right_index=True)
c = c[c.n >= 3].copy()
jbn = len(jb[(jb.is_long) & (jb.duration_s <= 3600)])
c.loc[c.channel_id == JB, ["subscribers", "video_count"]] = [43500, len(jb)]
c["vpd"] = c.tot / c.age; c["hit_rate"] = c.hits / c.n; c["uploads_per_day"] = c.n / c.age
for k in ["med", "vpd", "hit_rate"]: c["r_" + k] = c[k].rank(pct=True)
c["score"] = .45 * c.r_med + .35 * c.r_vpd + .20 * c.r_hit_rate
c["tier"] = np.select([c.score >= .75, c.score >= .5], ["A", "B"], "C")
c["w"] = c.score ** 3; c["w"] /= c.w.sum()
c["segment"] = np.where(c.title.isin(ANIME), "anime", "original")
c = c.sort_values("score", ascending=False)
c[["channel_id", "title", "handle", "age", "subscribers", "n", "med", "mx", "hits", "vpd", "uploads_per_day", "score", "tier", "w", "segment"]].round(4).to_csv(OUT / "data/channels_scored.csv", index=False, encoding="utf-8-sig")

L = L.merge(c[["channel_id", "score", "tier", "w", "med", "segment"]].rename(columns={"med": "ch_med"}), on="channel_id")
L["outlier"] = L.views / L.ch_med
L["win"] = (L.outlier >= 3).astype(int)
E = L[L.age_d >= 3].copy()         # đủ tuổi để so sánh
O = E[E.segment == "original"].copy()

def wrate(df, col="win"):
    return float((df[col] * df.w).sum() / df.w.sum()) if len(df) and df.w.sum() > 0 else float("nan")

S = {"n_channels": int(len(c)), "n_long": int(len(L)), "n_eligible": int(len(E)), "n_original": int(len(O)),
     "tiers": c.tier.value_counts().to_dict(), "base_wwin": wrate(O), "base_win": float(O.win.mean()),
     "base_hit100k": float((O.views >= 1e5).mean()), "median_views": float(O.views.median())}

# ---------- chart 1: channel scores ----------
top = c.head(25).iloc[::-1]
fig, ax = plt.subplots(figsize=(8, 7.2))
cols = [ORANGE if r.channel_id == JB else (VIOLET if r.segment == "anime" else BLUE) for r in top.itertuples()]
ax.barh(top.title, top.score, color=cols, height=.62)
for i, r in enumerate(top.itertuples()):
    ax.text(r.score + .005, i, f" {r.tier} · {r.med/1000:.0f}k trung vị · {r.age} ngày", va="center", fontsize=8, color=INK2)
ax.set_xlim(0, 1.35); ax.set_xlabel("Điểm thắng (0–1): 45% view trung vị · 35% view/ngày của kênh · 20% tỉ lệ video ≥100k")
from matplotlib.patches import Patch
ax.legend(handles=[Patch(color=ORANGE, label="Jeremy Bearimy"), Patch(color=BLUE, label="What If gốc (nhân vật tự tạo)"), Patch(color=VIOLET, label="What If anime (fan fiction)")],
          loc="lower right", frameon=False, fontsize=8)
ax.set_title("25 kênh What If mới (video đầu tiên ≤ 1 năm) xếp theo điểm thắng", loc="left", fontsize=12, color=INK)
ax.grid(axis="y", visible=False); save(fig, "01_kenh_diem_thang.png")

# ---------- topics ----------
TOPICS = {
    "Nhìn thấy bí mật người khác (See everyone's…)": r"\bsee (everyone|every|who|how|the|your|people|anyone|winning)|read minds|x-?ray|lie count|love meter|hidden secrets",
    "Luật game ngoài đời (level up, respawn, stats…)": r"real[ -]life|level up|respawn|creative mode|checkpoint|dialogue option|stats? |video-?game|settings menu|maxed out|skill",
    "Nhân X / không dừng được (10x, every hour…)": r"\d+\s?x\b|\bx\d+|\d+ times|doubled|\bdouble|couldn.?t stop|kept getting|every (hour|day|second|time)|faster|slower|10,000x|twice",
    "Siêu năng lực cổ điển (stop time, teleport…)": r"stop time|teleport|shapeshift|invisible|superpower|psychic|bending|telekinesis|\bfly\b|clone|breathe|talk to animals|control (water|fire|your luck)|never die|heal|erase|iron-?man",
    "Tình cảm / được yêu thích (crush, girls…)": r"crush|girls?\b|\blove|date|dating|sleepover|kiss|body count|likes you|loved you",
    "Tiền / danh tiếng": r"money|rich|wealth|famous|lottery|\$|cost|cheaper|bank",
    "IQ / trí tuệ": r"\biq\b|smart|genius|learn anything",
    "Tái sinh / ký ức / tương lai": r"reborn|memories|rewind|time travel|travel in time|future|years into",
    "Thế giới / nhân loại (every human, moon…)": r"every human|humans?\b|earth|world|moon|\bsun\b|everyone else|disappeared|last human|clothes",
    "Cơ thể (tim, cân nặng, kích thước, giác quan…)": r"heart|body|weight|heavier|lighter|shr[aiu]nk|shrink|grew|grow|aged|older|vision|reaction|reflex|pain|lungs|size|bigger|smaller",
    "Nguy hiểm / sinh tồn": r"crash|shooting|zombie|apocalypse|trapped|survive|bunker|missing|disaster",
}
tl = O.title.str.lower(); tall = E.title.str.lower()
trows = []
for name, rx in TOPICS.items():
    m = tl.str.contains(rx, regex=True); sub = O[m]
    if len(sub) == 0: continue
    trows.append(dict(topic=name, videos=len(sub), channels=sub.channel_id.nunique(), wwin=wrate(sub), win=sub.win.mean(),
                      hit100k=int((sub.views >= 1e5).sum()), median_views=sub.views.median(),
                      jb_videos=int((sub.channel_id == JB).sum()),
                      best=sub.sort_values("views").iloc[-1].title, best_views=int(sub.views.max()), best_ch=sub.sort_values("views").iloc[-1].channel_title))
T = pd.DataFrame(trows).sort_values("wwin", ascending=False)
T.round(4).to_csv(OUT / "data/chu_de.csv", index=False, encoding="utf-8-sig")
fig, ax = plt.subplots(figsize=(8.4, 5.4)); Tp = T.iloc[::-1]
ax.barh(Tp.topic, Tp.wwin * 100, color=BLUE, height=.6)
ax.axvline(S["base_wwin"] * 100, color=MUTED, lw=1.2, ls="--"); ax.text(S["base_wwin"] * 100 + .5, len(Tp) - .45, f"mặt bằng {S['base_wwin']*100:.0f}%", color=INK2, fontsize=8)
for i, r in enumerate(Tp.itertuples()):
    ax.text(max(r.wwin, S["base_wwin"] + .01) * 100 + .6, i, f"{r.wwin*100:.0f}%  ·  {r.videos} video / {r.channels} kênh · {r.hit100k} video ≥100k", va="center", fontsize=8, color=INK2)
ax.set_xlim(0, max(Tp.wwin) * 100 + 38); ax.set_xlabel("Tỉ lệ thắng có trọng số kênh (video ≥ 3× trung vị kênh), %")
ax.set_title("Chủ đề nào thắng nhiều nhất (chỉ kênh What If gốc, bỏ anime)", loc="left", fontsize=12, color=INK); ax.grid(axis="y", visible=False)
save(fig, "02_chu_de.png")

# ---------- title features ----------
def caps_word(t):
    return any(len(w) >= 3 and w.isupper() and w not in {"IQ", "IF", "USA", "CEO"} for w in re.findall(r"[A-Za-z]+", t))
F = {
    "Mở bằng “What If You/Your”": lambda t: bool(re.match(r"what if (you|your)\b", t, re.I)),
    "Viết “What IF” (IF in hoa)": lambda t: "What IF" in t,
    "Có 1 từ IN HOA để nhấn (ONLY, ACTUALLY…)": caps_word,
    "Có con số / hệ số (10x, 100, 1cm…)": lambda t: bool(re.search(r"\d", t)),
    "Có “Everyone/Every”": lambda t: bool(re.search(r"\bevery(one)?", t, re.I)),
    "Có “Real Life”": lambda t: bool(re.search(r"real[ -]life", t, re.I)),
    "≤ 45 ký tự": lambda t: len(t) <= 45,
    "Kết bằng “?”": lambda t: t.strip().endswith("?"),
    "“…and Couldn't Stop”": lambda t: bool(re.search(r"couldn.?t stop", t, re.I)),
    "Có (Part N)": lambda t: bool(re.search(r"part \d", t, re.I)),
}
frows = []
for name, fn in F.items():
    m = O.title.map(fn)
    frows.append(dict(feature=name, share_all=m.mean(), share_tierA=m[O.tier == "A"].mean(), share_JB=m[O.channel_id == JB].mean(),
                      wwin_with=wrate(O[m]), wwin_without=wrate(O[~m]), n_with=int(m.sum())))
TF = pd.DataFrame(frows); TF["lift"] = TF.wwin_with - TF.wwin_without
TF.round(4).to_csv(OUT / "data/dac_diem_tieu_de.csv", index=False, encoding="utf-8-sig")
S["title_len_median_win"] = float(O[O.win == 1].title.str.len().median()); S["title_len_median_lose"] = float(O[O.win == 0].title.str.len().median())
S["title_len_JB"] = float(L[L.channel_id == JB].title.str.len().median())
fig, ax = plt.subplots(figsize=(8.4, 4.8)); TFp = TF.sort_values("lift")
ax.barh(TFp.feature, TFp.lift * 100, color=[GREEN if x > 0 else RED for x in TFp.lift], height=.6)
ax.axvline(0, color="#c3c2b7", lw=1)
for i, r in enumerate(TFp.itertuples()):
    ax.text(r.lift * 100 + (1 if r.lift >= 0 else -1), i, f"{r.wwin_with*100:.0f}% vs {r.wwin_without*100:.0f}%  (n={r.n_with})", va="center",
            ha="left" if r.lift >= 0 else "right", fontsize=8, color=INK2)
lim = max(abs(TFp.lift)) * 100 + 22; ax.set_xlim(-lim, lim)
ax.set_xlabel("Chênh tỉ lệ thắng có trọng số: có đặc điểm − không có (điểm %)")
ax.set_title("Đặc điểm tiêu đề: cái nào đi cùng video thắng", loc="left", fontsize=12, color=INK); ax.grid(axis="y", visible=False)
save(fig, "03_tieu_de.png")

# ---------- tags ----------
O["n_tags"] = O.tags.map(lambda s: len([x for x in s.split("|") if x]))
O["has_tags"] = O.n_tags > 0
tg = O.groupby("tier").agg(share_tags=("has_tags", "mean"), med_ntags=("n_tags", lambda s: s[s > 0].median() if (s > 0).any() else 0)).reset_index()
S["tags_by_tier"] = tg.round(3).to_dict("records")
S["tags_wwin_with"] = wrate(O[O.has_tags]); S["tags_wwin_without"] = wrate(O[~O.has_tags])
S["tags_JB"] = int(O[O.channel_id == JB].n_tags.sum())
chan_tags = O.groupby("channel_id").has_tags.mean()
S["channels_no_tags"] = sorted(c[c.channel_id.isin(chan_tags[chan_tags == 0].index)].title.tolist())
S["channels_no_tags_tierA"] = sorted(c[c.channel_id.isin(chan_tags[chan_tags == 0].index) & (c.tier == "A")].title.tolist())
rows_t = []
for r in O[O.has_tags].itertuples():
    for t in set(x.strip().lower() for x in r.tags.split("|") if x.strip()):
        rows_t.append((t, r.channel_id, r.w, r.win, r.title.lower().strip(" ?")))
TT = pd.DataFrame(rows_t, columns=["tag", "ch", "w", "win", "title"])
TT["is_title"] = TT.tag.str.strip(" ?") == TT.title
S["share_first_tag_is_title"] = float(O[O.has_tags].apply(lambda r: r.tags.split("|")[0].strip().lower().strip(" ?") == r.title.lower().strip(" ?"), axis=1).mean())
tagagg = TT[~TT.is_title].groupby("tag").agg(channels=("ch", "nunique"), videos=("ch", "size"), wsum=("w", "sum"), winrate=("win", "mean")).reset_index()
tagagg = tagagg[tagagg.channels >= 3].sort_values(["channels", "videos"], ascending=False)
tagagg.head(60).round(3).to_csv(OUT / "data/tags_pho_bien.csv", index=False, encoding="utf-8-sig")
tt = tagagg.head(18).iloc[::-1]
fig, ax = plt.subplots(figsize=(8, 5.4)); ax.barh(tt.tag, tt.channels, color=BLUE, height=.6)
for i, r in enumerate(tt.itertuples()): ax.text(r.channels + .15, i, f"{r.channels} kênh · {r.videos} video", va="center", fontsize=8, color=INK2)
ax.set_xlabel("Số kênh dùng tag (kênh What If gốc)"); ax.set_xlim(0, tt.channels.max() + 6)
ax.set_title("Tag phổ biến nhất (không tính tag trùng tiêu đề)", loc="left", fontsize=12, color=INK); ax.grid(axis="y", visible=False)
save(fig, "04_tags.png")

# ---------- descriptions ----------
D = O.copy(); d = D.description
D["desc_len"] = d.str.len(); D["hashtags"] = d.str.count(r"#\w+"); D["has_ts"] = d.str.contains(r"\b\d{1,2}:\d{2}\b")
D["links"] = d.str.count(r"https?://"); D["ask_comment"] = d.str.contains(r"comment", case=False)
D["subscribe"] = d.str.contains(r"subscribe", case=False); D["watch_more"] = d.str.contains(r"watch (our|more|other|next)|other videos|you may also|playlist", case=False)
D["first_q"] = d.str.split("\n").str[0].str.contains(r"\?"); D["emoji"] = d.str.contains(r"[\U0001F300-\U0001FAFF]")
D["paragraphs"] = d.str.count(r"\n\s*\n") + 1
desc = D.groupby("tier").agg(n=("video_id", "count"), desc_len=("desc_len", "median"), paragraphs=("paragraphs", "median"), hashtags=("hashtags", "median"),
                             timestamps=("has_ts", "mean"), links=("links", "mean"), ask_comment=("ask_comment", "mean"), subscribe=("subscribe", "mean"),
                             watch_more=("watch_more", "mean"), emoji=("emoji", "mean"), first_line_question=("first_q", "mean")).round(2)
J = D[D.channel_id == JB]
desc.loc["Jeremy Bearimy"] = [len(J), J.desc_len.median(), J.paragraphs.median(), J.hashtags.median(), J.has_ts.mean(), J.links.mean(), J.ask_comment.mean(),
                              J.subscribe.mean(), J.watch_more.mean(), J.emoji.mean(), J.first_q.mean()]
desc.round(2).to_csv(OUT / "data/mo_ta.csv", encoding="utf-8-sig"); S["desc"] = desc.round(2).reset_index().to_dict("records")
S["jb_chapters_share"] = float((jb[jb.duration_s <= 3600].chapters > 0).mean())
ht = D.description.str.findall(r"#\w+").explode().dropna().str.lower()
S["top_hashtags"] = ht.value_counts().head(15).to_dict()

# ---------- duration / cadence / hour ----------
O["dur_min"] = O.duration_s / 60
bins = [4, 7, 9, 11, 14, 60]; labs = ["4–7", "7–9", "9–11", "11–14", ">14"]
O["dur_b"] = pd.cut(O.dur_min, bins, labels=labs)
DU = O.groupby("dur_b", observed=True).apply(lambda g: pd.Series(dict(n=len(g), wwin=wrate(g)))).reset_index()
S["dur_median_by_tier"] = O.groupby("tier").dur_min.median().round(1).to_dict()
S["dur_JB"] = float(O[O.channel_id == JB].dur_min.median())
S["uploads_per_day_by_tier"] = c.groupby("tier").uploads_per_day.median().round(2).to_dict()
try:
    O["et_hour"] = O.published_at.dt.tz_convert("America/New_York").dt.hour
except Exception:
    O["et_hour"] = (O.published_at - pd.Timedelta(hours=5)).dt.hour
hb = [-1, 5, 9, 12, 15, 18, 23]; hl = ["0–5h", "6–9h", "10–12h", "13–15h", "16–18h", "19–23h"]
O["hour_b"] = pd.cut(O.et_hour, hb, labels=hl)
HR = O.groupby("hour_b", observed=True).apply(lambda g: pd.Series(dict(n=len(g), wwin=wrate(g)))).reset_index()
S["jb_hours_et"] = O[O.channel_id == JB].et_hour.value_counts().sort_index().to_dict()
fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.6, 3.6))
a1.bar(DU.dur_b.astype(str), DU.wwin * 100, color=BLUE, width=.6)
for i, r in enumerate(DU.itertuples()): a1.text(i, r.wwin * 100 + 1, f"{r.wwin*100:.0f}%\nn={int(r.n)}", ha="center", fontsize=8, color=INK2)
a1.set_title("Độ dài video (phút)", loc="left", color=INK); a1.set_ylabel("Tỉ lệ thắng có trọng số, %"); a1.set_ylim(0, max(DU.wwin) * 100 + 14); a1.grid(axis="x", visible=False)
a2.bar(HR.hour_b.astype(str), HR.wwin * 100, color=BLUE, width=.6)
for i, r in enumerate(HR.itertuples()): a2.text(i, r.wwin * 100 + 1, f"{r.wwin*100:.0f}%\nn={int(r.n)}", ha="center", fontsize=8, color=INK2)
a2.set_title("Giờ đăng (giờ miền Đông Mỹ)", loc="left", color=INK); a2.set_ylim(0, max(HR.wwin) * 100 + 14); a2.grid(axis="x", visible=False)
save(fig, "05_do_dai_gio_dang.png")
DU.round(3).to_csv(OUT / "data/do_dai.csv", index=False); HR.round(3).to_csv(OUT / "data/gio_dang.csv", index=False)

# ---------- Jeremy Bearimy deep dive ----------
# Mã hóa thumbnail bằng tay (xem ảnh trong img/jb_*.jpg). expr: tu_tin | hoang_so | trung_tinh | vang_mat
# text: none | chu (1–3 từ) | ui (nhãn/giao diện game gắn lên cảnh) ; girls: có nhân vật nữ ; split: 2 vế đối lập ; crowd: đám đông / chất đống
CODE = [
 ("Who Has a Crush", "vang_mat", "ui", "friend / CRUSH / friend", 1, 0, 0),
 ("Girls Only School", "tu_tin", "chu", "YOU ↶", 1, 0, 1),
 ("Shooting", "tu_tin", "none", "", 0, 1, 0),
 ("Infinite Money", "tu_tin", "chu", "infinite money", 0, 0, 1),
 ("Creative Mode", "tu_tin", "ui", "/gamemode creative", 0, 0, 0),
 ("Heart Beat", "tu_tin", "chu", "10X FASTER", 0, 0, 1),
 ("Control Your Luck", "tu_tin", "chu", "LUCK + đồng hồ max", 0, 0, 0),
 ("Every Girl on Earth", "tu_tin", "chu", "oh yeah.", 1, 0, 1),
 ("Biggest Secret", "tu_tin", "ui", "murderer", 1, 1, 0),
 ("Learn Anything", "tu_tin", "chu", "FIGHTING BASICS (bìa sách)", 0, 1, 0),
 ("Stopped Feeling Pain", "tu_tin", "chu", "this is fine..", 0, 0, 1),
 ("Respawn", "tu_tin", "chu", "RESPAWN", 0, 0, 0),
 ("10 Seconds Into", "tu_tin", "chu", "FUTURE VISION ←", 0, 0, 0),
 ("Who Will Become Famous", "tu_tin", "ui", "27 vs 19,342,514 follower", 1, 1, 0),
 ("Level Up", "tu_tin", "ui", "LEVEL 10 + bảng chỉ số", 0, 0, 0),
 ("Dialogue Options", "vang_mat", "ui", "F**K YOU! / LETS DATE", 1, 0, 0),
 ("Girls Only Sleepover", "tu_tin", "chu", "oh yeah.", 1, 0, 0),
 ("Tips Like", "trung_tinh", "ui", "Tip: ASK HER OUT", 1, 0, 0),
 ("Biggest Fear", "tu_tin", "ui", "puppies", 0, 1, 0),
 ("Swapped Bodies", "vang_mat", "none", "", 1, 0, 0),
 ("Firebending", "trung_tinh", "none", "", 0, 1, 0),
 ("Reaction Time", "hoang_so", "chu", "10X SLOWER", 0, 0, 0),
 ("Psychic", "tu_tin", "chu", "PSYCHIC", 0, 0, 0),
 ("Iron-Man", "tu_tin", "chu", "← YOU", 0, 0, 0),
 ("Checkpoints", "tu_tin", "ui", "SAVE (nút pixel)", 0, 0, 0),
 ("Never Had to Wait", "hoang_so", "chu", "2759 HOURS POOING", 0, 0, 0),
 ("Most FAMOUS", "tu_tin", "none", "", 0, 0, 1),
 ("Earthbending", "tu_tin", "none", "", 0, 0, 0),
 ("Plane Crash", "hoang_so", "chu", "HELP", 0, 0, 0),
 ("Vegan", "trung_tinh", "chu", "NO MORE MEAT", 0, 0, 0),
 ("Mind Aged", "trung_tinh", "chu", "87 YEARS OLD", 0, 0, 0),
 ("Clone Yourself", "tu_tin", "none", "", 0, 0, 0),
 ("Every GUY", "hoang_so", "chu", "I'M NOT GAY!", 0, 0, 1),
 ("100x vision", "vang_mat", "chu", "you see everything...", 0, 0, 0),
 ("Became Famous", "hoang_so", "chu", "MISSING", 0, 0, 0),
 ("Gained Weight", "trung_tinh", "chu", "10X FAT", 0, 0, 0),
 ("Shrunk 1cm", "vang_mat", "chu", "hour 86", 0, 0, 0),
 ("Control Water", "vang_mat", "none", "", 0, 0, 0),
 ("Stats Like", "trung_tinh", "ui", "IQ 98 / LOYALTY 0 / CONFIDENCE 93", 1, 1, 0),
 ("ACTUALLY Had", "vang_mat", "none", "", 0, 0, 0),
]
JBv = L[L.channel_id == JB].copy()
def code_for(t):
    for k, *rest in CODE:
        if k.lower() in t.lower(): return rest
    return [None] * 6
JBv[["expr", "text", "text_content", "girls", "split", "crowd"]] = pd.DataFrame([code_for(t) for t in JBv.title], index=JBv.index)
JBv["views_per_day"] = JBv.views / JBv.age_d.clip(lower=.5)
JBv["what_IF"] = JBv.title.str.contains("What IF")
JBv = JBv.sort_values("published_at")
JBv[["published_at", "title", "views", "likes", "comments", "age_d", "views_per_day", "outlier", "duration_s", "expr", "text", "text_content", "girls", "split", "crowd", "video_id"]].round(2) \
    .to_csv(OUT / "data/jeremy_bearimy_videos.csv", index=False, encoding="utf-8-sig")
JE = JBv[JBv.age_d >= 3]
S["jb"] = dict(n=len(JBv), n_eligible=len(JE), median_views=float(JE.views.median()), subs=43500, first=str(JBv.published_at.min().date()),
               per_day=round(len(jb) / 28, 2), hit100k=int((JBv.views >= 1e5).sum()), total=int(JBv.views.sum()),
               like_rate=float((JBv.likes / JBv.views).median()), comment_rate=float((JBv.comments / JBv.views).median()))
def grp(col):
    return JE.groupby(col).agg(n=("views", "size"), median_views=("views", "median"), hit100k=("views", lambda s: (s >= 1e5).mean())).reset_index()
S["jb_by_expr"] = grp("expr").round(3).to_dict("records"); S["jb_by_text"] = grp("text").round(3).to_dict("records")
S["jb_by_girls"] = grp("girls").round(3).to_dict("records"); S["jb_by_split"] = grp("split").round(3).to_dict("records"); S["jb_by_crowd"] = grp("crowd").round(3).to_dict("records")
JE2 = JE.copy(); JE2["phase"] = np.where(JE2.published_at < pd.Timestamp("2026-10-22", tz="UTC"), "10–21/10 (5–13 phút, 'What if')", "từ 22/10 (≈10,5 phút, 'What IF')")
S["jb_by_phase"] = JE2.groupby("phase").agg(n=("views", "size"), median_views=("views", "median"), hit100k=("views", lambda s: int((s >= 1e5).sum()))).reset_index().to_dict("records")

EXPR_C = {"tu_tin": BLUE, "vang_mat": AQUA, "trung_tinh": YELLOW, "hoang_so": RED}
EXPR_L = {"tu_tin": "Nhân vật tự tin / smug", "vang_mat": "Không có mặt nhân vật chính", "trung_tinh": "Mặt trung tính", "hoang_so": "Hoảng sợ / khổ sở"}
fig, ax = plt.subplots(figsize=(10, 4.6))
x = np.arange(len(JBv))
ax.bar(x, JBv.views / 1000, color=[EXPR_C[e] for e in JBv.expr], width=.75)
ax.set_xticks(x); ax.set_xticklabels([f"{d:%d/%m}" for d in JBv.published_at], rotation=90, fontsize=7)
for i, r in enumerate(JBv.itertuples()):
    if r.views >= 500_000:
        short = re.sub(r"^What (IF|If) (You )?", "", r.title).replace("Could ", "").rstrip("?")
        ax.text(i, r.views / 1000 + 20, short, rotation=90, fontsize=7, ha="center", va="bottom", color=INK2)
ax.set_ylabel("Lượt xem (nghìn) tại 07/11"); ax.set_ylim(0, 2700)
ax.legend(handles=[Patch(color=v_, label=EXPR_L[k]) for k, v_ in EXPR_C.items()], frameon=False, fontsize=8, loc="upper left")
ax.axvspan(len(JBv) - 6.5, len(JBv) - .5, color="#f0efec", zorder=0); ax.text(len(JBv) - 3.5, 2150, "< 3 ngày tuổi", ha="center", fontsize=8, color=MUTED)
ax.set_title("Jeremy Bearimy: 40 video dài trong 28 ngày, màu theo biểu cảm nhân vật trên thumbnail", loc="left", fontsize=12, color=INK); ax.grid(axis="x", visible=False)
save(fig, "06_jb_timeline.png")

fig, axs = plt.subplots(1, 3, figsize=(10.5, 3.5), sharey=True)
def mini(ax, df, col, labels, title):
    df = df.copy(); df["lab"] = df[col].map(labels); df = df.sort_values("median_views")
    ax.barh(df.lab, df.median_views / 1000, color=BLUE, height=.55)
    for i, r in enumerate(df.itertuples()): ax.text(r.median_views / 1000 + 8, i, f"{r.median_views/1000:.0f}k (n={r.n})", va="center", fontsize=8, color=INK2)
    ax.set_title(title, loc="left", fontsize=10, color=INK); ax.grid(axis="y", visible=False); ax.set_xlim(0, df.median_views.max() / 1000 * 1.6)
# separate y per panel
plt.close(fig)
fig, axs = plt.subplots(1, 3, figsize=(11, 3.4))
mini(axs[0], grp("expr"), "expr", EXPR_L, "Biểu cảm nhân vật")
mini(axs[1], grp("text"), "text", {"none": "Không chữ", "chu": "1–3 chữ to", "ui": "Nhãn / giao diện game"}, "Kiểu chữ trên thumbnail")
mini(axs[2], grp("girls"), "girls", {0: "Không", 1: "Có nhân vật nữ"}, "Nhân vật nữ (góc tình cảm)")
for ax in axs: ax.set_xlabel("View trung vị (nghìn)")
fig.suptitle("Jeremy Bearimy: view trung vị theo thuộc tính thumbnail (video ≥ 3 ngày tuổi)", x=.01, ha="left", fontsize=12, color=INK)
save(fig, "07_jb_thuoc_tinh_thumbnail.png")

# ---------- thumbnail pixel metrics ----------
def metrics(p):
    im = Image.open(p).convert("RGB").resize((320, 180)); hsv = im.convert("HSV")
    arr = np.asarray(im).astype(float); r, g_, b = arr[..., 0], arr[..., 1], arr[..., 2]
    rg = r - g_; yb = .5 * (r + g_) - b
    colorful = math.sqrt(rg.std() ** 2 + yb.std() ** 2) + .3 * math.sqrt(rg.mean() ** 2 + yb.mean() ** 2)
    hs = np.asarray(hsv).astype(float)
    return dict(brightness=hs[..., 2].mean() / 2.55, saturation=hs[..., 1].mean() / 2.55, colorfulness=colorful, white_share=float(((arr > 225).all(-1)).mean() * 100))
tm = []
for r in L.itertuples():
    p = Path(a.thumbs) / f"{r.video_id}.jpg"
    if p.exists(): tm.append(dict(video_id=r.video_id, channel=r.channel_title, views=r.views, outlier=r.outlier, tier=r.tier, segment=r.segment, **metrics(p)))
TM = pd.DataFrame(tm); TM.round(2).to_csv(OUT / "data/thumbnail_pixel.csv", index=False, encoding="utf-8-sig")
TM["group"] = np.where(TM.channel == "Jeremy Bearimy", "Jeremy Bearimy", np.where(TM.segment == "anime", "Anime", "Kênh gốc khác (top 4 video)"))
S["thumb_pixel"] = TM.groupby("group")[["brightness", "saturation", "colorfulness", "white_share"]].median().round(1).reset_index().to_dict("records")

# ---------- contact sheets cho báo cáo ----------
FONT = ImageFont.truetype("arialbd.ttf", 15)
def sheet(df, name, cols=4, w=320):
    h = int(w * 9 / 16); rows = (len(df) + cols - 1) // cols
    Sx = Image.new("RGB", (cols * w + (cols - 1) * 4, rows * (h + 24)), "white"); dr = ImageDraw.Draw(Sx)
    for k, (_, r) in enumerate(df.iterrows()):
        x0 = (k % cols) * (w + 4); y0 = (k // cols) * (h + 24)
        Sx.paste(Image.open(Path(a.thumbs) / f"{r.video_id}.jpg").convert("RGB").resize((w, h)), (x0, y0))
        dr.text((x0 + 3, y0 + h + 3), f"{r.views/1000:,.0f}k · ×{r.outlier:.1f} · {r.channel_title[:15]}", fill="black", font=FONT)
    Sx.save(OUT / "img" / name, quality=82)
jbs = L[L.channel_id == JB].sort_values("views", ascending=False)
sheet(jbs.head(12), "jb_thumb_top12.jpg"); sheet(jbs[jbs.age_d >= 3].tail(12), "jb_thumb_bottom12.jpg")
oth = L[(L.channel_id != JB) & (L.segment == "original") & (L.tier.isin(["A", "B"]))].sort_values("views", ascending=False).groupby("channel_id").head(2)
oth = oth[oth.video_id.map(lambda i: (Path(a.thumbs) / f"{i}.jpg").exists())].head(16)
sheet(oth, "doi_thu_khac_top16.jpg")

json.dump(S, open(OUT / "stats.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=str)
print(json.dumps(S, ensure_ascii=False, indent=1, default=str)[:9000])
print(T[["topic", "videos", "channels", "wwin", "win", "hit100k", "median_views", "jb_videos"]].round(3).to_string())
print(TF.round(3).to_string())
