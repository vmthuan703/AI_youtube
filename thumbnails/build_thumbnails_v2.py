"""Thumbnail v2 cho IfAhead: dùng đúng nhân vật kênh (đầu đen, viền cyan, hoodie tím), có chiều sâu.
Chạy: python3 build_thumbnails_v2.py && node render_v2.js"""
import math, pathlib
OUT = pathlib.Path(__file__).parent
CY, YEL, INK, PUR = "#22e5ff", "#fde047", "#08060f", "#7c3aed"
FONT = "font-family:'Inter','Inter Display',Arial;font-weight:900;"

DEFS = f'''<defs>
<filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="softglow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="22"/></filter>
<filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="blur9"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="shadow" x="-30%" y="-30%" width="170%" height="170%"><feDropShadow dx="8" dy="14" stdDeviation="9" flood-color="#000" flood-opacity=".55"/></filter>
<radialGradient id="head" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#2a1747"/><stop offset=".5" stop-color="#0d0718"/><stop offset="1" stop-color="#030208"/></radialGradient>
<linearGradient id="hood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a06bff"/><stop offset=".55" stop-color="#7c3aed"/><stop offset="1" stop-color="#4c1d95"/></linearGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0a4a"/><stop offset=".55" stop-color="#6b21a8"/><stop offset="1" stop-color="#f97316"/></linearGradient>
<radialGradient id="spot" cx=".6" cy=".45" r=".6"><stop offset="0" stop-color="#c084fc" stop-opacity=".75"/><stop offset="1" stop-color="#c084fc" stop-opacity="0"/></radialGradient>
<radialGradient id="pink" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ffc2dd"/><stop offset=".5" stop-color="#ff7eb3"/><stop offset="1" stop-color="#c2336f"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7a8"/><stop offset=".5" stop-color="#fde047"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
<linearGradient id="cardg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ddd6fe"/></linearGradient>
<linearGradient id="gray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4468"/><stop offset="1" stop-color="#151a33"/></linearGradient>
<linearGradient id="warm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb703"/><stop offset=".5" stop-color="#fb5607"/><stop offset="1" stop-color="#9d174d"/></linearGradient>
</defs>'''

def text3d(x, y, s, size, face="url(#gold)", side="#b45309", depth=14, rot=0, sw=16, ls=-2):
    base = f'x="{x}" y="{y}" text-anchor="middle" style="{FONT}font-size:{size}px;letter-spacing:{ls}px"'
    t = f'<g transform="rotate({rot} {x} {y})">'
    t += f'<text {base} fill="#000" opacity=".45" filter="url(#blur9)" transform="translate({depth+8} {depth+16})" stroke="#000" stroke-width="{sw}">{s}</text>'
    for i in range(depth, 0, -2):
        t += f'<text {base} fill="{side}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round" transform="translate({i*0.7:.1f} {i})">{s}</text>'
    t += f'<text {base} fill="{face}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round" paint-order="stroke">{s}</text>'
    t += f'<text {base} fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" transform="translate(-2 -3)">{s}</text></g>'
    return t

