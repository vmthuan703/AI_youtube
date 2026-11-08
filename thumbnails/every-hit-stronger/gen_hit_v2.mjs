// 2D flat thumbnails for "What If Every Hit Made You Stronger?" (channel HERO + roster cast), 4 layouts A-D (prompts/thumbnail_style.md).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const ROOT = path.resolve(HERE, '../..');
const FONT = 'file:///' + path.join(ROOT, 'node_modules/@fontsource/fredoka/files/fredoka-latin-700-normal.woff2').replace(/\\/g, '/');
const OUT = '#241a3a', LIME = '#b4f02e', LIME2 = '#69a81c', PEARL = '#f4eff9', HAIR = '#eef1fa', HAIRSH = '#8f9dd2', YEL = '#ffe14a', RED = '#ee3b2f', RED2 = '#b3201c';

const limb = (a, c, b, w = 56) => `<path d="M${a} Q${c} ${b}" fill="none" stroke="${OUT}" stroke-width="${w + 14}" stroke-linecap="round"/><path d="M${a} Q${c} ${b}" fill="none" stroke="${LIME}" stroke-width="${w}" stroke-linecap="round"/>`;
const hand = (p, pinch = false) => { const [x, y] = p; return `<g transform="translate(${x},${y})"><circle r="${pinch ? 26 : 32}" fill="${PEARL}" stroke="${OUT}" stroke-width="7"/>${pinch ? `<ellipse cx="-24" cy="-8" rx="22" ry="12" transform="rotate(-25 -24 -8)" fill="${PEARL}" stroke="${OUT}" stroke-width="7"/><ellipse cx="-22" cy="12" rx="22" ry="12" transform="rotate(20 -22 12)" fill="${PEARL}" stroke="${OUT}" stroke-width="7"/>` : ''}</g>`; };
function hero({ x, y, s = 1, expr = 'smug', R = null, L = null, body = true }) {
  const eyes = expr === 'awe'
    ? [-40, 40].map(ex => `<circle cx="${ex}" cy="6" r="25" fill="#fff" stroke="${OUT}" stroke-width="6"/><circle cx="${ex + 3}" cy="8" r="10" fill="${OUT}"/><circle cx="${ex + 7}" cy="3" r="4" fill="#fff"/>`).join('') + `<ellipse cx="0" cy="62" rx="15" ry="20" fill="#7a1f3d" stroke="${OUT}" stroke-width="6"/>`
    : [-40, 40].map((ex, i) => `<path d="M${ex - 15},6 A15 18 0 0 0 ${ex + 15},6 Z" fill="${OUT}"/><path d="M${ex - 20},${i ? 2 : 6} L${ex + 20},${i ? 6 : 2}" stroke="${OUT}" stroke-width="8" stroke-linecap="round"/>`).join('') + `<path d="M-26,58 Q12,78 46,46" fill="none" stroke="${OUT}" stroke-width="8" stroke-linecap="round"/><path d="M-62,-26 L-22,-34" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/><path d="M22,-34 L62,-24" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>`;
  const jacket = body ? `<path d="M-125,330 L-125,190 Q-125,98 -50,98 L50,98 Q125,98 125,190 L125,330 Z" fill="${LIME}" stroke="${OUT}" stroke-width="9" stroke-linejoin="round"/>${[150, 196, 242, 288].map(yy => `<path d="M-120,${yy} Q0,${yy + 16} 120,${yy}" fill="none" stroke="${LIME2}" stroke-width="7" stroke-linecap="round"/>`).join('')}<path d="M0,110 L0,330" stroke="${LIME2}" stroke-width="8"/><rect x="-62" y="84" width="124" height="44" rx="22" fill="${LIME}" stroke="${OUT}" stroke-width="8"/>` : '';
  const arms = (L ? limb(L.from || '-100,170', L.c, L.to) + hand(L.to.split(',').map(Number), L.pinch) : '') + (R ? limb(R.from || '100,170', R.c, R.to) + hand(R.to.split(',').map(Number), R.pinch) : '');
  return `<g transform="translate(${x},${y}) scale(${s})">${jacket}${arms}
  <circle r="100" fill="${PEARL}" stroke="${OUT}" stroke-width="9"/><path d="M-70,52 A100 100 0 0 0 60,80" fill="none" stroke="#d9cfe8" stroke-width="12" stroke-linecap="round" opacity=".8"/>
  ${eyes}
  <path d="M-103,-8 L-155,-72 L-98,-70 L-122,-155 L-56,-108 L-50,-196 L-6,-114 L32,-200 L46,-110 L104,-182 L94,-98 L156,-92 L110,-20 L74,-62 L36,-80 L6,-46 L-30,-82 L-64,-58 Z" fill="${HAIR}" stroke="${OUT}" stroke-width="8" stroke-linejoin="round"/>
  <path d="M-50,-190 L-30,-120 M32,-198 L28,-124 M104,-180 L72,-116 M-120,-152 L-84,-100" stroke="${HAIRSH}" stroke-width="7" stroke-linecap="round" fill="none"/></g>`;
}
function truck(x, y, s = 1, o = {}) {
  const c = o.c || RED;
  return `<g transform="translate(${x},${y}) scale(${s})">
  <rect x="-175" y="-160" width="235" height="125" rx="14" fill="${c}" stroke="${OUT}" stroke-width="9"/><rect x="-175" y="-100" width="235" height="22" fill="${YEL}" stroke="${OUT}" stroke-width="6"/>
  <path d="M66,-125 L120,-125 Q150,-125 160,-95 L175,-60 L175,-35 L66,-35 Z" fill="${c}" stroke="${OUT}" stroke-width="9" stroke-linejoin="round"/><path d="M82,-110 L118,-110 Q134,-110 140,-92 L148,-70 L82,-70 Z" fill="#9bd7ff" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
  <rect x="-185" y="-40" width="370" height="26" rx="8" fill="#2c2540" stroke="${OUT}" stroke-width="7"/>
  ${[-110, -10, 105].map(wx => `<circle cx="${wx}" cy="-8" r="40" fill="#1d1730" stroke="${OUT}" stroke-width="7"/><circle cx="${wx}" cy="-8" r="16" fill="#b9b4c8" stroke="${OUT}" stroke-width="5"/>`).join('')}</g>`;
}
const text = (str, x, y, size, fill = '#fff', o = {}) => `<g transform="translate(${x},${y}) rotate(${o.rot || 0})"><text text-anchor="${o.anchor || 'start'}" font-size="${size}" fill="none" stroke="${OUT}" stroke-width="${size * 0.3}" stroke-linejoin="round">${str}</text><text text-anchor="${o.anchor || 'start'}" font-size="${size}" fill="none" stroke="${o.edge || '#fff'}" stroke-width="${size * 0.15}" stroke-linejoin="round">${str}</text><text text-anchor="${o.anchor || 'start'}" font-size="${size}" fill="${fill}">${str}</text></g>`;
const rays = (cx, cy, c2, n = 20) => Array.from({ length: n }, (_, i) => { const a0 = (i / n) * Math.PI * 2, a1 = ((i + 0.5) / n) * Math.PI * 2, R = 1600; return `<path d="M${cx},${cy} L${cx + Math.cos(a0) * R},${cy + Math.sin(a0) * R} L${cx + Math.cos(a1) * R},${cy + Math.sin(a1) * R} Z" fill="${c2}" opacity=".5"/>`; }).join('');
const sparkle = (x, y, r = 30) => `<path d="M${x},${y - r} Q${x + 6},${y - 6} ${x + r},${y} Q${x + 6},${y + 6} ${x},${y + r} Q${x - 6},${y + 6} ${x - r},${y} Q${x - 6},${y - 6} ${x},${y - r} Z" fill="#fff" stroke="${OUT}" stroke-width="4"/>`;
const arrow = (x0, y0, x1, y1, bend = 0, col = YEL) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - bend; const a = Math.atan2(y1 - my, x1 - mx), hl = 54; const hp = `M${x1},${y1} L${x1 - Math.cos(a - 0.55) * hl},${y1 - Math.sin(a - 0.55) * hl} L${x1 - Math.cos(a + 0.55) * hl},${y1 - Math.sin(a + 0.55) * hl} Z`; const d = `M${x0},${y0} Q${mx},${my} ${x1 - Math.cos(a) * 30},${y1 - Math.sin(a) * 30}`; return `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="30" stroke-linecap="round"/><path d="${hp}" fill="${OUT}" stroke="${OUT}" stroke-width="26" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="16" stroke-linecap="round"/><path d="${hp}" fill="${col}"/>`; };
const defs = (c1, c2) => `<defs><radialGradient id="bg" cx="55%" cy="45%" r="85%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient><radialGradient id="vg" cx="50%" cy="50%" r="75%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a0b33" stop-opacity=".45"/></radialGradient></defs>`;
const wrap = (body, c1, c2, rayC) => `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">${defs(c1, c2)}<rect width="1280" height="720" fill="url(#bg)"/>${rayC ? rays(900, 330, rayC) : ''}${body}<rect width="1280" height="720" fill="url(#vg)"/></svg>`;


