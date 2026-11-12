// engine/strength12.js — 1.0.4 strength & training sets (exposed as T.W.* through world3d.js). Sets return anchors like school10.js
// ([x, z, yaw] spots; seats as [x, z, yaw, seatY]). Moving props are marked userData.dynamic so optimize() never merges them.
//
//   const w = T.W.weightRoom(st)        // school weight room: rubber floor, mirror wall (real reflection), squat racks with a loaded bar,
//                                       // flat benches, dumbbell rack, plate trees, banner; w.rack(i) stand spot facing the mirror,
//                                       // w.bench(i) [x, z, yaw, seatY], w.bar(i) the rack's barbell (dynamic: move it with the hands)
//   const c = T.W.climbingGym(st)       // bouldering gym: angled walls with coloured holds, thick blue mats, chalk buckets, a judges'
//                                       // table; c.wallSpot(i) [x, z, yaw] facing the wall, c.hold(i, k) world [x, y, z] of hold k on route i,
//                                       // c.mat(i) spot on the mats, c.judges [x, z, yaw]
//   const L = T.W.lightTower(st, { at: [x, z], yaw, h })   // a 30 m stadium light tower that can break: L.update(t, { lean, snap, cable })
//                                       // lean 0..1 tips it toward +z (1 = flat on the ground), snap 0..1 bends the broken leg,
//                                       // cable 0..1 frays then snaps the guy cable; L.leg world [x, y, z] of the leg to catch; L.top
//   T.W.tractorTire({ s })              // a 200 kg tractor tire (lug tread), dynamic: lift it, flip it (rotate about its edge)
//   T.W.barbell({ plates, w })          // olympic bar with plates (plates: kg per side, 0–100)
//   const l = T.W.streamCorner(st, { at: [x, z], yaw, viewers })   // bedroom livestream desk: ring light (real light), mic arm,
//                                       // monitor with a LIVE badge and viewer count (l.update(t, viewers)), LED strip; l.chair [x, z, yaw, seatY]
//   const r = T.W.lockerRow({ n, color, h })   // a free-standing row of unbolted lockers; r.tip(k) 0..1 topples it forward (+z) about
//                                       // its front bottom edge, r.shake(t, a) rattles it. Weight ~300 kg for n = 6.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { shade, rng, clamp, lerp } from './core.js';
import { LEGACY, mat, box, rbox, cyl, sphere, plane, group, at, canvasTex, lamp, glow, glowMat, textTex, ground, torus, tiles, contactShadow, spot } from './kit3d.js';
import { bench, trashCan, poster } from './world3d.js';
import { mirror, aoStrip } from './look10.js';

