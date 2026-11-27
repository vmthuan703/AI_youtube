// engine/places10.js — 1.0 everyday places (exposed as T.W.* through world3d.js). Each set builds into the stage and
// returns anchors, so a shot only picks a set and places people. All sets use the 1.0 look helpers (mirror floors, sky
// dome, light shafts, AO strips, string lights), which switch off with ?legacy.
//
//   const s = T.W.stairwell(st)    // school stairwell, two flights + landing; s.up = climb path (T.climb), s.landing, s.window
//   const c = T.W.classroom(st)    // 4×3 desks facing the board at z = -d/2; c.seat(row, col) → [x, z, yaw]; c.teacher, c.board
//   const b = T.W.cityBusStop(st)  // shelter + city bus at the curb; b.door, b.step, b.walk, b.bench(i) → [x, z, yaw]
//   const p = T.W.shopStreet(st)   // shophouses with awnings, signs, string lights, café tables; p.shops[i].door, p.walk, p.table(i)
//   const r = T.W.residential(st)  // brownstone row with stoops; r.stoops[i] = { base, top, door, up (climb path) }
//   const f = T.W.streetFood(st)   // night food stall, steam, low tables and stools; f.vendor, f.seat(i), f.counter
//   const k = T.W.cafe(st)         // café interior: counter, espresso machine, pendants, window; k.seat(i), k.barista, k.counter
//   T.W.passersby(st, { cast: [...], lane: [-20, 20, 0.2], n: 6 }) // roster extras walking along a sidewalk (they tick themselves)
// Props: stairs, cityBus, awning, stool, lowTable, pendantLamp, scooter, menuBoard, aFrame, acUnit, planter.
import * as THREE from 'three';
import { S, mood, shade, mix, rng, clamp, lerp, noise } from './core.js';
import { mat, box, rbox, cyl, sphere, plane, group, at, canvasTex, lamp, glow, glowMat, textTex, ground, cone, tiles, planks, asphalt, screen, cached, contactShadow, spot, lightCone } from './kit3d.js';
import { tree, bench, streetLamp, trashCan, table, chair, desk, bulletinBoard, wallClock, poster, plant, car, building, skyline, cup, book, hydrant, door as doorProp, whiteboard, shelf } from './world3d.js';
import { mirror, skyDome, shafts, aoStrip, stringLights } from './look10.js';
import { smoke } from './fx3d.js';
import { character, walkPose3 } from './rig3d.js';

const PI = Math.PI, R2 = PI / 2, SEAT = 0.42;
const sign = (txt, w, h, bg, fg, size = 64, font = 'Nunito') => mat('#ffffff', { map: textTex(txt, { w: 512, h: Math.max(32, Math.round(512 * h / w)), bg, color: fg, size, font }), rough: 0.6 });
const glowSign = (txt, w, h, bg, fg, size = 64, power = 1.25) => new THREE.MeshBasicMaterial({ map: textTex(txt, { w: 512, h: Math.max(32, Math.round(512 * h / w)), bg, color: fg, size, font: 'Nunito', glow: 12 }), color: new THREE.Color(power, power, power), toneMapped: false });
const isNight = (st) => /night|storm|dusk|arctic/.test(st.moodName);

// ================================================================ props
// stairs({ n, rise, run, w, color, nose, rails: 'both'|'left'|'right'|false, railColor, solid }) — climbs toward -z from z = 0.
// Returns the group with .top [x,y,z] (local), .H, .L and .path(x, y0, z0) → a climb path in world space once placed.
export function stairs(o = {}) {
  const n = o.n || 10, rise = o.rise || 0.17, run = o.run || 0.28, w = o.w || 1.6, H = n * rise, L = n * run;
  const sm = mat(o.color || '#8a8094', { rough: 0.75 }), nm = mat(o.nose || shade(o.color || '#8a8094', 0.22), { rough: 0.5 });
  const g = group();
  for (let i = 0; i < n; i++) {
    const hh = o.solid === false ? rise : rise * (i + 1), y = o.solid === false ? rise * (i + 0.5) : hh / 2;
    g.add(box(w, hh, run, sm, 0, y, -(i + 0.5) * run), box(w, 0.025, 0.05, nm, 0, rise * (i + 1) - 0.012, -i * run - 0.025));
  }
  const rails = o.rails ?? 'both', rc = mat(o.railColor || '#2a2630', { rough: 0.35, metal: 0.6 });
  for (const sx of rails === 'both' ? [-1, 1] : rails === 'left' ? [-1] : rails === 'right' ? [1] : []) {
    const x = sx * (w / 2 - 0.05), len = Math.hypot(H, L), ang = Math.atan2(H, L);
    const r = cyl(0.025, 0.025, len + 0.1, rc, x, H / 2 + 0.9, -L / 2, 10); r.rotation.x = R2 + ang; g.add(r);
    for (let i = 0; i <= n; i += 3) { const yy = rise * Math.min(n, i + 1); g.add(cyl(0.018, 0.018, 0.9, rc, x, yy + 0.45, -Math.min(n - 0.5, i + 0.5) * run, 8)); }
  }
  g.H = H; g.L = L; g.top = [0, H, -L];
  g.path = (x = 0) => { g.updateMatrixWorld(true); const P = (a, b, c) => new THREE.Vector3(a, b, c).applyMatrix4(g.matrixWorld).toArray(); return [P(x, 0, 0.5), P(x, 0, 0.05), P(x, H, -L + 0.05), P(x, H, -L - 0.45)]; };
  return g;
}
// cityBus({ color, stripe, route }) — 11 m city bus, front = +x, door on the +z side near the front. g.doorX, g.stepY.
export function cityBus(o = {}) {
  const body = mat(o.color || '#eef0f4', { rough: 0.3, metal: 0.25, rim: 0.2 }), stripe = mat(o.stripe || '#2f6fe0', { keepSat: true, rough: 0.35 }), dark = mat('#14141c', { rough: 0.6 });
  const glass = mat('#1c2638', { rough: 0.05, metal: 0.5, transparent: true, opacity: 0.6 });
  const g = group(rbox(11, 2.6, 2.5, 0.18, body, 0, 1.75, 0), box(11.02, 0.32, 2.52, stripe, 0, 0.75, 0));
  for (const sz of [-1, 1]) g.add(plane(9.6, 1.05, glass, -0.2, 2.25, sz * 1.255).rotateY(sz < 0 ? PI : 0));
  g.add(at(plane(2.3, 1.4, glass), 5.51, 2.0, 0, R2), at(plane(1.6, 0.28, glowSign(o.route || '42  DOWNTOWN', 1.6, 0.28, '#120e10', '#ffb030', 70)), 5.52, 2.85, 0, R2));
  for (const [x, z] of [[-3.4, 1.2], [-3.4, -1.2], [3.6, 1.2], [3.6, -1.2]]) { const wh = cyl(0.5, 0.5, 0.32, dark, x, 0.5, z, 20); wh.rotation.x = R2; g.add(wh, at(cyl(0.26, 0.26, 0.34, mat('#9a9aa4', { metal: 0.7, rough: 0.3 }), 0, 0, 0, 14), x, 0.5, z).rotateX(R2)); }
  const door = group(box(1.1, 2.0, 0.04, glass, 0.55, 0, 0), box(1.1, 0.06, 0.06, dark, 0.55, 1.0, 0)); door.position.set(2.6, 1.55, 1.27); door.rotation.y = -(o.door ?? 1) * 1.3; g.add(door); g.door = door;
  g.add(box(1.2, 0.08, 0.3, mat('#3a3a44'), 3.2, 0.32, 1.32));
  for (const sz of [-0.8, 0.8]) g.add(at(glow('#fff4d8', 0.6, 0.9), 5.55, 0.9, sz), at(sphere(0.1, glowMat('#fff4d8', 2), 0, 0, 0, 10, 8), 5.52, 0.9, sz));
  g.doorX = 3.2; g.stepY = [0.32]; return g;
}
// striped canvas awning: awning({ w, d, colors: [a, b], stripes, drop }) — slopes down and out toward +z
export function awning(o = {}) {
  const w = o.w || 3, d = o.d || 1.2, cols = o.colors || ['#c8443a', '#f2ece0'], n = o.stripes || 10;
  const tex = canvasTex(256, 64, (g, W, H) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect((i * W) / n, 0, W / n + 1, H); } });
  const m = mat('#ffffff', { map: tex, rough: 0.85, side: THREE.DoubleSide }); const top = plane(w, d, m); top.rotation.x = -R2 + 0.32; top.position.set(0, -Math.sin(0.32) * d / 2, d / 2 * Math.cos(0.32));
  const valance = canvasTex(256, 32, (g, W, H) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.beginPath(); g.moveTo((i * W) / n, 0); g.lineTo(((i + 1) * W) / n, 0); g.lineTo(((i + 1) * W) / n, H * 0.6); g.arc(((i + 0.5) * W) / n, H * 0.6, W / n / 2, 0, PI); g.fill(); } });
  const va = plane(w, 0.22, mat('#ffffff', { map: valance, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }), 0, -Math.sin(0.32) * d - 0.11, d * Math.cos(0.32));
  top.castShadow = true; return group(top, va);
}
export const stool = (o = {}) => { const m = mat(o.color || '#d8343a', { rough: 0.45, keepSat: true }), h = o.h ?? SEAT; return group(cyl(0.17, 0.15, 0.035, m, 0, h - 0.018, 0, 16), cyl(0.15, 0.19, h - 0.035, mat(o.color || '#d8343a', { rough: 0.45, keepSat: true, transparent: true, opacity: 0.92 }), 0, (h - 0.035) / 2, 0, 16)); };
export const lowTable = (o = {}) => { const m = mat(o.color || '#2f6fe0', { rough: 0.45, keepSat: true }); const g = group(rbox(o.w || 0.7, 0.035, o.d || 0.5, 0.01, m, 0, o.h || 0.6, 0)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.02, 0.02, (o.h || 0.6), m, sx * ((o.w || 0.7) / 2 - 0.06), (o.h || 0.6) / 2, sz * ((o.d || 0.5) / 2 - 0.06), 6)); return g; };
// pendant lamp hanging from y = 0 down by `drop`: pendantLamp({ drop, color, shade, light (true = real light), intensity })
export function pendantLamp(o = {}) {
  const drop = o.drop ?? 0.9, c = o.color || '#ffcf8a', sh = mat(o.shade || '#1e1c22', { rough: 0.4, metal: 0.5, side: THREE.DoubleSide });
  const g = group(cyl(0.004, 0.004, drop, '#111', 0, -drop / 2, 0, 4), cone(0.2, 0.22, sh, 0, -drop - 0.06, 0, 20));
  g.children[1].geometry = new THREE.ConeGeometry(0.2, 0.22, 20, 1, true); const b = sphere(0.06, glowMat(c, 2.2), 0, -drop - 0.15, 0, 10, 8); g.add(b, at(glow(c, 0.9, 0.6), 0, -drop - 0.18, 0));
  if (o.light !== false) { const L = lamp(c, o.intensity ?? 3.2, o.dist ?? 6, { bulb: false, decay: 1.5, shadow: !!o.shadow }); L.position.set(0, -drop - 0.25, 0); g.add(L); g.light = L.light; }
  const cn = lightCone(0.85, 2.0, c, 0.05); cn.position.set(0, -drop - 0.15, 0); g.add(cn); return g;
}
export function scooter(o = {}) {
  const b = mat(o.color || '#e8e2d4', { rough: 0.3, metal: 0.2, rim: 0.2 }), dk = mat('#18161c', { rough: 0.7 }), ch = mat('#b8b8c0', { metal: 0.8, rough: 0.25 });
  const g = group(rbox(0.9, 0.35, 0.36, 0.1, b, -0.15, 0.55, 0), rbox(0.55, 0.12, 0.3, 0.05, dk, -0.25, 0.8, 0), rbox(0.2, 0.6, 0.34, 0.08, b, 0.42, 0.75, 0), box(0.5, 0.04, 0.3, dk, 0.05, 0.38, 0));
  for (const x of [-0.55, 0.5]) { const w = cyl(0.21, 0.21, 0.09, dk, x, 0.21, 0, 18); w.rotation.x = R2; g.add(w); }
  g.add(cyl(0.015, 0.015, 0.55, ch, 0.47, 1.15, 0, 6).rotateX(R2), at(sphere(0.06, glowMat('#fff2d0', 1.6), 0, 0, 0, 10, 8), 0.55, 1.0, 0)); return g;
}
// menu board on the wall / a chalk A-frame on the sidewalk. lines: ['PHO  $8', ...]
const chalk = (lines, title, w = 512, h = 640) => canvasTex(w, h, (g, W, H) => { g.fillStyle = '#22262a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a6a48'; g.lineWidth = 18; g.strokeRect(0, 0, W, H);
  g.fillStyle = '#f4ecd8'; g.textAlign = 'center'; g.font = '700 64px "Nunito"'; g.fillText(title || 'MENU', W / 2, 90); g.font = '600 40px "Nunito"'; (lines || []).forEach((l, i) => { g.fillStyle = i % 2 ? '#ffd28a' : '#f4ecd8'; g.fillText(l, W / 2, 170 + i * 64); }); });
