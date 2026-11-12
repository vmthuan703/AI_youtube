// v2-sets (2.0): Main Street and the high school. The look and the weather come from shots.json ("look", "weather");
// the shot code only names a mood and builds the set.
import { registerShot } from '/engine/core.js';
import { HERO, MIA } from '../cast.js';
const Y = 0.16;

registerShot('main_day', {
  init(T) { const st = T.stage({ mood: 'golden', sun: [-0.94, 0.16, -0.3], fov: 34, shadowSize: 30 }); const ms = T.usa.mainStreet(st, { season: 'fall', clearX: [-3, 16] });
    const hero = st.add(T.character(HERO)); st.fitShadow([-4, 0, 2], 30); return { st, ms, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.walkTo(s.hero, t, { from: [3.5, -0.3], to: [-1, -0.2], t0: -1, t1: 4, y: Y })); s.hero.position.y = Y; s.hero.face({ expr: 'smile', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [13, 2.0, 5.2], look: [-20, 3.0, 4.5] }], [3, { pos: [10.5, 1.7, 4.4], look: [-20, 2.8, 3.6] }]]); },
});
registerShot('main_night', {
  init(T) { const st = T.stage({ mood: 'night', fov: 34, shadowSize: 22, wxAt: [0, 3] }); const ms = T.usa.mainStreet(st, { season: 'fall', night: true, wet: true, clearX: [-6, 9] });
    T.W.mirror(st, { w: 200, d: 10, x: 0, z: 6, y: 0.005, strength: 0.7, blur: 0.9, res: 0.85 });
    const hero = st.add(T.character(HERO).place(0.5, Y, -0.2, 0.5)), mia = st.add(T.character(MIA).place(-0.4, Y, 0.0, 0.7));
    st.add(T.spot('#ffbe78', 120, { pos: [3, 5.6, 1.0], target: [0.5, 0, 0.2], angle: 0.8, penumbra: 0.9, dist: 20 })); st.fitShadow([0, 0, 1], 18); return { st, hero, mia }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('stand', t)).face({ expr: 'smile', t, blink: true, look: [0.3, 0.2] }); s.mia.pose(T.idle3('relaxed', t, { seed: 3 })).face({ expr: 'smile', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [7.5, 1.3, 6.4], look: [-6, 2.6, 1] }], [3, { pos: [6.6, 1.25, 5.8], look: [-6, 2.5, 1] }]]); },
});
registerShot('school_day', {
  init(T) { const st = T.stage({ mood: 'day', fov: 36, shadowSize: 40 }); const hs = T.usa.highSchool(st, { season: 'fall' });
    const hero = st.add(T.character(HERO).place(1.5, Y, 0.3, Math.PI)); st.fitShadow([0, 0, -8], 40); return { st, hs, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('stand', t)).face({ expr: 'neutral', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [7, 1.2, 9.5], look: [-1, 4.2, -18] }], [3, { pos: [5.5, 1.4, 8.0], look: [-1, 4.4, -18] }]]); },
});
registerShot('school_snow', {
  init(T) { const st = T.stage({ mood: 'dusk', sun: [-0.8, 0.15, -0.58], fov: 36, shadowSize: 40, wxAt: [0, 0] }); const hs = T.usa.highSchool(st, { season: 'winter', lit: 0.8 });
    const hero = st.add(T.character(HERO).place(0.4, 0.03, -4, Math.PI * 0.9)); st.fitShadow([0, 0, -8], 40); return { st, hs, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('stand', t)).face({ expr: 'smile', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [-9, 1.3, 6], look: [3, 4.6, -18] }], [3, { pos: [-7.5, 1.5, 5], look: [3, 4.6, -18] }]]); },
});
