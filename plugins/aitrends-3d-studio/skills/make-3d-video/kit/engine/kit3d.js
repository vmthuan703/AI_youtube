// engine/kit3d.js — the 3D toolkit passed as `T` to every 3D shot (init / draw).
// Stylised 3D: black stick figures with a fresnel rim light, saturated clothes, moody sets lit by
// practical lights (lit windows, street lamps, screens), fog, bloom, optional depth of field.
// 1 world unit = 1 metre. Characters stand on y = 0 and face +z unless rotated.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { E, S, V, mood, shade, rng, key, smoothKey, ease, clamp, lerp, noise } from './core.js';
export { THREE };

// ---------------------------------------------------------------- renderer (one per worker)
let R = null;
export function getRenderer(canvas) {
  if (R) return R;
  R = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, alpha: false, powerPreference: 'high-performance' });
  R.setPixelRatio(1); R.setSize(Math.round(E.W * E.PX), Math.round(E.H * E.PX), false);
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0; R.outputColorSpace = THREE.SRGBColorSpace;
  return R;
}
export const renderer = () => R;
const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');   // debug toggles: ?nodof&nobloom&noshadow&noenv&lambert&msaa=0
// ?legacy renders with the 0.2.x look (no mood environment light, clearcoat, sheen, mirrors, sky domes): for before/after comparisons
export const LEGACY = QS.has('legacy');
const C = (c) => (c instanceof THREE.Color ? c : new THREE.Color(c));
export const color = C;

