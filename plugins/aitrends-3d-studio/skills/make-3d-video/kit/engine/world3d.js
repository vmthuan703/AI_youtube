// engine/world3d.js — reusable 3D sets and props (T.W.*). Everything is built from simple shapes, canvas textures
// and a few real lights, so it renders on CPU (SwiftShader) too. Props stand on y = 0 and face +z; sets build into a stage.
//
//   const city = T.W.city(st, { seed: 3 });        // night street along the x axis (road z ∈ [-4, 4])
//   const room = T.W.room(st, { kind: 'bedroom' }); // interior, back wall at z = -d/2, open toward +z
//   st.add(T.at(T.W.car({ color: '#d63a2a' }), x, 0, z, yaw));
// Real point lights are expensive: sets add at most `lights` of them near `focus` (default 4); the rest are glow-only.
import * as THREE from 'three';
import { dust } from './fx3d.js';
import { S, mood, shade, mix, rng, clamp, lerp, noise } from './core.js';
import { mat, box, rbox, cyl, sphere, plane, group, at, canvasTex, lamp, lightCone, glow, glowMat, prep, roundedBoxGeo, textTex, screen, cached, asphalt, tiles, planks, carpet, ground, color, cone, torus, capsule, mesh, contactShadow } from './kit3d.js';

const R2 = Math.PI / 2;
// greyscale multiplier for walls: light falls off toward the floor and a faint paint mottle, so walls are never flat slabs
const wallTex = () => cached('wallTex', () => canvasTex(256, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#f4f4f4'); gr.addColorStop(0.55, '#ffffff'); gr.addColorStop(1, '#c8c8c8'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const r = rng(17); for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(' + (r() < 0.5 ? '0,0,0' : '255,255,255') + ',' + (0.015 + r() * 0.02) + ')'; const s = 4 + r() * 18; g.fillRect(r() * W, r() * H, s, s); } }));
// ---------------------------------------------------------------- textures
function windowsTex(cols, rows, o = {}) {
  const { color: base = '#2a2238', win = '#ffcf7a', lit = 0.45, seed = 3, shop = false, shopColor = '#ffd28a', cool = 0.12 } = o; const r = rng(seed);
  const cw = 48, ch = 64;
  return canvasTex(cols * cw, rows * ch, (g, W, H) => {
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let j = 0; j < rows; j++) { g.fillStyle = shade(base, -0.25); g.fillRect(0, j * ch + ch - 6, W, 4); }
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (shop && j === rows - 1) continue;
      const on = r() < lit; const c = on ? (r() < cool ? '#9fc8ff' : mix(win, '#ffffff', r() * 0.25)) : shade(base, -0.45);
      const x = i * cw + 10, y = j * ch + 12, w = cw - 20, h = ch - 26; g.fillStyle = c; g.fillRect(x, y, w, h);
      if (on) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, y + h * (0.3 + r() * 0.5), w, 3); if (r() < 0.5) { g.fillStyle = 'rgba(40,20,30,.45)'; g.fillRect(x + w * r() * 0.6, y + h * 0.5, w * 0.35, h * 0.5); } }
      g.fillStyle = shade(base, -0.35); g.fillRect(x - 2, y + h, w + 4, 4);
    }
    if (shop) { const y = (rows - 1) * ch; g.fillStyle = shade(base, -0.35); g.fillRect(0, y, W, ch); for (let i = 0; i < cols; i += 2) { g.fillStyle = mix(shopColor, '#ffffff', 0.1); g.fillRect(i * cw + 6, y + 14, cw * 2 - 12, ch - 18); g.fillStyle = 'rgba(30,15,20,.55)'; for (let k = 0; k < 4; k++) g.fillRect(i * cw + 12 + k * 22, y + ch - 26 - (k % 2) * 8, 12, 22 + (k % 2) * 8); } }
  });
}
const skylineTex = (o = {}) => cached('skyline' + (o.seed || 1) + (o.color || ''), () => canvasTex(2048, 512, (g, W, H) => {
  const r = rng(o.seed || 1); const base = o.color || '#1a1530'; g.clearRect(0, 0, W, H);
  let x = 0; while (x < W) { const w = 40 + r() * 110, h = H * (0.25 + r() * 0.7); g.fillStyle = shade(base, (r() - 0.5) * 0.15); g.fillRect(x, H - h, w, h);
    for (let yy = H - h + 10; yy < H - 8; yy += 16) for (let xx = x + 6; xx < x + w - 8; xx += 12) if (r() < 0.32) { g.fillStyle = r() < 0.15 ? 'rgba(160,200,255,.8)' : `rgba(255,${190 + (r() * 40) | 0},110,${0.55 + r() * 0.4})`; g.fillRect(xx, yy, 5, 7); }
    if (r() < 0.25) { g.fillStyle = '#ff3a3a'; g.fillRect(x + w / 2 - 2, H - h - 14, 4, 4); }
    x += w + r() * 6; }
}));
// ---------------------------------------------------------------- sky helpers
export function stars(n = 500, o = {}) { const r = rng(o.seed || 9); const pos = []; for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, e = 0.08 + r() * 1.3, R = o.radius || 300; pos.push(Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R, Math.sin(a) * Math.cos(e) * R); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color: o.color || '#ffffff', size: o.size || 1.6, sizeAttenuation: false, transparent: true, opacity: o.opacity ?? 0.8, fog: false, depthWrite: false })); }
export function moon(o = {}) { const g = group(); const m = new THREE.Mesh(new THREE.SphereGeometry(o.r || 6, 32, 16), glowMat(o.color || '#f4ecff', 1.4, { fog: false })); g.add(m); const h = glow(o.color || '#c8b8ff', (o.r || 6) * 7, 0.35); g.add(h); g.position.set(...(o.pos || [-60, 70, -180])); return g; }
// ring of distant skyline cards around the origin (cheap depth)
export function skyline(o = {}) { const g = group(); const n = o.count || 8, R = o.radius || 110, h = o.height || 45; for (let i = 0; i < n; i++) { const a = (o.from ?? -2.2) + ((o.to ?? 2.2) - (o.from ?? -2.2)) * (i / Math.max(1, n - 1)); const m = new THREE.Mesh(new THREE.PlaneGeometry((2 * Math.PI * R) / n * 1.15, h), new THREE.MeshBasicMaterial({ map: skylineTex({ seed: (o.seed || 1) + i, color: o.color }), transparent: true, fog: false, depthWrite: false, color: new THREE.Color(o.tint || '#ffffff') })); m.position.set(Math.sin(a) * R, h / 2 - 2, -Math.cos(a) * R); m.lookAt(0, h / 2 - 2, 0); g.add(m); } g.renderOrder = -1; return g; }

