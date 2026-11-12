// engine/home15.js — 1.0.5 home sets promoted from past videos (exposed as T.W.* through world3d.js). Five videos each rebuilt a
// bedroom, four a kitchen, four a close-up phone stage; these are the ready-made versions with the anchors those videos needed.
// Seats are [x, z, yaw, seatY] for T.act.sitOn / pose 'sit'; tops are [x, y, z].
//
//   const b = T.W.teenBedroom(st, { night, wall, bed, poster, skate })   // bed against the back-left wall, desk + lamp + chair on the
//                                       // right, window, rug, poster; b.bedTop [x, y, z] (sit), b.lieAt [x, y, z] (pose 'lie'),
//                                       // b.chair [x, z, yaw, seatY] at the desk, b.desk [x, y, z] desk top, b.door [x, 0, z], b.lamp
//   const k = T.W.homeKitchen(st, { night, seats: 2 | 4, plates, wall }) // counter + cabinets, fridge, dining table under a warm
//                                       // pendant; k.seat(i) [x, z, yaw, seatY], k.table [x, y, z] top, k.fridge [x, z, yaw] stand spot,
//                                       // k.counter [x, z, yaw] stand spot (facing the counter), k.photo [x, y, z] on the fridge side
//   const l = T.W.livingRoom(st, { night, tv: drawFn, sofa })            // sofa facing a wall TV that lights the room; l.sofa(i)
//                                       // [x, z, yaw, seatY] (i 0..2), l.tv (the screen group: l.tv.screen.update(t)), l.stand [x, z, yaw]
//   const p = T.W.phoneClose(st, { draw, feed, tilt })                   // a phone held in front of a dark bedroom (the "look at the
//                                       // screen" insert): p.phone (p.phone.screen.update(t)); frame from z ≈ 1.75 with fov 22–28
//   T.W.ambulance() / T.W.fireTruck()   // vehicles, front = +x, light bar g.bar (pulse its emissive), stand on y 0
//   T.W.ladder({ h }) · T.W.skateboard({ deck, grip }) · T.W.cake({ candles, icing })
import * as THREE from 'three';
import { mat, box, rbox, cyl, plane, group, at, lamp, glow, glowMat, textTex, contactShadow, screen } from './kit3d.js';
import { room, table, chair, fridge, ceilingLamp, sofa, poster, phone, rug, plant } from './world3d.js';
import { feedDraw } from './screens3d.js';
import { glowLight } from './fx3d.js';

const PI = Math.PI, H = PI / 2, SEAT = 0.42;
const put = (st, obj, x, z, yaw = 0, y = 0, shadow = true) => { obj.position.set(x, y, z); obj.rotation.y = yaw; st.add(obj); if (shadow && y === 0) st.add(contactShadow(obj)); return obj; };

