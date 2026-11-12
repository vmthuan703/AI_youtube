// engine/act10.js — 1.0.2 action library (T.act.*): whole actions as one flowing movement (flow3 splines, IK hands that ride the
// thing they touch). Every helper is a pure function of time, like walkTo: call it in draw() every frame.
//
//   one person   T.act.door(ch, door, t, {t0})          open a T.W.swingDoor by its handle (and close it: close: t)
//                T.act.carry(ch, obj, t, {from, pickAt, putAt, to})  bend, pick up, carry at the chest, put down (poses ch, moves obj)
//                T.act.sitOn(ch, t, {seat: [x, z, yaw, seatY], t0})  sit on any seat height (bench, booth, bleacher, bed, stool)
//                T.act.runStop(ch, t, {from, to, t0, t1})  run in and skid to a stop
//                T.act.trip(ch, t, {from, dir, t0})      walk, catch a foot, stumble and fall flat, hands first
//                T.act.vault(ch, t, {from, to, t0, h})    jump over a low obstacle, hands planted on it
//                T.act.climbOn(ch, t, {from, onto, t0})  step up onto a chair / bench / box
//   two people   T.act.hug(a, b, t, {t0, dur})  ·  T.act.highFive(a, b, t, {t0})  ·  T.act.armAround(a, b, t, {t0})
//                T.act.pullRun(a, b, t, {from, to, t0, t1})  ·  T.act.catchFall(a, b, t, {t0})   → [poseA, poseB] (pullRun moves both)
//   acting       T.act.gaze(ch, pose, target, k)  → { pose, look } head (and a little chest) turned to a point / person, eyes too
//                T.act.react(ch, pose, t, {t0, from, kind: 'startle' | 'turn' | 'hit'})  flinch / turn toward a sound or a hit
//                T.act.busyCrowd(st, {cast, spots, acts})  roster extras doing their own thing (talk, laugh, phone, listen, lean)
import * as THREE from 'three';
import { clamp, lerp, ease, noise } from './core.js';
import { POSES3, flow3, blendPose3, character, walkPose3 } from './rig3d.js';
import { walkTo, jump3, sitDown, reachTo, idle3, body3 } from './motion3d.js';
import { group, box, mat, cyl, sphere } from './kit3d.js';

const PI = Math.PI, R2 = PI / 2, D = 180 / PI;
const sm = (t, a, b) => { const k = clamp((t - a) / (b - a)); return k * k * (3 - 2 * k); };
const P = (o) => ({ ...POSES3.stand, ...o });
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const W = (ch, x, y, z) => ch.localToWorld(new THREE.Vector3(x, y, z));

// ================================================================ props for actions
// swingDoor({ w, h, color, frame, hinge: 'L'|'R' }) — a door on a real hinge pivot (opens toward +z, the side it faces).
// .setAngle(a) swings it (0 shut … 1.6 wide), .handle is the knob (an Object3D to reach for), .panel the moving part.
export function swingDoor(o = {}) {
  const w = o.w || 0.95, h = o.h || 2.1, hs = o.hinge === 'R' ? -1 : 1, wood = mat(o.color || '#6a4a36', { rough: 0.5, clearcoat: 0.3 }), fr = mat(o.frame || '#e8e2d8', { rough: 0.6 });
  const g = group(box(0.08, h + 0.08, 0.14, fr, -w / 2 - 0.04, (h + 0.08) / 2, 0), box(0.08, h + 0.08, 0.14, fr, w / 2 + 0.04, (h + 0.08) / 2, 0), box(w + 0.16, 0.08, 0.14, fr, 0, h + 0.04, 0));
  const pivot = new THREE.Group(); pivot.position.set(-hs * w / 2, 0, 0); pivot.userData.dynamic = true; g.add(pivot);
  const panel = box(w - 0.02, h - 0.02, 0.05, wood, hs * (w / 2), h / 2, 0); pivot.add(panel);
  const knob = sphere(0.04, mat('#d8c070', { metal: 0.8, rough: 0.3 }), hs * (w - 0.1), 1.0, 0.05, 12, 8); pivot.add(knob, sphere(0.04, mat('#d8c070', { metal: 0.8, rough: 0.3 }), hs * (w - 0.1), 1.0, -0.05, 12, 8));
  const handle = new THREE.Object3D(); handle.position.set(hs * (w - 0.1), 1.0, 0.09); pivot.add(handle);
  g.panel = pivot; g.handle = handle; g.setAngle = (a) => { pivot.rotation.y = hs * a; }; g.w = w; g.hinge = hs; return g;
}

