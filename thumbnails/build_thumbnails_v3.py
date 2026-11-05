"""Thumbnail v3 - nhân vật xanh (áo phao xanh lá, tóc cam, bóng trắng), học phong cách kênh mẫu:
nhân vật khoa trương + 1 ý tưởng hiển thị trực quan + chữ khổng lồ viền đậm.
Chạy: python3 build_thumbnails_v3.py && node render_v3.js"""
import base64, math, pathlib, random
OUT = pathlib.Path(__file__).parent
FONT64 = base64.b64encode((OUT/"fonts/lilita-one-latin-400-normal.woff2").read_bytes()).decode()
INK, DK = "#1c1b44", "#2a2a55"
F = "font-family:'Lilita One',Impact,Arial;"

DEFS = f'''<defs><style>@font-face{{font-family:'Lilita One';src:url(data:font/woff2;base64,{FONT64}) format('woff2');}}</style>
<filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="24"/></filter>
<filter id="b3"><feGaussianBlur stdDeviation="3"/></filter><filter id="b6"><feGaussianBlur stdDeviation="6"/></filter><filter id="b12"><feGaussianBlur stdDeviation="12"/></filter>
<radialGradient id="skin" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset=".65" stop-color="#f4f7ff"/><stop offset="1" stop-color="#cfd9f0"/></radialGradient>
<linearGradient id="hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a3c"/><stop offset="1" stop-color="#e2531a"/></linearGradient>
<linearGradient id="jk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b6f24a"/><stop offset=".5" stop-color="#78d11f"/><stop offset="1" stop-color="#3f9a12"/></linearGradient>
<radialGradient id="pink" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ffc9e0"/><stop offset=".5" stop-color="#ff7eb3"/><stop offset="1" stop-color="#c2336f"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8a8"/><stop offset=".5" stop-color="#ffe03a"/><stop offset="1" stop-color="#ffa800"/></linearGradient>
<linearGradient id="red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a7a"/><stop offset="1" stop-color="#e11d2e"/></linearGradient>
<linearGradient id="iris" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9d5ff"/><stop offset=".5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#3b0f9e"/></linearGradient>
<radialGradient id="bgA" cx=".62" cy=".4" r=".85"><stop offset="0" stop-color="#6aa8ff"/><stop offset=".55" stop-color="#4a2fd1"/><stop offset="1" stop-color="#150a5c"/></radialGradient>
<radialGradient id="bgB" cx=".5" cy=".55" r=".8"><stop offset="0" stop-color="#b266ff"/><stop offset=".6" stop-color="#6a1fd0"/><stop offset="1" stop-color="#1c0a52"/></radialGradient>
<radialGradient id="bgC" cx=".5" cy=".5" r=".8"><stop offset="0" stop-color="#e9ddff"/><stop offset=".6" stop-color="#a98bff"/><stop offset="1" stop-color="#5b2bd6"/></radialGradient>
<linearGradient id="card" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e3dcff"/></linearGradient>
</defs>'''

def T(x, y, s, size, fill, anchor="middle", ls=0, extra=""):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" style="{F}font-size:{size}px;letter-spacing:{ls}px" fill="{fill}" {extra}>{s}</text>'

def text3d(x, y, s, size, face="url(#gold)", side="#c2410c", depth=14, rot=0, sw=18):
    base = f'x="{x}" y="{y}" text-anchor="middle" style="{F}font-size:{size}px;letter-spacing:1px"'
    t = f'<g transform="rotate({rot} {x} {y})">'
    t += f'<text {base} fill="#000" opacity=".4" filter="url(#b12)" stroke="#000" stroke-width="{sw}" transform="translate({depth+6} {depth+18})">{s}</text>'
    for i in range(depth, 0, -2):
        t += f'<text {base} fill="{side}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round" transform="translate({i*0.5:.1f} {i})">{s}</text>'
    t += f'<text {base} fill="{face}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round" paint-order="stroke">{s}</text>'
    t += f'<text {base} fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2" transform="translate(-2 -3)">{s}</text></g>'
    return t

# ---------------- NHÂN VẬT XANH ----------------
def limb(pts, w, seams=True):
    d = f'M{pts[0][0]} {pts[0][1]} ' + ' '.join(f'L{x} {y}' for x, y in pts[1:])
    o = f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w+9}" stroke-linecap="round" stroke-linejoin="round"/>'
    o += f'<path d="{d}" fill="none" stroke="#6fc61c" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
    o += f'<path d="{d}" fill="none" stroke="#b6f24a" stroke-width="{w*0.3}" stroke-linecap="round" stroke-linejoin="round" opacity=".7" transform="translate(-{w*0.17} -{w*0.17})"/>'
    if seams: o += f'<path d="{d}" fill="none" stroke="#2f7d0c" stroke-width="{w-6}" stroke-dasharray="3 {w*0.5:.0f}" opacity=".55"/>'
    return o

