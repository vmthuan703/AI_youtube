// worlds-demo (0.2.7): game HUD over heads (userData.hud), corner counters (story/shots.json "counters"), first person (T.pov + T.povArms).
import { registerShot } from '/engine/core.js';
import { HERO, MAYA, SAM } from '../cast.js';
import { STUDENTS, RIVAL } from '/channel/cast.js';

registerShot('hud', {
  init(T) { const st = T.stage({ mood: 'interiorCool', fov: 40, fog: [8, 34] }); T.W.room(st, { kind: 'hallway', w: 5, d: 24, lockerColors: ['#2f6a72', '#b8403a'], window: false, ceiling: true });
    const hero = st.add(T.character(HERO).place(-0.7, 0, 3.2, 0.25)); hero.userData.hud = { name: 'YOU', level: 99, hp: 1 };
    const rival = st.add(T.character(RIVAL).place(1.0, 0, 1.6, -0.35)); rival.userData.hud = { name: 'BRICK', level: 17, hp: [[0, 0.9], [1.6, 0.9], [2.4, 0.22]], bars: [{ label: 'STR', value: 0.8, color: '#ff7a5a' }, { label: 'SPD', value: 0.35, color: '#6ac8ff' }], start: 0.3 };
    const kids = STUDENTS.slice(0, 4).map((o, i) => { const c = st.add(T.character(o).place(-1.4 + i * 0.95, 0, -2.5 - i * 2.3, 0.2 * (i % 2 ? 1 : -1))); c.userData.hud = { name: ['JUNE', 'MARCUS', 'TESS', 'LEO'][i], level: [4, 12, 8, 21][i], hp: 0.4 + 0.15 * i, start: 0.5 + i * 0.12 }; return c; });
    return { st, hero, rival, kids }; },
  draw(s, t, info, T) { s.hero.pose(T.idle3('handsInPockets', t)).face({ expr: 'smug', t, blink: true }); s.rival.pose(T.idle3('crossArms', t, { seed: 2 })).face({ expr: [[0, 'angry'], [2.0, 'shocked']], t, blink: true });
    s.kids.forEach((k, i) => k.pose(T.idle3('stand', t, { seed: 5 + i })).face({ expr: 'neutral', t, blink: true }));
    T.dolly(s.st.camera, t, [[0, { pos: [0.2, 1.55, 7.6], look: [0, 1.3, 0] }], [3, { pos: [0.1, 1.5, 7.0], look: [0, 1.3, 0] }]]); },
});
registerShot('pov', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 64, fog: [6, 30] }); T.W.room(st, { kind: 'living', w: 7, d: 7 });
    const hero = st.add(T.character(HERO).place(0, 0, 1.6, Math.PI)); const gift = T.group(T.rbox(0.36, 0.26, 0.3, 0.02, '#3ac0b0'), T.box(0.06, 0.27, 0.31, '#ff5a8a'), T.box(0.37, 0.27, 0.06, '#ff5a8a'));
    gift.position.set(0, 1.1, 1.6 - 0.55); st.add(gift); const maya = st.add(T.character(MAYA).place(0.3, 0, -1.2, 0.1)); return { st, hero, gift, maya }; },
  draw(s, t, info, T) { s.hero.pose(T.povArms({ spread: 0.42 })); s.maya.pose(T.idle3('cheer', t)).face({ expr: 'joy', t, blink: true });
    s.gift.position.y = 1.1 + 0.02 * Math.sin(t * 2); T.pov(s.st.camera, s.hero, t, { look: [0.1, 0.55, -1.0] }); },
});
