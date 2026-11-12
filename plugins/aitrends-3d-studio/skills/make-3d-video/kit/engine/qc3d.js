// engine/qc3d.js — 1.0.2 automatic motion QC, run inside the player by `node render.mjs --project P --qc` (and before every full
// render). It probes sampled frames of every 3D shot and reports, with the shot and the time:
//   clip      a hand, elbow, knee, foot, head or chest inside a solid prop (chair, desk, podium, door, car…) or inside another body
//   occluded  the subject's face more than half hidden from the camera (a head, a hand, a prop in front of the lens)
//   camera    the camera inside a wall, a car, a locker or a person
//   slide     a planted foot skating over the floor
//   jerk      a joint snapping (angular speed or a sudden change of speed far above natural motion)
// Severity: 'red' blocks the final render (render.mjs refuses unless --force), 'amber' is a warning.
// Shots can silence a known, intended case: shots.json "qcIgnore": ["clip", "slide"] or def.qcIgnore.
import * as THREE from 'three';

const V = () => new THREE.Vector3();
const RAY = new THREE.Raycaster(); RAY.firstHitOnly = false;
const DIRS = [new THREE.Vector3(0.31, 0.95, 0.05).normalize(), new THREE.Vector3(-0.6, 0.2, 0.77).normalize(), new THREE.Vector3(0.7, -0.3, -0.65).normalize()];

// solid static meshes worth testing against: opaque, closed-ish, not characters, not FX, not floors/mirrors/sky
function solids(scene) {
  if (scene.userData.qcSolids) return scene.userData.qcSolids;
  const out = [];
  scene.traverse(m => {
    if (!m.isMesh || m.isInstancedMesh || m.isSprite || !m.visible) return;
    for (let p = m; p; p = p.parent) if (p.name === 'character' || p.userData?.qcSkip) return;
    const mt = m.material; if (!mt || mt.transparent || mt.isShaderMaterial || mt.isMeshBasicMaterial || mt.side === THREE.DoubleSide) return;
    if (m.name === 'mirror' || m.name === 'snow') return;
    const g = m.geometry; if (!g?.attributes?.position) return;
    if (g.type === 'PlaneGeometry' || g.type === 'CircleGeometry') return;
    if (mt.side !== THREE.DoubleSide) { mt.side = THREE.DoubleSide; mt.needsUpdate = true; }   // QC browser only: rays must see back faces
    out.push(m);
  });
  scene.userData.qcSolids = out; return out;
}
// inside test: from p, look along 6 axes; p is inside a solid when the nearest surface in most directions is seen from its back
// (we are behind that face). A room's walls, floor and ceiling are seen from the front, so open space inside a room stays outside.
const AX = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(a => new THREE.Vector3(...a));
const NM = new THREE.Matrix3();
function inside(p, meshes, reach = 3) {
  let back = 0, seen = 0;
  for (const d of AX) { RAY.set(p, d); RAY.near = 0; RAY.far = reach; const h = RAY.intersectObjects(meshes, false)[0]; if (!h || !h.face) continue; seen++;
    const n = h.face.normal.clone().applyMatrix3(NM.getNormalMatrix(h.object.matrixWorld)).normalize(); if (n.dot(d) > 0.05) back++; }
  return seen >= 4 && back >= 4;
}
const chars = (scene) => { const out = []; scene.traverse(o => { if (o.name === 'character' && o.visible && o.joints) out.push(o); }); return out; };

// body capsules of a character in world space (for body-vs-body tests): chest segment + head sphere
function capsules(ch) { const J = ch.joints(); return { a: J.pelvis, b: J.neck, r: 0.16 * J.k, head: J.head, hr: 0.25 * J.k }; }
const segDist = (p, a, b) => { const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / (ab.lengthSq() || 1))); return p.distanceTo(a.clone().addScaledVector(ab, t)); };

