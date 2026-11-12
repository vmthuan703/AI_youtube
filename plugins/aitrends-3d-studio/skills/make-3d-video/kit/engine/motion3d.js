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
import { POSES3, walkPose3, blendPose3, breathe3, posesAt3, flow3 } from './rig3d.js';

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
  const stride = clamp(vmax / cad, nominal * 0.6, nominal * 1.5);
  // 1.0.3: while the walk eases in or out the legs swing with a smaller amplitude (blended with the idle pose), so the same distance
  // needs more steps: integrate speed / (stride × amplitude) instead of distance / stride. Deterministic (fixed 1/120 s steps).
  const vAt = (u) => u <= 0 || u >= T ? 0 : u < a ? vmax * u / a : u < T - a ? vmax : vmax * (T - u) / a;
  let phase = 0; { const dt = 1 / 120; for (let u = 0; u < tau; u += dt) { const h = Math.min(dt, tau - u), vv = vAt(u + h / 2), kb = ease.inOut(clamp((vv / Math.max(vmax, 1e-3)) * 1.6)); phase += vv * h / (stride * Math.max(0.35, kb)); } phase *= Math.PI * 2; }
  ch.userData.mo = { ...(ch.userData.mo || {}), v, phase };   // 1.0: drives hair / strings / bag swing in pose()
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
// 1.0.3 listen3(pose, me, globalT, { k, who }): while someone else talks (optionally only `who`), small nods on their stressed words
// and a slower nod when a line ends, plus a slight head tilt toward the conversation. Pure function of time.
export function listen3(pose, me, globalT, o = {}) {
  const p = getPose(pose), W = E.words, k = o.k ?? 1, mine = String(me || '').toUpperCase(); if (!W.length) return p;
  let nod = 0, live = false;
  for (let i = W.length - 1; i >= 0; i--) { const w = W[i]; if (w.start > globalT) continue; if (globalT - w.end > 1.2) break;
    const sp = String(w.speaker || 'NARRATOR').toUpperCase(); if (sp === mine || sp === 'NARRATOR' || (o.who && sp !== String(o.who).toUpperCase())) continue; live = true;
    const raw = String(w.word || ''), strong = raw.replace(/[^A-Za-z]/g, '').length >= 7 || /[!?.]$/.test(raw);
    if (strong) { const u = (globalT - w.end) / 0.5; if (u > 0 && u < 1) nod = Math.max(nod, Math.sin(Math.PI * u) * (/[.!?]$/.test(raw) ? 1 : 0.5)); } }
  if (!live) return p;
  const tilt = 3 * (hash01(mine.length * 7.3) - 0.5) * 2;
  return { ...p, head: [p.head[0] + 6 * nod * k, p.head[1], p.head[2] + tilt * k] };
}
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

// ---------------------------------------------------------------- arm wrestling (0.2.8)
// armWrestle(k, o) → { a, b }: two seated poses across a table, right hands gripped over the middle. k −1..1 is who is winning:
// +1 = a pins b's hand down to a's left, −1 = b pins a. The rig's arms are short (0.5 m), so sit them close: a at [x, tableZ − 0.6]
// yaw 0 and b at [x, tableZ + 0.6] yaw PI ('sitDesk' height, bench 0.42). o.strain 0..1 adds the shake of two arms pushing.
// Camera: on the side (x ± 3.2 from them), just above the table (y ≈ 1.0, look at y 0.95), fov 26–30, so both forearms and the grip read
// as one shape between the two heads. From behind one player the big head hides the hands (lesson from Every Hit Stronger 3:33).
export function armWrestle(k, o = {}) {
  const t = o.t ?? 0, sh = (o.strain ?? 0.5) * 0.05 * Math.sin(t * 37), th = clamp(k, -1, 1) * 1.15 + sh;   // radians off vertical
  const L = 0.24, hx = L * Math.sin(th), hy = 0.8 + L * Math.cos(th), hz = (o.reach ?? 0.6);
  const seat = { y: -0.2, legL: [88, 6, 88, 0], legR: [88, 6, 88, 0] };
  const side = (s) => ({ ...seat, spine: [14 + 4 * Math.abs(k), -8 * s * k, -6 * s * k], head: [-4, 0, 0],
    armR: { to: [s * hx, hy, hz], pole: [-0.6, 0.6, 0.3] }, handR: 'fist',
    armL: { to: [0.3, 0.86, 0.35] }, handL: 'open' });
  return { a: side(1), b: side(-1) };
}

