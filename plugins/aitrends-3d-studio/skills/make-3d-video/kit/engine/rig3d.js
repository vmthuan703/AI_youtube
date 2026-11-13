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
import { S, clamp, lerp, mixVal, ease, prog, noise, shade, hash01, talkShape } from './core.js';
import { mat, LEGACY } from './kit3d.js';
import { dressUp } from './costume3d.js';

const D2R = Math.PI / 180;
// body proportions (metres). Head is big on purpose (cartoon stick figure).
export const BODY = { hipY: 0.62, headR: 0.27, neck: 0.085, chestH: 0.47, shoulderX: 0.175, shoulderY: 0.40, hipX: 0.085, upperArm: 0.26, foreArm: 0.24, thigh: 0.29, shin: 0.27, ankleY: 0.06, limbR: 0.03 };
// 2.0.1 body: the same head and face on a taller, more natural figure: legs 12 cm longer, a longer neck, wider shoulders, a waist,
// hips a little wider apart. About 3.45 heads tall (was 3.2). Seated poses keep their seat height (see pose()).
export const BODY2 = { ...BODY, hipY: 0.74, neck: 0.11, shoulderX: 0.2, shoulderY: 0.41, hipX: 0.1, thigh: 0.35, shin: 0.33 };
// which body a character gets: outfit.build 1 | 2; otherwise 2 on the film style (cine), 1 on older styles and with --legacy
export const build2 = (outfit = {}) => outfit.build ? outfit.build >= 2 : (!LEGACY && !!S().cine);
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const smin = (a, b, k = 0.02) => { const m = Math.min(a, b); return m - k * Math.log(Math.exp((m - a) / k) + Math.exp((m - b) / k)); };

// ---------------------------------------------------------------- poses
// Pose = { y, hips:[pitch,yaw,roll], spine:[pitch,yaw,roll], head:[pitch,yaw,roll],
//          armL/armR: [raise, az, bend, twist] | {to:[x,y,z], pole?:[x,y,z]},     (character space, metres)
//          legL/legR: [lift, side, knee, twist] | {to:[x,y,z], pole?:[x,y,z]},
//          handL/handR: 'fist'|'open'|'point'|'relaxed', foot? }
// Degrees. pitch + = lean/nod forward; yaw + = turn to the character's LEFT; arm raise 0 = hanging, 90 = horizontal,
// 180 = straight up; az 0 = forward, 90 = out to the side, negative = across the body; bend = elbow flex.
// Leg lift + = thigh forward, side + = outward, knee + = bend. L = character's left (+x side when facing +z).
const P = (o) => ({ y: 0, hips: [0, 0, 0], spine: [0, 0, 0], head: [0, 0, 0], armL: [6, 12, 12, 0], armR: [6, 12, 12, 0], legL: [0, 3, 2, 0], legR: [0, 3, 2, 0], handL: 'relaxed', handR: 'relaxed', ...o });
// 1.0.3 finger gestures (hand modes): f = which of index, middle, ring, pinky stand up; thumb 'out' | 'up' | 'in' (folded over
// the palm); palm 'front' (to the viewer) or 'mid' (toward the body's middle, for thumbs up / down).
// 1.0.3: furniture tops a hand can rest on, [minX, maxX, minZ, maxZ, topY] in world space, collected once per scene (before the
// static meshes are merged; kit3d optimize() calls this first). Thin legs, walls, floors and tall cabinets are left out.
export function restBoxes(scene) {
  if (scene.userData.restBoxes) return scene.userData.restBoxes;
  const out = [], bb = new THREE.Box3(); scene.updateMatrixWorld(true);
  scene.traverse(m => { if (!m.isMesh || !m.visible || m.isInstancedMesh || m.material?.transparent) return;
    for (let q = m; q; q = q.parent) if (q.name === 'character' || q.userData?.dynamic || q.userData?.noRest) return;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); bb.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);
    const sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z;
    if (bb.max.y < 0.3 || bb.max.y > 1.35 || sx > 5 || sz > 5 || sy > 1.4 || sx < 0.08 || sz < 0.08) return;
    out.push([bb.min.x, bb.max.x, bb.min.z, bb.max.z, bb.max.y]); });
  return (scene.userData.restBoxes = out);
}
export const FINGERS = {
  count1: { f: [1, 0, 0, 0], thumb: 'in' }, count2: { f: [1, 1, 0, 0], thumb: 'in' }, count3: { f: [1, 1, 1, 0], thumb: 'in' },
  count4: { f: [1, 1, 1, 1], thumb: 'in' }, count5: { f: [1, 1, 1, 1], thumb: 'out', spread: 0.12 }, spread: { f: [1, 1, 1, 1], thumb: 'out', spread: 0.2 },
  peace: { f: [1, 1, 0, 0], thumb: 'in', spread: 0.5 }, pointUp: { f: [1, 0, 0, 0], thumb: 'in' }, rock: { f: [1, 0, 0, 1], thumb: 'in' },
  thumbsUp: { f: [0, 0, 0, 0], thumb: 'up', palm: 'mid', thumbTo: 'up' }, thumbsDown: { f: [0, 0, 0, 0], thumb: 'up', palm: 'mid', thumbTo: 'down' },
};
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
  // 1.0: at a school desk (T.W.classroom, top 0.645): forearms lie flat on the desk top, elbows on it, hands together
  sitStudy: P({ y: -0.2, spine: [14, 0, 0], head: [6, 0, 0], legL: [88, 6, 88, 0], legR: [88, 6, 88, 0], armL: [72, -12, 20, 0], armR: [72, -12, 20, 0], handL: 'open', handR: 'open' }),
  // 0.2.8: kneeling, sitting on a bed / the floor, folded arms, lifting. sitBed puts the hips at 0.58 (T.W.bed top); sitFloor and hugKnees at the floor.
  kneelBoth: P({ y: -0.33, spine: [4, 0, 0], legL: [0, 5, 98, 0], legR: [0, 5, 98, 0], armL: [14, 14, 24, 0], armR: [14, 14, 24, 0] }),
  kneelSad: P({ y: -0.36, spine: [28, 0, 0], head: [24, 0, 0], legL: [-4, 5, 110, 0], legR: [-4, 5, 110, 0], armL: { to: [0.16, 0.36, 0.22] }, armR: { to: [-0.16, 0.36, 0.22] }, handL: 'open', handR: 'open' }),
  kneelPlead: P({ y: -0.33, spine: [-4, 0, 0], head: [-10, 0, 0], legL: [0, 5, 98, 0], legR: [0, 5, 98, 0], armL: { to: [0.05, 0.92, 0.32] }, armR: { to: [-0.05, 0.92, 0.32] }, handL: 'open', handR: 'open' }),
  sitBed: P({ y: -0.04, spine: [6, 0, 0], legL: [82, 7, 84, 0], legR: [82, 7, 84, 0], armL: { to: [0.15, 0.62, 0.3] }, armR: { to: [-0.15, 0.62, 0.3] }, handL: 'open', handR: 'open' }),
  sitBedSad: P({ y: -0.04, spine: [30, 0, 0], head: [18, 0, 0], legL: [82, 7, 84, 0], legR: [82, 7, 84, 0], armL: { to: [0.12, 0.68, 0.36] }, armR: { to: [-0.12, 0.68, 0.36] }, handL: 'relaxed', handR: 'relaxed' }),
  sitBedPhone: P({ y: -0.04, spine: [18, 0, 0], head: [22, 0, 0], legL: [82, 7, 84, 0], legR: [82, 7, 84, 0], armL: { to: [0.06, 0.88, 0.3] }, armR: { to: [-0.06, 0.86, 0.3] }, handL: 'open', handR: 'open' }),
  sitFloor: P({ y: -0.56, spine: [-8, 0, 0], legL: [86, 8, 14, 0], legR: [86, 8, 14, 0], armL: { to: [0.2, 0.06, -0.2] }, armR: { to: [-0.2, 0.06, -0.2] }, handL: 'open', handR: 'open' }),
  hugKnees: P({ y: -0.5, spine: [22, 0, 0], head: [14, 0, 0], legL: [118, 4, 150, 0], legR: [118, 4, 150, 0], armL: { to: [0.04, 0.36, 0.34] }, armR: { to: [-0.04, 0.36, 0.34] }, handL: 'fist', handR: 'fist' }),
  crossArmsAngry: P({ spine: [-4, 0, 0], head: [-6, 0, 0], armL: [44, -64, 116, 0], armR: [42, -64, 110, 0], legL: [0, 9, 2, 0], legR: [0, 9, 2, 0] }),
  crossArmsLean: P({ hips: [0, 0, 4], spine: [-6, 0, -6], head: [0, 0, 6], armL: [40, -60, 110, 0], armR: [38, -60, 105, 0], legL: [8, 4, 4, 0], legR: [-4, 12, 2, 0] }),
  armsBehindHead: P({ spine: [-6, 0, 0], armL: [160, 70, 140, 0], armR: [160, 70, 140, 0] }),
  liftSquat: P({ y: -0.25, spine: [30, 0, 0], head: [-16, 0, 0], legL: [60, 12, 90, 0], legR: [60, 12, 90, 0], armL: { to: [0.3, 0.55, 0.35] }, armR: { to: [-0.3, 0.55, 0.35] }, handL: 'fist', handR: 'fist' }),
  liftOverhead: P({ spine: [-6, 0, 0], legL: [10, 14, 10, 0], legR: [-6, 14, 10, 0], armL: { to: [0.3, 2.0, 0.05] }, armR: { to: [-0.3, 2.0, 0.05] }, handL: 'fist', handR: 'fist' }),
  pushHeavy: P({ spine: [34, 0, 0], head: [-24, 0, 0], legL: [40, 6, 40, 0], legR: [-30, 6, 10, 0], armL: { to: [0.22, 1.2, 0.6] }, armR: { to: [-0.22, 1.2, 0.6] }, handL: 'open', handR: 'open' }),
  lie: P({ y: -0.5, hips: [-90, 0, 0], armL: [10, 30, 10, 0], armR: [10, 30, 10, 0], legL: [0, 4, 4, 0], legR: [0, 4, 4, 0] }),
  jump: P({ y: 0.22, spine: [-6, 0, 0], armL: [145, 65, 20, 0], armR: [145, 65, 20, 0], legL: [40, 8, 70, 0], legR: [20, 8, 90, 0] }),
  fall: P({ y: -0.1, spine: [-25, 0, 10], armL: [120, 80, 30, 0], armR: [130, 70, 20, 0], handL: 'open', handR: 'open', legL: [40, 15, 30, 0], legR: [10, 15, 50, 0] }),
  superLand: P({ y: -0.3, spine: [35, 0, 0], head: [-25, 0, 0], armL: [60, -10, 10, 0], armR: [30, 60, 20, 0], handL: 'open', handR: 'fist', legL: [80, 12, 120, 0], legR: [-20, 15, 120, 0] }),
  flexL: P({ armL: [90, 85, 120, -90], handL: 'fist' }),
  // role poses (costume3d.js): an older body, a cane in the right hand (outfit.prop 'cane'), hands on hips, hands on the belt, a microphone
  hunch: P({ spine: [16, 0, 0], head: [-14, 0, 0], armL: [10, 5, 30, 0], armR: [10, 5, 30, 0], legL: [6, 4, 10, 0], legR: [6, 4, 10, 0] }),
  hunchCane: P({ spine: [16, 0, 0], head: [-14, 0, 0], armL: [10, 5, 30, 0], armR: { to: [-0.27, 0.68, 0.14] }, handR: 'fist', legL: [6, 4, 10, 0], legR: [6, 4, 10, 0] }),
  handsOnHips: P({ spine: [-4, 0, 0], armL: { to: [0.23, 0.64, 0.0], pole: [0.6, 0.9, -0.3] }, armR: { to: [-0.23, 0.64, 0.0], pole: [-0.6, 0.9, -0.3] }, handL: 'fist', handR: 'fist', legL: [0, 8, 0, 0], legR: [0, 8, 0, 0] }),
  handsOnBelt: P({ spine: [-3, 0, 0], armL: { to: [0.2, 0.6, 0.06] }, armR: { to: [-0.2, 0.6, 0.06] }, handL: 'fist', handR: 'fist' }),
  holdMic: P({ armL: [62, 12, 118, 0], handL: 'fist' }),
  // 1.0.1 US high school: class, lockers, cafeteria, sports, weather. Seated ones match T.W.classroom / library chairs (hips 0.42).
  // 1.0.3 gesture poses (right hand; for the left hand set armL / handL yourself). Pass the count with handR: 'count3'…
  showCount: P({ spine: [-2, 0, 0], head: [-3, -6, 0], armR: { to: [-0.44, 1.12, 0.36], pole: [-0.8, 0.7, -0.2] }, handR: 'count1', armL: [8, 18, 14, 0] }),
  thumbsUp: P({ spine: [-3, 0, 0], head: [-4, -4, 0], armR: { to: [-0.3, 1.0, 0.46], pole: [-0.7, 0.55, 0.0] }, handR: 'thumbsUp', armL: [8, 18, 14, 0] }),
  peaceSign: P({ spine: [-2, 0, 4], head: [-2, -8, 6], armR: { to: [-0.42, 1.2, 0.34], pole: [-0.8, 0.75, -0.2] }, handR: 'peace', armL: [8, 18, 14, 0] }),
  raiseHand: P({ spine: [-2, 0, 6], head: [-4, 0, -4], armL: [162, 42, 0, 0], handL: 'open' }),   // big heads: the hand goes out beside the head, not over it
  sitRaiseHand: P({ y: -0.2, spine: [6, 0, 6], head: [-4, 0, 0], legL: [88, 6, 88, 0], legR: [88, 6, 88, 0], armL: [160, 44, 0, 0], armR: [72, -12, 20, 0], handL: 'open', handR: 'open' }),
  sleepDesk: P({ y: -0.2, spine: [52, 0, 0], head: [26, 18, 8], legL: [88, 6, 88, 0], legR: [88, 6, 88, 0], armL: [86, -42, 122, 0], armR: [86, -42, 122, 0], handL: 'relaxed', handR: 'relaxed' }),
  passNote: P({ y: -0.2, spine: [12, -14, 0], head: [6, 22, 0], legL: [88, 6, 88, 0], legR: [88, 6, 88, 0], armL: [72, -12, 20, 0], armR: [72, 82, 8, 0], handL: 'open', handR: 'open' }),
  copyPeek: P({ y: -0.2, spine: [16, 10, 0], head: [10, 38, 4], legL: [88, 6, 88, 0], legR: [88, 6, 88, 0], armL: [72, -12, 20, 0], armR: [72, -12, 20, 0], handL: 'open', handR: 'open' }),
  sitSlouch: P({ y: -0.25, spine: [-20, 0, 0], head: [-4, 0, 8], legL: [68, 12, 34, 0], legR: [72, 8, 40, 0], armL: [10, 30, 10, 0], armR: [12, 26, 12, 0] }),
  writeBoard: P({ spine: [-2, 14, 0], head: [-8, 10, 0], armL: [118, 8, 46, 0], armR: [8, 12, 14, 0], handL: 'fist' }),
  holdBooks: P({ head: [4, 0, 0], armL: { to: [0.08, 1.02, 0.2], pole: [0.6, 0.7, -0.2] }, armR: { to: [-0.08, 0.94, 0.22], pole: [-0.6, 0.7, -0.2] }, handL: 'open', handR: 'open' }),
  holdTray: P({ head: [8, 0, 0], armL: { to: [0.17, 0.86, 0.38], pole: [0.6, 0.6, -0.3] }, armR: { to: [-0.17, 0.86, 0.38], pole: [-0.6, 0.6, -0.3] }, handL: 'open', handR: 'open' }),
  // oneStrap: only with a backpack on (outfit bag); without one the folded arm reads as broken
  oneStrap: P({ spine: [-2, 0, 0], armR: { to: [-0.11, 1.12, 0.12], pole: [-0.6, 0.8, -0.2] }, handR: 'fist', armL: [8, 16, 14, 0] }),
  dialLocker: P({ spine: [6, 0, 0], head: [14, 0, 0], armL: { to: [0.04, 1.2, 0.42] }, armR: [12, 14, 20, 0], handL: 'point' }),
  slamLocker: P({ spine: [4, 24, 0], head: [-4, -12, 0], armL: [84, 52, 6, 0], armR: [16, 20, 30, 0], handL: 'open', legL: [12, 8, 8, 0], legR: [-8, 8, 6, 0] }),
  holdUmbrella: P({ armR: { to: [-0.04, 1.22, 0.24], pole: [-0.6, 0.8, -0.2] }, handR: 'fist', armL: [8, 14, 14, 0] }),
  shareUmbrella: P({ head: [-6, 0, 0], armL: { to: [0.06, 1.5, 0.16], pole: [0.6, 1.0, -0.2] }, handL: 'fist', armR: [8, 14, 14, 0] }),
  throwWind: P({ spine: [-8, -28, 0], head: [0, 26, 0], armR: [150, 62, 96, 0], armL: [70, 10, 20, 0], handR: 'fist', handL: 'open', legL: [22, 8, 10, 0], legR: [-14, 8, 12, 0] }),
  throwRelease: P({ spine: [14, 22, 0], head: [-4, -16, 0], armR: [96, -12, 6, 0], armL: [40, 40, 40, 0], handR: 'open', legL: [28, 8, 16, 0], legR: [-24, 8, 10, 0] }),
  carryBall: P({ spine: [6, 0, 0], armR: { to: [-0.15, 0.96, 0.13], pole: [-0.6, 0.5, -0.3] }, handR: 'fist', armL: [24, 20, 40, 0] }),
  pomHigh: P({ spine: [-6, 0, 0], head: [-10, 0, 0], armL: [158, 48, 4, 0], armR: [158, 48, 4, 0], handL: 'fist', handR: 'fist', legL: [0, 12, 0, 0], legR: [0, 12, 0, 0] }),
  pomLow: P({ spine: [2, 0, 0], armL: [42, 66, 4, 0], armR: [42, 66, 4, 0], handL: 'fist', handR: 'fist', legL: [0, 12, 0, 0], legR: [0, 12, 0, 0] }),
  capToss: P({ y: 0.04, spine: [-12, 0, 0], head: [-22, 0, 0], armL: [172, 26, 4, 0], armR: [172, 26, 4, 0], handL: 'open', handR: 'open', legL: [6, 6, 6, 0], legR: [-4, 6, 6, 0] }),
  duckCover: P({ y: -0.4, spine: [62, 0, 0], head: [24, 0, 0], legL: [96, 10, 128, 0], legR: [96, 10, 128, 0], armL: [150, 68, 128, 10], armR: [150, 68, 128, 10], handL: 'open', handR: 'open' }),
  sitBleacher: P({ y: -0.2, spine: [8, 0, 0], legL: [80, 10, 80, 0], legR: [80, 10, 80, 0], armL: { to: [0.16, 0.5, 0.36] }, armR: { to: [-0.16, 0.5, 0.36] }, handL: 'fist', handR: 'fist' }),
  atPodium: P({ spine: [6, 0, 0], head: [-4, 0, 0], armL: { to: [0.2, 1.1, 0.3], pole: [0.6, 0.7, -0.3] }, armR: { to: [-0.2, 1.1, 0.3], pole: [-0.6, 0.7, -0.3] }, handL: 'open', handR: 'open' }),   // hands on a lectern 0.25 m ahead (T.W.auditorium podium)
  sitBooth: P({ y: -0.2, spine: [6, 0, 0], legL: [88, 6, 88, 0], legR: [88, 6, 88, 0], armL: { to: [0.16, 0.78, 0.4] }, armR: { to: [-0.16, 0.78, 0.4] }, handL: 'open', handR: 'open' }),
};