// ---- Bổ sung theo bài học Jeremy Bearimy (báo cáo 2026-11-07): mặt smug, nhãn giao diện game, nhân vật phụ / đám đông ----
const GRN = '#3ddc5a';
// nhãn kiểu game gắn trên đầu (có mũi nhọn chỉ xuống)
const tag = (x, y, str, bg, fg = '#fff', size = 46, ptr = true) => {
  const w = str.length * size * 0.62 + 56, h = size + 34;
  const p = ptr ? `<path d="M-20,${h / 2 - 6} L0,${h / 2 + 26} L20,${h / 2 - 6} Z" fill="${bg}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>` : '';
  const cover = ptr ? `<path d="M-15,${h / 2 - 6} L15,${h / 2 - 6}" stroke="${bg}" stroke-width="10"/>` : '';
  return `<g transform="translate(${x},${y})">${p}<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="18" fill="${bg}" stroke="${OUT}" stroke-width="8"/>${cover}<text x="0" y="${size * 0.36}" text-anchor="middle" font-size="${size}" fill="${fg}">${str}</text></g>`;
};
// thanh máu kiểu game
const hp = (x, y, w, pct, col, label) => `<g transform="translate(${x},${y})"><rect x="0" y="0" width="${w}" height="64" rx="14" fill="#14102a" stroke="${OUT}" stroke-width="8"/><text x="22" y="46" font-size="40" fill="#fff">HP</text><rect x="92" y="12" width="${w - 108}" height="40" rx="8" fill="#3a3150"/><rect x="92" y="12" width="${Math.max(16, (w - 108) * pct)}" height="40" rx="8" fill="${col}"/><text x="${92 + (w - 108) / 2}" y="44" text-anchor="middle" font-size="32" fill="#fff" stroke="${OUT}" stroke-width="6" paint-order="stroke">${label}</text></g>`;
// bạn cùng lớp: màu trầm, không tranh với hero
function kid({ x, y, s = 1, hood = '#3d4f7a', hairC = '#3a2a22', hairT = 'cap' }) {
  const face = `<circle cx="-28" cy="0" r="16" fill="#fff" stroke="${OUT}" stroke-width="5"/><circle cx="28" cy="0" r="16" fill="#fff" stroke="${OUT}" stroke-width="5"/><circle cx="-28" cy="2" r="6" fill="${OUT}"/><circle cx="28" cy="2" r="6" fill="${OUT}"/><ellipse cx="0" cy="40" rx="12" ry="16" fill="#7a1f3d" stroke="${OUT}" stroke-width="5"/>`;
  const hair = hairT === 'cap'
    ? `<path d="M-80,-14 Q-80,-84 0,-86 Q80,-84 80,-14 Q40,-44 0,-40 Q-40,-44 -80,-14 Z" fill="${hairC}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`
    : `<path d="M-84,10 Q-96,90 -70,150 L-50,40 Z M84,10 Q96,90 70,150 L50,40 Z" fill="${hairC}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/><path d="M-84,10 Q-96,-80 0,-88 Q96,-80 84,10 Q70,-40 0,-46 Q-70,-40 -84,10 Z" fill="${hairC}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`;
  return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-100,260 L-100,160 Q-100,82 -40,82 L40,82 Q100,82 100,160 L100,260 Z" fill="${hood}" stroke="${OUT}" stroke-width="8" stroke-linejoin="round"/><circle r="80" fill="${PEARL}" stroke="${OUT}" stroke-width="8"/>${face}${hair}</g>`;
}