export const menuBoard = (o = {}) => { const w = o.w || 1.2, h = o.h || 1.5; return plane(w, h, mat('#ffffff', { map: chalk(o.lines || ['COFFEE   3', 'LATTE   4', 'TEA   3', 'CAKE   5'], o.title), rough: 0.9 })); };
export function aFrame(o = {}) { const m = mat('#ffffff', { map: chalk(o.lines || ['TODAY', 'SOUP', '$5'], o.title || 'OPEN', 256, 384), rough: 0.9 }), g = group();
  for (const s of [-1, 1]) { const p = plane(0.5, 0.75, m); p.position.set(0, 0.4, s * 0.12); p.rotation.x = s * 0.2; if (s < 0) p.rotation.y = PI; g.add(p); } return g; }
export const acUnit = () => group(box(0.8, 0.55, 0.32, mat('#e4e2dc', { rough: 0.6 }), 0, 0, 0), cyl(0.2, 0.2, 0.02, mat('#4a4a52'), 0.12, 0, 0.165, 18).rotateX(R2));
export const planter = (o = {}) => { const g = group(rbox(o.w || 0.9, 0.45, 0.4, 0.04, mat(o.pot || '#6a5a4e', { rough: 0.9 }), 0, 0.225, 0)); const r = rng(o.seed || 3), lm = mat(o.color || '#4f8a5a', { rough: 0.9, flat: true });
  for (let i = 0; i < 6; i++) g.add(sphere(0.16 + r() * 0.08, lm, (r() - 0.5) * (o.w || 0.9) * 0.8, 0.5 + r() * 0.12, (r() - 0.5) * 0.2, 8, 6)); return g; };

// ================================================================ helpers for sets
// a lit shop interior seen through glass: shelves, goods and a counter painted on a canvas, glowing
const shopInterior = (seed, base = '#ffd8a0', kind = 'shop') => cached('shopInt' + seed + base + kind, () => canvasTex(512, 320, (g, W, H) => {
  const r = rng(seed); const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, mix(base, '#ffffff', 0.35)); gr.addColorStop(1, shade(base, -0.35)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (kind === 'cafe') { for (let i = 0; i < 4; i++) { const x = 60 + i * 120; g.fillStyle = 'rgba(60,30,20,.55)'; g.fillRect(x - 40, H * 0.62, 80, 8); g.fillRect(x - 4, H * 0.62, 8, H * 0.38); g.fillStyle = 'rgba(255,240,200,.9)'; g.beginPath(); g.arc(x, 40, 14, 0, 7); g.fill(); } }
  else for (let y = 50; y < H - 60; y += 58) { g.fillStyle = 'rgba(60,40,40,.45)'; g.fillRect(20, y + 40, W - 40, 6); for (let x = 26; x < W - 40; x += 22 + r() * 16) { g.fillStyle = ['#d8504a', '#3a8ad6', '#f2c23a', '#5aa86a', '#e8e2d8', '#a86ad6'][(r() * 6) | 0]; const hh = 18 + r() * 20; g.fillRect(x, y + 40 - hh, 14 + r() * 6, hh); } }
  for (let i = 0; i < 2; i++) { const x = 80 + r() * (W - 160); g.fillStyle = 'rgba(30,20,30,.55)'; g.beginPath(); g.arc(x, H * 0.55, 26, 0, 7); g.fill(); g.fillRect(x - 24, H * 0.55 + 20, 48, H); }   // silhouettes of shoppers
  g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(W * 0.1, 0); g.lineTo(W * 0.35, 0); g.lineTo(W * 0.15, H); g.lineTo(-W * 0.1, H); g.fill();   // glass glint
}));
const brick = (base = '#8a4a3e', rep = [3, 3]) => canvasTex(512, 512, (g, W, H) => { g.fillStyle = shade(base, -0.25); g.fillRect(0, 0, W, H); const r = rng(9), bw = 64, bh = 28;
  for (let y = 0; y < H; y += bh) for (let x = -((y / bh) % 2) * bw / 2; x < W; x += bw) { g.fillStyle = shade(base, (r() - 0.5) * 0.2); g.fillRect(x + 2, y + 2, bw - 4, bh - 4); } }, rep);
const windowView = (night, seed = 4) => cached('winView' + night + seed, () => canvasTex(512, 384, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H);
  (night ? ['#141038', '#2a2060', '#5a3a7a'] : ['#8ab4ee', '#c4dcf6', '#f4ecdc']).forEach((c, i) => gr.addColorStop(i / 2, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const r = rng(seed); let x = 0; while (x < W) { const bw = 40 + r() * 70, bh = H * (0.35 + r() * 0.45); g.fillStyle = night ? '#1c1638' : '#9aa6c4'; g.fillRect(x, H - bh, bw, bh);
    for (let yy = H - bh + 8; yy < H - 6; yy += 14) for (let xx = x + 6; xx < x + bw - 6; xx += 11) if (r() < (night ? 0.4 : 0.25)) { g.fillStyle = night ? 'rgba(255,205,130,.9)' : 'rgba(255,255,255,.55)'; g.fillRect(xx, yy, 5, 7); } x += bw + 4; }
  if (!night) { g.fillStyle = '#5a8a5a'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(r() * W, H - 10, 30 + r() * 30, 0, 7); g.fill(); } } }));
