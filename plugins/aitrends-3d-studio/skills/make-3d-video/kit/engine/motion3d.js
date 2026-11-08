// engine/motion3d.js — acting and camera helpers on top of rig3d/kit3d (all re-exported on T).
// Everything here is a pure function of time, so render workers that start on different frames agree.
//
//   s.hero.pose(T.walkTo(s.hero, t, { path: [[-3, 2], [0, 1], [2, 1]], t0: 0.3, t1: 3.2, end: 'handsOnHips' }));
//   s.mia.pose(T.speak3(T.idle3('relaxed', t, { seed: 2 }), 'MIA', info.globalT));
//   s.mia.face({ expr: [[0, 'smile'], [1.4, 'worried']], t, blink: true, speaker: 'MIA', gt: info.globalT });
//   T.lookAtSpeaker(s.leo, { MIA: s.mia, MOM: s.mom }, info.globalT);       // after .pose(): the head turns to whoever talks
//   T.dolly(cam, t, keys); T.crashZoom(cam, t, { at: 1.2, to: 18 }); T.handheld(cam, t, 0.6);
import * as THREE from 'three';
import { E, clamp, lerp, ease, prog, noise, hash01, speakerAt } from './core.js';
import { POSES3, walkPose3, blendPose3, breathe3 } from './rig3d.js';

const D2R = Math.PI / 180;
const getPose = (p) => (typeof p === 'string' ? POSES3[p] || POSES3.stand : p);
const angLerp = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k; };

// ---------------------------------------------------------------- walking without skating
// walkTo(ch, t, { from:[x,z], to:[x,z] | path:[[x,z],…], t0, t1, run, sprint, idle, end, yaw0, yaw1, y, accel, lean })
// Moves ch along the path between t0 and t1 with a real start and stop (speeds up over `accel` s, slows down the same),
// sets its position and facing, and returns the pose: the step cadence comes from the distance actually covered, so the
// feet don't slide, and the stride grows from the idle pose and shrinks back into it, so nothing pops at the ends.
// Before t0 it turns from yaw0 to the walking direction; after t1 it turns to yaw1 (both optional, radians).
export function walkTo(ch, t, o = {}) {
  const pts = o.path || [o.from, o.to], t0 = o.t0 ?? 0, t1 = o.t1 ?? (t0 + 2), sc = ch.scale?.y || 1;
  const segs = []; let L = 0; for (let i = 0; i + 1 < pts.length; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segs.push([L, d]); L += d; }
  const T = Math.max(0.05, t1 - t0), a = Math.min(o.accel ?? (o.sprint ? 0.25 : o.run ? 0.3 : 0.4), T / 2), vmax = L / (T - a), tau = clamp(t - t0, 0, T);
  const s = tau < a ? vmax * tau * tau / (2 * a) : tau < T - a ? vmax * (tau - a / 2) : L - vmax * (T - tau) ** 2 / (2 * a);
  const v = tau <= 0 || tau >= T ? 0 : tau < a ? vmax * tau / a : tau < T - a ? vmax : vmax * (T - tau) / a;
  const at = (d) => { let i = 0; while (i < segs.length - 1 && d > segs[i][0] + segs[i][1]) i++; const [s0, len] = segs[i], k = len ? clamp((d - s0) / len) : 0; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k), Math.atan2(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])]; };
  const [x, z] = at(s); ch.position.x = x; ch.position.z = z;
  if (o.y != null) ch.position.y = typeof o.y === 'function' ? o.y(x, z) : o.y;
  // facing: look a little ahead along the path so corners turn smoothly
  const ahead = at(Math.min(L, s + 0.35)), behind = at(Math.max(0, s - 0.05)); let yaw = Math.atan2(ahead[0] - behind[0], ahead[1] - behind[1]);
  if (!(Math.abs(ahead[0] - behind[0]) + Math.abs(ahead[1] - behind[1]) > 1e-4)) yaw = at(s)[2];
  const startYaw = at(0)[2], endYaw = at(L)[2];
  if (t < t0 && o.yaw0 != null) yaw = angLerp(o.yaw0, startYaw, ease.inOut(prog(t, t0 - 0.35, t0)));
  else if (t < t0) yaw = startYaw;
  if (t > t1) yaw = o.yaw1 != null ? angLerp(endYaw, o.yaw1, ease.inOut(prog(t, t1, t1 + 0.4))) : endYaw;
  ch.rotation.y = yaw;
  // cadence from distance: nominal stride per cycle (walk 1.45 m, run 2.85 m, sprint 4.7 m) adapted to the speed asked for
  const cad = o.sprint ? 1.9 : o.run ? 1.4 : 0.92, nominal = (o.sprint ? 4.7 : o.run ? 2.85 : 1.45) * sc;
  const stride = clamp(vmax / cad, nominal * 0.6, nominal * 1.5), phase = (s / stride) * Math.PI * 2;
  const gait = walkPose3(phase, { run: o.run, sprint: o.sprint, lean: (o.lean ?? 1) * clamp(v / Math.max(vmax, 1e-3)) });
  const idle = getPose(o.idle || 'stand'), end = getPose(o.end || o.idle || 'stand');
  const k = clamp((v / Math.max(vmax, 1e-3)) * 1.6);
  if (t >= t1) return end;
  return blendPose3(t < t0 + T / 2 ? idle : end, gait, ease.inOut(k));
}