// ---------------------------------------------------------------- props: street
export function building(w, h, d, o = {}) {
  const st = S(); const M = mood(o.mood); const base = o.color || M.wall;
  const cols = Math.max(2, Math.round(w / 1.6)), rows = Math.max(2, Math.round(h / 3.0));
  const t = windowsTex(cols, rows, { ...o, color: base, win: o.win || M.practical, seed: o.seed || 3, shop: o.shop ?? true });
  const front = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color(o.glow ?? 0.9, o.glow ?? 0.9, o.glow ?? 0.9), roughness: 0.95 });
  const side = mat(shade(base, -0.12)), roof = mat(shade(base, -0.3));
  const m = prep(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, roof, side, front, side])); m.position.y = h / 2;
  const g = group(m);
  g.add(box(w + 0.3, 0.35, d + 0.3, shade(base, -0.2), 0, h + 0.17, 0));                      // roof lip
  if (o.awning !== false && (o.shop ?? true)) { const aw = box(w * 0.9, 0.12, 1.2, o.awningColor || shade(M.accent || '#ff7a5a', -0.2), 0, 3.0, d / 2 + 0.6); aw.rotation.x = 0.18; g.add(aw); }
  if (o.sign) { const sg = neonSign(o.sign, { color: o.signColor || M.accent || '#ff4f8a', w: Math.min(w * 0.7, 4) }); sg.position.set(0, 3.7, d / 2 + 0.08); g.add(sg); }
  if (o.antenna) g.add(cyl(0.05, 0.05, 3, '#222', w * 0.2, h + 1.5, 0));
  return g;
}
export function neonSign(text, o = {}) { const w = o.w || 3, h = o.h || w * 0.3; const t = textTex(text, { w: 512, h: Math.round(512 * h / w), color: o.color || '#ff4f8a', size: o.size || 120, glow: 30, bg: o.bg || 'rgba(10,6,20,.9)' }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.6, 1.6, 1.6), toneMapped: false })); return group(m); }
export function streetLamp(o = {}) {
  const M = mood(o.mood); const h = o.h || 5.2, c = o.color || M.practical; const pole = mat('#1a1724', { rough: 0.5, metal: 0.4 });
  const g = group(cyl(0.07, 0.1, h, pole, 0, h / 2, 0, 10), cyl(0.18, 0.22, 0.4, pole, 0, 0.2, 0, 10));
  const arm = box(0.08, 0.08, 1.4, pole, 0, h - 0.05, 0.65); g.add(arm);
  const head = rbox(0.34, 0.14, 0.55, 0.05, pole, 0, h - 0.12, 1.25); g.add(head);
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.42), glowMat(c, 2.2)); bulb.position.set(0, h - 0.2, 1.25); g.add(bulb);
  const halo = glow(c, 2.4, 0.55); halo.position.set(0, h - 0.3, 1.25); g.add(halo);
  if (o.cone !== false) { const cn = lightCone(1.9, h - 0.25, c, o.coneOpacity ?? 0.07); cn.position.set(0, h - 0.22, 1.25); g.add(cn); }
  if (o.light) { const L = lamp(c, o.intensity ?? 9, o.dist ?? 13, { bulb: false, decay: 1.3 }); L.position.set(0, h - 0.4, 1.25); g.add(L); g.lampLight = L.light; }
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ map: cached('poolTex', () => canvasTex(128, 128, (gg, w, hh) => { const gr = gg.createRadialGradient(w / 2, hh / 2, 0, w / 2, hh / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, w, hh); })), color: color(c), transparent: true, opacity: o.poolOpacity ?? 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -R2; pool.position.set(0, (o.poolY ?? 0) + 0.02, 1.25); g.add(pool);
  return g;
}
export function trafficLight(o = {}) { const p = mat('#1a1820', { rough: 0.5, metal: 0.4 }); const g = group(cyl(0.08, 0.08, 4.2, p, 0, 2.1, 0, 10)); const hb = rbox(0.38, 1.05, 0.32, 0.06, p, 0, 4.3, 0.1); g.add(hb); const st = o.state || 'red'; [['red', '#ff3a2a', 4.62], ['yellow', '#ffc23a', 4.3], ['green', '#3aff8a', 3.98]].forEach(([k, c, y]) => { const on = k === st; const l = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), on ? glowMat(c, 2.5) : mat(shade(c, -0.75))); l.position.set(0, y, 0.27); g.add(l); if (on) { const h = glow(c, 1.2, 0.6); h.position.set(0, y, 0.3); g.add(h); } }); return g; }
export function tree(o = {}) { const s = o.s || 1, c = o.color || '#1f2a2a'; const g = group(cyl(0.12 * s, 0.18 * s, 2.4 * s, mat('#2a1d1a'), 0, 1.2 * s, 0, 8)); const leaf = mat(c, { flat: true, rough: 0.95 }); const r = rng(o.seed || 2); if (o.type === 'pine') { for (let k = 0; k < 3; k++) g.add(cone((1.4 - k * 0.35) * s, 1.8 * s, leaf, 0, (2.2 + k * 1.0) * s, 0, 8)); } else for (const [dx, dy, dz, rr] of [[0, 3.2, 0, 1.3], [-0.8, 2.7, 0.3, 0.95], [0.75, 2.8, -0.25, 1.0], [0.1, 3.9, 0.2, 0.8]]) { const m = sphere(rr * s * (0.9 + r() * 0.2), leaf, dx * s, dy * s, dz * s, 10, 8); g.add(m); } return g; }
export function bench(o = {}) { const w = mat(o.color || '#4a3428', { rough: 0.9 }), m = mat('#1a1820', { metal: 0.5, rough: 0.5 }); const g = group(); for (let i = 0; i < 3; i++) g.add(box(1.8, 0.05, 0.12, w, 0, 0.45, -0.15 + i * 0.15)); for (let i = 0; i < 2; i++) { const b = box(1.8, 0.1, 0.04, w, 0, 0.7 + i * 0.16, -0.27); b.rotation.x = -0.15; g.add(b); } for (const x of [-0.75, 0.75]) g.add(box(0.06, 0.45, 0.45, m, x, 0.22, 0), box(0.06, 0.45, 0.05, m, x, 0.75, -0.28)); return g; }
export function hydrant(o = {}) { const m = mat(o.color || '#c23a2a', { rough: 0.5 }); return group(cyl(0.13, 0.15, 0.6, m, 0, 0.3, 0), sphere(0.13, m, 0, 0.62, 0), cyl(0.05, 0.05, 0.4, m, 0, 0.42, 0)); }
export function trashCan(o = {}) { const m = mat(o.color || '#2a3a3a', { rough: 0.6, metal: 0.3 }); return group(cyl(0.28, 0.25, 0.9, m, 0, 0.45, 0, 16), cyl(0.3, 0.3, 0.06, m, 0, 0.92, 0, 16)); }
// stylised car: body along z (front = +z). type: sports|sedan|suv|taxi|police|van. lights: headlight glow + optional real spot
export function car(o = {}) {
  const c = o.color || '#d63a2a', type = o.type || 'sedan'; const body = mat(type === 'taxi' ? '#f2c21a' : type === 'police' ? '#f4f4f4' : c, { rough: 0.25, metal: 0.55, rim: 0.3 });
  const glass = mat('#1a2238', { rough: 0.1, metal: 0.6, transparent: true, opacity: 0.55 }), dark = mat('#0b0b10', { rough: 0.8 }), chrome = mat('#c8c8d0', { rough: 0.2, metal: 0.9 });
  const L = type === 'sports' ? 4.4 : type === 'suv' || type === 'van' ? 4.8 : 4.5, W = 1.9, H = type === 'sports' ? 0.62 : type === 'suv' || type === 'van' ? 0.95 : 0.72;
  const g = new THREE.Group();
  g.add(rbox(W, H, L, 0.22, body, 0, 0.38 + H / 2, 0));
  const cabH = type === 'sports' ? 0.42 : type === 'van' ? 0.85 : 0.6, cabL = type === 'sports' ? 1.8 : type === 'van' ? L * 0.8 : 2.3, cabZ = type === 'sports' ? -0.3 : type === 'van' ? -0.2 : -0.15;
  const cab = rbox(W * 0.88, cabH, cabL, 0.2, glass, 0, 0.38 + H + cabH / 2 - 0.05, cabZ); g.add(cab);
  const roof = rbox(W * 0.86, 0.07, cabL * 0.82, 0.03, body, 0, 0.38 + H + cabH - 0.05, cabZ); g.add(roof);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const wz = sz * L * 0.32; const tire = cyl(0.36, 0.36, 0.26, dark, sx * W * 0.47, 0.36, wz, 20); tire.rotation.z = R2; const rim = cyl(0.2, 0.2, 0.28, chrome, sx * W * 0.47, 0.36, wz, 14); rim.rotation.z = R2; g.add(tire, rim); }
  const hl = o.lightColor || '#fff4d8';
  for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.05), glowMat(hl, o.lights === false ? 0.4 : 2.4)); h.position.set(sx * W * 0.32, 0.38 + H * 0.7, L / 2 + 0.01); g.add(h); const tl = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.05), glowMat('#ff2a2a', o.lights === false ? 0.5 : 1.8)); tl.position.set(sx * W * 0.32, 0.38 + H * 0.72, -L / 2 - 0.01); g.add(tl); if (o.lights !== false) { const gl = glow(hl, 1.3, 0.6); gl.position.set(sx * W * 0.32, 0.38 + H * 0.7, L / 2 + 0.15); g.add(gl); } }
  g.add(box(W * 0.95, 0.12, 0.1, dark, 0, 0.42, L / 2 + 0.02), box(W * 0.95, 0.12, 0.1, dark, 0, 0.42, -L / 2 - 0.02));
  if (type === 'taxi') { const sign = rbox(0.6, 0.18, 0.25, 0.04, glowMat('#ffe9a0', 1.3), 0, 0.38 + H + cabH + 0.08, cabZ); g.add(sign); }
  if (type === 'police') { g.add(rbox(W * 1.002, H * 0.45, L * 0.45, 0.1, mat('#15182a', { rough: 0.3, metal: 0.5 }), 0, 0.38 + H * 0.45, 0)); const bar = group(box(0.4, 0.1, 0.22, glowMat('#ff2a3a', 2), -0.22, 0, 0), box(0.4, 0.1, 0.22, glowMat('#2a6aff', 2), 0.22, 0, 0)); bar.position.set(0, 0.38 + H + cabH + 0.02, cabZ); g.add(bar); g.siren = bar; }
  if (o.headlights) { const sp = new THREE.SpotLight(color(hl), o.headlights, 30, 0.45, 0.6, 1.2); sp.position.set(0, 0.8, L / 2); sp.target.position.set(0, 0, L / 2 + 10); g.add(sp, sp.target); }
  if (o.driver) { g.driver = o.driver; o.driver.position.set(-0.4, -0.15, cabZ + 0.1); g.add(o.driver); }
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; } });
  return g;
}
// ---------------------------------------------------------------- props: interior
const wood = (c = '#6a4a3a') => mat(c, { rough: 0.8 });
export function table(o = {}) { const w = o.w || 1.4, d = o.d || 0.8, h = o.h || 0.76, m = o.mat || wood(o.color); const g = group(rbox(w, 0.05, d, 0.02, m, 0, h, 0)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.05, h, 0.05, m, sx * (w / 2 - 0.08), h / 2, sz * (d / 2 - 0.08))); return g; }
export function desk(o = {}) { const g = table({ w: o.w || 1.3, d: o.d || 0.65, color: o.color || '#4a3a48' }); g.add(box(0.4, 0.5, (o.d || 0.65) - 0.1, wood(shade(o.color || '#4a3a48', -0.15)), (o.w || 1.3) / 2 - 0.25, 0.48, 0)); return g; }
export function chair(o = {}) { const m = mat(o.color || '#2a2430', { rough: 0.7 }); const h = o.h || 0.4; const g = group(rbox(0.46, 0.06, 0.44, 0.02, m, 0, h, 0), rbox(0.44, 0.5, 0.05, 0.02, m, 0, h + 0.28, -0.2)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.02, 0.02, h, m, sx * 0.19, h / 2, sz * 0.18, 6)); return g; }
export function officeChair(o = {}) { const m = mat(o.color || '#1e1e28', { rough: 0.6 }); const g = group(rbox(0.5, 0.08, 0.48, 0.04, m, 0, 0.42, 0), rbox(0.46, 0.6, 0.07, 0.05, m, 0, 0.8, -0.22), cyl(0.03, 0.03, 0.34, m, 0, 0.24, 0)); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const l = box(0.04, 0.03, 0.32, m, Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15); l.rotation.y = a; g.add(l); } return g; }
export function bed(o = {}) { const c = o.color || '#3a5aa0', fr = wood(o.frame || '#3a2a2a'); const g = group(box(1.5, 0.35, 2.1, fr, 0, 0.18, 0), rbox(1.45, 0.22, 2.0, 0.08, mat('#ece6f0', { rough: 0.9 }), 0, 0.46, 0), rbox(1.47, 0.12, 1.4, 0.06, mat(c, { rough: 0.95 }), 0, 0.58, 0.33), rbox(0.6, 0.14, 0.38, 0.07, mat('#f4f0f6', { rough: 0.95 }), -0.35, 0.62, -0.75), rbox(0.6, 0.14, 0.38, 0.07, mat('#f4f0f6', { rough: 0.95 }), 0.35, 0.62, -0.75), box(1.6, 1.0, 0.08, fr, 0, 0.6, -1.06)); return g; }
export function sofa(o = {}) { const m = mat(o.color || '#7a3a4a', { rough: 0.95 }); return group(rbox(2.0, 0.42, 0.9, 0.1, m, 0, 0.25, 0), rbox(2.0, 0.55, 0.22, 0.1, m, 0, 0.62, -0.36), rbox(0.22, 0.6, 0.9, 0.1, m, -1.0, 0.4, 0), rbox(0.22, 0.6, 0.9, 0.1, m, 1.0, 0.4, 0), rbox(0.9, 0.14, 0.7, 0.07, mat(shade(o.color || '#7a3a4a', 0.08)), -0.46, 0.5, 0.06), rbox(0.9, 0.14, 0.7, 0.07, mat(shade(o.color || '#7a3a4a', 0.08)), 0.46, 0.5, 0.06)); }
export function shelf(o = {}) { const m = wood(o.color || '#4a3438'); const g = group(box(1.0, 1.8, 0.05, m, 0, 0.9, -0.15), box(0.05, 1.8, 0.35, m, -0.5, 0.9, 0), box(0.05, 1.8, 0.35, m, 0.5, 0.9, 0)); const r = rng(o.seed || 4); const cols = ['#c04a3a', '#3a6aa0', '#e0b04a', '#4a9a6a', '#8a5ad6', '#e8e0d0']; for (let k = 0; k < 4; k++) { g.add(box(1.0, 0.04, 0.35, m, 0, 0.1 + k * 0.45, 0)); let x = -0.44; while (x < 0.4) { const w = 0.04 + r() * 0.05, h = 0.22 + r() * 0.14; g.add(box(w, h, 0.24, cols[(r() * cols.length) | 0], x + w / 2, 0.12 + k * 0.45 + h / 2, 0)); x += w + 0.01; } } return g; }
export function door(o = {}) { const g = group(rbox(0.95, 2.1, 0.06, 0.02, wood(o.color || '#5a3a32'), 0, 1.05, 0), sphere(0.04, mat('#d8c070', { metal: 0.8, rough: 0.3 }), 0.38, 1.0, 0.06)); g.add(box(1.1, 0.08, 0.1, wood(shade(o.color || '#5a3a32', -0.2)), 0, 2.14, 0)); return g; }
export function tv(o = {}) { const w = o.w || 1.6, h = w * 0.5625; const scr = o.draw ? screen(w * 0.96, h * 0.94, o.draw, { power: 1.1 }) : new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.94), glowMat(o.color || '#3a6ad6', 0.9)); scr.position.z = 0.031; const g = group(rbox(w, h, 0.05, 0.02, mat('#0b0b10', { rough: 0.3 }), 0, 0, 0), scr); g.position.y = o.y ?? 1.3; g.screen = scr; return g; }
export function laptop(o = {}) { const m = mat('#8a8c96', { rough: 0.35, metal: 0.6 }); const base = rbox(0.34, 0.02, 0.24, 0.01, m, 0, 0.01, 0); const lid = new THREE.Group(); lid.add(rbox(0.34, 0.23, 0.012, 0.01, m, 0, 0.115, 0)); const scr = o.draw ? screen(0.31, 0.2, o.draw, { px: 384 }) : new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.2), glowMat(o.color || '#6aa0ff', 1.0)); scr.position.set(0, 0.115, 0.008); lid.add(scr); lid.position.set(0, 0.02, -0.12); lid.rotation.x = -0.25; const g = group(base, lid); g.screen = scr; return g; }
// phone: o.draw(g, w, h, t) paints the screen (call phone.screen.update(t) each frame for animated UI)
export function phone(o = {}) { const w = 0.075, h = 0.155; const scr = screen(w * 0.9, h * 0.92, o.draw || ((g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3a2a8a'); gr.addColorStop(1, '#e05a8a'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }), { px: 256, power: o.power ?? 1.25 }); scr.position.z = 0.0051; const g = group(rbox(w, h, 0.009, 0.006, mat(o.color || '#15151c', { rough: 0.3, metal: 0.5 }), 0, 0, 0), scr); g.screen = scr; return g; }
export function cup(o = {}) { return group(cyl(0.045, 0.035, 0.1, mat(o.color || '#f2ece4', { rough: 0.4 }), 0, 0.05, 0, 16)); }
export function bottle(o = {}) { const c = o.color || '#3a7ad6'; const glassM = mat(c, { rough: 0.15, metal: 0.1, transparent: true, opacity: 0.85 }); const g = group(cyl(0.035, 0.035, 0.16, glassM, 0, 0.08, 0, 16), cyl(0.015, 0.03, 0.05, glassM, 0, 0.185, 0, 12), cyl(0.017, 0.017, 0.02, mat(o.cap || '#f4f4f4'), 0, 0.22, 0, 10)); if (o.label) { const lt = new THREE.Mesh(new THREE.CylinderGeometry(0.0362, 0.0362, 0.07, 20, 1, true), new THREE.MeshStandardMaterial({ map: textTex(o.label, { w: 256, h: 96, bg: o.labelBg || '#f4f4f4', color: o.labelColor || '#e0302a', size: 48, font: 'Nunito', weight: 900 }), roughness: 0.6 })); lt.position.y = 0.09; g.add(lt); } return g; }
export function book(o = {}) { return group(box(0.16, 0.03, 0.22, o.color || '#c04a3a', 0, 0.015, 0), box(0.15, 0.026, 0.21, '#f4efe4', 0.006, 0.015, 0)); }
export function plant(o = {}) { const g = group(cyl(0.16, 0.12, 0.3, mat(o.pot || '#c06a4a'), 0, 0.15, 0, 12)); const leaf = mat(o.color || '#3a8a5a', { rough: 0.9 }); const r = rng(o.seed || 3); for (let i = 0; i < 7; i++) { const l = capsule(0.04, 0.35, leaf, 0, 0.45, 0); l.rotation.set((r() - 0.5) * 1.1, r() * 6, (r() - 0.5) * 1.1); g.add(l); } return g; }
export function deskLamp(o = {}) { const c = o.color || '#ffd28a'; const m = mat('#1e1e26', { metal: 0.5, rough: 0.4 }); const g = group(cyl(0.09, 0.1, 0.03, m, 0, 0.015, 0), cyl(0.012, 0.012, 0.4, m, 0, 0.21, 0, 8), cone(0.09, 0.12, m, 0.05, 0.42, 0, 16)); const L = lamp(c, o.intensity ?? 3, o.dist ?? 4, { bulbR: 0.03 }); L.position.set(0.05, 0.36, 0); g.add(L); g.lampLight = L.light; return g; }
export function ceilingLamp(o = {}) { const c = o.color || '#ffd9a0'; const g = group(cyl(0.005, 0.005, 0.6, '#111', 0, -0.3, 0, 4), cone(0.25, 0.2, mat('#2a2430', { side: THREE.DoubleSide }), 0, -0.65, 0, 20)); const L = lamp(c, o.intensity ?? 8, o.dist ?? 9, { bulbR: 0.07, shadow: o.shadow }); L.position.y = -0.72; g.add(L); g.lampLight = L.light; return g; }
export function whiteboard(o = {}) { const w = o.w || 2.4, h = o.h || 1.2; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: o.draw ? null : textTex(o.text || '', { w: 1024, h: 512, bg: o.dark ? '#1f3a2a' : '#f0f2f4', color: o.dark ? '#f0f0e0' : '#2a3a8a', size: 90, font: 'Fredoka' }), roughness: 0.7 })); const g = group(box(w + 0.1, h + 0.1, 0.04, '#9a9aa4', 0, 0, -0.02), m); m.position.z = 0.002; if (o.draw) { const s = screen(w, h, o.draw, { power: 0.9 }); s.position.z = 0.004; g.add(s); g.screen = s; } g.position.y = o.y ?? 1.5; return g; }
export function locker(o = {}) { const m = mat(o.color || '#3a5a8a', { rough: 0.5, metal: 0.4 }); const g = group(box(0.5, 1.9, 0.5, m, 0, 0.95, 0)); for (let k = 0; k < 3; k++) g.add(box(0.3, 0.02, 0.01, shade(o.color || '#3a5a8a', -0.4), 0, 1.6 + k * 0.05, 0.255)); g.add(box(0.03, 0.12, 0.02, '#c8c8d0', 0.17, 1.0, 0.26)); return g; }
export function counter(o = {}) { const w = o.w || 3, c = o.color || '#e8e2da'; return group(box(w, 0.88, 0.62, mat(o.base || '#4a3a48'), 0, 0.44, 0), box(w + 0.04, 0.05, 0.66, mat(c, { rough: 0.3 }), 0, 0.9, 0)); }
export function fridge(o = {}) { const m = mat(o.color || '#d8dce4', { rough: 0.3, metal: 0.3 }); return group(rbox(0.8, 1.85, 0.7, 0.04, m, 0, 0.925, 0), box(0.03, 0.4, 0.04, '#8a8c96', 0.3, 1.25, 0.37), box(0.03, 0.3, 0.04, '#8a8c96', 0.3, 0.6, 0.37), box(0.78, 0.01, 0.01, '#8a8c96', 0, 1.0, 0.355)); }
export function rug(o = {}) { const m = new THREE.Mesh(new THREE.CircleGeometry(o.r || 1.3, 40), mat(o.color || '#6a3a5a', { map: carpet(o.color || '#6a3a5a', [1, 1]) })); m.rotation.x = -R2; m.position.y = 0.006; m.receiveShadow = true; m.scale.set(1, o.ratio || 0.7, 1); return group(m); }
export function poster(o = {}) { const w = o.w || 0.6, h = o.h || 0.85; const t = canvasTex(256, Math.round(256 * h / w), (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, o.c1 || '#e05a3a'); gr.addColorStop(1, o.c2 || '#3a2a8a'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(W / 2, H * 0.4, W * 0.22, 0, 7); g.fill(); if (o.text) { g.font = `900 ${W * 0.16}px Nunito`; g.textAlign = 'center'; g.fillText(o.text, W / 2, H * 0.85); } }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })); return group(m); }
export function money(o = {}) { const g = group(); const m = mat('#5aa060', { rough: 0.8 }), band = mat('#f2e6b0'); const n = o.n || 6; for (let i = 0; i < n; i++) { g.add(box(0.16, 0.06, 0.07, m, (i % 3) * 0.17, 0.03 + Math.floor(i / 3) * 0.06, 0), box(0.02, 0.062, 0.072, band, (i % 3) * 0.17, 0.03 + Math.floor(i / 3) * 0.06, 0)); } return g; }
export function ball(o = {}) { return group(sphere(o.r || 0.11, mat(o.color || '#e8762a', { rough: 0.6 }), 0, o.r || 0.11, 0)); }
// ---------------------------------------------------------------- location kits (hospital, school…): props that say where we are
// wall clock with hands at `time` ('10:10' or a function of t → minutes), face toward +z
export function wallClock(o = {}) { const r = o.r || 0.22, g = group(cyl(r, r, 0.05, mat(o.rim || '#2a2430', { rough: 0.5 }), 0, 0, 0, 32)); g.children[0].rotation.x = R2;
  const face = new THREE.Mesh(new THREE.CircleGeometry(r * 0.88, 32), mat('#ece6dc', { rough: 0.8, keepSat: true })); face.position.z = 0.027; g.add(face);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, tk = box(0.012, i % 3 ? 0.03 : 0.05, 0.004, '#2a2430', Math.sin(a) * r * 0.75, Math.cos(a) * r * 0.75, 0.03); tk.rotation.z = -a; g.add(tk); }
  const hand = (len, wd) => { const h = new THREE.Group(); h.add(box(wd, len, 0.006, '#1a1820', 0, len / 2, 0)); h.position.z = 0.034 + wd * 0.1; g.add(h); return h; };
  const hh = hand(r * 0.45, 0.022), mh = hand(r * 0.68, 0.014);
  const set = (min) => { hh.rotation.z = -((min / 60) % 12) / 12 * Math.PI * 2; mh.rotation.z = -(min % 60) / 60 * Math.PI * 2; };
  set(typeof o.time === 'string' ? (+o.time.split(':')[0]) * 60 + (+o.time.split(':')[1] || 0) : 610);
  if (typeof o.time === 'function') g.tick = (t) => set(o.time(t)); g.position.y = o.y ?? 2.3; return g; }
