// shots/10_act2.js — s033–s069: Mom & the favorites plant, the storm, Ava, Called It, Jordan's test.
import { E, V, S, registerShot, ease, prog, clamp, lerp, rr, seg, circle, glow, alpha, text, FONTS } from '/engine/core.js';
import { POSES } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { face, card, wide, lock, board, lt, digitalClock, PHONE_BLUE } from './_tpl.js';
import { phoneScreen, header, chat, rows, star, CREAM } from './_screens.js';
import { mayaInBed } from './01_night.js';

const R = (id, fn) => registerShot(id, { draw: fn });
const bowl = (g, x, y, s) => { g.fillStyle = '#c8ccd8'; g.beginPath(); g.ellipse(x, y, 70 * s, 24 * s, 0, 0, Math.PI); g.fill(); g.fillStyle = '#e8d8a0'; g.beginPath(); g.ellipse(x, y, 66 * s, 10 * s, 0, 0, Math.PI * 2); g.fill(); };
const mug = (g, x, y) => { rr(g, x - 14, y - 30, 28, 30, 5); g.fillStyle = '#e8e2d6'; g.fill(); seg(g, [[x + 14, y - 24], [x + 22, y - 18], [x + 14, y - 10]], 4, '#e8e2d6'); };
const skate = (g, x, y, s = 1) => { rr(g, x - 70 * s, y - 14 * s, 140 * s, 14 * s, 7 * s); g.fillStyle = '#d64a8a'; g.fill(); circle(g, x - 46 * s, y + 4 * s, 9 * s, '#e8e2d6'); circle(g, x + 46 * s, y + 4 * s, 9 * s, '#e8e2d6'); };

// ---- kitchen, Mom, favorites ----
R('s033', (g, t, i) => wide(g, t, i, { set: 'kitchen', opts: { clockH: 7 }, cam: { z: 1.05, dz: 0.05 }, figs: [{ who: 'MOM', x: 0.32, walk: 0.5, expr: 'sleepy', s: 1.25, rimDir: [-1, -0.4] }], after: (g, t, Rr) => mug(g, E.W * 0.32 + 80 * t + 40, Rr.GY - 150), fx: 'dust',
  readout: { label: 'AFTER A', value: '12-HOUR SHIFT', word: 'twelve-hour' } }));
R('s034', (g, t, i) => lock(g, t, i, { bg: 'kitchen', bgOpts: {}, drop: 0.12, cards: Array.from({ length: 6 }, (_, k) => ({ sender: 'Mom', msg: ['call me back', 'are you up?', 'call me', 'honey?', 'CALL ME', 'love you'][k], time: `missed call`, icon: 'mom' })), stamp: 0,
  count: { from: 0, to: 9, label: 'MISSED CALLS', word: 'lot', dur: 0.8, color: '#ff8a7a' } }));
R('s035', (g, t, i) => wide(g, t, i, { set: 'kitchen', cam: { z: 1.45, x: -V(140, 90), y: V(120, 100) }, figs: [
  { who: 'MAYA', x: 0.38, poses: [[0, 'phone']], prop: 'phone', expr: 'sleepy', rimDir: [-1, -0.4] },
  { who: 'MOM', x: 0.62, facing: -1, poses: [[0, 'stand'], [0.6, 'reach']], expr: 'smile', rimDir: [-1, -0.4] }] }));