def mitten(x, y, r=32, rot=0):
    return (f'<g transform="rotate({rot} {x} {y})"><ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*0.92}" fill="url(#skin)" stroke="{INK}" stroke-width="5"/>'
            f'<ellipse cx="{x+r*0.55}" cy="{y-r*0.45}" rx="{r*0.28}" ry="{r*0.4}" fill="url(#skin)" stroke="{INK}" stroke-width="4" transform="rotate(30 {x+r*0.55} {y-r*0.45})"/>'
            f'<ellipse cx="{x-r*0.3}" cy="{y-r*0.35}" rx="{r*0.28}" ry="{r*0.18}" fill="#fff" opacity=".8"/></g>')

def torso():
    o = f'<path d="M-128 105 Q-158 125 -148 205 L-134 335 Q0 360 134 335 L148 205 Q158 125 128 105 Q0 140 -128 105Z" fill="url(#jk)" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
    o += f'<path d="M-128 112 Q-150 130 -141 205 L-128 330" fill="none" stroke="#e9ffb0" stroke-width="8" stroke-linecap="round" opacity=".6"/>'
    for y in (170, 232, 294):
        o += f'<path d="M-146 {y} Q0 {y+26} 146 {y}" fill="none" stroke="#2f7d0c" stroke-width="5" opacity=".6"/>'
    o += f'<path d="M0 130 L0 345" stroke="{INK}" stroke-width="6"/><circle cx="0" cy="345" r="0"/>'
    o += f'<path d="M-26 120 Q-30 165 -26 210 M26 120 Q30 165 28 214" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>'
    o += f'<circle cx="-26" cy="214" r="6" fill="#fff" stroke="{INK}" stroke-width="3"/><circle cx="28" cy="218" r="6" fill="#fff" stroke="{INK}" stroke-width="3"/>'
    o += f'<g transform="translate(78 200)"><circle r="17" fill="none" stroke="#fff" stroke-width="6"/><path d="M8 10 L20 22" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>'
    return o

def collar():
    return (f'<ellipse cx="0" cy="104" rx="112" ry="40" fill="#3f5f1c" stroke="{INK}" stroke-width="6"/>'
            f'<ellipse cx="0" cy="96" rx="104" ry="32" fill="#5b8a2a"/>'
            + "".join(f'<circle cx="{x}" cy="{98+ (abs(x)/12)}" r="13" fill="#4d7a22"/>' for x in range(-90, 100, 26)))

def hair():
    o = ''
    for x in (-78, -52, -26, 0, 26, 52, 78):
        ty = -98*math.sqrt(max(0, 1-(x/110)**2)) - 6
        o += f'<polygon points="{x-15},{ty+14} {x+4*(1 if x>=0 else -1)},{ty-30} {x+15},{ty+14}" fill="url(#hair)" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
    o += (f'<path d="M-104 -14 C-116 -88 -62 -112 0 -112 C62 -112 116 -88 104 -14 L88 -42 L70 -22 L52 -46 L32 -24 L10 -50 L-10 -26 L-32 -50 L-54 -26 L-76 -48 L-92 -26 Z" '
          f'fill="url(#hair)" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
          f'<path d="M-92 -60 Q-60 -96 -10 -98" fill="none" stroke="#ffd29a" stroke-width="8" stroke-linecap="round" opacity=".7"/>')
    o += (f'<path d="M6 -112 L8 -126" stroke="{INK}" stroke-width="6"/><circle cx="10" cy="-140" r="22" fill="url(#skin)" stroke="{INK}" stroke-width="6"/>'
          f'<ellipse cx="3" cy="-147" rx="7" ry="5" fill="#fff"/>')
    return o

