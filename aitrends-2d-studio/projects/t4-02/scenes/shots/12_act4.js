// shots/12_act4.js — s117–s159: downtown, 6:12, favorites, FAST, the choice, the ambulance, hospital, real?, end.
import { E, V, S, registerShot, mood, ease, prog, clamp, lerp, shake, veil, rr, seg, circle, ring, poly, glow, alpha, text, FONTS } from '/engine/core.js';
import { POSES } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { face, card, wide, lock, board, lt, digitalClock, PHONE_BLUE, TAG, notifCard } from './_tpl.js';
import { phoneScreen, header, rows, callScreen, star, chat, CREAM } from './_screens.js';
import { mayaInBed } from './01_night.js';
import { CAST } from '../cast.js';

const R = (id, fn) => registerShot(id, { draw: fn });
const GOLD = () => S().ui.gold, BP = () => UI.bpStroke();
const counter = (g, t, info, str, at = 0.2) => { const a = ease.outBack(prog(t, at, at + 0.35)); if (a <= 0) return; g.save(); g.translate(E.W - V(300, 200), V(170, 230)); g.scale(a, a);
  text(g, str, 0, 0, { size: V(58, 54), font: FONTS.ui, weight: 900, color: TAG, glow: 18, glowColor: alpha(TAG, 0.7) }); text(g, 'NEURONS LOST', 0, V(50, 50), { size: V(22, 24), font: FONTS.ui, weight: 900, color: alpha(CREAM, 0.75), spacing: 4 }); g.restore(); };
const caseBox = (g, x, y, s, open) => { g.save(); g.translate(x, y); g.scale(s, s); rr(g, -150, -10, 300, 120, 12); g.fillStyle = '#5a6070'; g.fill(); g.save(); g.scale(1, Math.cos(open * 1.25)); rr(g, -150, -110, 300, 100, 12); g.fillStyle = '#6a7080'; g.fill(); g.restore(); rr(g, -50, 20, 100, 30, 8); g.fillStyle = '#20222c'; g.fill(); g.restore(); };
const tablePhone = (g, x, y, s, lit, c = PHONE_BLUE) => { g.save(); g.translate(x, y); g.scale(s, s * 0.4); rr(g, -50, -100, 100, 200, 14); g.fillStyle = '#07060b'; g.fill(); if (lit) { rr(g, -42, -92, 84, 184, 10); g.fillStyle = alpha(c, 0.9 * lit); g.fill(); } g.restore(); if (lit) glow(g, x, y, 140 * s, c, 0.4 * lit); };

// ---- downtown (3D) ----
registerShot('s117', { kind: '3d',
  init(T) { const M = mood('dusk'); const st = T.stage({ mood: 'dusk', fov: V(40, 56), fog: [30, 120], keyPos: [-20, 30, 10], keyIntensity: 2.0, ambient: 1.0 }); st.add(T.ground(200, 200, M.road));
    const B = [[-30, 40, 12], [-15, 55, 14], [0, 70, 16], [16, 48, 12], [30, 62, 14], [-45, 30, 10], [45, 36, 10], [-8, 26, 8], [10, 30, 8]];
    B.forEach(([x, h, w], k) => { const b = T.building(w, h, w, { color: M.wall, win: M.practical, lit: 0.3, seed: 40 + k }); b.position.x = x; b.position.z = -20 - (k % 3) * 12; st.add(b); });
    return { stage: st }; },
  draw(s, t, info, T) { T.dolly(s.stage.camera, t, [[0, { pos: [0, 8, 85], look: [0, 22, -20], fov: V(40, 56) }], [info.dur, { pos: [6, 26, 62], look: [0, 32, -20], fov: V(38, 54) }]]); },
  overlay(g, t, info) { veil(g, '#05040b', 0.2); const a = ease.out(prog(t, lt(info, 'Hindsight', 2.6), lt(info, 'Hindsight', 2.6) + 0.4)); text(g, 'HINDSIGHT LABS · FLOOR 22', E.W / 2, E.H * 0.24, { size: V(48, 44), font: FONTS.ui, weight: 900, color: CREAM, alpha: a, spacing: 6, glow: 14, glowColor: 'rgba(160,190,255,.5)' });
    UI.readout(g, { label: 'DOWNTOWN ·', value: '6:00 PM · 40 MIN FROM HOME', x: V(120, 80), y: E.H - V(190, 600), a: ease.out(prog(t, 0.3, 0.7)) }); } });