// ---------------------------------------------------------------- rim light (shared by all "rim" materials)
// One set of uniforms per frame: the stage sets them from the mood; a shot can override with T.rim({...}).
export const RIM = { rimColor: { value: new THREE.Color('#b9a6ff') }, rimStrength: { value: 0.6 }, rimPower: { value: 3.4 }, rimDir: { value: new THREE.Vector3(0, 0, 0) } };
export function rim(o = {}) {
  if (o.color) RIM.rimColor.value.set(o.color);
  if (o.strength != null) RIM.rimStrength.value = o.strength;
  if (o.power != null) RIM.rimPower.value = o.power;
  if (o.dir) RIM.rimDir.value.set(...o.dir).normalize(); else if (o.dir === null) RIM.rimDir.value.set(0, 0, 0);
  return RIM;
}
// limit > 0: a soft ceiling on the lit colour (skin). Heads never clip to white or feed the bloom under strong keys.
function addRim(m, k = 1, limit = 0) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, RIM, { rimK: { value: k } });
    const ceiling = limit > 0 ? `
        { float mxL = max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)); float kn = ${(limit * 0.62).toFixed(3)};
          if (mxL > kn) { float over = mxL - kn; gl_FragColor.rgb *= (kn + over / (1.0 + over / (${limit.toFixed(3)} - kn))) / mxL; } }` : '';
    sh.fragmentShader = 'uniform vec3 rimColor; uniform float rimStrength; uniform float rimPower; uniform vec3 rimDir; uniform float rimK;\n' +
      sh.fragmentShader.replace('#include <opaque_fragment>', `
        { vec3 nV = normalize(normal); vec3 vV = normalize(vViewPosition);
          float fr = pow(1.0 - clamp(dot(nV, vV), 0.0, 1.0), rimPower);
          float side = 1.0;
          if (length(rimDir) > 0.01) { vec3 rd = normalize((viewMatrix * vec4(rimDir, 0.0)).xyz); side = smoothstep(-0.35, 0.55, dot(nV, rd)); }
          outgoingLight += rimColor * fr * side * rimStrength * rimK; }
        #include <opaque_fragment>${ceiling}`);
  };
  m.customProgramCacheKey = () => 'rim' + k + '/' + limit;
  return m;
}
// ---------------------------------------------------------------- materials (respect the style: toon or soft-PBR)
const _ramps = new Map();
function toonRamp(steps, hard) {
  const k = steps.join(',') + hard; if (_ramps.has(k)) return _ramps.get(k);
  const d = new Uint8Array(steps.length * 4); steps.forEach((v, i) => d.set([v, v, v, 255], i * 4));
  const t = new THREE.DataTexture(d, steps.length, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = hard ? THREE.NearestFilter : THREE.LinearFilter; t.needsUpdate = true;
  _ramps.set(k, t); return t;
}
// mat(colour, {rough, metal, emissive, emissiveIntensity, rim: 0..1, toon: false|ramp, flat, map, transparent, opacity, side})
// The style decides toon (ramp of grey levels) or soft PBR; shiny metal stays PBR so cars and glass still reflect.
export function mat(c, o = {}) {
  const st = S(); const toon = o.toon === false ? null : (o.toon || st.toon || null);
  const { rim: rk = 0, limit = 0, rough = 0.85, metal = 0, flat = false, clearcoat = 0, clearcoatRough = 0.3, sheen = 0, sheenRough = 0.55, sheenColor = null, ...rest } = o; delete rest.toon;
  // style.setSat < 1 calms the sets (materials without a rim: walls, floors, furniture, props); characters keep their colours
  const setSat = rk > 0 || limit > 0 || o.keepSat ? 1 : (st.setSat ?? 1); delete rest.keepSat;
  if (setSat !== 1) { const cc = C(c).clone(), hsl = {}; cc.getHSL(hsl); cc.setHSL(hsl.h, hsl.s * setSat, hsl.l); c = cc; }
  const m = QS.has('lambert') ? new THREE.MeshLambertMaterial({ color: C(c), flatShading: flat, ...rest }) : toon && !(metal > 0.45 && rough < 0.4) ? new THREE.MeshToonMaterial({ color: C(c), gradientMap: toonRamp(toon, st.toonHard), ...rest })
    // 1.0: clearcoat (vinyl-toy skin, glossy hair, shoes) and sheen (soft fabric highlight) use the physical material; ?legacy turns them off
    : (clearcoat > 0 || sheen > 0) && !LEGACY ? new THREE.MeshPhysicalMaterial({ color: C(c), roughness: rough, metalness: metal, flatShading: flat, clearcoat, clearcoatRoughness: clearcoatRough,
        sheen, sheenRoughness: sheenRough, sheenColor: sheenColor ? C(sheenColor) : C(c).clone().lerp(new THREE.Color('#ffffff'), 0.55), ...rest })
    : new THREE.MeshStandardMaterial({ color: C(c), roughness: rough, metalness: metal, flatShading: flat, ...rest });
  if (rk > 0 || limit > 0) addRim(m, rk, limit);
  if (m.isMeshStandardMaterial && (metal > 0.3 || rough < 0.3) && R && !QS.has('noenv')) { m.envMap = envMap(); m.envMapIntensity = o.env ?? 0.6; }
  return m;
}
export const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: C(c), ...o });
export const glowMat = (c, power = 1.6, o = {}) => new THREE.MeshBasicMaterial({ color: C(c).clone().multiplyScalar(power), toneMapped: false, ...o });   // emissive things that bloom
export function canvasTex(w, h, draw, repeat = null) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const _cache = new Map();
export const cached = (k, make) => { if (!_cache.has(k)) _cache.set(k, make()); return _cache.get(k); };
// soft round sprite texture (glows, bokeh, particles)
export const dotTex = () => cached('dot', () => canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
// soft contact shadow under a prop or piece of furniture: a dark blurred footprint on the floor, sized from the object's bounds.
// contactShadow(obj, { opacity, pad, y }) → the shadow mesh (add it to the stage). room() puts one under every floor-standing prop.
export function contactShadow(obj, o = {}) {
  obj.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(obj), sz = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()), pad = o.pad ?? 1.25;
  if (sz.y < 0.05) return null;   // rugs and flat things need none
  const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(0.2, sz.x * pad), Math.max(0.2, sz.z * pad)), new THREE.MeshBasicMaterial({ map: dotTex(), color: 0x000000, transparent: true, opacity: o.opacity ?? (S().contact ?? 0.42) * 0.8, depthWrite: false, fog: true }));
  m.rotation.x = -Math.PI / 2; m.position.set(c.x, (o.y ?? b.min.y) + 0.005, c.z); m.renderOrder = 1; m.name = 'contact'; return m;
}
export const discTex = () => cached('disc', () => canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.8, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));

