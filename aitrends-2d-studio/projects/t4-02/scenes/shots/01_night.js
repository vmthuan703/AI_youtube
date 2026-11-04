// shots/01_night.js — cold open: 11:59, the buzz, the flip, 46 notifications stamped TOMORROW, sleep.
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, shake, wordTime, glow, alpha, text, FONTS } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { bedroom, bedGround, digitalClock, PHONE_BLUE } from '../sets/bedroom.js';
import { phone, notifCard, DAY0_CARDS } from '../sets/phoneui.js';
import { MAYA } from '../cast.js';

const lieRest = { ...POSES.lie };
// Maya in bed. mode: 'lie' | 'prop' (up on an elbow, looking at the phone)
export function mayaInBed(g, t, GY, bedX, M, o = {}) {
  const s = V(1.25, 1.2), top = GY - 96;
  const rim = { color: M.rim, dir: [-1, -0.4], w: 4 };
  if (o.mode === 'prop') {
    const pose = { ...POSES.sit, hF: [44, -150], eF: [30, -118], hB: [-30, -80], eB: [-26, -110] };
    drawFigure(g, { x: bedX + 200, y: top + 70, s, facing: 1, outfit: MAYA, pose: breathe(pose, t), expr: o.expr || 'sleepy', look: [1, 0.2], rim, shadow: false, prop: o.prop, blink: (t % 3.4) > 3.3 });
  } else {
    drawFigure(g, { x: bedX + 250, y: top + 44, s, facing: 1, outfit: MAYA, pose: breathe(lieRest, t, 0.4), rot: -Math.PI / 2, expr: o.expr || 'sleepy', blink: true, rim, shadow: false });
  }
  // blanket over the legs
  g.fillStyle = alpha('#2a2e5a', 0.95); g.beginPath(); g.ellipse(bedX + 470, top + 2, 250, 40, 0, Math.PI, Math.PI * 2); g.fill();
}

// s001 — "It's 11:59 p.m."  establishing wide, slow push
registerShot('s001', { draw(g, t, info) {
  const cam = { z: 1 + 0.06 * ease.inOut(t / info.dur), x: 30 - 50 * ease.inOut(t / info.dur) };
  const { GY, M, bedX } = bedroom(g, t, cam, { clock: '11:59' });
  layer(g, cam, 1, (g) => mayaInBed(g, t, GY, bedX, M));
  FX.dust(g, t, { count: 30, color: '#cfd8ff', a: 0.25 });
} });

// shared nightstand insert (s002 face-down, s003 buzz)
function nightstandInsert(g, t, info, buzz) {
  const GY = bedGround();
  blurLayer(g, 12, (g) => bedroom(g, t, { z: 2.2, x: -V(700, 420), y: -260 }, { clock: '11:59' }));
  veil(g, '#07060f', 0.35);
  const cx = E.W * 0.5, cy = E.H * V(0.62, 0.6), z = 1 + 0.05 * ease.inOut(t / info.dur);
  g.save(); g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy);
  g.fillStyle = '#120f1c'; g.fillRect(-E.W, cy + V(60, 80), E.W * 3, E.H);                   // nightstand top
  g.fillStyle = alpha('#a9b8ff', 0.12); g.fillRect(-E.W, cy + V(60, 80), E.W * 3, 4);
  digitalClock(g, cx - V(520, 300), cy + V(10, 20), V(2.2, 1.8), '11:59');
  let dx = 0, dy = 0; if (buzz) { const k = 1 - prog(t, 0.12, 0.9); [dx, dy] = shake(t, 9 * k, 40); }
  g.save(); g.translate(cx + V(120, 60) + dx, cy + V(40, 60) + dy); g.scale(1, 0.32); phone(g, 0, 0, V(520, 460), t, { faceDown: true, glowA: 0 }); g.restore();
  if (buzz) {
    const k = prog(t, 0.12, 1.1);
    glow(g, cx + V(120, 60), cy + V(40, 60), 300, PHONE_BLUE, 0.4 * (1 - k * 0.4));
    FX.rings(g, cx + V(120, 60), cy + V(40, 60), t - 0.12, { count: 3, r0: 140, r1: 380, speed: 1.2, color: '#cfe6ff', a: 0.5 * (1 - k) });
  }
  g.restore();
  FX.dust(g, t, { count: 24, color: '#cfd8ff', a: 0.25 });
}
registerShot('s002', { draw(g, t, info) { nightstandInsert(g, t, info, false); } });
registerShot('s003', { draw(g, t, info) { nightstandInsert(g, t, info, true); } });

// s004 — "You flip it over."  Maya props up, reaches, blue light hits her
registerShot('s004', { draw(g, t, info) {
  const cam = { z: 1.45 + 0.05 * ease.inOut(t / info.dur), x: -V(260, 160), y: -V(60, 160) };
  const flip = prog(t, 0.5, 1.0);
  const { GY, M, bedX, nightstandX } = bedroom(g, t, cam, { clock: '11:59', phoneGlow: flip });
  layer(g, cam, 1, (g) => {
    mayaInBed(g, t, GY, bedX, M, { mode: 'prop', expr: flip > 0.5 ? 'surprised' : 'sleepy', prop: flip > 0.6 ? 'phone' : null });
    if (flip > 0.2) glow(g, bedX + 220, GY - 250, 260, PHONE_BLUE, 0.35 * flip);
  });
  FX.dust(g, t, { count: 24, color: '#cfd8ff', a: 0.25 });
} });