// ================================================================ one person
// door(ch, door, t, { t0, dur, open, close, hand }) — stand ~0.6 m in front of the door, facing it. The hand reaches the knob,
// turns it, pulls the door open (the body leans back with it), lets go; close: a time to swing it shut again.
export function door(ch, dr, t, o = {}) {
  const t0 = o.t0 ?? 0.3, dur = o.dur ?? 0.9, open = o.open ?? 1.45, hand = o.hand || (dr.hinge > 0 ? 'R' : 'L');
  let a = open * ease.inOut(clamp((t - t0 - 0.25) / dur)); if (o.close != null) a *= 1 - ease.inOut(clamp((t - o.close) / 0.6));
  dr.setAngle(a); dr.updateMatrixWorld(true);
  const onK = sm(t, t0 - 0.35, t0) * (1 - sm(t, t0 + dur * 0.75, t0 + dur + 0.2)) + (o.close != null ? sm(t, o.close - 0.35, o.close) * (1 - sm(t, o.close + 0.45, o.close + 0.8)) : 0);
  const body = flow3(t, [[0, 'stand'], [t0, P({ spine: [8, 0, 0], head: [6, 0, 0] })], [t0 + dur * 0.6, P({ spine: [-6, 0, 0], head: [2, 0, 0], legL: [6, 6, 4, 0], legR: [-8, 6, 8, 0] })], [t0 + dur + 0.5, 'relaxed']]);
  const s = hand === 'R' ? -1 : 1, rest = [s * 0.2, 0.72, 0.08], grip = reachTo(ch, dr.handle.getWorldPosition(new THREE.Vector3()));
  return { ...body, ['arm' + hand]: { to: lerp3(rest, grip, onK), pole: [s * 0.7, 0.6, -0.4] }, ['hand' + hand]: onK > 0.5 ? 'grip' : 'relaxed' };
}
// carry(ch, obj, t, { from: [x,y,z], pickAt, putAt, to: [x,y,z], hold: [x,y,z] (character space), hands: 2 | 'L' | 'R' })
// Poses ch itself (call .face() after) and moves obj: bends down to it (crouch for low things), lifts it to the chest, carries it
// (walk ch with walkTo before/after — pass walk: pose to blend the legs), puts it down at `to` (bending again) at putAt.
export function carry(ch, obj, t, o = {}) {
  const pk = o.pickAt ?? 0.8, pt = o.putAt ?? Infinity, from = new THREE.Vector3(...(o.from || [0, 0.8, 0.5])), to = o.to ? new THREE.Vector3(...o.to) : null;
  const hold = o.hold || [0, 1.0, 0.36], two = (o.hands ?? 2) === 2, base = o.walk || (o.idle ? idle3(o.idle, t) : POSES3.stand);
  const low = (y) => clamp((0.95 - y) / 0.75), downA = sm(t, pk - 0.55, pk - 0.1) * (1 - sm(t, pk + 0.05, pk + 0.55)) * low(from.y), downB = to ? sm(t, pt - 0.55, pt - 0.1) * (1 - sm(t, pt + 0.05, pt + 0.55)) * low(to.y) : 0;
  const crouch = Math.max(downA, downB), pose = blendPose3(base, P({ y: -0.32, spine: [42, 0, 0], head: [-20, 0, 0], legL: [72, 12, 112, 0], legR: [72, 12, 112, 0] }), crouch * 0.9);
  ch.pose(pose); ch.updateMatrixWorld(true);
  // where the object is: on its spot → in the hands (k) → on the new spot
  const held = sm(t, pk, pk + 0.5) * (to ? 1 - sm(t, pt - 0.5, pt) : 1), holdW = W(ch, ...hold);
  const objW = t < pk ? from.clone() : t < pt || !to ? from.clone().lerp(holdW, held) : to.clone().lerp(holdW, held);
  if (to && t >= pt) objW.copy(to.clone().lerp(holdW, held));
  obj.position.copy(objW);
  const reach = Math.max(sm(t, pk - 0.55, pk - 0.05), 0) * (to ? 1 - sm(t, pt + 0.05, pt + 0.45) : 1), loc = reachTo(ch, objW), w2 = two ? 0.13 : 0;
  const arm = (s) => ({ to: lerp3([s * 0.2, 0.72, 0.08], [loc[0] + s * w2, loc[1], loc[2] - 0.04], reach), pole: [s * 0.7, 0.7, -0.4] });
  const out = { ...pose, armR: arm(-1), handR: reach > 0.5 ? 'cup' : 'relaxed' }; if (two || o.hands === 'L') { out.armL = arm(1); out.handL = reach > 0.5 ? 'cup' : 'relaxed'; }
  if (o.hands === 'L') { out.armR = pose.armR; out.handR = pose.handR; }
  ch.pose(out); return out;
}
// sitOn(ch, t, { seat: [x, z, yaw, seatY], t0, dur, up, to }) — sitDown on any seat height (character y = seatY − 0.42)
export function sitOn(ch, t, o = {}) { const s = o.seat || [0, 0, 0, 0.42]; return sitDown(ch, t, { ...o, seat: [s[0], s[1], s[2]], y: (s[3] ?? 0.42) - 0.42 }); }
// runStop(ch, t, { from, to, t0, t1, y }) — run in, plant the feet and skid the last half metre, arms thrown back, then settle
export function runStop(ch, t, o = {}) {
  const t1 = o.t1 ?? 1.4, w = walkTo(ch, t, { ...o, run: true, t1 }), skid = P({ y: -0.12, spine: [-16, 0, 0], head: [-6, 0, 0], armL: [70, 40, 30, 0], armR: [70, 40, 30, 0], legL: [36, 10, 18, 0], legR: [-6, 10, 34, 0], handL: 'open', handR: 'open' });
  const k = sm(t, t1 - 0.3, t1 - 0.05) * (1 - sm(t, t1 + 0.25, t1 + 0.8));
  return blendPose3(t < t1 + 0.25 ? w : idle3('stand', t), skid, k);
}
// trip(ch, t, { from: [x, z], dir (yaw), t0, speed, y }) — walk, catch the toe at t0, stumble forward and land flat on the
// stomach, hands out first; lies there from t0 + 0.9.
export function trip(ch, t, o = {}) {
  const t0 = o.t0 ?? 1.2, sp = o.speed ?? 1.3, yaw = o.dir ?? 0, f = [Math.sin(yaw), Math.cos(yaw)], from = o.from || [0, 0], y0 = o.y ?? 0;
  const dist = (tt) => (tt < t0 ? sp * tt : sp * t0 + (1 - Math.exp(-(tt - t0) * 3)) * 0.9);
  const d = dist(t); ch.position.set(from[0] + f[0] * d, y0, from[1] + f[1] * d); ch.rotation.y = yaw;
  if (t < t0 - 0.05) { ch.userData.mo = { v: sp, phase: t * PI * 2 * 0.9 }; return walkPose3(t * PI * 2 * 0.9); }
  return flow3(t, [[t0 - 0.05, walkPose3((t0 - 0.05) * PI * 2 * 0.9)],
    [t0 + 0.18, P({ y: -0.06, spine: [26, 0, 0], head: [-12, 0, 0], armL: [110, 30, 20, 0], armR: [100, 34, 26, 0], legL: [-30, 6, 50, 0], legR: [40, 6, 10, 0], handL: 'open', handR: 'open' })],
    [t0 + 0.45, P({ y: -0.38, hips: [40, 0, 0], spine: [30, 0, 0], head: [-30, 0, 0], armL: [150, 30, 10, 0], armR: [150, 30, 10, 0], legL: [-20, 6, 30, 0], legR: [-10, 6, 40, 0], handL: 'open', handR: 'open' })],
    [t0 + 0.9, P({ y: -0.5, hips: [88, 0, 0], spine: [4, 0, 0], head: [-40, 0, 0], armL: [170, 40, 20, 0], armR: [170, 40, 20, 0], legL: [-4, 6, 8, 0], legR: [-4, 6, 20, 0], handL: 'open', handR: 'open' })]]);
}
// vault(ch, t, { from: [x,y,z], to: [x,y,z], t0, h, air, at: [x,y,z] }) — a jump3 over an obstacle with both hands planted on
// its top (at) at the middle of the flight
export function vault(ch, t, o = {}) {
  const t0 = o.t0 ?? 0.6, air = o.air ?? 0.7, pose = jump3(ch, t, { ...o, t0, air, h: o.h ?? 0.7 });
  if (!o.at || t < t0 - 0.1 || t > t0 + air) return pose;
  const k = Math.sin(PI * clamp((t - t0 + 0.1) / (air * 0.8))), tgt = reachTo(ch, o.at), base = (s) => [s * 0.25, 0.9, 0.35];
  return { ...pose, armL: { to: lerp3(base(1), [tgt[0] + 0.15, tgt[1], tgt[2]], k), pole: [0.8, 1.0, -0.3] }, armR: { to: lerp3(base(-1), [tgt[0] - 0.15, tgt[1], tgt[2]], k), pole: [-0.8, 1.0, -0.3] }, handL: 'open', handR: 'open' };
}
// climbOn(ch, t, { from: [x, z], onto: [x, y, z], t0, dur, yaw }) — step up: first knee high, weight over it, second foot follows
export function climbOn(ch, t, o = {}) {
  const t0 = o.t0 ?? 0.3, dur = o.dur ?? 0.9, to = o.onto || [0, 0.45, 0.4], from = o.from || [to[0], to[2] - 0.45], k = clamp((t - t0) / dur);
  const lift = ease.inOut(clamp((k - 0.15) / 0.6)); ch.position.set(lerp(from[0], to[0], ease.inOut(k)), lerp(0, to[1], lift), lerp(from[1], to[2], ease.inOut(k)));
  ch.rotation.y = o.yaw ?? Math.atan2(to[0] - from[0], to[2] - from[1]);
  const hi = to[1];
  return flow3(t, [[t0, 'stand'], [t0 + dur * 0.25, P({ spine: [16, 0, 0], legL: [70 * Math.min(1, hi / 0.45), 8, 96, 0], legR: [-4, 6, 8, 0], armL: [30, 20, 40, 0], armR: [50, 20, 50, 0] })],
    [t0 + dur * 0.6, P({ y: -0.04, spine: [24, 0, 0], legL: [30, 8, 40, 0], legR: [-30, 6, 60, 0], armL: [40, 30, 40, 0], armR: [20, 30, 30, 0] })], [t0 + dur, P({ legR: [20, 6, 40, 0] })], [t0 + dur + 0.4, 'relaxed']]);
}

