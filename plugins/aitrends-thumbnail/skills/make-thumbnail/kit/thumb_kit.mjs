// thumb_kit.mjs — 2D flat drawing kit for channel thumbnails (1280×720 SVG).
// Every helper returns an SVG string. A spec composes them freely per script; there are no fixed layouts.
// Coordinates: frame is 1280×720, origin top-left. Characters are placed by the CENTRE OF THE HEAD.
// Hero head radius is 100·s, supporting cast 80·s. Draw order = paint order: back first, hero and labels last.

export const C = {
  OUT: '#241a3a', LIME: '#b4f02e', LIME2: '#69a81c', PEARL: '#f4eff9', HAIR: '#eef1fa', HAIRSH: '#8f9dd2',
  YEL: '#ffe14a', RED: '#ee3b2f', RED2: '#b3201c', GRN: '#3ddc5a', TEAL: '#5ad8c8', BLUE: '#57b8ff', PINK: '#ff6aa8',
  DARK: '#14102a', SLOT: '#3a3150', WHITE: '#fff',
};
const { OUT, LIME, LIME2, PEARL, HAIR, HAIRSH, YEL, RED, GRN, DARK, SLOT } = C;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const textW = (str, size) => String(str).length * size * 0.6;

// ------------------------------------------------------------------ backgrounds
// Bright two-colour radial backgrounds. Pick the one that matches the script's mood; hero lime must not sit on green.
export const BG = {
  sun: { c1: '#ffe14a', c2: '#ff8a1a', rays: '#fff3b0' },
  sky: { c1: '#5ad0ff', c2: '#1f6ad8', rays: '#c8f0ff' },
  candy: { c1: '#ff8ac0', c2: '#d81a6a', rays: '#ffd0e4' },
  royal: { c1: '#a878ff', c2: '#4a1ac8', rays: '#d8c4ff' },
  mint: { c1: '#8af0d8', c2: '#12a890', rays: '#d8fff4' },
  fire: { c1: '#ffc23a', c2: '#e8341a', rays: '#ffe6a0' },
};
const defs = (c1, c2) => `<defs><radialGradient id="bg" cx="55%" cy="45%" r="85%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient><radialGradient id="vg" cx="50%" cy="50%" r="75%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a0b33" stop-opacity=".4"/></radialGradient></defs>`;
export const rays = (cx, cy, col, n = 20) => Array.from({ length: n }, (_, i) => { const a0 = (i / n) * Math.PI * 2, a1 = ((i + 0.5) / n) * Math.PI * 2, R = 1600; return `<path d="M${cx},${cy} L${cx + Math.cos(a0) * R},${cy + Math.sin(a0) * R} L${cx + Math.cos(a1) * R},${cy + Math.sin(a1) * R} Z" fill="${col}" opacity=".5"/>`; }).join('');
// Full frame. bg = one of BG or { c1, c2, rays, raysAt:[x,y] }. `under` is drawn right above the background (split panels, floors).
export function frame(body, bg = BG.sun, under = '') {
  const [rx, ry] = bg.raysAt || [900, 330];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">${defs(bg.c1, bg.c2)}<rect width="1280" height="720" fill="url(#bg)"/>${bg.rays ? rays(rx, ry, bg.rays) : ''}${under}${body}<rect width="1280" height="720" fill="url(#vg)"/></svg>`;
}
// A slanted colour panel for contrast (before/after, me/them). x0/x1 = top and bottom x of the dividing line; side = which side gets the colour.
export const split = (col = '#4a3a7a', x0 = 660, x1 = 600, side = 'left') => (side === 'left'
  ? `<path d="M0,0 L${x0},0 L${x1},720 L0,720 Z" fill="${col}"/>` : `<path d="M${x0},0 L1280,0 L1280,720 L${x1},720 Z" fill="${col}"/>`)
  + `<path d="M${x0},0 L${x1},720" stroke="${OUT}" stroke-width="16"/>`;
export const floor = (y = 600, col = '#00000022') => `<rect x="0" y="${y}" width="1280" height="${720 - y}" fill="${col}"/>`;

// ------------------------------------------------------------------ hero (channel identity: pearl head, platinum spiky hair, lime quilted puffer)
const limb = (a, c, b, col = LIME, w = 56) => `<path d="M${a} Q${c} ${b}" fill="none" stroke="${OUT}" stroke-width="${w + 14}" stroke-linecap="round"/><path d="M${a} Q${c} ${b}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
const hand = (p, r = 32) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${PEARL}" stroke="${OUT}" stroke-width="7"/>`;
// Arm presets in hero-local units (head centre = 0,0; shoulders at ±100,170). Each is [from, control, to].
const ARMS = {
  pointR: { R: ['100,170', '250,150', '300,-10'] },          // points up-right (at a label or a prop)
  pointL: { L: ['-100,170', '-250,150', '-300,-10'] },
  raiseR: { R: ['100,170', '210,120', '220,-70'] },          // fist in the air
  both: { R: ['100,170', '210,120', '220,-70'], L: ['-100,170', '-210,120', '-220,-70'] },
  shh: { R: ['100,170', '170,150', '30,74'], finger: true },   // finger on the lips
  chin: { R: ['100,170', '150,230', '52,112'] },             // hand on chin, thinking smug
  shrug: { R: ['100,170', '200,210', '230,110'], L: ['-100,170', '-200,210', '-230,110'] },
  crossed: { crossed: true },
};
const heroFace = expr => {
  const brows = `<path d="M-62,-26 L-22,-34" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/><path d="M22,-34 L62,-24" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>`;
  const lid = [-40, 40].map((ex, i) => `<path d="M${ex - 15},6 A15 18 0 0 0 ${ex + 15},6 Z" fill="${OUT}"/><path d="M${ex - 20},${i ? 2 : 6} L${ex + 20},${i ? 6 : 2}" stroke="${OUT}" stroke-width="8" stroke-linecap="round"/>`).join('');
  const open = [-40, 40].map(ex => `<circle cx="${ex}" cy="6" r="25" fill="#fff" stroke="${OUT}" stroke-width="6"/><circle cx="${ex + 3}" cy="8" r="10" fill="${OUT}"/><circle cx="${ex + 7}" cy="3" r="4" fill="#fff"/>`).join('');
  if (expr === 'awe') return open + `<ellipse cx="0" cy="62" rx="15" ry="20" fill="#7a1f3d" stroke="${OUT}" stroke-width="6"/>`;
  if (expr === 'sad') return open + `<path d="M-24,66 Q0,50 24,66" fill="none" stroke="${OUT}" stroke-width="8" stroke-linecap="round"/><path d="M-62,-34 L-22,-24 M22,-24 L62,-34" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>`;
  if (expr === 'grin') return lid + brows + `<path d="M-40,46 Q0,96 44,42 Z" fill="#fff" stroke="${OUT}" stroke-width="8" stroke-linejoin="round"/>`;
  if (expr === 'wink') return `<path d="M-58,8 Q-40,-8 -22,8" fill="none" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/><circle cx="40" cy="6" r="25" fill="#fff" stroke="${OUT}" stroke-width="6"/><circle cx="43" cy="8" r="10" fill="${OUT}"/>` + brows + `<path d="M-26,58 Q12,78 46,46" fill="none" stroke="${OUT}" stroke-width="8" stroke-linecap="round"/>`;
  return lid + brows + `<path d="M-26,58 Q12,78 46,46" fill="none" stroke="${OUT}" stroke-width="8" stroke-linecap="round"/>`;   // smug (default)
};
// hero({ x, y, s, expr: 'smug'|'grin'|'wink'|'awe'|'sad', arms: name in ARMS or {R:[from,c,to],L:[...]}, flip, body })
// Use awe/sad ONLY for the "before" or "other" half of a contrast; the main hero is always smug, grin or wink.
export function hero({ x, y, s = 1, expr = 'smug', arms = null, flip = false, body = true }) {
  const A = typeof arms === 'string' ? ARMS[arms] : arms;
  const jacket = body ? `<path d="M-125,330 L-125,190 Q-125,98 -50,98 L50,98 Q125,98 125,190 L125,330 Z" fill="${LIME}" stroke="${OUT}" stroke-width="9" stroke-linejoin="round"/>${[150, 196, 242, 288].map(yy => `<path d="M-120,${yy} Q0,${yy + 16} 120,${yy}" fill="none" stroke="${LIME2}" stroke-width="7" stroke-linecap="round"/>`).join('')}<path d="M0,110 L0,330" stroke="${LIME2}" stroke-width="8"/><rect x="-62" y="84" width="124" height="44" rx="22" fill="${LIME}" stroke="${OUT}" stroke-width="8"/>` : '';
  let back = '', front = '';
  if (A && body) {
    if (A.crossed) front += limb('-104,190', '-40,290', '70,236') + limb('104,190', '40,290', '-70,236') + hand([70, 236], 28) + hand([-70, 236], 28);
    for (const k of ['L', 'R']) if (A[k]) {
      const [from, c, to] = A[k], p = to.split(',').map(Number), g = limb(from, c, to) + hand(p);
      if (A.finger && k === 'R') front += g + `<rect x="${p[0] - 12}" y="${p[1] - 62}" width="24" height="52" rx="12" fill="${PEARL}" stroke="${OUT}" stroke-width="7"/>`; else back += g;
    }
  }
  return `<g data-k="hero" data-expr="${expr}" data-s="${s}" transform="translate(${x},${y}) scale(${flip ? -s : s},${s})">${jacket}${back}
  <circle r="100" fill="${PEARL}" stroke="${OUT}" stroke-width="9"/><path d="M-70,52 A100 100 0 0 0 60,80" fill="none" stroke="#d9cfe8" stroke-width="12" stroke-linecap="round" opacity=".8"/>
  ${heroFace(expr)}
  <path d="M-103,-8 L-155,-72 L-98,-70 L-122,-155 L-56,-108 L-50,-196 L-6,-114 L32,-200 L46,-110 L104,-182 L94,-98 L156,-92 L110,-20 L74,-62 L36,-80 L6,-46 L-30,-82 L-64,-58 Z" fill="${HAIR}" stroke="${OUT}" stroke-width="8" stroke-linejoin="round"/>
  <path d="M-50,-190 L-30,-120 M32,-198 L28,-124 M104,-180 L72,-116 M-120,-152 L-84,-100" stroke="${HAIRSH}" stroke-width="7" stroke-linecap="round" fill="none"/>${front}</g>`;
}

// ------------------------------------------------------------------ supporting cast: ONLY roles from the channel roster (channel/cast.js), flat 2D versions.
// Colours are the roster's own deep, muted colours so nobody competes with the hero.
const GREY = '#8e8a94';
export const ROSTER = {
  BESTIE: { top: '#2f6f6a', hairC: '#8a4426', hair: 'pony', lashes: true },
  BRO: { top: '#f29ab4', hairC: '#17131a', hair: 'long', lashes: true, blush: true },          // the hero's girl friend: long black hair, pink dress
  RIVAL: { top: '#2c3e6e', hairC: '#2b2d3c', hair: 'quiff' },
  RIVAL_2: { top: '#2f6f6a', hairC: '#2a2420', hair: 'sidePart' },
  CLASSMATE: { top: '#8d4a6b', hairC: '#34262c', hair: 'fringe', lashes: true },
  CLASSMATE_2: { top: '#2c3e6e', hairC: '#24181a', hair: 'bob', lashes: true },
  CLASSMATE_3: { top: '#5f6a2e', hairC: '#2a1e1a', hair: 'bun', lashes: true, glasses: true },
  BRO_2: { top: '#3f6a58', hairC: '#3a2a20', hair: 'short' },
  LITTLE_SIB: { top: '#a8843c', hairC: '#4a3226', hair: 'pigtails', lashes: true },
  MOM: { top: '#3f6a58', hairC: '#4a3226', hair: 'bob', lashes: true },
  DAD: { top: '#2c4470', hairC: '#3a2a20', hair: 'short', beard: '#6a5040' },
  GRANDPA: { top: '#6a4a36', hairC: GREY, hair: 'balding', glasses: true, mustache: GREY },
  GRANDMA: { top: '#6a4a5e', hairC: GREY, hair: 'bun', glasses: true, lashes: true },
  TEACHER_F: { top: '#5f6a2e', hairC: '#34262c', hair: 'bun', glasses: true, lashes: true },
  TEACHER_M: { top: '#7a3a34', hairC: '#4a4450', hair: 'sidePart', tie: '#2c3e6e' },
  PRINCIPAL: { top: '#3a3a4a', hairC: '#3a3440', hair: 'balding', mustache: '#3a3440', tie: '#6e2c30' },
  COACH: { top: '#3f6a58', hairC: '#2e241e', hair: 'short', cap: '#2f5244' },
  DOCTOR: { top: '#d2d3da', hairC: '#2a2420', hair: 'short', tie: '#2c3e6e' },
  NURSE: { top: '#4a6a8a', hairC: '#3a2620', hair: 'pony', lashes: true },
  POLICE: { top: '#2a3a60', hairC: '#24201e', hair: 'short', cap: '#1c2440' },
  GUARD: { top: '#33313f', hairC: '#24201e', hair: 'short', cap: '#26242e' },
  CHEF: { top: '#bdb8b0', hairC: '#2a2420', hair: 'short' },
  SCIENTIST: { top: '#d2d3da', hairC: '#4a3a30', hair: 'curly', glasses: true },
  REPORTER: { top: '#6a3a4a', hairC: '#3a2a24', hair: 'bob', lashes: true },
  SHADY: { top: '#33313f', hairC: '#26232c', hair: 'quiff', sunglasses: true, tie: '#5e2230' },
};
const HAIRS = {
  short: c => `<path d="M-80,-14 Q-80,-84 0,-86 Q80,-84 80,-14 Q40,-44 0,-40 Q-40,-44 -80,-14 Z" fill="${c}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`,
  fringe: c => `<path d="M-84,20 Q-94,-80 0,-88 Q94,-80 84,20 Q76,-20 50,-30 Q20,-10 -10,-30 Q-50,-10 -84,20 Z" fill="${c}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`,
  bob: c => `<path d="M-86,60 Q-98,-80 0,-88 Q98,-80 86,60 L60,60 Q66,-30 0,-40 Q-66,-30 -60,60 Z" fill="${c}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`,
  long: c => `<path d="M-84,10 Q-100,110 -74,190 L-48,40 Z M84,10 Q100,110 74,190 L48,40 Z" fill="${c}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/><path d="M-84,10 Q-96,-80 0,-88 Q96,-80 84,10 Q70,-40 0,-46 Q-70,-40 -84,10 Z" fill="${c}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`,
  pony: c => `<path d="M70,-40 Q130,0 104,96 Q84,30 60,-10 Z" fill="${c}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/><circle cx="74" cy="-52" r="26" fill="${c}" stroke="${OUT}" stroke-width="7"/>` + HAIRS.short(c),
  pigtails: c => [-1, 1].map(k => `<path d="M${k * 78},-30 Q${k * 140},-10 ${k * 120},70 Q${k * 96},20 ${k * 70},0 Z" fill="${c}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`).join('') + HAIRS.short(c),
  bun: c => `<circle cx="0" cy="-92" r="30" fill="${c}" stroke="${OUT}" stroke-width="7"/>` + HAIRS.short(c),
  quiff: c => `<path d="M-82,-6 Q-90,-84 -10,-92 Q40,-130 96,-96 Q70,-90 60,-70 Q84,-50 82,-6 Q40,-46 0,-42 Q-40,-46 -82,-6 Z" fill="${c}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`,
  sidePart: c => `<path d="M-82,-6 Q-88,-86 0,-88 Q88,-86 82,-6 Q70,-40 30,-48 L-40,-30 Q-66,-26 -82,-6 Z" fill="${c}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`,
  curly: c => [[-70, -30], [-50, -62], [-16, -80], [20, -80], [54, -62], [72, -30], [-34, -50], [0, -58], [36, -50]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="28" fill="${c}" stroke="${OUT}" stroke-width="6"/>`).join(''),
  balding: c => `<path d="M-84,-6 Q-96,-50 -60,-56 M84,-6 Q96,-50 60,-56" fill="none" stroke="${OUT}" stroke-width="34" stroke-linecap="round"/><path d="M-84,-6 Q-96,-50 -60,-56 M84,-6 Q96,-50 60,-56" fill="none" stroke="${c}" stroke-width="22" stroke-linecap="round"/>`,
};
const MOUTHS = {
  shock: `<ellipse cx="0" cy="40" rx="12" ry="16" fill="#7a1f3d" stroke="${OUT}" stroke-width="5"/>`,
  smile: `<path d="M-26,34 Q0,58 26,34" fill="none" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>`,
  love: `<path d="M-26,34 Q0,58 26,34" fill="none" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>`,
  angry: `<path d="M-26,44 Q0,28 26,44" fill="#7a1f3d" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/><path d="M-50,-28 L-12,-14 M50,-28 L12,-14" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/>`,
  meh: `<path d="M-22,40 L22,36" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>`,
  jealous: `<path d="M-22,42 Q0,34 22,44" fill="none" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/><path d="M-50,-20 L-12,-26 M50,-28 L12,-16" stroke="${OUT}" stroke-width="8" stroke-linecap="round"/>`,
};
// mate({ x, y, s, role: 'BESTIE' (a ROSTER key), face: 'shock'|'smile'|'love'|'angry'|'meh'|'jealous', look: -1|0|1 (pupils toward the hero), flip, body })
export function mate({ x, y, s = 1, role = 'CLASSMATE', face = 'shock', look = 0, flip = false, body = true }) {
  const r = ROSTER[role]; if (!r) throw new Error(`mate(): "${role}" is not in the channel roster. Use one of: ${Object.keys(ROSTER).join(', ')}`);
  const dx = look * 6;
  let eyes = face === 'love'
    ? [-28, 28].map(ex => `<path transform="translate(${ex},0) scale(.62)" d="M0,22 C-40,-4 -22,-34 0,-14 C22,-34 40,-4 0,22 Z" fill="${RED}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`).join('')
    : [-28, 28].map(ex => `<circle cx="${ex}" cy="0" r="16" fill="#fff" stroke="${OUT}" stroke-width="5"/><circle cx="${ex + dx}" cy="2" r="6" fill="${OUT}"/>`).join('');
  if (r.lashes && face !== 'love') eyes += `<path d="M-46,-10 L-54,-18 M46,-10 L54,-18" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>`;
  if (r.sunglasses) eyes = `<rect x="-54" y="-18" width="46" height="32" rx="10" fill="${OUT}"/><rect x="8" y="-18" width="46" height="32" rx="10" fill="${OUT}"/><path d="M-10,-6 L10,-6" stroke="${OUT}" stroke-width="7"/>`;
  const extra = (r.glasses ? `<circle cx="-28" cy="0" r="24" fill="none" stroke="${OUT}" stroke-width="6"/><circle cx="28" cy="0" r="24" fill="none" stroke="${OUT}" stroke-width="6"/><path d="M-5,0 L5,0" stroke="${OUT}" stroke-width="6"/>` : '')
    + (r.blush || face === 'love' || face === 'smile' ? `<ellipse cx="-50" cy="26" rx="14" ry="8" fill="#ff8fb0" opacity=".8"/><ellipse cx="50" cy="26" rx="14" ry="8" fill="#ff8fb0" opacity=".8"/>` : '')
    + (r.mustache ? `<path d="M-36,26 Q-18,14 0,26 Q18,14 36,26 Q18,38 0,31 Q-18,38 -36,26 Z" fill="${r.mustache}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>` : '')
    + (r.beard ? `<path d="M-62,30 Q0,110 62,30 Q30,62 0,62 Q-30,62 -62,30 Z" fill="${r.beard}" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>` : '');
  const cap = r.cap ? `<path d="M-84,-30 Q-80,-96 0,-98 Q80,-96 84,-30 Z" fill="${r.cap}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/><path d="M-90,-30 L110,-30 Q120,-16 104,-12 L-90,-12 Z" fill="${r.cap}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>` : '';
  const torso = body ? `<path d="M-100,260 L-100,160 Q-100,82 -40,82 L40,82 Q100,82 100,160 L100,260 Z" fill="${r.top}" stroke="${OUT}" stroke-width="8" stroke-linejoin="round"/>${r.tie ? `<path d="M-10,86 L10,86 L16,170 L0,190 L-16,170 Z" fill="${r.tie}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>` : ''}` : '';
  return `<g data-k="mate" data-role="${role}" transform="translate(${x},${y}) scale(${flip ? -s : s},${s})">${torso}<circle r="80" fill="${PEARL}" stroke="${OUT}" stroke-width="8"/>${eyes}${r.mustache && face !== 'angry' ? '' : MOUTHS[face] || MOUTHS.shock}${extra}${(HAIRS[r.hair] || HAIRS.short)(r.hairC)}${cap}</g>`;
}
// crowd: a row of roster extras all reacting to one point. roles cycles through the given list. Returns the people only; add labels yourself if wanted.
export function crowd({ x0 = 80, x1 = 1200, y = 540, n = 6, s = 0.7, roles = ['CLASSMATE', 'BRO_2', 'CLASSMATE_2', 'RIVAL_2', 'CLASSMATE_3', 'BESTIE'], face = 'shock', lookAt = 640, jitter = 46 }) {
  return Array.from({ length: n }, (_, i) => { const x = n === 1 ? x0 : x0 + (x1 - x0) * i / (n - 1), yy = y + (i % 2 ? jitter : 0); return [yy, mate({ x, y: yy, s, role: roles[i % roles.length], face, look: Math.sign(lookAt - x) })]; })
    .sort((a, b) => a[0] - b[0]).map(a => a[1]).join('');
}

// ------------------------------------------------------------------ text
// Big text: dark outline (never a white edge). Keep it ≤ 3 conversational words, or leave it out when the labels tell the story.
export const text = (str, x, y, size, fill = '#fff', o = {}) => { const a = o.anchor || 'start', t = esc(str); return `<g data-k="text" transform="translate(${x},${y}) rotate(${o.rot || 0})"><text text-anchor="${a}" font-size="${size}" fill="none" stroke="${OUT}" stroke-width="${size * 0.28}" stroke-linejoin="round">${t}</text><text text-anchor="${a}" font-size="${size}" fill="${fill}">${t}</text></g>`; };

// ------------------------------------------------------------------ game UI (the video's rule shown as ONE layer of game interface)
// Label over a head with a pointer. tag(x, y, 'CRUSH', { bg, fg, size, ptr })
export function tag(x, y, str, o = {}) {
  const { bg = DARK, fg = '#fff', size = 46, ptr = true } = o, w = textW(str, size) + 56, h = size + 34;
  const p = ptr ? `<path d="M-20,${h / 2 - 6} L0,${h / 2 + 26} L20,${h / 2 - 6} Z" fill="${bg}" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>` : '';
  const cover = ptr ? `<path d="M-15,${h / 2 - 6} L15,${h / 2 - 6}" stroke="${bg}" stroke-width="10"/>` : '';
  return `<g data-k="ui" transform="translate(${x},${y})">${p}<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="18" fill="${bg}" stroke="${OUT}" stroke-width="8"/>${cover}<text x="0" y="${size * 0.36}" text-anchor="middle" font-size="${size}" fill="${fg}">${esc(str)}</text></g>`;
}
// Stat bar: bar(x, y, w, pct 0..1, { name: 'HP', col, label: '100 / 100' })
export function bar(x, y, w, pct, o = {}) {
  const { name = 'HP', col = GRN, label = '' } = o, nx = textW(name, 40) + 44, bw = w - nx - 16;
  return `<g data-k="ui" transform="translate(${x},${y})"><rect width="${w}" height="64" rx="14" fill="${DARK}" stroke="${OUT}" stroke-width="8"/><text x="22" y="46" font-size="40" fill="#fff">${esc(name)}</text><rect x="${nx}" y="12" width="${bw}" height="40" rx="8" fill="${SLOT}"/><rect x="${nx}" y="12" width="${Math.max(16, bw * Math.min(1, pct))}" height="40" rx="8" fill="${col}"/>${label ? `<text x="${nx + bw / 2}" y="44" text-anchor="middle" font-size="32" fill="#fff" stroke="${OUT}" stroke-width="6" paint-order="stroke">${esc(label)}</text>` : ''}</g>`;
}
export const heart = (x, y, r = 30, col = RED) => `<path transform="translate(${x},${y}) scale(${r / 30})" d="M0,22 C-40,-4 -22,-34 0,-14 C22,-34 40,-4 0,22 Z" fill="${col}" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>`;
export const coin = (x, y, r = 30) => `<g transform="translate(${x},${y})"><circle r="${r}" fill="${YEL}" stroke="${OUT}" stroke-width="6"/><circle r="${r * 0.66}" fill="none" stroke="#c89a1a" stroke-width="5"/><text y="${r * 0.36}" text-anchor="middle" font-size="${r}" fill="#a87a0a">$</text></g>`;
export const star = (x, y, r = 30, col = YEL) => `<path transform="translate(${x},${y})" d="${Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, R = i % 2 ? r * 0.45 : r; return `${i ? 'L' : 'M'}${(Math.cos(a) * R).toFixed(1)},${(Math.sin(a) * R).toFixed(1)}`; }).join(' ')} Z" fill="${col}" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>`;
const ICONS = { heart: (s) => heart(0, 2, s * 0.42), coin: (s) => coin(0, 0, s * 0.42), star: (s) => star(0, 0, s * 0.46) };
// Pill label with an icon, e.g. pill(380, 85, 'LIVES 1', { icon: 'heart' }) or pill(x, y, '$ 9,999,999', { icon: 'coin', bg: C.DARK, fg: C.YEL }). delta draws a red/green "-8" / "+99" beside it.
export function pill(x, y, str, o = {}) {
  const { icon = null, bg = PEARL, fg = OUT, size = 58, ptr = true, delta = '', deltaCol = RED } = o, iw = icon ? size * 0.95 : 0, w = textW(str, size) + 60 + iw, h = size + 36;
  return `<g data-k="ui" transform="translate(${x},${y})">${ptr ? `<path d="M-22,${h / 2 - 6} L0,${h / 2 + 28} L22,${h / 2 - 6} Z" fill="${bg}" stroke="${OUT}" stroke-width="8" stroke-linejoin="round"/>` : ''}<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="20" fill="${bg}" stroke="${OUT}" stroke-width="9"/>${ptr ? `<path d="M-16,${h / 2 - 6} L16,${h / 2 - 6}" stroke="${bg}" stroke-width="11"/>` : ''}
  ${icon ? `<g transform="translate(${-w / 2 + 26 + iw / 2},0)">${ICONS[icon](size)}</g>` : ''}<text x="${iw / 2}" y="${size * 0.36}" text-anchor="middle" font-size="${size}" fill="${fg}">${esc(str)}</text>${delta ? text(delta, w / 2 + 10, size * 0.5, size * 1.05, deltaCol, { rot: 10 }) : ''}</g>`;
}
// Countdown / number ring with a caption plate: ring(x, y, 3, { r, col, caption: 'GAME OVER' })
export function ring(x, y, n, o = {}) {
  const { r = 56, col = RED, caption = '' } = o, cw = Math.max(r * 2.2, textW(caption, r * 0.4) + 30);
  return `<g data-k="ui" transform="translate(${x},${y})"><circle r="${r + 10}" fill="${col}" opacity=".3"/><circle r="${r}" fill="#1c1430" stroke="${OUT}" stroke-width="8"/><circle r="${r - 8}" fill="none" stroke="${col}" stroke-width="10" stroke-dasharray="${(r - 8) * 4.6} 999" transform="rotate(-90)"/><text y="${r * 0.36}" text-anchor="middle" font-size="${r * (String(n).length > 2 ? 0.7 : 1.05)}" fill="#fff" stroke="${OUT}" stroke-width="${r * 0.12}" paint-order="stroke">${esc(n)}</text>${caption ? `<rect x="${-cw / 2}" y="${r + 10}" width="${cw}" height="${r * 0.62}" rx="10" fill="${DARK}" stroke="${OUT}" stroke-width="5"/><text y="${r + 10 + r * 0.46}" text-anchor="middle" font-size="${r * 0.4}" fill="${col}">${esc(caption)}</text>` : ''}</g>`;
}
// Game window: panel(x, y, w, h, { title: 'LEVEL UP', head: C.RED }) then draw its content on top with your own helpers.
export function panel(x, y, w, h, o = {}) {
  const { title = '', head = RED, titleSize = 60 } = o;
  return `<g data-k="ui"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="${DARK}" stroke="${OUT}" stroke-width="10"/>${title ? `<path d="M${x},${y + 34} Q${x},${y} ${x + 34},${y} L${x + w - 34},${y} Q${x + w},${y} ${x + w},${y + 34} L${x + w},${y + 100} L${x},${y + 100} Z" fill="${head}" stroke="${OUT}" stroke-width="10"/><text x="${x + w / 2}" y="${y + 50 + titleSize * 0.36}" text-anchor="middle" font-size="${titleSize}" fill="#fff" stroke="${OUT}" stroke-width="10" paint-order="stroke">${esc(title)}</text>` : ''}</g>`;
}
// Command line / chat box: cmd(x, y, '/gamemode creative', { size })
export function cmd(x, y, str, o = {}) {
  const { size = 54, fg = '#fff' } = o, w = textW(str, size) + 70;
  return `<g data-k="ui" transform="translate(${x},${y})"><rect width="${w}" height="${size + 40}" rx="10" fill="#000" opacity=".72"/><rect width="${w}" height="${size + 40}" rx="10" fill="none" stroke="${OUT}" stroke-width="6"/><text x="26" y="${size + 6}" font-size="${size}" fill="${fg}">${esc(str)}<tspan fill="${GRN}">_</tspan></text></g>`;
}
// Segmented meter that fills toward max: meter(x, y, lit 0..n, { n: 10, name: 'LUCK' })
export function meter(x, y, lit, o = {}) {
  const { n = 10, name = '', s = 1 } = o, nx = name ? textW(name, 44) + 40 : 20;
  return `<g data-k="ui" transform="translate(${x},${y}) scale(${s})"><rect width="${nx + n * 31 + 20}" height="120" rx="24" fill="${DARK}" stroke="${OUT}" stroke-width="8"/>${name ? `<text x="24" y="76" font-size="44" fill="#fff">${esc(name)}</text>` : ''}${Array.from({ length: n }, (_, i) => { const h = 34 + i * (56 / n); return `<rect x="${nx + i * 31}" y="${100 - h}" width="22" height="${h}" rx="5" fill="${i < lit ? (i < n * 0.3 ? YEL : i < n * 0.7 ? '#ff8a4a' : RED) : SLOT}"/>`; }).join('')}</g>`;
}
// Row of icons, some empty: icons(x, y, 9, 1, { icon: 'heart', gap: 62, r: 24 })
export const icons = (x, y, n, filled, o = {}) => { const { icon = 'heart', gap = 62, r = 24 } = o, f = icon === 'star' ? star : icon === 'coin' ? coin : heart; return `<g data-k="ui">${Array.from({ length: n }, (_, i) => i < filled ? f(x + i * gap, y, r) : (icon === 'coin' ? `<circle cx="${x + i * gap}" cy="${y}" r="${r}" fill="${SLOT}" stroke="${OUT}" stroke-width="6"/>` : f(x + i * gap, y, r, SLOT))).join('')}</g>`; };

// ------------------------------------------------------------------ accents and props
export const sparkle = (x, y, r = 30) => `<path d="M${x},${y - r} Q${x + 6},${y - 6} ${x + r},${y} Q${x + 6},${y + 6} ${x},${y + r} Q${x - 6},${y + 6} ${x - r},${y} Q${x - 6},${y - 6} ${x},${y - r} Z" fill="#fff" stroke="${OUT}" stroke-width="4"/>`;
export const glow = (x, y, r, col) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity=".35"/><circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="${col}" opacity=".35"/>`;
export const arrow = (x0, y0, x1, y1, bend = 0, col = YEL) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - bend, a = Math.atan2(y1 - my, x1 - mx), hl = 54; const hp = `M${x1},${y1} L${x1 - Math.cos(a - 0.55) * hl},${y1 - Math.sin(a - 0.55) * hl} L${x1 - Math.cos(a + 0.55) * hl},${y1 - Math.sin(a + 0.55) * hl} Z`, d = `M${x0},${y0} Q${mx},${my} ${x1 - Math.cos(a) * 30},${y1 - Math.sin(a) * 30}`; return `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="30" stroke-linecap="round"/><path d="${hp}" fill="${OUT}" stroke="${OUT}" stroke-width="26" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="16" stroke-linecap="round"/><path d="${hp}" fill="${col}"/>`; };
// A heap of coins / hearts / stars for the hero to sit on or stand in front of.
export function pile(x, y, w = 500, h = 220, icon = 'coin', n = 60) {
  const f = icon === 'heart' ? heart : icon === 'star' ? star : coin; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: n }, () => { const u = rnd() * 2 - 1, v = rnd(); return [u, v]; }).filter(([u, v]) => v < 1 - u * u).sort((a, b) => b[1] - a[1]).map(([u, v]) => f(x + u * w / 2, y - v * h, 26 + rnd() * 10)).join('');
}
// Glitch bars for "the game is breaking" moods.
export const glitch = () => [[80, 18, '#00fff0'], [210, 12, '#ff2a8c'], [470, 16, '#00fff0'], [610, 10, '#ff2a8c']].map(([y, h, c], i) => `<rect x="${i % 2 ? -40 : 30}" y="${y}" width="1280" height="${h}" fill="${c}" opacity=".35"/>`).join('');
// Script-specific props: write plain SVG in the spec with the same look (flat fill, stroke C.OUT 7–9 px, round joins) and wrap it in prop() to place it.
export const prop = (svg, x, y, s = 1, rot = 0) => `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">${svg}</g>`;
