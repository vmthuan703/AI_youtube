// 03_street.js — s005 the car runs the red light, s006 Jake blinks, s007 time crawls, s008 the stroll + soda,
// s009 back on the sidewalk as the car zooms past.
import { E, V, registerShot, ease, prog, key, clamp, lerp } from '/engine/core.js';
import * as UI from '/engine/ui2d.js';
import { HERO, JAKE, DRIVER } from '../cast.js';
import { street } from '../sets/street.js';

const morning = (T, o = {}) => T.stage({ mood: 'golden', fov: V(38, 55), fog: [18, 110], keyPos: [-12, 14, 20], keyIntensity: 1.7, ambient: 1.5, ...o });
const makeCar = (T, st) => { const drv = T.character(DRIVER, { pose: { ...T.POSES3.sit, armL: [55, 0, 40, 0], armR: [55, 0, 40, 0] } }); const car = st.add(T.W.car({ color: '#d63a2a', type: 'sports', driver: drv })); car.rotation.y = Math.PI / 2; return { car, drv }; };
const soda = (T) => T.W.bottle({ color: '#e0402e', label: 'FIZZ', labelColor: '#e0402e' });
const badge = (g, a = 1) => UI.badge(g, { str: '10x', a });

registerShot('s005', {
  init(T) {
    const st = morning(T); street(T, st, { focus: [-8, 3] });
    const { car, drv } = makeCar(T, st);
    const hero = st.add(T.character(HERO).place(1.0, 0.15, 5.0, Math.PI));
    return { st, car, drv, hero };
  },
  draw(s, t, info, T) {
    s.car.position.set(-12 + 11 * (t - 2.36), 0, 2); s.drv.face({ expr: 'neutral' });
    s.hero.pose(T.breathe3('handsInPockets', t)).face({ expr: 'neutral', t, blink: true, look: [-0.6, 0] });
    T.dolly(s.st.camera, t, [[0, { pos: [-15, 0.8, 10.5], look: [-5, 1.3, 1] }], [info.dur, { pos: [-13.5, 0.9, 10.2], look: [-3.5, 1.3, 1.5] }]]);
  },
});
registerShot('s006', {
  init(T) {
    const st = morning(T, { fov: V(30, 44), dof: { focus: 2.6, aperture: 0.006, maxblur: 0.01 } }); street(T, st, { focus: [2, -5] });
    const jake = st.add(T.character(JAKE).place(2.0, 0.15, -5.4, 0.1));
    const bok = T.FX3.bokeh(st, { area: [-6, 10, 1, 5, -12, -9] });
    return { st, jake, bok };
  },
  draw(s, t, info, T) {
    const blink = t > 2.1 && t < 2.35; s.bok.update(t);
    s.jake.pose(T.breathe3('relaxed', t, 1, 3)).face({ expr: 'neutral', blink, look: [-0.5, 0] });
    T.dolly(s.st.camera, t, [[0, { pos: [2.5, 1.5, -2.7], look: [2.0, 1.42, -5.4] }], [info.dur, { pos: [2.35, 1.48, -3.0], look: [2.0, 1.42, -5.4] }]]);
    s.st.focusOn(s.jake.headWorld());
  },
});
registerShot('s007', {
  init(T) {
    const st = morning(T, { fov: V(42, 58) }); street(T, st, { focus: [-3, 3] });
    const { car, drv } = makeCar(T, st);
    const hero = st.add(T.character(HERO).place(0.2, 0.15, 5.0, -1.2));
    const drops = T.FX3.frozen(st, { area: [-6, 2, 0.2, 2.2, 0.5, 5], c: '#ffe8c8', n: 140, size: [0.01, 0.03] });
    return { st, car, drv, hero, drops };
  },
  draw(s, t, info, T) {
    s.car.position.set(-6.2 + 0.12 * t, 0, 2); s.drv.face({ expr: 'neutral' }); s.drops.update(t);
    s.hero.pose(T.breathe3('handsInPockets', t)).face({ expr: 'smirk', t, look: [-0.4, 0] });
    T.dolly(s.st.camera, t, [[0, { pos: [-1.5, 0.9, 8.6], look: [-1.6, 1.1, 2.6] }], [info.dur, { pos: [-1.3, 0.95, 8.1], look: [-1.5, 1.15, 2.8] }]]);
  },
  overlay(g, t) { badge(g, clamp(t / 0.3)); },
});
registerShot('s008', {
  init(T) {
    const st = morning(T, { fov: V(40, 56) }); const set = street(T, st, { focus: [0, 0] });
    const { car, drv } = makeCar(T, st);
    const hero = st.add(T.character(HERO).place(0.5, 0.15, 4.4, Math.PI));
    const jake = st.add(T.character(JAKE).place(2.0, 0.15, -5.4, 0.1));
    const can = soda(T); hero.hold(can, 'L', { pos: [0, -0.1, 0.03] });
    const drops = T.FX3.frozen(st, { area: [-6, 4, 0.2, 2.4, -4, 5], c: '#ffe8c8', n: 160, size: [0.01, 0.03] });
    return { st, car, drv, hero, jake, can, drops };
  },
  draw(s, t, info, T) {
    s.car.position.set(-5.95 + 0.1 * t, 0, 2); s.drv.face({ expr: 'neutral' }); s.drops.update(t);
    s.jake.pose({ ...T.POSES3.relaxed }).face({ expr: 'neutral', blink: true });            // frozen mid-blink
    const k = clamp(t / 1.9), z = lerp(4.4, -5.75, ease.inOut(k)); s.hero.position.set(0.45, z < 4 && z > -4 ? 0 : 0.15, z);
    if (t < 1.9) s.hero.pose(T.walkPose3(t * Math.PI * 2 * 1.05)); else s.hero.pose(T.posesAt3(t - 1.9, [[0, 'reach'], [0.35, { ...T.POSES3.stand, armL: [70, 10, 95, 0], handL: 'fist' }]]));
    s.can.visible = t > 2.2;
    s.hero.face({ expr: t < 1.85 ? 'smirk' : 'happy', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [6.5, 3.4, 6.5], look: [0.3, 0.9, 1.2] }], [info.dur, { pos: [5.5, 2.8, -0.5], look: [0.4, 1.1, -5.0] }]]);
  },
  overlay(g) { badge(g); },
});
registerShot('s009', {
  init(T) {
    const st = morning(T, { fov: V(36, 52) }); street(T, st, { focus: [0, 4] });
    const { car, drv } = makeCar(T, st);
    const hero = st.add(T.character(HERO).place(0.6, 0.15, 5.0, 0.25));
    const can = soda(T); hero.hold(can, 'L', { pos: [0, -0.1, 0.03] });
    const lines = T.FX3.speedLines(st, { axis: 'x', dir: 1, around: [0, 1.0, 2], radius: [0.6, 1.6], length: [2, 5], speed: 70, c: '#ffffff', opacity: 0.35 });
    return { st, car, drv, hero, can, lines };
  },
  draw(s, t, info, T) {
    s.car.position.set(-6 + 30 * Math.max(0, t - 0.7), 0, 2); s.drv.face({ expr: 'neutral', look: [0.5, 0] }); s.lines.update(t); s.lines.obj.visible = t > 0.7 && t < 1.6;
    const sip = T.posesAt3(t, [[0, { ...T.POSES3.relaxed, armL: [70, 10, 100, 0], handL: 'fist' }], [2.2, { ...T.POSES3.relaxed, armL: [95, -15, 150, 0], handL: 'fist', head: [-12, 0, 0] }], [3.3, { ...T.POSES3.relaxed, armL: [70, 10, 100, 0], handL: 'fist' }]]);
    s.hero.pose(T.breathe3(sip, t)).face({ expr: t < 2.1 ? 'smug' : t < 3.2 ? 'happy' : 'smirk', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [2.2, 1.15, 9.2], look: [0.4, 1.35, 4.6] }], [info.dur, { pos: [1.8, 1.2, 8.4], look: [0.5, 1.4, 4.8] }]]);
    T.shake(s.st.camera, t, t > 0.75 && t < 1.35 ? 0.025 : 0.004);
  },
  mblur: 2,
});
