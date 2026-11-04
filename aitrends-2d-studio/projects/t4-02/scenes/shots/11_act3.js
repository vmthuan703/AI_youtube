// shots/11_act3.js — s070–s116: the catch, doubling, no sleep, Priya's offer, day 10, the missed call, the decision.
import { E, V, S, registerShot, ease, prog, clamp, lerp, shake, rr, seg, circle, ring, poly, glow, alpha, text, FONTS } from '/engine/core.js';
import { POSES } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { face, card, wide, lock, board, lt, digitalClock, PHONE_BLUE, TAG, notifCard } from './_tpl.js';
import { phoneScreen, header, CREAM } from './_screens.js';
import { mayaInBed } from './01_night.js';

const R = (id, fn) => registerShot(id, { draw: fn });
const GOLD = () => S().ui.gold, BP = () => UI.bpStroke();
const skate = (g, x, y, s = 1) => { rr(g, x - 70 * s, y - 14 * s, 140 * s, 14 * s, 7 * s); g.fillStyle = '#d64a8a'; g.fill(); circle(g, x - 46 * s, y + 4 * s, 9 * s, '#e8e2d6'); circle(g, x + 46 * s, y + 4 * s, 9 * s, '#e8e2d6'); };
const nightBed = (badge, o = {}) => (g, t, i) => wide(g, t, i, { set: 'bedroom', opts: { clock: o.clock || '11:59', phoneGlow: ease.out(prog(t, 0.2, 0.8)) }, cam: { z: 1.15, dz: 0.06, x: V(120, 80) }, badge,
  before: (g, t, Rr) => mayaInBed(g, t, Rr.GY, Rr.bedX, Rr.M, { mode: 'prop', expr: o.expr || 'determined', prop: 'phone' }), fx: 'dust', ...o });
const bpCard = (g, x, y, w, h, a = 1, c = BP()) => { g.save(); g.globalAlpha *= a; rr(g, x, y, w, h, 14); g.fillStyle = alpha(c, 0.1); g.fill(); g.strokeStyle = c; g.lineWidth = 3; g.stroke(); seg(g, [[x + 24, y + h * 0.4], [x + w * 0.6, y + h * 0.4]], 6, alpha(c, 0.6)); seg(g, [[x + 24, y + h * 0.7], [x + w * 0.4, y + h * 0.7]], 5, alpha(c, 0.4)); g.restore(); };

// ---- the catch ----
R('s070', (g, t, i) => board(g, t, i, { title: 'THE CATCH?', size: V(96, 84) }));
R('s071', nightBed('DAY 7'));
R('s072', (g, t, i) => card(g, t, i, { sender: 'Sam', msg: 'i fell off my skateboard arm hurts', time: '4:22 PM', icon: 'school' }));
R('s073', (g, t, i) => wide(g, t, i, { set: 'bedroom', opts: { clock: '11:40' }, cam: { z: 1.4, x: -V(180, 110), y: V(110, 90) }, figs: [{ who: 'MAYA', x: 0.38, poses: [[0, 'crouch'], [1.6, 'stand']], expr: [[0, 'determined'], [1.8, 'smirk']], rimDir: [-1, -0.4] }],
  after: (g, t, Rr) => { const k = ease.inOut(prog(t, 0.2, 1.4)); skate(g, lerp(E.W * 0.43, E.W * 0.6, k), Rr.GY - 14, 1.3); } }));
R('s074', (g, t, i) => { const tg = lt(i, 'gone', 2.6), gone = t > tg;
  const cards = [{ sender: 'Jordan', msg: 'bring my charger pls', time: '12:30 PM', icon: 'friend' }]; if (!gone) cards.unshift({ sender: 'Sam', msg: 'i fell off my skateboard…', time: '4:22 PM', icon: 'school' });
  lock(g, t, i, { cards, stamp: 1, time: '11:59', shake: Math.abs(t - tg) < 0.35 ? 8 : 0 });
  if (Math.abs(t - tg) < 0.35) { for (let k = 0; k < 8; k++) { g.fillStyle = alpha(k % 2 ? TAG : PHONE_BLUE, 0.35); g.fillRect(E.W * 0.3 + ((k * 97 + t * 900) % 500), E.H * 0.3 + k * 28, 120 + (k * 53) % 200, 8); } }
  if (gone) text(g, 'GONE', E.W * 0.75, E.H * 0.42, { size: V(110, 100), font: FONTS.ui, weight: 900, color: CREAM, alpha: ease.out(prog(t, tg, tg + 0.3)), glow: 20, glowColor: alpha(PHONE_BLUE, 0.8) }); });