// ---- the meeting ----
const meeting = (o = {}) => (g, t, i) => wide(g, t, i, { set: 'office', cam: { z: o.z ?? 1.4, dz: 0.04, y: V(120, 100), x: o.x ?? 0 }, figs: [
  { who: 'MAYA', x: 0.34, pose: o.mayaPose || 'sit', y: -10, expr: o.mayaExpr || 'neutral', shadow: false, rimDir: [1, -0.5], talk: o.mayaTalk },
  { who: 'PRIYA', x: 0.66, facing: -1, pose: o.priyaPose || 'explain', expr: o.priyaExpr || 'smirk', talk: o.priyaTalk, rimDir: [1, -0.5] }],
  after: (g, t, Rr) => { FX.chair(g, E.W * 0.34 - 10, Rr.GY, 1.3, '#20222c'); o.after?.(g, t, Rr); }, readout: o.readout, line: o.line, lineY: o.lineY });
R('s118', meeting({ priyaTalk: [412.42, 416.79], priyaPose: 'talk', after: (g, t, Rr) => tablePhone(g, E.W * 0.42, Rr.GY - 126, 0.9, 0) }));
R('s119', (g, t, i) => board(g, t, i, { draw: (g, t) => {
  veil(g, '#000', 0.3); const cx = E.W / 2, cy = E.H * 0.55; rr(g, cx - V(360, 300), cy - V(300, 280), V(720, 600), V(600, 560), 8); g.fillStyle = '#efeae0'; g.fill();
  for (let k = 0; k < 8; k++) { g.fillStyle = 'rgba(40,40,60,.3)'; g.fillRect(cx - V(300, 250), cy - V(240, 220) + k * 44, V(600, 500), 5); }
  const flip = (t * 1.6) % 1; g.save(); g.translate(cx + V(360, 300), cy); g.scale(1 - 2 * flip, 1); rr(g, -V(720, 600) * 0.5 * 0, -V(300, 280), V(10, 10), V(600, 560), 2); g.restore();
  const sx = lt(i, 'Sign', 1.6), ix = lt(i, 'Initial', 2.6); const p1 = ease.inOut(prog(t, sx, sx + 0.8)), p2 = ease.inOut(prog(t, ix, ix + 0.6));
  g.strokeStyle = '#2a3a8a'; g.lineWidth = 4; g.beginPath(); for (let k = 0; k <= 40 * p1; k++) { const u = k / 40; g.lineTo(cx - 200 + u * 300, cy + 170 + Math.sin(u * 18) * 14); } g.stroke();
  if (p2 > 0) text(g, 'M.R.', cx + 220, cy + 170, { size: 40, font: FONTS.serif, weight: 900, italic: true, color: '#2a3a8a', alpha: p2 });
  text(g, 'SIGN HERE', cx - 200, cy + 120, { size: 20, font: FONTS.ui, weight: 900, color: '#c0392b', align: 'left' });
} }));
R('s120', (g, t, i) => board(g, t, i, { draw: (g, t) => { veil(g, '#000', 0.2); const marks = [[0, 9], [lt(i, '6:10', 1.4), 10], [lt(i, '6:11', 2.6), 11]]; const m = marks.filter(([at]) => t >= at).pop()[1];
  FX.clock(g, E.W / 2, E.H * 0.5, V(220, 200), 18 * 3600 + m * 60, { face: '#e9e2ea' }); text(g, `6:${String(m).padStart(2, '0')} PM`, E.W / 2, E.H * 0.86, { size: V(60, 56), font: FONTS.ui, weight: 900, color: GOLD(), glow: 16, glowColor: alpha(GOLD(), 0.6) }); } }));
