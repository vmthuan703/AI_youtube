// engine/nature3d.js — outdoor nature sets and props (exposed as T.W.* through world3d.js).
// Built like every other set: simple shapes, canvas textures, at most one or two real lights. Everything that moves
// (water, seaweed, fish, aurora, rays) is a pure function of t and registers itself with st.add, so the player animates it.
//
//   const b = T.W.beach(st, { seed: 3 });            // sand toward the camera (+z), sea from z ≈ -2 to the horizon
//   hero.place(0, b.heightAt(0, 1.5), 1.5);           // stand on the sand (or wade: the sea floor is lower than 0)
//   T.W.island(st, { r: 9 })  T.W.snow(st, { slope: 0.18, aurora: true })  T.W.farm(st)  T.W.underwater(st)
// Moods made for them (styles.js): beach, sunrise (sea and sky at dawn), snow (bright white day), arctic (snow at night),
// underwater. Outdoor sets look best with a long fog: T.stage({ mood: 'beach', fog: [30, 150] }).
import * as THREE from 'three';
import { S, mood, shade, mix, rng, clamp, lerp, noise } from './core.js';
import { mat, box, cyl, sphere, group, at, canvasTex, glow, glowMat, cached, color, cone, mesh, contactShadow, lightCone, dotTex, renderer } from './kit3d.js';
import { tree, stars } from './world3d.js';
import { dust, fire } from './fx3d.js';

