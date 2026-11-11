// engine/core.js — shared runtime for every shot (2D overlays use LOGICAL units):
// 16:9 stage = 1920x1080, 9:16 stage = 1080x1920. The player scales to output pixels.
import { STYLES, BASE_MOODS, PALETTES } from './styles.js';

export const E = { W: 1920, H: 1080, PX: 1, fps: 24, vertical: false, style: null, styleId: 'pearl', palette: null, curMood: null, cfg: {}, words: [], lines: [], shots: [] };
export const V = (h, v) => (E.vertical ? v : h);           // pick a value by aspect: V(landscape, vertical)

// ---------- math / timing ----------
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const ease = {
  linear: x => clamp(x),
  in: x => (x = clamp(x)) ** 3,
  out: x => 1 - (1 - clamp(x)) ** 3,
  inOut: x => ((x = clamp(x)) < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  sine: x => -(Math.cos(Math.PI * clamp(x)) - 1) / 2,
  outBack: x => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; },
  outElastic: x => { x = clamp(x); return x === 0 || x === 1 ? x : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1; },
  // in-out with a little anticipation (dips back first) and overshoot (passes the target, then settles); a = 1 ≈ 10 %
  back: (x, a = 0.5) => { x = clamp(x); const c2 = 1.70158 * a * 1.525; return x < 0.5 ? ((2 * x) ** 2 * ((c2 + 1) * 2 * x - c2)) / 2 : ((2 * x - 2) ** 2 * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2; },
};
ease.backK = (a) => (x) => ease.back(x, a);
// keyframes: key(t, [[0, 1], [2, 1.2], [4, 1]], ease.inOut) -> number | array | object of numbers
export function key(t, frames, fn = ease.inOut) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1] = frames[i];
    if (t <= t1) { const [t0, v0] = frames[i - 1]; return mixVal(v0, v1, (frames[i][2] || fn)((t - t0) / (t1 - t0))); }
  }
  return frames[frames.length - 1][1];
}
export function mixVal(a, b, k) {
  if (typeof a === 'number') return lerp(a, b, k);
  if (Array.isArray(a)) return a.map((v, i) => mixVal(v, b[i], k));
  const o = {}; for (const kk in a) o[kk] = typeof a[kk] === 'number' || Array.isArray(a[kk]) ? mixVal(a[kk], b[kk] ?? a[kk], k) : (k < 0.5 ? a[kk] : b[kk] ?? a[kk]); return o;
}
// smoothKey(t, [[0, v0], [2, v1], [5, v2]]) — like key(), but one smooth curve through every key: it eases in at the first key,
// keeps moving through the middle keys (no stop at each one) and eases out at the last. Monotone, so it never swings past a
// key and two equal keys hold still. Values: numbers, arrays, or objects of numbers/arrays (camera keys {pos, look, fov, roll}).
export function smoothKey(t, frames) {
  const n = frames.length;
  const flat = (v, out = []) => { if (typeof v === 'number') out.push(v); else if (Array.isArray(v)) v.forEach(x => flat(x, out)); else if (v && typeof v === 'object') for (const k of Object.keys(v).sort()) flat(v[k], out); return out; };
  // every key gets the same fields: a field missing on a key (a fov given only on some keys) carries over from the nearest key that has it
  let vals = frames.map(f => f[1]);
  if (vals[0] && typeof vals[0] === 'object' && !Array.isArray(vals[0])) {
    vals = vals.map(v => ({ ...v }));
    for (const k of new Set(vals.flatMap(v => Object.keys(v)))) { let last = vals.find(v => v[k] !== undefined)[k]; for (const v of vals) { if (v[k] === undefined) v[k] = last; else last = v[k]; } }
  }
  if (n === 1 || t <= frames[0][0]) return vals[0]; if (t >= frames[n - 1][0]) return vals[n - 1];
  const ts = frames.map(f => f[0]), Y = vals.map(v => flat(v)); let i = 0; while (i < n - 2 && t > ts[i + 1]) i++;
  const h = ts[i + 1] - ts[i], u = (t - ts[i]) / h, h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  const slope = (j, c) => (Y[j + 1][c] - Y[j][c]) / (ts[j + 1] - ts[j]);
  const tan = (j, c) => { if (j === 0 || j === n - 1) return 0; const d0 = slope(j - 1, c), d1 = slope(j, c); if (d0 * d1 <= 0) return 0; const a = ts[j] - ts[j - 1], b = ts[j + 1] - ts[j]; return 3 * (a + b) / ((2 * b + a) / d0 + (b + 2 * a) / d1); };
  const out = Y[i].map((y0, c) => h00 * y0 + h10 * h * tan(i, c) + h01 * Y[i + 1][c] + h11 * h * tan(i + 1, c));
  let p = 0; const unflat = (ref) => { if (typeof ref === 'number') return out[p++]; if (Array.isArray(ref)) return ref.map(unflat); if (ref && typeof ref === 'object') { const o = {}; for (const k of Object.keys(ref).sort()) o[k] = unflat(ref[k]); return o; } return ref; };
  return unflat(vals[i]);
}
export function rng(seed = 1) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const hash01 = (n, seed = 0) => hash(n * 1.618 + seed * 91.7);   // deterministic 0..1 for an integer n
export function noise(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i + seed * 57), hash(i + 1 + seed * 57), u) * 2 - 1; }
export const shake = (t, amp = 4, freq = 1.3, seed = 3) => [noise(t * freq, seed) * amp, noise(t * freq, seed + 9) * amp];
// talking mouth amount (0..1) driven by the real word timings when available
export function talkAmount(globalT, from = -1, to = 1e9) {
  if (globalT < from || globalT > to) return 0;
  const w = E.words.find(w => globalT >= w.start && globalT <= w.end);
  if (!w && E.words.length) return 0;
  return clamp(0.25 + 0.75 * Math.abs(Math.sin(globalT * 17)) * (0.6 + 0.4 * Math.sin(globalT * 5.3)));
}

