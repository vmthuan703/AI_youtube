// engine/ui2d.js — on-screen graphics: titles, data cards, counters, callouts, blueprint diagrams, end screen, captions.
import { E, S, V, clamp, lerp, prog, ease, alpha, shade, mix, seg, circle, ring, rr, poly, text, measure, glow, linGrad, FONTS } from './core.js';
import { drawFigure, POSES } from './rig2d.js';

const fadeIO = (t, dur, inT = 0.35, outT = 0.35) => clamp(Math.min(t / inT, (dur - t) / outT));

// Big glowing title: "WHAT IF ONE SECOND / FELT LIKE FOREVER?" (+ optional part label)
export function titleCard(g, t, o = {}) {
  const { lines = ['WHAT IF', 'TITLE GOES HERE?'], sub = null, dur = 4, y = E.H / 2 } = o; const ui = S().ui;
  const a = fadeIO(t, dur, 0.5, 0.5); if (a <= 0) return;
  const s = 1 + 0.025 * t, big = V(96, 92), small = V(54, 52);
  g.save(); g.globalAlpha *= a; g.translate(E.W / 2, y); g.scale(s, s);
  const fit = (str, size) => Math.min(size, (E.W * 0.86) / Math.max(1, measure(g, str, size) / size));
  const sizes = lines.map((ln, i) => fit(ln, i === lines.length - 1 ? big : small));
  const gaps = sizes.slice(1).map((s2, i) => (sizes[i] + s2) * 0.62), totalH = gaps.reduce((a, b) => a + b, 0);
  let yy = -totalH / 2 - (sub ? big * 0.45 : 0);
  lines.forEach((ln, i) => { const isBig = i === lines.length - 1; text(g, ln, 0, yy, { size: sizes[i], color: isBig ? ui.gold : ui.cream, glow: 30, glowColor: 'rgba(255,120,40,.85)', spacing: isBig ? 3 : 4 }); yy += gaps[i] ?? sizes[i] * 0.9; });
  if (sub) { g.fillStyle = alpha(ui.cream, 0.55); g.fillRect(-E.W * 0.22, yy - big * 0.32, E.W * 0.44, 3); text(g, sub, 0, yy + big * 0.32, { size: small * 1.05, color: ui.accent, glow: 24, glowColor: 'rgba(255,80,60,.7)', spacing: 3 }); }
  g.restore();
}
// Glowing single question / chapter line ("IS ANY OF THIS REAL?")
export function bigLine(g, t, o = {}) { const { str = 'IS ANY OF THIS REAL?', dur = 3, y = E.H / 2, size = V(84, 76), color = S().ui.gold } = o; const a = fadeIO(t, dur, 0.4, 0.4); if (a <= 0) return; const sz = Math.min(size, (E.W * 0.88) / Math.max(1, measure(g, str, size) / size)); text(g, str, E.W / 2, y, { size: sz, color, glow: 30, glowColor: alpha(color, 0.7), alpha: a, spacing: 2 }); }
// Corner badge e.g. "100x" (slow-motion factor) or "DAY 3"
export function badge(g, o = {}) { const { str = '100x', x = E.W - V(90, 70), y = V(110, 150), color = S().ui.gold, size = V(38, 44), a = 1 } = o; text(g, str, x, y, { size, color, glow: 18, glowColor: alpha(color, 0.6), align: 'right', alpha: a, font: FONTS.ui, weight: 900 }); }
// timing / measurement readout e.g. "0.20 s", "NORMAL: 0.25 s"
export function readout(g, o = {}) {
  const { label = null, value = '0.20 s', x = 200, y = E.H - 200, color = S().ui.gold, size = V(46, 52), a = 1, align = 'left' } = o;
  const ls = size * 0.42, lw = label ? measure(g, label, ls, FONTS.ui, 900) + 18 : 0, vw = measure(g, value, size, FONTS.ui, 900), tot = lw + vw;
  let xx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x;
  g.save(); g.globalAlpha *= a;
  if (label) text(g, label, xx, y + size * 0.08, { size: ls, color: alpha(S().ui.cream, 0.8), font: FONTS.ui, weight: 900, align: 'left', spacing: 2 });
  text(g, value, xx + lw, y, { size, color, glow: 16, glowColor: alpha(color, 0.6), font: FONTS.ui, weight: 900, align: 'left' }); g.restore();
}
// Callout label with leader line pointing at something
export function callout(g, t, o = {}) { o = sized(o, V(34, 38), V(30, 34)); const { at = [E.W / 2, E.H / 2], to = [E.W / 2 + 200, E.H / 2 - 150], str = 'LABEL', color = S().ui.cream, size = V(30, 36), start = 0 } = o; const p = ease.out(prog(t, start, start + 0.5)); if (p <= 0) return; const ex = lerp(at[0], to[0], p), ey = lerp(at[1], to[1], p); circle(g, at[0], at[1], 6, color); seg(g, [at, [ex, ey]], 2, alpha(color, 0.8)); text(g, str, to[0] + (to[0] > at[0] ? 12 : -12), to[1], { size, color, font: FONTS.ui, weight: 900, align: to[0] > at[0] ? 'left' : 'right', alpha: clamp((p - 0.6) / 0.4), spacing: 1.5 }); }
// Dimension line with arrows: "30 m"
export function dimension(g, t, o = {}) { const { x1, y1, x2, y2, str = '30 m', color = S().ui.gold, start = 0 } = o; const p = ease.out(prog(t, start, start + 0.6)); if (p <= 0) return; const ex = lerp(x1, x2, p), ey = lerp(y1, y2, p); seg(g, [[x1, y1], [ex, ey]], 3, color); const ang = Math.atan2(y2 - y1, x2 - x1), ar = (x, y, a) => poly(g, [[x, y], [x - Math.cos(a - 0.4) * 16, y - Math.sin(a - 0.4) * 16], [x - Math.cos(a + 0.4) * 16, y - Math.sin(a + 0.4) * 16]], color); ar(x1, y1, ang + Math.PI); if (p > 0.98) ar(x2, y2, ang); text(g, str, (x1 + x2) / 2 + 24, (y1 + y2) / 2, { size: V(40, 46), color, font: FONTS.ui, weight: 900, align: 'left', glow: 12, glowColor: alpha(color, 0.6), alpha: clamp((p - 0.5) * 2) }); }
// Data card: title, subtitle, animated counter + curve drawing on
export function dataCard(g, t, o = {}) {
  const { title = 'SUBJECT 11 · MAX', subtitle = 'SPEED FACTOR', from = 10, to = 12.4, decimals = 1, unit = 'x', start = 0.4, dur = 2, labels = [[0, null], [0.55, null], [1, null]], shape = 1.7, arrow = true, inDur = 0.35, total = 99 } = o;
  const ui = S().ui; const aIn = ease.out(prog(t, 0, inDur)) * clamp((total - t) / 0.3); if (aIn <= 0) return;
  const cw = V(1300, 940), ch = V(700, 760), cx = (E.W - cw) / 2, cy = (E.H - ch) / 2;
  g.save(); g.globalAlpha *= aIn; g.translate(E.W / 2, E.H / 2); const sc = 0.92 + 0.08 * ease.outBack(prog(t, 0, inDur + 0.1)); g.scale(sc, sc); g.translate(-E.W / 2, -E.H / 2);
  rr(g, cx, cy, cw, ch, 28); g.fillStyle = ui.card; g.fill(); g.strokeStyle = ui.cardLine; g.lineWidth = 2.5; g.stroke();
  text(g, title, cx + 70, cy + 92, { size: V(46, 48), color: ui.text, font: FONTS.ui, weight: 900, align: 'left' });
  text(g, subtitle, cx + 72, cy + 136, { size: V(22, 26), color: ui.sub, font: FONTS.ui, weight: 900, align: 'left', spacing: 2 });
  for (let i = 0; i < 4; i++) { g.fillStyle = alpha(ui.text, 0.08); g.fillRect(cx + 70, cy + ch * 0.36 + i * ch * 0.14, cw - 140, 2); }
  const p = ease.inOut(prog(t, start, start + dur)), v = lerp(from, to, p);
  const valStr = v.toFixed(decimals) + unit; const vx = cx + cw - (arrow ? 120 : 70);
  text(g, valStr, vx, cy + 108, { size: V(84, 88), color: ui.accent, font: FONTS.ui, weight: 900, align: 'right', glow: 22, glowColor: alpha(ui.accent, 0.5) });
  if (arrow) poly(g, to >= from ? [[vx + 18, cy + 120], [vx + 54, cy + 120], [vx + 36, cy + 88]] : [[vx + 18, cy + 92], [vx + 54, cy + 92], [vx + 36, cy + 124]], ui.accent);
  const x0 = cx + 110, x1 = cx + cw - 110, y0 = cy + ch - 90, y1 = cy + ch * 0.33;
  const pt = (u) => [lerp(x0, x1, u), lerp(y0, y1, Math.pow(u, shape))];
  g.strokeStyle = ui.accent; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i <= 120; i++) { const [x, y] = pt((i / 120) * p); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  const [hx, hy] = pt(p); glow(g, hx, hy, 60, ui.accent, 0.8);
  for (const [u, lab] of labels) { if (p + 0.001 < u) continue; const [lx, ly] = pt(u); const s = lab ?? lerp(from, to, u).toFixed(decimals) + unit; text(g, s, lx, ly - 28, { size: V(30, 34), color: mix(ui.accent, '#ffffff', 0.7), font: FONTS.ui, weight: 900, alpha: clamp((p - u + 0.06) / 0.06) }); }
  g.restore();
}
// Horizontal comparison bars: [{label:'REAL', v:0.3}, {label:'FELT', v:0.9}]
export function compareBars(g, t, o = {}) { const { rows = [{ label: 'REAL', v: 0.3 }, { label: 'FELT', v: 0.9 }], x = V(220, 120), y = E.H - V(250, 520), w = V(700, 840), start = 0, color = S().ui.blueprint } = o; rows.forEach((r, i) => { const p = ease.out(prog(t, start + i * 0.3, start + i * 0.3 + 1)); const yy = y + i * 60; text(g, r.label, x, yy, { size: V(24, 30), color: alpha(S().ui.cream, 0.8), font: FONTS.ui, weight: 900, align: 'left', spacing: 2 }); rr(g, x + 120, yy - 10, w, 20, 10); g.fillStyle = alpha(color, 0.15); g.fill(); rr(g, x + 120, yy - 10, Math.max(20, w * r.v * p), 20, 10); g.fillStyle = r.color || color; g.fill(); }); }
// Progress / timeline meter (e.g. TIME vs MEMORY strips)
export function meter(g, t, o = {}) { const { x = 200, y = 300, w = E.W - 400, ticks = 40, label = 'TIME', color = S().ui.gold, start = 0, speed = 1 } = o; text(g, label, x, y - 50, { size: V(40, 44), color, align: 'left', glow: 14, glowColor: alpha(color, 0.5) }); rr(g, x, y - 26, w, 52, 10); g.fillStyle = alpha(color, 0.08); g.fill(); for (let i = 0; i <= ticks; i++) { const big = i % 5 === 0, xx = x + 20 + ((w - 40) * i) / ticks, on = (t - start) * speed * ticks > i; seg(g, [[xx, y - (big ? 18 : 9)], [xx, y + (big ? 18 : 9)]], big ? 4 : 2, alpha(color, on ? 1 : 0.35)); } }
// Blueprint style: dark navy backdrop + faint grid; draw your diagram in bpStroke() colour with seg/ring
export function blueprint(g, o = {}) { const { grid = 60, a = 0.07 } = o; const ui = S().ui; g.fillStyle = ui.bpBg; g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); g.strokeStyle = alpha(ui.blueprint, a); g.lineWidth = 1; for (let x = 0; x <= E.W; x += grid) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, E.H); g.stroke(); } for (let y = 0; y <= E.H; y += grid) { g.beginPath(); g.moveTo(0, y); g.lineTo(E.W, y); g.stroke(); } }
export const bpStroke = () => S().ui.blueprint;
// line-art stick figure for blueprint/diagram segments
export function lineFigure(g, o = {}) { const { x, y, s = 1, pose = POSES.stand, color = '#e8f0ff', facing = 1 } = o; const p = pose; g.save(); g.translate(x, y); g.scale(s * facing, s); g.strokeStyle = color; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; const L = (pts) => { g.beginPath(); g.moveTo(...pts[0]); pts.slice(1).forEach(q => g.lineTo(...q)); g.stroke(); }; L([p.sh, p.hip]); L([p.hip, p.kF, p.fF]); L([p.hip, p.kB, p.fB]); L([p.sh, p.eF, p.hF]); L([p.sh, p.eB, p.hB]); g.beginPath(); g.arc(p.head[0], p.head[1], 22, 0, Math.PI * 2); g.stroke(); g.restore(); }
// Speech/comment bubble with dots (used on end screens)
export function bubble(g, x, y, o = {}) { const { w = 120, h = 70, color = '#f4efe6', dots = true, str = null } = o; rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fillStyle = color; g.fill(); poly(g, [[x - w * 0.25, y + h / 2 - 4], [x - w * 0.38, y + h / 2 + 18], [x - w * 0.08, y + h / 2 - 4]], color); if (dots && !str) for (let i = -1; i <= 1; i++) circle(g, x + i * w * 0.2, y, h * 0.09, S().ink); if (str) text(g, str, x, y + 2, { size: h * 0.42, color: S().ink, font: FONTS.ui, weight: 900 }); }
// End screen: question + comment bubble + subscribe pill + the whole cast lined up
export function endScreen(g, t, o = {}) {
  const { question = 'What would YOU do?', cast = [], moodColors = ['#1b1426', '#2a1a2e', '#4a2a2a'], rim = '#ffb070' } = o; const ui = S().ui;
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, moodColors); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
  glow(g, E.W / 2, E.H * 0.9, E.W * 0.45, '#ff9a5a', 0.3);
  const a1 = ease.out(prog(t, 0.2, 0.8));
  text(g, question, E.W / 2, V(150, 360), { size: V(64, 66), font: FONTS.serif, weight: 900, italic: true, color: ui.cream, alpha: a1, glow: 18, glowColor: 'rgba(255,170,90,.5)' });
  bubble(g, E.W / 2 - V(260, 170), V(300, 560), { w: V(110, 130), h: V(60, 70) });
  const sp = ease.outBack(prog(t, 0.6, 1.1)); g.save(); g.translate(E.W / 2 + V(60, 60), V(300, 560)); g.scale(sp, sp); rr(g, -150, -38, 300, 76, 38); g.fillStyle = '#e0302a'; g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-104, 12); g.quadraticCurveTo(-104, -18, -92, -18); g.quadraticCurveTo(-80, -18, -80, 12); g.closePath(); g.fill(); circle(g, -92, 17, 5, '#fff'); text(g, 'Subscribe', 18, 2, { size: 34, color: '#fff', font: FONTS.ui, weight: 900 }); g.restore();
  const n = cast.length, gap = Math.min(V(150, 120), (E.W * 0.85) / Math.max(1, n)), y0 = E.H - V(170, 420);
  cast.forEach((of, i) => { const k = ease.out(prog(t, 0.3 + i * 0.08, 0.7 + i * 0.08)); drawFigure(g, { x: E.W / 2 + (i - (n - 1) / 2) * gap, y: y0 + (1 - k) * 40, s: V(0.9, 1.05), facing: 1, outfit: of, pose: POSES.relaxed, expr: 'smile', alpha: k, rim: { color: rim, dir: [0, 1] } }); });
}
// Word-level captions (great for 9:16). Shows a 3–4 word phrase, current word highlighted.
export function captions(g, globalT, o = {}) {
  const words = E.words; if (!words.length) return; const { y = V(E.H - 150, E.H * 0.79), size = V(58, 74), max = 4, color = '#ffffff', hi = S().ui.gold } = o;
  let i = -1; for (let k = words.length - 1; k >= 0; k--) if (globalT >= words[k].start - 0.05) { if (globalT <= words[k].end + 0.35) i = k; break; } if (i < 0) return;
  const st = Math.floor(i / max) * max, group = words.slice(st, st + max); const strs = group.map(w => w.word.trim().toUpperCase());
  const w0 = strs.map(s => measure(g, s, size)).reduce((a, b) => a + b, 0) + size * 0.3 * (strs.length - 1);
  const sz = size * Math.min(1, (E.W * 0.88) / w0);   // shrink long phrases to fit the frame
  const gap = sz * 0.3, widths = strs.map(s => measure(g, s, sz)), total = widths.reduce((a, b) => a + b, 0) + gap * (strs.length - 1);
  let x = E.W / 2 - total / 2; strs.forEach((s, k) => { const cur = st + k === i; const pop = cur ? 1 + 0.08 * ease.out(prog(globalT, group[k].start, group[k].start + 0.12)) : 1; g.save(); g.translate(x + widths[k] / 2, y); g.scale(pop, pop); text(g, s, 0, 0, { size: sz, color: cur ? hi : color, stroke: sz * 0.16, strokeColor: 'rgba(0,0,0,.85)' }); g.restore(); x += widths[k] + gap; });
}

