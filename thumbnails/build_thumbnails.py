"""Tạo 2 mẫu thumbnail cho video 'What If Your Memory Was 100x Better' (SVG -> PNG)."""
import subprocess, pathlib
OUT = pathlib.Path(__file__).parent
INK = "#1b1b3a"
FONT = "font-family:'Inter','Inter Display',Arial;font-weight:900;"

def text(x, y, s, size, fill, stroke=INK, sw=14, rot=0, anchor="middle", extra=""):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" transform="rotate({rot} {x} {y})" '
            f'style="{FONT}font-size:{size}px;letter-spacing:-2px" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="{sw}" stroke-linejoin="round" paint-order="stroke" {extra}>{s}</text>')

def guy(cx, cy, r=150, mood="happy", shades=False, hood="#2f6df6"):
    """Nhân vật đầu trắng, áo hoodie xanh giống ảnh mẫu. (cx,cy) = tâm đầu."""
    body = f'''
    <path d="M{cx-r*1.25} {cy+r*1.9} Q{cx-r*1.15} {cy+r*0.75} {cx-r*0.55} {cy+r*0.8}
             L{cx+r*0.55} {cy+r*0.8} Q{cx+r*1.15} {cy+r*0.75} {cx+r*1.25} {cy+r*1.9} Z"
          fill="{hood}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M{cx-r*0.7} {cy+r*0.75} Q{cx} {cy+r*1.25} {cx+r*0.7} {cy+r*0.75}" fill="none" stroke="{INK}" stroke-width="6"/>
    <line x1="{cx-r*0.2}" y1="{cy+r*1.1}" x2="{cx-r*0.2}" y2="{cy+r*1.55}" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
    <line x1="{cx+r*0.2}" y1="{cy+r*1.1}" x2="{cx+r*0.2}" y2="{cy+r*1.55}" stroke="#fff" stroke-width="7" stroke-linecap="round"/>'''
    head = f'<ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{r*0.95}" fill="#fff" stroke="{INK}" stroke-width="7"/>'
    ex, ey = r*0.38, -r*0.05
    if shades:
        eyes = (f'<rect x="{cx-r*0.78}" y="{cy-r*0.22}" width="{r*0.7}" height="{r*0.34}" rx="{r*0.12}" fill="{INK}"/>'
                f'<rect x="{cx+r*0.08}" y="{cy-r*0.22}" width="{r*0.7}" height="{r*0.34}" rx="{r*0.12}" fill="{INK}"/>'
                f'<rect x="{cx-r*0.1}" y="{cy-r*0.15}" width="{r*0.2}" height="{r*0.07}" fill="{INK}"/>'
                f'<path d="M{cx-r*0.65} {cy-r*0.15} l{r*0.25} 0" stroke="#fff" stroke-width="5" opacity=".6"/>')
    elif mood == "confused":
        eyes = (f'<ellipse cx="{cx-ex}" cy="{cy+ey}" rx="{r*0.12}" ry="{r*0.17}" fill="{INK}"/>'
                f'<ellipse cx="{cx+ex}" cy="{cy+ey}" rx="{r*0.12}" ry="{r*0.17}" fill="{INK}"/>'
                f'<path d="M{cx-ex-r*0.2} {cy+ey-r*0.3} L{cx-ex+r*0.2} {cy+ey-r*0.4}" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>'
                f'<path d="M{cx+ex-r*0.2} {cy+ey-r*0.4} L{cx+ex+r*0.2} {cy+ey-r*0.3}" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>')
    else:  # shocked/excited: mắt to
        eyes = (f'<ellipse cx="{cx-ex}" cy="{cy+ey}" rx="{r*0.15}" ry="{r*0.22}" fill="{INK}"/>'
                f'<ellipse cx="{cx+ex}" cy="{cy+ey}" rx="{r*0.15}" ry="{r*0.22}" fill="{INK}"/>'
                f'<circle cx="{cx-ex+r*0.04}" cy="{cy+ey-r*0.07}" r="{r*0.05}" fill="#fff"/>'
                f'<circle cx="{cx+ex+r*0.04}" cy="{cy+ey-r*0.07}" r="{r*0.05}" fill="#fff"/>'
                f'<path d="M{cx-ex-r*0.2} {cy+ey-r*0.38} Q{cx-ex} {cy+ey-r*0.5} {cx-ex+r*0.2} {cy+ey-r*0.38}" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>'
                f'<path d="M{cx+ex-r*0.2} {cy+ey-r*0.38} Q{cx+ex} {cy+ey-r*0.5} {cx+ex+r*0.2} {cy+ey-r*0.38}" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>')
    if mood == "confused":
        mouth = f'<path d="M{cx-r*0.25} {cy+r*0.5} q{r*0.12} -{r*0.12} {r*0.25} 0 t{r*0.25} 0" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
    elif mood == "smug":
        mouth = f'<path d="M{cx-r*0.3} {cy+r*0.42} Q{cx} {cy+r*0.62} {cx+r*0.4} {cy+r*0.35}" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
    else:
        mouth = (f'<path d="M{cx-r*0.3} {cy+r*0.38} Q{cx} {cy+r*0.85} {cx+r*0.3} {cy+r*0.38} Z" fill="{INK}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
                 f'<path d="M{cx-r*0.14} {cy+r*0.6} Q{cx} {cy+r*0.5} {cx+r*0.14} {cy+r*0.6} Q{cx} {cy+r*0.72} {cx-r*0.14} {cy+r*0.6}" fill="#ff6b8b"/>')
    return body + head + eyes + mouth