R('s075', (g, t, i) => card(g, t, i, { sender: 'Sam', msg: 'tripped on the stairs', time: '4:22 PM', icon: 'school', line: 'TWO NEW ONES', lineY: E.H * 0.18 }));
R('s076', (g, t, i) => card(g, t, i, { sender: 'Mom', msg: 'Taking Sam to urgent care', time: '4:23 PM', icon: 'mom', red: true }));
R('s077', (g, t, i) => wide(g, t, i, { set: 'livingroom', opts: { envelopes: false, mood: 'interiorWarm' }, cam: { z: 1.35, x: -V(160, 100), y: V(80, 70) }, figs: [
  { who: 'SAM', x: 0.4, y: -96, pose: 'sitBack', expr: 'sad', shadow: false, s: 1.4 }, { who: 'MAYA', x: 0.66, facing: -1, pose: 'crossArms', expr: 'worried' }],
  after: (g, t, Rr) => { rr(g, E.W * 0.4 + 40, Rr.GY - 120, 60, 34, 10); g.fillStyle = '#bfe6ff'; g.fill(); } }));
R('s078', (g, t, i) => board(g, t, i, { draw: (g, t) => {
  g.save(); g.translate(E.W / 2, E.H * 0.48); g.scale(1.4, 1.4); g.translate(-E.W / 2, -E.H * 0.48);
  const cx = E.W / 2, y = E.H * 0.48, w = V(320, 300), h = 110;
  const k1 = ease.out(prog(t, 0.2, 0.6)), x1 = ease.out(prog(t, lt(i, 'Erase', 1.4), lt(i, 'Erase', 1.4) + 0.4));
  bpCard(g, cx - V(430, 300) - w / 2, y - h / 2, w, h, k1); if (x1 > 0) { seg(g, [[cx - V(430, 300) - w / 2 - 10, y - h / 2 - 10], [cx - V(430, 300) - w / 2 - 10 + (w + 20) * x1, y + h / 2 + 10]], 8, TAG); }
  const a2 = ease.out(prog(t, lt(i, 'two.', 3.6) - 0.6, lt(i, 'two.', 3.6)));
  if (a2 > 0) { seg(g, [[cx - V(360, 200), y], [cx - V(360, 200) + V(300, 200) * a2, y]], 5, alpha(BP(), 0.8)); poly(g, [[cx - V(60, 0) + 0, y - 14], [cx - V(60, 0) + 0, y + 14], [cx - V(40, -20), y]], BP());
    bpCard(g, cx + V(60, 40), y - h - 20, w, h, a2, TAG); bpCard(g, cx + V(60, 40), y + 20, w, h, a2, TAG); }
  g.restore();
  UI.bigLine(g, t, { str: "THAT'S THE COST", dur: i.dur + 1, y: E.H * 0.18, size: V(64, 56), color: TAG });
  const kc = ease.out(prog(t, lt(i, 'keeps', 5.5), lt(i, 'keeps', 5.5) + 0.4)); if (kc > 0) text(g, 'TOMORROW KEEPS COUNT', cx, E.H * 0.82, { size: V(40, 40), font: FONTS.ui, weight: 900, color: CREAM, alpha: kc, spacing: 6 });
} }));
R('s079', (g, t, i) => { lock(g, t, i, { cards: [{ sender: 'Called It', msg: '+340 members', time: '8:00 AM', icon: 'app' }, { sender: 'Mom', msg: 'pick up milk', time: '5:10 PM', icon: 'mom' }], stamp: 1, tally: 1 });
  const marks = [[0, 46], [lt(i, 'forty-eight', 1.6), 48], [lt(i, 'fifty-two', 2.4), 52], [lt(i, 'sixty', 3.6), 60]]; const v = marks.filter(([at]) => t >= at).pop()[1];
  const pulse = Math.max(...marks.map(([at]) => Math.max(0, 1 - Math.abs(t - at) * 4)));
  text(g, String(v), E.W * 0.75, E.H * 0.42, { size: V(170, 150) * (1 + 0.12 * pulse), font: FONTS.ui, weight: 900, color: v > 46 ? '#ff8a7a' : CREAM, glow: 30, glowColor: alpha(TAG, 0.7) });
  text(g, 'NOTIFICATIONS', E.W * 0.75, E.H * 0.42 + V(110, 100), { size: V(32, 34), font: FONTS.ui, weight: 900, color: alpha(CREAM, 0.7), spacing: 5 }); });
