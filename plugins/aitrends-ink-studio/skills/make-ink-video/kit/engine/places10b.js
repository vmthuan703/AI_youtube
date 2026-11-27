// engine/places10b.js — more 1.0 everyday places (exposed as T.W.* through world3d.js), built like places10.js.
//
//   const m = T.W.supermarket(st)    // aisles of shelves along z, fridges at the back, checkouts at the front; m.aisle(i) → x, m.checkout(i) → [x, z], m.cashier(i)
//   const h = T.W.hospitalHall(st)   // corridor along z with numbered doors, handrails, a nurse station; h.door(i, side) → { x, z, yaw }, h.station
//   const r = T.W.rooftop(st)        // a city roof at y 0: parapet, water tank, vents, stair hut; r.edge (front parapet z), r.ledge(i) → [x, z] sit spots, r.door
//   const s = T.W.trainStation(st)   // platform along x (top y 0), tracks at z ≈ 3 below it, canopy, board; s.train (move .position.x), s.edgeZ, s.bench(i)
// Props: shelfUnit, cart, gurney, wheelchair, waterTank, trainCar.
import * as THREE from 'three';
import { shade, mix, rng, clamp } from './core.js';
import { mat, box, rbox, cyl, sphere, plane, group, at, canvasTex, lamp, glow, glowMat, textTex, ground, tiles, screen, cached, contactShadow, lightCone } from './kit3d.js';
import { building, skyline, bench, plant, door as doorProp, wallClock, chair, trashCan, poster } from './world3d.js';
import { mirror, skyDome, aoStrip, stringLights } from './look10.js';
import { acUnit, planter } from './places10.js';

const PI = Math.PI, R2 = PI / 2;
const sign = (txt, w, h, bg, fg, size = 64) => mat('#ffffff', { map: textTex(txt, { w: 512, h: Math.max(32, Math.round(512 * h / w)), bg, color: fg, size, font: 'Nunito' }), rough: 0.6 });
const glowSign = (txt, w, h, bg, fg, size = 64, power = 1.3) => new THREE.MeshBasicMaterial({ map: textTex(txt, { w: 512, h: Math.max(32, Math.round(512 * h / w)), bg, color: fg, size, font: 'Nunito', glow: 10 }), color: new THREE.Color(power, power, power), toneMapped: false });
const isNight = (st) => /night|storm|dusk|arctic/.test(st.moodName);
const put = (st, obj, x, z, yaw = 0, y = 0, cs = true) => { obj.position.set(x, y, z); obj.rotation.y = yaw; st.add(obj); if (cs && y < 0.2) st.add(contactShadow(obj)); return obj; };
function walls(st, w, d, h, wallC, o = {}) {
  const wm = mat(wallC, { rough: 0.92 });
  st.add(box(w + 0.4, h, 0.2, wm, 0, h / 2, -d / 2 - 0.1)); if (o.front !== false) st.add(box(w + 0.4, h, 0.2, wm, 0, h / 2, d / 2 + 0.1));
  for (const sx of [-1, 1]) st.add(box(0.2, h, d + 0.4, wm, sx * (w / 2 + 0.1), h / 2, 0));
  st.add(box(w + 0.4, 0.12, d + 0.4, mat(shade(wallC, 0.08), { rough: 1 }), 0, h + 0.06, 0));
  aoStrip(st, { from: [-w / 2, 0, -d / 2], to: [w / 2, 0, -d / 2] }); aoStrip(st, { from: [-w / 2, 0, d / 2], to: [-w / 2, 0, -d / 2], yaw: R2 }); aoStrip(st, { from: [w / 2, 0, -d / 2], to: [w / 2, 0, d / 2], yaw: -R2 });
}

