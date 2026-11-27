// engine/fx3d.js — 3D effects (T.FX3.*). Every effect is a pure function of time: build it in init(), then call
// fx.update(t) from draw() (or register it once with st.onTick(fx.update) and call st.tick(t)). Never accumulate state.
//
//   const dust = T.FX3.dust(st, { area: [-4, 4, 0, 3, -3, 3] });            st.onTick(dust.update);
//   const lines = T.FX3.speedLines(st, { axis: 'x', dir: -1, around: [0, 1.2, 0] });
//   const echo = T.FX3.ghosts(st, HERO, 5, { color: '#7fd8ff' });           echo.update(t, tt => ({ pos, yaw, pose }))
import * as THREE from 'three';
import { S, rng, clamp, lerp, ease, prog, noise } from './core.js';
import { dotTex, glow, glowMat, mat, color, character, canvasTex, cached, cyl, group, lightCone, renderer } from './kit3d.js';

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

// ================================================================ things that break, burn and splash (0.2.7)
// Emitters are pure functions of t: particle e is born at t0 + e / rate with its own seeded randomness, so every worker agrees.
const rnd = (seed, e) => rng(seed * 7919 + e * 104729 + 13);
// slice(st, obj, { t0, dur, normal, point, gap, tilt, drop, cap, capColor, hot }) → cuts a prop in two along a plane (default: a vertical
// cut across x through its centre). Before t0 the halves sit together and look whole; after it they slide apart, tip over a little
// and the cut faces glow white-hot, then cool to capColor (the inside: fruit, wood, metal). Returns { a, b, update(t) } (also ticks itself).
export function slice(st, obj, o = {}) {
  const R = renderer(); if (R) R.localClippingEnabled = true;
  obj.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3());
  const p = o.point ? new THREE.Vector3(...o.point) : box.getCenter(new THREE.Vector3()), n = new THREE.Vector3(...(o.normal || [1, 0, 0])).normalize();
  const base = [new THREE.Plane().setFromNormalAndCoplanarPoint(n, p), new THREE.Plane().setFromNormalAndCoplanarPoint(n.clone().negate(), p)];
  const planes = base.map(b => b.clone()); const halves = [];
  for (let k = 0; k < 2; k++) {
    const H = new THREE.Group(); H.matrixAutoUpdate = false; H.userData.dynamic = true; const c = obj.clone(true); obj.matrixWorld.decompose(c.position, c.quaternion, c.scale); H.add(c);
    c.traverse(m => { if (!m.isMesh) return; m.material = [].concat(m.material).map(mt => { const mm = mt.clone(); mm.clippingPlanes = [planes[k]]; mm.clipShadows = true; mm.side = THREE.DoubleSide; return mm; }); if (m.material.length === 1) m.material = m.material[0]; });
    // the cut face: a disc a little inside the outline, on the plane, facing out of this half
    if (o.cap !== false) { const perp = [size.x, size.y, size.z].sort((a, b) => a - b), rr = (o.capR ?? 0.46 * Math.min(perp[1], perp[2] || perp[1])); const cap = new THREE.Mesh(new THREE.CircleGeometry(rr, 32), new THREE.MeshBasicMaterial({ color: color(o.hot || '#fff0c0'), toneMapped: false, side: THREE.DoubleSide }));
      cap.position.copy(p); cap.lookAt(p.clone().add(k ? n : n.clone().negate())); cap.position.addScaledVector(k ? n : n.clone().negate(), -0.002); H.add(cap); H.cap = cap; }
    st.scene.add(H); halves.push(H);
  }
  obj.parent?.remove(obj);   // the original goes; static merge must not bring it back
  const axis = new THREE.Vector3(0, 1, 0).cross(n).normalize(), hot = color(o.hot || '#fff0c0'), glowC = color(o.glow || '#ff8a2a'), cool = color(o.capColor || '#8a4a3a'), tmp = new THREE.Color();
  const M = new THREE.Matrix4(), T1 = new THREE.Matrix4(), Rm = new THREE.Matrix4(), T2 = new THREE.Matrix4(), T3 = new THREE.Matrix4();
  const update = (t) => { const t0 = o.t0 ?? 0, k = ease.out(prog(t, t0, t0 + (o.dur ?? 0.6))), dropK = ease.in(prog(t, t0 + 0.1, t0 + (o.dur ?? 0.6) + 0.3));
    halves.forEach((H, i) => { const s = i ? -1 : 1, off = n.clone().multiplyScalar(s * k * (o.gap ?? 0.12) * Math.max(size.x, size.z));
      T1.makeTranslation(-p.x, -p.y, -p.z); Rm.makeRotationAxis(axis.lengthSq() > 0 ? axis : new THREE.Vector3(0, 0, 1), s * k * (o.tilt ?? 0.22)); T2.makeTranslation(p.x + off.x, p.y + off.y - dropK * (o.drop ?? 0), p.z + off.z);
      M.copy(T2).multiply(Rm).multiply(T1); H.matrix.copy(M); H.matrixWorldNeedsUpdate = true; planes[i].copy(base[i]).applyMatrix4(M);
      if (H.cap) { const heat = 1 - prog(t, t0 + 0.4, t0 + (o.cool ?? 3)); tmp.copy(cool).lerp(glowC, clamp(heat * 1.4)).lerp(hot, clamp(heat * 2 - 1)); H.cap.material.color.copy(tmp).multiplyScalar(1 + heat * 1.5); H.cap.visible = t >= t0; } }); };
  update(0); st.onTick(update); return { a: halves[0], b: halves[1], update };
}
// smoke(st, { pos, t0, dur, rate, life, size, grow, rise, spread, wind, color, opacity, seed }) — soft puffs that rise, swell and fade
// (burnt edges, a campfire, an engine, a crash). Ticks itself.
export function smoke(st, o = {}) {
  const { pos = [0, 0, 0], t0 = 0, dur = 999, rate = 6, life = 2.6, size = 0.5, grow = 2.2, rise = 0.7, spread = 0.25, wind = [0.15, 0, 0], opacity = 0.35, seed = 3 } = o;
  const N = Math.ceil(rate * life) + 1, g = group(); g.userData.dynamic = true; const L = [];
  for (let i = 0; i < N; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: color(o.color || '#8a8494'), transparent: true, opacity: 0, depthWrite: false })); g.add(s); L.push(s); }
  st.add(g);
  const update = (t) => { const e0 = Math.floor((t - t0) * rate); L.forEach((s, j) => { const e = e0 - j, born = t0 + e / rate, age = t - born; if (e < 0 || born > t0 + dur || age < 0 || age > life) { s.visible = false; return; }
    const r = rnd(seed, e), k = age / life, dx = (r() - 0.5) * 2, dz = (r() - 0.5) * 2; s.visible = true;
    s.position.set(pos[0] + dx * spread * (0.3 + age) + wind[0] * age * age, pos[1] + rise * age, pos[2] + dz * spread * (0.3 + age) + wind[2] * age * age);
    s.scale.setScalar(size * (0.5 + grow * Math.sqrt(k)) * (0.8 + r() * 0.4)); s.material.opacity = opacity * Math.min(1, age / 0.25) * (1 - k) ** 1.4; s.material.rotation = r() * 6 + age * 0.3; }); };
  update(0); st.onTick(update); return { obj: g, update };
}
// sparks(st, { pos, t0, dur, rate, dir, spread, speed, gravity, life, color, seed }) — bright streaks spraying from a point (a blade biting
// metal, a grinder, a short circuit). Additive, so they bloom. Ticks itself.
export function sparks(st, o = {}) {
  const { pos = [0, 1, 0], t0 = 0, dur = 0.6, rate = 90, dir = [0, 1, 0], spread = 0.9, speed = [2.5, 6], gravity = 9, life = 0.55, seed = 5 } = o;
  const N = Math.ceil(rate * life) + 1, geo = new THREE.BufferGeometry(), P = new Float32Array(N * 6), C = new Float32Array(N * 6); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.BufferAttribute(C, 3));
  const Lm = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); Lm.frustumCulled = false; Lm.userData.dynamic = true; st.add(Lm);
  const c0 = color(o.color || '#ffd27a').multiplyScalar(2.2), d = new THREE.Vector3(...dir).normalize();
  const at = (v, age) => [pos[0] + v[0] * age, pos[1] + v[1] * age - 0.5 * gravity * age * age, pos[2] + v[2] * age];
  const update = (t) => { const e0 = Math.floor((t - t0) * rate); for (let j = 0; j < N; j++) { const e = e0 - j, born = t0 + e / rate, age = t - born;
    if (e < 0 || born > t0 + dur || age < 0 || age > life) { P.fill(0, j * 6, j * 6 + 6); C.fill(0, j * 6, j * 6 + 6); continue; }
    const r = rnd(seed, e), sp = lerp(speed[0], speed[1], r()), v = [d.x + (r() - 0.5) * 2 * spread, d.y + (r() - 0.5) * 2 * spread, d.z + (r() - 0.5) * 2 * spread], L = Math.hypot(...v); for (let q = 0; q < 3; q++) v[q] *= sp / L;
    const a = at(v, age), b = at(v, Math.max(0, age - 0.035)), f = (1 - age / life); P.set([...a, ...b], j * 6); C.set([c0.r * f, c0.g * f, c0.b * f, c0.r * f * 0.3, c0.g * f * 0.2, c0.b * f * 0.1], j * 6); }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; };
  update(0); st.onTick(update); return { obj: Lm, update };
}
// debris(st, { pos, t0, n, size, colors, speed, up, gravity, floorY, seed }) — chunks that burst out, tumble and settle on the floor
// (a wall breaking, a rock split, a car crunched). Ticks itself.
export function debris(st, o = {}) {
  const { pos = [0, 1, 0], t0 = 0, n = 24, size = [0.06, 0.18], speed = [1.5, 4.5], up = 3, gravity = 9.8, floorY = 0, seed = 8 } = o, cols = o.colors || ['#8a8494', '#6a6478', '#a8a0b0'];
  const g = group(); g.userData.dynamic = true; const geo = new THREE.DodecahedronGeometry(1, 0), parts = [];
  for (let i = 0; i < n; i++) { const r = rnd(seed, i), m = new THREE.Mesh(geo, mat(cols[i % cols.length], { rough: 0.9, flat: true })); m.castShadow = true; const s = lerp(size[0], size[1], r()), a = r() * Math.PI * 2, sp = lerp(speed[0], speed[1], r());
    m.scale.set(s, s * (0.6 + r() * 0.5), s * (0.8 + r() * 0.4)); m.userData = { v: [Math.cos(a) * sp, up * (0.5 + r()), Math.sin(a) * sp], s, spin: [r() * 9, r() * 9] }; g.add(m); parts.push(m); }
  st.add(g);
  const update = (t) => { const tt = t - t0; parts.forEach(m => { const { v, s, spin } = m.userData; if (tt < 0) { m.visible = false; return; } m.visible = true;
    const tHit = (v[1] + Math.sqrt(v[1] * v[1] + 2 * gravity * Math.max(0, pos[1] - floorY - s * 0.5))) / gravity, ta = Math.min(tt, tHit), slide = Math.max(0, tt - tHit), fr = 1 - Math.exp(-slide * 5);
    m.position.set(pos[0] + v[0] * (ta + fr * 0.12), Math.max(floorY + s * 0.5, pos[1] + v[1] * ta - 0.5 * gravity * ta * ta), pos[2] + v[2] * (ta + fr * 0.12)); m.rotation.set(spin[0] * (ta + fr * 0.1), spin[1] * (ta + fr * 0.1), 0); }); };
  update(0); st.onTick(update); return { obj: g, update };
}
// splash(st, { pos, t0, size, color, rings, seed }) — something hits the water: a crown of droplets and rings spreading on the surface.
// pos is on the water surface. Ticks itself.
export function splash(st, o = {}) {
  const { pos = [0, 0, 0], t0 = 0, size = 1, seed = 6 } = o, n = o.n ?? 40, c = color(o.color || '#e8faff'), g = group(); g.userData.dynamic = true;
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 }), n); drops.frustumCulled = false; g.add(drops);
  const V = Array.from({ length: n }, (_, i) => { const r = rnd(seed, i), a = r() * Math.PI * 2, sp = (0.6 + r() * 1.6) * size; return [Math.cos(a) * sp, (2.5 + r() * 3) * Math.sqrt(size), Math.sin(a) * sp, (0.03 + r() * 0.05) * Math.sqrt(size)]; });
  const rings = Array.from({ length: o.rings ?? 3 }, () => { const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), new THREE.MeshBasicMaterial({ color: c, transparent: true, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(pos[0], pos[1] + 0.02, pos[2]); g.add(m); return m; });
  st.add(g); const q = new THREE.Object3D();
  const update = (t) => { const tt = t - t0; g.visible = tt >= 0 && tt < 3; if (!g.visible) return;
    V.forEach(([vx, vy, vz, s], i) => { const y = vy * tt - 4.9 * tt * tt; q.position.set(pos[0] + vx * tt, pos[1] + Math.max(-0.2, y), pos[2] + vz * tt); q.scale.setScalar(y < -0.05 ? 0.0001 : s); q.updateMatrix(); drops.setMatrixAt(i, q.matrix); }); drops.instanceMatrix.needsUpdate = true;
    rings.forEach((m, i) => { const k = clamp((tt - i * 0.18) / 1.6); m.visible = k > 0 && k < 1; m.scale.setScalar(0.2 + k * 1.8 * size * (1 + i * 0.3)); m.material.opacity = 0.7 * (1 - k); }); };
  update(0); st.onTick(update); return { obj: g, update };
}

