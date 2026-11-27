// a.js — one shot per reference-video situation: face close-up (casino), diner booth, hallway OTS, explainer stage with
// pills/coins/stat card, gym + crowd, game-show doors, roulette wheel, end-screen lineup. Learn the new sets/UI from here.
import { E, V, registerShot, clamp } from '/engine/core.js';
import * as UI from '/engine/ui2d.js';
import { YOU, MAYA, JAKE, LILY, DEALER, KIDS } from '../cast.js';

registerShot('face', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 32, fog: [6, 30], dof: { focus: 1.2, aperture: 0.012, maxblur: 0.012 } }); T.W.casino(st, { tableZ: -2.5 });
    const you = st.add(T.character(YOU).place(0, 0, 1.0, 0)); return { st, you }; },
  draw(s, t, info, T) { s.you.pose(T.breathe3('stand', t)).face({ expr: 'surprised', t }); T.aim(s.st.camera, [0, 1.42, 1.0], { dist: 1.25, yaw: 0.12, pitch: -0.05 }); s.st.focusOn(s.you.headWorld()); },
});
registerShot('diner', {
  init(T) { const st = T.stage({ mood: 'night', fov: 40, fog: [8, 40] }); const d = T.W.diner(st, {});
    const [x, z] = d.booths[1]; const you = st.add(T.character(YOU, { pose: 'sitDesk' }).place(x - 0.0, 0, z - 0.75, 0)); const maya = st.add(T.character(MAYA, { pose: 'sitDesk' }).place(x, 0, z + 0.75, Math.PI));
    return { st, you, maya, x, z }; },
  draw(s, t, info, T) { s.you.face({ expr: 'happy' }); s.maya.face({ expr: 'smile', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [s.x + 2.4, 1.5, s.z + 0.1], look: [s.x, 1.05, s.z] }], [2, { pos: [s.x + 2.2, 1.45, s.z + 0.3], look: [s.x, 1.05, s.z] }]]); },
});
registerShot('hall', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 44, fog: [8, 30], dof: { focus: 3, aperture: 0.004, maxblur: 0.01 } });
    T.W.room(st, { kind: 'hallway', w: 4.6, d: 20, wall: '#5a4466', floor: '#b89c90', lockerColors: ['#2f6a72', '#2f6a72', '#b8403a'], window: false, ceiling: true });
    const you = st.add(T.character(YOU).place(-0.9, 0, 3.2, 2.6)); const lily = st.add(T.character(LILY).place(0.6, 0, 0.3, -0.5)); const k = st.add(T.character(KIDS[0]).place(-1.2, 0, -4, 0.3));
    return { st, you, lily }; },
  draw(s, t, info, T) { s.lily.pose(T.breathe3({ ...T.POSES3.relaxed, armL: [40, 10, 120, 0] }, t)).face({ expr: 'happy' }); s.you.face({ expr: 'neutral' });
    T.dolly(s.st.camera, t, [[0, { pos: [-1.2, 1.35, 4.3], look: [0.4, 1.1, 0.2] }], [2, { pos: [-1.1, 1.35, 4.1], look: [0.4, 1.1, 0.2] }]]); s.st.focusOn(s.lily.headWorld()); },
});
registerShot('explain', {
  init(T) { const st = T.stage({ mood: 'void', fov: 24, fog: false }); T.W.explainer(st, {});
    const you = st.add(T.character(YOU).place(-3.2, 0, 0, 0.2));
    const coinTex = T.textTex('H', { w: 128, h: 128, size: 90, color: '#7a4a10', bg: '#f2c040', font: 'Nunito', weight: 900 });
    const coins = []; for (let i = 0; i < 10; i++) { const c = T.cyl(0.17, 0.17, 0.03, T.mat('#f2c040', { metal: 0.5, rough: 0.35 }), -1.6 + i * 0.42, 1.25, 0, 32); c.rotation.x = Math.PI / 2; const f = new T.THREE.Mesh(new T.THREE.CircleGeometry(0.15, 32), new T.THREE.MeshBasicMaterial({ map: coinTex })); f.position.y = 0.017; f.rotation.x = -Math.PI / 2; c.add(f); st.add(c); coins.push(c); }
    return { st, you, coins }; },
  draw(s, t, info, T) { s.you.pose(T.breathe3('cheer', t)).face({ expr: 'surprised', t }); s.coins.forEach((c, i) => { c.scale.setScalar(clamp((t - i * 0.08) / 0.2)); });
    T.dolly(s.st.camera, t, [[0, { pos: [0, 1.25, 12], look: [0, 1.15, 0] }], [2, { pos: [0, 1.25, 11.6], look: [0, 1.15, 0] }]]); },
  overlay(g, t) { UI.pill(g, { str: '10 HEADS', x: E.W * 0.42, y: 300, t, start: 0.1 }); UI.pill(g, { str: '1 IN 1,000', x: E.W * 0.82, y: 300, t, start: 0.3, gold: true }); UI.statCard(g, { label: 'TRIES', value: '1,000', x: E.W * 0.6, y: 820, t, start: 0.5 }); },
});
registerShot('gym', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 46, fog: [14, 60] }); T.W.gym(st, {}); const you = st.add(T.character(YOU).place(0, 0, 2, 0)); return { st, you }; },
  draw(s, t, info, T) { s.you.pose(T.breathe3('cheer', t)).face({ expr: 'joy' }); T.dolly(s.st.camera, t, [[0, { pos: [0, 0.8, 7.5], look: [0, 2.2, -6] }], [2, { pos: [0.3, 0.85, 7.0], look: [0, 2.2, -6] }]]); },
});
registerShot('show', {
  init(T) { const st = T.stage({ mood: 'night', fov: 40, fog: [10, 40] }); T.W.gameshow(st, {}); const you = st.add(T.character(YOU).place(0, 0, -1.2, 0)); return { st, you }; },
  draw(s, t, info, T) { s.you.pose(T.breathe3('relaxed', t)).face({ expr: 'smug', t, blink: true }); T.dolly(s.st.camera, t, [[0, { pos: [0, 1.4, 4.2], look: [0, 1.4, -2] }], [2, { pos: [0, 1.4, 3.9], look: [0, 1.4, -2] }]]); },
});
registerShot('wheel', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 36, fog: [6, 30] }); const c = T.W.casino(st, { tableZ: 0 }); const dealer = st.add(T.character(DEALER).place(0.3, 0, -1.4, 0)); return { st, wheel: c.wheel, dealer }; },
  draw(s, t, info, T) { s.wheel.update(t + 3, { speed: 1.5 }); s.dealer.pose(T.breathe3('holdFront', t)).face({ expr: 'shocked' });
    const w = s.wheel.position; T.dolly(s.st.camera, t, [[0, { pos: [w.x + 0.9, w.y + 0.7, w.z + 1.0], look: [w.x, w.y + 0.15, w.z] }], [2, { pos: [w.x + 0.75, w.y + 0.6, w.z + 0.9], look: [w.x, w.y + 0.15, w.z] }]]); },
});
registerShot('end', {
  init(T) { const st = T.stage({ mood: 'void', fov: 26, fog: false }); T.W.explainer(st, {}); const cast = [YOU, JAKE, MAYA, LILY, DEALER, ...KIDS.slice(0, 3)];
    const figs = cast.map((o, i) => st.add(T.character(o, { seed: i }).place(-3.5 + i * 1.0, 0, 0, 0))); return { st, figs }; },
  draw(s, t, info, T) { s.figs.forEach((f, i) => f.pose(T.breathe3('relaxed', t, 1, i)).face({ expr: ['smug', 'happy', 'smile', 'neutral', 'happy', 'smug', 'smile', 'sleepy'][i] })); T.dolly(s.st.camera, t, [[0, { pos: [0, 2.3, 13], look: [0, 1.6, 0] }], [2, { pos: [0, 2.3, 12.6], look: [0, 1.6, 0] }]]); },
  overlay(g, t) { UI.subscribeRow(g, { y: 200, t: t + 1 }); },
});
