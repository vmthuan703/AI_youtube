// engine/weather10.js — 1.0 dramatic light and weather on any set (exposed as T.W.* through world3d.js). All tick themselves.
//
//   T.W.lightning(st, { times: [1.2, 3.4] })                   // double-strobe flashes (pair with a thunder SFX a beat later)
//   T.W.cloudShadows(st, { at: [x, z] })                       // cloud shadows sliding over the ground; the sun dims as one passes
//   T.W.headlights(st, { from, to, aim, t0, dur, shadow })     // a car's beams sweeping across a wall (indoors: start at the window, shadow: false)
//   L.intensity = base * T.W.flicker(t, { rate, depth })       // a failing tube light, a candle
//   T.W.snowCover(st, { amount })                              // after the set: snow caps on every upward surface + patchy ground
//   T.W.puddles(st, { area: [x0, x1, z0, z1], n })             // rain puddles that mirror the scene (one reflection pass)
//   T.W.leaves(st, { area: [x0, x1, y0, y1, z0, z1], n })      // autumn leaves tumbling down, and a scatter on the ground
import * as THREE from 'three';
import { S, rng, clamp, lerp, noise, ease } from './core.js';
import { LEGACY, canvasTex, cached, group, color, lightCone } from './kit3d.js';
import { mirror } from './look10.js';

// ================================================================ dramatic light
export function lightning(st, o = {}) {
  const times = o.times || [1], c = color(o.color || '#d8e4ff'), L = new THREE.DirectionalLight(c, 0); L.position.set(...(o.from || [4, 14, -6])); st.add(L, L.target);
  const hemi0 = st.hemi.intensity, bg = st.scene.background && st.scene.background.isColor ? st.scene.background.clone() : null;
  const flashAt = (t) => { let f = 0; for (const t0 of times) { const d = t - t0; if (d < 0) continue; f = Math.max(f, Math.exp(-d / 0.05) + (d > 0.13 ? 0.7 * Math.exp(-(d - 0.13) / 0.09) : 0)); } return Math.min(1, f); };
  const update = (t) => { const f = flashAt(t); L.intensity = f * (o.power ?? 9); st.hemi.intensity = hemi0 * (1 + 2.2 * f); if (bg) st.scene.background.copy(bg).lerp(c, f * 0.6); return f; };
  update(0); st.onTick(update); return { update, flashAt };
}
const cloudTex = () => cached('cloudShadowTex', () => canvasTex(512, 512, (g, W, H) => { const r = rng(12); g.clearRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, rr = 40 + r() * 90; for (const dx of [0, W, -W]) for (const dy of [0, H, -H]) { const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rr); gr.addColorStop(0, 'rgba(0,0,0,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + dx - rr, y + dy - rr, rr * 2, rr * 2); } } }));
export function cloudShadows(st, o = {}) {
  if (LEGACY) return null;
  const size = o.size || 60, area = o.area || 160, sp = o.speed ?? 1.6, dir = new THREE.Vector2(...(o.dir || [1, 0.4])).normalize(), tex = cloudTex().clone();
  tex.needsUpdate = true; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(area / size, area / size);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(area, area), new THREE.MeshBasicMaterial({ map: tex, color: 0x000000, transparent: true, opacity: o.strength ?? 0.32, depthWrite: false, fog: true }));
  m.rotation.x = -Math.PI / 2; m.position.y = o.y ?? 0.03; m.renderOrder = 1; m.userData.dynamic = true; st.add(m);
  const sun0 = st.sun.intensity, at = o.at || [0, 0];
  const update = (t) => { const ox = dir.x * sp * t / size, oy = dir.y * sp * t / size; tex.offset.set(-ox, oy);
    const n = clamp(0.5 + 0.9 * noise((at[0] / size + ox) * 3.1 + (at[1] / size + oy) * 1.7, 31)); st.sun.intensity = sun0 * (1 - (o.dim ?? 0.45) * clamp((n - 0.45) * 2.2)); };
  update(0); st.onTick(update); return { obj: m, update };
}
export function headlights(st, o = {}) {
  const c = o.color || '#fff2d8', from = new THREE.Vector3(...(o.from || [-8, 0.8, 4])), to = new THREE.Vector3(...(o.to || [8, 0.8, 4])), aim = new THREE.Vector3(...(o.aim || [0, 0, -1])).normalize(), t0 = o.t0 ?? 0, dur = o.dur ?? 2.4;
  const S1 = new THREE.SpotLight(color(c), 0, o.dist ?? 22, o.angle ?? 0.38, 0.55, 1.2); S1.castShadow = o.shadow !== false; S1.shadow.mapSize.set(1024, 1024); S1.shadow.bias = -0.001; st.add(S1, S1.target);
  const cone = lightCone(1.6, 7, c, 0.05); cone.userData.dynamic = true; st.add(cone);
  const update = (t) => { const k = clamp((t - t0) / dur), on = Math.sin(Math.PI * k), p = from.clone().lerp(to, ease.inOut(k));
    S1.position.copy(p); S1.target.position.copy(p).add(aim.clone().multiplyScalar(8)); S1.target.updateMatrixWorld();
    S1.intensity = (o.power ?? 60) * on * (S().light?.practical ?? 1); cone.visible = !LEGACY && on > 0.02; cone.position.copy(p); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim); cone.material.opacity = 0.05 * on; };
  update(0); st.onTick(update); return { light: S1, update };
}
export function flicker(t, o = {}) { const sd = o.seed ?? 3, n = noise(t * (o.rate ?? 9), sd), cut = noise(t * 2.3, sd + 5) > 0.55 && noise(t * 23, sd + 9) > 0.1 ? 0.15 : 1; return clamp(1 - (o.depth ?? 0.35) * (0.5 + 0.5 * n)) * cut; }

// ================================================================ weather
const roundedCap = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d, 3, 1, 3), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) if (P.getY(i) > 0) { const cx = Math.abs(P.getX(i)) / (w / 2), cz = Math.abs(P.getZ(i)) / (d / 2); P.setY(i, P.getY(i) * (1 + 0.5 * (1 - Math.max(cx, cz)))); P.setX(i, P.getX(i) * 0.97); P.setZ(i, P.getZ(i) * 0.97); }
  g.computeVertexNormals(); return g; };