// cork board with pinned paper notes
export function bulletinBoard(o = {}) { const w = o.w || 1.4, h = o.h || 0.9, r = rng(o.seed || 6); const g = group(box(w + 0.06, h + 0.06, 0.04, '#6a4a36', 0, 0, -0.01), box(w, h, 0.03, mat('#a8805a', { rough: 1 }), 0, 0, 0));
  const notes = ['#ece6d8', '#e8d890', '#c8d8e8', '#e8c0c0', '#d0e0c0'];
  for (let i = 0; i < (o.notes || 9); i++) { const nw = 0.16 + r() * 0.12, nh = 0.12 + r() * 0.14; const n = box(nw, nh, 0.004, mat(notes[(r() * notes.length) | 0], { rough: 1 }), (r() - 0.5) * (w - nw), (r() - 0.5) * (h - nh), 0.018); n.rotation.z = (r() - 0.5) * 0.2; g.add(n); g.add(sphere(0.012, '#b83a3a', n.position.x, n.position.y + nh / 2 - 0.03, 0.024, 8, 6)); }
  g.position.y = o.y ?? 1.5; return g; }
// hospital bed: metal frame on wheels, side rails, raised head, white sheet and a coloured blanket (foot toward +z)
export function hospitalBed(o = {}) { const fm = mat('#c8ccd4', { rough: 0.35, metal: 0.55 }), dk = mat('#3a3e48', { rough: 0.5 }); const g = group();
  g.add(box(1.0, 0.1, 2.1, fm, 0, 0.5, 0)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.add(cyl(0.025, 0.025, 0.42, fm, sx * 0.42, 0.27, sz * 0.92, 8)); const wh = cyl(0.06, 0.06, 0.04, dk, sx * 0.42, 0.06, sz * 0.92, 12); wh.rotation.z = R2; g.add(wh); }
  g.add(rbox(0.94, 0.16, 2.0, 0.06, mat('#e4e2e8', { rough: 0.9 }), 0, 0.62, 0));
  const back = rbox(0.94, 0.14, 0.75, 0.06, mat('#e4e2e8', { rough: 0.9 }), 0, 0.82, -0.72); back.rotation.x = 0.55; g.add(back); g.add(rbox(0.5, 0.12, 0.3, 0.05, mat('#f0eef4', { rough: 0.95 }), 0, 1.0, -0.9));
  g.add(rbox(0.98, 0.07, 1.25, 0.03, mat(o.blanket || '#5a7a96', { rough: 0.95 }), 0, 0.72, 0.38));
  g.add(box(1.04, 0.65, 0.05, fm, 0, 0.82, -1.07), box(1.04, 0.38, 0.05, fm, 0, 0.7, 1.07));
  for (const sx of [-1, 1]) { g.add(box(0.03, 0.03, 1.0, fm, sx * 0.52, 0.92, -0.25), box(0.03, 0.03, 1.0, fm, sx * 0.52, 0.78, -0.25)); for (const z of [-0.7, 0.2]) g.add(box(0.03, 0.2, 0.03, fm, sx * 0.52, 0.76, z)); }
  return g; }