R('s036', (g, t, i) => face(g, t, i, { who: 'MOM', bg: 'kitchen', bgOpts: {}, expr: 'smile', talk: [101.40, 106.16], glow: 'warm', side: -1, dx: 60 }));
R('s037', (g, t, i) => phoneScreen(g, t, i, (g, x, y, w, h, k) => {
  header(g, x, y, w, k, 'Do Not Disturb', 'Focus');
  rows(g, t, x, y, w, k, [{ label: 'Do Not Disturb', on: 1 }, { label: 'Allow calls from', value: 'Favorites', hi: t > lt(i, 'favorites', 1.2), at: 0.2 }, { label: 'Mom', star: clamp((t - lt(i, 'through.', 2.6)) * 2), at: 0.5 }, { label: 'Jordan', star: 0, at: 0.6 }, { label: 'Ava', star: 0, at: 0.7 }]);
}, { bg: 'kitchen', bgOpts: {} }));
R('s038', (g, t, i) => wide(g, t, i, { set: 'kitchen', cam: { z: 1.45, x: -V(140, 90), y: V(120, 100) }, figs: [
  { who: 'MAYA', x: 0.38, poses: [[0, 'reach'], [0.7, 'phone']], prop: t > 0.7 ? 'phone' : null, expr: 'neutral', rimDir: [-1, -0.4] },
  { who: 'MOM', x: 0.62, facing: -1, poses: [[0, 'reach'], [0.8, 'relaxed']], expr: [[0, 'smile'], [1.0, 'neutral']], rimDir: [-1, -0.4] }] }));
R('s039', (g, t, i) => face(g, t, i, { who: 'MAYA', bg: 'kitchen', bgOpts: {}, expr: 'neutral', talk: [108.58, 109.80], glow: 'warm', look: [-0.6, 0], dx: -60 }));
R('s040', (g, t, i) => wide(g, t, i, { set: 'kitchen', cam: { z: 1.6, x: V(40, 30), y: V(150, 120) }, figs: [{ who: 'SAM', x: 0.47, pose: 'holdFront', expr: 'happy', s: 1.5, rimDir: [-1, -0.4] }],
  after: (g, t, Rr) => { bowl(g, E.W * 0.47 + 34, Rr.GY - 162 - 3 * Math.abs(Math.sin(t * 3)), 1.15); } }));
R('s041', (g, t, i) => face(g, t, i, { who: 'SAM', bg: 'kitchen', bgOpts: {}, expr: 'smirk', talk: [115.03, 115.94], glow: 'warm', scale: 0.92 }));

// ---- day 3: the storm ----
const nightBed = (badge, extra = {}) => (g, t, i) => wide(g, t, i, { set: 'bedroom', opts: { clock: '11:59', phoneGlow: ease.out(prog(t, 0.2, 0.8)) }, cam: { z: 1.15, dz: 0.06, x: V(120, 80) }, badge,
  before: (g, t, Rr) => mayaInBed(g, t, Rr.GY, Rr.bedX, Rr.M, { mode: 'prop', expr: extra.expr || 'determined', prop: 'phone' }), fx: 'dust', ...extra });
