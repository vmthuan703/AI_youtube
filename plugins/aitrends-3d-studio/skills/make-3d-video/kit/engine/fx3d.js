// engine/fx3d.js — 3D effects (T.FX3.*). Every effect is a pure function of time: build it in init(), then call
// fx.update(t) from draw() (or register it once with st.onTick(fx.update) and call st.tick(t)). Never accumulate state.
//
//   const dust = T.FX3.dust(st, { area: [-4, 4, 0, 3, -3, 3] });            st.onTick(dust.update);
//   const lines = T.FX3.speedLines(st, { axis: 'x', dir: -1, around: [0, 1.2, 0] });
//   const echo = T.FX3.ghosts(st, HERO, 5, { color: '#7fd8ff' });           echo.update(t, tt => ({ pos, yaw, pose }))
import * as THREE from 'three';
import { rng, clamp, lerp, ease, prog, noise } from './core.js';
import { dotTex, glow, color, character, canvasTex, cached } from './kit3d.js';

const pts = (n, size, c, o = {}) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3)); const m = new THREE.PointsMaterial({ color: color(c), size, map: dotTex(), transparent: true, opacity: o.opacity ?? 0.7, depthWrite: false, blending: o.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending, sizeAttenuation: true, fog: o.fog ?? true, toneMapped: false }); const p = new THREE.Points(g, m); p.frustumCulled = false; return p; };
// floating dust motes / pollen / embers. area: [x0, x1, y0, y1, z0, z1]
export function dust(st, o = {}) {
  const { n = 160, area = [-5, 5, 0, 3, -4, 3], c = st.M.practical, size = 0.03, speed = 0.08, seed = 3, rise = 0 } = o; const r = rng(seed);
  const P = pts(n, size, c, o); const base = Array.from({ length: n }, () => [lerp(area[0], area[1], r()), lerp(area[2], area[3], r()), lerp(area[4], area[5], r()), r() * 100]); st.add(P);
  const update = (t) => { const a = P.geometry.attributes.position; base.forEach(([x, y, z, s], i) => { let yy = y + rise * t; yy = area[2] + ((yy - area[2]) % (area[3] - area[2]) + (area[3] - area[2])) % (area[3] - area[2]); a.setXYZ(i, x + noise(t * speed + s, 1) * 0.4, yy + noise(t * speed + s, 2) * 0.3, z + noise(t * speed + s, 3) * 0.4); }); a.needsUpdate = true; };
  update(0); return { obj: P, update };
}
// rain streaks (or snow with o.snow). Falls inside area around the camera target
export function rain(st, o = {}) {
  const { n = 900, area = [-10, 10, 0, 9, -8, 6], c = '#b8c8ff', speed = 14, seed = 5, snow = false, wind = 0.15 } = o; const r = rng(seed);
  if (snow) { const p = dust(st, { n, area, c: '#ffffff', size: 0.05, speed: 0.3, seed, rise: -1.2, opacity: 0.85, additive: false }); return p; }
  const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 6); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const L = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: color(c), transparent: true, opacity: o.opacity ?? 0.35, depthWrite: false, fog: true })); L.frustumCulled = false; st.add(L);
  const base = Array.from({ length: n }, () => [lerp(area[0], area[1], r()), r(), lerp(area[4], area[5], r()), 0.6 + r() * 0.6]); const H = area[3] - area[2], len = o.len ?? 0.35;
  const update = (t) => { base.forEach(([x, y0, z, k], i) => { const y = area[3] - (((y0 * H + t * speed * k) % H) + H) % H; pos.set([x + wind * (area[3] - y), y, z, x + wind * (area[3] - y) - wind * len, y + len, z], i * 6); }); g.attributes.position.needsUpdate = true; };
  update(0); return { obj: L, update };
}
// speed lines: long thin streaks rushing past a point along an axis (super speed, falling, flying)
export function speedLines(st, o = {}) {
  const { n = 120, axis = 'x', dir = -1, around = [0, 1.2, 0], radius = [0.6, 4], length = [1.5, 5], span = 40, speed = 60, c = '#ffffff', seed = 7, opacity = 0.5 } = o; const r = rng(seed);
  const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 6); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const L = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: color(c), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false })); L.frustumCulled = false; st.add(L);
  const ax = { x: 0, y: 1, z: 2 }[axis], base = Array.from({ length: n }, () => { const a = r() * Math.PI * 2, rr = lerp(radius[0], radius[1], Math.sqrt(r())); return [Math.cos(a) * rr, Math.sin(a) * rr, r() * span, lerp(length[0], length[1], r()), 0.7 + r() * 0.6]; });
  const update = (t) => { base.forEach(([u, v, off, len, k], i) => { const s = ((off + t * speed * k) % span) - span / 2; const p0 = [...around], p1 = [...around]; const oth = [0, 1, 2].filter(q => q !== ax); p0[oth[0]] += u; p0[oth[1]] += v; p1[oth[0]] += u; p1[oth[1]] += v; p0[ax] += dir * s; p1[ax] += dir * (s - len); pos.set([...p0, ...p1], i * 6); }); g.attributes.position.needsUpdate = true; };
  update(0); const api = { obj: L, update, set visible(v) { L.visible = v; } }; return api;
}
// afterimages: n translucent copies of a character that trail behind it.
// update(t, at) where at(tt) -> { pos:[x,y,z], yaw, pose } gives the hero state at an earlier time tt.
export function ghosts(st, outfit, n = 5, o = {}) {
  const { c = '#8fd8ff', opacity = 0.32, gap = 0.045 } = o;
  const list = Array.from({ length: n }, (_, i) => { const g = character(outfit, { ghost: { color: c, opacity: opacity * (1 - i / (n + 0.5)) } }); st.add(g); return g; });
  const update = (t, at) => { list.forEach((g, i) => { const s = at(t - (i + 1) * gap); if (!s) { g.visible = false; return; } g.visible = true; g.position.set(...s.pos); g.rotation.y = s.yaw || 0; if (s.pose) g.pose(s.pose); }); };
  return { list, update, set visible(v) { list.forEach(g => (g.visible = v)); } };
}
// expanding ring on the ground or in the air (impacts, landings, time-stop pulses). update(t) with t0 = start time
export function shockwave(st, o = {}) {
  const { pos = [0, 0.02, 0], c = '#ffffff', r0 = 0.2, r1 = 6, dur = 0.8, t0 = 0, flat = true, opacity = 0.8 } = o;
  const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 64), new THREE.MeshBasicMaterial({ color: color(c), transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  if (flat) m.rotation.x = -Math.PI / 2; m.position.set(...pos); st.add(m);
  const update = (t) => { const k = prog(t, t0, t0 + dur); m.visible = k > 0 && k < 1; const s = lerp(r0, r1, ease.out(k)); m.scale.setScalar(s); m.material.opacity = opacity * (1 - k); };
  update(0); return { obj: m, update };
}
// background bokeh: soft out-of-focus light discs (city lights, party, magic)
export function bokeh(st, o = {}) {
  const { n = 40, area = [-12, 12, 0.5, 6, -14, -8], colors = [st.M.practical, '#ff7a9a', '#7ad0ff'], size = [0.4, 1.2], seed = 4, opacity = 0.35 } = o; const r = rng(seed); const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const s = glow(colors[(r() * colors.length) | 0], lerp(size[0], size[1], r()), opacity * (0.5 + r() * 0.5), { disc: true }); s.position.set(lerp(area[0], area[1], r()), lerp(area[2], area[3], r()), lerp(area[4], area[5], r())); s.userData.ph = r() * 9; g.add(s); }
  st.add(g); const update = (t) => g.children.forEach(s => { s.material.opacity = opacity * (0.6 + 0.4 * Math.sin(t * 0.8 + s.userData.ph)); }); return { obj: g, update };
}
// frozen droplets / debris hanging in the air (time-stop). drift = tiny motion while frozen
export function frozen(st, o = {}) {
  const { n = 120, area = [-3, 3, 0.2, 2.6, -2, 2], c = '#bfe6ff', seed = 9, size = [0.015, 0.05], drift = 0.02 } = o; const r = rng(seed); const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 10, 8), m = new THREE.MeshStandardMaterial({ color: color(c), roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.75, emissive: color(c), emissiveIntensity: 0.25 });
  for (let i = 0; i < n; i++) { const d = new THREE.Mesh(geo, m); d.scale.setScalar(lerp(size[0], size[1], r())); d.scale.y *= 1.3; d.position.set(lerp(area[0], area[1], r()), lerp(area[2], area[3], r()), lerp(area[4], area[5], r())); d.userData.b = d.position.clone(); d.userData.s = r() * 50; g.add(d); }
  st.add(g); const update = (t) => g.children.forEach(d => { const b = d.userData.b, s = d.userData.s; d.position.set(b.x + noise(t * 0.2 + s, 1) * drift, b.y + noise(t * 0.2 + s, 2) * drift, b.z); }); return { obj: g, update };
}
// burst of sparks / confetti from a point at t0
export function burst(st, o = {}) {
  const { n = 80, pos = [0, 1, 0], colors = ['#ffd23a', '#ff5a6a', '#5ad0ff', '#7aff9a'], speed = [2, 6], gravity = 6, t0 = 0, dur = 1.6, size = 0.06, seed = 2, confetti = false } = o; const r = rng(seed);
  const g = new THREE.Group(); const geo = confetti ? new THREE.PlaneGeometry(1, 0.6) : new THREE.SphereGeometry(1, 6, 4);
  const parts = Array.from({ length: n }, () => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: color(colors[(r() * colors.length) | 0]), side: THREE.DoubleSide, transparent: true, toneMapped: false })); m.scale.setScalar(size * (0.6 + r() * 0.8)); const th = r() * Math.PI * 2, ph = Math.acos(lerp(-0.2, 1, r())), v = lerp(speed[0], speed[1], r()); m.userData.v = [Math.cos(th) * Math.sin(ph) * v, Math.cos(ph) * v, Math.sin(th) * Math.sin(ph) * v]; m.userData.spin = r() * 10; g.add(m); return m; });
  st.add(g); const update = (t) => { const tt = t - t0; g.visible = tt > 0 && tt < dur; if (!g.visible) return; parts.forEach(m => { const [vx, vy, vz] = m.userData.v; m.position.set(pos[0] + vx * tt, pos[1] + vy * tt - 0.5 * gravity * tt * tt, pos[2] + vz * tt); m.rotation.set(tt * m.userData.spin, tt * m.userData.spin * 0.7, 0); m.material.opacity = 1 - prog(tt, dur * 0.6, dur); }); };
  update(0); return { obj: g, update };
}
// glowing aura / energy around a character (powers): a pulsing additive shell around the object's bounding sphere
export function aura(st, target, o = {}) {
  const { c = '#7fd8ff', size = 1.1, opacity = 0.4, y = 1.0 } = o; const s = glow(c, size * 2.4, opacity); st.add(s);
  const update = (t) => { const p = target.position; s.position.set(p.x, p.y + y, p.z); s.material.opacity = opacity * (0.75 + 0.25 * Math.sin(t * 6)); s.scale.setScalar(size * 2.4 * (1 + 0.05 * Math.sin(t * 4))); };
  update(0); return { obj: s, update };
}
// motion trail ribbon behind a moving point: update(t, at) with at(tt) -> [x,y,z]
export function trail(st, o = {}) {
  const { n = 24, gap = 0.02, width = 0.25, c = '#8fd8ff', opacity = 0.6 } = o;
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(n * 2 * 3), alphaA = new Float32Array(n * 2); const idx = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  geo.setIndex(idx); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('alpha', new THREE.BufferAttribute(alphaA, 1));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { col: { value: color(c) }, op: { value: opacity } }, vertexShader: 'attribute float alpha; varying float va; void main(){ va = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: 'uniform vec3 col; uniform float op; varying float va; void main(){ gl_FragColor = vec4(col * 1.5, va * op); }' });
  const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; st.add(mesh);
  const update = (t, at) => { for (let i = 0; i < n; i++) { const p = at(t - i * gap); const w = width * (1 - i / n); pos.set([p[0], p[1] + w / 2, p[2], p[0], p[1] - w / 2, p[2]], i * 6); alphaA[i * 2] = alphaA[i * 2 + 1] = 1 - i / n; } geo.attributes.position.needsUpdate = true; geo.attributes.alpha.needsUpdate = true; };
  return { obj: mesh, update };
}
