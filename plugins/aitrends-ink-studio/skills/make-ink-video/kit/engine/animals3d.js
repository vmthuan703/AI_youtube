// engine/animals3d.js — toy animals in the same look as the cast (exposed as T.W.* through world3d.js, 0.2.7).
// Rounded shapes, muted colours, glossy black dot eyes with a white highlight, no realism. They stand on y = 0 and face +z.
// Every animal has .update(t, { walk, run, look, wag, fly, blink }) — a pure function of t: legs swing when walk/run is on (the shot
// moves the animal itself), the head looks (radians), tails wag, wings flap, eyes blink. Sizes are in metres next to a 1.75 m person.
//
//   const cow = st.add(T.at(T.W.cow(), 2, 0, -3, -0.4));   cow.update(t, { walk: 1, look: 0.3 })
//   T.W.animal('dog', { color: '#8a5a3a' })  ·  kinds: cow sheep pig dog cat bird crab bee fish
import * as THREE from 'three';
import { rng, clamp, lerp, noise, shade } from './core.js';
import { mat, box, rbox, cyl, sphere, cone, capsule, group, mesh, torus } from './kit3d.js';

const R2 = Math.PI / 2;
const EYE_G = new THREE.SphereGeometry(1, 14, 10), SHINE = new THREE.SphereGeometry(1, 8, 6);
// a glossy black dot eye with a highlight, like the cast's; s = eye height (m)
function eye(s, o = {}) { const g = group(); const e = new THREE.Mesh(EYE_G, mat('#14101c', { rough: 0.2, keepSat: true })); e.scale.set(s * 0.72, s, s * 0.45); g.add(e);
  const h = new THREE.Mesh(SHINE, new THREE.MeshBasicMaterial({ color: '#ffffff' })); h.scale.setScalar(s * 0.26); h.position.set(-s * 0.22, s * 0.32, s * 0.36); g.add(h); g.lid = e; return g; }
function eyes(head, x, y, z, s, spread = 1) { const L = eye(s), R = eye(s); L.position.set(x * spread, y, z); R.position.set(-x * spread, y, z); L.rotation.y = 0.25; R.rotation.y = -0.25; head.add(L, R); return [L, R]; }
const blinkK = (t, seed) => { const per = 3.2 + (seed % 5) * 0.4, ph = ((t + seed * 1.37) % per + per) % per; return ph < 0.12 ? 0.1 : 1; };
// a leg that swings from its top: leg(len, r, material) → group pivoted at the hip
function leg(len, r, m, x, y, z, foot) { const g = group(cyl(r, r * 0.9, len, m, 0, -len / 2, 0, 10)); if (foot) g.add(foot); g.position.set(x, y, z); return g; }
function base(kind, o) { const g = group(); g.name = 'animal'; g.userData.kind = kind; g.userData.dynamic = true; g.userData.seed = o.seed ?? 1; return g; }
function walker(g, legs, head, tail, o = {}) {
  g.update = (t, s = {}) => { const sp = s.run ? 2.6 : s.walk ? 1.4 : 0, A = (s.run ? 0.75 : 0.45) * clamp(s.run || s.walk || 0), seed = g.userData.seed;
    legs.forEach((L, i) => { L.rotation.x = sp ? Math.sin(t * sp * Math.PI * 2 + (i === 0 || i === 3 ? 0 : Math.PI)) * A : 0; });
    if (head) { head.rotation.y = (s.look ?? 0) + 0.12 * noise(t * 0.4, seed); head.rotation.x = (s.nod ?? 0) + (sp ? 0.05 * Math.sin(t * sp * Math.PI * 4) : 0.04 * Math.sin(t * 0.9 + seed)); }
    if (tail) tail.rotation.z = (s.wag ?? (o.wag ?? 0.3)) * Math.sin(t * (o.wagSpeed ?? 4) + seed);
    if (g.eyes) { const b = s.blink === false ? 1 : blinkK(t, seed); g.eyes.forEach(e => (e.scale.y = b)); }
    g.children[0].position.y = (o.bodyY ?? 0) + (sp ? Math.abs(Math.sin(t * sp * Math.PI * 2)) * 0.025 : 0.008 * Math.sin(t * 1.6 + seed)); };
  g.update(0); return g;
}

