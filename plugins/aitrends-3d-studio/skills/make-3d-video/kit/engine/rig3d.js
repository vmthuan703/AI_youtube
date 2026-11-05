// engine/rig3d.js — the 3D stick-figure character: a big round head with a drawn cartoon face on a thin neck,
// stick limbs, chunky clothes (hoodie, tee, jacket, suit, dress, lab coat), ball hands, optional pants and sneakers.
// Two looks: skin 'pale' (default: ivory head with lavender shading, dot eyes, dark outline — the 3D "what if" look)
// and skin 'ink' (black stick figure with big white eyes). Any hex colour also works as a skin.
// Posed with forward kinematics (angles) or IK (hand/foot targets); face = expression + talk + blink + look.
//
//   const hero = T.character(HERO);              // outfit from scenes/cast.js
//   st.add(hero); hero.place(0, 0, 0, 0);       // x, y, z, yaw (radians; 0 = facing +z, toward the default camera)
//   hero.pose(T.posesAt3(t, [[0, 'stand'], [0.6, 'point']]));   // or a pose object, or T.walkPose3(phase, {run})
//   hero.face({ expr: 'smirk', talk: talkAmount(info.globalT, a, b), blink: true, t, look: [0.3, 0] });
//   hero.lookAt3([x, y, z])                      // turn the head toward a world point (call after pose)
import * as THREE from 'three';
import { buildHair } from './hair3d.js';
import { S, clamp, lerp, mixVal, ease, prog, noise, shade } from './core.js';
import { mat } from './kit3d.js';

const D2R = Math.PI / 180;
// body proportions (metres). Head is big on purpose (cartoon stick figure).
export const BODY = { hipY: 0.62, headR: 0.27, neck: 0.085, chestH: 0.47, shoulderX: 0.175, shoulderY: 0.40, hipX: 0.085, upperArm: 0.26, foreArm: 0.24, thigh: 0.29, shin: 0.27, ankleY: 0.06, limbR: 0.03 };

// ---------------------------------------------------------------- poses
// Pose = { y, hips:[pitch,yaw,roll], spine:[pitch,yaw,roll], head:[pitch,yaw,roll],
//          armL/armR: [raise, az, bend, twist] | {to:[x,y,z], pole?:[x,y,z]},     (character space, metres)
//          legL/legR: [lift, side, knee, twist] | {to:[x,y,z], pole?:[x,y,z]},
//          handL/handR: 'fist'|'open'|'point'|'relaxed', foot? }
// Degrees. pitch + = lean/nod forward; yaw + = turn to the character's LEFT; arm raise 0 = hanging, 90 = horizontal,
// 180 = straight up; az 0 = forward, 90 = out to the side, negative = across the body; bend = elbow flex.
// Leg lift + = thigh forward, side + = outward, knee + = bend. L = character's left (+x side when facing +z).
const P = (o) => ({ y: 0, hips: [0, 0, 0], spine: [0, 0, 0], head: [0, 0, 0], armL: [6, 12, 12, 0], armR: [6, 12, 12, 0], legL: [0, 3, 2, 0], legR: [0, 3, 2, 0], handL: 'relaxed', handR: 'relaxed', ...o });
export const POSES3 = {
  stand: P({}),
  relaxed: P({ spine: [-2, 0, 0], armL: [8, 20, 18, 0], armR: [6, 10, 10, 0], legL: [2, 5, 3, 0], legR: [-3, 2, 4, 0] }),
  confident: P({ spine: [-4, 0, 0], head: [-6, 0, 0], armL: [12, 30, 25, 0], armR: [12, 30, 25, 0], legL: [0, 8, 0, 0], legR: [0, 8, 0, 0] }),
  handsInPockets: P({ spine: [-3, 0, 0], armL: [10, 25, 70, -20], armR: [10, 25, 70, -20], legL: [0, 5, 0, 0], legR: [0, 5, 0, 0] }),
  talk: P({ armL: [30, 30, 70, 0], armR: [10, 15, 20, 0], handL: 'open' }),
  explain: P({ spine: [3, 0, 0], armL: [45, 35, 55, 0], armR: [40, 30, 50, 0], handL: 'open', handR: 'open' }),
  point: P({ spine: [2, -8, 0], armL: [88, 8, 4, 0], armR: [6, 10, 12, 0], handL: 'point' }),
  pointUp: P({ armL: [160, 45, 8, 0], armR: [6, 12, 12, 0], handL: 'point' }),
  pointAtViewer: P({ spine: [6, -6, 0], armL: [80, -5, 10, 0], handL: 'point' }),
  wave: P({ armL: [135, 75, 40, 0], handL: 'open' }),
  cheer: P({ spine: [-6, 0, 0], head: [-8, 0, 0], armL: [150, 70, 15, 0], armR: [150, 70, 15, 0], handL: 'fist', handR: 'fist' }),
  fistPump: P({ spine: [2, 0, 0], armL: [30, 20, 130, 0], handL: 'fist' }),
  handsOnHead: P({ armL: [150, 70, 120, 10], armR: [150, 70, 120, 10], handL: 'open', handR: 'open' }),
  facepalm: P({ spine: [12, 0, 0], head: [18, 0, 0], armL: [70, -20, 135, 0], handL: 'open' }),
  think: P({ head: [-6, 10, 6], armL: [45, -25, 140, 0], armR: [25, -40, 95, 0], handL: 'fist' }),
  crossArms: P({ armL: [40, -60, 110, 0], armR: [38, -60, 105, 0] }),
  shrug: P({ head: [0, 0, 8], armL: [30, 65, 95, 30], armR: [30, 65, 95, 30], handL: 'open', handR: 'open' }),
  scared: P({ y: -0.04, spine: [-6, 0, 0], head: [-6, 0, 0], armL: [60, 25, 110, 0], armR: [60, 25, 110, 0], handL: 'open', handR: 'open', legL: [8, 8, 14, 0], legR: [-4, 8, 14, 0] }),
  shocked: P({ spine: [-10, 0, 0], head: [-8, 0, 0], armL: [35, 50, 40, 0], armR: [35, 50, 40, 0], handL: 'open', handR: 'open' }),
  sad: P({ spine: [14, 0, 0], head: [22, 0, 0], armL: [2, 5, 5, 0], armR: [2, 5, 5, 0] }),
  phone: P({ head: [18, 0, 0], armL: [38, -10, 105, 0], armR: [20, 10, 30, 0], handL: 'open' }),
  phoneEar: P({ head: [0, 0, 8], armL: [75, 55, 150, 0], handL: 'open' }),
  holdFront: P({ armL: [45, 10, 70, 0], armR: [45, 10, 70, 0], handL: 'open', handR: 'open' }),
  reach: P({ spine: [12, 0, 0], armL: [80, 15, 5, 0], armR: [20, 15, 20, 0], handL: 'open' }),
  ready: P({ y: -0.06, spine: [10, 0, 0], armL: [45, 25, 90, 0], armR: [45, 25, 90, 0], handL: 'fist', handR: 'fist', legL: [18, 12, 30, 0], legR: [-12, 12, 26, 0] }),
  fight: P({ y: -0.07, spine: [8, 20, 0], head: [0, -18, 0], armL: [70, 0, 120, 0], armR: [55, 10, 130, 0], handL: 'fist', handR: 'fist', legL: [22, 10, 28, 0], legR: [-18, 10, 25, 0] }),
  punch: P({ spine: [10, -25, 0], head: [0, 20, 0], armL: [88, -5, 2, 0], armR: [50, 20, 130, 0], handL: 'fist', handR: 'fist', legL: [25, 8, 20, 0], legR: [-25, 8, 15, 0] }),
  kick: P({ spine: [-14, 0, 0], armL: [60, 60, 40, 0], armR: [50, 40, 60, 0], legL: [85, 5, 5, 0], legR: [-5, 5, 6, 0] }),
  crouch: P({ y: -0.22, spine: [28, 0, 0], head: [-18, 0, 0], armL: [40, 15, 50, 0], armR: [40, 15, 50, 0], legL: [70, 10, 120, 0], legR: [70, 10, 120, 0] }),
  kneel: P({ y: -0.29, spine: [5, 0, 0], legL: [85, 4, 90, 0], legR: [-10, 4, 100, 0], armL: [20, 15, 30, 0], armR: [20, 15, 30, 0] }),
  sit: P({ y: -0.2, spine: [4, 0, 0], legL: [88, 6, 88, 0], legR: [88, 6, 88, 0], armL: [30, 10, 50, 0], armR: [30, 10, 50, 0] }),
  sitBack: P({ y: -0.22, spine: [-14, 0, 0], legL: [80, 10, 70, 0], legR: [92, 4, 95, 0], armL: [20, 40, 20, 0], armR: [20, 40, 20, 0] }),
  sitDesk: P({ y: -0.2, spine: [16, 0, 0], head: [8, 0, 0], legL: [88, 6, 88, 0], legR: [88, 6, 88, 0], armL: [50, -5, 80, 0], armR: [50, -5, 80, 0], handL: 'open', handR: 'open' }),
  lie: P({ y: -0.5, hips: [-90, 0, 0], armL: [10, 30, 10, 0], armR: [10, 30, 10, 0], legL: [0, 4, 4, 0], legR: [0, 4, 4, 0] }),
  jump: P({ y: 0.22, spine: [-6, 0, 0], armL: [145, 65, 20, 0], armR: [145, 65, 20, 0], legL: [40, 8, 70, 0], legR: [20, 8, 90, 0] }),
  fall: P({ y: -0.1, spine: [-25, 0, 10], armL: [120, 80, 30, 0], armR: [130, 70, 20, 0], handL: 'open', handR: 'open', legL: [40, 15, 30, 0], legR: [10, 15, 50, 0] }),
  superLand: P({ y: -0.3, spine: [35, 0, 0], head: [-25, 0, 0], armL: [60, -10, 10, 0], armR: [30, 60, 20, 0], handL: 'open', handR: 'fist', legL: [80, 12, 120, 0], legR: [-20, 15, 120, 0] }),
  flexL: P({ armL: [90, 85, 120, -90], handL: 'fist' }),
};