// ---------------------------------------------------------------- hands on an object (lifting, pushing, holding) (0.2.8)
// reachPose(o) → a pose whose hands grip at a point in front: o.grip [height above the ground, distance in front] in metres
// (world units, the character's scale o.scale is taken out), o.width hand spacing, o.squat 0..1 bends the knees and back.
// Stand the character so the object really is within reach: distance in front 0.25–0.45. A hand that stops in the air
// a metre from the car reads as "nothing is being lifted" (lesson from the car shot in Every Hit Stronger).
export function reachPose(o = {}) {
  const sc = o.scale ?? 1, sq = o.squat ?? 0, y = -0.25 * sq, [gy, gd] = o.grip || [0.9, 0.35], w = (o.width ?? 0.6) / 2;
  return { y, spine: [lerp(-4, 30, sq) + (o.lean ?? 0), 0, 0], head: [-14 * sq, 0, 0], legL: [60 * sq, 12, 90 * sq, 0], legR: [60 * sq, 12, 90 * sq, 0],
    armL: { to: [w, (gy - y) / sc, gd / sc] }, armR: { to: [-w, (gy - y) / sc, gd / sc] }, handL: o.hand || 'fist', handR: o.hand || 'fist' };
}

// ---------------------------------------------------------------- body motion layered on any pose (0.2.8)
// body3(pose, t, kind, amount) adds the small movements that make people look alive and feel things:
// 'pant' (heavy breathing after effort), 'sob' (shoulders jerk, head low), 'laugh' (bounce + head back), 'shiver' (cold/fear),
// 'nod', 'shake' (head no), 'sigh' (rise then slump, once over 1.6 s from t0), 'strain' (trembling effort), 'fidget' (nervous weight shifts).
export function body3(pose, t, kind, amount = 1, o = {}) {
  const p = { ...getPose(pose) }, a = amount, add = (k, v) => { const b = p[k] || [0, 0, 0]; p[k] = Array.isArray(b) ? b.map((x, i) => x + (v[i] || 0)) : b; };
  const s = Math.sin, T0 = o.t0 ?? 0;
  if (kind === 'pant') { const b = s(t * 9); add('spine', [6 * a * b, 0, 0]); add('head', [-4 * a * b, 0, 0]); p.y = (p.y || 0) - 0.01 * a * (1 + b); }
  else if (kind === 'sob') { const j = Math.max(0, s(t * 11)) ** 3; add('spine', [10 * a + 8 * a * j, 0, 0]); add('head', [16 * a, 0, 0]); p.y = (p.y || 0) + 0.015 * a * j; }
  else if (kind === 'laugh') { const j = Math.abs(s(t * 12)); add('spine', [-6 * a - 6 * a * j, 0, 0]); add('head', [-14 * a * j, 0, 0]); p.y = (p.y || 0) + 0.02 * a * j; }
  else if (kind === 'shiver') { add('spine', [0, 0, 2.5 * a * s(t * 45)]); add('head', [0, 3 * a * s(t * 51), 0]); }
  else if (kind === 'nod') add('head', [14 * a * Math.max(0, s(t * 7)), 0, 0]);
  else if (kind === 'shake') add('head', [4 * a, 22 * a * s(t * 9), 0]);
  else if (kind === 'sigh') { const u = clamp((t - T0) / 1.6), up = s(Math.PI * clamp(u * 2)) * (u < 0.5 ? 1 : 0), dn = ease.inOut(clamp((u - 0.4) / 0.6)); add('spine', [-6 * a * up + 12 * a * dn, 0, 0]); add('head', [-8 * a * up + 14 * a * dn, 0, 0]); p.y = (p.y || 0) + 0.02 * a * up - 0.02 * a * dn; }
  else if (kind === 'strain') { add('spine', [0, 0, 1.5 * a * s(t * 31)]); add('head', [2 * a * s(t * 27), 0, 3 * a * s(t * 23)]); }
  else if (kind === 'fidget') { const w = noise(t * 0.8, 3); add('hips', [0, 0, 6 * a * w]); add('spine', [0, 0, -5 * a * w]); add('head', [0, 10 * a * noise(t * 0.6, 9), 0]); }
  return p;
}

