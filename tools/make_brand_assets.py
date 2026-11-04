"""Tạo avatar (800x800) và banner (2560x1440) cho kênh IfAhead từ SVG, render bằng Playwright.
Chạy: python tools/make_brand_assets.py   -> ghi SVG; sau đó node tools/render_svg.js để ra PNG
(PNG: reports/2026-11-04/branding/IfAhead_{avatar,banner}.png)
"""
from pathlib import Path

OUT = Path("reports/2026-11-04/branding")
FONT = "Impact, 'Arial Black', 'Liberation Sans', 'DejaVu Sans', sans-serif"

DEFS = """
<defs>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1b0a4a"/><stop offset=".55" stop-color="#6b21a8"/><stop offset="1" stop-color="#f97316"/></linearGradient>
  <radialGradient id="av" cx=".5" cy=".42" r=".75">
    <stop offset="0" stop-color="#7c3aed"/><stop offset=".6" stop-color="#2b0f6b"/><stop offset="1" stop-color="#0f0524"/></radialGradient>
  <g id="hero">
    <path d="M-150 215 Q-150 105 -62 92 L62 92 Q150 105 150 215 Z" fill="#7c3aed" stroke="#22e5ff" stroke-width="7" filter="url(#glow)"/>
    <path d="M-62 92 Q0 150 62 92" fill="none" stroke="#c4b5fd" stroke-width="9" stroke-linecap="round"/>
    <path d="M-30 128 L-34 175 M30 128 L34 175" stroke="#e9d5ff" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="0" cy="0" rx="108" ry="102" fill="#08060f" stroke="#22e5ff" stroke-width="7" filter="url(#glow)"/>
    <path d="M-14 -100 Q-52 -142 -8 -170 Q-18 -136 18 -102 Z" fill="#08060f" stroke="#22e5ff" stroke-width="6" stroke-linejoin="round"/>
    <path d="M22 -100 Q8 -134 48 -150 Q34 -126 54 -92 Z" fill="#08060f" stroke="#22e5ff" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="-40" cy="-6" r="33" fill="#fff"/><circle cx="40" cy="-6" r="33" fill="#fff"/>
    <circle cx="-28" cy="-2" r="15" fill="#08060f"/><circle cx="52" cy="-2" r="15" fill="#08060f"/>
    <circle cx="-23" cy="-8" r="5" fill="#fff"/><circle cx="57" cy="-8" r="5" fill="#fff"/>
    <path d="M-72 -50 Q-40 -66 -12 -50 M12 -50 Q40 -66 72 -50" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M-22 56 Q0 74 22 56" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>
</defs>"""

SKYLINE = "".join(
    f'<rect x="{x}" y="{y}" width="{w}" height="{1440-y}" fill="#0b0720" opacity=".92"/>'
    + "".join(f'<rect x="{x+10+i*26}" y="{y+16+j*34}" width="10" height="14" fill="#fde047" opacity=".75"/>'
              for i in range(max(w // 26 - 1, 0)) for j in range(3) if (i * 7 + j * 3 + x) % 4)
    for x, y, w in [(0,1010,150),(160,930,120),(290,1040,100),(2150,980,140),(2300,900,150),(2460,1030,100),(1280,1100,90),(1980,1060,120)])

AVATAR = f"""<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">{DEFS}
<rect width="800" height="800" fill="url(#av)"/>
<g fill="#fde047" opacity=".9"><circle cx="110" cy="120" r="5"/><circle cx="690" cy="170" r="6"/><circle cx="640" cy="640" r="4"/><circle cx="150" cy="620" r="5"/></g>
<text x="672" y="300" font-family="{FONT}" font-weight="bold" font-size="110" fill="#fde047" stroke="#000" stroke-width="6" paint-order="stroke" text-anchor="middle" transform="rotate(12 672 300)">?</text>
<use href="#hero" transform="translate(400 430) scale(2.05)"/>
</svg>"""

BANNER = f"""<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1440" viewBox="0 0 2560 1440">{DEFS}
<rect width="2560" height="1440" fill="url(#sky)"/>
<circle cx="1280" cy="1180" r="330" fill="#fb923c" opacity=".55"/>
{SKYLINE}
<g fill="#fde047" opacity=".85"><circle cx="300" cy="300" r="5"/><circle cx="2200" cy="260" r="6"/><circle cx="700" cy="180" r="4"/><circle cx="1900" cy="150" r="5"/><circle cx="420" cy="1180" r="4"/></g>
<!-- vùng an toàn mọi thiết bị: x 507-2053, y 508-931 -->
<use href="#hero" transform="translate(690 715) scale(1.2)"/>
<text x="930" y="700" font-family="{FONT}" font-weight="bold" font-size="150" fill="#fff" stroke="#000" stroke-width="14" paint-order="stroke" letter-spacing="2">If<tspan fill="#fde047">Ahead</tspan></text>
<text x="936" y="772" font-family="{FONT}" font-weight="bold" font-size="54" fill="#22e5ff" stroke="#000" stroke-width="7" paint-order="stroke" letter-spacing="3">WHAT IF TOMORROW</text>
<text x="936" y="838" font-family="{FONT}" font-weight="bold" font-size="54" fill="#22e5ff" stroke="#000" stroke-width="7" paint-order="stroke" letter-spacing="3">ARRIVED TODAY?</text>
<g transform="translate(1760 525) rotate(8 100 200)">
  <rect width="200" height="392" rx="30" fill="#0b0720" stroke="#22e5ff" stroke-width="6" filter="url(#glow)"/>
  <rect x="16" y="46" width="168" height="62" rx="12" fill="#fff"/><rect x="28" y="58" width="90" height="10" rx="5" fill="#7c3aed"/><rect x="28" y="78" width="140" height="10" rx="5" fill="#9ca3af"/>
  <rect x="16" y="122" width="168" height="62" rx="12" fill="#fff"/><rect x="28" y="134" width="70" height="10" rx="5" fill="#f97316"/><rect x="28" y="154" width="120" height="10" rx="5" fill="#9ca3af"/>
  <rect x="16" y="198" width="168" height="62" rx="12" fill="#fde047"/><rect x="28" y="210" width="110" height="10" rx="5" fill="#dc2626"/><rect x="28" y="230" width="100" height="10" rx="5" fill="#92400e"/>
  <text x="100" y="340" font-family="{FONT}" font-weight="bold" font-size="30" fill="#fde047" stroke="#000" stroke-width="5" paint-order="stroke" text-anchor="middle">TOMORROW</text>
</g>
</svg>"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, svg in [("avatar", AVATAR), ("banner", BANNER)]:
        (OUT / f"IfAhead_{name}.svg").write_text(svg, encoding="utf-8")


if __name__ == "__main__":
    main()