// ================================================================ props
// products painted on a canvas: rows of boxes, cans and bottles in shop colours (one texture per seed)
const goodsTex = (seed) => cached('goods' + seed, () => canvasTex(512, 512, (g, W, H) => { const r = rng(seed); g.fillStyle = '#e8e4dc'; g.fillRect(0, 0, W, H);
  const rows = 4, rh = H / rows; for (let j = 0; j < rows; j++) { g.fillStyle = '#c8c4bc'; g.fillRect(0, (j + 1) * rh - 10, W, 10); let x = 6; const kind = (r() * 3) | 0;
    while (x < W - 20) { const c = ['#d8443a', '#2f6fe0', '#f2b632', '#3a9a5a', '#e8e2d8', '#a84ad6', '#ff8a3a', '#2a2a34'][(r() * 8) | 0], bw = kind === 1 ? 26 : 30 + r() * 26, bh = kind === 2 ? rh * 0.75 : rh * (0.45 + r() * 0.35), y = (j + 1) * rh - 10 - bh;
      g.fillStyle = c; if (kind === 1) { g.fillRect(x, y + 6, bw, bh - 6); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 3, y + 8, 5, bh - 12); } else if (kind === 2) { g.fillRect(x + bw * 0.3, y, bw * 0.4, bh * 0.25); g.fillRect(x, y + bh * 0.22, bw, bh * 0.78); } else g.fillRect(x, y, bw, bh);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(x + 4, y + bh * 0.4, bw - 8, Math.min(14, bh * 0.2)); x += bw + 3; } } }));
export function shelfUnit(o = {}) {
  const L = o.len || 4, h = o.h || 1.8, d = o.d || 0.9, frame = mat(o.color || '#d8dce4', { rough: 0.45, metal: 0.3 });
  const g = group(box(L, 0.12, d, frame, 0, 0.06, 0), box(L, 0.05, d, frame, 0, h, 0), box(L, h, 0.04, frame, 0, h / 2, 0));
  for (let k = 1; k < 4; k++) g.add(box(L, 0.025, d, frame, 0, 0.12 + k * (h - 0.12) / 4, 0));
  for (const sz of [-1, 1]) { const t = goodsTex((o.seed || 1) * 2 + (sz > 0 ? 1 : 0)).clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping; t.repeat.set(L / 1.8, 1); const f = plane(L - 0.02, h - 0.14, mat('#ffffff', { map: t, rough: 0.7 }), 0, 0.12 + (h - 0.14) / 2, sz * (d / 2 - 0.02)); if (sz < 0) f.rotation.y = PI; g.add(f); }
  for (const sx of [-1, 1]) g.add(box(0.04, h, d, frame, sx * L / 2, h / 2, 0));
  return g;
}
export function cart(o = {}) {
  const m = mat(o.color || '#c8ccd4', { metal: 0.8, rough: 0.3 }), red = mat('#d8343a', { keepSat: true, rough: 0.4 }), dk = mat('#1a1a20');
  const g = group(box(0.55, 0.03, 0.85, m, 0, 0.42, 0)); for (const sx of [-1, 1]) g.add(box(0.02, 0.4, 0.85, m, sx * 0.27, 0.62, 0)); g.add(box(0.55, 0.4, 0.02, m, 0, 0.62, -0.42), box(0.55, 0.4, 0.02, m, 0, 0.62, 0.42));
  g.add(cyl(0.02, 0.02, 0.6, red, 0, 0.98, 0.52, 8).rotateZ(R2)); for (const [x, z] of [[-0.24, -0.38], [0.24, -0.38], [-0.24, 0.38], [0.24, 0.38]]) g.add(cyl(0.012, 0.012, 0.4, m, x, 0.22, z, 6), sphere(0.05, dk, x, 0.05, z, 10, 8));
  return g;
}
export function gurney(o = {}) { const m = mat('#c8ccd4', { metal: 0.7, rough: 0.3 }); const g = group(rbox(0.75, 0.12, 2.0, 0.05, mat('#e8eef2', { rough: 0.8 }), 0, 0.82, 0), box(0.7, 0.04, 1.9, m, 0, 0.72, 0), rbox(0.5, 0.12, 0.35, 0.05, mat('#ffffff'), 0, 0.93, -0.75));
  for (const [x, z] of [[-0.3, -0.85], [0.3, -0.85], [-0.3, 0.85], [0.3, 0.85]]) g.add(cyl(0.02, 0.02, 0.7, m, x, 0.37, z, 6), sphere(0.05, mat('#1a1a20'), x, 0.05, z, 8, 6)); return g; }
