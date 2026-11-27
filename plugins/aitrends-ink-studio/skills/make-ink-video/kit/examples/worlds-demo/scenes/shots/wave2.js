// worlds-demo, wave 2 (0.2.7): things that break and burn, toy animals, sports venues and big crowds, screens in the world.
import { registerShot, clamp } from '/engine/core.js';
import { HERO, MAYA, SAM } from '../cast.js';
import { RIVAL, DAD, MOM, LITTLE_SIB } from '/channel/cast.js';
const lerpN = (a, b, k) => a + (b - a) * k;

registerShot('cut', {   // an energy blade slices a melon on a garden table: hot cut faces, sparks, a curl of smoke
  init(T) { const st = T.stage({ mood: 'dusk', fov: 30, fog: [14, 70], dof: { focus: 2.4, aperture: 0.004, maxblur: 0.008 } }); T.W.suburb(st, { lights: 1 });
    st.add(T.at(T.W.table({}), 0, 0, 0)); const melon = T.group(T.sphere(0.26, T.mat('#4f8a4a', { rough: 0.5 }), 0, 0, 0, 28, 18)); melon.children[0].scale.set(1, 0.88, 1.2); melon.position.set(0, 1.0, 0); st.add(melon);
    const cut = T.FX3.slice(st, melon, { t0: 1.0, normal: [1, 0, 0.2], gap: 0.16, tilt: 0.3, capColor: '#e8505a', glow: '#ff6a3a' });
    T.FX3.sparks(st, { pos: [0.05, 1.22, 0], t0: 0.95, dur: 0.25, dir: [0.3, 1, 0.4], rate: 140 }); T.FX3.smoke(st, { pos: [0, 1.1, 0], t0: 1.1, dur: 1.6, rate: 5, size: 0.25, opacity: 0.25 });
    const hero = st.add(T.character(HERO).place(-0.75, 0, 0.45, 1.2)); const b = T.FX3.blade({}); hero.hold(b, 'R', { rot: [Math.PI, 0, 0] }); return { st, hero, b, cut }; },
  draw(s, t, info, T) { const sw = T.ease.inOut(clamp((t - 0.75) / 0.3)); s.hero.pose(T.idle3({ ...T.POSES3.stand, armR: [lerpN(150, 40, sw), 10, 20, 0], handR: 'fist' }, t)).face({ expr: [[0, 'determined'], [1.3, 'smug']], t, blink: true }); s.b.update(t);
    T.dolly(s.st.camera, t, [[0, { pos: [1.5, 1.55, 3.4], look: [-0.35, 1.15, 0] }], [3, { pos: [1.3, 1.5, 3.1], look: [-0.35, 1.15, 0] }]]); T.punch(s.st.camera, t, 1.0, { amp: 0.6 }); },
});
registerShot('smash', {   // a wall bursts: debris tumbles and settles, dust hangs
  init(T) { const st = T.stage({ mood: 'day', fov: 40, fog: [20, 90] }); T.W.city(st, { lights: 0, moon: false, stars: false });
    const wall = st.add(T.at(T.group(T.box(3, 2.4, 0.4, '#b8a8a0')), 0, 1.2, -1)); wall.userData.dynamic = true; T.FX3.debris(st, { pos: [0, 1.2, -0.7], t0: 0.6, n: 34, colors: ['#b8a8a0', '#9a8a84', '#c8bcb4'] }); T.FX3.smoke(st, { pos: [0, 0.4, -0.5], t0: 0.6, dur: 0.8, rate: 14, size: 0.6, grow: 3, rise: 0.4, spread: 0.8, color: '#c8bcb4', opacity: 0.3 });
    const sam = st.add(T.character(SAM).place(1.6, 0.15, 2.4, -0.6)); return { st, sam, wall }; },
  draw(s, t, info, T) { s.wall.visible = t < 0.6; s.sam.pose(T.idle3('shocked', t)).face({ expr: [[0, 'neutral'], [0.7, 'shocked']], t, blink: true }); T.dolly(s.st.camera, t, [[0, { pos: [2.4, 1.4, 7], look: [0.4, 1.0, 0] }], [3, { pos: [2.0, 1.3, 6.4], look: [0.4, 1.0, 0] }]]); T.punch(s.st.camera, t, 0.6, { amp: 1 }); },
});
registerShot('splash', {   // a pool: a cannonball splash, a swimmer half in the water
  init(T) { const st = T.stage({ mood: 'beach', fov: 40, fog: [25, 120] }); const p = T.W.pool(st, {}); T.FX3.splash(st, { pos: [1.5, 0, p.laneZ(2)], t0: 0.4, size: 1.3 });
    const hero = st.add(T.character(HERO).place(-2, -0.95, p.laneZ(3), 0.6)); const maya = st.add(T.character(MAYA).place(-3, 0.1, -7.6, 0.3)); return { st, hero, maya, p }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('wave', t)).face({ expr: 'joy', t, blink: true }); s.maya.pose(T.idle3('cheer', t, { seed: 2 })).face({ expr: 'happy', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [-6, 2.4, 9], look: [0, -0.2, 0] }], [3, { pos: [-5.4, 2.2, 8.4], look: [0, -0.2, 0] }]]); },
});
registerShot('farm2', {   // toy animals on the farm
  init(T) { const st = T.stage({ mood: 'day', fov: 38, fog: [30, 160], shadowSize: 16 }); T.W.farm(st, {});
    const A = { cow: st.add(T.at(T.W.cow(), -2.4, 0, -1.5, 0.5)), sheep: st.add(T.at(T.W.sheep(), 1.6, 0, -0.8, -0.6)), pig: st.add(T.at(T.W.pig(), 0.4, 0, 0.6, 0.2)), dog: st.add(T.at(T.W.dog(), -0.8, 0, 2.0, 1.2)), cat: st.add(T.at(T.W.cat(), 2.4, 0, 1.8, -1.0)), bird: st.add(T.at(T.W.bird(), 0.9, 1.15, -4.04, 0.4)) };
    const hero = st.add(T.character(HERO).place(-0.2, 0, 2.6, 0)); return { st, A, hero }; },
  draw(s, t, info, T) { const A = s.A; A.cow.position.x = -2.4 + t * 0.25; A.cow.update(t, { walk: 1, look: 0.3 }); A.sheep.update(t, { look: -0.4 }); A.pig.update(t, {}); A.dog.update(t, { wag: 0.8, look: Math.sin(t) * 0.3 }); A.cat.update(t, { look: 0.5 }); A.bird.update(t, {});
    s.hero.pose(T.idle3('handsOnHips', t)).face({ expr: 'deadpan', t, blink: true }); T.dolly(s.st.camera, t, [[0, { pos: [0.6, 1.6, 8.5], look: [0, 0.7, 0] }], [3, { pos: [0.3, 1.5, 7.8], look: [0, 0.7, 0] }]]); },
});
registerShot('critters', {   // beach crab, a bee, the hero crouching
  init(T) { const st = T.stage({ mood: 'beach', fov: 30, fog: [25, 140], dof: { focus: 2.5, aperture: 0.003, maxblur: 0.006 } }); const b = T.W.beach(st, { seed: 9 });
    const crab = st.add(T.at(T.W.crab(), 0.2, b.heightAt(0.2, 1), 1, 0.3)); const bee = st.add(T.at(T.W.bee(), -0.5, 1.0, 0.6, 0.8)); const hero = st.add(T.character(HERO).place(-0.9, b.heightAt(-0.9, 0.2), 0.2, 0.6)); return { st, crab, bee, hero, b }; },
  draw(s, t, info, T) { s.crab.position.x = 0.2 + Math.sin(t * 1.2) * 0.25; s.crab.update(t, { walk: 1, snap: true }); s.bee.update(t); s.bee.position.set(-0.5 + Math.sin(t * 1.5) * 0.3, 1.05 + Math.sin(t * 2.2) * 0.1, 0.7); s.hero.pose(T.idle3({ ...T.POSES3.crouch }, t)).face({ expr: 'unimpressed', t, blink: true, look: [0.3, -0.6] });
    T.dolly(s.st.camera, t, [[0, { pos: [0.9, 0.9, 3.4], look: [0, 0.5, 0.5] }], [3, { pos: [0.7, 0.85, 3.1], look: [0, 0.5, 0.5] }]]); s.st.focusOn([0.2, 0.3, 1]); },
});
registerShot('stadium', {   // night stadium, 5,000 people, the hero alone on the pitch
  init(T) { const st = T.stage({ mood: 'night', fov: 40, fog: [60, 260], shadowSize: 30, keyIntensity: 2.6 }); T.W.stadium(st, { n: 5000, cheer: 0.5 });
    const hero = st.add(T.character(HERO).place(0, 0, 8, 0)); hero.userData.hud = { name: 'YOU', level: 99, hp: 1 }; return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('fistPump', t)).face({ expr: 'smug', t, blink: true }); T.dolly(s.st.camera, t, [[0, { pos: [2.4, 1.7, 14.5], look: [0, 4, -30] }], [3, { pos: [1.8, 1.6, 13.6], look: [0, 4, -30] }]]); },
});
registerShot('ring', {   // boxing ring under spotlights, the HUD on both fighters
  init(T) { const st = T.stage({ mood: 'night', fov: 36, fog: [10, 60], ambient: 0.6 }); const r = T.W.boxingRing(st, { crowd: 800 });
    const hero = st.add(T.character(HERO).place(-0.9, r.top, 0.3, 1.0)); const rv = st.add(T.character(RIVAL).place(0.9, r.top, -0.2, -1.2)); hero.userData.hud = { name: 'YOU', level: 99, hp: 0.95 }; rv.userData.hud = { name: 'MARCUS', level: 24, hp: [[0, 0.8], [1.6, 0.8], [2.2, 0.3]] }; return { st, hero, rv }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3(t > 1.5 ? 'punch' : 'fight', t)).face({ expr: 'deadpan', t, blink: true }); s.rv.pose(T.idle3('fight', t, { seed: 3 })).face({ expr: [[0, 'angry'], [1.6, 'shocked']], t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [0.4, 3.3, 6.6], look: [0, 2.1, 0] }], [3, { pos: [0.2, 3.2, 6.1], look: [0, 2.1, 0] }]]); },
});
registerShot('race', {   // running track + a results board
  init(T) { const st = T.stage({ mood: 'golden', fov: 38, fog: [30, 160] }); const tr = T.W.track(st, { crowd: 900 });
    const sb = st.add(T.at(T.W.scoreboard3d({ title: 'FINAL · HEAT 1', timer: '0:24', rows: [['1', 'YOU', '9.12', true, '#b4f02e'], ['2', 'REYES', '10.20'], ['3', 'OKAFOR', '11.40'], ['4', 'LIND', '11.75']], t0: 0.3 }), 9, 0, -4, -0.45));
    const hero = st.add(T.character(HERO).place(0, 0.01, tr.laneZ(2), Math.PI / 2)); return { st, hero, sb }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('cheer', t)).face({ expr: 'smug', t, blink: true }); T.dolly(s.st.camera, t, [[0, { pos: [-4, 1.7, 10], look: [6, 3.2, -3] }], [3, { pos: [-3.4, 1.6, 9.4], look: [6, 3.2, -3] }]]); },
});
registerShot('army', {   // a field of clones from above
  init(T) { const st = T.stage({ mood: 'day', fov: 40, fog: [40, 170], shadowSize: 20 }); T.W.park(st, { lights: 0, trees: 30 });
    T.W.formation(st, { cols: 18, rows: 12, gap: 1.0, pos: [0, -2], colors: ['#b4f02e'], hairColors: ['#e8ecf6'], same: true, cheer: 0.15 });
    const hero = st.add(T.character(HERO).place(0, 0, 1.5, 0)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('pointUp', t)).face({ expr: 'smug', t, blink: true }); T.dolly(s.st.camera, t, [[0, { pos: [0, 14, 12], look: [0, 0, -6] }], [3, { pos: [0, 12.5, 10.5], look: [0, 0, -6] }]]); },
});
registerShot('news', {   // the family watches a wall of news about the hero
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 40, fog: [8, 30] }); T.W.room(st, { kind: 'living', w: 8, d: 7 });
    T.W.newsWall(st, { pos: [0, 0, -3.3], cols: 3, rows: 2, w: 1.5, y: 1.0, items: [{ tag: 'BREAKING', text: 'TEEN CUTS CAR IN HALF' }, { tag: 'LIVE', text: 'EXPERTS STUNNED' }, { tag: 'VIRAL', text: '10,000,000 VIEWS' }, { tag: 'WORLD', text: 'LEADERS REACT' }, { tag: 'SCIENCE', text: '"NO EXPLANATION"' }, { tag: 'TECH', text: 'WHAT IS IT MADE OF?' }] });
    const dad = st.add(T.character(DAD).place(-1, 0, 0.8, Math.PI)); const mom = st.add(T.character(MOM).place(0.2, 0, 1.0, Math.PI)); const kid = st.add(T.character(LITTLE_SIB).place(1.2, 0, 0.7, Math.PI + 0.2)); return { st, dad, mom, kid }; },
  draw(s, t, info, T) { [s.dad, s.mom, s.kid].forEach((c, i) => c.pose(T.idle3(i === 2 ? 'pointUp' : 'stand', t, { seed: i + 2 }))); T.dolly(s.st.camera, t, [[0, { pos: [0.4, 1.55, 3.6], look: [0, 1.65, -3.3] }], [3, { pos: [0.2, 1.5, 3.2], look: [0, 1.65, -3.3] }]]); },
});
registerShot('billboard', {   // a roadside billboard in town
  init(T) { const st = T.stage({ mood: 'golden', fov: 38, fog: [25, 120] }); T.W.suburb(st, { lights: 0 });
    st.add(T.at(T.W.billboard({ title: 'BURGERS', sub: '100% PLANT · ZERO COWS', icon: 'leaf', color: '#3a8a4a' }), 2, 0, -5, -0.35)); const hero = st.add(T.character(HERO).place(-1.6, 0, 2, 0.6)); return { st, hero }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('point', t)).face({ expr: 'unimpressed', t, blink: true }); T.dolly(s.st.camera, t, [[0, { pos: [-4, 1.3, 7], look: [1.4, 4.2, -5] }], [3, { pos: [-3.6, 1.25, 6.5], look: [1.4, 4.2, -5] }]]); },
});
registerShot('feed', {   // a phone close-up: the view count climbs
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 22, fog: [3, 20], dof: { focus: 0.6, aperture: 0.01, maxblur: 0.01 } }); T.W.room(st, { kind: 'bedroom', w: 6, d: 6 });
    const ph = T.W.phone({ draw: T.W.feedDraw({ title: 'WILL IT CUT? A CAR', user: 'you', views: [1200, 10000000], t0: 0.3, dur: 2.4 }) }); ph.position.set(0, 1.2, 1.2); ph.rotation.x = -0.15; st.add(ph); T.FX3.glowLight(ph, { color: '#c8b8ff', intensity: 1.5, dist: 1.5 }); return { st, ph }; },
  draw(s, t, info, T) { s.ph.screen.update(t); s.ph.rotation.y = 0.08 * Math.sin(t * 0.6); T.dolly(s.st.camera, t, [[0, { pos: [0.05, 1.24, 1.6], look: [0, 1.2, 1.2] }], [3, { pos: [0.03, 1.22, 1.52], look: [0, 1.2, 1.2] }]]); s.st.focusOn(s.ph); },
});
