// engine/school3d.js — ready-made school sets every teen story uses (exposed as T.W.* through world3d.js, 0.2.8).
// Each set builds into the stage and returns the anchors shots need, so a project only picks a set and places people.
// Seats are 0.42 high (the 'sit' / 'sitDesk' poses put the hips there with the character at y 0).
//
//   const s = T.W.busStop(st)        // curb along x, bus at the curb with its door open; s.door, s.step, s.walk (sidewalk top)
//   const b = T.W.busInside(st)      // aisle along x, b.seat(row, side) → [x, z]; b.update(t) scrolls the view (moving: true)
//   const h = T.W.lockerHall(st)     // lockers on both walls, h.locker(i, side) → { x, z, yaw, door }; door.rotation.y opens it
//   const f = T.W.schoolFront(st)    // facade, steps, flag, lawn, a bus at the curb
//   const c = T.W.cafeteria(st)      // long tables; c.seat(table, side, i) → [x, z, yaw]
//   const y = T.W.schoolYard(st)     // PE field: grass, running lane, goals, fence, school behind
//   const k = T.W.court(st)          // outdoor basketball court (asphalt, hoops at x = ±11.5); indoor games: T.W.gym
import * as THREE from 'three';
import { S, shade, rng } from './core.js';
import { mat, box, rbox, cyl, plane, group, at, canvasTex, lamp, glow, textTex, ground, torus, asphalt } from './kit3d.js';
import { tree, bench, locker, counter, poster, ceilingLamp, trashCan, bulletinBoard, wallClock, room } from './world3d.js';

const PI = Math.PI, R2 = PI / 2, SEAT = 0.42;
const sign = (txt, w, h, bg, fg, size = 52) => mat('#ffffff', { map: textTex(txt, { w: 512, h: Math.round(512 * h / w), bg, color: fg, size, font: 'Nunito' }) });

// ---------------------------------------------------------------- yellow school bus (exterior), front = +x, door on the +z side at x ≈ 3.9.
// o.door: 0 closed .. 1 folded open (default 1). Returns the group with .door (pivot) and the anchors .doorX/.stepY.
export function schoolBus(o = {}) {
  const y = mat(o.color || '#f2b632', { keepSat: true, rough: 0.5 }), blk = mat('#1e1a22'), glass = mat('#2a3448', { rough: 0.1, metal: 0.3, transparent: true, opacity: 0.35 });
  const g = group(box(9, 1.0, 2.5, y, 0, 1.4, 0), box(9, 0.32, 2.5, y, 0, 2.72, 0), box(1.6, 1.4, 2.4, y, 5.2, 1.2, 0), box(9.02, 0.1, 2.52, blk, 0, 1.25, 0), box(9.02, 0.1, 2.52, blk, 0, 1.6, 0));
  for (let x = -4.4; x <= 4.4; x += 1.1) g.add(box(0.1, 0.66, 2.52, y, x, 2.22, 0));
  for (const sz of [-1, 1]) g.add(plane(9, 0.66, glass, 0, 2.22, sz * 1.24));
  for (const [x, z] of [[-3, 1.25], [-3, -1.25], [3.6, 1.25], [3.6, -1.25]]) { const w = cyl(0.48, 0.48, 0.3, blk, x, 0.48, z); w.rotation.x = R2; g.add(w); }
  g.add(box(9, 0.06, 2.4, mat('#4a4450'), 0, 0.9, 0));
  g.add(box(0.06, 0.06, 2.6, blk, 6.02, 0.75, 0), box(0.5, 0.3, 0.06, mat('#d8343a', { keepSat: true }), -1.6, 2.2, 1.29));   // bumper, stop arm
  const door = group(box(0.5, 1.6, 0.04, glass, 0.25, 0, 0), box(0.5, 0.06, 0.05, blk, 0.25, 0.8, 0), box(0.5, 0.06, 0.05, blk, 0.25, -0.8, 0));
  door.position.set(3.4, 1.55, 1.27); door.rotation.y = -(o.door ?? 1) * 1.45; g.add(door); g.door = door;
  g.add(box(0.9, 0.08, 0.35, mat('#3a3640'), 3.9, 0.62, 1.38), box(0.9, 0.08, 0.3, mat('#3a3640'), 3.9, 0.34, 1.6));   // two steps down to the curb
  g.add(plane(1.9, 0.26, sign('SCHOOL BUS', 1.9, 0.26, '#1e1a22', '#f2b632'), -0.5, 1.42, 1.262));
  g.add(glow('#fff2c8', 0.5, 6.0, 1.1, 0.8), glow('#fff2c8', 0.5, 6.0, 1.1, -0.8));
  g.doorX = 3.9; g.stepY = [0.62, 0.34];
  return g;
}

