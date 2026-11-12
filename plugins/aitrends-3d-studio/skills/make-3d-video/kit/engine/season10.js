// engine/season10.js — 1.0.1 school weather, seasons and time of day (exposed as T.W.* through world3d.js). All tick themselves.
//
//   T.stage({ ...T.W.schoolTime('afterSchool'), fov: 36 })   // morning (sunrise) · noon (day) · afterSchool (golden) · evening (dusk) · night · storm · snow
//   T.W.fallDay(st, { area })            // maple leaves falling (red/orange/gold) + leaf piles on the ground (homecoming season)
//   T.W.snowDay(st, { area, groundY })   // snow caps on everything + falling snow (call after the set)
//   T.W.breath(st, ch, { every })        // cold breath puffing from a character's mouth (snow day, a winter game night)
//   T.W.windowRain(st, { pos, w, h, yaw }) // drops sliding down a window pane (stand it on a window of the set, inside)
//   T.W.fogGlass(st, { pos, w, h, yaw, draw })  // a misted-up window; draw: 'heart' | 'smile' | text written by a finger
//   T.W.powerCut(st, { t0, dim, room })  // every light and lit panel dies at t0 (storm blackout), the room falls to `room` (0.22) of its light; flashes still light it
//   T.W.alarmLight(st, { pos, t0 })      // a rotating red emergency beacon (tornado drill, fire alarm); pair with a siren SFX
//   T.W.capToss(st, { at, n, t0 })       // graduation caps thrown up and tumbling down
//   T.W.confetti(st, { area, t0, n })    // confetti burst and flutter (win, prom king, graduation)
//   T.W.haze(st, { area, color })        // soft drifting haze in the air (stadium lights at night, a foggy morning at the gate)
//   T.W.blowingPaper(st, { area, n, wind }) // homework sheets tumbling across the ground in a gust
import * as THREE from 'three';
import { rng, clamp, lerp, noise, ease } from './core.js';
import { LEGACY, canvasTex, cached, group, color, glow, glowMat, sphere, cyl, box, mat, dotTex, spot } from './kit3d.js';
import { leaves, snowCover } from './weather10.js';
import { rain } from './fx3d.js';

const PI = Math.PI, R2 = PI / 2;

// ================================================================ time of day for a school story
const TIMES = { morning: { mood: 'sunrise' }, dawn: { mood: 'sunrise' }, noon: { mood: 'day' }, day: { mood: 'day' }, afterSchool: { mood: 'golden' }, sunset: { mood: 'golden' },
  evening: { mood: 'dusk' }, night: { mood: 'night' }, storm: { mood: 'storm' }, snow: { mood: 'snow' }, indoor: { mood: 'interiorWarm' }, fluorescent: { mood: 'interiorCool' } };
export function schoolTime(name = 'day') { return { ...(TIMES[name] || TIMES.day) }; }