// ---------------------------------------------------------------- 1.0 smear arcs: the cartoon "smear frame" of a fast swing
// swoosh(st, { pos: [x,y,z] centre of the swing, from, to (angles, radians, in the plane), axis: [x,y,z] plane normal, r, w (band width),
//   t0, dur, color, opacity }) → { obj, update(t) } (ticks itself). A crescent band sweeps from `from` to `to` and fades: punches,
// kicks, a bat swing, a fall (draw it along the body's path). Pair it with shot "mblur": "action".
export function swoosh(st, o = {}) {
  const r = o.r ?? 0.55, w = o.w ?? 0.16, t0 = o.t0 ?? 0, dur = o.dur ?? 0.18, a0 = o.from ?? -1.2, a1 = o.to ?? 0.4, seg = 40;
  const geo = new THREE.BufferGeometry(), pos = new Float32Array((seg + 1) * 2 * 3), uv = new Float32Array((seg + 1) * 2 * 2), idx = [];
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const tex = cachedSwoosh(); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, color: color(o.color || '#ffffff'), transparent: true, opacity: o.opacity ?? 0.75, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  m.frustumCulled = false; m.renderOrder = 5; m.userData.dynamic = true; m.position.set(...(o.pos || [0, 1, 0]));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...(o.axis || [0, 0, 1])).normalize()); if (o.roll) m.rotateZ(o.roll); st.add(m);
  const update = (t) => { const k = (t - t0) / dur; if (k < 0 || k > 1.6) { m.visible = false; return; } m.visible = true;
    const head = a0 + (a1 - a0) * Math.min(1, k), tail = a0 + (a1 - a0) * Math.max(0, Math.min(1, k - 0.55)) * (k > 1 ? 1 + (k - 1) * 1.6 : 1), fade = k > 1 ? 1 - (k - 1) / 0.6 : 1;
    for (let i = 0; i <= seg; i++) { const u = i / seg, a = tail + (head - tail) * u, ww = w * Math.sin(Math.PI * Math.min(1, u * 1.15)) * fade;
      pos.set([Math.cos(a) * (r + ww / 2), Math.sin(a) * (r + ww / 2), 0, Math.cos(a) * (r - ww / 2), Math.sin(a) * (r - ww / 2), 0], i * 6); uv.set([u, 1, u, 0], i * 4); }
    geo.attributes.position.needsUpdate = true; geo.attributes.uv.needsUpdate = true; m.material.opacity = (o.opacity ?? 0.75) * Math.max(0, fade); };
  update(0); st.onTick(update); return { obj: m, update };
}
let _swooshTex = null;
function cachedSwoosh() { if (_swooshTex) return _swooshTex; const c = document.createElement('canvas'); c.width = 256; c.height = 32; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.75, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 32);
  const v = g.createLinearGradient(0, 0, 0, 32); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.globalAlpha = 0.6; g.fillRect(0, 0, 256, 32);
  _swooshTex = new THREE.CanvasTexture(c); _swooshTex.colorSpace = THREE.SRGBColorSpace; return _swooshTex; }