// IV drip stand with a bag and a line
export function ivPole(o = {}) { const m = mat('#c8ccd4', { rough: 0.35, metal: 0.55 }); const g = group(cyl(0.015, 0.015, 1.9, m, 0, 0.95, 0, 8), cyl(0.25, 0.25, 0.03, mat('#3a3e48'), 0, 0.05, 0, 5), box(0.3, 0.015, 0.015, m, 0, 1.88, 0));
  g.add(rbox(0.13, 0.22, 0.04, 0.03, mat('#d8e8f0', { transparent: true, opacity: 0.8, rough: 0.2, keepSat: true }), 0.12, 1.72, 0), cyl(0.004, 0.004, 0.9, mat('#d8e8f0', { keepSat: true }), 0.12, 1.15, 0, 4)); return g; }
// heart monitor on a stand: a dark screen with a moving green trace and a pulse number (it animates once added with st.add)
export function heartMonitor(o = {}) { const bpm = o.bpm || 72, col = o.color || '#5fe0a0';
  const scr = screen(0.5, 0.34, (g, W, H, t) => { g.fillStyle = '#0c1418'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(95,224,160,.15)'; g.lineWidth = 1; for (let x = 0; x < W; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    g.strokeStyle = col; g.lineWidth = 4; g.lineJoin = 'round'; g.beginPath(); const per = 60 / bpm, head = ((t || 0) / (per * 3)) % 1;
    for (let i = 0; i <= 120; i++) { const u = i / 120; if (Math.abs(u - head) < 0.02) { g.stroke(); g.beginPath(); continue; } const ph = (u * 3) % 1; const y = ph > 0.42 && ph < 0.47 ? -0.9 * Math.sin((ph - 0.42) / 0.05 * Math.PI) : ph > 0.47 && ph < 0.5 ? 0.35 : ph > 0.62 && ph < 0.72 ? -0.18 * Math.sin((ph - 0.62) / 0.1 * Math.PI) : 0; const X = u * W, Y = H * 0.55 + y * H * 0.32; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }
    g.stroke(); g.fillStyle = col; g.font = '900 ' + Math.round(H * 0.2) + 'px Nunito'; g.textAlign = 'right'; g.fillText(String(o.bpmText ?? bpm), W - 14, H * 0.24); }, { px: 384, power: 1.1 });
  scr.position.set(0, 1.45, 0.031); const g = group(rbox(0.56, 0.42, 0.06, 0.03, mat('#2a2e38', { rough: 0.4 }), 0, 1.45, 0), scr, cyl(0.02, 0.02, 1.25, mat('#c8ccd4', { metal: 0.5, rough: 0.35 }), 0, 0.62, -0.02, 8), cyl(0.22, 0.22, 0.03, mat('#3a3e48'), 0, 0.02, 0, 5));
  g.tick = (t) => scr.update(t); g.screen = scr; return g; }
// ceiling curtain track with a pleated privacy curtain hanging from it, along x
export function curtain(o = {}) { const w = o.w || 2.2, h = o.h || 2.2, c = o.color || '#7a9a9a'; const g = group(box(w, 0.04, 0.05, mat('#c8ccd4', { metal: 0.5, rough: 0.35 }), 0, h + 0.3, 0));
  const n = Math.round(w / 0.16), cm = mat(c, { rough: 1, side: THREE.DoubleSide }); for (let i = 0; i < n; i++) g.add(box(w / n + 0.02, h, 0.03, cm, -w / 2 + (i + 0.5) * w / n, h / 2 + 0.25, (i % 2 ? 0.04 : -0.04)));
  return g; }
// small bedside cabinet with a drawer and a cup
export function bedsideCabinet(o = {}) { const c = o.color || '#c8c2b8'; const g = group(rbox(0.5, 0.75, 0.45, 0.03, mat(c, { rough: 0.7 }), 0, 0.375, 0), box(0.4, 0.015, 0.01, shade(c, -0.3), 0, 0.6, 0.23)); const cp = cup({}); cp.position.set(0.1, 0.75, 0); g.add(cp); return g; }

// background people: instanced mini characters (round head, hair cap, muted top, arms, stick legs) in the style's skin.
// area [x0, x1, z0, z1]; colors = top palette (muted by default, so the cast and the hero stay in front);
// rise/riseFrom/y0 lift rows for bleachers (y += (riseFrom - z) * rise). The crowd moves by itself once added with st.add:
// people bob and sway out of step, and `cheer` (0..1, or a function of t) raises arms in waves. o.still: true freezes it.
export function crowd(o = {}) {
  const { area = [-10, 10, -6, -2], seed = 5, s = 1, rise = 0, riseFrom = 0, y0 = 0 } = o, n = o.positions ? o.positions.length : (o.n ?? 40); const r = rng(seed); const g = group();
  const st = S(), skinC = st.skin === 'ink' ? st.ink : (st.paleSkin || '#e8e0f2');
  const colors = o.colors || ['#7a3a34', '#2c3e6e', '#3f6a58', '#8d4a6b', '#5f6a2e', '#2f6f6a', '#6a4a36', '#4a4a62', '#9a7a3a'];
  const hairs = o.hairColors || ['#2a2024', '#4a3226', '#1e1a20', '#6a4a30', '#34262c', '#8a4426'];
  const skinM = mat(skinC, { rough: 0.5, rim: 1 }), hoodM = mat('#ffffff', { rough: 0.85, rim: 0.5 }), hairM = mat('#ffffff', { rough: 0.9, rim: 0.3 });
  const bodyG = new THREE.CapsuleGeometry(0.17, 0.3, 4, 10), headG = new THREE.SphereGeometry(0.25, 16, 12), legG = new THREE.CapsuleGeometry(0.03, 0.4, 3, 6);
  const hairG = new THREE.SphereGeometry(0.262, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), armG = new THREE.CapsuleGeometry(0.045, 0.3, 3, 6); armG.translate(0, -0.17, 0);
  const bodies = new THREE.InstancedMesh(bodyG, hoodM, n), heads = new THREE.InstancedMesh(headG, skinM, n), hairsM = new THREE.InstancedMesh(hairG, hairM, n), legs = new THREE.InstancedMesh(legG, skinM, n * 2), arms = new THREE.InstancedMesh(armG, hoodM, n * 2);
  const P = [], col = new THREE.Color();
  for (let i = 0; i < n; i++) { const pp = o.positions?.[i], x = pp ? pp[0] : lerp(area[0], area[1], r()), z = pp ? pp[1] : lerp(area[2], area[3], r()), k = s * (0.85 + r() * 0.25) * (o.same ? 0 : 1) + (o.same ? s : 0), yaw = (o.same ? 0 : (r() - 0.5) * (o.turn ?? 1.2)) + (o.yaw || 0);
    P.push({ x, z, k, yaw, y: y0 + Math.max(0, riseFrom - z) * rise, ph: r() * 6.28, sp: 0.7 + r() * 0.8, fan: r(), bald: r() < 0.12 });
    const cc = colors[(r() * colors.length) | 0]; bodies.setColorAt(i, col.set(cc)); for (const a of [0, 1]) arms.setColorAt(i * 2 + a, col.set(cc)); hairsM.setColorAt(i, col.set(hairs[(r() * hairs.length) | 0])); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qa = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
  const pose = (t) => {
    const cheerAll = typeof o.cheer === 'function' ? o.cheer(t) : (o.cheer ?? 0.25);
    P.forEach((c, i) => { const { x, z, k, yaw, y } = c; const bob = o.still ? 0 : Math.abs(Math.sin(t * c.sp * 2.2 + c.ph)) * 0.035 * k, sway = o.still ? 0 : Math.sin(t * c.sp + c.ph) * 0.08;
      const up = o.still ? 0 : clamp((Math.sin(t * 1.3 + c.x * 0.35 + c.ph * 0.3) * 0.5 + 0.5) * 1.6 - (1.4 - cheerAll * 1.4) - c.fan * 0.4, 0, 1);
      q.setFromEuler(e.set(0, yaw + sway, 0)); sc.set(k, k, k);
      m4.compose(p.set(x, y + 0.8 * k + bob, z), q, sc); bodies.setMatrixAt(i, m4);
      m4.compose(p.set(x, y + 1.42 * k + bob, z), q, sc); heads.setMatrixAt(i, m4);
      m4.compose(p.set(x, y + 1.42 * k + bob, z), q, c.bald ? sc.set(0, 0, 0) : sc); hairsM.setMatrixAt(i, m4); sc.set(k, k, k);
      for (const sx of [-1, 1]) { const cx = Math.cos(yaw), sz = Math.sin(yaw);
        m4.compose(p.set(x + sx * 0.07 * k * cx, y + 0.26 * k, z - sx * 0.07 * k * sz), q, sc); legs.setMatrixAt(i * 2 + (sx > 0 ? 1 : 0), m4);
        const raise = lerp(0.12, 2.75, up) * sx; qa.setFromEuler(e.set(0, 0, raise)); qa.premultiply(q);
        m4.compose(p.set(x + sx * 0.2 * k * cx, y + 1.08 * k + bob, z - sx * 0.2 * k * sz), qa, sc); arms.setMatrixAt(i * 2 + (sx > 0 ? 1 : 0), m4); } });
    [bodies, heads, hairsM, legs, arms].forEach(m => { m.instanceMatrix.needsUpdate = true; });
  };
  pose(0); [bodies, heads, hairsM, legs, arms].forEach(m => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; g.add(m); });
  g.tick = o.still ? null : pose; return g;
}

// ---------------------------------------------------------------- sets
// pick which lamps get a real light: the `lights` nearest to `focus` [x, z]
const nearest = (list, focus, n) => list.map((it, i) => ({ it, d: Math.hypot(it.x - focus[0], it.z - focus[1]) })).sort((a, b) => a.d - b.d).slice(0, n).map(o => o.it);