def star(x, y, s, fill="#fff176"):
    p = f"{x},{y-s} {x+s*.25},{y-s*.25} {x+s},{y} {x+s*.25},{y+s*.25} {x},{y+s} {x-s*.25},{y+s*.25} {x-s},{y} {x-s*.25},{y-s*.25}"
    return f'<polygon points="{p}" fill="{fill}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'

def card(x, y, w, h, rot, fill, content):
    return (f'<g transform="rotate({rot} {x+w/2} {y+h/2})">'
            f'<rect x="{x+6}" y="{y+8}" width="{w}" height="{h}" rx="18" fill="{INK}" opacity=".35"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="{fill}" stroke="{INK}" stroke-width="6"/>{content}</g>')

def rays(cx, cy, n, c1, c2, R=1500):
    import math
    out = []
    for i in range(n):
        a1 = 2*math.pi*i/n; a2 = a1 + math.pi/n
        out.append(f'<polygon points="{cx},{cy} {cx+R*math.cos(a1):.0f},{cy+R*math.sin(a1):.0f} {cx+R*math.cos(a2):.0f},{cy+R*math.sin(a2):.0f}" fill="{c1}"/>')
    return f'<rect width="1280" height="720" fill="{c2}"/>' + "".join(out)

def brain(cx, cy, s=1.0):
    # não hồng hoạt hình có hào quang
    g = f'<g transform="translate({cx} {cy}) scale({s})">'
    g += '<circle r="260" fill="#ffe14d" opacity=".35"/><circle r="200" fill="#fff6a8" opacity=".5"/>'
    blobs = [(-90,-50,95),(0,-90,100),(95,-45,95),(-100,40,90),(100,45,90),(0,35,105),(-40,95,70),(50,100,70)]
    for bx,by,br in blobs:
        g += f'<circle cx="{bx}" cy="{by}" r="{br}" fill="#ff8fb8" stroke="{INK}" stroke-width="8"/>'
    for bx,by,br in blobs:
        g += f'<circle cx="{bx}" cy="{by}" r="{br-4}" fill="#ff8fb8"/>'
    g += f'<path d="M0 -150 Q-25 -80 5 -20 Q30 40 0 150" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
    for d in ["M-130 -30 q40 -30 70 0 t60 -10","M-140 50 q50 -35 90 5","M60 -60 q40 -25 80 5","M70 55 q40 -30 75 0","M-70 -95 q30 20 60 -5","M-50 100 q30 -20 55 5"]:
        g += f'<path d="{d}" fill="none" stroke="#d6457f" stroke-width="7" stroke-linecap="round"/>'
    g += '<ellipse cx="-60" cy="-95" rx="40" ry="18" fill="#fff" opacity=".6" transform="rotate(-25 -60 -95)"/>'
    return g + '</g>'

