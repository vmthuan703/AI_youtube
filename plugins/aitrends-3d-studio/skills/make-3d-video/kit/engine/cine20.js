// engine/cine20.js — 2.0 "film" picture: one call gives a shot a real sky, a sun, weather light and a lens.
//   const st = T.cine.stage(T, { look: 'goldenHour', fov: 32, dof: {...} });
// Looks (time of day + weather light): goldenHour · clearDay · rainNight · snowDusk · overcast · fogMorning.
// What it adds on top of T.stage:
//   · a shader sky (gradient by sun height, sun disc and glow, drifting lit clouds, stars)
//   · screen-space ambient occlusion from a depth pre-pass (contact darkening everywhere, coloured, not black)
//   · height fog with sun in-scatter (aerial perspective: far things fade toward the sky colour)
//   · god rays from the sun through trees, roofs and people
//   · a lens pass after tone mapping: split-tone grade, soft S-curve, chromatic aberration at the edges
// Everything is a pure function of the shot time (st.tick(t)), so frames are identical in every worker.
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { E, S } from './core.js';

const C = (c) => new THREE.Color(c);
const V3 = (a) => new THREE.Vector3(...a);

// ---------------------------------------------------------------- looks
// sun: direction TO the sun. zen/hor/gnd: sky colours. key/amb/ambGnd: light colours. fog: [density, height falloff, max].
export const LOOKS = {
  goldenHour: { mood: 'golden', sun: [-0.62, 0.2, -0.76], sunCol: '#ffb469', key: '#ffc078', keyI: 4.8, zen: '#3460c0', hor: '#f6b890', gnd: '#6a5a58', amb: '#9db4e6', ambGnd: '#9a7a5a', ambI: 1.25,
    fill: '#ffd0a8', fillI: 0.35, cover: 0.42, cloudLit: '#ffd9b0', cloudDark: '#8a6f9a', fog: [0.0055, 0.1, 0.62], fogCol: '#eab08a', fogSun: '#ffc88a', rays: 0.85, ao: 0.9, aoTint: '#3a2a5a',
    exposure: 1.0, bloom: 0.5, bloomT: 0.92, stars: 0, grade: { shadow: '#1f3a5c', high: '#ffe2bc', split: 0.22, contrast: 1.1, sat: 1.1, ca: 0.0014 } },
  clearDay: { mood: 'day', sun: [-0.45, 0.62, -0.5], sunCol: '#fff3d6', key: '#fff1d6', keyI: 4.2, zen: '#2f6fd2', hor: '#bfdcf6', gnd: '#6f7a6a', amb: '#a8c6ff', ambGnd: '#7a8a60', ambI: 1.15,
    fill: '#e0ecff', fillI: 0.3, cover: 0.36, cloudLit: '#ffffff', cloudDark: '#9aa8c8', fog: [0.003, 0.07, 0.5], fogCol: '#cfe0f4', fogSun: '#fff2d8', rays: 0.35, ao: 0.85, aoTint: '#2a3a6a',
    exposure: 1.0, bloom: 0.38, bloomT: 0.96, stars: 0, grade: { shadow: '#1f3f66', high: '#fff2dc', split: 0.14, contrast: 1.08, sat: 1.12, ca: 0.0012 } },
  rainNight: { mood: 'night', sun: [0.4, 0.55, -0.6], sunCol: '#8fa8e8', key: '#7f9ae6', keyI: 1.1, zen: '#070b1c', hor: '#1c2748', gnd: '#0c1020', amb: '#3a4c86', ambGnd: '#262a48', ambI: 1.35,
    fill: '#6a80c8', fillI: 0.25, cover: 0.85, cloudLit: '#2c3862', cloudDark: '#0c1226', fog: [0.016, 0.05, 0.7], fogCol: '#1c2850', fogSun: '#2a3a6a', rays: 0, ao: 0.8, aoTint: '#05081a',
    exposure: 1.3, bloom: 0.6, bloomT: 0.9, stars: 0, moon: false, grade: { shadow: '#0f2c4a', high: '#ffd9a8', split: 0.3, contrast: 1.12, sat: 1.12, ca: 0.0018 } },
  snowDusk: { mood: 'snow', sun: [-0.7, 0.16, -0.7], sunCol: '#ffb0a0', key: '#ffd2c4', keyI: 2.4, zen: '#1c2a66', hor: '#e69ab0', gnd: '#5a6088', amb: '#7f96e0', ambGnd: '#8a92c8', ambI: 1.25,
    fill: '#ffc4b4', fillI: 0.35, cover: 0.5, cloudLit: '#f2a8b4', cloudDark: '#3a3f7a', fog: [0.007, 0.06, 0.6], fogCol: '#9a94cc', fogSun: '#f0a8b0', rays: 0.25, ao: 0.85, aoTint: '#1a2460',
    exposure: 1.0, bloom: 0.55, bloomT: 0.92, stars: 0.5, grade: { shadow: '#16306a', high: '#ffe6d0', split: 0.24, contrast: 1.08, sat: 1.08, ca: 0.0014 } },
  overcast: { mood: 'storm', sun: [-0.3, 0.7, -0.4], sunCol: '#dfe6f2', key: '#dfe6f4', keyI: 1.3, zen: '#6a7890', hor: '#aab4c4', gnd: '#5a6068', amb: '#c0cce0', ambGnd: '#70786a', ambI: 1.5,
    fill: '#c8d4e8', fillI: 0.3, cover: 0.95, cloudLit: '#c6ccd8', cloudDark: '#6a7488', fog: [0.02, 0.05, 0.85], fogCol: '#a4aebc', fogSun: '#c4ccd8', rays: 0, ao: 1.0, aoTint: '#1c2434',
    exposure: 1.0, bloom: 0.35, bloomT: 0.95, stars: 0, grade: { shadow: '#1c3448', high: '#f0ece0', split: 0.18, contrast: 1.1, sat: 0.98, ca: 0.0012 } },
  dusk: { mood: 'dusk', sun: [-0.66, 0.1, -0.74], sunCol: '#ff9a6a', key: '#ffb08a', keyI: 2.6, zen: '#27306e', hor: '#f29a80', gnd: '#4a4460', amb: '#8a8ad8', ambGnd: '#7a5a6a', ambI: 1.25,
    fill: '#b8a0e0', fillI: 0.4, cover: 0.45, cloudLit: '#ffb090', cloudDark: '#4a3a78', fog: [0.007, 0.08, 0.62], fogCol: '#b88aa8', fogSun: '#ffa880', rays: 0.6, ao: 0.9, aoTint: '#2a1e5a',
    exposure: 1.05, bloom: 0.6, bloomT: 0.9, stars: 0.35, grade: { shadow: '#22306a', high: '#ffdcc0', split: 0.24, contrast: 1.08, sat: 1.1, ca: 0.0014 } },
  night: { mood: 'night', sun: [0.45, 0.5, -0.74], sunCol: '#b8c8ff', key: '#93a8f0', keyI: 1.7, zen: '#060a22', hor: '#232e5e', gnd: '#0c1020', amb: '#4458a0', ambGnd: '#34345c', ambI: 2.1,
    fill: '#7a8ad8', fillI: 0.3, cover: 0.3, cloudLit: '#3a4878', cloudDark: '#0e1430', fog: [0.008, 0.06, 0.6], fogCol: '#1a2450', fogSun: '#3a4a88', rays: 0, ao: 0.85, aoTint: '#060a22', face: 0.5, rim: 0.9,
    exposure: 1.4, bloom: 0.6, bloomT: 0.9, stars: 1, disc: 0.5, grade: { shadow: '#10285a', high: '#ffdcb0', split: 0.28, contrast: 1.1, sat: 1.12, ca: 0.0016 } },
  rainDay: { mood: 'storm', sun: [-0.3, 0.7, -0.4], sunCol: '#d4dcec', key: '#d0d8ea', keyI: 1.1, zen: '#566478', hor: '#98a4b6', gnd: '#4a5058', amb: '#b4c0d8', ambGnd: '#687064', ambI: 1.45,
    fill: '#c0cce0', fillI: 0.3, cover: 1.0, cloudLit: '#b0b8c6', cloudDark: '#566070', fog: [0.026, 0.05, 0.86], fogCol: '#98a2b2', fogSun: '#b4bcc8', rays: 0, ao: 1.0, aoTint: '#18202e', face: 0.2,
    exposure: 1.02, bloom: 0.4, bloomT: 0.94, stars: 0, disc: 0, grade: { shadow: '#18344c', high: '#ecebe0', split: 0.22, contrast: 1.1, sat: 0.96, ca: 0.0012 } },
  snowDay: { mood: 'snow', sun: [-0.5, 0.42, -0.6], sunCol: '#fff0dc', key: '#fff0e0', keyI: 3.0, zen: '#4a78d0', hor: '#d4e2f6', gnd: '#b8c2dc', amb: '#b8ccff', ambGnd: '#c8d0ec', ambI: 1.2,
    fill: '#e0e8ff', fillI: 0.35, cover: 0.4, cloudLit: '#ffffff', cloudDark: '#a8b4d4', fog: [0.008, 0.06, 0.65], fogCol: '#dce4f6', fogSun: '#fff4e0', rays: 0.3, ao: 0.8, aoTint: '#2a3c7a',
    exposure: 0.95, bloom: 0.4, bloomT: 0.97, stars: 0, grade: { shadow: '#1c3a70', high: '#fff4e4', split: 0.16, contrast: 1.06, sat: 1.06, ca: 0.0012 } },
  // interiors keep the set's own lamps and windows; the film pass adds contact shadows and the lens
  interiorWarm: { mood: 'interiorWarm', interior: true, sun: [-0.5, 0.5, 0.5], sunCol: '#ffd0a0', fog: [0, 0.1, 0], fogCol: '#000000', fogSun: '#000000', rays: 0, ao: 0.95, aoTint: '#2a1420', aoRadius: 0.4,
    grade: { shadow: '#2a2444', high: '#ffe4c0', split: 0.16, contrast: 1.03, sat: 1.08, ca: 0.0012 } },
  interiorCool: { mood: 'interiorCool', interior: true, sun: [-0.5, 0.5, 0.5], sunCol: '#d0e0ff', fog: [0, 0.1, 0], fogCol: '#000000', fogSun: '#000000', rays: 0, ao: 0.95, aoTint: '#141a34', aoRadius: 0.4,
    grade: { shadow: '#1c2c50', high: '#fff0dc', split: 0.16, contrast: 1.03, sat: 1.06, ca: 0.0012 } },
  plain: { mood: 'void', interior: true, sun: [0, 1, 0], sunCol: '#ffffff', fog: [0, 0.1, 0], fogCol: '#000000', fogSun: '#000000', rays: 0, ao: 0.7, aoTint: '#101020', aoRadius: 0.4,
    grade: { shadow: '#202040', high: '#ffffff', split: 0.08, contrast: 1.04, sat: 1.04, ca: 0.001 } },
  fogMorning: { mood: 'sunrise', sun: [0.6, 0.14, -0.78], sunCol: '#ffd0a0', key: '#ffd8b0', keyI: 2.6, zen: '#6a86c0', hor: '#f4d4c0', gnd: '#7a7470', amb: '#c0c8e8', ambGnd: '#8a8070', ambI: 1.1,
    fill: '#ffe0c8', fillI: 0.3, cover: 0.3, cloudLit: '#ffe6d0', cloudDark: '#a89ab8', fog: [0.05, 0.16, 0.92], fogCol: '#e6d2c8', fogSun: '#ffdcb4', rays: 1.1, ao: 0.8, aoTint: '#3a3050',
    exposure: 1.0, bloom: 0.55, bloomT: 0.9, stars: 0, grade: { shadow: '#2a3a5c', high: '#ffeed8', split: 0.18, contrast: 1.04, sat: 1.02, ca: 0.0012 } },
};