// ================================================================ two people (place them first: facing each other ~0.5–0.7 m apart, or side by side)
export function hug(a, b, t, o = {}) {
  const t0 = o.t0 ?? 0.3, dur = o.dur ?? 1.4;
  const H = (hi) => P({ spine: [10, 0, 0], head: [6, hi ? 28 : -28, 0], armL: { to: [0.2, hi ? 1.18 : 1.02, 0.42], pole: [0.8, 1.0, -0.2] }, armR: { to: [-0.2, hi ? 1.08 : 0.98, 0.44], pole: [-0.8, 1.0, -0.2] }, handL: 'open', handR: 'open' });
  const open = P({ spine: [-4, 0, 0], armL: { to: [0.45, 1.2, 0.3], pole: [0.8, 0.9, -0.3] }, armR: { to: [-0.45, 1.2, 0.3], pole: [-0.8, 0.9, -0.3] }, handL: 'open', handR: 'open' });
  const rest = P({ armL: { to: [0.2, 0.72, 0.08] }, armR: { to: [-0.2, 0.72, 0.08] } });
  const keys = (hi) => [[0, rest], [t0, rest], [t0 + 0.35, open], [t0 + 0.75, H(hi)], [t0 + 0.75 + dur, H(hi)], [t0 + 1.25 + dur, rest]];
  return [flow3(t, keys(true)), flow3(t, keys(false))];
}
export function highFive(a, b, t, o = {}) {
  const t0 = o.t0 ?? 0.8; a.updateMatrixWorld(true); b.updateMatrixWorld(true);
  const mid = a.position.clone().lerp(b.position, 0.5).setY(Math.max(a.position.y, b.position.y) + 1.62);
  const one = (ch, hand) => { const s = hand === 'R' ? -1 : 1, c = reachTo(ch, mid), arm = (to, sp = [0, 0, 0], hd = 'open') => P({ spine: sp, ['arm' + hand]: { to, pole: [s * 0.8, 1.0, -0.4] }, ['hand' + hand]: hd });
    return flow3(t, [[0, arm([s * 0.2, 0.72, 0.08], [0, 0, 0], 'relaxed')], [t0 - 0.55, arm([s * 0.2, 0.72, 0.08], [0, 0, 0], 'relaxed')], [t0 - 0.2, arm([s * 0.24, 1.66, 0.06], [-4, 0, 0])],
      [t0, arm(c, [6, 0, 0])], [t0 + 0.16, arm([c[0], c[1] + 0.05, c[2] - 0.1], [-4, 0, 0])], [t0 + 0.85, arm([s * 0.2, 0.74, 0.1], [0, 0, 0], 'relaxed')]]); };
  return [one(a, 'R'), one(b, 'R')];
}
export function armAround(a, b, t, o = {}) {
  const t0 = o.t0 ?? 0.4; a.updateMatrixWorld(true); b.updateMatrixWorld(true);
  const rel = reachTo(a, b.position.clone()), s = rel[0] > 0 ? 1 : -1, hand = s > 0 ? 'L' : 'R';
  const farShoulder = b.localToWorld(new THREE.Vector3(-s * 0.18 * (b.position.x === b.position.x ? 1 : 1), 1.1, -0.02)); const tgt = reachTo(a, farShoulder);
  const k = sm(t, t0, t0 + 0.6), rest = [s * 0.2, 0.72, 0.08];
  const pa = { ...flow3(t, [[0, 'stand'], [t0, 'stand'], [t0 + 0.6, P({ spine: [0, 0, s * 6], head: [0, s * 14, s * 6] })]]), ['arm' + hand]: { to: lerp3(rest, tgt, k), pole: [s * 0.4, 1.6, -0.6] }, ['hand' + hand]: 'open' };
  const pb = flow3(t, [[0, 'stand'], [t0 + 0.3, 'stand'], [t0 + 0.8, P({ spine: [0, 0, -s * 5], head: [0, -s * 12, -s * 5] })]]);
  return [pa, pb];
}
export function pullRun(a, b, t, o = {}) {
  const pa = walkTo(a, t, { ...o, run: true }), pb = walkTo(b, t, { ...o, from: o.from.map((v, i) => v - (i ? 0.75 : 0.3)), to: o.to.map((v, i) => v - (i ? 0.75 : 0.3)), t0: (o.t0 ?? 0) + 0.08, t1: (o.t1 ?? 2) + 0.08, run: true });
  a.updateMatrixWorld(true); b.updateMatrixWorld(true);
  const ha = a.localToWorld(new THREE.Vector3(-0.28, 0.98, -0.42)), hb = b.localToWorld(new THREE.Vector3(0.28, 1.0, 0.42)), mid = ha.lerp(hb, 0.5);
  return [{ ...pa, armR: { to: reachTo(a, mid), pole: [-0.8, 0.8, 0.2] }, handR: 'grip' }, { ...pb, armL: { to: reachTo(b, mid), pole: [0.8, 0.8, -0.2] }, handL: 'grip' }];
}
// catchFall(a, b, t, { t0 }) — b (in front, facing away from a) faints backwards at t0; a, behind, catches b under the arms.
// Tilts b's root about the feet (sets b.rotation.order 'YXZ' and b.rotation.x; the facing in rotation.y is kept).
export function catchFall(a, b, t, o = {}) {
  const t0 = o.t0 ?? 0.8, k = ease.inOut(clamp((t - t0) / 0.55)), tilt = -0.62 * k; b.rotation.order = 'YXZ'; b.rotation.x = tilt;   // yaw first, then the backward tilt about the feet
  const pb = blendPose3(POSES3.stand, P({ spine: [-10, 0, 0], head: [-26, 0, 0], armL: [40, 60, 30, 0], armR: [40, 60, 30, 0], legL: [8, 6, 20, 0], legR: [8, 6, 20, 0], handL: 'open', handR: 'open' }), k);
  b.updateMatrixWorld(true); a.updateMatrixWorld(true);
  const pts = [b.localToWorld(new THREE.Vector3(0.2, 1.05, -0.12)), b.localToWorld(new THREE.Vector3(-0.2, 1.05, -0.12))];
  const reach = sm(t, t0 - 0.2, t0 + 0.35), rest = (s) => [s * 0.25, 0.95, 0.3];
  const pa = { ...blendPose3(P({ armL: [40, 20, 40, 0], armR: [40, 20, 40, 0] }), P({ y: -0.14, spine: [18, 0, 0], legL: [30, 10, 40, 0], legR: [-10, 10, 30, 0] }), k),
    armL: { to: lerp3(rest(1), reachTo(a, pts[0]), reach), pole: [0.9, 0.6, -0.3] }, armR: { to: lerp3(rest(-1), reachTo(a, pts[1]), reach), pole: [-0.9, 0.6, -0.3] }, handL: 'open', handR: 'open' };
  return [pa, pb];
}

