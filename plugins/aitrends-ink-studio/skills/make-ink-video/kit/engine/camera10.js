// engine/camera10.js — 1.0 named camera shots (T.camShot). Pick a framing by name in shots.json ("camera": "lowHero") and let the
// shot code call T.camShot(st.camera, t, info.shot.camera, { a: s.hero, b: s.maya, dur: info.dur }). Every framing drifts a little
// over the shot so nothing is frozen, and frames the subject's head from its own facing.
//
//   wide · full · medium · closeup · xcu (eyes) · ots (over a's shoulder onto b) · twoShot · lowHero · high · dutch · pushIn · pullBack
//   orbit · track (side tracking a moving subject) · reveal (rises from behind a's shoulder) · insert (an object: o.at [x,y,z])
// 1.0.1 school framings: hallwayWalk (backs up ahead of a walker, low, long lens) · lockerPeek (from beside the lockers at o.at,
//   along the row onto a) · bleachers (high from the stands down onto a) · cafeteriaWide (high establishing over the room) · backRow (from the
//   back of class over a's head toward the board) · teacherView (from the front, looking down the rows at a) · doorWindow (long lens
//   from the classroom door at o.at)
// 1.0.2: the camera avoids blockers (o.avoid: false to keep the exact framing). 180° rule: with config.json "lineRule": true (or
// o.line: true) two-person shots stay on one side of the line between the two (o.lineSide: -1 for the other side).
// Options: a (character or [x,y,z]), b (second subject), side (+1 / -1: which side of the face, default +1 = subject's left),
// yaw (extra angle round the subject, radians), dist (scale on the framing distance), dur (shot length for the moves), fov, height (high,
// cafeteriaWide: camera height above the head / the floor; keep it under a low ceiling).
import * as THREE from 'three';
import { clamp, lerp, ease } from './core.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const where = (s) => (!s ? V(0, 1.4, 0) : Array.isArray(s) ? V(...s) : s.isVector3 ? s.clone() : s.headWorld ? s.headWorld() : s.getWorldPosition(V(0, 0, 0)));
// 1.0.1: feet keep the subject's floor height (a stage, a riser, a bleacher), so heights below are measured from where it stands
const feet = (s) => (!s ? V(0, 0, 0) : Array.isArray(s) ? V(s[0], 0, s[2]) : s.isVector3 ? V(s.x, 0, s.z) : s.getWorldPosition(V(0, 0, 0)));
const facing = (s) => (s && s.rotation && !Array.isArray(s) && !s.isVector3 ? s.rotation.y : 0);
const DOF_AP = { closeup: 0.0011, xcu: 0.0014, ots: 0.0009, insert: 0.0012, medium: 0.00045, pushIn: 0.0006, doorWindow: 0.0008, lockerPeek: 0.0008 };
export const CAMS = ['establish', 'craneDown', 'wide', 'full', 'medium', 'closeup', 'xcu', 'ots', 'twoShot', 'lowHero', 'high', 'dutch', 'pushIn', 'pullBack', 'orbit', 'track', 'reveal', 'insert', 'hallwayWalk', 'lockerPeek', 'bleachers', 'cafeteriaWide', 'backRow', 'teacherView', 'doorWindow'];