function windowPane(w, h, night, seed, frameC = '#e8e2d8') {
  const fr = mat(frameC, { rough: 0.6 }); const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: windowView(night, seed), color: new THREE.Color(1.08, 1.08, 1.08), toneMapped: false }));
  return group(pane, box(w + 0.14, 0.08, 0.14, fr, 0, h / 2, 0.04), box(w + 0.18, 0.1, 0.24, fr, 0, -h / 2, 0.08), box(0.08, h, 0.14, fr, -w / 2, 0, 0.04), box(0.08, h, 0.14, fr, w / 2, 0, 0.04), box(0.05, h, 0.1, fr, 0, 0, 0.04), box(w, 0.05, 0.1, fr, 0, h * 0.1, 0.04));
}
// four walls, floor, ceiling for interiors (walls at x = ±w/2, z = ±d/2). o: { wall, floor, floorTex, h, ceiling, front }
function shell(st, w, d, h, o = {}) {
  const wm = mat(o.wall, { rough: 0.92, map: o.wallTex || null });
  st.add(ground(w + 0.4, d + 0.4, o.floor, o.floorTex, { rough: o.floorRough ?? 0.6 }));
  st.add(box(w + 0.4, h, 0.2, o.backMat || wm, 0, h / 2, -d / 2 - 0.1));
  if (o.front !== false) st.add(box(w + 0.4, h, 0.2, wm, 0, h / 2, d / 2 + 0.1));
  for (const sx of [-1, 1]) if (o['side' + sx] !== false) st.add(box(0.2, h, d + 0.4, wm, sx * (w / 2 + 0.1), h / 2, 0));
  if (o.ceiling !== false) st.add(box(w + 0.4, 0.12, d + 0.4, mat(shade(o.wall, 0.1), { rough: 1 }), 0, h + 0.06, 0));
  const trim = shade(o.wall, -0.32); st.add(box(w, 0.1, 0.03, trim, 0, 0.05, -d / 2 + 0.015)); for (const sx of [-1, 1]) st.add(box(0.03, 0.1, d, trim, sx * (w / 2 - 0.015), 0.05, 0));
  aoStrip(st, { from: [-w / 2, 0, -d / 2], to: [w / 2, 0, -d / 2] });
  aoStrip(st, { from: [-w / 2, 0, d / 2], to: [-w / 2, 0, -d / 2], yaw: R2 }); aoStrip(st, { from: [w / 2, 0, -d / 2], to: [w / 2, 0, d / 2], yaw: -R2 });
  if (o.front !== false) aoStrip(st, { from: [w / 2, 0, d / 2], to: [-w / 2, 0, d / 2], yaw: PI });
}
const put = (st, obj, x, z, yaw = 0, y = 0, cs = true) => { obj.position.set(x, y, z); obj.rotation.y = yaw; st.add(obj); if (cs && y < 0.2) st.add(contactShadow(obj)); return obj; };

// ================================================================ STAIRWELL (school / apartment), interior
// Flight A climbs toward -z on the left (x ≈ -1.05) from z = 1 to the landing (y = H1) at the back; flight B climbs back
// toward +z on the right (x ≈ +1.05) to the upper floor (y = 2·H1) at z ≈ 1. A low wall with a handrail runs between them.
// s.up = the whole climb path for T.climb (floor → flight A → landing → flight B → upper floor); s.upA / s.upB = one flight each.
export function stairwell(st, o = {}) {
  const M = st.M, n = o.n || 9, rise = 0.17, run = 0.28, H1 = n * rise, L = n * run, w = 4.4, d = 8, h = 2 * H1 + 3.0, night = isNight(st);
  const wallC = o.wall || mix(M.wall, '#d8d0c4', 0.45), stepC = o.steps || '#a49aa8', nose = o.nose || '#e0b64a';
  shell(st, w, d, h, { wall: wallC, floor: mix(M.floor, '#b8b0b8', 0.4), floorTex: tiles(mix(M.floor, '#b8b0b8', 0.4), 6, [3, 4]), front: false, ceiling: true, floorRough: 0.35 });
  st.add(box(w, 0.9, 0.02, mat(shade(wallC, -0.18), { rough: 0.9 }), 0, 0.45, -d / 2 + 0.01));   // painted dado on the back wall
  const z0 = 1.0, zL = z0 - L, landD = d / 2 + zL;   // landing from zL back to the wall
  const A = stairs({ n, w: 1.9, color: stepC, nose, rails: 'left' }); A.position.set(-1.1, 0, z0); st.add(A);
  const land = box(w, H1, landD, mat(stepC, { rough: 0.7 }), 0, H1 / 2, zL - landD / 2); st.add(land, box(w, 0.03, 0.05, mat(nose), 0, H1 - 0.01, zL - 0.02));
  const B = stairs({ n, w: 1.9, color: stepC, nose, rails: 'right' }); B.position.set(1.1, H1, zL); B.rotation.y = PI; st.add(B);
  st.add(box(2.2, 0.15, d / 2 - z0 + 0.2, mat(stepC), 1.1, 2 * H1 - 0.075, z0 + (d / 2 - z0) / 2));   // upper floor slab
  st.add(box(2.0, H1, L, mat(shade(wallC, -0.08), { rough: 0.9 }), 1.1, H1 / 2, z0 - L / 2), box(2.0, 2 * H1, 0.12, mat(shade(wallC, -0.08), { rough: 0.9 }), 1.1, H1, z0 + 0.06));   // closed in under flight B
  // the knee wall between the flights, sloped along flight A, with a wooden handrail on top
  const kw = new THREE.Shape(); kw.moveTo(0, 0); kw.lineTo(L, 0); kw.lineTo(L, H1 + 0.95); kw.lineTo(0, 0.95); kw.closePath();
  const kg = new THREE.ExtrudeGeometry(kw, { depth: 0.14, bevelEnabled: false }); const km = new THREE.Mesh(kg, mat(shade(wallC, -0.06), { rough: 0.9 })); km.rotation.y = R2; km.position.set(-0.07, 0, z0); km.castShadow = km.receiveShadow = true; st.add(km);
  const hr = cyl(0.045, 0.045, Math.hypot(L, H1) + 0.1, mat('#8a5a3a', { rough: 0.45, clearcoat: 0.5 }), 0, H1 / 2 + 0.98, z0 - L / 2, 12); hr.rotation.x = R2 + Math.atan2(H1, L); st.add(hr);
  // a tall window over the landing; daylight (or moonlight) falls in as shafts onto the landing and the steps
  const ww = 1.8, wh = 2.2, wy = H1 + 1.9; const win = windowPane(ww, wh, night, 7); win.position.set(0, wy, -d / 2 + 0.02); st.add(win);
  const sun = spot(night ? '#9fb0ff' : '#fff0d0', night ? 30 : 70, { pos: [0, wy + 0.6, -d / 2 + 0.6], target: [-0.6, 0, z0 - 0.5], angle: 0.6, penumbra: 0.5, dist: 14 }); st.add(sun);
  shafts(st, { pos: [0, wy + 0.4, -d / 2 + 0.15], dir: [-0.15, -0.75, 0.65], len: 6.5, w: 0.5, h: 1.6, n: 2, gap: 0.9, along: [1, 0, 0], color: night ? '#a8b8ff' : '#fff2d8', opacity: night ? 0.1 : 0.15, motes: 110 });
  // signage and lights
  st.add(at(plane(0.7, 0.35, sign(o.floorLabel || '2F', 0.7, 0.35, '#2c3e6e', '#ffffff', 150)), w / 2 - 0.01, H1 + 2.6, -0.5, -R2));
  st.add(at(plane(0.9, 0.3, glowSign('EXIT', 0.9, 0.3, '#16a04a', '#ffffff', 120, 1.4)), -w / 2 + 0.01, 2.5, 2.2, R2));
  for (const [x, y, z] of [[-1.1, h - 0.05, 2], [0, h - 0.05, -2.5]]) { st.add(box(1.3, 0.04, 0.2, glowMat('#fff4e6', 1.5), x, y, z)); const Lt = lamp('#fff0dc', o.lamp ?? 5, 9, { bulb: false, shadow: x < 0 }); Lt.position.set(x, y - 0.3, z); st.add(Lt); }
  st.add(at(bulletinBoard({ seed: 4, w: 1.0, h: 0.7 }), -w / 2 + 0.03, 1.5, 2.6, R2));
  mirror(st, { w, d: d / 2 - z0, z: (z0 + d / 2) / 2, strength: 0.22, blur: 1.6 });   // the polished ground floor in front of the stairs
  const pA = A.path(0), pB = B.path(0);
  const up = [[-1.1, 0, z0 + 1.6], ...pA.slice(1, 3), [-1.1, H1, zL - 0.6], [1.1, H1, zL - 0.6], ...pB.slice(1, 3), [1.1, 2 * H1, z0 + 1.0]];
  return { up, upA: [[-1.1, 0, z0 + 1.6], ...pA.slice(1), [-1.1, H1, zL - 0.7]], upB: [[1.1, H1, zL - 0.5], ...pB.slice(1)], landing: [0, H1, zL - landD / 2], H1, z0, zL, window: win, A, B, w, d };
}