// ---------------------------------------------------------------- 3D-explainer graphics (the look of the reference videos)
// Labels use S().ui.labelFont: 'ui' (rounded heavy sans, letter-spaced) or 'serif' (Playfair small caps). All take t/start
// for a pop-in (ease.outBack) and fade with a.
const LF = () => (S().ui.labelFont === 'serif' ? FONTS.serif : FONTS.ui);
const popK = (t, start = 0) => (t == null ? 1 : ease.outBack(prog(t, start, start + 0.35)));
// "1 IN 1,000", "$10,000", "40,000": dark translucent pill, thin light border, bold caps (gold: true for key numbers)
// full width of a pill, to place it against something
export const pillWidth = (g, str, size, icon = null) => { const f = LF(), w8 = f === FONTS.serif ? 700 : 900; return measure(g, str, size, f, w8) + (icon ? size * 1.05 : 0) + size * 1.1; };
// Text never gets smaller than a phone can read: each label has a default size and a floor (logical px at 1080 high).
// E.cfg.textScale (config.json) scales every default, e.g. 1.1 for a mostly-mobile audience.
const TS = () => E.cfg?.textScale ?? 1;
const sized = (o, def, min) => ({ ...o, size: Math.max((o.size ?? def * TS()), min) });
export function pill(g, o = {}) {
  o = sized(o, V(50, 58), V(36, 42));
  const { str = '1 IN 1,000', x = E.W / 2, y = V(140, 260), size = V(48, 56), gold = false, color = null, a = 1, t = null, start = 0, icon = null, bg = null, line = null } = o;
  const k = popK(t, start); if (k <= 0.001 || a <= 0) return; const f = LF(), w8 = f === FONTS.serif ? 700 : 900;
  const tw = measure(g, str, size, f, w8) + (icon ? size * 1.05 : 0), w = tw + size * 1.1, h = size * 1.5;
  g.save(); g.globalAlpha *= a * clamp(k * 1.4); g.translate(x, y); g.scale(k, k);
  rr(g, -w / 2, -h / 2, w, h, h / 2); g.fillStyle = bg || 'rgba(22,14,42,.8)'; g.fill(); g.lineWidth = Math.max(2, size * 0.06); g.strokeStyle = line || 'rgba(255,236,210,.4)'; g.stroke();
  let tx = 0; if (icon) { tx = size * 0.5; drawIcon(g, icon, -tw / 2 + size * 0.38, 0, size * 0.5); }
  text(g, str, tx, size * 0.04, { size, font: f, weight: w8, color: color || (gold ? S().ui.gold : '#fff6ea'), spacing: f === FONTS.serif ? 2 : 0.5 });
  g.restore();
}
// small icons for pills/tags: 'check', 'heart', 'star', 'x', 'up', 'down'
export function drawIcon(g, kind, x, y, r) {
  g.save(); g.translate(x, y); g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 'check') { g.strokeStyle = '#5fd39a'; g.lineWidth = r * 0.32; g.beginPath(); g.moveTo(-r * 0.7, 0); g.lineTo(-r * 0.15, r * 0.55); g.lineTo(r * 0.8, -r * 0.6); g.stroke(); }
  if (kind === 'x') { g.strokeStyle = '#ff5a6a'; g.lineWidth = r * 0.32; g.beginPath(); g.moveTo(-r * 0.6, -r * 0.6); g.lineTo(r * 0.6, r * 0.6); g.moveTo(r * 0.6, -r * 0.6); g.lineTo(-r * 0.6, r * 0.6); g.stroke(); }
  if (kind === 'heart') { g.fillStyle = '#ff5a8a'; g.beginPath(); g.moveTo(0, r * 0.8); g.bezierCurveTo(-r * 1.4, -r * 0.2, -r * 0.6, -r * 1.2, 0, -r * 0.45); g.bezierCurveTo(r * 0.6, -r * 1.2, r * 1.4, -r * 0.2, 0, r * 0.8); g.fill(); }
  if (kind === 'star') { g.fillStyle = S().ui.gold; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr2 = i % 2 ? r * 0.45 : r; g.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } g.closePath(); g.fill(); }
  if (kind === 'up' || kind === 'down') { const s = kind === 'up' ? -1 : 1; g.strokeStyle = kind === 'up' ? '#5fd39a' : '#ff5a6a'; g.lineWidth = r * 0.3; g.beginPath(); g.moveTo(0, -s * r); g.lineTo(0, s * r); g.moveTo(-r * 0.6, s * -r * 0.3); g.lineTo(0, -s * r); g.lineTo(r * 0.6, s * -r * 0.3); g.stroke(); }
  g.restore();
}
// "✓ SMARTER" tag (serif in the crush look)
export const tag = (g, o = {}) => pill(g, { icon: 'check', ...o, size: o.size || V(44, 50) * TS(), bg: o.bg || 'rgba(30,18,30,.72)', line: o.line || 'rgba(255,214,150,.55)' });
// counter pill with a heart (crush meter), e.g. heartPill(g, { n: 26, x, y })
export const heartPill = (g, o = {}) => pill(g, { str: String(o.n ?? 3), icon: 'heart', bg: 'rgba(60,14,40,.82)', line: 'rgba(255,120,170,.75)', color: '#ffe0ea', ...o });
// stat card: small spaced label over a big gold number ("TRIES / 1,000")
export function statCard(g, o = {}) {
  const { label = 'TRIES', value = '1,000', x = E.W / 2, y = V(E.H - 220, E.H * 0.72), size = V(72, 84), a = 1, t = null, start = 0 } = o;
  const k = popK(t, start); if (k <= 0.001) return; const f = LF(), w = Math.max(measure(g, value, size, f, 900), size * 3.2) + size * 1.6, h = size * 2.3;
  g.save(); g.globalAlpha *= a * clamp(k * 1.4); g.translate(x, y); g.scale(k, k);
  rr(g, -w / 2, -h / 2, w, h, size * 0.3); g.fillStyle = 'rgba(22,14,42,.82)'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,236,210,.3)'; g.stroke();
  text(g, label, 0, -h * 0.22, { size: size * 0.32, font: f, weight: 900, color: alpha('#fff6ea', 0.85), spacing: 4 });
  text(g, value, 0, h * 0.14, { size, font: f, weight: 900, color: S().ui.gold });
  g.restore();
}
// red roulette-style number ball ("17")
export function numberBall(g, o = {}) { const { n = 17, x, y, r = V(42, 50), color = '#c8303a', t = null, start = 0 } = o; const k = popK(t, start); if (k <= 0.001) return; g.save(); g.translate(x, y); g.scale(k, k); circle(g, 0, 0, r, color); ring(g, 0, 0, r * 0.86, r * 0.08, 'rgba(255,255,255,.55)'); text(g, String(n), 0, r * 0.04, { size: r * 0.95, font: FONTS.ui, weight: 900, color: '#fff' }); g.restore(); }
// letter-spaced heading at the top ("THE RULES", "RULE 3 · IT BALANCES")
export function heading(g, o = {}) { o = sized(o, V(50, 56), V(40, 46)); const { str = 'THE RULES', x = E.W / 2, y = V(120, 240), size = V(46, 54), a = 1, t = null, start = 0, color = '#fff2e2' } = o; const k = t == null ? 1 : ease.out(prog(t, start, start + 0.4)); if (k <= 0) return; const f = LF(); text(g, str, x, y, { size, font: f, weight: f === FONTS.serif ? 700 : 900, color, spacing: 6, alpha: a * k, glow: 10, glowColor: 'rgba(255,200,140,.35)' }); }
// small spaced label under a character ("JAKE", "YOU")
export function nameLabel(g, o = {}) { o = sized(o, V(36, 40), V(30, 34)); const { str = 'YOU', x, y, size = V(32, 38), a = 1, color = '#fff2e2' } = o; const f = LF(); text(g, str, x, y, { size, font: f, weight: f === FONTS.serif ? 700 : 900, color, spacing: 4, alpha: a }); }
// white speech bubble with a tail toward [tx, ty] ("Sir. You're done for tonight.")
export function speech(g, o = {}) {
  o = sized(o, V(42, 46), V(38, 42));
  const { str = 'Hello!', x = E.W / 2, y = 200, tx = null, ty = null, size = V(34, 40), a = 1, t = null, start = 0, maxW = V(620, 700) } = o;
  const k = popK(t, start); if (k <= 0.001) return; const f = FONTS.ui;
  const words = str.split(' '), lines = []; let cur = ''; for (const w of words) { const n = cur ? cur + ' ' + w : w; if (measure(g, n, size, f, 900) > maxW && cur) { lines.push(cur); cur = w; } else cur = n; } lines.push(cur);
  const w = Math.max(...lines.map(l => measure(g, l, size, f, 900))) + size * 1.4, h = lines.length * size * 1.25 + size * 0.8;
  g.save(); g.globalAlpha *= a * clamp(k * 1.4); g.translate(x, y); g.scale(k, k);
  g.fillStyle = '#ffffff'; rr(g, -w / 2, -h / 2, w, h, size * 0.7); g.fill();
  if (tx != null) { const dx = (tx - x) / k, dy = (ty - y) / k, ang = Math.atan2(dy, dx), bx = Math.cos(ang) * w * 0.3, by = Math.sin(ang) * h * 0.3; g.beginPath(); g.moveTo(bx - Math.sin(ang) * size * 0.4, by + Math.cos(ang) * size * 0.4); g.lineTo(bx + Math.cos(ang) * (Math.hypot(dx, dy) * 0.35), by + Math.sin(ang) * (Math.hypot(dx, dy) * 0.35)); g.lineTo(bx + Math.sin(ang) * size * 0.4, by - Math.cos(ang) * size * 0.4); g.fill(); }
  lines.forEach((l, i) => text(g, l, 0, -h / 2 + size * 0.4 + size * 1.25 * (i + 0.5), { size, font: f, weight: 900, color: '#16121e' }));
  g.restore();
}
// stream-chat panel (rounded dark card, coloured names)
export function chatPanel(g, o = {}) {
  const { title = 'STREAM CHAT', lines = [['dev', 'FIRST TRY???'], ['sam', 'HACKS']], x = V(60, 60), y = V(80, 160), w = V(420, 520), size = V(20, 26), t = 0, rate = 0.35 } = o;
  const shown = lines.slice(0, Math.max(1, Math.floor(t / rate) + 1)), h = size * 2.2 + shown.length * size * 1.45, cols = ['#ffb35a', '#5ad0ff', '#ff6ac8', '#7aff9a', '#c8a8ff'];
  g.save(); rr(g, x, y, w, h, size * 0.6); g.fillStyle = 'rgba(16,12,30,.82)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; g.stroke();
  text(g, title, x + w / 2, y + size * 1.1, { size: size * 0.8, font: FONTS.ui, weight: 900, color: 'rgba(255,255,255,.7)', spacing: 3 });
  shown.forEach(([n, m], i) => { const yy = y + size * 2.4 + i * size * 1.45; text(g, n + ':', x + size, yy, { size, font: FONTS.ui, weight: 900, color: cols[i % cols.length], align: 'left' }); text(g, m, x + size + measure(g, n + ': ', size, FONTS.ui, 900), yy, { size, font: FONTS.ui, weight: 800, color: '#fff', align: 'left' }); });
  g.restore();
}
// end screen row: thumbs-up circle + SUBSCRIBED pill + "MORE WHAT IFS" heading (put the 3D cast below it)
export function subscribeRow(g, o = {}) {
  const { y = V(E.H * 0.3, E.H * 0.3), t = 0, label = 'MORE WHAT IFS', done = false } = o; const k = ease.outBack(prog(t, 0.2, 0.6));
  g.save(); g.translate(E.W / 2 - V(190, 150), y); g.scale(k * 1.4, k * 1.4); circle(g, 0, 0, V(46, 52), '#2f6fe0'); g.fillStyle = '#fff'; rr(g, -18, -6, 14, 32, 4); g.fill(); rr(g, -2, -22, 26, 48, 8); g.fill(); g.restore();
  if (done) pill(g, { str: 'SUBSCRIBED', icon: 'check', x: E.W / 2 + V(150, 120), y, size: V(42, 48), t, start: 0.35, bg: 'rgba(120,120,140,.85)', line: 'rgba(255,255,255,.5)' });
  else pill(g, { str: 'SUBSCRIBE', x: E.W / 2 + V(150, 120), y, size: V(46, 52), t, start: 0.35, bg: '#e0303a', line: 'rgba(255,255,255,.6)', color: '#ffffff' });
  heading(g, { str: label, y: y + V(150, 170), t, start: 0.6, size: V(40, 46) });
}
