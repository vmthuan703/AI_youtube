// shots/03_title3d.js — s017: 3D night street of houses, one bedroom window glowing phone-blue; title card overlay.
import { E, V, registerShot, mood, ease, veil } from '/engine/core.js';
import * as UI from '/engine/ui2d.js';

registerShot('s017', {
  kind: '3d',
  init(T) {
    const M = mood('night');
    const st = T.stage({ mood: 'night', fov: V(38, 55), fog: [16, 60], keyPos: [6, 12, 8], keyIntensity: 1.6, ambient: 0.9 });
    st.add(T.ground(120, 120, M.road));
    const houses = [[-14, 5, 7], [-6.5, 6, 8], [1, 7.5, 9], [9, 5.5, 7], [16.5, 6.5, 8], [-22, 6, 8], [24, 5, 7]];
    houses.forEach(([x, h, w], i) => { const b = T.building(w, h, 6, { color: M.wall, win: M.practical, lit: 0.18, seed: 3 + i }); b.position.x = x; b.position.z = -6; st.add(b); });
    // Maya's window: phone-blue glow on the house in the middle
    const win = T.windowPane(1.6, 1.4, { glowColor: '#8fd3ff', cols: 2, rows: 1, power: 1.25 }); win.position.set(1, 4.6, -2.95); st.add(win);
    for (const x of [-10, -2.5, 5, 12.5]) st.add(T.cyl(0.07, 0.09, 4.2, '#15121c', x, 2.1, 2));
    st.add(T.tree3D(-18, 3, 1.3, '#1a1626'), T.tree3D(20, 3, 1.2, '#1a1626'), T.tree3D(-4, 4, 1.0, '#1a1626'));
    return { stage: st };
  },
  draw(s, t, info, T) {
    T.orbit(s.stage.camera, t, { target: [1, 3.6, -3], radius: V(27, 32), height: [3.0, 3.6], from: -0.35, to: 0.12, dur: info.dur });
  },
  overlay(g, t, info) {
    veil(g, '#05040b', 0.38);
    UI.titleCard(g, t, { lines: ['WHAT IF YOUR PHONE SHOWED', "TOMORROW'S NOTIFICATIONS?"], sub: 'TODAY', dur: info.dur, y: E.H * V(0.42, 0.4) });
  },
});