// ================================================================ CLASSROOM, interior with daylight from tall windows on the left
// Board on the back wall (z = -d/2), 4 columns × 3 rows of desks facing it; a teacher's desk front-left of the board.
// c.seat(row, col) → [x, z, yaw] for T.character(..., { pose: 'sitStudy' }) (row 0 = front; desks are 0.645 high so forearms rest on them). c.teacher → [x, z, yaw] standing at the board.
export function classroom(st, o = {}) {
  const M = st.M, w = o.w || 10, d = o.d || 9.5, h = o.h || 3.3, night = isNight(st), rows = o.rows || 3, cols = o.cols || 4;
  const wallC = o.wall || mix(M.wall, '#e4d8c4', 0.5);
  shell(st, w, d, h, { wall: wallC, floor: o.floor || '#b49a7a', floorTex: planks(o.floor || '#b49a7a', 14, [w / 2.5, d / 2.5]), floorRough: 0.42 });
  st.add(box(w, 1.0, 0.02, mat(shade(wallC, -0.14), { rough: 0.9 }), 0, 0.5, -d / 2 + 0.01), box(w, 0.05, 0.04, shade(wallC, 0.15), 0, 1.0, -d / 2 + 0.02));
  // chalkboard with chalk writing (o.board: lines; o.boardDraw(g, W, H) to draw your own)
  const bw = 4.4, bh = 1.45; const btex = canvasTex(1024, 340, (g, W, H) => { g.fillStyle = '#23402f'; g.fillRect(0, 0, W, H); const r = rng(5); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(r() * W, r() * H, 80 + r() * 160, 20 + r() * 40); }
    if (o.boardDraw) o.boardDraw(g, W, H); else { g.fillStyle = '#f2efe4'; g.font = '600 54px "Nunito"'; (o.board || ['WHAT IF...?', 'E = mc²     a² + b² = c²']).forEach((l, i) => g.fillText(l, 60, 90 + i * 80)); g.strokeStyle = '#f2efe4'; g.lineWidth = 4; g.beginPath(); g.arc(W - 170, H / 2, 80, 0, 7); g.moveTo(W - 250, H / 2); g.lineTo(W - 90, H / 2); g.stroke(); } });
  st.add(group(box(bw + 0.16, bh + 0.16, 0.05, mat('#7a5a3a', { rough: 0.6 }), 0, 0, 0), at(plane(bw, bh, mat('#ffffff', { map: btex, rough: 0.95 })), 0, 0, 0.03), box(bw, 0.05, 0.1, mat('#7a5a3a'), 0, -bh / 2 - 0.05, 0.06)).translateX(0).translateY(1.75).translateZ(-d / 2 + 0.03));
  put(st, wallClock({ time: o.clock || '9:05' }), bw / 2 + 0.7, -d / 2 + 0.03, 0, 2.6, false);
  put(st, poster({ text: 'READ', c1: '#5a7a96', c2: '#3a2a5a', w: 0.55, h: 0.75 }), -bw / 2 - 0.8, -d / 2 + 0.03, 0, 1.75, false);
  // windows on the left wall, sun coming in as shafts that land on the desks
  for (let i = 0; i < 3; i++) { const z = -d / 2 + 1.8 + i * 2.6; const wv = windowPane(1.8, 1.7, night, 3 + i); wv.position.set(-w / 2 + 0.02, 1.85, z); wv.rotation.y = R2; st.add(wv); }
  const sunC = night ? '#a8b8ff' : '#fff0d4'; const sun = spot(sunC, night ? 25 : 90, { pos: [-w / 2 - 1.5, 4.2, 0.5], target: [1.0, 0, 0.5], angle: 0.85, penumbra: 0.6, dist: 22 }); st.add(sun);
  shafts(st, { pos: [-w / 2 + 0.1, 2.55, -d / 2 + 1.8], dir: [0.8, -0.58, 0.12], len: 6, w: 1.6, h: 1.5, n: 3, gap: 2.6, along: [0, 0, 1], color: sunC, opacity: night ? 0.07 : 0.13, motes: 140 });
  // right wall: door, cork board, cubbies at the back (front wall)
  put(st, doorProp({ color: '#6a4a36' }), w / 2 - 0.03, d / 2 - 1.4, -R2, 0, false); put(st, bulletinBoard({ seed: 7 }), w / 2 - 0.03, -0.5, -R2, 1.6, false);
  for (let i = 0; i < 6; i++) { const x = -w / 2 + 1.2 + i * 0.75; put(st, group(box(0.7, 1.1, 0.4, mat('#a88660', { rough: 0.7 }), 0, 0.55, 0), box(0.6, 0.45, 0.02, mat('#2a2028'), 0, 0.8, 0.2), box(0.6, 0.45, 0.02, mat('#2a2028'), 0, 0.3, 0.2)), x, d / 2 - 0.25, PI); }
  // ceiling light panels (glow), two real lights
  for (const x of [-2.4, 2.4]) for (const z of [-2.2, 1.8]) st.add(box(1.2, 0.04, 0.6, glowMat('#fff6ea', 1.25), x, h - 0.03, z));
  for (const z of [-2.2, 1.8]) { const L = lamp('#fff2e0', o.lamp ?? 4, 10, { bulb: false }); L.position.set(0, h - 0.4, z); st.add(L); }
  // desks: student desks with a chair, books, a backpack on some chairs; o.seed varies the clutter
  const r = rng(o.seed || 3), seats = [], dx = 1.9, dz = 1.7, x0 = -((cols - 1) * dx) / 2 + 0.3, zF = -d / 2 + 3.1;
  const bagCols = ['#c8443a', '#2f6fe0', '#3a8a5a', '#e8b030', '#7a4ab0'];
  for (let ri = 0; ri < rows; ri++) for (let ci = 0; ci < cols; ci++) { const x = x0 + ci * dx, z = zF + ri * dz;
    const dk = put(st, table({ w: 0.95, d: 0.55, h: 0.62, color: '#c8a070' }), x, z); put(st, chair({ color: '#3a4a7a' }), x, z + 0.5, PI);
    if (r() < 0.7) put(st, book({ color: bagCols[(r() * 5) | 0] }), x - 0.32 + r() * 0.12, z - 0.1, r() * 0.6, 0.645, false);
    if (r() < 0.5) put(st, group(rbox(0.3, 0.4, 0.16, 0.06, mat(bagCols[(r() * 5) | 0], { rough: 0.8 }), 0, 0.2, 0)), x + 0.32, z + 0.5, PI, 0.05, false);
    seats.push([x, z + 0.5, PI]); }
  put(st, desk({ color: '#5a3a2a', w: 1.5 }), -bw / 2 - 0.4, -d / 2 + 1.5, 0); put(st, chair({ color: '#2a2430' }), -bw / 2 - 0.4, -d / 2 + 0.9, 0);
  put(st, cup({ color: '#e8e0d0' }), -bw / 2 - 0.1, -d / 2 + 1.5, 0, 0.78, false); put(st, plant({}), w / 2 - 0.6, -d / 2 + 0.6);
  mirror(st, { w, d, strength: 0.14, blur: 2.2 });
  return { seat: (row, col) => seats[clamp(row, 0, rows - 1) * cols + clamp(col, 0, cols - 1)], seats, teacher: [0.6, -d / 2 + 1.2, 0], board: [0, 1.75, -d / 2], w, d, h };
}