export function wheelchair(o = {}) { const m = mat('#2a2e38', { metal: 0.6, rough: 0.35 }), s = mat(o.color || '#2f6fe0', { rough: 0.7 }); const g = group(box(0.45, 0.05, 0.45, s, 0, 0.48, 0), box(0.45, 0.45, 0.04, s, 0, 0.75, -0.22));
  for (const sx of [-1, 1]) { const w = cyl(0.3, 0.3, 0.03, m, sx * 0.27, 0.3, -0.05, 24); w.rotation.z = R2; g.add(w); g.add(cyl(0.06, 0.06, 0.03, m, sx * 0.18, 0.06, 0.28, 10).rotateZ(R2)); } return g; }
export function waterTank(o = {}) { const w = mat(o.color || '#8a6a4a', { rough: 0.85 }), m = mat('#3a3a42', { metal: 0.5, rough: 0.5 }); const g = group(cyl(1.1, 1.1, 2.2, w, 0, 3.3, 0, 24), cone(1.25, 0.8, w, 0, 4.8, 0));
  for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) g.add(box(0.12, 2.2, 0.12, m, x, 1.1, z)); for (let k = 0; k < 3; k++) g.add(cyl(1.12, 1.12, 0.05, m, 0, 2.5 + k * 0.75, 0, 24)); return g; }
const cone = (r, h, m, x, y, z) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 24), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
// trainCar({ color, stripe, len, lit, line }) — a metro car, front +x, doors on the +z side (door centres at g.doors[i] local x)
export function trainCar(o = {}) {
  const L = o.len || 16, body = mat(o.color || '#d8dce4', { rough: 0.25, metal: 0.45, rim: 0.2 }), stripe = mat(o.stripe || '#2f6fe0', { keepSat: true, rough: 0.35 }), dark = mat('#1a1c24');
  const lit = o.lit ?? true, win = lit ? glowMat('#fff2d8', 1.1) : mat('#1c2638', { rough: 0.05, metal: 0.5 });
  const g = group(rbox(L, 3.0, 2.9, 0.25, body, 0, 1.9, 0), box(L + 0.02, 0.28, 2.92, stripe, 0, 1.05, 0), box(L - 0.4, 0.5, 2.6, dark, 0, 0.35, 0));
  const doors = []; for (let i = 0; i < 3; i++) { const x = -L / 2 + L * (i + 0.5) / 3; doors.push(x); g.add(box(1.3, 2.1, 0.04, mat('#a8acb8', { metal: 0.6, rough: 0.3 }), x, 1.6, 1.46), box(0.5, 0.9, 0.05, win, x - 0.3, 2.05, 1.47), box(0.5, 0.9, 0.05, win, x + 0.3, 2.05, 1.47)); }
  for (let i = 0; i < 3; i++) for (const k of [-1, 1]) { const x = -L / 2 + L * (i + 0.5) / 3 + k * L / 6.5; g.add(box(1.6, 0.9, 0.05, win, x, 2.1, 1.46), box(1.6, 0.9, 0.05, win, x, 2.1, -1.46)); }
  g.add(box(0.05, 1.2, 2.3, win, L / 2 + 0.01, 2.2, 0), at(plane(1.6, 0.3, glowSign(o.line || 'LINE 2  CENTRAL', 1.6, 0.3, '#111014', '#ffb030', 64)), L / 2 + 0.03, 3.05, 0, R2));
  for (const z of [-0.9, 0.9]) g.add(at(glow('#fff4d8', 0.8, 0.9), L / 2 + 0.1, 0.9, z));
  g.doors = doors; return g;
}