const PI = Math.PI, R2 = PI / 2, SEAT = 0.42;
const isNight = (st) => /night|storm|dusk|arctic/.test(st.moodName);
const put = (st, obj, x, z, yaw = 0, y = 0, cs = true) => { obj.position.set(x, y, z); obj.rotation.y = yaw; st.add(obj); if (cs && y < 0.2) st.add(contactShadow(obj)); return obj; };
const sign = (txt, w, h, bg, fg, size = 64, font = 'Nunito') => mat('#ffffff', { map: textTex(txt, { w: 512, h: Math.max(32, Math.round(512 * h / w)), bg, color: fg, size, font }), rough: 0.6 });
const dyn = (g) => { g.userData.dynamic = true; return g; };
const STEEL = () => mat('#8a8e98', { metal: 0.85, rough: 0.28 });
function room(st, w, d, h, o) {
  const wm = mat(o.wall, { rough: 0.9, map: o.wallTex || null });
  st.add(ground(w + 0.4, d + 0.4, o.floor, o.floorTex || null, { rough: o.floorRough ?? 0.7 }));
  st.add(box(w + 0.4, h, 0.2, wm, 0, h / 2, -d / 2 - 0.1), box(0.2, h, d + 0.4, wm, -w / 2 - 0.1, h / 2, 0), box(0.2, h, d + 0.4, wm, w / 2 + 0.1, h / 2, 0));
  if (o.front !== false) st.add(box(w + 0.4, h, 0.2, wm, 0, h / 2, d / 2 + 0.1));
  st.add(box(w + 0.4, 0.12, d + 0.4, mat(shade(o.wall, -0.2), { rough: 1 }), 0, h + 0.06, 0));
  aoStrip(st, { from: [-w / 2, 0, -d / 2], to: [w / 2, 0, -d / 2] }); aoStrip(st, { from: [-w / 2, 0, d / 2], to: [-w / 2, 0, -d / 2], yaw: R2 }); aoStrip(st, { from: [w / 2, 0, -d / 2], to: [w / 2, 0, d / 2], yaw: -R2 });
}
const strips = (st, w, d, h, c = '#f4fbff', power = 1.3) => { for (let x = -w / 2 + 1.5; x < w / 2; x += 3) for (let z = -d / 2 + 1.4; z < d / 2; z += 2.8) st.add(box(1.4, 0.04, 0.3, glowMat(c, power), x, h - 0.03, z)); };
const lights = (st, list, c, power, dist) => list.map(([x, y, z], i) => { const L = lamp(c, power, dist, { bulb: false, shadow: i === 0 }); L.position.set(x, y, z); st.add(L); return L.light; });

// ---------------------------------------------------------------- props
const treadTex = () => canvasTex(512, 64, (g, W, H) => { g.fillStyle = '#1a1a1e'; g.fillRect(0, 0, W, H); g.fillStyle = '#2c2c32';
  for (let x = 0; x < W; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 18, H / 2); g.lineTo(x, H); g.lineTo(x + 10, H); g.lineTo(x + 28, H / 2); g.lineTo(x + 10, 0); g.fill(); } }, [6, 1]);
export function tractorTire(o = {}) {   // ~1.5 m across, lies flat by default (o.stand: true stands it on its tread); centre at y = half its width
  const s = o.s || 1, R = 0.75 * s, tube = 0.26 * s, rub = mat('#24242a', { rough: 0.85, map: treadTex() });
  const t = new THREE.Mesh(new THREE.TorusGeometry(R - tube * 0.3, tube, 14, 40), rub); t.castShadow = t.receiveShadow = true;
  t.scale.set(1, 1, 1.25);
  const g = group(t); for (let i = 0; i < 20; i++) { const a = i / 20 * PI * 2, lug = box(0.12 * s, 0.08 * s, 0.62 * s, mat('#1c1c20', { rough: 0.9 }), Math.cos(a) * (R + tube * 0.62), Math.sin(a) * (R + tube * 0.62), 0); lug.rotation.z = a + 0.5; g.add(lug); }
  const inner = cyl(R - tube * 1.1, R - tube * 1.1, 0.04, mat('#3a3a40', { rough: 0.7 }), 0, 0, 0, 28); inner.rotation.x = R2; g.add(inner);
  const holder = group(g); if (!o.stand) { g.rotation.x = R2; g.position.y = tube * 1.25; } else g.position.y = R + tube * 0.6;
  holder.userData.radius = R + tube * 0.6; holder.userData.thick = tube * 2.5; return dyn(holder);
}
export function barbell(o = {}) {   // bar along x, centre at the origin; plates: kg per side (20 kg = big bumper plate)
  const w = o.w || 2.2, kg = o.plates ?? 40, g = group(cyl(0.016, 0.016, w, STEEL(), 0, 0, 0, 10)); g.children[0].rotation.z = R2;
  const cols = { 25: '#c8342a', 20: '#2a5ac8', 15: '#e8c23a', 10: '#3a8a3a', 5: '#e8e8ec', 2.5: '#3a3a3a' };
  for (const sx of [-1, 1]) { let left = kg, x = sx * (w / 2 - 0.42); g.add(at(cyl(0.035, 0.035, 0.03, STEEL(), 0, 0, 0, 12), sx * (w / 2 - 0.44), 0, 0).rotateZ(R2));
    for (const p of [25, 20, 15, 10, 5, 2.5]) while (left >= p) { const r = p >= 10 ? 0.225 : 0.1 + p * 0.012, th = p >= 10 ? 0.045 + p * 0.0012 : 0.025; const pl = cyl(r, r, th, mat(cols[p], { rough: 0.5, clearcoat: 0.3, keepSat: true }), x + sx * th / 2, 0, 0, 28); pl.rotation.z = R2; g.add(pl); x += sx * (th + 0.004); left -= p; } }
  return dyn(g);
}
function squatRack() { const m = mat('#2a2c34', { metal: 0.6, rough: 0.35 }), g = group();
  for (const [x, z] of [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.4], [0.6, 0.4]]) g.add(box(0.07, 2.3, 0.07, m, x, 1.15, z));
  g.add(box(1.3, 0.07, 0.07, m, 0, 2.3, -0.5), box(1.3, 0.07, 0.07, m, 0, 2.3, 0.4), box(0.07, 0.07, 0.97, m, -0.6, 2.3, -0.05), box(0.07, 0.07, 0.97, m, 0.6, 2.3, -0.05));
  for (const x of [-0.6, 0.6]) g.add(box(0.1, 0.05, 0.16, mat('#c8343a', { keepSat: true }), x, 1.4, 0.48)); g.add(box(1.4, 0.04, 1.2, mat('#3a2a1e', { rough: 0.6 }), 0, 0.02, -0.05)); return g; }