// ================================================================ CITY BUS STOP (trạm xe), road along x
// Sidewalk z ∈ [-4, 1] (top y 0.15), road z ∈ [1, 10], buildings at z ≈ -9. Shelter centred at x = shelterX with a lit ad panel,
// bench and a timetable; the bus at the curb with its door at b.door. b.bench(i) → [x, z, yaw] (sit pose, y = 0.15).
export function cityBusStop(st, o = {}) {
  const M = st.M, night = isNight(st), r = rng(o.seed || 8), sx = o.shelterX ?? 0, bx = o.busX ?? 3;
  st.add(ground(220, 120, shade(M.floor, -0.05), null, { y: -0.01 }));
  const road = box(220, 0.02, 9, mat(M.road, { map: asphalt(M.road, [40, 2]), rough: o.wet ? 0.3 : 0.88 }), 0, 0.01, 5.5); st.add(road);
  const swC = mix(M.floor, '#b8b0b4', 0.45); st.add(box(220, 0.15, 5, mat(swC, { map: tiles(swC, 8, [60, 1.6], 'rgba(0,0,0,.18)') }), 0, 0.075, -1.5), box(220, 0.16, 0.16, mat(shade(swC, 0.2)), 0, 0.08, 0.98));
  for (let x = -100; x < 100; x += 5) st.add(box(2.6, 0.005, 0.13, mat('#efe8d0'), x, 0.022, 5.5));
  const cw = canvasTex(256, 256, (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(240,240,240,.85)'; for (let i = 0; i < 8; i++) g.fillRect(i * 32 + 6, 0, 18, H); });
  st.add(at(plane(4, 9, new THREE.MeshStandardMaterial({ map: cw, transparent: true, roughness: 0.7 })), sx - 12, 0.024, 5.5).rotateX(-R2));
  // shelter: glass back, roof, lit ad panel at one end, bench, timetable pole
  const fm = mat('#2a2e38', { rough: 0.4, metal: 0.6 }), gl = mat('#bcd4e8', { rough: 0.05, metal: 0.2, transparent: true, opacity: 0.22 });
  const sh = group(box(4.2, 0.1, 1.7, fm, 0, 2.55, 0), box(4.3, 0.04, 1.8, mat('#d8dce4', { rough: 0.3 }), 0, 2.62, 0));
  for (const x of [-2, 2]) sh.add(box(0.08, 2.5, 0.08, fm, x, 1.25, -0.75)); sh.add(plane(3.9, 2.0, gl, 0, 1.3, -0.78));
  const ad = screen(1.2, 1.9, (g, W, H, t) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ff7a5a'); gr.addColorStop(1, '#7a3aa8'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff'; g.font = '800 64px "Nunito"'; g.textAlign = 'center'; g.fillText(o.ad || 'WHAT IF?', W / 2, H * 0.3); g.font = '600 30px "Nunito"'; g.fillText(o.adSub || 'NOW PLAYING', W / 2, H * 0.4); g.beginPath(); g.arc(W / 2, H * 0.68, W * 0.22, 0, 7); g.fillStyle = 'rgba(255,255,255,.9)'; g.fill(); }, { power: 1.1 });
  sh.add(box(1.35, 2.05, 0.18, fm, 2.0, 1.2, 0), at(ad, 2.0, 1.2, 0.095)); const adL = lamp('#ffb0a0', 1.8, 4, { bulb: false }); adL.position.set(2.0, 1.2, 0.6); sh.add(adL);
  const bnch = bench({ color: '#6a5a4a' }); bnch.position.set(-0.6, 0, -0.45); sh.add(bnch);
  sh.position.set(sx, 0.15, -1.3); st.add(sh); st.add(contactShadow(bnch));
  st.add(at(group(cyl(0.04, 0.04, 2.6, fm, 0, 1.3, 0, 8), at(plane(0.45, 0.6, sign('BUS\n42  7', 0.45, 0.6, '#2f6fe0', '#ffffff', 90)), 0, 2.2, 0.03)), sx - 3.2, 0.15, 0.4));
  const bus = cityBus({ route: o.route }); bus.position.set(bx, 0, 2.55); bus.rotation.y = PI; st.add(bus);
  // street behind: buildings, lamps, trees
  const pal = [mix(M.wall, '#c89a8a', 0.4), mix(M.wall, '#9aa0c8', 0.4), mix(M.wall, '#d8c09a', 0.4), shade(M.wall, 0.1)];
  let x = -70; while (x < 70) { const bw2 = 7 + r() * 6, bh = 10 + r() * 16; const b = building(bw2, bh, 8, { color: pal[(r() * pal.length) | 0], seed: (r() * 1e4) | 0, lit: night ? 0.55 : 0.2, glow: night ? 0.9 : 0.25, shop: true, awning: r() < 0.5 }); b.position.set(x + bw2 / 2, 0, -9); st.add(b); x += bw2 + 0.3; }
  for (let lx = -40; lx <= 40; lx += 16) { const l = streetLamp({ light: Math.abs(lx - sx) < 20 && night, mood: st.moodName }); l.position.set(lx + 6, 0.15, 0.6); l.rotation.y = 0; st.add(l); }
  for (const tx of [-20, -9, 11, 24]) st.add(at(tree({ s: 1.1, seed: tx & 255, color: M.tree || shade(M.grass, -0.2) }), sx + tx, 0.15, -3.4));
  st.add(at(trashCan({}), sx + 3.6, 0.15, -3.3), at(hydrant({}), sx + 5, 0.15, 0.4));
  if (!night) skyDome(st, { clouds: 12 }); else st.add(skyline({ color: shade(M.wall, -0.4), seed: 5 }));
  if (o.wet) mirror(st, { w: 220, d: 9, z: 5.5, y: 0.02, strength: 0.45, blur: 1.4 });
  const dX = bx - bus.doorX;
  return { bus, door: [dX, 0.9, 1.4], step: [[dX, 0.32, 1.35]], walk: 0.15, curbZ: 1.0, shelter: sh, bench: (i = 0) => [sx - 1.25 + i * 0.6, -1.65, 0], ad };
}

// ================================================================ SHOP STREET (phố phường): shophouses along x at z = -3, sidewalk z ∈ [-3, 1]
// Each shop: lit glass front, awning, sign, upper floors with balconies, AC units and plants. String lights cross the street
// above the sidewalk. p.shops[i] = { x, w, door: [x, z] }, p.table(i) → [x, z] café tables on the sidewalk, p.walk (sidewalk top y).
export function shopStreet(st, o = {}) {
  const M = st.M, night = isNight(st), r = rng(o.seed || 12), len = o.length || 60;
  const names = o.names || ['NOODLES', 'BAKERY', 'BOOKS', 'PHONE FIX', 'FLOWERS', 'CAFE', 'TEA', 'ARCADE', 'PHARMACY', 'DONUTS'];
  const pal = o.palette || ['#e0a98f', '#a99be0', '#e8c47e', '#8fc0a8', '#d88a9a', '#9ab4d8', '#e8b8a0', '#c8a0d0'];
  const awn = [['#c8443a', '#f2ece0'], ['#2f6f6a', '#f2ece0'], ['#e8a030', '#fff4e0'], ['#3a5ab0', '#f2ece0'], ['#7a3aa0', '#f4e8f8']];
  st.add(ground(240, 140, shade(M.floor, -0.1), null, { y: -0.01 }));
  st.add(box(240, 0.02, 10, mat(M.road, { map: asphalt(M.road, [40, 2]), rough: o.wet ? 0.3 : 0.88 }), 0, 0.01, 6));
  const swC = mix(M.floor, '#c8b8a8', 0.45); st.add(box(240, 0.15, 4.2, mat(swC, { map: tiles(swC, 6, [70, 1.4], 'rgba(0,0,0,.2)'), rough: o.wet ? 0.35 : 0.85 }), 0, 0.075, -1), box(240, 0.16, 0.16, mat(shade(swC, 0.2)), 0, 0.08, 1.05));
  const shops = []; let x = -len / 2;
  while (x < len / 2) { const w = 4 + r() * 2.5, floors = 2 + ((r() * 2) | 0), fh = 3.1, H = floors * fh + 0.6, c = pal[(r() * pal.length) | 0], cx = x + w / 2, i = shops.length;
    const g = group(); const wallM = mat(c, { rough: 0.9 });
    g.add(box(w - 0.06, H, 6, wallM, 0, H / 2, -3), box(w, 0.35, 6.3, mat(shade(c, -0.25)), 0, H + 0.1, -3), box(w, 0.18, 0.35, mat(shade(c, 0.18)), 0, fh + 0.1, 0.12));
    // ground floor: pilasters, glass front with the lit interior, door, sign board, awning
    for (const sx of [-1, 1]) g.add(box(0.3, fh, 0.3, mat(shade(c, -0.12)), sx * (w / 2 - 0.18), fh / 2, 0.05));
    const gw = w - 1.6, int = new THREE.Mesh(new THREE.PlaneGeometry(gw, 2.0), new THREE.MeshBasicMaterial({ map: shopInterior(i * 7 + 3, ['#ffd8a0', '#ffe8c8', '#f4d0ff', '#c8f0ff'][i % 4], names[i % names.length] === 'CAFE' ? 'cafe' : 'shop'), color: new THREE.Color(night ? 1.25 : 0.95, night ? 1.2 : 0.95, night ? 1.1 : 0.95), toneMapped: false }));
    int.position.set(-0.5, 1.2, 0.02); g.add(int, box(gw + 0.1, 0.08, 0.1, mat('#2a2630'), -0.5, 2.22, 0.05), box(gw + 0.1, 0.25, 0.12, mat('#2a2630'), -0.5, 0.12, 0.05));
    g.add(box(0.9, 2.15, 0.06, mat('#3a2e2a', { rough: 0.5 }), w / 2 - 0.85, 1.08, 0.03), box(0.04, 0.4, 0.04, mat('#c8b070', { metal: 0.8, rough: 0.3 }), w / 2 - 1.15, 1.05, 0.08));
    const nm = names[i % names.length], sg = night && r() < 0.6 ? glowSign(nm, w - 0.8, 0.55, '#1a1422', ['#ffd060', '#ff6a8a', '#6ae0ff', '#a0ff8a'][i % 4], 110, 1.5) : sign(nm, w - 0.8, 0.55, shade(c, -0.45), '#fff4e0', 110);
    g.add(plane(w - 0.8, 0.55, sg, 0, 2.62, 0.2));
    const aw = awning({ w: w - 0.5, d: 1.3, colors: awn[i % awn.length] }); aw.position.set(0, 2.35, 0.2); g.add(aw);
    if (night) { const L = lamp('#ffd8a0', 2.4, 5, { bulb: false, decay: 1.6 }); L.position.set(-0.5, 1.6, 1.0); g.add(L); }
    // upper floors: windows (lit at night), small balconies with plants, AC units
    for (let f = 1; f < floors; f++) { const y = f * fh + 1.5; for (const wx of w > 5 ? [-w / 4, w / 4] : [0]) { const on = r() < (night ? 0.7 : 0.15);
        g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), on ? glowMat(mix(M.practical, '#ffffff', 0.15), night ? 1.15 : 0.7) : mat('#2a3040', { rough: 0.15, metal: 0.4 })).translateX(wx).translateY(y).translateZ(0.02));
        g.add(box(1.3, 0.1, 0.16, mat('#e8e2d8'), wx, y - 0.75, 0.08), box(1.3, 0.1, 0.1, mat('#e8e2d8'), wx, y + 0.75, 0.05));
        if (r() < 0.5) { g.add(box(1.4, 0.08, 0.55, mat('#4a4450'), wx, y - 0.95, 0.3)); for (let k = 0; k < 4; k++) g.add(box(0.025, 0.7, 0.025, mat('#2a2630', { metal: 0.5 }), wx - 0.65 + k * 0.43, y - 0.6, 0.55)); g.add(box(1.4, 0.04, 0.04, mat('#2a2630'), wx, y - 0.25, 0.55)); g.add(at(planter({ w: 0.6, seed: f + i }), wx + 0.3, y - 0.91, 0.3, 0, 0.7)); }
        else if (r() < 0.6) g.add(at(acUnit(), wx + 0.85, y - 0.6, 0.2)); } }
    g.position.set(cx, 0.15, -3.0); st.add(g); shops.push({ x: cx, w, door: [cx + w / 2 - 0.85, -2.6], name: nm }); x += w;
  }
  // sidewalk life: café tables with stools, a scooter row, planters, an A-frame board, lamps
  const tables = [];
  for (let k = 0; k < (o.tables ?? 4); k++) { const tx = -len / 2 + 6 + k * (len - 12) / Math.max(1, (o.tables ?? 4) - 1); const t2 = lowTable({ color: ['#2f6fe0', '#d8343a', '#3a8a5a'][k % 3], h: 0.62 }); put(st, t2, tx, -1.4, 0, 0.15); tables.push([tx, -1.4]);
    for (const [ox, oz] of [[-0.55, 0], [0.55, 0]]) put(st, stool({ color: ['#d8343a', '#2f6fe0', '#f2b632'][(k + (ox > 0 ? 1 : 0)) % 3] }), tx + ox, -1.4 + oz, 0, 0.15); }
  for (let k = 0; k < (o.scooters ?? 5); k++) put(st, scooter({ color: ['#e8e2d4', '#d8343a', '#2f6fe0', '#2a2a30', '#8fc0a8'][k % 5] }), -len / 2 + 3 + k * 1.1 + (k > 2 ? 18 : 0), 0.4, 0.25, 0.15);
  put(st, aFrame({}), (shops[2]?.x ?? 0) + 1.2, -1.9, 0.3, 0.15);
  for (let lx = -len / 2 + 4; lx < len / 2; lx += 12) { const l = streetLamp({ light: night && Math.abs(lx - (o.focus?.[0] ?? 0)) < 14, mood: st.moodName, h: 4.6 }); l.position.set(lx, 0.15, 0.7); l.rotation.y = PI; st.add(l); }
  // string lights zig-zag between the awnings and the lamp line
  for (let lx = -len / 2 + 2; lx < len / 2 - 4; lx += 6) st.add(stringLights({ from: [lx, 3.9, -2.4], to: [lx + 6, 4.1, 0.7], n: 11, sag: 0.35, lights: night && Math.abs(lx) < 10 ? 1 : 0, colors: ['#ffd48a', '#ffb070', '#fff0c0'] }));
  // the far side of the street: a low row of buildings so the reverse angle isn't empty
  for (let fx = -len / 2; fx < len / 2; fx += 7) st.add(at(building(6.6, 7 + r() * 8, 6, { color: pal[(r() * pal.length) | 0], seed: (r() * 1e4) | 0, lit: night ? 0.5 : 0.15, glow: night ? 0.9 : 0.25 }), fx + 3.3, 0, 15, PI));
  if (night) st.add(skyline({ color: shade(M.wall, -0.4), seed: 6 })); else skyDome(st, { clouds: 14 });
  if (o.wet) mirror(st, { w: 240, d: 10, z: 6, y: 0.02, strength: 0.5, blur: 1.2 });
  if (o.wet || o.glossWalk) mirror(st, { w: 240, d: 4.2, z: -1, y: 0.152, strength: o.wet ? 0.35 : 0.15, blur: 1.6 });
  return { shops, walk: 0.15, curbZ: 1.05, table: (i = 0) => tables[i % tables.length], tables };
}