// ---------------------------------------------------------------- props
export function skateboard(o = {}) {
  const g = group(rbox(0.82, 0.025, 0.22, 0.012, mat(o.deck || '#2c3e6e', { rough: 0.6 }), 0, 0.075, 0), box(0.7, 0.004, 0.2, mat(o.grip || '#b4f02e', { rough: 0.9 }), 0, 0.09, 0));
  for (const x of [-0.27, 0.27]) for (const z of [-0.08, 0.08]) { const w = cyl(0.032, 0.032, 0.035, mat('#f2e6c8'), x, 0.032, z, 12); w.rotation.x = H; g.add(w); }
  return g;
}
export function cake(o = {}) {
  const n = o.candles ?? 6, ic = o.icing || '#d84a7a';
  const g = group(cyl(0.18, 0.18, 0.16, mat('#f4e8f0', { rough: 0.6 }), 0, 0.08, 0, 24), cyl(0.185, 0.185, 0.03, mat(ic, { keepSat: true }), 0, 0.15, 0, 24), cyl(0.22, 0.22, 0.01, mat('#e8e8ee', { metal: 0.4 }), 0, 0.005, 0, 24));
  for (let i = 0; i < n; i++) { const a = i / n * PI * 2, r = n > 1 ? 0.1 : 0; g.add(cyl(0.008, 0.008, 0.08, mat('#5ad8c8', { keepSat: true }), Math.cos(a) * r, 0.2, Math.sin(a) * r, 6), at(glow('#ffd27a', 0.6, 0.05), Math.cos(a) * r, 0.26, Math.sin(a) * r)); }
  return g;
}
export function ladder(o = {}) {
  const h = o.h || 4.2, al = mat(o.color || '#c8ccd4', { metal: 0.7, rough: 0.3 }), g = group(box(0.06, h, 0.06, al, -0.25, h / 2, 0), box(0.06, h, 0.06, al, 0.25, h / 2, 0));
  for (let y = 0.3; y < h; y += 0.32) g.add(box(0.5, 0.04, 0.05, al, 0, y, 0)); return g;
}
const wheels = (g, list, r, wd) => { const blk = mat('#1e1a22'); for (const [x, z] of list) { const w = cyl(r, r, wd, blk, x, r, z, 16); w.rotation.x = H; g.add(w); g.add(at(cyl(r * 0.5, r * 0.5, wd + 0.02, mat('#b8bcc4', { metal: 0.6 }), 0, 0, 0, 12), x, r, z).rotateX(H)); } };
export function ambulance(o = {}) {
  const wM = mat('#e8e8ee', { rough: 0.5 }), red = mat('#c83a3a', { keepSat: true }), glass = mat('#2a3448', { rough: 0.1, metal: 0.3 });
  const g = group(rbox(5.4, 2.3, 2.3, 0.15, wM, 0, 1.55, 0), box(5.42, 0.3, 2.32, red, 0, 1.4, 0), rbox(1.4, 1.5, 2.2, 0.15, wM, 3.2, 1.15, 0), box(1.0, 0.8, 2.22, glass, 3.45, 1.55, 0));
  wheels(g, [[-1.8, 1.15], [-1.8, -1.15], [3.0, 1.15], [3.0, -1.15]], 0.45, 0.3);
  const bar = box(0.9, 0.14, 1.2, glowMat('#ff3a4a', 2.2), 2.9, 2.0, 0); g.add(bar); g.bar = bar;
  for (const z of [1.16, -1.16]) { const cr = plane(0.7, 0.7, mat('#ffffff', { map: textTex('+', { w: 128, h: 128, bg: '#e8e8ee', color: '#c83a3a', size: 140, font: 'Nunito' }) }), -0.5, 1.9, z); if (z < 0) cr.rotation.y = PI; g.add(cr); }
  g.userData.dynamic = true; return g;
}
export function fireTruck(o = {}) {
  const red = mat(o.color || '#b8302e', { keepSat: true, rough: 0.45 }), chrome = mat('#c8c8d0', { metal: 0.8, rough: 0.2 });
  const g = group(rbox(7.5, 2.0, 2.4, 0.12, red, 0, 1.45, 0), rbox(2.0, 2.4, 2.4, 0.12, red, 4.4, 1.6, 0), box(1.2, 0.9, 2.42, mat('#2a3448', { rough: 0.1, metal: 0.3 }), 4.8, 2.2, 0),
    box(6.5, 0.12, 0.6, chrome, -0.4, 2.6, 0.5), box(6.5, 0.12, 0.6, chrome, -0.4, 2.6, -0.5), box(7.52, 0.12, 2.42, mat('#f0e6c8'), 0, 1.1, 0));
  wheels(g, [[-2.6, 1.2], [-2.6, -1.2], [-1.4, 1.2], [-1.4, -1.2], [4.2, 1.2], [4.2, -1.2]], 0.5, 0.32);
  const bar = box(0.8, 0.14, 1.4, glowMat('#ff3a3a', 2.2), 4.4, 2.9, 0); g.add(bar); g.bar = bar; g.userData.dynamic = true; return g;
}