R('s080', (g, t, i) => { lock(g, t, i, { cards: [{ sender: 'Called It', msg: '+340 members', time: '8:00 AM', icon: 'app' }, { sender: 'Mom', msg: 'pick up milk', time: '5:10 PM', icon: 'mom' }, { sender: 'Tyler', msg: 'who is it', time: '1:12 PM', icon: 'app' }], stamp: 1, tally: 1, badge: 'DAY 9', shake: 3 });
  const a = ease.outBack(prog(t, lt(i, 'hundred', 1.0) - 0.2, lt(i, 'hundred', 1.0) + 0.2));
  g.save(); g.translate(E.W * 0.75, E.H * 0.42); g.scale(a, a); text(g, '104', 0, 0, { size: V(190, 160), font: FONTS.ui, weight: 900, color: TAG, glow: 36, glowColor: alpha(TAG, 0.8) }); g.restore(); });
R('s081', (g, t, i) => face(g, t, i, { who: 'MAYA', expr: [[0, 'worried'], [1.7, 'sad']], glow: 'phone', look: [0, 0.6], line: "YOU CAN'T ANSWER IT", lineY: E.H * 0.2 }));
R('s082', (g, t, i) => { card(g, t, i, { sender: 'Jordan', msg: 'failed my driving test lol', time: '2:05 PM', icon: 'friend', strike: lt(i, "Jordan's", 1.2) + 0.4 });
  const a = ease.outBack(prog(t, lt(i, "Ava's", 2.8), lt(i, "Ava's", 2.8) + 0.35)); if (a > 0) { const w = V(1100, 920), x = (E.W - w) / 2; g.save(); g.translate(0, (1 - a) * 40); notifCard(g, x, E.H * 0.42 + V(200, 180), w, { sender: 'Ava', msg: 'flat tire on the bridge ugh', time: '7:40 AM', icon: 'app', s: V(1.9, 1.6), a, stamp: 1 }); g.restore();
    const k = ease.out(prog(t, lt(i, "Ava's", 2.8) + 0.6, lt(i, "Ava's", 2.8) + 0.9)); if (k > 0) seg(g, [[x + 20, E.H * 0.42 + V(200, 180) + 95], [x + 20 + (w - 40) * k, E.H * 0.42 + V(200, 180) + 95]], 8, TAG); } });
