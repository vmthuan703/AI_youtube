// engine/fall11.js — 1.0.3 an American November (exposed as T.W.* through world3d.js). Sets return anchors like school10.js
// ([x, z, yaw] spots; seats as [x, z, yaw, seatY] for T.act.sitOn).
//
//   const d = T.W.thanksgivingDinner(st)   // the family dining room on Thanksgiving: long table, roast turkey, pies, candles, a fall
//                                          // wreath, dusk in the window; d.seat(i) (0 = head of the table, then round), d.turkey, d.carve
//   const s = T.W.pumpkinStreet(st)        // a suburban street in late fall: porch houses with pumpkins, hay bales, corn stalks, orange
//                                          // trees, leaves everywhere; s.walk(i) sidewalk spots, s.porch(i) front steps, s.lamp(i)
//   T.W.leafGust(st, { at: [x, z], t0, dur, r })   // a whirl of leaves rising round a spot for `dur` seconds (scarves flutter harder)
//   Friday-night football is T.W.footballField under T.W.schoolTime('night') (1.0.1).
import * as THREE from 'three';
import { rng, lerp, clamp } from './core.js';
import { mat, box, rbox, cyl, sphere, plane, group, at, canvasTex, lamp, glow, textTex, ground, cone, torus, planks, asphalt, tiles, contactShadow } from './kit3d.js';
import { tree, chair, table, house, streetLamp } from './world3d.js';
import { aoStrip, skyDome } from './look10.js';
import { leaves } from './weather10.js';

const PI = Math.PI, R2 = PI / 2;
const isNight = (st) => /night|storm|dusk|arctic/.test(st.moodName);
const put = (st, obj, x, z, yaw = 0, y = 0, cs = true) => { obj.position.set(x, y, z); obj.rotation.y = yaw; st.add(obj); if (cs && y < 0.2) st.add(contactShadow(obj)); return obj; };
const FALL = ['#d8582a', '#e8862a', '#f2b632', '#b8402a', '#c8a03a'];

// ---------------------------------------------------------------- props
export function pumpkin(o = {}) {   // a ribbed pumpkin; face: true carves a jack-o'-lantern that glows at night
  const s = o.s || 1, c = mat(o.color || '#e8762a', { rough: 0.55, clearcoat: 0.3 }), g = group();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2, rib = sphere(0.13 * s, c, Math.sin(a) * 0.07 * s, 0.13 * s, Math.cos(a) * 0.07 * s, 14, 10); rib.scale.set(0.62, 0.86, 0.62); rib.rotation.y = a; g.add(rib); }
  g.add(cyl(0.012 * s, 0.018 * s, 0.07 * s, mat('#5a6a2a', { rough: 0.8 }), 0, 0.27 * s, 0, 6));
  if (o.face) { const ft = canvasTex(128, 96, (g2) => { g2.fillStyle = o.lit ? '#ffd27a' : '#2a1408'; for (const x of [34, 94]) { g2.beginPath(); g2.moveTo(x - 14, 40); g2.lineTo(x, 14); g2.lineTo(x + 14, 40); g2.fill(); }
      g2.beginPath(); g2.moveTo(24, 58); for (let i = 0; i <= 8; i++) g2.lineTo(24 + i * 10, 58 + (i % 2 ? 10 : 0) + Math.sin(i / 8 * PI) * 14); g2.lineTo(104, 58); g2.fill(); });
    const f = plane(0.16 * s, 0.12 * s, new THREE.MeshBasicMaterial({ map: ft, transparent: true }));
    f.position.set(0, 0.14 * s, 0.135 * s); g.add(f); if (o.lit) g.add(at(glow('#ffb04a', 0.6 * s, 0.6), 0, 0.14 * s, 0.2 * s)); }
  return g;
}
export function hayBale(o = {}) { const m = mat('#d8b860', { rough: 1, map: planks('#d8b860', 6, [1, 1]) }); return group(rbox(0.9, 0.42, 0.48, 0.06, m, 0, 0.21, 0), box(0.92, 0.03, 0.5, mat('#8a6a2a'), 0, 0.15, 0), box(0.92, 0.03, 0.5, mat('#8a6a2a'), 0, 0.3, 0)); }
export function cornStalks(o = {}) { const m = mat('#c8a860', { rough: 0.95 }), g = group(), r = rng(o.seed || 5);
  for (let i = 0; i < 9; i++) { const st = cone(0.035, 1.5, m, (r() - 0.5) * 0.18, 0.75, (r() - 0.5) * 0.18, 5); st.rotation.set((r() - 0.5) * 0.25, 0, (r() - 0.5) * 0.25); g.add(st); }
  g.add(at(torus(0.12, 0.02, mat('#8a3a2a'), 0, 0.6, 0), 0, 0.6, 0)); return g; }
