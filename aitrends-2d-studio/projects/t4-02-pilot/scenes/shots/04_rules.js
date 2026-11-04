// shots/04_rules.js — the rules (blueprint), "tomorrow keeps count" (tally), 46 per day (data card), +1 DAY.
import { E, V, S, registerShot, layer, blurLayer, veil, ease, prog, clamp, lerp, wordTime, seg, circle, ring, rr, poly, glow, alpha, text, FONTS } from '/engine/core.js';
import { bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { bedroom, PHONE_BLUE } from '../sets/bedroom.js';
import { TAG } from '../sets/phoneui.js';
import { phoneShot } from './01_night.js';
import { MAYA } from '../cast.js';

const lt = (info, word, fb) => { const w = wordTime(word, info.shot.start - 0.2); return w == null || w > info.shot.end ? fb : w - info.shot.start; };
const BP = () => UI.bpStroke(), GOLD = () => S().ui.gold, CREAM = () => S().ui.cream;

function bpClock(g, x, y, r, p, label) {                 // line-art clock at 11:59
  ring(g, x, y, r, 4, alpha(BP(), 0.9));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; seg(g, [[x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82], [x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92]], 3, alpha(BP(), 0.7)); }
  const hA = -Math.PI / 2 - 0.02, mA = -Math.PI / 2 - 0.105 * p;
  seg(g, [[x, y], [x + Math.cos(hA) * r * 0.5, y + Math.sin(hA) * r * 0.5]], 7, GOLD()); seg(g, [[x, y], [x + Math.cos(mA) * r * 0.78, y + Math.sin(mA) * r * 0.78]], 4, GOLD());
  circle(g, x, y, 7, GOLD()); if (label) text(g, label, x, y + r + 50, { size: V(40, 44), font: FONTS.ui, weight: 900, color: GOLD(), glow: 12, glowColor: alpha(GOLD(), 0.6) });
}
function bpPhone(g, x, y, h, a = 1) {                      // line-art phone outline; returns screen rect
  const w = h * 0.5; g.save(); g.globalAlpha *= a;
  rr(g, x - w / 2, y - h / 2, w, h, w * 0.14); g.strokeStyle = BP(); g.lineWidth = 4; g.stroke();
  rr(g, x - w * 0.16, y - h / 2 + 14, w * 0.32, 18, 9); g.stroke(); g.restore();
  return { x: x - w / 2 + 18, y: y - h / 2 + 60, w: w - 36 };
}
function bpCard(g, x, y, w, h, a = 1, fill = 0.08) { g.save(); g.globalAlpha *= a; rr(g, x, y, w, h, 14); g.fillStyle = alpha(BP(), fill); g.fill(); g.strokeStyle = alpha(BP(), 0.9); g.lineWidth = 2.5; g.stroke(); g.restore(); }

// s018 — "Here's the rule."
registerShot('s018', { draw(g, t, info) { UI.blueprint(g); UI.bigLine(g, t, { str: 'THE RULE', dur: info.dur + 0.5, y: E.H / 2 }); } });

// s019 — "Every night at 11:59, tomorrow's notifications land on your lock screen."
registerShot('s019', { draw(g, t, info) {
  UI.blueprint(g);
  const z = 1 + 0.04 * ease.inOut(t / info.dur); g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2);
  const cx = E.W * V(0.3, 0.5), cy = E.H * V(0.48, 0.3), px = E.W * V(0.7, 0.5), py = E.H * V(0.5, 0.7);
  const tClock = lt(info, '11:59', 0.6), tLand = lt(info, 'land', 3.0), tLock = lt(info, 'lock', 4.0);
  bpClock(g, cx, cy, V(150, 140), ease.inOut(prog(t, 0, tClock + 0.6)), ease.out(prog(t, tClock, tClock + 0.3)) > 0 ? '11:59 PM' : null);
  const ar = ease.inOut(prog(t, tClock + 0.4, tLand));
  if (ar > 0) { const x0 = cx + V(220, 0), y0 = cy + V(0, 210), x1 = lerp(x0, px - V(200, 0), ar), y1 = lerp(y0, py - V(0, 330), ar);
    g.setLineDash([14, 12]); seg(g, [[x0, y0], [x1, y1]], 4, alpha(BP(), 0.9)); g.setLineDash([]); if (ar > 0.95) poly(g, E.vertical ? [[x1 - 16, y1 - 20], [x1 + 16, y1 - 20], [x1, y1]] : [[x1 - 20, y1 - 16], [x1 - 20, y1 + 16], [x1, y1]], BP()); }
  const sc = bpPhone(g, px, py, V(560, 520), ease.out(prog(t, 0.2, 0.8)));
  for (let i = 0; i < 4; i++) { const d = ease.outBack(prog(t, tLand + i * 0.25, tLand + i * 0.25 + 0.4)); if (d > 0) bpCard(g, sc.x, sc.y + 40 + i * 92 - (1 - d) * 60, sc.w, 76, clamp(d)); }
  const la = ease.out(prog(t, tLock, tLock + 0.4)); if (la > 0) text(g, 'LOCK SCREEN', px, py + V(330, 310), { size: V(34, 36), font: FONTS.ui, weight: 900, color: CREAM(), alpha: la, spacing: 4 });
  g.restore();
} });

