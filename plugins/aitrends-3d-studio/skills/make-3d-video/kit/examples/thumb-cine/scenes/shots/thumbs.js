// thumb-cine (2.1): cinematic thumbnail options, one registerShot per option (ids match story/shots.json). references/thumbnails.md
// Worked example: "What If You Could Borrow Your Friends' Strength?". Replace the shots; keep the order of calls inside draw().
// Render: node render.mjs --project examples/thumb-cine --thumbs   →   build/thumbs/<id>.jpg (1280×720), then node tools/thumb_sheet.mjs --project examples/thumb-cine
import { registerShot } from '/engine/core.js';
import { HERO, THEO, NORA, EXTRAS } from '../cast.js';
import { frameHead, placeAt, watch, heroLights, powerGlow } from '/engine/thumbcine.js';
const still = { t: 0, blink: false, saccade: false };   // a thumbnail is one frozen frame: no blinks, no eye darts

// A — golden hour, low angle, the sun behind the hero. No text: the picture tells it.
registerShot('A', {
  init(T) {
    const st = T.cine.stage(T, { look: 'goldenHour', sun: [-0.5, 0.34, -0.8], fov: 30, shadowSize: 16, rays: 1.1, faceLight: 0.7, dof: { focus: 2.6, aperture: 0.003, maxblur: 0.016 } });
    T.usa.highSchool(st, { name: 'WESTBROOK HIGH', season: 'fall' });
    const hero = st.add(T.character(HERO).place(0, 0, 6, 0.35)), theo = st.add(T.character(THEO)), nora = st.add(T.character(NORA));
    const tire = st.add(T.W.tractorTire({ s: 0.5 })); tire.userData.dynamic = true;
    const lights = heroLights(T, st, { rim: '#ffd9a0', rimPower: 30, fillPower: 5 });
    T.wx.motes(st, { area: [-3, 3, 0.3, 4, 3, 8], n: 260 }); T.wx.leaves(st, { area: [-8, 8, 0, 6, -2, 6], n: 110, wind: [0.9, 0, 0.4], t0: 4 });
    st.fitShadow([0, 0, 5], 14); return { st, T, hero, theo, nora, tire, lights };
  },
  draw(s, t, info, T) {
    s.hero.pose({ ...T.POSES3.confident, armR: { to: [-0.34, 2.05, 0.02] }, handR: 'open' }).face({ expr: 'smug', look: [0.35, -0.1], ...still });
    const h = s.hero.handWorld('R'); s.tire.position.set(h.x - 0.12, h.y + 0.36, h.z - 0.1); s.tire.rotation.set(-1.15, 0, 0.1);   // the rim rests on the palm, clear of the head
    frameHead(T, s.st, s.hero, { u: 0.34, v: 0.56, size: 0.38, yaw: 0.25, pitch: -0.2 });
    s.theo.pose('shocked'); placeAt(T, s.st, s.theo, { u: 0.71, size: 0.22, face: s.hero }); watch(s.theo, s.hero).face({ expr: 'shocked', ...still });
    s.nora.pose('handsOnHead'); placeAt(T, s.st, s.nora, { u: 0.9, size: 0.18, face: s.hero }); watch(s.nora, s.hero).face({ expr: 'awe', ...still });
    s.lights.aim(s.st, s.hero, { side: -1 });
  },
});

// B — wet night street, the hero lit by his own power, one label on the drained friend.
registerShot('B', {
  init(T) {
    const st = T.cine.stage(T, { look: 'rainNight', fov: 30, shadowSize: 18, faceLight: 0.75, dof: { focus: 2.6, aperture: 0.003, maxblur: 0.016 } });
    const ms = T.usa.mapleStreet(st, { season: 'fall', night: true, wet: true, lampColor: '#ffc27a' });
    T.W.mirror(st, { w: 220, d: 8, x: 0, z: 5, y: 0.005, strength: 0.7, blur: 0.9, res: 0.85 });
    const Y = 0.16, hero = st.add(T.character(HERO).place(0, Y, 0.4, 0.4)), theo = st.add(T.character(THEO)), kids = EXTRAS.map(o => st.add(T.character(o)));
    for (const l of ms.lamps) { if (Math.abs(l.position.x) > 24) continue; st.add(T.spot('#ffbe78', 150, { pos: [l.position.x, 6.3, 0.7], target: [l.position.x, 0, 1.6], angle: 0.75, penumbra: 0.9, dist: 22, shadow: false })); }
    const lights = heroLights(T, st, { rim: '#b4f02e', rimPower: 45, fill: '#ffe9c8', fillPower: 6 }), power = powerGlow(T, st, hero, { color: '#d8ff6a', intensity: 1.2, halo: 1.5 });
    T.wx.rain(st, { area: [-14, 14, 0, 10, -6, 10], n: 2200, wind: [2.0, 0, 0.5], len: 0.5, size: 0.014, opacity: 0.28 });
    st.fitShadow([0, 0, 1], 16); return { st, T, Y, hero, theo, kids, lights, power };
  },
  draw(s, t, info, T) {
    s.hero.pose('crossArms').face({ expr: 'smirk', look: [0.3, 0], ...still });
    frameHead(T, s.st, s.hero, { u: 0.64, v: 0.5, size: 0.42, yaw: -0.5, pitch: -0.14 });
    s.theo.pose('sad'); placeAt(T, s.st, s.theo, { u: 0.25, size: 0.24, ground: s.Y, face: s.hero }); watch(s.theo, s.hero).face({ expr: 'worried', ...still });
    s.kids.forEach((k, i) => { k.pose(['shocked', 'scared', 'handsOnHead'][i]); placeAt(T, s.st, k, { u: [0.07, 0.43, 0.94][i], size: [0.19, 0.2, 0.17][i], ground: s.Y, face: s.hero }); watch(k, s.hero).face({ expr: 'shocked', ...still }); });
    s.lights.aim(s.st, s.hero, { side: 1 }); s.power.update();
  },
  overlay(g, t, info, s) { s.T.thumb.tagOn(g, s.theo, s.st.camera, 'STR 0', { fg: '#ee3b2f', size: 54 }); },
});