// ================================================================ seasons
export const MAPLE = ['#d8402a', '#e86a2a', '#f2a02a', '#c8282a', '#f2c23a', '#a8382a'];
export function fallDay(st, o = {}) {
  const area = o.area || [-8, 8, 0, 6, -4, 4];
  const lf = leaves(st, { area, n: o.n ?? 90, ground: o.ground ?? 220, colors: MAPLE, wind: o.wind ?? 0.3, y: o.y ?? 0, seed: o.seed });
  // a few raked piles
  const r = rng(o.seed || 6), g = group(); for (let i = 0; i < (o.piles ?? 2); i++) { const x = lerp(area[0], area[1], r()), z = lerp(area[4], area[5], r());
    for (let k = 0; k < 40; k++) { const a = r() * PI * 2, rr = r() * 0.6, s = sphere(0.07, mat(MAPLE[k % MAPLE.length], { keepSat: true, rough: 0.8 }), x + Math.cos(a) * rr, (o.y ?? 0) + 0.05 + (0.6 - rr) * 0.35 * r(), z + Math.sin(a) * rr * 0.8, 6, 4); s.scale.set(1.4, 0.4, 1.2); g.add(s); } }
  st.add(g); return lf;
}
export function snowDay(st, o = {}) {
  const cover = snowCover(st, { amount: o.amount ?? 1, groundY: o.groundY ?? 0 });
  const fall = rain(st, { snow: true, n: o.n ?? 1000, area: o.area || [-8, 8, 0, 7, -6, 5] }); if (fall?.update) st.onTick(fall.update);
  return { cover, fall };
}
// cold breath: a puff of soft white sprites leaves the mouth every `every` seconds and drifts up/forward
export function breath(st, ch, o = {}) {
  if (LEGACY) return null; const n = 10, every = o.every ?? 1.6, mats = [], sprites = [];
  for (let i = 0; i < n; i++) { const m = new THREE.SpriteMaterial({ map: dotTex(), color: color(o.color || '#f4f8ff'), transparent: true, opacity: 0, depthWrite: false }); const s = new THREE.Sprite(m); s.userData.dynamic = true; st.add(s); sprites.push(s); mats.push(m); }
  const fwd = new THREE.Vector3(); const update = (t) => { const h = ch.headWorld(); fwd.set(Math.sin(ch.rotation.y), 0, Math.cos(ch.rotation.y));
    sprites.forEach((s, i) => { const ph = ((t + (o.offset ?? 0)) / every) % 1, k = ph * 2.2 - i * 0.05; const on = k > 0 && k < 1;
      s.position.copy(h).addScaledVector(fwd, 0.3 + k * 0.5).add(new THREE.Vector3(noise(i + t, 3) * 0.06, -0.1 + k * 0.25, 0)); s.scale.setScalar(0.08 + k * 0.35); mats[i].opacity = on ? 0.32 * Math.sin(PI * k) : 0; }); };
  update(0); st.onTick(update); return { update };
}
// rain sliding down a pane: a scrolling canvas of drops and streaks, additive, drawn just inside the glass
const rainGlassTex = () => cached('rainGlass', () => canvasTex(256, 512, (g, W, H) => { g.clearRect(0, 0, W, H); const r = rng(21);
  for (let i = 0; i < 140; i++) { const x = r() * W, y = r() * H, rr = 1.5 + r() * 3.5; g.fillStyle = `rgba(230,240,255,${0.35 + r() * 0.4})`; g.beginPath(); g.ellipse(x, y, rr * 0.8, rr, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x - rr * 0.3, y - rr * 0.5, 1.2, 1.2); }
  for (let i = 0; i < 22; i++) { const x = r() * W, y = r() * H, L = 40 + r() * 140; const gr = g.createLinearGradient(0, y, 0, y + L); gr.addColorStop(0, 'rgba(220,235,255,0)'); gr.addColorStop(1, 'rgba(230,240,255,.55)'); g.fillStyle = gr; g.fillRect(x, y, 2.2, L); } }));