function flatBench(c = '#1a1a20') { return group(rbox(1.2, 0.08, 0.3, 0.03, mat(c, { rough: 0.45, clearcoat: 0.4 }), 0, SEAT, 0), box(0.06, SEAT, 0.24, STEEL(), -0.45, SEAT / 2, 0), box(0.06, SEAT, 0.24, STEEL(), 0.45, SEAT / 2, 0)); }
function dumbbellRack(n = 8) { const g = group(box(2.4, 0.05, 0.4, mat('#2a2c34', { metal: 0.5 }), 0, 0.55, 0), box(2.4, 0.05, 0.4, mat('#2a2c34', { metal: 0.5 }), 0, 0.85, 0.05));
  for (const x of [-1.15, 1.15]) g.add(box(0.06, 0.9, 0.4, mat('#2a2c34', { metal: 0.5 }), x, 0.45, 0));
  for (let i = 0; i < n; i++) { const x = -1.0 + i * (2.0 / (n - 1)), r = 0.05 + i * 0.006, y = i % 2 ? 0.92 : 0.62; for (const dz of [-0.07, 0.07]) { const h = cyl(r, r, 0.05, mat('#18181c', { rough: 0.5, clearcoat: 0.5 }), x, y, dz, 6); h.rotation.x = R2; g.add(h); } g.add(at(cyl(0.012, 0.012, 0.12, STEEL(), 0, 0, 0, 6), x, y, 0).rotateX(R2)); }
  return g; }
function plateTree() { const g = group(cyl(0.03, 0.03, 1.2, STEEL(), 0, 0.6, 0, 8), cyl(0.3, 0.32, 0.05, mat('#2a2c34'), 0, 0.03, 0, 16));
  [['#c8342a', 0.225], ['#2a5ac8', 0.225], ['#e8c23a', 0.2]].forEach(([c, r], i) => { for (let k = 0; k < 3; k++) { const p = cyl(r, r, 0.045, mat(c, { keepSat: true, rough: 0.5 }), (i % 2 ? 0.1 : -0.1) + (i % 2 ? 1 : -1) * k * 0.05, 0.35 + i * 0.3, 0, 24); p.rotation.z = R2; g.add(p); } }); return g; }

