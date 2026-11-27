// worlds-demo (0.2.7): light from props — campfire, energy blade, torch, phone glow. The prop is the key light: dim the stage.
import { registerShot } from '/engine/core.js';
import { HERO, MAYA, SAM } from '../cast.js';

registerShot('camp', {
  init(T) { const st = T.stage({ mood: 'night', fov: 36, fog: [12, 60] }); T.W.park(st, { lights: 0, trees: 18 }); const cf = T.W.campfire(st, { pos: [0, 0, 0] });
    const hero = st.add(T.character(HERO, { pose: 'sit' }).place(-1.3, 0, 0.4, 1.2)); const maya = st.add(T.character(MAYA, { pose: 'sit' }).place(1.3, 0, 0.5, -1.2));
    for (const [x, z] of [[-1.3, 0.4], [1.3, 0.5]]) st.add(T.at(T.box(0.9, 0.4, 0.45, '#5a4434'), x, 0.2, z));
    return { st, hero, maya }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3({ ...T.POSES3.sit, y: 0.0 }, t)).face({ expr: 'deadpan', t, blink: true }); s.maya.pose(T.idle3(T.POSES3.sit, t, { seed: 3 })).face({ expr: 'smile', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [0.2, 1.1, 4.6], look: [0, 0.8, 0] }], [3, { pos: [0.1, 1.05, 4.2], look: [0, 0.8, 0] }]]); },
});
registerShot('blade', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 34, fog: [6, 30], ambient: 0.35, keyIntensity: 0.4 }); T.W.room(st, { kind: 'bedroom', w: 6, d: 6, window: 'back', view: 'night' });
    const hero = st.add(T.character(HERO).place(0, 0, 0.8, 0)); const b = T.FX3.blade({ color: '#ffd86a' }); hero.hold(b, 'R', { rot: [Math.PI, 0, 0] }); return { st, hero, b }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3({ ...T.POSES3.stand, armR: [70, 20, 80, 0], handR: 'fist' }, t)).face({ expr: [[0, 'awe'], [1.5, 'smug']], t, blink: true }); s.b.update(t, { on: T.clamp((t - 0.3) / 0.4) });
    T.dolly(s.st.camera, t, [[0, { pos: [0.6, 1.35, 3.6], look: [0, 1.25, 0.8] }], [3, { pos: [0.5, 1.3, 3.2], look: [0, 1.25, 0.8] }]]); },
});
registerShot('torch', {
  init(T) { const st = T.stage({ mood: 'night', fov: 40, fog: [6, 26], ambient: 0.3, keyIntensity: 0.25, faceLight: 0.25 }); T.W.room(st, { kind: 'hallway', w: 4.6, d: 22, lockerColors: ['#2f6a72', '#b8403a'], window: false, ceiling: true, strips: false });
    const hero = st.add(T.character(HERO).place(-0.3, 0, 3, Math.PI + 0.12)); const sam = st.add(T.character(SAM).place(0.75, 0, 3.9, Math.PI - 0.2)); const f = T.FX3.torch({}); hero.hold(f, 'R', { rot: [0, 0, 0] }); return { st, hero, sam, f }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3({ ...T.POSES3.stand, armR: [80, 5, 10, 0], handR: 'fist' }, t)).face({ expr: 'determined', t, blink: true }); s.sam.pose(T.idle3('scared', t, { seed: 2 })).face({ expr: 'scared', t, blink: true }); s.f.update(t);
    T.dolly(s.st.camera, t, [[0, { pos: [1.7, 1.25, 1.2], look: [-0.6, 1.0, 5.5] }], [3, { pos: [1.5, 1.2, 0.6], look: [-0.6, 1.0, 5.5] }]]); },
});
registerShot('phone', {
  init(T) { const st = T.stage({ mood: 'night', fov: 30, fog: [5, 30], ambient: 0.25, keyIntensity: 0.2, faceLight: 0.15 }); const rm = T.W.room(st, { kind: 'bedroom', w: 6, d: 6, window: 'back', view: 'night' });
    const hero = st.add(T.character(HERO, { pose: 'phone' }).place(0, 0, 1.2, 0)); const ph = T.W.phone({}); hero.hold(ph, 'R', { pos: [0, -0.02, 0.05], rot: [-0.3, Math.PI, 0] }); const gl = T.FX3.glowLight(ph, { color: '#9fd0ff', intensity: 3, dist: 2.2, at: [0, 0, -0.15] }); return { st, hero, ph, gl }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('phone', t)).face({ expr: 'shocked', t, blink: true, look: [0, -0.4] });
    T.aim(s.st.camera, [0, 1.35, 1.2], { dist: 2.2, yaw: 0.25, pitch: 0.02 }); },
});
