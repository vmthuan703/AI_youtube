// engine/weather20.js — 2.0 weather you can see at once: GPU particles that are a pure function of the shot time.
//   T.wx.leaves(st, { area, n, colors, wind })     tumbling autumn leaves (lit, two-sided)
//   T.wx.rain(st, { area, n, wind })               streaks in depth + splash rings on the ground
//   T.wx.snow(st, { area, n, wind })               soft flakes, a few big ones close to the lens
//   T.wx.motes(st, { area, n })                    dust / pollen that glows in the sun
// area = [x0, x1, y0, y1, z0, z1]. Every helper registers itself with st.onTick, so the player animates it.
import * as THREE from 'three';
import { rng } from './core.js';

function quads(n, seed) { const g = new THREE.InstancedBufferGeometry(); g.index = new THREE.BufferAttribute(new Uint16Array([0, 1, 2, 2, 1, 3]), 1);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0]), 3));
  const r = rng(seed), a = new Float32Array(n * 4); for (let i = 0; i < a.length; i++) a[i] = r(); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n; return g; }
const COMMON = `attribute vec4 aSeed; uniform float uT, uSpeed, uSize; uniform vec3 uMin, uBox, uWind; varying vec2 vQ; varying float vS, vFade;
  vec3 fallPos(out float age) { vec3 p0 = uMin + aSeed.xyz * uBox; float fall = uSpeed * (0.7 + 0.6 * aSeed.w); float y = mod(p0.y - uMin.y - uT * fall, uBox.y); age = (uBox.y - y) / fall;
    vec3 p = vec3(p0.x, uMin.y + y, p0.z); p.xz += uWind.xz * age; p.x = uMin.x + mod(p.x - uMin.x, uBox.x); p.z = uMin.z + mod(p.z - uMin.z, uBox.z);
    vFade = smoothstep(0.0, 0.06, y / uBox.y) * smoothstep(0.0, 0.08, 1.0 - y / uBox.y); return p; }`;
function make(st, o, vs, fs, uniforms, extra = {}) {
  const a = o.area || [-10, 10, 0, 9, -8, 8], n = o.n || 400, g = quads(n, o.seed || 7);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: COMMON + vs, fragmentShader: fs, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...extra,
    uniforms: { uT: { value: 0 }, uSpeed: { value: o.speed ?? 1 }, uSize: { value: o.size ?? 0.1 }, uMin: { value: new THREE.Vector3(a[0], a[2], a[4]) }, uBox: { value: new THREE.Vector3(a[1] - a[0], a[3] - a[2], a[5] - a[4]) }, uWind: { value: new THREE.Vector3(...(o.wind || [0.6, 0, 0.2])) }, ...uniforms } }));
  m.frustumCulled = false; m.userData.dynamic = true; m.renderOrder = 5; st.scene.add(m); st.onTick((t) => { m.material.uniforms.uT.value = t + (o.t0 || 0); }); return m;
}

// ---------------------------------------------------------------- leaves
export function leaves(st, o = {}) {
  const cols = (o.colors || ['#c8442a', '#e8862a', '#f4c040', '#a8381a']).map(c => new THREE.Color(c));
  return make(st, { n: 260, speed: 1.1, size: 0.17, wind: [1.2, 0, 0.4], ...o }, `uniform vec3 uC[4], uSun; varying vec3 vC;
    void main(){ float age; vec3 p = fallPos(age); float tt = uT * (1.5 + aSeed.w * 2.0) + aSeed.x * 40.0;
      p.x += sin(tt * 0.9) * 0.35; p.z += cos(tt * 0.7 + aSeed.y * 6.0) * 0.3; p.y += sin(tt * 1.3) * 0.08;
      float a = tt * 1.7, b = tt * 1.1 + aSeed.z * 6.0; vec3 q = vec3(position.x * 1.0, position.y * 0.62, 0.0) * uSize * (0.7 + aSeed.y * 0.7);
      q = vec3(q.x * cos(a) - q.y * sin(a), q.x * sin(a) + q.y * cos(a), 0.0); vec3 nrm = vec3(0.0, sin(b), cos(b)); q = vec3(q.x, q.y * cos(b), -q.y * sin(b) + q.z);
      float idx = aSeed.z * 3.999; vC = idx < 1.0 ? uC[0] : idx < 2.0 ? uC[1] : idx < 3.0 ? uC[2] : uC[3]; float nl = abs(dot(nrm, uSun)); vC *= 0.55 + 0.9 * nl + 0.5 * (1.0 - nl);
      vQ = position.xy; vS = aSeed.w; gl_Position = projectionMatrix * viewMatrix * vec4(p + q, 1.0); }`,
    `varying vec2 vQ; varying vec3 vC; varying float vFade; void main(){ vec2 q = vQ * 2.0; float d = abs(q.x) * 0.9 + q.y * q.y * 1.1 + abs(q.y) * 0.25; if (d > 1.0) discard; gl_FragColor = vec4(vC * (0.85 + 0.3 * smoothstep(0.2, 0.0, abs(q.y))), vFade); }`,
    { uC: { value: cols }, uSun: { value: (st.sunDir || new THREE.Vector3(0, 1, 0)).clone() } });
}

