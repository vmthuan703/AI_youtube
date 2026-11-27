// engine/school10.js — 1.0.1 American high school (exposed as T.W.* through world3d.js). Each set builds into the stage and
// returns anchors ([x, z, yaw] spots for people, seats at hip height 0.42 unless noted), built like places10.js with the 1.0 look
// (mirror floors, light shafts, AO strips, sky dome). With school3d.js (lockerHall, cafeteria, schoolFront, schoolBus, busStop,
// busInside, court, schoolYard), T.W.gym, T.W.classroom and T.W.stairwell this covers a whole US high-school story.
//
//   const l = T.W.library(st)         // tall shelves, long tables with green lamps, computers, the librarian's desk; l.seat(table, side, i), l.aisle(i), l.desk
//   const c = T.W.chemLab(st)         // black lab benches with gas taps and sinks, fume hood, safety shower; c.station(i) [x,z,yaw] stand spot, c.teacher, c.flask
//   const a = T.W.auditorium(st)      // stage (top y a.stageY) with red curtains and spotlights, raked seats; a.seat(row, i), a.stage(x), a.podium, a.spots
//   const f = T.W.footballField(st)   // Friday-night field: yard lines, aluminium bleachers with a crowd, scoreboard, goalposts; f.sideline(i), f.bleacher(row, i), f.board
//   const r = T.W.lockerRoom(st)      // lockers round the walls, benches, shower bay; r.bench(i) → [x, z, yaw], r.locker(i)
//   const b = T.W.bandRoom(st)        // three curved risers with chairs and music stands, drums, piano, podium; b.seat(row, i), b.podium, b.piano
//   const p = T.W.principalOffice(st) // big desk, flag, trophy case, frosted door, blinds; p.principal, p.guest(i), p.door
//   const d = T.W.detention(st)       // the classroom after school: board says DETENTION, low gold sun, a teacher reading the paper; anchors = classroom's
//   const n = T.W.nurseOffice(st)     // exam bed with paper, curtain, red-cross cabinet, eye chart, scale; n.bed = [x, z, yaw, y] (pose 'sit' at y 0.3 on the edge), n.nurse
//   const w = T.W.restroom(st)        // sinks under a long wall mirror (real reflection), stalls; w.sink(i) → [x, z, yaw] facing the mirror
//   const s = T.W.studentLot(st)      // parking lot: student cars, a pickup, a row of yellow buses, the school behind; s.car(i), s.busDoor, s.walk
//                                     // o: { wet, buses, cars, gap: [x0, x1] (no cars there: room for the camera), school }
//   const h = T.W.promHall(st)        // the gym dressed for prom: balloon arch, banner, disco ball with moving spots, string lights; h.floor, h.arch, h.punch
//   const k = T.W.dinerUS(st)         // 50s diner by the school: booths, counter stools, jukebox, neon, milkshakes; k.booth(i, side), k.stool(i), k.jukebox
//   const u = T.W.suburbStop(st)      // suburban corner: porch houses, mailboxes, a stop sign and the yellow bus; u.stop, u.busDoor, u.porch(i)
// Props: bookcase, bankerLamp, labBench, beaker, trophyCase, usFlag, bleachers, scoreboard, goalPost, musicStand, drumKit, piano, examBed, mailbox,
//        stopSign, pickup, jukebox, discoBall, balloon, balloonArch, paSpeaker, testPaper, tray, milkshake, umbrella, gradCap, football, pompom,
//        newspaper, ballotBox, sinkUnit, bell (rings), LETTERMAN (outfit fields for a varsity jacket: { ...STUDENT, ...T.W.LETTERMAN }).
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { shade, mix, rng, clamp, lerp } from './core.js';
import { LEGACY, mat, box, rbox, cyl, sphere, plane, group, at, canvasTex, lamp, glow, glowMat, textTex, ground, cone, torus, tiles, planks, asphalt, screen, cached, contactShadow, spot, lightCone, carpet } from './kit3d.js';
import { tree, bench, chair, table, desk, book, plant, poster, trashCan, wallClock, bulletinBoard, door as doorProp, curtain, car, house, crowd, cup, gym, streetLamp } from './world3d.js';
import { mirror, skyDome, shafts, aoStrip, stringLights } from './look10.js';
import { classroom } from './places10.js';
import { schoolBus, lockerHall } from './school3d.js';

const PI = Math.PI, R2 = PI / 2, SEAT = 0.42;
const sign = (txt, w, h, bg, fg, size = 64, font = 'Nunito') => mat('#ffffff', { map: textTex(txt, { w: 512, h: Math.max(32, Math.round(512 * h / w)), bg, color: fg, size, font }), rough: 0.6 });
const glowSign = (txt, w, h, bg, fg, size = 64, power = 1.3) => new THREE.MeshBasicMaterial({ map: textTex(txt, { w: 512, h: Math.max(32, Math.round(512 * h / w)), bg, color: fg, size, font: 'Nunito', glow: 12 }), color: new THREE.Color(power, power, power), toneMapped: false });
const isNight = (st) => /night|storm|dusk|arctic/.test(st.moodName);
const put = (st, obj, x, z, yaw = 0, y = 0, cs = true) => { obj.position.set(x, y, z); obj.rotation.y = yaw; st.add(obj); if (cs && y < 0.2) st.add(contactShadow(obj)); return obj; };
function shell(st, w, d, h, o = {}) {
  const wm = mat(o.wall, { rough: 0.92, map: o.wallTex || null });
  st.add(ground(w + 0.4, d + 0.4, o.floor, o.floorTex, { rough: o.floorRough ?? 0.6 }));
  st.add(box(w + 0.4, h, 0.2, wm, 0, h / 2, -d / 2 - 0.1)); if (o.front !== false) st.add(box(w + 0.4, h, 0.2, wm, 0, h / 2, d / 2 + 0.1));
  for (const sx of [-1, 1]) if (o['side' + sx] !== false) st.add(box(0.2, h, d + 0.4, wm, sx * (w / 2 + 0.1), h / 2, 0));
  if (o.ceiling !== false) st.add(box(w + 0.4, 0.12, d + 0.4, mat(shade(o.wall, 0.1), { rough: 1 }), 0, h + 0.06, 0));
  const trim = shade(o.wall, -0.32); st.add(box(w, 0.1, 0.03, trim, 0, 0.05, -d / 2 + 0.015)); for (const sx of [-1, 1]) st.add(box(0.03, 0.1, d, trim, sx * (w / 2 - 0.015), 0.05, 0));
  aoStrip(st, { from: [-w / 2, 0, -d / 2], to: [w / 2, 0, -d / 2] }); aoStrip(st, { from: [-w / 2, 0, d / 2], to: [-w / 2, 0, -d / 2], yaw: R2 }); aoStrip(st, { from: [w / 2, 0, -d / 2], to: [w / 2, 0, d / 2], yaw: -R2 });
}
// a window on a wall: daylight glow at day, deep blue at night, with a frame and cross bars
function windowPane(w, h, night, frameC = '#e8e2d8') {
  const sky = new THREE.MeshBasicMaterial({ color: new THREE.Color(night ? '#1c2450' : '#d8ecff').multiplyScalar(night ? 1 : 1.15), toneMapped: false });
  const fm = mat(frameC, { rough: 0.5 }), g = group(plane(w, h, sky));
  g.add(box(w + 0.1, 0.06, 0.06, fm, 0, h / 2, 0.02), box(w + 0.1, 0.06, 0.06, fm, 0, -h / 2, 0.02), box(0.06, h, 0.06, fm, -w / 2, 0, 0.02), box(0.06, h, 0.06, fm, w / 2, 0, 0.02), box(0.04, h, 0.04, fm, 0, 0, 0.02), box(w, 0.04, 0.04, fm, 0, 0, 0.02));
  return g;
}
const fluoro = (st, w, d, h, stepX = 2.4, stepZ = 2.6, c = '#f4fbff', power = 1.3) => { for (let x = -w / 2 + stepX / 2; x < w / 2; x += stepX) for (let z = -d / 2 + stepZ / 2; z < d / 2; z += stepZ) st.add(box(1.2, 0.04, 0.5, glowMat(c, power), x, h - 0.03, z)); };
const lights = (st, list, c, power, dist, o = {}) => list.map(([x, y, z], i) => { const L = lamp(c, power, dist, { bulb: false, shadow: i === 0 && o.shadow !== false, ...o }); L.position.set(x, y, z); st.add(L); return L.light; });

// ================================================================ props
// book spines painted on a canvas, many colours, a few leaning
const spineTex = (seed) => cached('spines' + seed, () => canvasTex(512, 512, (g, W, H) => { const r = rng(seed); g.fillStyle = '#3a2a22'; g.fillRect(0, 0, W, H);
  const rows = 5, rh = H / rows; for (let j = 0; j < rows; j++) { let x = 4; while (x < W - 10) { const bw = 10 + r() * 16, bh = rh * (0.62 + r() * 0.3), c = ['#8a2a2a', '#2a4a7a', '#3a6a3a', '#c89a3a', '#5a3a6a', '#d8d0c0', '#2a2a30', '#a8582a', '#4a7a8a'][(r() * 9) | 0];
    g.fillStyle = c; g.fillRect(x, (j + 1) * rh - 8 - bh, bw, bh); g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(x + 2, (j + 1) * rh - 8 - bh * 0.7, bw - 4, 3); g.fillRect(x + 2, (j + 1) * rh - 8 - bh * 0.25, bw - 4, 2); x += bw + 1 + (r() < 0.08 ? 14 : 0); }
    g.fillStyle = '#5a3a2a'; g.fillRect(0, (j + 1) * rh - 8, W, 8); } }));