// ================================================================ SUPERMARKET (siêu thị), interior
export function supermarket(st, o = {}) {
  const w = o.w || 16, d = o.d || 14, h = o.h || 3.8, aisles = o.aisles || 4, r = rng(o.seed || 51);
  st.add(ground(w + 0.4, d + 0.4, '#d8d4cc', tiles('#d8d4cc', 8, [w / 2, d / 2], 'rgba(0,0,0,.12)'), { rough: 0.3 }));
  walls(st, w, d, h, o.wall || '#e8e2d8');
  // shelf units along z, aisles between them
  const xs = [], gap = w / (aisles + 1); for (let i = 0; i <= aisles; i++) xs.push(-w / 2 + gap * 0.5 + i * gap);
  const shelfLen = d - 6.2, zc = -d / 2 + 1.8 + shelfLen / 2;
  for (let i = 1; i < xs.length - 0; i++) if (i < xs.length) { const sx = -w / 2 + gap * i; const u = shelfUnit({ len: shelfLen, seed: i + (o.seed || 1) }); u.rotation.y = R2; u.position.set(sx, 0, zc); st.add(u); st.add(contactShadow(u)); }
  // hanging aisle signs
  const names = o.names || ['SNACKS', 'DRINKS', 'BAKERY', 'FRUIT', 'DAIRY', 'FROZEN'];
  for (let i = 0; i <= aisles - 0; i++) { const ax = -w / 2 + gap * (i + 0.5); if (ax > w / 2 - 0.5) continue; const sg = group(cyl(0.006, 0.006, 0.6, '#222', 0, 0.3, 0, 4), plane(1.4, 0.4, sign((i + 1) + '  ' + names[i % names.length], 1.4, 0.4, '#2f6fe0', '#ffffff', 90), 0, -0.2, 0)); sg.add(at(plane(1.4, 0.4, sign((i + 1) + '  ' + names[i % names.length], 1.4, 0.4, '#2f6fe0', '#ffffff', 90)), 0, -0.2, -0.005, PI)); sg.position.set(ax, h - 0.9, zc - shelfLen * 0.25); st.add(sg); }
  // fridge wall at the back
  for (let x = -w / 2 + 1; x < w / 2 - 0.9; x += 1.1) st.add(group(box(1.05, 2.2, 0.8, mat('#e8eef2', { rough: 0.4 }), 0, 1.1, 0), plane(0.95, 1.9, new THREE.MeshBasicMaterial({ map: goodsTex(90 + Math.round(x)), color: new THREE.Color(1.1, 1.15, 1.2), toneMapped: false }), 0, 1.15, 0.41), box(0.04, 0.5, 0.04, mat('#a8acb8', { metal: 0.7 }), 0.4, 1.2, 0.44)).translateX(x).translateZ(-d / 2 + 0.45));
  // checkouts at the front
  const checks = []; for (let i = 0; i < (o.checkouts || 3); i++) { const cx = -w / 2 + 2.2 + i * 2.8, cz = d / 2 - 2.0;
    const c = group(box(0.7, 0.9, 2.0, mat('#3a3e48', { rough: 0.5, clearcoat: 0.4 }), 0, 0.45, 0), box(0.6, 0.02, 1.6, mat('#1a1a20', { rough: 0.6 }), 0, 0.91, 0.1), rbox(0.35, 0.25, 0.25, 0.03, mat('#2a2a30'), -0.1, 1.05, -0.75));
    c.add(at(screen(0.3, 0.2, (g, W, H) => { g.fillStyle = '#0a2a1a'; g.fillRect(0, 0, W, H); g.fillStyle = '#5fe0a0'; g.font = '700 60px "Nunito"'; g.fillText('$ 12.40', 20, H * 0.6); }), -0.1, 1.25, -0.62, -0.4));
    c.add(at(cyl(0.03, 0.03, 1.8, mat('#c8ccd4', { metal: 0.6 }), 0, 0.9, 0, 8), 0.35, 0.9, 0.9), at(plane(0.4, 0.4, glowSign(String(i + 1), 0.4, 0.4, '#d8343a', '#ffffff', 300)), 0.35, 2.0, 0.9));
    put(st, c, cx, cz); checks.push([cx, cz]); }
  put(st, cart({}), xs[0] + 1.2, d / 2 - 4.2, 0.4); put(st, cart({}), w / 2 - 1.6, d / 2 - 1.2, -0.3); put(st, plant({}), w / 2 - 0.7, d / 2 - 0.6);
  // fluorescent strips (glow) + two real lights
  for (let x = -w / 2 + gap; x < w / 2; x += gap) for (let z = -d / 2 + 1.5; z < d / 2; z += 3) st.add(box(0.2, 0.04, 1.6, glowMat('#f4fbff', 1.35), x - gap / 2, h - 0.03, z));
  for (const z of [-d / 4, d / 4]) { const L = lamp('#f0f6ff', o.lamp ?? 6, 14, { bulb: false, shadow: z < 0 }); L.position.set(0, h - 0.4, z); st.add(L); }
  st.add(at(plane(3.2, 0.6, glowSign(o.name || 'FRESH MART', 3.2, 0.6, '#2a8a5a', '#ffffff', 110)), 0, h - 0.5, -d / 2 + 0.02));
  mirror(st, { w, d, strength: 0.22, blur: 1.6 });
  return { aisle: (i = 0) => -w / 2 + gap * (clamp(i, 0, aisles) + 0.5), checkout: (i = 0) => checks[i % checks.length], cashier: (i = 0) => [checks[i % checks.length][0] - 0.7, checks[i % checks.length][1] - 0.4, R2], w, d, zc, shelfLen };
}