// ---------------------------------------------------------------- farm
export function cow(o = {}) {
  const g = base('cow', o), c = mat(o.color || '#efe8e2', { rough: 0.8 }), spot = mat(o.spots || '#2a2430', { rough: 0.8 }), pink = mat('#e8a0a8', { rough: 0.7 }), hoof = mat('#3a3038');
  const body = group(rbox(0.75, 0.7, 1.45, 0.24, c, 0, 1.0, 0)); g.add(body);
  const r = rng(o.seed ?? 3); for (let i = 0; i < 5; i++) { const s = sphere(0.2 + r() * 0.1, spot, (r() < 0.5 ? -1 : 1) * 0.33, 0.95 + (r() - 0.5) * 0.3, (r() - 0.5) * 1.0, 12, 8); s.scale.set(0.35, 1, 1.3); body.add(s); }
  body.add(sphere(0.16, pink, 0, 0.66, -0.2, 12, 8));   // udder
  const head = group(rbox(0.46, 0.44, 0.48, 0.16, c, 0, 0, 0), rbox(0.42, 0.24, 0.22, 0.1, pink, 0, -0.12, 0.26)); head.position.set(0, 1.28, 0.82);
  for (const x of [-0.08, 0.08]) head.add(sphere(0.03, mat('#5a3a44'), x, -0.11, 0.38, 8, 6));
  for (const s of [-1, 1]) { const h = cone(0.045, 0.16, mat('#e8dcc0'), s * 0.17, 0.27, -0.02, 8); h.rotation.z = -s * 0.5; head.add(h); const e = sphere(0.09, c, s * 0.29, 0.12, -0.05, 10, 8); e.scale.set(1.4, 0.6, 0.8); head.add(e); }
  g.eyes = eyes(head, 0.12, 0.07, 0.235, 0.05); body.add(head);
  const legs = [[0.24, 0.5], [-0.24, 0.5], [0.24, -0.5], [-0.24, -0.5]].map(([x, z]) => { const L = leg(0.65, 0.085, c, x, 0.72, z, cyl(0.09, 0.09, 0.08, hoof, 0, -0.65, 0, 10)); body.add(L); return L; });
  const tail = group(cyl(0.025, 0.025, 0.55, c, 0, -0.27, 0, 6), sphere(0.06, spot, 0, -0.56, 0, 8, 6)); tail.position.set(0, 1.25, -0.73); tail.rotation.x = 0.2; body.add(tail);
  return walker(g, legs, head, tail, { wag: 0.25, wagSpeed: 2.2 });
}
export function sheep(o = {}) {
  const g = base('sheep', o), wool = mat(o.color || '#f2eee8', { rough: 1, flat: true }), dark = mat(o.face || '#3a3440', { rough: 0.7 }), r = rng(o.seed ?? 4);
  const body = group(); g.add(body); for (let i = 0; i < 9; i++) body.add(sphere(0.24 + r() * 0.06, wool, (r() - 0.5) * 0.35, 0.72 + (r() - 0.5) * 0.25, (r() - 0.5) * 0.7, 10, 8));
  const head = group(rbox(0.26, 0.3, 0.32, 0.12, dark, 0, 0, 0), sphere(0.15, wool, 0, 0.14, -0.04, 10, 8)); head.position.set(0, 0.9, 0.52);
  for (const s of [-1, 1]) { const e = sphere(0.07, dark, s * 0.17, 0.04, -0.02, 8, 6); e.scale.set(1.5, 0.5, 0.8); head.add(e); }
  g.eyes = eyes(head, 0.075, 0.03, 0.16, 0.035); body.add(head);
  const legs = [[0.13, 0.25], [-0.13, 0.25], [0.13, -0.25], [-0.13, -0.25]].map(([x, z]) => { const L = leg(0.5, 0.045, dark, x, 0.5, z); body.add(L); return L; });
  return walker(g, legs, head, null);
}
export function pig(o = {}) {
  const g = base('pig', o), c = mat(o.color || '#eeaab0', { rough: 0.7 }), d = mat(shade(o.color || '#eeaab0', -0.25), { rough: 0.7 });
  const body = group(capsule(0.34, 0.55, c, 0, 0.55, 0)); body.children[0].rotation.x = R2; g.add(body);
  const head = group(sphere(0.27, c, 0, 0, 0, 16, 12), cyl(0.1, 0.11, 0.1, d, 0, -0.03, 0.27, 14)); head.children[1].rotation.x = R2; head.position.set(0, 0.68, 0.55);
  for (const x of [-0.035, 0.035]) head.add(sphere(0.022, mat('#7a4a54'), x, -0.03, 0.325, 6, 6));
  for (const s of [-1, 1]) { const e = cone(0.08, 0.14, c, s * 0.15, 0.24, 0.02, 4); e.rotation.x = 0.3; head.add(e); }
  g.eyes = eyes(head, 0.1, 0.07, 0.22, 0.035); body.add(head);
  const legs = [[0.17, 0.3], [-0.17, 0.3], [0.17, -0.3], [-0.17, -0.3]].map(([x, z]) => { const L = leg(0.32, 0.06, c, x, 0.33, z); body.add(L); return L; });
  const tail = group(torus(0.05, 0.015, c)); tail.position.set(0, 0.7, -0.62); body.add(tail);
  return walker(g, legs, head, tail, { wag: 0.6, wagSpeed: 6 });
}
// ---------------------------------------------------------------- pets
export function dog(o = {}) {
  const g = base('dog', o), c = mat(o.color || '#a8784e', { rough: 0.8 }), d = mat(o.ears || shade(o.color || '#a8784e', -0.35), { rough: 0.8 }), nose = mat('#1e1820', { rough: 0.3 });
  const body = group(capsule(0.17, 0.42, c, 0, 0.48, 0)); body.children[0].rotation.x = R2; g.add(body);
  const head = group(sphere(0.19, c, 0, 0, 0, 16, 12), rbox(0.17, 0.13, 0.18, 0.06, c, 0, -0.05, 0.17), sphere(0.04, nose, 0, -0.01, 0.27, 8, 6)); head.position.set(0, 0.72, 0.36);
  for (const s of [-1, 1]) { const e = sphere(0.09, d, s * 0.17, -0.02, -0.02, 10, 8); e.scale.set(0.5, 1.4, 0.8); head.add(e); }
  g.eyes = eyes(head, 0.075, 0.05, 0.16, 0.032); body.add(head);
  const legs = [[0.1, 0.2], [-0.1, 0.2], [0.1, -0.2], [-0.1, -0.2]].map(([x, z]) => { const L = leg(0.34, 0.045, c, x, 0.36, z, sphere(0.055, c, 0, -0.34, 0.02, 8, 6)); body.add(L); return L; });
  const tail = group(cyl(0.025, 0.035, 0.3, c, 0, 0.15, 0, 6)); tail.position.set(0, 0.55, -0.36); tail.rotation.x = -0.6; body.add(tail);
  return walker(g, legs, head, tail, { wag: 0.7, wagSpeed: 12 });
}
export function cat(o = {}) {
  const g = base('cat', o), c = mat(o.color || '#e09a5a', { rough: 0.8 }), st = mat(shade(o.color || '#e09a5a', -0.25), { rough: 0.8 });
  const body = group(capsule(0.12, 0.3, c, 0, 0.3, 0)); body.children[0].rotation.x = R2; g.add(body);
  for (let i = 0; i < 3; i++) { const s = torus(0.122, 0.012, st); s.position.set(0, 0.3, -0.1 + i * 0.1); body.add(s); }
  const head = group(sphere(0.15, c, 0, 0, 0, 16, 12)); head.position.set(0, 0.47, 0.24);
  for (const s of [-1, 1]) { const e = cone(0.06, 0.12, c, s * 0.09, 0.14, -0.01, 4); e.rotation.z = -s * 0.25; head.add(e); }
  head.add(sphere(0.02, mat('#e87a8a'), 0, -0.02, 0.15, 6, 6)); g.eyes = eyes(head, 0.06, 0.03, 0.125, 0.028); body.add(head);
  const legs = [[0.07, 0.14], [-0.07, 0.14], [0.07, -0.14], [-0.07, -0.14]].map(([x, z]) => { const L = leg(0.22, 0.03, c, x, 0.23, z); body.add(L); return L; });
  const tail = group(); let p = tail; for (let i = 0; i < 4; i++) { const s = group(cyl(0.025, 0.028, 0.12, i % 2 ? st : c, 0, 0.06, 0, 6)); s.position.y = i ? 0.12 : 0; s.rotation.x = -0.25; p.add(s); p = s; }
  tail.position.set(0, 0.33, -0.27); tail.rotation.x = -0.5; body.add(tail);
  return walker(g, legs, head, tail, { wag: 0.35, wagSpeed: 2 });
}
// ---------------------------------------------------------------- small creatures
export function bird(o = {}) {
  const g = base('bird', o), c = mat(o.color || '#6a9ad8', { rough: 0.6 }), belly = mat(o.belly || '#f2e6d0', { rough: 0.7 }), beak = mat('#f0b040', { rough: 0.5 });
  const body = group(sphere(0.12, c, 0, 0.14, 0, 14, 10), sphere(0.085, belly, 0, 0.11, 0.05, 10, 8)); body.children[0].scale.set(1, 0.95, 1.25); g.add(body);
  const head = group(sphere(0.085, c, 0, 0, 0, 12, 10), cone(0.03, 0.07, beak, 0, -0.01, 0.1, 6)); head.children[1].rotation.x = R2; head.position.set(0, 0.27, 0.08); g.eyes = eyes(head, 0.05, 0.02, 0.06, 0.02); body.add(head);
  const wings = [-1, 1].map(s => { const w = group(sphere(0.1, c, s * 0.08, 0, 0, 10, 8)); w.children[0].scale.set(0.9, 0.18, 1.3); w.position.set(s * 0.08, 0.17, -0.01); body.add(w); return w; });
  const tail = group(box(0.08, 0.015, 0.12, c, 0, 0, -0.06)); tail.position.set(0, 0.15, -0.13); tail.rotation.x = 0.3; body.add(tail);
  for (const s of [-1, 1]) body.add(cyl(0.008, 0.008, 0.06, beak, s * 0.04, 0.02, 0, 5));
  g.update = (t, s = {}) => { const f = s.fly ? Math.sin(t * 22) : 0.1 * Math.sin(t * 3); wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * (s.fly ? 0.2 + f * 0.9 : f))); head.rotation.y = (s.look ?? 0) + 0.3 * Math.sign(Math.sin(t * 1.3 + g.userData.seed)) * (s.fly ? 0 : 1);
    if (g.eyes) g.eyes.forEach(e => (e.scale.y = s.blink === false ? 1 : blinkK(t, g.userData.seed))); body.position.y = s.fly ? 0.05 * Math.sin(t * 6) : 0; };
  g.update(0); return g;
}
export function crab(o = {}) {
  const g = base('crab', o), c = mat(o.color || '#e0604a', { rough: 0.55 }), d = mat(shade(o.color || '#e0604a', -0.2), { rough: 0.6 });
  const body = group(sphere(0.22, c, 0, 0.2, 0, 16, 10)); body.children[0].scale.set(1.3, 0.55, 1); g.add(body);
  const stalks = [-1, 1].map(s => { const k = group(cyl(0.015, 0.015, 0.12, c, 0, 0.06, 0, 5)); k.position.set(s * 0.08, 0.28, 0.15); const e = eye(0.035); e.position.y = 0.13; k.add(e); body.add(k); return e; }); g.eyes = stalks;
  const claws = [-1, 1].map(s => { const cl = group(cyl(0.025, 0.03, 0.2, d, 0, 0, 0.1, 6), sphere(0.08, c, 0, 0, 0.24, 10, 8)); cl.children[0].rotation.x = R2; cl.children[1].scale.set(0.8, 0.6, 1.2); const pin = group(box(0.03, 0.03, 0.12, c, 0, 0, 0.06)); pin.position.set(0, 0.05, 0.26); pin.rotation.x = -0.4; cl.add(pin); cl.pin = pin; cl.position.set(s * 0.25, 0.22, 0.12); cl.rotation.y = s * 0.5; body.add(cl); return cl; });
  const legs = []; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const L = group(cyl(0.015, 0.012, 0.22, d, s * 0.11, -0.05, 0, 5)); L.children[0].rotation.z = s * 1.0; L.position.set(s * 0.22, 0.2, -0.1 + i * 0.1); body.add(L); legs.push(L); }
  g.update = (t, s = {}) => { const w = s.walk ? 10 : 0; legs.forEach((L, i) => (L.rotation.x = w ? 0.4 * Math.sin(t * w + i * 1.3) : 0)); claws.forEach((cl, i) => { cl.pin.rotation.x = -0.4 + 0.35 * Math.max(0, Math.sin(t * (s.snap ? 9 : 2) + i)); cl.rotation.x = (s.raise ?? 0) * -0.8; });
    body.position.y = w ? 0.01 * Math.sin(t * w * 2) : 0; if (g.eyes) g.eyes.forEach(e => (e.scale.y = s.blink === false ? 1 : blinkK(t, g.userData.seed))); };
  g.update(0); return g;
}
export function bee(o = {}) {
  const g = base('bee', o), y = mat('#f2c23a', { rough: 0.5 }), k = mat('#241c24', { rough: 0.5 }), wingM = new THREE.MeshBasicMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const body = group(sphere(0.1, y, 0, 0, 0, 16, 12)); body.children[0].scale.set(0.9, 0.9, 1.3); g.add(body);
  for (const z of [-0.04, 0.05]) { const b = torus(0.088, 0.022, k); b.position.z = z; b.scale.set(1, 1, 1); body.add(b); }
  body.add(cone(0.02, 0.05, k, 0, 0, -0.15, 6)); body.children[body.children.length - 1].rotation.x = -R2;
  const head = group(sphere(0.07, k, 0, 0, 0, 12, 10)); head.position.set(0, 0.02, 0.14); g.eyes = eyes(head, 0.035, 0.015, 0.05, 0.018); for (const s of [-1, 1]) { const a = cyl(0.005, 0.005, 0.08, k, s * 0.03, 0.08, 0.02, 4); a.rotation.z = -s * 0.3; head.add(a); } body.add(head);
  const wings = [-1, 1].map(s => { const w = group(new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), wingM)); w.children[0].scale.set(0.6, 1, 1); w.children[0].rotation.x = -R2; w.children[0].position.set(s * 0.06, 0, 0); w.position.set(s * 0.03, 0.08, 0); body.add(w); return w; });
  g.position.y = o.y ?? 1.2;
  g.update = (t, s = {}) => { wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * (0.3 + 0.6 * Math.sin(t * 60)))); body.position.set(0.05 * noise(t * 2, 1), 0.06 * Math.sin(t * 5), 0.05 * noise(t * 2, 2)); head.rotation.y = s.look ?? 0; };
  g.update(0); return g;
}
export function fish(o = {}) {
  const g = base('fish', o), c = mat(o.color || '#f08a4a', { rough: 0.45 }), fin = mat(shade(o.color || '#f08a4a', -0.15), { rough: 0.5, side: THREE.DoubleSide });
  const body = group(sphere(0.2, c, 0, 0, 0, 18, 12)); body.children[0].scale.set(0.55, 0.85, 1.2); g.add(body);
  const tail = group(); const tg = new THREE.Shape(); tg.moveTo(0, 0); tg.lineTo(-0.14, -0.2); tg.lineTo(0.14, -0.2); tg.closePath(); const tm = mesh(new THREE.ShapeGeometry(tg), fin); tm.rotation.set(R2, 0, R2); tail.add(tm); tail.position.set(0, 0, -0.22); body.add(tail);
  const top = new THREE.Shape(); top.moveTo(0, 0); top.quadraticCurveTo(0.08, 0.12, 0.18, 0); const tf = mesh(new THREE.ShapeGeometry(top), fin); tf.rotation.y = -R2; tf.position.set(0, 0.15, 0.08); body.add(tf);
  g.eyes = eyes(body, 0.09, 0.05, 0.16, 0.035, 1);
  g.update = (t, s = {}) => { tail.rotation.y = 0.5 * Math.sin(t * (s.swim === false ? 3 : 9)); body.rotation.y = 0.08 * Math.sin(t * 9 + 1); body.position.y = 0.03 * Math.sin(t * 2); if (g.eyes) g.eyes.forEach(e => (e.scale.y = 1)); };
  g.update(0); return g;
}
const KINDS = { cow, sheep, pig, dog, cat, bird, crab, bee, fish };
export const ANIMAL_KINDS = Object.keys(KINDS);
export function animal(kind, o = {}) { const f = KINDS[kind]; if (!f) throw new Error('unknown animal: ' + kind + ' (' + ANIMAL_KINDS.join(', ') + ')'); return f(o); }
