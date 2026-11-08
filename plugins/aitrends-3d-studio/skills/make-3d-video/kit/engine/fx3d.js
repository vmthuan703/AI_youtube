// engine/fx3d.js — 3D effects (T.FX3.*). Every effect is a pure function of time: build it in init(), then call
// fx.update(t) from draw() (or register it once with st.onTick(fx.update) and call st.tick(t)). Never accumulate state.
//
//   const dust = T.FX3.dust(st, { area: [-4, 4, 0, 3, -3, 3] });            st.onTick(dust.update);
//   const lines = T.FX3.speedLines(st, { axis: 'x', dir: -1, around: [0, 1.2, 0] });
//   const echo = T.FX3.ghosts(st, HERO, 5, { color: '#7fd8ff' });           echo.update(t, tt => ({ pos, yaw, pose }))
import * as THREE from 'three';
import { S, rng, clamp, lerp, ease, prog, noise } from './core.js';
import { dotTex, glow, glowMat, mat, color, character, canvasTex, cached, cyl, group, lightCone } from './kit3d.js';

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

// ================================================================ light that comes from props (0.2.7)
// A glowing thing in the story lights the faces around it, and the light travels with it: a campfire, an energy blade, a torch,
// a phone screen in the dark. Each costs one real light (keep ≤ 4–5 per shot). All flicker from t only, so renders stay deterministic.
const practical = () => S().light?.practical ?? 1;
// glowLight(obj, { color, intensity, dist, at: [x, y, z], flicker, halo }) → attaches a point light (and a soft halo) to any object:
// a phone screen, a lantern, a magic orb. It moves with the object. Returns { light, halo, update(t) } (update matters with flicker).
export function glowLight(obj, o = {}) {
  const c = color(o.color || '#bfe0ff'), L = new THREE.PointLight(c, (o.intensity ?? 2.5) * practical(), o.dist ?? 3, o.decay ?? 1.6); L.position.set(...(o.at || [0, 0, 0.12])); obj.add(L);
  const halo = o.halo === false ? null : glow(c, o.halo ?? 0.5, 0.35); if (halo) { halo.position.copy(L.position); obj.add(halo); }
  obj.userData.dynamic = true; const base = L.intensity, fk = o.flicker ?? 0;
  const update = (t) => { const k = 1 + fk * (0.6 * noise(t * 9, 3) + 0.4 * noise(t * 23, 5)); L.intensity = base * k; if (halo) halo.material.opacity = 0.35 * k; };
  return { light: L, halo, update };
}
// fire(st, { pos, size, colors, light, intensity, dist, smoke, embers, shadow }) — a living campfire / torch flame: layered flame tongues
// that lick and sway, a white-hot core, rising embers, a few smoke puffs and a warm flickering light on everything nearby. Animates itself.
export function fire(st, o = {}) {
  const { pos = [0, 0, 0], size = 1, seed = 4 } = o, r = rng(seed), g = group(); g.position.set(...pos); g.userData.dynamic = true; st.add(g);
  const cols = o.colors || ['#ff5a1e', '#ff9a2a', '#ffd25a'], flames = [];
  const shape = new THREE.SphereGeometry(0.5, 14, 10); { const p = shape.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = y > 0 ? 1 - y * 1.25 : 1; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); p.setY(i, y > 0 ? y * 2.2 : y * 0.6); } shape.computeVertexNormals(); }
  [[7, 0.62, 0], [6, 0.42, 1], [4, 0.24, 2]].forEach(([n, rad, layer]) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + r(), m = new THREE.Mesh(shape, new THREE.MeshBasicMaterial({ color: color(cols[layer]).multiplyScalar(1.6 + layer * 0.4), transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.userData = { x: Math.cos(a) * rad * 0.45 * size, z: Math.sin(a) * rad * 0.45 * size, s: (0.55 + r() * 0.35) * size * (1 - layer * 0.22), ph: r() * 20, sp: 5 + r() * 4 }; g.add(m); flames.push(m); } });
  const core = glow('#fff2c0', 0.9 * size, 0.9); core.position.y = 0.25 * size; g.add(core); const halo = glow(cols[1], 3.2 * size, 0.35); halo.position.y = 0.4 * size; g.add(halo);
  let L = null; if (o.light !== false) { L = new THREE.PointLight(color(o.lightColor || '#ffa04a'), (o.intensity ?? 9) * size * practical(), o.dist ?? 9 * size, 1.5); L.position.y = 0.6 * size; L.castShadow = !!o.shadow; if (o.shadow) { L.shadow.mapSize.set(512, 512); L.shadow.bias = -0.003; } g.add(L); }
  const emb = o.embers === false ? null : dust(st, { n: 40, area: [pos[0] - 0.5 * size, pos[0] + 0.5 * size, pos[1] + 0.2, pos[1] + 2.6 * size, pos[2] - 0.5 * size, pos[2] + 0.5 * size], c: '#ffb050', size: 0.035 * size, speed: 0.9, seed: seed + 1, rise: 1.1 * size, opacity: 0.9 });
  const smoke = []; if (o.smoke !== false) { const sm = new THREE.SpriteMaterial({ map: dotTex(), color: color('#6a6070'), transparent: true, opacity: 0, depthWrite: false }); for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(sm.clone()); s.userData.ph = i / 6; g.add(s); smoke.push(s); } }
  const update = (t) => {
    flames.forEach(m => { const u = m.userData, lick = 0.75 + 0.35 * Math.abs(noise(t * u.sp + u.ph, 1)) + 0.15 * Math.sin(t * u.sp * 1.7 + u.ph); m.scale.set(u.s * (0.9 + 0.15 * noise(t * 7 + u.ph, 2)), u.s * lick, u.s * (0.9 + 0.15 * noise(t * 6 + u.ph, 4)));
      m.position.set(u.x + 0.06 * size * noise(t * 3 + u.ph, 5), 0.1 * size, u.z + 0.06 * size * noise(t * 3 + u.ph, 6)); m.rotation.set(0.18 * noise(t * 2.5 + u.ph, 7), 0, 0.18 * noise(t * 2.2 + u.ph, 8)); });
    const fl = 0.82 + 0.12 * noise(t * 11, 3) + 0.08 * noise(t * 27, 9); if (L) L.intensity = (o.intensity ?? 9) * size * practical() * fl; halo.material.opacity = 0.3 * fl; core.material.opacity = 0.85 * fl;
    smoke.forEach(s => { const k = ((t * 0.35 + s.userData.ph) % 1 + 1) % 1; s.position.set(0.25 * size * noise(t * 0.5 + s.userData.ph * 9, 2), (0.9 + k * 2.6) * size, 0.15 * size * noise(t * 0.4 + s.userData.ph * 7, 3)); s.scale.setScalar((0.4 + k * 1.4) * size); s.material.opacity = 0.22 * Math.sin(Math.PI * k); });
    if (emb) emb.update(t);
  };
  update(0); st.onTick(update); return { obj: g, light: L, update };
}
// blade(o) → a hand-held energy blade: a ribbed metal hilt, a white-hot core inside a coloured glow, and a light along the blade that
// lights the hand, the face and the walls as it moves. Hold it: hero.hold(b, 'R', { rot: [Math.PI / 2, 0, 0] }), then b.update(t, { on, hum }).
// on 0..1 extends the blade (ignite / retract). o: { color, len, width, light, intensity, dist }
export function blade(o = {}) {
  const c = color(o.color || '#ffd86a'), len = o.len ?? 1.0, w = o.width ?? 0.022, g = group(); g.userData.dynamic = true;
  const metal = mat('#9a9aa8', { metal: 0.8, rough: 0.3 }), dark = mat('#2a2a34', { rough: 0.6 });
  g.add(cyl(0.022, 0.024, 0.24, metal, 0, 0, 0, 14)); for (let i = 0; i < 4; i++) g.add(cyl(0.026, 0.026, 0.018, dark, 0, -0.08 + i * 0.045, 0, 14)); g.add(cyl(0.03, 0.026, 0.035, metal, 0, 0.135, 0, 14));
  const bl = group(); bl.position.y = 0.15; g.add(bl);
  const core = new THREE.Mesh(new THREE.CapsuleGeometry(w, 1, 4, 10), glowMat('#ffffff', 2.4)); core.geometry.translate(0, 0.5, 0); bl.add(core);
  const shell = new THREE.Mesh(new THREE.CapsuleGeometry(w * 2.4, 1, 4, 12), new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(2.2), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); shell.geometry.translate(0, 0.5, 0); bl.add(shell);
  const outer = new THREE.Mesh(new THREE.CapsuleGeometry(w * 6, 1, 4, 12), new THREE.MeshBasicMaterial({ color: c.clone(), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); outer.geometry.translate(0, 0.5, 0); bl.add(outer);
  const L = o.light === false ? null : new THREE.PointLight(c, (o.intensity ?? 8) * practical(), o.dist ?? 5, 1.5); if (L) bl.add(L);
  g.update = (t, s = {}) => { const on = clamp(s.on ?? 1), hum = 1 + (s.hum ?? 1) * (0.05 * Math.sin(t * 47) + 0.04 * noise(t * 13, 2)); bl.visible = on > 0.01; bl.scale.set(hum, Math.max(0.001, on * len), hum);
    if (L) { L.position.y = 0.5; L.intensity = (o.intensity ?? 8) * practical() * on * hum; } outer.material.opacity = 0.16 * hum; };
  g.update(0); g.light = L; return g;
}
// torch(o) → a flashlight: body, glowing lens and a real spotlight with a soft visible beam along its +y axis. Hold it like the blade
// (hero.hold(f, 'R', { rot: [Math.PI / 2, 0, 0] }) points it forward). f.update(t, { on }) switches it. o: { color, angle, dist, intensity, beam, shadow }
export function torch(o = {}) {
  const c = color(o.color || '#fff0d0'), g = group(); g.userData.dynamic = true;
  g.add(cyl(0.024, 0.024, 0.16, mat('#2a2a34', { rough: 0.5 }), 0, 0, 0, 12), cyl(0.04, 0.026, 0.06, mat('#3a3a46', { rough: 0.4, metal: 0.5 }), 0, 0.105, 0, 14));
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.036, 16), glowMat(c, 2.2)); lens.rotation.x = -Math.PI / 2; lens.position.y = 0.137; g.add(lens);
  const S_ = new THREE.SpotLight(c, (o.intensity ?? 40) * practical(), o.dist ?? 14, o.angle ?? 0.38, o.penumbra ?? 0.55, 1.3); S_.position.y = 0.14; S_.target.position.set(0, 5, 0); S_.castShadow = !!o.shadow; if (o.shadow) { S_.shadow.mapSize.set(512, 512); S_.shadow.bias = -0.002; } g.add(S_, S_.target);
  const beam = o.beam === false ? null : lightCone(Math.tan(o.angle ?? 0.38) * 4, 4, c, o.beamOpacity ?? 0.08); if (beam) { beam.rotation.x = Math.PI; beam.position.y = 0.14; g.add(beam); }
  const halo = glow(c, 0.2, 0.6); halo.position.y = 0.15; g.add(halo);
  g.update = (t, s = {}) => { const on = clamp(s.on ?? 1), k = on * (1 + 0.03 * noise(t * 17, 4)); S_.intensity = (o.intensity ?? 40) * practical() * k; if (beam) beam.material.opacity = (o.beamOpacity ?? 0.08) * on; halo.material.opacity = 0.6 * on; lens.visible = on > 0.05; };
  g.update(0); g.light = S_; return g;
}
