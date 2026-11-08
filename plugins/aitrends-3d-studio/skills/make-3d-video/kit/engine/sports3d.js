// engine/sports3d.js — sports venues and very big crowds (exposed as T.W.* through world3d.js, 0.2.7).
// Thousands of people stay cheap: they are the instanced T.W.crowd (one draw call per body part), arranged on stepped stands.
//
//   const s = T.W.stadium(st, { n: 5000 });        // field 100 × 64 m centred at the origin, stands all round, floodlights
//   T.W.boxingRing(st, { crowd: 700 })  T.W.track(st, { lanes: 6 })  T.W.pool(st, { lanes: 6 })  T.W.formation(st, { cols: 20, rows: 12 })
import * as THREE from 'three';
import { S, shade, mix, rng, clamp, lerp } from './core.js';
import { mat, box, rbox, cyl, sphere, group, at, canvasTex, glow, glowMat, cone, mesh, contactShadow, lightCone, spot, tiles, textTex } from './kit3d.js';
import { crowd } from './world3d.js';
import { water } from './nature3d.js';

const R2 = Math.PI / 2;
// stand(o) → stepped seating along x facing +z, front row at z = 0, rising toward −z, with a crowd seated on it (a group: rotate/move it)
export function stand(o = {}) {
  const { len = 60, rows = 14, step = 0.9, rise = 0.45, n = 900, color = '#3a3a5a', seed = 3, cheer = 0.3 } = o, g = group(), m = mat(color, { rough: 0.85 }), m2 = mat(shade(color, 0.12), { rough: 0.85 });
  for (let i = 0; i < rows; i++) g.add(box(len, rise * (i + 1), step, i % 2 ? m : m2, 0, rise * (i + 1) / 2, -i * step - step / 2));
  g.add(box(len, 1.1, 0.25, mat(o.wall || shade(color, -0.2), { rough: 0.8 }), 0, 0.55, 0.12));   // front wall
  const pos = [], r = rng(seed); for (let i = 0; i < n; i++) { const row = Math.floor(r() * rows); pos.push([(r() - 0.5) * (len - 1), -row * step - step * 0.55]); }
  const c = crowd({ positions: pos, seed, cheer, colors: o.colors, s: 0.92, turn: 0.4, rise: rise / step, riseFrom: 0, y0: rise * 0.45 });
  g.add(c); g.crowd = c; g.tick = (t) => c.tick?.(t); return g;
}
const fieldTex = (kind, L, W) => canvasTex(1024, Math.round(1024 * W / L), (g, w, h) => { const sx = w / L, stripes = kind === 'soccer' ? 10 : 20; for (let i = 0; i < stripes; i++) { g.fillStyle = i % 2 ? '#5f9a52' : '#6aa85c'; g.fillRect(i * w / stripes, 0, w / stripes + 1, h); }
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12); g.beginPath(); g.moveTo(w / 2, 6); g.lineTo(w / 2, h - 6); g.stroke();
  if (kind === 'soccer') { g.beginPath(); g.arc(w / 2, h / 2, 9 * sx, 0, 7); g.stroke(); for (const x of [6, w - 6 - 16 * sx]) g.strokeRect(x, h / 2 - 20 * sx, 16 * sx, 40 * sx); }
  else { for (let i = 1; i < 10; i++) { const x = 6 + i * (w - 12) / 10; g.beginPath(); g.moveTo(x, 6); g.lineTo(x, h - 6); g.stroke(); g.fillStyle = 'rgba(255,255,255,.9)'; g.font = `900 ${h * 0.07}px Nunito`; g.textAlign = 'center'; g.fillText(String(i <= 5 ? i * 10 : (10 - i) * 10), x, h * 0.2); g.fillText(String(i <= 5 ? i * 10 : (10 - i) * 10), x, h * 0.86); } } });