// ---------------------------------------------------------------- the bus stop at the curb: sidewalk z −2..1 (top y 0.15), road z 1..8, bus at z 2.6 rotated so its door faces the sidewalk.
// Someone stepping off: start at s.step[0], then s.step[1], then land on s.walk. A stop sign, a shelter and a bench on the sidewalk.
export function busStop(st, o = {}) {
  const M = st.M, bx = o.busX ?? 0;
  st.add(ground(140, 90, M.grass || '#5a7a5a'));
  st.add(box(140, 0.02, 7, mat(M.road || '#4a4250', { rough: 0.9, map: asphalt(M.road || '#4a4250', [20, 2]) }), 0, 0.01, 4.5));
  st.add(box(140, 0.15, 3, mat('#a89a94'), 0, 0.075, -0.5), box(140, 0.16, 0.12, mat('#d8d0c8'), 0, 0.08, 0.98));
  for (let x = -60; x < 60; x += 4) st.add(box(2, 0.005, 0.12, mat('#e8dcae'), x, 0.025, 4.6));
  const bus = schoolBus({ door: o.door ?? 1 }); bus.position.set(bx, 0, 2.6); bus.rotation.y = PI; st.add(bus);
  const stopSign = group(cyl(0.04, 0.04, 2.4, mat('#8a8a94', { metal: 0.6 }), 0, 1.2, 0), at(plane(0.6, 0.6, sign('BUS STOP', 0.6, 0.6, '#d8343a', '#ffffff', 64)), 0, 2.2, 0.03));
  st.add(at(stopSign, bx - 6.5, 0.15, 0.4));
  const shelter = group(box(3.2, 0.08, 1.4, mat('#3a4a5a', { metal: 0.4 }), 0, 2.5, 0), box(0.08, 2.4, 0.08, mat('#3a4a5a'), -1.5, 1.2, -0.6), box(0.08, 2.4, 0.08, mat('#3a4a5a'), 1.5, 1.2, -0.6),
    plane(3.0, 2.0, mat('#a8c8e0', { transparent: true, opacity: 0.25, rough: 0.1 }), 0, 1.3, -0.65));
  st.add(at(shelter, bx + 8, 0.15, -1.3), at(bench({}), bx + 8, 0.15, -1.4));
  for (const [x, z] of [[-14, -6], [14, -6], [-24, -4], [24, -3]]) st.add(at(tree({ s: 1.2, seed: x | 0, color: '#3a5a48' }), x, 0, z));
  if (o.school !== false) facade(st, -14, o.name);
  const dx = bx - 3.9;   // the bus is turned round: its door is at world x = busX − 3.9
  return { bus, door: [dx, 0.9, 1.35], step: [[dx, 0.62, 1.22], [dx, 0.34, 1.0]], walk: 0.15, curbZ: 1.0 };
}
function facade(st, z, name = 'EASTBROOK HIGH') {
  const fac = mat('#a86a5a'), trim = mat('#e8e0d4'), winM = mat('#ffe6b0', { emissive: '#ffe0a0' });
  st.add(box(46, 8, 3, fac, 0, 4, z), box(46.4, 0.4, 3.2, trim, 0, 8.1, z));
  for (let x = -20; x <= 20; x += 3) for (const yy of [2.2, 5.6]) st.add(box(1.6, 1.6, 0.05, winM, x, yy, z + 1.52), box(1.8, 0.12, 0.1, trim, x, yy - 0.86, z + 1.55));
  st.add(box(4, 3, 0.2, mat('#3f6a58'), 0, 1.5, z + 1.55), plane(9, 1.1, sign(name, 9, 1.1, '#e8e0d4', '#2c3e6e', 92), 0, 6.9, z + 1.54));
}