// ================================================================ HOSPITAL HALLWAY (hành lang bệnh viện), interior along z
export function hospitalHall(st, o = {}) {
  const w = o.w || 3.8, d = o.d || 26, h = o.h || 3.0, wallC = o.wall || '#d8e4dc', night = isNight(st);
  st.add(ground(w + 0.4, d + 0.4, '#d8dce0', tiles('#d8dce0', 4, [w / 1.5, d / 1.5], 'rgba(0,0,0,.1)'), { rough: 0.25 }));
  walls(st, w, d, h, wallC, { front: false });
  for (const sx of [-1, 1]) st.add(box(0.02, 1.0, d, mat('#a8c4b4', { rough: 0.9 }), sx * (w / 2 - 0.01), 0.5, 0), cyl(0.03, 0.03, d, mat('#c8ccd4', { metal: 0.6, rough: 0.3 }), sx * (w / 2 - 0.08), 0.9, 0, 8).rotateX(R2));
  const doors = []; let n = 100 + (o.room || 1);
  for (let z = -d / 2 + 2.5; z < d / 2 - 2; z += 4.2) for (const sx of [-1, 1]) { const dz = z + (sx > 0 ? 2.1 : 0); if (dz > d / 2 - 1.5) continue;
    const dr = doorProp({ color: '#8ab0c8' }); put(st, dr, sx * (w / 2 - 0.03), dz, sx > 0 ? -R2 : R2, 0, false);
    st.add(at(plane(0.32, 0.18, sign(String(n), 0.32, 0.18, '#2c3e6e', '#ffffff', 110)), sx * (w / 2 - 0.02), 2.3, dz + 0.75, sx > 0 ? -R2 : R2)); doors.push({ x: sx * (w / 2 - 0.4), z: dz, yaw: sx > 0 ? R2 : -R2, side: sx, n }); n++; }
  // ceiling panels (glow) and lights; o.flicker: index of a failing panel (animate with T.W.flicker in draw: h.panels[i])
  const panels = []; for (let z = -d / 2 + 1.5; z < d / 2; z += 3) { const p = box(1.0, 0.04, 0.6, glowMat('#f4fff8', 1.3), 0, h - 0.03, z); st.add(p); panels.push(p); }
  const lights = []; for (const z of [-d / 4, d / 6]) { const L = lamp('#f0fff4', o.lamp ?? 5, 12, { bulb: false, shadow: z < 0 }); L.position.set(0, h - 0.4, z); st.add(L); lights.push(L.light); }
  // nurse station at the far end, signs, props
  const ns = group(box(2.6, 1.05, 0.6, mat('#e8eef2', { rough: 0.5, clearcoat: 0.3 }), 0, 0.52, 0), box(2.7, 0.04, 0.7, mat('#5a8a9a', { rough: 0.3 }), 0, 1.07, 0), at(screen(0.45, 0.3, (g, W, H) => { g.fillStyle = '#082028'; g.fillRect(0, 0, W, H); g.strokeStyle = '#5fe0a0'; g.lineWidth = 4; g.beginPath(); for (let x = 0; x < W; x += 4) g.lineTo(x, H / 2 + Math.sin(x * 0.08) * 20 * (x % 60 < 10 ? 2 : 0.2)); g.stroke(); }), 0.6, 1.3, -0.1));
  put(st, ns, 0, -d / 2 + 1.6); st.add(at(plane(1.8, 0.4, glowSign(o.sign || 'EMERGENCY', 1.8, 0.4, '#c8343a', '#ffffff', 100)), 0, h - 0.45, -d / 2 + 0.02));
  st.add(at(plane(0.7, 0.24, glowSign('EXIT', 0.7, 0.24, '#16a04a', '#ffffff', 110, 1.4)), 0, h - 0.2, d / 2 - 2, PI));
  put(st, gurney({}), -w / 2 + 0.55, 2.0, 0); put(st, wheelchair({}), w / 2 - 0.5, -3.5, -R2); put(st, chair({ color: '#5a8a9a' }), -w / 2 + 0.35, -6, R2); put(st, chair({ color: '#5a8a9a' }), -w / 2 + 0.35, -5.4, R2); put(st, plant({}), w / 2 - 0.35, -d / 2 + 0.5);
  if (o.window !== false) { const wv = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(night ? '#2a2a60' : '#c8dcf0'), toneMapped: false })); wv.position.set(0, 1.7, d / 2 + 0.005 - 0.2); }
  mirror(st, { w, d, strength: 0.3, blur: 1.4 });
  return { door: (i = 0, side = -1) => { const L = doors.filter(dd => dd.side === side); return L[i % L.length]; }, doors, station: [0, -d / 2 + 2.5, PI], panels, lights, w, d };
}