// ---------------------------------------------------------------- idle life
// idle3(pose, t, { seed, k, weight, glance }) — breathe3 plus a weight shift from leg to leg every few seconds and a slow
// glance now and then. For anyone standing around (background people included); the hero's deadpan holds stay calmer with k 0.5.
export function idle3(pose, t, o = {}) {
  const seed = o.seed ?? 1, k = o.k ?? 1, p = breathe3(getPose(pose), t, k, seed), out = { ...p };
  const w = noise(t * 0.16 + seed * 3.1, seed + 11) * (o.weight ?? 1) * k;   // -1..1: which leg carries the weight
  out.hips = [p.hips[0], p.hips[1], p.hips[2] + 3.2 * w]; out.spine = [p.spine[0], p.spine[1], p.spine[2] - 2.2 * w];
  if (Array.isArray(p.legL) && Array.isArray(p.legR) && Math.abs(p.y || 0) < 0.08) {
    out.legL = [p.legL[0] + 3 * Math.max(0, -w), p.legL[1] + 1.5 * w, p.legL[2] + 9 * Math.max(0, -w), p.legL[3]];
    out.legR = [p.legR[0] + 3 * Math.max(0, w), p.legR[1] - 1.5 * w, p.legR[2] + 9 * Math.max(0, w), p.legR[3]];
  }
  // glance: hold a direction 2–5 s, half of the time straight ahead, turn in 0.35 s
  let at = 0, n = 0, cur = 0, prev = 0; while (n < 200) { const len = 2 + 3 * hash01(n, seed + 21); if (at + len > t) break; at += len; n++; prev = cur; cur = hash01(n, seed + 23) < 0.5 ? 0 : (hash01(n, seed + 29) - 0.5) * 36; }
  const g = lerp(prev, cur, ease.inOut(n ? clamp((t - at) / 0.35) : 1)) * (o.glance ?? 1) * k;
  out.head = [out.head[0], out.head[1] + g, out.head[2]];
  return out;
}

// ---------------------------------------------------------------- talking body
// speak3(pose, speaker, globalT, { k }) — while `speaker` talks: a small nod on each word, a bigger one on long words and
// numbers, and a beat of the free hand on stressed words. Wrap any pose (after idle3/breathe3). The narrator never does this.
export function speak3(pose, speaker, globalT, o = {}) {
  const p = getPose(pose), k = o.k ?? 1, sp = String(speaker).toUpperCase(), W = E.words;
  if (!W.length) return p;
  let nod = 0, beat = 0;
  for (let i = W.length - 1; i >= 0; i--) {
    const w = W[i]; if (w.start > globalT) continue; if (globalT - w.start > 0.6) break;
    if (String(w.speaker || 'NARRATOR').toUpperCase() !== sp) continue;
    const word = String(w.word || ''), strong = word.replace(/[^A-Za-z]/g, '').length >= 6 || /\d/.test(word) || /[!?]/.test(word);
    const b = Math.sin(Math.PI * clamp((globalT - w.start) / 0.32)); nod = Math.max(nod, b * (strong ? 1 : 0.45)); if (strong) beat = Math.max(beat, b);
  }
  if (!nod) return p;
  const out = { ...p, head: [p.head[0] + 5 * nod * k, p.head[1], p.head[2]], spine: [p.spine[0] + 1.5 * nod * k, p.spine[1], p.spine[2]] };
  const side = (o.hand || 'L') === 'L' ? 'armL' : 'armR', arm = p[side];
  if (beat && Array.isArray(arm) && arm[0] < 70) { out[side] = [arm[0] + 14 * beat * k, arm[1], arm[2] + 22 * beat * k, arm[3]]; out[side === 'armL' ? 'handL' : 'handR'] = 'open'; }
  return out;
}

