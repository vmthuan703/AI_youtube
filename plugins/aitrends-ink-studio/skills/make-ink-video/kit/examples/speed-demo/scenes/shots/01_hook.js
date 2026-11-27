// 01_hook.js — s001 cold open: the hero under a street lamp at night, low angle push-in, title.
import { E, V, registerShot, ease, prog, wordTime } from '/engine/core.js';
import * as UI from '/engine/ui2d.js';
import { HERO } from '../cast.js';
import { street } from '../sets/street.js';

registerShot('s001', {
  init(T) {
    const st = T.stage({ mood: 'night', fov: V(40, 58), fog: [12, 80], keyIntensity: 0.5 });
    street(T, st, { night: true, focus: [3, 4.6], lights: 4 });
    const hero = st.add(T.character(HERO).place(3.4, 0.15, 5.0, -0.35));
    const lamp = T.at(T.W.streetLamp({ light: true }), 3.9, 0.15, 4.4, Math.PI); st.add(lamp);
    const fill = T.lamp('#ffd2a0', 3, 7, { bulb: false }); fill.position.set(2.2, 2.2, 7.4); st.add(fill);   // shop-window spill on the face
    const dust = T.FX3.dust(st, { area: [1, 6, 0.3, 3.5, 3, 7], size: 0.035 });
    return { st, hero, dust };
  },
  draw(s, t, info, T) {
    s.hero.pose(T.breathe3('confident', t)).face({ expr: t < 1.6 ? 'neutral' : 'smirk', t, blink: true, look: [0.2, 0.1] });
    s.dust.update(t);
    T.dolly(s.st.camera, t, [[0, { pos: [1.4, 0.45, 9.6], look: [3.3, 1.7, 4.4] }], [info.dur, { pos: [2.0, 0.55, 8.2], look: [3.4, 1.65, 4.6] }]]);
  },
  overlay(g, t, info) { UI.titleCard(g, t - 0.15, { lines: ['WHAT IF YOU WERE', '10x FASTER?'], dur: info.dur - 0.1, y: V(E.H * 0.28, E.H * 0.25) }); },
});