// ---------------------------------------------------------------- stage
// stage({ mood, fov, fog:[near,far] | false, fogColor, sky:[top..bottom] | colour, keyPos, keyColor, keyIntensity,
//         ambient, fill, bloom, bloomThreshold, exposure, dof:{focus, aperture, maxblur}, shadowSize, shadows })
export function stage(o = {}) {
  const moodName = o.mood || 'night'; E.curMood = moodName;   // props built after this match the stage's mood
  const M = mood(moodName), st = S(), L = st.light || {};
  if (QS.has('nodof')) o.dof = null; if (QS.has('nobloom')) o.bloom = 0; if (QS.has('noshadow')) o.shadows = false; if (QS.has('msaa')) o.msaa = +QS.get('msaa');
  const scene = new THREE.Scene(); const sky = o.sky || M.sky;
  scene.background = Array.isArray(sky) ? canvasTex(8, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); sky.forEach((c, i) => gr.addColorStop(i / (sky.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) : C(sky);
  if (o.fog !== false) scene.fog = new THREE.Fog(C(o.fogColor || M.fog || M.dark), ...(o.fog || [14, 70]));
  // soft reflections for shiny things (cars, glass, metal); toon materials ignore it
  // reflections only on shiny materials (see mat()): a global environment map costs ~40% more on CPU renderers
  // 1.0: soft image-based light from this mood's own sky, ground and sun, so every standard material gets gentle reflections
  // and glossy highlights that match the set (o.env / style.env = strength, 0 = off). Toon materials ignore it.
  const envK = LEGACY || QS.has('noenv') || !R ? 0 : (o.env ?? st.env ?? 0.42);
  if (envK > 0) { scene.environment = moodEnv(sky, M, o.keyPos || [-6, 10, 6], o.keyColor || M.key); scene.environmentIntensity = envK; }
  const camera = new THREE.PerspectiveCamera(o.fov || V(35, 50), E.W / E.H, 0.05, 600);
  camera.position.set(0, 1.6, 6); camera.lookAt(0, 1.2, 0); camera.userData.scene = scene;   // 1.0.2: camShot looks for blockers in it
  const hemi = new THREE.HemisphereLight(C(o.ambientSky || M.ambient), C(M.dark), (o.ambient ?? 1.0) * (L.ambient ?? 1) * (1 - 0.35 * envK)); scene.add(hemi);
  const sun = new THREE.DirectionalLight(C(o.keyColor || M.key), (o.keyIntensity ?? 2.0) * (L.key ?? 1));
  sun.position.set(...(o.keyPos || [-6, 10, 6]));
  if (o.shadows !== false) {
    sun.castShadow = true; const ss = o.shadowSize || 12, sm = o.shadowMap || ({ draft: 1024, max: 4096 }[E.quality] || 2048);
    sun.shadow.mapSize.set(sm, sm); Object.assign(sun.shadow.camera, { left: -ss, right: ss, top: ss, bottom: -ss, near: 0.5, far: 120 });
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
  }
  scene.add(sun, sun.target);
  // back light in the rim colour (separates black figures from dark sets); the fresnel rim does the rest
  const fill = new THREE.DirectionalLight(C(o.fillColor || M.rim), (o.fill ?? 0.9) * (L.fill ?? 1)); fill.position.set(...(o.fillPos || [4, 5, -7])); scene.add(fill, fill.target);
  // night and storm: a soft light from the camera lifts faces off the dark set, and the rim is stronger (o.faceLight 0 turns it off)
  const darkMood = /^(night|storm|arctic)$/.test(moodName), faceK = o.faceLight ?? (darkMood ? 0.55 : 0);
  const faceLight = faceK > 0 ? new THREE.DirectionalLight(C(o.faceColor || '#e8e0ff'), faceK * (L.fill ?? 1)) : null; if (faceLight) scene.add(faceLight, faceLight.target);
  const rimState = { color: o.rim || M.rim, strength: (o.rimStrength ?? (darkMood ? 0.85 : 0.6)) * (L.rim ?? 1), power: o.rimPower ?? 3.4, dir: o.rimDir || null };
  rim(rimState);
  const w = Math.round(E.W * E.PX), h = Math.round(E.H * E.PX);
  const composer = new EffectComposer(R, new THREE.WebGLRenderTarget(w, h, { samples: o.msaa ?? (E.quality === 'high' || E.quality === 'max' ? 4 : 0), type: THREE.HalfFloatType }));
  composer.addPass(new RenderPass(scene, camera));
  let bokeh = null;
  if (o.dof) { bokeh = new BokehPass(scene, camera, { focus: o.dof.focus ?? 5, aperture: o.dof.aperture ?? 0.0025, maxblur: o.dof.maxblur ?? 0.008 }); composer.addPass(bokeh); }
  const bloomK = (o.bloom ?? (st.grade.bloom ?? 0.6)) * 0.8; const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), bloomK, 0.5, o.bloomThreshold ?? st.grade.bloomThreshold ?? 1.0); if (bloomK > 0) composer.addPass(bloom); else bloom.dispose();
  composer.addPass(new OutputPass());
  if (E.quality === 'standard' && o.msaa == null) { const fx = new ShaderPass(FXAAShader); fx.uniforms.resolution.value.set(1 / w, 1 / h); composer.addPass(fx); }   // cheap anti-aliasing
  const tickers = [];
  const api = {
    scene, camera, composer, sun, hemi, fill, M, bloom, bokeh, tickers, moodName, faceLight,
    // re-apply this stage's rim and mood before drawing it: another stage may have been built since (backdrops, transitions)
    activate: () => { rim(rimState); E.curMood = moodName; },
    add: (...objs) => { objs.forEach(ob => { if (!ob) return; scene.add(ob); if (typeof ob.tick === 'function') tickers.push(ob.tick); }); return objs[0]; },   // objects with .tick(t) animate by themselves (crowds)
    // run every registered animator (particles, blinking signs, cars…) — call once per frame from draw()
    tick: (t) => { for (const f of tickers) f(t); },
    onTick: (f) => { tickers.push(f); return f; },
    focus: (dist, aperture) => { if (!bokeh) return; bokeh.uniforms.focus.value = dist; if (aperture != null) bokeh.uniforms.aperture.value = aperture; },
    // focus on an object/point automatically: st.focusOn([x,y,z])
    // the depth pass measures along the view axis, so focus uses view depth: off-centre subjects stay sharp
    focusOn: (p) => { if (!bokeh) return; const v = Array.isArray(p) ? new THREE.Vector3(...p) : p.isVector3 ? p.clone() : p.getWorldPosition(new THREE.Vector3()); camera.updateMatrixWorld(); bokeh.uniforms.focus.value = Math.max(0.05, -v.applyMatrix4(camera.matrixWorldInverse).z); },
    exposure: (x) => { R.toneMappingExposure = x; },
    // fitShadow([x,y,z], size): aim the sun's shadow box at the action and shrink it, so shadows under feet and props are crisp
    fitShadow: (c, size = 6) => { const d = sun.position.clone().sub(sun.target.position).normalize(); sun.target.position.set(...c); sun.position.copy(sun.target.position).addScaledVector(d, 30);
      Object.assign(sun.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: 80 }); sun.shadow.camera.updateProjectionMatrix(); sun.target.updateMatrixWorld(); },
    render: () => { if (faceLight) { camera.updateMatrixWorld(); faceLight.position.copy(camera.position); faceLight.target.position.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(6)); faceLight.target.updateMatrixWorld(); }
      R.toneMappingExposure = (o.exposure ?? 1) * (L.exposure ?? 1); camera.aspect = E.W / E.H; camera.updateProjectionMatrix(); R.info.autoReset = false; R.info.reset(); composer.render(); api.calls = R.info.render.calls; api.tris = R.info.render.triangles; },
    dispose: () => { scene.traverse(x => { x.geometry?.dispose(); [].concat(x.material || []).forEach(m => { m.map?.dispose?.(); m.dispose(); }); }); composer.passes.forEach(p => p.dispose?.()); composer.dispose?.(); },   // free bloom/DOF targets too (long videos visit hundreds of shots per worker)
  };
  return api;
}

