// v201-body (2.0.1): the new body and gait next to the 2.0.0 one. Old = build 1 (left / back), new = the default on cine.
import { registerShot, clamp, ease } from '/engine/core.js';
import { HERO, OLD, MIA, ZOE } from '../cast.js';
const PI = Math.PI, Y = 0.16;   // mainStreet near sidewalk z = -2.6..1 at y 0.16
const street = (T, o = {}) => { const st = T.cine.stage(T, { look: 'goldenHour', sun: [-0.9, 0.22, -0.38], fov: 34, shadowSize: 22, ...o }); T.usa.mainStreet(st, { season: 'fall', clearX: [-14, 14] }); return st; };

registerShot('lineup', {
  init(T) { const st = street(T);
    const old = st.add(T.character(OLD).place(1.75, Y, -0.6, 0.15)), hero = st.add(T.character(HERO).place(3.25, Y, -0.6, -0.15));
    T.wx.leaves(st, { area: [-8, 8, 0, 6, -3, 6], n: 120, wind: [1, 0, 0.4] }); st.fitShadow([0, 0, 0], 12); return { st, old, hero }; },
  draw(s, t, info, T) {
    s.old.pose(T.idle3('stand', t, { v2: false, seed: 2 })).face({ expr: 'smile', t, blink: true });
    s.hero.pose(T.idle3('stand', t, { seed: 2 })).face({ expr: 'smile', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [4.7, 1.35, 4.4], look: [2.5, 1.05, -0.6], fov: 34 }], [3.6, { pos: [1.9, 1.2, 3.9], look: [2.5, 1.05, -0.6], fov: 34 }]]); },
});

registerShot('walkside', {
  init(T) { const st = street(T, { shadowSize: 30 });
    const old = st.add(T.character(OLD)), hero = st.add(T.character(HERO));
    st.fitShadow([0, 0, -1], 26); return { st, old, hero }; },
  draw(s, t, info, T) {
    s.old.pose(T.walkTo(s.old, t, { from: [-6.5, -1.9], to: [6.5, -1.9], t0: 0.2, t1: 9, y: Y }));
    s.hero.pose(T.walkTo(s.hero, t, { from: [-8.2, -0.3], to: [4.8, -0.3], t0: 0.2, t1: 9, y: Y }));
    s.old.face({ expr: 'neutral', t, blink: true }); s.hero.face({ expr: 'smile', t, blink: true });
    const cx = (s.old.position.x + s.hero.position.x) / 2;
    T.dolly(s.st.camera, t, [[0, { pos: [cx, 0.75, 5.6], look: [cx, 0.75, -1], fov: 34 }], [4.8, { pos: [cx, 0.75, 5.6], look: [cx, 0.75, -1], fov: 34 }]]); },
});

registerShot('run', {
  init(T) { const st = street(T, { shadowSize: 34 });
    const hero = st.add(T.character(HERO)), mia = st.add(T.character(MIA)), zoe = st.add(T.character(ZOE));
    T.wx.leaves(st, { area: [-12, 12, 0, 6, -3, 6], n: 200, wind: [1.4, 0, 0.5] }); st.fitShadow([0, 0, -1], 28); return { st, hero, mia, zoe }; },
  draw(s, t, info, T) {
    s.hero.pose(T.walkTo(s.hero, t, { from: [-9, -1.2], to: [5, -0.2], t0: 0, t1: 4.4, y: Y, run: true })); s.hero.face({ expr: 'determined', t, blink: true });
    s.mia.pose(T.walkTo(s.mia, t, { from: [3.5, -2.2], to: [-1.5, -2.2], t0: 0, t1: 4.5, y: Y })); s.mia.face({ expr: 'smile', t, blink: true });
    s.zoe.pose(T.walkTo(s.zoe, t, { from: [4.4, -1.6], to: [-0.4, -1.6], t0: 0.1, t1: 4.6, y: Y })); s.zoe.face({ expr: 'neutral', t, blink: true });
    const hx = s.hero.position.x;
    T.dolly(s.st.camera, t, [[0, { pos: [hx + 3.4, 0.9, 3.6], look: [hx, 1.0, -0.8], fov: 36 }], [3.2, { pos: [hx + 2.6, 0.95, 3.6], look: [hx - 0.4, 1.0, -0.8], fov: 36 }]]); },
});

registerShot('stopturn', {
  init(T) { const st = street(T);
    const hero = st.add(T.character(HERO)), mia = st.add(T.character(MIA).place(3.8, Y, -1.0, -0.6));
    st.fitShadow([0, 0, -1], 14); return { st, hero, mia }; },
  draw(s, t, info, T) {
    const walk = T.walkTo(s.hero, t, { from: [-0.2, -0.9], to: [2.3, -0.9], t0: 0, t1: 2.3, y: Y });
    const pose = t < 2.45 ? walk : T.turn3(s.hero, t, { t0: 2.45, from: PI / 2, to: 0.05, dur: 0.7, pose: 'stand' });
    s.hero.pose(t < 3.2 ? pose : T.idle3('stand', t, { seed: 5 })).face({ expr: [[0, 'neutral'], [3.0, 'smile']], t, blink: true });
    s.mia.pose(T.idle3('relaxed', t, { seed: 3 })).face({ expr: 'smile', t, blink: true, look: [-0.4, 0] });
    T.dolly(s.st.camera, t, [[0, { pos: [3.1, 1.25, 4.4], look: [1.5, 1.0, -0.9], fov: 34 }], [4.6, { pos: [2.9, 1.2, 3.6], look: [2.7, 1.05, -0.9], fov: 34 }]]); },
});

registerShot('sit', {
  init(T) { const st = T.cine.stage(T, { look: 'interiorWarm', fov: 36 }); const c = T.W.classroom(st);
    const seat = c.seat(1, 1), seat2 = c.seat(1, 2);
    const hero = st.add(T.character(HERO)), zoe = st.add(T.character(ZOE, { pose: 'sitStudy' }).place(seat2[0], 0, seat2[1], seat2[2]));
    return { st, c, seat, hero, zoe }; },
  draw(s, t, info, T) {
    s.hero.place(s.seat[0], 0, s.seat[1], s.seat[2]); s.hero.pose(T.posesAt3(t, [[0, T.breathe3('sitStudy', t)], [1.2, T.breathe3('sitRaiseHand', t)]], 0.45)).face({ expr: [[0, 'neutral'], [1.2, 'smile']], t, blink: true });
    s.zoe.pose(T.breathe3('sitStudy', t)).face({ expr: 'smile', t, blink: true, look: [-0.5, 0] });
    const [x, z] = s.seat; T.dolly(s.st.camera, t, [[0, { pos: [x - 2.3, 1.3, z - 2.2], look: [x + 0.3, 0.85, z], fov: 36 }], [2.8, { pos: [x - 2.0, 1.25, z - 1.9], look: [x + 0.3, 0.9, z], fov: 36 }]]); },
});