R('s083', (g, t, i) => card(g, t, i, { sender: 'Mr. Okafor', msg: 'coffee everywhere, class starts late', time: '8:15 AM', icon: 'teacher', strike: lt(i, 'spill', 0.9) + 0.3 }));
R('s084', (g, t, i) => board(g, t, i, { draw: (g, t) => {
  const tStart = lt(i, 'Start', 1.4), tEnd = lt(i, 'twenty-four', 5.4), steps = Math.floor(clamp((t - tStart) / Math.max(0.5, tEnd - tStart)) * 10 + 0.0001);
  const n = Math.pow(2, steps), aw = V(1300, 900), ah = E.H * 0.46, cols = Math.max(1, Math.ceil(Math.sqrt(n * aw / ah))), rowsN = Math.ceil(n / cols), cell = Math.min(90, aw / cols, ah / rowsN), gx = E.W / 2 - (cols * cell) / 2, gy = E.H * 0.3;
  for (let k = 0; k < Math.min(n, 1024); k++) { const cx = gx + (k % cols) * cell, cy = gy + Math.floor(k / cols) * cell; g.fillStyle = k < n / 2 ? alpha(BP(), 0.7) : GOLD(); g.fillRect(cx, cy, Math.max(2, cell - Math.max(2, cell * 0.12)), Math.max(2, cell - Math.max(2, cell * 0.12))); }
  text(g, n.toLocaleString('en-US'), E.W / 2, E.H * 0.2, { size: V(90, 80), font: FONTS.ui, weight: 900, color: GOLD(), glow: 20, glowColor: alpha(GOLD(), 0.6) });
  text(g, `DOUBLED ${steps} TIMES`, E.W / 2, E.H * 0.86, { size: V(34, 34), font: FONTS.ui, weight: 900, color: CREAM, spacing: 4 });
  if (t < tStart) UI.bigLine(g, t, { str: 'DOUBLING IS SNEAKY', dur: tStart + 0.3, y: E.H * 0.5 });
} }));
R('s085', (g, t, i) => wide(g, t, i, { set: 'bedroom', opts: { clock: '3:00', phoneGlow: 0.6 }, cam: { z: 1.5, x: -V(220, 140), y: -V(40, 110) }, before: (g, t, Rr) => mayaInBed(g, t, Rr.GY, Rr.bedX, Rr.M, { mode: 'prop', expr: [[0, 'thinking'], [2.6, 'sleepy']], prop: 'phone' }),
  after: (g, t, Rr) => { const x = Rr.bedX + 330 + 120 * ease.inOut(prog(t, 2.4, 3.4)); rr(g, x, Rr.GY - 120, 60, 80, 8); g.fillStyle = '#2a2a40'; g.fill(); g.fillStyle = '#9fe0a0'; g.fillRect(x + 8, Rr.GY - 112, 44, 18); }, readout: { label: 'IT IS', value: '3:00 AM', at: 0.2 } }));
R('s086', (g, t, i) => wide(g, t, i, { set: 'bedroom', opts: { clock: '3:07', phoneGlow: 1 }, cam: { z: 1.1, dz: 0.05 }, before: (g, t, Rr) => mayaInBed(g, t, Rr.GY, Rr.bedX, Rr.M, { mode: 'prop', expr: 'sleepy', prop: 'phone' }), fx: 'dust' }));
R('s087', (g, t, i) => board(g, t, i, { draw: (g, t) => {
  g.save(); g.translate(E.W / 2, E.H * 0.5); g.scale(1.6, 1.6); g.translate(-E.W / 2, -E.H * 0.5);
  text(g, 'SLEEP PER NIGHT', E.W / 2, E.H * 0.34, { size: V(40, 40), font: FONTS.title, weight: 700, color: CREAM, spacing: 3 });
  UI.compareBars(g, t, { rows: [{ label: 'NEED', v: 0.9 }, { label: 'YOU', v: 0.36, color: TAG }], x: V(600, 150), y: E.H * 0.46, w: V(560, 700), start: lt(i, 'Teenagers', 0.2) });
  const a = ease.out(prog(t, lt(i, 'eight', 0.8), lt(i, 'eight', 0.8) + 0.3)), b = ease.out(prog(t, lt(i, 'four.', 3.2), lt(i, 'four.', 3.2) + 0.3));
  text(g, '8–10 H', V(600, 150) + 140 + V(560, 700) + 20, E.H * 0.46, { size: V(26, 28), font: FONTS.ui, weight: 900, color: CREAM, align: 'left', alpha: a });
  text(g, '4 H', V(600, 150) + 140 + V(560, 700) * 0.36 + 20, E.H * 0.46 + 60, { size: V(26, 28), font: FONTS.ui, weight: 900, color: TAG, align: 'left', alpha: b });
  g.restore(); } }));