// ---------------------------------------------------------------- cycles
// walkPose3(phase, {run, sprint, swing}) — one stride per 2π. Move the character at ~1.3 m/s (walk), 4 m/s (run), 9 m/s (sprint)
// with phase = t * 2π * cadence (walk 0.9 Hz, run 1.4 Hz, sprint 1.9 Hz). Includes the vertical bob (pose.y).
export function walkPose3(ph, o = {}) {
  const run = o.sprint ? 1.35 : o.run ? 1 : 0, s = Math.sin(ph), c = Math.cos(ph), s2 = Math.abs(Math.sin(ph));
  if (!run) return P({ y: -0.02 + 0.025 * Math.abs(c), spine: [3, 4 * s, 0], head: [-2, -3 * s, 0], hips: [0, -5 * s, 0],
    armL: [6 + 22 * Math.max(0, -s) , 10 - 20 * s, 18 + 12 * Math.max(0, -s), 0], armR: [6 + 22 * Math.max(0, s), 10 + 20 * s, 18 + 12 * Math.max(0, s), 0],
    legL: [24 * s, 3, 6 + 40 * clamp(-Math.sin(ph - 1.2)), 0], legR: [-24 * s, 3, 6 + 40 * clamp(Math.sin(ph - 1.2)), 0] });
  const lean = (o.sprint ? 32 : 18) * (o.lean ?? 1);
  return P({ y: -0.05 * run + 0.07 * s2 * run, hips: [0, -8 * s, 0], spine: [lean, 8 * s, 0], head: [-lean * 0.75, -8 * s, 0],
    armL: [10 + 60 * Math.max(0, -s) * run - 20 * Math.max(0, s), 18, 95, 0], armR: [10 + 60 * Math.max(0, s) * run - 20 * Math.max(0, -s), 18, 95, 0], handL: 'fist', handR: 'fist',
    legL: [lerp(-35, 70, (s + 1) / 2) * run, 4, 25 + 95 * clamp(-Math.sin(ph - 0.9)) * run, 0], legR: [lerp(-35, 70, (-s + 1) / 2) * run, 4, 25 + 95 * clamp(Math.sin(ph - 0.9)) * run, 0] });
}
// subtle idle motion on top of any pose (breathing, weight shift). Never leave a figure frozen.
export function breathe3(pose, t, k = 1, seed = 1) {
  const p = typeof pose === 'string' ? POSES3[pose] : pose; const b = Math.sin(t * 1.9 + seed) * k, n = noise(t * 0.35, seed) * k;
  const out = { ...p, spine: [p.spine[0] + 1.2 * b, p.spine[1] + 1.5 * n, p.spine[2]], head: [p.head[0] - 1 * b, p.head[1] + 3 * n, p.head[2] + 1.5 * noise(t * 0.3, seed + 4) * k], y: (p.y || 0) + 0.004 * b };
  if (Array.isArray(p.armL)) out.armL = [p.armL[0] + 2 * b, p.armL[1], p.armL[2] + 3 * b, p.armL[3]];
  if (Array.isArray(p.armR)) out.armR = [p.armR[0] + 2 * b, p.armR[1], p.armR[2] + 3 * b, p.armR[3]];
  return out;
}
// posesAt3(t, [[0,'stand'], [0.8,'point'], [2.4, poseObj]], blend=0.3) — hold each pose, blend into the next
export function posesAt3(t, keys, blend = 0.3) {
  const get = (p) => (typeof p === 'string' ? POSES3[p] || POSES3.stand : p);
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const cur = get(keys[i][1]); const nxt = keys[i + 1]; const prev = i > 0 ? get(keys[i - 1][1]) : null;
  const into = i > 0 ? ease.inOut(prog(t, keys[i][0], keys[i][0] + blend)) : 1;
  return prev && into < 1 ? blendPose3(prev, cur, into) : cur;
}
export function blendPose3(a, b, k) {
  a = typeof a === 'string' ? POSES3[a] : a; b = typeof b === 'string' ? POSES3[b] : b; const o = {};
  for (const kk of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[kk] ?? b[kk], vb = b[kk] ?? a[kk];
    if (typeof va === 'number' || (Array.isArray(va) && Array.isArray(vb))) o[kk] = mixVal(va, vb, k);
    else if (va && vb && va.to && vb.to) o[kk] = { ...vb, to: mixVal(va.to, vb.to, k), pole: va.pole && vb.pole ? mixVal(va.pole, vb.pole, k) : vb.pole };
    else o[kk] = k < 0.5 ? va : vb;
  }
  return o;
}