// ---------------------------------------------------------------- sets
export function teenBedroom(st, o = {}) {
  const night = o.night ?? true, w = 7, d = 6;
  const r = room(st, { kind: 'bedroom', w, d, window: 'back', windowX: 0.9, view: night ? 'night' : 'day', windowLight: night ? 10 : 24,
    wall: o.wall || (night ? '#3e3858' : '#7a6478'), floor: o.floor || '#6a4c48', curtain: o.curtain || '#2c3e6e', bedColor: o.bed || '#3f6a58', rugColor: o.rug || '#5a3a5a' });
  put(st, poster({ text: o.poster || 'SKATE', c1: '#b4f02e', c2: '#2c3e6e' }), w / 2 - 0.02, -1.2, -H, 1.75, false);
  if (o.skate !== false) put(st, skateboard({}), 2.9, 0.6, 0.5);
  const L = lamp('#ffcf8a', night ? 2.5 : 1.2, 4); L.position.set(-1.2, 1.4, -1.0); st.add(L);
  // T.W.room's bedroom: bed at (-w/2+1.1, backZ+1.3), desk at (w/2-1, backZ+0.5), chair at (w/2-1.1, backZ+1.2) facing the desk
  const bz = -d / 2 + 1.3, bx = -w / 2 + 1.1;
  return { ...r, bedTop: [bx, 0.64, bz], lieAt: [bx, 0.52, bz + 0.15], desk: [w / 2 - 1.0, 0.76, -d / 2 + 0.5], chair: [w / 2 - 1.1, -d / 2 + 1.2, PI, SEAT],
    door: [2.2, 0, 2.6], lamp: L };
}
export function homeKitchen(st, o = {}) {
  const night = o.night ?? true, w = 7, d = 6, wood = o.table || '#8a5a3a';
  const r = room(st, { kind: 'empty', w, d, wall: o.wall || '#7a6a5a', floor: o.floor || '#a88068', window: 'back', windowX: 1.4, view: night ? 'night' : 'day', windowLight: night ? 8 : 22, curtain: o.curtain || '#3f6a58' });
  // counter run with upper cabinets along the back wall, left of the window; fridge on the left wall
  const base = mat(o.cabinet || '#5a4a5a'), top = mat('#e8e2da', { rough: 0.25 });
  st.add(box(3.2, 0.88, 0.62, base, -1.6, 0.44, -d / 2 + 0.33), box(3.24, 0.05, 0.66, top, -1.6, 0.905, -d / 2 + 0.33));
  for (let i = 0; i < 3; i++) st.add(box(0.95, 0.7, 0.35, base, -2.65 + i * 1.05, 1.95, -d / 2 + 0.18));
  st.add(box(0.5, 0.02, 0.36, mat('#c8ccd4', { metal: 0.7, rough: 0.2 }), -1.2, 0.93, -d / 2 + 0.35));   // sink
  put(st, fridge({ color: '#e8e4dc' }), -w / 2 + 0.5, -1.6, H);
  // dining table + chairs, plates, pendant
  const tz = 0.6, seats = o.seats ?? 2; put(st, table({ w: 1.5, d: 0.9, h: 0.76, color: wood }), 0, tz);
  const S = [[-1.05, tz, H], [1.05, tz, -H], [-0.4, tz - 0.85, 0], [0.4, tz - 0.85, 0]].slice(0, Math.max(1, Math.min(4, seats)));
  for (const [x, z, yaw] of S) put(st, chair({ color: '#6a4a36' }), x, z, yaw);
  if (o.plates !== false) for (const [x, z] of S) st.add(cyl(0.13, 0.11, 0.03, mat('#e8e4dc'), x * 0.42, 0.79, tz + (z - tz) * 0.45, 20));
  const pend = ceilingLamp({ intensity: night ? 6 : 3, color: '#ffd8a0' }); pend.position.set(0, 2.6, tz); st.add(pend);
  return { ...r, table: [0, 0.78, tz], seat: (i) => { const s = S[i % S.length]; return [s[0], s[1], s[2], SEAT]; }, fridge: [-w / 2 + 1.35, -1.6, -H],
    counter: [-1.6, -d / 2 + 1.05, PI], photo: [-w / 2 + 0.88, 1.45, -1.6], pendant: pend };
}
export function livingRoom(st, o = {}) {
  const night = o.night ?? true, w = 8, d = 6.5;
  const r = room(st, { kind: 'empty', w, d, wall: o.wall || '#5a4a5a', floor: o.floor || '#7a5a4a', window: 'left', view: night ? 'night' : 'day', windowLight: night ? 6 : 18, curtain: o.curtain || '#3f6a58' });
  // TV on the back wall, sofa facing it near the camera side, coffee table between
  const tv = new THREE.Group(); tv.add(rbox(2.12, 1.26, 0.08, 0.03, mat('#121018'), 0, 0, 0));
  const scr = o.tv ? screen(2.0, 1.15, o.tv, { px: 512, power: 1.3 }) : new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.15), glowMat('#3a5ab0', 1.0));
  scr.position.z = 0.045; tv.add(scr); tv.screen = scr; tv.position.set(0, 1.45, -d / 2 + 0.06); tv.userData.dynamic = true; st.add(tv);
  put(st, box(2.6, 0.5, 0.45, mat('#3a2c30'), 0, 0.25, 0), 0, -d / 2 + 0.3);   // TV stand
  const sz = 1.2; put(st, sofa({ color: o.sofa || '#7a3a4a' }), 0, sz, PI);
  put(st, table({ w: 1.1, d: 0.55, h: 0.42, color: '#3a2a2a' }), 0, -0.3); put(st, rug({ r: 1.8 }), 0, -0.2, 0, 0, false); put(st, plant({}), w / 2 - 0.5, -d / 2 + 0.5);
  glowLight(tv, { color: '#a8c0ff', intensity: night ? 2.0 : 0.8, dist: 4 });
  return { ...r, tv, sofa: (i) => [(i - 1) * 0.62, sz - 0.05, PI, SEAT], stand: [1.8, -0.6, PI * 0.85] };
}
export function phoneClose(st, o = {}) {
  room(st, { kind: 'bedroom', w: 6, d: 6, view: 'night' });
  const ph = phone({ draw: o.feed ? feedDraw(o.feed) : o.draw }); ph.position.set(0, 1.2, 1.2); ph.rotation.x = o.tilt ?? -0.15; ph.userData.dynamic = true; st.add(ph);
  glowLight(ph, { color: '#c8b8ff', intensity: 1.5, dist: 1.5 });
  return { phone: ph };
}