// the mood's environment: a sky gradient dome, a darker ground, and a soft bright sun where the key light comes from
const _moodEnv = new Map();
function moodEnv(sky, M, keyPos, keyColor) {
  const cols = Array.isArray(sky) ? sky : [sky, sky]; const k = cols.join() + M.dark + M.floor + keyPos.join() + keyColor; if (_moodEnv.has(k)) return _moodEnv.get(k);
  const es = new THREE.Scene(); const top = C(cols[0]), hor = C(cols[cols.length - 1]), mid = C(cols[Math.floor((cols.length - 1) / 2)]), gnd = C(M.floor || M.dark).clone().lerp(C(M.dark), 0.4);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: top }, mid: { value: mid }, hor: { value: hor }, gnd: { value: gnd } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top, mid, hor, gnd; varying vec3 vP; void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(hor, mix(mid, top, smoothstep(0.25, 0.9, y)), smoothstep(0.0, 0.35, y)) : mix(hor * 0.7, gnd, smoothstep(0.0, -0.25, y)); gl_FragColor = vec4(c, 1.0); }' }));
  es.add(dome);
  const sunM = new THREE.MeshBasicMaterial({ color: C(keyColor).clone().multiplyScalar(6) }); const sunB = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 8), sunM);
  sunB.position.copy(new THREE.Vector3(...keyPos).normalize().multiplyScalar(40)); es.add(sunB);
  const pm = new THREE.PMREMGenerator(R); const tex = pm.fromScene(es, 0.03).texture; pm.dispose(); dome.geometry.dispose(); dome.material.dispose(); sunB.geometry.dispose(); sunM.dispose();
  _moodEnv.set(k, tex); return tex;
}
let _env = null;
function envMap() { if (_env) return _env; const pm = new THREE.PMREMGenerator(R); _env = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); return _env; }