// ================================================================ RESIDENTIAL street (khu dân cư): brownstone row with stoops
// Houses face +z with fronts at z = -5; stoops climb from the sidewalk (z ≈ -2.6) to the doors (y ≈ 1.45). Sidewalk z ∈ [-5, 1].
// r.stoops[i] = { base:[x,y,z], top:[x,y,z], door:[x,y,z], up: climb path for T.climb }.
export function residential(st, o = {}) {
  const M = st.M, night = isNight(st), r = rng(o.seed || 21), n = o.houses || 7, hw = 5.2;
  const pal = o.palette || ['#9a5a48', '#7a4a42', '#a86a54', '#8a5a5a', '#6a4a48'];
  st.add(ground(220, 140, M.grass ? mix(M.grass, M.floor, 0.4) : M.floor, null, { y: -0.01 }));
  st.add(box(220, 0.02, 8, mat(M.road, { map: asphalt(M.road, [40, 2]), rough: o.wet ? 0.3 : 0.88 }), 0, 0.01, 5));
  const swC = mix(M.floor, '#b8b0a8', 0.5); st.add(box(220, 0.15, 6, mat(swC, { map: tiles(swC, 5, [55, 1.5], 'rgba(0,0,0,.2)') }), 0, 0.075, -2), box(220, 0.16, 0.16, mat(shade(swC, 0.2)), 0, 0.08, 1.0));
  const stoops = []; const x0 = -((n - 1) * hw) / 2;
  for (let i = 0; i < n; i++) { const cx = x0 + i * hw, c = pal[i % pal.length], H = 10.5 + (i % 2) * 0.6, g = group();
    g.add(box(hw - 0.05, H, 9, mat(c, { map: brick(c, [2, 4]), rough: 0.95 }), 0, H / 2, -4.5), box(hw + 0.1, 0.6, 9.4, mat('#3a2e2c', { rough: 0.6 }), 0, H + 0.2, -4.5), box(hw + 0.15, 0.25, 0.5, mat('#e0d8c8'), 0, H - 0.1, 0.2));
    g.add(box(hw - 0.05, 1.45, 0.3, mat('#8a7a6a', { rough: 0.9 }), 0, 0.72, 0.15));   // rusticated base
    const dxD = (i % 2 ? 1 : -1) * 1.3;   // door side alternates
    g.add(box(1.3, 2.6, 0.1, mat('#e0d8c8'), dxD, 2.75, 0.05), box(1.05, 2.3, 0.08, mat(['#2a3a2a', '#5a2a2a', '#2a2e48'][i % 3], { rough: 0.4, clearcoat: 0.4 }), dxD, 2.6, 0.09), box(1.5, 0.15, 0.4, mat('#e0d8c8'), dxD, 4.1, 0.2));
    const pl = lamp('#ffd8a0', night ? 2.6 : 0, 5, { bulbR: 0.07 }); pl.position.set(dxD + 0.75, 3.2, 0.3); g.add(pl);
    for (let f = 0; f < 3; f++) for (const wx of [-1.4, 0, 1.4]) { if (f === 0 && Math.abs(wx - dxD) < 1.0) continue; const y = 2.6 + f * 3.0 + (f ? 0.4 : 0);
      const on = r() < (night ? 0.75 : 0.1); g.add(new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.7), on ? glowMat(mix(M.practical, '#ffffff', 0.1), night ? 1.2 : 0.8) : mat('#2a3040', { rough: 0.1, metal: 0.4 })).translateX(wx).translateY(y).translateZ(0.02));
      g.add(box(1.15, 0.14, 0.18, mat('#e0d8c8'), wx, y - 0.92, 0.09), box(1.15, 0.22, 0.12, mat('#e0d8c8'), wx, y + 0.95, 0.06)); }
    g.position.set(cx, 0, -5.0); st.add(g);
    // stoop: 8 steps from the sidewalk up to the door, iron rails; climb path in world space
    const sp = stairs({ n: 8, rise: (1.45 - 0.15) / 8, run: 0.3, w: 1.5, color: '#9a8a7a', nose: '#b8a898', rails: 'both', railColor: '#1a1a20' }); sp.position.set(cx + dxD, 0.15, -2.6); st.add(sp);
    st.add(box(1.6, 0.06, 0.2, mat('#9a8a7a'), cx + dxD, 1.45, -4.95));
    const up = sp.path(0); up.push([cx + dxD, 1.45, -4.8]);
    stoops.push({ base: [cx + dxD, 0.15, -2.1], top: [cx + dxD, 1.45, -4.6], door: [cx + dxD, 1.45, -4.9], up, x: cx });
    // area railing along the front, bins, a tree pit
    for (let k = -hw / 2 + 0.2; k < hw / 2; k += 0.25) if (Math.abs(cx + k - (cx + dxD)) > 0.95) st.add(box(0.025, 0.9, 0.025, mat('#1a1a20', { metal: 0.4 }), cx + k, 0.6, -2.7));
    st.add(box(hw - 0.2, 0.04, 0.04, mat('#1a1a20'), cx, 1.05, -2.7));
    if (i % 2 === 0) st.add(at(trashCan({ color: '#3a4a3a' }), cx - dxD * 1.1, 0.15, -2.2), at(trashCan({ color: '#2a3a5a' }), cx - dxD * 1.1 + 0.6, 0.15, -2.2));
    if (i % 2 === 1) { st.add(box(1.2, 0.02, 1.2, mat('#4a3a2e'), cx - 1.6, 0.16, -0.2)); st.add(at(tree({ s: 1.25, seed: i * 13, color: M.tree || shade(M.grass || '#5a7a5a', -0.2) }), cx - 1.6, 0.15, -0.2)); }
  }
  for (let lx = x0 - 2; lx < x0 + n * hw; lx += 14) { const l = streetLamp({ light: night && Math.abs(lx) < 14, mood: st.moodName }); l.position.set(lx, 0.15, 0.55); l.rotation.y = PI; st.add(l); }
  const cc = ['#d63a2a', '#2a5ad6', '#e8e8ec', '#1a1a22', '#3aa06a']; for (let k = 0; k < (o.cars ?? 4); k++) { const c2 = car({ color: cc[k % 5], type: ['sedan', 'suv', 'sedan', 'van'][k % 4], lights: false }); c2.position.set(x0 + 2 + k * 8.5 + r() * 2, 0, 2.2); c2.rotation.y = R2; st.add(c2); }
  if (night) st.add(skyline({ color: shade(M.wall, -0.4), seed: 9 })); else skyDome(st, { clouds: 10 });
  if (o.wet) mirror(st, { w: 220, d: 8, z: 5, y: 0.02, strength: 0.45 });
  return { stoops, walk: 0.15, curbZ: 1.0 };
}