R('s121', meeting({ z: 1.9, x: V(160, 100), mayaExpr: [[0, 'neutral'], [2.0, 'surprised']], after: (g, t, Rr) => { tablePhone(g, E.W * 0.42, Rr.GY - 126, 1.2, ease.out(prog(t, 0.4, 0.8)), '#3fb950'); if (t > 2.2) text(g, 'MOM', E.W * 0.42, Rr.GY - 190, { size: 34, font: FONTS.ui, weight: 900, color: '#7fe08a', glow: 12, glowColor: 'rgba(63,185,80,.6)' }); },
  readout: { label: 'NO SOUND ·', value: '6:12 PM', at: 0.2 } }));
R('s122', (g, t, i) => { phoneScreen(g, t, i, (g, x, y, w, h, k) => callScreen(g, t, x, y, w, h, k, { name: 'Mom', sub: 'incoming call', silent: true }), { bg: 'office', bgOpts: {}, cx: 0.4, glowC: '#3fb950' });
  const n = t < lt(i, 'two.', 1.6) ? 1 : t < lt(i, 'three.', 2.8) ? 2 : 3; const a = ease.outBack(prog(t % 1.2, 0, 0.3));
  text(g, `CALL ${n}`, E.W * 0.74, E.H * 0.42, { size: V(120, 100), font: FONTS.ui, weight: 900, color: TAG, glow: 24, glowColor: alpha(TAG, 0.7) }); text(g, 'SILENCED', E.W * 0.74, E.H * 0.42 + V(100, 90), { size: V(34, 34), font: FONTS.ui, weight: 900, color: alpha(CREAM, 0.7), spacing: 6 }); });
R('s123', (g, t, i) => face(g, t, i, { who: 'MAYA', bg: 'office', expr: [[0, 'confused'], [1.6, 'surprised'], [3.0, 'awe']], mood: 'dusk', glow: 'phone', look: [0, -0.2] }));
R('s124', (g, t, i) => face(g, t, i, { who: 'MOM', bg: 'kitchen', bgOpts: {}, expr: 'smile', talk: [439.45, 442.16], glow: 'memory', side: -1, dx: 60, tint: 'memory' }));
R('s125', (g, t, i) => phoneScreen(g, t, i, (g, x, y, w, h, k) => {
  const tc = lt(i, 'Contacts.', 3.3), tm = lt(i, 'Mom.', 4.4), tf = lt(i, 'Favorites.', 5.4);
  if (t < tc) { callScreen(g, t, x, y, w, h, k, { name: 'Mom', sub: 'incoming call', silent: true }); return; }
  header(g, x, y, w, k, t < tm ? 'Contacts' : 'Mom', t < tm ? '' : 'mobile');
  if (t < tm) rows(g, t, x, y, w, k, [{ label: 'Ava' }, { label: 'Jordan' }, { label: 'Mom', hi: t > tm - 0.5 }, { label: 'Mr. Okafor' }, { label: 'Sam' }]);
  else rows(g, t, x, y, w, k, [{ label: 'Message' }, { label: 'Call' }, { label: 'Add to Favorites', hi: true, star: clamp((t - tf) * 2.5) }]);
  const thumb = t < tm ? [x + w * 0.5, y + (190 + 2 * 92 + 40) * k] : [x + w * 0.5, y + (190 + 2 * 92 + 40) * k]; circle(g, thumb[0] + 60 * k, thumb[1] + 60 * k, 60 * k, alpha('#0c0a12', 0.85));
}, { bg: 'office', bgOpts: {}, cx: 0.5, rot: 0.05 }));
R('s126', (g, t, i) => { phoneScreen(g, t, i, (g, x, y, w, h, k) => callScreen(g, t, x, y, w, h, k, { name: 'Mom ★', sub: 'calling… (5)' }), { bg: 'office', bgOpts: {}, cx: 0.5, shake: 9, glowC: '#3fb950' });
  FX.rings(g, E.W / 2, E.H * 0.5, t, { count: 4, r0: 300, r1: 900, speed: 1.6, color: '#c8ffd0', a: 0.5 }); UI.badge(g, { str: 'RINGING', a: 1, color: '#7fe08a' }); });
