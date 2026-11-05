// a.js — every picture in engine/diagrams2d.js, plus a diagram on a blurred scene. Learn the calls from here, don't copy the layouts.
import { E, registerShot } from '/engine/core.js';
import * as UI from '/engine/ui2d.js';
import * as D from '/engine/diagrams2d.js';
import { HERO } from '/channel/cast.js';

const H = { color: HERO.color, hairColor: HERO.hairColor, hair: 'spiky', seams: true };

registerShot('home', {
  init(T) { const st = T.stage({ mood: 'interiorWarm', fov: 40, fog: [8, 30] }); T.W.room(st, { kind: 'classroom', w: 9, d: 8, h: 3.2, desks: true }); const h = st.add(T.character(HERO).place(0, 0, 0.4, 0)); return { st, h }; },
  draw(s, t, i, T) { s.h.pose(T.breathe3('relaxed', t)).face({ expr: 'unimpressed', t, blink: true }); T.dolly(s.st.camera, t, [[0, { pos: [0, 1.3, 5.2], look: [0, 1.2, 0] }], [5, { pos: [0, 1.3, 4.8], look: [0, 1.2, 0] }]]); },
});
// "backdrop" in shots.json puts the home shot behind this 2D shot, blurred and dimmed
registerShot('blurred', { kind: '2d', draw(g, t) {
  UI.heading(g, { str: 'SHORT-TERM MEMORY', t, y: 130 }); D.flatFigure(g, { ...H, x: 330, y: 930, h: 560, pose: 'point', expr: t < 2.2 ? 'neutral' : 'deadpan', t });
  D.organ(g, { kind: 'brain', x: 1130, y: 330, r: 100, t, start: 0.1 });
  D.chips(g, { x: 1130, y: 560, items: ['DATE', 'NAME', 'KING', 'WAR', 'MAP', 'YEAR', 'CITY'], lit: 4, litAt: 2.2, t, start: 0.5 });
  UI.pill(g, { str: 'ABOUT 4 CHUNKS', x: 1130, y: 690, gold: true, t, start: 2.3 });
} });
registerShot('instruments', { kind: '2d', draw(g, t) {
  D.stage2d(g); D.crossSection(g, { x: 400, y: 640, s: 0.72, groundW: 1040, title: 'PLUGGED IN', cut: Math.min(1, Math.max(0, t - 2)), t });
  D.scale(g, { x: 1000, y: 620, s: 0.95, value: 0.7, label: '15 LB', t, start: 0.2 });
  D.stopwatch(g, { x: 1000, y: 280, r: 92, value: '9.58', t, start: 0.3 });
  D.growthBars(g, { x: 1500, y: 860, w: 520, h: 320, labels: ['1', '2', '3', '4', '5'], t, start: 0.4 });
  D.calendarCard(g, { x: 1280, y: 300, s: 0.95, head: 'MONTH', value: 5, t, start: 0.1 });
  D.stamp(g, { str: 'DISQUALIFIED', x: 1570, y: 280, size: 44, t, start: 1.2 });
  D.flatFigure(g, { ...H, x: 880, y: 905, h: 220, t, start: 0.5, pose: 'shrug', expr: 'deadpan' });
} });
registerShot('body-world', { kind: '2d', draw(g, t) {
  D.stage2d(g, { floor: false });
  D.organ(g, { kind: 'brain', x: 190, y: 250, r: 86, t }); D.organ(g, { kind: 'lungs', x: 440, y: 250, r: 86, t, start: 0.1 }); D.organ(g, { kind: 'kidneys', x: 190, y: 510, r: 70, t, start: 0.2 }); D.organ(g, { kind: 'heart', x: 440, y: 510, r: 84, pulse: 1, t, start: 0.3 });
  D.radar(g, { x: 790, y: 370, r: 170, blips: [[0.5, 0.6], [2.4, 0.4]], label: 'HURRICANE', t, start: 0.2 });
  D.mapPins(g, { x: 1290, y: 320, w: 460, h: 300, pins: 24, label: 'POTHOLES', t, start: 0.3 });
  D.usMap(g, { x: 1660, y: 340, w: 420, dots: 14, t, start: 0.3 }); D.globe(g, { x: 1660, y: 680, r: 130, t, start: 0.4 });
  D.seismo(g, { x: 800, y: 760, w: 860, h: 170, amp: 0.85, spikeAt: 0.6, label: 'MAGNITUDE 1', t, start: 0.4 });
  D.thermometer(g, { x: 1330, y: 720, h: 240, t, start: 0.5 }); D.arrow(g, { from: [300, 880], to: [1200, 930], bend: -0.1, dashed: true, t, start: 0.6, dur: 1 });
} });
registerShot('screens', { kind: '2d', draw(g, t) {
  D.stage2d(g, { floor: false });
  D.phoneChat(g, { x: 280, y: 545, h: 780, title: 'THE BOYS', msgs: [{ str: 'look outside' }, { me: true, str: 'why' }, { str: 'bro. the whole street is watching' }], t });
  D.phoneStat(g, { x: 730, y: 545, h: 640, head: 'VIEWS', value: '2,000,000', t, start: 0.2 });
  D.videoFrame(g, { x: 1370, y: 330, w: 800, views: '10,092,021', p: 0.4, t, start: 0.2 });
  D.videoFrame(g, { x: 1370, y: 760, w: 800, h: 360, live: true, viewers: 1824, p: 0.8, t, start: 0.4 });
  UI.chatPanel(g, { x: 1480, y: 600, w: 260, lines: [['dev', 'NO WAY'], ['sam', 'CLIP IT'], ['kay', 'GG']], t });
} });
registerShot('lists', { kind: '2d', draw(g, t) {
  D.stage2d(g, { floor: false });
  D.checklist(g, { x: 310, y: 560, s: 0.95, title: 'THE PLAN', items: ['SIT', 'TALK', 'BE COOL'], done: 2, t });
  D.scoreboard(g, { x: 880, y: 300, s: 0.8, head: 'COOL', value: 2, t, start: 0.2 }); D.scoreboard(g, { x: 880, y: 760, s: 0.7, left: ['HOME', 3], right: ['AWAY', 4], color: '#6ab8f2', t, start: 0.3 });
  D.progressRing(g, { x: 1330, y: 280, r: 96, p: 0.72, center: '3 MIN', label: 'AIR', t, start: 0.3 });
  D.jar(g, { x: 1640, y: 400, h: 330, p: 0.62, label: 'LUCK BANK', t, start: 0.3 }); D.meterBar(g, { x: 1290, y: 560, w: 360, p: 0.55, label: 'POWER', t, start: 0.4 });
  D.compare(g, { x: 1450, y: 810, w: 300, h: 220, gap: 30, left: 'GUYS', right: 'GIRLS', t, start: 0.4 });
} });