// bookcase({ len, h, d, color, seed, double }) — open wooden shelving full of books; double: books on both faces (a free-standing stack)
export function bookcase(o = {}) {
  const L = o.len || 3, h = o.h || 2.2, d = o.d || 0.45, m = mat(o.color || '#6a4a32', { rough: 0.6, clearcoat: 0.2 });
  const g = group(box(L, 0.08, d, m, 0, 0.04, 0), box(L, 0.05, d, m, 0, h, 0), box(L, h, 0.03, m, 0, h / 2, 0)); for (const sx of [-1, 1]) g.add(box(0.05, h, d, m, sx * L / 2, h / 2, 0));
  for (const sz of o.double ? [-1, 1] : [1]) { const t = spineTex((o.seed || 1) * 2 + (sz > 0 ? 0 : 1)).clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping; t.repeat.set(L / 1.6, 1);
    const f = plane(L - 0.06, h - 0.12, mat('#ffffff', { map: t, rough: 0.8 }), 0, 0.08 + (h - 0.12) / 2, sz * (d / 2 - 0.04)); if (sz < 0) f.rotation.y = PI; g.add(f); }
  return g;
}
// green banker's lamp (a real light unless light: false)
export function bankerLamp(o = {}) {
  const g = group(cyl(0.08, 0.09, 0.02, mat('#c8a050', { metal: 0.8, rough: 0.3 }), 0, 0.01, 0, 16), cyl(0.01, 0.01, 0.3, mat('#c8a050', { metal: 0.8 }), 0, 0.16, 0, 6));
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.12, 0.09, 20, 1, true, 0, PI), mat('#1f6a3a', { clearcoat: 0.8, rough: 0.2, side: THREE.DoubleSide })); sh.rotation.z = R2; sh.rotation.y = R2; sh.position.set(0, 0.32, 0); g.add(sh);
  g.add(at(glow('#ffe0a0', 0.22, 0.45), 0, 0.27, 0.03)); if (o.light !== false) { const L = lamp('#ffe0a8', o.intensity ?? 1.4, 2.4, { bulb: false, decay: 1.6 }); L.position.set(0, 0.25, 0.05); g.add(L); }
  return g;
}
// labBench({ len, sinks, taps }) — black resin top on white cabinets, gas taps, a sink at one end. Top at 0.92.
export function labBench(o = {}) {
  const L = o.len || 3, d = o.d || 1.0, top = mat('#16161c', { rough: 0.18, clearcoat: 0.8 }), cab = mat(o.cabinet || '#e8e4dc', { rough: 0.55 }), steel = mat('#c8ccd4', { metal: 0.85, rough: 0.25 });
  const g = group(box(L - 0.1, 0.86, d - 0.1, cab, 0, 0.43, 0), box(L, 0.06, d, top, 0, 0.89, 0));
  for (let i = 0; i < Math.floor(L / 0.6); i++) g.add(box(0.5, 0.7, 0.01, mat(shade(o.cabinet || '#e8e4dc', -0.08)), -L / 2 + 0.35 + i * 0.6, 0.45, d / 2 - 0.045), box(0.12, 0.015, 0.02, steel, -L / 2 + 0.35 + i * 0.6, 0.72, d / 2 - 0.03));
  for (let i = 0; i < (o.taps ?? 2); i++) { const x = -L / 2 + 0.6 + i * (L - 1.2) / Math.max(1, (o.taps ?? 2) - 1); g.add(cyl(0.015, 0.015, 0.16, steel, x, 1.0, 0, 8), at(cyl(0.01, 0.01, 0.08, steel, 0, 0, 0, 6), x, 1.07, 0.04).rotateX(R2), sphere(0.02, mat('#e8a020', { keepSat: true }), x, 1.09, 0)); }
  if (o.sinks !== false) { g.add(box(0.4, 0.02, 0.35, mat('#2a2a30', { metal: 0.4, rough: 0.3 }), L / 2 - 0.35, 0.925, 0)); const f = group(cyl(0.012, 0.012, 0.35, steel, 0, 0.17, 0, 8), at(cyl(0.012, 0.012, 0.18, steel, 0, 0, 0, 8), 0, 0.35, 0.08).rotateX(R2)); f.position.set(L / 2 - 0.35, 0.92, -0.25); g.add(f); }
  g.topY = 0.92; return g;
}
// beaker / flask with coloured liquid; glow: true makes the liquid self-lit (a bubbling reaction)
export function beaker(o = {}) {
  const gl = mat('#e8f4ff', { rough: 0.05, metal: 0.1, transparent: true, opacity: 0.3, clearcoat: 1 }), c = o.color || '#3ad08a';
  const liq = o.glow ? glowMat(c, 1.5, { transparent: true, opacity: 0.9 }) : mat(c, { keepSat: true, rough: 0.2, transparent: true, opacity: 0.85 });
  const g = o.flask ? group(sphere(0.07, gl, 0, 0.08, 0, 16, 12), cyl(0.02, 0.02, 0.12, gl, 0, 0.19, 0, 10), sphere(0.062, liq, 0, 0.07, 0, 14, 10)) : group(cyl(0.05, 0.05, 0.14, gl, 0, 0.07, 0, 16), cyl(0.046, 0.046, 0.08, liq, 0, 0.042, 0, 16));
  if (o.glow) { g.add(at(glow(c, 0.4, 0.7), 0, 0.1, 0)); g.userData.dynamic = true; } return g;
}
// trophyCase({ w }) — glass-front cabinet with gold cups and plaques, lit inside
export function trophyCase(o = {}) {
  const w = o.w || 2, wood = mat('#4a2e22', { rough: 0.5, clearcoat: 0.4 }), gold = mat('#e8b84a', { metal: 0.95, rough: 0.22, keepSat: true }), r = rng(o.seed || 9);
  const g = group(box(w, 0.8, 0.5, wood, 0, 0.4, 0), box(w, 0.06, 0.5, wood, 0, 2.2, 0), box(w, 1.4, 0.03, mat('#2a1a14'), 0, 1.5, -0.23)); for (const sx of [-1, 1]) g.add(box(0.05, 1.4, 0.5, wood, sx * w / 2, 1.5, 0));
  for (const y of [0.82, 1.3, 1.78]) { g.add(box(w - 0.1, 0.02, 0.44, mat('#e8f0f4', { transparent: true, opacity: 0.4, rough: 0.05 }), 0, y, 0)); for (let x = -w / 2 + 0.25; x < w / 2 - 0.15; x += 0.32 + r() * 0.1) {
    const s = 0.7 + r() * 0.6; if (r() < 0.7) g.add(group(cyl(0.05 * s, 0.03 * s, 0.03, gold, 0, 0.015, 0, 12), cyl(0.015 * s, 0.015 * s, 0.1 * s, gold, 0, 0.08 * s, 0, 8), cyl(0.07 * s, 0.03 * s, 0.12 * s, gold, 0, 0.18 * s, 0, 16)).translateX(x).translateY(y + 0.01));
    else g.add(at(box(0.16, 0.2, 0.02, mat('#2a1a14'), 0, 0.1, 0), x, y + 0.01, -0.1).add(box(0.1, 0.12, 0.005, gold, 0, 0.1, 0.012))); } }
  g.add(box(w - 0.06, 1.38, 0.01, mat('#dff0ff', { transparent: true, opacity: 0.14, rough: 0.02, clearcoat: 1 }), 0, 1.5, 0.245), box(w - 0.1, 0.03, 0.03, glowMat('#fff2d0', 1.4), 0, 2.15, 0.1));
  const L = lamp('#fff0d0', 1.2, 2.4, { bulb: false }); L.position.set(0, 2.0, 0.1); g.add(L); return g;
}
// usFlag({ h }) — on a pole with a gold eagle-ball top; flag drawn on a canvas (stripes + blue canton with stars)
const flagTex = () => cached('usflag', () => canvasTex(380, 200, (g, W, H) => { for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#f4f2ee' : '#b8283a'; g.fillRect(0, (i * H) / 13, W, H / 13 + 1); }
  g.fillStyle = '#2a3a6e'; g.fillRect(0, 0, W * 0.4, H * 7 / 13); g.fillStyle = '#f4f2ee'; for (let j = 0; j < 9; j++) for (let i = 0; i < (j % 2 ? 5 : 6); i++) { g.beginPath(); g.arc(10 + i * 25 + (j % 2 ? 12 : 0), 8 + j * 11.5, 2.6, 0, 7); g.fill(); } }));
export function usFlag(o = {}) {
  const h = o.h || 2.3, m = mat('#c8a050', { metal: 0.8, rough: 0.3 });
  const geo = new THREE.PlaneGeometry(0.9, 0.5, 12, 4), P = geo.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i) + 0.45; P.setZ(i, Math.sin(x * 7) * 0.04 * x); P.setY(i, P.getY(i) - x * x * 0.25); } geo.computeVertexNormals();
  const f = new THREE.Mesh(geo, mat('#ffffff', { map: flagTex(), rough: 0.85, side: THREE.DoubleSide })); f.position.set(0.47, h - 0.4, 0); f.castShadow = true;
  return group(cyl(0.015, 0.015, h, m, 0, h / 2, 0, 8), sphere(0.035, m, 0, h + 0.02, 0, 10, 8), cyl(0.18, 0.2, 0.06, mat('#2a2a30'), 0, 0.03, 0, 16), f);
}
// bleachers({ len, rows, crowd }) — aluminium plank seating on a steel frame; crowd: number of instanced fans (cheer animates)
export function bleachers(o = {}) {
  const L = o.len || 20, rows = o.rows || 8, step = 0.75, rise = 0.42, al = mat('#c8ccd4', { metal: 0.8, rough: 0.32 }), fr = mat('#5a5e68', { metal: 0.5, rough: 0.5 });
  const g = group(); for (let i = 0; i < rows; i++) { const y = rise * (i + 1), z = -i * step; g.add(box(L, 0.05, 0.3, al, 0, y, z - 0.15), box(L, 0.04, 0.25, al, 0, y - 0.32, z - 0.5)); }
  for (let x = -L / 2; x <= L / 2 + 0.01; x += 3) { const len = Math.hypot(rows * rise, rows * step), b = box(0.08, len, 0.08, fr, x, rows * rise / 2, -rows * step / 2); b.rotation.x = Math.atan2(rows * step, rows * rise); g.add(b, box(0.08, rows * rise, 0.08, fr, x, rows * rise / 2, -rows * step + 0.1)); }
  g.add(box(L, 1.0, 0.04, mat('#5a5e68', { metal: 0.4, rough: 0.5 }), 0, rows * rise + 0.5, -rows * step + 0.05));
  if (o.crowd) { const pos = [], r = rng(o.seed || 3); for (let i = 0; i < o.crowd; i++) { const row = Math.floor(r() * rows); pos.push([(r() - 0.5) * (L - 1), -row * step - 0.2, row]); }
    const c = crowd({ positions: pos.map(p => [p[0], p[1]]), seed: o.seed || 3, cheer: o.cheer ?? 0.4, colors: o.colors, s: 0.9, turn: 0.4, rise: rise / step, riseFrom: 0, y0: rise * 0.9 }); g.add(c); g.crowd = c; }
  g.seat = (row, x = 0) => [x, rise * (row + 1) + 0.03, -row * step - 0.15]; g.rows = rows; g.step = step; g.rise = rise; return g;
}
// scoreboard({ home, guest, homeName, guestName, quarter, clock }) — a lit board on two posts (12 m high)
export function scoreboard(o = {}) {
  const draw = (g, W, H) => { g.fillStyle = '#0c0c10'; g.fillRect(0, 0, W, H); g.fillStyle = '#f2b632'; g.font = '900 54px "Nunito"'; g.textAlign = 'center'; g.fillText(o.homeName || 'EAGLES', W * 0.25, 70); g.fillText(o.guestName || 'GUEST', W * 0.75, 70);
    g.fillStyle = '#ff4a2a'; g.font = '900 150px "Nunito"'; g.fillText(String(o.home ?? 21), W * 0.25, 230); g.fillText(String(o.guest ?? 14), W * 0.75, 230); g.fillStyle = '#ffe8c0'; g.font = '800 44px "Nunito"'; g.fillText('QTR ' + (o.quarter || 4) + '    ' + (o.clock || '0:12'), W / 2, 300); };
  const sc = screen(6, 3, draw); return group(box(6.4, 3.4, 0.4, mat('#1a2a4a', { rough: 0.5 }), 0, 9.5, -0.22), at(sc, 0, 9.5, 0.01), box(0.3, 8, 0.3, mat('#5a5e68', { metal: 0.5 }), -2.5, 4, -0.4), box(0.3, 8, 0.3, mat('#5a5e68', { metal: 0.5 }), 2.5, 4, -0.4), at(plane(6.4, 0.6, sign(o.top || 'HOME OF THE EAGLES', 6.4, 0.6, '#f2b632', '#1a2a4a', 70)), 0, 11.5, -0.01));
}
// goalPost() — the yellow Y-shaped American-football goal (crossbar 3.05 m, uprights 5.6 m apart)
export function goalPost(o = {}) { const y = mat(o.color || '#f2d02a', { keepSat: true, rough: 0.4, metal: 0.3 }); const g = group(cyl(0.08, 0.08, 3.05, y, 0, 1.52, -1.2, 10), at(cyl(0.07, 0.07, 1.2, y, 0, 0, 0, 10), 0, 3.05, -0.6).rotateX(R2), at(cyl(0.07, 0.07, 5.6, y, 0, 0, 0, 10), 0, 3.05, 0).rotateZ(R2));
  for (const sx of [-1, 1]) g.add(cyl(0.06, 0.06, 6, y, sx * 2.8, 6.05, 0, 10)); g.add(cyl(0.2, 0.2, 2, mat('#2a4a8a'), 0, 1, -1.2, 12)); return g; }
export function musicStand(o = {}) { const m = mat('#1a1a20', { metal: 0.5, rough: 0.4 }); const g = group(cyl(0.01, 0.01, 1.05, m, 0, 0.52, 0, 6), box(0.48, 0.32, 0.01, m, 0, 1.15, 0.03), box(0.42, 0.28, 0.005, mat('#f4f0e4'), 0, 1.16, 0.04)); g.children[1].rotation.x = -0.35; g.children[2].rotation.x = -0.35;
  for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2; g.add(at(cyl(0.006, 0.006, 0.3, m, 0, 0, 0, 4), Math.sin(a) * 0.12, 0.05, Math.cos(a) * 0.12).rotateX(Math.cos(a) * 1.2).rotateZ(-Math.sin(a) * 1.2)); } return g; }
export function drumKit(o = {}) { const sh = mat(o.color || '#b8283a', { keepSat: true, clearcoat: 0.8, rough: 0.2 }), hd = mat('#f2ece0', { rough: 0.6 }), cr = mat('#c8ccd4', { metal: 0.9, rough: 0.2 }), brass = mat('#d8b04a', { metal: 0.9, rough: 0.25 });
  const kick = cyl(0.28, 0.28, 0.4, sh, 0, 0.3, 0, 24); kick.rotation.x = R2; const g = group(kick, at(cyl(0.27, 0.27, 0.01, hd, 0, 0, 0, 24), 0, 0.3, 0.205).rotateX(R2));
  for (const [x, z, r, y] of [[-0.45, 0.2, 0.18, 0.62], [0.2, 0.15, 0.14, 0.78], [-0.1, 0.18, 0.13, 0.8], [0.55, 0.1, 0.2, 0.5]]) g.add(cyl(r, r, 0.18, sh, x, y, z, 20), cyl(r, r, 0.01, hd, x, y + 0.095, z, 20));
  for (const [x, z, y] of [[-0.75, 0.1, 1.1], [0.75, -0.1, 1.25]]) g.add(cyl(0.01, 0.01, y, cr, x, y / 2, z, 6), cyl(0.22, 0.2, 0.01, brass, x, y, z, 24)); return g; }