// ---------------------------------------------------------------- outside school: facade at z −14, wide steps, a flagpole, lawn, sidewalk along x at z −2..1, optional bus at the curb.
export function schoolFront(st, o = {}) {
  const r = busStop(st, { ...o, busX: o.busX ?? 8, school: false });
  facade(st, -14, o.name);
  for (let k = 0; k < 3; k++) st.add(box(8 - k * 0.6, 0.18, 0.5, mat('#c8c0b8'), 0, 0.09 + k * 0.18, -11.8 - k * 0.5));
  st.add(box(4, 0.03, 9, mat('#b8aca4'), 0, 0.015, -7));   // the path from the sidewalk to the door
  const pole = group(cyl(0.06, 0.06, 9, mat('#c8c8d0', { metal: 0.8 }), 0, 4.5, 0), at(plane(1.8, 1.1, mat('#2c4a8a', { keepSat: true, side: THREE.DoubleSide })), 0.92, 8.3, 0));
  st.add(at(pole, -6, 0, -9));
  if (o.bus === false) st.remove(r.bus);
  return { ...r, entrance: [0, 0, -11.6], path: [0, 0, -7] };
}

// ---------------------------------------------------------------- inside the bus: aisle along x (front = +x, driver at x 4), seats at z ±0.72, floor y 0, windows both sides.
// seat(row, side): row 0 is the front, side −1 left (−z) / +1 right; returns [x, z] for a character with pose 'sit' and yaw ±R2 facing forward (+x → yaw R2).
// o.moving: the scenery outside slides past; call b.update(t) in draw(). Daylight by default, o.night for dusk.
export function busInside(st, o = {}) {
  const rows = o.rows ?? 8, len = rows * 1.0 + 3, y = mat('#f2b632', { keepSat: true, rough: 0.5 }), seatM = mat(o.seat || '#2f5a8a', { rough: 0.8 }), wall = mat('#e8e2d8', { rough: 0.7 });
  st.add(box(len, 0.1, 2.6, mat('#4a4450', { rough: 0.9 }), 0.5, -0.05, 0), box(len, 0.08, 0.5, mat('#3a3440'), 0.5, 0.01, 0));
  st.add(box(len, 2.2, 0.08, wall, 0.5, 0.6, -1.3), box(len, 0.08, 2.6, wall, 0.5, 2.15, 0));
  for (const sz of [-1, 1]) {
    st.add(box(len, 0.85, 0.1, wall, 0.5, 0.43, sz * 1.3), box(len, 0.35, 0.1, wall, 0.5, 1.98, sz * 1.3));
    for (let x = -len / 2 + 0.5; x <= len / 2 + 0.5; x += 1.0) st.add(box(0.12, 0.95, 0.12, y, x, 1.33, sz * 1.3));
  }
  const view = canvasTex(1024, 256, (g, W, H) => {   // what passes outside: sky, trees, houses
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, o.night ? '#3a2a5a' : '#9ac8f0'); gr.addColorStop(1, o.night ? '#e88a6a' : '#e8f4ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const r = rng(5); for (let i = 0; i < 18; i++) { const x = r() * W, h = 60 + r() * 90; g.fillStyle = ['#7a5a6a', '#a86a5a', '#6a7a9a', '#c8a07a'][i % 4]; g.fillRect(x, H - h, 70 + r() * 60, h); }
    for (let i = 0; i < 22; i++) { const x = r() * W; g.fillStyle = '#3a6a48'; g.beginPath(); g.arc(x, H - 70 - r() * 30, 34 + r() * 20, 0, 7); g.fill(); g.fillRect(x - 5, H - 70, 10, 70); }
    g.fillStyle = '#5a5a62'; g.fillRect(0, H - 22, W, 22);
  }, [2, 1]);
  view.wrapS = THREE.RepeatWrapping;
  for (const sz of [-1, 1]) { const p = plane(len + 30, 3.2, mat('#ffffff', { map: view, emissive: '#ffffff', emissiveMap: view, emissiveIntensity: 0.55 }), 0.5, 1.4, sz * 4.5); if (sz < 0) p.rotation.y = 0; else p.rotation.y = PI; st.add(p); }
  const seat = (row, side) => [len / 2 - 2.2 - row * 1.0, side * 0.75];
  for (let k = 0; k < rows; k++) for (const sd of [-1, 1]) { const [x, z] = seat(k, sd);
    st.add(rbox(0.5, 0.14, 0.95, 0.04, seatM, x, SEAT - 0.07, z), rbox(0.14, 0.75, 0.95, 0.05, seatM, x - 0.3, 0.75, z), box(0.08, SEAT - 0.14, 0.8, mat('#2a2830', { metal: 0.4 }), x, (SEAT - 0.14) / 2, z)); }
  st.add(box(0.1, 0.9, 1.3, mat('#2a2830'), len / 2 - 0.7, 0.45, -0.65), at(cyl(0.22, 0.22, 0.05, mat('#1e1a22'), len / 2 - 0.2, 1.05, -0.55), 0, 0, 0));
  for (let x = -len / 2 + 1.5; x < len / 2; x += 2.5) { const L = lamp('#fff2d8', 1.6, 4, { bulb: false }); L.position.set(x, 2.0, 0); st.add(L); }
  const win = lamp(o.night ? '#ffb08a' : '#e8f2ff', 10, 14, { bulb: false }); win.position.set(0, 1.6, 3.2); st.add(win);
  let speed = o.moving === false ? 0 : (o.speed ?? 0.05);
  return { seat, aisle: 0, len, driver: [len / 2 - 0.3, -0.55], update(t) { view.offset.x = (t * speed) % 1; } };
}

