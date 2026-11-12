// v2-demo (2.0): one American street, three weathers. T.cine.stage (sky, sun, AO, haze, god rays, lens), T.usa.mapleStreet, T.wx.*
import { registerShot, clamp, ease } from '/engine/core.js';
import { HERO, MIA } from '../cast.js';
const PI = Math.PI, Y = 0.16;   // sidewalk height

registerShot('golden', {
  init(T) { const st = T.cine.stage(T, { look: 'goldenHour', sun: [-0.955, 0.13, -0.26], fov: 34, shadowSize: 30 });
    const ms = T.usa.mapleStreet(st, { season: 'fall' });
    const hero = st.add(T.character(HERO).place(0, Y, 0.35, 0.25)), mia = st.add(T.character(MIA));
    const sign = st.add(T.usa.busStopSign()); sign.position.set(0.95, Y, -0.55);
    const bus = st.add(T.W.schoolBus({ door: 0 })); bus.userData.dynamic = true;
    { const dk = T.mat('#16181e', { rough: 0.25, metal: 0.5 }), ws = T.box(0.04, 0.8, 2.2, dk, 4.52, 2.25, 0), gr = T.box(0.04, 0.55, 1.7, T.mat('#1e1a22'), 6.02, 1.15, 0), cap = T.box(0.05, 0.3, 1.6, T.mat('#1e1a22'), 4.53, 2.76, 0); bus.add(ws, gr, cap);
      for (const z of [-0.95, 0.95]) { const hl = new T.THREE.Mesh(new T.THREE.SphereGeometry(0.13, 12, 8), T.glowMat('#fff2c8', 3)); hl.position.set(6.03, 1.2, z); bus.add(hl); const am = new T.THREE.Mesh(new T.THREE.SphereGeometry(0.09, 10, 8), T.glowMat('#ffa030', 2.5)); am.position.set(4.55, 2.78, z * 1.05); bus.add(am); } }
    T.wx.leaves(st, { area: [-16, 12, 0, 9, -5, 8], n: 320, colors: ['#c8442a', '#e8862a', '#f4c040', '#a8381a'], wind: [1.3, 0, 0.5] });
    T.wx.motes(st, { area: [-8, 8, 0.3, 5, -3, 6], n: 260 });
    st.fitShadow([-4, 0, 0], 26); return { st, ms, hero, mia, bus }; },
  draw(s, t, info, T) {
    s.hero.pose(T.idle3('stand', t)).face({ expr: [[0, 'neutral'], [2.6, 'smile']], t, blink: true, look: [-0.5, 0.05] });
    s.mia.pose(T.walkTo(s.mia, t, { from: [-6.5, 0.1], to: [-1.1, 0.25], t0: 0, t1: 4.2, y: Y, yaw1: 0.9 })); s.mia.position.y = Y; s.mia.face({ expr: 'smile', t, blink: true });
    s.bus.position.set(-90 + 50 * ease.out(clamp(t / 4.6)), 0, 3.2);
    T.dolly(s.st.camera, t, [[0, { pos: [15, 2.6, 4.9], look: [-30, 3.6, 4.2], fov: 34 }], [4.6, { pos: [6.0, 1.3, 3.5], look: [-3.5, 1.5, 0.2], fov: 34 }]]); },
});

registerShot('close', {
  init(T) { const st = T.cine.stage(T, { look: 'goldenHour', sun: [-0.5, 0.2, -0.84], fov: 30, shadowSize: 14, dof: { focus: 2.8, aperture: 0.0011, maxblur: 0.008 }, rays: 0.6 });
    T.usa.mapleStreet(st, { season: 'fall' });
    const hero = st.add(T.character(HERO).place(0, Y, 0.35, 0.3));
    T.wx.leaves(st, { area: [-7, 7, 0, 6, -6, 0.2], n: 170, wind: [0.9, 0, 0.5], t0: 4 }); T.wx.motes(st, { area: [-3, 3, 0.6, 3, -1, 3], n: 120 });
    st.fitShadow([0, 0, 0], 14); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('confident', t)).face({ expr: [[0, 'smile'], [1.3, 'determined']], t, blink: true, look: [-0.3, 0.15] });
    const h = s.hero.headWorld(); T.dolly(s.st.camera, t, [[0, { pos: [h.x + 1.5, h.y - 0.2, h.z + 2.9], look: [h.x + 0.1, h.y - 0.1, h.z] }], [2.8, { pos: [h.x + 1.2, h.y - 0.16, h.z + 2.5], look: [h.x + 0.1, h.y - 0.1, h.z] }]]); s.st.focusOn(h); },
});

