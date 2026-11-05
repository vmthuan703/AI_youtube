// engine/hair3d.js — hair for the 3D character. Every kind is a shell whose hairline is a smooth function of the angle round the head,
// so there is no straight "swim cap" edge. A thin dark sheet under the shell draws the hairline on the face, like a cartoon ink line.
//   outfit.hair: 'anime' | 'animeLow' | 'spiky' | 'messy' | 'short' | 'bob' | 'long' | 'ponytail' | 'pigtails' | 'bun'
//   outfit.hairColor: main colour. outfit.hairShade: optional shadow colour for the anime kinds (grooves between locks).
// 'anime' is one inflated volume cut into big pointed locks with wide chunks on top. Thin spines read as a hedgehog, so keep the chunks wide.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const D2R = Math.PI / 180;
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const orbit = (az, pol) => [Math.sin(pol * D2R) * Math.sin(az * D2R), Math.cos(pol * D2R), Math.sin(pol * D2R) * Math.cos(az * D2R)];
const wrap = (a) => ((a + 540) % 360) - 180;

// same geometry for everyone wearing the same hair, so crowds stay cheap
const CACHE = new Map();
const cached = (key, make) => { let g = CACHE.get(key); if (!g) { g = make(); CACHE.set(key, g); } return g; };

function grid(pos, seg, rows, col) {
  const idx = []; for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); if (col) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// limit(az): how far the hair reaches, in degrees from the crown. az 0 faces forward, +90 is the character's left.
function softShell(r, limit, lift = () => 0) {
  const seg = 160, rows = 28, pos = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= seg; i++) { const az = (i / seg) * 360 - 180, v = j / rows, p = orbit(az, limit(az) * v), R = r * (1 + lift(az, v)); pos.push(p[0] * R, p[1] * R, p[2] * R); }
  return grid(pos, seg, rows);
}
// a copy pushed out along its normals: the outline hull, drawn back faces only
function pushOut(geo, d) { const g = geo.clone(), P = g.attributes.position, N = g.attributes.normal; for (let i = 0; i < P.count; i++) P.setXYZ(i, P.getX(i) + N.getX(i) * d, P.getY(i) + N.getY(i) * d, P.getZ(i) + N.getZ(i) * d); return g; }
const coneGeo = (r, h, dir, hr, out = 0.28) => { const g = new THREE.ConeGeometry(r, h, 10), d = new THREE.Vector3(...dir).normalize(); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d)); const p = d.multiplyScalar(hr * 1.02 + h * out); g.translate(p.x, p.y, p.z); return g; };
const blobGeo = (r, x, y, z, sx = 1, sy = 1, sz = 1) => { const g = new THREE.SphereGeometry(r, 28, 18); g.scale(sx, sy, sz); g.translate(x, y, z); return g; };
const shortLine = (front, nape, jag = 0, n = 9) => (az) => { const a = Math.abs(az), k = smooth(42, 118, a), wob = jag * Math.abs(Math.sin(az * D2R * n)); return front * (1 - k) + nape * k + wob * (1 - 0.55 * k); };
const softLine = (front, back, part = 0) => (az) => { const a = Math.abs(az), k = smooth(34, 92, a); return (front + part * smooth(-40, 40, az)) * (1 - k) + back * k; };
const puff = (az, v) => 0.06 * v * v;