// ---------------------------------------------------------------- primitive builders
export const prep = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; return m; };
const M_ = (m, def) => (m == null ? mat(def) : typeof m === 'string' ? mat(m) : m);
export const mesh = (geo, material, x = 0, y = 0, z = 0) => { const m = prep(new THREE.Mesh(geo, M_(material, '#888'))); m.position.set(x, y, z); return m; };
export const box = (w, h, d, material, x = 0, y = 0, z = 0) => mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z);
export const rbox = (w, h, d, r, material, x = 0, y = 0, z = 0) => mesh(roundedBoxGeo(w, h, d, r), material, x, y, z);
export const cyl = (rt, rb, h, material, x = 0, y = 0, z = 0, seg = 20) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material, x, y, z);
export const cone = (r, h, material, x = 0, y = 0, z = 0, seg = 12) => mesh(new THREE.ConeGeometry(r, h, seg), material, x, y, z);
export const sphere = (r, material, x = 0, y = 0, z = 0, ws = 24, hs = 16) => mesh(new THREE.SphereGeometry(r, ws, hs), material, x, y, z);
export const torus = (r, tube, material, x = 0, y = 0, z = 0) => mesh(new THREE.TorusGeometry(r, tube, 10, 32), material, x, y, z);
export const capsule = (r, len, material, x = 0, y = 0, z = 0) => mesh(new THREE.CapsuleGeometry(r, len, 6, 14), material, x, y, z);
export const plane = (w, h, material, x = 0, y = 0, z = 0) => { const m = prep(new THREE.Mesh(new THREE.PlaneGeometry(w, h), M_(material, '#888')), false, true); m.position.set(x, y, z); return m; };
export const group = (...kids) => { const g = new THREE.Group(); kids.forEach(k => k && g.add(k)); return g; };
export const at = (obj, x = 0, y = 0, z = 0, ry = 0, s = 1) => { obj.position.set(x, y, z); obj.rotation.y = ry; if (s !== 1) obj.scale.setScalar(s); return obj; };
export function ground(w, d, c, tex = null, o = {}) { const m = plane(w, d, mat(c, { map: tex, rough: o.rough ?? 0.9, metal: o.metal ?? 0 })); m.rotation.x = -Math.PI / 2; m.position.y = o.y ?? 0; return m; }
// rounded box geometry (soft cartoon furniture, phones, cars)
export function roundedBoxGeo(w, h, d, r = 0.05, seg = 3) {
  // inner rounded rectangle (w-2r × h-2r) extruded and bevelled by r, so the result is exactly w × h × d
  r = Math.max(1e-4, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
  const iw = w - 2 * r, ih = h - 2 * r, c = Math.min(r, iw / 2, ih / 2) * 0.999, x = -iw / 2, y = -ih / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + c, y); shape.lineTo(x + iw - c, y); shape.quadraticCurveTo(x + iw, y, x + iw, y + c); shape.lineTo(x + iw, y + ih - c); shape.quadraticCurveTo(x + iw, y + ih, x + iw - c, y + ih);
  shape.lineTo(x + c, y + ih); shape.quadraticCurveTo(x, y + ih, x, y + ih - c); shape.lineTo(x, y + c); shape.quadraticCurveTo(x, y, x + c, y);
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(1e-3, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelOffset: 0, bevelSegments: seg, curveSegments: seg + 1 });
  g.translate(0, 0, -(d - 2 * r) / 2); g.computeVertexNormals(); return g;
}
// textures
export const stripes = (base, line = 'rgba(0,0,0,.25)', n = 16, rep = [4, 4], vertical = true) => canvasTex(512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.strokeStyle = line; g.lineWidth = 3; for (let i = 0; i <= n; i++) { const p = (i * w) / n; g.beginPath(); vertical ? (g.moveTo(p, 0), g.lineTo(p, h)) : (g.moveTo(0, p), g.lineTo(w, p)); g.stroke(); } }, rep);
export const planks = (base = '#5a3a2c', n = 10, rep = [4, 4]) => canvasTex(512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); const r = rng(7); for (let i = 0; i < n; i++) { g.fillStyle = shade(base, (r() - 0.5) * 0.18); g.fillRect((i * w) / n, 0, w / n, h); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect((i * w) / n, 0, 3, h); for (let k = 0; k < 3; k++) { const y = r() * h; g.fillRect((i * w) / n, y, w / n, 2); } } }, rep);
export const tiles = (base = '#3a3a48', n = 8, rep = [4, 4], line = 'rgba(0,0,0,.28)') => canvasTex(512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.strokeStyle = line; g.lineWidth = 4; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo((i * w) / n, 0); g.lineTo((i * w) / n, h); g.stroke(); g.beginPath(); g.moveTo(0, (i * h) / n); g.lineTo(w, (i * h) / n); g.stroke(); } }, rep);
export const carpet = (base = '#4a3a5a', rep = [3, 3]) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.03 + r() * 0.04})`; g.fillRect(r() * w, r() * h, 2, 2); } }, rep);
export const asphalt = (base = '#26243a', rep = [8, 8]) => canvasTex(512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); const r = rng(11); for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.02 + r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 2); } for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); } }, rep);
// a texture with text on it (signs, screens, labels). o: {bg, color, size, font, weight, glow}
export function textTex(str, o = {}) {
  const { w = 512, h = 128, bg = null, color = '#fff', size = 72, font = 'Fredoka', weight = 700, glow = 0, align = 'center' } = o;
  return canvasTex(w, h, (g) => { if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } g.font = `${weight} ${size}px "${font}"`; g.textAlign = align; g.textBaseline = 'middle'; if (glow) { g.shadowColor = color; g.shadowBlur = glow; } g.fillStyle = color; String(str).split('\n').forEach((ln, i, a) => g.fillText(ln, align === 'center' ? w / 2 : 16, h / 2 + (i - (a.length - 1) / 2) * size * 1.1)); });
}
// flat panel that shows a canvas drawn by fn(g, w, h, t) and can be redrawn each frame (phone screens, TVs, billboards)
export function screen(w, h, draw, o = {}) {
  const pw = o.px || 512, ph = Math.round(pw * h / w); const c = document.createElement('canvas'); c.width = pw; c.height = ph; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(o.power ?? 1.15, o.power ?? 1.15, o.power ?? 1.15) }));
  m.update = (t) => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, pw, ph); draw(g, pw, ph, t); tex.needsUpdate = true; };
  m.update(0); return m;
}

// ---------------------------------------------------------------- lights
// practical point light with a visible glowing bulb (lamps, screens, headlights)
export function lamp(c = '#ffcf8a', intensity = 6, dist = 8, o = {}) {
  const g = new THREE.Group(); const L = new THREE.PointLight(C(c), intensity * (S().light?.practical ?? 1), dist, o.decay ?? 1.6); L.castShadow = !!o.shadow; if (o.shadow) { L.shadow.mapSize.set(512, 512); L.shadow.bias = -0.002; }
  g.add(L); g.light = L;
  if (o.bulb !== false) { const b = new THREE.Mesh(new THREE.SphereGeometry(o.bulbR || 0.08, 12, 8), glowMat(c, 2)); g.add(b); g.bulb = b; }
  return g;
}
export function spot(c = '#ffd9a0', intensity = 30, o = {}) {
  const L = new THREE.SpotLight(C(c), intensity * (S().light?.practical ?? 1), o.dist ?? 25, o.angle ?? 0.5, o.penumbra ?? 0.6, o.decay ?? 1.4);
  L.position.set(...(o.pos || [0, 6, 0])); L.target.position.set(...(o.target || [0, 0, 0])); if (o.shadow !== false) { L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -0.0008; }
  const g = new THREE.Group(); g.add(L, L.target); g.light = L; return g;
}
// soft volumetric-looking cone (street lamps, spotlights, god rays). top at origin, opening downward along -y
export function lightCone(r = 1.2, h = 4, c = '#ffd59a', opacity = 0.12) {
  const tex = cached('coneTex', () => canvasTex(64, 256, (g, w, hh) => { const gr = g.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh); }));
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 32, 1, true), new THREE.MeshBasicMaterial({ color: C(c), map: tex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.geometry.translate(0, -h / 2, 0); m.castShadow = m.receiveShadow = false; return m;
}
// additive glow sprite (bokeh, halos around lamps, sun)
export function glow(c = '#ffcf8a', size = 1, opacity = 0.8, o = {}) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: o.disc ? discTex() : dotTex(), color: C(c), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: o.fog ?? false, toneMapped: false }));
  s.scale.setScalar(size); return s;
}

// ---------------------------------------------------------------- cameras
// Every helper takes the camera, the shot-local time t and options; all positions are [x,y,z] arrays.
export function orbit(camera, t, o = {}) { const { target = [0, 1, 0], radius = 8, height = 3, from = -0.6, to = 0.2, dur = 5, e = ease.inOut } = o; const k = e(clamp(t / dur)); const a = lerp(from, to, k), r = typeof radius === 'number' ? radius : lerp(radius[0], radius[1], k), h = typeof height === 'number' ? height : lerp(height[0], height[1], k); camera.position.set(target[0] + Math.sin(a) * r, h, target[2] + Math.cos(a) * r); camera.lookAt(...target); }
// dolly(camera, t, [[0, {pos, look, fov?, roll?}], [3, {...}]]) — keyframed move along one smooth curve: eases out of the
// first key, flows through the middle keys without stopping, eases into the last (two equal keys hold still). Pass an
// easing fn (e.g. ease.inOut) for the old behaviour: each stretch eased on its own, stopping at every key.
export function dolly(camera, t, keys, fn = null) { const v = fn || keys.some(k => k[2]) ? key(t, keys, fn || ease.inOut) : smoothKey(t, keys); camera.position.set(...v.pos); camera.up.set(0, 1, 0); camera.lookAt(...v.look); if (v.roll) camera.rotateZ(v.roll); if (v.fov && camera.fov !== v.fov) { camera.fov = v.fov; camera.updateProjectionMatrix(); } }
// push(camera, t, {from:[..], to:[..], look:[..] | lookFrom/lookTo, dur}) — a straight move (push-in, pull-out, truck)
export function push(camera, t, o = {}) { const k = (o.e || ease.inOut)(clamp(t / (o.dur || 4))); const p = o.from.map((v, i) => lerp(v, o.to[i], k)); const l = o.look || o.lookFrom.map((v, i) => lerp(v, o.lookTo[i], k)); camera.position.set(...p); camera.lookAt(...l); if (o.roll) camera.rotateZ(o.roll); }
// follow(camera, target, {offset:[x,y,z], look:[dx,dy,dz], lag}) — tracks a moving object (chases, walks)
export function follow(camera, target, o = {}) { const p = target.isVector3 ? target : target.position; const off = o.offset || [0, 1.6, 5]; camera.position.set(p.x + off[0], p.y + off[1], p.z + off[2]); const l = o.look || [0, 1.2, 0]; camera.lookAt(p.x + l[0], p.y + l[1], p.z + l[2]); if (o.roll) camera.rotateZ(o.roll); }
// handheld / impact shake (deterministic). amp in metres, rot in radians
export function shake(camera, t, amp = 0.02, freq = 1.4, rot = 0.004, seed = 5) { camera.position.x += noise(t * freq, seed) * amp; camera.position.y += noise(t * freq, seed + 3) * amp; camera.rotateZ(noise(t * freq, seed + 7) * rot); }
// look at a point from a spherical offset (closeups): aim(camera, [x,y,z], {dist, yaw, pitch, fov})
export function aim(camera, target, o = {}) { const { dist = 1.4, yaw = 0, pitch = 0.05, fov } = o; camera.position.set(target[0] + Math.sin(yaw) * Math.cos(pitch) * dist, target[1] + Math.sin(pitch) * dist, target[2] + Math.cos(yaw) * Math.cos(pitch) * dist); camera.lookAt(...target); if (fov && camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); } }
export const setFov = (camera, fov) => { if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); } };
export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
// project a world point (or object) to overlay coordinates [x, y] in logical units (1920×1080 / 1080×1920); z > 1 = behind the camera
export function toScreen(p, camera) { const v = Array.isArray(p) ? new THREE.Vector3(...p) : p.isVector3 ? p.clone() : p.getWorldPosition(new THREE.Vector3()); camera.updateMatrixWorld(); v.project(camera); return [((v.x + 1) / 2) * E.W, ((1 - v.y) / 2) * E.H, v.z]; }
export const worldPos = (obj, out = new THREE.Vector3()) => obj.getWorldPosition(out);
// headTag(character, camera, { lift, ref }) → { x, y, s, on }: where a tag over this head goes on screen, and how big it should be
// (s = 1 at `ref` metres, smaller farther away). For UI.hud / pills that ride on a head; the player does this itself for ch.userData.hud.
export function headTag(ch, camera, o = {}) { const v = ch.headWorld(); v.y += o.lift ?? 0.62 * (ch.scale?.y || 1); camera.updateMatrixWorld(); const d = v.distanceTo(camera.getWorldPosition(new THREE.Vector3())); const [x, y, z] = toScreen(v, camera);
  return { x, y, s: clamp((o.ref ?? 4.5) / Math.max(0.1, d), 0.12, 1.35), on: z < 1 && x > -200 && x < E.W + 200 && y > -100 && y < E.H + 300 }; }

// ---------------------------------------------------------------- static merge (big speed-up on CPU renderers)
// Merges every static opaque mesh that shares a look into one draw call. Anything the shot keeps a reference to
// (the object returned by init), characters, and objects with userData.dynamic = true stay separate and movable.
// The player calls this automatically after init(); set `optimize: false` on a shot to skip it.
const matKey = (m) => [m.type, m.color?.getHexString(), m.roughness, m.metalness, m.map?.uuid, m.emissive?.getHexString(), m.emissiveIntensity, m.emissiveMap?.uuid, m.side, m.flatShading, m.toneMapped, m.fog, m.gradientMap?.uuid, m.customProgramCacheKey?.(), m.opacity, m.vertexColors, m.envMapIntensity].join('|');
export function optimize(st, keep = []) {
  const keepSet = new Set(); const mark = (o) => { if (!o) return; if (Array.isArray(o)) return o.forEach(mark); if (o.isObject3D) o.traverse(x => keepSet.add(x)); else if (typeof o === 'object' && !o.isCamera && o.constructor === Object) Object.values(o).forEach(v => (v && (v.isObject3D || Array.isArray(v)) ? mark(v) : 0)); };
  mark(keep);
  st.scene.updateMatrixWorld(true);
  const buckets = new Map();
  st.scene.traverse(m => {
    if (!m.isMesh || m.isInstancedMesh || m.isSkinnedMesh || keepSet.has(m) || Array.isArray(m.material)) return;
    for (let p = m; p; p = p.parent) if (p.userData?.dynamic || p.name === 'character') return;
    const mt = m.material; if (mt.transparent || mt.isShaderMaterial || !m.geometry.attributes.position) return;
    const k = matKey(mt) + '|' + m.castShadow + m.receiveShadow; if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(m);
  });
  let before = 0, after = 0;
  for (const list of buckets.values()) {
    before += list.length; if (list.length < 2) { after += list.length; continue; }
    const geos = list.map(m => { let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrixWorld);
      for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
      if (!g.attributes.normal) g.computeVertexNormals(); if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.morphAttributes = {}; return g; });
    const merged = mergeGeometries(geos, false); geos.forEach(g => g.dispose()); if (!merged) { after += list.length; continue; }
    const mm = new THREE.Mesh(merged, list[0].material); mm.castShadow = list[0].castShadow; mm.receiveShadow = list[0].receiveShadow; mm.name = 'merged';
    list.forEach(m => m.parent?.remove(m)); st.scene.add(mm); after++;
  }
  return { before, after };
}

// re-export the rest of the 3D toolkit so shots only need `T`
export { character, POSES3, posesAt3, flow3, exprAt, walkPose3, breathe3, blendPose3, EXPRESSIONS, BODY } from './rig3d.js';
export { walkTo, idle3, speak3, lookAtSpeaker, handheld, chase, crashZoom, punch, dutch, rackFocus, pov, povArms, armWrestle, reachPose, body3, squash, climb, jump3, sitDown, turn3, throw3, throwHand, reachTo, toss, lockerDoor } from "./motion3d.js";
export { camShot, CAMS } from './camera10.js';   // 1.0 named camera framings
export * as W from './world3d.js';
export * as FX3 from './fx3d.js';
export { rng, key, smoothKey, ease, clamp, lerp, noise };