// lookAtSpeaker(ch, { MIA: s.mia, MOM: s.mom }, globalT, { blend, k, y }) — after .pose(): turn ch's head toward whoever
// is talking (by script speaker name), and back to the pose's own head angle when nobody in the list talks. Turns take
// `blend` seconds and start from wherever the head was looking, so a change of speaker never snaps. k (default 0.6) turns
// the head only part of the way, so a listener's face stays toward the camera; k 1 = all the way.
export function lookAtSpeaker(ch, who, globalT, o = {}) {
  const blend = o.blend ?? 0.3, map = {}; for (const [k, v] of Object.entries(who)) map[k.toUpperCase()] = v;
  const head = ch.parts.head, base = [head.rotation.x, head.rotation.y];
  const dir = (name) => { const c = name && map[name]; if (!c || c === ch) return base; const p = c.headWorld(); p.y += o.y ?? 0; return ch.lookAngles(p) || base; };
  const s = speakerAt(globalT), cur = dir(s.speaker), prev = dir(s.prev);
  const k = ease.inOut(clamp(s.since / blend)) * (o.k ?? 0.6);
  const a = [lerp(prev[0], cur[0], k), lerp(prev[1], cur[1], k)];
  head.rotation.set(a[0], a[1], head.rotation.z, 'YXZ'); return ch;
}

// ---------------------------------------------------------------- camera
// handheld(camera, t, amount = 1, seed) — a person holding the camera: slow drift plus a faint fast tremor, mostly as
// rotation (scaled down on long lenses so close-ups don't swim). Call after the camera is placed. The player adds a light
// one to every 3D shot by itself (config.handheld, default 0.35; shots.json "handheld": 0 turns it off for one shot).
export function handheld(camera, t, amount = 1, seed = 1) {
  if (!amount) return; const f = clamp(camera.fov / 38, 0.45, 1.2) * amount;
  const yaw = (noise(t * 0.32, seed) * 0.0035 + noise(t * 1.7, seed + 2) * 0.0006) * f, pitch = (noise(t * 0.27, seed + 4) * 0.0026 + noise(t * 1.9, seed + 6) * 0.0005) * f, roll = noise(t * 0.21, seed + 8) * 0.0022 * f;
  camera.rotateY(yaw); camera.rotateX(pitch); camera.rotateZ(roll);
  camera.translateX(noise(t * 0.25, seed + 10) * 0.006 * amount); camera.translateY(noise(t * 0.3, seed + 12) * 0.005 * amount);
}
// chase(camera, t, tt => [x, y, z], { offset, look, lag, ahead }) — follow a moving subject like a camera operator: the
// position trails the subject by about `lag` seconds (smoothed), the aim leads it a little. posFn gives the subject at any time.
export function chase(camera, t, posFn, o = {}) {
  const off = o.offset || [0, 1.6, 5], lk = o.look || [0, 1.1, 0], lag = o.lag ?? 0.35, N = 8; const p = [0, 0, 0]; let wsum = 0;
  for (let i = 0; i < N; i++) { const w = 1 - i / N, q = posFn(t - (lag * 2 * i) / N); p[0] += q[0] * w; p[1] += q[1] * w; p[2] += q[2] * w; wsum += w; }
  const a = posFn(t + (o.ahead ?? 0.12)); camera.position.set(p[0] / wsum + off[0], p[1] / wsum + off[1], p[2] / wsum + off[2]); camera.up.set(0, 1, 0);
  camera.lookAt(a[0] + lk[0], a[1] + lk[1], a[2] + lk[2]);
}
// crashZoom(camera, t, { at, dur, to, from, push }) — a fast zoom onto the subject on a word (at = shot-local time, e.g.
// wordTime('million') - info.shot.start). Narrows the lens to `to` in `dur` s and pushes `push` m along the view. Call after
// the camera is placed. Pair with a whoosh/hit SFX.
export function crashZoom(camera, t, o = {}) {
  const k = ease.out(prog(t, o.at ?? 0, (o.at ?? 0) + (o.dur ?? 0.2))); if (k <= 0) return 0;
  const from = o.from ?? camera.fov, fov = lerp(from, o.to ?? from * 0.55, k); if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.translateZ(-(o.push ?? 0.25) * k); return k;
}
// punch(camera, t, at, { amp, dur }) — an impact: a quick bump toward the subject and a shake that dies away (hits, slams, landings)
export function punch(camera, t, at, o = {}) {
  const d = t - at, dur = o.dur ?? 0.4; if (d < 0 || d > dur) return; const amp = o.amp ?? 1, k = 1 - d / dur, decay = k * k;
  camera.translateZ(-0.12 * amp * Math.sin(Math.PI * clamp(d / 0.12)) * (d < 0.12 ? 1 : 0));
  camera.rotateZ(Math.sin(d * 55) * 0.012 * amp * decay); camera.translateX(Math.sin(d * 47 + 1) * 0.03 * amp * decay); camera.translateY(Math.cos(d * 61) * 0.02 * amp * decay);
}
// dutch(camera, deg) — tilt the horizon (tension, something is wrong). Call after the camera is placed.
export const dutch = (camera, deg) => { camera.rotateZ(deg * D2R); };
// rackFocus(st, t, [[0, objOrPoint], [1.6, objOrPoint]], dur = 0.45) — move the focus from one subject to the next
// (characters → their head, Object3D → its position, or [x, y, z]). Needs a stage with dof.
export function rackFocus(st, t, keys, dur = 0.45) {
  const pt = (x) => (Array.isArray(x) ? new THREE.Vector3(...x) : x.headWorld ? x.headWorld() : x.isVector3 ? x.clone() : x.getWorldPosition(new THREE.Vector3()));
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const cur = pt(keys[i][1]); if (i === 0) { st.focusOn(cur); return; }
  st.focusOn(pt(keys[i - 1][1]).lerp(cur, ease.inOut(prog(t, keys[i][0], keys[i][0] + dur))));
}