// ---------------------------------------------------------------- hallway with lockers: aisle along z (−d/2 .. d/2), lockers on both walls (x = ±(w/2 − 0.26)) facing the aisle.
// locker(i, side): i counts from the far end (z −d/2) in 0.52 m steps, side −1 left / +1 right. door.rotation.y = ±1.6 swings it open.
export function lockerHall(st, o = {}) {
  const w = o.w ?? 4.6, d = o.d ?? 24, cols = o.colors || ['#2f6a72', '#2f6a72', '#2f6a72', '#b8403a'];
  const r = room(st, { kind: 'hallway', w, d, wall: o.wall || '#5a4466', floor: o.floor || '#b89c90', window: false, ceiling: true, lockerRun: 0 });
  const doors = {};
  const place = (i, side) => ({ x: side * (w / 2 - 0.26), z: -d / 2 + 1 + i * 0.52, yaw: side < 0 ? R2 : -R2 });
  for (const side of [-1, 1]) for (let i = 0; i < Math.floor((d - 2) / 0.52); i++) {
    if (o.gap && i % 12 > 9) continue;   // a door / poster gap every few metres
    const p = place(i, side), c = cols[(i * 7 + (side > 0 ? 3 : 0)) % cols.length], m = mat(c, { rough: 0.5, metal: 0.4 });
    const body = group(box(0.5, 1.9, 0.48, m, 0, 0.95, -0.02)); const door = group(box(0.48, 1.86, 0.03, m, 0.24, 0, 0)); for (let k = 0; k < 3; k++) door.add(box(0.3, 0.02, 0.01, shade(c, -0.4), 0.24, 0.65 + k * 0.05, 0.02));
    door.add(box(0.03, 0.12, 0.03, '#c8c8d0', 0.42, 0.05, 0.03)); door.position.set(-0.24, 0.95, 0.23); body.add(door);
    st.add(at(body, p.x, 0, p.z, p.yaw)); doors[`${i},${side}`] = door;
  }
  st.add(at(poster({ text: o.banner || 'GO EAGLES', c1: '#f2b632', c2: '#8d4a6b' }), w / 2 - 0.03, 2.25, -2, -R2));
  st.add(at(bulletinBoard({ seed: 4 }), -w / 2 + 0.03, 2.3, 3, R2), at(wallClock({}), 0, 2.45, -d / 2 + 0.05));
  st.add(at(trashCan({}), w / 2 - 0.5, 0, 6));
  return { ...r, locker: (i, side) => ({ ...place(i, side), door: doors[`${i},${side}`], front: [place(i, side).x - side * 0.65, place(i, side).z] }) };
}

