// sets/phoneui.js — the video's signature graphic: the lock screen and the TOMORROW notification card.
// Every future notification uses notifCard() so the motif stays identical all video.
import { E, V, S, rr, circle, seg, glow, alpha, shade, mix, text, measure, FONTS, ease, prog, clamp } from '/engine/core.js';

export const TAG = '#ff6b5a';            // coral TOMORROW tag (ui.accent family)
export const GLASS = '#151a2c';
const ICON = { mom: '#3a6ea5', school: '#f2c21a', teacher: '#ebe7f0', weather: '#7fd0d6', friend: '#3fb950', app: '#8a5ad6' };

// one notification card. o: {tag, time, sender, msg, icon, a, s, stamp(0..1), wide}
export function notifCard(g, x, y, w, o = {}) {
  const s = o.s ?? 1, h = 96 * s, a = o.a ?? 1; if (a <= 0) return h;
  g.save(); g.globalAlpha *= a;
  rr(g, x, y, w, h, 20 * s); g.fillStyle = alpha(GLASS, 0.92); g.fill();
  g.strokeStyle = alpha('#ffffff', 0.08); g.lineWidth = 2 * s; g.stroke();
  const ic = ICON[o.icon] || ICON.app;
  rr(g, x + 18 * s, y + 20 * s, 56 * s, 56 * s, 14 * s); g.fillStyle = ic; g.fill();
  circle(g, x + 46 * s, y + 48 * s, 12 * s, alpha('#0c0a12', 0.55));
  const tx = x + 92 * s;
  text(g, o.sender || 'Mom', tx, y + 34 * s, { size: 26 * s, font: FONTS.ui, weight: 900, color: '#f2efe8', align: 'left' });
  text(g, o.msg || '', tx, y + 68 * s, { size: 23 * s, font: FONTS.ui, weight: 700, color: alpha('#f2efe8', 0.72), align: 'left' });
  const st = clamp(o.stamp ?? 1);
  const tagStr = o.tag || ('TOMORROW · ' + (o.time || '7:02 AM'));
  if (st > 0) {
    const ts = (o.compact ? 13 : 17) * s, tw = measure(g, tagStr, ts, FONTS.ui, 900) + 24 * s, k = ease.outBack(st), tx2 = x + w - 16 * s - tw;
    g.save(); g.translate(tx2 + tw / 2, y + 30 * s); g.scale(k, k); g.rotate(-0.04 * (1 - st));
    rr(g, -tw / 2, -ts * 0.95, tw, ts * 1.9, ts * 0.95); g.fillStyle = alpha(TAG, 0.18); g.fill(); g.strokeStyle = TAG; g.lineWidth = 2 * s; g.stroke();
    text(g, tagStr, 0, 1 * s, { size: ts, font: FONTS.ui, weight: 900, color: TAG, spacing: 1, glow: 8, glowColor: alpha(TAG, 0.6) });
    g.restore();
  } else text(g, o.time || 'now', x + w - 24 * s, y + 30 * s, { size: 18 * s, font: FONTS.ui, weight: 800, color: alpha('#f2efe8', 0.5), align: 'right' });
  g.restore(); return h;
}

// a phone (portrait) centred at cx,cy with height h. o: {time, date, cards[], scroll, stamp, glowA, tally, dim, faceDown}
export function phone(g, cx, cy, h, t, o = {}) {
  const w = h * 0.49, x = cx - w / 2, y = cy - h / 2, r = w * 0.14;
  glow(g, cx, cy, h * 0.95, '#8fd3ff', 0.22 * (o.glowA ?? 1));
  rr(g, x - w * 0.04, y - w * 0.04, w * 1.08, h + w * 0.08, r * 1.1); g.fillStyle = '#07060b'; g.fill();
  if (o.faceDown) { g.strokeStyle = alpha('#9fb0ff', 0.25); g.lineWidth = 3; g.stroke(); circle(g, x + w * 0.22, y + w * 0.22, w * 0.08, '#141220'); return; }
  g.save(); rr(g, x, y, w, h, r); g.clip();
  const bg = g.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, '#1a2550'); bg.addColorStop(0.55, '#2a2a5a'); bg.addColorStop(1, '#4a2f55');
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  glow(g, cx, y + h * 0.75, w * 0.9, '#ff8a6a', 0.15);
  const k = w / 400;                                                // design units: phone width = 400
  text(g, o.date || 'Thursday, November 5', cx, y + 92 * k, { size: 20 * k, font: FONTS.ui, weight: 800, color: alpha('#f2efe8', 0.8) });
  text(g, o.time || '11:59', cx, y + 158 * k, { size: 92 * k, font: FONTS.ui, weight: 900, color: '#f2efe8' });
  const cards = o.cards || [], scroll = o.scroll ?? 0;
  let yy = y + 236 * k - scroll * k;
  cards.forEach((c, i) => {
    const appear = c.at == null ? 1 : ease.out(prog(t, c.at, c.at + 0.35));
    if (appear > 0 && yy < y + h) notifCard(g, x + 14 * k, yy + (1 - appear) * 30 * k, w - 28 * k, { ...c, compact: true, s: k * 0.9, a: appear, stamp: o.stamp == null ? 1 : clamp((o.stamp - i * 0.12) * 3) });
    yy += 100 * k;
  });
  if (o.tally) { const ta = clamp(o.tally); g.save(); g.globalAlpha *= ta; for (let i = 0; i < 1; i++) seg(g, [[x + w - 70 * k, y + 110 * k], [x + w - 70 * k, y + 110 * k + 70 * k * ta]], 9 * k, TAG); glow(g, x + w - 70 * k, y + 145 * k, 90 * k, TAG, 0.55 * ta); g.restore(); }
  if (o.dim) { g.fillStyle = alpha('#000', o.dim); g.fillRect(x, y, w, h); }
  g.restore();
  rr(g, cx - w * 0.16, y + 14 * k, w * 0.32, 26 * k, 13 * k); g.fillStyle = '#07060b'; g.fill();   // camera notch
}

export const DAY0_CARDS = [
  { sender: 'Mom', msg: "Don't forget your lunch", time: '7:02 AM', icon: 'mom' },
  { sender: 'School alert', msg: 'Fire drill', time: '10:15 AM', icon: 'school' },
  { sender: 'Jordan', msg: 'bring my charger pls', time: '12:30 PM', icon: 'friend' },
  { sender: 'Weather', msg: 'Clear, 61°', time: '2:00 PM', icon: 'weather' },
  { sender: 'Ava', msg: 'lol same', time: '4:48 PM', icon: 'app' },
  { sender: 'School', msg: 'Grades posted', time: '6:10 PM', icon: 'school' },
];
