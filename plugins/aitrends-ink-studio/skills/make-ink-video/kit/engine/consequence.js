// engine/consequence.js — T.CQ: the rulebook's "every hit leaves a mark" helpers (rules/RULES.md R01, R02).
// All are pure functions of t (they tick through st.onTick, or call .update(t) yourself).
//   const hit = T.CQ.impact(T, st, { pos: [x, y, z], normal: [0, 0, 1], t0: 0.4, size: 1.2 });   // flash, breach, chunks, dust, shake
//   hit.shake(st.camera, t);                                                                      // after the camera is placed
//   T.CQ.scar(T, st, { pos, normal, size });                                                      // later shots in the same place (R02)
//   const sw = T.CQ.beamSweep(T, st, { from: [x, y, z], to: [x, y, z], t0: 0.2, dur: 0.9, hits: [{ pos, normal, size }] });
import * as THREE from 'three';
import * as FX3 from './fx3d.js';

const RUBBLE = ['#a89eb2', '#8e86a0', '#bfae9e', '#d0c4b4'];
const up = new THREE.Vector3(0, 0, 1);

// a dark jagged hole lying on a surface (wall or road), facing `normal`; the ink pass draws its ragged edge
function breach(T, size, seed = 1) {
  const r = T.rng(seed), sh = new THREE.Shape(), n = 13;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, rr = size * (0.55 + r() * 0.45) * (i % 2 ? 0.7 : 1); const x = Math.cos(a) * rr, y = Math.sin(a) * rr * 0.85; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: '#141022', side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
  const rim = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: '#5a5068', side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 }));
  rim.scale.setScalar(1.18); const g = new THREE.Group(); g.add(rim, m); m.position.z = 0.004; return g;
}
function orient(obj, pos, normal) { const nv = new THREE.Vector3(...normal).normalize(); obj.quaternion.setFromUnitVectors(up, nv); obj.position.set(...pos).addScaledVector(nv, 0.03); }

export function impact(T, st, o = {}) {
  const pos = o.pos || [0, 1, 0], normal = o.normal || [0, 0, 1], t0 = o.t0 ?? 0, size = o.size ?? 1, nv = new THREE.Vector3(...normal).normalize();
  const out = new THREE.Vector3(...pos).addScaledVector(nv, 0.25 * size).toArray();
  const hole = breach(T, 1.0 * size, o.seed ?? 3); orient(hole, pos, normal); hole.userData.dynamic = true; st.add(hole);
  const deb = FX3.debris(st, { pos: out, t0, n: Math.round(34 * size), size: 0.28 * size, colors: o.colors || RUBBLE, floorY: o.floorY ?? 0 });
  const bur = o.confetti ? FX3.burst(st, { pos: out, t0, confetti: true }) : null;
  const smk = FX3.smoke(st, { pos: out, t0: t0 + 0.05, dur: o.linger ?? 2.6, rate: 12 * size, size: 1.0 * size, grow: 2.4, rise: 0.9, color: o.dust || '#8a8298', opacity: 0.6 });
  const flash = T.glow ? T.glow(o.flash || '#ffe2a8', 1.6, 0.9) : null; if (flash) { flash.position.set(...out); st.add(flash); }
  const update = (t) => { const k = t - t0; hole.visible = k >= 0; if (k >= 0) hole.scale.setScalar(Math.min(1, 0.35 + k * 9));
    deb.update(t); bur?.update?.(t); smk.update(t);
    if (flash) { const f = Math.max(0, 1 - Math.abs(k - 0.06) / 0.3); flash.visible = f > 0; flash.scale.setScalar((1 + 2.5 * f) * size); flash.material.opacity = f; } };
  update(0); st.onTick?.(update);
  return { update, hole, shake: (cam, t) => T.punch?.(cam, t, t0, { amp: 0.07 * size, dur: 0.55 }) };
}

// what is left afterwards: the hole and a thin smoke wisp, for every later shot in the same place
export function scar(T, st, o = {}) {
  const pos = o.pos || [0, 1, 0], normal = o.normal || [0, 0, 1], size = o.size ?? 1;
  const hole = breach(T, 1.0 * size, o.seed ?? 3); orient(hole, pos, normal); st.add(hole);
  const nv = new THREE.Vector3(...normal).normalize(), out = new THREE.Vector3(...pos).addScaledVector(nv, 0.2).toArray();
  const smk = FX3.smoke(st, { pos: out, t0: -20, dur: 999, rate: 2.5 * size, size: 0.9 * size, grow: 2.2, rise: 1.1, color: o.dust || '#8e86a0', opacity: 0.45 });
  for (let i = 0, r = T.rng(o.seed ?? 3); i < 8 * size; i++) { const s = 0.12 + r() * 0.22 * size; const c = T.box(s, s * 0.6, s, RUBBLE[i % 4], pos[0] + (r() - 0.5) * 1.6 * size + nv.x * 0.6, s * 0.3, pos[2] + (r() - 0.5) * 1.6 * size + nv.z * 0.6); c.rotation.y = r() * 3; st.add(c); }
  return { update: smk.update, hole };
}

// an energy beam that travels from `from` to `to` over [t0, t0 + dur] and breaks every hit in its path when it gets there
export function beamSweep(T, st, o = {}) {
  const from = new THREE.Vector3(...(o.from || [0, 1.3, 5])), to = new THREE.Vector3(...(o.to || [0, 1.3, -5])), t0 = o.t0 ?? 0, dur = o.dur ?? 1;
  const len = o.len ?? 30, beam = T.cyl(o.width ?? 0.16, o.width ?? 0.16, len, T.glowMat ? T.glowMat(o.color || '#fff0c4', 3) : (o.color || '#fff0c4'), 0, 0, 0);
  beam.userData.dynamic = true; st.add(beam); const glow = T.glow ? T.glow(o.color || '#ffe8b0', 6, 0.7) : null; if (glow) st.add(glow);
  const dir = to.clone().sub(from).normalize(), origin = new THREE.Vector3(...(o.origin || [from.x, from.y + 8, from.z - 10]));
  const hits = (o.hits || []).map((h, i) => { const p = new THREE.Vector3(...h.pos); const k = Math.max(0, Math.min(1, p.clone().sub(from).dot(dir) / from.distanceTo(to)));
    return impact(T, st, { ...h, t0: t0 + k * dur, seed: 5 + i }); });
  const update = (t) => { const k = (t - t0) / dur, on = k >= 0 && k <= 1.08; beam.visible = on; if (glow) glow.visible = on;
    const tip = from.clone().lerp(to, Math.max(0, Math.min(1, k))); const mid = origin.clone().lerp(tip, 0.5), d = tip.clone().sub(origin);
    beam.position.copy(mid); beam.scale.y = d.length() / len; beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); if (glow) glow.position.copy(tip);
    hits.forEach(h => h.update(t)); };
  update(0); st.onTick?.(update);
  return { update, hits, shake: (cam, t) => hits.forEach(h => h.shake(cam, t)) };
}