R('s127', (g, t, i) => face(g, t, i, { who: 'MAYA', bg: 'office', expr: [[0, 'surprised'], [1.4, 'scared']], mood: 'dusk', glow: 'phone', look: [-0.5, 0], line: 'SLOW. THICK.', lineY: E.H * 0.2 }));
R('s128', (g, t, i) => wide(g, t, i, { set: 'kitchen', opts: { mood: 'dusk', clockH: 18, clockM: 12, radio: false }, cam: { z: 1.6, x: -V(60, 40), y: V(170, 140) }, figs: [{ who: 'MOM', x: 0.46, y: 0, pose: 'kneel', prop: 'phone', expr: 'worried', talk: [457.43, 459.65], s: 1.35 }] }));

// ---- FAST ----
const fastIcons = (g, t, i, items) => { items.forEach(([lab, sub, at], k) => { const a = ease.outBack(prog(t, at, at + 0.35)); if (a <= 0) return; const x = E.W / 2 + (k - 1.5) * V(380, 260), y = E.H * 0.5;
  g.save(); g.translate(x, y); g.scale(a, a); ring(g, 0, 0, V(110, 90), 5, k === 3 ? TAG : BP()); text(g, lab, 0, 8, { size: V(110, 90), font: FONTS.title, weight: 700, color: k === 3 ? TAG : GOLD() });
  text(g, sub, 0, V(170, 150), { size: V(28, 26), font: FONTS.ui, weight: 900, color: CREAM, spacing: 2 }); g.restore(); }); };
R('s129', (g, t, i) => board(g, t, i, { draw: (g, t) => { const tf = lt(i, 'FAST.', 1.8); if (t < tf) UI.bigLine(g, t, { str: 'DOCTORS HAVE A WORD FOR THIS', dur: tf + 0.2, y: E.H * 0.5, size: V(60, 50) }); if (t > tf) UI.bigLine(g, t - tf, { str: 'F · A · S · T', dur: 99, y: E.H * 0.18, size: V(70, 60) }); fastIcons(g, t, i, [['F', 'FACE DROOPING', lt(i, 'Face', 2.8)]]); } }));
R('s130', (g, t, i) => board(g, t, i, { draw: (g, t) => fastIcons(g, t, i, [['F', 'FACE DROOPING', -1], ['A', 'ARM WEAKNESS', lt(i, 'Arm', 0.1)], ['S', 'SPEECH DIFFICULTY', lt(i, 'Speech', 1.4)], ['T', 'TIME TO CALL 911', lt(i, 'Time', 2.9)]]) }));
R('s131', (g, t, i) => board(g, t, i, { draw: (g, t) => {
  const cx = E.W / 2, cy = E.H * 0.46; g.strokeStyle = BP(); g.lineWidth = 5; g.beginPath(); g.ellipse(cx, cy, V(260, 220), V(190, 160), 0, 0, Math.PI * 2); g.stroke(); seg(g, [[cx, cy - V(190, 160)], [cx, cy + V(190, 160)]], 3, alpha(BP(), 0.6));
  for (let k = 0; k < 60; k++) { const a = k * 2.4, r = (k * 37) % 180, px = cx + Math.cos(a) * r * 1.3, py = cy + Math.sin(a) * r * 0.9, fade = clamp((t - lt(i, 'lose', 2.5) - k * 0.03) * 2); circle(g, px, py, 5, alpha(fade > 0.5 ? TAG : GOLD(), 1 - fade * 0.8)); }
  const a = ease.out(prog(t, lt(i, 'one', 3.0), lt(i, 'one', 3.0) + 0.4)); text(g, '1.9 MILLION NEURONS / MINUTE', cx, E.H * 0.84, { size: V(54, 42), font: FONTS.ui, weight: 900, color: TAG, alpha: a, glow: 18, glowColor: alpha(TAG, 0.6) });
  UI.bigLine(g, t, { str: 'DURING A STROKE', dur: i.dur + 1, y: E.H * 0.14, size: V(48, 44) }); } }));