function mate({ x, y, s = 1, hood, hairC, hairT, face = 'shock', body = true }) {
  const eyes = `<circle cx="-28" cy="0" r="16" fill="#fff" stroke="${OUT}" stroke-width="5"/><circle cx="28" cy="0" r="16" fill="#fff" stroke="${OUT}" stroke-width="5"/><circle cx="-28" cy="2" r="6" fill="${OUT}"/><circle cx="28" cy="2" r="6" fill="${OUT}"/>`;
  const mouth = face === 'smile' ? `<path d="M-26,34 Q0,58 26,34" fill="none" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/><ellipse cx="-50" cy="26" rx="14" ry="8" fill="#ff8fb0" opacity=".8"/><ellipse cx="50" cy="26" rx="14" ry="8" fill="#ff8fb0" opacity=".8"/>`
    : face === 'angry' ? `<path d="M-26,44 Q0,28 26,44" fill="#7a1f3d" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/><path d="M-50,-22 L-12,-8 M50,-22 L12,-8" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/>`
    : face === 'meh' ? `<path d="M-22,40 L22,36" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>`
    : `<ellipse cx="0" cy="40" rx="12" ry="16" fill="#7a1f3d" stroke="${OUT}" stroke-width="5"/>`;
  const cap = `<path d="M-80,-14 Q-80,-84 0,-86 Q80,-84 80,-14 Q40,-44 0,-40 Q-40,-44 -80,-14 Z" fill="${hairC}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`;
  const hair = hairT === 'pony' ? `<path d="M70,-40 Q130,0 104,96 Q84,30 60,-10 Z" fill="${hairC}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/><circle cx="74" cy="-52" r="26" fill="${hairC}" stroke="${OUT}" stroke-width="7"/>` + cap
    : hairT === 'quiff' ? `<path d="M-82,-6 Q-90,-84 -10,-92 Q40,-130 96,-96 Q70,-90 60,-70 Q84,-50 82,-6 Q40,-46 0,-42 Q-40,-46 -82,-6 Z" fill="${hairC}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`
    : hairT === 'curly' ? [[-70, -30], [-50, -62], [-16, -80], [20, -80], [54, -62], [72, -30], [-34, -50], [0, -58], [36, -50]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="28" fill="${hairC}" stroke="${OUT}" stroke-width="6"/>`).join('')
    : `<path d="M-86,60 Q-98,-80 0,-88 Q98,-80 86,60 L60,60 Q66,-30 0,-40 Q-66,-30 -60,60 Z" fill="${hairC}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`;
  return `<g transform="translate(${x},${y}) scale(${s})">${body ? `<path d="M-100,260 L-100,160 Q-100,82 -40,82 L40,82 Q100,82 100,160 L100,260 Z" fill="${hood}" stroke="${OUT}" stroke-width="8" stroke-linejoin="round"/>` : ''}<circle r="80" fill="${PEARL}" stroke="${OUT}" stroke-width="8"/>${eyes}${mouth}${hair}</g>`;
}

// ---- "What If Every Hit Made You Stronger?": 4 layouts A-D
const OUTDIR = path.resolve(ROOT, 'projects/every-hit-stronger/out'); fs.mkdirSync(OUTDIR, { recursive: true });
const BROCK = { hood: '#2c3e6e', hairC: '#2b2d3c', hairT: 'quiff' }, ZOE = { hood: '#2f6f6a', hairC: '#8a4426', hairT: 'pony' }, THEO = { hood: '#7a3a34', hairC: '#4a2f24', hairT: 'curly' }, KID2 = { hood: '#5f6a2e', hairC: '#34262c', hairT: 'bob' };
// the STR pill: lime game label with the number, a gold "+1" popping off it
const str = (x, y, n, size = 60, plus = '+1', bg = LIME) => { const s = `STR ${n}`, w = s.length * size * 0.6 + 64, h = size + 36;
  return `<g transform="translate(${x},${y})"><path d="M-22,${h / 2 - 6} L0,${h / 2 + 28} L22,${h / 2 - 6} Z" fill="${bg}" stroke="${OUT}" stroke-width="8" stroke-linejoin="round"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="20" fill="${bg}" stroke="${OUT}" stroke-width="9"/><path d="M-16,${h / 2 - 6} L16,${h / 2 - 6}" stroke="${bg}" stroke-width="11"/>
  <text x="0" y="${size * 0.36}" text-anchor="middle" font-size="${size}" fill="${OUT}">${s}</text>${plus ? text(plus, w / 2 + 14, size * 0.4, size * 1.05, YEL, { rot: -10, edge: OUT }) : ''}</g>`; };
// Brock's arm and fist coming in from the right
const bigFist = (x, y, s = 1, c = BROCK.hood) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M330,-30 Q190,-60 60,-40 Q20,-34 20,10 Q20,54 60,60 Q190,80 330,70 Z" fill="${c}" stroke="${OUT}" stroke-width="9" stroke-linejoin="round"/><rect x="40" y="-46" width="44" height="112" rx="18" fill="#d2d3da" stroke="${OUT}" stroke-width="8"/><ellipse cx="0" cy="10" rx="78" ry="72" fill="${PEARL}" stroke="${OUT}" stroke-width="9"/>${[-36, -4, 28].map(yy => `<path d="M-50,${yy} Q-70,${yy + 10} -52,${yy + 26}" fill="none" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>`).join('')}<path d="M-20,58 Q20,72 50,50" fill="none" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/></g>`;
const impact = (x, y, r = 70, c = '#fff') => `<g transform="translate(${x},${y})">${Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<path d="M${Math.cos(a) * r * 0.55},${Math.sin(a) * r * 0.55} L${Math.cos(a + 0.12) * r * 1.35},${Math.sin(a + 0.12) * r * 1.35} L${Math.cos(a + 0.24) * r * 0.6},${Math.sin(a + 0.24) * r * 0.6} Z" fill="${c}" stroke="${OUT}" stroke-width="5"/>`; }).join('')}</g>`;
const ball = (x, y, r = 34, c = RED) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${OUT}" stroke-width="7"/><path d="M${x - r * 0.6},${y - r * 0.3} Q${x},${y - r * 0.9} ${x + r * 0.6},${y - r * 0.3}" fill="none" stroke="#fff" stroke-width="5" opacity=".6"/>`;
const tball = (x, y, r = 20) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#d8f04a" stroke="${OUT}" stroke-width="5"/><path d="M${x - r * 0.8},${y - r * 0.2} Q${x},${y + r * 0.6} ${x + r * 0.8},${y - r * 0.2}" fill="none" stroke="#fff" stroke-width="4"/>`;
const bar = (x, y, w, pct, col, label, val) => `<g transform="translate(${x},${y})"><rect x="0" y="0" width="${w}" height="70" rx="16" fill="#14102a" stroke="${OUT}" stroke-width="8"/><text x="24" y="50" font-size="42" fill="#fff">${label}</text><rect x="120" y="14" width="${w - 140}" height="42" rx="10" fill="#3a3150"/><rect x="120" y="14" width="${Math.max(16, (w - 140) * pct)}" height="42" rx="10" fill="${col}"/><text x="${120 + (w - 140) / 2}" y="48" text-anchor="middle" font-size="34" fill="#fff" stroke="${OUT}" stroke-width="6" paint-order="stroke">${val}</text></g>`;