// ================================================================ WEIGHT ROOM — mirror wall at -z, racks facing it, benches, dumbbells at +x
export function weightRoom(st, o = {}) {
  const w = o.w || 12, d = o.d || 9, h = o.h || 3.4, wall = o.wall || '#c8ccd0', c = o.color || '#2a3a8a';
  room(st, w, d, h, { wall, floor: '#26262a', floorTex: tiles('#26262a', 6, [w / 1.0, d / 1.0], 'rgba(255,255,255,.05)'), floorRough: 0.85, front: o.front });
  st.add(box(w, 0.9, 0.02, mat(c, { rough: 0.6 }), 0, 0.45, -d / 2 + 0.012), box(0.02, 0.9, d, mat(c, { rough: 0.6 }), w / 2 - 0.012, 0.45, 0));
  // mirror wall (real reflection) above the stripe
  const mw = w - 2, mh = 1.9, mx = 0, my = 1.0 + mh / 2;
  const m = LEGACY ? null : new Reflector(new THREE.PlaneGeometry(mw, mh), { textureWidth: 1024, textureHeight: 256, clipBias: 0.003, color: 0xb8c4c8, multisample: 0 });
  if (m) { m.position.set(mx, my, -d / 2 + 0.03); m.userData.dynamic = true; st.add(m); } else st.add(box(mw, mh, 0.01, mat('#a8b8c8', { metal: 0.9, rough: 0.05 }), mx, my, -d / 2 + 0.03));
  st.add(box(mw + 0.08, mh + 0.08, 0.02, mat('#c8ccd4', { metal: 0.8, rough: 0.2 }), mx, my, -d / 2 + 0.015));
  st.add(at(plane(3.2, 0.5, sign(o.banner || 'EAGLES STRENGTH', 3.2, 0.5, c, '#f2b632', 90)), w / 2 - 0.03, 2.65, 0, -R2));
  st.add(at(plane(2.2, 0.9, sign('PR BOARD', 2.2, 0.9, '#f4f0e6', '#2a2a30', 80)), -w / 2 + 0.03, 2.2, -1.5, R2));
  const racks = [], bars = [], benches = [];
  for (let i = 0; i < (o.racks || 3); i++) { const x = -3.2 + i * 3.2, z = -d / 2 + 1.6; put(st, squatRack(), x, z);
    const bar = barbell({ plates: o.plates?.[i] ?? [60, 40, 100][i % 3] }); bar.position.set(x, 1.45, z + 0.52); st.add(bar); bars.push(bar); racks.push([x, z + 0.9, PI]); }
  for (let i = 0; i < 2; i++) { const x = -2.4 + i * 4.8, z = 1.4; put(st, flatBench(c), x, z, R2); benches.push([x, z, 0, SEAT + 0.06]); }
  put(st, dumbbellRack(), w / 2 - 0.5, 0.5, -R2); put(st, plateTree(), -w / 2 + 0.6, 2.2); put(st, plateTree(), -w / 2 + 0.6, -0.4);
  put(st, trashCan({ color: '#3a3e48' }), -w / 2 + 0.5, d / 2 - 0.6);
  strips(st, w, d, h, '#f0f8ff', 1.3); lights(st, [[-2, h - 0.4, -1], [3, h - 0.4, 1.5]], '#eef6ff', o.lamp ?? 4.5, 10);
  mirror(st, { w, d, strength: 0.12, blur: 2 });
  return { rack: (i = 0) => racks[i % racks.length], bar: (i = 0) => bars[i % bars.length], bench: (i = 0) => benches[i % benches.length], w, d, mirrorZ: -d / 2 + 0.03 };
}