def hero(cx, cy, k=1.0, mood="wow", arm=None, flip=False):
    """Nhân vật IfAhead. mood: wow | confused | smug | happy. arm: None | 'point' | 'head'"""
    sx = -k if flip else k
    g = f'<g transform="translate({cx} {cy}) scale({sx} {k})">'
    g += '<ellipse cx="0" cy="235" rx="190" ry="26" fill="#000" opacity=".4" filter="url(#blur9)"/>'
    # cánh tay (sau thân)
    if arm == "point":
        g += (f'<path d="M110 150 Q210 120 270 40" fill="none" stroke="{INK}" stroke-width="64" stroke-linecap="round"/>'
              f'<path d="M110 150 Q210 120 270 40" fill="none" stroke="url(#hood)" stroke-width="50" stroke-linecap="round"/>'
              f'<circle cx="282" cy="26" r="34" fill="url(#head)" stroke="{CY}" stroke-width="7" filter="url(#glow)"/>')
    # thân
    g += f'<path d="M-160 235 Q-165 100 -66 88 L66 88 Q165 100 160 235 Z" fill="url(#hood)" stroke="{CY}" stroke-width="7" filter="url(#glow)"/>'
    g += '<path d="M-160 235 Q-165 100 -66 88 L-40 90 Q-100 130 -90 235 Z" fill="#fff" opacity=".12"/>'
    g += '<path d="M60 92 Q150 110 160 235 L110 235 Q120 140 60 92Z" fill="#1e0a4a" opacity=".35"/>'
    g += '<path d="M-52 150 Q-20 175 -40 235 M60 170 Q90 200 70 235" fill="none" stroke="#2e1065" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>'
    g += f'<path d="M-66 88 Q0 158 66 88" fill="none" stroke="#c4b5fd" stroke-width="10" stroke-linecap="round"/>'
    g += '<path d="M-30 128 L-34 180 M30 128 L34 180" stroke="#f3e8ff" stroke-width="6" stroke-linecap="round"/>'
    # bóng đầu đổ lên áo
    g += '<ellipse cx="0" cy="104" rx="95" ry="30" fill="#1e0a4a" opacity=".55" filter="url(#blur4)"/>'
    if arm == "head":
        g += (f'<path d="M-120 170 Q-210 120 -150 20" fill="none" stroke="{INK}" stroke-width="60" stroke-linecap="round"/>'
              f'<path d="M-120 170 Q-210 120 -150 20" fill="none" stroke="url(#hood)" stroke-width="46" stroke-linecap="round"/>'
              f'<circle cx="-140" cy="0" r="32" fill="url(#head)" stroke="{CY}" stroke-width="7" filter="url(#glow)"/>')
    # tóc
    for d in ["M-14 -100 Q-52 -142 -8 -170 Q-18 -136 18 -102 Z", "M22 -100 Q8 -134 48 -150 Q34 -126 54 -92 Z"]:
        g += f'<path d="{d}" fill="url(#head)" stroke="{CY}" stroke-width="6" stroke-linejoin="round" filter="url(#glow)"/>'
    # đầu
    g += f'<ellipse cx="0" cy="0" rx="108" ry="102" fill="url(#head)" stroke="{CY}" stroke-width="7" filter="url(#glow)"/>'
    g += '<path d="M-86 -50 Q-62 -86 -20 -96" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="7" stroke-linecap="round"/>'
    g += f'<path d="M80 -40 Q100 0 84 52" fill="none" stroke="{CY}" stroke-opacity=".5" stroke-width="10" stroke-linecap="round" filter="url(#blur4)"/>'
    # mắt
    if mood == "wow":
        er, pr, pdx, pdy = 38, 15, 0, 2
        brows = "M-80 -62 Q-42 -88 -8 -62 M8 -62 Q42 -88 80 -62"
        mouth = f'<path d="M-26 40 Q0 96 26 40 Z" fill="#3b0764" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M-14 70 Q0 56 14 70 Q0 86 -14 70" fill="#ff6b9d"/>'
    elif mood == "confused":
        er, pr, pdx, pdy = 32, 10, -6, -4
        brows = "M-76 -42 Q-44 -70 -14 -62 M12 -50 Q42 -44 72 -34"
        mouth = '<path d="M-28 58 q10 -14 19 0 t19 0 t19 0" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>'
    elif mood == "smug":
        er, pr, pdx, pdy = 33, 15, 8, 8
        brows = "M-76 -52 Q-44 -64 -14 -50 M14 -64 Q44 -84 76 -64"
        mouth = '<path d="M-30 52 Q6 78 38 36" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>'
    else:
        er, pr, pdx, pdy = 33, 15, 11, 4
        brows = "M-72 -50 Q-40 -66 -12 -50 M12 -50 Q40 -66 72 -50"
        mouth = '<path d="M-22 56 Q0 74 22 56" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>'
    for ex in (-40, 40):
        g += f'<circle cx="{ex}" cy="-6" r="{er}" fill="#fff"/><circle cx="{ex}" cy="-6" r="{er}" fill="none" stroke="#ddd6fe" stroke-width="3"/>'
        g += f'<circle cx="{ex+pdx}" cy="{-6+pdy}" r="{pr}" fill="{INK}"/><circle cx="{ex+pdx+6}" cy="{-6+pdy-6}" r="5" fill="#fff"/>'
        g += f'<ellipse cx="{ex}" cy="{-6+er-6}" rx="{er*0.6}" ry="5" fill="#c4b5fd" opacity=".4"/>'
    if mood == "smug":  # mí mắt rũ
        for ex in (-40, 40):
            g += f'<path d="M{ex-er-2} -10 A{er+2} {er+2} 0 0 1 {ex+er+2} -10 L{ex+er+2} -26 Q{ex} -38 {ex-er-2} -26Z" fill="url(#head)"/><path d="M{ex-er} -10 L{ex+er} -10" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'
    g += f'<path d="{brows}" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/>' + mouth
    if mood == "confused":
        g += f'<path d="M92 -70 q14 24 0 34 q-14 -10 0 -34z" fill="{CY}" stroke="#fff" stroke-width="3"/>'
    return g + '</g>'