// ================================================================ 1.0 motion: stairs, jumps with squash & stretch, sitting down, turning on the spot
// squash(ch, k) — volume-keeping squash (k < 1) or stretch (k > 1) from the feet. 1 = normal.
export function squash(ch, k = 1) { const sx = 1 / Math.sqrt(Math.max(0.3, k)); ch.scale.set(sx, k, sx); return ch; }

// climb(ch, t, { path: [[x,y,z], …], t0, t1, run, end, idle }) — walkTo along a 3D path (stairs from T.W.stairwell().up,
// T.W.residential().stoops[i].up, T.W.stairs().path()): the height follows the path, and on sloped stretches the knees lift
// higher and the body leans into the climb (down: leans back a little).
export function climb(ch, t, o = {}) {
  const P = o.path || [], segs = [];
  for (let i = 0; i + 1 < P.length; i++) segs.push([P[i], P[i + 1]]);
  const yAt = (x, z) => { let best = 1e9, y = P[0]?.[1] ?? 0, slope = 0;
    for (const [a, b] of segs) { const dx = b[0] - a[0], dz = b[2] - a[2], L2 = dx * dx + dz * dz || 1e-6, k = clamp(((x - a[0]) * dx + (z - a[2]) * dz) / L2), px = a[0] + dx * k, pz = a[2] + dz * k, dd = (x - px) ** 2 + (z - pz) ** 2;
      if (dd < best - 1e-6) { best = dd; y = lerp(a[1], b[1], k); slope = (b[1] - a[1]) / Math.sqrt(L2); } }
    return [y, slope]; };
  const pose = walkTo(ch, t, { ...o, path: P.map(p => [p[0], p[2]]), y: (x, z) => yAt(x, z)[0] });
  const [, slope] = yAt(ch.position.x, ch.position.z), up = clamp(slope / 0.6, -1, 1);
  if (Math.abs(up) < 0.05 || !Array.isArray(pose.legL) || !Array.isArray(pose.legR)) return pose;
  const lift = (l) => [l[0] + Math.max(0, l[0]) * 0.9 * Math.abs(up) + 8 * Math.abs(up), l[1], l[2] + (up > 0 ? 34 : 18) * Math.abs(up) * clamp(0.3 + Math.max(0, l[0]) / 20), l[3]];
  return { ...pose, legL: lift(pose.legL), legR: lift(pose.legR), spine: [pose.spine[0] + (up > 0 ? 9 : -4) * Math.abs(up), pose.spine[1], pose.spine[2]], head: [pose.head[0] + (up > 0 ? 4 : 8) * Math.abs(up), pose.head[1], pose.head[2]] };
}