// ---------------------------------------------------------------- sky
const NOISE = `
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return s; }`;
function skyDome(st, L) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(450, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { zen: { value: C(L.zen) }, hor: { value: C(L.hor) }, gnd: { value: C(L.gnd) }, sunCol: { value: C(L.sunCol) }, sunDir: { value: V3(L.sun).normalize() }, cloudLit: { value: C(L.cloudLit) }, cloudDark: { value: C(L.cloudDark) },
      cover: { value: L.cover }, uT: { value: 0 }, stars: { value: L.stars || 0 }, disc: { value: L.disc ?? 1 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 zen, hor, gnd, sunCol, sunDir, cloudLit, cloudDark; uniform float cover, uT, stars, disc; varying vec3 vD; ${NOISE}
      void main(){ vec3 d = normalize(vD); float y = d.y, sd = max(dot(d, sunDir), 0.0);
        vec3 c = mix(hor, zen, pow(clamp(y, 0.0, 1.0), 0.5));
        c += sunCol * (pow(sd, 5.0) * 0.22 + pow(sd, 40.0) * 0.5);                       // glow round the sun
        c = mix(c, hor * 1.06 + sunCol * pow(sd, 3.0) * 0.35, pow(1.0 - clamp(y, 0.0, 1.0), 7.0) * 0.75);   // horizon haze
        if (stars > 0.0) { vec2 sp = d.xz / (abs(y) + 0.35) * 90.0; float s = hash(floor(sp)); vec2 f = fract(sp) - 0.5; c += vec3(1.0, 0.95, 0.9) * step(0.985, s) * smoothstep(0.3, 0.0, length(f)) * stars * smoothstep(0.05, 0.4, y) * 1.6; }
        c += sunCol * smoothstep(0.9993, 0.9997, sd) * 9.0 * disc;                       // the disc, bright enough to bloom
        if (y > 0.0 && cover > 0.0) { vec2 p = d.xz / (y + 0.14) * 0.85 + vec2(uT * 0.012, uT * 0.004);
          float n = fbm(p), n2 = fbm(p + sunDir.xz * 0.22 + 0.03), cl = smoothstep(1.0 - cover - 0.04, 1.0 - cover + 0.3, n + 0.18);
          float lit = clamp((n - n2) * 3.2 + 0.55, 0.0, 1.0);
          vec3 cc = mix(cloudDark, cloudLit, lit) + sunCol * pow(sd, 6.0) * (1.0 - cl) * 1.2;   // silver lining toward the sun
          c = mix(c, cc, cl * smoothstep(0.0, 0.16, y) * 0.94); }
        if (y < 0.0) c = mix(c, gnd, smoothstep(0.0, -0.12, y));
        gl_FragColor = vec4(c, 1.0); }` }));
  m.renderOrder = -10; m.name = 'skyDome'; m.frustumCulled = false; m.userData.dynamic = true; m.userData.noDepth = true; st.scene.background = null; st.scene.add(m);
  st.onTick((t) => { m.position.copy(st.camera.position); m.material.uniforms.uT.value = t + (globalThis.E3D_T || 0) * 0; });
  return m;
}

// ---------------------------------------------------------------- the cine pass: depth pre-pass → AO → fog + god rays
const FSV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const VIEWPOS = `uniform sampler2D tDepth; uniform mat4 projInv; uniform vec2 px;
  vec3 viewPos(vec2 uv){ float d = texture2D(tDepth, uv).x; vec4 v = projInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return v.xyz / v.w; }`;
const AO_FS = `varying vec2 vUv; uniform float radius; uniform mat4 proj; ${VIEWPOS}
  void main(){ float d0 = texture2D(tDepth, vUv).x; if (d0 >= 0.99999) { gl_FragColor = vec4(1.0, 1e4, 0.0, 1.0); return; }
    vec3 P = viewPos(vUv);
    vec3 a1 = viewPos(vUv + vec2(px.x, 0.0)) - P, a2 = P - viewPos(vUv - vec2(px.x, 0.0)), b1 = viewPos(vUv + vec2(0.0, px.y)) - P, b2 = P - viewPos(vUv - vec2(0.0, px.y));
    vec3 n = normalize(cross(abs(a1.z) < abs(a2.z) ? a1 : a2, abs(b1.z) < abs(b2.z) ? b1 : b2));
    float z = -P.z, rr = radius * (1.0 + z * 0.06), ru = min(rr * proj[1][1] * 0.5 / z, 0.09);
    vec2 fc = mod(gl_FragCoord.xy, 4.0); float jit = (fc.x * 4.0 + fc.y) / 16.0 * 6.2831853;
    float occ = 0.0;
    for (int i = 0; i < 14; i++) { float fi = float(i), a = fi * 2.3999632 + jit, r = sqrt((fi + 0.5) / 14.0) * ru;
      vec2 o = vec2(cos(a) * proj[0][0] / proj[1][1], sin(a)) * r; vec3 v = viewPos(vUv + o) - P; float l = length(v) + 1e-4;
      occ += max(0.0, dot(n, v) / l - 0.1) * (1.0 - smoothstep(rr * 0.5, rr * 1.6, l)); }
    float ao = clamp(1.0 - occ / 14.0 * 2.3, 0.0, 1.0);
    gl_FragColor = vec4(mix(ao, 1.0, smoothstep(50.0, 110.0, z)), z, 0.0, 1.0); }`;
const MIX_FS = `varying vec2 vUv; uniform sampler2D tDiffuse, tAO; uniform mat4 camWorld; uniform vec3 camPos, fogCol, fogSun, sunDir, sunCol, aoTint; uniform vec3 fogP; uniform float aoK, rays, sunVis, aspect; uniform vec2 sunUV; ${VIEWPOS}
  void main(){ vec4 src = texture2D(tDiffuse, vUv); vec3 c = src.rgb; float d0 = texture2D(tDepth, vUv).x;
    // ambient occlusion: a 4x4 box blur removes the 4x4 sampling pattern; samples across a depth edge are left out
    vec2 cen = texture2D(tAO, vUv).xy; float z0 = cen.y, s = 0.0, w = 0.0;
    for (int i = 0; i < 4; i++) for (int j = 0; j < 4; j++) { vec2 t = texture2D(tAO, vUv + (vec2(float(i), float(j)) - 1.5) * px).xy; float k = 1.0 / (1.0 + abs(t.y - z0) / (0.02 * z0 + 0.01) * 0.6); s += t.x * k; w += k; }
    float ao = mix(1.0, s / w, aoK); float lum = dot(c, vec3(0.3, 0.6, 0.1));
    c *= mix(mix(aoTint, vec3(1.0), ao), vec3(1.0), smoothstep(1.2, 3.0, lum));                        // lamps and glows are not darkened
    vec3 vp = viewPos(vUv); vec3 rd = normalize((camWorld * vec4(normalize(vp), 0.0)).xyz);
    if (d0 < 0.99999) {   // height fog with sun in-scatter
      float t = length(vp), b = fogP.y, ry = abs(rd.y) < 1e-3 ? 1e-3 : rd.y;
      float f = fogP.x * exp(-max(camPos.y, 0.0) * b) * (1.0 - exp(-t * ry * b)) / (ry * b);
      f = clamp(1.0 - exp(-f), 0.0, fogP.z);
      c = mix(c, mix(fogCol, fogSun, pow(max(dot(rd, sunDir), 0.0), 6.0)), f); }
    if (rays > 0.0 && sunVis > 0.0) {   // god rays: march toward the sun on screen, count the sky that is not blocked
      vec2 dir = sunUV - vUv; float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))), acc = 0.0, wsum = 0.0;
      for (int i = 0; i < 36; i++) { float k = (float(i) + jit) / 36.0; vec2 u = vUv + dir * k; float wgt = 1.0 - k * 0.55;
        vec2 dd = (u - sunUV) * vec2(aspect, 1.0); float near = smoothstep(0.75, 0.0, length(dd));
        float sky = (u.x < 0.0 || u.x > 1.0 || u.y < 0.0 || u.y > 1.0) ? 0.35 : step(0.99999, texture2D(tDepth, u).x);
        acc += sky * near * wgt; wsum += wgt; }
      vec2 d2 = (vUv - sunUV) * vec2(aspect, 1.0);
      c += sunCol * (acc / wsum) * rays * sunVis * smoothstep(1.5, 0.0, length(d2)) * 0.6; }
    gl_FragColor = vec4(c, src.a); }`;
const LENS_FS = `varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec3 shadowC, highC; uniform float split, contrast, sat, ca;
  void main(){ vec2 d = vUv - 0.5; float r2 = dot(d, d);
    vec3 c = vec3(texture2D(tDiffuse, 0.5 + d * (1.0 + ca * r2 * 4.0)).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, 0.5 + d * (1.0 - ca * r2 * 4.0)).b);
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(c, c * mix(shadowC * 2.2, vec3(1.0), smoothstep(0.0, 0.45, l)), split);                    // shadows lean to the shadow colour
    c = mix(c, 1.0 - (1.0 - c) * (1.0 - highC * 0.25), split * smoothstep(0.45, 1.0, l));             // highlights lean warm
    c = mix(vec3(l), c, sat);
    c = clamp(c, 0.0, 1.0); vec3 sc = c * c * (3.0 - 2.0 * c); c = mix(c, sc, (contrast - 1.0) * 3.0);    // soft S-curve
    gl_FragColor = vec4(c, 1.0); }`;

class CinePass extends Pass {
  constructor(st, L, w, h) {
    super(); this.st = st; this.L = L; this.needsSwap = true;
    this.depthRT = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    this.depthRT.depthTexture = new THREE.DepthTexture(w, h, THREE.UnsignedIntType); this.depthRT.depthTexture.minFilter = this.depthRT.depthTexture.magFilter = THREE.NearestFilter;
    this.aoRT = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
    this.depthMat = new THREE.MeshBasicMaterial({ colorWrite: false });
    const px = new THREE.Vector2(1 / w, 1 / h), dt = this.depthRT.depthTexture;
    this.ao = new FullScreenQuad(new THREE.ShaderMaterial({ vertexShader: FSV, fragmentShader: AO_FS, depthTest: false, depthWrite: false,
      uniforms: { tDepth: { value: dt }, projInv: { value: new THREE.Matrix4() }, proj: { value: new THREE.Matrix4() }, px: { value: px }, radius: { value: L.aoRadius ?? 0.55 } } }));
    this.mix = new FullScreenQuad(new THREE.ShaderMaterial({ vertexShader: FSV, fragmentShader: MIX_FS, depthTest: false, depthWrite: false,
      uniforms: { tDiffuse: { value: null }, tAO: { value: this.aoRT.texture }, tDepth: { value: dt }, projInv: { value: new THREE.Matrix4() }, px: { value: px }, camWorld: { value: new THREE.Matrix4() }, camPos: { value: new THREE.Vector3() },
        fogCol: { value: C(L.fogCol) }, fogSun: { value: C(L.fogSun) }, fogP: { value: new THREE.Vector3(...L.fog) }, sunDir: { value: V3(L.sun).normalize() }, sunCol: { value: C(L.sunCol) }, aoTint: { value: C(L.aoTint) },
        aoK: { value: L.ao }, rays: { value: L.rays }, sunVis: { value: 0 }, sunUV: { value: new THREE.Vector2() }, aspect: { value: w / h } } }));
    this.hidden = [];
  }
  render(renderer, writeBuffer, readBuffer) {
    const { scene, camera } = this.st, hid = this.hidden; hid.length = 0;
    scene.traverse(o => { if (!o.visible || !(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return; const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (o.isSprite || o.isPoints || o.isLine || !m || m.transparent || m.depthWrite === false || o.userData.noDepth) { o.visible = false; hid.push(o); } });
    const au = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false; scene.overrideMaterial = this.depthMat;
    renderer.setRenderTarget(this.depthRT); renderer.clear(); renderer.render(scene, camera);
    scene.overrideMaterial = null; renderer.shadowMap.autoUpdate = au; for (const o of hid) o.visible = true;
    const A = this.ao.material.uniforms, M = this.mix.material.uniforms;
    A.projInv.value.copy(camera.projectionMatrixInverse); A.proj.value.copy(camera.projectionMatrix);
    if (this.st.own && !this.checked) { this.checked = true; indoorCheck(this.st, this); }
    renderer.setRenderTarget(this.aoRT); this.ao.render(renderer);
    M.tDiffuse.value = readBuffer.texture; M.projInv.value.copy(camera.projectionMatrixInverse); M.camWorld.value.copy(camera.matrixWorld); M.camPos.value.setFromMatrixPosition(camera.matrixWorld);
    const sv = M.sunDir.value.clone().transformDirection(camera.matrixWorldInverse);   // the sun in view space: in front of the lens when z < 0
    if (sv.z < -0.02) { const p = M.sunDir.value.clone().multiplyScalar(400).add(M.camPos.value).project(camera); M.sunUV.value.set(p.x * 0.5 + 0.5, p.y * 0.5 + 0.5); M.sunVis.value = THREE.MathUtils.smoothstep(-sv.z, 0.02, 0.45); } else M.sunVis.value = 0;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.mix.render(renderer);
  }
  dispose() { this.depthRT.dispose(); this.aoRT.dispose(); this.depthMat.dispose(); this.ao.dispose(); this.mix.dispose(); }
}
class LensPass extends Pass {
  constructor(g) { super(); this.needsSwap = true;
    this.q = new FullScreenQuad(new THREE.ShaderMaterial({ vertexShader: FSV, fragmentShader: LENS_FS, depthTest: false, depthWrite: false,
      uniforms: { tDiffuse: { value: null }, shadowC: { value: new THREE.Color().setStyle(g.shadow, THREE.SRGBColorSpace).convertLinearToSRGB() }, highC: { value: new THREE.Color().setStyle(g.high, THREE.SRGBColorSpace).convertLinearToSRGB() },
        split: { value: g.split }, contrast: { value: g.contrast }, sat: { value: g.sat }, ca: { value: g.ca } } })); }
  render(renderer, writeBuffer, readBuffer) { this.q.material.uniforms.tDiffuse.value = readBuffer.texture; renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.q.render(renderer); }
  dispose() { this.q.dispose(); }
}

// A room built with an outdoor mood (a diner by day, a gym) must not get sun, haze and god rays inside it. On the first frame five
// rays go up from the camera; when a ceiling is there, the stage gets its own lamps back and keeps only the sky (seen through
// windows), contact shadows and the lens. { indoor: true | false } on the stage settles it by hand; outdoor sets set st.outdoor.
function indoorCheck(st, pass) {
  const own = st.own; let indoor = own.indoor;
  if (indoor == null && !st.outdoor) { const rc = new THREE.Raycaster(), from = st.camera.getWorldPosition(new THREE.Vector3()), list = []; rc.far = 14;
    st.scene.traverse(m => { if (m.isMesh && m.visible && !m.userData.noDepth && !m.material.transparent && m.name !== 'skyDome') list.push(m); });
    let hits = 0; for (const d of [[0, 1, 0], [0.5, 0.86, 0], [-0.5, 0.86, 0], [0, 0.86, 0.5], [0, 0.86, -0.5]]) { rc.set(from, new THREE.Vector3(...d).normalize()); if (rc.intersectObjects(list, false).length) hits++; }
    indoor = hits >= 4; }
  if (!indoor) return;
  st.indoor = true; st.sun.position.copy(own.sunP); st.sun.color.copy(own.sunC); st.sun.intensity = own.sunI; st.hemi.color.copy(own.hemiC); st.hemi.groundColor.copy(own.hemiG); st.hemi.intensity = own.hemiI;
  st.fill.color.copy(own.fillC); st.fill.intensity = own.fillI; st.fill.position.copy(own.fillP); if (st.faceLight) st.faceLight.intensity = own.face; Object.assign(st.rimState, own.rim); st.activate();
  if (st.bloom && own.bloom) { st.bloom.strength = own.bloom[0]; st.bloom.threshold = own.bloom[1]; } st.exp = 1.1;
  const M = pass.mix.material.uniforms; M.fogP.value.set(0, 0.1, 0); M.rays.value = 0; pass.ao.material.uniforms.radius.value = 0.4;
}

// ---------------------------------------------------------------- looks by mood and weather
// A set that only names a mood (T.stage({ mood: 'night' })) still gets the film picture: the mood picks the look.
// shots.json can name them per shot: "look": "goldenHour", "weather": "rain" | "snow" | "leaves" | "fog" | "wind" | "storm".
export const MOOD_LOOK = { day: 'clearDay', golden: 'goldenHour', dusk: 'dusk', night: 'night', storm: 'overcast', interiorWarm: 'interiorWarm', interiorCool: 'interiorCool', beach: 'clearDay', sunrise: 'goldenHour',
  snow: 'snowDay', arctic: 'night', underwater: 'plain', void: 'plain' };
const DARK = /night|dusk|arctic|storm/;
export function lookFor(mood, weather) {
  if (weather === 'rain' || weather === 'storm') return DARK.test(mood) ? 'rainNight' : 'rainDay';
  if (weather === 'snow') return /interior/.test(mood) ? MOOD_LOOK[mood] : /night|dusk|golden|arctic/.test(mood) ? 'snowDusk' : 'snowDay';
  if (weather === 'fog') return /interior/.test(mood) ? MOOD_LOOK[mood] : 'fogMorning';
  return MOOD_LOOK[mood] || 'plain';
}

// apply(T, st, o): turn a finished T.stage into a film stage. T.stage calls it by itself when the style is `cine` (or o.look is given).
export function apply(T, st, o = {}) {
  const shot = E.curShot || {}, weather = o.weather ?? shot.weather ?? null, name = o.look || shot.look || lookFor(st.moodName, weather), base = LOOKS[name] || LOOKS.plain;
  const L = { ...base, ...(o.cine || {}) }; for (const k of ['sun', 'rays', 'ao', 'cover', 'stars']) if (o[k] != null) L[k] = o[k]; L.grade = { ...base.grade, ...(o.grade || {}) };
  if (o.fogCine) L.fog = o.fogCine;
  const sun = V3(L.sun).normalize(); st.look = L; st.lookName = name; st.sunDir = sun; st.weather = weather;
  st.scene.fog = null;
  if (!L.interior) {
    st.own = { sunP: st.sun.position.clone(), sunC: st.sun.color.clone(), sunI: st.sun.intensity, hemiC: st.hemi.color.clone(), hemiG: st.hemi.groundColor.clone(), hemiI: st.hemi.intensity, fillC: st.fill.color.clone(), fillI: st.fill.intensity, fillP: st.fill.position.clone(),
      face: st.faceLight?.intensity, rim: { ...st.rimState }, bloom: st.bloom ? [st.bloom.strength, st.bloom.threshold] : null, indoor: o.indoor };
    const tgt = st.sun.target.position; st.sun.position.copy(tgt).addScaledVector(sun, 40); st.sun.color.set(L.key); st.sun.intensity = L.keyI;
    st.sun.shadow.radius = 4; st.sun.shadow.bias = -0.0003; st.sun.shadow.normalBias = 0.04;
    st.hemi.color.set(L.amb); st.hemi.groundColor.set(L.ambGnd); st.hemi.intensity = L.ambI;
    st.fill.color.set(L.fill); st.fill.intensity = L.fillI; st.fill.position.copy(sun.clone().multiplyScalar(-10).setY(4));
    if (st.faceLight && o.faceLight == null) st.faceLight.intensity = L.face ?? 0;
    Object.assign(st.rimState, { color: o.rim || L.sunCol, strength: o.rimStrength ?? L.rim ?? 0.75, dir: sun.toArray(), sss: o.sss ?? L.sss ?? 0.5 }); st.activate();
    st.exp = L.exposure * (o.exposure ?? 1);
    if (st.bloom && o.bloom == null) { st.bloom.strength = L.bloom; st.bloom.threshold = o.bloomThreshold ?? L.bloomT; }
    if (L.sky !== false && o.skyCine !== false) st.sky = skyDome(st, L);
  }
  const w = Math.round(E.W * E.PX), h = Math.round(E.H * E.PX), cp = new CinePass(st, L, w, h), lp = new LensPass(L.grade);
  st.composer.insertPass(cp, 1); st.composer.insertPass(lp, st.composer.passes.findIndex(p => p.isOutputPass || p.constructor.name === 'OutputPass') + 1);
  st.cine = cp; st.lens = lp; if (L.interior) st.exp = 1.1;
  // weather named in shots.json (or o.weather) falls round the action: o.wxAt = [x, z] centre, o.wxSize = half width
  if (weather && T.wx && !/interior/.test(st.moodName) && o.weatherFx !== false) { const [cx, cz] = o.wxAt || [0, 0], r = o.wxSize || 16, area = [cx - r, cx + r, 0, 11, cz - r * 0.8, cz + r * 0.8];
    if (weather === 'rain' || weather === 'storm') st.wx = T.wx.rain(st, { area, n: weather === 'storm' ? 4200 : 3000, wind: weather === 'storm' ? [4.5, 0, 1] : [2.2, 0, 0.5], len: 0.5, size: 0.014, opacity: 0.3 });
    else if (weather === 'snow') st.wx = T.wx.snow(st, { area: [cx - r - 4, cx + r, 0, 12, cz - r, cz + r * 0.7] });
    else if (weather === 'leaves' || weather === 'wind') st.wx = T.wx.leaves(st, { area: [cx - r, cx + r, 0, 9, cz - r * 0.5, cz + r * 0.5], n: weather === 'wind' ? 520 : 300, wind: weather === 'wind' ? [4.5, 0, 1.2] : [1.3, 0, 0.5], speed: weather === 'wind' ? 1.6 : 1.1 });
    else if (weather === 'fog') st.wx = T.wx.motes(st, { area: [cx - 8, cx + 8, 0.3, 5, cz - 5, cz + 6], n: 200, color: '#fff0e0' });
    if (weather === 'storm' && T.W && T.W.lightning && o.lightning !== false) T.W.lightning(st, { times: Array.isArray(o.lightning) ? o.lightning : [0.9, 2.6] }); }
  return st;
}
// stage(T, { look, weather, fov, dof, shadowSize, sun, ... }) - a film stage in one call (any T.stage option also works)
export function stage(T, o = {}) {
  const name = o.look || 'goldenHour', L = LOOKS[name] || LOOKS.plain;
  return T.stage({ shadowSize: 16, env: 0.55, faceLight: 0, ...o, mood: o.mood || L.mood, look: name });
}