// s020 — "The time. The sender. The first forty characters."
registerShot('s020', { draw(g, t, info) {
  UI.blueprint(g);
  const w = V(1100, 900), h = V(200, 200), x = (E.W - w) / 2, y = E.H * 0.42 - h / 2;
  bpCard(g, x, y, w, h, ease.out(prog(t, 0, 0.4)), 0.1);
  rr(g, x + 30, y + 40, 120, 120, 26); g.strokeStyle = BP(); g.lineWidth = 3; g.stroke();
  seg(g, [[x + 190, y + 70], [x + 420, y + 70]], 10, alpha(CREAM(), 0.8));                 // sender line
  const chars = 'hey are you going to the', n = Math.round(clamp(prog(t, lt(info, 'forty', 2.2), lt(info, 'forty', 2.2) + 1.0)) * chars.length);
  text(g, chars.slice(0, Math.max(n, 0)) + (n >= chars.length ? '…' : ''), x + 190, y + 130, { size: V(40, 38), font: FONTS.ui, weight: 800, color: alpha(CREAM(), 0.85), align: 'left' });
  rr(g, x + w - 300, y + 40, 260, 50, 25); g.strokeStyle = TAG; g.lineWidth = 3; g.stroke();
  text(g, 'TOMORROW · 9:47 PM', x + w - 170, y + 66, { size: V(20, 20), font: FONTS.ui, weight: 900, color: TAG });
  UI.callout(g, t, { at: [x + w - 170, y + 40], to: [x + w - 60, y - V(150, 170)], str: 'THE TIME', start: lt(info, 'time', 0.2) });
  UI.callout(g, t, { at: [x + 300, y + 60], to: [x + 220, y - V(150, 170)], str: 'THE SENDER', start: lt(info, 'sender', 1.2) });
  UI.callout(g, t, { at: [x + 520, y + h - 50], to: [x + 640, y + h + V(150, 170)], str: 'FIRST 40 CHARACTERS', color: GOLD(), start: lt(info, 'forty', 2.2) });
} });

// s021 — "You can't open them. You can't reply."
registerShot('s021', { draw(g, t, info) {
  UI.blueprint(g);
  const w = V(1000, 860), h = V(320, 320), x = (E.W - w) / 2, y = E.H * 0.46 - h / 2;
  bpCard(g, x, y, w, h, 1, 0.08);
  for (let i = 0; i < 4; i++) seg(g, [[x + 60, y + 70 + i * 50], [x + w - 60 - (i === 3 ? 260 : 0), y + 70 + i * 50]], 10, alpha(CREAM(), 0.35));
  const tL = lt(info, 'open', 0.3), k = ease.outBack(prog(t, tL, tL + 0.35));
  if (k > 0) { g.save(); g.translate(E.W / 2, y + h / 2 - 10); g.scale(k, k);
    rr(g, -80, -20, 160, 130, 18); g.fillStyle = alpha(GOLD(), 0.15); g.fill(); g.strokeStyle = GOLD(); g.lineWidth = 6; g.stroke();
    g.beginPath(); g.arc(0, -20, 56, Math.PI, 0); g.strokeStyle = GOLD(); g.lineWidth = 12; g.stroke(); circle(g, 0, 40, 14, GOLD()); g.restore(); }
  const tR = lt(info, 'reply', 1.8), bx = E.W / 2, by = y + h + V(110, 120);
  rr(g, bx - 140, by - 40, 280, 80, 40); g.strokeStyle = BP(); g.lineWidth = 3; g.stroke();
  text(g, 'REPLY', bx, by, { size: V(34, 34), font: FONTS.ui, weight: 900, color: CREAM(), spacing: 3 });
  const xr = ease.out(prog(t, tR, tR + 0.3)); if (xr > 0) { seg(g, [[bx - 160, by - 50], [lerp(bx - 160, bx + 160, xr), lerp(by - 50, by + 50, xr)]], 8, TAG); }
} });

// s022 — "And you'll learn the hard way: tomorrow keeps count."  tally etches in
registerShot('s022', { draw(g, t, info) {
  const tc = lt(info, 'keeps', 2.0);
  phoneShot(g, t, info, { z0: 0.78, dz: 0.08, roll: 0.02, phone: { cards: [], stamp: 1, glowA: 0.6, tally: prog(t, tc - 0.1, tc + 0.5), dim: 0.1 } });
} });

// s023 — "One industry study found the average American gets about 46 push notifications a day."
registerShot('s023', { draw(g, t, info) {
  UI.blueprint(g, { a: 0.05 });
  const t46 = lt(info, '46', 4.0);
  UI.dataCard(g, t, { title: 'AVERAGE AMERICAN', subtitle: 'PUSH NOTIFICATIONS PER DAY · INDUSTRY STUDY', from: 0, to: 46, decimals: 0, unit: '', start: Math.max(0.6, t46 - 2.2), dur: 2.2, labels: [[0.5, '23'], [1, '46']], total: info.dur });
} });

// s024 — "You get yours a day early."  bigFace smirk + badge
registerShot('s024', { draw(g, t, info) {
  blurLayer(g, 14, (g) => bedroom(g, t, { z: 1.6, x: V(500, 300), y: -220 }, { clock: '11:59', phoneGlow: 1 })); veil(g, '#05040b', 0.45);
  const r = V(300, 330) * (1 + 0.04 * t), cx = E.W / 2 + V(60, 0), cy = E.H * V(0.6, 0.55);
  glow(g, cx, cy + r * 1.2, r * 2.2, PHONE_BLUE, 0.4);
  bigFace(g, cx, cy, r, { outfit: MAYA, expr: 'smirk', look: [-0.2, 0.5], rimColor: PHONE_BLUE, rimSide: 1, blink: (t % 2.9) > 2.8 });
  UI.badge(g, { str: '+1 DAY', a: ease.out(prog(t, lt(info, 'early', 0.6), lt(info, 'early', 0.6) + 0.3)) });
} });
