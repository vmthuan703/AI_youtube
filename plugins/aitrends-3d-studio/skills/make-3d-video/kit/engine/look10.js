// engine/look10.js — 1.0 "look" helpers (exposed as T.W.* through world3d.js): glossy floor reflections, a painted sky
// dome with clouds and a sun, light shafts with floating dust, soft ambient-occlusion strips where walls meet floors,
// and strings of party bulbs. Every helper honours ?legacy (render.mjs --legacy) by returning null / doing nothing, so
// before/after renders compare the same shot.
//
//   T.W.mirror(st, { w: 8, d: 20, y: 0, strength: 0.35 })        // glossy school floor, wet street, polished café floor
//   T.W.skyDome(st, { clouds: 14, sun: [-0.5, 0.35, -1] })        // painted sky with soft clouds in place of the flat gradient
//   T.W.shafts(st, { pos: [-3.9, 2.2, 0], dir: [1, -0.7, 0.2] })  // god rays from a window, with dust motes in them
//   T.W.aoStrip(st, { from: [-4, 0, -3], to: [4, 0, -3], up: 0.5 }) // contact darkening along a wall base (sets call it for you)
//   st.add(T.W.stringLights({ from: [-4, 3, 0], to: [4, 3.2, 0], n: 14, sag: 0.4 }))
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { E, S, mood, shade, mix, rng, clamp, lerp, noise } from './core.js';
import { LEGACY, canvasTex, cached, glow, glowMat, group, lamp, color } from './kit3d.js';
import { dust } from './fx3d.js';