// ================================================================ ROOFTOP (sân thượng): roof at y 0, parapet around, city all round
export function rooftop(st, o = {}) {
  const M = st.M, w = o.w || 16, d = o.d || 12, night = isNight(st), r = rng(o.seed || 61);
  st.add(box(w, 0.4, d, mat('#7a7480', { map: tiles('#7a7480', 6, [w / 2, d / 2], 'rgba(0,0,0,.18)'), rough: 0.85 }), 0, -0.2, 0));
  st.add(box(w + 2, 40, d + 2, mat(shade(M.wall, -0.1), { rough: 0.95 }), 0, -20.4, 0));
  const pm = mat('#9a8e8a', { rough: 0.9 }), cap = mat('#c8bcb4', { rough: 0.7 });
  for (const [x, z, ww, dd] of [[0, -d / 2, w, 0.3], [0, d / 2, w, 0.3], [-w / 2, 0, 0.3, d], [w / 2, 0, 0.3, d]]) st.add(box(ww, 1.05, dd, pm, x, 0.52, z), box(ww + 0.12, 0.08, dd + 0.12, cap, x, 1.08, z));
  aoStrip(st, { from: [-w / 2 + 0.15, 0, -d / 2 + 0.15], to: [w / 2 - 0.15, 0, -d / 2 + 0.15] });
  put(st, waterTank({}), -w / 2 + 2.4, -d / 2 + 2.4); for (let i = 0; i < 4; i++) put(st, acUnit(), -1 + i * 1.0, -d / 2 + 0.8);
  for (let i = 0; i < 3; i++) put(st, group(cyl(0.12, 0.12, 1.2, mat('#8a8c94', { metal: 0.6, rough: 0.4 }), 0, 0.6, 0, 12), cyl(0.2, 0.2, 0.1, mat('#6a6c74'), 0, 1.25, 0, 12)), w / 2 - 1.5 - i * 0.7, -1 + i * 0.8);
  const hut = group(box(2.4, 2.6, 2.2, mat(shade(M.wall, 0.05), { rough: 0.9 }), 0, 1.3, 0), box(2.6, 0.12, 2.4, cap, 0, 2.66, 0), box(0.95, 2.05, 0.06, mat('#5a4a42', { rough: 0.5 }), 0, 1.02, 1.12));
  const hl = lamp('#ffd8a0', night ? 3 : 0.5, 6, { bulbR: 0.06 }); hl.position.set(0.7, 2.3, 1.25); hut.add(hl); put(st, hut, w / 2 - 2.2, d / 2 - 2.6, PI);
  if (o.lights !== false) st.add(stringLights({ from: [-w / 2 + 0.5, 2.4, d / 2 - 0.3], to: [w / 2 - 4, 2.6, -d / 2 + 0.6], n: 18, sag: 0.6, lights: night ? 2 : 0 }));
  put(st, planter({ w: 1.2, seed: 3 }), -2, d / 2 - 0.6); put(st, planter({ w: 1.2, seed: 7 }), 1, d / 2 - 0.6); put(st, chair({ color: '#c8604a' }), -3.5, 2, -0.5);
  // the city: buildings round the roof, some taller, lit at night
  const pal = [mix(M.wall, '#c89a8a', 0.4), mix(M.wall, '#9aa0c8', 0.4), mix(M.wall, '#d8c09a', 0.4), shade(M.wall, 0.1)];
  for (let i = 0; i < 46; i++) { const a = r() * PI * 2, R = 18 + r() * 40, bw = 6 + r() * 8, bh = 10 + r() * 45; const b = building(bw, bh, 6 + r() * 6, { color: pal[(r() * 4) | 0], seed: (r() * 1e4) | 0, lit: night ? 0.55 : 0.15, glow: night ? 0.9 : 0.2, shop: false, awning: false });
    b.position.set(Math.cos(a) * R, -30, Math.sin(a) * R); b.rotation.y = -a + R2; st.add(b); }
  if (night) { st.add(skyline({ color: shade(M.wall, -0.4), seed: 13 })); } else skyDome(st, { clouds: 16 });
  return { edge: d / 2 - 0.3, ledge: (i = 0) => [-3 + i * 1.6, d / 2 - 0.3], door: [w / 2 - 2.2, d / 2 - 3.9], w, d };
}