// ================================================================ STREET FOOD (hàng quán): a night food stall on a corner
// Stall counter faces +z at z = -1.5 (vendor stands behind it at f.vendor), pots steam, bulbs hang under the awning; low tables
// with stools spread on the pavement in front. f.seat(i) → [x, z, yaw] (stool seats, 'sit' pose, y = 0), f.counter = [x, y, z].
export function streetFood(st, o = {}) {
  const M = st.M, night = isNight(st), r = rng(o.seed || 31);
  st.add(ground(120, 80, mix(M.floor, '#a8a0a0', 0.35), tiles(mix(M.floor, '#a8a0a0', 0.35), 6, [40, 30], 'rgba(0,0,0,.14)'), { rough: 0.7 }));
  // a closed shop behind with its shutter half up, a lit gap and a sign
  const back = group(box(14, 7, 0.4, mat(mix(M.wall, '#c8a888', 0.4), { rough: 0.95 }), 0, 3.5, 0), box(5, 2.0, 0.08, mat('#8a8c94', { map: tiles('#8a8c94', 1, [1, 14], 'rgba(0,0,0,.35)'), rough: 0.5, metal: 0.4 }), 2.5, 2.0, 0.25));
  back.add(at(new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.9), new THREE.MeshBasicMaterial({ map: shopInterior(17, '#ffe0b0'), toneMapped: false, color: new THREE.Color(1.2, 1.15, 1.05) })), 2.5, 0.5, 0.22));
  back.add(plane(4.6, 0.7, night ? glowSign(o.name || 'NIGHT NOODLES', 4.6, 0.7, '#1a1220', '#ffcf5a', 110, 1.5) : sign(o.name || 'NIGHT NOODLES', 4.6, 0.7, '#7a2a2a', '#ffe8b0', 110), -3, 3.4, 0.22));
  st.add(at(back, 0, 0, -4.2)); aoStrip(st, { from: [-7, 0, -3.98], to: [7, 0, -3.98] });
  // the stall: counter, glass case, menu, pots, awning, bulbs
  const sx = o.stallX ?? -1.5, sz = -1.5, wood = mat('#8a5a3a', { rough: 0.6, clearcoat: 0.3 }), steel = mat('#c8ccd4', { metal: 0.85, rough: 0.28 });
  const stall = group(box(2.6, 1.0, 0.9, wood, 0, 0.5, 0), box(2.7, 0.05, 1.0, steel, 0, 1.02, 0), box(1.0, 0.45, 0.6, mat('#d8ecf4', { rough: 0.05, transparent: true, opacity: 0.35 }), -0.7, 1.27, 0.05));
  for (const [x, y] of [[-1.25, 0], [1.25, 0]]) for (const z of [-0.4, 0.4]) stall.add(cyl(0.04, 0.04, 2.6, steel, x, 1.3, z, 8));
  stall.add(box(2.9, 0.08, 1.4, mat('#2a2630'), 0, 2.62, 0.1));
  const aw = awning({ w: 3.0, d: 1.0, colors: o.awning || ['#d8343a', '#f4ece0'] }); aw.position.set(0, 2.6, 0.75); stall.add(aw);
  stall.add(at(menuBoard({ w: 1.1, h: 0.8, title: o.menuTitle || 'MENU', lines: o.menu || ['NOODLES  5', 'DUMPLINGS  4', 'SKEWERS  3'] }), 0.4, 2.0, -0.42));
  const pots = []; for (const px of [0.45, 0.95]) { stall.add(cyl(0.2, 0.18, 0.28, steel, px, 1.18, 0.0, 18), cyl(0.21, 0.21, 0.02, mat('#2a2a30'), px, 1.33, 0.0, 18)); pots.push([sx + px, 1.4, sz]); }
  stall.add(at(glow('#ff8a3a', 0.8, 0.5), 0.7, 1.08, 0.0));
  for (let k = 0; k < 4; k++) { const b = pendantLamp({ drop: 0.35, color: '#ffcf8a', light: k === 1 || k === 2, intensity: 2.6, dist: 6, shade: '#e8e2d4' }); b.position.set(-1.05 + k * 0.7, 2.58, 0.3); stall.add(b); }
  stall.position.set(sx, 0, sz); st.add(stall); st.add(contactShadow(stall));
  for (const p of pots) smoke(st, { pos: p, rate: 5, life: 2.4, size: 0.22, grow: 2.4, rise: 0.55, spread: 0.08, wind: [0.05, 0, 0.02], opacity: 0.2, color: '#f4eee8', seed: (p[0] * 10) | 0 });
  // low tables with stools
  const seats = []; const spots = o.tables || [[1.6, 0.4], [-2.2, 1.6], [1.4, 2.6], [4.2, 1.2]];
  spots.forEach(([tx, tz], k) => { put(st, lowTable({ color: ['#2f6fe0', '#d8343a', '#2f6fe0', '#3a8a5a'][k % 4], h: 0.6, w: 0.8, d: 0.6 }), tx, tz);
    for (const [ox, oz, yaw] of [[-0.62, 0, R2], [0.62, 0, -R2], [0, 0.55, PI]]) { put(st, stool({ color: ['#d8343a', '#2f6fe0', '#f2b632'][(k + seats.length) % 3] }), tx + ox, tz + oz); seats.push([tx + ox, tz + oz, yaw]); }
    put(st, group(cyl(0.08, 0.06, 0.06, mat('#f4f0e8', { rough: 0.3, clearcoat: 0.6 }), 0, 0.03, 0, 16), cyl(0.012, 0.012, 0.22, mat('#c8a070'), 0.04, 0.1, 0, 4)), tx, tz, r(), 0.635, false); });
  st.add(stringLights({ from: [sx - 1.4, 2.7, sz + 0.9], to: [6, 3.2, 3.5], n: 14, sag: 0.45, lights: 1 }), stringLights({ from: [sx - 1.4, 2.7, sz + 0.9], to: [-6, 3.0, 3.8], n: 12, sag: 0.5, lights: 1, seed: 4 }));
  st.add(at(group(cyl(0.06, 0.08, 3.4, mat('#2a2630', { metal: 0.5 }), 0, 1.7, 0, 8)), 6, 0, 3.5), at(group(cyl(0.06, 0.08, 3.2, mat('#2a2630', { metal: 0.5 }), 0, 1.6, 0, 8)), -6, 0, 3.8));
  put(st, scooter({ color: '#2f6fe0' }), 5.4, -2.6, 0.4); put(st, scooter({ color: '#e8e2d4' }), 6.4, -2.4, 0.5); put(st, tree({ s: 1.2, seed: 5, color: M.tree || '#3a5a48' }), -6, -3.2);
  if (night) { st.add(skyline({ color: shade(M.wall, -0.4), seed: 11 })); } else skyDome(st, { clouds: 10 });
  if (o.wet) mirror(st, { w: 120, d: 80, strength: 0.4 });
  return { vendor: [sx, -2.2, 0], counter: [sx, 1.05, sz + 0.2], seat: (i = 0) => seats[i % seats.length], seats, stall };
}