// city: night street along x. road z ∈ [-4, 4], sidewalks to ±7 (y = 0.15), buildings behind (z < -7; front row z > 7 if front).
// o: { seed, length (120), lights (4), focus [x,z], cars (parked count), traffic, front, rain/wet, signs: ['PIZZA', ...], mood }
export function city(st, o = {}) {
  const M = st.M, r = rng(o.seed || 3), Lh = (o.length || 120) / 2, wet = o.wet ?? false;
  const road = ground(Lh * 2 + 40, 8, M.road, asphalt(M.road, [Lh / 4, 2]), { rough: wet ? 0.25 : 0.85, metal: wet ? 0.35 : 0 }); st.add(road);
  const lines = canvasTex(64, 512, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(255,214,90,.85)'; g.fillRect(w * 0.3, 0, w * 0.12, h); g.fillRect(w * 0.58, 0, w * 0.12, h); }, [1, Lh / 4]);
  const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.35, Lh * 2 + 40), new THREE.MeshStandardMaterial({ map: lines, transparent: true, roughness: 0.7 })); cl.rotation.set(-R2, 0, R2); cl.position.y = 0.01; st.add(cl);
  const dash = canvasTex(64, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(240,240,240,.7)'; g.fillRect(w * 0.35, 0, w * 0.3, h * 0.5); }, [1, Lh / 3]);
  for (const z of [-2, 2]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.15, Lh * 2 + 40), new THREE.MeshStandardMaterial({ map: dash, transparent: true, roughness: 0.7 })); d.rotation.set(-R2, 0, R2); d.position.set(0, 0.01, z); st.add(d); }
  const swC = shade(M.floor, 0.12);
  for (const sz of [-1, 1]) { const sw = box(Lh * 2 + 40, 0.15, 3, mat(swC, { map: tiles(swC, 8, [Lh / 1.5, 1.5], 'rgba(0,0,0,.25)'), rough: wet ? 0.35 : 0.9 }), 0, 0.075, sz * 5.5); st.add(sw); st.add(box(Lh * 2 + 40, 0.16, 0.18, shade(swC, 0.15), 0, 0.08, sz * 4.05)); }
  if (o.crosswalk != null) { const cw = canvasTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(240,240,240,.8)'; for (let i = 0; i < 8; i++) g.fillRect(0, i * 32 + 4, w, 18); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 8), new THREE.MeshStandardMaterial({ map: cw, transparent: true, roughness: 0.7 })); m.rotation.x = -R2; m.position.set(o.crosswalk, 0.012, 0); st.add(m); }
  // buildings
  const pal = o.palette || [M.wall, shade(M.wall, 0.12), shade(M.wall, -0.1), mix(M.wall, '#4a2a3a', 0.4), mix(M.wall, '#2a3a5a', 0.4)];
  const signs = o.signs || ['PIZZA', 'OPEN', 'CAFE', '24/7', 'BAR', 'HOTEL']; let si = 0;
  const rows = o.front ? [-1, 1] : [-1];
  for (const sz of rows) { let x = -Lh - 10; while (x < Lh + 10) { const w = 6 + r() * 6, h = 9 + r() * 22, d = 8 + r() * 4; const b = building(w, h, d, { color: pal[(r() * pal.length) | 0], seed: (r() * 1e4) | 0, lit: 0.35 + r() * 0.3, sign: r() < 0.45 ? signs[si++ % signs.length] : null, signColor: [M.accent, '#ff4f8a', '#4ff2e8', '#ffd23a'][(r() * 4) | 0], mood: o.mood }); b.position.set(x + w / 2, 0.15, sz * (7 + d / 2)); if (sz > 0) b.rotation.y = Math.PI; st.add(b); x += w + 0.25; } }
  // lamps (light the nearest few for real)
  const lamps = []; const sp = o.lampSpacing || 14;
  for (let x = -Lh + 4; x <= Lh; x += sp) for (const sz of [-1, 1]) lamps.push({ x: x + (sz > 0 ? sp / 2 : 0), z: sz * 4.6, sz });
  const lit = new Set(nearest(lamps, o.focus || [0, 0], o.lights ?? 4));
  for (const L of lamps) { const l = streetLamp({ light: lit.has(L), poolY: 0, mood: o.mood }); l.position.set(L.x, 0.15, L.z); l.rotation.y = L.sz > 0 ? Math.PI : 0; st.add(l); L.obj = l; }
  // parked cars + props
  const carCols = o.carColors || ['#d63a2a', '#2a5ad6', '#e8e8ec', '#1a1a22', '#f2c21a', '#3aa06a'];
  for (let i = 0; i < (o.cars ?? 6); i++) { const x = -Lh + 6 + r() * (Lh * 2 - 12), sz = r() < 0.5 ? -1 : 1; const c = car({ color: carCols[(r() * carCols.length) | 0], type: ['sedan', 'suv', 'sedan', 'sports', 'taxi'][(r() * 5) | 0], lights: false }); c.position.set(x, 0, sz * 3.0); c.rotation.y = R2 * (sz > 0 ? -1 : 1); st.add(c); }
  for (let i = 0; i < (o.props ?? 8); i++) { const x = -Lh + r() * Lh * 2, sz = r() < 0.5 ? -1 : 1; const p = [hydrant, trashCan, () => tree({ s: 0.8, seed: i })][(r() * 3) | 0](); p.position.set(x, 0.15, sz * (4.6 + r() * 1.5)); st.add(p); }
  st.add(skyline({ color: shade(M.wall, -0.35), seed: (o.seed || 3) + 7, tint: '#d8d0ff' }));
  const dark = /night|storm/.test(o.mood || st.moodName || 'night');
  if (o.moon ?? dark) st.add(moon({ color: '#efe6ff' }));
  if (o.stars ?? dark) st.add(stars(400));
  return { lamps, road, ground: 0, sidewalk: 0.15, lane: [-2, 2] };
}
// suburb: houses with lit windows, lawns, fences and trees along a street (road along x like city)
export function suburb(st, o = {}) {
  const M = st.M, r = rng(o.seed || 5), Lh = (o.length || 90) / 2;
  st.add(ground(Lh * 2 + 60, 7, M.road, asphalt(M.road, [Lh / 4, 2])));
  st.add(ground(Lh * 2 + 60, 60, M.grass, null, { y: -0.01 }));
  for (const sz of [-1, 1]) st.add(box(Lh * 2 + 60, 0.12, 1.6, shade(M.floor, 0.15), 0, 0.06, sz * 4.3));
  const houses = []; let x = -Lh;
  while (x < Lh) { const w = 7 + r() * 3; const hc = M.houses ? M.houses[(r() * M.houses.length) | 0] : [shade(M.wall, 0.1), mix(M.wall, '#6a4a3a', 0.4), mix(M.wall, '#3a4a6a', 0.4), shade(M.wall, -0.05)][(r() * 4) | 0];
    const h = house({ color: hc, roof: shade(hc, M.houses ? -0.3 : -0.4), seed: (r() * 1e4) | 0, mood: o.mood }); h.position.set(x + w / 2, 0, -12); st.add(h); houses.push(h);
    st.add(at(tree({ s: 0.9 + r() * 0.5, seed: (r() * 99) | 0, color: M.tree || shade(M.grass, -0.35) }), x + r() * w, 0, -7 - r() * 2));
    if (o.fence !== false) for (let k = 0; k < w; k += 0.5) st.add(box(0.08, 0.9, 0.06, '#e8e2d8', x + k, 0.45, -6)); x += w + 2;
  }
  const lamps = []; for (let xx = -Lh; xx <= Lh; xx += 18) lamps.push({ x: xx, z: -4.9 });
  const lit = new Set(nearest(lamps, o.focus || [0, 0], o.lights ?? 3));
  for (const L of lamps) { const l = streetLamp({ light: lit.has(L), h: 4.6, mood: o.mood }); l.position.set(L.x, 0.12, L.z); st.add(l); }
  if (M.skyline !== false) st.add(skyline({ color: shade(M.wall, -0.4), seed: (o.seed || 5) + 3, height: 30, tint: '#a8a0d0' }));
  const dark = /night|storm/.test(o.mood || st.moodName || 'night');
  if (o.moon ?? dark) st.add(moon({}));
  if (o.stars ?? dark) st.add(stars(400));
  return { houses, lamps };
}
export function house(o = {}) {
  const M = mood(o.mood); const c = o.color || M.wall, w = o.w || 7, d = o.d || 7, h = o.h || 3.2; const r = rng(o.seed || 1);
  const g = group(box(w, h, d, mat(c, { rough: 0.95 }), 0, h / 2, 0));
  const roofM = mat(o.roof || shade(c, -0.4), { rough: 0.9, flat: true });
  const rg = new THREE.CylinderGeometry(0.01, d * 0.72, w + 0.6, 4, 1); const roofMesh = prep(new THREE.Mesh(rg, roofM)); roofMesh.rotation.set(0, Math.PI / 4, R2); roofMesh.scale.set(1, 1, 0.75); roofMesh.position.y = h + 1.15; const rr = group(roofMesh); rr.rotation.y = 0; g.add(rr);
  const winC = o.win || M.practical;
  for (const [x, y] of [[-w * 0.3, h * 0.55], [w * 0.3, h * 0.55]]) { const on = r() < 0.8; const wm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.1), on ? glowMat(winC, 1.3) : mat('#1a1828')); wm.position.set(x, y, d / 2 + 0.01); g.add(wm, box(1.3, 0.08, 0.08, '#e8e2d8', x, y, d / 2 + 0.03), box(0.08, 1.2, 0.08, '#e8e2d8', x, y, d / 2 + 0.03), box(1.4, 0.1, 0.2, '#e8e2d8', x, y - 0.6, d / 2 + 0.05)); }
  const dr = door({ color: o.doorColor || '#6a2a2a' }); dr.position.set(0, 0, d / 2 + 0.03); g.add(dr);
  const pl = lamp(winC, 1.6, 4, { bulbR: 0.06 }); pl.position.set(0.7, 2.3, d / 2 + 0.2); g.add(pl);
  return g;
}
// room: interior. Floor w×d centred at the origin, back wall at z = -d/2, side walls at x = ±w/2 (open toward +z).
// kind: bedroom | living | office | classroom | kitchen | hallway | hospital | empty.  window: 'back'|'left'|'right'|false with a city view at night.
// Walls get a soft top-to-bottom light falloff, baseboards, a crown moulding and (hospital, classroom, office) a two-tone wainscot with a rail.
export function room(st, o = {}) {
  const M = st.M, w = o.w || 8, d = o.d || (o.kind === 'hallway' ? 22 : 7), h = o.h || 3.0, kind = o.kind || 'empty'; const r = rng(o.seed || 2);
  const hosp = kind === 'hospital';
  const wallC = o.wall || (hosp ? mix(M.wall, '#8aa898', 0.5) : M.wall), floorC = o.floor || (hosp ? mix(M.floor, '#b8bcc4', 0.55) : M.floor);
  const floorTex = kind === 'office' || kind === 'hallway' || kind === 'classroom' || kind === 'kitchen' || hosp ? tiles(floorC, 6, [w / 2, d / 2], 'rgba(0,0,0,.22)') : planks(floorC, 12, [w / 3, d / 3]);
  st.add(ground(w + 0.4, d + 8, floorC, floorTex, { rough: kind === 'hallway' || hosp ? 0.35 : 0.75 }));
  const wm = mat(wallC, { rough: 0.95, map: wallTex() });
  st.add(box(w + 0.4, h, 0.2, wm, 0, h / 2, -d / 2 - 0.1));
  const sides = [-1, 1].filter(sx => o['wall' + (sx < 0 ? 'L' : 'R')] !== false);
  for (const sx of sides) st.add(box(0.2, h, d + 8, wm, sx * (w / 2 + 0.1), h / 2, 4));
  // trims: baseboards, crown moulding, and a wainscot (lower wall a shade darker under a rail) where rooms usually have one
  const trimC = shade(wallC, -0.3), crownC = shade(wallC, 0.12), wains = o.wainscot ?? (hosp || kind === 'classroom' || kind === 'office');
  st.add(box(w + 0.4, 0.12, 0.03, trimC, 0, 0.06, -d / 2 + 0.01), box(w + 0.4, 0.07, 0.06, crownC, 0, h - 0.035, -d / 2 + 0.03));
  for (const sx of sides) st.add(box(0.03, 0.12, d + 8, trimC, sx * (w / 2 - 0.01), 0.06, 4), box(0.06, 0.07, d + 8, crownC, sx * (w / 2 - 0.03), h - 0.035, 4));
  if (wains) { const lowC = shade(wallC, -0.12), railC = shade(wallC, 0.18), wy = 0.95;
    st.add(box(w + 0.4, wy, 0.01, mat(lowC, { rough: 0.9 }), 0, wy / 2, -d / 2 + 0.005), box(w + 0.4, 0.05, 0.04, railC, 0, wy, -d / 2 + 0.02));
    for (const sx of sides) st.add(box(0.01, wy, d + 8, mat(lowC, { rough: 0.9 }), sx * (w / 2 - 0.005), wy / 2, 4), box(0.04, 0.05, d + 8, railC, sx * (w / 2 - 0.02), wy, 4)); }
  if (o.ceiling) st.add(box(w + 0.4, 0.1, d + 8, shade(wallC, -0.2), 0, h + 0.05, 4));
  // window with a night (or day) view
  const winSide = o.window ?? 'back'; let win = null;
  if (winSide) { const ww = o.windowW || Math.min(3.2, w * 0.4), wh = o.windowH || 1.6; const night = o.view ? o.view !== 'day' : /night|dusk|storm|interior/.test(o.mood || st.moodName || 'night');
    const view = canvasTex(512, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); (night ? ['#120c30', '#2a1c5a', '#5a3a7a'] : ['#7aa8e8', '#b8d4f4', '#f0e6d8']).forEach((c, i) => gr.addColorStop(i / 2, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H); const rr = rng(4); let x = 0; while (x < W) { const bw = 20 + rr() * 50, bh = H * (0.3 + rr() * 0.6); g.fillStyle = night ? '#140f28' : '#8a96b8'; g.fillRect(x, H - bh, bw, bh); if (night) for (let yy = H - bh + 6; yy < H - 4; yy += 9) for (let xx = x + 4; xx < x + bw - 4; xx += 7) if (rr() < 0.35) { g.fillStyle = 'rgba(255,200,120,.9)'; g.fillRect(xx, yy, 3, 4); } x += bw + 2; } if (night) { g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(W * 0.78, H * 0.22, 14, 0, 7); g.fill(); } });
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ map: view, color: new THREE.Color(1.05, 1.05, 1.05), toneMapped: false })); const fr = mat('#e8e2d8', { rough: 0.6 });
    win = group(pane, box(ww + 0.16, 0.08, 0.14, fr, 0, wh / 2, 0.04), box(ww + 0.16, 0.12, 0.25, fr, 0, -wh / 2, 0.08), box(0.08, wh, 0.14, fr, -ww / 2, 0, 0.04), box(0.08, wh, 0.14, fr, ww / 2, 0, 0.04), box(0.05, wh, 0.1, fr, 0, 0, 0.04));
    if (o.curtains !== false) for (const sx of [-1, 1]) win.add(box(0.35, wh + 0.5, 0.08, mat(o.curtain || '#5a3a6a', { rough: 1 }), sx * (ww / 2 + 0.25), 0.05, 0.15));
    const wy = o.windowY || 1.55;
    if (winSide === 'back') win.position.set(o.windowX || 0, wy, -d / 2 + 0.01); else { win.position.set((winSide === 'left' ? -1 : 1) * (w / 2 - 0.01), wy, o.windowZ ?? -d / 4); win.rotation.y = winSide === 'left' ? R2 : -R2; }
    st.add(win);
    const ml = new THREE.SpotLight(color(night ? '#9fb0ff' : '#fff2d8'), (o.windowLight ?? (night ? 14 : 30)) * (S().light?.practical ?? 1), 14, 0.7, 0.8, 1.2); ml.position.copy(win.position).add(new THREE.Vector3(0, 0.6, 0)).add(new THREE.Vector3(0, 0, winSide === 'back' ? -1.5 : 0)); ml.target.position.set(0, 0, 0); ml.castShadow = true; ml.shadow.mapSize.set(1024, 1024); st.add(ml, ml.target);
  }
  const lamps = []; let bedTop = null, monitor = null;
  // floor-standing props get a soft contact shadow so beds, desks and chairs sit on the floor instead of floating (o.contact: false to skip)
  const put = (obj, x, z, yaw = 0, y = 0) => { obj.position.set(x, y, z); obj.rotation.y = yaw; st.add(obj); if (y === 0 && o.contact !== false) st.add(contactShadow(obj)); return obj; };
  const backZ = -d / 2;
  if (kind === 'bedroom') {
    put(bed({ color: o.bedColor || '#3a5aa0' }), -w / 2 + 1.1, backZ + 1.3, 0);
    put(table({ w: 0.5, d: 0.45, h: 0.55, color: '#4a3438' }), -w / 2 + 2.25, backZ + 0.4); const dl = put(deskLamp({}), -w / 2 + 2.25, backZ + 0.4, 0, 0.58); lamps.push(dl);
    put(desk({}), w / 2 - 1.0, backZ + 0.5); put(chair({}), w / 2 - 1.1, backZ + 1.2, Math.PI); put(laptop({}), w / 2 - 1.1, backZ + 0.45, 0, 0.79);
    put(shelf({}), w / 2 - 0.25, backZ + 2.5, -R2); put(rug({ color: o.rugColor || '#5a3a6a' }), 0, backZ + 3); put(poster({ text: 'DREAM' }), -w / 2 + 0.02, 1.7, R2, 0).position.set(-w / 2 + 0.02, 1.7, backZ + 2.5);
  } else if (kind === 'living') {
    put(sofa({ color: o.sofaColor || '#7a3a4a' }), 0, backZ + 0.8); put(table({ w: 1.1, d: 0.55, h: 0.42, color: '#3a2a2a' }), 0, backZ + 2.1); put(rug({ r: 1.8 }), 0, backZ + 2.0);
    put(plant({}), -w / 2 + 0.5, backZ + 0.5); const fl = put(group(cyl(0.02, 0.02, 1.5, '#1a1a20', 0, 0.75, 0, 6), cone(0.2, 0.3, mat('#e8d8c0', { side: THREE.DoubleSide }), 0, 1.55, 0, 16)), w / 2 - 0.6, backZ + 0.5); const L = lamp(M.practical, 4, 6, { bulbR: 0.05 }); L.position.set(0, 1.45, 0); fl.add(L); lamps.push(fl);
  } else if (hosp) {
    // hospital room: bed against the back wall with the monitor and drip at its head, a privacy curtain, a visitor chair, a sink
    const bx = o.bedX ?? -w / 2 + 1.6, bz = o.bedZ ?? backZ + 1.15; bedTop = [bx, 0.75, bz];
    put(hospitalBed({ blanket: o.bedColor }), bx, bz); monitor = put(heartMonitor({ bpm: o.bpm, bpmText: o.bpmText }), bx - 0.85, bz - 0.8, 0.35); put(ivPole({}), bx + 0.8, bz - 0.7);
    put(bedsideCabinet({}), bx + 1.15, backZ + 1.5, -R2); put(curtain({ w: 1.1, color: o.curtainColor || mix(wallC, '#6a8a8a', 0.5) }), bx - 1.35, bz + 0.1, R2);   // pulled open along the wall at the bed's head side
    put(chair({ color: '#4a5a6a' }), bx + 1.3, bz + 0.9, -R2 * 0.8); put(wallClock({ time: o.clock || '10:10' }), bx + 2.6, backZ + 0.03, 0, 2.4);
    put(group(box(0.6, 0.08, 0.45, mat('#e4e6ec', { rough: 0.3, keepSat: true }), 0, 0.85, 0), box(0.5, 0.75, 0.4, mat('#c8ccd4', { rough: 0.6 }), 0, 0.42, 0), cyl(0.015, 0.015, 0.25, mat('#c8ccd4', { metal: 0.6, rough: 0.3 }), 0, 1.0, -0.12, 8)), w / 2 - 0.45, backZ + 2.6, -R2);
  } else if (kind === 'office') {
    put(wallClock({ time: o.clock || '3:40' }), w / 2 - 1.2, backZ + 0.03, 0, 2.4);
    for (let i = 0; i < (o.desks ?? 4); i++) { const x = -w / 2 + 1.4 + (i % 2) * 3.0, z = backZ + 1.4 + Math.floor(i / 2) * 2.6; put(desk({ color: '#3a3a48' }), x, z); put(officeChair({}), x, z + 0.65, Math.PI); put(tv({ w: 0.6, y: 1.05, color: '#5a8ad6' }), x, z - 0.1); }
    put(whiteboard({ text: o.boardText || '' }), 0, backZ + 0.03); put(plant({}), w / 2 - 0.5, backZ + 0.5);
  } else if (kind === 'classroom') {
    put(whiteboard({ text: o.boardText || '', dark: true, w: 3.6, h: 1.4 }), 0, backZ + 0.03); put(desk({ color: '#5a3a2a' }), -w / 2 + 1.5, backZ + 1.0);
    put(wallClock({ time: o.clock || '8:55' }), 0, backZ + 0.03, 0, 2.55); put(bulletinBoard({ seed: o.seed || 6 }), w / 2 - 1.2, backZ + 0.03, 0, 1.5);
    put(poster({ text: 'READ', c1: '#5a7a96', c2: '#3a2a5a', w: 0.55, h: 0.75 }), -w / 2 + 0.02, backZ + 2.2, R2, 1.65); put(shelf({ seed: 5 }), -w / 2 + 0.25, backZ + 4.2, R2);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = -2 + j * 2, z = backZ + 2.6 + i * 1.5; put(table({ w: 0.9, d: 0.5, h: 0.72, color: '#8a6a4a' }), x, z); put(chair({ color: '#3a4a7a' }), x, z + 0.5, Math.PI); }
  } else if (kind === 'kitchen') {
    put(counter({ w: w * 0.7 }), -w * 0.1, backZ + 0.35); put(fridge({}), w / 2 - 0.6, backZ + 0.45); put(table({ w: 1.2, d: 0.9 }), 0, backZ + 3); for (const sx of [-1, 1]) put(chair({}), sx * 0.8, backZ + 3, -sx * R2);
    for (let i = 0; i < 3; i++) put(box(0.9, 0.7, 0.35, mat(o.cabinet || '#6a4a5a')), -w * 0.35 + i * 1.0, backZ + 0.2, 0, 1.9);
  } else if (kind === 'hallway') {
    const lc = o.lockerColors || [o.lockerColor || '#2f6a72'], run = o.lockerRun || 8; let i = 0;
    if (o.lockers !== false) for (const sx of [-1, 1]) for (let z = backZ + 1; z < backZ + d - 1; z += 0.55, i++) put(locker({ color: lc[Math.floor(i / run) % lc.length] }), sx * (w / 2 - 0.3), z, sx > 0 ? -R2 : R2);
  }
  if (o.strips || (kind === 'hallway' && o.strips !== false)) {   // fluorescent strips on the ceiling: glow-only, plus 2 real lights
    for (let z = backZ + 1.5; z < backZ + d; z += 3) { const s2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.18), glowMat('#fff4e6', 1.6)); s2.position.set(0, h - 0.03, z); st.add(s2); }
    for (const z of [backZ + 3, backZ + d * 0.6]) { const L = lamp('#fff0dc', o.lampIntensity ?? 6, 10, { bulb: false, shadow: z === backZ + 3 }); L.position.set(0, h - 0.3, z); st.add(L); lamps.push(L); }
  } else if (o.ceilingLights !== false && kind !== 'empty') { const n = kind === 'hallway' ? 3 : 1; for (let i = 0; i < n; i++) { const cl = ceilingLamp({ intensity: o.lampIntensity ?? 7, shadow: i === 0 }); cl.position.set(0, h, backZ + (kind === 'hallway' ? 3 + i * 6 : d / 2)); st.add(cl); lamps.push(cl); } }
  return { w, d, h, window: win, lamps, backZ, bedTop, monitor };
}
// park: grass, a curved path, trees, benches and lamps
export function park(st, o = {}) {
  const M = st.M, r = rng(o.seed || 7);
  st.add(ground(120, 120, M.grass, canvasTex(256, 256, (g, w, h) => { g.fillStyle = M.grass; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.03 + r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 3); } }, [30, 30])));
  const path = new THREE.Mesh(new THREE.PlaneGeometry(120, 3), mat(shade(M.floor, 0.25), { rough: 0.95 })); path.rotation.x = -R2; path.position.y = 0.01; st.add(path);
  for (let i = 0; i < (o.trees ?? 22); i++) { const x = (r() - 0.5) * 70, z = -4 - r() * 30; st.add(at(tree({ s: 0.9 + r() * 0.7, seed: i, color: shade(M.grass, -0.3 - r() * 0.2), type: r() < 0.3 ? 'pine' : 'round' }), x, 0, z)); }
  for (let x = -24; x <= 24; x += 12) { st.add(at(bench({}), x + 3, 0, -2.3)); }
  const lamps = []; for (let x = -30; x <= 30; x += 12) lamps.push({ x, z: -2.2 });
  const lit = new Set(nearest(lamps, o.focus || [0, 0], o.lights ?? 3));
  for (const L of lamps) { const l = streetLamp({ light: lit.has(L), h: 4, mood: o.mood }); l.position.set(L.x, 0, L.z); st.add(l); }
  st.add(skyline({ color: shade(M.wall, -0.35), seed: 11, height: 40, tint: '#b8b0e0' }));
  if (o.stars ?? /night|storm/.test(o.mood || st.moodName || 'night')) st.add(stars(300));
  return { lamps };
}
// void / studio: endless dark floor with a soft spotlight pool — for explanations, title reveals, "imagine…" moments
export function studio(st, o = {}) {
  const M = st.M; const c = o.floor || M.floor;
  st.add(ground(200, 200, c, null, { rough: o.gloss ? 0.3 : 0.85, metal: o.gloss ? 0.3 : 0 }));
  st.scene.background = color(o.bg || M.dark); if (st.scene.fog) { st.scene.fog.color = color(o.bg || M.dark); st.scene.fog.near = o.fogNear ?? 8; st.scene.fog.far = o.fogFar ?? 30; }
  const s = new THREE.SpotLight(color(o.color || M.key), (o.intensity ?? 60) * (S().light?.practical ?? 1), 30, o.angle ?? 0.42, 0.7, 1.2); s.position.set(...(o.pos || [0, 9, 3])); s.target.position.set(...(o.target || [0, 0, 0])); s.castShadow = true; s.shadow.mapSize.set(1024, 1024); st.add(s, s.target);
  if (o.cone !== false) { const cn = lightCone(o.coneR ?? 3.4, 9, o.color || M.key, o.coneOpacity ?? 0.05); cn.position.set(s.position.x, s.position.y, s.position.z); cn.lookAt(...(o.target || [0, 0, 0])); cn.rotateX(-R2); st.add(cn); }
  return { spot: s };
}