// mouth amount for a named speaker (from the TTS word timeline: words carry .speaker). Narrator lines return 0 for characters.
//   hero.face({ expr: 'smile', talk: talkFor('MOM', info.globalT) })
// The mouth follows the letters of the word being spoken: a/e/i open wide, o/u/w round, m/b/p close, f/v nearly close.
export function talkFor(speaker, globalT) { return talkShape(speaker, globalT).open; }
const SPK = (w) => String(w.speaker || 'NARRATOR').toUpperCase();
// 1.0 visemes: each sound shapes the mouth — open (height), round (o/u/w), wide (e/i/ee), teeth (f/v: top teeth on the lip),
// closed (m/b/p: lips pressed). Words are split into sounds with the common English digraphs first.
const VISEME = { a: [0.95, 0, 0.2, 0, 0], e: [0.55, 0, 0.9, 0, 0], i: [0.5, 0, 0.95, 0, 0], y: [0.45, 0, 0.8, 0, 0], o: [0.65, 1, 0, 0, 0], u: [0.5, 1, 0, 0, 0], w: [0.35, 1, 0, 0, 0],
  m: [0.14, 0, 0, 0, 1], b: [0.14, 0, 0, 0, 1], p: [0.14, 0, 0, 0, 1], f: [0.18, 0, 0.3, 1, 0], v: [0.18, 0, 0.3, 1, 0], r: [0.4, 0.55, 0, 0, 0], sh: [0.35, 0.75, 0, 0, 0], ch: [0.35, 0.7, 0, 0, 0],
  oo: [0.5, 1, 0, 0, 0], ee: [0.5, 0, 1, 0, 0], th: [0.3, 0, 0.5, 0, 0], s: [0.25, 0, 0.75, 0, 0], z: [0.25, 0, 0.75, 0, 0], t: [0.35, 0, 0.6, 0, 0], d: [0.38, 0, 0.5, 0, 0], n: [0.38, 0, 0.5, 0, 0], l: [0.42, 0, 0.4, 0, 0], _: [0.5, 0, 0.2, 0, 0] };