// ---------------------------------------------------------------- faces (drawn on a canvas, mapped on the front of the head)
// eye: open (0..1.3), lid (top-lid slant: + = angry/inner-down, - = worried/inner-up), low (lower lid / smile squint 0..1),
// pupil (size), closed: 'happy' arcs; mouth: type smile|grin|open|o|flat|frown|smirk|teeth|wavy|tongue, w, open, curve
export const EXPRESSIONS = {
  neutral:    { eye: { open: 0.82, lid: 0, low: 0.05, pupil: 0.5 }, mouth: { type: 'flat', w: 0.45, curve: 0.08 } },
  smile:      { eye: { open: 0.78, lid: 0, low: 0.3, pupil: 0.5 }, mouth: { type: 'smile', w: 0.6, curve: 0.55 } },
  happy:      { eye: { closed: 'happy' }, mouth: { type: 'grin', w: 0.72, open: 0.55 } },
  joy:        { eye: { closed: 'happy' }, mouth: { type: 'open', w: 0.7, open: 0.9 } },
  smirk:      { eye: { open: 0.5, lid: 0.12, low: 0.22, pupil: 0.55 }, mouth: { type: 'smirk', w: 0.6, curve: 0.5 } },
  smug:       { eye: { open: 0.42, lid: -0.05, low: 0.2, pupil: 0.55 }, mouth: { type: 'smirk', w: 0.62, curve: 0.55 } },
  determined: { eye: { open: 0.62, lid: 0.35, low: 0.18, pupil: 0.55 }, mouth: { type: 'flat', w: 0.5, curve: -0.05 } },
  angry:      { eye: { open: 0.7, lid: 0.6, low: 0.15, pupil: 0.45 }, mouth: { type: 'teeth', w: 0.62, open: 0.45, curve: -0.35 } },
  surprised:  { eye: { open: 1.15, lid: -0.15, low: 0, pupil: 0.38 }, mouth: { type: 'o', w: 0.3, open: 0.6 } },
  shocked:    { eye: { open: 1.3, lid: -0.25, low: 0, pupil: 0.22 }, mouth: { type: 'open', w: 0.55, open: 1.0 } },
  scared:     { eye: { open: 1.2, lid: -0.45, low: 0, pupil: 0.24 }, mouth: { type: 'wavy', w: 0.6, open: 0.45 } },
  worried:    { eye: { open: 0.9, lid: -0.45, low: 0.05, pupil: 0.42 }, mouth: { type: 'frown', w: 0.4, curve: -0.3 } },
  nervous:    { eye: { open: 0.95, lid: -0.35, low: 0.05, pupil: 0.3 }, mouth: { type: 'teeth', w: 0.6, open: 0.35, curve: 0.15 } },
  sad:        { eye: { open: 0.7, lid: -0.55, low: 0.1, pupil: 0.48 }, mouth: { type: 'frown', w: 0.45, curve: -0.5 } },
  cry:        { eye: { open: 0.6, lid: -0.6, low: 0.15, pupil: 0.48, tears: true }, mouth: { type: 'wavy', w: 0.55, open: 0.55 } },
  sleepy:     { eye: { open: 0.18, lid: -0.1, low: 0, pupil: 0.5 }, mouth: { type: 'o', w: 0.18, open: 0.25 } },
  thinking:   { eye: { open: 0.72, lid: 0.15, low: 0.15, pupil: 0.45, lookUp: 0.6, squintR: 0.4 }, mouth: { type: 'smirk', w: 0.35, curve: -0.2 } },
  confused:   { eye: { open: 0.85, lid: -0.2, low: 0.05, pupil: 0.4, squintR: 0.5 }, mouth: { type: 'wavy', w: 0.45, open: 0.1 } },
  awe:        { eye: { open: 1.1, lid: -0.2, low: 0, pupil: 0.62, sparkle: true }, mouth: { type: 'o', w: 0.32, open: 0.75 } },
  evil:       { eye: { open: 0.55, lid: 0.7, low: 0.3, pupil: 0.3 }, mouth: { type: 'grin', w: 0.85, open: 0.35, curve: 0.7 } },
  dead:       { eye: { closed: 'x' }, mouth: { type: 'tongue', w: 0.5, open: 0.4 } },
  deadpan:    { eye: { closed: 'flat' }, mouth: { type: 'flat', w: 0.26, curve: 0 } },      // two flat dashes: the hero's resting comedy face
  unimpressed: { eye: { open: 0.34, lid: 0.02, low: 0.1, pupil: 0.55 }, mouth: { type: 'flat', w: 0.3, curve: -0.04 } },   // heavy upper lids
};
const FACE = { phiSpan: 150 * D2R, thStart: 30 * D2R, thSpan: 125 * D2R, W: 768, H: 640 };
const _faceTex = new Map();
function faceTexture(key, draw) {   // LRU cache: long videos create many expression/talk/blink states
  if (_faceTex.has(key)) { const t = _faceTex.get(key); _faceTex.delete(key); _faceTex.set(key, t); return t; }
  const c = document.createElement('canvas'); c.width = FACE.W; c.height = FACE.H; draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; _faceTex.set(key, t);
  if (_faceTex.size > 96) { const [k0, t0] = _faceTex.entries().next().value; _faceTex.delete(k0); t0.dispose(); }   // re-uploads if still on screen
  return t;
}
// angle helpers: canvas x from yaw offset (deg, + = viewer's right), canvas y from polar angle (deg from the top)
const fx = (deg) => FACE.W / 2 + (deg * D2R / FACE.phiSpan) * FACE.W;
const fy = (deg) => ((deg * D2R - FACE.thStart) / FACE.thSpan) * FACE.H;
const pxDeg = FACE.W / (FACE.phiSpan / D2R);   // pixels per degree (x)
// pal: { line (mouth/brow strokes), sclera (eye white, 'big' eyes only), pupil, inner (mouth inside), teeth, tongue }
function drawFace(g, f) {
  const { eye, mouth, talk = 0, blink = false, look = [0, 0], style = 'dot', pal } = f;
  const dot = style === 'dot';
  g.clearRect(0, 0, FACE.W, FACE.H); g.lineCap = 'round'; g.lineJoin = 'round';
  const ex = dot ? 25 : 23, ey = dot ? 93 : 86, ew = dot ? 5.0 : 17, eh = dot ? 7.5 : 21;   // degrees
  for (const side of [-1, 1]) {   // -1 = viewer's left = character's right eye
    const big = Math.max(1, eye.open ?? 0.8), grow = 1 + (big - 1) * (dot ? 1.0 : 0.6);
    const lxo = dot ? clamp(look[0], -1, 1) * 5 * pxDeg : 0, lyo = dot ? (clamp(look[1], -1, 1) - (eye.lookUp || 0)) * 3 * pxDeg : 0;
    const cx = fx(side * ex) + lxo, cy = fy(ey) + lyo, rw = ew * pxDeg * grow, rh = eh * pxDeg * grow;
    const lw = dot ? rw * 0.42 : rh * 0.28;
    if (eye.closed === 'happy' || (blink && !eye.closed)) {
      g.strokeStyle = dot ? pal.pupil : pal.sclera; g.lineWidth = lw; g.beginPath();
      if (eye.closed === 'happy') g.arc(cx, cy + rh * 0.35, rw * (dot ? 1.25 : 0.75), Math.PI * 1.12, Math.PI * 1.88); else { const k = dot ? 1.4 : 0.8; g.moveTo(cx - rw * k, cy + rh * 0.15); g.quadraticCurveTo(cx, cy + rh * 0.35, cx + rw * k, cy + rh * 0.15); }
      g.stroke(); continue;
    }
    if (eye.closed === 'flat') { g.strokeStyle = dot ? pal.pupil : pal.sclera; g.lineWidth = rh * 0.34; g.beginPath(); g.moveTo(cx - rw * 1.7, cy); g.lineTo(cx + rw * 1.7, cy); g.stroke(); continue; }
    if (eye.closed === 'x') { g.strokeStyle = dot ? pal.pupil : pal.sclera; g.lineWidth = lw; const r = rw * (dot ? 1.1 : 0.6); g.beginPath(); g.moveTo(cx - r, cy - r); g.lineTo(cx + r, cy + r); g.moveTo(cx + r, cy - r); g.lineTo(cx - r, cy + r); g.stroke(); continue; }
    let open = eye.open ?? 0.8; if (eye.squintR && side === 1) open *= 1 - eye.squintR;
    const slant = (eye.lid || 0) * rh * 0.8;   // + lid = inner corner down (angry), - = inner up (worried/sad)
    const topY = cy + rh - 2 * rh * Math.min(1, dot ? Math.min(1, open * 1.15) : open); const lowY = cy + rh * (1 - (eye.low || 0));
    const inner = -side, yInner = topY + slant, yOuter = topY - slant, xInner = cx + inner * rw * 1.3, xOuter = cx - inner * rw * 1.3;
    g.save();
    g.beginPath(); g.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2); g.clip();
    g.beginPath(); g.moveTo(xInner, yInner); g.lineTo(xOuter, yOuter); g.lineTo(xOuter, lowY); g.quadraticCurveTo(cx, lowY - rh * (eye.low || 0) * 0.9, xInner, lowY); g.closePath(); g.clip();
    if (dot) {
      g.fillStyle = pal.pupil; g.fillRect(cx - rw * 1.4, cy - rh * 1.4, rw * 2.8, rh * 2.8);
      g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(cx - rw * 0.3, cy - rh * 0.42, rw * (eye.sparkle ? 0.42 : 0.3), 0, Math.PI * 2); g.fill();
      if (eye.sparkle) { g.beginPath(); g.arc(cx + rw * 0.3, cy + rh * 0.3, rw * 0.16, 0, Math.PI * 2); g.fill(); }
    } else {
      g.fillStyle = pal.sclera; g.fillRect(cx - rw * 1.4, cy - rh * 1.4, rw * 2.8, rh * 2.8);
      const pr = rw * (eye.pupil ?? 0.5) * 0.95, lx = clamp(look[0], -1, 1) * rw * 0.42, ly = (clamp(look[1], -1, 1) - (eye.lookUp || 0)) * rh * 0.35;
      const py = Math.max(cy + ly, topY + pr * 0.55);
      g.fillStyle = pal.pupil; g.beginPath(); g.arc(cx + lx, py, pr, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(cx + lx - pr * 0.35, py - pr * 0.38, pr * (eye.sparkle ? 0.38 : 0.26), 0, Math.PI * 2); g.fill();
      if (eye.sparkle) { g.beginPath(); g.arc(cx + lx + pr * 0.3, py + pr * 0.32, pr * 0.15, 0, Math.PI * 2); g.fill(); }
    }
    g.restore();
    // heavy upper lid: a thick line wider than the eye (the "smug / unimpressed" look of the references)
    if (dot && open < 0.78) { const ext = rw * 1.55, lift = rh * 0.08; g.strokeStyle = pal.pupil; g.lineWidth = rh * 0.32; g.beginPath(); g.moveTo(cx + inner * ext, yInner + (yInner - yOuter) * 0.15 - lift); g.quadraticCurveTo(cx, topY - lift * 2 - (eye.lid || 0) * 0, cx - inner * ext, yOuter - (yInner - yOuter) * 0.15 - lift); g.stroke(); }
    // lashes
    if (dot && pal.lashes && open >= 0.5) { g.strokeStyle = pal.pupil; g.lineWidth = rw * 0.28; g.beginPath(); g.moveTo(cx - inner * rw * 0.9, cy - rh * 0.55); g.lineTo(cx - inner * rw * 1.6, cy - rh * 1.0); g.stroke(); }
    // brows (dot eyes need them to read anger / worry), one thin stroke
    if (dot && (Math.abs(eye.lid || 0) > 0.3 || eye.brow)) { const by = cy - rh * 1.75, bl = rw * 1.7, d = (eye.lid || 0) * rh * 0.9 + (eye.brow || 0) * -rh * 0.5; g.strokeStyle = pal.line; g.lineWidth = rw * 0.3; g.beginPath(); g.moveTo(cx + inner * bl * 0.35, by + d); g.quadraticCurveTo(cx - inner * bl * 0.2, by - rh * 0.25, cx - inner * bl * 0.95, by - d * 0.4); g.stroke(); }
    if (dot && pal.blush) { g.fillStyle = pal.blush; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(cx - inner * rw * 0.6, cy + rh * 1.9, rw * 1.3, rh * 0.42, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
    if (eye.tears) { g.fillStyle = '#7cc8ff'; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(cx + side * rw * 0.2, lowY + rh * (dot ? 1.6 : 0.9), rw * (dot ? 0.5 : 0.22), rh * 0.9, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
  }
  // mouth (talk opens it)
  const k = dot ? 0.5 : 1;   // dot faces have small mouths
  const m = mouth, mw = (m.w || 0.5) * 58 * k * pxDeg / 2, mx = fx(0) + (m.type === 'smirk' ? 3 * pxDeg : 0), my = fy(dot ? 111 : 119); const U = (pxDeg / 2.6) * (dot ? 0.62 : 1);
  const op = clamp((m.open || 0) + talk * 0.75, 0, 1.2), cu = m.curve || 0;
  const line = pal.line; g.fillStyle = line; g.strokeStyle = line; g.lineWidth = (dot ? 7 : 9) * U;
  if (talk > 0.05 && ['flat', 'smile', 'smirk', 'frown'].includes(m.type)) { drawOpen(g, mx, my, mw * 0.8, op * 26 * U, cu, pal); return; }
  switch (m.type) {
    case 'flat': g.beginPath(); g.moveTo(mx - mw, my - cu * 10 * U); g.quadraticCurveTo(mx, my + cu * 30 * U, mx + mw, my - cu * 10 * U); g.stroke(); break;
    case 'frown': g.beginPath(); g.moveTo(mx - mw, my + 10 * U); g.quadraticCurveTo(mx, my + (-22 + cu * 20) * U, mx + mw, my + 10 * U); g.stroke(); break;
    case 'smile': { if (dot) { g.beginPath(); g.moveTo(mx - mw, my - 6 * U); g.quadraticCurveTo(mx, my + 34 * U * (0.4 + cu), mx + mw, my - 6 * U); g.stroke(); break; } g.beginPath(); g.moveTo(mx - mw, my - 12 * U); g.quadraticCurveTo(mx, my + 34 * U * (0.4 + cu), mx + mw, my - 12 * U); g.quadraticCurveTo(mx, my + 10 * U * (0.4 + cu), mx - mw, my - 12 * U); g.fill(); break; }
    case 'smirk': { if (dot) { g.beginPath(); g.moveTo(mx - mw, my); g.quadraticCurveTo(mx, my + 16 * U * (0.3 + cu), mx + mw, my - 16 * U * (0.5 + cu)); g.stroke(); break; } g.beginPath(); g.moveTo(mx - mw, my); g.quadraticCurveTo(mx - mw * 0.1, my + 22 * U * (0.3 + cu), mx + mw, my - 18 * U * (0.5 + cu)); g.quadraticCurveTo(mx, my + 6 * U, mx - mw, my); g.fill(); break; }
    case 'grin': case 'teeth': { const hh = (18 + op * 30) * U; g.beginPath(); g.moveTo(mx - mw, my - (8 + cu * 8) * U); g.quadraticCurveTo(mx, my + hh * (1 + cu * 0.5), mx + mw, my - (8 + cu * 8) * U); g.quadraticCurveTo(mx, my + ((m.type === 'teeth' ? -2 : 4) - cu * 6) * U, mx - mw, my - (8 + cu * 8) * U); g.closePath(); g.fillStyle = pal.teeth; g.fill(); g.lineWidth = (dot ? 5 : 3) * U; g.strokeStyle = dot ? line : 'rgba(0,0,0,.35)'; g.stroke(); g.beginPath(); g.moveTo(mx - mw * 0.85, my + hh * 0.25); g.lineTo(mx + mw * 0.85, my + hh * 0.25); g.lineWidth = 3 * U; g.stroke(); break; }
    case 'o': drawOpen(g, mx, my, mw, Math.max(10, op * 30) * U, 0, pal, true); break;
    case 'open': drawOpen(g, mx, my, mw, Math.max(12, op * 34) * U, cu, pal); break;
    case 'wavy': { g.beginPath(); g.moveTo(mx - mw, my); for (let i = 1; i <= 6; i++) g.lineTo(mx - mw + (2 * mw * i) / 6, my + ((i % 2 ? -8 : 8) + op * 6) * U); g.stroke(); break; }
    case 'tongue': drawOpen(g, mx, my, mw * 0.7, 18 * U, 0, pal); g.fillStyle = pal.tongue; g.beginPath(); g.ellipse(mx + 6 * U, my + 22 * U, mw * 0.3, 14 * U, 0, 0, Math.PI * 2); g.fill(); break;
  }
}
function drawOpen(g, x, y, w, h, curve, pal, round = false) {
  g.save(); g.beginPath(); if (round) g.ellipse(x, y + h * 0.3, w * 0.6, h * 0.75 + 4, 0, 0, Math.PI * 2); else { g.moveTo(x - w, y - curve * h * 0.3); g.quadraticCurveTo(x, y - h * 0.2 - curve * h * 0.25, x + w, y - curve * h * 0.3); g.quadraticCurveTo(x + w * 0.9, y + h * 1.4, x, y + h * 1.5); g.quadraticCurveTo(x - w * 0.9, y + h * 1.4, x - w, y - curve * h * 0.3); }
  g.closePath(); g.fillStyle = pal.inner; g.fill(); g.lineWidth = Math.max(5, w * 0.08); g.strokeStyle = pal.line; g.stroke(); g.clip();
  if (!round) { g.fillStyle = pal.teeth; g.fillRect(x - w, y - h, w * 2, h * 0.75 + 8); }          // top teeth
  g.fillStyle = pal.tongue; g.beginPath(); g.ellipse(x, y + h * 1.45, w * 0.55, h * 0.45, 0, 0, Math.PI * 2); g.fill();   // tongue
  g.restore();
}
const lum = (c) => { const k = new THREE.Color(c); return 0.2126 * k.r + 0.7152 * k.g + 0.0722 * k.b; };

// ---------------------------------------------------------------- character builder
// outfit: { skin: 'pale' | 'ink' | '#hex' (head, neck, bare limbs, hands), eyes: 'dot' | 'big', outline: '#hex' | false,
//           top: 'hoodie'|'tshirt'|'jacket'|'suit'|'dress'|'labcoat'|'vest'|'none', color, color2 (trim), shirt,
//           legs: pants colour | 'shorts:#hex' | null (bare stick legs), shoes: colour | null (round feet), shoeSole,
//           gloves: colour (default: skin, i.e. ball hands), head: 'cap'|'capBack'|'beanie'|'hood'|'headband'|'crown'|'tophat',
//           headColor, hair: see engine/hair3d.js, hairColor, hairShade, bow, sleeves, stripe, scarf, collar, bag (colours),
//           face: 'glasses'|'sunglasses', tie, kid: bool, scale }
export function character(outfit = {}, opts = {}) {
  const st = S();
  const skinKey = outfit.skin || st.skin || 'pale';
  const skin = skinKey === 'pale' ? (st.paleSkin || '#efe8f4') : skinKey === 'ink' ? (st.ink || '#0c0a10') : skinKey;
  const dark = lum(skin) < 0.25;
  const eyeStyle = outfit.eyes || (dark ? 'big' : 'dot');
  const pal = dark ? { line: st.feature || '#f6f2ea', sclera: st.feature || '#f6f2ea', pupil: '#0b0a10', inner: '#5a1420', teeth: '#f6f2ea', tongue: '#d0506a' }
    : { line: '#22141c', sclera: '#ffffff', pupil: '#120d16', inner: '#4a0e1c', teeth: '#fbf6ee', tongue: '#e0607a' };
  if (outfit.blush) pal.blush = outfit.blush === true ? '#ff8aa8' : outfit.blush;
  if (outfit.lashes) pal.lashes = true;
  const olC = outfit.outline ?? st.outline ?? (dark ? false : '#1b1430'), olW = st.outlineW ?? 0.012;
  const root = new THREE.Group(); root.name = 'character'; { const who = opts.speaker || outfit.speaker; if (who) root.userData.speaker = String(who).toUpperCase(); }
  const scale = (outfit.scale || 1) * (outfit.kid ? 0.74 : 1) * (opts.s || 1);
  const body = new THREE.Group(); body.scale.setScalar(scale); root.add(body);
  const ghost = opts.ghost ? new THREE.MeshBasicMaterial({ color: new THREE.Color(opts.ghost.color || '#9fd0ff'), transparent: true, opacity: opts.ghost.opacity ?? 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }) : null;
  const MAT = (c, o = {}) => ghost || mat(c, { rim: 1, rough: 0.6, ...o });
  // pale skin glows faintly (as in the references: heads never go muddy, even back-lit); style.skinGlow 0..0.3
  const glowK = dark ? 0 : (st.skinGlow ?? 0.16);
  const skinM = MAT(skin, dark ? { rough: 0.55, rim: 1.0 } : { rough: 0.58, rim: 0.85, limit: st.skinLimit ?? 0.95, emissive: new THREE.Color(skin).multiplyScalar(glowK) });
  const olM = olC && !ghost ? new THREE.MeshBasicMaterial({ color: new THREE.Color(olC), side: THREE.BackSide, fog: true }) : null;
  const B = BODY;
  const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 18, 1, true), unitSph = new THREE.SphereGeometry(1, 22, 16);
  const add = (m, parent = body) => { m.castShadow = !ghost; m.receiveShadow = !ghost; parent.add(m); return m; };
  // outline hull: a back-face copy pushed out by olW (scaled for spheres/lathes, or an explicit radius for segments)
  const hull = (m, k = 1.06) => { if (!olM) return null; const h = new THREE.Mesh(m.geometry, olM); h.castShadow = false; h.receiveShadow = false; h.scale.setScalar(k); m.add(h); return h; };
  // frames
  const pelvis = new THREE.Group(); body.add(pelvis);
  const chest = new THREE.Group(); pelvis.add(chest);
  const neck = new THREE.Group(); neck.position.set(0, B.chestH, 0); chest.add(neck);
  const head = new THREE.Group(); head.position.set(0, B.headR + B.neck, 0); neck.add(head);
  const neckM = add(new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.04, B.neck + 0.06, 14), skinM), neck); neckM.position.y = (B.neck + 0.06) / 2 - 0.02; hull(neckM, 1 + olW / 0.034);
  // --- clothes
  const top = outfit.top ?? 'hoodie', topC = outfit.color || '#2f6fe0', trim = outfit.color2 || shade(topC, -0.18);
  const clothM = (c, o = {}) => MAT(c, { rough: 0.9, rim: 0.55, ...o });
  const popK = outfit.pop ?? (top === 'puffer' ? 0.35 : 0);   // outfit.pop 0..1: self-lit cloth, a loud hero outfit stays loud in dim sets
  const topM = top === 'none' ? skinM : clothM(top === 'labcoat' ? '#eef0f4' : topC, popK ? { emissive: new THREE.Color(topC).multiplyScalar(popK) } : {});
  const trimM = clothM(trim, { rim: 0.4 });
  const sleeveLong = ['hoodie', 'jacket', 'puffer', 'suit', 'labcoat'].includes(top), sleeveShort = ['tshirt', 'dress'].includes(top);
  const chunky = top === 'hoodie' || top === 'jacket' || top === 'puffer';
  // torso (lathe profile, elliptical section). Hoodies are boxy and generous, like a 3D cartoon.
  const prof = top === 'none' ? [[0.001, -0.02], [0.06, 0], [0.065, 0.2], [0.07, 0.4], [0.05, 0.47], [0.001, 0.48]]
    : chunky ? [[0.001, -0.17], [0.19, -0.17], [0.205, -0.13], [0.2, 0.05], [0.205, 0.28], [0.205, 0.38], [0.18, 0.45], [0.11, 0.5], [0.06, 0.52], [0.001, 0.52]]
    : [[0.001, -0.07], [0.16, -0.07], [0.172, -0.03], [0.165, 0.12], [0.172, 0.28], [0.178, 0.37], [0.15, 0.44], [0.09, 0.49], [0.055, 0.51], [0.001, 0.51]];
  const torsoGeo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 32); torsoGeo.scale(1, 1, top === 'none' ? 1 : 0.7);
  const torso = add(new THREE.Mesh(torsoGeo, topM), chest); hull(torso, 1 + olW / 0.2);
  if (top === 'hoodie') {
    // hood bunched behind the neck + front collar ring
    const hood = add(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.068, 12, 28), topM), chest); hood.position.set(0, 0.5, -0.025); hood.rotation.x = Math.PI / 2 - 0.3; hood.scale.set(1.2, 1.25, 0.95); hull(hood, 1 + olW / 0.1);
    const hoodBack = add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14), topM), chest); hoodBack.position.set(0, 0.47, -0.11); hoodBack.scale.set(1.15, 0.8, 0.6); hull(hoodBack, 1 + olW / 0.12);
    const pocket = add(new THREE.Mesh(new THREE.CylinderGeometry(0.197, 0.205, 0.13, 28, 1, true, -0.75, 1.5), clothM(shade(topC, -0.1), { side: THREE.DoubleSide, rim: 0.4 })), chest); pocket.scale.set(1.03, 1, 0.72); pocket.position.set(0, -0.01, 0);
    const band = add(new THREE.Mesh(new THREE.TorusGeometry(0.193, 0.02, 8, 32), trimM), chest); band.rotation.x = Math.PI / 2; band.scale.set(1, 0.7, 1); band.position.y = -0.155;
    const strM = MAT(outfit.strings || '#f2f2f2', { rim: 0.2 });
    for (const sx of [-0.045, 0.045]) { const s = add(new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.2, 6), strM), chest); s.position.set(sx, 0.39, 0.145); s.rotation.x = 0.08; const tip = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.025, 4, 6), strM), chest); tip.position.set(sx, 0.28, 0.153); }
  }
  if (top === 'puffer') {
    // quilted down jacket: horizontal seams, high collar, zip. The seams follow the boxy torso section.
    const seamM = clothM(outfit.color2 || shade(topC, -0.3), { rim: 0.2 });
    for (let i = 0; i < 6; i++) { const y = -0.115 + i * 0.09, r = i === 5 ? 0.198 : 0.209; const b = add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.0085, 8, 44), seamM), chest); b.rotation.x = Math.PI / 2; b.scale.set(1, 0.72, 1); b.position.y = y; }
    const collar = add(new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.05, 12, 28), topM), chest); collar.rotation.x = Math.PI / 2; collar.position.y = 0.5; collar.scale.set(1.05, 0.95, 0.95); hull(collar, 1 + olW / 0.1);
    const zip = add(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.56, 0.006), seamM), chest); zip.position.set(0, 0.19, 0.149); zip.rotation.x = 0.02;
    const pull = add(new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.034, 0.008), MAT('#e8e2d8', { rough: 0.4 })), chest); pull.position.set(0, 0.42, 0.152);
  }
  if (top === 'jacket' || top === 'suit' || top === 'labcoat' || top === 'vest') {
    const vee = new THREE.BufferGeometry(); vee.setAttribute('position', new THREE.Float32BufferAttribute([-0.07, 0, 0, 0.07, 0, 0, 0, -0.27, 0], 3)); vee.setIndex([0, 2, 1]); vee.computeVertexNormals(); const shirt = add(new THREE.Mesh(vee, MAT(outfit.shirt || (top === 'suit' ? '#f4f4f4' : top === 'labcoat' ? '#8fa8cc' : trim), { rim: 0.3, side: THREE.DoubleSide })), chest); shirt.castShadow = false; shirt.position.set(0, 0.485, chunky ? 0.137 : 0.113); shirt.rotation.x = chunky ? -0.075 : -0.06;
    const collar = add(new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 8, 20), topM), chest); collar.rotation.x = Math.PI / 2 + 0.25; collar.position.y = 0.48;
  }
  if (outfit.tie) { const tie = add(new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.28, 4), MAT(outfit.tie, { rim: 0.3 })), chest); tie.rotation.x = Math.PI; tie.position.set(0, 0.33, 0.128); tie.scale.set(1, 1, 0.3); }
  // small accents, at most one or two per supporting character
  const torsoR = chunky ? 0.209 : 0.178;
  if (outfit.stripe) { const b = add(new THREE.Mesh(new THREE.CylinderGeometry(torsoR, torsoR, 0.07, 36, 1, true), clothM(outfit.stripe, { rim: 0.3, side: THREE.DoubleSide })), chest); b.scale.z = 0.71; b.position.y = 0.2; }
  if (outfit.scarf) { const sm = clothM(outfit.scarf, { rim: 0.35 }); const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.04, 12, 28), sm), chest); ring.rotation.x = Math.PI / 2; ring.position.y = 0.5; ring.scale.set(1.08, 0.92, 0.85); hull(ring, 1 + olW / 0.1); const tail = add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.24, 0.03), sm), chest); tail.position.set(-0.07, 0.34, chunky ? 0.158 : 0.135); tail.rotation.x = 0.07; }
  if (outfit.collar) { const cm = clothM(outfit.collar, { rim: 0.3 }); for (const sx of [-1, 1]) { const w = add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.075), cm), chest); w.position.set(sx * 0.062, 0.485, 0.082); w.rotation.set(0.55, sx * -0.55, sx * -0.42); } }
  if (outfit.bag) { const bm = clothM(outfit.bag, { rim: 0.3 }); const pivot = new THREE.Group(); pivot.position.y = 0.19; pivot.rotation.z = -0.72; chest.add(pivot); const strap = add(new THREE.Mesh(new THREE.TorusGeometry(torsoR / Math.cos(0.72) + 0.005, 0.0105, 8, 48), bm), pivot); strap.rotation.x = Math.PI / 2; strap.scale.set(1, 0.56, 1); const pouch = add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.115, 0.055), bm), chest); pouch.position.set(0.16, -0.02, chunky ? 0.125 : 0.105); hull(pouch, 1.08); }
  let skirt = null;
  if (outfit.skirt && top !== 'dress') { const len = 0.26; skirt = add(new THREE.Mesh(new THREE.CylinderGeometry(0.178, 0.3, len, 28, 1, true), MAT(outfit.skirt, { rough: 0.85, rim: 0.4, side: THREE.DoubleSide })), pelvis); skirt.scale.z = 0.74; skirt.position.y = -len / 2 - 0.045; hull(skirt, 1 + olW / 0.25); }
  if (top === 'dress' || top === 'labcoat') { const len = top === 'dress' ? 0.42 : 0.55; skirt = add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, top === 'dress' ? 0.3 : 0.22, len, 28, 1, true), MAT(top === 'dress' ? topC : '#eef0f4', { rough: 0.85, rim: 0.4, side: THREE.DoubleSide })), pelvis); skirt.scale.z = 0.75; skirt.position.y = -len / 2 + 0.02; hull(skirt, 1 + olW / 0.25); }
  // --- head
  const skull = add(new THREE.Mesh(new THREE.SphereGeometry(B.headR, 48, 32), skinM), head); hull(skull, 1 + (olW * 1.15) / B.headR);
  const faceMat = ghost ? null : new THREE.MeshBasicMaterial({ color: new THREE.Color(dark ? 0.86 : 1, dark ? 0.86 : 1, dark ? 0.86 : 1), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, fog: true });
  let faceMesh = null;
  if (!ghost) { faceMesh = add(new THREE.Mesh(new THREE.SphereGeometry(B.headR * 1.003, 56, 36, Math.PI / 2 - FACE.phiSpan / 2, FACE.phiSpan, FACE.thStart, FACE.thSpan), faceMat), head); faceMesh.castShadow = false; faceMesh.receiveShadow = false; }
  const hc = outfit.headColor || '#f2c21a', hM = MAT(hc, { rough: 0.8, rim: 0.4 }); const hr = B.headR;
  const hairC = outfit.hairColor || (dark ? skin : '#6a3f26');
  const hat = (m, k = 1.03) => { add(m, head); hull(m, k); return m; };
  if (outfit.head === 'cap' || outfit.head === 'capBack') { hat(new THREE.Mesh(new THREE.SphereGeometry(hr * 1.04, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), hM)).position.y = 0.01; const brim = add(new THREE.Mesh(new THREE.CylinderGeometry(hr * 0.75, hr * 0.75, 0.016, 28, 1, false, -1.1, 2.2), hM), head); brim.scale.set(1, 1, 1.2); brim.position.set(0, hr * 0.42, outfit.head === 'cap' ? hr * 0.72 : -hr * 0.72); if (outfit.head === 'capBack') brim.rotation.y = Math.PI; hull(brim, 1.04); }
  if (outfit.head === 'beanie') { const d = hat(new THREE.Mesh(new THREE.SphereGeometry(hr * 1.05, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), hM)); d.scale.y = 1.12; const cuff = add(new THREE.Mesh(new THREE.TorusGeometry(hr * 1.0, 0.028, 8, 32), hM), head); cuff.rotation.x = Math.PI / 2; cuff.position.y = hr * 0.25; const pom = add(new THREE.Mesh(unitSph, MAT(shade(hc, 0.25), { rim: 0.3 })), head); pom.scale.setScalar(0.055); pom.position.y = hr * 1.18; }
  if (outfit.head === 'headband') { const band = add(new THREE.Mesh(new THREE.TorusGeometry(hr * 1.0, 0.024, 8, 32), hM), head); band.rotation.x = Math.PI / 2 - 0.15; band.position.y = hr * 0.45; }
  if (outfit.head === 'hood') { hat(new THREE.Mesh(new THREE.SphereGeometry(hr * 1.12, 32, 16, Math.PI * 0.85, Math.PI * 1.3, 0, Math.PI * 0.72), MAT(outfit.headColor || topC, { rough: 0.9, rim: 0.5, side: THREE.DoubleSide }))).position.set(0, 0.01, -0.01); }
  if (outfit.head === 'tophat') { hat(new THREE.Mesh(new THREE.CylinderGeometry(hr * 1.2, hr * 1.2, 0.015, 28), hM)).position.y = hr * 0.78; hat(new THREE.Mesh(new THREE.CylinderGeometry(hr * 0.72, hr * 0.75, hr * 1.1, 28), hM)).position.y = hr * 1.33; }
  if (outfit.head === 'crown') { const cr = add(new THREE.Mesh(new THREE.CylinderGeometry(hr * 0.7, hr * 0.6, hr * 0.45, 8, 1, true), MAT('#f2c21a', { metal: 0.6, rough: 0.35, rim: 0.4, side: THREE.DoubleSide })), head); cr.position.y = hr * 1.05; }
  if (outfit.hair) buildHair(outfit.hair, { head, hr, MAT, add, hull, olM, olW, color: hairC, shade: outfit.hairShade, dark, ghost });
  if (outfit.bow) { const bowM = MAT(outfit.bow, { rim: 0.4 }); const bow = new THREE.Group(); for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.08, 4), bowM); b.rotation.z = sx * Math.PI / 2; b.position.x = sx * 0.04; bow.add(b); } bow.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), bowM)); bow.position.set(hr * 0.42, hr * 0.86, hr * 0.2); bow.rotation.z = -0.4; add(bow, head); }
  if (outfit.face === 'glasses' || outfit.face === 'sunglasses') {
    const fm = MAT(outfit.face === 'sunglasses' ? '#111111' : '#2a2a2a', { rough: 0.3, rim: 0.2 });
    const ex = eyeStyle === 'dot' ? 21 : 23;
    for (const sx of [-1, 1]) { const ring = add(new THREE.Mesh(new THREE.TorusGeometry(eyeStyle === 'dot' ? 0.05 : 0.06, 0.008, 8, 24), fm), head); const a = sx * ex * D2R, th = 87 * D2R, r = hr * 1.06; ring.position.set(Math.sin(a) * Math.sin(th) * r, Math.cos(th) * r, Math.cos(a) * Math.sin(th) * r); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ring.position.clone().normalize()); ring.scale.set(1.16, 0.92, 1); if (outfit.face === 'sunglasses') { const lens = add(new THREE.Mesh(new THREE.CircleGeometry(eyeStyle === 'dot' ? 0.05 : 0.058, 20), MAT('#05050a', { rough: 0.15, metal: 0.4 })), head); lens.position.copy(ring.position); lens.quaternion.copy(ring.quaternion); lens.scale.copy(ring.scale); } }
  }
  if (outfit.face === 'glasses' || outfit.face === 'sunglasses') { const br = add(new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.075, 6), MAT('#1a1a1a', { rough: 0.3 })), head); br.rotation.z = Math.PI / 2; br.position.set(0, hr * Math.cos(87 * D2R) * 1.06 + 0.008, hr * 1.05); }
  // --- limbs: segments (cylinder + joint spheres) re-oriented every frame; outlines follow with a bigger radius
  const segs = [];
  const seg = (r, m, capEnd = true) => { const c = add(new THREE.Mesh(unitCyl, m), body); const j = capEnd ? add(new THREE.Mesh(unitSph, m), body) : null; const s = { r, c, j }; if (olM) { s.oc = new THREE.Mesh(unitCyl, olM); s.oj = capEnd ? new THREE.Mesh(unitSph, olM) : null; body.add(s.oc); if (s.oj) body.add(s.oj); } segs.push(s); return s; };
  const pantsC = outfit.legs ?? null, shorts = typeof pantsC === 'string' && /^shorts:/.test(pantsC), bareLegs = !pantsC;
  const pantsM = bareLegs ? skinM : MAT(shorts ? pantsC.slice(7) : pantsC, { rough: 0.85, rim: 0.55 });
  const sleeveM = top === 'none' || top === 'vest' ? skinM : outfit.sleeves ? clothM(outfit.sleeves) : topM;
  const limbR = dark ? B.limbR : B.limbR * 0.85;
  const armR = sleeveLong ? (top === 'puffer' ? 0.078 : chunky ? 0.068 : 0.058) : limbR;
  const armSeams = top === 'puffer' ? clothM(outfit.color2 || shade(topC, -0.3), { rim: 0.2 }) : null, seamGeo = armSeams ? new THREE.TorusGeometry(1, 0.11, 8, 24) : null;
  const sleeveRings = { L: [], R: [] };
  const L = {};
  for (const side of ['L', 'R']) {
    L['up' + side] = seg(sleeveLong || sleeveShort ? armR : limbR, sleeveLong || sleeveShort ? sleeveM : skinM);
    L['lo' + side] = seg(sleeveLong ? armR * 0.93 : limbR, sleeveLong ? sleeveM : skinM);
    L['cuff' + side] = sleeveLong ? seg(armR * 1.02, top === 'hoodie' || top === 'puffer' ? trimM : sleeveM, false) : null;
    if (armSeams) for (let i = 0; i < 4; i++) { const m = add(new THREE.Mesh(seamGeo, armSeams)); m.castShadow = false; m.scale.setScalar(armR * 1.0); sleeveRings[side].push(m); }
    L['th' + side] = seg(bareLegs ? limbR : 0.062, pantsM);
    L['sh' + side] = seg(bareLegs || shorts ? limbR : 0.056, shorts ? skinM : pantsM);
  }
  const shoulderBall = []; if (sleeveLong || sleeveShort) for (let i = 0; i < 2; i++) { const s = add(new THREE.Mesh(unitSph, sleeveM), body); s.scale.setScalar(sleeveLong ? armR * 1.15 : 0.065); shoulderBall.push(s); hull(s, 1 + olW / (armR * 1.15)); }
  // hands: balls (mittens) in the skin colour unless gloves are given
  const handR = dark ? 0.055 : 0.074;   // ball hands are big in the pale look
  const gloveM = outfit.gloves ? MAT(outfit.gloves, { rough: 0.55, rim: 0.9 }) : skinM;
  const hands = {};
  for (const side of ['L', 'R']) {
    const h = new THREE.Group(); add(h);
    const palm = add(new THREE.Mesh(unitSph, gloveM), h);
    const thumb = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.035, 4, 8), gloveM), h);
    const fing = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.017, 0.06, 4, 8), gloveM), h);
    hull(palm, 1 + olW / handR); hull(fing, 1.3); hull(thumb, 1.3);
    hands[side] = { g: h, palm, thumb, fing, mode: '' };
  }
  // feet: sneakers if shoes given, else round stick-figure feet
  const feet = {};
  const shoeC = outfit.shoes ?? null;
  for (const side of ['L', 'R']) {
    const f = new THREE.Group(); add(f);
    if (shoeC) {
      const shoeM = MAT(shoeC, { rough: 0.6, rim: 0.5 }), soleM = MAT(outfit.shoeSole || '#f4f4f4', { rough: 0.7, rim: 0.2 });
      const up = add(new THREE.Mesh(unitSph, shoeM), f); up.scale.set(0.06, 0.056, 0.125); up.position.set(0, 0.035, 0.045); hull(up, 1.12);
      const sole = add(new THREE.Mesh(roundedSole(), soleM), f); sole.position.set(0, -0.005, 0.045);
    } else { const ft = add(new THREE.Mesh(unitSph, skinM), f); ft.scale.set(0.05, 0.04, 0.09); ft.position.set(0, 0.03, 0.04); hull(ft, 1.18); }
    feet[side] = f;
  }
  // ---------------------------------------------------------------- posing
  const tmp = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const place = (s, A, Bp, r) => {
    const len = A.distanceTo(Bp); s.c.position.copy(A).add(Bp).multiplyScalar(0.5); tmp.copy(Bp).sub(A); if (len > 1e-6) s.c.quaternion.setFromUnitVectors(up, tmp.normalize()); s.c.scale.set(r, len, r);
    if (s.j) { s.j.position.copy(Bp); s.j.scale.setScalar(r); }
    if (s.oc) { s.oc.position.copy(s.c.position); s.oc.quaternion.copy(s.c.quaternion); s.oc.scale.set(r + olW, len, r + olW); if (s.oj) { s.oj.position.copy(Bp); s.oj.scale.setScalar(r + olW); } }
  };
  const eul = (a) => new THREE.Euler(a[0] * D2R, a[1] * D2R, a[2] * D2R, 'YXZ');
  const toBody = (frame, v) => { frame.updateWorldMatrix(true, false); const w = v.clone().applyMatrix4(frame.matrixWorld); return body.worldToLocal(w); };
  const fkArm = (a, s) => { const [raise, az, bend, twist] = a; const Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s * az * D2R, 0)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-raise * D2R, 0, 0))).multiply(new THREE.Quaternion().setFromAxisAngle(up, -s * (twist || 0) * D2R)); const d = new THREE.Vector3(0, -1, 0).applyQuaternion(Q), b = new THREE.Vector3(0, 0, 1).applyQuaternion(Q); const d2 = d.clone().multiplyScalar(Math.cos(bend * D2R)).addScaledVector(b, Math.sin(bend * D2R)); return [d, d2, b]; };
  const fkLeg = (a, s) => { const [lift, side, knee, twist] = a; const Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, s * side * D2R)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-lift * D2R, 0, 0))).multiply(new THREE.Quaternion().setFromAxisAngle(up, s * (twist || 0) * D2R)); const d = new THREE.Vector3(0, -1, 0).applyQuaternion(Q), b = new THREE.Vector3(0, 0, -1).applyQuaternion(Q); const d2 = d.clone().multiplyScalar(Math.cos(knee * D2R)).addScaledVector(b, Math.sin(knee * D2R)); return [d, d2, b]; };
  const ik = (A, T, l1, l2, pole) => { const dv = T.clone().sub(A); let d = dv.length(); d = clamp(d, Math.abs(l1 - l2) + 1e-3, (l1 + l2) * 0.999); const u = dv.normalize(); const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)); const pv = pole.clone().sub(A); pv.addScaledVector(u, -pv.dot(u)); if (pv.lengthSq() < 1e-8) pv.set(0, 0, 1); pv.normalize(); return A.clone().addScaledVector(u, Math.cos(a) * l1).addScaledVector(pv, Math.sin(a) * l1); };
  const setHand = (H, mode, A, Bp) => {
    H.g.position.copy(Bp); tmp.copy(Bp).sub(A).normalize(); H.g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), tmp);
    if (H.mode === mode) return; H.mode = mode;
    const open = mode === 'open', point = mode === 'point';
    H.palm.scale.set(handR, open ? handR * 1.25 : handR * 1.05, open ? handR * 0.55 : handR * 0.95); H.palm.position.set(0, -handR * 0.75, 0);
    H.thumb.position.set(handR * 0.75, -handR * 0.55, handR * 0.35); H.thumb.rotation.set(0, 0, open ? 0.9 : 0.4); H.thumb.visible = open || point;
    H.fing.visible = point || open; H.fing.position.set(0, -handR * 2.1, 0); H.fing.scale.set(1, point ? 1 : 0.9, open ? 0.6 : 1);
    if (open) { H.fing.scale.set(2.8, 0.75, 0.55); H.fing.position.set(0, -handR * 1.9, 0); }
  };
  const setFoot = (F, ankle, d2, flat, yawFwd) => {
    F.position.copy(ankle).add(new THREE.Vector3(0, -B.ankleY * 0.15, 0));
    const fwd = yawFwd.clone(); const hinge = new THREE.Vector3().crossVectors(d2, fwd); const natural = new THREE.Vector3().crossVectors(hinge.lengthSq() > 1e-6 ? hinge.normalize() : new THREE.Vector3(1, 0, 0), d2).normalize().negate();
    const dir = natural.lerp(fwd, flat).normalize(); const m = new THREE.Matrix4(); const x = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize(); const y = new THREE.Vector3().crossVectors(dir, x).normalize(); m.makeBasis(x, y, dir); F.quaternion.setFromRotationMatrix(m);
  };
  root.pose = (p) => {
    p = typeof p === 'string' ? POSES3[p] : p;
    pelvis.position.set(0, B.hipY + (p.y || 0), 0); pelvis.rotation.copy(eul(p.hips || [0, 0, 0]));
    chest.rotation.copy(eul(p.spine || [0, 0, 0])); head.rotation.copy(eul(p.head || [0, 0, 0]));
    body.updateMatrixWorld(true);
    for (const [side, s] of [['L', 1], ['R', -1]]) {
      const sh = toBody(chest, new THREE.Vector3(s * (chunky ? B.shoulderX + 0.02 : B.shoulderX), B.shoulderY, 0));
      const a = p['arm' + side] || [6, 12, 12, 0]; let el, wr, d2;
      if (Array.isArray(a)) { const [d, dd] = fkArm(a, s); const bq = body.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(chest.getWorldQuaternion(new THREE.Quaternion())); d.applyQuaternion(bq); dd.applyQuaternion(bq); el = sh.clone().addScaledVector(d, B.upperArm); wr = el.clone().addScaledVector(dd, B.foreArm); d2 = dd; }
      else { const T = new THREE.Vector3(...a.to); el = ik(sh, T, B.upperArm, B.foreArm, a.pole ? new THREE.Vector3(...a.pole) : sh.clone().add(new THREE.Vector3(s * 0.4, -0.3, -0.5))); wr = el.clone().add(T.clone().sub(el).setLength(B.foreArm)); d2 = wr.clone().sub(el).normalize(); }
      place(L['up' + side], sh, el, L['up' + side].r); place(L['lo' + side], el, wr, L['lo' + side].r);
      if (sleeveRings[side].length) { const [a, b, c, d] = sleeveRings[side], setRing = (m, A, Bp, k) => { m.position.lerpVectors(A, Bp, k); tmp.copy(Bp).sub(A).normalize(); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tmp); }; setRing(a, sh, el, 0.38); setRing(b, sh, el, 0.76); setRing(c, el, wr, 0.3); setRing(d, el, wr, 0.66); }
      if (L['cuff' + side]) { const c0 = wr.clone().addScaledVector(d2, -0.05); place(L['cuff' + side], c0, wr.clone().addScaledVector(d2, -0.005), L['cuff' + side].r); }
      if (shoulderBall.length) shoulderBall[side === 'L' ? 0 : 1].position.copy(sh);
      setHand(hands[side], p['hand' + side] || 'relaxed', el, wr);
      const hp = toBody(pelvis, new THREE.Vector3(s * B.hipX, 0, 0)); const lg = p['leg' + side] || [0, 3, 2, 0]; let kn, an, ld2;
      if (Array.isArray(lg)) { const [d, dd] = fkLeg(lg, s); const bq = body.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(pelvis.getWorldQuaternion(new THREE.Quaternion())); d.applyQuaternion(bq); dd.applyQuaternion(bq); kn = hp.clone().addScaledVector(d, B.thigh); an = kn.clone().addScaledVector(dd, B.shin); ld2 = dd; }
      else { const T = new THREE.Vector3(...lg.to); kn = ik(hp, T, B.thigh, B.shin, lg.pole ? new THREE.Vector3(...lg.pole) : hp.clone().add(new THREE.Vector3(s * 0.05, 0, 1))); an = kn.clone().add(T.clone().sub(kn).setLength(B.shin)); ld2 = an.clone().sub(kn).normalize(); }
      place(L['th' + side], hp, kn, L['th' + side].r); place(L['sh' + side], kn, an, L['sh' + side].r);
      const yaw = (p.hips?.[1] || 0) + (Array.isArray(lg) ? s * (lg[3] || 0) : 0) + s * 6;
      setFoot(feet[side], an, ld2, Array.isArray(lg) ? (p.flatFeet ?? 0.55) : 1, new THREE.Vector3(Math.sin(yaw * D2R), 0, Math.cos(yaw * D2R)));
    }
    return root;
  };
  // ---------------------------------------------------------------- face
  let faceKey = '';
  root.face = (o = {}) => {
    if (!faceMesh) return root;
    const ex = typeof o.expr === 'object' ? o.expr : EXPRESSIONS[o.expr || 'neutral'] || EXPRESSIONS.neutral;
    let blink = !!o.blink && o.blink !== true ? o.blink : false;
    if (o.blink === true && o.t != null) { const per = 3.1 + (opts.seed || 0) * 0.37; blink = (o.t % per) > per - 0.12; }
    const talk = Math.round(clamp(o.talk || 0) * 4) / 4, look = (o.look || [0, 0]).map(v => Math.round(v * 6) / 6);
    const k = JSON.stringify([ex, talk, blink, look, eyeStyle, pal]);
    if (k !== faceKey) { faceKey = k; faceMat.map = faceTexture(k, (g) => drawFace(g, { eye: ex.eye, mouth: ex.mouth, talk, blink, look, style: eyeStyle, pal })); faceMat.needsUpdate = true; }
    return root;
  };
  root.lookAt3 = (pt) => {
    const hw = head.getWorldPosition(new THREE.Vector3()); const local = neck.worldToLocal(new THREE.Vector3(...pt)).sub(neck.worldToLocal(hw.clone()));
    const yaw = Math.atan2(local.x, local.z), pitch = -Math.atan2(local.y, Math.hypot(local.x, local.z));
    head.rotation.set(clamp(pitch, -0.6, 0.6), clamp(yaw, -1.1, 1.1), head.rotation.z, 'YXZ'); return root;
  };
  root.place = (x = 0, y = 0, z = 0, yaw = 0) => { root.position.set(x, y, z); root.rotation.y = yaw; return root; };
  root.faceTo = (x, z) => { root.rotation.y = Math.atan2(x - root.position.x, z - root.position.z); return root; };
  root.headWorld = () => head.getWorldPosition(new THREE.Vector3());
  root.handWorld = (side = 'L') => hands[side].g.getWorldPosition(new THREE.Vector3());
  root.chestWorld = () => chest.localToWorld(new THREE.Vector3(0, 0.3, 0));
  root.parts = { body, pelvis, chest, head, neck, hands, feet, skull, faceMesh, torso, skirt };
  root.hold = (obj, side = 'L', o = {}) => { const h = hands[side].g; h.add(obj); obj.position.set(...(o.pos || [0, -0.1, 0.04])); obj.rotation.set(...(o.rot || [0, 0, 0])); return obj; };
  root.setOpacity = (a) => { root.traverse(m => { if (m.material) [].concat(m.material).forEach(mm => { mm.transparent = a < 1; mm.opacity = a; }); }); };
  root.outfit = outfit; root.look = { skin, eyeStyle, dark };
  root.pose(opts.pose || 'stand'); root.face({ expr: opts.expr || 'neutral' });
  return root;
}
let _sole = null;
function roundedSole() { if (_sole) return _sole; const s = new THREE.Shape(); s.absellipse(0, 0, 0.064, 0.14, 0, Math.PI * 2); _sole = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }); _sole.rotateX(Math.PI / 2); _sole.translate(0, 0.03, 0); return _sole; }