R('s088', (g, t, i) => board(g, t, i, { draw: (g, t) => UI.dataCard(g, t, { title: 'NIGHT 9', subtitle: 'SLEEP YOU\'LL NEVER GET BACK', from: 0, to: 40, decimals: 0, unit: ' H', start: Math.max(0.3, lt(i, 'forty', 2.0) - 1.0), dur: 1.0, labels: [[1, '40 H']], total: i.dur }) }));
R('s089', (g, t, i) => face(g, t, i, { who: 'JORDAN', bg: 'hallway', expr: [[0, 'confused'], [1.6, 'smirk']], talk: [289.27, 292.28], mood: 'interiorCool', side: -1 }));

// ---- Priya ----
R('s090', (g, t, i) => card(g, t, i, { sender: 'Priya Shah', msg: "Hindsight Labs: we've been watching…", time: '9:00 AM', icon: 'app' }));
R('s091', (g, t, i) => wide(g, t, i, { set: 'office', cam: { z: 1.05, dz: 0.06 }, figs: [{ who: 'PRIYA', x: 0.56, facing: -1, pose: 'crossArms', expr: 'smirk', s: 1.3, rimDir: [1, -0.5] }] }));
R('s092', (g, t, i) => face(g, t, i, { who: 'PRIYA', bg: 'office', expr: 'smirk', talk: [302.55, 313.06], mood: 'dusk', side: -1, dx: 80 }));
R('s093', (g, t, i) => wide(g, t, i, { set: 'office', cam: { z: 1.6, y: V(160, 120) }, figs: [{ who: 'PRIYA', x: 0.64, facing: -1, poses: [[0, 'explain'], [1.2, 'point']], talk: [302.55, 313.06], expr: 'smirk', s: 1.3 }],
  after: (g, t, Rr) => { const x = lerp(E.W * 0.6, E.W * 0.38, ease.inOut(prog(t, 0.2, 1.2))); g.save(); g.translate(x, Rr.GY - 132); g.scale(1, 0.35); rr(g, -90, -60, 180, 120, 4); g.fillStyle = '#efeae0'; g.fill(); g.restore(); },
  readout: { label: 'OFFER', value: '$2,000,000 · 6:00 PM', at: 0.4 } }));
