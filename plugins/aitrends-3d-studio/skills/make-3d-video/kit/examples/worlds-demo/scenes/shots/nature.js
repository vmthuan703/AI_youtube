// worlds-demo (0.2.7): nature sets — beach, sunrise wading, island, snow, aurora, farm, underwater. Learn T.W.beach/island/snow/farm/underwater here.
import { registerShot } from '/engine/core.js';
import { HERO, MAYA, SAM } from '../cast.js';

registerShot('beach', {
  init(T) { const st = T.stage({ mood: 'beach', fov: 40, fog: [30, 150] }); const b = T.W.beach(st, { seed: 3 });
    const hero = st.add(T.character(HERO).place(-0.7, b.heightAt(-0.7, 2.2), 2.2, 0.4)); const maya = st.add(T.character(MAYA).place(0.9, b.heightAt(0.9, 1.6), 1.6, -0.5)); return { st, hero, maya, b }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3(T.POSES3.handsOnHips || 'stand', t, { seed: 1 })).face({ expr: 'deadpan', t, blink: true }); s.maya.pose(T.idle3('point', t, { seed: 2 })).face({ expr: 'happy', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [0.3, 1.3, 8.5], look: [0, 1.0, -2] }], [3, { pos: [0.1, 1.25, 7.8], look: [0, 1.0, -2] }]]); },
});
registerShot('wade', {
  init(T) { const st = T.stage({ mood: 'sunrise', fov: 34, fog: [30, 160] }); const b = T.W.beach(st, { seed: 5, shoreZ: 2 });
    const hero = st.add(T.character(HERO).place(0, b.heightAt(0, -1.2), -1.2, 0)); return { st, hero, b }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('stand', t, { seed: 3 })).face({ expr: 'unimpressed', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [1.2, 1.1, 4.2], look: [0, 0.7, -1.2] }], [3, { pos: [0.9, 1.05, 3.8], look: [0, 0.7, -1.2] }]]); },
});
registerShot('island', {
  init(T) { const st = T.stage({ mood: 'beach', fov: 38, fog: [40, 180], shadowSize: 16 }); const is = T.W.island(st, { r: 9, cz: -6 });
    const hero = st.add(T.character(HERO).place(0, is.heightAt(0, 0), 0, 0.3)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('stand', t)).face({ expr: 'deadpan', t });
    T.dolly(s.st.camera, t, [[0, { pos: [-14, 15, 22], look: [0, 0, -6] }], [3, { pos: [-10, 14, 22], look: [0, 0, -6] }]]); },
});
registerShot('snow', {
  init(T) { const st = T.stage({ mood: 'snow', fov: 42, fog: [25, 130] }); const sn = T.W.snow(st, { slope: 0.16, tracks: true });
    const hero = st.add(T.character(HERO).place(-0.6, sn.heightAt(-0.6, 3), 3, 0.3)); const sam = st.add(T.character(SAM).place(1.2, sn.heightAt(1.2, 1.5), 1.5, -0.4)); return { st, hero, sam }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('crossArms', t)).face({ expr: 'unimpressed', t, blink: true }); s.sam.pose(T.idle3('scared', t, { seed: 4 })).face({ expr: 'worried', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [0.5, 1.6, 9.5], look: [0, 1.4, -3] }], [3, { pos: [0.2, 1.5, 8.8], look: [0, 1.4, -3] }]]); },
});
registerShot('arctic', {
  init(T) { const st = T.stage({ mood: 'arctic', fov: 46, fog: [30, 160] }); const sn = T.W.snow(st, { slope: 0.0, aurora: true, falling: false, pines: 26 });
    const hero = st.add(T.character(HERO).place(0, sn.heightAt(0, 2), 2, 0)); const maya = st.add(T.character(MAYA).place(1.0, sn.heightAt(1.0, 2.2), 2.2, -0.3)); return { st, hero, maya }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3({ ...T.POSES3.stand, head: [-25, 0, 0] }, t)).face({ expr: 'awe', t, blink: true, look: [0, 0.5] }); s.maya.pose(T.idle3({ ...T.POSES3.pointUp }, t, { seed: 5 })).face({ expr: 'joy', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [0.3, 0.9, 8.5], look: [0, 4, -10] }], [3, { pos: [0.2, 0.85, 8.0], look: [0, 4.3, -10] }]]); },
});
registerShot('farm', {
  init(T) { const st = T.stage({ mood: 'day', fov: 40, fog: [40, 170], shadowSize: 18 }); const f = T.W.farm(st, {});
    const hero = st.add(T.character(HERO).place(-1, 0, 2, 0.4)); const sam = st.add(T.character(SAM).place(0.8, 0, 1.4, -0.4)); return { st, hero, sam }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('handsInPockets', t)).face({ expr: 'deadpan', t, blink: true }); s.sam.pose(T.idle3('explain', t, { seed: 6 })).face({ expr: 'happy', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [1.5, 1.5, 10], look: [-1, 2.2, -6] }], [3, { pos: [1.0, 1.45, 9.4], look: [-1, 2.2, -6] }]]); },
});
registerShot('under', {
  init(T) { const st = T.stage({ mood: 'underwater', fov: 44, fog: [4, 34], shadows: true }); const u = T.W.underwater(st, {});
    const hero = st.add(T.character(HERO).place(0, 1.2, 0, 0.2)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3({ ...T.POSES3.jump, y: 1.2 + 0.1 * Math.sin(t * 1.4) }, t)).face({ expr: 'shocked', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [0.8, 2.2, 7.5], look: [0.3, 2.9, -4] }], [3, { pos: [0.4, 2.1, 7.0], look: [0.3, 2.9, -4] }]]); },
});
