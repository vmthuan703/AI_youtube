// v1-more (1.0): supermarket, hospital hallway, rooftop, train station; snow cover, puddles, leaves; lightning, cloud shadows,
// headlights, a flickering tube; named cameras from shots.json (T.camShot); "mblur": "action" + FX3.swoosh; hair / strings / bag
// swing; lip-sync from timeline/words.json (speaker YOU).
import { registerShot, clamp } from '/engine/core.js';
import { HERO, MAYA, SAM } from '../cast.js';
import { STUDENTS, CASHIER, RIVAL, MOM, DAD, CLASSMATE_2, BRO_2 } from '/channel/cast.js';
const PI = Math.PI, R2 = PI / 2;
const cam = (s, t, info, T, o) => T.camShot(s.st.camera, t, info.shot.camera, { dur: info.dur, ...o });

registerShot('market', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 36, fog: [14, 50] }); const m = T.W.supermarket(st, {});
    const hero = st.add(T.character(HERO)), cart = st.add(T.W.cart({})), cash = st.add(T.character(CASHIER).place(...[m.cashier(1)[0], 0, m.cashier(1)[1]], R2));
    T.W.passersby(st, { cast: [MOM, STUDENTS[2]], lane: [-7, 7, 4.6], n: 2, y: 0 }); return { st, m, hero, cart, cash }; },
  draw(s, t, info, T) { const x = s.m.aisle(1);
    s.hero.pose(T.walkTo(s.hero, t, { from: [x, 3.5], to: [x, -2.5], t0: 0, t1: 3.2 })); s.hero.face({ expr: 'smile', t, blink: true });
    const p = s.hero.position; s.cart.position.set(p.x, 0, p.z - 0.75); s.cart.rotation.y = PI; s.cash.pose(T.idle3('stand', t)).face({ expr: 'neutral', t, blink: true });
    cam(s, t, info, T, { a: s.hero, dist: 1.4, side: 0.04 }); },
});
registerShot('hospital', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 34, fog: [10, 40] }); const h = T.W.hospitalHall(st, {});
    const hero = st.add(T.character(HERO).place(0.3, 0, 4, PI)); return { st, h, hero, base: h.lights.map(l => l.intensity) }; },
  draw(s, t, info, T) { const f = T.W.flicker(t, { rate: 11, depth: 0.6, seed: 4 }); s.h.lights[1].intensity = s.base[1] * f; s.h.panels[5].material.color.setScalar(1.3 * f);
    s.hero.pose(T.idle3('stand', t)).face({ expr: [[0, 'worried'], [1.6, 'scared']], t, blink: true, look: [0, 0.1] }); cam(s, t, info, T, { a: s.hero }); },
});
registerShot('rooftop', {
  init(T) { const st = T.stage({ mood: 'storm', fov: 38, fog: [20, 120] }); const r = T.W.rooftop(st, { lights: false });
    const hero = st.add(T.character(HERO).place(0, 0, 2.6, 0.2)), sam = st.add(T.character(SAM).place(-1.3, 0, 2.2, 0.5));
    const lt = T.W.lightning(st, { times: [0.7, 2.3] }); const rn = T.FX3.rain(st, { n: 1200, area: [-8, 8, 0, 9, -6, 6] }); if (rn?.update) st.onTick(rn.update); return { st, hero, sam }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('confident', t)).face({ expr: 'determined', t, blink: true }); s.sam.pose(T.idle3('scared', t, { seed: 3 })).face({ expr: 'shocked', t, blink: true });
    cam(s, t, info, T, { a: s.hero }); },
});
registerShot('train', {
  init(T) { const st = T.stage({ mood: 'day', fov: 38, fog: [30, 160] }); const s2 = T.W.trainStation(st, {});
    const hero = st.add(T.character(HERO).place(-1, 0, 0.2, R2)), maya = st.add(T.character(MAYA).place(-1.6, 0, -0.9, R2 + 0.3)); T.W.cloudShadows(st, { at: [-1, 0] }); return { st, s2, hero, maya }; },
  draw(s, t, info, T) { const k = clamp(t / 2.4); s.s2.train.position.x = -60 + 60 * (1 - Math.pow(1 - k, 3));
    s.hero.pose(T.idle3('stand', t)).face({ expr: 'neutral', t, blink: true, look: [-0.5, 0] }); s.maya.pose(T.idle3('relaxed', t, { seed: 2 })).face({ expr: 'smile', t, blink: true });
    cam(s, t, info, T, { a: s.hero, side: -1, dist: 1.5 }); },
});
registerShot('snow', {
  init(T) { const st = T.stage({ mood: 'snow', fov: 34, fog: [20, 90], dof: { focus: 1.3, aperture: 0.0022, maxblur: 0.01 } }); T.W.residential(st, { houses: 5 }); T.W.snowCover(st, { amount: 1, groundY: 0.15 });
    const sn = T.FX3.rain(st, { snow: true, n: 900, area: [-6, 6, 0, 6, -5, 4] }); if (sn?.update) st.onTick(sn.update);
    const hero = st.add(T.character(HERO).place(0, 0.15, -0.6, 0.2)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('handsInPockets', t)).face({ expr: [[0, 'neutral'], [1.4, 'smile']], t, blink: true, look: [0, 0.4] }); cam(s, t, info, T, { a: s.hero }); s.st.focusOn(s.hero.headWorld()); },
});
registerShot('puddles', {
  init(T) { const st = T.stage({ mood: 'day', fov: 38, fog: [25, 120] }); T.W.shopStreet(st, { tables: 2 }); T.W.puddles(st, { area: [-12, 12, -2.9, 0.9], y: 0.15, n: 8 });
    const sam = st.add(T.character(SAM)); return { st, sam }; },
  draw(s, t, info, T) { s.sam.pose(T.walkTo(s.sam, t, { from: [-3.5, -1], to: [6, -1], t0: 0, t1: 2.6, run: true, y: 0.15 })).face({ expr: 'joy', t, blink: true }); cam(s, t, info, T, { a: s.sam, side: -1, dist: 0.6 }); },
});
registerShot('leaves', {
  init(T) { const st = T.stage({ mood: 'golden', fov: 36, fog: [20, 100] }); T.W.park(st, {}); T.W.leaves(st, { area: [-6, 6, 0, 5, -3, 3], n: 80, ground: 160 });
    const maya = st.add(T.character(MAYA)), hero = st.add(T.character(HERO)); return { st, maya, hero }; },
  draw(s, t, info, T) { s.maya.pose(T.walkTo(s.maya, t, { from: [-2.5, 0.4], to: [1.5, 0.4], t0: 0, t1: 3 })).face({ expr: 'happy', t, blink: true });
    s.hero.pose(T.walkTo(s.hero, t, { from: [-2.5, -0.5], to: [1.5, -0.5], t0: 0, t1: 3 })).face({ expr: 'smile', t, blink: true, look: [0.5, 0] }); cam(s, t, info, T, { a: s.hero, b: s.maya, side: -1 }); },
});
registerShot('punch', {
  init(T) { const st = T.stage({ mood: 'dusk', fov: 34, fog: [20, 100] }); T.W.rooftop(st, {}); const hero = st.add(T.character(HERO).place(0, 0, 1.8, 0)), rival = st.add(T.character(RIVAL).place(0, 0, 3.0, PI));
    const sw = T.FX3.swoosh(st, { pos: [0.12, 1.12, 1.9], axis: [0.9, 1, 0], from: 0.6, to: -1.6, r: 0.62, w: 0.3, t0: 0.98, dur: 0.2, opacity: 0.95, color: '#fff4c8' }); return { st, hero, rival }; },
  draw(s, t, info, T) { s.hero.pose(T.posesAt3(t, [[0, 'fight'], [1.0, 'punch'], [1.6, 'fight']], 0.1)).face({ expr: [[0, 'determined'], [1.0, 'angry']], t, blink: true });
    const hit = clamp((t - 1.1) / 0.5); s.rival.position.z = 3.0 + 0.6 * T.ease.out(hit); s.rival.pose(T.posesAt3(t, [[0, 'fight'], [1.12, 'fall']], 0.15)).face({ expr: t > 1.1 ? 'shocked' : 'smirk', t, blink: true });
    cam(s, t, info, T, { a: s.hero, side: 0.01, yaw: 1.57, dist: 1.1 }); },
});
registerShot('lipsync', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 30, fog: [10, 40] }); T.W.cafe(st, {}); const hero = st.add(T.character(HERO).place(0.4, 0, 1.6, 0.1)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.speak3(T.idle3('talk', t), 'YOU', info.globalT)).face({ expr: 'smile', t, blink: true, speaker: 'YOU', gt: info.globalT }); cam(s, t, info, T, { a: s.hero }); },
});
registerShot('headlights', {
  init(T) { const st = T.stage({ mood: 'night', fov: 36, fog: [10, 40] }); T.W.room(st, { kind: 'bedroom', window: 'back' });
    T.W.headlights(st, { from: [1.5, 1.7, -3.2], to: [-2.5, 1.7, -3.2], aim: [-0.55, -0.12, 1], t0: 0.4, dur: 2.6, power: 70, angle: 0.32, shadow: false });
    const hero = st.add(T.character(HERO, { pose: 'sitBed' }).place(-2.9, 0, -2.2, 0.4)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('sitBedPhone', t)).face({ expr: [[0, 'neutral'], [1.6, 'worried']], t, blink: true, look: [0.6, 0.2] }); cam(s, t, info, T, { a: s.hero, side: -1, dist: 1.3 }); },
});
