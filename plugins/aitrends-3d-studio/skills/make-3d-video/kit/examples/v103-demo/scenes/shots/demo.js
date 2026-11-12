// v103-demo (1.0.3): lip-sync on every mouth + stressed words + listening nods, finger gestures, hands resting on furniture
// (before / after), planted feet when a walk starts, scarf swing and wind, the new hood, the jacket bunching when seated, and the
// November sets (Thanksgiving dinner, pumpkin street, a leaf gust, Friday-night football). Words: timeline/words.json (silent demo).
import { registerShot } from '/engine/core.js';
import { HERO, MAYA, MOM, DAD, GRANDPA, CLASSMATE, BRO_2 } from '../cast.js';
const PI = Math.PI, R2 = PI / 2;
const cam = (s, t, info, T, o) => T.camShot(s.st.camera, t, info.shot.camera, { dur: info.dur, ...o });
const man = (s, pos, look, fov = 34) => { const c = s.st.camera; c.position.set(...pos); c.lookAt(...look); if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); } };
const sign = (T, txt, w = 1.3) => T.plane(w, 0.3, T.mat('#ffffff', { map: T.textTex(txt, { w: 512, h: 118, bg: '#1a1a24', color: '#f2b632', size: 64, font: 'Nunito' }) }));
const armsOf = (T, pose, from) => { const p = T.POSES3[from]; return { ...pose, armL: p.armL, armR: p.armR, handL: p.handL, handR: p.handR, spine: p.spine }; };