R('s094', (g, t, i) => board(g, t, i, { draw: (g, t) => {
  const open = ease.inOut(prog(t, 0.3, 1.4)), cx = E.W / 2, cy = E.H * 0.55, w = V(700, 600), h = V(300, 280);
  g.fillStyle = '#5a6070'; rr(g, cx - w / 2, cy, w, h, 18); g.fill(); g.fillStyle = '#7a8090'; g.fillRect(cx - w / 2, cy, w, 10);
  g.save(); g.translate(cx, cy); g.scale(1, Math.cos(open * 1.2)); rr(g, -w / 2, -h * 0.9, w, h * 0.9, 18); g.fillStyle = '#6a7080'; g.fill(); g.restore();
  rr(g, cx - V(120, 100), cy + 40, V(240, 200), 60, 12); g.fillStyle = '#20222c'; g.fill();
  const a = ease.out(prog(t, lt(i, '6:15', 0.3), lt(i, '6:15', 0.3) + 0.3)); text(g, '6:15 PM', cx, E.H * 0.18, { size: V(70, 64), font: FONTS.ui, weight: 900, color: GOLD(), alpha: a, glow: 18, glowColor: alpha(GOLD(), 0.6) });
  const b = ease.out(prog(t, lt(i, 'twenty-four', 3.0), lt(i, 'twenty-four', 3.0) + 0.3)); text(g, 'SEALED · 24 HOURS', cx, E.H * 0.28, { size: V(40, 40), font: FONTS.ui, weight: 900, color: CREAM, alpha: b, spacing: 5 });
} }));
R('s095', (g, t, i) => board(g, t, i, { draw: (g, t) => {
  const cols = 9, cell = V(70, 62), gx = E.W / 2 - (cols * cell) / 2, gy = E.H * 0.3, n = Math.round(63 * ease.inOut(prog(t, lt(i, 'Sixty-three', 2.2) - 0.3, lt(i, 'correct.', 5.0))));
  rr(g, gx - 40, gy - 40, cols * cell + 80, 7 * cell + 80, 30); g.fillStyle = '#10131f'; g.fill(); g.strokeStyle = alpha(CREAM, 0.15); g.lineWidth = 3; g.stroke();
  for (let k = 0; k < 63; k++) { const x = gx + (k % cols) * cell + cell / 2, y = gy + Math.floor(k / cols) * cell + cell / 2; ring(g, x, y, cell * 0.36, 3, alpha(CREAM, 0.2)); if (k < n) seg(g, [[x - 12, y], [x - 3, y + 10], [x + 14, y - 12]], 6, '#3fb950'); }
  text(g, `${n} / 63 CORRECT`, E.W / 2, E.H * 0.16, { size: V(56, 52), font: FONTS.ui, weight: 900, color: '#7fe08a', glow: 16, glowColor: 'rgba(63,185,80,.6)' });
} }));
R('s096', (g, t, i) => board(g, t, i, { draw: (g, t) => {
  for (let k = 0; k < 7; k++) { const x = E.W / 2 + (k - 3) * V(160, 120), y = E.H * 0.34 + Math.sin(t * 3 + k) * 10, sq = Math.abs(Math.cos(t * 4 + k)); g.save(); g.translate(x, y); g.scale(1, Math.max(0.12, sq)); circle(g, 0, 0, 46, GOLD()); circle(g, 0, 0, 36, alpha('#7a5a1a', 0.6)); g.restore(); }
  const a = ease.out(prog(t, lt(i, 'about', 3.6), lt(i, 'about', 3.6) + 0.4));
  text(g, '1 IN 9,000,000,000,000,000,000', E.W / 2, E.H * 0.6, { size: V(70, 46), font: FONTS.ui, weight: 900, color: GOLD(), alpha: a, glow: 20, glowColor: alpha(GOLD(), 0.6) });
  text(g, '(NINE QUINTILLION)', E.W / 2, E.H * 0.7, { size: V(34, 32), font: FONTS.ui, weight: 900, color: CREAM, alpha: a, spacing: 4 });
} }));
R('s097', (g, t, i) => face(g, t, i, { who: 'PRIYA', bg: 'office', expr: [[0, 'neutral'], [1.2, 'smirk']], mood: 'dusk', side: -1, dx: 80, line: 'NOT LUCK', lineY: E.H * 0.14 }));
const faraday = (blocked) => (g, t, i) => board(g, t, i, { draw: (g, t) => {
  const cx = E.W / 2, cy = E.H * 0.52, w = V(420, 380), h = V(300, 280);
  for (let k = 0; k < 5; k++) { const r = ((t * 260 + k * 120) % 600) + 80; g.strokeStyle = alpha(BP(), 0.7 * (1 - r / 680)); g.lineWidth = 3; g.beginPath(); g.arc(cx - V(700, 400), cy, r, -0.5, 0.5); g.stroke(); }
  rr(g, cx - w / 2, cy - h / 2, w, h, 12); g.fillStyle = alpha(BP(), 0.08); g.fill(); g.strokeStyle = GOLD(); g.lineWidth = 6; g.stroke();
  for (let k = 1; k < 6; k++) { seg(g, [[cx - w / 2 + (w * k) / 6, cy - h / 2], [cx - w / 2 + (w * k) / 6, cy + h / 2]], 2, alpha(GOLD(), 0.4)); seg(g, [[cx - w / 2, cy - h / 2 + (h * k) / 6], [cx + w / 2, cy - h / 2 + (h * k) / 6]], 2, alpha(GOLD(), 0.4)); }
  text(g, 'FARADAY CAGE', cx, cy - h / 2 - 50, { size: V(40, 40), font: FONTS.ui, weight: 900, color: GOLD(), spacing: 5 });
  if (blocked) { rr(g, cx - 40, cy - 70, 80, 140, 14); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
    const xk = ease.out(prog(t, lt(i, 'phone', 3.0), lt(i, 'phone', 3.0) + 0.3)); if (xk > 0) { seg(g, [[cx - 90, cy - 90], [cx - 90 + 180 * xk, cy - 90 + 180 * xk]], 10, TAG); seg(g, [[cx + 90, cy - 90], [cx + 90 - 180 * xk, cy - 90 + 180 * xk]], 10, TAG); }
    [['NOTHING IN', lt(i, 'in.', 0.3)], ['NOTHING OUT', lt(i, 'out.', 1.6)]].forEach(([s, at], k) => text(g, s, cx + (k ? 1 : -1) * V(520, 330), cy + h / 2 + 60, { size: V(34, 30), font: FONTS.ui, weight: 900, color: CREAM, alpha: ease.out(prog(t, at, at + 0.3)), spacing: 3 })); }
} });
R('s098', faraday(false));
R('s099', faraday(true));
R('s100', (g, t, i) => face(g, t, i, { who: 'MAYA', expr: [[0, 'thinking'], [1.6, 'worried']], glow: 'phone', look: [-0.3, 0.3], readout: { label: 'MOM COULD STOP WORKING DOUBLES ·', value: '$2,000,000', at: 0.3 } }));