export function piano(o = {}) { const b = mat('#121216', { clearcoat: 1, rough: 0.12 }); const g = group(rbox(1.5, 1.3, 0.6, 0.03, b, 0, 0.65, 0), box(1.4, 0.04, 0.3, b, 0, 0.74, 0.42), box(1.3, 0.02, 0.18, mat('#f4f0e8', { rough: 0.3 }), 0, 0.77, 0.42));
  for (let i = 0; i < 18; i++) if (i % 7 !== 2 && i % 7 !== 6) g.add(box(0.035, 0.02, 0.1, b, -0.62 + i * 0.072 + 0.036, 0.79, 0.38)); g.add(box(0.4, 0.5, 0.35, b, 0, 0.25, 0.65)); return g; }
// examBed() — padded nurse's couch with the paper roll; sit spot hips at 0.72
export function examBed(o = {}) { const p = mat(o.color || '#5a8aa0', { rough: 0.45, clearcoat: 0.3 }), fr = mat('#c8ccd4', { metal: 0.6, rough: 0.35 });
  const g = group(box(0.7, 0.6, 1.8, fr, 0, 0.3, 0), rbox(0.72, 0.12, 1.85, 0.04, p, 0, 0.66, 0), box(0.5, 0.005, 1.8, mat('#f8f6f0', { rough: 0.9 }), 0, 0.725, 0.02), cyl(0.06, 0.06, 0.55, mat('#f8f6f0'), 0, 0.72, -0.9, 14).rotateZ(R2));
  const back = rbox(0.72, 0.1, 0.6, 0.04, p, 0, 0.82, -0.62); back.rotation.x = 0.5; g.add(back); return g; }
export function mailbox(o = {}) { const m = mat(o.color || '#2a3a5a', { metal: 0.4, rough: 0.4 }); const top = cyl(0.12, 0.12, 0.45, m, 0, 0, 0, 16, ); top.rotation.x = R2; top.scale.set(1, 1, 1);
  const g = group(box(0.07, 1.0, 0.07, mat('#f2ece0'), 0, 0.5, 0), box(0.24, 0.16, 0.45, m, 0, 1.08, 0), at(top, 0, 1.16, 0), box(0.02, 0.18, 0.06, mat('#d8343a', { keepSat: true }), 0.13, 1.25, -0.05)); return g; }
export function stopSign(o = {}) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.02, 8), mat('#ffffff', { map: textTex('STOP', { w: 256, h: 256, bg: '#c8202a', color: '#ffffff', size: 84, font: 'Nunito' }), rough: 0.5 }));
  s.rotation.x = R2; s.rotation.y = PI / 8; s.position.set(0, 2.2, 0.02); return group(cyl(0.03, 0.03, 2.2, mat('#a8acb8', { metal: 0.7 }), 0, 1.1, 0, 8), s); }
// pickup({ color }) — a full-size pickup truck, front = +x
export function pickup(o = {}) { const b = mat(o.color || '#8a2a2a', { rough: 0.3, metal: 0.4, clearcoat: 0.8 }), dk = mat('#18181e'), gl = mat('#1c2638', { rough: 0.05, metal: 0.4 }), cr = mat('#d8dce4', { metal: 0.9, rough: 0.15 });
  const g = group(rbox(5.6, 0.8, 2.0, 0.12, b, 0, 0.95, 0), rbox(1.9, 0.8, 1.9, 0.15, b, 0.7, 1.7, 0), box(1.7, 0.6, 1.92, gl, 0.75, 1.72, 0), box(2.3, 0.5, 1.9, dk, -1.6, 1.3, 0), box(0.06, 0.35, 1.9, cr, 2.82, 0.9, 0));
  for (const [x, z] of [[-1.8, 0.95], [-1.8, -0.95], [1.8, 0.95], [1.8, -0.95]]) { const w = cyl(0.42, 0.42, 0.3, dk, x, 0.42, z, 20); w.rotation.x = R2; g.add(w, at(cyl(0.22, 0.22, 0.32, cr, 0, 0, 0, 12), x, 0.42, z).rotateX(R2)); }
  for (const z of [-0.7, 0.7]) g.add(at(sphere(0.09, glowMat('#fff4d8', 1.6), 0, 0, 0, 10, 8), 2.82, 1.05, z)); return g; }
// jukebox() — rounded top with neon tubes and a lit glass panel (glows)
export function jukebox(o = {}) { const w = mat('#7a3a24', { clearcoat: 0.8, rough: 0.25 }); const arch = cyl(0.5, 0.5, 0.5, w, 0, 1.3, 0, 32, ); arch.rotation.x = R2;
  const g = group(rbox(1.0, 1.3, 0.5, 0.05, w, 0, 0.65, 0), arch, at(cyl(0.44, 0.44, 0.02, glowMat('#ff8a3a', 1.4), 0, 0, 0, 32), 0, 1.3, 0.26).rotateX(R2), box(0.6, 0.35, 0.02, glowMat('#ffe8b0', 1.3), 0, 0.95, 0.26));
  for (const c of ['#3ad0ff', '#ff3a8a']) for (const sx of [-1, 1]) g.add(box(0.05, 1.1, 0.03, glowMat(c, 1.8), sx * (c === '#3ad0ff' ? 0.44 : 0.36), 0.6, 0.26));
  g.add(at(glow('#ff9a5a', 1.6, 0.35), 0, 1.0, 0.4)); const L = lamp('#ffa060', 1.8, 3.5, { bulb: false }); L.position.set(0, 1.2, 0.6); g.add(L); return g; }
// discoBall() — mirrored ball; .spots(st, o) adds the moving light dots on walls and floor (ticks itself)
const discoTex = () => cached('disco', () => canvasTex(256, 128, (g, W, H) => { const r = rng(8); for (let y = 0; y < H; y += 8) for (let x = 0; x < W; x += 8) { const v = 120 + r() * 135; g.fillStyle = `rgb(${v},${v},${v + 10})`; g.fillRect(x, y, 7, 7); } }));
export function discoBall(o = {}) { const g = group(cyl(0.004, 0.004, o.drop ?? 0.6, '#111', 0, (o.drop ?? 0.6) / 2, 0, 4), sphere(o.r || 0.35, mat('#ffffff', { map: discoTex(), metal: 1, rough: 0.12 }), 0, 0, 0, 24, 16)); g.ball = g.children[1]; return g; }
export function balloon(o = {}) { const c = o.color || '#e83a6a'; const b = sphere(o.r || 0.18, mat(c, { keepSat: true, clearcoat: 1, rough: 0.15 }), 0, 0, 0, 16, 12); b.scale.y = 1.15; return group(b, cyl(0.002, 0.002, o.string ?? 0.6, '#ddd', 0, -(o.string ?? 0.6) / 2 - 0.2, 0, 3)); }
// balloonArch({ w, h, colors }) — a half-ring of clustered balloons on the floor (a prom entrance)
export function balloonArch(o = {}) { const w = o.w || 3.2, h = o.h || 2.8, cols = o.colors || ['#f2b632', '#ffffff', '#2a3a8a', '#c8c8d8'], g = group(), r = rng(o.seed || 5); let k = 0;
  for (let i = 0; i <= 34; i++) { const a = (i / 34) * PI, x = Math.cos(a) * w / 2, y = Math.sin(a) * h; for (let j = 0; j < 3; j++) { const b = sphere(0.16 + r() * 0.04, mat(cols[k++ % cols.length], { keepSat: true, clearcoat: 1, rough: 0.15 }), x + (r() - 0.5) * 0.2, y + (r() - 0.5) * 0.2, (j - 1) * 0.16, 14, 10); g.add(b); } } return g; }
export function paSpeaker() { const g = group(rbox(0.32, 0.22, 0.14, 0.03, mat('#d8d4cc', { rough: 0.5 }), 0, 0, 0)); for (let i = 0; i < 5; i++) g.add(box(0.24, 0.012, 0.01, mat('#4a4a52'), 0, -0.07 + i * 0.035, 0.072)); return g; }
// testPaper({ grade, name }) — a marked test sheet with a big red letter grade (lies flat; stand it up with rotation.x)
export function testPaper(o = {}) { const tex = canvasTex(256, 330, (g, W, H) => { g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a2a3a'; g.font = '700 16px "Nunito"'; g.fillText(o.title || 'CHEMISTRY  UNIT 4 TEST', 16, 30); g.fillText('Name: ' + (o.name || 'Alex'), 16, 54);
    g.fillStyle = '#9aa0b8'; for (let i = 0; i < 12; i++) g.fillRect(16, 80 + i * 19, 120 + ((i * 37) % 90), 4); g.strokeStyle = '#d8202a'; g.lineWidth = 6; g.fillStyle = '#d8202a'; g.font = '900 96px "Nunito"'; g.fillText(o.grade || 'F', W - 92, 120); g.beginPath(); g.arc(W - 62, 88, 56, 0, 7); g.stroke();
    g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(170, 96 + i * 38); g.lineTo(190, 116 + i * 38); g.moveTo(190, 96 + i * 38); g.lineTo(170, 116 + i * 38); g.stroke(); } });
  const p = plane(0.21, 0.27, mat('#ffffff', { map: tex, rough: 0.9, side: THREE.DoubleSide })); p.rotation.x = -R2; p.position.y = 0.002; return group(p); }
// tray({ food }) — a cafeteria tray with a meal (hold it: ch.hold(T.W.tray(), 'L', { pos: [...] }) or holdTray pose)
export function tray(o = {}) { const g = group(rbox(0.42, 0.025, 0.3, 0.01, mat(o.color || '#d86a3a', { rough: 0.4 }), 0, 0, 0)); if (o.food !== false) g.add(cyl(0.08, 0.08, 0.02, mat('#f4ece0'), -0.1, 0.022, 0, 16), sphere(0.05, mat('#d8a040'), -0.1, 0.04, 0, 10, 6), box(0.07, 0.11, 0.05, mat('#f4f4f4'), 0.1, 0.07, -0.05), box(0.09, 0.03, 0.1, mat('#3a9a4a'), 0.1, 0.03, 0.08)); return g; }
export function milkshake(o = {}) { return group(cyl(0.05, 0.035, 0.18, mat('#e8f4ff', { transparent: true, opacity: 0.4, clearcoat: 1, rough: 0.05 }), 0, 0.09, 0, 16), cyl(0.045, 0.033, 0.15, mat(o.color || '#f2a0b8', { rough: 0.5 }), 0, 0.08, 0, 16), sphere(0.05, mat('#fbf8f4', { rough: 0.6 }), 0, 0.19, 0, 12, 8), sphere(0.018, mat('#c8102a', { clearcoat: 1, rough: 0.1 }), 0, 0.245, 0, 8, 6), at(cyl(0.006, 0.006, 0.2, mat('#e83a5a'), 0, 0, 0, 6), 0.02, 0.24, 0).rotateZ(0.2)); }
// umbrella({ color, open }) — held in a fist: ch.hold(T.W.umbrella(), 'R', { pos: [0, -0.02, 0] }) with the 'holdUmbrella' pose
export function umbrella(o = {}) { const c = o.color || '#2a3a8a', open = o.open ?? 1; const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.62 * (0.25 + 0.75 * open), 0.32 + 0.5 * (1 - open), 8, 1, true), mat(c, { keepSat: true, rough: 0.35, clearcoat: 0.6, side: THREE.DoubleSide }));
  canopy.position.y = 0.9; canopy.castShadow = true; return group(cyl(0.008, 0.008, 0.95, mat('#2a2a30', { metal: 0.6 }), 0, 0.45, 0, 6), canopy, torus(0.03, 0.008, mat('#2a2a30'), -0.03, -0.01, 0)); }
export function gradCap(o = {}) { const c = mat(o.color || '#1a1a2a', { rough: 0.5 }); return group(cyl(0.11, 0.11, 0.07, c, 0, 0.035, 0, 16), box(0.32, 0.015, 0.32, c, 0, 0.075, 0), cyl(0.002, 0.002, 0.12, mat(o.tassel || '#f2b632', { keepSat: true }), 0.12, 0.02, 0.12, 4), sphere(0.012, mat(o.tassel || '#f2b632', { keepSat: true }), 0, 0.085, 0, 6, 4)); }
export function football(o = {}) { const b = sphere(0.09, mat('#7a3a1a', { rough: 0.55 }), 0, 0, 0, 16, 12); b.scale.set(1, 0.62, 0.62); return group(b, box(0.08, 0.004, 0.01, mat('#ffffff'), 0, 0.056, 0)); }
export function pompom(o = {}) { const g = group(), m = mat(o.color || '#f2b632', { keepSat: true, metal: 0.6, rough: 0.3 }), r = rng(o.seed || 3); for (let i = 0; i < 40; i++) { const s = box(0.012, 0.18, 0.004, m, 0, 0, 0); s.position.set(0, 0.09, 0); const p = group(s); p.rotation.set(r() * PI * 2, r() * PI * 2, r() * PI * 2); g.add(p); } return g; }
export function newspaper(o = {}) { const t = canvasTex(256, 320, (g, W, H) => { g.fillStyle = '#ece8dc'; g.fillRect(0, 0, W, H); g.fillStyle = '#1a1a1a'; g.font = '900 30px "Nunito"'; g.fillText(o.title || 'THE DAILY', 20, 40); g.fillRect(16, 52, W - 32, 3); for (let i = 0; i < 26; i++) g.fillRect(16 + (i % 2) * 118, 70 + ((i / 2) | 0) * 18, 104, 5); });
  const p = plane(0.38, 0.46, mat('#ffffff', { map: t, rough: 0.95, side: THREE.DoubleSide })); return group(p); }
