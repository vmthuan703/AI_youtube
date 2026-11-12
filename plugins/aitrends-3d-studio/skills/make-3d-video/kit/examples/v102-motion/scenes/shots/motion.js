// v102-motion (1.0.2): the action library (T.act.*), acting (gaze, react, busy crowds), longer arms (before / after), grips,
// skirt sway and the smart camera (a framing put behind a wall on purpose: the camera finds the face by itself).
// Run the motion QC with: node render.mjs --project examples/v102-motion --qc
import { registerShot, clamp } from '/engine/core.js';
import { HERO, MAYA, SAM } from '../cast.js';
import { STUDENTS, RIVAL, CLASSMATE, TEACHER_F, BRO_2, PRINCIPAL } from '/channel/cast.js';
const PI = Math.PI, R2 = PI / 2;
const cam = (s, t, info, T, o) => T.camShot(s.st.camera, t, info.shot.camera, { dur: info.dur, ...o });
const sign = (T, txt, w = 1.2) => T.plane(w, 0.3, T.mat('#ffffff', { map: T.textTex(txt, { w: 512, h: 128, bg: '#1a1a24', color: '#f2b632', size: 70, font: 'Nunito' }) }));

registerShot('door', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 34, fog: [12, 40] }); const c = T.W.classroom(st, {});
    const dr = st.add(T.W.swingDoor({ color: '#6a4a36' })); dr.position.set(2.5, 0, c.d / 2 - 0.22); dr.rotation.y = PI;
    const hero = st.add(T.character(HERO).place(1.75, 0, c.d / 2 - 0.85, 0.3)); return { st, c, dr, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.act.door(s.hero, s.dr, t, { t0: 0.5, close: 2.3 })).face({ expr: [[0, 'neutral'], [1.2, 'surprised']], t, blink: true }); cam(s, t, info, T, { a: s.hero, side: -1 }); },
});
registerShot('carry', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 36, fog: [12, 40] }); T.W.library(st, {});
    const box = st.add(T.group(T.box(0.42, 0.3, 0.32, T.mat('#b8864a', { rough: 0.8 }), 0, 0, 0), T.box(0.43, 0.04, 0.33, T.mat('#8a5a2a'), 0, 0.13, 0))); box.userData.qcSkip = true; box.userData.dynamic = true;
    const hero = st.add(T.character(HERO).place(-3, 0, 3.6, R2)); return { st, box, hero }; },
  draw(s, t, info, T) { const w = t > 1.7 ? T.walkTo(s.hero, t, { from: [-3, 3.6], to: [-1.2, 3.6], t0: 1.7, t1: 3.2 }) : null;
    T.act.carry(s.hero, s.box, t, { from: [-2.45, 0.15, 3.6], pickAt: 1.0, walk: w || T.idle3('stand', t) }); s.hero.face({ expr: [[0, 'neutral'], [1.0, 'determined']], t, blink: true });
    cam(s, t, info, T, { a: s.hero, side: -1, dist: 0.9 }); },
});
registerShot('sitOn', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 34, fog: [8, 30] }); const n = T.W.nurseOffice(st, {});
    const hero = st.add(T.character(HERO)); return { st, n, hero }; },
  draw(s, t, info, T) { const b = s.n.bed; s.hero.pose(T.act.sitOn(s.hero, t, { seat: [b[0], b[1], b[2], 0.72], t0: 0.6, dur: 1.0 })).face({ expr: 'nervous', t, blink: true }); cam(s, t, info, T, { a: s.hero, side: -1 }); },
});
registerShot('runStop', {
  init(T) { const st = T.stage({ ...T.W.schoolTime('morning'), fov: 34, fog: [30, 140] }); T.W.suburbStop(st, { busX: 40 }); const hero = st.add(T.character(HERO)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.act.runStop(s.hero, t, { from: [-6, 0.4], to: [3, 0.4], t0: 0, t1: 1.9, y: 0.14 })).face({ expr: [[0, 'determined'], [1.9, 'shocked']], t, blink: true }); cam(s, t, info, T, { a: s.hero, side: 1 }); },
});
registerShot('trip', {
  init(T) { const st = T.stage({ mood: 'day', fov: 36, fog: [16, 60] }); T.W.cafeteria(st, {}); const hero = st.add(T.character(HERO)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.act.trip(s.hero, t, { from: [-3, 1.7], dir: R2, t0: 1.1 })).face({ expr: [[0, 'smile'], [1.1, 'shocked'], [2.1, 'nervous']], t, blink: true }); cam(s, t, info, T, { a: s.hero, side: -1, dist: 1.1 }); },
});
registerShot('vault', {
  init(T) { const st = T.stage({ mood: 'day', fov: 36, fog: [30, 140] }); T.W.schoolYard(st, {}); const bn = st.add(T.W.bench({})); bn.position.set(0, 0, 0); bn.rotation.y = R2;
    const hero = st.add(T.character(HERO)); return { st, hero }; },
  draw(s, t, info, T) { const p = t < 0.7 ? T.walkTo(s.hero, t, { from: [-3.2, 0], to: [-1.0, 0], t0: 0, t1: 0.75, run: true }) : T.act.vault(s.hero, t, { from: [-1.0, 0, 0], to: [1.2, 0, 0], t0: 0.95, h: 0.75, at: [0, 0.48, 0] });
    s.hero.pose(t > 2.2 ? T.blendPose3(p, T.walkTo(s.hero, t, { from: [1.2, 0], to: [2.6, 0], t0: 2.2, t1: 3.3, run: true }), T.clamp((t - 2.2) / 0.2)) : p).face({ expr: 'joy', t, blink: true }); cam(s, t, info, T, { a: s.hero, side: 1, dist: 1.15 }); },
});
registerShot('climbOn', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 36, fog: [12, 40] }); const c = T.W.classroom(st, {}); const ch = st.add(T.W.chair({ color: '#3a4a7a' })); ch.position.set(3.6, 0, 1.8);
    const hero = st.add(T.character(HERO)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.act.climbOn(s.hero, t, { from: [3.6, 1.15], onto: [3.6, 0.43, 1.82], t0: 0.5, dur: 1.0 })).face({ expr: [[0, 'determined'], [1.7, 'joy']], t, blink: true });
    cam(s, t, info, T, { a: s.hero, side: -1, dist: 1.1 }); },
});
registerShot('hug', {
  init(T) { const st = T.stage({ mood: 'golden', fov: 34, fog: [20, 100] }); T.W.schoolFront(st, { bus: false });
    const hero = st.add(T.character(HERO).place(-0.27, 0, -4, R2)), sam = st.add(T.character(SAM).place(0.27, 0, -4, -R2)); return { st, hero, sam }; },
  draw(s, t, info, T) { const [a, b] = T.act.hug(s.hero, s.sam, t, { t0: 0.3, dur: 1.4 }); s.hero.pose(a).face({ expr: [[0, 'smile'], [1.0, 'happy']], t, blink: true }); s.sam.pose(b).face({ expr: 'joy', t, blink: true }); cam(s, t, info, T, { a: s.hero, b: s.sam }); },
});
registerShot('highFive', {
  init(T) { const st = T.stage({ mood: 'day', fov: 34, fog: [20, 90] }); T.W.court(st, {});
    const hero = st.add(T.character(HERO).place(-0.42, 0, 0, R2)), bro = st.add(T.character(BRO_2).place(0.42, 0, 0, -R2)); return { st, hero, bro }; },
  draw(s, t, info, T) { const [a, b] = T.act.highFive(s.hero, s.bro, t, { t0: 1.2 }); s.hero.pose(a).face({ expr: [[0, 'smile'], [1.2, 'joy']], t, blink: true }); s.bro.pose(b).face({ expr: [[0, 'smile'], [1.2, 'joy']], t, blink: true });
    cam(s, t, info, T, { a: s.hero, b: s.bro }); },
});
registerShot('armAround', {
  init(T) { const st = T.stage({ mood: 'golden', fov: 34, fog: [20, 100] }); T.W.park(st, {});
    const hero = st.add(T.character(HERO).place(-0.33, 0, 0, 0)), bro = st.add(T.character(BRO_2).place(0.33, 0, 0, 0)); return { st, hero, bro }; },
  draw(s, t, info, T) { const [a, b] = T.act.armAround(s.hero, s.bro, t, { t0: 0.5 }); s.hero.pose(a).face({ expr: 'smile', t, blink: true, look: [0.4, 0] }); s.bro.pose(b).face({ expr: 'happy', t, blink: true, look: [-0.4, 0] });
    cam(s, t, info, T, { a: [0, 1.45, 0], fov: 32 }); },
});
registerShot('pullRun', {
  init(T) { const st = T.stage({ mood: 'day', fov: 34, fog: [30, 160] }); T.W.shopStreet(st, {}); const hero = st.add(T.character(HERO)), sam = st.add(T.character(SAM)); return { st, hero, sam }; },
  draw(s, t, info, T) { const [b, a] = T.act.pullRun(s.sam, s.hero, t, { from: [-6, -0.8], to: [6, -0.8], t0: 0.1, t1: 3.2, y: 0.15 }); s.sam.pose(b).face({ expr: 'joy', t, blink: true }); s.hero.pose(a).face({ expr: 'surprised', t, blink: true });
    cam(s, t, info, T, { a: s.sam, side: -1, dist: 1.0 }); },
});
registerShot('catchFall', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 34, fog: [10, 40] }); T.W.hospitalHall(st, {});
    const sam = st.add(T.character(SAM).place(0, 0, 0.3, PI)), hero = st.add(T.character(HERO).place(0, 0, 1.3, PI)); return { st, hero, sam }; },
  draw(s, t, info, T) { const [a, b] = T.act.catchFall(s.hero, s.sam, t, { t0: 0.9 }); s.hero.pose(a).face({ expr: [[0, 'neutral'], [0.9, 'scared']], t, blink: true }); s.sam.pose(b).face({ expr: [[0, 'nervous'], [0.9, 'sleepy']], t, blink: false });
    const c = s.st.camera; c.position.set(1.25 - t * 0.05, 1.25, -1.5); c.lookAt(0, 1.0, 0.55); if (c.fov !== 36) { c.fov = 36; c.updateProjectionMatrix(); } },
});
registerShot('react', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 38, fog: [14, 50] }); const c = T.W.classroom(st, {});
    const kids = [[0, 0], [0, 2], [1, 1], [1, 3], [2, 0], [2, 2]].map(([r, cc], i) => st.add(T.character(i === 2 ? HERO : STUDENTS[i % STUDENTS.length]).place(c.seat(r, cc)[0], 0, c.seat(r, cc)[1], PI)));
    const bk = st.add(T.W.book({ color: '#c8443a' })); return { st, c, kids, bk, src: [3.6, 0.1, -1.2] }; },
  draw(s, t, info, T) { const t0 = 1.1; s.bk.position.set(3.6, Math.max(0.02, 0.8 - Math.max(0, t - 0.75) ** 2 * 4.9), -1.2); s.bk.rotation.z = Math.min(1.2, Math.max(0, t - 0.75) * 4);
    s.kids.forEach((k, i) => { const r = T.act.react(k, T.idle3('sitStudy', t, { seed: i }), t, { t0: t0 + i * 0.05, from: s.src, kind: 'startle' }); k.pose(r.pose).face({ expr: t > t0 ? 'surprised' : 'neutral', t, blink: true, look: r.look || [0, 0] }); });
    cam(s, t, info, T, { a: s.kids[2] }); },
});
registerShot('busyCrowd', {
  init(T) { const st = T.stage({ mood: 'day', fov: 38, fog: [16, 60] }); T.W.cafeteria(st, {});
    const spots = [[-4, 1.6, PI], [-3.4, 1.0, 0.3], [-4.6, 1.0, -0.4], [2.5, 1.7, PI], [3.2, 1.2, -0.6], [2.0, 1.1, 0.5], [-0.6, -1.6, R2], [0.2, -1.6, -R2]];
    T.act.busyCrowd(st, { cast: [STUDENTS[0], STUDENTS[1], STUDENTS[2], STUDENTS[3], CLASSMATE, RIVAL, STUDENTS[4], STUDENTS[5] || STUDENTS[0]], spots, acts: ['talk', 'listen', 'laugh', 'phone', 'talk', 'lean', 'talk', 'listen'] });
    const hero = st.add(T.character(HERO)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.walkTo(s.hero, t, { from: [-1, 5], to: [-1, 2.4], t0: 0, t1: 2.6 })).face({ expr: 'neutral', t, blink: true }); cam(s, t, info, T, { a: s.hero, dist: 0.85 }); },
});
registerShot('arms', {
  init(T) { const st = T.stage({ mood: 'pearl', fov: 34 }); T.W.studio?.(st, {});
    const a = st.add(T.character({ ...HERO, arms: 1 }).place(-0.8, 0, 0, 0)), b = st.add(T.character(HERO).place(0.8, 0, 0, 0));
    const s1 = sign(T, 'BEFORE (1.0.1)'), s2 = sign(T, 'AFTER (1.0.2)'); s1.position.set(-0.8, 2.15, 0); s2.position.set(0.8, 2.15, 0); st.add(s1, s2); return { st, a, b }; },
  draw(s, t, info, T) { const p = T.flow3(t, [[0, 'stand'], [0.4, 'stand'], [1.1, 'raiseHand'], [1.9, 'raiseHand'], [2.6, 'cheer']]); s.a.pose(p).face({ expr: 'smile', t, blink: true }); s.b.pose(p).face({ expr: 'smile', t, blink: true });
    cam(s, t, info, T, { a: [0, 1.55, 0], dist: 0.62, avoid: false }); },
});
registerShot('grips', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 30, fog: [10, 40] }); T.W.dinerUS(st, {});
    const a = st.add(T.character(HERO).place(-0.75, 0, 1.2, 0)), b = st.add(T.character(SAM).place(0, 0, 1.2, 0)), c = st.add(T.character(BRO_2).place(0.75, 0, 1.2, 0));
    const um = T.W.umbrella({ color: '#2a3a8a', open: 0 }), pen = T.cyl(0.008, 0.008, 0.16, T.mat('#2a5aa0'), 0, 0, 0, 8), ball = T.sphere(0.11, T.mat('#e8762a', { rough: 0.6 }));
    a.hold(um, 'R', { pos: [0, -0.08, 0.02], rot: [PI, 0, 0] }); b.hold(pen, 'R', { pos: [0, -0.07, 0.03], rot: [0.6, 0, 0] }); c.hold(ball, 'R', { pos: [0, -0.15, 0.04] }); return { st, a, b, c }; },
  draw(s, t, info, T) { s.a.pose({ ...T.idle3('stand', t), armR: { to: [-0.2, 1.0, 0.25], pole: [-0.7, 0.7, -0.3] }, handR: 'grip' }).face({ expr: 'smile', t, blink: true });
    s.b.pose({ ...T.idle3('stand', t, { seed: 2 }), armR: { to: [-0.12, 1.12, 0.3], pole: [-0.7, 0.7, -0.3] }, handR: 'pinch' }).face({ expr: 'thinking', t, blink: true });
    s.c.pose({ ...T.idle3('stand', t, { seed: 3 }), armR: { to: [-0.15, 1.05, 0.32], pole: [-0.7, 0.7, -0.3] }, handR: 'cup' }).face({ expr: 'joy', t, blink: true }); cam(s, t, info, T, { a: s.b, dist: 0.95, avoid: false }); },
});
registerShot('skirt', {
  init(T) { const st = T.stage({ mood: 'golden', fov: 34, fog: [20, 100] }); T.W.park(st, {}); T.W.leaves(st, { area: [-6, 6, 0, 5, -3, 3], n: 60 }); const sam = st.add(T.character(SAM)); return { st, sam }; },
  draw(s, t, info, T) { s.sam.pose(T.walkTo(s.sam, t, { from: [-3, 0.4], to: [3, 0.4], t0: 0, t1: 3.3 })).face({ expr: 'happy', t, blink: true }); cam(s, t, info, T, { a: s.sam, side: -1, dist: 0.7 }); },
});
registerShot('smartCam', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 34, fog: [10, 30] }); const p = T.W.principalOffice(st, {});
    const hero = st.add(T.character(HERO).place(p.guest(1)[0], 0, p.guest(1)[1], p.guest(1)[2])), pr = st.add(T.character(PRINCIPAL));
    pr.position.set(p.principal[0], 0, p.principal[1] + 0.15); pr.rotation.y = 0; return { st, hero, pr }; },
  // asked for a medium shot from straight in front of the hero, 2.9 m away: that spot is behind the office wall. The camera swings
  // round until the face is clear.
  draw(s, t, info, T) { s.hero.pose(T.idle3('sit', t)).face({ expr: 'nervous', t, blink: true }); s.pr.pose(T.idle3('crossArmsAngry', t)).face({ expr: 'angry', t, blink: true }); cam(s, t, info, T, { a: s.hero, b: s.pr, line: false }); },
});