export function camShot(camera, t, name = 'medium', o = {}) {
  const dur = o.dur || 3, k = ease.inOut(clamp(t / dur)), drift = (t / dur) * 0.12, side = o.side ?? 1, ds = o.dist ?? 1;
  const A = where(o.a), FA = feet(o.a), yawA = facing(o.a) + (o.yaw ?? 0);
  // a point in front of a subject: ang = angle off its facing (0 = straight on), dist, height
  const front = (base, ang, dist, h) => V(base.x + Math.sin(yawA + ang) * dist, h, base.z + Math.cos(yawA + ang) * dist);
  let pos, look, fov = o.fov || 35, roll = 0;
  const head = A.clone(), chest = V(A.x, A.y - 0.38, A.z), waist = V(A.x, A.y - 0.7, A.z);
  switch (name) {
    // 2.0 openings: the first shot of a place starts high and far and comes down to the subject (foreground slides past the lens)
    case 'establish': { const far = front(FA, side * 0.5, 13 * ds, FA.y + 5.2), near = front(FA, side * 0.42, 6.2 * ds, FA.y + 1.45); pos = far.lerp(near, k); look = V(A.x, A.y - 0.2 + (1 - k) * 1.4, A.z); fov = o.fov || 34; break; }
    case 'craneDown': pos = front(FA, side * 0.3, 5.5 * ds, FA.y + lerp(6.5, 1.3, k)); look = V(A.x, lerp(A.y + 2.2, A.y - 0.3, k), A.z); fov = o.fov || 34; break;
    case 'wide': { const B = o.b ? where(o.b) : A, mid = A.clone().lerp(B, 0.5), span = A.distanceTo(B); pos = front(V(mid.x, 0, mid.z), side * 0.35 + drift, (6.5 + span * 0.8) * ds, 1.7); look = V(mid.x, 1.0, mid.z); fov = o.fov || 38; break; }
    case 'full': pos = front(FA, side * 0.3 + drift, 4.2 * ds, FA.y + 1.2); look = V(A.x, A.y - 0.55, A.z); fov = o.fov || 34; break;
    case 'medium': pos = front(FA, side * 0.38 + drift, 2.9 * ds, A.y - 0.15); look = chest; fov = o.fov || 34; break;
    case 'closeup': pos = front(FA, side * 0.32 + drift * 0.6, 1.75 * ds, A.y - 0.02); look = V(A.x, A.y - 0.06, A.z); fov = o.fov || 32; break;
    case 'xcu': pos = front(FA, side * 0.12, 0.95 * ds - drift * 0.4, A.y + 0.04); look = V(A.x, A.y + 0.04, A.z); fov = o.fov || 28; break;
    case 'ots': { const B = where(o.b || [A.x + Math.sin(yawA) * 2, A.y, A.z + Math.cos(yawA) * 2]), dir = B.clone().sub(A).setY(0).normalize(), sideV = V(dir.z, 0, -dir.x).multiplyScalar(side);
      pos = A.clone().addScaledVector(dir, -0.75 * ds).addScaledVector(sideV, 0.42).setY(A.y + 0.05); look = V(B.x, B.y - 0.12, B.z); pos.addScaledVector(sideV, drift * 0.6); fov = o.fov || 34; break; }
    case 'twoShot': { const B = o.b ? where(o.b) : A, mid = A.clone().lerp(B, 0.5), dir = B.clone().sub(A).setY(0).normalize(), n = V(-dir.z, 0, dir.x).multiplyScalar(side);
      pos = mid.clone().addScaledVector(n, (2.6 + A.distanceTo(B) * 0.9) * ds).setY(mid.y - 0.2); pos.addScaledVector(dir, drift * 2); look = V(mid.x, mid.y - 0.35, mid.z); fov = o.fov || 36; break; }
    case 'lowHero': pos = front(FA, side * 0.4, lerp(2.4, 1.9, k) * ds, FA.y + 0.35); look = V(A.x, A.y + 0.05, A.z); fov = o.fov || 40; roll = side * 0.03; break;
    case 'high': pos = front(FA, side * 0.3 + drift, 2.6 * ds, A.y + (o.height ?? 2.4)); look = V(A.x, A.y - 0.5, A.z); fov = o.fov || 36; break;
    case 'dutch': pos = front(FA, side * 0.35, 2.4 * ds, A.y - 0.05); look = V(A.x, A.y - 0.1, A.z); fov = o.fov || 32; roll = side * (0.2 + 0.03 * k); break;
    case 'pushIn': pos = front(FA, side * 0.3, lerp(3.0, 1.7, k) * ds, lerp(A.y - 0.2, A.y - 0.02, k)); look = V(A.x, lerp(A.y - 0.35, A.y - 0.06, k), A.z); fov = o.fov || 32; break;
    case 'pullBack': pos = front(FA, side * 0.3, lerp(1.1, 6.5, k) * ds, lerp(A.y, FA.y + 1.9, k)); look = V(A.x, lerp(A.y - 0.05, FA.y + 0.9, k), A.z); fov = o.fov || 34; break;
    case 'orbit': { const ang = side * lerp(-0.7, 0.7, k); pos = front(FA, ang, 2.6 * ds, A.y - 0.1); look = chest; fov = o.fov || 34; break; }
    case 'track': { const fwd = V(Math.sin(yawA), 0, Math.cos(yawA)), sideV = V(fwd.z, 0, -fwd.x).multiplyScalar(-side); pos = A.clone().addScaledVector(sideV, 3.2 * ds).addScaledVector(fwd, 0.4).setY(A.y - 0.35); look = A.clone().addScaledVector(fwd, 0.5).setY(A.y - 0.45); fov = o.fov || 36; break; }
    case 'reveal': { const back = front(FA, PI + side * 0.25, 1.0 * ds, A.y - 0.3); pos = back.clone().setY(lerp(A.y - 0.6, A.y + 0.35, k)); const f = front(FA, 0, 6, A.y); look = V(f.x, lerp(A.y - 0.3, A.y, k), f.z); fov = o.fov || 38; break; }
    case 'insert': { const P = where(o.at || o.a); pos = V(P.x + 0.5 * side * ds, P.y + 0.35, P.z + 0.55 * ds - drift * 0.3); look = P; fov = o.fov || 30; break; }
    case 'hallwayWalk': pos = front(FA, side * 0.12, 3.4 * ds, A.y - 0.25); look = V(A.x, A.y - 0.3, A.z); fov = o.fov || 26; break;
    case 'lockerPeek': { const P = o.at ? V(...o.at) : front(FA, side * 0.9, 1.6, A.y - 0.1); pos = V(P.x, A.y - 0.08, P.z); look = V(A.x, A.y - 0.12, A.z); fov = o.fov || 30; roll = side * 0.02; break; }
    case 'bleachers': pos = front(FA, side * 0.5 + drift * 0.5, 9 * ds, A.y + 4.5); look = V(A.x, A.y - 0.5, A.z); fov = o.fov || 30; break;
    case 'cafeteriaWide': pos = front(FA, side * 0.6 + drift, 6.0 * ds, FA.y + (o.height ?? 2.4)); look = V(A.x, 0.8, A.z); fov = o.fov || 42; break;
    case 'backRow': pos = front(FA, PI + side * 0.16, 1.9 * ds, A.y + 0.5); { const f = front(FA, 0, 5, A.y); look = V(f.x, A.y - 0.05, f.z); } fov = o.fov || 38; break;
    case 'teacherView': pos = front(FA, side * 0.15 + drift * 0.3, 4.8 * ds, A.y + 1.0); look = V(A.x, A.y - 0.3, A.z); fov = o.fov || 30; break;
    case 'doorWindow': { const P = o.at ? V(...o.at) : front(FA, side * 0.2, 6, A.y); pos = V(P.x, A.y, P.z); look = V(A.x, A.y - 0.15, A.z); fov = o.fov || 20; break; }
    default: return camShot(camera, t, 'medium', o);
  }
  // 1.0.2 smart camera: keep two-person framings on one side of the line between them (180° rule), then swing round the subject
  // (or come closer) until nothing solid sits between the lens and the face, and the lens is not inside a wall, a car or a person.
  const lineOn = o.line ?? globalThis.E3D_LINE_RULE ?? false;   // config.json "lineRule": true (or o.line: true) turns the 180° rule on
  if (o.b && lineOn && ['ots', 'twoShot', 'medium', 'closeup', 'wide', 'full'].includes(name)) pos = keepLine(pos, A, where(o.b), o);
  if (o.avoid !== false && camera.userData.scene && !o._probe) {
    // decide the dodge once per shot from the framing at its first frame (t = 0), then apply the same swing / distance to every
    // frame: the camera keeps its move and never hops mid-shot when the drift brushes a blocker
    const p0 = camShot(camera, 0, name, { ...o, avoid: false, _probe: true }).pos, tgtObj = name === 'ots' && o.b ? o.b : o.a, F0 = feet(tgtObj), T0 = tgtObj && tgtObj.isObject3D ? V(F0.x, F0.y + 1.42 * (tgtObj.scale?.y || 1), F0.z) : where(tgtObj);   // a steady head point: posing must not flip the decision
    const pick = avoidPick(camera.userData.scene, p0, T0, { ...o, a: tgtObj, b: name === 'ots' ? o.a : null }, name);
    if (pick) { const piv = V(T0.x, 0, T0.z), rel = pos.clone().sub(piv), r = Math.hypot(rel.x, rel.z) * pick.k, ang = Math.atan2(rel.x, rel.z) + pick.da;
      pos = V(piv.x + Math.sin(ang) * r, pos.y + pick.dy, piv.z + Math.cos(ang) * r); }
  }
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look); if (roll) camera.rotateZ(roll);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  // 2.0: close framings blur the background by themselves on a film stage (o.dof: false keeps everything sharp, o.dof: 2 doubles it)
  const stg = camera.userData.stage; if (stg && stg.autoDof && stg.bokeh && !o._probe) { const ap = o.dof === false ? 0 : (DOF_AP[name] || 0) * (typeof o.dof === 'number' ? o.dof : 1);
    if (ap > 0) { stg.bokeh.enabled = true; stg.bokeh.uniforms.aperture.value = ap; stg.focusOn(name === 'ots' && o.b ? where(o.b) : name === 'insert' ? look : A); } else stg.bokeh.enabled = false; }
  return { pos, look };
}
// the side of the A–B line is fixed by the two subjects' names (sorted), so every shot of one conversation stays on the same side
function keepLine(pos, A, B, o) {
  const la = String(o.a?.userData?.label || o.a?.userData?.speaker || 'A'), lb = String(o.b?.userData?.label || o.b?.userData?.speaker || 'B');
  const [P, Q] = la <= lb ? [A, B] : [B, A], ax = Q.clone().sub(P).setY(0); if (ax.lengthSq() < 1e-4) return pos;
  const n = V(-ax.z, 0, ax.x).normalize().multiplyScalar(o.lineSide ?? 1), mid = P.clone().lerp(Q, 0.5), rel = pos.clone().sub(mid);
  const d = rel.dot(n); if (d >= 0) return pos;
  return pos.clone().addScaledVector(n, -2 * d);   // mirror the camera across the line
}
const RC = new THREE.Raycaster(); const AXES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(a => V(...a)); const NMX = new THREE.Matrix3();
function blockers(scene) {
  if (scene.userData.camBlockers) return scene.userData.camBlockers;
  const list = []; scene.traverse(m => { if (!m.isMesh || m.isInstancedMesh || m.isSprite || !m.visible) return; const mt = m.material;
    if (!mt || mt.transparent || mt.isShaderMaterial || m.name === 'mirror' || m.name === 'snow' || m.userData.dynamic === true && !m.geometry) return;
    const g = m.geometry; if (!g?.attributes?.position || g.type === 'PlaneGeometry' && mt.isMeshBasicMaterial) return;
    for (let q = m; q; q = q.parent) if (q.name === 'character' || q.userData?.dynamic) return;   // only still things: moving people / props would make the camera hop
    list.push(m); });
  scene.userData.camBlockers = list; return list;
}
const ownedBy = (obj, ch) => { for (let q = obj; q; q = q.parent) if (q === ch) return true; return false; };
// how blocked a lens position is: 0 clear … 1 fully blocked (face points hidden) + 1 if the lens is inside something
function people(scene) { const out = []; scene.traverse(c => { if (c.name === 'character' && c.visible) c.traverse(m => { if (m.isMesh && !m.material?.transparent) out.push(m); }); }); return out; }
function blockedK(scene, pos, target, subj, others) {
  const list = blockers(scene), withPeople = list.concat(people(scene)); let hid = 0;
  const toCam = pos.clone().sub(target).normalize(), side = V(0, 0, 0).crossVectors(toCam, V(0, 1, 0)).normalize(), up = V(0, 0, 0).crossVectors(side, toCam);
  const pts = [target, target.clone().addScaledVector(side, 0.12), target.clone().addScaledVector(side, -0.12), target.clone().addScaledVector(up, 0.1), target.clone().addScaledVector(up, -0.12)];
  for (const p of pts) { const d = p.clone().sub(pos), L = d.length(); RC.set(pos, d.normalize()); RC.near = 0.05; RC.far = Math.max(0.1, L - 0.25);
    const hit = RC.intersectObjects(withPeople, false).find(h => !(subj && ownedBy(h.object, subj)) && !others.some(c => ownedBy(h.object, c))); if (hit) hid++; }
  let back = 0, seen = 0; for (const d of AXES) { RC.set(pos, d); RC.near = 0; RC.far = 2.5; const h = RC.intersectObjects(list, false).find(x => !(subj && ownedBy(x.object, subj))); if (!h || !h.face) continue; seen++;
    const nrm = h.face.normal.clone().applyMatrix3(NMX.getNormalMatrix(h.object.matrixWorld)).normalize(); if (nrm.dot(d) > 0.05 || h.distance < 0.12) back++; }
  // clutter right in front of the lens (a head, a shoulder, a lamp within 0.9 m across the middle of the frame)
  const fwd = target.clone().sub(pos).normalize(), rt = V(0, 0, 0).crossVectors(fwd, V(0, 1, 0)).normalize(), upv = V(0, 0, 0).crossVectors(rt, fwd); let near = 0;
  for (const [x, y] of [[0, 0], [0.22, 0], [-0.22, 0], [0, -0.16], [0.18, -0.14], [-0.18, -0.14]]) { RC.set(pos, fwd.clone().addScaledVector(rt, x).addScaledVector(upv, y).normalize()); RC.near = 0.02; RC.far = 0.9;
    if (RC.intersectObjects(list, false).some(h => !(subj && ownedBy(h.object, subj)))) near++; }
  let body = 0; scene.traverse(c => { if (c.name !== 'character' || !c.visible || !c.joints || c === subj) return; const J = c.joints(), ab = J.neck.clone().sub(J.pelvis), q = Math.max(0, Math.min(1, pos.clone().sub(J.pelvis).dot(ab) / (ab.lengthSq() || 1)));
    if (pos.distanceTo(J.pelvis.clone().addScaledVector(ab, q)) < 0.45 || pos.distanceTo(J.head) < 0.5) body = 1; });
  return hid / pts.length + (seen >= 4 && back >= 4 ? 1 : 0) + 0.2 * near + body;
}
function avoidPick(scene, pos, target, o, name) {   // rays must also see back faces (a lens inside a wall sees only those): double-side while testing
  if (name === 'insert' || name === 'lockerPeek' || name === 'doorWindow') return null;   // these framings are meant to look past things
  const mats = new Map(); for (const m of blockers(scene)) if (m.material.side !== THREE.DoubleSide) mats.set(m.material, m.material.side);
  for (const mt of mats.keys()) mt.side = THREE.DoubleSide; try { return pick0(scene, pos, target, o); } finally { for (const [mt, sd] of mats) mt.side = sd; }
}
function pick0(scene, pos, target, o) {
  scene.updateMatrixWorld(true); const subj = o.a && o.a.isObject3D ? o.a : null, ign = [o.b].filter(x => x && x.isObject3D);
  if (blockedK(scene, pos, target, subj, ign) < 0.35) return null;
  const piv = V(target.x, 0, target.z), rel = pos.clone().sub(piv), r0 = Math.hypot(rel.x, rel.z), a0 = Math.atan2(rel.x, rel.z);
  let best = null, bestK = 9;
  for (const da of [0, 12, -12, 24, -24, 36, -36, 50, -50, 65, -65, 80, -80, 100, -100]) for (const k of [1, 0.8, 0.62, 0.48]) {
    const a = a0 + da * Math.PI / 180, dy = k < 0.7 ? 0.15 : 0, cand = V(piv.x + Math.sin(a) * r0 * k, pos.y + dy, piv.z + Math.cos(a) * r0 * k);
    let face = 0; if (subj) { const f = V(Math.sin(subj.rotation.y), 0, Math.cos(subj.rotation.y)), c = cand.clone().sub(target).setY(0).normalize(); face = Math.max(0, Math.acos(Math.max(-1, Math.min(1, f.dot(c)))) - 1.4) * 0.5; }   // prefer seeing the face
    const kk = blockedK(scene, cand, target, subj, ign) + Math.abs(da) / 400 + (1 - k) * 0.15 + face; const res = { da: da * Math.PI / 180, k, dy };
    if (kk < bestK) { bestK = kk; best = res; } if (kk < 0.2) return res; }
  return best;
}
const PI = Math.PI;
