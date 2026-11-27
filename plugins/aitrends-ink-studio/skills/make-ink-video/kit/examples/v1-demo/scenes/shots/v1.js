// v1-demo (1.0): the new everyday places (T.W.stairwell / classroom / cityBusStop / shopStreet / residential / streetFood / cafe),
// the 1.0 look (mood environment light, clearcoat skin, cloth sheen, mirror floors, sky dome, light shafts, AO strips, string
// lights) and the 1.0 motion helpers (T.climb, T.jump3 with squash & stretch, T.sitDown, T.turn3, T.W.passersby).
// Render the same frames with `--legacy` to see the 0.2.x look.
import { registerShot, clamp } from '/engine/core.js';
import { HERO, MAYA, SAM } from '../cast.js';
import { STUDENTS, TEACHER_F, CHEF, CASHIER, MOM, DAD, CLASSMATE_2, BRO_2 } from '/channel/cast.js';
const PI = Math.PI, R2 = PI / 2;

registerShot('stairs', {   // climbing the school stairs into the morning light
  init(T) { const st = T.stage({ mood: 'day', fov: 40, fog: [14, 60], dof: { focus: 4, aperture: 0.0012, maxblur: 0.006 } }); const s = T.W.stairwell(st, {});
    const hero = st.add(T.character(HERO)); st.fitShadow([0, 1.5, -1], 5); return { st, s, hero }; },
  draw(s, t, info, T) { s.st.tick(t);
    s.hero.pose(T.climb(s.hero, t, { path: s.s.upA, t0: 0.2, t1: 3.6 })).face({ expr: 'determined', t, blink: true });
        T.dolly(s.st.camera, t, [[0, { pos: [-0.2, 0.5, 4.3], look: [-1.0, 1.1, 0.4] }], [4, { pos: [0.0, 0.8, 3.3], look: [-1.0, 2.0, -1.4] }]]);
    s.st.focusOn(s.hero.headWorld());
  },
});
registerShot('classroom', {   // the hero sits down while the teacher writes; light shafts from the windows
  init(T) { const st = T.stage({ mood: 'day', fov: 38, fog: [12, 40] }); const c = T.W.classroom(st, { board: ['WHAT IF YOU NEVER', 'NEEDED SLEEP?'] });
    const kids = []; [[0, 0], [0, 2], [1, 1], [1, 3], [2, 0], [0, 3]].forEach(([r, k], i) => { const [x, z, yaw] = c.seat(r, k); kids.push(st.add(T.character(STUDENTS[i % STUDENTS.length], { pose: 'sitStudy' }).place(x, 0, z, yaw))); });
    const [hx, hz, hy] = c.seat(1, 2); const hero = st.add(T.character(HERO)); const teacher = st.add(T.character(TEACHER_F).place(...[c.teacher[0] - 1.2, 0, c.teacher[1]], 0.3));
    return { st, c, kids, hero, hx, hz, hy, teacher }; },
  draw(s, t, info, T) { s.st.tick(t);
    const seat = [s.hx, s.hz, s.hy], f = T.sitDown.front(seat, 0.2);
    if (t < 1.0) s.hero.pose(T.walkTo(s.hero, t, { from: [s.hx + 1.0, s.hz - 0.05], to: f, t0: 0.05, t1: 0.95, yaw1: s.hy }));
    else s.hero.pose(T.sitDown(s.hero, t, { seat, t0: 1.0, dur: 0.95, to: 'sitStudy', back: 0.2 }));
    s.hero.face({ expr: [[0, 'neutral'], [1.8, 'smug']], t, blink: true });
    s.kids.forEach((ch, i) => ch.pose(T.idle3('sitStudy', t, { seed: i + 2 })).face({ expr: 'neutral', t, blink: true, look: [0, 0.2] }));
    s.teacher.pose(T.idle3({ ...T.POSES3.stand, armL: [110, 10, 40, 0], handL: 'point' }, t)).face({ expr: 'neutral', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [3.6, 1.9, 3.6], look: [0.6, 0.9, -0.4] }], [3.5, { pos: [3.1, 1.75, 2.9], look: [0.6, 0.9, -0.6] }]]);
  },
});
registerShot('busstop', {   // stands up from the bench as the city bus pulls in; people pass by
  init(T) { const st = T.stage({ mood: 'day', fov: 38, fog: [30, 160] }); const b = T.W.cityBusStop(st, { busX: 3 });
    const [x, z] = b.bench(1); const hero = st.add(T.character(HERO, { pose: 'sit' }).place(x, 0.15, z, 0)); T.W.passersby(st, { cast: [STUDENTS[0], MOM, DAD, STUDENTS[3]], lane: [-25, 25, -3.2], n: 4 });
    st.fitShadow([0, 0, 0], 8); return { st, b, hero, x, z }; },
  draw(s, t, info, T) { s.st.tick(t);
    const busX = 3 + 14 * Math.pow(1 - T.ease.out(clamp(t / 1.6)), 2); s.b.bus.position.x = busX;
    const seat = [s.x, s.z, 0];
    if (t < 1.95) s.hero.pose(T.sitDown(s.hero, t, { seat, y: 0.15, t0: 0.9, dur: 0.95, up: true })).face({ expr: 'neutral', t, blink: true, look: [0.6, 0] });
    else s.hero.pose(T.walkTo(s.hero, t, { from: T.sitDown.front(seat), to: [s.b.door[0] - 0.2, 0.7], t0: 1.95, t1: 3.5, y: 0.15 })).face({ expr: 'smile', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [-6.8, 1.25, 0.4], look: [1.0, 1.1, -0.6] }], [3.5, { pos: [-5.9, 1.3, 0.2], look: [1.5, 1.2, -0.2] }]]);
  },
});
registerShot('shopstreet', {   // a wet night street: reflections, string lights, shop windows
  init(T) { const st = T.stage({ mood: 'night', fov: 36, fog: [18, 80], dof: { focus: 5, aperture: 0.0016, maxblur: 0.008 } }); const p = T.W.shopStreet(st, { wet: true });
    const hero = st.add(T.character(HERO)), maya = st.add(T.character(MAYA)); T.W.passersby(st, { cast: [STUDENTS[1], BRO_2, CLASSMATE_2], lane: [-30, 30, -1.9], n: 3, seed: 3 });
    const rn = T.FX3.rain(st, { n: 900 }); if (rn?.update) st.onTick(rn.update); return { st, p, hero, maya }; },
  draw(s, t, info, T) { s.st.tick(t);
    s.hero.pose(T.walkTo(s.hero, t, { from: [-4, -0.6], to: [2.5, -0.6], t0: 0, t1: 4, y: 0.15 })).face({ expr: 'happy', t, blink: true });
    s.maya.pose(T.walkTo(s.maya, t, { from: [-4.7, -0.1], to: [1.8, -0.1], t0: 0, t1: 4, y: 0.15 })).face({ expr: 'smile', t, blink: true, look: [0.6, 0] });
    const hx = s.hero.position.x; T.dolly(s.st.camera, t, [[0, { pos: [-2.5, 0.7, 4.6], look: [-3.6, 1.2, -0.6] }], [4, { pos: [3.8, 0.8, 4.4], look: [2.6, 1.3, -0.8] }]]); s.st.focusOn([hx, 1.3, -0.6]);
  },
});
registerShot('stoop', {   // jumps down the stoop at dusk: crouch, stretch, squash on landing
  init(T) { const st = T.stage({ mood: 'dusk', fov: 34, fog: [20, 90] }); const r = T.W.residential(st, { cars: 0 }); const sp = r.stoops[3];
    const hero = st.add(T.character(HERO)), sam = st.add(T.character(SAM).place(sp.base[0] - 2.2, 0.15, -0.9, 0.9)); st.fitShadow([sp.x, 0.5, -2], 6); return { st, r, sp, hero, sam }; },
  draw(s, t, info, T) { s.st.tick(t); const sp = s.sp;
    s.hero.pose(T.jump3(s.hero, t, { t0: 0.8, air: 0.62, from: [sp.top[0], sp.top[1], sp.top[2] + 0.4], to: [sp.base[0], 0.15, -1.0], h: 0.5, end: 'fistPump' })).face({ expr: [[0, 'determined'], [1.5, 'joy']], t, blink: true });
    s.sam.pose(T.idle3('cheer', t)).face({ expr: 'joy', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [sp.base[0] + 3.2, 1.3, 3.0], look: [sp.base[0] - 0.5, 1.9, -2.6] }], [3, { pos: [sp.base[0] + 2.8, 1.0, 2.6], look: [sp.base[0] - 0.5, 1.2, -1.6] }]]);
  },
});
registerShot('streetfood', {   // night noodles: steam, hanging bulbs, plastic stools
  init(T) { const st = T.stage({ mood: 'night', fov: 38, fog: [12, 60], dof: { focus: 4, aperture: 0.0018, maxblur: 0.008 } }); const f = T.W.streetFood(st, {});
    const chef = st.add(T.character(CHEF).place(f.vendor[0], 0, f.vendor[1], 0)); const [a1, b1, c1] = f.seat(0), [a2, b2, c2] = f.seat(1);
    const hero = st.add(T.character(HERO, { pose: 'sit' }).place(a1, 0, b1, c1)), maya = st.add(T.character(MAYA, { pose: 'sit' }).place(a2, 0, b2, c2)); return { st, f, chef, hero, maya }; },
  draw(s, t, info, T) { s.st.tick(t);
    s.chef.pose(T.body3({ ...T.POSES3.stand, armL: [60, 20, 70, 0], armR: [55, 10, 80, 0] }, t, 'laugh', 0.3)).face({ expr: 'smile', t, blink: true });
    s.hero.pose(T.body3('sit', t, 'laugh', 0.7)).face({ expr: 'joy', t, blink: true }); s.maya.pose(T.idle3('sit', t)).face({ expr: 'happy', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [4.6, 1.3, 4.2], look: [0, 1.0, -0.4] }], [3.5, { pos: [3.6, 1.1, 3.4], look: [0.2, 1.0, -0.2] }]]); s.st.focusOn([1.6, 1.0, 0.4]);
  },
});
registerShot('cafe', {   // rainy café: Maya turns round as the hero walks in
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 36, fog: [10, 40] }); const k = T.W.cafe(st, { rain: true });
    const [x, z] = k.seat(2); const maya = st.add(T.character(MAYA).place(x - 0.1, 0, z + 0.6, -R2)); const bar = st.add(T.character(CASHIER).place(...[k.barista[0], 0, k.barista[1]], 0));
    const hero = st.add(T.character(HERO)); return { st, k, maya, bar, hero, x, z }; },
  draw(s, t, info, T) { s.st.tick(t);
    s.maya.pose(T.turn3(s.maya, t, { t0: 1.0, from: -1.94, to: 0.2, dur: 0.6, pose: 'stand' })).face({ expr: [[0, 'neutral'], [1.3, 'happy']], t, blink: true });
    s.hero.pose(T.walkTo(s.hero, t, { from: [-3.0, 3.4], to: [s.x - 1.0, s.z + 1.1], t0: 0.2, t1: 2.6, yaw1: 2.08 })).face({ expr: 'smile', t, blink: true });
    s.bar.pose(T.idle3({ ...T.POSES3.stand, armL: [40, 10, 80, 0] }, t)).face({ expr: 'neutral', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [3.8, 1.45, 3.8], look: [-1.5, 1.1, 1.5] }], [3.5, { pos: [3.2, 1.4, 3.3], look: [-1.3, 1.1, 1.7] }]]);
  },
});
registerShot('gloss', {   // close-up: clearcoat skin and hair, sheen on the puffer jacket, mood light in the reflections
  init(T) { const st = T.stage({ mood: 'golden', fov: 30, fog: [20, 120], dof: { focus: 2.4, aperture: 0.0022, maxblur: 0.01 } }); T.W.residential(st, { houses: 5 }); T.W.skyDome(st, { clouds: 16, sun: [-0.8, 0.12, -0.6] });
    const hero = st.add(T.character(HERO).place(0, 0.15, -0.6, 0.25)); return { st, hero }; },
  draw(s, t, info, T) { s.st.tick(t); s.hero.pose(T.idle3('confident', t)).face({ expr: [[0, 'smirk'], [1.6, 'smug']], t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [1.0, 1.55, 2.0], look: [0, 1.35, -0.6] }], [3, { pos: [0.6, 1.5, 1.5], look: [0, 1.38, -0.6] }]]); s.st.focusOn(s.hero.headWorld());
  },
});