// ---------------------------------------------------------------- rain: streaks + ground splashes
export function rain(st, o = {}) {
  const a = o.area || [-14, 14, 0, 11, -12, 10], c = new THREE.Color(o.color || '#c8d8ff');
  const streaks = make(st, { n: 2600, speed: 15, size: 0.02, wind: [1.6, 0, 0.3], ...o, area: a }, `uniform float uLen;
    void main(){ float age; vec3 p = fallPos(age); vec3 vel = normalize(vec3(uWind.x, -uSpeed * (0.7 + 0.6 * aSeed.w), uWind.z));
      vec4 mv = viewMatrix * vec4(p, 1.0); vec3 vv = normalize((viewMatrix * vec4(vel, 0.0)).xyz); vec2 up = normalize(vv.xy + 1e-5), rt = vec2(up.y, -up.x);
      mv.xy += rt * position.x * uSize * (0.6 + aSeed.x) + up * position.y * uLen * (0.6 + aSeed.w * 0.8);
      vQ = position.xy; vS = aSeed.z; gl_Position = projectionMatrix * mv; }`,
    `uniform vec3 uC; uniform float uA; varying vec2 vQ; varying float vS, vFade; void main(){ float a = smoothstep(0.5, 0.0, abs(vQ.x)) * smoothstep(0.5, 0.2, abs(vQ.y)); gl_FragColor = vec4(uC, a * uA * (0.4 + 0.6 * vS) * vFade); }`,
    { uLen: { value: o.len ?? 0.75 }, uC: { value: c }, uA: { value: o.opacity ?? 0.42 } }, { blending: THREE.AdditiveBlending });
  // splash rings: each lives 0.45 s at a fixed spot, then moves on
  const n = o.splashes ?? 700, g = quads(n, 31), m = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uMin: { value: new THREE.Vector3(a[0], o.groundY ?? 0.03, a[4]) }, uBox: { value: new THREE.Vector3(a[1] - a[0], 0, a[5] - a[4]) }, uC: { value: c } },
    vertexShader: `attribute vec4 aSeed; uniform float uT; uniform vec3 uMin, uBox; varying vec2 vQ; varying float vK;
      void main(){ float per = 0.4 + aSeed.w * 0.3, ph = uT / per + aSeed.z * 9.0, cyc = floor(ph); vK = fract(ph);
        vec2 h = fract(sin(vec2(dot(vec2(cyc, aSeed.x * 91.0), vec2(127.1, 311.7)), dot(vec2(cyc, aSeed.y * 73.0), vec2(269.5, 183.3)))) * 43758.5453);
        vec3 p = uMin + vec3(h.x, 0.0, h.y) * uBox; float s = 0.06 + vK * 0.24; p.xz += position.xy * s; vQ = position.xy * 2.0; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform vec3 uC; varying vec2 vQ; varying float vK; void main(){ float r = length(vQ); float ring = smoothstep(0.62, 0.8, r) * smoothstep(1.0, 0.86, r); gl_FragColor = vec4(uC, ring * (1.0 - vK) * 0.55); }` }));
  m.frustumCulled = false; m.userData.dynamic = true; m.renderOrder = 4; st.scene.add(m); st.onTick((t) => { m.material.uniforms.uT.value = t + 3; });
  return { streaks, splashes: m };
}

// ---------------------------------------------------------------- snow
export function snow(st, o = {}) {
  const fs = `varying vec2 vQ; varying float vS, vFade; uniform vec3 uC; uniform float uA; void main(){ float r = length(vQ) * 2.0; float a = smoothstep(1.0, 0.25, r); gl_FragColor = vec4(uC, a * uA * vFade * (0.55 + 0.45 * vS)); }`;
  const vs = `void main(){ float age; vec3 p = fallPos(age); float tt = uT * (0.6 + aSeed.w) + aSeed.x * 30.0; p.x += sin(tt) * 0.35 + sin(tt * 2.3) * 0.1; p.z += cos(tt * 0.8) * 0.3;
      vec4 mv = viewMatrix * vec4(p, 1.0); mv.xy += position.xy * uSize * (0.5 + aSeed.y * 1.2); vQ = position.xy; vS = aSeed.z; gl_Position = projectionMatrix * mv; }`;
  const U = () => ({ uC: { value: new THREE.Color(o.color || '#ffffff') }, uA: { value: o.opacity ?? 0.9 } });
  const far = make(st, { n: 2200, speed: 1.25, size: 0.055, wind: [0.5, 0, 0.15], area: [-18, 18, 0, 12, -16, 10], ...o }, vs, fs, U());
  // a few big soft flakes right in front of the lens: depth without a depth-of-field pass
  const near = o.near === false ? null : make(st, { n: o.nearN ?? 46, speed: 1.0, size: 0.085, wind: [0.4, 0, 0.1], seed: 19, area: o.nearArea || [-2.5, 2.5, 0.2, 3.2, 1.5, 5.5] }, vs, fs, { uC: { value: new THREE.Color('#ffffff') }, uA: { value: 0.5 } });
  return { far, near };
}

// ---------------------------------------------------------------- motes: slow glowing dust in the sun
export function motes(st, o = {}) {
  return make(st, { n: 220, speed: 0.06, size: 0.03, wind: [0.25, 0, 0.1], area: [-6, 6, 0.2, 4.5, -4, 5], ...o },
    `void main(){ float age; vec3 p = fallPos(age); float tt = uT * 0.4 + aSeed.x * 30.0; p += vec3(sin(tt), cos(tt * 0.7), sin(tt * 0.5 + 2.0)) * 0.3; vec4 mv = viewMatrix * vec4(p, 1.0); mv.xy += position.xy * uSize * (0.4 + aSeed.y); vQ = position.xy; vS = 0.5 + 0.5 * sin(tt * 3.0 + aSeed.z * 6.0); gl_Position = projectionMatrix * mv; }`,
    `varying vec2 vQ; varying float vS, vFade; uniform vec3 uC; void main(){ float a = smoothstep(0.5, 0.0, length(vQ)); gl_FragColor = vec4(uC * 2.0, a * a * vS * vFade * 0.8); }`,
    { uC: { value: new THREE.Color(o.color || '#ffd9a0') } }, { blending: THREE.AdditiveBlending });
}
