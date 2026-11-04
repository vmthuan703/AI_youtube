// shots/02_day.js — tomorrow comes true: 7:02 Mom on the stairs, 10:15 the fire alarm, "Your name is Maya".
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, clamp, shake, wordTime, talkAmount, rr, glow, alpha } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, bigFace, headPos } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { stairs } from '../sets/stairs.js';
import { hallway, ALARM } from '../sets/school.js';
import { PHONE_BLUE } from '../sets/bedroom.js';
import { MAYA, MOM } from '../cast.js';

const local = (info, word, fallback) => { const w = wordTime(word, info.globalT - (info.globalT - info.shot.start) - 0.2); return w == null ? fallback : w - info.shot.start; };
const lunchBag = (g, x, y, s) => { rr(g, x - 22 * s, y - 52 * s, 44 * s, 52 * s, 4 * s); g.fillStyle = '#b8875a'; g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 22 * s, y - 52 * s, 44 * s, 10 * s); };

// s011 — "At 7:02, a voice comes up the stairs."  morning wide
registerShot('s011', { draw(g, t, info) {
  const cam = { z: 1 + 0.05 * ease.inOut(t / info.dur), x: -40 * ease.inOut(t / info.dur) };
  const { GY, M, bottomX } = stairs(g, t, cam);
  layer(g, cam, 1, (g) => {
    const pose = posesAt(t, [[0, POSES.stand], [1.6, POSES.pointUp]]);
    drawFigure(g, { x: bottomX + 40, y: GY, s: V(1.35, 1.3), facing: 1, outfit: MOM, pose: breathe(pose, t), expr: 'smile', look: [0.6, -0.6], rim: { color: M.rim, dir: [1, -0.6], w: 4 } });
  });
  FX.dust(g, t, { count: 50, color: '#ffe2bd', a: 0.35 });
  const tw = local(info, '7:02', 0.4);
  UI.readout(g, { label: 'TOMORROW IS NOW:', value: '7:02 AM', x: V(120, 80), y: E.H - V(190, 600), a: ease.out(prog(t, tw, tw + 0.3)) });
} });

// s012 — "Maya! Don't forget your lunch!"  Mom medium, lip-synced
registerShot('s012', { draw(g, t, info) {
  const cam = { z: 1.7 + 0.05 * ease.inOut(t / info.dur), x: -V(180, 120), y: V(170, 120) };
  const { GY, M, bottomX } = stairs(g, t, cam);
  const talk = talkAmount(info.globalT, 25.70, 27.63);
  const of = { x: bottomX + 60, y: GY, s: V(1.2, 1.2), facing: 1, outfit: MOM, pose: breathe(posesAt(t, [[0, POSES.talk], [1.0, { ...POSES.pointUp }]]), t), expr: t > 1.0 ? 'happy' : 'smile', talk, look: [0.7, -0.7], rim: { color: M.rim, dir: [1, -0.6], w: 4 } };
  layer(g, cam, 1, (g) => {
    drawFigure(g, of);
    lunchBag(g, of.x - 40, GY - 96, 1.1);
    if (talk > 0) { const [hx, hy, hr] = headPos(of); FX.rings(g, hx, hy, t, { count: 3, r0: hr * 1.3, r1: hr * 2.6, color: '#fff1e0', a: 0.35 }); }
  });
  FX.dust(g, t, { count: 40, color: '#ffe2bd', a: 0.3 });
} });

// crowd of ink students reacting to the alarm (deterministic)
function students(g, t, GY, M, xs, strobe) {
  xs.forEach((x, i) => drawFigure(g, { x, y: GY, s: V(1.3, 1.2) * (0.92 + (i % 3) * 0.05), facing: i % 2 ? -1 : 1, outfit: { top: 'none' },
    pose: breathe(i % 3 === 0 ? POSES.handsOnHead : i % 3 === 1 ? POSES.shrug : POSES.reach, t * (1 + i * 0.1), 1, i), expr: 'shocked', rim: { color: strobe > 0.5 ? ALARM : M.rim, dir: [0, -1], w: 3 }, dim: 0.1 }));
}