export function snowCover(st, o = {}) {
  if (LEGACY) return null;
  const amt = o.amount ?? 1, snowM = new THREE.MeshStandardMaterial({ color: color('#f4f6ff'), roughness: 0.75, emissive: color('#c8d0ff'), emissiveIntensity: 0.08 }), caps = [];
  st.scene.updateMatrixWorld(true); const up = new THREE.Vector3(), q = new THREE.Quaternion(), list = [];
  st.scene.traverse(m => { if (!m.isMesh || !m.castShadow || m.material?.transparent || m.material?.isMeshBasicMaterial || m.isInstancedMesh) return; for (let p = m; p; p = p.parent) if (p.name === 'character' || p.userData?.dynamic) return; list.push(m); });
  for (const m of list) { if (caps.length >= (o.max ?? 500)) break; m.getWorldQuaternion(q); up.set(0, 1, 0).applyQuaternion(q); if (up.y < 0.985) continue;
    const b = new THREE.Box3().setFromObject(m), sz = b.getSize(new THREE.Vector3()); if (sz.x * sz.z < 0.04 || sz.x > 60 || sz.z > 60 || sz.y < 0.02) continue;
    const th = (0.025 + 0.05 * amt) * Math.min(1, Math.sqrt(sz.x * sz.z)), cap = new THREE.Mesh(roundedCap(sz.x + 0.02, th, sz.z + 0.02), snowM);
    cap.position.set((b.min.x + b.max.x) / 2, b.max.y + th / 2 - 0.004, (b.min.z + b.max.z) / 2); cap.receiveShadow = true; caps.push(cap); }
  const g = group(...caps); g.name = 'snow'; st.add(g);
  if (o.ground !== false) { const tex = canvasTex(512, 512, (gg, W, H) => { const r = rng(5); gg.fillStyle = 'rgba(255,255,255,.9)'; gg.fillRect(0, 0, W, H); gg.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, rr = 10 + r() * 50, gr = gg.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(0,0,0,${0.75 * (1 - amt * 0.7)})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); gg.fillStyle = gr; gg.fillRect(x - rr, y - rr, rr * 2, rr * 2); } }, [12, 12]);
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(o.groundSize || 200, o.groundSize || 200), new THREE.MeshStandardMaterial({ map: tex, color: color('#f4f6ff'), transparent: true, opacity: 0.55 + 0.4 * amt, roughness: 0.8, depthWrite: false }));
    gm.rotation.x = -Math.PI / 2; gm.position.y = (o.groundY ?? 0) + 0.012; gm.receiveShadow = true; gm.renderOrder = 1; st.add(gm); }
  return g;
}
export function puddles(st, o = {}) {
  const [x0, x1, z0, z1] = o.area || [-8, 8, -3, 3], w = x1 - x0, d = z1 - z0, r = rng(o.seed || 4), H = Math.max(64, Math.round(1024 * d / w));
  const mask = canvasTex(1024, H, (g, W, Hh) => { g.clearRect(0, 0, W, Hh); g.fillStyle = 'rgba(0,0,0,1)';
    for (let i = 0; i < (o.n ?? 7); i++) { const cx = (0.1 + r() * 0.8) * W, cy = (0.15 + r() * 0.7) * Hh, rw = W * (0.04 + r() * 0.06), sq = (W / w) / (Hh / d); g.beginPath();
      for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 2, rr = rw * (0.78 + 0.22 * Math.sin(a * 3 + i) + 0.08 * Math.sin(a * 7)), px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.6 / sq; if (k) g.lineTo(px, py); else g.moveTo(px, py); } g.fill(); } });
  const y = (o.y ?? 0);
  const rim = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: mask, color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })); rim.rotation.x = -Math.PI / 2; rim.position.set((x0 + x1) / 2, y + 0.003, (z0 + z1) / 2); rim.scale.set(1.03, 1.05, 1); rim.renderOrder = 1; st.add(rim);
  return mirror(st, { w, d, x: (x0 + x1) / 2, z: (z0 + z1) / 2, y: y + 0.002, strength: o.strength ?? 0.85, blur: 0.8, mask });
}
const leafTex = () => cached('leafTex', () => canvasTex(64, 64, (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(W / 2, 4); g.quadraticCurveTo(W - 4, H * 0.4, W / 2, H - 4); g.quadraticCurveTo(4, H * 0.4, W / 2, 4); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2, 8); g.lineTo(W / 2, H - 6); g.stroke(); }));
export function leaves(st, o = {}) {
  const [x0, x1, y0, y1, z0, z1] = o.area || [-6, 6, 0, 5, -3, 3], n = o.n ?? 60, r = rng(o.seed || 8), cols = (o.colors || ['#e8862a', '#d8582a', '#f2b632', '#b8402a', '#c8a03a']).map(c => color(c));
  const geo = new THREE.PlaneGeometry(0.12, 0.12), M = new THREE.MeshStandardMaterial({ map: leafTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
  const fall = new THREE.InstancedMesh(geo, M, n); fall.userData.dynamic = true; fall.frustumCulled = false; const base = [];
  for (let i = 0; i < n; i++) { base.push([lerp(x0, x1, r()), r() * 100, lerp(z0, z1, r()), 0.5 + r() * 0.6, r() * 6]); fall.setColorAt(i, cols[i % cols.length]); }
  const dummy = new THREE.Object3D(), H = y1 - y0, wind = o.wind ?? 0.25;
  const update = (t) => { base.forEach(([x, ph, z, sp, sd], i) => { const fallen = ((ph + t * sp) % H + H) % H, yy = y1 - fallen;
      dummy.position.set(x + Math.sin(t * 2.2 + sd) * 0.35 + wind * fallen, yy, z + Math.cos(t * 1.7 + sd) * 0.2); dummy.rotation.set(t * 3 + sd, t * 2 + sd * 2, Math.sin(t * 4 + sd)); dummy.scale.setScalar(1); dummy.updateMatrix(); fall.setMatrixAt(i, dummy.matrix); });
    fall.instanceMatrix.needsUpdate = true; };
  update(0); st.add(fall); st.onTick(update);
  const ng = o.ground ?? 120; if (ng > 0) { const gnd = new THREE.InstancedMesh(geo, M, ng);
    for (let i = 0; i < ng; i++) { dummy.position.set(lerp(x0 - 1, x1 + 1, r()), (o.y ?? 0) + 0.006 + i * 0.00003, lerp(z0 - 1, z1 + 1, r())); dummy.rotation.set(-Math.PI / 2, 0, r() * 6); dummy.scale.setScalar(0.8 + r() * 0.6); dummy.updateMatrix(); gnd.setMatrixAt(i, dummy.matrix); gnd.setColorAt(i, cols[(r() * cols.length) | 0]); }
    gnd.receiveShadow = true; st.add(gnd); }
  return { obj: fall, update };
}
