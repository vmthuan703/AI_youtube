// v101-school (1.0.1): an American high-school day in 20 shots — suburb bus stop in the fall, lockers and the bell, chem lab, library,
// rain on the class windows, detention, a storm blackout with the tornado-drill beacon, cafeteria, Friday-night football, the
// principal's office, the nurse, the restroom mirror, band, the auditorium stage, the locker room, a snow day in the lot, prom,
// the diner, graduation caps, sharing an umbrella in the rain. Named school cameras from shots.json (T.camShot).
import { registerShot, clamp } from '/engine/core.js';
import { HERO, MAYA, SAM } from '../cast.js';
import { STUDENTS, RIVAL, CLASSMATE, TEACHER_F, TEACHER_M, PRINCIPAL, COACH, NURSE, BRO_2 } from '/channel/cast.js';
const PI = Math.PI, R2 = PI / 2;
const cam = (s, t, info, T, o) => T.camShot(s.st.camera, t, info.shot.camera, { dur: info.dur, ...o });
const sitAt = (T, outfit, seat, y = 0) => T.character(outfit).place(seat[0], seat[3] ?? y, seat[1], seat[2]);
const arms = (T, pose, from) => { const p = T.POSES3[from]; return { ...pose, armL: p.armL, armR: p.armR, handL: p.handL, handR: p.handR }; };

