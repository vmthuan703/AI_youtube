// shots/05_dayone.js — Day one: Mr. Okafor's pop quiz, studying twice, the forgetting curve, 20/20, Jordan.
import { E, V, S, registerShot, mood, layer, blurLayer, veil, ease, prog, clamp, lerp, shake, wordTime, talkAmount, seg, circle, rr, glow, alpha, text, FONTS } from '/engine/core.js';
import { drawFigure, POSES, breathe, bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { bedroom, bedGround, digitalClock, PHONE_BLUE } from '../sets/bedroom.js';
import { classroom } from '../sets/school.js';
import { notifCard, phone, DAY0_CARDS } from '../sets/phoneui.js';
import { phoneShot, mayaInBed } from './01_night.js';
import { MAYA, JORDAN } from '../cast.js';

const lt = (info, word, fb) => { const w = wordTime(word, info.shot.start - 0.2); return w == null || w > info.shot.end ? fb : w - info.shot.start; };
const QUIZ = { sender: 'Mr. Okafor', msg: 'Pop quiz, chapter seven', time: '8:05 AM', icon: 'teacher' };
const BOOK = '#2f6f5a';
function textbook(g, x, y, s, open = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  rr(g, -70, -46, 140, 92, 6); g.fillStyle = shade2(BOOK); g.fill();
  if (open) { rr(g, -64, -40, 62, 80, 3); g.fillStyle = '#e9e4d8'; g.fill(); rr(g, 2, -40, 62, 80, 3); g.fill();
    g.fillStyle = 'rgba(40,40,60,.45)'; for (let i = 0; i < 6; i++) { g.fillRect(-56, -30 + i * 11, 46, 3); g.fillRect(10, -30 + i * 11, 46, 3); }
    text(g, '7', -33, 28, { size: 16, font: FONTS.ui, weight: 900, color: '#2a2a40' }); }
  g.restore();
}
const shade2 = (c) => c;

// s025 — "Day one. Tomorrow, 8:05 a.m."  bedroom night, DAY 1 badge, phone lights on the nightstand
registerShot('s025', { draw(g, t, info) {
  const cam = { z: 1.15 + 0.06 * ease.inOut(t / info.dur), x: V(120, 80) };
  const { GY, M, bedX } = bedroom(g, t, cam, { clock: '11:59', phoneGlow: ease.out(prog(t, 0.4, 1.0)) });
  layer(g, cam, 1, (g) => mayaInBed(g, t, GY, bedX, M, { mode: 'prop', expr: 'determined', prop: t > 0.8 ? 'phone' : null }));
  UI.badge(g, { str: 'DAY 1', a: ease.out(prog(t, 0.05, 0.4)) });
  FX.dust(g, t, { count: 24, color: '#cfd8ff', a: 0.2 });
} });

// s026 — "Mr. Okafor posted: Pop quiz, chapter seven."  big TOMORROW card
registerShot('s026', { draw(g, t, info) {
  phoneShot(g, t, info, { z0: 1.0, dz: 0.03, phone: { cards: [QUIZ, ...DAY0_CARDS.slice(0, 4)], stamp: 1, scroll: 40, dim: 0.55 } });
  const a = ease.outBack(prog(t, 0.05, 0.45)), w = V(1100, 920), x = (E.W - w) / 2, y = E.H * 0.42;
  glow(g, E.W / 2, y + 90, w * 0.6, PHONE_BLUE, 0.25 * a);
  notifCard(g, x, y, w, { ...QUIZ, s: V(1.9, 1.6), a: clamp(a), stamp: 1 });
  const tq = lt(info, 'Pop', 1.0);
  const k = ease.outBack(prog(t, tq, tq + 0.3)); if (k > 0) { g.save(); g.translate(x + w * 0.58, y - V(70, 80)); g.scale(k, k); text(g, 'POP QUIZ!', 0, 0, { size: V(56, 54), font: FONTS.title, weight: 700, color: S().ui.gold, glow: 20, glowColor: alpha(S().ui.gold, 0.6), spacing: 3 }); g.restore(); }
} });

// s027 — "So tonight, you read chapter seven. Twice."  studying under the lamp, 2x badge
registerShot('s027', { draw(g, t, info) {
  const cam = { z: 1.5 + 0.06 * ease.inOut(t / info.dur), x: -V(250, 160), y: -V(40, 140) };
  const { GY, M, bedX } = bedroom(g, t, cam, { clock: '10:58', phoneGlow: 0.5 });
  layer(g, cam, 1, (g) => {
    glow(g, bedX + 260, GY - 260, 300, '#ffd59a', 0.3);                                            // reading lamp glow
    const pose = { ...POSES.sit, hF: [40, -128], eF: [26, -110], hB: [30, -124], eB: [12, -108] };
    drawFigure(g, { x: bedX + 200, y: GY - 26, s: V(1.25, 1.2), facing: 1, outfit: MAYA, pose: breathe(pose, t), expr: 'determined', look: [0.6, 0.6], rim: { color: '#ffd59a', dir: [1, -0.5], w: 4 }, shadow: false });
    textbook(g, bedX + 268, GY - 160, 1.0);
    g.fillStyle = alpha('#2a2e5a', 0.95); g.beginPath(); g.ellipse(bedX + 470, GY - 94, 250, 40, 0, Math.PI, Math.PI * 2); g.fill();
  });
  const tt = lt(info, 'Twice', 2.4); UI.badge(g, { str: '2x', a: ease.out(prog(t, tt, tt + 0.25)) });
  FX.dust(g, t, { count: 30, color: '#ffe2bd', a: 0.25 });
} });

// forgetting-curve board (s028 draws it, s029 adds the YOU line)
function curve(g, t, info, you) {
  UI.blueprint(g); const bp = UI.bpStroke(), gold = S().ui.gold, cream = S().ui.cream;
  const x0 = V(300, 140), x1 = E.W - V(260, 120), y0 = E.H * V(0.78, 0.66), y1 = E.H * V(0.24, 0.3);
  seg(g, [[x0, y1 - 20], [x0, y0], [x1, y0]], 3, alpha(bp, 0.8));
  text(g, 'MEMORY', x0 - 20, y1 - 50, { size: V(28, 30), font: FONTS.ui, weight: 900, color: alpha(cream, 0.8), align: 'left', spacing: 3 });
  text(g, '1 DAY', x0 + (x1 - x0) * 0.5, y0 + 50, { size: V(30, 32), font: FONTS.ui, weight: 900, color: gold });
  seg(g, [[x0 + (x1 - x0) * 0.5, y0 - 10], [x0 + (x1 - x0) * 0.5, y0 + 10]], 3, gold);
  const p = you ? 1 : ease.inOut(prog(t, 0.5, lt(info, 'day', 3.2) + 0.3));
  const f = (u) => y1 + (y0 - y1) * 0.85 * (1 - Math.exp(-u * 4.5));
  g.strokeStyle = '#ff8a7a'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath();
  for (let i = 0; i <= 100 * p; i++) { const u = i / 100, x = lerp(x0, x1, u); i ? g.lineTo(x, f(u)) : g.moveTo(x, f(u)); } g.stroke();
  if (p > 0.02) { const u = p; glow(g, lerp(x0, x1, u), f(u), 50, '#ff8a7a', 0.7); }
  if (you) {
    const tl = lt(info, 'forgetting', 0.4); UI.bigLine(g, t - tl + 0.4, { str: 'THE FORGETTING CURVE', dur: 99, y: E.H * V(0.12, 0.16), size: V(58, 52) });
    const q = ease.inOut(prog(t, 0.6, 1.8)); g.strokeStyle = gold; g.lineWidth = 7; g.beginPath();
    for (let i = 0; i <= 100 * q; i++) { const u = i / 100, x = lerp(x0, x1, u), y = y1 + 30 + Math.sin(u * 9) * 6; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    if (q > 0.95) text(g, 'YOU', x1 + 10, y1 + 30, { size: V(36, 36), font: FONTS.ui, weight: 900, color: gold, align: 'left', glow: 14, glowColor: alpha(gold, 0.6) });
  }
}
registerShot('s028', { draw(g, t, info) { curve(g, t, info, false); } });
registerShot('s029', { draw(g, t, info) { curve(g, t, info, true); } });

// s030 — "You reviewed at eleven p.m."  insert: the red clock 11:00 beside the open textbook
registerShot('s030', { draw(g, t, info) {
  blurLayer(g, 12, (g) => bedroom(g, t, { z: 2.2, x: -V(700, 420), y: -260 }, { clock: '11:00' })); veil(g, '#07060f', 0.35);
  const cx = E.W * 0.5, cy = E.H * V(0.6, 0.58), z = 1 + 0.06 * ease.inOut(t / info.dur);
  g.save(); g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy);
  g.fillStyle = '#120f1c'; g.fillRect(-E.W, cy + V(60, 80), E.W * 3, E.H);
  glow(g, cx + V(260, 150), cy - 80, 380, '#ffd59a', 0.25);
  digitalClock(g, cx - V(300, 200), cy + V(10, 20), V(2.4, 2.0), '11:00');
  textbook(g, cx + V(280, 170), cy + V(30, 40), V(2.4, 2.0));
  g.restore();
} });

// s031 — "Twenty out of twenty."  quiz paper slams down, red 20/20
registerShot('s031', { draw(g, t, info) {
  blurLayer(g, 12, (g) => classroom(g, t, { z: 1.6, x: 200, y: 120 })); veil(g, '#0a0710', 0.3);
  const land = 0.22, d = ease.out(prog(t, 0, land)), [sx, sy] = t > land ? shake(t, 8 * (1 - prog(t, land, land + 0.5)), 30) : [0, 0];
  const cx = E.W / 2 + sx, cy = lerp(-E.H * 0.4, E.H * 0.52, d) + sy, rot = lerp(-0.4, -0.06, d);
  g.save(); g.translate(cx, cy); g.rotate(rot);
  rr(g, -V(330, 300), -V(420, 400), V(660, 600), V(840, 800), 8); g.fillStyle = '#efeae0'; g.fill();
  text(g, 'CHEM · CH. 7 QUIZ', -V(280, 250), -V(350, 330), { size: V(34, 32), font: FONTS.ui, weight: 900, color: '#2a2a40', align: 'left' });
  for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(40,40,60,.35)'; g.fillRect(-V(280, 250), -V(260, 240) + i * 62, V(380, 340), 5); seg(g, [[V(160, 140), -V(270, 250) + i * 62], [V(180, 160), -V(250, 230) + i * 62], [V(215, 195), -V(290, 270) + i * 62]], 6, '#d0342c'); }
  const k = ease.outBack(prog(t, land + 0.15, land + 0.5));
  if (k > 0) { g.save(); g.translate(V(130, 110), V(330, 310)); g.scale(k, k); g.rotate(-0.12);
    text(g, '20/20', 0, 0, { size: V(120, 110), font: FONTS.title, weight: 700, color: '#d0342c' }); g.restore(); }
  g.restore();
  if (t > land) FX.rings(g, E.W / 2, E.H * 0.52, t - land, { count: 2, r0: 200, r1: 700, speed: 1.4, color: '#fff3e0', a: 0.4 * (1 - prog(t, land, land + 1)) });
} });

// s032 — "You studied? On purpose?"  Jordan's giant face, lip-synced
registerShot('s032', { draw(g, t, info) {
  blurLayer(g, 14, (g) => classroom(g, t, { z: 1.5, x: -260, y: -120 })); veil(g, '#0a0710', 0.35);
  const M = mood('interiorWarm'), r = V(290, 320) * (1 + 0.03 * t), cx = E.W / 2 + V(120, 0), cy = E.H * V(0.6, 0.55);
  const talk = talkAmount(info.globalT, 88.40, 90.45);
  bigFace(g, cx, cy, r, { outfit: JORDAN, expr: t < 1.0 ? 'shocked' : 'surprised', talk, rimColor: M.rim, rimSide: 1, blink: (t % 2.9) > 2.8 });
  if (talk > 0) FX.rings(g, cx, cy, t, { count: 3, r0: r * 1.1, r1: r * 1.6, color: '#fff3e0', a: 0.35 });
} });