for (const [n, p] of Object.entries(POSES3)) for (const k of ['armL', 'armR']) if (p[k] && p[k].to && !['atPodium', 'dialLocker'].includes(n)) p[k].rel = 1;   // 2.0.1

// ---------------------------------------------------------------- cycles
// walkPose3(phase, {run, sprint, swing}) — one stride per 2π. Move the character at ~1.3 m/s (walk), 4 m/s (run), 9 m/s (sprint)
// with phase = t * 2π * cadence (walk 0.9 Hz, run 1.4 Hz, sprint 1.9 Hz). Includes the vertical bob (pose.y).
// 2.0.1 gait: the feet are placed, not swung. Each foot follows a path in body space: on the floor it slides back at exactly
// the walking speed (so it stays put in the world), rolls heel -> flat -> heel up -> toe-off, then swings forward clear of the
// floor and reaches out heel first. The hips ride as high as the legs allow (they dip as the feet spread), drop on the swing
// side and sway over the standing foot; the chest turns against the hips; the head stays level; the arms swing from the
// shoulder a beat behind the legs, elbows trailing. o.stride = metres per cycle in body units (walkTo sets it from the speed).
export function walkPose2(ph, o = {}) {
  const B = BODY2, Lg = B.thigh + B.shin, sprint = !!o.sprint, run = sprint || !!o.run;
  const beta = sprint ? 0.27 : run ? 0.32 : 0.6, stride = o.stride ?? (sprint ? 3.4 : run ? 2.4 : 1.3) * Lg, D = stride * beta;
  const am = clamp(o.amp ?? 1, 0.3, 1), lift = (sprint ? 0.3 : run ? 0.24 : 0.075) * (run ? am * am : am), toeOff = (run ? 38 : 30) * am, heel = (run ? 6 : 15) * am, zc = run ? (sprint ? 0.22 : 0.2) - D / 2 : 0;   // a runner lands just ahead of the hips and pushes off far behind   // amp < 1: shorter, flatter steps while speeding up / slowing down
  const raise = (a) => a < 0 ? 0.12 * Math.sin(-a * D2R) : 0.095 * Math.sin(a * D2R);
  const leg = (q, s) => {
    const u = ((q / (2 * Math.PI)) % 1 + 1) % 1; let z, y, pitch, st = 0, g = 1;   // g: how much this foot limits the hips (on the floor 1, mid-swing 0)
    if (u < beta) { const v = u / beta; st = Math.sin(Math.PI * v); z = zc + D * (0.5 - v);
      pitch = run ? heel * (1 - smooth(v / 0.25)) - toeOff * smooth((v - 0.45) / 0.55) : heel * (1 - smooth(v / 0.16)) - toeOff * smooth((v - 0.55) / 0.45);
      y = B.ankleY + raise(pitch); }
    else { const v = (u - beta) / (1 - beta), e = 0.5 - 0.5 * Math.cos(Math.PI * v); g = Math.max(1 - smooth(v / 0.3), smooth((v - 0.75) / 0.25));
      z = zc + D * (e - 0.5) - (run ? 0.18 * am * am * Math.sin(Math.PI * Math.min(1, v * 1.5)) * (1 - v) : 0);
      pitch = lerp(-toeOff, heel, smooth(v * 1.2)) + (run ? 0 : 6 * Math.sin(Math.PI * v));
      y = B.ankleY + raise(pitch) + lift * Math.pow(Math.sin(Math.PI * (1 - Math.pow(1 - v, run ? 1.45 : 1.25))), 1.3); }
    return { x: s * (run ? 0.072 : 0.09), y, z, pitch, st, g };
  };
  const fL = leg(ph, 1), fR = leg(ph + Math.PI, -1), stMax = Math.max(fL.st, fR.st);
  let H = B.hipY - (run ? 0.035 + 0.04 * stMax - 0.035 * (1 - stMax) : 0.008);
  for (const [f, s] of [[fL, 1], [fR, -1]]) { const dx = f.x - s * B.hipX, r2 = (0.972 * Lg) ** 2 - dx * dx - f.z * f.z; H = smin(H, f.y + Math.sqrt(Math.max(r2, 0)) + (1 - f.g) * 0.6, 0.012); }
  const fz = (fL.z - fR.z) / Math.max(D, 0.05), w = fL.st - fR.st;
  // arms: a beat behind the legs (shoulder 0.3 rad, elbow 0.6 rad)
  const lagz = (d) => { const a = leg(ph - d, 1), b = leg(ph + Math.PI - d, -1); return (a.z - b.z) / Math.max(D, 0.05); };
  const a1 = -lagz(0.3), a2 = -lagz(0.6), lean = (sprint ? 22 : run ? 12 : 3) * (o.lean ?? 1);
  const arm = (a, b, s) => run ? [(sprint ? 20 : 16) + (sprint ? 58 : 46) * a, 14 - 8 * a, 86 - 16 * a + 10 * Math.max(0, -b), 0]
    : [4 + 25 * a, 12 - 9 * Math.max(0, a), 14 + 24 * Math.max(0, b) + 4 * Math.max(0, -b), 0];
  return P({ y: H - B.hipY, sx: (run ? 0.008 : 0.02) * w,
    hips: [run ? 4 : 1, -6 * fz * (run ? 1.3 : 1), (run ? 2.5 : 4) * w],
    spine: [lean + (run ? 0 : 1.2 * Math.cos(2 * ph)), 10 * fz * (run ? 1.3 : 1), -2.5 * w],
    head: [-lean * 0.7 - 2, -4 * fz, -1.2 * w],
    armL: arm(a1, a2, 1), armR: arm(-a1, -a2, -1), handL: run ? 'fist' : 'relaxed', handR: run ? 'fist' : 'relaxed',
    legL: { to: [fL.x, fL.y, fL.z], pole: [0.2, 0.45, 1.3] }, legR: { to: [fR.x, fR.y, fR.z], pole: [-0.2, 0.45, 1.3] }, footL: fL.pitch, footR: fR.pitch });
}
export function walkPose3(ph, o = {}) {
  if (o.v2 ?? build2()) return walkPose2(ph, o);   // 2.0.1
  const run = o.sprint ? 1.35 : o.run ? 1 : 0, s = Math.sin(ph), c = Math.cos(ph), s2 = Math.abs(Math.sin(ph));
  // 1.0 walk: a looser gait. The swinging knee folds up to ~65°, the landing knee gives a little (loading), the stance leg
  // pushes off behind, the pelvis turns and rolls, the chest counter-turns, the head stays steady, the arms swing from the shoulder.
  if (!run) { const sw = (x) => Math.pow(clamp(x), 1.35), load = (x) => Math.pow(clamp(x), 6);
    const knee = (q) => 7 + 58 * sw(-Math.sin(q - 1.15)) + 12 * load(Math.cos(q - 2.05)), thigh = (q) => 3 + 27 * Math.sin(q) - 6 * load(-Math.sin(q + 0.5));
    return P({ y: -0.028 + 0.034 * Math.abs(c) ** 1.5, spine: [4, 7 * s, -1.5 * c], head: [-3, -5 * s, 1.2 * c], hips: [0, -7 * s, 2.5 * c],
      armL: [8 + 28 * Math.max(0, -s), 10 - 26 * s, 20 + 22 * Math.max(0, -s), 0], armR: [8 + 28 * Math.max(0, s), 10 + 26 * s, 20 + 22 * Math.max(0, s), 0],
      legL: [thigh(ph), 3, knee(ph), 0], legR: [thigh(ph + Math.PI), 3, knee(ph + Math.PI), 0] }); }
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
// posesAt3(t, [[0,'stand'], [0.8,'point'], [2.4, poseObj]], blend=0.3, { lively }) — hold each pose, blend into the next.
// Acting, not tweening: each change dips back a little first and settles past the target (ease.back), and the body moves in
// order: hips and legs lead, the spine follows 35 ms later, the arms 60 ms, the head 90 ms. lively 0 = the old even blend,
// 1 = default, up to 1.5 for cartoon snap. _prev (the pose 0.1 s earlier) drives the hair lag and the body stretch.
const LAG3 = { spine: 0.035, armL: 0.06, armR: 0.06, handL: 0.06, handR: 0.06, head: 0.09 };
export function posesAt3(t, keys, blend = 0.3, o = {}) {
  const lv = o.lively ?? 1;
  if (!lv) return { ...poseAt3(t, keys, blend, ease.inOut), _prev: poseAt3(t - 0.1, keys, blend, ease.inOut) };
  const fn = ease.backK(0.9 * lv);
  const at = (tt) => { const out = { ...poseAt3(tt, keys, blend, fn) }; for (const [j, lag] of Object.entries(LAG3)) { const p = poseAt3(tt - lag * lv, keys, blend, fn); if (p[j] !== undefined) out[j] = p[j]; } return out; };
  return { ...at(t), _prev: at(t - 0.1) };
}
function poseAt3(t, keys, blend, fn = ease.inOut) {
  const get = (p) => (typeof p === 'string' ? POSES3[p] || POSES3.stand : p);
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const cur = get(keys[i][1]); const prev = i > 0 ? get(keys[i - 1][1]) : null;
  const x = i > 0 ? prog(t, keys[i][0], keys[i][0] + blend) : 1;
  return prev && x < 1 ? blendPose3(prev, cur, fn(x)) : cur;
}
// exprAt(t, [[0,'deadpan'], [1.2,'shocked']], blend=0.16) — the expression at t, blended into each new one (eyes close down
// and open up through a squint, the mouth eases). face({ expr: [[t, name], …], t }) calls this for you.
// flow3(t, [[t0, pose], [t1, pose], …], { ease }) — 1.0.1: one continuous movement through key poses. posesAt3 holds each pose
// and eases in and out of it, so the body stops at every key (robotic for throws, swings, reaches). flow3 runs a smooth spline
// (cubic Hermite, Catmull-Rom tangents) through the keys: speed carries through each key and only the first and last ease.
// Angle limbs spline their angles, IK limbs ({ to }) spline the hand/foot target; a limb that changes kind between two keys
// blends over that stretch. Returns the pose with _prev (hair follow-through).
export function flow3(t, keys, o = {}) {
  const at = (tt) => {
    const K = keys.map(([kt, p]) => [kt, typeof p === 'string' ? POSES3[p] || POSES3.stand : p]), n = K.length;
    if (tt <= K[0][0]) return K[0][1]; if (tt >= K[n - 1][0]) return K[n - 1][1];
    let i = 0; while (i + 2 < n && tt >= K[i + 1][0]) i++;
    const [t0, A] = K[i], [t1, B] = K[i + 1], h = t1 - t0, u = (tt - t0) / h;
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
    const val = (P, k) => { const v = P[k]; return v === undefined ? undefined : v; };
    const tan = (j, k, get) => { if (j <= 0 || j >= n - 1) return null; const a = get(K[j - 1][1], k), b = get(K[j + 1][1], k); if (a == null || b == null) return null; const dt = K[j + 1][0] - K[j - 1][0];
      return Array.isArray(a) ? a.map((x, m) => (b[m] - x) / dt) : (b - a) / dt; };
    const herm = (a, b, ma, mb) => Array.isArray(a) ? a.map((x, m) => h00 * x + h10 * h * (ma ? ma[m] : 0) + h01 * b[m] + h11 * h * (mb ? mb[m] : 0)) : h00 * a + h10 * h * (ma ?? 0) + h01 * b + h11 * h * (mb ?? 0);
    const out = {};
    for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
      if (k === '_prev') continue; const a = val(A, k) ?? val(B, k), b = val(B, k) ?? a;
      const num = (x) => typeof x === 'number' || Array.isArray(x);
      if (num(a) && num(b) && (typeof a === 'number') === (typeof b === 'number') && (!Array.isArray(a) || a.length === b.length)) {
        const g = (P, kk) => { const v = P[kk]; return num(v) && (typeof v === typeof a) ? v : null; };
        out[k] = herm(a, b, tan(i, k, g), tan(i + 1, k, g)); }
      else if (a && b && a.to && b.to) {
        const g = (P, kk) => (P[kk] && P[kk].to ? P[kk].to : null), gp = (P, kk) => (P[kk] && P[kk].pole ? P[kk].pole : null);
        const to = herm(a.to, b.to, tan(i, k, g), tan(i + 1, k, g)), pole = a.pole && b.pole ? herm(a.pole, b.pole, tan(i, k, gp), tan(i + 1, k, gp)) : b.pole || a.pole;
        out[k] = pole ? { to, pole } : { to }; if (a.rel || b.rel) out[k].rel = 1; }
      else { const e = u * u * (3 - 2 * u); out[k] = blendPose3({ [k]: a }, { [k]: b }, e)[k]; }
    }
    return out;
  };
  return { ...at(t), _prev: at(t - 0.1) };
}
export function exprAt(t, keys, blend = 0.16) {
  const get = (e) => (typeof e === 'string' ? EXPRESSIONS[e] || EXPRESSIONS.neutral : e);
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const cur = get(keys[i][1]); if (i === 0) return cur;
  const k = Math.round(ease.out(prog(t, keys[i][0], keys[i][0] + blend)) * 8) / 8;
  return k >= 1 ? cur : mixExpr(get(keys[i - 1][1]), cur, k);
}
const EYE0 = { open: 0.82, lid: 0, low: 0, pupil: 0.5, lookUp: 0, squintR: 0 };
function mixExpr(a, b, k) {
  const num = (x, y, d) => { const o = { ...x, ...y }; for (const key of Object.keys(o)) { const va = x[key] ?? d[key], vb = y[key] ?? d[key]; o[key] = typeof va === 'number' && typeof vb === 'number' ? lerp(va, vb, k) : (k < 0.5 ? x[key] : y[key]); } return o; };
  const ea = a.eye, eb = b.eye; let eye;
  if ((ea.closed || null) === (eb.closed || null)) eye = ea.closed ? (k < 0.5 ? ea : eb) : num(ea, eb, EYE0);
  else if (k < 0.5) eye = ea.closed ? ea : { ...ea, open: (ea.open ?? 0.82) * (1 - 2 * k) };
  else eye = eb.closed ? eb : { ...eb, open: (eb.open ?? 0.82) * (2 * k - 1) };
  const ma = a.mouth, mb = b.mouth, M0 = { w: 0.45, open: 0, curve: 0 };
  const wc = { w: lerp(ma.w ?? 0.45, mb.w ?? 0.45, k), curve: lerp(ma.curve ?? 0, mb.curve ?? 0, k) };
  const mouth = ma.type === mb.type ? num(ma, mb, M0) : k < 0.5 ? { ...ma, ...wc } : { ...mb, ...wc };
  return { eye, mouth };
}
// blinks that don't tick like a clock: 2.2–5.5 s apart, one in five doubled, plus one on every expression change (extra = key times)
function blinkAt(t, seed, extra = []) {
  const shape = (d) => (d < 0 || d > 0.15 ? 0 : d < 0.045 ? d / 0.045 : d < 0.08 ? 1 : 1 - (d - 0.08) / 0.07);
  let b = 0; for (const x of extra) b = Math.max(b, shape(t - x - 0.02));
  let at = -hash01(0, seed) * 3;
  for (let n = 1; at < t + 0.2 && n < 400; n++) { b = Math.max(b, shape(t - at)); if (hash01(n, seed + 7) < 0.2) b = Math.max(b, shape(t - at - 0.24)); at += 2.2 + 3.3 * hash01(n, seed); }
  return b;
}
// small eye darts while a face is otherwise still: a new gaze point every 0.7–2 s, reached in 50 ms
function saccade(t, seed, amp = 1) {
  let at = 0, n = 0, cur = [0, 0], prev = [0, 0];
  while (n < 400) { const len = 0.7 + 1.3 * hash01(n, seed + 3); if (at + len > t) break; at += len; n++; prev = cur; cur = [(hash01(n, seed + 5) - 0.5) * 0.4 * amp, (hash01(n, seed + 9) - 0.5) * 0.18 * amp]; }
  const k = n ? clamp((t - at) / 0.05) : 1; return [lerp(prev[0], cur[0], k), lerp(prev[1], cur[1], k)];
}
export function blendPose3(a, b, k) {
  a = typeof a === 'string' ? POSES3[a] : a; b = typeof b === 'string' ? POSES3[b] : b; const o = {};
  for (const kk of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[kk] ?? b[kk], vb = b[kk] ?? a[kk];
    if (typeof va === 'number' || (Array.isArray(va) && Array.isArray(vb))) o[kk] = mixVal(va, vb, k);
    else if (va && vb && va.to && vb.to) o[kk] = { ...vb, to: mixVal(va.to, vb.to, k), pole: va.pole && vb.pole ? mixVal(va.pole, vb.pole, k) : vb.pole };
    else if (/^(arm|leg)[LR]$/.test(kk) && va && vb) o[kk] = k <= 0 ? va : k >= 1 ? vb : { mix: [va, vb], k };   // 1.0.1: angle <-> IK limbs blend smoothly
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
  const { eye, mouth, talk = 0, blink = false, look = [0, 0], style = 'dot', pal, vis = null } = f;
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
  if (talk > 0.05 && ['flat', 'smile', 'smirk', 'frown'].includes(m.type)) {
    if (vis?.closed) { g.lineWidth = (dot ? 9 : 11) * U; g.beginPath(); g.moveTo(mx - mw * 0.7, my); g.quadraticCurveTo(mx, my + 4 * U, mx + mw * 0.7, my); g.stroke(); return; }   // m/b/p: lips pressed
    if (vis?.teeth) { const hh = 12 * U; drawOpen(g, mx, my, mw * 0.75, hh, 0, pal); g.fillStyle = pal.teeth; g.fillRect(mx - mw * 0.5, my - hh * 0.25, mw, hh * 0.55); return; }   // f/v: top teeth on the lip
    const wide = vis?.wide || 0; drawOpen(g, mx, my, mw * 0.8 * (1 + 0.35 * wide), op * 26 * U * (1 - 0.3 * wide), cu + 0.15 * wide, pal); return; }
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
//           top: 'hoodie'|'tshirt'|'jacket'|'suit'|'dress'|'labcoat'|'vest'|'scrubs'|'aodai'|'none', color, color2 (trim), shirt,
//           legs: pants colour | 'shorts:#hex' | null (bare stick legs), legCuff (jogger cuff colour | true), shoes: colour | null (round feet), shoeSole,
//           shoeToe, shoeStripe, shoeCollar, laces (1.0.2 sneaker details); puffer: crop, quilt: 'puff', edge, yoke, hood (1.0.2),
//           gloves: colour (default: skin, i.e. ball hands), head: 'cap'|'capBack'|'beanie'|'hood'|'headband'|'crown'|'tophat',
//           headColor, hair: see engine/hair3d.js, hairColor, hairShade, bow, sleeves, stripe, scarf, collar, bag (colours),
//           face: 'glasses'|'sunglasses', tie, kid: bool, scale,
//           role details (engine/costume3d.js): head 'nurseCap'|'policeCap'|'chefHat'|'hardhat'|'fireHelmet', hair 'balding'|'lowBun',
//           mustache, beard, brows, lanyard, card, whistle, stethoscope, badge, nameTag, patch, epaulettes, belt, radio, bands,
//           hiVis, apron, buttons, buttonRows, vee, goggles, belly, skirtLen, prop: 'cane'|'book'|'clipboard'|'mic'|'torch'|'medbag', propHand }
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
  // soft contact shadow on the floor under the feet (outfit.contact: false to drop it; style.contact = opacity)
  const contact = outfit.contact === false || opts.ghost ? null : new THREE.Mesh(new THREE.PlaneGeometry(0.78 * scale, 0.62 * scale), new THREE.MeshBasicMaterial({ map: contactTex(), color: 0x000000, transparent: true, opacity: S().contact ?? 0.42, depthWrite: false, fog: true }));
  if (contact) { contact.rotation.x = -Math.PI / 2; contact.position.y = 0.006; contact.renderOrder = 1; contact.castShadow = contact.receiveShadow = false; contact.name = 'contact'; root.add(contact); }
  const ghost = opts.ghost ? new THREE.MeshBasicMaterial({ color: new THREE.Color(opts.ghost.color || '#9fd0ff'), transparent: true, opacity: opts.ghost.opacity ?? 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }) : null;
  // 1.0 gloss: cloth gets a soft sheen, skin a vinyl-toy clearcoat (style.gloss 0..1.5 scales both; 0 = the matte 0.2 look)
  const G = st.gloss ?? 1, MAT = (c, o = {}) => ghost || mat(c, { rim: 1, rough: 0.6, ...(G > 0 && !(o.metal > 0.3) && !o.clearcoat ? { sheen: 0.7 * G, sheenRough: 0.5 } : {}), ...o });
  // pale skin glows faintly (as in the references: heads never go muddy, even back-lit); style.skinGlow 0..0.3
  const glowK = dark ? 0 : (st.skinGlow ?? 0.16);
  const skinM = MAT(skin, dark ? { rough: 0.55, rim: 1.0 } : { rough: 0.58, rim: 0.85, limit: st.skinLimit ?? 0.95, emissive: new THREE.Color(skin).multiplyScalar(glowK), ...(G > 0 ? { clearcoat: 0.55 * G, clearcoatRough: 0.32, sheen: 0 } : {}) });
  const olM = olC && !ghost ? new THREE.MeshBasicMaterial({ color: new THREE.Color(olC), side: THREE.BackSide, fog: true }) : null;
  const V2 = build2(outfit), B0 = V2 ? BODY2 : BODY;   // 2.0.1
  const AK = outfit.arms ?? S().arms ?? (LEGACY ? 1 : V2 ? 1.2 : 1.25);   // 1.0.2: arm length factor (1.25 = a raised hand clears the big head)
  const B = AK === 1 ? B0 : { ...B0, upperArm: B0.upperArm * AK, foreArm: B0.foreArm * AK };
  root.userData.build = V2 ? 2 : 1; root.userData.bodyScale = scale;
  // 2.0.1 waist: every top narrows toward the hem and fills out at the chest (x and z scaled by height); hem bands and rows follow
  const waist = (y) => V2 ? 0.9 + 0.15 * smooth((y + 0.08) / 0.46) : 1;
  const warp = (geo) => { if (!V2) return geo; const ps = geo.attributes.position; for (let i = 0; i < ps.count; i++) { const f = waist(ps.getY(i)); ps.setX(i, ps.getX(i) * f); ps.setZ(i, ps.getZ(i) * f); } geo.computeVertexNormals(); return geo; };
  const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 18, 1, true), unitSph = new THREE.SphereGeometry(1, 22, 16);
  const add = (m, parent = body) => { m.castShadow = !ghost; m.receiveShadow = !ghost; parent.add(m); return m; };
  // outline hull: a back-face copy pushed out by olW (scaled for spheres/lathes, or an explicit radius for segments)
  const hull = (m, k = 1.06) => { if (!olM) return null; const h = new THREE.Mesh(m.geometry, olM); h.castShadow = false; h.receiveShadow = false; h.scale.setScalar(k); m.add(h); return h; };
  // frames
  const dangles = [], puffLow = [];   // puffLow: 1.0.3 the lowest quilted row (bunches out when seated)   // 1.0: parts that swing with motion (hoodie strings, the bag); see secondary() in pose()
  const pelvis = new THREE.Group(); body.add(pelvis);
  const chest = new THREE.Group(); pelvis.add(chest);
  const neck = new THREE.Group(); neck.position.set(0, B.chestH, 0); chest.add(neck);
  const head = new THREE.Group(); head.position.set(0, B.headR + B.neck, 0); neck.add(head);
  const neckM = add(new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.04, B.neck + 0.06, 14), skinM), neck); neckM.position.y = (B.neck + 0.06) / 2 - 0.02; hull(neckM, 1 + olW / 0.034);
  // --- clothes
  const top = outfit.top ?? 'hoodie', topC = outfit.color || '#2f6fe0', trim = outfit.color2 || shade(topC, -0.18);
  const clothM = (c, o = {}) => MAT(c, { rough: 0.9, rim: 0.55, ...o });
  const popK = outfit.pop ?? (top === 'puffer' ? 0.35 : 0);   // outfit.pop 0..1: self-lit cloth, a loud hero outfit stays loud in dim sets
  // labcoat: muted off-white by default so a doctor never outshines the hero (outfit.color overrides); aodai: a long tunic in topC
  const coatC = top === 'labcoat' ? (outfit.color || '#d2d3da') : topC, coat = top === 'labcoat' || top === 'aodai';
  const topM = top === 'none' ? skinM : clothM(coat ? coatC : topC, popK ? { emissive: new THREE.Color(topC).multiplyScalar(popK) } : {});
  const trimM = clothM(trim, { rim: 0.4 });
  // 1.0.2 puffer options: crop (waist length, the trousers show), quilt: 'puff' (fat quilted rows instead of thin seams),
  // edge (collar, cuffs, hem band and zip in one contrast colour), yoke (shoulders + upper sleeves), hood (a hood folded behind the neck)
  const crop = top === 'puffer' && !!outfit.crop, puff = top === 'puffer' && outfit.quilt === 'puff';
  const edgeM = outfit.edge ? clothM(outfit.edge, { rim: 0.35 }) : null, yokeM = outfit.yoke ? clothM(outfit.yoke, { rim: 0.45 }) : null;
  const sleeveLong = ['hoodie', 'jacket', 'puffer', 'suit', 'labcoat', 'aodai'].includes(top), sleeveShort = ['tshirt', 'dress', 'scrubs'].includes(top);
  const chunky = top === 'hoodie' || top === 'jacket' || top === 'puffer';
  // torso (lathe profile, elliptical section). Hoodies are boxy and generous, like a 3D cartoon.
  const prof = top === 'none' ? [[0.001, -0.02], [0.06, 0], [0.065, 0.2], [0.07, 0.4], [0.05, 0.47], [0.001, 0.48]]
    : crop ? [[0.001, -0.06], [0.185, -0.06], [0.2, -0.035], [0.205, 0.05], [0.205, 0.28], [0.205, 0.38], [0.18, 0.45], [0.11, 0.5], [0.06, 0.52], [0.001, 0.52]]
    : chunky ? [[0.001, -0.17], [0.19, -0.17], [0.205, -0.13], [0.2, 0.05], [0.205, 0.28], [0.205, 0.38], [0.18, 0.45], [0.11, 0.5], [0.06, 0.52], [0.001, 0.52]]
    : [[0.001, -0.07], [0.16, -0.07], [0.172, -0.03], [0.165, 0.12], [0.172, 0.28], [0.178, 0.37], [0.15, 0.44], [0.09, 0.49], [0.055, 0.51], [0.001, 0.51]];
  const torsoGeo = warp(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 32)); torsoGeo.scale(1, 1, top === 'none' ? 1 : 0.7);
  // 1.0: a "seated" morph of the torso: the hem below the hips gathers up to the hip line and bunches out a little, so a
  // jacket or hoodie rests on the seat instead of passing through it (driven by the sit amount in pose()).
  { const pos = torsoGeo.attributes.position, sitP = new Float32Array(pos.array.length), lowY = prof[0][1];
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), k = y < 0 && lowY < 0 ? clamp(y / lowY) : 0;
      sitP[i * 3] = x * (1 + 0.1 * k); sitP[i * 3 + 1] = y < 0 ? y * 0.1 : y; sitP[i * 3 + 2] = z * (1 + 0.18 * k) + (z > 0 ? 0.02 * k : 0); }
    torsoGeo.morphAttributes.position = [new THREE.Float32BufferAttribute(sitP, 3)]; }
  const torso = add(new THREE.Mesh(torsoGeo, topM), chest); hull(torso, 1 + olW / 0.2);
  if (top === 'hoodie') {
    // hood bunched behind the neck + front collar ring
    const hood = add(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.068, 12, 28), topM), chest); hood.position.set(0, 0.5, -0.025); hood.rotation.x = Math.PI / 2 - 0.3; hood.scale.set(1.2, 1.25, 0.95); hull(hood, 1 + olW / 0.1);
    const hoodBack = add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14), topM), chest); hoodBack.position.set(0, 0.47, -0.11); hoodBack.scale.set(1.15, 0.8, 0.6); hull(hoodBack, 1 + olW / 0.12);
    const pocket = add(new THREE.Mesh(new THREE.CylinderGeometry(0.197, 0.205, 0.13, 28, 1, true, -0.75, 1.5), clothM(shade(topC, -0.1), { side: THREE.DoubleSide, rim: 0.4 })), chest); pocket.scale.set(1.03 * waist(-0.01), 1, 0.72 * waist(-0.01)); pocket.position.set(0, -0.01, 0);
    const band = add(new THREE.Mesh(new THREE.TorusGeometry(0.193, 0.02, 8, 32), trimM), chest); band.rotation.x = Math.PI / 2; band.scale.set(waist(-0.155), 0.7 * waist(-0.155), 1); band.position.y = -0.155;
    const strM = MAT(outfit.strings || '#f2f2f2', { rim: 0.2 });
    for (const sx of [-0.045, 0.045]) { const piv = new THREE.Group(); piv.position.set(sx, 0.49, 0.137); piv.rotation.x = 0.08; chest.add(piv); dangles.push(['string', piv, sx]);   // 1.0: strings hang from a pivot and swing
      const s = add(new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.2, 6), strM), piv); s.position.set(0, -0.1, 0); const tip = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.025, 4, 6), strM), piv); tip.position.set(0, -0.21, 0.006); }
  }
  if (top === 'puffer') {
    // quilted down jacket: horizontal seams, high collar, zip. The seams follow the boxy torso section.
    const seamM = clothM(outfit.color2 || shade(topC, -0.3), { rim: 0.2 });
    if (puff) {   // fat quilted rows: each row a soft roll round the body, the grooves between them read as the stitching
      const rows = [-0.005, 0.095, 0.195, 0.295];
      rows.forEach((y, i) => { const m = outfit.stripe && i === rows.length - 1 ? clothM(outfit.stripe, { rim: 0.35 }) : topM; if (i === 0) puffLow.push(y);
        const b = add(new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.036, 12, 48), m), chest); b.rotation.x = Math.PI / 2; b.scale.set(waist(y), 0.74 * waist(y), 0.95); b.position.y = y; });
      if (yokeM) { const yp = [[0.212, 0.345], [0.212, 0.385], [0.188, 0.45], [0.115, 0.5], [0.065, 0.523], [0.001, 0.523]];
        const yk = add(new THREE.Mesh(warp(new THREE.LatheGeometry(yp.map(([r, y]) => new THREE.Vector2(r, y)), 32)), yokeM), chest); yk.scale.z = 0.71; hull(yk, 1 + olW / 0.2); }
    } else for (let i = 0; i < 6; i++) { const y = -0.115 + i * 0.09, r = i === 5 ? 0.198 : 0.209; const b = add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.0085, 8, 44), seamM), chest); b.rotation.x = Math.PI / 2; b.scale.set(waist(y), 0.72 * waist(y), 1); b.position.y = y; }
    if (crop) { const hem = add(new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.026, 10, 44), edgeM || seamM), chest); hem.rotation.x = Math.PI / 2; hem.scale.set(waist(-0.045), 0.73 * waist(-0.045), 1); hem.position.y = -0.045; }
    if (outfit.hood) { const hM = clothM(outfit.hood, { rim: 0.45 });
      // 1.0.3 hood: a ring round the neck, a soft pouch hanging down the upper back, its dark opening facing up and back
      const hood = add(new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.052, 12, 28), hM), chest); hood.position.set(0, 0.505, -0.03); hood.rotation.x = Math.PI / 2 - 0.3; hood.scale.set(1.18, 1.18, 0.95); hull(hood, 1 + olW / 0.1);
      const hb = add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 22, 16), hM), chest); hb.position.set(0, 0.395, -0.165); hb.rotation.x = -0.22; hb.scale.set(1.08, 1.0, 0.42); hull(hb, 1 + olW / 0.12);
      const inner = add(new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), clothM(shade(outfit.hood, -0.45), { rim: 0.1 })), chest); inner.position.set(0, 0.5, -0.17); inner.rotation.x = -Math.PI / 2 - 0.75; inner.scale.set(1.05, 0.5, 1); }
    const collar = add(new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.05, 12, 28), edgeM || topM), chest); collar.rotation.x = Math.PI / 2; collar.position.y = 0.5; collar.scale.set(1.05, 0.95, 0.95); hull(collar, 1 + olW / 0.1);
    const zip = add(new THREE.Mesh(new THREE.BoxGeometry(puff ? 0.03 : 0.012, crop ? 0.5 : 0.56, puff ? 0.03 : 0.006), edgeM || seamM), chest); zip.position.set(0, crop ? 0.22 : 0.19, puff ? 0.158 : 0.149); zip.rotation.x = 0.02;
    const pull = add(new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.034, 0.008), MAT('#e8e2d8', { rough: 0.4 })), chest); pull.position.set(0, 0.42, puff ? 0.176 : 0.152);
  }
  if (top === 'jacket' || top === 'suit' || top === 'labcoat' || top === 'vest') {
    const vee = new THREE.BufferGeometry(); vee.setAttribute('position', new THREE.Float32BufferAttribute([-0.07, 0, 0, 0.07, 0, 0, 0, -0.27, 0], 3)); vee.setIndex([0, 2, 1]); vee.computeVertexNormals(); const shirt = add(new THREE.Mesh(vee, MAT(outfit.shirt || (top === 'suit' ? '#f4f4f4' : top === 'labcoat' ? '#8fa8cc' : trim), { rim: 0.3, side: THREE.DoubleSide })), chest); shirt.castShadow = false; shirt.position.set(0, 0.485, chunky ? 0.137 : 0.113); shirt.rotation.x = chunky ? -0.075 : -0.06;
    const collar = add(new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 8, 20), topM), chest); collar.rotation.x = Math.PI / 2 + 0.25; collar.position.y = 0.48;
  }
  if (outfit.tie) { const tie = add(new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.28, 4), MAT(outfit.tie, { rim: 0.3 })), chest); tie.rotation.x = Math.PI; tie.position.set(0, 0.33, 0.128); tie.scale.set(1, 1, 0.3); }
  // small accents, at most one or two per supporting character
  const torsoR = chunky ? 0.209 : 0.178;
  if (outfit.stripe && !puff) { const b = add(new THREE.Mesh(new THREE.CylinderGeometry(torsoR, torsoR, 0.07, 36, 1, true), clothM(outfit.stripe, { rim: 0.3, side: THREE.DoubleSide })), chest); b.scale.z = 0.71; b.position.y = 0.2; }
  if (outfit.scarf) { const sm = clothM(outfit.scarf, { rim: 0.35 }); const big = top === 'puffer';   // 1.0.2: over a puffer collar the scarf sits higher and fatter, and its end is a soft rounded drape
    const hooded = big && !!outfit.hood, ring = add(new THREE.Mesh(new THREE.TorusGeometry(hooded ? 0.135 : big ? 0.112 : 0.098, hooded ? 0.062 : big ? 0.05 : 0.04, 12, 28), sm), chest); ring.rotation.x = Math.PI / 2; ring.position.set(0, hooded ? 0.535 : big ? 0.53 : 0.5, hooded ? 0.025 : 0); ring.scale.set(1.08, 0.92, 0.85); hull(ring, 1 + olW / 0.1);
    if (big) { const piv = new THREE.Group(); piv.position.set(-0.075, 0.49, puff ? 0.19 : 0.16); chest.add(piv); dangles.push(['scarf', piv, 0]);   // 1.0.3: swings and flutters
      const tail = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.15, 6, 12), sm), piv); tail.scale.set(1.3, 1, 0.42); tail.position.set(-0.012, -0.12, 0.012); tail.rotation.set(0.1, 0, 0.1); hull(tail, 1 + olW / 0.04); }
    else { const tail = add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.24, 0.03), sm), chest); tail.position.set(-0.07, 0.34, chunky ? 0.158 : 0.135); tail.rotation.x = 0.07; } }
  if (outfit.collar) { const cm = clothM(outfit.collar, { rim: 0.3 }); for (const sx of [-1, 1]) { const w = add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.075), cm), chest); w.position.set(sx * 0.062, 0.485, 0.082); w.rotation.set(0.55, sx * -0.55, sx * -0.42); } }
  if (outfit.bag) { const bm = clothM(outfit.bag, { rim: 0.3 }); const pivot = new THREE.Group(); pivot.position.y = 0.19; pivot.rotation.z = -0.72; chest.add(pivot); const strap = add(new THREE.Mesh(new THREE.TorusGeometry(torsoR / Math.cos(0.72) + 0.005, 0.0105, 8, 48), bm), pivot); strap.rotation.x = Math.PI / 2; strap.scale.set(1, 0.56, 1); const bp = new THREE.Group(); bp.position.set(0.16, 0.04, chunky ? 0.125 : 0.105); chest.add(bp); dangles.push(['bag', bp, 0]); const pouch = add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.115, 0.055), bm), bp); pouch.position.set(0, -0.06, 0.004); hull(pouch, 1.08); }
  let skirt = null;
  if (outfit.skirt && top !== 'dress') { const len = 0.26; skirt = add(new THREE.Mesh(new THREE.CylinderGeometry(0.178, 0.3, len, 28, 1, true), MAT(outfit.skirt, { rough: 0.85, rim: 0.4, side: THREE.DoubleSide })), pelvis); skirt.scale.z = 0.74; skirt.position.y = -len / 2 - 0.045; hull(skirt, 1 + olW / 0.25); }
  if (top === 'dress' || coat) { const len = top === 'dress' ? 0.42 : 0.55; skirt = add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, top === 'dress' ? 0.3 : 0.22, len, 28, 1, true), MAT(top === 'dress' ? topC : coatC, { rough: 0.85, rim: 0.4, side: THREE.DoubleSide })), pelvis); skirt.scale.z = 0.75; skirt.position.y = -len / 2 + 0.02; hull(skirt, 1 + olW / 0.25); }
  // --- head
  const skull = add(new THREE.Mesh(new THREE.SphereGeometry(B.headR, 48, 32), skinM), head); hull(skull, 1 + (olW * 1.15) / B.headR);
  const faceMat = ghost ? null : new THREE.MeshBasicMaterial({ color: new THREE.Color(dark ? 0.86 : 1, dark ? 0.86 : 1, dark ? 0.86 : 1), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, fog: true });
  let faceMesh = null;
  if (!ghost) { faceMesh = add(new THREE.Mesh(new THREE.SphereGeometry(B.headR * 1.003, 56, 36, Math.PI / 2 - FACE.phiSpan / 2, FACE.phiSpan, FACE.thStart, FACE.thSpan), faceMat), head); faceMesh.castShadow = false; faceMesh.receiveShadow = false; }
  const hc = outfit.headColor || '#f2c21a', hM = MAT(hc, { rough: 0.8, rim: 0.4 }); const hr = B.headR;
  const hairC = outfit.hairColor || (dark ? skin : '#6a3f26');
  const hat = (m, k = 1.03) => { add(m, head); hull(m, k); return m; };
  const nHead = head.children.length;   // everything a hat adds below: no shadow band across the face
  if (outfit.head === 'cap' || outfit.head === 'capBack') { hat(new THREE.Mesh(new THREE.SphereGeometry(hr * 1.04, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), hM)).position.y = 0.01; const brim = add(new THREE.Mesh(new THREE.CylinderGeometry(hr * 0.75, hr * 0.75, 0.016, 28, 1, false, -1.1, 2.2), hM), head); brim.scale.set(1, 1, 1.2); brim.position.set(0, hr * 0.42, outfit.head === 'cap' ? hr * 0.72 : -hr * 0.72); if (outfit.head === 'capBack') brim.rotation.y = Math.PI; hull(brim, 1.04); }
  if (outfit.head === 'beanie') { const d = hat(new THREE.Mesh(new THREE.SphereGeometry(hr * 1.05, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), hM)); d.scale.y = 1.12; const cuff = add(new THREE.Mesh(new THREE.TorusGeometry(hr * 1.0, 0.028, 8, 32), hM), head); cuff.rotation.x = Math.PI / 2; cuff.position.y = hr * 0.25; const pom = add(new THREE.Mesh(unitSph, MAT(shade(hc, 0.25), { rim: 0.3 })), head); pom.scale.setScalar(0.055); pom.position.y = hr * 1.18; }
  if (outfit.head === 'headband') { const band = add(new THREE.Mesh(new THREE.TorusGeometry(hr * 1.0, 0.024, 8, 32), hM), head); band.rotation.x = Math.PI / 2 - 0.15; band.position.y = hr * 0.45; }
  if (outfit.head === 'hood') { hat(new THREE.Mesh(new THREE.SphereGeometry(hr * 1.12, 32, 16, Math.PI * 0.85, Math.PI * 1.3, 0, Math.PI * 0.72), MAT(outfit.headColor || topC, { rough: 0.9, rim: 0.5, side: THREE.DoubleSide }))).position.set(0, 0.01, -0.01); }
  if (outfit.head === 'tophat') { hat(new THREE.Mesh(new THREE.CylinderGeometry(hr * 1.2, hr * 1.2, 0.015, 28), hM)).position.y = hr * 0.78; hat(new THREE.Mesh(new THREE.CylinderGeometry(hr * 0.72, hr * 0.75, hr * 1.1, 28), hM)).position.y = hr * 1.33; }
  if (outfit.head === 'crown') { const cr = add(new THREE.Mesh(new THREE.CylinderGeometry(hr * 0.7, hr * 0.6, hr * 0.45, 8, 1, true), MAT('#f2c21a', { metal: 0.6, rough: 0.35, rim: 0.4, side: THREE.DoubleSide })), head); cr.position.y = hr * 1.05; }
  head.children.slice(nHead).forEach(m => { m.castShadow = false; });
  const hairG = new THREE.Group(); head.add(hairG);
  if (outfit.hair && outfit.hair !== 'balding') buildHair(outfit.hair === 'lowBun' ? 'slick' : outfit.hair, { head: hairG, hr, MAT, add, hull, olM, olW, color: hairC, shade: outfit.hairShade, dark, ghost });
  if (outfit.bow) { const bowM = MAT(outfit.bow, { rim: 0.4 }); const bow = new THREE.Group(); for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.08, 4), bowM); b.rotation.z = sx * Math.PI / 2; b.position.x = sx * 0.04; bow.add(b); } bow.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), bowM)); bow.position.set(hr * 0.42, hr * 0.86, hr * 0.2); bow.rotation.z = -0.4; add(bow, head); }
  if (outfit.face === 'glasses' || outfit.face === 'sunglasses') {
    const fm = MAT(outfit.face === 'sunglasses' ? '#111111' : '#2a2a2a', { rough: 0.3, rim: 0.2 });
    const ex = eyeStyle === 'dot' ? 21 : 23;
    for (const sx of [-1, 1]) { const ring = add(new THREE.Mesh(new THREE.TorusGeometry(eyeStyle === 'dot' ? 0.05 : 0.06, 0.008, 8, 24), fm), head); const a = sx * ex * D2R, th = 87 * D2R, r = hr * 1.06; ring.position.set(Math.sin(a) * Math.sin(th) * r, Math.cos(th) * r, Math.cos(a) * Math.sin(th) * r); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ring.position.clone().normalize()); ring.scale.set(1.16, 0.92, 1); if (outfit.face === 'sunglasses') { const lens = add(new THREE.Mesh(new THREE.CircleGeometry(eyeStyle === 'dot' ? 0.05 : 0.058, 20), MAT('#05050a', { rough: 0.15, metal: 0.4 })), head); lens.position.copy(ring.position); lens.quaternion.copy(ring.quaternion); lens.scale.copy(ring.scale); } }
  }
  if (outfit.face === 'glasses' || outfit.face === 'sunglasses') { const br = add(new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.075, 6), MAT('#1a1a1a', { rough: 0.3 })), head); br.rotation.z = Math.PI / 2; br.position.set(0, hr * Math.cos(87 * D2R) * 1.06 + 0.008, hr * 1.05); }
  // --- limbs: segments (cylinder + joint spheres) re-oriented every frame; outlines follow with a bigger radius
  const segs = [];
  // 2.0.1: k < 1 tapers a segment toward its end (thigh: full at the hip, slimmer at the knee)
  const seg = (r, m, capEnd = true, k = 1) => { const geo = k === 1 ? unitCyl : new THREE.CylinderGeometry(k, 1, 1, 18, 1, true); const c = add(new THREE.Mesh(geo, m), body); const j = capEnd ? add(new THREE.Mesh(unitSph, m), body) : null; const s = { r, c, j, k }; if (olM) { s.oc = new THREE.Mesh(geo, olM); s.oj = capEnd ? new THREE.Mesh(unitSph, olM) : null; body.add(s.oc); if (s.oj) body.add(s.oj); } segs.push(s); return s; };
  const pantsC = outfit.legs ?? (top === 'scrubs' ? topC : null), shorts = typeof pantsC === 'string' && /^shorts:/.test(pantsC), bareLegs = !pantsC;
  const pantsM = bareLegs ? skinM : MAT(shorts ? pantsC.slice(7) : pantsC, { rough: 0.85, rim: 0.55 });
  const sleeveM = top === 'none' || top === 'vest' ? skinM : outfit.sleeves ? clothM(outfit.sleeves) : topM;
  const limbR = dark ? B.limbR : B.limbR * 0.85;
  const armR = sleeveLong ? (top === 'puffer' ? 0.078 : chunky ? 0.068 : 0.058) : limbR;
  const armSeams = top === 'puffer' ? (puff ? topM : clothM(outfit.color2 || shade(topC, -0.3), { rim: 0.2 })) : null, seamGeo = armSeams ? new THREE.TorusGeometry(1, puff ? 0.3 : 0.11, puff ? 10 : 8, 24) : null;
  const sleeveRings = { L: [], R: [] };
  const L = {};
  for (const side of ['L', 'R']) {
    L['up' + side] = seg(sleeveLong || sleeveShort ? armR : limbR, sleeveLong || sleeveShort ? sleeveM : skinM);
    L['lo' + side] = seg(sleeveLong ? armR * 0.93 : limbR, sleeveLong ? sleeveM : skinM);
    L['cuff' + side] = sleeveLong ? seg(armR * (puff ? 1.08 : 1.02), edgeM || (top === 'hoodie' || top === 'puffer' ? trimM : sleeveM), false) : null;
    if (armSeams) for (let i = 0; i < 4; i++) { const m = add(new THREE.Mesh(seamGeo, puff && yokeM && i === 0 ? yokeM : armSeams)); m.castShadow = false; m.scale.setScalar(armR * (puff ? 0.86 : 1.0)); sleeveRings[side].push(m); }
    L['th' + side] = V2 ? seg(bareLegs ? limbR * 1.25 : 0.074, pantsM, true, bareLegs ? 0.8 : 0.76) : seg(bareLegs ? limbR : 0.062, pantsM);
    L['sh' + side] = V2 ? seg(bareLegs || shorts ? limbR : 0.057, shorts ? skinM : pantsM, !outfit.shoes, bareLegs || shorts ? 0.85 : 0.8) : seg(bareLegs || shorts ? limbR : 0.056, shorts ? skinM : pantsM, !outfit.shoes);   // 1.0.2: no ankle ball poking under a shoe
    L['lc' + side] = outfit.legCuff && !bareLegs && !shorts ? seg(0.062, clothM(outfit.legCuff === true ? shade(pantsC, -0.25) : outfit.legCuff, { rim: 0.3 }), false) : null;   // 1.0.2 jogger cuff
  }
  if (crop && !bareLegs) { const seat = add(new THREE.Mesh(unitSph, pantsM), pelvis); seat.scale.set(V2 ? 0.19 : 0.165, 0.085, V2 ? 0.12 : 0.115); seat.position.y = -0.03; hull(seat, 1 + olW / 0.1); }   // 1.0.2: hips under a short jacket
  const shoulderBall = []; if (sleeveLong || sleeveShort) for (let i = 0; i < 2; i++) { const s = add(new THREE.Mesh(unitSph, yokeM && sleeveLong ? yokeM : sleeveM), body); s.scale.setScalar(sleeveLong ? armR * 1.15 : 0.065); shoulderBall.push(s); hull(s, 1 + olW / (armR * 1.15)); }
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
    const f4 = [0, 1, 2, 3].map(i => { const m = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.019, 0.075 - (i === 3 ? 0.018 : 0) + (i === 1 ? 0.008 : 0), 4, 8), gloveM), h); m.visible = false; hull(m, 1.3); return m; });   // 1.0.3 fingers
    hands[side] = { g: h, palm, thumb, fing, f4, mode: '' };
  }
  // feet: sneakers if shoes given, else round stick-figure feet
  const feet = {};
  const shoeC = outfit.shoes ?? null;
  for (const side of ['L', 'R']) {
    const f = new THREE.Group(); add(f);
    if (shoeC) {
      const shoeM = MAT(shoeC, { rough: 0.6, rim: 0.5, ...(G > 0 ? { clearcoat: 0.6 * G, clearcoatRough: 0.2, sheen: 0 } : {}) }), soleM = MAT(outfit.shoeSole || '#f4f4f4', { rough: 0.7, rim: 0.2 });
      const sole = add(new THREE.Mesh(roundedSole(), soleM), f); sole.position.set(0, -0.005, 0.045); const det = !!(outfit.shoeToe || outfit.shoeStripe || outfit.shoeCollar || outfit.laces); if (det) { sole.scale.y = 0.62; sole.position.y = 0.0; }
      if (!(outfit.shoeToe || outfit.shoeStripe || outfit.shoeCollar || outfit.laces)) { const up = add(new THREE.Mesh(unitSph, shoeM), f); up.scale.set(0.06, 0.056, 0.125); up.position.set(0, 0.035, 0.045); hull(up, 1.12); }
      else {   // 1.0.2 sneaker: a low dome on the sole, a raised heel with a padded collar, a rubber toe cap, a side stripe rising to the heel, laces
        const half = _halfSph || (_halfSph = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2));
        const up = add(new THREE.Mesh(half, shoeM), f); up.scale.set(0.066, 0.078, 0.13); up.position.set(0, 0.022, 0.045); hull(up, 1.08);
        const heel = add(new THREE.Mesh(half, shoeM), f); heel.scale.set(0.062, 0.1, 0.064); heel.position.set(0, 0.022, -0.02); hull(heel, 1.08);
        if (outfit.shoeToe) { const toe = add(new THREE.Mesh(half, MAT(outfit.shoeToe, { rough: 0.5, rim: 0.3 })), f); toe.scale.set(0.0672, 0.04, 0.06); toe.position.set(0, 0.022, 0.12); }
        if (outfit.shoeStripe) { const st = add(new THREE.Mesh(unitSph, MAT(outfit.shoeStripe, { rough: 0.5, rim: 0.5 })), f); st.scale.set(0.0675, 0.02, 0.088); st.position.set(0, 0.05, 0.03); st.rotation.x = -0.3; }
        if (outfit.shoeCollar) { const cl = add(new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.014, 8, 20), MAT(outfit.shoeCollar, { rough: 0.8, rim: 0.3 })), f); cl.rotation.x = Math.PI / 2 + 0.2; cl.position.set(0, 0.118, -0.016); }
        if (outfit.laces) { const lm = MAT(outfit.laces === true ? '#d8d8dc' : outfit.laces, { rough: 0.6 }); for (const z of [0.062, 0.088, 0.112]) { const zz = (z - 0.045) / 0.13, l = add(new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.007, 0.01), lm), f); l.position.set(0, 0.022 + 0.078 * Math.sqrt(1 - zz * zz), z); l.rotation.x = Math.atan2(0.078 * zz, 0.13 * Math.sqrt(1 - zz * zz)); } }
      }
    } else { const ft = add(new THREE.Mesh(unitSph, skinM), f); ft.scale.set(0.05, 0.04, 0.09); ft.position.set(0, 0.03, 0.04); hull(ft, 1.18); }
    feet[side] = f;
  }
  // role costume details (engine/costume3d.js): lanyards, badges, nurse/police caps, beards, a cane...
  const prop = dressUp({ ...outfit, top }, { MAT, add, hull, chest, head, body, hr, chunky, hairC, ghost: !!ghost, parts: { torso, skirt } });
  // ---------------------------------------------------------------- posing
  const tmp = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const place = (s, A, Bp, r) => {
    const len = A.distanceTo(Bp); s.c.position.copy(A).add(Bp).multiplyScalar(0.5); tmp.copy(Bp).sub(A); if (len > 1e-6) s.c.quaternion.setFromUnitVectors(up, tmp.normalize()); s.c.scale.set(r, len, r);
    const re = r * (s.k || 1); if (s.j) { s.j.position.copy(Bp); s.j.scale.setScalar(re); }
    if (s.oc) { s.oc.position.copy(s.c.position); s.oc.quaternion.copy(s.c.quaternion); s.oc.scale.set(r + olW, len, r + olW); if (s.oj) { s.oj.position.copy(Bp); s.oj.scale.setScalar(re + olW); } }
  };
  const eul = (a) => new THREE.Euler(a[0] * D2R, a[1] * D2R, a[2] * D2R, 'YXZ');
  const toBody = (frame, v) => { frame.updateWorldMatrix(true, false); const w = v.clone().applyMatrix4(frame.matrixWorld); return body.worldToLocal(w); };
  const fkArm = (a, s) => { const [raise, az, bend0, twist] = a, bend = Math.max(0, Math.min(165, bend0)); /* 1.0.2: no reverse elbow */ const Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s * az * D2R, 0)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-raise * D2R, 0, 0))).multiply(new THREE.Quaternion().setFromAxisAngle(up, -s * (twist || 0) * D2R)); const d = new THREE.Vector3(0, -1, 0).applyQuaternion(Q), b = new THREE.Vector3(0, 0, 1).applyQuaternion(Q); const d2 = d.clone().multiplyScalar(Math.cos(bend * D2R)).addScaledVector(b, Math.sin(bend * D2R)); return [d, d2, b]; };
  const fkLeg = (a, s) => { const [lift, side, knee0, twist] = a, knee = Math.max(0, Math.min(165, knee0)); /* 1.0.2: no reverse knee */ const Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, s * side * D2R)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-lift * D2R, 0, 0))).multiply(new THREE.Quaternion().setFromAxisAngle(up, s * (twist || 0) * D2R)); const d = new THREE.Vector3(0, -1, 0).applyQuaternion(Q), b = new THREE.Vector3(0, 0, -1).applyQuaternion(Q); const d2 = d.clone().multiplyScalar(Math.cos(knee * D2R)).addScaledVector(b, Math.sin(knee * D2R)); return [d, d2, b]; };
  const ik = (A, T, l1, l2, pole) => { const dv = T.clone().sub(A); let d = dv.length(); d = clamp(d, Math.abs(l1 - l2) + 1e-3, (l1 + l2) * 0.999); const u = dv.normalize(); const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)); const pv = pole.clone().sub(A); pv.addScaledVector(u, -pv.dot(u)); if (pv.lengthSq() < 1e-8) pv.set(0, 0, 1); pv.normalize(); return A.clone().addScaledVector(u, Math.cos(a) * l1).addScaledVector(pv, Math.sin(a) * l1); };
  const setHand = (H, mode, A, Bp, s = 1) => {
    H.g.position.copy(Bp); tmp.copy(Bp).sub(A).normalize();
    const G = FINGERS[mode];
    if (G) {   // 1.0.3 finger gestures: a real hand frame so the palm faces where the gesture needs it (count / peace: palm to the
      // viewer; thumbs up: palm toward the body's middle, thumb to the sky) and the thumb sits on the correct side for each hand
      const fd = G.palm === 'mid' ? tmp.clone() : new THREE.Vector3(0, 1, 0).multiplyScalar(0.9).addScaledVector(tmp, 0.25).normalize();   // count / peace: the wrist bends so the fingers stand up
      const yL = fd.negate(), pn = (G.palm === 'mid' ? new THREE.Vector3(-s, 0, 0) : new THREE.Vector3(0, 0, 1));
      let zL = pn.addScaledVector(yL, -pn.dot(yL)); if (zL.lengthSq() < 1e-4) zL = new THREE.Vector3(0, 1, 0).addScaledVector(yL, -yL.y); zL.normalize();
      const xL = new THREE.Vector3().crossVectors(yL, zL).normalize(); H.g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xL, yL, zL));
      const hint = G.thumbTo === 'up' ? new THREE.Vector3(0, 1, 0) : G.thumbTo === 'down' ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(-s, 0, 0);
      const sg = xL.dot(hint) >= 0 ? 1 : -1, key = mode + sg; if (H.mode === key) return; H.mode = key;
      H.palm.scale.set(handR * 0.95, handR * 1.0, handR * 0.8); H.palm.position.set(0, -handR * 0.75, 0); H.fing.visible = false;
      H.thumb.visible = true;
      if (G.thumb === 'out') { H.thumb.position.set(sg * handR * 0.95, -handR * 0.75, 0); H.thumb.rotation.set(0, 0, Math.atan2(-sg * 0.85, -0.5)); }
      else if (G.thumb === 'up') { H.thumb.position.set(sg * handR * 1.05, -handR * 0.55, handR * 0.1); H.thumb.rotation.set(0, 0, -sg * Math.PI / 2); }
      else { H.thumb.position.set(sg * handR * 0.25, -handR * 1.05, handR * 0.62); H.thumb.rotation.set(0, 0, sg * 1.25); }
      const spread = G.spread || 0;
      H.f4.forEach((m, i) => { const on = G.f[i]; m.visible = !!on; if (!on) return; const x = sg * handR * (0.48 - i * 0.32), a = sg * (1.5 - i) * spread;
        m.position.set(x - Math.sin(a) * handR * 1.1, -handR * (i === 1 ? 2.25 : i === 3 ? 2.0 : 2.15), 0); m.rotation.set(0, 0, a); });
      return;
    }
    H.g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), tmp);
    if (H.mode === mode) return; H.mode = mode; H.f4.forEach(m => { m.visible = false; });
    const open = mode === 'open', point = mode === 'point';
    if (mode === 'grip' || mode === 'pinch' || mode === 'cup') {   // 1.0.2 grips
      const g = mode === 'grip', pc = mode === 'pinch';
      H.palm.scale.set(handR * (g ? 1.0 : 1.05), handR * (pc ? 1.0 : 1.1), handR * (g ? 1.0 : 0.8)); H.palm.position.set(0, -handR * 0.75, 0);
      H.thumb.visible = true; H.thumb.position.set(handR * (g ? 0.55 : 0.7), -handR * (g ? 1.0 : 0.9), handR * (g ? 0.75 : 0.5)); H.thumb.rotation.set(g ? 0.9 : 0.4, 0, g ? 1.2 : 0.7);
      H.fing.visible = true; H.fing.position.set(0, -handR * (pc ? 1.75 : 1.55), handR * (g ? 0.55 : 0.4)); H.fing.scale.set(pc ? 0.8 : 2.4, pc ? 0.85 : 0.55, g ? 0.9 : 0.75); return;
    }
    H.palm.scale.set(handR, open ? handR * 1.25 : handR * 1.05, open ? handR * 0.55 : handR * 0.95); H.palm.position.set(0, -handR * 0.75, 0);
    H.thumb.position.set(handR * 0.75, -handR * 0.55, handR * 0.35); H.thumb.rotation.set(0, 0, open ? 0.9 : 0.4); H.thumb.visible = open || point;
    H.fing.visible = point || open; H.fing.position.set(0, -handR * 2.1, 0); H.fing.scale.set(1, point ? 1 : 0.9, open ? 0.6 : 1);
    if (open) { H.fing.scale.set(2.8, 0.75, 0.55); H.fing.position.set(0, -handR * 1.9, 0); }
  };
  const setFoot = (F, ankle, d2, flat, yawFwd, pitch) => {
    F.position.copy(ankle).add(new THREE.Vector3(0, V2 ? -B.ankleY + 0.012 : -B.ankleY * 0.15, 0));   // 2.0.1: the sole touches the floor
    const fwd = yawFwd.clone();
    if (pitch != null) { const a = pitch * D2R, dir = fwd.clone().multiplyScalar(Math.cos(a)).add(new THREE.Vector3(0, Math.sin(a), 0)).normalize(), x = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize(), y = new THREE.Vector3().crossVectors(dir, x).normalize(); F.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, dir)); return; } const hinge = new THREE.Vector3().crossVectors(d2, fwd); const natural = new THREE.Vector3().crossVectors(hinge.lengthSq() > 1e-6 ? hinge.normalize() : new THREE.Vector3(1, 0, 0), d2).normalize().negate();
    const dir = natural.lerp(fwd, flat).normalize(); const m = new THREE.Matrix4(); const x = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize(); const y = new THREE.Vector3().crossVectors(dir, x).normalize(); m.makeBasis(x, y, dir); F.quaternion.setFromRotationMatrix(m);
  };
  // 1.0: clothes on a seat. sitK (0..1) from the thigh lift and the dropped hips: the torso hem gathers up (morph), trims and
  // bands below the hips follow it, and a skirt or dress spreads over the seat at hip level instead of hanging through it.
  let clothBase = null;
  const seated = (p) => {
    const lift = ((Array.isArray(p.legL) ? p.legL[0] : 0) + (Array.isArray(p.legR) ? p.legR[0] : 0)) / 2;
    const k = clamp((lift - 40) / 40) * clamp(-(p.y || 0) / 0.12);
    if (!clothBase) { clothBase = { kids: [], skirt: skirt ? { y: skirt.position.y, z: skirt.position.z, sy: skirt.scale.y, sz: skirt.scale.z, sx: skirt.scale.x, len: skirt.geometry.parameters?.height || 0.3 } : null };
      for (const c of chest.children) if (c !== torso && c !== neck && c.position.y < -0.02) clothBase.kids.push([c, c.position.y]); }
    if (torso.morphTargetInfluences) { torso.morphTargetInfluences[0] = k; for (const h of torso.children) if (h.morphTargetInfluences) h.morphTargetInfluences[0] = k; }
    for (const [c, y0] of clothBase.kids) c.position.y = y0 * (1 - 0.9 * k);
    if (puffLow.length) { if (!clothBase.row) clothBase.row = chest.children.find(c => c.geometry?.type === 'TorusGeometry' && Math.abs(c.position.y - puffLow[0]) < 1e-6) || null;
      const r = clothBase.row; if (r) { r.scale.set(1 + 0.07 * k, 0.74 * (1 + 0.12 * k), 0.95 * (1 + 0.1 * k)); r.position.y = puffLow[0] + 0.015 * k; } }   // 1.0.3: the jacket bunches on the lap
    const sb = clothBase.skirt; if (sb) { const L = sb.len * sb.sy, sy = sb.sy * (1 - (sb.len > 0.35 ? 0.72 : 0.55) * k), top = sb.y + L / 2;
      skirt.scale.set(sb.sx * (1 - 0.18 * k), sy, sb.sz * (1 + 0.3 * k)); skirt.position.y = lerp(top - (sb.len * sy) / 2, 0.006 + (sb.len * sy) / 2, k); skirt.position.z = sb.z + 0.08 * k; skirt.rotation.x = -0.18 * k; }
  };
  // 1.0 secondary motion: motion helpers (walkTo, climb, jump3, turn3) leave root.userData.mo = { v, phase, vy, yawRate } for this
  // frame; the hair bounces and sweeps back, hoodie strings and the bag swing a beat behind the steps. Pure function of time.
  const windK = () => { let sc = root; while (sc.parent) sc = sc.parent; const u = sc.userData || {}; return clamp(u.windAt ? u.windAt(globalThis.E3D_T || 0) : u.wind ?? 0); };   // 1.0.3
  const secondary = (p) => {
    const mo = root.userData.mo || {}; root.userData.mo = null;
    const sp = clamp((mo.v || 0) / 2.6), ph = mo.phase || 0, bob = Math.sin(2 * ph - 0.9), vy = clamp((mo.vy || 0) / 3, -1, 1), yr = clamp((mo.yawRate || 0) / 6, -1, 1);
    const q = p._prev, dSp = q ? clamp(((p.spine?.[0] || 0) - (q.spine?.[0] || 0)) / 20, -1, 1) : 0;
    hairG.rotation.x += (-0.09 * sp + 0.035 * bob * sp + 0.1 * vy) ; hairG.rotation.z += 0.03 * Math.sin(ph) * sp - 0.08 * yr; hairG.position.y = 0.006 * bob * sp;
    for (const [kind, g, sx] of dangles) {
      if (kind === 'scarf') { const w = windK(), tt = globalThis.E3D_T || 0;
        g.rotation.x = 0.08 + 0.4 * sp + 0.12 * bob * sp - 0.3 * vy - 0.35 * dSp + w * (0.1 + 0.12 * Math.sin(tt * 2.3));
        g.rotation.z = 0.22 * Math.sin(ph + 0.5) * sp - 0.35 * yr + w * (0.18 * Math.sin(tt * 3.7 + 1.1) + 0.08 * Math.sin(tt * 9.1)); continue; }
      if (kind === 'string') { g.rotation.x = 0.08 - 0.55 * sp - 0.22 * bob * sp + 0.35 * vy - 0.4 * dSp; g.rotation.z = 0.18 * Math.sin(ph + sx * 20) * sp - 0.3 * yr; }
      else { g.rotation.z = 0.14 * Math.sin(ph + 0.6) * sp - 0.25 * yr; g.rotation.x = -0.22 * sp * (0.6 + 0.4 * bob) + 0.25 * vy; }
    }
    if (skirt && !LEGACY) { const standing = (p.y || 0) > -0.1; skirt.rotation.x = standing ? -0.1 * sp + 0.05 * bob * sp + 0.12 * vy : 0; skirt.rotation.z = standing ? 0.06 * Math.sin(ph) * sp - 0.1 * yr : 0; }
  };
  // 1.0.1: limb points for any spec. armPts / legPts → [joint, end] in body space; limbMix blends two specs (nested mixes too)
  // by lerping the joint and end points and restoring the bone lengths, so a pose blend never jumps between solvers.
  const armPts = (a, sh, s) => { if (a.mix) return limbMix(a, sh, s, armPts, B.upperArm, B.foreArm);
    if (Array.isArray(a)) { const [d, dd] = fkArm(a, s); const bq = body.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(chest.getWorldQuaternion(new THREE.Quaternion())); d.applyQuaternion(bq); dd.applyQuaternion(bq); const el = sh.clone().addScaledVector(d, B.upperArm); return [el, el.clone().addScaledVector(dd, B.foreArm)]; }
    const T = new THREE.Vector3(...a.to), el = ik(sh, T, B.upperArm, B.foreArm, a.pole ? new THREE.Vector3(...a.pole) : sh.clone().add(new THREE.Vector3(s * 0.4, -0.3, -0.5))); return [el, el.clone().add(T.clone().sub(el).setLength(B.foreArm))]; };
  const legPts = (lg, hp, s) => { if (lg.mix) return limbMix(lg, hp, s, legPts, B.thigh, B.shin);
    if (Array.isArray(lg)) { const [d, dd] = fkLeg(lg, s); const bq = body.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(pelvis.getWorldQuaternion(new THREE.Quaternion())); d.applyQuaternion(bq); dd.applyQuaternion(bq); const kn = hp.clone().addScaledVector(d, B.thigh); return [kn, kn.clone().addScaledVector(dd, B.shin)]; }
    const T = new THREE.Vector3(...lg.to), kn = ik(hp, T, B.thigh, B.shin, lg.pole ? new THREE.Vector3(...lg.pole) : hp.clone().add(new THREE.Vector3(s * 0.05, 0, 1))); return [kn, kn.clone().add(T.clone().sub(kn).setLength(B.shin))]; };
  const limbMix = (m, base, s, pts, l1, l2) => { const [j0, e0] = pts(m.mix[0], base, s), [j1, e1] = pts(m.mix[1], base, s), k = m.k;
    const e = e0.clone().lerp(e1, k), jGuess = j0.clone().lerp(j1, k), j = ik(base, e, l1, l2, jGuess.clone().multiplyScalar(2).sub(base.clone().add(e).multiplyScalar(0.5)));
    return [j, j.clone().add(e.clone().sub(j).setLength(l2))]; };
  // 1.0.3 hand rest: a hand that would sink into a desk, table, podium, counter or seat top (static furniture tops between 0.3 and
  // 1.35 m, found once per scene) is lifted onto the surface and the arm re-solved, so resting hands lie on the top
  const restHand = (el, wr, sh) => {
    let sc = root; while (sc.parent) sc = sc.parent; if (!sc.isScene) return null; const boxes = restBoxes(sc); if (!boxes.length) return null;
    // the lift fades in over the last 6 cm inside the top's edges and fades out deep below it, so an arm sweeping past a desk
    // edge never snaps (a hard on / off made forearms jump in one frame)
    const w = body.localToWorld(wr.clone()), lift = handR * 0.85 * (root.scale.y || 1); let best = 0, goal = 0;
    for (const b of boxes) { if (w.y >= b[4] + lift || w.y <= b[4] - 0.3) continue;
      const edge = Math.min(w.x - b[0], b[1] - w.x, w.z - b[2], b[3] - w.z); if (edge <= -0.02) continue;
      const sm = (u) => u * u * (3 - 2 * u), k = sm(clamp((edge + 0.02) / 0.08)) * sm(clamp((w.y - (b[4] - 0.3)) / 0.1));
      if (k > best) { best = k; goal = b[4] + lift; } }
    if (best < 0.01) return null;
    w.y += (goal - w.y) * best; const T = body.worldToLocal(w), e = ik(sh, T, B.upperArm, B.foreArm, el.clone().multiplyScalar(2).sub(sh.clone().add(T).multiplyScalar(0.5)));
    return [e, e.clone().add(T.clone().sub(e).setLength(B.foreArm))];
  };
  const JB = { L: {}, R: {} };   // 1.0.2: last solved joint points in body space (root.joints() → world)
  root.pose = (p) => {
    p = typeof p === 'string' ? POSES3[p] : p;
    // follow-through: hair lags the head and the body stretches a little when it rises or drops fast (poses from posesAt3 carry _prev)
    const q = p._prev; let sy = 1;
    if (q) { const dp = (p.head?.[0] || 0) + (p.spine?.[0] || 0) - (q.head?.[0] || 0) - (q.spine?.[0] || 0), dyw = (p.head?.[1] || 0) + (p.spine?.[1] || 0) - (q.head?.[1] || 0) - (q.spine?.[1] || 0);
      hairG.rotation.set(clamp(-dp * 0.35, -9, 9) * D2R, clamp(-dyw * 0.3, -9, 9) * D2R, 0); sy = 1 + clamp(((p.y || 0) - (q.y || 0)) * 0.9, -0.06, 0.06); }
    else hairG.rotation.set(0, 0, 0);
    secondary(p);
    body.scale.set(scale / Math.sqrt(sy), scale * sy, scale / Math.sqrt(sy));
    if (contact) { const lying = Math.abs((p.hips || [0])[0]) > 45, up = Math.max(0, p.y || 0); contact.visible = !lying; const k = clamp(1 - up * 1.6, 0.35, 1); contact.scale.set(k, k, 1); contact.material.opacity = (S().contact ?? 0.42) * k * (contact.userData.fade ?? 1); }
    seated(p);
    // 2.0.1: hips lower than a crouch (sitting, kneeling, lying) keep their old height above the floor, so chairs, beds and desks
    // still fit; standing poses rise with the longer legs. Built-in hand targets (rel) move up with the body when standing.
    const dH = B.hipY - BODY.hipY, kSeat = V2 ? smooth((-(p.y || 0) - 0.06) / 0.08) : 0, yy = (p.y || 0) - dH * kSeat, up2 = dH * (1 - kSeat);
    if (V2 && up2 > 1e-4) { const sh = (a) => !a || Array.isArray(a) ? a : a.mix ? { ...a, mix: a.mix.map(sh) } : a.rel && a.to ? { ...a, to: [a.to[0], a.to[1] + up2, a.to[2]], pole: a.pole && [a.pole[0], a.pole[1] + up2, a.pole[2]] } : a; p = { ...p, armL: sh(p.armL), armR: sh(p.armR) }; }
    pelvis.position.set(V2 ? p.sx || 0 : 0, B.hipY + yy, 0); pelvis.rotation.copy(eul(p.hips || [0, 0, 0]));
    chest.rotation.copy(eul(p.spine || [0, 0, 0])); head.rotation.copy(eul(p.head || [0, 0, 0]));
    body.updateMatrixWorld(true);
    if (V2 && kSeat > 0) {   // floor guard: longer legs must not sink through the floor (kneeling, crouching, squatting)
      let low = 1; for (const [side, s] of [['L', 1], ['R', -1]]) { const lg = p['leg' + side] || [0, 3, 2, 0]; if (!Array.isArray(lg) && !lg.mix) continue; const [kn, an] = legPts(lg, toBody(pelvis, new THREE.Vector3(s * B.hipX, 0, 0)), s); low = Math.min(low, kn.y - 0.06, an.y - B.ankleY); }
      if (low < 0) { pelvis.position.y -= low * kSeat; body.updateMatrixWorld(true); } }
    for (const [side, s] of [['L', 1], ['R', -1]]) {
      const sh = toBody(chest, new THREE.Vector3(s * (chunky ? B.shoulderX + 0.02 : B.shoulderX), B.shoulderY, 0));
      const a = p['arm' + side] || [6, 12, 12, 0]; let el, wr, d2;
      if (a && a.mix) { [el, wr] = limbMix(a, sh, s, armPts, B.upperArm, B.foreArm); d2 = wr.clone().sub(el).normalize(); }
      else if (Array.isArray(a)) { const [d, dd] = fkArm(a, s); const bq = body.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(chest.getWorldQuaternion(new THREE.Quaternion())); d.applyQuaternion(bq); dd.applyQuaternion(bq); el = sh.clone().addScaledVector(d, B.upperArm); wr = el.clone().addScaledVector(dd, B.foreArm); d2 = dd; }
      else { const T = new THREE.Vector3(...a.to); el = ik(sh, T, B.upperArm, B.foreArm, a.pole ? new THREE.Vector3(...a.pole) : sh.clone().add(new THREE.Vector3(s * 0.4, -0.3, -0.5))); wr = el.clone().add(T.clone().sub(el).setLength(B.foreArm)); d2 = wr.clone().sub(el).normalize(); }
      if (outfit.rest !== false && !p.noRest) { const r = restHand(el, wr, sh); if (r) { [el, wr] = r; d2 = wr.clone().sub(el).normalize(); } }   // 1.0.3
      place(L['up' + side], sh, el, L['up' + side].r); place(L['lo' + side], el, wr, L['lo' + side].r);
      if (sleeveRings[side].length) { const [a, b, c, d] = sleeveRings[side], setRing = (m, A, Bp, k) => { m.position.lerpVectors(A, Bp, k); tmp.copy(Bp).sub(A).normalize(); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tmp); }; setRing(a, sh, el, 0.38); setRing(b, sh, el, 0.76); setRing(c, el, wr, 0.3); setRing(d, el, wr, 0.66); }
      if (L['cuff' + side]) { const c0 = wr.clone().addScaledVector(d2, puff ? -0.025 : -0.05); place(L['cuff' + side], c0, wr.clone().addScaledVector(d2, puff ? 0.02 : -0.005), L['cuff' + side].r); }
      if (shoulderBall.length) shoulderBall[side === 'L' ? 0 : 1].position.copy(sh);
      setHand(hands[side], p['hand' + side] || 'relaxed', el, wr, s);
      const hp = toBody(pelvis, new THREE.Vector3(s * B.hipX, 0, 0)); const lg = p['leg' + side] || [0, 3, 2, 0]; let kn, an, ld2;
      if (lg && lg.mix) { [kn, an] = limbMix(lg, hp, s, legPts, B.thigh, B.shin); ld2 = an.clone().sub(kn).normalize(); }
      else if (Array.isArray(lg)) { const [d, dd] = fkLeg(lg, s); const bq = body.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(pelvis.getWorldQuaternion(new THREE.Quaternion())); d.applyQuaternion(bq); dd.applyQuaternion(bq); kn = hp.clone().addScaledVector(d, B.thigh); an = kn.clone().addScaledVector(dd, B.shin); ld2 = dd; }
      else { const T = new THREE.Vector3(...lg.to); kn = ik(hp, T, B.thigh, B.shin, lg.pole ? new THREE.Vector3(...lg.pole) : hp.clone().add(new THREE.Vector3(s * 0.05, 0, 1))); an = kn.clone().add(T.clone().sub(kn).setLength(B.shin)); ld2 = an.clone().sub(kn).normalize(); }
      let plant = 0;
      if (V2 && Array.isArray(lg) && p.plant !== false) {   // 2.0.1: a standing leg keeps its foot on the floor: the knee gives instead
        plant = smooth((0.1 - Math.abs(p.y || 0)) / 0.04) * smooth((32 - Math.abs(lg[0])) / 10) * smooth((50 - lg[2]) / 12);
        if (plant > 0.001) { const goal = an.clone(); goal.y = lerp(an.y, B.ankleY, plant); kn = ik(hp, goal, B.thigh, B.shin, kn.clone().add(new THREE.Vector3(s * 0.05, 0, 0.5))); an = kn.clone().add(goal.clone().sub(kn).setLength(B.shin)); ld2 = an.clone().sub(kn).normalize(); } }
      place(L['th' + side], hp, kn, L['th' + side].r); place(L['sh' + side], kn, an, L['sh' + side].r);
      if (L['lc' + side]) place(L['lc' + side], an.clone().addScaledVector(ld2, -0.055), an.clone().addScaledVector(ld2, -0.005), L['lc' + side].r);
      JB[side] = { sh: sh.clone(), el: el.clone(), wr: wr.clone(), hp: hp.clone(), kn: kn.clone(), an: an.clone() };
      const yaw = (p.hips?.[1] || 0) + (Array.isArray(lg) ? s * (lg[3] || 0) : 0) + s * 6 + (p['footYaw' + side] || 0);
      setFoot(feet[side], an, ld2, Array.isArray(lg) ? lerp(p.flatFeet ?? 0.55, 1, plant) : 1, new THREE.Vector3(Math.sin(yaw * D2R), 0, Math.cos(yaw * D2R)), V2 ? p['foot' + side] ?? (plant > 0.5 || !Array.isArray(lg) ? 0 : null) : null);
    }
    return root;
  };
  // ---------------------------------------------------------------- face
  let faceKey = '';
  root.face = (o = {}) => {
    if (!faceMesh) return root;
    const seed = (opts.seed || 0) * 13 + 1;
    const keys = Array.isArray(o.expr) ? o.expr : null;
    const ex = keys ? exprAt(o.t ?? 0, keys, o.exprBlend ?? 0.16) : typeof o.expr === 'object' ? o.expr : EXPRESSIONS[o.expr || 'neutral'] || EXPRESSIONS.neutral;
    let bl = typeof o.blink === 'number' ? o.blink : o.blink && o.blink !== true ? 1 : 0;
    if (o.blink === true && o.t != null) bl = blinkAt(o.t, seed, keys ? keys.slice(1).map(k => k[0]) : []);
    let talk = o.talk || 0, round = 0, vis = null;
    const spk = o.speaker ?? (o.gt != null && o.talk == null ? outfit.speaker : null); let stress = 0;   // 1.0.3: face({ gt }) lip-syncs by the character's own name
    if (spk && o.gt != null) talk = talkShape(spk, o.gt);
    if (typeof talk === 'object') stress = talk.stress || 0;
    if (typeof talk === 'object') { round = talk.round || 0; vis = { wide: Math.round((talk.wide || 0) * 2) / 2, teeth: talk.teeth > 0.5 ? 1 : 0, closed: talk.closed > 0.5 ? 1 : 0 }; talk = talk.open || 0; }
    talk = Math.round(clamp(talk) * 8) / 8;   // 1.0: 8 steps (was 4) so the mouth moves smoothly
    let look = o.look; if (!look) look = o.t != null && o.saccade !== false && !ex.eye.closed ? saccade(o.t, seed, typeof o.saccade === 'number' ? o.saccade : 1) : [0, 0];
    look = look.map(v => Math.round(v * 12) / 12);
    let eye = ex.eye, mouth = ex.mouth; const blink = bl >= 0.7;
    if (!blink && bl > 0.05 && !eye.closed) eye = { ...eye, open: (eye.open ?? 0.82) * Math.round((1 - bl) * 4) / 4 };
    if (talk > 0.05 && round > 0.5 && ['flat', 'smile', 'smirk', 'frown'].includes(mouth.type)) mouth = { ...mouth, type: 'o', w: Math.max(0.22, (mouth.w || 0.5) * 0.6), open: 0 };
    // 1.0.3: open-mouth expressions (grin, teeth, open, o, wavy) also follow the sounds: m/b/p nearly close them, o/u/w round and
    // narrow them, e/i widen them; the jaw drop comes from the sound instead of a fixed opening
    else if (vis && ['grin', 'teeth', 'open', 'o', 'wavy'].includes(mouth.type)) { const base = mouth.open || 0, w0 = mouth.w || 0.5;
      mouth = { ...mouth, open: vis.closed ? base * 0.15 : base * 0.45 + talk * 0.6, w: w0 * (round > 0.5 ? 0.72 : 1) * (1 + 0.18 * (vis.wide || 0)) }; talk = 0; }
    // stressed words: brows lift and the eyes open a touch, the way people underline a word
    if (stress > 0.3 && !eye.closed) eye = { ...eye, open: (eye.open ?? 0.82) * (1 + 0.12 * stress), lid: (eye.lid || 0) - 0.18 * stress };
    mouth = { ...mouth, open: mouth.open != null ? Math.round(mouth.open * 8) / 8 : mouth.open, w: mouth.w != null ? Math.round(mouth.w * 20) / 20 : mouth.w };
    if (eye.open != null) eye = { ...eye, open: Math.round(eye.open * 16) / 16, lid: Math.round((eye.lid || 0) * 16) / 16 };
    const k = JSON.stringify([eye, mouth, talk, blink, look, eyeStyle, pal, vis]);
    if (k !== faceKey) { faceKey = k; faceMat.map = faceTexture(k, (g) => drawFace(g, { eye, mouth, talk, blink, look, style: eyeStyle, pal, vis })); faceMat.needsUpdate = true; }
    return root;
  };
  // lookAt3(point, k = 1): turn the head toward a world point; k < 1 blends from the pose's own head angle (smooth turns)
  root.lookAt3 = (pt, k = 1) => {
    const a = root.lookAngles(pt); if (!a) return root;
    head.rotation.set(lerp(head.rotation.x, a[0], k), lerp(head.rotation.y, a[1], k), head.rotation.z, 'YXZ'); return root;
  };
  root.lookAngles = (pt) => {   // [pitch, yaw] the head would need to face pt (radians, clamped)
    if (!pt) return null; const p = pt.isVector3 ? pt : new THREE.Vector3(...pt); root.updateMatrixWorld(true);
    const hw = head.getWorldPosition(new THREE.Vector3()); const local = neck.worldToLocal(p.clone()).sub(neck.worldToLocal(hw.clone()));
    return [clamp(-Math.atan2(local.y, Math.hypot(local.x, local.z)), -0.6, 0.6), clamp(Math.atan2(local.x, local.z), -1.1, 1.1)];
  };
  root.place = (x = 0, y = 0, z = 0, yaw = 0) => { root.position.set(x, y, z); root.rotation.y = yaw; return root; };
  root.faceTo = (x, z) => { root.rotation.y = Math.atan2(x - root.position.x, z - root.position.z); return root; };
  root.headWorld = () => head.getWorldPosition(new THREE.Vector3());
  root.joints = () => { body.updateWorldMatrix(true, false); const w = (v) => body.localToWorld(v.clone()), side = (s) => { const o = {}; for (const k in JB[s]) o[k] = w(JB[s][k]); return o; };
    const sx = root.scale?.y || 1; return { L: side('L'), R: side('R'), pelvis: pelvis.getWorldPosition(new THREE.Vector3()), neck: toW(chest, 0.47), chest: toW(chest, 0.25), head: head.getWorldPosition(new THREE.Vector3()), k: sx * scale, floor: root.position.y, moving: (root.userData.mo?.v || 0) > 0.2 }; };
  const toW = (frame, y) => frame.localToWorld(new THREE.Vector3(0, y, 0));
  // 1.0.1: put something on the head (T.W.gradCap(), a crown, a party hat): sits on top, tilted back a little; o.pos / o.rot override
  root.wear = (obj, o = {}) => { head.add(obj); obj.position.set(...(o.pos || [0, BODY.headR * 1.12, -0.03])); obj.rotation.set(...(o.rot || [-0.18, 0, 0])); return obj; };
  root.handWorld = (side = 'L') => hands[side].g.getWorldPosition(new THREE.Vector3());
  root.chestWorld = () => chest.localToWorld(new THREE.Vector3(0, 0.3, 0));
  root.parts = { body, pelvis, chest, head, neck, hands, feet, skull, faceMesh, torso, skirt, hair: hairG, contact };
  root.hold = (obj, side = 'L', o = {}) => { const h = hands[side].g; h.add(obj); obj.position.set(...(o.pos || [0, -0.1, 0.04])); obj.rotation.set(...(o.rot || [0, 0, 0])); return obj; };
  root.setOpacity = (a) => { root.traverse(m => { if (m === contact) { m.userData.fade = a; m.material.opacity = (S().contact ?? 0.42) * a; return; } if (m.material) [].concat(m.material).forEach(mm => { mm.transparent = a < 1; mm.opacity = a; }); }); };   // the contact shadow stays see-through
  root.outfit = outfit; root.look = { skin, eyeStyle, dark };
  if (prop) root.hold(prop.obj, prop.side, { pos: prop.pos, rot: prop.rot });
  root.pose(opts.pose || outfit.pose || 'stand'); root.face({ expr: opts.expr || 'neutral' });
  return root;
}
let _sole = null, _contactTex = null;
function contactTex() { if (_contactTex) return _contactTex; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); _contactTex = new THREE.CanvasTexture(c); return _contactTex; }
let _halfSph = null;
function roundedSole() { if (_sole) return _sole; const s = new THREE.Shape(); s.absellipse(0, 0, 0.064, 0.14, 0, Math.PI * 2); _sole = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }); _sole.rotateX(Math.PI / 2); _sole.translate(0, 0.03, 0); return _sole; }
