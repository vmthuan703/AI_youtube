// v103-thumb (1.0.3): the four thumbnail layouts of the channel rules (prompts/thumbnail_style.md) for a sample video, "What If You
// Had 1000 IQ?", built with the new hero look and T.thumb overlays. Render: node render.mjs --project examples/v103-thumb --thumbs
//   tA labels over heads · tB split before / after with stat bars · tC crowd staring at the smug hero · tD full game UI panel
import { registerShot } from '/engine/core.js';
import { HERO, BESTIE, CLASSMATE, CLASSMATE_2, BRO_2, STUDENTS } from '../cast.js';
const PI = Math.PI, R2 = PI / 2;
const BRIGHT = { mood: 'day', fov: 32, fog: [30, 120], keyIntensity: 2.2, ambient: 1.9, exposure: 1.4 };
const man = (s, pos, look, fov = 32) => { const c = s.st.camera; c.position.set(...pos); c.lookAt(...look); if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); } };
const smug = (T, ch, t, pose = 'confident', extra = {}) => ch.pose({ ...T.idle3(pose, t), ...extra }).face({ expr: 'smug', t: 0, blink: false, look: [0.25, 0] });

// A: labels over heads — the smug hero says nothing, the labels tell the story
registerShot('tA', {
  init(T) { const st = T.stage({ ...BRIGHT }); const cl = T.W.classroom(st, {}); const z0 = -cl.d / 2 + 1.0;   // the open strip in front of the board
    const hero = st.add(T.character(HERO).place(-0.6, 0, z0 + 1.3, 0.25)), a = st.add(T.character(BESTIE).place(0.65, 0, z0 + 0.5, -0.45)), b = st.add(T.character(CLASSMATE_2).place(1.6, 0, z0 + 0.1, -0.6)), c = st.add(T.character(BRO_2).place(-1.8, 0, z0 + 0.2, 0.45));
    return { st, T, hero, a, b, c, z0 }; },
  draw(s, t, info, T) { smug(T, s.hero, t, 'thumbsUp'); s.a.pose(T.idle3('scared', t)).face({ expr: 'shocked', t: 0, look: [-0.5, 0] }); s.b.pose(T.idle3('handsOnHips', t)).face({ expr: 'surprised', t: 0, look: [-0.6, 0] });
    s.c.pose(T.idle3('crossArmsAngry', t)).face({ expr: 'worried', t: 0, look: [0.5, 0] }); man(s, [-0.2, 1.4, s.z0 + 4.6], [0, 1.1, s.z0 + 0.6], 36); },
  overlay(g, t, info, S) { const th = S.T.thumb, cam = S.st.camera; th.tagOn(g, S.hero, cam, '1000 IQ', { bg: th.TH.lime, fg: '#14102a', size: 54 });
    th.tagOn(g, S.a, cam, '70 IQ', { bg: th.TH.red }); th.tagOn(g, S.b, cam, '85 IQ', { bg: th.TH.red }); th.tagOn(g, S.c, cam, 'TEACHER?', { bg: th.TH.dark }); },
});
// B: split — the same hero before and after, each side with one stat bar
registerShot('tB', {
  init(T) { const st = T.stage({ ...BRIGHT }); const cl = T.W.classroom(st, {}); const z0 = -cl.d / 2 + 1.0;
    const before = st.add(T.character(HERO).place(-1.05, 0, z0 + 0.9, 0.3)), after = st.add(T.character(HERO).place(1.05, 0, z0 + 0.9, -0.3)); return { st, T, before, after, z0 }; },
  draw(s, t, info, T) { s.before.pose(T.idle3('hunch', t)).face({ expr: 'confused', t: 0, look: [0, 0] }); smug(T, s.after, t, 'peaceSign'); man(s, [0, 1.35, s.z0 + 4.3], [0, 1.0, s.z0 + 0.9], 36); },
  overlay(g, t, info, S) { const th = S.T.thumb; g.save(); g.fillStyle = 'rgba(20,16,42,.35)'; g.fillRect(0, 0, 960, 1080); g.restore();
    g.save(); g.strokeStyle = th.TH.line; g.lineWidth = 18; g.beginPath(); g.moveTo(1010, 0); g.lineTo(910, 1080); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.stroke(); g.restore();
    th.bar(g, 170, 900, 600, 0.12, { label: 'IQ', value: '100', color: th.TH.red }); th.bar(g, 1150, 900, 600, 1, { label: 'IQ', value: '1000', color: th.TH.green }); },
});
// C: crowd — the whole cafeteria turns to stare at the smug hero
registerShot('tC', {
  init(T) { const st = T.stage({ ...BRIGHT, fov: 36 }); T.W.cafeteria(st, {}); const hero = st.add(T.character(HERO).place(0, 0, 1.2, 0));
    const spots = [[-1.6, 0.2], [-1.0, -0.6], [-0.3, -1.1], [0.5, -1.0], [1.2, -0.5], [1.8, 0.3], [-2.2, -0.8], [2.3, -0.7]];
    const kids = spots.map(([x, z], i) => st.add(T.character(STUDENTS[i % STUDENTS.length]).place(x, 0, z, Math.atan2(0 - x, 1.2 - z)))); return { st, T, hero, kids }; },
  draw(s, t, info, T) { smug(T, s.hero, t, 'handsOnHips'); s.kids.forEach((k, i) => k.pose(T.idle3(['surprised', 'scared', 'stand', 'shocked'][i % 4] in T.POSES3 ? ['surprised', 'scared', 'stand', 'shocked'][i % 4] : 'stand', t, { seed: i })).face({ expr: ['awe', 'shocked', 'surprised', 'awe'][i % 4], t: 0 }));
    man(s, [0, 1.25, 4.6], [0, 1.05, 0.3], 36); },
  overlay(g, t, info, S) { S.T.thumb.big(g, 'oh yeah.', 1500, 230, { size: 110, color: S.T.thumb.TH.yellow }); },
});
// D: full game UI — a LEVEL-style panel and a bar, the hero smug in front
registerShot('tD', {
  init(T) { const st = T.stage({ ...BRIGHT }); T.W.library(st, {}); const hero = st.add(T.character(HERO).place(-0.6, 0, 1.4, 0.3)); return { st, T, hero }; },
  draw(s, t, info, T) { smug(T, s.hero, t, 'showCount', { handR: 'pointUp' }); man(s, [0.15, 1.3, 4.6], [0.25, 1.05, 1.0], 34); },
  overlay(g, t, info, S) { const th = S.T.thumb; th.panel(g, 1180, 170, { title: 'IQ', value: '1000', sub: 'MAX LEVEL', w: 380, h: 250 }); th.bar(g, 1180, 620, 570, 1, { label: 'BRAIN', value: '100%', color: th.TH.lime }); },
});