// ---------------------------------------------------------------- mirror: a blurred, fresnel-weighted planar reflection
// Lies just above the floor and blends over it: strong at grazing angles, faint looking straight down, so floors read as
// polished rather than as glass. o: { w, d, x, z, y, strength 0..1, blur 0..3, res 0.25..1, tint }.
const MIRROR_SHADER = {
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, strength: { value: 0.35 }, blur: { value: 1.2 }, texel: { value: new THREE.Vector2(1 / 512, 1 / 512) } },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
    void main() { vUv = textureMatrix * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform float strength, blur; uniform vec2 texel; varying vec4 vUv; varying vec3 vW;
    void main() {
      vec2 uv = vUv.xy / vUv.w; vec3 acc = vec3(0.0); float wsum = 0.0;
      for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) { float w = exp(-float(i * i + j * j) / 4.0); acc += texture2D(tDiffuse, uv + vec2(float(i), float(j)) * texel * blur * 1.5).rgb * w; wsum += w; }
      vec3 refl = acc / wsum * color;
      vec3 V = normalize(cameraPosition - vW); float fr = 0.25 + 0.75 * pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
      float a = clamp(strength * fr, 0.0, 0.95);
      gl_FragColor = vec4(refl, a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};
export function mirror(st, o = {}) {
  if (LEGACY || o.off) return null;
  const w = o.w || 10, d = o.d || 10, res = clamp(o.res ?? 0.5, 0.2, 1);
  const tw = Math.round(E.W * (E.PX || 1) * res), th = Math.round(E.H * (E.PX || 1) * res);
  const m = new Reflector(new THREE.PlaneGeometry(w, d), { textureWidth: tw, textureHeight: th, clipBias: 0.003, color: color(o.tint || '#ffffff'), shader: MIRROR_SHADER, multisample: 0 });
  m.material.transparent = true; m.material.depthWrite = false; m.material.uniforms.strength.value = o.strength ?? 0.35; m.material.uniforms.blur.value = o.blur ?? 1.2;
  m.material.uniforms.texel.value.set(1 / tw, 1 / th);
  m.rotation.x = -Math.PI / 2; m.position.set(o.x || 0, (o.y || 0) + 0.004, o.z || 0); m.renderOrder = 2; m.name = 'mirror'; m.userData.dynamic = true;
  st.add(m); return m;
}

// ---------------------------------------------------------------- sky dome: the mood's gradient + soft painted clouds + a sun glow
// o: { clouds (count, 0 = none), sun: [x,y,z] direction | false, sunColor, seed, radius, tint, stars }.
export function skyDome(st, o = {}) {
  if (LEGACY) return null;
  const M = st.M, sky = Array.isArray(M.sky) ? M.sky : [M.sky, M.sky], seed = o.seed || 4, n = o.clouds ?? 12;
  const night = /night|storm|arctic|void/.test(st.moodName);
  const sunDir = o.sun === false ? null : new THREE.Vector3(...(o.sun || [-0.45, 0.28, -1])).normalize();
  const tex = cached('skyDome' + sky.join() + n + seed + (sunDir ? sunDir.toArray().join() : '') + (o.sunColor || '') + night, () => canvasTex(2048, 1024, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H / 2); sky.forEach((c, i) => gr.addColorStop(i / (sky.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, W, H / 2);
    g.fillStyle = sky[sky.length - 1]; g.fillRect(0, H / 2, W, H / 2);
    if (sunDir) {   // sun glow: equirect position of the sun direction
      const u = (Math.atan2(sunDir.x, -sunDir.z) / (Math.PI * 2) + 0.5) * W, v = (0.5 - Math.asin(sunDir.y) / Math.PI) * H, sc = o.sunColor || M.key;
      for (const [r, a] of [[H * 0.35, 0.18], [H * 0.12, 0.35], [H * 0.035, 0.95]]) { const sg = g.createRadialGradient(u, v, 0, u, v, r); sg.addColorStop(0, night ? 'rgba(240,236,255,' + a + ')' : 'rgba(255,248,230,' + a + ')'); sg.addColorStop(1, 'rgba(255,240,220,0)'); g.fillStyle = sg; g.fillRect(u - r, v - r, r * 2, r * 2); }
      g.fillStyle = sc; g.globalAlpha = 0.25; g.beginPath(); g.arc(u, v, H * 0.02, 0, 7); g.fill(); g.globalAlpha = 1;
    }
    const r = rng(seed), cloudC = night ? 'rgba(160,150,220,' : 'rgba(255,255,255,', shadowC = night ? 'rgba(20,16,50,' : 'rgba(120,110,170,';
    for (let i = 0; i < n; i++) {   // each cloud: a cluster of soft puffs, flat underside, lit top, shadowed base
      const cx = r() * W, cy = H * (0.3 + r() * 0.15), cw = W * (0.04 + r() * 0.07), ch = cw * (0.28 + r() * 0.12), puffs = 7 + ((r() * 6) | 0);
      for (let pass = 0; pass < 2; pass++) for (let k = 0; k < puffs; k++) {
        const px = cx + (r() - 0.5) * cw * 1.6, py = cy - Math.abs(r() - 0.5) * ch * 1.4 + (pass ? 0 : ch * 0.18), pr = ch * (0.45 + r() * 0.55);
        for (const dx of [0, W, -W]) { const pg = g.createRadialGradient(px + dx, py, 0, px + dx, py, pr); const a = pass ? (night ? 0.22 : 0.62) : 0.18; pg.addColorStop(0, (pass ? cloudC : shadowC) + a + ')'); pg.addColorStop(0.6, (pass ? cloudC : shadowC) + a * 0.55 + ')'); pg.addColorStop(1, (pass ? cloudC : shadowC) + '0)'); g.fillStyle = pg; g.fillRect(px + dx - pr, py - pr, pr * 2, pr * 2); }
      }
    }
  }));
  const R = o.radius || 420, m = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 32), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: true, color: color(o.tint || '#ffffff') }));
  m.renderOrder = -10; m.name = 'skyDome'; m.userData.dynamic = true; st.scene.background = null; st.add(m);
  // keep the dome centred on the camera so it never shows its edge
  st.onTick(() => m.position.copy(st.camera.position));
  return m;
}

// ---------------------------------------------------------------- light shafts: soft beams of light with drifting dust
// o: { pos: [x,y,z] where the beam starts (a window), dir: [x,y,z], len, w (beam width), h (beam height), n beams, gap,
//      color, opacity, motes (count, 0 = none), seed }. Beams are additive and fade along their length and at their edges.
const shaftTex = () => cached('shaftTex', () => canvasTex(128, 256, (g, W, H) => {
  const id = g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const u = x / (W - 1), v = y / (H - 1), edge = Math.sin(Math.PI * u) ** 1.6, fall = (1 - v) ** 1.5 * Math.min(1, v * 8 + 0.15); const a = edge * fall * 255; const i = (y * W + x) * 4; id.data[i] = id.data[i + 1] = id.data[i + 2] = 255; id.data[i + 3] = a; }
  g.putImageData(id, 0, 0);
}));
export function shafts(st, o = {}) {
  if (LEGACY) return null;
  const pos = new THREE.Vector3(...(o.pos || [0, 2.5, 0])), dir = new THREE.Vector3(...(o.dir || [1, -0.7, 0])).normalize(), len = o.len || 6, w = o.w || 0.9, h = o.h || 1.2, n = o.n ?? 3, gap = o.gap ?? 1.0;
  const c = color(o.color || st.M.practical || '#fff0d0'), op = o.opacity ?? 0.16, g = group(); g.userData.dynamic = true;
  const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)); if (side.lengthSq() < 1e-4) side.set(1, 0, 0); side.normalize();
  const along = o.along ? new THREE.Vector3(...o.along).normalize() : side;
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * gap; const start = pos.clone().addScaledVector(along, off);
    for (const rot of [0, Math.PI / 2]) {   // two crossed planes read as a volume from most angles
      const geo = new THREE.PlaneGeometry(rot ? w : h, len); geo.translate(0, -len / 2, 0);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: shaftTex(), color: c, transparent: true, opacity: op * (rot ? 0.45 : 0.85), blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false }));
      m.position.copy(start); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir); m.rotateY(rot + (o.twist || 0)); g.add(m);
    }
  }
  st.add(g);
  if ((o.motes ?? 90) > 0) { const mid = pos.clone().addScaledVector(dir, len * 0.45), sp = len * 0.35;
    const d = dust(st, { n: o.motes ?? 90, area: [mid.x - sp, mid.x + sp, Math.max(0.2, mid.y - sp * 0.6), mid.y + sp * 0.6, mid.z - sp * 0.6, mid.z + sp * 0.6], c: o.moteColor || '#fff6e0', size: 0.022, speed: 0.05, seed: o.seed || 5 }); st.onTick(d.update); }
  return g;
}

