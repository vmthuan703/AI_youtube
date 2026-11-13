// engine/thumbcine.js — 2.1 composition and light helpers for cinematic thumbnails (style `cine`): a thumbnail is a film still of one
// moment of the script. In a thumbnail project's shot file:  import { frameHead, placeAt, watch, heroLights, powerGlow } from '/engine/thumbcine.js';
// Text on the picture still comes from engine/thumb3d.js (T.thumb.tagOn / tag / bar / big / panel). Example: examples/thumb-cine.
// The idea: compose in SCREEN space. Frame the hero's head first, then drop everyone else where they should appear in the frame.
// All functions are pure (no state between frames): call them in draw(), in this order: pose → frameHead → placeAt → watch → lights.aim.

// Head of `ch` at screen (u, v) (0..1 from the top-left), head height = `size` of the frame height,
// camera on an orbit around the head: yaw (radians, 0 = straight in front of the face, + = toward the character's left), pitch (− = low angle, looking up).
export function frameHead(T, st, ch, o = {}) {
  const { u = 0.36, v = 0.5, size = 0.4, yaw = 0.25, pitch = -0.18, headR = 0.3, focus = true, roll = 0 } = o, cam = st.camera, p = ch.headWorld();
  const vf = cam.fov * Math.PI / 360, d = headR / (Math.tan(vf) * size), face = ch.rotation.y + yaw;
  cam.position.set(p.x + Math.sin(face) * Math.cos(pitch) * d, p.y + Math.sin(pitch) * d, p.z + Math.cos(face) * Math.cos(pitch) * d);
  cam.lookAt(p.x, p.y, p.z);
  const hf = Math.atan(Math.tan(vf) * cam.aspect);
  cam.rotateY(-Math.atan((0.5 - u) * 2 * Math.tan(hf))); cam.rotateX(-Math.atan((v - 0.5) * 2 * Math.tan(vf))); if (roll) cam.rotateZ(roll);
  cam.updateMatrixWorld(); if (focus && st.focusOn) st.focusOn(p); return d;
}

// Stand `ch` on the ground so its head appears at screen x = u with head height = `size` of the frame. v follows from the ground.
// size sets the depth: 0.3 = right behind the hero, 0.2 = mid-ground, 0.12 = background. face: 'camera' | a character | [x, y, z]; turn adds radians.
export function placeAt(T, st, ch, o = {}) {
  const { u = 0.75, size = 0.2, headR = 0.3, ground = 0, face = 'camera', turn = 0 } = o, cam = st.camera; cam.updateMatrixWorld();
  const vf = cam.fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * cam.aspect), zc = headR * (ch.scale?.y || 1) / (Math.tan(vf) * size), xc = (2 * u - 1) * Math.tan(hf) * zc;
  const e = cam.matrixWorld.elements, headH = ch.headWorld().y - ch.position.y, yc = (ground + headH - cam.position.y - e[1] * xc + e[9] * zc) / e[5];
  const x = cam.position.x + e[0] * xc + e[4] * yc - e[8] * zc, z = cam.position.z + e[2] * xc + e[6] * yc - e[10] * zc;
  ch.position.set(x, ground, z);
  const to = face === 'camera' ? cam.position : Array.isArray(face) ? { x: face[0], z: face[2] } : face.position; ch.rotation.y = Math.atan2(to.x - x, to.z - z) + turn; return ch;
}

// Turn a character's head to another character's head (call after .pose()).
export const watch = (ch, target, k = 1) => { const p = target.headWorld(); ch.lookAt3([p.x, p.y, p.z], k); return ch; };

// Where a world point is on screen (0..1), to check a composition or to place a 2D label by hand.
export function screenOf(st, p) { const v = p.clone ? p.clone() : new st.camera.position.constructor(p[0], p[1], p[2]); v.project(st.camera); return { u: (v.x + 1) / 2, v: (1 - v.y) / 2, front: v.z < 1 }; }

// Portrait lights that follow the camera: a warm RIM from behind the subject (the cinematic edge on hair and shoulders) and a soft FILL on the face.
// Build once in init():  const lights = heroLights(T, st, { rim: '#ffd9a0', rimPower: 28, fill: '#fff1e0', fillPower: 5 });
// then in draw(), after frameHead:  lights.aim(st, hero, { side: -1 });   side: which side of the frame the rim comes from (−1 left, 1 right).
// A power colour (lime, cyan, violet) on the rim makes the hero look charged: rim: '#b4f02e'.
export function heroLights(T, st, o = {}) {
  const TH = T.THREE, mk = (c, p, ang) => { const L = new TH.SpotLight(new TH.Color(c), p, 30, ang, 0.8, 1.2); L.castShadow = false; L.userData.dynamic = true; L.target.userData.dynamic = true; st.scene.add(L, L.target); return L; };
  const rim = mk(o.rim || '#ffd9a0', o.rimPower ?? 28, 0.5), fill = mk(o.fill || '#fff1e0', o.fillPower ?? 5, 0.7);
  return { rim, fill, aim(stg, ch, a = {}) {
    const cam = stg.camera, p = ch.headWorld(), side = a.side ?? -1, dx = p.x - cam.position.x, dz = p.z - cam.position.z, n = Math.hypot(dx, dz) || 1, fx = dx / n, fz = dz / n;   // camera → subject on the ground
    rim.position.set(p.x + fx * 2.4 + -fz * side * -1.6, p.y + 1.5, p.z + fz * 2.4 + fx * side * -1.6); rim.target.position.set(p.x, p.y - 0.15, p.z);
    fill.position.set(cam.position.x + -fz * side * 1.2, cam.position.y + 0.5, cam.position.z + fx * side * 1.2); fill.target.position.set(p.x, p.y - 0.1, p.z);
  } };
}

// The power made visible: a coloured light on the hero plus a soft halo behind the head. Build in init(), call .update(t) in draw().
//   const power = powerGlow(T, st, hero, { color: '#ffd86a', intensity: 1, halo: 1.2 });
export function powerGlow(T, st, ch, o = {}) {
  const TH = T.THREE, c = o.color || '#ffd86a', L = new TH.PointLight(new TH.Color(c), o.intensity ?? 1, o.dist ?? 6, 1.6); L.userData.dynamic = true; st.scene.add(L);
  const halo = T.glow(c, (o.halo ?? 1.2) * 2, o.opacity ?? 0.28); halo.userData.dynamic = true; st.scene.add(halo);
  return { light: L, halo, update() { const p = ch.headWorld(), cam = st.camera, dx = p.x - cam.position.x, dz = p.z - cam.position.z, n = Math.hypot(dx, dz) || 1;
    L.position.set(p.x - dx / n * 0.8, p.y + (o.y ?? 0.15), p.z - dz / n * 0.8); halo.position.set(p.x + dx / n * 0.9, p.y + (o.haloY ?? 0.1), p.z + dz / n * 0.9); } };
}