// ================================================================ CLIMBING GYM — angled walls at -z with routes of coloured holds, mats in front
const HOLD_C = ['#e83a5a', '#2a9ae8', '#f2c23a', '#3ac87a', '#a85ae8', '#f2843a'];
export function climbingGym(st, o = {}) {
  const w = o.w || 14, d = o.d || 10, h = o.h || 6, r = rng(o.seed || 12);
  room(st, w, d, h, { wall: o.wall || '#3a4048', floor: '#4a4e58', floorRough: 0.8, front: o.front });
  const panelM = mat('#d8d4cc', { rough: 0.85, map: canvasTex(256, 256, (g, W, H) => { g.fillStyle = '#d8d4cc'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(40,40,40,.25)'; for (let x = 16; x < W; x += 32) for (let y = 16; y < H; y += 32) g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 60; i++) g.fillRect(r() * W, r() * H, 6 + r() * 14, 3); }, [3, 2]) });
  const routes = [], spots = [], wallH = h - 0.4, nW = o.walls || 3, pw = (w - 1) / nW;
  for (let i = 0; i < nW; i++) {
    const x0 = -w / 2 + 0.5 + pw * (i + 0.5), lean = [0.0, 0.22, 0.1][i % 3], panel = group(), base = -d / 2 + 0.3;
    const p = box(pw - 0.06, wallH, 0.12, panelM, 0, wallH / 2, 0); panel.add(p); panel.position.set(x0, 0, base); panel.rotation.x = lean;   // overhang: the top leans out toward +z
    const holds = [], col = HOLD_C[i * 2 % HOLD_C.length];
    for (let k = 0; k < 14; k++) { const hy = 0.35 + k * (wallH - 0.8) / 13, hx = Math.sin(k * 1.7 + i) * pw * 0.28; const hm = mat(col, { keepSat: true, rough: 0.55, clearcoat: 0.3 });
      const hold = sphere(0.075 + (k % 3) * 0.02, hm, hx, hy, 0.09, 10, 8); hold.scale.set(1.3, 0.8, 0.7); panel.add(hold); holds.push(hold); }
    for (let k = 0; k < 18; k++) { const hold = sphere(0.06, mat(HOLD_C[(k + i + 1) % HOLD_C.length], { keepSat: true, rough: 0.6 }), (r() - 0.5) * (pw - 0.4), 0.3 + r() * (wallH - 0.6), 0.08, 8, 6); hold.scale.set(1.2, 0.8, 0.6); panel.add(hold); }
    st.add(panel); panel.updateMatrixWorld(true);   // hold spots are read now: optimize() may merge the meshes later
    routes.push(holds.map(hh => { const v = new THREE.Vector3(); hh.getWorldPosition(v); return [v.x, v.y, v.z]; })); spots.push([x0, base + 0.75 + Math.sin(lean) * 1.2, PI]);
    st.add(at(plane(0.5, 0.3, sign(['V2', 'V5', 'V4'][i % 3], 0.5, 0.3, col, '#ffffff', 120)), x0 - pw / 2 + 0.4, 0.5, base + 0.08));
  }
  for (let i = 0; i < nW; i++) st.add(rbox(pw - 0.1, 0.32, 3.0, 0.08, mat('#2a5aa8', { rough: 0.75, keepSat: true }), -w / 2 + 0.5 + pw * (i + 0.5), 0.16, -d / 2 + 2.0));
  for (let i = 0; i < 3; i++) put(st, group(cyl(0.12, 0.1, 0.22, mat('#e8e4dc'), 0, 0.11, 0, 12), cyl(0.1, 0.1, 0.02, mat('#f8f8f8'), 0, 0.2, 0, 12)), -4 + i * 4, -d / 2 + 3.8);
  // judges' table with a sign
  put(st, group(box(2.0, 0.05, 0.7, mat('#f4f0e8'), 0, 0.74, 0), box(1.95, 0.7, 0.02, mat('#2a3a8a'), 0, 0.37, 0.34), at(plane(1.6, 0.35, sign(o.event || 'QUALIFIER', 1.6, 0.35, '#2a3a8a', '#f2c23a', 100)), 0, 0.42, 0.36)), w / 2 - 2.0, d / 2 - 1.8, PI);
  strips(st, w, d, h, '#f4f8ff', 1.4); lights(st, [[-3, h - 0.5, -1], [3, h - 0.5, -1], [0, h - 0.5, 2.5]], '#f4f8ff', o.lamp ?? 6, 14);
  return { wallSpot: (i = 0) => spots[i % spots.length], hold: (i = 0, k = 0) => routes[i % routes.length][clamp(k, 0, 13)].slice(),
    mat: (i = 0) => [-w / 2 + 0.5 + pw * (i % nW + 0.5), -d / 2 + 2.6, PI], judges: [w / 2 - 2.0, d / 2 - 2.6, PI], matTop: 0.32, w, d };
}

// ================================================================ LIGHT TOWER — a breakable stadium light on a lattice of 4 legs
export function lightTower(st, o = {}) {
  const [x0, z0] = o.at || [0, 0], H = o.h || 30, night = o.night ?? isNight(st), sm = mat('#7a7e88', { metal: 0.6, rough: 0.35 });
  const root = group(); root.position.set(x0, 0, z0); root.rotation.y = o.yaw || 0; st.add(root); dyn(root);
  const pivot = group(); pivot.position.set(0, 0, 0.6); root.add(pivot);   // tips about the front feet (+z edge)
  const body = group(); body.position.set(0, 0, -0.6); pivot.add(body);
  const legs = []; const B = 0.6, T = 0.25;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = group(); leg.position.set(sx * B, 0, sz * B); const len = Math.hypot(H, B - T);
    const tube = cyl(0.07, 0.09, len, sm, 0, len / 2, 0, 8); leg.add(tube); leg.rotation.z = sx * Math.atan2(B - T, H); leg.rotation.x = -sz * Math.atan2(B - T, H); body.add(leg); legs.push(leg); }
  for (let y = 2; y < H; y += 2.5) { const k = y / H, half = lerp(B, T, k); for (const [a, b] of [[[-1, -1], [1, -1]], [[-1, 1], [1, 1]], [[-1, -1], [-1, 1]], [[1, -1], [1, 1]]]) { const ax = a[0] * half, az = a[1] * half, bx = b[0] * half, bz = b[1] * half; const L2 = Math.hypot(bx - ax, bz - az);
      const br = cyl(0.025, 0.025, L2, sm, (ax + bx) / 2, y, (az + bz) / 2, 6); br.rotation.z = R2; br.rotation.y = Math.atan2(-(bz - az), bx - ax); body.add(br); } }
  const head = group(box(5, 2.4, 0.35, mat('#3a3e48'), 0, 0, 0)); head.position.set(0, H + 0.8, 0.2);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) head.add(box(1.0, 0.9, 0.05, night ? glowMat('#f4f8ff', 2.4) : mat('#e8ecf0', { rough: 0.3 }), -1.8 + i * 1.2, -0.5 + j * 1.05, 0.2));
  if (night) head.add(at(glow('#f4f8ff', 5, 0.55), 0, 0, 0.6)); body.add(head);
  const footM = mat('#a8a8a0', { rough: 0.9 }); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) root.add(box(0.5, 0.3, 0.5, footM, sx * B, 0.15, sz * B));
  // guy cable from the top back to an anchor behind (-z)
  const cableM = mat('#2a2a30', { metal: 0.6, rough: 0.4 }), cable = cyl(0.015, 0.015, 1, cableM, 0, 0, 0, 5), stub = cyl(0.015, 0.015, 1, cableM, 0, 0, 0, 5); root.add(cable, stub);
  const anchor = [0, 0.2, -12]; root.add(box(0.6, 0.4, 0.6, footM, anchor[0], 0.2, anchor[2]));
  const fray = []; for (let i = 0; i < 6; i++) { const f = cyl(0.004, 0.004, 0.35, cableM, 0, 0, 0, 3); f.visible = false; root.add(f); fray.push(f); }
  const brokenLeg = legs[3], tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const setSeg = (m, a, b) => { tmp.set(...a); tmp2.set(...b); const len = tmp.distanceTo(tmp2); m.position.copy(tmp).add(tmp2).multiplyScalar(0.5); m.scale.set(1, Math.max(0.001, len), 1); m.lookAt(tmp2); m.rotateX(R2); };
  const api = {
    root, body, legs,
    update(t, s = {}) {
      const lean = clamp(s.lean ?? 0), snap = clamp(s.snap ?? 0), cab = clamp(s.cable ?? 0);
      pivot.rotation.x = lean * R2 * 0.98;   // + rotates the top toward +z
      brokenLeg.scale.y = 1 - 0.04 * snap; brokenLeg.rotation.y = snap * 0.25;
      root.updateMatrixWorld(true); const topW = new THREE.Vector3(0, H, 0); body.localToWorld(topW); root.worldToLocal(topW);
      const mid = [lerp(topW.x, anchor[0], 0.55), lerp(topW.y, anchor[1], 0.55), lerp(topW.z, anchor[2], 0.55)];
      if (cab < 1) { setSeg(cable, [topW.x, topW.y, topW.z], anchor); cable.visible = true; stub.visible = false; }
      else { const hang = [mid[0], Math.max(0.05, mid[1] - 6), mid[2] + 1.5]; setSeg(cable, [topW.x, topW.y, topW.z], [topW.x, topW.y - 4, topW.z - 0.5]); setSeg(stub, anchor, hang); stub.visible = true; }
      fray.forEach((f, i) => { f.visible = cab > 0.2 && cab < 1; f.position.set(mid[0] + Math.sin(i * 2.1) * 0.08 * cab, mid[1], mid[2] + Math.cos(i * 1.7) * 0.08 * cab); f.rotation.set(Math.sin(t * 9 + i) * cab, i, Math.cos(t * 7 + i) * cab); });
    },
    get leg() { const v = new THREE.Vector3(0, 1.2, 0); brokenLeg.localToWorld(v); return [v.x, v.y, v.z]; },
    get top() { const v = new THREE.Vector3(0, H, 0); body.localToWorld(v); return [v.x, v.y, v.z]; }, H,
  };
  api.update(0, {}); return api;
}

// ================================================================ STREAM CORNER — desk, ring light, mic arm, monitor with LIVE + viewers
export function streamCorner(st, o = {}) {
  const [x, z] = o.at || [0, 0], yaw = o.yaw || 0, root = group(); root.position.set(x, 0, z); root.rotation.y = yaw; st.add(root);
  root.add(box(1.4, 0.04, 0.65, mat('#2a2a30', { clearcoat: 0.4, rough: 0.35 }), 0, 0.74, 0)); for (const sx of [-0.65, 0.65]) root.add(box(0.04, 0.74, 0.6, mat('#1a1a20', { metal: 0.4 }), sx, 0.37, 0));
  root.add(box(1.4, 0.015, 0.015, glowMat('#c83aff', 1.8), 0, 0.72, 0.33));   // LED strip under the desk edge
  let viewers = o.viewers ?? 0; const scr = canvasTex(512, 300, () => {}); const draw = (n) => { const c = scr.image, g = c.getContext('2d'); g.fillStyle = '#121624'; g.fillRect(0, 0, 512, 300); g.fillStyle = '#2a3048'; g.fillRect(20, 20, 330, 220);
    g.fillStyle = '#e8283a'; g.fillRect(372, 24, 110, 44); g.fillStyle = '#fff'; g.font = 'bold 34px Nunito, sans-serif'; g.fillText('LIVE', 390, 58);
    g.fillStyle = '#f2f2f8'; g.font = 'bold 30px Nunito, sans-serif'; g.fillText('\u{1F441} ' + Math.round(n).toLocaleString('en-US'), 372, 120);
    g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 6; i++) g.fillRect(372, 150 + i * 22, 90 + (i * 37) % 40, 10); scr.needsUpdate = true; };
  draw(viewers);
  const mon = group(rbox(0.8, 0.48, 0.04, 0.02, mat('#0e0e12'), 0, 0, 0), at(plane(0.76, 0.44, new THREE.MeshBasicMaterial({ map: scr, toneMapped: false })), 0, 0, 0.022)); mon.position.set(0, 1.08, -0.18); root.add(mon, box(0.06, 0.3, 0.06, mat('#1a1a20'), 0, 0.88, -0.2));
  // ring light on a stand behind the monitor's left, real light toward the chair
  const ring = torus(0.28, 0.025, glowMat('#fff6ea', 2.2), 0, 0, 0); ring.position.set(-0.5, 1.45, -0.05); ring.rotation.y = 0.35; root.add(ring, cyl(0.012, 0.012, 1.45, mat('#1a1a20', { metal: 0.5 }), -0.5, 0.72, -0.05, 6));
  const L = lamp('#fff2e0', o.ring ?? 3.2, 4, { bulb: false, shadow: false }); L.position.set(-0.45, 1.45, 0.15); root.add(L);
  // mic on a boom arm
  const arm = group(cyl(0.01, 0.01, 0.55, mat('#1a1a20', { metal: 0.6 }), 0, 0.27, 0, 6)); arm.position.set(0.55, 0.76, -0.2); arm.rotation.x = 0.6; arm.rotation.z = 0.35; root.add(arm);
  root.add(at(group(cyl(0.035, 0.035, 0.14, mat('#2a2a30', { metal: 0.5, rough: 0.3 }), 0, 0, 0, 12)), 0.32, 1.1, 0.12).rotateX(R2 * 0.8));
  const chair = [x + Math.sin(yaw) * 0.75, z + Math.cos(yaw) * 0.75, yaw + PI, SEAT + 0.05];
  return { root, chair, ringLight: L.light, update(t, n) { if (n != null && Math.round(n) !== Math.round(viewers)) { viewers = n; draw(n); } } };
}

