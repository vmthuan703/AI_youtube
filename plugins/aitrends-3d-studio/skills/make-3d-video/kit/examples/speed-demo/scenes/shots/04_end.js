// 04_end.js — s010 Jake: "Dude... how did you get over there?", s011 the catch, s012 stopping is the hard part.
import { E, V, registerShot, ease, prog, key, clamp, lerp, talkFor } from '/engine/core.js';
import * as UI from '/engine/ui2d.js';
import { HERO, JAKE } from '../cast.js';
import { street } from '../sets/street.js';

const morning = (T, o = {}) => T.stage({ mood: 'golden', fov: V(32, 48), fog: [18, 110], keyPos: [-12, 14, 20], keyIntensity: 1.7, ambient: 1.5, ...o });

registerShot('s010', {
  init(T) {
    const st = morning(T, { dof: { focus: 2.4, aperture: 0.006, maxblur: 0.01 } }); street(T, st, { focus: [2, -5] });
    const jake = st.add(T.character(JAKE).place(2.0, 0.15, -5.4, 0.3));
    const bok = T.FX3.bokeh(st, { area: [-6, 10, 1, 5, -12, -9] });
    return { st, jake, bok };
  },
  draw(s, t, info, T) {
    s.bok.update(t);
    s.jake.pose(T.breathe3(T.posesAt3(t, [[0, 'shocked'], [0.9, { ...T.POSES3.point, armL: [80, -25, 8, 0] }]]), t, 1, 2));
    s.jake.face({ expr: t < 0.9 ? 'shocked' : 'surprised', talk: talkFor('JAKE', info.globalT), t, blink: true, look: [0.5, 0.1] });
    T.dolly(s.st.camera, t, [[0, { pos: [1.4, 1.45, -2.9], look: [2.0, 1.45, -5.4] }], [info.dur, { pos: [1.55, 1.48, -3.25], look: [2.0, 1.47, -5.4] }]]);
    s.st.focusOn(s.jake.headWorld());
  },
});
registerShot('s011', {
  init(T) {
    const st = morning(T, { dof: { focus: 2.2, aperture: 0.006, maxblur: 0.01 } }); street(T, st, { focus: [0, 5] });
    const hero = st.add(T.character(HERO).place(0.6, 0.15, 5.0, 0.15));
    const can = T.W.bottle({ color: '#e0402e', label: 'FIZZ', labelColor: '#e0402e' }); hero.hold(can, 'L', { pos: [0, -0.1, 0.03] });
    const bok = T.FX3.bokeh(st, { area: [-8, 8, 1, 5, -10, -6], colors: ['#ffd28a', '#ff9a6a', '#ffe0b0'] });
    return { st, hero, bok };
  },
  draw(s, t, info, T) {
    s.bok.update(t);
    const pose = T.posesAt3(t, [[0, { ...T.POSES3.relaxed, armL: [70, 10, 100, 0], handL: 'fist' }], [1.3, { ...T.POSES3.relaxed, armL: [45, 10, 80, 0], handL: 'fist', head: [4, 0, 6] }]]);
    s.hero.pose(T.breathe3(pose, t)).face({ expr: t < 1.25 ? 'smug' : 'worried', t, blink: true, look: t < 1.25 ? [0.2, 0] : [0, -0.1] });
    T.dolly(s.st.camera, t, [[0, { pos: [1.2, 1.5, 7.6], look: [0.6, 1.5, 5.0] }], [info.dur, { pos: [1.0, 1.52, 6.8], look: [0.6, 1.55, 5.0] }]]);
    s.st.focusOn(s.hero.headWorld());
  },
});
registerShot('s012', {
  init(T) {
    const st = morning(T, { fov: V(42, 58) }); street(T, st, { focus: [4, 5] });
    const hero = st.add(T.character(HERO).place(-10, 0.15, 5.2, Math.PI / 2));
    const echo = T.FX3.ghosts(st, HERO, 5, { c: '#7fb8ff', opacity: 0.35, gap: 0.035 });
    const lines = T.FX3.speedLines(st, { axis: 'x', dir: -1, around: [0, 1.1, 5.2], radius: [0.8, 3], speed: 80, opacity: 0.4 });
    const skid = T.FX3.burst(st, { pos: [3.2, 0.2, 5.2], colors: ['#d8c8b0', '#bfb0a0'], speed: [1, 3], gravity: 4, t0: 1.25, dur: 1.4, n: 70, size: 0.05 });
    const crash = T.FX3.burst(st, { pos: [5.9, 0.8, 5.5], colors: ['#d8c8b0', '#ffffff', '#ffd23a'], speed: [2, 5], gravity: 6, t0: 2.0, dur: 1.2, n: 60, size: 0.05 });
    return { st, hero, echo, lines, skid, crash };
  },
  draw(s, t, info, T) {
    // sprint (x = -10 → 3 by 1.25 s), skid with the body leaning back (3 → 5.5), crash into the bins at 2.0 s
    const at = (tt) => {
      if (tt < 1.25) return { pos: [-10 + 10.4 * tt, 0.15, 5.2], yaw: Math.PI / 2, pose: T.walkPose3(tt * Math.PI * 2 * 1.9, { sprint: true }) };
      if (tt < 2.0) { const k = ease.out(prog(tt, 1.25, 2.0)); return { pos: [3 + 2.6 * k, 0.15, 5.2], yaw: Math.PI / 2, pose: { ...T.POSES3.ready, spine: [-28, 0, 0], head: [-10, 0, 0], armL: [95, 60, 20, 0], armR: [95, 60, 20, 0], legL: [45, 8, 10, 0], legR: [-10, 8, 30, 0], handL: 'open', handR: 'open' } }; }
      const k = ease.out(prog(tt, 2.0, 2.5)); return { pos: [5.6 + 0.3 * k, 0.15, 5.2 + 0.3 * k], yaw: Math.PI / 2 + 0.6 * k, pose: T.blendPose3('fall', { ...T.POSES3.lie, armL: [90, 70, 30, 0], armR: [120, 60, 30, 0] }, k) };
    };
    const now = at(t); s.hero.position.set(...now.pos); s.hero.rotation.y = now.yaw; s.hero.pose(now.pose);
    s.hero.face({ expr: t < 1.2 ? 'determined' : t < 2.0 ? 'scared' : 'dead', t });
    s.echo.update(t, (tt) => (tt < 0 || t > 2.0 ? null : at(tt))); s.lines.update(t); s.lines.obj.visible = t < 1.3;
    s.skid.update(t); s.crash.update(t);
    const hx = Math.min(now.pos[0], 5.0);
    T.dolly(s.st.camera, t, [[0, { pos: [-7.5, 1.0, 10.5], look: [-6, 1.0, 5.2] }], [1.25, { pos: [1.5, 1.0, 10.0], look: [3.0, 1.0, 5.2] }], [info.dur, { pos: [4.2, 1.2, 9.4], look: [5.6, 0.7, 5.3] }]], ease.out);
    T.shake(s.st.camera, t, t < 1.25 ? 0.02 : t > 2.0 && t < 2.5 ? 0.05 : 0.008, 2.2);
  },
  mblur: 2,
  overlay(g, t) { UI.badge(g, { str: '10x', a: clamp(1 - (t - 1.2) / 0.3) }); },
});