R('s132', (g, t, i) => { wide(g, t, i, { set: 'office', cam: { z: 1.7, y: V(170, 130) }, figs: [{ who: 'MAYA', x: 0.45, pose: 'phone', prop: 'phone', expr: 'determined', talk: [475.8, 477.2] }], readout: { label: 'CALLING', value: '911 · 6:13 PM', at: 0.3 } }); counter(g, t, i, '1.9 M', lt(i, 'One', 2.9)); });
R('s133', (g, t, i) => { wide(g, t, i, { set: 'street', cam: { z: 1.15, dz: 0.05, y: V(30, 40) }, figs: [{ who: 'ALVAREZ', x: 0.2, walk: 1.6, expr: 'determined' }], after: (g, t, Rr) => { const x = E.W * 0.2 + 1.6 * t * 160 + 40; seg(g, [[x, Rr.GY - 150], [x + 16, Rr.GY - 150]], 5, GOLD()); } , readout: { label: '6:14 PM ·', value: 'SHE HAS A KEY', word: 'key' } });
  counter(g, t, i, lt(i, 'Three', 4.8) < t ? '3.8 M' : '1.9 M', 0.2); });
R('s134', (g, t, i) => face(g, t, i, { who: 'ALVAREZ', bg: 'street', expr: 'determined', talk: [485.54, 488.27], mood: 'night', side: -1 }));

// ---- the choice ----
R('s135', meeting({ priyaPose: 'holdFront', priyaTalk: [490.34, 496.19], mayaPose: 'sit', mayaExpr: 'scared', after: (g, t, Rr) => { caseBox(g, E.W * 0.55, Rr.GY - 150, 0.6, ease.inOut(prog(t, 0.6, 1.6))); tablePhone(g, E.W * 0.42, Rr.GY - 126, 0.9, 0.6, '#3fb950'); }, readout: { label: 'THE CASE ·', value: '6:15 PM', at: 0.2 } }));
R('s136', (g, t, i) => face(g, t, i, { who: 'PRIYA', bg: 'office', expr: [[0, 'neutral'], [1.6, 'angry']], talk: [490.34, 496.19], mood: 'dusk', side: -1, dx: 80 }));
R('s137', (g, t, i) => { board(g, t, i, { draw: (g, t) => { veil(g, '#0a0e1a', 0.4); const z = 1 + 0.03 * t; g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.rotate(0.01 * t); g.translate(-E.W / 2, -E.H / 2);
  caseBox(g, E.W * 0.28, E.H * 0.55, 1.2, 1); glow(g, E.W * 0.28, E.H * 0.5, 300, GOLD(), 0.2); text(g, '$2,000,000', E.W * 0.28, E.H * 0.3, { size: V(54, 50), font: FONTS.ui, weight: 900, color: GOLD() });
  rr(g, E.W * 0.72 - 60, E.H * 0.55 - 120, 120, 240, 20); g.fillStyle = '#07060b'; g.fill(); rr(g, E.W * 0.72 - 50, E.H * 0.55 - 110, 100, 220, 14); g.fillStyle = '#1a3a2a'; g.fill(); glow(g, E.W * 0.72, E.H * 0.55, 300, '#3fb950', 0.3);
  text(g, 'MOM', E.W * 0.72, E.H * 0.3, { size: V(54, 50), font: FONTS.ui, weight: 900, color: '#7fe08a' }); g.restore();
  FX.drops(g, t, { count: 40, color: '#d8e4ff', rMax: 6, drift: 2 }); } });
  UI.bigLine(g, t, { str: 'THE DEAL, OR THE CALL', dur: i.dur + 1, y: E.H * 0.84, size: V(64, 50) }); UI.badge(g, { str: '6:15', a: 1 }); });
R('s138', meeting({ mayaPose: 'phone', mayaExpr: [[0, 'sad'], [3.0, 'determined']], priyaPose: 'crossArms', priyaExpr: 'neutral', after: (g, t, Rr) => caseBox(g, E.W * 0.55, Rr.GY - 150, 0.6, 1) }));
R('s139', (g, t, i) => face(g, t, i, { who: 'MAYA', bg: 'office', expr: 'determined', talk: [505.0, 505.47], mood: 'dusk', glow: 'warm', look: [0.5, 0] }));
R('s140', (g, t, i) => face(g, t, i, { who: 'PRIYA', bg: 'office', expr: 'confused', talk: [505.97, 508.66], mood: 'dusk', side: -1, dx: 80 }));
R('s141', (g, t, i) => wide(g, t, i, { set: 'office', opts: { table: false }, cam: { z: 1.3, dz: 0.06, y: V(90, 80) }, figs: [{ who: 'MAYA', x: 0.3, walk: 1.2, prop: 'phone', expr: 'determined', talk: [509.16, 510.57] }],
  after: (g, t, Rr) => { const k = ease.inOut(prog(t, 0.4, 1.4)); g.save(); g.globalAlpha = 0.25; g.fillStyle = '#cfe0ff'; g.fillRect(E.W * 0.62, Rr.GY - 420, 220 * (1 - k * 0.7), 420); g.restore(); seg(g, [[E.W * 0.62, Rr.GY - 420], [E.W * 0.62, Rr.GY]], 6, '#9aa8c8'); } }));