// ---- v2: nền nhiều chi tiết hơn (khán đài, biểu ngữ, cửa sổ, sàn gỗ, hạt sáng, tạ, chip STR). Nhân vật phụ đơn giản hóa.
let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
const dumb = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-60" y="-10" width="120" height="20" fill="#5a5a6a" stroke="${OUT}" stroke-width="6"/><rect x="-74" y="-28" width="26" height="56" rx="8" fill="#8a8a96" stroke="${OUT}" stroke-width="6"/><rect x="48" y="-28" width="26" height="56" rx="8" fill="#8a8a96" stroke="${OUT}" stroke-width="6"/></g>`;
const chip = (x, y, t, bg = LIME, s = 34) => `<g transform="translate(${x},${y})"><rect x="${-(t.length * s * 0.32 + 18)}" y="${-s * 0.7}" width="${t.length * s * 0.64 + 36}" height="${s * 1.4}" rx="12" fill="${bg}" stroke="${OUT}" stroke-width="5"/><text x="0" y="${s * 0.3}" text-anchor="middle" font-size="${s}" fill="${OUT}">${t}</text></g>`;
const richBg = (c1, c2, rayC, accent) => {
  seed = 7;
  let s = defs(c1, c2) + `<rect width="1280" height="720" fill="url(#bg)"/>` + rays(640, 300, rayC, 24);
  for (let x = 0; x < 1280; x += 80) s += `<rect x="${x}" y="0" width="80" height="330" fill="${(x / 80) % 2 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)'}"/>`;
  for (let i = 0; i < 6; i++) s += `<rect x="${60 + i * 210}" y="18" width="150" height="110" rx="10" fill="#bfe9ff" stroke="${OUT}" stroke-width="6" opacity=".85"/><path d="M${135 + i * 210},18 L${135 + i * 210},128" stroke="${OUT}" stroke-width="5"/>`;
  for (const bx of [200, 640, 1080]) s += `<path d="M${bx - 62},150 L${bx + 62},150 L${bx + 62},290 L${bx},262 L${bx - 62},290 Z" fill="${accent}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>${sparkle(bx, 205, 30)}`;
  for (let r = 0; r < 3; r++) for (let i = 0; i < 17; i++) {
    const x = 20 + i * 76 + (r % 2) * 38 + rnd() * 10, y = 368 + r * 24;
    const c = ['#3d4f7a', '#7a3a34', '#5f6a2e', '#2f6f6a', '#6a4a5e', '#2c2540'][Math.floor(rnd() * 6)];
    s += `<rect x="${x - 20}" y="${y + 14}" width="40" height="36" rx="12" fill="${c}" opacity=".9"/><circle cx="${x}" cy="${y}" r="17" fill="${PEARL}" opacity=".95"/>`;
  }
  s += `<rect y="470" width="1280" height="250" fill="#d89a5a"/>`;
  for (let i = -10; i <= 10; i++) s += `<path d="M640,470 L${640 + i * 200},720" stroke="#c4864a" stroke-width="4"/>`;
  s += `<rect y="466" width="1280" height="8" fill="${OUT}" opacity=".5"/>`;
  for (let i = 0; i < 16; i++) s += sparkle(30 + rnd() * 1220, 30 + rnd() * 420, 7 + rnd() * 10);
  s += dumb(80, 600, 1.1) + dumb(1200, 560, 0.9) + chip(120, 300, '+1', LIME, 30) + chip(1150, 250, 'STR', '#fff', 30);
  return s;
};
const rwrap = (bgInner, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">${bgInner}${body}<rect width="1280" height="720" fill="url(#vg)"/></svg>`;
const v2 = {
  'Thumbnail_v2_A': rwrap(richBg('#ffe14a', '#ff8a1a', '#fff3b0', YEL), `
    ${mate({ x: 1070, y: 420, s: 1.35, ...BROCK, face: 'angry' })}${tag(1070, 175, 'STR 14', RED, '#fff', 50)}
    ${mate({ x: 760, y: 600, s: 0.62, ...ZOE, face: 'shock' })}${tag(760, 500, '?!', '#14102a', YEL, 40)}
    ${hero({ x: 400, y: 430, s: 1.75, expr: 'smug' })}
    ${bigFist(600, 330, 1.0)}${impact(540, 340, 56)}
    ${str(400, 75, 150, 64)}`),
  'Thumbnail_v2_B': rwrap(richBg('#9be15a', '#2f9a3a', '#e6ffb0', '#fff3b0'), `
    <path d="M0,0 L560,0 L480,720 L0,720 Z" fill="#4a3a7a" opacity=".55"/><path d="M560,0 L480,720" stroke="${OUT}" stroke-width="16"/>
    ${hero({ x: 250, y: 540, s: 0.85, expr: 'awe' })}${str(250, 350, 10, 46, '')}${tag(250, 70, 'MONDAY', '#14102a', YEL, 40, false)}
    <g transform="translate(900,215) rotate(-5)"><rect x="-320" y="-38" width="640" height="76" rx="8" fill="#8a8a96" stroke="${OUT}" stroke-width="9"/><rect x="-70" y="-28" width="170" height="56" rx="6" fill="#f2b632" stroke="${OUT}" stroke-width="5"/><text x="15" y="16" text-anchor="middle" font-size="40" fill="${OUT}">900 KG</text></g>
    ${hero({ x: 900, y: 520, s: 1.3, expr: 'smug', L: { from: '-100,170', c: '-190,40', to: '-130,-200' }, R: { from: '100,170', c: '190,40', to: '130,-200' } })}
    ${str(1130, 400, 150, 48)}${tag(1130, 70, 'FRIDAY', '#14102a', LIME, 40, false)}
    ${text('+1.', 640, 690, 130, LIME, { anchor: 'middle', edge: OUT })}`),
  'Thumbnail_v2_C': rwrap(richBg('#5ad0ff', '#1f6ad8', '#c8f0ff', '#fff3b0'), `
    ${[[110, 470, BROCK], [260, 560, THEO], [1020, 560, KID2], [1170, 470, ZOE]].map(([x, y, w]) => mate({ x, y, s: 0.8, ...w, face: 'shock' })).join('')}
    ${[[330, 300], [420, 190], [880, 220], [960, 330], [520, 140], [770, 140]].map(([x, y], i) => ball(x, y, 36, i % 2 ? '#3a5ac8' : RED)).join('')}
    ${hero({ x: 640, y: 470, s: 1.5, expr: 'smug' })}${impact(545, 400, 40)}${impact(740, 360, 36)}
    ${str(640, 70, 999, 58)}
    ${text('keep going.', 640, 690, 92, '#fff', { anchor: 'middle', edge: OUT })}`),
  'Thumbnail_v2_D': rwrap(richBg('#ff6aa8', '#c81a6a', '#ffd0e4', '#ffe14a'), `
    <rect x="660" y="50" width="580" height="620" rx="34" fill="#14102a" stroke="${OUT}" stroke-width="10"/><path d="M660,84 Q660,50 694,50 L1206,50 Q1240,50 1240,84 L1240,150 L660,150 Z" fill="${LIME}" stroke="${OUT}" stroke-width="10"/>
    <text x="950" y="122" text-anchor="middle" font-size="62" fill="${OUT}">LEVEL UP!</text>
    ${bar(690, 200, 520, 1.0, LIME, 'STR', '150')}${bar(690, 300, 520, 0.95, RED, 'PAIN', '100%')}
    <text x="950" y="480" text-anchor="middle" font-size="130" fill="${YEL}" stroke="${OUT}" stroke-width="16" paint-order="stroke">+49</text><text x="950" y="570" text-anchor="middle" font-size="46" fill="#fff">HITS IN 1 MINUTE</text>
    ${hero({ x: 330, y: 470, s: 1.7, expr: 'smug' })}${[[560, 260], [610, 380], [540, 540], [640, 170]].map(([x, y]) => tball(x, y, 22)).join('')}
    ${str(330, 80, 150, 56)}`),
};
const browser2 = await chromium.launch(); const page2 = await browser2.newPage({ viewport: { width: 1280, height: 720 } });
for (const [name, svg] of Object.entries(v2)) {
  const html = `<style>@font-face{font-family:F;src:url(${FONT})}html,body{margin:0}svg text{font-family:F,sans-serif;font-weight:700}</style>${svg}`;
  const hp2 = path.join(HERE, 'hit2_' + name + '.html'); fs.writeFileSync(hp2, html);
  await page2.goto('file:///' + hp2.split(path.sep).join('/')); await page2.evaluate(() => document.fonts.ready); await page2.waitForTimeout(200);
  await page2.screenshot({ path: path.join(OUTDIR, name + '.jpg'), type: 'jpeg', quality: 92 });
}
await browser2.close(); console.log('ok v2');