const VIS = (c) => VISEME[c] || VISEME._;
const sounds = (s) => { const out = []; for (let i = 0; i < s.length; i++) { const two = s.slice(i, i + 2); if (['sh', 'ch', 'th', 'oo', 'ee'].includes(two)) { out.push(two); i++; } else out.push(s[i]); } return out; };
// talkShape('MIA', info.globalT) -> { open 0..1, round, wide, teeth, closed } (face() takes it as talk, or pass face({ speaker, gt }))
export function talkShape(speaker, globalT) {
  const w = E.words.find(w => globalT >= w.start - 0.04 && globalT <= w.end + 0.03);
  if (!w || (speaker != null && SPK(w) !== String(speaker).toUpperCase())) return { open: 0, round: 0, wide: 0, teeth: 0, closed: 0 };
  let s = String(w.word || '').toLowerCase().replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1'); if (s.length > 3) s = s.replace(/e$/, '');
  if (/\d/.test(w.word || '') || !s) s = 'aea';
  const S2 = sounds(s), dur = Math.max(0.06, w.end - w.start), u = clamp((globalT - w.start + 0.03) / dur) * S2.length, i = Math.min(S2.length - 1, Math.floor(u)), f = u - i;
  const A = VIS(S2[i]), B = VIS(S2[Math.min(S2.length - 1, i + 1)]), k = ease.inOut(prog(f, 0.5, 1)), mixv = (j) => lerp(A[j], B[j], k);
  const env = clamp(Math.min((globalT - w.start + 0.04) / 0.07, (w.end + 0.03 - globalT) / 0.08));
  return { open: clamp(mixv(0) * env * (0.75 + 0.25 * Math.min(1, dur / 0.25))), round: mixv(1), wide: mixv(2), teeth: mixv(3) * env, closed: mixv(4) * env };
}
// who is speaking around globalT: { speaker, since (s since their run of words began), prev (the speaker before), word }
export function speakerAt(globalT, gap = 0.6) {
  const W = E.words; let i = -1; for (let k = 0; k < W.length; k++) { if (W[k].start - 0.03 <= globalT) i = k; else break; }
  if (i < 0) return { speaker: null, since: 0, prev: null, word: null };
  const w = W[i], live = globalT <= w.end + gap, sp = SPK(w); let j = i; while (j > 0 && SPK(W[j - 1]) === sp && W[j].start - W[j - 1].end < 1.5) j--;
  const prev = j > 0 ? SPK(W[j - 1]) : null;
  return live ? { speaker: sp, since: globalT - W[j].start, prev, word: w } : { speaker: null, since: globalT - w.end - gap, prev: sp, word: null };
}
// time (global seconds) when a word is spoken: wordTime('brain', 40) -> 43.78 (null if not found)
export function wordTime(match, after = 0) {
  const m = match.toLowerCase().replace(/[^\w']/g, '');
  const w = E.words.find(w => w.start >= after - 0.05 && w.word.toLowerCase().replace(/[^\w']/g, '').startsWith(m));
  return w ? w.start : null;
}

// ---------- colour ----------
export function rgb(c) {
  if (Array.isArray(c)) return c;
  if (c.startsWith('rgb')) { const m = c.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m[3] ?? 1]; }
  let h = c.slice(1); if (h.length === 3) h = [...h].map(x => x + x).join('');
  const n = parseInt(h.slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255, h.length > 6 ? parseInt(h.slice(6), 16) / 255 : 1];
}
export const css = ([r, g, b, a = 1]) => `rgba(${r | 0},${g | 0},${b | 0},${+a.toFixed(3)})`;
export const mix = (c1, c2, k) => { const a = rgb(c1), b = rgb(c2); return css(a.map((v, i) => lerp(v, b[i] ?? 1, k))); };
export const alpha = (c, a) => { const x = rgb(c); return css([x[0], x[1], x[2], a]); };
export const shade = (c, k) => (k < 0 ? mix(c, '#000000', -k) : mix(c, '#ffffff', k));

// ---------- style / moods ----------
// setStyle('pearl', 'tropic'): a style re-grades every mood; an optional palette gives this one video its own colour world.
export function setStyle(id, palette = null) {
  E.styleId = STYLES[id] ? id : 'pearl'; E.palette = PALETTES[palette] ? palette : null;
  const pal = E.palette ? PALETTES[E.palette] : null, base = STYLES[E.styleId];
  E.style = pal?.grade ? { ...base, grade: { ...base.grade, ...pal.grade } } : base;
}
// mood('night') -> { sky:[...], ambient, key, rim, wall, floor, dark, practical, fog, houses?, tree?, skyline? }
// Called without a name it uses the mood of the stage being built, so props match their set.
export function mood(name) {
  const n = name || E.curMood || 'night', base = BASE_MOODS[n] || BASE_MOODS.night;
  return { ...base, ...(E.style.moods?.[n] || {}), ...(E.palette ? PALETTES[E.palette]?.moods?.[n] || {} : {}) };
}
export const S = () => E.style;   // current style tokens (ink, feature, ui colours, grade)

// ---------- drawing primitives (logical units) ----------
export function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function seg(g, pts, w, col, cap = 'round') { g.strokeStyle = col; g.lineWidth = w; g.lineCap = cap; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); }
export function poly(g, pts, fill) { g.fillStyle = fill; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fill(); }
export function circle(g, x, y, r, fill) { g.fillStyle = fill; g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2); g.fill(); }
export function ring(g, x, y, r, w, col) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2); g.stroke(); }
export function linGrad(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => Array.isArray(c) ? gr.addColorStop(c[0], c[1]) : gr.addColorStop(i / Math.max(1, stops.length - 1), c)); return gr; }
export function radGrad(g, x, y, r0, r1, stops) { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach((c, i) => Array.isArray(c) ? gr.addColorStop(c[0], c[1]) : gr.addColorStop(i / Math.max(1, stops.length - 1), c)); return gr; }
export function glow(g, x, y, r, col, a = 1) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = radGrad(g, x, y, 0, r, [alpha(col, a), alpha(col, a * 0.35), alpha(col, 0)]); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore(); }
// darken / tint the whole stage (e.g. after a blurred background so the subject pops)
export function veil(g, color = '#000', a = 0.3, op = 'source-over') { g.save(); g.globalCompositeOperation = op; g.fillStyle = alpha(color, a); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); g.restore(); }
export function fillRect(g, x, y, w, h, fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); }
// sky / backdrop gradient over the whole stage (works under any camera)
export function backdrop(g, colors, area = [-E.W, -E.H, E.W * 3, E.H * 3]) { g.fillStyle = linGrad(g, 0, 0, 0, E.H, colors); g.fillRect(...area); }