// A: talking — the hero's mouth follows each sound (also while grinning), stressed words lift the brows; Maya nods as she listens
registerShot('talk', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 30, fog: [10, 40] }); T.W.lockerHall(st, {});
    const hero = st.add(T.character(HERO).place(-0.45, 0, 1.5, R2 - 0.25)), maya = st.add(T.character(MAYA).place(0.45, 0, 1.5, -R2 + 0.25)); return { st, hero, maya }; },
  draw(s, t, info, T) { const gt = info.globalT;
    s.hero.pose(T.speak3(T.listen3(T.idle3('relaxed', t), 'YOU', gt), 'YOU', gt)).face({ expr: [[0, 'surprised'], [1.4, 'smile']], t, blink: true, gt });
    s.maya.pose(T.speak3(T.listen3(T.idle3('relaxed', t, { seed: 2 }), 'MAYA', gt), 'MAYA', gt, { hand: 'R' })).face({ expr: [[0, 'smirk'], [2.2, 'happy']], t, blink: true, gt });
    cam(s, t, info, T, { a: s.hero, b: s.maya }); },
});
registerShot('talkClose', {
  init(T) { const st = T.stage({ mood: 'day', fov: 30, fog: [20, 80] }); T.W.schoolYard(st, {}); const hero = st.add(T.character(HERO).place(0, 0, 0, 0)); return { st, hero }; },
  draw(s, t, info, T) { const gt = info.globalT; s.hero.pose(T.speak3(T.idle3('confident', t), 'YOU', gt)).face({ expr: 'joy', t, blink: true, gt }); cam(s, t, info, T, { a: s.hero }); },
});
// B: real fingers — counting to five, thumbs up, a peace sign, an open hand
registerShot('count', {
  init(T) { const st = T.stage({ mood: 'day', fov: 32, fog: [20, 80] }); T.W.classroom(st, {}); const hero = st.add(T.character(HERO).place(0, 0, 1.2, 0)); return { st, hero }; },
  draw(s, t, info, T) { const n = Math.min(5, 1 + Math.floor(Math.max(0, t - 0.4) / 0.55)); const p = T.idle3('showCount', t);
    s.hero.pose({ ...p, handR: 'count' + n }).face({ expr: 'smug', t, blink: true }); man(s, [-0.45, 1.3, 3.9], [-0.15, 1.05, 1.2], 30); },
});
registerShot('gestures', {
  init(T) { const st = T.stage({ mood: 'day', fov: 34, fog: [20, 80] }); T.W.schoolYard(st, {});
    const a = st.add(T.character(HERO).place(-1.1, 0, 0, 0.15)), b = st.add(T.character(MAYA).place(0, 0, -0.2, 0)), c = st.add(T.character(BRO_2).place(1.1, 0, 0, -0.15)); return { st, a, b, c }; },
  draw(s, t, info, T) { s.a.pose(T.flow3(t, [[0, 'stand'], [0.5, 'stand'], [1.1, 'thumbsUp']])).face({ expr: 'smug', t, blink: true });
    s.b.pose(T.flow3(t, [[0, 'stand'], [0.8, 'stand'], [1.4, 'peaceSign']])).face({ expr: 'happy', t, blink: true });
    const pc = T.flow3(t, [[0, 'stand'], [1.0, 'stand'], [1.6, 'showCount']]); s.c.pose({ ...pc, handR: t > 1.3 ? 'spread' : pc.handR }).face({ expr: 'smile', t, blink: true });
    man(s, [0, 1.3, 4.4], [0, 1.0, 0], 34); },
});
// C: hands on the desk — left: the 1.0.2 behaviour (rest: false, hands sink into the desk top), right: 1.0.3 (lifted onto it)
registerShot('deskRest', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 30, fog: [12, 40] }); const c = T.W.classroom(st, {});
    const s1 = c.seat(1, 1), s2 = c.seat(1, 2);
    const a = st.add(T.character({ ...HERO, rest: false }).place(s1[0], 0, s1[1], s1[2])), b = st.add(T.character(HERO).place(s2[0], 0, s2[1], s2[2]));
    const l1 = sign(T, 'BEFORE'), l2 = sign(T, 'AFTER'); l1.position.set(s1[0], 1.85, s1[1] + 0.5); l2.position.set(s2[0], 1.85, s2[1] + 0.5); l1.rotation.y = l2.rotation.y = PI; st.add(l1, l2);
    return { st, a, b, s1, s2 }; },
  draw(s, t, info, T) { for (const ch of [s.a, s.b]) ch.pose(T.idle3('sitDesk', t)).face({ expr: 'neutral', t, blink: true });
    const mx = (s.s1[0] + s.s2[0]) / 2, mz = (s.s1[1] + s.s2[1]) / 2; man(s, [mx + 0.15, 1.5, mz - 3.0], [mx, 0.78, mz], 40); },
});
// C: a walk that starts and stops with the feet planted (no skating at the first and last steps)
registerShot('walkStart', {
  init(T) { const st = T.stage({ mood: 'day', fov: 34, fog: [20, 80] }); T.W.schoolYard(st, {}); const hero = st.add(T.character(HERO).place(-1.6, 0, 0, R2)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.walkTo(s.hero, t, { from: [-1.6, 0], to: [1.4, 0], t0: 0.3, t1: 2.6 })).face({ expr: 'neutral', t, blink: true }); man(s, [0, 0.75, 3.6], [0, 0.55, 0], 36); },
});
// D: the scarf swings with the run; the hood from behind; the jacket bunching on the lap
registerShot('scarfRun', {
  init(T) { const st = T.stage({ ...T.W.schoolTime('afterSchool'), fov: 34, fog: [30, 140] }); T.W.pumpkinStreet(st, {}); const hero = st.add(T.character(HERO)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.walkTo(s.hero, t, { from: [-7, 0.35], to: [3, 0.35], t0: 0, t1: 3.2, run: true })).face({ expr: 'determined', t, blink: true }); cam(s, t, info, T, { a: s.hero }); },
});
registerShot('hoodBack', {
  init(T) { const st = T.stage({ ...T.W.schoolTime('afterSchool'), fov: 32, fog: [30, 140] }); T.W.pumpkinStreet(st, {}); const hero = st.add(T.character(HERO).place(0, 0, 0.35, PI)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('relaxed', t)).face({ expr: 'neutral', t, blink: true }); const a = PI * 0.12 + t * 0.32, r = 2.0; man(s, [Math.sin(a) * r, 1.45, 0.35 - Math.cos(a) * r], [0, 1.15, 0.35], 32); },
});
registerShot('sitBench', {
  init(T) { const st = T.stage({ ...T.W.schoolTime('afterSchool'), fov: 34, fog: [30, 140] }); T.W.pumpkinStreet(st, {}); const bn = st.add(T.W.bench({})); bn.position.set(0, 0, -0.5);
    const hero = st.add(T.character(HERO)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.act.sitOn(s.hero, t, { seat: [0.2, -0.42, 0, 0.475], t0: 0.4, dur: 1.0 })).face({ expr: 'smile', t, blink: true }); cam(s, t, info, T, { a: s.hero }); },
});
// E: the November sets
registerShot('thanksgiving', {
  init(T) { const st = T.stage({ mood: 'dusk', fov: 34, fog: [12, 40] }); const d = T.W.thanksgivingDinner(st, {});
    const sit = (o, i) => { const sp = d.seat(i), ch = st.add(T.character(o)); return { ch, sp }; };
    const people = [sit(HERO, 1), sit(MAYA, 2), sit(DAD, 5), sit(GRANDPA, 4)], mom = st.add(T.character(MOM).place(d.carve[0], 0, d.carve[1], d.carve[2] - 0.4)); return { st, d, people, mom }; },
  draw(s, t, info, T) { const gt = info.globalT;
    s.people.forEach(({ ch, sp }, i) => { const base = armsOf(T, T.act.sitOn(ch, t, { seat: sp, t0: -3, dur: 0.5 }), 'sitDesk'); const who = ch.userData.speaker || ['YOU', 'MAYA', 'DAD', 'GRANDPA'][i];
      ch.pose(T.speak3(T.listen3(base, who, gt), who, gt)).face({ expr: i === 0 ? [[0, 'smile'], [2.4, 'joy']] : 'smile', t, blink: true, gt }); });
    s.mom.pose(T.speak3(T.idle3('relaxed', t), 'MOM', gt)).face({ expr: 'happy', t, blink: true, gt });
    man(s, [1.6, 2.15, 3.4], [-0.2, 0.85, 0], 36); },
});
registerShot('pumpkinStreet', {
  init(T) { const st = T.stage({ ...T.W.schoolTime('afterSchool'), fov: 34, fog: [30, 140] }); const u = T.W.pumpkinStreet(st, {});
    const hero = st.add(T.character(HERO)), maya = st.add(T.character(MAYA)); return { st, u, hero, maya }; },
  draw(s, t, info, T) { s.hero.pose(T.walkTo(s.hero, t, { from: [-4, 0.2], to: [0.5, 0.2], t0: 0, t1: 3.5 })).face({ expr: 'smile', t, blink: true });
    s.maya.pose(T.walkTo(s.maya, t, { from: [-4.6, 0.75], to: [-0.1, 0.75], t0: 0, t1: 3.5 })).face({ expr: 'happy', t, blink: true });
    man(s, [-0.5 + t * 0.4, 1.6, 6.5], [-1.5 + t * 0.9, 1.0, -2], 36); },
});
registerShot('leafGust', {
  init(T) { const st = T.stage({ ...T.W.schoolTime('afterSchool'), fov: 34, fog: [30, 140] }); T.W.pumpkinStreet(st, {}); T.W.leafGust(st, { at: [0, 0.35], t0: 0.8, dur: 1.9, r: 1.0 });
    const hero = st.add(T.character(HERO).place(0, 0, 0.35, 0.3)); return { st, hero }; },
  draw(s, t, info, T) { const r = T.act.react(s.hero, T.idle3('stand', t), t, { t0: 0.9, from: [1.5, 1, 2], kind: 'startle' }); s.hero.pose(r.pose).face({ expr: t > 0.9 ? 'surprised' : 'neutral', t, blink: true, look: r.look || [0, 0] }); cam(s, t, info, T, { a: s.hero }); },
});
registerShot('fridayNight', {
  init(T) { const st = T.stage({ ...T.W.schoolTime('night'), fov: 34, fog: [40, 160] }); const f = T.W.footballField(st, {}); const sp = f.sideline(5);
    const hero = st.add(T.character(HERO).place(sp[0], 0, sp[1], sp[2])), maya = st.add(T.character(MAYA).place(sp[0] + 0.8, 0, sp[1] + 0.1, sp[2])); return { st, hero, maya }; },
  draw(s, t, info, T) { s.hero.pose(T.flow3(t, [[0, 'stand'], [0.6, 'stand'], [1.2, 'cheer'], [2.2, 'cheer']])).face({ expr: [[0, 'neutral'], [1.0, 'joy']], t, blink: true });
    s.maya.pose(T.flow3(t, [[0, 'stand'], [0.8, 'stand'], [1.4, 'cheer']])).face({ expr: [[0, 'smile'], [1.2, 'joy']], t, blink: true }); cam(s, t, info, T, { a: s.hero }); },
});