// jump3(ch, t, { t0, from: [x,y,z], to: [x,y,z], h, air, land, end }) — a cartoon jump: crouch to load (0.22 s before t0),
// stretch on take-off, an arc of height h for `air` seconds with the legs tucked at the top, a squash on landing, a springy
// recovery. Sets position, facing (toward `to`), and squash/stretch; returns the pose.
export function jump3(ch, t, o = {}) {
  const t0 = o.t0 ?? 0.5, air = o.air ?? 0.6, from = o.from || [ch.position.x, ch.position.y, ch.position.z], to = o.to || from, h = o.h ?? 0.8, pre = 0.22, rec = 0.45;
  const yaw = Math.hypot(to[0] - from[0], to[2] - from[2]) > 0.05 ? Math.atan2(to[0] - from[0], to[2] - from[2]) : (o.yaw ?? ch.rotation.y); ch.rotation.y = yaw;
  const crouch = getPose('crouch'), stand = getPose(o.idle || 'stand'), inAir = getPose('jump'), end = getPose(o.end || o.idle || 'stand');
  if (t < t0 - pre) { ch.position.set(...from); squash(ch, 1); return stand; }
  if (t < t0) { const k = ease.inOut(prog(t, t0 - pre, t0)); ch.position.set(...from); squash(ch, 1 - 0.1 * k); return blendPose3(stand, crouch, k * 0.8); }
  if (t < t0 + air) { const k = (t - t0) / air; ch.userData.mo = { vy: (4 * h * (1 - 2 * k)) / air }; ch.position.set(lerp(from[0], to[0], k), lerp(from[1], to[1], k) + 4 * h * k * (1 - k), lerp(from[2], to[2], k));
    squash(ch, 1 + 0.16 * Math.max(0, 1 - k * 4) + 0.08 * Math.max(0, k * 4 - 3)); const tuck = Math.sin(Math.PI * k); return blendPose3(blendPose3(crouch, inAir, ease.out(clamp(k * 5))), crouch, tuck * 0.35); }
  const u = (t - t0 - air) / rec; ch.position.set(...to);
  if (u < 1) { squash(ch, 1 - 0.18 * Math.exp(-u * 5) * Math.cos(u * 9)); return blendPose3(crouch, end, ease.out(clamp(u * 1.2))); }
  squash(ch, 1); return end;
}

// sitDown(ch, t, { seat: [x, z, yaw], y, t0, dur, from, to, up, back }) — stand → sit the way people do: knees bend and the chest
// leans forward while the hips travel back from in front of the seat (`back` m, default 0.32) onto it, then the body settles
// upright with a small give. The feet stay planted. up: true plays it in reverse (standing up ends at sitDown.front(seat)).
// The old form sitDown(t, o) still returns just the pose (place the character yourself).
export function sitDown(ch, t, o) {
  if (typeof ch === 'number') { o = t || {}; t = ch; ch = null; }
  o = o || {}; const t0 = o.t0 ?? 0, dur = o.dur ?? 0.9, a = getPose(o.from || 'stand'), b = getPose(o.to || 'sit');
  let u = prog(t, t0, t0 + dur); if (o.up) u = 1 - u;
  // the legs lead (thighs fold early), the hips drop later: two eased curves from one clock
  const kLeg = ease.inOut(clamp(u * 1.25)), kHip = ease.inOut(clamp((u - 0.12) / 0.88)), lean = Math.sin(Math.PI * clamp(u * 1.1)) * (o.lean ?? 26);
  const p = blendPose3(a, b, kLeg), settle = o.up ? 0 : Math.sin(Math.PI * clamp((u - 0.85) / 0.15)) * 0.012;
  const out = { ...p, y: lerp(a.y || 0, b.y || 0, kHip) - settle, spine: [p.spine[0] + lean, p.spine[1], p.spine[2]], head: [p.head[0] - lean * 0.55, p.head[1], p.head[2]],
    armL: Array.isArray(p.armL) ? [p.armL[0] + lean * 0.8, p.armL[1], p.armL[2] + lean, p.armL[3]] : p.armL, armR: Array.isArray(p.armR) ? [p.armR[0] + lean * 0.8, p.armR[1], p.armR[2] + lean, p.armR[3]] : p.armR };
  if (ch && o.seat) { const [x, z, yaw] = o.seat, back = (o.back ?? 0.32) * (1 - kHip); ch.position.set(x + Math.sin(yaw) * back, o.y ?? 0, z + Math.cos(yaw) * back); ch.rotation.y = yaw; }
  return out;
}
// where to stand before sitting down (and where standing up ends): [x, z] in front of the seat
sitDown.front = (seat, back = 0.32) => [seat[0] + Math.sin(seat[2]) * back, seat[1] + Math.cos(seat[2]) * back];