// ---------- text ----------
export const FONTS = { title: 'Fredoka', ui: 'Nunito', serif: 'Playfair Display' };
export function text(g, str, x, y, o = {}) {
  const { size = 48, font = FONTS.title, weight = 700, color = '#fff', align = 'center', base = 'middle', glow: gl = 0, glowColor = 'rgba(255,140,60,.8)', spacing = 0, alpha: a = 1, stroke = 0, strokeColor = '#000', italic = false } = o;
  g.save(); g.globalAlpha *= a; g.font = `${italic ? 'italic ' : ''}${weight} ${size}px "${font}"`; g.textAlign = align; g.textBaseline = base;
  if ('letterSpacing' in g) g.letterSpacing = `${spacing}px`;
  if (stroke) { g.lineJoin = 'round'; g.lineWidth = stroke; g.strokeStyle = strokeColor; g.strokeText(str, x, y); }
  if (gl) { g.shadowColor = glowColor; g.shadowBlur = gl; }
  g.fillStyle = color; g.fillText(str, x, y); g.restore();
}
export function measure(g, str, size, font = FONTS.title, weight = 700) { g.save(); g.font = `${weight} ${size}px "${font}"`; const w = g.measureText(str).width; g.restore(); return w; }

// ---------- camera & parallax ----------
// cam = {x, y, z (zoom), r (roll, radians)}; depth 1 = character plane, <1 farther, >1 foreground
export function layer(g, cam, depth, fn) {
  g.save(); const z = 1 + ((cam.z ?? 1) - 1) * depth;
  g.translate(E.W / 2, E.H / 2); if (cam.r) g.rotate(cam.r * Math.min(1, depth)); g.scale(z, z);
  g.translate(-E.W / 2 - (cam.x || 0) * depth, -E.H / 2 - (cam.y || 0) * depth); fn(g); g.restore();
}
// cheap depth-of-field: draw into a small canvas and upscale (optionally extra blur)
const _blurPool = [];
export function blurLayer(g, amount, fn, cam = null, depth = 1) {
  if (amount <= 0.3) { cam ? layer(g, cam, depth, fn) : fn(g); return; }
  const k = clamp(1 / (1 + amount / 3), 0.06, 1);
  const w = Math.max(8, Math.round(E.W * E.PX * k)), h = Math.max(8, Math.round(E.H * E.PX * k));
  let c = _blurPool.find(b => !b.busy && b.width === w && b.height === h);
  if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; _blurPool.push(c); }
  c.busy = true; const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h);
  x.setTransform(w / E.W, 0, 0, h / E.H, 0, 0); cam ? layer(x, cam, depth, fn) : fn(x);
  // blur at the small size (fast), then upscale smoothly
  if (!c.b) { c.b = document.createElement('canvas'); }
  if (c.b.width !== w || c.b.height !== h) { c.b.width = w; c.b.height = h; }
  const bx = c.b.getContext('2d'); bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, w, h);
  bx.filter = `blur(${Math.max(0.4, amount * E.PX * k)}px)`; bx.drawImage(c, 0, 0); bx.filter = 'none';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(c.b, 0, 0, E.W * E.PX, E.H * E.PX); g.restore(); c.busy = false;
}

// ---------- shot registry ----------
const SHOTS = {};
// registerShot('s012', { init(T, info) -> state, draw(state, t, info, T), overlay?(g, t, info, state), mblur? })   3D (default when init exists)
// registerShot('s013', { kind: '2d', draw(g, t, info) })                                                       2D card (titles, diagrams)
export function registerShot(id, def) { SHOTS[id] = { kind: def.kind || (def.init ? '3d' : '2d'), ...def }; }
export const getShot = id => SHOTS[id];
export const allShots = () => SHOTS;
