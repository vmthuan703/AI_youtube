// worlds-demo (0.2.7): every pictogram (D.icon / D.ICON_KINDS), D.versus + D.iconRow, the planet in space.
import { E, registerShot } from '/engine/core.js';
import * as D from '/engine/diagrams2d.js';
import * as UI from '/engine/ui2d.js';
import { HERO } from '../cast.js';

registerShot('icongrid', { kind: '2d', draw(g, t) { D.stage2d(g); const K = D.ICON_KINDS, cols = 12; K.forEach((k, i) => D.icon(g, { kind: k, x: 150 + (i % cols) * 147, y: 190 + Math.floor(i / cols) * 215, r: 40, label: k.toUpperCase(), labelSize: 24, t: 5, start: 0 })); } });
registerShot('versus', { kind: '2d', draw(g, t) { D.stage2d(g); D.versus(g, { y: 520, left: { title: 'NORMAL PERSON', icon: 'clock', value: '5 MIN' }, right: { title: 'YOU', figure: { color: HERO.color, hairColor: HERO.hairColor, hair: 'anime', expr: 'deadpan' }, value: '0.2 SEC' }, winner: 'right', t, start: 0.1 });
  D.iconRow(g, { items: [{ kind: 'drop', label: '3 DAYS' }, { kind: 'fish', label: '3 WEEKS', cross: 1.4 }, { kind: 'bone', label: 'NORMAL', check: 1.6 }], y: 930, r: 44, t, start: 0.8 }); UI.pill(g, { str: '3 WEEKS', icon: 'calendar', x: 330, y: 150, t, start: 0.2 }); } });
registerShot('planet', {
  init(T) { const st = T.stage({ mood: 'void', fov: 34, fog: false, bloom: 0.8 }); T.W.space(st); const p = T.W.planet(st, { r: 3, pos: [0, 0, 0] }); return { st, p }; },
  draw(s, t, info, T) { T.dolly(s.st.camera, t, [[0, { pos: [0, 0.6, 15], look: [0, 0, 0] }], [3, { pos: [0, 0.5, 13.8], look: [0, 0, 0] }]]); },
  overlay(g, t) { UI.heading(g, { str: 'EVERY HUMAN', y: 930, t, start: 0.4 }); },
});