// ---------------------------------------------------------------- explainer stage (the purple "diagram" scenes of the references)
// A flat purple backdrop with a faint grid, a floor that meets it in a thin light line, a soft overhead light.
// Stand small characters on the line (z = lineZ), frame front-on with a long lens (fov 18–28), add 2D pills/cards in overlay().
export function explainer(st, o = {}) {
  const c = o.color || S().ui?.explainBg3d || S().ui?.explainBg || '#3b2c63', lineZ = o.lineZ ?? 0;
  st.scene.background = color(shade(c, -0.35)); st.scene.fog = null;
  const grid = cached('explainGrid' + c, () => canvasTex(1024, 512, (g, W, H) => { const gr = g.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, W * 0.6); gr.addColorStop(0, shade(c, 0.12)); gr.addColorStop(1, shade(c, -0.25)); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.03)'; g.lineWidth = 1; for (let x = 0; x <= W; x += 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y <= H; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } }));
  const back = new THREE.Mesh(new THREE.PlaneGeometry(o.w || 40, o.h || 20), new THREE.MeshBasicMaterial({ map: grid, toneMapped: true })); back.position.set(0, (o.h || 20) / 2 - 2, lineZ - 0.6); st.add(back);
  const floor = ground(o.w || 40, 20, shade(c, -0.18), null, { rough: 0.95 }); floor.position.z = lineZ + 9.4; st.add(floor);
  if (o.line !== false) { const ln = new THREE.Mesh(new THREE.PlaneGeometry(o.w || 40, 0.012), new THREE.MeshBasicMaterial({ color: color('#d8c8ff'), transparent: true, opacity: 0.45 })); ln.rotation.x = -R2; ln.position.set(0, 0.002, lineZ - 0.55); st.add(ln); }
  const sp = new THREE.SpotLight(color('#fff2e6'), (o.light ?? 22) * (S().light?.practical ?? 1), 30, 0.6, 0.9, 1.2); sp.position.set(0, 8, lineZ + 6); sp.target.position.set(0, 0.8, lineZ); sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); st.add(sp, sp.target);
  // the stage is never dead air: fine dust floats up through the light (dust: false turns it off)
  if (o.dust !== false) { const d = dust(st, { n: 110, area: [-7, 7, 0.1, 4.5, lineZ - 0.4, lineZ + 3.5], c: '#f2e4ff', size: 0.035, speed: 0.06, rise: 0.05, opacity: 0.5, seed: 17 }); st.onTick(d.update); }
  return { lineZ, back, floor };
}
// dark transparent sheet to push a busy background back (put it between the set and the foreground subjects)
export function veil(st, o = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w || 60, o.h || 30), new THREE.MeshBasicMaterial({ color: color(o.color || '#120a24'), transparent: true, opacity: o.opacity ?? 0.55, depthWrite: false, fog: false })); m.position.set(...(o.pos || [0, 5, -2])); if (o.lookAt) m.lookAt(...o.lookAt); st.add(m); return m; }