export function ballotBox(o = {}) { return group(box(0.4, 0.4, 0.3, mat('#2a3a8a', { rough: 0.5 }), 0, 0.2, 0), box(0.16, 0.01, 0.03, mat('#111'), 0, 0.401, 0), at(plane(0.36, 0.12, sign(o.text || 'VOTE!', 0.36, 0.12, '#f2b632', '#1a2a5a', 110)), 0, 0.22, 0.151)); }
export function sinkUnit(o = {}) { const w = o.w || 0.9; return group(box(w, 0.08, 0.55, mat('#e8e4dc', { rough: 0.2, clearcoat: 0.6 }), 0, 0.84, 0), box(0.42, 0.05, 0.32, mat('#f4f4f4', { rough: 0.15 }), 0, 0.86, 0.04), cyl(0.012, 0.012, 0.2, mat('#d8dce4', { metal: 0.9, rough: 0.15 }), 0, 0.98, -0.18, 8), box(w, 0.8, 0.04, mat('#c8c4bc'), 0, 0.4, -0.2)); }

// a varsity (letterman) jacket: spread into an outfit, e.g. T.character({ ...JOCK, ...T.W.LETTERMAN })
export const LETTERMAN = { top: 'jacket', color: '#2a3a8a', sleeves: '#f2ece0', patch: 'E', patchColor: '#f2b632', patchBg: '#2a3a8a', collar: '#f2b632' };
// bell(st, { pos, yaw, t0, dur }) — the class bell on a wall: the dome shakes and blurs while it rings (pair with a bell SFX)
export function bell(st, o = {}) { const g = group(cyl(0.05, 0.05, 0.06, mat('#3a3a42'), 0, 0, -0.03, 10), sphere(0.13, mat('#c8282a', { keepSat: true, clearcoat: 0.8, rough: 0.2, metal: 0.3 }), 0, 0, 0.04, 20, 12)); g.children[0].rotation.x = R2; g.children[1].scale.z = 0.5;
  g.position.set(...(o.pos || [0, 2.6, 0])); g.rotation.y = o.yaw ?? 0; g.userData.dynamic = true; st.add(g); const t0 = o.t0 ?? 0, dur = o.dur ?? 2.5, d = g.children[1], p0 = d.position.clone();
  const update = (t) => { const on = t >= t0 && t < t0 + dur; d.position.set(p0.x + (on ? Math.sin(t * 190) * 0.008 : 0), p0.y + (on ? Math.cos(t * 170) * 0.006 : 0), p0.z); }; update(0); st.onTick(update); return { obj: g, update, ringing: (t) => t >= t0 && t < t0 + dur }; }

// ================================================================ LIBRARY — tables in the middle (along x), shelves at the back and sides
export function library(st, o = {}) {
  const w = o.w || 14, d = o.d || 12, h = o.h || 3.6, night = isNight(st), wallC = o.wall || '#c8b89a';
  shell(st, w, d, h, { wall: wallC, floor: '#7a5a3a', floorTex: planks('#7a5a3a', 18, [w / 2.2, d / 2.2]), floorRough: 0.35 });
  st.add(at(ground(w * 0.55, d * 0.4, '#3a4a6a', carpet('#3a4a6a', [4, 3])), 0, 0.006, 0.5));
  for (let i = 0; i < 4; i++) put(st, bookcase({ len: w / 4 - 0.1, h: h - 0.4, seed: i + 1 }), -w / 2 + w / 8 + i * w / 4, -d / 2 + 0.26, 0, 0, false);
  for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) put(st, bookcase({ len: 3, h: 2.4, seed: 7 + i + (sx > 0 ? 3 : 0) }), sx * (w / 2 - 0.26), -d / 2 + 2.2 + i * 3.2, sx > 0 ? -R2 : R2, 0, false);
  const aisles = []; for (let i = 0; i < 3; i++) { const x = -w / 2 + 2.5 + i * 2.2; put(st, bookcase({ len: 2.6, h: 2.0, d: 0.5, seed: 20 + i, double: true }), x, -d / 2 + 2.4, R2); aisles.push(x + 1.1); }
  const seats = [], tz = [-0.2, 2.4]; for (let ti = 0; ti < tz.length; ti++) { const z = tz[ti]; put(st, table({ w: 3.4, d: 1.1, h: 0.76, color: '#7a4a2a' }), 2.2, z);
    for (let i = 0; i < 2; i++) { put(st, bankerLamp({ light: ti === 0 && i === 0 ? true : o.lamps !== false }), 0.72 + i * 2.96, z - 0.3, PI, 0.785, false); put(st, book({ color: ['#8a2a2a', '#2a4a7a', '#c89a3a'][i + ti] }), 1.6 + i * 1.6, z + 0.3, 0.3, 0.785, false); }
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { const x = 1.0 + i * 1.2, zz = z + side * 0.72; put(st, chair({ color: '#5a3a24' }), x, zz, side > 0 ? PI : 0); seats.push([x, zz, side > 0 ? PI : 0]); } }
  // computers along the right wall, the librarian's desk by the door
  for (let i = 0; i < 3; i++) { const z = d / 2 - 3.6 + i * 1.1; put(st, table({ w: 1.0, d: 0.6, color: '#d8d4cc' }), w / 2 - 0.5, z, -R2); st.add(at(screen(0.45, 0.3, (g, W, H) => { g.fillStyle = '#1a3a6a'; g.fillRect(0, 0, W, H); g.fillStyle = '#d8e8ff'; g.fillRect(16, 16, W - 32, 22); g.fillRect(16, 50, W * 0.6, 10); g.fillRect(16, 70, W * 0.5, 10); }), w / 2 - 0.5, 1.02, z, -R2)); }
  const dk = put(st, group(rbox(2.4, 1.05, 0.7, 0.04, mat('#6a3a24', { clearcoat: 0.5, rough: 0.3 }), 0, 0.52, 0), box(2.5, 0.05, 0.8, mat('#3a2a1a', { clearcoat: 0.6, rough: 0.2 }), 0, 1.07, 0), at(plane(1.2, 0.25, sign('CIRCULATION', 1.2, 0.25, '#2a3a2a', '#e8dcb0', 90)), 0, 0.8, 0.36)), -w / 2 + 2.5, d / 2 - 1.8, PI);
  put(st, plant({}), -w / 2 + 0.5, d / 2 - 0.5); put(st, wallClock({ time: o.clock || '2:40' }), 0, -d / 2 + 0.02, 0, h - 0.5, false); st.add(at(plane(1.6, 0.35, sign(o.sign || 'QUIET PLEASE', 1.6, 0.35, '#2a3a2a', '#e8dcb0', 90)), w / 2 - 0.02, 2.6, -1.5, -R2));
  // tall windows on the left with sun shafts across the tables
  for (let i = 0; i < 2; i++) { const wv = windowPane(1.4, 2.0, night); wv.position.set(-w / 2 + 0.02, 1.9, 1 + i * 2.4); wv.rotation.y = R2; st.add(wv); }
  const sunC = night ? '#a8b8ff' : '#ffe8c4'; st.add(spot(sunC, night ? 20 : 80, { pos: [-w / 2 - 1.5, 4, 2.2], target: [2, 0, 1.5], angle: 0.8, penumbra: 0.6, dist: 24 }));
  shafts(st, { pos: [-w / 2 + 0.1, 2.6, 1], dir: [0.82, -0.52, 0.1], len: 7, w: 1.2, h: 1.8, n: 2, gap: 2.4, along: [0, 0, 1], color: sunC, opacity: night ? 0.06 : 0.12, motes: 160 });
  lights(st, [[0, h - 0.4, -2], [0, h - 0.4, 3]], '#fff0dc', o.lamp ?? 3.5, 11); for (const x of [-3, 3]) for (const z of [-3, 1.5]) st.add(box(1.2, 0.04, 0.5, glowMat('#fff6e8', 1.2), x, h - 0.03, z));
  mirror(st, { w, d, strength: 0.16, blur: 2 });
  return { seat: (table = 0, side = 1, i = 0) => seats[clamp(table, 0, 1) * 6 + (side > 0 ? 3 : 0) + clamp(i, 0, 2)], seats, aisle: (i = 0) => [aisles[i % 3], -d / 2 + 2.4], desk: [-w / 2 + 2.5, d / 2 - 2.35, 0], librarian: [-w / 2 + 2.5, d / 2 - 1.2, PI], w, d, h };
}