export function turkey(o = {}) { const sk = mat('#a8602a', { rough: 0.35, clearcoat: 0.8, clearcoatRough: 0.25 }), g = group();
  const b = sphere(0.2, sk, 0, 0.16, 0, 20, 14); b.scale.set(1.15, 0.72, 0.9); g.add(b);
  for (const sx of [-1, 1]) { const leg = cyl(0.05, 0.03, 0.2, sk, sx * 0.13, 0.16, 0.14, 10); leg.rotation.x = -1.1; leg.rotation.z = sx * 0.3; g.add(leg); g.add(sphere(0.022, mat('#f4ecd8'), sx * 0.15, 0.2, 0.24, 8, 6)); }
  g.add(cyl(0.3, 0.32, 0.03, mat('#e8e2d4', { rough: 0.3, clearcoat: 0.6 }), 0, 0.015, 0, 28)); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; g.add(sphere(0.035, mat(i % 2 ? '#5a8a2a' : '#c8322a'), Math.sin(a) * 0.25, 0.04, Math.cos(a) * 0.25, 8, 6)); }
  return g; }
export function pie(o = {}) { const crust = mat('#d8a050', { rough: 0.6 }), fill = mat(o.color || '#c8662a', { rough: 0.5 }), g = group(cyl(0.13, 0.11, 0.045, crust, 0, 0.022, 0, 22), cyl(0.115, 0.115, 0.02, fill, 0, 0.04, 0, 22));
  if (o.lattice !== false) for (let i = -2; i <= 2; i++) { g.add(box(0.012, 0.01, 0.22, crust, i * 0.045, 0.052, 0)); g.add(box(0.22, 0.01, 0.012, crust, 0, 0.056, i * 0.045)); }
  return g; }
export function candle(o = {}) { return group(cyl(0.022, 0.022, o.h || 0.22, mat(o.color || '#f2ead8'), 0, (o.h || 0.22) / 2, 0, 10), at(glow('#ffc070', 0.25, 0.9), 0, (o.h || 0.22) + 0.03, 0), sphere(0.012, new THREE.MeshBasicMaterial({ color: '#ffe0a0' }), 0, (o.h || 0.22) + 0.025, 0, 6, 6)); }
export function fallWreath(o = {}) { const g = group(), r = rng(o.seed || 9); g.add(torus(0.3, 0.07, mat('#6a4a2a', { rough: 0.95 }), 0, 0, 0));
  for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2, l = sphere(0.055, mat(FALL[i % FALL.length], { rough: 0.8 }), Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.03 + r() * 0.02, 8, 6); l.scale.set(1.3, 0.8, 0.4); l.rotation.z = a + r(); g.add(l); }
  return g; }