# ---------------- MẪU 1: Não 100x + thẻ ký ức bay quanh ----------------
def thumb1():
    s = f'<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">'
    s += '<defs><radialGradient id="g1" cx="62%" cy="50%" r="75%"><stop offset="0" stop-color="#a64bff"/><stop offset="1" stop-color="#3a0ca3"/></radialGradient></defs>'
    s += '<rect width="1280" height="720" fill="url(#g1)"/>'
    s += f'<g opacity=".16">{rays(800,360,24,"#fff","none").split("/>",1)[1]}</g>'
    s += brain(850, 380, 1.15)
    s += card(640, 50, 170, 110, -10, "#fff", f'<text x="725" y="130" text-anchor="middle" style="{FONT}font-size:72px" fill="#2ecc71">A+</text>')
    s += card(1010, 70, 210, 130, 9, "#fff", f'<text x="1115" y="150" text-anchor="middle" style="{FONT}font-size:44px" fill="{INK}">π 3.14159</text>')
    s += card(1040, 470, 190, 190, -8, "#4dd0ff", f'<rect x="1062" y="492" width="146" height="100" rx="10" fill="#fff" stroke="{INK}" stroke-width="5"/><circle cx="1110" cy="530" r="18" fill="#ff8fb8" stroke="{INK}" stroke-width="4"/><path d="M1062 592 l40 -40 30 25 36 -30 40 40 v5 h-146z" fill="#2ecc71" stroke="{INK}" stroke-width="4"/><text x="1135" y="635" text-anchor="middle" style="{FONT}font-size:34px" fill="{INK}">2015</text>')
    s += card(555, 520, 200, 120, 7, "#ffd93d", f'<text x="655" y="565" text-anchor="middle" style="{FONT}font-size:30px" fill="{INK}">Her name:</text><text x="655" y="612" text-anchor="middle" style="{FONT}font-size:40px" fill="#e63946">EMMA ✓</text>')
    s += star(520,330,34) + star(1230,330,28) + star(780,60,26,"#fff") + star(960,690,22,"#fff")
    s += guy(250, 470, 135, "happy")
    s += text(300, 200, "100x", 200, "#ffe14d", INK, 18, -5)
    s += text(290, 310, "MEMORY", 100, "#ffffff", INK, 14, -5)
    s += f'<g transform="translate(1100 700)"><rect x="-80" y="-34" width="160" height="50" rx="10" fill="#000" opacity=".85"/><text x="0" y="3" text-anchor="middle" fill="#fff" style="font-family:Inter;font-weight:700;font-size:30px">10:12</text></g>'
    return s + '</svg>'

# ---------------- MẪU 2: Trước / Sau ----------------
def thumb2():
    s = '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">'
    s += '<defs><linearGradient id="L" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa7c7"/><stop offset="1" stop-color="#5a6a96"/></linearGradient>' \
         '<linearGradient id="R" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb703"/><stop offset="1" stop-color="#fb5607"/></linearGradient></defs>'
    s += '<rect width="1280" height="720" fill="url(#L)"/>'
    s += '<polygon points="690,0 1280,0 1280,720 590,720" fill="url(#R)"/>'
    s += f'<g opacity=".22">{rays(960,380,20,"#fff","none").split("/>",1)[1]}</g>'
    s += f'<polygon points="690,0 590,720" stroke="{INK}" stroke-width="10"/><line x1="690" y1="0" x2="590" y2="720" stroke="{INK}" stroke-width="12"/>'
    # trái: quên
    for (x,y,sz,r) in [(90,120,120,-15),(420,100,100,12),(60,380,90,10),(500,250,110,-10)]:
        s += text(x,y+sz*0.35,"?",sz,"#fff176",INK,10,r)
    s += guy(270, 440, 135, "confused", hood="#4a64b8")
    s += text(270, 650, "FORGET", 110, "#ffffff", INK, 14, -4)
    # phải: nhớ hết
    s += guy(960, 440, 135, "smug", shades=True)
    s += card(1010, 70, 190, 130, 8, "#fff", f'<text x="1105" y="150" text-anchor="middle" style="{FONT}font-size:84px" fill="#2ecc71">A+</text>')
    s += card(740, 90, 250, 100, -7, "#fff", f'<text x="865" y="155" text-anchor="middle" style="{FONT}font-size:44px" fill="{INK}">3.14159265</text>')
    s += star(740,330,30,"#fff") + star(1230,330,34) + star(1150,640,26,"#fff")
    s += text(940, 650, "REMEMBER ALL", 82, "#ffffff", INK, 12, -3)
    # huy hiệu 100x giữa
    s += f'<g transform="translate(640 330) rotate(-8)"><circle r="150" fill="#e63946" stroke="{INK}" stroke-width="10"/><circle r="128" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 10"/>' \
         + text(0, 50, "100x", 150, "#ffe14d", INK, 14) + '</g>'
    s += f'<g transform="translate(1100 700)"><rect x="-80" y="-34" width="160" height="50" rx="10" fill="#000" opacity=".85"/><text x="0" y="3" text-anchor="middle" fill="#fff" style="font-family:Inter;font-weight:700;font-size:30px">10:12</text></g>'
    return s + '</svg>'

for name, fn in [("thumbnail_1_brain_100x", thumb1), ("thumbnail_2_before_after", thumb2)]:
    (OUT/f"{name}.svg").write_text(fn(), encoding="utf-8")
print("svg ok")