// ================================================================ LOCKER ROW — free-standing unbolted lockers that can topple forward
export function lockerRow(o = {}) {
  const n = o.n || 6, h = o.h || 2.0, c = o.color || '#2a4a8a', W = 0.42 * n, root = group(), pivot = group(), body = group();
  pivot.position.set(0, 0, 0.23); body.position.set(0, 0, -0.23); root.add(pivot); pivot.add(body);
  for (let i = 0; i < n; i++) { const m = mat(c, { rough: 0.45, metal: 0.4, clearcoat: 0.3 }), g = group(box(0.41, h, 0.45, m, 0, h / 2, 0)); for (let k = 0; k < 4; k++) g.add(box(0.26, 0.015, 0.01, mat(shade(c, -0.4)), 0, h - 0.3 + k * 0.04, 0.226));
    g.add(box(0.03, 0.1, 0.03, mat('#c8ccd4', { metal: 0.8 }), 0.14, h * 0.52, 0.235), box(0.4, 0.02, 0.01, mat(shade(c, -0.25)), 0, 0.08, 0.226)); g.position.x = -W / 2 + 0.21 + i * 0.42; body.add(g); }
  body.add(box(W, 0.02, 0.46, mat(shade(c, -0.3)), 0, h + 0.01, 0));
  dyn(root);
  return Object.assign(root, { W, H: h,
    tip(k) { pivot.rotation.x = clamp(k) * (R2 - 0.02); },   // falls toward +z; at 1 it lies face-down
    shake(t, a = 1) { body.rotation.z = Math.sin(t * 38) * 0.006 * a; body.position.x = Math.sin(t * 29) * 0.004 * a; },
    // where its top edge is now (for hands catching it): local → world
    topEdge(x = 0) { const v = new THREE.Vector3(x, h, 0.23); body.localToWorld(v); return [v.x, v.y, v.z]; } });
}