// turn3(ch, t, { t0, from, to, dur, pose }) — turn on the spot: the head leads, the body follows, and the feet step twice.
export function turn3(ch, t, o = {}) {
  const t0 = o.t0 ?? 0, dur = o.dur ?? 0.55, k = prog(t, t0, t0 + dur), e = ease.inOut(k), base = getPose(o.pose || 'stand');
  ch.rotation.y = angLerp(o.from ?? 0, o.to ?? 0, e);
  if (k <= 0 || k >= 1) return base;
  { let dd = ((o.to - o.from + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; ch.userData.mo = { yawRate: dd / dur * Math.sin(Math.PI * k) * 1.5 }; }
  let d = ((o.to - o.from + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  const lead = (1 - e) * d * 0.45 / D2R * Math.min(1, k * 4), stepL = Math.max(0, Math.sin(Math.PI * k * 2)) * 16, stepR = Math.max(0, -Math.sin(Math.PI * k * 2)) * 16;
  const leg = (l, s) => Array.isArray(l) ? [l[0] + s, l[1], l[2] + s * 1.6, l[3]] : l;
  return { ...base, head: [base.head[0], base.head[1] + clamp(lead, -40, 40), base.head[2]], legL: leg(base.legL, stepL), legR: leg(base.legR, stepR), y: (base.y || 0) + 0.02 * Math.sin(Math.PI * k * 2) ** 2 };
}

// ================================================================ 1.0.1 school motion: throws, lockers, tossed things
// throw3(t, { t0, wind, idle, end }) — an overhand right-hand throw (football, snowball, a paper ball) as one flowing movement
// (flow3): hold the ball at the chest → turn the throwing shoulder back, cock the arm behind the head, point the free hand at the
// target, load the back leg → step with the left foot, hips then shoulders rotate through, the arm whips over the top, the ball
// leaves the hand at t0 → follow-through across the body, chest down, back heel lifts → settle. T.throwHand(ch) gives the hand.
export function throw3(t, o = {}) {
  const t0 = o.t0 ?? 0.8, w = o.wind ?? 0.55;
  const hold = { y: 0, hips: [0, 0, 0], spine: [4, 0, 0], head: [2, 0, 0], armL: { to: [0.1, 0.98, 0.24], pole: [0.6, 0.6, -0.2] }, armR: { to: [-0.08, 0.98, 0.26], pole: [-0.6, 0.6, -0.2] }, legL: [2, 6, 4, 0], legR: [0, 6, 4, 0], handL: 'open', handR: 'fist' };
  const cock = { y: -0.05, hips: [0, -22, 0], spine: [-6, -30, 0], head: [-2, 30, 0], armL: { to: [0.24, 1.22, 0.48], pole: [0.7, 0.9, -0.2] }, armR: { to: [-0.36, 1.52, -0.3], pole: [-0.8, 1.1, 0.1] }, legL: [26, 8, 30, 0], legR: [-8, 8, 22, 0], handL: 'open', handR: 'fist' };
  const step = { y: -0.08, hips: [0, -4, 0], spine: [2, -16, 0], head: [-2, 16, 0], armL: { to: [0.3, 1.12, 0.36], pole: [0.8, 0.8, -0.2] }, armR: { to: [-0.32, 1.62, -0.12], pole: [-0.8, 1.2, -0.1] }, legL: [34, 8, 14, 0], legR: [-24, 8, 24, 0], handL: 'open', handR: 'fist' };
  const release = { y: -0.07, hips: [0, 18, 0], spine: [12, 24, 0], head: [-4, -18, 0], armL: { to: [0.26, 0.98, 0.08], pole: [0.8, 0.8, -0.3] }, armR: { to: [-0.06, 1.66, 0.52], pole: [-0.7, 1.4, 0.0] }, legL: [32, 8, 16, 0], legR: [-34, 8, 22, 0], handL: 'fist', handR: 'open' };
  const follow = { y: -0.08, hips: [0, 20, 0], spine: [22, 22, 0], head: [-12, -18, 0], armL: { to: [0.3, 0.9, -0.05], pole: [0.8, 0.8, -0.4] }, armR: { to: [0.2, 0.86, 0.38], pole: [-0.4, 0.9, 0.5] }, legL: [30, 8, 22, 0], legR: [-42, 8, 58, 0], handL: 'fist', handR: 'open' };
  const settle = { y: -0.02, hips: [0, 10, 0], spine: [8, 10, 0], head: [-4, -8, 0], armL: { to: [0.22, 0.72, 0.06], pole: [0.7, 0.6, -0.3] }, armR: { to: [-0.2, 0.74, 0.12], pole: [-0.7, 0.6, -0.3] }, legL: [10, 8, 8, 0], legR: [-8, 8, 10, 0], handL: 'relaxed', handR: 'relaxed' };
  return flow3(t, [[0, hold], [t0 - w - 0.25, hold], [t0 - w * 0.45, cock], [t0 - 0.12, step], [t0, release], [t0 + 0.28, follow], [t0 + 0.95, settle]]);
}
// the throwing hand's world position at time tt (pose the character at tt, read the hand, pose it back): where a held ball sits
// before release and where its flight starts. hand: 'R' (default) or 'L'.
export function throwHand(ch, tt, o = {}) { ch.pose(throw3(tt, o)); ch.updateMatrixWorld(true); return ch.handWorld(o.hand || 'R'); }
// reachTo(ch, world) — a world point in the character's own space, for an IK arm: armR: { to: T.reachTo(ch, p) }
export function reachTo(ch, p) { ch.updateMatrixWorld(true); const v = (p.isVector3 ? p.clone() : new THREE.Vector3(...p)); ch.worldToLocal(v); const k = ch.scale?.y || 1; return [v.x / k, v.y / k, v.z / k]; }
// toss(obj, t, { from, to, h, t0, dur, spin, hide }) — an object flying on an arc (snowball, football, a cap, a note). Before t0 it sits at
// `from` (or is hidden: hide true); after landing it stays at `to`. spin: [x, y, z] turns per second. Returns progress 0..1.
export function toss(obj, t, o = {}) { const t0 = o.t0 ?? 0, dur = o.dur ?? 0.8, k = clamp((t - t0) / dur), f = o.from || [0, 1, 0], to = o.to || f, h = o.h ?? 1;
  obj.visible = !(o.hide && t < t0); obj.position.set(lerp(f[0], to[0], k), lerp(f[1], to[1], k) + 4 * h * k * (1 - k), lerp(f[2], to[2], k));
  const sp = o.spin || [0, 0, 0], u = Math.max(0, Math.min(t, t0 + dur) - t0); obj.rotation.set(sp[0] * u * Math.PI * 2, sp[1] * u * Math.PI * 2, sp[2] * u * Math.PI * 2); return k; }
// lockerDoor(door, t, { t0, open, dur, slam }) — swing a T.W.lockerHall locker door (its pivot): opens to `open` rad (default 1.9);
// slam: a time when it is slammed shut with a rattle. Returns the angle.
export function lockerDoor(door, t, o = {}) { const t0 = o.t0 ?? 0, op = o.open ?? 1.9, dur = o.dur ?? 0.5; let a = op * ease.out(clamp((t - t0) / dur));
  if (o.slam != null && t >= o.slam) { const u = t - o.slam; a = u < 0.12 ? op * (1 - u / 0.12) ** 2 : 0.08 * Math.exp(-(u - 0.12) * 9) * Math.abs(Math.sin((u - 0.12) * 40)); }
  door.rotation.y = -a * (o.dir ?? 1); return a; }