def card(x, y, w, h, rot, inner, fill="url(#cardg)", glow=CY, blur=False):
    f = ' filter="url(#blur4)" opacity=".75"' if blur else ''
    return (f'<g transform="rotate({rot} {x+w/2} {y+h/2})"{f}>'
            f'<rect x="{x-6}" y="{y-6}" width="{w+12}" height="{h+12}" rx="24" fill="{glow}" opacity=".35" filter="url(#softglow)"/>'
            f'<rect x="{x+10}" y="{y+16}" width="{w}" height="{h}" rx="20" fill="#000" opacity=".4" filter="url(#blur4)"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="20" fill="{fill}" stroke="{INK}" stroke-width="6"/>'
            f'<rect x="{x+8}" y="{y+8}" width="{w-16}" height="{h*0.35}" rx="12" fill="#fff" opacity=".5"/>{inner}</g>')

def label(x, y, s, size, fill=INK):
    return f'<text x="{x}" y="{y}" text-anchor="middle" style="{FONT}font-size:{size}px;letter-spacing:-1px" fill="{fill}">{s}</text>'

def star(x, y, s, fill=YEL):
    p = f"{x},{y-s} {x+s*.25},{y-s*.25} {x+s},{y} {x+s*.25},{y+s*.25} {x},{y+s} {x-s*.25},{y+s*.25} {x-s},{y} {x-s*.25},{y-s*.25}"
    return f'<polygon points="{p}" fill="{fill}" filter="url(#glow)"/>'

def rays(cx, cy, n, op, c="#fff", R=1600):
    out = []
    for i in range(n):
        a1 = 2*math.pi*i/n; a2 = a1 + math.pi/n
        out.append(f'<polygon points="{cx},{cy} {cx+R*math.cos(a1):.0f},{cy+R*math.sin(a1):.0f} {cx+R*math.cos(a2):.0f},{cy+R*math.sin(a2):.0f}"/>')
    return f'<g fill="{c}" opacity="{op}">' + "".join(out) + '</g>'

def bokeh(seed_pts):
    return "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" opacity="{o}" filter="url(#blur4)"/>' for x, y, r, c, o in seed_pts)