const R2 = Math.PI / 2;
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
// colours that bypass mat(): calm them like the sets (style.setSat), so the hero stays the loudest thing
const calm = (c) => { const k = S().setSat ?? 1, cc = color(c).clone(); if (k !== 1) { const h = {}; cc.getHSL(h); cc.setHSL(h.h, h.s * k, h.l); } return cc; };
const pal = (st) => { const M = st.M; return { ...M, sand: M.sand || M.floor, water: M.water || '#3fb6b8', deep: M.waterDeep || '#2a6fa8', snow: M.snow || '#eeeef8', leaf: M.tree || shade(M.grass, -0.1) }; };
const speckle = (base, n = 3000, rep = [30, 30], seed = 5, k = 0.05) => canvasTex(256, 256, (g, w, h) => { const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.02 + r() * k})`; g.fillRect(r() * w, r() * h, 2, 2); } }, rep);

// ---------------------------------------------------------------- terrain
// terrain(w, d, seg, h(x, z), colourAt(x, z, y) | colour, o) — a displaced ground with per-vertex colour (sand → wet sand → sea floor…)
export function terrain(w, d, seg, h, col, o = {}) {
  const geo = new THREE.PlaneGeometry(w, d, seg, Math.round(seg * d / w)); geo.rotateX(-R2); if (o.cx || o.cz) geo.translate(o.cx || 0, 0, o.cz || 0);
  const p = geo.attributes.position, cols = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = h(x, z); p.setY(i, y); c.copy(typeof col === 'function' ? calm(col(x, z, y)) : calm(col)); cols.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat('#ffffff', { vertexColors: true, rough: o.rough ?? 0.95, map: o.map || null, flat: !!o.flat, keepSat: true })); m.receiveShadow = true; m.castShadow = false; m.name = 'terrain';
  return m;
}

// ---------------------------------------------------------------- water
// the stage's own sky as a reflection map, so the sea mirrors the dawn or the blue day instead of looking like plaster
function skyEnv(st) {
  const R = renderer(), sky = [].concat(st.M.sky); if (!R) return null;
  return cached('skyEnv' + sky.join(), () => { const tex = canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); sky.forEach((c, i) => gr.addColorStop((i / Math.max(1, sky.length - 1)) * 0.5, c)); gr.addColorStop(0.5, sky[sky.length - 1]); gr.addColorStop(1, shade(sky[sky.length - 1], -0.5)); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    tex.mapping = THREE.EquirectangularReflectionMapping; const pm = new THREE.PMREMGenerator(R), env = pm.fromEquirectangular(tex).texture; pm.dispose(); return env; });
}
// water(st, { w, d, y, seg, shallow, deep, depthAt(x, z) → metres, opacity, waves, glints, center }) — a moving sea surface.
// Near the shore it is light and see-through (the sand and a wading character's legs show), far out deep blue. Animates itself.
export function water(st, o = {}) {
  const P = pal(st), { w = 260, d = 260, y = -0.04, seg = 96, opacity = 0.7, waves = 1, glints = 40, seed = 4 } = o, [cx, cz] = o.center || [0, -60];
  const lowSun = /sunrise|golden|dusk|night|arctic|storm/.test(st.moodName);   // a low sun or the night: the sea mirrors the sky; a bright day: teal water you see into
  const geo = new THREE.PlaneGeometry(w, d, seg, seg); geo.rotateX(-R2); geo.translate(cx, y, cz);
  const p = geo.attributes.position, base = Float32Array.from(p.array), cols = new Float32Array(p.count * 3), c = new THREE.Color(), sh = calm(o.shallow || P.water), dp = calm(o.deep || P.deep);
  const depthAt = o.depthAt || (() => 3), amp = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) { const dd = depthAt(p.getX(i), p.getZ(i)), k = sstep(0.1, 2.2, dd); amp[i] = sstep(0.12, 1.4, dd); c.copy(sh).lerp(dp, k); cols.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity, roughness: o.rough ?? (lowSun ? 0.22 : 0.38), metalness: o.metal ?? (lowSun ? 0.45 : 0.25), envMap: skyEnv(st), envMapIntensity: o.reflect ?? (lowSun ? 0.9 : 0.22), depthWrite: false, side: THREE.DoubleSide }));
  m.renderOrder = 2; m.receiveShadow = false; m.castShadow = false; m.userData.dynamic = true; m.name = 'water';
  const g = group(m); g.userData.dynamic = true;
  // sparkles on the surface (sun glints), twinkling
  const r = rng(seed), gl = []; for (let i = 0, tries = 0; i < glints && tries < glints * 20; tries++) { const gx = cx + (r() - 0.5) * 60, gz = cz + 58 - r() * 45; if (depthAt(gx, gz) < 1.2) continue; i++; const s = glow('#ffffff', 0.25 + r() * 0.35, 0.0); s.position.set(gx, y + 0.05, gz); s.userData.ph = r() * 9; s.userData.sp = 1.5 + r() * 2; g.add(s); gl.push(s); }
  g.tick = (t) => {
    for (let i = 0; i < p.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; p.setY(i, y + waves * amp[i] * (0.05 * Math.sin(x * 0.55 + t * 1.3) + 0.04 * Math.sin(z * 0.8 - t * 1.0) + 0.025 * Math.sin((x + z) * 1.7 + t * 2.1))); }
    p.needsUpdate = true; geo.computeVertexNormals();
    gl.forEach(s => { s.material.opacity = Math.max(0, Math.sin(t * s.userData.sp + s.userData.ph)) ** 6 * 0.9; });
  };
  g.tick(0); g.surface = m; st.add(g); return g;
}
// white foam that laps along a shoreline: foam(st, { path: [[x, z], …] | ring: [cx, cz, r], y })
export function foam(st, o = {}) {
  const pts = o.ring ? Array.from({ length: 97 }, (_, i) => { const a = (i / 96) * Math.PI * 2; return [o.ring[0] + Math.cos(a) * o.ring[2], o.ring[1] + Math.sin(a) * o.ring[2]]; }) : o.path;
  const tex = cached('foamTex', () => canvasTex(16, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.45, 'rgba(255,255,255,.95)'); gr.addColorStop(0.6, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
  const n = pts.length, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const geo = new THREE.BufferGeometry(); geo.setIndex(idx); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85, color: color('#ffffff'), fog: true })); m.renderOrder = 3; m.userData.dynamic = true; m.frustumCulled = false;
  const y = o.y ?? 0.0, width = o.width ?? 0.9;
  m.tick = (t) => { for (let i = 0; i < n; i++) { const [x, z] = pts[i], [x2, z2] = pts[Math.min(n - 1, i + 1)], [x0, z0] = pts[Math.max(0, i - 1)]; let nx = -(z2 - z0), nz = x2 - x0; const L = Math.hypot(nx, nz) || 1; nx /= L; nz /= L; const lap = 0.35 * Math.sin(t * 0.9 + i * 0.07); const w2 = width * (0.8 + 0.2 * Math.sin(t * 1.3 + i * 0.3));
    pos.set([x + nx * (lap - w2), y + 0.01, z + nz * (lap - w2), x + nx * (lap + w2), y + 0.01, z + nz * (lap + w2)], i * 6); uv.set([i / 4, 0, i / 4, 1], i * 4); }
    geo.attributes.position.needsUpdate = true; geo.attributes.uv.needsUpdate = true; m.material.opacity = 0.7 + 0.15 * Math.sin(t * 0.9); };
  m.tick(0); st.add(m); return m;
}

// ---------------------------------------------------------------- props
// palm tree: curved ringed trunk, drooping fronds, coconuts. palm({ h, lean, dir, seed, leaf, trunk })
export function palm(o = {}) {
  const r = rng(o.seed || 3), h = o.h ?? 5 + r() * 1.5, lean = o.lean ?? 0.6 + r() * 0.8, dir = o.dir ?? r() * Math.PI * 2;
  const g = group(), tr = mat(o.trunk || '#8a6a4e', { rough: 0.95 }), tr2 = mat(shade(o.trunk || '#8a6a4e', -0.12), { rough: 0.95 }), leaf = mat(o.leaf || '#4f9a5a', { rough: 0.9, flat: true, side: THREE.DoubleSide }), leaf2 = mat(shade(o.leaf || '#4f9a5a', -0.15), { rough: 0.9, flat: true, side: THREE.DoubleSide });
  const n = 9, pt = (k) => [Math.cos(dir) * lean * k * k, h * k, Math.sin(dir) * lean * k * k]; let top = null;
  for (let i = 0; i < n; i++) { const a = pt(i / n), b = pt((i + 1) / n), len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const s = cyl(0.13 - i * 0.006, 0.15 - i * 0.006, len * 1.04, i % 2 ? tr : tr2, 0, 0, 0, 9);
    s.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize()); g.add(s); top = b; }
  const crown = group(); crown.position.set(...top); g.add(crown);
  const fronds = 8; for (let i = 0; i < fronds; i++) { const ang = (i / fronds) * Math.PI * 2 + r() * 0.3, f = group(); f.rotation.y = ang;
    const shp = new THREE.Shape(); shp.moveTo(0, 0); shp.quadraticCurveTo(0.42, 0.9, 0.05, 2.3); shp.quadraticCurveTo(-0.32, 0.9, 0, 0); const geo = new THREE.ShapeGeometry(shp, 6); geo.rotateX(-R2);
    // bend the frond down along its length
    const pp = geo.attributes.position; for (let k = 0; k < pp.count; k++) { const L = -pp.getZ(k); pp.setY(k, pp.getY(k) - 0.18 * L * L); } geo.computeVertexNormals();
    const fm = mesh(geo, i % 2 ? leaf : leaf2); fm.rotation.y = Math.PI; fm.rotation.x = -0.25 + r() * 0.2; f.add(fm); crown.add(f); }
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; crown.add(sphere(0.12, mat('#6a4a2e', { rough: 0.8 }), Math.cos(a) * 0.15, -0.15, Math.sin(a) * 0.15, 10, 8)); }
  g.crown = crown; return g;
}
// low-poly rock: rock({ s, seed, color, flat }) — sits on y = 0
export function rock(o = {}) { const r = rng(o.seed || 1), s = o.s ?? 0.6, geo = new THREE.DodecahedronGeometry(1, 0), p = geo.attributes.position; const seen = new Map();
  for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!seen.has(k)) seen.set(k, 0.8 + r() * 0.35); const f = seen.get(k); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * 0.7, p.getZ(i) * f); }
  geo.computeVertexNormals(); const m = mesh(geo, mat(o.color || '#6a6478', { rough: 0.95, flat: true })); m.scale.setScalar(s); m.position.y = s * 0.35; m.rotation.y = r() * 6; return group(m); }
// round bush: bush({ s, color, seed })
export function bush(o = {}) { const r = rng(o.seed || 2), s = o.s ?? 0.8, m = mat(o.color || '#4f8a52', { rough: 0.95, flat: true }), g = group(); for (let i = 0; i < 4; i++) g.add(sphere(s * (0.45 + r() * 0.25), m, (r() - 0.5) * s, s * (0.3 + r() * 0.2), (r() - 0.5) * s * 0.6, 9, 7)); return g; }
// snowy pine: pine({ s, seed, color, snow }) — dark tiers with white caps
export function pine(o = {}) { const s = o.s ?? 1, c = o.color || '#2f5a50', sn = o.snow === false ? null : mat(o.snowColor || '#f2f2fa', { rough: 1, flat: true }); const leaf = mat(c, { rough: 0.95, flat: true });
  const g = group(cyl(0.1 * s, 0.14 * s, 1.2 * s, mat('#4a3428'), 0, 0.6 * s, 0, 7)); for (let k = 0; k < 4; k++) { const rr = (1.25 - k * 0.27) * s, y = (1.0 + k * 0.85) * s; g.add(cone(rr, 1.4 * s, leaf, 0, y + 0.7 * s, 0, 8)); if (sn) g.add(cone(rr * 0.82, 0.55 * s, sn, 0, y + 1.25 * s, 0, 8)); } return g; }
// mountain: mountain({ h, r, color, snow, seed }) — a jagged low-poly peak with a snow cap
export function mountain(o = {}) { const r = rng(o.seed || 6), h = o.h ?? 30, rad = o.r ?? 22, geo = new THREE.ConeGeometry(rad, h, 9, 4), p = geo.attributes.position;
  const seen = new Map(); for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > h / 2 - 0.01 || y < -h / 2 + 0.01) continue; const k = `${p.getX(i).toFixed(2)},${y.toFixed(2)},${p.getZ(i).toFixed(2)}`; if (!seen.has(k)) seen.set(k, 0.85 + r() * 0.3); const f = seen.get(k); p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); } geo.computeVertexNormals();
  const g = group(mesh(geo, mat(o.color || '#6a6488', { rough: 1, flat: true }), 0, h / 2, 0)); if (o.snow !== false) g.add(mesh(new THREE.ConeGeometry(rad * 0.36, h * 0.36, 9, 1), mat(o.snowColor || '#f4f2fa', { rough: 1, flat: true }), 0, h - h * 0.18 + 0.05, 0)); g.traverse(x => { x.castShadow = false; }); return g; }
// sun disc low over the horizon with a soft halo: sun(st, { pos, size, color })
export function sun(st, o = {}) { const c = o.color || st.M.key, g = group(glow(c, (o.size ?? 14) * 3.2, 0.45), glow('#ffffff', o.size ?? 14, 0.95, { disc: true })); g.position.set(...(o.pos || [0, 6, -140])); st.add(g); return g; }

// glittering path of sunlight on the sea, from the sun toward the shore: sunPath(st, { from, to, color, width })
export function sunPath(st, o = {}) {
  const [x0, , z0] = o.from, [x1, , z1] = o.to, n = 70, r = rng(12), g = group(); g.userData.dynamic = true; const L = [];
  for (let i = 0; i < n; i++) { const k = r() ** 1.6, x = lerp(x1, x0, k) + (r() - 0.5) * lerp(1.5, 18, k), z = lerp(z1, z0 * 0.7, k), s = glow(o.color || '#ffd8a0', lerp(0.5, 5, k), 0); s.scale.set(lerp(0.9, 9, k), lerp(0.12, 0.6, k), 1); s.position.set(x, 0.02, z); s.userData.ph = r() * 9; g.add(s); L.push(s); }
  g.tick = (t) => L.forEach(s => { s.material.opacity = 0.15 + 0.45 * Math.max(0, Math.sin(t * 2.2 + s.userData.ph)) ** 3; });
  g.tick(0); st.add(g); return g;
}
// ---------------------------------------------------------------- beach and island
function shoreSet(st, o, sdf) {
  const P = pal(st), r = rng(o.seed || 5);
  // height from the signed distance to the shoreline (s > 0 on land): low dunes on land, a sandy slope into the sea
  const H = (x, z) => { const s = sdf(x, z); return s > 0 ? 0.03 + 0.08 * sstep(0, 6, s) * clamp(0.5 + noise(x * 0.15, 2) * 0.35 + noise(z * 0.2, 5) * 0.2) : -1.7 * sstep(0, 11, -s) - 0.08 * sstep(0, 1, -s); };
  const sand = P.sand, wet = shade(sand, -0.16), bed = mix(sand, P.deep, 0.35);
  st.add(terrain(o.w ?? 240, o.d ?? 240, o.seg ?? 140, H, (x, z, y) => { const s = sdf(x, z); return s > 1.2 ? sand : s > -0.4 ? mix(wet, sand, sstep(-0.4, 1.2, s)) : mix(wet, bed, sstep(0, 1.6, -y)); }, { cx: o.cx ?? 0, cz: o.cz ?? -40, map: speckle('#ffffff', 2500, [40, 40], 9, 0.06) }));
  const sea = water(st, { depthAt: (x, z) => -H(x, z), center: [o.cx ?? 0, o.cz ?? -40], w: o.w ?? 240, d: o.d ?? 240, waves: o.waves ?? 1 });
  return { H, sea, P, r };
}
// beach(st, { seed, shoreZ, palms, rocks, sunrise, sunPos }) → a straight beach along x: dry sand toward the camera (z > shoreZ), the
// sea beyond. Returns { heightAt(x, z), shoreZ, sea, palms }. Wading characters: place them at heightAt(x, z) (below 0 in the sea).
export function beach(st, o = {}) {
  const shoreZ = o.shoreZ ?? -2, bay = o.bay ?? 0.012, sdf = (x, z) => z - shoreZ + bay * x * x + 0.9 * Math.sin(x * 0.12 + 1) + 0.5 * Math.sin(x * 0.31);
  const { H, sea, P, r } = shoreSet(st, o, sdf);
  foam(st, { path: Array.from({ length: 121 }, (_, i) => { const x = -60 + i; let z = shoreZ; for (let k = 0; k < 6; k++) z = z - sdf(x, z) * 0.9; return [x, z + 0.25]; }), y: 0.012 });
  const palms = []; for (let i = 0; i < (o.palms ?? 10); i++) { const side = i % 2 ? 1 : -1, back = i < 6, x = side * (back ? 6 + r() * 26 : 5 + r() * 18), z = back ? shoreZ + 1.8 + r() * 5 : shoreZ + 7 + r() * 10; const p = palm({ seed: i + 3, leaf: P.leaf, h: 4.5 + r() * 2.5, dir: side > 0 ? Math.PI + (r() - 0.5) : (r() - 0.5) }); st.add(at(p, x, H(x, z), z)); palms.push(p); }
  // two palms that frame a shot looking out to sea from z ≈ 8 (o.framePalms: false to skip)
  if (o.framePalms !== false) for (const [x, z, d] of [[-4.6, shoreZ + 2.6, 0.5], [5.4, shoreZ + 1.4, Math.PI - 0.4]]) { const p = palm({ seed: x > 0 ? 21 : 22, leaf: P.leaf, h: 5.2, lean: 1.3, dir: d }); st.add(at(p, x, H(x, z), z)); palms.push(p); }
  for (let i = 0; i < (o.rocks ?? 7); i++) { const x = (r() - 0.5) * 50, z = shoreZ + (r() - 0.6) * 6; if (Math.abs(x) < 3) continue; st.add(at(rock({ seed: i + 9, s: 0.3 + r() * 0.7, color: shade(P.dark, 0.25) }), x, H(x, z) - 0.1, z)); }
  for (let i = 0; i < (o.bushes ?? 8); i++) { const side = i % 2 ? 1 : -1, x = side * (7 + r() * 20), z = shoreZ + 8 + r() * 12; st.add(at(bush({ seed: i, color: shade(P.leaf, -0.05), s: 0.7 + r() * 0.6 }), x, H(x, z), z)); }
  if (o.sun !== false && /sunrise|golden|dusk/.test(st.moodName)) { const sp = o.sunPos || [8, 7, -150]; sun(st, { pos: sp, color: st.M.key }); sunPath(st, { from: sp, to: [0, 0, shoreZ - 1], color: st.M.key }); }
  return { heightAt: H, shoreZ, sea, palms };
}
// island(st, { r, seed, palms, cx, cz }) → a small round island of radius r at (cx, cz), the sea all around (wide and aerial shots,
// stranded stories). Returns { heightAt(x, z), r, center, sea, palms }.
export function island(st, o = {}) {
  const R = o.r ?? 9, cx = o.cx ?? 0, cz = o.cz ?? -6, sdf = (x, z) => R * (1 + 0.08 * Math.sin(Math.atan2(z - cz, x - cx) * 3 + 1)) - Math.hypot(x - cx, z - cz);
  const { H, sea, P, r } = shoreSet(st, { ...o, cx, cz }, sdf);
  foam(st, { path: Array.from({ length: 145 }, (_, i) => { const a = (i / 144) * Math.PI * 2, rr = R * (1 + 0.08 * Math.sin(a * 3 + 1)) + 0.35; return [cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]; }), y: 0.012 });
  const palms = []; for (let i = 0; i < (o.palms ?? 7); i++) { const a = r() * Math.PI * 2, d = R * (0.25 + r() * 0.5), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; const p = palm({ seed: i + 1, leaf: P.leaf, h: 4 + r() * 2.5, dir: a + Math.PI * (r() < 0.5 ? 0 : 1) }); st.add(at(p, x, H(x, z), z)); palms.push(p); }
  for (let i = 0; i < (o.bushes ?? 10); i++) { const a = r() * Math.PI * 2, d = R * r() * 0.75, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; st.add(at(bush({ seed: i, color: P.leaf, s: 0.6 + r() * 0.6 }), x, H(x, z), z)); }
  for (let i = 0; i < (o.rocks ?? 6); i++) { const a = r() * Math.PI * 2, d = R * (0.85 + r() * 0.25), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; st.add(at(rock({ seed: i + 4, s: 0.3 + r() * 0.6, color: shade(P.dark, 0.25) }), x, H(x, z) - 0.1, z)); }
  if (o.sun !== false && /sunrise|golden|dusk/.test(st.moodName)) sun(st, { pos: o.sunPos || [30, 8, -150], color: st.M.key });
  return { heightAt: H, r: R, center: [cx, cz], sea, palms };
}

// ---------------------------------------------------------------- snow
// snow(st, { seed, slope, pines, mountains, falling, aurora, tracks }) → a snowy slope: the ground rises away from the camera (−z) by
// `slope` (0 = flat field), soft drifts, snow-capped pines, peaks on the horizon, falling snow. Returns { heightAt, flakes, aurora }.
export function snow(st, o = {}) {
  const P = pal(st), r = rng(o.seed || 8), slope = o.slope ?? 0.12;
  const H = (x, z) => -z * slope + 0.35 * noise(x * 0.12, 3) * noise(z * 0.1, 7) + 0.25 * Math.sin(x * 0.21 + z * 0.13) - 0.25;
  const sn = P.snow, shadowSn = mix(sn, P.ambient || '#a8a8d0', 0.35);
  st.add(terrain(220, 220, 150, H, (x, z, y) => mix(shadowSn, sn, sstep(-0.4, 0.4, H(x + 0.6, z + 0.6) - y + 0.25)), { cz: -60, map: speckle('#ffffff', 2000, [50, 50], 4, 0.035), rough: 1 }));
  if (o.tracks) { const tm = mat(shade(sn, -0.12), { rough: 1 }); for (let i = 0; i < 40; i++) { const z = 6 - i * 0.6, x = Math.sin(i * 0.35) * 1.2; const s = box(0.18, 0.01, 0.4, tm, x, H(x, z) + 0.005, z); st.add(s); } }
  const pines = []; for (let i = 0; i < (o.pines ?? 40); i++) { const x = (r() - 0.5) * 90, z = 4 - r() * 70; if (Math.abs(x) < 3.5 && z > -14) continue; const p = pine({ s: 0.8 + r() * 1.1, color: shade(P.grass, -0.15 - r() * 0.15), snowColor: sn }); st.add(at(p, x, H(x, z) - 0.1, z, r() * 6)); pines.push(p); }
  for (let i = 0; i < (o.mountains ?? 7); i++) { const x = -120 + i * 40 + (r() - 0.5) * 20, z = -95 - r() * 30; st.add(at(mountain({ h: 26 + r() * 30, r: 20 + r() * 12, seed: i, color: shade(P.wall || '#6a6488', -0.05), snowColor: sn }), x, H(0, -40) - 4, z)); }
  for (let i = 0; i < (o.rocks ?? 6); i++) { const x = (r() - 0.5) * 30, z = -r() * 20; if (Math.abs(x) < 2) continue; st.add(at(rock({ seed: i, s: 0.4 + r() * 0.6, color: shade(P.dark, 0.2) }), x, H(x, z) - 0.15, z)); }
  const flakes = o.falling === false ? null : dust(st, { n: o.flakes ?? 700, area: [-14, 14, -0.5, 9, -16, 8], c: '#ffffff', size: 0.06, speed: 0.25, seed: 6, rise: -0.9, opacity: 0.9, additive: false });
  if (flakes) st.onTick(flakes.update);
  if (o.stars ?? /arctic|night/.test(st.moodName)) st.add(stars(400));
  const au = o.aurora ? aurora(st, typeof o.aurora === 'object' ? o.aurora : {}) : null;
  return { heightAt: H, flakes, aurora: au, pines };
}

// ---------------------------------------------------------------- farm
// farm(st, { seed, barn: [x, z], fields, fence, silo, hay }) → grass, a red barn with white trim, a silo, white fences, hay bales,
// crop rows and round trees. Returns { barn: {x, z, door: [x, z]}, heightAt }.
export function farm(st, o = {}) {
  const P = pal(st), r = rng(o.seed || 4), H = () => 0;
  st.add(terrain(220, 220, 40, () => 0, P.grass, { cz: -40, map: speckle('#ffffff', 3000, [40, 40], 7, 0.06) }));
  const [bx, bz] = o.barn || [-6, -14], red = mat(o.barnColor || '#a8443a', { rough: 0.85 }), trim = mat('#efe6da', { rough: 0.7 }), roofM = mat('#4a3a44', { rough: 0.8 });
  const barn = group(box(9, 5.2, 7, red, 0, 2.6, 0));
  const roof = new THREE.Shape(); roof.moveTo(-4.9, 0); roof.lineTo(-3.4, 2.2); roof.lineTo(0, 3.4); roof.lineTo(3.4, 2.2); roof.lineTo(4.9, 0); roof.lineTo(-4.9, 0);
  const rg = new THREE.ExtrudeGeometry(roof, { depth: 7.6, bevelEnabled: false }); rg.translate(0, 0, -3.8); barn.add(mesh(rg, roofM, 0, 5.2, 0));
  const gable = new THREE.ShapeGeometry(roof); [3.52, -3.52].forEach(z => barn.add(mesh(gable, red, 0, 5.2, z)));
  barn.add(box(3.4, 3.8, 0.12, mat('#7a2e28', { rough: 0.85 }), 0, 1.9, 3.56)); [[-1.7, 1.9, 0.14, 3.8], [1.7, 1.9, 0.14, 3.8], [0, 3.8, 3.54, 0.14]].forEach(([x, y, w, h]) => barn.add(box(w, h, 0.06, trim, x, y, 3.62)));
  for (const s of [1, -1]) { const d = box(0.12, 4.9, 0.06, trim, 0, 1.9, 3.63); d.rotation.z = s * Math.atan2(3.4, 3.8); d.scale.y = 1.06; barn.add(d); }
  barn.add(box(1.4, 1.1, 0.08, trim, 0, 6.0, 3.6), box(1.2, 0.9, 0.06, mat('#3a2a2e'), 0, 6.0, 3.65));
  st.add(at(barn, bx, 0, bz)); st.add(contactShadow(barn));
  if (o.silo !== false) { const sx = bx + 7.2, sz = bz - 0.5; st.add(at(group(cyl(1.6, 1.6, 9, mat('#b8b0b8', { rough: 0.6, metal: 0.2 }), 0, 4.5, 0, 20), sphere(1.62, mat('#8a8494', { rough: 0.5, metal: 0.3 }), 0, 9, 0, 20, 10)), sx, 0, sz)); }
  // white fences
  const fm = mat('#efe8e0', { rough: 0.8 }); const fence = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 2.2)), a = Math.atan2(z1 - z0, x1 - x0); for (let i = 0; i <= n; i++) st.add(box(0.14, 1.15, 0.14, fm, lerp(x0, x1, i / n), 0.57, lerp(z0, z1, i / n))); for (const y of [0.45, 0.9]) { const rail = box(L, 0.12, 0.06, fm, (x0 + x1) / 2, y, (z0 + z1) / 2); rail.rotation.y = -a; st.add(rail); } };
  if (o.fence !== false) { fence(-26, -4, -3, -4); fence(3, -4, 26, -4); fence(-26, -4, -26, -30); fence(26, -4, 26, -30); }
  // crop rows on the right
  if (o.fields !== false) { const cm = mat(shade(P.grass, 0.12), { rough: 0.95 }), dm = mat('#7a5a44', { rough: 1 }); st.add(box(18, 0.04, 16, dm, 14, 0.02, -18)); for (let i = 0; i < 12; i++) st.add(box(17, 0.32, 0.55, cm, 14, 0.16, -11 - i * 1.3)); }
  if (o.hay !== false) { const hm = mat('#d8b860', { rough: 0.95 }); for (let i = 0; i < 6; i++) { const b = cyl(0.65, 0.65, 1.2, hm, 0, 0, 0, 16); b.rotation.z = R2; st.add(at(group(b), -16 + i * 1.6 + r() * 0.4, 0.65, -9 - r() * 3, r() * 0.6)); } }
  for (let i = 0; i < (o.trees ?? 14); i++) { const x = (r() - 0.5) * 120, z = -26 - r() * 40; st.add(at(tree({ s: 1 + r() * 0.6, seed: i, color: shade(P.leaf, -0.05 - r() * 0.15) }), x, 0, z)); }
  st.add(at(group(box(0.9, 0.04, 220, mat(shade('#7a5a44', 0.15), { rough: 1 }), 0, 0.01, 0)), 0, 0, 0));   // dirt track toward the barn
  return { barn: { x: bx, z: bz, door: [bx, bz + 3.7] }, heightAt: H };
}

// ---------------------------------------------------------------- underwater
// fishSchool(st, { n, center, radius, height, colors, speed, size, seed }) → instanced little fish circling as one school. Animates itself.
export function fishSchool(st, o = {}) {
  const { n = 60, center = [0, 2, -4], radius = 3, height = 1.2, speed = 0.35, size = 0.22, seed = 3 } = o, r = rng(seed);
  const colors = o.colors || ['#ff9a5a', '#ffd06a', '#6ad0e0', '#ff7a8a', '#9ac0ff'];
  const body = new THREE.SphereGeometry(0.5, 10, 8); body.scale(0.42, 0.55, 1); const tail = new THREE.ConeGeometry(0.28, 0.4, 4); tail.rotateX(R2); tail.scale(0.25, 1, 1); tail.translate(0, 0, -0.62);
  const geo = (() => { const a = body.toNonIndexed(), b = tail.toNonIndexed(); const pa = a.attributes.position.array, pb = b.attributes.position.array, na = a.attributes.normal.array, nb = b.attributes.normal.array; const g = new THREE.BufferGeometry(); const pp = new Float32Array(pa.length + pb.length); pp.set(pa); pp.set(pb, pa.length); const nn = new Float32Array(na.length + nb.length); nn.set(na); nn.set(nb, na.length); g.setAttribute('position', new THREE.BufferAttribute(pp, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); return g; })();
  const m = new THREE.InstancedMesh(geo, mat('#ffffff', { rough: 0.5, keepSat: true }), n); m.castShadow = true; m.userData.dynamic = true; m.frustumCulled = false;
  const F = Array.from({ length: n }, (_, i) => { m.setColorAt(i, calm(colors[i % colors.length])); return { a: r() * Math.PI * 2, rr: radius * (0.55 + r() * 0.5), y: (r() - 0.5) * height, s: size * (0.7 + r() * 0.6), w: 0.8 + r() * 0.4, ph: r() * 9 }; });
  const q = new THREE.Object3D();
  m.tick = (t) => { F.forEach((f, i) => { const a = f.a + t * speed * f.w, x = center[0] + Math.cos(a) * f.rr, z = center[2] + Math.sin(a) * f.rr * 0.7, y = center[1] + f.y + 0.15 * Math.sin(t * 1.3 + f.ph);
    q.position.set(x, y, z); q.rotation.set(0, -a + (speed >= 0 ? 0 : Math.PI), 0.15 * Math.sin(t * 9 + f.ph)); q.scale.setScalar(f.s); q.updateMatrix(); m.setMatrixAt(i, q.matrix); }); m.instanceMatrix.needsUpdate = true; };
  m.tick(0); st.add(m); return m;
}
// seaweed(st, { pos, h, color, seed }) — a swaying strand (animates itself)
export function seaweed(st, o = {}) {
  const r = rng(o.seed || 1), n = 7, h = o.h ?? 2.2, c = mat(o.color || '#3f8a6a', { rough: 0.9, flat: true }), g = group(); g.userData.dynamic = true; const segs = [];
  let parent = g; for (let i = 0; i < n; i++) { const s = group(mesh(new THREE.CapsuleGeometry(0.09 - i * 0.008, h / n, 3, 6), c, 0, h / n / 2, 0)); s.position.y = i ? h / n : 0; parent.add(s); segs.push(s); parent = s; }
  g.position.set(...(o.pos || [0, 0, 0])); const ph = r() * 9; g.tick = (t) => segs.forEach((s, i) => { s.rotation.z = 0.12 * Math.sin(t * 0.9 + ph + i * 0.5); s.rotation.x = 0.06 * Math.sin(t * 0.7 + ph + i * 0.4); });
  g.tick(0); st.add(g); return g;
}
// underwater(st, { seed, depth, rays, fish, weeds, coral, bubbles, surface }) → a sandy sea floor at y = 0 with rocks, coral, swaying
// seaweed, god rays from the surface, rising bubbles, moving caustic light and a school of fish. Use mood 'underwater', fog [4, 30].
// Returns { surfaceY, fish, rays }.
export function underwater(st, o = {}) {
  const P = pal(st), r = rng(o.seed || 7), depth = o.depth ?? 9;
  st.add(terrain(160, 160, 90, (x, z) => 0.25 * noise(x * 0.18, 2) + 0.2 * Math.sin(x * 0.4 + z * 0.3) * 0.5, (x, z, y) => mix(shade(P.sand, -0.1), P.sand, sstep(-0.2, 0.3, y)), { cz: -30, map: speckle('#ffffff', 2500, [40, 40], 3, 0.05) }));
  // caustics: two drifting layers of soft light lines over the sand
  const cTex = cached('caustics', () => canvasTex(256, 256, (g, w, h) => { const rr = rng(21); g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 5; g.shadowColor = '#fff'; g.shadowBlur = 8; for (let i = 0; i < 26; i++) { g.beginPath(); let x = rr() * w, y = rr() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (rr() - 0.5) * 70; y += (rr() - 0.5) * 70; g.quadraticCurveTo(x + (rr() - 0.5) * 40, y + (rr() - 0.5) * 40, x, y); } g.stroke(); } }, [14, 14]));
  const caus = [0, 1].map(i => { const t2 = cTex.clone(); t2.needsUpdate = true; t2.wrapS = t2.wrapT = THREE.RepeatWrapping; t2.repeat.set(12 + i * 3, 12 + i * 3); const m = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshBasicMaterial({ map: t2, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, color: color(P.practical), fog: true })); m.rotation.x = -R2; m.position.set(0, 0.32, -30); m.userData.dynamic = true; st.add(m); return m; });
  st.onTick((t) => { caus[0].material.map.offset.set(t * 0.012, t * 0.008); caus[1].material.map.offset.set(-t * 0.009, t * 0.011); });
  for (let i = 0; i < (o.rocks ?? 10); i++) { const x = (r() - 0.5) * 30, z = -2 - r() * 25; if (Math.abs(x) < 2.5 && z > -8) continue; st.add(at(rock({ seed: i + 3, s: 0.4 + r() * 1.2, color: shade(P.dark, 0.45) }), x, -0.1, z)); }
  const coralC = ['#e0807a', '#e8a86a', '#c88ab8', '#f0c070', '#d86a8a'];
  for (let i = 0; i < (o.coral ?? 14); i++) { const x = (r() - 0.5) * 26, z = -3 - r() * 20; if (Math.abs(x) < 2.5 && z > -8) continue; const c = mat(coralC[i % coralC.length], { rough: 0.8, flat: true }), cg = group(); for (let k = 0; k < 5; k++) { const b = cyl(0.06, 0.1, 0.5 + r() * 0.6, c, (r() - 0.5) * 0.4, 0.3, (r() - 0.5) * 0.4, 6); b.rotation.set((r() - 0.5) * 0.8, 0, (r() - 0.5) * 0.8); cg.add(b, sphere(0.1, c, b.position.x + Math.sin(b.rotation.z) * -0.3, 0.62, b.position.z, 6, 5)); } st.add(at(cg, x, 0, z)); }
  for (let i = 0; i < (o.weeds ?? 18); i++) { const x = (r() - 0.5) * 24, z = -2 - r() * 18; if (Math.abs(x) < 2 && z > -7) continue; seaweed(st, { pos: [x, 0, z], h: 1.4 + r() * 2, seed: i, color: shade(P.grass, r() * 0.2) }); }
  const rays = []; if (o.rays !== false) for (let i = 0; i < 7; i++) { const c = lightCone(1.2 + r() * 1.5, depth + 4, P.practical, 0.07); c.position.set(-12 + i * 4 + r() * 2, depth + 1, -4 - r() * 14); c.rotation.z = 0.25; c.userData.ph = r() * 9; c.userData.dynamic = true; st.add(c); rays.push(c); }
  st.onTick((t) => rays.forEach(c => { c.material.opacity = 0.05 + 0.03 * Math.sin(t * 0.6 + c.userData.ph); c.rotation.z = 0.25 + 0.04 * Math.sin(t * 0.3 + c.userData.ph); }));
  if (o.bubbles !== false) { const b = dust(st, { n: 120, area: [-8, 8, 0, depth, -12, 4], c: '#e8ffff', size: 0.06, speed: 0.4, seed: 2, rise: 0.8, opacity: 0.6 }); st.onTick(b.update); }
  if (o.surface !== false) { const s = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 1, 1), new THREE.MeshBasicMaterial({ color: color(shade(P.water, 0.35)), transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, fog: true })); s.rotation.x = R2; s.position.y = depth; st.add(s); }
  const fish = o.fish === false ? null : fishSchool(st, { n: o.fishN ?? 70, center: o.fishAt || [2, 3.2, -7], radius: 4, ...(typeof o.fish === 'object' ? o.fish : {}) });
  return { surfaceY: depth, fish, rays };
}

// ---------------------------------------------------------------- sky: aurora
// aurora(st, { colors: [low, high], y, z, w, h, n }) — waving curtains of light across the night sky (arctic stories). Animates itself.
export function aurora(st, o = {}) {
  const [c1, c2] = o.colors || ['#5affc0', '#c88aff'], y = o.y ?? 22, z = o.z ?? -90, w = o.w ?? 220, h = o.h ?? 26, n = o.n ?? 3;
  const tex = cached('aurora' + c1 + c2, () => canvasTex(8, 256, (g, W, Hh) => { const gr = g.createLinearGradient(0, Hh, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.08, c1); gr.addColorStop(0.35, c1 + '99'); gr.addColorStop(0.7, c2 + '55'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); }));
  const g = group(); g.userData.dynamic = true; const sheets = [];
  for (let i = 0; i < n; i++) { const geo = new THREE.PlaneGeometry(w, h, 90, 1); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.55 - i * 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false }));
    m.position.set((i - 1) * 25, y + i * 5, z - i * 14); m.userData.base = Float32Array.from(geo.attributes.position.array); m.userData.ph = i * 2.3; g.add(m); sheets.push(m); }
  g.tick = (t) => sheets.forEach((m, i) => { const p = m.geometry.attributes.position, b = m.userData.base, ph = m.userData.ph; for (let k = 0; k < p.count; k++) { const x = b[k * 3]; p.setZ(k, 9 * Math.sin(x * 0.03 + t * 0.25 + ph) + 4 * Math.sin(x * 0.07 - t * 0.4 + ph)); p.setY(k, b[k * 3 + 1] + 1.5 * Math.sin(x * 0.05 + t * 0.3 + ph)); } p.needsUpdate = true; m.material.opacity = (0.55 - i * 0.12) * (0.8 + 0.2 * Math.sin(t * 0.5 + ph)); });
  g.tick(0); st.add(g); return g;
}

// campfire(st, { pos, size, stones, light, shadow, fire }) → crossed logs in a ring of stones with a living fire on them (FX3.fire).
// Returns { fire, obj }. The fire lights faces warmly and flickers; use it at night or dusk, faces 1–2.5 m away.
export function campfire(st, o = {}) {
  const { pos = [0, 0, 0], size = 1 } = o, g = group(); g.position.set(...pos); st.add(g);
  const wood = mat('#6a4a34', { rough: 0.95 }), char = mat('#2a2024', { rough: 1 });
  for (let i = 0; i < 4; i++) { const l = cyl(0.07 * size, 0.08 * size, 0.9 * size, i % 2 ? wood : char, 0, 0.12 * size, 0, 8); l.rotation.set(0, (i / 4) * Math.PI, 1.25); g.add(l); }
  if (o.stones !== false) for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; g.add(at(rock({ seed: i + 30, s: 0.16 * size, color: '#5a5462' }), Math.cos(a) * 0.62 * size, -0.02, Math.sin(a) * 0.62 * size)); }
  const f = fire(st, { pos: [pos[0], pos[1] + 0.1 * size, pos[2]], size: 0.8 * size, ...(o.fire || {}), light: o.light, shadow: o.shadow });
  return { fire: f, obj: g };
}


// ---------------------------------------------------------------- space: a planet you can cut to ("every human on Earth…")
// small 3D value noise on the sphere, so continents have no seam
const h3 = (x, y, z, s) => { const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + s * 19.3) * 43758.5453; return n - Math.floor(n); };
function vnoise(x, y, z, s) { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, k) => a + (b - a) * k, c = (dx, dy, dz) => h3(xi + dx, yi + dy, zi + dz, s);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w); }
const fbm = (x, y, z, s) => { let a = 0, f = 1, k = 0.5; for (let i = 0; i < 4; i++) { a += k * vnoise(x * f, y * f, z * f, s + i); f *= 2.1; k *= 0.5; } return a; };
// planet(st, { r, pos, spin, tilt, sea, land, land2, ice, clouds, atmosphere, seed }) → a toy Earth: soft continents, ice caps, drifting
// clouds and a blue halo. Spins by itself (spin = turns per minute). Frame it on a space stage: T.W.space(st) with mood 'void'.
export function planet(st, o = {}) {
  const R = o.r ?? 3, seed = o.seed ?? 3, sea = o.sea || '#4f86c8', land = o.land || '#7ab070', land2 = o.land2 || '#c8b07a', ice = o.ice || '#f2f2fa';
  const tex = cached('planet' + seed + sea + land, () => canvasTex(1024, 512, (g, W, H) => { const img = g.createImageData(W, H), d = img.data, cs = color(sea), cl = color(land), cl2 = color(land2), ci = color(ice), tmp = new THREE.Color();
    for (let j = 0; j < H; j++) { const lat = (0.5 - j / H) * Math.PI; for (let i = 0; i < W; i++) { const lon = (i / W) * Math.PI * 2, x = Math.cos(lat) * Math.cos(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(lon);
      const n = fbm(x * 1.6 + 5, y * 1.6, z * 1.6, seed), polar = Math.abs(y) > 0.86 + 0.05 * vnoise(x * 4, y * 4, z * 4, seed + 9);
      if (polar) tmp.copy(ci); else if (n > 0.5) tmp.copy(cl).lerp(cl2, clamp((fbm(x * 3, y * 3, z * 3, seed + 4) - 0.45) * 3) * (1 - Math.abs(y))); else tmp.copy(cs).multiplyScalar(0.85 + 0.3 * n);
      const p = (j * W + i) * 4; d[p] = tmp.r * 255; d[p + 1] = tmp.g * 255; d[p + 2] = tmp.b * 255; d[p + 3] = 255; } }
    g.putImageData(img, 0, 0); }));
  const ctex = o.clouds === false ? null : cached('clouds' + seed, () => canvasTex(512, 256, (g, W, H) => { const img = g.createImageData(W, H), d = img.data;
    for (let j = 0; j < H; j++) { const lat = (0.5 - j / H) * Math.PI; for (let i = 0; i < W; i++) { const lon = (i / W) * Math.PI * 2, x = Math.cos(lat) * Math.cos(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(lon), n = fbm(x * 2.4, y * 3.5, z * 2.4, seed + 20);
      const p = (j * W + i) * 4; d[p] = d[p + 1] = d[p + 2] = 255; d[p + 3] = clamp((n - 0.52) * 4) * 210; } } g.putImageData(img, 0, 0); }));
  const g = group(); g.position.set(...(o.pos || [0, 2.5, -8])); g.rotation.z = o.tilt ?? 0.32; g.userData.dynamic = true;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), mat('#ffffff', { map: tex, rough: 0.75, keepSat: true, emissive: new THREE.Color('#ffffff'), emissiveMap: tex, emissiveIntensity: o.selfLit ?? 0.2 })); ball.castShadow = false; g.add(ball);
  let cl = null; if (ctex) { cl = new THREE.Mesh(new THREE.SphereGeometry(R * 1.015, 48, 32), new THREE.MeshStandardMaterial({ map: ctex, transparent: true, depthWrite: false, roughness: 1 })); g.add(cl); }
  if (o.atmosphere !== false) {   // a soft fresnel glow at the rim, not a hard ring
    const at = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 48, 32), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { c: { value: color(o.halo || '#7ab8ff') } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = 1.0 - abs(dot(vN, vV)); float a = pow(f, 2.6) * smoothstep(1.0, 0.86, f); gl_FragColor = vec4(c * 1.4, a * 0.9); }' }));
    g.add(at); const hl = glow(o.halo || '#7ab8ff', R * 3.0, 0.22); g.add(hl); }
  const spin = (o.spin ?? 1.2) * Math.PI * 2 / 60; g.tick = (t) => { ball.rotation.y = (o.phase ?? 0) + t * spin; if (cl) cl.rotation.y = (o.phase ?? 0) + t * spin * 1.25; };
  g.tick(0); st.add(g); g.ball = ball; return g;
}
// space(st, { stars, nebula }) → deep space around the camera: many stars and two faint coloured nebula clouds. Use with mood 'void'.
export function space(st, o = {}) {
  st.add(stars(o.stars ?? 1400, { radius: 250 }));
  if (o.nebula !== false) for (const [x, y, z, c, s] of [[-90, 40, -200, '#6a3aa8', 180], [110, -30, -220, '#2a6aa8', 160], [20, 90, -230, '#a83a7a', 120]]) { const n = glow(c, s, 0.22, { fog: false }); n.position.set(x, y, z); st.add(n); }
  return {};
}