// one frame: geometry checks (clip, camera, occluded) and a joint snapshot for the motion checks
export function probe(stg, opts = {}) {
  const scene = stg.scene, cam = stg.camera, out = { issues: [], snap: {} }; if (!scene || !cam) return out;
  scene.updateMatrixWorld(true); cam.updateMatrixWorld(true);
  const meshes = solids(scene), people = chars(scene);
  // camera inside something
  if (inside(cam.position.clone(), meshes)) out.issues.push({ kind: 'camera', sev: 'red', msg: 'camera inside a solid prop or wall' });
  for (const ch of people) { const c = capsules(ch); if (segDist(cam.position, c.a, c.b) < c.r || cam.position.distanceTo(c.head) < c.hr) out.issues.push({ kind: 'camera', sev: 'red', msg: `camera inside ${ch.userData.label || 'a character'}` }); }
  // clipping: limb points inside solids or inside another body
  for (const ch of people) {
    const J = ch.joints(), who = ch.userData.label || ch.userData.speaker || 'character';
    const pts = { handL: J.L.wr, handR: J.R.wr, elbowL: J.L.el, elbowR: J.R.el, kneeL: J.L.kn, kneeR: J.R.kn, footL: J.L.an.clone().setY(J.L.an.y + 0.04), footR: J.R.an.clone().setY(J.R.an.y + 0.04), head: J.head, chest: J.chest };
    for (const [name, p] of Object.entries(pts)) {
      if (inside(p, meshes)) out.issues.push({ kind: 'clip', sev: name === 'head' || name === 'chest' ? 'red' : 'amber', msg: `${who}: ${name} inside a prop` });
      for (const o of people) { if (o === ch) continue; const c = capsules(o); if (segDist(p, c.a, c.b) < c.r * 0.8 || p.distanceTo(c.head) < c.hr * 0.85) out.issues.push({ kind: 'clip', sev: 'amber', msg: `${who}: ${name} inside ${o.userData.label || 'another character'}` }); }
    }
    out.snap[ch.uuid] = { who, J };
  }
  out.snap.__cam = { pos: cam.position.clone(), q: cam.quaternion.clone() };
  // occlusion of faces on screen: 5 rays from the camera to points on the face
  const subj = opts.subject ? people.filter(p => p.userData.speaker === opts.subject || p.userData.label === opts.subject) : people;
  const others = []; scene.traverse(m => { if (m.isMesh && m.visible && !(m.material?.transparent) && m.name !== 'mirror') others.push(m); });
  for (const ch of subj) {
    const J = ch.joints(), h = J.head, ndc = h.clone().project(cam); if (ndc.z > 1 || Math.abs(ndc.x) > 0.95 || Math.abs(ndc.y) > 0.95) continue;
    const toCam = cam.position.clone().sub(h).normalize(), side = new THREE.Vector3().crossVectors(toCam, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(side, toCam);
    const face = [h, h.clone().addScaledVector(side, 0.12 * J.k), h.clone().addScaledVector(side, -0.12 * J.k), h.clone().addScaledVector(up, 0.1 * J.k), h.clone().addScaledVector(up, -0.1 * J.k)].map(p => p.addScaledVector(toCam, 0.2 * J.k));
    let blocked = 0;
    for (const p of face) { const d = p.clone().sub(cam.position), L = d.length(); RAY.set(cam.position, d.normalize()); RAY.near = 0.02; RAY.far = L - 0.02;
      const hit = RAY.intersectObjects(others, false).find(x => { for (let q = x.object; q; q = q.parent) if (q === ch) return false; return true; }); if (hit) blocked++; }
    if (blocked >= 3) out.issues.push({ kind: 'occluded', sev: opts.subject ? 'red' : 'amber', msg: `${ch.userData.label || ch.userData.speaker || 'character'}: face ${Math.round(blocked / 5 * 100)}% hidden` });
  }
  return out;
}
// motion checks from snapshots at consecutive frames (a, b, c = f-1, f, f+1), dt = 1/fps
export function motion(a, b, c, dt) {
  const issues = [];
  if (a?.__cam && b?.__cam && c?.__cam) { const j = (x, y) => [x.pos.distanceTo(y.pos), x.q.angleTo(y.q) * 57.3]; const [d1, r1] = j(a.__cam, b.__cam), [d2, r2] = j(b.__cam, c.__cam);
    if (Math.max(d1, d2) > 0.35 || Math.max(r1, r2) > 12) issues.push({ kind: 'camera', sev: 'red', msg: `camera jumps ${Math.max(d1, d2).toFixed(2)} m / ${Math.round(Math.max(r1, r2))}° in one frame` }); }
  for (const id of Object.keys(b)) { if (id === '__cam') continue;
    const A = a?.[id]?.J, B = b[id].J, C = c?.[id]?.J, who = b[id].who; if (!A || !C) continue;
    for (const s of ['L', 'R']) {
      // slide: foot on the floor in all three frames but moving sideways
      const f0 = A[s].an, f1 = B[s].an, f2 = C[s].an, low = (p) => p.y - B.floor < 0.075;
      if (low(f0) && low(f1) && low(f2)) { const v = Math.hypot(f2.x - f0.x, f2.z - f0.z) / (2 * dt); if (v > 0.45 && !B.moving) issues.push({ kind: 'slide', sev: 'amber', msg: `${who}: ${s === 'L' ? 'left' : 'right'} foot slides ${v.toFixed(2)} m/s` }); }
      // jerk: segment direction speed and its change
      for (const [j0, j1, name] of [['sh', 'el', 'upper arm'], ['el', 'wr', 'forearm'], ['hp', 'kn', 'thigh'], ['kn', 'an', 'shin']]) {
        const d = (J) => J[s][j1].clone().sub(J[s][j0]).normalize(), da = d(A), db = d(B), dc = d(C);
        const w1 = Math.acos(Math.min(1, da.dot(db))) / dt, w2 = Math.acos(Math.min(1, db.dot(dc))) / dt, acc = Math.abs(w2 - w1) / dt;
        const hi = Math.max(w1, w2), lo = Math.min(w1, w2);
        // a snap: a joint jumps in one frame and is still in the next (or the reverse) — not a fast but smooth swing like a throw
        if (hi > 9 && lo < hi * 0.2) issues.push({ kind: 'jerk', sev: 'red', msg: `${who}: ${name} ${s} snaps (${Math.round(hi * 57.3)}°/s in one frame)` });
        else if (acc > 1400 && hi > 8 && lo < hi * 0.45) issues.push({ kind: 'jerk', sev: 'amber', msg: `${who}: ${name} ${s} jolts (speed change ${Math.round(acc * 57.3)}°/s²)` });
      }
    }
  }
  return issues;
}