// ================================================================ CAFÉ (quán cà phê), interior
// Counter along the back wall (barista behind it at k.barista), menu board, pendant lamps over round tables, a big window on
// the left wall with the street outside (rain-streaked with o.rain). k.seat(i) → [x, z, yaw] chairs ('sit' pose, y = 0).
export function cafe(st, o = {}) {
  const M = st.M, w = o.w || 10, d = o.d || 8, h = o.h || 3.4, night = isNight(st), r = rng(o.seed || 41);
  const wallC = o.wall || '#d8c8b0';
  shell(st, w, d, h, { wall: wallC, floor: '#7a5a42', floorTex: planks('#7a5a42', 16, [w / 2, d / 2]), floorRough: 0.4, backMat: mat('#ffffff', { map: brick('#a86a50', [4, 2]), rough: 0.95 }) });
  // counter + espresso machine + pastry case + cups
  const cz = -d / 2 + 1.2, ct = group(box(5.2, 1.0, 0.75, mat('#3a2a24', { rough: 0.55, clearcoat: 0.35 }), 0, 0.5, 0), box(5.3, 0.06, 0.85, mat('#e8e2d8', { rough: 0.2, clearcoat: 0.6 }), 0, 1.03, 0));
  ct.add(rbox(0.7, 0.5, 0.45, 0.05, mat('#c8ccd4', { metal: 0.85, rough: 0.22 }), -1.6, 1.31, -0.1), box(0.5, 0.06, 0.2, mat('#2a2a30'), -1.6, 1.12, 0.12), at(glow('#ff6a3a', 0.12, 0.9), -1.45, 1.45, 0.14));
  ct.add(box(1.4, 0.5, 0.6, mat('#e0f0f8', { rough: 0.05, transparent: true, opacity: 0.3 }), 1.2, 1.31, 0.05), new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.12), glowMat('#fff2d8', 1.1)).translateX(1.2).translateY(1.55).translateZ(0.05).rotateX(R2));
  for (let k = 0; k < 6; k++) ct.add(at(sphere(0.07, mat(['#c8884a', '#e8c070', '#a85a3a'][k % 3], { rough: 0.7 }), 0, 0, 0, 10, 8), 0.75 + (k % 3) * 0.3, 1.15, (k < 3 ? -0.1 : 0.15)));
  for (let k = 0; k < 4; k++) ct.add(at(cup({ color: '#f4f0e8' }), -0.6 + k * 0.18, 1.06, 0.2));
  ct.position.set(0, 0, cz); st.add(ct); st.add(contactShadow(ct));
  st.add(at(menuBoard({ w: 2.2, h: 1.2, title: o.menuTitle || 'COFFEE', lines: o.menu || ['ESPRESSO  3', 'LATTE  4.5', 'COCOA  4', 'CROISSANT  3'] }), 0, 2.3, -d / 2 + 0.03));
  for (const sx2 of [-1, 1]) { const sh2 = group(box(1.4, 0.04, 0.25, mat('#5a3a2a'), 0, 0, 0)); for (let k = 0; k < 5; k++) sh2.add(at(cup({ color: ['#e8e0d0', '#5a8aa0', '#c8604a'][k % 3] }), -0.55 + k * 0.27, 0.02, 0)); sh2.position.set(sx2 * 2.8, 1.9, -d / 2 + 0.15); st.add(sh2); }
  // pendants over the tables (two real lights), round tables with chairs
  const seats = [], spots = o.tables || [[-2.6, 0.8], [0.4, 1.4], [3.0, 0.4], [-1.4, 2.9], [2.2, 3.0]];
  spots.forEach(([tx, tz], k) => { const tb = group(cyl(0.42, 0.42, 0.04, mat('#e8e2d8', { rough: 0.25, clearcoat: 0.5 }), 0, 0.74, 0, 28), cyl(0.04, 0.04, 0.72, mat('#2a2630', { metal: 0.6, rough: 0.3 }), 0, 0.36, 0, 8), cyl(0.22, 0.22, 0.03, mat('#2a2630'), 0, 0.015, 0, 18));
    put(st, tb, tx, tz); for (const [ox, yaw] of [[-0.7, R2], [0.7, -R2]]) { put(st, chair({ color: ['#2f6f6a', '#c8604a', '#e8b030'][k % 3] }), tx + ox, tz, yaw); seats.push([tx + ox, tz, yaw]); }
    put(st, cup({ color: '#f4f0e8' }), tx + 0.1, tz + 0.05, 0, 0.76, false);
    const pd = pendantLamp({ drop: h - 2.15, color: '#ffc880', light: k < 3, intensity: 3.0, dist: 5.5 }); pd.position.set(tx, h, tz); st.add(pd); });
  // the big window on the left wall: the street outside, optional rain streaks
  const ww = Math.min(d - 1.6, 5.4), wv = windowPane(ww, 2.0, night, 9, '#3a2a24'); wv.position.set(-w / 2 + 0.02, 1.65, 0.6); wv.rotation.y = R2; st.add(wv);
  if (o.rain) { const rt = canvasTex(256, 256, (g, W, H) => { const rr = rng(3); g.clearRect(0, 0, W, H); g.strokeStyle = 'rgba(220,230,255,.35)'; g.lineWidth = 1.5; for (let i = 0; i < 120; i++) { const x = rr() * W, y = rr() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y + 8 + rr() * 18); g.stroke(); } }, [3, 2]);
    const rp = new THREE.Mesh(new THREE.PlaneGeometry(ww, 2.0), new THREE.MeshBasicMaterial({ map: rt, transparent: true, depthWrite: false, toneMapped: false })); rp.position.set(-w / 2 + 0.06, 1.65, 0.6); rp.rotation.y = R2; st.add(rp); st.onTick((t) => { rt.offset.y = -t * 0.6; }); }
  if (!night) shafts(st, { pos: [-w / 2 + 0.1, 2.5, 0.6], dir: [0.85, -0.5, 0.15], len: 5.5, w: 1.4, h: 1.8, n: 2, gap: 2.2, along: [0, 0, 1], opacity: 0.11, motes: 80 });
  const win = spot(night ? '#8fa0ff' : '#fff0d0', night ? 10 : 45, { pos: [-w / 2 - 1.2, 3.2, 0.6], target: [0.5, 0, 0.8], angle: 0.8, penumbra: 0.7, dist: 16 }); st.add(win);
  put(st, plant({ color: '#3a7a4a' }), -w / 2 + 0.5, -d / 2 + 0.6); put(st, plant({ color: '#4a8a5a', seed: 7 }), w / 2 - 0.5, d / 2 - 0.6); put(st, shelf({}), w / 2 - 0.25, 1.0, -R2);
  mirror(st, { w, d, strength: 0.16, blur: 1.8 });
  return { seat: (i = 0) => seats[i % seats.length], seats, barista: [-0.6, cz - 0.7, 0], counter: [0, 1.06, cz + 0.2], window: wv, w, d, h };
}

// ================================================================ passers-by: roster extras walking along a sidewalk lane, looping
// passersby(st, { cast: [outfit, …] (from channel/cast.js; required), lane: [x0, x1, z], n, speed, seed, y, both: walk both ways })
// Returns the characters (already added; they tick themselves). Keep them behind the action: lane z further from the camera.
export function passersby(st, o = {}) {
  const cast = o.cast || []; if (!cast.length) return [];
  const [x0, x1, z] = o.lane || [-20, 20, -1.5], n = o.n || 5, r = rng(o.seed || 7), span = x1 - x0, y = o.y ?? 0.15, out = [];
  for (let i = 0; i < n; i++) { const ch = character(cast[i % cast.length]); const dir = o.both === false ? 1 : (i % 2 ? -1 : 1), sp = (o.speed || 1.25) * (0.85 + r() * 0.3), off = r() * span, lz = z + (r() - 0.5) * (o.spread ?? 0.8), seed = i * 3 + 1;
    st.add(ch); out.push(ch);
    st.onTick((t) => { const s = ((off + t * sp) % span + span) % span; ch.position.set(dir > 0 ? x0 + s : x1 - s, y, lz); ch.rotation.y = dir > 0 ? R2 : -R2; const ph = ((off + t * sp) / 1.45) * PI * 2; ch.pose(walkPose3(ph)); ch.face?.({ expr: 'neutral', t, blink: true }); }); }
  return out;
}
