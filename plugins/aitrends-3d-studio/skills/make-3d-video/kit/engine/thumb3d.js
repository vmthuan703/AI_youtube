// engine/thumb3d.js — 1.0.3 thumbnail overlays for 3D shots, following the channel's data rules (AI_youtube prompts/thumbnail_style.md):
// smug hero, the video's rule shown as a game UI layer (labels over heads, HP / stat bars, a LEVEL panel), someone reacting, a bright
// set, at most one big phrase of 3 words or fewer. Font Fredoka 700; outline #241a3a; lime #b4f02e; yellow #ffe14a; UI green
// #3ddc5a; UI red #ee3b2f; dark label #14102a; white text always has a dark outline. Labels: solid fill, 8 px border, 18 px
// corners, a pointer at the person (sizes are for 1280×720 and scale with the frame).
//
// In a shot:  overlay(g, t, info, st) { const T3 = st.T; T3.thumb.tagOn(g, st.kid, st.st.camera, 'CRUSH', { bg: '#ee3b2f' }); }
//   tag(g, str, x, y, o)            a label whose pointer tip is at (x, y)  o: { bg, fg, size, up (pointer on top) }
//   tagOn(g, ch, camera, str, o)    the same, riding above a character's head (o.lift metres above the head)
//   bar(g, x, y, w, k, o)           an HP / stat bar, k 0..1  o: { label, value, color, h }
//   big(g, str, x, y, o)            the one big phrase (warns in the console past 3 words)  o: { size, color }
//   panel(g, x, y, o)               a game panel: o.title ('LEVEL'), o.value ('99'), o.sub, o.w, o.color
//   Render: node render.mjs --project P --thumbs  →  build/thumbs/<shot>.jpg (1280×720) + grid.jpg (2×2) for picking.
import { text, clamp } from './core.js';
import { toScreen } from './kit3d.js';

export const TH = { line: '#241a3a', lime: '#b4f02e', yellow: '#ffe14a', green: '#3ddc5a', red: '#ee3b2f', dark: '#14102a', font: 'Fredoka' };
const K = 1920 / 1280;   // the rules are written for 1280×720; the overlay canvas is 1920×1080 logical units

function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const measure = (g, str, size) => { g.save(); g.font = `700 ${size}px "${TH.font}"`; const w = g.measureText(str).width; g.restore(); return w; };

export function tag(g, str, x, y, o = {}) {
  const size = (o.size || 46) * K, pad = size * 0.42, w = measure(g, str, size) + pad * 2, h = size * 1.32, bw = 8 * K, r = 18 * K, tip = size * 0.42;
  const up = !!o.up, m = 14 * K; if (!up && y - tip - h < m) y = m + tip + h; if (up && y + tip + h > 1080 - m) y = 1080 - m - tip - h;   // keep the label inside the frame
  x = Math.min(Math.max(x, w / 2 + m), 1920 - w / 2 - m); const bx = x - w / 2, by = up ? y + tip : y - tip - h;
  g.save(); g.lineJoin = 'round';
  rr(g, bx, by, w, h, r); g.moveTo(x - tip * 0.8, up ? by : by + h); g.lineTo(x, y); g.lineTo(x + tip * 0.8, up ? by : by + h);
  g.fillStyle = o.bg || TH.dark; g.strokeStyle = TH.line; g.lineWidth = bw * 2; g.stroke(); g.fill();
  text(g, str, x, by + h / 2 + size * 0.04, { size, font: TH.font, weight: 700, color: o.fg || '#ffffff', stroke: size * 0.16, strokeColor: TH.line });
  g.restore(); return { x: bx, y: by, w, h };
}
export function tagOn(g, ch, camera, str, o = {}) {
  const p = ch.headWorld(); p.y += o.lift ?? 0.55 * (ch.scale?.y || 1);
  const [x, y, z] = toScreen(p, camera); if (z > 1) return null; return tag(g, str, x, y, o);
}
export function bar(g, x, y, w, k, o = {}) {
  const h = (o.h || 30) * K, r = h / 2, bw = 6 * K, col = o.color || (k > 0.5 ? TH.green : k > 0.25 ? TH.yellow : TH.red);
  g.save(); rr(g, x, y, w, h, r); g.fillStyle = TH.dark; g.strokeStyle = TH.line; g.lineWidth = bw * 2; g.stroke(); g.fill();
  const iw = Math.max(h, (w - bw * 2) * clamp(k)); rr(g, x + bw, y + bw, iw, h - bw * 2, (h - bw * 2) / 2); g.fillStyle = col; g.fill();
  g.globalAlpha = 0.35; rr(g, x + bw, y + bw, iw, (h - bw * 2) * 0.4, (h - bw * 2) / 4); g.fillStyle = '#ffffff'; g.fill(); g.globalAlpha = 1;
  if (o.label) text(g, o.label, x, y - h * 0.75, { size: h * 1.05, font: TH.font, weight: 700, color: '#ffffff', align: 'left', stroke: h * 0.2, strokeColor: TH.line });
  if (o.value) text(g, o.value, x + w, y - h * 0.75, { size: h * 1.05, font: TH.font, weight: 700, color: o.valueColor || TH.yellow, align: 'right', stroke: h * 0.2, strokeColor: TH.line });
  g.restore();
}
export function big(g, str, x, y, o = {}) {
  if (String(str).trim().split(/\s+/).length > 3) console.log('thumb3d: big phrase longer than 3 words: ' + str);
  const size = (o.size || 120) * K; text(g, str, x, y, { size, font: TH.font, weight: 700, color: o.color || '#ffffff', stroke: size * 0.2, strokeColor: TH.line, glow: size * 0.2, glowColor: 'rgba(0,0,0,.35)' });
}
export function panel(g, x, y, o = {}) {
  const w = (o.w || 330) * K, h = (o.h || 190) * K, bw = 8 * K;
  g.save(); rr(g, x, y, w, h, 22 * K); g.fillStyle = 'rgba(20,16,42,.92)'; g.strokeStyle = TH.line; g.lineWidth = bw * 2; g.stroke(); g.fill();
  rr(g, x + bw * 1.6, y + bw * 1.6, w - bw * 3.2, h - bw * 3.2, 16 * K); g.strokeStyle = o.color || TH.lime; g.lineWidth = 4 * K; g.stroke();
  text(g, o.title || 'LEVEL', x + w / 2, y + h * 0.27, { size: h * 0.2, font: TH.font, weight: 700, color: o.color || TH.lime, stroke: h * 0.035, strokeColor: TH.line, spacing: 4 });
  text(g, String(o.value ?? '99'), x + w / 2, y + h * 0.63, { size: h * 0.42, font: TH.font, weight: 700, color: '#ffffff', stroke: h * 0.07, strokeColor: TH.line });
  if (o.sub) text(g, o.sub, x + w / 2, y + h * 0.88, { size: h * 0.12, font: TH.font, weight: 700, color: TH.yellow });
  g.restore();
}