// ---------------------------------------------------------------- THANKSGIVING DINNER — table along x, window at -z, kitchen door at +x
export function thanksgivingDinner(st, o = {}) {
  const w = o.w || 7.5, d = o.d || 6, h = o.h || 2.9, night = isNight(st), wall = o.wall || '#d8b890';
  const paper = canvasTex(256, 256, (g, W, H) => { g.fillStyle = wall; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(120,70,40,.18)'; g.lineWidth = 6; for (let x = 16; x < W; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } }, [w / 1.2, h / 1.2]);
  const wm = mat(wall, { rough: 0.92, map: paper });
  st.add(ground(w + 0.4, d + 0.4, '#8a5a3a', planks('#8a5a3a', 12, [w / 1.6, d / 1.6]), { rough: 0.45 }));
  st.add(box(w + 0.4, h, 0.2, wm, 0, h / 2, -d / 2 - 0.1), box(0.2, h, d + 0.4, wm, -w / 2 - 0.1, h / 2, 0), box(0.2, h, d + 0.4, wm, w / 2 + 0.1, h / 2, 0), box(w + 0.4, 0.12, d + 0.4, mat('#efe4d0', { rough: 1 }), 0, h + 0.06, 0));
  st.add(box(w, 0.9, 0.03, mat('#6a3a24', { rough: 0.6 }), 0, 0.45, -d / 2 + 0.02), box(w, 0.04, 0.05, mat('#4a2818'), 0, 0.9, -d / 2 + 0.03));   // wainscot
  aoStrip(st, { from: [-w / 2, 0, -d / 2], to: [w / 2, 0, -d / 2] });
  // window with the dusk / night outside, curtains
  const win = plane(1.8, 1.3, new THREE.MeshBasicMaterial({ color: night ? '#1a2440' : '#f2a868' })); win.position.set(0, 1.75, -d / 2 + 0.01); st.add(win);
  st.add(box(1.9, 0.06, 0.06, mat('#f2ead8'), 0, 2.42, -d / 2 + 0.04), box(1.9, 0.06, 0.06, mat('#f2ead8'), 0, 1.08, -d / 2 + 0.04), box(0.05, 1.3, 0.05, mat('#f2ead8'), 0, 1.75, -d / 2 + 0.04));
  for (const sx of [-1, 1]) st.add(box(0.5, 1.7, 0.06, mat('#8a2a24', { rough: 0.9 }), sx * 1.15, 1.6, -d / 2 + 0.08));
  put(st, fallWreath({}), -2.4, -d / 2 + 0.06, 0, 1.8, false);
  const frame = rbox(0.9, 0.65, 0.04, 0.02, mat('#f2c26a', { metal: 0.4, rough: 0.4 }), 0, 0, 0); put(st, frame, 2.4, -d / 2 + 0.04, 0, 1.75, false);
  st.add(at(plane(0.8, 0.55, mat('#ffffff', { map: textTex('GIVE THANKS', { w: 512, h: 352, bg: '#5a2a1a', color: '#f2c26a', size: 70, font: 'Fredoka' }) })), 2.4, 1.75, -d / 2 + 0.065));
  // table, cloth, runner, food
  const T0 = 0.76, tw = o.tableW || 2.6, td = 1.15;
  put(st, table({ w: tw, d: td, h: T0, color: '#5a3420' }), 0, 0);
  st.add(box(tw + 0.12, 0.012, td + 0.12, mat('#f4eedf', { rough: 0.85 }), 0, T0 + 0.032, 0), box(tw + 0.12, 0.25, 0.01, mat('#f4eedf', { rough: 0.85 }), 0, T0 - 0.09, td / 2 + 0.06), box(tw + 0.12, 0.25, 0.01, mat('#f4eedf', { rough: 0.85 }), 0, T0 - 0.09, -td / 2 - 0.06));
  st.add(box(tw - 0.3, 0.004, 0.36, mat('#b8582a', { rough: 0.9 }), 0, T0 + 0.04, 0));
  const top = T0 + 0.042, tk = put(st, turkey({}), 0, 0, 0, top, false);
  put(st, pie({}), -0.75, 0.12, 0, top, false); put(st, pie({ color: '#6a2a3a' }), 0.8, -0.1, 0, top, false);
  put(st, group(cyl(0.12, 0.09, 0.08, mat('#f4f0e8', { clearcoat: 0.5 }), 0, 0.04, 0, 18), sphere(0.1, mat('#f2ead0'), 0, 0.08, 0, 14, 8)), -0.45, -0.25, 0, top, false);   // mashed potatoes
  put(st, group(cyl(0.11, 0.08, 0.06, mat('#f4f0e8'), 0, 0.03, 0, 18), cyl(0.1, 0.1, 0.03, mat('#e8c23a'), 0, 0.06, 0, 18)), 0.45, 0.25, 0, top, false);   // corn
  for (const x of [-0.3, 0.3]) put(st, candle({}), x, 0.02, 0, top, false);
  // places: plates + glasses at each seat; chairs round the table
  const seats = [], spots = [[-tw / 2 - 0.45, 0, R2], [-0.7, td / 2 + 0.45, PI], [0.7, td / 2 + 0.45, PI], [tw / 2 + 0.45, 0, -R2], [0.7, -td / 2 - 0.45, 0], [-0.7, -td / 2 - 0.45, 0]];
  for (const [x, z, yaw] of spots) { const ch = chair({ color: '#4a2a1a', h: 0.42 }); put(st, ch, x, z, yaw);
    const px = x + Math.sin(yaw) * 0.42, pz = z + Math.cos(yaw) * 0.42; st.add(cyl(0.12, 0.1, 0.015, mat('#f8f4ec', { clearcoat: 0.6 }), px, top + 0.008, pz, 20), cyl(0.03, 0.025, 0.12, new THREE.MeshStandardMaterial({ color: '#d8e4f0', transparent: true, opacity: 0.45, roughness: 0.05 }), px + 0.17, top + 0.06, pz, 10));
    seats.push([x, z, yaw, 0.45]); }
  // light: a warm chandelier over the table, a cool kitchen spill from the right
  const ch = group(cyl(0.006, 0.006, 0.6, mat('#2a2018'), 0, -0.3, 0, 4), torus(0.3, 0.02, mat('#c8a040', { metal: 0.7, rough: 0.3 }), 0, -0.62, 0)); ch.children[1].rotation.x = R2;
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; ch.add(at(glow('#ffd28a', 0.35, 0.8), Math.cos(a) * 0.3, -0.56, Math.sin(a) * 0.3)); }
  ch.position.set(0, h, 0); st.add(ch);
  const L = lamp('#ffcf8a', o.lamp ?? 4.5, 7, { bulb: false, shadow: true }); L.position.set(0, h - 0.7, 0.2); st.add(L);
  const K = lamp('#c8d8ff', 1.4, 6, { bulb: false, shadow: false }); K.position.set(w / 2 - 0.4, 2.0, 1.5); st.add(K);
  const kd = at(plane(1.0, 2.1, mat('#e8dcc8', { rough: 0.7 })), w / 2 - 0.01, 1.05, 1.6); kd.rotation.y = -R2; st.add(kd);   // kitchen door
  return { seat: (i = 0) => seats[((i % seats.length) + seats.length) % seats.length], seats, turkey: tk, carve: [-tw / 2 - 0.45, 0.35, R2], table: [0, 0, top], window: [0, -d / 2 + 0.6, PI], door: [w / 2 - 0.6, 1.6, -R2], w, d };
}

// ---------------------------------------------------------------- PUMPKIN STREET — sidewalk along x at z = 0, houses at -z, road at +z
export function pumpkinStreet(st, o = {}) {
  const night = isNight(st), r = rng(o.seed || 21); st.scene.userData.wind = Math.max(st.scene.userData.wind || 0, o.wind ?? 0.5);
  st.add(ground(200, 120, '#7a8a4a', null, { y: -0.02 }));
  st.add(box(200, 0.02, 7, mat('#4a4a52', { map: asphalt('#4a4a52', [40, 2]), rough: 0.88 }), 0, 0.01, 5));
  const swC = '#c8c0b4'; st.add(box(200, 0.14, 2, mat(swC, { map: tiles(swC, 4, [100, 1], 'rgba(0,0,0,.15)') }), 0, 0.07, 0), box(200, 0.15, 0.15, mat('#d8d0c4'), 0, 0.075, 1.0));
  const porches = [], cols = ['#f2ece0', '#c8d8e8', '#f2d8a0', '#d8e8d0', '#e8c8b8'];
  for (let i = 0; i < 6; i++) { const x = -20 + i * 8;
    put(st, house({ color: cols[i % cols.length], roof: ['#5a4a4a', '#3a4a5a', '#6a3a32'][i % 3], seed: i + 7, porch: true }), x, -9, 0, 0, false);
    st.add(box(1.2, 0.02, 6, mat('#b8b0a4'), x, 0.012, -4.5));   // front path
    for (let k = 0; k < 3; k++) put(st, pumpkin({ s: 0.8 + r() * 0.6, face: k === 1, lit: night && k === 1, color: k === 2 ? '#e8d8b0' : undefined }), x - 0.9 + k * 0.45, -6.3 + r() * 0.2, 0, 0.0);
    if (i % 2 === 0) { put(st, hayBale({}), x + 1.6, -5.6, 0.2); put(st, pumpkin({ s: 1.1 }), x + 1.6, -5.6, 0, 0.42, false); }
    if (i % 3 === 1) put(st, cornStalks({ seed: i }), x - 1.6, -6.4, 0);
    porches.push([x, -6.0, PI]); }
  for (let i = 0; i < 7; i++) put(st, tree({ s: 1.1 + r() * 0.4, color: FALL[i % FALL.length], seed: i + 30 }), -24 + i * 8 + 4, -2.2, 0, 0, false);
  const lamps = []; for (let i = 0; i < 5; i++) { const x = -18 + i * 9; put(st, streetLamp({ on: night }), x, 1.3, 0, 0, false); lamps.push([x, 1.3]); }
  leaves(st, { area: [-14, 14, 0, 5, -4, 3], n: 70, ground: 260, colors: FALL, wind: 0.35, seed: o.seed || 4 });
  skyDome?.(st, {});
  return { walk: (i = 0) => [-6 + i * 1.6, 0.35, R2], porch: (i = 0) => porches[((i % porches.length) + porches.length) % porches.length], porches, lamp: (i = 0) => lamps[i % lamps.length] };
}

// ---------------------------------------------------------------- LEAF GUST — a whirl of leaves rising round a spot
export function leafGust(st, o = {}) {
  const [cx, cz] = o.at || [0, 0], t0 = o.t0 ?? 0.5, dur = o.dur ?? 1.6, R = o.r ?? 1.1, n = o.n ?? 70, r = rng(o.seed || 13);
  const tex = canvasTex(64, 64, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(32, 32, 26, 14, 0.6, 0, PI * 2); g.fill(); });
  const M = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.11, 0.11), M, n); im.userData.dynamic = true; im.frustumCulled = false;
  const base = []; for (let i = 0; i < n; i++) { base.push([r() * PI * 2, 0.4 + r() * 0.8, r(), r() * 6]); im.setColorAt(i, new THREE.Color(FALL[i % FALL.length])); }
  const dm = new THREE.Object3D(), gustK = (t) => clamp((t - t0) / 0.25) * clamp((t0 + dur - t) / 0.4);
  const update = (t) => { const k = gustK(t), u = clamp((t - t0) / dur);
    base.forEach(([a0, rr, h0, sd], i) => { const a = a0 + u * 9 * (0.7 + rr * 0.5), rad = R * rr * (0.5 + 0.5 * u), y = k > 0 ? 0.02 + (h0 * 0.4 + u * 2.2 * rr) * k : 0.01;
      dm.position.set(cx + Math.cos(a) * rad, y, cz + Math.sin(a) * rad); dm.rotation.set(k > 0 ? t * 5 + sd : -R2, t * 3 + sd, k > 0 ? Math.sin(t * 7 + sd) : sd); dm.scale.setScalar(k > 0 || u < 0.01 ? 1 : 0.8); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); });
    im.instanceMatrix.needsUpdate = true; };
  update(0); st.add(im); st.onTick(update);
  const base0 = st.scene.userData.wind || 0.2; st.scene.userData.windAt = (t) => Math.min(1, base0 + 0.8 * gustK(t));   // scarves read this
  return { obj: im, k: gustK };
}