// ================================================================ CHEMISTRY LAB — benches in rows along x facing the board at -z
export function chemLab(st, o = {}) {
  const w = o.w || 11, d = o.d || 10, h = o.h || 3.3, night = isNight(st), wallC = o.wall || '#d8e0dc';
  shell(st, w, d, h, { wall: wallC, floor: '#c8ccc4', floorTex: tiles('#c8ccc4', 8, [w / 1.6, d / 1.6], 'rgba(0,0,0,.12)'), floorRough: 0.3 });
  // whiteboard with formulas, periodic table, fume hood, safety shower
  const wb = screen(3.6, 1.2, (g, W, H) => { g.fillStyle = '#f8f8f4'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a4aa0'; g.font = '700 56px "Nunito"'; (o.board || ['2H₂ + O₂ → 2H₂O', 'pH < 7  = ACID']).forEach((l, i) => g.fillText(l, 50, 100 + i * 90)); g.strokeStyle = '#d8343a'; g.lineWidth = 6; g.beginPath(); g.moveTo(W - 320, 70); g.lineTo(W - 80, 70); g.stroke(); }, { power: 0.92 });
  st.add(at(group(box(3.75, 1.3, 0.04, mat('#c8ccd4', { metal: 0.5 }), 0, 0, -0.02), wb), 0, 1.7, -d / 2 + 0.04));
  const pt = canvasTex(512, 300, (g, W, H) => { g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, W, H); const cols = ['#f2a07a', '#f2d07a', '#a0d0f2', '#b8e0a0', '#e0b0e8', '#f0c0c0']; for (let r = 0; r < 7; r++) for (let c = 0; c < 18; c++) { if (r === 0 && c > 0 && c < 17) continue; if ((r === 1 || r === 2) && c > 1 && c < 12) continue; g.fillStyle = cols[(c + r) % 6]; g.fillRect(14 + c * 27, 40 + r * 34, 25, 32); } g.fillStyle = '#2a2a3a'; g.font = '800 24px "Nunito"'; g.fillText('PERIODIC TABLE OF THE ELEMENTS', 60, 28); });
  st.add(at(plane(1.7, 1.0, mat('#ffffff', { map: pt, rough: 0.8 })), -w / 2 + 0.02, 1.8, -1.5, R2));
  put(st, group(box(1.6, 2.4, 0.8, mat('#e8e4dc', { rough: 0.5 }), 0, 1.2, 0), box(1.4, 0.9, 0.02, mat('#dff0ff', { transparent: true, opacity: 0.3, clearcoat: 1, rough: 0.05 }), 0, 1.45, 0.41), box(1.4, 0.02, 0.7, mat('#16161c', { clearcoat: 0.8, rough: 0.2 }), 0, 0.95, 0.02), box(1.3, 0.03, 0.03, glowMat('#f4fff8', 1.3), 0, 1.88, 0.3)), w / 2 - 1.2, -d / 2 + 0.45);
  put(st, group(cyl(0.02, 0.02, 2.4, mat('#2a8a3a', { keepSat: true }), 0, 1.2, 0, 8), cyl(0.18, 0.12, 0.08, mat('#2a8a3a', { keepSat: true }), 0, 2.35, 0.2, 16), at(plane(0.4, 0.4, sign('SAFETY\nSHOWER', 0.4, 0.4, '#2a8a3a', '#ffffff', 70)), 0.2, 1.9, 0.02)), -w / 2 + 0.4, d / 2 - 1.2, R2);
  // benches: 3 rows of 2, students stand at the +z side facing -z
  const stations = [], r = rng(o.seed || 12), cols = ['#3ad08a', '#3a8aff', '#ff6a3a', '#f2d03a', '#d84ad8'];
  for (let ri = 0; ri < 3; ri++) for (const sx of [-1, 1]) { const x = sx * 2.4, z = -d / 2 + 3.0 + ri * 2.2; const b = put(st, labBench({ len: 3.4, taps: 2 }), x, z);
    for (let k = 0; k < 3; k++) put(st, beaker({ color: cols[(r() * 5) | 0], flask: r() < 0.4 }), x - 1.1 + k * 0.5 + r() * 0.2, z - 0.15, 0, 0.92, false);
    for (const k of [-0.8, 0.8]) { put(st, group(cyl(0.17, 0.15, 0.04, mat('#2a2a30', { rough: 0.5 }), 0, 0.68, 0, 16), cyl(0.02, 0.02, 0.66, mat('#a8acb8', { metal: 0.7 }), 0, 0.33, 0, 6)), x + k, z + 0.85); stations.push([x + k, z + 0.75, PI]); } }
  const flask = put(st, beaker({ color: o.reaction || '#7aff6a', glow: true, flask: true }), 2.4 - 0.2, -d / 2 + 3.0 + 0.1, 0, 0.92, false);
  put(st, desk({ color: '#3a3a42', w: 1.6 }), -2.6, -d / 2 + 1.2, 0); put(st, poster({ text: 'SAFETY FIRST', c1: '#f2b632', c2: '#c8443a', w: 0.6, h: 0.8 }), w / 2 - 0.02, 1.7, 1, -R2, false);
  put(st, doorProp({ color: '#5a6a7a' }), w / 2 - 0.03, d / 2 - 1.4, -R2, 0, false); put(st, wallClock({ time: o.clock || '10:15' }), 2.6, -d / 2 + 0.03, 0, 2.7, false);
  for (let i = 0; i < 3; i++) { const wv = windowPane(1.6, 1.4, night); wv.position.set(-w / 2 + 0.02, 1.9, 0.8 + i * 1.9); wv.rotation.y = R2; st.add(wv); }
  fluoro(st, w, d, h, 3.2, 2.4); lights(st, [[0, h - 0.4, -2], [0, h - 0.4, 2]], '#f4fbff', o.lamp ?? 4, 10);
  shafts(st, { pos: [-w / 2 + 0.1, 2.5, 0.8], dir: [0.85, -0.5, 0.05], len: 6, w: 1.4, h: 1.3, n: 3, gap: 1.9, along: [0, 0, 1], color: night ? '#a8b8ff' : '#fff0d4', opacity: night ? 0.05 : 0.1, motes: 100 });
  mirror(st, { w, d, strength: 0.2, blur: 1.6 });
  return { station: (i = 0) => stations[i % stations.length], stations, teacher: [-1.6, -d / 2 + 1.6, 0], flask, board: [0, 1.7, -d / 2], w, d };
}

// ================================================================ AUDITORIUM — stage at -z (top y stageY), seats rising toward +z
export function auditorium(st, o = {}) {
  const w = o.w || 18, d = o.d || 20, h = o.h || 7, sY = 0.95, sD = 6, night = true, wallC = o.wall || '#3a2a34';
  shell(st, w, d, h, { wall: wallC, floor: '#4a2a2a', floorTex: carpet('#4a2a2a', [6, 6]), floorRough: 0.9 });
  const sz = -d / 2 + sD / 2; st.add(box(w - 2, sY, sD, mat('#5a3a24', { map: planks('#5a3a24', 20, [4, 2]), rough: 0.3, clearcoat: 0.5 }), 0, sY / 2, sz), box(w - 2, 0.06, 0.1, mat('#2a1a14'), 0, sY - 0.03, sz + sD / 2));
  for (let i = 0; i < 3; i++) st.add(box(2, 0.18, 0.4, mat('#4a2a24'), 0, sY * (i + 1) / 4, sz + sD / 2 + 0.2 + (2 - i) * 0.4 - 0.4));
  // red velvet curtains (folds via a sine-shaped geometry) + valance, proscenium
  const fold = (wd, hh) => { const g = new THREE.PlaneGeometry(wd, hh, 40, 1), P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, Math.sin(P.getX(i) * 9) * 0.08); g.computeVertexNormals(); return g; };
  const vel = mat('#a8182a', { keepSat: true, rough: 0.55, sheen: 1, sheenColor: '#ff6a7a', sheenRough: 0.4, side: THREE.DoubleSide }), open = o.open ?? 0.6;
  for (const sx of [-1, 1]) { const cw = (w - 2) / 2 * (1 - open * 0.75); const c = new THREE.Mesh(fold(cw, h - 1.6), vel); c.position.set(sx * ((w - 2) / 2 - cw / 2), sY + (h - 1.6) / 2, -d / 2 + sD - 0.6); c.castShadow = true; st.add(c); }
  st.add(at(new THREE.Mesh(fold(w - 2, 1.0), vel), 0, h - 0.6, -d / 2 + sD - 0.5), box(w, 1.4, 0.4, mat('#2a1a20', { rough: 0.8 }), 0, h - 0.7, -d / 2 + sD - 0.3));
  for (const sx of [-1, 1]) st.add(box(1.0, h, 0.4, mat('#4a2a2a', { rough: 0.7 }), sx * (w / 2 - 0.5), h / 2, -d / 2 + sD - 0.3));
  st.add(box(w - 2, 0.02, sD - 0.8, mat('#121014'), 0, h - 0.01, -d / 2 + (sD - 0.8) / 2));
  const pod = put(st, group(box(0.6, 1.1, 0.45, mat('#5a3a24', { clearcoat: 0.6, rough: 0.3 }), 0, 0.55, 0), box(0.7, 0.04, 0.5, mat('#3a2418', { clearcoat: 0.6 }), 0, 1.12, 0), at(cyl(0.006, 0.006, 0.3, mat('#2a2a30'), 0, 0, 0, 6), 0, 1.25, 0.1).rotateX(-0.4), at(plane(0.4, 0.4, sign(o.crest || 'E', 0.4, 0.4, '#f2b632', '#3a1a2a', 300)), 0, 0.65, 0.23)), 2.5, -d / 2 + sD - 1.6, 0, sY, false);   // podium at z -d/2+sD-1.6; the speaker stands 0.5 behind it
  // raked seats: rows rising toward +z
  const seats = [], rows = o.rows || 9, perRow = o.perRow || 12, z0 = -d / 2 + sD + 2.2, red = mat('#8a1a24', { rough: 0.6, sheen: 0.6, sheenColor: '#ff8a8a' });
  for (let ri = 0; ri < rows; ri++) { const y = ri * 0.22, z = z0 + ri * 0.95; if (y > 0) st.add(box(w, y, 0.95, mat('#3a2228', { rough: 0.9 }), 0, y / 2, z + 0.1));
    for (let i = 0; i < perRow; i++) { const x = (i - (perRow - 1) / 2) * 0.62 + (i >= perRow / 2 ? 0.9 : -0.9); const s = group(box(0.5, 0.08, 0.45, red, 0, SEAT - 0.04, 0), box(0.5, 0.55, 0.08, red, 0, SEAT + 0.3, -0.22), box(0.04, 0.4, 0.4, mat('#1a1a20'), 0.27, 0.3, 0)); s.position.set(x, y, z); s.rotation.y = PI; st.add(s); seats.push([x, z + 0.02, PI, y]); } }
  // spotlights from the booth at the back + stage wash, house lights dim
  const spots = []; for (const sx of o.spotsX || [-0.5, 1.5]) { const S1 = spot('#fff4e0', o.spotPower ?? 160, { pos: [sx * 2, h - 0.6, d / 2 - 1], target: [sx < 0 ? -0.7 : 2.5, sY, -d / 2 + sD - 2.1], angle: 0.11, penumbra: 0.35, dist: 40 }); st.add(S1); spots.push(S1);
    const cn = lightCone(0.6, 20, '#fff4e0', 0.035); cn.position.set(sx * 2, h - 0.6, d / 2 - 1); cn.lookAt(sx * 1.4, sY, -d / 2 + sD - 2); cn.rotateX(-R2); st.add(cn); }
  for (let x = -6; x <= 6; x += 3) { st.add(at(glow('#ffd8a0', 0.6, 0.8), x, h - 0.4, -d / 2 + sD + 0.3)); }
  lights(st, [[0, h - 1, -d / 2 + 3], [0, h - 1, 4]], '#ffd8b0', o.lamp ?? 3, 16);
  for (const sx of [-1, 1]) for (let z = 0; z < d / 2; z += 4) st.add(at(glow('#ffc890', 0.35, 0.9), sx * (w / 2 - 0.05), 3, z));
  st.add(at(plane(1.0, 0.3, glowSign('EXIT', 1.0, 0.3, '#c8202a', '#ffffff', 110, 1.4)), w / 2 - 0.02, 3, d / 2 - 2, -R2));
  return { seat: (row = 0, i = 0) => seats[clamp(row, 0, rows - 1) * perRow + clamp(i, 0, perRow - 1)], seats, stage: (x = 0) => [x, -d / 2 + sD - 2.2, 0], stageY: sY, podium: [2.5, -d / 2 + sD - 2.1, 0, sY], spots, w, d };
}

// ================================================================ FOOTBALL FIELD — field along x, home bleachers at z = +, scoreboard at -x end
const fieldTexUS = (L, W, home) => canvasTex(2048, 1024, (g, Wp, Hp) => { const sx = Wp / L, sz = Hp / W; for (let i = 0; i < 20; i++) { g.fillStyle = i % 2 ? '#3f8a3a' : '#4a9a42'; g.fillRect(i * Wp / 20, 0, Wp / 20 + 1, Hp); }
  const ez = 9.1 * sx; g.fillStyle = '#2a3a8a'; g.fillRect(0, 0, ez, Hp); g.fillStyle = '#8a2a2a'; g.fillRect(Wp - ez, 0, ez, Hp); g.strokeStyle = 'rgba(255,255,255,.92)'; g.lineWidth = 5;
  for (let y = 0; y <= 100; y += 5) { const x = ez + y * 0.9144 * sx; g.beginPath(); g.moveTo(x, 8); g.lineTo(x, Hp - 8); g.stroke(); if (y % 10 === 0 && y > 0 && y < 100) { g.fillStyle = 'rgba(255,255,255,.92)'; g.font = '900 54px "Nunito"'; g.textAlign = 'center'; const n = y <= 50 ? y : 100 - y; g.fillText(String(n), x, Hp * 0.2); g.fillText(String(n), x, Hp * 0.86); } }
  g.strokeRect(4, 4, Wp - 8, Hp - 8); g.fillStyle = 'rgba(255,255,255,.95)'; g.font = '900 120px "Nunito"'; g.textAlign = 'center'; g.save(); g.translate(ez / 2, Hp / 2); g.rotate(-Math.PI / 2); g.fillText(home, 0, 40); g.restore(); g.save(); g.translate(Wp - ez / 2, Hp / 2); g.rotate(Math.PI / 2); g.fillText('GUEST', 0, 40); g.restore();
  g.fillStyle = '#f2b632'; g.beginPath(); g.arc(Wp / 2, Hp / 2, 60, 0, 7); g.fill(); g.fillStyle = '#2a3a8a'; g.font = '900 80px "Nunito"'; g.fillText((home || 'E')[0], Wp / 2, Hp / 2 + 28); });
export function footballField(st, o = {}) {
  const L = 110, W = 49, night = isNight(st), home = o.home || 'EAGLES';
  const f = plane(L, W, mat('#ffffff', { map: fieldTexUS(L, W, home), rough: 0.9, keepSat: true })); f.rotation.x = -R2; f.receiveShadow = true; st.add(f);
  st.add(at(ground(L + 40, W + 40, '#7a3a2a', null, { rough: 0.9 }), 0, -0.01, 0), box(L + 16, 0.02, 3, mat('#9a4a32', { rough: 0.8 }), 0, 0.005, W / 2 + 3));
  for (const sx of [-1, 1]) put(st, goalPost({}), sx * (L / 2 + 0.2), 0, sx > 0 ? -R2 : R2, 0, false);
  const bl = bleachers({ len: 40, rows: o.rows || 9, crowd: o.crowd ?? 320, cheer: o.cheer ?? 0.5, colors: o.colors || ['#2a3a8a', '#f2b632', '#2a3a8a', '#ffffff', '#3a3a4a', '#f2b632'] }); bl.position.set(0, 0, W / 2 + 6); bl.rotation.y = PI; st.add(bl);
  if (bl.crowd?.tick) st.onTick(t => bl.crowd.tick(t));
  const away = bleachers({ len: 30, rows: 6, crowd: o.awayCrowd ?? 140, colors: ['#8a2a2a', '#ffffff', '#3a3a4a'] }); away.position.set(0, 0, -W / 2 - 6); st.add(away); if (away.crowd?.tick) st.onTick(t => away.crowd.tick(t));
  const board = put(st, scoreboard({ homeName: home, ...o.score }), -L / 2 - 12, 0, R2, 0, false);
  for (let i = 0; i < 6; i++) put(st, bench({ color: '#2a3a8a' }), -12 + i * 4.5, W / 2 + 1.6, PI);
  // stadium lights on poles: bright banks; real light from two angles; haze cones at night
  for (const [x, z] of [[-35, W / 2 + 14], [35, W / 2 + 14], [-35, -W / 2 - 12], [35, -W / 2 - 12]]) { const pole = group(cyl(0.25, 0.35, 22, mat('#6a6e78', { metal: 0.5 }), 0, 11, 0, 10), box(5, 2.4, 0.4, mat('#3a3e48'), 0, 22.5, 0));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) pole.add(box(1.0, 0.9, 0.05, night ? glowMat('#f4f8ff', 2.4) : mat('#e8ecf0', { rough: 0.3 }), -1.8 + i * 1.2, 22 + j * 1.05, z > 0 ? -0.22 : 0.22)); put(st, pole, x, z, 0, 0, false);
    if (night) { st.add(at(glow('#f4f8ff', 6, 0.6), x, 22.5, z * 0.97)); const cn = lightCone(9, 28, '#e8f0ff', 0.03); cn.position.set(x, 22.5, z); cn.lookAt(x * 0.3, 0, 0); cn.rotateX(-R2); st.add(cn); } }
  if (night) { for (const [x, z] of [[-35, W / 2 + 14], [35, -W / 2 - 12]]) st.add(spot('#f4f8ff', o.lights ?? 700, { pos: [x, 22, z], target: [x * 0.2, 0, 0], angle: 0.75, penumbra: 0.5, dist: 120 })); skyDome(st, { clouds: 0, stars: true }); }
  else skyDome(st, { clouds: 14 });
  return { sideline: (i = 0) => [-10 + i * 2.2, W / 2 - 1.2, PI], bleacher: (row = 0, i = 0) => { const s = bl.seat(row, -16 + i * 1.0); return [-s[0], W / 2 + 6 - s[2], 0, s[1]]; }, field: [0, 0], board, home: bl, away, W, L };
}