// s013 — "At 10:15, the fire alarm goes off."
registerShot('s013', { draw(g, t, info) {
  const [sx, sy] = shake(t, 5, 6);
  const cam = { z: 1.05 + 0.04 * t / info.dur, x: sx, y: sy };
  const { GY, M, strobe } = hallway(g, t, cam, { alarm: t > 0.25 });
  layer(g, cam, 1, (g) => students(g, t, GY, M, [E.W * 0.18, E.W * 0.32, E.W * 0.47, E.W * 0.63, E.W * 0.8], strobe));
  const tw = local(info, '10:15', 0.3);
  UI.readout(g, { label: 'TOMORROW IS NOW:', value: '10:15 AM', x: V(120, 80), y: E.H - V(190, 600), color: '#ff8a7a', a: ease.out(prog(t, tw, tw + 0.3)) });
} });

// s014 — "Exactly on time."  Maya calm in the strobe, slight smirk
registerShot('s014', { draw(g, t, info) {
  const cam = { z: 1.5 + 0.05 * ease.inOut(t / info.dur), x: 0, y: -V(80, 160) };
  const { GY, M, strobe } = hallway(g, t, cam, { alarm: true });
  layer(g, cam, 1, (g) => {
    students(g, t, GY, M, [E.W * 0.22, E.W * 0.78], strobe);
    drawFigure(g, { x: E.W / 2, y: GY, s: V(1.3, 1.3), facing: 1, outfit: MAYA, pose: breathe(POSES.crossArms, t), expr: t > 0.6 ? 'smirk' : 'neutral', look: [0.4, 0], rim: { color: strobe > 0.5 ? ALARM : M.rim, dir: [1, -0.5], w: 4 } });
  });
} });

// s015 — "Your name is Maya. You're sixteen."  lockers, callout
registerShot('s015', { draw(g, t, info) {
  const cam = { z: 1.35 + 0.05 * ease.inOut(t / info.dur), x: 60 - 80 * ease.inOut(t / info.dur), y: -V(70, 150) };
  const { GY, M } = hallway(g, t, cam, {});
  const of = { x: E.W * 0.44, y: GY, s: V(1.35, 1.35), facing: 1, outfit: MAYA, pose: breathe(POSES.phone, t), prop: 'phone', expr: 'neutral', look: [0.3, 0.4], rim: { color: M.rim, dir: [-1, -0.5], w: 4 } };
  layer(g, cam, 1, (g) => drawFigure(g, of));
  const [hx, hy] = headPos(of), z = cam.z;
  const sxy = [(hx - E.W / 2) * z + E.W / 2 - cam.x * z, (hy - E.H / 2) * z + E.H / 2 - cam.y * z];
  UI.callout(g, t, { at: [sxy[0] + 40, sxy[1] - 40], to: [sxy[0] + V(340, 220), sxy[1] - V(160, 220)], str: 'MAYA · 16', start: 0.3 });
} });

// s016 — "And your phone just showed you tomorrow."  bigFace awe, blue glow
registerShot('s016', { draw(g, t, info) {
  blurLayer(g, 14, (g) => hallway(g, t, { z: 1.6, x: 300, y: -200 }, {})); veil(g, '#05040b', 0.45);
  const r = V(300, 330) * (1 + 0.05 * t), cx = E.W / 2 - V(80, 0), cy = E.H * V(0.6, 0.55);
  glow(g, cx + r * 0.6, cy + r * 1.3, r * 2, PHONE_BLUE, 0.4);
  bigFace(g, cx, cy, r, { outfit: MAYA, expr: t > 0.8 ? 'awe' : 'surprised', look: [0.4, 0.7], rimColor: PHONE_BLUE, rimSide: 1, blink: (t % 2.7) > 2.6 });
  FX.sparkle(g, cx + r * 1.2, cy + r * 0.9, 18 + 6 * Math.sin(t * 4), '#cfe9ff', 0.8);
} });
