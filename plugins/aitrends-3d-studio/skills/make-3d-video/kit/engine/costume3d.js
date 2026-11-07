// engine/costume3d.js — role costume parts for T.character(): the details that tell the viewer who a supporting
// character is (a nurse cap, a stethoscope, a teacher's lanyard, a police badge, grey brows and a cane...).
// Called by rig3d.js character() once the body is built. Every option is off by default, so old casts look the same.
//
// Rules for the cast (style-bible.md): parts stay small and muted; only the hero is loud. Hats never cast a shadow
// across the face. Coordinates: chest space (torso from y≈-0.07 to 0.51, front surface z≈0.12–0.15), head space
// (sphere radius 0.27, face toward +z), body space for props (feet at y=0).
import * as THREE from 'three';

const D2R = Math.PI / 180;
// hair kinds built here instead of hair3d.js
export const COSTUME_HAIR = new Set(['balding', 'lowBun']);
// head kinds built here (rig3d.js builds cap, capBack, beanie, headband, hood, tophat, crown)
export const COSTUME_HEADS = new Set(['nurseCap', 'policeCap', 'chefHat', 'hardhat', 'fireHelmet']);
// a point on the head sphere: polar angle from the top, azimuth from the front (+z), radius factor
const onHead = (hr, pol, az, k = 1) => { const p = pol * D2R, a = az * D2R, r = hr * k; return new THREE.Vector3(Math.sin(p) * Math.sin(a) * r, Math.cos(p) * r, Math.sin(p) * Math.cos(a) * r); };
const col = (v, dflt) => (typeof v === 'string' ? v : dflt);