// ---- the street, the ambulance ----
R('s142', (g, t, i) => { wide(g, t, i, { set: 'street', cam: { z: 1.4, x: V(30, 20), y: V(120, 100) }, figs: [{ who: 'MOM', x: 0.44, y: 0, pose: 'sit', expr: 'sleepy', s: 1.3 }, { who: 'ALVAREZ', x: 0.56, facing: -1, pose: 'kneel', expr: 'worried', s: 1.3 }], readout: { label: 'SHE IS AWAKE ·', value: '6:17 PM', at: 0.2 } });
  counter(g, t, i, '7.6 M', lt(i, 'Seven', 4.4)); });
R('s143', (g, t, i) => wide(g, t, i, { set: 'street', opts: (t) => ({ siren: ease.out(prog(t, 0.2, 0.8)), ambulance: true, ambX: lerp(1200, 520, ease.out(prog(t, 0, 1.6))) }), cam: { z: 1.0, dz: 0.05 }, readout: { label: 'SIRENS ·', value: '6:21 PM', at: 0.2 } }));
R('s144', (g, t, i) => face(g, t, i, { who: 'MAYA', bg: 'street', bgOpts: { siren: 0.5, ambulance: true }, expr: [[0, 'sad'], [3.2, 'smile']], mood: 'night', glow: 'warm', look: [0, 0], line: 'BUT YOU CAN ANSWER TODAY', lineY: E.H * 0.2 }));
R('s145', (g, t, i) => board(g, t, i, { draw: (g, t) => {
  const cx = E.W / 2, cy = E.H * 0.5, r = V(220, 200); ring(g, cx, cy, r, 5, BP());
  const p3 = ease.inOut(prog(t, 0.4, 2.0)), p51 = ease.inOut(prog(t, lt(i, 'Mom', 3.4), lt(i, 'Mom', 3.4) + 1.0));
  g.strokeStyle = alpha(GOLD(), 0.4); g.lineWidth = 34; g.beginPath(); g.arc(cx, cy, r - 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p3); g.stroke();
  g.strokeStyle = '#7fe08a'; g.lineWidth = 34; g.beginPath(); g.arc(cx, cy, r - 80, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (51 / 180) * p51); g.stroke();
  text(g, 'BEST WITHIN ~3 HOURS', cx - V(560, 0), cy - V(40, 330), { size: V(36, 34), font: FONTS.ui, weight: 900, color: GOLD(), alpha: p3 });
  text(g, 'MOM: 51 MIN', cx + V(520, 0), cy + V(40, 330), { size: V(54, 46), font: FONTS.ui, weight: 900, color: '#7fe08a', alpha: p51, glow: 16, glowColor: 'rgba(63,185,80,.5)' });
  UI.bigLine(g, t, { str: 'CLOT-BUSTING DRUGS', dur: i.dur + 1, y: E.H * 0.13, size: V(44, 40) }); } }));