// ---------------------------------------------------------------- soft ambient occlusion where two surfaces meet
// aoStrip(st, { from, to, up (height of the dark fade), out (fade across the floor), opacity }) — a wall base at y = from[1].
// The fade runs up the wall AND out across the floor, on the room side: walking from `from` to `to`, the room is on the left
// (+z for a back wall drawn from -x to +x). o.yaw overrides the facing.
const aoTex = () => cached('aoTex', () => canvasTex(4, 128, (g, W, H) => { const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.35, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }));
export function aoStrip(st, o = {}) {
  if (LEGACY || S().ao === 0) return null;
  const a = new THREE.Vector3(...o.from), b = new THREE.Vector3(...o.to), len = a.distanceTo(b), mid = a.clone().add(b).multiplyScalar(0.5), yaw = Math.atan2(b.x - a.x, b.z - a.z) - Math.PI / 2;
  const op = (o.opacity ?? 0.42) * (S().ao ?? 1), up = o.up ?? 0.55, out = o.out ?? 0.45;
  const M = () => new THREE.MeshBasicMaterial({ map: aoTex(), color: 0x000000, transparent: true, opacity: op, depthWrite: false, fog: true });
  const g = group(); g.name = 'ao';
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, up), M()); wall.position.set(0, up / 2, 0.012); g.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(len, out), M()); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.008, out / 2 + 0.012); g.add(floor);
  // the floor plane's texture fades along its local y; after rotation local y points to -z, so flip it to fade away from the wall
  floor.scale.y = -1;
  g.position.copy(mid); g.rotation.y = o.yaw ?? yaw; st.add(g); return g;
}

// ---------------------------------------------------------------- a string of bulbs hanging in a catenary (cafés, food stalls, night streets)
// stringLights({ from, to, n, sag, color, size, lights (real point lights, 0..3), seed }) → group (st.add it)
export function stringLights(o = {}) {
  const a = new THREE.Vector3(...(o.from || [-3, 3, 0])), b = new THREE.Vector3(...(o.to || [3, 3, 0])), n = o.n || 12, sag = o.sag ?? 0.35, c = o.color || '#ffd48a', r = rng(o.seed || 2);
  const g = group(); g.userData.dynamic = true; const pts = [];
  for (let i = 0; i <= 40; i++) { const k = i / 40; const p = a.clone().lerp(b, k); p.y -= sag * 4 * k * (1 - k); pts.push(p); }
  const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.006, 4), new THREE.MeshBasicMaterial({ color: '#141018' })); g.add(wire);
  const nl = o.lights ?? 1;
  for (let i = 0; i < n; i++) { const k = (i + 0.5) / n; const p = a.clone().lerp(b, k); p.y -= sag * 4 * k * (1 - k) + 0.06;
    const cc = o.colors ? o.colors[i % o.colors.length] : mix(c, '#ffffff', r() * 0.2); const bulb = new THREE.Mesh(new THREE.SphereGeometry(o.size || 0.045, 10, 8), glowMat(cc, 2.4)); bulb.position.copy(p); g.add(bulb);
    const h = glow(cc, (o.size || 0.045) * 9, 0.5); h.position.copy(p); g.add(h);
    if (nl > 0 && i % Math.max(1, Math.floor(n / nl)) === Math.floor(n / nl / 2)) { const L = lamp(cc, o.intensity ?? 2.2, o.dist ?? 6, { bulb: false, decay: 1.4 }); L.position.copy(p); g.add(L); }
  }
  return g;
}