// ================================================================ TRAIN STATION (ga tàu): platform along x, top y 0, edge at z = edgeZ, tracks beyond it
export function trainStation(st, o = {}) {
  const M = st.M, len = o.length || 60, pw = 7, edgeZ = 2, night = isNight(st);
  st.add(box(len, 1.1, pw, mat('#b8b0a8', { map: tiles('#b8b0a8', 6, [len / 2, pw / 2], 'rgba(0,0,0,.15)'), rough: 0.6 }), 0, -0.55, edgeZ - pw / 2));
  const edge = canvasTex(64, 64, (g, W, H) => { g.fillStyle = '#f2c21a'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 4; y < H; y += 12) for (let x = 4; x < W; x += 12) { g.beginPath(); g.arc(x, y, 2.5, 0, 7); g.fill(); } }, [len / 0.6, 1]);
  st.add(at(plane(len, 0.6, mat('#ffffff', { map: edge, rough: 0.6 })), 0, 0.004, edgeZ - 0.4).rotateX(-R2), box(len, 0.06, 0.12, mat('#e8e2d8'), 0, -0.02, edgeZ - 0.02));
  // track bed below the platform: ballast, sleepers, rails
  st.add(box(len + 40, 0.3, 6, mat('#5a5458', { rough: 1 }), 0, -1.25, edgeZ + 3), box(len + 40, 4, 0.4, mat('#6a6268', { rough: 0.95 }), 0, -1, edgeZ + 6.2));
  for (let x = -len / 2 - 20; x < len / 2 + 20; x += 0.7) st.add(box(0.25, 0.1, 2.4, mat('#4a3a32'), x, -1.05, edgeZ + 2.6));
  for (const z of [edgeZ + 1.9, edgeZ + 3.3]) st.add(box(len + 40, 0.12, 0.08, mat('#a8acb8', { metal: 0.85, rough: 0.25 }), 0, -0.95, z));
  // canopy on columns, lamps, benches, board, clock
  st.add(box(len, 0.2, pw + 1, mat('#3a3e48', { rough: 0.5, metal: 0.3 }), 0, 4.2, edgeZ - pw / 2 + 0.3));
  for (let x = -len / 2 + 4; x < len / 2; x += 8) { st.add(cyl(0.12, 0.12, 4.2, mat('#2a2e38', { metal: 0.5, rough: 0.4 }), x, 2.1, edgeZ - 3.8, 12)); st.add(box(1.8, 0.04, 0.25, glowMat('#fff4e0', 1.4), x, 4.08, edgeZ - 1.5)); }
  for (const x of [-6, 6]) { const L = lamp('#fff0dc', o.lamp ?? 5, 12, { bulb: false, shadow: x < 0 }); L.position.set(x, 3.8, edgeZ - 1.5); st.add(L); }
  const benches = []; for (const x of [-10, -2, 7]) { put(st, bench({ color: '#4a6a8a' }), x, edgeZ - 5.6, 0); benches.push([x, edgeZ - 5.4, 0]); }
  const lines = o.board || [['08:42', 'CENTRAL', '2'], ['08:47', 'AIRPORT', '1'], ['08:55', 'HARBOR', '2'], ['09:03', 'NORTH PARK', '3']];
  const brd = screen(2.6, 1.0, (g, W, H, t) => { g.fillStyle = '#0c0c10'; g.fillRect(0, 0, W, H); g.font = '700 34px "Nunito"'; lines.forEach((l, i) => { g.fillStyle = i === 0 ? '#ffb030' : '#f0e0c0'; g.fillText(l[0], 16, 50 + i * 54); g.fillText(l[1], 140, 50 + i * 54); g.fillText(l[2], W - 50, 50 + i * 54); }); });
  st.add(at(group(box(2.8, 1.2, 0.15, mat('#1a1a20')), at(brd, 0, 0, 0.08)), -4, 3.2, edgeZ - 3.6));
  st.add(at(wallClock({ time: o.clock || '8:41' }), 4, 3.3, edgeZ - 3.7));
  st.add(at(plane(3, 0.5, glowSign(o.name || 'CENTRAL STATION', 3, 0.5, '#2c3e6e', '#ffffff', 90)), 12, 3.6, edgeZ - 3.6));
  st.add(box(len, 5, 0.3, mat(shade(M.wall, 0.05), { map: tiles(shade(M.wall, 0.05), 3, [len / 3, 2], 'rgba(0,0,0,.15)'), rough: 0.9 }), 0, 2.0, edgeZ - pw - 0.15));
  for (let x = -len / 2 + 6; x < len / 2; x += 9) st.add(at(poster({ text: ['GO', 'READ', 'WHAT IF', 'TRAVEL'][Math.abs(x | 0) % 4], w: 1.2, h: 1.7 }), x, 1.8, edgeZ - pw + 0.02));
  put(st, trashCan({}), 2, edgeZ - 5.4);
  const train = trainCar({ lit: true, line: o.line }); train.position.set(o.trainX ?? 0, -1.0, edgeZ + 2.6); st.add(train);
  if (!night) skyDome(st, { clouds: 10 });
  mirror(st, { w: len, d: pw - 0.6, z: edgeZ - pw / 2 - 0.3, strength: 0.18, blur: 1.6 });
  return { train, edgeZ, doorZ: edgeZ + 1.15, bench: (i = 0) => benches[i % benches.length], len };
}
