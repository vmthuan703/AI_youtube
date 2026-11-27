// school-demo (0.2.8): the ready-made school sets (T.W.busStop / busInside / lockerHall / schoolFront / cafeteria / court / schoolYard),
// the new poses (kneel*, sitBed*, sitFloor, hugKnees, crossArms*, lift*, pushHeavy), T.armWrestle, T.reachPose and T.body3.
import { registerShot, clamp } from '/engine/core.js';
import { HERO, MAYA, SAM } from '../cast.js';
import { RIVAL, COACH, STUDENTS, MOM } from '/channel/cast.js';
const PI = Math.PI, R2 = PI / 2, lerp = (a, b, k) => a + (b - a) * k;
const cam = (T, s, t, a, b, look) => T.dolly(s.st.camera, t, [[0, { pos: a, look }], [3, { pos: b, look }]]);

registerShot('busstop', {   // stepping off the bus: step → step → sidewalk, with a real drop on each
  init(T) { const st = T.stage({ mood: 'day', fov: 38, fog: [30, 140] }); const b = T.W.busStop(st);
    const hero = st.add(T.character(HERO).place(b.step[0][0], b.step[0][1], b.step[0][2], PI)); const maya = st.add(T.character(MAYA).place(b.door[0] - 1.6, b.walk, -0.6, 0.6)); return { st, b, hero, maya }; },
  draw(s, t, info, T) { const [p0, p1] = s.b.step, k = clamp(t / 1.6), seg = k < 0.5 ? [p0, p1, k * 2] : [p1, [p1[0], s.b.walk, -0.4], k * 2 - 1];
    const [a, c, u] = seg, hop = Math.sin(PI * u) * 0.08; s.hero.position.set(lerp(a[0], c[0], u), lerp(a[1], c[1], u) + hop, lerp(a[2], c[2], u)); s.hero.rotation.y = PI;
    s.hero.pose(T.idle3(u < 0.9 && k < 1 ? { ...T.POSES3.stand, legL: [30 * Math.sin(PI * u), 4, 30 * Math.sin(PI * u), 0], armL: [30, 30, 20, 0], armR: [30, 30, 20, 0] } : 'stand', t)).face({ expr: 'smile', t, blink: true });
    s.maya.pose(T.idle3('wave', t)).face({ expr: 'happy', t, blink: true });
    cam(T, s, t, [s.b.door[0] - 3.5, 1.5, -5], [s.b.door[0] - 3.1, 1.45, -4.6], [s.b.door[0], 0.9, 0.3]); },
});
registerShot('businside', {
  init(T) { const st = T.stage({ mood: 'day', fov: 44, fog: [10, 60] }); const b = T.W.busInside(st, {});
    const [x1, z1] = b.seat(2, 1), [x2, z2] = b.seat(2, -1), [x3, z3] = b.seat(4, 1);
    const hero = st.add(T.character(HERO, { pose: 'sit' }).place(x1, 0, z1, R2)), sam = st.add(T.character(SAM, { pose: 'sit' }).place(x2, 0, z2, R2)), kid = st.add(T.character(STUDENTS[1], { pose: 'sit' }).place(x3, 0, z3, R2));
    return { st, b, hero, sam, kid }; },
  draw(s, t, info, T) { s.b.update(t); s.hero.pose(T.idle3('sit', t)).face({ expr: 'deadpan', t, blink: true, look: [-0.5, 0] }); s.sam.pose(T.body3('sit', t, 'laugh', 0.8)).face({ expr: 'joy', t, blink: true }); s.kid.pose(T.idle3('sit', t, { seed: 4 })).face({ expr: 'neutral', t, blink: true });
    cam(T, s, t, [s.b.len / 2 - 0.4, 1.55, 0.05], [s.b.len / 2 - 0.7, 1.5, 0.05], [-3, 1.0, 0]); },
});
registerShot('lockers', {   // the hero's locker swings open
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 40, fog: [8, 34] }); const h = T.W.lockerHall(st, {}); const L = h.locker(22, -1);
    const hero = st.add(T.character(HERO).place(L.front[0], 0, L.front[1], -R2)); const rival = st.add(T.character(RIVAL).place(0.9, 0, L.z + 1.6, PI - 0.4)); return { st, h, L, hero, rival }; },
  draw(s, t, info, T) { s.L.door.rotation.y = -1.7 * T.ease.inOut(clamp((t - 0.6) / 0.6)); s.hero.pose(T.idle3({ ...T.POSES3.stand, armL: { to: [0.25, 1.05, 0.45] }, handL: 'open' }, t)).face({ expr: 'neutral', t, blink: true });
    s.rival.pose(T.idle3('crossArmsAngry', t, { seed: 2 })).face({ expr: 'smirk', t, blink: true });
    cam(T, s, t, [0.9, 1.55, s.L.z + 4.6], [0.7, 1.5, s.L.z + 4.0], [s.L.x + 0.3, 1.2, s.L.z]); },
});
registerShot('front', {
  init(T) { const st = T.stage({ mood: 'day', fov: 40, fog: [40, 160] }); const f = T.W.schoolFront(st, {});
    const hero = st.add(T.character(HERO).place(-0.5, 0.15, -1, PI)), maya = st.add(T.character(MAYA).place(0.5, 0.15, -1, PI)); return { st, f, hero, maya }; },
  draw(s, t, info, T) { s.hero.pose(T.walkTo(s.hero, t, { from: [-0.5, -0.4], to: [-0.5, -6], t0: 0, t1: 3 })).face({ expr: 'smile', t, blink: true }); s.hero.position.y = 0.0;
    s.maya.pose(T.walkTo(s.maya, t, { from: [0.5, -0.4], to: [0.5, -6], t0: 0, t1: 3 })).face({ expr: 'happy', t, blink: true });
    cam(T, s, t, [-3.2, 1.5, 1.6], [-2.9, 1.45, 1.0], [0, 2.2, -10]); },
});
registerShot('armwrestle', {   // readable from the side, level with the table: the two forearms and the grip are one clear shape
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 30, fog: [8, 40] }); const c = T.W.cafeteria(st, {});
    const a = st.add(T.character(HERO).place(-4.2, 0, -0.6, 0)), b = st.add(T.character(RIVAL).place(-4.2, 0, 0.6, PI)), k1 = st.add(T.character(STUDENTS[0]).place(-5.6, 0, -1.6, 0.6)), k2 = st.add(T.character(STUDENTS[2]).place(-2.9, 0, 1.7, -2.4));
    return { st, a, b, k1, k2 }; },
  draw(s, t, info, T) { const k = t < 1.4 ? lerp(0, -0.35, T.ease.inOut(clamp(t / 1.4))) : lerp(-0.35, 1, T.ease.in(clamp((t - 1.6) / 0.5))); const P = T.armWrestle(k, { t, strain: t < 1.6 ? 1 : 0 });
    s.a.pose(P.a).face({ expr: t < 1.6 ? 'determined' : 'smug', t, blink: true }); s.b.pose(P.b).face({ expr: t < 1.6 ? 'angry' : 'shocked', t, blink: true });
    s.k1.pose(T.idle3('handsOnHead', t)).face({ expr: 'shocked', t }); s.k2.pose(T.idle3('cheer', t, { seed: 3 })).face({ expr: 'joy', t });
    cam(T, s, t, [-1.0, 1.0, 0.05], [-1.2, 1.0, 0.0], [-4.2, 1.0, 0]); },
});
registerShot('court', {
  init(T) { const st = T.stage({ mood: 'dusk', fov: 40, fog: [30, 140] }); const c = T.W.court(st, {}); const ball = T.W.ball({ r: 0.12 }); st.add(ball);
    const hero = st.add(T.character(HERO).place(7.5, 0, 0.6, R2)), rival = st.add(T.character(RIVAL).place(9.2, 0, 0.2, -R2)); return { st, c, ball, hero, rival }; },
  draw(s, t, info, T) { const b = Math.abs(Math.sin(t * 6)); s.ball.position.set(7.95, 0.12 + 0.75 * b, 0.45); s.hero.pose(T.idle3({ ...T.POSES3.ready, armL: { to: [0.15, 0.95 + 0.1 * b, 0.4] }, handL: 'open' }, t)).face({ expr: 'determined', t, blink: true });
    s.rival.pose(T.idle3('ready', t, { seed: 2 })).face({ expr: 'angry', t, blink: true }); cam(T, s, t, [4.5, 1.8, 6], [4.8, 1.7, 5.3], [9.5, 1.6, 0]); },
});
registerShot('yard', {
  init(T) { const st = T.stage({ mood: 'day', fov: 42, fog: [40, 180] }); const y = T.W.schoolYard(st, {}); const coach = st.add(T.character(COACH).place(-6, 0, 11.6, PI));
    const kids = [0, 1, 2, 3, 4].map(i => st.add(T.character(STUDENTS[i]).place(-9 + i * 1.4, 0, 7.6, 0))); const hero = st.add(T.character(HERO).place(-3.6, 0, 7.4, 0)); return { st, coach, kids, hero }; },
  draw(s, t, info, T) { s.coach.pose(T.idle3('point', t)).face({ expr: 'angry', t, blink: true }); s.kids.forEach((k, i) => k.pose(T.body3('stand', t + i, i % 2 ? 'pant' : 'fidget', 1)).face({ expr: 'tired', t, blink: true }));
    s.hero.pose(T.body3('handsOnHips', t, 'pant', 1.2)).face({ expr: 'tired', t, blink: true }); cam(T, s, t, [-3.0, 1.5, 15.6], [-3.4, 1.45, 15.0], [-6, 1.0, 8]); },
});
registerShot('bedposes', {   // sitBed, sitBedSad, sitBedPhone on two beds; hugKnees and kneelSad on the floor
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 40, fog: [6, 30] }); T.W.room(st, { kind: 'bedroom', w: 8, d: 6, window: 'back', view: 'night' });
    for (const x of [-1.6, 1.4]) { const b = T.W.bed({}); b.rotation.y = R2; b.position.set(x, 0, -1.3); st.add(b); }
    const C = [['sitBed', HERO, -2.1], ['sitBedSad', MAYA, -1.1], ['sitBedPhone', SAM, 1.4]].map(([p, o, x]) => ({ p, c: st.add(T.character(o).place(x, 0, -0.62, 0)) }));
    C.push({ p: 'hugKnees', c: st.add(T.character(STUDENTS[3]).place(-0.3, 0, 0.9, 0.3)) }, { p: 'kneelSad', c: st.add(T.character(MOM).place(2.6, 0, 0.6, -0.4)) }); return { st, C }; },
  draw(s, t, info, T) { s.C.forEach(({ p, c }, i) => c.pose(i === 1 ? T.body3(p, t, 'sob', 1) : T.idle3(p, t, { seed: i })).face({ expr: ['deadpan', 'sad', 'smile', 'worried', 'sad'][i], t, blink: true }));
    cam(T, s, t, [0.2, 1.4, 5.6], [0.1, 1.35, 5.0], [0.1, 0.75, -0.3]); },
});
registerShot('floorposes', {   // kneelBoth, kneelPlead, sitFloor, armsBehindHead, crossArmsLean, pushHeavy against a crate
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 44, fog: [8, 40] }); T.W.room(st, { kind: 'living', w: 12, d: 8 }); const crate = T.box(0.8, 1.4, 0.8, '#8a6a4a'); crate.position.set(3.75, 0.7, 0.8); st.add(crate);
    const L = [['kneelBoth', HERO], ['kneelPlead', MAYA], ['sitFloor', SAM], ['armsBehindHead', STUDENTS[1]], ['crossArmsLean', RIVAL], ['pushHeavy', STUDENTS[4]]];
    return { st, C: L.map(([p, o], i) => ({ p, c: st.add(T.character(o).place(-3.6 + i * 1.45, 0, 0, i === 5 ? R2 : 0)) })) }; },
  draw(s, t, info, T) { s.C.forEach(({ p, c }, i) => c.pose(i === 5 ? T.body3(p, t, 'strain', 1) : T.idle3(p, t, { seed: i })).face({ expr: ['sad', 'worried', 'neutral', 'smug', 'smirk', 'strain'][i] || 'determined', t, blink: true }));
    cam(T, s, t, [0, 1.2, 6.4], [0, 1.15, 6.0], [0, 0.75, 0]); },
});
registerShot('carlift', {   // hands under the back bumper, from a squat to a stand as the car tilts up
  init(T) { const st = T.stage({ mood: 'night', fov: 36, fog: [10, 60] }); T.W.suburb(st, { lights: 2, focus: [0, -6], seed: 4 });
    const pivot = T.group(); pivot.position.set(0, 0, -2.2); st.add(pivot); const car = T.W.car({ color: '#3f6a8a', type: 'sedan', lights: true }); car.rotation.y = PI; car.position.set(0, 0, 2.2); pivot.add(car); pivot.userData.dynamic = true;
    const hero = st.add(T.character(HERO).place(0, 0, 2.6, PI)); const L = T.lamp('#ffd8a0', 5, 10); L.position.set(2.5, 3.2, 1.5); st.add(L); return { st, pivot, hero }; },
  draw(s, t, info, T) { const k = T.ease.inOut(clamp((t - 0.8) / 1.2)), a = 0.12 * k; s.pivot.rotation.x = -a;
    const by = 0.36 * Math.cos(a) + 4.47 * Math.sin(a), bz = -2.2 + 4.47 * Math.cos(a) - 0.36 * Math.sin(a);   // the bumper underside follows the pivot
    s.hero.pose(T.body3(T.reachPose({ grip: [by, 2.6 - bz], squat: 1 - k, width: 0.6 }), t, 'strain', 0.8)).face({ expr: k < 1 ? 'strain' : 'determined', t, blink: true });
    cam(T, s, t, [2.4, 0.7, 4.2], [2.2, 0.7, 3.9], [0, 0.75, 2.3]); },
});
registerShot('body', {   // T.body3 layers: pant, sob, laugh, shiver, shake (no), sigh
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 44, fog: [8, 40] }); T.W.room(st, { kind: 'living', w: 12, d: 8 }); const L = [HERO, MAYA, SAM, STUDENTS[0], RIVAL, STUDENTS[2]];
    return { st, C: L.map((o, i) => st.add(T.character(o).place(-3.6 + i * 1.45, 0, 0, 0))) }; },
  draw(s, t, info, T) { const K = ['pant', 'sob', 'laugh', 'shiver', 'shake', 'sigh'], E = ['tired', 'sad', 'joy', 'scared', 'annoyed', 'deadpan'];
    s.C.forEach((c, i) => c.pose(T.body3(i === 1 ? 'hunch' : i === 2 ? 'stand' : 'stand', t, K[i], 1, { t0: 0.5 })).face({ expr: E[i], t, blink: true })); cam(T, s, t, [0, 1.3, 6.4], [0, 1.25, 6.0], [0, 1.0, 0]); },
});