// ================================================================ LOCKER ROOM (phòng thay đồ) — lockers round the walls, benches along x, showers at -x
export function lockerRoom(st, o = {}) {
  const w = o.w || 12, d = o.d || 8, h = o.h || 3.0, c = o.color || '#2a4a8a';
  shell(st, w, d, h, { wall: o.wall || '#d8d4c8', wallTex: tiles('#d8d4c8', 10, [w / 1.5, h / 1.5], 'rgba(0,0,0,.1)'), floor: '#8a8c90', floorTex: tiles('#8a8c90', 12, [w / 1.2, d / 1.2], 'rgba(0,0,0,.2)'), floorRough: 0.25 });
  const lk = []; const lockerAt = (x, z, yaw) => { const m = mat(c, { rough: 0.45, metal: 0.4, clearcoat: 0.3 }); const g = group(box(0.42, 1.9, 0.45, m, 0, 0.95, 0)); for (let k = 0; k < 4; k++) g.add(box(0.26, 0.015, 0.01, mat(shade(c, -0.4)), 0, 1.65 + k * 0.04, 0.226)); g.add(box(0.03, 0.1, 0.03, mat('#c8ccd4', { metal: 0.8 }), 0.14, 1.0, 0.235)); put(st, g, x, z, yaw, 0, false); lk.push([x + Math.sin(yaw) * 0.7, z + Math.cos(yaw) * 0.7, yaw + PI]); };
  for (let x = -w / 2 + 2.6; x < w / 2 - 0.3; x += 0.44) { lockerAt(x, -d / 2 + 0.25, 0); lockerAt(x, d / 2 - 0.25, PI); }
  const benches = []; for (let i = 0; i < 2; i++) { const x = -0.5 + i * 3.4; put(st, group(box(2.8, 0.06, 0.36, mat('#a8783a', { clearcoat: 0.5, rough: 0.35 }), 0, SEAT - 0.03, 0), box(0.08, SEAT, 0.08, mat('#5a5e68', { metal: 0.6 }), -1.1, SEAT / 2, 0), box(0.08, SEAT, 0.08, mat('#5a5e68', { metal: 0.6 }), 1.1, SEAT / 2, 0)), x, 0); benches.push([x - 0.7, 0.04, 0], [x + 0.7, -0.04, PI]); }
  // shower bay at -x: tiles, heads, a short wall
  st.add(box(0.12, 2.0, d - 2, mat('#e8e4dc', { map: tiles('#e8e4dc', 6, [3, 1.2]), rough: 0.3 }), -w / 2 + 2.3, 1.0, 0));
  for (let z = -d / 2 + 1.4; z < d / 2 - 1; z += 1.4) st.add(cyl(0.02, 0.02, 0.3, mat('#c8ccd4', { metal: 0.9 }), -w / 2 + 0.25, 2.1, z, 6), at(cyl(0.07, 0.05, 0.05, mat('#c8ccd4', { metal: 0.9 }), 0, 0, 0, 12), -w / 2 + 0.35, 2.2, z).rotateZ(-0.7));
  put(st, group(rbox(0.3, 0.3, 0.3, 0.05, mat('#f2ece0'), 0, 0.15, 0), box(0.5, 0.06, 0.02, mat('#c8343a', { keepSat: true }), 0, 0.3, 0.16)), 2.3, 1.6, 0.4); put(st, trashCan({ color: '#3a3e48' }), w / 2 - 0.5, 1.5);
  st.add(at(plane(2.4, 0.6, sign(o.banner || 'EAGLES PRIDE', 2.4, 0.6, '#f2b632', '#2a3a8a', 110)), w / 2 - 0.02, 2.4, 0, -R2));
  fluoro(st, w, d, h, 3, 2.6, '#f0f8ff', 1.25); lights(st, [[-1, h - 0.4, 0], [3.5, h - 0.4, 0]], '#eef6ff', o.lamp ?? 4, 9);
  mirror(st, { w, d, strength: 0.32, blur: 1.2 });
  return { bench: (i = 0) => benches[i % benches.length], locker: (i = 0) => lk[i % lk.length], shower: [-w / 2 + 1.2, 0, R2], w, d };
}

// ================================================================ BAND ROOM — curved risers facing the podium at -z
export function bandRoom(st, o = {}) {
  const w = o.w || 13, d = o.d || 11, h = o.h || 3.6, wallC = o.wall || '#c8b8a0';
  shell(st, w, d, h, { wall: wallC, wallTex: carpet(wallC, [6, 2]), floor: '#5a4a3a', floorTex: planks('#7a5a3a', 14, [w / 2.5, d / 2.5]), floorRough: 0.4 });
  const cx = 0, cz = -d / 2 + 1.6, seats = [], r = rng(o.seed || 21), chairC = '#2a2a30';
  for (let ri = 0; ri < 3; ri++) { const R = 2.4 + ri * 1.3, y = ri * 0.2; if (y > 0) { const shape = new THREE.Shape(); shape.absarc(0, 0, R + 0.65, 0.25, PI - 0.25, false); shape.absarc(0, 0, R - 0.65, PI - 0.25, 0.25, true);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: y, bevelEnabled: false }); const m = new THREE.Mesh(geo, mat('#6a4a32', { rough: 0.5, clearcoat: 0.3 })); m.rotation.x = R2; m.position.set(cx, y, cz); m.receiveShadow = m.castShadow = true; st.add(m); }
    const n = 5 + ri * 2; for (let i = 0; i < n; i++) { const a = 0.38 + (i / (n - 1)) * (PI - 0.76), x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, yaw = Math.atan2(cx - x, cz - z);
      put(st, chair({ color: chairC, h: SEAT }), x, z, yaw, y, false); const ms = musicStand(); put(st, ms, x + Math.sin(yaw) * 0.6, z + Math.cos(yaw) * 0.6, yaw + PI, y, false); seats.push([x, z, yaw, y]); } }
  put(st, drumKit({}), 3.6, cz + 4.6, PI + 0.6); put(st, piano({}), -w / 2 + 1.2, cz + 1.2, R2);
  put(st, group(box(0.8, 0.2, 0.8, mat('#3a2a1a'), 0, 0.1, 0)), cx, cz); put(st, musicStand(), cx, cz + 0.35, PI, 0.2, false);
  for (let i = 0; i < 4; i++) { const x = -w / 2 + 2.2 + i * 1.5; put(st, group(rbox(0.5, 1.1, 0.25, 0.08, mat(['#1a1a20', '#3a2a1a', '#2a2a3a', '#1a1a20'][i], { rough: 0.4, clearcoat: 0.6 }), 0, 0.55, 0)), x, d / 2 - 0.35, PI + (r() - 0.5) * 0.2); }
  st.add(at(plane(3.0, 0.7, sign(o.banner || 'EAGLES MARCHING BAND', 3.0, 0.7, '#2a3a8a', '#f2b632', 80)), 0, h - 0.7, -d / 2 + 0.02));
  put(st, wallClock({ time: o.clock || '3:30' }), w / 2 - 0.02, 2.6, 0, -R2, false).rotation.y = -R2; put(st, doorProp({ color: '#5a4a3a' }), w / 2 - 0.03, d / 2 - 1.4, -R2, 0, false);
  for (let x = -4; x <= 4; x += 4) for (let z = -2; z <= 2; z += 4) st.add(box(1.2, 0.04, 0.5, glowMat('#fff4e4', 1.2), x, h - 0.03, z));
  lights(st, [[0, h - 0.4, -1], [0, h - 0.4, 3]], '#fff0dc', o.lamp ?? 4, 11);
  mirror(st, { w, d, strength: 0.18, blur: 1.8 });
  return { seat: (row = 0, i = 0) => { const off = [0, 5, 12][clamp(row, 0, 2)], n = 5 + clamp(row, 0, 2) * 2; return seats[off + clamp(i, 0, n - 1)]; }, seats, podium: [cx, cz, 0, 0.2], piano: [-w / 2 + 1.9, cz + 1.2, -R2], w, d };
}

// ================================================================ PRINCIPAL'S OFFICE — desk at -z facing +z, guests at +z
export function principalOffice(st, o = {}) {
  const w = o.w || 7, d = o.d || 6.5, h = o.h || 3.0, night = isNight(st), wallC = o.wall || '#d8ccb4';
  shell(st, w, d, h, { wall: wallC, floor: '#5a3a2a', floorTex: planks('#5a3a2a', 12, [3, 3]), floorRough: 0.3 });
  st.add(box(w, 1.0, 0.03, mat('#5a3a24', { rough: 0.5, clearcoat: 0.3 }), 0, 0.5, -d / 2 + 0.015), box(w, 0.05, 0.05, mat('#3a2418'), 0, 1.0, -d / 2 + 0.03));
  st.add(at(ground(3.2, 2.4, '#5a1a24', carpet('#5a1a24', [2, 2])), 0, 0.006, 0));
  const dk = put(st, group(rbox(2.2, 0.78, 0.95, 0.03, mat('#4a2a1a', { clearcoat: 0.8, rough: 0.2 }), 0, 0.39, 0), box(2.3, 0.04, 1.05, mat('#2a1a10', { clearcoat: 0.9, rough: 0.12 }), 0, 0.8, 0)), 0, -d / 2 + 1.6);
  put(st, group(rbox(0.68, 0.12, 0.62, 0.05, mat('#2a1a14', { rough: 0.35, clearcoat: 0.5 }), 0, SEAT + 0.05, 0), rbox(0.66, 0.85, 0.12, 0.05, mat('#2a1a14', { rough: 0.35, clearcoat: 0.5 }), 0, SEAT + 0.5, -0.28), cyl(0.04, 0.04, SEAT, mat('#3a3a42', { metal: 0.6 }), 0, SEAT / 2, 0, 8)), 0, -d / 2 + 0.9);
  put(st, group(cyl(0.006, 0.006, 0.05, mat('#222')), box(0.3, 0.06, 0.08, mat('#c8a050', { metal: 0.8, rough: 0.3 }), 0, 0.03, 0), at(plane(0.28, 0.05, sign(o.name || 'PRINCIPAL', 0.28, 0.05, '#c8a050', '#2a1a10', 120)), 0, 0.03, 0.041)), 0.5, -d / 2 + 2.0, 0, 0.82, false);
  put(st, bankerLamp({}), -0.75, -d / 2 + 1.4, 0.3, 0.82, false); put(st, testPaper({ grade: o.grade || 'F' }), 0, -d / 2 + 1.85, 0.1, 0.825, false); put(st, cup({ color: '#2a3a8a' }), 0.8, -d / 2 + 1.3, 0, 0.82, false);
  const guests = []; for (const x of [-0.7, 0.7]) { put(st, chair({ color: '#5a3a2a' }), x, -d / 2 + 2.8, PI); guests.push([x, -d / 2 + 2.8, PI]); }
  put(st, usFlag({}), -w / 2 + 0.6, -d / 2 + 0.5, 0.4); put(st, trophyCase({ w: 2 }), w / 2 - 0.3, -0.6, -R2);
  put(st, group(box(1.0, 0.75, 0.04, mat('#3a2418', { rough: 0.5 }), 0, 0, 0), at(plane(0.85, 0.6, mat('#ffffff', { map: textTex('DIPLOMA', { w: 256, h: 180, bg: '#f4ecd8', color: '#3a2a1a', size: 36, font: 'Nunito' }) })), 0, 0, 0.025)), 1.5, -d / 2 + 0.03, 0, 2.0, false);
  // frosted door with the name on the glass, waiting window blinds on the left
  const fr = group(box(1.0, 2.15, 0.06, mat('#6a4a32', { rough: 0.45, clearcoat: 0.4 }), 0, 1.07, 0), box(0.7, 0.9, 0.065, mat('#e8f0f4', { rough: 0.35, transparent: true, opacity: 0.85 }), 0, 1.55, 0), at(plane(0.6, 0.18, sign(o.door || 'PRINCIPAL', 0.6, 0.18, '#e8f0f4', '#1a2a3a', 90)), 0, 1.65, 0.035), sphere(0.04, mat('#d8c070', { metal: 0.8 }), 0.4, 1.0, 0.05));
  put(st, fr, 1.6, d / 2 - 0.03, PI, 0, false);
  const wv = windowPane(1.8, 1.4, night); wv.position.set(-w / 2 + 0.02, 1.7, 0.4); wv.rotation.y = R2; st.add(wv);
  for (let i = 0; i < 16; i++) st.add(box(0.03, 0.04, 1.84, mat('#e8e2d4', { rough: 0.6 }), -w / 2 + 0.07, 1.0 + i * 0.09, 0.4).rotateZ(0.6));
  shafts(st, { pos: [-w / 2 + 0.1, 2.0, 0.4], dir: [0.85, -0.45, 0.1], len: 4, w: 1.6, h: 1.2, n: 1, color: night ? '#a8b8ff' : '#ffe8c4', opacity: night ? 0.05 : 0.11, motes: 80 });
  st.add(spot(night ? '#a8b8ff' : '#ffe8c4', night ? 15 : 60, { pos: [-w / 2 - 1.5, 3, 0.4], target: [1, 0, 0.2], angle: 0.7, penumbra: 0.6, dist: 14 }));
  lights(st, [[0, h - 0.4, 0]], '#fff0d8', o.lamp ?? 3, 9); st.add(box(1.0, 0.04, 1.0, glowMat('#fff4e4', 1.15), 0, h - 0.03, 0));
  mirror(st, { w, d, strength: 0.2, blur: 1.6 });
  return { principal: [0, -d / 2 + 0.9, 0], desk: [0, -d / 2 + 1.6], guest: (i = 0) => guests[i % 2], door: [1.6, d / 2 - 0.8, PI], w, d };
}