export function dressUp(o, c) {
  const { MAT, add, hull, chest, head, body, parts, hr, chunky, hairC } = c;
  const M = (cc, x = {}) => MAT(cc, { rough: 0.8, rim: 0.45, ...x });
  const fz = chunky ? 0.146 : 0.124, tR = chunky ? 0.209 : 0.178;
  const mesh = (geo, m, parent, pos, noShadow) => { const x = add(new THREE.Mesh(geo, m), parent); if (pos) x.position.set(...pos); if (noShadow) x.castShadow = false; return x; };
  const rod = (parent, a, b, r, m) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const x = mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 8), m, parent); x.position.copy(A).add(B).multiplyScalar(0.5); x.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize()); x.castShadow = false; return x; };
  const faceOut = (x, p) => { x.position.copy(p); x.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), p.clone().normalize()); };
  const neckStrap = (m, yEnd) => { rod(chest, [-0.06, 0.49, 0.06], [-0.012, yEnd, fz + 0.004], 0.007, m); rod(chest, [0.06, 0.49, 0.06], [0.012, yEnd, fz + 0.004], 0.007, m); };
  const metal = (cc) => M(cc, { metal: 0.55, rough: 0.35, rim: 0.3 });

  // ---------------------------------------------------------------- body shape and long garments
  if (o.belly) { const k = o.belly === true ? 1.18 : o.belly; parts.torso.scale.x *= k; parts.torso.scale.z *= k * 1.08; }
  if (o.skirtLen && parts.skirt) { const s = parts.skirt, len = s.geometry.parameters.height, k = o.skirtLen; s.scale.y = k; s.position.y = -len * k / 2 + (o.top === 'dress' || o.top === 'labcoat' ? 0.02 : -0.045); }
  if (o.top === 'aodai' && parts.skirt) { parts.skirt.scale.x = 0.6; parts.skirt.scale.z = 0.48; mesh(new THREE.CylinderGeometry(0.062, 0.07, 0.07, 20, 1, true), M(o.color || '#5a6a9a', { side: THREE.DoubleSide }), chest, [0, 0.53, 0]); }

  // ---------------------------------------------------------------- chest details
  if (o.top === 'scrubs' || o.vee) {   // scrubs V-neck: a darker triangle at the collar
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.06, 0, 0, 0.06, 0, 0, 0, -0.12, 0], 3)); g.setIndex([0, 2, 1]); g.computeVertexNormals();
    const v = mesh(g, M(col(o.vee, null) || shade(o.color || '#4a6a8a', -0.2), { side: THREE.DoubleSide }), chest, [0, 0.49, fz - 0.006], true); v.rotation.x = -0.12;
  }
  if (o.buttons) { const m = M(col(o.buttons, '#d8ccb0')), xs = o.buttonRows === 2 ? [-0.05, 0.05] : [0], n = o.buttonRows === 2 ? 3 : 4; for (const x of xs) for (let i = 0; i < n; i++) mesh(new THREE.SphereGeometry(0.011, 10, 8), m, chest, [x, (o.buttonsTop ?? 0.3) - i * 0.085, fz + 0.004], true); }
  if (o.bands) { const m = M(col(o.bands, '#c8c0a0'), { side: THREE.DoubleSide, rim: 0.2 }); for (const y of [0.05, 0.19]) { const b = mesh(new THREE.CylinderGeometry(tR + 0.003, tR + 0.003, 0.032, 36, 1, true), m, chest, [0, y, 0], true); b.scale.z = 0.715; } }
  if (o.hiVis) {   // high-visibility vest over any top: open at the front, two reflective bands
    const r = tR + 0.012, arc = [Math.PI * 1.08, Math.PI * 1.84];
    const v = mesh(new THREE.CylinderGeometry(r * 0.86, r, 0.5, 36, 1, true, ...arc), M(col(o.hiVis, '#b8743a'), { side: THREE.DoubleSide, rough: 0.85 }), chest, [0, 0.17, 0]); v.scale.z = 0.73; v.rotation.y = Math.PI;
    for (const y of [0.05, 0.2]) { const b = mesh(new THREE.CylinderGeometry(r + 0.003, r + 0.003, 0.03, 36, 1, true, ...arc), M(o.hiVisBand || '#c8c8b8', { side: THREE.DoubleSide, rim: 0.2 }), chest, [0, y, 0], true); b.scale.z = 0.735; b.rotation.y = Math.PI; }
  }
  if (o.apron) {
    const m = M(col(o.apron, '#3f6a58'), { rough: 0.9 }); mesh(new THREE.BoxGeometry(0.25, 0.6, 0.01), m, chest, [0, 0.02, fz + 0.01]);
    rod(chest, [-0.11, 0.31, fz + 0.01], [-0.06, 0.49, 0.06], 0.007, m); rod(chest, [0.11, 0.31, fz + 0.01], [0.06, 0.49, 0.06], 0.007, m);
  }
  if (o.lanyard) { const m = M(col(o.lanyard, '#2c3e6e')); neckStrap(m, 0.27); mesh(new THREE.BoxGeometry(0.06, 0.08, 0.006), M(o.card || '#d8d4cc'), chest, [0, 0.225, fz + 0.008 + (o.apron ? 0.012 : 0)], true); mesh(new THREE.BoxGeometry(0.04, 0.012, 0.007), m, chest, [0, 0.245, fz + 0.01], true); }
  if (o.whistle) { neckStrap(M(col(o.whistle, '#2a2a34')), 0.31); const w = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 12), metal('#b8b8c0'), chest, [0.01, 0.29, fz + 0.02], true); w.rotation.z = Math.PI / 2; }
  if (o.stethoscope) {
    const m = M('#34343e'); const ring = mesh(new THREE.TorusGeometry(0.1, 0.009, 8, 32), m, chest, [0, 0.49, 0], true); ring.rotation.x = Math.PI / 2 - 0.25; ring.scale.set(1.05, 1, 0.9);
    rod(chest, [-0.085, 0.47, 0.07], [-0.07, 0.25, fz + 0.006], 0.008, m); rod(chest, [0.085, 0.47, 0.07], [0.065, 0.3, fz + 0.006], 0.008, m);
    const d = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 20), metal('#b8b8c4'), chest, [-0.07, 0.235, fz + 0.012], true); d.rotation.x = Math.PI / 2;
  }
  if (o.badge) { const b = mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.008, 6), metal(col(o.badge, '#c8a85a')), chest, [0.075, 0.33, fz + 0.006], true); b.rotation.x = Math.PI / 2; }
  if (o.nameTag) mesh(new THREE.BoxGeometry(0.07, 0.026, 0.008), M(col(o.nameTag, '#d8d4cc')), chest, [o.badge ? -0.08 : 0.075, o.badge ? 0.36 : 0.33, fz + 0.006], true);
  if (o.patch && !c.ghost) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = o.patchBg || o.color || '#26242e'; g.fillRect(0, 0, 256, 64);
    g.fillStyle = o.patchColor || '#d8d4c0'; g.font = '900 40px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(o.patch), 128, 34);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const p = mesh(new THREE.PlaneGeometry(0.12, 0.03), new THREE.MeshBasicMaterial({ map: tex, fog: true }), chest, [0.07, 0.34, fz + 0.006], true); p.receiveShadow = false;
  }
  if (o.epaulettes) { const m = M(col(o.epaulettes, '#1c2848')); for (const s of [-1, 1]) { const e = mesh(new THREE.BoxGeometry(0.1, 0.014, 0.06), m, chest, [s * 0.125, 0.452, 0], true); e.rotation.z = s * -0.38; } }
  if (o.belt) {
    const b = mesh(new THREE.CylinderGeometry(tR * 0.94, tR * 0.92, 0.04, 32, 1, true), M(col(o.belt, '#1e1e26'), { side: THREE.DoubleSide }), chest, [0, -0.045, 0], true); b.scale.z = 0.72;
    mesh(new THREE.BoxGeometry(0.04, 0.03, 0.01), metal('#a89870'), chest, [0, -0.045, fz], true);
    if (o.radio) mesh(new THREE.BoxGeometry(0.035, 0.07, 0.025), M('#202028'), chest, [-0.08, 0.34, fz + 0.012], true);
  }

  // ---------------------------------------------------------------- hair kinds built here
  if (o.hair === 'balding') mesh(new THREE.SphereGeometry(hr * 1.035, 40, 16, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, Math.PI * 0.36, Math.PI * 0.24), M(hairC, { rough: 0.9, side: THREE.DoubleSide }), head);
  if (o.hair === 'lowBun') { const b = mesh(new THREE.SphereGeometry(0.085, 18, 14), M(hairC, { rough: 0.85 }), head, [0, -hr * 0.12, -hr * 1.02]); b.scale.set(1.1, 0.9, 0.9); hull(b, 1.08); }

  // ---------------------------------------------------------------- face hair
  if (o.mustache) { const m = M(col(o.mustache, hairC), { rough: 0.9 }); for (const s of [-1, 1]) { const x = mesh(new THREE.CapsuleGeometry(0.019, 0.045, 4, 10), m, head, null, true); faceOut(x, onHead(hr, 104, s * 7)); x.rotateZ(s * 1.25); } }
  if (o.beard) mesh(new THREE.SphereGeometry(hr * 1.012, 40, 12, Math.PI / 2 - 1.6, 3.2, Math.PI * 0.67, Math.PI * 0.3), M(col(o.beard, hairC), { rough: 0.95, side: THREE.DoubleSide }), head, null, true);
  if (o.brows) { const m = M(col(o.brows, hairC), { rough: 0.9 }); for (const s of [-1, 1]) { const x = mesh(new THREE.CapsuleGeometry(0.014, 0.05, 4, 10), m, head, null, true); faceOut(x, onHead(hr, 73, s * 21, 1.005)); x.rotateZ(Math.PI / 2 + s * 0.18); } }

  // ---------------------------------------------------------------- hats (never cast a shadow on the face)
  const hc = o.headColor, hat = (geo, m, pos) => { const x = mesh(geo, m, head, pos, true); return x; };
  if (o.head === 'nurseCap') {
    const g = new THREE.Group(); head.add(g); g.position.set(0, hr * 0.95, hr * 0.2); g.rotation.x = -0.35;
    const cap = add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.075, 0.12), M(hc || '#d6d6dc')), g); cap.castShadow = false; hull(cap, 1.06);
    for (const [w, h] of [[0.05, 0.014], [0.014, 0.05]]) { const x = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.004), M(o.capCross || '#9a4a4a')), g); x.position.z = 0.062; x.castShadow = false; }
  }
  if (o.head === 'policeCap') {
    const m = M(hc || '#243158'); const cr = hat(new THREE.CylinderGeometry(0.262, 0.25, 0.15, 32), m, [0, 0.205, 0]); hull(cr, 1.04);
    const bd = hat(new THREE.TorusGeometry(0.252, 0.02, 8, 36), M(shade(hc || '#243158', -0.35)), [0, 0.15, 0]); bd.rotation.x = Math.PI / 2;
    const br = hat(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 28, 1, false, -1.0, 2.0), M('#101420', { rough: 0.3 }), [0, 0.138, 0.13]); br.rotation.x = 0.18;
    const b = hat(new THREE.CylinderGeometry(0.03, 0.024, 0.01, 6), metal(o.capBadge || '#c8a85a'), [0, 0.215, 0.262]); b.rotation.x = Math.PI / 2;
  }
  if (o.head === 'chefHat') {
    const m = M(hc || '#d8d6d2'); hull(hat(new THREE.CylinderGeometry(0.25, 0.248, 0.11, 32), m, [0, 0.2, 0]), 1.04);
    for (const [x, z, r] of [[0, 0, 0.17], [0.1, 0.05, 0.12], [-0.1, 0.05, 0.12], [0.08, -0.09, 0.12], [-0.08, -0.09, 0.12]]) { const p = hat(new THREE.SphereGeometry(r, 20, 14), m, [x, 0.36, z]); p.scale.y = 0.85; }
  }
  if (o.head === 'hardhat' || o.head === 'fireHelmet') {
    const fire = o.head === 'fireHelmet', m = M(hc || (fire ? '#7a2e28' : '#b8963a'), { rough: 0.45 });
    hull(hat(new THREE.SphereGeometry(hr * 1.07, 32, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), m, [0, 0.04, 0]), 1.03);
    const br = hat(new THREE.CylinderGeometry(hr * (fire ? 1.25 : 1.18), hr * (fire ? 1.3 : 1.2), 0.014, 32), m, [0, 0.05, fire ? -0.06 : 0]); if (fire) br.scale.z = 1.25;
    const rg = hat(new THREE.BoxGeometry(0.04, 0.03, hr * 2.0), m, [0, 0.04 + hr * 1.05, 0]); rg.scale.y = 0.8;
    if (fire) { const f = hat(new THREE.CylinderGeometry(0.05, 0.045, 0.012, 6), metal('#c8a85a'), [0, 0.2, 0.25]); f.rotation.x = Math.PI / 2 - 0.5; }
  }
  if (o.goggles) {
    const band = mesh(new THREE.TorusGeometry(hr * 1.025, 0.013, 8, 40), M('#3a3640'), head, null, true); band.rotation.x = Math.PI / 2 - 0.62;
    for (const s of [-1, 1]) { const p = onHead(hr, 46, s * 22, 1.06); const l = mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.035, 20), M('#5a5560'), head, null, true); l.position.copy(p); l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize());
      const g = mesh(new THREE.CircleGeometry(0.038, 20), M('#7a98a8', { rough: 0.15, metal: 0.3 }), head, null, true); faceOut(g, onHead(hr, 46, s * 22, 1.13)); }
  }

  // ---------------------------------------------------------------- props: cane stands on the floor (pose 'hunchCane'), the rest go in a hand
  if (o.prop === 'cane') { const g = new THREE.Group(); body.add(g); g.position.set(-0.27, 0, 0.14); const m = M('#4a3226'); mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.66, 8), m, g, [0, 0.33, 0]); mesh(new THREE.TorusGeometry(0.035, 0.013, 8, 16, Math.PI), m, g, [0.035, 0.66, 0]); return null; }
  if (o.prop) {
    const g = new THREE.Group(); let pos = [0, -0.13, 0.03], rot = [0, 0, 0];
    if (o.prop === 'book') add(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.22, 0.04), M(o.propColor || '#6e2c30')), g);
    else if (o.prop === 'clipboard') { add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.012), M(o.propColor || '#8a6a46')), g); const pp = add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.19, 0.004), M('#e0dcd2')), g); pp.position.set(0, -0.015, 0.008); pos = [0, -0.14, 0.03]; }
    else if (o.prop === 'mic') { add(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.16, 10), M('#22222a')), g); const b = add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), M('#4a4a54')), g); b.position.y = 0.09; pos = [0, -0.07, 0.05]; rot = [Math.PI, 0, 0]; }
    else if (o.prop === 'torch') { add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 12), M('#2a2a32')), g); pos = [0, -0.1, 0.03]; }
    else if (o.prop === 'medbag') { add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.12), M(o.propColor || '#7a3a34')), g); for (const [w, h] of [[0.06, 0.016], [0.016, 0.06]]) { const x = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.004), M('#d8d4cc')), g); x.position.z = 0.062; } pos = [0, -0.15, 0]; }
    return { obj: g, side: o.propHand || (o.prop === 'medbag' || o.prop === 'torch' ? 'R' : 'L'), pos, rot };
  }
  return null;
}

function shade(hex, k) { const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + k * 0.5))); return '#' + c.getHexString(); }