// ---- hospital ----
R('s146', (g, t, i) => face(g, t, i, { who: 'DOCTOR', bg: 'hospital', expr: 'smile', talk: [530.59, 532.09], mood: 'interiorCool', side: -1 }));
const hosp = (extra = []) => (g, t, i) => wide(g, t, i, { set: 'hospital', cam: { z: 1.35, dz: 0.04, y: V(80, 80) }, figs: [{ who: 'MOM', x: 0.42, y: -28, pose: 'sitBack', expr: 'sleepy', shadow: false, s: 1.2 }, { who: 'MAYA', x: 0.62, facing: -1, pose: 'reach', expr: 'smile' }, ...extra] });
R('s147', hosp());
R('s148', (g, t, i) => face(g, t, i, { who: 'MOM', bg: 'hospital', expr: 'smile', talk: [536.24, 537.93], mood: 'interiorCool', side: -1, dx: 60 }));
R('s149', (g, t, i) => wide(g, t, i, { set: 'hospital', cam: { z: 1.35, dz: 0.04, y: V(80, 80) }, figs: [{ who: 'MOM', x: 0.42, y: -28, pose: 'sitBack', expr: 'happy', shadow: false, s: 1.2 }, { who: 'MAYA', x: 0.66, facing: -1, pose: 'relaxed', expr: 'smile' },
  { who: 'SAM', x: lerp(0.8, 0.56, ease.inOut(prog(t, 0.2, 2.0))), y: -lerp(0, 28, ease.inOut(prog(t, 1.2, 2.4))), facing: -1, poses: [[0, 'stand'], [1.4, 'crouch'], [2.4, 'sit']], expr: 'happy', shadow: false, s: 1.3 }] }));
R('s150', (g, t, i) => phoneScreen(g, t, i, (g, x, y, w, h, k) => {
  header(g, x, y, w, k, 'Called It', '2,000 followers'); chat(g, t, x, y, w, k, [{ str: 'TMRW: quiz in ch. 8' }, { str: 'how do u know??' }, { str: 'tomorrow, posted today', me: true }, { str: 'who IS this' }]);
  const del = lt(i, 'delete', 3.6), a = ease.outBack(prog(t, del - 0.6, del - 0.2));
  if (a > 0) { g.save(); g.translate(x + w / 2, y + h * 0.5); g.scale(a, a); rr(g, -150 * k, -90 * k, 300 * k, 180 * k, 26 * k); g.fillStyle = '#2a2e40'; g.fill(); text(g, 'Delete group?', 0, -30 * k, { size: 28 * k, font: FONTS.ui, weight: 900, color: CREAM });
    rr(g, -110 * k, 20 * k, 220 * k, 50 * k, 25 * k); g.fillStyle = t > del ? '#e0302a' : alpha('#e0302a', 0.6); g.fill(); text(g, 'Delete', 0, 45 * k, { size: 24 * k, font: FONTS.ui, weight: 900, color: CREAM }); g.restore(); }
  if (t > del + 0.3) { g.fillStyle = alpha('#10131f', clamp((t - del - 0.3) * 3)); g.fillRect(x, y + 150 * k, w, h); }
}, { bg: 'hospital', bgOpts: {}, cx: 0.5 }));
R('s151', (g, t, i) => phoneScreen(g, t, i, (g, x, y, w, h, k) => { header(g, x, y, w, k, 'Favorites');
  rows(g, t, x, y, w, k, [{ label: 'Mom', star: 1 }, { label: 'Sam', star: clamp((t - lt(i, 'Sam', 2.0)) * 2.5), hi: t > lt(i, 'Sam', 2.0) }]); }, { bg: 'hospital', bgOpts: {}, cx: 0.5 }));
R('s152', (g, t, i) => face(g, t, i, { who: 'SAM', bg: 'hospital', expr: [[0, 'smirk'], [1.4, 'happy']], talk: [550.94, 553.5], mood: 'interiorCool', scale: 0.92 }));

