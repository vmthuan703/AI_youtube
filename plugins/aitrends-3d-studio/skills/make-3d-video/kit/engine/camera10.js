// engine/camera10.js — 1.0 named camera shots (T.camShot). Pick a framing by name in shots.json ("camera": "lowHero") and let the
// shot code call T.camShot(st.camera, t, info.shot.camera, { a: s.hero, b: s.maya, dur: info.dur }). Every framing drifts a little
// over the shot so nothing is frozen, and frames the subject's head from its own facing.
//
//   wide · full · medium · closeup · xcu (eyes) · ots (over a's shoulder onto b) · twoShot · lowHero · high · dutch · pushIn · pullBack
//   orbit · track (side tracking a moving subject) · reveal (rises from behind a's shoulder) · insert (an object: o.at [x,y,z])
// Options: a (character or [x,y,z]), b (second subject), side (+1 / -1: which side of the face, default +1 = subject's left),
// yaw (extra angle round the subject, radians), dist (scale on the framing distance), dur (shot length for the moves), fov.
import * as THREE from 'three';
import { clamp, lerp, ease } from './core.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const where = (s) => (!s ? V(0, 1.4, 0) : Array.isArray(s) ? V(...s) : s.isVector3 ? s.clone() : s.headWorld ? s.headWorld() : s.getWorldPosition(V(0, 0, 0)));
const feet = (s) => (!s ? V(0, 0, 0) : Array.isArray(s) ? V(s[0], 0, s[2]) : s.isVector3 ? V(s.x, 0, s.z) : s.getWorldPosition(V(0, 0, 0)));
const facing = (s) => (s && s.rotation && !Array.isArray(s) && !s.isVector3 ? s.rotation.y : 0);
export const CAMS = ['wide', 'full', 'medium', 'closeup', 'xcu', 'ots', 'twoShot', 'lowHero', 'high', 'dutch', 'pushIn', 'pullBack', 'orbit', 'track', 'reveal', 'insert'];

export function camShot(camera, t, name = 'medium', o = {}) {
  const dur = o.dur || 3, k = ease.inOut(clamp(t / dur)), drift = (t / dur) * 0.12, side = o.side ?? 1, ds = o.dist ?? 1;
  const A = where(o.a), FA = feet(o.a), yawA = facing(o.a) + (o.yaw ?? 0);
  // a point in front of a subject: ang = angle off its facing (0 = straight on), dist, height
  const front = (base, ang, dist, h) => V(base.x + Math.sin(yawA + ang) * dist, h, base.z + Math.cos(yawA + ang) * dist);
  let pos, look, fov = o.fov || 35, roll = 0;
  const head = A.clone(), chest = V(A.x, A.y - 0.38, A.z), waist = V(A.x, A.y - 0.7, A.z);
  switch (name) {
    case 'wide': { const B = o.b ? where(o.b) : A, mid = A.clone().lerp(B, 0.5), span = A.distanceTo(B); pos = front(V(mid.x, 0, mid.z), side * 0.35 + drift, (6.5 + span * 0.8) * ds, 1.7); look = V(mid.x, 1.0, mid.z); fov = o.fov || 38; break; }
    case 'full': pos = front(FA, side * 0.3 + drift, 4.2 * ds, 1.2); look = V(A.x, A.y - 0.55, A.z); fov = o.fov || 34; break;
    case 'medium': pos = front(FA, side * 0.38 + drift, 2.9 * ds, A.y - 0.15); look = chest; fov = o.fov || 34; break;
    case 'closeup': pos = front(FA, side * 0.32 + drift * 0.6, 1.75 * ds, A.y - 0.02); look = V(A.x, A.y - 0.06, A.z); fov = o.fov || 32; break;
    case 'xcu': pos = front(FA, side * 0.12, 0.95 * ds - drift * 0.4, A.y + 0.04); look = V(A.x, A.y + 0.04, A.z); fov = o.fov || 28; break;
    case 'ots': { const B = where(o.b || [A.x + Math.sin(yawA) * 2, A.y, A.z + Math.cos(yawA) * 2]), dir = B.clone().sub(A).setY(0).normalize(), sideV = V(dir.z, 0, -dir.x).multiplyScalar(side);
      pos = A.clone().addScaledVector(dir, -0.75 * ds).addScaledVector(sideV, 0.42).setY(A.y + 0.05); look = V(B.x, B.y - 0.12, B.z); pos.addScaledVector(sideV, drift * 0.6); fov = o.fov || 34; break; }
    case 'twoShot': { const B = o.b ? where(o.b) : A, mid = A.clone().lerp(B, 0.5), dir = B.clone().sub(A).setY(0).normalize(), n = V(-dir.z, 0, dir.x).multiplyScalar(side);
      pos = mid.clone().addScaledVector(n, (2.6 + A.distanceTo(B) * 0.9) * ds).setY(mid.y - 0.2); pos.addScaledVector(dir, drift * 2); look = V(mid.x, mid.y - 0.35, mid.z); fov = o.fov || 36; break; }
    case 'lowHero': pos = front(FA, side * 0.4, lerp(2.4, 1.9, k) * ds, 0.35); look = V(A.x, A.y + 0.05, A.z); fov = o.fov || 40; roll = side * 0.03; break;
    case 'high': pos = front(FA, side * 0.3 + drift, 2.6 * ds, A.y + 2.4); look = V(A.x, A.y - 0.5, A.z); fov = o.fov || 36; break;
    case 'dutch': pos = front(FA, side * 0.35, 2.4 * ds, A.y - 0.05); look = V(A.x, A.y - 0.1, A.z); fov = o.fov || 32; roll = side * (0.2 + 0.03 * k); break;
    case 'pushIn': pos = front(FA, side * 0.3, lerp(3.0, 1.7, k) * ds, lerp(A.y - 0.2, A.y - 0.02, k)); look = V(A.x, lerp(A.y - 0.35, A.y - 0.06, k), A.z); fov = o.fov || 32; break;
    case 'pullBack': pos = front(FA, side * 0.3, lerp(1.1, 6.5, k) * ds, lerp(A.y, 1.9, k)); look = V(A.x, lerp(A.y - 0.05, 0.9, k), A.z); fov = o.fov || 34; break;
    case 'orbit': { const ang = side * lerp(-0.7, 0.7, k); pos = front(FA, ang, 2.6 * ds, A.y - 0.1); look = chest; fov = o.fov || 34; break; }
    case 'track': { const fwd = V(Math.sin(yawA), 0, Math.cos(yawA)), sideV = V(fwd.z, 0, -fwd.x).multiplyScalar(-side); pos = A.clone().addScaledVector(sideV, 3.2 * ds).addScaledVector(fwd, 0.4).setY(A.y - 0.35); look = A.clone().addScaledVector(fwd, 0.5).setY(A.y - 0.45); fov = o.fov || 36; break; }
    case 'reveal': { const back = front(FA, PI + side * 0.25, 1.0 * ds, A.y - 0.3); pos = back.clone().setY(lerp(A.y - 0.6, A.y + 0.35, k)); const f = front(FA, 0, 6, A.y); look = V(f.x, lerp(A.y - 0.3, A.y, k), f.z); fov = o.fov || 38; break; }
    case 'insert': { const P = where(o.at || o.a); pos = V(P.x + 0.5 * side * ds, P.y + 0.35, P.z + 0.55 * ds - drift * 0.3); look = P; fov = o.fov || 30; break; }
    default: return camShot(camera, t, 'medium', o);
  }
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look); if (roll) camera.rotateZ(roll);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  return { pos, look };
}
const PI = Math.PI;