registerShot('rain', {
  init(T) { const st = T.cine.stage(T, { look: 'rainNight', fov: 34, shadowSize: 20, faceLight: 0.5 });
    const ms = T.usa.mapleStreet(st, { season: 'fall', night: true, wet: true, lampColor: '#ffc27a' });
    T.W.mirror(st, { w: 220, d: 8, x: 0, z: 5, y: 0.005, strength: 0.7, blur: 0.9, res: 0.85 });
    const hero = st.add(T.character(HERO));
    for (const l of ms.lamps) { if (Math.abs(l.position.x) > 40) continue; const sp = T.spot('#ffbe78', 150, { pos: [l.position.x, 6.3, 0.7], target: [l.position.x, 0, 1.6], angle: 0.75, penumbra: 0.9, dist: 22, shadow: Math.abs(l.position.x) < 10 }); st.add(sp); }
    const car = st.add(T.W.car({ type: 'suv', color: '#7a1f24', headlights: 22, lights: false })); car.userData.dynamic = true; for (const sx of [-0.6, 0.6]) { const gl = T.glow('#fff0d0', 0.9, 0.55); gl.position.set(sx, 1.0, 2.5); car.add(gl); }
    T.wx.rain(st, { area: [-16, 16, 0, 11, -8, 12], n: 3000, wind: [2.2, 0, 0.5], len: 0.5, size: 0.014, opacity: 0.3 });
    st.fitShadow([0, 0, 1], 18); return { st, hero, car }; },
  draw(s, t, info, T) {
    s.hero.pose(T.walkTo(s.hero, t, { from: [-13, 0.2], to: [-6, 0.3], t0: -0.5, t1: 4.6, y: Y })); s.hero.position.y = Y; s.hero.face({ expr: 'determined', t, blink: true });
    s.car.position.set(-64 + 8 * t, 0.0, 6.8); s.car.rotation.y = PI / 2;
    const hx = s.hero.position.x; T.dolly(s.st.camera, t, [[0, { pos: [hx + 6.6, 1.25, 4.4], look: [hx - 2.5, 1.5, 1.2], fov: 34 }], [4, { pos: [hx + 5.6, 1.2, 4.0], look: [hx - 2.2, 1.45, 1.1], fov: 34 }]]); },
});

registerShot('snow', {
  init(T) { const st = T.cine.stage(T, { look: 'snowDusk', sun: [-0.8, 0.15, -0.58], fov: 34, shadowSize: 24 });
    const ms = T.usa.mapleStreet(st, { season: 'winter' });
    for (const run of ms.xmasRuns) st.add(T.W.stringLights({ from: run[0], to: run[1], n: 12, sag: 0.12, colors: ['#ff5a4a', '#ffd24a', '#5ad27a', '#5aa8ff'], lights: 0, size: 0.05 }));
    const hero = st.add(T.character(HERO).place(0.2, Y, 0.3, 0.5)), mia = st.add(T.character(MIA).place(-0.75, Y, 0.45, 0.75));
    const sp = T.spot('#ffc890', 90, { pos: [-20, 6.3, 0.7], target: [-20, 0, 1.6], angle: 0.8, penumbra: 0.9, dist: 22, shadow: false }); st.add(sp);
    T.wx.snow(st, { area: [-20, 14, 0, 12, -14, 10] });
    st.fitShadow([-3, 0, 0], 24); return { st, hero, mia }; },
  draw(s, t, info, T) {
    s.hero.pose(T.idle3('stand', t)).face({ expr: [[0, 'neutral'], [1.2, 'smile']], t, blink: true, look: [-0.2, 0.5] }); s.mia.pose(T.idle3('relaxed', t, { seed: 4 })).face({ expr: 'smile', t, blink: true, look: [0.1, 0.5] });
    T.dolly(s.st.camera, t, [[0, { pos: [5.6, 1.0, 5.4], look: [-3, 2.2, -1.5], fov: 34 }], [3.6, { pos: [4.4, 1.15, 4.2], look: [-2.6, 2.0, -1.5], fov: 34 }]]); },
});