// ---- is any of this real? ----
R('s153', (g, t, i) => board(g, t, i, { title: 'IS ANY OF THIS REAL?', size: V(84, 70) }));
R('s154', (g, t, i) => board(g, t, i, { draw: (g, t) => {
  const tn = lt(i, 'no.', 1.4), tb = lt(i, 'But', 2.0);
  const L = { x: E.W * 0.3, y: E.H * 0.5 }, Rr = { x: E.W * 0.7, y: E.H * 0.5 };
  rr(g, L.x - 90, L.y - 180, 180, 360, 24); g.strokeStyle = BP(); g.lineWidth = 4; g.stroke(); text(g, 'READS TOMORROW', L.x, L.y + 240, { size: V(30, 28), font: FONTS.ui, weight: 900, color: CREAM, spacing: 3 });
  const kn = ease.outBack(prog(t, tn, tn + 0.35)); if (kn > 0) { g.save(); g.translate(L.x, L.y); g.scale(kn, kn); g.rotate(-0.2); text(g, 'NO', 0, 0, { size: V(130, 110), font: FONTS.title, weight: 700, color: TAG, glow: 20, glowColor: alpha(TAG, 0.6) }); g.restore(); }
  const kb = ease.out(prog(t, tb, tb + 0.5)); if (kb > 0) { g.save(); g.globalAlpha *= kb; rr(g, Rr.x - 90, Rr.y - 180, 180, 360, 24); g.strokeStyle = GOLD(); g.lineWidth = 4; g.stroke(); star(g, Rr.x, Rr.y - 40, 50, GOLD()); text(g, 'FAVORITES', Rr.x, Rr.y + 60, { size: 30, font: FONTS.ui, weight: 900, color: GOLD() });
    text(g, 'BREAK THROUGH DND', Rr.x, Rr.y + 240, { size: V(30, 28), font: FONTS.ui, weight: 900, color: CREAM, spacing: 3 }); const kr = ease.outBack(prog(t, lt(i, 'real;', 4.6), lt(i, 'real;', 4.6) + 0.35)); if (kr > 0) { g.save(); g.translate(Rr.x, Rr.y - 240); g.scale(kr, kr); text(g, 'REAL', 0, 0, { size: V(80, 70), font: FONTS.title, weight: 700, color: '#7fe08a', glow: 18, glowColor: 'rgba(63,185,80,.6)' }); g.restore(); } g.restore(); }
} }));
R('s155', (g, t, i) => board(g, t, i, { draw: (g, t) => { g.save(); g.translate(0, -E.H * 0.08); fastIcons(g, t, i, [['F', 'FACE', 0.1], ['A', 'ARM', 0.25], ['S', 'SPEECH', 0.4], ['T', 'TIME · 911', 0.55]]); g.restore();
  const a = ease.out(prog(t, lt(i, 'every', 3.0), lt(i, 'every', 3.0) + 0.4)); text(g, '1 STROKE EVERY ~40 SECONDS · U.S.', E.W / 2, E.H * 0.82, { size: V(46, 38), font: FONTS.ui, weight: 900, color: GOLD(), alpha: a, glow: 14, glowColor: alpha(GOLD(), 0.5) }); } }));
R('s156', (g, t, i) => board(g, t, i, { draw: (g, t) => { UI.bigLine(g, t, { str: "DON'T WAIT FOR TOMORROW.", dur: i.dur + 1, y: E.H * 0.42, size: V(76, 60) }); const a = ease.outBack(prog(t, lt(i, 'Call.', 2.9), lt(i, 'Call.', 2.9) + 0.35)); if (a > 0) { g.save(); g.translate(E.W / 2, E.H * 0.6); g.scale(a, a); text(g, 'CALL.', 0, 0, { size: V(130, 110), font: FONTS.title, weight: 700, color: TAG, glow: 26, glowColor: alpha(TAG, 0.7), spacing: 6 }); g.restore(); } } }));

// ---- the last notification ----
R('s157', (g, t, i) => wide(g, t, i, { set: 'bedroom', opts: { clock: '11:59', phoneGlow: ease.out(prog(t, lt(i, 'One', 1.6), lt(i, 'One', 1.6) + 0.4)) }, cam: { z: 1.05, dz: 0.08 }, before: (g, t, Rr) => mayaInBed(g, t, Rr.GY, Rr.bedX, Rr.M, { expr: 'sleepy' }), fx: 'dust', badge: 'DAY 11' }));
R('s158', (g, t, i) => { card(g, t, i, { sender: 'Unknown number', msg: 'I know you can see this.', time: '6:00 AM', icon: 'app' }); if (t > i.dur - 0.5) veil(g, '#000', clamp((t - (i.dur - 0.5)) * 2)); });
R('s159', (g, t, i) => UI.endScreen(g, t, { question: 'Would you read tomorrow every night, or turn it off?', cast: CAST, rim: '#b8c8ff', moodColors: ['#0b1028', '#1d2550', '#2a2a5a'] }));
