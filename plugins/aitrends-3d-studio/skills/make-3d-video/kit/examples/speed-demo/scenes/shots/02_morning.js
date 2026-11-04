// 02_morning.js — s002 wake up, s003 alarm insert, s004 already dressed (afterimages from the bed).
import { E, V, registerShot, ease, prog, key, clamp } from '/engine/core.js';
import * as UI from '/engine/ui2d.js';
import { HERO } from '../cast.js';
import { bedroom } from '../sets/bedroom.js';

const stageOpts = (T, o = {}) => T.stage({ mood: 'interiorWarm', fov: V(40, 56), fog: [10, 40], keyPos: [3, 7, 2], keyColor: '#ffe2b8', keyIntensity: 1.2, ambient: 1.1, ...o });
const LYING = { y: -0.5, hips: [-90, 0, 0], armL: [10, 25, 20, 0], armR: [10, 25, 20, 0], legL: [0, 4, 4, 0], legR: [0, 4, 4, 0] };
const alarmScreen = (g, W, H, t) => {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a1c5a'); gr.addColorStop(1, '#e0603a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const pulse = 0.5 + 0.5 * Math.sin(t * 18);
  g.fillStyle = `rgba(255,255,255,${0.15 + 0.25 * pulse})`; g.beginPath(); g.arc(W / 2, H * 0.72, W * (0.22 + 0.04 * pulse), 0, 7); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `700 ${W * 0.36}px Fredoka`; g.fillText('7:00', W / 2, H * 0.36);
  g.font = `900 ${W * 0.1}px Nunito`; g.fillText('ALARM', W / 2, H * 0.48);
  g.fillStyle = '#ff5a6a'; g.beginPath(); g.arc(W / 2, H * 0.72, W * 0.13, 0, 7); g.fill();
};

registerShot('s002', {
  init(T) {
    const st = stageOpts(T); const room = bedroom(T, st);
    const hero = st.add(T.character(HERO, { pose: LYING }).place(-1.5, 0.52, -1.45, 0));
    const phone = st.add(T.W.phone({ draw: alarmScreen })); phone.position.set(...room.standTop); phone.rotation.x = -Math.PI / 2; phone.rotation.z = 0.3;
    return { st, hero, phone };
  },
  draw(s, t, info, T) {
    const awake = t > 1.05; s.hero.pose(LYING).face({ expr: awake ? 'surprised' : 'sleepy', look: [0, 0.6] });
    s.phone.screen.update(t);
    T.dolly(s.st.camera, t, [[0, { pos: [-0.9, 2.3, -0.9], look: [-1.5, 0.72, -2.15] }], [info.dur, { pos: [-1.05, 2.05, -1.25], look: [-1.5, 0.72, -2.2] }]]);
  },
  overlay(g, t) { UI.readout(g, { label: 'TIME', value: '7:00 AM', x: V(120, 90), y: V(E.H - 140, E.H * 0.7), a: clamp(t / 0.3) }); },
});
registerShot('s003', {
  init(T) {
    const st = stageOpts(T, { dof: { focus: 0.5, aperture: 0.012, maxblur: 0.012 } }); const room = bedroom(T, st);
    const phone = st.add(T.W.phone({ draw: alarmScreen, power: 1.4 })); phone.position.set(...room.standTop); phone.rotation.x = -Math.PI / 2; phone.rotation.z = 0.3;
    const ring = T.FX3.shockwave(st, { pos: [room.standTop[0], room.standTop[1] + 0.004, room.standTop[2]], c: '#ffd0a0', r0: 0.08, r1: 0.35, dur: 0.6 });
    return { st, phone, ring, base: room.standTop };
  },
  draw(s, t, info, T) {
    const [x, y, z] = s.base; const buzz = Math.sin(t * 70) * 0.004;
    s.phone.position.set(x + buzz, y, z + buzz * 0.5); s.phone.rotation.z = 0.3 + Math.sin(t * 55) * 0.03; s.phone.screen.update(t);
    s.ring.update(t % 0.6);
    T.dolly(s.st.camera, t, [[0, { pos: [x + 0.32, y + 0.3, z + 0.36], look: [x, y, z] }], [info.dur, { pos: [x + 0.22, y + 0.22, z + 0.26], look: [x, y, z] }]]);
    s.st.focusOn([x, y, z]);
  },
});
registerShot('s004', {
  init(T) {
    const st = stageOpts(T); bedroom(T, st);
    const hero = st.add(T.character(HERO).place(0.2, 0, -0.2, 0.25));
    const echo = T.FX3.ghosts(st, HERO, 6, { c: '#7fb8ff', opacity: 0.4, gap: 0.04 });
    const puff = T.FX3.burst(st, { pos: [-1.2, 0.8, -1.4], colors: ['#e8e0f0', '#c8d8ff'], speed: [1, 3], gravity: 2, t0: 0.05, dur: 1.2, size: 0.04, n: 50 });
    return { st, hero, echo, puff };
  },
  draw(s, t, info, T) {
    // first 0.3 s: a blur of afterimages from the bed to where he stands
    const pathAt = (tt) => { const k = ease.out(clamp(tt / 0.3)); return { pos: [-1.5 + 1.7 * k, 0.5 * (1 - k), -1.45 + 1.25 * k], yaw: 0.25, pose: k < 1 ? T.walkPose3(tt * 40, { sprint: true }) : 'confident' }; };
    s.echo.update(t, (tt) => (tt < 0 || tt > 0.45 ? null : pathAt(tt))); s.puff.update(t);
    s.hero.pose(t < 0.3 ? pathAt(t).pose : T.breathe3('confident', t)); const p = pathAt(t).pos; s.hero.position.set(...p);
    s.hero.face({ expr: t < 0.5 ? 'determined' : 'smug', t, blink: true });
    T.dolly(s.st.camera, t, [[0, { pos: [1.6, 1.3, 2.6], look: [0, 1.15, -0.4] }], [info.dur, { pos: [1.2, 1.35, 2.0], look: [0.1, 1.3, -0.3] }]]);
  },
  mblur: 2,
});