// ---- that night ----
R('s101', (g, t, i) => wide(g, t, i, { set: 'livingroom', cam: { z: 1.2, dz: 0.05, y: V(40, 40) }, figs: [{ who: 'MOM', x: 0.42, y: -60, rot: -Math.PI / 2 + 0.2, pose: 'lie', expr: 'sleepy', blink: true, shadow: false, s: 1.15 }], fx: 'dust' }));
R('s102', (g, t, i) => wide(g, t, i, { set: 'livingroom', cam: { z: 2.4, dz: 0.1, x: V(560, 330), y: V(340, 260) }, fx: 'dust' }));
R('s103', nightBed('DAY 10', { clock: '11:59' }));
R('s104', (g, t, i) => lock(g, t, i, { cards: Array.from({ length: 14 }, (_, k) => ({ sender: ['Spam', 'School', 'Tyler', 'Ava', 'Called It', 'Mom', 'Jordan'][k % 7], msg: ['WIN A FREE…', 'Grades posted', 'who is it', 'see u tmrw', '+2k members', 'milk pls', 'u up?'][k % 7], time: '…', icon: ['app', 'school', 'app', 'app', 'app', 'mom', 'friend'][k % 7] })), stamp: 1, scroll: (t) => t * 260, shake: 3,
  count: { from: 104, to: 312, label: 'NOTIFICATIONS', at: 0.1, dur: 2.2, color: '#ff8a7a' } }));
R('s105', (g, t, i) => { const names = [['Spam', 'WIN A FREE CRUISE', 'app'], ['School', 'Grades posted', 'school'], ['Tyler', 'who is it', 'app'], ['Ava', 'see u tmrw', 'app']]; const k = Math.min(3, Math.floor(t / (i.dur / 4)));
  card(g, t - k * (i.dur / 4), { ...i, dur: i.dur / 4 }, { sender: names[k][0], msg: names[k][1], icon: names[k][2], time: '…' }); });
R('s106', (g, t, i) => face(g, t, i, { who: 'MAYA', expr: [[0, 'sleepy'], [1.0, 'surprised'], [1.8, 'scared']], glow: 'phone', look: [0, 0.7] }));
R('s107', (g, t, i) => card(g, t, i, { sender: 'Missed call: Mom', msg: '(14)', time: '6:12 PM', icon: 'mom', red: true, line: '14 MISSED CALLS', lineY: E.H * 0.35 }));
R('s108', (g, t, i) => lock(g, t, i, { bg: 'busstop', cards: Array.from({ length: 6 }, () => ({ sender: 'Mom · last Tuesday', msg: 'have you seen my sweater?', time: 'missed', icon: 'mom' })), stamp: 0, drop: 0.25, count: { from: 0, to: 9, label: 'ABOUT A SWEATER', word: 'nine', dur: 0.7 } }));
R('s109', (g, t, i) => wide(g, t, i, { set: 'busstop', cam: { z: 1.3, dz: 0.05, y: -V(30, 80) }, figs: [{ who: 'MAYA', x: 0.42, pose: 'phone', prop: 'phone', expr: 'worried' }] }));
R('s110', (g, t, i) => wide(g, t, i, { set: 'kitchen', cam: { z: 1.55, x: V(40, 30), y: V(140, 110) }, figs: [{ who: 'MOM', x: 0.48, pose: 'phone', prop: 'phone', expr: 'happy', talk: [379.83, 382.99] }],
  after: (g, t, Rr) => { rr(g, E.W * 0.56, Rr.GY - 186, 150, 34, 8); g.fillStyle = '#c0703a'; g.fill(); g.fillStyle = '#e8c070'; g.fillRect(E.W * 0.56 + 8, Rr.GY - 186, 134, 10); } }));