// ================================================================ DETENTION — the classroom after school
export function detention(st, o = {}) {
  const c = classroom(st, { board: o.board || ['DETENTION', '3:00 – 5:00   NO TALKING'], clock: o.clock || '3:59', seed: o.seed || 9, lamp: o.lamp ?? 2.2, ...o });
  const sun = spot('#ffb070', isNight(st) ? 0 : 110, { pos: [-c.w / 2 - 2, 2.2, -1], target: [c.w / 2, 0.6, 1], angle: 0.5, penumbra: 0.7, dist: 26 }); st.add(sun);
  const paper = newspaper({}); paper.position.set(-2.4, 0.785, -c.d / 2 + 1.5); paper.rotation.set(-R2, 0, 0.3); st.add(paper);   // on the teacher's desk (hold it: T.character().hold)
  return { ...c, paper, teacher: [-2.6, -c.d / 2 + 0.9, 0] };   // teacher: the chair behind the desk (sit pose, facing the class)
}

// ================================================================ NURSE'S OFFICE
export function nurseOffice(st, o = {}) {
  const w = o.w || 6, d = o.d || 6, h = o.h || 2.9, night = isNight(st);
  shell(st, w, d, h, { wall: o.wall || '#e4ecec', floor: '#c8d0d0', floorTex: tiles('#c8d0d0', 6, [3, 3], 'rgba(0,0,0,.1)'), floorRough: 0.25 });
  put(st, examBed({}), -w / 2 + 1.3, -0.4, 0); put(st, curtain({ w: 2.2, color: '#9ac0c8' }), -w / 2 + 1.4, -1.6, 0);
  put(st, group(box(1.4, 2.0, 0.4, mat('#f4f4f0', { rough: 0.4 }), 0, 1.0, 0), box(0.25, 0.08, 0.01, mat('#d8202a', { keepSat: true }), 0, 1.6, 0.205), box(0.08, 0.25, 0.01, mat('#d8202a', { keepSat: true }), 0, 1.6, 0.205), box(1.3, 0.01, 0.01, mat('#9aa0a8'), 0, 1.0, 0.205)), 1.0, -d / 2 + 0.22);
  const ec = canvasTex(200, 300, (g, W, H) => { g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, W, H); g.fillStyle = '#1a1a1a'; g.textAlign = 'center'; ['E', 'F P', 'T O Z', 'L P E D', 'P E C F D', 'E D F C Z P'].forEach((l, i) => { g.font = `800 ${60 - i * 9}px "Nunito"`; g.fillText(l, W / 2, 60 + i * 42); }); });
  st.add(at(plane(0.45, 0.68, mat('#ffffff', { map: ec, rough: 0.8 })), w / 2 - 0.02, 1.6, -0.8, -R2));
  put(st, group(box(0.35, 0.05, 0.35, mat('#d8dce0'), 0, 0.03, 0), cyl(0.02, 0.02, 1.4, mat('#c8ccd4', { metal: 0.7 }), 0, 0.7, -0.12, 6), box(0.25, 0.08, 0.05, mat('#e8ecf0'), 0, 1.4, -0.1)), w / 2 - 0.6, 1.2, -R2);
  put(st, desk({ color: '#c8ccd0', w: 1.3 }), 1.4, 1.6, PI); put(st, chair({ color: '#5a8aa0' }), 1.4, 2.2, PI); put(st, plant({}), w / 2 - 0.4, d / 2 - 0.4);
  st.add(at(poster({ text: 'WASH YOUR HANDS', c1: '#5ab8d8', c2: '#2a6a8a', w: 0.55, h: 0.75 }), -0.6, 1.7, -d / 2 + 0.03));
  const wv = windowPane(1.4, 1.2, night); wv.position.set(-w / 2 + 0.02, 1.7, 1.6); wv.rotation.y = R2; st.add(wv);
  st.add(box(1.2, 0.04, 0.6, glowMat('#f4fff8', 1.25), 0, h - 0.03, 0)); lights(st, [[0, h - 0.4, 0]], '#f0fff8', o.lamp ?? 3.5, 9);
  mirror(st, { w, d, strength: 0.24, blur: 1.4 });
  return { bed: [-w / 2 + 1.55, -0.2, R2, 0.3], nurse: [1.4, 2.0, PI], door: [w / 2 - 0.7, d / 2 - 0.8, PI], w, d };
}

// ================================================================ RESTROOM — sinks along -z under a long real mirror, stalls along +x
export function restroom(st, o = {}) {
  const w = o.w || 7, d = o.d || 6, h = o.h || 2.8, tile = o.tile || '#9ad0c8';
  shell(st, w, d, h, { wall: '#e8ecec', wallTex: tiles('#e8ecec', 12, [w / 1.5, h / 1.5], 'rgba(0,0,0,.08)'), floor: '#3a3a42', floorTex: tiles('#3a3a42', 10, [w, d], 'rgba(255,255,255,.08)'), floorRough: 0.25 });
  st.add(box(w, 1.1, 0.02, mat(tile, { map: tiles(tile, 6, [w / 0.6, 1.8], 'rgba(0,0,0,.12)'), rough: 0.3, clearcoat: 0.4 }), 0, 0.55, -d / 2 + 0.012));
  const sinks = []; for (let i = 0; i < 3; i++) { const x = -1.6 + i * 1.0; put(st, sinkUnit({ w: 0.95 }), x, -d / 2 + 0.3, 0, 0, false); sinks.push([x, -d / 2 + 0.95, PI]); }
  // real wall mirror: a Reflector stood up on the back wall
  const mw = 3.2, mh = 1.0, m = LEGACY ? null : new Reflector(new THREE.PlaneGeometry(mw, mh), { textureWidth: 1024, textureHeight: 320, clipBias: 0.003, color: 0xb8c4c8, multisample: 0 }); if (m) { m.position.set(-0.6, 1.62, -d / 2 + 0.03); m.userData.dynamic = true; st.add(m); }
  st.add(box(mw + 0.08, mh + 0.08, 0.02, mat('#c8ccd4', { metal: 0.8, rough: 0.2 }), -0.6, 1.62, -d / 2 + 0.015));
  if (!m) st.add(box(mw, mh, 0.01, mat('#a8b8c8', { metal: 0.9, rough: 0.05 }), -0.6, 1.62, -d / 2 + 0.03));
  // stalls along +x
  const pm = mat(o.stall || '#5a8aa0', { rough: 0.35, clearcoat: 0.5, metal: 0.2 });
  for (let i = 0; i < 3; i++) { const z = -d / 2 + 1.0 + i * 1.3; st.add(box(1.5, 1.9, 0.03, pm, w / 2 - 0.75, 1.05, z - 0.65)); const dr = box(0.03, 1.8, 0.62, pm, w / 2 - 1.5, 1.0, z - 0.3); dr.rotation.y = i === 1 ? 0.6 : 0; st.add(dr); }
  st.add(box(1.5, 1.9, 0.03, pm, w / 2 - 0.75, 1.05, -d / 2 + 1.0 + 3 * 1.3 - 0.65));
  st.add(box(0.3, 0.4, 0.15, mat('#c8ccd4', { metal: 0.6 }), -w / 2 + 0.1, 1.2, 0)); put(st, trashCan({ color: '#5a5e68' }), -w / 2 + 0.4, 1.2);
  for (const x of [-1.5, 1]) st.add(box(1.0, 0.04, 0.5, glowMat('#f4fff8', 1.3), x, h - 0.03, -0.5)); lights(st, [[-0.6, h - 0.3, -1]], '#f0fff8', o.lamp ?? 4, 8);
  const fl = mirror(st, { w, d, strength: 0.25, blur: 1.2 });
  return { sink: (i = 0) => sinks[i % sinks.length], sinks, stall: (i = 0) => [w / 2 - 1.9, -d / 2 + 0.7 + i * 1.3, -R2], mirror: [-0.6, 1.62, -d / 2], w, d };
}

// ================================================================ STUDENT PARKING LOT — rows along x, school at -z, buses at +z
export function studentLot(st, o = {}) {
  const M = st.M, night = isNight(st), r = rng(o.seed || 31);
  st.add(ground(160, 120, shade(M.grass || '#5d9a5a', -0.1), null, { y: -0.02 }), at(ground(60, 30, M.road, asphalt(M.road, [12, 6]), { rough: o.wet ? 0.3 : 0.85 }), 0, 0, 2));
  for (let x = -26; x <= 26; x += 2.8) for (const z of [-3.2, 4.2]) st.add(at(box(0.1, 0.005, 4.6, mat('#efe8d0')), x, 0.006, z));
  const cars = [], cols = ['#c8343a', '#2a5aa0', '#e8e4dc', '#3a3a42', '#6a8a5a', '#d8a030', '#8a8c94'];
  for (let i = 0; i < (o.cars ?? 16); i++) { const row = i % 2, x = -21 + Math.floor(i / 2) * 2.8 * 2 + (row ? 2.8 : 0), z = row ? 4.2 : -3.2; if (r() < 0.25 && i > 2) continue; if (o.gap && x + 1.4 > o.gap[0] && x + 1.4 < o.gap[1]) continue;
    const v = (i === 5 ? pickup({ color: '#8a2a2a' }) : car({ color: cols[(r() * cols.length) | 0] })); put(st, v, x + 1.4, z, row ? -R2 : R2); cars.push([x + 1.4, z + (row ? -3 : 3), row ? PI : 0]); }
  // the school behind: brick facade with windows, sign; buses lined up at the curb in front of it
  const br = mat('#9a4a3a', { map: tiles('#9a4a3a', 16, [12, 3], 'rgba(255,240,220,.25)'), rough: 0.9 }); st.add(box(70, 9, 2, br, 0, 4.5, -18));
  for (let x = -32; x <= 32; x += 3.2) for (const y of [2.2, 5.6]) st.add(at(windowPane(2.0, 1.6, night), x, y, -16.95));
  st.add(at(plane(10, 1.2, sign(o.school || 'LINCOLN HIGH SCHOOL', 10, 1.2, '#e8e2d0', '#2a3a6a', 70)), 0, 8, -16.95));
  st.add(box(70, 0.15, 3, mat('#b8b0a8', { rough: 0.8 }), 0, 0.075, -15.5));
  for (let i = 0; i < (o.buses ?? 3); i++) put(st, schoolBus({}), -14 + i * 10.5, -12.2, 0, 0, true);
  for (const x of [-20, 0, 20]) { if (o.gap && x > o.gap[0] && x < o.gap[1]) continue; const lp = streetLamp({}); put(st, lp, x, -6.2, 0, 0, false); }
  for (let i = 0; i < 6; i++) put(st, tree({ s: 1.2 + r() * 0.3, color: '#3a6a3a' }), -30 + i * 12, -14.5);
  if (!night) skyDome(st, { clouds: 14 }); else st.add(lamp('#ffd8a0', 6, 30, { bulb: false })).position.set(0, 6, 0);
  if (o.wet) mirror(st, { w: 60, d: 30, z: 2, strength: 0.4, blur: 1.2 });
  return { car: (i = 0) => cars[i % cars.length], cars, busDoor: [-14 + 3.9, -10.5, PI], walk: [0, 0.5], w: 60 };
}