R('s042', nightBed('DAY 3'));
R('s043', (g, t, i) => card(g, t, i, { sender: 'Weather', msg: 'Severe thunderstorm warning', time: '3:40 PM', icon: 'weather' }));
R('s044', (g, t, i) => wide(g, t, i, { set: 'track', opts: { mood: 'day', sign: 'PRACTICE 3:30' }, cam: { z: 1.0, dz: 0.06 }, figs: [0.2, 0.3, 0.42].map((x, k) => ({ outfit: { top: 'none' }, x, pose: 'ready', s: 0.9, dim: 0.1 })).concat([{ who: 'COACH', x: 0.62, pose: 'crossArms', s: 1.05 }]), readout: { label: 'OUTSIDE', value: '3:30 PM', word: '3:30' } }));
R('s045', (g, t, i) => phoneScreen(g, t, i, (g, x, y, w, h, k) => {
  const bg = g.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, '#3a6ab0'); bg.addColorStop(1, '#8ab0e0'); g.fillStyle = bg; g.fillRect(x, y, w, h);
  text(g, 'Today', x + w / 2, y + 110 * k, { size: 30 * k, font: FONTS.ui, weight: 900, color: CREAM });
  FX.sun(g, x + w / 2, y + 260 * k, 50 * k, '#fff6d0', '#ffd59a', 2.5);
  text(g, '72°', x + w / 2, y + 400 * k, { size: 90 * k, font: FONTS.ui, weight: 900, color: CREAM });
  const a = ease.outBack(prog(t, lt(i, 'ten', 1.4), lt(i, 'ten', 1.4) + 0.35));
  g.save(); g.translate(x + w / 2, y + 520 * k); g.scale(a, a); text(g, 'RAIN 10%', 0, 0, { size: 40 * k, font: FONTS.ui, weight: 900, color: S().ui.gold, glow: 16, glowColor: alpha(S().ui.gold, 0.6) }); g.restore();
}, { bg: 'track', bgOpts: { mood: 'day' }, cx: 0.5 }));
const forecastBars = (you) => (g, t, i) => board(g, t, i, { draw: (g, t) => {
  g.save(); g.translate(E.W / 2, E.H * 0.48); g.scale(1.55, 1.55); g.translate(-E.W / 2, -E.H * 0.48);
  text(g, 'FORECAST ACCURACY', E.W / 2, E.H * 0.34, { size: V(54, 50), font: FONTS.title, weight: 700, color: S().ui.cream, spacing: 3 });
  const rowsB = [{ label: '5-DAY', v: 0.9 }, { label: '10-DAY', v: 0.5 }]; if (you) rowsB.push({ label: 'YOURS', v: 1.0, color: S().ui.gold });
  UI.compareBars(g, you ? 9 : t, { rows: rowsB, x: V(560, 120), y: E.H * 0.44, w: V(620, 760), start: you ? 0 : lt(i, 'ninety', 1.4) - 0.6 });
  if (you) { const p = ease.out(prog(t, 0.2, 1.1)); g.save(); g.globalAlpha *= 1; UI.compareBars(g, 0.3 + p * 1.2, { rows: [{ label: '', v: 0 }, { label: '', v: 0 }, { label: '', v: 1.0, color: S().ui.gold }], x: V(560, 120), y: E.H * 0.44, w: V(620, 760), start: -0.3 }); g.restore(); }
  const lab = [['90%', lt(i, 'ninety', 1.4)], ['~50%', lt(i, 'half', 4.6)]]; if (you) lab.push(['100%', 0.6]);
  lab.forEach(([s, at], k) => { const a = you && k < 2 ? 1 : ease.out(prog(t, at, at + 0.3)); text(g, s, V(560, 120) + 120 + V(620, 760) + 30, E.H * 0.44 + k * 60, { size: V(30, 32), font: FONTS.ui, weight: 900, color: k === 2 ? S().ui.gold : S().ui.cream, align: 'left', alpha: a }); });
  g.restore();
} });
R('s046', forecastBars(false));
R('s047', forecastBars(true));
R('s048', (g, t, i) => wide(g, t, i, { set: 'bedroom', opts: { clock: '7:15', mood: 'night' }, cam: { z: 1.45, x: -V(60, 40), y: V(120, 100) }, figs: [{ who: 'MAYA', x: 0.45, poses: [[0, 'holdFront'], [0.9, 'crouch']], expr: 'smirk', rimDir: [-1, -0.4] }],
  after: (g, t, Rr) => { const y = Rr.GY - 40; rr(g, E.W * 0.52, y - 70, 110, 90, 16); g.fillStyle = '#2a4a6a'; g.fill(); rr(g, E.W * 0.52 + 20, y - 70 - 40 * (1 - ease.inOut(prog(t, 0.3, 1.2))), 70, 50, 10); g.fillStyle = '#f2c21a'; g.fill(); } }));