R('s111', (g, t, i) => face(g, t, i, { who: 'MAYA', bg: 'busstop', expr: 'smile', mood: 'golden', glow: 'warm', look: [0.2, 0] }));
R('s112', (g, t, i) => board(g, t, i, { draw: (g, t) => {
  digitalClock(g, E.W / 2, E.H * 0.42, V(3.2, 2.6), '7:41', { pm: false });
  const a = ease.out(prog(t, lt(i, '11:59', 1.0), lt(i, '11:59', 1.0) + 0.3)); text(g, 'NEXT UPDATE: 11:59 PM', E.W / 2, E.H * 0.62, { size: V(40, 40), font: FONTS.ui, weight: 900, color: CREAM, alpha: a, spacing: 4 });
  const b = ease.out(prog(t, lt(i, 'late', 4.2), lt(i, 'late', 4.2) + 0.3)); text(g, 'TOO LATE TO CHECK', E.W / 2, E.H * 0.74, { size: V(56, 52), font: FONTS.ui, weight: 900, color: TAG, alpha: b, glow: 16, glowColor: alpha(TAG, 0.6), spacing: 3 });
} }));
R('s113', (g, t, i) => wide(g, t, i, { set: 'kitchen', opts: { clockH: 17, clockM: 15 }, cam: { z: 1.5, x: -V(420, 260), y: V(110, 90) }, figs: [{ who: 'MAYA', x: 0.24, facing: -1, pose: 'reach', expr: [[0, 'thinking'], [2.6, 'worried']] }],
  before: (g, t, Rr) => FX.door(g, { x: E.W * 0.08, y: Rr.GY, w: 150, h: 330, color: '#3a2a36', open: 0, light: '#ffd59a' }), readout: { label: 'DOWNTOWN OR HOME ·', value: '5:15 PM', at: 0.3 } }));
R('s114', (g, t, i) => wide(g, t, i, { set: 'kitchen', opts: { clockH: 17, clockM: 16 }, cam: { z: 1.4, dz: 0.05, x: V(80, 50), y: V(120, 100) }, figs: [{ who: 'MOM', x: 0.5, poses: [[0, 'cheer'], [0.6, 'wave'], [1.2, 'cheer'], [1.8, 'wave'], [2.4, 'cheer'], [3.0, 'wave'], [3.6, 'cheer']], expr: 'joy' }],
  after: (g, t, Rr) => { for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k * 0.33) % 1; text(g, '♪', E.W * 0.62 + ph * 120, Rr.GY - 200 - ph * 180, { size: 44, color: alpha('#ffd59a', 1 - ph), font: FONTS.ui, weight: 900 }); } } }));
R('s115', (g, t, i) => face(g, t, i, { who: 'MAYA', bg: 'kitchen', bgOpts: {}, expr: [[0, 'thinking'], [1.6, 'determined']], glow: 'warm', look: [-0.5, 0], readout: { label: 'THE OFFER', value: '$2,000,000', at: 0.2 } }));
R('s116', (g, t, i) => face(g, t, i, { who: 'MOM', bg: 'kitchen', bgOpts: {}, expr: 'joy', talk: [404.16, 405.57], glow: 'warm', side: -1, dx: 60 }));