// stadium(st, { kind: 'football'|'soccer', n, rows, standColor, lights, cheer }) → a pitch 100 × 64 m at the origin, stands on all four
// sides full of people, four floodlight towers. Returns { stands, L, W }. Night: mood 'night' + lights. Day: mood 'day'.
export function stadium(st, o = {}) {
  const L = o.L ?? 100, W = o.W ?? 64, kind = o.kind || 'football', n = o.n ?? 5000;
  const field = new THREE.Mesh(new THREE.PlaneGeometry(L + 8, W + 8), mat('#ffffff', { map: fieldTex(kind, L + 8, W + 8), rough: 0.95, keepSat: true })); field.rotation.x = -R2; field.receiveShadow = true; st.add(field);
  st.add(at(group(box(L + 30, 0.02, W + 30, mat('#4a5a48', { rough: 1 }))), 0, -0.02, 0));
  const share = [0.32, 0.32, 0.18, 0.18], stands = [[0, W / 2 + 6, Math.PI, L + 10], [0, -W / 2 - 6, 0, L + 10], [L / 2 + 6, 0, -R2, W + 10], [-L / 2 - 6, 0, R2, W + 10]].map(([x, z, yaw, len], i) => {
    const s = stand({ len, rows: o.rows ?? 16, n: Math.round(n * share[i]), color: o.standColor || '#3a3a5e', seed: 3 + i, cheer: o.cheer ?? 0.35, colors: o.colors }); s.position.set(x, 0, z); s.rotation.y = yaw; st.add(s); return s; });
  if (o.lights !== false) for (const [x, z] of [[-L / 2 - 14, -W / 2 - 14], [L / 2 + 14, -W / 2 - 14], [-L / 2 - 14, W / 2 + 14], [L / 2 + 14, W / 2 + 14]]) {
    const tw = group(cyl(0.4, 0.6, 34, mat('#6a6a7a', { metal: 0.5, rough: 0.4 }), 0, 17, 0, 10), box(7, 3.5, 0.6, mat('#2a2a34'), 0, 35, 0)); const panel = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3), glowMat('#fff6e0', 2.2)); panel.position.set(0, 35, 0.31); tw.add(panel, at(glow('#fff2d0', 18, 0.5), 0, 35, 1)); tw.lookAt(0, 0, 0); tw.rotation.x = 0; tw.position.set(x, 0, z); tw.rotation.y = Math.atan2(-x, -z); st.add(tw); }
  return { stands, L, W };
}
// boxingRing(st, { crowd, size, ropes, matColor, corners }) → a raised ring under hard spotlights in a dark hall, the crowd on stepped seats
// all round. The canvas top is at y = 1.1: stand fighters with place(x, 1.1, z). Returns { top: 1.1, size }.
export function boxingRing(st, o = {}) {
  const S_ = o.size ?? 6, top = 1.1, g = group(); st.add(g);
  g.add(rbox(S_ + 0.6, top, S_ + 0.6, 0.05, mat(o.apron || '#2a3a6a', { rough: 0.7 }), 0, top / 2, 0), box(S_ + 0.2, 0.04, S_ + 0.2, mat(o.matColor || '#c8ccd8', { rough: 0.9 }), 0, top + 0.02, 0));
  const cornerC = o.corners || ['#c83a3a', '#3a5ac8', '#e8e8f0', '#e8e8f0'], h = S_ / 2;
  [[-h, -h], [h, -h], [h, h], [-h, h]].forEach(([x, z], i) => { g.add(cyl(0.07, 0.07, 1.5, mat('#9a9aa8', { metal: 0.6, rough: 0.3 }), x, top + 0.75, z, 10), rbox(0.22, 1.1, 0.22, 0.06, mat(cornerC[i], { rough: 0.6 }), x, top + 0.75, z)); });
  const ropeC = o.ropes || ['#c83a3a', '#f0f0f4', '#3a5ac8'];
  [0.45, 0.85, 1.25].forEach((y, k) => { for (const [x1, z1, x2, z2] of [[-h, -h, h, -h], [h, -h, h, h], [h, h, -h, h], [-h, h, -h, -h]]) { const L = Math.hypot(x2 - x1, z2 - z1), r = cyl(0.035, 0.035, L, mat(ropeC[k], { rough: 0.5 }), (x1 + x2) / 2, top + y, (z1 + z2) / 2, 8); r.rotation.set(0, Math.atan2(-(z2 - z1), x2 - x1), R2); /* Ry aims the rope along its edge (fixed: ropes used to run across the ring) */ g.add(r); } });
  st.add(at(spot('#fff4e0', 120, { pos: [0, 12, 2], target: [0, top, 0], angle: 0.42, penumbra: 0.5 }), 0, 0, 0)); const cn = lightCone(4.6, 11, '#fff4e0', 0.06); cn.position.set(0, 12, 0); st.add(cn);
  if (o.crowd !== 0) [[0, S_ / 2 + 4, Math.PI], [0, -S_ / 2 - 4, 0], [S_ / 2 + 4, 0, -R2], [-S_ / 2 - 4, 0, R2]].forEach(([x, z, yaw], i) => { const s = stand({ len: S_ + 14, rows: 10, n: Math.round((o.crowd ?? 700) / 4), color: '#2a2438', seed: 9 + i, cheer: o.cheer ?? 0.45 }); s.position.set(x, 0, z); s.rotation.y = yaw; st.add(s); });
  st.add(at(group(box(80, 0.02, 80, mat('#1e1a28', { rough: 1 }))), 0, -0.01, 0));
  return { top, size: S_ };
}
// track(st, { lanes, length, bleachers, crowd }) → a straight running track along x (lanes 1.22 m wide from z = 0 toward +z), lane
// numbers at the start line x = −length/2, grass beyond, bleachers with people behind. Returns { laneZ(i), startX, finishX }.
export function track(st, o = {}) {
  const lanes = o.lanes ?? 6, Lg = o.length ?? 120, lw = 1.22, W = lanes * lw, red = '#b8503e';
  const tex = canvasTex(2048, 256, (g, w, h) => { g.fillStyle = red; g.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.03 + r() * 0.04})`; g.fillRect(r() * w, r() * h, 2, 2); }
    g.fillStyle = 'rgba(255,255,255,.92)'; for (let i = 0; i <= lanes; i++) g.fillRect(0, (i / lanes) * h - 2, w, 4); g.fillRect(w * 0.03, 0, 6, h); g.fillRect(w * 0.97, 0, 6, h);
    g.font = `900 ${h / lanes * 0.6}px Nunito`; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 0; i < lanes; i++) { g.save(); g.translate(w * 0.05, ((i + 0.5) / lanes) * h); g.rotate(R2); g.fillText(String(i + 1), 0, 0); g.restore(); } });
  const t = new THREE.Mesh(new THREE.PlaneGeometry(Lg, W), mat('#ffffff', { map: tex, rough: 0.9, keepSat: true })); t.rotation.x = -R2; t.position.set(0, 0.01, W / 2); t.receiveShadow = true; st.add(t);
  st.add(at(group(box(Lg + 80, 0.02, 120, mat('#6a9a5a', { rough: 1 }))), 0, -0.01, 0));
  if (o.bleachers !== false) { const s = stand({ len: Lg * 0.8, rows: 12, n: o.crowd ?? 1200, color: '#4a4a66', seed: 21, cheer: o.cheer ?? 0.35 }); s.position.set(0, 0, -4); st.add(s); }
  return { laneZ: (i) => (i + 0.5) * lw, startX: -Lg / 2 + Lg * 0.03, finishX: Lg / 2 - Lg * 0.03 };
}
// pool(st, { lanes, length, width, depth }) → a tiled pool along x with lane ropes, starting blocks, ladders and a deck. The water surface
// is y = 0 and see-through: place a swimmer at y ≈ −0.95 to stand in it, head and shoulders out. Returns { surfaceY: 0, laneZ(i), depth }.
export function pool(st, o = {}) {
  const lanes = o.lanes ?? 6, Lg = o.length ?? 25, lw = 2.2, W = o.width ?? lanes * lw, D = o.depth ?? 1.8, tileC = '#9ad8e8';
  const tm = mat('#ffffff', { map: tiles(tileC, 16, [Lg / 2, W / 2], 'rgba(40,90,120,.35)'), rough: 0.5, keepSat: true }), wall = mat('#ffffff', { map: tiles(tileC, 8, [Lg / 2, 1], 'rgba(40,90,120,.35)'), rough: 0.5, keepSat: true });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(Lg, W), tm); floor.rotation.x = -R2; floor.position.y = -D; floor.receiveShadow = true; st.add(floor);
  for (let i = 0; i < lanes; i++) { const l = box(Lg - 3, 0.005, 0.25, mat('#2a4a8a', { rough: 0.6 }), 0, -D + 0.01, -W / 2 + (i + 0.5) * lw); st.add(l); }
  for (const [x, z, w, ry] of [[0, -W / 2, Lg, 0], [0, W / 2, Lg, 0], [-Lg / 2, 0, W, R2], [Lg / 2, 0, W, R2]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, D), wall); p.position.set(x, -D / 2, z); p.rotation.y = ry + (z > 0 || x > 0 ? Math.PI : 0); p.receiveShadow = true; st.add(p); }
  const deck = mat('#e8e2d8', { rough: 0.7 }), dw = 6; for (const [x, z, w, d] of [[0, -W / 2 - dw / 2, Lg + 2 * dw, dw], [0, W / 2 + dw / 2, Lg + 2 * dw, dw], [-Lg / 2 - dw / 2, 0, dw, W], [Lg / 2 + dw / 2, 0, dw, W]]) st.add(box(w, 0.1, d, deck, x, 0.05, z));
  const sea = water(st, { w: Lg, d: W, center: [0, 0], y: -0.02, seg: 64, shallow: '#6ad8e6', deep: '#3ab0d8', depthAt: () => 0.4, waves: 0.25, glints: 0, opacity: 0.55 });
  for (let i = 1; i < lanes; i++) { const z = -W / 2 + i * lw, g = group(); for (let k = 0; k < 60; k++) g.add(cyl(0.05, 0.05, 0.12, mat(k % 6 < 3 ? '#e84a4a' : '#f0f0f4', { rough: 0.5 }), -Lg / 2 + 0.5 + k * (Lg - 1) / 59, 0.0, z, 8)); g.children.forEach(c => (c.rotation.z = R2)); st.add(g); }
  for (let i = 0; i < lanes; i++) { const z = -W / 2 + (i + 0.5) * lw; st.add(at(group(rbox(0.5, 0.7, 0.5, 0.05, mat('#e8e8ee'), 0, 0.35, 0), box(0.52, 0.06, 0.52, mat('#3a6ad6'), 0, 0.72, 0)), -Lg / 2 - 0.4, 0, z)); }
  for (const z of [-W / 2 + 0.5, W / 2 - 0.5]) for (const s of [-0.25, 0.25]) { const r = cyl(0.03, 0.03, 1.9, mat('#c8ccd8', { metal: 0.7, rough: 0.25 }), Lg / 2 - 1.2 + s, 0.2, z, 8); st.add(r); }
  return { surfaceY: 0, laneZ: (i) => -W / 2 + (i + 0.5) * lw, depth: D, water: sea };
}
// formation(st, { cols, rows, gap, pos, yaw, colors, hairColors, same, cheer }) → people standing in a grid (an army of clones, a whole
// school on the field, a queue). same: true gives everyone one size and facing. Instanced: hundreds cost almost nothing.
export function formation(st, o = {}) {
  const { cols = 12, rows = 8, gap = 1.1, pos = [0, 0], jitter = 0.08 } = o, r = rng(o.seed ?? 5), P = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) P.push([pos[0] + (i - (cols - 1) / 2) * gap + (r() - 0.5) * jitter, pos[1] - j * gap + (r() - 0.5) * jitter]);
  const c = crowd({ positions: P, colors: o.colors, hairColors: o.hairColors, same: o.same, cheer: o.cheer ?? 0, yaw: o.yaw || 0, turn: o.turn ?? 0.2, seed: o.seed ?? 5, still: o.still }); st.add(c); return c;
}