def face(mood):
    e = ''
    brow = lambda d: f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
    dot = lambda x, y, rx=10, ry=13: (f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{INK}"/><circle cx="{x+3}" cy="{y-4}" r="3.5" fill="#fff"/>')
    cheeks = '<ellipse cx="-62" cy="38" rx="17" ry="10" fill="#ff8fb0" opacity=".45"/><ellipse cx="62" cy="38" rx="17" ry="10" fill="#ff8fb0" opacity=".45"/>'
    if mood == "sad":
        e = dot(-38, 8) + dot(38, 8) + brow("M-60 -16 Q-42 -24 -20 -8") + brow("M20 -8 Q42 -24 60 -16") + f'<path d="M-24 56 Q0 40 24 56" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
    elif mood == "flex":  # tự tin, nhếch mép
        e = dot(-38, 8, 10, 12) + dot(38, 8, 10, 12) + brow("M-62 -18 Q-40 -30 -16 -14") + brow("M16 -22 Q40 -34 62 -22") + \
            f'<path d="M-30 46 Q8 72 40 36" fill="#fff" stroke="{INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>' + cheeks
    elif mood == "fine":  # cười gượng, đổ mồ hôi
        e = dot(-38, 8, 9, 12) + dot(38, 8, 9, 12) + brow("M-62 -12 Q-42 -28 -18 -20") + brow("M18 -20 Q42 -28 62 -12") + \
            f'<path d="M-44 40 Q0 82 44 40 Z" fill="#fff" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/><path d="M-36 52 L36 52 M-14 44 L-14 68 M14 44 L14 68" stroke="{INK}" stroke-width="3"/>' + cheeks + \
            f'<path d="M104 -40 q14 28 0 38 q-16 -10 0 -38z" fill="#7fd4ff" stroke="{INK}" stroke-width="4"/><path d="M-100 20 q12 24 0 34 q-14 -10 0 -34z" fill="#7fd4ff" stroke="{INK}" stroke-width="4"/>'
    elif mood == "bigeyes":  # mắt khổng lồ phản chiếu chữ
        lines = ["Eggs 3.89", "Oat milk 4.19", "Total 61.47", "1215 Magna", "Locker 22-8-31", "Page 212", "A+ 50/50"]
        for sx in (-1, 1):
            cx = sx*46
            e += f'<ellipse cx="{cx}" cy="4" rx="40" ry="46" fill="#fff" stroke="{INK}" stroke-width="3.5"/>'
            e += f'<circle cx="{cx}" cy="6" r="31" fill="url(#iris)"/><circle cx="{cx}" cy="6" r="31" fill="none" stroke="#2a1070" stroke-width="2.5"/>'
            e += f'<clipPath id="ir{sx}"><circle cx="{cx}" cy="6" r="29"/></clipPath><g clip-path="url(#ir{sx})" fill="#e0fbff" style="{F}font-size:5.6px">'
            for i, t in enumerate(lines): e += f'<text x="{cx-24}" y="{-14+i*7.6}" opacity="{.95 if i%2 else .6}">{t}</text>'
            e += '</g>' + f'<circle cx="{cx}" cy="8" r="9" fill="#0b0636"/><circle cx="{cx+10}" cy="-8" r="7" fill="#fff"/><circle cx="{cx-9}" cy="20" r="3.5" fill="#fff" opacity=".8"/>'
        e += brow("M-88 -50 Q-50 -66 -12 -44") + brow("M12 -44 Q50 -66 88 -50") + f'<path d="M-18 72 Q0 66 18 72" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
    return e

def head(mood):
    return (f'<ellipse cx="0" cy="0" rx="108" ry="100" fill="url(#skin)" stroke="{INK}" stroke-width="6"/>'
            f'<path d="M70 -50 Q110 -10 90 44" fill="none" stroke="#c4d0ea" stroke-width="10" stroke-linecap="round" opacity=".7"/>'
            + hair() + face(mood))

def kid(cx, cy, s, pose="none", mood="sad", rot=0):
    g = f'<g transform="translate({cx} {cy}) rotate({rot}) scale({s})">'
    if pose == "flex":
        g += limb([(124, 150), (156, 250), (140, 335)], 62)   # tay phải xuống
        g += torso()
        g += limb([(-120, 150), (-262, 160)], 78) + limb([(-262, 160), (-266, 30)], 64)
        g += f'<ellipse cx="-190" cy="150" rx="78" ry="62" fill="#78d11f" stroke="{INK}" stroke-width="6" transform="rotate(-6 -190 150)"/><path d="M-250 140 Q-190 118 -130 140 M-250 170 Q-190 192 -130 170" fill="none" stroke="#2f7d0c" stroke-width="5" opacity=".6"/>'
        g += mitten(-266, -18, 44)
    elif pose == "defend":
        g += limb([(-124, 160), (-196, 270), (-168, 150)], 60) + limb([(124, 160), (196, 270), (168, 150)], 60)
        g += torso() + mitten(-166, 126, 40, -15) + mitten(166, 126, 40, 15)
    else:
        g += torso()
    g += collar()
    g += f'<ellipse cx="0" cy="104" rx="70" ry="16" fill="#000" opacity=".25" filter="url(#b6)"/>' + head(mood)
    return g + '</g>'

# ---------------- ĐẠO CỤ ----------------
def star(x, y, s, fill="#fff3a0"):
    p = f"{x},{y-s} {x+s*.25},{y-s*.25} {x+s},{y} {x+s*.25},{y+s*.25} {x},{y+s} {x-s*.25},{y+s*.25} {x-s},{y} {x-s*.25},{y-s*.25}"
    return f'<polygon points="{p}" fill="{fill}" filter="url(#glow)"/>'

def rays(cx, cy, n, op, c="#fff", R=1700):
    out = ""
    for i in range(n):
        a1 = 2*math.pi*i/n; a2 = a1 + math.pi/n
        out += f'<polygon points="{cx},{cy} {cx+R*math.cos(a1):.0f},{cy+R*math.sin(a1):.0f} {cx+R*math.cos(a2):.0f},{cy+R*math.sin(a2):.0f}"/>'
    return f'<g fill="{c}" opacity="{op}">{out}</g>'

def card(x, y, w, h, rot, inner, fill="url(#card)", glow="#5ff2ff", blur=0):
    f = f' filter="url(#b{blur})" opacity=".8"' if blur else ''
    return (f'<g transform="rotate({rot} {x+w/2} {y+h/2})"{f}><rect x="{x-6}" y="{y-6}" width="{w+12}" height="{h+12}" rx="26" fill="{glow}" opacity=".4" filter="url(#soft)"/>'
            f'<rect x="{x+10}" y="{y+16}" width="{w}" height="{h}" rx="22" fill="#000" opacity=".4" filter="url(#b6)"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="22" fill="{fill}" stroke="{INK}" stroke-width="6"/>'
            f'<rect x="{x+8}" y="{y+8}" width="{w-16}" height="{h*0.3}" rx="14" fill="#fff" opacity=".55"/>{inner}</g>')

def brain(cx, cy, s=1.0):
    g = f'<g transform="translate({cx} {cy}) scale({s})">'
    blobs = [(-95,-55,100),(5,-95,105),(100,-50,100),(-105,45,95),(105,50,95),(0,38,110),(-42,100,74),(52,105,74)]
    g += "".join(f'<circle cx="{bx}" cy="{by}" r="{br}" fill="#c2336f" stroke="{INK}" stroke-width="10"/>' for bx,by,br in blobs)
    g += "".join(f'<circle cx="{bx}" cy="{by}" r="{br-5}" fill="url(#pink)"/>' for bx,by,br in blobs)
    g += f'<path d="M0 -158 Q-26 -86 6 -22 Q32 42 0 160" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round" opacity=".7"/>'
    for d in ["M-135 -30 q42 -32 74 0 t62 -10","M-146 52 q52 -36 94 6","M62 -64 q42 -26 84 6","M72 58 q42 -32 78 0"]:
        g += f'<path d="{d}" fill="none" stroke="#a31d5a" stroke-width="9" stroke-linecap="round" opacity=".7"/>'
    g += '<ellipse cx="-62" cy="-100" rx="46" ry="20" fill="#fff" opacity=".65" transform="rotate(-25 -62 -100)"/>'
    return g + '</g>'

def books(x0, y0, w, rows, seed=3, op=.5):
    rnd = random.Random(seed); cols = ["#ff5d8f", "#ffd23f", "#3ddc97", "#4cc9f0", "#f72585", "#b5179e", "#7209b7", "#ff9e00"]
    o = f'<g opacity="{op}" filter="url(#b3)">'
    for r in range(rows):
        y = y0 + r*118; x = x0
        o += f'<rect x="{x0-10}" y="{y+96}" width="{w+20}" height="16" fill="#1a0f4d"/>'
        while x < x0 + w:
            bw = rnd.randint(18, 34); bh = rnd.randint(64, 92)
            o += f'<rect x="{x}" y="{y+96-bh}" width="{bw}" height="{bh}" rx="3" fill="{rnd.choice(cols)}" stroke="#1a0f4d" stroke-width="3"/>'
            x += bw + 2
    return o + '</g>'

def streak(cx, cy, tx, ty, L=260, w=60, op=.28):
    dx, dy = cx - tx, cy - ty; d = math.hypot(dx, dy); ux, uy = dx/d, dy/d
    px, py = -uy, ux
    return f'<polygon points="{cx+px*w:.0f},{cy+py*w:.0f} {cx+ux*L:.0f},{cy+uy*L:.0f} {cx-px*w:.0f},{cy-py*w:.0f}" fill="#fff" opacity="{op}" filter="url(#b6)"/>'

def duration():
    return f'<g transform="translate(1186 690)"><rect x="-62" y="-30" width="124" height="44" rx="9" fill="#000" opacity=".85"/><text x="0" y="3" text-anchor="middle" fill="#fff" style="font-family:Arial;font-weight:700;font-size:28px">10:12</text></g>'

def svg(b): return f'<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">{DEFS}{b}</svg>'

# ================= MẪU 1: LEVEL UP (học từ "LEVEL 10") =================
def thumb1():
    b = '<rect width="1280" height="720" fill="url(#bgA)"/>' + books(-30, 20, 1340, 6, 5, .45) + rays(430, 380, 28, .1)
    b += '<circle cx="430" cy="360" r="330" fill="#5ff2ff" opacity=".35" filter="url(#soft)"/>'
    b += "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" opacity=".45" filter="url(#b6)"/>' for x,y,r,c in [(80,90,22,"#ffe14d"),(1180,70,26,"#ff7ad9"),(620,670,28,"#5ff2ff"),(1230,420,20,"#ffe14d")])
    b += kid(430, 290, 1.5, "flex", "flex")
    for x,y,s in [(150,520,26),(660,150,24),(110,150,20),(700,560,22)]: b += star(x, y, s)
    # thẻ chỉ số kiểu game
    rows = ""
    def bar(y, label, pct, col, val, icon):
        o = f'<text x="745" y="{y}" style="{F}font-size:34px" fill="{INK}">{label}</text>'
        o += f'<rect x="745" y="{y+12}" width="300" height="30" rx="15" fill="#c9d4f5" stroke="{INK}" stroke-width="4"/>'
        o += f'<rect x="749" y="{y+16}" width="{292*pct}" height="22" rx="11" fill="{col}"/><rect x="755" y="{y+19}" width="{280*pct}" height="7" rx="3" fill="#fff" opacity=".55"/>'
        if val: o += f'<text x="{745+300*pct-8}" y="{y+37}" text-anchor="end" style="{F}font-size:24px" fill="#fff" stroke="{INK}" stroke-width="5" paint-order="stroke">{val}</text>'
        o += f'<g transform="translate(1100 {y+10})"><rect x="-30" y="-30" width="60" height="60" rx="14" fill="#34d058" stroke="{INK}" stroke-width="5"/><path d="M-14 0H14M0 -14V14" stroke="#fff" stroke-width="9" stroke-linecap="round"/></g>'
        return o
    inner = T(930, 218, "LEVEL UP!", 62, "#ffd21f", extra=f'stroke="{INK}" stroke-width="12" paint-order="stroke" stroke-linejoin="round"')
    inner += star(740, 190, 18) + star(1120, 200, 22)
    inner += brain(705, 360, .12) + bar(335, "MEMORY", 1.0, "#22d3ee", "100x", "")
    inner += bar(440, "FORGETTING", 0.04, "#ff5d5d", "", "") + bar(545, "FOCUS", .62, "#a3e635", "", "")
    b += card(690, 150, 470, 470, 3, inner, glow="#ffd21f")
    b += text3d(868, 112, "100x MEMORY", 100, rot=-3, sw=15)
    return svg(b + duration())

# ================= MẪU 2: "THIS IS FINE" - không thể quên =================
def thumb2():
    cx, cy = 640, 440
    b = '<rect width="1280" height="720" fill="url(#bgB)"/>' + rays(cx, cy, 30, .12) + '<rect width="1280" height="720" fill="none"/>'
    def bubble(t1, t2=""):
        return T(0, 0, "", 1)
    cards = [
        (30, 170, 260, 125, -10, "bubble", ["you're kind", "of a lot..."]),
        (30, 430, 230, 190, 9, "photo", "2015"),
        (305, 330, 150, 110, -6, "grade", "F-"),
        (985, 165, 260, 125, 10, "bubble", ["Honestly,", "Ava?"]),
        (1000, 420, 240, 150, -8, "fail", "cringe"),
        (835, 300, 150, 110, 7, "bubble", ["REPLAY", "#600"]),
    ]
    for (x, y, w, h, rot, kind, data) in cards:
        b += streak(x+w/2, y+h/2, cx, cy)
    for (x, y, w, h, rot, kind, data) in cards:
        mx, my = x + w/2, y + h/2
        if kind == "bubble":
            inner = T(mx, my-6, data[0], 36, INK) + T(mx, my+34, data[1], 36, "#e11d48")
            b += card(x, y, w, h, rot, inner)
        elif kind == "photo":
            inner = f'<rect x="{x+18}" y="{y+22}" width="{w-36}" height="{h-72}" rx="10" fill="#7dd3fc" stroke="{INK}" stroke-width="5"/><circle cx="{x+60}" cy="{y+56}" r="16" fill="#ffe14d" stroke="{INK}" stroke-width="3"/><path d="M{x+18} {y+h-50} l60 -50 40 30 50 -40 40 40 v20 h-{w-36}z" fill="#34d058" stroke="{INK}" stroke-width="4"/>' + T(mx, y+h-14, data, 36, INK)
            inner += f'<g transform="rotate(-14 {mx+30} {my})"><rect x="{mx-20}" y="{my-30}" width="120" height="48" rx="8" fill="none" stroke="#e11d2e" stroke-width="6"/>' + T(mx+40, my+8, "FAIL", 38, "#e11d2e") + '</g>'
            b += card(x, y, w, h, rot, inner)
        elif kind == "grade":
            inner = f'<circle cx="{mx}" cy="{my}" r="46" fill="none" stroke="#e11d2e" stroke-width="8"/>' + T(mx, my+22, data, 62, "#e11d2e")
            b += card(x, y, w, h, rot, inner)
        else:
            inner = f'<circle cx="{mx-50}" cy="{my}" r="42" fill="#ffd23f" stroke="{INK}" stroke-width="5"/><circle cx="{mx-64}" cy="{my-8}" r="5" fill="{INK}"/><circle cx="{mx-36}" cy="{my-8}" r="5" fill="{INK}"/><ellipse cx="{mx-70}" cy="{my+10}" rx="9" ry="5" fill="#ff7a9a"/><ellipse cx="{mx-30}" cy="{my+10}" rx="9" ry="5" fill="#ff7a9a"/><path d="M{mx-64} {my+22} q14 -8 28 0" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>' + T(mx+50, my+14, data, 32, INK)
            b += card(x, y, w, h, rot, inner, glow="#ff7ad9")
    b += kid(cx, cy, 1.55, "defend", "fine")
    b += star(560, 190, 22) + star(740, 190, 18) + star(250, 140, 20, "#fff") + star(1180, 330, 20, "#fff")
    b += text3d(640, 130, "CAN'T FORGET", 128, rot=-2, sw=18)
    b += f'<g transform="translate(1090 640) rotate(-6)"><rect x="-96" y="-42" width="192" height="84" rx="22" fill="url(#red)" stroke="{INK}" stroke-width="6"/><path d="M-72 -22 L-72 22 L-40 0Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>' + T(18, 22, "600", 62, "#fff", extra=f'stroke="{INK}" stroke-width="8" paint-order="stroke"') + '</g>'
    return svg(b + duration())

# ================= MẪU 3: mắt khổng lồ (học từ "you see everything...") =================
def thumb3():
    b = '<rect width="1280" height="720" fill="url(#bgC)"/>' + rays(640, 420, 24, .14)
    b += f'<g transform="translate(640 480) scale(4.5)">{head("bigeyes")}</g>'
    # đốm sáng lấp lánh trong mắt
    b += star(330, 360, 30) + star(930, 600, 24) + star(1130, 240, 26, "#fff") + star(160, 280, 22, "#fff")
    b += text3d(640, 122, "you remember everything...", 78, face="#ffffff", side="#6d28d9", depth=10, sw=14, rot=-1)
    b += f'<g transform="translate(1150 530) rotate(-8)"><circle r="92" fill="url(#red)" stroke="{INK}" stroke-width="7"/><circle r="74" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="10 8"/>' + T(0, 24, "100x", 62, "#fff", extra=f'stroke="{INK}" stroke-width="9" paint-order="stroke"') + '</g>'
    return svg(b + duration())

for n, fn in [("v3_thumbnail_1_level_up", thumb1), ("v3_thumbnail_2_cant_forget", thumb2), ("v3_thumbnail_3_big_eyes", thumb3)]:
    (OUT/f"{n}.svg").write_text(fn(), encoding="utf-8")
print("ok")