R('s049', (g, t, i) => wide(g, t, i, { set: 'track', opts: (t) => ({ mood: 'storm', flash: Math.max(0, 1 - t * 2.5) }), cam: { z: 1.05, dz: 0.04 }, shake: 3, bars: 'scope',
  figs: [0.18, 0.3, 0.7, 0.82].map((x, k) => ({ outfit: { top: 'none' }, x, pose: k % 2 ? 'handsOnHead' : 'crouch', expr: 'shocked', s: 1.0, dim: 0.1 })).concat([{ who: 'MAYA', x: 0.5, pose: 'crossArms', expr: 'smirk', s: 1.2, outfit: { top: 'hoodie', color: '#d64a33', head: 'hood', headColor: '#d64a33' } }]),
  after: () => { if (t < 0.4) FX.lightning(g, { x1: E.W * 0.72, y1: 0, x2: E.W * 0.6, y2: E.H * 0.55, seed: 3, a: 1 - t * 2.5 }); } }));
R('s050', (g, t, i) => face(g, t, i, { who: 'COACH', bg: 'track', bgOpts: { mood: 'storm' }, expr: 'shocked', talk: [140.08, 143.09], mood: 'storm', fx: 'rain' }));

// ---- day 5: Ava ----
R('s051', nightBed('DAY 5', { expr: 'neutral' }));
R('s052', (g, t, i) => card(g, t, i, { sender: 'Ava', msg: 'hey are you going to the…', time: '9:47 PM', icon: 'app' }));
R('s053', (g, t, i) => face(g, t, i, { who: 'MAYA', expr: [[0, 'thinking'], [1.6, 'confused']], glow: 'phone', look: [0.3, 0.6] , line: 'GOING TO THE…?', lineY: E.H * 0.15 }));
R('s054', (g, t, i) => board(g, t, i, { draw: (g, t) => UI.dataCard(g, t, { title: 'COLLEGE STUDENTS', subtitle: 'FELT A BUZZ THAT WASN\'T THERE · ONE STUDY', from: 0, to: 89, decimals: 0, unit: '%', start: Math.max(0.5, lt(i, 'eighty-nine', 1.4) - 0.8), dur: 1.4, labels: [[1, '89%']], total: i.dur }) , line: null }));
R('s055', (g, t, i) => face(g, t, i, { who: 'MAYA', expr: [[0, 'smirk'], [1.5, 'happy']], glow: 'phone', look: [0.2, 0.6] }));
R('s056', (g, t, i) => wide(g, t, i, { set: 'hallway', cam: { z: 1.3, dz: 0.05, y: -V(60, 140) }, figs: [{ who: 'MAYA', x: 0.3, walk: 0.9, expr: 'determined' }, { who: 'AVA', x: 0.68, facing: -1, pose: 'phone', prop: 'phone', expr: 'neutral' }] }));
R('s057', (g, t, i) => face(g, t, i, { who: 'AVA', bg: 'hallway', expr: [[0, 'surprised'], [1.0, 'happy']], talk: [164.61, 167.28], mood: 'interiorCool', side: -1 }));