// phone close-up helper (blurred bedroom behind)
export function phoneShot(g, t, info, o = {}) {
  blurLayer(g, 16, (g) => bedroom(g, t, { z: 1.8, x: V(200, 100), y: -200 }, { clock: '11:59', phoneGlow: 1 }));
  veil(g, '#05040b', 0.5);
  const z = (o.z0 ?? 1) + (o.dz ?? 0.05) * ease.inOut(t / info.dur), cx = E.W * (o.cx ?? 0.5), cy = E.H * 0.52;
  g.save(); g.translate(cx, cy); g.scale(z, z); if (o.roll) g.rotate(o.roll * Math.sin(t * 0.6)); g.translate(-cx, -cy);
  phone(g, cx, cy, V(980, 1500) * (o.size ?? 1), t, o.phone || {});
  g.restore();
}

// s005 — "Forty-six new notifications."
registerShot('s005', { draw(g, t, info) {
  const cards = DAY0_CARDS.map((c, i) => ({ ...c, at: 0.15 + i * 0.12 }));
  phoneShot(g, t, info, { phone: { cards, stamp: 0, scroll: 40 * ease.inOut(prog(t, 0.6, 2)) } });
  const t46 = (wordTime('Forty-six', info.globalT - 1) ?? (info.globalT - t + 0.1)) - (info.globalT - t);
  const a = ease.outBack(prog(t, t46, t46 + 0.4));
  if (a > 0) { g.save(); g.translate(E.W * V(0.75, 0.5), E.H * V(0.36, 0.18)); g.scale(a, a);
    text(g, '46', 0, 0, { size: V(170, 150), font: FONTS.ui, weight: 900, color: '#f2efe8', glow: 30, glowColor: alpha(PHONE_BLUE, 0.9) });
    text(g, 'NEW', 0, V(110, 100), { size: V(40, 40), font: FONTS.ui, weight: 900, color: alpha('#f2efe8', 0.7), spacing: 6 }); g.restore(); }
} });

// s006 — "Normal."  bigFace, blue glow from below
registerShot('s006', { draw(g, t, info) {
  blurLayer(g, 14, (g) => bedroom(g, t, { z: 1.6, x: V(500, 300), y: -220 }, { clock: '11:59', phoneGlow: 1 })); veil(g, '#05040b', 0.45);
  const r = V(300, 330) * (1 + 0.04 * t), cx = E.W / 2, cy = E.H * V(0.6, 0.55);
  glow(g, cx, cy + r * 1.2, r * 2.2, PHONE_BLUE, 0.35);
  bigFace(g, cx, cy, r, { outfit: MAYA, expr: 'sleepy', look: [0, 0.6], rimColor: PHONE_BLUE, rimSide: 1, blink: (t % 2.6) > 2.5 });
} });

// s007 — "Except every single one is stamped tomorrow."  stamps pop one by one, slight roll
registerShot('s007', { draw(g, t, info) {
  const tw = (wordTime('tomorrow', info.globalT - t) ?? (info.globalT - t + 1.6)) - (info.globalT - t);
  const stamp = clamp((t - (tw - 1.2)) / 1.4);
  phoneShot(g, t, info, { z0: 1.05, dz: 0.08, roll: 0.012, phone: { cards: DAY0_CARDS, stamp, scroll: 40 } });
} });

// s008 / s009 — the big TOMORROW cards
function bigCard(g, t, info, card) {
  phoneShot(g, t, info, { z0: 1.0, dz: 0.03, cx: 0.5, phone: { cards: DAY0_CARDS, stamp: 1, scroll: 40, dim: 0.55 } });
  const a = ease.outBack(prog(t, 0.05, 0.45)), w = V(1100, 920), x = (E.W - w) / 2, y = E.H * 0.42;
  g.save(); g.translate(E.W / 2, y + 60); g.scale(0.9 + 0.1 * a, 0.9 + 0.1 * a); g.translate(-E.W / 2, -(y + 60));
  glow(g, E.W / 2, y + 90, w * 0.6, PHONE_BLUE, 0.25 * a);
  notifCard(g, x, y, w, { ...card, s: V(1.9, 1.6), a: clamp(a), stamp: 1 });
  g.restore();
}
registerShot('s008', { draw(g, t, info) { bigCard(g, t, info, DAY0_CARDS[0]); } });
registerShot('s009', { draw(g, t, info) { bigCard(g, t, info, DAY0_CARDS[1]); } });

// s010 — "You go to sleep."  Maya lies back, glow fades
registerShot('s010', { draw(g, t, info) {
  const cam = { z: 1.1 - 0.04 * ease.inOut(t / info.dur), x: 20 };
  const fade = 1 - prog(t, 0.2, 1.1);
  const { GY, M, bedX } = bedroom(g, t, cam, { clock: '12:00', phoneGlow: fade });
  layer(g, cam, 1, (g) => mayaInBed(g, t, GY, bedX, M, { expr: 'sleepy' }));
  FX.dust(g, t, { count: 24, color: '#cfd8ff', a: 0.2 });
} });