def skyline(y0=720, op=.9):
    s = ""
    for x, y, w in [(0,520,130),(120,450,110),(220,560,90),(900,590,90),(1040,500,120),(1160,430,130),(1150,600,80)]:
        s += f'<rect x="{x}" y="{y}" width="{w}" height="{y0-y}" fill="#0b0720" opacity="{op}"/>'
        for i in range(max(w//24-1,0)):
            for j in range(4):
                if (i*7+j*3+x) % 4: s += f'<rect x="{x+10+i*24}" y="{y+16+j*30}" width="9" height="13" fill="{YEL}" opacity=".6"/>'
    return s

def brain(cx, cy, s=1.0):
    g = f'<g transform="translate({cx} {cy}) scale({s})">'
    g += f'<circle r="300" fill="{CY}" opacity=".28" filter="url(#softglow)"/><circle r="230" fill="{YEL}" opacity=".35" filter="url(#softglow)"/>'
    blobs = [(-95,-55,100),(5,-95,105),(100,-50,100),(-105,45,95),(105,50,95),(0,38,110),(-42,100,74),(52,105,74)]
    g += '<g filter="url(#shadow)">' + "".join(f'<circle cx="{bx}" cy="{by}" r="{br}" fill="#c2336f" stroke="{INK}" stroke-width="9"/>' for bx,by,br in blobs) + '</g>'
    g += "".join(f'<circle cx="{bx}" cy="{by}" r="{br-5}" fill="url(#pink)"/>' for bx,by,br in blobs)
    g += f'<path d="M0 -158 Q-26 -86 6 -22 Q32 42 0 160" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round" opacity=".8"/>'
    for d in ["M-135 -30 q42 -32 74 0 t62 -10","M-146 52 q52 -36 94 6","M62 -64 q42 -26 84 6","M72 58 q42 -32 78 0","M-74 -100 q32 22 62 -6","M-52 104 q32 -22 58 5"]:
        g += f'<path d="{d}" fill="none" stroke="#a31d5a" stroke-width="8" stroke-linecap="round" opacity=".7"/>'
    # mạch thần kinh phát sáng
    for d in ["M-120 -10 L-60 -40 L-10 0 L50 -30 L110 10","M-100 70 L-40 40 L20 80 L90 50"]:
        g += f'<path d="{d}" fill="none" stroke="{CY}" stroke-width="5" stroke-linecap="round" filter="url(#glow)"/>'
    for x, y in [(-60,-40),(-10,0),(50,-30),(-40,40),(20,80),(90,50)]:
        g += f'<circle cx="{x}" cy="{y}" r="9" fill="#fff" stroke="{CY}" stroke-width="4" filter="url(#glow)"/>'
    g += '<ellipse cx="-62" cy="-100" rx="46" ry="20" fill="#fff" opacity=".6" transform="rotate(-25 -62 -100)"/>'
    return g + '</g>'

def duration():
    return f'<g transform="translate(1180 690)"><rect x="-62" y="-30" width="124" height="44" rx="9" fill="#000" opacity=".85"/><text x="0" y="3" text-anchor="middle" fill="#fff" style="font-family:Inter;font-weight:700;font-size:28px">10:12</text></g>'

def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">{DEFS}{body}</svg>'

# ================= MẪU 1 =================
def thumb1():
    b = '<rect width="1280" height="720" fill="url(#sky)"/>'
    b += rays(800, 360, 26, .1) + '<rect width="1280" height="720" fill="url(#spot)"/>'
    b += f'<circle cx="820" cy="720" r="330" fill="#fb923c" opacity=".5" filter="url(#softglow)"/>' + skyline()
    b += bokeh([(120,80,22,YEL,.5),(520,60,14,CY,.5),(1180,260,26,"#f0abfc",.4),(700,690,30,CY,.3),(40,400,30,"#f0abfc",.35)])
    b += brain(845, 370, 1.12)
    # thẻ ký ức: xa (mờ) -> gần (rõ)
    b += card(1050, 40, 190, 120, 9, label(1145, 128, "π 3.14", 42), blur=True)
    b += card(610, 40, 190, 120, -9, label(705, 128, "A+", 70, "#16a34a"))
    b += card(1075, 450, 175, 175, -8, f'<rect x="1096" y="474" width="133" height="90" rx="10" fill="#e0f2fe" stroke="{INK}" stroke-width="5"/><circle cx="1130" cy="504" r="14" fill="{YEL}" stroke="{INK}" stroke-width="3"/><path d="M1096 564 l36 -36 28 22 32 -30 37 38 v6 h-133z" fill="#22c55e" stroke="{INK}" stroke-width="4"/>' + label(1162, 604, "2015", 30), glow=YEL)
    b += card(560, 520, 205, 115, 7, label(662, 566, "Her name:", 28) + label(662, 612, "EMMA ✓", 42, "#e11d48"), fill="url(#gold)", glow=YEL)
    b += card(1000, 215, 120, 120, 12, label(1060, 300, "7×8", 38) + label(1060, 332, "=56", 28, "#7c3aed"), blur=True)
    b += star(520,300,32) + star(1235,370,28,"#fff") + star(780,40,24,"#fff") + star(930,690,22,YEL)
    b += hero(235, 440, 1.05, "wow", arm="point")
    b += text3d(300, 190, "100x", 215, rot=-5)
    b += text3d(285, 305, "MEMORY", 104, face="#ffffff", side="#7c3aed", depth=12, rot=-5, sw=14)
    return svg(b + duration())

# ================= MẪU 2 =================
def thumb2():
    b = '<rect width="1280" height="720" fill="url(#gray)"/>'
    # trái: sương mù, quên
    b += '<g filter="url(#blur9)" opacity=".5"><ellipse cx="200" cy="560" rx="260" ry="70" fill="#8b9bd0"/><ellipse cx="420" cy="260" rx="200" ry="50" fill="#8b9bd0"/></g>'
    for (x,y,sz,r,o) in [(70,150,130,-14,.9),(420,110,100,12,.8),(60,430,90,10,.6),(480,300,120,-10,.9)]:
        b += f'<text x="{x}" y="{y+sz*.35}" text-anchor="middle" transform="rotate({r} {x} {y})" style="{FONT}font-size:{sz}px" fill="{YEL}" stroke="{INK}" stroke-width="10" paint-order="stroke" opacity="{o}">?</text>'
    b += hero(255, 400, 1.0, "confused", arm="head")
    b += text3d(260, 668, "FORGET", 112, face="#e5e7eb", side="#475569", depth=12, rot=-3, sw=14)
    # phải: nhớ tất cả
    b += '<polygon points="700,0 1280,0 1280,720 600,720" fill="url(#warm)"/>'
    b += f'<g clip-path="url(#rc)"><clipPath id="rc"><polygon points="700,0 1280,0 1280,720 600,720"/></clipPath>{rays(980,380,22,.2)}</g>'
    b += f'<circle cx="1000" cy="420" r="300" fill="{YEL}" opacity=".35" filter="url(#softglow)"/>'
    b += f'<line x1="700" y1="0" x2="600" y2="720" stroke="{INK}" stroke-width="14"/><line x1="700" y1="0" x2="600" y2="720" stroke="{CY}" stroke-width="4" filter="url(#glow)"/>'
    b += card(740, 60, 250, 100, -6, label(865, 130, "3.14159265", 40), blur=True)
    b += card(1030, 60, 180, 130, 8, label(1120, 150, "A+", 82, "#16a34a"))
    b += card(1060, 240, 150, 110, -5, label(1135, 312, "EMMA ✓", 34, "#e11d48"), fill="url(#gold)", glow=YEL)
    b += hero(985, 400, 1.0, "smug", flip=False)
    b += star(760,330,28,"#fff") + star(1240,380,32) + star(1160,650,24,"#fff")
    b += text3d(960, 668, "REMEMBER ALL", 84, rot=-3, sw=13, depth=12)
    # huy hiệu 100x
    b += f'<g transform="translate(655 340) rotate(-8)"><circle r="165" fill="{CY}" opacity=".5" filter="url(#softglow)"/><circle cx="8" cy="14" r="150" fill="#000" opacity=".4" filter="url(#blur9)"/>' \
         f'<circle r="150" fill="#e11d48" stroke="{INK}" stroke-width="10"/><circle r="150" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="30" stroke-dasharray="4 700" transform="rotate(-110)"/>' \
         f'<circle r="126" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 10"/>' + text3d(0, 50, "100x", 148, depth=10, sw=12) + '</g>'
    return svg(b + duration())

for name, fn in [("v2_thumbnail_1_brain_100x", thumb1), ("v2_thumbnail_2_before_after", thumb2)]:
    (OUT/f"{name}.svg").write_text(fn(), encoding="utf-8")
print("ok")