// ---------------------------------------------------------------- more sets seen in the references
const lineTex = (draw, w = 1024, h = 512) => canvasTex(w, h, draw);
// gym / basketball court: wood floor with lines, bleachers + crowd on one side (z < -8), hoops at x = ±12, strip lights
export function gym(st, o = {}) {
  const M = st.M, wood = o.floor || '#c8884a';
  const court = lineTex((g, W, H) => { g.fillStyle = wood; g.fillRect(0, 0, W, H); for (let x = 0; x < W; x += 24) { g.fillStyle = shade(wood, (((x / 24) * 7) % 5) / 40 - 0.05); g.fillRect(x, 0, 23, H); } g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5; g.strokeRect(40, 30, W - 80, H - 60); g.beginPath(); g.moveTo(W / 2, 30); g.lineTo(W / 2, H - 30); g.stroke(); g.beginPath(); g.arc(W / 2, H / 2, 70, 0, 7); g.stroke(); for (const sx of [0, 1]) { g.beginPath(); g.arc(sx ? W - 40 : 40, H / 2, 200, sx ? Math.PI / 2 : -Math.PI / 2, sx ? Math.PI * 1.5 : Math.PI / 2); g.stroke(); } });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(28, 15), new THREE.MeshStandardMaterial({ map: court, roughness: 0.45 })); fl.rotation.x = -R2; fl.receiveShadow = true; st.add(fl);
  st.add(ground(80, 60, shade(wood, -0.35), null, { y: -0.005 }));
  const wall = mat(o.wall || shade(M.wall, -0.1)); st.add(box(60, 12, 0.3, wall, 0, 6, -16), box(0.3, 12, 40, wall, -18, 6, 0), box(0.3, 12, 40, wall, 18, 6, 0));
  for (let j = 0; j < (o.rows ?? 8); j++) st.add(box(26, 0.45, 0.8, mat(shade(M.wall, -0.3 + (j % 2) * 0.05)), 0, 0.22 + j * 0.45, -8.4 - j * 0.8));
  if (o.crowd !== false) st.add(crowd({ n: o.crowdN ?? 160, area: [-12, 12, -14, -8.4], s: 0.62, rise: 0.45 / 0.8, riseFrom: -8.4, y0: 0.45 }));
  for (const sx of [-1, 1]) { const hp = group(cyl(0.08, 0.08, 3.2, '#3a3a44', 0, 1.6, 0), box(1.8, 1.05, 0.06, mat('#f4f4f4'), 0, 3.4, 0.5), torus(0.23, 0.02, mat('#ff6a2a'), 0, 3.05, 0.78)); hp.children[2].rotation.x = R2; hp.position.set(sx * 13, 0, 0); hp.rotation.y = -sx * R2; st.add(hp); }
  for (let x = -12; x <= 12; x += 6) for (const z of [-4, 4]) { const s2 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.06, 0.3), glowMat('#fff4e0', 1.5)); s2.position.set(x, 9, z); st.add(s2); }
  const L = spot_('#fff0dc', 70, [0, 10, 6], [0, 0, 0]); st.add(L);
  return {};
}
const spot_ = (c, i, pos, tgt, sh = true) => { const L = new THREE.SpotLight(color(c), i * (S().light?.practical ?? 1), 40, 0.75, 0.8, 1.1); L.position.set(...pos); L.target.position.set(...tgt); L.castShadow = sh; if (sh) L.shadow.mapSize.set(1024, 1024); return group(L, L.target); };
// diner: black-and-white checkered floor, red booths with white tables along the window wall (z = -3), counter at the back
export function diner(st, o = {}) {
  const M = st.M; const chk = canvasTex(256, 256, (g, W, H) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#2a2430' : '#f2ece4'; g.fillRect(i * 64, j * 64, 64, 64); } }, [10, 6]);
  st.add(ground(20, 12, '#ffffff', chk, { rough: 0.35 }));
  const wallM = mat(o.wall || '#e86a6a'), trim = mat(o.trim || '#5ad0c8');
  st.add(box(20, 1.0, 0.2, wallM, 0, 0.5, -3.1), box(20, 0.12, 0.22, trim, 0, 1.05, -3.1), box(20, 1.2, 0.2, wallM, 0, 3.4, -3.1));
  const view = canvasTex(1024, 256, (g, W, H) => { g.fillStyle = '#1a1438'; g.fillRect(0, 0, W, H); const r = rng(5); for (let x = 0; x < W; x += 60) { const h2 = H * (0.3 + r() * 0.6); g.fillStyle = '#120e28'; g.fillRect(x, H - h2, 56, h2); for (let yy = H - h2 + 8; yy < H; yy += 14) for (let xx = x + 6; xx < x + 50; xx += 12) if (r() < 0.35) { g.fillStyle = '#ffcf7a'; g.fillRect(xx, yy, 5, 6); } } });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(20, 1.8), new THREE.MeshBasicMaterial({ map: view })); win.position.set(0, 1.95, -3.15); st.add(win);
  const booths = [];
  for (let i = 0; i < (o.booths ?? 4); i++) { const x = -6 + i * 3.2, red = mat(o.booth || '#c8303a', { rough: 0.5 });
    for (const sz of [-1, 1]) st.add(rbox(1.4, 0.4, 0.55, 0.06, red, x, 0.2, -2.0 + sz * 0.85), rbox(1.4, 0.9, 0.2, 0.06, red, x, 0.65, -2.0 + sz * 1.2));
    st.add(table({ w: 1.2, d: 0.7, h: 0.72, mat: mat('#f4f0ea', { rough: 0.3 }) }).translateX(x).translateZ(-2.0)); booths.push([x, -2.0]); }
  st.add(counter({ w: 8, color: '#f4f0ea', base: o.trim || '#5ad0c8' }).translateZ(3.5).translateX(2));
  for (let i = 0; i < 5; i++) st.add(group(cyl(0.2, 0.2, 0.08, mat('#c8303a'), 0, 0.7, 0), cyl(0.04, 0.04, 0.7, '#c8c8d0', 0, 0.35, 0)).translateX(-1 + i * 1.2).translateZ(2.8));
  for (let i = 0; i < 4; i++) { const p = ceilingLamp({ intensity: 3, color: '#ffe0b0' }); p.position.set(-6 + i * 3.2, 3.6, -2.0); st.add(p); }
  return { booths };
}
// game show: glossy purple stage, three numbered doors with coloured frames, spotlights, bulb marquee
export function gameshow(st, o = {}) {
  st.add(ground(40, 30, o.floor || '#4a2c78', null, { rough: 0.2, metal: 0.2 }));
  st.add(box(40, 12, 0.3, mat(o.back || '#2a1a48'), 0, 6, -5));
  const cols = o.doorColors || ['#e0405a', '#3a6ae0', '#e0a830'], doors = [];
  cols.forEach((c, i) => { const x = (i - 1) * 2.6; const fr = rbox(2.0, 3.1, 0.25, 0.08, mat(c, { rough: 0.4 }), 0, 1.55, 0); const lf = rbox(1.6, 2.7, 0.1, 0.04, mat(shade(c, 0.12), { rough: 0.5 }), 0, 1.5, 0.12);
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: textTex(String(i + 1), { w: 256, h: 256, size: 200, color: '#fff6ea', font: 'Fredoka' }), transparent: true })); num.position.set(0, 1.7, 0.18);
    const d = group(fr, lf, num); d.position.set(x, 0, -4.2); st.add(d); doors.push(d);
    const sp = spot_('#fff2e0', 25, [x, 7, -1], [x, 0, -4.2]); st.add(sp); const cn = lightCone(1.1, 6.5, '#fff2e0', 0.05); cn.position.set(x, 7, -1.5); cn.lookAt(x, 0, -4.2); cn.rotateX(-R2); st.add(cn); });
  for (let x = -9; x <= 9; x += 0.6) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glowMat('#ffd27a', 2)); b.position.set(x, 4.2, -4.8); st.add(b); }
  return { doors };
}
// casino: roulette table + spinning wheel (wheel.update(t, {speed, ball})), slot machines along the back wall, warm lamps
export function rouletteWheel(o = {}) {
  const nums = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const tex = cached('roulette', () => canvasTex(1024, 1024, (g, W, H) => { const cx = W / 2, cy = H / 2, R1 = W * 0.5, R0 = W * 0.33, n = nums.length; for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2; g.fillStyle = i === 0 ? '#1f8a4a' : i % 2 ? '#c8202a' : '#16121a'; g.beginPath(); g.moveTo(cx + Math.cos(a0) * R0, cy + Math.sin(a0) * R0); g.arc(cx, cy, R1, a0, a1); g.arc(cx, cy, R0, a1, a0, true); g.fill(); g.save(); g.translate(cx + Math.cos((a0 + a1) / 2) * R1 * 0.86, cy + Math.sin((a0 + a1) / 2) * R1 * 0.86); g.rotate((a0 + a1) / 2 + Math.PI / 2); g.fillStyle = '#fff'; g.font = '900 34px Nunito'; g.textAlign = 'center'; g.fillText(String(nums[i]), 0, 12); g.restore(); } g.strokeStyle = '#d8b050'; g.lineWidth = 6; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); g.lineTo(cx + Math.cos(a) * R1, cy + Math.sin(a) * R1); g.stroke(); } }));
  const wood = mat(o.wood || '#7a4a2a', { rough: 0.5 }), gold = mat('#c89a38', { rough: 0.45, metal: 0.5 });
  const bowl = cyl(0.6, 0.55, 0.16, wood, 0, 0.08, 0, 48); const rim = torus(0.58, 0.04, wood, 0, 0.16, 0); rim.rotation.x = R2;
  const spinner = new THREE.Group(); const ring2 = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.48, 74, 1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 })); ring2.rotation.x = -R2; ring2.position.y = 0.165;
  const hub = cone(0.16, 0.14, gold, 0, 0.24, 0, 24); const cross = box(0.3, 0.02, 0.03, gold, 0, 0.32, 0); const cross2 = box(0.03, 0.02, 0.3, gold, 0, 0.32, 0);
  spinner.add(ring2, hub, cross, cross2); const ball = sphere(0.022, mat('#ffffff', { rough: 0.2 }), 0.5, 0.2, 0);
  const g = group(bowl, rim, spinner, ball);
  g.update = (t, u = {}) => { const sp = u.speed ?? 2; spinner.rotation.y = t * sp; const k = u.settle != null ? clamp(t / u.settle) : 0; const br = lerp(0.53, 0.4, k), ba = -t * (sp * 2.2) * (1 - 0.7 * k) + (u.ballAngle || 0); ball.position.set(Math.cos(ba) * br, 0.2 - 0.02 * k, Math.sin(ba) * br); };
  g.spinner = spinner; g.ball = ball; return g;
}
export function casino(st, o = {}) {
  const M = st.M; st.add(ground(40, 30, o.carpet || '#4a1a3a', carpet(o.carpet || '#4a1a3a', [8, 6])));
  st.add(box(40, 8, 0.3, mat(shade(M.wall, -0.2)), 0, 4, -8));
  const felt = canvasTex(1024, 512, (g, W, H) => { g.fillStyle = '#1f7a4a'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; let n = 1; for (let c = 0; c < 12; c++) for (let r = 0; r < 3; r++) { const x = 140 + c * 70, y = 60 + (2 - r) * 110; const red = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n); g.fillStyle = red ? '#c8202a' : '#16121a'; g.fillRect(x + 4, y + 4, 62, 102); g.strokeRect(x, y, 70, 110); g.fillStyle = '#fff'; g.font = '900 34px Nunito'; g.textAlign = 'center'; g.fillText(String(n), x + 35, y + 68); n++; } });
  const table = group(rbox(3.2, 0.12, 1.5, 0.06, mat('#5a3420', { rough: 0.5 }), 0, 0.82, 0), box(3.0, 0.02, 1.3, new THREE.MeshStandardMaterial({ map: felt, roughness: 0.9 }), 0, 0.89, 0), box(2.6, 0.8, 1.0, mat('#3a2016'), 0, 0.4, 0));
  table.position.set(o.tableX ?? 0, 0, o.tableZ ?? 0); st.add(table);
  const wheel = rouletteWheel(); wheel.position.set((o.tableX ?? 0) - 1.9, 0.82, o.tableZ ?? 0); st.add(wheel);
  const chipCols = ['#c8202a', '#1a1a1a', '#2f6fe0', '#2f9a6a', '#f4f4f4'];
  for (let i = 0; i < 10; i++) { const n = 3 + (i * 7) % 9; for (let k = 0; k < n; k++) st.add(cyl(0.04, 0.04, 0.012, mat(chipCols[(i + k) % 5], { rough: 0.5 }), (o.tableX ?? 0) - 0.8 + (i % 5) * 0.35, 0.9 + k * 0.013, (o.tableZ ?? 0) + 0.45 + Math.floor(i / 5) * 0.12, 16)); }
  const slots = []; for (let i = 0; i < (o.slots ?? 8); i++) { const x = -9 + i * 2.4, c = ['#c8202a', '#2f6fe0', '#e0a830', '#8a5ad6'][i % 4]; const sm = group(rbox(1.0, 1.9, 0.8, 0.08, mat(c, { rough: 0.4 }), 0, 0.95, 0), new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), glowMat(['#ffd27a', '#7ad0ff', '#ff7ab8'][i % 3], 1.3))); sm.children[1].position.set(0, 1.35, 0.41); sm.position.set(x, 0, -7.2); st.add(sm); slots.push(sm); }
  for (let i = 0; i < 3; i++) { const p = ceilingLamp({ intensity: 6, color: '#ffd8a0' }); p.position.set((o.tableX ?? 0) - 1.2 + i * 1.2, 3.2, o.tableZ ?? 0); st.add(p); }
  return { table, wheel, slots };
}
// store aisle: two shelf runs along z with colourful products, strip lights, checkout counter at the front
export function store(st, o = {}) {
  st.add(ground(16, 30, o.floor || '#d8d0c8', tiles(o.floor || '#d8d0c8', 8, [8, 15], 'rgba(0,0,0,.12)'), { rough: 0.4 }));
  const r = rng(o.seed || 6), cols = ['#e0402e', '#3a78e0', '#2f9a6a', '#e0a830', '#e070a8', '#8a5ad6', '#f4f4f4'];
  for (const sx of [-1, 1]) for (let z = -12; z < 4; z += 2) { const sh = group(box(0.6, 2.0, 2.0, mat('#e8e4e0'), 0, 1.0, 0)); for (let k = 0; k < 4; k++) { sh.add(box(0.7, 0.04, 2.0, mat('#c8c4c0'), 0.05, 0.3 + k * 0.45, 0)); for (let q = 0; q < 6; q++) { const h2 = 0.18 + r() * 0.15; sh.add(box(0.22, h2, 0.26, mat(cols[(r() * cols.length) | 0], { rough: 0.6 }), 0.3, 0.32 + k * 0.45 + h2 / 2, -0.85 + q * 0.34)); } } sh.position.set(sx * 1.8, 0, z); sh.rotation.y = sx > 0 ? Math.PI : 0; st.add(sh); }
  for (let z = -12; z < 4; z += 3) { const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 2.2), glowMat('#ffffff', 1.4)); s2.position.set(0, 3.2, z); st.add(s2); }
  const L = lamp('#ffffff', 8, 14, { bulb: false, shadow: true }); L.position.set(0, 3, -2); st.add(L);
  st.add(counter({ w: 2.4, color: '#f4f0ea', base: '#3a78e0' }).translateZ(5).translateX(-2.5));
  return {};
}
// outdoor nature sets and props (beach, island, snow, farm, underwater, palm, pine, rock, bush, mountain, water, foam, fishSchool, seaweed, aurora, sun)
export * from './nature3d.js';
// toy animals, sports venues and big crowds, screens in the world (0.2.7)
export * from './animals3d.js';
export * from './sports3d.js';
export * from './screens3d.js';
// ready-made school sets: bus stop, inside the bus, locker hall, school front, cafeteria, PE yard, outdoor court (0.2.8)
export * from './school3d.js';
export * from './look10.js';     // 1.0: mirror floors, sky dome, light shafts, AO strips, string lights
export * from './places10.js';
export * from './weather10.js';
export * from './places10b.js';  // 1.0: supermarket, hospital hallway, rooftop, train station   // 1.0: lightning, cloud shadows, headlights, flicker, snow cover, puddles, leaves   // 1.0: stairwell, classroom, city bus stop, shop street, residential, street food, café, passers-by
export * from './school10.js';   // 1.0.1: American high school sets + props (library, chem lab, auditorium, football field, ...)
export * from './season10.js';
export * from './strength12.js';   // 1.0.4: weight room, climbing gym, breakable light tower, tractor tire, barbell, stream corner, locker row
export * from './fall11.js';   // 1.0.3: American November (thanksgivingDinner, pumpkinStreet, leafGust, pumpkin, turkey, pie...)   // 1.0.1: school weather, seasons, time of day (fallDay, snowDay, breath, windowRain, powerCut, capToss, ...)
export { swingDoor } from './act10.js';   // 1.0.2: a door on a real hinge (T.act.door opens it by the handle)