// ================================================================ acting
// gaze(ch, pose, target, k = 1) — turn the head (and a little of the chest past ±40°) toward a world point or a character's
// head; returns { pose, look } (pass look to face({ look })) so the eyes lead the head
export function gaze(ch, pose, target, k = 1) {
  const p = target?.headWorld ? target.headWorld() : target?.isVector3 ? target : new THREE.Vector3(...target);
  const l = reachTo(ch, p), headY = 1.45 + (pose.y || 0), yaw = Math.atan2(l[0], l[2]) * D, pitch = -Math.atan2(l[1] - headY, Math.hypot(l[0], l[2])) * D;
  const hy = clamp(yaw, -60, 60) * k, sy = clamp(yaw - hy, -30, 30) * k * 0.6, hp = clamp(pitch, -30, 35) * k;
  const out = { ...pose, head: [(pose.head?.[0] || 0) * (1 - k) + hp, (pose.head?.[1] || 0) * (1 - k) + hy * 0.85, pose.head?.[2] || 0], spine: [pose.spine?.[0] || 0, (pose.spine?.[1] || 0) + sy, pose.spine?.[2] || 0] };
  return { pose: out, look: [clamp(yaw / 70, -1, 1) * k, clamp(-pitch / 40, -1, 1) * k] };
}
// react(ch, pose, t, { t0, from, kind }) — 'startle': a jolt (shoulders up, hands up, a tiny hop) and the head snaps to `from`;
// 'turn': just turns to look; 'hit': knocked back a step from `from`. Decays over ~1.2 s, the look stays.
export function react(ch, pose, t, o = {}) {
  const t0 = o.t0 ?? 1, kind = o.kind || 'startle'; if (t < t0) return { pose, look: null };
  const u = t - t0, jolt = Math.exp(-u * 4) * Math.min(1, u / 0.06), turnK = ease.out(clamp(u / 0.25));
  let p = pose;
  if (kind !== 'turn') p = blendPose3(pose, kind === 'hit' ? P({ y: -0.04, spine: [-18, 0, 0], head: [-20, 0, 0], armL: [60, 50, 60, 0], armR: [60, 50, 60, 0], handL: 'open', handR: 'open' }) : P({ y: 0.03, spine: [-8, 0, 0], armL: [70, 30, 110, 0], armR: [70, 30, 110, 0], handL: 'open', handR: 'open' }), jolt);
  return o.from ? gaze(ch, p, o.from, turnK) : { pose: p, look: null };
}
// busyCrowd(st, { cast: [...roster outfits], spots: [[x, z, yaw], …], acts: ['talk', 'laugh', 'phone', 'listen', 'lean'], y })
// extras that look alive: each one does its act on a loop, glances at the nearest neighbour, blinks; they tick themselves.
export function busyCrowd(st, o = {}) {
  const cast = o.cast || [], spots = o.spots || [], acts = o.acts || ['talk', 'listen', 'laugh', 'phone', 'lean', 'listen'], out = [];
  spots.forEach((sp, i) => { const ch = character(cast[i % cast.length]); ch.position.set(sp[0], o.y ?? 0, sp[1]); ch.rotation.y = sp[2] ?? 0; st.add(ch); out.push(ch); });
  const near = out.map((c, i) => { let best = null, bd = 9; out.forEach((d, j) => { if (j !== i) { const dd = c.position.distanceTo(d.position); if (dd < bd) { bd = dd; best = d; } } }); return bd < 2.5 ? best : null; });
  st.onTick((t) => out.forEach((ch, i) => { const act = acts[i % acts.length], sd = i * 7 + 3;
    let pose = act === 'phone' ? idle3('phone', t, { seed: sd }) : act === 'lean' ? idle3('crossArmsLean', t, { seed: sd }) : act === 'laugh' ? body3('relaxed', t, 'laugh', 0.4 + 0.4 * Math.max(0, noise(t * 0.5, sd)), { seed: sd }) : act === 'talk' ? idle3(Math.sin(t * 0.9 + sd) > 0 ? 'talk' : 'explain', t, { seed: sd }) : idle3('relaxed', t, { seed: sd });
    let look = null; if (near[i] && act !== 'phone') { const g = gaze(ch, pose, near[i], 0.8); pose = g.pose; look = g.look; }
    ch.pose(pose); ch.face?.({ expr: act === 'laugh' ? 'joy' : act === 'talk' ? 'smile' : 'neutral', t: t + sd, blink: true, look: look || [0, 0], talk: act === 'talk' ? Math.max(0, noise(t * 6, sd)) : 0 }); }));
  return out;
}