// ---- day 6: Called It ----
R('s058', nightBed('DAY 6', { expr: 'smirk', line: 'CALLED IT', lineY: E.H * 0.16 }));
R('s059', (g, t, i) => phoneScreen(g, t, i, (g, x, y, w, h, k) => { header(g, x, y, w, k, 'Called It', 'group · 14 members'); chat(g, t, x, y, w, k, [{ str: 'tomorrow, posted today', me: true, at: 0.3 }, { str: 'trust me', me: true, at: 1.2 }]); }, { cx: 0.5 }));
R('s060', (g, t, i) => phoneScreen(g, t, i, (g, x, y, w, h, k) => { header(g, x, y, w, k, 'Called It', 'group · 600 members'); chat(g, t, x, y, w, k, [{ str: 'tomorrow, posted today', me: true }, { str: 'trust me', me: true }, { str: 'SNOW DAY', me: true, at: lt(i, 'Snow', 0.1) }, { str: 'LOCKDOWN DRILL 10:40', me: true, at: lt(i, 'Lockdown', 1.2) }]); }, { cx: 0.5 }));
R('s061', (g, t, i) => wide(g, t, i, { set: 'classroom', opts: { boardText: 'LUNCH', boardSub: 'TODAY: PIZZA' }, cam: { z: 1.35, y: V(60, 60) }, figs: [0.26, 0.38, 0.62, 0.74].map((x, k) => ({ outfit: { top: 'none' }, x, pose: k % 2 ? 'shrug' : 'facepalm', expr: 'sad', s: 1.1, facing: x < 0.5 ? 1 : -1, dim: 0.1 })),
  after: (g, t, Rr) => { rr(g, E.W / 2 - 120, Rr.GY - 150, 240, 24, 6); g.fillStyle = '#c8ccd8'; g.fill(); text(g, 'PIZZA', E.W / 2, Rr.GY - 176, { size: 28, font: FONTS.ui, weight: 900, color: alpha('#e8e2d6', 0.7) }); FX.clock(g, E.W * 0.86, Rr.GY - V(520, 700), 46, 12 * 3600 + 14 * 60, { face: '#e9e2ea' }); },
  readout: { label: 'OUT OF PIZZA AT', value: '12:14', word: '12:14', color: '#ff8a7a' } }));
R('s062', (g, t, i) => lock(g, t, i, { cards: [{ sender: 'Called It', msg: '+312 new members', time: 'now', icon: 'app' }, { sender: 'Called It', msg: '+540 new members', time: 'now', icon: 'app' }, { sender: 'Called It', msg: '+1,148 new members', time: 'now', icon: 'app' }], stamp: 0, drop: 0.3, count: { from: 0, to: 2000, label: 'FOLLOWERS', word: 'two', dur: 1.2 } }));
R('s063', (g, t, i) => face(g, t, i, { who: 'TYLER', bg: 'hallway', expr: [[0, 'confused'], [1.0, 'angry']], talk: [182.45, 185.03], mood: 'interiorCool', side: -1 }));

// ---- Jordan's driving test ----
R('s064', (g, t, i) => card(g, t, i, { sender: 'Jordan', msg: 'failed my driving test lol', time: '2:05 PM', icon: 'friend' }));
R('s065', (g, t, i) => wide(g, t, i, { set: 'parking', opts: { carX: -40 + 60 * Math.sin(t * 0.6) }, cam: { z: 1.2, dz: 0.05, y: V(30, 40) }, figs: [{ who: 'MAYA', x: 0.72, facing: -1, poses: [[0, 'point'], [1.5, 'explain'], [3, 'point']], expr: 'determined' }],
  readout: { label: 'PARALLEL PARKING', value: '2 HOURS', word: 'two' } }));
R('s066', (g, t, i) => wide(g, t, i, { set: 'parking', opts: { carX: lerp(-260, 40, ease.inOut(prog(t, 0.2, 3.6))), cones: [-420, -250, 210, 380] }, cam: { z: 0.95, dz: 0.06 }, figs: [{ who: 'MAYA', x: 0.82, facing: -1, pose: 'cheer', expr: 'happy', s: 1.0 }] }));
R('s067', (g, t, i) => face(g, t, i, { who: 'JORDAN', bg: 'hallway', expr: 'joy', talk: [201.91, 204.15], mood: 'interiorCool', side: -1,
  line: null, fx: null }));
R('s068', (g, t, i) => wide(g, t, i, { set: 'bedroom', opts: { clock: '10:30', phoneGlow: 1 }, cam: { z: 1.3, x: -V(200, 120), y: -V(40, 100) }, before: (g, t, Rr) => mayaInBed(g, t, Rr.GY, Rr.bedX, Rr.M, { mode: 'prop', expr: 'joy', prop: 'phone' }), fx: 'dust' }));
R('s069', (g, t, i) => face(g, t, i, { who: 'MAYA', expr: 'determined', glow: 'phone', look: [0.3, 0.5], line: 'EDITING TOMORROW', lineY: E.H * 0.2 }));