// ---------------------------------------------------------------- first-person view (0.2.7)
// pov(camera, ch, t, { look, ahead, drop, fov, walk, bob, roll }) — see through a character's eyes: their head and hair are hidden,
// the camera sits at their eyes, and their own sleeves and ball hands come into frame when the arms reach forward (use T.povArms).
// The hero's lime puffer in the bottom of frame tells the viewer whose eyes these are. look: a world point; default straight ahead
// and a little down. walk: true adds a step bob (bob = cadence in Hz, default 1.8) and a slight sway.
export function pov(camera, ch, t, o = {}) {
  const P = ch.parts || {}; [P.head, P.hair, P.neck].forEach(x => { if (x) x.visible = false; });
  ch.updateMatrixWorld(true); const head = ch.headWorld(), yaw = ch.rotation.y, fx = Math.sin(yaw), fz = Math.cos(yaw), sc = ch.scale?.y || 1;
  const bob = o.walk ? Math.abs(Math.sin(t * Math.PI * (o.bob ?? 1.8))) * 0.035 * sc : 0, sway = o.walk ? Math.sin(t * Math.PI * (o.bob ?? 1.8) / 2) * 0.02 : 0;
  camera.position.set(head.x + fx * 0.12 * sc - fz * sway, head.y - 0.04 * sc + bob, head.z + fz * 0.12 * sc + fx * sway);
  const L = o.look || [head.x + fx * (o.ahead ?? 3), head.y - (o.drop ?? 0.9) * sc, head.z + fz * (o.ahead ?? 3)];
  camera.up.set(0, 1, 0); camera.lookAt(...L); if (o.roll || o.walk) camera.rotateZ((o.roll ?? 0) + (o.walk ? sway * 0.4 : 0));
  const fov = o.fov ?? 64; if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  if (camera.near > 0.03) { camera.near = 0.03; camera.updateProjectionMatrix(); }
}
// povArms({ reach, height, spread, hands, base }) → a pose with both arms held out in front (holding a gift, a steering wheel, a phone,
// a cube). reach = metres in front of the chest, height = hand height (character space), spread = distance between the hands.
export function povArms(o = {}) {
  const r = o.reach ?? 0.5, h = o.height ?? 1.12, sp = o.spread ?? 0.36, base = typeof o.base === 'string' ? POSES3[o.base] : (o.base || POSES3.stand);
  return { ...base, armL: { to: [sp / 2, h, r] }, armR: { to: [-sp / 2, h, r] }, handL: o.hands || 'open', handR: o.hands || 'open', head: [0, 0, 0] };
}