// ---------------------------------------------------------------- cafeteria: long tables along x (top 0.76) at z = TZ, benches both sides at z ± 0.72, a serving counter at z +5.8.
// seat(table, side, i): table index into TZ, side −1 back / +1 front, i 0..5 along the bench → [x, z, yaw] (yaw faces the table).
export function cafeteria(st, o = {}) {
  const TZ = o.tables || [0, -3.4, 3.4];
  const r = room(st, { kind: 'empty', w: 16, d: 13, wall: o.wall || '#7a6a6a', floor: o.floor || '#c0a890', window: 'back', windowX: 0, view: o.view || 'day', windowLight: 30, curtain: false });
  const top = mat('#d8c8b0', { rough: 0.5 }), benchM = mat(o.bench || '#2f6a72'), leg = mat('#5a5460', { metal: 0.4 });
  for (const z of TZ) for (const x of [-4.2, 4.2]) {
    st.add(box(5, 0.06, 1.0, top, x, 0.76, z), box(0.08, 0.73, 0.8, leg, x - 2.2, 0.365, z), box(0.08, 0.73, 0.8, leg, x + 2.2, 0.365, z));
    for (const sz of [-1, 1]) st.add(box(5, 0.06, 0.34, benchM, x, SEAT - 0.03, z + sz * 0.72), box(0.06, SEAT - 0.06, 0.3, leg, x - 2.0, (SEAT - 0.06) / 2, z + sz * 0.72), box(0.06, SEAT - 0.06, 0.3, leg, x + 2.0, (SEAT - 0.06) / 2, z + sz * 0.72));
  }
  const cnt = counter({ w: 7, color: '#e8e0d4', base: '#3f6a58' }); cnt.position.set(0, 0, 5.8); cnt.rotation.y = PI; st.add(cnt);
  st.add(at(poster({ text: 'LUNCH', c1: '#f2b632', c2: '#2c3e6e' }), -7.95, 1.8, -2, R2));
  for (const z of [-1.2, -0.4]) st.add(at(trashCan({}), 7.4, 0, z));
  for (let k = 0; k < 4; k++) { const p = ceilingLamp({ intensity: 2.2 }); p.position.set(-6 + k * 4, 3.2, 0); st.add(p); }
  const seat = (t, side, i) => [-6.2 + (i % 3) * 2 + (i >= 3 ? 8.4 : 0), TZ[t] + side * 0.72, side > 0 ? PI : 0];
  return { ...r, tz: TZ, seat, tableTop: 0.76 };
}

// ---------------------------------------------------------------- hoop: pole, backboard, orange ring (rim height 3.05), net. Faces +x; at(hoop, x, 0, 0, yaw).
export function hoop(o = {}) {
  const g = group(cyl(0.08, 0.1, 3.4, mat('#3a3a44', { metal: 0.6 }), -1.2, 1.7, 0), box(1.25, 0.08, 0.08, mat('#3a3a44', { metal: 0.6 }), -0.6, 3.35, 0));
  g.add(box(0.05, 1.05, 1.8, mat('#f4f4f8', { rough: 0.4 }), 0, 3.4, 0), box(0.06, 0.45, 0.6, mat('#d8343a', { keepSat: true }), 0.005, 3.3, 0));
  const ring = torus(0.23, 0.02, mat('#ff6a1a', { keepSat: true, metal: 0.4 }), 0.26, 3.05, 0); ring.rotation.x = R2; g.add(ring);
  g.add(cyl(0.23, 0.14, 0.4, mat('#f4f4f8', { transparent: true, opacity: 0.55, wireframe: true }), 0.26, 2.83, 0, 12));
  return g;
}

// ---------------------------------------------------------------- outdoor basketball court: asphalt 28 × 15 centred at the origin (length along x), hoops at x = ±11.5 (rim 3.05),
// a chain-link fence, benches on the z +9 side, the school behind (z −16). For an indoor game use T.W.gym.
export function court(st, o = {}) {
  const M = st.M; st.add(ground(140, 90, M.grass || '#5a7a5a'));
  const lines = canvasTex(1024, 560, (g, W, H) => { g.fillStyle = o.color || '#3a6a8a'; g.fillRect(0, 0, W, H); g.fillStyle = o.key || '#c8503a'; g.fillRect(0, H / 2 - 90, 180, 180); g.fillRect(W - 180, H / 2 - 90, 180, 180);
    g.strokeStyle = '#f4f0e8'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20); g.beginPath(); g.moveTo(W / 2, 10); g.lineTo(W / 2, H - 10); g.stroke(); g.beginPath(); g.arc(W / 2, H / 2, 66, 0, 7); g.stroke();
    for (const s of [0, 1]) { g.beginPath(); g.arc(s ? W - 52 : 52, H / 2, 240, s ? R2 : -R2, s ? -R2 : R2, !s); g.stroke(); g.strokeRect(s ? W - 190 : 10, H / 2 - 90, 180, 180); } });
  st.add(ground(32, 19, '#5a5660', asphalt('#5a5660', [6, 4]), { rough: 0.95, y: 0.005 }), ground(28, 15, '#ffffff', lines, { rough: 0.85, y: 0.01 }));
  st.add(at(hoop(), -11.5 - 0.26, 0, 0, 0), at(hoop(), 11.5 + 0.26, 0, 0, PI));
  const fence = mat('#8a8a94', { metal: 0.6, transparent: true, opacity: 0.45, wireframe: true });
  for (const [w, x, z, ry] of [[34, 0, -10, 0], [34, 0, 10, 0], [20, -17, 0, R2], [20, 17, 0, R2]]) { const f = plane(w, 3, fence, x, 1.5, z); f.rotation.y = ry; st.add(f); }
  for (let x = -16; x <= 16; x += 4) for (const z of [-10, 10]) st.add(cyl(0.04, 0.04, 3.1, mat('#6a6a74', { metal: 0.6 }), x, 1.55, z));
  for (const x of [-5, 0, 5]) st.add(at(bench({ color: '#2f5a8a' }), x, 0, 8.6, PI));
  if (o.school !== false) facade(st, -18, o.name);
  for (const [x, z] of [[-24, -6], [24, -4], [-22, 14], [22, 12]]) st.add(at(tree({ s: 1.3, seed: x | 0, color: '#3a5a48' }), x, 0, z));
  return { hoops: [[-11.5, 3.05, 0], [11.5, 3.05, 0]], half: 14, bench: [0, 8.6] };
}