// ================================================================ PROM — the gym dressed up: arch at +z, banner, disco ball, punch table
export function promHall(st, o = {}) {
  const g = gym(st, { ...o }); const M = st.M, h = 7;
  st.add(at(plane(8, 1.2, glowSign(o.banner || 'PROM NIGHT  ★  A NIGHT IN PARIS', 8, 1.2, '#1a1a3a', '#f2d07a', 70, 1.2)), 0, 5, -7.2));
  const arch = put(st, balloonArch({ colors: o.colors }), 0, 5.5, 0, 0, false);
  const r = rng(o.seed || 41); for (let i = 0; i < 26; i++) { const b = balloon({ color: ['#f2b632', '#ffffff', '#2a3a8a', '#e83a6a'][i % 4], string: 0.5 }); b.position.set((r() - 0.5) * 22, 5.2 + r() * 1.4, (r() - 0.5) * 12); st.add(b); }
  for (let i = 0; i < 5; i++) st.add(stringLights({ from: [-13, 6.2, -6 + i * 3], to: [13, 6.2, -6 + i * 3 + 0.5], n: 26, sag: 0.8, lights: i === 2 ? 2 : 0 }));
  const ball = discoBall({ drop: 1.2 }); ball.position.set(0, 6.0, -1); ball.userData.dynamic = true; st.add(ball);
  // moving coloured spots from the disco ball (additive decals on floor and walls)
  const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(0.12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 160); dots.userData.dynamic = true; dots.frustumCulled = false;
  const pal = ['#ff4a9a', '#4ad0ff', '#ffe04a', '#ffffff', '#a04aff'].map(c => new THREE.Color(c)); const base = []; for (let i = 0; i < 160; i++) { base.push([r() * PI * 2, 0.25 + r() * 1.1]); dots.setColorAt(i, pal[i % 5]); }
  const dmy = new THREE.Object3D(); const upd = (t) => { ball.ball.rotation.y = t * 0.6; base.forEach(([a0, el], i) => { const a = a0 + t * 0.6, dist = 6.0 / Math.tan(el); const x = Math.cos(a) * dist, z = -1 + Math.sin(a) * dist;
      if (Math.abs(x) < 13.5 && Math.abs(z + 0) < 7) { dmy.position.set(x, 0.02, z); dmy.rotation.set(-R2, 0, 0); } else { const k = Math.min(13.5 / Math.abs(Math.cos(a) * dist || 1), 7 / Math.abs(Math.sin(a) * dist || 1)); dmy.position.set(Math.cos(a) * dist * k * 0.999, 6.0 - 6.0 * k, -1 + Math.sin(a) * dist * k * 0.999); dmy.lookAt(0, dmy.position.y, -1); }
      dmy.scale.setScalar(1 + el * 0.4); dmy.updateMatrix(); dots.setMatrixAt(i, dmy.matrix); }); dots.instanceMatrix.needsUpdate = true; };
  upd(0); st.add(dots); st.onTick(upd);
  for (const [c, x] of [['#ff4a9a', -6], ['#4a8aff', 6], ['#a04aff', 0]]) { const S1 = spot(c, 140, { pos: [x, 6.5, 5], target: [x * 0.3, 0, -1], angle: 0.45, penumbra: 0.6, dist: 30 }); st.add(S1); }
  const punch = put(st, group(table({ w: 2.4, d: 0.8, color: '#f4f0f4' }), box(2.5, 0.6, 0.85, mat('#ffffff', { rough: 0.8, sheen: 1 }), 0, 0.46, 0), at(cyl(0.2, 0.15, 0.22, mat('#e8f4ff', { transparent: true, opacity: 0.35, clearcoat: 1 }), 0, 0, 0, 20), -0.5, 0.88, 0), at(cyl(0.18, 0.13, 0.15, mat('#e83a5a', { keepSat: true, transparent: true, opacity: 0.85 }), 0, 0, 0, 20), -0.5, 0.86, 0)), 10, -4.5, -R2);
  return { ...g, floor: [0, 0], arch: [0, 5.5, PI], punch: [9.2, -4.5, R2], ball, w: 28, d: 15 };
}

// ================================================================ 50s DINER by the school — booths along -z (window), counter along +z
export function dinerUS(st, o = {}) {
  const w = o.w || 12, d = o.d || 8, h = o.h || 3.2, night = isNight(st);
  const chk = canvasTex(256, 256, (g, W, H) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#1e1a22' : '#f4efe6'; g.fillRect(i * 64, j * 64, 64, 64); } }, [w / 1.2, d / 1.2]);
  shell(st, w, d, h, { wall: o.wall || '#f2ece0', floor: '#ffffff', floorTex: chk, floorRough: 0.2 });
  st.add(box(w, 0.12, 0.04, mat('#e8203a', { keepSat: true, clearcoat: 0.8 }), 0, 1.0, -d / 2 + 0.03), box(w, 0.06, 0.04, mat('#d8dce4', { metal: 0.9, rough: 0.15 }), 0, 1.08, -d / 2 + 0.03));
  const red = mat('#c8182a', { keepSat: true, clearcoat: 0.9, rough: 0.25 }), chrome = mat('#d8dce4', { metal: 0.95, rough: 0.12 }), mint = mat('#7ad8c8', { keepSat: true, clearcoat: 0.6, rough: 0.3 });
  const booths = []; for (let i = 0; i < 4; i++) { const x = -w / 2 + 1.6 + i * 2.6, z = -d / 2 + 1.0;
    put(st, group(rbox(1.0, 0.04, 0.7, 0.02, mint, 0, 0.76, 0), cyl(0.05, 0.12, 0.74, chrome, 0, 0.37, 0, 12)), x, z);
    for (const sx of [-1, 1]) { put(st, group(rbox(0.5, 0.16, 0.9, 0.06, red, 0, SEAT - 0.1, 0), box(0.46, SEAT - 0.18, 0.86, mat('#8a1020'), 0, (SEAT - 0.18) / 2, 0), rbox(0.15, 0.7, 0.9, 0.06, red, sx * 0.22, SEAT + 0.3, 0)), x + sx * 0.85, z); booths.push([x + sx * 0.8, z, sx > 0 ? -R2 : R2]); }
    put(st, milkshake({ color: ['#f2a0b8', '#8a5a3a', '#f4ecd8'][i % 3] }), x - 0.15, z, 0, 0.78, false);
    const wv = windowPane(2.2, 1.2, night, '#d8dce4'); wv.position.set(x, 1.8, -d / 2 + 0.02); st.add(wv); }
  const stools = []; put(st, group(box(w - 3, 1.0, 0.6, mat('#e8203a', { keepSat: true, clearcoat: 0.6 }), 0, 0.5, 0), box(w - 2.9, 0.05, 0.75, mat('#f4f0e8', { clearcoat: 0.8, rough: 0.2 }), 0, 1.02, -0.05), box(w - 3, 0.04, 0.02, chrome, 0, 0.2, 0.31)), 0.8, d / 2 - 1.4);
  for (let i = 0; i < 6; i++) { const x = -3.2 + i * 1.3; put(st, group(cyl(0.2, 0.2, 0.1, red, 0, 0.72, 0, 20), cyl(0.04, 0.04, 0.7, chrome, 0, 0.35, 0, 8), cyl(0.18, 0.18, 0.02, chrome, 0, 0.01, 0, 16)), x, d / 2 - 2.2); stools.push([x, d / 2 - 2.2, 0]); }
  put(st, jukebox({}), -w / 2 + 0.6, d / 2 - 1.0, R2);
  st.add(at(plane(3.2, 0.8, glowSign(o.name || "MEL'S DINER", 3.2, 0.8, '#1a1a2a', '#ff4a7a', 100, 1.6)), 0, h - 0.6, d / 2 - 0.02, PI), at(glow('#ff4a7a', 3, 0.3), 0, h - 0.6, d / 2 - 0.3));
  st.add(at(plane(1.6, 0.5, glowSign('OPEN', 1.6, 0.5, '#101018', '#3ad0ff', 120, 1.8)), w / 2 - 0.02, 2.2, -1, -R2));
  put(st, wallClock({ time: o.clock || '4:20', rim: '#e8203a' }), -w / 2 + 0.02, 2.4, -1, R2, false).rotation.y = R2;
  for (let i = 0; i < 4; i++) { const pl = group(cyl(0.004, 0.004, 0.6, '#111', 0, -0.3, 0, 4), sphere(0.16, mat('#e8203a', { keepSat: true, clearcoat: 1, rough: 0.1 }), 0, -0.68, 0, 16, 10), at(glow('#ffe0b0', 0.6, 0.7), 0, -0.8, 0)); pl.position.set(-w / 2 + 1.6 + i * 2.6, h, -d / 2 + 1.0); st.add(pl); }
  lights(st, [[-2, h - 0.6, -d / 2 + 1.2], [2.5, h - 0.6, 0.8]], '#ffe8c8', o.lamp ?? 3.5, 9);
  mirror(st, { w, d, strength: 0.28, blur: 1.2 });
  return { booth: (i = 0, side = -1) => booths[clamp(i, 0, 3) * 2 + (side > 0 ? 1 : 0)], booths, stool: (i = 0) => stools[i % stools.length], jukebox: [-w / 2 + 1.4, d / 2 - 1.0, -R2], counter: [0.8, d / 2 - 0.9], w, d };
}

// ================================================================ SUBURB BUS STOP — street along x, houses at -z, bus pulls in at the corner
export function suburbStop(st, o = {}) {
  const M = st.M, night = isNight(st), r = rng(o.seed || 17);
  st.add(ground(220, 120, M.grass || '#5d9a5a', null, { y: -0.02 }));
  st.add(box(220, 0.02, 7, mat(M.road, { map: asphalt(M.road, [40, 2]), rough: o.wet ? 0.3 : 0.88 }), 0, 0.01, 4.5));
  const swC = '#c8c0b4'; st.add(box(220, 0.14, 2, mat(swC, { map: tiles(swC, 4, [110, 1], 'rgba(0,0,0,.15)') }), 0, 0.07, 0), box(220, 0.15, 0.15, mat('#d8d0c4'), 0, 0.075, 1.0));
  const porches = [], cols = ['#f2ece0', '#c8d8e8', '#f2d8a0', '#d8e8d0', '#e8c8b8', '#b8c8d8'];
  for (let i = 0; i < 7; i++) { const x = -24 + i * 8; const hs = house({ color: cols[i % cols.length], roof: ['#5a4a4a', '#3a4a5a', '#6a3a32'][i % 3], seed: i + 3, porch: true }); put(st, hs, x, -9, 0, 0, false);
    put(st, mailbox({ color: ['#2a3a5a', '#1a1a1a', '#8a2a2a'][i % 3] }), x + 2.2, -1.2, 0); porches.push([x, -5.5, PI]);
    for (let k = 0; k < 2; k++) put(st, tree({ s: 1.1 + r() * 0.4, color: o.autumn ? ['#d8702a', '#c8402a', '#e8a030'][(r() * 3) | 0] : '#3a7a3a' }), x - 3 + k * 6 + r(), -3.5 - r()); }
  for (let x = -24; x <= 24; x += 8) st.add(box(1.2, 0.02, 5, mat('#b8b0a4'), x, 0.015, -4));
  const stop = [6, 0.6, PI]; put(st, stopSign({}), 9.5, 0.7, -R2); put(st, streetLamp({}), -8, 0.8, 0, 0, false);
  const bus = schoolBus({ door: o.door ?? 1 }); bus.position.set(o.busX ?? 2, 0, 3.4); bus.userData.dynamic = true; st.add(bus);   // moves: no baked contact shadow
  if (!night) skyDome(st, { clouds: 14 }); if (o.wet) mirror(st, { w: 120, d: 7, z: 4.5, strength: 0.45, blur: 1.2 });
  return { stop, bus, busDoor: [(o.busX ?? 2) + 3.9, 2.0, PI], porch: (i = 0) => porches[i % porches.length], walk: 0.14 };
}
