// demo.js — the Ink Pastel API in six shots (also the install self-test: node render.mjs --project examples/ink-demo --sheet --scale 0.5).
//   s001, s002, s005, s006: one auto() line each (place + blocking + framing + clock pills), the way most shots are made.
//   s003, s004: hand-written special shots with the rulebook helpers (R01 every hit leaves a mark, R02 damage stays).
import { V, registerShot } from '/engine/core.js';
import { auto, BLOCK, CAST, PILL } from '/engine/ink/auto.js';
import { ruins, facadeHit, DRAIN } from '/engine/ink/sets.js';
import { clockAt, headPill, hms } from '/engine/ink/hud.js';
import * as C from '../cast.js';

Object.assign(CAST, C);
Object.assign(PILL, { NEIGHBOUR: '41 YEARS', MOM: '17 YEARS 4 MONTHS' });

// blockings: who stands where (x, z on the floor), facing yaw (0 looks toward +z, the default camera side)
BLOCK.street = {
  HERO: { at: [0.2, 1.6], yaw: 0.3, expr: 'nervous' },
  NEIGHBOUR: { at: [-1.4, 0.4], yaw: 0.5, expr: 'worried' },
};
BLOCK.radio = {
  MOM: { at: [-6.7, -3.3], yaw: 0.9, pose: 'sit', expr: 'neutral' },
  HERO: { at: [-4.4, -1.4], yaw: -2.3, expr: 'nervous' },
};

auto('s001', { block: 'street', a: 'HERO', b: 'NEIGHBOUR' });
auto('s002', { block: 'street', a: 'NEIGHBOUR', only: ['NEIGHBOUR'], expr: { NEIGHBOUR: [[0, 'worried'], [1.2, 'scared']] } });
auto('s005', { block: 'radio', a: 'MOM', b: 'HERO', expr: { MOM: 'determined' } });
auto('s006', { place: 'BUNKER', block: 'radio', a: 'MOM', cam: 'closeup', card: true, pills: { MOM: null }, expr: { MOM: 'happy' } });

// s003: the beam sweeps across the street into the right-hand facades; each hit breaks the wall (R01)
const HITS = (set) => [facadeHit(set, 1, DRAIN[2] - 1, 2.2), facadeHit(set, 1, DRAIN[2] - 6, 3.6), { ...facadeHit(set, 1, DRAIN[2] - 11, 2.8), size: 1.4 }];
registerShot('s003', {
  init(T) {
    const st = T.stage({ mood: 'storm', fov: V(40, 56), look: 'inkRuin' }), set = ruins(T, st, {});
    const sw = T.CQ.beamSweep(T, st, { from: [DRAIN[0] - 6, 1.3, DRAIN[2] + 3], to: [11, 2.6, DRAIN[2] - 12], t0: 0.15, dur: 1.3, origin: [-2, 9, -24],
      hits: HITS(set).map(h => ({ size: 1.1, ...h })) });
    return { st, set, sw };
  },
  draw(s, t, info, T) {
    s.set.update(t + 5); s.sw.update(t);
    T.dolly(s.st.camera, t, [[0, { pos: [DRAIN[0] - 4.5, 0.3, DRAIN[2] + 3.5], look: [DRAIN[0] + 4, 1.6, DRAIN[2] - 5] }],
      [info.dur, { pos: [DRAIN[0] - 4.3, 0.3, DRAIN[2] + 3.2], look: [DRAIN[0] + 5, 1.8, DRAIN[2] - 6] }]]);
    s.sw.shake(s.st.camera, t);
  },
});

// s004: the road behind the neighbour explodes; the walls the beam hit stay broken (R02); his clock drops to seconds and turns red
registerShot('s004', {
  init(T) {
    const st = T.stage({ mood: 'storm', fov: V(40, 56), look: 'inkRuin' }), set = ruins(T, st, {});
    const old = st.add(T.character(C.NEIGHBOUR).place(-4.6, 0, -13, 0.15));
    const boom = T.CQ.impact(T, st, { pos: [-0.5, 0.0, 1.5], normal: [0, 1, 0], t0: 0.12, size: 1.6, linger: 3 });
    HITS(set).forEach(h => T.CQ.scar(T, st, { ...h, size: 1.1 }));
    return { st, set, old, boom };
  },
  draw(s, t, info, T) {
    s.set.update(t + 8); s.boom.update(t);
    s.old.position.set(-4.6, 0, -13 + t * 2.2); s.old.pose(T.walkPose3(t * Math.PI * 2 * 1.2)); s.old.face({ expr: 'scared', t });
    T.dolly(s.st.camera, t, [[0, { pos: [1.8, 0.8, 7.5], look: [-0.8, 1.2, -2] }], [info.dur, { pos: [1.9, 0.85, 7.9], look: [-0.8, 1.3, -2] }]]);
    s.boom.shake(s.st.camera, t);
    clockAt(T, s, s.old, s.st.camera, 'clk', 0.6);   // after the camera is placed
  },
  overlay(g, t, info, s) { headPill(g, s.clk, t < 0.5 ? '41 YEARS' : hms(47 - (t - 0.5)), { size: 30, red: t >= 0.5 }); },
});