registerShot('suburb', {
  init(T) { const st = T.stage({ ...T.W.schoolTime('morning'), fov: 36, fog: [30, 140] }); const u = T.W.suburbStop(st, { autumn: true, busX: 30 }); T.W.fallDay(st, { area: [-8, 10, 0, 6, -3, 2], y: 0.14, piles: 0 });
    const hero = st.add(T.character(HERO)), sam = st.add(T.character(SAM).place(5.6, 0.14, 0.3, -R2 + 0.3)); return { st, u, hero, sam }; },
  draw(s, t, info, T) { s.u.bus.position.x = 30 - 24 * T.ease.out(clamp(t / 2.8));
    const w = T.walkTo(s.hero, t, { from: [0.8, 0.35], to: [3.9, 0.35], t0: 0, t1: 2.3, y: 0.14 }); s.hero.pose(T.blendPose3(w, T.idle3('wave', t), T.ease.inOut(clamp((t - 2.15) / 0.45)))).face({ expr: 'smile', t, blink: true });
    s.sam.pose(T.idle3('wave', t, { seed: 2 })).face({ expr: 'happy', t, blink: true }); cam(s, t, info, T, { a: s.hero, b: s.sam, dist: 0.7 }); },
});
registerShot('locker', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 30, fog: [10, 40] }); const h = T.W.lockerHall(st, {}); const L = h.locker(14, 1);
    const hero = st.add(T.character(HERO).place(L.front[0] - 0.12, 0, L.z + 0.4, L.yaw + PI + 0.35)); const bell = T.W.bell(st, { pos: [-2.25, 2.5, L.z + 1.5], yaw: R2, t0: 1.2 });
    const handle = new T.THREE.Object3D(); handle.position.set(0.42, 0.05, 0.05); L.door.add(handle);
    const kids = [STUDENTS[0], STUDENTS[2], STUDENTS[4]].map(o => st.add(T.character(o))); return { st, h, L, hero, kids, handle, peek: [1.7, 1.4, L.z + 1.7] }; },
  draw(s, t, info, T) {
    // the door: opened by the hand at 0.55 s, swung shut at 2.0 s (rattle); the right hand stays on the handle while it moves the door
    const ang = T.lockerDoor(s.L.door, t, { t0: 0.55, dur: 0.75, open: 1.55, slam: 2.0 }); s.L.door.updateMatrixWorld(true);
    const sm = (a, b) => { const k = T.clamp((t - a) / (b - a)); return k * k * (3 - 2 * k); };
    const onHandle = sm(0.2, 0.55) * (1 - sm(1.05, 1.4)) + sm(1.6, 1.85) * (1 - sm(2.15, 2.5));
    const body = T.flow3(t, [[0, 'stand'], [0.5, { ...T.POSES3.stand, spine: [6, 8, 0], head: [8, 6, 0] }], [1.3, { ...T.POSES3.stand, spine: [10, -6, 0], head: [12, -10, 0] }],
      [1.85, { ...T.POSES3.stand, spine: [4, 16, 0], head: [-2, -6, 0], legL: [10, 8, 6, 0], legR: [-6, 8, 8, 0] }], [2.2, { ...T.POSES3.stand, spine: [-2, 4, 0], head: [-6, 0, 0] }], [3, 'relaxed']]);
    const rest = [-0.2, 0.72, 0.08], grip = T.reachTo(s.hero, s.handle.getWorldPosition(new T.THREE.Vector3())), to = rest.map((v, i) => v + (grip[i] - v) * onHandle);
    s.hero.pose({ ...body, armR: { to, pole: [-0.7, 0.6, -0.4] }, handR: onHandle > 0.5 ? 'fist' : 'relaxed' }).face({ expr: [[0, 'neutral'], [1.9, 'determined']], t, blink: true });
    s.kids.forEach((k, i) => k.pose(T.walkTo(k, t, { from: [-0.9 + i * 0.6, s.L.z - 3.5 + i * 0.6], to: [-0.9 + i * 0.6, s.L.z + 3.5 + i * 0.6], t0: 1.0 + i * 0.2, t1: 6.2 + i * 0.2 })).face({ expr: 'neutral', t, blink: true }));
    const c = s.st.camera, z = s.L.z; c.position.set(0.95 - t * 0.03, 1.42, z - 2.5 + t * 0.06); c.lookAt(1.3, 1.2, z + 0.4); if (c.fov !== 34) { c.fov = 34; c.updateProjectionMatrix(); } },   // 3/4 from across the hall: the door, the hand and the face all read
});
registerShot('chem', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 34, fog: [12, 40] }); const c = T.W.chemLab(st, {}); const p = c.station(1);
    const hero = st.add(T.character(HERO).place(p[0], 0, p[1], p[2])), maya = st.add(T.character(MAYA).place(c.station(0)[0], 0, c.station(0)[1], PI + 0.3)), tch = st.add(T.character(TEACHER_M).place(...[c.teacher[0], 0, c.teacher[1]], 0.4));
    return { st, c, hero, maya, tch }; },
  draw(s, t, info, T) { s.hero.pose(T.posesAt3(t, [[0, 'holdFront'], [1.3, 'shocked']], 0.38)).face({ expr: [[0, 'thinking'], [1.3, 'shocked']], t, blink: true }); s.maya.pose(T.idle3('think', t, { seed: 3 })).face({ expr: 'smile', t, blink: true, look: [0.6, 0] });
    s.tch.pose(T.idle3('explain', t, { seed: 5 })).face({ expr: 'neutral', t, blink: true }); s.c.flask.scale.setScalar(1 + 0.08 * Math.sin(t * 9)); cam(s, t, info, T, { a: s.hero, side: 1.3 }); },
});
registerShot('library', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 34, fog: [12, 40], dof: { focus: 2.5, aperture: 0.0016, maxblur: 0.008 } }); const l = T.W.library(st, {});
    const hero = st.add(sitAt(T, HERO, l.seat(0, 1, 0))), sam = st.add(sitAt(T, SAM, l.seat(0, 1, 1))), lib = st.add(T.character(TEACHER_F).place(l.librarian[0], 0, l.librarian[1], l.librarian[2]));
    st.add(T.W.book({ color: '#c8443a' })).position.set(l.seat(0, 1, 1)[0], 0.785, l.seat(0, 1, 1)[1] - 0.45); return { st, l, hero, sam, lib }; },
  draw(s, t, info, T) { s.hero.pose(T.posesAt3(t, [[0, 'sitBooth'], [0.9, 'passNote']], 0.38)).face({ expr: 'smirk', t, blink: true, look: [-0.6, 0] }); s.sam.pose(T.idle3('sitBooth', t, { seed: 4 })).face({ expr: [[0, 'neutral'], [1.4, 'smile']], t, blink: true, look: [0, -0.4] });
    s.lib.pose(T.idle3('crossArms', t)).face({ expr: 'neutral', t, blink: true }); cam(s, t, info, T, { a: s.hero, b: s.sam }); s.st.focusOn?.(s.hero.headWorld()); },
});
registerShot('rainClass', {
  init(T) { const st = T.stage({ mood: 'storm', fov: 38, fog: [14, 50] }); const c = T.W.classroom(st, { board: ['HISTORY  CH. 7', 'THE NEW WORLD  1607'] });
    for (let i = 0; i < 3; i++) T.W.windowRain(st, { pos: [-c.w / 2 + 0.06, 1.85, -c.d / 2 + 1.8 + i * 2.6], w: 1.8, h: 1.7, yaw: R2 }); T.W.lightning(st, { times: [1.6] });
    const hero = st.add(sitAt(T, HERO, c.seat(2, 1))), a = st.add(sitAt(T, STUDENTS[1], c.seat(2, 2))), b = st.add(sitAt(T, STUDENTS[3], c.seat(1, 1))), d = st.add(sitAt(T, CLASSMATE, c.seat(1, 2))), tch = st.add(T.character(TEACHER_F).place(c.teacher[0], 0, c.teacher[1] + 0.3, 0));
    return { st, c, hero, a, b, d, tch }; },
  draw(s, t, info, T) { s.hero.pose(T.posesAt3(t, [[0, 'sitStudy'], [0.6, 'sitRaiseHand']], 0.38)).face({ expr: 'determined', t, blink: true }); s.a.pose(T.idle3('sleepDesk', t, { seed: 2 })).face({ expr: 'sleepy', t });
    s.b.pose(T.idle3('copyPeek', t, { seed: 3 })).face({ expr: 'smirk', t, blink: true }); s.d.pose(T.idle3('sitStudy', t, { seed: 5 })).face({ expr: 'neutral', t, blink: true }); s.tch.pose(T.idle3('point', t)).face({ expr: 'smile', t, blink: true });
    cam(s, t, info, T, { a: s.hero, side: 1.2 }); },
});
registerShot('detention', {
  init(T) { const st = T.stage({ ...T.W.schoolTime('afterSchool'), fov: 22, fog: [14, 50] }); const c = T.W.detention(st, {});
    const hero = st.add(sitAt(T, HERO, c.seat(1, 1))), rv = st.add(sitAt(T, RIVAL, c.seat(1, 3))), tch = st.add(T.character(TEACHER_M).place(c.teacher[0], 0, c.teacher[1], 0));
    const paper = T.W.newspaper({}); tch.hold(paper, 'L', { pos: [-0.12, -0.05, 0.12], rot: [0, 0, 0] }); return { st, c, hero, rv, tch, door: [c.w / 2 - 0.3, 1.55, c.d / 2 - 1.4] }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('sitSlouch', t)).face({ expr: 'unimpressed', t, blink: true, look: [0.5, 0.2] }); s.rv.pose(T.idle3('sitSlouch', t, { seed: 4 })).face({ expr: 'smirk', t, blink: true, look: [-0.6, 0] });
    s.tch.pose(T.idle3('sitDesk', t)).face({ expr: 'neutral', t, blink: true, look: [0, -0.3] }); cam(s, t, info, T, { a: s.hero, at: s.door }); },
});
registerShot('blackout', {
  init(T) { const st = T.stage({ mood: 'storm', fov: 36, fog: [14, 50] }); const c = T.W.classroom(st, { board: ['TORNADO DRILL', 'GET UNDER YOUR DESK'] });
    T.W.lightning(st, { times: [0.4, 1.9] }); T.W.powerCut(st, { t0: 0.8 }); T.W.alarmLight(st, { pos: [c.w / 2 - 0.4, 2.9, -c.d / 2 + 0.6], t0: 1.0 });
    const hero = st.add(sitAt(T, HERO, c.seat(1, 1))), k1 = st.add(T.character(STUDENTS[0]).place(c.seat(0, 1)[0] + 0.95, 0, c.seat(0, 1)[1] - 0.2, PI)), k2 = st.add(T.character(STUDENTS[5] || STUDENTS[2]).place(c.seat(1, 2)[0] + 0.95, 0, c.seat(1, 2)[1] - 0.2, PI));
    return { st, c, hero, k1, k2 }; },
  draw(s, t, info, T) { s.hero.pose(T.posesAt3(t, [[0, 'sitStudy'], [0.9, 'scared']], 0.38)).face({ expr: [[0, 'neutral'], [0.9, 'scared']], t, blink: true });
    for (const k of [s.k1, s.k2]) k.pose(T.posesAt3(t, [[0, 'scared'], [1.1, 'duckCover']], 0.38)).face({ expr: 'scared', t, blink: true }); cam(s, t, info, T, { a: s.hero }); },
});
registerShot('cafeteria', {
  init(T) { const st = T.stage({ mood: 'day', fov: 40, fog: [16, 60] }); const c = T.W.cafeteria(st, {});
    const hero = st.add(T.character(HERO)); const tr = T.W.tray({}); tr.position.set(0, 0.88, 0.42); hero.add(tr);
    const eaters = [[0, -1, 0], [0, -1, 1], [1, 1, 0], [1, 1, 1], [2, -1, 3], [2, -1, 4]].map(([a, b, i], k) => st.add(sitAt(T, STUDENTS[k % STUDENTS.length], c.seat(a, b, i))));
    return { st, c, hero, eaters }; },
  draw(s, t, info, T) { const w = T.walkTo(s.hero, t, { from: [-1, 5.2], to: [-1, 1.6], t0: 0, t1: 2.9 }); s.hero.pose(arms(T, w, 'holdTray')).face({ expr: 'neutral', t, blink: true, look: [-0.4, 0] });
    s.eaters.forEach((e, i) => e.pose(T.idle3(i % 2 ? 'sitBooth' : 'talk', t, { seed: i })).face({ expr: i % 3 ? 'smile' : 'neutral', t, blink: true })); cam(s, t, info, T, { a: s.hero }); },
});
registerShot('football', {
  init(T) { const st = T.stage({ mood: 'night', fov: 32, fog: [60, 220] }); const f = T.W.footballField(st, {}); T.W.haze(st, { area: [-40, 40, 1, 14, -30, 30], n: 24, opacity: 0.025 });
    const qb = st.add(T.character({ ...HERO, ...T.W.LETTERMAN, patch: 'E' }).place(-2, 0, 13, 0)), wr = st.add(T.character(BRO_2).place(-1.4, 0, 21.5, PI)), ball = st.add(T.W.football());
    T.W.breath(st, qb, { every: 1.4 }); return { st, f, qb, wr, ball }; },
  draw(s, t, info, T) { const t0 = 1.25, o = { t0 }; const rel = T.throwHand(s.qb, t0, o).toArray();
    if (t < t0) { s.ball.position.copy(T.throwHand(s.qb, t, o)); s.ball.rotation.set(-0.4, 0, 0); } else T.toss(s.ball, t, { from: rel, to: [-1.45, 1.3, 21.1], h: 1.6, t0, dur: 0.95, spin: [0, 0, 2.5] });
    s.qb.pose(T.throw3(t, o)).face({ expr: [[0, 'determined'], [t0 + 0.3, 'joy']], t, blink: true });
    const catchK = T.clamp((t - (t0 + 0.55)) / 0.4);
    s.wr.pose(T.flow3(t, [[0, 'ready'], [t0 + 0.4, 'ready'], [t0 + 0.9, { ...T.POSES3.holdFront, armL: { to: [0.12, 1.25, 0.32] }, armR: { to: [-0.12, 1.25, 0.32] } }], [3, { ...T.POSES3.holdFront, armL: { to: [0.1, 1.0, 0.25] }, armR: { to: [-0.1, 1.0, 0.25] } }]])).face({ expr: catchK > 0.5 ? 'joy' : 'determined', t, blink: true });
    cam(s, t, info, T, { a: s.qb, side: 0, yaw: -1.25, dist: 1.25 }); },
});
registerShot('principal', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 34, fog: [10, 30] }); const p = T.W.principalOffice(st, {});
    const hero = st.add(sitAt(T, HERO, p.guest(1))), pr = st.add(T.character(PRINCIPAL).place(p.principal[0], 0, p.principal[1] + 0.15, 0)); return { st, p, hero, pr }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('sit', t)).face({ expr: 'worried', t, blink: true }); s.pr.pose(T.posesAt3(t, [[0, 'crossArmsAngry'], [1.2, 'pointAtViewer']], 0.38)).face({ expr: 'angry', t, blink: true });
    cam(s, t, info, T, { a: s.hero, b: s.pr, dist: 0.5 }); },
});
registerShot('nurse', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 32, fog: [8, 30] }); const n = T.W.nurseOffice(st, {});
    const hero = st.add(sitAt(T, HERO, n.bed)), nu = st.add(T.character(NURSE).place(n.bed[0] + 0.9, 0, n.bed[1] - 1.1, -0.6)); return { st, n, hero, nu }; },
  draw(s, t, info, T) { s.hero.pose(T.body3('sit', t, 'shiver', 0.6)).face({ expr: 'nervous', t, blink: true }); s.nu.pose(T.idle3('think', t)).face({ expr: 'worried', t, blink: true }); cam(s, t, info, T, { a: s.hero, side: -1, yaw: 0.3 }); },
});
registerShot('restroom', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 34, fog: [8, 30] }); const w = T.W.restroom(st, {}); const sk = w.sink(1);
    const hero = st.add(T.character(HERO).place(sk[0], 0, sk[1], sk[2])); return { st, w, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.posesAt3(t, [[0, 'sad'], [1.3, 'handsOnHips']], 0.38)).face({ expr: [[0, 'sad'], [1.3, 'determined']], t, blink: true }); cam(s, t, info, T, { a: s.hero, yaw: PI * 0.78, side: -1, dist: 0.85 }); },
});
registerShot('band', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 38, fog: [12, 40] }); const b = T.W.bandRoom(st, {});
    const kids = [[0, 1], [0, 3], [1, 2], [1, 4], [2, 3], [2, 6]].map(([r, i], k) => st.add(sitAt(T, k === 2 ? HERO : STUDENTS[k % STUDENTS.length], b.seat(r, i))));
    const tch = st.add(T.character(TEACHER_M).place(b.podium[0], b.podium[3], b.podium[1], 0)); return { st, b, kids, tch }; },
  draw(s, t, info, T) { s.kids.forEach((k, i) => k.pose(T.idle3('sit', t, { seed: i })).face({ expr: i === 2 ? 'joy' : 'neutral', t, blink: true }));
    s.tch.pose(T.posesAt3(t, [[0, 'pointUp'], [0.6, 'cheer'], [1.2, 'pointUp'], [1.8, 'cheer']], 0.38)).face({ expr: 'smile', t, blink: true }); cam(s, t, info, T, { a: s.kids[2], height: 1.1, side: -1.4, dist: 0.85 }); },
});
registerShot('stage', {
  init(T) { const st = T.stage({ mood: 'night', fov: 40, fog: [20, 60] }); const a = T.W.auditorium(st, {});
    const hero = st.add(T.character(HERO).place(a.podium[0], a.stageY, a.podium[1], 0)); [[0, 3], [0, 8], [1, 5], [2, 2]].forEach(([r, i], k) => st.add(sitAt(T, STUDENTS[k], a.seat(r, i))).pose(T.POSES3.sit));
    return { st, a, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.posesAt3(t, [[0, 'atPodium'], [1.5, 'point']], 0.45)).face({ expr: 'determined', t, blink: true }); cam(s, t, info, T, { a: s.hero, yaw: -0.65, side: -1 }); },
});
registerShot('lockerRoom', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 34, fog: [10, 30] }); const r = T.W.lockerRoom(st, {}); const b = r.bench(0);
    const hero = st.add(T.character(HERO).place(b[0], 0, b[1], b[2])), rv = st.add(T.character({ ...RIVAL, ...T.W.LETTERMAN, patch: 'E' }).place(b[0] + 1.3, 0, b[1] + 1.4, PI + 0.5)), co = st.add(T.character(COACH).place(b[0] - 1.6, 0, b[1] + 1.8, PI - 0.4));
    return { st, r, hero, rv, co }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('sit', t)).face({ expr: 'neutral', t, blink: true, look: [0.4, 0.2] }); s.rv.pose(T.idle3('crossArmsLean', t)).face({ expr: 'smirk', t, blink: true }); s.co.pose(T.idle3('handsOnHips', t, { seed: 3 })).face({ expr: 'angry', t, blink: true });
    cam(s, t, info, T, { a: s.hero, side: -1 }); },
});
registerShot('snowLot', {
  init(T) { const st = T.stage({ mood: 'snow', fov: 34, fog: [20, 90] }); const l = T.W.studentLot(st, { buses: 2, gap: [-9, 7] }); T.W.snowDay(st, { area: [-8, 8, 0, 6, -4, 4] });
    const hero = st.add(T.character({ ...HERO, scarf: '#c8343a' }).place(1.5, 0, 0.6, -R2)), sam = st.add(T.character({ ...SAM, scarf: '#ffffff' }).place(-2.5, 0, 0.6, R2)), ball = st.add(T.sphere(0.07, T.mat('#f8f8ff', { rough: 0.8 })));
    T.W.breath(st, hero, { every: 1.5 }); T.W.breath(st, sam, { every: 1.7, offset: 0.6 }); return { st, l, hero, sam, ball }; },
  draw(s, t, info, T) { const t0 = 1.15, o = { t0, wind: 0.5 }, hit = t0 + 0.42; const rel = T.throwHand(s.sam, t0, o).toArray();
    if (t < t0) s.ball.position.copy(T.throwHand(s.sam, t, o)); else T.toss(s.ball, t, { from: rel, to: [1.45, 1.45, 0.6], h: 0.35, t0, dur: hit - t0 });
    s.ball.visible = t < hit; s.sam.pose(T.throw3(t, o)).face({ expr: [[0, 'smirk'], [hit, 'joy']], t, blink: true });
    const flinch = { ...T.POSES3.shocked, spine: [-14, 10, 6], head: [-16, 18, 0] };
    s.hero.pose(T.flow3(t, [[0, 'handsInPockets'], [hit, 'handsInPockets'], [hit + 0.18, flinch], [3, { ...T.POSES3.shocked, spine: [-4, 0, 0] }]])).face({ expr: [[0, 'neutral'], [hit, 'shocked']], t, blink: true }); cam(s, t, info, T, { a: s.hero, b: s.sam, side: -1 }); },
});
registerShot('prom', {
  init(T) { const st = T.stage({ mood: 'night', fov: 34, fog: [16, 60] }); const h = T.W.promHall(st, {}); T.W.confetti(st, { area: [-3, 3, 0, 4.5, -2, 2], t0: 1.2, n: 500 });
    const hero = st.add(T.character({ ...HERO, top: 'suit', color: '#1a1a24', tie: '#c8343a', shirt: '#f4f4f4' })), sam = st.add(T.character(SAM));
    T.W.passersby(st, { cast: [STUDENTS[0], STUDENTS[2], CLASSMATE], lane: [-10, 10, -3.5], n: 3, y: 0, speed: 0.5 }); return { st, h, hero, sam }; },
  draw(s, t, info, T) { const a = 0.25 * t + 0.12 * Math.sin(t * 1.6), r = 0.27, sway = Math.sin(t * 1.6);
    s.hero.position.set(-Math.cos(a) * r, 0, Math.sin(a) * r); s.hero.rotation.y = R2 - a; s.sam.position.set(Math.cos(a) * r, 0, -Math.sin(a) * r); s.sam.rotation.y = -R2 - a;
    const step = (k) => ({ ...T.POSES3.stand, hips: [0, 0, 3 * sway * k], spine: [4, 0, -2 * sway * k], legL: [4 + 6 * Math.max(0, sway * k), 6, 6 + 10 * Math.max(0, sway * k), 0], legR: [4 + 6 * Math.max(0, -sway * k), 6, 6 + 10 * Math.max(0, -sway * k), 0] });
    s.hero.pose({ ...step(1), head: [6, 0, 0], armL: { to: [0.15, 0.98, 0.42], pole: [0.6, 0.7, -0.2] }, armR: { to: [-0.15, 0.98, 0.42], pole: [-0.6, 0.7, -0.2] }, handL: 'open', handR: 'open' }).face({ expr: 'smile', t, blink: true });
    s.sam.pose({ ...step(-1), head: [-8, 0, 0], armL: { to: [0.16, 1.32, 0.36], pole: [0.6, 1.0, -0.2] }, armR: { to: [-0.16, 1.32, 0.36], pole: [-0.6, 1.0, -0.2] }, handL: 'open', handR: 'open' }).face({ expr: 'happy', t, blink: true });
    cam(s, t, info, T, { a: s.hero, b: s.sam }); },
});
registerShot('diner', {
  init(T) { const st = T.stage({ mood: 'dusk', fov: 34, fog: [10, 30] }); const k = T.W.dinerUS(st, {});
    const hero = st.add(sitAt(T, HERO, k.booth(1, -1))), sam = st.add(sitAt(T, SAM, k.booth(1, 1))); st.add(T.W.milkshake({ color: '#f2a0b8' })).position.set(k.booth(1, 1)[0] - 0.4, 0.78, k.booth(1, 1)[1] + 0.12); return { st, k, hero, sam }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('sitBooth', t)).face({ expr: 'joy', t, blink: true }); s.sam.pose(T.body3('sitBooth', t, 'laugh', 0.5)).face({ expr: 'joy', t, blink: true }); cam(s, t, info, T, { a: s.hero, b: s.sam }); },
});
registerShot('graduation', {
  init(T) { const st = T.stage({ mood: 'day', fov: 40, fog: [30, 160] }); T.W.schoolFront(st, { bus: false }); T.W.capToss(st, { at: [0, -5.5], t0: 1.0, n: 26, spread: 5 }); T.W.confetti(st, { area: [-5, 5, 0, 5, -8, -3], t0: 1.0 });
    const gown = (o) => ({ ...o, top: 'dress', color: '#1a1a2a', skirt: null, skirtLen: 1.25 });
    const grads = [HERO, SAM, STUDENTS[0], STUDENTS[1], STUDENTS[3], CLASSMATE].map((o, i) => { const c = st.add(T.character(gown(o)).place(-2.5 + i * 1.0, 0, -5.5 - (i % 2) * 0.8, 0)); c.userData.cap = c.wear(T.W.gradCap({})); return c; });
    return { st, grads }; },
  draw(s, t, info, T) { s.grads.forEach((c, i) => { c.pose(T.flow3(t, [[0, 'stand'], [0.45 + i * 0.03, 'stand'], [0.95 + i * 0.03, 'capToss'], [1.8, 'cheer']])).face({ expr: 'joy', t, blink: true }); c.userData.cap.visible = t < 0.98; });
    cam(s, t, info, T, { a: s.grads[0], side: 0.5, dist: 1.25 }); },
});
registerShot('rainLot', {
  init(T) { const st = T.stage({ mood: 'storm', fov: 34, fog: [20, 90] }); const l = T.W.studentLot(st, { wet: true, buses: 3 }); const rn = T.FX3.rain(st, { n: 1600, area: [-10, 10, 0, 9, -6, 6] }); if (rn?.update) st.onTick(rn.update);
    T.W.puddles(st, { area: [-8, 8, -1.5, 2.5], n: 7, y: 0.002 });
    const hero = st.add(T.character(HERO)), sam = st.add(T.character(SAM)); const u = T.W.umbrella({ color: '#c8343a' }); hero.add(u); return { st, l, hero, sam, u }; },
  draw(s, t, info, T) { const wh = T.walkTo(s.hero, t, { from: [-2.4, 0.9], to: [1.6, 0.9], t0: 0, t1: 3.2 }), ws = T.walkTo(s.sam, t, { from: [-2.4, 0.35], to: [1.6, 0.35], t0: 0, t1: 3.2 });
    s.hero.pose({ ...wh, armL: { to: [0.14, 1.32, 0.22], pole: [0.7, 0.9, -0.2] }, handL: 'fist' }).face({ expr: 'smile', t, blink: true, look: [-0.5, 0] }); s.u.position.set(...T.reachTo(s.hero, s.hero.handWorld('L'))); s.u.position.y -= 0.05; s.sam.pose({ ...ws, armR: T.POSES3.holdBooks.armR, handR: 'open' }).face({ expr: 'happy', t, blink: true, look: [0.5, 0.1] });
    cam(s, t, info, T, { a: s.hero, b: s.sam, yaw: 0.25, dist: 1.4 }); },
});