// ---------------------------------------------------------------- the PE yard (sân thể dục): a grass pitch 40 × 24 (length along x), a running lane round it, small goals at x = ±18,
// a whistle bench for the coach at (−6, 13), the school at z −22, a fence. Day light by default.
export function schoolYard(st, o = {}) {
  const M = st.M; st.add(ground(160, 110, shade(M.grass || '#5a7a5a', -0.05)));
  const pitch = canvasTex(1024, 620, (g, W, H) => { for (let x = 0; x < W; x += 64) { g.fillStyle = (x / 64) % 2 ? '#5f9a52' : '#6aa85c'; g.fillRect(x, 0, 64, H); }
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.strokeRect(12, 12, W - 24, H - 24); g.beginPath(); g.moveTo(W / 2, 12); g.lineTo(W / 2, H - 12); g.stroke(); g.beginPath(); g.arc(W / 2, H / 2, 70, 0, 7); g.stroke();
    for (const s of [0, 1]) g.strokeRect(s ? W - 132 : 12, H / 2 - 120, 120, 240); });
  st.add(ground(54, 36, '#b8604a', null, { rough: 0.95, y: 0.004 }), ground(40, 24, '#ffffff', pitch, { rough: 0.95, y: 0.01 }));
  for (let k = 1; k < 4; k++) for (const z of [12 + k * 1.1, -12 - k * 1.1]) st.add(box(54, 0.005, 0.05, mat('#f4f0e8'), 0, 0.012, z));
  for (const s of [-1, 1]) { const goal = group(box(0.08, 2, 0.08, '#f4f4f8', 0, 1, -1.5), box(0.08, 2, 0.08, '#f4f4f8', 0, 1, 1.5), box(0.08, 0.08, 3.08, '#f4f4f8', 0, 2, 0),
      plane(3, 2, mat('#f4f4f8', { transparent: true, opacity: 0.4, wireframe: true }), -0.8, 1, 0)); goal.children[3].rotation.y = R2; st.add(at(goal, s * 18, 0, 0, s > 0 ? 0 : PI)); }
  st.add(at(bench({ color: '#3f6a58' }), -6, 0, 13, PI), at(bench({ color: '#3f6a58' }), 6, 0, 13, PI));
  const fence = mat('#8a8a94', { metal: 0.6, transparent: true, opacity: 0.4, wireframe: true });
  for (const [w, x, z, ry] of [[60, 0, 17, 0], [34, -29, 0, R2], [34, 29, 0, R2]]) { const f = plane(w, 2.4, fence, x, 1.2, z); f.rotation.y = ry; st.add(f); }
  if (o.school !== false) facade(st, -22, o.name);
  for (let i = 0; i < 10; i++) st.add(at(tree({ s: 1.4, seed: i + 3, color: '#3a5a48' }), -40 + i * 9, 0, 22 + (i % 3) * 3));
  return { goals: [[-18, 0], [18, 0]], coach: [-6, 13], lane: 13.2, centre: [0, 0] };
}