export function windowRain(st, o = {}) {
  const w = o.w || 1.6, h = o.h || 1.5, tex = rainGlassTex().clone(); tex.needsUpdate = true; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(w / 1.0, h / 2.0);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: o.opacity ?? 0.85, depthWrite: false, blending: THREE.AdditiveBlending, color: color(o.tint || '#c8d8f0') }));
  m.position.set(...(o.pos || [0, 1.8, 0])); m.rotation.y = o.yaw ?? 0; m.userData.dynamic = true; st.add(m);
  const tex2 = tex.clone(); tex2.needsUpdate = true; tex2.repeat.set(w / 0.7, h / 1.4); const m2 = m.clone(); m2.material = m.material.clone(); m2.material.map = tex2; m2.position.add(new THREE.Vector3(Math.sin(m.rotation.y), 0, Math.cos(m.rotation.y)).multiplyScalar(0.004)); st.add(m2);
  const update = (t) => { tex.offset.set(0, t * 0.12); tex2.offset.set(0.3, t * 0.33); }; update(0); st.onTick(update); return { obj: m, update };
}
// misted glass with an optional finger drawing (cleared lines show the outside through the fog)
export function fogGlass(st, o = {}) {
  const w = o.w || 1.6, h = o.h || 1.4, tex = canvasTex(512, Math.round(512 * h / w), (g, W, H) => { const r = rng(8); g.fillStyle = 'rgba(236,242,248,.72)'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.15})`; g.beginPath(); g.arc(r() * W, r() * H, 10 + r() * 40, 0, 7); g.fill(); }
    if (o.draw) { g.globalCompositeOperation = 'destination-out'; g.strokeStyle = 'rgba(0,0,0,.9)'; g.lineWidth = 14; g.lineCap = 'round'; const cx = W / 2, cy = H / 2;
      if (o.draw === 'heart') { g.beginPath(); g.moveTo(cx, cy + 70); g.bezierCurveTo(cx - 140, cy - 20, cx - 60, cy - 110, cx, cy - 40); g.bezierCurveTo(cx + 60, cy - 110, cx + 140, cy - 20, cx, cy + 70); g.stroke(); }
      else if (o.draw === 'smile') { g.beginPath(); g.arc(cx, cy, 90, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy + 10, 50, 0.2, PI - 0.2); g.stroke(); g.fillStyle = 'black'; g.beginPath(); g.arc(cx - 35, cy - 25, 10, 0, 7); g.arc(cx + 35, cy - 25, 10, 0, 7); g.fill(); }
      else { g.font = '800 90px "Nunito"'; g.textAlign = 'center'; g.lineWidth = 10; g.strokeText(String(o.draw), cx, cy + 30); } } });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9, depthWrite: false }));
  m.position.set(...(o.pos || [0, 1.8, 0])); m.rotation.y = o.yaw ?? 0; st.add(m); return m;
}
// blackout: lights and self-lit panels die at t0 (a short stutter first); lightning (T.W.lightning) still flashes the room
export function powerCut(st, o = {}) {
  const t0 = o.t0 ?? 1, dim = o.dim ?? 0.06, keep = new Set(o.keep || []); const ls = [], glows = [];
  st.scene.traverse(x => { if (keep.has(x)) return; if (x.isPointLight || x.isSpotLight || x.isRectAreaLight) ls.push([x, x.intensity]);
    if (x.isMesh && x.material?.isMeshBasicMaterial && x.material.toneMapped === false && !x.userData.dynamic) glows.push([x.material, x.material.color.clone()]); });
  const hemi0 = st.hemi.intensity, sun0 = st.sun?.intensity ?? 0, env0 = st.scene.environmentIntensity ?? 1, amb = []; st.scene.traverse(x => { if (x.isAmbientLight || (x.isDirectionalLight && x !== st.sun)) amb.push([x, x.intensity]); });
  const update = (t) => { const d = t - t0; let k = 1; if (d > 0) k = d < 0.35 ? (noise(t * 40, 7) > 0 ? 1 : 0.1) : dim;
    ls.forEach(([l, i0]) => { l.intensity = i0 * k; }); glows.forEach(([m, c0]) => m.color.copy(c0).multiplyScalar(Math.max(k, 0.04)));
    const dk = k < 1 ? (o.room ?? 0.22) + (1 - (o.room ?? 0.22)) * k : 1; st.hemi.intensity = hemi0 * dk; if (st.sun) st.sun.intensity = sun0 * (k < 1 ? dk * 0.6 : 1); st.scene.environmentIntensity = env0 * dk; amb.forEach(([l, i0]) => { l.intensity = i0 * dk; }); };
  update(0); st.onTick(update); return { update };
}
// rotating red beacon: a glowing dome + a spot that sweeps round the room
export function alarmLight(st, o = {}) {
  const c = o.color || '#ff2a1a', p = o.pos || [0, 2.6, 0], t0 = o.t0 ?? 0;
  const g = group(cyl(0.09, 0.1, 0.04, mat('#2a2a30'), 0, 0, 0, 16), sphere(0.08, glowMat(c, 1.8, { transparent: true, opacity: 0.9 }), 0, 0.05, 0, 14, 10)); g.position.set(...p); g.userData.dynamic = true; st.add(g);
  const halo = glow(c, 1.2, 0); halo.position.set(p[0], p[1] + 0.05, p[2]); st.add(halo);
  const S1 = new THREE.SpotLight(color(c), 0, 14, 0.45, 0.5, 1.2); S1.position.set(p[0], p[1] + 0.05, p[2]); st.add(S1, S1.target);
  const update = (t) => { const on = t >= t0, a = (t - t0) * (o.speed ?? 6); S1.intensity = on ? (o.power ?? 40) : 0; S1.target.position.set(p[0] + Math.cos(a) * 4, p[1] - 1.5, p[2] + Math.sin(a) * 4); S1.target.updateMatrixWorld();
    halo.material.opacity = on ? 0.5 + 0.4 * Math.max(0, Math.cos(a)) : 0; g.children[1].visible = on; };
  update(0); st.onTick(update); return { update, light: S1 };
}
// graduation caps: thrown from `at` (crowd centre) at t0, tumbling up and back down to the ground
export function capToss(st, o = {}) {
  const n = o.n ?? 24, [cx, cz] = o.at || [0, 0], t0 = o.t0 ?? 0.5, r = rng(o.seed || 13), g = group(), caps = [];
  const cm = mat(o.color || '#1a1a2a', { rough: 0.5 }), tm = mat(o.tassel || '#f2b632', { keepSat: true });
  for (let i = 0; i < n; i++) { const cap = group(box(0.32, 0.015, 0.32, cm, 0, 0, 0), cyl(0.11, 0.11, 0.07, cm, 0, -0.04, 0, 12), sphere(0.012, tm, 0, 0.012, 0, 6, 4), cyl(0.003, 0.003, 0.12, tm, 0.13, -0.05, 0.13, 4));
    caps.push({ cap, x: cx + (r() - 0.5) * (o.spread ?? 4), z: cz + (r() - 0.5) * (o.spread ?? 4) * 0.6, vx: (r() - 0.5) * 1.2, vz: (r() - 0.5) * 1.2, vy: 7 + r() * 3, d: r() * 0.25, spin: [r() * 9 - 4.5, r() * 12 - 6, r() * 9 - 4.5] }); g.add(cap); }
  g.userData.dynamic = true; st.add(g); const y0 = o.y ?? 1.9;
  const update = (t) => { for (const c of caps) { const k = Math.max(0, t - t0 - c.d); let y = y0 + c.vy * k - 4.9 * k * k; const land = y < 0.02; if (land) y = 0.02;
      c.cap.position.set(c.x + c.vx * Math.min(k, 3), y, c.z + c.vz * Math.min(k, 3)); c.cap.visible = t >= t0 + c.d || o.holding; if (!land) c.cap.rotation.set(c.spin[0] * k, c.spin[1] * k, c.spin[2] * k); else c.cap.rotation.set(0, c.spin[1], 0); } };
  update(0); st.onTick(update); return { obj: g, update };
}
// confetti: a burst from `from` at t0, then slow fluttering fall over `area`
export function confetti(st, o = {}) {
  const n = o.n ?? 400, t0 = o.t0 ?? 0, [x0, x1, y0, y1, z0, z1] = o.area || [-4, 4, 0, 4, -3, 3], r = rng(o.seed || 19);
  const cols = (o.colors || ['#f2b632', '#e83a6a', '#3ad0ff', '#7ae05a', '#ffffff', '#a04aff']).map(c => color(c));
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.05, 0.08), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.4, metalness: 0.3 }), n); im.userData.dynamic = true; im.frustumCulled = false;
  const base = []; for (let i = 0; i < n; i++) { base.push([lerp(x0, x1, r()), lerp(z0, z1, r()), r() * 6, 0.5 + r() * 0.5, r()]); im.setColorAt(i, cols[i % cols.length]); }
  const dm = new THREE.Object3D(), H = y1 - y0;
  const update = (t) => { const k = t - t0; base.forEach(([x, z, sd, sp, d], i) => { if (k < 0) { dm.position.set(0, -50, 0); } else { const up = Math.min(1, k / 0.35), y = y0 + H * ease.out(up) - Math.max(0, k - 0.35) * 0.55 * sp;
      dm.position.set(lerp((x0 + x1) / 2, x, ease.out(up)) + Math.sin(k * 3 + sd) * 0.15, Math.max(y0 + 0.01, y), lerp((z0 + z1) / 2, z, ease.out(up)) + Math.cos(k * 2.5 + sd) * 0.12); dm.rotation.set(k * 6 + sd, k * 4 + sd * 2, k * 5); }
      dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); }); im.instanceMatrix.needsUpdate = true; };
  update(0); st.add(im); st.onTick(update); return { obj: im, update };
}
// haze: large soft sprites drifting slowly (stadium lights, morning fog at the gate, a smoky gym)
export function haze(st, o = {}) {
  if (LEGACY) return null; const [x0, x1, y0, y1, z0, z1] = o.area || [-15, 15, 0.5, 6, -10, 10], n = o.n ?? 40, r = rng(o.seed || 23), sp = [];
  for (let i = 0; i < n; i++) { const m = new THREE.SpriteMaterial({ map: dotTex(), color: color(o.color || '#dfe8ff'), transparent: true, opacity: (o.opacity ?? 0.06) * (0.6 + r() * 0.8), depthWrite: false, fog: true }); const s = new THREE.Sprite(m); s.userData.base = [lerp(x0, x1, r()), lerp(y0, y1, r()), lerp(z0, z1, r()), r() * 9]; s.scale.setScalar(o.size ?? (4 + r() * 5)); s.userData.dynamic = true; st.add(s); sp.push(s); }
  const update = (t) => sp.forEach(s => { const [x, y, z, sd] = s.userData.base; s.position.set(x + Math.sin(t * 0.1 + sd) * 1.2 + t * (o.drift ?? 0.15), y + Math.sin(t * 0.2 + sd) * 0.2, z + Math.cos(t * 0.08 + sd)); });
  update(0); st.onTick(update); return { update };
}
// sheets of paper tumbling across the ground in a gust (a dropped binder, a windy quad)
export function blowingPaper(st, o = {}) {
  const n = o.n ?? 14, [x0, x1, z0, z1] = o.area || [-6, 6, -2, 2], wind = o.wind ?? 2.4, t0 = o.t0 ?? 0, r = rng(o.seed || 29);
  const tex = cached('paperSheet', () => canvasTex(64, 82, (g, W, H) => { g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, W, H); g.fillStyle = '#9ab0d8'; for (let y = 12; y < H; y += 7) g.fillRect(4, y, W - 8, 1); g.fillStyle = '#e88a8a'; g.fillRect(10, 0, 1, H); }));
  const ps = []; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.27), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 })); m.castShadow = true; m.userData.dynamic = true; st.add(m); ps.push([m, lerp(x0, x1, r()), lerp(z0, z1, r()), r() * 9, 0.6 + r() * 0.8]); }
  const span = x1 - x0; const update = (t) => { const k = Math.max(0, t - t0); for (const [m, x, z, sd, sp] of ps) { const xx = x0 + ((x - x0 + k * wind * sp) % (span + 2)), lift = Math.max(0, Math.sin(k * 2.2 * sp + sd)) * 0.9 * Math.min(1, k);
    m.position.set(xx, 0.02 + lift, z + Math.sin(k * 1.3 + sd) * 0.4); m.rotation.set(-R2 + lift * 2 * Math.sin(k * 3 + sd), k * 2 * sp + sd, lift * Math.cos(k * 4 + sd)); } };
  update(0); st.onTick(update); return { update };
}