// ---------------------------------------------------------------- anime
const toothAt = (teeth, az) => { let best = 0, id = -1; for (let i = 0; i < teeth.length; i++) { const [c, hw, L] = teeth[i], d = Math.abs(wrap(az - c)); if (d < hw) { const v = L * Math.pow(1 - d / hw, 0.9); if (v > best) { best = v; id = i; } } } return [best, id]; };
function animeVolume(hr, V, tones, o = {}) {
  const { top = 1.13, edge = 1.025, bulge = 0.05, grow = 0 } = o, seg = 360, rows = 40, pos = [], col = [], [hi, mid, low] = tones;
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= seg; i++) {
    const az = (i / seg) * 360 - 180, v = j / rows, [L, id] = toothAt(V.teeth, az), pol = (V.base(az) + grow + L) * v;
    const ridge = id >= 0 ? 1 - Math.abs(wrap(az - V.teeth[id][0])) / V.teeth[id][1] : 0, cut = smooth(0.22, 0.75, pol / 90);
    const R = hr * (edge + (top - edge) * (1 - Math.pow(Math.min(1, pol / 104), 3)) + bulge * (ridge - 0.45) * cut), p = orbit(az, pol); pos.push(p[0] * R, p[1] * R, p[2] * R);
    // shading painted on: a bright mass, a soft highlight ring, cool grooves between the locks
    const g = cut * (1 - smooth(0.05, 0.42, ridge)), ring = Math.exp(-Math.pow((pol - 40) / 9, 2)), c = mid.clone().lerp(hi, 0.55 + 0.45 * ring).lerp(low, 0.72 * g); col.push(c.r, c.g, c.b);
  }
  return grid(pos, seg, rows, col);
}
// a wide, flat, curved chunk, fat for most of its length and sharp at the tip. It starts inside the head, so no open base shows.
function animeChunks(hr, list, tones) {
  const pos = [], col = [], idx = [], rows = 12, sides = 8, [hi, mid, low] = tones, V = THREE.Vector3;
  for (const { az, pol, len, w, dir, bend } of list) {
    const n = new V(...orbit(az, pol)), P0 = n.clone().multiplyScalar(hr * 0.88), D = new V(...dir).normalize(), B = new V(...bend), base = pos.length / 3, L = len + 0.04, d = w * 0.58;
    for (let j = 0; j <= rows; j++) {
      const s = j / rows, C = P0.clone().addScaledVector(D, L * s).addScaledVector(B, L * s * s), T = D.clone().multiplyScalar(L).addScaledVector(B, 2 * L * s).normalize();
      const W = new V().crossVectors(T, n); if (W.lengthSq() < 1e-4) W.set(1, 0, 0); W.normalize(); const N = new V().crossVectors(W, T).normalize(), taper = 1 - Math.pow(s, 1.45);
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2, c = Math.cos(a), p = C.clone().addScaledVector(W, c * w * taper).addScaledVector(N, Math.sin(a) * d * taper); pos.push(p.x, p.y, p.z);
        const e = Math.abs(c), m = mid.clone().lerp(hi, smooth(0.25, 0.85, s) * (1 - 0.4 * e)).lerp(low, (1 - smooth(0.1, 0.45, s)) * 0.6 + 0.35 * Math.pow(e, 3)); col.push(m.r, m.g, m.b);
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < sides; i++) { const a = base + j * sides + i, b = base + j * sides + (i + 1) % sides, c = a + sides, e = b + sides; idx.push(a, c, b, b, c, e); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const animeLine = (front, nape) => (az) => { const a = Math.abs(az), k = smooth(38, 125, a); return front * (1 - k) + nape * k; };
// stands up from the head: mixes the surface normal with up, back and sideways
const rise = (az, pol, len, w, up, back = 0, side = 0, bendBack = 0.12) => { const n = orbit(az, pol); return { az, pol, len, w, dir: [n[0] * 0.55 + side, n[1] * 0.55 + up, n[2] * 0.55 - back], bend: [Math.sin(az * D2R) * 0.08, 0.02, -bendBack] }; };
// lies down the side of the head, then the tip flicks out
const lay = (az, pol, len, w, out = 0.2, flick = 0.2) => { const n = orbit(az, pol), t = [Math.cos(pol * D2R) * Math.sin(az * D2R), -Math.sin(pol * D2R), Math.cos(pol * D2R) * Math.cos(az * D2R)]; return { az, pol, len, w, dir: [t[0] + n[0] * out, t[1] + n[1] * out, t[2] + n[2] * out], bend: [n[0] * flick, n[1] * flick, n[2] * flick] }; };
// a flick at the temple: reads wide from the front and swept back from the side
const temple = (sx, len, w) => { const n = orbit(sx * 76, 62); return { az: sx * 76, pol: 62, len, w, dir: [n[0] * 0.75, n[1] * 0.75 + 0.12, n[2] * 0.75 - 0.5], bend: [sx * 0.1, 0.14, -0.1] }; };
const layers = (k = 1) => [temple(-1, 0.25 * k, 0.092), temple(1, 0.25 * k, 0.092), lay(-112, 52, 0.2 * k, 0.115), lay(112, 52, 0.2 * k, 0.115), lay(-148, 54, 0.21 * k, 0.12), lay(148, 54, 0.21 * k, 0.12), lay(180, 58, 0.21 * k, 0.12), lay(-128, 78, 0.15 * k, 0.1, 0.24, 0.26), lay(128, 78, 0.15 * k, 0.1, 0.24, 0.26), lay(-165, 82, 0.15 * k, 0.1, 0.24, 0.26), lay(165, 82, 0.15 * k, 0.1, 0.24, 0.26)];
const ANIME = {
  // the hero: a tall jagged crown, a pointed fringe, wide flicks at the sides
  anime: {
    base: animeLine(44, 96),
    teeth: [[-30, 17, 20], [-2, 17, 24], [28, 17, 20], [-60, 17, 26], [60, 17, 26], [-92, 18, 16], [92, 18, 16], [-122, 19, 22], [122, 19, 22], [-155, 18, 22], [155, 18, 22], [180, 15, 26]],
    chunks: [rise(-24, 30, 0.25, 0.155, 0.7, -0.05, -0.1, 0.05), rise(26, 28, 0.27, 0.16, 0.75, -0.05, 0.1, 0.05), rise(0, 6, 0.31, 0.165, 0.85, 0.06, 0, 0.06), rise(-70, 38, 0.27, 0.15, 0.38, 0.05, -0.38, 0.04), rise(70, 38, 0.27, 0.15, 0.38, 0.05, 0.38, 0.04), rise(-112, 34, 0.27, 0.15, 0.5, 0.2, -0.3, 0.06), rise(112, 34, 0.27, 0.15, 0.5, 0.2, 0.3, 0.06), rise(-150, 26, 0.28, 0.15, 0.6, 0.3, -0.12, 0.06), rise(150, 26, 0.28, 0.15, 0.6, 0.3, 0.12, 0.06), ...layers(1.05)],
  },
  // lower and swept back: the same look when the tall crown is too much (a low ceiling, a hat-like silhouette in a tight close-up)
  animeLow: {
    base: animeLine(42, 96),
    teeth: [[-34, 15, 21], [-11, 14, 25], [13, 14, 23], [36, 15, 19], [-64, 17, 26], [64, 17, 26], [-96, 18, 18], [96, 18, 18], [-124, 18, 20], [124, 18, 20], [-152, 17, 24], [152, 17, 24], [180, 17, 26]],
    chunks: [rise(0, 36, 0.21, 0.16, 0.5, 0.1), rise(-46, 34, 0.22, 0.155, 0.42, 0.2, -0.22), rise(46, 34, 0.22, 0.155, 0.42, 0.2, 0.22), rise(0, 8, 0.25, 0.16, 0.55, 0.35), rise(-92, 34, 0.24, 0.15, 0.32, 0.3, -0.26), rise(92, 34, 0.24, 0.15, 0.32, 0.3, 0.26), rise(-140, 34, 0.25, 0.15, 0.3, 0.5, -0.12), rise(140, 34, 0.25, 0.15, 0.3, 0.5, 0.12), rise(180, 22, 0.27, 0.155, 0.4, 0.55), ...layers(1)],
  },
};

// ---------------------------------------------------------------- the rest of the cast
function softKind(kind, hr, dark) {
  if (kind === 'bob') return { shell: softLine(64, 126, 3), r: 1.065, lift: puff };
  if (kind === 'long') return { shell: softLine(62, 148), r: 1.065, lift: puff, extra: () => mergeGeometries([blobGeo(0.1, hr * 0.76, -hr * 0.82, -hr * 0.3, 1, 2, 0.85), blobGeo(0.1, -hr * 0.76, -hr * 0.82, -hr * 0.3, 1, 2, 0.85), blobGeo(0.14, 0, -hr * 0.95, -hr * 0.66, 1.55, 1.7, 0.7)]) };
  if (kind === 'short') return { shell: shortLine(56, 112), r: 1.035 };
  if (kind === 'messy') return { shell: shortLine(56, 112, 7), r: 1.035, extra: () => mergeGeometries([[-60, 28, 0.1, 0.075], [-20, 18, 0.13, 0.08], [25, 20, 0.12, 0.08], [65, 30, 0.1, 0.07], [-110, 34, 0.09, 0.07], [110, 34, 0.09, 0.07], [170, 28, 0.1, 0.075], [0, 38, 0.09, 0.07], [-38, 40, 0.08, 0.065], [38, 42, 0.08, 0.065]].map(([az, pol, h, r]) => coneGeo(r, h, orbit(az, pol), hr))) };
  if (kind === 'spiky') return { shell: shortLine(54, 112, 9, 8), r: 1.035, extra: () => { let s = 11; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280, out = []; for (let i = 0; i < 24; i++) { const az = (i * 137.5) % 360 - 180, pol = 8 + 76 * Math.sqrt((i + 0.5) / 24); if (Math.abs(az) < 50 && pol > 48) continue; const d = orbit(az, pol); d[1] += 0.35; out.push(coneGeo(0.075 + rnd() * 0.022, 0.12 + rnd() * 0.05, d, hr)); } for (const [az, tilt] of [[-34, -0.25], [-12, -0.1], [12, 0.1], [34, 0.25]]) { const d = orbit(az, 44); out.push(coneGeo(0.06, 0.1, [d[0] + tilt * 0.1, d[1] * 0.6, d[2]], hr, 0.1)); } return mergeGeometries(out); } };
  if (kind === 'ponytail' || kind === 'pigtails' || kind === 'bun') return dark ? { tails: true } : { shell: shortLine(58, 106), r: 1.04, tails: true };
  return null;
}

// c: { head, hr, MAT, add, hull, olM, olW, color, shade, dark, ghost }. Everything is added to c.head.
export function buildHair(kind, c) {
  const { head, hr, MAT, add, hull, olM, olW = 0.012, color, shade, dark, ghost } = c;
  const lineM = olM ? new THREE.MeshBasicMaterial({ color: olM.color, side: THREE.FrontSide, fog: true }) : null;
  const put = (geo, m, key) => { const mesh = add(new THREE.Mesh(geo, m), head); if (olM) { const h = new THREE.Mesh(cached(key + '/hull' + olW, () => pushOut(geo, olW * 0.92)), olM); h.castShadow = false; h.receiveShadow = false; head.add(h); } return mesh; };
  const under = (geo) => { if (!lineM) return; const l = new THREE.Mesh(geo, lineM); l.castShadow = false; l.receiveShadow = false; head.add(l); };

  if (ANIME[kind]) {
    const V = ANIME[kind], main = new THREE.Color(color), hi = main.clone().lerp(new THREE.Color('#ffffff'), 0.85), low = shade ? new THREE.Color(shade) : main.clone().multiplyScalar(0.58).lerp(new THREE.Color('#5a64b0'), 0.3), tones = [hi, main, low], tag = `${kind}/${color}/${shade || ''}/${hr}`;
    const m = MAT('#ffffff', { rough: 0.55, rim: 0.45, limit: 0.985, emissive: main.clone().multiplyScalar(0.16), side: THREE.DoubleSide }); if (m !== ghost) { m.vertexColors = true; m.needsUpdate = true; }
    under(cached(tag + '/line', () => animeVolume(hr, V, tones, { grow: 1.7, top: 1.11, edge: 1.012, bulge: 0.04 })));
    put(cached(tag + '/vol', () => animeVolume(hr, V, tones)), m, tag + '/vol');
    put(cached(tag + '/chunks', () => animeChunks(hr, V.chunks, tones)), m, tag + '/chunks');
    return;
  }
  const S = softKind(kind, hr, dark); if (!S) return;
  const m = MAT(color, { rough: 0.72, rim: 0.5, side: THREE.DoubleSide }), tag = `${kind}/${hr}`;
  if (S.shell) {
    under(cached(tag + '/line', () => softShell(hr * S.r * 0.992, (a) => S.shell(a) + 1.6, S.lift)));
    put(cached(tag + '/shell', () => softShell(hr * S.r, S.shell, S.lift)), m, tag + '/shell');
  }
  if (S.extra) put(cached(tag + '/extra', S.extra), m, tag + '/extra');
  if (S.tails) for (const sx of kind === 'pigtails' ? [-1, 1] : [0]) {
    const tail = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, kind === 'bun' ? 0.01 : 0.22, 6, 12), m), head);
    if (kind === 'bun') tail.position.set(0, hr * 0.98, -hr * 0.35); else if (sx) { tail.position.set(sx * hr * 0.95, -hr * 0.05, -hr * 0.35); tail.rotation.z = sx * 0.35; } else { tail.position.set(0, hr * 0.05, -hr * 1.0); tail.rotation.x = -0.5; }
    hull(tail, 1.08);
  }
}
